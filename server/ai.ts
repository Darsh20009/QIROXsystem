// @ts-nocheck
/**
 * QIROX AI — Powered by OpenAI (via OpenRouter)
 * Intelligent assistant with full platform knowledge, creative responses,
 * analytics insights, and multi-role support.
 */
import type { Express } from "express";
import OpenAI from "openai";
import { sendDirectEmail } from "./email";
import axios from "axios";

/* ─── OpenAI client (OpenRouter compatible) ─── */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://qiroxstudio.online",
    "X-Title": "QIROX Studio AI",
  },
});

const AI_MODEL = "openai/gpt-4o-mini";

/* ─── Serper.dev for web search ─── */
const SERPER_KEY = process.env.SERPER_API_KEY || "1e7d5649e4f81662619b41ffe249c5bea3341eef";
async function searchWeb(query: string): Promise<string> {
  try {
    const res = await axios.post(
      "https://google.serper.dev/search",
      { q: query, hl: "ar", gl: "sa", num: 3 },
      { headers: { "X-API-KEY": SERPER_KEY, "Content-Type": "application/json" }, timeout: 8000 }
    );
    const results = res.data?.organic?.slice(0, 3) || [];
    if (!results.length) return "";
    return results.map((r: any, i: number) => `${i + 1}. ${r.title}: ${r.snippet}`).join("\n");
  } catch {
    return "";
  }
}

/* ─── Session store ─── */
interface Message { role: "user" | "assistant"; content: string }
interface Session {
  history: Message[];
  userId?: string;
  userRole?: string;
}
const sessions = new Map<string, Session>();

function getSession(id: string, userId?: string, role?: string): Session {
  if (!sessions.has(id)) {
    sessions.set(id, { history: [], userId, userRole: role });
  }
  const s = sessions.get(id)!;
  if (userId) s.userId = userId;
  if (role) s.userRole = role;
  return s;
}

/* ─── QIROX Platform System Prompt ─── */
function buildSystemPrompt(userRole?: string, userName?: string, systemData?: any): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("ar-SA");

  const userCtx = systemData ? `
== بيانات المستخدم الحالية ==
${systemData.orders ? `• الطلبات: ${systemData.orders.total} إجمالي | ${systemData.orders.pending} معلق | ${systemData.orders.active} نشط | ${systemData.orders.completed} مكتمل` : ""}
${systemData.projects ? `• المشاريع: ${systemData.projects.total} إجمالي | ${systemData.projects.active} نشط` : ""}
${systemData.wallet ? `• رصيد المحفظة: ${systemData.wallet.balance?.toLocaleString()} ريال` : ""}
${systemData.notifications ? `• الإشعارات غير المقروءة: ${systemData.notifications.unread}` : ""}
${systemData.stats ? `• إحصاءات إضافية: ${JSON.stringify(systemData.stats)}` : ""}
` : "";

  return `أنت **QIROX AI** — المساعد الذكي الرسمي لمنصة QIROX Studio، وكالة تطوير مواقع وتطبيقات سعودية متخصصة.

== هويتك ==
- اسمك: QIROX AI
- شخصيتك: ذكي، ودود، إبداعي، محترف، تتحدث بالعربية الفصيحة المبسّطة مع لمسة سعودية خليجية طبيعية
- أسلوبك: مباشر وواضح، تستخدم الإيموجي باعتدال، تقدم إجابات عملية وقابلة للتطبيق
- اليوم: ${dateStr} — الساعة: ${timeStr}
- المستخدم: ${userName || "الزائر"} | الدور: ${userRole || "زائر"}

== معرفتك الكاملة بمنصة QIROX Studio ==

=== الشركة ===
QIROX Studio وكالة تقنية سعودية متخصصة في تطوير المواقع والتطبيقات وحلول التحول الرقمي.
الرؤية: تمكين الشركات السعودية والعربية من التحول الرقمي بحلول عالمية المستوى.
البريد: info@qiroxstudio.online
المنصة: SaaS متعددة المستأجرين (Multi-tenant) مع صلاحيات متعددة المستويات.

=== الباقات والأسعار ===
1. **باقة لايت** - من 5,000 ريال
   - موقع إلكتروني احترافي، لوحة تحكم، نظام طلبات، إدارة منتجات، دعم فني
   - مثالية لـ: المطاعم الصغيرة، المتاجر الناشئة، مقدمو الخدمات الأفراد
   - المدة: 2-4 أسابيع

2. **باقة برو** - من 10,000 ريال
   - كل ميزات لايت + تطبيق جوال، بوابة دفع إلكتروني، CRM، تقارير متقدمة، ذكاء اصطناعي
   - مثالية لـ: المطاعم المتوسطة، المتاجر المتنامية، شركات الخدمات، المنصات التعليمية
   - المدة: 4-8 أسابيع

3. **باقة إنفينيت** - من 20,000 ريال
   - تخصيص كامل، خادم مخصص، API غير محدودة، فريق دعم مخصص، تكاملات متقدمة
   - مثالية لـ: سلاسل كبيرة، شركات مؤسسية، منصات SaaS، مشاريع حكومية
   - المدة: 8-16 أسبوع

=== طرق الدفع ===
1. المحفظة الإلكترونية (Qirox Pay) — شحن ودفع فوري
2. التحويل البنكي — يُرفع الإيصال في النظام
3. PayPal — دفع دولي آمن
4. التقسيط — حسب الاتفاق مع الفريق

=== صفحات النظام (حسب الدور) ===

**لوحة القيادة (Dashboard)**
- ملخص شامل للأداء: إيرادات، طلبات نشطة، نمو عملاء، تنبيهات
- الرسوم البيانية تُحدَّث لحظياً
- الوصول: جميع الأدوار

**إدارة الطلبات (Orders)**
- إدارة جميع طلبات العملاء من البداية للنهاية
- تغيير الحالة، تعيين موظف مسؤول، إضافة ملاحظات
- إرسال تحديثات تلقائية للعميل
- الوصول: admin, manager, developer, designer, support, sales

**العملاء (Customers)**
- قاعدة بيانات كاملة: تاريخ المعاملات، الطلبات، الفواتير، المراسلات
- بحث وتصفية وتصدير البيانات
- الوصول: admin, manager, sales, sales_manager

**الموظفون (Employees)**
- إدارة الفريق: صلاحيات، رواتب، حضور، مهام، أداء
- لكل موظف لوحة تحكم خاصة به
- الوصول: admin, manager

**المالية (Finance)**
- إيرادات ومصروفات، تقارير الأرباح، التدفق النقدي
- فواتير معلّقة، تحليلات مالية متعمقة
- الوصول: admin, accountant

**لوحة كانبان (Kanban)**
- تتبع مراحل المشاريع بأسلوب كانبان (سحب وإفلات)
- كل بطاقة تمثل مهمة أو مرحلة مشروع
- الوصول: admin, manager, developer, designer

**الفواتير (Invoices)**
- إنشاء وإرسال فواتير احترافية
- تتبع حالة الفاتورة (معلّقة، مدفوعة، متأخرة)
- إرسال تذكيرات تلقائية
- الوصول: admin, accountant, sales

**التحليلات (Analytics)**
- تقارير مفصّلة: أكثر الخدمات مبيعاً، معدل التحويل، مصادر العملاء
- أداء كل موظف، تحليل العقود والمبيعات
- الوصول: admin, manager

**المحفظة (Wallet)**
- رصيد المستخدم، سجل المعاملات، رموز الكاشباك
- Qirox Pay Card للدفع السريع
- الوصول: client

**العقود (Contracts)**
- عرض وتوقيع العقود الرقمية
- محفوظة وقابلة للتحميل دائماً
- الوصول: client, admin

**برنامج الولاء (Loyalty)**
- كل 100 ريال = 10 نقاط ولاء
- 500 نقطة = 50 ريال خصم
- الوصول: client

**الحضور والانصراف (Attendance)**
- تسجيل الحضور بالبصمة أو الكود
- حساب ساعات العمل والإضافية تلقائياً
- تقارير شهرية للمحاسبة
- الوصول: admin, manager, موظفون

**الرواتب (Payroll)**
- راتب أساسي، بدلات، خصومات
- إرسال إيصالات الراتب تلقائياً
- الوصول: admin, accountant

**QMeet (اجتماعات فيديو)**
- منصة مؤتمرات فيديو مدمجة داخل النظام
- إنشاء غرف اجتماع، تسجيل جلسات
- الوصول: admin, manager, employee

**مساحة العمل (ProjectWorkspace)**
- مساحة تعاون للمشاريع مع العملاء
- ملفات، تعليقات، جدول زمني، تقدم
- الوصول: admin, employee, client

**الإشعارات (Notifications)**
- إشعارات فورية عبر WebSocket
- دعم إشعارات الدفع (Web Push + PWA)
- نظام قراءة/غير مقروء

**PWA (Progressive Web App)**
- تثبيت التطبيق على الجهاز مباشرة
- يعمل بدون إنترنت (محدود)
- إشعارات دفع على iOS وAndroid

=== الأدوار في النظام ===
- **admin**: صلاحيات كاملة على كل شيء
- **manager**: إدارة الفريق والمشاريع والعملاء
- **developer**: المشاريع والمهام التقنية
- **designer**: مهام التصميم والملفات الإبداعية
- **support**: الدعم الفني والتواصل مع العملاء
- **sales**: إدارة المبيعات والعملاء الجدد
- **sales_manager**: إدارة فريق المبيعات والتقارير
- **accountant**: المالية والفواتير والرواتب
- **merchant**: إدارة المتاجر والمنتجات
- **client**: العميل — يتابع مشاريعه وطلباته ومحفظته

=== تقنيات المنصة ===
- Backend: Node.js + Express + TypeScript
- Frontend: React + Vite + Tailwind CSS
- Database: MongoDB (Mongoose)
- Real-time: WebSocket (ws)
- Auth: Passport.js (محلي + Google OAuth)
- PWA: Service Worker + Web Push
- Video: QMeet (WebRTC مدمج)
- AI: OpenAI GPT عبر OpenRouter
- Email: SMTP مع قوالب HTML احترافية
- Payment: PayPal + تحويل بنكي + محفظة إلكترونية

${userCtx}

=== تعليمات الرد ===
1. **اللغة**: العربية دائماً مع لمسة خليجية طبيعية (هلا، يزاك الله، ما شاء الله)
2. **الإبداع**: ردودك مخصصة وإبداعية — لا ردوداً متكررة أو مملة
3. **الدقة**: معلوماتك عن النظام دقيقة 100% — لا تخمّن
4. **الاقتراحات**: عند الإجابة، أضف 2-3 اقتراحات للمتابعة في نهاية ردك بصيغة: \`[اقتراح: نص الاقتراح]\`
5. **الإجراءات**: عند الإشارة لصفحة معينة، استخدم صيغة: \`[انتقال: /url | نص الزر]\`
6. **التحليل**: عند طلب تحليل البيانات، قدّم رؤى قابلة للتطبيق
7. **الإبداع التصميمي**: عند طلب اقتراحات إبداعية، كن خلاّقاً ومبتكراً
8. **الطوارئ**: إذا لم تعرف شيئاً، اعترف بذلك بلباقة وأعطِ بديلاً مفيداً`;
}

/* ─── Parse AI response for actions and suggestions ─── */
function parseResponse(text: string): { reply: string; suggestions: string[]; action?: string; data?: any; navigateTo?: string; navigateLabel?: string } {
  const suggestions: string[] = [];
  let action: string | undefined;
  let navigateTo: string | undefined;
  let navigateLabel: string | undefined;

  let reply = text;

  // Extract suggestions [اقتراح: ...]
  const suggestionRegex = /\[اقتراح:\s*(.+?)\]/g;
  let match;
  while ((match = suggestionRegex.exec(text)) !== null) {
    suggestions.push(match[1].trim());
  }
  reply = reply.replace(/\[اقتراح:\s*.+?\]/g, "").trim();

  // Extract navigation [انتقال: /url | نص]
  const navRegex = /\[انتقال:\s*([^\|]+)\|([^\]]+)\]/g;
  const navMatch = navRegex.exec(text);
  if (navMatch) {
    navigateTo = navMatch[1].trim();
    navigateLabel = navMatch[2].trim();
    action = "NAVIGATE";
    reply = reply.replace(/\[انتقال:\s*[^\]]+\]/g, "").trim();
  }

  return { reply, suggestions, action, navigateTo, navigateLabel };
}

/* ─── Main message processor ─── */
async function processMessage(
  sessionId: string,
  message: string,
  context: {
    userId?: string;
    userRole?: string;
    userName?: string;
    currentPage?: string;
    systemData?: any;
  }
): Promise<{ reply: string; suggestions?: string[]; action?: string; data?: any }> {
  const session = getSession(sessionId, context.userId, context.userRole);
  const systemPrompt = buildSystemPrompt(context.userRole, context.userName, context.systemData);

  // Check if web search is needed
  let searchContext = "";
  const needsSearch = /ابحث|بحث عن|search|ما هو|معلومة عن/.test(message.toLowerCase());
  if (needsSearch) {
    searchContext = await searchWeb(message);
  }

  // Build messages array
  const messages: any[] = [
    { role: "system", content: systemPrompt },
  ];

  // Add conversation history (last 12 messages)
  const recentHistory = session.history.slice(-12);
  for (const h of recentHistory) {
    messages.push({ role: h.role, content: h.content });
  }

  // Add current message with optional search context
  let userMessage = message;
  if (searchContext) {
    userMessage = `${message}\n\n[نتائج بحث من الإنترنت]:\n${searchContext}`;
  }
  if (context.currentPage) {
    userMessage = `[الصفحة الحالية: ${context.currentPage}]\n${userMessage}`;
  }

  messages.push({ role: "user", content: userMessage });

  // Call OpenAI
  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages,
    max_tokens: 1000,
    temperature: 0.75,
  });

  const aiText = completion.choices[0]?.message?.content || "عذراً، لم أستطع المعالجة. حاول مرة أخرى.";

  // Save to history
  session.history.push({ role: "user", content: message });
  session.history.push({ role: "assistant", content: aiText });

  // Keep history bounded (last 30 messages)
  if (session.history.length > 30) {
    session.history = session.history.slice(-30);
  }

  // Parse response for actions and suggestions
  const parsed = parseResponse(aiText);

  const result: any = { reply: parsed.reply };
  if (parsed.suggestions.length) result.suggestions = parsed.suggestions;
  if (parsed.action) result.action = parsed.action;
  if (parsed.navigateTo) result.data = { url: parsed.navigateTo, label: parsed.navigateLabel };

  return result;
}

/* ─── Register routes ─── */
export function registerAiRoutes(app: Express) {

  // POST /api/ai/message — main chat endpoint
  app.post("/api/ai/message", async (req, res) => {
    try {
      const { sessionId, message, currentPage, systemData } = req.body;
      if (!sessionId || !message?.trim()) {
        return res.status(400).json({ error: "sessionId and message are required" });
      }

      const user = (req as any).user;
      const result = await processMessage(sessionId, message.trim(), {
        userId: user?._id?.toString() || user?.id?.toString(),
        userRole: user?.role,
        userName: user?.fullName || user?.username,
        currentPage,
        systemData,
      });

      res.json(result);
    } catch (err: any) {
      console.error("[QIROX AI] Error:", err?.message || err);
      res.json({ reply: "عذراً، حدث خطأ مؤقت في مساعد الذكاء الاصطناعي. حاول مرة أخرى." });
    }
  });

  // POST /api/ai/custom-order — save custom order from AI conversation
  app.post("/api/ai/custom-order", async (req, res) => {
    try {
      const { description, features, budget, timeline } = req.body;
      const user = (req as any).user;
      const { OrderModel } = await import("./models");

      const orderData = {
        clientId: user?._id || null,
        clientName: user?.fullName || user?.username || "زائر",
        clientEmail: user?.email || "",
        status: "pending",
        type: "custom",
        notes: `طلب مخصص عبر QIROX AI:\n\nالوصف: ${description}\nالميزات: ${features}\nالميزانية: ${budget}\nالجدول الزمني: ${timeline}`,
        totalAmount: 0,
        source: "qirox-ai",
        createdAt: new Date(),
      };

      const order = await OrderModel.create(orderData);

      sendDirectEmail(
        "info@qiroxstudio.online",
        "QIROX",
        `طلب مخصص جديد عبر QIROX AI`,
        `عميل: ${orderData.clientName}\nالبريد: ${orderData.clientEmail}\n\n${orderData.notes}`
      ).catch(console.error);

      res.json({ success: true, orderId: order._id });
    } catch (err) {
      console.error("[AI Custom Order]", err);
      res.status(500).json({ error: "فشل في إنشاء الطلب" });
    }
  });

  // POST /api/ai/analyze — business analytics insight (admin/manager)
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const user = (req as any).user;
      if (!["admin", "manager"].includes(user?.role)) {
        return res.status(403).json({ error: "غير مصرح" });
      }

      const { data, question } = req.body;
      const systemPrompt = buildSystemPrompt(user.role, user.fullName || user.username);

      const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `قم بتحليل هذه البيانات وأجب على السؤال التالي بشكل احترافي وإبداعي:\n\nالسؤال: ${question}\n\nالبيانات:\n${JSON.stringify(data, null, 2)}`,
          },
        ],
        max_tokens: 800,
        temperature: 0.6,
      });

      const analysis = completion.choices[0]?.message?.content || "تعذّر تحليل البيانات.";
      res.json({ analysis });
    } catch (err) {
      console.error("[AI Analyze]", err);
      res.status(500).json({ error: "فشل التحليل" });
    }
  });

  // POST /api/ai/generate — creative content generation
  app.post("/api/ai/generate", async (req, res) => {
    try {
      const { type, context: ctx, lang } = req.body;
      const user = (req as any).user;

      const prompts: Record<string, string> = {
        project_description: `اكتب وصفاً احترافياً وجذاباً لمشروع برمجي بناءً على هذه المعلومات:\n${ctx}`,
        email_template: `اكتب قالب بريد إلكتروني احترافي بالعربية لـ:\n${ctx}`,
        proposal: `اكتب عرض سعر احترافي ومقنع لعميل بناءً على:\n${ctx}`,
        social_post: `اكتب منشور جذاب لوسائل التواصل الاجتماعي عن:\n${ctx}`,
        report_summary: `لخّص هذه البيانات في تقرير موجز ومفيد:\n${ctx}`,
      };

      const prompt = prompts[type] || `اكتب محتوى إبداعياً عن: ${ctx}`;

      const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content: `أنت كاتب محتوى إبداعي ومحترف لشركة QIROX Studio. ${lang === "en" ? "Respond in English." : "أجب بالعربية."}`,
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 600,
        temperature: 0.8,
      });

      const content = completion.choices[0]?.message?.content || "";
      res.json({ content });
    } catch (err) {
      console.error("[AI Generate]", err);
      res.status(500).json({ error: "فشل إنشاء المحتوى" });
    }
  });

  // DELETE /api/ai/session/:sessionId — reset conversation
  app.delete("/api/ai/session/:sessionId", (req, res) => {
    sessions.delete(req.params.sessionId);
    res.json({ ok: true });
  });
}
