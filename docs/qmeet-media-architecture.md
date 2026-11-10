# QMeet Native Media Architecture

> **Status:** Phase 1 architecture baseline. The native media path is **not
> accepted for production yet**. The current QMeet path remains available
> during migration.
>
> **Target:** one self-hosted QMeet SFU serving one room of up to 50
> participants, followed by real staged validation.

## 1. Current implementation inventory

| Area | Current state | Migration risk |
|---|---|---|
| Meeting CRUD | `server/qmeet.ts` and QMeet Mongo models | Low; preserve APIs |
| WebSocket signaling | `/ws` in `server/index.ts` and `server/ws.ts` | Medium; currently mixes media relay and control messages |
| Room state | Process-local maps in `server/ws.ts` | High; not safe across API instances |
| Media | Browser P2P mesh; LiveKit code is an interim path | High; mesh does not scale to 50 |
| ICE | `/api/ice-servers`, configured STUN/TURN fallback | High; move to Qirox-owned coturn credentials |
| Whiteboard | WebSocket draw/clear messages, client canvas | Medium; must remain independent of media |
| Auth | Existing session/device-token WebSocket authentication | High; native media join must reuse server-side authorization |
| Recording | Local `MediaRecorder`/`getDisplayMedia` only | Deferred until 50-person media is stable |

The current WebSocket control plane already carries room lifecycle, presence,
chat, reactions, polls, captions, host controls, whiteboard, and screen-share
events. The native design keeps those responsibilities in QMeet and removes
audio/video bytes from that channel.

## 2. Target architecture

```text
QMeet Web
   │ HTTPS / WSS
   ▼
QMeet API + Signaling (existing Node service initially)
   │
   ├── MongoDB: meeting metadata and authorization
   ├── Redis: distributed room/control state when scaling the API
   └── authenticated SFU control channel
          │
          ▼
      QMeet SFU (independent Go service)
          │ WebRTC: ICE → DTLS → SRTP
          │
          ├── publisher A → selected tracks → subscribers
          ├── publisher B → selected tracks → subscribers
          └── publisher ... up to server-enforced room limit

Qirox media network:
  coturn (self-hosted STUN/TURN) + public UDP/TCP/TLS endpoints
```

The SFU owns media routing only. It must not own QMeet accounts, meeting
business rules, MongoDB access, host permissions, or billing.

## 3. Components

### QMeet Web

The React client acquires local media, opens an authenticated signaling
connection, negotiates one WebRTC session with the QMeet SFU, renders subscribed
tracks, and continues to use the QMeet data channel/WebSocket for controls and
whiteboard events.

### QMeet API

The existing Node service remains the authority for meeting membership, join
codes, lobby approval, host/moderator permissions, room expiry, participant
limits, and short-lived media join credentials.

### QMeet Signaling

The existing authenticated `/ws` endpoint is the migration starting point. A
future dedicated signaling process may be split from Node, but the wire
contract in `docs/qmeet-signaling.md` must remain stable.

Signaling exchanges SDP/ICE/control metadata only. It never transports media.

### QMeet SFU

`services/qmeet-sfu/` will be an independently deployable Go service using
Pion WebRTC as a low-level protocol library. Pion is not a hosted platform and
does not provide QMeet room logic; QMeet owns the SFU session and routing
design.

### Qirox STUN/TURN

Use self-hosted coturn on Qirox-controlled infrastructure. STUN discovers
public candidates. TURN relays media when direct UDP cannot be established.
TURN credentials are short-lived and issued only for an authorized room join.

### Redis and MongoDB

MongoDB remains the source of meeting metadata. Redis is used for shared
presence/control state when more than one QMeet API or SFU coordinator exists.
Redis is never exposed publicly and is not used as a media forwarding layer.

## 4. Protocol map

| Protocol | Where used | Purpose |
|---|---|---|
| HTTPS | Browser → QMeet API | Authenticated REST and room operations |
| WSS | Browser → QMeet signaling | Authenticated signaling/control |
| WebRTC | Browser ↔ QMeet SFU | Media session and track transport |
| ICE | Browser ↔ SFU/TURN | Candidate discovery and path selection |
| STUN | ICE server | Discover public network address |
| TURN | ICE relay | Reach users behind restrictive NAT/firewalls |
| DTLS | WebRTC session | Negotiate media encryption keys |
| SRTP/SRTCP | Browser ↔ SFU | Encrypted RTP/RTCP media |
| RTP/RTCP | Inside SFU forwarding | Receive, inspect, route, and control tracks |

## 5. Room lifecycle

```text
create meeting
  → authorize host
  → meeting becomes joinable
  → authenticated join request
  → lobby/permission decision
  → issue short-lived SFU join credential
  → signaling hello
  → SDP offer/answer
  → ICE candidate exchange
  → DTLS/SRTP connected
  → publish audio/video/screen tracks
  → SFU forwards authorized subscriptions
  → mute/camera/quality/reconnect events
  → leave or timeout
  → remove tracks and participant state
  → clean empty room
```

Room business state remains in QMeet. SFU state is ephemeral and is rebuilt
from authorized joins after a service restart.

## 6. Participant state machine

```text
unknown
  → join_requested
  → waiting_lobby | authorized | rejected
  → signaling_connected
  → negotiating
  → connected
  → reconnecting
  → connected
  → leaving
  → left
```

`reconnecting` must not create a second participant identity. A reconnect uses
the same authenticated user/session identity and replaces the old media
session after a bounded grace period.

## 7. Security boundaries

1. The client never chooses `roomId`, `workspaceId`, role, host, or publish
   permissions as authoritative values.
2. QMeet resolves membership and permissions from the authenticated session,
   meeting document, join code/lobby state, and server-side role policy.
3. The API issues a short-lived, room-scoped media credential.
4. The browser never receives an SFU control secret or TURN long-lived secret.
5. The SFU accepts only signed, non-expired credentials and enforces room and
   participant limits.
6. Signaling payloads are size-limited, schema-validated, rate-limited, and
   origin-checked.
7. Logs contain room/user identifiers and error classes, never SDP bodies,
   media payloads, cookies, tokens, or secrets.
8. Room isolation is checked at authorization and SFU routing boundaries.

## 8. Failure handling

| Failure | Required behavior |
|---|---|
| Signaling disconnect | reconnect with backoff, restore room state |
| ICE disconnected | try ICE restart before recreating the session |
| ICE failed | retry with TURN candidates; show reconnecting state |
| SFU unavailable | reject new joins clearly; do not destabilize existing UI |
| SFU restart | drain/reconnect participants; no duplicate identities |
| Browser refresh | leave stale session after grace period, then rejoin |
| Network switch | ICE restart and candidate refresh |
| Participant crash | remove only that participant after timeout |
| Host disconnect | room remains active; explicit host-transfer policy |
| Participant 51 | reject safely with a capacity message |

## 9. Migration phases

1. **Architecture and protocol baseline** — this document and the companion
   documents in `docs/`.
2. **Native signaling contract** — validate/authenticate a separate media join
   credential while preserving existing WebSocket controls.
3. **QMeet SFU skeleton** — health, authenticated session, one publisher,
   one subscriber, and room isolation.
4. **Track forwarding** — audio first, then camera, simulcast, subscriptions,
   screen replacement, and reconnect.
5. **TURN and production deployment** — self-hosted coturn, TLS, firewall,
   metrics, and service limits.
6. **Feature-flagged browser integration** — native path can be enabled for
   internal rooms; existing path remains rollbackable.
7. **Staged capacity validation** — 3, 10, 25, and 50 real clients.
8. **Removal** — remove LiveKit-specific code and the P2P large-room fallback
   only after native acceptance evidence exists.

## 10. Current acceptance status

The system is **not yet accepted** for 50 participants. Build success or a
configuration value is not a capacity test. Acceptance requires real-client
results recorded in `docs/qmeet-capacity-testing.md`.