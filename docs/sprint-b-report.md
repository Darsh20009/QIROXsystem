# Sprint B — Customer Journey V2 Production APIs

**Date:** 2026-07-11
**Mode:** Additive only. Zero downtime. No existing route, model, DB schema, or UI behavior was changed.

> Note on naming: `docs/ROADMAP-V2-DEPENDENCY-BASED.md` labels its own second entry "Sprint B — High-Severity Security Closure." This report covers the **Sprint B objective given directly in this session** — the Customer Journey V2 backend — per explicit instruction. The roadmap's high-severity security items remain open and unscheduled by this sprint.

---

## Objective

Implement the first production-ready Customer Journey V2 APIs: a new `/api/v2/customer` namespace backed by a real journey-aggregation service, replacing the previously client-only/mock journey model with database-derived responses — backend and data contracts only, no frontend redesign.

---

## What already existed (verified before building)

- `FEATURE_CUSTOMER_JOURNEY_V2` and `FEATURE_DASHBOARD_V2` flags already existed in `server/infrastructure/feature-flags.ts`, both defaulting to `false`.
- The Customer Journey V2 **frontend** (`client/src/features/customer-journey/`) already existed from an earlier sprint, but its journey state was 100% client-side: computed by a local reducer (`journey-context.tsx`) and persisted only to `sessionStorage` — never touching the database. This is the "mock data" item 3 of the sprint objective refers to.
- `Dashboard V2` (`/dashboard-v2`, gated by `FEATURE_DASHBOARD_V2`) already had one real, database-backed endpoint: `GET /api/v2/client/dashboard` (Sprint 007), which aggregates orders/projects/invoices/etc. for the logged-in client. This established the `/api/v2/*` namespace precedent this sprint follows.
- Neither of the above was touched. `FEATURE_DASHBOARD_V2` remains exactly as it was.

---

## What was built

### 1. Journey aggregation service — `server/services/customer-journey-service.ts`

A new, framework-agnostic service module (no `req`/`res`, safe to reuse from any future caller: routes, admin/CRM views, scheduled jobs). It is read-only — it never persists journey state, it recomputes it fresh from existing collections on every call:

- `buildCustomerJourneyState(userId)` — derives real status (`locked` / `available` / `in_progress` / `completed` / `skipped`) for each of the 11 journey steps (`welcome` → `loyalty`, matching the step vocabulary already defined on the client) from actual `Order`, `Quotation`, `Invoice`, `Project`, and `CrmLead` records. Returns `activeStepId`, per-step metadata (linked order/project/invoice IDs), `progressPercent`, and `isComplete`.
- `buildCustomerSummary(userId)` — customer profile + lifecycle KPIs (orders, projects, invoices, quotations counts) plus CRM stage if a matching lead exists by email.
- `buildCustomerTimeline(userId)` — chronological list of real lifecycle events (orders, quotations, invoices, projects), newest first.

Stage-resolution logic is data-driven, e.g.:
- `payment` is `completed` once a paid invoice exists **or** an order has progressed past `pending`/`draft`.
- `production`/`client_review`/`delivery` read the most-advanced project's `status` against its existing lifecycle enum (`new → under_study → pending_payment → in_progress → testing → review → delivery → closed`).
- `support` is intentionally never `completed` once reached — it's an ongoing relationship, not a terminal step.
- `loyalty` becomes reachable after delivery but is never auto-completed (no loyalty-program data model exists yet in this codebase — flagged, not fabricated).

### 2. New API namespace — `server/routes/customer-v2.ts`

Three new, additive endpoints, mounted via `registerCustomerV2Routes(app)` from `server/routes.ts` (one new import + one new call — no existing route touched):

| Endpoint | Purpose |
|---|---|
| `GET /api/v2/customer/journey` | Real, DB-backed Customer Journey V2 state |
| `GET /api/v2/customer/summary` | Customer profile + lifecycle KPIs |
| `GET /api/v2/customer/timeline` | Chronological real lifecycle events |

**Auth & authorization:** every endpoint requires `req.isAuthenticated()` (same convention as the existing `/api/v2/client/dashboard`). A `client`-role caller only ever sees their own data; staff roles (`admin`, `manager`, `sales_manager`, `sales`, `support`) may pass `?userId=<id>` to look up another customer — mirrors the ad-hoc role checks already used throughout `server/routes.ts`.

**Feature flag gate:** all three endpoints check `FEATURE_CUSTOMER_JOURNEY_V2` (via the existing `FeatureFlagEngine`, with an env-var fallback if the DI container isn't ready yet) and return `404` when the flag is off — the namespace behaves as if it doesn't exist until explicitly enabled. This satisfies "all new functionality must be behind feature flags where applicable" for what is, functionally, new production API surface (distinct from `/api/v2/client/dashboard`, which was already live from a prior sprint and was left untouched).

### 3. Data contract

Responses are new, versioned JSON shapes, independent of any client-only type:

```jsonc
// GET /api/v2/customer/journey
{ "ok": true, "journey": {
    "version": 1, "userId": "...", "activeStepId": "project_kickoff",
    "steps": { "welcome": { "id": "welcome", "order": 1, "status": "completed", "startedAt": "...", "completedAt": "...", "meta": {} }, /* …11 steps */ },
    "progressPercent": 45, "isComplete": false, "updatedAt": "...", "source": "database"
} }

// GET /api/v2/customer/summary
{ "ok": true, "summary": { "userId": "...", "fullName": "...", "email": "...", "role": "client",
    "memberSince": "...", "crmStage": null,
    "kpis": { "totalOrders": 1, "totalProjects": 0, "activeProjects": 0, "completedProjects": 0, "totalInvoices": 0, "paidInvoices": 0, "totalQuotations": 0 } } }

// GET /api/v2/customer/timeline
{ "ok": true, "timeline": [ { "type": "order", "id": "...", "title": "...", "status": "approved", "occurredAt": "..." }, /* … */ ] }
```

This contract is intentionally decoupled from `client/src/features/customer-journey/types.ts` — the frontend integration (wiring `JourneyProvider` to fetch this instead of `sessionStorage`) is out of scope for this sprint per the "no frontend redesign yet" instruction, and is a natural next step once these APIs are approved.

---

## Verification performed

- **Compile:** `server/services/customer-journey-service.ts` and `server/routes/customer-v2.ts` — no TypeScript errors reported for either file (a full-project `tsc --noEmit` run hit a pre-existing environment memory limit unrelated to this change and was not usable as a full-repo signal).
- **Clean startup:** workflow restarted successfully; DB connected; no new errors or warnings introduced (the pre-existing `APPLE_CALLBACK_URL` config-validator warning from the prior verification pass is unchanged and unrelated).
- **Auth gate:** unauthenticated requests to all three new endpoints return `401`, identical to the existing `/api/v2/client/dashboard` behavior.
- **Existing routes untouched:** `/api/v2/client/dashboard` (`401` unauthenticated, as before), `/api/public/feature-flags`, `/health/ready`, and other spot-checked routes behave exactly as before the change.
- **Real data correctness (direct service test against the live database, bypassing HTTP):**
  - A client user with **no** orders/projects/invoices → `welcome: completed`, all other steps `locked`/`available`, `progressPercent: 9`, `activeStepId: discover_services`. Matches expectations for a brand-new customer.
  - A client user with one real order (`status: "approved"`) → `welcome`, `discover_services`, `configure_project`, `review_proposal`, and `payment` all correctly resolved to `completed` (with the real `orderId` in step metadata), `project_kickoff` became the active/available step, `progressPercent: 45`. Summary KPIs (`totalOrders: 1`) and timeline (1 real order event) matched the underlying data exactly.
- **Flag default confirmed:** `GET /api/public/feature-flags` shows `FEATURE_CUSTOMER_JOURNEY_V2: { enabled: false, source: "default" }` — the new namespace is inert in production until the flag is turned on.

---

## Files changed / added

| File | Change |
|---|---|
| `server/services/customer-journey-service.ts` | **New.** Journey/summary/timeline aggregation logic, read-only. |
| `server/routes/customer-v2.ts` | **New.** `/api/v2/customer/*` router: auth + flag gating, role-scoped access. |
| `server/routes.ts` | **Additive edit only** — one new import, one new `registerCustomerV2Routes(app)` call inside `registerRoutes()`. No existing line removed or altered. |
| `docs/sprint-b-report.md` | **New.** This report. |

No database schema changes, no changes to any existing API contract, no changes to `Dashboard V2` or its `FEATURE_DASHBOARD_V2` gating, no frontend changes.

---

## Known gaps / explicitly out of scope this sprint

- The Customer Journey V2 **frontend** still computes its own state locally (`sessionStorage`) and does not yet call these new endpoints — wiring that up is a frontend task deliberately deferred ("no frontend redesign yet").
- No loyalty-program data model exists yet, so the `loyalty` step can only ever reach `available`, never `completed`, via this service — noted in code comments rather than papered over.
- CRM-lead linkage (`crmStage` in the summary, `leadStage` in journey meta) is best-effort by email match; a customer with no matching `CrmLead` document simply gets `null` there — expected, not an error.
- Sprint A's roadmap-labelled "Sprint B" (SEC-HIGH-001 through SEC-HIGH-006) remains open and was not addressed in this session, per the user's explicit redefinition of "Sprint B" scope for this session.

Stopping here as instructed.
