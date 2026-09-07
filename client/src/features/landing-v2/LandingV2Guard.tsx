// ── LandingV2Guard ────────────────────────────────────────────────────────────
// Sprint 009 — Landing Experience V2.
//
// Renders the new landing page only when FEATURE_LANDING_V2 is enabled.
// Falls back to the existing production homepage otherwise.
// Zero-downtime: flip the flag, no code deploy needed.

import { type ReactNode } from "react";
import { useFlag } from "@/features/customer-journey/hooks/use-feature-flags";

export const FLAG_LANDING_V2 = "FEATURE_LANDING_V2";

interface LandingV2GuardProps {
  /** Content to render when FEATURE_LANDING_V2 is enabled. */
  children: ReactNode;
  /** Content to render while the flag is off or loading (the existing production homepage). */
  fallback: ReactNode;
}

export function LandingV2Guard({ children, fallback }: LandingV2GuardProps) {
  const isLandingV2 = useFlag(FLAG_LANDING_V2);
  return <>{isLandingV2 ? children : fallback}</>;
}
