---
name: Apple OAuth form POST
description: Same-origin middleware interaction with Sign in with Apple form_post callbacks
---

Sign in with Apple posts the OAuth callback from Apple's origin, not the application's origin. A global same-origin check for state-changing API requests must let the exact Apple callback route reach Passport; OAuth response/state validation remains the security boundary for that provider callback.

**Why:** The callback was rejected with the generic unauthorized-origin JSON response before the Apple strategy could process it.

**How to apply:** Keep the exception narrow to `POST /api/auth/apple/callback`; do not weaken the same-origin check for other API mutations.