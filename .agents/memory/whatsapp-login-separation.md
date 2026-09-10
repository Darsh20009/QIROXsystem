---
name: WhatsApp login separation
description: Boundary between standalone WhatsApp login and multi-factor authentication
---

WhatsApp approval must be available only as a second factor after password or OAuth login; standalone passwordless WhatsApp approval login is disabled. The separately requested public mobile login uses a numeric OTP (currently delivered through WhatsApp) and must never reuse approval challenges.

**Why:** The product requires WhatsApp verification to strengthen an existing login, not replace the password or OAuth step.

**How to apply:** Keep approval challenges purpose-scoped (`setup` versus `2fa`) and reject legacy approval-login endpoints. A public phone-OTP control may exist for numeric OTP login, but it must use the phone OTP records and never the WhatsApp approval challenge model. Expose WhatsApp approval in `methods` only when the user has enabled it and has a verified number; keep the other 2FA methods available.