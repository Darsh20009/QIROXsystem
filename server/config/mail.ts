// ── Mail Configuration ────────────────────────────────────────────────────────
// SMTP transport and email branding settings.
//
// Purpose:
//   Centralizes all email-sending parameters currently scattered across
//   server/email.ts (getEmailCfg) and various process.env reads.
//
// Usage:
//   import { buildMailConfig } from "./config/mail";
//   const config = buildMailConfig(process.env);
//
// Future migration role:
//   Replaces the `getEmailCfg()` function in server/email.ts.
//   The DI container will inject MailConfig into email service constructors.

import {
  type EnvBag,
  type ConfigModule,
  type ConfigValidationResult,
  envInt,
  envBool,
  validResult,
  invalidResult,
} from "./types";

// ── Interface ─────────────────────────────────────────────────────────────────

/** SMTP transport credentials and connection settings. */
export interface SmtpConfig {
  /** SMTP host. Maps to: CPANEL_SMTP_HOST → SMTP_HOST */
  host: string;

  /** SMTP port. Maps to: CPANEL_SMTP_PORT → SMTP_PORT. Default: 465. */
  port: number;

  /** SMTP login username. Maps to: CPANEL_SMTP_USER → SMTP_USER */
  user: string;

  /** SMTP login password. Maps to: CPANEL_SMTP_PASS → SMTP_PASS */
  password: string;

  /**
   * Use SSL/TLS. True for port 465; false for port 587 (STARTTLS).
   * Maps to: CPANEL_SMTP_PORT → SMTP_PORT (derived, not a separate env var).
   */
  secure: boolean;

  /** Connection timeout in ms. Default: 10000. Maps to: SMTP_TIMEOUT_MS */
  timeoutMs: number;
}

/** Branding values embedded in outgoing email templates. */
export interface EmailBrandingConfig {
  /** Display name in the From header. Maps to: SMTP2GO_SENDER_NAME */
  senderName: string;

  /** From address. Maps to: SMTP2GO_SENDER */
  senderEmail: string;

  /** URL of the logo image embedded in templates. Maps to: EMAIL_LOGO_URL */
  logoUrl: string;

  /** Canonical site URL linked in templates. Maps to: EMAIL_SITE_URL */
  siteUrl: string;
}

export interface MailConfig {
  /** SMTP connection details. */
  smtp: SmtpConfig;

  /** Email template branding values. */
  branding: EmailBrandingConfig;

  /**
   * Whether to actually send emails.
   * Set false in development to log instead of send. Maps to: MAIL_ENABLED
   */
  enabled: boolean;

  /**
   * Override all outgoing "to" addresses with this address (development only).
   * Maps to: MAIL_DEBUG_TO
   */
  debugTo?: string;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const MAIL_DEFAULTS: Readonly<Partial<MailConfig>> = {
  smtp: {
    host:      "",
    port:      465,
    user:      "",
    password:  "",
    secure:    true,
    timeoutMs: 10_000,
  },
  branding: {
    senderName:  "Qirox",
    senderEmail: "noreply@qiroxstudio.online",
    logoUrl:     "https://qiroxstudio.online/logo.png",
    siteUrl:     "https://qiroxstudio.online",
  },
  enabled: true,
};

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildMailConfig(env: EnvBag = process.env): MailConfig {
  const smtpPort = envInt(
    env.CPANEL_SMTP_PORT ?? env.SMTP_PORT,
    465,
  );
  const siteUrl = env.EMAIL_SITE_URL ?? "https://qiroxstudio.online";

  return {
    smtp: {
      host:      env.CPANEL_SMTP_HOST ?? env.SMTP_HOST ?? "",
      port:      smtpPort,
      user:      env.CPANEL_SMTP_USER ?? env.SMTP_USER ?? "",
      password:  env.CPANEL_SMTP_PASS ?? env.SMTP_PASS ?? "",
      secure:    smtpPort !== 587,
      timeoutMs: envInt(env.SMTP_TIMEOUT_MS, 10_000),
    },
    branding: {
      senderName:  env.SMTP2GO_SENDER_NAME ?? "Qirox",
      senderEmail: env.SMTP2GO_SENDER ?? "noreply@qiroxstudio.online",
      logoUrl:     env.EMAIL_LOGO_URL ?? `${siteUrl}/logo.png`,
      siteUrl,
    },
    enabled: envBool(env.MAIL_ENABLED, true),
    ...(env.MAIL_DEBUG_TO ? { debugTo: env.MAIL_DEBUG_TO } : {}),
  };
}

// ── Validator ─────────────────────────────────────────────────────────────────

export function validateMailConfig(config: MailConfig): ConfigValidationResult {
  const issues = [];
  if (config.enabled) {
    if (!config.smtp.host) {
      issues.push({ field: "mail.smtp.host", message: "SMTP host is required when mail is enabled", severity: "warning" as const });
    }
    if (!config.smtp.user) {
      issues.push({ field: "mail.smtp.user", message: "SMTP user is required when mail is enabled", severity: "warning" as const });
    }
    if (!config.smtp.password) {
      issues.push({ field: "mail.smtp.password", message: "SMTP password is required when mail is enabled", severity: "warning" as const });
    }
  }
  return issues.length ? invalidResult("mail", issues) : validResult("mail");
}

// ── Module ────────────────────────────────────────────────────────────────────

export const mailConfigModule: ConfigModule<MailConfig> = {
  moduleName: "mail",
  defaults:   MAIL_DEFAULTS,
  build:      buildMailConfig,
  validate:   validateMailConfig,
};
