---
name: QIROX environment setup quirks
description: What a freshly imported/cloned QIROX repl needs before it can run or be verified, and a tsc limitation in this environment.
---

# QIROX environment setup

- A freshly imported repl has empty `node_modules` in **both** the main app root and `artifacts/mockup-sandbox` — run `npm install` in each separately; they're independent package.json projects.
- `MONGODB_URI` is required to boot (`server/db.ts` throws without it) and is not preset on import — request it via `requestSecrets` before attempting to run/verify anything.
- The app serves a pre-built frontend from `dist/public` in dev (see `vite-sigbus-crash.md`) — after any client-side change (new route, new page, edited component), you must run `./node_modules/.bin/vite build` (or the full `npm run build`) and restart the `Start application` workflow, or the change will not appear in the preview at all.
- `tsc --noEmit` on the full project reliably OOMs in this environment (tried up to `--max-old-space-size=6144`) — this is a pre-existing size/environment constraint, not a sign your change broke something. To sanity-check new/changed server files instead: `npx tsx --eval "import('./path/to/module.ts').then(...)"` to confirm it loads, and rely on the production `vite build` (which does perform type-stripping/compilation of every client file) to catch syntax errors on the client side.
