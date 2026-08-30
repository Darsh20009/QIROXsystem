---
name: Post-merge setup
description: Rules for the automatic setup that runs after task merges.
---

The post-merge setup must use a deterministic, non-interactive dependency install and rebuild the app. Do not run the legacy Drizzle PostgreSQL push automatically because MongoDB is the project's primary database.

**Why:** The previous generic `npm install` path failed in the merge environment, and the automatic database push targeted a database system that is not the project's primary store.

**How to apply:** Keep the script idempotent, use the lockfile with `npm ci`, skip install scripts when native packages are not needed for the build, and keep its timeout large enough for dependency installation plus the production build.