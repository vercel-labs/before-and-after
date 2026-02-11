#!/usr/bin/env node

import { parseArgs } from 'node:util';
import path from 'path';
import fs from 'fs';
import { BeforeAndAfter, generateFilename } from '../index.js';
import { ViewportConfig, VIEWPORT_PRESETS } from '../types.js';
import { closeBrowser } from '../browser.js';
import { captureScreenshot, captureResponsive } from '../capture.js';
import { uploadBeforeAfter } from '../upload.js';
import { copyToClipboard } from '../clipboard.js';
import { detectRoutes, getChangedFiles, detectFramework } from '../routes.js';

// Determine subcommand
const subcommand = process.argv[2];
const isSubcommand = ['detect', 'compare', 'run'].includes(subcommand);

if (isSubcommand) {
  // Remove subcommand from argv for parseArgs
  process.argv.splice(2, 1);
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    help: { type: 'boolean', short: 'h' },
    // Viewport presets (default: desktop)
    mobile: { type: 'boolean', short: 'm' },
    tablet: { type: 'boolean', short: 't' },
    size: { type: 'string' }, // WxH custom size
    // Capture options
    full: { type: 'boolean', short: 'f' },
    selector: { type: 'string', short: 's' },
    // Output options
    output: { type: 'string', short: 'o' },
    markdown: { type: 'boolean' },
    'upload-url': { type: 'string' },
    // New options
    responsive: { type: 'boolean', short: 'r' },
    routes: { type: 'string' },
    'max-routes': { type: 'string' },
    framework: { type: 'string' },
    'before-base': { type: 'string' },
    'after-base': { type: 'string' },
  },
});

function printHelp(): void {
  console.log(`
pre-post — Visual diff tool for PRs

USAGE:
  pre-post <before> <after> [selector] [selector2]
  pre-post detect [options]
  pre-post compare --before-base <url> --after-base <url> [options]
  pre-post run --before-base <url> --after-base <url> [options]

SUBCOMMANDS:
  detect              Detect affected routes from git diff (JSON output)
  compare             Compare before/after URLs with screenshots
  run                 Auto-detect routes + compare (detect + compare)

  Arguments can be URLs or image files (auto-detected).
  Selectors are optional - use one for both, or two for different selectors.

VIEWPORT OPTIONS:
      (default)              Desktop viewport (1280x800)
  -m, --mobile               Mobile viewport (375x812)
  -t, --tablet               Tablet viewport (768x1024)
      --size <WxH>           Custom viewport (e.g., 1920x1080)

CAPTURE OPTIONS:
  -f, --full                 Capture full scrollable page
  -s, --selector <css>       Scroll element into view before capture
  -r, --responsive           Capture at desktop + mobile viewports

ROUTE DETECTION OPTIONS:
      --routes <paths>       Explicit route list (comma-separated)
      --max-routes <n>       Max routes to detect (default: 5)
      --framework <name>     Force framework (nextjs-app, nextjs-pages, generic)

COMPARE OPTIONS:
      --before-base <url>    Base URL for "before" state (production)
      --after-base <url>     Base URL for "after" state (localhost)

OUTPUT OPTIONS:
  -o, --output <dir>         Output directory (default: ~/Downloads)
      --markdown             Upload images & output markdown table
      --upload-url <url>     Custom upload endpoint (default: 0x0.st)
                             Auto-detects: 0x0.st, blob.vercel, generic PUT

OTHER OPTIONS:
  -h, --help                 Show this help

EXAMPLES:
  # Compare two URLs (protocol optional)
  pre-post google.com facebook.com
  pre-post https://old.example.com https://new.example.com

  # Detect routes from git diff
  pre-post detect
  pre-post detect --framework nextjs-app

  # Compare with auto-detected routes
  pre-post run --before-base https://prod.com --after-base http://localhost:3000

  # Compare specific routes
  pre-post compare --before-base https://prod.com --after-base http://localhost:3000 --routes /dashboard,/settings

  # Responsive capture (desktop + mobile)
  pre-post compare --before-base url1 --after-base url2 --responsive

  # Use existing images (auto-detected)
  pre-post before.png after.png --markdown
`);
}

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff'];

function isImageFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext) && fs.existsSync(filePath);
}

function normalizeUrl(url: string): string {
  if (/^(https?|file):\/\//i.test(url)) {
    return url;
  }
  if (/^(localhost|127\.0\.0\.1)(:|\/|$)/i.test(url)) {
    return `http://${url}`;
  }
  return `https://${url}`;
}

function resolveViewportFlag(): ViewportConfig {
  if (values.mobile) return 'mobile';
  if (values.tablet) return 'tablet';
  if (values.size) {
    const match = values.size.match(/^(\d+)x(\d+)$/);
    if (match) {
      return { width: parseInt(match[1]), height: parseInt(match[2]) };
    }
    console.error(`Invalid size: ${values.size}. Use WxH format (e.g., 1920x1080).`);
    process.exit(1);
  }
  return 'desktop';
}

// ============================================================
// Subcommand: detect
// ============================================================
async function runDetect(): Promise<void> {
  const framework = values.framework as 'nextjs-app' | 'nextjs-pages' | 'generic' | undefined;
  const maxRoutes = values['max-routes'] ? parseInt(values['max-routes']) : undefined;

  const changedFiles = getChangedFiles();
  if (changedFiles.length === 0) {
    console.log(JSON.stringify({ routes: [], message: 'No changed files detected' }, null, 2));
    return;
  }

  const detectedFramework = framework || detectFramework();
  const routes = detectRoutes(changedFiles, { framework, maxRoutes });

  console.log(JSON.stringify({
    framework: detectedFramework,
    changedFiles,
    routes,
  }, null, 2));
}

// ============================================================
// Subcommand: compare
// ============================================================
async function runCompare(): Promise<void> {
  const beforeBase = values['before-base'];
  const afterBase = values['after-base'];

  if (!beforeBase || !afterBase) {
    console.error('Both --before-base and --after-base are required for compare.');
    process.exit(1);
  }

  const routeList = values.routes
    ? values.routes.split(',').map(r => r.trim())
    : ['/'];

  const responsive = values.responsive ?? false;
  const viewport = resolveViewportFlag();
  const outputDir = values.output || path.join(process.env.HOME || '~', 'Downloads');
  fs.mkdirSync(outputDir, { recursive: true });

  const timestamp = new Date();

  try {
    for (const route of routeList) {
      const beforeUrl = normalizeUrl(beforeBase.replace(/\/$/, '') + route);
      const afterUrl = normalizeUrl(afterBase.replace(/\/$/, '') + route);

      if (responsive) {
        // Capture desktop + mobile for each route
        for (const preset of ['desktop', 'mobile'] as const) {
          const vp = VIEWPORT_PRESETS[preset];

          console.log(`Capturing ${route} @ ${preset} (${vp.width}x${vp.height})...`);

          const beforeResult = await captureScreenshot({ url: beforeUrl, viewport: preset });
          const afterResult = await captureScreenshot({ url: afterUrl, viewport: preset });

          const routeSlug = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '-');
          const beforeFilename = `${routeSlug}-${preset}-before-${formatTimestamp(timestamp)}.png`;
          const afterFilename = `${routeSlug}-${preset}-after-${formatTimestamp(timestamp)}.png`;

          fs.writeFileSync(path.join(outputDir, beforeFilename), beforeResult.image);
          fs.writeFileSync(path.join(outputDir, afterFilename), afterResult.image);

          console.log(`  Saved: ${beforeFilename}, ${afterFilename}`);
        }
      } else {
        console.log(`Capturing ${route}...`);

        const beforeResult = await captureScreenshot({ url: beforeUrl, viewport, fullPage: values.full });
        const afterResult = await captureScreenshot({ url: afterUrl, viewport, fullPage: values.full });

        const routeSlug = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '-');
        const beforeFilename = `${routeSlug}-before-${formatTimestamp(timestamp)}.png`;
        const afterFilename = `${routeSlug}-after-${formatTimestamp(timestamp)}.png`;

        fs.writeFileSync(path.join(outputDir, beforeFilename), beforeResult.image);
        fs.writeFileSync(path.join(outputDir, afterFilename), afterResult.image);

        console.log(`  Saved: ${beforeFilename}, ${afterFilename}`);
      }
    }

    console.log(`\nAll screenshots saved to: ${outputDir}`);
  } finally {
    await closeBrowser();
  }
}

// ============================================================
// Subcommand: run (detect + compare)
// ============================================================
async function runFull(): Promise<void> {
  const beforeBase = values['before-base'];
  const afterBase = values['after-base'];

  if (!beforeBase || !afterBase) {
    console.error('Both --before-base and --after-base are required for run.');
    process.exit(1);
  }

  // Detect routes
  const framework = values.framework as 'nextjs-app' | 'nextjs-pages' | 'generic' | undefined;
  const maxRoutes = values['max-routes'] ? parseInt(values['max-routes']) : undefined;

  const changedFiles = getChangedFiles();
  let routeList: string[];

  if (values.routes) {
    routeList = values.routes.split(',').map(r => r.trim());
  } else if (changedFiles.length > 0) {
    const routes = detectRoutes(changedFiles, { framework, maxRoutes });
    if (routes.length === 0) {
      console.log('No visual routes detected. Defaulting to /');
      routeList = ['/'];
    } else {
      routeList = routes.map(r => r.path);
      console.log(`Detected routes: ${routeList.join(', ')}`);
    }
  } else {
    console.log('No changed files detected. Defaulting to /');
    routeList = ['/'];
  }

  // Override routes in values for compare to pick up
  values.routes = routeList.join(',');
  await runCompare();
}

// ============================================================
// Default mode (original before-and-after behavior)
// ============================================================
async function runDefault(): Promise<void> {
  if (values.help) {
    printHelp();
    return;
  }

  if (positionals.length < 2) {
    console.error('Two arguments required (URLs or image paths). Run with --help for usage.');
    process.exit(1);
  }

  const [first, second, ...rest] = positionals;
  const viewport = resolveViewportFlag();
  const ba = new BeforeAndAfter({ viewport });

  try {
    // Auto-detect image mode
    if (isImageFile(first) && isImageFile(second)) {
      const result = await ba.fromImages({
        before: first,
        after: second,
      });

      if (values.markdown) {
        console.log(result.markdown);
      } else {
        console.log(`Before: ${first}`);
        console.log(`After:  ${second}`);
      }
      return;
    }

    // URL mode
    const beforeUrl = normalizeUrl(first);
    const afterUrl = normalizeUrl(second);

    // Resolve selectors: positional args override -s flag
    let beforeSelector = values.selector;
    let afterSelector = values.selector;

    if (rest.length >= 1) {
      beforeSelector = rest[0];
      afterSelector = rest[0];
    }
    if (rest.length >= 2) {
      afterSelector = rest[1];
    }

    const outputDir = values.output || path.join(process.env.HOME || '~', 'Downloads');
    fs.mkdirSync(outputDir, { recursive: true });

    console.log(`Capturing before: ${beforeUrl}${beforeSelector ? ` (${beforeSelector})` : ''}`);
    console.log(`Capturing after:  ${afterUrl}${afterSelector ? ` (${afterSelector})` : ''}`);

    const result = await ba.captureBeforeAfter({
      before: {
        url: beforeUrl,
        selector: beforeSelector,
        fullPage: values.full,
      },
      after: {
        url: afterUrl,
        selector: afterSelector,
        fullPage: values.full,
      },
    });

    // Generate filenames
    const timestamp = new Date();
    const beforeFilename = generateFilename({
      url: beforeUrl,
      suffix: 'before',
      timestamp,
    });

    const afterFilename = generateFilename({
      url: afterUrl,
      suffix: 'after',
      timestamp,
    });

    const beforePath = path.join(outputDir, beforeFilename);
    const afterPath = path.join(outputDir, afterFilename);
    fs.writeFileSync(beforePath, result.before.image);
    fs.writeFileSync(afterPath, result.after.image);
    console.log(`\nSaved: ${beforePath}`);
    console.log(`Saved: ${afterPath}`);

    // Output markdown if requested
    if (values.markdown) {
      const uploadUrl = values['upload-url'] || process.env.UPLOAD_URL;
      console.log(`\nUploading images${uploadUrl ? ` to ${uploadUrl}` : ''}...`);

      const { beforeUrl: bUrl, afterUrl: aUrl } = await uploadBeforeAfter(
        { image: result.before.image, filename: beforeFilename },
        { image: result.after.image, filename: afterFilename },
        uploadUrl
      );

      console.log(`Before: ${bUrl}`);
      console.log(`After:  ${aUrl}`);

      const markdown = `| Before | After |
|:------:|:-----:|
| ![Before](${bUrl}) | ![After](${aUrl}) |`;

      console.log(`\n${markdown}`);

      if (copyToClipboard(markdown)) {
        console.log(`\nMarkdown copied to clipboard`);
      }
    }
  } finally {
    await closeBrowser();
  }
}

function formatTimestamp(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

// ============================================================
// Main dispatch
// ============================================================
async function main(): Promise<void> {
  if (values.help && !isSubcommand) {
    printHelp();
    return;
  }

  switch (subcommand) {
    case 'detect':
      return runDetect();
    case 'compare':
      return runCompare();
    case 'run':
      return runFull();
    default:
      return runDefault();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
