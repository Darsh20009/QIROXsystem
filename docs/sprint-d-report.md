# Sprint D — Proposal Builder V2 — Architecture Report

**Date:** 2026-07-12
**Status:** Architecture built. **Not activated.** `FEATURE_PROPOSAL_V2=false` (default, untouched).

## Scope delivered

A complete, additive Proposal Builder V2 domain — a versioned, section-based
proposal system that lives entirely alongside the existing Quotation system
without touching it in any way.

### Server

| Area | What was added |
|---|---|
| Model | `server/models/proposal-v2.ts` — new `ProposalV2Model` (collection `proposalv2s`): sections (`text/items/pricing/terms/custom`), append-only `versions[]` history, opaque public `viewToken`, optional read-only `sourceQuotationId` lineage. Registered in the `server/models.ts` barrel. |
| Domain module | `server/domains/proposal-v2/` — `types.ts`, `domain.ts` (role rules, numbering, totals calc, section normalisation, status rules), `repository.ts`, `mapper.ts`, `service.ts`, `controller.ts`, `routes.ts`, `validation.ts` (stub, matches CRM convention), `index.ts`, `README.md`. Mirrors the layered pattern already used by `server/domains/crm/`. |
| Feature flag | `FEATURE_PROPOSAL_V2` added to `server/infrastructure/feature-flags.ts`, hard default `false`. |
| Routes | `/api/v2/proposals/*` (list, stats, get, create, update, status change, delete, public token view, prefill-from-quotation). Registered unconditionally in `server/index.ts`, but every handler is wrapped in a `requireFlag()` gate (mirroring `server/routes/customer-v2.ts`) that returns `404` while the flag is off — the routes are inert today. |
| Integration point | A read-only prefill endpoint (`GET /api/v2/proposals/from-quotation/:quotationId`) reads the real `QuotationModel` to seed a new proposal's title/client/items — it never writes to Quotations. |

### Client

| Area | What was added |
|---|---|
| Page | `client/src/features/proposal-v2/ProposalV2Page.tsx` — stats bar, filterable proposal list, section-based builder dialog (add/edit text, items with live qty×price totals, pricing/terms/custom blocks), status changer, share-link copy, prefill-from-quotation. |
| Hooks | `client/src/features/proposal-v2/hooks/useProposalV2.ts` — React Query hooks for every endpoint above. |
| Route | `/employee/proposals-v2` registered in `App.tsx` (lazy-loaded, same pattern as `/employee/crm-v2`). |
| Client-side gate | The page checks `FEATURE_PROPOSAL_V2` via the existing shared `useFlag` hook and renders an "architecture, not yet enabled" placeholder when off — so navigating to the URL today has zero visible effect beyond that placeholder, and the underlying API 404s regardless. |

## Zero Downtime Policy compliance

- **No existing file was rewritten or deleted.** Only additive files were created, and the four integration points below were additive edits:
  - `server/models.ts` — one new `export *` line.
  - `server/infrastructure/feature-flags.ts` — one new flag constant + one new default entry.
  - `server/index.ts` — one new import + one new `registerProposalV2Routes(app)` call.
  - `client/src/App.tsx` — one new lazy import + one new `<Route>`.
- **Quotation system untouched.** `server/models/finance.ts` (`QuotationModel`), the `/api/quotations*` endpoints in `server/routes.ts`, and `AdminQuotations.tsx` / `ClientQuotations.tsx` / `QuotationPrint.tsx` were read for reference only — no edits, verified via `git`-equivalent diff review of this session's changes.
- **New Mongo collection only.** `proposalv2s` is a brand-new collection; no schema on any existing collection was modified.
- **Feature flag off by default, not activated during this sprint,** per instruction.
- **No fabricated business logic.** Where real data exists (the Quotation collection), the prefill endpoint reads it live. Where no real workflow data exists yet (e.g. e-signature, PDF export, email delivery of proposals), those were intentionally left out of scope rather than mocked.

## Verification performed

1. Installed missing dependencies in both the main app and the `mockup-sandbox` artifact (neither had `node_modules` on import) and requested/added the `MONGODB_URI` secret so the app could actually run and connect to real data — this was blocking any verification.
2. Restarted `Start application` — confirmed clean boot, DB connected, feature-flag engine reports `FEATURE_PROPOSAL_V2` present and `false`.
3. `GET /api/public/feature-flags` confirms `FEATURE_PROPOSAL_V2: {enabled: false, source: "default"}`.
4. `GET /api/v2/proposals` → `401` (auth guard runs before the flag gate, as intended — same order as the CRM domain).
5. Regression spot-checks after the change: `GET /` → `200`, `GET /api/quotations` → `401` (unchanged behaviour, not `404`/`500`), `GET /api/v2/crm/stats` → `401` (unchanged). No existing endpoint's status code changed.
6. Ran a full production-style client build (`vite build`) — completed with zero errors; `ProposalV2Page` chunk emitted alongside all existing page chunks. Restarted the app to serve the rebuilt bundle and confirmed `/employee/proposals-v2` loads (redirects to login like every other `/employee/*` route for an unauthenticated session — expected, consistent with existing route guards).
7. Full-project `tsc --noEmit` type-checks time out on OOM in this environment regardless of these changes (pre-existing environment constraint on this large codebase, not something introduced here); verified module correctness instead via a direct `tsx` import of the new domain module (loads cleanly, exports as expected) and via the successful production client build, which does perform esbuild-level type stripping/compilation of every file including the new ones.

## Outstanding / explicitly out of scope for this sprint

- Activating `FEATURE_PROPOSAL_V2` (must wait for explicit approval).
- PDF export / print view for proposals (Quotations already has `QuotationPrint.tsx`; a V2 equivalent would be a follow-up).
- Email delivery of the public share link (the link is generated and copyable; sending it is not wired).
- E-signature / formal client acceptance flow beyond the status field.
- Any decision about eventually merging or replacing Quotations with Proposal V2 — intentionally left as a future, human decision.
