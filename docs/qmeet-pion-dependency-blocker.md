# QMeet Pion Dependency Blocker

## Status

**PION DEPENDENCY RESOLVED**

The native SFU dependency blocker was resolved without disabling the Replit
Package Firewall, hiding a vulnerability, using an unverified archive, or
replacing Pion.

## Initial failure

The latest Pion release available from the Go module proxy is:

```text
github.com/pion/webrtc/v4 v4.2.20
```

Its dependency graph requested:

```text
golang.org/x/crypto v0.48.0
```

The Replit Package Firewall rejected that module with HTTP 403 and the reason
`Critical CVE`. The original failure occurred before the Pion-tagged package
could compile.

Replit's official documentation describes Package Firewall as an automated
Socket-powered security control that blocks malicious, compromised, or known
vulnerable packages at install time. It supports Go modules and is enabled by
default:

- https://docs.replit.com/features/security/package-firewall
- https://docs.replit.com/features/security/project-security-center

## Vulnerability investigation

The Go vulnerability metadata for `golang.org/x/crypto v0.48.0` identifies
multiple advisories. The critical advisories affecting that version included:

| Advisory | Issue | Fixed |
|---|---|---|
| CVE-2026-42508 / GO-2026-5021 | SSH `@revoked` status was not enforced | v0.52.0 |
| CVE-2026-39831 / GO-2026-5019 | FIDO/U2F physical-presence check bypass | v0.52.0 |
| CVE-2026-39832 / GO-2026-5006 | Agent constraints dropped while forwarding keys | v0.52.0 |
| CVE-2026-39833 / GO-2026-5005 | Invoking key constraints not enforced | v0.52.0 |
| CVE-2026-39834 / GO-2026-5020 | Infinite loop on large SSH channel writes | v0.52.0 |
| CVE-2026-39830 / GO-2026-5017 | Server deadlock on unexpected responses | v0.52.0 |
| CVE-2026-46595 / GO-2026-5023 | `VerifiedPublicKeyCallback` permissions bypass | v0.52.0 |

The source metadata was queried from the Go vulnerability database through the
OSV API:

- https://api.osv.dev/v1/query
- https://pkg.go.dev/vuln/GO-2026-5021
- https://pkg.go.dev/vuln/GO-2026-5019
- https://pkg.go.dev/vuln/GO-2026-5006
- https://pkg.go.dev/vuln/GO-2026-5005
- https://pkg.go.dev/vuln/GO-2026-5020
- https://pkg.go.dev/vuln/GO-2026-5017
- https://pkg.go.dev/vuln/GO-2026-5023

## Version decision

The environment runs Go 1.25.5. The available module metadata showed:

```text
golang.org/x/crypto v0.52.0 → go 1.25.0
golang.org/x/crypto v0.55.0 → go 1.25.0
golang.org/x/crypto v0.56.0 → go 1.26.0
golang.org/x/crypto v0.57.0 → go 1.26.0
```

`v0.57.0` was therefore not a compatible choice for this environment without
installing a new toolchain. `v0.55.0` was the highest available version that
both:

1. runs on the existing Go 1.25 toolchain;
2. was accepted by the Package Firewall; and
3. fixes the critical advisories present in `v0.48.0`.

The native SFU imports from `x/crypto` resolve to:

```text
golang.org/x/crypto/chacha20
golang.org/x/crypto/chacha20poly1305
golang.org/x/crypto/cryptobyte
golang.org/x/crypto/cryptobyte/asn1
golang.org/x/crypto/internal/alias
golang.org/x/crypto/internal/poly1305
```

It does not import `golang.org/x/crypto/ssh`, `ssh/agent`, `ssh/knownhosts`,
or `openpgp`. The remaining `v0.55.0` advisories are in those unused paths:
the SSH channel DoS fixes are listed for `v0.56.0`, and the OpenPGP notice
concerns the unmaintained OpenPGP package.

## Applied dependency graph

`services/qmeet-sfu/go.mod` now uses:

```text
go 1.25.0
github.com/pion/webrtc/v4 v4.2.20
golang.org/x/crypto v0.55.0
```

`go mod tidy` completed successfully and upgraded the associated `x/net` and
`x/sys` modules to compatible versions.

Pion `v4.2.20` also moved its interceptor registry type to
`github.com/pion/interceptor.Registry`. The two compile sites were updated to
that public API; no media behavior or signaling feature was changed.

## Verification

Passed:

```text
go mod tidy
go test -tags pion ./...
go test -race -tags pion ./...
```

Native SFU runtime smoke test:

```json
/healthz
{"media_engine":"pion","status":"ok"}

/readyz
{"media_engine":"pion","status":"ready"}
```

Metrics reported:

```text
qmeet_sfu_media_engine_info{engine="pion"} 1
qmeet_sfu_active_rooms 0
qmeet_sfu_active_participants 0
qmeet_sfu_active_peer_connections 0
qmeet_sfu_published_tracks 0
qmeet_sfu_subscribed_tracks 0
```

The metrics are a clean idle runtime smoke test. They do not claim browser
audio/video forwarding acceptance.

## Scope boundary

This Phase 2C change did not modify:

- `MeetingRoom.tsx`;
- native browser integration;
- LiveKit behavior;
- recording;
- simulcast;
- capacity testing;
- 50-participant testing.

The next phase can now begin native browser integration and real 2-participant
media acceptance.