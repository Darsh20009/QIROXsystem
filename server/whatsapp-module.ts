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

  // ── Connection ────────────────────────────────────────────────────────────
  async connect() {
    if (this.sock) await this.shutdown(false); // restart without clearing auth

    this.status = "connecting";
    this.qrString = null;
    this.sendSSE({ type: "status", ...this.getStatus() });

    try {
      const baileys = await import("@whiskeysockets/baileys" as any);
      const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = baileys;

      const AUTH_DIR = path.join(process.cwd(), ".whatsapp-auth");
      if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

      const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
      const { version } = await fetchLatestBaileysVersion();

      this.sock = makeWASocket({
        version,
        auth: state,
        browser: Browsers.ubuntu("QIROX CRM"),
        printQRInTerminal: false,
        logger: { level: "silent", child: () => ({ level: "silent", info: ()=>{}, warn: ()=>{}, error: ()=>{}, debug: ()=>{}, trace: ()=>{}, fatal: ()=>{} }) } as any,
        syncFullHistory: false,
        getMessage: async () => undefined,
      });

      this.sock.ev.on("creds.update", saveCreds);

      this.sock.ev.on("connection.update", (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrString = qr;
          this.status = "qr";
          this.sendSSE({ type: "status", ...this.getStatus() });
        }

        if (connection === "open") {
          this.status = "connected";
          this.qrString = null;
          this.connectedPhone = this.sock?.user?.id?.split(":")?.[0] || null;
          this.sendSSE({ type: "status", ...this.getStatus() });
          this.updateSettingsPhone(this.connectedPhone);
        }

        if (connection === "close") {
          const code = (lastDisconnect?.error as any)?.output?.statusCode;
          const loggedOut = code === DisconnectReason?.loggedOut || code === 401;
          if (loggedOut) {
            this.status = "disconnected";
            this.connectedPhone = null;
            this.sendSSE({ type: "status", ...this.getStatus() });
          } else {
            // Auto-reconnect after 5s
            setTimeout(() => this.connect(), 5000);
          }
        }
      });

      this.sock.ev.on("messages.upsert", async ({ messages, type }: any) => {
        if (type !== "notify") return;
        for (const msg of messages) {
          if (msg.key.fromMe) continue;
          await this.handleIncoming(msg).catch(console.error);
        }
      });

    } catch (err: any) {
      console.error("[WA] Connect error:", err.message);
      this.status = "disconnected";
      this.sendSSE({ type: "status", ...this.getStatus() });
    }
  }

  async shutdown(clearAuth = true) {
    // Cancel pending AI timers
    this.pendingAITimers.forEach(t => clearTimeout(t));
    this.pendingAITimers.clear();

    if (this.sock) {
      try { await this.sock.logout(); } catch {}
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

    const senderName: string = msg.pushName || chatId.split("@")[0];
    const ts = new Date((Number(msg.messageTimestamp) || Date.now() / 1000) * 1000);

    // Persist
    await this.persistMessage({ chatId, messageId: msg.key.id, fromMe: false, senderName, body, timestamp: ts });
    this.sendSSE({ type: "message", chatId, fromMe: false, senderName, body, timestamp: ts.toISOString() });
    this.sendSSE({ type: "chat_update", chatId });

    // Load settings
    const { WASettingsModel, WAChatModel } = await import("./models/whatsapp");
    const settings: any = await WASettingsModel.findOne().lean() || {};

    // Admin command check
    const adminNums: string[] = settings.adminNumbers || [];
    const senderPhone = chatId.replace("@s.whatsapp.net", "").replace(/\D/g, "");
    const isAdmin = adminNums.some((n: string) => n.replace(/\D/g, "") === senderPhone);
    if (isAdmin) {
      await this.handleAdminCommand(chatId, body, settings);
      return;
    }

    // AI auto-responder
    if (!settings.aiEnabled && settings.aiEnabled !== undefined) return;

    const chat: any = await WAChatModel.findOne({ chatId }).lean();
    const humanOverrideUntil = chat?.humanOverrideUntil;
    if (humanOverrideUntil && new Date(humanOverrideUntil) > new Date()) return; // human override active

    const chatAIEnabled = chat?.aiEnabled !== false;
    if (!chatAIEnabled) return;

    // Schedule AI reply
    const delayMs = ((settings.aiDelaySeconds ?? 60)) * 1000;
    const existing = this.pendingAITimers.get(chatId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      this.pendingAITimers.delete(chatId);
      // Re-check override
      const freshChat: any = await WAChatModel.findOne({ chatId }).lean();
      if (freshChat?.humanOverrideUntil && new Date(freshChat.humanOverrideUntil) > new Date()) return;
      if (freshChat?.aiEnabled === false) return;
      try {
        const reply = await this.generateAIReply(chatId, senderName, settings);
        if (reply) await this.sendText(chatId, reply, true);
      } catch (e: any) {
        console.error("[WA-AI] Reply error:", e.message);
      }
    }, delayMs);

    this.pendingAITimers.set(chatId, timer);
  }

  // ── AI response generation ────────────────────────────────────────────────
  private async generateAIReply(chatId: string, senderName: string, settings: any): Promise<string> {
    const { WAMessageModel } = await import("./models/whatsapp");
    const history: any[] = await WAMessageModel.find({ chatId }).sort({ timestamp: -1 }).limit(12).lean();
    history.reverse();

    const { getOpenAIClient: _getOAI } = await import("./lib/openai-client");
    const openai = _getOAI();

    const extra = settings?.systemPromptExtra ? `\n\nمعلومات إضافية:\n${settings.systemPromptExtra}` : "";

    const systemPrompt = `أنت مساعد QIROX الذكي — شركة تطوير برمجيات وأنظمة رقمية في المملكة العربية السعودية.

🏢 الشركة: QIROX Studio | qiroxstudio.online
📋 الخدمات: مواقع إلكترونية، تطبيقات موبايل، أنظمة إدارة أعمال، هوية بصرية، تسويق رقمي
💰 الباقات: Lite / Pro / Infinity — تفاصيل على qiroxstudio.online/prices
🕐 أوقات العمل: السبت–الخميس، 9 صباحاً–6 مساءً (توقيت الرياض)

📌 قواعد ثابتة:
1. تكلم بنفس لغة ولهجة الشخص بالضبط — سعودي رد بالسعودي، مصري بالمصري، خليجي بالخليجي، إنجليزي بالإنجليزي
2. لا تستخدم أبداً اللغة الصينية أو أي لغة غير لغة المستخدم
3. أسلوبك حيوي وودود مثل زميل — مش رسمي ومش بارد
4. رسائل قصيرة ومباشرة — لا تطول بدون داعي
5. ابدأ الرسالة الأولى دائماً بتحية حسب اللغة (هلا 👋 / Hello 👋 / أهلاً)
6. إذا سألك عن الرابط: qiroxstudio.online
7. إذا الموضوع خارج نطاقنا، وجّهه للتواصل المباشر مع الفريق${extra}`;

    const chatMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...history.map((m: any) => ({
        role: m.fromMe ? "assistant" : "user",
        content: m.body || "(رسالة بدون نص)",
      })),
    ];

    // Ensure ends with user message
    if (chatMessages[chatMessages.length - 1]?.role === "assistant") {
      chatMessages.push({ role: "user", content: "(استمر في المحادثة)" });
    }

    const resp = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: chatMessages,
      max_tokens: 400,
      temperature: 0.85,
    });

    return (resp.choices[0]?.message?.content || "").trim();
  }

  // ── Admin command handler ─────────────────────────────────────────────────
  private async handleAdminCommand(chatId: string, command: string, settings: any) {
    const { getOpenAIClient: _getOAI2 } = await import("./lib/openai-client");
    const openai = _getOAI2();

    const systemPrompt = `أنت نظام أوامر QIROX الداخلي. تستقبل أوامر من الأدمن عبر واتساب وتنفذها.

الأوامر المتاحة:
- send_link: إرسال رابط صفحة (params: { page: string, url: string })
- send_report: إرسال إحصائيات النظام (params: {})  
- create_promo: إنشاء كود خصم (params: { code: string, discount: number, type: "percent"|"fixed" })
- send_email: إرسال بريد لعميل (params: { email: string, type: string, name: string })
- toggle_ai: تشغيل أو إيقاف الذكاء الاصطناعي (params: { enabled: boolean })
- help: عرض قائمة الأوامر
- unknown: لم أفهم الأمر

رد بـ JSON فقط: { "action": "send_link|send_report|create_promo|send_email|toggle_ai|help|unknown", "params": {}, "reply": "نص الرد للأدمن بالعربي" }`;

    let result: any = { action: "unknown", params: {}, reply: "لم أفهم الأمر، اكتب 'help' لقائمة الأوامر" };

    try {
      const resp = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: command },
        ],
        max_tokens: 300,
        response_format: { type: "json_object" },
        temperature: 0.2,
      });
      result = JSON.parse(resp.choices[0]?.message?.content || "{}");
    } catch {}

    let replyText = result.reply || "✅ تم";

    // Execute action
    if (result.action === "toggle_ai") {
      const enabled = result.params?.enabled !== false;
      await this.saveSettings({ aiEnabled: enabled });
      replyText = enabled ? "✅ الذكاء الاصطناعي مفعّل الآن" : "⏸ الذكاء الاصطناعي متوقف الآن";
    } else if (result.action === "send_link") {
      const url = result.params?.url || `https://qiroxstudio.online/${(result.params?.page || "")}`;
      replyText = `🔗 ${result.params?.page || "الموقع"}\n${url}`;
    } else if (result.action === "help") {
      replyText = `📋 الأوامر المتاحة:\n• أرسل رابط [اسم الصفحة]\n• أنشئ كود خصم [X]%\n• أرسل تقرير\n• أوقف الذكاء الاصطناعي\n• فعّل الذكاء الاصطناعي\n• أرسل بريد [email]`;
    } else if (result.action === "create_promo") {
      try {
        const { DiscountCodeModel } = await import("./models");
        const code = (result.params?.code || "QIROX" + Math.random().toString(36).slice(-4).toUpperCase()).toUpperCase();
        await (DiscountCodeModel as any).create({
          code,
          discountType: result.params?.type || "percent",
          discountValue: result.params?.discount || 10,
          maxUses: 100,
          usedCount: 0,
          isActive: true,
        });
        replyText = `✅ تم إنشاء كود الخصم\nالكود: *${code}*\nالخصم: ${result.params?.discount || 10}%`;
      } catch (e: any) {
        replyText = `❌ فشل إنشاء الكود: ${e.message}`;
      }
    }

    await this.sendText(chatId, replyText, false);
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
      const chatName = msg.senderName || msg.chatId.split("@")[0];
      await WAChatModel.findOneAndUpdate(
        { chatId: msg.chatId },
        {
          $set: {
            name: msg.fromMe ? undefined : chatName,
            phoneNumber: msg.chatId.replace("@s.whatsapp.net", ""),
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
