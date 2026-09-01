---
name: Face API lazy loading
description: Prevent face-api.js bundling quirks from breaking unrelated employee routes.
---

Keep face-api.js behind a route-level lazy import. Do not eagerly import components that depend on it from shared employee navigation or dashboards.

**Why:** The browser build can emit a FaceMatcher chunk containing Node-style `require` calls. Loading that chunk while opening an unrelated employee dashboard throws before the dashboard can render or issue its API requests.

**How to apply:** Load profile/face-recognition UI only when the profile route is opened, and verify the normal employee dashboard chunk can be imported without evaluating the FaceMatcher asset.