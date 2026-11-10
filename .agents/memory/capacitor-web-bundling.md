---
name: Capacitor web bundling
description: Vite behavior required when Capacitor proxy packages are imported by the web client
---

Capacitor JavaScript proxy packages used by the client must be bundled into the Vite web assets. Leaving `@capacitor/core` as a bare external import makes a normal browser request an unresolved package URL and can leave the whole app blank. Native implementations are still supplied by the platform plugins at runtime.

**Why:** A native-only OAuth/status-bar change exposed the issue in the browser build because the static core import executed before the page could render.

**How to apply:** Keep the client Rollup configuration from externalizing `@capacitor/*`; verify the generated entry and lazy native chunks contain relative asset imports, not bare `@capacitor/...` imports.