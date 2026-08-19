// ── JourneyShell ──────────────────────────────────────────────────────────────
// Sprint 003 — Architecture only. Not yet active in production.
//
// Top-level guard + provider for Customer Journey V2.
// Renders children only when FEATURE_CUSTOMER_JOURNEY_V2 is enabled.
// Falls back to `fallback` (or null) when the flag is off.

import { type ReactNode } from "react";
import { JourneyProvider } from "../context/journey-context";
import { useFeatureFlags } from "../hooks/use-feature-flags";
import type { JourneyState } from "../types";

// ── Props ─────────────────────────────────────────────────────────────────────

interface JourneyShellProps {
  /** Content to render when the journey is active. */
  children: ReactNode;
  /** Content to render when the flag is disabled (default: null). */
  fallback?: ReactNode;
  /** Optional server-synced initial state. */
  initialState?: JourneyState;
  /**
   * When true, skips the feature-flag check entirely.
   * Use in Storybook / tests only.
   */
  forceEnabled?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function JourneyShell({
  children,
  fallback = null,
  initialState,
  forceEnabled = false,
}: JourneyShellProps) {
  const { isCustomerJourneyV2, isLoading } = useFeatureFlags();

  // While flags are loading, render nothing to avoid layout flash
  if (isLoading && !forceEnabled) return null;

  // Feature flag off — render fallback (existing production UI)
  if (!forceEnabled && !isCustomerJourneyV2) {
    return <>{fallback}</>;
  }

  return (
    <JourneyProvider initialState={initialState}>
      {children}
    </JourneyProvider>
  );
}

// ── DashboardV2 guard (separate flag) ────────────────────────────────────────

interface DashboardV2GuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  forceEnabled?: boolean;
}

export function DashboardV2Guard({
  children,
  fallback = null,
  forceEnabled = false,
}: DashboardV2GuardProps) {
  const { isDashboardV2, isLoading } = useFeatureFlags();

  if (isLoading && !forceEnabled) return null;
  if (!forceEnabled && !isDashboardV2) return <>{fallback}</>;

  return <>{children}</>;
}
