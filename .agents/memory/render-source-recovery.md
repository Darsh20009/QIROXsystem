---
name: Render source recovery
description: Guidance for selectively restoring features from a user-designated Render deployment commit.
---

Use the exact deployment commit the user identifies as the feature reference. Do not assume the newest GitHub branch matches the deployed app; sanitized backup branches can omit runtime code and generated assets.

**Why:** The deployment reference and current QIROX checkout can have unrelated histories and different feature sets. A broad merge risks replacing QIROX branding, local safety behavior, or production data paths.

**How to apply:** Compare source paths against the designated commit, port compatible features additively behind feature flags, and preserve the current app's safety fixes. Never replace the active tree wholesale.

Treat every GitHub snapshot as untrusted until tracked configuration, key/certificate files, and source literals have been checked for credentials. If credentials are found in core files, do not check out the snapshot; wait for a cleaned source revision.

**Why:** A recent GitHub snapshot contained committed credentials in configuration and application source, so excluding only certificate files was not enough to make a full restore safe.

**How to apply:** Keep the active Replit tree unchanged until the source is cleaned and credentials are rotated; then fetch and verify the cleaned revision before restoring.

When restoring an older feature UI, map its requests to the current server contract and preserve server-side authorization, consent, and idempotency checks. Do not copy old endpoints blindly.

**Why:** The older manual-marketing UI expected lookup and send behavior that the current secured API does not provide in the same shape.

**How to apply:** Port presentation and shared business rules selectively, adapt payloads to current handlers, and clearly identify any old lookup behavior that cannot be preserved safely.

All restored changes belong in the current Replit workspace and preview. Do not publish them to the live QIROX site unless the user explicitly asks.

**Why:** The user specified that these changes should appear in Replit, not on the published site.

**How to apply:** Build and restart the Replit preview for verification, but leave production deployment unchanged.
