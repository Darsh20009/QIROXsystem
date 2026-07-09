// ── Google Configuration ──────────────────────────────────────────────────────
// Google OAuth (Sign in with Google) and Google Sheets integration settings.
//
// Purpose:
//   Centralizes all Google platform credentials for OAuth strategy and
//   the Google Sheets connector used for data sync.
//
// Usage:
//   import { buildGoogleConfig } from "./config/google";
//   const config = buildGoogleConfig(process.env);
//
// Future migration role:
//   Feeds the Passport Google strategy constructor and the Google Sheets
//   service so both receive typed config from the DI container.

import {
  type EnvBag,
  type ConfigModule,
  type ConfigValidationResult,
  validResult,
  invalidResult,
} from "./types";

// ── Interface ─────────────────────────────────────────────────────────────────

export interface GoogleOAuthConfig {
  /** Google OAuth client ID. Maps to: GOOGLE_CLIENT_ID */
  clientId: string;

  /** Google OAuth client secret. Maps to: GOOGLE_CLIENT_SECRET */
  clientSecret: string;

  /** OAuth callback URL. Maps to: GOOGLE_CALLBACK_URL */
  callbackUrl: string;

  /** Whether Google OAuth is enabled. */
  enabled: boolean;
}

export interface GoogleSheetsConfig {
  /**
   * Service account JSON key (stringified).
   * Maps to: GOOGLE_SERVICE_ACCOUNT_JSON
   */
  serviceAccountJson?: string;

  /**
   * OAuth2 access token (for user-delegated access).
   * Maps to: GOOGLE_SHEETS_ACCESS_TOKEN
   */
  accessToken?: string;

  /**
   * OAuth2 refresh token.
   * Maps to: GOOGLE_SHEETS_REFRESH_TOKEN
   */
  refreshToken?: string;

  /** Whether the Sheets integration is enabled. */
  enabled: boolean;
}

export interface GoogleConfig {
  oauth:  GoogleOAuthConfig;
  sheets: GoogleSheetsConfig;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const GOOGLE_DEFAULTS: Readonly<Partial<GoogleConfig>> = {
  oauth: {
    clientId:     "",
    clientSecret: "",
    callbackUrl:  "",
    enabled:      false,
  },
  sheets: {
    enabled: false,
  },
};

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildGoogleConfig(env: EnvBag = process.env): GoogleConfig {
  const clientId     = env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = env.GOOGLE_CLIENT_SECRET ?? "";
  const saJson       = env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const accessToken  = env.GOOGLE_SHEETS_ACCESS_TOKEN;
  const refreshToken = env.GOOGLE_SHEETS_REFRESH_TOKEN;

  return {
    oauth: {
      clientId,
      clientSecret,
      callbackUrl: env.GOOGLE_CALLBACK_URL ?? "",
      enabled:     Boolean(clientId && clientSecret),
    },
    sheets: {
      ...(saJson        ? { serviceAccountJson: saJson }        : {}),
      ...(accessToken   ? { accessToken }                       : {}),
      ...(refreshToken  ? { refreshToken }                      : {}),
      enabled: Boolean(saJson || (accessToken && refreshToken)),
    },
  };
}

// ── Validator ─────────────────────────────────────────────────────────────────

export function validateGoogleConfig(config: GoogleConfig): ConfigValidationResult {
  const issues = [];
  if (!config.oauth.enabled) {
    issues.push({ field: "google.oauth", message: "Google OAuth credentials not set — Sign in with Google will be disabled", severity: "warning" as const });
  } else if (!config.oauth.callbackUrl) {
    issues.push({ field: "google.oauth.callbackUrl", message: "GOOGLE_CALLBACK_URL is required for Google OAuth", severity: "error" as const });
  }
  if (!config.sheets.enabled) {
    issues.push({ field: "google.sheets", message: "Google Sheets credentials not set — data sync will be unavailable", severity: "warning" as const });
  }
  return issues.length ? invalidResult("google", issues) : validResult("google");
}

// ── Module ────────────────────────────────────────────────────────────────────

export const googleConfigModule: ConfigModule<GoogleConfig> = {
  moduleName: "google",
  defaults:   GOOGLE_DEFAULTS,
  build:      buildGoogleConfig,
  validate:   validateGoogleConfig,
};
