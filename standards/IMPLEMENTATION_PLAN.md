# IMPLEMENTATION_PLAN.md — QIROX Refactor Implementation Plan

> **Source of truth:** docs/EXECUTION_PLAN.md, docs/ARCHITECTURE.md, docs/SECURITY.md  
> **Format per sprint:** Objective / Files Affected / Dependencies / Testing / Rollback / Complexity  
> **Status:** Documentation only — no production code has been modified

---

## Sprint Overview

| Sprint | Name | Phase | Risk | Duration |
|---|---|---|---|---|
| S-00 | Security Hotfixes | Phase 0 | 🔴 Critical | 1 week |
| S-01 | Structured Logger | Phase 1 | 🟡 Low | 3 days |
| S-02 | Startup Validation | Phase 1 | 🟡 Low | 1 day |
| S-03 | Model Splitting | Phase 2 | 🔴 High | 2 weeks |
| S-04 | Route Splitting | Phase 3 | 🔴 High | 3 weeks |
| S-05 | Centralized Error Handler | Phase 1 | 🟢 Medium | 3 days |
| S-06 | Validation Middleware | Phase 3 | 🟡 Medium | 1 week |
| S-07 | RBAC Middleware | Phase 1 | 🟡 Medium | 1 week |
| S-08 | Database Indexes + TTL | Phase 2 | 🟢 Low | 1 week |
| S-09 | Rate Limiter Audit | Phase 3 | 🟡 Low | 3 days |
| S-10 | Frontend Loading States | Phase 4 | 🟡 Medium | 2 weeks |
| S-11 | i18n Audit | Phase 4 | 🟡 Medium | 1 week |
| S-12 | Core Web Vitals | Phase 5 | 🟡 Medium | 2 weeks |
| S-13 | Mobile Capacitor Build | Phase 6 | 🔴 High | 2 weeks |
| S-14 | Integration Tests | Phase 7 | 🟡 Medium | 2 weeks |

---

## Sprint S-00 — Security Hotfixes (MUST BE FIRST)

### Objective
Resolve all CRITICAL and HIGH security vulnerabilities identified in docs/SECURITY.md before any other work.

### Issues Addressed
- SEC-CRIT-001: Remove `SESSION_SECRET` hardcoded fallback
- SEC-CRIT-002: Replace `exec(userInput)` with `execFile()` + allowlist in sandbox
- SEC-HIGH-001: Add Zod validation to AI tool executor arguments
- SEC-HIGH-003: Add MongoDB URI whitelist enforcement

### Files Affected
```
server/auth.ts             — remove SESSION_SECRET fallback
server/routes.ts           — sandbox build command injection fix
server/ai.ts               — AI tool arg Zod validation
server/db.ts               — MongoDB URI whitelist
```

### Dependencies
- None. This sprint has no prerequisites.

### Testing
1. Verify server refuses to start without `SESSION_SECRET` env var set
2. Verify sandbox build runner rejects commands with `../` path traversal
3. Verify AI tool executor rejects args with `$` keys
4. Verify MongoDB connection manager rejects non-Atlas URIs

### Rollback
1. Git revert the specific commits for each fix
2. Restart the server
3. Each fix is independent — individual rollback is possible

### Complexity
🔴 **High security sensitivity** / 🟢 Low code volume — 4 targeted changes

---

## Sprint S-01 — Structured Logger

### Objective
Introduce `server/logger.ts` using Winston. Replace all `console.log`/`console.error` in route handlers and services. Enable structured JSON logging in production.

### Issues Addressed
- docs/SECURITY.md SEC-MED-005: `console.log` in 29+ production paths
- docs/ARCHITECTURE.md ISSUE-ARCH-003: Inconsistent logging across modules

### Files Affected
```
server/logger.ts           — NEW: Winston logger setup
server/index.ts            — Add Morgan HTTP logger middleware
server/routes.ts           — Replace console.* with logger.* (all instances)
server/ai.ts               — Replace console.* with logger.*
server/cron.ts             — Replace console.* with logger.*
server/push.ts             — Replace console.* with logger.*
```

### Dependencies
- None. Can run concurrently with S-02.

### Testing
1. Start server in `NODE_ENV=production` — verify no console.log output appears
2. Verify HTTP requests appear in request log
3. Verify error log entries are in JSON format
4. Verify `LOG_LEVEL` env var controls output

### Rollback
Remove `server/logger.ts`; restore `console.log` calls from git history.

### Complexity
🟡 **Medium** — high volume of find-and-replace across large files

---

## Sprint S-02 — Startup Environment Validation

### Objective
Add a startup validation block that checks all required env vars before `app.listen()`. Fail fast with a descriptive error if any are missing.

### Issues Addressed
- docs/SECURITY.md SEC-MED-002: No env var validation at startup
- docs/SECURITY.md SEC-CRIT-001: SESSION_SECRET check (complementary to S-00)

### Files Affected
```
server/startup-validation.ts  — NEW: required env var list + throw on missing
server/index.ts               — Call validateEnvironment() before app.listen()
```

### Dependencies
- S-01 (logger must exist to log validation results)

### Testing
1. Remove `MONGODB_URI` from env → verify server throws with clear message
2. Remove `SESSION_SECRET` → verify server throws
3. All env vars present → server starts normally

### Rollback
Remove the `validateEnvironment()` call from `server/index.ts`.

### Complexity
🟢 **Low** — self-contained new file, minimal change to `server/index.ts`

---

## Sprint S-03 — Model File Splitting

### Objective
Split `server/models.ts` (2,339 lines, 40+ models) into individual model files under `server/models/`. One file per model.

### Issues Addressed
- docs/ARCHITECTURE.md ISSUE-ARCH-001: 2,339-line monolith model file
- docs/PROJECT_STRUCTURE.md: One model per file requirement
- docs/DATABASE.md DB-001: Model organization

### Files Affected
```
server/models/              — NEW directory
server/models/user.model.ts
server/models/order.model.ts
server/models/project.model.ts
server/models/invoice.model.ts
server/models/wallet.model.ts
server/models/transaction.model.ts
server/models/notification.model.ts
... (1 file per model, ~40 total)
server/models/index.ts     — Re-export all models
server/models.ts           — Convert to re-export barrel → eventually delete
server/routes.ts           — Update all model imports (no logic change)
```

### Dependencies
- S-01 (logger), S-02 (startup validation) should be complete first
- Must NOT change any model schema — identical schemas, only organization change

### Testing
1. After split: run the full application — all existing API endpoints must function identically
2. Verify no model is registered twice (watch for OverwriteModelError)
3. Test all CRUD endpoints for 5 most-used models: User, Order, Invoice, Wallet, Notification
4. Verify MongoDB collections have the same names (check `Model.collection.name`)

### Rollback
If the split causes issues: restore `server/models.ts` from git, revert imports in `server/routes.ts`.

### Complexity
🔴 **High** — large surface area, risk of import errors and duplicate model registration

---

## Sprint S-04 — Route File Splitting

### Objective
Split `server/routes.ts` (16,975 lines) into domain-specific route files under `server/routes/`. Register all routers in `server/index.ts`.

### Issues Addressed
- docs/ARCHITECTURE.md ISSUE-ARCH-001: 16,975-line monolith routes file
- docs/PROJECT_STRUCTURE.md: Route domain separation

### Target Structure
```
server/routes/
├── auth.routes.ts          — /api/auth/*
├── admin/
│   ├── users.routes.ts     — /api/admin/users/*
│   ├── orders.routes.ts    — /api/admin/orders/*
│   ├── finance.routes.ts   — /api/admin/finance/*
│   ├── employees.routes.ts — /api/admin/employees/*
│   ├── analytics.routes.ts — /api/admin/analytics/*
│   └── settings.routes.ts  — /api/admin/settings/*
├── client/
│   ├── orders.routes.ts    — /api/client/orders/*
│   ├── projects.routes.ts  — /api/client/projects/*
│   ├── wallet.routes.ts    — /api/wallet/*
│   └── notifications.routes.ts
├── employee/
│   ├── tasks.routes.ts     — /api/employee/*
│   └── attendance.routes.ts
├── ai.routes.ts            — /api/ai/*
├── qmeet.routes.ts         — /api/qmeet/*
├── sandbox.routes.ts       — /api/sandbox/*
├── deploy.routes.ts        — /api/deploy/*
├── public.routes.ts        — /api/public/*
└── health.routes.ts        — /api/health
```

### Dependencies
- **S-03 must be complete** (model imports must be from `server/models/*`)
- **S-05** (centralized error handler) should be in place first

### Migration Strategy
1. Extract one domain at a time (start with smallest: health, public, auth)
2. Keep `server/routes.ts` as a decreasing barrel that delegates to the new files
3. Test each extracted domain before proceeding to the next
4. Only delete `server/routes.ts` when all domains are migrated

### Testing
1. After each domain extraction: run targeted API tests for that domain
2. Full regression after all domains are extracted
3. Verify route registration order is preserved (important for catch-all routes)

### Rollback
Restore individual route file from git, remove its import from `server/index.ts`.

### Complexity
🔴 **Very High** — largest refactor in the plan; must be done domain-by-domain with testing between each step

---

## Sprint S-05 — Centralized Error Handler

### Objective
Implement a single centralized Express error handler middleware. Update all route try/catch blocks to call `next(err)` instead of inline `res.status(500).json(...)`.

### Issues Addressed
- docs/ARCHITECTURE.md ISSUE-ARCH-003: Inconsistent error handling
- docs/API_STANDARDS.md API-003: Standard error response envelope

### Files Affected
```
server/middleware/error-handler.ts  — NEW
shared/src/errors.ts                — NEW: ErrorCode enum, AppError class
server/index.ts                     — Register error handler as last middleware
server/routes.ts                    — Convert inline catch blocks to next(err)
```

### Dependencies
- S-01 (logger must exist for error handler to log with)

### Testing
1. Trigger a 404 (unknown route) → verify `{ success: false, error: { code, message } }` shape
2. Trigger a Mongoose ValidationError → verify 400 response
3. Trigger a duplicate key error → verify 409 response
4. Verify stack trace excluded from production responses

### Rollback
Remove error handler middleware from `server/index.ts`; restore inline error handling.

### Complexity
🟡 **Medium** — new file is simple; updating all catch blocks in the 16,975-line monolith is the risk (coordinate with S-04 route splitting)

---

## Sprint S-06 — Validation Middleware Rollout

### Objective
Apply the `validate(schema)` Zod middleware to all POST/PUT/PATCH routes that currently accept unvalidated body data.

### Issues Addressed
- docs/API_STANDARDS.md API-001: Missing input validation on many routes
- docs/SECURITY.md SEC-HIGH-001: AI tool arg validation (subset)

### Files Affected
```
server/middleware/validate.ts   — Verify/create validate() middleware
server/routes.ts                — Add validate(schema) to each body-accepting route
shared/src/schema.ts            — Add missing Zod schemas for any unvalidated routes
```

### Dependencies
- S-04 (route splitting) — easier to apply per-route validation in smaller files
- S-05 (centralized error handler) — Zod errors should flow to error handler

### Testing
1. POST to 5 key routes with invalid data → verify 400 + field-level errors returned
2. POST to same routes with valid data → verify success response unchanged

### Rollback
Remove `validate()` middleware from affected routes; behavior reverts to unvalidated (not recommended to leave this state).

### Complexity
🟡 **Medium** — systematic but large surface area; coordinate with S-04

---

## Sprint S-07 — RBAC Middleware Audit

### Objective
Audit every protected route and replace inline role checks with `requireRole()` middleware. Ensure no route is missing authentication or authorization middleware.

### Issues Addressed
- docs/PERMISSIONS.md PERM-002: Inconsistent role enforcement
- docs/RBAC_DESIGN.md Section 8: requireRole() factory

### Files Affected
```
server/middleware/require-role.ts  — Verify/create requireRole() factory
server/routes.ts                   — Add requireRole() to every protected route
```

### Dependencies
- S-04 (route splitting preferred, but can be done on the monolith)

### Testing
1. For 11 role types: attempt to access wrong-role routes → verify 403
2. Attempt to access protected routes without session → verify 401
3. Correct role → verify 200/201

### Rollback
Restore inline role checks from git history.

### Complexity
🟡 **Medium** — systematic audit; risk of accidentally granting or blocking access during migration

---

## Sprint S-08 — Database Indexes + TTL

### Objective
Add missing indexes to all Mongoose models. Add TTL indexes to `notifications`, `activity_logs`, and `otps` collections. Verify existing indexes in Atlas.

### Issues Addressed
- docs/DATABASE_BLUEPRINT.md Section 4: Missing indexes causing slow queries
- docs/DATABASE.md DB-003: TTL index requirement

### Files Affected
```
server/models/*.model.ts  — Add index() calls to all models
server/migrations/001-add-indexes.ts  — NEW: migration script to create indexes in Atlas
```

### Dependencies
- S-03 (model splitting must be complete)

### Testing
1. Run `db.collection.getIndexes()` in Atlas → verify all expected indexes exist
2. Test list endpoints with 1000+ documents → verify response time < 500ms
3. Insert a notification with `createdAt` > 30 days ago → verify TTL removes it within the Atlas maintenance window

### Rollback
Drop newly added indexes via Atlas — no data loss risk.

### Complexity
🟢 **Low risk** — additive only; indexes can be built in the background

---

## Sprint S-09 — Rate Limiter Audit

### Objective
Audit all route groups against the required rate limits defined in docs/API_BLUEPRINT.md. Add missing rate limiters to AI, wallet, and PayPal routes.

### Files Affected
```
server/middleware/rate-limit.ts  — Create named limiters for each route group
server/routes.ts                 — Apply limiters to missing route groups
```

### Dependencies
- None. Can run concurrently with other sprints.

### Testing
1. Send 11 requests to `/api/ai/*` in under a minute → verify 429 on the 11th
2. Verify rate limit headers in response: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

### Rollback
Remove limiters from `server/routes.ts`.

### Complexity
🟢 **Low** — additive middleware only

---

## Sprint S-10 — Frontend Loading, Error, and Empty States

### Objective
Audit all 166+ pages. Add missing loading skeletons, error cards with retry buttons, and illustrated empty states per docs/UI_RULES.md UI-002, UI-003, UI-004.

### Files Affected
```
client/src/pages/**/*.tsx  — Add loading/error/empty states to all query-fetching pages
client/src/components/ui/error-card.tsx  — NEW: shared error card component
client/src/components/ui/empty-state.tsx — NEW: shared empty state component
```

### Dependencies
- None (pure frontend work)

### Testing
1. Set network to "offline" in Chrome DevTools → verify error card appears on each page
2. Clear mock data → verify empty state appears on list pages
3. Slow network throttling → verify skeleton appears

### Rollback
Revert individual page components from git.

### Complexity
🟡 **Medium** — large surface area (166 pages); systematic but repetitive

---

## Sprint S-11 — i18n Audit

### Objective
Remove all hardcoded Arabic and English strings from JSX. Extract all strings to `client/src/lib/i18n.tsx`. Add Arabic Zod error messages.

### Files Affected
```
client/src/pages/**/*.tsx  — Replace hardcoded strings with t('key')
client/src/lib/i18n.tsx    — Add all missing translation keys
```

### Dependencies
- S-10 (easier to do alongside loading/error/empty state additions)

### Testing
1. Switch language to English → verify UI switches correctly with no Arabic remnants
2. Submit invalid form → verify Zod errors appear in Arabic

### Rollback
Revert individual page changes; translations are additive.

### Complexity
🟡 **Medium** — large surface area; risk of missing strings

---

## Sprint S-12 — Core Web Vitals Optimization

### Objective
Reach Lighthouse Performance > 80 and SEO > 95 on all public pages. Implement WebP images, lazy loading, route-level code splitting, and structured data.

### Issues Addressed
- docs/EXECUTION_PLAN.md Phase 5: Core Web Vitals targets
- docs/SEO_ENGINEERING.md: SEO implementation requirements

### Files Affected
```
client/src/pages/Home.tsx         — Optimize hero LCP, add structured data
client/src/pages/Prices.tsx       — Add structured data (PriceSpecification)
client/public/sitemap.xml         — Verify completeness
vite.config.ts                    — Verify manualChunks configuration
client/src/components/ParticleCanvas.tsx — Add mobile/reduced-motion guard
```

### Dependencies
- S-11 (i18n complete — avoids fixing the same files twice)

### Testing
1. Run Lighthouse on public pages → verify scores
2. Test on mobile viewport → verify particle animation does not render

### Rollback
Revert optimization changes per page.

### Complexity
🟡 **Medium** — targeted changes; Lighthouse scores are the acceptance criterion

---

## Sprint S-13 — Mobile Capacitor Build

### Objective
Produce a working Capacitor iOS and Android build from the existing PWA. Configure deep linking, push notifications, and biometric auth. Verify Apple App Store compliance.

### Issues Addressed
- docs/MOBILE_ARCHITECTURE.md: Full Capacitor setup
- docs/APPLE_REVIEW.md: App Store compliance

### Files Affected
```
capacitor.config.ts              — Verify/create
ios/                             — Generated by Capacitor CLI
android/                         — Generated by Capacitor CLI
client/src/App.tsx               — Platform-specific payment UI guards
```

### Dependencies
- S-12 (Core Web Vitals — mobile performance must be acceptable)
- S-11 (i18n — Arabic UI must be complete before App Store submission)

### Testing
1. Build and run on iOS Simulator → verify all client portal flows work
2. Build and run on Android Emulator → verify RTL layout
3. Verify Apple IAP guard hides external payment methods on iOS build
4. Test biometric login flow

### Rollback
Remove `ios/` and `android/` directories; capacitor.config.ts is additive.

### Complexity
🔴 **High** — involves native build tools, app signing, and Apple review requirements

---

## Sprint S-14 — Integration Tests

### Objective
Implement automated integration tests for all critical paths: auth, payments, AI tool executor, health check.

### Issues Addressed
- docs/EXECUTION_PLAN.md Phase 7: QA and testing

### Files Affected
```
tests/                           — NEW test directory
tests/integration/auth/
tests/integration/payments/
tests/integration/ai/
tests/unit/
```

### Dependencies
- All S-00 through S-09 complete (backend must be stable before testing)

### Testing
Tests ARE the output of this sprint. CI/CD gate established.

### Rollback
N/A — tests are additive.

### Complexity
🟡 **Medium** — requires test database setup and mock configuration

---

## Recommended Execution Order

```
S-00 Security Hotfixes (BLOCKER — do first, immediately)
  │
  ├── S-01 Structured Logger ─────────────────────┐
  │     │                                         │
  │   S-02 Startup Validation                   S-09 Rate Limiter Audit
  │     │
  │   S-05 Error Handler
  │     │
  │   S-03 Model Splitting
  │     │
  │   S-04 Route Splitting
  │     ├── S-06 Validation Middleware
  │     ├── S-07 RBAC Middleware Audit
  │     └── S-08 DB Indexes + TTL
  │
  ├── S-10 Frontend Loading States ─── S-11 i18n Audit ─── S-12 Core Web Vitals
  │
  └── S-13 Mobile Capacitor Build
        │
      S-14 Integration Tests (final sprint)
```
