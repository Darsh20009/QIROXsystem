# Technical Debt Register — QIROX Platform

**Version:** 1.0  
**Owner:** Engineering  
**Last updated:** Migration 009-QF (Quality Foundation)

---

## Format

Each entry uses:

```
### TECH-XXX — Short title
- **Domain/File:** where the debt lives
- **Introduced:** which migration introduced it
- **Type:** workaround | duplication | stub | missing-test | deferred-migration
- **Risk:** low | medium | high
- **Target removal:** Migration N (or "TBD")
- **Description:** what the problem is and why it was deferred
- **Acceptance condition:** what done looks like
```

---

## Open Items

---

### TECH-001 — 14 email templates still delegate to legacy via Infrastructure Adapter

- **Domain/File:** `server/domains/email/infrastructure/legacy-email-adapter.ts`
- **Introduced:** Migration 009
- **Type:** deferred-migration
- **Risk:** medium
- **Target removal:** Migration 011
- **Description:**
  Fourteen transactional email templates with complex custom HTML layouts (QMeet,
  Wallet Pay, Wallet Top-up, Invoice, Receipt, Quotation, Consultation Confirmation,
  Consultation Notification, Shipment Update, Features Table, Data Request,
  Call Rating, Weekly Report) were not migrated into `domain.ts` template builders
  during Migration 009 due to scope constraints. They are currently served through
  the Infrastructure Adapter which statically imports from `server/email.ts`.
  This means changes to those templates must be made in `server/email.ts` — not
  in the domain — until Migration 011.
- **Acceptance condition:**
  All 14 template builders exist in `domain.ts`. The adapter file is empty and
  deleted. `server/email.ts` is no longer imported anywhere in the email domain.

---

### TECH-002 — `baseTemplate` / `emailBanner` duplicated across legacy and domain

- **Domain/File:** `server/email.ts` + `server/domains/email/domain.ts`
- **Introduced:** Migration 009
- **Type:** duplication
- **Risk:** medium
- **Target removal:** Migration 011
- **Description:**
  The HTML shell (`baseTemplate`, `emailBanner`, inline style constants `S`) is
  implemented independently in both `server/email.ts` and `server/domains/email/domain.ts`.
  A visual change to the email template (logo size, brand colour, footer text)
  must be applied in both places to keep parity until Migration 011 completes.
- **Acceptance condition:**
  `server/email.ts` imports `buildBaseTemplate` and `buildBanner` from the domain,
  or `server/email.ts` is deleted entirely. Single source of truth.

---

### TECH-003 — CRM and Mail mappers are pass-throughs with no typed DTOs

- **Domain/File:** `server/domains/crm/mapper.ts`, `server/domains/mail/mapper.ts`
- **Introduced:** Migration 008 (CRM), Migration 009 (Mail — inherited)
- **Type:** deferred-migration
- **Risk:** low
- **Target removal:** Migration 013
- **Description:**
  Both mappers return raw Mongoose documents or lean objects unchanged, relying on
  the Mongoose `toJSON` transform for serialisation. This preserves the existing
  API contract but means no explicit typed DTO layer exists yet. The mapper layer
  is architecturally present but not yet doing meaningful work.
- **Acceptance condition:**
  Mappers translate Mongoose documents into explicit typed DTO objects. No consumer
  receives a raw Mongoose document. `toJSON` transform is no longer relied upon for
  API shape.

---

### TECH-004 — Zod validation schemas are stubs in all domains

- **Domain/File:** `server/domains/*/validation.ts`
- **Introduced:** Migration 008 (CRM), Migration 009 (Email, Mail)
- **Type:** stub
- **Risk:** low
- **Target removal:** Migration 010
- **Description:**
  All `validation.ts` files export `null` stubs for their Zod schemas. Input
  validation is handled manually in `domain.ts` functions (type coercion, required
  checks). No Zod middleware is wired into the request pipeline. Invalid inputs
  reach the service layer and may produce Mongoose errors instead of clean 400s.
- **Acceptance condition:**
  `validation.ts` exports real Zod schemas. A validation middleware factory
  (`IValidationMiddlewareFactory`) applies them to routes before controller
  handlers. All domains covered.

---

### TECH-005 — Admin email routes still registered in `server/routes.ts`

- **Domain/File:** `server/routes.ts` (lines ~1200–1250 approx.)
- **Introduced:** Migration 009
- **Type:** deferred-migration
- **Risk:** low
- **Target removal:** Migration 012
- **Description:**
  The following email-related admin routes remain in the monolithic `server/routes.ts`
  rather than in `server/domains/email/routes.ts`:
    - `POST /api/admin/connection-settings/email` (SMTP config + test send)
    - `POST /api/admin/email/broadcast` (direct broadcast)
  These routes call email service functions inline. They should be migrated to
  the email domain controller after QA verification.
- **Acceptance condition:**
  Both routes are registered in `server/domains/email/routes.ts` via
  `registerEmailDomainRoutes()`. The entries in `server/routes.ts` are removed.
  API surface is identical.

---

### TECH-006 — No unit tests for domain layer functions

- **Domain/File:** All domains (`crm`, `email`, `mail`)
- **Introduced:** Migration 008
- **Type:** missing-test
- **Risk:** medium
- **Target removal:** TBD (dedicated testing migration)
- **Description:**
  The `domain.ts` files contain pure or near-pure functions (template builders,
  config resolution, role predicates, input normalisation) that are ideal unit
  test targets. No test harness exists yet. Regressions in business rules will
  only be caught by integration or manual testing.
- **Acceptance condition:**
  A test runner (Vitest or Jest) is configured. Each `domain.ts` has a
  `domain.test.ts` sibling with coverage of all exported functions. CI fails on
  test failure.

---

### TECH-007 — `server/email.ts` is a 1310-line monolith

- **Domain/File:** `server/email.ts`
- **Introduced:** Pre-Migration 008 (inherited)
- **Type:** deferred-migration
- **Risk:** low (stable; no active changes planned)
- **Target removal:** Migration 011
- **Description:**
  The legacy email module is a single 1310-line file containing SMTP config,
  HTML template builders, inline style constants, and all 30+ transactional
  email functions. It is the production email path until the domain migration
  (Migration 011) is complete and QA-approved. No changes should be made to
  this file except emergency fixes.
- **Acceptance condition:**
  All template builders live in the domain. All callers import from the email
  domain. `server/email.ts` is deleted (or reduced to a re-export shim for
  backward compatibility during a transition window).

---

### TECH-008 — Mail domain route surface not fully documented

- **Domain/File:** `server/domains/mail/README.md`
- **Introduced:** Migration 009-QF
- **Type:** stub
- **Risk:** low
- **Target removal:** Migration 012
- **Description:**
  The Mail domain `README.md` does not yet list the full HTTP route surface
  because the routes have not been formally audited. The domain files exist
  (created in a prior migration) but their public API is undocumented.
- **Acceptance condition:**
  `README.md` lists all routes with method, path, and description. Matches
  the actual `routes.ts` implementation.

---

## Closed Items

*(None yet — register started at Migration 009-QF)*

---

## TECH-ID Sequence

Next available: **TECH-009**

To claim a new ID: add an entry above in numerical order and update the sequence counter.
