# Sprint 003 — Customer Journey V2 Foundation

**Date:** July 11, 2026
**Sprint type:** Architecture & scaffolding — additive only
**Expected downtime:** ZERO

---

## Architecture Created

### Feature directory

```
client/src/features/customer-journey/
├── index.ts                          ← Barrel export (single import point)
├── types.ts                          ← All TypeScript types and interfaces
├── constants.ts                      ← Step registry, flag names, query keys
│
├── engine/
│   ├── journey-engine.ts             ← Pure state machine (no React)
│   ├── progress-engine.ts            ← Progress computation + milestones
│   ├── cta-engine.ts                 ← CTA resolution per step/status
│   └── checklist-engine.ts          ← Per-step checklist management
│
├── context/
│   └── journey-context.tsx           ← React context + reducer + provider
│
├── hooks/
│   ├── use-journey.ts                ← Primary consumer hook (+ useJourneyStep)
│   └── use-feature-flags.ts         ← Feature flag hook (queries /api/public/feature-flags)
│
├── components/
│   ├── JourneyShell.tsx              ← Feature guard + provider wrapper
│   ├── WelcomeExperience.tsx         ← Welcome step UI
│   ├── ProgressTimeline.tsx          ← Full 11-step visual timeline
│   └── EmptyState.tsx               ← Reusable empty states + 8 presets
│
└── dashboard/
    ├── DashboardV2.tsx               ← New dashboard shell (route: /dashboard-v2)
    └── sections/
        ├── WelcomeSection.tsx
        ├── ProgressSection.tsx
        ├── NextActionSection.tsx     ← CTA Engine output
        ├── ActiveProjectsSection.tsx
        ├── TasksSection.tsx
        ├── FilesSection.tsx
        ├── QuotationsSection.tsx
        ├── InvoicesSection.tsx
        ├── MeetingsSection.tsx
        ├── NotificationsSection.tsx
        └── SupportSection.tsx
```

---

## Customer Journey Steps (11 total)

| # | Step ID | Label (AR) | Skippable | Depends On |
|---|---|---|---|---|
| 1 | `welcome` | مرحباً بك | No | — |
| 2 | `discover_services` | اكتشف الخدمات | No | welcome |
| 3 | `configure_project` | تهيئة المشروع | No | discover_services |
| 4 | `review_proposal` | مراجعة العرض | No | configure_project |
| 5 | `payment` | الدفع | No | review_proposal |
| 6 | `project_kickoff` | انطلاق المشروع | No | payment |
| 7 | `production` | مرحلة التنفيذ | No | project_kickoff |
| 8 | `client_review` | مراجعة العميل | No | production |
| 9 | `delivery` | التسليم | No | client_review |
| 10 | `support` | الدعم | Yes | delivery |
| 11 | `loyalty` | برنامج الولاء | Yes | support |

---

## Files Created

### Server-side

| File | Change |
|---|---|
| `server/infrastructure/feature-flags.ts` | Added `FEATURE_CUSTOMER_JOURNEY_V2` and `FEATURE_DASHBOARD_V2` flags with `false` hard defaults |
| `server/index.ts` | Added `GET /api/public/feature-flags` endpoint (no auth required, read-only) |

### Frontend — new files (26 files)

All files under `client/src/features/customer-journey/` — see architecture tree above.

---

## Files Modified

| File | Modification |
|---|---|
| `server/infrastructure/feature-flags.ts` | +2 flag constants, +2 hard defaults |
| `server/index.ts` | +1 public API endpoint for feature flags |
| `client/src/App.tsx` | +1 lazy import (`DashboardV2`), +1 guard component (`G_DashboardV2`), +1 route (`/dashboard-v2`) |

**Zero modifications to existing pages, APIs, database models, authentication, or business logic.**

---

## Feature Flags

| Flag | Default | Env var to enable |
|---|---|---|
| `FEATURE_CUSTOMER_JOURNEY_V2` | `false` | `FEATURE_CUSTOMER_JOURNEY_V2=true` |
| `FEATURE_DASHBOARD_V2` | `false` | `FEATURE_DASHBOARD_V2=true` |

Both flags are exposed via `/api/public/feature-flags` and consumed by the `useFeatureFlags` hook in the frontend.

`JourneyShell` renders `fallback` (the existing production UI) when `FEATURE_CUSTOMER_JOURNEY_V2` is off.
`DashboardV2Guard` renders `fallback` when `FEATURE_DASHBOARD_V2` is off.
The `/dashboard-v2` route exists but shows the new dashboard behind a `RoleGuard` — the existing `/dashboard` is completely untouched.

---

## Verification

### Production unchanged
- `GET /dashboard` → existing `Dashboard.tsx` — **no change**
- `GET /api/*` → all existing routes — **no change**
- `GET /api/health` → **no change**
- All database models → **no change**
- Authentication/session — **no change**

### New endpoints
- `GET /api/public/feature-flags` → `{"ok":true,"flags":{...}}` — additive, read-only
- `GET /dashboard-v2` → renders `DashboardV2` (client, manager, admin roles only)

### Feature flags confirmation
All new flags default to `false`. The system runs identically to pre-Sprint-003 with no env changes.

---

## Rollback Strategy

Sprint 003 can be fully reverted with zero production impact:

1. **Server flags:** Remove `FEATURE_CUSTOMER_JOURNEY_V2` and `FEATURE_DASHBOARD_V2` from `server/infrastructure/feature-flags.ts` hard defaults.
2. **Server endpoint:** Remove the `GET /api/public/feature-flags` handler from `server/index.ts`.
3. **Frontend:** Remove the `DashboardV2` lazy import, `G_DashboardV2` guard, and `/dashboard-v2` route from `client/src/App.tsx`. Delete `client/src/features/customer-journey/`.

No database migrations. No data changes. No existing route changes. The rollback is file-delete only.

---

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| `useFeatureFlags` adds a network request on every page load | Low | Cached 5 min by React Query; non-blocking |
| `/dashboard-v2` accessible to authenticated users even with flag off | Low | Page renders correctly but journey is placeholder; no real data wired yet |
| `JourneyState` stored in sessionStorage could conflict across tabs | Low | Each tab has its own sessionStorage; no cross-tab persistence issues |
| Engine logic untested by automated tests | Medium | Pure functions — testable in Sprint 004; no production path affected now |

---

## Next Sprint Recommendation

**Sprint 004 — Customer Journey V2: Data Wiring**

Wire the Dashboard V2 sections to real server data:
1. `ActiveProjectsSection` → existing `/api/projects` endpoint
2. `TasksSection` → existing tasks API
3. `QuotationsSection` → existing quotations API
4. `InvoicesSection` → existing invoices API
5. `MeetingsSection` → QMeet API
6. `NotificationsSection` → existing notifications
7. Persist `JourneyState` server-side (new Mongoose model, new API route)
8. Wire `JourneyEngine` transitions to real order/project lifecycle events
9. Write unit tests for the pure engine functions
10. Migrate the first cohort of clients to `FEATURE_CUSTOMER_JOURNEY_V2=true`
