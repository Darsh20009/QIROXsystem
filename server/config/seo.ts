// ── SEO Configuration ─────────────────────────────────────────────────────────
// Site-wide SEO defaults, Open Graph values, and structured-data settings.
//
// Purpose:
//   Centralizes SEO metadata so it can be referenced consistently by
//   server-rendered meta tags, the sitemap generator, and schema.org markup.
//
// Usage:
//   import { buildSeoConfig } from "./config/seo";
//   const config = buildSeoConfig(process.env);
//
// Future migration role:
//   Feeds a server-side meta-tag injection middleware and sitemap route
//   so every page has correct Open Graph / Twitter Card defaults.

import {
  type EnvBag,
  type ConfigModule,
  type ConfigValidationResult,
  validResult,
  invalidResult,
} from "./types";

// ── Interface ─────────────────────────────────────────────────────────────────

export interface SeoConfig {
  /** Default page title suffix (e.g. "Qirox Studio"). Maps to: SEO_SITE_NAME */
  siteName: string;

  /** Default meta description. Maps to: SEO_DESCRIPTION */
  description: string;

  /** Canonical base URL (no trailing slash). Maps to: APP_URL / EMAIL_SITE_URL */
  canonicalUrl: string;

  /** Default Open Graph image URL. Maps to: SEO_OG_IMAGE */
  ogImage: string;

  /** Twitter / X handle (without @). Maps to: SEO_TWITTER_HANDLE */
  twitterHandle: string;

  /** Default Twitter card type. Default: "summary_large_image" */
  twitterCard: "summary" | "summary_large_image" | "app" | "player";

  /** robots.txt directive for all pages. Maps to: SEO_ROBOTS. Default: "index,follow" */
  robots: string;

  /** Primary content locale (BCP 47). Maps to: SEO_LOCALE. Default: "ar-SA" */
  locale: string;

  /** Alternate locale for bilingual support. Maps to: SEO_ALT_LOCALE. Default: "en-US" */
  altLocale: string;

  /**
   * Google Search Console verification code.
   * Maps to: GOOGLE_SITE_VERIFICATION
   */
  googleVerification?: string;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const SEO_DEFAULTS: Readonly<Partial<SeoConfig>> = {
  siteName:      "Qirox Studio",
  description:   "مصنع الأنظمة الرقمية — نحوّل فكرتك إلى موقع أو نظام مخصص",
  canonicalUrl:  "https://qiroxstudio.online",
  ogImage:       "https://qiroxstudio.online/og-image.png",
  twitterHandle: "qiroxsa",
  twitterCard:   "summary_large_image",
  robots:        "index,follow",
  locale:        "ar-SA",
  altLocale:     "en-US",
};

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildSeoConfig(env: EnvBag = process.env): SeoConfig {
  const baseUrl = env.APP_URL ?? env.EMAIL_SITE_URL ?? "https://qiroxstudio.online";

  return {
    siteName:      env.SEO_SITE_NAME ?? "Qirox Studio",
    description:   env.SEO_DESCRIPTION ?? "مصنع الأنظمة الرقمية — نحوّل فكرتك إلى موقع أو نظام مخصص",
    canonicalUrl:  baseUrl,
    ogImage:       env.SEO_OG_IMAGE ?? `${baseUrl}/og-image.png`,
    twitterHandle: env.SEO_TWITTER_HANDLE ?? "qiroxsa",
    twitterCard:   (env.SEO_TWITTER_CARD as SeoConfig["twitterCard"]) ?? "summary_large_image",
    robots:        env.SEO_ROBOTS ?? "index,follow",
    locale:        env.SEO_LOCALE ?? "ar-SA",
    altLocale:     env.SEO_ALT_LOCALE ?? "en-US",
    ...(env.GOOGLE_SITE_VERIFICATION ? { googleVerification: env.GOOGLE_SITE_VERIFICATION } : {}),
  };
}

// ── Validator ─────────────────────────────────────────────────────────────────

export function validateSeoConfig(config: SeoConfig): ConfigValidationResult {
  const issues = [];
  if (!config.canonicalUrl.startsWith("http")) {
    issues.push({ field: "seo.canonicalUrl", message: "canonicalUrl must be an absolute URL", severity: "warning" as const });
  }
  if (config.description.length > 160) {
    issues.push({ field: "seo.description", message: "Meta description exceeds 160 characters — may be truncated in search results", severity: "warning" as const });
  }
  return issues.length ? invalidResult("seo", issues) : validResult("seo");
}

// ── Module ────────────────────────────────────────────────────────────────────

export const seoConfigModule: ConfigModule<SeoConfig> = {
  moduleName: "seo",
  defaults:   SEO_DEFAULTS,
  build:      buildSeoConfig,
  validate:   validateSeoConfig,
};
