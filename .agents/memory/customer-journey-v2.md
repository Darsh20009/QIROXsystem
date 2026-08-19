---
name: Customer Journey V2
description: Status of the Customer Dashboard V2 feature — flag state, API endpoints, frontend wiring, and key gotchas.
---

## Status: LIVE ✅

Both feature flags are enabled and persistent via env vars (source=env, survive restarts):
- `FEATURE_CUSTOMER_JOURNEY_V2=true`
- `FEATURE_DASHBOARD_V2=true`

## Backend (all complete)

- `server/routes/customer-v2.ts` — 7 REST endpoints, each guards on `FEATURE_CUSTOMER_JOURNEY_V2`
- `server/services/customer-journey-service.ts` — aggregates journey state from MongoDB
- `/api/v2/customer/journey` — 11-step state, source=database
- `/api/v2/customer/next-action` — server-computed recommended action with urgency
- `/api/v2/customer/summary`, `/api/v2/customer/timeline`, `/api/v2/customer/events`
- `/api/v2/client/dashboard` — KPIs, projects, orders, invoices, notifications (used by most sections)
- `/api/admin/feature-flags/override` (POST) — runtime flag toggle without restart
- `/api/admin/feature-flags/snapshot` (GET) — current flag state

## Frontend (all complete)

- Route `/dashboard-v2` registered in App.tsx, lazy-loads `DashboardV2`
- `DashboardV2.tsx` uses `JourneyV2Provider` wrapper that fetches from `/api/v2/customer/journey`, adapts server state to client `JourneyState` shape, passes as `initialState` to `JourneyProvider`
- `NextActionSection.tsx` — wired to `/api/v2/customer/next-action` (real API, not local context)
- `ProgressSection` + `ProgressTimeline` — read from `JourneyProvider` which is now hydrated with server state
- All 17 sections: most use `/api/v2/client/dashboard`, journey-dependent ones use the context which is server-backed

## Key gotchas

- Infrastructure helper is `getFlags()` NOT `getFeatureFlags()` — wrong name caused 500s
- Session cookie must be maintained within a single shell invocation when testing admin endpoints; separate curl calls lose the session
- `JourneyProvider` `initialState` prop path existed but was unused — wired via `key` prop trick: `key={isLoading ? "loading" : "ready"}` forces remount when server data arrives so reducer hydrates correctly
- The `adaptServerJourney()` function strips `order` and `userId`/`source` fields from the server shape; the client `JourneyStepState` type doesn't include `order`
- Zero-downtime: existing `/dashboard` route untouched; all V2 code gated behind flags

## What's NOT connected to V2 yet

- `/api/v2/customer/health` (staff-only endpoint) — `AccountHealthSection` uses `/api/v2/client/dashboard` healthScore instead
- `/api/v2/customer/dashboard-kpis` (staff-only) — `CustomerKPIsSection` also uses `/api/v2/client/dashboard`
- `/api/v2/customer/notify-next-action` — not surfaced in UI yet
