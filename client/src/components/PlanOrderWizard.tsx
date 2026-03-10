import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import SARIcon from "@/components/SARIcon";
import {
  ArrowLeft, ArrowRight, X, Check, Loader2, ShoppingCart, Building2,
  Lightbulb, Globe, Smartphone, LayoutDashboard, ShoppingBag, CreditCard,
  Bell, BarChart3, Users, Calendar, Package, Truck, MessageSquare,
  Star, Languages, Palette, Server, Award, Send, CircleCheck,
  CheckCircle2, ChevronRight, Cpu, Link2, BotMessageSquare, Instagram,
  Twitter, Camera, FileImage, Clock, Target, Hash, Phone, Mail,
  Layers, Zap, TrendingUp, BookOpen, Lock, Database, Code2
} from "lucide-react";
import { QiroxIcon } from "@/components/qirox-brand";
import { Link } from "wouter";

/* ─── Types ─────────────────────────────────────────── */
export interface ProjectBrief {
  businessName: string;
  phone: string;
  projectIdea: string;
  teamSize: string;
  launchTarget: string;
  extraModules: string[];
  hasLogo: boolean;
  hasDomain: boolean;
  domainName: string;
  hasHosting: boolean;
  hasContent: boolean;
  siteLanguage: "arabic" | "english" | "both";
  instagram: string;
  snapchat: string;
  twitter: string;
  expectedProducts: string;
  dailyOrders: string;
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

/* ─── Extra add-on modules ──────────────────────────── */
const EXTRA_MODULES = [
  { id: "mobile_app",    icon: Smartphone,     labelAr: "تطبيق جوال",             labelEn: "Mobile App" },
  { id: "ai",            icon: BotMessageSquare, labelAr: "ذكاء اصطناعي",          labelEn: "AI Features" },
  { id: "multi_lang",    icon: Languages,      labelAr: "تعدد اللغات",            labelEn: "Multi-language" },
  { id: "seo",           icon: TrendingUp,     labelAr: "SEO وتحسين البحث",        labelEn: "SEO Boost" },
  { id: "loyalty",       icon: Star,           labelAr: "نقاط الولاء",            labelEn: "Loyalty Points" },
  { id: "whatsapp",      icon: Send,           labelAr: "تكامل واتساب",           labelEn: "WhatsApp" },
  { id: "chat",          icon: MessageSquare,  labelAr: "دردشة مدمجة",            labelEn: "Live Chat" },
  { id: "crm",           icon: Users,          labelAr: "إدارة العلاقات (CRM)",   labelEn: "CRM System" },
  { id: "accounting",    icon: Database,       labelAr: "محاسبة وفواتير",         labelEn: "Accounting" },
  { id: "qr_menu",       icon: Hash,           labelAr: "قائمة QR",              labelEn: "QR Menu" },
  { id: "delivery",      icon: Truck,          labelAr: "نظام التوصيل",           labelEn: "Delivery System" },
  { id: "blog",          icon: BookOpen,       labelAr: "مدونة / محتوى",         labelEn: "Blog / CMS" },
  { id: "api",           icon: Code2,          labelAr: "API تكامل خارجي",        labelEn: "External API" },
  { id: "advanced_reports", icon: BarChart3,   labelAr: "تقارير متقدمة",          labelEn: "Advanced Reports" },
  { id: "security",      icon: Lock,           labelAr: "حماية متقدمة",           labelEn: "Advanced Security" },
  { id: "brand_identity",icon: Palette,        labelAr: "هوية بصرية",            labelEn: "Brand Identity" },
];

const STEPS = ["project", "features", "infra", "review"] as const;
type Step = typeof STEPS[number];

const STEP_META: Record<Step, { titleAr: string; titleEn: string; descAr: string; descEn: string; icon: any }> = {
  project:  { titleAr: "بيانات المشروع",         titleEn: "Project Details",      descAr: "أخبرنا عن نشاطك وفريقك",         descEn: "Tell us about your business",     icon: Lightbulb },
  features: { titleAr: "مميزات الباقة والإضافات", titleEn: "Features & Add-ons",   descAr: "ما هو مشمول + ما تريد إضافته",   descEn: "What's included + what you want", icon: Layers },
  infra:    { titleAr: "البنية التحتية",          titleEn: "Infrastructure",       descAr: "أصولك الرقمية وتوقعاتك",         descEn: "Your digital assets & scale",     icon: Server },
  review:   { titleAr: "مراجعة وتأكيد",          titleEn: "Review & Confirm",     descAr: "تحقق من كل شيء قبل الإرسال",    descEn: "Verify before submitting",        icon: CheckCircle2 },
};

/* ─── Step dots progress ────────────────────────────── */
function StepDots({ current, lang }: { current: number; lang: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
      {STEPS.map((s, i) => (
        <div key={s} className={`transition-all duration-300 rounded-full ${i === current ? "w-6 h-2 bg-blue-500" : i < current ? "w-2 h-2 bg-blue-400/50" : "w-2 h-2 bg-slate-700"}`} />
      ))}
    </div>
  );
}

/* ─── Toggle ─────────────────────────────────────────── */
function Toggle({ value, onChange, lang }: { value: boolean; onChange: (v: boolean) => void; lang: string }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`relative inline-flex h-7 items-center rounded-full transition-colors shrink-0 focus:outline-none border`}
      style={{ width: 52, backgroundColor: value ? "#2563eb" : "#1e293b", borderColor: value ? "#3b82f6" : "#334155" }}>
      <span className={`inline-block w-5 h-5 transform rounded-full bg-white shadow transition-transform duration-200 ${value ? (lang === "ar" ? "-translate-x-7" : "translate-x-6") : (lang === "ar" ? "-translate-x-1" : "translate-x-1")}`} />
    </button>
  );
}

/* ─── Input field ────────────────────────────────────── */
function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2">
        {required && <span className="text-red-400">*</span>}
        {label}
      </label>
      {children}
      {hint && <p className="text-[10px] text-slate-600 mt-1.5">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, testId }: { value: string; onChange: (v: string) => void; placeholder?: string; testId?: string }) {
  return (
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      data-testid={testId}
      className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-slate-700/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.06] transition-all" />
  );
}

/* ─── Main Wizard ────────────────────────────────────── */
export default function PlanOrderWizard({
  plan, price, periodLabel, tierLabel, segLabel, tierCfg,
  lang, user, isPending, onClose, onConfirm,
}: WizardProps) {
  const isInf = plan.tier === "infinite";
  const isPro = plan.tier === "pro";
  const accentHex = isInf ? "#f59e0b" : isPro ? "#60a5fa" : "#94a3b8";

  const [stepIdx, setStepIdx] = useState(0);
  const currentStep = STEPS[stepIdx];
  const stepMeta = STEP_META[currentStep];

  const [brief, setBrief] = useState<ProjectBrief>({
    businessName: "",
    phone: "",
    projectIdea: "",
    teamSize: "",
    launchTarget: "",
    extraModules: [],
    hasLogo: false,
    hasDomain: false,
    domainName: "",
    hasHosting: false,
    hasContent: false,
    siteLanguage: "arabic",
    instagram: "",
    snapchat: "",
    twitter: "",
    expectedProducts: "",
    dailyOrders: "",
    competitors: "",
    notes: "",
  });

  function upd<K extends keyof ProjectBrief>(key: K, val: ProjectBrief[K]) {
    setBrief(prev => ({ ...prev, [key]: val }));
  }
  function toggleExtra(id: string) {
    setBrief(prev => ({
      ...prev,
      extraModules: prev.extraModules.includes(id)
        ? prev.extraModules.filter(m => m !== id)
        : [...prev.extraModules, id],
    }));
  }

  const canProceed = currentStep !== "project" || brief.businessName.trim().length >= 2;
  const planFeatures: string[] = lang === "ar" ? (plan.featuresAr ?? []) : ((plan.featuresEn || plan.featuresAr) ?? []);
  const planName = lang === "ar" ? (plan.nameAr || tierLabel) : (plan.nameEn || plan.nameAr || tierLabel);

  /* ─── Gradients ─── */
  const headerGrad = isInf ? "from-[#0d0c15] to-[#100f1a]" : isPro ? "from-[#0c1a3a] to-[#0e2048]" : "from-[#0f1117] to-[#111318]";

  return (
    <div className="flex flex-col bg-[#08080f] rounded-2xl overflow-hidden" style={{ maxHeight: "90vh" }}>

      {/* ── Top bar ── */}
      <div className={`relative flex items-center justify-between px-5 py-3.5 bg-gradient-to-r ${headerGrad} border-b border-white/[0.06] shrink-0`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white/8 flex items-center justify-center">
            <QiroxIcon className="w-3.5 h-3.5 opacity-70" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hidden sm:block">QIROX FACTORY</span>
        </div>
        <StepDots current={stepIdx} lang={lang} />
        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center hover:bg-white/10 transition-colors">
          <X className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* ── Plan mini-bar ── */}
      <div className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.02] border-b border-white/[0.05] shrink-0 overflow-x-auto">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isInf ? "bg-amber-400/10" : isPro ? "bg-blue-500/10" : "bg-slate-700/40"}`}>
          <tierCfg.icon className="w-3.5 h-3.5" style={{ color: accentHex }} />
        </div>
        <span className="text-xs font-black text-white shrink-0">{planName}</span>
        <span className="text-[9px] px-2 py-0.5 rounded-md font-black border shrink-0" style={{ color: accentHex, borderColor: accentHex + "35", background: accentHex + "12" }}>{tierLabel}</span>
        {segLabel && <span className="text-[10px] text-slate-600 shrink-0">{segLabel}</span>}
        <div className="mr-auto rtl:mr-0 rtl:ml-auto flex items-baseline gap-1 shrink-0">
          <span className="text-sm font-black text-white">{price.toLocaleString()}</span>
          <span className="text-slate-600 text-[10px]">SAR / {periodLabel}</span>
        </div>
      </div>

      {/* ── Step header ── */}
      <div className="px-5 pt-4 pb-3 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center">
            <stepMeta.icon className="w-3 h-3 text-slate-500" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">
            {lang === "ar" ? `الخطوة ${stepIdx + 1} من ${STEPS.length}` : `Step ${stepIdx + 1} of ${STEPS.length}`}
          </span>
        </div>
        <h2 className="text-base font-black text-white">{lang === "ar" ? stepMeta.titleAr : stepMeta.titleEn}</h2>
        <p className="text-xs text-slate-500">{lang === "ar" ? stepMeta.descAr : stepMeta.descEn}</p>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-5 pb-3" style={{ overscrollBehavior: "contain" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: lang === "ar" ? -18 : 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: lang === "ar" ? 18 : -18 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >

            {/* ══ STEP 1: PROJECT ══════════════════════════════════ */}
            {currentStep === "project" && (
              <div className="space-y-4">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={lang === "ar" ? "اسم النشاط / المشروع" : "Business / Project Name"} required
                    hint={lang === "ar" ? "مثال: مطعم الأصالة، متجر النور" : "e.g. Al-Asala Restaurant"}>
                    <TextInput value={brief.businessName} onChange={v => upd("businessName", v)}
                      placeholder={lang === "ar" ? "اسم مشروعك..." : "Your project name..."}
                      testId="input-business-name" />
                    {brief.businessName.length > 0 && brief.businessName.length < 2 && (
                      <p className="text-[10px] text-red-400 mt-1">{lang === "ar" ? "يجب أن يكون الاسم أطول من حرف" : "Too short"}</p>
                    )}
                  </Field>

                  <Field label={lang === "ar" ? "رقم الجوال للتواصل" : "Contact Phone"}>
                    <TextInput value={brief.phone} onChange={v => upd("phone", v)}
                      placeholder={lang === "ar" ? "05xxxxxxxx" : "+966 5x xxx xxxx"}
                      testId="input-phone" />
                  </Field>
                </div>

                <Field label={lang === "ar" ? "فكرة المشروع وهدفه" : "Project Idea & Goal"}>
                  <textarea value={brief.projectIdea} onChange={e => upd("projectIdea", e.target.value)} rows={3}
                    placeholder={lang === "ar"
                      ? "اشرح لنا فكرة مشروعك، ماذا تريد أن تحقق، ومن هو جمهورك المستهدف..."
                      : "Describe your project idea, goals, and target audience..."}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-slate-700/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500/60 transition-all resize-none leading-relaxed"
                    data-testid="input-project-idea" />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={lang === "ar" ? "حجم الفريق / الشركة" : "Team / Company Size"}>
                    <div className="grid grid-cols-2 gap-2">
                      {(lang === "ar"
                        ? [{ v: "1", l: "فرد واحد" }, { v: "2-5", l: "2–5 أشخاص" }, { v: "6-20", l: "6–20 موظف" }, { v: "20+", l: "أكثر من 20" }]
                        : [{ v: "1", l: "Solo" }, { v: "2-5", l: "2–5 people" }, { v: "6-20", l: "6–20 staff" }, { v: "20+", l: "20+ staff" }]
                      ).map(opt => (
                        <button key={opt.v} type="button" onClick={() => upd("teamSize", opt.v)}
                          className={`h-9 rounded-lg border text-xs font-bold transition-all ${brief.teamSize === opt.v ? "border-blue-500/60 bg-blue-500/15 text-blue-300" : "border-slate-800 bg-white/[0.025] text-slate-500 hover:border-slate-700 hover:text-slate-300"}`}>
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label={lang === "ar" ? "موعد الإطلاق المستهدف" : "Target Launch Date"}>
                    <div className="grid grid-cols-2 gap-2">
                      {(lang === "ar"
                        ? [{ v: "asap", l: "فوري" }, { v: "1month", l: "شهر" }, { v: "3months", l: "3 أشهر" }, { v: "flexible", l: "مرن" }]
                        : [{ v: "asap", l: "ASAP" }, { v: "1month", l: "1 month" }, { v: "3months", l: "3 months" }, { v: "flexible", l: "Flexible" }]
                      ).map(opt => (
                        <button key={opt.v} type="button" onClick={() => upd("launchTarget", opt.v)}
                          className={`h-9 rounded-lg border text-xs font-bold transition-all ${brief.launchTarget === opt.v ? "border-blue-500/60 bg-blue-500/15 text-blue-300" : "border-slate-800 bg-white/[0.025] text-slate-500 hover:border-slate-700 hover:text-slate-300"}`}>
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/[0.05] border border-blue-500/12">
                  <Lightbulb className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {lang === "ar"
                      ? "كلما أعطيتنا تفاصيل أكثر، كان نظامك أكثر دقة وتخصيصاً — يمكنك تركها فارغة والتواصل معنا لاحقاً."
                      : "More details = more tailored system. You can leave fields empty and contact us later."}
                  </p>
                </div>
              </div>
            )}

            {/* ══ STEP 2: FEATURES + ADD-ONS ═══════════════════════ */}
            {currentStep === "features" && (
              <div className="space-y-5">

                {/* ─ Section 1: Plan features (included) ─ */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-slate-800" />
                    <span className="text-[9px] font-black uppercase tracking-[0.18em] px-2" style={{ color: accentHex }}>
                      {lang === "ar" ? "مشمولة في الباقة" : "INCLUDED IN PLAN"}
                    </span>
                    <div className="h-px flex-1 bg-slate-800" />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {planFeatures.length > 0 ? planFeatures.map((f, i) => (
                      <div key={i} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border ${isInf ? "bg-amber-400/[0.04] border-amber-400/15" : isPro ? "bg-blue-500/[0.06] border-blue-500/20" : "bg-white/[0.03] border-slate-800/80"}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isInf ? "bg-amber-400/20" : isPro ? "bg-blue-400/20" : "bg-slate-600/40"}`}>
                          <Check className="w-3 h-3" style={{ color: accentHex }} />
                        </div>
                        <span className="text-xs text-slate-300 flex-1 leading-snug">{f}</span>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-md shrink-0" style={{ color: accentHex + "cc", background: accentHex + "12" }}>
                          {lang === "ar" ? "مشمول" : "included"}
                        </span>
                      </div>
                    )) : (
                      <p className="text-xs text-slate-600 text-center py-4">{lang === "ar" ? "لا توجد مميزات محددة لهذه الباقة" : "No specific features for this plan"}</p>
                    )}
                  </div>
                </div>

                {/* ─ Section 2: Extra add-ons ─ */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-slate-800" />
                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 px-2">
                      {lang === "ar" ? "إضافات إضافية تودّ طلبها" : "OPTIONAL ADD-ONS"}
                    </span>
                    <div className="h-px flex-1 bg-slate-800" />
                  </div>
                  <p className="text-xs text-slate-600 mb-3">{lang === "ar" ? "اختر الوحدات الإضافية التي تريدها فوق ما تشمله الباقة:" : "Select extra modules beyond what's included:"}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {EXTRA_MODULES.map(mod => {
                      const selected = brief.extraModules.includes(mod.id);
                      const ModIcon = mod.icon;
                      return (
                        <motion.button key={mod.id} type="button" onClick={() => toggleExtra(mod.id)}
                          whileTap={{ scale: 0.96 }}
                          data-testid={`module-${mod.id}`}
                          className={`relative flex items-center gap-2.5 p-3 rounded-xl border text-start transition-all duration-150 ${
                            selected
                              ? isInf ? "bg-amber-400/10 border-amber-400/40" : isPro ? "bg-blue-500/15 border-blue-500/40" : "bg-slate-700/50 border-slate-500/50"
                              : "bg-white/[0.02] border-slate-800/80 hover:border-slate-700/80 hover:bg-white/[0.04]"
                          }`}>
                          <ModIcon className="w-4 h-4 shrink-0" style={selected ? { color: accentHex } : { color: "#475569" }} />
                          <span className={`text-xs font-bold leading-snug ${selected ? "text-white" : "text-slate-500"}`}>
                            {lang === "ar" ? mod.labelAr : mod.labelEn}
                          </span>
                          {selected && (
                            <div className="mr-auto rtl:mr-0 rtl:ml-auto w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                              style={{ background: accentHex + "25" }}>
                              <Check className="w-2.5 h-2.5" style={{ color: accentHex }} />
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                  {brief.extraModules.length > 0 && (
                    <p className="text-center text-[10px] font-bold mt-3" style={{ color: accentHex }}>
                      {lang === "ar" ? `${brief.extraModules.length} إضافة محددة` : `${brief.extraModules.length} add-on(s) selected`}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ══ STEP 3: INFRASTRUCTURE + DETAILS ═════════════════ */}
            {currentStep === "infra" && (
              <div className="space-y-4">

                {/* Toggles row */}
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { key: "hasLogo" as const,    icon: Palette,   labelAr: "هل لديك شعار / هوية بصرية؟",     labelEn: "Do you have a logo / brand identity?" },
                    { key: "hasDomain" as const,  icon: Globe,     labelAr: "هل لديك دومين؟",                  labelEn: "Do you have a domain?" },
                    { key: "hasHosting" as const, icon: Server,    labelAr: "هل لديك استضافة / سيرفر؟",       labelEn: "Do you have hosting / server?" },
                    { key: "hasContent" as const, icon: FileImage, labelAr: "هل لديك محتوى جاهز؟ (صور/نصوص)", labelEn: "Do you have ready content? (images/text)" },
                  ].map(row => (
                    <div key={row.key}>
                      <div className={`flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-slate-800/80 transition-all ${brief[row.key] ? "border-slate-700/60" : ""}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center">
                            <row.icon className="w-4 h-4 text-slate-400" />
                          </div>
                          <span className="text-sm font-semibold text-slate-300">{lang === "ar" ? row.labelAr : row.labelEn}</span>
                        </div>
                        <Toggle value={brief[row.key] as boolean} onChange={v => upd(row.key, v)} lang={lang} />
                      </div>
                      {row.key === "hasDomain" && brief.hasDomain && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="mt-1.5">
                          <TextInput value={brief.domainName} onChange={v => upd("domainName", v)}
                            placeholder="mystore.com" testId="input-domain" />
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Language */}
                <Field label={lang === "ar" ? "لغة الموقع / النظام" : "Site / System Language"}>
                  <div className="grid grid-cols-3 gap-2">
                    {([{ v: "arabic", ar: "عربي", en: "Arabic" }, { v: "english", ar: "إنجليزي", en: "English" }, { v: "both", ar: "ثنائي", en: "Bilingual" }] as const).map(opt => (
                      <button key={opt.v} type="button" onClick={() => upd("siteLanguage", opt.v)}
                        className={`h-10 rounded-xl border text-xs font-bold transition-all ${brief.siteLanguage === opt.v ? "border-blue-500/60 bg-blue-500/15 text-blue-300" : "border-slate-800 bg-white/[0.025] text-slate-500 hover:border-slate-700 hover:text-slate-300"}`}>
                        {lang === "ar" ? opt.ar : opt.en}
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Social media */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 block mb-2">
                    {lang === "ar" ? "حسابات السوشيال ميديا (اختياري)" : "Social Media (optional)"}
                  </label>
                  <div className="space-y-2">
                    {[
                      { key: "instagram" as const, Icon: Instagram, ph: lang === "ar" ? "حساب إنستقرام" : "Instagram handle", color: "text-pink-400" },
                      { key: "snapchat"  as const, Icon: Camera,    ph: lang === "ar" ? "حساب سناب شات" : "Snapchat handle",  color: "text-yellow-400" },
                      { key: "twitter"   as const, Icon: Twitter,   ph: lang === "ar" ? "حساب تويتر/X" : "Twitter/X handle",  color: "text-sky-400" },
                    ].map(({ key, Icon, ph, color }) => (
                      <div key={key} className="relative">
                        <Icon className={`absolute top-3 ${lang === "ar" ? "right-3.5" : "left-3.5"} w-4 h-4 ${color} pointer-events-none`} />
                        <input type="text" value={brief[key]} onChange={e => upd(key, e.target.value)} placeholder={ph}
                          className={`w-full h-11 ${lang === "ar" ? "pr-10 pl-4" : "pl-10 pr-4"} rounded-xl bg-white/[0.04] border border-slate-700/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500/60 transition-all`} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scale expectations */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label={lang === "ar" ? "عدد المنتجات / الخدمات" : "Expected Products/Services"}>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(lang === "ar"
                        ? [{ v: "lt50", l: "أقل من 50" }, { v: "50-200", l: "50–200" }, { v: "200-500", l: "200–500" }, { v: "500+", l: "أكثر من 500" }]
                        : [{ v: "lt50", l: "<50" }, { v: "50-200", l: "50–200" }, { v: "200-500", l: "200–500" }, { v: "500+", l: "500+" }]
                      ).map(opt => (
                        <button key={opt.v} type="button" onClick={() => upd("expectedProducts", opt.v)}
                          className={`h-9 rounded-lg border text-[11px] font-bold transition-all ${brief.expectedProducts === opt.v ? "border-blue-500/60 bg-blue-500/15 text-blue-300" : "border-slate-800 bg-white/[0.025] text-slate-500 hover:border-slate-700"}`}>
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label={lang === "ar" ? "الطلبات اليومية المتوقعة" : "Expected Daily Orders"}>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(lang === "ar"
                        ? [{ v: "lt20", l: "أقل من 20" }, { v: "20-100", l: "20–100" }, { v: "100-500", l: "100–500" }, { v: "500+", l: "أكثر من 500" }]
                        : [{ v: "lt20", l: "<20" }, { v: "20-100", l: "20–100" }, { v: "100-500", l: "100–500" }, { v: "500+", l: "500+" }]
                      ).map(opt => (
                        <button key={opt.v} type="button" onClick={() => upd("dailyOrders", opt.v)}
                          className={`h-9 rounded-lg border text-[11px] font-bold transition-all ${brief.dailyOrders === opt.v ? "border-blue-500/60 bg-blue-500/15 text-blue-300" : "border-slate-800 bg-white/[0.025] text-slate-500 hover:border-slate-700"}`}>
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>

                {/* Competitors */}
                <Field label={lang === "ar" ? "منافسون / مواقع مرجعية" : "Competitors / Reference Sites"}
                  hint={lang === "ar" ? "مواقع مشابهة أو منافسة تريد أن نستلهم منها" : "Similar or competing sites for inspiration"}>
                  <TextInput value={brief.competitors} onChange={v => upd("competitors", v)}
                    placeholder={lang === "ar" ? "noon.com، مطعم الباشا، ..." : "noon.com, example.com, ..."} />
                </Field>

                {/* Notes */}
                <Field label={lang === "ar" ? "ملاحظات إضافية" : "Additional Notes"}>
                  <textarea value={brief.notes} onChange={e => upd("notes", e.target.value)} rows={3}
                    placeholder={lang === "ar" ? "أي تفاصيل أخرى..." : "Anything else you'd like to mention..."}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-slate-700/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500/60 transition-all resize-none leading-relaxed"
                    data-testid="input-notes" />
                </Field>
              </div>
            )}

            {/* ══ STEP 4: REVIEW ═══════════════════════════════════ */}
            {currentStep === "review" && (
              <div className="space-y-3">

                {/* Plan summary */}
                <div className={`p-4 rounded-xl border ${isInf ? "border-amber-400/20 bg-amber-400/5" : isPro ? "border-blue-500/25 bg-blue-500/8" : "border-slate-700/60 bg-white/[0.03]"}`}>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2.5">{lang === "ar" ? "الباقة" : "PLAN"}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <tierCfg.icon className="w-4 h-4" style={{ color: accentHex }} />
                      <span className="font-black text-white text-sm">{planName}</span>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-md border" style={{ color: accentHex, borderColor: accentHex + "30", background: accentHex + "12" }}>{tierLabel}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-black text-white">{price.toLocaleString()}</span>
                      <span className="text-xs text-slate-500">SAR / {periodLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Project info */}
                <div className="p-4 rounded-xl bg-white/[0.025] border border-slate-800/60 space-y-2.5">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{lang === "ar" ? "المشروع" : "PROJECT"}</p>
                  {[
                    { icon: Building2, val: brief.businessName, label: lang === "ar" ? "اسم النشاط" : "Business" },
                    { icon: Phone, val: brief.phone, label: lang === "ar" ? "الجوال" : "Phone" },
                    { icon: Users, val: brief.teamSize, label: lang === "ar" ? "حجم الفريق" : "Team" },
                    { icon: Clock, val: brief.launchTarget ? (lang === "ar" ? {asap:"فوري",["1month"]:"شهر",["3months"]:"3 أشهر",flexible:"مرن"}[brief.launchTarget] || brief.launchTarget : brief.launchTarget) : "", label: lang === "ar" ? "الإطلاق" : "Launch" },
                  ].filter(r => r.val).map(row => (
                    <div key={row.label} className="flex items-center gap-2.5">
                      <row.icon className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span className="text-[10px] text-slate-500">{row.label}:</span>
                      <span className="text-xs font-bold text-slate-300">{row.val}</span>
                    </div>
                  ))}
                  {brief.projectIdea && (
                    <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-800 italic">"{brief.projectIdea}"</p>
                  )}
                </div>

                {/* Included features count */}
                {planFeatures.length > 0 && (
                  <div className="p-3.5 rounded-xl border border-slate-800/60 bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">{lang === "ar" ? "مميزات مشمولة" : "INCLUDED FEATURES"}</p>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md" style={{ color: accentHex, background: accentHex + "15" }}>{planFeatures.length}</span>
                    </div>
                  </div>
                )}

                {/* Extra modules */}
                {brief.extraModules.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-slate-800/60">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2.5">{lang === "ar" ? `إضافات إضافية — ${brief.extraModules.length}` : `ADD-ONS — ${brief.extraModules.length}`}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {brief.extraModules.map(id => {
                        const mod = EXTRA_MODULES.find(m => m.id === id);
                        if (!mod) return null;
                        const MI = mod.icon;
                        return (
                          <span key={id} className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-slate-700/60 text-slate-300">
                            <MI className="w-3 h-3 text-slate-500" />{lang === "ar" ? mod.labelAr : mod.labelEn}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Infrastructure */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-slate-800/60">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2.5">{lang === "ar" ? "البنية التحتية" : "INFRASTRUCTURE"}</p>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    {[
                      { icon: Palette,   label: lang === "ar" ? "شعار" : "Logo",     val: brief.hasLogo },
                      { icon: Globe,     label: lang === "ar" ? "دومين" : "Domain",   val: brief.hasDomain, sub: brief.domainName },
                      { icon: Server,    label: lang === "ar" ? "استضافة" : "Hosting", val: brief.hasHosting },
                      { icon: FileImage, label: lang === "ar" ? "محتوى" : "Content",  val: brief.hasContent },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <item.icon className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        <span className="text-[10px] text-slate-500">{item.label}:</span>
                        {item.val ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <X className="w-3.5 h-3.5 text-slate-700" />}
                        {item.val && item.sub && <span className="text-[10px] text-slate-400">{item.sub}</span>}
                      </div>
                    ))}
                    <div className="flex items-center gap-2 col-span-2">
                      <Languages className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span className="text-[10px] text-slate-500">{lang === "ar" ? "اللغة" : "Language"}:</span>
                      <span className="text-[10px] font-bold text-slate-300">
                        {brief.siteLanguage === "arabic" ? (lang === "ar" ? "عربي" : "Arabic") : brief.siteLanguage === "english" ? "English" : (lang === "ar" ? "ثنائي" : "Bilingual")}
                      </span>
                    </div>
                  </div>
                  {/* Social */}
                  {(brief.instagram || brief.snapchat || brief.twitter) && (
                    <div className="mt-2 pt-2 border-t border-slate-800 flex flex-wrap gap-2">
                      {brief.instagram && <span className="text-[10px] text-pink-400 flex items-center gap-1"><Instagram className="w-3 h-3" />{brief.instagram}</span>}
                      {brief.snapchat  && <span className="text-[10px] text-yellow-400 flex items-center gap-1"><Camera className="w-3 h-3" />{brief.snapchat}</span>}
                      {brief.twitter   && <span className="text-[10px] text-sky-400 flex items-center gap-1"><Twitter className="w-3 h-3" />{brief.twitter}</span>}
                    </div>
                  )}
                  {/* Scale */}
                  {(brief.expectedProducts || brief.dailyOrders) && (
                    <div className="mt-2 pt-2 border-t border-slate-800 flex gap-4">
                      {brief.expectedProducts && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Package className="w-3 h-3" />{brief.expectedProducts} {lang === "ar" ? "منتج" : "products"}</span>}
                      {brief.dailyOrders && <span className="text-[10px] text-slate-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" />{brief.dailyOrders} {lang === "ar" ? "طلب/يوم" : "orders/day"}</span>}
                    </div>
                  )}
                </div>

                {(brief.competitors || brief.notes) && (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-slate-800/60 space-y-2">
                    {brief.competitors && <p className="text-xs text-slate-400"><span className="text-slate-600">{lang === "ar" ? "مرجع: " : "Ref: "}</span>{brief.competitors}</p>}
                    {brief.notes && <p className="text-xs text-slate-400 italic">"{brief.notes}"</p>}
                  </div>
                )}

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/15">
                  <CircleCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {lang === "ar"
                      ? "ستُرسل هذه البيانات مع طلبك وسيتواصل معك فريقنا خلال 24 ساعة."
                      : "This data will be sent with your order. Our team will contact you within 24 hours."}
                  </p>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Footer ── */}
      <div className="shrink-0 px-5 py-4 border-t border-white/[0.06] bg-white/[0.01]">
        <div className="flex gap-2.5">
          {stepIdx > 0 ? (
            <Button variant="ghost" onClick={() => setStepIdx(i => i - 1)}
              className="h-11 px-4 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 gap-1.5 shrink-0">
              {lang === "ar" ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {lang === "ar" ? "السابق" : "Back"}
            </Button>
          ) : (
            <Button variant="ghost" onClick={onClose}
              className="h-11 px-4 rounded-xl border border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 shrink-0">
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </Button>
          )}

          <div className="flex-1">
            {stepIdx < STEPS.length - 1 ? (
              <Button onClick={() => setStepIdx(i => i + 1)} disabled={!canProceed}
                className={`w-full h-11 rounded-xl font-black gap-2 text-sm transition-all ${!canProceed ? "opacity-40 cursor-not-allowed bg-slate-800 text-slate-500 border border-slate-700" : ""}`}
                style={canProceed ? { backgroundColor: accentHex === "#94a3b8" ? "#334155" : accentHex, color: isInf ? "#0f0f0f" : "white" } : {}}
                data-testid="btn-wizard-next">
                {lang === "ar" ? "التالي" : "Next"}
                {lang === "ar" ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </Button>
            ) : user ? (
              <Button onClick={() => onConfirm(brief)} disabled={isPending}
                className="w-full h-11 rounded-xl font-black gap-2 text-sm shadow-lg"
                style={{ backgroundColor: accentHex === "#94a3b8" ? "#1e293b" : accentHex, color: isInf ? "#0f0f0f" : "white" }}
                data-testid="button-confirm-plan">
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
