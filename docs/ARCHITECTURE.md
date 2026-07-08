# ARCHITECTURE.md — QIROX System Architecture Audit

> **Mode:** Audit only. No fixes. Document every issue.
> **Date:** 2026-07-08

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                  │
│  React 18 + Vite + Wouter + TanStack Query           │
│  Shadcn/ui + Tailwind + Framer Motion                │
│  166 pages, Arabic RTL, bilingual                    │
└────────────────────┬────────────────────────────────┘
                     │ HTTP / WebSocket / SSE
┌────────────────────▼────────────────────────────────┐
│                EXPRESS 5 SERVER                      │
│  server/index.ts (1,027 lines — entry point)        │
│  server/routes.ts (16,975 lines — monolith)         │
│  server/auth.ts   — Passport.js sessions            │
│  server/ai.ts     — AI tool executor (3,535 lines)  │
│  server/models.ts — Mongoose models (2,339 lines)   │
│  server/sandbox-routes.ts — IDE backend             │
│  server/qmeet.ts  — WebRTC signaling                │
│  server/ws.ts     — WebSocket hub                   │
└──────────┬─────────────┬──────────────┬─────────────┘
           │             │              │
    ┌──────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
    │  MongoDB    │ │ PostgreSQL│ │  File System│
    │  (Atlas)    │ │ (Drizzle) │ │  uploads/   │
    │  Primary DB │ │ Limited   │ │  sandbox-   │
    └─────────────┘ └──────────┘ │  projects/  │
                                  └─────────────┘
```

---

## 2. Module Map

| File | Role | Lines | Issues |
|---|---|---|---|
| `server/index.ts` | App bootstrap, middleware, server setup | 1,027 | Acceptable size |
| `server/routes.ts` | ALL API routes | 16,975 | **CRITICAL: monolith** |
| `server/auth.ts` | Passport.js, session, OAuth | ~400 | Hardcoded secret |
| `server/ai.ts` | AI tool executor, OpenAI/Kimi proxy | 3,535 | Heavy `any` usage |
| `server/models.ts` | All Mongoose models | 2,339 | All in one file |
| `server/sandbox-routes.ts` | IDE sandbox API | 1,296 | exec() risk |
| `server/sandbox-runner.ts` | Process spawner | 207 | execSync usage |
| `server/email.ts` | SMTP2GO email sender | 1,314 | Acceptable |
| `server/email-marketing.ts` | Campaign sender | 618 | Acceptable |
| `server/qmeet.ts` | WebRTC signaling server | 1,193 | Acceptable |
| `server/ws.ts` | WebSocket hub | 275 | Acceptable |
| `server/pdf.ts` | PDF generation | 486 | Acceptable |
| `server/connection-manager.ts` | Live DB switching | 209 | Regex URI risk |
| `server/paypal.ts` | PayPal SDK wrapper | 188 | Acceptable |
| `server/storage.ts` | IStorage interface | 615 | Acceptable |
| `server/deployment-cloud.ts` | DeploymentCloud feature | 1,018 | Acceptable |
| `server/crm.ts` | CRM helpers | 162 | Acceptable |
| `server/mail-imap.ts` | IMAP reader | 455 | Acceptable |
| `server/changelog.ts` | Changelog manager | 367 | Acceptable |
| `server/cpanel.ts` | cPanel API wrapper | 224 | Acceptable |
| `server/cron.ts` | Scheduled jobs | ~150 | Hardcoded fallback |
| `server/cache.ts` | In-memory cache | ~100 | Acceptable |
| `server/notify.ts` | Push notification sender | ~150 | Acceptable |
| `server/atlas.ts` | MongoDB Atlas admin API | ~100 | Acceptable |

---

## 3. Request Flow

```
Browser → Vite Dev Server (proxy) → Express
                                      │
                            auth middleware (Passport session)
                                      │
                            route handler (server/routes.ts)
                                      │
                      Mongoose model query → MongoDB Atlas
                                      │
                            JSON response
```

**Issues in this flow:**
- No rate limiting middleware documented
- No request validation middleware (Zod is used per-route manually)
- No centralized error handler observed — each route handles errors individually

---

## 4. Architecture Issues (Audit)

### ISSUE-ARCH-001
- **File:** `server/routes.ts`
- **Problem:** Single file with 16,975 lines handles all 632+ API endpoints across every feature domain. No modular separation.
- **Risk:** Impossible to audit security middleware coverage. Any change risks breaking unrelated routes. Circular logic risk is high. Developer cognitive load is extreme.
- **Recommendation:** Split into feature modules: `routes/auth.ts`, `routes/finance.ts`, `routes/crm.ts`, etc.
- **Priority:** CRITICAL

### ISSUE-ARCH-002
- **File:** `server/models.ts`
- **Problem:** All Mongoose models (40+ estimated) live in a single 2,339-line file.
- **Risk:** High merge conflict risk. Difficult to add indexes or validators without affecting unrelated models.
- **Recommendation:** Split into `models/user.model.ts`, `models/invoice.model.ts`, etc.
- **Priority:** HIGH

### ISSUE-ARCH-003
- **File:** `server/routes.ts:3543`
- **Problem:** `ClientApiKeyModel.findByIdAndUpdate(...).exec().catch(() => {})` — silent failure swallowing.
- **Risk:** API key usage tracking silently fails. No log, no alert. Could mask DB connectivity issues.
- **Recommendation:** Log the error at minimum: `.catch((e) => logger.error('API key update failed', e))`.
- **Priority:** MEDIUM

### ISSUE-ARCH-004
- **File:** `server/connection-manager.ts`
- **Problem:** MongoDB URI is manipulated via `replace()` regex to switch between primary and secondary databases at runtime.
- **Risk:** If the URI format deviates from expected (e.g., SRV format vs standard), the regex produces a malformed URI and silently connects to the wrong DB or crashes.
- **Recommendation:** Parse URIs with the `mongodb` driver's URL parser rather than string regex manipulation.
- **Priority:** HIGH

### ISSUE-ARCH-005
- **File:** `server/ai.ts` (3,535 lines)
- **Problem:** AI tool executor, OpenAI proxy, Kimi proxy, video generation proxy, and image generation all live in one file.
- **Risk:** High complexity. A bug in one AI provider crashes the entire AI module. Hard to test.
- **Recommendation:** Split into `ai/openai.ts`, `ai/kimi.ts`, `ai/tools.ts`, `ai/video.ts`.
- **Priority:** MEDIUM

### ISSUE-ARCH-006
- **File:** `uploads/` directory
- **Problem:** User-uploaded files (images, PDFs, documents) stored on local disk — not a CDN or object storage.
- **Risk:** In a multi-instance deployment, replicas do not share the uploads directory. Files uploaded to instance A are not accessible from instance B. Data loss risk on deployment restart.
- **Recommendation:** Migrate to object storage (e.g., Cloudflare R2, AWS S3, or Replit Object Storage).
- **Priority:** HIGH

### ISSUE-ARCH-007
- **File:** `drizzle.config.ts`
- **Problem:** Drizzle (PostgreSQL) config exists and throws if `DATABASE_URL` is missing. `shared/schema.ts` defines a PostgreSQL schema. The main app uses MongoDB.
- **Risk:** Confusion about which database is authoritative. `npm run db:push` will fail unless PostgreSQL is provisioned. Features may be implemented against the wrong DB.
- **Recommendation:** Document clearly which features use PostgreSQL vs MongoDB. If PostgreSQL is unused, remove Drizzle config to avoid confusion.
- **Priority:** MEDIUM

### ISSUE-ARCH-008
- **File:** `server/sandbox-runner.ts`
- **Problem:** Uses `spawn` and `execSync` to manage child processes for sandbox IDE.
- **Risk:** If process cleanup fails, zombie processes accumulate on the host. On Replit, this could exhaust process limits.
- **Recommendation:** Implement a process registry with timeout-based cleanup. Log spawn/kill events.
- **Priority:** MEDIUM

---

## 5. Data Flow Diagrams

### Authentication Flow
```
POST /api/login
  → passport.authenticate('local')
  → bcrypt.compare(password, hash)
  → req.session saved to MongoDB (connect-mongo)
  → session cookie returned
```

### AI Request Flow
```
POST /api/ai/chat
  → auth check
  → OPENAI_API_KEY? → GPT-4o
  → MOONSHOT_API_KEY? → Kimi
  → neither? → error
  → tool executor (server/ai.ts)
  → Mongoose model operations
  → SSE stream response
```

### Sandbox Flow
```
POST /api/sandbox/build
  → auth check (developer/admin role)
  → exec(buildCmd, { cwd: projectDir, env: envVars })  ← RISK: user-influenced
  → stdout/stderr streamed back
```

---

## 6. Missing Architecture Components

| Component | Status | Risk |
|---|---|---|
| Centralized error handler | NOT FOUND | Inconsistent error responses |
| Request validation middleware | NOT FOUND (per-route manual) | Omission-prone |
| Rate limiting | NOT FOUND in main routes | DDoS / abuse risk |
| Structured logging | NOT FOUND (console.log) | Production observability zero |
| Health check endpoint | NOT AUDITED | Deployment monitoring blind |
| Circuit breaker (DB/AI) | NOT FOUND | Cascading failure risk |
