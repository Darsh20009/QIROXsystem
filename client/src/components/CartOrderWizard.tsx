// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  X, ChevronRight, ChevronLeft, Check, Loader2,
  Building2, Lightbulb, FileText, Target, Calendar,
  MapPin, LogIn, UserPlus, Phone, Mail, Instagram, Twitter,
  Upload, Globe, Users, Code2, Star, Sparkles, Camera,
  ShoppingBag, Smartphone, BotMessageSquare, Languages,
  TrendingUp, MessageSquare, Truck, BookOpen, Lock,
  Database, BarChart3, Palette, Server, ArrowLeft, Eye, EyeOff,
  Zap, Package, Send, Hash, Cpu, Home
} from "lucide-react";
import { QiroxIcon } from "@/components/qirox-brand";

/* ─── Features list for selection ─── */
const ALL_FEATURES = [
  { id: "products", icon: ShoppingBag,      labelAr: "إدارة المنتجات",       price: 0 },
  { id: "orders",   icon: Package,           labelAr: "إدارة الطلبات",        price: 0 },
  { id: "payments", icon: Sparkles,          labelAr: "بوابة الدفع الإلكتروني", price: 0 },
  { id: "mobile",   icon: Smartphone,        labelAr: "تطبيق جوال",           price: 800 },
  { id: "ai",       icon: BotMessageSquare,  labelAr: "ذكاء اصطناعي",         price: 600 },
  { id: "multilang",icon: Languages,         labelAr: "تعدد اللغات",          price: 300 },
  { id: "seo",      icon: TrendingUp,        labelAr: "تحسين محركات البحث SEO", price: 400 },
  { id: "loyalty",  icon: Star,              labelAr: "نقاط الولاء",          price: 300 },
  { id: "whatsapp", icon: Send,              labelAr: "تكامل واتساب",         price: 200 },
  { id: "chat",     icon: MessageSquare,     labelAr: "دردشة مباشرة",         price: 250 },
  { id: "crm",      icon: Users,             labelAr: "إدارة العملاء CRM",    price: 500 },
  { id: "accounting",icon: Database,         labelAr: "محاسبة وفواتير",       price: 450 },
  { id: "qr",       icon: Hash,              labelAr: "قائمة QR",             price: 120 },
  { id: "delivery", icon: Truck,             labelAr: "نظام التوصيل",         price: 350 },
  { id: "blog",     icon: BookOpen,          labelAr: "مدونة ومحتوى",         price: 200 },
  { id: "api",      icon: Code2,             labelAr: "API خارجي",            price: 600 },
  { id: "reports",  icon: BarChart3,         labelAr: "تقارير وإحصاءات",      price: 300 },
  { id: "security", icon: Lock,              labelAr: "حماية متقدمة",         price: 350 },
  { id: "hosting",  icon: Server,            labelAr: "استضافة سحابية",       price: 400 },
  { id: "branding", icon: Palette,           labelAr: "هوية بصرية كاملة",     price: 700 },
  { id: "notifs",   icon: Zap,              labelAr: "إشعارات فورية",         price: 150 },
  { id: "map",      icon: MapPin,            labelAr: "خرائط وتتبع",          price: 200 },
  { id: "cam",      icon: Camera,            labelAr: "معرض صور وفيديو",      price: 150 },
  { id: "cpu",      icon: Cpu,              labelAr: "خادم مخصص",             price: 500 },
  { id: "lang",     icon: Globe,             labelAr: "ترجمة آلية",           price: 250 },
];

const DAYS = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const TIMES = ["8:00 ص","9:00 ص","10:00 ص","11:00 ص","12:00 م","1:00 م","2:00 م","3:00 م","4:00 م","5:00 م","6:00 م","7:00 م","8:00 م","9:00 م"];

/* ─── Props ─── */
interface CartOrderWizardProps {
  open: boolean;
  onClose: () => void;
  cartItems: any[];
  total: number;
  user: any | null;
  hasPhysical: boolean;
}

/* ─── Wizard data structure ─── */
interface WizardData {
  // Step 1: Identity
  businessName: string;
  whatsapp: string;
  email: string;
  projectIdea: string;
  teamSize: string;
  instagram: string;
  twitter: string;
  snapchat: string;
  recipientName: string;
  recipientPhone: string;
  // Step 2: Features
  selectedFeatures: string[];
  extraAddons: string[];
  // Step 3: Assets
  commercialReg: string;
  logoChoice: "upload" | "design" | "none";
  logoFile: string;
  brandChoice: "upload" | "create" | "none";
  brandFile: string;
  expectedCustomers: string;
  extraFiles: string[];
  // Step 4: Strategic
  competitorUrl: string;
  hadPrevSite: boolean;
  prevSiteFeedback: string;
  technicalLevel: "high" | "low" | "";
  technicalDetails: string;
  hasDevTeam: boolean;
  devTeamDetails: string;
  // Step 5: Meeting
  preferredTimes: string[];
  preferredDays: string[];
  // Address (if physical)
  address: { name: string; phone: string; city: string; district: string; street: string };
}

const defaultData: WizardData = {
  businessName: "", whatsapp: "", email: "", projectIdea: "", teamSize: "",
  instagram: "", twitter: "", snapchat: "", recipientName: "", recipientPhone: "",
  selectedFeatures: [], extraAddons: [],
  commercialReg: "", logoChoice: "none", logoFile: "", brandChoice: "none", brandFile: "",
  expectedCustomers: "", extraFiles: [],
  competitorUrl: "", hadPrevSite: false, prevSiteFeedback: "",
  technicalLevel: "", technicalDetails: "", hasDevTeam: false, devTeamDetails: "",
  preferredTimes: [], preferredDays: [],
  address: { name: "", phone: "", city: "", district: "", street: "" },
};

/* ─── Field component ─── */
function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: any }) {
  return (
    <div>
      <label className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 mb-1.5">
        {required && <span className="text-red-400 text-xs">*</span>}
        {label}
      </label>
      {children}
      {hint && <p className="text-[10px] text-slate-600 mt-1">{hint}</p>}
    </div>
  );
}

function TInput({ value, onChange, placeholder, type = "text", testId }: any) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      data-testid={testId}
      className="w-full h-11 px-4 rounded-xl bg-white/[0.05] border border-slate-700/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500/60 transition-all" />
  );
}

function TArea({ value, onChange, placeholder, rows = 3 }: any) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-slate-700/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500/60 transition-all resize-none leading-relaxed" />
  );
}

function Chips({ options, value, onChange, max }: { options: string[]; value: string[]; onChange: (v: string[]) => void; max?: number }) {
  const toggle = (o: string) => {
    if (value.includes(o)) { onChange(value.filter(x => x !== o)); }
    else if (!max || value.length < max) { onChange([...value, o]); }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o} type="button" onClick={() => toggle(o)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${value.includes(o) ? "bg-blue-500/20 border-blue-500/50 text-blue-300" : "bg-white/[0.03] border-slate-700/60 text-slate-500 hover:border-slate-600 hover:text-slate-300"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

/* ─── Main component ─── */
export default function CartOrderWizard({ open, onClose, cartItems, total, user, hasPhysical }: CartOrderWizardProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Auth states
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authData, setAuthData] = useState({ username: "", password: "", fullName: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Wizard state
  const [step, setStep] = useState(user ? 1 : 0); // 0 = auth, 1-5 = wizard steps
  const [data, setData] = useState<WizardData>({ ...defaultData });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const brandRef = useRef<HTMLInputElement>(null);
  const extraRef = useRef<HTMLInputElement>(null);

  // Auto-fill user data
  useEffect(() => {
    if (user) {
      setData(prev => ({
        ...prev,
        whatsapp: prev.whatsapp || user.phone || user.whatsappNumber || "",
        email: prev.email || user.email || "",
        businessName: prev.businessName || user.businessName || user.fullName || "",
      }));
    }
  }, [user]);

  // Reset step when opened
  useEffect(() => {
    if (open) {
      setStep(user ? 1 : 0);
    }
  }, [open, user]);

  // Detect plan tier from cart
  const planItem = cartItems.find(i => i.type === "plan");
  const planTier: string = planItem?.config?.tier || "lite";
  const maxFeatures = planTier === "infinite" ? 20 : planTier === "pro" ? 10 : 5;

  // Steps definition (dynamically includes address if has physical)
  const TOTAL_STEPS = hasPhysical ? 6 : 5;

  const STEP_INFO = [
    null, // 0 = auth (not counted)
    { title: "هوية المنشأة",                 icon: Building2,   desc: "اسم نشاطك ومعلومات التواصل" },
    { title: "اختيار المميزات",              icon: Sparkles,    desc: `اختر ${maxFeatures} مميزة لمشروعك` },
    { title: "الملفات والبيانات القانونية",  icon: FileText,    desc: "الوثائق والهوية البصرية" },
    { title: "المعلومات التنافسية والتقنية", icon: Target,      desc: "فهم احتياجاتك بعمق" },
    { title: "جدولة الاجتماع",              icon: Calendar,    desc: "حدد مواعيدك المناسبة" },
    ...(hasPhysical ? [{ title: "عنوان التوصيل", icon: MapPin, desc: "بيانات شحن المنتجات" }] : []),
  ];

  function upd(key: keyof WizardData, val: any) {
    setData(prev => ({ ...prev, [key]: val }));
  }
  function updAddr(key: string, val: string) {
    setData(prev => ({ ...prev, address: { ...prev.address, [key]: val } }));
  }

  const canNext = () => {
    if (step === 1) return data.businessName.trim().length >= 2 && data.whatsapp.trim().length >= 9;
    if (step === 2) return data.selectedFeatures.length > 0;
    if (step === 5 || (hasPhysical && step === 6)) {
      if (hasPhysical && step === 6) return data.address.name.trim() && data.address.phone.trim() && data.address.city.trim();
      return data.preferredTimes.length >= 1 && data.preferredDays.length >= 1;
    }
    return true;
  };

  /* ─── File upload ─── */
  const uploadFile = async (file: File): Promise<string | null> => {
    const fd = new FormData(); fd.append("file", file);
    try {
      setUploading(true);
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const d = await res.json();
      return d.url || null;
    } catch { return null; }
    finally { setUploading(false); }
  };

  /* ─── Auth ─── */
  const handleAuth = async () => {
    if (!authData.username || !authData.password) {
      toast({ title: "أدخل اسم المستخدم وكلمة المرور", variant: "destructive" }); return;
    }
    if (authMode === "register" && authData.password !== authData.confirmPassword) {
      toast({ title: "كلمة المرور غير متطابقة", variant: "destructive" }); return;
    }
    setAuthLoading(true);
    try {
      if (authMode === "login") {
        const res = await apiRequest("POST", "/api/auth/login", { username: authData.username, password: authData.password });
        const d = await res.json();
        if (d.requires2FA) { toast({ title: "مطلوب التحقق الثنائي - سجّل الدخول من الصفحة الرئيسية", variant: "destructive" }); return; }
      } else {
        await apiRequest("POST", "/api/auth/register", { username: authData.username, password: authData.password, fullName: authData.fullName || authData.username, role: "client" });
        await apiRequest("POST", "/api/auth/login", { username: authData.username, password: authData.password });
      }

      // Sync guest cart to server
      const guestCart = (() => { try { const s = localStorage.getItem("qiroxGuestCart"); return s ? JSON.parse(s) : null; } catch { return null; } })();
      if (guestCart?.items?.length) {
        for (const item of guestCart.items) {
          try { await apiRequest("POST", "/api/cart/items", item); } catch {}
        }
        localStorage.removeItem("qiroxGuestCart");
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "✓ تم تسجيل الدخول بنجاح" });
      setStep(1);
    } catch (e: any) {
      toast({ title: e.message || "فشل تسجيل الدخول", variant: "destructive" });
    } finally { setAuthLoading(false); }
  };

  /* ─── Finish wizard ─── */
  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const wizardPayload = {
        ...data,
        cartItems,
        total,
        planTier,
        timestamp: Date.now(),
      };
      sessionStorage.setItem("qiroxWizardData", JSON.stringify(wizardPayload));
      navigate("/checkout");
      onClose();
    } catch { toast({ title: "حدث خطأ، حاول مرة أخرى", variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" dir="rtl">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg mx-4 bg-[#09090f] rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl"
        style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}
        onClick={e => e.stopPropagation()}>

        {/* ── Top bar ── */}
        <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-[#0d0c1a] to-[#0c0c18] border-b border-white/[0.06] shrink-0">
          <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <QiroxIcon className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">QIROX FACTORY</p>
            {step > 0 && (
              <p className="text-xs font-black text-white mt-0.5">{STEP_INFO[step]?.title}</p>
            )}
          </div>

          {/* Step indicators */}
          {step > 0 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div key={i} className={`rounded-full transition-all duration-300 ${i + 1 === step ? "w-5 h-2 bg-blue-500" : i + 1 < step ? "w-2 h-2 bg-blue-400/50" : "w-2 h-2 bg-slate-700"}`} />
              ))}
            </div>
          )}

          <button onClick={onClose} className="w-7 h-7 bg-white/5 border border-white/[0.08] rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5" style={{ overscrollBehavior: "contain" }}>
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>

              {/* ══ STEP 0: AUTH ══════════════════════════════════════════ */}
              {step === 0 && (
                <div className="space-y-5">
                  <div className="text-center mb-2">
                    <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-500/20">
                      {authMode === "login" ? <LogIn className="w-6 h-6 text-blue-400" /> : <UserPlus className="w-6 h-6 text-blue-400" />}
                    </div>
                    <h3 className="text-lg font-black text-white">{authMode === "login" ? "سجّل الدخول للمتابعة" : "أنشئ حسابك"}</h3>
                    <p className="text-slate-500 text-xs mt-1">منتجاتك محفوظة في السلة وستُكمل طلبك فوراً</p>
                  </div>

                  {authMode === "register" && (
                    <Field label="الاسم الكامل">
                      <TInput value={authData.fullName} onChange={(v: string) => setAuthData(p => ({ ...p, fullName: v }))} placeholder="اسمك الكامل" />
                    </Field>
                  )}
                  <Field label="اسم المستخدم" required>
                    <TInput value={authData.username} onChange={(v: string) => setAuthData(p => ({ ...p, username: v }))} placeholder="username" />
                  </Field>
                  <Field label="كلمة المرور" required>
                    <div className="relative">
                      <TInput value={authData.password} onChange={(v: string) => setAuthData(p => ({ ...p, password: v }))} placeholder="••••••••" type={showPass ? "text" : "password"} />
                      <button type="button" onClick={() => setShowPass(p => !p)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>
                  {authMode === "register" && (
                    <Field label="تأكيد كلمة المرور" required>
                      <TInput value={authData.confirmPassword} onChange={(v: string) => setAuthData(p => ({ ...p, confirmPassword: v }))} placeholder="••••••••" type="password" />
                    </Field>
                  )}

                  <Button onClick={handleAuth} disabled={authLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white h-12 rounded-xl font-black gap-2">
                    {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : authMode === "login" ? <><LogIn className="w-4 h-4" /> تسجيل الدخول</> : <><UserPlus className="w-4 h-4" /> إنشاء حساب</>}
                  </Button>

                  <div className="text-center">
                    <button type="button" onClick={() => setAuthMode(m => m === "login" ? "register" : "login")} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                      {authMode === "login" ? "ليس لديك حساب؟ أنشئ حساباً جديداً" : "لديك حساب؟ سجّل الدخول"}
                    </button>
                  </div>
                </div>
              )}

              {/* ══ STEP 1: IDENTITY ══════════════════════════════════════ */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-black text-white text-sm">هوية المنشأة</p>
                      <p className="text-slate-500 text-[10px]">الخطوة 1 من {TOTAL_STEPS}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="اسم النشاط / المشروع" required hint="مثال: مطعم الأصالة">
                      <TInput value={data.businessName} onChange={(v: string) => upd("businessName", v)} placeholder="اسم مشروعك..." testId="input-business-name" />
                    </Field>
                    <Field label="رقم الواتساب" required>
                      <TInput value={data.whatsapp} onChange={(v: string) => upd("whatsapp", v)} placeholder="05xxxxxxxx" testId="input-whatsapp" />
                    </Field>
                  </div>

                  <Field label="البريد الإلكتروني الرسمي">
                    <TInput value={data.email} onChange={(v: string) => upd("email", v)} placeholder="info@company.com" type="email" />
                  </Field>

                  <Field label="فكرة المشروع وهدفه" required hint="اشرح فكرة مشروعك وجمهورك المستهدف">
                    <TArea value={data.projectIdea} onChange={(v: string) => upd("projectIdea", v)} placeholder="اشرح لنا فكرة مشروعك، ماذا تريد أن تحقق، ومن هو جمهورك المستهدف..." />
                  </Field>

                  <Field label="حجم الفريق / الشركة">
                    <div className="grid grid-cols-2 gap-2">
                      {["فرد واحد","2–5 أشخاص","6–20 موظف","أكثر من 20"].map(opt => (
                        <button key={opt} type="button" onClick={() => upd("teamSize", opt)}
                          className={`h-9 rounded-lg border text-xs font-bold transition-all ${data.teamSize === opt ? "border-blue-500/60 bg-blue-500/15 text-blue-300" : "border-slate-800 bg-white/[0.02] text-slate-500 hover:border-slate-700 hover:text-slate-300"}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <div className="grid grid-cols-3 gap-2">
                    <Field label="انستغرام"><TInput value={data.instagram} onChange={(v: string) => upd("instagram", v)} placeholder="@username" /></Field>
                    <Field label="تويتر / X"><TInput value={data.twitter} onChange={(v: string) => upd("twitter", v)} placeholder="@username" /></Field>
                    <Field label="سناب شات"><TInput value={data.snapchat} onChange={(v: string) => upd("snapchat", v)} placeholder="@username" /></Field>
                  </div>

                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">شخص استلام التحديثات (اختياري)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <TInput value={data.recipientName} onChange={(v: string) => upd("recipientName", v)} placeholder="الاسم" />
                      <TInput value={data.recipientPhone} onChange={(v: string) => upd("recipientPhone", v)} placeholder="رقم الجوال" />
                    </div>
                  </div>
                </div>
              )}

              {/* ══ STEP 2: FEATURES ═══════════════════════════════════════ */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-amber-500/10 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-black text-white text-sm">اختيار المميزات</p>
                      <p className="text-slate-500 text-[10px]">الخطوة 2 من {TOTAL_STEPS} · اختر حتى {maxFeatures} مميزة</p>
                    </div>
                    <div className="mr-auto rtl:mr-0 rtl:ml-auto">
                      <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${data.selectedFeatures.length === maxFeatures ? "bg-green-500/20 text-green-400" : "bg-white/[0.05] text-slate-400"}`}>
                        {data.selectedFeatures.length} / {maxFeatures}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {ALL_FEATURES.map(f => {
                      const Icon = f.icon;
                      const selected = data.selectedFeatures.includes(f.id);
                      const disabled = !selected && data.selectedFeatures.length >= maxFeatures;
                      return (
                        <button key={f.id} type="button" disabled={disabled} onClick={() => {
                          if (selected) upd("selectedFeatures", data.selectedFeatures.filter(x => x !== f.id));
                          else if (!disabled) upd("selectedFeatures", [...data.selectedFeatures, f.id]);
                        }} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-right transition-all ${selected ? "border-blue-500/50 bg-blue-500/10" : disabled ? "border-slate-800/50 bg-white/[0.01] opacity-40 cursor-not-allowed" : "border-slate-800/60 bg-white/[0.02] hover:border-slate-700 hover:bg-white/[0.04]"}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selected ? "bg-blue-500/20" : "bg-white/[0.04]"}`}>
                            <Icon className={`w-4 h-4 ${selected ? "text-blue-400" : "text-slate-500"}`} />
                          </div>
                          <span className={`text-sm font-bold flex-1 text-right ${selected ? "text-white" : "text-slate-400"}`}>{f.labelAr}</span>
                          {f.price > 0 && <span className="text-[10px] text-slate-600 shrink-0">+{f.price} ر.س</span>}
                          {selected && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ══ STEP 3: ASSETS ═════════════════════════════════════════ */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-violet-500/10 rounded-xl flex items-center justify-center">
                      <FileText className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="font-black text-white text-sm">الملفات والبيانات القانونية</p>
                      <p className="text-slate-500 text-[10px]">الخطوة 3 من {TOTAL_STEPS}</p>
                    </div>
                  </div>

                  <Field label="رقم السجل التجاري / وثيقة العمل الحر">
                    <TInput value={data.commercialReg} onChange={(v: string) => upd("commercialReg", v)} placeholder="1234567890" />
                  </Field>

                  <Field label="الشعار (اللوغو)">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { v: "upload", l: "رفع شعاري" },
                        { v: "design", l: "تصميم بـ 15 ر.س" },
                        { v: "none",   l: "لاحقاً" },
                      ].map(opt => (
                        <button key={opt.v} type="button" onClick={() => upd("logoChoice", opt.v)}
                          className={`h-9 rounded-lg border text-xs font-bold transition-all ${data.logoChoice === opt.v ? "border-violet-500/60 bg-violet-500/15 text-violet-300" : "border-slate-800 bg-white/[0.02] text-slate-500 hover:border-slate-700 hover:text-slate-300"}`}>
                          {opt.l}
                        </button>
                      ))}
                    </div>
                    {data.logoChoice === "upload" && (
                      <div className="mt-2">
                        <input ref={logoRef} type="file" className="hidden" accept="image/*,.svg" onChange={async e => {
                          if (e.target.files?.[0]) { const u = await uploadFile(e.target.files[0]); if (u) upd("logoFile", u); }
                        }} />
                        {data.logoFile
                          ? <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2"><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-xs text-green-400">تم الرفع</span></div>
                          : <button type="button" onClick={() => logoRef.current?.click()} className="w-full h-10 border border-dashed border-slate-700 rounded-lg text-xs text-slate-500 hover:border-slate-600 hover:text-slate-400 transition-all flex items-center justify-center gap-2">
                              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Upload className="w-3.5 h-3.5" /> رفع الشعار</>}
                            </button>
                        }
                      </div>
                    )}
                  </Field>

                  <Field label="الهوية البصرية">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { v: "upload", l: "رفع الهوية" },
                        { v: "create", l: "إنشاء بـ 1800 ر.س" },
                        { v: "none",   l: "لاحقاً" },
                      ].map(opt => (
                        <button key={opt.v} type="button" onClick={() => upd("brandChoice", opt.v)}
                          className={`h-9 rounded-lg border text-xs font-bold transition-all ${data.brandChoice === opt.v ? "border-violet-500/60 bg-violet-500/15 text-violet-300" : "border-slate-800 bg-white/[0.02] text-slate-500 hover:border-slate-700 hover:text-slate-300"}`}>
                          {opt.l}
                        </button>
                      ))}
                    </div>
                    {data.brandChoice === "upload" && (
                      <div className="mt-2">
                        <input ref={brandRef} type="file" className="hidden" accept=".pdf,image/*,.zip" onChange={async e => {
                          if (e.target.files?.[0]) { const u = await uploadFile(e.target.files[0]); if (u) upd("brandFile", u); }
                        }} />
                        {data.brandFile
                          ? <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2"><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-xs text-green-400">تم الرفع</span></div>
                          : <button type="button" onClick={() => brandRef.current?.click()} className="w-full h-10 border border-dashed border-slate-700 rounded-lg text-xs text-slate-500 hover:border-slate-600 hover:text-slate-400 transition-all flex items-center justify-center gap-2">
                              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Upload className="w-3.5 h-3.5" /> رفع ملف الهوية</>}
                            </button>
                        }
                      </div>
                    )}
                  </Field>

                  <Field label="العملاء المتوقعون شهرياً">
                    <div className="grid grid-cols-2 gap-2">
                      {["أقل من 100","100 – 500","500 – 2000","أكثر من 2000"].map(opt => (
                        <button key={opt} type="button" onClick={() => upd("expectedCustomers", opt)}
                          className={`h-9 rounded-lg border text-xs font-bold transition-all ${data.expectedCustomers === opt ? "border-violet-500/60 bg-violet-500/15 text-violet-300" : "border-slate-800 bg-white/[0.02] text-slate-500 hover:border-slate-700 hover:text-slate-300"}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="ملفات إضافية (اختياري)" hint="يمكنك رفع ملفات عدة">
                    <div>
                      <input ref={extraRef} type="file" className="hidden" multiple onChange={async e => {
                        if (e.target.files) {
                          for (const file of Array.from(e.target.files)) {
                            const u = await uploadFile(file);
                            if (u) upd("extraFiles", [...data.extraFiles, u]);
                          }
                        }
                      }} />
                      <button type="button" onClick={() => extraRef.current?.click()} className="w-full h-10 border border-dashed border-slate-700 rounded-lg text-xs text-slate-500 hover:border-slate-600 hover:text-slate-400 transition-all flex items-center justify-center gap-2">
                        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Upload className="w-3.5 h-3.5" /> {data.extraFiles.length > 0 ? `${data.extraFiles.length} ملف مرفوع — رفع المزيد` : "رفع ملفات إضافية"}</>}
                      </button>
                    </div>
                  </Field>
                </div>
              )}

              {/* ══ STEP 4: STRATEGIC ══════════════════════════════════════ */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-green-500/10 rounded-xl flex items-center justify-center">
                      <Target className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="font-black text-white text-sm">المعلومات التنافسية والتقنية</p>
                      <p className="text-slate-500 text-[10px]">الخطوة 4 من {TOTAL_STEPS}</p>
                    </div>
                  </div>

                  <Field label="رابط موقع منافس" hint="يساعدنا في فهم السوق المستهدف">
                    <TInput value={data.competitorUrl} onChange={(v: string) => upd("competitorUrl", v)} placeholder="https://competitor.com" type="url" />
                  </Field>

                  <Field label="هل لديك موقع سابق؟">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {[{ v: true, l: "نعم" }, { v: false, l: "لا" }].map(opt => (
                        <button key={String(opt.v)} type="button" onClick={() => upd("hadPrevSite", opt.v)}
                          className={`h-9 rounded-lg border text-xs font-bold transition-all ${data.hadPrevSite === opt.v ? "border-green-500/60 bg-green-500/15 text-green-300" : "border-slate-800 bg-white/[0.02] text-slate-500 hover:border-slate-700 hover:text-slate-300"}`}>
                          {opt.l}
                        </button>
                      ))}
                    </div>
                    <TArea value={data.prevSiteFeedback} onChange={(v: string) => upd("prevSiteFeedback", v)} rows={2}
                      placeholder={data.hadPrevSite ? "ما هي عيوب الموقع السابق؟" : "ما هي توقعاتك من الموقع الجديد؟"} />
                  </Field>

                  <Field label="مستوى المعرفة التقنية">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {[{ v: "high", l: "لدي خلفية تقنية" }, { v: "low", l: "أعمال فقط" }].map(opt => (
                        <button key={opt.v} type="button" onClick={() => upd("technicalLevel", opt.v)}
                          className={`h-10 rounded-lg border text-xs font-bold transition-all ${data.technicalLevel === opt.v ? "border-green-500/60 bg-green-500/15 text-green-300" : "border-slate-800 bg-white/[0.02] text-slate-500 hover:border-slate-700 hover:text-slate-300"}`}>
                          {opt.l}
                        </button>
                      ))}
                    </div>
                    {data.technicalLevel === "high" && (
                      <TArea value={data.technicalDetails} onChange={(v: string) => upd("technicalDetails", v)} rows={2} placeholder="اذكر التقنيات التي تعرفها أو تفضلها..." />
                    )}
                  </Field>

                  <Field label="هل لديك مبرمجون خاصون؟">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {[{ v: true, l: "نعم" }, { v: false, l: "لا" }].map(opt => (
                        <button key={String(opt.v)} type="button" onClick={() => upd("hasDevTeam", opt.v)}
                          className={`h-9 rounded-lg border text-xs font-bold transition-all ${data.hasDevTeam === opt.v ? "border-green-500/60 bg-green-500/15 text-green-300" : "border-slate-800 bg-white/[0.02] text-slate-500 hover:border-slate-700 hover:text-slate-300"}`}>
                          {opt.l}
                        </button>
                      ))}
                    </div>
                    {data.hasDevTeam && (
                      <TArea value={data.devTeamDetails} onChange={(v: string) => upd("devTeamDetails", v)} rows={2} placeholder="أسماء المطورين وتخصصاتهم..." />
                    )}
                  </Field>
                </div>
              )}

              {/* ══ STEP 5: MEETING ════════════════════════════════════════ */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-black text-white text-sm">جدولة الاجتماع الأول</p>
                      <p className="text-slate-500 text-[10px]">الخطوة 5 من {TOTAL_STEPS} · اختر 3 أوقات و3 أيام مناسبة</p>
                    </div>
                  </div>

                  <Field label={`الأوقات المفضلة (${data.preferredTimes.length}/3)`} required>
                    <Chips options={TIMES} value={data.preferredTimes} onChange={v => upd("preferredTimes", v)} max={3} />
                  </Field>

                  <Field label={`الأيام المناسبة (${data.preferredDays.length}/3)`} required>
                    <Chips options={DAYS} value={data.preferredDays} onChange={v => upd("preferredDays", v)} max={3} />
                  </Field>

                  {data.preferredTimes.length > 0 && data.preferredDays.length > 0 && (
                    <div className="bg-cyan-500/[0.07] border border-cyan-500/20 rounded-xl p-4">
                      <p className="text-xs font-black text-cyan-400 mb-2">📅 مواعيدك المفضلة</p>
                      <p className="text-slate-300 text-xs">الأيام: {data.preferredDays.join(" · ")}</p>
                      <p className="text-slate-300 text-xs mt-1">الأوقات: {data.preferredTimes.join(" · ")}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ══ STEP 6: ADDRESS (only if hasPhysical) ═════════════════ */}
              {step === 6 && hasPhysical && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-orange-500/10 rounded-xl flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <p className="font-black text-white text-sm">عنوان التوصيل</p>
                      <p className="text-slate-500 text-[10px]">الخطوة 6 من {TOTAL_STEPS}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="اسم المستلم" required>
                      <TInput value={data.address.name} onChange={(v: string) => updAddr("name", v)} placeholder="الاسم الكامل" />
                    </Field>
                    <Field label="رقم الجوال" required>
                      <TInput value={data.address.phone} onChange={(v: string) => updAddr("phone", v)} placeholder="05xxxxxxxx" />
                    </Field>
                  </div>
                  <Field label="المدينة" required>
                    <div className="grid grid-cols-3 gap-2">
                      {["الرياض","جدة","مكة المكرمة","المدينة","الدمام","أخرى"].map(c => (
                        <button key={c} type="button" onClick={() => updAddr("city", c)}
                          className={`h-9 rounded-lg border text-xs font-bold transition-all ${data.address.city === c ? "border-orange-500/60 bg-orange-500/15 text-orange-300" : "border-slate-800 bg-white/[0.02] text-slate-500 hover:border-slate-700 hover:text-slate-300"}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                    {data.address.city === "أخرى" && (
                      <div className="mt-2"><TInput value={data.address.district} onChange={(v: string) => updAddr("city", v)} placeholder="اكتب اسم المدينة" /></div>
                    )}
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="الحي">
                      <TInput value={data.address.district} onChange={(v: string) => updAddr("district", v)} placeholder="اسم الحي" />
                    </Field>
                    <Field label="الشارع">
                      <TInput value={data.address.street} onChange={(v: string) => updAddr("street", v)} placeholder="اسم الشارع" />
                    </Field>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Bottom nav ── */}
        {step > 0 && (
          <div className="flex items-center gap-3 px-5 py-4 border-t border-white/[0.06] bg-[#09090f] shrink-0">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors font-bold h-11 px-4 rounded-xl hover:bg-white/[0.04]">
                <ChevronRight className="w-4 h-4" /> السابق
              </button>
            )}

            <div className="flex-1" />

            {step < TOTAL_STEPS ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                className="bg-blue-600 hover:bg-blue-500 text-white h-11 px-6 rounded-xl font-black gap-2">
                التالي <ChevronLeft className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={!canNext() || submitting}
                className="bg-gradient-to-l from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white h-11 px-6 rounded-xl font-black gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> الانتقال للدفع</>}
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
