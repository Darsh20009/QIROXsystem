---
name: Startup data migrations
description: Safety rules for database migrations triggered while the app server starts.
---

Any startup migration that rewrites or deletes application records must require a dedicated, explicit opt-in. Development preview startup should be read/write-safe by default, and a general development-mode guard elsewhere does not protect migration code that runs later in the `server.listen` callback. Match only records proven to be legacy migration targets; never sweep null or missing tenant/branch IDs into a guessed destination. Validate the target identifier before the first write.

**Why:** CLUNY's branch reassignment migration ran unconditionally after the server began listening, despite other startup migrations being disabled in development. A branch record without a usable ID could be selected as the target, making an automatic rewrite unsafe.

**How to apply:** when adding or adjusting CLUNY startup migrations, use a migration-specific flag, scope filters to explicit legacy values, validate the destination, and log a clear skip when the flag is absent.
