---
name: Partner logo presentation
description: Safe display-only transparent overrides for dynamic partner logos.
---

Transparent logo conversions are presentation assets, not replacements for partner records or their original uploaded files. Use a local conversion only while the partner's current `logoUrl` still matches the source URL used to create it; preserve the existing uploaded URL and data.

**Why:** An admin may replace a partner's uploaded logo. An unconditional local override would then keep showing an outdated logo and hide the canonical update.

**How to apply:** When preparing a transparent partner logo, store it as a separate local asset, keep its source URL alongside the mapping, and verify the live URL still matches before displaying it. Use a dark display surface for white marks without adding a background to the image.