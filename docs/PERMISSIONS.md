# PERMISSIONS.md — QIROX Role-Based Access Control Audit

> **Mode:** Audit only. No fixes. Document every issue.
> **Date:** 2026-07-08

---

## 1. User Roles

The following 11 roles are defined in the platform:

| Role | Type | Description |
|---|---|---|
| `admin` | Internal | Full platform access, system configuration |
| `manager` | Internal | Team management, project oversight |
| `accountant` | Internal | Finance, invoices, payroll |
| `sales` | Internal | CRM, leads, clients |
| `developer` | Internal | Sandbox IDE, deployment cloud |
| `designer` | Internal | Design tools, AI Studio |
| `support` | Internal | Tickets, SLA, client communication |
| `merchant` | External | Store management |
| `client` | External | Client portal |
| `supplier` | External | Supplier portal |
| `investor` | External | Investor portal |

---

## 2. Role Hierarchy (Estimated — Needs Verification)

```
admin
  └── manager
        ├── accountant
        ├── sales
        ├── developer
        ├── designer
        └── support

merchant    (independent external)
client      (independent external)
supplier    (independent external)
investor    (independent external)
```

---

## 3. Feature Access Matrix (Estimated from Page Inventory)

> Legend: ✅ Full Access | 🔒 Read Only | ❌ No Access | ❓ Not Audited

| Feature | Admin | Manager | Accountant | Sales | Developer | Designer | Support | Client | Merchant | Supplier | Investor |
|---|---|---|---|---|---|---|---|---|---|---|---|
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| User Management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Finance / Invoices | ✅ | ✅ | ✅ | 🔒 | ❌ | ❌ | ❌ | 🔒 | 🔒 | ❌ | 🔒 |
| Payroll / Salaries | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Attendance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| CRM / Leads | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Projects / Kanban | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Sandbox IDE | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| AI Studio | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| DeploymentCloud | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Email Marketing | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Support Tickets | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| QMeet | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❓ | ❓ | ❓ |
| Store / Orders | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Contracts | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Wallet / Points | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Pixel Tracking | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cron Jobs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| API Keys | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## 4. Permission Issues (Audit)

### PERM-001 — No Automated Role Guard Audit
- **File:** `server/routes.ts`
- **Problem:** With 632+ endpoints in a 16,975-line file, there is no automated way to verify that every route has the correct role guard applied.
- **Risk:** An admin-only route may be missing its role check, allowing any authenticated user to access it.
- **Recommendation:** Create a route manifest that declares the expected auth level for every endpoint. Write an automated test that verifies the manifest against the actual middleware chain.
- **Priority:** HIGH

### PERM-002 — Role Checks Not Centralized
- **File:** `server/routes.ts`
- **Problem:** Role checking is done inline per route (e.g., `if (req.user.role !== 'admin') return res.status(403)`). No centralized `requireRole(role)` middleware.
- **Risk:** Inconsistent role check logic. A typo in one route's string comparison (`'Admin'` vs `'admin'`) bypasses the check.
- **Recommendation:** Create a `requireRole(...roles: string[])` middleware factory. Use it universally.
- **Priority:** HIGH

### PERM-003 — 2FA Not Enforced for Sensitive Roles
- **File:** `server/auth.ts`
- **Problem:** 2FA (TOTP via speakeasy) appears to be optional. No enforcement for admin or accountant roles.
- **Risk:** Compromised admin credentials (phishing, password reuse) lead to full platform takeover without 2FA friction.
- **Recommendation:** Require 2FA for `admin` and `accountant` roles. Block access until TOTP is configured and verified.
- **Priority:** MEDIUM

### PERM-004 — WebAuthn Available but Not Audited
- **File:** `server/routes.ts`, `server/models.ts` (WebAuthnCredentialModel)
- **Problem:** WebAuthn (passkey) is implemented but it is unclear which flows enforce or offer it.
- **Risk:** Passkey implementation may have gaps in credential verification or replay attack prevention.
- **Recommendation:** Audit the WebAuthn flow end-to-end: registration, authentication, credential storage. Verify challenge nonces are single-use and time-limited.
- **Priority:** MEDIUM

### PERM-005 — Supplier/Investor Portal Scope Not Audited
- **File:** `server/routes.ts`
- **Problem:** The Supplier and Investor roles are defined but their exact endpoint access has not been fully audited.
- **Risk:** These roles may have broader access than intended.
- **Recommendation:** Document every endpoint accessible to Supplier and Investor roles. Verify isolation from internal employee data.
- **Priority:** MEDIUM

---

## 5. Session Configuration Audit

| Setting | Current Value | Issue |
|---|---|---|
| `secret` | env or hardcoded fallback | **CRITICAL** — see SEC-CRIT-001 |
| `resave` | Unknown | Needs audit |
| `saveUninitialized` | Unknown | Should be `false` |
| `cookie.secure` | Unknown | Should be `true` in production |
| `cookie.httpOnly` | Unknown | Should be `true` |
| `cookie.sameSite` | Unknown | Should be `strict` or `lax` |
| `cookie.maxAge` | Unknown | Should be explicitly set |
| Store | MongoDB (connect-mongo) | Acceptable |

All session settings require a full audit of `server/auth.ts`.
