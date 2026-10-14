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

  const roles = mailboxAlertRoles(account);
  return [...new Set(roles.flatMap((role) => {
    const ids = usersByRole.get(role) || [];
    // Alerts are person-specific. Ambiguous executive roles fail closed.
    return ids.length === 1 ? [String(ids[0]._id)] : [];
  }))];
}

export function mailboxAlertRoles(account: any): string[] {
  if (account.accountType === "customer") return [];
  const localPart = String(account.emailAddress || "").split("@")[0].toLowerCase();
  if (localPart === "y.business") return [];
  if (["info", "support", "hr", "marketing", "ceo"].includes(localPart)) return ["ceo"];
  return [];
}

function normalizeWhatsAppPhone(value: unknown): string {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) return `966${digits.slice(1)}`;
  if (digits.length === 9) return `966${digits}`;
  return digits;
}

function whatsappAlertTargets(account: any, usersByRole: Map<string, any[]>): Array<{ key: string; phone: string }> {
  const roles = mailboxAlertRoles(account);
  if (!roles.length) return [];

  const targets: Array<{ key: string; phone: string }> = [];
  if (roles.includes("cto")) {
    const candidates = usersByRole.get("cto") || [];
    if (candidates.length === 1) {
      const phone = normalizeWhatsAppPhone(candidates[0].whatsappNumber || candidates[0].phone);
      if (phone.length >= 10) targets.push({ key: `cto:${String(candidates[0]._id)}`, phone });
    } else {
      console.warn(`[MailMonitor] Cannot resolve one CTO recipient for ${account.emailAddress}`);
    }
  }
  if (roles.includes("ceo")) {
    const phone = normalizeWhatsAppPhone(process.env.MAIL_ALERT_CEO_WHATSAPP_NUMBER);
    if (phone.length >= 10) targets.push({ key: "ceo", phone });
    else console.warn(`[MailMonitor] CEO WhatsApp recipient is not configured for ${account.emailAddress}`);
  }
  return targets.filter((target, index, all) =>
    all.findIndex((candidate) => candidate.phone === target.phone) === index,
  );
}

function emailTextBody(message: any): string {
  const text = String(message.text || "").trim();
  if (text) return text;
  return String(message.html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function sendWhatsAppMailAlert(account: any, message: any, target: { key: string; phone: string }): Promise<void> {
  const { waModule } = await import("./whatsapp-module");
  const header = [
    `New email to ${account.emailAddress}`,
    `From: ${String(message.from || "Unknown").slice(0, 500)}`,
    `To: ${String(message.to || account.emailAddress).slice(0, 500)}`,
    `Subject: ${String(message.subject || "(no subject)").slice(0, 500)}`,
    "",
  ].join("\n");
  const fullBody = emailTextBody(message);
  const maxBodyChars = 50_000;
  const body = fullBody.length > maxBodyChars
    ? `${fullBody.slice(0, maxBodyChars)}\n\n[Body shortened. Open the mailbox for the full message.]`
    : fullBody;
  const chunks: string[] = [];
  for (let cursor = 0; cursor < body.length; cursor += 3_000) {
    chunks.push(body.slice(cursor, cursor + 3_000));
  }
  if (!chunks.length) chunks.push("(No message text)");

  const maxAttachmentBytes = 20 * 1024 * 1024;
  const maxTotalAttachmentBytes = 40 * 1024 * 1024;
  let forwardedBytes = 0;

  for (let index = 0; index < chunks.length; index += 1) {
    const marker = `${target.key}:text:${index}`;
    const state = await MailCacheModel.findOne({ accountId: account._id, folder: "INBOX", uid: message.uid })
      .select("whatsappNotifiedTo").lean() as any;
    if ((state?.whatsappNotifiedTo || []).includes(marker)) continue;
    const prefix = index === 0
      ? header
      : `Email body continued (${index + 1}/${chunks.length})\n`;
    await waModule.sendNotification(target.phone, `${prefix}${chunks[index]}`);
    await MailCacheModel.updateOne(
      { accountId: account._id, folder: "INBOX", uid: message.uid },
      { $addToSet: { whatsappNotifiedTo: marker } },
    );
  }

  const attachments: any[] = message.attachments || [];
  for (let index = 0; index < attachments.length; index += 1) {
    const attachment = attachments[index];
    const marker = `${target.key}:attachment:${index}`;
    const state = await MailCacheModel.findOne({ accountId: account._id, folder: "INBOX", uid: message.uid })
      .select("whatsappNotifiedTo").lean() as any;
    if ((state?.whatsappNotifiedTo || []).includes(marker)) {
      forwardedBytes += Number(attachment.content?.length || 0);
      continue;
    }

    const size = Number(attachment.content?.length || 0);
    if (!size || size > maxAttachmentBytes || forwardedBytes + size > maxTotalAttachmentBytes) {
      await waModule.sendNotification(
        target.phone,
        `Attachment not forwarded: ${String(attachment.filename || "file").slice(0, 180)} (${Math.ceil(size / 1024 / 1024)} MB; limit ${maxAttachmentBytes / 1024 / 1024} MB per file and ${maxTotalAttachmentBytes / 1024 / 1024} MB per email).`,
      );
      await MailCacheModel.updateOne(
        { accountId: account._id, folder: "INBOX", uid: message.uid },
        { $addToSet: { whatsappNotifiedTo: marker } },
      );
      continue;
    }

    await waModule.sendDocumentNotification(
      target.phone,
      attachment.content,
      String(attachment.filename || `attachment-${index + 1}`).slice(0, 180),
      String(attachment.contentType || "application/octet-stream").slice(0, 160),
    );
    forwardedBytes += size;
    await MailCacheModel.updateOne(
      { accountId: account._id, folder: "INBOX", uid: message.uid },
      { $addToSet: { whatsappNotifiedTo: marker } },
    );
  }
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
      { role: { $in: ALL_EMPLOYEE_MAIL_ROLES } },
      { _id: 1, role: 1, phone: 1, whatsappNumber: 1 },
    ).lean() as any[];
    const usersByRole = new Map<string, any[]>();
    for (const employee of employees) {
      const role = String(employee.role || "");
      const list = usersByRole.get(role) || [];
      list.push(employee);
      usersByRole.set(role, list);
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
        if (newMessages.length) {
          const localPart = String(account.emailAddress || "").split("@")[0].toLowerCase();
          if (account.accountType !== "customer" && mailboxAlertRoles(account).length) {
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
          if (!mailboxAlertRoles(account).length && account.accountType !== "customer") {
            console.info(`[MailMonitor] No confirmed WhatsApp routing for ${localPart}; content forwarding skipped`);
          }
        }

        if (account.accountType !== "customer" && mailboxAlertRoles(account).length) {
          const alertTargets = whatsappAlertTargets(account, usersByRole);
          const hasPendingAlerts = cached.some((message) => message.whatsappAlertRequested);
          if (alertTargets.length && (newMessages.length || hasPendingAlerts)) {
            // Attachments are only downloaded for mail that needs a WhatsApp
            // delivery attempt, not for every message on every poll.
            messages = await fetchInbox(accountId, "INBOX", 100, 0, true);
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
          } else {
            if (!alertTargets.length && (newMessages.length || hasPendingAlerts)) {
              console.warn(`[MailMonitor] No resolved WhatsApp recipients for ${account.emailAddress}`);
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