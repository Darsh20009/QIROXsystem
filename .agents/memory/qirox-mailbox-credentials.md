---
name: QIROX mailbox credentials
description: Shared-password setup for the QIROX mailboxes and safe credential handling.
---

The user initially confirmed a shared password for QIROX mailboxes, then requested a separate password field for each mailbox. Use `CPANEL_SMTP_PASS` (fallback `SMTP_PASS`) only to seed new mailboxes; preserve individually configured passwords on existing accounts across startup and reseeding. Never store or display the password itself in source, logs, or API responses.

**Why:** The user now needs to configure mailbox credentials individually, and automatic reseeding must not silently desynchronize cPanel and MongoDB.

**How to apply:** Keep password changes admin-only, update cPanel and MongoDB together, seed shared credentials only for newly created accounts, and avoid sending test email without explicit approval.
