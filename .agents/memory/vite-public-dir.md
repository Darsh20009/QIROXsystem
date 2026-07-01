---
name: Vite public directory
description: Static files served by Vite must be in client/public/, not the root public/ directory.
---

# Vite Public Directory — Critical Gotcha

Vite's `root` is set to `client/` (see `vite.config.ts` line 16: `root: path.resolve(import.meta.dirname, "client")`), so its `publicDir` defaults to `client/public/`.

**Why this matters:** Any static file referenced as an absolute path (e.g. `/qirox-logo-full.png`) must exist in `client/public/`, NOT in the root-level `public/` directory. Files only in root `public/` will return HTML (the SPA catch-all) instead of the actual file — causing broken images with no obvious error.

**Symptom:** Image `src="/some-file.png"` returns `Content-Type: text/html` (200 OK but wrong content). Browser shows alt text + broken image icon.

**Diagnosis:** `curl http://localhost:5000/some-file.png` returns `text/html` instead of `image/png`.

**Fix:** Copy the file to `client/public/` so Vite can serve it.

**How to apply:** Whenever adding new static assets (images, fonts, videos, etc.) that will be referenced with absolute paths in the frontend, always place them in `client/public/`. The root `public/` is only used by the Express production static server (server/static.ts) which looks at `dist/public` after build.

**Why two public dirs exist:** The root `public/` was the original location; Vite was later configured with `root: "client"` moving the effective publicDir. Both dirs coexist but only `client/public/` is served in dev mode.
