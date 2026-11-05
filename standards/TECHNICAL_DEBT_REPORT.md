# TECHNICAL_DEBT_REPORT.md — QIROX Technical Debt Report

> **Source of truth:** docs/ARCHITECTURE.md, docs/SECURITY.md, docs/DATABASE.md, docs/UI_RULES.md, docs/UX_RULES.md  
> **Last Updated:** 2026-07-09  
> **Status:** Documentation only — no production code modified  
> **Methodology:** Derived exclusively from reading all 28 docs/ files

---

## Executive Summary

The QIROX codebase is a feature-complete, Arabic-first SaaS platform with substantial functionality. The core debt has three clusters:

1. **Architectural debt** — three massive monolith files (routes: 16,975 lines; models: 2,339 lines; AI: 3,535 lines) that block parallel development and increase defect risk
2. **Security debt** — two CRITICAL issues requiring immediate remediation before production launch
3. **Quality debt** — missing loading/error/empty states on most pages; no automated tests; inconsistent error handling

---

## Severity Classification

| Level | Definition |
|---|---|
| 🔴 CRITICAL | Security vulnerability / production risk — must be resolved immediately |
| 🟠 HIGH | Significant risk to stability, maintainability, or team velocity |
| 🟡 MEDIUM | Reduces code quality and DX; should be resolved within current phase |
| 🟢 LOW | Improvement opportunity; can be deferred to next phase |

---

## CRITICAL Debt Items

### DEBT-CRIT-001 — Hardcoded Session Secret Fallback
- **Source:** docs/SECURITY.md SEC-CRIT-001
- **Location:** `server/auth.ts`
- **Pattern:** `secret: process.env.SESSION_SECRET || "qirox_super_secret_key_2024"`
- **Risk:** Anyone with code access can forge session cookies using the known fallback value, bypassing authentication for all 11 user roles
- **Resolution Sprint:** S-00
- **Effort:** 30 minutes — one-line change + env var requirement

### DEBT-CRIT-002 — Command Injection in Sandbox Build Runner
- **Source:** docs/SECURITY.md SEC-CRIT-002
- **Location:** `server/routes.ts` (sandbox section)
- **Pattern:** `exec(buildCommand)` where `buildCommand` is constructed from user-controlled project directory paths
- **Risk:** Remote Code Execution (RCE) — attacker can execute arbitrary shell commands on the server
- **Resolution Sprint:** S-00
- **Effort:** 2–3 hours — replace `exec()` with `execFile()`, add path allowlist validation

---

## HIGH Debt Items

### DEBT-HIGH-001 — AI Tool Arguments Not Validated Before MongoDB Operations
- **Source:** docs/SECURITY.md SEC-HIGH-001
- **Location:** `server/ai.ts` — tool executor
- **Pattern:** LLM-generated JSON arguments used directly in Mongoose queries without validation
- **Risk:** MongoDB operator injection — an LLM could produce `{ "$where": "..." }` or `{ "$regex": ".*" }` operators
- **Resolution Sprint:** S-00 (partial) + S-06
- **Effort:** 4–6 hours — add Zod schemas for each tool; add `$`-key rejection guard

### DEBT-HIGH-002 — MongoDB URI Regex Manipulation
- **Source:** docs/SECURITY.md SEC-HIGH-003, docs/ARCHITECTURE.md ISSUE-ARCH-004
- **Location:** `server/db.ts` (connection manager)
- **Pattern:** Admin-supplied MongoDB URIs modified by regex before connecting
- **Risk:** Admin can supply a crafted URI to redirect connections to an attacker-controlled MongoDB instance; data exfiltration risk
- **Resolution Sprint:** S-00
- **Effort:** 2–3 hours — replace regex manipulation with whitelist validation

### DEBT-HIGH-003 — 16,975-Line Route Monolith
- **Source:** docs/ARCHITECTURE.md ISSUE-ARCH-001
- **Location:** `server/routes.ts`
- **Impact:** 
  - Git merge conflicts on every PR (all changes touch the same file)
  - Impossible to assign ownership by domain
  - No code navigation — finding a route requires text search
  - Tests cannot be written per-domain
- **Resolution Sprint:** S-04
- **Effort:** 3–4 weeks of systematic extraction

### DEBT-HIGH-004 — 2,339-Line Model Monolith
- **Source:** docs/ARCHITECTURE.md ISSUE-ARCH-001, docs/DATABASE.md DB-001
- **Location:** `server/models.ts` (40+ Mongoose models)
- **Impact:**
  - Every server process loads all 40 models even when only 1 is needed
  - Changes to one model require reviewing all 2,339 lines for side effects
  - No clear ownership per domain model
- **Resolution Sprint:** S-03
- **Effort:** 1–2 weeks — systematic extraction, one model at a time

### DEBT-HIGH-005 — File Upload MIME Type Validation Missing
- **Source:** docs/SECURITY.md SEC-HIGH-006
- **Location:** Upload routes in `server/routes.ts`
- **Pattern:** File extension checked but magic bytes not verified
- **Risk:** Attacker uploads `.jpg` containing PHP/shell code — arbitrary file execution
- **Resolution Sprint:** S-00 / S-06
- **Effort:** 2–4 hours — integrate `file-type` library

### DEBT-HIGH-006 — No CSRF Protection on State-Changing Routes
- **Source:** docs/SECURITY.md SEC-HIGH-005
- **Location:** All POST/PUT/PATCH/DELETE routes
- **Risk:** Cross-site request forgery attacks — attacker can trigger state changes (orders, payments, settings) by tricking authenticated users
- **Resolution Sprint:** S-06
- **Effort:** 1–2 days — add Origin/Referer check middleware

---

## MEDIUM Debt Items

### DEBT-MED-001 — No Environment Variable Validation at Startup
- **Source:** docs/SECURITY.md SEC-MED-002
- **Location:** `server/index.ts`
- **Impact:** Missing env vars cause runtime errors deep in request handlers rather than clean startup failures
- **Resolution Sprint:** S-02
- **Effort:** 2–3 hours

### DEBT-MED-002 — Silent Error Swallowing Throughout Codebase
- **Source:** docs/ARCHITECTURE.md ISSUE-ARCH-003
- **Location:** Multiple locations in `server/routes.ts` (`.catch(() => {})`)
- **Impact:** Errors disappear silently; impossible to debug production issues; no audit trail for failures
- **Resolution Sprint:** S-01 + S-05
- **Effort:** Systematic — part of the centralized error handler sprint

### DEBT-MED-003 — No Structured Logger (console.log in Production)
- **Source:** docs/SECURITY.md SEC-MED-005
- **Location:** `server/routes.ts` (29+ occurrences), `client/src/` (29+ occurrences)
- **Impact:** Production logs are unqueryable, unstructured, and may leak sensitive data; client-side logs expose internal API shapes
- **Resolution Sprint:** S-01
- **Effort:** 1 week — systematic replacement

### DEBT-MED-004 — Inconsistent API Response Shape
- **Source:** docs/ARCHITECTURE.md ISSUE-ARCH-003
- **Location:** Multiple routes return different shapes: `{ data }`, `{ error: "..." }`, raw arrays
- **Impact:** Frontend must handle multiple shapes; breaks typed query hooks
- **Resolution Sprint:** S-05 (error handler) + S-04 (route refactor)
- **Effort:** Resolved systematically as routes are extracted

### DEBT-MED-005 — Missing Loading States on Most Pages
- **Source:** docs/UI_RULES.md UI-002
- **Location:** 100+ page components in `client/src/pages/`
- **Impact:** Pages show blank content while data loads; poor UX; perceived brokenness
- **Resolution Sprint:** S-10
- **Effort:** 2 weeks — 166 pages to audit

### DEBT-MED-006 — Missing Error States on Most Pages
- **Source:** docs/UI_RULES.md UI-003
- **Location:** Same as DEBT-MED-005
- **Impact:** Network errors cause blank pages; users cannot retry; support burden increases
- **Resolution Sprint:** S-10
- **Effort:** Combined with loading states (same sprint)

### DEBT-MED-007 — Missing Empty States on List Pages
- **Source:** docs/UI_RULES.md UI-004
- **Location:** All list/table pages (orders, projects, invoices, employees, etc.)
- **Impact:** New accounts or filtered results show confusing blank tables
- **Resolution Sprint:** S-10
- **Effort:** Combined with loading/error states

### DEBT-MED-008 — No Default Pagination on Unbounded Queries
- **Source:** docs/DATABASE.md DB-006
- **Location:** Multiple `Model.find()` calls in `server/routes.ts` without `.limit()`
- **Impact:** Full collection scans; OOM risk under load; slow responses as data grows
- **Resolution Sprint:** S-04 (fixed per domain as routes are extracted)
- **Effort:** Systematic fix during S-04

### DEBT-MED-009 — Hardcoded Strings in JSX (i18n Violations)
- **Source:** docs/UI_RULES.md UI-009
- **Location:** Multiple page components
- **Impact:** Platform cannot be fully localized; English fallbacks appear in Arabic UI
- **Resolution Sprint:** S-11
- **Effort:** 1 week audit

### DEBT-MED-010 — Sandbox PID Kill via Shell Command
- **Source:** docs/SECURITY.md SEC-MED-004
- **Location:** `server/routes.ts` (sandbox process management)
- **Pattern:** `execSync('kill -- -${pid}')` without PID integer validation
- **Risk:** Negative or crafted PID values could terminate arbitrary processes
- **Resolution Sprint:** S-00 / S-04
- **Effort:** 1–2 hours

### DEBT-MED-011 — OAuth Redirect URL Not Validated
- **Source:** docs/SECURITY.md SEC-MED-007
- **Location:** OAuth callback handlers in `server/routes.ts` or `server/routes/deploy.ts`
- **Risk:** Open redirect — attacker tricks users into being redirected to a phishing site after OAuth
- **Resolution Sprint:** S-07
- **Effort:** 1–2 hours per OAuth flow

### DEBT-MED-012 — No Wallet Transaction Atomicity
- **Source:** docs/DATABASE_BLUEPRINT.md Section 6
- **Location:** Wallet balance update logic in `server/routes.ts`
- **Impact:** Concurrent wallet operations can create race conditions: negative balances, duplicate charges, or lost transactions
- **Resolution Sprint:** S-04 (fixed in wallet.routes.ts extraction)
- **Effort:** 4–8 hours — wrap in MongoDB session transactions

---

## LOW Debt Items

### DEBT-LOW-001 — Zero Automated Test Coverage
- **Source:** docs/EXECUTION_PLAN.md Phase 7
- **Location:** `tests/` directory — does not exist
- **Impact:** Every deployment carries unknown regression risk; impossible to safely refactor
- **Resolution Sprint:** S-14
- **Effort:** 2 weeks initial coverage

### DEBT-LOW-002 — Missing Database Indexes on Query Fields
- **Source:** docs/DATABASE_BLUEPRINT.md Section 4
- **Location:** Multiple models in `server/models.ts`
- **Impact:** Full collection scans for filtered queries; performance degrades as data grows
- **Resolution Sprint:** S-08
- **Effort:** 1 week — additive, no data risk

### DEBT-LOW-003 — No TTL Indexes on High-Volume Collections
- **Source:** docs/DATABASE_BLUEPRINT.md Section 4
- **Location:** `notifications`, `activity_logs`, `otps` models
- **Impact:** Collections grow indefinitely; storage costs increase; queries slow over time
- **Resolution Sprint:** S-08
- **Effort:** 2–4 hours

### DEBT-LOW-004 — `SANDBOX_ENC_KEY` Not Required in Production
- **Source:** docs/SECURITY.md SEC-LOW-003
- **Location:** `server/startup-validation.ts` (to be created)
- **Impact:** Sandbox env vars may be stored unencrypted in production if key is not set
- **Resolution Sprint:** S-02
- **Effort:** 30 minutes — add to startup validation

### DEBT-LOW-005 — No Account Lockout After Failed Logins
- **Source:** docs/SECURITY.md SEC-LOW-004
- **Location:** `server/auth.ts` (login handler)
- **Impact:** Brute-force attacks on user accounts are unrestricted (beyond rate limiting)
- **Resolution Sprint:** Post-S-07
- **Effort:** 3–4 hours — track attempts in MongoDB

### DEBT-LOW-006 — Particle Animation Renders on Mobile
- **Source:** docs/BRAND_BLUEPRINT.md Section 5
- **Location:** `client/src/components/ui/ParticleCanvas.tsx`
- **Impact:** FPS drops on mobile devices; battery drain; negative mobile UX
- **Resolution Sprint:** S-12
- **Effort:** 30 minutes — add mobile viewport check

### DEBT-LOW-007 — Monaco Editor Not Lazy-Loaded
- **Source:** docs/UI_RULES.md UI-006
- **Location:** Sandbox IDE page imports
- **Impact:** ~2MB added to initial bundle; slower page load for all users even if they never use the sandbox
- **Resolution Sprint:** S-12
- **Effort:** 1–2 hours — wrap in React.lazy()

### DEBT-LOW-008 — CSRF Protection Missing on State-Changing Routes
- **Source:** docs/SECURITY.md SEC-HIGH-005 (listed again as MEDIUM above; this refers to the frontend verification gap)
- **Resolution Sprint:** S-06

---

## Debt Prioritization Matrix

| Debt ID | Severity | Effort | Sprint | Priority Score |
|---|---|---|---|---|
| DEBT-CRIT-001 | Critical | Low | S-00 | 🔴 Immediate |
| DEBT-CRIT-002 | Critical | Low | S-00 | 🔴 Immediate |
| DEBT-HIGH-001 | High | Medium | S-00 | 🔴 Immediate |
| DEBT-HIGH-002 | High | Low | S-00 | 🔴 Immediate |
| DEBT-HIGH-005 | High | Low | S-00 | 🔴 Immediate |
| DEBT-HIGH-003 | High | Very High | S-04 | 🟠 Phase 3 |
| DEBT-HIGH-004 | High | High | S-03 | 🟠 Phase 2 |
| DEBT-HIGH-006 | High | Medium | S-06 | 🟠 Phase 3 |
| DEBT-MED-002 | Medium | Medium | S-05 | 🟡 Phase 1 |
| DEBT-MED-003 | Medium | Medium | S-01 | 🟡 Phase 1 |
| DEBT-MED-004 | Medium | High | S-05 | 🟡 Phase 1 |
| DEBT-MED-012 | Medium | Medium | S-04 | 🟡 Phase 3 |
| DEBT-MED-005 | Medium | High | S-10 | 🟡 Phase 4 |
| DEBT-MED-006 | Medium | High | S-10 | 🟡 Phase 4 |
| DEBT-MED-007 | Medium | High | S-10 | 🟡 Phase 4 |
| DEBT-LOW-001 | Low | High | S-14 | 🟢 Phase 7 |
| DEBT-LOW-002 | Low | Low | S-08 | 🟢 Phase 2 |
| DEBT-LOW-003 | Low | Low | S-08 | 🟢 Phase 2 |

---

## Debt by Category

### Security Debt (2 Critical, 4 High, 5 Medium)
Total estimated remediation effort: **3–5 weeks** (bulk in S-00 through S-07)

### Architecture Debt (2 High — monolith files)
Total estimated remediation effort: **5–7 weeks** (S-03 + S-04)

### Quality Debt (Missing UI states, no tests)
Total estimated remediation effort: **4–5 weeks** (S-10 + S-11 + S-14)

### Performance Debt (indexes, pagination, particle animation)
Total estimated remediation effort: **2–3 weeks** (S-08 + S-09 + S-12)

---

## Debt Introduction Prevention

The following standards documents in this `/standards` directory prevent new debt from accumulating:

| Standard | Debt It Prevents |
|---|---|
| `SECURITY_STANDARDS.md` | CRIT-001, CRIT-002, HIGH-001–006, MED-010, MED-011 |
| `NODE_STANDARDS.md` | HIGH-003, HIGH-004, MED-002, MED-003, MED-008 |
| `API_STANDARDS.md` | MED-004, MED-008 |
| `DATABASE_STANDARDS.md` | LOW-002, LOW-003, MED-012 |
| `REACT_STANDARDS.md` | MED-005, MED-006, MED-007, MED-009 |
| `TESTING_STANDARDS.md` | LOW-001 |
| `PERFORMANCE_STANDARDS.md` | LOW-006, LOW-007 |
| `LOGGING.md` | MED-003 |
| `ERROR_HANDLING.md` | MED-002, MED-004 |

These standards must be enforced on all new code to prevent regression. The backlog of existing debt is addressed via the sprint plan in `IMPLEMENTATION_PLAN.md`.
