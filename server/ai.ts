// @ts-nocheck
/**
 * QIROX AI — Agentic Intelligence (OpenAI via OpenRouter)
 * Full function-calling system: reads, writes, sends notifications,
 * changes order status, manages tasks — all from natural language.
 */
import type { Express } from "express";
import OpenAI from "openai";
import { sendDirectEmail } from "./email";
import axios from "axios";

/* ─── OpenAI client (OpenRouter) ─── */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://qiroxstudio.online",
    "X-Title": "QIROX Studio AI",
  },
});

const AI_MODEL = "openai/gpt-4o-mini";

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
interface Session { history: Message[]; userId?: string; userRole?: string; }
const sessions = new Map<string, Session>();

function getSession(id: string, userId?: string, role?: string): Session {
  if (!sessions.has(id)) sessions.set(id, { history: [], userId, userRole: role });
  const s = sessions.get(id)!;
  if (userId) s.userId = userId;
  if (role) s.userRole = role;
  return s;
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
      const limit = Math.min(args.limit || 10, 20);
      const query: any = {};
      if (args.status && args.status !== "all") query.status = args.status;
      if (isClient && userId) query.userId = userId;
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
      const limit = args.limit || 8;
      const query: any = {};
      if (isClient && userId) {
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
        await sendDirectEmail("info@qiroxstudio.online", `تذكرة دعم جديدة: ${args.subject}`, `من: ${user?.fullName || user?.username}\n\n${args.message}`);
        const { pushToUser } = await import("./ws");
        const admins = await UserModel.find({ role: { $in: ["admin", "manager"] } }).select("_id").lean();
        for (const a of admins) pushToUser(String(a._id), { type: "notification", title: "تذكرة دعم جديدة", body: args.subject });
      } catch {}
      return { success: true, data: { ticketId: String(ticket._id), subject: args.subject }, display: { type: "action_success" } };
    }

    /* ── search_web ── */
    if (name === "search_web") {
      const result = await searchWeb(args.query);
      return { success: true, data: { results: result }, display: { type: "web_results" } };
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

  const roleCapabilities = {
    admin: "لديك صلاحية كاملة: قراءة وكتابة وحذف في جميع أقسام النظام. يمكنك تغيير حالات الطلبات، إرسال الإشعارات للجميع، إنشاء المهام، عرض التحليلات الكاملة.",
    manager: "لديك صلاحية واسعة مثل المدير: تغيير حالات الطلبات، إرسال الإشعارات، إنشاء المهام، عرض التحليلات.",
    developer: "يمكنك عرض الطلبات المرتبطة بك وتغيير حالاتها، إنشاء مهام في المشاريع المعينة لك.",
    designer: "يمكنك عرض الطلبات المرتبطة بك وإنشاء مهام في المشاريع المعينة لك.",
    support: "يمكنك عرض الطلبات وتغيير حالاتها للحالات التشغيلية.",
    sales: "يمكنك عرض العملاء والطلبات وإرسال تذاكر دعم.",
    sales_manager: "يمكنك عرض العملاء والطلبات وإرسال الإشعارات.",
    accountant: "يمكنك عرض التحليلات المالية والطلبات والمحافظ.",
    client: "يمكنك عرض طلباتك ومشاريعك ورصيد محفظتك، وإلغاء الطلبات المعلّقة، وإرسال تذاكر دعم.",
    guest: "أنت زائر — يمكنني مساعدتك في فهم المنصة واختيار الباقة المناسبة.",
  };

  return `أنت **QIROX AI** — المساعد الذكي الرسمي والعامل لمنصة QIROX Studio.

== هويتك ==
- اسمك: QIROX AI | الشخصية: ذكي، ودود، فعّال، محترف
- اليوم: ${dateStr} — الساعة: ${timeStr}
- المستخدم الحالي: ${userName || "الزائر"} | الدور: ${userRole || "guest"}
- صلاحياتك: ${roleCapabilities[userRole || "guest"] || roleCapabilities.guest}

== قدراتك الحقيقية في النظام ==
أنت لست مجرد محادثة — أنت عامل ذكي يمكنه **تنفيذ عمليات فعلية** على النظام:
- 📋 **قراءة البيانات**: الطلبات، العملاء، الموظفون، المشاريع، التحليلات، المحفظة
- ✏️ **تعديل البيانات**: تغيير حالة الطلبات، إنشاء المهام، تحديث الملاحظات
- 📩 **الإرسال**: إشعارات فورية، تذاكر دعم، بريد إلكتروني
- 🗑️ **الإلغاء**: إلغاء الطلبات المعلّقة (للعملاء فقط)

== تعليمات مهمة ==
1. **استخدم الأدوات بذكاء**: عندما يطلب المستخدم أي بيانات أو عملية، استخدم الأداة المناسبة مباشرة ولا تسأل كثيراً.
2. **كن حذراً مع العمليات التدميرية**: إلغاء الطلبات وتغيير الحالات — أكّد مع المستخدم قبل التنفيذ إن كان الأمر غير واضح.
3. **اعرض النتائج بوضوح**: بعد تنفيذ أي عملية، وضّح ما تم وما هو الأثر.
4. **تحدّث بالعربية دائماً** إلا إذا طُلب منك الإنجليزية.
5. **لا تختلق بيانات**: إذا لم تجد بيانات في الأداة، قل ذلك بوضوح.

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
  const userRole = context?.role || req.user?.role || "guest";
  const userName = context?.name || req.user?.fullName || req.user?.username;

  const session = getSession(sessionId || "anon", userId, userRole);
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
    return res.json({ reply: "⚠️ حدث خطأ في الذكاء الاصطناعي. تحقق من الإنترنت وحاول مجدداً." });
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

/* ─── Register Routes ─── */
export function registerAiRoutes(app: Express) {
  app.post("/api/ai/message", handleChat);
  app.post("/api/ai/chat", handleChat); // legacy alias
  app.post("/api/ai/analyze", handleAnalyze);
  app.post("/api/ai/generate", handleGenerate);
  app.post("/api/ai/custom-order", handleCustomOrder);
  app.post("/api/ai/package-finder", handlePackageFinder);
  app.delete("/api/ai/session/:id", (req, res) => {
    sessions.delete(req.params.id);
    finderSessions.delete(req.params.id);
    res.json({ success: true });
  });
}
