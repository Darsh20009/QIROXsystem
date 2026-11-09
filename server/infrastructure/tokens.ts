// ── DI Injection Tokens ───────────────────────────────────────────────────────
// Every service registered in the container has a unique Symbol token.
// Using symbols prevents accidental string collisions across modules.
//
// Usage:
//   import { TOKENS } from "./tokens";
//   const logger = container.resolve<ILogger>(TOKENS.Logger);

export const TOKENS = {
  /** Structured logger — ILogger implementation. */
  Logger: Symbol("Logger"),

  /** Loaded and validated application configuration. */
  Config: Symbol("Config"),

  /** Feature flag engine — FeatureFlagEngine instance. */
  FeatureFlags: Symbol("FeatureFlags"),

  /** In-process typed event bus — QiroxEventBus instance. */
  EventBus: Symbol("EventBus"),
} as const;

export type TokenKey = keyof typeof TOKENS;
