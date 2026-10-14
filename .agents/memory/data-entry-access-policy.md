---
name: Data Entry access policy
description: Durable authorization boundary for the Data Entry staff role.
---

The `data_entry` role may work with operational records: permitted project content, employee profile fields, and reading, archiving, or replying to contact messages. Client identity and contact records are administrator/manager-only; staff should submit a correction request instead of editing them directly.

It must not receive authority to delete records, change user roles or passwords, access salaries or system settings, view or update payment information, banking documents, deployment configuration, credentials, or environment-like project variables.

**Why:** Data entry work needs operational access, but client identity/contact changes and deletions can corrupt customer records and must remain under administrative control.

**How to apply:** Treat any newly added management route, export, dashboard panel, or project field as denied to Data Entry by default. Allow it only after confirming it is operational data and has no financial, credential, deployment, or destructive consequence.

Authenticated route tests should register the real Express route table with a test session user and stub only storage/model I/O. Test mode must skip startup seed and maintenance jobs, otherwise route registration attempts MongoDB writes and obscures authorization failures.

**Why:** The authorization contract is enforced in route handlers, but the application bootstrap also starts database work that is unrelated to a request and can leave isolated HTTP tests waiting on MongoDB.

**How to apply:** Keep HTTP authorization tests offline and deterministic while preserving the production MongoDB wiring; add new route cases to the harness when Data Entry-accessible management endpoints change.