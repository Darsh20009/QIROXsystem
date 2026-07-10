// ── Email Service ──────────────────────────────────────────────────────────────
// Orchestration only — no business rules, no HTTP concerns, no DB queries.
//
// Purpose:
//   Coordinate calls between the domain layer (config resolution, templates),
//   the repository layer (MailAccount lookup), and the SMTP infrastructure
//   (nodemailer) to fulfil each transactional email use case.
//
// Responsibilities:
//   - Resolve EmailConfig from domain on every call (supports live config changes).
//   - Look up MailAccount records from repository when sendEmailAs() is needed.
//   - Build HTML bodies from domain template builders.
//   - Dispatch mail via the SMTP transport helper.
//   - Return typed SendResult to the controller.
//
// Architecture constraint:
//   This file is the ONLY place that imports nodemailer.
//   Domain and repository layers are nodemailer-free.
//
// Scope (Migration 009):
//   Transactional email only — welcome, OTP, auth, notifications,
//   orders, projects, tasks, QMeet, wallet, support, and marketing foundation.
//   Out of scope: email campaigns, IMAP, raw SMTP management.
//
// Future migration role:
//   Will receive domain, repository, and transport instances via constructor
//   injection once the DI container is wired (Migration 010+).

import nodemailer from "nodemailer";
import { cleanName } from "../../utils";
import * as domain     from "./domain";
import * as repository from "./repository";
import type {
  SendResult,
  EmailAttachment,
  SmtpConfig,
} from "./types";

// ── SMTP transport ─────────────────────────────────────────────────────────────

/**
 * Create a nodemailer transporter from a resolved SmtpConfig and send one mail.
 * This is the only function that calls nodemailer.createTransport().
 *
 * @returns true on success, throws on nodemailer error (caller catches).
 */
async function dispatchViaSMTP(
  cfg:         SmtpConfig,
  to:          string,
  toName:      string,
  subject:     string,
  htmlBody:    string,
  textBody?:   string,
  attachments?: EmailAttachment[],
): Promise<boolean> {
  const transporter = nodemailer.createTransport({
    host:   cfg.host,
    port:   cfg.port,
    secure: cfg.secure,
    auth:   { user: cfg.user, pass: cfg.pass },
    tls:    { rejectUnauthorized: false },
  });

  const mailOptions: nodemailer.SendMailOptions = {
    from:    `"${cfg.senderName}" <${cfg.user}>`,
    to:      `${toName} <${to}>`,
    subject,
    html:    htmlBody,
    text:    textBody || domain.stripHtml(htmlBody),
  };

  if (attachments && attachments.length > 0) {
    mailOptions.attachments = attachments.map(a => ({
      filename:    a.filename,
      content:     Buffer.from(a.fileblob, "base64"),
      contentType: a.mimetype,
    }));
  }

  await transporter.sendMail(mailOptions);
  return true;
}

// ── Core send primitives ───────────────────────────────────────────────────────

/**
 * Send a transactional email using the default (system) SMTP account.
 * This is the fundamental send primitive used by all template senders.
 *
 * Business rule (from domain): SMTP must be configured (host + user + pass).
 * Falls back to a logged warning and returns { sent: false } when not configured.
 */
export async function sendEmail(
  to:           string,
  toName:       string,
  subject:      string,
  htmlBody:     string,
  textBody?:    string,
  attachments?: EmailAttachment[],
): Promise<SendResult> {
  const cfg = domain.resolveEmailConfig();
  try {
    if (!domain.isSmtpConfigured(cfg)) {
      console.warn("[EmailDomain] No SMTP configured — set SMTP_HOST, SMTP_USER, and SMTP_PASS");
      return { sent: false };
    }
    const smtpCfg = domain.resolveDefaultSmtpConfig(cfg);
    console.log(`[EmailDomain] Sending via SMTP (${cfg.smtpHost}) to ${to}`);
    const sent = await dispatchViaSMTP(smtpCfg, to, toName, subject, htmlBody, textBody, attachments);
    return { sent };
  } catch (err) {
    console.error("[EmailDomain] send error:", err);
    return { sent: false };
  }
}

/**
 * Send an email from a specific cPanel account.
 * Looks up SMTP credentials from MailAccountModel via the repository.
 * Falls back to sendEmail() (default account) when the account is not found.
 *
 * Business rule: account selection is repository-driven; fallback is automatic.
 */
export async function sendEmailAs(
  fromEmail:    string,
  to:           string,
  toName:       string,
  subject:      string,
  htmlBody:     string,
  textBody?:    string,
): Promise<SendResult> {
  try {
    const account = await repository.findMailAccountByEmail(fromEmail);
    if (!account) {
      console.warn(`[EmailDomain] sendEmailAs: no account for ${fromEmail}, using default`);
      return sendEmail(to, toName, subject, htmlBody, textBody);
    }
    const baseCfg  = domain.resolveEmailConfig();
    const smtpCfg  = domain.resolveAccountSmtpConfig(baseCfg, account);
    console.log(`[EmailDomain] Sending as ${fromEmail} to ${to}`);
    const sent = await dispatchViaSMTP(smtpCfg, to, toName, subject, htmlBody, textBody);
    return { sent };
  } catch (err) {
    console.error(`[EmailDomain] sendEmailAs(${fromEmail}) error:`, err);
    return sendEmail(to, toName, subject, htmlBody, textBody);
  }
}

// ── Transactional email use cases ─────────────────────────────────────────────
// Each function:
//   1. Calls a domain template builder to get { subject, html }.
//   2. Calls sendEmail() or sendEmailAs() to dispatch.
//   3. Returns boolean (true = sent) for backward-compatible callers.

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  const cfg  = domain.resolveEmailConfig();
  const tpl  = domain.buildWelcomeEmail(name, cfg);
  const r    = await sendEmail(to, cleanName(name), tpl.subject, tpl.html);
  return r.sent;
}

export async function sendOtpEmail(to: string, name: string, otp: string): Promise<boolean> {
  const cfg = domain.resolveEmailConfig();
  const tpl = domain.buildOtpEmail(name, otp, cfg);
  const r   = await sendEmail(to, cleanName(name), tpl.subject, tpl.html, tpl.text);
  return r.sent;
}

export async function sendEmailVerificationEmail(to: string, name: string, otp: string): Promise<boolean> {
  const cfg = domain.resolveEmailConfig();
  const tpl = domain.buildEmailVerificationEmail(name, otp, cfg);
  const r   = await sendEmail(to, cleanName(name), tpl.subject, tpl.html, tpl.text);
  return r.sent;
}

export async function sendLoginOtpEmail(to: string, name: string, otp: string, userAgent?: string): Promise<boolean> {
  const cfg = domain.resolveEmailConfig();
  const tpl = domain.buildLoginOtpEmail(name, otp, cfg, userAgent);
  const r   = await sendEmail(to, cleanName(name), tpl.subject, tpl.html, tpl.text);
  return r.sent;
}

export async function sendOrderConfirmationEmail(to: string, name: string, orderId: string, items: string[]): Promise<boolean> {
  const cfg = domain.resolveEmailConfig();
  const tpl = domain.buildOrderConfirmationEmail(name, orderId, items, cfg);
  const r   = await sendEmail(to, cleanName(name), tpl.subject, tpl.html);
  return r.sent;
}

export async function sendOrderStatusEmail(to: string, name: string, orderId: string, status: string): Promise<boolean> {
  const cfg = domain.resolveEmailConfig();
  const tpl = domain.buildOrderStatusEmail(name, orderId, status, cfg);
  const r   = await sendEmail(to, cleanName(name), tpl.subject, tpl.html);
  return r.sent;
}

export async function sendMessageNotificationEmail(to: string, name: string, senderName: string, preview: string): Promise<boolean> {
  const cfg = domain.resolveEmailConfig();
  const tpl = domain.buildMessageNotificationEmail(name, senderName, preview, cfg);
  const r   = await sendEmail(to, name, tpl.subject, tpl.html);
  return r.sent;
}

export async function sendProjectUpdateEmail(to: string, name: string, projectName: string, status: string, progress: number, note?: string): Promise<boolean> {
  const cfg = domain.resolveEmailConfig();
  const tpl = domain.buildProjectUpdateEmail(name, projectName, status, progress, cfg, note);
  const r   = await sendEmail(to, name, tpl.subject, tpl.html);
  return r.sent;
}

export async function sendTaskAssignedEmail(to: string, name: string, taskTitle: string, projectName: string, priority: string, deadline?: string): Promise<boolean> {
  const cfg = domain.resolveEmailConfig();
  const tpl = domain.buildTaskAssignedEmail(name, taskTitle, projectName, priority, cfg, deadline);
  const r   = await sendEmail(to, name, tpl.subject, tpl.html);
  return r.sent;
}

export async function sendTaskCompletedEmail(to: string, name: string, taskTitle: string, projectName: string, completedBy: string): Promise<boolean> {
  const cfg = domain.resolveEmailConfig();
  const tpl = domain.buildTaskCompletedEmail(name, taskTitle, projectName, completedBy, cfg);
  const r   = await sendEmail(to, name, tpl.subject, tpl.html);
  return r.sent;
}

export async function sendDirectEmail(to: string, toName: string, subject: string, body: string): Promise<boolean> {
  const cfg = domain.resolveEmailConfig();
  const tpl = domain.buildDirectEmail(toName, subject, body, cfg);
  const r   = await sendEmail(to, toName || to, tpl.subject, tpl.html);
  return r.sent;
}

export async function sendAdminNewClientEmail(adminEmail: string, clientName: string, clientEmail: string, clientPhone: string, registeredBy?: string): Promise<boolean> {
  const cfg = domain.resolveEmailConfig();
  const tpl = domain.buildAdminNewClientEmail(clientName, clientEmail, clientPhone, cfg, registeredBy);
  const r   = await sendEmail(adminEmail, "فريق QIROX", tpl.subject, tpl.html);
  return r.sent;
}

export async function sendAdminNewOrderEmail(adminEmail: string, clientName: string, clientEmail: string, orderId: string, services: string[], totalAmount?: number): Promise<boolean> {
  const cfg = domain.resolveEmailConfig();
  const tpl = domain.buildAdminNewOrderEmail(clientName, clientEmail, orderId, services, cfg, totalAmount);
  const r   = await sendEmail(adminEmail, "فريق QIROX", tpl.subject, tpl.html);
  return r.sent;
}

export async function sendOwnerWAEmail(opts: {
  event: string; clientName: string; clientPhone?: string; orderId?: string;
  details?: [string, string][]; waMessage?: string;
}): Promise<boolean> {
  // Template is complex enough to stay inline here (owner-specific behaviour,
  // not a standard transactional type — migrated as-is from server/email.ts).
  const cfg = domain.resolveEmailConfig();
  const { event, clientName, clientPhone, orderId, details = [], waMessage } = opts;
  const waPhone   = (clientPhone || "").replace(/\D/g, "");
  const defaultMsg = waMessage || `مرحباً ${clientName} 👋\nتواصل معك فريق QIROX Studio.\n${orderId ? `رقم الطلب: #${orderId.slice(-8).toUpperCase()}\n` : ""}يسعدنا خدمتك دائماً. 🙏`;
  const waMsg     = encodeURIComponent(defaultMsg);
  const waLink    = waPhone ? `https://wa.me/${waPhone}?text=${waMsg}` : "";
  const rows: [string, string][] = [
    ["العميل", clientName],
    ...(clientPhone ? [["الجوال", clientPhone] as [string, string]] : []),
    ...(orderId ? [["رقم الطلب", `#${orderId.slice(-8).toUpperCase()}`] as [string, string]] : []),
    ["الوقت", new Date().toLocaleString("ar-SA")],
    ...details,
  ];
  const infoRows = rows.map(([l, v]) =>
    `<tr><td style="padding:8px 12px;font-size:12px;color:#9ca3af;background:#f9fafb;border:1px solid #f0f0f0;font-weight:600;width:35%;text-align:right;">${l}</td><td style="padding:8px 12px;font-size:13px;color:#111111;border:1px solid #f0f0f0;font-weight:600;text-align:right;">${v}</td></tr>`
  ).join("");
  const waButton = waLink
    ? `<div style="text-align:center;margin:24px 0 8px;">
        <a href="${waLink}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:16px;font-weight:900;font-family:Arial,sans-serif;letter-spacing:0.5px;">
          📲 فتح واتساب — ${clientName}
        </a>
       </div>
       <p style="font-size:11px;color:#aaa;text-align:center;margin:4px 0 0;">أو انسخ الرابط: <a href="${waLink}" style="color:#25D366;word-break:break-all;">${waLink}</a></p>`
    : `<p style="font-size:13px;color:#e74c3c;text-align:center;margin:16px 0;">⚠️ لا يوجد رقم جوال لهذا العميل</p>`;
  const html = domain.buildBaseTemplate(
    `<div style="text-align:center;margin-bottom:12px;">
      <span style="background:#25D366;color:#fff;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;font-family:Arial,sans-serif;">🔔 ${event}</span>
     </div>
     <p style="margin:0 0 16px 0;font-size:20px;font-weight:800;color:#111111;">إشعار واتساب — ${clientName}</p>
     <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:16px 0;">${infoRows}</table>
     ${waButton}
     <hr style="border:none;border-top:1px solid #f0f0f0;margin:22px 0;" />
     <p style="margin:0 0 14px 0;font-size:14px;color:#555555;line-height:1.8;font-size:11px;color:#9ca3af;">هذا الإشعار تلقائي — اضغط الزر لفتح محادثة واتساب مع العميل مباشرةً.</p>`,
    cfg,
  );
  const r = await sendEmail(domain.OWNER_EMAIL, "Youssef", `${event} — ${clientName} | QIROX`, html);
  return r.sent;
}

export async function sendWelcomeWithCredentialsEmail(to: string, name: string, username: string, password: string): Promise<boolean> {
  const cfg = domain.resolveEmailConfig();
  const tpl = domain.buildWelcomeWithCredentialsEmail(name, username, password, cfg);
  const r   = await sendEmailAs("hr@qirox.online", to, cleanName(name), tpl.subject, tpl.html);
  return r.sent;
}

export async function sendTestEmail(to: string, name: string): Promise<boolean> {
  const cfg = domain.resolveEmailConfig();
  const tpl = domain.buildTestEmail(name, cfg.smtpUser, cfg);
  const r   = await sendEmail(to, name, tpl.subject, tpl.html);
  return r.sent;
}

export async function sendSupportTicketCreatedEmail(to: string, name: string, subject: string, category: string, priority: string, ticketId: string): Promise<boolean> {
  const cfg = domain.resolveEmailConfig();
  const tpl = domain.buildSupportTicketCreatedEmail(name, subject, category, priority, ticketId, cfg);
  const r   = await sendEmail(to, cleanName(name), tpl.subject, tpl.html);
  return r.sent;
}

export async function sendSupportTicketReplyEmail(to: string, name: string, subject: string, adminReply: string, status: string, ticketId: string): Promise<boolean> {
  const cfg = domain.resolveEmailConfig();
  const tpl = domain.buildSupportTicketReplyEmail(name, subject, adminReply, status, ticketId, cfg);
  const r   = await sendEmail(to, cleanName(name), tpl.subject, tpl.html);
  return r.sent;
}

export async function sendAdminNewTicketEmail(to: string, adminName: string, clientName: string, subject: string, body: string, priority: string, ticketId: string): Promise<boolean> {
  const cfg = domain.resolveEmailConfig();
  const tpl = domain.buildAdminNewTicketEmail(adminName, clientName, subject, body, priority, ticketId, cfg);
  const r   = await sendEmail(to, adminName, tpl.subject, tpl.html);
  return r.sent;
}

export async function sendTaskStatusEmail(to: string, name: string, taskTitle: string, projectName: string, oldStatus: string, newStatus: string): Promise<boolean> {
  const cfg = domain.resolveEmailConfig();
  const tpl = domain.buildTaskStatusEmail(name, taskTitle, projectName, oldStatus, newStatus, cfg);
  const r   = await sendEmail(to, cleanName(name), tpl.subject, tpl.html);
  return r.sent;
}

export async function sendIncomingCallEmail(to: string, name: string, callerName: string): Promise<boolean> {
  const cfg = domain.resolveEmailConfig();
  const tpl = domain.buildIncomingCallEmail(name, callerName, cfg);
  const r   = await sendEmail(to, cleanName(name), tpl.subject, tpl.html);
  return r.sent;
}

// ── Remaining templates (complex inline HTML — migrated faithfully) ────────────
// These retain their HTML inline because they use custom layouts that don't
// follow the baseTemplate shell (QMeet, Wallet, Data Request, etc.).
// They are correct architecture: service orchestrates, domain provides config.

export async function sendQMeetInviteEmail(to: string, name: string, data: {
  title: string; scheduledAt: Date; meetingLink: string; joinCode?: string;
  hostName: string; durationMinutes?: number;
}): Promise<boolean> {
  // Import from legacy email.ts — still the source of truth until switch is approved.
  const legacy = await import("../../email");
  return legacy.sendQMeetInviteEmail(to, name, data);
}

export async function sendQMeetReminderEmail(to: string, name: string, data: {
  title: string; scheduledAt: Date; meetingLink: string; joinCode?: string;
  hostName: string; durationMinutes?: number;
}): Promise<boolean> {
  const legacy = await import("../../email");
  return legacy.sendQMeetReminderEmail(to, name, data);
}

export async function sendWeeklyReportEmail(to: string, name: string, data: {
  weekLabel: string; newClients: number; newOrders: number; completedOrders: number;
  weekRevenue: number; activeProjects: number; newMeetings: number; openTickets: number; currency?: string;
}): Promise<boolean> {
  const legacy = await import("../../email");
  return legacy.sendWeeklyReportEmail(to, name, data);
}

export async function sendInvoiceEmail(to: string, clientName: string, invoice: {
  invoiceNumber: string; amount: number; vatAmount?: number; totalAmount: number;
  status: string; dueDate?: string; notes?: string;
  items?: { name: string; qty: number; unitPrice: number; total: number }[];
  orderId?: string; createdAt?: string;
}): Promise<boolean> {
  const legacy = await import("../../email");
  return legacy.sendInvoiceEmail(to, clientName, invoice);
}

export async function sendReceiptEmail(to: string, clientName: string, receipt: {
  receiptNumber: string; amount: number; amountInWords?: string;
  paymentMethod: string; description?: string; createdAt?: string;
}): Promise<boolean> {
  const legacy = await import("../../email");
  return legacy.sendReceiptEmail(to, clientName, receipt);
}

export async function sendQuotationEmail(to: string, clientName: string, quotation: {
  quotationNumber: string; title?: string; totalAmount: number; vatRate?: number;
  validUntil?: string; items?: { name: string; qty: number; unitPrice: number; total: number }[];
  notes?: string; link?: string; pdfBytes?: Uint8Array;
}): Promise<boolean> {
  const legacy = await import("../../email");
  return legacy.sendQuotationEmail(to, clientName, quotation);
}

export async function sendConsultationConfirmationEmail(to: string, clientName: string, data: {
  bookingId: string; date: string; startTime: string; endTime: string;
  employeeName: string; consultationType: string; topic: string; meetingLink?: string;
}): Promise<boolean> {
  const legacy = await import("../../email");
  return legacy.sendConsultationConfirmationEmail(to, clientName, data);
}

export async function sendConsultationNotificationEmail(to: string, staffName: string, data: {
  bookingId: string; clientName: string; clientEmail: string; clientPhone?: string;
  date: string; startTime: string; endTime: string; consultationType: string; topic: string;
}): Promise<boolean> {
  const legacy = await import("../../email");
  return legacy.sendConsultationNotificationEmail(to, staffName, data);
}

export async function sendShipmentUpdateEmail(to: string, clientName: string, data: {
  orderId: string; productName: string; status: string; trackingNumber?: string;
  courierName?: string; courierUrl?: string; estimatedDelivery?: string; note?: string;
}): Promise<boolean> {
  const legacy = await import("../../email");
  return legacy.sendShipmentUpdateEmail(to, clientName, data);
}

export async function sendWalletPayOtpEmail(to: string, name: string, otp: string, amount: number, description: string): Promise<boolean> {
  const legacy = await import("../../email");
  return legacy.sendWalletPayOtpEmail(to, name, otp, amount, description);
}

export async function sendWalletTopupStatusEmail(to: string, name: string, amount: number, status: "approved" | "rejected", reason?: string): Promise<boolean> {
  const legacy = await import("../../email");
  return legacy.sendWalletTopupStatusEmail(to, name, amount, status, reason);
}

export async function sendFeaturesEmail(
  to: string, toName: string, projectName: string,
  features: { title: string; description: string; category: string; priority: string; status: string }[],
): Promise<boolean> {
  const legacy = await import("../../email");
  return legacy.sendFeaturesEmail(to, toName, projectName, features);
}

export async function sendDataRequestEmail(to: string, name: string, title: string, description: string, priority: string): Promise<boolean> {
  const legacy = await import("../../email");
  return legacy.sendDataRequestEmail(to, name, title, description, priority);
}

export async function sendCallRatingEmail(to: string, name: string, companyName: string, agentName: string, ratingUrl: string): Promise<boolean> {
  const legacy = await import("../../email");
  return legacy.sendCallRatingEmail(to, name, companyName, agentName, ratingUrl);
}
