/**
 * Route detection from git diff output.
 * Maps changed files to affected UI routes.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { DetectedRoute, RouteDetectionOptions } from './types.js';
import { detectAppRouterRoutes, detectPagesRouterRoutes } from './routes/nextjs.js';
import { detectGenericRoutes } from './routes/generic.js';

export type Framework = 'nextjs-app' | 'nextjs-pages' | 'generic';

/**
 * Get changed files from git diff.
 * Returns paths relative to the repo root.
 */
export function getChangedFiles(diffTarget?: string): string[] {
  const target = diffTarget || 'HEAD';
  try {
    // Try diff against target (works for committed changes)
    const output = execSync(`git diff --name-only ${target}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    if (output) return output.split('\n').filter(Boolean);

    // Fall back to staged + unstaged changes
    const staged = execSync('git diff --name-only --cached', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    const unstaged = execSync('git diff --name-only', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    const files = new Set<string>();
    if (staged) staged.split('\n').filter(Boolean).forEach(f => files.add(f));
    if (unstaged) unstaged.split('\n').filter(Boolean).forEach(f => files.add(f));
    return Array.from(files);
  } catch {
    return [];
  }
}

/**
 * Auto-detect the framework used in the project.
 */
export function detectFramework(rootDir?: string): Framework {
  const dir = rootDir || process.cwd();

  // Check for app/ directory with page.tsx files (Next.js App Router)
  const appDir = path.join(dir, 'app');
  if (fs.existsSync(appDir)) {
    const hasPageFiles = fs.existsSync(path.join(appDir, 'page.tsx')) ||
                         fs.existsSync(path.join(appDir, 'page.jsx')) ||
                         fs.existsSync(path.join(appDir, 'page.ts')) ||
                         fs.existsSync(path.join(appDir, 'page.js'));
    if (hasPageFiles) return 'nextjs-app';

    // Also check for layout.tsx (another strong App Router signal)
    const hasLayout = fs.existsSync(path.join(appDir, 'layout.tsx')) ||
                      fs.existsSync(path.join(appDir, 'layout.jsx'));
    if (hasLayout) return 'nextjs-app';
  }

  // Check for pages/ directory (Next.js Pages Router)
  const pagesDir = path.join(dir, 'pages');
  if (fs.existsSync(pagesDir)) {
    const hasIndex = fs.existsSync(path.join(pagesDir, 'index.tsx')) ||
                     fs.existsSync(path.join(pagesDir, 'index.jsx')) ||
                     fs.existsSync(path.join(pagesDir, 'index.ts')) ||
                     fs.existsSync(path.join(pagesDir, 'index.js'));
    if (hasIndex) return 'nextjs-pages';
  }

  return 'generic';
}

/**
 * Detect routes affected by changed files.
 * Main entry point for route detection.
 */
export function detectRoutes(
  changedFiles: string[],
  options: RouteDetectionOptions = {},
): DetectedRoute[] {
  if (changedFiles.length === 0) return [];

  const framework = options.framework || detectFramework();

  let routes: DetectedRoute[];
  switch (framework) {
    case 'nextjs-app':
      routes = detectAppRouterRoutes(changedFiles);
      break;
    case 'nextjs-pages':
      routes = detectPagesRouterRoutes(changedFiles);
      break;
    case 'generic':
    default:
      routes = detectGenericRoutes(changedFiles);
      break;
  }

  // Deduplicate by path — keep highest confidence
  routes = deduplicateRoutes(routes);

  // Sort by confidence (high → medium → low)
  const confidenceOrder = { high: 0, medium: 1, low: 2 };
  routes.sort((a, b) => confidenceOrder[a.confidence] - confidenceOrder[b.confidence]);

  // Cap at maxRoutes
  const maxRoutes = options.maxRoutes ?? 5;
  if (routes.length > maxRoutes) {
    const originalCount = routes.length;
    routes = routes.slice(0, maxRoutes);
    // Add a note about truncation by keeping only the top N
    console.warn(`Detected ${originalCount} routes, capping at ${maxRoutes}. Use --max-routes to increase.`);
  }

  return routes;
}

/**
 * Deduplicate routes by path, keeping the highest confidence entry.
 */
function deduplicateRoutes(routes: DetectedRoute[]): DetectedRoute[] {
  const byPath = new Map<string, DetectedRoute>();
  const confidenceOrder = { high: 0, medium: 1, low: 2 };

  for (const route of routes) {
    const existing = byPath.get(route.path);
    if (!existing || confidenceOrder[route.confidence] < confidenceOrder[existing.confidence]) {
      byPath.set(route.path, route);
    }
  }

  return Array.from(byPath.values());
}
