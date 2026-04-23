import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import { simpleParser } from "mailparser";
import { MailAccountModel, MailCacheModel } from "./models";
import type { Document } from "mongoose";

export interface MailAccountDoc {
  _id: string;
  id: string;
  emailAddress: string;
  password: string;
  displayName: string;
  jobTitle: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  assignedUserId: string | null;
  isShared: boolean;
  sharedWith: string[];
}

export interface EmailMessage {
  uid: number;
  subject: string;
  from: string;
  to: string;
  date: Date | null;
  seen: boolean;
  html: string;
  text: string;
  snippet: string;
  folder: string;
}

async function getAccountRaw(accountId: string): Promise<MailAccountDoc | null> {
  const doc = await MailAccountModel.findById(accountId).lean() as any;
  if (!doc) return null;
  return { ...doc, id: doc._id.toString(), password: doc.password };
}

export async function fetchInbox(accountId: string, folder = "INBOX", maxMessages = 30): Promise<EmailMessage[]> {
  const account = await getAccountRaw(accountId);
  if (!account) throw new Error("Account not found");

  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure: true,
    auth: { user: account.emailAddress, pass: account.password },
    logger: false,
    tls: { rejectUnauthorized: false },
  });

  const messages: EmailMessage[] = [];

  try {
    await client.connect();
    const mailbox = await client.mailboxOpen(folder);
    const total = mailbox.exists;

    if (total === 0) {
      await client.logout();
      return [];
    }

    const start = Math.max(1, total - maxMessages + 1);
    const range = `${start}:${total}`;

    for await (const msg of client.fetch(range, { uid: true, flags: true, envelope: true, source: true })) {
      try {
        const parsed = await simpleParser(msg.source as any);
        const from = parsed.from?.text || "";
        const to = parsed.to ? (Array.isArray(parsed.to) ? parsed.to.map((a: any) => a.text).join(", ") : (parsed.to as any).text) : "";
        const html = parsed.html || "";
        const text = parsed.text || "";
        const snippet = text.slice(0, 160).replace(/\s+/g, " ").trim();
        const seen = msg.flags?.has("\\Seen") || false;

        const message: EmailMessage = {
          uid: msg.uid,
          subject: parsed.subject || "(بدون موضوع)",
          from,
          to,
          date: parsed.date || null,
          seen,
          html,
          text,
          snippet,
          folder,
        };
        messages.push(message);

        // Cache it
        await MailCacheModel.findOneAndUpdate(
          { accountId, folder, uid: msg.uid },
          { $set: { subject: message.subject, from, to, date: message.date, seen, html, text, snippet } },
          { upsert: true }
        );
      } catch (e) {
        // skip malformed message
      }
    }

    await client.logout();
  } catch (err) {
    try { await client.logout(); } catch {}
    throw err;
  }

  return messages.reverse();
}

export async function fetchFolders(accountId: string): Promise<string[]> {
  const account = await getAccountRaw(accountId);
  if (!account) throw new Error("Account not found");

  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure: true,
    auth: { user: account.emailAddress, pass: account.password },
    logger: false,
    tls: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const list = await client.list();
    await client.logout();
    return list.map((f: any) => f.path).filter(Boolean);
  } catch (err) {
    try { await client.logout(); } catch {}
    return ["INBOX", "Sent", "Drafts", "Trash", "Junk"];
  }
}

export async function markSeen(accountId: string, folder: string, uid: number): Promise<void> {
  const account = await getAccountRaw(accountId);
  if (!account) return;

  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure: true,
    auth: { user: account.emailAddress, pass: account.password },
    logger: false,
    tls: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.mailboxOpen(folder);
    await client.messageFlagsAdd({ uid }, ["\\Seen"], { uid: true });
    await client.logout();
    await MailCacheModel.findOneAndUpdate({ accountId, folder, uid }, { $set: { seen: true } });
  } catch (err) {
    try { await client.logout(); } catch {}
  }
}

export async function deleteMessage(accountId: string, folder: string, uid: number): Promise<void> {
  const account = await getAccountRaw(accountId);
  if (!account) return;

  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure: true,
    auth: { user: account.emailAddress, pass: account.password },
    logger: false,
    tls: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.mailboxOpen(folder);
    await client.messageFlagsAdd({ uid }, ["\\Deleted"], { uid: true });
    await client.mailboxClose();
    await client.logout();
    await MailCacheModel.deleteOne({ accountId, folder, uid });
  } catch (err) {
    try { await client.logout(); } catch {}
    throw err;
  }
}

export function buildBrandedHtml(opts: {
  senderName: string;
  senderTitle: string;
  body: string;
  logoUrl?: string;
}): string {
  const logoUrl = opts.logoUrl || "https://qiroxstudio.online/logo.png";
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;}
  .wrapper{max-width:620px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);}
  .header{background:#000000;padding:24px 32px;text-align:center;}
  .header img{height:40px;width:auto;object-fit:contain;}
  .body-content{padding:32px 36px;color:#111111;font-size:15px;line-height:1.75;}
  .body-content p{margin:0 0 16px;}
  .signature{margin-top:32px;padding-top:20px;border-top:1px solid #e5e5e5;}
  .sig-name{font-size:16px;font-weight:700;color:#000000;}
  .sig-title{font-size:13px;color:#555555;margin-top:2px;}
  .sig-company{font-size:12px;color:#888888;margin-top:6px;}
  .footer{background:#000000;padding:16px 32px;text-align:center;}
  .footer p{color:#ffffff;font-size:11px;margin:0;opacity:0.6;letter-spacing:0.05em;}
  .footer a{color:#ffffff;text-decoration:none;}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <img src="${logoUrl}" alt="QIROX"/>
  </div>
  <div class="body-content">
    ${opts.body.split("\n").map(l => `<p>${l || "&nbsp;"}</p>`).join("")}
    <div class="signature">
      <div class="sig-name">${opts.senderName}</div>
      <div class="sig-title">${opts.senderTitle}</div>
      <div class="sig-company">QIROX Studio · qiroxstudio.online</div>
    </div>
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} QIROX Studio — <a href="https://qiroxstudio.online">qiroxstudio.online</a></p>
  </div>
</div>
</body>
</html>`;
}

export async function sendMail(opts: {
  accountId: string;
  to: string;
  subject: string;
  body: string;
}): Promise<void> {
  const account = await getAccountRaw(opts.accountId);
  if (!account) throw new Error("Account not found");

  const html = buildBrandedHtml({
    senderName: account.displayName || account.emailAddress.split("@")[0],
    senderTitle: account.jobTitle || "QIROX Studio",
    body: opts.body,
  });

  const transport = nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: true,
    auth: { user: account.emailAddress, pass: account.password },
    tls: { rejectUnauthorized: false },
  });

  await transport.sendMail({
    from: `"${account.displayName || "QIROX"}" <${account.emailAddress}>`,
    to: opts.to,
    subject: opts.subject,
    html,
    text: opts.body,
  });
}

export async function seedDefaultAccounts(): Promise<void> {
  const defaults = [
    {
      emailAddress: "m.aldbani@qiroxstudio.online",
      password: "ASDqwe@123",
      displayName: "محمد الدباني",
      jobTitle: "المدير التنفيذي - CEO",
      isShared: false,
      sharedWith: [],
    },
    {
      emailAddress: "y.darwish@qiroxstudio.online",
      password: "ASDqwe@123",
      displayName: "يوسف نحمد درويش",
      jobTitle: "المدير التقني - CTO",
      isShared: false,
      sharedWith: [],
    },
    {
      emailAddress: "info@qiroxstudio.online",
      password: "ASDqwe@123",
      displayName: "QIROX Info",
      jobTitle: "البريد العام",
      isShared: true,
      sharedWith: ["admin", "ceo", "cto", "manager"],
    },
    {
      emailAddress: "support@qiroxstudio.online",
      password: "ASDqwe@123",
      displayName: "QIROX Support",
      jobTitle: "الدعم الفني",
      isShared: true,
      sharedWith: ["admin", "ceo", "cto", "manager", "support"],
    },
  ];

  for (const acc of defaults) {
    await MailAccountModel.findOneAndUpdate(
      { emailAddress: acc.emailAddress },
      { $setOnInsert: acc },
      { upsert: true }
    );
  }
  console.log("[Mail] Default accounts seeded");
}
