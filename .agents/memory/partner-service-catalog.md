---
name: Partner service catalog
description: Durable rules for linking catalog services to partners and displaying their features.
---

# Partner service catalog

Store linked service IDs separately from manually maintained partner features. Derive linked services' current features at read time, expose them separately, and combine them with manual features only in display views. Preserve the legacy related-service text field.

**Why:** Service feature edits should flow through to every linked partner without overwriting hand-maintained feature lists or copying stale snapshots into partner records.

**How to apply:** Validate submitted IDs against the service catalog, keep derived and manual features distinct in API responses, merge them for display, and invalidate partner caches when services change.