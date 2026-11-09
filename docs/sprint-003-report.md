# Sprint 003 — Customer Journey V2 Foundation
## Report

**Sprint:** 003  
**Date:** 2026-07-11  
**Policy:** Additive-only. Zero downtime. All new code gated behind Feature Flags (both `false` by default).

---

## Architecture Created

### Feature Module: `client/src/features/customer-journey/`

The Sprint 003 feature follows a strict layered architecture with no business logic inside UI components:

```
client/src/features/customer-journey/
├── index.ts                         ← Barrel — single import surface
├── types.ts                         ← All TypeScript types & interfaces
├── constants.ts                     ← Step Registry (11 steps), query keys, flag names
│
├── engine/                          ← Pure functions — no React, no side effects
│   ├── journey-engine.ts            ← State machine (transitions, serialisation)
│   ├── progress-engine.ts           ← Progress computation, milestones
│   ├── cta-engine.ts                ← CTA resolver per step + status
│   └── checklist-engine.ts          ← Per-step checklist builder & toggler
│
├── context/
│   └── journey-context.tsx          ← React context, useReducer, sessionStorage persistence
│
├── hooks/
│   ├── use-journey.ts               ← Primary consumer hook (state + actions)
│   └── use-feature-flags.ts         ← Fetches FEATURE_* flags via /api/public/feature-flags
│
├── components/
│   ├── JourneyShell.tsx             ← Feature-flag guard + JourneyProvider wrapper
│   ├── WelcomeExperience.tsx        ← Animated first-screen welcome component
│   ├── ProgressTimeline.tsx         ← Visual 11-step timeline with animated progress bar
│   └── EmptyState.tsx               ← Reusable empty states for all Dashboard V2 sections
│
└── dashboard/
    ├── DashboardV2.tsx              ← Dashboard V2 shell (route: /dashboard-v2)
    └── sections/                    ← 11 modular placeholder sections
        ├── WelcomeSection.tsx
        ├── ProgressSection.tsx
        ├── NextActionSection.tsx
        ├── ActiveProjectsSection.tsx
        ├── TasksSection.tsx
        ├── FilesSection.tsx
        ├── QuotationsSection.tsx
        ├── InvoicesSection.tsx
        ├── MeetingsSection.tsx
        ├── NotificationsSection.tsx
        └── SupportSection.tsx
```

### Server: Infrastructure Layer

```
server/infrastructure/
├── feature-flags.ts    ← FeatureFlagEngine class (env → override → default priority chain)
├── bootstrap.ts        ← DI container registration of FeatureFlagEngine
├── health.ts           ← /api/health exposes flag snapshot
└── index.ts            ← Re-exports for server consumers
```

### Server: Public API Endpoint

```
server/index.ts  →  GET /api/public/feature-flags
```
- No auth required (public read)
- Returns full flag snapshot from the DI container, with env-var fallback
- Consumed by `useFeatureFlags()` on the client

### Client: Routing

```
client/src/App.tsx
  └── Route /dashboard-v2  →  G_DashboardV2()
        └── DashboardV2Guard (FEATURE_DASHBOARD_V2 check)
              └── <DashboardV2 /> (lazy-loaded)
```

---

## Journey Engine Design

### State Machine

| Transition | Conditions | Effect |
|---|---|---|
| `locked → available` | All `dependsOn` steps completed/skipped | Automatic on sibling completion |
| `available → in_progress` | Step becomes active | Timestamp recorded |
| `in_progress → completed` | `advanceStep()` called | Unlocks dependants, advances pointer |
| `any → skipped` | `skipStep()` (skippable steps only) | Same unlock behaviour as completed |

### Step Registry — All 11 Steps

| # | ID | Arabic | English | Icon | Skippable |
|---|---|---|---|---|---|
| 1 | `welcome` | مرحباً بك | Welcome | Sparkles | No |
| 2 | `discover_services` | اكتشف الخدمات | Discover Services | Search | No |
| 3 | `configure_project` | تهيئة المشروع | Configure Project | Settings2 | No |
| 4 | `review_proposal` | مراجعة العرض | Review Proposal | FileText | No |
| 5 | `payment` | الدفع | Payment | CreditCard | No |
| 6 | `project_kickoff` | انطلاق المشروع | Project Kickoff | Rocket | No |
| 7 | `production` | مرحلة التنفيذ | Production | Layers | No |
| 8 | `client_review` | مراجعة العميل | Client Review | Eye | No |
| 9 | `delivery` | التسليم | Delivery | PackageCheck | No |
| 10 | `support` | الدعم | Support | Headphones | Yes |
| 11 | `loyalty` | برنامج الولاء | Loyalty | Crown | Yes |

---

## Files Created

### New Files (Sprint 003 only)

| File | Purpose |
|---|---|
| `client/src/features/customer-journey/types.ts` | All TypeScript types and interfaces |
| `client/src/features/customer-journey/constants.ts` | Step registry, query keys, flag constants |
| `client/src/features/customer-journey/index.ts` | Public barrel export |
| `client/src/features/customer-journey/engine/journey-engine.ts` | Journey state machine |
| `client/src/features/customer-journey/engine/progress-engine.ts` | Progress computation & milestones |
| `client/src/features/customer-journey/engine/cta-engine.ts` | CTA resolver |
| `client/src/features/customer-journey/engine/checklist-engine.ts` | Checklist builder & toggler |
| `client/src/features/customer-journey/context/journey-context.tsx` | React context + reducer |
| `client/src/features/customer-journey/hooks/use-feature-flags.ts` | Feature flags hook |
| `client/src/features/customer-journey/hooks/use-journey.ts` | Primary journey consumer hook |
| `client/src/features/customer-journey/components/JourneyShell.tsx` | Feature-flag guard components |
| `client/src/features/customer-journey/components/WelcomeExperience.tsx` | Animated welcome screen |
| `client/src/features/customer-journey/components/ProgressTimeline.tsx` | Visual step timeline |
| `client/src/features/customer-journey/components/EmptyState.tsx` | Empty state component + 8 presets |
| `client/src/features/customer-journey/dashboard/DashboardV2.tsx` | Dashboard V2 shell |
| `client/src/features/customer-journey/dashboard/sections/WelcomeSection.tsx` | Welcome section placeholder |
| `client/src/features/customer-journey/dashboard/sections/ProgressSection.tsx` | Progress timeline section |
| `client/src/features/customer-journey/dashboard/sections/NextActionSection.tsx` | CTA Engine section |
| `client/src/features/customer-journey/dashboard/sections/ActiveProjectsSection.tsx` | Active projects placeholder |
| `client/src/features/customer-journey/dashboard/sections/TasksSection.tsx` | Tasks placeholder |
| `client/src/features/customer-journey/dashboard/sections/FilesSection.tsx` | Files placeholder |
| `client/src/features/customer-journey/dashboard/sections/QuotationsSection.tsx` | Quotations placeholder |
| `client/src/features/customer-journey/dashboard/sections/InvoicesSection.tsx` | Invoices placeholder |
| `client/src/features/customer-journey/dashboard/sections/MeetingsSection.tsx` | Meetings placeholder |
| `client/src/features/customer-journey/dashboard/sections/NotificationsSection.tsx` | Notifications placeholder |
| `client/src/features/customer-journey/dashboard/sections/SupportSection.tsx` | Support placeholder |
| `server/infrastructure/feature-flags.ts` | Server-side FeatureFlagEngine |
| `server/infrastructure/bootstrap.ts` | DI container + flag registration |
| `server/infrastructure/health.ts` | Health endpoint with flag snapshot |
| `server/infrastructure/index.ts` | Infrastructure barrel export |

### Files Modified (additive only)

| File | Change |
|---|---|
| `server/index.ts` | Added `GET /api/public/feature-flags` endpoint; imported infrastructure |
| `client/src/App.tsx` | Added lazy import of `DashboardV2`; added `DashboardV2Guard`; registered `/dashboard-v2` route |

---

## Feature Flags

| Flag | Default | Environment Variable | Effect |
|---|---|---|---|
| `FEATURE_CUSTOMER_JOURNEY_V2` | `false` | `FEATURE_CUSTOMER_JOURNEY_V2=true` | Enables `JourneyShell` — activates new journey flow |
| `FEATURE_DASHBOARD_V2` | `false` | `FEATURE_DASHBOARD_V2=true` | Enables `DashboardV2Guard` — shows `/dashboard-v2` |

Both flags default to `false`. Setting either to `true` via environment variable activates the corresponding feature with no code changes or redeployment.

**Flag evaluation priority (server):** Runtime override → Environment variable → Hard default (`false`).

**Flag delivery (client):** `GET /api/public/feature-flags` → `useFeatureFlags()` hook → React Query cache (5 min stale time).

---

## Verification

### Production Still Runs
✅ Server starts on port 5000, MongoDB connected.  
✅ Homepage (`/`) renders correctly — confirmed via screenshot.  
✅ Service worker registered, no runtime errors.

### Existing Customer Flow Unchanged
✅ No modifications to any existing page component.  
✅ No modifications to any existing API route.  
✅ No modifications to existing `Dashboard.tsx`.  
✅ Route `/dashboard` continues to load the existing dashboard.

### Existing APIs Unchanged
✅ Zero modifications to existing route handlers in `server/routes.ts`.  
✅ New endpoint `GET /api/public/feature-flags` is purely additive.

### Existing Database Unchanged
✅ No new Mongoose models created.  
✅ No new Drizzle schema changes.  
✅ No collection or table renames.  
✅ Journey state stored in `sessionStorage` on the client — no DB writes.

### Feature Flags Both Disabled
✅ `FEATURE_CUSTOMER_JOURNEY_V2=false` — `JourneyShell` renders its `fallback` (existing production UI).  
✅ `FEATURE_DASHBOARD_V2=false` — `DashboardV2Guard` renders its `fallback` (existing dashboard).  
✅ Confirmed via `server/infrastructure/feature-flags.ts` hard defaults.

### Zero Downtime Confirmed
✅ All new code is import-only at startup (lazy-loaded via React `lazy()`).  
✅ No database migrations.  
✅ No breaking changes to existing APIs or UI.

---

## Rollback Strategy

### If a flag causes unexpected behaviour
1. Remove the environment variable (`FEATURE_CUSTOMER_JOURNEY_V2` or `FEATURE_DASHBOARD_V2`).
2. Restart the server — the flag engine reads env vars at startup.
3. Both flags default to `false` without the env var — full rollback in < 30 seconds.

### If code must be reverted entirely
1. The entire Sprint 003 surface is isolated to:
   - `client/src/features/customer-journey/` (new directory — safe to delete)
   - Three additive lines in `server/index.ts` (infrastructure import + feature-flags route)
   - Two additive lines in `client/src/App.tsx` (route + lazy import)
2. Revert those three files to their pre-sprint state. No DB changes to undo.

---

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Journey state only in `sessionStorage` — lost on tab close | Low (arch only, not active) | Sprint 004 should add server-side persistence |
| Feature flag polling every 5 min — stale during flag changes | Low | Acceptable for a flag system; reduce stale time in Sprint 004 if needed |
| `JourneyShell` renders `null` while flags load — brief layout blank | Low | Already guarded with `isLoading` check; acceptable for beta |
| Dashboard V2 sections are placeholder-only — no real data | By design | Sprint 004 will wire real API data per section |

---

## Next Sprint Recommendation (Sprint 004)

**Goal:** Wire Dashboard V2 sections to real API data.

**Scope:**
1. Connect `ActiveProjectsSection`, `InvoicesSection`, `QuotationsSection`, `TasksSection`, `FilesSection` to existing API endpoints — these APIs already exist.
2. Add server-side journey state persistence (MongoDB): a `customerJourneyState` field on the user document or a dedicated `journey_states` collection.
3. Wire `JourneyContext` to save/restore from server on session start, replacing the `sessionStorage`-only approach.
4. Activate `FEATURE_DASHBOARD_V2=true` in the staging environment for internal testing.

**Pre-conditions:** Sprint 003 must remain merged and stable. Sprint 004 is additive on top of Sprint 003.
