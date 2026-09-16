---
name: Phone verification and native push
description: Non-obvious requirements for WhatsApp phone verification and Capacitor iOS notifications.
---

WhatsApp phone verification must send the OTP directly through the connected WhatsApp session, fail clearly when that session is offline, and save both the verified phone and WhatsApp number after confirmation.

Capacitor push registration must attach the registration listeners before calling `register()`. The iOS project must include the native Push Notifications pod and an app entitlements file with the APNs environment.

**Why:** The previous flow generated an OTP but only sent an internal email link, while iOS could register without persisting its token because the registration event listener was attached too late.

**How to apply:** Keep the phone verification and 2FA setup paths linked with a safe internal `returnTo`; when changing native push, update Capacitor sync artifacts and verify bundle ID, Podfile, token persistence, and APNs signing configuration together.