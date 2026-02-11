import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { readScreenshot } from '../../src/browser';

describe('readScreenshot', () => {
  it('reads an existing file and returns a Buffer', () => {
    // Create a temp file with known content
    const tempFile = path.join(os.tmpdir(), `test-screenshot-${Date.now()}.png`);
    const content = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    fs.writeFileSync(tempFile, content);

    try {
      const result = readScreenshot(tempFile);
      expect(result).toBeInstanceOf(Buffer);
      expect(result).toEqual(content);
    } finally {
      fs.unlinkSync(tempFile);
    }
  });

  it('throws an error for non-existent file', () => {
    expect(() => readScreenshot('/tmp/nonexistent-file-12345.png'))
      .toThrow('Screenshot not found');
  });
});
