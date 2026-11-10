import "./_group.css";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpLeft,
  Boxes,
  Braces,
  ChevronDown,
  Code2,
  Compass,
  Cpu,
  Globe2,
  Layers3,
  Lightbulb,
  Menu,
  PenTool,
  Rocket,
  ShieldCheck,
  Workflow,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";

const capabilities = [
  { icon: Code2, title: "الأنظمة والمنصات", body: "منتجات رقمية مبنية حول عملياتك." },
  { icon: Layers3, title: "المواقع والمتاجر", body: "تجارب سريعة وواضحة لكل شاشة." },
  { icon: Workflow, title: "الأتمتة والتكامل", body: "ربط الأدوات وتقليل العمل المتكرر." },
  { icon: Cpu, title: "الذكاء الاصطناعي", body: "قدرات ذكية تخدم سير العمل فعليًا." },
  { icon: ShieldCheck, title: "الاستشارات التقنية", body: "قرارات تقنية مبنية على أهداف واضحة." },
  { icon: Wrench, title: "الدعم والتطوير", body: "تحسين مستمر بعد الإطلاق والتسليم." },
];

const method = [
  { icon: Compass, label: "نفهم السياق" },
  { icon: Lightbulb, label: "نحدد الأولويات" },
  { icon: PenTool, label: "نصمم التجربة" },
  { icon: Code2, label: "نبني ونختبر" },
  { icon: Rocket, label: "نطلق ونتطور" },
];

const journey = ["نستمع ونفهم", "نحدد النطاق", "نرسم التجربة", "نبني الحل", "نختبر ونطلق", "نقيس ونحسن"];

const values = [
  { letter: "Q", english: "Quality", arabic: "الجودة" },
  { letter: "I", english: "Innovation", arabic: "الابتكار" },
  { letter: "R", english: "Reliability", arabic: "الموثوقية" },
  { letter: "O", english: "Optimization", arabic: "التحسين" },
  { letter: "X", english: "Xperience", arabic: "التجربة" },
];

const leaders = [
  {
    name: "محمد بن علي الدباني",
    role: "الرئيس التنفيذي",
    image: "/__mockup/images/team/mohammed-aldabbani-ceo.jpg",
    index: "01",
  },
  {
    name: "يوسف محمد درويش",
    role: "المدير التنفيذي التقني",
    image: "/__mockup/images/team/youssef-darwish-cto.jpg",
    index: "02",
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

function Eyebrow({ children, inverse = false }: { children: string; inverse?: boolean }) {
  return (
    <p className={`mb-3 text-[10px] font-bold tracking-[0.22em] ${inverse ? "text-[#70d7c2]" : "text-[#168f7b]"}`}>
      {children}
    </p>
  );
}

function Heading({
  eyebrow,
  title,
  inverse = false,
}: {
  eyebrow: string;
  title: string;
  inverse?: boolean;
}) {
  return (
    <div className="mb-9 md:mb-12">
      <Eyebrow inverse={inverse}>{eyebrow}</Eyebrow>
      <h2 className={`font-heading text-2xl font-bold leading-[1.45] sm:text-3xl lg:text-[2.45rem] ${inverse ? "text-[#f4f4ef]" : "text-[#202523]"}`}>
        {title}
      </h2>
    </div>
  );
}

function ProductPreview({ type }: { type: "system" | "commerce" | "workflow" }) {
  const panelTitle = {
    system: "لوحة العمليات",
    commerce: "متجر الأعمال",
    workflow: "مسار العمل",
  }[type];
  const rows = {
    system: ["الطلبات", "العملاء", "الأداء"],
    commerce: ["المنتجات", "طلب جديد", "المدفوعات"],
    workflow: ["استقبال", "معالجة", "إنجاز"],
  }[type];
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-white/[0.09] bg-[#141a19] p-4 sm:p-5">
      <div className="mb-5 flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-[#66cbb5]" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
        </div>
        <span className="text-[8px] tracking-[0.2em] text-white/35">QIROX / SYSTEM</span>
      </div>
      <div className="grid grid-cols-[.82fr_1.18fr] gap-3">
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={row} className="flex items-center gap-2 rounded-lg bg-white/[0.045] px-2.5 py-2">
              <span className={`h-1.5 w-1.5 rounded-full ${index === 0 ? "bg-[#68cdb7]" : "bg-white/20"}`} />
              <span className="text-[8px] text-white/55">{row}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-2.5">
          <p className="text-[8px] text-white/45">{panelTitle}</p>
          <div className="mt-3 flex h-[58px] items-end gap-1">
            {[35, 52, 41, 76, 57, 88, 69].map((height, i) => (
              <span key={i} className="flex-1 rounded-t-sm bg-[#51b9a4]/75" style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Corrected() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <main dir="rtl" className="about-reference-content min-h-[100dvh] overflow-hidden bg-[#f3f3ef] text-[#202523]">
      <header className="relative z-30 bg-[#f7f7f3]">
        <div className="mx-auto flex min-h-[70px] max-w-[1320px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
          <a href="#top" className="flex items-center gap-2.5" aria-label="QIROX إلى الأعلى">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#14201e] text-sm font-black tracking-[-0.1em] text-white">Q</span>
            <span className="text-[17px] font-black tracking-[0.08em] text-[#202523]">QIROX</span>
          </a>

          <nav className="hidden items-center gap-7 text-[11px] font-semibold text-[#56615e] lg:flex" aria-label="التنقل الرئيسي">
            <a className="transition hover:text-[#138c79]" href="#our-story">قصتنا</a>
            <a className="transition hover:text-[#138c79]" href="#how-we-think">منهجيتنا</a>
            <a className="transition hover:text-[#138c79]" href="#services">حلولنا</a>
            <a className="transition hover:text-[#138c79]" href="#team">فريقنا</a>
            <a className="transition hover:text-[#138c79]" href="#faq">الأسئلة الشائعة</a>
          </nav>

          <a href="/contact" className="hidden rounded-full bg-[#1b2825] px-5 py-3 text-[11px] font-bold text-white transition hover:bg-[#167d6d] sm:inline-flex">
            ابدأ مشروعك معنا
          </a>
          <button
            type="button"
            aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d9ded9] text-[#24302d] lg:hidden"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
        {menuOpen && (
          <nav className="absolute inset-x-0 top-full z-40 grid gap-1 border-t border-[#e4e6e1] bg-[#f7f7f3] px-5 py-4 shadow-xl lg:hidden" aria-label="التنقل">
            {[
              ["قصتنا", "#our-story"],
              ["منهجيتنا", "#how-we-think"],
              ["حلولنا", "#services"],
              ["فريقنا", "#team"],
              ["الأسئلة الشائعة", "#faq"],
            ].map(([label, href]) => (
              <a key={href} href={href} onClick={closeMenu} className="rounded-xl px-3 py-3 text-sm font-semibold text-[#38423f] hover:bg-[#e9eeea]">{label}</a>
            ))}
            <a href="/contact" onClick={closeMenu} className="mt-2 rounded-xl bg-[#1b2825] px-4 py-3 text-center text-sm font-bold text-white">ابدأ مشروعك معنا</a>
          </nav>
        )}
      </header>

      <section id="top" className="relative isolate overflow-hidden bg-[#0b1111] text-white">
        <img
          src="/__mockup/images/qirox-hero-cube.webp"
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className="absolute inset-y-0 left-0 -z-20 h-full w-full object-cover object-[36%_52%] opacity-70 sm:object-center lg:w-[72%] lg:opacity-90"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-l from-[#0b1111] via-[#0b1111]/90 to-[#0b1111]/20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0b1111]/90 via-transparent to-[#0b1111]/10" />
        <div className="mx-auto grid min-h-[570px] max-w-[1320px] items-center gap-10 px-5 py-16 sm:min-h-[630px] sm:px-8 lg:min-h-[680px] lg:grid-cols-[.94fr_1.06fr] lg:px-12 lg:py-20">
          <div className="max-w-[590px] text-right">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.045] px-3.5 py-2 text-[10px] font-semibold text-white/75 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5bc6af]" />
              من الفكرة إلى الأثر
            </span>
            <h1 data-about-summary className="mt-6 font-heading text-[2.65rem] font-black leading-[1.22] tracking-[-0.045em] sm:text-6xl lg:text-[4.65rem]">
              نحوّل الأفكار إلى
              <span className="mt-1 block text-[#65cfb8]">أنظمة حقيقية.</span>
            </h1>
            <p className="mt-6 max-w-[510px] text-sm leading-8 text-[#c3ccca] sm:text-base sm:leading-9">
              نصمم ونبني تجارب رقمية تساعد الأعمال على النمو — من أول فكرة، إلى ما بعد الإطلاق.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="/contact" className="inline-flex items-center gap-3 rounded-full bg-[#62cbb5] px-6 py-3.5 text-xs font-bold text-[#10211e] transition hover:bg-[#87dfcb]">
                ابدأ مشروعك معنا <ArrowLeft className="h-4 w-4" />
              </a>
              <a href="#our-story" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3.5 text-xs font-semibold text-white/80 transition hover:bg-white/10">
                اكتشف المزيد <ArrowDown className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="mt-12 flex items-center gap-4 border-t border-white/10 pt-5">
              <span className="text-[10px] font-bold tracking-[0.18em] text-[#6bd2bc]">01 / 05</span>
              <span className="h-px w-12 bg-[#61c8b2]/70" />
              <span className="text-[10px] text-white/45">حلول رقمية تنمو مع أعمالك</span>
            </div>
          </div>
          <div aria-hidden="true" className="hidden lg:block" />
        </div>
        <a href="#our-story" aria-label="انتقل إلى قصتنا" className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 rounded-full border border-white/20 p-3 text-white/65 transition hover:bg-white/10 sm:block">
          <ArrowDown className="h-4 w-4" />
        </a>
      </section>

      <section id="our-story" className="bg-[#f3f3ef] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <div className="relative">
            <div className="absolute -bottom-4 -left-4 h-1/2 w-1/2 rounded-[24px] border border-[#63c8b2]/50 sm:-bottom-5 sm:-left-5" />
            <img
              src="/__mockup/images/qirox-office.jpg"
              alt="مساحة عمل QIROX في الرياض"
              loading="lazy"
              className="relative aspect-[1.34/1] w-full rounded-[22px] object-cover object-[66%_center] shadow-[0_22px_54px_rgba(22,34,31,.15)]"
            />
            <div className="absolute bottom-4 right-4 rounded-xl border border-white/25 bg-[#111a18]/80 px-4 py-3 text-right text-white backdrop-blur-md sm:bottom-6 sm:right-6">
              <span className="block text-[8px] tracking-[0.2em] text-[#80d9c7]">QIROX / RIYADH</span>
              <span className="mt-1 block text-xs font-semibold">نصمم لما هو قادم</span>
            </div>
          </div>
          <div className="text-right">
            <Eyebrow>قصتنا</Eyebrow>
            <h2 className="font-heading text-3xl font-bold leading-[1.55] tracking-tight text-[#202523] sm:text-4xl">
              التقنية التي تخدم العمل،<br className="hidden sm:block" /> لا تعقّده.
            </h2>
            <p className="mt-5 text-sm leading-8 text-[#5e6965] sm:text-[15px] sm:leading-9">
              بدأت QIROX من قناعة بسيطة: كل عمل يستحق أدوات رقمية مصممة حول احتياجه الحقيقي. نجمع الاستراتيجية والتصميم والهندسة في فريق واحد، لنحوّل التحديات اليومية إلى أنظمة واضحة وقابلة للنمو.
            </p>
            <a href="#qirox-values" className="mt-7 inline-flex items-center gap-2 border-b border-[#1f9d88]/40 pb-2 text-xs font-bold text-[#157c6c] transition hover:text-[#0f5047]">
              اكتشف المزيد <ArrowLeft className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto grid max-w-[1200px] items-center gap-9 lg:grid-cols-[1fr_.9fr] lg:gap-16">
          <div className="relative isolate flex min-h-[290px] flex-col justify-between overflow-hidden rounded-[24px] bg-[#101716] p-6 text-right text-white sm:min-h-[340px] sm:p-9">
            <img src="/__mockup/images/qirox-hero-cube.webp" alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover object-left opacity-55" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-l from-[#101716]/95 via-[#101716]/55 to-[#101716]/10" />
            <span className="w-fit rounded-full border border-white/15 px-3 py-1.5 text-[8px] tracking-[0.2em] text-white/65">QIROX / PURPOSE</span>
            <div className="max-w-sm">
              <p className="font-heading text-3xl font-bold leading-[1.4] sm:text-4xl">نبني لما يأتي بعد اليوم.</p>
              <p className="mt-3 text-xs leading-6 text-white/55">أنظمة مترابطة، عملية، ومهيأة للتطور مع كل مرحلة جديدة.</p>
              <a href="#how-we-think" className="mt-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 transition hover:bg-white/15" aria-label="انتقل إلى منهجيتنا">
                <ArrowDown className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="text-right">
            <Eyebrow>لماذا تأسست QIROX؟</Eyebrow>
            <h2 className="font-heading text-2xl font-bold leading-[1.55] text-[#202523] sm:text-3xl">
              لأن الفكرة الجيدة تستحق تنفيذًا يليق بها.
            </h2>
            <p className="mt-4 text-sm leading-8 text-[#65706c]">
              رأينا أعمالًا كثيرة تعتمد على أدوات متفرقة وحلول مؤقتة. أسسنا كيروكس لبناء تجارب مترابطة، عملية، ومهيأة للتطور مع كل مرحلة جديدة.
            </p>
          </div>
        </div>
      </section>

      <section id="how-we-think" className="bg-[#111817] px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-[1200px]">
          <Heading eyebrow="كيف نفكر؟" title="نبدأ من المشكلة، ونبني لما بعدها." inverse />
          <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-5">
            <div className="absolute start-[9%] end-[9%] top-8 hidden h-px bg-white/10 sm:block" />
            {method.map(({ icon: Icon, label }, index) => (
              <div key={label} className="relative rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:border-0 sm:bg-transparent sm:p-0">
                <div className="relative z-10 mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#62cbb5]/35 bg-[#17211f] text-[#68d0ba]">
                  <Icon className="h-5 w-5" strokeWidth={1.7} />
                </div>
                <span className="text-[9px] font-bold tracking-[0.2em] text-white/35">0{index + 1}</span>
                <h3 className="mt-2 text-xs font-bold text-white/85">{label}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="bg-[#f3f3ef] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <Heading eyebrow="ما الذي يمكننا فعله؟" title="حلول رقمية مترابطة، من الفكرة إلى التشغيل." />
            <a href="/prices" className="mb-9 inline-flex w-fit items-center gap-2 text-xs font-bold text-[#147c6d] transition hover:text-[#0f5148]">
              استكشف الحلول <ArrowLeft className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {capabilities.map(({ icon: Icon, title, body }, index) => (
              <article key={title} className="group relative overflow-hidden rounded-[18px] border border-[#e2e4de] bg-[#fafaf7] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#a5d4c9] hover:shadow-[0_18px_40px_rgba(28,47,42,.08)] sm:p-6">
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#e6f1ed] text-[#188b77] transition group-hover:bg-[#d5ebe4]">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span className="text-[9px] font-bold tracking-[0.18em] text-[#9da8a2]">0{index + 1}</span>
                </div>
                <h3 className="mt-7 text-sm font-bold text-[#242d2a]">{title}</h3>
                <p className="mt-2 text-xs leading-6 text-[#78827d]">{body}</p>
                <div className="mt-5 h-px w-9 bg-[#75c9b7] transition-all group-hover:w-16" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-[1200px]">
          <Heading eyebrow="رحلة المشروع معنا" title="خطوات واضحة. شراكة مستمرة." />
          <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-3">
            {journey.map((item, index) => (
              <div key={item} className="relative flex items-start gap-4 border-t border-[#e7eae5] py-5 sm:px-4 lg:py-7">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d5e8e2] bg-[#f1f7f4] text-[10px] font-black text-[#188b77]">{String(index + 1).padStart(2, "0")}</span>
                <div className="pt-1">
                  <h3 className="text-sm font-bold text-[#29322f]">{item}</h3>
                  <p className="mt-1.5 text-[10px] leading-5 text-[#8b9690]">خطوة تشاركية بوضوح كامل.</p>
                </div>
                {index < journey.length - 1 && <span aria-hidden="true" className="absolute -bottom-px right-0 h-[2px] w-12 bg-[#58bca7]" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#111817] px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <Heading eyebrow="خلف الكواليس" title="تفاصيل صغيرة تصنع فرقًا كبيرًا." inverse />
            <span className="mb-12 hidden text-[9px] tracking-[0.2em] text-white/35 sm:block">QIROX / STUDIO</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
            <div className="sm:col-span-2 lg:col-span-1"><ProductPreview type="system" /></div>
            <ProductPreview type="commerce" />
            <ProductPreview type="workflow" />
          </div>
          <div className="mt-3 flex flex-col justify-between gap-6 rounded-[18px] border border-white/[0.08] bg-[#17201e] p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#1d302b] text-[#6ad2bc]"><Boxes className="h-5 w-5" /></span>
              <div>
                <p className="text-sm font-bold text-white/90">منظومة مترابطة</p>
                <p className="mt-1 text-xs leading-6 text-white/45">التصميم والهندسة والتشغيل في مسار واحد.</p>
              </div>
            </div>
            <a href="#team" className="inline-flex w-fit items-center gap-2 text-xs font-bold text-[#76d8c4] transition hover:text-white">تعرّف على من يبنونها <ArrowLeft className="h-3.5 w-3.5" /></a>
          </div>
        </div>
      </section>

      <section id="qirox-values" className="bg-[#f3f3ef] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-[1200px]">
          <Heading eyebrow="معنى الاسم" title="خمس قيم في اسم واحد." />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {values.map(({ letter, english, arabic }, index) => (
              <div key={letter} className="group relative overflow-hidden rounded-[18px] border border-[#e2e4de] bg-[#fafaf7] px-4 py-6 text-center transition hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(28,47,42,.08)] sm:px-5 sm:py-8">
                <span className={`font-heading text-5xl font-black leading-none ${index === 4 ? "text-[#168f7b]" : "text-[#222b28]"}`}>{letter}</span>
                <p className="mt-4 text-xs font-bold text-[#303b37]">{arabic}</p>
                <p className="mt-1.5 text-[9px] font-medium tracking-wide text-[#8c9791]">{english}</p>
                <span className="absolute inset-x-1/3 bottom-0 h-[2px] bg-[#52bca6] opacity-0 transition group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="team" className="bg-white px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid items-end gap-5 lg:grid-cols-[.78fr_1.22fr] lg:gap-16">
            <div className="text-right">
              <Eyebrow>قيادة كيروكس</Eyebrow>
              <h2 className="font-heading text-3xl font-bold leading-[1.5] text-[#202523] sm:text-4xl">أشخاص يبنون معك، لا عنك.</h2>
            </div>
            <p className="max-w-xl text-right text-sm leading-8 text-[#6b7671]">
              قيادة تجمع بين فهم الأعمال والخبرة التقنية، ويعمل معها فريق متعدد التخصصات على تحويل التحديات إلى حلول قابلة للاستخدام والنمو.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-14">
            {leaders.map((leader) => (
              <article key={leader.name} className="group relative flex min-h-[275px] overflow-hidden rounded-[22px] bg-[#e7ece9] sm:min-h-[360px]">
                <img
                  src={leader.image}
                  alt={leader.name}
                  loading="lazy"
                  className={`absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.025] ${leader.index === "01" ? "object-[center_28%]" : "object-[center_34%]"}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#101816]/90 via-[#101816]/10 to-transparent" />
                <span className="absolute right-5 top-5 rounded-full border border-white/45 bg-[#17211f]/20 px-3 py-1.5 text-[9px] font-bold tracking-[0.18em] text-white backdrop-blur">{leader.index}</span>
                <div className="relative mt-auto flex w-full items-end justify-between gap-4 p-5 text-right text-white sm:p-7">
                  <div>
                    <h3 className="font-heading text-lg font-bold sm:text-xl">{leader.name}</h3>
                    <p className="mt-1.5 text-xs text-white/75">{leader.role}</p>
                  </div>
                  <span className="mb-1 h-8 w-8 shrink-0 rounded-full border border-white/40 p-2 text-[#8cdecc]">
                    <ArrowUpLeft className="h-full w-full" />
                  </span>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-4 grid gap-4 rounded-[22px] border border-[#e4e8e3] bg-[#f4f6f2] p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-6 sm:p-7">
            <span className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-[#e0efea] text-[#188b77]"><Boxes className="h-5 w-5" /></span>
            <div className="text-right">
              <h3 className="text-sm font-bold text-[#27312d]">فريق متعدد التخصصات</h3>
              <p className="mt-2 text-xs leading-6 text-[#737e79]">تصميم، هندسة، ومنتج يعملون معك من البداية. فريق واحد يعمل على تفاصيل كل تجربة من أول سؤال إلى ما بعد الإطلاق.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f3f3ef] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-[1200px]">
          <Heading eyebrow="من الفكرة إلى الواقع" title="أنظمة مصممة لتعمل في الحياة اليومية." />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {[
              { icon: Braces, title: "أنظمة داخلية", type: "system" as const, number: "01" },
              { icon: Globe2, title: "تجارب رقمية", type: "commerce" as const, number: "02" },
              { icon: Workflow, title: "عمليات أكثر ذكاءً", type: "workflow" as const, number: "03" },
            ].map(({ icon: Icon, title, type, number }) => (
              <article key={title} className="overflow-hidden rounded-[20px] border border-[#e2e4de] bg-[#fafaf7] p-3.5 sm:p-4">
                <ProductPreview type={type} />
                <div className="flex items-center justify-between gap-4 px-1 pb-1 pt-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e7f1ed] text-[#188b77]"><Icon className="h-4 w-4" /></span>
                    <div>
                      <p className="text-[8px] font-bold tracking-[0.16em] text-[#82918a]">QIROX / DIGITAL</p>
                      <h3 className="mt-1 text-xs font-bold text-[#26312d]">{title}</h3>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold tracking-[0.16em] text-[#9da8a2]">{number}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
          <div>
            <Eyebrow>أسئلة شائعة</Eyebrow>
            <h2 className="font-heading text-3xl font-bold leading-[1.5] text-[#202523] sm:text-4xl">أسئلة عن QIROX</h2>
            <p className="mt-4 text-sm leading-7 text-[#78827d]">إجابات واضحة عن طريقة عملنا وما نبنيه معك.</p>
          </div>
          <div className="divide-y divide-[#e6e9e4] border-y border-[#e6e9e4]">
            {faqs.map((faq) => (
              <details key={faq.q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-right text-sm font-bold text-[#28312e] marker:hidden [&::-webkit-details-marker]:hidden">
                  <span>{faq.q}</span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#dfe5e0] text-[#168f7b] transition group-open:rotate-180">
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </summary>
                <p className="max-w-3xl pb-5 pl-10 text-right text-xs leading-7 text-[#737e79]">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#0b1111] px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <img src="/__mockup/images/qirox-hero-cube.webp" alt="" aria-hidden="true" loading="lazy" className="absolute inset-y-0 left-0 -z-20 h-full w-full object-cover object-[32%_58%] opacity-40 sm:w-3/4 sm:opacity-60" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-l from-[#0b1111] via-[#0b1111]/90 to-[#0b1111]/35" />
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div className="text-right">
            <Eyebrow inverse>عن كيروكس</Eyebrow>
            <h2 className="font-heading text-2xl font-bold leading-[1.5] sm:text-4xl">لديك فكرة تستحق أن ترى النور؟</h2>
            <p className="mt-3 text-sm leading-7 text-white/60">نبدأ بالاستماع، ثم نرسم الطريق معًا.</p>
          </div>
          <a href="/contact" className="inline-flex shrink-0 items-center gap-3 rounded-full bg-[#65cdb7] px-6 py-4 text-xs font-bold text-[#10211e] transition hover:bg-[#8ce0ce]">
            تواصل مع فريقنا <ArrowUpLeft className="h-4 w-4" />
          </a>
        </div>
      </section>

      <footer className="bg-[#080d0d] px-5 py-6 text-white/45 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 text-[9px] sm:flex-row">
          <span className="font-bold tracking-[0.2em] text-white/70">QIROX</span>
          <span>من المملكة العربية السعودية، إلى ما هو أبعد.</span>
          <a href="#top" className="transition hover:text-[#71d4bf]">العودة إلى الأعلى <ArrowUpLeft className="mr-1 inline h-3 w-3" /></a>
        </div>
      </footer>
    </main>
  );
}