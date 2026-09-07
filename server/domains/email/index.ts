// ── Email Domain — Public API ──────────────────────────────────────────────────
// Single import point for the email domain module.
//
// External code imports only from this barrel.
// Internal layers import directly from their sibling files.
//
// Exported surface (Migration 009):
//   registerEmailDomainRoutes — no-op in this migration; safe to call.
//   EmailService              — all transactional send* functions.
//   EmailDomain               — config resolution and template builders (for testing).
//
// How to switch a consumer from server/email.ts to this domain:
//
//   Before:
//     import { sendWelcomeEmail } from "../../email";
//
//   After:
//     import { sendWelcomeEmail } from "../domains/email";
//
//   The function signatures are identical. Rollback is one line per file.
//
// Zero Downtime guarantee:
//   Importing this module has no side effects. The legacy server/email.ts
//   remains untouched and operational until QA approves the switch.

export { registerEmailDomainRoutes } from "./routes";

// ── Re-export all service functions (drop-in replacements for server/email.ts) ─
export {
  // Core primitives
  sendEmail,
  sendEmailAs,

  // Auth / OTP
  sendWelcomeEmail,
  sendOtpEmail,
  sendEmailVerificationEmail,
  sendLoginOtpEmail,

  // Orders & business
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendInvoiceEmail,
  sendReceiptEmail,
  sendQuotationEmail,

  // Project & task notifications
  sendMessageNotificationEmail,
  sendProjectUpdateEmail,
  sendTaskAssignedEmail,
  sendTaskCompletedEmail,
  sendTaskStatusEmail,
  sendFeaturesEmail,

  // Admin notifications
  sendAdminNewClientEmail,
  sendAdminNewOrderEmail,
  sendOwnerWAEmail,
  sendAdminNewTicketEmail,

  // Employee onboarding
  sendWelcomeWithCredentialsEmail,

  // Consultations & meetings
  sendConsultationConfirmationEmail,
  sendConsultationNotificationEmail,
  sendQMeetInviteEmail,
  sendQMeetReminderEmail,

  // Shipment
  sendShipmentUpdateEmail,

  // Wallet (Qirox Pay)
  sendWalletPayOtpEmail,
  sendWalletTopupStatusEmail,

  // Support
  sendSupportTicketCreatedEmail,
  sendSupportTicketReplyEmail,

  // Communication
  sendIncomingCallEmail,
  sendCallRatingEmail,

  // Broadcast / marketing foundation
  sendDirectEmail,

  // Data requests
  sendDataRequestEmail,

  // Analytics
  sendWeeklyReportEmail,

  // Admin tools
  sendTestEmail,
} from "./service";

// ── Types (for consumers outside the domain) ──────────────────────────────────
export type {
  EmailConfig,
  SmtpConfig,
  EmailAttachment,
  SendEmailInput,
  SendResult,
  WelcomeEmailInput,
  OtpEmailInput,
  EmailVerificationInput,
  LoginOtpEmailInput,
  OrderConfirmationEmailInput,
  OrderStatusEmailInput,
  MessageNotificationEmailInput,
  ProjectUpdateEmailInput,
  TaskAssignedEmailInput,
  TaskCompletedEmailInput,
  FeaturesEmailInput,
  FeatureRow,
  DirectEmailInput,
  AdminNewClientEmailInput,
  AdminNewOrderEmailInput,
  OwnerWAEmailInput,
  WelcomeWithCredentialsEmailInput,
  InvoiceEmailInput,
  ReceiptEmailInput,
  QuotationEmailInput,
  ConsultationConfirmationEmailInput,
  ConsultationNotificationEmailInput,
  ShipmentUpdateEmailInput,
  QMeetEmailInput,
  WeeklyReportEmailInput,
  WalletPayOtpEmailInput,
  WalletTopupStatusEmailInput,
  SupportTicketCreatedEmailInput,
  SupportTicketReplyEmailInput,
  AdminNewTicketEmailInput,
  TaskStatusEmailInput,
  IncomingCallEmailInput,
  DataRequestEmailInput,
  CallRatingEmailInput,
  TestEmailInput,
  MailAccountRecord,
} from "./types";
