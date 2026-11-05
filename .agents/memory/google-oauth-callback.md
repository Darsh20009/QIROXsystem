---
name: Google OAuth callback and trust rules
description: Callback allowlist plus the security rules required for Google account linking.
---

# Google OAuth callback and trust rules

## Rule
Only the approved QIROX callback may be used. `GOOGLE_CALLBACK_URL` may override the default only when it exactly matches the approved URL. OAuth state must be enabled when constructing the Passport Google strategy—not only on the route—so Passport uses its session-backed state store. Only Google-confirmed email addresses may be used to create or link local accounts.

**Why:** Callback drift breaks Google configuration; route-level state did not bind callbacks to a browser session with the installed Passport strategy, allowing login CSRF. Unverified provider email claims must not establish control of an existing local account.

**How to apply:** For every OAuth provider, use an explicit callback allowlist, a strategy-level session-backed state/nonce mechanism, and provider-verified identifiers before linking accounts.
