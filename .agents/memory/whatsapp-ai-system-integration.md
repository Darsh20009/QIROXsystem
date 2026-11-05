---
name: WhatsApp AI system integration
description: Durable rules for keeping the WhatsApp assistant aligned with QIROX data and customer actions.
---

The WhatsApp assistant must use the shared QIROX AI Hub path for retrieval, live context, and provider selection. It must not maintain a separate WhatsApp-only knowledge prompt.

**Why:** A separate prompt caused the WhatsApp assistant to miss QIROX knowledge and behave differently from the admin/API assistant.

Deterministic server-side handlers should handle customer-owned account summaries, project/subscription links, booking creation, and booking status updates. The LLM may explain results, but it must not claim an action succeeded before the database write succeeds.

**How to apply:** Keep customer lookup scoped to the matched WhatsApp user, keep booking and other mutations outside the LLM, and enforce Arabic output when the inbound message is Arabic; reject unusable French/foreign-language output rather than sending it.