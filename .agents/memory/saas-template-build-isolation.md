---
name: SaaS template build isolation
description: Safe dependency installation and verification for generated SaaS template projects.
---

Run each generated template in an isolated directory with its own `npm ci`; never symlink the workspace `node_modules` into a template.

**Why:** Installing through a `node_modules` symlink removed the workspace dependency tree. A separate template lockfile also remained pinned to a firewall-blocked transitive `tar` version after its direct parent was updated.

**How to apply:** Generate templates under a temporary directory, install dependencies there, and verify the lockfile plus production build. For a blocked transitive dependency, check the newest parent compatible with the template's Node engine, then refresh the transitive lock entry within its declared semver range.