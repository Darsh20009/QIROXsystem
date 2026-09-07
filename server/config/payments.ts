// ── Payments Configuration ────────────────────────────────────────────────────
// PayPal, Paymob, and wallet payment settings.
//
// Purpose:
//   Centralizes payment gateway credentials and environment toggles.
//   Supports graceful degradation when credentials are absent.
//
// Usage:
//   import { buildPaymentsConfig } from "./config/payments";
//   const config = buildPaymentsConfig(process.env);
//
// Future migration role:
//   Feeds the PayPal SDK initializer and Paymob service so they receive
//   typed config rather than reading process.env directly.

import {
  type EnvBag,
  type ConfigModule,
  type ConfigValidationResult,
  envBool,
  validResult,
  invalidResult,
} from "./types";

// ── Interface ─────────────────────────────────────────────────────────────────

export interface PaypalConfig {
  /** PayPal OAuth client ID. Maps to: PAYPAL_CLIENT_ID */
  clientId: string;

  /** PayPal OAuth client secret. Maps to: PAYPAL_CLIENT_SECRET */
  clientSecret: string;

  /**
   * PayPal environment.
   * Maps to: PAYPAL_ENV. Default: "sandbox" in dev, "live" in prod.
   */
  environment: "sandbox" | "live";

  /**
   * Whether PayPal is functionally enabled.
   * Automatically false when clientId/secret are absent.
   */
  enabled: boolean;
}

export interface PaymobConfig {
  /** Paymob API key. Maps to: PAYMOB_API_KEY */
  apiKey: string;

  /** Paymob merchant integration ID. Maps to: PAYMOB_INTEGRATION_ID */
  integrationId: string;

  /** Paymob HMAC secret for webhook verification. Maps to: PAYMOB_HMAC_SECRET */
  hmacSecret: string;

  /** Whether Paymob integration is enabled. */
  enabled: boolean;
}

export interface PaymentsConfig {
  paypal:  PaypalConfig;
  paymob:  PaymobConfig;

  /**
   * Default currency code for all transactions.
   * Maps to: DEFAULT_CURRENCY. Default: "SAR"
   */
  defaultCurrency: string;

  /**
   * Whether the wallet subsystem (Qirox Pay) is active.
   * Maps to: WALLET_ENABLED. Default: true
   */
  walletEnabled: boolean;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const PAYMENTS_DEFAULTS: Readonly<Partial<PaymentsConfig>> = {
  defaultCurrency: "SAR",
  walletEnabled:   true,
};

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildPaymentsConfig(env: EnvBag = process.env): PaymentsConfig {
  const isProd          = env.NODE_ENV === "production";
  const paypalClientId  = env.PAYPAL_CLIENT_ID ?? "";
  const paypalSecret    = env.PAYPAL_CLIENT_SECRET ?? "";
  const paypalEnvRaw    = env.PAYPAL_ENV ?? (isProd ? "live" : "sandbox");
  const paymobKey       = env.PAYMOB_API_KEY ?? "";

  return {
    paypal: {
      clientId:     paypalClientId,
      clientSecret: paypalSecret,
      environment:  (paypalEnvRaw === "live" ? "live" : "sandbox"),
      enabled:      Boolean(paypalClientId && paypalSecret),
    },
    paymob: {
      apiKey:        paymobKey,
      integrationId: env.PAYMOB_INTEGRATION_ID ?? "",
      hmacSecret:    env.PAYMOB_HMAC_SECRET ?? "",
      enabled:       Boolean(paymobKey),
    },
    defaultCurrency: env.DEFAULT_CURRENCY ?? "SAR",
    walletEnabled:   envBool(env.WALLET_ENABLED, true),
  };
}

// ── Validator ─────────────────────────────────────────────────────────────────

export function validatePaymentsConfig(config: PaymentsConfig): ConfigValidationResult {
  const issues = [];
  if (!config.paypal.enabled) {
    issues.push({ field: "payments.paypal", message: "PayPal credentials not set — PayPal routes will return 503", severity: "warning" as const });
  } else if (config.paypal.environment === "live" && !config.paypal.clientSecret) {
    issues.push({ field: "payments.paypal.clientSecret", message: "PayPal live environment requires a client secret", severity: "error" as const });
  }
  return issues.length ? invalidResult("payments", issues) : validResult("payments");
}

// ── Module ────────────────────────────────────────────────────────────────────

export const paymentsConfigModule: ConfigModule<PaymentsConfig> = {
  moduleName: "payments",
  defaults:   PAYMENTS_DEFAULTS,
  build:      buildPaymentsConfig,
  validate:   validatePaymentsConfig,
};
