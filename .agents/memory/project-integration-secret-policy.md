---
name: Project integration secret policy
description: How generated project integration keys are represented in technical specifications.
---

When a project integration key is created or rotated, technical specifications may receive the variable name and a placeholder, but never the raw secret. The raw secret is shown once in the creation dialog for the administrator to copy into the target project's secret store.

**Why:** Persisting the raw key in project specifications would defeat the one-time display guarantee and could expose credentials to anyone with read access to the order or project.

**How to apply:** Add an environment-variable hint using the integration type and environment, replace the existing hint when rotating the key, and keep the actual secret only in the one-time response flow.