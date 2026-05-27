// @ts-nocheck
/**
 * QIROX AI — Agentic Intelligence
 * Powered by Kimi (Moonshot AI) — kimi-k2-0905-preview
 */
import type { Express } from "express";
import OpenAI from "openai";
import { sendDirectEmail } from "./email";
import axios from "axios";

/* ─── AI Provider — Kimi (Moonshot AI) ─── */
const _kimiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: "https://api.moonshot.ai/v1",
});

const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (_kimiClient as any)[prop];
  },
});

const AI_MODEL = "kimi-k2-0905-preview";

console.log(`[AI] Provider: Kimi k2 (Moonshot AI)`);;

/* ─── Serper.dev web search ─── */
const SERPER_KEY = process.env.SERPER_API_KEY || "1e7d5649e4f81662619b41ffe249c5bea3341eef";
async function searchWeb(query: string): Promise<string> {
  try {
    const res = await axios.post(
      "https://google.serper.dev/search",
      { q: query, hl: "ar", gl: "sa", num: 3 },
      { headers: { "X-API-KEY": SERPER_KEY, "Content-Type": "application/json" }, timeout: 8000 }
    );
    const results = res.data?.organic?.slice(0, 3) || [];
    return results.map((r: any, i: number) => `${i + 1}. ${r.title}: ${r.snippet}`).join("\n");
  } catch { return ""; }
}

/* ─── Session store ─── */
interface Message { role: "user" | "assistant" | "tool"; content: string; tool_call_id?: string; name?: string }
interface Session {
  history: Message[];
  userId?: string;
  userRole?: string;
  userName?: string;
  lastReportedAt?: number;   // timestamp of last admin notification
  toolCallCount?: number;    // total tool calls in session
  startedAt?: number;        // session start time
}
const sessions = new Map<string, Session>();

function getSession(id: string, userId?: string, role?: string, name?: string): Session {
  if (!sessions.has(id)) sessions.set(id, { history: [], userId, userRole: role, userName: name, startedAt: Date.now(), toolCallCount: 0 });
  const s = sessions.get(id)!;
  if (userId) s.userId = userId;
  if (role) s.userRole = role;
  if (name) s.userName = name;
  return s;
}

/* ─── Admin AI Digest: notify admins about important AI sessions ─── */
const ADMIN_REPORT_COOLDOWN = 10 * 60 * 1000; // 10 minutes per session
const NON_REPORT_ROLES = ["admin", "manager", "guest"];

async function notifyAdminsOfAIActivity(
  session: Session,
  userMessage: string,
  aiReply: string,
  toolNames: string[]
): Promise<void> {
  try {
    const now = Date.now();
    if (session.lastReportedAt && now - session.lastReportedAt < ADMIN_REPORT_COOLDOWN) return;
    if (NON_REPORT_ROLES.includes(session.userRole || "guest")) return;
    session.lastReportedAt = now;

    // Build a one-line summary via GPT
    const recentCtx = session.history.slice(-6).map(m =>
      `${m.role === "user" ? "👤 المستخدم" : "🤖 AI"}: ${String(m.content).slice(0, 200)}`
    ).join("\n");

    const summaryResp = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{
        role: "user",
        content: `ملخّص قصير جداً (جملة واحدة بالعربية، بدون مقدمات) لهذه المحادثة مع ${session.userName || "مستخدم"} (${session.userRole}):\n${recentCtx}\n\nاكتب فقط الملخص بدون أي شرح.`,
      }],
      temperature: 0.3,
      max_tokens: 120,
    });

    const summary = summaryResp.choices[0]?.message?.content?.trim() || `يتحدث ${session.userName || "مستخدم"} مع QIROX AI`;

    const { UserModel, NotificationModel } = await import("./models");
    const { pushToUser } = await import("./ws");

    const admins = await UserModel.find({ role: { $in: ["admin", "manager"] } }).select("_id");

    const roleLabel: Record<string, string> = {
      client: "عميل", developer: "مطور", designer: "مصمم", support: "دعم",
      sales: "مبيعات", sales_manager: "مدير مبيعات", accountant: "محاسب", merchant: "تاجر",
    };
    const roleName = roleLabel[session.userRole || ""] || session.userRole || "مستخدم";
    const toolLabel = toolNames.length > 0
      ? `• الأدوات: ${toolNames.join("، ")}`
      : "";

    const notifBody = `${summary}${toolLabel ? "\n" + toolLabel : ""}`;

    for (const admin of admins) {
      await NotificationModel.create({
        userId: String(admin._id),
        type: "ai_digest",
        title: `💬 ${session.userName || roleName} مع QIROX AI`,
        body: notifBody,
        link: "/admin/ai-sessions",
        icon: "🤖",
        read: false,
      });
      pushToUser(String(admin._id), {
        type: "notification",
        title: `💬 ${session.userName || roleName} مع QIROX AI`,
        body: summary,
      });
    }
  } catch (err) {
    // Non-critical — don't throw
    console.warn("[AI Digest] Failed to notify admins:", (err as any)?.message);
  }
}

/* ─── QIROX Tools (function calling) ─── */
const QIROX_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_orders",
      description: "جلب قائمة الطلبات من النظام مع تصفية حسب الحالة والعدد. للمدراء يجلب جميع الطلبات، للموظفين يجلب المرتبطة بهم، للعملاء طلباتهم فقط.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["pending", "active", "completed", "cancelled", "all"], description: "تصفية حسب حالة الطلب" },
          limit: { type: "number", description: "عدد النتائج (افتراضي 10، أقصى 20)" },
          search: { type: "string", description: "بحث في اسم العميل أو رقم الطلب" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_clients",
      description: "جلب قائمة العملاء من النظام. متاح للمدراء ومسؤولي المبيعات فقط.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string", description: "بحث بالاسم أو البريد أو رقم الهاتف" },
          limit: { type: "number", description: "عدد النتائج (افتراضي 8)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_analytics",
      description: "جلب إحصاءات وتحليلات المنصة الشاملة. للمدراء فقط.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_employees",
      description: "جلب قائمة الموظفين وبياناتهم. للمدراء فقط.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string", description: "بحث بالاسم أو الدور" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_wallet_info",
      description: "جلب معلومات المحفظة والرصيد والمعاملات. للعملاء فقط.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_projects",
      description: "جلب قائمة المشاريع النشطة مع تفاصيلها.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "عدد النتائج" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_order_status",
      description: "تغيير حالة طلب معين. للمدراء والموظفين المخوّلين فقط.",
      parameters: {
        type: "object",
        required: ["orderId", "status"],
        properties: {
          orderId: { type: "string", description: "معرّف الطلب (ID)" },
          status: { type: "string", enum: ["pending", "active", "completed", "cancelled", "on_hold"], description: "الحالة الجديدة" },
          note: { type: "string", description: "ملاحظة تُضاف عند تغيير الحالة" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_notification",
      description: "إرسال إشعار فوري لمستخدم معين أو لجميع المستخدمين. للمدراء فقط.",
      parameters: {
        type: "object",
        required: ["title", "body"],
        properties: {
          userId: { type: "string", description: "معرّف المستخدم لإرسال إشعار شخصي. إذا فارغ يُرسل للجميع." },
          title: { type: "string", description: "عنوان الإشعار" },
          body: { type: "string", description: "نص الإشعار" },
          role: { type: "string", description: "إرسال لجميع أصحاب دور معين (مثال: client)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_my_order",
      description: "إلغاء طلب خاص بالعميل الحالي (فقط الطلبات المعلّقة يمكن إلغاؤها).",
      parameters: {
        type: "object",
        required: ["orderId"],
        properties: {
          orderId: { type: "string", description: "معرّف الطلب المراد إلغاؤه" },
          reason: { type: "string", description: "سبب الإلغاء" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "إنشاء مهمة جديدة في مشروع معين. للمدراء والموظفين.",
      parameters: {
        type: "object",
        required: ["projectId", "title"],
        properties: {
          projectId: { type: "string", description: "معرّف المشروع" },
          title: { type: "string", description: "عنوان المهمة" },
          description: { type: "string", description: "وصف المهمة" },
          priority: { type: "string", enum: ["low", "medium", "high"], description: "أولوية المهمة" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_support_ticket",
      description: "إرسال تذكرة دعم أو رسالة تواصل من العميل لفريق الدعم.",
      parameters: {
        type: "object",
        required: ["subject", "message"],
        properties: {
          subject: { type: "string", description: "موضوع الرسالة" },
          message: { type: "string", description: "نص الرسالة الكاملة" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_web",
      description: "البحث في الإنترنت عن معلومات حديثة أو غير متوفرة في قاعدة البيانات.",
      parameters: {
        type: "object",
        required: ["query"],
        properties: {
          query: { type: "string", description: "استعلام البحث" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_email",
      description: "إرسال بريد إلكتروني فعلي عبر صندوق QIROX الرسمي إلى أي عنوان. للموظفين/الإدارة فقط. استخدمها عندما يطلب المستخدم 'أرسل إيميل/بريد' لشخص أو لنفسه. صياغة المحتوى تلقائياً بناءً على السياق إن لم يحدّد المستخدم.",
      parameters: {
        type: "object",
        required: ["to", "subject", "body"],
        properties: {
          to: { type: "string", description: "البريد الإلكتروني للمستلم (مثال: name@example.com). يمكن إرسال لعدة عناوين بالفصل بفواصل." },
          subject: { type: "string", description: "موضوع الرسالة" },
          body: { type: "string", description: "نص الرسالة الكامل (نص عادي أو HTML بسيط)" },
          toName: { type: "string", description: "اسم المستلم (اختياري، يُستخدم في التحية)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "submit_consultation_request",
      description: "إرسال طلب استشارة أو تواصل باسم زائر أو عميل. يجمع الذكاء الاصطناعي الاسم ورقم الهاتف والموضوع من المحادثة ثم يُرسل الطلب للفريق. يعمل بدون تسجيل دخول. استخدم هذه الأداة عندما يطلب الزائر التواصل أو الاستشارة أو المتابعة.",
      parameters: {
        type: "object",
        required: ["clientName", "clientPhone", "topic"],
        properties: {
          clientName: { type: "string", description: "اسم العميل أو الزائر الكامل" },
          clientPhone: { type: "string", description: "رقم هاتف العميل (مع رمز الدولة إن أمكن)" },
          topic: { type: "string", description: "موضوع الاستشارة أو الطلب (مثال: تطوير متجر إلكتروني، استفسار عن الأسعار، إلخ)" },
          clientEmail: { type: "string", description: "البريد الإلكتروني (اختياري)" },
          message: { type: "string", description: "تفاصيل إضافية أو ملاحظات" },
          consultationType: { type: "string", enum: ["phone", "video", "any"], description: "نوع التواصل المفضّل (افتراضي: phone)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_quotation",
      description: "إنشاء عرض سعر فعلي ورسمي في النظام برقم تسلسلي ورابط طباعة. للموظفين والإدارة. استخدمها عندما يطلب المستخدم 'اعمل/أنشئ/سوّي عرض سعر' لعميل. تدعم عميل مسجّل (userId) أو عميل خارجي (externalName/externalEmail/externalCompany). تحسب الضريبة تلقائياً.",
      parameters: {
        type: "object",
        required: ["items"],
        properties: {
          userId: { type: "string", description: "معرّف العميل المسجّل في النظام (إن وُجد)" },
          externalName: { type: "string", description: "اسم العميل إن لم يكن مسجّلاً" },
          externalEmail: { type: "string", description: "بريد العميل الخارجي" },
          externalCompany: { type: "string", description: "اسم شركة العميل" },
          title: { type: "string", description: "عنوان عرض السعر" },
          items: {
            type: "array",
            description: "بنود عرض السعر",
            items: {
              type: "object",
              required: ["name", "qty", "unitPrice"],
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                qty: { type: "number" },
                unitPrice: { type: "number" },
              },
            },
          },
          vatRate: { type: "number", description: "نسبة الضريبة المئوية (افتراضي 15)" },
          validUntil: { type: "string", description: "تاريخ انتهاء صلاحية العرض ISO (اختياري)" },
          notes: { type: "string", description: "ملاحظات للعميل" },
          termsAndConditions: { type: "string", description: "شروط وأحكام العرض" },
          status: { type: "string", enum: ["draft", "sent"], description: "الحالة (افتراضي draft)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_invoice",
      description: "إنشاء فاتورة فعلية في النظام برقم تسلسلي. للموظفين والإدارة. استخدمها عندما يطلب المستخدم 'اعمل/أنشئ/أصدر فاتورة' لعميل. تربط الفاتورة بطلب موجود اختياريًا.",
      parameters: {
        type: "object",
        required: ["userId", "amount"],
        properties: {
          userId: { type: "string", description: "معرّف العميل" },
          orderId: { type: "string", description: "معرّف الطلب المرتبط (اختياري)" },
          amount: { type: "number", description: "المبلغ قبل الضريبة" },
          vatRate: { type: "number", description: "نسبة الضريبة المئوية (افتراضي 15، 0 = بدون ضريبة)" },
          dueDate: { type: "string", description: "تاريخ الاستحقاق ISO" },
          notes: { type: "string", description: "ملاحظات على الفاتورة" },
          items: {
            type: "array",
            description: "بنود الفاتورة (اختياري)",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                qty: { type: "number" },
                unitPrice: { type: "number" },
                total: { type: "number" },
              },
            },
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_order",
      description: "إنشاء طلب جديد في النظام نيابةً عن عميل (للموظفين والإدارة فقط). يفيد عند تسجيل طلب وارد عبر الهاتف أو واتساب. يُولّد رقم طلب تسلسلي.",
      parameters: {
        type: "object",
        required: ["userId"],
        properties: {
          userId: { type: "string", description: "معرّف العميل صاحب الطلب" },
          serviceType: { type: "string", description: "نوع الخدمة (مثال: website, app, ecommerce)" },
          planTier: { type: "string", enum: ["lite", "pro", "infinite", "lifetime"], description: "مستوى الباقة" },
          planPeriod: { type: "string", enum: ["monthly", "sixmonth", "annual", "lifetime"], description: "فترة الاشتراك" },
          businessName: { type: "string", description: "اسم نشاط العميل" },
          phone: { type: "string", description: "رقم الجوال" },
          totalAmount: { type: ["number", "string"], description: "المبلغ الإجمالي بالريال (رقم)" },
          notes: { type: "string", description: "ملاحظات للطلب" },
          projectType: { type: "string", description: "نوع المشروع" },
          sector: { type: "string", description: "القطاع" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "navigate_to",
      description: "ينقل المستخدم فوراً إلى صفحة داخل المنصة. استخدم هذه الأداة عندما يطلب المستخدم 'افتح/خذني/وديني/روح إلى/أبي أوصل لـ' لأي قسم أو شاشة. متاحة لجميع الأدوار. استخدم المسارات الداخلية فقط (تبدأ بـ /).",
      parameters: {
        type: "object",
        required: ["path"],
        properties: {
          path: { type: "string", description: "المسار الكامل داخل التطبيق (مثال: /admin/orders, /employee/profile, /prices, /systems/restaurant). يجب أن يبدأ بـ /." },
          label: { type: "string", description: "اسم وصفي للزر الذي سيراه المستخدم (مثال: 'افتح الطلبات')" },
          autoOpen: { type: "boolean", description: "إذا true يفتح الصفحة فوراً تلقائياً، إذا false يعرض زر للمستخدم. الافتراضي true." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_page_preview",
      description: "يعرض معاينة مرئية حية (iframe) لصفحة داخل المنصة داخل المحادثة، حتى يرى المستخدم محتوى الصفحة دون مغادرة الشات. استخدمها عندما يقول المستخدم 'وريني/أرني/اعرض لي صورة من/كيف تبدو صفحة...'. متاحة لجميع الأدوار.",
      parameters: {
        type: "object",
        required: ["path"],
        properties: {
          path: { type: "string", description: "المسار الداخلي للصفحة (مثال: /prices, /admin/dashboard)" },
          title: { type: "string", description: "عنوان المعاينة الذي يُعرض فوقها" },
          height: { type: "number", description: "ارتفاع الإطار بالبكسل (افتراضي 360، أقصى 600)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_navigable_pages",
      description: "يُرجع قائمة بأهم الصفحات والشاشات المتاحة في المنصة لمساعدة الذكاء الاصطناعي على معرفة أين يوجّه المستخدم. استخدمها عندما تشك في المسار الصحيح أو يريد المستخدم استعراض ما هو متاح.",
      parameters: {
        type: "object",
        properties: {
          area: { type: "string", enum: ["admin", "employee", "client", "public", "all"], description: "تصفية حسب المنطقة (افتراضي all)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_qr_code",
      description: "توليد رمز QR من أي رابط أو نص. يُرجع صورة QR جاهزة للعرض أو الطباعة أو المشاركة. يُفيد لمشاركة فواتير، عروض أسعار، روابط دفع، روابط تحقق، أو أي رابط آخر.",
      parameters: {
        type: "object",
        required: ["data"],
        properties: {
          data: { type: "string", description: "النص أو الرابط المراد تحويله إلى QR" },
          size: { type: "number", description: "حجم الصورة بالبكسل (افتراضي 300، الحد الأقصى 800)" },
          label: { type: "string", description: "وصف يُعرض مع الصورة (مثال: 'رمز QR للفاتورة INV-123')" },
        },
      },
    },
  },
];

/* ─── Tool Executor ─── */
async function executeTool(name: string, args: any, userId?: string, userRole?: string): Promise<{ success: boolean; data?: any; error?: string; display?: any }> {
  try {
    const {
      OrderModel, UserModel, ProjectModel, TaskModel,
      NotificationModel, SupportTicketModel,
    } = await import("./models");

    const isAdmin = ["admin", "manager"].includes(userRole || "");
    const isEmployee = ["developer", "designer", "support", "sales", "sales_manager", "accountant", "merchant"].includes(userRole || "");
    const isClient = userRole === "client";

    /* ── READ: get_orders ── */
    if (name === "get_orders") {
      // ⚠️ SECURITY: only authenticated users can see orders
      if (!userId) return { success: false, error: "يجب تسجيل الدخول لعرض الطلبات" };
      // ⚠️ SECURITY: clients can only see their own orders
      if (isClient && !userId) return { success: false, error: "يجب تسجيل الدخول لعرض طلباتك" };
      const limit = Math.min(args.limit || 10, 20);
      const query: any = {};
      if (args.status && args.status !== "all") query.status = args.status;
      if (isClient) query.userId = userId; // always filter for clients
      if (args.search) query.$or = [
        { "service.nameAr": { $regex: args.search, $options: "i" } },
        { notes: { $regex: args.search, $options: "i" } },
      ];
      const orders = await OrderModel.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("userId", "fullName username phone")
        .lean();
      return {
        success: true,
        data: { count: orders.length, orders: orders.map(o => ({
          id: String(o._id),
          status: o.status,
          service: o.service?.nameAr || o.service?.name || "خدمة",
          client: (o.userId as any)?.fullName || (o.userId as any)?.username || "عميل",
          amount: o.totalPrice || o.paymentAmount || 0,
          createdAt: o.createdAt,
          notes: o.notes,
        }))},
        display: { type: "orders_table" },
      };
    }

    /* ── READ: get_clients ── */
    if (name === "get_clients") {
      if (!isAdmin && !["sales_manager", "sales"].includes(userRole || "")) {
        return { success: false, error: "غير مخوّل بعرض قائمة العملاء" };
      }
      const limit = Math.min(args.limit || 8, 20);
      const query: any = { role: "client" };
      if (args.search) query.$or = [
        { fullName: { $regex: args.search, $options: "i" } },
        { username: { $regex: args.search, $options: "i" } },
        { email: { $regex: args.search, $options: "i" } },
        { phone: { $regex: args.search, $options: "i" } },
      ];
      const clients = await UserModel.find(query).sort({ createdAt: -1 }).limit(limit).select("fullName username email phone createdAt walletBalance").lean();
      return {
        success: true,
        data: { count: clients.length, clients: clients.map(c => ({
          id: String(c._id),
          name: c.fullName || c.username,
          email: c.email,
          phone: c.phone,
          wallet: c.walletBalance || 0,
          joined: c.createdAt,
        }))},
        display: { type: "clients_table" },
      };
    }

    /* ── READ: get_analytics ── */
    if (name === "get_analytics") {
      if (!isAdmin) return { success: false, error: "متاح للمدراء فقط" };
      const [totalClients, totalOrders, pendingOrders, activeOrders, completedOrders, totalProjects] = await Promise.all([
        UserModel.countDocuments({ role: "client" }),
        OrderModel.countDocuments({}),
        OrderModel.countDocuments({ status: "pending" }),
        OrderModel.countDocuments({ status: "active" }),
        OrderModel.countDocuments({ status: "completed" }),
        ProjectModel.countDocuments({}),
      ]);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const [monthRevOrders, newClients] = await Promise.all([
        OrderModel.find({ createdAt: { $gte: monthStart }, status: { $in: ["active", "completed"] } }).select("totalPrice paymentAmount").lean(),
        UserModel.countDocuments({ role: "client", createdAt: { $gte: weekStart } }),
      ]);
      const monthRevenue = monthRevOrders.reduce((s, o) => s + (o.totalPrice || o.paymentAmount || 0), 0);
      return {
        success: true,
        data: { totalClients, totalOrders, pendingOrders, activeOrders, completedOrders, totalProjects, monthRevenue, newClients },
        display: { type: "analytics_card" },
      };
    }

    /* ── READ: get_employees ── */
    if (name === "get_employees") {
      if (!isAdmin) return { success: false, error: "متاح للمدراء فقط" };
      const query: any = { role: { $ne: "client" }, isActive: { $ne: false } };
      if (args.search) query.$or = [
        { fullName: { $regex: args.search, $options: "i" } },
        { role: { $regex: args.search, $options: "i" } },
      ];
      const employees = await UserModel.find(query).select("fullName username role phone email createdAt").lean();
      return {
        success: true,
        data: { count: employees.length, employees: employees.map(e => ({
          id: String(e._id), name: e.fullName || e.username, role: e.role, phone: e.phone,
        }))},
        display: { type: "employees_table" },
      };
    }

    /* ── READ: get_wallet_info ── */
    if (name === "get_wallet_info") {
      if (!userId) return { success: false, error: "يجب تسجيل الدخول" };
      const user = await UserModel.findById(userId).select("walletBalance fullName").lean();
      const recentOrders = await OrderModel.find({ userId })
        .sort({ createdAt: -1 }).limit(5)
        .select("totalPrice paymentAmount status createdAt service")
        .lean();
      return {
        success: true,
        data: {
          balance: user?.walletBalance || 0,
          name: user?.fullName,
          recent: recentOrders.map(o => ({
            amount: o.totalPrice || o.paymentAmount || 0,
            status: o.status,
            service: o.service?.nameAr || "خدمة",
            date: o.createdAt,
          })),
        },
        display: { type: "wallet_card" },
      };
    }

    /* ── READ: get_projects ── */
    if (name === "get_projects") {
      // ⚠️ SECURITY: only authenticated users can see projects
      if (!userId) return { success: false, error: "يجب تسجيل الدخول لعرض المشاريع" };
      // ⚠️ SECURITY: clients can only see their own projects
      if (isClient && !userId) return { success: false, error: "يجب تسجيل الدخول لعرض مشاريعك" };
      const limit = args.limit || 8;
      const query: any = {};
      if (isClient) {
        const clientOrders = await OrderModel.find({ userId }).select("_id").lean();
        const orderIds = clientOrders.map(o => o._id);
        query.orderId = { $in: orderIds };
      }
      const projects = await ProjectModel.find(query).sort({ createdAt: -1 }).limit(limit)
        .populate("orderId", "userId service")
        .lean();
      return {
        success: true,
        data: { count: projects.length, projects: projects.map(p => ({
          id: String(p._id), name: p.name, status: p.status || "active",
          progress: p.progress || 0, description: p.description,
        }))},
        display: { type: "projects_table" },
      };
    }

    /* ── WRITE: update_order_status ── */
    if (name === "update_order_status") {
      if (!isAdmin && !isEmployee) return { success: false, error: "غير مخوّل بتغيير حالة الطلبات" };
      const order = await OrderModel.findById(args.orderId);
      if (!order) return { success: false, error: "الطلب غير موجود" };
      const prevStatus = order.status;
      order.status = args.status;
      if (args.note) order.notes = (order.notes || "") + `\n[AI ${new Date().toLocaleDateString("ar")}]: ${args.note}`;
      await order.save();
      // notify client
      try {
        const { pushToUser } = await import("./ws");
        const clientId = String(order.userId);
        await NotificationModel.create({ userId: clientId, title: "تحديث على طلبك", body: `تم تغيير حالة طلبك من "${prevStatus}" إلى "${args.status}"`, read: false });
        pushToUser(clientId, { type: "notification", title: "تحديث على طلبك", body: `حالة طلبك الجديدة: ${args.status}` });
      } catch {}
      return { success: true, data: { orderId: args.orderId, prevStatus, newStatus: args.status }, display: { type: "action_success" } };
    }

    /* ── WRITE: send_notification ── */
    if (name === "send_notification") {
      if (!isAdmin) return { success: false, error: "إرسال الإشعارات للمدراء فقط" };
      const { pushToUser, broadcastToAll } = await import("./ws");
      if (args.userId) {
        await NotificationModel.create({ userId: args.userId, title: args.title, body: args.body, read: false });
        pushToUser(args.userId, { type: "notification", title: args.title, body: args.body });
        return { success: true, data: { sent: 1, target: "user" }, display: { type: "action_success" } };
      } else if (args.role) {
        const targets = await UserModel.find({ role: args.role, isActive: { $ne: false } }).select("_id").lean();
        for (const t of targets) {
          const id = String(t._id);
          await NotificationModel.create({ userId: id, title: args.title, body: args.body, read: false });
          pushToUser(id, { type: "notification", title: args.title, body: args.body });
        }
        return { success: true, data: { sent: targets.length, target: args.role }, display: { type: "action_success" } };
      } else {
        broadcastToAll({ type: "notification", title: args.title, body: args.body });
        const allUsers = await UserModel.find({ isActive: { $ne: false } }).select("_id").lean();
        await NotificationModel.insertMany(allUsers.map(u => ({ userId: String(u._id), title: args.title, body: args.body, read: false })));
        return { success: true, data: { sent: allUsers.length, target: "all" }, display: { type: "action_success" } };
      }
    }

    /* ── WRITE: cancel_my_order ── */
    if (name === "cancel_my_order") {
      if (!userId) return { success: false, error: "يجب تسجيل الدخول" };
      const order = await OrderModel.findOne({ _id: args.orderId, userId });
      if (!order) return { success: false, error: "الطلب غير موجود أو لا ينتمي لحسابك" };
      if (order.status !== "pending") return { success: false, error: `لا يمكن إلغاء طلب بحالة "${order.status}" — الإلغاء متاح للطلبات المعلّقة فقط` };
      order.status = "cancelled";
      if (args.reason) order.notes = (order.notes || "") + `\n[إلغاء العميل]: ${args.reason}`;
      await order.save();
      return { success: true, data: { orderId: args.orderId, status: "cancelled" }, display: { type: "action_success" } };
    }

    /* ── WRITE: create_task ── */
    if (name === "create_task") {
      if (!isAdmin && !isEmployee) return { success: false, error: "غير مخوّل بإنشاء مهام" };
      const project = await ProjectModel.findById(args.projectId);
      if (!project) return { success: false, error: "المشروع غير موجود" };
      const task = await TaskModel.create({
        projectId: args.projectId,
        title: args.title,
        description: args.description || "",
        priority: args.priority || "medium",
        status: "todo",
        createdAt: new Date(),
      });
      return { success: true, data: { taskId: String(task._id), title: task.title, project: project.name }, display: { type: "action_success" } };
    }

    /* ── WRITE: send_support_ticket ── */
    if (name === "send_support_ticket") {
      if (!userId) return { success: false, error: "يجب تسجيل الدخول لإرسال رسالة دعم" };
      const user = await UserModel.findById(userId).select("fullName email username").lean();
      const ticket = await SupportTicketModel.create({
        userId,
        subject: args.subject,
        message: args.message,
        status: "open",
        createdAt: new Date(),
      });
      try {
        await sendDirectEmail("info@qiroxstudio.online", "QIROX Support", `تذكرة دعم جديدة: ${args.subject}`, `من: ${user?.fullName || user?.username}\n\n${args.message}`);
        const { pushToUser } = await import("./ws");
        const admins = await UserModel.find({ role: { $in: ["admin", "manager"] } }).select("_id").lean();
        for (const a of admins) pushToUser(String(a._id), { type: "notification", title: "تذكرة دعم جديدة", body: args.subject });
      } catch {}
      return { success: true, data: { ticketId: String(ticket._id), subject: args.subject }, display: { type: "action_success" } };
    }

    /* ── WRITE: send_email (real email via QIROX SMTP) ── */
    if (name === "send_email") {
      if (!isAdmin && !isEmployee) {
        return { success: false, error: "إرسال البريد الإلكتروني متاح للموظفين والإدارة فقط" };
      }
      const rawTo = String(args.to || "").trim();
      if (!rawTo) return { success: false, error: "يجب تحديد عنوان المستلم" };
      const recipients = rawTo.split(/[,;\s]+/).map((s: string) => s.trim()).filter(Boolean);
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalid = recipients.filter((r: string) => !emailRe.test(r));
      if (invalid.length) return { success: false, error: `عنوان البريد غير صحيح: ${invalid.join(", ")}` };
      const subject = String(args.subject || "").trim() || "رسالة من QIROX Studio";
      const body = String(args.body || "").trim();
      if (!body) return { success: false, error: "نص الرسالة فارغ" };
      const toName = String(args.toName || "").trim();

      const results: Array<{ to: string; ok: boolean; error?: string }> = [];
      for (const r of recipients) {
        try {
          const ok = await sendDirectEmail(r, toName || r.split("@")[0], subject, body);
          results.push({ to: r, ok });
        } catch (e: any) {
          results.push({ to: r, ok: false, error: e?.message || "send failed" });
        }
      }
      const sent = results.filter(r => r.ok).length;
      const failed = results.filter(r => !r.ok);
      if (sent === 0) {
        return { success: false, error: `فشل الإرسال إلى جميع المستلمين${failed[0]?.error ? `: ${failed[0].error}` : ""}` };
      }
      return {
        success: true,
        data: { sent, failed: failed.length, recipients, subject },
        display: { type: "action_success" },
      };
    }

    /* ── create_quotation ── */
    if (name === "create_quotation") {
      if (!isAdmin && !isEmployee) {
        return { success: false, error: "إنشاء عروض الأسعار متاح للموظفين والإدارة فقط" };
      }
      const items = Array.isArray(args.items) ? args.items : [];
      if (!items.length) return { success: false, error: "يجب إضافة بند واحد على الأقل" };
      const targetUserId = args.userId?.trim() || null;
      const externalEmail = String(args.externalEmail || "").trim();
      if (!targetUserId && !externalEmail) {
        return { success: false, error: "يجب تحديد عميل مسجّل (userId) أو بريد عميل خارجي (externalEmail)" };
      }
      const { QuotationModel } = await import("./models");
      const itemList = items.map((i: any) => {
        const qty = Number(i.qty) || 1;
        const unitPrice = Number(i.unitPrice) || 0;
        const total = Math.round(qty * unitPrice * 100) / 100;
        return { name: String(i.name || ""), description: String(i.description || ""), qty, unitPrice, total };
      });
      const amount = itemList.reduce((s: number, i: any) => s + i.total, 0);
      const vatRate = args.vatRate !== undefined ? Number(args.vatRate) : 15;
      const vatAmount = Math.round(amount * (vatRate / 100) * 100) / 100;
      const totalAmount = Math.round((amount + vatAmount) * 100) / 100;
      const year = new Date().getFullYear();
      const prefix = `QT-${year}-`;
      const count = await QuotationModel.countDocuments({ quotationNumber: new RegExp(`^${prefix}`) });
      let seq = count + 1;
      let quotationNumber = `${prefix}${String(seq).padStart(4, "0")}`;
      while (await QuotationModel.exists({ quotationNumber })) {
        seq++;
        quotationNumber = `${prefix}${String(seq).padStart(4, "0")}`;
      }
      const quotation: any = await QuotationModel.create({
        quotationNumber,
        userId: targetUserId,
        externalName: String(args.externalName || ""),
        externalEmail,
        externalCompany: String(args.externalCompany || ""),
        title: String(args.title || ""),
        items: itemList,
        amount, vatRate, vatAmount, totalAmount,
        validUntil: args.validUntil ? new Date(args.validUntil) : null,
        notes: String(args.notes || ""),
        termsAndConditions: String(args.termsAndConditions || ""),
        status: args.status === "sent" ? "sent" : "draft",
        createdBy: userId || null,
      });
      const id = String(quotation._id);
      return {
        success: true,
        data: {
          id,
          quotationNumber,
          totalAmount,
          itemsCount: itemList.length,
          printUrl: `/quotation-print/${id}`,
          viewUrl: `/admin/quotations/${id}`,
        },
        display: { type: "action_success" },
      };
    }

    /* ── create_invoice ── */
    if (name === "create_invoice") {
      if (!isAdmin && !isEmployee) {
        return { success: false, error: "إنشاء الفواتير متاح للموظفين والإدارة فقط" };
      }
      const targetUserId = String(args.userId || "").trim();
      if (!targetUserId) return { success: false, error: "userId مطلوب" };
      const amount = Number(args.amount) || 0;
      if (amount <= 0) return { success: false, error: "المبلغ يجب أن يكون أكبر من صفر" };
      const { InvoiceModel, NotificationModel } = await import("./models");
      const vatRate = args.vatRate !== undefined ? Number(args.vatRate) : 15;
      const vatAmount = Math.round(amount * (vatRate / 100) * 100) / 100;
      const totalAmount = Math.round((amount + vatAmount) * 100) / 100;
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
      const items = Array.isArray(args.items) ? args.items.map((i: any) => ({
        name: String(i.name || ""), qty: Number(i.qty) || 1,
        unitPrice: Number(i.unitPrice) || 0,
        total: Number(i.total) || (Number(i.qty) || 1) * (Number(i.unitPrice) || 0),
      })) : [];
      const invoice: any = await InvoiceModel.create({
        invoiceNumber,
        userId: targetUserId,
        orderId: args.orderId || undefined,
        amount, vatAmount, totalAmount,
        status: "unpaid",
        dueDate: args.dueDate ? new Date(args.dueDate) : null,
        notes: String(args.notes || ""),
        items,
      });
      try {
        await NotificationModel.create({
          userId: targetUserId, type: "payment",
          title: `فاتورة جديدة — ${invoiceNumber}`,
          body: `صدرت فاتورة بقيمة ${totalAmount.toLocaleString("ar-SA")} ريال`,
          link: `/client/invoice-print/${invoice._id}`, icon: "🧾",
        });
      } catch {}
      return {
        success: true,
        data: {
          id: String(invoice._id),
          invoiceNumber,
          amount, vatAmount, totalAmount,
          printUrl: `/client/invoice-print/${invoice._id}`,
        },
        display: { type: "action_success" },
      };
    }

    /* ── create_order ── */
    if (name === "create_order") {
      if (!isAdmin && !isEmployee) {
        return { success: false, error: "إنشاء الطلبات نيابة عن العملاء متاح للموظفين والإدارة فقط" };
      }
      const targetUserId = String(args.userId || "").trim();
      if (!targetUserId) return { success: false, error: "userId مطلوب" };
      const exists = await UserModel.exists({ _id: targetUserId });
      if (!exists) return { success: false, error: "العميل غير موجود" };
      const count = await OrderModel.countDocuments({ orderNumber: { $exists: true, $ne: null } });
      let seq = count + 1;
      const buildNum = (n: number) => {
        if (n <= 999) return String(n).padStart(3, "0");
        const li = Math.floor((n - 1000) / 999);
        const rem = ((n - 1000) % 999) + 1;
        return `${String(rem).padStart(3, "0")}${String.fromCharCode(65 + Math.min(li, 25))}`;
      };
      let orderNumber = buildNum(seq);
      while (await OrderModel.exists({ orderNumber })) {
        seq++;
        orderNumber = buildNum(seq);
      }
      const order: any = await OrderModel.create({
        orderNumber,
        userId: targetUserId,
        status: "pending",
        serviceType: args.serviceType || undefined,
        planTier: args.planTier || undefined,
        planPeriod: args.planPeriod || undefined,
        businessName: args.businessName || undefined,
        phone: args.phone || undefined,
        notes: args.notes || `طلب مُنشأ عبر مساعد QIROX الذكي بواسطة ${userId || "موظف"}`,
        totalAmount: args.totalAmount !== undefined ? Number(args.totalAmount) : undefined,
        projectType: args.projectType || undefined,
        sector: args.sector || undefined,
        paymentStatus: "pending",
      });
      return {
        success: true,
        data: {
          id: String(order._id),
          orderNumber,
          status: "pending",
          viewUrl: `/admin/orders/${order._id}`,
        },
        display: { type: "action_success" },
      };
    }

    /* ── generate_qr_code ── */
    if (name === "generate_qr_code") {
      const data = String(args.data || "").trim();
      if (!data) return { success: false, error: "النص أو الرابط مطلوب" };
      const size = Math.min(800, Math.max(100, Number(args.size) || 300));
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
      return {
        success: true,
        data: {
          imageUrl: url,
          markdownEmbed: `![${args.label || "QR"}](${url})`,
          source: data,
          size,
          label: args.label || "",
        },
        display: { type: "qr_code" },
      };
    }

    /* ── navigate_to ── */
    if (name === "navigate_to") {
      let path = String(args.path || "").trim();
      if (!path.startsWith("/")) path = "/" + path;
      // Strip protocol/host if accidentally included
      try {
        if (/^https?:\/\//i.test(path)) {
          const u = new URL(path);
          path = u.pathname + u.search;
        }
      } catch {}
      return {
        success: true,
        data: {
          path,
          label: args.label || path,
          autoOpen: args.autoOpen !== false,
        },
        display: { type: "navigate" },
      };
    }

    /* ── show_page_preview ── */
    if (name === "show_page_preview") {
      let path = String(args.path || "").trim();
      if (!path.startsWith("/")) path = "/" + path;
      const height = Math.min(600, Math.max(200, Number(args.height) || 360));
      return {
        success: true,
        data: {
          path,
          title: args.title || path,
          height,
        },
        display: { type: "page_preview" },
      };
    }

    /* ── list_navigable_pages ── */
    if (name === "list_navigable_pages") {
      const area = String(args.area || "all").toLowerCase();
      const PAGES: Record<string, { path: string; title: string }[]> = {
        public: [
          { path: "/", title: "الرئيسية" },
          { path: "/about", title: "من نحن" },
          { path: "/prices", title: "الباقات والأسعار" },
          { path: "/devices", title: "الأجهزة" },
          { path: "/consultations", title: "الاستشارات" },
          { path: "/contact", title: "تواصل معنا" },
          { path: "/systems", title: "الأنظمة الجاهزة" },
        ],
        client: [
          { path: "/dashboard", title: "لوحة العميل" },
          { path: "/dashboard/orders", title: "طلباتي" },
          { path: "/dashboard/wallet", title: "محفظتي" },
          { path: "/dashboard/projects", title: "مشاريعي" },
          { path: "/dashboard/invoices", title: "فواتيري" },
          { path: "/dashboard/support", title: "تذاكر الدعم" },
        ],
        employee: [
          { path: "/employee", title: "لوحة الموظف" },
          { path: "/employee/profile", title: "ملف الموظف" },
          { path: "/employee/tasks", title: "مهامي" },
          { path: "/employee/orders", title: "الطلبات" },
          { path: "/employee/clients", title: "العملاء" },
          { path: "/employee/projects", title: "المشاريع" },
          { path: "/employee/quotations", title: "عروض الأسعار" },
          { path: "/employee/invoices", title: "الفواتير" },
        ],
        admin: [
          { path: "/admin", title: "لوحة الإدارة" },
          { path: "/admin/orders", title: "إدارة الطلبات" },
          { path: "/admin/clients", title: "إدارة العملاء" },
          { path: "/admin/employees", title: "إدارة الموظفين" },
          { path: "/admin/projects", title: "إدارة المشاريع" },
          { path: "/admin/quotations", title: "عروض الأسعار" },
          { path: "/admin/invoices", title: "الفواتير" },
          { path: "/admin/payments", title: "المدفوعات" },
          { path: "/admin/analytics", title: "التحليلات" },
          { path: "/admin/ai-sessions", title: "جلسات الذكاء الاصطناعي" },
          { path: "/admin/notifications", title: "الإشعارات" },
          { path: "/admin/system-map", title: "خريطة النظام" },
        ],
      };
      const pages = area === "all"
        ? Object.entries(PAGES).flatMap(([a, list]) => list.map(p => ({ ...p, area: a })))
        : (PAGES[area] || []).map(p => ({ ...p, area }));
      return { success: true, data: { pages }, display: { type: "pages_list" } };
    }

    /* ── search_web ── */
    if (name === "search_web") {
      const result = await searchWeb(args.query);
      return { success: true, data: { results: result }, display: { type: "web_results" } };
    }

    /* ── submit_consultation_request ── */
    if (name === "submit_consultation_request") {
      if (!args.clientName?.trim()) return { success: false, error: "اسم العميل مطلوب" };
      if (!args.clientPhone?.trim()) return { success: false, error: "رقم الهاتف مطلوب" };
      if (!args.topic?.trim()) return { success: false, error: "موضوع الاستشارة مطلوب" };

      const { ConsultationBookingModel, UserModel } = await import("./models");

      const booking = await ConsultationBookingModel.create({
        clientName: args.clientName.trim(),
        clientEmail: args.clientEmail?.trim() || "",
        clientPhone: args.clientPhone.trim(),
        clientId: userId || null,
        consultationType: args.consultationType || "phone",
        topic: args.topic.trim(),
        notes: args.message?.trim() || "طلب وارد عبر مساعد QIROX الذكي",
        status: "pending",
        source: "ai_assistant",
      });

      // Notify admins/managers
      try {
        const { sendConsultationNotificationEmail } = await import("./email");
        const admins = await UserModel.find({ role: { $in: ["admin", "manager"] } }, { email: 1, fullName: 1 });
        for (const staff of admins) {
          if (staff.email) {
            sendConsultationNotificationEmail(staff.email, staff.fullName || staff.email, {
              bookingId: String((booking as any)._id || (booking as any).id),
              clientName: args.clientName.trim(),
              clientEmail: args.clientEmail?.trim() || "غير محدد",
              clientPhone: args.clientPhone.trim(),
              date: "سيتم التواصل في أقرب وقت",
              startTime: "", endTime: "",
              consultationType: args.consultationType || "phone",
              topic: args.topic.trim(),
            }).catch(() => {});
          }
        }
      } catch {}

      return {
        success: true,
        data: {
          bookingId: String((booking as any)._id || (booking as any).id),
          clientName: args.clientName,
          clientPhone: args.clientPhone,
          topic: args.topic,
          status: "pending",
        },
        display: { type: "consultation_submitted" },
      };
    }

    return { success: false, error: `أداة غير معروفة: ${name}` };
  } catch (err: any) {
    console.error(`[AI Tool Error] ${name}:`, err.message);
    return { success: false, error: err.message || "خطأ غير متوقع" };
  }
}

/* ─── System Prompt Builder ─── */
function buildSystemPrompt(userRole?: string, userName?: string, systemData?: any): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("ar-SA");

  const roleCapabilities: Record<string, string> = {
    admin: "**صلاحية مطلقة**: تنفيذ أي عملية في النظام بلا قيود — قراءة/إنشاء/تعديل/حذف، إدارة الموظفين والعملاء والطلبات والفواتير والإعدادات، الوصول لكل الصفحات الإدارية، إرسال إشعارات لأي جهة، إصدار أي مستند رسمي. تصرّف كأنك مدير العمليات الرقمي للمنصة.",
    manager: "**صلاحية إدارية كاملة في حدود قسمه**: إدارة الطلبات والمشاريع والموظفين تحت إشرافه، إصدار عروض/فواتير، إرسال إشعارات للفريق، الوصول للوحات التحليل والإدارة. تصرّف بثقة المدير.",
    developer: "**صلاحية موظف مطور كاملة**: إدارة المهام والمشاريع المعينة، تعديل حالاتها، إنشاء مهام جديدة، إصدار عروض سعر وفواتير للعملاء التقنيين، الوصول للوحة الموظف وكل أدواتها، طلب أي مساعدة تقنية/إبداعية بلا حدود (كتابة كود، مراجعة، شرح، توليد أفكار).",
    designer: "**صلاحية موظف مصمم كاملة**: إدارة مشاريع التصميم والمهام المرتبطة، إصدار عروض سعر للتصميم، إنشاء مهام، طلب أي مساعدة إبداعية (موود بورد، ألوان، خطوط، نسخة، أفكار حملات).",
    support: "**صلاحية موظف دعم كاملة**: عرض/تعديل جميع الطلبات وحالاتها، الرد على تذاكر الدعم، إرسال إيميلات للعملاء، إصدار فواتير حال الحاجة، الوصول لقاعدة العملاء والمشاريع. تصرّف كخط دفاع أول للعملاء.",
    sales: "**صلاحية موظف مبيعات كاملة**: إدارة العملاء، إنشاء طلبات نيابة عنهم، إصدار عروض أسعار وفواتير، إرسال إيميلات تسويقية ومتابعات، الوصول لخط الأنابيب البيعي. اقفل الصفقات بنشاط.",
    sales_manager: "**صلاحية مدير مبيعات كاملة**: كل صلاحيات المبيعات + إدارة الفريق، توزيع الفرص، إرسال إشعارات للفريق، عرض تحليلات الأداء.",
    accountant: "**صلاحية محاسب كاملة**: إصدار/تعديل الفواتير، إدارة المحافظ والمدفوعات، عرض التقارير المالية، تصدير البيانات، إرسال تذكير دفع. تصرّف كأمين على الجانب المالي.",
    merchant: "**صلاحية تاجر كاملة**: إدارة المتجر والمنتجات والطلبات، إصدار فواتير للعملاء، الردّ على استفساراتهم، عرض إحصاءات المبيعات.",
    client: "صلاحية عميل: عرض طلباتك ومشاريعك ورصيد محفظتك، إلغاء الطلبات المعلّقة، إرسال تذاكر دعم، طلب فواتير، تصفح الباقات والأنظمة.",
    guest: "أنت زائر — يمكنني مساعدتك في فهم المنصة واختيار الباقة المناسبة وإرسال طلب تواصل أو استشارة مجانية نيابةً عنك.",
  };

  return `أنت **QIROX AI** — المساعد الذكي الرسمي والعامل لمنصة QIROX Studio.

== هويتك ==
- اسمك: QIROX AI | الشخصية: ذكي، ودود، فعّال، محترف
- اليوم: ${dateStr} — الساعة: ${timeStr}
- المستخدم الحالي: ${userName || "الزائر"} | الدور: ${userRole || "guest"}
- صلاحياتك: ${roleCapabilities[userRole || "guest"] || roleCapabilities.guest}

== قدراتك الحقيقية في النظام ==
أنت لست مجرد محادثة — أنت عامل ذكي يمكنه **تنفيذ عمليات فعلية** على النظام، **التنقّل بين الصفحات نيابة عن المستخدم**، و**عرض الصفحات بصرياً داخل المحادثة**:

### 🧭 التنقّل والمعاينة البصرية (مهم جداً للموظفين)
- **navigate_to**: عندما يقول المستخدم "افتح/خذني/وديني/روح/أبي أوصل لـ" أي شاشة → استخدم هذه الأداة فوراً وستفتح الصفحة له تلقائياً. مثال: المستخدم يقول "وديني صفحة الطلبات" → استدع \`navigate_to({ path: "/admin/orders", label: "الطلبات", autoOpen: true })\`.
- **show_page_preview**: عندما يقول المستخدم "وريني/أرني صورة من/كيف تبدو صفحة..." → استخدم هذه الأداة لعرض معاينة حية للصفحة داخل الشات (iframe). مثال: "أبي أشوف صفحة الباقات" → استدع \`show_page_preview({ path: "/prices", title: "صفحة الباقات", height: 420 })\`.
- **list_navigable_pages**: إذا لم تكن متأكداً من المسار الصحيح، استدعِ هذه الأداة أولاً للحصول على القائمة الكاملة.
- **كن استباقياً**: عندما تقترح خطوة على المستخدم تتطلب فتح صفحة معينة، أرفقها بـ \`navigate_to\` تلقائياً ليصل بنقرة واحدة.
- **اجمع الأدوات**: مثلاً عند إنشاء عرض سعر → نفّذ \`create_quotation\`، ثم \`generate_qr_code\` لرابط الطباعة، ثم اقترح \`navigate_to\` لصفحة عروض الأسعار. كل ذلك في رد واحد.

### العمليات الأخرى:
- 📋 **قراءة البيانات**: الطلبات، العملاء، الموظفون، المشاريع، التحليلات، المحفظة
- ✏️ **تعديل البيانات**: تغيير حالة الطلبات، إنشاء المهام، تحديث الملاحظات
- 📩 **الإرسال**:
  - إشعارات فورية داخل المنصة (أداة send_notification — للمدراء فقط)
  - **بريد إلكتروني فعلي** عبر صندوق QIROX إلى أي عنوان إيميل (أداة send_email — للموظفين والمدراء). استخدمها فوراً كلما طلب المستخدم "أرسل بريد/إيميل" لأي شخص. صُغ المحتوى بنفسك من سياق المحادثة إن لم يكتبه المستخدم بشكل صريح. لا تخلط بينها وبين الإشعارات.
  - تذاكر دعم (send_support_ticket)
- 📄 **إنشاء مستندات رسمية فعلية في النظام** (للموظفين والإدارة):
  - **عرض سعر** بأرقام تسلسلية (QT-YYYY-####) ورابط طباعة جاهز (أداة create_quotation). استخدمها فوراً عند طلب "اعمل/سوّي/أنشئ عرض سعر".
  - **فاتورة** بأرقام تلقائية وحساب ضريبة 15% وإشعار العميل (أداة create_invoice). استخدمها عند "أصدر/اعمل فاتورة".
  - **طلب جديد** نيابةً عن العميل بأرقام تسلسلية (أداة create_order) — للطلبات الواردة عبر الهاتف/واتساب.
- 🔳 **توليد رمز QR** من أي رابط أو نص (أداة generate_qr_code). يُرجع صورة جاهزة. استخدمها لمشاركة روابط الفواتير، عروض الأسعار، روابط الدفع، أو أي رابط. **بعد إنشاء عرض سعر أو فاتورة، اقترح فوراً توليد QR لرابط الطباعة لتسهيل المشاركة.**
- 🗑️ **الإلغاء**: إلغاء الطلبات المعلّقة (للعملاء فقط)
- 📅 **للزوار بدون حساب**: إرسال طلب استشارة أو تواصل باسم الزائر ورقمه مباشرةً (أداة submit_consultation_request)

== تعليمات لمعالجة طلبات الاستشارة من الزوار ==
- إذا طلب زائر (guest) التواصل أو الاستشارة أو أراد أن "يتواصل الفريق معه"، لا تقل له سجّل دخول!
- بدلاً من ذلك: اطلب منه اسمه الكريم ورقم هاتفه وما يريده.
- بمجرد حصولك على هذه المعلومات من المحادثة، استخدم أداة submit_consultation_request فوراً لإرسال الطلب للفريق.
- أكّد للزائر أن الفريق سيتواصل معه قريباً على رقمه.

== تعليمات مهمة ==
1. **استخدم الأدوات بذكاء**: عندما يطلب المستخدم أي بيانات أو عملية، استخدم الأداة المناسبة مباشرة ولا تسأل كثيراً.
2. **كن حذراً مع العمليات التدميرية**: إلغاء الطلبات وتغيير الحالات — أكّد مع المستخدم قبل التنفيذ إن كان الأمر غير واضح.
3. **اعرض النتائج بوضوح**: بعد تنفيذ أي عملية، وضّح ما تم وما هو الأثر.
4. **تحدّث بالعربية دائماً** إلا إذا طُلب منك الإنجليزية أو لغة أخرى.
5. **لا تختلق بيانات**: إذا لم تجد بيانات في الأداة، قل ذلك بوضوح.
6. **للموظفين تحديداً**: أنت مساعد إبداعي خارق — يمكنك كتابة الكود، صياغة الرسائل والإيميلات، ترجمة النصوص، تحليل البيانات، كتابة التقارير، توليد الأفكار، شرح المفاهيم التقنية، إنشاء خطط العمل، مراجعة الكود، وأي شيء يطلبه الموظف. لا حدود لما يمكنك مساعدتهم به.

== معرفتك بالمنصة ==
QIROX Studio — وكالة تقنية سعودية | الباقات: لايت (5,000 ريال)، برو (10,000 ريال)، إنفينيت (20,000 ريال)
الأدوار: admin, manager, developer, designer, support, sales, sales_manager, accountant, merchant, client
طرق الدفع: محفظة Qirox Pay، تحويل بنكي، PayPal، تقسيط
${systemData ? `بيانات النظام: ${JSON.stringify(systemData)}` : ""}`;
}

/* ─── Core Chat Handler ─── */
async function handleChat(req: any, res: any) {
  const { message, sessionId, context } = req.body;
  if (!message?.trim()) return res.json({ reply: "الرجاء إدخال رسالة." });

  const userId = req.user?._id ? String(req.user._id) : undefined;
  // ⚠️ SECURITY: NEVER trust context.role from the request body — always use the verified session
  const userRole = req.user?.role || "guest";
  const userName = req.user?.fullName || req.user?.username || context?.name;

  const session = getSession(sessionId || "anon", userId, userRole, userName);
  session.history.push({ role: "user", content: message.trim() });
  if (session.history.length > 40) session.history = session.history.slice(-40);

  try {
    /* ── Round 1: AI decides which tools to call ── */
    const messages: any[] = [
      { role: "system", content: buildSystemPrompt(userRole, userName) },
      ...session.history.slice(-20),
    ];

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages,
      tools: QIROX_TOOLS,
      tool_choice: "auto",
      temperature: 0.65,
      max_tokens: 1200,
    });

    const choice = completion.choices[0];
    let toolResults: { name: string; result: any }[] = [];

    /* ── Round 2: Execute tool calls if any ── */
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolMessages: any[] = [
        { role: "system", content: buildSystemPrompt(userRole, userName) },
        ...session.history.slice(-20),
        choice.message, // assistant message with tool_calls
      ];

      const executionResults = await Promise.all(
        choice.message.tool_calls.map(async (tc) => {
          const args = JSON.parse(tc.function.arguments || "{}");
          const result = await executeTool(tc.function.name, args, userId, userRole);
          toolResults.push({ name: tc.function.name, result });
          return {
            role: "tool" as const,
            tool_call_id: tc.id,
            content: JSON.stringify(result.success ? result.data : { error: result.error }),
          };
        })
      );

      toolMessages.push(...executionResults);

      const finalCompletion = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: toolMessages,
        temperature: 0.65,
        max_tokens: 1200,
      });

      const finalReply = finalCompletion.choices[0].message.content || "تم تنفيذ العملية.";

      // store in history
      session.history.push({ role: "assistant", content: finalReply });

      // extract suggestions
      const suggestions: string[] = [];
      const sugMatch = finalReply.match(/\[اقتراح:([^\]]+)\]/g);
      if (sugMatch) sugMatch.forEach(m => suggestions.push(m.replace(/\[اقتراح:|]/g, "").trim()));

      // Build the primary display from first tool result with a display type
      const displayResult = toolResults.find(t => t.result?.display?.type);

      // ── Admin Digest: notify after tool execution (non-admin users) ──
      session.toolCallCount = (session.toolCallCount || 0) + toolResults.length;
      notifyAdminsOfAIActivity(session, message.trim(), finalReply, toolResults.map(t => t.name)).catch(() => {});

      return res.json({
        reply: finalReply.replace(/\[اقتراح:[^\]]+\]/g, "").trim(),
        suggestions,
        action: displayResult ? "TOOL_RESULT" : undefined,
        toolName: displayResult?.name,
        toolData: displayResult?.result?.data,
        displayType: displayResult?.result?.display?.type,
        allTools: toolResults.map(t => ({ name: t.name, success: t.result.success, displayType: t.result?.display?.type, data: t.result?.data })),
      });
    }

    /* ── No tool calls — pure text response ── */
    const textReply = choice.message.content || "عذراً، لم أفهم طلبك.";
    session.history.push({ role: "assistant", content: textReply });

    const suggestions: string[] = [];
    const sugMatch = textReply.match(/\[اقتراح:([^\]]+)\]/g);
    if (sugMatch) sugMatch.forEach(m => suggestions.push(m.replace(/\[اقتراح:|]/g, "").trim()));

    // ── Admin Digest: also notify on longer text conversations (every 5th user msg) ──
    const userMsgCount = session.history.filter(m => m.role === "user").length;
    if (userMsgCount >= 3 && userMsgCount % 5 === 0) {
      notifyAdminsOfAIActivity(session, message.trim(), textReply, []).catch(() => {});
    }

    // Check for navigate action
    const navMatch = textReply.match(/\[انتقال:([^|]+)\|([^\]]+)\]/);
    if (navMatch) {
      return res.json({
        reply: textReply.replace(/\[انتقال:[^\]]+\]/g, "").replace(/\[اقتراح:[^\]]+\]/g, "").trim(),
        suggestions,
        action: "NAVIGATE",
        data: { url: navMatch[1].trim(), label: navMatch[2].trim() },
      });
    }

    return res.json({ reply: textReply.replace(/\[اقتراح:[^\]]+\]/g, "").trim(), suggestions });
  } catch (err: any) {
    console.error("[AI Chat Error]", err.message);
    // Fallback: retry without tools so user still gets a real answer
    try {
      const fallback = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [
          { role: "system", content: "أنت مساعد QIROX Studio الذكي. أجب بالعربية باختصار وبأسلوب ودود. لا تستخدم أي أدوات الآن — فقط ساعد العميل بالكلام." },
          { role: "user", content: req.body?.message || "" },
        ],
        temperature: 0.6, max_tokens: 500,
      });
      const reply = fallback.choices[0]?.message?.content?.trim() || "أهلاً، كيف أقدر أساعدك؟";
      return res.json({ reply, suggestions: [] });
    } catch {
      return res.json({ reply: "أهلاً بك في QIROX 👋 خدمتنا متاحة. كيف أقدر أساعدك؟ يمكنك تصفح /prices للأسعار أو /start للبدء بمشروع.", suggestions: [] });
    }
  }
}

/* ─── Analytics endpoint ─── */
async function handleAnalyze(req: any, res: any) {
  const { metric, period } = req.body;
  try {
    const { OrderModel, UserModel, ProjectModel } = await import("./models");
    const [totalOrders, activeOrders, completedOrders, totalClients] = await Promise.all([
      OrderModel.countDocuments({}), OrderModel.countDocuments({ status: "active" }),
      OrderModel.countDocuments({ status: "completed" }), UserModel.countDocuments({ role: "client" }),
    ]);
    const prompt = `أنت محلل بيانات لمنصة QIROX Studio. بناء على:
- إجمالي الطلبات: ${totalOrders} | نشطة: ${activeOrders} | مكتملة: ${completedOrders}
- إجمالي العملاء: ${totalClients}
المطلوب: ${metric || "تحليل عام للمنصة"}. أعط تحليلاً ذكياً ومقترحات عملية بالعربية.`;
    const comp = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6, max_tokens: 800,
    });
    res.json({ analysis: comp.choices[0].message.content });
  } catch (err: any) {
    res.json({ analysis: "تعذّر إجراء التحليل حالياً." });
  }
}

/* ─── Content generation endpoint ─── */
async function handleGenerate(req: any, res: any) {
  const { type, context: ctx, language = "ar" } = req.body;
  const templates: Record<string, string> = {
    proposal: "اكتب عرض سعر احترافي لمشروع تطوير موقع ويب",
    email: "اكتب بريداً إلكترونياً احترافياً للتواصل مع عميل",
    report: "اكتب تقريراً إدارياً احترافياً",
    social: "اكتب منشوراً احترافياً لوسائل التواصل الاجتماعي",
    description: "اكتب وصفاً احترافياً",
  };
  const basePrompt = templates[type] || "اكتب محتوى احترافياً";
  try {
    const comp = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: `${basePrompt} لـ QIROX Studio. ${ctx ? `السياق: ${ctx}` : ""}. اللغة: ${language === "ar" ? "العربية" : "الإنجليزية"}` }],
      temperature: 0.8, max_tokens: 600,
    });
    res.json({ content: comp.choices[0].message.content });
  } catch {
    res.json({ content: "تعذّر توليد المحتوى حالياً." });
  }
}

/* ─── Custom Order endpoint ─── */
async function handleCustomOrder(req: any, res: any) {
  const { description, budget, timeline, contactInfo } = req.body;
  try {
    const comp = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{
        role: "user",
        content: `أنت مستشار أعمال في QIROX Studio. العميل يريد: "${description}"، الميزانية: ${budget || "غير محددة"}، الجدول الزمني: ${timeline || "غير محدد"}. أعطه ردًا احترافياً يوضح كيف يمكن QIROX مساعدته والخطوات التالية.`,
      }],
      temperature: 0.7, max_tokens: 500,
    });
    res.json({ reply: comp.choices[0].message.content, success: true });
  } catch {
    res.json({ reply: "شكراً لاهتمامك! سيتواصل معك فريقنا قريباً.", success: true });
  }
}

/* ═══════════════════════════════════════════════════════
   AI STUDIO TOOLS — 7 specialized endpoints
═══════════════════════════════════════════════════════ */

/* ── 1. Project Estimation ── */
async function handleEstimateProject(req: any, res: any) {
  const { description } = req.body;
  if (!description) return res.json({ error: "الرجاء وصف المشروع" });
  try {
    const comp = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{
        role: "system",
        content: `أنت خبير تقدير مشاريع تقنية في QIROX Studio. الباقات: لايت (5-12k ريال، 2-4 أسابيع)، برو (10-25k ريال، 4-8 أسابيع)، إنفينيت (20k+ ريال، 8-16 أسبوع).
أعطِ تقديراً دقيقاً وإجابتك يجب أن تكون JSON فقط بالصيغة التالية (لا تضع أي نص خارج الـ JSON):
{"minPrice":5000,"maxPrice":12000,"duration":"2-4 أسابيع","package":"lite","team":{"developer":1,"designer":1,"pm":0,"devops":0},"breakdown":{"design":"30%","frontend":"40%","backend":"20%","testing":"10%"},"complexity":"low|medium|high","confidence":85,"notes":"ملاحظة مختصرة عن أبرز متطلبات المشروع"}`
      }, {
        role: "user",
        content: `قدّر هذا المشروع: ${description}`
      }],
      temperature: 0.3, max_tokens: 600,
    });
    const raw = comp.choices[0].message.content || "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.json({ error: "تعذّر تقدير المشروع" });
  }
}

/* ── 2. Proposal/Contract Writer ── */
async function handleGenerateProposal(req: any, res: any) {
  const { clientName, projectType, package: pkg, budget, features, language = "ar" } = req.body;
  try {
    const prompt = language === "ar"
      ? `اكتب عرض سعر احترافي كامل بالعربية لـ QIROX Studio. العميل: ${clientName}، نوع المشروع: ${projectType}، الباقة: ${pkg}، الميزانية: ${budget} ريال، المميزات المطلوبة: ${features}. يجب أن يكون مفصّلاً ويشمل: المقدمة، نطاق العمل، المخرجات، الجدول الزمني، السعر، شروط الدفع، والخاتمة.`
      : `Write a professional proposal in English for QIROX Studio. Client: ${clientName}, Project: ${projectType}, Package: ${pkg}, Budget: ${budget} SAR, Features: ${features}. Include: intro, scope, deliverables, timeline, pricing, payment terms, and conclusion.`;
    const comp = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6, max_tokens: 1200,
    });
    res.json({ success: true, proposal: comp.choices[0].message.content });
  } catch {
    res.json({ error: "تعذّر إنشاء المقترح" });
  }
}

/* ── 3. Website Analyzer ── */
async function handleAnalyzeWebsite(req: any, res: any) {
  const { url } = req.body;
  if (!url) return res.json({ error: "الرجاء إدخال رابط الموقع" });
  try {
    const searchData = await searchWeb(`site:${url} OR "${url}" speed performance SEO review`);
    const comp = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{
        role: "system",
        content: `أنت خبير تحليل مواقع ويب. حلّل الموقع وأعطِ تقريراً. أجب بـ JSON فقط:
{"seoScore":75,"speedScore":60,"designScore":80,"mobileScore":70,"overallScore":71,"issues":["مشكلة 1","مشكلة 2","مشكلة 3"],"strengths":["ميزة 1","ميزة 2"],"suggestions":["اقتراح 1","اقتراح 2","اقتراح 3"],"urgentFix":"أهم شيء يجب إصلاحه فوراً","salesPitch":"جملة مقنعة لماذا QIROX ستحل هذه المشاكل"}`
      }, {
        role: "user",
        content: `حلّل موقع: ${url}\nمعلومات من البحث: ${searchData || "لا توجد بيانات إضافية"}`
      }],
      temperature: 0.4, max_tokens: 700,
    });
    const raw = comp.choices[0].message.content || "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    res.json({ success: true, url, ...result });
  } catch {
    res.json({ error: "تعذّر تحليل الموقع" });
  }
}

/* ── 4. Sentiment Analyzer ── */
async function handleAnalyzeSentiment(req: any, res: any) {
  const { text, clientName } = req.body;
  if (!text) return res.json({ error: "الرجاء إدخال النص" });
  try {
    const comp = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{
        role: "system",
        content: `أنت محلل مشاعر عملاء. حلّل النص وأجب بـ JSON فقط:
{"sentiment":"positive|neutral|negative|urgent","score":0.85,"emoji":"😊","alert":false,"alertLevel":"none|warning|critical","summary":"ملخص مشاعر العميل","recommendation":"توصية للفريق","suggestedResponse":"مقترح رد مناسب للعميل"}`
      }, {
        role: "user",
        content: `حلّل هذه الرسالة${clientName ? ` من العميل ${clientName}` : ""}: "${text}"`
      }],
      temperature: 0.3, max_tokens: 400,
    });
    const raw = comp.choices[0].message.content || "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    res.json({ success: true, text: text.slice(0, 100), ...result });
  } catch {
    res.json({ error: "تعذّر تحليل المشاعر" });
  }
}

/* ── 5. Smart Task Assignment ── */
async function handleSuggestAssignment(req: any, res: any) {
  const { taskDescription, skills, orderId } = req.body;
  try {
    const { UserModel, OrderModel, TaskModel } = await import("./models");
    const employees = await UserModel.find({ role: { $nin: ["client", "guest"] }, isActive: { $ne: false } })
      .select("fullName role username").lean();

    // Get task count per employee as a simple workload proxy
    const taskCounts = await Promise.all(
      employees.map(async (e) => {
        const count = await TaskModel.countDocuments({ assignee: String(e._id), status: { $ne: "done" } }).catch(() => 0);
        return { id: String(e._id), count };
      })
    );
    const workloadMap: Record<string, number> = {};
    taskCounts.forEach(t => { workloadMap[t.id] = t.count; });

    const employeeList = employees.map(e => ({
      id: String(e._id), name: e.fullName || e.username, role: e.role,
      activeTasks: workloadMap[String(e._id)] || 0,
    }));

    const comp = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{
        role: "system",
        content: `أنت مدير مشاريع ذكي. بناء على المهمة والموظفين المتاحين، اقترح أفضل 3 موظفين للتنفيذ. أجب بـ JSON فقط:
{"suggestions":[{"employeeId":"id","name":"الاسم","role":"الدور","reason":"سبب الاختيار","score":90,"workloadRisk":"low|medium|high"}]}`
      }, {
        role: "user",
        content: `المهمة: ${taskDescription}\nالمهارات المطلوبة: ${skills || "عامة"}\nالموظفون المتاحون: ${JSON.stringify(employeeList)}`
      }],
      temperature: 0.4, max_tokens: 500,
    });
    const raw = comp.choices[0].message.content || "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { suggestions: [] };
    res.json({ success: true, ...result, employees: employeeList });
  } catch (err: any) {
    res.json({ error: err.message || "تعذّر اقتراح التعيين" });
  }
}

/* ── 6. Delay Prediction ── */
async function handlePredictDelay(req: any, res: any) {
  const { projectId } = req.body;
  try {
    const { ProjectModel, TaskModel, OrderModel } = await import("./models");
    const project = await ProjectModel.findById(projectId).lean();
    if (!project) return res.json({ error: "المشروع غير موجود" });

    const tasks = await TaskModel.find({ projectId }).lean();
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t: any) => t.status === "done").length;
    const blockedTasks = tasks.filter((t: any) => t.status === "blocked").length;
    const overdueTasks = tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length;
    const progress = (project as any).progress || (totalTasks ? Math.round(doneTasks / totalTasks * 100) : 0);

    const comp = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{
        role: "system",
        content: `أنت محلل مخاطر مشاريع تقنية. حلّل بيانات المشروع وتنبأ بالتأخيرات. أجب بـ JSON فقط:
{"riskLevel":"low|medium|high|critical","delayProbability":45,"estimatedDelay":"3 أيام","reasons":["سبب 1","سبب 2"],"suggestions":["اقتراح 1","اقتراح 2"],"verdict":"جملة واحدة تلخّص الوضع"}`
      }, {
        role: "user",
        content: `المشروع: ${(project as any).name}\nالتقدم: ${progress}%\nالمهام الكلية: ${totalTasks}\nالمنجزة: ${doneTasks}\nالمتأخرة: ${overdueTasks}\nالمحجوبة: ${blockedTasks}\nتاريخ الإنشاء: ${(project as any).createdAt}`
      }],
      temperature: 0.3, max_tokens: 400,
    });
    const raw = comp.choices[0].message.content || "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    res.json({ success: true, project: { name: (project as any).name, progress, totalTasks, doneTasks, overdueTasks }, ...result });
  } catch (err: any) {
    res.json({ error: err.message || "تعذّر توقع التأخير" });
  }
}

/* ── 7. Social Media Content Generator ── */
async function handleGenerateSocial(req: any, res: any) {
  const { projectName, clientName, service, result: outcome, language = "both" } = req.body;
  try {
    const comp = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{
        role: "system",
        content: `أنت مسؤول تسويق رقمي إبداعي في QIROX Studio. أنشئ محتوى سوشيال ميديا احترافياً. أجب بـ JSON فقط:
{"arabic":{"caption":"نص المنشور بالعربية","hashtags":["#هاشتاج1","#هاشتاج2","#هاشتاج3","#هاشتاج4","#هاشتاج5"]},"english":{"caption":"Post caption in English","hashtags":["#hashtag1","#hashtag2","#hashtag3","#hashtag4","#hashtag5"]},"emoji":"🚀","type":"celebration"}`
      }, {
        role: "user",
        content: `مشروع مكتمل: ${projectName}\nالعميل: ${clientName}\nالخدمة: ${service}\nالنتيجة: ${outcome || "تم تسليم المشروع بنجاح"}`
      }],
      temperature: 0.75, max_tokens: 700,
    });
    const raw = comp.choices[0].message.content || "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    res.json({ success: true, ...result });
  } catch {
    res.json({ error: "تعذّر توليد المحتوى" });
  }
}

/* ── 8. Meeting Summary & Task Extractor ── */
async function handleMeetingSummary(req: any, res: any) {
  const { transcript, projectId, meetingTitle } = req.body;
  if (!transcript) return res.json({ error: "الرجاء إدخال محتوى الاجتماع" });
  try {
    const comp = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{
        role: "system",
        content: `أنت سكرتير ذكي متخصص في تلخيص الاجتماعات. حلّل النص وأجب بـ JSON فقط:
{"summary":"ملخص الاجتماع في فقرة","keyDecisions":["قرار 1","قرار 2"],"actionItems":[{"task":"المهمة","assignee":"المسؤول","priority":"high|medium|low","dueDate":"خلال أسبوع"}],"nextMeeting":"موعد الاجتماع التالي إن ذُكر","followUp":"ملاحظات متابعة"}`
      }, {
        role: "user",
        content: `اجتماع: ${meetingTitle || "اجتماع"}\n\nالمحتوى:\n${transcript}`
      }],
      temperature: 0.4, max_tokens: 800,
    });
    const raw = comp.choices[0].message.content || "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    // Auto-create tasks in project if projectId provided
    if (projectId && result.actionItems?.length) {
      try {
        const { TaskModel } = await import("./models");
        const priorityMap: Record<string, string> = { high: "high", medium: "medium", low: "low" };
        for (const item of result.actionItems) {
          await TaskModel.create({
            projectId, title: item.task, description: `مهمة مستخلصة من الاجتماع: ${meetingTitle || ""}`,
            priority: priorityMap[item.priority] || "medium", status: "todo", createdAt: new Date(),
          });
        }
        result.tasksCreated = result.actionItems.length;
      } catch {}
    }
    res.json({ success: true, ...result });
  } catch {
    res.json({ error: "تعذّر تلخيص الاجتماع" });
  }
}

/* ─── Package Finder (AI-powered, no hardcoded logic) ─── */
const finderSessions = new Map<string, Message[]>();

const PACKAGE_FINDER_SYSTEM = `أنت **مستشار باقات QIROX Studio** — متخصص فقط في مساعدة العملاء على اختيار الباقة الأنسب.

== الباقات المتاحة ==
1. **باقة لايت** (من 5,000 ريال | 2-4 أسابيع)
   - موقع إلكتروني احترافي + لوحة تحكم + نظام طلبات + إدارة المنتجات + دعم فني أساسي
   - مثالية لـ: المطاعم الصغيرة، المتاجر الناشئة، الأفراد والمستقلين، المشاريع البسيطة
   - لا تشمل: تطبيق جوال، ذكاء اصطناعي، دفع إلكتروني متقدم

2. **باقة برو** (من 10,000 ريال | 4-8 أسابيع)
   - كل ميزات لايت + تطبيق جوال (iOS & Android) + بوابة دفع إلكتروني + CRM + تقارير متقدمة + ذكاء اصطناعي مدمج
   - مثالية لـ: المطاعم المتوسطة والكبيرة، المتاجر الإلكترونية، شركات الخدمات، المنصات التعليمية
   - لا تشمل: خادم مخصص، دعم 24/7 حصري

3. **باقة إنفينيت** (من 20,000 ريال | 8-16 أسبوع)
   - تخصيص كامل بلا حدود + خادم مخصص حصري + API غير محدودة + فريق دعم مخصص 24/7 + أولوية في التسليم + تكاملات متقدمة
   - مثالية لـ: السلاسل الكبيرة، الشركات المؤسسية، منصات SaaS، المشاريع الحكومية

== أسلوب المحادثة ==
- تحدّث بالعربية الخليجية الودّية
- اسأل سؤالاً واحداً فقط في كل رسالة
- بعد 2-3 أسئلة (أو إذا كان الوصف كافياً من أول رسالة) أعطِ توصيتك
- الأسئلة الذكية التي تسألها: نوع النشاط، هل يحتاج تطبيق جوال، الميزانية التقريبية، الحجم والطموح

== قاعدة الإنهاء ==
عندما تكون متأكداً من التوصية، أنهِ ردّك بالسطر التالي بالضبط (JSON مضغوط):
RECOMMEND:{"tier":"lite|pro|infinite","reasoning":"سبب واضح ومختصر بـ 2-3 جمل بالعربية"}

لا تضع RECOMMEND إلا مرة واحدة وعندما تكون واثقاً 100%.`;

async function handlePackageFinder(req: any, res: any) {
  const { message, sessionId } = req.body;
  if (!message?.trim() || !sessionId) return res.json({ reply: "الرجاء إدخال رسالة." });

  if (!finderSessions.has(sessionId)) {
    finderSessions.set(sessionId, []);
  }
  const history = finderSessions.get(sessionId)!;
  history.push({ role: "user", content: message.trim() });
  if (history.length > 20) history.splice(0, history.length - 20);

  try {
    const comp = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: PACKAGE_FINDER_SYSTEM },
        ...history,
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const raw = comp.choices[0].message.content || "";
    history.push({ role: "assistant", content: raw });

    // Check if it contains a recommendation
    const recMatch = raw.match(/RECOMMEND:\s*(\{[^}]+\})/);
    if (recMatch) {
      try {
        const rec = JSON.parse(recMatch[1]);
        const reply = raw.replace(/RECOMMEND:\s*\{[^}]+\}/, "").trim();
        return res.json({ reply: reply || "إليك توصيتي لك!", done: true, tier: rec.tier, reasoning: rec.reasoning });
      } catch {}
    }

    return res.json({ reply: raw.trim() });
  } catch (err: any) {
    console.error("[Package Finder Error]", err.message);
    return res.json({ reply: "عذراً، حدث خطأ مؤقت. حاول مجدداً." });
  }
}

/* ─── Translation Handler ─── */
async function handleTranslate(req: any, res: any) {
  const { text, targetLang, context } = req.body || {};
  if (!text || !targetLang) return res.status(400).json({ error: "text and targetLang required" });

  const langName = targetLang === "ar" ? "Arabic (formal Modern Standard Arabic)" : "English (professional, concise)";
  const contextHint = context ? `\nContext: this text appears in a ${context} interface.` : "";

  try {
    const comp = await openai.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `You are a professional translator for a B2B SaaS platform. Translate the given text to ${langName}. ${contextHint}\nRules:\n- Return ONLY the translated text, no explanation\n- Keep technical terms (QIROX, SAR, SaaS) unchanged\n- Use formal register appropriate for business software\n- Preserve any HTML tags or placeholders like {name}, {count}`,
        },
        { role: "user", content: text },
      ],
    });
    const translated = comp.choices[0]?.message?.content?.trim() || text;
    res.json({ translated });
  } catch (err: any) {
    res.status(500).json({ error: err.message, translated: text });
  }
}

/* ─── Batch Translation Handler ─── */
async function handleBatchTranslate(req: any, res: any) {
  const { texts, targetLang } = req.body || {};
  if (!Array.isArray(texts) || !targetLang) return res.status(400).json({ error: "texts[] and targetLang required" });
  if (texts.length > 50) return res.status(400).json({ error: "max 50 texts per request" });

  const langName = targetLang === "ar" ? "Arabic (formal Modern Standard Arabic)" : "English (professional, concise)";

  try {
    const joined = texts.map((t: string, i: number) => `[${i}] ${t}`).join("\n");
    const comp = await openai.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `You are a professional translator for a B2B SaaS platform. Translate each numbered item to ${langName}.\nReturn ONLY a JSON array of translated strings in the same order, no explanation. Example: ["translated1","translated2"]\nKeep technical terms (QIROX, SAR, SaaS) unchanged. Use formal register.`,
        },
        { role: "user", content: joined },
      ],
    });
    const raw = comp.choices[0]?.message?.content?.trim() || "[]";
    const match = raw.match(/\[[\s\S]*\]/);
    const translated = match ? JSON.parse(match[0]) : texts;
    res.json({ translated });
  } catch (err: any) {
    res.status(500).json({ error: err.message, translated: texts });
  }
}

/* ─── Client: Help write project description ─── */
async function handleDescribeProject(req: Request, res: Response) {
  const { businessName, sector, targetAudience, existingIdea } = req.body;
  try {
    const comp = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: `أنت مساعد ذكي لشركة QIROX Studio لتطوير البرمجيات. مهمتك مساعدة العميل في صياغة فكرة مشروعه بوضوح ودقة للفريق التقني. الرد يجب أن يكون بالعربية، موجز وعملي.`
        },
        {
          role: "user",
          content: `ساعدني في كتابة وصف مشروعي التقني للفريق.
اسم النشاط: ${businessName || "غير محدد"}
القطاع: ${sector || "غير محدد"}
الجمهور المستهدف: ${targetAudience || "غير محدد"}
الفكرة الأولية: ${existingIdea || "لا توجد"}

أريد وصفاً واضحاً ومنظماً يغطي: هدف المشروع، المستخدمون، الميزات الأساسية، وأي متطلبات مهمة. الرد في 3-5 جمل فقط.`
        }
      ],
      temperature: 0.7,
      max_tokens: 400,
    });
    res.json({ description: comp.choices[0]?.message?.content?.trim() || "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/* ─── Employee: Generate project checklist ─── */
async function handleProjectChecklist(req: Request, res: Response) {
  const { businessName, sector, planTier, targetAudience, requiredFunctions, addons, visualStyle, siteLanguage, integrations } = req.body;
  try {
    const comp = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: `أنت مدير مشاريع تقنية متخصص في تطوير البرمجيات. مهمتك توليد تشيك ليست تنفيذية دقيقة للفريق التقني بناءً على تفاصيل المشروع. الرد يجب أن يكون JSON فقط.`
        },
        {
          role: "user",
          content: `بناءً على هذا المشروع، ولّد تشيك ليست تنفيذية للفريق:
- النشاط: ${businessName || "غير محدد"}
- القطاع: ${sector || "غير محدد"}
- الباقة: ${planTier || "pro"}
- الجمهور: ${targetAudience || "غير محدد"}
- المتطلبات: ${requiredFunctions || "غير محدد"}
- الإضافات: ${addons || "لا يوجد"}
- النمط البصري: ${visualStyle || "غير محدد"}
- لغة الموقع: ${siteLanguage || "عربي"}
- التكاملات: ${integrations || "لا يوجد"}

أرجع JSON بهذا الشكل فقط:
{
  "phases": [
    {
      "name": "اسم المرحلة",
      "tasks": ["مهمة 1", "مهمة 2", ...]
    }
  ]
}
المراحل: التخطيط والتصميم، التطوير، التكاملات، الاختبار، التسليم`
        }
      ],
      temperature: 0.5,
      max_tokens: 800,
    });
    const raw = comp.choices[0]?.message?.content?.trim() || "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    const result = match ? JSON.parse(match[0]) : { phases: [] };
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message, phases: [] });
  }
}

/* ─── Consultation Email Writer ─── */
async function handleConsultationEmail(req: any, res: any) {
  const {
    emailType = "followup",
    clientName, clientEmail, clientPhone,
    topic, notes, sector, features, budget,
    date, startTime, endTime, consultationType,
    employeeName, meetingLink,
    language = "ar",
  } = req.body;

  const typePrompts: Record<string, string> = {
    confirmation: language === "ar"
      ? "اكتب بريداً إلكترونياً رسمياً مميزاً يؤكد موعد الاستشارة للعميل ويتضمن كل التفاصيل الكاملة (التاريخ، الوقت، نوع الاجتماع، اسم المستشار، رابط الاجتماع إن وجد). يجب أن يكون البريد دافئاً ومحترفاً ويجعل العميل يشعر بالترحيب والثقة بـ QIROX."
      : "Write a professional email confirming the consultation appointment with full details (date, time, type, consultant name, meeting link if any).",
    followup: language === "ar"
      ? "اكتب بريداً إلكترونياً للمتابعة بعد طلب الاستشارة. يشمل ما يلي: شكر العميل على اهتمامه، ملخص لما ذكره العميل عن مشروعه، إشارة لباقات QIROX المناسبة، وتوضيح الخطوات التالية. أسلوب ودود ومحترف."
      : "Write a professional follow-up email after the consultation request. Include a summary of the client's needs and next steps.",
    proposal: language === "ar"
      ? "اكتب بريداً إلكترونياً يقدم عرضاً مبدئياً للمشروع. يشمل: مقدمة عن QIROX Studio، فهمنا لاحتياجات العميل، الباقة المقترحة مع السعر التقريبي والجدول الزمني، لماذا QIROX الخيار الأمثل، والخطوات التالية للمضي قدماً."
      : "Write a professional email with an initial project proposal including suggested package, timeline, and pricing.",
    rejection: language === "ar"
      ? "اكتب بريداً إلكترونياً يرفض طلب الاستشارة بأسلوب لبق ومحترم مع الاعتذار، وتقديم بديل مناسب (مثل: إعادة الجدولة، أو الإحالة لخدمة أخرى، أو الاشتراك في القائمة البريدية لمعرفة آخر العروض)."
      : "Write a polite rejection email for the consultation request with an alternative suggestion.",
    reminder: language === "ar"
      ? "اكتب بريداً إلكترونياً للتذكير بموعد الاستشارة القادم. يشمل كل التفاصيل (التاريخ، الوقت، نوع الاجتماع، الرابط إن وجد) وتشجيع العميل على الاستعداد بأسئلته وأفكاره مسبقاً."
      : "Write a reminder email for the upcoming consultation appointment with full details.",
    welcome: language === "ar"
      ? "اكتب بريداً إلكترونياً ترحيبياً يشكر العميل على تقديم طلب الاستشارة، يُعرّفه بـ QIROX Studio وقيمنا، ويُعلمه أن الفريق سيتواصل معه قريباً لتحديد الموعد المناسب."
      : "Write a welcome email thanking the client for submitting the consultation request and introducing QIROX Studio.",
  };

  const basePrompt = typePrompts[emailType] || typePrompts.followup;

  const dateFormatted = date
    ? new Date(date).toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : null;

  const contextLines = [
    `اسم العميل: ${clientName || "غير محدد"}`,
    clientEmail ? `البريد الإلكتروني: ${clientEmail}` : null,
    clientPhone ? `رقم الهاتف: ${clientPhone}` : null,
    topic ? `موضوع الاستشارة: ${topic}` : null,
    sector ? `القطاع / نوع النشاط: ${sector}` : null,
    features ? `الميزات / المتطلبات: ${Array.isArray(features) ? features.join("، ") : features}` : null,
    budget ? `الميزانية التقريبية: ${budget}` : null,
    dateFormatted ? `تاريخ الموعد: ${dateFormatted}` : null,
    startTime && endTime ? `وقت الاجتماع: من ${startTime} إلى ${endTime}` : null,
    consultationType ? `نوع الاستشارة: ${consultationType === "video" ? "مكالمة فيديو" : consultationType === "phone" ? "مكالمة هاتفية" : consultationType === "in_person" ? "حضوري" : consultationType}` : null,
    employeeName ? `المستشار المسؤول: ${employeeName}` : null,
    meetingLink ? `رابط الاجتماع: ${meetingLink}` : null,
    notes ? `ملاحظات إضافية من العميل:\n${notes}` : null,
  ].filter(Boolean).join("\n");

  try {
    const comp = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: `أنت كاتب بريد إلكتروني محترف ومتميز لـ QIROX Studio، الوكالة التقنية السعودية الرائدة في بناء الأنظمة والمواقع الإلكترونية للسوق العربي.

أسلوبك: احترافي، دافئ، ثقة، إيجابي. تكتب بالعربية الفصحى المبسطة.

تنسيق البريد:
- **الموضوع**: سطر يبدأ بـ "الموضوع:" ثم موضوع البريد
- **سطر فارغ**
- **التحية**: خطاب شخصي باسم العميل
- **الجسم**: محتوى البريد الكامل بكل التفاصيل المطلوبة مع فقرات منظمة
- **الخاتمة**: توقيع احترافي:
  فريق QIROX Studio
  www.qirox.online
  واتساب: 966554656670+

قواعد مهمة:
- استخدم كل المعلومات المتاحة دون استثناء
- إذا كانت هناك تفاصيل تقنية عن المشروع، اذكرها بدقة
- اجعل البريد شاملاً ومفصّلاً — ليس مختصراً
- لا تضع أي تعليق أو شرح — فقط البريد نفسه`,
        },
        {
          role: "user",
          content: `${basePrompt}\n\nمعلومات الاستشارة:\n${contextLines}`,
        },
      ],
      temperature: 0.72,
      max_tokens: 1200,
    });

    const emailContent = comp.choices[0]?.message?.content?.trim() || "";
    res.json({ success: true, email: emailContent });
  } catch (err: any) {
    console.error("[AI ConsultationEmail]", err.message);
    res.status(500).json({ error: err.message || "تعذّر توليد البريد الإلكتروني" });
  }
}

/* ─── QuickStart Idea Enhancer ─── */
async function handleEnhanceIdea(req: any, res: any) {
  const { idea, sector, features } = req.body;
  if (!idea?.trim()) return res.status(400).json({ error: "الفكرة مطلوبة" });

  const featuresText = Array.isArray(features) && features.length > 0
    ? features.join("، ")
    : (typeof features === "string" && features) ? features : null;

  try {
    const comp = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: `أنت مستشار أعمال تقني في QIROX Studio. مهمتك تحسين وتطوير فكرة العميل وصياغتها بشكل احترافي وواضح ومفصّل يساعد الفريق التقني على فهم المشروع فوراً.

قواعد الرد:
- 3 إلى 5 جمل قوية ومحددة
- تتضمن: ما يفعله النظام، من يستخدمه، المشكلة التي يحلها، القيمة التي يضيفها
- لا مقدمات ولا تعليق — فقط الفكرة المحسّنة مباشرةً`,
        },
        {
          role: "user",
          content: `القطاع: ${sector || "غير محدد"}
${featuresText ? `الميزات المطلوبة: ${featuresText}` : ""}
فكرة العميل الأصلية: ${idea.trim()}

حسّن هذه الفكرة واجعلها أوضح وأكثر تفصيلاً واحترافية:`,
        },
      ],
      temperature: 0.72,
      max_tokens: 400,
    });

    const enhanced = comp.choices[0]?.message?.content?.trim() || idea;
    res.json({ success: true, enhanced });
  } catch (err: any) {
    console.error("[AI EnhanceIdea]", err.message);
    res.status(500).json({ error: err.message || "تعذّر تحسين الفكرة" });
  }
}

/* ─── Register Routes ─── */
export function registerAiRoutes(app: Express) {
  app.post("/api/ai/message", handleChat);
  app.post("/api/ai/chat", handleChat); // legacy alias
  app.post("/api/ai/analyze", handleAnalyze);
  app.post("/api/ai/generate", handleGenerate);
  app.post("/api/ai/custom-order", handleCustomOrder);
  app.post("/api/ai/package-finder", handlePackageFinder);
  app.post("/api/ai/estimate-project", handleEstimateProject);
  app.post("/api/ai/generate-proposal", handleGenerateProposal);
  app.post("/api/ai/analyze-website", handleAnalyzeWebsite);
  app.post("/api/ai/analyze-sentiment", handleAnalyzeSentiment);
  app.post("/api/ai/suggest-assignment", handleSuggestAssignment);
  app.post("/api/ai/predict-delay", handlePredictDelay);
  app.post("/api/ai/generate-social", handleGenerateSocial);
  app.post("/api/ai/meeting-summary", handleMeetingSummary);
  app.post("/api/ai/translate", handleTranslate);
  app.post("/api/ai/batch-translate", handleBatchTranslate);
  app.post("/api/ai/describe-project", handleDescribeProject);
  app.post("/api/ai/project-checklist", handleProjectChecklist);
  app.post("/api/ai/consultation-email", handleConsultationEmail);
  app.post("/api/ai/enhance-idea", handleEnhanceIdea);
  app.delete("/api/ai/session/:id", (req, res) => {
    sessions.delete(req.params.id);
    finderSessions.delete(req.params.id);
    res.json({ success: true });
  });
}
