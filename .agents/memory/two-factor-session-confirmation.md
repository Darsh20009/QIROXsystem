---
name: 2FA session confirmation
description: Prevents successful two-factor verification from being followed immediately by an unauthenticated dashboard.
---

After password plus 2FA succeeds, confirm the new authenticated session with a credentialed `/api/user` request before redirecting or invalidating the user query. Retry briefly because cookie propagation through the preview/proxy can lag behind the verification response.

**Why:** Successful `/api/login` and `/api/auth/verify-2fa` responses were immediately followed by `401` responses from `/api/user` and dashboard APIs even though the Passport session had been persisted correctly in MongoDB.

**How to apply:** Any password, OAuth, push-approval, or recovery flow that completes 2FA must wait for session confirmation before loading authenticated pages. Do not trigger an immediate user-query invalidation after setting authenticated user data.