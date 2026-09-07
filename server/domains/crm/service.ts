// ── CRM Service ───────────────────────────────────────────────────────────────
// Orchestration only — no business rules, no HTTP concerns, no DB queries.
//
// Purpose:
//   Coordinate calls between the domain layer (business rules) and the
//   repository layer (database queries) to fulfil each use case.
//
// Responsibilities:
//   - Call domain functions for input resolution and validation.
//   - Call repository functions for data access.
//   - Call mapper functions for response shaping.
//   - Return typed results or typed error objects to the controller.
//
// Future migration role:
//   Will receive domain and repository instances via constructor injection
//   once the DI container is in place (Migration 008+).

import * as domain     from "./domain";
import * as repository from "./repository";
import * as mapper     from "./mapper";
import type {
  LeadFilters,
  CrmUser,
  CrmStats,
  ImportResult,
  ImportRow,
} from "./types";

// ── Use cases ─────────────────────────────────────────────────────────────────

/**
 * Retrieve leads matching the provided filters.
 * Use case: GET /api/crm/leads
 */
export async function listLeads(filters: LeadFilters): Promise<unknown[]> {
  const docs = await repository.findLeads(filters);
  return mapper.toLeadListResponse(docs);
}

/**
 * Aggregate CRM pipeline statistics.
 * Use case: GET /api/crm/stats
 */
export async function getStats(): Promise<CrmStats> {
  const [total, byStage, totalValue] = await Promise.all([
    repository.countLeads(),
    repository.aggregateByStage(),
    repository.aggregateTotalValue(),
  ]);
  return mapper.toStatsResponse(total, byStage, totalValue);
}

/**
 * Create a new lead, applying all default-value business rules.
 * Use case: POST /api/crm/leads
 *
 * Returns: { ok: true, lead } | { ok: false, status: 400, error: string }
 */
export async function createLead(
  body: Record<string, unknown>,
  user: CrmUser,
): Promise<{ ok: true; lead: unknown } | { ok: false; status: 400; error: string }> {
  const name = body.name as string | undefined;
  if (!name) return { ok: false, status: 400, error: "الاسم مطلوب" };

  const input = domain.resolveCreateLeadInput(body, user);
  const lead  = await repository.createLead(input);
  return { ok: true, lead: mapper.toLeadResponse(lead) };
}

/**
 * Apply a partial update to an existing lead.
 * Use case: PATCH /api/crm/leads/:id
 *
 * Returns: { ok: true, lead } | { ok: false, status: 404, error: string }
 */
export async function updateLead(
  id:   string,
  body: Record<string, unknown>,
): Promise<{ ok: true; lead: unknown } | { ok: false; status: 404; error: string }> {
  const doc = await repository.updateLead(id, body);
  if (!doc) return { ok: false, status: 404, error: "العميل غير موجود" };
  return { ok: true, lead: mapper.toLeadResponse(doc) };
}

/**
 * Delete a lead, enforcing the delete-role business rule.
 * Use case: DELETE /api/crm/leads/:id
 *
 * Returns: { ok: true } | { ok: false, status: 403 }
 */
export async function deleteLead(
  id:   string,
  user: CrmUser,
): Promise<{ ok: true } | { ok: false; status: 403 }> {
  if (!domain.canDeleteLead(user)) return { ok: false, status: 403 };
  await repository.deleteLead(id);
  return { ok: true };
}

/**
 * Bulk-import leads from a parsed CSV/spreadsheet row array.
 * Use case: POST /api/crm/leads/import
 *
 * Business rules applied:
 *   - Rows with no name are skipped.
 *   - Rows whose phone already exists are skipped.
 *   - All valid rows are created with stage="new", currency="SAR".
 *
 * Returns: { ok: false, status: 400, error } | ImportResult
 */
export async function importLeads(
  rows: ImportRow[],
  user: CrmUser,
): Promise<
  | { ok: false; status: 400; error: string }
  | ImportResult
> {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, status: 400, error: "لا توجد بيانات" };
  }

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const input = domain.parseImportRow(row, user);

    // Business rule: skip rows with no name
    if (!input) { skipped++; continue; }

    // Business rule: skip phone duplicates
    if (input.phone) {
      const exists = await repository.findLeadByPhone(input.phone);
      if (exists) { skipped++; continue; }
    }

    try {
      await repository.createLead(input);
      created++;
    } catch (e: any) {
      errors.push(`${input.name}: ${e.message}`);
    }
  }

  return { ok: true, created, skipped, errors };
}

/**
 * Append an activity to a lead's activity log.
 * Use case: POST /api/crm/leads/:id/activity
 *
 * Returns: { ok: true, lead } | { ok: false, status: 400 | 404, error: string }
 */
export async function addActivity(
  id:   string,
  body: Record<string, unknown>,
  user: CrmUser,
): Promise<
  | { ok: true; lead: unknown }
  | { ok: false; status: 400 | 404; error: string }
> {
  const input = domain.resolveAddActivityInput(body, user);
  if (!input) return { ok: false, status: 400, error: "المحتوى مطلوب" };

  const doc = await repository.addActivityToLead(id, input);
  if (!doc) return { ok: false, status: 404, error: "العميل غير موجود" };

  return { ok: true, lead: mapper.toLeadResponse(doc) };
}
