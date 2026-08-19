// ── Mail Domain — Business Rules ──────────────────────────────────────────────
// Pure business logic for the Mail module.
//
// Rules encoded here:
//   BR-01  canAccessAccount     — which roles/users may access a mail account
//   BR-02  resolveCreateInput   — defaults applied to new account creation
//   BR-03  buildUpdateObject    — which fields are mutable, and how
//   BR-04  resolveTestCreds     — merge supplied overrides onto stored account
//   BR-05  DEFAULT_IMAP_HOST    — cPanel server default applied at creation
//
// No imports from Express, Mongoose, or infrastructure — pure TypeScript.

import type {
  MailAccountEntity,
  MailUser,
  CreateMailAccountInput,
  UpdateMailAccountInput,
} from "./types";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Default cPanel hosting server. */
export const DEFAULT_MAIL_HOST = "server222.web-hosting.com";
export const DEFAULT_IMAP_PORT = 993;
export const DEFAULT_SMTP_PORT = 465;

// ── BR-01: Access control ─────────────────────────────────────────────────────

/**
 * Determines whether `user` is allowed to access `account`.
 *
 * Rules (in priority order):
 *   1. Admin — always allowed.
 *   2. Legacy single-assignee (assignedUserId) — allowed if matches.
 *   3. Multi-assignee list (assignedUserIds) — allowed if user._id is in list.
 *   4. Shared account with matching role — allowed if account.isShared and
 *      account.sharedWith contains the user's role.
 *   5. CEO / CTO / Manager — allowed for any shared account.
 */
export function canAccessAccount(user: MailUser, account: MailAccountEntity): boolean {
  if (!user) return false;
  const role = user.role || "client";
  const uid = (user._id || "").toString();

  if (role === "admin") return true;

  if (account.assignedUserId && account.assignedUserId.toString() === uid) return true;

  if (
    Array.isArray(account.assignedUserIds) &&
    account.assignedUserIds.some((x: any) => String(x) === uid)
  ) return true;

  if (account.isShared && account.sharedWith?.includes(role)) return true;

  if (["ceo", "cto", "manager"].includes(role) && account.isShared) return true;

  return false;
}

/**
 * Returns true when the user's role allows listing any mail account at all.
 * Clients are blocked entirely from the mail subsystem.
 */
export function hasMailAccess(user: MailUser): boolean {
  const role = user.role || "client";
  return role !== "client";
}

// ── BR-02: Account creation defaults ──────────────────────────────────────────

/**
 * Applies defaults to raw request body to produce a complete
 * `CreateMailAccountInput`. All optional fields get safe fallbacks.
 */
export function resolveCreateAccountInput(body: any): CreateMailAccountInput {
  return {
    emailAddress:    body.emailAddress,
    password:        body.password,
    displayName:     body.displayName || "",
    jobTitle:        body.jobTitle || "",
    imapHost:        body.imapHost || DEFAULT_MAIL_HOST,
    imapPort:        body.imapPort || DEFAULT_IMAP_PORT,
    smtpHost:        body.smtpHost || DEFAULT_MAIL_HOST,
    smtpPort:        body.smtpPort || DEFAULT_SMTP_PORT,
    isShared:        !!body.isShared,
    sharedWith:      body.sharedWith || [],
    assignedUserIds: Array.isArray(body.assignedUserIds) ? body.assignedUserIds : [],
  };
}

// ── BR-03: Account update — selective field mutation ──────────────────────────

/**
 * Builds the MongoDB $set object from a partial update payload.
 * Only defined fields are included. When assignedUserIds is set,
 * the legacy assignedUserId field is cleared (migration strategy).
 */
export function buildUpdateObject(body: UpdateMailAccountInput): Record<string, any> {
  const update: Record<string, any> = {};

  if (body.assignedUserId !== undefined) {
    update.assignedUserId = body.assignedUserId || null;
  }

  if (body.assignedUserIds !== undefined) {
    update.assignedUserIds = Array.isArray(body.assignedUserIds)
      ? body.assignedUserIds
      : [];
    // Clear legacy field when the array model takes over.
    update.assignedUserId = null;
  }

  if (body.displayName !== undefined) update.displayName = body.displayName;
  if (body.jobTitle !== undefined)    update.jobTitle    = body.jobTitle;
  if (body.isShared !== undefined)    update.isShared    = body.isShared;
  if (body.sharedWith !== undefined)  update.sharedWith  = body.sharedWith;
  if (body.password)                  update.password    = body.password;

  return update;
}

// ── BR-04: Test-connection credential resolution ───────────────────────────────

/**
 * Merges caller-supplied overrides onto a stored account record to produce
 * the final credentials used for a connection test.
 */
export function resolveTestCreds(
  stored: MailAccountEntity,
  overrides: {
    password?:  string;
    imapHost?:  string;
    imapPort?:  number;
    smtpHost?:  string;
    smtpPort?:  number;
  }
): {
  emailAddress: string;
  password:     string;
  imapHost:     string;
  imapPort:     number;
  smtpHost:     string;
  smtpPort:     number;
} {
  return {
    emailAddress: stored.emailAddress,
    password:     overrides.password  || stored.password,
    imapHost:     overrides.imapHost  || stored.imapHost,
    imapPort:     overrides.imapPort  || stored.imapPort,
    smtpHost:     overrides.smtpHost  || stored.smtpHost,
    smtpPort:     overrides.smtpPort  || stored.smtpPort,
  };
}

/**
 * Builds fresh test credentials from raw request body (no stored account).
 */
export function buildDirectTestCreds(body: any): {
  emailAddress: string;
  password:     string;
  imapHost:     string;
  imapPort:     number;
  smtpHost:     string;
  smtpPort:     number;
} {
  return {
    emailAddress: body.emailAddress,
    password:     body.password,
    imapHost:     body.imapHost || DEFAULT_MAIL_HOST,
    imapPort:     body.imapPort || DEFAULT_IMAP_PORT,
    smtpHost:     body.smtpHost || DEFAULT_MAIL_HOST,
    smtpPort:     body.smtpPort || DEFAULT_SMTP_PORT,
  };
}
