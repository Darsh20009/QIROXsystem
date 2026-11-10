import { MailAccountModel, MailCacheModel, UserModel } from "./models";
import { fetchInbox } from "./mail-imap";
import { fireNotifyMany } from "./notify";
import { ALL_EMPLOYEE_MAIL_ROLES } from "./mail-access";

let monitorTimer: NodeJS.Timeout | null = null;
let tickRunning = false;
const initializedAccounts = new Set<string>();

export function recipientIds(account: any, usersByRole: Map<string, any[]>): string[] {
  if (account.accountType === "customer") {
    const ownerId = account.ownerUserId ? String(account.ownerUserId) : "";
    if (!ownerId) return [];
    const ctoIds = new Set((usersByRole.get("cto") || []).map((user) => String(user._id)));
    return ctoIds.has(ownerId) ? [] : [ownerId];
  }

  return [...new Set([
    account.assignedUserId,
    ...(Array.isArray(account.assignedUserIds) ? account.assignedUserIds : []),
  ].filter(Boolean).map(String))];
}

function normalizeWhatsAppPhone(value: unknown): string {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) return `966${digits.slice(1)}`;
  if (digits.length === 9) return `966${digits}`;
  return digits;
}

export function whatsappAlertTargets(account: any, usersById: Map<string, any>): Array<{ key: string; phone: string }> {
  if (account.accountType === "customer") return [];
  const assigneeIds = recipientIds(account, new Map()).filter((id) => usersById.has(id));
  const targets = assigneeIds.flatMap((id) => {
    const user = usersById.get(id);
    // Only use an explicitly stored WhatsApp number; do not guess from phone.
    const phone = normalizeWhatsAppPhone(user?.whatsappNumber);
    return phone.length >= 10 ? [{ key: `user:${id}`, phone }] : [];
  });
  return targets.filter((target, index, all) =>
    all.findIndex((candidate) => candidate.phone === target.phone) === index,
  );
}

export function buildMailWhatsAppSummary(account: any, message: any): string {
  return [
    `📩 وصل بريد جديد إلى ${account.emailAddress}`,
    `من: ${String(message.from || "غير معروف").slice(0, 220)}`,
    `الموضوع: ${String(message.subject || "بدون موضوع").slice(0, 220)}`,
    "افتح صندوق البريد داخل QIROX لعرض الرسالة والمرفقات.",
    "https://qiroxstudio.online/employee/mail",
  ].join("\n");
}

async function sendWhatsAppMailAlert(account: any, message: any, target: { key: string; phone: string }): Promise<void> {
  const { waModule } = await import("./whatsapp-module");
  const marker = `${target.key}:summary`;
  const state = await MailCacheModel.findOne({ accountId: account._id, folder: "INBOX", uid: message.uid })
    .select("whatsappNotifiedTo").lean() as any;
  if ((state?.whatsappNotifiedTo || []).includes(marker)) return;
  await waModule.sendNotification(target.phone, buildMailWhatsAppSummary(account, message));
  await MailCacheModel.updateOne(
    { accountId: account._id, folder: "INBOX", uid: message.uid },
    { $addToSet: { whatsappNotifiedTo: marker } },
  );
}

async function pollMailboxes(): Promise<void> {
  if (tickRunning) return;
  tickRunning = true;
  try {
    // Do not poll mailboxes that have not been configured with a password yet.
    // The seed path intentionally creates metadata-only records on fresh installs.
    const accounts = await MailAccountModel.find(
      { password: { $exists: true, $ne: "" } },
      { password: 0 },
    ).lean() as any[];
    if (!accounts.length) return;

    const employees = await UserModel.find(
      { role: { $in: ALL_EMPLOYEE_MAIL_ROLES }, employmentStatus: { $ne: "terminated" } },
      { _id: 1, role: 1, phone: 1, whatsappNumber: 1 },
    ).lean() as any[];
    const usersByRole = new Map<string, any[]>();
    const usersById = new Map<string, any>();
    for (const employee of employees) {
      const role = String(employee.role || "");
      const list = usersByRole.get(role) || [];
      list.push(employee);
      usersByRole.set(role, list);
      usersById.set(String(employee._id), employee);
    }

    for (const account of accounts) {
      const accountId = String(account._id);
      const cached = await MailCacheModel.find(
        { accountId, folder: "INBOX" },
        { uid: 1, whatsappNotifiedTo: 1, whatsappAlertRequested: 1 },
      ).sort({ uid: -1 }).limit(100).lean() as any[];
      const knownUids = new Set(cached.map((message) => Number(message.uid)));

      try {
        let messages = await fetchInbox(accountId, "INBOX", 100);
        if (!initializedAccounts.has(accountId)) {
          initializedAccounts.add(accountId);
          // Do not alert on an existing mailbox during first-time setup. A
          // populated cache, however, lets restarts detect mail received while
          // the process was down.
          if (!knownUids.size) continue;
        }
        const newMessages = messages.filter((message) => !knownUids.has(Number(message.uid)));
        const alertTargets = whatsappAlertTargets(account, usersById);
        if (newMessages.length) {
          if (alertTargets.length) {
            await MailCacheModel.updateMany(
              { accountId, folder: "INBOX", uid: { $in: newMessages.map((message) => message.uid) } },
              { $set: { whatsappAlertRequested: true } },
            );
          }

          const recipients = recipientIds(account, usersByRole);
          for (const newest of newMessages) {
            if (recipients.length) {
              try {
                await fireNotifyMany(
                  recipients,
                  `رسالة جديدة إلى ${account.emailAddress}`,
                  `${String(newest.from || "").slice(0, 120)} — ${String(newest.subject || "رسالة جديدة").slice(0, 160)}`,
                  {
                    type: "message",
                    link: "/employee/mail",
                    tag: `mail-${accountId}-${newest.uid}`,
                    highPriority: true,
                  },
                );
              } catch (error: any) {
                console.error(`[MailMonitor] Push notification failed for ${account.emailAddress}/${newest.uid}:`, error?.message || error);
              }
            }
          }
          if (!alertTargets.length && account.accountType !== "customer") {
            console.info(`[MailMonitor] No assigned employee with a WhatsApp number for ${account.emailAddress}`);
          }
        }

        if (alertTargets.length) {
          const hasPendingAlerts = cached.some((message) => message.whatsappAlertRequested);
          if (newMessages.length || hasPendingAlerts) {
            const alertDocs = await MailCacheModel.find({
              accountId,
              folder: "INBOX",
              uid: { $in: messages.map((message) => message.uid) },
              whatsappAlertRequested: true,
            }).lean() as any[];
            const messagesByUid = new Map(messages.map((message) => [Number(message.uid), message]));
            for (const alertDoc of alertDocs) {
              const message = messagesByUid.get(Number(alertDoc.uid));
              if (!message) continue;
              for (const target of alertTargets) {
                try {
                  await sendWhatsAppMailAlert(account, message, target);
                } catch (error: any) {
                  console.error(`[MailMonitor] WhatsApp delivery failed for ${account.emailAddress}/${alertDoc.uid}/${target.key}:`, error?.message || error);
                }
              }
            }
          }
        }
      } catch (error: any) {
        // Mailbox failures are isolated; one unavailable account must not stop
        // monitoring for every other employee/customer mailbox.
        console.error(`[MailMonitor] ${account.emailAddress}:`, error?.message || error);
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