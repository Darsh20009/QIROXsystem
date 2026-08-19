// ── useFeatureFlags ───────────────────────────────────────────────────────────
// Sprint 003 — Architecture only. Not yet active in production.
//
// Fetches FEATURE_* flags from the public API endpoint and exposes them
// as a typed object. Cached by React Query; no auth required.

import { useQuery } from "@tanstack/react-query";
import type { ClientFeatureFlags } from "../types";
import {
  FEATURE_FLAGS_QUERY_KEY,
  FLAG_CUSTOMER_JOURNEY_V2,
  FLAG_DASHBOARD_V2,
} from "../constants";

// ── Raw API response shape ────────────────────────────────────────────────────

interface FlagsApiResponse {
  ok: boolean;
  flags: Record<string, { enabled: boolean; source?: string } | boolean>;
}

// ── Normalise API response → flat boolean map ─────────────────────────────────

function normaliseFlags(raw: FlagsApiResponse["flags"]): ClientFeatureFlags {
  const out: Record<string, boolean> = {};
  for (const [key, val] of Object.entries(raw)) {
    if (typeof val === "boolean") {
      out[key] = val;
    } else if (val && typeof val === "object" && "enabled" in val) {
      out[key] = Boolean(val.enabled);
    }
  }
  return out as ClientFeatureFlags;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseFeatureFlagsResult {
  flags: ClientFeatureFlags;
  isCustomerJourneyV2: boolean;
  isDashboardV2: boolean;
  isLoading: boolean;
  isError: boolean;
}

export function useFeatureFlags(): UseFeatureFlagsResult {
  const { data, isLoading, isError } = useQuery<ClientFeatureFlags>({
    queryKey: FEATURE_FLAGS_QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("/api/public/feature-flags");
      if (!res.ok) throw new Error("Failed to fetch feature flags");
      const body: FlagsApiResponse = await res.json();
      return normaliseFlags(body.flags ?? {});
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — flags rarely change at runtime
    retry: 2,
    retryDelay: 1000,
  });

  const flags: ClientFeatureFlags = data ?? ({} as ClientFeatureFlags);

  return {
    flags,
    isCustomerJourneyV2: Boolean(flags[FLAG_CUSTOMER_JOURNEY_V2]),
    isDashboardV2:        Boolean(flags[FLAG_DASHBOARD_V2]),
    isLoading,
    isError,
  };
}

/** Single-flag convenience hook. */
export function useFlag(flagName: string): boolean {
  const { flags } = useFeatureFlags();
  return Boolean(flags[flagName]);
}
