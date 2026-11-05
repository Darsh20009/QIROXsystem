// ── Proposal V2 API Routes ────────────────────────────────────────────────────
// Sprint D — Proposal Builder V2 Architecture.
// ADDITIVE ONLY. New /api/v2/proposals/* endpoints. No existing endpoint,
// model, or client page is touched. The legacy Quotation system
// (/api/quotations, AdminQuotations.tsx, ClientQuotations.tsx) is untouched.
//
// Gate: FEATURE_PROPOSAL_V2 flag (server/infrastructure/feature-flags.ts),
// default false. Mirrors the requireFlag() 404-gate pattern used by
// server/routes/customer-v2.ts for FEATURE_CUSTOMER_JOURNEY_V2 — when the
// flag is off, every route below responds 404 ("does not exist"), so there
// is zero production impact until explicitly enabled.
//
// Endpoints:
//   GET    /api/v2/proposals                        — list (staff)
//   GET    /api/v2/proposals/stats                   — pipeline stats (staff)
//   GET    /api/v2/proposals/from-quotation/:qId     — prefill from a legacy Quotation (staff, read-only)
//   GET    /api/v2/proposals/public/:token           — public client-facing view (no auth)
//   GET    /api/v2/proposals/:id                     — get one (staff)
//   POST   /api/v2/proposals                         — create (staff)
//   PATCH  /api/v2/proposals/:id                     — update, snapshots a version (staff)
//   POST   /api/v2/proposals/:id/status              — change status (staff)
//   DELETE /api/v2/proposals/:id                     — delete (staff, delete-role only)

import type { Express, Request, Response, NextFunction } from "express";
import { hasProposalV2Access } from "./domain";
import type { ProposalV2User } from "./types";
import * as controller from "./controller";

// ── Feature flag gate ─────────────────────────────────────────────────────────

async function isProposalV2Enabled(): Promise<boolean> {
  try {
    const { container, TOKENS, FeatureFlag } = await import("../../infrastructure");
    const flags = container.tryResolve<{ isEnabled(flag: string): boolean }>(TOKENS.FeatureFlags);
    if (flags?.isEnabled) return flags.isEnabled(FeatureFlag.PROPOSAL_V2);
  } catch {
    // container not yet initialised — fall through to env fallback below.
  }
  const raw = (process.env.FEATURE_PROPOSAL_V2 ?? "").toLowerCase().trim();
  return ["true", "1", "yes", "on"].includes(raw);
}

/** Returns 404 ("does not exist") when the flag is off — zero-downtime gate. */
function requireFlag(handler: (req: Request, res: Response) => Promise<void>) {
  return async (req: Request, res: Response, _next: NextFunction) => {
    if (!(await isProposalV2Enabled())) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    await handler(req, res);
  };
}

// ── Auth guard ────────────────────────────────────────────────────────────────

function requireProposalV2Staff(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated()) { res.sendStatus(401); return; }
  if (!hasProposalV2Access(req.user as ProposalV2User)) { res.sendStatus(403); return; }
  next();
}

// ── Route registration ────────────────────────────────────────────────────────

export function registerProposalV2Routes(app: Express): void {
  // Public, token-based, unauthenticated — still gated behind the flag.
  app.get("/api/v2/proposals/public/:token", requireFlag(controller.getByPublicToken));

  // Staff-only surface below.
  app.get(
    "/api/v2/proposals/from-quotation/:quotationId",
    requireProposalV2Staff,
    requireFlag(controller.prefillFromQuotation),
  );
  app.get("/api/v2/proposals/stats", requireProposalV2Staff, requireFlag(controller.getStats));
  app.get("/api/v2/proposals",       requireProposalV2Staff, requireFlag(controller.listProposals));
  app.get("/api/v2/proposals/:id",   requireProposalV2Staff, requireFlag(controller.getProposal));

  app.post  ("/api/v2/proposals",              requireProposalV2Staff, requireFlag(controller.createProposal));
  app.patch ("/api/v2/proposals/:id",          requireProposalV2Staff, requireFlag(controller.updateProposal));
  app.post  ("/api/v2/proposals/:id/status",   requireProposalV2Staff, requireFlag(controller.changeStatus));
  app.delete("/api/v2/proposals/:id",          requireProposalV2Staff, requireFlag(controller.deleteProposal));
}
