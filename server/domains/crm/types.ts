// ── CRM Domain Types ──────────────────────────────────────────────────────────
// All domain contracts for the CRM module.
//
// Purpose:
//   Provide typed interfaces for CRM entities and DTOs so every layer
//   (repository, service, controller) shares the same vocabulary.
//
// Responsibilities:
//   - Entity types that mirror the Mongoose schema shape.
//   - Input types consumed by the service layer.
//   - Output types returned to the controller layer.
//
// Future migration role:
//   These types will be the source of truth for OpenAPI schema generation
//   once the validation layer is wired (Migration 007+).

// ── Enumerations ──────────────────────────────────────────────────────────────

/** Pipeline stage a lead is currently in. */
export type CrmLeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "won"
  | "lost";

/** How the lead was originally acquired. */
export type CrmLeadSource =
  | "website"
  | "instagram"
  | "twitter"
  | "tiktok"
  | "referral"
  | "cold_call"
  | "exhibition"
  | "other";

/** Type of a logged activity against a lead. */
export type CrmActivityType =
  | "call"
  | "email"
  | "whatsapp"
  | "meeting"
  | "note"
  | "task";

// ── Entity types ──────────────────────────────────────────────────────────────

/** A single logged activity attached to a CRM lead. */
export interface CrmActivity {
  _id:       string;
  id:        string;
  type:      CrmActivityType;
  content:   string;
  createdBy: string;
  createdAt: Date | string;
}

/** The full CRM lead entity as returned by the database. */
export interface CrmLead {
  _id:             string;
  id:              string;
  name:            string;
  phone:           string;
  email:           string;
  company:         string;
  source:          CrmLeadSource;
  stage:           CrmLeadStage;
  value:           number;
  currency:        string;
  assignedTo:      string;
  assignedToName:  string;
  notes:           string;
  lostReason:      string;
  tags:            string[];
  nextFollowUpAt:  Date | string | null;
  lastContactedAt: Date | string | null;
  activities:      CrmActivity[];
  createdAt:       Date | string;
  updatedAt:       Date | string;
}

// ── Stats types ───────────────────────────────────────────────────────────────

/** Stats returned by GET /api/crm/stats. */
export interface CrmStats {
  total:      number;
  stages:     Record<string, { count: number; value: number }>;
  totalValue: number;
}

// ── Filter types ──────────────────────────────────────────────────────────────

/** Query parameters accepted by GET /api/crm/leads. */
export interface LeadFilters {
  stage?:      string;
  assignedTo?: string;
  search?:     string;
}

// ── Input types ───────────────────────────────────────────────────────────────

/**
 * Resolved input for creating a lead.
 * Produced by the domain layer after applying defaults.
 */
export interface CreateLeadInput {
  name:            string;
  phone:           string;
  email:           string;
  company:         string;
  source:          string;
  stage:           string;
  value:           number;
  currency:        string;
  assignedTo:      string;
  assignedToName:  string;
  notes:           string;
  tags:            string[];
  nextFollowUpAt:  Date | null;
}

/**
 * Raw body of a bulk-import row.
 * Column names may be English or Arabic.
 */
export interface ImportRow {
  name?:    string;
  phone?:   string;
  company?: string;
  email?:   string;
  notes?:   string;
  source?:  string;
  value?:   string | number;
  // Arabic aliases
  "الاسم"?:  string;
  "اسم"?:    string;
  "الهاتف"?: string;
  "رقم"?:    string;
  "جوال"?:   string;
  "الشركة"?: string;
  "المتجر"?: string;
  "المطعم"?: string;
  "النشاط"?: string;
  "البريد"?: string;
  "ملاحظات"?: string;
  "العنوان"?: string;
  "الموقع"?:  string;
  "المصدر"?:  string;
  "القيمة"?:  string | number;
  [key: string]: string | number | undefined;
}

/** Input for adding an activity to a lead. */
export interface AddActivityInput {
  type:      CrmActivityType;
  content:   string;
  createdBy: string;
}

/**
 * Minimal user shape required by CRM domain logic.
 * Extracted from req.user so the domain never imports Express types.
 */
export interface CrmUser {
  _id:      string;
  role:     string;
  fullName?: string;
  username?: string;
}

// ── Import result ──────────────────────────────────────────────────────────────

/** Response shape for POST /api/crm/leads/import. */
export interface ImportResult {
  ok:      true;
  created: number;
  skipped: number;
  errors:  string[];
}
