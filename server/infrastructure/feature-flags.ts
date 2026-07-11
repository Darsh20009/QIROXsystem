// ── Feature Flag Engine ───────────────────────────────────────────────────────
// In-process feature flag store for QIROX.
//
// Flag sources (in priority order, highest wins):
//   1. Runtime overrides  — set programmatically (e.g. from admin UI or tests)
//   2. Environment vars   — FEATURE_<NAME>=true|false (loaded at startup)
//   3. Defaults           — hardcoded baseline (always false unless specified)
//
// Naming convention:
//   Environment variable:  FEATURE_ORDER_V4=true
//   Code reference:        flags.isEnabled("FEATURE_ORDER_V4")
//                     or   flags.isEnabled(FeatureFlag.ORDER_V4)
//
// Zero-downtime operation:
//   - All Sprint 001 V4 features default to FALSE — they do not affect production.
//   - Set FEATURE_<NAME>=true in the environment to activate a flag.
//   - Runtime overrides can be applied without redeployment.
//   - Override scope can be global (all users) or contextual (user/role/env).

// ── Known flags ───────────────────────────────────────────────────────────────
// Declare every flag as a constant so call sites avoid magic strings.

export const FeatureFlag = {
  // ── Sprint 001 Client Journey V4 flags ────────────────────────────────────
  HOME_V4:                  "FEATURE_HOME_V4",
  PRICING_V4:               "FEATURE_PRICING_V4",
  SOLUTION_FINDER:          "FEATURE_SOLUTION_FINDER",
  ORDER_V4:                 "FEATURE_ORDER_V4",
  MOYASAR_PAYMENTS:         "FEATURE_MOYASAR_PAYMENTS",
  PROJECT_DASHBOARD_V4:     "FEATURE_PROJECT_DASHBOARD_V4",
  DELIVERY_ACCEPTANCE:      "FEATURE_DELIVERY_ACCEPTANCE",
  NPS_REVIEWS:              "FEATURE_NPS_REVIEWS",
  LOYALTY_PROGRAMME:        "FEATURE_LOYALTY_PROGRAMME",

  // ── Infrastructure flags ───────────────────────────────────────────────────
  STRUCTURED_LOGGING:       "FEATURE_STRUCTURED_LOGGING",
  HEALTH_DETAILED_PUBLIC:   "FEATURE_HEALTH_DETAILED_PUBLIC",
  EVENT_BUS_DEBUG:          "FEATURE_EVENT_BUS_DEBUG",

  // ── Sprint 003 — Customer Journey V2 flags ────────────────────────────────
  CUSTOMER_JOURNEY_V2:      "FEATURE_CUSTOMER_JOURNEY_V2",
  DASHBOARD_V2:             "FEATURE_DASHBOARD_V2",
} as const;

export type FeatureFlagName = typeof FeatureFlag[keyof typeof FeatureFlag];

// ── Context shape for contextual evaluation ───────────────────────────────────

export interface FlagContext {
  userId?:   string;
  userRole?: string;
  env?:      string;
  [key: string]:  unknown;
}

// ── Override shape ────────────────────────────────────────────────────────────

interface FlagOverride {
  enabled: boolean;
  /** If set, override only applies when context matches all predicates. */
  context?: Partial<FlagContext>;
  /** ISO timestamp after which this override expires (optional). */
  expiresAt?: Date;
}

// ── Engine ────────────────────────────────────────────────────────────────────

export class FeatureFlagEngine {
  /** Overrides applied at runtime (highest priority). */
  private readonly overrides = new Map<string, FlagOverride[]>();

  /** Values loaded from environment variables at startup. */
  private readonly envValues = new Map<string, boolean>();

  /** Hard defaults — all flags default to false unless specified here. */
  private readonly hardDefaults = new Map<string, boolean>([
    // Infrastructure flags — safe to enable by default
    [FeatureFlag.STRUCTURED_LOGGING, false],
    [FeatureFlag.HEALTH_DETAILED_PUBLIC, false],
    [FeatureFlag.EVENT_BUS_DEBUG, false],

    // Sprint 003 — Customer Journey V2 flags (off by default)
    [FeatureFlag.CUSTOMER_JOURNEY_V2,  false],
    [FeatureFlag.DASHBOARD_V2,         false],

    // All V4 product flags off by default — activated via env or override
    [FeatureFlag.HOME_V4,              false],
    [FeatureFlag.PRICING_V4,           false],
    [FeatureFlag.SOLUTION_FINDER,      false],
    [FeatureFlag.ORDER_V4,             false],
    [FeatureFlag.MOYASAR_PAYMENTS,     false],
    [FeatureFlag.PROJECT_DASHBOARD_V4, false],
    [FeatureFlag.DELIVERY_ACCEPTANCE,  false],
    [FeatureFlag.NPS_REVIEWS,          false],
    [FeatureFlag.LOYALTY_PROGRAMME,    false],
  ]);

  constructor(env: Record<string, string | undefined> = process.env) {
    this._loadFromEnv(env);
  }

  // ── Evaluation ───────────────────────────────────────────────────────────

  /**
   * Check whether a feature flag is enabled.
   *
   * @param flag     Flag name (use FeatureFlag.* constants).
   * @param context  Optional user/request context for contextual flags.
   */
  isEnabled(flag: string, context?: FlagContext): boolean {
    // 1. Runtime overrides (highest priority)
    const runtimeResult = this._evaluateOverrides(flag, context);
    if (runtimeResult !== undefined) return runtimeResult;

    // 2. Environment variable
    if (this.envValues.has(flag)) {
      return this.envValues.get(flag)!;
    }

    // 3. Hard default (always false for unknown flags)
    return this.hardDefaults.get(flag) ?? false;
  }

  // ── Override management ───────────────────────────────────────────────────

  /**
   * Set a global runtime override for a flag.
   * Takes effect immediately for all subsequent calls.
   */
  override(flag: string, enabled: boolean, options: {
    context?:   Partial<FlagContext>;
    expiresAt?: Date;
  } = {}): void {
    const list = this.overrides.get(flag) ?? [];
    list.unshift({ enabled, ...options }); // prepend — newest override wins
    this.overrides.set(flag, list);
  }

  /**
   * Remove all runtime overrides for a flag.
   * Falls back to env value or hard default.
   */
  clearOverride(flag: string): void {
    this.overrides.delete(flag);
  }

  /**
   * Remove all expired overrides across all flags.
   * Safe to call on a cron schedule.
   */
  pruneExpired(): void {
    const now = new Date();
    for (const [flag, list] of this.overrides.entries()) {
      const live = list.filter(o => !o.expiresAt || o.expiresAt > now);
      if (live.length === 0) {
        this.overrides.delete(flag);
      } else {
        this.overrides.set(flag, live);
      }
    }
  }

  // ── Introspection ─────────────────────────────────────────────────────────

  /**
   * Return a snapshot of all known flag states (no context applied).
   * Used by the health endpoint and QAdmin dashboard.
   */
  snapshot(): Record<string, { enabled: boolean; source: "override" | "env" | "default" }> {
    const allFlags = new Set<string>([
      ...this.hardDefaults.keys(),
      ...this.envValues.keys(),
      ...this.overrides.keys(),
    ]);

    const result: Record<string, { enabled: boolean; source: "override" | "env" | "default" }> = {};
    for (const flag of allFlags) {
      const hasOverride = (this.overrides.get(flag)?.length ?? 0) > 0;
      const hasEnv      = this.envValues.has(flag);

      result[flag] = {
        enabled: this.isEnabled(flag),
        source:  hasOverride ? "override" : hasEnv ? "env" : "default",
      };
    }
    return result;
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  private _loadFromEnv(env: Record<string, string | undefined>): void {
    const TRUTHY  = new Set(["true", "1", "yes", "on"]);
    const FALSY   = new Set(["false", "0", "no", "off"]);

    for (const [key, value] of Object.entries(env)) {
      if (!key.startsWith("FEATURE_") || value === undefined) continue;
      const normalised = value.toLowerCase().trim();
      if (TRUTHY.has(normalised)) {
        this.envValues.set(key, true);
      } else if (FALSY.has(normalised)) {
        this.envValues.set(key, false);
      }
    }
  }

  private _evaluateOverrides(flag: string, context?: FlagContext): boolean | undefined {
    const list = this.overrides.get(flag);
    if (!list || list.length === 0) return undefined;

    const now = new Date();
    for (const override of list) {
      // Skip expired overrides
      if (override.expiresAt && override.expiresAt <= now) continue;

      // If no context constraint, apply globally
      if (!override.context) return override.enabled;

      // Context constraint: all specified fields must match
      if (context && this._contextMatches(override.context, context)) {
        return override.enabled;
      }
    }
    return undefined;
  }

  private _contextMatches(constraint: Partial<FlagContext>, ctx: FlagContext): boolean {
    for (const [key, expected] of Object.entries(constraint)) {
      if (ctx[key] !== expected) return false;
    }
    return true;
  }
}
