// ── Legacy Email Infrastructure Adapter ───────────────────────────────────────
// ADR reference: ADR-003
// Tech Debt:     TECH-001, TECH-002
//
// Purpose:
//   Provide a static, typed boundary between the email domain service layer
//   and the legacy server/email.ts monolith.
//
// Why this file exists:
//   Eight transactional email templates have complex, custom HTML layouts
//   (QMeet, Wallet, invoices, quotations, consultations, shipment, etc.)
//   that were not migrated into domain.ts template builders during Migration 009
//   due to scope constraints. Rather than using dynamic `import()` inside the
//   service layer — which is prohibited by the domain architecture rules —
//   this adapter imports from the legacy module statically and re-exports
//   the needed functions under domain-compatible signatures.
//
// Architecture rule:
//   The domain service layer (service.ts) MUST NOT import from server/email.ts
//   directly or via dynamic import. All legacy delegation goes through this
//   adapter so the dependency is explicit, visible, and easy to delete.
//
// Removal plan (TECH-001):
//   Each function in this adapter is a migration target. As template builders
//   are added to domain.ts, the corresponding adapter export is deleted.
//   When the adapter is empty, it is deleted entirely.
//   Target: Migration 011 (full template migration).
//
// Rollback:
//   Zero impact. This adapter wraps the same code that was already running.
//   Removing this adapter restores to dynamic imports (one line per function).

import {
  sendQMeetInviteEmail        as _sendQMeetInviteEmail,
  sendQMeetReminderEmail      as _sendQMeetReminderEmail,
  sendWeeklyReportEmail       as _sendWeeklyReportEmail,
  sendInvoiceEmail            as _sendInvoiceEmail,
  sendReceiptEmail            as _sendReceiptEmail,
  sendQuotationEmail          as _sendQuotationEmail,
  sendConsultationConfirmationEmail  as _sendConsultationConfirmationEmail,
  sendConsultationNotificationEmail  as _sendConsultationNotificationEmail,
  sendShipmentUpdateEmail     as _sendShipmentUpdateEmail,
  sendWalletPayOtpEmail       as _sendWalletPayOtpEmail,
  sendWalletTopupStatusEmail  as _sendWalletTopupStatusEmail,
  sendFeaturesEmail           as _sendFeaturesEmail,
  sendDataRequestEmail        as _sendDataRequestEmail,
  sendCallRatingEmail         as _sendCallRatingEmail,
} from "../../../email";

// ── Re-exports with explicit types ────────────────────────────────────────────
// Each export matches the service.ts call signature exactly.
// TECH-001: Replace each with a domain.ts builder + service dispatch when ready.

/** TECH-001 — QMeet invite template not yet migrated to domain.ts */
export async function sendQMeetInviteEmail(
  to: string, name: string,
  data: { title: string; scheduledAt: Date; meetingLink: string; joinCode?: string; hostName: string; durationMinutes?: number },
): Promise<boolean> {
  return _sendQMeetInviteEmail(to, name, data);
}

/** TECH-001 — QMeet reminder template not yet migrated to domain.ts */
export async function sendQMeetReminderEmail(
  to: string, name: string,
  data: { title: string; scheduledAt: Date; meetingLink: string; joinCode?: string; hostName: string; durationMinutes?: number },
): Promise<boolean> {
  return _sendQMeetReminderEmail(to, name, data);
}

/** TECH-001 — Weekly report template not yet migrated to domain.ts */
export async function sendWeeklyReportEmail(
  to: string, name: string,
  data: { weekLabel: string; newClients: number; newOrders: number; completedOrders: number; weekRevenue: number; activeProjects: number; newMeetings: number; openTickets: number; currency?: string },
): Promise<boolean> {
  return _sendWeeklyReportEmail(to, name, data);
}

/** TECH-001 — Invoice template not yet migrated to domain.ts */
export async function sendInvoiceEmail(
  to: string, clientName: string,
  invoice: { invoiceNumber: string; amount: number; vatAmount?: number; totalAmount: number; status: string; dueDate?: string; notes?: string; items?: { name: string; qty: number; unitPrice: number; total: number }[]; orderId?: string; createdAt?: string },
): Promise<boolean> {
  return _sendInvoiceEmail(to, clientName, invoice);
}

/** TECH-001 — Receipt template not yet migrated to domain.ts */
export async function sendReceiptEmail(
  to: string, clientName: string,
  receipt: { receiptNumber: string; amount: number; amountInWords?: string; paymentMethod: string; description?: string; createdAt?: string },
): Promise<boolean> {
  return _sendReceiptEmail(to, clientName, receipt);
}

/** TECH-001 — Quotation template (with PDF attachment) not yet migrated to domain.ts */
export async function sendQuotationEmail(
  to: string, clientName: string,
  quotation: { quotationNumber: string; title?: string; totalAmount: number; vatRate?: number; validUntil?: string; items?: { name: string; qty: number; unitPrice: number; total: number }[]; notes?: string; link?: string; pdfBytes?: Uint8Array },
): Promise<boolean> {
  return _sendQuotationEmail(to, clientName, quotation);
}

/** TECH-001 — Consultation confirmation template not yet migrated to domain.ts */
export async function sendConsultationConfirmationEmail(
  to: string, clientName: string,
  data: { bookingId: string; date: string; startTime: string; endTime: string; employeeName: string; consultationType: string; topic: string; meetingLink?: string },
): Promise<boolean> {
  return _sendConsultationConfirmationEmail(to, clientName, data);
}

/** TECH-001 — Consultation staff notification template not yet migrated to domain.ts */
export async function sendConsultationNotificationEmail(
  to: string, staffName: string,
  data: { bookingId: string; clientName: string; clientEmail: string; clientPhone?: string; date: string; startTime: string; endTime: string; consultationType: string; topic: string },
): Promise<boolean> {
  return _sendConsultationNotificationEmail(to, staffName, data);
}

/** TECH-001 — Shipment update template not yet migrated to domain.ts */
export async function sendShipmentUpdateEmail(
  to: string, clientName: string,
  data: { orderId: string; productName: string; status: string; trackingNumber?: string; courierName?: string; courierUrl?: string; estimatedDelivery?: string; note?: string },
): Promise<boolean> {
  return _sendShipmentUpdateEmail(to, clientName, data);
}

/** TECH-001 — Wallet Pay OTP template (custom dark layout) not yet migrated to domain.ts */
export async function sendWalletPayOtpEmail(
  to: string, name: string, otp: string, amount: number, description: string,
): Promise<boolean> {
  return _sendWalletPayOtpEmail(to, name, otp, amount, description);
}

/** TECH-001 — Wallet top-up status template (custom dark layout) not yet migrated to domain.ts */
export async function sendWalletTopupStatusEmail(
  to: string, name: string, amount: number, status: "approved" | "rejected", reason?: string,
): Promise<boolean> {
  return _sendWalletTopupStatusEmail(to, name, amount, status, reason);
}

/** TECH-001 — Features table email not yet migrated to domain.ts */
export async function sendFeaturesEmail(
  to: string, toName: string, projectName: string,
  features: { title: string; description: string; category: string; priority: string; status: string }[],
): Promise<boolean> {
  return _sendFeaturesEmail(to, toName, projectName, features);
}

/** TECH-001 — Data request template (custom card layout) not yet migrated to domain.ts */
export async function sendDataRequestEmail(
  to: string, name: string, title: string, description: string, priority: string,
): Promise<boolean> {
  return _sendDataRequestEmail(to, name, title, description, priority);
}

/** TECH-001 — Call rating template not yet migrated to domain.ts */
export async function sendCallRatingEmail(
  to: string, name: string, companyName: string, agentName: string, ratingUrl: string,
): Promise<boolean> {
  return _sendCallRatingEmail(to, name, companyName, agentName, ratingUrl);
}
