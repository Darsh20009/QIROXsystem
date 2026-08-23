---
name: Data Entry access policy
description: Durable authorization boundary for the Data Entry staff role.
---

The `data_entry` role may work with operational records: permitted project content, non-sensitive client and employee profile fields, and reading, archiving, or replying to contact messages.

It must not receive authority to delete records, change user roles or passwords, access salaries or system settings, view or update payment information, banking documents, deployment configuration, credentials, or environment-like project variables.

**Why:** Data entry work needs broad operational editing but should not be able to change access control, financial outcomes, or production infrastructure.

**How to apply:** Treat any newly added management route, export, dashboard panel, or project field as denied to Data Entry by default. Allow it only after confirming it is operational data and has no financial, credential, deployment, or destructive consequence.