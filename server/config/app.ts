// ── Application Configuration ─────────────────────────────────────────────────
// Core runtime settings that don't belong to a specific subsystem.
//
// Purpose:
//   Centralizes app identity, server binding, CORS origins, and feature flags.
//
// Usage:
//   import { buildAppConfig } from "./config/app";
//   const config = buildAppConfig(process.env);
//
// Future migration role:
//   Replaces scattered process.env.PORT / process.env.NODE_ENV reads
//   once the DI container is in place (Migration 006+).

import {
  type EnvBag,
  type ConfigModule,
  type ConfigValidationResult,
  envInt,
  envBool,
  envList,
  validResult,
  invalidResult,
} from "./types";

// ── Interface ─────────────────────────────────────────────────────────────────

export interface AppConfig {
  /** Server bind port. Defaults to 5000. Maps to: PORT */
  port: number;

  /** Server bind host. Defaults to "0.0.0.0". Maps to: HOST */
  host: string;

  /** Runtime environment. Maps to: NODE_ENV */
  nodeEnv: "development" | "production" | "test";

  /** Public-facing application name. Maps to: APP_NAME */
  appName: string;

  /** Canonical public URL (no trailing slash). Maps to: APP_URL / EMAIL_SITE_URL */
  appUrl: string;

  /** Application version string. Maps to: APP_VERSION */
  version: string;

  /**
   * Allowed CORS origins (comma-separated in env).
   * Maps to: CORS_ORIGINS
   */
  corsOrigins: string[];

  /**
   * Whether to trust reverse-proxy headers (X-Forwarded-For, etc.).
   * Set true when running behind Nginx / Replit proxy. Maps to: TRUST_PROXY
   */
  trustProxy: boolean;

  /**
   * Max request body size (JSON). Maps to: BODY_LIMIT
   * Defaults to "50mb".
   */
  bodyLimit: string;

  /**
   * Whether DevTools detection and right-click blocking are active.
   * Always false in development. Maps to: DEVTOOLS_BLOCK
   */
  devToolsBlock: boolean;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const APP_DEFAULTS: Readonly<Partial<AppConfig>> = {
  port:          5000,
  host:          "0.0.0.0",
  nodeEnv:       "development",
  appName:       "Qirox Studio",
  appUrl:        "https://qiroxstudio.online",
  version:       "1.0.0",
  corsOrigins:   [],
  trustProxy:    true,
  bodyLimit:     "50mb",
  devToolsBlock: false,
};

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildAppConfig(env: EnvBag = process.env): AppConfig {
  const nodeEnv = (env.NODE_ENV ?? "development") as AppConfig["nodeEnv"];
  return {
    port:          envInt(env.PORT, 5000),
    host:          env.HOST ?? "0.0.0.0",
    nodeEnv,
    appName:       env.APP_NAME ?? "Qirox Studio",
    appUrl:        env.APP_URL ?? env.EMAIL_SITE_URL ?? "https://qiroxstudio.online",
    version:       env.APP_VERSION ?? "1.0.0",
    corsOrigins:   envList(env.CORS_ORIGINS, []),
    trustProxy:    envBool(env.TRUST_PROXY, true),
    bodyLimit:     env.BODY_LIMIT ?? "50mb",
    devToolsBlock: nodeEnv === "production" && envBool(env.DEVTOOLS_BLOCK, true),
  };
}

// ── Validator ─────────────────────────────────────────────────────────────────

export function validateAppConfig(config: AppConfig): ConfigValidationResult {
  const issues = [];
  if (config.port < 1 || config.port > 65535) {
    issues.push({ field: "app.port", message: "Port must be between 1 and 65535", severity: "error" as const });
  }
  if (!config.appUrl.startsWith("http")) {
    issues.push({ field: "app.appUrl", message: "appUrl must be an absolute HTTP/HTTPS URL", severity: "warning" as const });
  }
  return issues.length ? invalidResult("app", issues) : validResult("app");
}

// ── Module ────────────────────────────────────────────────────────────────────

export const appConfigModule: ConfigModule<AppConfig> = {
  moduleName: "app",
  defaults:   APP_DEFAULTS,
  build:      buildAppConfig,
  validate:   validateAppConfig,
};
