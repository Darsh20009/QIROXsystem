// @ts-nocheck
import { useState, useRef } from "react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  User, Mail, Phone, Lock, Building2, Globe, CheckCircle2,
  ShoppingCart, Lightbulb, DollarSign, FileText, Plus, X,
  Loader2, ArrowRight, ArrowLeft, RefreshCw, ChevronDown, ChevronUp,
  Package, Briefcase, Copy, Check, Eye, EyeOff, Search, Users,
  Crown, Smartphone, Star, Zap, Sparkles, Tag, Percent, Scissors,
  Globe2, Code2, Shield, Database, Monitor, Wifi, PlusCircle, Layers,
} from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

/* ─── Constants ─────────────────────────────────────────────── */
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
  { code: "OTHER", name: "أخرى", flag: "🌍" },
];
const BUSINESS_TYPES = [
  "تجاري", "مطعم / مقهى", "تعليمي", "طبي / صحي",
  "عقارات", "خدمات", "تقنية", "ترفيه", "أخرى",
];
const PLAN_ICONS: Record<string, any> = { Zap, Star, Crown, Sparkles, Package };
const ADDON_ICONS: Record<string, any> = {
  Smartphone, Globe, Globe2, Code2, Shield, Database, Monitor, Wifi,
  Zap, Star, Package, Plus, PlusCircle, Layers, Briefcase, Tag,
};
const BILLING_LABELS: Record<string, string> = {
  monthly: "شهري", sixmonth: "نصف سنوي", annual: "سنوي", lifetime: "مدى الحياة",
};
const BILLING_PRICE_KEY: Record<string, string> = {
  monthly: "monthlyPrice", sixmonth: "sixMonthPrice", annual: "annualPrice", lifetime: "lifetimePrice",
};
const TIER_LABELS: Record<string, string> = {
  lite: "لايت", pro: "برو", infinite: "إنفينت", custom: "مخصص",
};
const SEGMENT_LABELS: Record<string, string> = {
  general: "عام", restaurant: "مطاعم وكافيهات", ecommerce: "متاجر إلكترونية",
  education: "تعليم", corporate: "شركات ومؤسسات", realestate: "عقارات",
  healthcare: "صحة وعيادات",
};

function generatePassword(length = 10): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
function generateUsername(fullName: string): string {
  return fullName.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) + Math.floor(100 + Math.random() * 900);
}

type Mode = "new" | "existing";
type Step = "client" | "order" | "done";

interface OrderItem { id: string; name: string; nameAr: string; price?: number; type?: string; }
interface Result {
  client: { id: string; username?: string; fullName: string; email: string };
  order: { id: string } | null;
}

/* ─── Component ─────────────────────────────────────────────── */
export default function EmployeeNewOrder() {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("new");
  const [step, setStep] = useState<Step>("client");
  const [copiedPw, setCopiedPw] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  /* ── New client fields ── */
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState(generatePassword());
  const [businessType, setBusinessType] = useState("");
  const [country, setCountry] = useState("SA");

  /* ── Existing client search ── */
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const searchRef = useRef<HTMLDivElement>(null); // kept for potential future use

  const { data: clientList = [], isFetching: searchLoading } = useQuery<any[]>({
    queryKey: ["/api/employee/search-clients", clientSearch],
    queryFn: async () => {
      const q = clientSearch.trim();
      const url = q.length >= 2 ? `/api/employee/search-clients?q=${encodeURIComponent(q)}` : "/api/employee/search-clients";
      const r = await fetch(url, { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
    staleTime: 10_000,
  });

  /* ── Order fields ── */
  const [projectType, setProjectType] = useState("");
  const [sector, setSector] = useState("");
  const [idea, setIdea] = useState("");
  const [notes, setNotes] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [customItem, setCustomItem] = useState("");
  const [selectedBilling, setSelectedBilling] = useState<string>("monthly");
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [discountValue, setDiscountValue] = useState("");

  /* ── API data ── */
  const { data: extraAddons = [] } = useQuery<any[]>({ queryKey: ["/api/extra-addons"] });
  const { data: pricingPlans = [] } = useQuery<any[]>({ queryKey: ["/api/pricing"] });
  const { data: products = [] } = useQuery<any[]>({ queryKey: ["/api/products"] });

  /* ── Mutations ── */
  const newClientMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/employee/create-client-order", data),
    onSuccess: async (res: any) => { const data = await res.json(); setResult(data); setStep("done"); },
    onError: (err: any) => toast({ title: err.message || "حدث خطأ", variant: "destructive" }),
  });

  const existingClientMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/employee/order-for-client", data),
    onSuccess: async (res: any) => { const data = await res.json(); setResult(data); setStep("done"); },
    onError: (err: any) => toast({ title: err.message || "حدث خطأ", variant: "destructive" }),
  });

  const isPending = newClientMutation.isPending || existingClientMutation.isPending;

  /* ── Helpers ── */
  function copyPassword() { navigator.clipboard.writeText(password); setCopiedPw(true); setTimeout(() => setCopiedPw(false), 2000); }

  function toggleItem(item: OrderItem) {
    setSelectedItems(prev => prev.find(s => s.id === item.id) ? prev.filter(s => s.id !== item.id) : [...prev, item]);
  }
  function addCustom() {
    if (!customItem.trim()) return;
    setSelectedItems(prev => [...prev, { id: Date.now().toString(), name: customItem, nameAr: customItem, type: "custom" }]);
    setCustomItem("");
  }
  function removeItem(id: string) { setSelectedItems(prev => prev.filter(s => s.id !== id)); }

  function getPlanPrice(plan: any): number | null {
    const key = BILLING_PRICE_KEY[selectedBilling];
    const val = plan[key];
    return (val !== undefined && val !== null) ? Number(val) : null;
  }

  function selectPlan(plan: any) {
    const price = getPlanPrice(plan) ?? 0;
    const id = `plan-${plan.id || plan._id}-${selectedBilling}`;
    if (selectedItems.find(s => s.id === id)) { removeItem(id); return; }
    setSelectedItems(prev => prev.filter(s => !s.id.startsWith("plan-")));
    const name = `باقة ${plan.nameAr || plan.name} — ${BILLING_LABELS[selectedBilling] || selectedBilling}`;
    setSelectedItems(prev => [...prev.filter(s => !s.id.startsWith("plan-")), { id, name, nameAr: name, price, type: "plan" }]);
    if (price > 0 && !totalAmount) setTotalAmount(String(price));
  }

  function selectProduct(product: any) {
    const id = `prod-${product.id || product._id}`;
    if (selectedItems.find(s => s.id === id)) { removeItem(id); return; }
    setSelectedItems(prev => [...prev, { id, name: product.nameAr || product.name, nameAr: product.nameAr || product.name, price: product.price || 0, type: "product" }]);
  }

  function calcDiscount(base: number): number {
    if (!discountValue || Number(discountValue) <= 0) return 0;
    if (discountType === "percent") return Math.round(base * Number(discountValue) / 100);
    return Math.min(Number(discountValue), base);
  }

  function handleSubmit() {
    const items = selectedItems;
    const base = totalAmount ? Number(totalAmount) : items.reduce((s, i) => s + (i.price || 0), 0);
    const discount = calcDiscount(base);
    const calculatedTotal = Math.max(0, base - discount);

    if (mode === "new") {
      if (!fullName || !email || !username || !password) {
        toast({ title: "أكمل بيانات العميل أولاً", variant: "destructive" }); return;
      }
      newClientMutation.mutate({ fullName, email, phone, username, password, businessType, country, projectType, sector, idea, notes, totalAmount: calculatedTotal, services: items });
    } else {
      if (!selectedClient) { toast({ title: "يجب تحديد عميل", variant: "destructive" }); return; }
      existingClientMutation.mutate({ clientId: selectedClient.id, projectType, sector, idea, notes, totalAmount: calculatedTotal, items, paymentMethod: "bank" });
    }
  }

  const clientValid = mode === "new"
    ? (fullName.trim() && email.trim() && email.includes("@") && username.trim() && password.length >= 6)
    : !!selectedClient;

  const autoTotal = selectedItems.reduce((s, i) => s + (i.price || 0), 0);


  /* ─────────────────────────────────── RENDER ─────────────────────────────── */
  return (
    <div className="relative overflow-hidden min-h-screen bg-black/[0.02] p-4 md:p-8" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/dashboard">
            <button className="w-9 h-9 rounded-xl bg-white border border-black/[0.08] flex items-center justify-center hover:bg-black/5 transition-colors">
              <ArrowRight className="w-4 h-4 text-black/50" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-black font-heading text-black">إنشاء طلب</h1>
            <p className="text-black/40 text-sm">أنشئ طلباً لعميل جديد أو موجود مسبقاً</p>
          </div>
        </div>

        {/* Mode toggle */}
        {step !== "done" && (
          <div className="flex gap-2 mb-6 bg-white border border-black/[0.07] rounded-2xl p-1.5">
            {([
              { key: "new", label: "عميل جديد", icon: User },
              { key: "existing", label: "عميل موجود", icon: Users },
            ] as { key: Mode; label: string; icon: any }[]).map(m => {
              const Icon = m.icon;
              return (
                <button key={m.key} onClick={() => { setMode(m.key); setStep("client"); setSelectedClient(null); setClientSearch(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === m.key ? "bg-black text-white shadow-sm" : "text-black/40 hover:text-black/70"}`}
                  data-testid={`mode-${m.key}`}>
                  <Icon className="w-4 h-4" /> {m.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Step indicator */}
        {step !== "done" && (
          <div className="flex items-center gap-2 mb-6">
            {[
              { key: "client", label: mode === "new" ? "بيانات العميل" : "تحديد العميل", icon: User },
              { key: "order",  label: "تفاصيل الطلب",  icon: Package },
            ].map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <button onClick={() => { if (s.key === "order" && !clientValid) return; setStep(s.key as Step); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${step === s.key ? "bg-black text-white shadow-md" : clientValid && s.key === "client" && step === "order" ? "bg-green-500 text-white" : "bg-white border border-black/[0.08] text-black/40"}`}>
                  <s.icon className="w-4 h-4" />
                  {s.label}
                </button>
                {i === 0 && <ArrowLeft className="w-4 h-4 text-black/20" />}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ════ STEP: CLIENT — New ════ */}
          {step === "client" && mode === "new" && (
            <motion.div key="client-new" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
              <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center"><User className="w-4 h-4 text-white" /></div>
                  <div>
                    <h2 className="font-bold text-black text-base">معلومات العميل الجديد</h2>
                    <p className="text-black/35 text-xs">ستُرسَل بيانات الدخول لبريده الإلكتروني تلقائياً</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">الاسم الكامل <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                      <input value={fullName} onChange={e => setFullName(e.target.value)} onBlur={() => { if (fullName && !username) setUsername(generateUsername(fullName)); }} placeholder="محمد أحمد العلي" className="w-full h-11 pr-10 pl-4 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25 transition-colors" data-testid="input-client-fullname" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">البريد الإلكتروني <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="client@email.com" dir="ltr" className="w-full h-11 pr-10 pl-4 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25 transition-colors" data-testid="input-client-email" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">رقم الهاتف</label>
                    <div className="relative">
                      <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+966 5X XXX XXXX" dir="ltr" className="w-full h-11 pr-10 pl-4 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25 transition-colors" data-testid="input-client-phone" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">اسم المستخدم <span className="text-red-400">*</span>
                      <button type="button" onClick={() => setUsername(generateUsername(fullName || "client"))} className="mr-2 text-[10px] text-black/30 hover:text-black/60 underline">توليد تلقائي</button>
                    </label>
                    <div className="relative">
                      <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                      <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))} placeholder="client123" dir="ltr" className="w-full h-11 pr-10 pl-4 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm font-mono outline-none focus:border-black/25 transition-colors" data-testid="input-client-username" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">كلمة المرور <span className="text-red-400">*</span>
                      <button type="button" onClick={() => setPassword(generatePassword())} className="mr-2 text-[10px] text-black/30 hover:text-black/60"><RefreshCw className="inline w-2.5 h-2.5 ml-0.5" /> توليد جديد</button>
                    </label>
                    <div className="relative">
                      <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                      <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} dir="ltr" className="w-full h-11 pr-10 pl-20 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm font-mono outline-none focus:border-black/25 transition-colors" data-testid="input-client-password" />
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <button type="button" onClick={() => setShowPw(!showPw)} className="p-1 text-black/20 hover:text-black/50">{showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                        <button type="button" onClick={copyPassword} className="p-1 text-black/20 hover:text-black/50">{copiedPw ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}</button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">نوع النشاط</label>
                    <select value={businessType} onChange={e => setBusinessType(e.target.value)} className="w-full h-11 px-4 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25 transition-colors appearance-none" data-testid="select-business-type">
                      <option value="">اختر نوع النشاط</option>
                      {BUSINESS_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">الدولة</label>
                    <select value={country} onChange={e => setCountry(e.target.value)} className="w-full h-11 px-4 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25 transition-colors appearance-none" data-testid="select-country">
                      {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-6">
                  <Button onClick={() => { if (!clientValid) { toast({ title: "أكمل الحقول المطلوبة", variant: "destructive" }); return; } setStep("order"); }} className="bg-black hover:bg-black/80 text-white rounded-xl px-8 h-11 font-bold text-sm gap-2" data-testid="button-next-order">
                    التالي: تفاصيل الطلب <ArrowLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════ STEP: CLIENT — Existing ════ */}
          {step === "client" && mode === "existing" && (
            <motion.div key="client-existing" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
              <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center"><Users className="w-4 h-4 text-white" /></div>
                  <div>
                    <h2 className="font-bold text-black text-base">اختر عميلاً</h2>
                    <p className="text-black/35 text-xs">ابحث أو تصفّح القائمة واضغط على العميل لتحديده</p>
                  </div>
                </div>

                {/* Selected client banner */}
                {selectedClient && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-4 bg-black text-white rounded-xl p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-black">
                      {(selectedClient.fullName || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{selectedClient.fullName}</p>
                      <p className="text-white/50 text-xs truncate">{selectedClient.email}{selectedClient.phone ? ` · ${selectedClient.phone}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <button onClick={() => setSelectedClient(null)}
                        className="text-white/30 hover:text-white/70 transition-colors"
                        data-testid="button-clear-client">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Search box */}
                <div ref={searchRef} className="relative mb-4">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                  <input
                    value={clientSearch}
                    onChange={e => { setClientSearch(e.target.value); setSelectedClient(null); }}
                    placeholder="ابحث بالاسم أو البريد أو الجوال..."
                    className="w-full h-11 pr-10 pl-10 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25 transition-colors"
                    data-testid="input-search-client"
                  />
                  {searchLoading
                    ? <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 animate-spin" />
                    : clientSearch && <button onClick={() => setClientSearch("")} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/20 hover:text-black/50"><X className="w-4 h-4" /></button>
                  }
                </div>

                {/* Client grid */}
                <div className="max-h-72 overflow-y-auto rounded-xl border border-black/[0.06] divide-y divide-black/[0.04]">
                  {searchLoading && clientList.length === 0 ? (
                    <div className="py-8 text-center">
                      <Loader2 className="w-5 h-5 animate-spin text-black/20 mx-auto" />
                    </div>
                  ) : clientList.length === 0 ? (
                    <div className="py-10 text-center">
                      <Users className="w-8 h-8 text-black/10 mx-auto mb-2" />
                      <p className="text-sm text-black/30">
                        {clientSearch.trim().length >= 2 ? "لم يُعثر على عميل بهذا البحث" : "لا يوجد عملاء مسجلون بعد"}
                      </p>
                    </div>
                  ) : clientList.map((c: any) => {
                    const isSelected = selectedClient?.id === c.id;
                    return (
                      <button key={c.id}
                        onClick={() => setSelectedClient(isSelected ? null : c)}
                        className={`w-full text-right px-4 py-3 flex items-center gap-3 transition-all ${isSelected ? "bg-black/[0.04]" : "hover:bg-black/[0.02]"}`}
                        data-testid={`client-row-${c.id}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black transition-all ${isSelected ? "bg-black text-white" : "bg-black/[0.06] text-black/50"}`}>
                          {(c.fullName || c.username || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm truncate ${isSelected ? "text-black" : "text-black/80"}`}>
                            {c.fullName || c.username}
                          </p>
                          <p className="text-xs text-black/35 truncate">
                            {c.email}{c.phone ? ` · ${c.phone}` : ""}{c.businessType ? ` · ${c.businessType}` : ""}
                          </p>
                        </div>
                        {isSelected
                          ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                          : <div className="w-5 h-5 rounded-full border-2 border-black/10 flex-shrink-0" />
                        }
                      </button>
                    );
                  })}
                </div>

                {clientList.length > 0 && (
                  <p className="text-[11px] text-black/25 mt-2 text-center">
                    {clientSearch.trim().length >= 2
                      ? `${clientList.length} نتيجة`
                      : `آخر ${clientList.length} عميل مسجل`}
                  </p>
                )}

                <div className="mt-5">
                  <Button
                    onClick={() => { if (!selectedClient) { toast({ title: "يجب تحديد عميل أولاً", variant: "destructive" }); return; } setStep("order"); }}
                    disabled={!selectedClient}
                    className="bg-black hover:bg-black/80 text-white rounded-xl px-8 h-11 font-bold text-sm gap-2 disabled:opacity-40"
                    data-testid="button-next-order-existing">
                    التالي: تفاصيل الطلب <ArrowLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════ STEP: ORDER ════ */}
          {step === "order" && (
            <motion.div key="order" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }} className="space-y-4">

              {/* Client summary */}
              <div className="bg-black text-white rounded-2xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0"><User className="w-4 h-4 text-white" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{mode === "new" ? fullName : selectedClient?.fullName}</p>
                  <p className="text-white/40 text-xs truncate">{mode === "new" ? email : selectedClient?.email}</p>
                </div>
                <button onClick={() => setStep("client")} className="text-white/30 hover:text-white/60 transition-colors text-xs flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5" /> تعديل
                </button>
              </div>

              {/* ── Pricing Plans ── */}
              {pricingPlans.length > 0 && (
                <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-black/30" />
                      <span className="text-sm font-bold text-black">الباقات المتاحة</span>
                    </div>
                    <div className="flex gap-1 bg-black/[0.04] rounded-lg p-1">
                      {Object.entries(BILLING_LABELS).map(([key, label]) => (
                        <button key={key} onClick={() => setSelectedBilling(key)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${selectedBilling === key ? "bg-black text-white" : "text-black/40 hover:text-black/70"}`}
                          data-testid={`billing-${key}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {pricingPlans.map((plan: any) => {
                      const price = getPlanPrice(plan);
                      const planId = `plan-${plan.id || plan._id}-${selectedBilling}`;
                      const selected = selectedItems.some(s => s.id === planId);
                      const IconComp = PLAN_ICONS[plan.icon] || Package;
                      const segLabel = SEGMENT_LABELS[plan.segment] || plan.segment || "";
                      const tierLabel = TIER_LABELS[plan.tier] || plan.tier || "";
                      return (
                        <button key={plan.id || plan._id} onClick={() => selectPlan(plan)}
                          className={`flex flex-col p-4 rounded-xl border-2 text-right transition-all ${selected ? "border-black bg-black text-white" : "border-black/[0.08] hover:border-black/25 bg-white"}`}
                          data-testid={`plan-${plan.id || plan._id}`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selected ? "bg-white/20" : "bg-black/[0.05]"}`}>
                              <IconComp className={`w-4 h-4 ${selected ? "text-white" : "text-black/60"}`} />
                            </div>
                            {selected && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                          <p className={`font-black text-sm ${selected ? "text-white" : "text-black"}`}>{plan.nameAr || plan.name}</p>
                          {(segLabel || tierLabel) && (
                            <p className={`text-[10px] mt-0.5 ${selected ? "text-white/40" : "text-black/25"}`}>
                              {[segLabel, tierLabel].filter(Boolean).join(" · ")}
                            </p>
                          )}
                          {price !== null ? (
                            <p className={`text-xs mt-1.5 font-semibold ${selected ? "text-white/80" : "text-black/70"}`}>
                              {price === 0 ? "مجاني" : `${price.toLocaleString()} ر.س`}
                              <span className={`font-normal text-[10px] mr-1 ${selected ? "text-white/40" : "text-black/30"}`}>
                                / {BILLING_LABELS[selectedBilling]}
                              </span>
                            </p>
                          ) : (
                            <p className={`text-[11px] mt-1.5 ${selected ? "text-white/40" : "text-black/25"}`}>لا سعر لهذه الفترة</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Products / Devices ── */}
              {products.length > 0 && (
                <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Smartphone className="w-4 h-4 text-black/30" />
                    <span className="text-sm font-bold text-black">الأجهزة والمنتجات</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {products.map((prod: any) => {
                      const prodId = `prod-${prod.id || prod._id}`;
                      const selected = selectedItems.some(s => s.id === prodId);
                      return (
                        <button key={prod.id || prod._id} onClick={() => selectProduct(prod)}
                          className={`flex flex-col p-3.5 rounded-xl border-2 text-right transition-all ${selected ? "border-black bg-black text-white" : "border-black/[0.08] hover:border-black/25 bg-white"}`}
                          data-testid={`product-${prod.id || prod._id}`}>
                          {prod.imageUrl && <img src={prod.imageUrl} alt={prod.nameAr || prod.name} className="w-full h-24 object-cover rounded-lg mb-2" />}
                          <p className={`font-bold text-xs ${selected ? "text-white" : "text-black"}`}>{prod.nameAr || prod.name}</p>
                          {prod.price != null && <p className={`text-[11px] mt-0.5 ${selected ? "text-white/60" : "text-black/40"}`}>{prod.price.toLocaleString()} ر.س</p>}
                          {selected && <CheckCircle2 className="w-3.5 h-3.5 text-white mt-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Extra Addons ── */}
              {extraAddons.length > 0 && (
                <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <PlusCircle className="w-4 h-4 text-black/30" />
                    <span className="text-sm font-bold text-black">الإضافات المتاحة</span>
                    <span className="text-[11px] text-black/25 mr-auto">اضغط لإضافتها للطلب</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {extraAddons.map((addon: any) => {
                      const addonId = `addon-${addon.id || addon._id}`;
                      const selected = selectedItems.some(s => s.id === addonId);
                      const IconComp = ADDON_ICONS[addon.icon] || PlusCircle;
                      return (
                        <button
                          key={addon.id || addon._id}
                          onClick={() => toggleItem({ id: addonId, name: addon.name, nameAr: addon.nameAr || addon.name, price: addon.price || 0, type: "addon" })}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-right transition-all ${selected ? "border-black bg-black text-white" : "border-black/[0.08] hover:border-black/25 bg-white"}`}
                          data-testid={`addon-${addon.id || addon._id}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? "bg-white/20" : "bg-black/[0.05]"}`}>
                            <IconComp className={`w-4 h-4 ${selected ? "text-white" : "text-black/50"}`} />
                          </div>
                          <div className="flex-1 min-w-0 text-right">
                            <p className={`font-semibold text-xs truncate ${selected ? "text-white" : "text-black"}`}>{addon.nameAr || addon.name}</p>
                            {addon.price > 0 && (
                              <p className={`text-[11px] ${selected ? "text-white/60" : "text-black/40"}`}>{addon.price.toLocaleString()} ر.س</p>
                            )}
                          </div>
                          {selected && <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Order Details ── */}
              <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-black/30" />
                  <span className="text-sm font-bold text-black">تفاصيل إضافية</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">نوع المشروع</label>
                    <select value={projectType} onChange={e => setProjectType(e.target.value)} className="w-full h-11 px-4 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25 appearance-none" data-testid="select-project-type">
                      <option value="">اختر نوع المشروع</option>
                      {PROJECT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-black/50 block mb-1.5">القطاع</label>
                    <select value={sector} onChange={e => setSector(e.target.value)} className="w-full h-11 px-4 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25 appearance-none" data-testid="select-sector">
                      <option value="">اختر القطاع</option>
                      {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-black/50 block mb-1.5">فكرة / وصف المشروع</label>
                  <textarea value={idea} onChange={e => setIdea(e.target.value)} rows={3} placeholder="اكتب وصفاً مختصراً للمشروع..." className="w-full px-4 py-3 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25 resize-none transition-colors" data-testid="input-idea" />
                </div>

                {/* Custom service */}
                <div>
                  <label className="text-xs font-semibold text-black/50 block mb-1.5">إضافة خدمة / بند مخصص</label>
                  <div className="flex gap-2">
                    <input value={customItem} onChange={e => setCustomItem(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }} placeholder="اكتب بنداً ثم اضغط إضافة..." className="flex-1 h-10 px-4 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25" data-testid="input-custom-item" />
                    <Button type="button" onClick={addCustom} variant="outline" size="sm" className="h-10 px-4 gap-1" data-testid="button-add-custom">
                      <Plus className="w-3.5 h-3.5" /> إضافة
                    </Button>
                  </div>
                </div>

                {/* Selected items summary */}
                {selectedItems.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-black/50 mb-2">العناصر المحددة ({selectedItems.length})</p>
                    <div className="space-y-1.5">
                      {selectedItems.map(item => (
                        <div key={item.id} className="flex items-center gap-2 bg-black/[0.02] rounded-lg px-3 py-2">
                          <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${item.type === "plan" ? "bg-purple-100" : item.type === "product" ? "bg-blue-100" : item.type === "addon" ? "bg-green-100" : "bg-gray-100"}`}>
                            {item.type === "plan" ? <Crown className="w-3 h-3 text-purple-600" /> : item.type === "product" ? <Smartphone className="w-3 h-3 text-blue-600" /> : item.type === "addon" ? <PlusCircle className="w-3 h-3 text-green-600" /> : <Tag className="w-3 h-3 text-gray-500" />}
                          </div>
                          <span className="flex-1 text-xs text-black font-medium truncate">{item.nameAr || item.name}</span>
                          {item.price != null && item.price > 0 && <span className="text-xs text-black/40 font-mono flex-shrink-0">{item.price.toLocaleString()} ر.س</span>}
                          <button onClick={() => removeItem(item.id)} className="text-black/20 hover:text-red-500 transition-colors flex-shrink-0" data-testid={`remove-item-${item.id}`}>
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total + Discount */}
                {(() => {
                  const base = totalAmount ? Number(totalAmount) : autoTotal;
                  const discount = calcDiscount(base);
                  const finalTotal = Math.max(0, base - discount);
                  return (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-black/50 block mb-1.5">
                          المبلغ الإجمالي (ر.س)
                          {autoTotal > 0 && !totalAmount && <span className="mr-2 text-black/30">محسوب تلقائياً: {autoTotal.toLocaleString()} ر.س</span>}
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                          <input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder={autoTotal > 0 ? String(autoTotal) : "0"} min="0" className="w-full h-11 pr-10 pl-4 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25 font-mono" data-testid="input-total-amount" />
                        </div>
                      </div>

                      {/* Discount */}
                      <div>
                        <label className="text-xs font-semibold text-black/50 block mb-1.5 flex items-center gap-1.5">
                          <Scissors className="w-3.5 h-3.5" /> خصم على الطلب (اختياري)
                        </label>
                        <div className="flex gap-2">
                          <div className="flex bg-black/[0.04] rounded-xl p-1 shrink-0">
                            <button
                              onClick={() => setDiscountType("fixed")}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${discountType === "fixed" ? "bg-black text-white" : "text-black/40 hover:text-black/70"}`}
                              data-testid="discount-type-fixed">
                              ر.س
                            </button>
                            <button
                              onClick={() => setDiscountType("percent")}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${discountType === "percent" ? "bg-black text-white" : "text-black/40 hover:text-black/70"}`}
                              data-testid="discount-type-percent">
                              <Percent className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="relative flex-1">
                            <Scissors className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                            <input
                              type="number" value={discountValue}
                              onChange={e => setDiscountValue(e.target.value)}
                              placeholder={discountType === "percent" ? "مثال: 10" : "مثال: 500"}
                              min="0" max={discountType === "percent" ? "100" : undefined}
                              className="w-full h-11 pr-10 pl-4 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25 font-mono"
                              data-testid="input-discount-value"
                            />
                          </div>
                        </div>
                        {discount > 0 && base > 0 && (
                          <div className="mt-2 flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                            <div className="text-xs text-green-700">
                              <span className="font-semibold">{base.toLocaleString()} ر.س</span>
                              <span className="mx-1.5 text-green-400">−</span>
                              <span className="font-semibold text-red-500">{discount.toLocaleString()} ر.س خصم</span>
                            </div>
                            <div className="text-sm font-black text-green-800">
                              = {finalTotal.toLocaleString()} ر.س
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <label className="text-xs font-semibold text-black/50 block mb-1.5">ملاحظات داخلية</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="ملاحظات تظهر للفريق فقط..." className="w-full px-4 py-3 border border-black/[0.08] bg-black/[0.01] rounded-xl text-sm outline-none focus:border-black/25 resize-none" data-testid="input-notes" />
                </div>
              </div>

              {/* Submit */}
              <Button onClick={handleSubmit} disabled={isPending} className="w-full bg-black hover:bg-black/80 text-white rounded-xl h-12 font-bold text-sm gap-2 shadow-lg" data-testid="button-submit-order">
                {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإنشاء...</> : <><CheckCircle2 className="w-4 h-4" /> {mode === "new" ? "إنشاء العميل والطلب" : "إنشاء الطلب"}</>}
              </Button>
            </motion.div>
          )}

          {/* ════ STEP: DONE ════ */}
          {step === "done" && result && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
              <div className="bg-white border border-black/[0.06] rounded-2xl p-8 text-center shadow-sm">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-black text-black mb-1">تم بنجاح!</h2>
                <p className="text-black/40 text-sm mb-6">{mode === "new" ? "تم إنشاء حساب العميل والطلب وإرسال بيانات الدخول بالبريد" : "تم إنشاء الطلب وإرسال تأكيد للعميل"}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-right">
                  <div className="bg-black/[0.02] rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-black/30 uppercase tracking-wider mb-1">العميل</p>
                    <p className="font-bold text-sm text-black">{result.client.fullName}</p>
                    <p className="text-xs text-black/40">{result.client.email}</p>
                    {result.client.username && <p className="text-xs text-black/30 font-mono mt-0.5">@{result.client.username}</p>}
                  </div>
                  {result.order && (
                    <div className="bg-black/[0.02] rounded-xl p-4">
                      <p className="text-[10px] font-semibold text-black/30 uppercase tracking-wider mb-1">رقم الطلب</p>
                      <p className="font-mono font-bold text-sm text-black">#{String(result.order.id).slice(-8).toUpperCase()}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => { setStep("client"); setResult(null); setSelectedItems([]); setTotalAmount(""); setIdea(""); setNotes(""); setProjectType(""); setSector(""); setDiscountValue(""); setDiscountType("fixed"); if (mode === "new") { setFullName(""); setEmail(""); setPhone(""); setUsername(""); setPassword(generatePassword()); } else { setSelectedClient(null); setClientSearch(""); } }} variant="outline" className="rounded-xl gap-2">
                    <Plus className="w-4 h-4" /> طلب جديد
                  </Button>
                  <Link href="/admin/orders">
                    <Button className="bg-black text-white rounded-xl gap-2">
                      <FileText className="w-4 h-4" /> عرض الطلبات
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
