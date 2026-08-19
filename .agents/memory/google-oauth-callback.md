---
name: OAuth callback routing
description: How OAuth callback URLs preserve browser sessions when Vercel fronts a Render backend.
---

# OAuth Callback Routing

## Rule
When the React frontend is on Vercel and Express is on Render, register each
provider callback on the **Vercel frontend domain** under `/api/auth/.../callback`,
not directly on the Render domain. Vercel's `/api` proxy forwards the callback
to Render and returns the session cookie to the browser on the frontend host.

`GOOGLE_CALLBACK_URL`, `GITHUB_CALLBACK_URL`, and `APPLE_CALLBACK_URL` take
priority. `PUBLIC_APP_URL` supplies the fallback frontend origin.

**Why:** A callback sent directly to Render creates a host-only session cookie
for Render. Requests later made to Vercel’s `/api` host then do not carry that
cookie. Apple also uses a cross-site POST callback, so production must use
`SESSION_COOKIE_SAMESITE=none` with secure cookies.

**How to apply:** Set `PUBLIC_APP_URL` to the final Vercel URL and set each
provider's explicit callback variable to the matching Vercel `/api/auth/...`
path. Register exactly those URLs with Google, Apple, and GitHub. Set
`RENDER_BACKEND_URL` only in Vercel so the proxy can reach the Render service.

For a new provider, use the matching `PROVIDER_CALLBACK_URL` override and send
its callback through the frontend proxy as well.
