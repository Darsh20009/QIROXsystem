---
name: WhatsApp 2FA approval identities
description: Baileys identity and Arabic reply normalization needed for WhatsApp login approvals
---

WhatsApp approval matching must not assume that an incoming direct message always carries a phone-based JID. Baileys can deliver a `@lid` remote JID with a phone-based alternate JID, and users may reply with Arabic-Indic digits or diacritized Arabic text.

**Why:** A valid approval could remain pending when the message was received but its identity or text did not match the stored challenge.

**How to apply:** Resolve and cache alternate JIDs before challenge lookup, normalize Arabic/Persian digits, remove Arabic marks, and keep approval matching deterministic and limited to explicit approve/deny phrases.