// ── Email Domain Types ────────────────────────────────────────────────────────
// All domain contracts for the transactional email module.
//
// Purpose:
//   Provide typed interfaces for email entities and DTOs so every layer
//   (repository, domain, service, controller) shares the same vocabulary.
//
// Responsibilities:
//   - Infrastructure types: SMTP config, attachments, raw send options.
//   - Input types consumed by the service layer for each email category.
//   - Output types returned to the controller layer.
//
// Scope (Migration 009):
//   Transactional email only — welcome, OTP, verification, notifications,
//   and marketing template foundation.
//   Out of scope: CRM, Mail Accounts, IMAP, SMTP infrastructure management.
//
// Future migration role:
//   These types will be the source of truth for OpenAPI schema generation
//   once the validation layer is wired (Migration 010+).

// ── Infrastructure types ───────────────────────────────────────────────────────

/** Resolved SMTP configuration used to create a nodemailer transporter. */
export interface SmtpConfig {
  host:       string;
  port:       number;
  secure:     boolean;
  user:       string;
  pass:       string;
  senderName: string;
}

/** Base email configuration resolved from connManager + environment variables. */
export interface EmailConfig {
  senderName: string;
  siteUrl:    string;
  logoUrl:    string;
  smtpHost:   string;
  smtpPort:   number;
  smtpUser:   string;
  smtpPass:   string;
  smtpSecure: boolean;
}

/** A file attachment included in an outbound email. */
export interface EmailAttachment {
  filename: string;
  /** Base64-encoded file content. */
  fileblob: string;
  mimetype: string;
}

// ── Raw send input ─────────────────────────────────────────────────────────────

/** Everything required to dispatch a single email via the SMTP infrastructure. */
export interface SendEmailInput {
  to:           string;
  toName:       string;
  subject:      string;
  htmlBody:     string;
  textBody?:    string;
  attachments?: EmailAttachment[];
}

// ── Per-template input types ───────────────────────────────────────────────────

/** Input for the welcome email sent on account creation. */
export interface WelcomeEmailInput {
  to:   string;
  name: string;
}

/** Input for OTP-based password reset emails. */
export interface OtpEmailInput {
  to:   string;
  name: string;
  otp:  string;
}

/** Input for account email-verification OTP emails. */
export interface EmailVerificationInput {
  to:   string;
  name: string;
  otp:  string;
}

/** Input for 2FA device-login OTP emails. */
export interface LoginOtpEmailInput {
  to:         string;
  name:       string;
  otp:        string;
  userAgent?: string;
}

/** Input for order confirmation notifications sent to the client. */
export interface OrderConfirmationEmailInput {
  to:      string;
  name:    string;
  orderId: string;
  items:   string[];
}

/** Input for order status change notifications. */
export interface OrderStatusEmailInput {
  to:      string;
  name:    string;
  orderId: string;
  status:  string;
}

/** Input for new in-app message notifications. */
export interface MessageNotificationEmailInput {
  to:         string;
  name:       string;
  senderName: string;
  preview:    string;
}

/** Input for project status/progress update notifications. */
export interface ProjectUpdateEmailInput {
  to:          string;
  name:        string;
  projectName: string;
  status:      string;
  progress:    number;
  note?:       string;
}

/** Input for task-assigned notifications sent to the assignee. */
export interface TaskAssignedEmailInput {
  to:          string;
  name:        string;
  taskTitle:   string;
  projectName: string;
  priority:    string;
  deadline?:   string;
}

/** Input for task-completed notifications sent to the project owner. */
export interface TaskCompletedEmailInput {
  to:          string;
  name:        string;
  taskTitle:   string;
  projectName: string;
  completedBy: string;
}

/** A single feature row used in the features summary email. */
export interface FeatureRow {
  title:       string;
  description: string;
  category:    string;
  priority:    string;
  status:      string;
}

/** Input for the project features summary email. */
export interface FeaturesEmailInput {
  to:          string;
  toName:      string;
  projectName: string;
  features:    FeatureRow[];
}

/** Input for a freeform broadcast/direct email. */
export interface DirectEmailInput {
  to:      string;
  toName:  string;
  subject: string;
  body:    string;
}

/** Input for admin notification of a new client registration. */
export interface AdminNewClientEmailInput {
  adminEmail:    string;
  clientName:    string;
  clientEmail:   string;
  clientPhone:   string;
  registeredBy?: string;
}

/** Input for admin notification of a new order. */
export interface AdminNewOrderEmailInput {
  adminEmail:   string;
  clientName:   string;
  clientEmail:  string;
  orderId:      string;
  services:     string[];
  totalAmount?: number;
}

/** Options for the owner WhatsApp notification email. */
export interface OwnerWAEmailInput {
  event:        string;
  clientName:   string;
  clientPhone?: string;
  orderId?:     string;
  details?:     [string, string][];
  waMessage?:   string;
}

/** Input for welcome email that includes login credentials (employee onboarding). */
export interface WelcomeWithCredentialsEmailInput {
  to:       string;
  name:     string;
  username: string;
  password: string;
}

/** Invoice data shape for the invoice email. */
export interface InvoiceEmailInput {
  to:         string;
  clientName: string;
  invoice: {
    invoiceNumber: string;
    amount:        number;
    vatAmount?:    number;
    totalAmount:   number;
    status:        string;
    dueDate?:      string;
    notes?:        string;
    items?:        { name: string; qty: number; unitPrice: number; total: number }[];
    orderId?:      string;
    createdAt?:    string;
  };
}

/** Receipt data shape for the receipt email. */
export interface ReceiptEmailInput {
  to:         string;
  clientName: string;
  receipt: {
    receiptNumber:  string;
    amount:         number;
    amountInWords?: string;
    paymentMethod:  string;
    description?:   string;
    createdAt?:     string;
  };
}

/** Quotation data shape for the quotation email. */
export interface QuotationEmailInput {
  to:         string;
  clientName: string;
  quotation: {
    quotationNumber: string;
    title?:          string;
    totalAmount:     number;
    vatRate?:        number;
    validUntil?:     string;
    items?:          { name: string; qty: number; unitPrice: number; total: number }[];
    notes?:          string;
    link?:           string;
    pdfBytes?:       Uint8Array;
  };
}

/** Input for consultation confirmation sent to the client. */
export interface ConsultationConfirmationEmailInput {
  to:         string;
  clientName: string;
  data: {
    bookingId:        string;
    date:             string;
    startTime:        string;
    endTime:          string;
    employeeName:     string;
    consultationType: string;
    topic:            string;
    meetingLink?:     string;
  };
}

/** Input for consultation booking notification sent to staff. */
export interface ConsultationNotificationEmailInput {
  to:        string;
  staffName: string;
  data: {
    bookingId:        string;
    clientName:       string;
    clientEmail:      string;
    clientPhone?:     string;
    date:             string;
    startTime:        string;
    endTime:          string;
    consultationType: string;
    topic:            string;
  };
}

/** Input for shipment status update emails. */
export interface ShipmentUpdateEmailInput {
  to:         string;
  clientName: string;
  data: {
    orderId:           string;
    productName:       string;
    status:            string;
    trackingNumber?:   string;
    courierName?:      string;
    courierUrl?:       string;
    estimatedDelivery?: string;
    note?:             string;
  };
}

/** Input for QMeet meeting invite / reminder emails. */
export interface QMeetEmailInput {
  to:   string;
  name: string;
  data: {
    title:           string;
    scheduledAt:     Date;
    meetingLink:     string;
    joinCode?:       string;
    hostName:        string;
    durationMinutes?: number;
  };
}

/** Input for the weekly analytics digest email. */
export interface WeeklyReportEmailInput {
  to:   string;
  name: string;
  data: {
    weekLabel:       string;
    newClients:      number;
    newOrders:       number;
    completedOrders: number;
    weekRevenue:     number;
    activeProjects:  number;
    newMeetings:     number;
    openTickets:     number;
    currency?:       string;
  };
}

/** Input for wallet payment OTP email. */
export interface WalletPayOtpEmailInput {
  to:          string;
  name:        string;
  otp:         string;
  amount:      number;
  description: string;
}

/** Input for wallet top-up status email. */
export interface WalletTopupStatusEmailInput {
  to:      string;
  name:    string;
  amount:  number;
  status:  "approved" | "rejected";
  reason?: string;
}

/** Input for support ticket creation confirmation. */
export interface SupportTicketCreatedEmailInput {
  to:       string;
  name:     string;
  subject:  string;
  category: string;
  priority: string;
  ticketId: string;
}

/** Input for support ticket reply notification. */
export interface SupportTicketReplyEmailInput {
  to:         string;
  name:       string;
  subject:    string;
  adminReply: string;
  status:     string;
  ticketId:   string;
}

/** Input for admin notification of a new support ticket. */
export interface AdminNewTicketEmailInput {
  to:         string;
  adminName:  string;
  clientName: string;
  subject:    string;
  body:       string;
  priority:   string;
  ticketId:   string;
}

/** Input for a task status change notification. */
export interface TaskStatusEmailInput {
  to:          string;
  name:        string;
  taskTitle:   string;
  projectName: string;
  oldStatus:   string;
  newStatus:   string;
}

/** Input for missed incoming call notification. */
export interface IncomingCallEmailInput {
  to:         string;
  name:       string;
  callerName: string;
}

/** Input for a data request sent to a client. */
export interface DataRequestEmailInput {
  to:          string;
  name:        string;
  title:       string;
  description: string;
  priority:    string;
}

/** Input for post-call rating request email. */
export interface CallRatingEmailInput {
  to:          string;
  name:        string;
  companyName: string;
  agentName:   string;
  ratingUrl:   string;
}

/** Input for test email (admin SMTP verification). */
export interface TestEmailInput {
  to:   string;
  name: string;
}

// ── Output types ──────────────────────────────────────────────────────────────

/** Uniform result returned by all service send* functions. */
export interface SendResult {
  sent: boolean;
}

// ── Repository types ──────────────────────────────────────────────────────────

/**
 * Minimal shape of a MailAccount document as used by this domain.
 * We only read from the model — no writes are performed here.
 */
export interface MailAccountRecord {
  emailAddress: string;
  displayName?: string;
  smtpHost?:    string;
  smtpPort?:    number;
  password?:    string;
}
