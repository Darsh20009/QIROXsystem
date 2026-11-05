# Sprint 1.5 — Validation, Cleanup & Foundation Report

> **Status:** Documentation only. No code was modified.  
> **Date:** 2026-07-09  
> **Awaiting approval before any action is taken.**

---

## Task 1 — Sprint 1 Validation

### 1.1 Logo Migration

**Why changed:** Old `@assets` import path was broken after repo restructure; icons needed to live in `client/public/` to be served by Vite correctly.

**Implementation review:**
- ✅ `qirox-icon.png` and `qirox-icon-nobg.png` both exist in `client/public/`
- ✅ References updated in `App.tsx`, `ClientDashboardSimple.tsx`, nav and sidebar components
- ✅ Transparent background removes the need for CSS `invert()` hacks

**Remaining risks:**
- Both `public/` (root) and `client/public/` contain near-identical icon and post image sets. If any component references the root `/public/` path at runtime, it will silently serve stale files.

**Technical debt:**
- The root `/public/` folder has not been cleaned up, creating ambiguity about the canonical asset source.

**Recommended improvements:**
- Delete or archive the root `/public/` folder after confirming build scripts do not reference it.

---

### 1.2 WhatsApp CRM

**Why changed:** iframes to WhatsApp are blocked by browsers; direct `wa.me` deep-links are the only compliant solution.

**Implementation review (`client/src/pages/EmployeeWhatsappCRM.tsx`):**
- ✅ 6 templates implemented with `{name}` substitution (lines 133–136)
- ✅ `wa.me` link generation is correct
- ✅ Page registered in employee routes

**Remaining risks:**
- Template edits exist only in component local state — clearing the page or refreshing loses all customisation.
- No input sanitisation on `{name}` substitution; a malformed name could break the link.

**Technical debt:**
- Templates are hardcoded strings in component state, not stored in the database.

**Recommended improvements:**
- Persist templates to the database via an employee settings model.
- Sanitise the substituted name value before URL encoding.

---

### 1.3 DeploymentCloud Standalone Page

**Why changed:** The Deployment Cloud feature required its own layout to avoid EmployeeLayout chrome (sidebar, nav) interfering with the cloud IDE experience.

**Implementation review:**
- ✅ `client/src/pages/DeploymentCloud.tsx` uses standalone `CloudLayout`
- ✅ GitHub OAuth routes verified at `/api/deploy/github/oauth/*` in `server/deployment-cloud.ts`
- ✅ `UserModel` has `githubDeployToken` field in `server/models/user.ts`
- ✅ Both frontend and backend routes registered in `App.tsx`

**Remaining risks:**
- `githubDeployToken` is stored in plain text in the user document. If the MongoDB connection is compromised, all OAuth tokens are exposed.

**Technical debt:**
- Token should be encrypted at rest or stored in a dedicated secrets vault model.

**Recommended improvements:**
- Encrypt `githubDeployToken` using the existing `SANDBOX_ENC_KEY` pattern before storing in MongoDB.
- Add token expiry/refresh logic for long-lived sessions.

---

### 1.4 Pixel Tracking

**Why changed:** Marketing team required the ability to inject analytics pixels (Meta, TikTok, Snap, GA4, GTM) from the admin panel without a code deploy.

**Implementation review (`client/src/components/PixelTracking.tsx`):**
- ✅ All 5 pixel types supported
- ✅ IDs fetched from `/api/public/settings` via React Query (no auth required, correct)
- ✅ Script injection uses `document.head.appendChild` pattern with deduplication check

**Remaining risks:**
- Pixel IDs are exposed through a public unauthenticated endpoint. While the IDs themselves are not secrets, the endpoint could be probed to enumerate the tracking stack.
- No Content Security Policy (CSP) header governs the injected third-party scripts.

**Technical debt:**
- No fallback if `/api/public/settings` is slow or unavailable — pixels simply don't fire, which is acceptable but silent.

**Recommended improvements:**
- Add a `nonce`-based CSP that covers injected pixel scripts.
- Consider caching pixel IDs in localStorage with a short TTL to reduce latency on repeat visits.

---

### 1.5 QIROX Studio AI

**Why changed:** Support for two AI providers (OpenAI GPT-4o + Moonshot Kimi) with automatic fallback, video generation proxy, and image translation pipeline.

**Implementation review (`server/ai.ts`, `server/routes.ts`):**
- ✅ Provider selection logic: `MOONSHOT_API_KEY` → Kimi; `OPENAI_API_KEY` → GPT-4o
- ✅ Anti-Chinese rule embedded in all system prompts
- ✅ Video proxy at `/api/ai/video-proxy`
- ✅ Arabic → English translation step before image generation (flux+enhance pipeline)

**Remaining risks:**
- AI provider base URLs are hardcoded strings inside `server/ai.ts`. If either provider changes their endpoint, a code deploy is required.
- The "anti-Chinese" rule in system prompts is a fragile business logic constraint embedded in strings — not enforced at the schema level.

**Technical debt:**
- Provider URLs and model names should be environment variables, not hardcoded.
- No retry logic or circuit breaker on AI provider failures; a single timeout propagates as a 500 to the user.

**Recommended improvements:**
- Move `baseURL`, model IDs, and any provider-specific flags to named constants or environment variables.
- Add an exponential backoff retry (max 2 retries) for AI provider calls.

---

### 1.6 Vite Public Directory Fix

**Why changed:** Vite's `root` is set to `client/`, so its `publicDir` resolves to `client/public/`. Static files placed in the root `/public/` folder were never served in development.

**Implementation review (`vite.config.ts`):**
- ✅ `root: clientRoot` confirmed (line 52 of vite.config.ts)
- ✅ `client/public/` exists and is populated correctly

**Remaining risks:**
- Root `/public/` folder still exists and may mislead future developers about the correct asset location.

**Technical debt:**
- No `.gitignore` or `README` comment in root `/public/` warning that it is legacy.

**Recommended improvements:**
- Delete root `/public/` in the cleanup sprint or add a clear `README.md` inside it stating it is deprecated.

---

### 1.7 react-icons v5 Breaking Change Fix

**Why changed:** `SiLinkedin` was removed in react-icons v5; using it caused a runtime error.

**Implementation review:**
- ✅ `Linkedin` from `lucide-react` used in `Home.tsx`, `Footer.tsx`, `app-sidebar.tsx`
- ✅ `optimizeDeps: { exclude: ["react-icons"] }` added to `vite.config.ts`

**Remaining risks:**
- The `optimizeDeps.exclude` workaround prevents Vite from pre-bundling react-icons, which increases initial dev-server startup time slightly but avoids the named-export resolution failure.
- Other react-icons `Si*` components may have similar v5 removal issues that have not yet surfaced.

**Technical debt:**
- No audit of all `react-icons` imports across the codebase to verify v5 compatibility.

**Recommended improvements:**
- Run `grep -r "from 'react-icons" client/src/` and cross-reference against the react-icons v5 changelog to confirm no other removed icons are in use.

---

### 1.8 SEO Coverage

**Why changed:** `useSEO` hook was not updating page metadata on client-side navigation due to stale `useEffect` dependency.

**Implementation review:**
- ✅ `JSON.stringify(config)` used as dependency key — ensures all field changes trigger re-run
- ✅ Hook applied to: Home, About, Prices, Contact, Jobs, JoinUs, Systems, News, Partners
- ✅ `client/public/sitemap.xml` exists covering 14 public URLs

**Remaining risks:**
- `JSON.stringify` on every render is a minor performance overhead if the config object is large; acceptable at current scale.
- Sitemap is static — not auto-generated from routes. Any new public page requires manual sitemap update.

**Technical debt:**
- No automated sitemap generation; `sitemap.xml` will drift from actual routes over time.

**Recommended improvements:**
- Add a build-time script that generates `sitemap.xml` from the route manifest.
- Verify `robots.txt` exists in `client/public/` and references the sitemap URL.

---

### 1.9 Vite SIGBUS Crash Workaround

**Why changed:** Vite's dev server crashes with SIGBUS on Replit's NixOS/overlay filesystem environment.

**Implementation review:**
- ✅ Build output targets `dist/public`
- ✅ Server serves pre-built static files in production mode

**Remaining risks:**
- Developers must rebuild (`npm run build`) after every frontend change — there is no hot-reload in this mode.
- Root cause is not fixed; see Task 5 for full analysis.

**Technical debt:**
- The workaround is not documented in `replit.md` under "Gotchas" (should be).

**Recommended improvements:**
- See Task 5 for the fix recommendation. Until fixed, document in `replit.md`.

---

## Task 2 — Repository Cleanup Plan

> No files have been deleted. This is a plan only.

### Category A — Duplicate Folders

| Path | Issue | Safe to Delete |
|------|-------|----------------|
| `/public/` (root) | Near-duplicate of `client/public/`. Both contain icons, logos, and `post-1.png` – `post-12.png`. Root `/public/` is not served by Vite in dev. | MAYBE — verify build scripts first |
| `/script/` vs `/scripts/` | `/script/` has `build.ts` / `build.mjs`; `/scripts/` has shell utilities. Overlapping build logic. | RISKY — both may be referenced in CI |

### Category B — Experimental / Legacy Folders

| Path | Issue | Safe to Delete |
|------|-------|----------------|
| `/cafe-demo/` | Complete standalone project (own `package.json`, `server/`, `client/`). Appears to be a proof-of-concept demo. Not part of production flow. | YES — archive to separate repo |
| `/artifacts/mockup-sandbox/` | Replit design agent artefact from previous UI exploration. Not part of production build. | YES — after confirming no active design review |
| `/sandboxes/` & `/sandbox-projects/` | Instance-specific ephemeral data from sandbox runner tests. | YES — ephemeral data |
| `/capacitor-stub/` | Single `index.html` placeholder. Legacy stub for Capacitor fallback build. | YES |

### Category C — Mobile / Vendor Code

| Path | Issue | Safe to Delete |
|------|-------|----------------|
| `/capacitor-ios-vendor/` | Vendored `@capacitor/ios` source, copied into `node_modules` by the CapacitorFix in `vite.config.ts`. Needed only for Capacitor Cloud builds. | RISKY — required by CapacitorFix |
| `/android-twa/` | Trusted Web Activity wrapper. If app has moved to Capacitor for Android, TWA is redundant. | MAYBE — verify mobile strategy |

### Category D — Temporary & Attached Assets

| Path | Issue | Safe to Delete |
|------|-------|----------------|
| `/attached_assets/` | Hundreds of `Pasted---[timestamp].txt`, `targeted_element_[timestamp].png`, and Apple `.p8` auth key files from Replit agent sessions. | YES — keys must go to secrets first |
| `/uploads/` | Hashed user upload files from testing (`*.png`, `*.jpeg`, `*.docx`). | YES — clear for production |

### Category E — Unused Assets

| Path | Issue | Safe to Delete |
|------|-------|----------------|
| `/client/public/posters/` | Generic placeholder posters not explicitly referenced in any component. | YES |
| `/public/fonts/arabic.ttf` (root) | Not referenced in `index.css` or Tailwind config. | YES |

### Category F — Dead Dependencies in Code

| Item | Issue |
|------|-------|
| `arabic-reshaper` npm package | No imports found in source. Likely vestigial. |
| `fabric.js` npm package | No imports found in source. Listed in build scripts only. |
| `bcrypt` npm package | `bcryptjs` is the actual implementation used throughout routes. |

---

## Task 3 — Dependency Audit

### Full Classification Table

| Package | Classification | Bundle Impact | Security Risk | Notes |
|---------|---------------|---------------|---------------|-------|
| `mongoose` | REQUIRED | Large | LOW | Core ODM. Extensively used. |
| `mongodb` | REQUIRED | Large | LOW | Mongoose driver. Explicitly used in atlas.ts. |
| `drizzle-orm` | REQUIRED | Small | LOW | Hybrid DB: used for PostgreSQL schemas in shared/schema.ts. |
| `drizzle-kit` | REQUIRED | Small | LOW | Required for `db:push` migration script. |
| `pg` | REQUIRED | Medium | LOW | PostgreSQL driver for Drizzle. |
| `express` | REQUIRED | Medium | LOW | Core HTTP framework. |
| `bcryptjs` | REQUIRED | Small | LOW | Actively used in routes for hashing. |
| `bcrypt` | **REMOVE** | Large | MEDIUM | Unused — `bcryptjs` is the actual implementation. Native bindings add install complexity. |
| `express-session` | REQUIRED | Small | LOW | Core session management. |
| `connect-mongo` | REQUIRED | Small | LOW | MongoDB session store. |
| `passport` + `passport-local` | REQUIRED | Small | LOW | Auth framework. |
| `passport-google-oauth20` | REQUIRED | Small | LOW | Google OAuth — implemented. |
| `passport-github2` | REQUIRED | Small | LOW | GitHub OAuth for DeploymentCloud. |
| `passport-apple` | REQUIRED | Small | LOW | Apple OAuth implemented in routes.ts. |
| `zod` | REQUIRED | Medium | LOW | Core validation throughout shared/. |
| `@tanstack/react-query` | REQUIRED | Medium | LOW | Primary data-fetching layer. |
| `wouter` | REQUIRED | Small | LOW | Client-side router. |
| `framer-motion` | REQUIRED | Large | LOW | Animations used throughout UI. |
| `lucide-react` | REQUIRED | Medium | LOW | Primary icon set. |
| `react-icons` | REQUIRED | Large | MEDIUM | v5 with breaking changes. Many SI icons in use. Full audit recommended. |
| `@radix-ui/*` (all) | REQUIRED | Medium | LOW | Headless UI primitives for Shadcn components. |
| `recharts` | REQUIRED | Large | LOW | Charts in admin dashboards. Note: v2 is deprecated — v3 migration available. |
| `@monaco-editor/react` | REQUIRED | Large | LOW | Code editor in sandbox IDE. |
| `ws` | REQUIRED | Small | LOW | WebSocket server for QMeet + sandbox. |
| `openai` | REQUIRED | Medium | LOW | AI provider SDK. |
| `googleapis` | REQUIRED | Large | LOW | Google APIs for OAuth and integrations. |
| `nodemailer` | REQUIRED | Medium | LOW | Email sending. |
| `web-push` | REQUIRED | Small | LOW | Push notifications. |
| `node-cron` | REQUIRED | Small | LOW | Scheduled jobs. |
| `imapflow` + `mailparser` | REQUIRED | Medium | LOW | Corporate mail IMAP reading. |
| `multer` | REQUIRED | Small | LOW | File upload handling. |
| `pdf-lib` + `@pdf-lib/fontkit` | REQUIRED | Large | LOW | PDF generation for contracts. |
| `mammoth` | REQUIRED | Medium | LOW | Docx-to-HTML in routes.ts. |
| `exceljs` | REQUIRED | Large | LOW | Excel export. Safer replacement for xlsx. |
| `xlsx` | **REPLACE** | Large | **HIGH** | Known security vulnerabilities. Replace with `exceljs` (already present). |
| `face-api.js` | REQUIRED | **Very Large** | MEDIUM | Used in FaceRecognitionModal. Largest single bundle contributor. |
| `fabric` | **REMOVE** | Large | LOW | No imports found in source code. |
| `arabic-reshaper` | **REMOVE** | Small | LOW | No imports found in source code. |
| `@simplewebauthn/types` | **REPLACE** | Small | MEDIUM | v12 deprecated. Update to v13+ to match browser/server packages. |
| `simple-git` | REQUIRED | Medium | LOW | Used in sandbox/deployment routes. |
| `archiver` + `unzipper` | REQUIRED | Medium | LOW | Archive handling in sandbox. |
| `speakeasy` | REQUIRED | Small | LOW | TOTP 2FA. |
| `@simplewebauthn/browser` + `/server` | REQUIRED | Medium | LOW | Passkey/WebAuthn 2FA. |
| `http-proxy-middleware` | REQUIRED | Small | LOW | Proxies for embedded demos (Cafe, E-commerce). |
| `compression` | REQUIRED | Small | LOW | HTTP response compression. |
| `express-rate-limit` | REQUIRED | Small | LOW | Rate limiting on public endpoints. |
| `digest-fetch` | REQUIRED | Small | LOW | Used in atlas.ts for MongoDB Atlas API auth. |
| `memorystore` | REQUIRED | Small | LOW | In-memory session fallback. |
| `next-themes` | REQUIRED | Small | LOW | Dark/light mode toggle. |
| `date-fns` | REQUIRED | Medium | LOW | Date formatting throughout app. |
| `html5-qrcode` | REQUIRED | Medium | LOW | QR scanner in client. |
| `qrcode.react` | REQUIRED | Small | LOW | QR code generation. |
| `jsbarcode` | REQUIRED | Small | LOW | Barcode generation. |
| `file-saver` | REQUIRED | Small | LOW | Client-side file download. |
| `input-otp` | REQUIRED | Small | LOW | OTP input component. |
| `embla-carousel-react` | REQUIRED | Small | LOW | Carousel component. |
| `cmdk` | REQUIRED | Small | LOW | Command palette component. |
| `vaul` | REQUIRED | Small | LOW | Drawer component. |
| `react-resizable-panels` | REQUIRED | Small | LOW | Resizable panels in sandbox IDE. |
| `react-day-picker` | REQUIRED | Small | LOW | Date picker component. |
| `capacitor/*` (all) | REQUIRED | Medium | LOW | Mobile app support. Actively initialised in capacitor-init.ts. |
| `@tailwindcss/vite` | REQUIRED (dev) | — | LOW | Tailwind v4 Vite plugin. |
| `sharp` | REQUIRED (dev) | — | LOW | Image processing during build. |
| `tsx` | REQUIRED (dev) | — | LOW | TypeScript execution for dev server. |
| `esbuild` | REQUIRED (dev) | — | LOW | Used in build script. |
| `@replit/vite-plugin-*` | REQUIRED (dev) | — | LOW | Replit-specific dev tooling. |

### Critical Dependency Findings

1. **`xlsx` → SECURITY HIGH** — Replace with `exceljs` (already installed). `xlsx` has publicly disclosed ReDOS and prototype-pollution vulnerabilities.
2. **`bcrypt` → REMOVE** — `bcryptjs` handles all hashing. `bcrypt`'s native build adds unnecessary install complexity.
3. **`fabric` → REMOVE** — Zero imports found. ~300KB dead weight.
4. **`arabic-reshaper` → REMOVE** — Zero imports found.
5. **`recharts` v2 → LEGACY** — v2 is end-of-life. v3 migration available but non-trivial.
6. **`face-api.js` → MONITOR** — Largest client bundle contributor. Consider lazy-loading or moving to a server-side inference service.
7. **`@simplewebauthn/types` v12 → REPLACE** — Deprecated; should align with v13+ used by browser/server packages.

---

## Task 4 — Architecture Validation

### 4.1 Monolithic Files

| File | Lines | Severity | Problem | Recommended Fix |
|------|-------|----------|---------|-----------------|
| `server/routes.ts` | **16,406** | 🔴 CRITICAL | Single file contains all API endpoints, all business logic, and all direct DB queries. Violates Single Responsibility Principle entirely. | Split into domain routers: `routes/auth.ts`, `routes/orders.ts`, `routes/wallet.ts`, `routes/ai.ts`, `routes/sandbox.ts`, `routes/employee.ts`, etc. |
| `client/src/pages/AdminAppPublish.tsx` | **2,995** | 🔴 HIGH | Monolithic admin page with complex state, multiple sub-features, and inline business logic. | Extract into sub-components and custom hooks per feature area. |
| `client/src/App.tsx` | **1,305** | 🟠 HIGH | Route declarations, auth guards, and context providers all co-located. | Extract routes to `routes.config.ts`, providers to `Providers.tsx`. |
| `server/index.ts` | **1,066** | 🟡 MEDIUM | Server bootstrap mixed with middleware registration and WebSocket setup. | Extract WebSocket setup to `ws-server.ts`, middleware to `middleware/index.ts`. |

### 4.2 Circular Dependencies

| Location | Severity | Evidence |
|----------|----------|----------|
| `server/routes.ts` ↔ `server/models/index.ts` | 🟠 MEDIUM | Dynamic `await import("./models")` calls inside route handlers — a known workaround for circular import resolution. |
| `shared/schema.ts` | 🟡 LOW | Large centralised schema file (534 lines) — stable but becomes a coupling risk as it grows. |

### 4.3 Tight Coupling

| Pattern | Severity | Evidence | Fix |
|---------|----------|----------|-----|
| Direct Mongoose calls in route handlers | 🔴 CRITICAL | `UserModel.findOneAndUpdate(...)` called directly in HTTP handlers throughout routes.ts. No service layer. | Introduce `server/services/` directory with domain services (e.g., `UserService`, `OrderService`). |
| Business logic embedded in routes | 🔴 HIGH | Wallet balance calculations, 2FA token generation, installment logic all inside route handlers. | Move to domain services. |
| Frontend components encoding API contract assumptions | 🟡 MEDIUM | Some components construct API URLs manually rather than via a typed API client. | Centralise in `client/src/lib/api.ts` with typed request helpers. |

### 4.4 Missing Abstractions

| Missing Pattern | Severity | Evidence | Fix |
|-----------------|----------|----------|-----|
| Centralised error handler | 🔴 HIGH | ~386 instances of `res.status(500).json(...)` scattered throughout routes.ts. | Implement `errorHandler` Express middleware; use `next(err)` pattern in async routes. |
| Async route wrapper | 🟠 MEDIUM | No `asyncHandler` wrapper — unhandled promise rejections in routes can crash the server. | Wrap all async route handlers with a utility that forwards errors to Express error middleware. |
| Unified API client (frontend) | 🟠 MEDIUM | Mix of `apiRequest` (519 instances) and native `fetch` (237 instances). | Standardise on a single typed `apiClient` using TanStack Query mutation/query patterns. |
| RBAC middleware | 🟡 MEDIUM | Role/session checks repeated inline in individual route handlers. | Implement `requireRole(roles[])` middleware factory. |

### 4.5 Folder Organisation

| Issue | Severity | Fix |
|-------|----------|-----|
| Flat `server/` directory — all logic at one level | 🟠 MEDIUM | Introduce `server/routes/`, `server/services/`, `server/middleware/`, `server/models/` |
| No barrel exports (`index.ts`) in model directories | 🟡 LOW | Add `server/models/index.ts` with named re-exports |
| Large page components without private sub-directories | 🟡 LOW | Co-locate page-specific hooks and sub-components in page folders |

### Priority Implementation Plan

```
Phase 1 (Critical — before next feature sprint):
  1. Add asyncHandler wrapper to all async routes in routes.ts
  2. Add centralised error handler middleware
  3. Begin extracting domain services (UserService, OrderService)

Phase 2 (High — Sprint 2):
  4. Split routes.ts into domain-specific routers
  5. Introduce server/services/ and server/middleware/ folders
  6. Standardise frontend API client

Phase 3 (Medium — Sprint 3):
  7. Break down AdminAppPublish.tsx and App.tsx
  8. Implement declarative RBAC middleware
  9. Add barrel index exports
```

---

## Task 5 — Vite SIGBUS Root Cause Investigation

### vite.config.ts Evidence

The current `vite.config.ts` contains a **CapacitorFix** that runs at **config evaluation time** (before Vite initialises):

```typescript
// Runs synchronously when vite.config.ts is first evaluated:
if (existsSync(vendorIos) && !existsSync(path.join(destIos, "package.json"))) {
  cpSync(vendorIos, destIos, { recursive: true });
}
```

This `cpSync` operation copies `capacitor-ios-vendor/` (~large directory) into `node_modules/@capacitor/ios` during Vite startup.

### Root Cause Analysis

| Hypothesis | Probability | Evidence |
|------------|-------------|----------|
| **Filesystem mmap conflict from CapacitorFix** | 🔴 **HIGH** | Vite/esbuild uses `mmap` to memory-map files in `node_modules` for fast reading. The CapacitorFix mutates `node_modules` synchronously during config evaluation — while esbuild may already have open mmap handles to files in that directory. Truncating or replacing mmap'd files causes SIGBUS on Linux. |
| **Overlay filesystem (Replit NixOS btrfs/overlayfs)** | 🔴 **HIGH** | Replit runs on NixOS with overlayfs. The home directory filesystem (`/home/runner`) is an overlay mount. On certain overlay configurations, `mmap` calls on the overlay layer trigger SIGBUS because the underlying filesystem does not support sparse-file mmap operations that esbuild relies on. |
| **Vite 7 + Tailwind 4 Rust engine** | 🟠 **MEDIUM** | `vite@^7.3.0` is very new. `@tailwindcss/vite@^4.1.18` uses a Rust-based CSS engine (`oxide`). Rust native bindings in a containerised NixOS environment can trigger SIGBUS if the glibc version or kernel mmap flags differ from the build target. |
| **`sharp` native bindings** | 🟡 **MEDIUM** | `sharp@^0.34.5` uses libvips C++ bindings. Included in `devDependencies`. While sharp is typically used at build time, esbuild's dependency scanning may attempt to load it during optimisation, which could SIGBUS on architecture mismatch. |
| **Memory exhaustion (OOM)** | 🟢 **LOW** | Dev script uses `--max-old-space-size=4096`. True OOM produces SIGKILL, not SIGBUS. |
| **Circular imports** | 🟢 **LOW** | Circular imports cause `ReferenceError` or `undefined` values, not SIGBUS. |

### Most Likely Root Cause

**The CapacitorFix `cpSync` in `vite.config.ts` is the most actionable trigger.** When Vite is starting up, esbuild opens and mmap-maps files across `node_modules`. The synchronous mass-copy into `node_modules/@capacitor/ios` during this window causes file handles to become stale, triggering SIGBUS on the overlay filesystem.

**Secondary, underlying cause**: Replit's overlay filesystem has incomplete mmap support for large file operations, which is why the same config works locally (native ext4/APFS) but fails here.

### Proper Fix (Non-Workaround)

**Option 1 — Isolate CapacitorFix from Vite startup (recommended):**
Move the `cpSync` out of `vite.config.ts` and into a pre-dev npm lifecycle script:
```json
// package.json
"scripts": {
  "predev": "node scripts/capacitor-fix.mjs",
  "dev": "NODE_ENV=development node --max-old-space-size=4096 node_modules/.bin/tsx server/index.ts"
}
```
This runs the fix before Vite initialises, eliminating the race condition.

**Option 2 — Disable esbuild mmap:**
```typescript
// vite.config.ts
optimizeDeps: {
  esbuildOptions: {
    define: { 'process.env.ESBUILD_NO_MMAP': 'true' }
  }
}
```
Documented esbuild option; forces read() instead of mmap(). Slight performance cost, no functional impact.

**Option 3 — Pin to Vite 6.x:**
Downgrade `vite` to `^6.3.0` while Vite 7's compatibility with Replit's NixOS kernel is confirmed. The `@tailwindcss/vite` v4 Rust engine would also need pinning.

**Option 4 — Force Vite cache to a non-overlay path:**
```typescript
cacheDir: '/tmp/vite-cache'
```
Forces Vite's internal pre-bundle cache to `/tmp` (tmpfs), which has full mmap support. This eliminates the overlay filesystem as a factor.

**Recommendation:** Implement Option 1 + Option 2 together. Option 1 removes the trigger; Option 2 adds defence-in-depth for the underlying overlay mmap issue.

---

## Summary Table

| Task | Key Finding | Severity | Action Required |
|------|-------------|----------|-----------------|
| Sprint 1 Validation | All 9 items implemented correctly. Main debt: WhatsApp templates not persisted, GitHub token stored in plaintext, sitemap is static. | 🟠 Medium | Address in Sprint 2 |
| Cleanup Plan | ~8 folders and ~4 packages identified for safe removal. `attached_assets/` contains Apple `.p8` key files that must be moved to secrets. | 🔴 Critical (keys) / 🟡 Low (folders) | Secrets immediately; cleanup sprint |
| Dependency Audit | `xlsx` (security HIGH), `bcrypt` + `fabric` + `arabic-reshaper` (unused). `recharts` v2 EOL. `face-api.js` is the largest bundle contributor. | 🔴 High (`xlsx`) | Replace `xlsx` before next release |
| Architecture | `server/routes.ts` at 16,406 lines is a critical architectural liability. No service layer. ~386 unhandled error patterns. | 🔴 Critical | Phase 1 fixes before Sprint 2 |
| Vite SIGBUS | Root cause: CapacitorFix `cpSync` during Vite init + overlayfs mmap. Proper fix: move fix to `predev` script + disable esbuild mmap. | 🔴 High | Implement before enabling hot-reload |

---

*Awaiting approval. No changes have been made to the codebase.*
