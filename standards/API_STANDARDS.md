# API_STANDARDS.md — QIROX API Contract Standards

> **Source of truth:** docs/API_STANDARDS.md, docs/API_BLUEPRINT.md, docs/RBAC_DESIGN.md  
> **Scope:** All 710+ API endpoints in server/routes/  
> **Status:** Enforcement-ready — no production code modified

---

## Purpose

Define the API contract every endpoint must conform to — response shape, error format, HTTP status codes, rate limiting tiers, authentication requirements, and validation rules. Derived entirely from docs/API_BLUEPRINT.md and docs/API_STANDARDS.md.

---

## Rules

### R-API-001 — Standard Success Response Envelope
All success responses must use this exact shape:
```json
{ "success": true, "data": <T> }
```
For paginated lists:
```json
{
  "success": true,
  "data": [],
  "pagination": { "page": 1, "limit": 50, "total": 1234, "hasMore": true }
}
```
Raw objects, arrays, or inconsistent shapes are forbidden for new routes. Per docs/API_STANDARDS.md API-008.

### R-API-002 — Standard Error Response Envelope
All error responses must use this exact shape:
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
Shapes like `{ "error": "..." }`, `{ "message": "..." }`, or `{ "msg": "..." }` are forbidden. Per docs/API_STANDARDS.md API-003.

### R-API-003 — HTTP Status Code Standards
| Code | Meaning | When to Use |
|---|---|---|
| 200 | Success | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST that creates a resource |
| 400 | Validation error | Invalid input, schema mismatch |
| 401 | Not authenticated | No session or session expired |
| 403 | Not authorized | Authenticated but wrong role |
| 404 | Not found | Resource does not exist |
| 409 | Conflict | Duplicate resource (username taken, etc.) |
| 422 | Unprocessable | Valid format, fails business rules |
| 429 | Rate limited | Too many requests |
| 500 | Server error | Unexpected internal error |

### R-API-004 — Authentication Rules
| Route Group | Auth Required | Roles |
|---|---|---|
| `/api/auth/login`, `/api/auth/register` | No | N/A |
| `/api/public/*` | No | All |
| `/api/admin/*` | Yes | `admin` |
| `/api/admin/finance/*` | Yes | `admin`, `accountant` |
| `/api/admin/employees/*` | Yes | `admin`, `manager` |
| `/api/employee/*` | Yes | All employee roles |
| `/api/client/*` | Yes | `client` |
| `/api/wallet/*` | Yes | `client`, `merchant` |
| `/api/ai/*` | Yes | All authenticated |
| `/api/sandbox/*` | Yes | `developer`, `admin` |
| `/api/deploy/*` | Yes | `developer`, `admin` |
| `/api/qmeet/*` | Yes | All authenticated |
| `/api/supplier/*` | Yes | `supplier` |
| `/api/investor/*` | Yes | `investor` |

### R-API-005 — Rate Limiting Requirements
Per docs/API_BLUEPRINT.md Section 2:
| Route Group | Limit |
|---|---|
| `POST /api/ai/*` | 10 req/min per user |
| `POST /api/wallet/*` | 20 req/min |
| `POST /api/paypal/*` | 10 req/min |
| `GET /api/admin/*` | 100 req/min per user |
| All other authenticated | 200 req/min per user |
| All public GET | 60 req/min per IP |
| Auth routes | Already limited — maintain existing limiters |

### R-API-006 — All Body-Accepting Routes Must Have Zod Validation
Every `POST`, `PUT`, `PATCH` route must apply the `validate(schema)` middleware with a Zod schema. No route may accept and use unvalidated body data. Per docs/API_STANDARDS.md API-001.

### R-API-007 — Default Pagination on All List Routes
All list-returning `GET` routes must enforce pagination:
- Default limit: 50
- Maximum limit: 100 (clamp if client requests more)
- Default skip: 0
- Unbounded `Model.find()` without limit is forbidden. Per docs/DATABASE.md DB-006.

### R-API-008 — WebSocket Events Must Follow the Documented Schema
WebSocket events must match the event schema in docs/API_BLUEPRINT.md Section 7. No ad-hoc event type names or payload shapes.

### R-API-009 — Global JSON Body Limit Is 1MB
The global `express.json()` body limit must not exceed 1MB. Per docs/API_STANDARDS.md API-009. Higher limits require scoped per-route middleware with documentation.

### R-API-010 — AI Tool Arguments Must Be Validated Against Zod Schemas Before DB Operations
LLM-generated tool arguments must be validated before any database operation. Inputs containing `$` keys (MongoDB operators) must be rejected. Per docs/SECURITY.md SEC-HIGH-001.

---

## Allowed

- Higher body limits per-route (scoped middleware) for documented endpoints (e.g., base64 image upload)
- Custom error codes beyond the standard set as long as the outer envelope shape is maintained
- Partial responses (`fields` query param) on heavy admin endpoints
- Cursor-based pagination as an alternative to offset/limit for high-volume collections

---

## Forbidden

- Raw array or object responses without the `{ success, data }` envelope
- Error responses without a `code` field
- Routes accepting POST/PATCH/PUT body without Zod validation middleware
- Unbounded `Model.find()` without limit/skip
- Missing auth middleware on protected routes
- Missing rate limiter on AI, wallet, and PayPal route groups
- AI tool arguments used in DB queries without prior Zod validation

---

## Examples

### Standard Paginated List Endpoint
```typescript
router.get('/orders', requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const [data, total] = await Promise.all([
      OrderModel.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      OrderModel.countDocuments()
    ]);
    res.json({
      success: true,
      data,
      pagination: { page, limit, total, hasMore: total > page * limit }
    });
  } catch (err) {
    next(err);
  }
});
```

### Standard Error Response
```typescript
// In centralized error handler:
res.status(err.statusCode || 500).json({
  success: false,
  error: {
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred'
  }
});
```

---

## Checklist

- [ ] Response uses `{ success: true, data: T }` envelope
- [ ] Error uses `{ success: false, error: { code, message } }` envelope
- [ ] Correct HTTP status code used
- [ ] Auth middleware applied for protected routes
- [ ] Rate limiter applied for the route group
- [ ] Zod validation middleware on body-accepting routes
- [ ] Pagination enforced on list routes (default 50, max 100)
- [ ] AI tool arguments validated before DB operations

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| `res.json({ error: 'Not found' })` | `res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '...' } })` |
| `Model.find()` with no limit | Add `.limit(50).skip(skip)` |
| Missing `validate()` on POST route | Add `validate(schema)` before handler |
| Using 200 for created resources | Use 201 for successful creates |
| No rate limiter on `/api/ai/*` | Apply `aiLimiter` to all AI routes |

---

## Future Scalability Considerations

- Introduce API versioning (`/api/v1/*`) before any breaking change — existing routes are v1 per docs/API_STANDARDS.md API-004
- Generate OpenAPI 3.0 spec from Zod schemas using `zod-to-openapi` (docs/EXECUTION_PLAN.md Phase 3)
- Consider GraphQL for admin analytics endpoints to reduce over-fetching on the heavy reporting dashboard
- When external partners integrate via API keys, enforce per-key rate limits separately from session-based limits
