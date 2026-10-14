# QMeet Native Media Infrastructure

This directory describes the target infrastructure after the LiveKit
migration is complete. It is intentionally separate from the legacy
`infra/livekit/` material so the migration can be rolled back safely.

## Target components

```text
QMeet API + signaling
  ├── MongoDB (meeting/auth data)
  ├── Redis (shared control state when needed)
  └── authenticated control channel

Qirox media VPS
  ├── qmeet-sfu (Go/Pion)
  ├── coturn (self-hosted STUN/TURN)
  ├── Caddy (TLS/WSS)
  └── metrics/health agent
```

No hosted meeting SaaS, LiveKit Cloud, external SFU, or external TURN service
is part of the target architecture.

## Network requirements

The media VPS needs a public IPv4 address and provider firewall access for:

```text
TCP 80, 443        Caddy certificate and WSS
TCP 7880           SFU signaling/health (internal or proxied)
TCP 7881           WebRTC TCP fallback
UDP 3478           TURN/UDP default, if enabled
UDP 443            TURN/UDP fallback where appropriate
UDP 50000-60000    SFU RTP/RTCP media range
```

The exact port map is part of the deployment manifest and must be tested
against the selected VPS provider. An HTTP-only service is not sufficient for
the media node.

## DNS and TLS

Use separate names, for example:

```text
media.qiroxstudio.online   → QMeet SFU
turn.qiroxstudio.online    → coturn (if TURN/TLS is enabled)
```

Use valid certificates for WSS and TURN/TLS. Keep the DNS proxy disabled
during the first UDP validation so candidate routing is observable.

## Service responsibilities

### QMeet API/signaling

- authenticates users and guests;
- authorizes rooms and capabilities;
- issues short-lived media credentials;
- enforces the 50-participant limit;
- carries control/whiteboard events;
- does not process RTP media.

### QMeet SFU

- validates media credentials;
- owns ephemeral room/track routing;
- forwards selected RTP layers;
- exposes health and safe metrics;
- has no MongoDB write access.

### coturn

- self-hosted STUN discovery;
- TURN relay for difficult NAT paths;
- short-lived authenticated allocations;
- bandwidth, allocation, and abuse limits.

## Secrets policy

Do not commit real values. Use the deployment secret store for:

```text
QMEET_MEDIA_CONTROL_SECRET
QMEET_TURN_SHARED_SECRET
QMEET_SFU_INTERNAL_URL
```

The browser receives only short-lived room-scoped credentials. It must never
receive a control secret, TURN shared secret, database URI, or private key.

## Deployment sequence

1. Provision the media VPS with public IPv4 and UDP support.
2. Configure DNS and TLS.
3. Install and lock down coturn.
4. Deploy the QMeet SFU as a non-root service with a pinned version.
5. Connect QMeet signaling to the authenticated SFU control boundary.
6. Enable the native media feature flag for internal rooms only.
7. Run staged capacity and security tests.
8. Promote native media to production only after measured acceptance.
9. Remove the legacy LiveKit/P2P production path.

## Operations

- default-deny firewall;
- SSH restricted to an administration source;
- restart policy and graceful drain;
- health endpoint and process metrics;
- CPU, RAM, egress, packet loss, RTT, ICE/TURN, and room counters;
- no SDP, token, cookie, or media payload logs;
- pinned releases and documented rollback;
- daily configuration backup, never including secrets.

The native path is **not yet production accepted**. See
`docs/qmeet-capacity-testing.md` for the evidence required before claiming
50-participant support.