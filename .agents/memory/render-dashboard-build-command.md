---
name: Render dashboard build command
description: The active QIROX Render service kept using its dashboard Build Command after render.yaml was updated in GitHub.
---

For the current QIROX Render service, a GitHub push that changes `render.yaml` did not reliably update the live Build Command. The dashboard's single-line command also flattened newline-separated steps into spaces, causing later npm arguments to be treated as arguments to `mkdir`. Keep the build steps in a checked-in shell script and set Render's Build Command to `bash scripts/render-build.sh`. Because this custom command is the full build phase, install the lockfile dependencies (including dev tools such as Vite) before the runtime-only packages, then build. Replit lockfile URLs can include both a private proxy host and `/npm/` path prefix; Render must normalize both before installing.

**Why:** Render logs showed malformed command parsing (`mkdir: unrecognized option '--no-audit'`), then `vite not found` because the custom command had not installed the app dependencies, and a 404 after only rewriting the proxy host but leaving `/npm/` in the tarball path.

**How to apply:** When changing Render's build command, update Settings → Build & Deploy directly or explicitly synchronize its Blueprint; confirm the live setting is exactly `bash scripts/render-build.sh` before triggering an auto-deploy. Install root dependencies with dev dependencies included, normalize both proxy host and `/npm/` prefix only on Render, add externalized runtime packages to that same `node_modules`, run `npm run build`, and verify the next deployment log. Keep Replit installs behind its package firewall.
