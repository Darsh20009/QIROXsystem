// ── CRM Validation ────────────────────────────────────────────────────────────
// Placeholder — no runtime validation wired yet.
//
// Purpose:
//   Reserve this file for Zod schema definitions and IValidator instances
//   for each CRM endpoint.
//
// Responsibilities (future):
//   - createLeadSchema      — validates POST /api/crm/leads body.
//   - updateLeadSchema      — validates PATCH /api/crm/leads/:id body.
//   - importLeadsSchema     — validates POST /api/crm/leads/import body.
//   - addActivitySchema     — validates POST /api/crm/leads/:id/activity body.
//   - listLeadsQuerySchema  — validates GET /api/crm/leads query params.
//   - leadIdParamsSchema    — validates :id path param (MongoDB ObjectId).
//
// Current state:
//   All schemas are stubs. The domain layer (domain.ts) handles input
//   resolution and validation manually until Migration 008+ wires the
//   Zod engine into the request pipeline.
//
// Future migration role:
//   Migration 008+ imports these schemas and passes them to the
//   IValidationMiddlewareFactory to produce Express middleware for each route.

// ── Stub schemas ──────────────────────────────────────────────────────────────
// These will be replaced with real Zod schemas in Migration 008+.

/** @placeholder Validates the body for POST /api/crm/leads */
export const createLeadSchema = null;

/** @placeholder Validates the body for PATCH /api/crm/leads/:id */
export const updateLeadSchema = null;

/** @placeholder Validates the body for POST /api/crm/leads/import */
export const importLeadsSchema = null;

/** @placeholder Validates the body for POST /api/crm/leads/:id/activity */
export const addActivitySchema = null;

/** @placeholder Validates the query string for GET /api/crm/leads */
export const listLeadsQuerySchema = null;

/** @placeholder Validates the :id param on lead-specific routes */
export const leadIdParamsSchema = null;

// ── Future interface (documented here for migration planning) ─────────────────
//
// Once Migration 008+ is complete, this file will export:
//
//   import { z } from "zod";
//   import { ISchema } from "../../validation/contracts";
//
//   export const createLeadSchema: ISchema<unknown, CreateLeadDto> = {
//     schemaName: "CrmCreateLead",
//     target: "body",
//     strict: true,
//     ...
//   };
