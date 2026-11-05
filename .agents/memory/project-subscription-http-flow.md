---
name: Project completion subscription flow
description: Guarantees the close transition is visible to the client with its project subscription while keeping credentials out of project responses.
---

The project close request must finish project-specific subscription activation before acknowledging the status update, and client-facing project serialization must remove credential-like fields.

Manual subscription start must tolerate legacy projects with a missing or stale order/client link by resolving the order from the project identity when possible and repairing both references before creating the subscription.

Subscription validation failures should return structured missing-field and solution details so the admin popup can explain exactly what blocks the action instead of showing a generic error.

Legacy project subscription start may recover a missing client account from order/spec email or phone, reuse an existing client when possible, and repair order, project, subscription, and invoice references together.

When a subscription was already started from the wrong anchor, correction must be explicit and invoice-neutral: realign its start/expiry and status from the historical project date without creating another revenue record.

**Why:** A client dashboard can request the project immediately after the administrator closes it; responding first creates a race where the subscription is temporarily absent, while broad document serialization can expose deployment credentials.

**How to apply:** Keep the close-transition HTTP flow covered end to end, including the order plan period, subscription countdown, repository fields, and a negative assertion for credential material. Treat old project links as repairable data, not an immediate hard failure. Preserve actionable error fields through the client request helper. Avoid creating duplicates during concurrent recovery. Keep date corrections separate from invoice issuance.