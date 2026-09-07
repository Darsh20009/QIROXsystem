# RFC Index — QIROX Platform

All Requests for Change are tracked here. RFCs are numbered sequentially.
Each RFC document lives at `docs/governance/rfc/RFC-XXXX-short-title.md`.

---

## Status Legend

| Status | Meaning |
|---|---|
| `DRAFT` | Being written; not yet ready for review |
| `IN-REVIEW` | Submitted for CTO review |
| `APPROVED` | Approved; awaiting implementation |
| `IMPLEMENTED` | Code complete; passed DoD |
| `REJECTED` | Not accepted; reason documented in RFC |
| `WITHDRAWN` | Author withdrew; superseded or no longer needed |
| `DEFERRED` | Valid but postponed; target migration updated |

---

## Priority Legend

| Priority | Meaning |
|---|---|
| `CRITICAL` | Production risk or security issue; expedite |
| `HIGH` | Significant technical debt or architectural risk |
| `MEDIUM` | Standard improvement; planned migration |
| `LOW` | Nice-to-have; no deadline |

---

## RFC Register

| RFC | Title | Type | Priority | Status | Target Migration | Author | Updated |
|---|---|---|---|---|---|---|---|
| — | *No RFCs yet — register opened at Enterprise Governance migration* | — | — | — | — | — | — |

---

## Next RFC ID

**RFC-0001** — claim by adding a row above and creating the file.

---

## Governance Rules

1. Every proposed change to production architecture, APIs, database schemas,
   domain boundaries, or platform dependencies **requires an RFC**.
2. An RFC must reach `APPROVED` status before implementation begins.
3. Implementation must not deviate from the approved RFC without CTO sign-off.
4. An RFC may be amended post-approval with a dated addendum; major changes
   require re-review.
5. RFCs are never deleted — rejected or withdrawn RFCs remain for audit trail.

---

## Fast-Track Policy

Emergency security patches and critical production fixes may skip RFC review
provided:
- The change is limited to a single file or dependency update.
- A retrospective RFC is created within 5 business days.
- The patch is immediately noted in the Tech Debt Register if it introduces
  any workaround.
