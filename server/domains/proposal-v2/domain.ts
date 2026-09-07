// ── Proposal V2 Domain Rules ──────────────────────────────────────────────────
// ALL business rules for the Proposal Builder V2 module live here.
// Functions here are pure — no database access, no HTTP concerns.

import { randomUUID, randomBytes } from "crypto";
import type {
  ProposalV2User,
  ProposalV2Section,
  ProposalV2Totals,
  CreateProposalV2Input,
  UpdateProposalV2Input,
  ProposalV2Status,
} from "./types";

// ── Role constants ────────────────────────────────────────────────────────────
// Mirrors the existing CRM role convention (server/domains/crm/domain.ts) —
// same staff population is expected to own proposals as owns leads/quotations.

export const PROPOSAL_V2_ROLES = ["admin", "manager", "sales", "sales_manager", "marketing"] as const;
export const PROPOSAL_V2_DELETE_ROLES = ["admin", "manager", "sales_manager"] as const;

export function hasProposalV2Access(user: ProposalV2User): boolean {
  return (PROPOSAL_V2_ROLES as readonly string[]).includes(user.role);
}

export function canDeleteProposalV2(user: ProposalV2User): boolean {
  return (PROPOSAL_V2_DELETE_ROLES as readonly string[]).includes(user.role);
}

// ── Numbering & tokens ────────────────────────────────────────────────────────

/** Business rule: proposal numbers are "PRV2-" + zero-padded sequential count. */
export function generateProposalNumber(existingCount: number): string {
  return `PRV2-${String(existingCount + 1).padStart(6, "0")}`;
}

/** Business rule: public share tokens are opaque, unguessable, URL-safe. */
export function generateViewToken(): string {
  return randomBytes(24).toString("base64url");
}

export function generateSectionId(): string {
  return randomUUID();
}

// ── Totals calculation ────────────────────────────────────────────────────────

/**
 * Business rule: totals are derived from every "items"-type section's line
 * items — not entered manually — so the builder always reflects the sum of
 * its own content. VAT is applied once, on the aggregate subtotal.
 */
export function computeTotals(sections: ProposalV2Section[], vatRate: number): ProposalV2Totals {
  const subtotal = sections
    .filter(s => s.type === "items")
    .reduce((sum, s) => sum + s.items.reduce((iSum, i) => iSum + (Number(i.total) || 0), 0), 0);

  const vatAmount = Math.round(subtotal * (Number(vatRate) / 100) * 100) / 100;
  const totalAmount = Math.round((subtotal + vatAmount) * 100) / 100;

  return { subtotal, vatAmount, totalAmount };
}

/** Business rule: line item totals are always qty * unitPrice, never trusted from the client. */
export function normaliseSections(sections: unknown): ProposalV2Section[] {
  if (!Array.isArray(sections)) return [];
  return sections.map((raw, idx) => {
    const s = raw as Record<string, any>;
    const items = Array.isArray(s.items)
      ? s.items.map((raw2: any) => {
          const qty = Number(raw2?.qty) || 0;
          const unitPrice = Number(raw2?.unitPrice) || 0;
          return {
            name: String(raw2?.name ?? ""),
            description: String(raw2?.description ?? ""),
            qty,
            unitPrice,
            total: Math.round(qty * unitPrice * 100) / 100,
          };
        })
      : [];

    return {
      id: String(s?.id || generateSectionId()),
      type: ["text", "items", "pricing", "terms", "custom"].includes(s?.type) ? s.type : "text",
      title: String(s?.title ?? ""),
      content: String(s?.content ?? ""),
      items,
      order: Number.isFinite(s?.order) ? Number(s.order) : idx,
    };
  });
}

// ── Create input resolution ───────────────────────────────────────────────────

/**
 * Resolve a raw request body into a typed CreateProposalV2Input.
 * Business rules: `title` required upstream; vatRate defaults to 15%
 * (matches the legacy Quotation default); currency defaults to SAR.
 */
export function resolveCreateInput(
  body: Record<string, unknown>,
  user: ProposalV2User,
): CreateProposalV2Input {
  const b = body as Record<string, any>;
  return {
    title:              String(b.title ?? ""),
    userId:             b.userId ? String(b.userId) : null,
    externalName:       String(b.externalName ?? ""),
    externalEmail:      String(b.externalEmail ?? ""),
    externalCompany:    String(b.externalCompany ?? ""),
    sections:           normaliseSections(b.sections),
    currency:           String(b.currency || "SAR"),
    vatRate:            Number.isFinite(Number(b.vatRate)) ? Number(b.vatRate) : 15,
    validUntil:         b.validUntil ? new Date(b.validUntil) : null,
    notes:              String(b.notes ?? ""),
    termsAndConditions: String(b.termsAndConditions ?? ""),
    sourceQuotationId:  b.sourceQuotationId ? String(b.sourceQuotationId) : null,
    createdBy:          String(user._id),
  };
}

/** Resolve a raw request body into a typed UpdateProposalV2Input (partial). */
export function resolveUpdateInput(body: Record<string, unknown>): UpdateProposalV2Input {
  const b = body as Record<string, any>;
  const out: UpdateProposalV2Input = {};
  if (b.title !== undefined) out.title = String(b.title);
  if (b.sections !== undefined) out.sections = normaliseSections(b.sections);
  if (b.vatRate !== undefined) out.vatRate = Number(b.vatRate) || 0;
  if (b.validUntil !== undefined) out.validUntil = b.validUntil ? new Date(b.validUntil) : null;
  if (b.notes !== undefined) out.notes = String(b.notes);
  if (b.termsAndConditions !== undefined) out.termsAndConditions = String(b.termsAndConditions);
  return out;
}

// ── Status transitions ────────────────────────────────────────────────────────

const VALID_STATUSES: ProposalV2Status[] = ["draft", "sent", "viewed", "accepted", "rejected", "expired"];

/**
 * Business rule: a proposal may only move to a status in VALID_STATUSES.
 * No workflow ordering is enforced yet (e.g. accepted -> draft is technically
 * allowed) since Proposal V2 is still architecture-stage — this is the single
 * place that rule would be tightened later.
 */
export function isValidStatus(status: unknown): status is ProposalV2Status {
  return typeof status === "string" && (VALID_STATUSES as string[]).includes(status);
}

/** Business rule: viewing via the public link bumps draft/sent proposals to "viewed". */
export function statusAfterPublicView(current: ProposalV2Status): ProposalV2Status {
  return current === "draft" || current === "sent" ? "viewed" : current;
}
