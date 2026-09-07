# DEPENDENCY_GRAPH.md — QIROX Codebase Dependency Map

> **Source of truth:** docs/ARCHITECTURE.md, docs/PROJECT_STRUCTURE.md, docs/EXECUTION_PLAN.md  
> **Scope:** Module-level dependency relationships for the current codebase  
> **Status:** Documentation only — no production code modified

---

## Purpose

Document the import/dependency relationships between major modules. Identifies circular dependencies, unhealthy coupling, and the correct layering order for the refactor sprints.

---

## Layer Architecture (Desired State)

```
┌────────────────────────────────────────────────────────────┐
│                      CLIENT (React)                         │
│  Pages → Components → Hooks → lib/queryClient → shared/    │
└───────────────────────────────┬────────────────────────────┘
                                │ HTTP / WebSocket
┌───────────────────────────────▼────────────────────────────┐
│                      SERVER (Express)                        │
│  index.ts → routes/* → middleware/* → services/* → models/*│
└───────────────────────────────┬────────────────────────────┘
                                │ Mongoose
┌───────────────────────────────▼────────────────────────────┐
│                      MongoDB Atlas                           │
└────────────────────────────────────────────────────────────┘

shared/ ← imported by BOTH client and server
```

---

## Server-Side Dependency Graph (Current State)

### Entry Point
```
server/index.ts
├── express
├── express-session
├── passport
├── compression
├── helmet (if configured)
├── server/auth.ts
├── server/routes.ts         ← MONOLITH (16,975 lines)
├── server/db.ts
├── server/cron.ts
├── server/push.ts
└── server/vite.ts           (dev only)
```

### server/routes.ts Internal Dependencies
```
server/routes.ts
├── server/models.ts         ← MONOLITH (2,339 lines) — 40+ models
├── server/ai.ts             ← MONOLITH (3,535 lines)
├── server/auth.ts
├── server/storage.ts
├── server/push.ts
├── server/cron.ts
├── shared/src/schema.ts
├── shared/src/routes.ts
├── openai                   (external)
├── mongoose
├── nodemailer / smtp2go
├── paypal-rest-sdk          (external, optional)
└── multer                   (file uploads)
```

### server/models.ts Dependencies (Current Monolith)
```
server/models.ts
├── mongoose
└── (no internal server imports — good isolation)
```

### server/ai.ts Dependencies
```
server/ai.ts
├── openai
├── server/models.ts         ← pulls in full 40-model monolith
├── shared/src/schema.ts
└── (indirect) mongoose
```

---

## Server-Side Dependency Graph (Target State — Post-Refactor)

```
server/index.ts
├── server/middleware/error-handler.ts
├── server/middleware/rate-limit.ts
├── server/startup-validation.ts
├── server/logger.ts
├── server/db.ts
├── server/cron.ts
├── server/push.ts
├── server/routes/
│   ├── health.routes.ts
│   ├── auth.routes.ts
│   ├── public.routes.ts
│   ├── admin/
│   │   ├── users.routes.ts
│   │   ├── orders.routes.ts
│   │   ├── finance.routes.ts
│   │   └── ...
│   ├── client/
│   ├── employee/
│   ├── ai.routes.ts
│   ├── qmeet.routes.ts
│   ├── sandbox.routes.ts
│   └── deploy.routes.ts
└── server/vite.ts (dev)
```

Each route file imports only:
```
route.ts
├── express (Router)
├── server/middleware/require-role.ts
├── server/middleware/validate.ts
├── server/middleware/rate-limit.ts
├── server/logger.ts
├── server/models/{domain}.model.ts  ← specific model only
└── shared/src/schema.ts             ← specific schema only
```

---

## Client-Side Dependency Graph (Current State)

### Entry Point
```
client/src/main.tsx
├── client/src/App.tsx
│   ├── wouter (routing)
│   ├── @tanstack/react-query (QueryClientProvider)
│   ├── client/src/lib/queryClient.ts
│   ├── client/src/lib/i18n.tsx
│   ├── client/src/context/ThemeProvider.tsx
│   ├── client/src/context/AuthProvider.tsx
│   └── [166+ page components]
└── client/src/index.css
```

### Page Dependency Pattern (Most Pages)
```
PageComponent.tsx
├── wouter (useLocation, Link)
├── @tanstack/react-query (useQuery, useMutation)
├── client/src/lib/queryClient.ts (apiRequest, queryClient)
├── client/src/lib/i18n.tsx (useTranslation)
├── client/src/components/ui/* (shadcn components)
├── lucide-react (icons)
├── react-hook-form + zod (form pages)
└── framer-motion (animated pages)
```

### Heavy Client Dependencies (Lazy-Load Candidates)
```
client/src/pages/sandbox/SandboxIDE.tsx
├── @monaco-editor/react     ← ~2MB, MUST be lazy-loaded

client/src/pages/qmeet/QMeetRoom.tsx
├── webrtc APIs (browser native)
├── ws client

client/src/pages/admin/Analytics.tsx
├── recharts / chart libraries ← should be lazy-loaded

client/src/components/ui/ParticleCanvas.tsx
├── canvas API (browser native)
├── performance risk on mobile — must guard with device check
```

---

## Shared Module Dependencies

```
shared/src/schema.ts
├── zod
└── (no internal imports)

shared/src/routes.ts
├── (type definitions only, no runtime imports)

shared/src/errors.ts     ← DOES NOT EXIST YET (to be created in Sprint S-05)
├── (ErrorCode enum, AppError class)
```

---

## External Service Dependency Map

| Service | Used By | Required In | Graceful Degradation |
|---|---|---|---|
| MongoDB Atlas | `server/db.ts`, all models | All environments | Hard failure — 503 health check |
| OpenAI API | `server/ai.ts` | Production | 503 if key missing |
| Moonshot/Kimi API | `server/ai.ts` | Production (alt) | Falls back to OpenAI |
| SMTP2GO | `server/routes.ts` (mail) | Production | Soft fail — log error |
| PayPal REST SDK | `server/routes.ts` | Optional | 503 if secrets missing |
| VAPID (Web Push) | `server/push.ts` | Production | Notifications disabled |
| GitHub OAuth | `server/routes/deploy.ts` | Optional | Deploy panel unavailable |

---

## Circular Dependency Risks (Current State)

### Risk 1: `server/routes.ts` ↔ `server/ai.ts`
`server/routes.ts` imports `server/ai.ts` which imports handlers back from `server/routes.ts` implicitly via closures and shared model references.

**Resolution in refactor:** `server/ai.ts` becomes `server/services/ai.service.ts` with no route-level imports. AI routes in `server/routes/ai.routes.ts` import the service.

### Risk 2: `server/models.ts` — All Models in One File
No circular dependency, but monolithic file means loading any model loads all 40 models.

**Resolution in refactor:** Split into `server/models/{name}.model.ts`. Each route file imports only the models it needs.

### Risk 3: `client/src/App.tsx` — All 166 Pages Imported Statically
`App.tsx` imports every page directly, meaning the full app bundle is always loaded.

**Resolution:** Use `React.lazy()` for all page imports in `App.tsx`. Already partially addressed for Monaco.

---

## Dependency Health Indicators

| Metric | Current State | Target State |
|---|---|---|
| Largest single file (server) | 16,975 lines (routes.ts) | < 400 lines per file |
| Largest single file (models) | 2,339 lines (models.ts) | < 150 lines per model file |
| Largest single file (ai) | 3,535 lines (ai.ts) | < 600 lines per service file |
| Static page imports in App.tsx | 166+ (synchronous) | 166+ (lazy, async) |
| Test coverage | 0% (no test files) | > 80% critical paths |
| Circular dependencies | 1 high-risk (routes ↔ ai) | 0 |
| Models using transactions | 0 (wallet operations) | Wallet + financial models |

---

## Sprint-to-Dependency Mapping

| Sprint | Dependency Changed |
|---|---|
| S-00 | server/auth.ts, server/routes.ts (security patches only) |
| S-01 | New: server/logger.ts; updates console.* across all files |
| S-02 | New: server/startup-validation.ts; minor server/index.ts change |
| S-03 | server/models.ts → server/models/* (organizational split) |
| S-04 | server/routes.ts → server/routes/* (organizational split) |
| S-05 | New: server/middleware/error-handler.ts + shared/src/errors.ts |
| S-06 | New: server/middleware/validate.ts; adds validate() to route files |
| S-07 | New/verify: server/middleware/require-role.ts; adds requireRole() |
| S-08 | server/models/*.model.ts — adds index() definitions |
| S-09 | New: server/middleware/rate-limit.ts; adds limiters to route files |
| S-10 | client/src/pages/**/*.tsx — UI state additions |
| S-11 | client/src/lib/i18n.tsx — new keys; client pages — replace strings |
| S-12 | client/src/pages/*.tsx (public), vite.config.ts |
| S-13 | capacitor.config.ts, ios/, android/, client/src/App.tsx (guards) |
| S-14 | New: tests/ directory |
