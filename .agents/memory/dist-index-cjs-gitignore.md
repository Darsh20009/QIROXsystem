---
name: dist/index.cjs deployment bundle
description: The bundled server artifact is intentionally tracked because Render deploys the pre-built server bundle.
---

# dist/index.cjs — tracked deployment bundle

## Rule
`dist/index.cjs` is intentionally committed because the current Render deployment serves the pre-built server bundle directly. Keep build-time environment values out of the bundle and use runtime secrets for production configuration.

**Why:** Removing the tracked bundle would break the deployment contract. The previous exclusion note was stale and conflicted with the current `.gitignore` and deployment setup.

**How to apply:** Preserve the tracked bundle for GitHub backups and deployment, but never build it with secret values embedded. Confirm runtime credentials are supplied through Replit/Render environment secrets rather than source or generated artifacts.
