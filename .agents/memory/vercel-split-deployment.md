---
name: Vercel split deployment
description: Production constraint and required configuration when the frontend is hosted on Vercel separately from the persistent API.
---

The current Vercel setup serves the frontend as static files and cannot run the full backend, which depends on Express, MongoDB sessions, WebSockets, cron jobs, and the WhatsApp connection. Deploy the backend to a persistent runtime such as Render or Replit Deployments, then connect the Vercel frontend to it.

**Why:** Static Vercel rewrites can return the SPA document for unserved `/api/*` calls, making authentication appear broken even when the frontend itself loads.

**How to apply:** Set `AUTH_BASE_URL` to the backend's public origin, `PUBLIC_APP_URL` to the Vercel origin, and allow that frontend with `CORS_ORIGINS`. For cross-site sessions use `SESSION_COOKIE_SAMESITE=none`; set OAuth callback variables to provider-registered backend callback URLs. Production still requires `MONGODB_URI` and `SESSION_SECRET`.