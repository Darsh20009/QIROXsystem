// ── CRM Routes ────────────────────────────────────────────────────────────────
// Express routing only — no business rules, no DB queries, no response logic.
//
// Purpose:
//   Register all CRM HTTP routes on the Express application.
//   This file is the single entry point for the CRM module.
//
// Responsibilities:
//   - Mount the authentication guard (`requireCRM`) before every handler.
//   - Map HTTP verbs + paths to controller handler functions.
//   - Preserve the exact same endpoint surface as the legacy server/crm.ts.
//
// Route surface (unchanged from legacy):
//   GET    /api/crm/leads              — list leads
//   GET    /api/crm/stats              — pipeline stats
//   POST   /api/crm/leads/import       — bulk import
//   POST   /api/crm/leads              — create lead
//   PATCH  /api/crm/leads/:id          — update lead
//   DELETE /api/crm/leads/:id          — delete lead
//   POST   /api/crm/leads/:id/activity — add activity
//
// Future migration role:
//   Once validation middleware is available (Migration 008+), schema guards
//   are inserted between requireCRM and each controller handler:
//     app.post("/api/crm/leads", requireCRM, validate.body(createLeadSchema), controller.createLead)

import type { Express, Request, Response, NextFunction } from "express";
import { hasCrmAccess } from "./domain";
import type { CrmUser } from "./types";
import * as controller from "./controller";

// ── Auth guard ────────────────────────────────────────────────────────────────

/**
 * Middleware: the requesting user must be authenticated AND hold a CRM role.
 * Business rule lives in domain.hasCrmAccess — this function is transport only.
 */
function requireCRM(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated()) { res.sendStatus(401); return; }
  if (!hasCrmAccess(req.user as CrmUser)) { res.sendStatus(403); return; }
  next();
}

// ── Route registration ────────────────────────────────────────────────────────

/**
 * Register all CRM routes on the Express app.
 * Drop-in replacement for the legacy registerCrmRoutes() in server/crm.ts.
 * Identical method + path surface — no endpoint changes.
 */
export function registerCrmRoutes(app: Express): void {
  // ── Read endpoints ─────────────────────────────────────────────────────────
  app.get("/api/crm/leads",  requireCRM, controller.listLeads);
  app.get("/api/crm/stats",  requireCRM, controller.getStats);

  // ── Import (registered before /:id routes to avoid param capture) ──────────
  app.post("/api/crm/leads/import", requireCRM, controller.importLeads);

  // ── CRUD endpoints ─────────────────────────────────────────────────────────
  app.post  ("/api/crm/leads",              requireCRM, controller.createLead);
  app.patch ("/api/crm/leads/:id",          requireCRM, controller.updateLead);
  app.delete("/api/crm/leads/:id",          requireCRM, controller.deleteLead);
  app.post  ("/api/crm/leads/:id/activity", requireCRM, controller.addActivity);
}
