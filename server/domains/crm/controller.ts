// ── CRM Controller ────────────────────────────────────────────────────────────
// Request/Response handling only — no business rules, no DB queries.
//
// Purpose:
//   Translate Express Request into service inputs and service outputs
//   into Express Response, with no business logic in between.
//
// Responsibilities:
//   - Extract typed inputs from req.query / req.body / req.params / req.user.
//   - Call the correct service function.
//   - Map service result to the correct HTTP status code and JSON body.
//   - Catch unhandled errors and respond with 500.
//
// Future migration role:
//   Once request validation is wired (Migration 008+), controllers will read
//   from req.validated instead of casting req.body directly.

import type { Request, Response } from "express";
import type { CrmUser, LeadFilters, ImportRow } from "./types";
import * as service from "./service";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Cast req.user to the minimal CrmUser shape. */
function crmUser(req: Request): CrmUser {
  return req.user as CrmUser;
}

// ── Handlers ──────────────────────────────────────────────────────────────────

/**
 * GET /api/crm/leads
 * List leads with optional filters.
 */
export async function listLeads(req: Request, res: Response): Promise<void> {
  try {
    const { stage, assignedTo, search } = req.query as Record<string, string>;
    const filters: LeadFilters = { stage, assignedTo, search };
    const leads = await service.listLeads(filters);
    res.json(leads);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/crm/stats
 * Pipeline statistics — total count, per-stage breakdown, total value.
 */
export async function getStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await service.getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/crm/leads
 * Create a new lead.
 */
export async function createLead(req: Request, res: Response): Promise<void> {
  try {
    const result = await service.createLead(req.body, crmUser(req));
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.status(201).json(result.lead);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/crm/leads/:id
 * Partial update of an existing lead.
 */
export async function updateLead(req: Request, res: Response): Promise<void> {
  try {
    const result = await service.updateLead(req.params.id, req.body);
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json(result.lead);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/crm/leads/import
 * Bulk import leads from a parsed row array.
 */
export async function importLeads(req: Request, res: Response): Promise<void> {
  try {
    const { rows } = req.body as { rows: ImportRow[] };
    const result = await service.importLeads(rows, crmUser(req));
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/crm/leads/:id
 * Delete a lead (role-restricted inside service).
 */
export async function deleteLead(req: Request, res: Response): Promise<void> {
  try {
    const result = await service.deleteLead(req.params.id, crmUser(req));
    if (!result.ok) {
      res.sendStatus(result.status);
      return;
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/crm/leads/:id/activity
 * Append an activity to a lead's activity log.
 */
export async function addActivity(req: Request, res: Response): Promise<void> {
  try {
    const result = await service.addActivity(req.params.id, req.body, crmUser(req));
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json(result.lead);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
