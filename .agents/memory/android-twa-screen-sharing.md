---
name: Android TWA screen sharing
description: Scope decision for screen sharing on QIROX's Android distribution.
---

Keep the current Android app as a Trusted Web Activity (TWA). Native Android MediaProjection support would require changing or adding a native Android app and its build/publishing flow; the user chose to retain the TWA.

**Why:** the user chose to keep the existing TWA rather than add a native Capacitor Android app.

**How to apply:** do not migrate the Android app or add native MediaProjection code unless the user asks again. Screen sharing in the TWA is available only when its browser runtime exposes `getDisplayMedia`; show a clear unsupported-device message otherwise.
