---
name: Partner URL hygiene
description: Rules for safely reusing partner website data across public pages, SEO/AEO, and QIROX AI context.
---

Partner website values are user-managed content and must be validated before they are emitted into links, structured data, public company metadata, llms.txt, or AI live context. Accept only HTTP(S) URLs with a hostname containing no empty dot-separated labels; omit invalid values rather than exposing or inventing a replacement.

**Why:** A malformed stored URL can be copied into several public discovery surfaces and reduce trust in the company data.

**How to apply:** Reuse the same strict validation rule in every new partner-facing surface, including public APIs, structured data, AI context, and clickable UI links.