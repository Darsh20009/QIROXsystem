# QMeet Native WebRTC Protocol

This document defines the media protocol boundary between the QMeet browser,
QMeet signaling, and the native QMeet SFU. Control events remain compatible
with the current QMeet WebSocket where possible.

## 1. Connection layers

```text
Browser ── HTTPS ──> QMeet API
Browser ── WSS ────> QMeet control signaling
Browser ── WSS ────> QMeet SFU `/ws`
Browser ══ WebRTC ══> QMeet SFU
```

The signaling socket is not a media tunnel. Audio/video/screen packets use
WebRTC's encrypted DTLS-SRTP session.

## 2. Authenticated media join

The browser first calls the QMeet API using its normal session/device-token
authentication. The API verifies:

- meeting exists and is not expired/cancelled;
- caller is a permitted member or an approved guest;
- lobby and lock rules;
- participant count below `MAX_PARTICIPANTS`;
- caller's publish/subscribe/screen permissions.

The response contains a short-lived, room-scoped `mediaJoin` object. It does
not contain an API secret:

```json
{
  "roomId": "qmeet-room-id",
  "participantId": "server-resolved-user-id",
  "expiresAt": "2026-09-20T22:00:00.000Z",
  "signalingUrl": "wss://app.example/ws",
  "sfuUrl": "https://media.example",
  "capabilities": {
    "canPublish": true,
    "canSubscribe": true,
    "canScreenShare": false
  },
  "credential": "<short-lived-signed-media-credential>"
}
```

The exact credential format is intentionally private to QMeet and may be a
signed compact token or an authenticated API-to-SFU exchange. The browser
cannot mint or extend it.

## 3. Signaling envelope

Every message is bounded and schema-validated:

```json
{
  "v": 1,
  "type": "media.offer",
  "requestId": "client-generated-id",
  "roomId": "server-bound-room-id",
  "sessionId": "current-media-session",
  "payload": {}
}
```

The server derives `userId`, workspace, role, and authoritative room from the
authenticated connection. Client-supplied identity fields are informational
only and are never authorization inputs.

## 4. Media negotiation messages

Initial native messages:

| Message | Direction | Purpose |
|---|---|---|
| `media.hello` | browser → SFU | Bind socket to authorized media credential |
| `media.ready` | SFU → browser | Confirm server-generated connection identity |
| `media.offer` | browser ↔ SFU | Exchange SDP offers for initial/renegotiated tracks |
| `media.answer` | SFU → browser | Return SFU SDP answer |
| `media.ice` | both directions | Exchange trickle ICE candidates |
| `media.track-published` | SFU → signaling/browser | Announce an authorized track |
| `media.track-removed` | SFU → signaling/browser | Remove a track |
| `media.subscribe` | browser → signaling | Request allowed track qualities |
| `media.unsubscribe` | browser → signaling | Stop a subscription |
| `media.restart` | browser → signaling | Request an ICE restart |
| `media.error` | SFU → browser | Safe, user-facing media failure |

The Phase 2 SFU endpoint also accepts `media.leave`. Payloads are capped at
1 MiB and ICE candidate strings at 8 KiB. Origin checks allow the configured
origin list or the request's own host.

Existing `webrtc_*` control messages remain separate from these media
messages during migration.

## 5. WebRTC session model

The first native client uses one Unified Plan `RTCPeerConnection` per
participant-to-SFU session, not one connection per remote participant.

The browser creates transceivers for:

- microphone audio;
- camera video;
- optional screen video;
- optional screen-share audio where supported.

The SFU creates one inbound publisher representation per track using
`TrackLocalStaticRTP`, then forwards RTP to authorized same-room subscribers.
The browser never receives a full mesh. Phase 2 does not implement simulcast
layer selection.

## 6. ICE and encryption

1. The API returns Qirox-owned STUN/TURN server entries with short-lived
   credentials.
2. The browser gathers host, server-reflexive, and relay candidates.
3. ICE selects the best valid path.
4. DTLS negotiates SRTP keys.
5. RTP/RTCP packets remain encrypted end-to-end between browser and SFU.

The SFU may inspect RTP headers needed for routing and quality control, but it
must not log or persist media payloads.

## 7. Track and quality rules

- Audio is prioritized over video when bandwidth is constrained.
- Camera publishes simulcast layers where browser support is available.
- The active speaker receives the high layer.
- Grid thumbnails request low/medium layers.
- Screen share requests a dedicated high-detail layer when permitted.
- A participant cannot request a track from another room or a track they are
  not authorized to subscribe to.

## 8. Reconnect contract

The browser keeps a stable `participantId` but creates a new `sessionId` after
an authenticated reconnect. The SFU removes the old session only after the
grace timeout or an explicit leave. Duplicate sessions for one participant
are rejected or deterministically replaced.

Reconnect sequence:

```text
detect disconnected/failed
  → show reconnecting state
  → refresh media credential if needed
  → ICE restart
  → if failed, create new session
  → resync track list and subscriptions
  → hide reconnecting state
```

## 9. Data and whiteboard

Whiteboard, chat, polls, reactions, captions, lobby, and host controls remain
on the authenticated QMeet signaling/control path. They do not depend on the
SFU's media tracks and must recover by replaying room state after reconnect.