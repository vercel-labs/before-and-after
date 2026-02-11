/**
 * Next.js route detection from changed files.
 * Supports App Router and Pages Router conventions.
 */

import { DetectedRoute } from '../types.js';

/** Files that should be skipped entirely (no visual output) */
const SKIP_PATTERNS = [
  /^app\/api\//,
  /^pages\/api\//,
  /^middleware\.(ts|js|mjs)$/,
  /^next\.config\.(ts|js|mjs)$/,
  /^next-env\.d\.ts$/,
  /\.(test|spec)\.(ts|tsx|js|jsx)$/,
  /^__tests__\//,
];

/** Global files that affect all pages — map to "/" */
const GLOBAL_PATTERNS = [
  /^(app\/)?globals?\.css$/,
  /^(app\/)?global\.(scss|less)$/,
  /^tailwind\.config\.(ts|js|mjs|cjs)$/,
  /^postcss\.config\.(ts|js|mjs|cjs)$/,
  /^(app\/)?theme\.(ts|js)$/,
];

/** Config files with no visual impact */
const CONFIG_PATTERNS = [
  /^package\.json$/,
  /^tsconfig.*\.json$/,
  /^\.eslintrc/,
  /^\.prettierrc/,
  /^pnpm-lock\.yaml$/,
  /^yarn\.lock$/,
  /^package-lock\.json$/,
];

/**
 * Detect routes from changed files in a Next.js App Router project.
 */
export function detectAppRouterRoutes(files: string[]): DetectedRoute[] {
  const routes: DetectedRoute[] = [];

  for (const file of files) {
    // Skip non-visual files
    if (SKIP_PATTERNS.some(p => p.test(file))) continue;
    if (CONFIG_PATTERNS.some(p => p.test(file))) continue;

    // Global files → "/"
    if (GLOBAL_PATTERNS.some(p => p.test(file))) {
      routes.push({
        path: '/',
        sourceFile: file,
        confidence: 'low',
        reason: 'Global style file affects all pages',
      });
      continue;
    }

    // App Router: app/**/page.tsx → route
    const pageMatch = file.match(/^app\/(.+\/)?page\.(tsx|ts|jsx|js)$/);
    if (pageMatch) {
      const routePath = buildRoutePath(pageMatch[1] || '');
      routes.push({
        path: routePath,
        sourceFile: file,
        confidence: 'high',
        reason: 'Direct page file change',
      });
      continue;
    }

    // App Router: app/**/layout.tsx → route from directory
    const layoutMatch = file.match(/^app\/(.+\/)?layout\.(tsx|ts|jsx|js)$/);
    if (layoutMatch) {
      const routePath = buildRoutePath(layoutMatch[1] || '');
      routes.push({
        path: routePath,
        sourceFile: file,
        confidence: 'medium',
        reason: 'Layout file change affects route and children',
      });
      continue;
    }

    // App Router: app/**/loading.tsx, error.tsx, not-found.tsx → route from directory
    const specialMatch = file.match(/^app\/(.+\/)?(loading|error|not-found|template)\.(tsx|ts|jsx|js)$/);
    if (specialMatch) {
      const routePath = buildRoutePath(specialMatch[1] || '');
      routes.push({
        path: routePath,
        sourceFile: file,
        confidence: 'medium',
        reason: `${specialMatch[2]} file change`,
      });
      continue;
    }

    // App Router: components/files inside app/ → infer parent route
    const appComponentMatch = file.match(/^app\/(.+\/)?(?:components?|ui|lib|hooks|utils)\/.+\.(tsx|ts|jsx|js)$/);
    if (appComponentMatch) {
      const routePath = buildRoutePath(appComponentMatch[1] || '');
      routes.push({
        path: routePath,
        sourceFile: file,
        confidence: 'medium',
        reason: 'Component in app directory — parent route may be affected',
      });
      continue;
    }

    // Any other file inside app/ that isn't caught above
    const appFileMatch = file.match(/^app\/(.+\/)?[^/]+\.(tsx|ts|jsx|js|css|scss)$/);
    if (appFileMatch) {
      const routePath = buildRoutePath(appFileMatch[1] || '');
      routes.push({
        path: routePath,
        sourceFile: file,
        confidence: 'low',
        reason: 'File in app directory — may affect route',
      });
      continue;
    }
  }

  return routes;
}

/**
 * Detect routes from changed files in a Next.js Pages Router project.
 */
export function detectPagesRouterRoutes(files: string[]): DetectedRoute[] {
  const routes: DetectedRoute[] = [];

  for (const file of files) {
    if (SKIP_PATTERNS.some(p => p.test(file))) continue;
    if (CONFIG_PATTERNS.some(p => p.test(file))) continue;

    if (GLOBAL_PATTERNS.some(p => p.test(file))) {
      routes.push({
        path: '/',
        sourceFile: file,
        confidence: 'low',
        reason: 'Global style file affects all pages',
      });
      continue;
    }

    // Pages Router: _app.tsx, _document.tsx → / (must be checked before general page match)
    const specialMatch = file.match(/^pages\/_(?:app|document)\.(tsx|ts|jsx|js)$/);
    if (specialMatch) {
      routes.push({
        path: '/',
        sourceFile: file,
        confidence: 'medium',
        reason: 'App wrapper change affects all pages',
      });
      continue;
    }

    // Pages Router: pages/index.tsx → /
    const indexMatch = file.match(/^pages\/index\.(tsx|ts|jsx|js)$/);
    if (indexMatch) {
      routes.push({
        path: '/',
        sourceFile: file,
        confidence: 'high',
        reason: 'Index page change',
      });
      continue;
    }

    // Pages Router: pages/about.tsx → /about
    const pageMatch = file.match(/^pages\/(.+)\.(tsx|ts|jsx|js)$/);
    if (pageMatch) {
      const routePath = '/' + pageMatch[1].replace(/\/index$/, '');
      routes.push({
        path: routePath,
        sourceFile: file,
        confidence: 'high',
        reason: 'Direct page file change',
      });
      continue;
    }
  }

  return routes;
}

/**
 * Build a route path from an App Router directory path.
 * Strips route groups like (marketing), preserves dynamic segments like [slug].
 */
function buildRoutePath(dirPath: string): string {
  if (!dirPath || dirPath === '/') return '/';

  const segments = dirPath
    .replace(/\/$/, '')  // Remove trailing slash
    .split('/')
    .filter(seg => {
      // Strip route groups: (marketing), (auth), etc.
      if (/^\(.+\)$/.test(seg)) return false;
      // Strip @parallel slots
      if (seg.startsWith('@')) return false;
      return seg.length > 0;
    });

  if (segments.length === 0) return '/';
  return '/' + segments.join('/');
}
