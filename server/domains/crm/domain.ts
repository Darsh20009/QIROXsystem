// ── CRM Domain Rules ──────────────────────────────────────────────────────────
// ALL business rules for the CRM module live here and nowhere else.
//
// Purpose:
//   Centralise every decision that is not I/O or orchestration.
//   Functions here are pure or nearly pure — they do not call the database
//   and do not read from the HTTP request object.
//
// Responsibilities:
//   - Role authorisation rules (who may access / delete CRM data).
//   - Lead creation defaults (assignedTo, currency, tags, value coercion).
//   - Import row parsing (English + Arabic column aliases, duplicate strategy).
//   - Activity validation (content required, type defaulting).
//
// Future migration role:
//   These functions become the source of truth for unit tests.
//   The service layer calls them; the controller never calls them directly.

import type { CrmUser, CreateLeadInput, AddActivityInput, ImportRow } from "./types";
import type { CrmActivityType } from "./types";

// ── Role constants ────────────────────────────────────────────────────────────

/**
 * Roles that may access any CRM endpoint.
 * Business rule: marketing, sales, sales_manager, manager, and admin all
 * have read/write access. Delete is restricted further (see canDeleteLead).
 */
export const CRM_ROLES = ["admin", "manager", "sales", "sales_manager", "marketing"] as const;

/**
 * Roles that may delete a lead.
 * Business rule: only leadership and admin may destroy pipeline data.
 */
export const CRM_DELETE_ROLES = ["admin", "manager", "sales_manager"] as const;

// ── Auth predicates ───────────────────────────────────────────────────────────

/**
 * Returns true when the user has any CRM role.
 * Used by the middleware guard in routes.ts.
 */
export function hasCrmAccess(user: CrmUser): boolean {
  return (CRM_ROLES as readonly string[]).includes(user.role);
}

/**
 * Returns true when the user may delete leads.
 * Business rule: a subset of CRM_ROLES only.
 */
export function canDeleteLead(user: CrmUser): boolean {
  return (CRM_DELETE_ROLES as readonly string[]).includes(user.role);
}

// ── Create lead defaults ──────────────────────────────────────────────────────

/**
 * Resolve a raw request body into a typed CreateLeadInput by applying
 * all default-value business rules.
 *
 * Business rules:
 *   - `name` is required (validation error raised upstream).
 *   - `value` is coerced to a Number; non-numeric becomes 0.
 *   - `currency` defaults to "SAR".
 *   - `assignedTo` defaults to the current user's ID.
 *   - `assignedToName` defaults to user.fullName, then user.username.
 *   - `tags` defaults to an empty array.
 *   - `nextFollowUpAt` is null when absent.
 */
export function resolveCreateLeadInput(
  body: Record<string, unknown>,
  user: CrmUser,
): CreateLeadInput {
  const {
    name, phone, email, company, source, stage, value,
    currency, assignedTo, assignedToName, notes, tags, nextFollowUpAt,
  } = body as Record<string, any>;

  return {
    name:           String(name ?? ""),
    phone:          String(phone ?? ""),
    email:          String(email ?? ""),
    company:        String(company ?? ""),
    source:         String(source ?? "other"),
    stage:          String(stage ?? "new"),
    value:          Number(value) || 0,
    currency:       String(currency || "SAR"),
    assignedTo:     String(assignedTo || user._id),
    assignedToName: String(assignedToName || user.fullName || user.username || ""),
    notes:          String(notes ?? ""),
    tags:           Array.isArray(tags) ? tags : [],
    nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
  };
}

// ── Import row parsing ────────────────────────────────────────────────────────

/**
 * Parse one bulk-import row into a normalised lead shape.
 *
 * Business rules:
 *   - Supports both English column names and Arabic equivalents.
 *   - A row with no `name` is skipped (returns null).
 *   - A row with a phone that already exists in the DB is skipped (checked
 *     by the repository layer; this function does not do DB lookups).
 *   - `source` defaults to "other".
 *   - `stage` is always "new" for imports.
 *   - `currency` is always "SAR" for imports.
 *   - `value` is coerced to Number; non-numeric becomes 0.
 *   - `assignedTo` and `assignedToName` are taken from the current user.
 */
export function parseImportRow(
  row: ImportRow,
  user: CrmUser,
): CreateLeadInput | null {
  const name = (
    row.name      ||
    row["الاسم"]  ||
    row["اسم"]    ||
    ""
  ).toString().trim();

  if (!name) return null;

  const phone = (
    row.phone      ||
    row["الهاتف"]  ||
    row["رقم"]     ||
    row["جوال"]    ||
    ""
  ).toString().trim();

  const company = (
    row.company    ||
    row["الشركة"]  ||
    row["المتجر"]  ||
    row["المطعم"]  ||
    row["النشاط"]  ||
    ""
  ).toString().trim();

  const email = (
    row.email     ||
    row["البريد"] ||
    ""
  ).toString().trim();

  const notes = (
    row.notes      ||
    row["ملاحظات"] ||
    row["العنوان"] ||
    row["الموقع"]  ||
    ""
  ).toString().trim();

  const source = (
    row.source     ||
    row["المصدر"]  ||
    "other"
  ).toString().trim() || "other";

  const rawValue = row.value ?? row["القيمة"] ?? 0;
  const value    = Number(rawValue) || 0;

  return {
    name,
    phone,
    email,
    company,
    source,
    stage:          "new",
    value,
    currency:       "SAR",
    assignedTo:     String(user._id),
    assignedToName: user.fullName || user.username || "",
    notes,
    tags:           [],
    nextFollowUpAt: null,
  };
}

// ── Activity validation ────────────────────────────────────────────────────────

/**
 * Resolve and validate an add-activity request body.
 *
 * Business rules:
 *   - `content` is required; absence returns null (caller responds 400).
 *   - `type` defaults to "note" when absent or invalid.
 *   - `createdBy` is always the current user's display name.
 */
export function resolveAddActivityInput(
  body: Record<string, unknown>,
  user: CrmUser,
): AddActivityInput | null {
  const content = (body.content as string | undefined)?.trim();
  if (!content) return null;

  const VALID_TYPES: CrmActivityType[] = ["call","email","whatsapp","meeting","note","task"];
  const rawType  = body.type as string | undefined;
  const type: CrmActivityType = VALID_TYPES.includes(rawType as CrmActivityType)
    ? (rawType as CrmActivityType)
    : "note";

  return {
    type,
    content,
    createdBy: user.fullName || user.username || String(user._id),
  };
}
