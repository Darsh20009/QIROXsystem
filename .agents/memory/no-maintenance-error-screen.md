---
name: No maintenance error screen
description: Route and lazy-load failures must recover without showing the branded maintenance page.
---

The global client error boundary must never expose a maintenance or outage page to users. Retry stale assets once, then recover to the public landing route and keep only a neutral loading shell while navigation completes.

**Why:** A transient lazy-chunk or route failure made the whole product look intentionally offline even though the application and backend were running.

**How to apply:** Preserve route-specific cache recovery and a safe landing-page redirect. Do not reintroduce a full-screen maintenance fallback as the final error state.