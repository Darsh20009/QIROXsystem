---
name: Mailbox credential encryption
description: At-rest encryption for mailbox passwords and the stable-key requirement.
---

Mailbox passwords are encrypted before database writes and decrypted only in server memory for IMAP/SMTP operations. Prefer `MAIL_ACCOUNT_ENCRYPTION_KEY`; `SESSION_SECRET` is the compatibility fallback.

**Why:** Mailbox credentials were previously stored in plaintext, and the user requested a safe way to configure multiple accounts.

**How to apply:** Keep the encryption key stable across deployments and do not rotate `SESSION_SECRET` while it is the active fallback unless mailbox passwords are re-encrypted first. Never log or serialize decrypted passwords.
