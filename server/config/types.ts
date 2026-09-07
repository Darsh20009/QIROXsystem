// ── Shared Configuration Types ────────────────────────────────────────────────
// Foundation types used by every configuration module.
//
// Purpose:
//   Provides a consistent shape for configuration objects, validation results,
//   and the factory function signature pattern used across all config modules.
//
// Usage:
//   All config modules extend ConfigModule<T> and implement buildXConfig().
//
// Future migration role:
//   A future DI container (Migration 006+) will call every buildXConfig()
//   at startup, collect ConfigValidationResult[], and abort if any are invalid.

// ── Environment source ────────────────────────────────────────────────────────

/**
 * The environment variable bag.
 * Using this type instead of `typeof process.env` allows tests to inject
 * a plain object instead of mutating the real process environment.
 */
export type EnvBag = Record<string, string | undefined>;

// ── Validation ────────────────────────────────────────────────────────────────

/** A single field-level validation issue within a configuration module. */
export interface ConfigIssue {
  /** Dot-path to the offending field (e.g. "database.uri"). */
  field: string;
  /** Human-readable description of what is wrong or missing. */
  message: string;
  /** Severity: missing required value vs. suspicious but non-fatal value. */
  severity: "error" | "warning";
}

/**
 * Result of validating a single configuration module.
 * Future startup code collects these and logs/aborts as appropriate.
 */
export interface ConfigValidationResult {
  /** Which configuration module produced this result. */
  module: string;
  /** True when no errors are present (warnings are allowed). */
  valid: boolean;
  /** All issues found during validation. */
  issues: ConfigIssue[];
}

// ── Module contract ───────────────────────────────────────────────────────────

/**
 * Every configuration module must satisfy this contract:
 *   - T is the typed configuration interface.
 *   - `build(env)` reads from the provided EnvBag and returns a T.
 *   - `validate(config)` inspects the built T and returns validation results.
 *   - `defaults` provides the baseline values before env overrides.
 *
 * Usage:
 *   const mod: ConfigModule<DatabaseConfig> = { build, validate, defaults };
 *   const config = mod.build(process.env);
 *   const result = mod.validate(config);
 */
export interface ConfigModule<T> {
  /** Human-readable module name (used in validation reports). */
  readonly moduleName: string;
  /** Baseline values before environment variables are applied. */
  readonly defaults: Readonly<Partial<T>>;
  /** Build a fully typed config object from an environment variable bag. */
  build(env: EnvBag): T;
  /** Validate a built config object and return any issues found. */
  validate(config: T): ConfigValidationResult;
}

// ── Helper utilities ──────────────────────────────────────────────────────────

/**
 * Parse an integer from an env string with a fallback.
 * Returns `fallback` when the value is absent or not a valid integer.
 */
export function envInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value === "") return fallback;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Parse a boolean from an env string.
 * Treats "true", "1", "yes", "on" (case-insensitive) as true.
 * All other values (including absent) return `fallback`.
 */
export function envBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  return ["true", "1", "yes", "on"].includes(value.toLowerCase());
}

/**
 * Split a comma-separated env string into a trimmed string array.
 * Returns `fallback` when the value is absent or empty.
 */
export function envList(value: string | undefined, fallback: string[]): string[] {
  if (value === undefined || value.trim() === "") return fallback;
  return value.split(",").map(s => s.trim()).filter(Boolean);
}

/**
 * Build a ConfigValidationResult with no issues (convenience).
 */
export function validResult(module: string): ConfigValidationResult {
  return { module, valid: true, issues: [] };
}

/**
 * Build a ConfigValidationResult with one or more issues.
 */
export function invalidResult(
  module: string,
  issues: ConfigIssue[],
): ConfigValidationResult {
  const hasErrors = issues.some(i => i.severity === "error");
  return { module, valid: !hasErrors, issues };
}
