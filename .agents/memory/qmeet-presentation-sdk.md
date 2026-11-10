---
name: QMeet presentation and customer extensions
description: Customer scope, visible annotations, and browser pop-out boundaries.
---
QMeet API customers must be able to customize their own integration and add features without changing QMeet for other customers.

**Why:** The user explicitly requested a customizable, extensible QMeet API product.

**How to apply:** Keep branding and feature settings scoped to an integration key and its meetings. Customer extension code runs in the customer's parent application, not as arbitrary code injected into QMeet; embedded controls require the exact registered origin and parent window and never grant host privileges.

Screen annotations must be visible in the actual outgoing video, and the camera must remain alive independently of screen capture.

**Why:** The user wants Zoom-like explanations and self visibility during screen share. A local drawing overlay alone does not fulfill participant-visible notes, and replacing/stopping camera capture caused the reported disappearance.

**How to apply:** Preserve separate camera capture; compose presentation marks and a camera inset into the shared video where transports support one outgoing video. Verify pixels on the receiving party, not just the local overlay.

Browser pop-out presentation tools annotate the live preview, not arbitrary operating-system windows.

**Why:** Browser APIs cannot provide a transparent drawing surface over unrelated desktop applications.

**How to apply:** Use supported Document Picture-in-Picture for tools outside the meeting tab and state the limitation clearly. Do not promise native OS overlays without a native implementation.