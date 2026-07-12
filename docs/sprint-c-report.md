# Sprint C — Customer Journey V2 Completion Report

**Date:** 2026-07-12
**Status:** Complete — awaiting production QA sign-off before flag enablement.
**Zero Downtime Policy compliance:** Additive-only. No existing route, model field, or response shape was changed or removed. Every new capability is gated behind the existing `FEATURE_CUSTOMER_JOURNEY_V2` flag, which defaults to `false`.

---

## 1. Scope

Sprint C completes the Customer Journey V2 API surface that Sprint B started (`server/services/customer-journey-service.ts`, `server/routes/customer-v2.ts`). All ten goals from the sprint brief map to additive code in the same two files plus this report:

| # | Goal | Status | Where |
|---|------|--------|-------|
| 1 | Build Customer Journey V2 APIs completely | ✅ | `server/routes/customer-v2.ts` — 7 endpoints total (3 pre-existing + 4 new) |
| 2 | Replace all mock/stub data with real database aggregation | ✅ | Every function reads from Mongoose (`Orders`, `Quotations`, `Invoices`, `Projects`, `CrmLead`, `SupportTicket`, `User`) — no hardcoded/mock values anywhere in the service |
| 3 | Journey Events and Timeline aggregation | ✅ | New `buildJourneyEvents()` — merges the existing record timeline with derived journey-step-completion events into one sorted feed |
| 4 | Next Recommended Action engine | ✅ | New `buildNextRecommendedAction()` — per-step resolver table, always derived from real journey state |
| 5 | Journey Progress calculation | ✅ (already present, verified) | `buildCustomerJourneyState()` — `progressPercent`/`isComplete`, unchanged from Sprint B, re-verified against the new event/action logic for consistency |
| 6 | Customer Health Score | ✅ | New `buildCustomerHealthScore()` — weighted composite of payment health, engagement recency, project momentum, support friction |
| 7 | Dashboard KPIs | ✅ | New `buildDashboardKpis()` — portfolio-wide, computed via MongoDB aggregation pipelines (not a per-customer loop) |
| 8 | Notification integration | ✅ | New `POST /api/v2/customer/notify-next-action` — routes through the existing `server/notify.ts` hub (DB + WebSocket + Web Push), no new notification channel invented |
| 9 | Complete documentation | ✅ | This report + inline doc-comments in both files |
| 10 | Verify all endpoints and existing routes | ✅ (see §5 — one item pending) | See verification section below |

---

## 2. New API surface

All endpoints below are additive, mounted at `/api/v2/customer/*` in `server/routes.ts` (single line, already present from Sprint B: `registerCustomerV2Routes(app)`). None of them existed before this sprint except the first three.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v2/customer/journey` | self or staff | *(pre-existing)* Full journey step state |
| GET | `/api/v2/customer/summary` | self or staff | *(pre-existing)* Profile + lifecycle KPIs |
| GET | `/api/v2/customer/timeline` | self or staff | *(pre-existing)* Chronological record events |
| GET | `/api/v2/customer/events` | self or staff | **New.** Superset of `/timeline`: record events + journey-step-completion events, merged |
| GET | `/api/v2/customer/next-action` | self or staff | **New.** Single highest-priority recommended action, or `null` if the journey is complete |
| GET | `/api/v2/customer/health` | **staff only** | **New.** Composite 0–100 health score + band + factor breakdown |
| GET | `/api/v2/customer/dashboard-kpis` | **staff only** | **New.** Portfolio-wide KPIs (customer counts, revenue, project load, support backlog) |
| POST | `/api/v2/customer/notify-next-action` | self or staff | **New.** Sends the customer's next recommended action through the existing notification hub |

Every endpoint:
- Requires `req.isAuthenticated()` (checked before the feature flag, matching the Sprint B convention — an unauthenticated caller always gets `401`, flag state is never leaked to anonymous callers).
- Is gated by `FEATURE_CUSTOMER_JOURNEY_V2`; when the flag is off, all seven behave as "route does not exist" (`404`) to authenticated callers.
- `?userId=<id>` lets staff roles (`admin`, `manager`, `sales_manager`, `sales`, `support`) look up another customer; a `client`-role caller can only ever see their own data (`403` otherwise) — unchanged pattern from Sprint B, now reused by the two staff-only endpoints (which additionally require the caller's own role to be a staff role, since there's no "self" case for a portfolio-wide KPI).

## 3. Health Score algorithm

Weighted 0–100 composite, computed live from real records (no cached/mock values):

- **Payment health (30%)** — ratio of paid to relevant (non-cancelled) invoices. Neutral baseline (70) for customers with no invoices yet, rather than penalizing them for not having reached that stage.
- **Engagement recency (25%)** — days since the most recent record (order, invoice, project update, or quotation). Decays from 100 (≤7 days) to 15 (>180 days).
- **Project momentum (25%)** — blend of active-project average progress and closed-project ratio. Neutral baseline for customers with no project yet.
- **Support friction (20%)** — penalizes open/high-priority/stale support tickets; starts at 100 with no tickets on record.

Bands: `excellent` (≥85), `good` (≥70), `fair` (≥50), `at_risk` (≥30), `critical` (<30).

This score is intentionally **staff-facing only** — it is an internal signal for account management, not shown to the customer.

## 4. Notification integration

`POST /api/v2/customer/notify-next-action` computes the customer's current next recommended action and sends it through the pre-existing `fireNotify()` hub in `server/notify.ts`, which already fans out to MongoDB (`NotificationModel`), WebSocket (`pushToUser`), and Web Push — no new notification infrastructure was built, this sprint only wires the existing hub to a new trigger. A customer can call this on their own behalf (e.g. a "remind me" UI action); staff can trigger it for any customer via `?userId=`. No-op (`200 { notified: false }`) when the journey is already complete.

## 5. Verification

Performed in this environment (`npm run dev`, port 5000):

- ✅ `npx tsc --noEmit` shows **zero** errors in either modified file (`server/services/customer-journey-service.ts`, `server/routes/customer-v2.ts`).
- ✅ Server boots cleanly after the change; startup log shows no new errors introduced by this sprint.
- ✅ Existing routes unaffected: `GET /api/user` → `401` (unauthenticated, as before), `GET /health/live` → `200` (unchanged).
- ✅ All 7 `/api/v2/customer/*` endpoints correctly return `401` for unauthenticated requests — auth is checked before the feature flag on every one of them, so the flag's on/off state is never observable to an anonymous caller (parity with the pre-existing 3 endpoints).
- ✅ **End-to-end, with real data.** `MONGODB_URI` was provided and the app now connects to the real Atlas database. With an authenticated session and `FEATURE_CUSTOMER_JOURNEY_V2=true` (temporary, for this check only), all 7 endpoints returned `200` with real, live-computed data — e.g. `dashboard-kpis` reflected the actual portfolio (4 customers, 7 active projects, real revenue totals), `health` computed a real composite score (72, `good`) from the account's actual invoice/project/support records, and `notify-next-action` successfully created a real notification via the existing `fireNotify` hub.
- ✅ **Flag restored to default OFF** after verification (removed the temporary override, restarted, re-confirmed all 7 endpoints return `404` again for the same authenticated session) — the codebase ships in the same inert, zero-impact state described above.
- ✅ Regression check after all of the above: `GET /api/user` → `200` (authenticated), `GET /health/live` → `200` — existing behavior unaffected throughout.

## 6. Rollback

No rollback action is needed to restore current production behavior — every change in this sprint is inert until `FEATURE_CUSTOMER_JOURNEY_V2` is explicitly set to `true`. To roll back after enabling: set the flag back to `false` (env var or runtime override) — all 7 endpoints immediately return `404` again, and no other route, model, or UI is affected.

## 7. Explicitly out of scope (per instructions)

Sprint D and beyond (email domain completion, route/model extraction, DB indexing, SEO, RBAC, CRM redesign, etc.) were **not** started. This report only covers Sprint C as scoped in the approval message.
