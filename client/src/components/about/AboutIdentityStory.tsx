import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpLeft,
  BrainCircuit,
  CircleDot,
  Compass,
  Eye,
  Handshake,
  Lightbulb,
  Network,
  Quote,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
} from "lucide-react";
import { Link } from "wouter";

type AboutIdentityStoryProps = {
  lang: string;
};

const qiroxMeaning = [
  {
    letter: "Q",
    word: "Quality",
    ar: "الجودة",
    description: "معايير عالية في كل تفصيلة.",
    icon: ShieldCheck,
  },
  {
    letter: "I",
    word: "Innovation",
    ar: "الابتكار",
    description: "أفكار جديدة تتحول إلى قيمة.",
    icon: Lightbulb,
  },
  {
    letter: "R",
    word: "Reliability",
    ar: "الموثوقية",
    description: "أنظمة وشراكة يمكن الاعتماد عليها.",
    icon: Handshake,
  },
  {
    letter: "O",
    word: "Optimization",
    ar: "التحسين",
    description: "تحسين مستمر لأداء الأعمال.",
    icon: Workflow,
  },
  {
    letter: "X",
    word: "Xperience",
    ar: "التجربة",
    description: "تجربة واضحة وأسهل وأفضل.",
    icon: Sparkles,
  },
];

const values = [
  { title: "المرونة", english: "Adaptability", description: "نتكيف مع التغيير ونستجيب لاحتياجات الأعمال دون أن نفرّط في الجودة.", icon: Compass },
  { title: "الصدق والشفافية", english: "Integrity", description: "وعودنا تعكس واقع أعمالنا، وقراراتنا مبنية على الوضوح والمسؤولية.", icon: Eye },
  { title: "الإبداع والابتكار", english: "Innovation", description: "نستخدم التقنية لإعادة التفكير في الطرق التقليدية وبناء قيمة حقيقية.", icon: Lightbulb },
  { title: "التمكين", english: "Empowerment", description: "نساعد العميل على فهم خياراته واتخاذ قرارات أفضل وبناء قدرة مستدامة.", icon: Rocket },
  { title: "الشراكة طويلة الأمد", english: "Partnership", description: "لا تنتهي علاقتنا عند الإطلاق؛ فبعد التسليم تبدأ مرحلة التطوير والنمو.", icon: Handshake },
  { title: "نجاح العميل", english: "Customer Success", description: "المؤشر الحقيقي لنجاحنا هو القيمة التي يحققها العميل بعد تشغيل الحل.", icon: Target },
  { title: "مجتمع المعرفة", english: "Community Impact", description: "نشارك المعرفة ونمكّن الجيل القادم من المبتكرين والمتخصصين.", icon: Users },
  { title: "التميز في الحلول", english: "Solution Excellence", description: "نوازن بين الابتكار والجودة وقابلية التوسع في كل حل نبنيه.", icon: BrainCircuit },
];

const strategicPillars = [
  {
    number: "01",
    title: "الذراع التقني الأول للشركات",
    description: "من تحويل الفكرة إلى منتج، مروراً ببناء الأنظمة وأتمتة العمليات، وصولاً إلى بنية رقمية تساعد المؤسسة على التوسع.",
    icon: Network,
  },
  {
    number: "02",
    title: "منظومة منتجات تقنية",
    description: "تطوير منتجات مملوكة وحلول متخصصة تخدم قطاعات مختلفة وتنافس محلياً وإقليمياً وعالمياً.",
    icon: Rocket,
  },
  {
    number: "03",
    title: "الأتمتة والذكاء الاصطناعي",
    description: "بناء بيئات تشغيلية ذكية تقلل العمل اليدوي، وترفع الإنتاجية، وتحسن جودة القرار.",
    icon: BrainCircuit,
  },
  {
    number: "04",
    title: "أكاديمية كيروكس",
    description: "نشر المعرفة التقنية والإدارية وريادة الأعمال وتمكين الطلاب والمهنيين والجيل القادم من المبتكرين.",
    icon: Users,
  },
  {
    number: "05",
    title: "علامة تقنية عالمية",
    description: "الانطلاق من المملكة العربية السعودية لبناء منتجات وخدمات قادرة على المنافسة في الأسواق الإقليمية والدولية.",
    icon: Sparkles,
  },
];

const aboutFaqs = [
  {
    question: "ما هي كيروكس؟",
    answer: "كيروكس هي منظومة تقنية لبناء البنية التحتية الرقمية للشركات، تجمع بين الحلول الرقمية المتكاملة، الأتمتة، الذكاء الاصطناعي، المنتجات التقنية، والمعرفة.",
  },
  {
    question: "ماذا يعني اسم QIROX؟",
    answer: "QIROX اختصار لـ Quality الجودة، Innovation الابتكار، Reliability الموثوقية، Optimization التحسين، وXperience التجربة.",
  },
  {
    question: "ما رؤية كيروكس؟",
    answer: "تطمح كيروكس إلى أن تصبح المنظومة التقنية الأكثر تأثيراً في تمكين الشركات ورواد الأعمال من بناء أعمال أكثر كفاءة واستدامة، انطلاقاً من المملكة العربية السعودية إلى الأسواق العالمية.",
  },
  {
    question: "هل ينتهي دور كيروكس عند تسليم المشروع؟",
    answer: "لا. تؤمن كيروكس بأن تسليم المشروع ليس نهاية العلاقة مع العميل، بل بدايتها؛ فبعد الإطلاق تبدأ مرحلة التطوير والتحسين وقياس الأداء ودعم التوسع.",
  },
  {
    question: "من يقود كيروكس؟",
    answer: "يقود كيروكس محمد بن علي الدباني بصفته الرئيس التنفيذي، ويوسف محمد درويش بصفته المدير التنفيذي التقني.",
  },
];

const leadership = [
  {
    name: "محمد بن علي الدباني",
    latin: "Mohammed bin Ali Al-Dabbani",
    role: "الرئيس التنفيذي",
    roleEn: "Chief Executive Officer",
    image: "/mohammed-aldabbani-ceo.jpg",
    href: "/mohammed-aldabbani",
    alt: "محمد بن علي الدباني الرئيس التنفيذي لشركة كيروكس",
    message: "بالنسبة لعملائنا، قد يبدأ المشروع عند توقيع العقد وينتهي عند التسليم. أما بالنسبة لكيروكس، فالقصة تبدأ بعد التسليم.",
    label: "كلمة الرئيس التنفيذي",
  },
  {
    name: "يوسف محمد درويش",
    latin: "Youssef Mohamed Darwish",
    role: "المدير التنفيذي التقني",
    roleEn: "Chief Technology Officer",
    image: "/youssef-darwish-cto-qirox-1.jpg",
    href: "/youssef-darwish",
    alt: "يوسف محمد درويش المدير التنفيذي التقني لشركة كيروكس",
    message: "التقنية ليست غاية بحد ذاتها؛ هي وسيلة لتمكين الإنسان، وتطوير المؤسسات، وصناعة مستقبل أكثر ابتكاراً.",
    label: "كلمة المدير التنفيذي التقني",
  },
];

function TypewriterMessage({ text }: { text: string }) {
  const [visibleText, setVisibleText] = useState("");

  useEffect(() => {
    setVisibleText("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setVisibleText(text.slice(0, index));
      if (index >= text.length) window.clearInterval(timer);
    }, 30);

    return () => window.clearInterval(timer);
  }, [text]);

  return (
    <p className="relative text-lg md:text-xl font-bold leading-[1.9] text-white/90">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {visibleText}
        <span className="mx-1 inline-block h-6 w-px translate-y-1 bg-emerald-300/90 animate-pulse" />
      </span>
    </p>
  );
}

export function AboutIdentityStory({ lang }: AboutIdentityStoryProps) {
  const isArabic = lang === "ar";

  return (
    <div className="relative overflow-hidden bg-white dark:bg-[#070b12]">
      {/* The idea behind QIROX */}
      <section className="relative border-b border-black/[0.06] bg-[#f7f9fb] py-24 dark:border-white/[0.07] dark:bg-[#0b1119] md:py-32">
        <div className="pointer-events-none absolute -top-40 start-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full border border-slate-900/[0.06] dark:border-white/[0.05]" />
        <div className="pointer-events-none absolute -top-24 start-1/2 h-[20rem] w-[20rem] -translate-x-1/2 rounded-full border border-emerald-700/[0.10] dark:border-emerald-300/[0.08]" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50">
                <CircleDot className="h-3.5 w-3.5 text-emerald-600" />
                {isArabic ? "لماذا اسم كيروكس؟" : "Why QIROX?"}
              </div>
              <h2 className="mb-6 text-4xl font-black leading-tight tracking-tight text-slate-950 dark:text-white md:text-6xl">
                {isArabic ? (
                  <>
                    الاسم ليس اختصاراً فقط.
                    <span className="block text-slate-400 dark:text-white/30">إنه وعد نعمل به.</span>
                  </>
                ) : (
                  <>
                    More than an acronym.
                    <span className="block text-slate-400 dark:text-white/30">A promise we build by.</span>
                  </>
                )}
              </h2>
              <p data-about-summary className="max-w-2xl text-base leading-8 text-slate-500 dark:text-white/50 md:text-lg">
                {isArabic
                  ? "QIROX هو الاختصار الذي يجمع طريقة كيروكس في بناء البنية التحتية الرقمية للأعمال: جودة، ابتكار، موثوقية، تحسين، وتجربة لا تُنسى."
                  : "QIROX brings together the way we build digital business infrastructure: quality, innovation, reliability, optimization, and an experience people remember."}
              </p>
            </div>

            <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute start-[8%] end-[8%] top-[4.7rem] hidden h-px origin-left bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent lg:block"
                initial={{ scaleX: 0, opacity: 0 }}
                whileInView={{ scaleX: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.35, ease: "easeOut" }}
              />
              {qiroxMeaning.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.letter}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.55, delay: index * 0.07 }}
                    whileHover={{ y: -4 }}
                    className="group relative min-h-[205px] overflow-hidden rounded-2xl border border-slate-900/[0.08] bg-white p-5 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.35)] transition-[border-color,box-shadow] duration-500 hover:border-emerald-700/30 hover:shadow-[0_24px_60px_-30px_rgba(5,150,105,0.4)] dark:border-white/[0.08] dark:bg-white/[0.04]"
                  >
                    <div className="absolute -end-10 -top-10 h-28 w-28 rounded-full bg-emerald-500/[0.07] transition-transform duration-500 group-hover:scale-150" />
                    <div className="relative flex items-start justify-between">
                      <span className="text-5xl font-black tracking-[-0.08em] text-slate-950 transition-colors duration-500 group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">{item.letter}</span>
                      <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-emerald-600/20 bg-emerald-500/[0.06]">
                        <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                      </span>
                    </div>
                    <div className="relative mt-5">
                      <p className="mb-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 dark:bg-white/[0.07] dark:text-white/45">{item.word}</p>
                      <h3 className="mb-2 text-lg font-black text-slate-900 dark:text-white">{item.ar}</h3>
                      <p className="text-xs leading-6 text-slate-500 dark:text-white/50">{item.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Vision and mission */}
      <section className="relative overflow-hidden bg-[#071018] py-24 text-white md:py-32">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.055)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="pointer-events-none absolute -start-20 top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px]" />
        <div className="pointer-events-none absolute -end-20 bottom-0 h-96 w-96 rounded-full bg-sky-500/10 blur-[100px]" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-white/50">
                <Network className="h-3.5 w-3.5 text-emerald-300" />
                {isArabic ? "كيروكس فعلاً" : "The QIROX point of view"}
              </div>
              <h2 className="max-w-xl text-4xl font-black leading-[1.25] md:text-6xl">
                {isArabic ? (
                  <>
                    نبني ما تحتاجه
                    <span className="block text-emerald-300">الأعمال لتكبر.</span>
                  </>
                ) : (
                  <>
                    We build what
                    <span className="block text-emerald-300">businesses need to grow.</span>
                  </>
                )}
              </h2>
              <p className="mt-7 max-w-lg text-base leading-8 text-white/55 md:text-lg">
                {isArabic
                  ? "كيروكس ليست مجرد شركة تطوير. نحن منظومة تقنية لبناء البنية التحتية الرقمية للشركات: الأنظمة، الأتمتة، الذكاء الاصطناعي، المنتجات، والمعرفة التي تساعد الأعمال على أن تعمل أفضل وتنمو بثقة."
                  : "QIROX is more than a development company. We build the digital business infrastructure behind better operations, automation, AI, products, and lasting growth."}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <motion.article
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                whileHover={{ y: -8 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 backdrop-blur-sm"
              >
                <div className="pointer-events-none absolute -end-10 -top-10 h-32 w-32 rounded-full bg-emerald-300/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />
                <div className="relative mb-8 flex items-center justify-between">
                  <Eye className="h-7 w-7 text-emerald-300" />
                  <span className="font-mono text-xs text-white/25">01</span>
                </div>
                <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-emerald-300/80">{isArabic ? "الرؤية" : "Vision"}</p>
                <h3 className="mb-4 text-2xl font-black">{isArabic ? "الذراع التقني الأول للأعمال" : "The first technical partner for business"}</h3>
                <p className="relative text-sm leading-8 text-white/55">
                  {isArabic
                    ? "أن نصبح المنظومة التقنية الأكثر تأثيراً في تمكين الشركات ورواد الأعمال من بناء أعمال أكثر كفاءة واستدامة، انطلاقاً من المملكة إلى العالم."
                    : "To become the most impactful technology ecosystem enabling companies and entrepreneurs to build efficient, sustainable businesses from Saudi Arabia to the world."}
                </p>
              </motion.article>
              <motion.article
                initial={{ opacity: 0, x: -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                whileHover={{ y: -8 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 backdrop-blur-sm"
              >
                <div className="pointer-events-none absolute -start-10 -bottom-10 h-32 w-32 rounded-full bg-sky-300/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />
                <div className="relative mb-8 flex items-center justify-between">
                  <Target className="h-7 w-7 text-sky-300" />
                  <span className="font-mono text-xs text-white/25">02</span>
                </div>
                <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-sky-300/80">{isArabic ? "الرسالة" : "Mission"}</p>
                <h3 className="mb-4 text-2xl font-black">{isArabic ? "من الفكرة إلى واقع قابل للنمو" : "From idea to scalable reality"}</h3>
                <p className="relative text-sm leading-8 text-white/55">
                  {isArabic
                    ? "تمكين المؤسسات ورواد الأعمال عبر حلول تقنية متكاملة تعتمد على الأتمتة والذكاء الاصطناعي، مع شراكة تمتد من الفكرة إلى التشغيل والتوسع."
                    : "We empower organizations and entrepreneurs with integrated solutions powered by automation and AI, partnering from first idea through operation and scale."}
                </p>
              </motion.article>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="relative border-b border-black/[0.06] bg-white py-24 dark:border-white/[0.07] dark:bg-[#0a0f16] md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50">
                <Compass className="h-3.5 w-3.5 text-emerald-600" />
                {isArabic ? "فلسفة العمل" : "Our philosophy"}
              </div>
              <h2 className="text-4xl font-black leading-tight text-slate-950 dark:text-white md:text-5xl">
                {isArabic ? "بعد التسليم تبدأ القصة." : "The story starts after delivery."}
              </h2>
            </div>
            <div className="border-s-2 border-emerald-600/30 ps-7">
              <p className="text-xl font-bold leading-[2] text-slate-800 dark:text-white/85 md:text-2xl">
                {isArabic
                  ? "لا نقيس نجاحنا بعدد المشاريع التي ننجزها، بل بعدد الشركات التي ساهمنا في نموها، والأفكار التي تحولت إلى واقع، والعلاقات طويلة الأمد التي بنيناها مع عملائنا."
                  : "We do not measure success by the number of projects we complete, but by the companies we help grow, the ideas we make real, and the long-term relationships we build."}
              </p>
              <p className="mt-6 text-sm leading-8 text-slate-500 dark:text-white/45">
                {isArabic
                  ? "لهذا لا ننظر إلى المشروع كعملية بيع، بل كبداية لشراكة استراتيجية مستمرة تهدف إلى التطوير وتحقيق النمو المستدام."
                  : "A project is not a transaction to us. It is the beginning of an ongoing strategic partnership built for continuous improvement and sustainable growth."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Strategic ambition */}
      <section className="relative overflow-hidden bg-white py-24 dark:bg-[#0a0f16] md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50">
                <Rocket className="h-3.5 w-3.5 text-emerald-600" />
                {isArabic ? "الطموح الاستراتيجي" : "Strategic ambition"}
              </div>
              <h2 className="text-4xl font-black leading-tight text-slate-950 dark:text-white md:text-5xl">
                {isArabic ? "من شركة تقنية إلى منظومة متكاملة." : "From a technology company to an ecosystem."}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-500 dark:text-white/50">
                {isArabic
                  ? "تتجاوز طموحات كيروكس بناء حلول منفردة؛ نحن نربط المنتجات والخدمات والذكاء الاصطناعي والمعرفة في منظومة واحدة تقود التحول الرقمي."
                  : "QIROX is building more than individual solutions. We connect products, services, AI, and knowledge into one ecosystem for digital transformation."}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              {strategicPillars.map((pillar, index) => {
                const Icon = pillar.icon;
                return (
                  <motion.article
                    key={pillar.number}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5, delay: index * 0.06 }}
                    whileHover={{ y: -6 }}
                    className="group relative overflow-hidden rounded-[1.5rem] border border-slate-900/[0.08] bg-[#f7f9fb] p-6 dark:border-white/[0.08] dark:bg-white/[0.04]"
                  >
                    <div className="mb-10 flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-400 dark:text-white/30">{pillar.number}</span>
                      <Icon className="h-5 w-5 text-emerald-600 transition-transform duration-300 group-hover:scale-110 dark:text-emerald-300" />
                    </div>
                    <h3 className="mb-3 text-lg font-black leading-8 text-slate-900 dark:text-white">{pillar.title}</h3>
                    <p className="text-sm leading-7 text-slate-500 dark:text-white/50">{pillar.description}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="relative overflow-hidden bg-[#071018] py-24 text-white md:py-32">
        <div className="pointer-events-none absolute end-[12%] top-16 h-64 w-64 rounded-full border border-emerald-300/10 [animation:spin_24s_linear_infinite]" />
        <div className="pointer-events-none absolute end-[15%] top-24 h-48 w-48 rounded-full border border-dashed border-sky-300/10 [animation:spin_18s_linear_infinite_reverse]" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-white/50">
                  <Users className="h-3.5 w-3.5 text-emerald-300" />
                  {isArabic ? "الأشخاص خلف الرؤية" : "The people behind the vision"}
                </div>
                <h2 className="text-4xl font-black md:text-5xl">{isArabic ? "قيادة ترى أبعد." : "Leadership with range."}</h2>
              </div>
              <p className="max-w-md text-sm leading-8 text-white/45">
                {isArabic
                  ? "رؤية تجارية وتقنية تعملان معاً لبناء منظومة رقمية تجعل الأعمال أكثر جاهزية للمستقبل."
                  : "A business and technology vision working together to make companies ready for what comes next."}
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {leadership.map((person, index) => (
                <motion.article
                  key={person.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.65, delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-sm md:p-7"
                  itemScope
                  itemType="https://schema.org/Person"
                >
                  <div className="flex flex-col gap-7 sm:flex-row sm:items-start">
                    <div className="relative shrink-0">
                      <div className="absolute -inset-2 rounded-[1.5rem] border border-emerald-300/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      <img
                        src={person.image}
                        alt={person.alt}
                        title={`${person.name} — ${person.role} في كيروكس`}
                        className="relative h-52 w-full rounded-[1.25rem] object-cover object-top grayscale-[20%] transition-all duration-500 group-hover:grayscale-0 sm:h-56 sm:w-44"
                        loading="lazy"
                        itemProp="image"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="mb-5">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300/80">{person.roleEn}</p>
                        <h3 className="text-2xl font-black" itemProp="name">{person.name}</h3>
                        <p className="mt-1 text-sm text-white/40">{person.latin}</p>
                        <meta itemProp="jobTitle" content={`${person.role} | ${person.roleEn}`} />
                      </div>
                      <div className="relative flex-1 rounded-2xl border border-white/10 bg-black/20 p-5">
                        <Quote className="absolute -top-3 -end-2 h-8 w-8 rotate-180 fill-emerald-300/10 text-emerald-300/70" />
                        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">{person.label}</p>
                        <TypewriterMessage text={person.message} />
                      </div>
                      <Link href={person.href} className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-white/45 transition-colors hover:text-emerald-300">
                        {isArabic ? "اكتشف قصة القائد" : "Explore profile"}
                        <ArrowUpLeft className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-b border-black/[0.06] bg-[#f7f9fb] py-24 dark:border-white/[0.07] dark:bg-[#0b1119] md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                {isArabic ? "المبادئ التي تحركنا" : "The principles behind our work"}
              </div>
              <h2 className="text-4xl font-black leading-tight text-slate-950 dark:text-white md:text-5xl">
                {isArabic ? "قيم تُرى في التفاصيل." : "Values you can feel in the details."}
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <motion.article
                    key={value.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.5, delay: index * 0.04 }}
                    whileHover={{ y: -6, rotate: index % 2 === 0 ? -0.5 : 0.5 }}
                    className="rounded-[1.5rem] border border-slate-900/[0.08] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-700/25 hover:shadow-xl hover:shadow-emerald-950/[0.06] dark:border-white/[0.08] dark:bg-white/[0.04]"
                  >
                    <div className="mb-7 flex items-center justify-between">
                      <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                      <span className="font-mono text-[10px] text-slate-300 dark:text-white/20">0{index + 1}</span>
                    </div>
                    <h3 className="mb-1 text-lg font-black text-slate-900 dark:text-white">{value.title}</h3>
                    <p className="mb-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-white/30">{value.english}</p>
                    <p className="line-clamp-3 text-sm leading-7 text-slate-500 dark:text-white/50">{value.description}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* AEO-friendly answers */}
      <section data-about-faq className="bg-white py-24 dark:bg-[#0a0f16] md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50">
                <CircleDot className="h-3.5 w-3.5 text-emerald-600" />
                {isArabic ? "أسئلة عن كيروكس" : "About QIROX"}
              </div>
              <h2 className="text-3xl font-black text-slate-950 dark:text-white md:text-4xl">
                {isArabic ? "إجابات واضحة قبل أن تبدأ." : "Clear answers before you start."}
              </h2>
            </div>
            <div className="space-y-3">
              {aboutFaqs.map((faq) => (
                <details key={faq.question} className="group rounded-2xl border border-slate-900/[0.08] bg-[#f7f9fb] px-6 py-5 dark:border-white/[0.08] dark:bg-white/[0.04]">
                  <summary className="cursor-pointer list-none pe-8 text-base font-black text-slate-900 marker:hidden dark:text-white">
                    <span className="relative after:absolute after:end-0 after:top-1/2 after:h-2 after:w-2 after:-translate-y-1/2 after:rotate-45 after:border-b-2 after:border-e-2 after:border-slate-400 after:transition-transform group-open:after:rotate-[225deg]" />
                    {faq.question}
                  </summary>
                  <p className="pt-4 text-sm leading-8 text-slate-500 dark:text-white/50">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}