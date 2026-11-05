// ── Application Bootstrap ─────────────────────────────────────────────────────
// Wires all Sprint 002 infrastructure components in dependency order:
//
//   1. Config Loader     — validates all env config modules
//   2. Logger            — concrete ConsoleLogger registered in container
//   3. Feature Flags     — FeatureFlagEngine loaded from env
//   4. Event Bus         — QiroxEventBus registered in container
//   5. Health Router     — Express router mounted at /health/*
//
// Idempotent: safe to call multiple times — subsequent calls return the
// already-initialised container without re-running setup.
//
// Usage (in server/index.ts, inside the async startup IIFE):
//   import { initInfrastructure } from "./infrastructure";
//   await initInfrastructure(app);

import type { Express } from "express";
import { container }         from "./container";
import { TOKENS }            from "./tokens";
import { loadAllConfigs, printConfigReport } from "./config-loader";
import { createLogger }      from "./logger-impl";
import { FeatureFlagEngine, FeatureFlag } from "./feature-flags";
import { QiroxEventBus }     from "./event-bus";
import { createHealthRouter } from "./health";
import { LogLevel, parseLoglevel } from "../logger/levels";

// ── Bootstrap state ───────────────────────────────────────────────────────────

let _initialised = false;

// ── initInfrastructure ────────────────────────────────────────────────────────

/**
 * Initialise the QIROX infrastructure layer.
 *
 * @param app   Express application instance — health router is mounted here.
 * @returns     The populated DI container (also accessible via getContainer()).
 */
export async function initInfrastructure(app: Express): Promise<typeof container> {
  if (_initialised) {
    return container;
  }

  const startMs = Date.now();
  console.log("[Bootstrap] Starting QIROX infrastructure layer...");

  // ── Step 1: Configuration Loader ─────────────────────────────────────────
  const config = loadAllConfigs(process.env);
  printConfigReport(config);
  container.register(TOKENS.Config, config);

  // ── Step 2: Logger ───────────────────────────────────────────────────────
  // Determine log level from env — fallback INFO
  const logLevel  = parseLoglevel(process.env.LOG_LEVEL);
  const logJson   = process.env.NODE_ENV === "production";
  const logger    = createLogger({ minLevel: logLevel, json: logJson, service: "qirox-server" });
  container.register(TOKENS.Logger, logger);

  logger.info("Logger initialised", { data: {
    level:      LogLevel[logLevel] ?? logLevel,
    format:     logJson ? "json" : "text",
  }});

  // ── Step 3: Feature Flag Engine ──────────────────────────────────────────
  const flags = new FeatureFlagEngine(process.env);
  container.register(TOKENS.FeatureFlags, flags);

  const flagSnapshot = flags.snapshot();
  const enabledFlags = Object.entries(flagSnapshot)
    .filter(([, v]) => v.enabled)
    .map(([k]) => k);

  logger.info("Feature flags loaded", { data: {
    total:   Object.keys(flagSnapshot).length,
    enabled: enabledFlags.length,
    flags:   enabledFlags.length > 0 ? enabledFlags : "(none)",
  }});

  // ── Step 4: Event Bus ────────────────────────────────────────────────────
  const eventBus = new QiroxEventBus();

  // Enable debug mode if the flag is on
  if (flags.isEnabled(FeatureFlag.EVENT_BUS_DEBUG)) {
    eventBus.setDebug(true);
    logger.debug("Event bus debug mode enabled");
  }

  container.register(TOKENS.EventBus, eventBus);
  logger.info("Event bus initialised");

  // ── Step 5: Health Router ────────────────────────────────────────────────
  // Mount at /health/* — distinct from existing /api/health
  const healthRouter = createHealthRouter({
    buildId:        process.env.BUILD_ID,
    flags,
    detailedPublic: flags.isEnabled(FeatureFlag.HEALTH_DETAILED_PUBLIC),
    detailedSecret: process.env.INTERNAL_HEALTH_SECRET,
  });
  app.use("/health", healthRouter);
  logger.info("Health endpoints mounted", { data: {
    routes: ["/health/live", "/health/ready", "/health/detailed"],
  }});

  // ── Step 6: System ready event ───────────────────────────────────────────
  eventBus.emit("system.ready", {
    startedAt: new Date(),
    buildId:   process.env.BUILD_ID,
  });

  // ── Done ──────────────────────────────────────────────────────────────────
  _initialised = true;
  const elapsed = Date.now() - startMs;
  logger.info(`Bootstrap complete in ${elapsed}ms`, { data: {
    services:       container.size,
    configModules:  config.validation.length,
    configOk:       config.ok,
  }});

  if (!config.ok) {
    logger.warn("Configuration has errors — some features may be degraded", {
      data: { errors: config.errors },
    });
  }

  return container;
}

// ── Convenience accessors ─────────────────────────────────────────────────────
// Import these in any server module that needs infrastructure services
// without importing the full bootstrap module.

export { container, TOKENS };
