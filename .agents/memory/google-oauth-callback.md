---
name: Google OAuth callback URL
description: How the Google OAuth callback URL is resolved and what env var controls it.
---

# Google OAuth Callback URL

## Rule
`GOOGLE_CALLBACK_URL` env var takes priority over the auto-generated URL in `server/routes.ts`.

```typescript
const CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://qiroxstudio.online/api/auth/google/callback"
    : devDomain
    ? `https://${devDomain}/api/auth/google/callback`
    : `http://localhost:5000/api/auth/google/callback`);
```

**Why:** The Replit dev domain changes every session, so `GOOGLE_CALLBACK_URL` is set to `https://qiroxstudio.online/api/auth/google/callback` (production) — the only URL registered in Google Cloud Console. This means Google OAuth always uses the production callback.

**Google Cloud Console Authorized Redirect URIs (as of this session):**
- `https://qiroxstudio.online/api/auth/google/callback` ✅
- `http://localhost:5000/api/auth/google/callback` (local dev, not used on Replit)

**How to apply:** If you add a new OAuth provider, use `process.env.PROVIDER_CALLBACK_URL ||` pattern to allow override without code changes.
