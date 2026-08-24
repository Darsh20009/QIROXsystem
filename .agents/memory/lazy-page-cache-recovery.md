---
name: Lazy page cache recovery
description: Avoid stale PWA assets causing lazy route failures after a deployment.
---

When a production build replaces hashed lazy-loaded assets, advance the service-worker cache version. The app-level error recovery must treat the retry as route-specific and clear QIROX runtime caches before reloading once.

**Why:** A browser with an old entry bundle can request a deleted lazy chunk. A generic session-wide retry flag then turns a transient stale-asset failure into the global maintenance screen on unrelated routes.

**How to apply:** For builds that change frontend assets, make the PWA cache version part of the release. Keep a single-retry recovery path for failed routes, but do not reuse a global permanent retry flag across the whole browser session.