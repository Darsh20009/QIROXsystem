// ── Mail Domain Types ─────────────────────────────────────────────────────────
// All domain contracts for the Mail module.
//
// Purpose:
//   Provide typed interfaces for Mail entities and DTOs so every layer
//   (repository, service, controller) shares the same vocabulary.
//
// Scope:
//   Corporate IMAP/SMTP mail management for employees.
//   Transactional email (server/email.ts) is a separate concern and is NOT
//   part of this domain.

// ── Entity types ──────────────────────────────────────────────────────────────

/**
 * A mail account as stored in MongoDB.
 * Passwords are ALWAYS present here — they must be stripped before
 * any value leaves the service layer.
 */
export interface MailAccountEntity {
  _id:            string;
  emailAddress:   string;
  password:       string;
  displayName:    string;
  jobTitle:       string;
  imapHost:       string;
  imapPort:       number;
  smtpHost:       string;
  smtpPort:       number;
  assignedUserId: string | null;
  assignedUserIds: string[];
  isShared:       boolean;
  sharedWith:     string[];
  createdAt?:     Date | string;
  updatedAt?:     Date | string;
}

/** A cached email message stored in MailCacheModel. */
export interface MailCacheEntity {
  _id?:       string;
  accountId:  string;
  folder:     string;
  uid:        number;
  subject:    string;
  from:       string;
  to:         string;
  date:       Date | null;
  seen:       boolean;
  html:       string;
  text:       string;
  snippet:    string;
}

/** A single email message as returned to clients. */
export interface EmailMessage {
  uid:     number;
  subject: string;
  from:    string;
  to:      string;
  date:    Date | null;
  seen:    boolean;
  html:    string;
  text:    string;
  snippet: string;
  folder:  string;
}

// ── Response types (password-stripped) ────────────────────────────────────────

/**
 * A mail account safe to return to non-admin users.
 * Password is always absent.
 */
export interface SafeMailAccount {
  id:             string;
  emailAddress:   string;
  displayName:    string;
  jobTitle:       string;
  imapHost:       string;
  imapPort:       number;
  smtpHost:       string;
  smtpPort:       number;
  assignedUserId: string | null;
  assignedUserIds: string[];
  isShared:       boolean;
  sharedWith:     string[];
  createdAt?:     Date | string;
  updatedAt?:     Date | string;
}

/** Minimal user shape attached to an account in the admin list. */
export interface AssignedUserSummary {
  id:       string;
  fullName: string;
  role:     string;
}

/**
 * Admin-only account view — includes resolved assigned users.
 * Password is always absent.
 */
export interface AdminMailAccount extends SafeMailAccount {
  assignedUser:  AssignedUserSummary | null;
  assignedUsers: AssignedUserSummary[];
}

// ── Input types ───────────────────────────────────────────────────────────────

/** Input for creating a new mail account (POST /api/mail/accounts). */
export interface CreateMailAccountInput {
  emailAddress:   string;
  password:       string;
  displayName:    string;
  jobTitle:       string;
  imapHost:       string;
  imapPort:       number;
  smtpHost:       string;
  smtpPort:       number;
  isShared:       boolean;
  sharedWith:     string[];
  assignedUserIds: string[];
}

/** Input for updating an account (PUT /api/mail/accounts/:id). */
export interface UpdateMailAccountInput {
  assignedUserId?:  string | null;
  assignedUserIds?: string[];
  displayName?:     string;
  jobTitle?:        string;
  isShared?:        boolean;
  sharedWith?:      string[];
  password?:        string;
}

/** Credentials for testing an IMAP/SMTP connection. */
export interface MailConnectionCreds {
  emailAddress: string;
  password:     string;
  imapHost:     string;
  imapPort:     number;
  smtpHost:     string;
  smtpPort:     number;
}

/** Result of a connection test. */
export interface ConnectionTestResult {
  imap:       boolean;
  smtp:       boolean;
  imapError?: string;
  smtpError?: string;
}

/** Input for sending mail from an account (POST /api/mail/send). */
export interface SendMailInput {
  accountId:   string;
  to:          string;
  cc?:         string;
  subject:     string;
  body:        string;
  attachments: SendMailAttachment[];
}

export interface SendMailAttachment {
  filename:    string;
  content:     string;
  contentType: string;
  encoding?:   string;
}

// ── Auth types ────────────────────────────────────────────────────────────────

/**
 * Minimal user shape required by Mail domain logic.
 * Extracted from req.user so the domain never imports Express types.
 */
export interface MailUser {
  _id:  string;
  role: string;
}
