/**
 * QIROX WhatsApp Module — powered by @whiskeysockets/baileys (free, no Chrome)
 * - Connects via WhatsApp Web QR code
 * - AI auto-responder (configurable delay, dialect-aware)
 * - Admin command execution (promo codes, emails, reports)
 * - SSE events for real-time admin UI updates
 */

import { EventEmitter } from "events";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { normalizeManualMarketingPhone } from "@shared/manual-marketing";
import { normalizeArabicDigits } from "@shared/arabic-digits";

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

const MANUAL_MARKETING_REPLY_CHAT_ID = "966532441566@s.whatsapp.net";

function cleanText(value: unknown): string {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeApprovalText(value: unknown): string {
  return normalizeArabicDigits(cleanText(value).normalize("NFKC"))
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .toLocaleLowerCase("ar-SA");
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
  return normalizeArabicDigits(String(value || "")).replace(/\D/g, "");
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
  private connectionError: string | null = null;
  private pendingAITimers = new Map<string, ReturnType<typeof setTimeout>>();
  private sseClients = new Set<any>(); // res objects for SSE

  // Reconnect — unlimited retries with exponential backoff; email alert after 10 failures
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private disconnectAlertSent = false; // send email only once per outage
  private authSaveQueue: Promise<void> = Promise.resolve();
  private stopping = false;
  private connectionGeneration = 0;

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
      error: this.connectionError,
    };
  }

  // ── Auto-connect on server startup if saved session exists ────────────────
  async autoConnect() {
    const AUTH_DIR = path.join(process.cwd(), ".whatsapp-auth");
    const credsFile = path.join(AUTH_DIR, "creds.json");
    const generation = this.connectionGeneration;
    const isCurrentStartup = () => this.connectionGeneration === generation && !this.stopping;
    await this.restoreAuthState(AUTH_DIR, isCurrentStartup);
    if (!isCurrentStartup()) return;
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
    if (!isCurrentStartup()) return;
    console.log("[WA] Found saved session — auto-connecting...");
    this.connect().catch(e => console.error("[WA] Auto-connect failed:", e.message));
  }

  // ── Connection ────────────────────────────────────────────────────────────
  async connect() {
    if (this.status === "connected" || this.status === "qr" || this.status === "connecting") return;
    // Prevent concurrent connect calls
    if (this.sock) await this.shutdown(false);
    const generation = ++this.connectionGeneration;
    const isCurrentConnection = () => this.connectionGeneration === generation && !this.stopping;
    this.stopping = false;

    // Clear any pending reconnect timer
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }

    this.status = "connecting";
    this.qrString = null;
    this.connectionError = null;
    this.sendSSE({ type: "status", ...this.getStatus() });

    try {
      // new Function prevents esbuild from rewriting import() → require() in CJS bundle
      // @whiskeysockets/baileys is ESM-only; require() breaks it at runtime on Render
      const _dyn = new Function("m", "return import(m)");
      const baileys = await _dyn("@whiskeysockets/baileys");
      if (!isCurrentConnection()) return;
      const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = baileys;

      const AUTH_DIR = path.join(process.cwd(), ".whatsapp-auth");
      if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
      await this.restoreAuthState(AUTH_DIR, isCurrentConnection);
      if (!isCurrentConnection()) return;

      const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
      // Persist an existing local session as well, so a deployment that still
      // has the auth directory seeds the durable MongoDB copy immediately.
      await this.persistAuthState(AUTH_DIR);
      if (!isCurrentConnection()) return;

      // Fetch latest WA version with a safe fallback — external HTTP, can fail
      let version: number[];
      try {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        const v = await Promise.race([
          fetchLatestBaileysVersion(),
          new Promise<never>((_, reject) => {
            timeout = setTimeout(() => reject(new Error("Timed out fetching the WhatsApp Web version")), 8000);
          }),
        ]).finally(() => {
          if (timeout) clearTimeout(timeout);
        });
        version = v.version;
      } catch (error: any) {
        version = [2, 3000, 1015901307]; // known-good fallback
        console.warn("[WA] Could not fetch WhatsApp Web version; using fallback:", error?.message || error);
      }
      if (!isCurrentConnection()) return;

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

      const socket = makeWASocket({
        version,
        auth: state,
        browser: Browsers.ubuntu("QIROX CRM"),
        printQRInTerminal: false,
        logger: silentLogger as any,
        syncFullHistory: false,
        getMessage: async () => undefined,
      });
      if (!isCurrentConnection()) {
        try { socket.ws?.terminate?.(); } catch {}
        try { socket.ev?.removeAllListeners?.(); } catch {}
        return;
      }
      this.sock = socket;

      socket.ev.on("creds.update", () => {
        if (!isCurrentConnection()) return;
        this.queueAuthPersistence(saveCreds, AUTH_DIR).catch((err) => {
          console.error("[WA] Failed to persist auth state:", err?.message || err);
        });
      });

      socket.ev.on("connection.update", (update: any) => {
        if (!isCurrentConnection()) return;
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrString = qr;
          this.status = "qr";
          this.connectionError = null;
          this.reconnectAttempts = 0; // QR appeared = fresh session, reset counter
          console.info("[WA] QR challenge received");
          this.sendSSE({ type: "status", ...this.getStatus() });
        }

        if (connection === "open") {
          this.reconnectAttempts = 0;      // reset counter
          this.disconnectAlertSent = false; // reset alert so next outage triggers a new one
          this.status = "connected";
          this.qrString = null;
          this.connectionError = null;
          this.connectedPhone = socket?.user?.id?.split(":")?.[0] || null;
          console.info("[WA] WhatsApp connection opened");
          this.sendSSE({ type: "status", ...this.getStatus() });
          this.updateSettingsPhone(this.connectedPhone);
        }

        if (connection === "close") {
          const code = (lastDisconnect?.error as any)?.output?.statusCode;
          const loggedOut = code === DisconnectReason?.loggedOut || code === 401;

          this.status = "disconnected";
          this.connectedPhone = null;
          this.connectionError = loggedOut
            ? "انتهت جلسة واتساب. استخدم «ربط جديد» لمسح الجلسة القديمة وإنشاء باركود."
            : "انقطع اتصال واتساب. جرّب إعادة الاتصال أو إنشاء باركود جديد.";
          console.warn("[WA] Connection closed:", {
            code: code ?? null,
            reason: (lastDisconnect?.error as any)?.message || "unknown",
          });
          this.sendSSE({ type: "status", ...this.getStatus() });

          if (loggedOut && !this.stopping) {
            // Logged out — clear auth, stop reconnecting
            this.reconnectAttempts = 0;
            const AUTH_DIR = path.join(process.cwd(), ".whatsapp-auth");
            try { if (fs.existsSync(AUTH_DIR)) fs.rmSync(AUTH_DIR, { recursive: true, force: true }); } catch {}
            this.clearPersistedAuthState().catch(() => {});
           } else if (!this.stopping) {
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
      socket.ev.on("contacts.upsert", (contacts: any[]) => {
        if (!isCurrentConnection()) return;
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
      socket.ev.on("contacts.update", (contacts: any[]) => {
        if (!isCurrentConnection()) return;
        for (const c of contacts) {
          if (c.id?.endsWith("@s.whatsapp.net") && c.lid) {
            this.registerLID(c.lid, c.id.replace("@s.whatsapp.net", ""));
          }
        }
      });

      // Wrap async message handler — never let it bubble up as UnhandledRejection
      socket.ev.on("messages.upsert", ({ messages, type }: any) => {
        if (!isCurrentConnection()) return;
        if (type !== "notify") return;
        for (const msg of messages) {
          if (msg.key.fromMe) continue;
          this.handleIncoming(msg).catch(e => console.error("[WA] handleIncoming error:", e.message));
        }
      });

    } catch (err: any) {
      if (!isCurrentConnection()) return;
      console.error("[WA] Connect error:", err.message);
      this.status = "disconnected";
      this.connectionError = String(err?.message || "تعذر بدء اتصال واتساب").slice(0, 240);
      this.sendSSE({ type: "status", ...this.getStatus() });
    }
  }

  async shutdown(clearAuth = true) {
    this.connectionGeneration += 1;
    this.stopping = true;
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
    if (clearAuth) this.connectionError = null;
    this.sendSSE({ type: "status", ...this.getStatus() });

    // Finish any already-queued credential write before deleting saved auth,
    // otherwise a queued Mongo write could recreate the session after reset.
    await this.authSaveQueue.catch(() => {});
    if (clearAuth) {
      const AUTH_DIR = path.join(process.cwd(), ".whatsapp-auth");
      if (fs.existsSync(AUTH_DIR)) fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      await this.clearPersistedAuthState();
    }
  }

  async resetAndConnect() {
    await this.shutdown(true);
    await this.connect();
    return this.getStatus();
  }

  private authEncryptionKey(): Buffer | null {
    const secret = process.env.WA_AUTH_ENCRYPTION_KEY || process.env.SESSION_SECRET;
    if (!secret) return null;
    return crypto.createHash("sha256").update(secret).digest();
  }

  private encryptAuthPayload(payload: string): string | null {
    const key = this.authEncryptionKey();
    if (!key) return null;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
    return [iv.toString("base64"), cipher.getAuthTag().toString("base64"), encrypted.toString("base64")].join(".");
  }

  private decryptAuthPayload(value: string): string | null {
    try {
      const key = this.authEncryptionKey();
      if (!key) return null;
      const [ivRaw, tagRaw, encryptedRaw] = value.split(".");
      if (!ivRaw || !tagRaw || !encryptedRaw) return null;
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivRaw, "base64"));
      decipher.setAuthTag(Buffer.from(tagRaw, "base64"));
      return Buffer.concat([
        decipher.update(Buffer.from(encryptedRaw, "base64")),
        decipher.final(),
      ]).toString("utf8");
    } catch {
      return null;
    }
  }

  private async persistAuthState(authDir: string) {
    const encryptedPayload = this.encryptAuthPayload(JSON.stringify(
      Object.fromEntries(
        fs.readdirSync(authDir)
          .filter((name) => name.endsWith(".json"))
          .map((name) => [name, fs.readFileSync(path.join(authDir, name), "utf8")]),
      ),
    ));
    if (!encryptedPayload) {
      console.warn("[WA] Auth persistence skipped: WA_AUTH_ENCRYPTION_KEY or SESSION_SECRET is missing");
      return;
    }
    const { WAAuthStateModel } = await import("./models/whatsapp");
    await WAAuthStateModel.findOneAndUpdate(
      { name: "default" },
      { $set: { payload: encryptedPayload } },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }

  private queueAuthPersistence(saveCreds: () => Promise<void>, authDir: string) {
    this.authSaveQueue = this.authSaveQueue.catch(() => {}).then(async () => {
      await saveCreds();
      await this.persistAuthState(authDir);
    });
    return this.authSaveQueue;
  }

  private async clearPersistedAuthState() {
    try {
      const { WAAuthStateModel } = await import("./models/whatsapp");
      await WAAuthStateModel.deleteOne({ name: "default" });
    } catch (err: any) {
      console.error("[WA] Failed to clear persisted auth state:", err?.message || err);
      throw err;
    }
  }

  private async restoreAuthState(authDir: string, isCurrent: () => boolean = () => true) {
    if (fs.existsSync(path.join(authDir, "creds.json"))) return;
    try {
      const { WAAuthStateModel } = await import("./models/whatsapp");
      const saved: any = await WAAuthStateModel.findOne({ name: "default" }).lean();
      if (!isCurrent()) return;
      if (!saved?.payload) return;
      const decrypted = this.decryptAuthPayload(saved.payload);
      if (!decrypted) {
        console.warn("[WA] Saved auth state could not be decrypted with the current key");
        return;
      }
      const files = JSON.parse(decrypted) as Record<string, string>;
      if (!isCurrent()) return;
      fs.mkdirSync(authDir, { recursive: true });
      for (const [name, contents] of Object.entries(files)) {
        if (!name.endsWith(".json") || typeof contents !== "string") continue;
        fs.writeFileSync(path.join(authDir, name), contents, "utf8");
      }
      console.log("[WA] Restored saved session from encrypted MongoDB state");
    } catch (err: any) {
      console.error("[WA] Failed to restore saved session:", err?.message || err);
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

  async sendDocumentNotification(
    phoneRaw: string | null | undefined,
    content: Buffer,
    filename: string,
    contentType: string,
    caption = "",
  ) {
    if (!phoneRaw) throw new Error("رقم واتساب غير متوفر");
    if (!this.sock || this.status !== "connected") throw new Error("WhatsApp غير متصل");
    const phone = phoneRaw.replace(/\D/g, "");
    if (phone.length < 7) throw new Error("رقم واتساب غير صالح");
    const chatId = `${phone}@s.whatsapp.net`;
    await this.sock.sendMessage(chatId, {
      document: content,
      mimetype: contentType || "application/octet-stream",
      fileName: filename || "attachment",
      ...(caption ? { caption } : {}),
    });
    const sentAt = new Date();
    await this.persistMessage({
      chatId,
      fromMe: true,
      body: caption || `[Email attachment: ${filename || "attachment"}]`,
      timestamp: sentAt,
      mediaType: "document",
    });
    this.sendSSE({
      type: "message",
      chatId,
      fromMe: true,
      body: caption || `[Email attachment: ${filename || "attachment"}]`,
      timestamp: sentAt.toISOString(),
    });
  }

  // ── Send messages ─────────────────────────────────────────────────────────
  async sendText(chatId: string, text: string, aiGenerated = false) {
    if (!this.sock || this.status !== "connected") throw new Error("WhatsApp غير متصل");
    await this.sock.sendMessage(chatId, { text });
    const sentAt = new Date();
    this.sendSSE({ type: "message", chatId, fromMe: true, body: text, aiGenerated, timestamp: sentAt.toISOString() });
    void this.persistMessage({ chatId, fromMe: true, body: text, aiGenerated, timestamp: sentAt })
      .catch(error => console.error("[WhatsApp] Could not persist sent message:", error));
  }

  async sendImageBuffer(chatId: string, image: Buffer, caption = "", aiGenerated = false) {
    if (!this.sock || this.status !== "connected") throw new Error("WhatsApp غير متصل");
    await this.sock.sendMessage(chatId, { image, caption });
    const sentAt = new Date();
    const body = caption || "[صورة]";
    this.sendSSE({
      type: "message",
      chatId,
      fromMe: true,
      body,
      aiGenerated,
      mediaType: "image",
      timestamp: sentAt.toISOString(),
    });
    void this.persistMessage({
      chatId,
      fromMe: true,
      body,
      aiGenerated,
      mediaType: "image",
      timestamp: sentAt,
    }).catch(error => console.error("[WhatsApp] Could not persist sent image:", error));
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
    // Baileys can deliver a direct message with a @lid remote JID while the
    // phone-based alternate JID is present on the message key. Prefer that
    // alternate identity and cache it so approval replies can find the
    // challenge created against the user's phone number.
    const alternateJids = [
      msg.key.remoteJidAlt,
      msg.key.participantAlt,
      msg.key.participant,
    ].filter((value): value is string => typeof value === "string" && value.length > 0);
    const alternatePhone = alternateJids.map(jid => this.resolvePhone(jid)).find(Boolean) || "";
    if (chatId.endsWith("@lid") && alternatePhone) this.registerLID(chatId, alternatePhone);
    const resolvedPhone = this.resolvePhone(chatId) || alternatePhone;
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
    const matchedUsers: any[] = last9 ? await UserModel.find({
      $or: [
        { phone: { $regex: last9 } },
        { whatsappNumber: { $regex: last9 } },
      ],
    }).select("fullName username role email phone whatsappNumber _id").limit(2).lean() : [];
    const matchedUser: any = matchedUsers.length === 1 ? matchedUsers[0] : null;

    // WhatsApp login approvals must be handled before admin, employee, client,
    // or AI routing. This keeps a reply such as "1" from being interpreted as
    // a normal chat command while a login challenge is active.
    if (resolvedPhone) {
      const { WhatsAppLoginChallengeModel } = await import("./models");
      const normalizedReply = normalizeApprovalText(body);
      const isApprove = ["1", "قبول", "موافق", "موافقة", "نعم", "تم", "approve", "approved", "yes", "ok"].includes(normalizedReply);
      const isDeny = ["2", "رفض", "غير موافق", "لا", "deny", "denied", "reject", "no"].includes(normalizedReply);
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
        const approvalMessage = challenge.purpose === "setup"
          ? "تمت الموافقة على تفعيل التحقق الثنائي عبر واتساب في QIROX."
          : challenge.purpose === "2fa"
            ? "تمت الموافقة على طلب التحقق الثنائي في QIROX."
            : "تمت الموافقة على طلب تسجيل الدخول إلى QIROX. يمكنك العودة إلى صفحة الدخول.";
          await this.sendText(
            chatId,
          isApprove
            ? approvalMessage
            : challenge.purpose === "setup"
              ? "تم رفض طلب تفعيل التحقق الثنائي عبر واتساب."
              : "تم رفض طلب التحقق في QIROX. لن يتم فتح الجلسة.",
            false,
          );
          return;
        }
      }
    }

    // Replies to a manually sent marketing message go to the designated sales
    // contact, never to the AI auto-responder. Keep login approval handling
    // above this branch so authentication replies retain priority.
    const normalizedMarketingPhone = normalizeManualMarketingPhone(resolvedPhone);
    if (normalizedMarketingPhone) {
      const {
        ManualMarketingCampaignModel,
        ManualMarketingLeadModel,
        ensureManualMarketingLeadStore,
      } = await import("./models/whatsapp");
      const campaign: any = await ManualMarketingCampaignModel.findOne({
        normalizedPhone: normalizedMarketingPhone,
        status: { $in: ["active", "sending", "opted_out"] },
      }).sort({ sentAt: -1, createdAt: -1 }).lean();

      if (campaign?.status === "opted_out") {
        await ensureManualMarketingLeadStore();
        const replyText = body.trim()
          ? body.trim().slice(0, 3000)
          : "[وصل رد واتساب بدون نص، قد يحتوي على وسائط]";
        const isOptOutReply =
          /^(?:إيقاف|ايقاف|وقف|إلغاء|الغاء|لا ترسل(?:ون)?|stop|unsubscribe)(?:$|[\s.!،])/i.test(
            body.trim().toLowerCase(),
          );
        const replyUpdate: any = {
          lastReplyAt: new Date(ts.getTime()),
          lastReplyPreview: replyText.slice(0, 500),
          lastReplyContactName: (cleanText(pushName) || "غير ظاهر في واتساب").slice(0, 120),
        };
        if (isOptOutReply) {
          Object.assign(replyUpdate, {
            leadStatus: "excluded",
            exclusionSource: "recipient_opt_out",
            excludedAt: new Date(ts.getTime()),
            statusUpdatedAt: new Date(ts.getTime()),
          });
        }
        await ManualMarketingLeadModel.updateOne(
          { normalizedPhone: normalizedMarketingPhone },
          { $set: replyUpdate },
        ).catch((error: any) => {
          console.error("[WhatsApp] Could not persist manual marketing opt-out:", error?.message || error);
        });
        await this.setHumanOverride(chatId, 999 * 60);
        return;
      }

      if (campaign && ["active", "sending"].includes(campaign.status)) {
        await ensureManualMarketingLeadStore();
        await this.setHumanOverride(chatId, 999 * 60);
        const inboundMessageId = String(
          msg.key.id || `${normalizedMarketingPhone}-${ts.getTime()}-${body.slice(0, 80)}`,
        );
        const claimedCampaign = await ManualMarketingCampaignModel.findOneAndUpdate(
          {
            _id: campaign._id,
            status: { $in: ["active", "sending"] },
            forwardedMessageIds: { $ne: inboundMessageId },
          },
          { $addToSet: { forwardedMessageIds: inboundMessageId } },
          { new: true },
        ).lean();

        if (!claimedCampaign) return;

        const normalizedReply = body.trim().normalize("NFKC");
        const isOptOutReply =
          /^(?:إيقاف|ايقاف|وقف|إلغاء|الغاء|لا ترسل(?:ون)?|stop|unsubscribe)(?:$|[\s.!،])/i.test(normalizedReply);
        const replyText = body.trim()
          ? body.trim().slice(0, 3000)
          : "[وصل رد واتساب بدون نص، قد يحتوي على وسائط]";
        const contactName = cleanText(pushName) || "غير ظاهر في واتساب";
        const businessName = cleanText(campaign.businessName) || "لم يُحدد";
        const leadReplySet: any = {
          lastReplyAt: new Date(ts.getTime()),
          lastReplyPreview: replyText.slice(0, 500),
          lastReplyContactName: contactName.slice(0, 120),
        };
        if (isOptOutReply) {
          Object.assign(leadReplySet, {
            leadStatus: "excluded",
            exclusionSource: "recipient_opt_out",
            excludedAt: new Date(ts.getTime()),
            statusUpdatedAt: new Date(ts.getTime()),
          });
        }
        const leadInsertDefaults: any = {
          chatId: campaign.chatId || chatId,
          sector: campaign.sector,
          countryCode: campaign.countryCode || "SA",
          language: campaign.language || "ar",
          businessName: campaign.businessName || "",
          latestCampaignId: campaign._id,
          sentAt: campaign.sentAt || ts,
          sentBy: campaign.sentBy || null,
          recipientConsentConfirmed: campaign.recipientConsentConfirmed === true,
        };
        if (!isOptOutReply) leadInsertDefaults.leadStatus = "sent";
        await ManualMarketingLeadModel.findOneAndUpdate(
          { normalizedPhone: normalizedMarketingPhone },
          {
            $set: leadReplySet,
            $setOnInsert: leadInsertDefaults,
          },
          { upsert: true, new: true, setDefaultsOnInsert: false },
        ).catch((error: any) => {
          console.error("[WhatsApp] Could not update manual marketing lead reply:", error?.message || error);
        });
        const forwardMessage = [
          "📩 رد على رسالة التسويق اليدوي",
          `اسم العميل على واتساب: ${contactName}`,
          `اسم المقهى/الشركة: ${businessName}`,
          `رقم العميل: +${normalizedMarketingPhone}`,
          `القطاع: ${campaign.sector}`,
          "",
          replyText,
          body.trim().length > 3000 ? "\n[تم اختصار الرد لطوله]" : "",
        ].filter(Boolean).join("\n");

        try {
          await this.sendText(MANUAL_MARKETING_REPLY_CHAT_ID, forwardMessage, false);
        } catch (error: any) {
          await ManualMarketingCampaignModel.updateOne(
            { _id: campaign._id },
            { $pull: { forwardedMessageIds: inboundMessageId } },
          );
          console.error("[WhatsApp] Could not forward manual marketing reply:", error?.message || error);
        }

        if (isOptOutReply) {
          await ManualMarketingCampaignModel.updateMany(
            { normalizedPhone: normalizedMarketingPhone, status: { $in: ["active", "sending"] } },
            { $set: { status: "opted_out" } },
          );
        }
        return;
      }
    }

    // ── Admin WA command check (by saved admin numbers) ────────────────────
    const adminNums: string[] = settings.adminNumbers || [];
    const isWAAdmin = last9 && adminNums.some((n: string) => n.replace(/\D/g, "").slice(-9) === last9);
    const isMailCommand = /أرسل بريد|ارسل بريد|send email/i.test(body);
    if (isWAAdmin) {
      if (isMailCommand) {
        if (!matchedUser) {
          await this.sendText(chatId, "⛔ لا يمكن إرسال البريد لأن رقم واتساب غير مرتبط بحساب موظف موثّق.", false);
        } else {
          await this.handleMailboxEmailCommand(chatId, body, matchedUser);
        }
        return;
      }
      await this.handleAdminCommand(chatId, body, settings, matchedUser);
      return;
    }

    if (isMailCommand) {
      const { ALL_EMPLOYEE_MAIL_ROLES } = await import("./mail-access");
      if (!matchedUser || !ALL_EMPLOYEE_MAIL_ROLES.includes(matchedUser.role) || matchedUser.role === "investor") {
        await this.sendText(chatId, "⛔ أمر إرسال البريد متاح للموظفين المرتبطين بحساب موثّق فقط.", false);
      } else {
        await this.handleMailboxEmailCommand(chatId, body, matchedUser);
      }
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
      `• *أرسل بريد إلى [email] موضوع [X] محتوى [Y]* — الإرسال من info\n` +
      `• *أرسل بريد من [mailbox] إلى [email] موضوع [X] محتوى [Y]*\n` +
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
      return this.handleMailboxEmailCommand(chatId, body, employee);
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

  private async handleMailboxEmailCommand(chatId: string, command: string, sender: any) {
    const { ALL_EMPLOYEE_MAIL_ROLES } = await import("./mail-access");
    const role = String(sender?.role || "");
    if (!sender?._id || !ALL_EMPLOYEE_MAIL_ROLES.includes(role) || role === "investor") {
      return this.sendText(chatId, "⛔ لا تملك صلاحية إرسال البريد.", false);
    }

    const explicitMailbox = command.match(/(?:من|from)\s+([\w.-]+(?:@[\w.-]+\.[a-z]{2,})?)/i)?.[1]?.trim().toLowerCase();
    const { MailAccountModel } = await import("./models/mail");
    const mailboxes = await MailAccountModel.find({}).select("_id emailAddress accountType").lean() as any[];
    const requestedMailbox = explicitMailbox || "info";
    const matches = mailboxes.filter((candidate) => {
      if (candidate.accountType === "customer") return false;
      const address = String(candidate.emailAddress || "").trim().toLowerCase();
      if (!address) return false;
      return requestedMailbox.includes("@")
        ? address === requestedMailbox
        : address.split("@")[0] === requestedMailbox;
    });
    if (matches.length !== 1) {
      return this.sendText(chatId, "⚠️ لم أجد صندوق البريد المطلوب أو أن اسمه غير فريد. استخدم عنوان البريد الكامل.", false);
    }
    const mailbox = matches[0];

    const explicitTo = command.match(/(?:إلى|الى|to)\s*([\w.+%-]+@[\w.-]+\.[a-z]{2,})/i)?.[1];
    const emailCandidates = [...command.matchAll(/[\w.+%-]+@[\w.-]+\.[a-z]{2,}/ig)].map((match) => match[0]);
    const to = explicitTo || emailCandidates.find((address) =>
      address.toLowerCase() !== String(mailbox.emailAddress).toLowerCase(),
    );
    if (!to) return this.sendText(chatId, "⚠️ أضف عنوان المستلم بهذا الشكل: إلى user@example.com", false);

    const subjectMatch = command.match(/(?:موضوع|subject)\s*[:：]?\s*(.+?)(?:\s+(?:محتوى|نص|الرسالة|body)\s*[:：]?|$)/i);
    const bodyMatch = command.match(/(?:محتوى|نص|الرسالة|body)\s*[:：]?\s*([\s\S]+)$/i);
    const subject = subjectMatch?.[1]?.trim();
    const body = bodyMatch?.[1]?.trim();
    if (!subject || !body) {
      return this.sendText(chatId, "⚠️ أضف الموضوع والمحتوى بهذا الشكل: أرسل بريد إلى user@example.com موضوع: ... محتوى: ...", false);
    }

    try {
      const { sendWhatsAppAccountMail } = await import("./domains/mail/service");
      const result = await sendWhatsAppAccountMail(
        { fromAddress: String(mailbox.emailAddress), to, subject, body },
        { _id: String(sender._id), role },
      );
      if (!result.ok) {
        return this.sendText(chatId, "⛔ لا تملك صلاحية الإرسال من هذا الصندوق أو تعذر العثور عليه.", false);
      }
      const sentCopyWarning = result.data.sentCopySaved
        ? ""
        : "\n⚠️ تم قبول الرسالة للإرسال، لكن تعذر حفظ نسخة في Sent. لا تعِد الإرسال لتجنب التكرار.";
      return this.sendText(chatId, `✅ تم إرسال البريد من ${mailbox.emailAddress} إلى ${to}${sentCopyWarning}`, false);
    } catch (error: any) {
      return this.sendText(chatId, `❌ فشل إرسال البريد: ${error?.message || "خطأ غير معروف"}`, false);
    }
  }

  // ── Admin command handler ─────────────────────────────────────────────────
  private async handleAdminCommand(chatId: string, command: string, settings: any, sender?: any) {
    const lower = command.toLowerCase().trim().replace(/['"''""]/g, "").replace(/\s+/g, " ");

    const HELP_MSG =
      `📋 *أوامر الأدمن — QIROX*\n\n` +
      `• *help* — قائمة الأوامر\n` +
      `• *أوقف الذكاء* / *شغّل الذكاء*\n` +
      `• *أنشئ كود [X]%* — كود خصم\n` +
      `• *أرسل بريد إلى [email] موضوع [X] محتوى [Y]* — الإرسال من info\n` +
      `• *أرسل بريد من [mailbox] إلى [email] موضوع [X] محتوى [Y]*\n` +
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
      return this.handleMailboxEmailCommand(chatId, command, sender);
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
