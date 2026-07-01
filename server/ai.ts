// @ts-nocheck
/**
 * QIROX AI — Agentic Intelligence
 * Powered by Moonshot AI (Kimi)
 */
import type { Express } from "express";
import OpenAI from "openai";
import { sendDirectEmail } from "./email";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";

/* ─── AI Provider — smart selection: OpenAI GPT-4o > Moonshot (Kimi) ─── */
const MOONSHOT_BASE_URL = "https://api.moonshot.ai/v1";

let _openaiClient: OpenAI | null = null;
let AI_MODEL = "moonshot-v1-32k";
let AI_MODEL_LABEL = "QIROX AI";
let _supportsVision = false;

function getOpenAIClient(): OpenAI {
  if (!_openaiClient) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const moonshotKey = process.env.MOONSHOT_API_KEY;

    if (openaiKey) {
      // Prefer OpenAI GPT-4o — vision support, no Chinese, best quality
      AI_MODEL = "gpt-4o";
      AI_MODEL_LABEL = "QIROX AI (GPT-4o)";
      _supportsVision = true;
      _openaiClient = new OpenAI({ apiKey: openaiKey });
      console.log("[AI] Provider: OpenAI GPT-4o — vision enabled");
    } else if (moonshotKey) {
      AI_MODEL = "moonshot-v1-32k";
      AI_MODEL_LABEL = "QIROX AI";
      _supportsVision = false;
      _openaiClient = new OpenAI({ apiKey: moonshotKey, baseURL: MOONSHOT_BASE_URL });
      console.log("[AI] Provider: Moonshot AI (Kimi) — vision disabled");
    } else {
      _openaiClient = new OpenAI({ apiKey: "placeholder", baseURL: MOONSHOT_BASE_URL });
      console.log("[AI] No API key found — AI features disabled");
    }
  }
  return _openaiClient;
}

const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAIClient() as any)[prop];
  },
});

/* ─── Serper.dev web search ─── */
const SERPER_KEY = process.env.SERPER_API_KEY || "";
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
          totalAmount: { type: "number", description: "المبلغ الإجمالي بالريال (رقم)" },
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
  {
    type: "function",
    function: {
      name: "generate_image",
      description: "توليد صورة بالذكاء الاصطناعي من وصف نصي. يُنتج صوراً احترافية للتصميم، التسويق، الشعارات، المنتجات، الواجهات. استخدمها عند طلب إنشاء صورة أو تصميم أو رسم أو توضيح. مهم: اكتب وصفاً تفصيلياً ودقيقاً يعكس ما يريده المستخدم بالضبط.",
      parameters: {
        type: "object",
        required: ["prompt"],
        properties: {
          prompt: { type: "string", description: "وصف تفصيلي دقيق للصورة بالعربية أو الإنجليزية — كلما كان أكثر تفصيلاً كانت الصورة أفضل" },
          style: { type: "string", enum: ["realistic", "cartoon", "3d render", "watercolor", "minimalist", "cinematic", "logo design", "ui mockup"], description: "الأسلوب الفني المطلوب" },
          label: { type: "string", description: "عنوان قصير للصورة يُعرض للمستخدم" },
          width: { type: "number", description: "عرض الصورة بالبكسل — 1024 للمربعة، 1792 للأفقية، 1024x1792 للعمودية (افتراضي 1024)" },
          height: { type: "number", description: "ارتفاع الصورة (افتراضي 1024)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_video",
      description: "توليد فيديو قصير بالذكاء الاصطناعي من وصف نصي. يُنتج مقاطع فيديو متحركة للتسويق، العروض، المحتوى الإبداعي. استخدمها عند طلب فيديو أو مقطع متحرك أو animation.",
      parameters: {
        type: "object",
        required: ["prompt"],
        properties: {
          prompt: { type: "string", description: "وصف تفصيلي للفيديو المطلوب" },
          duration: { type: "number", description: "مدة الفيديو بالثواني (3-8، افتراضي 5)" },
          label: { type: "string", description: "عنوان الفيديو" },
          width: { type: "number", description: "عرض الفيديو (افتراضي 512)" },
          height: { type: "number", description: "ارتفاع الفيديو (افتراضي 512)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_face_biometrics",
      description: "عرض قائمة المستخدمين المسجّلة بصمات وجوههم في النظام. للمدراء فقط. يُظهر عدد المستخدمين المسجّلين وتفاصيلهم.",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string", description: "معرّف مستخدم معيّن لعرض حالة بصمته (اختياري — بدونه يعرض الجميع)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_face_biometric",
      description: "حذف بصمة وجه مستخدم من النظام. للمدراء فقط. يُستخدم عند طلب إزالة بصمة الوجه لمستخدم معيّن.",
      parameters: {
        type: "object",
        required: ["targetUserId"],
        properties: {
          targetUserId: { type: "string", description: "معرّف المستخدم الذي سيُحذف سجل بصمة وجهه" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_biometric_stats",
      description: "إحصائيات نظام المصادقة البيومترية: عدد مسجّلي بصمة الوجه، بصمة الإصبع (WebAuthn)، والرمز السريع. للمدراء.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "escalate_to_human",
      description: "تصعيد المحادثة إلى موظف بشري: يُرسَل ملخص المحادثة بالكامل عبر إيميل لفريق الدعم. استخدمها عندما يطلب المستخدم التحدث مع إنسان أو موظف، أو عندما لا تستطيع الإجابة، أو عند الشكاوى المهمة.",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", description: "سبب التصعيد — ملخص مشكلة المستخدم بكلماتك" },
          urgency: { type: "string", enum: ["normal", "high", "critical"], description: "درجة الإلحاح (normal/high/critical)" },
        },
      },
    },
  },
  /* ─── NEW POWERFUL TOOLS ─── */
  {
    type: "function",
    function: {
      name: "get_finance_report",
      description: "جلب تقرير مالي شامل: إيرادات الشهر الحالي والسابق، الطلبات المدفوعة والمعلّقة الدفع، أرصدة المحافظ، مقارنة الأداء. للمدراء والمحاسبين.",
      parameters: {
        type: "object",
        properties: {
          period: { type: "string", enum: ["today", "week", "month", "quarter", "year"], description: "الفترة الزمنية (افتراضي: month)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_kanban_board",
      description: "جلب لوحة Kanban الكاملة: جميع المهام مرتّبة حسب الحالة (todo/in_progress/review/done) والأولوية. يمكن تصفية حسب المشروع أو الموظف المُعيّن. للموظفين والمدراء.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "معرّف المشروع (اختياري — بدونه يعرض جميع المهام)" },
          assignedTo: { type: "string", description: "معرّف الموظف لعرض مهامه فقط (اختياري)" },
          status: { type: "string", enum: ["todo", "in_progress", "review", "done", "all"], description: "تصفية حسب الحالة (افتراضي: all)" },
          limit: { type: "number", description: "عدد المهام (افتراضي 20)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_attendance_summary",
      description: "جلب ملخص الحضور والانصراف: حضور اليوم، من حضر ومن غاب، متوسط وقت الوصول. للمدراء والموارد البشرية.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "التاريخ بصيغة YYYY-MM-DD (افتراضي: اليوم)" },
          employeeId: { type: "string", description: "معرّف موظف معيّن لعرض سجل حضوره (اختياري)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_ai_insight",
      description: "توليد تقرير ذكاء اصطناعي عميق مخصّص: تحليل الأداء، توقعات المبيعات، نقاط الضعف والقوة، توصيات قابلة للتنفيذ. للمدراء. أداة قوية جداً تجمع بيانات حقيقية من النظام وتحلّلها.",
      parameters: {
        type: "object",
        required: ["topic"],
        properties: {
          topic: { type: "string", enum: ["sales_forecast", "client_retention", "employee_performance", "revenue_growth", "project_health", "full_business_review"], description: "موضوع التحليل" },
          timeframe: { type: "string", description: "الإطار الزمني للتحليل (مثال: الأسبوع الماضي، الشهر الماضي)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_profile",
      description: "جلب ملف تعريف تفصيلي لمستخدم معيّن: بياناته الشخصية، طلباته، مشاريعه، مدفوعاته، نشاطه الأخير. للمدراء وفريق المبيعات/الدعم.",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string", description: "معرّف المستخدم" },
          username: { type: "string", description: "اسم المستخدم (بديل عن userId)" },
          phone: { type: "string", description: "رقم الجوال (بديل عن userId)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_bulk_message",
      description: "إرسال رسالة جماعية بالبريد الإلكتروني لمجموعة من المستخدمين حسب الدور أو الفئة. للمدراء وفريق التسويق والمبيعات. استخدمها للإعلانات والعروض والتذكيرات الجماعية.",
      parameters: {
        type: "object",
        required: ["subject", "body", "targetRole"],
        properties: {
          targetRole: { type: "string", enum: ["client", "developer", "designer", "support", "sales", "all_employees", "all"], description: "الفئة المستهدفة" },
          subject: { type: "string", description: "عنوان الرسالة" },
          body: { type: "string", description: "نص الرسالة (HTML مسموح به)" },
          maxRecipients: { type: "number", description: "الحد الأقصى للمستلمين (افتراضي 50)" },
        },
      },
    },
  },
];

/* ─── Tool Executor ─── */
async function executeTool(name: string, args: any, userId?: string, userRole?: string, session?: Session): Promise<{ success: boolean; data?: any; error?: string; display?: any }> {
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

    /* ── generate_image ── */
    if (name === "generate_image") {
      const rawPrompt = String(args.prompt || "").trim();
      if (!rawPrompt) return { success: false, error: "وصف الصورة مطلوب" };

      // Build a high-quality English prompt — translate Arabic via AI if needed
      let englishPrompt = rawPrompt;
      const hasArabic = /[\u0600-\u06FF]/.test(rawPrompt);
      if (hasArabic) {
        try {
          const tr = await openai.chat.completions.create({
            model: AI_MODEL,
            messages: [{ role: "user", content: `Translate this image description to detailed English for AI image generation (output ONLY the English description, no explanation):\n${rawPrompt}` }],
            temperature: 0.3, max_tokens: 200,
          });
          const translated = tr.choices[0]?.message?.content?.trim();
          if (translated && translated.length > 5) englishPrompt = translated;
        } catch { /* use original */ }
      }

      // Style-specific quality boosters
      const styleMap: Record<string, string> = {
        realistic: "photorealistic, ultra detailed, 8k, studio lighting, sharp focus",
        cartoon: "cartoon style, vibrant colors, clean lines, digital art",
        "3d render": "3D render, octane render, ray tracing, high detail, cinematic lighting",
        watercolor: "watercolor painting, soft brushstrokes, artistic, beautiful colors",
        minimalist: "minimalist design, flat design, clean, simple, modern",
        cinematic: "cinematic photography, movie still, dramatic lighting, film grain",
        "logo design": "professional logo design, vector art, clean, scalable, modern branding",
        "ui mockup": "UI/UX design mockup, clean interface, modern app design, professional",
      };
      const styleKey = (args.style || "realistic").toLowerCase();
      const styleBoost = styleMap[styleKey] || "professional, high quality, detailed";
      const fullPrompt = `${englishPrompt}, ${styleBoost}`;
      const seed = Math.floor(Math.random() * 999999);
      const width = args.width || 1024;
      const height = args.height || 1024;
      const imageUrl = `/api/ai/image-proxy?prompt=${encodeURIComponent(fullPrompt)}&width=${width}&height=${height}&seed=${seed}&model=flux`;
      return {
        success: true,
        data: {
          imageUrl,
          prompt: fullPrompt,
          originalPrompt: rawPrompt,
          label: args.label || rawPrompt.substring(0, 60),
          style: args.style || "realistic",
          width, height,
        },
        display: { type: "generated_image" },
      };
    }

    /* ── generate_video ── */
    if (name === "generate_video") {
      const rawPrompt = String(args.prompt || "").trim();
      if (!rawPrompt) return { success: false, error: "وصف الفيديو مطلوب" };

      let englishPrompt = rawPrompt;
      const hasArabic = /[\u0600-\u06FF]/.test(rawPrompt);
      if (hasArabic) {
        try {
          const tr = await openai.chat.completions.create({
            model: AI_MODEL,
            messages: [{ role: "user", content: `Translate this video description to detailed English for AI video generation (output ONLY the English description):\n${rawPrompt}` }],
            temperature: 0.3, max_tokens: 200,
          });
          const translated = tr.choices[0]?.message?.content?.trim();
          if (translated && translated.length > 5) englishPrompt = translated;
        } catch { /* use original */ }
      }

      const duration = Math.min(8, Math.max(3, Number(args.duration) || 5));
      const width = args.width || 512;
      const height = args.height || 512;
      const seed = Math.floor(Math.random() * 999999);
      const fullPrompt = `${englishPrompt}, cinematic, high quality, smooth motion`;
      const videoUrl = `/api/ai/video-proxy?prompt=${encodeURIComponent(fullPrompt)}&width=${width}&height=${height}&duration=${duration}&seed=${seed}`;
      return {
        success: true,
        data: {
          videoUrl,
          prompt: fullPrompt,
          originalPrompt: rawPrompt,
          label: args.label || rawPrompt.substring(0, 60),
          duration, width, height,
        },
        display: { type: "generated_video" },
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

    /* ── get_face_biometrics ── */
    if (name === "get_face_biometrics") {
      if (!["admin", "manager"].includes(userRole || "")) return { success: false, error: "هذه الأداة للمدراء فقط" };
      const { FaceDescriptorModel, UserModel } = await import("./models");
      if (args.userId) {
        const profile = await FaceDescriptorModel.findOne({ userId: args.userId });
        const user = await UserModel.findById(args.userId).select("fullName username email role");
        return {
          success: true,
          data: {
            registered: !!profile,
            user: user ? { id: String(user._id), name: user.fullName || user.username, email: user.email, role: user.role } : null,
            anglesCount: profile?.descriptors?.length || 0,
            updatedAt: profile?.updatedAt || null,
          },
          display: { type: "face_biometric_user" },
        };
      } else {
        const allProfiles = await FaceDescriptorModel.find({}).select("userId updatedAt descriptors");
        const userIds = allProfiles.map(p => p.userId);
        const users = await UserModel.find({ _id: { $in: userIds } }).select("fullName username email role");
        const userMap: Record<string, any> = {};
        users.forEach(u => { userMap[String(u._id)] = u; });
        const list = allProfiles.map(p => {
          const u = userMap[p.userId];
          return {
            userId: p.userId,
            name: u?.fullName || u?.username || "مجهول",
            email: u?.email || "",
            role: u?.role || "",
            anglesCount: p.descriptors?.length || 0,
            updatedAt: p.updatedAt,
          };
        });
        return {
          success: true,
          data: { total: list.length, users: list },
          display: { type: "face_biometrics_list" },
        };
      }
    }

    /* ── delete_face_biometric ── */
    if (name === "delete_face_biometric") {
      if (!["admin", "manager"].includes(userRole || "")) return { success: false, error: "هذه الأداة للمدراء فقط" };
      const { FaceDescriptorModel, UserModel } = await import("./models");
      const profile = await FaceDescriptorModel.findOne({ userId: args.targetUserId });
      if (!profile) return { success: false, error: "لا يوجد سجل بصمة وجه لهذا المستخدم" };
      await FaceDescriptorModel.deleteOne({ userId: args.targetUserId });
      const user = await UserModel.findById(args.targetUserId).select("fullName username email");
      return {
        success: true,
        data: {
          deleted: true,
          userName: user?.fullName || user?.username || args.targetUserId,
        },
        display: { type: "face_biometric_deleted" },
      };
    }

    /* ── get_biometric_stats ── */
    if (name === "get_biometric_stats") {
      if (!["admin", "manager"].includes(userRole || "")) return { success: false, error: "هذه الأداة للمدراء فقط" };
      const { FaceDescriptorModel, UserModel } = await import("./models");
      const [faceCount, totalUsers, usersWithPin] = await Promise.all([
        FaceDescriptorModel.countDocuments(),
        UserModel.countDocuments({ role: { $ne: "admin" } }),
        UserModel.countDocuments({ quickPin: { $exists: true, $ne: null } }),
      ]);
      let webauthnCount = 0;
      try {
        const { PasskeyModel } = await import("./models");
        webauthnCount = await (PasskeyModel as any).countDocuments();
      } catch {}
      return {
        success: true,
        data: {
          faceRecognition: faceCount,
          webAuthn: webauthnCount,
          quickPin: usersWithPin,
          totalUsers,
        },
        display: { type: "biometric_stats" },
      };
    }

    /* ── escalate_to_human ── */
    if (name === "escalate_to_human") {
      const reason = String(args.reason || "لم يُحدَّد السبب").trim();
      const urgency: string = ["normal", "high", "critical"].includes(args.urgency) ? args.urgency : "normal";
      const urgencyLabel: Record<string, string> = { normal: "عادية", high: "عالية", critical: "حرجة" };
      const userName2 = session?.userName || userRole || userId || "مجهول";
      const historyText = (session?.history || [])
        .slice(-20)
        .map((m: any) => `[${m.role === "user" ? "المستخدم" : "الذكاء الاصطناعي"}]: ${m.content}`)
        .join("\n\n");
      const { sendDirectEmail } = await import("./email");
      await sendDirectEmail(
        "youssefd.business@gmail.com",
        "Youssef",
        `🚨 تصعيد محادثة — ${urgencyLabel[urgency]} — ${userName2}`,
        `تصعيد محادثة من الذكاء الاصطناعي\n\nالمستخدم: ${userName2}\nدور المستخدم: ${userRole || "guest"}\nدرجة الإلحاح: ${urgencyLabel[urgency]}\nالسبب: ${reason}\n\n── سجل المحادثة (آخر 20 رسالة) ──\n\n${historyText}`
      ).catch(() => {});
      return {
        success: true,
        data: { escalated: true, urgency, reason },
        display: { type: "action_success" },
      };
    }

    /* ── get_finance_report ── */
    if (name === "get_finance_report") {
      if (!isAdmin && userRole !== "accountant") return { success: false, error: "التقرير المالي متاح للمدراء والمحاسبين فقط" };
      const period = args.period || "month";
      const now = new Date();
      let startDate: Date;
      if (period === "today") startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      else if (period === "week") startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else if (period === "month") startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      else if (period === "quarter") startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      else startDate = new Date(now.getFullYear(), 0, 1);

      const prevStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));

      const [currentOrders, prevOrders, pendingPayment, walletUsers] = await Promise.all([
        OrderModel.find({ createdAt: { $gte: startDate }, status: { $in: ["active", "completed"] } }).select("totalPrice paymentAmount status service").lean(),
        OrderModel.find({ createdAt: { $gte: prevStart, $lt: startDate }, status: { $in: ["active", "completed"] } }).select("totalPrice paymentAmount").lean(),
        OrderModel.countDocuments({ status: "pending" }),
        UserModel.find({ walletBalance: { $gt: 0 } }).select("walletBalance fullName username").sort({ walletBalance: -1 }).limit(5).lean(),
      ]);

      const currentRevenue = currentOrders.reduce((s, o) => s + (Number(o.totalPrice) || Number(o.paymentAmount) || 0), 0);
      const prevRevenue = prevOrders.reduce((s, o) => s + (Number(o.totalPrice) || Number(o.paymentAmount) || 0), 0);
      const growth = prevRevenue > 0 ? (((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : null;
      const totalWalletBalance = walletUsers.reduce((s, u) => s + (u.walletBalance || 0), 0);

      return {
        success: true,
        data: {
          period,
          currentRevenue: Math.round(currentRevenue),
          prevRevenue: Math.round(prevRevenue),
          growth: growth ? `${growth}%` : "N/A",
          ordersCount: currentOrders.length,
          pendingPaymentOrders: pendingPayment,
          topWallets: walletUsers.map(u => ({ name: u.fullName || u.username, balance: u.walletBalance })),
          totalWalletBalance: Math.round(totalWalletBalance),
        },
        display: { type: "finance_report" },
      };
    }

    /* ── get_kanban_board ── */
    if (name === "get_kanban_board") {
      if (!isAdmin && !isEmployee) return { success: false, error: "لوحة Kanban للموظفين والمدراء فقط" };
      const { KanbanTaskModel } = await import("./models");
      const query: any = {};
      if (args.projectId) query.projectId = args.projectId;
      if (args.assignedTo) query.assignedTo = args.assignedTo;
      if (args.status && args.status !== "all") query.status = args.status;
      const limit = Math.min(args.limit || 20, 50);
      const tasks = await (KanbanTaskModel as any).find(query).sort({ priority: -1, createdAt: -1 }).limit(limit).lean();
      const grouped: Record<string, any[]> = { todo: [], in_progress: [], review: [], done: [] };
      for (const t of tasks) {
        const s = t.status || "todo";
        if (grouped[s]) grouped[s].push({ id: String(t._id), title: t.title, priority: t.priority, deadline: t.deadline, project: t.projectName || t.projectId });
        else grouped.todo.push({ id: String(t._id), title: t.title, priority: t.priority });
      }
      return {
        success: true,
        data: { total: tasks.length, grouped, tasks: tasks.map((t: any) => ({ id: String(t._id), title: t.title, status: t.status, priority: t.priority, deadline: t.deadline })) },
        display: { type: "kanban_board" },
      };
    }

    /* ── get_attendance_summary ── */
    if (name === "get_attendance_summary") {
      if (!isAdmin && !["hr", "supervisor", "manager"].includes(userRole || "")) return { success: false, error: "بيانات الحضور للمدراء والموارد البشرية فقط" };
      try {
        const { AttendanceModel } = await import("./models");
        const dateStr = args.date || new Date().toISOString().split("T")[0];
        const dayStart = new Date(dateStr + "T00:00:00.000Z");
        const dayEnd = new Date(dateStr + "T23:59:59.999Z");
        const records = await (AttendanceModel as any).find({ checkIn: { $gte: dayStart, $lte: dayEnd } })
          .populate("userId", "fullName username role").sort({ checkIn: 1 }).lean();
        const employees = await UserModel.find({ role: { $ne: "client" }, isActive: { $ne: false } }).select("fullName username role").lean();
        const checkedInIds = new Set(records.map((r: any) => String(r.userId?._id || r.userId)));
        const absent = employees.filter(e => !checkedInIds.has(String(e._id)));
        return {
          success: true,
          data: {
            date: dateStr,
            presentCount: records.length,
            absentCount: absent.length,
            totalEmployees: employees.length,
            records: records.slice(0, 15).map((r: any) => ({
              name: r.userId?.fullName || r.userId?.username || "موظف",
              role: r.userId?.role,
              checkIn: r.checkIn,
              checkOut: r.checkOut,
            })),
            absent: absent.slice(0, 10).map(e => ({ name: e.fullName || e.username, role: e.role })),
          },
          display: { type: "attendance_summary" },
        };
      } catch { return { success: false, error: "نظام الحضور غير متاح أو لا توجد بيانات حضور" }; }
    }

    /* ── generate_ai_insight ── */
    if (name === "generate_ai_insight") {
      if (!isAdmin) return { success: false, error: "تقارير الذكاء الاصطناعي للمدراء فقط" };
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const [totalClients, totalOrders, activeOrders, completedOrders, pendingOrders,
             monthOrders, prevMonthOrders, newClientsMonth] = await Promise.all([
        UserModel.countDocuments({ role: "client" }),
        OrderModel.countDocuments({}),
        OrderModel.countDocuments({ status: "active" }),
        OrderModel.countDocuments({ status: "completed" }),
        OrderModel.countDocuments({ status: "pending" }),
        OrderModel.find({ createdAt: { $gte: monthStart } }).select("totalPrice paymentAmount status").lean(),
        OrderModel.find({ createdAt: { $gte: prevMonthStart, $lt: monthStart } }).select("totalPrice paymentAmount").lean(),
        UserModel.countDocuments({ role: "client", createdAt: { $gte: monthStart } }),
      ]);
      const monthRev = monthOrders.reduce((s: number, o: any) => s + (Number(o.totalPrice) || 0), 0);
      const prevRev = prevMonthOrders.reduce((s: number, o: any) => s + (Number(o.totalPrice) || 0), 0);
      const growth = prevRev > 0 ? (((monthRev - prevRev) / prevRev) * 100).toFixed(1) : "N/A";
      const conversionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : "0";

      const analysisPrompt = `أنت محلل أعمال خبير. قدّم تحليلاً عميقاً ومفيداً وعملياً (${args.topic}) لشركة تقنية سعودية.

البيانات الحقيقية:
- العملاء: ${totalClients} (جدد هذا الشهر: ${newClientsMonth})
- الطلبات: ${totalOrders} إجمالي | ${activeOrders} نشط | ${completedOrders} مكتمل | ${pendingOrders} معلّق
- إيراد هذا الشهر: ${Math.round(monthRev).toLocaleString()} ريال
- إيراد الشهر السابق: ${Math.round(prevRev).toLocaleString()} ريال  
- نسبة النمو: ${growth}%
- معدّل التحويل: ${conversionRate}%
${args.timeframe ? `- الإطار الزمني المطلوب: ${args.timeframe}` : ""}

قدّم:
1. **ملخص الوضع الحالي** (3 نقاط مع أرقام)
2. **نقاط القوة** (2-3 نقاط)
3. **نقاط تحتاج تحسيناً** (2-3 نقاط مع حلول)
4. **توصيات عملية للأسبوع القادم** (3-5 إجراءات محددة)
${args.topic === "sales_forecast" ? "5. **توقع إيرادات الشهر القادم** مع المبررات" : ""}

كن صريحاً ومفيداً. استخدم الأرقام الحقيقية. اكتب بالعربية.`;

      const insightResp = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.4,
        max_tokens: 1500,
      });
      const insight = insightResp.choices[0]?.message?.content || "لم أتمكن من توليد التحليل";
      return {
        success: true,
        data: { topic: args.topic, insight, rawData: { totalClients, totalOrders, activeOrders, completedOrders, monthRev: Math.round(monthRev), growth } },
        display: { type: "ai_insight" },
      };
    }

    /* ── get_user_profile ── */
    if (name === "get_user_profile") {
      if (!isAdmin && !isEmployee) return { success: false, error: "ملفات المستخدمين للموظفين والمدراء فقط" };
      let user: any = null;
      if (args.userId) user = await UserModel.findById(args.userId).select("-password -sessionTokens").lean();
      else if (args.username) user = await UserModel.findOne({ $or: [{ username: args.username }, { email: args.username }] }).select("-password").lean();
      else if (args.phone) user = await UserModel.findOne({ phone: args.phone }).select("-password").lean();
      if (!user) return { success: false, error: "المستخدم غير موجود" };
      const uid = String(user._id);
      const [orders, projects] = await Promise.all([
        OrderModel.find({ userId: uid }).sort({ createdAt: -1 }).limit(5).select("status totalPrice paymentAmount service createdAt").lean(),
        ProjectModel.find({ $or: [{ clientId: uid }] }).limit(3).select("name status progress").lean(),
      ]);
      return {
        success: true,
        data: {
          id: uid,
          name: user.fullName || user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          wallet: user.walletBalance || 0,
          joinedAt: user.createdAt,
          isActive: user.isActive !== false,
          ordersCount: orders.length,
          orders: orders.map(o => ({ status: o.status, amount: o.totalPrice || o.paymentAmount || 0, service: (o.service as any)?.nameAr || "خدمة", date: o.createdAt })),
          projects: projects.map(p => ({ name: p.name, status: p.status, progress: p.progress || 0 })),
        },
        display: { type: "user_profile" },
      };
    }

    /* ── send_bulk_message ── */
    if (name === "send_bulk_message") {
      if (!isAdmin && !["sales_manager", "marketing"].includes(userRole || "")) return { success: false, error: "الرسائل الجماعية للمدراء وفريق التسويق فقط" };
      const targetRole = args.targetRole || "client";
      const maxRec = Math.min(args.maxRecipients || 50, 100);
      let query: any = { email: { $exists: true, $ne: "" } };
      if (targetRole === "all_employees") query.role = { $ne: "client" };
      else if (targetRole !== "all") query.role = targetRole;
      const targets = await UserModel.find(query).select("email fullName username").limit(maxRec).lean();
      const validTargets = targets.filter((t: any) => t.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.email));
      let sent = 0;
      for (const t of validTargets.slice(0, maxRec)) {
        try {
          await sendDirectEmail(t.email, t.fullName || t.username || "", args.subject, args.body);
          sent++;
        } catch {}
      }
      return {
        success: true,
        data: { sent, total: validTargets.length, targetRole, subject: args.subject },
        display: { type: "action_success" },
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
  const role = userRole || "guest";

  // ═══════════════════════════════════════════════════════════
  //  ROLE CAPABILITIES — what each role is ALLOWED to do
  // ═══════════════════════════════════════════════════════════
  const roleCapabilities: Record<string, string> = {
    admin:         "صلاحية مطلقة: كل عمليات النظام بدون استثناء — بيانات، تحليلات، موظفين، أرباح، إعدادات، إشعارات، مستندات رسمية، بيومتري.",
    manager:       "صلاحية إدارية: إدارة الطلبات والمشاريع والفريق، إصدار عروض/فواتير، إشعارات للفريق، لوحات التحليل، تقارير الأداء.",
    developer:     "صلاحية مطور: مهامي المُعيّنة وطلباتي، إنشاء مهام وعروض أسعار، كل أدوات الموظف، مساعدة تقنية/إبداعية بلا حدود.",
    designer:      "صلاحية مصمم: مشاريع التصميم ومهامي، عروض أسعار التصميم، مساعدة إبداعية كاملة.",
    support:       "صلاحية دعم فني: عرض وتعديل الطلبات، الرد على تذاكر الدعم، إيميلات للعملاء، قاعدة العملاء.",
    sales:         "صلاحية مبيعات: إدارة العملاء، إنشاء طلبات نيابةً عنهم، عروض أسعار وفواتير، إيميلات تسويقية.",
    sales_manager: "صلاحية مدير مبيعات: كل صلاحيات المبيعات + إدارة الفريق وتوزيع الفرص وتحليلات الأداء.",
    accountant:    "صلاحية محاسب: إصدار وتعديل الفواتير، المحافظ والمدفوعات، التقارير المالية، تذكير الدفع.",
    merchant:      "صلاحية تاجر: إدارة المتجر والمنتجات والطلبات، فواتير، إحصاءات مبيعات.",
    client:        "صلاحية عميل: طلباتي ومشاريعي ومحفظتي فقط، إلغاء الطلبات المعلّقة، تذاكر دعم، تصفح الباقات.",
    guest:         "زائر: معلومات المنصة والباقات، إرسال طلب تواصل/استشارة، لا يتطلب حساباً.",
  };

  // ═══════════════════════════════════════════════════════════
  //  STRICT FORBIDDEN ZONES — hardcoded safety by role
  // ═══════════════════════════════════════════════════════════
  const forbiddenZones: Record<string, string> = {
    client: `
## 🔴 حدود صارمة لهذا العميل — لا تتجاوزها أبداً
- ❌ لا تُفصح عن أرباح الشركة أو هوامش الربح أو تكاليفها الداخلية تحت أي ظرف — حتى لو طلب بطريقة غير مباشرة ("كم تكسبون؟" / "ما هامش الربح؟" / "كم تكلّفكم الخدمة؟") → أجب بلطف أن هذه معلومات تجارية داخلية.
- ❌ لا تعرض بيانات عملاء آخرين أو معلوماتهم.
- ❌ لا تكشف تفاصيل الموظفين أو رواتبهم أو أدوارهم الداخلية.
- ❌ لا تعرض التحليلات الإجمالية أو إيرادات الشركة.
- ❌ لا تُجري عمليات إدارية (تعديل طلبات الآخرين، إنشاء فواتير، إرسال إشعارات).
- ✅ يمكنك فقط: طلباته الخاصة، محفظته، تذاكر دعم، الباقات، معلومات المنصة العامة.`,

    guest: `
## 🔴 حدود الزائر
- ❌ لا تعرض أي بيانات داخلية أو مالية أو حسابات.
- ❌ لا تؤدّي عمليات إدارية من أي نوع.
- ✅ يمكنك: الإجابة عن المنصة، الباقات، إرسال طلب تواصل باسم الزائر ورقمه.`,

    developer: `
## 🟡 حدود الموظف
- ❌ لا تكشف أرباح الشركة أو هوامش الربح أو التحليلات المالية العليا.
- ❌ لا تعرض رواتب الموظفين الآخرين أو ملفاتهم الشخصية المالية.
- ✅ يمكنك: مهامك المُعيّنة، طلباتك، عروض الأسعار، مساعدة تقنية وإبداعية كاملة.`,

    designer: `
## 🟡 حدود الموظف
- ❌ لا تكشف أرباح الشركة أو هوامش الربح أو التحليلات المالية العليا.
- ❌ لا تعرض رواتب الموظفين الآخرين.
- ✅ يمكنك: مهامك المُعيّنة، مشاريع التصميم، عروض الأسعار، مساعدة إبداعية كاملة.`,

    support: `
## 🟡 حدود الموظف
- ❌ لا تكشف أرباح الشركة أو هوامش الربح.
- ❌ لا تعرض رواتب الموظفين الآخرين.
- ✅ يمكنك: الطلبات، تذاكر الدعم، إيميلات للعملاء.`,

    sales: `
## 🟡 حدود الموظف
- ❌ لا تكشف أرباح الشركة أو هوامش الربح.
- ✅ يمكنك: العملاء، الطلبات، عروض الأسعار، إيميلات المبيعات.`,
  };

  const forbidden = forbiddenZones[role] || "";

  // ═══════════════════════════════════════════════════════════
  //  PERSONALITY — tone and style per role
  // ═══════════════════════════════════════════════════════════
  const personality: Record<string, string> = {
    admin: "أنت مساعد تنفيذي ذكي: مباشر، دقيق، بيانات أولاً. لا مقدمات غير ضرورية.",
    manager: "أنت مستشار إداري محترف: موجز، داعم للقرار، مبادر باقتراح الخطوات التالية.",
    developer: "أنت مساعد تقني/إبداعي خارق: تقني، دافئ مع الزملاء، تكتب الكود مباشرة، تشرح بوضوح، تبادر بأفكار.",
    designer: "أنت مساعد إبداعي: حماسي للتصميم، تقترح ألواناً وخطوطاً وأفكاراً بالتفصيل، تُلهم ولا تُحبط.",
    support: "أنت موظف دعم محترف: هادئ، صبور، حلاّل مشكلات، تُنجز الطلبات بسرعة.",
    sales: "أنت موظف مبيعات نشيط: متحمس، مُقنع، تُلاحق الفرص، تُغلق الصفقات بأسلوب ذكي.",
    sales_manager: "أنت مدير مبيعات: استراتيجي، يُحرّك الفريق، يرى الفرص في الأرقام.",
    accountant: "أنت محاسب دقيق: صحيح الأرقام، منظّم، يُذكّر بالاستحقاقات، يحمي المال.",
    merchant: "أنت تاجر نشيط: تُدير المخزون بذكاء، تُحرّك المبيعات، تخدم العملاء بسرعة.",
    client: "أنت موظف خدمة عملاء دافئ ومحترف: تُرحّب، تُطمئن، تُسهّل، تُسعد. لا تجعل العميل يشعر بالتعقيد أبداً.",
    guest: "أنت واجهة ترحيبية جذابة: تُعرّف بالمنصة بأسلوب لطيف ومُقنع، تُشجّع على التواصل والتسجيل.",
  };

  return `أنت **QIROX AI** — المساعد الذكي الرسمي لمنصة QIROX Studio.

## هويتك الثابتة
- الاسم: QIROX AI
- الشخصية: ${personality[role] || personality.guest}
- اليوم: ${dateStr} | الوقت: ${timeStr}
- المستخدم: **${userName || "الزائر"}** | الدور: ${role}
- صلاحياتك: ${roleCapabilities[role] || roleCapabilities.guest}
${forbidden}

## 🌐 تكيّف اللغة واللهجة — هذا الأهم
**⛔ قاعدة مطلقة لا استثناء فيها: لا ترد أبداً بالصينية أو اليابانية أو أي لغة غير عربية/إنجليزية. إذا وجدت نفسك تكتب أحرفاً صينية أو يابانية — أوقف فوراً وأعد بالعربية.**

أنت تكشف لغة المستخدم ولهجته من أول رسالة وتُطابقها تماماً طوال المحادثة:
- **خليجي (سعودي/إماراتي/كويتي...)**: تكلم بلهجته — "وش تبي؟ / زين / ولا بأس / كيف أقدر أساعدك؟"
- **مصري**: "إيه اللي تعمله؟ / تمام / خلاص / مفيش مشكلة"
- **شامي (لبناني/سوري/...)**: "شو بدك؟ / تمام / ماشي / كيفك؟"
- **إنجليزي**: respond entirely in English, casual and professional
- **عربي فصحى/رسمي**: ردّ بفصحى راقية
- **لهجة ممزوجة**: امزج بنفس النسبة التي يستخدمها
- **قاعدة ذهبية**: لا تُغيّر اللهجة بعد تحديدها إلا إذا غيّرها المستخدم أولاً.

## قدراتك الفعلية في النظام
أنت عامل ذكي يُنفّذ عمليات حقيقية — لست مجرد محادثة:

### التنقّل والمعاينة (مهم جداً)
- **navigate_to**: عند "افتح/وديني/خذني/روح لـ..." → شغّل الأداة فوراً وستفتح الصفحة تلقائياً.
- **show_page_preview**: عند "وريني/أرني/كيف تبدو صفحة..." → عرض iframe حي داخل الشات.
- **list_navigable_pages**: عند الشك في المسار → استخدمها أولاً.
- **كن استباقياً**: اقترح navigate_to دائماً مع كل خطوة تحتاج صفحة معينة.

### البيانات والعمليات
- 📋 قراءة: الطلبات، العملاء، الموظفون، المشاريع، التحليلات، المحفظة
- ✏️ تعديل: حالات الطلبات، إنشاء المهام
- 📩 إرسال: **إيميل فعلي** عبر QIROX (send_email)، إشعارات (للمدراء)، تذاكر دعم
- 📄 مستندات رسمية: عروض أسعار (create_quotation)، فواتير (create_invoice)، طلبات (create_order)
- 🔳 QR Code من أي رابط (generate_qr_code) — اقترحه بعد كل فاتورة أو عرض سعر
- 🎨 توليد صور بالذكاء الاصطناعي (generate_image) — يترجم الوصف تلقائياً للإنجليزية ويُنتج صوراً عالية الجودة
- 🎬 توليد فيديو قصير (generate_video) — مقاطع متحركة للتسويق والمحتوى
- 🔍 بحث في الإنترنت (search_web)
- 🆘 تصعيد للبشر (escalate_to_human) — عند "أريد موظف حقيقي" أو شكوى جدية

### للزوار فقط
إذا طلب زائر التواصل: اجمع اسمه + هاتفه + موضوعه ثم استخدم submit_consultation_request مباشرة. لا تطلب منه تسجيل الدخول.

## قواعد ذهبية
1. **استخدم الأداة المناسبة فوراً** — لا تسأل كثيراً.
2. **لا تختلق بيانات** — إن لم تجد، قل ذلك بوضوح.
3. **أكّد العمليات التدميرية** (إلغاء طلبات) قبل التنفيذ.
4. **اعرض النتائج بوضوح ومختصراً** — استخدم نقاط ورموز.
5. **اجمع الأدوات** — مثال: بعد عرض السعر، ولّد QR له، ثم اقترح navigate_to لصفحة عروض الأسعار.
6. **للموظفين**: أنت مساعد إبداعي خارق — كود، إيميلات، تقارير، أفكار، ترجمة، أي شيء يطلبونه.

## معلومات المنصة
QIROX Studio — شركة تقنية سعودية | 2024 | الرياض | معتمدة ZATCA + CITC

### الباقات (بالريال السعودي)
| الباقة | 6 أشهر | مدى الحياة | التسليم |
|--------|---------|-----------|---------|
| لايت | 699+ | 5,299+ | 3 أيام – أسبوع |
| برو | 1,249+ | 9,299+ | أسبوع – أسبوعان |
| إنفينيت | 1,699+ | 17,299+ | حسب المشروع |

نعمل مع أي ميزانية. طرق الدفع: Qirox Pay، تحويل بنكي، PayPal، اتصالات كاش (مصر)، تقسيط.
${systemData ? `\n## بيانات النظام\n${JSON.stringify(systemData)}` : ""}`;
}

/* ─── Employee Context Builder ─── */
async function buildEmployeeContext(userId: string, userRole: string): Promise<string> {
  const EMPLOYEE_ROLES = ["developer","designer","support","sales","sales_manager","accountant","merchant","manager","hr","supervisor","qa","devops","content","seo","marketing"];
  if (!userId || !EMPLOYEE_ROLES.includes(userRole)) return "";
  try {
    const { KanbanTaskModel, OrderModel, UserModel } = await import("./models");
    const [tasks, assignedOrders, userDoc] = await Promise.all([
      (KanbanTaskModel as any).find({ assignedTo: userId }).select("title status priority projectName deadline").sort({ createdAt: -1 }).limit(10).lean(),
      OrderModel.find({ assignedEmployee: userId }).select("businessName serviceType status createdAt").sort({ createdAt: -1 }).limit(5).lean(),
      UserModel.findById(userId).select("fullName jobTitle department phone createdAt").lean(),
    ]);

    const taskLines = tasks.length > 0
      ? tasks.map((t: any) => `  - ${t.title} [${t.status}]${t.priority ? ` (${t.priority})` : ""}${t.deadline ? ` | موعد: ${new Date(t.deadline).toLocaleDateString("ar-SA")}` : ""}`).join("\n")
      : "  (لا توجد مهام مُعيّنة حالياً)";

    const orderLines = assignedOrders.length > 0
      ? assignedOrders.map((o: any) => `  - ${o.businessName || o.serviceType || "طلب"} [${o.status}]`).join("\n")
      : "  (لا توجد طلبات مُسنَدة حالياً)";

    const profileLine = userDoc
      ? `الاسم: ${(userDoc as any).fullName || "—"} | اللقب: ${(userDoc as any).jobTitle || userRole} | القسم: ${(userDoc as any).department || "—"}`
      : "";

    return `\n\n## بياناتك الشخصية في النظام
${profileLine}
📋 مهامك المُعيّنة:
${taskLines}

📦 الطلبات المُسنَدة إليك:
${orderLines}

استخدم هذا السياق عند الإجابة على الموظف — ناديه باسمه الأول إن عرفته، وكن على علم بأحواله الحالية في النظام.`;
  } catch { return ""; }
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
    // Build per-employee context (only for employee roles)
    const employeeCtx = userId ? await buildEmployeeContext(userId, userRole) : "";

    /* ── Round 1: AI decides which tools to call ── */
    const messages: any[] = [
      { role: "system", content: buildSystemPrompt(userRole, userName) + employeeCtx },
      ...session.history.slice(-20),
    ];

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages,
      tools: QIROX_TOOLS,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 4096,
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
          const result = await executeTool(tc.function.name, args, userId, userRole, session);
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
        temperature: 0.7,
        max_tokens: 4096,
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
        content: `أنت خبير تقدير مشاريع تقنية في QIROX Studio. الباقات: لايت (تبدأ من 699 ريال، 3 أيام–أسبوع)، برو (تبدأ من 1249 ريال، أسبوع–أسبوعين)، إنفينيت (تبدأ من 1699 ريال، حسب المشروع). نعمل مع أي ميزانية.
أعطِ تقديراً دقيقاً وإجابتك يجب أن تكون JSON فقط بالصيغة التالية (لا تضع أي نص خارج الـ JSON):
{"minPrice":699,"maxPrice":5000,"duration":"3 أيام – أسبوع","package":"lite","team":{"developer":1,"designer":1,"pm":0,"devops":0},"breakdown":{"design":"30%","frontend":"40%","backend":"20%","testing":"10%"},"complexity":"low|medium|high","confidence":85,"notes":"ملاحظة مختصرة عن أبرز متطلبات المشروع"}`
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

const PACKAGE_FINDER_SYSTEM = `أنت **مستشار باقات QIROX Studio** — متخصص في مساعدة العملاء على اختيار الباقة الأنسب لميزانيتهم ومشروعهم.

== مبدأ أساسي ==
نعمل مع أي ميزانية حتى لو 100 ريال. لا ترفض أي عميل بسبب الميزانية — دائماً ابحث عن حل مناسب.

== الباقات المتاحة ==
1. **باقة لايت** (تبدأ من 699 ريال | تسليم 3 أيام – أسبوع)
   - موقع إلكتروني احترافي + لوحة تحكم + نظام طلبات + إدارة المنتجات + دعم فني
   - مثالية لـ: المطاعم الصغيرة، المتاجر الناشئة، الأفراد والمستقلين، المشاريع البسيطة
   - لا تشمل: تطبيق جوال، ذكاء اصطناعي متقدم، دفع إلكتروني متكامل

2. **باقة برو** (تبدأ من 1,249 ريال | تسليم أسبوع – أسبوعين)
   - كل ميزات لايت + تطبيق جوال (iOS & Android) + بوابة دفع + CRM + تقارير متقدمة + ذكاء اصطناعي
   - مثالية لـ: المطاعم المتوسطة، المتاجر الإلكترونية، شركات الخدمات، المنصات التعليمية

3. **باقة إنفينيت** (تبدأ من 1,699 ريال | حسب المشروع)
   - تخصيص كامل بلا حدود + خادم مخصص + API غير محدودة + دعم مخصص 24/7
   - مثالية لـ: السلاسل الكبيرة، الشركات المؤسسية، منصات SaaS، المشاريع الحكومية

4. **ميزانية محدودة؟** إذا كانت الميزانية أقل من 699 ريال — اقترح البدء بخطة أساسية أو استشارة مجانية، وأخبر العميل أننا نجد دائماً حلاً ملائماً.

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

/* ─── QI AGENT — Code-Aware Agentic Intelligence ─── */
const QI_AGENT_SESSIONS: Map<string, any[]> = new Map();

const SAFE_DIRS = ["client/src", "server", "shared", "client/public"];

function safeReadFile(filePath: string): { ok: boolean; content?: string; error?: string } {
  try {
    const normalized = path.normalize(filePath).replace(/^\/+/, "");
    const isSafe = SAFE_DIRS.some(d => normalized.startsWith(d));
    if (!isSafe) return { ok: false, error: `Access denied. Allowed directories: ${SAFE_DIRS.join(", ")}` };
    const abs = path.join(process.cwd(), normalized);
    if (!fs.existsSync(abs)) return { ok: false, error: `File not found: ${normalized}` };
    const stat = fs.statSync(abs);
    if (stat.size > 200_000) return { ok: false, error: "File too large (>200KB). Try reading a specific section." };
    const content = fs.readFileSync(abs, "utf-8");
    return { ok: true, content };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

function safeListDir(dirPath: string): { ok: boolean; files?: string[]; error?: string } {
  try {
    const normalized = path.normalize(dirPath).replace(/^\/+/, "");
    const isSafe = SAFE_DIRS.some(d => normalized.startsWith(d)) || normalized === "." || normalized === "";
    if (!isSafe) return { ok: false, error: `Access denied.` };
    const abs = path.join(process.cwd(), normalized);
    if (!fs.existsSync(abs)) return { ok: false, error: `Directory not found: ${normalized}` };
    const entries = fs.readdirSync(abs, { withFileTypes: true });
    const files = entries.map(e => (e.isDirectory() ? `📁 ${e.name}/` : `📄 ${e.name}`));
    return { ok: true, files };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

function searchCodebase(pattern: string, dirPath = "."): { ok: boolean; results?: string[]; error?: string } {
  try {
    const normalized = path.normalize(dirPath).replace(/^\/+/, "");
    const abs = path.join(process.cwd(), normalized || ".");
    const results: string[] = [];
    const regex = new RegExp(pattern, "gi");
    function walk(d: string, depth = 0) {
      if (depth > 6 || results.length >= 30) return;
      const skip = ["node_modules", ".git", "dist", "build", ".local"];
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const e of entries) {
        if (skip.includes(e.name)) continue;
        const full = path.join(d, e.name);
        if (e.isDirectory()) { walk(full, depth + 1); continue; }
        if (!/\.(ts|tsx|js|jsx|json|md|css)$/.test(e.name)) continue;
        try {
          const content = fs.readFileSync(full, "utf-8");
          const lines = content.split("\n");
          lines.forEach((line, i) => {
            if (regex.test(line) && results.length < 30) {
              const rel = path.relative(process.cwd(), full);
              results.push(`${rel}:${i + 1}: ${line.trim().slice(0, 120)}`);
            }
          });
        } catch {}
      }
    }
    walk(abs);
    return { ok: true, results };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

const QI_AGENT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "read_file",
      description: "Read the contents of a source code file. Allowed directories: client/src, server, shared, client/public",
      parameters: {
        type: "object",
        properties: {
          file_path: { type: "string", description: "Relative path to the file, e.g. server/ai.ts or client/src/App.tsx" }
        },
        required: ["file_path"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "write_file",
      description: "Write or overwrite a file in the codebase. Use to create new files or edit existing ones. Allowed: client/src, server, shared, client/public.",
      parameters: {
        type: "object",
        properties: {
          file_path: { type: "string", description: "Relative path to the file to write, e.g. server/utils/helper.ts" },
          content: { type: "string", description: "Full content to write to the file" }
        },
        required: ["file_path", "content"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "list_directory",
      description: "List all files and folders in a directory",
      parameters: {
        type: "object",
        properties: {
          dir_path: { type: "string", description: "Relative path to the directory, e.g. server or client/src/pages" }
        },
        required: ["dir_path"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "search_code",
      description: "Search for a pattern (regex) across the entire codebase and get matching lines with file paths",
      parameters: {
        type: "object",
        properties: {
          pattern: { type: "string", description: "Regex pattern to search for" },
          dir_path: { type: "string", description: "Directory to search in (default: root)" }
        },
        required: ["pattern"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_system_stats",
      description: "Get live system statistics: orders count, clients count, employees count, projects count, revenue stats",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_db_data",
      description: "Query the MongoDB database to get real data from any collection: orders, employees, clients, projects, templates, pricing",
      parameters: {
        type: "object",
        properties: {
          collection: { type: "string", description: "Collection name: orders | employees | clients | projects | templates | pricing | notifications | invoices | tasks | tickets" },
          filter: { type: "object", description: "MongoDB filter object, e.g. {status: 'active'} or {} for all. Optional." },
          limit: { type: "number", description: "Maximum number of records to return (default 20, max 100)" },
          fields: { type: "string", description: "Comma-separated field names to include, e.g. 'fullName,email,role'" }
        },
        required: ["collection"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "run_js",
      description: "Execute a JavaScript/Node.js code snippet and return the result. Use for calculations, data transformations, generating dynamic content, or testing logic.",
      parameters: {
        type: "object",
        properties: {
          code: { type: "string", description: "JavaScript code to execute. Use console.log() to output results. Has access to: Math, Date, JSON, Array, Object, String, Number, etc." }
        },
        required: ["code"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "generate_multiple_images",
      description: "Generate multiple image variations at once (2-4 images) with different styles or prompts",
      parameters: {
        type: "object",
        properties: {
          prompts: {
            type: "array",
            description: "Array of image prompts, each with prompt and optional style",
            items: {
              type: "object",
              properties: {
                prompt: { type: "string" },
                style: { type: "string" },
                label: { type: "string", description: "Label to show under the image" }
              },
              required: ["prompt"]
            }
          }
        },
        required: ["prompts"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "analyze_data",
      description: "Analyze system data and produce a structured report with insights, charts data, and recommendations",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", description: "What to analyze: revenue | orders | employees | clients | performance | all" }
        },
        required: ["topic"]
      }
    }
  }
];

function safeWriteFile(filePath: string, content: string): { ok: boolean; error?: string } {
  try {
    const normalized = path.normalize(filePath).replace(/^\/+/, "");
    const isSafe = SAFE_DIRS.some(d => normalized.startsWith(d));
    if (!isSafe) return { ok: false, error: `Access denied. Allowed directories: ${SAFE_DIRS.join(", ")}` };
    const abs = path.join(process.cwd(), normalized);
    const dir = path.dirname(abs);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(abs, content, "utf-8");
    return { ok: true };
  } catch (e: any) { return { ok: false, error: e.message }; }
}

async function executeQiTool(toolName: string, args: any): Promise<{ result: any; artifacts?: any[] }> {
  switch (toolName) {
    case "read_file": {
      const r = safeReadFile(args.file_path);
      if (!r.ok) return { result: `❌ ${r.error}` };
      const lines = (r.content || "").split("\n").length;
      return { result: `✅ File: ${args.file_path} (${lines} lines)\n\`\`\`\n${r.content}\n\`\`\`` };
    }
    case "write_file": {
      const r = safeWriteFile(args.file_path, args.content);
      if (!r.ok) return { result: `❌ ${r.error}` };
      const lines = args.content.split("\n").length;
      return { result: `✅ Written: ${args.file_path} (${lines} lines)` };
    }
    case "list_directory": {
      const r = safeListDir(args.dir_path);
      if (!r.ok) return { result: `❌ ${r.error}` };
      return { result: `📁 ${args.dir_path}:\n${r.files?.join("\n")}` };
    }
    case "search_code": {
      const r = searchCodebase(args.pattern, args.dir_path);
      if (!r.ok) return { result: `❌ ${r.error}` };
      if (!r.results?.length) return { result: `No matches found for: ${args.pattern}` };
      return { result: `Found ${r.results.length} matches:\n${r.results.map(l => `• ${l}`).join("\n")}` };
    }
    case "get_system_stats": {
      try {
        const { OrderModel, UserModel, ProjectModel } = await import("./models");
        const [totalOrders, activeOrders, totalClients, totalEmployees, totalProjects, revenueResult] = await Promise.all([
          OrderModel.countDocuments({}),
          OrderModel.countDocuments({ status: { $in: ["active", "in_progress", "pending"] } }),
          UserModel.countDocuments({ role: "client" }),
          UserModel.countDocuments({ role: { $ne: "client" } }),
          ProjectModel.countDocuments({}),
          OrderModel.aggregate([{ $group: { _id: null, total: { $sum: "$totalPrice" } } }]),
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;
        return { result: JSON.stringify({
          orders: { total: totalOrders, active: activeOrders },
          clients: totalClients,
          employees: totalEmployees,
          projects: totalProjects,
          revenue: { total: totalRevenue, currency: "SAR" }
        }, null, 2) };
      } catch (e: any) { return { result: `Stats error: ${e.message}` }; }
    }
    case "get_db_data": {
      try {
        const { OrderModel, UserModel, ProjectModel, SectorTemplateModel, PricingPlanModel, NotificationModel, InvoiceModel, TaskModel, SupportTicketModel } = await import("./models");
        const modelMap: Record<string, any> = {
          orders: OrderModel,
          employees: UserModel,
          clients: UserModel,
          projects: ProjectModel,
          templates: SectorTemplateModel,
          pricing: PricingPlanModel,
          notifications: NotificationModel,
          invoices: InvoiceModel,
          tasks: TaskModel,
          tickets: SupportTicketModel,
        };
        const model = modelMap[args.collection];
        if (!model) return { result: `❌ Unknown collection: ${args.collection}. Available: ${Object.keys(modelMap).join(", ")}` };
        const lim = Math.min(args.limit || 20, 100);
        let filter = args.filter || {};
        if (args.collection === "employees") filter = { ...filter, role: { $ne: "client" } };
        if (args.collection === "clients") filter = { ...filter, role: "client" };
        const selectFields = args.fields ? args.fields.split(",").map((f: string) => f.trim()).join(" ") : undefined;
        let query = model.find(filter).limit(lim);
        if (selectFields) query = query.select(selectFields);
        const docs = await query.lean();
        return { result: `✅ ${docs.length} records from ${args.collection}:\n${JSON.stringify(docs, null, 2)}` };
      } catch (e: any) { return { result: `❌ DB error: ${e.message}` }; }
    }
    case "run_js": {
      try {
        const logs: string[] = [];
        const sandbox = {
          console: { log: (...a: any[]) => logs.push(a.map(String).join(" ")), error: (...a: any[]) => logs.push("[ERR] " + a.map(String).join(" ")), warn: (...a: any[]) => logs.push("[WARN] " + a.map(String).join(" ")) },
          Math, Date, JSON, Array, Object, String, Number, Boolean, parseInt, parseFloat, isNaN, isFinite,
        };
        const fn = new Function(...Object.keys(sandbox), args.code);
        const returnVal = fn(...Object.values(sandbox));
        const output = logs.join("\n");
        const ret = returnVal !== undefined ? `\nReturn value: ${JSON.stringify(returnVal, null, 2)}` : "";
        return { result: `✅ Executed:\n${output}${ret}` || "✅ No output" };
      } catch (e: any) { return { result: `❌ JS Error: ${e.message}` }; }
    }
    case "generate_image": {
      const styleStr = args.style ? `, ${args.style} style` : "";
      const w = args.width || 1024;
      const h = args.height || 1024;
      const fullPrompt = `${args.prompt}${styleStr}, high quality, professional, ultra detailed`;
      const seed = Math.floor(Math.random() * 999999);
      const url = `/api/ai/image-proxy?prompt=${encodeURIComponent(fullPrompt)}&width=${w}&height=${h}&seed=${seed}`;
      return {
        result: `✅ Image generated (${w}x${h}): ${url}`,
        artifacts: [{ type: "generated_image", data: { imageUrl: url, label: args.prompt, width: w, height: h } }]
      };
    }
    case "generate_multiple_images": {
      const prompts: any[] = args.prompts || [];
      if (!prompts.length) return { result: "❌ No prompts provided" };
      const artifacts: any[] = [];
      for (const p of prompts.slice(0, 4)) {
        const styleStr = p.style ? `, ${p.style} style` : "";
        const fullPrompt = `${p.prompt}${styleStr}, high quality, professional, ultra detailed`;
        const seed = Math.floor(Math.random() * 999999);
        const url = `/api/ai/image-proxy?prompt=${encodeURIComponent(fullPrompt)}&seed=${seed}`;
        artifacts.push({ type: "generated_image", data: { imageUrl: url, label: p.label || p.prompt } });
      }
      return { result: `✅ Generated ${artifacts.length} images`, artifacts };
    }
    case "search_web": {
      try {
        const apiKey = process.env.SERPER_API_KEY;
        if (!apiKey) return { result: "Web search not available (no SERPER_API_KEY)" };
        const r = await axios.post("https://google.serper.dev/search", { q: args.query, num: 6 }, { headers: { "X-API-KEY": apiKey } });
        const results = r.data.organic?.slice(0, 6).map((i: any) => `• **${i.title}**\n  ${i.snippet}\n  🔗 ${i.link}`).join("\n\n");
        const answer = r.data.answerBox?.answer ? `📌 Direct Answer: ${r.data.answerBox.answer}\n\n` : "";
        return { result: `${answer}${results || "No results"}` };
      } catch { return { result: "Web search failed" }; }
    }
    case "analyze_data": {
      try {
        const { OrderModel, UserModel, ProjectModel } = await import("./models");
        const topic = args.topic || "all";
        const data: any = {};
        if (["orders", "revenue", "performance", "all"].includes(topic)) {
          const orders = await OrderModel.find({}).lean();
          const byStatus = orders.reduce((a: any, o: any) => { a[o.status] = (a[o.status] || 0) + 1; return a; }, {});
          const totalRevenue = orders.reduce((s: number, o: any) => s + (o.totalPrice || 0), 0);
          const lastMonth = orders.filter((o: any) => new Date(o.createdAt) > new Date(Date.now() - 30 * 86400000)).length;
          data.orders = { total: orders.length, byStatus, totalRevenue, lastMonth };
        }
        if (["clients", "all"].includes(topic)) {
          const clients = await UserModel.countDocuments({ role: "client" });
          data.clients = { total: clients };
        }
        if (["employees", "all"].includes(topic)) {
          const emps = await UserModel.find({ role: { $ne: "client" } }, "role fullName").lean();
          const byRole = emps.reduce((a: any, e: any) => { a[e.role] = (a[e.role] || 0) + 1; return a; }, {});
          data.employees = { total: emps.length, byRole };
        }
        if (["projects", "performance", "all"].includes(topic)) {
          const projects = await ProjectModel.find({}).lean();
          const byStatus = projects.reduce((a: any, p: any) => { a[p.status] = (a[p.status] || 0) + 1; return a; }, {});
          data.projects = { total: projects.length, byStatus };
        }
        return { result: `📊 Analysis Report (${topic}):\n${JSON.stringify(data, null, 2)}` };
      } catch (e: any) { return { result: `❌ Analysis error: ${e.message}` }; }
    }
    default: return { result: `Unknown tool: ${toolName}` };
  }
}

/* ─── QIROX Studio Chat Handler ─── */
const STUDIO_SESSIONS = new Map<string, any[]>();

async function handleStudioChat(req: any, res: any) {
  const { message, sessionId, images, tasks, generateImage, imageStyle } = req.body;
  if (!message?.trim() && !generateImage) return res.status(400).json({ error: "Message required" });

  const sid = sessionId || `studio-${req.user?._id || "anon"}`;
  if (!STUDIO_SESSIONS.has(sid)) STUDIO_SESSIONS.set(sid, []);
  const history = STUDIO_SESSIONS.get(sid)!;

  const userRole = req.user?.role || "guest";
  const userName = req.user?.fullName || req.user?.username || "مستخدم";

  // If pure image generation request
  if (generateImage) {
    try {
      const prompt = message || generateImage;
      const styleStr = imageStyle ? `, ${imageStyle} style` : ", ultra realistic, cinematic, 8k";
      const seed = Date.now() % 999999;
      const imageUrl = `/api/ai/image-proxy?prompt=${encodeURIComponent(prompt + styleStr + ", professional, high quality, detailed")}&seed=${seed}`;
      return res.json({
        reply: `تم توليد الصورة بنجاح! 🎨`,
        images: [{ url: imageUrl, prompt, style: imageStyle || "default" }],
        type: "image_generation",
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  // Build content — support image uploads (vision, GPT-4o only)
  let userContent: any = message.trim();
  const taskNote = tasks?.length ? `\n\n[المهام المرفقة]\n${tasks.map((t: any) => `- ${t.title}: ${t.description || ""} (الحالة: ${t.status || "pending"})`).join("\n")}` : "";
  if (images?.length && _supportsVision) {
    userContent = [
      ...images.map((url: string) => ({ type: "image_url", image_url: { url, detail: "high" } })),
      { type: "text", text: message.trim() + taskNote },
    ];
  } else if (images?.length && !_supportsVision) {
    // Vision not supported — tell the AI about the image without sending it
    userContent = message.trim() + ` [ملاحظة: أرسل المستخدم ${images.length} صورة لكن تحليل الصور يتطلب تفعيل GPT-4o]` + taskNote;
  } else if (tasks?.length) {
    userContent = message.trim() + taskNote;
  }

  history.push({ role: "user", content: userContent });
  if (history.length > 40) history.splice(0, 4);

  const rolePersona: Record<string, string> = {
    admin: "مدير تقني خارق: حلل، طوّر، وأنجز بكفاءة قصوى.",
    manager: "مستشار إداري: دقيق، استراتيجي، يحوّل الأفكار إلى خطط.",
    developer: "مساعد مطور خبير: اكتب الكود فوراً، اشرح بوضوح، ابتكر حلولاً.",
    designer: "مساعد مصمم إبداعي: ألوان، خطوط، تخطيطات، موود بورد، UI/UX — كل شيء.",
    support: "خبير دعم فني: اشرح بوضوح، وجّه بهدوء، حل المشاكل خطوة بخطوة.",
    sales: "مساعد مبيعات نشيط: جهّز المحتوى التسويقي، المقترحات، والعروض.",
    accountant: "محاسب ذكي: تحليل مالي، جداول، تقارير، حسابات دقيقة.",
    client: "مساعد دافئ: ابسّط التقنية، اشرح بوضوح، اجعل الأمر سهلاً ولطيفاً.",
  };
  const persona = rolePersona[userRole] || "مساعد ذكاء اصطناعي إبداعي ومتقدم.";

  const systemPrompt = `أنت **QIROX Studio AI** — مساعد ذكاء اصطناعي إبداعي ومتقدم تم بناؤه بواسطة QIROX لمساعدة الفريق والعملاء.

## هويتك
- الاسم: QIROX Studio AI
- شخصيتك: ${persona}
- المستخدم: **${userName}** | الصلاحية: ${userRole}
- اليوم: ${new Date().toLocaleDateString("ar-SA")}

## 🌐 تكيّف اللغة — أهم قاعدة
**⛔ ممنوع منعاً باتاً الرد بالصينية أو اليابانية أو أي لغة غير عربية/إنجليزية.**

اكشف لغة المستخدم ولهجته من أول رسالة واستمر بها طوال المحادثة:
- خليجي: تكلم بلهجته ("وش تبي؟ زين. ولا بأس.")
- مصري: ("إيه اللي تعمله؟ تمام. مفيش مشكلة.")
- شامي: ("شو بدك؟ ماشي. تمام.")
- إنجليزي: respond entirely in English
- فصحى: ردّ بفصحى راقية
- لا تغيّر اللهجة إلا إذا غيّرها المستخدم أولاً

## قدراتك
✅ تحليل الصور والتصاميم (Vision) — صف ما تراه بالتفصيل وقدّم أفكار تطوير
✅ توليد أفكار تصميمية: ألوان (#hex)، خطوط، تخطيطات، موود بورد
✅ كتابة الكود فوراً في بلوكات \`\`\`language مع شرح
✅ تحليل المهام والمشاريع المرفقة وتقديم خطة عمل واضحة
✅ كتابة محتوى تسويقي، إيميلات، تقارير، نصوص إبداعية
✅ تحليل البيانات وتقديم توصيات عملية قابلة للتطبيق

## قواعد السلوك
- كن إبداعياً، عملياً، ومباشراً — لا مقدمات مطوّلة
- عند تحليل صورة: صف بالتفصيل ثم اقترح تحسينات محددة
- عند طلب تصميم: اذكر كودات الألوان والخطوط والأبعاد
- استخدم الإيموجي بذكاء لجعل الردود حيوية
- إذا طُلب تعليمة غير واضحة: اسأل سؤالاً واحداً فقط للتوضيح`;

  try {
    const client = getOpenAIClient();
    const messages: any[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-20),
    ];

    const response = await client.chat.completions.create({
      model: AI_MODEL,
      messages,
      temperature: 0.8,
      max_tokens: 4096,
    });

    const reply = response.choices[0]?.message?.content || "";
    history.push({ role: "assistant", content: reply });

    // Check if user explicitly asked for image generation
    const wantsImage = /ولّد\s*صورة|أنشئ\s*صورة|ارسم|صمم\s*لي|generate\s*image|create\s*image|draw me/i.test(message);
    const wantsVideo = /ولّد\s*فيديو|أنشئ\s*فيديو|اعمل\s*فيديو|generate\s*video|create\s*video/i.test(message);
    let generatedImages: any[] = [];
    let generatedVideos: any[] = [];

    if (wantsVideo) {
      let vidPrompt = message;
      const hasAr = /[\u0600-\u06FF]/.test(message);
      if (hasAr) {
        try {
          const tr = await client.chat.completions.create({
            model: AI_MODEL,
            messages: [{ role: "user", content: `Translate to English for AI video generation (ONLY the description):\n${message}` }],
            temperature: 0.3, max_tokens: 150,
          });
          vidPrompt = tr.choices[0]?.message?.content?.trim() || message;
        } catch { /* use original */ }
      }
      const seed = Math.floor(Math.random() * 999999);
      const fullPrompt = `${vidPrompt}, cinematic, smooth motion, high quality`;
      const videoUrl = `/api/ai/video-proxy?prompt=${encodeURIComponent(fullPrompt)}&seed=${seed}`;
      generatedVideos = [{ url: videoUrl, prompt: message }];
    } else if (wantsImage) {
      let imgPrompt = message;
      const hasAr = /[\u0600-\u06FF]/.test(message);
      if (hasAr) {
        try {
          const tr = await client.chat.completions.create({
            model: AI_MODEL,
            messages: [{ role: "user", content: `Translate to English for AI image generation (ONLY the description):\n${message}` }],
            temperature: 0.3, max_tokens: 150,
          });
          imgPrompt = tr.choices[0]?.message?.content?.trim() || message;
        } catch { /* use original */ }
      }
      const seed = Math.floor(Math.random() * 999999);
      const styleStr = imageStyle ? `, ${imageStyle} style` : ", photorealistic, ultra detailed, 8k, professional";
      const fullPrompt = `${imgPrompt}${styleStr}`;
      const imageUrl = `/api/ai/image-proxy?prompt=${encodeURIComponent(fullPrompt)}&seed=${seed}&model=flux&enhance=true`;
      generatedImages = [{ url: imageUrl, prompt: message }];
    }

    return res.json({ reply, images: generatedImages, videos: generatedVideos, type: "chat" });
  } catch (err: any) {
    console.error("[STUDIO]", err.message);
    return res.status(500).json({ error: err.message || "Studio AI error" });
  }
}

/* ─── Streaming Chat Handler (SSE) ─── */
async function handleStreamChat(req: any, res: any) {
  const { message, sessionId, context, images } = req.body;
  if (!message?.trim()) {
    res.setHeader("Content-Type", "text/event-stream");
    res.write(`data: ${JSON.stringify({ done: true, reply: "الرجاء إدخال رسالة." })}\n\n`);
    return res.end();
  }

  const userId = req.user?._id ? String(req.user._id) : undefined;
  const userRole = req.user?.role || "guest";
  const userName = req.user?.fullName || req.user?.username || context?.name;
  const session = getSession(sessionId || "anon", userId, userRole, userName);
  // store text-only in history; vision content only in current turn — truncate to prevent tokenization errors
  const trimmedMsg = message.trim().slice(0, 3000);
  session.history.push({ role: "user", content: trimmedMsg });
  if (session.history.length > 20) session.history = session.history.slice(-20);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  function sendEvent(data: object) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  try {
    const employeeCtx = userId ? await buildEmployeeContext(userId, userRole) : "";
    // Build history slice — keep last 10 turns to stay within Moonshot token limits
    const historySlice = session.history.slice(-10).map((m: any) =>
      typeof m.content === "string" ? { ...m, content: m.content.slice(0, 2000) } : m
    );
    if (images?.length && _supportsVision) {
      // Only attach images if the provider supports vision (GPT-4o does, Kimi does not)
      const lastIdx = historySlice.length - 1;
      const imgParts = (images as string[]).map((url: string) => ({ type: "image_url", image_url: { url, detail: "high" } }));
      historySlice[lastIdx] = { role: "user", content: [...imgParts, { type: "text", text: message.trim() }] };
    } else if (images?.length && !_supportsVision) {
      // Kimi doesn't support vision — append note to message instead
      const lastIdx = historySlice.length - 1;
      historySlice[lastIdx] = { role: "user", content: message.trim() + ` [ملاحظة: أرسل المستخدم ${images.length} صورة لكن تحليل الصور غير مدعوم حالياً في هذا الإعداد]` };
    }
    const messages: any[] = [
      { role: "system", content: buildSystemPrompt(userRole, userName) + employeeCtx },
      ...historySlice,
    ];

    // Round 1 — check for tool calls first (non-streaming)
    const toolCheck = await openai.chat.completions.create({
      model: AI_MODEL,
      messages,
      tools: QIROX_TOOLS,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 4096,
    });

    const choice = toolCheck.choices[0];
    let toolResults: { name: string; result: any }[] = [];

    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      // Execute tools
      sendEvent({ type: "tool_start", tools: choice.message.tool_calls.map((tc: any) => tc.function.name) });

      const toolMessages: any[] = [
        { role: "system", content: buildSystemPrompt(userRole, userName) },
        ...session.history.slice(-20),
        choice.message,
      ];

      const execResults = await Promise.all(
        choice.message.tool_calls.map(async (tc: any) => {
          const args = JSON.parse(tc.function.arguments || "{}");
          const result = await executeTool(tc.function.name, args, userId, userRole, session);
          toolResults.push({ name: tc.function.name, result });
          sendEvent({ type: "tool_result", name: tc.function.name, success: result.success, displayType: result?.display?.type, data: result?.data });
          return {
            role: "tool" as const,
            tool_call_id: tc.id,
            content: JSON.stringify(result.success ? result.data : { error: result.error }),
          };
        })
      );

      toolMessages.push(...execResults);

      // Stream the final answer
      sendEvent({ type: "stream_start" });
      const stream = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: toolMessages,
        temperature: 0.7,
        max_tokens: 4096,
        stream: true,
      });

      let fullReply = "";
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || "";
        if (delta) {
          fullReply += delta;
          sendEvent({ type: "delta", content: delta });
        }
      }

      session.history.push({ role: "assistant", content: fullReply });
      session.toolCallCount = (session.toolCallCount || 0) + toolResults.length;
      notifyAdminsOfAIActivity(session, message.trim(), fullReply, toolResults.map(t => t.name)).catch(() => {});

      const displayResult = toolResults.find(t => t.result?.display?.type);
      sendEvent({
        type: "done",
        reply: fullReply,
        action: displayResult ? "TOOL_RESULT" : undefined,
        displayType: displayResult?.result?.display?.type,
        toolData: displayResult?.result?.data,
        allTools: toolResults.map(t => ({ name: t.name, success: t.result.success, displayType: t.result?.display?.type, data: t.result?.data })),
        model: AI_MODEL_LABEL,
      });
      return res.end();
    }

    // No tool calls — stream text directly
    sendEvent({ type: "stream_start" });
    const stream = await openai.chat.completions.create({
      model: AI_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      stream: true,
    });

    let fullReply = "";
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      if (delta) {
        fullReply += delta;
        sendEvent({ type: "delta", content: delta });
      }
    }

    session.history.push({ role: "assistant", content: fullReply });
    const userMsgCount = session.history.filter(m => m.role === "user").length;
    if (userMsgCount >= 3 && userMsgCount % 5 === 0) {
      notifyAdminsOfAIActivity(session, message.trim(), fullReply, []).catch(() => {});
    }
    sendEvent({ type: "done", reply: fullReply, model: AI_MODEL_LABEL });
    return res.end();
  } catch (err: any) {
    console.error("[AI Stream Error]", err.message);
    sendEvent({ type: "error", error: "حدث خطأ، أعد المحاولة." });
    return res.end();
  }
}

/* ─── Register Routes ─── */
export function registerAiRoutes(app: Express) {
  app.post("/api/ai/message", handleChat);
  app.post("/api/ai/chat", handleChat); // legacy alias
  app.post("/api/ai/stream", handleStreamChat);
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
  app.post("/api/studio/chat", handleStudioChat);

  // ── Community fake replies — generates realistic Arabic community messages ──
  app.post("/api/community/reply", async (req: any, res: any) => {
    try {
      const { userMessage, posterTitle } = req.body as { userMessage?: string; posterTitle?: string };
      const prompt = `أنت تلعب دور أعضاء مجتمع نشط في مجموعة واتساب أو تيليقرام لشركة تقنية سعودية اسمها "كيروكس استوديو".
المستخدم أرسل: "${userMessage || "مرحبا"}"
${posterTitle ? `السياق: البوستر عن "${posterTitle}"` : ""}

اكتب 2-3 ردود طبيعية وعفوية من أشخاص مختلفين. كل رد يكون:
- بلهجة عربية مختلفة (سعودية، مصرية، خليجية، شامية)
- قصير وطبيعي (جملة أو جملتين فقط)
- يعبر عن إعجاب أو تجربة شخصية أو سؤال حقيقي
- لا تذكر أنك ذكاء اصطناعي
- NEVER use Chinese characters

أرجع JSON array بهذا الشكل بدون أي نص إضافي:
[{"name":"اسم عربي","dialect":"sa|eg|kw|sy","message":"الرسالة"}]`;

      const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        max_tokens: 400,
      });
      const raw = resp.choices[0]?.message?.content?.trim() || "[]";
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      const replies = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      res.json({ replies });
    } catch (e: any) {
      res.json({ replies: [] });
    }
  });

  // ── Image proxy — fetches Pollinations server-side so browser never has CORS/CSP issues ──
  app.get("/api/ai/image-proxy", async (req: any, res: any) => {
    try {
      const { prompt, width = "1024", height = "1024", seed, model = "flux" } = req.query;
      if (!prompt) return res.status(400).json({ error: "prompt required" });
      const s = seed || String(Math.floor(Math.random() * 999999));
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(String(prompt))}?width=${width}&height=${height}&nologo=true&seed=${s}&model=${model}&enhance=true`;
      const imgRes = await axios.get(url, { responseType: "stream", timeout: 90000 });
      res.setHeader("Content-Type", imgRes.headers["content-type"] || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      imgRes.data.pipe(res);
    } catch (e: any) {
      console.error("[ImageProxy]", e.message);
      res.status(502).json({ error: "Image generation failed" });
    }
  });

  // ── Video proxy — fetches Pollinations video server-side ──
  app.get("/api/ai/video-proxy", async (req: any, res: any) => {
    try {
      const { prompt, width = "512", height = "512", duration = "5", seed } = req.query;
      if (!prompt) return res.status(400).json({ error: "prompt required" });
      const s = seed || String(Math.floor(Math.random() * 999999));
      // Pollinations video API
      const url = `https://video.pollinations.ai/prompt/${encodeURIComponent(String(prompt))}?width=${width}&height=${height}&duration=${duration}&seed=${s}&nologo=true`;
      const vidRes = await axios.get(url, { responseType: "stream", timeout: 120000 });
      const contentType = vidRes.headers["content-type"] || "video/mp4";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      vidRes.data.pipe(res);
    } catch (e: any) {
      console.error("[VideoProxy]", e.message);
      res.status(502).json({ error: "Video generation failed. Try again or use a simpler description." });
    }
  });

  app.post("/api/ai/generate-image", async (req: any, res: any) => {
    try {
      const { prompt, style } = req.body;
      if (!prompt) return res.status(400).json({ error: "Prompt required" });
      const styleStr = style ? `, ${style} style` : "";
      const fullPrompt = `${prompt}${styleStr}, high quality, professional`;
      const seed = Date.now() % 999999;
      const imageUrl = `/api/ai/image-proxy?prompt=${encodeURIComponent(fullPrompt)}&seed=${seed}`;
      return res.json({ imageUrl, prompt: fullPrompt });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/ai/session/:id", (req, res) => {
    sessions.delete(req.params.id);
    finderSessions.delete(req.params.id);
    res.json({ success: true });
  });
}
