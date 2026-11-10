import { getPlanPrice } from "./plan-prices";

export const MANUAL_MARKETING_SECTORS = [
  {
    key: "restaurant",
    label: "المطاعم والمقاهي",
    labelEn: "Restaurants and cafés",
    offer: "نقطة بيع، شاشة للمطبخ، قائمة QR، وإدارة للطاولات والمخزون",
    offerEn: "point of sale, kitchen display, QR menu, table, and inventory management",
    differentiator: "النظام يواصل العمل دون إنترنت، وشاشة المطبخ مدمجة ضمن الحل",
    differentiatorEn: "the system can keep working offline, with the kitchen display built into the same solution",
  },
  {
    key: "ecommerce",
    label: "المتاجر الإلكترونية",
    labelEn: "E-commerce",
    offer: "إدارة المنتجات والطلبات والمدفوعات والشحن من لوحة واحدة",
    offerEn: "products, orders, payments, and shipping from one dashboard",
    differentiator: "نبني واجهة المتجر بهويتكم بدل الاكتفاء بقالب متكرر",
    differentiatorEn: "we build the storefront around your brand instead of relying on a generic template",
  },
  {
    key: "education",
    label: "التعليم والمنصات",
    labelEn: "Education and learning platforms",
    offer: "إدارة الدورات والطلاب والاختبارات والشهادات في منصة واحدة",
    offerEn: "courses, students, exams, and certificates in one platform",
    differentiator: "نقدر نضمّن الجلسات المباشرة داخل المنصة بدل تحويل الطالب إلى خدمة ثانية",
    differentiatorEn: "live sessions can be built into the platform instead of sending students to a separate service",
  },
  {
    key: "healthcare",
    label: "الصحة والعيادات",
    labelEn: "Healthcare and clinics",
    offer: "تنظيم المواعيد والملفات الطبية والفوترة ومتابعة المرضى",
    offerEn: "appointments, patient records, billing, and follow-up in one system",
    differentiator: "بوابة للمريض تتيح له الحجز ومتابعة مواعيده ونتائجه بنفسه",
    differentiatorEn: "a patient portal for booking appointments and checking schedules and results",
  },
  {
    key: "realestate",
    label: "العقارات",
    labelEn: "Real estate",
    offer: "إدارة العقارات والوحدات والعقود وملفات الملاك والمستأجرين",
    offerEn: "properties, units, contracts, and owner and tenant records",
    differentiator: "يمكن جمع بوابة المالك والمستأجر وتحصيل الإيجارات والتنبيهات في النظام",
    differentiatorEn: "owner and tenant portals, rent collection, and reminders can all be managed in one system",
  },
  {
    key: "corporate",
    label: "الشركات والوكالات",
    labelEn: "Companies and agencies",
    offer: "إدارة الموظفين والمشاريع والعملاء والمستندات والتقارير",
    offerEn: "employees, projects, clients, documents, and reports",
    differentiator: "الحل قابل للتخصيص، والكود المخصص للمشروع يُسلّم لكم عند اكتماله",
    differentiatorEn: "the solution can be customized, and project-specific source code is handed over when complete",
  },
  {
    key: "fitness",
    label: "الأندية واللياقة",
    labelEn: "Fitness and sports clubs",
    offer: "إدارة العضويات والباقات وجدولة الحصص وحضور الأعضاء",
    offerEn: "memberships, plans, class schedules, and attendance",
    differentiator: "دخول ذكي للأعضاء مع تقارير للحضور والإيرادات وتذكيرات التجديد",
    differentiatorEn: "smart member access with attendance and revenue reports and renewal reminders",
  },
  {
    key: "beauty",
    label: "الصالونات والتجميل",
    labelEn: "Salons and beauty",
    offer: "حجوزات أونلاين وإدارة الخدمات والفنيين وملفات العملاء",
    offerEn: "online bookings, services, staff, and customer profiles",
    differentiator: "يشمل الحل تذكيرات المواعيد ومتابعة عمولات الفنيين ومخزون المنتجات بحسب الباقة",
    differentiatorEn: "plans can include appointment reminders, staff commissions, and product inventory",
  },
  {
    key: "events",
    label: "الفعاليات والمناسبات",
    labelEn: "Events and occasions",
    offer: "إدارة الفعاليات والتذاكر والحجوزات وقوائم الضيوف",
    offerEn: "events, tickets, bookings, and guest lists",
    differentiator: "تسجيل دخول الضيوف برمز QR وتقارير للحضور ضمن أدوات المنصة",
    differentiatorEn: "QR guest check-in and attendance reports are built into the platform",
  },
  {
    key: "marketing",
    label: "وكالات التسويق",
    labelEn: "Marketing agencies",
    offer: "إدارة الحملات وتقويم المحتوى والعملاء وتقارير الأداء",
    offerEn: "campaigns, content calendars, clients, and performance reports",
    differentiator: "تجمع إدارة العملاء وأدوات SEO والتقارير في مساحة واحدة",
    differentiatorEn: "client management, SEO tools, and reporting come together in one workspace",
  },
  {
    key: "ai",
    label: "الذكاء الاصطناعي",
    labelEn: "AI and automation",
    offer: "مساعد ذكي وقاعدة معرفة قابلة للتدريب وأتمتة للمهام",
    offerEn: "an AI assistant, a trainable knowledge base, and task automation",
    differentiator: "يمكن تخصيص النماذج وربطها بأنظمتكم عبر API بحسب الباقة",
    differentiatorEn: "models can be customized and connected to your systems through an API, depending on the plan",
  },
] as const;

export type ManualMarketingSector = (typeof MANUAL_MARKETING_SECTORS)[number]["key"];
export type ManualMarketingTier = "lite" | "pro" | "infinity";
export type ManualMarketingLanguage = "ar" | "en";
export type ManualMarketingCurrency = {
  code: string;
  symbol: string;
  locale: string;
  sarRate: number;
};

export const MANUAL_MARKETING_TIERS: Array<{ key: ManualMarketingTier; label: string }> = [
  { key: "lite", label: "لايت" },
  { key: "pro", label: "برو" },
  { key: "infinity", label: "إنفينتي" },
];

const QIROX_SITE = "https://qiroxstudio.online";

const MANUAL_MARKETING_SYSTEM_PATHS: Record<ManualMarketingSector, string> = {
  restaurant: "/sector/restaurant",
  ecommerce: "/sector/ecommerce",
  education: "/sector/education",
  healthcare: "/sector/healthcare",
  realestate: "/systems",
  corporate: "/sector/corporate",
  fitness: "/systems",
  beauty: "/systems",
  events: "/systems",
  marketing: "/systems",
  ai: "/sector/ai",
};

const RESTAURANT_PORTFOLIO_LINKS = [
  "Black Rose: https://blackrose.com.sa",
  "Cluny Cafe: https://cluny.cafe",
  "تطبيق Black Rose على App Store: https://apps.apple.com/sa/app/black-rose/id6765878892?l=ar",
  "Elwa: https://elwa.site",
  "Fuji Cafe: https://www.fuji.cafe",
  "Uji Matcha: https://uji-matcha.store",
  "تسالي قرمش: https://tasaliqromsh.store/",
  "Chef's Place: https://chefsplace.online",
];

export function isManualMarketingSector(value: unknown): value is ManualMarketingSector {
  return typeof value === "string" &&
    MANUAL_MARKETING_SECTORS.some((sector) => sector.key === value);
}

export function normalizeManualMarketingPhone(value: unknown, defaultCallingCode?: string): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  let digits = value.trim().replace(/\D/g, "");
  const explicitlyInternational = raw.startsWith("+") || digits.startsWith("00");
  if (digits.startsWith("00")) digits = digits.slice(2);

  if (defaultCallingCode && !explicitlyInternational) {
    const callingCode = defaultCallingCode.replace(/\D/g, "");
    if (callingCode && !(digits.startsWith(callingCode) && digits.length >= callingCode.length + 7)) {
      digits = `${callingCode}${digits.replace(/^0+/, "")}`;
    }
  } else if (!defaultCallingCode) {
    if (digits.startsWith("05") && digits.length === 10) digits = `966${digits.slice(1)}`;
    else if (digits.startsWith("5") && digits.length === 9) digits = `966${digits}`;
  }
  if (digits.length < 9 || digits.length > 15) return null;
  return digits;
}

export function inferManualMarketingCountryCode(
  value: unknown,
  countries: ReadonlyArray<{ code: string; dial: string }>,
  supportedCountryCodes: ReadonlySet<string>,
  currentCountryCode?: string,
): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  let digits = raw.replace(/\D/g, "");
  const explicitlyInternational = raw.startsWith("+") || digits.startsWith("00");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (!digits) return null;

  if (!explicitlyInternational && supportedCountryCodes.has("SA") && (
    (digits.startsWith("05") && digits.length <= 10) ||
    (digits.startsWith("5") && digits.length <= 9)
  )) return "SA";
  if (!explicitlyInternational && digits.startsWith("0")) return null;
  if (!explicitlyInternational && digits.length < 10) return null;

  const matches = countries
    .filter((country) => supportedCountryCodes.has(country.code))
    .filter((country) => digits.startsWith(country.dial.replace(/\D/g, "")))
    .sort((a, b) => b.dial.length - a.dial.length);
  if (!matches.length) return null;

  // Some countries share calling codes (for example, the US and Canada).
  return matches.find((country) => country.code === currentCountryCode)?.code || matches[0].code;
}

export function manualMarketingAnnualPrices(sector: ManualMarketingSector) {
  return Object.fromEntries(
    MANUAL_MARKETING_TIERS.map(({ key, label }) => [
      key,
      { label, amount: getPlanPrice(key, "annual", sector) },
    ]),
  ) as Record<ManualMarketingTier, { label: string; amount: number }>;
}

export function formatManualMarketingPrice(
  sarAmount: number,
  currency: ManualMarketingCurrency = {
    code: "SAR",
    symbol: "ر.س",
    locale: "ar-SA",
    sarRate: 1,
  },
  language: ManualMarketingLanguage = "ar",
): string {
  const precision = ["KWD", "BHD", "OMR"].includes(currency.code) ? 3 : 0;
  const converted = sarAmount * currency.sarRate;
  const rounded = precision ? Number(converted.toFixed(precision)) : Math.round(converted);
  const formatted = rounded.toLocaleString(currency.locale, { maximumFractionDigits: precision });
  return `${formatted} ${language === "en" ? currency.code : currency.symbol}`;
}

export function generateManualMarketingMessage(
  sectorKey: ManualMarketingSector,
  options: {
    businessName?: string;
    includePlanLink?: boolean;
    countryName?: string;
    currency?: ManualMarketingCurrency;
    language?: ManualMarketingLanguage;
  } = {},
): string {
  const sector = MANUAL_MARKETING_SECTORS.find((item) => item.key === sectorKey);
  if (!sector) throw new Error("القطاع غير مدعوم");

  const language = options.language || "ar";
  if (language !== "ar" && language !== "en") throw new Error("لغة الرسالة غير مدعومة");
  const businessName = (options.businessName || "").replace(/[\r\n]+/g, " ").trim().slice(0, 80);
  const prices = manualMarketingAnnualPrices(sectorKey);
  const currency = options.currency;
  const formatPrice = (amount: number) => formatManualMarketingPrice(amount, currency, language);
  const sectorUrl = `${QIROX_SITE}${MANUAL_MARKETING_SYSTEM_PATHS[sectorKey]}`;
  const isRestaurant = sectorKey === "restaurant";
  const sectorLabel = language === "en" ? sector.labelEn : sector.label;
  const greeting = language === "en"
    ? businessName ? `Hello ${businessName} 👋` : "Hello 👋"
    : businessName ? `يا هلا بأهل ${businessName} 👋` : "يا هلا وسهلا 👋";
  const pitchLines = language === "en"
    ? isRestaurant
      ? [
          "Imagine your customers opening a polished website for your restaurant or café, browsing a beautifully designed digital menu, and ordering easily—while a complete operating system runs behind the experience, not just a website or menu.",
          "We can build a branded website, online store, or mobile app, with delivery integration if you need it—or without it. Add point of sale, kitchen display, QR ordering, table, and inventory management to fit your business.",
          "Already using another system? We can help move your existing business data, products, and inventory, depending on the available export format. We’ll shape the design around your visual identity—not force your brand into a generic template.",
          "Our team helps set up the system, so you can focus on running your business and serving your customers.",
          "Our plans are designed to cost much less than similar market solutions. Depending on project scope, they may cost less than half—and in some cases close to a quarter—of the price.",
        ]
      : [
          `Would it help to bring ${sector.offerEn} together in one solution built around the way you work? We’re QIROX Studio, and we build digital systems for ${sector.labelEn}—not just generic templates.`,
          `What sets us apart: ${sector.differentiatorEn}. We also make the customer experience clear and the day-to-day tools practical for your team.`,
          "Our plans are designed to cost much less than similar market solutions. Depending on project scope, they may cost less than half—and in some cases close to a quarter—of the price.",
        ]
    : isRestaurant
      ? [
          "معكم فريق QIROX Studio. تخيّل عميلك يفتح موقع مطعمك أو كافيهك، يشوف منيو إلكتروني أنيق ويطلب بسهولة—وخلف التجربة نظام متكامل لإدارة الطلبات والتشغيل، مو مجرد موقع أو قائمة.",
          "نجهز لك موقعًا احترافيًا، متجرًا للطلبات أو تطبيقًا باسم نشاطك، مع ربط التوصيل إذا تحتاجه أو بدونه. ونضيف نقاط البيع وشاشة المطبخ وQR وإدارة الطاولات والمخزون حسب احتياجك وباقتك.",
          "وعندك بيانات على نظامك الحالي؟ لا تشيل همها؛ نساعدك تنقل بيانات نشاطك ومنتجاتك ومخزونك حسب صيغة النظام وإمكانية التصدير. والتصميم؟ نضبطه على هويتك البصرية وألوانك، مو قالب مكرر.",
          "فريقنا يهتم بتجهيز النظام، وأنت تركز على تشغيل نشاطك وخدمة ضيوفك.",
          "وبالنسبة للسعر، خططنا مصممة لتكون أقل بكثير من حلول مشابهة في السوق؛ حسب نطاق المشروع قد تكون أقل من النصف، وفي بعض الحالات تقارب ربع التكلفة.",
        ]
      : [
          `هل تتمنى تجمع ${sector.offer} في حل واحد مناسب لطريقة شغلك؟ معكم فريق QIROX Studio، ونجهز حلول رقمية مصممة لقطاع ${sector.label}، مو قالب عام.`,
          `الفرق إن ${sector.differentiator} ونرتب لك واجهة واضحة لعملائك ونظام عملي لفريقك.`,
          "خططنا مصممة لتكون أقل بكثير من حلول مشابهة في السوق؛ حسب نطاق المشروع قد تكون أقل من النصف، وفي بعض الحالات تقارب ربع التكلفة.",
        ];
  const countryLabel = options.countryName ? ` in ${options.countryName}` : "";
  const priceHeading = language === "en"
    ? `Annual plans for ${sectorLabel}${countryLabel}${currency ? ` (${currency.code})` : ""}:`
    : options.countryName || currency
      ? `باقات القطاع السنوية${options.countryName ? ` لعميل ${options.countryName}` : ""} (${currency?.code || "SAR"}):`
      : "باقات القطاع السنوية:";
  const planName = (tier: ManualMarketingTier, arabicLabel: string) =>
    language === "en" ? tier[0].toUpperCase() + tier.slice(1) : arabicLabel;
  const lines = [
    greeting,
    "",
    ...pitchLines,
    "",
    language === "en"
      ? `Explore our solutions for ${sectorLabel}:`
      : `شوف تفاصيل أنظمتنا لقطاع ${sectorLabel}:`,
    sectorUrl,
  ];

  if (isRestaurant) {
    lines.push(
      "",
      language === "en"
        ? "Examples of restaurant and café systems we’ve delivered:"
        : "وهذي أمثلة لأنظمة مطاعم ومقاهٍ نفذناها:",
      ...(language === "en"
        ? [
            "Black Rose: https://blackrose.com.sa",
            "Cluny Cafe: https://cluny.cafe",
            "Black Rose app on the App Store: https://apps.apple.com/sa/app/black-rose/id6765878892?l=ar",
            "Elwa: https://elwa.site",
            "Fuji Cafe: https://www.fuji.cafe",
            "Uji Matcha: https://uji-matcha.store",
            "Tasali Qromsh: https://tasaliqromsh.store/",
            "Chef's Place: https://chefsplace.online",
          ]
        : RESTAURANT_PORTFOLIO_LINKS),
    );
  }

  lines.push(
    "",
    priceHeading,
    `• ${planName("lite", prices.lite.label)}: ${formatPrice(prices.lite.amount)}`,
    `• ${planName("pro", prices.pro.label)}: ${formatPrice(prices.pro.amount)}`,
    `• ${planName("infinity", prices.infinity.label)}: ${formatPrice(prices.infinity.amount)}`,
  );

  if (options.includePlanLink !== false) {
    lines.push(
      "",
      language === "en" ? "Plan details and pricing:" : "تفاصيل الباقات والأسعار:",
      `${QIROX_SITE}/prices`,
    );
  }

  lines.push(
    "",
    language === "en"
      ? "Tell us how many branches you have and how you take orders. We’ll recommend a suitable plan and outline a system for your business before you decide."
      : "أرسل لنا عدد الفروع وطريقة استقبال الطلبات، ونوضح لك الباقة الأنسب ونرتب لك تصورًا للنظام قبل ما تقرر.",
    language === "en"
      ? 'If you do not want further messages, reply "Stop" and we will stop contacting you.'
      : "وإذا ما ودك توصلك رسائل ثانية، اكتب «إيقاف» ونوقف التواصل.",
    "",
    language === "en" ? "QIROX Studio Team" : "فريق QIROX Studio",
  );
  return lines.join("\n");
}
