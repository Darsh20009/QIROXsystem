import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, CheckCircle, ArrowLeft, ArrowRight, Check,
  Upload, X, FileText, Image, Film, CreditCard,
  Globe, Store, GraduationCap, UtensilsCrossed, Building2,
  Dumbbell, Zap, Star, Package, BarChart, Shield, Sparkles,
  Copy, ClipboardCheck, Lock, Plus, Minus,
  ShoppingCart, BadgeCheck, Crown, Layers, Smartphone, Map,
  Infinity as InfinityIcon, Wallet, BanknoteIcon, Hash, LayoutGrid
} from "lucide-react";
import SARIcon from "@/components/SARIcon";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

const DEFAULT_BANK = { bankName: "بنك الراجحي", beneficiaryName: "QIROX Studio", iban: "SA0380205098017222121010", notes: "" };

interface UploadedFile { url: string; filename: string; size: number; }

function FileUploadField({ label, field, files, onUpload, onRemove, required }: {
  label: string; field: string; files: UploadedFile[];
  onUpload: (field: string, file: File) => void;
  onRemove: (field: string, index: number) => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); await onUpload(field, file); setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };
  const getIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return <Image className="w-4 h-4 text-blue-500" />;
    if (['mp4','mov','avi'].includes(ext)) return <Film className="w-4 h-4 text-purple-500" />;
    return <FileText className="w-4 h-4 text-green-500" />;
  };
  const fmtSize = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;
  return (
    <div>
      <PageGraphics variant="minimal" />
      <Label className="text-sm mb-2 block text-black/60 font-semibold">{label}{required && <span className="text-red-400 mr-1">*</span>}</Label>
      <div onClick={() => !uploading && inputRef.current?.click()}
        className="border-2 border-dashed border-black/[0.08] rounded-2xl p-5 text-center cursor-pointer hover:border-black/25 hover:bg-black/[0.01] transition-all group" data-testid={`upload-${field}`}>
        <input ref={inputRef} type="file" className="hidden" onChange={handleChange}
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar" />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="w-5 h-5 animate-spin text-black/40" />
            <span className="text-sm text-black/40">جاري الرفع...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <div className="w-10 h-10 rounded-xl bg-black/[0.04] flex items-center justify-center group-hover:bg-black/[0.07] transition-colors">
              <Upload className="w-4 h-4 text-black/25" />
            </div>
            <span className="text-xs text-black/35">اضغط لرفع ملف</span>
          </div>
        )}
      </div>
      {files.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {files.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 bg-black/[0.03] rounded-xl px-3 py-2.5 border border-black/[0.06]">
              {getIcon(f.filename)}
              <span className="text-xs text-black/60 flex-1 truncate">{f.filename}</span>
              <span className="text-[10px] text-black/25">{fmtSize(f.size)}</span>
              <button onClick={() => onRemove(field, i)} className="text-red-400/60 hover:text-red-500 transition-colors" data-testid={`remove-file-${field}-${i}`}>
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

const ICON_MAP: Record<string, any> = {
  Star, Shield, Zap, Globe, Package, Crown, Layers, Smartphone, BarChart, BadgeCheck, CheckCircle, Sparkles, Check
};
function FeatureIcon({ name }: { name: string }) {
  const I = ICON_MAP[name] || Check;
  return <I className="w-3.5 h-3.5 shrink-0" />;
}

const SECTOR_META: Record<string, { label: string; icon: any; color: string }> = {
  restaurant:    { label: "مطاعم وكافيهات",    icon: UtensilsCrossed, color: "from-orange-400 to-red-500" },
  food:          { label: "مطاعم وكافيهات",    icon: UtensilsCrossed, color: "from-orange-400 to-red-500" },
  store:         { label: "متاجر إلكترونية",   icon: Store,           color: "from-blue-400 to-cyan-500" },
  ecommerce:     { label: "متاجر إلكترونية",   icon: Store,           color: "from-blue-400 to-cyan-500" },
  commerce:      { label: "متاجر إلكترونية",   icon: Store,           color: "from-blue-400 to-cyan-500" },
  education:     { label: "تعليم وأكاديميات",  icon: GraduationCap,   color: "from-violet-400 to-purple-500" },
  fitness:       { label: "لياقة وجيم",        icon: Dumbbell,        color: "from-green-400 to-emerald-500" },
  health:        { label: "صحة ولياقة",        icon: Dumbbell,        color: "from-green-400 to-emerald-500" },
  healthcare:    { label: "صحة وعيادات",       icon: Sparkles,        color: "from-rose-400 to-pink-500" },
  realestate:    { label: "عقارات",            icon: Building2,       color: "from-teal-400 to-emerald-500" },
  beauty:        { label: "تجميل وصالونات",   icon: Sparkles,        color: "from-pink-400 to-fuchsia-500" },
  tech:          { label: "تقنية وبرمجة",     icon: Globe,           color: "from-blue-400 to-indigo-500" },
  corporate:     { label: "شركات ومؤسسات",    icon: Building2,       color: "from-slate-400 to-gray-500" },
  institutional: { label: "مؤسسات وجمعيات",   icon: Building2,       color: "from-slate-400 to-gray-600" },
  personal:      { label: "خدمات شخصية",      icon: Globe,           color: "from-purple-400 to-indigo-500" },
  other:         { label: "شركات ومؤسسات",    icon: Globe,           color: "from-slate-400 to-gray-600" },
  general:       { label: "عام",               icon: Globe,           color: "from-slate-400 to-gray-600" },
};

const VISUAL_STYLES = [
  { value: "luxury",  label: "فاخر وراقي",   desc: "أسود، ذهبي، رمادي داكن", icon: Crown,     color: "from-yellow-500 to-amber-600" },
  { value: "modern",  label: "حديث ونظيف",   desc: "أبيض، رمادي، أزرق فاتح", icon: Sparkles,  color: "from-blue-400 to-cyan-500" },
  { value: "bold",    label: "جريء وملفت",   desc: "ألوان زاهية وجريئة",     icon: Zap,       color: "from-orange-400 to-red-500" },
  { value: "minimal", label: "مينيمال",      desc: "قليل الألوان، واضح",      icon: Layers,    color: "from-slate-400 to-gray-600" },
  { value: "classic", label: "كلاسيكي",      desc: "بيج، بني، طابع تراثي",    icon: Star,      color: "from-amber-400 to-orange-500" },
  { value: "custom",  label: "حسب هويتي",   desc: "ألواني وخطوطي الخاصة",   icon: Globe,     color: "from-violet-400 to-purple-500" },
];

const TIER_VISUAL: Record<string, {
  label: string; icon: any; headerGrad: string; cardGrad: string;
  glow: string; border: string; isDark?: boolean; badge?: string;
}> = {
  lite: {
    label: "لايت", icon: Zap,
    headerGrad: "from-teal-400 to-emerald-500",
    cardGrad: "from-teal-50/80 to-white dark:from-teal-950/30 dark:to-gray-900",
    glow: "shadow-teal-200/50 dark:shadow-teal-900/50",
    border: "border-teal-200/60 dark:border-teal-800/40",
  },
  pro: {
    label: "برو", icon: Star,
    headerGrad: "from-violet-500 to-purple-600",
    cardGrad: "from-violet-50/80 to-white dark:from-violet-950/30 dark:to-gray-900",
    glow: "shadow-violet-300/50 dark:shadow-violet-900/50",
    border: "border-violet-300/70 dark:border-violet-700/50",
    badge: "الأكثر طلباً",
  },
  infinite: {
    label: "إنفينتي", icon: InfinityIcon, isDark: true,
    headerGrad: "from-gray-700 to-black",
    cardGrad: "from-gray-950 to-gray-900",
    glow: "shadow-black/40",
    border: "border-white/10",
  },
};

const BUNDLE_ICONS: Record<string, any> = { lite: Zap, pro: Crown, infinite: InfinityIcon, custom: LayoutGrid };
const BUNDLE_COLORS: Record<string, string> = { lite: "from-teal-400 to-emerald-500", pro: "from-violet-500 to-purple-600", infinite: "from-gray-700 to-black", custom: "from-blue-400 to-indigo-500" };

const STEP_CONFIG = [
  { label: "الباقة",       labelEn: "Package",  icon: Crown },
  { label: "الإضافات",     labelEn: "Add-ons",  icon: Plus },
  { label: "تفاصيل الموقع",labelEn: "Details",  icon: Globe },
  { label: "الأجهزة",      labelEn: "Devices",  icon: Package },
  { label: "الدفع",        labelEn: "Payment",  icon: CreditCard },
];

const PLAN_LABELS: Record<string, string>  = { lite: "لايت", pro: "برو", infinite: "إنفينتي" };
const SEGMENT_LABELS: Record<string, string> = {
  restaurant: "مطاعم ومقاهي", ecommerce: "متاجر إلكترونية",
  education: "منصات تعليمية", corporate: "شركات ومؤسسات",
  realestate: "عقارات",       healthcare: "صحة وعيادات",
};
const PERIOD_LABELS: Record<string, string> = { monthly: "شهري", sixmonth: "نصف سنوي", annual: "سنوي", lifetime: "مدى الحياة" };

/* ── Animated progress stepper ── */
function StepIndicator({ step, lang }: { step: number; lang: string }) {
  return (
    <div className="relative flex items-center justify-between mb-12">
      {/* Connecting line */}
      <div className="absolute top-5 right-0 left-0 h-0.5 bg-black/[0.06] dark:bg-white/[0.06] mx-10" />
      <motion.div
        className="absolute top-5 h-0.5 bg-gradient-to-r from-black to-black/60 dark:from-white dark:to-white/60"
        style={{ right: 40, left: "auto" }}
        initial={{ width: "0%" }}
        animate={{ width: `${((step - 1) / 4) * (100 - 0)}%` }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
      {STEP_CONFIG.map((s, idx) => {
        const n = idx + 1;
        const completed = step > n;
        const active = step === n;
        return (
          <div key={idx} className="flex flex-col items-center gap-2 relative z-10">
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-400 ${
              completed
                ? "border-transparent bg-black dark:bg-white shadow-lg"
                : active
                ? "border-black dark:border-white bg-white dark:bg-gray-950 shadow-lg ring-4 ring-black/10 dark:ring-white/10"
                : "border-black/12 dark:border-white/12 bg-white dark:bg-gray-950"
            }`}>
              <AnimatePresence mode="wait">
                {completed ? (
                  <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Check className="w-4 h-4 text-white dark:text-black" />
                  </motion.div>
                ) : (
                  <motion.div key="icon" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <s.icon className={`w-4 h-4 ${active ? "text-black dark:text-white" : "text-black/20 dark:text-white/20"}`} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <span className={`text-[10px] font-bold hidden sm:block whitespace-nowrap ${
              active ? "text-black dark:text-white" : "text-black/30 dark:text-white/30"
            }`}>
              {lang === "ar" ? s.label : s.labelEn}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderFlow() {
  const { lang, dir } = useI18n();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const planFromUrl    = searchParams.get("plan") || "";
  const segmentFromUrl = searchParams.get("segment") || "";
  const periodFromUrl  = searchParams.get("period") || "";
  const priceFromUrl   = parseInt(searchParams.get("price") || "0");

  const SEG_LABELS_TR: Record<string, string> = {
    restaurant: lang === "ar" ? "مطاعم ومقاهي"   : "Restaurants & Cafes",
    ecommerce:  lang === "ar" ? "متاجر إلكترونية" : "E-Commerce",
    education:  lang === "ar" ? "منصات تعليمية"   : "Education Platforms",
    corporate:  lang === "ar" ? "شركات ومؤسسات"   : "Corporate",
    realestate: lang === "ar" ? "عقارات"           : "Real Estate",
    healthcare: lang === "ar" ? "صحة وعيادات"      : "Health & Clinics",
  };
  const PERIOD_LABELS_TR: Record<string, string> = {
    monthly: lang==="ar"?"شهري":"Monthly", sixmonth: lang==="ar"?"نصف سنوي":"6 Months",
    annual:  lang==="ar"?"سنوي":"Yearly",  lifetime: lang==="ar"?"مدى الحياة":"Lifetime",
  };
  const PLAN_DESC_TR: Record<string, string> = {
    lite:     lang==="ar" ? "الباقة الأساسية لكل ما تحتاجه للبداية"    : "Basic package for getting started",
    pro:      lang==="ar" ? "الباقة المتكاملة للأعمال المتنامية"         : "Complete package for growing businesses",
    infinite: lang==="ar" ? "الباقة الشاملة بلا حدود وبميزات حصرية"   : "Unlimited comprehensive package",
  };

  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: user, isLoading: isUserLoading } = useUser();

  const { data: systemFeatures = [] } = useQuery<any[]>({ queryKey: ["/api/system-features"] });
  // extraAddons will be re-fetched reactively after state changes via the invalidation in toggleAddon
  // Initial fetch uses URL params; after mount the query key includes state values
  const [_addonSegment, setAddonSegment] = useState(segmentFromUrl || "");
  const [_addonPlan, setAddonPlan]       = useState(planFromUrl || "pro");
  const { data: extraAddons = [] } = useQuery<any[]>({
    queryKey: ["/api/extra-addons", _addonSegment, _addonPlan],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (_addonSegment) params.set("segment", _addonSegment);
      if (_addonPlan)    params.set("plan", _addonPlan);
      const res = await fetch(`/api/extra-addons?${params}`, { credentials: "include" });
      return res.json();
    },
  });
  const { data: products = [] }       = useQuery<any[]>({ queryKey: ["/api/products"] });
  const { data: sectorTemplates = [] } = useQuery<any[]>({ queryKey: ["/api/templates"], staleTime: 5 * 60 * 1000 });

  const sectors = useMemo(() => {
    const seen = new Set<string>();
    const seenLabels = new Set<string>();
    const result: { value: string; label: string; icon: any; color: string }[] = [];
    const ordered = [...sectorTemplates].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    for (const t of ordered) {
      const rawKey = (t.category || t.sector || "").trim();
      if (!rawKey) continue;
      const meta = SECTOR_META[rawKey] ?? { label: t.nameAr?.trim() || rawKey, icon: Globe, color: "from-slate-400 to-gray-600" };
      if (seen.has(rawKey) || seenLabels.has(meta.label)) continue;
      seen.add(rawKey);
      seenLabels.add(meta.label);
      result.push({ value: rawKey, label: meta.label, icon: meta.icon, color: meta.color });
    }
    if (result.length === 0) {
      return Object.entries(SECTOR_META).slice(0, 8).map(([k, v]) => ({ value: k, label: v.label, icon: v.icon, color: v.color }));
    }
    return result;
  }, [sectorTemplates]);
  const { data: bankSettings }        = useQuery<typeof DEFAULT_BANK>({ queryKey: ["/api/bank-settings"] });
  const bank = bankSettings || DEFAULT_BANK;
  const { data: walletData }          = useQuery<{ totalDebit: number; totalCredit: number; outstanding: number }>({
    queryKey: ["/api/wallet"], enabled: !!user,
  });

  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan]   = useState<string>(planFromUrl || "pro");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [deviceCart, setDeviceCart]       = useState<Record<string, number>>({});
  const [deviceBundles, setDeviceBundles] = useState<Record<string, number>>({});
  const [submittedOrder, setSubmittedOrder] = useState<{ id: string; amount: number; walletUsed?: number } | null>(null);
  const [postProofFiles, setPostProofFiles] = useState<UploadedFile[]>([]);
  const [copiedIban, setCopiedIban]       = useState(false);
  const [useWallet, setUseWallet]         = useState(false);
  const [walletAmount, setWalletAmount]   = useState(0);
  const [usePaymob, setUsePaymob]         = useState(false);

  const [formData, setFormData] = useState({
    businessName: "", phone: "", sector: segmentFromUrl || "", visualStyle: "", siteLanguage: "ar",
    whatsappIntegration: false, socialIntegration: false,
    hasLogo: false, needsLogoDesign: false, requiredFunctions: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile[]>>({
    logo: [], brandIdentity: [], content: [], paymentProof: [],
  });

  const [otpDigits, setOtpDigits]         = useState<string[]>(["","","","","",""]);
  const [verifyError, setVerifyError]     = useState("");
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/auth/verify-email", { email: (user as any)?.email, code });
      if (!res.ok) throw new Error("invalid");
      return res.json();
    },
    onSuccess: () => { setVerifySuccess(true); qc.invalidateQueries({ queryKey: ["/api/user"] }); },
    onError: () => setVerifyError("الرمز غير صحيح أو انتهت صلاحيته"),
  });
  const resendMutation = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/auth/resend-verification", { email: (user as any)?.email })).json(),
    onSuccess: () => { setResendCountdown(60); setVerifyError(""); setOtpDigits(["","","","","",""]); },
  });
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  // Sync addon filter when sector or plan changes
  useEffect(() => { if (formData.sector) setAddonSegment(formData.sector); }, [formData.sector]);
  useEffect(() => { if (selectedPlan)    setAddonPlan(selectedPlan); }, [selectedPlan]);

  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g,"").slice(-1);
    const next = [...otpDigits]; next[i] = digit; setOtpDigits(next); setVerifyError("");
    if (digit && i < 5) setTimeout(() => otpRefs.current[i+1]?.focus(), 10);
    if (next.every(d => d !== "")) verifyMutation.mutate(next.join(""));
  };
  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[i] && i > 0) otpRefs.current[i-1]?.focus();
  };

  const handleFileUpload = async (field: string, file: File) => {
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (data.url) setUploadedFiles(prev => ({ ...prev, [field]: [...(prev[field]||[]), { url: data.url, filename: file.name, size: file.size }] }));
    } catch { toast({ title: "فشل رفع الملف", variant: "destructive" }); }
  };
  const handleFileRemove = (field: string, index: number) =>
    setUploadedFiles(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));

  const planPrice    = priceFromUrl || 0;
  const addonsTotal  = selectedAddons.reduce((sum, id) => sum + (extraAddons.find((a: any) => a.id === id)?.price || 0), 0);
  const devicesTotal = Object.entries(deviceCart).reduce((sum, [pid, qty]) => sum + ((products.find((p: any) => p.id === pid)?.price || 0) * qty), 0);
  const bundlesTotal = Object.entries(deviceBundles).reduce((sum, [pid, bidx]) => {
    const p = products.find((pr: any) => pr.id === pid);
    const bundle = p?.planBundles?.[bidx];
    if (!bundle || bundle.isFree) return sum;
    return sum + (bundle.customPrice || 0);
  }, 0);
  const paymobFee    = usePaymob && selectedPlan === "lite" ? 100 : 0;
  const grandTotal   = planPrice + addonsTotal + devicesTotal + bundlesTotal + paymobFee;

  /* wallet */
  const walletBalance = walletData ? Math.max(0, walletData.totalCredit - walletData.totalDebit) : 0;
  const maxWalletUsable = Math.min(walletBalance, grandTotal);
  const effectiveWalletAmt = useWallet ? Math.min(walletAmount, maxWalletUsable) : 0;
  const remainingAfterWallet = Math.max(0, grandTotal - effectiveWalletAmt);
  const fullyPaidByWallet = useWallet && effectiveWalletAmt >= grandTotal - 0.01;

  const submitMutation = useMutation({
    mutationFn: async () => {
      const filesStructured = Object.fromEntries(Object.entries(uploadedFiles).map(([k, f]) => [k, f.map(x => x.url).filter(Boolean)]));
      const orderDevices = Object.entries(deviceCart).filter(([,q]) => q > 0).map(([pid, qty]) => {
        const p = products.find((pr: any) => pr.id === pid);
        const bundleIdx = deviceBundles[pid];
        const bundle = (typeof bundleIdx === "number") ? p?.planBundles?.[bundleIdx] : undefined;
        return {
          id: pid, name: p?.name||"", nameAr: p?.nameAr||"", quantity: qty, price: p?.price||0,
          ...(bundle ? { bundle: { planNameAr: bundle.planNameAr, planTier: bundle.planTier, planSegment: bundle.planSegment, price: bundle.isFree ? 0 : (bundle.customPrice || 0), isFree: bundle.isFree } } : {}),
        };
      });
      const orderAddons = selectedAddons.map(id => {
        const a = extraAddons.find((ad: any) => ad.id === id);
        return { id, name: a?.name||"", nameAr: a?.nameAr||"", price: a?.price||0 };
      });
      const paymentMethod = fullyPaidByWallet ? "wallet" : effectiveWalletAmt > 0 ? "mixed" : "bank_transfer";
      const body = {
        serviceType: formData.sector || "website", planTier: selectedPlan,
        planSegment: segmentFromUrl, planPeriod: periodFromUrl, totalAmount: grandTotal,
        notes: `باقة ${PLAN_LABELS[selectedPlan]} — ${SEGMENT_LABELS[segmentFromUrl]||segmentFromUrl} — ${PERIOD_LABELS[periodFromUrl]||""}${effectiveWalletAmt > 0 ? ` — دفع بالمحفظة: ${effectiveWalletAmt} ر.س` : ""}`,
        businessName: formData.businessName, phone: formData.phone, sector: formData.sector,
        visualStyle: formData.visualStyle, siteLanguage: formData.siteLanguage,
        whatsappIntegration: formData.whatsappIntegration, socialIntegration: formData.socialIntegration,
        hasLogo: formData.hasLogo, needsLogoDesign: formData.needsLogoDesign,
        requiredFunctions: formData.requiredFunctions, files: filesStructured,
        addons: orderAddons, devices: orderDevices, paymentMethod,
        walletAmountUsed: effectiveWalletAmt > 0 ? effectiveWalletAmt : undefined,
        items: [
          { name: `Package ${PLAN_LABELS[selectedPlan]}`, nameAr: `باقة ${PLAN_LABELS[selectedPlan]}`, price: planPrice, qty: 1 },
          ...(paymobFee > 0 ? [{ name: "Paymob Payment Gateway", nameAr: "بوابة Paymob للدفع", price: paymobFee, qty: 1 }] : []),
          ...orderAddons.map(a => ({ name: a.name, nameAr: a.nameAr, price: a.price, qty: 1 })),
          ...orderDevices.flatMap(d => {
            const items = [{ name: d.name, nameAr: d.nameAr, price: d.price, qty: d.quantity }];
            if ((d as any).bundle && !(d as any).bundle.isFree && (d as any).bundle.price > 0) {
              items.push({ name: (d as any).bundle.planNameAr, nameAr: (d as any).bundle.planNameAr, price: (d as any).bundle.price, qty: 1 });
            }
            return items;
          }),
        ],
      };
      const orderRes = await apiRequest("POST", "/api/orders", body);
      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || err.message || "فشل إرسال الطلب");
      }
      const orderData = await orderRes.json();
      if (effectiveWalletAmt > 0) {
        qc.invalidateQueries({ queryKey: ["/api/wallet"] });
      }
      return { ...orderData, walletUsed: effectiveWalletAmt };
    },
    onSuccess: (data) => {
      setSubmittedOrder({ id: data.id || data._id, amount: grandTotal, walletUsed: data.walletUsed || 0 });
      toast({ title: "تم إرسال طلبك بنجاح!" });
    },
    onError: (e: any) => toast({ title: e.message || "خطأ في إرسال الطلب", variant: "destructive" }),
  });

  const uploadProofMutation = useMutation({
    mutationFn: async ({ orderId, proofUrl }: { orderId: string; proofUrl: string }) =>
      apiRequest("PATCH", `/api/orders/${orderId}/proof`, { paymentProofUrl: proofUrl }),
    onSuccess: () => toast({ title: "تم رفع إيصال التحويل بنجاح" }),
  });

  const handleProofUpload = async (file: File) => {
    const form = new FormData(); form.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form, credentials: "include" });
      const data = await res.json();
      if (data.url && submittedOrder) {
        setPostProofFiles([{ url: data.url, filename: file.name, size: file.size }]);
        uploadProofMutation.mutate({ orderId: submittedOrder.id, proofUrl: data.url });
      }
    } catch { toast({ title: "فشل رفع الإيصال", variant: "destructive" }); }
  };

  const canNext = () => {
    if (step === 1) return !!selectedPlan;
    if (step === 3) return !!formData.businessName && !!formData.sector;
    if (step === 4) {
      const activeProducts = (products || []).filter((p: any) => p.isActive !== false);
      return Object.entries(deviceCart).every(([pid]) => {
        const p = activeProducts.find((pr: any) => pr.id === pid);
        if (!p || !Array.isArray(p.planBundles) || p.planBundles.length === 0) return true;
        return typeof deviceBundles[pid] === "number";
      });
    }
    return true;
  };
  const handleNext = () => { if (canNext()) setStep(s => s + 1); };
  const handleBack = () => setStep(s => s - 1);
  const toggleAddon = (id: string) => setSelectedAddons(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const setDeviceQty = (pid: string, delta: number) => {
    const curr = deviceCart[pid] || 0;
    const next = Math.max(0, curr + delta);
    setDeviceCart(prev => {
      const updated = { ...prev }; if (next === 0) delete updated[pid]; else updated[pid] = next; return updated;
    });
    if (next === 0) {
      setDeviceBundles(prev => { const u = { ...prev }; delete u[pid]; return u; });
    }
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  /* ── Auth Gate ── */
  if (!user) return (
    <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
      <Navigation />
      <div className="max-w-md mx-auto pt-36 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-20 h-20 bg-black dark:bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Lock className="w-9 h-9 text-white dark:text-black" />
          </div>
          <h2 className="text-2xl font-black mb-2 text-black dark:text-white">سجّل دخولك أولاً</h2>
          <p className="text-black/50 dark:text-white/50 mb-6 text-sm">يجب أن تملك حساباً لتقديم طلب</p>
          <Button onClick={() => setLocation("/login")} className="w-full h-12 rounded-xl font-bold">تسجيل الدخول</Button>
          <p className="text-sm text-black/40 dark:text-white/40 mt-4">ليس لديك حساب؟ <button onClick={() => setLocation("/register")} className="text-black dark:text-white underline font-medium">أنشئ حساباً</button></p>
        </motion.div>
      </div>
      <Footer />
    </div>
  );

  /* ── Email Verify Gate ── */
  const isVerified = (user as any).emailVerified || verifySuccess;
  if (!isVerified) return (
    <div className="min-h-screen bg-white dark:bg-gray-950" dir={dir}>
      <Navigation />
      <div className="max-w-md mx-auto pt-32 px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-black mb-2 text-black dark:text-white">فعّل بريدك الإلكتروني</h2>
          <p className="text-black/50 dark:text-white/50 text-sm">أدخل الرمز المُرسل إلى <strong>{(user as any).email}</strong></p>
        </motion.div>
        <div className="flex gap-2 justify-center mb-4" dir="ltr">
          {otpDigits.map((d, i) => (
            <input key={i} ref={el => { otpRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={d}
              onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)}
              className="w-12 h-13 text-center text-xl font-black border-2 rounded-2xl border-black/20 dark:border-white/20 focus:border-black dark:focus:border-white outline-none bg-transparent text-black dark:text-white" />
          ))}
        </div>
        {verifyError && <p className="text-red-500 text-sm text-center mb-3">{verifyError}</p>}
        {verifyMutation.isPending && <div className="flex justify-center mb-3"><Loader2 className="w-5 h-5 animate-spin" /></div>}
        <div className="text-center">
          {resendCountdown > 0
            ? <p className="text-sm text-black/40 dark:text-white/40">أعد الإرسال بعد {resendCountdown} ثانية</p>
            : <button onClick={() => resendMutation.mutate()} className="text-sm text-black dark:text-white underline">
                {resendMutation.isPending ? "جاري الإرسال..." : "أعد إرسال الرمز"}
              </button>}
        </div>
      </div>
      <Footer />
    </div>
  );

  /* ── Post-submission Success ── */
  if (submittedOrder) return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-gray-950" dir={dir}>
      <Navigation />
      <div className="max-w-xl mx-auto pt-20 px-4 pb-24">
        {/* Confetti-style success hero */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}
              className="absolute -inset-3 bg-green-400/20 rounded-full blur-xl"
            />
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/30 relative z-10">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-black dark:text-white mb-2">تم استلام طلبك!</h2>
          <p className="text-black/50 dark:text-white/50 text-sm">رقم الطلب: <span className="font-mono font-black text-black dark:text-white">{submittedOrder.id}</span></p>
        </motion.div>

        {/* Total amount card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-black dark:bg-gray-900 rounded-3xl p-6 mb-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          <p className="text-white/40 text-xs uppercase tracking-wider mb-1 relative z-10">إجمالي الطلب</p>
          <p className="text-white font-black text-4xl relative z-10 flex items-baseline gap-2">{grandTotal.toLocaleString()} <SARIcon size={20} className="opacity-50 translate-y-0.5" /></p>
          {submittedOrder?.walletUsed ? (
            <div className="mt-3 flex items-center gap-2 relative z-10">
              <div className="flex items-center gap-1.5 bg-violet-500/20 border border-violet-400/30 rounded-xl px-3 py-1.5">
                <Wallet className="w-3.5 h-3.5 text-violet-300" />
                <span className="text-violet-300 text-xs font-bold flex items-center gap-1">دُفع {submittedOrder.walletUsed.toLocaleString()} <SARIcon size={10} className="opacity-60" /> من المحفظة</span>
              </div>
              {submittedOrder.walletUsed < grandTotal && (
                <div className="text-white/40 text-xs flex items-center gap-1">المتبقي: {(grandTotal - submittedOrder.walletUsed).toLocaleString()} <SARIcon size={10} className="opacity-70" /></div>
              )}
            </div>
          ) : null}
        </motion.div>

        {/* Wallet fully paid message */}
        {submittedOrder?.walletUsed && submittedOrder.walletUsed >= grandTotal - 0.01 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-700/30 rounded-3xl p-5 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-green-700 dark:text-green-400 text-sm">تم السداد بالكامل من المحفظة الإلكترونية</p>
              <p className="text-green-600/70 dark:text-green-500/70 text-xs mt-0.5">لا يلزمك إجراء أي تحويل بنكي</p>
            </div>
          </motion.div>
        ) : (
        /* Bank card */
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-3xl border border-black/[0.07] dark:border-white/[0.07] p-6 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <BanknoteIcon className="w-4 h-4 text-white" />
            </div>
            <p className="font-black text-black dark:text-white">بيانات التحويل البنكي</p>
            {submittedOrder?.walletUsed ? (
              <span className="mr-auto text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">المبلغ المطلوب: {(grandTotal - submittedOrder.walletUsed).toLocaleString()} <SARIcon size={10} className="opacity-60" /></span>
            ) : null}
          </div>
          <div className="space-y-3 mb-4">
            {[{ label: "البنك", value: bank.bankName }, { label: "اسم المستفيد", value: bank.beneficiaryName }].map(r => (
              <div key={r.label} className="flex justify-between items-center py-2 border-b border-black/[0.04] dark:border-white/[0.04] last:border-0">
                <span className="text-xs text-black/40 dark:text-white/40">{r.label}</span>
                <span className="text-sm font-semibold text-black dark:text-white">{r.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-black/40 dark:text-white/40">IBAN</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-black dark:text-white" dir="ltr">{bank.iban}</span>
                <button onClick={() => { navigator.clipboard.writeText(bank.iban); setCopiedIban(true); setTimeout(() => setCopiedIban(false), 2500); }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${copiedIban ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-black/[0.05] dark:bg-white/[0.05] text-black/40 dark:text-white/40 hover:bg-black/10 dark:hover:bg-white/10"}`}
                  data-testid="button-copy-iban">
                  {copiedIban ? <ClipboardCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30 rounded-2xl p-3.5">
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              ⚠️ اكتب رقم طلبك <strong className="font-mono">{submittedOrder!.id}</strong> في خانة الملاحظات عند التحويل
            </p>
          </div>
        </motion.div>
        )}

        {/* Upload proof - only when bank transfer is still needed */}
        {!(submittedOrder?.walletUsed && submittedOrder.walletUsed >= grandTotal - 0.01) && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-3xl border border-black/[0.07] dark:border-white/[0.07] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Upload className="w-4 h-4 text-white" />
            </div>
            <p className="font-black text-black dark:text-white">ارفع إيصال التحويل</p>
          </div>
          {postProofFiles.length === 0 ? (
            <div onClick={() => { (document.getElementById("proof-upload") as HTMLInputElement)?.click(); }}
              className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-black/25 dark:hover:border-white/25 transition-all group" data-testid="upload-proof">
              <Upload className="w-10 h-10 mx-auto mb-3 text-black/20 dark:text-white/20 group-hover:text-black/40 dark:group-hover:text-white/40 transition-colors" />
              <p className="text-sm font-medium text-black/40 dark:text-white/40">اضغط لرفع صورة الإيصال</p>
              <input id="proof-upload" type="file" className="hidden" accept="image/*,.pdf"
                onChange={e => { if (e.target.files?.[0]) handleProofUpload(e.target.files[0]); }} />
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-700/30 rounded-2xl px-4 py-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400 font-semibold">تم رفع الإيصال بنجاح</span>
            </motion.div>
          )}
        </motion.div>
        )}

        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => setLocation("/dashboard")} className="gap-2 rounded-xl" data-testid="button-go-dashboard">
            <ArrowLeft className="w-4 h-4" /> الذهاب للوحة التحكم
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );

  /* ─── MAIN FLOW ─── */
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-gray-950" dir={dir}>
      <Navigation />

      {/* Top gradient accent */}
      <div className="h-1 bg-gradient-to-r from-violet-500 via-teal-400 to-pink-500" />

      <div className="max-w-3xl mx-auto px-4 pt-16 pb-28">
        {/* Step indicator */}
        <StepIndicator step={step} lang={lang} />

        {/* Step content card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* ─── STEP 1: Package Selection ─── */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="text-center mb-8">
                  <p className="text-[11px] font-bold text-black/25 dark:text-white/25 uppercase tracking-[3px] mb-2">
                    {lang === "ar" ? "الخطوة 1 من 5" : "Step 1 of 5"}
                  </p>
                  <h2 className="text-3xl font-black text-black dark:text-white mb-2">
                    {lang === "ar" ? "اختر الباقة المناسبة" : "Choose Your Package"}
                  </h2>
                  {segmentFromUrl && (
                    <div className="inline-flex items-center gap-2 text-sm text-black/45 dark:text-white/45 bg-black/[0.04] dark:bg-white/[0.04] px-4 py-1.5 rounded-full">
                      <Globe className="w-3.5 h-3.5" />
                      {SEG_LABELS_TR[segmentFromUrl]} — {PERIOD_LABELS_TR[periodFromUrl]}
                    </div>
                  )}
                </div>

                <div className="grid gap-4">
                  {(["lite","pro","infinite"] as const).map(tier => {
                    const features = systemFeatures.filter((f: any) =>
                      tier === "lite" ? f.isInLite : tier === "pro" ? f.isInPro : f.isInInfinite
                    );
                    const isSelected = selectedPlan === tier;
                    const v = TIER_VISUAL[tier];
                    const Icon = v.icon;

                    return (
                      <motion.button
                        key={tier}
                        onClick={() => setSelectedPlan(tier)}
                        whileHover={{ scale: 1.01, y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        data-testid={`plan-card-${tier}`}
                        className={`w-full text-right rounded-3xl border-2 overflow-hidden transition-all duration-300 ${
                          isSelected
                            ? `border-transparent shadow-xl ${v.glow}`
                            : `${v.border} hover:shadow-lg`
                        }`}
                      >
                        <div className={`bg-gradient-to-br ${v.cardGrad}`}>
                          {/* Card top band */}
                          <div className={`bg-gradient-to-r ${v.headerGrad} px-5 py-3 flex items-center justify-between`}>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                              <span className="font-black text-white">{PLAN_LABELS[tier]}</span>
                              {v.badge && (
                                <span className="text-[10px] bg-white/25 text-white px-2 py-0.5 rounded-full font-bold">{v.badge}</span>
                              )}
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected ? "border-white bg-white" : "border-white/40"
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-black" />}
                            </div>
                          </div>
                          <div className="px-5 py-4">
                            <p className={`text-sm mb-3 ${v.isDark ? "text-white/50" : "text-black/45 dark:text-white/45"}`}>{PLAN_DESC_TR[tier]}</p>
                            {planFromUrl === tier && priceFromUrl > 0 && (
                              <div className={`inline-flex items-baseline gap-1.5 mb-3 px-3 py-1.5 rounded-xl ${v.isDark ? "bg-white/10" : "bg-black/[0.04] dark:bg-white/[0.04]"}`}>
                                <span className={`text-2xl font-black ${v.isDark ? "text-white" : "text-black dark:text-white"}`}>{priceFromUrl.toLocaleString()}</span>
                                <SARIcon size={12} className={v.isDark ? "opacity-70" : "opacity-70"} />
                              </div>
                            )}
                            {features.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {features.map((f: any) => (
                                  <div key={f.id} className={`flex items-center gap-2 text-xs ${v.isDark ? "text-white/50" : "text-black/55 dark:text-white/55"}`}>
                                    <div className={`${v.isDark ? "text-white/40" : "text-emerald-500"}`}><FeatureIcon name={f.icon} /></div>
                                    {f.nameAr || f.name}
                                  </div>
                                ))}
                              </div>
                            )}
                            {features.length === 0 && (
                              <p className={`text-xs italic ${v.isDark ? "text-white/25" : "text-black/25 dark:text-white/25"}`}>
                                {lang === "ar" ? "لا توجد مميزات مضافة بعد" : "No features added yet"}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── STEP 2: Add-ons ─── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="text-center mb-8">
                  <p className="text-[11px] font-bold text-black/25 dark:text-white/25 uppercase tracking-[3px] mb-2">{lang === "ar" ? "الخطوة 2 من 5" : "Step 2 of 5"}</p>
                  <h2 className="text-3xl font-black text-black dark:text-white mb-2">{lang === "ar" ? "المميزات الإضافية" : "Extra Add-ons"}</h2>
                  <p className="text-black/40 dark:text-white/40 text-sm">{lang === "ar" ? "اختر ما تحتاجه (اختياري)" : "Choose what you need (optional)"}</p>
                </div>

                {extraAddons.length === 0 ? (
                  <div className="text-center py-16 bg-black/[0.02] dark:bg-white/[0.02] rounded-3xl border border-black/[0.05] dark:border-white/[0.05]">
                    <Package className="w-12 h-12 mx-auto mb-3 text-black/15 dark:text-white/15" />
                    <p className="text-black/35 dark:text-white/35 text-sm font-medium">
                      {lang === "ar" ? "لا توجد إضافات متاحة لهذه الباقة والقطاع" : "No add-ons available for this plan & sector"}
                    </p>
                    <p className="text-black/20 dark:text-white/20 text-xs mt-1">
                      {lang === "ar" ? "يمكنك المتابعة بدون إضافات" : "You can continue without add-ons"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {extraAddons.map((a: any) => {
                      const selected = selectedAddons.includes(a.id);
                      return (
                        <motion.button key={a.id} onClick={() => toggleAddon(a.id)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                          data-testid={`addon-card-${a.id}`}
                          className={`w-full text-right rounded-2xl p-4 border-2 transition-all ${
                            selected ? "border-black dark:border-white bg-black/[0.02] dark:bg-white/[0.02] shadow-md" : "border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 hover:border-black/20 dark:hover:border-white/20"
                          }`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all overflow-hidden relative ${
                              selected ? "ring-2 ring-black dark:ring-white" : ""
                            } ${a.imageUrl ? "bg-black/[0.03] dark:bg-white/[0.03]" : selected ? "bg-black dark:bg-white" : "bg-black/[0.05] dark:bg-white/[0.05]"}`}>
                              {a.imageUrl ? (
                                <>
                                  <img src={a.imageUrl} alt={a.nameAr} className="w-full h-full object-cover" />
                                  {selected && (
                                    <div className="absolute inset-0 bg-black/50 dark:bg-white/30 flex items-center justify-center">
                                      <Check className="w-4 h-4 text-white" />
                                    </div>
                                  )}
                                </>
                              ) : selected
                                ? <Check className="w-4 h-4 text-white dark:text-black" />
                                : <Plus className="w-4 h-4 text-black/40 dark:text-white/40" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-black dark:text-white">{a.nameAr}</p>
                              {a.descriptionAr && <p className="text-xs text-black/40 dark:text-white/40 mt-0.5 truncate">{a.descriptionAr}</p>}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-black text-base text-black dark:text-white flex items-center gap-1">{a.price.toLocaleString()} <SARIcon size={12} /></p>
                              {a.billingType && a.billingType !== "one_time" && (
                                <p className="text-[10px] text-black/35 dark:text-white/35 mt-0.5">
                                  {a.billingType === "monthly" ? "/شهر" : a.billingType === "annual" ? "/سنة" : ""}
                                </p>
                              )}
                              {a.includedInPlans?.length > 0 && (
                                <p className="text-[10px] text-green-600 mt-0.5">مجانية للبرو+</p>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {selectedAddons.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-black dark:bg-white rounded-2xl px-5 py-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/55 dark:text-black/55">{selectedAddons.length} إضافة مختارة</span>
                      <span className="font-black text-lg text-white dark:text-black flex items-center gap-1.5">{addonsTotal.toLocaleString()} <SARIcon size={14} className="opacity-75" /></span>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ─── STEP 3: Details ─── */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="text-center mb-8">
                  <p className="text-[11px] font-bold text-black/25 dark:text-white/25 uppercase tracking-[3px] mb-2">{lang === "ar" ? "الخطوة 3 من 5" : "Step 3 of 5"}</p>
                  <h2 className="text-3xl font-black text-black dark:text-white mb-2">{lang === "ar" ? "تفاصيل المشروع" : "Project Details"}</h2>
                  <p className="text-black/40 dark:text-white/40 text-sm">{lang === "ar" ? "أخبرنا أكثر عن مشروعك" : "Tell us more about your project"}</p>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-black/[0.06] dark:border-white/[0.06] p-6 space-y-5 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold text-black/45 dark:text-white/45 uppercase tracking-wider mb-1.5 block">{lang === "ar" ? "اسم النشاط التجاري *" : "Business Name *"}</Label>
                      <Input value={formData.businessName} onChange={e => setFormData(f => ({ ...f, businessName: e.target.value }))}
                        placeholder={lang === "ar" ? "مثال: مطعم كلوني" : "e.g. Calone Restaurant"} className="h-12 rounded-xl" data-testid="input-business-name" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-black/45 dark:text-white/45 uppercase tracking-wider mb-1.5 block">{lang === "ar" ? "رقم الجوال" : "Mobile Number"}</Label>
                      <Input value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                        placeholder="05xxxxxxxx" className="h-12 rounded-xl" data-testid="input-phone" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-black/45 dark:text-white/45 uppercase tracking-wider mb-2 block">{lang === "ar" ? "القطاع *" : "Sector *"}</Label>
                    {segmentFromUrl ? (
                      (() => {
                        const locked = sectors.find(s => s.value === segmentFromUrl) || { value: segmentFromUrl, label: SEG_LABELS_TR[segmentFromUrl] || segmentFromUrl, icon: Globe, color: "from-slate-400 to-gray-600" };
                        return (
                          <div className="flex items-center gap-3 border-2 border-black dark:border-white bg-black/[0.03] dark:bg-white/[0.03] rounded-2xl px-4 py-3 shadow-sm">
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${locked.color} flex items-center justify-center shrink-0 shadow-sm`}>
                              <locked.icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-black dark:text-white">{locked.label}</p>
                              <p className="text-[10px] text-black/40 dark:text-white/40">{lang === "ar" ? "محدد من صفحة الباقات" : "Selected from pricing page"}</p>
                            </div>
                            <Lock className="w-4 h-4 text-black/25 dark:text-white/25 shrink-0" />
                          </div>
                        );
                      })()
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {sectors.map(s => (
                          <motion.button key={s.value} onClick={() => setFormData(f => ({ ...f, sector: s.value }))} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            data-testid={`sector-${s.value}`}
                            className={`border-2 rounded-2xl p-3 text-right transition-all ${formData.sector === s.value ? "border-black dark:border-white bg-black/[0.03] dark:bg-white/[0.03] shadow-sm" : "border-black/[0.06] dark:border-white/[0.06] hover:border-black/20 dark:hover:border-white/20"}`}>
                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-2 shadow-sm`}>
                              <s.icon className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-xs font-bold text-black dark:text-white">{s.label}</p>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-black/45 dark:text-white/45 uppercase tracking-wider mb-2 block">{lang === "ar" ? "النمط البصري" : "Visual Style"}</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {VISUAL_STYLES.map(s => (
                        <motion.button key={s.value} onClick={() => setFormData(f => ({ ...f, visualStyle: s.value }))} whileHover={{ scale: 1.02 }}
                          data-testid={`style-${s.value}`}
                          className={`border-2 rounded-2xl p-3 text-right transition-all ${formData.visualStyle === s.value ? "border-black dark:border-white bg-black/[0.03] dark:bg-white/[0.03] shadow-sm" : "border-black/[0.06] dark:border-white/[0.06] hover:border-black/15 dark:hover:border-white/15"}`}>
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-2 shadow-sm`}>
                            <s.icon className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-xs font-bold text-black dark:text-white">{s.label}</p>
                          <p className="text-[10px] text-black/35 dark:text-white/35 mt-0.5 leading-tight">{s.desc}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-black/45 dark:text-white/45 uppercase tracking-wider mb-1.5 block">{lang === "ar" ? "لغة الموقع" : "Website Language"}</Label>
                    <Select value={formData.siteLanguage} onValueChange={v => setFormData(f => ({ ...f, siteLanguage: v }))}>
                      <SelectTrigger className="h-12 rounded-xl" data-testid="select-language"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar">{lang === "ar" ? "عربي فقط" : "Arabic only"}</SelectItem>
                        <SelectItem value="en">{lang === "ar" ? "إنجليزي فقط" : "English only"}</SelectItem>
                        <SelectItem value="both">{lang === "ar" ? "عربي + إنجليزي" : "Arabic + English"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "whatsappIntegration", label: lang === "ar" ? "ربط واتساب" : "WhatsApp" },
                      { key: "socialIntegration",   label: lang === "ar" ? "ربط سوشيال" : "Social Media" },
                      { key: "hasLogo",             label: lang === "ar" ? "لدي شعار جاهز" : "I have a logo" },
                      { key: "needsLogoDesign",     label: lang === "ar" ? "أحتاج تصميم شعار" : "Need logo design" },
                    ].map(({ key, label }) => (
                      <button key={key} onClick={() => setFormData(f => ({ ...f, [key]: !(f as any)[key] }))} data-testid={`toggle-${key}`}
                        className={`border-2 rounded-2xl p-3 flex items-center gap-2.5 transition-all ${(formData as any)[key] ? "border-black dark:border-white bg-black/[0.03] dark:bg-white/[0.03]" : "border-black/[0.06] dark:border-white/[0.06] hover:border-black/15 dark:hover:border-white/15"}`}>
                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${(formData as any)[key] ? "border-black dark:border-white bg-black dark:bg-white" : "border-black/20 dark:border-white/20"}`}>
                          {(formData as any)[key] && <Check className="w-3 h-3 text-white dark:text-black" />}
                        </div>
                        <span className="text-xs font-semibold text-black dark:text-white">{label}</span>
                      </button>
                    ))}
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-black/45 dark:text-white/45 uppercase tracking-wider mb-1.5 block">{lang === "ar" ? "متطلبات إضافية" : "Additional Notes"}</Label>
                    <Textarea value={formData.requiredFunctions} onChange={e => setFormData(f => ({ ...f, requiredFunctions: e.target.value }))}
                      placeholder={lang === "ar" ? "اكتب أي متطلبات خاصة أو ميزات تحتاجها..." : "Any special requirements..."}
                      className="h-24 resize-none rounded-xl" data-testid="textarea-notes" />
                  </div>

                  <div className="border-t border-black/[0.05] dark:border-white/[0.05] pt-4 space-y-3">
                    <p className="text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-wider">{lang === "ar" ? "الملفات (اختياري)" : "Files (optional)"}</p>
                    <FileUploadField label={lang === "ar" ? "الشعار" : "Logo"} field="logo" files={uploadedFiles.logo} onUpload={handleFileUpload} onRemove={handleFileRemove} />
                    <FileUploadField label={lang === "ar" ? "الهوية البصرية" : "Brand Identity"} field="brandIdentity" files={uploadedFiles.brandIdentity} onUpload={handleFileUpload} onRemove={handleFileRemove} />
                    <FileUploadField label={lang === "ar" ? "المحتوى والصور" : "Content & Images"} field="content" files={uploadedFiles.content} onUpload={handleFileUpload} onRemove={handleFileRemove} />
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP 4: Devices ─── */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="text-center mb-8">
                  <p className="text-[11px] font-bold text-black/25 dark:text-white/25 uppercase tracking-[3px] mb-2">{lang === "ar" ? "الخطوة 4 من 5" : "Step 4 of 5"}</p>
                  <h2 className="text-3xl font-black text-black dark:text-white mb-2">{lang === "ar" ? "الأجهزة والمنتجات" : "Devices & Products"}</h2>
                  <p className="text-black/40 dark:text-white/40 text-sm">{lang === "ar" ? "أضف أجهزة لنظامك (اختياري)" : "Add devices to your system (optional)"}</p>
                </div>

                {products.filter((p: any) => p.isActive !== false).length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-black/[0.06] dark:border-white/[0.06]">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-black/15 dark:text-white/15" />
                    <p className="text-black/35 dark:text-white/35 text-sm mb-1">{lang === "ar" ? "لا توجد منتجات متاحة حالياً" : "No products available yet"}</p>
                    <p className="text-xs text-black/25 dark:text-white/25">{lang === "ar" ? "يمكنك المتابعة للخطوة التالية" : "You can continue to the next step"}</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {products.filter((p: any) => p.isActive !== false).map((p: any) => {
                      const qty = deviceCart[p.id] || 0;
                      const hasBundles = Array.isArray(p.planBundles) && p.planBundles.length > 0;
                      const selectedBundleIdx = deviceBundles[p.id];
                      const selectedBundle = typeof selectedBundleIdx === "number" ? p.planBundles?.[selectedBundleIdx] : null;
                      return (
                        <motion.div key={p.id} data-testid={`product-card-${p.id}`}
                          className={`bg-white dark:bg-gray-900 border-2 rounded-3xl transition-all ${qty > 0 ? "border-black dark:border-white shadow-md" : "border-black/[0.06] dark:border-white/[0.06]"}`}>
                          <div className="flex items-center gap-4 p-4">
                            {p.imageUrl
                              ? <img src={p.imageUrl} alt={p.nameAr||p.name} className="w-16 h-16 object-cover rounded-2xl shrink-0 shadow-sm" />
                              : <div className="w-16 h-16 bg-black/[0.04] dark:bg-white/[0.04] rounded-2xl flex items-center justify-center shrink-0"><Package className="w-7 h-7 text-black/20 dark:text-white/20" /></div>
                            }
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-black text-black dark:text-white">{p.nameAr || p.name}</p>
                                {hasBundles && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-700/40">{p.planBundles.length} باقة</span>}
                              </div>
                              {p.descriptionAr && <p className="text-xs text-black/40 dark:text-white/40 mt-0.5 line-clamp-1">{p.descriptionAr}</p>}
                              <p className="font-black text-black dark:text-white mt-1 flex items-center gap-1">{p.price?.toLocaleString()} <SARIcon size={11} className="opacity-70" /></p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button onClick={() => setDeviceQty(p.id, -1)} className="w-9 h-9 rounded-full border-2 border-black/15 dark:border-white/15 flex items-center justify-center hover:border-black dark:hover:border-white transition-all" data-testid={`btn-minus-${p.id}`}>
                                <Minus className="w-3.5 h-3.5 text-black dark:text-white" />
                              </button>
                              <span className="w-7 text-center font-black text-lg text-black dark:text-white">{qty}</span>
                              <button onClick={() => setDeviceQty(p.id, 1)} className="w-9 h-9 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center hover:opacity-80 transition-all shadow-md" data-testid={`btn-plus-${p.id}`}>
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Bundle picker — shown when product is selected AND has bundles */}
                          {qty > 0 && hasBundles && (
                            <AnimatePresence>
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                className="border-t border-black/[0.06] dark:border-white/[0.06] px-4 pb-4 pt-3">
                                <p className="text-xs font-bold text-black/50 dark:text-white/50 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                  <Crown className="w-3.5 h-3.5 text-violet-500" />
                                  {lang === "ar" ? "اختر الباقة المرفقة مع الجهاز" : "Select bundle included with device"}
                                  {!selectedBundle && <span className="text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40">مطلوب</span>}
                                </p>
                                <div className="grid gap-2">
                                  {p.planBundles.map((bundle: any, bidx: number) => {
                                    const BIcon = BUNDLE_ICONS[bundle.planTier] || LayoutGrid;
                                    const isSelected = selectedBundleIdx === bidx;
                                    return (
                                      <button key={bidx} onClick={() => setDeviceBundles(prev => ({ ...prev, [p.id]: bidx }))}
                                        data-testid={`bundle-option-${p.id}-${bidx}`}
                                        className={`flex items-center gap-3 border-2 rounded-2xl px-3 py-2.5 text-right transition-all ${isSelected ? "border-black dark:border-white bg-black/[0.03] dark:bg-white/[0.03] shadow-sm" : "border-black/[0.07] dark:border-white/[0.07] hover:border-black/25 dark:hover:border-white/25"}`}>
                                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${BUNDLE_COLORS[bundle.planTier] || "from-blue-400 to-indigo-500"} flex items-center justify-center shrink-0 shadow-sm`}>
                                          <BIcon className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0 text-right">
                                          <div className="flex items-center gap-2 justify-between">
                                            <p className="text-sm font-bold text-black dark:text-white truncate">{bundle.planNameAr}</p>
                                            <span className="text-xs font-black text-black dark:text-white shrink-0">
                                              {bundle.isFree ? <span className="text-green-600 dark:text-green-400">مجانية</span> : <span className="flex items-center gap-0.5">{(bundle.customPrice || 0).toLocaleString()} <SARIcon size={10} className="opacity-70" /></span>}
                                            </span>
                                          </div>
                                          {bundle.planDescAr && <p className="text-[10px] text-black/40 dark:text-white/40 mt-0.5 truncate">{bundle.planDescAr}</p>}
                                          {bundle.features?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                              {bundle.features.slice(0, 3).map((f: string, fi: number) => (
                                                <span key={fi} className="text-[9px] bg-black/[0.04] dark:bg-white/[0.05] text-black/50 dark:text-white/50 px-1.5 py-0.5 rounded-md">{f}</span>
                                              ))}
                                              {bundle.features.length > 3 && <span className="text-[9px] text-black/30 dark:text-white/30">+{bundle.features.length - 3}</span>}
                                            </div>
                                          )}
                                        </div>
                                        {isSelected && <div className="w-4 h-4 rounded-full bg-black dark:bg-white flex items-center justify-center shrink-0"><Check className="w-2.5 h-2.5 text-white dark:text-black" /></div>}
                                      </button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            </AnimatePresence>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {devicesTotal > 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-black dark:bg-white rounded-2xl px-5 py-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/55 dark:text-black/55">{lang === "ar" ? "إجمالي الأجهزة" : "Devices Total"}</span>
                      <span className="font-black text-lg text-white dark:text-black flex items-center gap-1.5">{devicesTotal.toLocaleString()} <SARIcon size={14} className="opacity-75" /></span>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ─── STEP 5: Payment ─── */}
            {step === 5 && (
              <div className="space-y-5">
                <div className="text-center mb-8">
                  <p className="text-[11px] font-bold text-black/25 dark:text-white/25 uppercase tracking-[3px] mb-2">{lang === "ar" ? "الخطوة الأخيرة" : "Final Step"}</p>
                  <h2 className="text-3xl font-black text-black dark:text-white mb-2">{lang === "ar" ? "الدفع وإرسال الطلب" : "Payment & Submit"}</h2>
                  <p className="text-black/40 dark:text-white/40 text-sm">{lang === "ar" ? "راجع طلبك وحوّل المبلغ" : "Review your order and complete payment"}</p>
                </div>

                {/* Order Summary Card */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden shadow-sm">
                  <div className="px-6 py-4 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.05] dark:border-white/[0.05]">
                    <p className="text-xs font-black text-black/40 dark:text-white/40 uppercase tracking-[2px]">{lang === "ar" ? "ملخص الطلب" : "Order Summary"}</p>
                  </div>
                  <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                    <div className="px-6 py-4 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br ${TIER_VISUAL[selectedPlan]?.headerGrad || "from-gray-400 to-gray-600"}`}>
                          <Crown className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-black dark:text-white">{lang === "ar" ? `باقة ${PLAN_LABELS[selectedPlan]}` : `${PLAN_LABELS[selectedPlan]} Package`}</span>
                      </div>
                      <span className="font-bold text-sm text-black dark:text-white flex items-center gap-1">{planPrice.toLocaleString()} {lang === "ar" ? <SARIcon size={11} className="opacity-70" /> : "SAR"}</span>
                    </div>
                    {selectedAddons.map(id => {
                      const a = extraAddons.find((ad: any) => ad.id === id);
                      return a ? (
                        <div key={id} className="px-6 py-3 flex justify-between items-center">
                          <span className="text-sm text-black/55 dark:text-white/55">{a.nameAr}</span>
                          <span className="text-sm font-medium text-black dark:text-white flex items-center gap-1">{a.price.toLocaleString()} {lang === "ar" ? <SARIcon size={11} className="opacity-70" /> : "SAR"}</span>
                        </div>
                      ) : null;
                    })}
                    {Object.entries(deviceCart).map(([pid, qty]) => {
                      const p = products.find((pr: any) => pr.id === pid);
                      const bundleIdx = deviceBundles[pid];
                      const bundle = typeof bundleIdx === "number" ? p?.planBundles?.[bundleIdx] : null;
                      return p ? (
                        <div key={pid}>
                          <div className="px-6 py-3 flex justify-between items-center">
                            <span className="text-sm text-black/55 dark:text-white/55">{p.nameAr || p.name} ×{qty}</span>
                            <span className="text-sm font-medium text-black dark:text-white flex items-center gap-1">{(p.price * qty).toLocaleString()} {lang === "ar" ? <SARIcon size={11} className="opacity-70" /> : "SAR"}</span>
                          </div>
                          {bundle && (
                            <div className="px-6 py-2 flex justify-between items-center bg-violet-50/50 dark:bg-violet-900/10">
                              <div className="flex items-center gap-1.5">
                                <Crown className="w-3 h-3 text-violet-500" />
                                <span className="text-xs text-violet-700 dark:text-violet-400">{bundle.planNameAr}</span>
                              </div>
                              <span className="text-xs font-medium text-violet-700 dark:text-violet-400 flex items-center gap-1">
                                {bundle.isFree ? "مجاني" : <>{(bundle.customPrice || 0).toLocaleString()} {lang === "ar" ? <SARIcon size={10} className="opacity-60" /> : "SAR"}</>}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : null;
                    })}
                    <div className="px-6 py-5 flex justify-between items-center bg-gradient-to-r from-black to-gray-900">
                      <span className="text-white font-bold">{lang === "ar" ? "الإجمالي" : "Total"}</span>
                      <div className="text-right flex items-baseline gap-1.5">
                        <span className="text-white font-black text-2xl">{grandTotal.toLocaleString()}</span>
                        {lang === "ar" ? <SARIcon size={14} className="opacity-50 translate-y-0.5" /> : <span className="text-white/50 text-sm">SAR</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Paymob — website service add-on */}
                <div>
                  <p className="text-[11px] font-black text-black/30 dark:text-white/30 uppercase tracking-[2px] mb-3 px-1">
                    {lang === "ar" ? "خدمة إضافية للموقع" : "Website Add-on Service"}
                  </p>
                <div className={`rounded-3xl border-2 transition-all overflow-hidden ${usePaymob ? "border-[#5D3FD3] shadow-lg shadow-purple-100/50 dark:shadow-purple-900/20" : "border-black/[0.07] dark:border-white/[0.07]"}`}
                  style={usePaymob ? { background: "linear-gradient(135deg,#faf7ff,#f3eeff)" } : {}}>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md overflow-hidden bg-white border border-black/[0.07]">
                          <img src="/paymob-logo.svg" alt="Paymob" className="w-full h-full object-contain p-1" onError={e => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).parentElement!.innerHTML = '<span style="font-size:9px;font-weight:900;color:#5D3FD3;padding:2px">PAYMOB</span>'; }} />
                        </div>
                        <div>
                          <p className="font-black text-sm text-black dark:text-white">{lang === "ar" ? "Paymob للدفع الإلكتروني" : "Paymob Gateway"}</p>
                          <p className="text-[10px] text-black/40 dark:text-white/40">مدى · فيزا · ماستر · Apple Pay</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {["pro","infinite"].includes(selectedPlan) ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">مجاني</span>
                        ) : (
                          <span className="text-xs text-[#5D3FD3] dark:text-purple-300 font-bold flex items-center gap-0.5">+100 <SARIcon size={10} className="opacity-70" /></span>
                        )}
                        <button
                          onClick={() => setUsePaymob(v => !v)}
                          className={`w-12 h-6 rounded-full transition-all duration-200 relative ${usePaymob ? "bg-[#5D3FD3]" : "bg-black/15 dark:bg-white/15"}`}
                          data-testid="button-toggle-paymob"
                        >
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${usePaymob ? (dir === "rtl" ? "right-6" : "left-6") : (dir === "rtl" ? "right-0.5" : "left-0.5")}`} />
                        </button>
                      </div>
                    </div>
                    {usePaymob && paymobFee > 0 && (
                      <div className="mt-2 text-xs text-[#5D3FD3]/70 dark:text-purple-300/70 bg-purple-50 dark:bg-purple-900/20 rounded-xl px-3 py-2">
                        تُضاف رسوم ربط بوابة Paymob (100 ر.س) لباقة لايت — تأتي مجانًا مع برو والإنفينتي.
                      </div>
                    )}
                  </div>
                </div>
                </div>

                {/* Payment method label */}
                <p className="text-[11px] font-black text-black/30 dark:text-white/30 uppercase tracking-[2px] px-1 mt-2 mb-3">
                  {lang === "ar" ? "طريقة دفع الطلب" : "Order Payment Method"}
                </p>

                {/* Qirox Pay Card — always visible */}
                <div className={`rounded-3xl border-2 transition-all overflow-hidden ${useWallet && walletBalance > 0 ? "border-cyan-400 shadow-lg shadow-cyan-100/50" : walletBalance === 0 ? "border-black/[0.06] dark:border-white/[0.06] opacity-80" : "border-black/[0.07] dark:border-white/[0.07]"}`}
                  style={useWallet && walletBalance > 0 ? { background: "linear-gradient(135deg,#f0fdff,#ecfeff)" } : {}}>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* Mini Qirox Pay card */}
                        <div className="w-14 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                          style={{ background: "linear-gradient(135deg,#0f172a,#1e3a5f)" }}>
                          <div className="text-center leading-none">
                            <span className="text-[7px] font-black tracking-wider block">
                              <span className="text-cyan-400">QIROX</span>
                            </span>
                            <span className="text-[6px] font-black tracking-widest text-white/70 block">PAY</span>
                          </div>
                        </div>
                        <div>
                          <p className="font-black text-black dark:text-white text-sm">Qirox Pay</p>
                          {walletBalance > 0 ? (
                            <p className="text-cyan-600 dark:text-cyan-400 text-xs font-bold flex items-center gap-1">
                              {walletBalance.toLocaleString()} {lang === "ar" ? <><SARIcon size={10} className="opacity-70" /> متاح</> : "SAR available"}
                            </p>
                          ) : (
                            <p className="text-black/30 dark:text-white/30 text-xs">
                              {lang === "ar" ? "رصيدك صفر" : "No balance"}
                            </p>
                          )}
                        </div>
                      </div>
                      {walletBalance > 0 ? (
                        <button
                          onClick={() => { setUseWallet(v => !v); if (!useWallet) setWalletAmount(maxWalletUsable); else setWalletAmount(0); }}
                          className={`w-12 h-6 rounded-full transition-all duration-200 relative ${useWallet ? "bg-cyan-500" : "bg-black/15 dark:bg-white/15"}`}
                          data-testid="toggle-wallet-orderflow">
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${useWallet ? (dir === "rtl" ? "right-6" : "left-6") : (dir === "rtl" ? "right-0.5" : "left-0.5")}`} />
                        </button>
                      ) : (
                        <a href="/client-wallet" className="text-xs font-bold text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 px-3 py-1.5 rounded-xl hover:bg-cyan-100 transition-colors">
                          {lang === "ar" ? "اشحن المحفظة" : "Top up"}
                        </a>
                      )}
                    </div>
                    {useWallet && walletBalance > 0 && (
                      <div className="mt-3 space-y-3">
                        <div className="flex items-center gap-3">
                          <input type="number" min={1} max={maxWalletUsable} value={walletAmount}
                            onChange={e => setWalletAmount(Math.min(Number(e.target.value), maxWalletUsable))}
                            className="flex-1 bg-white dark:bg-gray-800 border border-cyan-200 dark:border-cyan-700 rounded-xl px-4 py-2 text-black dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-cyan-400"
                            data-testid="input-wallet-amount-orderflow" />
                          <button onClick={() => setWalletAmount(maxWalletUsable)}
                            className="px-3 py-2 bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-xs font-bold rounded-xl hover:bg-cyan-200 dark:hover:bg-cyan-800/50 transition-colors"
                            data-testid="button-wallet-all-orderflow">
                            {lang === "ar" ? "كل الرصيد" : "Max"}
                          </button>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-black/40 dark:text-white/40">{lang === "ar" ? "خصم من Qirox Pay" : "Qirox Pay deduction"}</span>
                          <span className="text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1">- {effectiveWalletAmt.toLocaleString()} <SARIcon size={10} className="opacity-70" /></span>
                        </div>
                        {fullyPaidByWallet ? (
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-700/30 rounded-2xl p-3 text-center">
                            <p className="text-green-700 dark:text-green-400 text-xs font-bold">{lang === "ar" ? "سيتم سداد الطلب بالكامل من Qirox Pay" : "Order fully paid via Qirox Pay"}</p>
                          </div>
                        ) : (
                          <div className="flex justify-between text-sm pt-1 border-t border-cyan-100 dark:border-cyan-800/50">
                            <span className="font-semibold text-black/60 dark:text-white/60">{lang === "ar" ? "المتبقي بالتحويل" : "Remaining via transfer"}</span>
                            <span className="font-black text-black dark:text-white flex items-center gap-1">{remainingAfterWallet.toLocaleString()} <SARIcon size={12} className="opacity-70" /></span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bank Transfer Card - Credit card style */}
                {!fullyPaidByWallet && (
                <div className="relative rounded-3xl overflow-hidden">
                  <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-6 text-white relative">
                    <div className="absolute inset-0 opacity-10">
                      <div style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px", width: "100%", height: "100%" }} />
                    </div>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-300/20 rounded-full blur-2xl" />

                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <div className="flex items-center gap-2">
                        <BanknoteIcon className="w-5 h-5 text-white/70" />
                        <span className="text-white/70 text-sm font-medium">تحويل بنكي</span>
                      </div>
                      <div className="text-right">
                        <span className="text-white/50 text-xs">المبلغ المطلوب</span>
                        <p className="text-white font-black text-xl flex items-center gap-1">{remainingAfterWallet.toLocaleString()} <SARIcon size={15} className="opacity-70" /></p>
                        {effectiveWalletAmt > 0 && (
                          <p className="text-white/40 text-xs line-through flex items-center gap-1">{grandTotal.toLocaleString()} <SARIcon size={10} className="opacity-70" /></p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 relative z-10">
                      <div className="bg-white/10 rounded-2xl px-4 py-3 flex justify-between items-center">
                        <span className="text-white/55 text-xs">البنك</span>
                        <span className="text-white font-bold text-sm">{bank.bankName}</span>
                      </div>
                      <div className="bg-white/10 rounded-2xl px-4 py-3 flex justify-between items-center">
                        <span className="text-white/55 text-xs">المستفيد</span>
                        <span className="text-white font-bold text-sm">{bank.beneficiaryName}</span>
                      </div>
                      <div className="bg-white/10 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                        <span className="text-white/55 text-xs shrink-0">IBAN</span>
                        <span className="text-white font-mono font-bold text-sm truncate" dir="ltr">{bank.iban}</span>
                        <button onClick={() => { navigator.clipboard.writeText(bank.iban); setCopiedIban(true); setTimeout(() => setCopiedIban(false), 2500); }}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${copiedIban ? "bg-green-400 text-white" : "bg-white/20 text-white hover:bg-white/30"}`}
                          data-testid="button-copy-iban-step5">
                          {copiedIban ? <ClipboardCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 bg-amber-400/20 border border-amber-300/30 rounded-2xl p-3.5 relative z-10">
                      <p className="text-amber-200 text-xs leading-relaxed">
                        ⚠️ {lang === "ar" ? "حوّل المبلغ أولاً، ثم ارفع صورة الإيصال بعد إرسال الطلب" : "Transfer the amount first, then upload your payment receipt after submitting"}
                      </p>
                    </div>
                  </div>
                </div>
                )}

                {/* Upload Receipt - only when bank transfer is needed */}
                {!fullyPaidByWallet && (
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-black/[0.06] dark:border-white/[0.06] p-6 shadow-sm">
                  <FileUploadField
                    label={lang === "ar" ? "إيصال التحويل البنكي (اختياري الآن)" : "Transfer Receipt (optional now)"}
                    field="paymentProof" files={uploadedFiles.paymentProof}
                    onUpload={handleFileUpload} onRemove={handleFileRemove} />
                </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-black/[0.06] dark:border-white/[0.06]">
          <Button variant="ghost" onClick={handleBack} disabled={step === 1}
            className="gap-2 rounded-xl h-11 px-5 font-semibold disabled:opacity-30" data-testid="button-back">
            {lang === "ar" ? <><ArrowRight className="w-4 h-4" /> السابق</> : <><ArrowLeft className="w-4 h-4" /> Back</>}
          </Button>

          <div className="flex gap-1">
            {STEP_CONFIG.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i + 1 === step ? "w-6 bg-black dark:bg-white" : i + 1 < step ? "w-3 bg-black/40 dark:bg-white/40" : "w-3 bg-black/10 dark:bg-white/10"}`} />
            ))}
          </div>

          {step < STEP_CONFIG.length ? (
            <Button onClick={handleNext} disabled={!canNext()}
              className="gap-2 rounded-xl h-11 px-6 font-bold bg-black dark:bg-white text-white dark:text-black hover:opacity-80 disabled:opacity-30" data-testid="button-next">
              {lang === "ar" ? <>التالي <ArrowLeft className="w-4 h-4" /></> : <>Next <ArrowRight className="w-4 h-4" /></>}
            </Button>
          ) : (
            <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}
              className="gap-2 rounded-xl h-11 px-6 font-black bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:opacity-90 shadow-lg shadow-violet-500/30 disabled:opacity-70" data-testid="button-submit">
              {submitMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {lang === "ar" ? "جاري الإرسال..." : "Submitting..."}</>
                : <>{lang === "ar" ? "إرسال الطلب" : "Submit Order"} {lang === "ar" ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}</>}
            </Button>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
