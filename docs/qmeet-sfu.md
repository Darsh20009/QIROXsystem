# QMeet SFU Service

## 1. Technology decision

The first native SFU implementation will be a standalone **Go** service using
the low-level open-source **Pion WebRTC** library.

### Why Go/Pion

- mature WebRTC, RTP, RTCP, ICE, DTLS, and SRTP primitives;
- suitable for a focused single-node SFU;
- easier operational deployment than a C++ libwebrtc service;
- lower implementation and maintenance risk than writing packet primitives;
- QMeet still owns room routing, authorization boundaries, limits, and
  signaling. Pion is a protocol library, not a hosted meeting platform.

Rust/webrtc is a viable later alternative for a Rust-native team. C++/libwebrtc
is not the first choice because it increases build and maintenance complexity
without reducing the initial product risk.

## 2. Service boundary

```text
services/qmeet-sfu/
  cmd/qmeet-sfu/        process entrypoint
  internal/auth/        short-lived media credential validation
  internal/room/        room and participant state
  internal/media/       Pion peer connections and RTP routing
  internal/signaling/   authenticated WebSocket negotiation
  internal/metrics/     safe health and metrics
```

The service has no Qirox business database access. It receives an authorized
room/session credential through an authenticated control boundary and keeps
only ephemeral media state.

## 3. Implemented in Phase 2

1. Health, readiness, metrics, and graceful shutdown.
2. Authenticated `/ws` room/session admission.
3. One Pion peer connection per authenticated participant session.
4. SDP offer/answer and trickle ICE.
5. RTP forwarding for inbound audio/video tracks to authorized same-room
   subscribers.
6. Track publication/removal events and subscriber renegotiation.
7. ICE/peer failure and deterministic peer/track cleanup.

Browser integration, simulcast, advanced adaptive bitrate, recording,
transcription, livestreaming, load testing, breakout rooms, and multi-region
work remain outside this phase.

## 4. Room model

```text
Room
  roomID
  workspaceID
  participantLimit = 50
  participants: participantID → Participant
  tracks: trackID → PublishedTrack
  createdAt / lastActivityAt
  draining
```

```text
Participant
  participantID
  sessionID
  roomID
  capabilities
  peerConnection
  publishedTracks
  subscriptions
  lastHeartbeat
```

All keys are server-bound. The SFU must never construct a room from an
untrusted client-provided room name without an authorized control decision.

## 5. Media routing

For each authorized publisher:

1. accept an inbound RTP track;
2. register codec and track metadata;
3. publish a track identity into the room;
4. forward only to authorized subscribers;
5. add a sender to each authorized same-room subscriber;
6. renegotiate subscribers when a track is added or removed;
7. remove the track on publisher leave or timeout.

The SFU does not implement simulcast or active-speaker layer selection yet.
It only forwards the negotiated RTP codec to authorized same-room subscribers.

## 6. Limits and overload behavior

The service enforces:

- 50 participants per room;
- maximum published tracks per participant;
- maximum subscriptions per participant;
- maximum rooms per node;
- bitrate and packet-rate budgets;
- renegotiation and join rate limits;
- idle room cleanup;
- graceful drain before shutdown.

When a room or node is overloaded, reject new joins with a safe capacity
error. Never disconnect existing participants merely to admit a new one.

## 7. Security

- DTLS-SRTP is mandatory for media.
- WSS/TLS is mandatory for signaling.
- Credentials are short-lived, room-scoped, and capability-scoped.
- SFU control credentials are separate from browser media credentials.
- No SDP, token, cookie, or media payload is logged.
- Provider firewall is default-deny except required signaling, TURN, and RTP
  ports.
- Metrics use counters and bounded labels; never use arbitrary user input as
  a label.

## 8. Deployment

The initial production node requires:

- public IPv4 address and stable DNS;
- compute-optimized CPU and sufficient egress;
- UDP media port range;
- TCP signaling/health ports;
- self-hosted coturn;
- TLS reverse proxy;
- optional private Redis for coordination.

See `infra/qmeet-media/README.md`. The older `infra/livekit/` directory is
legacy migration material and is not the target production path.

## 9. Current acceptance

The service implementation is complete for the Phase 2 code scope, but native
media is **not browser-accepted** until a real client integration exercises
audio/video with 2, 3, and 5 participants. A successful build or a running
health endpoint is not evidence of browser media forwarding.