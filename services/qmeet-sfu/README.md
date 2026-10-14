# QMeet native SFU media service

This is the independently deployable native QMeet media service. It uses Go,
Pion WebRTC, and a WebSocket signaling endpoint. It does **not** use LiveKit
and does not modify the existing Node QMeet path.

## Implemented

- environment-based configuration;
- `/healthz`, `/readyz`, and `/metrics` endpoints;
- HMAC-SHA256, short-lived, room-scoped media credential validation;
- in-memory room/participant registry;
- server-side participant limit of 50 per room;
- duplicate participant and cross-room isolation protections;
- graceful HTTP shutdown;
- `/ws` with authenticated `media.hello`, SDP offer/answer, trickle ICE, and
  leave messages;
- one Pion `PeerConnection` per authenticated participant session;
- Opus/VP8-compatible inbound RTP track forwarding to authorized same-room
  subscribers;
- track publication/removal events and subscriber renegotiation;
- ICE, peer failure, reconnect, and media track metrics;
- environment-driven STUN/TURN configuration without credential logging.

## Explicitly out of scope for this phase

Simulcast, advanced adaptive bitrate, recording, transcription, livestreaming,
browser `MeetingRoom` integration, load testing, multi-region, and autoscaling
remain later milestones. Browser acceptance has not been claimed by this
service-only change.

## Run

From this directory:

```bash
QMEET_SFU_CONTROL_SECRET="$(openssl rand -hex 32)" go run -tags pion ./cmd/qmeet-sfu
```

The secret is required. Never commit it or log it.

Configuration:

| Variable | Default | Description |
|---|---:|---|
| `QMEET_SFU_ADDR` | `:7880` | HTTP bind address |
| `QMEET_SFU_CONTROL_SECRET` | required | HMAC credential validation secret |
| `QMEET_SFU_SHUTDOWN_TIMEOUT` | `10s` | Graceful shutdown deadline |
| `QMEET_SFU_ALLOWED_ORIGINS` | same host | Comma-separated WebSocket origins |
| `QMEET_STUN_URL` | empty | Optional self-hosted STUN URL |
| `QMEET_TURN_URL` | empty | Optional self-hosted TURN URL |
| `QMEET_TURN_USERNAME` | empty | Short-lived TURN username |
| `QMEET_TURN_CREDENTIAL` | empty | Short-lived TURN credential |

## Test

```bash
go test ./...
go test -race ./...
```

The non-Pion protocol/auth tests pass in this environment. The Pion-tagged
build currently cannot download its transitive `golang.org/x/crypto` module
because the package firewall rejects it with HTTP 403/CVE policy. Do not
bypass that policy; run `go test -tags pion ./...` when an approved module
cache is available.