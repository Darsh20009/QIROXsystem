---
name: Employee Profile Features
description: What's built into the employee profile/hub — password change, Apple Wallet, QR login card, 2FA link.
---

# Employee Profile Features

## What exists

### QR Login (already existed before)
- Employee generates a unique QR token via `POST /api/employee/generate-qr-token`
- QR encodes `{origin}/api/qr-login/{token}` — server logs in the employee and redirects to their dashboard
- Displayed on the BACK of the flip ID card in `EmployeeProfile.tsx` (lines ~800-840)

### ID Card (already existed)
- Beautiful flip card: FRONT = photo + name + title + social links + logo; BACK = QR
- Download front/back as image via `downloadCardSide("front"/"back")` (uses print window)
- Located in `client/src/pages/EmployeeProfile.tsx` around lines 608-925

### Password Change (NEW — added 2026-07-31)
- Server: `POST /api/employee/change-password` — verifies current pw with bcrypt, hashes new pw
- UI: password change card in `EmployeeProfile.tsx` (before the Biometric card)
- If user logged in via Google/Apple, their DB password field may be empty → returns 400 with clear message
- 2FA quick link: added inside password change card → `href="/security/2fa"`

### Apple Wallet (NEW — added 2026-07-31)
- iOS detection: `useEffect(() => setIsIOS(/iPhone|iPad|iPod/i.test(navigator.userAgent)))` in EmployeeProfile
- Button only shows on iOS, after the ID card download buttons
- Server: `GET /api/employee/apple-wallet-pass`
  - Returns 501 JSON if `APPLE_PASS_CERT`, `APPLE_PASS_KEY`, `APPLE_WWDR_CERT` env vars missing
  - When certs configured: uses `passkit-generator` npm package to generate `.pkpass`
  - Pass structure: Generic pass with name, jobTitle, QR barcode (qr-login URL), org fields
  - MIME type: `application/vnd.apple.pkpass`
- **Why 501 approach**: Apple .pkpass requires registered Pass Type ID certificate from Apple Developer account — cannot generate valid passes without real certs. Infrastructure is complete; admin only needs to add 3 env secrets.

## Revision Quota System
- Endpoint: `POST /api/employee/orders/:orderId/log-revision`
- Allowed roles: admin, manager, developer, designer, support, sales, accountant, hr
- Creates a `ModificationRequest` with `status: 'approved'` — counts against client's quota
- Sends push notification to client on success
- UI: in `AdminModRequests.tsx` — "سجّل تعديل للعميل" button opens a dialog with: orderId, title, description

## Subscription Expiry in Dashboard
- `getQuotaForOrder()` in `server/routes.ts` now returns `subscriptionEndsAt`
- Calculation: `orderCreated + PLAN_PERIOD_MONTHS[planPeriod]` (monthly=1, sixmonth=6, annual=12)
- Dashboard mod dialog header shows expiry strip when `bestQuota.subscriptionEndsAt` is present
