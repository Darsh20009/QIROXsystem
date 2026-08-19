// ── Navigation ──────────────────────────────────────────────────────────────
// Design System V2 — global Navigation unification (Phase 1).
//
// Renders the ds-* restyled navigation when FEATURE_DS_V2_NAV_FOOTER is
// enabled, falling back to the untouched legacy navigation otherwise.
// Zero-downtime: flip the flag, no code deploy needed, old path stays intact.

import { useFlag } from "@/features/customer-journey/hooks/use-feature-flags";
import NavigationLegacy from "@/components/NavigationLegacy";
import NavigationDSV2 from "@/components/NavigationDSV2";

export const FLAG_DS_V2_NAV_FOOTER = "FEATURE_DS_V2_NAV_FOOTER";

export default function Navigation() {
  const isDsV2 = useFlag(FLAG_DS_V2_NAV_FOOTER);
  return isDsV2 ? <NavigationDSV2 /> : <NavigationLegacy />;
}
