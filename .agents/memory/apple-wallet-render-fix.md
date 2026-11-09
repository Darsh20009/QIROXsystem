---
name: Apple Wallet Render fix
description: Why Apple Wallet crashed on Render with "ve is not a function" and how it was fixed.
---

# Apple Wallet — Render CJS Bundle Crash

## The Problem
`GET /api/employee/apple-wallet-pass` returned 500 on Render with `TypeError: ve is not a function`.  
`ve` was the minified name of `sharp`'s internal native-binding call.

`sharp` was **not in ALWAYS_EXTERNAL** in `script/build.mjs`, so esbuild tried to bundle its JS internals into `dist/index.cjs`. The native `.node` binary can never be bundled; when called at runtime on Render the binding lookup failed → "not a function".

## The Fix
Add `"sharp"` to the `ALWAYS_EXTERNAL` array in `script/build.mjs`:

```js
const ALWAYS_EXTERNAL = [
  ...
  "sharp",   // native binary — cannot be bundled into CJS; leave as require()
];
```

esbuild now leaves `import("sharp")` as `require("sharp")` in the CJS output, which resolves correctly to Render's node_modules at runtime.

**Why:** Any npm package that ships a native `.node` addon (sharp, canvas, bcrypt, etc.) MUST be in ALWAYS_EXTERNAL or it crashes on Render even though it works fine locally (local dev uses `tsx` directly, never the CJS bundle).

**How to apply:** Whenever a new native-addon package is added, immediately add it to ALWAYS_EXTERNAL in `script/build.mjs`. Do NOT rely on local dev to catch this — it will only fail on Render.
