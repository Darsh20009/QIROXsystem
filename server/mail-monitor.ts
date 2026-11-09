import { MailAccountModel, MailCacheModel, UserModel } from "./models";
import { fetchInbox } from "./mail-imap";
import { fireNotifyMany } from "./notify";
import { ALL_EMPLOYEE_MAIL_ROLES, isTeamWideMailAccount } from "./mail-access";

let monitorTimer: NodeJS.Timeout | null = null;
let tickRunning = false;
const initializedAccounts = new Set<string>();
const accountRetryAfter = new Map<string, number>();

function mailboxRetryDelay(error: unknown): { delayMs: number; reason: string } {
  const message = String((error as any)?.message || error || "");
  if (/auth|login|password|credential/i.test(message)) {
    return { delayMs: 15 * 60 * 1000, reason: "credentials rejected" };
  }
  if (/timeout|timed out|connect|socket|network|econn|command failed/i.test(message)) {
    return { delayMs: 3 * 60 * 1000, reason: "mail server unavailable" };
  }
  return { delayMs: 60 * 1000, reason: "temporary mailbox error" };
}

function recipientIds(account: any, usersByRole: Map<string, string[]>): string[] {
  if (account.accountType === "customer") {
    return account.ownerUserId ? [String(account.ownerUserId)] : [];
  }

  const ids = new Set<string>();
  if (account.assignedUserId) ids.add(String(account.assignedUserId));
  for (const id of account.assignedUserIds || []) ids.add(String(id));
  if (isTeamWideMailAccount("employee", account)) {
    for (const role of ALL_EMPLOYEE_MAIL_ROLES) {
      for (const id of usersByRole.get(role) || []) ids.add(id);
    }
  }
  return [...ids];
}

async function pollMailboxes(): Promise<void> {
  if (MailAccountModel.db.readyState !== 1) return;
  if (tickRunning) return;
  tickRunning = true;
  try {
    const accounts = await MailAccountModel.find({}, { password: 0 }).lean() as any[];
    if (!accounts.length) return;

    const employees = await UserModel.find(
      { role: { $in: ALL_EMPLOYEE_MAIL_ROLES } },
      { _id: 1, role: 1 },
    ).lean() as any[];
    const usersByRole = new Map<string, string[]>();
    for (const employee of employees) {
      const role = String(employee.role || "");
      const list = usersByRole.get(role) || [];
      list.push(String(employee._id));
      usersByRole.set(role, list);
    }

    for (const account of accounts) {
      const accountId = String(account._id);
      if ((accountRetryAfter.get(accountId) || 0) > Date.now()) continue;
      const cached = await MailCacheModel.find(
        { accountId, folder: "INBOX" },
        { uid: 1 },
      ).lean() as any[];
      const knownUids = new Set(cached.map((message) => Number(message.uid)));

      try {
        const messages = await fetchInbox(accountId, "INBOX", 40);
        accountRetryAfter.delete(accountId);
        if (!initializedAccounts.has(accountId)) {
          // Warm the cache without notifying about messages that predate the
          // monitor. Future polls compare against this known inbox.
          initializedAccounts.add(accountId);
          continue;
        }
        const newMessages = messages.filter((message) => !knownUids.has(Number(message.uid)));
        if (!newMessages.length) continue;

        const recipients = recipientIds(account, usersByRole);
        if (!recipients.length) continue;
        const newest = newMessages[0];
        const sender = String(newest.from || "").slice(0, 120);
        const subject = String(newest.subject || "رسالة جديدة").slice(0, 160);
        await fireNotifyMany(
          recipients,
          `رسالة جديدة إلى ${account.emailAddress}`,
          `${sender} — ${subject}`,
          {
            type: "message",
            link: "/employee/mail",
            tag: `mail-${accountId}-${newest.uid}`,
            highPriority: true,
          },
        );
      } catch (error: any) {
        // Mailbox failures are isolated; one unavailable account must not stop
        // monitoring for every other employee/customer mailbox. Back off
        // rejected credentials longer so one bad mailbox cannot spam logs.
        const { delayMs, reason } = mailboxRetryDelay(error);
        accountRetryAfter.set(accountId, Date.now() + delayMs);
        console.warn(
          `[MailMonitor] ${account.emailAddress}: ${reason}; retrying in ${Math.ceil(delayMs / 60000)}m`,
        );
      }
    }
  } catch (error: any) {
    console.error("[MailMonitor] tick failed:", error?.message || error);
  } finally {
    tickRunning = false;
  }
}

export function startMailMonitor(): void {
  if (monitorTimer || process.env.MAIL_MONITOR_ENABLED === "false") return;
  // Delay the first network sweep until the rest of the app is ready.
  setTimeout(() => { pollMailboxes().catch(() => {}); }, 20_000);
  monitorTimer = setInterval(() => { pollMailboxes().catch(() => {}); }, 60_000);
  monitorTimer.unref?.();
  console.log("[MailMonitor] started (60s interval)");
}