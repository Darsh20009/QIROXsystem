---
name: Apple Wallet Certs & passkit-generator Fix
description: How to correctly generate .pkpass files using passkit-generator v3 with QIROX Apple certs.
---

## Rule
Use `new PKPass(buffers, certs)` constructor — NOT `PKPass.from({ model, certs })`.

**Why:** `PKPass.from()` requires `model` to be a string path to a directory on disk. Passing a buffers object causes `"model" must be a string` ValidationError.

**How to apply:**
```typescript
const { PKPass } = await import("passkit-generator");
const pass = new PKPass(
  { "pass.json": Buffer, "icon.png": Buffer, "icon@2x.png": Buffer, "logo.png": Buffer, "logo@2x.png": Buffer },
  { wwdr, signerCert: cleanCert, signerKey: cleanKey }
  // Do NOT include signerKeyPassphrase if there's no passphrase — empty string throws ValidationError
);
const pkpassBuffer = pass.getAsBuffer(); // synchronous in v3 — no .then()
```

## Cert files
- Location: `server/certs/apple-pass-cert.pem`, `apple-pass-key.pem`, `apple-wwdr.pem`
- Cert/key files exported from Apple Keychain include a "Bag Attributes" header — strip it before passing to PKPass:
  ```typescript
  const stripBagAttrs = (pem: string) => { const i = pem.indexOf("-----BEGIN"); return i >= 0 ? pem.slice(i) : pem; };
  ```
- passTypeId = `pass.com.qirox.employee`, teamId = `V4K6RM59LS`

## icon.png requirement
Apple Wallet requires real PNG files — empty `Buffer.alloc(0)` causes signing errors.
Use a minimal 1×1 transparent PNG:
```typescript
const tinyPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
```
