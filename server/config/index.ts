// ── Configuration Foundation — Public API ─────────────────────────────────────
// Single import point for all configuration modules.
//
// Import guide:
//   import { buildAppConfig, AppConfig }         from "./config";
//   import { buildDatabaseConfig, DatabaseConfig } from "./config";
//   import { buildSecurityConfig }                from "./config";
//   import { ConfigModule, ConfigValidationResult } from "./config";
//
// Instantiation pattern (future DI container, Migration 006+):
//   const allModules = getAllConfigModules();
//   const configs    = allModules.map(m => m.build(process.env));
//   const results    = allModules.map((m, i) => m.validate(configs[i]));
//   // Abort if any results contain errors.

// ── Shared types ──────────────────────────────────────────────────────────────
export type {
  EnvBag,
  ConfigIssue,
  ConfigValidationResult,
  ConfigModule,
} from "./types";
export {
  envInt,
  envBool,
  envList,
  validResult,
  invalidResult,
} from "./types";

// ── Application ───────────────────────────────────────────────────────────────
export { buildAppConfig, validateAppConfig, appConfigModule, APP_DEFAULTS } from "./app";
export type { AppConfig } from "./app";

// ── Database ──────────────────────────────────────────────────────────────────
export { buildDatabaseConfig, validateDatabaseConfig, databaseConfigModule, DATABASE_DEFAULTS } from "./database";
export type { DatabaseConfig, MongoConnectionConfig } from "./database";

// ── Mail ──────────────────────────────────────────────────────────────────────
export { buildMailConfig, validateMailConfig, mailConfigModule, MAIL_DEFAULTS } from "./mail";
export type { MailConfig, SmtpConfig, EmailBrandingConfig } from "./mail";

// ── Storage ───────────────────────────────────────────────────────────────────
export { buildStorageConfig, validateStorageConfig, storageConfigModule, STORAGE_DEFAULTS } from "./storage";
export type { StorageConfig } from "./storage";

// ── Security ──────────────────────────────────────────────────────────────────
export { buildSecurityConfig, validateSecurityConfig, securityConfigModule, SECURITY_DEFAULTS } from "./security";
export type { SecurityConfig, SessionConfig, PasswordConfig, RateLimitConfig, VapidConfig } from "./security";

// ── SEO ───────────────────────────────────────────────────────────────────────
export { buildSeoConfig, validateSeoConfig, seoConfigModule, SEO_DEFAULTS } from "./seo";
export type { SeoConfig } from "./seo";

// ── Payments ──────────────────────────────────────────────────────────────────
export { buildPaymentsConfig, validatePaymentsConfig, paymentsConfigModule, PAYMENTS_DEFAULTS } from "./payments";
export type { PaymentsConfig, PaypalConfig, PaymobConfig } from "./payments";

// ── AI ────────────────────────────────────────────────────────────────────────
export { buildAiConfig, validateAiConfig, aiConfigModule, AI_DEFAULTS } from "./ai";
export type { AiConfig, AiProvider, OpenAiConfig, MoonshotConfig } from "./ai";

// ── Apple ─────────────────────────────────────────────────────────────────────
export { buildAppleConfig, validateAppleConfig, appleConfigModule, APPLE_DEFAULTS } from "./apple";
export type { AppleConfig, AppleOAuthConfig, AppStoreConfig } from "./apple";

// ── Google ────────────────────────────────────────────────────────────────────
export { buildGoogleConfig, validateGoogleConfig, googleConfigModule, GOOGLE_DEFAULTS } from "./google";
export type { GoogleConfig, GoogleOAuthConfig, GoogleSheetsConfig } from "./google";

// ── Monitoring ────────────────────────────────────────────────────────────────
export { buildMonitoringConfig, validateMonitoringConfig, monitoringConfigModule, MONITORING_DEFAULTS } from "./monitoring";
export type { MonitoringConfig, LoggingConfig, HealthCheckConfig, PerformanceThresholdsConfig } from "./monitoring";

// ── Convenience: all modules in one array ────────────────────────────────────
import { appConfigModule }        from "./app";
import { databaseConfigModule }   from "./database";
import { mailConfigModule }       from "./mail";
import { storageConfigModule }    from "./storage";
import { securityConfigModule }   from "./security";
import { seoConfigModule }        from "./seo";
import { paymentsConfigModule }   from "./payments";
import { aiConfigModule }         from "./ai";
import { appleConfigModule }      from "./apple";
import { googleConfigModule }     from "./google";
import { monitoringConfigModule } from "./monitoring";

/**
 * Returns all registered configuration modules in dependency order.
 * Used by the future DI container to build and validate all configs at startup.
 *
 * Usage (Migration 006+):
 *   const modules = getAllConfigModules();
 *   for (const mod of modules) {
 *     const config = mod.build(process.env);
 *     const result = mod.validate(config);
 *     if (!result.valid) { ... handle errors ... }
 *   }
 */
export function getAllConfigModules() {
  return [
    appConfigModule,
    databaseConfigModule,
    securityConfigModule,
    mailConfigModule,
    storageConfigModule,
    seoConfigModule,
    paymentsConfigModule,
    aiConfigModule,
    appleConfigModule,
    googleConfigModule,
    monitoringConfigModule,
  ] as const;
}
