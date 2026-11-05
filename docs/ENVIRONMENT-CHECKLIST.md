# QIROX Studio — Environment Validation Checklist

This checklist documents every environment variable the platform's existing
config-validation system (`server/config/*.ts`, aggregated by
`loadAllConfigs()` in `server/infrastructure/config-loader.ts`) checks on
every boot. Nothing here is new logic — this is a human-readable index of
validation that already runs automatically. Run it standalone anytime with:

```
npm run check-env
```

This prints the same pass/fail report the server itself computes at boot,
without starting Express, connecting to MongoDB, or running any other
boot-time side effect. Exit code 0 = no required config missing (warnings
are allowed); exit code 1 = at least one required value is missing/invalid.

## Already configured in this environment

- `MONGODB_URI` — primary database connection string.
- `SESSION_SECRET` — session/cookie signing secret.

## Required

| Module | Variable | Purpose |
|---|---|---|
| App | `PORT` | HTTP port (defaults to 5000 if unset) |
| App | `NODE_ENV` | `development` / `production` — gates cookie security, log format, health-check exposure |
| App | `BASE_URL` | Canonical public URL, used for callback URLs, emails, sitemaps |
| Database | `MONGODB_URI` | Primary MongoDB connection string |
| Security | `SESSION_SECRET` | Signs session cookies |
| Apple OAuth | `APPLE_CALLBACK_URL` | Currently flagged as required by the config module; see note below |

**Note on Apple OAuth:** `server/config/apple.ts` marks `APPLE_CALLBACK_URL`
as required, but `server/infrastructure/bootstrap.ts` does not currently
halt server boot when it's missing — it only logs a warning. In this
environment, Apple Sign-In is functioning via an already-configured
callback URL, so this is a soft (non-blocking) requirement in practice. See
`docs/BETA-READINESS-REPORT.md` → Known Issues for the recommended
follow-up.

## Optional (feature degrades gracefully if unset)

| Module | Variable(s) | Effect if unset |
|---|---|---|
| Security | `VAPID_*` | Push notifications disabled |
| Mail | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | Outbound email sending disabled |
| Storage | `S3_*` | Falls back to local/alternate storage path already in use |
| SEO | (various) | Falls back to sane defaults |
| Payments | `PAYPAL_*` | PayPal routes return 503 |
| Payments | `PAYMOB_*` | Paymob routes disabled |
| AI | `AI_PROVIDER`, `OPENAI_API_KEY`, `MOONSHOT_API_KEY` | AI features disabled, but AI endpoints still respond gracefully (no 500s) |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | "Sign in with Google" disabled |
| Google | Google Sheets credentials | Sheets data sync unavailable |
| Monitoring | `LOG_LEVEL` | Defaults to `INFO` (prod) / `DEBUG` (dev) |
| Monitoring | `LOG_JSON` | Defaults to JSON logs in production, text in development |
| Monitoring | `HEALTH_PUBLIC`, `INTERNAL_HEALTH_SECRET` | Controls whether `/health/detailed` is public or gated |
| Monitoring | `PERF_SLOW_REQUEST_MS`, `PERF_SLOW_QUERY_MS`, `PERF_SLOW_EXTERNAL_MS` | Performance-warning thresholds, sane defaults if unset |

## Current status in this environment (as of this Beta prep sprint)

Running `npm run check-env` here reports:
- ❌ 1 required value flagged: `APPLE_CALLBACK_URL` (non-blocking in practice — see note above; Apple Sign-In works).
- ⚠️ 6 optional warnings: VAPID keys, SMTP password, PayPal credentials, AI provider key, Google OAuth, Google Sheets — all expected for a fresh Beta environment and each degrades gracefully rather than crashing.

None of these block the server from booting or serving traffic.
