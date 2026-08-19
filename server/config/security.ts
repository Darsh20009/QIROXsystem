// ── Security Configuration ────────────────────────────────────────────────────
// Session, hashing, rate-limiting, CORS, 2FA, and push-notification security.
//
// Purpose:
//   Centralizes all security-related tunables so they can be audited,
//   documented, and validated in one place.
//
// Usage:
//   import { buildSecurityConfig } from "./config/security";
//   const config = buildSecurityConfig(process.env);
//
// Future migration role:
//   Replaces scattered process.env.SESSION_SECRET, VAPID_* reads.
//   Feeds the DI-injected session middleware and auth service.

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

export interface SessionConfig {
  /** Secret used to sign session cookies. Maps to: SESSION_SECRET */
  secret: string;

  /** Session cookie name. Maps to: SESSION_COOKIE_NAME. Default: "sid" */
  cookieName: string;

  /** Session duration in days. Maps to: SESSION_DAYS. Default: 14 */
  durationDays: number;

  /** Whether cookie is HttpOnly. Default: true */
  httpOnly: boolean;

  /** Cookie SameSite policy. Default: "lax" */
  sameSite: "strict" | "lax" | "none";

  /** Cookie Secure flag (HTTPS only). Auto-true in production. */
  secure: boolean;
}

export interface PasswordConfig {
  /** bcrypt cost factor (log2 rounds). Maps to: BCRYPT_ROUNDS. Default: 12 */
  bcryptRounds: number;

  /** scrypt key length in bytes. Default: 64 */
  scryptKeyLen: number;

  /** Minimum password length enforced at creation. Default: 8 */
  minLength: number;
}

export interface RateLimitConfig {
  /** Window size in minutes. Maps to: RATE_LIMIT_WINDOW_MIN. Default: 15 */
  windowMinutes: number;

  /** Max requests per window per IP. Maps to: RATE_LIMIT_MAX. Default: 200 */
  maxRequests: number;

  /** Stricter limit for auth endpoints. Maps to: AUTH_RATE_LIMIT_MAX. Default: 20 */
  authMaxRequests: number;
}

export interface VapidConfig {
  /** VAPID public key for Web Push. Maps to: VAPID_PUBLIC_KEY */
  publicKey: string;

  /** VAPID private key for Web Push. Maps to: VAPID_PRIVATE_KEY */
  privateKey: string;

  /** Mailto URI for VAPID subject. Maps to: VAPID_SUBJECT */
  subject: string;
}

export interface SecurityConfig {
  session:   SessionConfig;
  password:  PasswordConfig;
  rateLimit: RateLimitConfig;
  vapid:     VapidConfig;

  /** Allowed CORS origins. Maps to: CORS_ORIGINS (comma-separated) */
  corsOrigins: string[];

  /**
   * Sandbox encryption key for sandbox IDE env vars.
   * Maps to: SANDBOX_ENC_KEY
   */
  sandboxEncKey: string;

  /**
   * Internal cron/worker pre-shared secret.
   * Maps to: INTERNAL_CRON_SECRET
   */
  internalCronSecret: string;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const SECURITY_DEFAULTS: Readonly<Partial<SecurityConfig>> = {
  session: {
    secret:       "",
    cookieName:   "sid",
    durationDays: 14,
    httpOnly:     true,
    sameSite:     "lax",
    secure:       false,
  },
  password: {
    bcryptRounds: 12,
    scryptKeyLen: 64,
    minLength:    8,
  },
  rateLimit: {
    windowMinutes:   15,
    maxRequests:     200,
    authMaxRequests: 20,
  },
};

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildSecurityConfig(env: EnvBag = process.env): SecurityConfig {
  const isProd = env.NODE_ENV === "production";

  return {
    session: {
      secret:       env.SESSION_SECRET ?? "",
      cookieName:   env.SESSION_COOKIE_NAME ?? "sid",
      durationDays: envInt(env.SESSION_DAYS, 14),
      httpOnly:     true,
      sameSite:     "lax",
      secure:       isProd,
    },
    password: {
      bcryptRounds: envInt(env.BCRYPT_ROUNDS, 12),
      scryptKeyLen: 64,
      minLength:    envInt(env.PASSWORD_MIN_LENGTH, 8),
    },
    rateLimit: {
      windowMinutes:   envInt(env.RATE_LIMIT_WINDOW_MIN, 15),
      maxRequests:     envInt(env.RATE_LIMIT_MAX, 200),
      authMaxRequests: envInt(env.AUTH_RATE_LIMIT_MAX, 20),
    },
    vapid: {
      publicKey:  env.VAPID_PUBLIC_KEY ?? "",
      privateKey: env.VAPID_PRIVATE_KEY ?? "",
      subject:    env.VAPID_SUBJECT ?? `mailto:noreply@qiroxstudio.online`,
    },
    corsOrigins:        envList(env.CORS_ORIGINS, []),
    sandboxEncKey:      env.SANDBOX_ENC_KEY ?? "",
    internalCronSecret: env.INTERNAL_CRON_SECRET ?? "",
  };
}

// ── Validator ─────────────────────────────────────────────────────────────────

export function validateSecurityConfig(config: SecurityConfig): ConfigValidationResult {
  const issues = [];
  if (!config.session.secret) {
    issues.push({ field: "security.session.secret", message: "SESSION_SECRET must be set", severity: "error" as const });
  } else if (config.session.secret.length < 32) {
    issues.push({ field: "security.session.secret", message: "SESSION_SECRET should be at least 32 characters", severity: "warning" as const });
  }
  if (config.password.bcryptRounds < 10) {
    issues.push({ field: "security.password.bcryptRounds", message: "bcrypt rounds should be at least 10 for production", severity: "warning" as const });
  }
  if (!config.vapid.publicKey || !config.vapid.privateKey) {
    issues.push({ field: "security.vapid", message: "VAPID keys are missing — push notifications will be disabled", severity: "warning" as const });
  }
  return issues.length ? invalidResult("security", issues) : validResult("security");
}

// ── Module ────────────────────────────────────────────────────────────────────

export const securityConfigModule: ConfigModule<SecurityConfig> = {
  moduleName: "security",
  defaults:   SECURITY_DEFAULTS,
  build:      buildSecurityConfig,
  validate:   validateSecurityConfig,
};
