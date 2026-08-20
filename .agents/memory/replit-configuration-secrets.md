---
name: Replit configuration secrets
description: How to keep deployment credentials out of tracked Replit configuration.
---

# Replit configuration secrets

## Rule
Never store credentials, private keys, certificates, tokens, passwords, or connection URIs in `.replit`. Store them in Replit Secrets and keep `.replit` limited to public runtime configuration.

**Why:** `.replit` is tracked with the project and can expose credentials to repository collaborators, automated security scans, and source history.

**How to apply:** Before moving or removing a credential, confirm that the matching Secret exists without reading its value. Use the schema-validated `.replit` replacement flow rather than editing the configuration file directly.