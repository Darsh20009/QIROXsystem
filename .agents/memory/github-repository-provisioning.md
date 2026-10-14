---
name: GitHub repository provisioning
description: Durable idempotency and ownership rules for automatic project repository setup.
---

Create or adopt one deterministic repository per project through the approved-order provisioning lease. Prefer the managed GitHub identity; without it, pin the first provisioning actor so another administrator cannot retry into a different GitHub account. Fence external work and state transitions with the current lease.

Before creation, users may choose an exact custom repository name instead of the deterministic fallback. Existing linked repositories must remain unchanged. Custom-name collisions must never adopt unrelated code; only recover a repository carrying the same project's ownership marker.

**Why:** The user requested a custom name, not an automatically suffixed name or an automatic migration of an existing repository.

**How to apply:** Serialize name settings with provisioning, persist the choice before approval/creation, reuse it for retries, and reject collisions before visibility updates or starter seeding.

Saving only the repository name must not write visibility or advance the visibility version.

**Why:** A real HTTP test found a name-only save silently changed a public project's visibility to private through provisioning defaults.

**How to apply:** Preserve the authoritative visibility under the same lease, initialize new provisioning metadata from the order, and return before any visibility mutation for name-only saves.

Repository visibility is an authoritative, monotonically versioned setting. Provisioning and settings changes serialize through the same lease, and stale workers must not overwrite newer Project or OrderSpecs metadata.

An explicit repository URL already attached to a project or its order specs is canonical: automatic provisioning must preserve it and must never switch to a generated repository. A repository change must be an explicit migration that copies the source before updating project metadata.

System-generated repositories receive a dependency-free QIROX starter workspace with the brand asset, project brief, delivery checklist, and client-facing dashboard; existing repositories are never seeded automatically.

**Why:** A time-only lease can expire while external GitHub work is still running, creating repositories in different accounts or letting an old visibility write reverse a newer administrator choice.

**How to apply:** Any future GitHub setup or retry path must reuse the deterministic name, adopt create conflicts, use the managed/pinned identity, verify lease ownership around external calls, and carry the visibility version into metadata writes. Never overwrite a configured repository URL during retry; seed only system-generated repositories.