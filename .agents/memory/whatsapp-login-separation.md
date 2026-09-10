---
name: WhatsApp login separation
description: Boundary between standalone WhatsApp login and multi-factor authentication
---

Standalone WhatsApp login must remain a separate passwordless login flow and must not be offered as a method in the account's 2FA settings or post-password 2FA challenge.

**Why:** The product distinguishes entering through WhatsApp with approval from adding a second factor to an existing password or OAuth login. Combining them makes the login UI and security model ambiguous.

**How to apply:** Keep the WhatsApp login button and its challenge flow in the login page. For 2FA, expose only authenticator app, email code, recovery phrase, and push approval; do not reintroduce WhatsApp as a `methods` value or 2FA setup option.