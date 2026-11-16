---
name: Qmail product scope
description: User clarification about where Qmail belongs in the QIROX product.
---

Qmail is a page at `/qmail` inside the existing QIROX system, not a standalone application.

**Why:** The user explicitly corrected the product boundary and asked to stop the standalone-app direction.

**How to apply:** Build Qmail as part of QIROX's existing site and routes. Do not create a separate Qmail artifact or migrate the project for that purpose.
