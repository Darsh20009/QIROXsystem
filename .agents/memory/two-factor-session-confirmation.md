---
name: Auth device-token fallback
description: Keeps password, two-factor, and employee QR login working when embedded browsers do not persist Passport cookies.
---

After password, 2FA, or employee QR authentication succeeds, issue the existing trusted device token as a fallback to the Passport cookie. Browser and native API requests should attach this token automatically, while normal cookie sessions remain enabled.

**Why:** Successful login and 2FA responses were repeatedly followed by `401` responses from `/api/user`, even after retries and despite the Passport session being present in MongoDB. The same cookie dependency broke employee QR login.

**How to apply:** Every successful login method must persist the returned device token before requesting authenticated data or redirecting. Keep raw tokens client-side only; persist only token hashes server-side, and clear the token on logout.