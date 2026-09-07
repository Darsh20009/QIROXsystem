// ── Mail Domain — Repository ───────────────────────────────────────────────────
// All Mongoose database operations for the Mail module.
//
// Rules:
//   • No business logic — only data access.
//   • Returns raw Mongoose lean documents.
//   • Callers (service) are responsible for stripping passwords
//     and mapping to response DTOs.

import { MailAccountModel, MailCacheModel, UserModel } from "../../models";
import type { MailAccountEntity } from "./types";

// ── Account operations ────────────────────────────────────────────────────────

/** Q-01: Fetch all mail accounts. Returns lean documents (password included). */
export async function findAllAccounts(): Promise<MailAccountEntity[]> {
  return MailAccountModel.find().lean() as Promise<any[]>;
}

/** Q-02: Find a single account by MongoDB ID. Returns null if not found. */
export async function findAccountById(id: string): Promise<MailAccountEntity | null> {
  return MailAccountModel.findById(id).lean() as Promise<any>;
}

/** Q-03: Create a new account. Returns the saved Mongoose document. */
export async function createAccount(input: {
  emailAddress:    string;
  password:        string;
  displayName:     string;
  jobTitle:        string;
  imapHost:        string;
  imapPort:        number;
  smtpHost:        string;
  smtpPort:        number;
  isShared:        boolean;
  sharedWith:      string[];
  assignedUserIds: string[];
}): Promise<any> {
  return MailAccountModel.create(input);
}

/** Q-04: Update an account. Returns updated lean document, null if not found. */
export async function updateAccountById(
  id: string,
  update: Record<string, any>
): Promise<MailAccountEntity | null> {
  return MailAccountModel.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true }
  ).lean() as Promise<any>;
}

/** Q-05: Delete an account by ID. */
export async function deleteAccountById(id: string): Promise<void> {
  await MailAccountModel.findByIdAndDelete(id);
}

// ── User lookup (for admin account list) ─────────────────────────────────────

/**
 * Q-06: Fetch user summaries for a list of IDs.
 * Returns `{ id, fullName, role }` for each found user.
 */
export async function findUsersByIds(
  ids: string[]
): Promise<{ id: string; fullName: string; role: string }[]> {
  if (!ids.length) return [];
  const users = await UserModel.find({ _id: { $in: ids } })
    .select("fullName username role")
    .lean() as any[];
  return users.map(u => ({
    id:       u._id.toString(),
    fullName: u.fullName || u.username,
    role:     u.role,
  }));
}

// ── Cache operations ──────────────────────────────────────────────────────────

/**
 * Q-07: Delete all cached messages for an account.
 * Used when deleting an account to keep cache consistent.
 */
export async function deleteCacheByAccountId(accountId: string): Promise<void> {
  await MailCacheModel.deleteMany({ accountId });
}

/**
 * Q-08: Delete a single cached message by account + folder + uid.
 */
export async function deleteCachedMessage(
  accountId: string,
  folder: string,
  uid: number
): Promise<void> {
  await MailCacheModel.deleteOne({ accountId, folder, uid });
}

/**
 * Q-09: Fetch cached messages for an account + folder.
 * Used as fallback when IMAP is unreachable.
 */
export async function findCachedMessages(
  accountId: string,
  folder: string,
  limit: number
): Promise<any[]> {
  return MailCacheModel.find({ accountId, folder })
    .sort({ date: -1 })
    .limit(limit)
    .lean();
}

/**
 * Q-10: Update seen status of a cached message.
 */
export async function markCachedMessageSeen(
  accountId: string,
  folder: string,
  uid: number
): Promise<void> {
  await MailCacheModel.findOneAndUpdate(
    { accountId, folder, uid },
    { $set: { seen: true } }
  );
}
