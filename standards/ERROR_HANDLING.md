# ERROR_HANDLING.md — QIROX Error Handling Standards

> **Source of truth:** docs/ARCHITECTURE.md, docs/API_STANDARDS.md, docs/UI_RULES.md  
> **Scope:** server/ error middleware, client/ error boundaries and query error states  
> **Status:** Enforcement-ready — no production code modified

---

## Purpose

Define how errors are caught, formatted, logged, and surfaced to users throughout the QIROX platform. Derived from the architecture audit finding ISSUE-ARCH-003 (inconsistent error handling) in docs/ARCHITECTURE.md.

---

## Rules

### R-ERR-001 — All Express Route Errors Must Flow to Centralized Error Handler
Route handlers must not send error responses inline. They must call `next(error)`. The centralized error handler is the only place that sends error responses. Per docs/ARCHITECTURE.md ISSUE-ARCH-003.

```typescript
// FORBIDDEN: inline error response
router.get('/orders', async (req, res) => {
  try { ... }
  catch (err) { res.status(500).json({ error: 'Something went wrong' }); }
});

// CORRECT: delegate to centralized handler
router.get('/orders', async (req, res, next) => {
  try { ... }
  catch (err) { next(err); }
});
```

### R-ERR-002 — Centralized Error Handler Must Produce Standard Error Envelope
The single global error handler must always produce:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```
In development, the handler may include `stack` for debugging. In production, `stack` must be omitted. Per docs/API_STANDARDS.md API-003.

### R-ERR-003 — Error Codes Must Be Defined in a Central Registry
All error codes must come from a shared `ErrorCode` enum in `shared/src/errors.ts`:
```typescript
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  AI_QUOTA_EXCEEDED = 'AI_QUOTA_EXCEEDED',
  // ... domain-specific codes
}
```
Ad-hoc string error codes in route handlers are forbidden for new code.

### R-ERR-004 — Custom Error Class Must Carry HTTP Status and Error Code
Use the standard `AppError` class:
```typescript
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    public field?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```
Throwing a plain `Error` in route logic is allowed but must be caught by the centralized handler which maps it to a 500.

### R-ERR-005 — Silent Error Swallowing Is Forbidden
`.catch(() => {})` is forbidden everywhere. Every caught error must be either:
- Re-thrown (so it reaches the centralized handler or a parent catch block), OR
- Logged with minimum `logger.error()` and a reason why it's non-fatal
Per docs/ARCHITECTURE.md ISSUE-ARCH-003 and docs/SECURITY.md SEC-MED-003.

### R-ERR-006 — Frontend Must Have a React Error Boundary at the App Level
An `<ErrorBoundary>` component must wrap the application root. It must catch any unhandled render errors and display a friendly Arabic error message with a "reload page" option. Per docs/UI_RULES.md UI-003.

### R-ERR-007 — Every Query Error State Must Be Shown to the User
Pages using `useQuery` must check `isError` and render a visible error card with:
- Arabic error message
- Retry button that calls `refetch()`
Do not silently show an empty page when a query fails. Per docs/UI_RULES.md UI-003.

### R-ERR-008 — Mutation Errors Must Show a Toast Notification
Every `useMutation` must have an `onError` handler that shows a toast notification in Arabic. Do not silently fail. Per docs/UX_RULES.md UX-003.

### R-ERR-009 — Mongoose ValidationError Must Map to 400
The centralized error handler must check `err.name === 'ValidationError'` and return a 400 response with the field name and Arabic-friendly message. Per docs/API_STANDARDS.md API-003.

### R-ERR-010 — MongoDB Duplicate Key Error Must Map to 409
`err.code === 11000` (MongoDB duplicate key) must return a 409 Conflict response. The handler must extract the field name from `err.keyValue` and include it in the response.

### R-ERR-011 — Zod Validation Errors Must List All Failing Fields
When the `validate()` middleware rejects a request, it must return all Zod errors (not just the first), formatted as an array of `{ field, message }` objects in the error response. Per docs/API_STANDARDS.md API-001.

### R-ERR-012 — AI Tool Executor Errors Must Not Leak Internal Prompts
When an AI tool call fails, the error response must contain only a user-friendly message. The system prompt, tool definitions, and raw LLM error must be logged server-side only. Never sent to the client.

---

## Allowed

- `logger.warn()` for non-fatal caught errors that are handled gracefully (e.g., optional third-party API failure)
- `try/catch` with re-throw for middleware that wraps async route handlers
- `process.on('unhandledRejection', ...)` and `process.on('uncaughtException', ...)` at the server root for last-resort logging before crash

---

## Forbidden

- Inline `res.status(500).json(...)` in route handlers
- `.catch(() => {})` — silent error swallowing
- `console.error(err)` in production routes (use logger)
- Exposing `err.stack` to clients in production
- Leaking internal system prompt or LLM details in API error responses
- Missing `isError` handling in `useQuery` components
- Silent mutation failures (no toast on `onError`)

---

## Examples

### Centralized Error Handler
```typescript
// server/middleware/error-handler.ts
import { ErrorRequestHandler } from 'express';
import { AppError, ErrorCode } from '../../shared/errors';
import { logger } from '../logger';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: { code: ErrorCode.VALIDATION_ERROR, message: err.message }
    });
  }

  // MongoDB duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: { code: ErrorCode.CONFLICT, message: `${field} already exists`, field }
    });
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : ErrorCode.INTERNAL_ERROR;
  const message = err instanceof AppError ? err.message : 'An unexpected error occurred';

  res.status(statusCode).json({ success: false, error: { code, message } });
};
```

### Frontend Query Error State
```typescript
const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['/api/orders'] });

if (isError) {
  return (
    <Card className="p-6 text-center">
      <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
      <p className="text-destructive">{t('errors.loadFailed')}</p>
      <Button variant="outline" onClick={() => refetch()} className="mt-3">
        {t('common.retry')}
      </Button>
    </Card>
  );
}
```

### Mutation Error Toast
```typescript
const mutation = useMutation({
  mutationFn: (id: string) => apiRequest('DELETE', `/api/orders/${id}`),
  onSuccess: () => toast({ title: t('order.deleted') }),
  onError: (err) => toast({ title: t('errors.deleteFailed'), variant: 'destructive' }),
});
```

---

## Checklist

- [ ] All route handlers call `next(err)` on error — no inline error responses
- [ ] Centralized error handler in place and registered as last middleware
- [ ] Error envelope: `{ success: false, error: { code, message } }`
- [ ] Error codes from shared `ErrorCode` enum
- [ ] No `.catch(() => {})` anywhere
- [ ] React `<ErrorBoundary>` wraps app root
- [ ] Every `useQuery` renders an error card with retry button on `isError`
- [ ] Every `useMutation` shows a toast on `onError`
- [ ] Mongoose ValidationError → 400
- [ ] MongoDB duplicate key → 409
- [ ] Zod errors return all failing fields
- [ ] Stack trace excluded from production error responses

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| `catch (err) { res.status(500).json(...) }` | `catch (err) { next(err) }` |
| `} catch (_) {}` | Log or re-throw; never silently ignore |
| No error card when query fails | Add `if (isError) return <ErrorCard onRetry={refetch} />` |
| No toast on mutation failure | Add `onError: (e) => toast({ variant: 'destructive', ... })` |
| `err.stack` in production response | Gate: `stack: isDev ? err.stack : undefined` |

---

## Future Scalability Considerations

- Integrate an error monitoring service (Sentry or Axiom) for production error aggregation and alerting with source map support
- When the API reaches external consumers (v1 public API), error codes must be versioned and documented — breaking changes to error codes require a new API version
- Implement error budget tracking: if the 500 error rate exceeds 1% of requests in any 5-minute window, trigger an alert
- Consider structured logging with trace IDs to correlate frontend errors to backend error logs across the full request lifecycle
