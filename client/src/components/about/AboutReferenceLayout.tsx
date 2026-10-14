import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  Boxes,
  Braces,
  Check,
  Code2,
  Compass,
  Cpu,
  Globe2,
  Layers3,
  Lightbulb,
  PenTool,
  Rocket,
  ShieldCheck,
  Sparkles,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Link } from "wouter";

type Lang = "ar" | "en";

const sectionCopy = {
  ar: {
    eyebrow: "عن كيروكس",
    heroTag: "من الفكرة إلى الأثر",
    heroTitle: "نحوّل الأفكار إلى",
    heroHighlight: "أنظمة حقيقية",
    heroDescription:
      "نصمم ونبني تجارب رقمية تساعد الأعمال على النمو — من أول فكرة، إلى ما بعد الإطلاق.",
    heroCta: "ابدأ مشروعك معنا",
    storyLabel: "قصتنا",
    storyTitle: "التقنية التي تخدم العمل، لا تعقّده.",
    storyBody:
      "بدأت QIROX من قناعة بسيطة: كل عمل يستحق أدوات رقمية مصممة حول احتياجه الحقيقي. نجمع الاستراتيجية والتصميم والهندسة في فريق واحد، لنحوّل التحديات اليومية إلى أنظمة واضحة وقابلة للنمو.",
    whyLabel: "لماذا تأسست QIROX؟",
    whyTitle: "لأن الفكرة الجيدة تستحق تنفيذًا يليق بها.",
    whyBody:
      "رأينا أعمالًا كثيرة تعتمد على أدوات متفرقة وحلول مؤقتة. أسسنا كيروكس لبناء تجارب مترابطة، عملية، ومهيأة للتطور مع كل مرحلة جديدة.",
    methodLabel: "كيف نفكر؟",
    methodTitle: "نبدأ من المشكلة، ونبني لما بعدها.",
    servicesLabel: "ما الذي يمكننا فعله؟",
    servicesTitle: "حلول رقمية مترابطة، من الفكرة إلى التشغيل.",
    journeyLabel: "رحلة المشروع معنا",
    journeyTitle: "خطوات واضحة. شراكة مستمرة.",
    workshopLabel: "خلف الكواليس",
    workshopTitle: "تفاصيل صغيرة تصنع فرقًا كبيرًا.",
    meaningLabel: "معنى الاسم",
    meaningTitle: "خمس قيم في اسم واحد.",
    teamLabel: "فريق كيروكس",
    teamTitle: "أشخاص يبنون معك، لا عنك.",
    storiesLabel: "من الفكرة إلى الواقع",
    storiesTitle: "أنظمة مصممة لتعمل في الحياة اليومية.",
    faqLabel: "أسئلة شائعة",
    faqTitle: "أسئلة عن QIROX",
    ctaTitle: "لديك فكرة تستحق أن ترى النور؟",
    ctaBody: "نبدأ بالاستماع، ثم نرسم الطريق معًا.",
    ctaButton: "تواصل مع فريقنا",
    learnMore: "اكتشف المزيد",
  },
  en: {
    eyebrow: "ABOUT QIROX",
    heroTag: "From idea to impact",
    heroTitle: "We turn ideas into",
    heroHighlight: "real systems",
    heroDescription:
      "We design and build digital experiences that help businesses grow — from the first idea to what comes after launch.",
    heroCta: "Start a project",
    storyLabel: "Our story",
    storyTitle: "Technology that serves business, not complicates it.",
    storyBody:
      "QIROX began with a simple belief: every business deserves digital tools designed around its real needs. We bring strategy, design, and engineering together to turn everyday challenges into clear systems built to grow.",
    whyLabel: "Why QIROX?",
    whyTitle: "Good ideas deserve thoughtful execution.",
    whyBody:
      "We saw businesses relying on disconnected tools and temporary fixes. QIROX was founded to build connected, practical experiences that are ready to evolve with every new stage.",
    methodLabel: "How we think",
    methodTitle: "Start with the problem. Build for what comes next.",
    servicesLabel: "What we do",
    servicesTitle: "Connected digital solutions, from idea to operation.",
    journeyLabel: "The journey",
    journeyTitle: "Clear steps. A lasting partnership.",
    workshopLabel: "Behind the scenes",
    workshopTitle: "Small details make a big difference.",
    meaningLabel: "The name",
    meaningTitle: "Five principles in one name.",
    teamLabel: "Meet our team",
    teamTitle: "People who build with you, not for you.",
    storiesLabel: "From idea to reality",
    storiesTitle: "Systems designed for everyday work.",
    faqLabel: "Frequently asked questions",
    faqTitle: "Questions about QIROX",
    ctaTitle: "Have an idea that deserves to go further?",
    ctaBody: "We start by listening, then map the way forward together.",
    ctaButton: "Talk to our team",
    learnMore: "Learn more",
  },
} satisfies Record<Lang, Record<string, string>>;

const methodology: Array<{ icon: LucideIcon; ar: string; en: string }> = [
  { icon: Compass, ar: "نفهم السياق", en: "Understand context" },
  { icon: Lightbulb, ar: "نحدد الأولويات", en: "Set priorities" },
  { icon: PenTool, ar: "نصمم التجربة", en: "Design the experience" },
  { icon: Code2, ar: "نبني ونختبر", en: "Build and test" },
  { icon: Rocket, ar: "نطلق ونتطور", en: "Launch and evolve" },
];

const capabilities: Array<{
  icon: LucideIcon;
  title: { ar: string; en: string };
  body: { ar: string; en: string };
}> = [
  {
    icon: Code2,
    title: { ar: "الأنظمة والمنصات", en: "Systems and platforms" },
    body: { ar: "منتجات رقمية مبنية حول عملياتك.", en: "Digital products built around your operations." },
  },
  {
    icon: Layers3,
    title: { ar: "المواقع والمتاجر", en: "Websites and stores" },
    body: { ar: "تجارب سريعة وواضحة لكل شاشة.", en: "Fast, clear experiences on every screen." },
  },
  {
    icon: Workflow,
    title: { ar: "الأتمتة والتكامل", en: "Automation and integrations" },
    body: { ar: "ربط الأدوات وتقليل العمل المتكرر.", en: "Connect tools and reduce repetitive work." },
  },
  {
    icon: Cpu,
    title: { ar: "الذكاء الاصطناعي", en: "Artificial intelligence" },
    body: { ar: "قدرات ذكية تخدم سير العمل فعليًا.", en: "Useful AI capabilities for real workflows." },
  },
  {
    icon: ShieldCheck,
    title: { ar: "الاستشارات التقنية", en: "Technology consulting" },
    body: { ar: "قرارات تقنية مبنية على أهداف واضحة.", en: "Technology decisions guided by clear goals." },
  },
  {
    icon: Wrench,
    title: { ar: "الدعم والتطوير", en: "Support and evolution" },
    body: { ar: "تحسين مستمر بعد الإطلاق والتسليم.", en: "Continuous improvement after launch." },
  },
];

const projectJourney: Array<{ number: string; ar: string; en: string }> = [
  { number: "01", ar: "نستمع ونفهم", en: "Listen and understand" },
  { number: "02", ar: "نحدد النطاق", en: "Define the scope" },
  { number: "03", ar: "نرسم التجربة", en: "Shape the experience" },
  { number: "04", ar: "نبني الحل", en: "Build the solution" },
  { number: "05", ar: "نختبر ونطلق", en: "Test and launch" },
  { number: "06", ar: "نقيس ونحسن", en: "Measure and improve" },
];

const nameValues: Array<{ letter: string; word: string; ar: string }> = [
  { letter: "Q", word: "Quality", ar: "الجودة" },
  { letter: "I", word: "Innovation", ar: "الابتكار" },
  { letter: "R", word: "Reliability", ar: "الموثوقية" },
  { letter: "O", word: "Optimization", ar: "التحسين" },
  { letter: "X", word: "Xperience", ar: "التجربة" },
];

const leaders = [
  {
    name: "محمد بن علي الدباني",
    role: "الرئيس التنفيذي",
    image: "/mohammed-aldabbani-ceo.jpg",
  },
  {
    name: "يوسف محمد درويش",
    role: "المدير التنفيذي التقني",
    image: "/youssef-darwish-cto-qirox-1.jpg",
  },
];

const faqs = [
  {
    q: "ما هي كيروكس؟",
    a: "كيروكس منظومة تقنية لبناء البنية التحتية الرقمية للأعمال، تجمع الحلول الرقمية والأتمتة والذكاء الاصطناعي والمعرفة.",
  },
  {
    q: "ماذا يعني اسم QIROX؟",
    a: "QIROX اختصار لـ Quality الجودة، Innovation الابتكار، Reliability الموثوقية، Optimization التحسين، وXperience التجربة.",
  },
  {
    q: "ما رؤية كيروكس؟",
    a: "تطمح كيروكس إلى تمكين الشركات ورواد الأعمال من بناء أعمال أكثر كفاءة واستدامة، انطلاقًا من المملكة العربية السعودية إلى الأسواق العالمية.",
  },
  {
    q: "هل ينتهي دور كيروكس عند تسليم المشروع؟",
    a: "لا. بعد الإطلاق تبدأ مرحلة التطوير والتحسين وقياس الأداء ودعم التوسع.",
  },
  {
    q: "من يقود كيروكس؟",
    a: "يقود كيروكس محمد بن علي الدباني بصفته الرئيس التنفيذي، ويوسف محمد درويش بصفته المدير التنفيذي التقني.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  dark?: boolean;
}) {
  return (
    <div className="mb-8 md:mb-12">
      <p className={`mb-2 text-[10px] font-bold uppercase tracking-[0.22em] ${dark ? "text-[#6bd2bc]" : "text-[#168f7b]"}`}>
        {eyebrow}
      </p>
      <h2 className={`font-heading text-2xl font-bold leading-tight md:text-4xl ${dark ? "text-white" : "text-[#1c2420]"}`}>
        {title}
      </h2>
    </div>
  );
}

function SketchPanel({ variant }: { variant: "dashboard" | "store" | "automation" }) {
  const labels = {
    dashboard: ["لوحة متابعة", "الطلبات", "العملاء", "الأداء"],
    store: ["متجر إلكتروني", "منتجات", "طلب جديد", "الدفع"],
    automation: ["سير العمل", "استقبال", "معالجة", "إنجاز"],
  }[variant];

  return (
    <div className="relative h-full min-h-[156px] overflow-hidden rounded-xl border border-white/10 bg-[#101714] p-4">
      <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#62cbb5]" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
        </div>
        <span className="text-[8px] tracking-widest text-white/35">QIROX / SYSTEM</span>
      </div>
      <div className="grid grid-cols-[1fr_1.35fr] gap-3">
        <div className="space-y-2">
          {labels.slice(1).map((label, index) => (
            <div key={label} className="flex items-center gap-2 rounded-md bg-white/[0.045] px-2 py-1.5">
              <span className={`h-1.5 w-1.5 rounded-sm ${index === 0 ? "bg-[#6bd2bc]" : "bg-white/20"}`} />
              <span className="text-[8px] text-white/55">{label}</span>
            </div>
          ))}
        </div>
        <div className="rounded-md border border-white/[0.07] bg-white/[0.025] p-2">
          <p className="text-[8px] text-white/40">{labels[0]}</p>
          <div className="mt-3 flex h-12 items-end gap-1">
            {[34, 58, 43, 78, 53, 90, 66].map((height, index) => (
              <span
                key={index}
                className="flex-1 rounded-t-sm bg-[#51b9a4]/70"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AboutReferenceLayout({ lang }: { lang: Lang }) {
  const copy = sectionCopy[lang];
  const isArabic = lang === "ar";
  const LeftArrow = isArabic ? ArrowLeft : ArrowRight;

  return (
    <div className="about-reference-content">
      <section className="relative isolate flex min-h-[320px] items-center overflow-hidden bg-[#07100d] text-white sm:min-h-[390px] lg:min-h-[550px]">
        <img
          src="/qirox-hero-cube.webp"
          alt=""
          className="absolute inset-y-0 left-0 -z-20 h-full w-[92%] object-cover object-center opacity-95 brightness-150 sm:w-[80%] lg:w-[72%]"
          fetchPriority="high"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-l from-[#07100d]/95 via-[#07100d]/60 to-[#07100d]/20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#07100d]/35 via-transparent to-[#07100d]/20" />
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:px-12 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className={isArabic ? "text-right" : "text-left"}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-[10px] font-medium tracking-wide text-white/75 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#62cbb5]" />
              {copy.heroTag}
            </span>
            <h1 data-about-summary className="mt-5 max-w-2xl font-heading text-3xl font-black leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
              {copy.heroTitle}
              <br />
              <span className="text-[#65cfb8]">{copy.heroHighlight}</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/65 sm:text-base sm:leading-8">
              {copy.heroDescription}
            </p>
            <div className={`mt-7 flex flex-wrap items-center gap-3 ${isArabic ? "justify-start" : "justify-start"}`}>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-[#62cbb5] px-5 py-3 text-xs font-bold text-[#132017] transition hover:bg-[#8ce0ce] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {copy.heroCta}
                <LeftArrow className="h-3.5 w-3.5" />
              </Link>
              <a
                href="#our-story"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-3 text-xs font-semibold text-white/80 transition hover:bg-white/10"
              >
                {copy.learnMore}
                <ArrowDown className="h-3.5 w-3.5" />
              </a>
            </div>
          </motion.div>
          <div className="hidden lg:block" aria-hidden="true" />
        </div>
        <a
          href="#our-story"
          aria-label={isArabic ? "انتقل إلى قصتنا" : "Scroll to our story"}
          className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 rounded-full border border-white/20 p-2 text-white/70 transition hover:bg-white/10 sm:block"
        >
          <ArrowDown className="h-4 w-4" />
        </a>
      </section>

      <section id="our-story" className="bg-[#f8f9f7] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-2 md:gap-14">
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_18px_50px_rgba(28,36,32,0.08)]">
            <img
              src="/hero-bg.jpg"
              alt={isArabic ? "مساحة عمل كيروكس" : "QIROX workspace"}
              className="aspect-[2.1/1] w-full object-cover object-[68%_center]"
              loading="lazy"
            />
          </div>
          <div className={isArabic ? "text-right" : "text-left"}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#168f7b]">{copy.storyLabel}</p>
            <h2 className="font-heading text-2xl font-bold leading-snug text-[#1c2420] sm:text-3xl">
              {copy.storyTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#68716b]">{copy.storyBody}</p>
            <Link href="/about#qirox-values" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#157c6c] hover:text-[#0f5047]">
              {copy.learnMore}
              <LeftArrow className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[1.1fr_0.9fr] md:gap-14">
          <div className="relative min-h-[210px] overflow-hidden rounded-2xl bg-[#101815] p-5 sm:min-h-[270px] sm:p-8">
            <img
              src="/qirox-hero-cube.webp"
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-left opacity-60 brightness-125"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a110f]/20 via-[#0a110f]/45 to-[#0a110f]/90" />
            <div className="relative flex h-full min-h-[170px] flex-col justify-between sm:min-h-[205px]">
              <span className="w-fit rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[9px] tracking-[0.16em] text-white/65">
                QIROX / PURPOSE
              </span>
              <div className="flex items-end justify-between gap-4">
                <div className="max-w-xs">
                  <p className="text-2xl font-black leading-tight text-white sm:text-3xl">
                    {isArabic ? "نبني لما يأتي بعد اليوم." : "Built for what comes next."}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/60">
                    {isArabic ? "أنظمة تنمو مع العمل." : "Systems that grow with business."}
                  </p>
                </div>
                <a
                  href="#how-we-think"
                  aria-label={isArabic ? "انتقل إلى طريقة عملنا" : "See how we work"}
                  className="shrink-0 rounded-full border border-white/30 p-3 text-white transition hover:bg-white/15"
                >
                  <ArrowDown className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
          <div className={isArabic ? "text-right" : "text-left"}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#168f7b]">{copy.whyLabel}</p>
            <h2 className="font-heading text-2xl font-bold leading-snug text-[#1c2420] sm:text-3xl">{copy.whyTitle}</h2>
            <p className="mt-4 text-sm leading-7 text-[#68716b]">{copy.whyBody}</p>
          </div>
        </div>
      </section>

      <section id="how-we-think" className="bg-[#0b100e] px-5 py-12 text-white sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow={copy.methodLabel} title={copy.methodTitle} dark />
          <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
            <div className="absolute start-[10%] end-[10%] top-7 hidden h-px bg-white/10 sm:block" />
            {methodology.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.en} className="relative rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 sm:border-0 sm:bg-transparent sm:p-0">
                  <div className="relative z-10 mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#62cbb5]/35 bg-[#101916] text-[#65cfb8]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[9px] font-bold tracking-[0.18em] text-white/35">0{index + 1}</span>
                  <h3 className="mt-1 text-xs font-bold text-white/85">{isArabic ? step.ar : step.en}</h3>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f8f9f7] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className={`flex flex-col justify-between gap-5 md:flex-row md:items-end ${isArabic ? "md:flex-row-reverse" : ""}`}>
            <SectionHeading eyebrow={copy.servicesLabel} title={copy.servicesTitle} />
            <Link href="/prices" className="mb-8 inline-flex w-fit items-center gap-2 text-xs font-bold text-[#157c6c]">
              {isArabic ? "استكشف الحلول" : "Explore solutions"}
              <LeftArrow className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {capabilities.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.title.en}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ delay: index * 0.04, duration: 0.35 }}
                  className={`group rounded-xl border border-[#e6eae5] bg-white p-4 transition duration-300 hover:-translate-y-1 hover:border-[#c6d8c8] hover:shadow-[0_12px_32px_rgba(28,36,32,0.07)] sm:p-6 ${isArabic ? "text-right" : "text-left"}`}
                >
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f1ed] text-[#168f7b] transition group-hover:bg-[#d5ebe4]">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-xs font-bold text-[#202a24] sm:text-sm">{item.title[lang]}</h3>
                  <p className="mt-2 text-[10px] leading-5 text-[#778079] sm:text-xs">{item.body[lang]}</p>
                  <div className="mt-4 h-px w-8 bg-[#75c9b7] transition-all group-hover:w-14" />
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow={copy.journeyLabel} title={copy.journeyTitle} />
          <div className="grid grid-cols-2 gap-x-5 gap-y-6 md:grid-cols-3 md:gap-x-8">
            {projectJourney.map((step, index) => (
              <div key={step.number} className="relative flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d5e8e2] bg-[#f1f7f4] text-[10px] font-black text-[#168f7b]">
                  {step.number}
                </span>
                <div className="pt-1">
                  <h3 className="text-xs font-bold text-[#202a24]">{isArabic ? step.ar : step.en}</h3>
                  <p className="mt-1 text-[9px] leading-4 text-[#8a928c]">
                    {isArabic ? "خطوة تشاركية بوضوح كامل." : "A collaborative step with clarity."}
                  </p>
                </div>
                {index < projectJourney.length - 1 && (
                  <span aria-hidden="true" className="absolute -end-3 top-4 hidden h-px w-3 bg-[#e4e9e4] md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0b100e] px-5 py-12 text-white sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className={`flex flex-col justify-between gap-5 md:flex-row md:items-end ${isArabic ? "md:flex-row-reverse" : ""}`}>
            <SectionHeading eyebrow={copy.workshopLabel} title={copy.workshopTitle} dark />
            <span className="mb-8 hidden text-[9px] tracking-[0.18em] text-white/35 sm:block">QIROX / STUDIO</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <SketchPanel variant="dashboard" />
            </div>
            <SketchPanel variant="store" />
            <SketchPanel variant="automation" />
            <div className="flex min-h-[156px] flex-col justify-between rounded-xl border border-white/10 bg-[#111916] p-5">
              <Sparkles className="h-5 w-5 text-[#65cfb8]" />
              <div>
                <p className="text-xs font-bold text-white/85">{isArabic ? "منظومة مترابطة" : "A connected ecosystem"}</p>
                <p className="mt-2 text-[10px] leading-5 text-white/45">
                  {isArabic ? "التصميم والهندسة والتشغيل في مسار واحد." : "Design, engineering, and operations in one flow."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="qirox-values" className="bg-[#f8f9f7] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow={copy.meaningLabel} title={copy.meaningTitle} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5" dir="ltr">
            {nameValues.map((item, index) => (
              <div key={item.letter} dir={isArabic ? "rtl" : "ltr"} className="group rounded-xl border border-[#e5e9e4] bg-white p-4 text-center transition hover:-translate-y-1 hover:shadow-md sm:p-6">
                <span className={`font-heading text-3xl font-black sm:text-4xl ${index === 4 ? "text-[#168f7b]" : "text-[#1e2922]"}`}>
                  {item.letter === "Q" ? (
                    <img
                      src="/qirox-icon-nobg.png"
                      alt={isArabic ? "أيقونة QIROX" : "QIROX icon"}
                      className="mx-auto h-8 w-8 object-contain brightness-50 dark:brightness-0 dark:invert sm:h-10 sm:w-10"
                    />
                  ) : item.letter}
                </span>
                <p className="mt-2 text-[9px] font-bold text-[#6d786f] sm:text-[10px]">{isArabic ? item.ar : item.word}</p>
                <p className="mt-1 text-[8px] text-[#9aa29b]">{isArabic ? item.word : item.ar}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="team" className="bg-white px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow={copy.teamLabel} title={copy.teamTitle} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {leaders.map((leader, index) => (
              <article key={leader.name} className="overflow-hidden rounded-xl border border-[#e6eae5] bg-[#fbfcfa]">
                <div className="relative aspect-[1.2/1] overflow-hidden bg-[#e8eee8]">
                  <img
                    src={leader.image}
                    alt={leader.name}
                    className="h-full w-full object-cover object-top"
                    loading="lazy"
                  />
                  <span className="absolute bottom-2 start-2 rounded-full bg-white/90 px-2 py-1 text-[8px] font-bold text-[#168f7b]">
                    {index === 0 ? "01" : "02"}
                  </span>
                </div>
                <div className={`p-3 sm:p-4 ${isArabic ? "text-right" : "text-left"}`}>
                  <h3 className="text-[10px] font-bold text-[#202a24] sm:text-xs">{leader.name}</h3>
                  <p className="mt-1 text-[9px] text-[#7e8880]">{isArabic ? leader.role : index === 0 ? "Chief Executive Officer" : "Chief Technology Officer"}</p>
                </div>
              </article>
            ))}
            <article className={`col-span-2 grid min-h-[180px] overflow-hidden rounded-xl border border-[#e6eae5] bg-[#0b1111] md:col-span-2 md:grid-cols-[0.95fr_1.05fr] ${isArabic ? "text-right" : "text-left"}`}>
              <div className="relative min-h-[170px] bg-[#e8eee8]">
                <img
                  src="/hero-bg.jpg"
                  alt={isArabic ? "عضو من فريق كيروكس في مساحة العمل" : "A QIROX team member in the workspace"}
                  className="absolute inset-0 h-full w-full object-cover object-[75%_center]"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col justify-between gap-5 p-5 sm:p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#65cfb8]">
                  <Boxes className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">{isArabic ? "فريق متعدد التخصصات" : "A multidisciplinary team"}</h3>
                  <p className="mt-1 text-[10px] leading-5 text-white/65">
                    {isArabic ? "تصميم، هندسة، ومنتج يعملون معك من البداية." : "Design, engineering, and product working with you from day one."}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-[#f8f9f7] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow={copy.storiesLabel} title={copy.storiesTitle} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { icon: Braces, title: isArabic ? "أنظمة داخلية" : "Internal systems", kind: "dashboard" as const },
              { icon: Globe2, title: isArabic ? "تجارب رقمية" : "Digital experiences", kind: "store" as const },
              { icon: Workflow, title: isArabic ? "عمليات أكثر ذكاءً" : "Smarter operations", kind: "automation" as const },
            ].map((story) => {
              const Icon = story.icon;
              return (
                <article key={story.title} className="overflow-hidden rounded-xl border border-[#e5e9e4] bg-white">
                  <div className="p-3">
                    <SketchPanel variant={story.kind} />
                  </div>
                  <div className={`flex items-center justify-between gap-3 px-4 pb-4 ${isArabic ? "flex-row-reverse text-right" : "text-left"}`}>
                    <div>
                      <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#71917a]">QIROX / DIGITAL</p>
                      <h3 className="mt-1 text-xs font-bold text-[#202a24]">{story.title}</h3>
                    </div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e6f1ed] text-[#168f7b]">
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-4xl">
          <SectionHeading eyebrow={copy.faqLabel} title={copy.faqTitle} />
          <div className="divide-y divide-[#e7ebe6] border-y border-[#e7ebe6]">
            {faqs.map((faq, index) => (
              <details key={faq.q} className="group py-4">
                <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 text-xs font-bold text-[#202a24] marker:hidden [&::-webkit-details-marker]:hidden ${isArabic ? "text-right" : "text-left"}`}>
                  <span>{isArabic ? faq.q : [
                    "What is QIROX?",
                    "What does the name QIROX mean?",
                    "What is QIROX's vision?",
                    "Does QIROX's work end at delivery?",
                    "Who leads QIROX?",
                  ][index]}</span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#e5e9e4] text-[#168f7b] transition group-open:rotate-45">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                </summary>
                <p className={`max-w-3xl pt-3 text-[11px] leading-6 text-[#737d75] ${isArabic ? "text-right" : "text-left"}`}>
                  {isArabic ? faq.a : [
                    "QIROX is a technology ecosystem that builds digital business infrastructure through connected digital solutions, automation, AI, and knowledge.",
                    "QIROX stands for Quality, Innovation, Reliability, Optimization, and Xperience.",
                    "QIROX aims to help businesses and entrepreneurs build more efficient and sustainable work, from Saudi Arabia to global markets.",
                    "No. After launch, we continue with development, improvement, performance measurement, and support for growth.",
                    "QIROX is led by CEO Mohammed bin Ali Aldabbani and CTO Yousef Mohammed Darwish.",
                  ][index]}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#08100d] px-5 py-12 text-white sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <img
          src="/qirox-hero-cube.webp"
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover object-left opacity-55 brightness-125"
          loading="lazy"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-l from-[#08100d]/95 via-[#08100d]/80 to-[#08100d]/50" />
        <div className={`mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center ${isArabic ? "sm:flex-row-reverse" : ""}`}>
          <div className={isArabic ? "text-right" : "text-left"}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#65cfb8]">{copy.eyebrow}</p>
            <h2 className="font-heading text-2xl font-bold leading-tight sm:text-3xl">{copy.ctaTitle}</h2>
            <p className="mt-3 text-xs text-white/60">{copy.ctaBody}</p>
          </div>
          <Link
            href="/contact"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#62cbb5] px-5 py-3 text-xs font-bold text-[#132017] transition hover:bg-[#8ce0ce]"
          >
            {copy.ctaButton}
            <ArrowUpLeft className={`h-3.5 w-3.5 ${isArabic ? "" : "rotate-180"}`} />
          </Link>
        </div>
      </section>
    </div>
  );
}