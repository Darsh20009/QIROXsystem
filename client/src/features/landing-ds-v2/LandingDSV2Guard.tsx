// ── LandingDSV2Guard ─────────────────────────────────────────────────────────
// Design System V2 migration pilot — Landing Page only.
//
// Renders the redesigned Landing Page only when FEATURE_LANDING_DS_V2 is
// enabled. Falls back to whatever was rendering before (the existing V2
// landing page, or the legacy Home page) otherwise.
// Zero-downtime: flip the flag, no code deploy needed, old path stays intact.

import { type ReactNode } from "react";
import { useFlag } from "@/features/customer-journey/hooks/use-feature-flags";

export const FLAG_LANDING_DS_V2 = "FEATURE_LANDING_DS_V2";

interface LandingDSV2GuardProps {
  /** Content to render when FEATURE_LANDING_DS_V2 is enabled. */
  children: ReactNode;
  /** Content to render while the flag is off or loading. */
  fallback: ReactNode;
}

export function LandingDSV2Guard({ children, fallback }: LandingDSV2GuardProps) {
  const isLandingDSV2 = useFlag(FLAG_LANDING_DS_V2);
  return <>{isLandingDSV2 ? children : fallback}</>;
}
