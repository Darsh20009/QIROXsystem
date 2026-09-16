---
name: Security probe handling
description: Safe handling of requests probing for secrets and infrastructure
---

Suspicious secret and infrastructure paths should terminate with the same
generic 404 response as any missing resource. Record only a category and a
short-lived, non-reversible fingerprint for operational alerting; never expose
decoy credentials, fake admin pages, or intentionally exploitable routes.

**Why:** A realistic-looking fake weakness can become a real attack surface,
while raw IPs, paths, and user agents create unnecessary privacy and log
exposure.

**How to apply:** Keep the probe list narrow and maintenance-oriented, rate
or bucket repeated alerts, and leave authorization and secret validation on
the real server-side routes.