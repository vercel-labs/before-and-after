// ============================================================
// Viewport
// ============================================================

export interface ViewportSize {
  width: number;
  height: number;
}

export type ViewportPreset = 'desktop' | 'tablet' | 'mobile';

export type ViewportConfig = ViewportPreset | ViewportSize;

export const VIEWPORT_PRESETS: Record<ViewportPreset, ViewportSize> = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
};

// ============================================================
// Capture
// ============================================================

export interface CaptureOptions {
  /** URL to capture (file://, http://, https://) */
  url: string;
  /** Optional CSS selector - scrolls element into view before capture */
  selector?: string;
  /** Viewport size or preset name */
  viewport?: ViewportConfig;
  /** Capture full scrollable page instead of viewport. Default: false */
  fullPage?: boolean;
}

export interface CaptureResult {
  /** Raw PNG image data */
  image: Buffer;
  /** Viewport used for capture */
  viewport: ViewportSize;
  /** URL that was captured */
  url: string;
  /** CSS selector used, if any */
  selector?: string;
}

export interface BeforeAfterCaptureOptions {
  before: CaptureOptions | string;
  after: CaptureOptions | string;
  /** Viewport applied to both captures unless overridden individually */
  viewport?: ViewportConfig;
}

export interface BeforeAfterCaptureResult {
  before: CaptureResult;
  after: CaptureResult;
}

// ============================================================
// Image Input Mode
// ============================================================

export type ImageInput = string | Buffer;

export interface FromImagesOptions {
  /** Before image (file path or Buffer) */
  before: ImageInput;
  /** After image (file path or Buffer) */
  after: ImageInput;
  /** Labels for markdown output */
  labels?: { before?: string; after?: string };
}

export interface FromImagesResult {
  /** Markdown table for PR comments */
  markdown: string;
  /** Before image buffer */
  beforeImage: Buffer;
  /** After image buffer */
  afterImage: Buffer;
}

// ============================================================
// Main API
// ============================================================

export interface BeforeAndAfterOptions {
  /** Default viewport for all operations */
  viewport?: ViewportConfig;
  /** Output directory for saved screenshots */
  outputDir?: string;
}

// ============================================================
// Route Detection
// ============================================================

export interface DetectedRoute {
  /** Route path, e.g., "/dashboard" */
  path: string;
  /** Source file that triggered detection, e.g., "app/dashboard/page.tsx" */
  sourceFile: string;
  /** How confident is the detection */
  confidence: 'high' | 'medium' | 'low';
  /** Human-readable reason for detection */
  reason: string;
}

export interface RouteDetectionOptions {
  /** Force a specific framework instead of auto-detecting */
  framework?: 'nextjs-app' | 'nextjs-pages' | 'generic';
  /** Maximum number of routes to return (default: 5) */
  maxRoutes?: number;
  /** Git diff target, e.g., "main...HEAD" or "HEAD~1" */
  diffTarget?: string;
}

// ============================================================
// Compare Mode
// ============================================================

export interface CompareOptions {
  /** Base URL for "before" state (e.g., production URL) */
  beforeBase: string;
  /** Base URL for "after" state (e.g., localhost) */
  afterBase: string;
  /** Routes to capture */
  routes: string[];
  /** Capture at desktop + mobile viewports */
  responsive?: boolean;
  /** Viewport override (used when not in responsive mode) */
  viewport?: ViewportConfig;
  /** Output directory for screenshots */
  output?: string;
  /** Generate markdown output */
  markdown?: boolean;
}
