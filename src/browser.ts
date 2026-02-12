/**
 * Browser automation via Playwright.
 * Launches headless Chromium for screenshot capture.
 */

import { chromium, Browser, Page } from 'playwright';
import { ViewportSize } from './types.js';
import fs from 'fs';

let browser: Browser | null = null;
let page: Page | null = null;

export interface ScreenshotOptions {
  viewport: ViewportSize;
  fullPage?: boolean;
  selector?: string;
}

/**
 * Get or create a Playwright page with the given viewport.
 * Reuses the browser instance across calls for performance.
 */
async function getPage(viewport: ViewportSize): Promise<Page> {
  if (!browser) {
    try {
      browser = await chromium.launch({ headless: true, channel: 'chrome' });
    } catch {
      browser = await chromium.launch({ headless: true });
    }
  }
  if (!page) {
    page = await browser.newPage({
      viewport,
      deviceScaleFactor: 2,
    });
  } else {
    await page.setViewportSize(viewport);
  }
  return page;
}

/**
 * Capture a screenshot using Playwright.
 * Returns the screenshot as a Buffer.
 */
export async function captureScreenshot(
  url: string,
  options: ScreenshotOptions
): Promise<Buffer> {
  const pg = await getPage(options.viewport);

  // Disable animations and transitions for consistent captures
  await pg.addStyleTag({
    content: '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
  });

  await pg.goto(url, { waitUntil: 'networkidle' });

  // Wait for web fonts to finish loading
  await pg.evaluate(() => document.fonts.ready);

  // If selector specified, scroll it into view
  if (options.selector) {
    const locator = pg.locator(options.selector);
    const count = await locator.count();
    if (count === 0) {
      throw new Error(`Element not found: ${options.selector}`);
    }
    await locator.first().scrollIntoViewIfNeeded();
    await pg.waitForTimeout(200);
  }

  const screenshot = await pg.screenshot({ fullPage: options.fullPage ?? false });
  return Buffer.from(screenshot);
}

/**
 * Close the browser session and clean up resources.
 */
export async function closeBrowser(): Promise<void> {
  if (page) {
    await page.close();
    page = null;
  }
  if (browser) {
    await browser.close();
    browser = null;
  }
}

/**
 * Read a pre-captured screenshot from disk.
 * Used in MCP mode where Playwright MCP saves files directly.
 */
export function readScreenshot(filepath: string): Buffer {
  if (!fs.existsSync(filepath)) {
    throw new Error(`Screenshot not found: ${filepath}`);
  }
  return fs.readFileSync(filepath);
}
