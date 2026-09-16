---
name: Sandbox environment synchronization
description: Deployment and System Builder environment stores must synchronize additively without overwriting existing workspace secrets.
---

Deployment project variables and System Builder variables are separate encrypted stores. Synchronization should import only non-empty missing keys, preserve values already configured in the workspace, and never expose secret values through public project serialization.

**Why:** A workspace can have local credentials that are newer or intentionally different from deployment settings; replacing them during navigation can break running projects or silently change their behavior.

**How to apply:** When adding a new bridge between Deployment Cloud and System Builder, make it idempotent, additive, owner-authorized, and keep secret values write-only in public responses.