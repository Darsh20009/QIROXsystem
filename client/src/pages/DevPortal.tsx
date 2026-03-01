import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Code2, Terminal, GitBranch, Database, Cloud, Shield, Zap, Layers,
  Globe, Server, Cpu, Lock, RefreshCw, Webhook, Package, BarChart3,
  Smartphone, Braces, FileCode, Workflow, Bot, CircuitBoard,
  ArrowLeft, ExternalLink, CheckCircle2, Star, ChevronDown, ChevronUp,
  Play, Copy, Check, Mail, MessageSquare, Puzzle, Key,
} from "lucide-react";

const TECH_STACK = [
  { name: "React / Next.js", icon: "⚛️", color: "from-cyan-500 to-blue-500" },
  { name: "Node.js / Express", icon: "🟢", color: "from-green-500 to-emerald-600" },
  { name: "Python / Django", icon: "🐍", color: "from-yellow-500 to-amber-600" },
  { name: "TypeScript", icon: "🔷", color: "from-blue-500 to-indigo-600" },
  { name: "PostgreSQL", icon: "🐘", color: "from-indigo-500 to-violet-600" },
  { name: "MongoDB", icon: "🍃", color: "from-green-600 to-teal-600" },
  { name: "Redis", icon: "🔴", color: "from-red-500 to-rose-600" },
  { name: "Docker / K8s", icon: "🐳", color: "from-sky-500 to-blue-600" },
  { name: "AWS / GCP", icon: "☁️", color: "from-orange-500 to-amber-600" },
  { name: "GraphQL", icon: "◈", color: "from-pink-500 to-rose-500" },
  { name: "REST APIs", icon: "🔗", color: "from-violet-500 to-purple-600" },
  { name: "WebSocket", icon: "⚡", color: "from-yellow-400 to-orange-500" },
];

const DEV_SERVICES = [
  {
    icon: Globe,
    title: "تطوير واجهات المستخدم",
    subtitle: "Frontend Development",
    description: "بناء واجهات سريعة وتفاعلية باستخدام React وNext.js وTypeScript مع دعم SSR وSEO كامل",
    features: ["React / Next.js / Vite", "Tailwind CSS / shadcn/ui", "تحسين الأداء والـ Core Web Vitals", "دعم PWA والتطبيقات التقدمية"],
    price: "من 3,000",
    color: "from-blue-500 to-cyan-500",
    badge: "الأكثر طلباً",
  },
  {
    icon: Server,
    title: "تطوير الخوادم والـ APIs",
    subtitle: "Backend & API Development",
    description: "بناء خوادم قابلة للتوسع مع APIs موثقة بالكامل — REST وGraphQL ودعم WebSocket",
    features: ["Node.js / Express / Fastify", "Python / FastAPI / Django", "توثيق Swagger / OpenAPI", "Rate Limiting وCaching"],
    price: "من 4,500",
    color: "from-violet-500 to-purple-600",
    badge: null,
  },
  {
    icon: Database,
    title: "تصميم قواعد البيانات",
    subtitle: "Database Architecture",
    description: "تصميم schema محكم وهياكل بيانات مُحسَّنة مع استراتيجيات النسخ الاحتياطي والأداء",
    features: ["PostgreSQL / MySQL / SQLite", "MongoDB / Redis / Elasticsearch", "Migrations وVersioning", "Query Optimization"],
    price: "من 2,000",
    color: "from-green-500 to-emerald-600",
    badge: null,
  },
  {
    icon: Webhook,
    title: "تطوير التكاملات",
    subtitle: "Integrations & Webhooks",
    description: "ربط أنظمتك بأكثر من 50 خدمة خارجية — بوابات الدفع، وسائل التواصل، ERP، CRM وغيرها",
    features: ["Stripe / PayPal / Apple Pay", "WhatsApp Business API", "Zapier / Make / n8n", "CRM و ERP Integration"],
    price: "من 1,500",
    color: "from-orange-500 to-amber-500",
    badge: "شائع",
  },
  {
    icon: Bot,
    title: "تطوير الذكاء الاصطناعي",
    subtitle: "AI & ML Development",
    description: "دمج نماذج الذكاء الاصطناعي في مشروعك — chatbots ذكية ونظم توصيات وتحليل البيانات",
    features: ["OpenAI / Anthropic / Gemini", "Fine-tuning النماذج", "RAG وVector Databases", "AI Chatbots ومساعدون"],
    price: "من 6,000",
    color: "from-pink-500 to-rose-600",
    badge: "جديد 🔥",
  },
  {
    icon: Shield,
    title: "الأمن والمصادقة",
    subtitle: "Security & Auth",
    description: "بناء أنظمة مصادقة آمنة مع JWT وOAuth 2.0 وحماية كاملة من الثغرات الشائعة",
    features: ["OAuth 2.0 / OpenID Connect", "JWT / Session Management", "2FA وBiometric Auth", "Penetration Testing"],
    price: "من 2,500",
    color: "from-slate-600 to-gray-800",
    badge: null,
  },
  {
    icon: Cloud,
    title: "البنية السحابية والـ DevOps",
    subtitle: "Cloud & DevOps",
    description: "إعداد بنية تحتية سحابية متينة مع CI/CD pipeline ومراقبة كاملة للأداء",
    features: ["AWS / GCP / Azure", "Docker / Kubernetes", "CI/CD — GitHub Actions", "Monitoring / Prometheus"],
    price: "من 3,500",
    color: "from-sky-500 to-blue-600",
    badge: null,
  },
  {
    icon: Smartphone,
    title: "تطوير التطبيقات",
    subtitle: "Mobile App Development",
    description: "تطبيقات iOS وAndroid عالية الأداء بـ React Native مع مشاركة كود بين المنصات",
    features: ["React Native / Expo", "Shared codebase iOS & Android", "Push Notifications", "Offline Support"],
    price: "من 8,000",
    color: "from-indigo-500 to-violet-600",
    badge: null,
  },
  {
    icon: BarChart3,
    title: "لوحات التحكم والتقارير",
    subtitle: "Dashboards & Analytics",
    description: "لوحات تحكم تفاعلية مع تصورات بيانية متقدمة وتقارير لحظية ومُصدَّرة",
    features: ["Recharts / D3.js / Chart.js", "Real-time Data Streaming", "تصدير Excel / PDF", "Custom KPI Widgets"],
    price: "من 4,000",
    color: "from-teal-500 to-cyan-600",
    badge: null,
  },
];

const PACKAGES = [
  {
    title: "Starter",
    nameAr: "بداية",
    price: 1500,
    period: "مشروع واحد",
    dark: false,
    color: "from-slate-400 to-slate-600",
    features: [
      "مراجعة الكود واقتراح التحسينات",
      "إعداد مشروع جديد من الصفر",
      "توثيق تقني أساسي",
      "دعم بريد إلكتروني",
      "تسليم خلال أسبوعين",
    ],
    cta: "ابدأ مشروعك",
  },
  {
    title: "Pro",
    nameAr: "احترافي",
    price: 5500,
    period: "مشروع",
    dark: true,
    color: "from-violet-500 to-purple-700",
    popular: true,
    features: [
      "تطوير full-stack كامل",
      "APIs موثقة بالكامل",
      "اختبارات وحدات وتكامل",
      "نشر على السحابة",
      "دعم لمدة 3 أشهر",
      "اجتماعات أسبوعية للمتابعة",
    ],
    cta: "ابدأ الآن",
  },
  {
    title: "Enterprise",
    nameAr: "مؤسسي",
    price: null,
    period: "اتفاقية مخصصة",
    dark: false,
    color: "from-amber-400 to-orange-500",
    features: [
      "فريق مطورين مخصص",
      "SLA مضمون 99.9%",
      "معمارية قابلة للتوسع",
      "أمان وامتثال GDPR",
      "دعم 24/7",
      "تدريب الفريق",
    ],
    cta: "تواصل معنا",
  },
];

const CODE_SNIPPET = `// مثال: استخدام QIROX API
const response = await fetch(
  'https://api.qiroxstudio.online/v1/orders',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectType: 'ecommerce',
      sector: 'stores',
      totalAmount: 5000,
    }),
  }
);

const order = await response.json();
console.log('Order ID:', order.id);`;

const FAQ = [
  { q: "هل تدعمون تطوير المشاريع من الصفر؟", a: "نعم، نبني مشروعك كاملاً من التصميم والهندسة المعمارية وصولاً للنشر والمتابعة." },
  { q: "ما هي مدة تسليم المشاريع عادةً؟", a: "يعتمد على حجم المشروع — المشاريع الصغيرة 1-2 أسبوع، والمشاريع الكبيرة 1-3 أشهر مع مراحل واضحة." },
  { q: "هل تقدمون دعماً بعد التسليم؟", a: "نعم، لدينا خطط صيانة شهرية تشمل إصلاح الأخطاء والتحديثات الأمنية وإضافة المميزات." },
  { q: "هل يمكنني الاطلاع على الكود المصدري؟", a: "بالطبع، الكود المصدري ملكك بالكامل ويُسلَّم عبر GitHub مع توثيق شامل." },
  { q: "ماذا تستخدمون في الـ CI/CD؟", a: "نستخدم GitHub Actions أساساً مع دعم GitLab CI وBitbucket Pipelines حسب احتياج المشروع." },
];

export default function DevPortal() {
  const [copiedCode, setCopiedCode] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const copyCode = () => {
    navigator.clipboard.writeText(CODE_SNIPPET);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl">

      {/* ── Top Nav ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/">
            <span className="text-white font-black text-lg tracking-tight cursor-pointer">QIROX <span className="text-violet-400">DEV</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/50">
            <a href="#services" className="hover:text-white transition-colors">الخدمات</a>
            <a href="#stack" className="hover:text-white transition-colors">التقنيات</a>
            <a href="#packages" className="hover:text-white transition-colors">الباقات</a>
            <a href="#api" className="hover:text-white transition-colors">API</a>
            <a href="#faq" className="hover:text-white transition-colors">الأسئلة</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/contact">
              <Button variant="outline" size="sm" className="border-white/20 bg-white/[0.04] text-white hover:bg-white/[0.08] text-xs h-8 rounded-xl">تواصل معنا</Button>
            </Link>
            <Link href="/order">
              <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-8 rounded-xl px-4">ابدأ مشروعك</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-24 px-6">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[80px]" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(to right, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
            <span className="text-violet-300 text-xs font-semibold">بوابة المطورين — QIROX Developer Portal</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            نبني <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">ما تتخيله</span>
            <br />بكود نظيف وهندسة محكمة
          </h1>
          <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            فريق من المطورين المحترفين يبني APIs وتطبيقات وأنظمة قابلة للتوسع.
            من الفكرة إلى الإنتاج — نحن نكتب الكود الذي يشتغل.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/order">
              <Button size="lg" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-2xl px-8 h-12 font-bold gap-2 shadow-lg shadow-violet-500/25">
                ابدأ مشروعك <Play className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#api">
              <Button size="lg" variant="outline" className="border-white/20 bg-white/[0.04] text-white hover:bg-white/[0.08] rounded-2xl px-8 h-12 font-bold gap-2">
                استعرض الـ API <Code2 className="w-4 h-4" />
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-16 pt-8 border-t border-white/[0.06]">
            {[
              { value: "+200", label: "مشروع مُنجز" },
              { value: "+50", label: "تقنية مدعومة" },
              { value: "99.9%", label: "معدل نجاح النشر" },
              { value: "+3", label: "سنوات خبرة" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-black text-white mb-1">{s.value}</p>
                <p className="text-xs text-white/40">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ────────────────────────────────────────────── */}
      <section id="stack" className="py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-3">Tech Stack</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">التقنيات التي نُتقنها</h2>
            <p className="text-white/40 text-sm">نعمل مع أحدث التقنيات وأكثرها استقراراً في الإنتاج</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {TECH_STACK.map((t, i) => (
              <div key={i} className="group bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-4 text-center transition-all cursor-default">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center mx-auto mb-3 text-xl`}>
                  {t.icon}
                </div>
                <p className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ──────────────────────────────────────────────── */}
      <section id="services" className="py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-3">Dev Services</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">خدمات التطوير المتخصصة</h2>
            <p className="text-white/40 text-sm max-w-xl mx-auto">من واجهات المستخدم إلى البنية التحتية السحابية — كل ما يحتاجه مشروعك في مكان واحد</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEV_SERVICES.map((svc, i) => {
              const Icon = svc.icon;
              return (
                <div key={i} className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50 flex flex-col">
                  {svc.badge && (
                    <span className="absolute top-4 left-4 text-[10px] font-black px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      {svc.badge}
                    </span>
                  )}
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${svc.color} flex items-center justify-center mb-5 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-base font-black text-white mb-0.5">{svc.title}</h3>
                  <p className="text-[11px] text-white/30 font-mono mb-3">{svc.subtitle}</p>
                  <p className="text-sm text-white/50 mb-5 leading-relaxed flex-1">{svc.description}</p>
                  <ul className="space-y-1.5 mb-5">
                    {svc.features.map((f, fi) => (
                      <li key={fi} className="flex items-center gap-2 text-xs text-white/40">
                        <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
                    <span className="text-xs text-white/30">{svc.price} ر.س</span>
                    <Link href={`/order`}>
                      <button className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors group-hover:gap-2.5">
                        اطلب الخدمة <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── API Code Preview ──────────────────────────────────────── */}
      <section id="api" className="py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-3">Developer API</p>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-5">
                API نظيف وموثق
                <br /><span className="text-white/40">جاهز للتكامل</span>
              </h2>
              <p className="text-white/50 text-sm leading-relaxed mb-8">
                نوفر APIs مبنية على معايير REST مع توثيق Swagger شامل.
                ابدأ التكامل في دقائق مع مثال كود جاهز لكل نقطة نهاية.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Key, text: "مصادقة Bearer Token" },
                  { icon: FileCode, text: "توثيق OpenAPI 3.0 كامل" },
                  { icon: Zap, text: "استجابة < 100ms متوسطاً" },
                  { icon: RefreshCw, text: "Webhook للأحداث الفورية" },
                  { icon: Lock, text: "TLS 1.3 وتشفير كامل" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-violet-400" />
                      </div>
                      <span className="text-sm text-white/60">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Code Block */}
            <div className="relative">
              <div className="bg-[#111] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-[11px] text-white/30 font-mono">api-example.ts</span>
                  <button onClick={copyCode} className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 transition-colors">
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode ? "تم النسخ" : "نسخ"}
                  </button>
                </div>
                <pre className="p-5 text-[12px] font-mono overflow-x-auto leading-relaxed text-white/70 dir-ltr" style={{ direction: "ltr" }}>
                  <code>
                    {CODE_SNIPPET.split("\n").map((line, i) => {
                      const trimmed = line.trim();
                      let cls = "text-white/60";
                      if (trimmed.startsWith("//")) cls = "text-white/25 italic";
                      else if (trimmed.startsWith("const ") || trimmed.startsWith("await ")) cls = "text-violet-300";
                      else if (trimmed.includes("'") || trimmed.includes('"')) cls = "text-green-400";
                      else if (trimmed.startsWith("Authorization") || trimmed.startsWith("method") || trimmed.startsWith("headers") || trimmed.startsWith("body")) cls = "text-sky-300";
                      return <span key={i} className={`block ${cls}`}>{line}</span>;
                    })}
                  </code>
                </pre>
              </div>
              {/* Glow */}
              <div className="absolute -inset-4 bg-violet-500/5 rounded-3xl -z-10 blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Packages ──────────────────────────────────────────────── */}
      <section id="packages" className="py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">باقات التطوير</h2>
            <p className="text-white/40 text-sm">اختر الباقة المناسبة أو تواصل معنا لعرض مخصص</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PACKAGES.map((pkg, i) => (
              <div key={i} className={`relative rounded-3xl overflow-hidden flex flex-col transition-all hover:-translate-y-1 ${pkg.dark ? 'bg-gradient-to-br from-violet-900/60 to-purple-950 border border-violet-500/30' : 'bg-white/[0.04] border border-white/[0.08]'} ${pkg.popular ? 'ring-2 ring-violet-500' : ''}`}>
                {pkg.popular && (
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-violet-500 via-purple-400 to-violet-600" />
                )}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-[11px] font-mono text-white/30 mb-0.5">{pkg.title}</p>
                      <p className="text-lg font-black text-white">{pkg.nameAr}</p>
                    </div>
                    {pkg.popular && (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">الأشهر</span>
                    )}
                  </div>
                  <div className="mb-6">
                    {pkg.price ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white">{pkg.price.toLocaleString()}</span>
                        <span className="text-sm text-white/30">ر.س / {pkg.period}</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-black text-white">حسب المشروع</div>
                    )}
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-8">
                    {pkg.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2.5 text-sm text-white/55">
                        <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${pkg.dark ? 'text-violet-400' : 'text-white/30'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={pkg.price ? "/order" : "/contact"}>
                    <Button className={`w-full rounded-xl h-11 font-bold ${pkg.dark ? 'bg-white text-black hover:bg-white/90' : 'bg-white/[0.08] text-white hover:bg-white/[0.14] border border-white/[0.1]'}`}>
                      {pkg.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why QIROX Dev ─────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-3">Why Us</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">لماذا QIROX للتطوير؟</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: GitBranch, title: "كود قابل للصيانة", desc: "نتبع أفضل ممارسات الكتابة والتوثيق لضمان سهولة الإضافة والتعديل" },
              { icon: Layers, title: "هندسة قابلة للتوسع", desc: "نُصمم الأنظمة لتتحمل النمو من آلاف إلى ملايين المستخدمين" },
              { icon: CircuitBoard, title: "اختبارات شاملة", desc: "Unit / Integration / E2E tests لضمان استقرار كامل قبل النشر" },
              { icon: Workflow, title: "تسليم أجايل", desc: "دورات سبرينت أسبوعية مع demos منتظمة لضمان التوافق مع رؤيتك" },
              { icon: MessageSquare, title: "تواصل شفاف", desc: "تقارير يومية وقناة Slack مخصصة لمتابعة تقدم المشروع لحظة بلحظة" },
              { icon: Puzzle, title: "حلول مخصصة", desc: "لا templates جاهزة — كل مشروع يُبنى بناءً على احتياجاتك الخاصة" },
              { icon: Star, title: "معايير عالية", desc: "كل سطر كود يمر بمراجعة الزملاء وفحص الجودة قبل الدمج" },
              { icon: Shield, title: "أمان أولاً", desc: "تطبيق OWASP Top 10 وممارسات الأمان في كل مرحلة من التطوير" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-2xl p-5 transition-all group">
                  <div className="w-9 h-9 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-4 h-4 text-violet-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-white/35 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl font-black text-white mb-3">أسئلة شائعة</h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-right gap-4"
                  data-testid={`faq-toggle-${i}`}
                >
                  <span className="text-sm font-semibold text-white">{item.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-4 h-4 text-white/30 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" />
                  }
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 border-t border-white/[0.04]">
                    <p className="text-sm text-white/50 pt-3 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-violet-900/50 to-purple-950/50 border border-violet-500/20 rounded-3xl p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/30">
                <Terminal className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">جاهز تبدأ مشروعك؟</h2>
              <p className="text-white/50 text-base mb-8 max-w-xl mx-auto leading-relaxed">
                أرسل لنا تفاصيل مشروعك وسيتواصل معك أحد مطورينا خلال 24 ساعة لنقاش التقنيات والجدول الزمني
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/order">
                  <Button size="lg" className="bg-white text-black hover:bg-white/90 rounded-2xl px-8 h-12 font-bold gap-2">
                    ابدأ الآن <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-white/20 bg-white/[0.05] text-white hover:bg-white/[0.1] rounded-2xl px-8 h-12 font-bold gap-2">
                    <Mail className="w-4 h-4" /> تواصل معنا
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] px-6 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/">
            <span className="text-white font-black text-base cursor-pointer">QIROX <span className="text-violet-400">DEV</span></span>
          </Link>
          <p className="text-xs text-white/25">© 2026 QIROX Studio — بوابة المطورين</p>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <Link href="/privacy"><span className="hover:text-white/60 cursor-pointer transition-colors">الخصوصية</span></Link>
            <Link href="/terms"><span className="hover:text-white/60 cursor-pointer transition-colors">الشروط</span></Link>
            <Link href="/contact"><span className="hover:text-white/60 cursor-pointer transition-colors">تواصل</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
