# Pre-Post TODO

## Dogfooding Issues (found 2026-02-11)

### Auth-protected deployments (Vercel)
- Vercel preview/production URLs return **401** when "Vercel Authentication" is enabled
- `pre-post compare --before-base <vercel-url>` silently captures a login page instead of the actual site
- **Fix ideas:**
  - [ ] Detect 401/403 on before-base URL and warn clearly before capturing
  - [ ] Support `--cookie` or `--header` flag to pass auth tokens
  - [ ] Support Vercel's `_vercel_jwt` cookie for bypassing deployment protection
  - [ ] Document workaround: disable Vercel Auth on production, or use a custom domain

### Route detection misses new files
- `npx pre-post detect` only found `next-env.d.ts` when the real changes were new component files (`iterative-hero.tsx`, `terminal.tsx`, etc.)
- New files (untracked → staged) don't map to routes in the current detection logic
- **Fix ideas:**
  - [ ] Also scan for new files that import into route-level components (e.g. page.tsx imports)
  - [ ] Follow import chains: if `page.tsx` imports `iterative-hero.tsx` and that file is new, flag `/` as changed
  - [ ] Fallback: if no routes detected, suggest capturing `/` by default

### Skill name mismatch
- Skill installed as `before-after` (symlink name) but user expects `/pre-post`
- Claude Code's Skill tool didn't recognize it
- [ ] Rename skill symlink to `pre-post` or register both aliases

## Site / Hero

- [ ] Mobile layout check — stacked or scaled workspace view
- [ ] Consider reduced-motion: skip animations, show static workspace + PR side by side
