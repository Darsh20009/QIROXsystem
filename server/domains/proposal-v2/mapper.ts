// ── Proposal V2 Mapper ────────────────────────────────────────────────────────
// DTO <-> Entity conversion for the Proposal Builder V2 module.

import type { ProposalV2Stats } from "./types";

/** Pass-through for a single document (lean or Mongoose). toJSON/lean already shape it. */
export function toProposalResponse(doc: unknown): unknown {
  return doc;
}

/** Pass-through for a list of lean documents. */
export function toProposalListResponse(docs: unknown[]): unknown[] {
  return docs;
}

/** Map aggregation results into the ProposalV2Stats wire format. */
export function toStatsResponse(
  total: number,
  byStatus: Array<{ _id: string; count: number; value: number }>,
  totalValue: number,
  acceptedValue: number,
): ProposalV2Stats {
  const statusMap: Record<string, { count: number; value: number }> = {};
  for (const s of byStatus) {
    statusMap[s._id] = { count: s.count, value: s.value };
  }
  return { total, byStatus: statusMap, totalValue, acceptedValue };
}

/**
 * Shape a legacy Quotation document into a Proposal V2 create-input-shaped
 * prefill payload. Read-only — the Quotation document itself is untouched.
 */
export function toPrefillFromQuotation(quotation: any): Record<string, unknown> {
  const items = Array.isArray(quotation.items) ? quotation.items : [];
  return {
    title: quotation.title || "",
    userId: quotation.userId ? String(quotation.userId) : null,
    externalName: quotation.externalName || "",
    externalEmail: quotation.externalEmail || "",
    externalCompany: quotation.externalCompany || "",
    vatRate: quotation.vatRate ?? 15,
    validUntil: quotation.validUntil || null,
    notes: quotation.notes || "",
    termsAndConditions: quotation.termsAndConditions || "",
    sourceQuotationId: String(quotation._id),
    sections: [
      {
        id: `prefill-${String(quotation._id)}`,
        type: "items",
        title: "Items",
        content: "",
        order: 0,
        items: items.map((i: any) => ({
          name: i.name || "",
          description: i.description || "",
          qty: i.qty || 1,
          unitPrice: i.unitPrice || 0,
          total: i.total || (i.qty || 1) * (i.unitPrice || 0),
        })),
      },
    ],
  };
}
