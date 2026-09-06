---
name: Workspace secrets and project branding
description: Rules for detecting project environment requirements and keeping project logos separate from QIROX branding
---

The Workspace may inspect source files for environment variable names, but it must never infer, log, or return secret values. Only an explicit allowlist of app-owned secrets may be generated locally; provider credentials remain user-supplied.

**Why:** Technical project files can reveal required variable names, but extracting provider credentials would create a security and ownership boundary violation.

**How to apply:** Keep scans metadata-only, keep generated secrets encrypted in the sandbox env store, and label external keys as requiring provider setup.

Project logos are per-project deployment identity: they may appear on the project's external card and published page without replacing the global QIROX logo.

**Why:** Customer projects need independent branding while QIROX's product identity must remain consistent across the platform.

**How to apply:** Propagate a validated project logo URL to the workspace and deployment project, accepting only HTTPS/HTTP or local asset paths.