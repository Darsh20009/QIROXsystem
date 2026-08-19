// ── Footer ──────────────────────────────────────────────────────────────────
// Design System V2 — global Footer unification (Phase 1).
//
// Renders the ds-* restyled footer when FEATURE_DS_V2_NAV_FOOTER is
// enabled, falling back to the untouched legacy footer otherwise.
// Zero-downtime: flip the flag, no code deploy needed, old path stays intact.

import { useFlag } from "@/features/customer-journey/hooks/use-feature-flags";
import FooterLegacy from "@/components/FooterLegacy";
import FooterDSV2 from "@/components/FooterDSV2";

export const FLAG_DS_V2_NAV_FOOTER = "FEATURE_DS_V2_NAV_FOOTER";

export default function Footer() {
  const isDsV2 = useFlag(FLAG_DS_V2_NAV_FOOTER);
  return isDsV2 ? <FooterDSV2 /> : <FooterLegacy />;
}
