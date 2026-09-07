// ── QIROX Infrastructure Layer — Public API ───────────────────────────────────
// Sprint 002: Bootstrap · DI · Config · Logging · Feature Flags · EventBus · Health
//
// Single import point for all infrastructure services.
//
// Quick reference:
//   import { initInfrastructure }         from "./infrastructure";   // bootstrap
//   import { container, TOKENS }          from "./infrastructure";   // DI
//   import { FeatureFlag }                from "./infrastructure";   // flags
//   import { type QiroxEventName }        from "./infrastructure";   // events
//   import { type ILogger }               from "./infrastructure";   // logger type
//   import { getContainer, getLogger, getFlags, getEventBus } from "./infrastructure";

// ── Bootstrap ─────────────────────────────────────────────────────────────────
export { initInfrastructure } from "./bootstrap";

// ── DI Container ─────────────────────────────────────────────────────────────
export { container, QiroxContainer } from "./container";
export { TOKENS, type TokenKey }     from "./tokens";

// ── Configuration ─────────────────────────────────────────────────────────────
export {
  loadAllConfigs,
  printConfigReport,
  getModuleConfig,
  type LoadedConfig,
} from "./config-loader";

// ── Logger ────────────────────────────────────────────────────────────────────
export { ConsoleLogger, createLogger } from "./logger-impl";
// Re-export the ILogger interface so callers can type-annotate without
// importing from the inner logger/ directory.
export type { ILogger } from "../logger/ILogger";

// ── Feature Flags ─────────────────────────────────────────────────────────────
export {
  FeatureFlagEngine,
  FeatureFlag,
  type FeatureFlagName,
  type FlagContext,
} from "./feature-flags";

// ── Event Bus ─────────────────────────────────────────────────────────────────
export {
  QiroxEventBus,
  type QiroxEvents,
  type QiroxEventName,
  type EventEnvelope,
  type EventHandler,
} from "./event-bus";

// ── Health Router ─────────────────────────────────────────────────────────────
export { createHealthRouter, type HealthRouterOptions } from "./health";

// ── Convenience accessors ─────────────────────────────────────────────────────
// Resolve commonly needed services from the container without importing TOKENS.
// All throw if bootstrap() was not called first — fail-fast is intentional.

import { container }      from "./container";
import { TOKENS }         from "./tokens";
import type { ILogger }   from "../logger/ILogger";
import type { FeatureFlagEngine as FFE } from "./feature-flags";
import type { QiroxEventBus as QEB }     from "./event-bus";
import type { LoadedConfig }             from "./config-loader";

/** Resolve the root application logger. */
export function getLogger(): ILogger {
  return container.resolve<ILogger>(TOKENS.Logger);
}

/** Resolve the feature flag engine. */
export function getFlags(): FFE {
  return container.resolve<FFE>(TOKENS.FeatureFlags);
}

/** Resolve the event bus. */
export function getEventBus(): QEB {
  return container.resolve<QEB>(TOKENS.EventBus);
}

/** Resolve the loaded configuration. */
export function getConfig(): LoadedConfig {
  return container.resolve<LoadedConfig>(TOKENS.Config);
}

/** Access the DI container directly (use only when the helpers above are insufficient). */
export function getContainer(): typeof container {
  return container;
}
