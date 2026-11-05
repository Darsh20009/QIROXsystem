// ── Proposal V2 Service ───────────────────────────────────────────────────────
// Orchestration only — no HTTP concerns, no direct DB access outside repository.

import * as domain     from "./domain";
import * as repository from "./repository";
import * as mapper     from "./mapper";
import type {
  ProposalV2Filters,
  ProposalV2User,
  ProposalV2Stats,
} from "./types";

type ServiceError<S extends number> = { ok: false; status: S; error: string };

// ── Read use cases ────────────────────────────────────────────────────────────

export async function listProposals(filters: ProposalV2Filters): Promise<unknown[]> {
  const docs = await repository.findProposals(filters);
  return mapper.toProposalListResponse(docs);
}

export async function getStats(): Promise<ProposalV2Stats> {
  const [total, byStatus, totalValue, acceptedValue] = await Promise.all([
    repository.countProposals(),
    repository.aggregateByStatus(),
    repository.aggregateTotalValue(),
    repository.aggregateAcceptedValue(),
  ]);
  return mapper.toStatsResponse(total, byStatus, totalValue, acceptedValue);
}

export async function getProposal(id: string): Promise<
  | { ok: true; proposal: unknown }
  | ServiceError<404>
> {
  const doc = await repository.findProposalById(id);
  if (!doc) return { ok: false, status: 404, error: "Proposal not found" };
  return { ok: true, proposal: mapper.toProposalResponse(doc) };
}

/**
 * Prefill helper — reads a legacy Quotation (read-only) and returns a
 * Proposal V2 create-input-shaped payload. Never writes to Quotation.
 */
export async function prefillFromQuotation(quotationId: string): Promise<
  | { ok: true; prefill: Record<string, unknown> }
  | ServiceError<404>
> {
  const quotation = await repository.findQuotationForPrefill(quotationId);
  if (!quotation) return { ok: false, status: 404, error: "Quotation not found" };
  return { ok: true, prefill: mapper.toPrefillFromQuotation(quotation) };
}

// ── Public (unauthenticated, token-based) use case ────────────────────────────

export async function getByPublicToken(token: string): Promise<
  | { ok: true; proposal: unknown }
  | ServiceError<404>
> {
  const doc = await repository.findProposalByToken(token);
  if (!doc) return { ok: false, status: 404, error: "Proposal not found" };

  const nextStatus = domain.statusAfterPublicView(doc.status);
  if (nextStatus !== doc.status) {
    doc.status = nextStatus;
    await repository.saveProposal(doc);
  }
  await repository.incrementViewCount(String(doc._id));

  return { ok: true, proposal: mapper.toProposalResponse(doc.toJSON()) };
}

// ── Write use cases ───────────────────────────────────────────────────────────

export async function createProposal(
  body: Record<string, unknown>,
  user: ProposalV2User,
): Promise<{ ok: true; proposal: unknown } | ServiceError<400>> {
  const title = (body.title as string | undefined)?.trim();
  if (!title) return { ok: false, status: 400, error: "العنوان مطلوب" };

  const input = domain.resolveCreateInput(body, user);
  const totals = domain.computeTotals(input.sections, input.vatRate);
  const proposalNumber = domain.generateProposalNumber(await repository.countProposals());
  const viewToken = domain.generateViewToken();

  const initialVersion = {
    versionNumber: 1,
    title: input.title,
    sections: input.sections,
    subtotal: totals.subtotal,
    vatRate: input.vatRate,
    vatAmount: totals.vatAmount,
    totalAmount: totals.totalAmount,
    status: "draft" as const,
    createdAt: new Date(),
    createdBy: input.createdBy,
  };

  const doc = await repository.createProposal({
    proposalNumber,
    userId: input.userId,
    externalName: input.externalName,
    externalEmail: input.externalEmail,
    externalCompany: input.externalCompany,
    title: input.title,
    sections: input.sections,
    currency: input.currency,
    ...totals,
    vatRate: input.vatRate,
    validUntil: input.validUntil,
    status: "draft",
    notes: input.notes,
    termsAndConditions: input.termsAndConditions,
    viewToken,
    sourceQuotationId: input.sourceQuotationId,
    versions: [initialVersion],
    createdBy: input.createdBy,
  });

  return { ok: true, proposal: mapper.toProposalResponse(doc) };
}

export async function updateProposal(
  id: string,
  body: Record<string, unknown>,
  user: ProposalV2User,
): Promise<{ ok: true; proposal: unknown } | ServiceError<404>> {
  const { ProposalV2Model } = await import("../../models");
  const doc: any = await ProposalV2Model.findById(id);
  if (!doc) return { ok: false, status: 404, error: "Proposal not found" };

  const patch = domain.resolveUpdateInput(body);
  if (patch.title !== undefined) doc.title = patch.title;
  if (patch.sections !== undefined) doc.sections = patch.sections;
  if (patch.vatRate !== undefined) doc.vatRate = patch.vatRate;
  if (patch.validUntil !== undefined) doc.validUntil = patch.validUntil;
  if (patch.notes !== undefined) doc.notes = patch.notes;
  if (patch.termsAndConditions !== undefined) doc.termsAndConditions = patch.termsAndConditions;

  const totals = domain.computeTotals(doc.sections, doc.vatRate);
  doc.subtotal = totals.subtotal;
  doc.vatAmount = totals.vatAmount;
  doc.totalAmount = totals.totalAmount;

  // Business rule: every update snapshots the previous state into `versions`
  // before applying the change, so history is preserved (append-only).
  const nextVersionNumber = (doc.versions?.length || 0) + 1;
  doc.versions.push({
    versionNumber: nextVersionNumber,
    title: doc.title,
    sections: doc.sections,
    subtotal: doc.subtotal,
    vatRate: doc.vatRate,
    vatAmount: doc.vatAmount,
    totalAmount: doc.totalAmount,
    status: doc.status,
    createdAt: new Date(),
    createdBy: String(user._id),
  });

  await repository.saveProposal(doc);
  return { ok: true, proposal: mapper.toProposalResponse(doc.toJSON()) };
}

export async function changeStatus(
  id: string,
  status: unknown,
): Promise<{ ok: true; proposal: unknown } | ServiceError<400> | ServiceError<404>> {
  if (!domain.isValidStatus(status)) {
    return { ok: false, status: 400, error: "Invalid status" };
  }

  const { ProposalV2Model } = await import("../../models");
  const doc: any = await ProposalV2Model.findByIdAndUpdate(id, { status }, { new: true });
  if (!doc) return { ok: false, status: 404, error: "Proposal not found" };

  return { ok: true, proposal: mapper.toProposalResponse(doc) };
}

export async function deleteProposal(
  id: string,
  user: ProposalV2User,
): Promise<{ ok: true } | ServiceError<403>> {
  if (!domain.canDeleteProposalV2(user)) return { ok: false, status: 403, error: "Forbidden" };
  await repository.deleteProposal(id);
  return { ok: true };
}
