# SECURITY_STANDARDS.md — QIROX Security Standards

> **Source of truth:** docs/SECURITY.md, docs/PERMISSIONS.md, docs/RBAC_DESIGN.md  
> **Scope:** All server/ code, authentication flows, file uploads, environment configuration  
> **Status:** Enforcement-ready — no production code modified

---

## Purpose

Define the non-negotiable security rules for all QIROX code. Derived from the security audit in docs/SECURITY.md. Rules are ordered by severity (CRITICAL first).

---

## Rules

### R-SEC-001 — [CRITICAL] No Hardcoded Session Secret Fallback
`SESSION_SECRET` must be required at startup. If absent, throw:
```typescript
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required — set this environment variable before starting the server.');
}
```
The fallback `"qirox_super_secret_key_2024"` is permanently forbidden. Per docs/SECURITY.md SEC-CRIT-001.

### R-SEC-002 — [CRITICAL] Sandbox Commands Must Use `execFile()` with Allowlist
The sandbox build runner must not construct shell command strings from user input. Use:
- `execFile()` instead of `exec()`
- An explicit argument array (not a concatenated string)
- A whitelist of allowed commands (e.g., `['npm', 'node', 'python3']`)
- `projectDir` validated against known sandbox project directories
Per docs/SECURITY.md SEC-CRIT-002.

### R-SEC-003 — [HIGH] AI Tool Arguments Must Be Validated with Zod Before DB Operations
All AI-generated tool call arguments must be parsed through a Zod schema before being used in any Mongoose query. Any argument object containing a key starting with `$` must be rejected immediately. Per docs/SECURITY.md SEC-HIGH-001.

### R-SEC-004 — [HIGH] Private Keys and Certificates Must Never Be Committed
`.pem`, `.p12`, `.key`, `.csr`, `.jks`, `.keystore` files are forever forbidden in the repository. These extensions must be in `.gitignore`. If any are found in git history, they must be treated as compromised and revoked. Per docs/SECURITY.md SEC-HIGH-002, SEC-LOW-001.

### R-SEC-005 — [HIGH] MongoDB URI Whitelist Enforcement
The connection manager must validate any MongoDB URI against a hardcoded whitelist of approved Atlas cluster hostnames before connecting. An admin-supplied URI that does not match the whitelist must be rejected. Per docs/SECURITY.md SEC-HIGH-003.

### R-SEC-006 — [HIGH] CSRF Protection Is Required on All State-Changing Routes
All `POST`, `PUT`, `PATCH`, `DELETE` routes that use session-cookie authentication must verify the `Origin` or `Referer` header against the application's own origin. Per docs/SECURITY.md SEC-HIGH-005.

### R-SEC-007 — [HIGH] File Uploads Must Be Validated by MIME Type (Magic Bytes)
Use the `file-type` library to check file magic bytes after upload. Accept only: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`. Reject anything else before saving. File extension alone is not sufficient validation. Per docs/SECURITY.md SEC-HIGH-006.

### R-SEC-008 — [MEDIUM] Startup Must Validate All Required Environment Variables
Before `app.listen()`, validate every required env var and throw with a descriptive message if any are missing. Required vars per docs/MASTER_BLUEPRINT.md Section 6: `MONGODB_URI`, `SESSION_SECRET`. Per docs/SECURITY.md SEC-MED-002.

### R-SEC-009 — [MEDIUM] Password Policy Enforcement
Registration must enforce:
- Minimum 8 characters
- At least 1 letter and 1 number
Enforce via Zod schema on the registration endpoint. Per docs/SECURITY.md SEC-MED-001.

### R-SEC-010 — [MEDIUM] OAuth Redirect URLs Must Be Validated Against Whitelist
OAuth callback handlers must validate any `redirect` or `returnTo` query parameter against a whitelist of the application's own origins before redirecting. Per docs/SECURITY.md SEC-MED-007.

### R-SEC-011 — [MEDIUM] Helmet Security Headers Are Required
`helmet` middleware must be applied as early as possible in the Express middleware chain in production. Per docs/SECURITY.md SEC-MED-008.

### R-SEC-012 — [MEDIUM] Sandbox PID Validation Before Signal Sending
Any PID used in a process kill operation must be:
1. Parsed with `parseInt()`
2. Validated as a positive integer (`pid > 0`)
3. Sent via `process.kill(pid, 'SIGTERM')` — not via shell `execSync('kill ...')`
Per docs/SECURITY.md SEC-MED-004.

### R-SEC-013 — [MEDIUM] No `console.log` in Production — Prevents Data Leakage
Production client and server code must not contain `console.log`, `console.warn`, or `console.error` calls. These leak internal state and API response shapes. Per docs/SECURITY.md SEC-MED-005.

### R-SEC-014 — [LOW] `SANDBOX_ENC_KEY` Must Be Required in Production
When `NODE_ENV === 'production'`, `SANDBOX_ENC_KEY` must be required. If absent in production, fail hard. Per docs/SECURITY.md SEC-LOW-003.

### R-SEC-015 — [LOW] Account Lockout After Failed Login Attempts
After 10 consecutive failed login attempts, the account must be locked for 15 minutes. Track attempts per account in MongoDB. Per docs/SECURITY.md SEC-LOW-004.

### R-SEC-016 — 2FA Must Be Mandatory for Admin and Accountant Roles
Accounts with role `admin` or `accountant` must have 2FA configured and verified before accessing any protected route. Per docs/RBAC_DESIGN.md Section 11 and docs/PERMISSIONS.md PERM-003.

---

## Allowed

- TOTP (speakeasy) as the primary 2FA method for admin/accountant
- Email OTP as a fallback 2FA method
- Passkeys (WebAuthn) as an additional auth method
- Biometric auth on mobile (Capacitor) with proper keychain/keystore encryption
- `SameSite: lax` for session cookies in development; `SameSite: strict` preferred in production

---

## Forbidden

- Hardcoded credentials, secrets, or fallback values of any kind in source code
- Private key files (`.pem`, `.p12`, `.csr`, `.key`) committed to the repository
- `exec()` with user-influenced string input — permanent RCE risk
- `$where` or JS operators in MongoDB queries
- AI tool arguments used in DB queries without prior validation
- File uploads saved without MIME type magic byte validation
- OAuth redirects to unvalidated URLs
- State-changing routes without CSRF protection
- Session cookies without `httpOnly: true` and `secure: true` in production
- `console.log` in production code paths

---

## Examples

### Startup Environment Validation
```typescript
// server/startup-validation.ts
const REQUIRED_ENV_VARS = ['MONGODB_URI', 'SESSION_SECRET'];

export function validateEnvironment(): void {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Set these variables before starting the server.'
    );
  }
  if (process.env.NODE_ENV === 'production' && !process.env.SANDBOX_ENC_KEY) {
    throw new Error('SANDBOX_ENC_KEY is required in production.');
  }
}
```

### AI Tool Argument Validation
```typescript
function rejectMongoOperators(obj: unknown, path = ''): void {
  if (typeof obj !== 'object' || obj === null) return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$')) {
      throw new Error(`Forbidden MongoDB operator key "${key}" at path "${path}"`);
    }
    rejectMongoOperators((obj as Record<string, unknown>)[key], `${path}.${key}`);
  }
}
```

---

## Checklist

- [ ] No `SESSION_SECRET` fallback in auth.ts
- [ ] Startup env validation runs before `app.listen()`
- [ ] Sandbox uses `execFile()` with allowlist
- [ ] AI tool args validated + `$`-key rejected before DB ops
- [ ] No `.pem`/`.p12`/`.key` files in repository
- [ ] MongoDB URI whitelist enforced in connection manager
- [ ] CSRF protection on state-changing routes
- [ ] File upload MIME type validated via magic bytes
- [ ] Helmet middleware applied
- [ ] OAuth redirects validated against whitelist
- [ ] 2FA mandatory for `admin` and `accountant` roles
- [ ] No `console.log` in production paths

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| `process.env.SESSION_SECRET \|\| "fallback"` | `if (!process.env.SESSION_SECRET) throw new Error(...)` |
| `exec(buildCmd)` with user path | `execFile('npm', ['run', 'build'], { cwd: allowlistedDir })` |
| Uploading without MIME check | Check magic bytes with `file-type` before `fs.writeFile()` |
| OAuth `res.redirect(req.query.next)` | Validate `req.query.next` against origin whitelist |
| `console.log(user)` in API handler | Remove or gate behind `NODE_ENV !== 'production'` |

---

## Future Scalability Considerations

- As the platform scales to multi-tenant, introduce tenant isolation at the database level (separate Atlas databases or collection prefixes)
- When the team grows, implement automated security scanning (SAST) in CI/CD to catch SEC-MED issues before merge
- Consider a formal bug bounty program once the CRITICAL and HIGH issues are resolved
- For ZATCA (Saudi e-invoicing) compliance in Phase 4 (docs/ROADMAP.md), cryptographic invoice signing will add additional security requirements
- Web Application Firewall (WAF) in front of the Express server will provide a defense-in-depth layer against injection and DDoS
