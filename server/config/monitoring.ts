// ── Monitoring Configuration ──────────────────────────────────────────────────
// Logging levels, health-check settings, and performance thresholds.
//
// Purpose:
//   Centralizes all observability tunables so the logging foundation
//   (Migration 004) and future metrics system (Migration 006+) read from
//   one typed source rather than scattered process.env reads.
//
// Usage:
//   import { buildMonitoringConfig } from "./config/monitoring";
//   const config = buildMonitoringConfig(process.env);
//
// Future migration role:
//   The DI container injects MonitoringConfig into the logger factory and
//   the health-check route, wiring the logger foundation to actual transports.

import {
  type EnvBag,
  type ConfigModule,
  type ConfigValidationResult,
  envInt,
  envBool,
  validResult,
  invalidResult,
} from "./types";
import { LogLevel, parseLoglevel } from "../logger/levels";

// ── Interface ─────────────────────────────────────────────────────────────────

export interface LoggingConfig {
  /**
   * Minimum log level emitted to the console transport.
   * Maps to: LOG_LEVEL. Default: "INFO" in production, "DEBUG" in development.
   */
  level: LogLevel;

  /**
   * Whether to emit structured JSON logs (production) or human-readable text.
   * Maps to: LOG_JSON. Default: true in production.
   */
  json: boolean;

  /**
   * Whether to include colour codes in console output (development only).
   * Maps to: LOG_COLOR. Default: true in development.
   */
  color: boolean;

  /**
   * Whether audit logs are written to a separate file.
   * Maps to: LOG_AUDIT_FILE. Default: false.
   */
  auditFile: boolean;

  /**
   * Directory for audit log files when auditFile is true.
   * Maps to: LOG_AUDIT_DIR. Default: "logs/audit"
   */
  auditDir: string;
}

export interface HealthCheckConfig {
  /**
   * Whether the /api/health endpoint is publicly accessible.
   * Maps to: HEALTH_PUBLIC. Default: true.
   */
  public: boolean;

  /**
   * Whether the health check includes detailed subsystem statuses.
   * Maps to: HEALTH_VERBOSE. Default: false in production.
   */
  verbose: boolean;

  /**
   * Maximum time in ms a subsystem check may take before it's marked degraded.
   * Maps to: HEALTH_TIMEOUT_MS. Default: 3000.
   */
  timeoutMs: number;
}

export interface PerformanceThresholdsConfig {
  /**
   * Slow HTTP request threshold in ms.
   * Requests exceeding this emit a WARN log. Maps to: PERF_SLOW_REQUEST_MS. Default: 1000.
   */
  slowRequestMs: number;

  /**
   * Slow database query threshold in ms.
   * Queries exceeding this emit a WARN log. Maps to: PERF_SLOW_QUERY_MS. Default: 500.
   */
  slowQueryMs: number;

  /**
   * Slow external service call threshold in ms.
   * Maps to: PERF_SLOW_EXTERNAL_MS. Default: 3000.
   */
  slowExternalMs: number;
}

export interface MonitoringConfig {
  logging:              LoggingConfig;
  healthCheck:          HealthCheckConfig;
  performanceThresholds: PerformanceThresholdsConfig;

  /**
   * Whether to expose a /api/metrics endpoint (Prometheus format).
   * Maps to: METRICS_ENABLED. Default: false.
   */
  metricsEnabled: boolean;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const MONITORING_DEFAULTS: Readonly<Partial<MonitoringConfig>> = {
  healthCheck: {
    public:    true,
    verbose:   false,
    timeoutMs: 3_000,
  },
  performanceThresholds: {
    slowRequestMs:  1_000,
    slowQueryMs:    500,
    slowExternalMs: 3_000,
  },
  metricsEnabled: false,
};

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildMonitoringConfig(env: EnvBag = process.env): MonitoringConfig {
  const isProd = env.NODE_ENV === "production";

  return {
    logging: {
      level:     parseLoglevel(env.LOG_LEVEL ?? (isProd ? "INFO" : "DEBUG")),
      json:      envBool(env.LOG_JSON, isProd),
      color:     envBool(env.LOG_COLOR, !isProd),
      auditFile: envBool(env.LOG_AUDIT_FILE, false),
      auditDir:  env.LOG_AUDIT_DIR ?? "logs/audit",
    },
    healthCheck: {
      public:    envBool(env.HEALTH_PUBLIC, true),
      verbose:   envBool(env.HEALTH_VERBOSE, !isProd),
      timeoutMs: envInt(env.HEALTH_TIMEOUT_MS, 3_000),
    },
    performanceThresholds: {
      slowRequestMs:  envInt(env.PERF_SLOW_REQUEST_MS, 1_000),
      slowQueryMs:    envInt(env.PERF_SLOW_QUERY_MS, 500),
      slowExternalMs: envInt(env.PERF_SLOW_EXTERNAL_MS, 3_000),
    },
    metricsEnabled: envBool(env.METRICS_ENABLED, false),
  };
}

// ── Validator ─────────────────────────────────────────────────────────────────

export function validateMonitoringConfig(config: MonitoringConfig): ConfigValidationResult {
  const issues = [];
  if (config.healthCheck.timeoutMs < 100) {
    issues.push({ field: "monitoring.healthCheck.timeoutMs", message: "Health check timeout should be at least 100ms", severity: "warning" as const });
  }
  if (config.performanceThresholds.slowRequestMs < 1) {
    issues.push({ field: "monitoring.performanceThresholds.slowRequestMs", message: "slowRequestMs must be positive", severity: "warning" as const });
  }
  return issues.length ? invalidResult("monitoring", issues) : validResult("monitoring");
}

// ── Module ────────────────────────────────────────────────────────────────────

export const monitoringConfigModule: ConfigModule<MonitoringConfig> = {
  moduleName: "monitoring",
  defaults:   MONITORING_DEFAULTS,
  build:      buildMonitoringConfig,
  validate:   validateMonitoringConfig,
};
