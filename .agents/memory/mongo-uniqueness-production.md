---
name: Mongo uniqueness in production
description: How this project guarantees MongoDB uniqueness constraints when production disables automatic index creation.
---

Production disables Mongoose autoIndex, so a schema-level unique or partial unique index is not enough by itself. Critical uniqueness constraints must also be created explicitly during database startup, after checking for conflicting existing records. Concurrent write routes should still handle duplicate-key errors by returning the already-created record when possible.

**Why:** Relying only on development-time index creation leaves production vulnerable to duplicate records, while treating a duplicate-key race as a server error turns a successful repeated action into a failed client request.

**How to apply:** For new Mongo-backed idempotency or uniqueness guarantees, declare the index on the schema, ensure the same named index during startup, detect existing conflicts clearly, and make the write endpoint duplicate-key tolerant.