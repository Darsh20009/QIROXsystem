# DEPLOYMENT_STANDARDS.md — QIROX Deployment Standards

> **Source of truth:** docs/EXECUTION_PLAN.md, docs/MASTER_BLUEPRINT.md, docs/SECURITY.md  
> **Scope:** All deployment environments (development, staging, production)  
> **Status:** Enforcement-ready — no production code modified

---

## Purpose

Define the deployment process, environment configuration, and production readiness requirements for the QIROX platform. Derived from docs/MASTER_BLUEPRINT.md Section 6 and docs/EXECUTION_PLAN.md Phase 1 (Infrastructure) and Phase 7 (QA).

---

## Rules

### R-DEPLOY-001 — All Required Environment Variables Must Be Set Before Deployment
A deployment must not proceed if any required environment variable is missing. The startup validation block must run first and fail fast with a clear message. Required env vars:

| Variable | Required In | Purpose |
|---|---|---|
| `MONGODB_URI` | All | Primary database connection |
| `SESSION_SECRET` | All | Session encryption |
| `SMTP2GO_API_KEY` | Production | Email delivery |
| `SMTP2GO_SENDER` | Production | From address |
| `SANDBOX_ENC_KEY` | Production | Sandbox env var encryption |
| `VAPID_PUBLIC_KEY` | Production | Web Push |
| `VAPID_PRIVATE_KEY` | Production | Web Push |

Per docs/MASTER_BLUEPRINT.md Section 6 and docs/SECURITY.md SEC-MED-002.

### R-DEPLOY-002 — SESSION_SECRET Must Be a Cryptographically Strong Random String
In production, `SESSION_SECRET` must be a minimum 64-character random hex string. Generate with: `openssl rand -hex 32`. Never reuse across environments. Per docs/SECURITY.md SEC-CRIT-001.

### R-DEPLOY-003 — Build Must Succeed Before Deployment
The build pipeline (`npm run build`) must succeed without TypeScript errors or build failures. A failing build must block deployment. Per docs/EXECUTION_PLAN.md Phase 7.

### R-DEPLOY-004 — Health Check Endpoint Must Return 200 Before Traffic Routing
The deployment platform must verify `GET /api/health` returns HTTP 200 before routing live traffic. If the health check fails, the deployment must be rolled back automatically. Per docs/API_BLUEPRINT.md Section 1.

### R-DEPLOY-005 — Production Must Run in `NODE_ENV=production`
`NODE_ENV=production` must be set in the production environment. This enables:
- DevTools detection and right-click blocking (per docs/MASTER_BLUEPRINT.md and replit.md Gotchas)
- Console.log suppression
- Helmet security headers
- Minified frontend bundle

### R-DEPLOY-006 — HTTPS Is Mandatory for All Production Traffic
All production traffic must be served over HTTPS. HTTP traffic must be redirected to HTTPS. Session cookies must have `secure: true` in production. Per docs/SECURITY.md SEC-MED-006.

### R-DEPLOY-007 — Database Migrations Must Be Applied Before the Server Starts
Any schema changes (new indexes, new collections, field renames) must be applied before the new server version starts serving traffic. Maintain a `server/migrations/` directory with migration scripts. Per docs/EXECUTION_PLAN.md Phase 2.

### R-DEPLOY-008 — Upload Directory Must Persist Across Deployments
The `uploads/` directory must be mounted as persistent storage. If using Replit deployment, verify the volume is attached. File uploads must not be lost on redeployment. Per docs/MASTER_BLUEPRINT.md Section 7.

### R-DEPLOY-009 — MongoDB Atlas IP Allowlist Must Be Maintained
The production server's IP address must be added to the MongoDB Atlas IP allowlist. Wildcard `0.0.0.0/0` is forbidden in production Atlas clusters. Per docs/SECURITY.md SEC-HIGH-003.

### R-DEPLOY-010 — Deployment Must Be Staged (Dev → Staging → Production)
Code must flow through: development → staging → production. No direct pushes to production from local development. Per docs/EXECUTION_PLAN.md Phase 0.

### R-DEPLOY-011 — Rollback Plan Must Exist for Every Release
Before each production deployment, the last known-good commit must be documented. Rollback requires:
1. Revert to the previous deployment (platform rollback)
2. Verify `GET /api/health` returns 200
3. Verify MongoDB connection in health check response

### R-DEPLOY-012 — Cron Jobs Must Be Verified After Deployment
After each production deployment, verify that all 27 cron jobs have re-registered by checking the admin cron panel. Cron registration happens at startup — verify the log shows "27 cron jobs initialized". Per server/index.ts.

---

## Allowed

- Blue-green deployment to reduce downtime
- Rolling deployments when multiple instances are available
- Feature flags to enable features in production without a new deployment
- Read replicas for analytics-heavy endpoints
- Automated Replit deployment via the Deploy button (standard deployment)

---

## Forbidden

- Deploying with missing required environment variables
- Deploying without a passing build
- Using `0.0.0.0/0` as Atlas IP allowlist in production
- Serving production over HTTP without HTTPS redirect
- Hardcoded short or predictable `SESSION_SECRET` values
- Deploying without verifying the health check endpoint
- Losing `uploads/` directory content during deployment

---

## Pre-Deployment Checklist

- [ ] All required env vars set for the target environment
- [ ] `npm run build` passes without errors
- [ ] `npm run typecheck` passes
- [ ] Health check endpoint (`GET /api/health`) returns 200 in the current environment
- [ ] Database indexes verified (check Atlas Index view)
- [ ] `SESSION_SECRET` is a 64+ char random string in production
- [ ] `SANDBOX_ENC_KEY` set in production
- [ ] `NODE_ENV=production` set
- [ ] `uploads/` volume confirmed mounted
- [ ] Previous deployment commit SHA documented for rollback
- [ ] Atlas IP allowlist includes production server IP

---

## Post-Deployment Checklist

- [ ] Health check returns 200
- [ ] MongoDB connection shown as "connected" in health check
- [ ] Admin panel accessible and functional
- [ ] Client portal login works
- [ ] 27 cron jobs shown as registered in admin cron panel
- [ ] Push notification test succeeds
- [ ] Email send test succeeds (from admin settings)

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| Missing `SESSION_SECRET` causes 500 on all routes | Add startup env var check; fail fast with clear error |
| `uploads/` lost after redeployment | Mount as persistent volume; verify before deploying |
| Cron jobs not running in production | Check startup logs for "cron jobs initialized" message |
| Atlas connection refused in production | Add server IP to Atlas IP allowlist |
| HTTP session cookie lost on HTTPS redirect | Set `cookie.secure: true`, `cookie.sameSite: 'lax'` in production |

---

## Future Scalability Considerations

- When moving to multi-instance deployment, `uploads/` must migrate to object storage (AWS S3 or Cloudflare R2) to be accessible across all instances
- CI/CD pipeline (GitHub Actions or Replit CI) should automate the pre-deployment checklist
- Zero-downtime deployment requires health check polling during rollout — configure in the deployment platform
- When the platform reaches production traffic, establish monitoring alerts (uptime, error rate, response time) before each release
- ZATCA e-invoicing compliance (KSA) will require a separate production environment with specific network controls for tax authority integration
