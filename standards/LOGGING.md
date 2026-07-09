# LOGGING.md — QIROX Logging Standards

> **Source of truth:** docs/ARCHITECTURE.md, docs/SECURITY.md, docs/EXECUTION_PLAN.md  
> **Scope:** server/logger.ts and all server/ code that produces log output  
> **Status:** Enforcement-ready — no production code modified

---

## Purpose

Define the structured logging requirements for the QIROX backend. Derived from the audit findings in docs/SECURITY.md SEC-MED-005 (console.log in production) and docs/ARCHITECTURE.md ISSUE-ARCH-003 (inconsistent error handling). The goal is a uniform, queryable log format that supports debugging without leaking sensitive data.

---

## Rules

### R-LOG-001 — All Production Logging Must Use the Structured Logger
All production log output must go through `server/logger.ts`. The logger must use Winston or Pino with JSON output format in production and pretty-print in development. `console.log`, `console.warn`, `console.error` are forbidden in route handlers and services in production. Per docs/SECURITY.md SEC-MED-005.

### R-LOG-002 — Log Levels Must Be Used Correctly
| Level | When to Use |
|---|---|
| `error` | Unhandled exceptions, database failures, external API failures |
| `warn` | Recoverable issues, missing optional config, deprecation hits |
| `info` | Application lifecycle events (startup, shutdown, connection), important business events (order created, payment processed) |
| `debug` | Detailed request/response details, query parameters — only in development |
| `http` | Incoming HTTP requests and responses (Morgan or built-in HTTP middleware) |

### R-LOG-003 — Log Messages Must Be Structured (JSON in Production)
Each log entry must be a JSON object with:
- `level` — log level string
- `message` — short human-readable description
- `timestamp` — ISO 8601 UTC
- `context` — domain identifier (e.g., `"auth"`, `"payments"`, `"ai"`, `"sandbox"`)
- Additional domain-specific fields as needed

```json
{
  "level": "info",
  "message": "Order created",
  "timestamp": "2026-07-09T10:23:45.123Z",
  "context": "orders",
  "orderId": "6a1b2c...",
  "clientId": "abc123...",
  "totalAmount": 5000
}
```

### R-LOG-004 — Sensitive Data Must Never Be Logged
The following must NEVER appear in logs:
- Passwords or password hashes
- Session tokens or JWT values
- Full credit card numbers
- MongoDB URIs with credentials
- SMTP credentials
- PayPal client secrets
- VAPID private keys
- `SANDBOX_ENC_KEY` values
- Full request body when it may contain any of the above
Per docs/SECURITY.md SEC-MED-005.

### R-LOG-005 — Request Logging Must Be Applied Globally
HTTP request/response logging (method, path, status code, response time) must be applied as middleware to all routes using Morgan or a built-in HTTP logger. Per docs/EXECUTION_PLAN.md Phase 1.

Format:
```
POST /api/auth/login 200 42ms
```

### R-LOG-006 — All Startup Events Must Be Logged at `info` Level
The following startup events must always be logged:
- Server starting (port, NODE_ENV)
- MongoDB connected (redact URI — show only hostname)
- All 27 cron jobs initialized
- WebSocket server ready
- Environment validation passed

### R-LOG-007 — All Errors Must Include Context
Every `logger.error()` call must include a context object with at minimum: `{ error: err.message, context: 'domain' }`. Stack traces must be included in the context in development and optionally in staging. Per docs/ARCHITECTURE.md ISSUE-ARCH-003.

### R-LOG-008 — AI Requests Must Be Logged with Token Count (No Prompt Content)
AI API calls must log:
- Model used
- Input token count
- Output token count
- Response time
- Tool calls made (names only, not arguments)
Never log the full system prompt, user prompt, or tool arguments (may contain PII). Per docs/SECURITY.md SEC-MED-005.

### R-LOG-009 — Log Level Must Be Configurable via Environment Variable
The log level must be set by `LOG_LEVEL` env var with a default of `'info'` in production and `'debug'` in development. Hardcoded log levels are forbidden.

### R-LOG-010 — Financial Events Must Be Logged at `info` Level with Full Context
Payment and wallet events must always be logged:
- Payment initiated: amount, method, user ID, order ID
- Payment completed: same fields + transaction ID
- Payment failed: same fields + error code
- Wallet debit/credit: user ID, amount, balance before, balance after
These logs are the audit trail for financial disputes.

---

## Allowed

- `console.log` in startup scripts before logger is initialized (with a plan to migrate)
- `console.log` in development-only scripts under `scripts/` or `tools/`
- Logging request body fields explicitly (not the full body) when those fields are non-sensitive

---

## Forbidden

- `console.log`, `console.warn`, `console.error` in route handlers or services in production
- Full request body logging when body may contain credentials
- Logging passwords, tokens, secrets, or connection strings with credentials
- Hardcoded log level (use `LOG_LEVEL` env var)
- Swallowing errors without logging: `.catch(() => {})`

---

## Examples

### Logger Setup (Winston)
```typescript
// server/logger.ts
import winston from 'winston';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  format: isDev
    ? winston.format.combine(winston.format.colorize(), winston.format.simple())
    : winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});
```

### Correct Error Logging
```typescript
try {
  await PaymentModel.create(paymentData);
} catch (err) {
  logger.error('Payment record creation failed', {
    context: 'payments',
    error: err instanceof Error ? err.message : String(err),
    orderId: paymentData.orderId,
    amount: paymentData.amount
    // NOT: paymentData itself (may contain card details)
  });
  next(err);
}
```

### AI Request Logging
```typescript
const response = await openai.chat.completions.create(params);

logger.info('AI completion completed', {
  context: 'ai',
  model: params.model,
  inputTokens: response.usage?.prompt_tokens,
  outputTokens: response.usage?.completion_tokens,
  toolCalls: response.choices[0]?.message?.tool_calls?.map(t => t.function.name),
  durationMs: Date.now() - startTime
  // NOT: params.messages (contains system prompt and user content)
});
```

### Financial Event Logging
```typescript
logger.info('Wallet debit completed', {
  context: 'wallet',
  userId: wallet.userId.toString(),
  amount: debitAmount,
  balanceBefore: previousBalance,
  balanceAfter: wallet.balance,
  orderId: order._id.toString(),
  transactionId: transaction._id.toString()
});
```

---

## Checklist

- [ ] `server/logger.ts` created with Winston/Pino, JSON in production
- [ ] `LOG_LEVEL` env var controls level (default: info in prod, debug in dev)
- [ ] All `console.log` removed from route handlers and services
- [ ] HTTP request logging middleware applied globally
- [ ] Startup events logged at `info` level
- [ ] Errors logged with context object (message, context domain)
- [ ] No passwords, tokens, or secrets in any log
- [ ] AI requests log token counts and tool names — not prompt content
- [ ] Financial events logged with full context (amount, user, balance)

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| `console.log('Order created:', order)` | `logger.info('Order created', { context: 'orders', orderId: order._id })` |
| `console.error(err)` in catch block | `logger.error('Operation failed', { context: 'domain', error: err.message })` |
| Logging full request body: `logger.debug(req.body)` | Log only specific non-sensitive fields |
| Logging MongoDB URI: `logger.info(process.env.MONGODB_URI)` | Log only the hostname: `uri.replace(/:\/\/.*@/, '://<redacted>@')` |
| Hardcoded: `level: 'debug'` | `level: process.env.LOG_LEVEL \|\| 'info'` |

---

## Future Scalability Considerations

- Ship logs to a centralized log aggregation service (Datadog, Axiom, or Loki) for search, alerting, and retention
- When running multiple instances, ensure all instances share a log correlation ID (trace ID) per request for distributed tracing
- Financial audit logs should be exported to a separate, immutable log store (S3/R2) to satisfy accounting and compliance requirements
- Implement log sampling for high-volume debug logs in staging to reduce noise without losing signal
- When the API serves external partners, log all API-key-authenticated requests separately for billing/usage reporting
