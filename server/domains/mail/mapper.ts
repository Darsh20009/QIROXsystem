// ── Mail Domain — Mapper ───────────────────────────────────────────────────────
// Translates between Mongoose documents and response DTOs.
//
// Strategy:
//   The MailAccountModel schema has a toJSON transform that strips password
//   and adds `id`. However, .lean() bypasses toJSON. Since all repository
//   calls use .lean() for performance, the mapper must manually strip
//   passwords and add `id`.
//
//   Future migration (009+) will replace these pass-throughs with explicit
//   DTO construction to enforce strict response contracts.

import type {
  MailAccountEntity,
  SafeMailAccount,
  AdminMailAccount,
  AssignedUserSummary,
} from "./types";

// ── BR: Password stripping ─────────────────────────────────────────────────────
// SECURITY: Passwords must NEVER appear in any response.
// The toJSON transform on MailAccountModel only fires when Mongoose serialises
// a full document. Lean results bypass it — so stripping must be explicit here.

/**
 * Strips password from a lean account document and adds the string `id`.
 * Safe to return to any authenticated non-client employee.
 */
export function toSafeAccount(account: MailAccountEntity): SafeMailAccount {
  const { password, ...rest } = account as any;
  return {
    ...rest,
    id: (account as any)._id?.toString?.() ?? (account as any).id,
  };
}

/**
 * Strips password from a toObject() result (from .create() return value).
 * Used after POST /api/mail/accounts — document is a full Mongoose object.
 */
export function toSafeAccountFromDoc(doc: any): SafeMailAccount {
  const obj = doc.toObject ? doc.toObject() : doc;
  const { password, ...rest } = obj;
  return {
    ...rest,
    id: doc._id.toString(),
  };
}

/**
 * Builds the admin account view — includes resolved assigned users.
 * Deduplicates between legacy assignedUserId and new assignedUserIds.
 */
export function toAdminAccount(
  account: MailAccountEntity,
  assignedUsers: AssignedUserSummary[]
): AdminMailAccount {
  const safe = toSafeAccount(account);
  const assignedUser = assignedUsers[0] || null;

  // Compute deduplicated id list (string) for the response
  const idSet = new Set<string>();
  if ((account as any).assignedUserId) idSet.add(String((account as any).assignedUserId));
  ((account as any).assignedUserIds || []).forEach((x: any) => idSet.add(String(x)));
  const ids = [...idSet];

  return {
    ...safe,
    assignedUserIds: ids,
    assignedUser,
    assignedUsers,
  };
}

/**
 * Maps a cached message document to the EmailMessage shape returned by the
 * inbox fallback. Preserves uid and adds string id.
 */
export function toCachedMessage(m: any): any {
  return {
    ...m,
    uid: m.uid,
    id:  m._id?.toString?.(),
  };
}
