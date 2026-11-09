// ── Proposal V2 Domain — Public API ───────────────────────────────────────────
// Sprint D — Proposal Builder V2 Architecture.
// Single import point for the Proposal Builder V2 domain module.

export { registerProposalV2Routes } from "./routes";

export type {
  ProposalV2Status,
  ProposalV2SectionType,
  ProposalV2Item,
  ProposalV2Section,
  ProposalV2Version,
  ProposalV2User,
  ProposalV2Filters,
  CreateProposalV2Input,
  UpdateProposalV2Input,
  ProposalV2Totals,
  ProposalV2Stats,
} from "./types";
