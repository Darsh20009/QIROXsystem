// ── Email Domain Rules ─────────────────────────────────────────────────────────
// ALL business rules and pure functions for the email module live here.
//
// Purpose:
//   Centralise every decision that is not I/O or orchestration.
//   Functions here are pure or nearly pure — they do not call the database,
//   do not call nodemailer, and do not read from the HTTP request object.
//
// Responsibilities:
//   - SMTP configuration resolution (env vars + connManager).
//   - Per-account SMTP config override for sendEmailAs.
//   - HTML template builders for every transactional email type.
//   - Plain-text fallback stripping.
//   - Inline style constants (email-safe, no external stylesheets).
//
// Future migration role:
//   These functions become the source of truth for unit tests.
//   The service layer calls them; the controller never calls them directly.

import { connManager } from "../../connection-manager";
import { cleanName }   from "../../utils";
import type {
  EmailConfig,
  SmtpConfig,
  MailAccountRecord,
  EmailAttachment,
} from "./types";

// ── Inline style constants ────────────────────────────────────────────────────
// Email-safe: no class names, no external CSS, only inline styles.

const S = {
  wrap:       "max-width:580px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e2e2;font-family:Arial,Helvetica,sans-serif;direction:rtl;",
  header:     "background:#000000;padding:24px 32px;text-align:center;",
  logo:       "color:#ffffff;font-size:26px;font-weight:900;letter-spacing:4px;text-decoration:none;",
  body:       "padding:36px 32px;background:#ffffff;",
  footer:     "background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #f0f0f0;",
  footerText: "margin:0;font-size:11px;color:#9ca3af;",
  tag:        "display:inline-block;background:#f3f4f6;color:#6b7280;padding:4px 12px;border-radius:20px;font-size:11px;margin-bottom:14px;",
  title:      "margin:0 0 16px 0;font-size:20px;font-weight:800;color:#111111;",
  text:       "margin:0 0 14px 0;font-size:14px;color:#555555;line-height:1.8;",
  otpBox:     "background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin:20px 0;",
  otpCode:    "margin:0;font-size:44px;font-weight:900;color:#111111;letter-spacing:14px;font-family:Courier New,Courier,monospace;",
  otpNote:    "margin:10px 0 0 0;font-size:12px;color:#9ca3af;",
  btn:        "display:inline-block;background:#000000;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;margin:14px 0;",
  divider:    "border:none;border-top:1px solid #f0f0f0;margin:22px 0;",
  highlight:  "background:#fafafa;border-right:3px solid #000000;padding:11px 14px;margin:10px 0;font-size:13px;color:#374151;",
  labelCell:  "padding:8px 12px;font-size:12px;color:#9ca3af;background:#f9fafb;border:1px solid #f0f0f0;font-weight:600;width:35%;text-align:right;",
  valueCell:  "padding:8px 12px;font-size:13px;color:#111111;border:1px solid #f0f0f0;font-weight:600;text-align:right;",
  badgeBlack: "display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;background:#000000;color:#ffffff;",
  badgeGreen: "display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;background:#d1fae5;color:#065f46;",
  badgeBlue:  "display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;background:#dbeafe;color:#1e40af;",
  badgeAmber: "display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;background:#fef3c7;color:#92400e;",
  badgeRed:   "display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;background:#fee2e2;color:#991b1b;",
} as const;

type BadgeKey = keyof Pick<typeof S, "badgeBlack" | "badgeGreen" | "badgeBlue" | "badgeAmber" | "badgeRed">;

// ── Config resolution ─────────────────────────────────────────────────────────

/**
 * Resolve the active email configuration from connManager and environment variables.
 *
 * Business rule: connManager settings take precedence over env vars for
 * senderName / siteUrl / logoUrl. SMTP credentials always come from env vars.
 *
 * This function is called once per send operation so that dynamic
 * connection-settings changes take effect without a server restart.
 */
export function resolveEmailConfig(): EmailConfig {
  const s = connManager.emailSettings;
  return {
    senderName: s.senderName || "Qirox",
    siteUrl:    s.siteUrl || process.env.EMAIL_SITE_URL || "https://qiroxstudio.online",
    logoUrl:    s.logoUrl || process.env.EMAIL_LOGO_URL || `${process.env.EMAIL_SITE_URL || "https://qiroxstudio.online"}/logo.png`,
    smtpHost:   process.env.CPANEL_SMTP_HOST || process.env.SMTP_HOST || "",
    smtpPort:   parseInt(process.env.CPANEL_SMTP_PORT || process.env.SMTP_PORT || "465"),
    smtpUser:   process.env.CPANEL_SMTP_USER || process.env.SMTP_USER || "",
    smtpPass:   process.env.CPANEL_SMTP_PASS || process.env.SMTP_PASS || "",
    smtpSecure: (process.env.CPANEL_SMTP_PORT || process.env.SMTP_PORT || "465") !== "587",
  };
}

/**
 * Build a SmtpConfig for the default (system) SMTP account.
 *
 * Business rule: secure = true for any port other than 587.
 */
export function resolveDefaultSmtpConfig(cfg: EmailConfig): SmtpConfig {
  return {
    host:       cfg.smtpHost,
    port:       cfg.smtpPort,
    secure:     cfg.smtpSecure,
    user:       cfg.smtpUser,
    pass:       cfg.smtpPass,
    senderName: cfg.senderName,
  };
}

/**
 * Build a SmtpConfig that overrides the defaults with a specific MailAccount.
 * Falls back to the base config field-by-field when the account record
 * omits a value (mirrors the legacy sendEmailAs() behaviour exactly).
 *
 * Business rule: if account is null the caller must use the default config.
 */
export function resolveAccountSmtpConfig(
  baseConfig: EmailConfig,
  account:    MailAccountRecord,
): SmtpConfig {
  const port = account.smtpPort || baseConfig.smtpPort;
  return {
    host:       account.smtpHost || baseConfig.smtpHost,
    port,
    secure:     port !== 587,
    user:       account.emailAddress,
    pass:       account.password || baseConfig.smtpPass,
    senderName: account.displayName || baseConfig.senderName,
  };
}

/**
 * Returns true if the default SMTP config has enough credentials to send.
 * Business rule: all three of host, user, and pass must be non-empty.
 */
export function isSmtpConfigured(cfg: EmailConfig): boolean {
  return Boolean(cfg.smtpHost && cfg.smtpUser && cfg.smtpPass);
}

// ── Text utilities ────────────────────────────────────────────────────────────

/**
 * Strip HTML tags and decode common entities to produce a plain-text fallback.
 * Used when no explicit textBody is supplied to sendEmail().
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, "\n")
    .trim();
}

// ── Template primitives ───────────────────────────────────────────────────────
// Pure functions that build HTML fragments. All are free of I/O.

function htmlTag(text: string): string                    { return `<p style="${S.tag}">${text}</p>`; }
function htmlTitle(html: string): string                  { return `<p style="${S.title}">${html}</p>`; }
function htmlText(html: string, extra = ""): string       { return `<p style="${S.text}${extra}">${html}</p>`; }
function htmlHighlight(html: string, extra = ""): string  { return `<p style="${S.highlight}${extra}">${html}</p>`; }
function htmlBtn(url: string, label: string): string      { return `<a href="${url}" style="${S.btn}">${label}</a>`; }
function htmlDivider(): string                            { return `<hr style="${S.divider}" />`; }
function htmlBadge(key: BadgeKey, lbl: string): string    { return `<span style="${S[key]}">${lbl}</span>`; }

function htmlInfoTable(rows: [string, string][]): string {
  const rowsHtml = rows
    .map(([l, v]) => `<tr><td style="${S.labelCell}">${l}</td><td style="${S.valueCell}">${v}</td></tr>`)
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:16px 0;">${rowsHtml}</table>`;
}

function htmlOtpBox(code: string, note: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
<tr><td style="${S.otpBox}">
  <p style="${S.otpNote}">الرمز السري &mdash; OTP Code</p>
  <p style="${S.otpCode}">${code}</p>
  <p style="${S.otpNote}">${note}</p>
</td></tr></table>`;
}

/**
 * Build the Qirox brand banner (logo + gradient bar).
 * Receives the already-resolved config so it never calls connManager.
 */
export function buildBanner(logoUrl: string): string {
  return `<tr>
  <td style="padding:0;margin:0;background:#000000;border-radius:16px 16px 0 0;overflow:hidden;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background:#000000;padding:32px 32px 24px 32px;text-align:center;">
          ${logoUrl
            ? `<img src="${logoUrl}" alt="QIROX Studio" width="120" height="120"
                style="border:0;display:block;margin:0 auto;width:120px;height:120px;object-fit:contain;border-radius:24px;background:#111111;padding:8px;" />`
            : `<div style="width:96px;height:96px;border-radius:24px;background:#111111;margin:0 auto;display:inline-block;line-height:96px;text-align:center;">
                <span style="color:#ffffff;font-family:Arial,sans-serif;font-size:36px;font-weight:900;letter-spacing:2px;">Q</span>
               </div>`
          }
          <p style="margin:14px 0 2px 0;font-family:Arial,sans-serif;font-size:18px;font-weight:900;color:#ffffff;letter-spacing:3px;">QIROX STUDIO</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:1px;">qiroxstudio.online</p>
        </td>
      </tr>
    </table>
    <div style="height:3px;background:linear-gradient(90deg,#4f46e5,#7c3aed,#000000);font-size:0;line-height:0;">&nbsp;</div>
  </td>
</tr>`;
}

/**
 * Wrap content in the standard Qirox email shell (outer table, banner, footer).
 */
export function buildBaseTemplate(content: string, cfg: EmailConfig): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;direction:rtl;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;padding:24px 16px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" border="0" style="${S.wrap}">
  ${buildBanner(cfg.logoUrl)}
  <tr><td style="${S.body}">${content}</td></tr>
  <tr><td style="${S.footer}">
    <p style="${S.footerText}">&#169; 2026 QIROX Studio &bull; <a href="${cfg.siteUrl}" style="color:#9ca3af;text-decoration:none;">qiroxstudio.online</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Template builders ─────────────────────────────────────────────────────────
// One builder per email type. Each returns { subject, html }.
// All receive resolved EmailConfig so they never call connManager.

export function buildWelcomeEmail(name: string, cfg: EmailConfig) {
  const displayName = cleanName(name);
  return {
    subject: "مرحباً بك في QIROX",
    html: buildBaseTemplate(
      htmlTag("مرحباً بك") +
      htmlTitle(`اهلاً بك في QIROX، ${displayName}!`) +
      htmlText("تم انشاء حسابك بنجاح. انت الآن جزء من منظومة QIROX لبناء الانظمة الرقمية الاحترافية.") +
      htmlHighlight("لوحة التحكم الخاصة بك جاهزة &mdash; تصفح خدماتنا وابدأ مشروعك الأول") +
      htmlBtn(`${cfg.siteUrl}/dashboard`, "الذهاب للوحة التحكم") +
      htmlDivider() +
      htmlText("اذا لم تقم بانشاء هذا الحساب، تجاهل هذا البريد.", "font-size:12px;color:#9ca3af;"),
      cfg,
    ),
  };
}

export function buildOtpEmail(name: string, otp: string, cfg: EmailConfig) {
  const displayName = cleanName(name);
  const banner = buildBanner(cfg.logoUrl);
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;direction:rtl;text-align:right;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e2e2e2;overflow:hidden;max-width:560px;">
      ${banner}
      <tr>
        <td style="padding:36px 32px;">
          <p style="margin:0 0 8px 0;font-size:13px;color:#6b7280;">اعادة تعيين كلمة المرور</p>
          <h2 style="margin:0 0 20px 0;font-size:22px;font-weight:800;color:#111111;">رمز التحقق الخاص بك</h2>
          <p style="margin:0 0 24px 0;font-size:15px;color:#555555;line-height:1.7;">
            مرحبا ${displayName}، استخدم الرمز التالي لاعادة تعيين كلمة المرور:
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#f3f4f6;border-radius:12px;padding:28px;text-align:center;">
                <p style="margin:0 0 12px 0;font-size:13px;color:#9ca3af;">الرمز السري — OTP Code</p>
                <p style="margin:0;font-size:48px;font-weight:900;color:#111111;letter-spacing:14px;font-family:Courier,monospace;">${otp}</p>
                <p style="margin:12px 0 0 0;font-size:12px;color:#9ca3af;">صالح لمدة 10 دقائق فقط &bull; لا تشاركه مع احد</p>
              </td>
            </tr>
          </table>
          <p style="margin:24px 0 0 0;font-size:12px;color:#9ca3af;">
            اذا لم تطلب هذا، تجاهل البريد وسيبقى حسابك آمنا.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #f0f0f0;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">2026 QIROX Studio &bull; qiroxstudio.online</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
  const text = `QIROX Studio - رمز التحقق\n\nمرحبا ${displayName}،\n\nرمز اعادة تعيين كلمة المرور:\n\n${otp}\n\nصالح لمدة 10 دقائق فقط. لا تشاركه مع احد.\n\nاذا لم تطلب هذا، تجاهل البريد.\n\nQIROX Studio - qiroxstudio.online`;
  return { subject: `${otp} - رمز التحقق | QIROX`, html, text };
}

export function buildEmailVerificationEmail(name: string, otp: string, cfg: EmailConfig) {
  const displayName = cleanName(name);
  const banner = buildBanner(cfg.logoUrl);
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;direction:rtl;text-align:right;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e2e2e2;overflow:hidden;max-width:560px;">
      ${banner}
      <tr>
        <td style="padding:36px 32px;">
          <p style="margin:0 0 8px 0;font-size:13px;color:#6b7280;">رمز تفعيل الحساب</p>
          <h2 style="margin:0 0 20px 0;font-size:22px;font-weight:800;color:#111111;">مرحباً ${displayName}</h2>
          <p style="margin:0 0 24px 0;font-size:15px;color:#555555;line-height:1.7;">رمز التحقق الخاص بك لتفعيل حسابك في QIROX Studio:</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#f3f4f6;border-radius:12px;padding:28px;text-align:center;">
                <p style="margin:0 0 12px 0;font-size:13px;color:#9ca3af;">الرمز السري — OTP Code</p>
                <p style="margin:0;font-size:48px;font-weight:900;color:#111111;letter-spacing:14px;font-family:Courier,monospace;">${otp}</p>
                <p style="margin:12px 0 0 0;font-size:12px;color:#9ca3af;">صالح لمدة 30 دقيقة فقط &bull; لا تشاركه مع احد</p>
              </td>
            </tr>
          </table>
          <p style="margin:24px 0 0 0;font-size:12px;color:#9ca3af;">اذا لم تقم بانشاء هذا الحساب، تجاهل هذا البريد.</p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #f0f0f0;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">2026 QIROX Studio &bull; qiroxstudio.online</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
  const text = `QIROX Studio\n\nمرحبا ${displayName}،\n\nرمز التحقق الخاص بك:\n\n${otp}\n\nصالح لمدة 30 دقيقة فقط. لا تشاركه مع احد.\n\nاذا لم تقم بانشاء هذا الحساب، تجاهل هذا البريد.\n\nQIROX Studio - qiroxstudio.online`;
  return { subject: `${otp} - رمز تفعيل حسابك | QIROX`, html, text };
}

export function buildLoginOtpEmail(name: string, otp: string, cfg: EmailConfig, userAgent?: string) {
  const displayName = cleanName(name);
  const device = userAgent ? userAgent.replace(/[^a-zA-Z0-9\s\/\.\(\)]/g, "").slice(0, 80) : "جهاز غير معروف";
  const banner = buildBanner(cfg.logoUrl);
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;direction:rtl;text-align:right;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e2e2e2;overflow:hidden;max-width:560px;">
      ${banner}
      <tr>
        <td style="padding:36px 32px;">
          <p style="margin:0 0 8px 0;font-size:13px;color:#dc2626;font-weight:600;">&#9888; تنبيه أمني — محاولة تسجيل دخول</p>
          <h2 style="margin:0 0 20px 0;font-size:22px;font-weight:800;color:#111111;">مرحباً ${displayName}</h2>
          <p style="margin:0 0 16px 0;font-size:15px;color:#555555;line-height:1.7;">تم طلب تسجيل دخول إلى حسابك من جهاز جديد. استخدم الرمز التالي لتوثيق الجهاز:</p>
          <p style="margin:0 0 24px 0;font-size:12px;color:#9ca3af;background:#fff8f0;border:1px solid #fed7aa;border-radius:8px;padding:10px 14px;">الجهاز: ${device}</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#111111;border-radius:12px;padding:28px;text-align:center;">
                <p style="margin:0 0 12px 0;font-size:13px;color:#9ca3af;">رمز توثيق الجهاز — Device OTP</p>
                <p style="margin:0;font-size:48px;font-weight:900;color:#ffffff;letter-spacing:14px;font-family:Courier,monospace;">${otp}</p>
                <p style="margin:12px 0 0 0;font-size:12px;color:#6b7280;">صالح لمدة 15 دقيقة فقط &bull; لا تشاركه مع احد</p>
              </td>
            </tr>
          </table>
          <p style="margin:24px 0 0 0;font-size:13px;color:#dc2626;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;">
            &#128275; إذا لم تقم بمحاولة تسجيل الدخول هذه، قم بتغيير كلمة مرورك فوراً وتواصل معنا.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #f0f0f0;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">2026 QIROX Studio &bull; qiroxstudio.online</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
  const text = `QIROX Studio — رمز توثيق الجهاز\n\nمرحبا ${displayName}،\n\nتم طلب تسجيل دخول من جهاز جديد. رمز التوثيق:\n\n${otp}\n\nصالح لمدة 15 دقيقة فقط. لا تشاركه مع احد.\n\nإذا لم تقم بهذا، قم بتغيير كلمة المرور فوراً.\n\nQIROX Studio - qiroxstudio.online`;
  return { subject: `${otp} - رمز توثيق جهازك | QIROX`, html, text };
}

export function buildOrderConfirmationEmail(name: string, orderId: string, items: string[], cfg: EmailConfig) {
  const displayName = cleanName(name);
  const itemsList = items.map(i => htmlHighlight(`&#8226; ${i}`)).join("");
  return {
    subject: `تأكيد طلبك #${orderId.slice(-8).toUpperCase()} | QIROX`,
    html: buildBaseTemplate(
      htmlTag("تأكيد الطلب") +
      htmlTitle("تم استلام طلبك!") +
      htmlText(`شكراً ${displayName}، تم استلام طلبك بنجاح ورقم الطلب هو:`) +
      `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
        <tr><td style="background:#f3f4f6;border-radius:10px;padding:20px;text-align:center;">
          <p style="margin:0;font-size:20px;font-weight:900;color:#111111;letter-spacing:3px;font-family:Courier New,Courier,monospace;">#${orderId.slice(-8).toUpperCase()}</p>
        </td></tr>
      </table>` +
      htmlText("محتويات الطلب:") +
      itemsList +
      htmlText(`سيتواصل معك فريق QIROX خلال <strong>24 ساعة</strong> لإتمام الدفع والبدء في التنفيذ.`) +
      htmlBtn(`${cfg.siteUrl}/dashboard`, "متابعة الطلب"),
      cfg,
    ),
  };
}

export function buildOrderStatusEmail(name: string, orderId: string, status: string, cfg: EmailConfig) {
  const statusMap: Record<string, { label: string; icon: string; desc: string; badgeKey: BadgeKey }> = {
    pending:     { label: "قيد المراجعة",  icon: "◌", desc: "طلبك قيد المراجعة من قبل فريقنا",         badgeKey: "badgeAmber" },
    approved:    { label: "تمت الموافقة",   icon: "✓", desc: "تمت الموافقة على طلبك وبدأ العمل عليه",    badgeKey: "badgeBlue" },
    in_progress: { label: "قيد التنفيذ",    icon: "⚙", desc: "يعمل فريقنا على تنفيذ مشروعك",           badgeKey: "badgeBlue" },
    review:      { label: "مراجعة العميل", icon: "◉", desc: "المشروع جاهز لمراجعتك",                   badgeKey: "badgeAmber" },
    completed:   { label: "مكتمل",          icon: "✓", desc: "تم تسليم مشروعك بنجاح",                   badgeKey: "badgeGreen" },
    rejected:    { label: "مرفوض",          icon: "✕", desc: "للأسف تم رفض الطلب. تواصل معنا للمزيد",  badgeKey: "badgeRed" },
  };
  const s = statusMap[status] || { label: status, icon: "•", desc: "تم تحديث حالة طلبك", badgeKey: "badgeBlack" as BadgeKey };
  return {
    subject: `تحديث طلبك: ${s.label} | QIROX`,
    html: buildBaseTemplate(
      htmlTag("تحديث حالة الطلب") +
      htmlTitle(`${s.icon} ${s.label}`) +
      htmlBadge(s.badgeKey, s.label) +
      htmlText(s.desc) +
      htmlHighlight(`رقم الطلب: #${orderId.slice(-8).toUpperCase()}`) +
      htmlBtn(`${cfg.siteUrl}/dashboard`, "عرض الطلب"),
      cfg,
    ),
  };
}

export function buildMessageNotificationEmail(name: string, senderName: string, preview: string, cfg: EmailConfig) {
  return {
    subject: `رسالة من ${senderName} | QIROX`,
    html: buildBaseTemplate(
      htmlTag("رسالة جديدة") +
      htmlTitle(`لديك رسالة جديدة من ${senderName}`) +
      htmlHighlight(`&ldquo;${preview.slice(0, 120)}${preview.length > 120 ? "..." : ""}&rdquo;`) +
      htmlBtn(`${cfg.siteUrl}/dashboard`, "الرد على الرسالة"),
      cfg,
    ),
  };
}

export function buildProjectUpdateEmail(
  name: string, projectName: string, status: string, progress: number, cfg: EmailConfig, note?: string,
) {
  const statusLabels: Record<string, { label: string; icon: string; badgeKey: BadgeKey }> = {
    planning:    { label: "التخطيط",      icon: "◌", badgeKey: "badgeAmber" },
    in_progress: { label: "قيد التنفيذ",  icon: "⚙", badgeKey: "badgeBlue" },
    review:      { label: "المراجعة",     icon: "◉", badgeKey: "badgeAmber" },
    completed:   { label: "مكتمل",        icon: "✓", badgeKey: "badgeGreen" },
    on_hold:     { label: "متوقف مؤقتاً", icon: "⏸", badgeKey: "badgeRed" },
  };
  const s = statusLabels[status] || { label: status, icon: "•", badgeKey: "badgeBlack" as BadgeKey };
  const progressBar = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0;">
      <tr><td style="background:#f3f4f6;border-radius:999px;height:10px;overflow:hidden;">
        <table height="10" cellpadding="0" cellspacing="0" border="0">
          <tr><td width="${Math.min(progress, 100)}%" style="background:#000000;height:10px;border-radius:999px;"></td></tr>
        </table>
      </td></tr>
    </table>
    <p style="font-size:12px;color:#6b7280;text-align:center;margin:4px 0;">${progress}% مكتمل</p>`;
  return {
    subject: `تحديث مشروع: ${projectName} | QIROX`,
    html: buildBaseTemplate(
      htmlTag("تحديث المشروع") +
      htmlTitle(`${s.icon} تحديث على مشروعك`) +
      htmlText(`مرحباً ${cleanName(name)}، هناك تحديث جديد على مشروعك:`) +
      htmlInfoTable([
        ["اسم المشروع", projectName],
        ["الحالة الحالية", htmlBadge(s.badgeKey, s.label)],
        ["نسبة الإنجاز", `${progress}%`],
      ]) +
      progressBar +
      (note ? htmlHighlight(`ملاحظة: ${note}`) : "") +
      htmlBtn(`${cfg.siteUrl}/dashboard`, "متابعة المشروع"),
      cfg,
    ),
  };
}

export function buildTaskAssignedEmail(
  name: string, taskTitle: string, projectName: string, priority: string, cfg: EmailConfig, deadline?: string,
) {
  const priorityLabels: Record<string, { label: string; badgeKey: BadgeKey }> = {
    low:    { label: "منخفض", badgeKey: "badgeBlack" },
    medium: { label: "متوسط", badgeKey: "badgeBlue" },
    high:   { label: "عالي",  badgeKey: "badgeAmber" },
    urgent: { label: "عاجل",  badgeKey: "badgeRed" },
  };
  const p = priorityLabels[priority] || { label: priority, badgeKey: "badgeBlack" as BadgeKey };
  const rows: [string, string][] = [
    ["المهمة", taskTitle],
    ["المشروع", projectName],
    ["الأولوية", htmlBadge(p.badgeKey, p.label)],
  ];
  if (deadline) rows.push(["الموعد النهائي", new Date(deadline).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })]);
  return {
    subject: `مهمة جديدة: ${taskTitle} | QIROX`,
    html: buildBaseTemplate(
      htmlTag("مهمة جديدة") +
      htmlTitle("تم تكليفك بمهمة جديدة") +
      htmlText(`مرحباً ${cleanName(name)}، تم اسناد مهمة جديدة اليك في مشروع <strong>${projectName}</strong>:`) +
      htmlInfoTable(rows) +
      htmlBtn(`${cfg.siteUrl}/dashboard`, "عرض المهمة"),
      cfg,
    ),
  };
}

export function buildTaskCompletedEmail(
  name: string, taskTitle: string, projectName: string, completedBy: string, cfg: EmailConfig,
) {
  return {
    subject: `انجاز مهمة: ${taskTitle} | QIROX`,
    html: buildBaseTemplate(
      htmlTag("انجاز مهمة") +
      htmlTitle("تم انجاز مهمة في مشروعك") +
      htmlText(`مرحباً ${cleanName(name)}، تم الانتهاء من مهمة في مشروع <strong>${projectName}</strong>:`) +
      htmlInfoTable([
        ["المهمة", taskTitle],
        ["المشروع", projectName],
        ["انجزها", completedBy],
        ["التاريخ", new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })],
      ]) +
      htmlBtn(`${cfg.siteUrl}/dashboard`, "متابعة المشروع"),
      cfg,
    ),
  };
}

export function buildDirectEmail(toName: string, subject: string, body: string, cfg: EmailConfig) {
  return {
    subject,
    html: buildBaseTemplate(
      htmlTag("رسالة من فريق QIROX") +
      htmlTitle(subject) +
      `<p style="margin:0 0 14px 0;font-size:14px;color:#555555;line-height:1.8;white-space:pre-line;">${body}</p>` +
      htmlDivider() +
      htmlText("هذه الرسالة ارسلت اليك من فريق QIROX.", "font-size:12px;color:#9ca3af;"),
      cfg,
    ),
  };
}

export function buildAdminNewClientEmail(clientName: string, clientEmail: string, clientPhone: string, cfg: EmailConfig, registeredBy?: string) {
  return {
    subject: `عميل جديد: ${clientName} | QIROX`,
    html: buildBaseTemplate(
      htmlTag("عميل جديد") +
      htmlTitle("تم تسجيل عميل جديد") +
      htmlText(`تم انشاء حساب عميل جديد على منصة QIROX${registeredBy ? ` عن طريق <strong>${registeredBy}</strong>` : ""}:`) +
      htmlInfoTable([
        ["الاسم", clientName],
        ["البريد الالكتروني", clientEmail],
        ["الهاتف", clientPhone || "—"],
        ["التاريخ", new Date().toLocaleString("ar-SA")],
      ]) +
      htmlBtn(`${cfg.siteUrl}/admin/customers`, "عرض العميل"),
      cfg,
    ),
  };
}

export function buildAdminNewOrderEmail(clientName: string, clientEmail: string, orderId: string, services: string[], cfg: EmailConfig, totalAmount?: number) {
  const servicesList = services.map(s => htmlHighlight(`&#8226; ${s}`)).join("") || htmlHighlight("—");
  const rows: [string, string][] = [
    ["العميل", clientName],
    ["البريد", clientEmail],
    ["رقم الطلب", `#${orderId.slice(-8).toUpperCase()}`],
  ];
  if (totalAmount) rows.push(["المبلغ", `${totalAmount.toLocaleString("ar-SA")} ر.س`]);
  rows.push(["التاريخ", new Date().toLocaleString("ar-SA")]);
  return {
    subject: `طلب جديد من ${clientName} | QIROX`,
    html: buildBaseTemplate(
      htmlTag("طلب جديد") +
      htmlTitle("طلب جديد بانتظار المراجعة") +
      htmlText(`ورد طلب جديد من العميل <strong>${clientName}</strong> ويحتاج الى مراجعة:`) +
      htmlInfoTable(rows) +
      `<p style="${S.text}font-weight:700;">الخدمات المطلوبة:</p>` +
      servicesList +
      htmlBtn(`${cfg.siteUrl}/admin/orders`, "مراجعة الطلب الآن"),
      cfg,
    ),
  };
}

export function buildWelcomeWithCredentialsEmail(name: string, username: string, password: string, cfg: EmailConfig) {
  const displayName = cleanName(name);
  return {
    subject: "بيانات حسابك في QIROX",
    html: buildBaseTemplate(
      htmlTag("مرحباً بك") +
      htmlTitle(`اهلاً بك في QIROX، ${displayName}!`) +
      htmlText("تم انشاء حسابك على منصة QIROX بنجاح. اليك بيانات الدخول الخاصة بك:") +
      htmlInfoTable([
        ["اسم المستخدم", `<span style="font-family:Courier New,Courier,monospace;font-weight:900;">${username}</span>`],
        ["كلمة المرور", `<span style="font-family:Courier New,Courier,monospace;font-weight:900;">${password}</span>`],
      ]) +
      `<p style="margin:0 0 14px 0;font-size:13px;color:#ef4444;">يُرجى تغيير كلمة المرور فور تسجيل الدخول لأول مرة.</p>` +
      htmlBtn(`${cfg.siteUrl}/login`, "تسجيل الدخول الآن") +
      htmlDivider() +
      htmlText("اذا لم تطلب انشاء هذا الحساب، تواصل معنا فوراً.", "font-size:12px;color:#9ca3af;"),
      cfg,
    ),
  };
}

export function buildTestEmail(name: string, smtpUser: string, cfg: EmailConfig) {
  return {
    subject: "اختبار نظام البريد | QIROX",
    html: buildBaseTemplate(
      htmlTag("بريد تجريبي") +
      htmlTitle("اختبار نظام البريد الالكتروني") +
      htmlText(`مرحباً ${name}، هذا بريد تجريبي للتأكد من ان نظام ارسال البريد الالكتروني في QIROX يعمل بشكل صحيح.`) +
      htmlInfoTable([
        ["النظام", "SMTP"],
        ["المرسل", smtpUser],
        ["التوقيت", new Date().toLocaleString("ar-SA")],
        ["الحالة", htmlBadge("badgeGreen", "يعمل")],
      ]) +
      htmlText("جميع انواع البريد الالكتروني جاهزة: ترحيب، تأكيد طلب، تحديث حالة، اشعار مشروع، اسناد مهمة.") +
      htmlBtn(`${cfg.siteUrl}/dashboard`, "الذهاب للوحة التحكم"),
      cfg,
    ),
  };
}

export function buildSupportTicketCreatedEmail(name: string, subject: string, category: string, priority: string, ticketId: string, cfg: EmailConfig) {
  const displayName = cleanName(name);
  const catMap: Record<string, string> = { technical: "مشكلة تقنية", billing: "مالية", general: "استفسار عام", complaint: "شكوى" };
  const priMap: Record<string, string> = { low: "منخفض", medium: "متوسط", high: "عالٍ" };
  const priKey: Record<string, BadgeKey> = { low: "badgeAmber", medium: "badgeBlue", high: "badgeRed" };
  return {
    subject: `تذكرة دعم #${ticketId.slice(-8).toUpperCase()} | QIROX`,
    html: buildBaseTemplate(
      htmlTag("دعم العملاء") +
      htmlTitle("تم استلام تذكرتك ✓") +
      htmlText(`شكراً ${displayName}، وصلت تذكرتك وسيردّ عليها فريق الدعم قريباً.`) +
      htmlInfoTable([
        ["رقم التذكرة", `#${ticketId.slice(-8).toUpperCase()}`],
        ["الموضوع", subject],
        ["التصنيف", catMap[category] || category],
        ["الأولوية", htmlBadge(priKey[priority] || "badgeBlack", priMap[priority] || priority)],
      ]) +
      htmlText("سنتواصل معك عبر البريد الإلكتروني بمجرد مراجعة تذكرتك.") +
      htmlBtn(`${cfg.siteUrl}/support-tickets`, "متابعة التذكرة"),
      cfg,
    ),
  };
}

export function buildSupportTicketReplyEmail(name: string, subject: string, adminReply: string, status: string, ticketId: string, cfg: EmailConfig) {
  const displayName = cleanName(name);
  const statusMap: Record<string, string> = { resolved: "تم الحل", in_review: "قيد المراجعة", closed: "مغلقة", open: "مفتوحة" };
  return {
    subject: `ردّ على تذكرتك: ${subject} | QIROX`,
    html: buildBaseTemplate(
      htmlTag("ردّ فريق الدعم") +
      htmlTitle(`${displayName}، لديك ردٌّ جديد على تذكرتك`) +
      htmlHighlight(`رقم التذكرة: #${ticketId.slice(-8).toUpperCase()} — ${subject}`) +
      htmlText(`<strong>الحالة الحالية:</strong> ${statusMap[status] || status}`) +
      htmlDivider() +
      htmlText(`<strong>ردّ الفريق:</strong>`) +
      `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px;">
        <tr><td style="background:#f9fafb;border-right:3px solid #000;border-radius:0 8px 8px 0;padding:16px 18px;font-size:14px;color:#374151;line-height:1.8;white-space:pre-line;">${adminReply}</td></tr>
      </table>` +
      htmlBtn(`${cfg.siteUrl}/support-tickets`, "عرض التذكرة والرد"),
      cfg,
    ),
  };
}

export function buildAdminNewTicketEmail(adminName: string, clientName: string, subject: string, body: string, priority: string, ticketId: string, cfg: EmailConfig) {
  const priMap: Record<string, string> = { low: "منخفض", medium: "متوسط", high: "عالٍ 🔴" };
  return {
    subject: `🎫 تذكرة دعم جديدة: ${subject} | QIROX`,
    html: buildBaseTemplate(
      htmlTag("تذكرة دعم جديدة") +
      htmlTitle(`تذكرة جديدة من ${clientName}`) +
      htmlInfoTable([
        ["رقم التذكرة", `#${ticketId.slice(-8).toUpperCase()}`],
        ["العميل", clientName],
        ["الموضوع", subject],
        ["الأولوية", priMap[priority] || priority],
      ]) +
      htmlText(`<strong>المحتوى:</strong>`) +
      htmlHighlight(body.slice(0, 300) + (body.length > 300 ? "..." : "")) +
      htmlBtn(`${cfg.siteUrl}/admin/support-tickets`, "الرد على التذكرة الآن"),
      cfg,
    ),
  };
}

export function buildTaskStatusEmail(name: string, taskTitle: string, projectName: string, oldStatus: string, newStatus: string, cfg: EmailConfig) {
  const displayName = cleanName(name);
  const statusMap: Record<string, { label: string; badgeKey: BadgeKey }> = {
    new:             { label: "جديدة",            badgeKey: "badgeBlack" },
    under_study:     { label: "قيد الدراسة",      badgeKey: "badgeAmber" },
    pending_payment: { label: "بانتظار الدفع",     badgeKey: "badgeAmber" },
    in_progress:     { label: "قيد التنفيذ",       badgeKey: "badgeBlue" },
    testing:         { label: "في مرحلة الاختبار", badgeKey: "badgeBlue" },
    review:          { label: "في المراجعة",       badgeKey: "badgeAmber" },
    delivery:        { label: "التسليم",            badgeKey: "badgeGreen" },
    closed:          { label: "مغلقة ✓",           badgeKey: "badgeGreen" },
  };
  const ns = statusMap[newStatus] || { label: newStatus, badgeKey: "badgeBlack" as BadgeKey };
  const os = statusMap[oldStatus] || { label: oldStatus, badgeKey: "badgeBlack" as BadgeKey };
  return {
    subject: `تحديث المهمة: ${taskTitle} | QIROX`,
    html: buildBaseTemplate(
      htmlTag("تحديث المهمة") +
      htmlTitle("تم تحديث مهمتك") +
      htmlText(`مرحباً ${displayName}، تم تحديث حالة مهمتك في المشروع.`) +
      htmlInfoTable([
        ["المهمة", taskTitle],
        ["المشروع", projectName || "—"],
        ["الحالة السابقة", htmlBadge(os.badgeKey, os.label)],
        ["الحالة الجديدة", htmlBadge(ns.badgeKey, ns.label)],
      ]) +
      htmlBtn(`${cfg.siteUrl}/admin/kanban`, "عرض المهام"),
      cfg,
    ),
  };
}

export function buildIncomingCallEmail(name: string, callerName: string, cfg: EmailConfig) {
  const displayName = cleanName(name);
  return {
    subject: `📞 مكالمة فائتة من ${callerName} | QIROX`,
    html: buildBaseTemplate(
      htmlTag("مكالمة فائتة") +
      htmlTitle(`مكالمة فائتة من ${callerName}`) +
      htmlText(`${displayName}، حاول ${callerName} الاتصال بك على QIROX ولم يتمكن من الوصول إليك.`) +
      htmlBtn(`${cfg.siteUrl}/inbox`, "فتح الرسائل والرد"),
      cfg,
    ),
  };
}

/** Constant owner email for WhatsApp notification emails. */
export const OWNER_EMAIL = "youssefd.business@gmail.com" as const;
