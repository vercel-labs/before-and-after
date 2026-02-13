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
const FRAMEWORK_SCAN_DEPTH = 2;
const SKIP_SCAN_DIRS = new Set([
  '.git',
  '.next',
  '.turbo',
  'node_modules',
  'dist',
  'build',
  'coverage',
]);

/**
 * Get changed files from git diff.
 * Returns paths relative to the repo root.
 */
export function getChangedFiles(diffTarget?: string, cwd = process.cwd()): string[] {
  const target = diffTarget || 'HEAD';
  const files = new Set<string>();

  runGitNameOnly(`diff --name-only ${target}`, cwd).forEach((file) => files.add(file));
  runGitNameOnly('diff --name-only --cached', cwd).forEach((file) => files.add(file));
  runGitNameOnly('diff --name-only', cwd).forEach((file) => files.add(file));
  runGitNameOnly('ls-files --others --exclude-standard', cwd).forEach((file) => files.add(file));

  return Array.from(files);
}

/**
 * Auto-detect the framework used in the project.
 */
export function detectFramework(rootDir?: string): Framework {
  const dir = rootDir || process.cwd();
  const candidateRoots = collectCandidateRoots(dir, FRAMEWORK_SCAN_DEPTH);

  for (const root of candidateRoots) {
    if (hasNextAppRouter(root)) return 'nextjs-app';
  }

  for (const root of candidateRoots) {
    if (hasNextPagesRouter(root)) return 'nextjs-pages';
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

function runGitNameOnly(command: string, cwd: string): string[] {
  try {
    const output = execSync(`git ${command}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd,
    }).trim();
    return output ? output.split('\n').filter(Boolean) : [];
  } catch {
    return [];
  }
}

function collectCandidateRoots(baseDir: string, maxDepth: number): string[] {
  const roots = [baseDir];

  function walk(dir: string, depth: number): void {
    if (depth === 0) return;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (SKIP_SCAN_DIRS.has(entry.name)) continue;

      const child = path.join(dir, entry.name);
      roots.push(child);
      walk(child, depth - 1);
    }
  }

  walk(baseDir, maxDepth);
  return roots;
}

function hasNextAppRouter(rootDir: string): boolean {
  const appDir = path.join(rootDir, 'app');
  if (!fs.existsSync(appDir)) return false;

  return hasAnyFile(appDir, [
    'page.tsx',
    'page.ts',
    'page.jsx',
    'page.js',
    'layout.tsx',
    'layout.ts',
    'layout.jsx',
    'layout.js',
  ]);
}

function hasNextPagesRouter(rootDir: string): boolean {
  const pagesDir = path.join(rootDir, 'pages');
  if (!fs.existsSync(pagesDir)) return false;

  return hasAnyFile(pagesDir, [
    'index.tsx',
    'index.ts',
    'index.jsx',
    'index.js',
    '_app.tsx',
    '_app.ts',
    '_app.jsx',
    '_app.js',
    '_document.tsx',
    '_document.ts',
    '_document.jsx',
    '_document.js',
  ]);
}

function hasAnyFile(dir: string, filenames: string[]): boolean {
  return filenames.some((filename) => fs.existsSync(path.join(dir, filename)));
}
