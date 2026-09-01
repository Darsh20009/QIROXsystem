---
name: Employee layout Map shadow
description: A naming collision that can crash the employee shell before its dashboard requests run.
---

Do not import a lucide icon under the name `Map` in the employee layout when the same module constructs native `Map` collections.

**Why:** The imported icon shadows the browser's `Map` constructor. The failure appears as a minified `TypeError: <alias> is not a constructor` while the employee shell is rendering, before dashboard API requests start.

**How to apply:** Prefer an icon alias such as `MapIcon`, or remove the icon import if unused. For minified render failures before API traffic, inspect native constructor names against imported UI symbols.