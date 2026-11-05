# QIROX ROADMAP V2 — Dependency-Based Sprint Plan

**Date:** 2026-07-11
**Mode:** Documentation only. No production code, database, routes, or models were touched to produce this roadmap.
**Companion document:** `docs/IMPLEMENTATION-AUDIT-2026-07-11.md` (full audit — read first).
**Ordering principle:** Every sprint below is ordered by *what it unblocks*, not by department attractiveness. A department rebuild (CRM, Events, HR) is never scheduled before the foundation it depends on is closed. Sprint 009 "CRM Automation" from the old plan is **intentionally deferred** — it now sits at position 12, after the security and validation foundation it silently depends on (lead data flows through the exact code paths flagged in SEC-HIGH-001 and TECH-004).

Every sprint respects the Zero Downtime Policy in `replit.md`: additive-only, feature-flagged, zero expected downtime, explicit rollback.

---

## How to read a sprint entry

Each sprint states: Goal · Why now · Files expected to change · Database impact · API impact · Feature flag · Rollback strategy · Complexity · Duration · Dependencies · Acceptance criteria.

---

### Sprint A — Critical Security Closure

- **Goal:** Close SEC-CRIT-001 (hardcoded session secret fallback) and SEC-CRIT-002 (command injection in sandbox `exec()`).
- **Why it comes now:** These are the only two *critical* severity findings in the entire audit. Every other sprint — including documentation-only ones — runs on top of a session/auth layer and a sandbox runner that are currently exploitable. Nothing else is worth sequencing ahead of this.
- **Files expected to change:** `server/auth.ts` (remove fallback secret, hard-fail on missing `SESSION_SECRET`), `server/sandbox-routes.ts` (replace `exec()`/`execSync()` with a parameterized, allow-listed execution path).
- **Database impact:** None.
- **API impact:** None (behavior identical for valid input; invalid/malicious input now rejected instead of executed).
- **Feature flag:** Not applicable — security fixes are not gated, they ship directly (per Zero Downtime Policy, a security fix is not "new behavior").
- **Rollback strategy:** Revert commit; `SESSION_SECRET` already exists as a Replit Secret in this environment, so no config rollback needed.
- **Estimated complexity:** Medium (sandbox executor rewrite touches an existing feature — must not break legitimate sandbox use).
- **Estimated duration:** 3–5 days.
- **Dependencies:** None. This is the root of the dependency graph.
- **Acceptance criteria:** Server refuses to boot without `SESSION_SECRET` set (no silent fallback); sandbox executor rejects shell metacharacters/command chaining in all existing test cases; all existing sandbox projects continue to run unmodified code successfully.

---

### Sprint B — High-Severity Security Closure

- **Goal:** Close SEC-HIGH-001 through SEC-HIGH-006 (NoSQL injection in AI tool executor, leaked credentials in `attached_assets/`, MongoDB URI manipulation, missing auth rate limiting, missing CSRF protection, missing file-upload MIME validation).
- **Why it comes now:** SEC-HIGH-001 sits directly in the AI tool executor that Sprint's AI Platform work (Sprint K) would otherwise expand — fixing it after expansion multiplies the attack surface. SEC-HIGH-004/005/006 protect every subsequent sprint's new endpoints for free once middleware is in place.
- **Files expected to change:** `server/ai.ts` (parameterize/allow-list tool executor queries), `server/connection-manager.ts` (validate/pin MongoDB URI source), `server/auth.ts`, `server/routes.ts` (rate-limit + CSRF middleware registration), file upload handlers (MIME allow-list). Remove committed credentials from `attached_assets/` and rotate any exposed secrets.
- **Database impact:** None.
- **API impact:** Additive middleware only — same routes, same contracts, now with rate limiting and CSRF tokens required on state-changing requests.
- **Feature flag:** `SECURITY_RATE_LIMIT_V1`, `SECURITY_CSRF_V1` — both default `true` in a canary window on non-critical routes first, then expanded; can be independently disabled if a legitimate client integration breaks.
- **Rollback strategy:** Flip feature flags off; middleware is additive and removable without touching route handlers.
- **Estimated complexity:** Medium-High (CSRF touches every state-changing form/fetch call across the frontend).
- **Estimated duration:** 1–2 weeks.
- **Dependencies:** Sprint A (shared security surface; same reviewers/CTO sign-off gate).
- **Acceptance criteria:** All 6 SEC-HIGH items closed and verified in `SECURITY.md`; existing auth flows, AI chat, and file upload features work unchanged in manual QA; rate-limit thresholds documented; CSRF token flow verified on at least one write path per major frontend area (client, employee, admin).

---

### Sprint C — Validation Middleware Wiring (closes TECH-004)

- **Goal:** Replace the `null` Zod schema stubs in `server/domains/email/validation.ts` and `server/domains/crm/validation.ts` with real schemas, and wire an `IValidationMiddlewareFactory` into the request pipeline.
- **Why it comes now:** Every domain built after this point (CRM redesign, Mail completion, Events, HR) should be validated from day one rather than inheriting the stub pattern. Doing this before Sprint D (email domain completion) means the email migration ships with real validation instead of needing a follow-up pass.
- **Files expected to change:** `server/domains/email/validation.ts`, `server/domains/crm/validation.ts`, new `server/infrastructure/validation-middleware.ts` (or equivalent factory), route registration files for both domains.
- **Database impact:** None.
- **API impact:** None externally — invalid requests that previously reached Mongoose now return clean 400s earlier in the pipeline. No valid-request behavior changes.
- **Feature flag:** `VALIDATION_MIDDLEWARE_V1` — allows instant rollback to manual in-`domain.ts` validation if a schema is too strict for an edge case found in production.
- **Rollback strategy:** Disable flag; manual validation in `domain.ts` functions remains in place as a fallback (do not delete it until the flag has been on in production for a full release cycle).
- **Estimated complexity:** Low-Medium.
- **Estimated duration:** 4–6 days.
- **Dependencies:** None technically, but scheduled after Sprint B so the CTO security review batch isn't reopened.
- **Acceptance criteria:** Closes TECH-004. All CRM and Email domain routes reject malformed input with 400 + field-level error messages before reaching the service layer. No regression in valid-request handling (verified via existing manual QA checklists from Migrations 007/008).

---

### Sprint D — Legacy Email Domain Completion (closes TECH-001, TECH-002, TECH-007)

- **Goal:** Migrate the remaining 14 email templates from `server/email.ts` into `server/domains/email/domain.ts`; delete or shim the legacy file.
- **Why it comes now:** This is the last open item from the Migration 008-era email work and the register has explicitly targeted it for "Migration 011" — closing it before starting new department work prevents a third place (on top of legacy + domain) where email templates could drift.
- **Files expected to change:** `server/domains/email/domain.ts` (add 14 template builders), `server/email.ts` (reduce to re-export shim, then delete in a follow-up release), `server/domains/email/infrastructure/legacy-email-adapter.ts` (remove once empty).
- **Database impact:** None.
- **API impact:** None — same email content, same trigger points, different internal source of truth.
- **Feature flag:** `EMAIL_DOMAIN_V2` — routes email sending through the new domain builders; instant fallback to `server/email.ts` if any template renders incorrectly.
- **Rollback strategy:** Disable flag; `server/email.ts` stays untouched (not deleted) until the flag has been at 100% in production for one full billing cycle, to catch any month-end template (invoice, report) that only fires occasionally.
- **Estimated complexity:** Medium (14 templates, each needs visual QA in an email client, not just unit tests).
- **Estimated duration:** 1–2 weeks.
- **Dependencies:** Sprint C (validation wiring should exist before the email domain's send endpoints are considered "complete").
- **Acceptance criteria:** All 14 templates render identically (pixel-diff or manual side-by-side) from the new domain; `server/email.ts` no longer imported anywhere except its own shim; TECH-001, TECH-002, TECH-007 marked closed in the tech debt register.

---

### Sprint E — Remaining Route Extraction (closes TECH-005, TECH-008) + `routes.ts`/`models.ts` Split (Phase 1)

- **Goal:** Move the last admin email routes out of `routes.ts` into the email domain; document the mail domain's full route surface; begin splitting the remaining `routes.ts` (16,975 lines) and `models.ts` (2,339 lines) monoliths into domain modules beyond CRM/Mail/Email.
- **Why it comes now:** `routes.ts` has the lowest stability score in the platform (28/100, `STABILITY-INDEX.md:126`). Every subsequent department sprint (Events, HR, CRM redesign) will add routes — doing so into a monolith makes the problem worse, not better. This sprint stops the bleeding before new departments start.
- **Files expected to change:** `server/routes.ts` (remove admin email routes, extract next-highest-risk route clusters — likely finance/HR reads based on current file organization), `server/domains/email/routes.ts`, `server/domains/email/README.md`, `server/models.ts` (split by domain boundary as each route cluster is extracted).
- **Database impact:** None — same Mongoose models, reorganized into files.
- **API impact:** None — identical route paths, methods, and response shapes; purely an internal reorganization.
- **Feature flag:** Not applicable (behavior-preserving refactor is verified via contract tests, not flags — consistent with how Migrations 007/008 were done).
- **Rollback strategy:** Git revert; extraction is done incrementally with a 100%-behavioral-parity check (curl-diff or contract test) after each cluster, matching the Migration 007/008 pattern.
- **Estimated complexity:** High (large surface area, many implicit dependencies between route handlers accumulated over time).
- **Estimated duration:** 3–4 weeks (can be split into multiple sub-migrations, e.g. 011a/011b, if needed).
- **Dependencies:** Sprint D (email domain must be the reference pattern before extracting more domains).
- **Acceptance criteria:** TECH-005 and TECH-008 closed; `routes.ts` line count reduced by at least the extracted clusters; stability index re-scored and improved for `routes.ts`; zero API contract changes (verified by parity tests).

---

### Sprint F — Database Indexing Pass

- **Goal:** Add the seven missing indexes identified in the audit (`users.email` unique, `subscriptions.userId/status`, `invoices.clientId/status`, `tasks.projectId/status/assignedTo`, `notifications.userId/isRead/createdAt`, `otps.expiresAt` TTL, `activity_logs.createdAt` TTL) and resolve the MongoDB/Drizzle dual-database ambiguity.
- **Why it comes now:** Every department sprint from here on (CRM redesign, Events, Executive Dashboard/Analytics) adds query volume against `users`, `tasks`, `notifications`, and activity logs. Indexing before that volume increase is materially cheaper than retrofitting under load.
- **Files expected to change:** `server/models.ts` (or its post-split equivalents), a new indexing migration script, `docs/DATABASE.md` (mark items closed), `drizzle.config.ts` / related Postgres references (documented decision: retire or clarify actual use).
- **Database impact:** Purely additive index creation — no schema changes, no data migration, no downtime (MongoDB index builds can run in the background).
- **API impact:** None functionally; expected latency improvement on affected queries.
- **Feature flag:** Not applicable (index creation is not user-facing behavior).
- **Rollback strategy:** Drop index if it causes unexpected write-performance regression; indexes are the safest possible database change category.
- **Estimated complexity:** Low.
- **Estimated duration:** 2–3 days (mostly verification/monitoring after background index build).
- **Dependencies:** None technically; scheduled here so Analytics (Sprint L) and CRM redesign (Sprint I) inherit indexed collections from day one.
- **Acceptance criteria:** All 7 indexes present and confirmed via `db.collection.getIndexes()`; query plans for the affected read paths show index usage; Drizzle/Postgres ambiguity has a written decision in `DATABASE.md`.

---

### Sprint G — SEO Foundation (SSR / prerendering + lang tags)

- **Goal:** Close SEO-001 (SPA with no SSR — flagged critical) and SEO-003 (language tag gaps); extend `useSEO` coverage and `sitemap.xml` beyond the current 9 pages / 14 URLs toward the full public page set.
- **Why it comes now:** This is the highest-leverage, lowest-risk item in the entire backlog — pure addition, no behavior change to any authenticated flow, and it's been sitting as a "critical" issue in `ROADMAP.md` since before this audit. It's independent of the security/domain work above, so it can run in parallel with Sprints C–F if resourcing allows, but is sequenced here because it shares no dependency with anything ahead of it and there's no reason to keep deferring it.
- **Files expected to change:** Build tooling (Vite SSR or prerender plugin, or a lightweight prerendering step for the ~130+ uncovered public pages), `client/src/lib/i18n.tsx` (lang attribute wiring), `client/public/sitemap.xml`, each public page component (add `useSEO` calls).
- **Database impact:** None.
- **API impact:** None.
- **Feature flag:** `SEO_SSR_V1` — allows staged rollout (e.g., enable prerendering for the highest-traffic pages first, verify Core Web Vitals impact, then expand).
- **Rollback strategy:** Disable flag; SPA continues serving client-rendered pages as it does today (no user-facing regression from disabling).
- **Estimated complexity:** Medium (prerendering setup is a one-time cost; per-page `useSEO` wiring is repetitive but low-risk).
- **Estimated duration:** 1–2 weeks.
- **Dependencies:** None (can run parallel to Sprints C–F).
- **Acceptance criteria:** All public pages (target: 100% of the 143+ referenced in `ROADMAP.md`) have `useSEO` coverage and appear in `sitemap.xml`; SSR/prerendered HTML contains meaningful `<title>`/`<meta>` content verifiable via `curl` (not just JS-rendered); lang attribute correctly reflects Arabic/English state.

---

### Sprint H — RBAC Centralization + 2FA Enforcement

- **Goal:** Replace per-route manual permission checks with a centralized RBAC layer; enforce 2FA for Admin/Accountant roles.
- **Why it comes now:** Every department sprint from here forward (CRM redesign, Events, HR) adds new roles and permission boundaries (e.g., "who can see a Deal", "who can check in Event guests"). Building those on top of scattered per-route checks compounds the exact problem `RBAC_DESIGN.md` already flags. Centralizing now means every new department inherits one permission model instead of adding a fifteenth ad-hoc check pattern.
- **Files expected to change:** New `server/infrastructure/rbac.ts` (or equivalent), `server/auth.ts` (2FA enforcement gate for sensitive roles), route middleware across existing domains (additive — old per-route checks replaced incrementally, not all at once).
- **Database impact:** None (roles/permissions already exist as user fields; this is a code-organization change, not a schema change) — unless role/permission data needs a dedicated collection, in which case it's additive.
- **API impact:** None externally for correctly-authorized users; previously-under-protected routes may now correctly reject requests that should never have been allowed (a security improvement, documented as a behavior change in the release notes).
- **Feature flag:** `RBAC_CENTRALIZED_V1`, `TWO_FACTOR_ENFORCED_ADMIN_V1` — both independently toggleable.
- **Rollback strategy:** Disable flags; legacy per-route checks remain in place as the fallback until the centralized layer has a full release cycle of production verification.
- **Estimated complexity:** Medium-High (touches every existing route eventually, though can be rolled out domain-by-domain).
- **Estimated duration:** 2–3 weeks.
- **Dependencies:** Sprint B (shares the auth/session surface), Sprint E (easier to retrofit RBAC into already-extracted domain route files than into the `routes.ts` monolith).
- **Acceptance criteria:** At least the CRM and Mail domains (already extracted) run entirely on centralized RBAC; Admin and Accountant accounts cannot log in without 2FA; no legitimate user loses access they previously had (verified via a permission-parity test matrix).

---

### Sprint I — CRM Redesign: Company/Contact/Deal Model *(formerly "Sprint 009 CRM Automation" — now correctly sequenced)*

- **Goal:** Introduce Company and Deal entities alongside the existing Lead model, with pipeline stages, lead scoring, and revenue forecasting — the B2B CRM redesign described in `PRODUCT-GAP-ANALYSIS.md` and `QIROX_PRODUCT_BLUEPRINT.md:474`.
- **Why it comes now:** This was the sprint the user explicitly paused. It is now correctly positioned *after* the security fixes protecting the exact CRM code path it will expand (Sprint B closes SEC-HIGH-001, which lives partly in AI-assisted CRM tooling), *after* real validation exists for CRM inputs (Sprint C), and *after* RBAC is centralized (Sprint H) so that new entities (Company, Deal) get correct permission boundaries from day one instead of another ad-hoc check.
- **Files expected to change:** `server/domains/crm/domain.ts`, `server/domains/crm/mapper.ts` (also closes TECH-003 for CRM if scheduled together), `server/models.ts` (new Company/Deal schemas, additive), `server/domains/crm/routes.ts`, new client pages (company profile, deal pipeline board — closes part of §11 gap).
- **Database impact:** Additive only — new `companies` and `deals` collections; existing `leads` collection untouched; optional non-breaking link field from `leads` to `companies`.
- **API impact:** New endpoints only (`/api/crm/companies`, `/api/crm/deals`, pipeline stage transition endpoints); no changes to existing lead endpoints.
- **Feature flag:** `CRM_V2` (already named in `replit.md`'s feature flag convention list — this sprint is what that flag was reserved for).
- **Rollback strategy:** Disable `CRM_V2`; existing lead-based CRM UI and API remain fully functional and untouched, per Zero Downtime Policy.
- **Estimated complexity:** High (new domain model, new UI, pipeline logic, scoring algorithm).
- **Estimated duration:** 3–4 weeks.
- **Dependencies:** Sprint B, Sprint C, Sprint H.
- **Acceptance criteria:** Company/Deal entities fully CRUD-able behind `CRM_V2`; pipeline stage automation moves deals correctly; lead scoring produces a documented, testable score; existing lead-only CRM continues working with the flag off; QA sign-off per `MIGRATION-GATE.md` process.

---

### Sprint J — Employee Workspace Unification

- **Goal:** Unify QMeet, Employee Mail, System Builder, and role-specific dashboards into a single Employee Hub entry point; add leave approval workflows, training center, and HR audit trail.
- **Why it comes now:** Depends on RBAC centralization (Sprint H) to correctly gate the unified hub's per-tool visibility by role, and benefits from the CRM redesign's UI patterns (Sprint I) for consistency, but does not depend on CRM data itself — can run parallel to Sprint I if resourced separately.
- **Files expected to change:** New `client/src/pages/employee/Hub.tsx` (or equivalent shell), existing employee pages refactored to render inside the hub shell, `server/domains/hr/` (new domain — leave workflows, training records, audit trail).
- **Database impact:** Additive — new `leave_requests`, `training_records`, `hr_audit_log` collections.
- **API impact:** New endpoints under `/api/hr/*`; existing employee tool endpoints unchanged (they're being surfaced inside a new shell, not replaced).
- **Feature flag:** `EMPLOYEE_DASHBOARD_V2` (already reserved in `replit.md`).
- **Rollback strategy:** Disable flag; individual employee tool pages remain accessible via their existing direct routes.
- **Estimated complexity:** Medium-High.
- **Estimated duration:** 2–3 weeks.
- **Dependencies:** Sprint H.
- **Acceptance criteria:** All existing employee tools reachable from the new hub without functional regression; leave requests can be submitted and approved end-to-end; training center lists at least a placeholder-free real content set; HR record edits produce an audit log entry.

---

### Sprint K — AI Platform V2 (Support AI, Lead Intelligence, Moderation)

- **Goal:** Add a knowledge-base-grounded support responder, lead intelligence signals (feeding Sprint I's lead scoring), weekly business summaries, funnel tracking, and a content-moderation gate on generated image/video.
- **Why it comes now:** Depends on SEC-HIGH-001 being closed (Sprint B) since this sprint expands the exact AI tool executor surface that vulnerability lives in; depends on CRM redesign (Sprint I) existing so "lead intelligence" has Company/Deal data to reason over, not just raw leads.
- **Files expected to change:** `server/ai.ts` (moderation gate, new tool functions), new `server/domains/ai-insights/` domain, client-facing support widget, admin weekly-summary email (extends the already-completed email domain from Sprint D).
- **Database impact:** Additive — new `ai_insights_cache`, `moderation_log` collections.
- **API impact:** New endpoints only (`/api/ai/support`, `/api/ai/insights/*`); existing AI Studio endpoints unchanged.
- **Feature flag:** `AI_PLATFORM_V2` (already reserved in `replit.md`).
- **Rollback strategy:** Disable flag; existing AI Studio (image/video/chat) continues operating exactly as today.
- **Estimated complexity:** High (requires a knowledge base ingestion pipeline in addition to the responder itself).
- **Estimated duration:** 3–4 weeks.
- **Dependencies:** Sprint B, Sprint I.
- **Acceptance criteria:** Support responder answers correctly from an actual KB (not hallucinated) on a documented test set; every generated image/video passes through the moderation gate before being served; weekly summary email sends successfully via the Sprint D email domain; funnel tracking dashboard shows real (not mock) conversion data.

---

### Sprint L — Executive Dashboard & Analytics Platform

- **Goal:** Real-time Executive Command Center, operational heatmaps, client health scores, and caching on heavy aggregations.
- **Why it comes now:** This is explicitly the last-mile consumer of almost everything above: it needs indexed collections (Sprint F) to query efficiently, CRM Company/Deal data (Sprint I) and AI lead intelligence (Sprint K) to compute health scores, and RBAC (Sprint H) to correctly restrict command-center visibility to executives. Scheduling it any earlier would mean building dashboards against data that doesn't exist yet.
- **Files expected to change:** New `server/domains/analytics/` domain (aggregation + caching layer), new `client/src/pages/admin/ExecutiveDashboard.tsx`.
- **Database impact:** Additive — optional materialized/cached aggregation collections refreshed on a schedule (e.g., `analytics_cache`), no changes to source collections.
- **API impact:** New endpoints only (`/api/analytics/*`).
- **Feature flag:** Suggest `EXECUTIVE_DASHBOARD_V1` (new — not yet in `replit.md`'s flag list; add it there once this sprint starts).
- **Rollback strategy:** Disable flag; existing admin reporting pages remain the source of truth for executives until this is approved.
- **Estimated complexity:** Medium-High.
- **Estimated duration:** 2–3 weeks.
- **Dependencies:** Sprint F, Sprint I, Sprint K.
- **Acceptance criteria:** Dashboard loads under a defined latency budget (e.g., <2s) using cached aggregations, not live heavy queries; client health scores are computed from real signals (activity, payment history, support tickets) not placeholder logic; heatmap reflects actual operational data.

---

### Sprint M — Events Platform (Guest Management, QR Ticketing, Wallet Passes)

- **Goal:** Build the entire Events department — guest management, QR ticketing, Apple/Google Wallet pass issuance.
- **Why it comes now:** This is a net-new department with no existing code to build on, and it's the largest single scope item in the backlog. It's sequenced after the foundation (security, validation, RBAC, indexing) so it's built correctly the first time rather than needing a foundation retrofit later, and after CRM redesign (Sprint I) since event guests are naturally CRM contacts.
- **Files expected to change:** New `server/domains/events/` domain (models, routes, domain logic), new `client/src/pages/events/` (guest list, check-in, ticket design), wallet pass generation service (extends whatever QMeet's identity/QR infrastructure already provides — needs the QR Identity audit from §22 of the audit report completed first as a sub-task).
- **Database impact:** Additive — new `events`, `event_guests`, `event_tickets` collections.
- **API impact:** New endpoints only (`/api/events/*`).
- **Feature flag:** `EVENTS_V2` (already reserved in `replit.md`).
- **Rollback strategy:** Disable flag; feature is entirely new, so disabling means the department simply isn't visible — zero impact on existing systems.
- **Estimated complexity:** High (new domain, new UI, wallet pass generation is a nontrivial integration).
- **Estimated duration:** 4–5 weeks.
- **Dependencies:** Sprint H (RBAC), Sprint I (CRM contacts).
- **Acceptance criteria:** An event can be created, guests invited and tracked, QR tickets generated and scanned at check-in, and a wallet pass issued and verified on at least one real Apple Wallet device.

---

### Sprint N — Brand Center / Company Presentation

- **Goal:** Apple-Keynote-style scroll presentation experience and case study library.
- **Why it comes now:** Purely additive, no dependency on any backend domain work — could technically run any time, but sequenced last among the "new department" sprints because it's marketing-facing polish rather than platform capability, and the team's foundation + core department capacity should go to Sprints A–M first.
- **Files expected to change:** New `client/src/pages/BrandCenter.tsx` (or similar), new scroll-driven animation components, case study content models.
- **Database impact:** Additive — optional `case_studies` collection, or could be static content depending on final design.
- **API impact:** New read-only endpoints if case studies are DB-backed; none if static.
- **Feature flag:** Suggest `BRAND_CENTER_V1` (new — add to `replit.md`'s flag list).
- **Rollback strategy:** Disable flag or simply don't link to the page; zero risk to existing systems.
- **Estimated complexity:** Medium (mostly frontend/animation work).
- **Estimated duration:** 1–2 weeks.
- **Dependencies:** None functionally; scheduled last by priority, not by technical blocking.
- **Acceptance criteria:** Presentation scrolls smoothly on target devices, case study library displays at least the initial content set, page passes the SEO coverage bar established in Sprint G.

---

### Sprint O — Native WhatsApp Device Manager (QAdmin)

- **Goal:** Replace wa.me-link-only WhatsApp CRM with a real device manager (Baileys or equivalent), message queues, delivery receipts.
- **Why it comes now:** Sequenced last because it's the highest external-integration risk (WhatsApp Business API / unofficial library terms-of-service considerations) and benefits from every other domain (CRM contacts, RBAC, validation) already being in place before wiring a live messaging channel into them.
- **Files expected to change:** New `server/domains/whatsapp/` domain, new QAdmin device-manager UI, message queue infrastructure (likely reusing the event bus from Sprint 002's infrastructure layer).
- **Database impact:** Additive — new `whatsapp_sessions`, `whatsapp_message_queue` collections.
- **API impact:** New endpoints only (`/api/whatsapp/*`); existing wa.me template feature remains as a fallback/parallel path.
- **Feature flag:** Suggest `WHATSAPP_DEVICE_MANAGER_V1` (new — add to `replit.md`'s flag list).
- **Rollback strategy:** Disable flag; wa.me link generation (current production path) continues working untouched.
- **Estimated complexity:** High (external integration reliability, session/device state management).
- **Estimated duration:** 3–4 weeks.
- **Dependencies:** Sprint H (RBAC for QAdmin access), Sprint I (CRM contacts as message recipients).
- **Acceptance criteria:** A device can be paired via QR, messages queue and send reliably with delivery receipts, and the existing wa.me template flow continues to work unaffected with the flag off.

---

## Summary dependency graph

```
A (Critical Security)
 └─ B (High Security)
     ├─ C (Validation Wiring)
     │   └─ D (Email Domain Completion)
     │       └─ E (Route/Model Extraction)
     │           └─ F (DB Indexing)
     ├─ H (RBAC + 2FA)  ← also needs E for easier retrofit
     │   ├─ I (CRM Redesign)
     │   │   ├─ K (AI Platform V2)
     │   │   ├─ M (Events Platform)
     │   │   └─ O (WhatsApp Device Manager)
     │   ├─ J (Employee Workspace)
     │   └─ L (Executive Dashboard) ← also needs F, I, K
     └─ (parallel, no dependents) G (SEO Foundation)
N (Brand Center) — independent, schedule by capacity
```

**Immediate next action:** Start Sprint A. Do not start Sprint I (CRM redesign / the originally-requested "Sprint 009") until B, C, and H are closed — starting it earlier means building new CRM surface on top of a still-open NoSQL injection vector and uncentralized permissions.
