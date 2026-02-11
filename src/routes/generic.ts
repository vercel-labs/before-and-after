/**
 * Generic route detection for non-Next.js frameworks.
 * Handles common patterns from Remix, SolidStart, SvelteKit, etc.
 */

import { DetectedRoute } from '../types.js';

/** Files that should be skipped (no visual output) */
const SKIP_PATTERNS = [
  /\.(test|spec)\.(ts|tsx|js|jsx)$/,
  /^__tests__\//,
  /^(package|tsconfig|vite\.config|vitest\.config)\./,
  /^\.env/,
  /^pnpm-lock\.yaml$/,
  /^yarn\.lock$/,
  /^package-lock\.json$/,
];

/** Global style files */
const GLOBAL_STYLE_PATTERNS = [
  /globals?\.css$/,
  /global\.(scss|less)$/,
  /tailwind\.config\./,
  /postcss\.config\./,
  /theme\.(ts|js|css)$/,
];

/**
 * Detect routes from changed files using generic heuristics.
 * Works as a fallback when framework is unknown.
 */
export function detectGenericRoutes(files: string[]): DetectedRoute[] {
  const routes: DetectedRoute[] = [];

  for (const file of files) {
    if (SKIP_PATTERNS.some(p => p.test(file))) continue;

    // Global styles
    if (GLOBAL_STYLE_PATTERNS.some(p => p.test(file))) {
      routes.push({
        path: '/',
        sourceFile: file,
        confidence: 'low',
        reason: 'Global style file affects all pages',
      });
      continue;
    }

    // Remix-style: src/routes/*.tsx or routes/*.tsx
    const remixMatch = file.match(/^(?:src\/)?routes\/(.+)\.(tsx|ts|jsx|js)$/);
    if (remixMatch) {
      const routePath = remixRouteToPath(remixMatch[1]);
      routes.push({
        path: routePath,
        sourceFile: file,
        confidence: 'high',
        reason: 'Route file change',
      });
      continue;
    }

    // SvelteKit: src/routes/**/+page.svelte
    const svelteMatch = file.match(/^src\/routes\/(.+\/)?(\+page)\.(svelte|ts|js)$/);
    if (svelteMatch) {
      const dir = (svelteMatch[1] || '').replace(/\/$/, '');
      routes.push({
        path: dir ? '/' + dir : '/',
        sourceFile: file,
        confidence: 'high',
        reason: 'SvelteKit page file change',
      });
      continue;
    }

    // Generic pages directory: src/pages/*.tsx
    const pagesMatch = file.match(/^src\/pages\/(.+)\.(tsx|ts|jsx|js)$/);
    if (pagesMatch) {
      const name = pagesMatch[1];
      const routePath = name === 'index' ? '/' : '/' + name.replace(/\/index$/, '');
      routes.push({
        path: routePath,
        sourceFile: file,
        confidence: 'medium',
        reason: 'Page file change',
      });
      continue;
    }

    // Component files in src/components — low confidence, can't map to route
    const componentMatch = file.match(/^src\/components?\/.+\.(tsx|ts|jsx|js|svelte|vue)$/);
    if (componentMatch) {
      routes.push({
        path: '/',
        sourceFile: file,
        confidence: 'low',
        reason: 'Shared component change — may affect any page',
      });
      continue;
    }
  }

  return routes;
}

/**
 * Convert a Remix-style route filename to a URL path.
 * Handles dot-delimiters for nested routes and $ for dynamic segments.
 */
function remixRouteToPath(filename: string): string {
  // Remove _index suffix
  if (filename === '_index' || filename === 'index') return '/';

  return '/' + filename
    .replace(/\._index$/, '')  // trailing _index
    .replace(/\./g, '/')       // dots to slashes
    .replace(/\$/g, ':');      // $ params to :params
}
