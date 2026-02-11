import { describe, it, expect } from 'vitest';
import path from 'path';
import { BeforeAndAfter } from '../../src/index';

const TEST_PAGES = path.resolve(__dirname, '../fixtures/pages');

// Browser tests require Playwright browsers to be installed
// Set TEST_BROWSER=true to enable
const playwrightAvailable = process.env.TEST_BROWSER === 'true';

function fileUrl(relativePath: string): string {
  return `file://${path.join(TEST_PAGES, relativePath)}`;
}

function isValidPng(buf: Buffer): boolean {
  return buf.length > 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4E &&
    buf[3] === 0x47;
}

describe('BeforeAndAfter class', () => {
  it('creates instance with default options', () => {
    const ba = new BeforeAndAfter();
    expect(ba.viewport).toEqual({ width: 1280, height: 800 });
  });

  it('creates instance with custom viewport', () => {
    const ba = new BeforeAndAfter({ viewport: 'mobile' });
    expect(ba.viewport).toEqual({ width: 375, height: 812 });
  });
});

describe('End-to-end: capture before/after workflow', () => {
  it.skipIf(!playwrightAvailable)('captures two URLs successfully', async () => {
    const ba = new BeforeAndAfter();

    const captures = await ba.captureBeforeAfter({
      before: fileUrl('css-card/before.html'),
      after: fileUrl('css-card/after.html'),
    });

    expect(captures.before.image.length).toBeGreaterThan(0);
    expect(captures.after.image.length).toBeGreaterThan(0);
    expect(isValidPng(captures.before.image)).toBe(true);
    expect(isValidPng(captures.after.image)).toBe(true);
  });

  it.skipIf(!playwrightAvailable)('captures identical pages', async () => {
    const ba = new BeforeAndAfter();

    const captures = await ba.captureBeforeAfter({
      before: fileUrl('identical/page.html'),
      after: fileUrl('identical/page.html'),
    });

    expect(isValidPng(captures.before.image)).toBe(true);
    expect(isValidPng(captures.after.image)).toBe(true);
    // Both images should be identical since same page
    expect(captures.before.image.equals(captures.after.image)).toBe(true);
  });

  it.skipIf(!playwrightAvailable)('captures specific elements with selector', async () => {
    const ba = new BeforeAndAfter();

    const captures = await ba.captureBeforeAfter({
      before: {
        url: fileUrl('css-card/before.html'),
        selector: '.card',
      },
      after: {
        url: fileUrl('css-card/after.html'),
        selector: '.card',
      },
    });

    expect(captures.before.selector).toBe('.card');
    expect(captures.after.selector).toBe('.card');
    expect(isValidPng(captures.before.image)).toBe(true);
    expect(isValidPng(captures.after.image)).toBe(true);
  });

  it.skipIf(!playwrightAvailable)('captures at different viewports', async () => {
    const ba = new BeforeAndAfter();

    const desktop = await ba.capture({
      url: fileUrl('css-card/before.html'),
      viewport: 'desktop',
    });

    const mobile = await ba.capture({
      url: fileUrl('css-card/before.html'),
      viewport: 'mobile',
    });

    expect(desktop.viewport).toEqual({ width: 1280, height: 800 });
    expect(mobile.viewport).toEqual({ width: 375, height: 812 });
    expect(isValidPng(desktop.image)).toBe(true);
    expect(isValidPng(mobile.image)).toBe(true);
  });

  it.skipIf(!playwrightAvailable)('captures full page screenshots', async () => {
    const ba = new BeforeAndAfter();

    const viewport = await ba.capture({
      url: fileUrl('responsive-layout/after.html'),
      fullPage: false,
    });

    const fullPage = await ba.capture({
      url: fileUrl('responsive-layout/after.html'),
      fullPage: true,
    });

    expect(isValidPng(viewport.image)).toBe(true);
    expect(isValidPng(fullPage.image)).toBe(true);
  });
});

describe('End-to-end: fromImages workflow', () => {
  it.skipIf(!playwrightAvailable)('generates markdown from buffer images', async () => {
    const ba = new BeforeAndAfter();

    const captures = await ba.captureBeforeAfter({
      before: fileUrl('css-card/before.html'),
      after: fileUrl('css-card/after.html'),
    });

    const result = await ba.fromImages({
      before: captures.before.image,
      after: captures.after.image,
      labels: { before: 'Old', after: 'New' },
    });

    expect(result.markdown).toContain('| Old | New |');
    expect(result.beforeImage).toEqual(captures.before.image);
    expect(result.afterImage).toEqual(captures.after.image);
  });
});
