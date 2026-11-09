---
name: GitHub repository provisioning
description: Durable idempotency and ownership rules for automatic project repository setup.
---

Create or adopt one deterministic repository per project through the approved-order provisioning lease. Prefer the managed GitHub identity; without it, pin the first provisioning actor so another administrator cannot retry into a different GitHub account. Fence external work and state transitions with the current lease.

Repository visibility is an authoritative, monotonically versioned setting. Provisioning and settings changes serialize through the same lease, and stale workers must not overwrite newer Project or OrderSpecs metadata.

An explicit repository URL already attached to a project or its order specs is canonical: automatic provisioning must preserve it and must never switch to a generated repository. A repository change must be an explicit migration that copies the source before updating project metadata.

System-generated repositories receive a dependency-free QIROX starter workspace with the brand asset, project brief, delivery checklist, and client-facing dashboard; existing repositories are never seeded automatically.

**Why:** A time-only lease can expire while external GitHub work is still running, creating repositories in different accounts or letting an old visibility write reverse a newer administrator choice.

**How to apply:** Any future GitHub setup or retry path must reuse the deterministic name, adopt create conflicts, use the managed/pinned identity, verify lease ownership around external calls, and carry the visibility version into metadata writes. Never overwrite a configured repository URL during retry; seed only system-generated repositories.