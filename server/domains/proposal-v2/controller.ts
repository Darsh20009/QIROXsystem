// ── Proposal V2 Controller ────────────────────────────────────────────────────
// Request/Response handling only — no business rules, no DB queries.

import type { Request, Response } from "express";
import type { ProposalV2User, ProposalV2Filters } from "./types";
import * as service from "./service";

function proposalV2User(req: Request): ProposalV2User {
  return req.user as ProposalV2User;
}

/** GET /api/v2/proposals */
export async function listProposals(req: Request, res: Response): Promise<void> {
  try {
    const { status, search } = req.query as Record<string, string>;
    const filters: ProposalV2Filters = { status, search };
    res.json(await service.listProposals(filters));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/** GET /api/v2/proposals/stats */
export async function getStats(_req: Request, res: Response): Promise<void> {
  try {
    res.json(await service.getStats());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/** GET /api/v2/proposals/from-quotation/:quotationId */
export async function prefillFromQuotation(req: Request, res: Response): Promise<void> {
  try {
    const result = await service.prefillFromQuotation(req.params.quotationId);
    if (!result.ok) { res.status(result.status).json({ error: result.error }); return; }
    res.json(result.prefill);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/** GET /api/v2/proposals/public/:token — unauthenticated, token-gated */
export async function getByPublicToken(req: Request, res: Response): Promise<void> {
  try {
    const result = await service.getByPublicToken(req.params.token);
    if (!result.ok) { res.status(result.status).json({ error: result.error }); return; }
    res.json(result.proposal);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/** GET /api/v2/proposals/:id */
export async function getProposal(req: Request, res: Response): Promise<void> {
  try {
    const result = await service.getProposal(req.params.id);
    if (!result.ok) { res.status(result.status).json({ error: result.error }); return; }
    res.json(result.proposal);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/** POST /api/v2/proposals */
export async function createProposal(req: Request, res: Response): Promise<void> {
  try {
    const result = await service.createProposal(req.body, proposalV2User(req));
    if (!result.ok) { res.status(result.status).json({ error: result.error }); return; }
    res.status(201).json(result.proposal);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/** PATCH /api/v2/proposals/:id */
export async function updateProposal(req: Request, res: Response): Promise<void> {
  try {
    const result = await service.updateProposal(req.params.id, req.body, proposalV2User(req));
    if (!result.ok) { res.status(result.status).json({ error: result.error }); return; }
    res.json(result.proposal);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/** POST /api/v2/proposals/:id/status */
export async function changeStatus(req: Request, res: Response): Promise<void> {
  try {
    const result = await service.changeStatus(req.params.id, req.body?.status);
    if (!result.ok) { res.status(result.status).json({ error: result.error }); return; }
    res.json(result.proposal);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/** DELETE /api/v2/proposals/:id */
export async function deleteProposal(req: Request, res: Response): Promise<void> {
  try {
    const result = await service.deleteProposal(req.params.id, proposalV2User(req));
    if (!result.ok) { res.sendStatus(result.status); return; }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
