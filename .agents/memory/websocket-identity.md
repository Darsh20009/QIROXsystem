---
name: WebSocket identity
description: The identity boundary for authenticated realtime connections
---

WebSocket identity must be established during the server-side upgrade from the
same session or hashed device-token path used by HTTP authentication. Client
messages may request compatibility handshakes, but their userId is never an
authority.

**Why:** A browser can change any JSON message after the socket opens. Trusting
that message allowed presence, notifications, and room actions to be
associated with an arbitrary account.

**How to apply:** When adding realtime features, derive the actor once at
upgrade time, use it for every action, reject upgrades without the expected
protocol/authentication, and enforce a bounded message payload.