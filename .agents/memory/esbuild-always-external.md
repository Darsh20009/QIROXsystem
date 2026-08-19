---
name: esbuild ALWAYS_EXTERNAL + ESM-only import fix
description: How to handle ESM-only npm packages in the CJS bundle (dist/index.cjs) built by script/build.mjs — the new Function() trick and which packages need it.
---

# esbuild ALWAYS_EXTERNAL + ESM-only dynamic import fix

## The Problem

`script/build.mjs` builds the server as a single CJS bundle (`dist/index.cjs`, format: `cjs`).
When a package is listed in `ALWAYS_EXTERNAL`, esbuild leaves it as an external reference rather than bundling it.
However, esbuild **also rewrites `await import('pkg')` → `require('pkg')`** in CJS output.

If the package is ESM-only (`"type": "module"` in its package.json), `require()` fails at runtime on Render:
```
Cannot find package '/opt/render/project/src/node_modules/<pkg>/index.js'
```

## The Fix

Wrap every dynamic `import()` of an ESM-only package in `new Function`:

```typescript
// ❌ BAD — esbuild rewrites this to require() in CJS output:
const mod = await import("some-esm-package");

// ✅ GOOD — new Function() prevents static analysis; Node.js runs a real import() at runtime:
const _dyn = new Function("m", "return import(m)");
const mod = await _dyn("some-esm-package");
```

The package must still be in `ALWAYS_EXTERNAL` in `script/build.mjs` (otherwise esbuild tries to bundle it inline which also fails for ESM-only packages).

## Current ESM-only packages requiring this fix

| Package | File | Status |
|---|---|---|
| `passkit-generator` | `server/routes.ts` (Apple Wallet route) | ✅ Fixed |
| `@whiskeysockets/baileys` | `server/whatsapp-module.ts` | ✅ Fixed |
| `@huggingface/transformers` | `server/lib/local-ai/embedding-engine.ts` (×2) | ✅ Fixed |

## CJS-safe packages (no fix needed)

Verified with `require('./node_modules/X/package.json').type`:
- `@simplewebauthn/server` — `commonjs`
- `@paypal/paypal-server-sdk` — `commonjs`
- `onnxruntime-node` — `commonjs`

## How to check a new package

```bash
node -e "console.log(require('./node_modules/PKG/package.json').type)"
# "module" → ESM-only → needs new Function() fix
# "commonjs" or undefined → CJS-safe → standard import() is fine
```

## Why: background

When adding a new npm dependency that's ESM-only, it will show this error on Render but NOT in local dev (because local dev uses `tsx server/index.ts` which runs TypeScript directly, not the CJS bundle). Always test ESM-only packages by checking the deployed Render logs, not local.
