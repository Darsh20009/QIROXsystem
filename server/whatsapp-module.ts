/**
 * QIROX WhatsApp Module — powered by @whiskeysockets/baileys (free, no Chrome)
 * - Connects via WhatsApp Web QR code
 * - AI auto-responder (configurable delay, dialect-aware)
 * - Admin command execution (promo codes, emails, reports)
 * - SSE events for real-time admin UI updates
 */

import { EventEmitter } from "events";
import * as fs from "fs";
import * as path from "path";

export type WAStatus = "disconnected" | "qr" | "connecting" | "connected";

export interface WAEvent {
  type: "status" | "message" | "chat_update";
  [key: string]: any;
}

// ── Singleton module ──────────────────────────────────────────────────────────
class WhatsAppModule extends EventEmitter {
  private sock: any = null;
  private status: WAStatus = "disconnected";
  private qrString: string | null = null;
  private connectedPhone: string | null = null;
  private pendingAITimers = new Map<string, ReturnType<typeof setTimeout>>();
  private sseClients = new Set<any>(); // res objects for SSE

  // Reconnect — unlimited retries with exponential backoff; email alert after 10 failures
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private disconnectAlertSent = false; // send email only once per outage

  // LID → real phone number mapping (WhatsApp new Linked Device ID system)
  private lidToPhone = new Map<string, string>(); // e.g. "179289265815634@lid" → "966532441566"

  // ── Resolve a WA JID to a clean phone number string ──────────────────────
  private resolvePhone(chatId: string): string {
    if (chatId.endsWith("@s.whatsapp.net")) {
      return chatId.replace("@s.whatsapp.net", "").replace(/\D/g, "");
    }
    if (chatId.endsWith("@lid")) {
      const mapped = this.lidToPhone.get(chatId);
      return mapped ? mapped.replace(/\D/g, "") : "";
    }
    return chatId.split("@")[0].replace(/\D/g, "");
  }

  // Returns a human-readable display string: "+966532441566" or pushName fallback
  private resolveDisplayPhone(chatId: string, pushName?: string): string {
    const phone = this.resolvePhone(chatId);
    if (phone) return `+${phone}`;
    // LID with no mapping yet — show pushName or a readable placeholder
    if (pushName) return pushName;
    return chatId.endsWith("@lid") ? `WhatsApp (${chatId.split("@")[0].slice(-6)})` : chatId.split("@")[0];
  }

  // Persist a new LID→phone mapping and update existing DB records
  private registerLID(lid: string, phone: string) {
    if (!lid || !phone) return;
    const clean = phone.replace(/\D/g, "");
    if (!clean) return;
    if (this.lidToPhone.get(lid) === clean) return; // already known
    this.lidToPhone.set(lid, clean);
    // Backfill existing chat records in DB (best-effort, async)
    import("./models/whatsapp").then(({ WAChatModel }) => {
      WAChatModel.updateMany(
        { chatId: lid, phoneNumber: { $regex: "@lid" } },
        { $set: { phoneNumber: `+${clean}` } }
      ).catch(() => {});
    }).catch(() => {});
  }

  // ── SSE subscription ──────────────────────────────────────────────────────
  addSSEClient(res: any) {
    this.sseClients.add(res);
    // Send current state immediately
    this.sendSSE({ type: "status", ...this.getStatus() });
  }
  removeSSEClient(res: any) {
    this.sseClients.delete(res);
  }
  private sendSSE(event: WAEvent) {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    this.sseClients.forEach((res) => {
      try {
        res.write(data);
        // Explicitly flush — needed when compression middleware is active
        if (typeof res.flush === "function") res.flush();
        else if (typeof (res as any).flushHeaders === "function") (res as any).flushHeaders();
      } catch {}
    });
  }

  // ── Public state ──────────────────────────────────────────────────────────
  getStatus() {
    return {
      status: this.status,
      qr: this.qrString,
      phoneNumber: this.connectedPhone,
    };
  }

  // ── Auto-connect on server startup if saved session exists ────────────────
  async autoConnect() {
    const AUTH_DIR = path.join(process.cwd(), ".whatsapp-auth");
    const credsFile = path.join(AUTH_DIR, "creds.json");
    if (!fs.existsSync(credsFile)) {
      console.log("[WA] No saved session found — skipping auto-connect. Scan QR from admin panel.");
      return;
    }
    // Also respect a DB setting — if connectedPhone was null (user explicitly disconnected), skip
    try {
      const { WASettingsModel } = await import("./models/whatsapp");
      const settings: any = await WASettingsModel.findOne().lean();
      if (settings?.autoConnectDisabled) {
        console.log("[WA] Auto-connect disabled by admin setting — skipping.");
        return;
      }
    } catch {}
    console.log("[WA] Found saved session — auto-connecting...");
    this.connect().catch(e => console.error("[WA] Auto-connect failed:", e.message));
  }

  // ── Connection ────────────────────────────────────────────────────────────
  async connect() {
    // Prevent concurrent connect calls
    if (this.sock) await this.shutdown(false);

    // Clear any pending reconnect timer
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }

    this.status = "connecting";
    this.qrString = null;
    this.sendSSE({ type: "status", ...this.getStatus() });

    try {
      const baileys = await import("@whiskeysockets/baileys" as any);
      const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = baileys;

      const AUTH_DIR = path.join(process.cwd(), ".whatsapp-auth");
      if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

      const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

      // Fetch latest WA version with a safe fallback — external HTTP, can fail
      let version: number[];
      try {
        const v = await fetchLatestBaileysVersion();
        version = v.version;
      } catch {
        version = [2, 3000, 1015901307]; // known-good fallback
        console.warn("[WA] fetchLatestBaileysVersion failed — using fallback version");
      }

      const silentLogger = {
        level: "silent",
        info: () => {}, warn: () => {}, error: () => {},
        debug: () => {}, trace: () => {}, fatal: () => {},
        child: () => ({
          level: "silent",
          info: () => {}, warn: () => {}, error: () => {},
          debug: () => {}, trace: () => {}, fatal: () => {}, child: () => ({}),
        }),
      };

      this.sock = makeWASocket({
        version,
        auth: state,
        browser: Browsers.ubuntu("QIROX CRM"),
        printQRInTerminal: false,
        logger: silentLogger as any,
        syncFullHistory: false,
        getMessage: async () => undefined,
      });

      this.sock.ev.on("creds.update", saveCreds);

      this.sock.ev.on("connection.update", (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrString = qr;
          this.status = "qr";
          this.reconnectAttempts = 0; // QR appeared = fresh session, reset counter
          this.sendSSE({ type: "status", ...this.getStatus() });
        }

        if (connection === "open") {
          this.reconnectAttempts = 0;      // reset counter
          this.disconnectAlertSent = false; // reset alert so next outage triggers a new one
          this.status = "connected";
          this.qrString = null;
          this.connectedPhone = this.sock?.user?.id?.split(":")?.[0] || null;
          this.sendSSE({ type: "status", ...this.getStatus() });
          this.updateSettingsPhone(this.connectedPhone);
        }

        if (connection === "close") {
          const code = (lastDisconnect?.error as any)?.output?.statusCode;
          const loggedOut = code === DisconnectReason?.loggedOut || code === 401;

          this.status = "disconnected";
          this.connectedPhone = null;
          this.sendSSE({ type: "status", ...this.getStatus() });

          if (loggedOut) {
            // Logged out — clear auth, stop reconnecting
            this.reconnectAttempts = 0;
            const AUTH_DIR = path.join(process.cwd(), ".whatsapp-auth");
            try { if (fs.existsSync(AUTH_DIR)) fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch {}
          } else {
            // Unlimited retries with exponential backoff (max 60s between attempts)
            this.reconnectAttempts++;
            const delay = Math.min(5000 * Math.min(this.reconnectAttempts, 12), 60_000);
            console.log(`[WA] Auto-reconnect attempt ${this.reconnectAttempts} in ${delay / 1000}s`);

            // Send a one-time email alert after 10 failed attempts
            if (this.reconnectAttempts === 10 && !this.disconnectAlertSent) {
              this.disconnectAlertSent = true;
              this.sendDisconnectAlert().catch(() => {});
            }

            this.reconnectTimer = setTimeout(
              () => this.connect().catch(e => console.error("[WA] Reconnect failed:", e.message)),
              delay
            );
          }
        }
      });

      // ── Build LID → phone mapping from contacts ───────────────────────────
      this.sock.ev.on("contacts.upsert", (contacts: any[]) => {
        for (const c of contacts) {
          // Primary JID is phone-based but also has a LID alias
          if (c.id?.endsWith("@s.whatsapp.net") && c.lid) {
            const phone = c.id.replace("@s.whatsapp.net", "");
            this.registerLID(c.lid, phone);
          }
          // Primary JID is LID — try to extract phone from other fields
          if (c.id?.endsWith("@lid")) {
            if (c.phone) this.registerLID(c.id, c.phone);
            if (c.implicitlyAssumedSavedPhone) this.registerLID(c.id, c.implicitlyAssumedSavedPhone);
          }
        }
      });
      this.sock.ev.on("contacts.update", (contacts: any[]) => {
        for (const c of contacts) {
          if (c.id?.endsWith("@s.whatsapp.net") && c.lid) {
            this.registerLID(c.lid, c.id.replace("@s.whatsapp.net", ""));
          }
        }
      });

      // Wrap async message handler — never let it bubble up as UnhandledRejection
      this.sock.ev.on("messages.upsert", ({ messages, type }: any) => {
        if (type !== "notify") return;
        for (const msg of messages) {
          if (msg.key.fromMe) continue;
          this.handleIncoming(msg).catch(e => console.error("[WA] handleIncoming error:", e.message));
        }
      });

    } catch (err: any) {
      console.error("[WA] Connect error:", err.message);
      this.status = "disconnected";
      this.sendSSE({ type: "status", ...this.getStatus() });
    }
  }

  async shutdown(clearAuth = true) {
    // Cancel pending reconnect timer — prevents ghost reconnects after manual disconnect
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this.reconnectAttempts = 0;

    // Cancel pending AI timers
    this.pendingAITimers.forEach(t => clearTimeout(t));
    this.pendingAITimers.clear();

    if (this.sock) {
      try {
        // Use ws.terminate() instead of logout() — logout() throws when already disconnected
        this.sock.ws?.terminate?.();
      } catch {}
      try { this.sock.ev?.removeAllListeners?.(); } catch {}
      this.sock = null;
    }
    this.status = "disconnected";
    this.qrString = null;
    this.connectedPhone = null;
    this.sendSSE({ type: "status", ...this.getStatus() });

    if (clearAuth) {
      const AUTH_DIR = path.join(process.cwd(), ".whatsapp-auth");
      if (fs.existsSync(AUTH_DIR)) fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }
  }

  // ── Disconnect email alert ────────────────────────────────────────────────
  private async sendDisconnectAlert() {
    try {
      const { sendEmail } = await import("./email");
      await sendEmail({
        to: "youssefd.business@gmail.com",
        subject: "⚠️ انقطع اتصال واتساب QIROX — تدخل فوري مطلوب",
        html: `<div dir="rtl" style="font-family:Arial;padding:24px;background:#fff;">
          <h2 style="color:#d32f2f;">⚠️ انقطع اتصال واتساب</h2>
          <p>انقطع اتصال واتساب QIROX CRM بعد <strong>10 محاولات إعادة اتصال فاشلة</strong>.</p>
          <p>النظام يواصل المحاولة تلقائياً، لكن يُنصح بالدخول للوحة التحكم والضغط على "اتصال" يدوياً لتسريع الاسترداد.</p>
          <p style="color:#888;font-size:12px;">الوقت: ${new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" })}</p>
          <a href="https://qiroxstudio.online/admin/whatsapp" style="display:inline-block;background:#25D366;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:12px;">افتح واتساب CRM ←</a>
        </div>`,
      });
      console.log("[WA] Disconnect alert email sent to youssefd.business@gmail.com");
    } catch (e: any) {
      console.error("[WA] Failed to send disconnect alert:", e.message);
    }
  }

  // ── Send OTP via WhatsApp ─────────────────────────────────────────────────
  async sendOTP(phoneRaw: string | null | undefined, otp: string, name: string) {
    if (!phoneRaw || this.status !== "connected") return;
    const phone = phoneRaw.replace(/\D/g, "");
    if (phone.length < 7) return;
    const chatId = `${phone}@s.whatsapp.net`;
    const msg = `مرحباً ${name || ""} 👋\n\nرمز التحقق الخاص بك:\n\n*${otp}*\n\n⏱ صالح لمدة 10 دقائق.\n🔒 لا تشاركه مع أحد.`;
    await this.sendText(chatId, msg, false).catch(() => {});
  }

  // ── Send order/project update via WhatsApp ────────────────────────────────
  async sendNotification(phoneRaw: string | null | undefined, message: string) {
    if (!phoneRaw || this.status !== "connected") return;
    const phone = phoneRaw.replace(/\D/g, "");
    if (phone.length < 7) return;
    const chatId = `${phone}@s.whatsapp.net`;
    await this.sendText(chatId, message, false).catch(() => {});
  }

  // ── Send messages ─────────────────────────────────────────────────────────
  async sendText(chatId: string, text: string, aiGenerated = false) {
    if (!this.sock || this.status !== "connected") throw new Error("WhatsApp غير متصل");
    await this.sock.sendMessage(chatId, { text });
    await this.persistMessage({ chatId, fromMe: true, body: text, aiGenerated, timestamp: new Date() });
    this.sendSSE({ type: "message", chatId, fromMe: true, body: text, aiGenerated, timestamp: new Date().toISOString() });
  }

  async sendImageUrl(chatId: string, imageUrl: string, caption?: string) {
    if (!this.sock || this.status !== "connected") throw new Error("WhatsApp غير متصل");
    const resp = await fetch(imageUrl);
    const buf = Buffer.from(await resp.arrayBuffer());
    await this.sock.sendMessage(chatId, { image: buf, caption: caption || "" });
    await this.persistMessage({ chatId, fromMe: true, body: caption || "[صورة]", aiGenerated: true, timestamp: new Date(), mediaType: "image" });
  }

  async sendLink(chatId: string, url: string, title?: string) {
    const text = title ? `${title}\n${url}` : url;
    await this.sendText(chatId, text, false);
  }

  // ── Human override (pause AI for a chat) ─────────────────────────────────
  async setHumanOverride(chatId: string, minutes = 30) {
    const { WAChatModel } = await import("./models/whatsapp");
    const until = new Date(Date.now() + minutes * 60_000);
    await WAChatModel.findOneAndUpdate({ chatId }, { humanOverrideUntil: until }, { upsert: true });
    // Cancel pending timer
    const t = this.pendingAITimers.get(chatId);
    if (t) { clearTimeout(t); this.pendingAITimers.delete(chatId); }
  }

  async clearHumanOverride(chatId: string) {
    const { WAChatModel } = await import("./models/whatsapp");
    await WAChatModel.updateOne({ chatId }, { $unset: { humanOverrideUntil: 1 } });
  }

  // ── Query ─────────────────────────────────────────────────────────────────
  async getChats() {
    const { WAChatModel } = await import("./models/whatsapp");
    return WAChatModel.find().sort({ lastMessageAt: -1 }).lean();
  }

  async getMessages(chatId: string) {
    const { WAMessageModel, WAChatModel } = await import("./models/whatsapp");
    await WAChatModel.updateOne({ chatId }, { $set: { unreadCount: 0 } });
    return WAMessageModel.find({ chatId }).sort({ timestamp: 1 }).limit(150).lean();
  }

  async getSettings() {
    const { WASettingsModel } = await import("./models/whatsapp");
    return WASettingsModel.findOne().lean() || {};
  }

  async saveSettings(data: any) {
    const { WASettingsModel } = await import("./models/whatsapp");
    return WASettingsModel.findOneAndUpdate({}, { $set: data }, { upsert: true, new: true }).lean();
  }

  // ── Incoming message handler ──────────────────────────────────────────────
  private async handleIncoming(msg: any) {
    const chatId: string = msg.key.remoteJid!;
    if (!chatId) return;
    const isGroup = chatId.endsWith("@g.us");
    if (isGroup) return; // skip groups for now

    const body: string =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.documentMessage?.caption ||
      "";

    const pushName: string = msg.pushName || "";
    const resolvedPhone = this.resolvePhone(chatId);     // "" if LID not mapped yet
    const displayPhone  = this.resolveDisplayPhone(chatId, pushName);
    const senderName: string = pushName || displayPhone;
    const ts = new Date((Number(msg.messageTimestamp) || Date.now() / 1000) * 1000);

    // Persist
    await this.persistMessage({ chatId, messageId: msg.key.id, fromMe: false, senderName, body, timestamp: ts });
    this.sendSSE({ type: "message", chatId, fromMe: false, senderName, body, timestamp: ts.toISOString() });
    this.sendSSE({ type: "chat_update", chatId });

    // Load settings
    const { WASettingsModel, WAChatModel } = await import("./models/whatsapp");
    const settings: any = await WASettingsModel.findOne().lean() || {};

    // ── Identify sender from the database ──────────────────────────────────
    const { UserModel, OrderModel, ProjectModel } = await import("./models");
    const last9 = resolvedPhone ? resolvedPhone.slice(-9) : "";
    const matchedUser: any = last9 ? await UserModel.findOne({
      $or: [
        { phone: { $regex: last9 } },
        { whatsappNumber: { $regex: last9 } },
      ],
    }).select("fullName username role email phone whatsappNumber _id").lean() : null;

    // ── Admin WA command check (by saved admin numbers) ────────────────────
    const adminNums: string[] = settings.adminNumbers || [];
    const isWAAdmin = last9 && adminNums.some((n: string) => n.replace(/\D/g, "").slice(-9) === last9);
    if (isWAAdmin) {
      await this.handleAdminCommand(chatId, body, settings);
      return;
    }

    // ── Employee command routing ───────────────────────────────────────────
    if (matchedUser && (matchedUser.role === "employee" || matchedUser.role === "admin")) {
      await this.handleEmployeeCommand(chatId, body, matchedUser, settings);
      return;
    }

    // ── AI auto-responder ─────────────────────────────────────────────────
    if (!settings.aiEnabled && settings.aiEnabled !== undefined) return;

    const chat: any = await WAChatModel.findOne({ chatId }).lean();
    if (chat?.humanOverrideUntil && new Date(chat.humanOverrideUntil) > new Date()) return;
    if (chat?.aiEnabled === false) return;

    // Build client context for the AI (name, active orders, packages)
    let clientContext = "";
    if (matchedUser) {
      const orders: any[] = await OrderModel.find({ userId: matchedUser._id })
        .sort({ createdAt: -1 }).limit(3).lean();
      const projects: any[] = await ProjectModel.find({ clientId: matchedUser._id })
        .sort({ createdAt: -1 }).limit(2).lean();

      const statusAr: Record<string, string> = {
        pending: "قيد المراجعة", approved: "تمت الموافقة",
        in_progress: "قيد التنفيذ", review: "مراجعة العميل",
        completed: "مكتمل", rejected: "مرفوض",
      };
      const ordersText = orders.map((o: any) =>
        `  • طلب #${String(o._id).slice(-6).toUpperCase()} — ${o.projectType || "نظام"} — الحالة: ${statusAr[o.status] || o.status} — القيمة: ${o.totalAmount || 0} ر.س`
      ).join("\n") || "  (لا توجد طلبات)";

      const projectsText = projects.map((p: any) =>
        `  • مشروع: ${p.name || p.title || "بدون اسم"} — الحالة: ${statusAr[p.status] || p.status}`
      ).join("\n") || "  (لا توجد مشاريع)";

      clientContext = `\n\n--- معلومات العميل (سرية — لا تفصح عنها) ---
الاسم: ${matchedUser.fullName || matchedUser.username}
البريد: ${matchedUser.email}
الطلبات الأخيرة:\n${ordersText}
المشاريع:\n${projectsText}
--- قاعدة: ناده باسمه وتحدث معه بمودة، واذكر حالة طلبه لو سأل ---`;
    }

    // Schedule AI reply (0 delay = instant)
    const delayMs = ((settings.aiDelaySeconds ?? 60)) * 1000;
    const existing = this.pendingAITimers.get(chatId);
    if (existing) clearTimeout(existing);

    const doReply = async () => {
      this.pendingAITimers.delete(chatId);
      const freshChat: any = await WAChatModel.findOne({ chatId }).lean();
      if (freshChat?.humanOverrideUntil && new Date(freshChat.humanOverrideUntil) > new Date()) return;
      if (freshChat?.aiEnabled === false) return;
      try {
        const reply = await this.generateAIReply(chatId, matchedUser?.fullName || senderName, settings, clientContext);
        if (reply) await this.sendText(chatId, reply, true);
      } catch (e: any) {
        console.error("[WA-AI] Reply error:", e.message);
      }
    };

    if (delayMs === 0) {
      doReply().catch(() => {}); // instant
    } else {
      const timer = setTimeout(() => doReply().catch(() => {}), delayMs);
      this.pendingAITimers.set(chatId, timer);
    }
  }

  // ── Employee command handler ──────────────────────────────────────────────
  private async handleEmployeeCommand(chatId: string, body: string, employee: any, _settings: any) {
    const name = employee.fullName || employee.username;
    const lower = body.toLowerCase().trim().replace(/['"''""]/g, "").replace(/\s+/g, " ");

    const HELP_MSG =
      `📋 *أوامر الموظفين — QIROX*\n\n` +
      `• *help* — قائمة الأوامر\n` +
      `• *اعرض الطلبات* — آخر الطلبات النشطة\n` +
      `• *أرسل بريد [email] موضوع [X] محتوى [Y]*\n` +
      `\nمرحباً ${name} 👋`;

    // help
    if (/^(help|مساعدة|الأوامر|اوامر)$/.test(lower)) {
      return this.sendText(chatId, HELP_MSG, false);
    }

    // get orders
    if (/اعرض الطلبات|الطلبات|get orders|طلبات/.test(lower)) {
      try {
        const { OrderModel } = await import("./models");
        const orders: any[] = await OrderModel.find({ status: { $ne: "completed" } }).sort({ createdAt: -1 }).limit(7).lean();
        const statusAr: Record<string, string> = { pending: "قيد المراجعة", approved: "موافق", in_progress: "تنفيذ", review: "مراجعة", rejected: "مرفوض" };
        const lines = orders.map((o: any) =>
          `• #${String(o._id).slice(-6).toUpperCase()} — ${o.projectType || "نظام"} — ${statusAr[o.status] || o.status}`
        ).join("\n") || "لا توجد طلبات نشطة";
        return this.sendText(chatId, `📋 *أحدث الطلبات:*\n${lines}`, false);
      } catch (e: any) {
        return this.sendText(chatId, `❌ ${e.message}`, false);
      }
    }

    // send email
    if (/أرسل بريد|ارسل بريد|send email/.test(lower)) {
      const emailMatch = body.match(/[\w.+%-]+@[\w.-]+\.[a-z]{2,}/i);
      if (!emailMatch) return this.sendText(chatId, "⚠️ لم أجد عنوان البريد الإلكتروني في رسالتك.", false);
      const to = emailMatch[0];
      const subjectMatch = body.match(/موضوع[هه]?\s*[:：]?\s*(.+?)(?:\s+(?:محتوى|نص|الرسالة|body)|$)/i);
      const bodyMatch    = body.match(/(?:محتوى|نص|الرسالة|body)[:\s]+(.+)/is);
      const subject = subjectMatch?.[1]?.trim() || "رسالة من QIROX";
      const emailBody = bodyMatch?.[1]?.trim() || body;
      try {
        const { sendDirectEmail } = await import("./email");
        await sendDirectEmail(to, "مستخدم QIROX", subject, emailBody);
        return this.sendText(chatId, `✅ تم إرسال البريد إلى ${to}`, false);
      } catch (e: any) {
        return this.sendText(chatId, `❌ فشل إرسال البريد: ${e.message}`, false);
      }
    }

    // Fallback — plain-text AI (no json_object, compatible with all providers)
    try {
      const { getOpenAIClient } = await import("./lib/openai-client");
      const openai = getOpenAIClient();
      const resp = await openai.chat.completions.create({
        model: "gpt-4o", temperature: 0.3, max_tokens: 200,
        messages: [
          { role: "system", content: `أنت مساعد داخلي لموظف اسمه "${name}" في شركة QIROX. أوامره المتاحة:\n${HELP_MSG}\nرد بالعربية. إذا لم تفهم الأمر، وضّح الأوامر المتاحة.` },
          { role: "user", content: body },
        ],
      });
      return this.sendText(chatId, resp.choices[0]?.message?.content?.trim() || HELP_MSG, false);
    } catch {
      return this.sendText(chatId, HELP_MSG, false);
    }
  }

  // ── AI response generation ────────────────────────────────────────────────
  private async generateAIReply(chatId: string, senderName: string, settings: any, clientContext = ""): Promise<string> {
    const { WAMessageModel } = await import("./models/whatsapp");
    // Load last 20 messages for proper context
    const history: any[] = await WAMessageModel.find({ chatId }).sort({ timestamp: -1 }).limit(20).lean();
    history.reverse();

    // Determine if this is the very first message (no prior history)
    const isFirstContact = history.filter((m: any) => !m.fromMe).length <= 1;

    const { getOpenAIClient: _getOAI } = await import("./lib/openai-client");
    const openai = _getOAI();

    const extra = settings?.systemPromptExtra ? `\n\nمعلومات إضافية من الفريق:\n${settings.systemPromptExtra}` : "";

    const greetingRule = isFirstContact
      ? `5. هذه أول رسالة من العميل — ابدأ بتحية مناسبة قصيرة حسب لهجته (هلا 👋 / أهلاً / Hello)`
      : `5. المحادثة جارية — لا تبدأ بتحية مجدداً ولا تقل "هلا" مرة أخرى. استمر في الموضوع مباشرة بناءً على سياق المحادثة السابقة.`;

    const systemPrompt = `أنت مساعد QIROX الذكي — شركة تطوير برمجيات وأنظمة رقمية بالسعودية.
اسمك في هذه المحادثة: مساعد QIROX. تتحدث مع: ${senderName}.

🏢 QIROX Studio | qiroxstudio.online
📋 الخدمات: مواقع، تطبيقات موبايل، أنظمة إدارة، هوية بصرية، تسويق رقمي
💰 الباقات: Lite (699 ر.س) / Pro (1,249 ر.س) / Infinity (1,699 ر.س) | qiroxstudio.online/prices
🕐 الدوام: السبت–الخميس، 9 ص–6 م (توقيت الرياض)

📌 قواعد صارمة:
1. تكلم بنفس لهجة الشخص بالضبط — سعودي↔سعودي، مصري↔مصري، عراقي↔عراقي، إنجليزي↔إنجليزي
2. لا تستخدم الصينية أو أي لغة غير لغة المستخدم أبداً
3. أسلوب ودود وحيوي كزميل — مش رسمي، مش بارد، بدون كليشيهات
4. ردود قصيرة ومباشرة — بدون حشو أو تكرار
${greetingRule}
6. إذا سألك عن الرابط أو الموقع: qiroxstudio.online
7. إذا الموضوع خارج نطاقنا، وجّهه للفريق بطريقة ودية${extra}${clientContext}`;

    // Build conversation — include all history for proper context
    const chatMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...history.map((m: any) => ({
        role: m.fromMe ? "assistant" : "user",
        content: m.body || "(رسالة وسائط)",
      })),
    ];

    // Safety: ensure last message is from user
    if (chatMessages[chatMessages.length - 1]?.role === "assistant") {
      chatMessages.push({ role: "user", content: "(أكمل المحادثة)" });
    }

    const resp = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: chatMessages,
      max_tokens: 450,
      temperature: 0.8,
    });

    return (resp.choices[0]?.message?.content || "").trim();
  }

  // ── Admin command handler ─────────────────────────────────────────────────
  private async handleAdminCommand(chatId: string, command: string, settings: any) {
    const lower = command.toLowerCase().trim().replace(/['"''""]/g, "").replace(/\s+/g, " ");

    const HELP_MSG =
      `📋 *أوامر الأدمن — QIROX*\n\n` +
      `• *help* — قائمة الأوامر\n` +
      `• *أوقف الذكاء* / *شغّل الذكاء*\n` +
      `• *أنشئ كود [X]%* — كود خصم\n` +
      `• *أرسل بريد [email] موضوع [X] محتوى [Y]*\n` +
      `• *اعرض الطلبات*\n` +
      `• *أرسل رابط [صفحة]*`;

    // ── Keyword routing (no AI, instant) ─────────────────────────────────
    // help
    if (/^(help|مساعدة|الأوامر|اوامر)$/.test(lower)) {
      return this.sendText(chatId, HELP_MSG, false);
    }

    // toggle AI
    if (/أوقف الذكاء|وقف الذكاء|ai off|stop ai|disable ai/.test(lower)) {
      await this.saveSettings({ aiEnabled: false });
      return this.sendText(chatId, "⏸ الذكاء الاصطناعي متوقف الآن", false);
    }
    if (/شغّل الذكاء|شغل الذكاء|فعّل الذكاء|ai on|enable ai/.test(lower)) {
      await this.saveSettings({ aiEnabled: true });
      return this.sendText(chatId, "✅ الذكاء الاصطناعي مفعّل الآن", false);
    }

    // create promo code
    if (/أنشئ كود|انشئ كود|كود خصم|create promo/.test(lower)) {
      try {
        const { DiscountCodeModel } = await import("./models");
        const pctMatch = command.match(/(\d+)\s*(%|بالمئة|بالمية)/);
        const discount = pctMatch ? Number(pctMatch[1]) : 10;
        const customCode = command.match(/كود[:\s]+([A-Z0-9]+)/i)?.[1];
        const code = (customCode || "QIROX" + Math.random().toString(36).slice(-4)).toUpperCase();
        await (DiscountCodeModel as any).create({ code, discountType: "percent", discountValue: discount, maxUses: 100, usedCount: 0, isActive: true });
        return this.sendText(chatId, `✅ تم إنشاء كود الخصم\nالكود: *${code}*\nالخصم: ${discount}%`, false);
      } catch (e: any) {
        return this.sendText(chatId, `❌ فشل إنشاء الكود: ${e.message}`, false);
      }
    }

    // show orders
    if (/اعرض الطلبات|الطلبات الجديدة|get orders|طلبات/.test(lower)) {
      try {
        const { OrderModel } = await import("./models");
        const orders: any[] = await OrderModel.find({ status: { $ne: "completed" } }).sort({ createdAt: -1 }).limit(7).lean();
        const statusAr: Record<string, string> = { pending: "قيد المراجعة", approved: "موافق", in_progress: "تنفيذ", review: "مراجعة", rejected: "مرفوض" };
        const lines = orders.map((o: any) =>
          `• #${String(o._id).slice(-6).toUpperCase()} — ${o.projectType || "نظام"} — ${statusAr[o.status] || o.status}`
        ).join("\n") || "لا توجد طلبات نشطة";
        return this.sendText(chatId, `📋 *أحدث الطلبات:*\n${lines}`, false);
      } catch (e: any) {
        return this.sendText(chatId, `❌ ${e.message}`, false);
      }
    }

    // send email
    if (/أرسل بريد|ارسل بريد|send email/.test(lower)) {
      const emailMatch = command.match(/[\w.+%-]+@[\w.-]+\.[a-z]{2,}/i);
      if (!emailMatch) return this.sendText(chatId, "⚠️ لم أجد عنوان البريد الإلكتروني في رسالتك.", false);
      const to = emailMatch[0];
      // Extract subject and body from the natural-language command
      const subjectMatch = command.match(/موضوع[هه]?\s*[:：]?\s*(.+?)(?:\s+(?:محتوى|نص|الرسالة|body)|$)/i);
      const bodyMatch   = command.match(/(?:محتوى|نص|الرسالة|body)[:\s]+(.+)/is);
      const subject = subjectMatch?.[1]?.trim() || "رسالة من QIROX";
      const body    = bodyMatch?.[1]?.trim()    || command;
      try {
        const { sendDirectEmail } = await import("./email");
        await sendDirectEmail(to, "عميل QIROX", subject, body);
        return this.sendText(chatId, `✅ تم إرسال البريد إلى ${to}`, false);
      } catch (e: any) {
        return this.sendText(chatId, `❌ فشل إرسال البريد: ${e.message}`, false);
      }
    }

    // send link
    if (/أرسل رابط|ارسل رابط|send link/.test(lower)) {
      const pageMatch = command.match(/رابط\s+(.+)/i);
      const page = pageMatch?.[1]?.trim() || "";
      const url = `https://qiroxstudio.online/${page.replace(/\s+/g, "-")}`;
      return this.sendText(chatId, `🔗 *${page || "الموقع"}*\n${url}`, false);
    }

    // ── Fallback: AI (plain text, no json_object — compatible with all providers) ──
    try {
      const { getOpenAIClient: _getOAI2 } = await import("./lib/openai-client");
      const openai = _getOAI2();
      const resp = await openai.chat.completions.create({
        model: "gpt-4o", temperature: 0.3, max_tokens: 250,
        messages: [
          { role: "system", content: `أنت مساعد داخلي لأدمن QIROX. الأوامر المتاحة:\n${HELP_MSG}\n\nإذا لم تفهم الأمر، أعد قائمة الأوامر. رد بالعربية فقط. لا تقل "لم أفهم" وحدها — دائماً اشرح.` },
          { role: "user", content: command },
        ],
      });
      return this.sendText(chatId, resp.choices[0]?.message?.content?.trim() || HELP_MSG, false);
    } catch {
      return this.sendText(chatId, HELP_MSG, false);
    }
  }

  // ── Persist message to MongoDB ────────────────────────────────────────────
  private async persistMessage(msg: {
    chatId: string; messageId?: string; fromMe: boolean;
    senderName?: string; body: string; timestamp: Date;
    aiGenerated?: boolean; mediaType?: string;
  }) {
    try {
      const { WAMessageModel, WAChatModel } = await import("./models/whatsapp");
      await WAMessageModel.create(msg);

      // Upsert chat record
      const chatName = msg.senderName || "";
      // Resolve a proper phone number — never store a raw @lid string
      const resolvedPh = this.resolvePhone(msg.chatId);
      const displayPh  = resolvedPh ? `+${resolvedPh}` : (msg.chatId.endsWith("@s.whatsapp.net") ? `+${msg.chatId.replace("@s.whatsapp.net", "")}` : chatName);
      await WAChatModel.findOneAndUpdate(
        { chatId: msg.chatId },
        {
          $set: {
            ...((!msg.fromMe && chatName) ? { name: chatName } : {}),
            phoneNumber: displayPh,
            lastMessage: msg.body || "[وسائط]",
            lastMessageAt: msg.timestamp,
          },
          $inc: { unreadCount: msg.fromMe ? 0 : 1 },
        },
        { upsert: true }
      );
    } catch (e: any) {
      // Non-fatal
      console.error("[WA] persistMessage error:", e.message);
    }
  }

  private async updateSettingsPhone(phone: string | null) {
    try {
      const { WASettingsModel } = await import("./models/whatsapp");
      await WASettingsModel.findOneAndUpdate({}, { $set: { connectedPhone: phone } }, { upsert: true });
    } catch {}
  }
}

export const waModule = new WhatsAppModule();
