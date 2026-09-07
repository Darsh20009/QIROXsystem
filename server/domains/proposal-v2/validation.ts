// ── Proposal V2 Validation ────────────────────────────────────────────────────
// Placeholder — no runtime schema validation wired yet, mirrors
// server/domains/crm/validation.ts. The domain layer (domain.ts) handles
// input resolution/coercion manually until a shared Zod pipeline exists.

/** @placeholder Validates the body for POST /api/v2/proposals */
export const createProposalSchema = null;

/** @placeholder Validates the body for PATCH /api/v2/proposals/:id */
export const updateProposalSchema = null;

/** @placeholder Validates the body for POST /api/v2/proposals/:id/status */
export const changeStatusSchema = null;
