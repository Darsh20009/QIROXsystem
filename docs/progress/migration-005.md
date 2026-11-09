# Migration 005 — Configuration Foundation

**Status:** Complete  
**Date:** 2026-07-09  
**Type:** Additive — no existing files modified  
**Risk:** Zero — no runtime behavior changed

---

## Objective

Create a centralized, typed configuration foundation covering every major
subsystem of the QIROX platform. This prepares the codebase for dependency
injection and eliminates scattered `process.env` reads in future migrations.

---

## Files Created

| File | Module | Purpose |
|---|---|---|
| `server/config/types.ts` | Shared types | `ConfigModule<T>`, `ConfigValidationResult`, `EnvBag`, helper utilities |
| `server/config/app.ts` | Application | Port, host, node env, app URL, CORS, trust-proxy, body limit |
| `server/config/database.ts` | Database | MongoDB URIs for primary / QMeet / system connections, pool settings |
| `server/config/mail.ts` | Mail | SMTP transport, branding (sender name, logo URL, site URL) |
| `server/config/storage.ts` | Storage | Upload directory, max file size, allowed extensions |
| `server/config/security.ts` | Security | Session secret, bcrypt rounds, rate limits, VAPID keys, CORS |
| `server/config/seo.ts` | SEO | Site name, description, canonical URL, OG image, Twitter card |
| `server/config/payments.ts` | Payments | PayPal (sandbox/live), Paymob, wallet toggle, default currency |
| `server/config/ai.ts` | AI | OpenAI / Moonshot smart-provider, models, tokens, temperature |
| `server/config/apple.ts` | Apple | Sign in with Apple OAuth, private key (PEM), App Store link |
| `server/config/google.ts` | Google | Google OAuth, Google Sheets service-account / token credentials |
| `server/config/monitoring.ts` | Monitoring | Log level, JSON/color output, health-check, perf thresholds |
| `server/config/index.ts` | Barrel export | `getAllConfigModules()` + re-exports of all modules |

---

## Configuration Contracts

Every module exposes:

```
interface ConfigModule<T> {
  moduleName: string
  defaults:   Readonly<Partial<T>>
  build(env: EnvBag): T
  validate(config: T): ConfigValidationResult
}
```

`build()` — reads from `EnvBag` (testable; no global `process.env` side effects)  
`validate()` — returns `ConfigValidationResult` with typed `ConfigIssue[]`

---

## Environment Variable Mapping

| Module | Key env vars mapped |
|---|---|
| app | `PORT`, `HOST`, `NODE_ENV`, `APP_URL`, `CORS_ORIGINS`, `TRUST_PROXY` |
| database | `MONGODB_URI`, `QMEET_MONGODB_URI`, `SYSTEM_MONGODB_URI`, pool/timeout tunables |
| mail | `CPANEL_SMTP_HOST/PORT/USER/PASS` → `SMTP_*` fallback, `SMTP2GO_*`, `EMAIL_*` |
| storage | `UPLOADS_DIR`, `SANDBOX_DIR`, `UPLOAD_MAX_BYTES`, `UPLOAD_ALLOWED_EXTS` |
| security | `SESSION_SECRET`, `BCRYPT_ROUNDS`, `RATE_LIMIT_*`, `VAPID_*`, `SANDBOX_ENC_KEY` |
| seo | `SEO_SITE_NAME`, `SEO_DESCRIPTION`, `SEO_OG_IMAGE`, `SEO_TWITTER_*`, `GOOGLE_SITE_VERIFICATION` |
| payments | `PAYPAL_CLIENT_ID/SECRET`, `PAYPAL_ENV`, `PAYMOB_*`, `WALLET_ENABLED` |
| ai | `OPENAI_API_KEY`, `OPENAI_MODEL`, `MOONSHOT_API_KEY`, `MOONSHOT_MODEL` |
| apple | `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` (\\n-escaped) |
| google | `GOOGLE_CLIENT_ID/SECRET`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SHEETS_*` |
| monitoring | `LOG_LEVEL`, `LOG_JSON`, `LOG_COLOR`, `HEALTH_*`, `PERF_SLOW_*`, `METRICS_ENABLED` |

---

## Validation Strategy

Each module's `validate(config)` performs field-level checks and returns:

```typescript
interface ConfigValidationResult {
  module:  string
  valid:   boolean           // false only when severity === "error" issues exist
  issues:  ConfigIssue[]     // { field, message, severity: "error" | "warning" }
}
```

- **Errors** — missing required credentials (SESSION_SECRET, MONGODB_URI)
- **Warnings** — missing optional features (VAPID keys, AI keys, OAuth credentials)

Validation runs only when explicitly called — no startup side effects at import time.

---

## Future Migration Strategy

### Migration 006 — DI Container Bootstrap
```typescript
// Planned usage in server/bootstrap.ts:
const modules = getAllConfigModules();
const results = modules.map(m => {
  const config = m.build(process.env);
  return m.validate(config);
});
// Abort on errors; log warnings.
```

### Migration 007+ — Gradual adoption
Each service file replaces its inline `process.env` reads with an injected
typed config object, one module at a time:
- `server/db.ts` → receives `DatabaseConfig`
- `server/email.ts` → receives `MailConfig` (replaces `getEmailCfg()`)
- `server/auth.ts` → receives `SecurityConfig`
- etc.

---

## Compatibility Strategy

- Entirely additive — zero existing files modified
- All existing `process.env.*` reads in production code remain untouched
- No config module is instantiated at import time — `build()` must be called explicitly
- `monitoring.ts` imports `parseLoglevel` from `server/logger/levels.ts` (Migration 004) — the only cross-infrastructure dependency, both are additive

---

## Rollback Strategy

Delete `server/config/` entirely — nothing imports from it yet.  
No runtime side effects, no startup hooks, no database changes.

---

## Verification

| Check | Result |
|---|---|
| No runtime behavior changed | ✅ |
| No APIs changed | ✅ |
| No database queries changed | ✅ |
| No business logic changed | ✅ |
| No production code modified | ✅ |
| Application starts successfully | ✅ All routes returning 200s/304s |

---

## Infrastructure Built So Far

| Migration | Layer | Status |
|---|---|---|
| 002 | Shared Utilities (`server/utils.ts`) | ✅ Complete |
| 003 | Error System (`server/errors/`) | ✅ Complete |
| 004 | Logging Foundation (`server/logger/`) | ✅ Complete |
| 005 | Configuration Foundation (`server/config/`) | ✅ Complete |
