# Apple Production Credentials — Verification Report (Re-verification)

**Date:** 2026-07-11
**Scope:** Verification only, following Apple credentials being (re-)confirmed in Replit Secrets. No database, API, or behavior changes.

---

## 1. All Apple credentials load ONLY from environment variables

- `server/config/apple.ts` (`buildAppleConfig`) reads `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `APPLE_CALLBACK_URL` exclusively from `process.env` — no literal fallback values anywhere in the module.
- `server/routes.ts:393-397` (the live Passport "Sign in with Apple" strategy) reads the same four vars directly from `process.env`; `APPLE_ENABLED` is computed as `!!(clientId && teamId && keyId && privateKey)`.
- `render.yaml` / `codemagic.yaml` reference these only as external secret/env entries.

**Result: Pass.**

---

## 2. Sign in with Apple configuration is valid

- Startup log shows the strategy initialized with real values and a valid key:
  ```
  [Apple] clientID=auth.qiroxstudio.online teamID=V4K6RM59LS keyID=X2KTZG88K9
          callbackURL=https://qiroxstudio.online/api/auth/apple/callback
          keyLines=1 hasHeader=true
  ```
  `hasHeader=true` confirms the private key has a valid PEM header (real key material, single-line `\n`-escaped format as expected for env-var storage).
- `GET /api/auth/apple/status` → `{"enabled":true}`.
- The "Apple" sign-in button renders on the homepage (screenshot-confirmed).

**Result: Pass**, with one pre-existing, non-blocking inconsistency (unchanged from the prior verification pass, not something introduced now): a separate config-validation layer (`server/config/index.ts` → `validateAppleConfig`) independently checks for an `APPLE_CALLBACK_URL` env var and logs a startup error when it's absent, even though the actual Passport strategy in `routes.ts` never reads that var — it hardcodes the callback URL directly. This causes `configOk: false` in the bootstrap log, but does **not** disable the feature (`enabled:true` confirmed above) and does not affect any other module. No code was changed to address this, per "do not change application behavior."

---

## 3. No placeholder Apple values remain

- Swept for hardcoded `APPLE_TEAM_ID=`, `APPLE_KEY_ID=`, `APPLE_CLIENT_ID=` literals and `XXXXXXXXXX`-style placeholders across the repo.
- One hit, unchanged from the prior pass: `client/src/pages/AdminAppPublish.tsx:1034` — `export APPLE_TEAM_ID="XXXXXXXXXX"`, inside static template text for an **admin-facing macOS desktop-app build guide** (Electron code-signing instructions). It is display-only documentation text, never read as a credential, and unrelated to the server's Sign-In-with-Apple/Apple Pay code paths.
- No other placeholder values found in `server/`, runtime `client/src` code, `render.yaml`, or `codemagic.yaml`.

**Result: Pass** (one cosmetic, non-functional placeholder noted, not a credential-loading path).

---

## 4. No Apple private keys exist in the repository

- Full sweep for `.p8` files, `AuthKey_*` filenames, and `BEGIN PRIVATE KEY` / `BEGIN EC PRIVATE KEY` content: none found in the working tree (the one code hit is a string-literal check in `routes.ts` that inspects the *runtime env var's* content for a PEM header — not a stored key).
- `git ls-files` confirms no `.p8`, `.pem`, `.p12`, or `AuthKey_*` files are tracked (the 4 original leaked keys and 3 residual macOS metadata files from prior sprints remain removed).
- `git status` is clean — no new credential files were introduced with this round of secrets.

**Result: Pass.**

---

## 5. The application starts successfully

- Workflow restarted cleanly; no crash, no new errors beyond the pre-existing (and pre-existing-severity-adjusted) Apple config-validator note in §2.
- `GET /health/ready` → `{"status":"ready","checks":{"database":{"status":"connected","ok":true}}}`.
- All expected startup steps completed: DB connections (primary + QMeet), config bootstrap, QMeet routes, DeploymentCloud routes, EmailMarketing routes + cron jobs, admin account seed check, 27 cron jobs initialized.

**Result: Pass.**

---

## 6. Authentication and existing production functionality continue working normally

Spot-checked after the restart:

| Check | Result |
|---|---|
| `POST /api/login` with invalid credentials | `401` with the normal Arabic error message (`اسم المستخدم أو كلمة المرور غير صحيحة`) — same behavior as before, not a `500` or regression |
| `GET /api/user` (unauthenticated) | `401` — expected, unchanged |
| `GET /api/auth/google/status` | `{"enabled":false}` — unaffected by Apple changes, unchanged from before |
| `GET /api/auth/apple/status` | `{"enabled":true}` — now live |
| `GET /api/news`, `/api/jobs`, `/api/partners` (public routes) | all `200` |
| `GET /api/pricing` (public route) | `200` |
| Homepage render | Unchanged visually except the new "Apple" sign-in button; only console entry is the expected `401` on `/api/user` for a logged-out visitor |

**Result: Pass.** No regression in password login, other OAuth providers, or public content routes.

---

## Summary

| Check | Result |
|---|---|
| 1. Env-var-only credential loading | Pass |
| 2. Sign in with Apple configuration valid | Pass (feature live; unrelated validator quirk noted, not fixed) |
| 3. No placeholder Apple values | Pass (1 non-functional doc-text placeholder noted) |
| 4. No Apple private keys in repo | Pass |
| 5. App starts successfully | Pass |
| 6. Auth + existing functionality unaffected | Pass |

**No files were changed in this verification pass** — this was a read-only confirmation following the secrets update. No database, API, or behavior changes were made. Zero downtime: the only restart was the standard workflow restart used to pick up the new secret values.

Stopping here as requested.
