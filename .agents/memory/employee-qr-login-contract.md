---
name: Employee QR login contract
description: Canonical QR format, migration compatibility, and security behavior for employee profile cards and Apple Wallet passes.
---

# Employee QR login contract

## Rule
Employee login QR values are canonical QIROX-origin URLs targeting the protected QR-login endpoint. Profile cards and Apple Wallet passes must obtain the URL from the same server-side token service. Public employee profile URLs are presentation links, never authentication values.

**Why:** Earlier Wallet passes could silently substitute a public-profile URL when no login token existed, creating an inconsistent and unsafe scanning experience.

**How to apply:** Ensure a random QR-login token exists before rendering a profile card or pass, enforce expiry and rotation server-side, and only accept trusted canonical QR values in the scanner. Preserve existing token values during migration so issued employee cards remain usable; record only a token fingerprint in audits.