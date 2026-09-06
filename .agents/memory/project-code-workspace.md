---
name: Project code workspace
description: Durable design rules for the IDE workspace attached to an order project
---

The order-project code workspace should reuse the existing SandboxIDE, sandbox filesystem, runner, logs, and preview proxy through a source-project link rather than introducing a second IDE runtime.

**Why:** This keeps the existing path-traversal, process, preview, and log protections in one implementation while allowing AdminOrders to open a workspace for the project's existing GitHub repository.

**How to apply:** Keep workspace provisioning idempotent per source project, use the existing GitHub repository and branch, and pass authenticated GitHub URLs only to one-off Git operations. Restore or use a sanitized remote so access tokens are never left in the workspace's Git config.