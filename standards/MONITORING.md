# MONITORING.md — QIROX Monitoring Standards

> **Source of truth:** docs/EXECUTION_PLAN.md Phase 7, docs/API_BLUEPRINT.md, docs/MASTER_BLUEPRINT.md  
> **Scope:** Production environment observability — health checks, alerting, metrics  
> **Status:** Enforcement-ready — no production code modified

---

## Purpose

Define the monitoring, health check, and alerting requirements for QIROX. Derived from docs/EXECUTION_PLAN.md Phase 7 (QA and Monitoring) and docs/API_BLUEPRINT.md (health check endpoint specification).

---

## Rules

### R-MON-001 — Health Check Endpoint Is Mandatory
`GET /api/health` must exist and must return a 200 OK with:
```json
{
  "status": "ok",
  "timestamp": "2026-07-09T10:23:45.123Z",
  "uptime": 12345.67,
  "database": "connected",
  "version": "1.0.0"
}
```
If MongoDB is disconnected, the response must be 503 with `"database": "disconnected"`. Per docs/API_BLUEPRINT.md Section 1.

### R-MON-002 — Health Check Must Respond in Under 500ms
The health check endpoint must not run expensive queries. It checks only:
- MongoDB connection state (`mongoose.connection.readyState === 1`)
- Server uptime (`process.uptime()`)
Heavy operations (aggregations, external API pings) are forbidden in the health check. Per docs/EXECUTION_PLAN.md Phase 7.

### R-MON-003 — Database Connection Status Must Be Monitored
MongoDB connection state must be tracked and exposed in the health check. A MongoDB disconnect event must trigger a `logger.error()` at minimum, and an alert if a monitoring service is configured. Per docs/DATABASE.md DB-007.

### R-MON-004 — Cron Job Execution Must Be Logged
Every cron job execution must log its start and end times and any errors. The admin cron panel must show last-run time and status for all 27 jobs. Per server/cron.ts.

### R-MON-005 — Error Rate Must Be Tracked
The server must track the count of 5xx errors per time window. If the monitoring service is configured, an alert must fire when 5xx rate exceeds 1% of requests in any 5-minute window. Per docs/EXECUTION_PLAN.md Phase 7.

### R-MON-006 — AI Endpoint Usage Must Be Tracked
Per user and per model, the system must track:
- Number of AI requests made
- Total tokens consumed (input + output)
- Number of rate limit hits
This data is stored in the existing `AISession` model and viewable in the admin AI sessions panel. Per docs/MASTER_BLUEPRINT.md Section 5.

### R-MON-007 — Push Notification Delivery Must Be Tracked
The push notification system must log success and failure counts for each send batch. Failed deliveries (expired subscriptions, invalid endpoints) must be pruned from the subscription list. Per server/push.ts.

### R-MON-008 — Deployment Health Check Before Traffic Routing
The deployment platform must verify `GET /api/health` returns 200 before switching traffic to a new deployment. Deployment without a passing health check is forbidden. Per docs/DEPLOYMENT_STANDARDS.md R-DEPLOY-004 and docs/EXECUTION_PLAN.md Phase 7.

### R-MON-009 — WebSocket Connection Count Must Be Tracked
The WebSocket server must track the number of active connections. This count must be available in the admin dashboard or health check extended endpoint. Per docs/API_BLUEPRINT.md Section 7.

### R-MON-010 — Response Time SLOs
| Endpoint Group | P95 Target |
|---|---|
| `GET /api/health` | < 50ms |
| Public GET endpoints | < 500ms |
| Admin list endpoints (paginated) | < 1000ms |
| AI streaming endpoints | First token < 3000ms |
| PDF generation endpoints | < 5000ms |
| Analytics aggregation (with cache) | < 2000ms |

---

## Monitoring Metrics Reference

### Infrastructure Metrics (Collect from Server)
| Metric | Alert Threshold |
|---|---|
| Node.js heap usage | > 80% of max heap |
| Event loop lag | > 100ms |
| Active HTTP connections | > 500 |
| Active WebSocket connections | > 200 |
| MongoDB pool utilization | > 90% |
| Disk usage (`uploads/`) | > 80% |

### Application Metrics (Track in Code)
| Metric | Where Stored |
|---|---|
| Orders created per day | OrderModel + admin analytics |
| Revenue per day | PaymentModel + finance panel |
| AI tokens consumed per user | AISessionModel |
| Active client sessions | express-session store |
| Cron job last-run time | Admin cron panel |
| Push notification delivery rate | Server logs + push subscription model |
| WebSocket connection count | Server memory (wsConnections map) |

### Business Metrics (Admin Dashboard)
| Metric | Update Frequency |
|---|---|
| New orders | Real-time (WebSocket) |
| Pending payments | Refreshed every 5 minutes |
| Active projects | Refreshed every 15 minutes |
| Monthly revenue | Refreshed every 30 minutes |
| Cron job status | Updated on each execution |

---

## Allowed

- In-process metrics collection using `prom-client` when Prometheus integration is added
- Lightweight health check endpoint that only checks critical dependencies (MongoDB)
- Extended health endpoint (`/api/health/detailed`) requiring admin auth for full system status
- Third-party uptime monitoring pinging `GET /api/health` every 30 seconds

---

## Forbidden

- Health check running expensive aggregations or external API calls
- Deploying without a passing health check
- Cron jobs that fail silently (all cron failures must be logged)
- AI usage with no tracking (every AI call must record tokens to AISessionModel)
- Push notification failures that leave invalid subscriptions in the database

---

## Examples

### Health Check Endpoint Implementation
```typescript
router.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  const isDbConnected = dbState === 1;

  const health = {
    status: isDbConnected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: isDbConnected ? 'connected' : 'disconnected',
    version: process.env.npm_package_version || '1.0.0'
  };

  res.status(isDbConnected ? 200 : 503).json(health);
});
```

### Cron Job Logging
```typescript
cron.schedule('0 9 * * *', async () => {
  const jobName = 'daily-invoice-reminders';
  const startTime = Date.now();
  logger.info(`Cron started: ${jobName}`, { context: 'cron' });

  try {
    const result = await sendInvoiceReminders();
    logger.info(`Cron completed: ${jobName}`, {
      context: 'cron',
      durationMs: Date.now() - startTime,
      invoicesSent: result.count
    });
  } catch (err) {
    logger.error(`Cron failed: ${jobName}`, {
      context: 'cron',
      durationMs: Date.now() - startTime,
      error: err instanceof Error ? err.message : String(err)
    });
  }
});
```

---

## Checklist

- [ ] `GET /api/health` responds 200 when healthy, 503 when DB disconnected
- [ ] Health check responds in < 500ms (no expensive queries)
- [ ] Cron job execution logged (start, end, result, errors)
- [ ] MongoDB disconnect triggers `logger.error()`
- [ ] AI requests save token usage to AISessionModel
- [ ] Push notification failures prune invalid subscriptions
- [ ] Deployment platform checks health endpoint before routing traffic
- [ ] WebSocket connection count tracked server-side
- [ ] Response time SLOs defined for each endpoint group

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| Health check running `OrderModel.countDocuments()` | Remove — check only `mongoose.connection.readyState` |
| Cron job with no try/catch | Wrap in try/catch; log errors |
| AI call not saving tokens to AISessionModel | Add token tracking in the AI response handler |
| Push failure leaving expired subscriptions | On 410 Gone, delete the subscription from DB |
| Deploying after a failed health check | Block deployment; investigate and fix before deploying |

---

## Future Scalability Considerations

- When the platform reaches production traffic, integrate Prometheus + Grafana for real-time dashboards of the metrics defined above
- Sentry or Datadog APM will provide distributed tracing — essential when the monolithic routes.ts is split into microservices
- Configure PagerDuty or OpsGenie alerts for critical thresholds: MongoDB down, 5xx rate spike, heap > 85%, disk > 90%
- When multi-region deployment is adopted, health checks must verify all regional MongoDB clusters independently
- Consider Synthetic Monitoring (Playwright tests running in production every 5 minutes) for end-to-end health validation of critical user flows: login, order creation, wallet payment
