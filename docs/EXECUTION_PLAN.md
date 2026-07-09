# EXECUTION_PLAN.md — QIROX V4 Phased Execution Plan

> **Mode:** Blueprint only. No code modified.
> **Date:** 2026-07-08

---

## Overview

This plan breaks the QIROX V4 rebuild into sequential phases. Each phase must be completed and verified before the next begins. No phase introduces new features — each phase improves the foundation for features that already exist.

---

## Phase 0 — Security Hardening (Emergency)
**Estimated Duration:** 1–2 days
**Dependencies:** None (must run before all other phases)
**Risk:** CRITICAL — existing vulnerabilities are actively dangerous

### Objective
Close all CRITICAL and HIGH security issues documented in SECURITY.md before any other work.

### Tasks

| Task | Issue Ref | Complexity | Time |
|---|---|---|---|
| Remove hardcoded session secret fallback; add startup guard | SEC-CRIT-001 | Low | 15 min |
| Replace exec() with execFile() + allowlist in sandbox build | SEC-CRIT-002 | Medium | 2 hr |
| Revoke Apple Distribution certificate; regenerate; remove from repo | APPLE-001 | Low | 2 hr |
| Purge distribution_key.pem and QIROX_Distribution.p12 from git history | APPLE-001 | High | 1 hr |
| Add helmet middleware (security headers) | SEC-MED-008 | Low | 30 min |
| Add startup environment variable validation | SEC-MED-002 | Low | 1 hr |
| Add APS entitlement verification to Codemagic build | APPLE-003 | Low | 1 hr |
| Audit and sanitize AI tool executor arguments (Zod schemas) | SEC-HIGH-001 | High | 1 day |
| Add file upload MIME type validation | SEC-HIGH-006 | Medium | 2 hr |
| Add Content-Security-Policy header | SEC-MED-008 | Medium | 2 hr |

### Files Affected
- `server/auth.ts` (session secret guard)
- `server/sandbox-routes.ts` (exec → execFile)
- `server/ai.ts` (tool argument validation)
- `server/index.ts` (startup env validation, helmet)
- `distribution_key.pem`, `QIROX_Distribution.p12` (delete)
- `.gitignore` (add *.pem, *.p12, *.key, *.csr)
- `codemagic.yaml` (entitlement verification)
- Git history (filter-repo)

### Testing Required
- Session still works after secret fallback removal
- Sandbox build still works with allowlisted commands
- Upload endpoints reject non-allowed MIME types
- All CRITICAL security tests pass

### Rollback Strategy
- All changes are additive except git history rewrite
- Git history rewrite: backup full repo before running filter-repo
- Session change: test in staging with correct SESSION_SECRET before prod

### Expected Result
All CRITICAL and HIGH security vulnerabilities resolved. Clean git history. No private keys in repository.

---

## Phase 1 — Architecture Foundation
**Estimated Duration:** 2–3 weeks
**Dependencies:** Phase 0 complete
**Risk:** HIGH — large refactor; must maintain 100% backward compatibility

### Objective
Split the `server/routes.ts` monolith and `server/models.ts` monolith into maintainable modules. Remove `// @ts-nocheck`. Add centralized middleware.

### Tasks

| Task | Issue Ref | Complexity | Time |
|---|---|---|---|
| Create `server/middleware/` directory with rate-limit, validate, error-handler, security | API-001, API-002 | Medium | 2 days |
| Create `requireRole()` middleware factory | PERM-002 | Low | 2 hr |
| Split models.ts into `server/models/` (one file per domain) | ARCH-002 | Medium | 2 days |
| Split routes.ts into `server/routes/` modules | ARCH-001 | High | 1 week |
| Remove `// @ts-nocheck` from each new route file; fix type errors | ARCH-001 | High | 3–5 days |
| Add centralized error handler middleware | ARCH-003 | Medium | 1 day |
| Fix regex URI manipulation in connection-manager.ts | ARCH-004 | Medium | 1 day |
| Add structured logger (replaces console.log) | SEC-MED-005 | Low | 1 day |
| Remove console.log from client code | SEC-MED-005 | Low | 2 hr |

### Migration Strategy for routes.ts Split
```
Step 1: Create server/routes/index.ts that imports and mounts all old routes (identity transform)
Step 2: Gradually move route groups to feature files, one domain at a time
Step 3: After each domain move: run the app, test all moved routes
Step 4: Remove @ts-nocheck from each new file and fix type errors
Step 5: Repeat until routes.ts is empty → delete it
```

### Files Affected
- `server/routes.ts` → `server/routes/*.ts` (20+ files)
- `server/models.ts` → `server/models/*.ts` (25+ files)
- `server/auth.ts` → `server/auth/index.ts`
- New: `server/middleware/rate-limit.ts`, `validate.ts`, `error-handler.ts`, `security.ts`
- New: `server/logger.ts`

### Testing Required
- Every API endpoint responds correctly after each move
- TypeScript compiles with zero errors (no @ts-nocheck)
- All existing functionality intact
- Rate limiting applied and tested on auth routes

### Rollback Strategy
- Use feature flags: keep original routes.ts until new routes are verified
- Git branch per domain migration
- Database is not affected — schema changes are in Phase 3

### Expected Result
Clean, maintainable server architecture. TypeScript fully type-checked. Centralized rate limiting, validation, and error handling. Zero @ts-nocheck.

---

## Phase 2 — Database Integrity
**Estimated Duration:** 1 week
**Dependencies:** Phase 1 complete (models split first)
**Risk:** MEDIUM — index additions are non-destructive; TTL indexes require careful testing

### Objective
Add missing database indexes, implement soft-delete on financial models, add TTL indexes for cleanup, and fix wallet atomicity.

### Tasks

| Task | Issue Ref | Complexity | Time |
|---|---|---|---|
| Add compound indexes to all high-query collections | DB-002 | Low | 1 day |
| Add TTL indexes: notifications (30d), activity_logs (90d), otps | DB-006, DB-002 | Low | 2 hr |
| Add soft-delete to Invoice, PayrollRecord, ReceiptVoucher | DB-005 | Low | 2 hr |
| Fix wallet balance atomicity using MongoDB transactions | DB-006 | High | 1 day |
| Add default pagination (limit: 50) to all list queries | DB-006 | Medium | 2 days |
| Create UploadModel for file metadata tracking | DB-008 | Medium | 1 day |
| Clarify PostgreSQL/Drizzle status; provision or remove | DB-004 | Low | 2 hr |
| Add connection pool configuration (maxPoolSize: 20) | DB-007 | Low | 1 hr |

### Files Affected
- `server/models/*.ts` (all model files from Phase 1 split)
- `server/routes/*.ts` (add pagination defaults)
- New: `server/models/upload.model.ts`
- `server/db.ts` (connection pool config)
- `drizzle.config.ts` (resolve or remove)

### Testing Required
- All list endpoints return paginated results
- Wallet payments are atomic (no negative balance possible under concurrent load)
- Indexes created in background (no downtime)
- TTL indexes: manually verify documents expire after TTL period

### Rollback Strategy
- Indexes can be dropped (non-destructive to data)
- Soft-delete: adds fields, does not remove data
- Wallet transactions: test in staging with concurrent requests before prod

### Expected Result
Database queries performant under load. Financial records protected by soft-delete. Wallet balance guaranteed atomic. File uploads tracked.

---

## Phase 3 — API Standardization
**Estimated Duration:** 1 week
**Dependencies:** Phases 1–2 complete
**Risk:** MEDIUM — response format changes require frontend updates

### Objective
Standardize all API responses, add Zod validation to all endpoints, complete rate limiting, and add an OpenAPI spec.

### Tasks

| Task | Issue Ref | Complexity | Time |
|---|---|---|---|
| Standardize error response format across all routes | API-003 | Medium | 2 days |
| Standardize success response format `{ success, data }` | API-008 | Medium | 2 days |
| Apply Zod validation schemas to all endpoints | API-001 | High | 3 days |
| Apply rate limiters to all remaining route groups | API-002 | Medium | 1 day |
| Reduce JSON body limit to 1MB (raise per-endpoint as needed) | API-009 | Low | 1 hr |
| Audit SSE endpoints for req.on('close') cleanup | API-010 | Medium | 1 day |
| Generate OpenAPI 3.0 spec | API-006 | Medium | 2 days |

### Files Affected
- `server/routes/*.ts` (all route files)
- `shared/schema.ts` (Zod schemas, may be extended)
- New: `docs/openapi.yaml`
- `server/index.ts` (body size limit)

### Testing Required
- All endpoints return consistent `{ success, data }` or `{ success, error }` shape
- Frontend handles new response format (may require frontend updates)
- Invalid inputs return 400 with clear Arabic error messages
- Rate limits tested with load tool (autocannon)

### Rollback Strategy
- Response format change: coordinate with frontend team; update both together
- Feature flag: return both old and new format during transition period

### Expected Result
All 710 endpoints validated, rate-limited, and returning consistent responses. OpenAPI spec auto-generated. Frontend and backend in sync.

---

## Phase 4 — Frontend Architecture
**Estimated Duration:** 2 weeks
**Dependencies:** Phase 3 complete (stable API contract)
**Risk:** MEDIUM — large reorganization; pages must remain functional throughout

### Objective
Reorganize 154 pages into feature modules. Add missing UI states (loading, error, empty). Remove console.log. Fix accessibility gaps.

### Tasks

| Task | Issue Ref | Complexity | Time |
|---|---|---|---|
| Reorganize pages into `client/src/features/` | PROJECT_STRUCTURE | High | 1 week |
| Add ErrorBoundary component to all page roots | UI-003 | Low | 1 day |
| Add Skeleton loading to all data-fetching pages | UI-002 | Medium | 2 days |
| Add EmptyState component to all list pages | UI-004 | Low | 1 day |
| Add ConfirmDialog to all destructive actions | UX-005 | Low | 1 day |
| Add SessionExpiredModal (401 handler) | UX-004 | Medium | 1 day |
| Split use-currency.ts (703 lines) into utilities | COMPONENT_INVENTORY | Low | 2 hr |
| Audit mobile responsiveness on all 154 pages | UI-005 | High | 3 days |
| Remove AntiDevTools.tsx (security theater) | COMPONENT_INVENTORY | Low | 30 min |
| Remove all console.log from client code | SEC-MED-005 | Low | 2 hr |
| Add prefers-reduced-motion to all animations | DESIGN_SYSTEM | Low | 1 day |

### Files Affected
- `client/src/pages/*.tsx` → `client/src/features/**/*.tsx`
- New: `components/ErrorBoundary.tsx`, `components/EmptyState.tsx`, `components/ConfirmDialog.tsx`, `components/SessionExpiredModal.tsx`
- `client/src/hooks/use-currency.ts` (split)
- `client/src/components/AntiDevTools.tsx` (delete)

### Testing Required
- All 154 pages accessible at their routes after reorganization
- Loading states visible on slow network (throttle in DevTools)
- Error states visible with network disconnected
- Destructive actions require confirmation
- Responsive: test at 375px and 768px viewport

### Rollback Strategy
- Reorganize in feature branches; merge one feature domain at a time
- Wouter routes should not change — only file locations change
- Update App.tsx imports incrementally

### Expected Result
Clean, domain-organized frontend. All pages handle loading, error, and empty states. Zero console.log in production builds.

---

## Phase 5 — SEO & Performance
**Estimated Duration:** 1–2 weeks
**Dependencies:** Phase 4 complete (stable component structure)
**Risk:** LOW — additive changes; no breaking changes

### Objective
Implement server-side rendering for public pages, dynamic sitemap, page-specific structured data, and Core Web Vitals optimization.

### Tasks

| Task | Issue Ref | Complexity | Time |
|---|---|---|---|
| Implement build-time prerendering for known public routes | SEO-001 | Medium | 2 days |
| Implement SSR for dynamic routes (news/:id, systems/:id) | SEO-001 | High | 3 days |
| Dynamic sitemap endpoint from MongoDB | SEO-004 | Low | 1 day |
| Verify/fix robots.txt | SEO-005 | Low | 1 hr |
| Add page-specific JSON-LD for news, systems, jobs | SEO-006 | Medium | 2 days |
| Add dynamic OG image generation endpoint | SEO section 5 | Medium | 2 days |
| Run Lighthouse audit; fix LCP < 2.5s | SEO-007 | Medium | 2 days |
| Add image optimization pipeline (WebP + srcset) | IMAGE section | Medium | 2 days |
| Audit and fix hreflang on all dynamic pages | SEO-003 | Low | 1 day |
| Add Preconnect/Preload hints for critical assets | SEO-007 | Low | 2 hr |

### Files Affected
- `server/index.ts` (SSR handler)
- New: `server/ssr.ts`
- `client/public/sitemap.xml` → `GET /sitemap.xml` server handler
- `client/index.html` (preload hints)
- New: `/api/og-image` endpoint
- All public page components (JSON-LD additions)

### Testing Required
- Googlebot can render and index all public pages
- Sitemap includes all news articles and system templates
- Lighthouse score: Performance > 80, SEO > 95
- Social share cards render correctly (test with Open Graph debugger)

### Rollback Strategy
- SSR can be disabled per-route (return SPA fallback)
- Prerender: keep SPA as fallback for non-prerendered routes
- Sitemap: static fallback always exists

### Expected Result
Public pages fully indexable by search engines. Dynamic content in sitemap. Social share cards correct. Lighthouse SEO score > 95.

---

## Phase 6 — Mobile & App Store
**Estimated Duration:** 1–2 weeks
**Dependencies:** Phase 5 complete; Apple Distribution cert already revoked (Phase 0)
**Risk:** HIGH — App Store approval process is external and unpredictable

### Objective
Achieve App Store and Google Play compliance. Fix iOS WebRTC (QMeet). Implement native push notifications.

### Tasks

| Task | Issue Ref | Complexity | Time |
|---|---|---|---|
| Verify all Info.plist privacy usage strings | APPLE-002 | Low | 2 hr |
| Set up APS environment entitlement correctly | APPLE-003 | Low | 2 hr |
| Implement or verify Apple Sign-In end-to-end | MOBILE section 4 | Medium | 1 day |
| Audit payment flows in native app context; add IAP or browser redirect | APPLE-005 | High | 3 days |
| Test QMeet WebRTC on physical iPhone | APPLE-007 | Medium | 1 day |
| Create deep link configuration (apple-app-site-association, assetlinks.json) | MOBILE section 7 | Low | 2 hr |
| Create App Review demo account | APPLE-006 | Low | 1 hr |
| Fill in Privacy Nutrition Label in App Store Connect | APPLE-004 | Medium | 2 hr |
| Set up Data Safety section in Google Play Console | MOBILE section 9 | Low | 2 hr |
| Implement FCM/APN native push (firebase-admin + APN library) | MOBILE section 5 | High | 2 days |
| Implement .well-known/assetlinks.json for Android | MOBILE section 3 | Low | 1 hr |

### Files Affected
- `ios/App/App/Info.plist`
- `ios/App/App/App.entitlements`
- `client/public/.well-known/apple-app-site-association`
- `client/public/.well-known/assetlinks.json`
- `server/push.ts` (APN/FCM integration)
- `codemagic.yaml` (updated signing config)
- `capacitor.config.json` (verify)

### Testing Required
- Test on physical iPhone (iOS 16+, 17+)
- QMeet: camera + microphone work in Capacitor WKWebView
- Payment flow: PayPal opens in browser (not in-app)
- Push notifications: receive on locked screen
- Deep links: tap link opens app at correct screen
- Apple TestFlight build: review all app screens

### Rollback Strategy
- App Store: not submittable until all issues resolved
- Native push: falls back to web push if native token not available
- IAP: browser redirect fallback always available

### Expected Result
App Store submission-ready iOS app. Google Play compliance met. Native push notifications working. QMeet functional on iOS.

---

## Phase 7 — Quality Assurance & Monitoring
**Estimated Duration:** 1 week
**Dependencies:** Phases 1–6 complete
**Risk:** LOW — observability improvements, no breaking changes

### Objective
Add structured logging, health checks, and automated tests for critical paths.

### Tasks

| Task | Complexity | Time |
|---|---|---|
| Add `/api/health` endpoint (DB ping, version, uptime) | Low | 2 hr |
| Integrate structured logger (Winston or Pino) | Medium | 1 day |
| Write integration tests for auth flows | Medium | 1 day |
| Write integration tests for payment flows | Medium | 1 day |
| Write integration tests for AI tool executor | High | 2 days |
| Set up error monitoring (Sentry or similar) | Low | 2 hr |
| Set up uptime monitoring (UptimeRobot or Render health checks) | Low | 1 hr |
| Add email delivery monitoring | Low | 2 hr |
| Document all env vars with descriptions in .env.example | Low | 1 hr |

### Files Affected
- New: `tests/` directory (unit + integration)
- New: `server/logger.ts`
- New: `/api/health` route
- New: `.env.example`
- `server/index.ts` (error monitoring init)

### Testing Required
- Health endpoint returns 200 in under 500ms
- Auth integration tests: register, login, 2FA, logout
- Payment tests: PayPal create + capture flow
- CI/CD: all tests pass before deployment

### Rollback Strategy
- All additive; no production code changes
- Tests run in CI/CD; failing tests block deployment

### Expected Result
Full observability. Automated tests for critical flows. Error monitoring in production. Documented environment configuration.

---

## Dependency Graph

```
Phase 0 (Security)
    └── Phase 1 (Architecture)
              └── Phase 2 (Database)
                        └── Phase 3 (API)
                                  └── Phase 4 (Frontend)
                                            └── Phase 5 (SEO)
                                            └── Phase 6 (Mobile)
                                                      └── Phase 7 (QA)
```

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| routes.ts split breaks production endpoint | HIGH | HIGH | Test every route after each domain move; feature flag |
| @ts-nocheck removal reveals many type errors | HIGH | MEDIUM | Fix type errors per file; do not skip |
| Apple App Store rejection | MEDIUM | HIGH | TestFlight beta before App Store submission |
| SSR implementation breaks existing SPA | MEDIUM | HIGH | SSR opt-in per route; SPA fallback always present |
| MongoDB index creation causes performance impact | LOW | MEDIUM | Create indexes with `{ background: true }` |
| Git history rewrite causes team sync issues | LOW | HIGH | Coordinate with all contributors; force push to main after rewrite |
| SMTP delivery failures after config changes | MEDIUM | HIGH | Test all email flows in staging before prod change |
| PayPal IAP rejection by Apple | MEDIUM | HIGH | Prepare browser redirect fallback before App Store submission |

---

## Success Criteria (All Phases)

| Criterion | Measurement |
|---|---|
| Zero CRITICAL security issues | SECURITY.md issues resolved + verified |
| No @ts-nocheck in server/ | `grep -r "@ts-nocheck" server/` returns nothing |
| All routes typed | TypeScript compiles with strict=true and zero errors |
| Lighthouse SEO score | > 95 on all public pages |
| Lighthouse Performance score | > 80 on all public pages |
| Core Web Vitals | LCP < 2.5s, CLS < 0.1, INP < 200ms |
| App Store ready | TestFlight build passes all Apple guidelines |
| Test coverage | Critical paths (auth, payments, AI) have integration tests |
| No console.log in production | Client bundle contains zero console.log calls |
| API response consistency | All endpoints return `{ success, data/error }` format |
