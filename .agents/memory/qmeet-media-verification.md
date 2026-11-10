---
name: QMeet media verification
description: End-to-end evidence required for QMeet calls and the browser test hardware limitation.
---

QMeet verification must check both participants' actual remote playback, not only room counts, connection states, or inbound RTP.

**Why:** A real two-party reproduction had matching rooms, connected peer connections, and live incoming audio/video packets while both remote tiles remained empty. Network-level success hid both an association/timing defect and video that could not be decoded after subscription.

**How to apply:** Use independent browser contexts and distinguishable video sources. Verify successful decoding and that each renders the other source with nonzero dimensions and advancing playback, then check that reconnecting control signaling without disconnecting media restores that same remote playback. Native media identity must remain usable before the control roster arrives; the two channels have independent timing.

Granting camera/microphone permissions in the testing browser does not guarantee it has capture devices.

**Why:** The browser enumerated no devices despite permissions, blocking the call before the actual defect could be exercised.

**How to apply:** If physical devices are absent, generate real canvas video and Web Audio streams at the capture-device API boundary only. Keep WebSocket, HTTP admission, RTCPeerConnection, and RTP behavior real; do not simulate application signaling or count a blank tile as successful media.