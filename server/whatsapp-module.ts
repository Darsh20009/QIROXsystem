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

const ARABIC_STATUS: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "تمت الموافقة",
  in_progress: "قيد التنفيذ",
  review: "بانتظار مراجعة العميل",
  completed: "مكتمل",
  closed: "مغلق",
  rejected: "مرفوض",
  cancelled: "ملغى",
};

function cleanText(value: unknown): string {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function isArabicMessage(value: string): boolean {
  const arabic = (value.match(/[\u0600-\u06FF]/g) || []).length;
  return arabic >= 2 || arabic > value.length * 0.15;
}

function isBadArabicReply(reply: string, userMessage: string): boolean {
  if (!isArabicMessage(userMessage)) return false;
  const arabicChars = (reply.match(/[\u0600-\u06FF]/g) || []).length;
  const latinChars = (reply.match(/[a-z]/gi) || []).length;
  const frenchMarkers = /\b(je|vous|nous|bonjour|merci|avec|pour|dans|est|les|des|une|votre)\b/i;
  return frenchMarkers.test(reply) || (arabicChars < 8 && latinChars > 12);
}

function phoneDigits(value: unknown): string {
  return String(value || "").replace(/\D/g, "");
}

function samePhoneNumber(left: string, right: string): boolean {
  const a = phoneDigits(left);
  const b = phoneDigits(right);
  if (a.length < 9 || b.length < 9) return false;
  return a === b || a.endsWith(b) || b.endsWith(a);
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
      // new Function prevents esbuild from rewriting import() → require() in CJS bundle
      // @whiskeysockets/baileys is ESM-only; require() breaks it at runtime on Render
      const _dyn = new Function("m", "return import(m)");
      const baileys = await _dyn("@whiskeysockets/baileys");
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
      const sent = await sendEmail(
        "youssefd.business@gmail.com",
        "Youssef",
        "⚠️ انقطع اتصال واتساب QIROX — تدخل فوري مطلوب",
        `<div dir="rtl" style="font-family:Arial;padding:24px;background:#fff;">
          <h2 style="color:#d32f2f;">⚠️ انقطع اتصال واتساب</h2>
          <p>انقطع اتصال واتساب QIROX CRM بعد <strong>10 محاولات إعادة اتصال فاشلة</strong>.</p>
          <p>النظام يواصل المحاولة تلقائياً، لكن يُنصح بالدخول للوحة التحكم والضغط على "اتصال" يدوياً لتسريع الاسترداد.</p>
          <p style="color:#888;font-size:12px;">الوقت: ${new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" })}</p>
          <a href="https://qiroxstudio.online/admin/whatsapp" style="display:inline-block;background:#25D366;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:12px;">افتح واتساب CRM ←</a>
        </div>`,
      );
      if (!sent) throw new Error("SMTP delivery failed");
      console.log("[WA] Disconnect alert email sent to youssefd.business@gmail.com");
    } catch (e: any) {
      console.error("[WA] Failed to send disconnect alert:", e.message);
    }
  }

  // ── Send OTP via WhatsApp ─────────────────────────────────────────────────
  async sendOTP(phoneRaw: string | null | undefined, otp: string, name: string) {
    if (!phoneRaw) throw new Error("رقم واتساب غير متوفر");
    if (this.status !== "connected") throw new Error("WhatsApp غير متصل");
    const phone = phoneRaw.replace(/\D/g, "");
    if (phone.length < 7) throw new Error("رقم واتساب غير صالح");
    const chatId = `${phone}@s.whatsapp.net`;
    const msg = `مرحباً ${name || ""} 👋\n\nرمز التحقق الخاص بك:\n\n*${otp}*\n\n⏱ صالح لمدة 10 دقائق.\n🔒 لا تشاركه مع أحد.`;
    await this.sendText(chatId, msg, false);
  }

  // ── Send order/project update via WhatsApp ────────────────────────────────
  async sendNotification(phoneRaw: string | null | undefined, message: string) {
    if (!phoneRaw) throw new Error("رقم واتساب غير متوفر");
    if (this.status !== "connected") throw new Error("WhatsApp غير متصل");
    const phone = phoneRaw.replace(/\D/g, "");
    if (phone.length < 7) throw new Error("رقم واتساب غير صالح");
    const chatId = `${phone}@s.whatsapp.net`;
    await this.sendText(chatId, message, false);
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

    // WhatsApp login approvals must be handled before admin, employee, client,
    // or AI routing. This keeps a reply such as "1" from being interpreted as
    // a normal chat command while a login challenge is active.
    if (resolvedPhone) {
      const { WhatsAppLoginChallengeModel } = await import("./models");
      const normalizedReply = cleanText(body).toLocaleLowerCase("ar-SA");
      const isApprove = ["1", "قبول", "موافقة", "approve", "approved"].includes(normalizedReply);
      const isDeny = ["2", "رفض", "deny", "denied", "reject", "no"].includes(normalizedReply);
      if (isApprove || isDeny) {
        const incomingDigits = phoneDigits(resolvedPhone);
        const incomingLast9 = incomingDigits.slice(-9);
        const challenge: any = await WhatsAppLoginChallengeModel.findOneAndUpdate(
          {
            phoneDigits: { $regex: `${incomingLast9}$` },
            status: "pending",
            usedAt: null,
            expiresAt: { $gt: new Date() },
            $expr: { $lt: ["$attempts", "$maxAttempts"] },
          },
          { $inc: { attempts: 1 }, $set: { status: isApprove ? "approved" : "denied" } },
          { new: true, sort: { createdAt: -1 } },
        ).lean();
        if (challenge) {
          await this.sendText(
            chatId,
            isApprove
              ? "تمت الموافقة على طلب تسجيل الدخول إلى QIROX. يمكنك العودة إلى صفحة الدخول."
              : "تم رفض طلب تسجيل الدخول إلى QIROX. لن يتم فتح الجلسة.",
            false,
          );
          return;
        }
      }
    }

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

    // ── Client actions (real system operations, not AI promises) ─────────────
    if (matchedUser && await this.handleClientAction(chatId, body, matchedUser, resolvedPhone)) {
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
    // Keep WhatsApp conversational. A missing setting should never make the
    // customer wait the old 60-second fallback.
    const delayMs = Math.max(0, Number(settings.aiDelaySeconds ?? 5)) * 1000;
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

  // ── Client actions ───────────────────────────────────────────────────────
  // Keep deterministic actions outside the LLM. The assistant can explain
  // results, but only these server-side handlers can create a booking or expose
  // the requesting client's own data.
  private async handleClientAction(chatId: string, body: string, client: any, resolvedPhone: string): Promise<boolean> {
    const text = cleanText(body);
    const lower = text.toLowerCase();
    const clientId = client._id || client.id;
    const clientName = client.fullName || client.username || "عميل QIROX";
    const clientPhone = cleanText(client.whatsappNumber || client.phone || resolvedPhone);

    // The account shortcut gives the client their own portal, projects,
    // orders, subscriptions and safe project preview links.
    if (/(حسابي|لوحتي|مشاريعي|طلباتي|اشتراكي|حالة طلبي|status|my account|my projects|my orders)/i.test(lower)) {
      try {
        const { OrderModel, ProjectModel, ProjectSubscriptionModel } = await import("./models");
        const [orders, projects, subscriptions] = await Promise.all([
          OrderModel.find({ userId: clientId }).sort({ createdAt: -1 }).limit(5).lean(),
          ProjectModel.find({ clientId }).sort({ createdAt: -1 }).limit(5).lean(),
          ProjectSubscriptionModel.find({ clientId }).sort({ createdAt: -1 }).limit(5).lean(),
        ]);

        const orderLines = (orders as any[]).map((order) =>
          `• #${String(order._id).slice(-6).toUpperCase()} — ${order.projectType || order.businessName || "طلب"} — ${ARABIC_STATUS[order.status] || order.status || "غير محدد"}`
        ).join("\n") || "• لا توجد طلبات مسجلة";
        const projectLines = (projects as any[]).map((project) => {
          const link = project.productionUrl || project.stagingUrl;
          return `• ${project.name || project.title || "مشروع"} — ${ARABIC_STATUS[project.status] || project.status || "غير محدد"}${link ? `\n  ${link}` : ""}`;
        }).join("\n") || "• لا توجد مشاريع مسجلة";
        const subscriptionLines = (subscriptions as any[]).map((subscription) => {
          const lifetime = subscription.period === "lifetime";
          const expiresAt = subscription.expiresAt ? new Date(subscription.expiresAt) : null;
          const remaining = lifetime
            ? "دائم"
            : expiresAt
              ? `${Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000))} يوم متبقٍ`
              : "غير محدد";
          return `• ${subscription.planTier || "اشتراك المشروع"} — ${remaining}${expiresAt ? ` — ينتهي ${expiresAt.toLocaleDateString("ar-SA")}` : ""}`;
        }).join("\n") || "• لا يوجد اشتراك مشروع مسجل";

        await this.sendText(
          chatId,
          `مرحباً ${clientName}، هذه معلومات حسابك في QIROX:\n\n` +
          `📋 الطلبات:\n${orderLines}\n\n` +
          `🧩 المشاريع:\n${projectLines}\n\n` +
          `⏳ الاشتراكات:\n${subscriptionLines}\n\n` +
          `🔐 لفتح لوحة حسابك وتفاصيل الملفات:\nhttps://qiroxstudio.online/dashboard`,
          false,
        );
      } catch (error: any) {
        console.error("[WA] Client account action failed:", error.message);
        await this.sendText(chatId, "تعذر تحميل بيانات حسابك الآن. حاول بعد قليل أو افتح https://qiroxstudio.online/dashboard", false);
      }
      return true;
    }

    // Only return the number belonging to the requesting chat/client.
    if (/(رقم جوالي|رقم الجوال|جوال[يى]|mobile number|my phone)/i.test(lower)) {
      await this.sendText(
        chatId,
        clientPhone
          ? `رقم الجوال المسجل في حسابك هو: ${clientPhone}`
          : "لا يوجد رقم جوال مسجل في حسابك. حدّث بياناتك من لوحة الحساب: https://qiroxstudio.online/dashboard",
        false,
      );
      return true;
    }

    // Explicit booking commands create a pending consultation and return a
    // trackable reference. Questions about availability are left to the AI.
    const bookingMatch = text.match(/^(?:احجز|أبغى أحجز|ابغى احجز|أرغب بالحجز|ارغب بالحجز|حجز لي|موعد لي|book|schedule)(?:\s+(.*))?$/i);
    if (bookingMatch) {
      const topic = cleanText(bookingMatch[1]) || "استشارة عامة عبر واتساب";
      try {
        const { ConsultationBookingModel, UserModel } = await import("./models");
        const recent = await ConsultationBookingModel.findOne({
          clientId,
          status: "pending",
          createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
        }).sort({ createdAt: -1 }).lean();
        if (recent) {
          const existingRef = `QS-${String((recent as any)._id).slice(-6).toUpperCase()}`;
          await this.sendText(chatId, `لديك طلب حجز قيد المراجعة بالفعل.\nرقم المرجع: *${existingRef}*\nhttps://qiroxstudio.online/track/${existingRef}`, false);
          return true;
        }

        const booking = await ConsultationBookingModel.create({
          clientId,
          clientName,
          clientEmail: client.email || "",
          clientPhone,
          consultationType: "phone",
          topic,
          notes: "تم إنشاء الحجز عبر مساعد QIROX في واتساب.",
          status: "pending",
        });
        const bookingId = String((booking as any)._id || (booking as any).id);
        const refNumber = `QS-${bookingId.slice(-6).toUpperCase()}`;

        const admins = await UserModel.find(
          { role: { $in: ["admin", "manager", "sales", "sales_manager"] } },
          { email: 1, fullName: 1 },
        ).lean();
        const { sendConsultationNotificationEmail } = await import("./email");
        await Promise.all(admins.map((admin: any) => admin.email
          ? sendConsultationNotificationEmail(admin.email, admin.fullName || admin.email, {
              bookingId,
              clientName,
              clientEmail: client.email || "",
              clientPhone,
              date: "سيتم التحديد لاحقاً",
              startTime: "",
              endTime: "",
              consultationType: "phone",
              topic,
            }).catch((error: any) => console.error("[WA] Booking notification failed:", error.message))
          : Promise.resolve()));

        await this.sendText(
          chatId,
          `تم تسجيل طلب الحجز بنجاح يا ${clientName}.\n\n` +
          `الموضوع: ${topic}\n` +
          `رقم المرجع: *${refNumber}*\n` +
          `سيتواصل معك فريق QIROX لتأكيد الموعد.\n\n` +
          `متابعة الطلب:\nhttps://qiroxstudio.online/track/${refNumber}`,
          false,
        );
      } catch (error: any) {
        console.error("[WA] Client booking failed:", error.message);
        await this.sendText(chatId, "لم يتم إنشاء الحجز لأن النظام واجه مشكلة مؤقتة. حاول مرة أخرى بعد قليل.", false);
      }
      return true;
    }

    if (/(حجوزاتي|مواعيدي|حجزياتي|my bookings|my appointments)/i.test(lower)) {
      try {
        const { ConsultationBookingModel } = await import("./models");
        const bookings = await ConsultationBookingModel.find({ clientId }).sort({ createdAt: -1 }).limit(5).lean();
        const status: Record<string, string> = {
          pending: "قيد المراجعة", confirmed: "مؤكد", rejected: "مرفوض",
          cancelled: "ملغى", completed: "مكتمل",
        };
        const lines = (bookings as any[]).map((booking) => {
          const ref = `QS-${String(booking._id).slice(-6).toUpperCase()}`;
          const date = booking.date ? new Date(booking.date).toLocaleDateString("ar-SA") : "بانتظار تحديد الموعد";
          return `• ${ref} — ${status[booking.status] || booking.status} — ${date}\n  https://qiroxstudio.online/track/${ref}`;
        }).join("\n") || "لا توجد حجوزات مسجلة.";
        await this.sendText(chatId, `حجوزاتك في QIROX:\n\n${lines}`, false);
      } catch (error: any) {
        console.error("[WA] Client bookings lookup failed:", error.message);
        await this.sendText(chatId, "تعذر تحميل حجوزاتك الآن. حاول بعد قليل.", false);
      }
      return true;
    }

    return false;
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

    const extra = settings?.systemPromptExtra ? `\n\nمعلومات إضافية معتمدة من فريق QIROX:\n${settings.systemPromptExtra}` : "";
    const languageRule = `هذه محادثة واتساب لعميل عربي. اكتب بالعربية دائماً وبلهجة سعودية/خليجية طبيعية ومفهومة. لا تكتب الفرنسية أو الصينية أو أي لغة أخرى. إذا كتب العميل بالإنجليزية بوضوح، يمكن الرد بالإنجليزية؛ أما أي لغة غير العربية والإنجليزية فاطلب منه التوضيح بالعربية. لا تخترع تنفيذ إجراء: استخدم فقط المعلومات الموجودة في السياق.`;
    const contextMessage = {
      role: "system" as const,
      content: `${languageRule}\nاسم العميل: ${senderName}${extra}${clientContext}\n\nإذا سأل العميل عن حسابه أو مشاريعه أو طلباته فقدم له رابط لوحة التحكم، ولا تعرض بيانات أي شخص آخر.`,
    };

    // Use the same QIROX AI Hub as the admin/API assistant. This enables RAG
    // over the managed knowledge base, live system context and one provider
    // path instead of a disconnected WhatsApp-only prompt.
    const chatMessages: any[] = [
      contextMessage,
      ...history.map((m: any) => ({
        role: m.fromMe ? "assistant" : "user",
        content: m.body || "(رسالة وسائط)",
      })),
    ];

    // Safety: ensure last message is from user
    if (chatMessages[chatMessages.length - 1]?.role === "assistant") {
      chatMessages.push({ role: "user", content: "(أكمل المحادثة)" });
    }

    const { qiroxChat } = await import("./qirox-ai-engine");
    const result = await qiroxChat(chatMessages, {
      source: "whatsapp",
      useRag: true,
    });
    const reply = result.reply.trim();
    if (!reply) {
      return isArabicMessage(history.at(-1)?.body || "")
        ? "أهلاً بك في QIROX. اكتب سؤالك عن الخدمات أو مشروعك أو حسابك وسأساعدك."
        : "QIROX is ready to help with your services, project, or account.";
    }
    // The local model can occasionally ignore the language instruction and
    // answer in French. Do not send that to a customer; a clear Arabic
    // fallback is better than a confident but unusable reply.
    if (isBadArabicReply(reply, history.at(-1)?.body || "")) {
      return "أهلاً بك في QIROX. أقدر أساعدك في الخدمات، حالة الطلب، المشاريع، الاشتراك، الحجز، أو فتح لوحة حسابك. اكتب طلبك بالعربية وسأتابع معك.";
    }
    return reply;
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
