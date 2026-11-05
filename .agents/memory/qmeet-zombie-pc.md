---
name: QMeet zombie PC fix
description: How to properly replace an old RTCPeerConnection without its stale handlers firing on the new state.
---

## Rule
Before calling `old.close()`, null out ALL event handlers first:
```js
old.ontrack = null;
old.onicecandidate = null;
old.onconnectionstatechange = null;
old.onsignalingstatechange = null;
old.onicegatheringstatechange = null;
old.close();
```
Then capture a staleness guard that every async handler checks:
```js
const isCurrent = () => pcsRef.current.get(peerId) === pc;
// Inside every handler:
if (!isCurrent()) return;
```

**Why:** When `createPc` replaces a PC for the same `peerId`, the old PC's event handlers remain live because JS closures hold a reference to the old PC. If the old PC fires `ontrack` or `onconnectionstatechange` after being replaced, it writes stale data into React state for the new connection. The null-out + isCurrent() guard prevents this completely.

**How to apply:** Any time `createPc(peerId, ...)` is called and there might already be a PC for that peer (reconnection, offer glare recovery, peer re-join after disconnect).
