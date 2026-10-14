---
name: SaaS tenant rebranding
description: Rules for white-labeling generated restaurant systems from the shared template.
---

Apply customer branding through the SaaS builder's generated-project customization. Keep each customer's uploaded logo, hero, and splash images in the generated project; do not bake customer assets into the shared template.

Rebrand visible text, page metadata, PWA labels, email content, and logos from BuilderConfig. Do not rewrite external QIROX service endpoints or processor URLs as part of generic branding replacement. App links should come from the request host, APP_URL/SITE_URL, or the configured business website. Apple Pay merchant IDs and verified domains must be customer-configured, never inherited from the source template.

**Why:** broad domain replacement can remove visible source branding but redirect platform and payment traffic to the customer's website, breaking unrelated integrations.

**How to apply:** when adding a tenant brand field or asset, wire it through generation, development startup, and production build; add a generated-project regression test for the customer-facing output and verify platform URLs remain unchanged.