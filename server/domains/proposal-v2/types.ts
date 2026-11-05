// ── Proposal V2 Domain Types ──────────────────────────────────────────────────
// Sprint D — Proposal Builder V2 Architecture.
// All domain contracts for the Proposal Builder V2 module.

export type ProposalV2Status =
  | "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired";

export type ProposalV2SectionType = "text" | "items" | "pricing" | "terms" | "custom";

export interface ProposalV2Item {
  name:        string;
  description: string;
  qty:         number;
  unitPrice:   number;
  total:       number;
}

export interface ProposalV2Section {
  id:      string;
  type:    ProposalV2SectionType;
  title:   string;
  content: string;
  items:   ProposalV2Item[];
  order:   number;
}

export interface ProposalV2Version {
  versionNumber: number;
  title:         string;
  sections:      ProposalV2Section[];
  subtotal:      number;
  vatRate:       number;
  vatAmount:     number;
  totalAmount:   number;
  status:        ProposalV2Status;
  createdAt:     Date | string;
  createdBy:     string | null;
}

/** Minimal user shape required by Proposal V2 domain logic. */
export interface ProposalV2User {
  _id:       string;
  role:      string;
  fullName?: string;
  username?: string;
}

/** Query filters for GET /api/v2/proposals */
export interface ProposalV2Filters {
  status?: string;
  search?: string;
}

/** Resolved input for creating a proposal. */
export interface CreateProposalV2Input {
  title:              string;
  userId:             string | null;
  externalName:       string;
  externalEmail:      string;
  externalCompany:    string;
  sections:           ProposalV2Section[];
  currency:           string;
  vatRate:            number;
  validUntil:         Date | null;
  notes:              string;
  termsAndConditions: string;
  sourceQuotationId:  string | null;
  createdBy:          string;
}

/** Resolved input for updating a proposal (all fields optional/partial). */
export interface UpdateProposalV2Input {
  title?:              string;
  sections?:           ProposalV2Section[];
  vatRate?:            number;
  validUntil?:         Date | null;
  notes?:              string;
  termsAndConditions?: string;
}

export interface ProposalV2Totals {
  subtotal:    number;
  vatAmount:   number;
  totalAmount: number;
}

export interface ProposalV2Stats {
  total:       number;
  byStatus:    Record<string, { count: number; value: number }>;
  totalValue:  number;
  acceptedValue: number;
}
