---
name: WhatsApp login separation
description: Boundary between standalone WhatsApp login and multi-factor authentication
---

WhatsApp must be available only as a second factor after password or OAuth login; standalone passwordless WhatsApp login is disabled.

**Why:** The product requires WhatsApp verification to strengthen an existing login, not replace the password or OAuth step.

**How to apply:** Do not render standalone WhatsApp or phone-OTP login controls, and reject their legacy endpoints. Expose WhatsApp only as a `methods` value when the user has enabled it and has a verified number; keep the other 2FA methods available.