# Vercel frontend + Render backend

The Vercel deployment serves the React application.  All `/api/*` requests are
handled by `api/[...path].js`, which forwards them to the always-running Render
service.  This is required because MongoDB sessions, OAuth, WebSockets, cron
jobs, and WhatsApp cannot run as a static Vercel site.

## 1. Deploy the backend on Render

Create a **Web Service** from this repository.  Render can use `render.yaml`
with the following commands:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` (or the command in `render.yaml`) |
| Start command | `npm start` |
| Health check | `/api/health` |

Set these environment variables in Render.  Do not copy secrets into source
files.

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `SESSION_SECRET` | A long random secret, stable across deployments |
| `PUBLIC_APP_URL` | The public Vercel URL, such as `https://app.example.com` |
| `SESSION_COOKIE_SAMESITE` | `none` |
| `GOOGLE_CALLBACK_URL` | `https://app.example.com/api/auth/google/callback` |
| `APPLE_CALLBACK_URL` | `https://app.example.com/api/auth/apple/callback` |
| `GITHUB_CALLBACK_URL` | `https://app.example.com/api/auth/github/callback` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Existing Google OAuth credentials |
| `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` | Existing Apple Sign In credentials |

Copy the resulting Render HTTPS URL.  Confirm that
`https://<render-service>/api/health` returns JSON with `"status": "ok"` and
`"db": "connected"`.

## 2. Configure Vercel

Import the same repository as a Vercel project.  Its build settings are already
in `vercel.json`.

Add this Vercel environment variable for **Production**, **Preview**, and
**Development** as appropriate:

| Variable | Value |
| --- | --- |
| `RENDER_BACKEND_URL` | The Render HTTPS URL, for example `https://your-service.onrender.com` |

The Vercel function forwards cookies, POST bodies, uploads, redirects, and
Apple's POST callback.  Do not add a Vercel rewrite that sends `/api/*` to the
SPA entry point.

## 3. Register provider callback URLs

Use the public Vercel URL, not the Render URL:

| Provider | Authorized callback URL |
| --- | --- |
| Google | `https://app.example.com/api/auth/google/callback` |
| Apple | `https://app.example.com/api/auth/apple/callback` |
| GitHub | `https://app.example.com/api/auth/github/callback` |

For Apple, also add the Vercel domain to the service identifier's allowed
website domains and return URLs.

## 4. Configure MongoDB Atlas

Allow network access from the Render service, create the application database
user, and set the same `MONGODB_URI` in Render.  The API health check must
report `db: "connected"` before testing login.

## 5. Verify in order

1. Visit `https://<vercel-domain>/api/health`; it must return JSON, not the
   React HTML page.
2. Open `/login`; the Google and Apple buttons should be visible when their
   credentials are present in Render.
3. Test Google and Apple in a real browser.  Both should return to the Vercel
   `/login` page and then continue to the correct dashboard.
4. Test password login and a database-backed page.
