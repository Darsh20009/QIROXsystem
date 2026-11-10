---
name: Mailbox-to-WhatsApp routing
description: Recipient and privacy rules for new-mail WhatsApp alerts.
---

Route employee mailbox alerts only to users explicitly assigned to that mailbox and using their recorded WhatsApp number. Send sender, subject, and a protected inbox link only; do not include the message body or attachments by default. Shared mailboxes require explicit assignees; never fan out based only on a role or a global phone number.

**Why:** Mail content can be sensitive, and broad or guessed routing can expose it to the wrong employee. The user asked to connect employee mailboxes to their WhatsApp.

**How to apply:** Preserve assignment-based routing in the mail monitor and deliver every WhatsApp alert through the shared serialized send queue. Require an explicit user choice before adding full bodies or attachments.
