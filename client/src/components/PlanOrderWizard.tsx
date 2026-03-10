import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import SARIcon from "@/components/SARIcon";
import {
  ArrowLeft, ArrowRight, X, Check, Loader2, ShoppingCart, Building2,
  Lightbulb, Globe, Smartphone, LayoutDashboard, ShoppingBag, CreditCard,
  Bell, BarChart3, Users, Calendar, Package, Truck, MessageSquare,
  Headphones, Star, Lock, Languages, Palette, Code2, Zap, Server,
  Heart, FileText, BookOpen, Award, Wifi, Camera, Send, CircleCheck,
  CheckCircle2, ChevronRight, Cpu, Link2, BotMessageSquare
} from "lucide-react";
import { QiroxIcon } from "@/components/qirox-brand";
import { Link } from "wouter";

/* ─── Types ─────────────────────────────────────────── */
export interface ProjectBrief {
  businessName: string;
  projectIdea: string;
  requestedModules: string[];
  hasLogo: boolean;
  hasDomain: boolean;
  domainName: string;
  hasHosting: boolean;
  siteLanguage: "arabic" | "english" | "both";
  competitors: string;
  notes: string;
}

interface WizardProps {
  plan: any;
  price: number;
  periodLabel: string;
  tierLabel: string;
  segLabel: string;
  tierCfg: any;
  lang: string;
  user: any;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (brief: ProjectBrief) => void;
}

/* ─── Available modules to pick from ───────────────── */
const MODULES = [
  { id: "dashboard",     icon: LayoutDashboard,  labelAr: "لوحة تحكم المدير",       labelEn: "Admin Dashboard" },
  { id: "products",      icon: Package,           labelAr: "إدارة المنتجات",           labelEn: "Product Management" },
  { id: "orders",        icon: ShoppingBag,       labelAr: "نظام الطلبات",             labelEn: "Orders System" },
  { id: "payments",      icon: CreditCard,        labelAr: "بوابة الدفع الإلكتروني",  labelEn: "Payment Gateway" },
  { id: "notifications", icon: Bell,              labelAr: "إشعارات فورية",            labelEn: "Push Notifications" },
  { id: "reports",       icon: BarChart3,         labelAr: "تقارير وإحصاءات",          labelEn: "Reports & Analytics" },
  { id: "customers",     icon: Users,             labelAr: "تسجيل دخول العملاء",      labelEn: "Customer Accounts" },
  { id: "bookings",      icon: Calendar,          labelAr: "نظام الحجوزات",            labelEn: "Booking System" },
  { id: "inventory",     icon: Truck,             labelAr: "إدارة المخزون",            labelEn: "Inventory Management" },
  { id: "staff",         icon: Award,             labelAr: "إدارة الموظفين",           labelEn: "Staff Management" },
  { id: "whatsapp",      icon: Send,              labelAr: "تكامل واتساب",             labelEn: "WhatsApp Integration" },
  { id: "chat",          icon: MessageSquare,     labelAr: "دردشة مدمجة",             labelEn: "Live Chat" },
  { id: "loyalty",       icon: Star,              labelAr: "نقاط ولاء",               labelEn: "Loyalty Points" },
  { id: "blog",          icon: BookOpen,          labelAr: "مدونة / محتوى",           labelEn: "Blog / Content" },
  { id: "mobile",        icon: Smartphone,        labelAr: "تطبيق جوال",              labelEn: "Mobile App" },
  { id: "multilang",     icon: Languages,         labelAr: "تعدد اللغات",             labelEn: "Multi-language" },
  { id: "seo",           icon: Globe,             labelAr: "SEO وتحسين البحث",         labelEn: "SEO Optimization" },
  { id: "ai",            icon: BotMessageSquare,  labelAr: "ذكاء اصطناعي",           labelEn: "AI Features" },
];

const STEPS = ["project", "modules", "infra", "review"] as const;
type Step = typeof STEPS[number];

const STEP_META: Record<Step, { titleAr: string; titleEn: string; descAr: string; descEn: string; icon: any }> = {
  project: { titleAr: "بيانات المشروع",     titleEn: "Project Details",      descAr: "أخبرنا عن مشروعك",           descEn: "Tell us about your project",   icon: Lightbulb },
  modules: { titleAr: "مكونات النظام",      titleEn: "System Modules",       descAr: "اختر الوحدات التي تحتاجها",  descEn: "Pick the modules you need",    icon: Cpu },
  infra:   { titleAr: "البنية التحتية",    titleEn: "Infrastructure",       descAr: "ما لديك وما تحتاجه",         descEn: "What you have & need",         icon: Server },
  review:  { titleAr: "مراجعة وتأكيد",    titleEn: "Review & Confirm",     descAr: "تحقق من كل شيء قبل الإرسال", descEn: "Verify everything before sending", icon: CheckCircle2 },
};

/* ─── Small reusable toggle ─────────────────────────── */
function Toggle({ value, onChange, labelOn, labelOff, lang }: {
  value: boolean; onChange: (v: boolean) => void; labelOn: string; labelOff: string; lang: string;
}) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`relative inline-flex h-7 w-13 items-center rounded-full transition-colors shrink-0 focus:outline-none border ${value ? "bg-blue-600 border-blue-500" : "bg-slate-800 border-slate-700"}`}
      style={{ width: 52 }}>
      <span className={`inline-block w-5 h-5 transform rounded-full bg-white shadow transition-transform ${value ? (lang === "ar" ? "-translate-x-6" : "translate-x-6") : (lang === "ar" ? "-translate-x-1" : "translate-x-1")}`} />
    </button>
  );
}

/* ─── Progress dots ─────────────────────────────────── */
function StepDots({ current, lang }: { current: number; lang: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
      {STEPS.map((s, i) => (
        <div key={s} className={`transition-all duration-300 rounded-full ${i === current ? "w-6 h-2 bg-blue-500" : i < current ? "w-2 h-2 bg-blue-500/40" : "w-2 h-2 bg-slate-700"}`} />
      ))}
    </div>
  );
}

/* ─── Main Wizard Component ─────────────────────────── */
export default function PlanOrderWizard({
  plan, price, periodLabel, tierLabel, segLabel, tierCfg, lang,
  user, isPending, onClose, onConfirm,
}: WizardProps) {
  const isInf = plan.tier === "infinite";
  const isPro = plan.tier === "pro";
  const accentColor = isInf ? "#f59e0b" : isPro ? "#60a5fa" : "#94a3b8";

  const [stepIdx, setStepIdx] = useState(0);
  const currentStep = STEPS[stepIdx];
  const stepMeta = STEP_META[currentStep];

  const [brief, setBrief] = useState<ProjectBrief>({
    businessName: "",
    projectIdea: "",
    requestedModules: [],
    hasLogo: false,
    hasDomain: false,
    domainName: "",
    hasHosting: false,
    siteLanguage: "arabic",
    competitors: "",
    notes: "",
  });

  function update<K extends keyof ProjectBrief>(key: K, val: ProjectBrief[K]) {
    setBrief(prev => ({ ...prev, [key]: val }));
  }

  function toggleModule(id: string) {
    setBrief(prev => ({
      ...prev,
      requestedModules: prev.requestedModules.includes(id)
        ? prev.requestedModules.filter(m => m !== id)
        : [...prev.requestedModules, id],
    }));
  }

  function canProceed(): boolean {
    if (currentStep === "project") return brief.businessName.trim().length >= 2;
    return true;
  }

  const planName = lang === "ar" ? (plan.nameAr || tierLabel) : (plan.nameEn || plan.nameAr || tierLabel);

  /* ─── Header gradient ─── */
  const headerGrad = isInf
    ? "from-[#0d0c15] to-[#100f1a]"
    : isPro ? "from-[#0c1a3a] to-[#0e2048]"
    : "from-[#0f1117] to-[#111318]";

  return (
    <div className="flex flex-col max-h-[92vh] overflow-hidden bg-[#08080f] rounded-2xl" dir={lang === "ar" ? "rtl" : "ltr"}>

      {/* ── Top bar ── */}
      <div className={`relative flex items-center justify-between px-5 py-4 bg-gradient-to-r ${headerGrad} border-b border-white/[0.06] shrink-0`}>
        {/* Left/Right brand */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white/8 flex items-center justify-center">
            <QiroxIcon className="w-3.5 h-3.5 opacity-70" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hidden sm:block">QIROX FACTORY</span>
        </div>

        {/* Step dots center */}
        <StepDots current={stepIdx} lang={lang} />

        {/* Close */}
        <button onClick={onClose}
          className="w-7 h-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center hover:bg-white/10 transition-colors">
          <X className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* ── Plan mini-summary bar ── */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white/[0.025] border-b border-white/[0.05] shrink-0 overflow-x-auto">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isInf ? "bg-amber-400/10" : isPro ? "bg-blue-500/10" : "bg-slate-700/40"}`}>
          <tierCfg.icon className="w-4 h-4" style={{ color: accentColor }} />
        </div>
        <span className="text-xs font-black text-white shrink-0">{planName}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold border shrink-0" style={{ color: accentColor, borderColor: accentColor + "30", background: accentColor + "12" }}>{tierLabel}</span>
        <span className="text-[10px] text-slate-500 shrink-0">{segLabel}</span>
        <div className={`mr-auto rtl:mr-0 rtl:ml-auto flex items-baseline gap-1 shrink-0 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
          <span className="text-base font-black text-white">{price.toLocaleString()}</span>
          <span className="text-slate-500 text-xs">SAR / {periodLabel}</span>
        </div>
      </div>

      {/* ── Step header ── */}
      <div className="px-5 pt-5 pb-3 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center">
            <stepMeta.icon className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">
            {lang === "ar" ? `الخطوة ${stepIdx + 1} من ${STEPS.length}` : `Step ${stepIdx + 1} of ${STEPS.length}`}
          </span>
        </div>
        <h2 className="text-lg font-black text-white">{lang === "ar" ? stepMeta.titleAr : stepMeta.titleEn}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{lang === "ar" ? stepMeta.descAr : stepMeta.descEn}</p>
      </div>

      {/* ── Step content (scrollable) ── */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: lang === "ar" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: lang === "ar" ? 20 : -20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >

            {/* ══ STEP 1: PROJECT ══════════════════════════════ */}
            {currentStep === "project" && (
              <div className="space-y-5">
                {/* Business name */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2">
                    <span className="text-red-400">*</span> {lang === "ar" ? "اسم النشاط / المشروع" : "Business / Project Name"}
                  </label>
                  <input
                    type="text"
                    value={brief.businessName}
                    onChange={e => update("businessName", e.target.value)}
                    placeholder={lang === "ar" ? "مثال: مطعم الأصالة، متجر النور..." : "e.g. Al-Asala Restaurant, Al-Noor Store..."}
                    className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-slate-700/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.06] transition-all"
                    data-testid="input-business-name"
                  />
                  {brief.businessName.length > 0 && brief.businessName.length < 2 && (
                    <p className="text-xs text-red-400 mt-1.5">{lang === "ar" ? "يجب أن يكون الاسم أطول من حرف" : "Name must be at least 2 characters"}</p>
                  )}
                </div>

                {/* Project idea */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2">
                    {lang === "ar" ? "فكرة المشروع وهدفه" : "Project Idea & Goal"}
                  </label>
                  <textarea
                    value={brief.projectIdea}
                    onChange={e => update("projectIdea", e.target.value)}
                    rows={4}
                    placeholder={lang === "ar"
                      ? "اشرح لنا فكرة مشروعك، ماذا تريد أن تحقق، ومن هو جمهورك المستهدف..."
                      : "Describe your project idea, what you want to achieve, and your target audience..."}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-slate-700/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.06] transition-all resize-none leading-relaxed"
                    data-testid="input-project-idea"
                  />
                </div>

                {/* Quick tip */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-500/[0.06] border border-blue-500/15">
                  <Lightbulb className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {lang === "ar"
                      ? "كلما أعطيتنا تفاصيل أكثر، كان نظامك أكثر دقة وتخصيصاً لك. يمكنك ترك الحقل فارغاً والتواصل معنا لاحقاً."
                      : "The more details you give, the more tailored your system will be. You can leave it empty and contact us later."}
                  </p>
                </div>
              </div>
            )}

            {/* ══ STEP 2: MODULES ══════════════════════════════ */}
            {currentStep === "modules" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-slate-400">
                    {lang === "ar" ? "اضغط على الوحدة لتحديدها أو إلغائها" : "Tap a module to select or deselect it"}
                  </p>
                  <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/20">
                    {brief.requestedModules.length} {lang === "ar" ? "محددة" : "selected"}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MODULES.map(mod => {
                    const selected = brief.requestedModules.includes(mod.id);
                    const ModIcon = mod.icon;
                    return (
                      <motion.button
                        key={mod.id} type="button"
                        onClick={() => toggleModule(mod.id)}
                        whileTap={{ scale: 0.96 }}
                        data-testid={`module-${mod.id}`}
                        className={`relative flex flex-col items-start gap-2 p-3.5 rounded-xl border text-start transition-all duration-150 ${
                          selected
                            ? isInf
                              ? "bg-amber-400/10 border-amber-400/40 shadow-lg shadow-amber-400/5"
                              : isPro
                              ? "bg-blue-500/15 border-blue-500/40 shadow-lg shadow-blue-500/5"
                              : "bg-slate-700/50 border-slate-500/50"
                            : "bg-white/[0.025] border-slate-800/80 hover:border-slate-700/80 hover:bg-white/[0.04]"
                        }`}
                      >
                        {selected && (
                          <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: accentColor + "30" }}>
                            <Check className="w-2.5 h-2.5" style={{ color: accentColor }} />
                          </div>
                        )}
                        <ModIcon className={`w-5 h-5 transition-colors ${selected ? "" : "text-slate-600"}`}
                          style={selected ? { color: accentColor } : {}} />
                        <span className={`text-[11px] font-bold leading-snug transition-colors ${selected ? "text-white" : "text-slate-500"}`}>
                          {lang === "ar" ? mod.labelAr : mod.labelEn}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {brief.requestedModules.length === 0 && (
                  <p className="text-center text-xs text-slate-600 mt-4 py-2">
                    {lang === "ar" ? "يمكنك المتابعة بدون تحديد — سنتواصل معك لتحديد المتطلبات" : "You can continue without selecting — we'll contact you for requirements"}
                  </p>
                )}
              </div>
            )}

            {/* ══ STEP 3: INFRASTRUCTURE ════════════════════════ */}
            {currentStep === "infra" && (
              <div className="space-y-5">

                {/* Logo */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">
                      <Palette className="w-4.5 h-4.5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{lang === "ar" ? "هل لديك شعار؟" : "Do you have a logo?"}</p>
                      <p className="text-[10px] text-slate-500">{lang === "ar" ? "شعار النشاط أو الهوية البصرية" : "Brand logo or visual identity"}</p>
                    </div>
                  </div>
                  <Toggle value={brief.hasLogo} onChange={v => update("hasLogo", v)} labelOn="نعم" labelOff="لا" lang={lang} />
                </div>

                {/* Domain */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">
                        <Globe className="w-4.5 h-4.5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{lang === "ar" ? "هل لديك دومين؟" : "Do you have a domain?"}</p>
                        <p className="text-[10px] text-slate-500">{lang === "ar" ? "مثل: mystore.com" : "e.g. mystore.com"}</p>
                      </div>
                    </div>
                    <Toggle value={brief.hasDomain} onChange={v => update("hasDomain", v)} labelOn="نعم" labelOff="لا" lang={lang} />
                  </div>
                  <AnimatePresence>
                    {brief.hasDomain && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                        <input
                          type="text"
                          value={brief.domainName}
                          onChange={e => update("domainName", e.target.value)}
                          placeholder="mystore.com"
                          className="w-full h-10 px-3 rounded-lg bg-slate-800/60 border border-slate-700/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500/60 transition-all"
                          data-testid="input-domain"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Hosting */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">
                      <Server className="w-4.5 h-4.5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{lang === "ar" ? "هل لديك استضافة؟" : "Do you have hosting?"}</p>
                      <p className="text-[10px] text-slate-500">{lang === "ar" ? "سيرفر أو خطة استضافة" : "Server or hosting plan"}</p>
                    </div>
                  </div>
                  <Toggle value={brief.hasHosting} onChange={v => update("hasHosting", v)} labelOn="نعم" labelOff="لا" lang={lang} />
                </div>

                {/* Site language */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2">
                    {lang === "ar" ? "لغة الموقع / النظام" : "Site / System Language"}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { val: "arabic",  labelAr: "عربي",     labelEn: "Arabic" },
                      { val: "english", labelAr: "إنجليزي",  labelEn: "English" },
                      { val: "both",    labelAr: "ثنائي اللغة", labelEn: "Both" },
                    ] as const).map(opt => (
                      <button key={opt.val} type="button"
                        onClick={() => update("siteLanguage", opt.val)}
                        className={`h-10 rounded-xl border text-xs font-bold transition-all ${
                          brief.siteLanguage === opt.val
                            ? "border-blue-500/50 bg-blue-500/15 text-blue-300"
                            : "border-slate-800 bg-white/[0.025] text-slate-500 hover:border-slate-700 hover:text-slate-300"
                        }`}
                      >
                        {lang === "ar" ? opt.labelAr : opt.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Competitors */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2">
                    {lang === "ar" ? "منافسون أو مراجع (اختياري)" : "Competitors or References (optional)"}
                  </label>
                  <input
                    type="text"
                    value={brief.competitors}
                    onChange={e => update("competitors", e.target.value)}
                    placeholder={lang === "ar" ? "مثال: noon.com، مطعم الباشا..." : "e.g. noon.com, competitor-site.com..."}
                    className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-slate-700/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500/60 transition-all"
                    data-testid="input-competitors"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2">
                    {lang === "ar" ? "ملاحظات إضافية" : "Additional Notes"}
                  </label>
                  <textarea
                    value={brief.notes}
                    onChange={e => update("notes", e.target.value)}
                    rows={3}
                    placeholder={lang === "ar" ? "أي تفاصيل أخرى تريد إضافتها..." : "Any other details you'd like to add..."}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-slate-700/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500/60 transition-all resize-none leading-relaxed"
                    data-testid="input-notes"
                  />
                </div>
              </div>
            )}

            {/* ══ STEP 4: REVIEW ════════════════════════════════ */}
            {currentStep === "review" && (
              <div className="space-y-4">

                {/* Plan card */}
                <div className={`p-4 rounded-xl border ${isInf ? "border-amber-400/20 bg-amber-400/5" : isPro ? "border-blue-500/25 bg-blue-500/8" : "border-slate-700/60 bg-white/[0.03]"}`}>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 mb-3">
                    {lang === "ar" ? "الباقة المختارة" : "SELECTED PLAN"}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <tierCfg.icon className="w-5 h-5" style={{ color: accentColor }} />
                      <span className="font-black text-white">{planName}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border" style={{ color: accentColor, borderColor: accentColor + "30", background: accentColor + "12" }}>{tierLabel}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-white">{price.toLocaleString()}</span>
                      <span className="text-xs text-slate-500">SAR / {periodLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Business info */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-slate-800/60 space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{lang === "ar" ? "بيانات المشروع" : "PROJECT INFO"}</p>
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-sm font-bold text-white">{brief.businessName || (lang === "ar" ? "—" : "—")}</span>
                  </div>
                  {brief.projectIdea && (
                    <p className="text-xs text-slate-400 leading-relaxed pr-6 rtl:pr-0 rtl:pl-6 border-t border-slate-800 pt-3">{brief.projectIdea}</p>
                  )}
                </div>

                {/* Modules */}
                {brief.requestedModules.length > 0 && (
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-slate-800/60">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 mb-3">
                      {lang === "ar" ? `المكونات المطلوبة — ${brief.requestedModules.length}` : `REQUESTED MODULES — ${brief.requestedModules.length}`}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {brief.requestedModules.map(id => {
                        const mod = MODULES.find(m => m.id === id);
                        if (!mod) return null;
                        const ModIcon = mod.icon;
                        return (
                          <span key={id} className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-slate-700/60 text-slate-300">
                            <ModIcon className="w-3 h-3 text-slate-500" />
                            {lang === "ar" ? mod.labelAr : mod.labelEn}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Infrastructure */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-slate-800/60">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 mb-3">{lang === "ar" ? "البنية التحتية" : "INFRASTRUCTURE"}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: lang === "ar" ? "شعار" : "Logo",    val: brief.hasLogo,    icon: Palette },
                      { label: lang === "ar" ? "دومين" : "Domain",  val: brief.hasDomain,  icon: Globe },
                      { label: lang === "ar" ? "استضافة" : "Hosting", val: brief.hasHosting, icon: Server },
                      { label: lang === "ar" ? "اللغة" : "Language", val: true, icon: Languages, display: brief.siteLanguage === "arabic" ? "عربي" : brief.siteLanguage === "english" ? "English" : "ثنائي" },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <item.icon className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        <span className="text-xs text-slate-500">{item.label}:</span>
                        {item.display
                          ? <span className="text-xs font-bold text-slate-300">{item.display}</span>
                          : item.val
                          ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                          : <X className="w-3.5 h-3.5 text-slate-700" />}
                      </div>
                    ))}
                  </div>
                  {brief.hasDomain && brief.domainName && (
                    <div className="mt-2 flex items-center gap-2 border-t border-slate-800 pt-2">
                      <Link2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span className="text-xs text-slate-400">{brief.domainName}</span>
                    </div>
                  )}
                  {brief.competitors && (
                    <div className="mt-2 flex items-start gap-2 border-t border-slate-800 pt-2">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-400">{brief.competitors}</span>
                    </div>
                  )}
                </div>

                {brief.notes && (
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-slate-800/60">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2">{lang === "ar" ? "ملاحظات" : "NOTES"}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{brief.notes}</p>
                  </div>
                )}

                {/* Info notice */}
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15">
                  <CircleCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {lang === "ar"
                      ? "ستُرسل هذه البيانات مع طلبك وسيتواصل معك فريقنا خلال 24 ساعة."
                      : "This data will be sent with your order and our team will contact you within 24 hours."}
                  </p>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Footer actions ── */}
      <div className="shrink-0 px-5 py-4 border-t border-white/[0.06] bg-white/[0.015]">
        <div className="flex gap-3">
          {/* Back */}
          {stepIdx > 0 && (
            <Button variant="ghost" onClick={() => setStepIdx(i => i - 1)}
              className="h-11 px-4 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 hover:border-slate-700 gap-2">
              {lang === "ar" ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {lang === "ar" ? "السابق" : "Back"}
            </Button>
          )}

          {/* Cancel if first step */}
          {stepIdx === 0 && (
            <Button variant="ghost" onClick={onClose}
              className="h-11 px-4 rounded-xl border border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50">
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
          )}

          {/* Next / Confirm */}
          <div className="flex-1">
            {stepIdx < STEPS.length - 1 ? (
              <Button
                onClick={() => setStepIdx(i => i + 1)}
                disabled={!canProceed()}
                className={`w-full h-11 rounded-xl font-black gap-2 text-sm transition-all ${
                  !canProceed() ? "opacity-50 cursor-not-allowed bg-slate-800 text-slate-500 border border-slate-700" : ""
                }`}
                style={canProceed() ? { backgroundColor: accentColor === "#94a3b8" ? "#334155" : accentColor, color: isInf ? "#0f0f0f" : "white" } : {}}
                data-testid="btn-wizard-next"
              >
                {lang === "ar" ? "التالي" : "Next"}
                {lang === "ar" ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </Button>
            ) : user ? (
              <Button
                onClick={() => onConfirm(brief)}
                disabled={isPending}
                className="w-full h-11 rounded-xl font-black gap-2 text-sm shadow-lg"
                style={{ backgroundColor: accentColor === "#94a3b8" ? "#1e293b" : accentColor, color: isInf ? "#0f0f0f" : "white" }}
                data-testid="button-confirm-plan"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                {lang === "ar" ? "أضف للسلة وأكمل الطلب" : "Add to Cart & Continue"}
              </Button>
            ) : (
              <Link href="/login" className="block">
                <Button className="w-full h-11 rounded-xl font-black gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-confirm-plan">
                  <ShoppingCart className="w-4 h-4" />
                  {lang === "ar" ? "سجّل دخولك للشراء" : "Login to Purchase"}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
