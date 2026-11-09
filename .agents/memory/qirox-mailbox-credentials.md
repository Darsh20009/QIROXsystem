---
name: QIROX mailbox credentials
description: Shared-password setup for the QIROX mailboxes and safe credential handling.
---

The user initially confirmed a shared password for QIROX mailboxes, then requested a separate password field for each mailbox. Use `CPANEL_SMTP_PASS` (fallback `SMTP_PASS`) only to seed new mailboxes; preserve individually configured passwords on existing accounts across startup and reseeding. Never store or display the password itself in source, logs, or API responses.

All system-generated email, including transactional and marketing messages, should be sent from `noreply@qirox.online`. User-initiated mail sent from an employee's mailbox remains on that mailbox.

**Why:** The user requires individual mailbox credentials to persist and all system-generated messages to use noreply.

**How to apply:** Keep password changes admin-only, update cPanel and MongoDB together, seed shared credentials only for newly created accounts, route system-generated mail through noreply, and avoid sending test email without explicit approval.
