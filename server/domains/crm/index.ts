// ── CRM Domain — Public API ───────────────────────────────────────────────────
// Single import point for the CRM domain module.
//
// External code (server/index.ts) imports only from this barrel.
// Internal layers import directly from their sibling files.
//
// Exported surface:
//   registerCrmRoutes — drop-in replacement for the legacy server/crm.ts export.

export { registerCrmRoutes } from "./routes";

// ── Types (for consumers outside the domain) ──────────────────────────────────
export type {
  CrmLead,
  CrmActivity,
  CrmStats,
  CrmLeadStage,
  CrmLeadSource,
  CrmActivityType,
  CrmUser,
  LeadFilters,
  CreateLeadInput,
  AddActivityInput,
  ImportRow,
  ImportResult,
} from "./types";
