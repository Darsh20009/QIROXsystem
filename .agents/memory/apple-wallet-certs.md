---
name: Apple Wallet certs
description: Where Apple Wallet pass certificates are stored and how the server loads them.
---

## Rule
Certificates live in `server/certs/` (gitignored-safe, already in the repl):
- `server/certs/apple-pass-cert.pem` — Pass Type certificate (pass.com.qirox.employee)
- `server/certs/apple-pass-key.pem` — Private key for signing passes
- `server/certs/apple-wwdr.pem` — Apple Worldwide Developer Relations root cert

The route `GET /api/employee/apple-wallet-pass` in `server/routes.ts` reads certs via `readCert(envKey, fileName)`:
- First checks `process.env[envKey]` (env var override)
- Falls back to reading the file from `server/certs/<fileName>`

**Static values (set as env vars):**
- `APPLE_TEAM_ID` = `V4K6RM59LS`
- `APPLE_PASS_TYPE_ID` = `pass.com.qirox.employee`

**Package:** `passkit-generator` is installed and required for `.pkpass` generation.

**Why:** The certs are uploaded as files because storing multi-line PEM content as env var values is error-prone. The file fallback means no env config is needed for cert content; only TEAM_ID and PASS_TYPE_ID are env vars.
