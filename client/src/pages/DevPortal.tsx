import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Code2, Terminal, GitBranch, Database, Cloud, Shield, Zap, Layers,
  Globe, Server, Cpu, Lock, RefreshCw, Webhook, Package, BarChart3,
  Smartphone, Braces, FileCode, Workflow, Bot, CircuitBoard,
  ArrowLeft, ExternalLink, CheckCircle2, Star, ChevronDown, ChevronUp,
  Copy, Check, Key, MessageSquare, Puzzle, Play, ArrowRight,
  Clock, Users, Gauge, Wrench, BookOpen, GitMerge, TestTube,
  MonitorSmartphone, HardDrive, Network, Binary, Infinity,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

/* ── Data ──────────────────────────────────────────────────────────────── */

const TECH_STACK = [
  { name: "React / Next.js", sub: "Frontend" },
  { name: "TypeScript", sub: "Language" },
  { name: "Node.js / Express", sub: "Backend" },
  { name: "Python / FastAPI", sub: "Backend" },
  { name: "PostgreSQL", sub: "Database" },
  { name: "MongoDB", sub: "Database" },
  { name: "Redis", sub: "Cache" },
  { name: "Docker / K8s", sub: "DevOps" },
  { name: "AWS / GCP", sub: "Cloud" },
  { name: "GraphQL", sub: "API" },
  { name: "WebSocket", sub: "Real-time" },
  { name: "Elasticsearch", sub: "Search" },
];

const DEV_SERVICES = [
  {
    icon: Globe,
    title: "تطوير واجهات المستخدم",
    sub: "Frontend Development",
    desc: "بناء واجهات سريعة وتفاعلية بـ React وNext.js مع SSR كامل وأداء مُحسَّن.",
    features: ["React / Next.js / Vite", "Tailwind CSS / shadcn/ui", "Core Web Vitals تحسين", "PWA وتطبيقات تقدمية"],
    price: "3,000",
    tag: "الأكثر طلباً",
  },
  {
    icon: Server,
    title: "تطوير الخوادم والـ APIs",
    sub: "Backend & API",
    desc: "خوادم قابلة للتوسع مع APIs موثقة بالكامل — REST وGraphQL ودعم WebSocket.",
    features: ["Node.js / Fastify / Django", "REST & GraphQL APIs", "Swagger / OpenAPI 3.0", "Rate Limiting & Caching"],
    price: "4,500",
    tag: null,
  },
  {
    icon: Database,
    title: "تصميم قواعد البيانات",
    sub: "Database Architecture",
    desc: "schema محكم وهياكل بيانات مُحسَّنة مع استراتيجيات النسخ الاحتياطي والأداء.",
    features: ["PostgreSQL / MySQL", "MongoDB / Redis", "Migrations & Versioning", "Query Optimization"],
    price: "2,000",
    tag: null,
  },
  {
    icon: Webhook,
    title: "تطوير التكاملات",
    sub: "Integrations & Webhooks",
    desc: "ربط أنظمتك بأكثر من 50 خدمة خارجية — بوابات دفع، وسائل تواصل، ERP وCRM.",
    features: ["Stripe / Apple Pay / STC Pay", "WhatsApp Business API", "Zapier / Make / n8n", "CRM & ERP Integration"],
    price: "1,500",
    tag: "شائع",
  },
  {
    icon: Bot,
    title: "الذكاء الاصطناعي",
    sub: "AI & ML Development",
    desc: "دمج نماذج الذكاء الاصطناعي في مشروعك — chatbots ذكية ونظم توصيات وتحليل بيانات.",
    features: ["OpenAI / Anthropic / Gemini", "Fine-tuning النماذج", "RAG & Vector DBs", "AI Agents & Assistants"],
    price: "6,000",
    tag: "متقدم",
  },
  {
    icon: Shield,
    title: "الأمن والمصادقة",
    sub: "Security & Auth",
    desc: "أنظمة مصادقة آمنة مع JWT وOAuth 2.0 وحماية كاملة من الثغرات الشائعة.",
    features: ["OAuth 2.0 / OpenID Connect", "JWT / Session Management", "2FA & Biometric Auth", "OWASP Top 10"],
    price: "2,500",
    tag: null,
  },
  {
    icon: Cloud,
    title: "البنية السحابية والـ DevOps",
    sub: "Cloud & DevOps",
    desc: "بنية تحتية سحابية متينة مع CI/CD pipeline ومراقبة كاملة للأداء.",
    features: ["AWS / GCP / Azure", "Docker / Kubernetes", "GitHub Actions CI/CD", "Prometheus & Grafana"],
    price: "3,500",
    tag: null,
  },
  {
    icon: Smartphone,
    title: "تطوير التطبيقات",
    sub: "Mobile Development",
    desc: "تطبيقات iOS وAndroid عالية الأداء بـ React Native مع مشاركة كود بين المنصات.",
    features: ["React Native / Expo", "iOS & Android", "Push Notifications", "Offline Support"],
    price: "8,000",
    tag: null,
  },
  {
    icon: BarChart3,
    title: "لوحات التحكم والتقارير",
    sub: "Dashboards & Analytics",
    desc: "لوحات تحكم تفاعلية مع تصورات بيانية متقدمة وتقارير لحظية ومُصدَّرة.",
    features: ["Recharts / D3.js", "Real-time Streaming", "Excel / PDF Export", "Custom KPI Widgets"],
    price: "4,000",
    tag: null,
  },
];

const PACKAGES = [
  {
    title: "Starter",
    nameAr: "ابتدائي",
    price: 1500,
    period: "مشروع واحد",
    highlight: false,
    features: [
      "مراجعة الكود واقتراح التحسينات",
      "إعداد مشروع من الصفر",
      "توثيق تقني أساسي",
      "دعم بريد إلكتروني",
      "تسليم خلال أسبوعين",
    ],
    cta: "ابدأ مشروعك",
    href: "/order",
  },
  {
    title: "Pro",
    nameAr: "احترافي",
    price: 5500,
    period: "مشروع",
    highlight: true,
    features: [
      "تطوير Full-Stack كامل",
      "APIs موثقة بالكامل",
      "اختبارات وحدات وتكامل",
      "نشر على السحابة",
      "دعم لمدة 3 أشهر",
      "اجتماعات أسبوعية للمتابعة",
    ],
    cta: "ابدأ الآن",
    href: "/order",
  },
  {
    title: "Enterprise",
    nameAr: "مؤسسي",
    price: null,
    period: "اتفاقية مخصصة",
    highlight: false,
    features: [
      "فريق مطورين مخصص",
      "SLA مضمون 99.9%",
      "معمارية قابلة للتوسع",
      "أمان وامتثال GDPR",
      "دعم 24/7",
      "تدريب الفريق الداخلي",
    ],
    cta: "تواصل معنا",
    href: "/contact",
  },
];

const PROCESS_STEPS = [
  { num: "01", title: "الاكتشاف", sub: "Discovery", desc: "نحلل متطلباتك ونضع وثيقة مواصفات تقنية كاملة مع مخطط المعمارية.", icon: BookOpen },
  { num: "02", title: "التصميم المعماري", sub: "Architecture", desc: "نصمم هيكل النظام — قواعد البيانات، APIs، والمكونات — قبل كتابة سطر واحد.", icon: Layers },
  { num: "03", title: "التطوير", sub: "Development", desc: "سبرينتات أسبوعية مع تقارير يومية وكود مُراجَع من الزملاء في كل مرحلة.", icon: Code2 },
  { num: "04", title: "الاختبار", sub: "Testing & QA", desc: "Unit / Integration / E2E tests + اختبار الأداء والأمان قبل النشر.", icon: TestTube },
  { num: "05", title: "النشر والمتابعة", sub: "Deploy & Monitor", desc: "نشر تدريجي مع monitoring كامل واستجابة فورية لأي مشكلة في الإنتاج.", icon: Cloud },
];

const CODE_TABS = [
  {
    lang: "TypeScript",
    label: "إنشاء طلب",
    code: `// QIROX API — إنشاء طلب جديد
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
      sector: 'store',
      totalAmount: 5000,
    }),
  }
);

const order = await response.json();
// { id: "ord_abc123", status: "pending" }`,
  },
  {
    lang: "Python",
    label: "جلب الخدمات",
    code: `# QIROX API — جلب قائمة الخدمات
import httpx

async with httpx.AsyncClient() as client:
    response = await client.get(
        "https://api.qiroxstudio.online/v1/services",
        headers={
            "Authorization": "Bearer YOUR_API_KEY",
        },
    )

services = response.json()
for svc in services:
    print(f"{svc['title']} — {svc['priceMin']} SAR")`,
  },
  {
    lang: "cURL",
    label: "تحديث حالة",
    code: `# QIROX API — تحديث حالة الطلب
curl -X PATCH \\
  'https://api.qiroxstudio.online/v1/orders/ord_abc123' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "status": "in_progress",
    "notes": "بدأ الفريق بالعمل"
  }'

# Response: { "ok": true, "status": "in_progress" }`,
  },
];

const FAQ = [
  { q: "هل تدعمون تطوير المشاريع من الصفر؟", a: "نعم، نبني مشروعك كاملاً من التصميم والهندسة المعمارية وصولاً للنشر والمتابعة في الإنتاج." },
  { q: "ما هي مدة تسليم المشاريع عادةً؟", a: "المشاريع الصغيرة 1-2 أسبوع، والمتوسطة 3-6 أسابيع، والكبيرة 1-3 أشهر — مع مراحل واضحة وDeliverables محددة." },
  { q: "هل تقدمون دعماً بعد التسليم؟", a: "نعم، خطط صيانة شهرية تشمل إصلاح الأخطاء والتحديثات الأمنية وإضافة المميزات الجديدة." },
  { q: "هل يمكنني الاطلاع على الكود المصدري؟", a: "بالطبع، الكود ملكك بالكامل ويُسلَّم عبر GitHub Private Repository مع توثيق شامل." },
  { q: "ماذا تستخدمون في الـ CI/CD؟", a: "GitHub Actions أساساً مع دعم GitLab CI وBitbucket Pipelines حسب بيئة العميل." },
  { q: "هل تعملون بمنهجية Agile؟", a: "نعم، سبرينتات أسبوعية مع Backlog مُدار وكانبان board ودمو أسبوعي لمتابعة التقدم." },
];

/* ── Helpers ──────────────────────────────────────────────────────────── */
function highlight(line: string): string {
  if (line.trim().startsWith("//") || line.trim().startsWith("#")) return "text-white/30 italic";
  if (/^\s*(const|let|var|async|await|import|from|return)\b/.test(line)) return "text-white/80";
  if (/"[^"]*"|'[^']*'/.test(line)) return "text-white/60";
  if (/^(curl|-H|-X|-d|Bearer)/.test(line.trim())) return "text-white/70";
  return "text-white/50";
}

/* ── Component ─────────────────────────────────────────────────────────── */
export default function DevPortal() {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const copyCode = (idx: number) => {
    navigator.clipboard.writeText(CODE_TABS[idx].code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl">
      <Navigation />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-36 pb-24 px-6 border-b border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(to right, white 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
            <span className="text-white/50 text-xs font-semibold tracking-wider uppercase">Developer Portal — QIROX Studio</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
            نبني ما تتخيله<br />
            <span className="text-white/30">بكود نظيف وهندسة محكمة</span>
          </h1>
          <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            فريق من المطورين المحترفين يبني APIs وتطبيقات وأنظمة قابلة للتوسع.
            من الفكرة إلى الإنتاج — نكتب الكود الذي يشتغل.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <Link href="/order">
              <Button size="lg" className="bg-white text-black hover:bg-white/90 rounded-2xl px-8 h-12 font-bold gap-2">
                ابدأ مشروعك <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#api">
              <Button size="lg" variant="outline" className="border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.07] rounded-2xl px-8 h-12 font-bold gap-2">
                استعرض الـ API <Code2 className="w-4 h-4" />
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] border border-white/[0.06] rounded-2xl overflow-hidden">
            {[
              { value: "+200", label: "مشروع مُنجز" },
              { value: "+50", label: "تقنية مدعومة" },
              { value: "99.9%", label: "معدل نجاح النشر" },
              { value: "+3", label: "سنوات خبرة" },
            ].map((s, i) => (
              <div key={i} className="bg-[#0a0a0a] py-6 text-center">
                <p className="text-2xl font-black text-white mb-1">{s.value}</p>
                <p className="text-[11px] text-white/30">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ───────────────────────────────────────────────── */}
      <section id="stack" className="py-20 px-6 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-2">Tech Stack</p>
              <h2 className="text-2xl md:text-3xl font-black text-white">التقنيات التي نُتقنها</h2>
            </div>
            <p className="hidden md:block text-xs text-white/25 max-w-xs text-left leading-relaxed">
              نعمل مع أحدث التقنيات وأكثرها استقراراً في بيئات الإنتاج
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {TECH_STACK.map((t, i) => (
              <div key={i} className="group bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-4 text-center transition-all cursor-default">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mx-auto mb-3">
                  <Binary className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                </div>
                <p className="text-xs font-bold text-white/60 group-hover:text-white transition-colors leading-tight mb-0.5">{t.name}</p>
                <p className="text-[10px] text-white/20 font-mono">{t.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Development Process ──────────────────────────────────────── */}
      <section className="py-20 px-6 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-2">How We Work</p>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">عملية التطوير</h2>
            <p className="text-white/35 text-sm">خمس مراحل واضحة — شفافية كاملة في كل خطوة</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {PROCESS_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="relative bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all group">
                  {i < PROCESS_STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-8 -left-1.5 w-3 h-px bg-white/[0.1]" />
                  )}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-black text-white/20 font-mono">{step.num}</span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-white/40 group-hover:text-white/70 transition-colors" />
                    </div>
                  </div>
                  <p className="text-sm font-black text-white mb-0.5">{step.title}</p>
                  <p className="text-[10px] text-white/25 font-mono mb-2">{step.sub}</p>
                  <p className="text-xs text-white/35 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────────────── */}
      <section id="services" className="py-20 px-6 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-2">Dev Services</p>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">خدمات التطوير المتخصصة</h2>
            <p className="text-white/35 text-sm max-w-xl mx-auto">من واجهات المستخدم إلى البنية التحتية السحابية — كل ما يحتاجه مشروعك</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {DEV_SERVICES.map((svc, i) => {
              const Icon = svc.icon;
              return (
                <div key={i} className="group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-6 transition-all flex flex-col">
                  {svc.tag && (
                    <span className="absolute top-4 left-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.07] text-white/40 border border-white/[0.08]">
                      {svc.tag}
                    </span>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-5 group-hover:bg-white/[0.09] transition-colors">
                    <Icon className="w-5 h-5 text-white/50 group-hover:text-white/80 transition-colors" />
                  </div>
                  <h3 className="text-sm font-black text-white mb-0.5">{svc.title}</h3>
                  <p className="text-[10px] text-white/25 font-mono mb-3">{svc.sub}</p>
                  <p className="text-xs text-white/40 mb-5 leading-relaxed flex-1">{svc.desc}</p>
                  <ul className="space-y-1.5 mb-5">
                    {svc.features.map((f, fi) => (
                      <li key={fi} className="flex items-center gap-2 text-xs text-white/30">
                        <span className="w-1 h-1 rounded-full bg-white/25 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between border-t border-white/[0.05] pt-4">
                    <span className="text-xs font-mono text-white/25">من {svc.price} ر.س</span>
                    <Link href="/order">
                      <button className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white font-semibold transition-colors">
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

      {/* ── API Code Preview ──────────────────────────────────────────── */}
      <section id="api" className="py-20 px-6 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* Left — API info */}
            <div>
              <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-3">Developer API</p>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-5">
                API نظيف وموثق<br />
                <span className="text-white/30 font-medium text-xl">جاهز للتكامل الفوري</span>
              </h2>
              <p className="text-white/40 text-sm leading-relaxed mb-8">
                نوفر APIs مبنية على معايير REST مع توثيق OpenAPI 3.0 شامل.
                ابدأ التكامل في دقائق مع أمثلة كود جاهزة لكل نقطة نهاية.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  { icon: Key, text: "مصادقة Bearer Token", sub: "JWT مُوقَّع HS256" },
                  { icon: FileCode, text: "توثيق OpenAPI 3.0 كامل", sub: "Swagger UI تفاعلي" },
                  { icon: Zap, text: "استجابة < 100ms متوسطاً", sub: "بنية مُحسَّنة للأداء" },
                  { icon: RefreshCw, text: "Webhooks للأحداث الفورية", sub: "Retry ذكي مع backoff" },
                  { icon: Lock, text: "TLS 1.3 وتشفير كامل", sub: "HTTPS-only، لا HTTP" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                      <div className="w-8 h-8 bg-white/[0.04] border border-white/[0.08] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-white/40" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white/70">{item.text}</p>
                        <p className="text-[10px] text-white/25 font-mono">{item.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                <p className="text-xs text-white/30 mb-2 font-bold uppercase tracking-widest">Base URL</p>
                <p className="font-mono text-sm text-white/60" dir="ltr">https://api.qiroxstudio.online/v1</p>
              </div>
            </div>

            {/* Right — Code block with tabs */}
            <div>
              {/* Tabs */}
              <div className="flex items-center gap-1 mb-0 bg-white/[0.03] border border-white/[0.06] rounded-t-2xl px-3 py-2">
                {CODE_TABS.map((tab, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === i
                        ? "bg-white/[0.08] text-white border border-white/[0.1]"
                        : "text-white/30 hover:text-white/50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                <div className="flex-1" />
                <span className="text-[10px] text-white/20 font-mono">{CODE_TABS[activeTab].lang}</span>
              </div>

              <div className="bg-[#111] border border-t-0 border-white/[0.06] rounded-b-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.05]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/[0.1]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/[0.1]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/[0.1]" />
                  </div>
                  <button
                    onClick={() => copyCode(activeTab)}
                    className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors"
                  >
                    {copiedIdx === activeTab ? <Check className="w-3.5 h-3.5 text-white/60" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedIdx === activeTab ? "تم النسخ" : "نسخ"}
                  </button>
                </div>
                <pre className="p-5 text-[12px] font-mono overflow-x-auto leading-relaxed" style={{ direction: "ltr" }}>
                  <code>
                    {CODE_TABS[activeTab].code.split("\n").map((line, i) => (
                      <span key={i} className={`block ${highlight(line)}`}>{line}</span>
                    ))}
                  </code>
                </pre>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Packages ─────────────────────────────────────────────────── */}
      <section id="packages" className="py-20 px-6 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-2">Pricing</p>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">باقات التطوير</h2>
            <p className="text-white/35 text-sm">اختر الباقة المناسبة أو تواصل معنا لعرض مخصص</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PACKAGES.map((pkg, i) => (
              <div key={i} className={`relative flex flex-col rounded-2xl overflow-hidden border transition-all hover:-translate-y-0.5 ${
                pkg.highlight
                  ? "bg-white border-white/20"
                  : "bg-white/[0.03] border-white/[0.08]"
              }`}>
                {pkg.highlight && (
                  <div className="absolute top-0 inset-x-0 text-center py-1.5 bg-black">
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">الأشهر</span>
                  </div>
                )}
                <div className={`p-6 flex flex-col flex-1 ${pkg.highlight ? "pt-10" : ""}`}>
                  <div className="mb-6">
                    <p className="text-[10px] font-mono mb-1 ${pkg.highlight ? 'text-black/30' : 'text-white/25'}">{pkg.title}</p>
                    <p className={`text-lg font-black ${pkg.highlight ? "text-black" : "text-white"}`}>{pkg.nameAr}</p>
                  </div>
                  <div className="mb-6">
                    {pkg.price ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-3xl font-black ${pkg.highlight ? "text-black" : "text-white"}`}>{pkg.price.toLocaleString()}</span>
                        <span className={`text-xs ${pkg.highlight ? "text-black/40" : "text-white/25"}`}>ر.س / {pkg.period}</span>
                      </div>
                    ) : (
                      <p className={`text-xl font-black ${pkg.highlight ? "text-black" : "text-white"}`}>حسب المشروع</p>
                    )}
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-8">
                    {pkg.features.map((f, fi) => (
                      <li key={fi} className={`flex items-start gap-2.5 text-sm ${pkg.highlight ? "text-black/60" : "text-white/40"}`}>
                        <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${pkg.highlight ? "text-black/50" : "text-white/25"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={pkg.href}>
                    <Button className={`w-full rounded-xl h-11 font-bold ${
                      pkg.highlight
                        ? "bg-black text-white hover:bg-black/85"
                        : "bg-white/[0.06] text-white hover:bg-white/[0.12] border border-white/[0.08]"
                    }`}>
                      {pkg.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why QIROX ────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-2">Why Us</p>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">لماذا QIROX للتطوير؟</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: GitBranch, title: "كود قابل للصيانة", desc: "أفضل ممارسات الكتابة والتوثيق لضمان سهولة الإضافة والتعديل في المستقبل" },
              { icon: Layers, title: "هندسة قابلة للتوسع", desc: "نُصمم الأنظمة لتتحمل النمو من آلاف إلى ملايين المستخدمين دون إعادة كتابة" },
              { icon: CircuitBoard, title: "اختبارات شاملة", desc: "Unit / Integration / E2E tests لضمان استقرار كامل قبل كل إصدار" },
              { icon: Workflow, title: "تسليم أجايل", desc: "سبرينتات أسبوعية مع demos منتظمة للتحقق من التوافق مع رؤيتك" },
              { icon: MessageSquare, title: "تواصل شفاف", desc: "تقارير يومية وقناة تواصل مخصصة لمتابعة تقدم المشروع لحظة بلحظة" },
              { icon: Puzzle, title: "حلول مخصصة", desc: "لا templates جاهزة — كل مشروع يُبنى من الصفر بناءً على احتياجاتك" },
              { icon: Star, title: "معايير عالية", desc: "كل سطر كود يمر بمراجعة الزملاء وفحص الجودة قبل الدمج في الفرع الرئيسي" },
              { icon: Shield, title: "أمان أولاً", desc: "تطبيق OWASP Top 10 وممارسات الأمان في كل مرحلة من مراحل التطوير" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] rounded-2xl p-5 transition-all group">
                  <div className="w-8 h-8 bg-white/[0.04] border border-white/[0.07] rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-3.5 h-3.5 text-white/35 group-hover:text-white/60 transition-colors" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-white/30 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-6 border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-2">FAQ</p>
            <h2 className="text-2xl md:text-3xl font-black text-white">أسئلة شائعة</h2>
          </div>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <div key={i} className="border border-white/[0.07] rounded-xl overflow-hidden bg-white/[0.02]">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-right hover:bg-white/[0.03] transition-colors"
                  data-testid={`faq-${i}`}
                >
                  <span className="text-sm font-semibold text-white/80">{item.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-4 h-4 text-white/30 flex-shrink-0 ml-3" />
                    : <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0 ml-3" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 border-t border-white/[0.05]">
                    <p className="text-sm text-white/40 leading-relaxed pt-4">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-5 leading-tight">
            جاهز لبناء<br />
            <span className="text-white/30">ما تتخيله؟</span>
          </h2>
          <p className="text-white/35 text-base mb-10 leading-relaxed">
            تحدث معنا عن مشروعك اليوم — جلسة أولى مجانية لتقييم المتطلبات واقتراح المعمارية المناسبة.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/order">
              <Button size="lg" className="bg-white text-black hover:bg-white/90 rounded-2xl px-10 h-12 font-bold gap-2">
                ابدأ مشروعك <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.07] rounded-2xl px-8 h-12 font-bold">
                تحدث معنا
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
