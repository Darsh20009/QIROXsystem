import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import {
  Video, QrCode, Sparkles, Zap, ArrowLeft, ArrowRight,
  Check, ExternalLink, Shield, Globe, Users, Cpu,
  BarChart2, FileImage, Calculator, Code2, Layers,
  Play, LogIn, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TOOLS = [
  {
    id: "qmeet",
    nameAr: "QMeet",
    nameEn: "QMeet",
    taglineAr: "اجتماعات احترافية بالفيديو",
    taglineEn: "Professional video meetings",
    descAr: "منصة اجتماعات بالفيديو فائقة الجودة مع مشاركة الشاشة الكاملة وملاحظات الذكاء الاصطناعي وغرف آمنة مشفرة.",
    descEn: "High-quality video meeting platform with full screen sharing, AI notes, and secure encrypted rooms.",
    icon: Video,
    gradient: "from-blue-500 via-indigo-500 to-violet-600",
    glow: "shadow-blue-500/30",
    badgeAr: "مباشر",
    badgeEn: "LIVE",
    badgeColor: "bg-blue-500",
    featuresAr: ["فيديو وصوت HD", "مشاركة الشاشة مع الصوت", "ملاحظات ذكاء اصطناعي", "حتى 20 مشارك", "غرف آمنة بكود", "تسجيل الاجتماعات"],
    featuresEn: ["HD video & audio", "Screen sharing with audio", "AI meeting notes", "Up to 20 participants", "Secure coded rooms", "Meeting recording"],
    hrefClient: "/qmeet",
    hrefEmployee: "/admin/qmeet",
    subdomain: "qmeet",
    joinHref: "/meet/join",
    joinLabelAr: "انضم باكود",
    joinLabelEn: "Join by code",
  },
  {
    id: "barcode",
    nameAr: "Barcode Studio",
    nameEn: "Barcode Studio",
    taglineAr: "توليد باركود وQR احترافي",
    taglineEn: "Professional barcode & QR generation",
    descAr: "أنشئ رموز QR وباركود بجميع أنواعها بدقة عالية وتحميل فوري بصيغ متعددة — مجاناً وبدون حد.",
    descEn: "Generate QR codes and barcodes in all types with high precision and instant download in multiple formats — free and unlimited.",
    icon: QrCode,
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    glow: "shadow-emerald-500/30",
    badgeAr: "مجاني",
    badgeEn: "FREE",
    badgeColor: "bg-emerald-500",
    featuresAr: ["جميع أنواع QR", "باركود EAN/UPC/Code128", "تخصيص الألوان والحجم", "تحميل PNG/SVG/PDF", "معالجة جماعية", "بدون تسجيل"],
    featuresEn: ["All QR types", "EAN/UPC/Code128 barcodes", "Color & size customization", "PNG/SVG/PDF download", "Bulk processing", "No registration needed"],
    hrefClient: "/barcode-studio",
    hrefEmployee: "/barcode-studio",
    subdomain: "barcode",
    joinHref: null,
    joinLabelAr: null,
    joinLabelEn: null,
  },
  {
    id: "qi",
    nameAr: "QI — الذكاء الاصطناعي",
    nameEn: "QI — AI Assistant",
    taglineAr: "مساعد ذكاء اصطناعي قوي جداً",
    taglineEn: "Extremely powerful AI assistant",
    descAr: "ذكاء اصطناعي متقدم مدعوم بـ Qirox AI — يفهم العربية والإنجليزية، يكتب الكود، يحلل البيانات، ويُنجز مهامك بشكل استثنائي.",
    descEn: "Advanced AI powered by Qirox AI — understands Arabic and English, writes code, analyzes data, and completes your tasks exceptionally.",
    icon: Sparkles,
    gradient: "from-purple-500 via-violet-500 to-fuchsia-600",
    glow: "shadow-purple-500/30",
    badgeAr: "مميز",
    badgeEn: "PREMIUM",
    badgeColor: "bg-purple-500",
    featuresAr: ["يدعم العربية بشكل كامل", "كتابة وتصحيح الكود", "تحليل الملفات والبيانات", "توليد الصور بالذكاء الاصطناعي", "محادثة طويلة بدون انقطاع", "نتائج متقدمة ودقيقة"],
    featuresEn: ["Full Arabic support", "Code writing & debugging", "File & data analysis", "AI image generation", "Long uninterrupted chat", "Advanced & accurate results"],
    hrefClient: "/ai-studio",
    hrefEmployee: "/employee/studio",
    subdomain: "ai",
    joinHref: null,
    joinLabelAr: null,
    joinLabelEn: null,
  },
  {
    id: "mytools",
    nameAr: "أدواتي",
    nameEn: "My Tools",
    taglineAr: "+50 أداة تقنية احترافية",
    taglineEn: "50+ professional tech tools",
    descAr: "مجموعة شاملة تضم أكثر من 50 أداة تقنية: أدوات PDF، تعديل الصور، الحسابات، تحويل الملفات، وأدوات المطورين — كلها في مكان واحد.",
    descEn: "A comprehensive suite of 50+ tech tools: PDF tools, image editing, calculators, file converters, and developer tools — all in one place.",
    icon: Zap,
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    glow: "shadow-orange-500/30",
    badgeAr: "+50 أداة",
    badgeEn: "50+ Tools",
    badgeColor: "bg-orange-500",
    featuresAr: ["أدوات PDF متكاملة", "تعديل وضغط الصور", "مولد كلمات مرور آمن", "حسابات متعددة", "أدوات المطورين", "يعمل بالكامل في المتصفح"],
    featuresEn: ["Complete PDF tools", "Image editing & compression", "Secure password generator", "Multiple calculators", "Developer utilities", "Runs entirely in browser"],
    hrefClient: "/my-tools",
    hrefEmployee: "/my-tools",
    subdomain: "tools",
    joinHref: null,
    joinLabelAr: null,
    joinLabelEn: null,
  },
];

const STATS = [
  { valueAr: "4", valueEn: "4", labelAr: "أدوات متكاملة", labelEn: "Integrated Tools", icon: Layers },
  { valueAr: "+50", valueEn: "50+", labelAr: "مُميزة حصرية", labelEn: "Exclusive Features", icon: Zap },
  { valueAr: "100%", valueEn: "100%", labelAr: "مجانية للعملاء", labelEn: "Free for Clients", icon: Shield },
  { valueAr: "∞", valueEn: "∞", labelAr: "استخدام غير محدود", labelEn: "Unlimited Usage", icon: Globe },
];

export default function OurTools() {
  const { user } = useUser();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const [, navigate] = useLocation();

  const isEmployee = user && !["client", "investor"].includes((user as any).role || "");

  function getToolHref(tool: typeof TOOLS[0]) {
    if (isEmployee) return tool.hrefEmployee;
    return tool.hrefClient;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[10%] w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[5%] w-80 h-80 rounded-full bg-purple-600/10 blur-3xl" />
          <div className="absolute top-[30%] right-[30%] w-64 h-64 rounded-full bg-emerald-600/8 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-gray-950/80" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
                <img src="/qirox-icon.png" alt="QIROX" className="w-6 h-6 object-contain" />
              </div>
              <span className="text-white/40 text-sm font-medium tracking-widest uppercase">QIROX</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">
              {L ? "أدواتنا" : "Our Tools"}
            </h1>
            <p className="text-white/50 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
              {L
                ? "مجموعة أدوات تقنية احترافية متكاملة — مُصمَّمة لعملاء QIROX"
                : "A suite of professional integrated tools — designed for QIROX clients"}
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10"
          >
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.labelEn} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 text-center backdrop-blur-sm">
                  <Icon className="w-5 h-5 text-white/30 mx-auto mb-2" />
                  <p className="text-2xl font-black text-white">{L ? s.valueAr : s.valueEn}</p>
                  <p className="text-white/40 text-xs mt-0.5">{L ? s.labelAr : s.labelEn}</p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* ── Tools Grid ── */}
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
        {TOOLS.map((tool, i) => {
          const Icon = tool.icon;
          const href = getToolHref(tool);
          const featuresAr = tool.featuresAr;
          const featuresEn = tool.featuresEn;
          const features = L ? featuresAr : featuresEn;
          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="group relative bg-white dark:bg-gray-900 border border-black/[0.07] dark:border-white/[0.06] rounded-3xl overflow-hidden hover:border-black/[0.12] dark:hover:border-white/[0.1] transition-all hover:shadow-xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity`} />

              <div className="flex flex-col md:flex-row">
                {/* Left: gradient header */}
                <div className={`relative bg-gradient-to-br ${tool.gradient} md:w-72 lg:w-80 p-8 flex flex-col justify-between shrink-0`}>
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <Badge className={`${tool.badgeColor} text-white border-0 text-xs mb-3`}>
                      {L ? tool.badgeAr : tool.badgeEn}
                    </Badge>
                    <h2 className="text-2xl font-black text-white mb-1">
                      {L ? tool.nameAr : tool.nameEn}
                    </h2>
                    <p className="text-white/70 text-sm font-medium">
                      {L ? tool.taglineAr : tool.taglineEn}
                    </p>
                  </div>

                  {/* Subdomain label */}
                  <div className="relative mt-6 bg-black/20 rounded-xl px-3 py-2">
                    <p className="text-white/50 text-[10px] font-mono uppercase tracking-wider">
                      {L ? "السب دومين" : "Subdomain"}
                    </p>
                    <p className="text-white/80 text-xs font-mono font-bold">
                      {tool.subdomain}.yourdomain.com
                    </p>
                  </div>
                </div>

                {/* Right: content */}
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-between gap-6">
                  <div>
                    <p className="text-black/60 dark:text-white/60 text-sm leading-relaxed mb-5">
                      {L ? tool.descAr : tool.descEn}
                    </p>

                    {/* Features */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {features.map((f, fi) => (
                        <div key={fi} className="flex items-center gap-2 text-sm text-black/70 dark:text-white/70">
                          <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${tool.gradient} flex items-center justify-center shrink-0`}>
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    {user ? (
                      <Link href={href}>
                        <Button
                          className={`bg-gradient-to-l ${tool.gradient} hover:opacity-90 text-white border-0 shadow-lg ${tool.glow} font-bold`}
                          data-testid={`btn-open-${tool.id}`}
                        >
                          <Play className="w-4 h-4 ml-1.5" />
                          {L ? "افتح الأداة" : "Open Tool"}
                          {dir === "rtl" ? <ChevronLeft className="w-4 h-4 mr-1.5" /> : <ChevronRight className="w-4 h-4 ml-1.5" />}
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/login?redirect=${href}`}>
                        <Button
                          className={`bg-gradient-to-l ${tool.gradient} hover:opacity-90 text-white border-0 shadow-lg ${tool.glow} font-bold`}
                          data-testid={`btn-login-${tool.id}`}
                        >
                          <LogIn className="w-4 h-4 ml-1.5" />
                          {L ? "سجّل دخول للوصول" : "Login to Access"}
                        </Button>
                      </Link>
                    )}

                    {tool.joinHref && (
                      <Link href={tool.joinHref}>
                        <Button
                          variant="outline"
                          className="border-black/10 dark:border-white/10 text-black/70 dark:text-white/70"
                          data-testid={`btn-join-${tool.id}`}
                        >
                          {L ? tool.joinLabelAr : tool.joinLabelEn}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Subdomain Info Section ── */}
      <div className="max-w-5xl mx-auto px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-3xl p-8 border border-white/[0.07]"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <Globe className="w-6 h-6 text-white/60" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1">
                {L ? "كيف يعمل السب دومين لكل أداة؟" : "How does each tool's subdomain work?"}
              </h3>
              <p className="text-white/50 text-sm mb-4 leading-relaxed">
                {L
                  ? "كل أداة تملك نطاقها الفرعي الخاص — تفتحها كأنها موقع مستقل وبهوية بصرية خاصة، مع نفس تسجيل الدخول الموحد لكيروكس."
                  : "Each tool has its own subdomain — opens like an independent site with its own visual identity, using the same unified Qirox login."}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TOOLS.map(t => {
                  const Icon = t.icon;
                  return (
                    <div key={t.id} className="bg-white/[0.05] rounded-xl p-3 border border-white/[0.06]">
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-2`}>
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <p className="text-white/80 text-xs font-bold mb-0.5">{L ? t.nameAr : t.nameEn}</p>
                      <p className="text-white/30 text-[10px] font-mono">{t.subdomain}.domain.com</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-white/30 text-xs mt-4">
                {L
                  ? "لإعداد السب دومين: تواصل مع فريق QIROX أو أضف DNS CNAME لكل نطاق فرعي يشير إلى نطاق منصتك الرئيسي."
                  : "To set up subdomains: contact the QIROX team or add a DNS CNAME record for each subdomain pointing to your main platform domain."}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-black/[0.06] dark:border-white/[0.06] py-6">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <img src="/qirox-icon.png" alt="QIROX" className="w-6 h-6 object-contain dark:invert" />
            <span className="text-black/40 dark:text-white/40 text-sm">
              {L ? "مُقدَّم بواسطة QIROX Systems Factory" : "Powered by QIROX Systems Factory"}
            </span>
          </div>
          <Link href="/">
            <span className="text-black/40 dark:text-white/40 text-sm hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
              {L ? "العودة للرئيسية" : "Back to Home"}
              {dir === "rtl" ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
