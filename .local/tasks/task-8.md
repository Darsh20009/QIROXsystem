---
title: تطوير المصادقة الثنائية مع فرضها عند تسجيل الدخول وإضافة طرق متعددة
---
# Enhanced Two-Factor Authentication with Login Enforcement

## What & Why
Currently, the 2FA system only allows TOTP setup but does NOT enforce it during login — users with 2FA enabled are logged in directly without any verification step. This task adds:
1. Login enforcement: after email+password, if 2FA is enabled, block full login until 2FA is verified
2. Multiple 2FA methods: TOTP (existing), Email OTP, and Recovery Passphrase
3. Users can enable multiple methods and choose which to use at login

## Done looks like
- When a user with any 2FA method enabled logs in with email+password, they see a 2FA verification screen before gaining access
- The 2FA verification screen shows all enabled methods and the user can switch between them
- TOTP method: enter 6-digit code from authenticator app (already implemented, just needs login enforcement)
- Email OTP method: sends a 6-digit code to the user's email, user enters it
- Recovery Passphrase method: user enters a passphrase they set up earlier
- The 2FA settings page (TwoFactorSetup) shows all 3 methods with individual enable/disable toggles
- Google/GitHub OAuth logins bypass 2FA (already trusted via OAuth provider)

## Out of scope
- Backup/recovery codes (one-time use codes)
- SMS-based OTP
- Hardware security keys (WebAuthn is separate)

## Tasks
1. **Extend User model** — Add fields for email OTP 2FA (`emailOtpEnabled`) and recovery passphrase (`recoveryPassphrase`, `recoveryPassphraseEnabled`) to the User schema.
2. **Backend login flow** — Modify the POST `/api/auth/login` route so that when a user has any 2FA method enabled, instead of completing login, respond with `{ requires2FA: true, methods: [...], tempToken }` and store a pending session. Add a new POST `/api/auth/verify-2fa` endpoint that accepts the temp token + chosen method + code/passphrase to complete login.
3. **Backend 2FA method endpoints** — Add routes for enabling/disabling email OTP 2FA and recovery passphrase 2FA (setup, verify, disable for each method). Reuse existing OTP email infrastructure for email OTP.
4. **Frontend login 2FA step** — Update the Login page to handle the `requires2FA` response: show a 2FA verification screen with tabs/buttons for each enabled method, input for code/passphrase, and submit to `/api/auth/verify-2fa`.
5. **Frontend 2FA settings page** — Redesign TwoFactorSetup page to show all 3 methods as cards with individual setup/disable flows: TOTP (existing), Email OTP (toggle + verify), Recovery Passphrase (set + confirm).

## Relevant files
- `server/routes.ts:658-670`
- `server/routes.ts:8275-8340`
- `server/models.ts:49-50`
- `client/src/pages/Login.tsx`
- `client/src/pages/TwoFactorSetup.tsx`