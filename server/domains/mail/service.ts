// ── Mail Domain — Service ──────────────────────────────────────────────────────
// Application orchestration layer.
//
// Responsibilities:
//   • Coordinate repository, domain rules, mapper, and mail-imap infrastructure.
//   • Return typed result objects to the controller.
//   • Never import Express types (req/res/next).

import * as repository from "./repository";
import * as domain from "./domain";
import * as mapper from "./mapper";
import {
  fetchInbox,
  fetchFolders,
  markSeen as imapMarkSeen,
  deleteMessage as imapDeleteMessage,
  sendMail as imapSendMail,
  testMailConnection,
} from "../../mail-imap";
import type {
  MailUser,
  SafeMailAccount,
  AdminMailAccount,
  ConnectionTestResult,
  SendMailInput,
} from "./types";

// ── Typed result union ────────────────────────────────────────────────────────

export type ServiceResult<T> =
  | { ok: true;  data: T }
  | { ok: false; status: number; error: string };

function ok<T>(data: T): ServiceResult<T>          { return { ok: true, data }; }
function fail(status: number, error: string): ServiceResult<never> {
  return { ok: false, status, error };
}

// ── Use cases ─────────────────────────────────────────────────────────────────

/**
 * UC-01: List accounts accessible to the current user.
 * Filters by canAccessAccount() — passwords stripped from all results.
 */
export async function listAccounts(
  user: MailUser
): Promise<ServiceResult<SafeMailAccount[]>> {
  const all = await repository.findAllAccounts();
  const filtered = all.filter(a => domain.canAccessAccount(user, a));
  return ok(filtered.map(mapper.toSafeAccount));
}

/**
 * UC-02: List ALL accounts with resolved assigned-user names.
 * Admin only — enforced by controller.
 */
export async function listAllAccounts(): Promise<ServiceResult<AdminMailAccount[]>> {
  const all = await repository.findAllAccounts();
  const withUsers = await Promise.all(
    all.map(async (account) => {
      // Deduplicate legacy + new assignee IDs
      const idSet = new Set<string>();
      if ((account as any).assignedUserId) idSet.add(String((account as any).assignedUserId));
      ((account as any).assignedUserIds || []).forEach((x: any) => idSet.add(String(x)));
      const ids = [...idSet];

      const assignedUsers = await repository.findUsersByIds(ids);
      return mapper.toAdminAccount(account, assignedUsers);
    })
  );
  return ok(withUsers);
}

/**
 * UC-03: Create a new mail account.
 * Admin only — enforced by controller.
 */
export async function createAccount(
  body: any
): Promise<ServiceResult<SafeMailAccount>> {
  const input = domain.resolveCreateAccountInput(body);
  const doc   = await repository.createAccount(input);
  return ok(mapper.toSafeAccountFromDoc(doc));
}

/**
 * UC-04: Update an existing mail account.
 * Admin only — enforced by controller.
 */
export async function updateAccount(
  id: string,
  body: any
): Promise<ServiceResult<SafeMailAccount>> {
  const updateObj = domain.buildUpdateObject(body);
  const updated   = await repository.updateAccountById(id, updateObj);
  if (!updated) return fail(404, "Not found");
  return ok(mapper.toSafeAccount(updated));
}

/**
 * UC-05: Delete an account and cascade-delete its cache.
 * Admin only — enforced by controller.
 */
export async function deleteAccount(id: string): Promise<ServiceResult<{ ok: true }>> {
  await repository.deleteAccountById(id);
  await repository.deleteCacheByAccountId(id);
  return ok({ ok: true as const });
}

/**
 * UC-06: Fetch inbox messages for an account.
 * Checks access control. Falls back to cached messages on IMAP failure.
 */
export async function getInbox(
  accountId: string,
  folder: string,
  user: MailUser
): Promise<ServiceResult<any[]>> {
  const account = await repository.findAccountById(accountId);
  if (!account) return fail(404, "Account not found");
  if (!domain.canAccessAccount(user, account)) return fail(403, "Forbidden");

  try {
    const messages = await fetchInbox(accountId, folder, 40);
    return ok(messages);
  } catch (err: any) {
    console.error("[Mail] inbox error:", err.message);
    // Cache fallback — preserves existing error-recovery behaviour
    const cached = await repository.findCachedMessages(accountId, folder, 40);
    return ok(cached.map(mapper.toCachedMessage));
  }
}

/**
 * UC-07: Fetch folder list for an account.
 * Falls back to a hardcoded safe list on IMAP failure.
 */
export async function getFolders(
  accountId: string,
  user: MailUser
): Promise<ServiceResult<string[]>> {
  const account = await repository.findAccountById(accountId);
  if (!account || !domain.canAccessAccount(user, account)) return fail(403, "Forbidden");

  try {
    const folders = await fetchFolders(accountId);
    return ok(folders);
  } catch {
    return ok(["INBOX", "Sent", "Drafts", "Trash"]);
  }
}

/**
 * UC-08: Mark a message as seen.
 * Fire-and-forget IMAP — responds immediately. IMAP errors are swallowed.
 */
export async function markMessageSeen(
  accountId: string,
  folder: string,
  uid: number,
  user: MailUser
): Promise<ServiceResult<{ ok: true }>> {
  const account = await repository.findAccountById(accountId);
  if (!account || !domain.canAccessAccount(user, account)) return fail(403, "Forbidden");

  // Respond immediately — markSeen handles cache + async IMAP internally
  imapMarkSeen(accountId, folder || "INBOX", uid).catch(() => {});
  return ok({ ok: true as const });
}

/**
 * UC-09: Delete a message from an account.
 * Removes from cache immediately, then soft-deletes via IMAP (\Deleted flag).
 */
export async function deleteMailMessage(
  accountId: string,
  folder: string,
  uid: number,
  user: MailUser
): Promise<ServiceResult<{ ok: true }>> {
  const account = await repository.findAccountById(accountId);
  if (!account || !domain.canAccessAccount(user, account)) return fail(403, "Forbidden");

  await imapDeleteMessage(accountId, folder, uid);
  return ok({ ok: true as const });
}

/**
 * UC-10: Test IMAP + SMTP connectivity for an account or supplied credentials.
 * Admin only — enforced by controller.
 */
export async function testConnection(
  body: any
): Promise<ServiceResult<ConnectionTestResult>> {
  let creds: {
    emailAddress: string;
    password:     string;
    imapHost:     string;
    imapPort:     number;
    smtpHost:     string;
    smtpPort:     number;
  };

  if (body.accountId) {
    const stored = await repository.findAccountById(body.accountId);
    if (!stored) return fail(404, "Account not found");
    creds = domain.resolveTestCreds(stored, {
      password: body.password,
      imapHost: body.imapHost,
      imapPort: body.imapPort,
      smtpHost: body.smtpHost,
      smtpPort: body.smtpPort,
    });
  } else {
    creds = domain.buildDirectTestCreds(body);
  }

  const result = await testMailConnection(creds);
  return ok(result);
}

/**
 * UC-11: Send a branded email from a corporate account.
 * Checks access control before sending.
 */
export async function sendAccountMail(
  input: SendMailInput,
  user: MailUser
): Promise<ServiceResult<{ ok: true }>> {
  const account = await repository.findAccountById(input.accountId);
  if (!account || !domain.canAccessAccount(user, account)) return fail(403, "Forbidden");

  await imapSendMail({
    accountId:   input.accountId,
    to:          input.to,
    cc:          input.cc,
    subject:     input.subject,
    body:        input.body,
    attachments: input.attachments,
  });

  return ok({ ok: true as const });
}
