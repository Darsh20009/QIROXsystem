---
name: Phone login OTP safety
description: Security invariants for phone-based WhatsApp login codes.
---

## Rule

Phone login codes are usable only once, expire quickly, are stored as keyed hashes, and have a strict attempt limit. If WhatsApp delivery fails, do not deliver the code through an admin mailbox or another side channel. After a valid phone code, honor the account's configured second factor before creating a session.

**Why:** A code forwarded through an administrator's inbox weakens account ownership, and phone OTP alone must not bypass a user's configured second factor.

**How to apply:** Keep the login path fail-closed when its delivery provider is unavailable; test the complete OTP-to-2FA flow and verify no session is issued before every configured factor passes.
