---
name: pre-post
description: Captures before/after screenshots of web pages for visual comparison in PRs. Use when user says "take before and after", "screenshot comparison", "visual diff", "PR screenshots", or after making visual UI changes.
allowed-tools:
  - Bash(npx pre-post *)
  - Bash(pre-post *)
  - Bash(*/upload-and-copy.sh *)
  - Bash(git add *)
  - Bash(git commit -m *)
  - Bash(git push origin *)
  - Bash(curl -s -o /dev/null -w *)
  - Bash(gh pr view *)
  - Bash(gh pr edit *)
  - Bash(lsof -i *)
  - Bash(mkdir -p /tmp/pre-post)
  - Bash(git diff *)
---

# Pre-Post Screenshot Skill

> **Package:** `pre-post`
> Visual diff tool for PRs — fastest path from code change to visual documentation.

## Agent Behavior Rules

**DO NOT:**
- Switch git branches, stash changes, start dev servers, or assume what "before" is
- Use `--full` unless user explicitly asks for full page / full scroll capture
- Post screenshots to PR without user approval

**DO:**
- Use `--markdown` when user wants PR integration or markdown output
- Use `--responsive` to capture both desktop and mobile viewports
- Use `--mobile` / `--tablet` if user mentions phone, mobile, tablet, responsive
- Assume current state is **After** (localhost = after, production = before)
- Show screenshots to user before posting to PR
- If user provides only one URL, **ASK**: "What URL should I use for the 'before' state? (production URL, preview deployment, or another local port)"

## Execution Order

### 1. Pre-flight Checks

```bash
# Detect running dev server
lsof -i :3000 2>/dev/null || lsof -i :3001 2>/dev/null || lsof -i :5173 2>/dev/null || lsof -i :8080 2>/dev/null
```

If no dev server is running, tell the user to start one.

```bash
# Check production URL is accessible
curl -s -o /dev/null -w "%{http_code}" "<production-url>"
```

- **200** → proceed
- **401/403** → warn user: "Production URL requires authentication. Options: (1) provide a public URL, (2) skip 'before' and capture after-only, (3) provide auth cookies"
- **No production URL** → "after-only" mode: screenshot localhost only, label as current state

### 2. Route Detection + Refinement

```bash
# Detect affected routes from git diff
npx pre-post detect
```

This outputs JSON with detected routes, confidence levels, and source files.

**Claude's role:** Review the JSON output using conversation context:
- Add routes you know are affected from the work done in this session
- Remove false positives (e.g., API-only changes)
- For dynamic routes (e.g., `/blog/[slug]`), ask user for a sample value
- Present to user: "I'll screenshot these routes: `/dashboard`, `/settings`. Want to add or change any?"

### 3. Screenshot Capture

**Option A: CLI (preferred — deterministic)**

```bash
# Single route, desktop only
npx pre-post compare \
  --before-base https://prod.com \
  --after-base http://localhost:3000 \
  --routes /dashboard \
  --output /tmp/pre-post

# Multiple routes, responsive (desktop + mobile)
npx pre-post compare \
  --before-base https://prod.com \
  --after-base http://localhost:3000 \
  --routes /dashboard,/settings,/ \
  --responsive \
  --output /tmp/pre-post
```

**Option B: Playwright MCP (for more control)**

Use when you need custom waits, interactions, or complex page states:

```
browser_resize(1280, 800)
browser_navigate("https://prod.com/dashboard")
browser_wait_for(time: 3)
browser_take_screenshot(filename: "/tmp/pre-post/dashboard-desktop-before.png")

browser_navigate("http://localhost:3000/dashboard")
browser_wait_for(time: 3)
browser_take_screenshot(filename: "/tmp/pre-post/dashboard-desktop-after.png")

# Mobile
browser_resize(375, 812)
browser_navigate("https://prod.com/dashboard")
browser_wait_for(time: 3)
browser_take_screenshot(filename: "/tmp/pre-post/dashboard-mobile-before.png")

browser_navigate("http://localhost:3000/dashboard")
browser_wait_for(time: 3)
browser_take_screenshot(filename: "/tmp/pre-post/dashboard-mobile-after.png")
```

### 4. User Approval

Show screenshots in conversation. Ask: "Here are the before/after screenshots. Should I post to PR, retake any, or add more pages?"

### 5. Upload + PR Markdown

```bash
# Upload and generate markdown
mkdir -p /tmp/pre-post
./scripts/upload-and-copy.sh /tmp/pre-post/before.png /tmp/pre-post/after.png --markdown
```

Or use the CLI's built-in upload:

```bash
npx pre-post <before.png> <after.png> --markdown
```

For multi-route PRs, generate this format:

```markdown
## Visual Changes

### `/dashboard`

<details open>
<summary>Desktop (1280x800)</summary>

| Pre | Post |
|:---:|:----:|
| ![Pre](url) | ![Post](url) |
</details>

<details>
<summary>Mobile (375x812)</summary>

| Pre | Post |
|:---:|:----:|
| ![Pre](url) | ![Post](url) |
</details>

---
*Captured by [pre-post](https://github.com/juangadm/pre-post)*
```

### 6. PR Integration

```bash
# Get current PR
gh pr view --json number,body

# Append screenshots to PR body
gh pr edit <number> --body "<existing-body>

<generated-markdown>"
```

If no `gh` CLI: output markdown and tell user to paste manually.

## Quick Reference

```bash
# Basic usage (two URLs)
pre-post site.com localhost:3000

# Detect routes from git diff
pre-post detect
pre-post detect --framework nextjs-app

# Compare with auto-detected routes
pre-post run --before-base https://prod.com --after-base http://localhost:3000

# Compare specific routes
pre-post compare --before-base URL --after-base URL --routes /dashboard,/settings

# Responsive (desktop + mobile)
pre-post compare --before-base URL --after-base URL --responsive

# From existing images
pre-post before.png after.png --markdown

# Via npx
npx pre-post detect
npx pre-post compare --before-base URL --after-base URL
```

| Flag | Description |
|------|-------------|
| `-m, --mobile` | Mobile viewport (375x812) |
| `-t, --tablet` | Tablet viewport (768x1024) |
| `--size <WxH>` | Custom viewport |
| `-f, --full` | Full scrollable page |
| `-s, --selector` | CSS selector to capture |
| `-r, --responsive` | Desktop + mobile capture |
| `--routes <paths>` | Explicit route list (comma-separated) |
| `--max-routes <n>` | Max detected routes (default: 5) |
| `--framework <name>` | Force framework detection |
| `--before-base <url>` | Production URL |
| `--after-base <url>` | Localhost URL |
| `-o, --output` | Output directory (default: ~/Downloads) |
| `--markdown` | Upload images & output markdown |
| `--upload-url <url>` | Upload endpoint (overrides git-native default) |

## Image Upload

Screenshots are committed to `.pre-post/` on the current PR branch and served via `raw.githubusercontent.com`. This is the default — no external services needed.

```bash
# Default (git-native — commits to PR branch)
./scripts/upload-and-copy.sh before.png after.png --markdown

# Fallback: 0x0.st (no signup needed, 365-day expiry)
IMAGE_ADAPTER=0x0st ./scripts/upload-and-copy.sh before.png after.png --markdown

# GitHub Gist
IMAGE_ADAPTER=gist ./scripts/upload-and-copy.sh before.png after.png --markdown
```

## Error Reference

| Error | Fix |
|-------|-----|
| `command not found` | `npm install -g pre-post` |
| `browserType.launch: Executable doesn't exist` | `npx playwright install chromium` |
| 401/403 on production URL | See pre-flight section above |
| Element not found | Verify selector exists on page |
| No changed files detected | Specify routes manually with `--routes` |
