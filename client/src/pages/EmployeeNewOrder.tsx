import { useState } from "react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  User, Mail, Phone, Lock, Building2, Globe, CheckCircle2,
  ShoppingCart, Lightbulb, DollarSign, FileText, Plus, X,
  Loader2, ArrowRight, ArrowLeft, RefreshCw, ChevronDown, ChevronUp,
  Package, Briefcase, Copy, Check, Eye, EyeOff,
} from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";

const SECTORS = [
  "مطاعم وكافيهات", "متاجر إلكترونية", "تعليم وأكاديميات",
  "صحة ولياقة", "عقارات", "مؤسسات وشركات", "خدمات احترافية",
  "ترفيه وفعاليات", "تقنية ومعلومات", "أخرى",
];

const PROJECT_TYPES = [
  "موقع إلكتروني", "تطبيق جوال", "نظام إداري", "متجر إلكتروني",
  "منصة تعليمية", "نظام حجوزات", "تطبيق مطاعم", "نظام عيادات",
  "برنامج محاسبي", "لوحة تحكم", "واجهة برمجية (API)", "أخرى",
];

const COUNTRIES = [
  { code: "SA", name: "المملكة العربية السعودية", flag: "🇸🇦" },
  { code: "AE", name: "الإمارات", flag: "🇦🇪" },
  { code: "KW", name: "الكويت", flag: "🇰🇼" },
  { code: "QA", name: "قطر", flag: "🇶🇦" },
  { code: "BH", name: "البحرين", flag: "🇧🇭" },
  { code: "OM", name: "عُمان", flag: "🇴🇲" },
  { code: "JO", name: "الأردن", flag: "🇯🇴" },
  { code: "EG", name: "مصر", flag: "🇪🇬" },
  { code: "YE", name: "اليمن", flag: "🇾🇪" },
  { code: "IQ", name: "العراق", flag: "🇮🇶" },
  { code: "SY", name: "سوريا", flag: "🇸🇾" },
  { code: "LB", name: "لبنان", flag: "🇱🇧" },
  { code: "LY", name: "ليبيا", flag: "🇱🇾" },
  { code: "TN", name: "تونس", flag: "🇹🇳" },
  { code: "MA", name: "المغرب", flag: "🇲🇦" },
  { code: "DZ", name: "الجزائر", flag: "🇩🇿" },
  { code: "SD", name: "السودان", flag: "🇸🇩" },
  { code: "OTHER", name: "أخرى", flag: "🌍" },
];

const BUSINESS_TYPES = [
  "تجاري", "مطعم / مقهى", "تعليمي", "طبي / صحي",
  "عقارات", "خدمات", "تقنية", "ترفيه", "أخرى",
];

function generatePassword(length = 10): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function generateUsername(fullName: string): string {
  return fullName
    .split(" ")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12) + Math.floor(100 + Math.random() * 900);
}

type Step = "client" | "order" | "done";

interface ServiceItem {
  id: string;
  name: string;
  nameAr: string;
  price?: number;
}

interface Result {
  client: { id: string; username: string; fullName: string; email: string };
  order: { id: string } | null;
}

export default function EmployeeNewOrder() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("client");
  const [copiedPw, setCopiedPw] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  // Client fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState(generatePassword());
  const [businessType, setBusinessType] = useState("");
  const [country, setCountry] = useState("SA");

  // Order fields
  const [projectType, setProjectType] = useState("");
  const [sector, setSector] = useState("");
  const [idea, setIdea] = useState("");
  const [notes, setNotes] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([]);
  const [customService, setCustomService] = useState("");

  const { data: availableServices } = useQuery<ServiceItem[]>({
    queryKey: ["/api/services"],
  });

  const mutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/employee/create-client-order", data),
    onSuccess: async (res: any) => {
      const data = await res.json();
      setResult(data);
      setStep("done");
    },
    onError: async (err: any) => {
      let msg = "حدث خطأ أثناء الإنشاء";
      try { const d = await err.response?.json?.(); msg = d?.error || msg; } catch {}
      toast({ title: msg, variant: "destructive" });
    },
  });

  function handleAutoFill() {
    if (fullName && !username) {
      setUsername(generateUsername(fullName));
    }
  }

  function copyPassword() {
    navigator.clipboard.writeText(password);
    setCopiedPw(true);
    setTimeout(() => setCopiedPw(false), 2000);
  }

  function addCustomService() {
    if (!customService.trim()) return;
    setSelectedServices(prev => [...prev, { id: Date.now().toString(), name: customService, nameAr: customService }]);
    setCustomService("");
  }

  function removeService(id: string) {
    setSelectedServices(prev => prev.filter(s => s.id !== id));
  }

  function toggleService(svc: ServiceItem) {
    setSelectedServices(prev =>
      prev.find(s => s.id === svc.id)
        ? prev.filter(s => s.id !== svc.id)
        : [...prev, svc]
    );
  }

  function handleSubmit() {
    if (!fullName || !email || !username || !password) {
      toast({ title: "أكمل بيانات العميل أولاً", variant: "destructive" });
      return;
    }
    mutation.mutate({
      fullName, email, phone, username, password,
      businessType, country,
      projectType, sector, idea, notes,
      totalAmount: totalAmount ? Number(totalAmount) : 0,
      services: selectedServices,
    });
  }

  const clientValid = fullName.trim() && email.trim() && email.includes("@") && username.trim() && password.length >= 6;

  return (
    <div className="relative overflow-hidden min-h-screen bg-black/[0.02] p-4 md:p-8" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Link href="/dashboard">
            <button className="w-9 h-9 rounded-xl bg-white border border-black/[0.08] flex items-center justify-center hover:bg-black/5 transition-colors">
              <ArrowRight className="w-4 h-4 text-black/50" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-black font-heading text-black">إنشاء عميل وطلب جديد</h1>
            <p className="text-black/40 text-sm">أنشئ حساب عميل وسجّل طلبه في خطوتين</p>
          </div>
        </div>

        {/* Step indicator */}
        {step !== "done" && (
          <div className="flex items-center gap-2 mb-8">
            {[
              { key: "client", label: "بيانات العميل", icon: User },
              { key: "order",  label: "تفاصيل الطلب",  icon: Package },
            ].map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <button
                  onClick={() => { if (s.key === "order" && !clientValid) return; setStep(s.key as Step); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    step === s.key ? "bg-black text-white shadow-md" :
                    (i === 1 && step === "order") || (i === 0 && step === "order") ? "bg-green-500 text-white" :
                    "bg-white border border-black/[0.08] text-black/40"
                  }`}
                >
                  <s.icon className="w-4 h-4" />
                  {s.label}
                </button>
                {i === 0 && <ArrowLeft className="w-4 h-4 text-black/20" />}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── STEP: CLIENT ── */}
          {step === "client" && (
            <motion.div key="client" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
              <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-black text-base">معلومات العميل</h2>
                    <p className="text-black/35 text-xs">ستُرسَل بيانات الدخول لبريده الإلكتروني تلقائياً</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">الاسم الكامل <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                      <input
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        onBlur={handleAutoFill}
                        placeholder="محمد أحمد العلي"
                        className="w-full h-11 pr-10 pl-4 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25 transition-colors"
                        data-testid="input-client-fullname"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">البريد الإلكتروني <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="client@email.com"
                        dir="ltr"
                        className="w-full h-11 pr-10 pl-4 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25 transition-colors"
                        data-testid="input-client-email"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">رقم الهاتف / الواتساب</label>
                    <div className="relative">
                      <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                      <input
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+966 5X XXX XXXX"
                        dir="ltr"
                        className="w-full h-11 pr-10 pl-4 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25 transition-colors"
                        data-testid="input-client-phone"
                      />
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">
                      اسم المستخدم <span className="text-red-400">*</span>
                      <button type="button" onClick={() => setUsername(generateUsername(fullName || "client"))} className="mr-2 text-[10px] text-black/30 hover:text-black/60 underline">توليد تلقائي</button>
                    </label>
                    <div className="relative">
                      <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                      <input
                        value={username}
                        onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                        placeholder="client123"
                        dir="ltr"
                        className="w-full h-11 pr-10 pl-4 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm font-mono outline-none focus:border-black/25 transition-colors"
                        data-testid="input-client-username"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">
                      كلمة المرور <span className="text-red-400">*</span>
                      <button type="button" onClick={() => setPassword(generatePassword())} className="mr-2 text-[10px] text-black/30 hover:text-black/60 flex-inline items-center gap-0.5">
                        <RefreshCw className="inline w-2.5 h-2.5 ml-0.5" /> توليد جديد
                      </button>
                    </label>
                    <div className="relative">
                      <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                      <input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        dir="ltr"
                        className="w-full h-11 pr-10 pl-20 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm font-mono outline-none focus:border-black/25 transition-colors"
                        data-testid="input-client-password"
                      />
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button type="button" onClick={() => setShowPw(!showPw)} className="p-1 text-black/20 hover:text-black/50 transition-colors">
                          {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button type="button" onClick={copyPassword} className="p-1 text-black/20 hover:text-black/50 transition-colors">
                          {copiedPw ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-black/30 mt-1">ستُرسَل هذه البيانات للعميل عبر بريده الإلكتروني</p>
                  </div>

                  {/* Business Type */}
                  <div>
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">نوع النشاط</label>
                    <div className="relative">
                      <Building2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                      <select
                        value={businessType}
                        onChange={e => setBusinessType(e.target.value)}
                        className="w-full h-11 pr-10 pl-4 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25 transition-colors appearance-none"
                        data-testid="select-business-type"
                      >
                        <option value="">اختر نوع النشاط</option>
                        {BUSINESS_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">الدولة</label>
                    <div className="relative">
                      <Globe className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                      <select
                        value={country}
                        onChange={e => setCountry(e.target.value)}
                        className="w-full h-11 pr-10 pl-4 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25 transition-colors appearance-none"
                        data-testid="select-country"
                      >
                        {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-start">
                  <Button
                    onClick={() => {
                      if (!clientValid) {
                        toast({ title: "أكمل الحقول المطلوبة (الاسم، البريد، المستخدم، كلمة المرور)", variant: "destructive" });
                        return;
                      }
                      setStep("order");
                    }}
                    className="bg-black hover:bg-black/80 text-white rounded-xl px-8 h-11 font-bold text-sm gap-2"
                    data-testid="button-next-order"
                  >
                    التالي: تفاصيل الطلب
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP: ORDER ── */}
          {step === "order" && (
            <motion.div key="order" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>

              {/* Client summary */}
              <div className="bg-black text-white rounded-2xl p-4 mb-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{fullName}</p>
                  <p className="text-white/40 text-xs truncate">{email}</p>
                </div>
                <button onClick={() => setStep("client")} className="text-white/30 hover:text-white/60 transition-colors text-xs flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5" /> تعديل
                </button>
              </div>

              <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-black text-base">تفاصيل الطلب</h2>
                    <p className="text-black/35 text-xs">الحقول اختيارية — يمكن تركها فارغة والتعديل لاحقاً</p>
                  </div>
                </div>

                {/* Project Type + Sector */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">نوع المشروع</label>
                    <div className="relative">
                      <Briefcase className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                      <select
                        value={projectType}
                        onChange={e => setProjectType(e.target.value)}
                        className="w-full h-11 pr-10 pl-4 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25 transition-colors appearance-none"
                        data-testid="select-project-type"
                      >
                        <option value="">اختر نوع المشروع</option>
                        {PROJECT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">القطاع</label>
                    <div className="relative">
                      <Building2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                      <select
                        value={sector}
                        onChange={e => setSector(e.target.value)}
                        className="w-full h-11 pr-10 pl-4 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25 transition-colors appearance-none"
                        data-testid="select-sector"
                      >
                        <option value="">اختر القطاع</option>
                        {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div>
                  <label className="text-xs font-semibold text-black/50 block mb-2">الخدمات المطلوبة</label>
                  {availableServices && availableServices.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {availableServices.map(svc => {
                        const selected = selectedServices.some(s => s.id === svc.id);
                        return (
                          <button
                            key={svc.id}
                            type="button"
                            onClick={() => toggleService(svc)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                              selected
                                ? "bg-black text-white border-black"
                                : "bg-black/[0.02] text-black/60 border-black/[0.08] hover:border-black/25"
                            }`}
                            data-testid={`service-${svc.id}`}
                          >
                            {selected && <Check className="inline w-3 h-3 ml-1" />}
                            {svc.nameAr || svc.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {/* Custom service */}
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <ShoppingCart className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/20 pointer-events-none" />
                      <input
                        value={customService}
                        onChange={e => setCustomService(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomService())}
                        placeholder="أضف خدمة مخصصة..."
                        className="w-full h-9 pr-9 pl-3 border border-black/[0.08] bg-black/[0.01] rounded-xl text-xs outline-none focus:border-black/25 transition-colors"
                      />
                    </div>
                    <Button type="button" onClick={addCustomService} variant="outline" size="sm" className="rounded-xl h-9 px-3">
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {selectedServices.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedServices.map(s => (
                        <span key={s.id} className="inline-flex items-center gap-1 bg-black text-white text-xs px-2.5 py-1 rounded-lg">
                          {s.nameAr || s.name}
                          <button type="button" onClick={() => removeService(s.id)}>
                            <X className="w-3 h-3 opacity-60 hover:opacity-100" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Idea */}
                <div>
                  <label className="text-xs font-semibold text-black/50 block mb-1.5">فكرة المشروع / وصف العميل</label>
                  <div className="relative">
                    <Lightbulb className="absolute right-3.5 top-3.5 w-4 h-4 text-black/20 pointer-events-none" />
                    <textarea
                      value={idea}
                      onChange={e => setIdea(e.target.value)}
                      placeholder="اكتب وصف المشروع وفكرة العميل هنا..."
                      rows={4}
                      className="w-full pr-10 pl-4 pt-3 pb-3 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25 transition-colors resize-none"
                      data-testid="textarea-idea"
                    />
                  </div>
                </div>

                {/* Notes + Amount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">ملاحظات داخلية</label>
                    <div className="relative">
                      <FileText className="absolute right-3.5 top-3.5 w-4 h-4 text-black/20 pointer-events-none" />
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="ملاحظات للفريق فقط..."
                        rows={3}
                        className="w-full pr-10 pl-4 pt-3 pb-3 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25 transition-colors resize-none"
                        data-testid="textarea-notes"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">المبلغ الإجمالي (ر.س)</label>
                    <div className="relative">
                      <DollarSign className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                      <input
                        type="number"
                        value={totalAmount}
                        onChange={e => setTotalAmount(e.target.value)}
                        placeholder="0"
                        dir="ltr"
                        className="w-full h-11 pr-10 pl-4 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25 transition-colors"
                        data-testid="input-total-amount"
                      />
                    </div>
                    <p className="text-[10px] text-black/30 mt-1">يمكن تركه 0 وتحديده لاحقاً</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={mutation.isPending}
                    className="flex-1 bg-black hover:bg-black/80 text-white rounded-xl h-12 font-bold text-sm gap-2"
                    data-testid="button-submit-order"
                  >
                    {mutation.isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإنشاء...</>
                      : <><CheckCircle2 className="w-4 h-4" /> إنشاء الحساب والطلب</>
                    }
                  </Button>
                  <Button
                    onClick={() => mutation.mutate({
                      fullName, email, phone, username, password,
                      businessType, country,
                    })}
                    disabled={mutation.isPending}
                    variant="outline"
                    className="rounded-xl h-12 px-5 text-sm font-semibold border-black/[0.10]"
                    data-testid="button-submit-client-only"
                  >
                    حساب فقط
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP: DONE ── */}
          {step === "done" && result && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
              <div className="bg-white border border-black/[0.06] rounded-2xl p-8 shadow-sm text-center">
                <div className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-green-500/20">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-black font-heading text-black mb-2">تم الإنشاء بنجاح!</h2>
                <p className="text-black/40 text-sm mb-6">تم إنشاء حساب العميل{result.order ? " والطلب" : ""} وإرسال البيانات لبريده الإلكتروني</p>

                <div className="bg-black/[0.02] border border-black/[0.06] rounded-2xl p-4 text-right mb-6 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-black/40 text-xs">الاسم</span>
                    <span className="font-bold text-sm text-black">{result.client.fullName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-black/40 text-xs">المستخدم</span>
                    <span className="font-mono font-bold text-sm text-black">{result.client.username}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-black/40 text-xs">البريد</span>
                    <span className="font-bold text-sm text-black" dir="ltr">{result.client.email}</span>
                  </div>
                  {result.order && (
                    <div className="flex justify-between items-center pt-2 border-t border-black/[0.06]">
                      <span className="text-black/40 text-xs">رقم الطلب</span>
                      <span className="font-mono font-bold text-sm text-black">#{String(result.order.id).slice(-8).toUpperCase()}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => {
                      setStep("client");
                      setFullName(""); setEmail(""); setPhone(""); setUsername("");
                      setPassword(generatePassword()); setBusinessType(""); setCountry("SA");
                      setProjectType(""); setSector(""); setIdea(""); setNotes("");
                      setTotalAmount(""); setSelectedServices([]);
                      setResult(null);
                    }}
                    variant="outline"
                    className="rounded-xl h-11 px-6 border-black/[0.10]"
                    data-testid="button-new-client"
                  >
                    عميل جديد
                  </Button>
                  <Link href="/admin/orders">
                    <Button className="bg-black hover:bg-black/80 text-white rounded-xl h-11 px-6" data-testid="button-view-orders">
                      عرض الطلبات
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
