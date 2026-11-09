---
name: Vite SIGBUS crash in dev mode
description: Vite dev server crashes with SIGBUS when embedded in Express process; serve pre-built dist/public instead.
---

## Rule
When a pre-built `dist/public/index.html` exists, serve it statically in development instead of launching the in-process Vite dev server.

**Why:** On this Replit deployment, running `createViteServer()` from inside the Express process crashes with SIGBUS (signal 7) — a memory-mapped-file fault during esbuild compilation. This crashes the entire Node.js process, killing the API server. The built files in `dist/public/` are a stable alternative.

**How to apply:**
In `server/index.ts`, the startup code checks `existsSync(path.join(distPublicPath, "index.html"))` and, if true, uses `express.static(distPublicPath)` instead of `await setupVite(httpServer, app)`. If `dist/public` is absent, it falls back to Vite as normal.

**Additional notes:**
- `dist/public` is ~55 MB with 197 asset files — committed as a build artifact in this repo.
- `process.exit(1)` in `server/vite.ts` custom error logger was removed so Vite errors don't kill the API.
- `npm run dev` now passes `--max-old-space-size=4096` (precautionary).
- To re-enable Vite HMR in dev: delete `dist/public/` and restart.
