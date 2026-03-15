// @ts-nocheck
/**
 * QIROX AI — Intelligent assistant backend
 * Uses Serper.dev for web search + built-in platform knowledge
 */
import type { Express } from "express";
import { sendDirectEmail } from "./email";
import axios from "axios";

const SERPER_KEY = process.env.SERPER_API_KEY || "1e7d5649e4f81662619b41ffe249c5bea3341eef";

/* ─── Session store (in-memory, keyed by sessionId) ─── */
interface Session {
  mode: "GENERAL" | "EMAIL" | "PACKAGE_ADVISOR" | "CUSTOM_ORDER" | "PAGE_EXPLAIN";
  step: number;
  data: Record<string, any>;
  history: { role: "user" | "ai"; text: string }[];
  userId?: string;
  userRole?: string;
}
const sessions = new Map<string, Session>();
function getSession(id: string, userId?: string, role?: string): Session {
  if (!sessions.has(id)) {
    sessions.set(id, { mode: "GENERAL", step: 0, data: {}, history: [], userId, userRole: role });
  }
  const s = sessions.get(id)!;
  if (userId) s.userId = userId;
  if (role) s.userRole = role;
  return s;
}

/* ─── Platform knowledge base ─── */
const PAGE_KB: Record<string, { ar: string; role: string; desc: string; tips: string[]; keywords?: string[] }> = {
  dashboard: {
    ar: "لوحة القيادة",
    role: "all",
    desc: "الصفحة الرئيسية التي تعرض ملخصاً شاملاً للأداء: إجمالي الإيرادات، عدد الطلبات النشطة، نمو العملاء، والتنبيهات المهمة. هي نقطة انطلاقك كل يوم.",
    tips: ["راجع لوحة القيادة أول الصباح لمعرفة المستجدات", "تستطيع تخصيص الويدجت حسب احتياجك", "الرسوم البيانية تُحدَّث في الوقت الفعلي"],
  },
  orders: {
    ar: "إدارة الطلبات",
    role: "admin,employee",
    desc: "هنا تُدار جميع طلبات العملاء من البداية للنهاية. تستطيع تغيير حالة الطلب، تعيين الموظف المسؤول، إضافة ملاحظات، وإرسال تحديثات للعميل تلقائياً.",
    tips: ["استخدم الفلاتر لعرض الطلبات حسب الحالة", "انقر على أي طلب لعرض تفاصيله الكاملة", "التنبيهات الصفراء تعني طلبات تحتاج انتباهاً"],
  },
  customers: {
    ar: "العملاء",
    role: "admin,employee",
    desc: "قاعدة بيانات كاملة لجميع العملاء مع تاريخ معاملاتهم، طلباتهم، فواتيرهم، ومراسلاتهم. يمكنك البحث والتصفية وتصدير البيانات.",
    tips: ["انقر على اسم العميل لرؤية ملفه الكامل", "يمكن إرسال بريد مباشر من ملف العميل", "الفلتر الأحمر يعني عميل متأخر في الدفع"],
  },
  employees: {
    ar: "الموظفون",
    role: "admin",
    desc: "إدارة فريق العمل بالكامل: الصلاحيات، الرواتب، الحضور، المهام المُعيّنة، والأداء. كل موظف له لوحة تحكم خاصة.",
    tips: ["حدد صلاحيات كل موظف بدقة من تبويب الصلاحيات", "تقارير الحضور تُولَّد تلقائياً شهرياً", "يمكن ربط الموظف بمشاريع محددة فقط"],
  },
  finance: {
    ar: "المالية",
    role: "admin",
    desc: "مركز التحكم المالي: الإيرادات والمصروفات، تقارير الأرباح، التدفق النقدي، الفواتير المعلّقة، وتحليلات مالية متعمقة.",
    tips: ["الرسم البياني الشهري يقارن الأداء بالأشهر السابقة", "يمكن تصدير التقارير بصيغة PDF أو Excel", "احرص على مراجعة الفواتير المعلّقة أسبوعياً"],
  },
  kanban: {
    ar: "لوحة كانبان",
    role: "admin,employee",
    desc: "لوحة إدارة المشاريع بأسلوب كانبان: تتبع مراحل المشروع من البداية حتى التسليم. يمكن سحب البطاقات وإفلاتها بين الأعمدة.",
    tips: ["كل بطاقة تمثل مهمة أو مرحلة مشروع", "اللون الأحمر يعني مهمة متأخرة", "يمكن إضافة تعليقات وملفات لكل بطاقة"],
  },
  invoices: {
    ar: "الفواتير",
    role: "admin,employee",
    desc: "إنشاء وإرسال فواتير احترافية للعملاء بضغطة واحدة. تتبع حالة كل فاتورة (معلّقة، مدفوعة، متأخرة) مع إمكانية الإرسال التلقائي.",
    tips: ["الفواتير تُرسَل تلقائياً بالبريد الإلكتروني", "يمكن إضافة لوغو وبيانات الشركة للفاتورة", "التذكيرات التلقائية تُرسَل للفواتير المتأخرة"],
  },
  analytics: {
    ar: "التحليلات",
    role: "admin",
    desc: "تقارير وإحصاءات مفصّلة: أكثر الخدمات مبيعاً، معدل التحويل، مصادر العملاء، وأداء كل موظف. بيانات حقيقية لقرارات أفضل.",
    tips: ["غيّر الفترة الزمنية لمقارنة الأداء", "أقسام التحليل قابلة للتصدير", "ربط التحليلات بالأهداف الشهرية"],
  },
  wallet: {
    ar: "المحفظة",
    role: "client",
    desc: "محفظتك الإلكترونية في منصة QIROX: رصيدك الحالي، سجل جميع المعاملات (إيداع وسحب)، ورموز الكاشباك. يمكن استخدام الرصيد في سداد الطلبات.",
    tips: ["رصيد المحفظة يُستخدم تلقائياً عند الدفع", "كل طلب مكتمل يضيف نقاط ولاء", "يمكن تعبئة الرصيد عبر التحويل البنكي"],
  },
  contracts: {
    ar: "العقود",
    role: "client,admin",
    desc: "عرض وتوقيع العقود الرقمية الخاصة بمشاريعك. جميع العقود محفوظة وقابلة للتحميل في أي وقت.",
    tips: ["العقد يُفعَّل تلقائياً عند توقيعه", "احتفظ بنسخة من كل عقد في جهازك", "التعديلات على العقد تتطلب موافقة الطرفين"],
  },
  loyalty: {
    ar: "الولاء والمكافآت",
    role: "client",
    desc: "برنامج ولاء QIROX: اجمع نقاطاً مع كل طلب وحوّلها لخصومات أو خدمات مجانية. كلما زادت مشترياتك، كلما زادت مكافآتك.",
    tips: ["كل 100 ريال = 10 نقاط ولاء", "يمكن استبدال 500 نقطة بـ 50 ريال خصم", "المستويات الأعلى تحصل على أولوية في الدعم"],
  },
  prices: {
    ar: "الأسعار والباقات",
    role: "all",
    desc: "صفحة عرض جميع الباقات والأسعار مع المقارنة التفصيلية. اختر الباقة المناسبة لنشاطك وأضفها للسلة مباشرة.",
    tips: ["الدفع السنوي يوفر حتى 20%", "الباقة لايت مثالية للبدايات", "الباقة إنفينيت للمشاريع الكبيرة والمعقدة"],
  },
  cart: {
    ar: "سلة التسوق",
    role: "all",
    desc: "مراجعة ما اخترته من باقات وخدمات قبل إتمام الطلب. يمكن تعديل الكميات أو حذف العناصر.",
    tips: ["يمكنك إضافة كوبون خصم في هذه الصفحة", "مراجعة الإجمالي قبل المتابعة للدفع", "الضغط على إتمام الطلب يفتح مساعد المشروع"],
  },
  attendance: {
    ar: "الحضور والانصراف",
    role: "employee,admin",
    desc: "نظام تسجيل الحضور والانصراف بالبصمة أو الكود. يحسب ساعات العمل تلقائياً ويولّد تقارير شهرية.",
    tips: ["سجّل حضورك في بداية يوم العمل", "النظام يحسب الساعات الإضافية تلقائياً", "التقارير الشهرية تُرفَع للمحاسبة مباشرة"],
  },
  profile: {
    ar: "الملف الشخصي",
    role: "all",
    desc: "إدارة بياناتك الشخصية، صورة الملف، كلمة المرور، وإعدادات الأمان مثل التحقق الثنائي.",
    tips: ["فعّل التحقق الثنائي لأمان أعلى", "احرص على رفع صورة احترافية", "تحديث رقم الهاتف يستلزم تأكيد OTP"],
  },
  payroll: {
    ar: "الرواتب",
    role: "admin",
    desc: "إدارة رواتب الموظفين: الراتب الأساسي، البدلات، الخصومات، وكشف الرواتب الشهري. إرسال تلقائي لإيصالات الراتب.",
    tips: ["راتب الشهر يُعالَج في اليوم الأخير تلقائياً", "يمكن إضافة مكافآت استثنائية في أي وقت", "كشف الرواتب يُصدَّر بصيغة Excel"],
  },
};

/* ─── Package knowledge ─── */
const PACKAGES = [
  {
    tier: "lite",
    nameAr: "لايت",
    price: 5000,
    desc: "مثالية للمشاريع الصغيرة والناشئة. تشمل الأساسيات الكاملة لإطلاق مشروعك الرقمي.",
    features: ["موقع إلكتروني", "إدارة المنتجات", "نظام الطلبات", "لوحة تحكم", "دعم فني"],
    ideal: ["مطعم صغير", "متجر ناشئ", "مؤسسة تعليمية صغيرة", "مقدم خدمة فردي"],
    notGood: ["شركات كبيرة", "متاجر بآلاف المنتجات", "نظام متعدد الفروع"],
  },
  {
    tier: "pro",
    nameAr: "برو",
    price: 10000,
    desc: "للمشاريع المتنامية التي تحتاج قوة أكبر. تكاملات متقدمة وميزات احترافية.",
    features: ["كل ميزات لايت", "تطبيق جوال", "بوابة دفع إلكتروني", "CRM", "تقارير متقدمة", "ذكاء اصطناعي"],
    ideal: ["مطعم أو سلسلة متوسطة", "متجر إلكتروني متنامي", "شركة خدمات", "منصة تعليمية"],
    notGood: ["تطبيقات تحتاج تخصيص عالي جداً", "أنظمة حكومية"],
  },
  {
    tier: "infinite",
    nameAr: "إنفينيت",
    price: 20000,
    desc: "للمشاريع الكبيرة التي لا حدود لها. تخصيص كامل، خادم مخصص، وأولوية قصوى في الدعم.",
    features: ["كل ميزات برو", "تخصيص كامل", "خادم مخصص", "API خارجية", "فريق دعم مخصص", "تكاملات غير محدودة"],
    ideal: ["سلاسل كبيرة", "شركات مؤسسية", "منصات SaaS", "مشاريع حكومية"],
    notGood: ["مشاريع ذات ميزانية محدودة"],
  },
];

/* ─── Serper.dev search ─── */
async function searchWeb(query: string): Promise<string> {
  try {
    const res = await axios.post(
      "https://google.serper.dev/search",
      { q: query, hl: "ar", gl: "sa", num: 3 },
      { headers: { "X-API-KEY": SERPER_KEY, "Content-Type": "application/json" }, timeout: 8000 }
    );
    const results = res.data?.organic?.slice(0, 3) || [];
    if (!results.length) return "لم أجد نتائج محددة، يمكنني مساعدتك بطريقة أخرى.";
    return results.map((r: any, i: number) => `${i + 1}. **${r.title}**: ${r.snippet}`).join("\n\n");
  } catch {
    return "لم أتمكن من البحث الآن، لكن يمكنني الإجابة من معلوماتي عن المنصة.";
  }
}

/* ─── Intent detection ─── */
function detectIntent(msg: string, session: Session): string {
  const m = msg.toLowerCase();
  if (session.mode !== "GENERAL") return session.mode;
  // Email — handle hamza variants
  const mNorm = m.replace(/أ|إ|آ/g, "ا");
  if (mNorm.includes("ارسل بريد") || mNorm.includes("بعث ايميل") || mNorm.includes("ارسل ايميل") || mNorm.includes("send email") || mNorm.includes("ارسل رساله") || mNorm.includes("ارسل رسالة") || mNorm.includes("بريد الكتروني") || mNorm.includes("ايميل") || m.includes("mail")) return "EMAIL";
  // Package advisor
  if (m.includes("أنسب باقة") || m.includes("انسب باقة") || m.includes("أي باقة") || m.includes("اي باقة") || m.includes("ساعدني تختار") || m.includes("الباقة المناسبة") || m.includes("بدي باقة") || m.includes("أختار باقة") || m.includes("اختر لي") || m.includes("أنسب خطة") || m.includes("which plan") || m.includes("help me choose")) return "PACKAGE_ADVISOR";
  // Custom order
  if (m.includes("طلب مخصص") || m.includes("مشروع مخصص") || m.includes("ما فيه باقة") || m.includes("ما في باقة") || m.includes("custom order") || m.includes("احتياج خاص")) return "CUSTOM_ORDER";
  // Page explain
  if (m.includes("ما هي") || m.includes("ما هو") || m.includes("شرح") || m.includes("اشرح") || m.includes("يعمل") || m.includes("وظيفة") || m.includes("صفحة")) return "PAGE_EXPLAIN";
  // Web search
  if (m.includes("ابحث") || m.includes("بحث") || m.includes("search") || m.includes("معلومة عن") || m.includes("ما هو ال") || m.startsWith("ما ")) return "SEARCH";
  return "GENERAL";
}

/* ─── Find page in KB ─── */
const PAGE_KEYWORDS: Record<string, string[]> = {
  dashboard: ["القيادة","لوحة تحكم","الرئيسية","الداشبورد","dashboard","الإحصاءات","النظرة العامة"],
  orders: ["الطلبات","طلب","أوردر","orders","الأوامر","طلبات العملاء","إدارة الطلبات"],
  customers: ["العملاء","عميل","customers","الزبائن","الزبون","قاعدة العملاء"],
  employees: ["الموظفون","موظف","employees","الموظفين","فريق العمل","الموظفين"],
  finance: ["المالية","مالي","finance","الإيرادات","المصروفات","التمويل","الأرباح"],
  kanban: ["كانبان","kanban","المهام","تتبع المشاريع","بطاقات","المراحل"],
  invoices: ["الفواتير","فاتورة","invoices","الإيصالات","فواتير"],
  analytics: ["التحليلات","إحصاءات","analytics","التقارير","الرسوم البيانية","الأداء"],
  wallet: ["المحفظة","رصيد","wallet","محفظتي","الكاشباك","النقاط"],
  contracts: ["العقود","عقد","contracts","الاتفاقيات","توقيع"],
  loyalty: ["الولاء","نقاط","loyalty","مكافآت","برنامج الولاء"],
  prices: ["الأسعار","باقات","prices","الخطط","التسعير","الباقة"],
  cart: ["السلة","الكارت","cart","عربة التسوق","المشتريات"],
  attendance: ["الحضور","حضور","attendance","الانصراف","الدوام","التوقيع"],
  profile: ["الملف الشخصي","البروفايل","profile","بياناتي","حسابي","معلوماتي"],
  payroll: ["الرواتب","راتب","payroll","الأجور","كشف الرواتب","الرواتب"],
};
function findPage(msg: string): typeof PAGE_KB[string] | null {
  const m = msg;
  for (const [key, keywords] of Object.entries(PAGE_KEYWORDS)) {
    if (keywords.some(kw => m.includes(kw))) return PAGE_KB[key] || null;
  }
  return null;
}

/* ─── Package recommendation logic ─── */
function recommendPackage(data: any): typeof PACKAGES[number] {
  let score = { lite: 0, pro: 0, infinite: 0 };
  // Business size
  if (data.size === "small") score.lite += 3;
  if (data.size === "medium") { score.pro += 3; score.lite += 1; }
  if (data.size === "large") { score.infinite += 3; score.pro += 1; }
  // Needs mobile app
  if (data.mobileApp) { score.pro += 2; score.infinite += 1; }
  // Needs AI
  if (data.ai) { score.pro += 2; score.infinite += 1; }
  // Needs multi-branch
  if (data.multiBranch) { score.infinite += 3; score.pro += 1; }
  // Budget
  if (data.budget === "low") score.lite += 2;
  if (data.budget === "medium") score.pro += 2;
  if (data.budget === "high") score.infinite += 2;
  // Custom needs
  if (data.custom) score.infinite += 2;

  const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0][0];
  return PACKAGES.find(p => p.tier === best) || PACKAGES[1];
}

/* ─── Build greeting based on role ─── */
function buildGreeting(role?: string, name?: string): string {
  const greet = name ? `مرحباً ${name}! ` : "مرحباً! ";
  if (role === "admin") return greet + "أنا QIROX AI، مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟ يمكنني شرح أي صفحة، إرسال بريد، تحليل الموقع، أو الإجابة على أي سؤال.";
  if (role === "employee") return greet + "أنا QIROX AI، هنا لمساعدتك في فهم النظام وإنجاز مهامك. اسألني عن أي صفحة أو ميزة وسأشرح لك بالتفصيل!";
  if (role === "client") return greet + "أنا QIROX AI، مستشارك الشخصي في QIROX! يمكنني مساعدتك في اختيار أنسب باقة، شرح خدماتنا، أو إنشاء طلب مخصص يناسبك تماماً.";
  return "مرحباً! أنا QIROX AI 🤖 مساعدك الذكي. يمكنني مساعدتك في:\n\n• اختيار الباقة المناسبة لمشروعك\n• شرح خدمات QIROX\n• الإجابة على أي سؤال\n\nكيف يمكنني مساعدتك؟";
}

/* ─── Main AI processor ─── */
async function processMessage(
  sessionId: string,
  message: string,
  context: { userId?: string; role?: string; page?: string; name?: string }
): Promise<{ reply: string; suggestions?: string[]; action?: string; data?: any }> {
  const session = getSession(sessionId, context.userId, context.role);
  session.history.push({ role: "user", text: message });

  // ─── EMAIL flow ───
  if (session.mode === "EMAIL" || detectIntent(message, session) === "EMAIL") {
    session.mode = "EMAIL";
    const d = session.data;

    if (session.step === 0) {
      // Extract email from message
      const emailMatch = message.match(/[\w.-]+@[\w.-]+\.[a-z]{2,}/i);
      if (emailMatch) {
        d.to = emailMatch[0];
        session.step = 1;
        const reply = `ممتاز! سأرسل البريد إلى **${d.to}**\n\nما هو موضوع الرسالة؟`;
        session.history.push({ role: "ai", text: reply });
        return { reply, suggestions: ["تذكير بموعد", "متابعة طلب", "شكر وتقدير", "عرض تجاري"] };
      } else {
        session.step = 0;
        const reply = "بكل سرور! أرسل لي **عنوان البريد الإلكتروني** للمستلم:";
        session.history.push({ role: "ai", text: reply });
        return { reply };
      }
    }

    if (session.step === 1) {
      // Check if this is a reply to "who to send to"
      const emailMatch = message.match(/[\w.-]+@[\w.-]+\.[a-z]{2,}/i);
      if (!d.to && emailMatch) {
        d.to = emailMatch[0];
        const reply = `ممتاز! سأرسل البريد إلى **${d.to}**\n\nما هو موضوع الرسالة؟`;
        session.history.push({ role: "ai", text: reply });
        return { reply, suggestions: ["تذكير بموعد", "متابعة طلب", "شكر وتقدير", "عرض تجاري"] };
      }
      if (!d.to) {
        d.to = message.trim();
        const reply = "ما هو موضوع الرسالة؟";
        session.history.push({ role: "ai", text: reply });
        return { reply, suggestions: ["متابعة طلب", "تذكير بموعد", "عرض خدمات"] };
      }
      d.subject = message.trim();
      session.step = 2;
      const reply = `رائع! الآن اكتب **محتوى الرسالة** التي تريد إرسالها:`;
      session.history.push({ role: "ai", text: reply });
      return { reply };
    }

    if (session.step === 2) {
      if (!d.subject) {
        d.subject = message.trim();
        const reply = "الآن اكتب **محتوى الرسالة**:";
        session.history.push({ role: "ai", text: reply });
        return { reply };
      }
      d.body = message.trim();
      session.step = 3;
      const reply = `✅ جاهز للإرسال!\n\n📧 **إلى:** ${d.to}\n📌 **الموضوع:** ${d.subject}\n\n${d.body}\n\nهل تأكد الإرسال؟`;
      session.history.push({ role: "ai", text: reply });
      return { reply, suggestions: ["نعم، أرسل", "تعديل الرسالة", "إلغاء"], action: "CONFIRM_EMAIL", data: d };
    }

    if (session.step === 3) {
      if (message.includes("نعم") || message.includes("أرسل") || message.includes("ارسل") || message.includes("تأكيد") || message.includes("ok")) {
        try {
          await sendDirectEmail(d.to, d.to.split("@")[0], d.subject, d.body);
          session.mode = "GENERAL"; session.step = 0; session.data = {};
          const reply = `✅ **تم إرسال البريد بنجاح!**\n\nتم إرسال رسالتك إلى **${d.to}** بعنوان «${d.subject}».\n\nهل تحتاج مساعدة في شيء آخر؟`;
          session.history.push({ role: "ai", text: reply });
          return { reply, suggestions: ["إرسال بريد آخر", "العودة للرئيسية", "مساعدة في الطلبات"] };
        } catch {
          const reply = "⚠️ حدث خطأ في الإرسال، تأكد من البريد وحاول مجدداً.";
          session.history.push({ role: "ai", text: reply });
          session.mode = "GENERAL"; session.step = 0; session.data = {};
          return { reply };
        }
      } else {
        session.mode = "GENERAL"; session.step = 0; session.data = {};
        const reply = "تم الإلغاء. كيف يمكنني مساعدتك؟";
        session.history.push({ role: "ai", text: reply });
        return { reply };
      }
    }
  }

  // ─── PACKAGE ADVISOR flow ───
  if (session.mode === "PACKAGE_ADVISOR" || detectIntent(message, session) === "PACKAGE_ADVISOR") {
    session.mode = "PACKAGE_ADVISOR";
    const d = session.data;

    if (session.step === 0) {
      session.step = 1;
      const reply = "يسعدني مساعدتك في اختيار الباقة المثالية! 🎯\n\nأولاً، **ما نوع نشاطك التجاري؟**";
      session.history.push({ role: "ai", text: reply });
      return { reply, suggestions: ["مطعم / كافيه", "متجر إلكتروني", "مؤسسة تعليمية", "شركة خدمات", "مشروع آخر"] };
    }

    if (session.step === 1) {
      d.businessType = message;
      session.step = 2;
      const reply = `رائع! ${d.businessType} مجال واعد.\n\nما **حجم مشروعك** الحالي؟`;
      session.history.push({ role: "ai", text: reply });
      return { reply, suggestions: ["صغير (يبدأ للتو)", "متوسط (يعمل ولديه عملاء)", "كبير (فروع ومنتجات كثيرة)"] };
    }

    if (session.step === 2) {
      const m = message.toLowerCase();
      d.size = m.includes("صغير") || m.includes("يبدأ") ? "small" : m.includes("كبير") || m.includes("فروع") ? "large" : "medium";
      session.step = 3;
      const reply = "هل تحتاج **تطبيق جوال** (iOS / Android) ضمن المشروع؟";
      session.history.push({ role: "ai", text: reply });
      return { reply, suggestions: ["نعم، أحتاج تطبيق جوال", "لا، موقع كافٍ الآن"] };
    }

    if (session.step === 3) {
      d.mobileApp = message.includes("نعم") || message.includes("أحتاج") || message.includes("احتاج");
      session.step = 4;
      const reply = "هل تحتاج **ذكاء اصطناعي** مدمج (توصيات، تحليل بيانات، شات بوت)؟";
      session.history.push({ role: "ai", text: reply });
      return { reply, suggestions: ["نعم، أريد الذكاء الاصطناعي", "لا، ليس ضرورياً الآن"] };
    }

    if (session.step === 4) {
      d.ai = message.includes("نعم") || message.includes("أريد") || message.includes("اريد");
      session.step = 5;
      const reply = "ما **ميزانيتك التقريبية** للمشروع؟";
      session.history.push({ role: "ai", text: reply });
      return { reply, suggestions: ["أقل من 8,000 ريال", "8,000 - 15,000 ريال", "أكثر من 15,000 ريال", "مرن حسب الاحتياج"] };
    }

    if (session.step === 5) {
      const m = message.toLowerCase();
      d.budget = m.includes("أقل") || m.includes("اقل") ? "low" : m.includes("15") || m.includes("أكثر") || m.includes("اكثر") ? "high" : "medium";
      const recommended = recommendPackage(d);
      const others = PACKAGES.filter(p => p.tier !== recommended.tier);

      session.step = 6;
      const reply = `🎯 **توصيتي لك: باقة ${recommended.nameAr}**\n\n${recommended.desc}\n\n**✅ ما تشمله:**\n${recommended.features.map(f => `• ${f}`).join("\n")}\n\n**💰 السعر يبدأ من:** ${recommended.price.toLocaleString()} ريال\n\n**مثالية لـ:** ${recommended.ideal.join("، ")}\n\n---\nهل تريد المتابعة بهذه الباقة، أو استكشاف خيار آخر؟`;
      session.data.recommended = recommended;
      session.history.push({ role: "ai", text: reply });
      return {
        reply,
        suggestions: [`اختر باقة ${recommended.nameAr}`, `استكشف باقة ${others[0].nameAr}`, `استكشف باقة ${others[1].nameAr}`, "أريد طلباً مخصصاً"],
        action: "SHOW_PACKAGE",
        data: { recommended, all: PACKAGES },
      };
    }

    if (session.step === 6) {
      if (message.includes("مخصص") || message.includes("طلب مخصص")) {
        session.mode = "CUSTOM_ORDER"; session.step = 0; session.data = {};
        const reply = "ممتاز! سنصمم لك حلاً مخصصاً تماماً. 🛠️\n\nصف لي **مشروعك بالتفصيل**: ما الذي تريد بناءه بالضبط؟";
        session.history.push({ role: "ai", text: reply });
        return { reply };
      }
      const chosen = PACKAGES.find(p => message.includes(p.nameAr)) || session.data.recommended;
      session.mode = "GENERAL"; session.step = 0;
      const reply = `ممتاز! باقة **${chosen.nameAr}** خيار رائع.\n\nانتقل إلى صفحة الأسعار وأضف الباقة للسلة، ثم أكمل الطلب. سيساعدك المساعد في تفاصيل المشروع خلال عملية الطلب.\n\n[انتقل للأسعار ←](/prices)`;
      session.history.push({ role: "ai", text: reply });
      return { reply, action: "GO_PRICES", data: { tier: chosen.tier } };
    }
  }

  // ─── CUSTOM ORDER flow ───
  if (session.mode === "CUSTOM_ORDER" || detectIntent(message, session) === "CUSTOM_ORDER") {
    session.mode = "CUSTOM_ORDER";
    const d = session.data;

    if (session.step === 0) {
      session.step = 1;
      const reply = "رائع! سأساعدك في إنشاء طلب مخصص بالضبط لاحتياجاتك. 🛠️\n\nأولاً، **صف مشروعك**: ماذا تريد أن تبني بالضبط؟";
      session.history.push({ role: "ai", text: reply });
      return { reply };
    }
    if (session.step === 1) {
      d.description = message;
      session.step = 2;
      const reply = `مشروع مثير للاهتمام!\n\nما **الميزات الأساسية** التي يجب أن يتضمنها النظام؟ (اذكرها واحدة تلو الأخرى أو قائمة)`;
      session.history.push({ role: "ai", text: reply });
      return { reply, suggestions: ["موقع + متجر + تطبيق", "نظام إدارة داخلي", "منصة حجز مواعيد", "نظام مطعم شامل"] };
    }
    if (session.step === 2) {
      d.features = message;
      session.step = 3;
      const reply = "ما هي **ميزانيتك التقريبية** للمشروع؟";
      session.history.push({ role: "ai", text: reply });
      return { reply, suggestions: ["أقل من 10,000 ريال", "10,000 - 25,000 ريال", "25,000 - 50,000 ريال", "أكثر من 50,000 ريال", "مفتوحة"] };
    }
    if (session.step === 3) {
      d.budget = message;
      session.step = 4;
      const reply = "ما هو **الجدول الزمني** المتوقع للتسليم؟";
      session.history.push({ role: "ai", text: reply });
      return { reply, suggestions: ["أسرع ما يمكن (أولوية)", "خلال شهر", "2-3 أشهر", "6 أشهر فأكثر"] };
    }
    if (session.step === 4) {
      d.timeline = message;
      session.step = 5;
      // Create order via API
      const orderSummary = `📋 **ملخص طلبك المخصص:**\n\n🎯 **وصف المشروع:**\n${d.description}\n\n⚙️ **الميزات المطلوبة:**\n${d.features}\n\n💰 **الميزانية:** ${d.budget}\n\n⏱️ **الجدول الزمني:** ${d.timeline}\n\n---\nهل أرسل هذا الطلب لفريق QIROX للمراجعة وتحديد السعر؟`;
      session.history.push({ role: "ai", text: orderSummary });
      return {
        reply: orderSummary,
        suggestions: ["نعم، أرسل الطلب", "تعديل التفاصيل", "إلغاء"],
        action: "CONFIRM_CUSTOM_ORDER",
        data: d,
      };
    }
    if (session.step === 5) {
      if (message.includes("نعم") || message.includes("أرسل") || message.includes("ارسل")) {
        session.mode = "GENERAL"; session.step = 0;
        const reply = `✅ **تم إرسال طلبك المخصص!**\n\nسيتواصل معك فريق QIROX خلال 24 ساعة لمناقشة التفاصيل وتحديد السعر النهائي.\n\nبمجرد الموافقة، ستجد الطلب وسعره في لوحة تحكمك جاهزاً للدفع.`;
        session.history.push({ role: "ai", text: reply });
        return { reply, action: "CUSTOM_ORDER_SUBMITTED", data: session.data };
      } else {
        session.mode = "GENERAL"; session.step = 0; session.data = {};
        const reply = "تم الإلغاء. كيف يمكنني مساعدتك؟";
        session.history.push({ role: "ai", text: reply });
        return { reply };
      }
    }
  }

  // ─── PAGE EXPLAIN ───
  if (detectIntent(message, session) === "PAGE_EXPLAIN") {
    const page = findPage(message) || (context.page ? PAGE_KB[context.page.replace("/", "").split("?")[0]] : null);
    if (page) {
      const reply = `📖 **${page.ar}**\n\n${page.desc}\n\n**💡 نصائح:**\n${page.tips.map(t => `• ${t}`).join("\n")}`;
      session.history.push({ role: "ai", text: reply });
      return { reply, suggestions: ["كيف أستخدمها؟", "ما الصلاحيات المطلوبة؟", "هل يمكن شرح صفحة أخرى؟"] };
    }
  }

  // ─── SITE IMPROVEMENT / ANALYSIS ───
  const m = message.toLowerCase();
  if (m.includes("تحسين") || m.includes("اقتراح") || m.includes("مشكلة") || m.includes("خطأ") || m.includes("ينقص") || m.includes("improve") || m.includes("bug") || m.includes("fix")) {
    const currentPage = context.page || "الصفحة الحالية";
    const reply = `🔍 **تحليل صفحة: ${currentPage}**\n\nبناءً على خبرتي في منصة QIROX، إليك بعض الاقتراحات الشائعة للتحسين:\n\n**📊 تحسينات الأداء:**\n• تأكد من وجود نص وصفي واضح في كل قسم\n• أضف عبارات دعوة للتصرف (CTA) واضحة\n• راجع سرعة التحميل\n\n**🎨 تحسينات التصميم:**\n• تناسق الألوان والخطوط\n• مسافات متوازنة بين العناصر\n• أيقونات دالة لكل قسم\n\n**📱 تجربة المستخدم:**\n• سهولة التنقل في الموبايل\n• وضوح الأزرار والنماذج\n• رسائل خطأ واضحة ومفيدة\n\nهل تريد مني التحليل بشكل أعمق لصفحة معينة؟`;
    session.history.push({ role: "ai", text: reply });
    return { reply, suggestions: ["حلل صفحة الأسعار", "حلل لوحة القيادة", "اقتراحات لتحسين المبيعات"] };
  }

  // ─── GREETINGS ───
  if (m.includes("مرحب") || m.includes("هلا") || m.includes("السلام") || m.includes("hello") || m.includes("hi ") || m === "hi" || m === "هلا" || m === "مرحبا" || m === "مرحباً") {
    const reply = buildGreeting(context.role, context.name);
    session.history.push({ role: "ai", text: reply });
    const suggestions = context.role === "client"
      ? ["أنسب باقة لمشروعي", "شرح الخدمات", "طلب مخصص", "التحدث مع الدعم"]
      : context.role === "employee"
      ? ["شرح صفحة الطلبات", "كيف أرسل بريد؟", "شرح الكانبان", "نصائح عملية"]
      : ["استكشف الباقات", "كيف تعمل المنصة", "تواصل مع فريقنا"];
    return { reply, suggestions };
  }

  // ─── PACKAGE INFO ───
  if (m.includes("باقة لايت") || m.includes("باقه لايت")) {
    const p = PACKAGES[0];
    const reply = `📦 **باقة ${p.nameAr}**\n\n${p.desc}\n\n**✅ تشمل:**\n${p.features.map(f => `• ${f}`).join("\n")}\n\n**مثالية لـ:** ${p.ideal.join("، ")}\n\n💰 **السعر يبدأ من:** ${p.price.toLocaleString()} ريال`;
    session.history.push({ role: "ai", text: reply });
    return { reply, suggestions: ["أضف لايت للسلة", "قارن مع برو", "أحتاج مساعدة أكثر"] };
  }
  if (m.includes("باقة برو") || m.includes("باقه برو")) {
    const p = PACKAGES[1];
    const reply = `📦 **باقة ${p.nameAr}**\n\n${p.desc}\n\n**✅ تشمل:**\n${p.features.map(f => `• ${f}`).join("\n")}\n\n**مثالية لـ:** ${p.ideal.join("، ")}\n\n💰 **السعر يبدأ من:** ${p.price.toLocaleString()} ريال`;
    session.history.push({ role: "ai", text: reply });
    return { reply, suggestions: ["أضف برو للسلة", "قارن مع إنفينيت", "أنسب باقة لي"] };
  }
  if (m.includes("باقة إنفينيت") || m.includes("باقه انفينيت") || m.includes("باقة انفينيت")) {
    const p = PACKAGES[2];
    const reply = `📦 **باقة ${p.nameAr}**\n\n${p.desc}\n\n**✅ تشمل:**\n${p.features.map(f => `• ${f}`).join("\n")}\n\n**مثالية لـ:** ${p.ideal.join("، ")}\n\n💰 **السعر يبدأ من:** ${p.price.toLocaleString()} ريال`;
    session.history.push({ role: "ai", text: reply });
    return { reply, suggestions: ["أضف إنفينيت للسلة", "مقارنة الباقات", "طلب مخصص"] };
  }
  if (m.includes("قارن") || m.includes("مقارنة") || m.includes("الفرق بين")) {
    const reply = `📊 **مقارنة الباقات:**\n\n| الميزة | لايت | برو | إنفينيت |\n|---|---|---|---|\n| الموقع | ✅ | ✅ | ✅ |\n| تطبيق جوال | ❌ | ✅ | ✅ |\n| ذكاء اصطناعي | ❌ | ✅ | ✅ |\n| خادم مخصص | ❌ | ❌ | ✅ |\n| تخصيص كامل | ❌ | ❌ | ✅ |\n| الدعم | أساسي | مميز | مخصص |\n| السعر | 5,000+ | 10,000+ | 20,000+ |\n\nهل تريد أساعدك في اختيار الأنسب؟`;
    session.history.push({ role: "ai", text: reply });
    return { reply, suggestions: ["أنسب باقة لمشروعي", "مزيد من التفاصيل", "طلب مخصص"] };
  }

  // ─── WEB SEARCH ───
  if (detectIntent(message, session) === "SEARCH" || m.includes("ابحث") || m.includes("بحث عن")) {
    const searchQuery = message.replace(/^(ابحث عن|بحث عن|ابحث|search for|ما هو|ما هي)/i, "").trim();
    if (searchQuery.length > 2) {
      const results = await searchWeb(searchQuery + " " + (context.role === "client" ? "business" : ""));
      const reply = `🔍 **نتائج البحث عن «${searchQuery}»:**\n\n${results}\n\n---\nهل تريد مزيداً من المعلومات؟`;
      session.history.push({ role: "ai", text: reply });
      return { reply, suggestions: ["بحث أدق", "مساعدة في شيء آخر"] };
    }
  }

  // ─── WHAT CAN YOU DO / CAPABILITIES ───
  if (m.includes("تقدر") || m.includes("ايش تسوي") || m.includes("ما هي قدراتك") || m.includes("help") || m.includes("مساعدة")) {
    const reply = `🤖 **QIROX AI — قدراتي:**\n\n📧 **البريد الإلكتروني:** أرسل بريدًا لأي شخص مباشرة من هنا\n📦 **استشارة الباقات:** أساعدك تختار الباقة المثالية\n🛠️ **طلبات مخصصة:** أجمع متطلباتك وأرسلها للفريق\n📖 **شرح الصفحات:** اسألني عن أي صفحة وأشرح كيف تعمل\n🔍 **البحث:** أبحث لك في الإنترنت\n💡 **تحسين الموقع:** اقتراحات لتحسين أي صفحة\n\nجرّب أن تقول: «أرسل بريد» أو «أنسب باقة لي» أو «اشرح صفحة الطلبات»`;
    session.history.push({ role: "ai", text: reply });
    return { reply, suggestions: ["أرسل بريد إلكتروني", "أنسب باقة لمشروعي", "اشرح صفحة الطلبات", "ابحث عن شيء"] };
  }

  // ─── QIROX info ───
  if (m.includes("qirox") || m.includes("قيروكس") || m.includes("من أنتم") || m.includes("من انتم") || m.includes("الشركة") || m.includes("المنصة")) {
    const reply = `🏢 **عن QIROX Studio**\n\nQIROX هي منصة «مصنع الأنظمة الرقمية» الرائدة في السوق العربي.\n\n**ما نقدمه:**\n• بناء مواقع ومتاجر احترافية\n• تطبيقات جوال iOS وAndroid\n• أنظمة إدارة متكاملة (ERP, CRM)\n• ذكاء اصطناعي مدمج\n• دعم فني متواصل\n\n**رؤيتنا:** نبني أنظمة، نبقى بشراً.\n\nهل تريد استكشاف ما يمكننا بناؤه لك؟`;
    session.history.push({ role: "ai", text: reply });
    return { reply, suggestions: ["استكشف الباقات", "أنسب باقة لمشروعي", "تواصل مع الفريق"] };
  }

  // ─── FALLBACK: general web search ───
  const webResults = await searchWeb(message + " قيروكس أنظمة رقمية منصة QIROX");
  let reply: string;
  if (webResults.includes("لم أجد") || webResults.includes("لم أتمكن")) {
    reply = `أفهم سؤالك! دعني أحاول الإجابة بناءً على ما أعرفه عن منصة QIROX.\n\nيمكنني مساعدتك في:\n• شرح أي صفحة أو ميزة في المنصة\n• إرسال بريد إلكتروني\n• اختيار أنسب باقة\n• إنشاء طلب مخصص\n\nأو يمكنك **التحدث مع فريق الدعم** مباشرة للمسائل المعقدة.`;
  } else {
    reply = `وجدت بعض المعلومات المفيدة:\n\n${webResults}\n\n---\nهل هذا ما كنت تبحث عنه؟`;
  }
  session.history.push({ role: "ai", text: reply });
  return { reply, suggestions: ["نعم شكراً", "أريد مساعدة أخرى", "تواصل مع الدعم"] };
}

/* ─── Register AI routes ─── */
export function registerAiRoutes(app: Express) {
  // POST /api/ai/chat
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, sessionId, context = {} } = req.body;
      if (!message || !sessionId) return res.status(400).json({ error: "message and sessionId required" });

      // Merge authenticated user info
      const user = (req as any).user;
      if (user) {
        context.userId = user._id?.toString() || user.id?.toString();
        context.role = user.role || "client";
        context.name = user.fullName || user.username;
      }

      const result = await processMessage(sessionId, message, context);
      res.json(result);
    } catch (err) {
      console.error("[AI] Error:", err);
      res.json({ reply: "عذراً، حدث خطأ مؤقت. حاول مرة أخرى." });
    }
  });

  // POST /api/ai/custom-order — create custom order in DB
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
        notes: `طلب مخصص:\n\nالوصف: ${description}\n\nالميزات: ${features}\n\nالميزانية: ${budget}\n\nالجدول الزمني: ${timeline}`,
        totalAmount: 0,
        source: "qirox-ai",
        createdAt: new Date(),
      };

      const order = await OrderModel.create(orderData);

      // Notify admin via email
      sendDirectEmail(
        "info@qiroxstudio.online",
        "QIROX",
        `طلب مخصص جديد من QIROX AI`,
        `عميل: ${orderData.clientName}\nالبريد: ${orderData.clientEmail}\n\nالوصف: ${description}\n\nالميزات: ${features}\n\nالميزانية: ${budget}\n\nالجدول الزمني: ${timeline}`
      ).catch(console.error);

      res.json({ success: true, orderId: order._id });
    } catch (err) {
      console.error("[AI Custom Order]", err);
      res.status(500).json({ error: "فشل في إنشاء الطلب" });
    }
  });

  // GET /api/ai/session — reset session
  app.delete("/api/ai/session/:sessionId", (req, res) => {
    sessions.delete(req.params.sessionId);
    res.json({ ok: true });
  });
}
