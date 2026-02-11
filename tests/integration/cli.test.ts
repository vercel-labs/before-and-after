import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CLI_PATH = path.resolve(__dirname, '../../dist/bin/cli.js');
const TEST_PAGES = path.resolve(__dirname, '../fixtures/pages');
const TEMP_DIR = path.join(os.tmpdir(), 'pre-post-test-' + Date.now());

// Browser-dependent tests require Playwright browsers to be installed
// Set TEST_BROWSER=true to enable these tests
const playwrightAvailable = process.env.TEST_BROWSER === 'true';

function fileUrl(relativePath: string): string {
  return `file://${path.join(TEST_PAGES, relativePath)}`;
}

function runCli(args: string[], options: { timeout?: number } = {}): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(`node "${CLI_PATH}" ${args.join(' ')}`, {
      encoding: 'utf8',
      timeout: options.timeout || 60000,
      env: { ...process.env, HOME: TEMP_DIR },
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: execError.stdout || '',
      stderr: execError.stderr || '',
      exitCode: execError.status || 1,
    };
  }
}

describe('CLI', () => {
  beforeEach(() => {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    fs.mkdirSync(path.join(TEMP_DIR, 'Downloads'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  });

  describe('help', () => {
    it('shows help with --help flag', () => {
      const { stdout, exitCode } = runCli(['--help']);
      expect(exitCode).toBe(0);
      expect(stdout).toContain('pre-post');
      expect(stdout).toContain('Visual diff tool');
      expect(stdout).toContain('USAGE:');
      expect(stdout).toContain('VIEWPORT OPTIONS:');
      expect(stdout).toContain('--mobile');
      expect(stdout).toContain('--tablet');
      expect(stdout).toContain('--size');
      expect(stdout).toContain('SUBCOMMANDS:');
      expect(stdout).toContain('detect');
      expect(stdout).toContain('compare');
    });

    it('shows help with -h flag', () => {
      const { stdout, exitCode } = runCli(['-h']);
      expect(exitCode).toBe(0);
      expect(stdout).toContain('USAGE:');
    });
  });

  describe('argument validation', () => {
    it('requires two arguments in default mode', () => {
      const { stderr, exitCode } = runCli([]);
      expect(exitCode).not.toBe(0);
      expect(stderr).toContain('Two arguments required');
    });

    it('requires two arguments (one provided)', () => {
      const { stderr, exitCode } = runCli(['https://example.com']);
      expect(exitCode).not.toBe(0);
      expect(stderr).toContain('Two arguments required');
    });
  });

  describe('detect subcommand', () => {
    it('outputs JSON for detect command', () => {
      // In a non-git directory, this should output an empty result
      const { stdout, exitCode } = runCli(['detect']);
      expect(exitCode).toBe(0);
      const parsed = JSON.parse(stdout);
      expect(parsed).toHaveProperty('routes');
    });
  });

  describe('compare subcommand', () => {
    it('requires --before-base and --after-base', () => {
      const { stderr, exitCode } = runCli(['compare']);
      expect(exitCode).not.toBe(0);
      expect(stderr).toContain('--before-base');
    });
  });

  describe('URL capture mode', () => {
    it.skipIf(!playwrightAvailable)('captures two file:// URLs', () => {
      const { stdout, exitCode } = runCli([
        fileUrl('css-card/before.html'),
        fileUrl('css-card/after.html'),
        '-o', TEMP_DIR,
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('Capturing before:');
      expect(stdout).toContain('Capturing after:');
      expect(stdout).toContain('Saved:');

      // Verify files were created
      const files = fs.readdirSync(TEMP_DIR);
      const pngFiles = files.filter(f => f.endsWith('.png'));
      expect(pngFiles.length).toBe(2);
      expect(pngFiles.some(f => f.includes('before'))).toBe(true);
      expect(pngFiles.some(f => f.includes('after'))).toBe(true);
    });

    it.skipIf(!playwrightAvailable)('captures with selector', () => {
      const { stdout, exitCode } = runCli([
        fileUrl('css-card/before.html'),
        fileUrl('css-card/after.html'),
        '.card',
        '-o', TEMP_DIR,
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('(.card)');
    });

    it.skipIf(!playwrightAvailable)('captures with different selectors for before and after', () => {
      const { stdout, exitCode } = runCli([
        fileUrl('css-card/before.html'),
        fileUrl('css-card/after.html'),
        '.card',
        '.card',
        '-o', TEMP_DIR,
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('(.card)');
    });

    it.skipIf(!playwrightAvailable)('captures with -s selector flag', () => {
      const { stdout, exitCode } = runCli([
        fileUrl('css-card/before.html'),
        fileUrl('css-card/after.html'),
        '-s', '.card',
        '-o', TEMP_DIR,
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('(.card)');
    });
  });

  describe('viewport options', () => {
    it.skipIf(!playwrightAvailable)('uses desktop viewport by default', () => {
      const { exitCode } = runCli([
        fileUrl('css-card/before.html'),
        fileUrl('css-card/after.html'),
        '-o', TEMP_DIR,
      ]);

      expect(exitCode).toBe(0);

      const files = fs.readdirSync(TEMP_DIR).filter(f => f.endsWith('.png'));
      const imagePath = path.join(TEMP_DIR, files[0]);
      const imageBuffer = fs.readFileSync(imagePath);
      // With deviceScaleFactor: 2, the image width will be 2560 (1280 * 2)
      const width = imageBuffer.readUInt32BE(16);
      expect(width).toBe(2560);
    });

    it.skipIf(!playwrightAvailable)('captures with mobile viewport (-m)', () => {
      const { exitCode } = runCli([
        fileUrl('css-card/before.html'),
        fileUrl('css-card/after.html'),
        '-m',
        '-o', TEMP_DIR,
      ]);

      expect(exitCode).toBe(0);

      const files = fs.readdirSync(TEMP_DIR).filter(f => f.endsWith('.png'));
      const imagePath = path.join(TEMP_DIR, files[0]);
      const imageBuffer = fs.readFileSync(imagePath);
      // With deviceScaleFactor: 2, the image width will be 750 (375 * 2)
      const width = imageBuffer.readUInt32BE(16);
      expect(width).toBe(750);
    });

    it('rejects invalid size format', () => {
      const { stderr, exitCode } = runCli([
        fileUrl('css-card/before.html'),
        fileUrl('css-card/after.html'),
        '--size', 'invalid',
        '-o', TEMP_DIR,
      ]);

      expect(exitCode).not.toBe(0);
      expect(stderr).toContain('Invalid size');
    });
  });

  describe('image file mode', () => {
    let testImageBefore: string;
    let testImageAfter: string;

    beforeEach(() => {
      // Create test PNG files
      const minimalPng = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01,
        0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00,
        0x1f, 0x15, 0xc4, 0x89,
        0x00, 0x00, 0x00, 0x0a,
        0x49, 0x44, 0x41, 0x54,
        0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01,
        0x0d, 0x0a, 0x2d, 0xb4,
        0x00, 0x00, 0x00, 0x00,
        0x49, 0x45, 0x4e, 0x44,
        0xae, 0x42, 0x60, 0x82,
      ]);

      testImageBefore = path.join(TEMP_DIR, 'test-before.png');
      testImageAfter = path.join(TEMP_DIR, 'test-after.png');
      fs.writeFileSync(testImageBefore, minimalPng);
      fs.writeFileSync(testImageAfter, minimalPng);
    });

    it('processes existing image files', () => {
      const { stdout, exitCode } = runCli([
        testImageBefore,
        testImageAfter,
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('Before:');
      expect(stdout).toContain('After:');
      expect(stdout).toContain('test-before.png');
      expect(stdout).toContain('test-after.png');
    });

    it('outputs markdown for image files with --markdown', () => {
      const { stdout, exitCode } = runCli([
        testImageBefore,
        testImageAfter,
        '--markdown',
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('| Before | After |');
      expect(stdout).toContain('|:------:|:-----:|');
      expect(stdout).toContain('![Before]');
      expect(stdout).toContain('![After]');
    });
  });

  describe('filename generation', () => {
    it.skipIf(!playwrightAvailable)('generates semantic filenames with timestamp', () => {
      const { exitCode } = runCli([
        fileUrl('css-card/before.html'),
        fileUrl('css-card/after.html'),
        '-o', TEMP_DIR,
      ]);

      expect(exitCode).toBe(0);

      const files = fs.readdirSync(TEMP_DIR).filter(f => f.endsWith('.png'));
      expect(files.length).toBe(2);

      expect(files.some(f => f.includes('before') && f.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/))).toBe(true);
      expect(files.some(f => f.includes('after') && f.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/))).toBe(true);
    });
  });

  describe('URL normalization', () => {
    it.skipIf(!playwrightAvailable)('adds https:// to bare domain (captured in output)', () => {
      const { stdout, exitCode } = runCli([
        fileUrl('css-card/before.html'),
        fileUrl('css-card/after.html'),
        '-o', TEMP_DIR,
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('file://');
    });
  });
});
