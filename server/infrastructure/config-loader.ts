// ── Configuration Loader ──────────────────────────────────────────────────────
// Runs every ConfigModule against the live environment at startup.
// Collects validation results and surfaces errors/warnings to the console
// before the structured logger is available.
//
// Usage:
//   const result = loadAllConfigs(process.env);
//   if (!result.ok) process.exit(1); // hard fail on missing required config
//
// The returned LoadedConfig is stored in the DI container under TOKENS.Config.

import {
  getAllConfigModules,
  type ConfigValidationResult,
  type EnvBag,
} from "../config/index";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LoadedConfig {
  /** Each module's built config, keyed by module name. */
  readonly values: Readonly<Record<string, unknown>>;

  /** Validation results, one per module. */
  readonly validation: ReadonlyArray<ConfigValidationResult>;

  /** True when all modules passed validation (no error-severity issues). */
  readonly ok: boolean;

  /** All error-severity issues across all modules. */
  readonly errors: ReadonlyArray<{ module: string; field: string; message: string }>;

  /** All warning-severity issues across all modules. */
  readonly warnings: ReadonlyArray<{ module: string; field: string; message: string }>;
}

// ── Loader ────────────────────────────────────────────────────────────────────

/**
 * Build and validate every registered ConfigModule.
 *
 * @param env  Environment variable bag (pass process.env in production,
 *             a plain object in tests).
 */
export function loadAllConfigs(env: EnvBag = process.env): LoadedConfig {
  const modules = getAllConfigModules();
  const values: Record<string, unknown> = {};
  const validation: ConfigValidationResult[] = [];

  for (const mod of modules) {
    try {
      const built = mod.build(env);
      const result = mod.validate(built);
      values[mod.moduleName] = built;
      validation.push(result);
    } catch (err: unknown) {
      // A module that throws during build is a fatal configuration error.
      const message = err instanceof Error ? err.message : String(err);
      values[mod.moduleName] = null;
      validation.push({
        module: mod.moduleName,
        valid: false,
        issues: [{ field: "_build", message, severity: "error" }],
      });
    }
  }

  const errors = validation.flatMap(r =>
    r.issues
      .filter(i => i.severity === "error")
      .map(i => ({ module: r.module, field: i.field, message: i.message }))
  );

  const warnings = validation.flatMap(r =>
    r.issues
      .filter(i => i.severity === "warning")
      .map(i => ({ module: r.module, field: i.field, message: i.message }))
  );

  return {
    values: Object.freeze(values),
    validation: Object.freeze(validation),
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
  };
}

/**
 * Print a startup configuration report to the console.
 * Called before the structured logger is ready — uses console directly.
 */
export function printConfigReport(config: LoadedConfig): void {
  const prefix = "[Config]";

  if (config.ok) {
    const warnCount = config.warnings.length;
    const modCount  = config.validation.length;
    console.log(
      `${prefix} ✅ ${modCount} modules loaded` +
      (warnCount > 0 ? ` · ${warnCount} warning(s)` : "")
    );
  } else {
    console.error(`${prefix} ❌ Configuration errors found:`);
    for (const e of config.errors) {
      console.error(`  ${prefix} [${e.module}] ${e.field}: ${e.message}`);
    }
  }

  if (config.warnings.length > 0) {
    for (const w of config.warnings) {
      console.warn(`${prefix} ⚠️  [${w.module}] ${w.field}: ${w.message}`);
    }
  }
}

/**
 * Retrieve a typed config value for a specific module from LoadedConfig.
 * Throws if the module was not loaded (i.e. it was not in getAllConfigModules).
 */
export function getModuleConfig<T>(config: LoadedConfig, moduleName: string): T {
  if (!(moduleName in config.values)) {
    throw new Error(`[Config] Module "${moduleName}" was not loaded.`);
  }
  return config.values[moduleName] as T;
}
