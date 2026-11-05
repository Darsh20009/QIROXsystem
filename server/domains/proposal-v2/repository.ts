// ── Proposal V2 Repository ────────────────────────────────────────────────────
// ALL database queries for the Proposal Builder V2 module live here.
// Additive-only: only ever reads/writes ProposalV2Model. May READ (never
// write) the legacy QuotationModel for the prefill-from-quotation use case.

import { ProposalV2Model, QuotationModel } from "../../models";
import type { ProposalV2Filters } from "./types";

// ── Read queries ───────────────────────────────────────────────────────────────

export async function findProposals(filters: ProposalV2Filters): Promise<unknown[]> {
  const query: Record<string, unknown> = {};

  if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }
  if (filters.search) {
    query.$or = [
      { title:            { $regex: filters.search, $options: "i" } },
      { proposalNumber:   { $regex: filters.search, $options: "i" } },
      { externalName:     { $regex: filters.search, $options: "i" } },
      { externalCompany:  { $regex: filters.search, $options: "i" } },
    ];
  }

  return ProposalV2Model.find(query)
    .select("-versions") // list view never needs full version history payloads
    .sort({ updatedAt: -1 })
    .populate("userId", "fullName email username")
    .lean();
}

export async function countProposals(): Promise<number> {
  return ProposalV2Model.countDocuments();
}

export async function findProposalById(id: string): Promise<unknown | null> {
  return ProposalV2Model.findById(id).populate("userId", "fullName email username").lean();
}

/** Used by the public share link — looked up by opaque token, never by _id. */
export async function findProposalByToken(token: string): Promise<any | null> {
  return ProposalV2Model.findOne({ viewToken: token });
}

export async function aggregateByStatus(): Promise<Array<{ _id: string; count: number; value: number }>> {
  return ProposalV2Model.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 }, value: { $sum: "$totalAmount" } } },
  ]);
}

export async function aggregateTotalValue(): Promise<number> {
  const result = await ProposalV2Model.aggregate([
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);
  return result[0]?.total || 0;
}

export async function aggregateAcceptedValue(): Promise<number> {
  const result = await ProposalV2Model.aggregate([
    { $match: { status: "accepted" } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);
  return result[0]?.total || 0;
}

/**
 * Read-only lookup into the legacy Quotation collection, used only to prefill
 * the Proposal V2 builder. Never mutated from this domain.
 */
export async function findQuotationForPrefill(quotationId: string): Promise<any | null> {
  return QuotationModel.findById(quotationId).lean();
}

// ── Write queries ─────────────────────────────────────────────────────────────

export async function createProposal(doc: Record<string, unknown>): Promise<unknown> {
  return ProposalV2Model.create(doc);
}

export async function saveProposal(doc: any): Promise<unknown> {
  return doc.save();
}

export async function deleteProposal(id: string): Promise<void> {
  await ProposalV2Model.findByIdAndDelete(id);
}

export async function incrementViewCount(id: string): Promise<void> {
  await ProposalV2Model.findByIdAndUpdate(id, {
    $inc: { viewCount: 1 },
    $set: { lastViewedAt: new Date() },
  });
}
