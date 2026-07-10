// ── CRM Mapper ────────────────────────────────────────────────────────────────
// DTO ↔ Entity conversion for the CRM module.
//
// Purpose:
//   Provide a single place where raw database output is translated into
//   typed domain objects, and where domain objects are shaped for API responses.
//
// Responsibilities:
//   - Convert Mongoose documents to CrmLead DTOs.
//   - Convert lean query results (plain objects) to CrmLead DTOs.
//   - Convert aggregation results to CrmStats.
//
// Design note (identity mapping):
//   The CrmLeadModel already applies a toJSON transform that adds `id` from
//   `_id` and maps `activities[].id`. Lean results omit this transform.
//   To preserve 100% response identity with the legacy implementation,
//   this mapper is a pass-through — it does NOT re-shape either output.
//   The controller passes results directly to res.json() exactly as the
//   legacy code did, preserving the existing client contract.
//
// Future migration role:
//   When typed response schemas are introduced (Migration 008+), this mapper
//   will translate Mongoose documents into explicit CrmLead DTO objects,
//   removing the implicit reliance on the Mongoose toJSON transform.

import type { CrmStats } from "./types";

/**
 * Pass-through for a single Mongoose document or lean result.
 * Preserves the toJSON / lean serialisation contract of the legacy code.
 */
export function toLeadResponse(doc: unknown): unknown {
  return doc;
}

/**
 * Pass-through for an array of lean lead results.
 * Preserves the `.lean()` plain-object contract of GET /api/crm/leads.
 */
export function toLeadListResponse(docs: unknown[]): unknown[] {
  return docs;
}

/**
 * Map aggregation results into the CrmStats wire format.
 *
 * Business rule (from domain.ts, applied here for response shaping):
 *   stages is a flat Record<stageName, { count, value }>.
 *   totalValue falls back to 0 when no documents exist.
 */
export function toStatsResponse(
  total:      number,
  byStage:    Array<{ _id: string; count: number; value: number }>,
  totalValue: number,
): CrmStats {
  const stages: Record<string, { count: number; value: number }> = {};
  for (const s of byStage) {
    stages[s._id] = { count: s.count, value: s.value };
  }
  return { total, stages, totalValue };
}
