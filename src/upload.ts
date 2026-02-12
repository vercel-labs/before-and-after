/**
 * Image upload for generating shareable URLs.
 * Default: git-native (commits to .pre-post/ on current branch).
 * Opt-in: 0x0.st, Vercel Blob, generic PUT via --upload-url.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const DEFAULT_UPLOAD_URL = 'https://0x0.st';

/**
 * Upload an image and return a public URL.
 * Auto-detects upload method from URL pattern.
 */
export async function uploadImage(
  image: Buffer,
  filename: string,
  uploadUrl: string = DEFAULT_UPLOAD_URL
): Promise<string> {
  // 0x0.st uses multipart form upload
  if (uploadUrl.includes('0x0.st')) {
    return upload0x0st(image, filename, uploadUrl);
  }

  // Vercel Blob uses PUT with specific headers
  if (uploadUrl.includes('blob.vercel')) {
    return uploadVercelBlob(image, filename, uploadUrl);
  }

  // Generic PUT upload (common for S3-compatible services)
  return uploadGenericPut(image, filename, uploadUrl);
}

async function upload0x0st(image: Buffer, filename: string, url: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', new Blob([image]), filename);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'User-Agent': 'before-after-cli/1.0' },
    body: formData,
  });

  const result = (await response.text()).trim();
  if (!result.startsWith('http')) {
    throw new Error(`Upload failed: ${result}`);
  }
  return result;
}

async function uploadVercelBlob(image: Buffer, filename: string, url: string): Promise<string> {
  const response = await fetch(`${url}/${filename}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/png' },
    body: image,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const result = await response.json() as { url: string };
  return result.url;
}

async function uploadGenericPut(image: Buffer, filename: string, url: string): Promise<string> {
  const response = await fetch(`${url}/${filename}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/png' },
    body: image,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  // Try to parse JSON response, fall back to URL from location header or constructed URL
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const result = await response.json() as { url?: string };
    if (result.url) return result.url;
  }

  return response.headers.get('location') || `${url}/${filename}`;
}

/**
 * Write an image to .pre-post/ in the repo root, stage it, and return
 * the raw.githubusercontent.com URL it will resolve to after push.
 */
export function uploadGitNative(image: Buffer, filename: string): string {
  const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();

  // Parse owner/repo from HTTPS or SSH remote URL
  const ownerRepo = remoteUrl
    .replace(/^(https?:\/\/github\.com\/|git@github\.com:)/, '')
    .replace(/\.git$/, '');

  const destDir = path.join(repoRoot, '.pre-post');
  fs.mkdirSync(destDir, { recursive: true });

  const dest = path.join(destDir, filename);
  fs.writeFileSync(dest, image);
  execSync(`git add -f "${dest}"`);

  return `https://raw.githubusercontent.com/${ownerRepo}/${branch}/.pre-post/${filename}`;
}

/**
 * Commit and push all staged .pre-post/ screenshots in one batch.
 */
export function commitAndPushScreenshots(): void {
  execSync('git commit -m "chore: add pre/post screenshots"');
  execSync('git push origin HEAD');
}

/**
 * Upload before/after images and return URLs.
 * When uploadUrl is provided, uses the HTTP-based upload path.
 * Otherwise, uses git-native (commit to .pre-post/).
 */
export async function uploadBeforeAfter(
  before: { image: Buffer; filename: string },
  after: { image: Buffer; filename: string },
  uploadUrl?: string
): Promise<{ beforeUrl: string; afterUrl: string }> {
  // If an explicit upload URL is provided, use HTTP upload
  if (uploadUrl) {
    const [beforeUrl, afterUrl] = await Promise.all([
      uploadImage(before.image, before.filename, uploadUrl),
      uploadImage(after.image, after.filename, uploadUrl),
    ]);
    return { beforeUrl, afterUrl };
  }

  // Default: git-native — stage both, then commit+push once
  const beforeUrl = uploadGitNative(before.image, before.filename);
  const afterUrl = uploadGitNative(after.image, after.filename);
  commitAndPushScreenshots();

  return { beforeUrl, afterUrl };
}
