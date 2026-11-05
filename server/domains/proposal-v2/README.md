# Proposal Builder V2 — Domain Module

**Sprint D — Proposal Builder V2 Architecture.**
Status: architecture built, **not activated**. Gated behind `FEATURE_PROPOSAL_V2` (default `false`).

## Purpose

A versioned, section-based proposal builder that lives alongside — and never
touches — the existing Quotation system (`server/models/finance.ts`
`QuotationModel`, `/api/quotations*`, `AdminQuotations.tsx`,
`ClientQuotations.tsx`, `QuotationPrint.tsx`). It follows the same layered
pattern as `server/domains/crm/` (repository → domain → service → controller
→ routes) established in earlier sprints.

## Why a new system instead of extending Quotations

Per the Zero Downtime Policy, the live Quotation flow (creation, PDF
printing, client portal, emailing) cannot be restructured without risking a
breaking change to a system already in production use. Proposal V2
introduces the versioned/section-based model as an **additive, parallel**
capability — evaluated by users before any decision is made to eventually
replace or merge it with Quotations.

## Data model

`server/models/proposal-v2.ts` — new collection `proposalv2s`:

- `sections[]` — ordered blocks (`text | items | pricing | terms | custom`),
  each optionally holding line items. Totals are always derived from
  `items`-type sections (`domain.computeTotals`), never trusted as
  client-supplied numbers.
- `versions[]` — an append-only snapshot taken on every update, giving full
  edit history without a separate audit collection.
- `viewToken` — opaque public share token (never the Mongo `_id`) for the
  client-facing read view at `GET /api/v2/proposals/public/:token`.
- `sourceQuotationId` — optional lineage pointer back to a legacy Quotation
  a proposal was created from. Read-only relationship; the Quotation
  document itself is never written to from this domain.

## Route surface

All routes are additive under `/api/v2/proposals/*` (see `routes.ts` for the
full list) and are registered unconditionally in `server/index.ts`, but every
handler is wrapped in `requireFlag()`, which returns `404` when
`FEATURE_PROPOSAL_V2` is off — identical to the gating pattern used by
`server/routes/customer-v2.ts` for `FEATURE_CUSTOMER_JOURNEY_V2`. This means
the routes are inert (behave as if they don't exist) until the flag is
explicitly turned on.

## Client

`client/src/features/proposal-v2/ProposalV2Page.tsx`, route
`/employee/proposals-v2` (registered in `App.tsx`, always mounted). The page
itself checks `FEATURE_PROPOSAL_V2` via the shared `useFlag` hook
(`client/src/features/customer-journey/hooks/use-feature-flags.ts`) and
renders an "architecture, not yet enabled" placeholder when the flag is off,
so visiting the URL today has zero visible effect on the running app.

## Activation (future — do not do this yet)

1. Set `FEATURE_PROPOSAL_V2=true` in the environment.
2. Restart the app — the routes and the full builder UI activate immediately,
   no redeploy of code required.
3. Nothing else changes: Quotations keep working exactly as before.
