# Sanitized restaurant application templates

These checked-in template trees retain the supplied original React, Express, Mongoose and shared-schema source:

- `cluny/` — `CLUNY-CAFE-main`
- `blackrose/` — `blackrose-cafe-main`
- `tasali/` — `tasali-main`
- `chef-palace/` — `chef_palace-main`

The builder copies the selected tracked tree; generation does not access or extract user archives. The archives' Git histories, databases, seeds, local configuration, environment files, certificates/keys, uploads, build outputs, dependencies, customer photos/logos/product images, mobile builds, Apple metadata, macOS sidecars and nested projects are excluded. Referenced images are neutral tiny placeholders; the generated tenant logo and metadata are rebuilt for its configured business.

`runtime/customize-tenant.mjs` adapts the original brand object and plan definitions at build time. `runtime/saas-bootstrap.ts` provisions the chosen tier, initial tenant, business details, and a single owner account on a dedicated new customer database. `server/saas-policy.ts` enforces the tier server-side for protected API families; UI feature visibility alone is not the entitlement check.

Never put secrets or a populated business configuration in this tracked directory. Generated projects require deployment environment values for their dedicated `MONGODB_URI`, `TENANT_ID`, purchased `PROJECT_PLAN_TIER`, `SESSION_SECRET`, `BOOTSTRAP_ADMIN_PASSWORD_HASH`, and `BUSINESS_CONFIG_JSON`. `BOOTSTRAP_ADMIN_PASSWORD` is an optional 16-character fallback for first-time owner creation only; existing owner credentials are never reset.