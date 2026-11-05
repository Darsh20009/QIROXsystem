// ── Proposal Builder V2 Models ───────────────────────────────────────────────
// Sprint D — Proposal Builder V2 Architecture.
// ADDITIVE ONLY. New collection. Zero downtime.
// The existing Quotation collection/flow (server/models/finance.ts, the
// /api/quotations endpoints, and client/src/pages/AdminQuotations.tsx +
// ClientQuotations.tsx + QuotationPrint.tsx) is NEVER read here for writes
// and NEVER modified. Proposal V2 can optionally prefill from a Quotation
// (read-only) but always persists into its own collection.
//
// New collection:
//   proposalv2s — versioned, section-based proposals with a public share link

import mongoose from "mongoose";

// ── Enumerations ──────────────────────────────────────────────────────────────

export const PROPOSAL_V2_STATUSES = [
  "draft", "sent", "viewed", "accepted", "rejected", "expired",
] as const;

export const PROPOSAL_V2_SECTION_TYPES = [
  "text", "items", "pricing", "terms", "custom",
] as const;

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const proposalV2ItemSchema = new mongoose.Schema({
  name:        { type: String, default: "" },
  description: { type: String, default: "" },
  qty:         { type: Number, default: 1 },
  unitPrice:   { type: Number, default: 0 },
  total:       { type: Number, default: 0 },
}, { _id: false });

const proposalV2SectionSchema = new mongoose.Schema({
  id:      { type: String, required: true },
  type:    { type: String, enum: PROPOSAL_V2_SECTION_TYPES, default: "text" },
  title:   { type: String, default: "" },
  content: { type: String, default: "" },
  items:   { type: [proposalV2ItemSchema], default: [] },
  order:   { type: Number, default: 0 },
}, { _id: false });

// A frozen snapshot of the editable fields, captured every time a proposal
// is updated, so the full edit history is auditable.
const proposalV2VersionSchema = new mongoose.Schema({
  versionNumber: { type: Number, required: true },
  title:         { type: String, default: "" },
  sections:      { type: [proposalV2SectionSchema], default: [] },
  subtotal:      { type: Number, default: 0 },
  vatRate:       { type: Number, default: 15 },
  vatAmount:     { type: Number, default: 0 },
  totalAmount:   { type: Number, default: 0 },
  status:        { type: String, enum: PROPOSAL_V2_STATUSES, default: "draft" },
  createdAt:     { type: Date, default: Date.now },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { _id: false });

// ── Main schema ───────────────────────────────────────────────────────────────

const proposalV2Schema = new mongoose.Schema({
  proposalNumber: { type: String, required: true, unique: true },

  // Client reference — mirrors the Quotation pattern (registered or external).
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  externalName:    { type: String, default: "" },
  externalEmail:   { type: String, default: "" },
  externalCompany: { type: String, default: "" },

  title:    { type: String, default: "" },
  sections: { type: [proposalV2SectionSchema], default: [] },

  currency:    { type: String, default: "SAR" },
  subtotal:    { type: Number, default: 0 },
  vatRate:     { type: Number, default: 15 },
  vatAmount:   { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },

  validUntil: { type: Date, default: null },
  status:     { type: String, enum: PROPOSAL_V2_STATUSES, default: "draft" },

  notes:              { type: String, default: "" },
  termsAndConditions: { type: String, default: "" },

  // Public share link — random opaque token, never the Mongo _id.
  viewToken:    { type: String, required: true, unique: true },
  viewCount:    { type: Number, default: 0 },
  lastViewedAt: { type: Date, default: null },

  // Optional read-only lineage back to a legacy Quotation this proposal was
  // built from. Never used to write to the Quotation collection.
  sourceQuotationId: { type: mongoose.Schema.Types.ObjectId, ref: "Quotation", default: null },

  versions: { type: [proposalV2VersionSchema], default: [] },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

proposalV2Schema.set("toJSON", {
  transform: (_: any, ret: any) => {
    ret.id = ret._id?.toString();
    return ret;
  },
});

export const ProposalV2Model =
  mongoose.models.ProposalV2 || mongoose.model("ProposalV2", proposalV2Schema);
