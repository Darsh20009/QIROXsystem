# API_BLUEPRINT.md — QIROX Complete API Blueprint

> **Mode:** Blueprint only. No code modified.
> **Date:** 2026-07-08
> **Total endpoints:** 710 route handlers in server/routes.ts

---

## 1. API Standard Contract

### Request Format
```
Content-Type: application/json
Cookie: connect.sid=<session-cookie>  (for authenticated routes)
```

### Success Response
```json
{ "success": true, "data": <T> }
```

### Paginated Response
```json
{
  "success": true,
  "data": [],
  "pagination": { "page": 1, "limit": 50, "total": 1234, "hasMore": true }
}
```

### Error Response
```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "Email is required", "field": "email" }
}
```

### HTTP Status Codes
| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | Not authorized |
| 404 | Not found |
| 409 | Conflict |
| 422 | Unprocessable |
| 429 | Rate limited |
| 500 | Server error |

---

## 2. Rate Limiting Plan

| Route Group | Current | Target |
|---|---|---|
| POST /api/auth/login | ✅ loginLimiter (15/15min) | Keep |
| POST /api/auth/register | ✅ registerLimiter | Keep |
| OTP endpoints | ✅ otpLimiter (8/hr) | Keep |
| POST /api/contact | ✅ contactLimiter | Keep |
| POST /api/ai/* | ❌ None | 10 req/min per user |
| POST /api/wallet/* | ❌ None | 20 req/min |
| POST /api/paypal/* | ❌ None | 10 req/min |
| GET /api/admin/* | ❌ None | 100 req/min per user |
| All other authenticated | ❌ None | 200 req/min per user |
| All public GET | ❌ None | 60 req/min per IP |

---

## 3. Authentication & Authorization

| Route Group | Auth Required | Roles |
|---|---|---|
| `/api/auth/*` | Partial (login/register: No) | N/A |
| `/api/public/*` | No | All |
| `/api/admin/*` | Yes | admin |
| `/api/admin/finance/*` | Yes | admin, accountant |
| `/api/admin/employees/*` | Yes | admin, manager |
| `/api/employee/*` | Yes | All employee roles |
| `/api/client/*` | Yes | client |
| `/api/wallet/*` | Yes | client, merchant |
| `/api/ai/*` | Yes | All authenticated |
| `/api/sandbox/*` | Yes | developer, admin |
| `/api/deploy/*` | Yes | developer, admin |
| `/api/qmeet/*` | Yes | All authenticated |
| `/api/supplier/*` | Yes | supplier |
| `/api/investor/*` | Yes | investor |

---

## 4. Complete API Module Map

### 4.1 Authentication Module (`/api/auth/*`)

| Method | Path | Auth | Rate Limit | Purpose |
|---|---|---|---|---|
| POST | `/api/auth/register` | No | registerLimiter | Create account |
| POST | `/api/auth/login` | No | loginLimiter | Login |
| POST | `/api/auth/logout` | Yes | None | Logout |
| GET | `/api/auth/user` | Yes | None | Current user |
| POST | `/api/auth/verify-email` | No | otpLimiter | Email OTP verify |
| POST | `/api/auth/forgot-password` | No | otpLimiter | Request reset |
| POST | `/api/auth/reset-password` | No | None | Set new password |
| POST | `/api/auth/verify-2fa` | Yes | otpLimiter | TOTP verify |
| POST | `/api/auth/setup-2fa` | Yes | None | Enable 2FA |
| GET | `/api/auth/google` | No | None | Google OAuth |
| GET | `/api/auth/google/callback` | No | None | Google callback |
| GET | `/api/auth/github` | No | None | GitHub OAuth |
| GET | `/api/auth/github/callback` | No | None | GitHub callback |
| POST | `/api/auth/apple/callback` | No | None | Apple Sign-In |
| POST | `/api/auth/webauthn/*` | Partial | None | Passkey flows |
| POST | `/api/auth/face-recognition/*` | Partial | None | Face auth |
| POST | `/api/auth/quick-pin/*` | Partial | None | PIN auth |
| POST | `/api/auth/qr-login/*` | Partial | None | QR login |

### 4.2 Public Module (`/api/public/*`, `/sitemap.xml`, etc.)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/public/info` | No | Platform public settings |
| GET | `/api/public/settings` | No | Pixel IDs, global config |
| GET | `/api/services` | No | Service catalog |
| GET | `/api/services/:id` | No | Service detail |
| GET | `/sitemap.xml` | No | XML sitemap |
| GET | `/llms.txt` | No | AI-readable info |
| GET | `/robots.txt` | No | Search engine rules |
| POST | `/api/contact` | No | Contact form (contactLimiter) |

### 4.3 Admin Module (`/api/admin/*` — estimated 200+ endpoints)

**Users & Employees**
| Method | Path | Auth | Validation | Rate Limit |
|---|---|---|---|---|
| GET | `/api/admin/all-users` | admin | — | ❌ |
| POST | `/api/admin/users` | admin | Manual | ❌ |
| PATCH | `/api/admin/users/:id` | admin | Manual | ❌ |
| DELETE | `/api/admin/users/:id` | admin | — | ❌ |
| GET | `/api/admin/employees` | admin/manager | — | ❌ |
| POST | `/api/admin/provision-employee-emails` | admin | Manual | ❌ |

**Finance**
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/admin/invoices` | admin/accountant | Unbounded query possible |
| GET | `/api/admin/finance/*` | admin/accountant | No aggregation caching |
| GET | `/api/admin/profit-report` | admin/accountant | Heavy aggregation, no cache |
| GET | `/api/admin/payroll` | admin/accountant | |
| POST | `/api/admin/payroll` | admin/accountant | |

**Orders & Commerce**
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/admin/orders` | admin/manager | |
| PATCH | `/api/admin/orders/:id` | admin/manager | |
| POST | `/api/admin/orders/:id/approve-transfer` | admin/manager | |
| POST | `/api/admin/orders/:id/reject-transfer` | admin/manager | |
| GET | `/api/admin/products` | admin | |
| POST/PATCH/DELETE | `/api/admin/products/:id` | admin | |

**Settings & System**
| Method | Path | Notes |
|---|---|---|
| GET/PATCH | `/api/admin/connection-settings` | Live DB/SMTP switching — HIGH RISK |
| GET/POST | `/api/admin/cron-jobs` | Schedule management |
| GET | `/api/admin/atlas/*` | Direct Atlas API exposure |
| GET/PATCH | `/api/admin/qirox-settings` | Global platform config |

### 4.4 Client Module (`/api/client/*`, `/api/orders`, `/api/wallet/*`)

| Method | Path | Auth | Role | Notes |
|---|---|---|---|---|
| GET | `/api/orders` | Yes | client | Client's orders |
| POST | `/api/orders` | Yes | client | Create order |
| PATCH | `/api/orders/:id/proof` | Yes | client | Upload payment proof |
| GET | `/api/invoices` | Yes | client | Client invoices |
| GET | `/api/wallet` | Yes | client | Wallet balance |
| POST | `/api/wallet/pay` | Yes | client | Pay with wallet |
| POST | `/api/wallet/topup-request` | Yes | client | Bank top-up request |
| POST | `/api/wallet/topup-paypal/create` | Yes | client | PayPal top-up |
| POST | `/api/wallet/card/init` | Yes | client | Virtual card setup |
| POST | `/api/wallet/card/pay` | Yes | client | Card payment |
| GET | `/api/client/installments` | Yes | client | Payment plans |
| GET | `/api/client/loyalty` | Yes | client | Loyalty points |
| GET | `/api/client/contracts` | Yes | client | Contracts |

### 4.5 Employee Module (`/api/employee/*`, `/api/attendance/*`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/employee/welcome-summary` | Dashboard data |
| GET | `/api/employee/my-payments` | Salary records |
| POST | `/api/attendance/check-in` | Clock in |
| PATCH | `/api/attendance/check-out` | Clock out |
| GET | `/api/attendance/status` | Today's status |
| GET/POST | `/api/leads-data` | CRM leads |
| GET/POST | `/api/groups/*` | Team messaging |
| GET | `/api/mail/inbox/:accountId` | IMAP inbox |

### 4.6 AI Module (`/api/ai/*`)

| Method | Path | Auth | Rate Limit | Notes |
|---|---|---|---|---|
| POST | `/api/ai/chat` | Yes | ❌ None | SSE stream, tool executor |
| POST | `/api/ai/image` | Yes | ❌ None | Image generation |
| POST | `/api/ai/video-proxy` | Yes | ❌ None | Video generation proxy |
| GET | `/api/ai/sessions` | Yes | ❌ None | History |
| DELETE | `/api/ai/sessions/:id` | Yes | ❌ None | Delete session |

**Critical:** All AI endpoints need rate limiting. `/api/ai/chat` with tool executor has NoSQL injection risk (SEC-HIGH-001).

### 4.7 Sandbox Module (`/api/sandbox/*`)

| Method | Path | Auth | Role | Notes |
|---|---|---|---|---|
| GET | `/api/sandbox/projects` | Yes | developer/admin | List projects |
| POST | `/api/sandbox/projects` | Yes | developer/admin | Create project |
| GET | `/api/sandbox/projects/:id` | Yes | developer/admin | Get project |
| PATCH | `/api/sandbox/projects/:id` | Yes | admin/manager | Update + buildCmd write |
| DELETE | `/api/sandbox/projects/:id` | Yes | admin | Delete |
| POST | `/api/sandbox/projects/:id/build` | Yes | admin/manager | **exec() injection** |
| POST | `/api/sandbox/projects/:id/start` | Yes | developer/admin | Start process |
| POST | `/api/sandbox/projects/:id/stop` | Yes | developer/admin | Stop process |
| GET | `/api/sandbox/projects/:id/status` | Yes | developer/admin | Process status |

### 4.8 Payments Module (`/api/paypal/*`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/paypal/create-order` | Yes | Create PayPal order |
| POST | `/api/paypal/capture-order` | Yes | Capture payment |
| GET | `/api/paypal/default` | Yes | Load default config |

### 4.9 QMeet Module (`/api/qmeet/*`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/qmeet/meetings` | Yes | List meetings |
| POST | `/api/qmeet/meetings` | Yes | Create meeting |
| GET | `/api/qmeet/meetings/:id` | Yes | Meeting detail |
| GET | `/api/qmeet/meetings/:id/join` | Yes | Join credentials |
| PATCH | `/api/qmeet/meetings/:id` | Yes | Update meeting |
| DELETE | `/api/qmeet/meetings/:id` | Yes | Cancel meeting |
| POST | `/api/qmeet/meetings/:id/ai-summary` | Yes | Generate AI summary |

### 4.10 Push Notifications (`/api/push/*`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/push/subscribe` | Yes | Save VAPID subscription |
| DELETE | `/api/push/unsubscribe` | Yes | Remove subscription |
| POST | `/api/push/native-token` | Yes | Capacitor push token |

---

## 5. Validation Plan

All endpoints accepting a request body require a Zod schema. Proposed middleware:

```typescript
// middleware/validate.ts (design — not implemented)
export function validate<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: result.error.errors[0].message, details: result.error.errors }
      });
    }
    req.body = result.data;
    next();
  };
}
```

---

## 6. Caching Plan

| Endpoint | Cache Strategy | TTL | Invalidation |
|---|---|---|---|
| GET /api/public/settings | In-memory | 5 minutes | On settings update |
| GET /api/services | In-memory | 10 minutes | On service update |
| GET /api/admin/analytics | In-memory | 15 minutes | Manual or on order update |
| GET /api/admin/profit-report | In-memory | 30 minutes | Manual |
| Invoice PDF | Disk (cached file) | Until invoice updated | On invoice update |
| Quotation PDF | Disk | Until quotation updated | On update |

---

## 7. WebSocket Events API

```
Client → Server:
  { type: "ping" }                          Keep-alive
  { type: "subscribe_project", projectId }  Subscribe to project updates
  { type: "sandbox_input", pid, input }     Send input to sandbox process

Server → Client:
  { type: "notification", ... }             New notification
  { type: "qmeet_started", meetingId }      Meeting started
  { type: "sandbox_log", pid, stream, data } IDE output
  { type: "inbox_message", ... }            New inbox message
  { type: "order_update", orderId, status } Order status change
  { type: "wallet_update", balance }        Wallet balance change
  { type: "pong" }                          Ping response
```
