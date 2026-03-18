// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  ChevronRight, ChevronLeft, Check, Loader2,
  Building2, FileText, Target, Calendar,
  MapPin, LogIn, UserPlus,
  Upload, Globe, Users, Code2, Star, Sparkles, Camera,
  ShoppingBag, Smartphone, BotMessageSquare, Languages,
  TrendingUp, MessageSquare, Truck, BookOpen, Lock,
  Database, BarChart3, Palette, Server, ArrowLeft, Eye, EyeOff,
  Zap, Package, Send, Hash, Cpu, ShoppingCart,
  Plus, Cloud, Image as ImageIcon, Headphones, Wifi, CreditCard, Settings
} from "lucide-react";
import { QiroxIcon } from "@/components/qirox-brand";
import type { Cart, CartItem } from "@shared/schema";

/* ── Lucide icon name → component map (for addons from DB) ── */
const ICON_MAP: Record<string, any> = {
  Smartphone, Database, Server, Cloud, Globe, Lock, Star, Sparkles,
  ShoppingBag, Package, Send, Users, TrendingUp, MessageSquare, Truck,
  BookOpen, Code2, BarChart3, Palette, Hash, Cpu, Camera, Zap, MapPin,
  Upload, Languages, BotMessageSquare, Plus, Image: ImageIcon,
  Headphones, Wifi, CreditCard, Settings, Building2, FileText,
};

function AddonIcon({ iconName, imageUrl, selected }: { iconName?: string; imageUrl?: string; selected: boolean }) {
  if (imageUrl) {
    return (
      <div className={`w-10 h-10 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${selected ? "border-blue-500/60" : "border-white/[0.07]"}`}>
        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }
  const Icon = (iconName && ICON_MAP[iconName]) || Package;
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${selected ? "bg-blue-500/20" : "bg-white/[0.04]"}`}>
      <Icon className={`w-5 h-5 ${selected ? "text-blue-400" : "text-slate-500"}`} />
    </div>
  );
}

const DAYS  = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const TIMES = ["8:00 ص","9:00 ص","10:00 ص","11:00 ص","12:00 م","1:00 م","2:00 م","3:00 م","4:00 م","5:00 م","6:00 م","7:00 م","8:00 م","9:00 م"];
const PHYSICAL_TYPES = ["product","gift","device"];

interface WizardData {
  businessName: string; whatsapp: string; email: string;
  projectIdea: string; teamSize: string;
  instagram: string; twitter: string; snapchat: string;
  recipientName: string; recipientPhone: string;
  selectedFeatures: string[]; extraAddons: string[];
  commercialReg: string;
  logoChoice: "upload" | "design" | "none";
  logoFile: string;
  brandChoice: "upload" | "create" | "none";
  brandFile: string;
  expectedCustomers: string; extraFiles: string[];
  competitorUrl: string; hadPrevSite: boolean; prevSiteFeedback: string;
  technicalLevel: "high" | "low" | ""; technicalDetails: string;
  hasDevTeam: boolean; devTeamDetails: string;
  technicalFeatures: string[]; projectTechIdeas: string;
  preferredTimes: string[]; preferredDays: string[];
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
  technicalFeatures: [], projectTechIdeas: "",
  preferredTimes: [], preferredDays: [],
  address: { name: "", phone: "", city: "", district: "", street: "" },
};

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: any }) {
  return (
    <div>
      <label className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 mb-1.5">
        {required && <span className="text-red-400 text-xs">*</span>}
        {label}
      </label>
      {children}
      {hint && <p className="text-[10px] text-slate-500 mt-1">{hint}</p>}
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

function TArea({ value, onChange, placeholder, rows = 3, required }: any) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
      className={`w-full px-4 py-3 rounded-xl bg-white/[0.05] border ${!value && required ? "border-red-500/30" : "border-slate-700/60"} text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500/60 transition-all resize-none leading-relaxed`} />
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

function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState("");
  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  };
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addTag(); }
    if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder || "اكتب ثم اضغط Enter أو +"}
          className="flex-1 h-10 px-4 rounded-xl bg-white/[0.05] border border-slate-700/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-green-500/60 transition-all"
        />
        <button
          type="button"
          onClick={addTag}
          disabled={!input.trim()}
          className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center font-black text-lg"
        >
          +
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/25 text-green-300 text-xs font-bold">
              {tag}
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-green-500/60 hover:text-red-400 transition-colors font-black leading-none">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CartWizardPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: cart, isLoading: isCartLoading } = useQuery<Cart>({
    queryKey: ["/api/cart"], enabled: !!user,
  });
  const { data: extraAddons = [] } = useQuery<any[]>({
    queryKey: ["/api/extra-addons"],
  });

  const cartItems: CartItem[] = cart?.items || [];
  const total = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const hasPhysical = cartItems.some(i => PHYSICAL_TYPES.includes(i.type));

  // Auth states (for when user is not logged in)
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authData, setAuthData] = useState({ username: "", password: "", fullName: "", confirmPassword: "", email: "" });
  const [showPass, setShowPass] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Wizard state
  const [step, setStep] = useState(!user ? 0 : 1);
  const [data, setData] = useState<WizardData>({ ...defaultData });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const brandRef = useRef<HTMLInputElement>(null);
  const extraRef = useRef<HTMLInputElement>(null);

  // Scroll to top on step change
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);

  // Auto-fill user data
  useEffect(() => {
    if (user) {
      setData(prev => ({
        ...prev,
        whatsapp: prev.whatsapp || (user as any).phone || (user as any).whatsappNumber || "",
        email: prev.email || (user as any).email || "",
        businessName: prev.businessName || (user as any).businessName || (user as any).fullName || "",
      }));
      if (step === 0) setStep(1);
    }
  }, [user]);

  const planItem = cartItems.find(i => i.type === "plan");
  const planTier: string = planItem?.config?.tier || "lite";
  const maxFeatures = planTier === "infinite" ? 20 : planTier === "pro" ? 10 : 5;

  const TOTAL_STEPS = hasPhysical ? 6 : 5;

  const STEP_INFO = [
    null,
    { title: "هوية المنشأة",                 icon: Building2,  desc: "اسم نشاطك ومعلومات التواصل",       color: "blue" },
    { title: "اختيار المميزات",              icon: Sparkles,   desc: `اختر حتى ${maxFeatures} مميزة`,     color: "amber" },
    { title: "الملفات والبيانات",            icon: FileText,   desc: "الوثائق والهوية البصرية",            color: "violet" },
    { title: "المعلومات التنافسية",          icon: Target,     desc: "فهم احتياجاتك بعمق",                color: "green" },
    { title: "جدولة الاجتماع",              icon: Calendar,   desc: "حدد مواعيدك المناسبة",              color: "cyan" },
    ...(hasPhysical ? [{ title: "عنوان التوصيل", icon: MapPin, desc: "بيانات شحن المنتجات", color: "orange" }] : []),
  ];

  const STEP_COLORS: Record<string, string> = {
    blue:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
    amber:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    green:  "bg-green-500/10 text-green-400 border-green-500/20",
    cyan:   "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };

  function upd(key: keyof WizardData, val: any) {
    setData(prev => ({ ...prev, [key]: val }));
  }
  function updAddr(key: string, val: string) {
    setData(prev => ({ ...prev, address: { ...prev.address, [key]: val } }));
  }

  const canNext = () => {
    if (step === 1) return data.businessName.trim().length >= 2 && data.whatsapp.trim().length >= 9 && data.projectIdea.trim().length >= 10;
    if (step === 2) return data.selectedFeatures.length > 0;
    if (step === 5 || (hasPhysical && step === 6)) {
      if (hasPhysical && step === 6) return data.address.name.trim() && data.address.phone.trim() && data.address.city.trim();
      return data.preferredTimes.length >= 1 && data.preferredDays.length >= 1;
    }
    return true;
  };

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

  const handleAuth = async () => {
    if (!authData.username || !authData.password) {
      toast({ title: "أدخل اسم المستخدم وكلمة المرور", variant: "destructive" }); return;
    }
    setAuthLoading(true);
    try {
      if (authMode === "login") {
        const res = await fetch("/api/login", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: authData.username, password: authData.password }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "اسم المستخدم أو كلمة المرور غير صحيحة");
        if (d.requires2FA) { toast({ title: "مطلوب التحقق الثنائي — سجّل الدخول من الصفحة الرئيسية", variant: "destructive" }); setAuthLoading(false); return; }
      } else {
        if (!authData.email) { toast({ title: "البريد الإلكتروني مطلوب", variant: "destructive" }); setAuthLoading(false); return; }
        if (authData.password !== authData.confirmPassword) { toast({ title: "كلمة المرور غير متطابقة", variant: "destructive" }); setAuthLoading(false); return; }
        const regRes = await fetch("/api/register", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: authData.username, password: authData.password, fullName: authData.fullName || authData.username, role: "client", email: authData.email }),
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.error || "فشل إنشاء الحساب");
        await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: authData.username, password: authData.password }) });
      }
      const guestCart = (() => { try { const s = localStorage.getItem("qiroxGuestCart"); return s ? JSON.parse(s) : null; } catch { return null; } })();
      if (guestCart?.items?.length) {
        for (const item of guestCart.items) {
          const { _id, id, ...clean } = item as any;
          try { await apiRequest("POST", "/api/cart/items", clean); } catch {}
        }
        localStorage.removeItem("qiroxGuestCart");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: "✓ تم تسجيل الدخول بنجاح" });
      setStep(1);
    } catch (e: any) {
      toast({ title: e.message || "فشل تسجيل الدخول", variant: "destructive" });
    } finally { setAuthLoading(false); }
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      sessionStorage.setItem("qiroxWizardData", JSON.stringify({ ...data, cartItems, total, planTier, timestamp: Date.now() }));
      navigate("/checkout");
    } catch { toast({ title: "حدث خطأ، حاول مرة أخرى", variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  if (isUserLoading || isCartLoading) {
    return (
      <div className="min-h-screen bg-[#09090f] flex items-center justify-center" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const currentStepInfo = step > 0 ? STEP_INFO[step] : null;
  const colorClass = currentStepInfo ? STEP_COLORS[currentStepInfo.color] || STEP_COLORS.blue : STEP_COLORS.blue;

  return (
    <div className="min-h-screen bg-[#09090f]" dir="rtl">
      <Navigation />

      {/* Top accent gradient */}
      <div className="h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-violet-600" />

      <div className="max-w-2xl mx-auto px-4 pt-10 pb-24">

        {/* Page header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full mb-4">
            <QiroxIcon className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">QIROX FACTORY</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-2">إتمام طلبك</h1>
          <p className="text-slate-500 text-sm">أكمل البيانات التالية وسنبدأ مشروعك فور تأكيد الطلب</p>
        </div>

        {/* Step progress bar */}
        {step > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-500">الخطوة {step} من {TOTAL_STEPS}</span>
              <span className="text-xs font-black text-white">{STEP_INFO[step]?.title}</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="flex items-center gap-1.5 mt-3">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div key={i} className={`rounded-full transition-all duration-300 ${i + 1 === step ? "flex-1 h-2 bg-blue-500" : i + 1 < step ? "w-5 h-2 bg-blue-400/50" : "w-5 h-2 bg-slate-700"}`} />
              ))}
            </div>
          </div>
        )}

        {/* Cart summary bar */}
        {step > 0 && cartItems.length > 0 && (
          <div className="mb-6 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3 flex items-center gap-3">
            <ShoppingCart className="w-4 h-4 text-slate-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500">{cartItems.length} عنصر في السلة</p>
              <p className="text-sm font-black text-white">{total.toLocaleString()} ر.س</p>
            </div>
            <button onClick={() => navigate("/cart")} className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> رجوع للسلة
            </button>
          </div>
        )}

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#0e0e1a] border border-white/[0.07] rounded-3xl overflow-hidden shadow-2xl">

            {/* Step top bar */}
            {step > 0 && currentStepInfo && (
              <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.05] bg-white/[0.02]">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${colorClass}`}>
                  {(() => { const Icon = currentStepInfo.icon; return <Icon className="w-5 h-5" />; })()}
                </div>
                <div>
                  <p className="font-black text-white">{currentStepInfo.title}</p>
                  <p className="text-slate-500 text-[11px]">{currentStepInfo.desc}</p>
                </div>
              </div>
            )}

            <div className="px-6 py-6 space-y-5">

              {/* ══ STEP 0: AUTH ══════════════════════════════════════════════ */}
              {step === 0 && (
                <div className="space-y-5">
                  <div className="text-center mb-4">
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
                  {authMode === "register" && (
                    <Field label="البريد الإلكتروني" required>
                      <TInput value={authData.email} onChange={(v: string) => setAuthData(p => ({ ...p, email: v }))} placeholder="example@email.com" type="email" />
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

              {/* ══ STEP 1: IDENTITY ══════════════════════════════════════════ */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="اسم النشاط / المشروع" required hint="مثال: مطعم الأصالة">
                      <TInput value={data.businessName} onChange={(v: string) => upd("businessName", v)} placeholder="اسم مشروعك..." testId="input-business-name" />
                    </Field>
                    <Field label="رقم الواتساب" required>
                      <TInput value={data.whatsapp} onChange={(v: string) => upd("whatsapp", v)} placeholder="05xxxxxxxx" testId="input-whatsapp" />
                    </Field>
                  </div>
                  <Field label="البريد الإلكتروني الرسمي" required>
                    <TInput value={data.email} onChange={(v: string) => upd("email", v)} placeholder="info@company.com" type="email" />
                  </Field>
                  <Field label="فكرة المشروع وهدفه" required hint="اشرح لنا فكرة مشروعك وجمهورك المستهدف">
                    <TArea value={data.projectIdea} onChange={(v: string) => upd("projectIdea", v)} rows={4} required
                      placeholder="اشرح لنا فكرة مشروعك، ماذا تريد أن تحقق، ومن هو جمهورك المستهدف..." />
                  </Field>
                  <Field label="حجم الفريق / الشركة" required>
                    <div className="grid grid-cols-2 gap-2">
                      {["فرد واحد","2–5 أشخاص","6–20 موظف","أكثر من 20"].map(opt => (
                        <button key={opt} type="button" onClick={() => upd("teamSize", opt)}
                          className={`h-10 rounded-xl border text-xs font-bold transition-all ${data.teamSize === opt ? "border-blue-500/60 bg-blue-500/15 text-blue-300" : "border-slate-800 bg-white/[0.02] text-slate-500 hover:border-slate-700 hover:text-slate-300"}`}>
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

              {/* ══ STEP 2: FEATURES ══════════════════════════════════════════ */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-slate-500">اختر المميزات الإضافية التي تحتاجها لمشروعك</p>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${data.selectedFeatures.length >= maxFeatures ? "bg-green-500/20 text-green-400" : "bg-white/[0.05] text-slate-400"}`}>
                      {data.selectedFeatures.length} / {maxFeatures}
                    </span>
                  </div>

                  {extraAddons.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Package className="w-10 h-10 text-slate-700 mb-3" />
                      <p className="text-slate-500 text-sm">لا توجد إضافات متاحة حالياً</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {extraAddons.map((addon: any) => {
                        const addonId = addon._id || addon.id;
                        const selected = data.selectedFeatures.includes(addonId);
                        const disabled = !selected && data.selectedFeatures.length >= maxFeatures;
                        return (
                          <button
                            key={addonId}
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              if (selected) upd("selectedFeatures", data.selectedFeatures.filter((x: string) => x !== addonId));
                              else if (!disabled) upd("selectedFeatures", [...data.selectedFeatures, addonId]);
                            }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-right transition-all ${
                              selected
                                ? "border-blue-500/50 bg-blue-500/10"
                                : disabled
                                ? "border-slate-800/50 bg-white/[0.01] opacity-40 cursor-not-allowed"
                                : "border-slate-800/60 bg-white/[0.02] hover:border-slate-700 hover:bg-white/[0.04]"
                            }`}
                          >
                            <AddonIcon
                              iconName={addon.icon}
                              imageUrl={addon.imageUrl}
                              selected={selected}
                            />
                            <div className="flex-1 text-right min-w-0">
                              <p className={`text-sm font-bold ${selected ? "text-white" : "text-slate-300"}`}>
                                {addon.nameAr || addon.name}
                              </p>
                              {addon.descriptionAr && (
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">{addon.descriptionAr}</p>
                              )}
                            </div>
                            {addon.price > 0 && (
                              <div className="text-right shrink-0">
                                <span className={`text-xs font-black ${selected ? "text-blue-300" : "text-slate-500"}`}>
                                  {addon.price.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-slate-600 mr-0.5"> ر.س</span>
                              </div>
                            )}
                            {selected && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ══ STEP 3: ASSETS ════════════════════════════════════════════ */}
              {step === 3 && (
                <div className="space-y-4">
                  <Field label="رقم السجل التجاري / وثيقة العمل الحر">
                    <TInput value={data.commercialReg} onChange={(v: string) => upd("commercialReg", v)} placeholder="1234567890" />
                  </Field>
                  <Field label="الشعار (اللوغو)" required>
                    <div className="grid grid-cols-3 gap-2">
                      {[{ v: "upload", l: "رفع شعاري" }, { v: "design", l: "تصميم بـ 15 ر.س" }, { v: "none", l: "لاحقاً" }].map(opt => (
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
                            </button>}
                      </div>
                    )}
                  </Field>
                  <Field label="الهوية البصرية" required>
                    <div className="grid grid-cols-3 gap-2">
                      {[{ v: "upload", l: "رفع الهوية" }, { v: "create", l: "إنشاء بـ 1800 ر.س" }, { v: "none", l: "لاحقاً" }].map(opt => (
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
                            </button>}
                      </div>
                    )}
                  </Field>
                  <Field label="العملاء المتوقعون شهرياً" required>
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

              {/* ══ STEP 4: STRATEGIC ═════════════════════════════════════════ */}
              {step === 4 && (
                <div className="space-y-4">
                  <Field label="رابط موقع منافس" hint="يساعدنا في فهم السوق المستهدف">
                    <TInput value={data.competitorUrl} onChange={(v: string) => upd("competitorUrl", v)} placeholder="https://competitor.com" type="url" />
                  </Field>
                  <Field label="هل لديك موقع سابق؟" required>
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
                  <Field label="مستوى المعرفة التقنية" required>
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
                  <Field label="هل لديك مبرمجون خاصون؟" required>
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

                  {/* ── المميزات التقنية ── */}
                  <div className="pt-2 border-t border-white/[0.05]">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                        <Cpu className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-black text-white text-sm">المتطلبات التقنية للمشروع</p>
                        <p className="text-slate-500 text-[11px]">أضف التقنيات والأفكار التي تريدها</p>
                      </div>
                    </div>

                    <Field label="المميزات التقنية المطلوبة" hint="اكتب كل ميزة ثم اضغط + أو Enter لإضافتها">
                      <TagInput
                        value={data.technicalFeatures}
                        onChange={v => upd("technicalFeatures", v)}
                        placeholder="مثال: دفع إلكتروني، نظام نقاط، تحليلات..."
                      />
                    </Field>
                  </div>

                  <Field label="الأفكار التقنية والرؤية الخاصة بك" hint="شارك أفكارك ورؤيتك للمشروع بحرية">
                    <TArea
                      value={data.projectTechIdeas}
                      onChange={(v: string) => upd("projectTechIdeas", v)}
                      rows={4}
                      placeholder="اكتب أفكارك التقنية بتفصيل... مثال: أريد نظاماً يعمل تلقائياً لإشعار العملاء عند تغيير حالة الطلب، مع تكامل مع واتساب..."
                    />
                  </Field>
                </div>
              )}

              {/* ══ STEP 5: MEETING ═══════════════════════════════════════════ */}
              {step === 5 && (
                <div className="space-y-4">
                  <Field label={`الأوقات المفضلة (${data.preferredTimes.length}/3)`} required hint="اختر حتى 3 أوقات مناسبة">
                    <Chips options={TIMES} value={data.preferredTimes} onChange={v => upd("preferredTimes", v)} max={3} />
                  </Field>
                  <Field label={`الأيام المناسبة (${data.preferredDays.length}/3)`} required hint="اختر حتى 3 أيام">
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

              {/* ══ STEP 6: ADDRESS ═══════════════════════════════════════════ */}
              {step === 6 && hasPhysical && (
                <div className="space-y-4">
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

            </div>

            {/* ── Bottom navigation ── */}
            {step > 0 && (
              <div className="flex items-center gap-3 px-6 py-5 border-t border-white/[0.06] bg-white/[0.01]">
                {step > 1 && (
                  <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors font-bold h-11 px-4 rounded-xl hover:bg-white/[0.04]">
                    <ChevronRight className="w-4 h-4" /> السابق
                  </button>
                )}
                <div className="flex-1" />
                {step < TOTAL_STEPS ? (
                  <Button onClick={() => { if (canNext()) setStep(s => s + 1); }} disabled={!canNext()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white h-11 px-7 rounded-xl font-black gap-2 shadow-lg shadow-blue-600/20">
                    التالي <ChevronLeft className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button onClick={handleFinish} disabled={!canNext() || submitting}
                    className="bg-gradient-to-l from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 disabled:opacity-40 text-white h-11 px-7 rounded-xl font-black gap-2 shadow-lg shadow-cyan-600/20">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> الانتقال للدفع</>}
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Required fields note */}
        {step > 0 && (
          <p className="text-center text-xs text-slate-600 mt-4">
            <span className="text-red-400">*</span> الحقول المطلوبة
          </p>
        )}
      </div>

      <Footer />
    </div>
  );
}
