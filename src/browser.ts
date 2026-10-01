/**
 * Browser automation via agent-browser CLI.
 * Requires agent-browser to be installed globally.
 */

import { execFileSync } from 'child_process';
import { ViewportSize } from './types.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

function exec(...args: string[]): string {
  try {
    return execFileSync('agent-browser', args, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const err = error as { stderr?: string; message?: string };
    throw new Error(err.stderr || err.message || 'Command failed');
  }
}

function assertString(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError(`${name} must be a string`);
  }
}

export interface ScreenshotOptions {
  viewport: ViewportSize;
  fullPage?: boolean;
  selector?: string;
}

/**
 * Capture a screenshot using agent-browser CLI.
 * Returns the screenshot as a Buffer.
 */
export async function captureScreenshot(
  url: string,
  options: ScreenshotOptions
): Promise<Buffer> {
  assertString(url, 'URL');

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new TypeError(`Invalid URL: ${url}`);
  }

  if (!['http:', 'https:', 'file:'].includes(parsedUrl.protocol)) {
    throw new TypeError(`Unsupported URL protocol: ${parsedUrl.protocol}`);
  }

  if (options.selector !== undefined) {
    assertString(options.selector, 'Selector');
  }

  // Set viewport
  exec('set', 'viewport', String(options.viewport.width), String(options.viewport.height));

  // Navigate to URL
  exec('open', url);

  // Wait for page to settle (fonts, JS rendering)
  exec('wait', '500');

  // If selector specified, scroll it into view
  if (options.selector) {
    try {
      exec('scrollintoview', options.selector);
      exec('wait', '200');
    } catch {
      throw new Error(`Element not found: ${options.selector}`);
    }
  }

  // Take screenshot to temp file
  const tempFile = path.join(os.tmpdir(), `screenshot-${Date.now()}.png`);
  exec('screenshot', ...(options.fullPage ? ['--full'] : []), tempFile);

  // Read and return buffer
  const buffer = fs.readFileSync(tempFile);
  fs.unlinkSync(tempFile);

  return buffer;
}

/**
 * Close the browser session.
 */
export function closeBrowser(): void {
  try {
    exec('close');
  } catch {
    // Ignore errors if browser wasn't open
  }
}
