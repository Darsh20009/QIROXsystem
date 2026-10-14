---
name: Draft promotion side effects
description: Safety constraints when linking a draft to an approved client order.
---

When the approved order already has a client project, promotion should only link the draft, order, and existing project. Do not rerun the normal order provisioner for an existing project; it can create a repository or change repository visibility.

**Why:** Draft promotion is a relationship change, not a request to repeat order provisioning. Reprovisioning can cause unrelated GitHub changes and must not create duplicate financial records.

**How to apply:** Check for a project by `orderId` before provisioning. Use the normal provisioner only when an approved order has no project; leave order revenue, margins, and expenses untouched.