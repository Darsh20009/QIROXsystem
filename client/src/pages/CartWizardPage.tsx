import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Check, Loader2, Building2, FileText, CreditCard,
  LogIn, UserPlus, Upload, Globe, Sparkles,
  Image as ImageIcon, Eye, EyeOff, ArrowLeft,
  Lightbulb, Wand2, ShoppingCart, Phone, Mail, X
} from "lucide-react";
import { QiroxIcon } from "@/components/qirox-brand";
import type { Cart, CartItem } from "@shared/schema";

const SECTORS = [
  { value: "restaurant", label: "🍽️ مطعم وكافيه" },
  { value: "ecommerce",  label: "🛒 متجر إلكتروني" },
  { value: "education",  label: "📚 تعليم وتدريب" },
  { value: "healthcare", label: "🏥 صحة وعيادات" },
  { value: "realestate", label: "🏠 عقارات" },
  { value: "beauty",     label: "💅 تجميل وعناية" },
  { value: "fitness",    label: "💪 رياضة ولياقة" },
  { value: "technology", label: "💻 تقنية وبرمجة" },
  { value: "corporate",  label: "🏢 شركات وخدمات" },
  { value: "fashion",    label: "👗 أزياء وموضة" },
];

interface WizardData {
  businessName: string;
  whatsapp: string;
  email: string;
  projectIdea: string;
  sector: string;
  logoFile: string;
  extraFiles: string[];
  planTier?: string;
  grandTotal?: number;
  planPrice?: number;
  cartItems?: CartItem[];
}

const defaultData: WizardData = {
  businessName: "", whatsapp: "", email: "",
  projectIdea: "", sector: "",
  logoFile: "", extraFiles: [],
};

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: any }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-xs font-bold text-gray-600 dark:text-slate-400">
        {required && <span className="text-red-400">*</span>}
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}

function TInput({ value, onChange, placeholder, type = "text", testId, dir }: any) {
  return (
    <input
      type={type} value={value} dir={dir}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      data-testid={testId}
      className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-slate-700/60 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500 transition-all"
    />
  );
}

const STEP_CONFIG = [
  { id: 1, title: "فكرتك", desc: "اسم مشروعك وفكرته الأساسية", icon: Lightbulb, color: "blue" },
  { id: 2, title: "ملفاتك", desc: "الشعار والوثائق (اختياري)", icon: FileText, color: "violet" },
  { id: 3, title: "الدفع",  desc: "اختر طريقة الدفع وأكمل طلبك", icon: CreditCard, color: "green" },
];

export default function CartWizardPage() {
  const { dir } = useI18n();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: cart, isLoading: isCartLoading } = useQuery<Cart>({
    queryKey: ["/api/cart"], enabled: !!user,
  });

  const cartItems: CartItem[] = (cart as any)?.items || [];
  const total = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const planItem = cartItems.find((i: any) => i.type === "plan");
  const planTier: string = (planItem as any)?.config?.tier || "lite";

  // Auth state
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authData, setAuthData] = useState({ identifier: "", password: "", fullName: "", email: "", phone: "" });
  const [showPass, setShowPass] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Wizard state
  const [step, setStep] = useState(!user ? 0 : 1);
  const [data, setData] = useState<WizardData>({ ...defaultData });
  const [uploading, setUploading] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const logoRef = useRef<HTMLInputElement>(null);
  const extraRef = useRef<HTMLInputElement>(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);

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

  function upd(key: keyof WizardData, val: any) {
    setData(prev => ({ ...prev, [key]: val }));
  }

  const canNext = () => {
    if (step === 1) {
      return (
        data.businessName.trim().length >= 2 &&
        data.whatsapp.trim().length >= 9 &&
        data.projectIdea.trim().length >= 10 &&
        data.sector.trim().length > 0
      );
    }
    return true;
  };

  const uploadFile = async (file: File, setLoad: (v: boolean) => void): Promise<string | null> => {
    const fd = new FormData(); fd.append("file", file);
    try {
      setLoad(true);
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const d = await res.json();
      return d.url || null;
    } catch { return null; }
    finally { setLoad(false); }
  };

  const handleAIIdea = async () => {
    if (!data.businessName.trim() && !data.sector) {
      toast({ title: "أدخل اسم المشروع والقطاع أولاً", variant: "destructive" });
      return;
    }
    setAiLoading(true);
    try {
      const prompt = `اكتب وصفاً احترافياً ومقنعاً لمشروع "${data.businessName || "مشروع جديد"}" في قطاع "${SECTORS.find(s => s.value === data.sector)?.label || data.sector}". الوصف يجب أن يشرح فكرة المشروع وهدفه والجمهور المستهدف في 3-4 جمل واضحة ومقنعة باللغة العربية.`;
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], stream: false }),
      });
      if (!res.ok) throw new Error("فشل الذكاء الاصطناعي");
      const d = await res.json();
      const text = d.content || d.message || d.text || "";
      if (text) upd("projectIdea", text.trim());
      else toast({ title: "لم يتمكن الذكاء الاصطناعي من توليد النص، حاول مجدداً", variant: "destructive" });
    } catch {
      toast({ title: "تعذّر الاتصال بالذكاء الاصطناعي، اكتب الفكرة يدوياً", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!authData.identifier || !authData.password) {
      toast({ title: "أدخل بريدك الإلكتروني وكلمة المرور", variant: "destructive" }); return;
    }
    setAuthLoading(true);
    try {
      if (authMode === "login") {
        const res = await fetch("/api/login", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: authData.identifier, password: authData.password }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else {
        if (!authData.email && !authData.identifier.includes("@")) {
          toast({ title: "أدخل بريدك الإلكتروني", variant: "destructive" }); setAuthLoading(false); return;
        }
        const email = authData.identifier.includes("@") ? authData.identifier : authData.email;
        const username = email.split("@")[0].replace(/[^a-z0-9_]/gi, "").slice(0, 15) + Math.random().toString(36).slice(2, 5);
        const regRes = await fetch("/api/register", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password: authData.password, fullName: authData.fullName || username, role: "client", email, phone: authData.phone }),
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.error || "فشل إنشاء الحساب");
        await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier: email, password: authData.password }) });
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
      toast({ title: "✓ تم تسجيل الدخول، يمكنك متابعة طلبك" });
      setStep(1);
    } catch (e: any) {
      toast({ title: e.message || "فشل تسجيل الدخول", variant: "destructive" });
    } finally { setAuthLoading(false); }
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      sessionStorage.setItem("qiroxWizardData", JSON.stringify({
        ...data,
        cartItems, total, planTier,
        grandTotal: total, planPrice: total,
        timestamp: Date.now(),
        formData: { sector: data.sector, businessName: data.businessName },
        uploadedFiles: data.extraFiles,
        selectedAddons: [],
      }));
      navigate("/checkout");
    } catch {
      toast({ title: "حدث خطأ، حاول مرة أخرى", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  if (isUserLoading || isCartLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#09090f] flex items-center justify-center" dir={dir}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const activeStep = STEP_CONFIG[step - 1] || null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090f] flex flex-col" dir={dir}>
      <Navigation />
      <div className="h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-violet-500" />

      <div className="flex-1 max-w-xl mx-auto w-full px-4 pt-8 pb-24">

        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-4 py-1.5 rounded-full mb-4">
            <QiroxIcon className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-500">إتمام طلبك</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">3 خطوات بسيطة فقط</h1>
          <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">سنبدأ مشروعك فور تأكيد الطلب والدفع</p>
        </div>

        {/* Step progress */}
        {step > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              {STEP_CONFIG.map((s, i) => {
                const done = step > s.id;
                const active = step === s.id;
                const Icon = s.icon;
                return (
                  <div key={s.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                        done ? "bg-green-500 border-green-500 text-white" :
                        active ? "bg-blue-500 border-blue-500 text-white" :
                        "bg-white dark:bg-gray-900 border-gray-200 dark:border-slate-700 text-gray-300 dark:text-slate-600"
                      }`}>
                        {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <span className={`text-[10px] font-bold ${active ? "text-blue-500" : done ? "text-green-500" : "text-gray-300 dark:text-slate-600"}`}>{s.title}</span>
                    </div>
                    {i < STEP_CONFIG.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-1 mb-4 rounded-full transition-all ${done ? "bg-green-400" : "bg-gray-200 dark:bg-slate-700"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cart summary */}
        {step > 0 && cartItems.length > 0 && (
          <div className="mb-4 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-2xl px-4 py-3 flex items-center gap-3">
            <ShoppingCart className="w-4 h-4 text-gray-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-400">{cartItems.length} عنصر</p>
              <p className="text-sm font-black text-gray-900 dark:text-white">{total.toLocaleString()} ر.س</p>
            </div>
            <button onClick={() => navigate("/cart")} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3 h-3" /> رجوع للسلة
            </button>
          </div>
        )}

        {/* Step card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-[#0e0e1a] border border-gray-200 dark:border-white/[0.07] rounded-3xl overflow-hidden shadow-sm"
          >
            {/* Step header bar */}
            {activeStep && (
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-white/[0.05] bg-gray-50 dark:bg-white/[0.02]">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center shrink-0">
                  <activeStep.icon className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-black text-gray-900 dark:text-white text-sm">{activeStep.title}</p>
                  <p className="text-gray-400 dark:text-slate-500 text-[11px]">{activeStep.desc}</p>
                </div>
              </div>
            )}

            <div className="px-6 py-6 space-y-5">

              {/* ── STEP 0: AUTH ───────────────────────────────── */}
              {step === 0 && (
                <div className="space-y-5">
                  <div className="text-center">
                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-200 dark:border-blue-500/20">
                      {authMode === "login" ? <LogIn className="w-6 h-6 text-blue-500" /> : <UserPlus className="w-6 h-6 text-blue-500" />}
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">
                      {authMode === "login" ? "سجّل الدخول للمتابعة" : "أنشئ حسابك مجاناً"}
                    </h3>
                    <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">لحفظ طلبك وتتبع تقدم مشروعك</p>
                  </div>

                  {authMode === "register" && (
                    <Field label="الاسم الكامل">
                      <TInput value={authData.fullName} onChange={(v: string) => setAuthData(p => ({ ...p, fullName: v }))} placeholder="اسمك الكامل" testId="input-full-name" />
                    </Field>
                  )}
                  <Field label="البريد الإلكتروني" required>
                    <TInput value={authData.identifier} onChange={(v: string) => setAuthData(p => ({ ...p, identifier: v }))} placeholder="name@email.com" type="email" dir="ltr" testId="input-email" />
                  </Field>
                  {authMode === "register" && (
                    <Field label="رقم الجوال" hint="سنتواصل معك على هذا الرقم">
                      <TInput value={authData.phone} onChange={(v: string) => setAuthData(p => ({ ...p, phone: v }))} placeholder="05xxxxxxxx" dir="ltr" testId="input-phone" />
                    </Field>
                  )}
                  <Field label="كلمة المرور" required>
                    <div className="relative">
                      <TInput value={authData.password} onChange={(v: string) => setAuthData(p => ({ ...p, password: v }))} placeholder="••••••••" type={showPass ? "text" : "password"} dir="ltr" testId="input-password" />
                      <button type="button" onClick={() => setShowPass(p => !p)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>

                  <Button onClick={handleAuth} disabled={authLoading} className="w-full h-12 rounded-xl font-black gap-2 bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-auth-submit">
                    {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : authMode === "login" ? <><LogIn className="w-4 h-4" /> تسجيل الدخول والمتابعة</> : <><UserPlus className="w-4 h-4" /> إنشاء الحساب والمتابعة</>}
                  </Button>
                  <div className="text-center">
                    <button type="button" onClick={() => setAuthMode(m => m === "login" ? "register" : "login")} className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline">
                      {authMode === "login" ? "ليس لديك حساب؟ أنشئ حساباً جديداً" : "لديك حساب؟ سجّل الدخول"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 1: IDEA ───────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-5">

                  {/* Business name + WhatsApp */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="اسم المشروع / النشاط" required hint="مثال: مطعم الأصالة">
                      <TInput value={data.businessName} onChange={(v: string) => upd("businessName", v)} placeholder="اسم مشروعك" testId="input-business-name" />
                    </Field>
                    <Field label="رقم الواتساب" required>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel" value={data.whatsapp} dir="ltr"
                          onChange={e => upd("whatsapp", e.target.value)}
                          placeholder="05xxxxxxxx" data-testid="input-whatsapp"
                          className="w-full h-11 pr-10 pl-4 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-slate-700/60 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                    </Field>
                  </div>

                  {/* Sector */}
                  <Field label="قطاع النشاط" required>
                    <div className="grid grid-cols-2 gap-2">
                      {SECTORS.map(s => (
                        <button
                          key={s.value} type="button"
                          onClick={() => upd("sector", s.value)}
                          data-testid={`sector-${s.value}`}
                          className={`h-10 rounded-xl border text-xs font-bold text-right px-3 transition-all ${
                            data.sector === s.value
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300"
                              : "border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-white/[0.02] text-gray-600 dark:text-slate-400 hover:border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {/* Project idea with AI assist */}
                  <Field label="فكرة مشروعك" required hint="اشرح لنا ما تريد تحقيقه وجمهورك المستهدف">
                    <div className="relative">
                      <textarea
                        value={data.projectIdea}
                        onChange={e => upd("projectIdea", e.target.value)}
                        rows={5}
                        placeholder="مثال: أريد موقعاً إلكترونياً لمطعمي يتيح للزبائن رؤية قائمة الطعام وحجز الطاولات وطلب التوصيل..."
                        data-testid="textarea-project-idea"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-slate-700/60 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500 transition-all resize-none leading-relaxed"
                      />
                      {/* AI help button */}
                      <button
                        type="button"
                        onClick={handleAIIdea}
                        disabled={aiLoading || (!data.businessName.trim() && !data.sector)}
                        data-testid="button-ai-idea"
                        className="absolute left-2 bottom-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 text-white text-[11px] font-bold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                      >
                        {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                        {aiLoading ? "جارٍ الكتابة..." : "✨ اكتب لي"}
                      </button>
                    </div>
                    {(!data.businessName.trim() || !data.sector) && (
                      <p className="text-[10px] text-violet-500 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        أدخل اسم المشروع واختر القطاع لتفعيل المساعد الذكي
                      </p>
                    )}
                  </Field>

                  {/* Email */}
                  <Field label="البريد الإلكتروني الرسمي">
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email" value={data.email} dir="ltr"
                        onChange={e => upd("email", e.target.value)}
                        placeholder="info@company.com"
                        className="w-full h-11 pr-10 pl-4 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-slate-700/60 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </Field>
                </div>
              )}

              {/* ── STEP 2: FILES (all optional) ───────────────── */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/[0.08] border border-blue-200 dark:border-blue-500/20 rounded-xl px-4 py-3">
                    <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">كل الملفات في هذه الخطوة <strong>اختيارية تماماً</strong> — يمكنك إرسالها لاحقاً عبر واتساب أو البريد الإلكتروني</p>
                  </div>

                  {/* Logo */}
                  <Field label="شعار مشروعك" hint="PNG أو JPG — إذا لم يكن لديك شعار سنساعدك لاحقاً">
                    <input ref={logoRef} type="file" accept="image/*" className="hidden"
                      onChange={async e => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const url = await uploadFile(f, setUploading);
                        if (url) upd("logoFile", url);
                        else toast({ title: "فشل رفع الشعار", variant: "destructive" });
                      }}
                    />
                    {data.logoFile ? (
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-500/[0.08] border border-green-200 dark:border-green-500/20 rounded-xl">
                        <img src={data.logoFile} alt="logo" className="w-12 h-12 object-contain rounded-lg border border-green-200" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-green-700 dark:text-green-300">✓ تم رفع الشعار</p>
                        </div>
                        <button type="button" onClick={() => upd("logoFile", "")} className="text-gray-400 hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button" onClick={() => logoRef.current?.click()} disabled={uploading}
                        data-testid="button-upload-logo"
                        className="w-full h-24 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/[0.05] transition-all group"
                      >
                        {uploading ? <Loader2 className="w-5 h-5 animate-spin text-blue-500" /> : <ImageIcon className="w-6 h-6 text-gray-300 group-hover:text-blue-400 transition-colors" />}
                        <span className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors font-medium">اضغط لرفع الشعار</span>
                      </button>
                    )}
                  </Field>

                  {/* Extra files */}
                  <Field label="ملفات إضافية" hint="هوية بصرية، وثائق، مراجع تصميم... أي شيء يساعدنا على فهم مشروعك">
                    <input ref={extraRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.zip" className="hidden"
                      onChange={async e => {
                        const files = Array.from(e.target.files || []);
                        if (!files.length) return;
                        setUploadingExtra(true);
                        const urls: string[] = [];
                        for (const f of files) {
                          const url = await uploadFile(f, () => {});
                          if (url) urls.push(url);
                        }
                        setUploadingExtra(false);
                        if (urls.length) upd("extraFiles", [...data.extraFiles, ...urls]);
                        else toast({ title: "فشل رفع الملفات", variant: "destructive" });
                      }}
                    />
                    <button
                      type="button" onClick={() => extraRef.current?.click()} disabled={uploadingExtra}
                      data-testid="button-upload-extra"
                      className="w-full h-20 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/[0.05] transition-all group"
                    >
                      {uploadingExtra ? <Loader2 className="w-5 h-5 animate-spin text-violet-500" /> : <Upload className="w-5 h-5 text-gray-300 group-hover:text-violet-400 transition-colors" />}
                      <span className="text-xs text-gray-400 group-hover:text-violet-500 transition-colors font-medium">
                        {data.extraFiles.length > 0 ? `${data.extraFiles.length} ملف — اضغط لإضافة المزيد` : "اضغط لرفع ملفات (اختياري)"}
                      </span>
                    </button>
                    {data.extraFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {data.extraFiles.map((url, i) => (
                          <div key={i} className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] rounded-lg px-2.5 py-1.5">
                            <FileText className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600 dark:text-slate-400">ملف {i + 1}</span>
                            <button type="button" onClick={() => upd("extraFiles", data.extraFiles.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 transition-colors ml-0.5">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Field>

                  <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                      لا تقلق إذا لم تكن لديك الملفات الآن — فريقنا سيتواصل معك على <strong className="text-gray-600 dark:text-slate-300">واتساب</strong> بعد تأكيد الطلب
                    </p>
                  </div>
                </div>
              )}

              {/* ── STEP 3: REVIEW & GO TO PAYMENT ─────────────── */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="text-center py-2">
                    <div className="w-14 h-14 bg-green-50 dark:bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-green-200 dark:border-green-500/20">
                      <Check className="w-7 h-7 text-green-500" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">جاهز للدفع!</h3>
                    <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">راجع ملخص طلبك ثم انتقل لاختيار طريقة الدفع</p>
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] rounded-2xl p-4 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">ملخص طلبك</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-slate-500">اسم المشروع</span>
                        <span className="font-bold text-gray-900 dark:text-white">{data.businessName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-slate-500">القطاع</span>
                        <span className="font-bold text-gray-900 dark:text-white">{SECTORS.find(s => s.value === data.sector)?.label || data.sector}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-slate-500">واتساب</span>
                        <span className="font-bold text-gray-900 dark:text-white" dir="ltr">{data.whatsapp}</span>
                      </div>
                      {data.logoFile && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 dark:text-slate-500">الشعار</span>
                          <span className="font-bold text-green-600">✓ تم الرفع</span>
                        </div>
                      )}
                      {data.extraFiles.length > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 dark:text-slate-500">ملفات إضافية</span>
                          <span className="font-bold text-gray-900 dark:text-white">{data.extraFiles.length} ملف</span>
                        </div>
                      )}
                    </div>
                    {cartItems.length > 0 && (
                      <>
                        <div className="border-t border-gray-200 dark:border-white/[0.06] pt-3">
                          {cartItems.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 dark:text-slate-400">{(item as any).nameAr || item.name}</span>
                              <span className="font-bold text-gray-900 dark:text-white">{(item.price * item.qty).toLocaleString()} ر.س</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-gray-200 dark:border-white/[0.06] pt-3 flex justify-between items-center">
                          <span className="font-black text-gray-900 dark:text-white">الإجمالي</span>
                          <span className="text-xl font-black text-blue-600">{total.toLocaleString()} ر.س</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-500/[0.08] border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-2">
                    <Globe className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">بعد الدفع سيتواصل معك فريقنا على واتساب خلال <strong>24 ساعة</strong> لبدء تنفيذ مشروعك</p>
                  </div>
                </div>
              )}

            </div>

            {/* Navigation buttons */}
            <div className="px-6 pb-6 flex gap-3">
              {step > 1 && step <= 3 && (
                <Button variant="outline" onClick={() => setStep(s => (s - 1) as any)} className="flex-1 h-12 rounded-xl gap-2 font-bold" data-testid="button-wizard-back">
                  <ArrowLeft className="w-4 h-4" /> السابق
                </Button>
              )}

              {step >= 1 && step < 3 && (
                <Button
                  onClick={() => setStep(s => (s + 1) as any)}
                  disabled={!canNext()}
                  className="flex-[2] h-12 rounded-xl font-black gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-wizard-next"
                >
                  التالي
                  {step < 2 ? <Lightbulb className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                </Button>
              )}

              {step === 3 && (
                <Button
                  onClick={handleFinish}
                  disabled={submitting}
                  className="flex-[2] h-12 rounded-xl font-black gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
                  data-testid="button-wizard-finish"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" /> انتقل للدفع</>}
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

      </div>
      <Footer />
    </div>
  );
}
