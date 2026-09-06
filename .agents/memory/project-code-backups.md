---
name: Project code backups
description: Safety rules for replacing a project's GitHub code from the QIROX admin area.
---

Any ZIP replacement of project code must first create a durable GitHub backup ref from the current branch head, then apply the new code as one commit. The configured repository URL and target branch remain unchanged unless an administrator explicitly performs a repository migration.

**Why:** A prior repository recovery showed that an empty root commit can make a project appear to have lost all code. A backup ref preserves the last known-good state even if the upload or later push fails.

**How to apply:** Keep backup refs visible in the project code panel, reject empty/path-traversal archives and credential or certificate files before Git operations, and never replace code by clearing the default branch first.