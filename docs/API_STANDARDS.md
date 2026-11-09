# API_STANDARDS.md — QIROX API Audit & Standards

> **Mode:** Audit only. No fixes. Document every issue.
> **Date:** 2026-07-08

---

## 1. Current API Inventory

| Metric | Value |
|---|---|
| Total estimated endpoints | 632+ |
| Primary route file | `server/routes.ts` (16,975 lines) |
| Auth mechanism | Session cookie (Passport.js) |
| External API key auth | `ClientApiKeyModel` (per `server/routes.ts`) |
| Response format | Inconsistent (see API-003) |
| Validation | Manual per-route (no middleware) |
| Rate limiting | None observed |
| API versioning | None |

---

## 2. API Endpoint Categories

| Category | Estimated Count | Auth Required |
|---|---|---|
| Public (landing, prices, news) | ~20 | No |
| Client portal | ~80 | Yes (client role) |
| Employee portal | ~150 | Yes (employee roles) |
| Admin panel | ~200 | Yes (admin role) |
| AI (chat, tools, image, video) | ~30 | Yes |
| Sandbox / IDE | ~40 | Yes (developer role) |
| Payments (PayPal, wallet) | ~30 | Yes |
| Webhooks / external | ~20 | Varies |
| DeploymentCloud | ~30 | Yes (github token) |
| Public settings | ~10 | No |
| QMeet / WebRTC signaling | ~20 | Yes |
| Misc | ~22 | Varies |

---

## 3. API Issues (Audit)

### API-001 — No Global Input Validation Middleware
- **File:** `server/routes.ts` (all routes)
- **Problem:** Request body validation is done manually per route. Many routes likely have incomplete validation. No Zod middleware applied globally.
- **Risk:** Missing validation on any one of 632+ endpoints is an injection or crash vector. The probability of missed validation in 16,975 lines is very high.
- **Recommendation:** Implement a `validate(schema)` middleware factory that wraps Zod schemas. Apply to every route that accepts a request body.
- **Priority:** HIGH

### API-002 — No Rate Limiting
- **File:** `server/routes.ts`, `server/auth.ts`
- **Problem:** No `express-rate-limit` or equivalent middleware found on any route.
- **Risk:** Authentication brute-force (SEC-HIGH-004), API key abuse, AI endpoint abuse (expensive), and general DDoS.
- **Recommendation:** Apply tiered rate limiting: 10 req/15min on auth routes, 100 req/min on client endpoints, 10 req/min on AI endpoints.
- **Priority:** HIGH

### API-003 — Inconsistent Error Response Format
- **File:** `server/routes.ts`
- **Problem:** Error responses use different shapes across routes: `{ error: "..." }`, `{ message: "..." }`, `{ success: false, msg: "..." }`, and unstructured strings.
- **Risk:** Frontend must handle multiple error shapes, increasing bug surface. API clients (mobile, external) cannot rely on a consistent error contract.
- **Recommendation:** Standardize all error responses: `{ success: false, error: { code: string, message: string } }`.
- **Priority:** MEDIUM

### API-004 — No API Versioning
- **File:** `server/routes.ts`
- **Problem:** All routes are at `/api/*` with no version prefix.
- **Risk:** Any breaking API change affects all clients (web, iOS, Android, external integrations) simultaneously. No graceful migration path.
- **Recommendation:** Introduce `/api/v1/*` versioning. Existing routes are v1.
- **Priority:** MEDIUM

### API-005 — Missing Auth Guards Audit
- **File:** `server/routes.ts`
- **Problem:** With 632+ endpoints in a 16,975-line file, it is not possible to manually verify that every route has the correct auth middleware applied. Some routes may be inadvertently public.
- **Risk:** Sensitive operations (admin actions, financial data, employee records) may be accessible without authentication.
- **Recommendation:** Add an automated test that hits every route without a session and asserts a 401 response (for protected routes). Document which routes should be public.
- **Priority:** HIGH

### API-006 — No API Documentation
- **File:** N/A
- **Problem:** No OpenAPI/Swagger spec exists. No auto-generated API docs.
- **Risk:** Developers building against the API (mobile apps, integrations) have no contract to work from. Breaking changes are invisible.
- **Recommendation:** Generate an OpenAPI 3.0 spec. Use `zod-to-openapi` to derive schemas from existing Zod validators.
- **Priority:** MEDIUM

### API-007 — Client API Key Auth — Silent Failure on Usage Tracking
- **File:** `server/routes.ts:3543`
- **Problem:** API key usage tracking update fails silently (see ARCH-003).
- **Risk:** API key usage stats (used for billing and abuse detection) may be incorrect.
- **Recommendation:** Log tracking failures. Consider retry with exponential backoff.
- **Priority:** MEDIUM

### API-008 — No Response Envelope Standard
- **File:** `server/routes.ts`
- **Problem:** Success responses are returned as raw objects, arrays, or `{ success: true, data: ... }` inconsistently.
- **Risk:** Frontend parsing logic is duplicated and inconsistent. Mobile clients cannot implement a generic response handler.
- **Recommendation:** Standardize: `{ success: true, data: T }` for all success responses. `{ success: false, error: { code, message } }` for all errors.
- **Priority:** MEDIUM

### API-009 — Large Request Body Limit
- **File:** `server/index.ts`
- **Problem:** `express.json({ limit: "50mb" })` — 50MB JSON body limit.
- **Risk:** Any unauthenticated (or authenticated) endpoint accepting JSON can be abused to send 50MB payloads, causing memory exhaustion.
- **Recommendation:** Reduce global limit to 1MB. Apply higher limits only on specific endpoints that require it (e.g., base64 image upload routes).
- **Priority:** MEDIUM

### API-010 — SSE Endpoints Not Audited for Cleanup
- **File:** `server/routes.ts`, `server/ai.ts`
- **Problem:** Server-Sent Events (SSE) streams for AI responses must clean up their event listeners and timers when the client disconnects.
- **Risk:** If cleanup handlers are missing or incomplete, each abandoned SSE connection leaks memory on the server. Under load, this causes OOM crashes.
- **Recommendation:** Audit all SSE endpoint handlers for `req.on('close', cleanup)` handlers. Verify AI streaming responses clean up on client disconnect.
- **Priority:** MEDIUM

---

## 4. Standard API Contract (For Reference)

> This is the standard that API endpoints should conform to. Not yet implemented.

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1234,
    "hasMore": true
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "field": "email"
  }
}
```

### HTTP Status Code Standards
| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Validation error / bad request |
| 401 | Not authenticated |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 422 | Unprocessable entity |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
