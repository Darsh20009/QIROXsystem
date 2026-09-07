---
name: Apple review demo account
description: Durable release lesson for keeping App Store review access usable
---

The App Store review account must be tested from a fresh session immediately before each resubmission, including the exact username and password entered in App Store Connect.

**Why:** Apple rejected a build after its supplied demo credentials no longer authenticated, even though the account record still existed and had no extra verification methods enabled.

**How to apply:** Treat review-account authentication as a release gate. Verify login, the authenticated user endpoint, and the account's review-visible feature paths; never place credentials or password hashes in source control or project memory.