# SECURITY.md — QIROX Security Audit

> **Mode:** Audit only. No fixes. Document every issue.
> **Date:** 2026-07-08

---

## Summary

| Severity | Count |
|---|---|
| CRITICAL | 2 |
| HIGH | 6 |
| MEDIUM | 8 |
| LOW | 4 |

---

## CRITICAL Issues

### SEC-CRIT-001 — Hardcoded Session Secret Fallback
- **File:** `server/auth.ts:82`
- **Problem:** `secret: process.env.SESSION_SECRET || "qirox_super_secret_key_2024"` — if `SESSION_SECRET` is missing from env, the app silently falls back to a hardcoded, publicly-known string.
- **Risk:** Any attacker who knows this string (it is in the repository history) can forge valid session cookies, bypassing all authentication. Full account takeover possible for all users including admins.
- **Recommendation:** Remove the fallback entirely. At startup, if `SESSION_SECRET` is not set, throw a hard error: `if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is required")`.
- **Priority:** CRITICAL

### SEC-CRIT-002 — Command Injection via exec() in Sandbox
- **File:** `server/sandbox-routes.ts:637`
- **Problem:** `exec(buildCmd, { cwd: projectDir, env: envVars, timeout: 120000 }, ...)` — `buildCmd` is constructed from user-controlled `projectDir` and `envVars`.
- **Risk:** A malicious user could inject shell commands into `buildCmd` or `envVars`, executing arbitrary code on the host server. This is a remote code execution (RCE) vulnerability.
- **Recommendation:** Validate and sanitize `projectDir` (allowlist of known project directories). Use `execFile` instead of `exec` with explicit argument arrays. Audit all env var keys/values before passing to the subprocess.
- **Priority:** CRITICAL

---

## HIGH Issues

### SEC-HIGH-001 — NoSQL Injection via AI Tool Executor
- **File:** `server/ai.ts` (multiple locations)
- **Problem:** AI-generated tool arguments (from LLM output) are used directly in Mongoose queries via `any`-typed objects. No schema validation on the tool argument objects before DB operations.
- **Risk:** A prompt injection attack could craft AI tool arguments that inject MongoDB operators (`$where`, `$regex`, `$gt`) into queries, returning or deleting unauthorized data.
- **Recommendation:** Validate all AI tool arguments against strict Zod schemas before executing DB operations. Reject any input containing `$` keys.
- **Priority:** HIGH

### SEC-HIGH-002 — Sensitive Credentials in `attached_assets/`
- **File:** `attached_assets/` directory
- **Problem:** Directory contains Apple developer association files, CSR files (`distribution.csr`, `distribution-csr.txt`), and potentially private key material (`distribution_key.pem`, `QIROX_Distribution.p12`).
- **Risk:** Private key material committed to the repository is permanently compromised. Anyone with repository access (or who cloned it) can use these to sign malicious apps under the QIROX Apple Developer account.
- **Recommendation:** Immediately rotate/revoke any certificates whose private keys are in this repository. Remove all key files from git history using `git filter-branch` or BFG Repo Cleaner. Move to a secrets manager.
- **Priority:** HIGH

### SEC-HIGH-003 — MongoDB URI Manipulation
- **File:** `server/connection-manager.ts`
- **Problem:** Live database switching modifies the MongoDB URI string via regex at runtime based on admin panel input.
- **Risk:** Admin user could craft a URI that connects to an attacker-controlled MongoDB instance, exposing all write operations. If the regex fails silently, data is written to an unintended database.
- **Recommendation:** Restrict live DB switching to a whitelist of pre-approved Atlas cluster hostnames. Validate URI host against the whitelist before accepting it.
- **Priority:** HIGH

### SEC-HIGH-004 — Missing Rate Limiting on Authentication Routes
- **File:** `server/auth.ts`, `server/routes.ts`
- **Problem:** No rate limiting observed on `/api/login`, `/api/register`, `/api/forgot-password`, or any other sensitive auth endpoint.
- **Risk:** Brute-force password attacks, credential stuffing, and account enumeration are unrestricted.
- **Recommendation:** Apply `express-rate-limit` to all auth routes: max 10 attempts per 15 minutes per IP, with lockout on repeated failures.
- **Priority:** HIGH

### SEC-HIGH-005 — Lack of CSRF Protection
- **File:** `server/index.ts`, `server/auth.ts`
- **Problem:** No CSRF token middleware found. Session-based auth without CSRF protection is vulnerable.
- **Risk:** Cross-Site Request Forgery attacks can perform state-changing operations (fund transfers, data deletion, admin actions) using a victim's session cookie from a malicious website.
- **Recommendation:** Implement `csurf` or use SameSite=Strict cookies and verify Origin/Referer headers on all state-changing requests.
- **Priority:** HIGH

### SEC-HIGH-006 — File Upload — No MIME Type Validation
- **File:** `server/routes.ts` (multer configuration)
- **Problem:** Uploaded files are stored in `uploads/` by hash. No MIME type or file extension validation observed beyond multer's basic config.
- **Risk:** Malicious files (webshells, executables disguised as images) could be uploaded and served back to users, enabling stored XSS or remote code execution if the server executes them.
- **Recommendation:** Validate MIME type server-side using `file-type` library (magic bytes check, not just extension). Allowlist: image/jpeg, image/png, image/webp, application/pdf, etc.
- **Priority:** HIGH

---

## MEDIUM Issues

### SEC-MED-001 — Weak Password Policy
- **File:** `server/routes.ts` (registration handler)
- **Problem:** No explicit password complexity enforcement found (minimum length, character classes).
- **Risk:** Users can register with weak passwords (e.g., "123456"), making brute-force attacks trivial.
- **Recommendation:** Enforce minimum 8 characters, at least one number and one letter. Consider zxcvbn for strength estimation.
- **Priority:** MEDIUM

### SEC-MED-002 — No Startup Environment Variable Validation
- **File:** `server/index.ts`
- **Problem:** App starts even when critical env vars are missing. Missing vars are discovered at runtime when the first request hits that code path.
- **Risk:** A deployment with a missing `SESSION_SECRET` falls back to the hardcoded secret (SEC-CRIT-001). Missing `MONGODB_URI` causes a crash only on first DB query, not at startup.
- **Recommendation:** Add a startup validation block that checks all required env vars and throws if any are absent. Fail fast before serving any requests.
- **Priority:** MEDIUM

### SEC-MED-003 — Silent Error Swallowing
- **File:** `server/routes.ts:3543`
- **Problem:** `.catch(() => {})` — errors are completely discarded.
- **Risk:** Database write failures go undetected. Could mask a DB outage or data corruption.
- **Recommendation:** At minimum, log to `console.error`. Ideally send to a structured logger.
- **Priority:** MEDIUM

### SEC-MED-004 — execSync in Sandbox Runner
- **File:** `server/sandbox-runner.ts:169,175`
- **Problem:** `execSync('kill -- -${pid}')` and `execSync('kill -9 -- -${pid}')` pass `pid` directly into a shell command string.
- **Risk:** If `pid` is tampered with (e.g., `0` or a negative value), these commands could kill system processes or all processes in the process group.
- **Recommendation:** Parse `pid` as an integer and validate it is a positive number before using it in shell commands. Use `process.kill(pid, 'SIGTERM')` instead.
- **Priority:** MEDIUM

### SEC-MED-005 — Console Logs in Production Client
- **File:** `client/src/` (29 locations)
- **Problem:** `console.log`, `console.error`, `console.warn` calls remain in production frontend code.
- **Risk:** Sensitive user data, internal state, or API responses may be visible in browser DevTools. Also exposes implementation details to attackers.
- **Recommendation:** Remove all console.log from production paths, or use a conditional logger that strips logs in `NODE_ENV=production`.
- **Priority:** MEDIUM

### SEC-MED-006 — Android Keystore in Documentation
- **File:** `DEPLOYMENT_GUIDE.md`
- **Problem:** Documentation instructs converting the Android signing keystore to Base64 for CI/CD. If CI/CD logs are not fully private, the Base64 string leaks.
- **Risk:** The Android signing certificate is compromised, enabling malicious APK signing under the QIROX identity.
- **Recommendation:** Store the Base64 keystore exclusively in Codemagic's encrypted environment variables. Ensure CI logs mask the value.
- **Priority:** MEDIUM

### SEC-MED-007 — Unvalidated Redirects in OAuth Flows
- **File:** `server/auth.ts` (OAuth callback handlers)
- **Problem:** OAuth callback handlers may redirect to URLs derived from query parameters without validation.
- **Risk:** Open redirect vulnerability — attacker can craft a link that, after OAuth login, redirects the user to a malicious site with the session token.
- **Recommendation:** Validate all redirect URLs against a whitelist of the application's own origins before redirecting.
- **Priority:** MEDIUM

### SEC-MED-008 — Missing Security Headers
- **File:** `server/index.ts`
- **Problem:** No `helmet` middleware or equivalent security headers observed: `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`, `Referrer-Policy`.
- **Risk:** Clickjacking, MIME sniffing, and reflected XSS attacks are not mitigated at the HTTP layer.
- **Recommendation:** Add `helmet` middleware as early as possible in the Express middleware chain.
- **Priority:** MEDIUM

---

## LOW Issues

### SEC-LOW-001 — `distribution_key.pem` and `QIROX_Distribution.p12` in Repository Root
- **File:** `/distribution_key.pem`, `/QIROX_Distribution.p12`
- **Problem:** Apple distribution private key and P12 certificate are committed to the repository root.
- **Risk:** Anyone who has ever cloned this repo has a copy of these keys. They cannot be "un-committed" from history without a full rewrite.
- **Recommendation:** Treat these keys as compromised. Revoke and regenerate. Purge from git history.
- **Priority:** LOW (after HIGH revocation action)

### SEC-LOW-002 — No Content-Security-Policy for Monaco Editor
- **File:** `client/src/` (Monaco Editor pages)
- **Problem:** Monaco Editor requires `unsafe-eval` in the CSP, which significantly weakens XSS protection.
- **Risk:** XSS vulnerabilities in Monaco-using pages have no CSP backstop.
- **Recommendation:** Scope `unsafe-eval` to the specific sandbox pages only, not the entire application.
- **Priority:** LOW

### SEC-LOW-003 — Default SANDBOX_ENC_KEY Warning Logged
- **File:** `server/index.ts` (sandbox initialization)
- **Problem:** `[Sandbox] SANDBOX_ENC_KEY not set — using default key (dev only)` is logged at startup. In production without this key, sandbox project env vars are encrypted with a known default key.
- **Risk:** Sandbox environment variables (which may contain API keys entered by developers) are not securely encrypted.
- **Recommendation:** Treat `SANDBOX_ENC_KEY` as required in production. Fail hard if not set when `NODE_ENV=production`.
- **Priority:** LOW

### SEC-LOW-004 — No Account Lockout After Failed Login Attempts
- **File:** `server/auth.ts`
- **Problem:** No lockout mechanism after N failed login attempts beyond rate limiting (which is also missing — SEC-HIGH-004).
- **Risk:** Combined with missing rate limiting, this allows unlimited password guessing.
- **Recommendation:** Track failed attempts per account in the DB and lock accounts for 15 minutes after 10 failures.
- **Priority:** LOW
