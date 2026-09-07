# NODE_STANDARDS.md — QIROX Node.js / Express Backend Standards

> **Source of truth:** docs/ARCHITECTURE.md, docs/SECURITY.md, docs/API_STANDARDS.md, docs/EXECUTION_PLAN.md  
> **Scope:** server/ — all Express routes, middleware, services, models, and utilities  
> **Status:** Enforcement-ready — no production code modified

---

## Purpose

Define the implementation rules for all Node.js/Express backend code. Derived from the architecture audit (docs/ARCHITECTURE.md) and security audit (docs/SECURITY.md). Every new server file must comply with these rules.

---

## Rules

### R-NODE-001 — All Routes Must Use the `requireRole()` Middleware Factory
Inline role checks (`if (req.user.role !== 'admin') return res.status(403)`) are forbidden. Use the centralized `requireRole(...roles)` middleware factory. Per docs/RBAC_DESIGN.md Section 8 and docs/PERMISSIONS.md PERM-002.

```typescript
// CORRECT
router.get('/admin/users', requireRole('admin', 'manager'), handler);

// FORBIDDEN
router.get('/admin/users', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  ...
});
```

### R-NODE-002 — All Routes Accepting a Body Must Use the `validate(schema)` Middleware
Per docs/API_STANDARDS.md API-001. The `validate(schema)` Zod middleware must be applied to every route that accepts a request body. Manual body validation per-route is forbidden for new code.

### R-NODE-003 — File Size Hard Limits
Per docs/PROJECT_STRUCTURE.md Section 4:
- Route files: < 400 lines each
- Model files: < 150 lines each
- Service files: < 600 lines each

`server/routes.ts` (16,975 lines) and `server/models.ts` (2,339 lines) are the reference violations.

### R-NODE-004 — No `exec()` With User-Influenced Input
`child_process.exec()` accepting user-controlled strings is forbidden (RCE risk). Use `execFile()` with an explicit array of arguments. Validate and allowlist all external command inputs. Per docs/SECURITY.md SEC-CRIT-002.

### R-NODE-005 — `SESSION_SECRET` Must Be Required at Startup, No Fallback
The pattern `process.env.SESSION_SECRET || "hardcoded"` is forbidden. A missing `SESSION_SECRET` must throw at startup. Per docs/SECURITY.md SEC-CRIT-001.

### R-NODE-006 — Environment Variables Must Be Validated at Startup
All required env vars must be checked in a startup validation block before any server begins serving requests. The check must throw if any required var is absent. Per docs/SECURITY.md SEC-MED-002.

### R-NODE-007 — Rate Limiting Is Required on Specific Route Groups
Per docs/API_BLUEPRINT.md Section 2:
- AI endpoints: 10 req/min per user
- Wallet endpoints: 20 req/min
- PayPal endpoints: 10 req/min
- Admin endpoints: 100 req/min per user
- Auth endpoints: already have limiters — maintain them

### R-NODE-008 — SSE Endpoints Must Clean Up on Client Disconnect
All Server-Sent Events handlers must register a `req.on('close', cleanup)` handler that cancels the LLM request and clears any timers. Per docs/API_STANDARDS.md API-010.

### R-NODE-009 — MongoDB URI Must Never Be Manipulated by Regex
The connection manager must not use string regex to mutate MongoDB URIs based on admin input. URIs must be validated against a whitelist of approved Atlas hostnames. Per docs/SECURITY.md SEC-HIGH-003 and docs/ARCHITECTURE.md ISSUE-ARCH-004.

### R-NODE-010 — File Uploads Must Validate MIME Type via Magic Bytes
Uploaded files must be validated with `file-type` (magic bytes check), not just file extension. Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`. Per docs/SECURITY.md SEC-HIGH-006.

### R-NODE-011 — No Duplicate Model Definitions
Each Mongoose model must live in its own file under `server/models/`. A model name must not be defined in more than one file. Per docs/ARCHITECTURE.md ISSUE-ARCH-002.

### R-NODE-012 — All Errors Must Flow to Centralized Error Handler
Route handlers must call `next(error)` rather than sending error responses inline. The centralized error handler middleware formats all error responses consistently. Per docs/ARCHITECTURE.md ISSUE-ARCH-003.

### R-NODE-013 — Sandbox Process PIDs Must Be Validated Before Use in Shell Commands
Any PID used in a kill command must be parsed as a positive integer and validated. Use `process.kill(pid, 'SIGTERM')` not `execSync('kill -- -${pid}')`. Per docs/SECURITY.md SEC-MED-004.

### R-NODE-014 — Global JSON Body Limit Is 1MB; Higher Limits Must Be Per-Route
`express.json({ limit: '50mb' })` on all routes is forbidden. The global limit must be 1MB. Routes requiring higher limits (e.g., base64 image upload) must apply a scoped middleware. Per docs/API_STANDARDS.md API-009.

### R-NODE-015 — Use Structured Logger, Not `console.log`
All server logging must use `server/logger.ts` (Winston or Pino). `console.log` / `console.error` / `console.warn` must not appear in production route handlers. Per docs/EXECUTION_PLAN.md Phase 1.

---

## Allowed

- `console.log` in startup scripts (before logger is initialized) with a migration plan to logger
- `execFile()` with fully validated, allowlisted argument arrays
- Per-route middleware stacking (rate-limiter + validate + requireRole + handler)
- In-memory cache (`server/cache.ts`) for expensive aggregation results

---

## Forbidden

- `exec(userInput)` or `execSync(userInput)` — RCE risk
- Inline role string comparisons — use `requireRole()`
- Manual Zod validation inside route handlers for new routes — use `validate()` middleware
- `SESSION_SECRET` with a hardcoded fallback
- `express.json({ limit: '50mb' })` as global middleware
- Silent `.catch(() => {})` error handling
- `console.log` in route handlers (use logger)
- Multiple Mongoose model definitions for the same collection

---

## Examples

### Standard Route Structure (New Code)
```typescript
// server/routes/admin/finance.routes.ts
import { Router } from 'express';
import { requireRole } from '../middleware/require-role';
import { validate } from '../middleware/validate';
import { createInvoiceSchema } from '../../shared/schema';
import { adminFinanceLimiter } from '../middleware/rate-limit';

const router = Router();

router.get(
  '/invoices',
  adminFinanceLimiter,
  requireRole('admin', 'accountant'),
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const invoices = await InvoiceModel.find({ deletedAt: null })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      res.json({ success: true, data: invoices });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/invoices',
  adminFinanceLimiter,
  requireRole('admin', 'accountant'),
  validate(createInvoiceSchema),
  async (req, res, next) => {
    try {
      const invoice = await InvoiceModel.create(req.body);
      res.status(201).json({ success: true, data: invoice });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
```

---

## Checklist

- [ ] `requireRole()` middleware on every protected route
- [ ] `validate(schema)` middleware on every body-accepting route
- [ ] File size within limits (< 400 lines for routes, < 150 for models)
- [ ] No `exec()` with user-influenced commands
- [ ] No session secret fallback
- [ ] Rate limiter applied per route group
- [ ] SSE endpoints have `req.on('close', cleanup)`
- [ ] MIME type validation on all upload routes
- [ ] Default pagination (limit: 50) on all list queries
- [ ] Errors passed to `next(err)` for centralized handling

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| Inline `if (req.user.role !== 'admin')` | Use `requireRole('admin')` middleware |
| Returning 500 inline: `res.status(500).json(...)` | `next(err)` to centralized handler |
| Missing pagination on list route | Add `limit` and `skip` with defaults |
| `exec(buildCmd)` in sandbox | `execFile('npm', ['run', 'build'])` with allowlist |
| Missing `req.on('close')` in SSE handler | Always register cleanup on client disconnect |

---

## Future Scalability Considerations

- When concurrency increases, replace in-memory cache with Redis to share state across multiple instances
- When the sandbox grows, move process management to a dedicated process pool manager with resource limits (CPU, memory, time)
- The split routes architecture (docs/PROJECT_STRUCTURE.md) enables team parallel development — assign route domains to individual engineers without merge conflicts
- Consider migrating to a framework with built-in validation (Fastify + ajv) for tighter performance on high-volume endpoints
