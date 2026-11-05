---
name: Lazy page cache recovery
description: Avoid stale PWA assets causing lazy route failures after a deployment.
---

When a production build replaces hashed lazy-loaded assets, advance the service-worker cache version. The app-level error recovery must treat the retry as route-specific and clear QIROX runtime caches before reloading once. Startup gates must serve existing static files before applying the SPA HTML fallback, and asset caches must never accept text/html for JS/CSS URLs.

**Why:** A browser with an old entry bundle can request a deleted lazy chunk. A generic session-wide retry flag then turns a transient stale-asset failure into the global maintenance screen on unrelated routes. Returning index.html while the server is booting also poisons the PWA runtime cache with HTML under an asset URL, causing a blank app after restart.

**How to apply:** For builds that change frontend assets, make the PWA cache version part of the release. Keep a single-retry recovery path for failed routes, but do not reuse a global permanent retry flag across the whole browser session. Put the early static middleware before the startup HTML fallback, and use network-first validation for hashed bundles.