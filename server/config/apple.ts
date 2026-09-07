// ── Apple Configuration ───────────────────────────────────────────────────────
// Apple OAuth (Sign in with Apple) and App Store link settings.
//
// Purpose:
//   Centralizes all Apple platform credentials used by Passport Apple strategy
//   and the App Store download link exposed via /api/app-downloads.
//
// Usage:
//   import { buildAppleConfig } from "./config/apple";
//   const config = buildAppleConfig(process.env);
//
// Future migration role:
//   Feeds the Passport Apple strategy constructor so credentials are
//   injected rather than read inline from process.env.

import {
  type EnvBag,
  type ConfigModule,
  type ConfigValidationResult,
  envBool,
  validResult,
  invalidResult,
} from "./types";

// ── Interface ─────────────────────────────────────────────────────────────────

export interface AppleOAuthConfig {
  /** Apple Services ID (OAuth client ID). Maps to: APPLE_CLIENT_ID */
  clientId: string;

  /** Apple Team ID (10-char uppercase). Maps to: APPLE_TEAM_ID */
  teamId: string;

  /** Apple Key ID for the private key. Maps to: APPLE_KEY_ID */
  keyId: string;

  /**
   * P8 private key contents (PEM string).
   * Maps to: APPLE_PRIVATE_KEY (newlines may be escaped as \n in env).
   */
  privateKey: string;

  /** OAuth callback URL. Maps to: APPLE_CALLBACK_URL */
  callbackUrl: string;

  /** Whether Sign in with Apple is enabled. */
  enabled: boolean;
}

export interface AppStoreConfig {
  /** App Store product URL. Maps to: APP_STORE_URL */
  url: string;

  /** Whether the App Store link is publicly shown. Maps to: APP_STORE_ENABLED */
  enabled: boolean;
}

export interface AppleConfig {
  oauth:    AppleOAuthConfig;
  appStore: AppStoreConfig;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const APPLE_DEFAULTS: Readonly<Partial<AppleConfig>> = {
  oauth: {
    clientId:    "",
    teamId:      "",
    keyId:       "",
    privateKey:  "",
    callbackUrl: "",
    enabled:     false,
  },
  appStore: {
    url:     "",
    enabled: false,
  },
};

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildAppleConfig(env: EnvBag = process.env): AppleConfig {
  const clientId   = env.APPLE_CLIENT_ID ?? "";
  const teamId     = env.APPLE_TEAM_ID ?? "";
  const keyId      = env.APPLE_KEY_ID ?? "";
  // Allow \n-escaped private keys from env secrets.
  const privateKey = (env.APPLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

  return {
    oauth: {
      clientId,
      teamId,
      keyId,
      privateKey,
      callbackUrl: env.APPLE_CALLBACK_URL ?? "",
      enabled: Boolean(clientId && teamId && keyId && privateKey),
    },
    appStore: {
      url:     env.APP_STORE_URL ?? "",
      enabled: envBool(env.APP_STORE_ENABLED, false),
    },
  };
}

// ── Validator ─────────────────────────────────────────────────────────────────

export function validateAppleConfig(config: AppleConfig): ConfigValidationResult {
  const issues = [];
  if (!config.oauth.enabled) {
    issues.push({ field: "apple.oauth", message: "Apple OAuth credentials not set — Sign in with Apple will be disabled", severity: "warning" as const });
  } else {
    if (config.oauth.teamId.length !== 10) {
      issues.push({ field: "apple.oauth.teamId", message: "Apple Team ID should be exactly 10 characters", severity: "warning" as const });
    }
    if (!config.oauth.callbackUrl) {
      issues.push({ field: "apple.oauth.callbackUrl", message: "APPLE_CALLBACK_URL is required for Sign in with Apple", severity: "error" as const });
    }
  }
  return issues.length ? invalidResult("apple", issues) : validResult("apple");
}

// ── Module ────────────────────────────────────────────────────────────────────

export const appleConfigModule: ConfigModule<AppleConfig> = {
  moduleName: "apple",
  defaults:   APPLE_DEFAULTS,
  build:      buildAppleConfig,
  validate:   validateAppleConfig,
};
