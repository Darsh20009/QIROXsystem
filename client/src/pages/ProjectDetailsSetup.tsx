import { useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2, Globe, Zap, Layers, Check, ChevronRight, ChevronLeft,
  Loader2, MessageCircle, CreditCard, CalendarCheck,
  Sparkles, X, Wand2, RefreshCw, FileText, Upload, ImageIcon,
  Shield, BadgeCheck, Landmark, IdCard, ClipboardCheck, AlertCircle
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const LANGUAGES = [
  { v: "ar", label: "عربي", flag: "🇸🇦" },
  { v: "en", label: "English", flag: "🇺🇸" },
  { v: "both", label: "ثنائي", flag: "🌐" },
];

const INTEGRATIONS = [
  { key: "whatsappIntegration", label: "واتساب", desc: "ربط بوت واتساب للطلبات والتواصل", icon: MessageCircle },
  { key: "needsPayment", label: "نظام دفع إلكتروني", desc: "بوابة دفع لاستقبال المدفوعات", icon: CreditCard },
  { key: "needsBooking", label: "حجز المواعيد", desc: "نظام حجز مواعيد أونلاين", icon: CalendarCheck },
];

const SECTIONS = [
  { label: "بيانات النشاط", icon: Building2, desc: "معلومات مشروعك الأساسية" },
  { label: "اللغة", icon: Globe, desc: "لغة الموقع أو النظام" },
  { label: "التكاملات", icon: Zap, desc: "الأنظمة التي تحتاجها" },
  { label: "فكرتك", icon: Layers, desc: "صف ما تريد بناؤه" },
  { label: "الوثائق الرسمية", icon: Shield, desc: "ارفع وثائق نشاطك التجاري" },
];

const DOC_TYPES = [
  {
    key: "logoUrl",
    label: "شعار النشاط (اللوجو)",
    desc: "ارفع شعار مؤسستك أو نشاطك — PNG أو SVG أو JPG",
    icon: ImageIcon,
    accept: "image/*",
    badge: "مميزات التصميم",
    color: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-50 dark:bg-violet-900/20",
    border: "border-violet-200 dark:border-violet-700",
    optional: true,
  },
  {
    key: "commercialRegUrl",
    label: "السجل التجاري",
    desc: "صورة أو PDF للسجل التجاري الخاص بالمؤسسة",
    icon: FileText,
    accept: "image/*,.pdf",
    badge: "مطلوب",
    color: "from-blue-500 to-blue-600",
    bgLight: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-700",
    optional: false,
  },
  {
    key: "taxRegUrl",
    label: "شهادة التسجيل الضريبي",
    desc: "وثيقة التسجيل في هيئة الزكاة والضريبة والجمارك",
    icon: ClipboardCheck,
    accept: "image/*,.pdf",
    badge: "مطلوب",
    color: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-700",
    optional: false,
  },
  {
    key: "nationalIdUrl",
    label: "الهوية الوطنية / الإقامة",
    desc: "صورة هوية صاحب المشروع أو المفوّض",
    icon: IdCard,
    accept: "image/*,.pdf",
    badge: "مطلوب",
    color: "from-emerald-500 to-green-600",
    bgLight: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-700",
    optional: false,
  },
  {
    key: "ibanCertUrl",
    label: "شهادة الإيبان للمؤسسة",
    desc: "وثيقة رقم الحساب البنكي الدولي (IBAN) للمؤسسة",
    icon: Landmark,
    accept: "image/*,.pdf",
    badge: "إن وجد",
    color: "from-slate-500 to-slate-700",
    bgLight: "bg-slate-50 dark:bg-slate-900/20",
    border: "border-slate-200 dark:border-slate-700",
    optional: true,
  },
];

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
  if (!res.ok) throw new Error("فشل رفع الملف");
  const data = await res.json();
  return data.url as string;
}

function DocUploadCard({
  docType, value, onChange,
}: {
  docType: typeof DOC_TYPES[0];
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const Icon = docType.icon;

  async function handleFile(file: File) {
    setLoading(true);
    setError("");
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch (e: any) {
      setError("فشل الرفع — حاول مجدداً");
    } finally {
      setLoading(false);
    }
  }

  const isImage = value && (value.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) || value.startsWith("data:image"));
  const isPDF = value && value.match(/\.pdf/i);
  const filename = value ? value.split("/").pop()?.split("?")[0] || "ملف مرفوع" : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
        value
          ? `${docType.border} ${docType.bgLight}`
          : "border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-gray-900 hover:border-black/20 dark:hover:border-white/20"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={docType.accept}
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        data-testid={`doc-input-${docType.key}`}
      />

      <div className="p-4 flex items-start gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${docType.color} shadow-md`}>
          <Icon className="w-5 h-5 text-white" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className="font-bold text-sm text-black dark:text-white">{docType.label}</p>
            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
              docType.optional
                ? "bg-black/[0.06] dark:bg-white/[0.06] text-black/50 dark:text-white/50"
                : "bg-black dark:bg-white text-white dark:text-black"
            }`}>
              {docType.badge}
            </span>
          </div>
          <p className="text-xs text-black/40 dark:text-white/40 leading-relaxed">{docType.desc}</p>

          {/* Uploaded preview */}
          {value && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-3"
            >
              {isImage ? (
                <div className="relative w-full h-28 rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
                  <img src={value} alt="preview" className="w-full h-full object-contain bg-black/[0.02] dark:bg-white/[0.02]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <span className="text-white text-[10px] font-bold bg-black/40 rounded-lg px-2 py-0.5 backdrop-blur-sm truncate max-w-[70%]">
                      {filename}
                    </span>
                    <div className="flex items-center gap-1 bg-green-500 rounded-full px-2 py-0.5">
                      <Check className="w-2.5 h-2.5 text-white" />
                      <span className="text-white text-[9px] font-bold">تم</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/10 dark:border-white/10">
                  <FileText className="w-5 h-5 text-black/40 dark:text-white/40 shrink-0" />
                  <span className="text-xs font-medium text-black/60 dark:text-white/60 flex-1 truncate">{filename}</span>
                  <div className="flex items-center gap-1 bg-green-500 rounded-full px-2 py-0.5 shrink-0">
                    <Check className="w-2.5 h-2.5 text-white" />
                    <span className="text-white text-[9px] font-bold">تم</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {error && (
            <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {error}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 shrink-0">
          {value ? (
            <>
              <button
                onClick={() => inputRef.current?.click()}
                disabled={loading}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-black/[0.06] dark:bg-white/[0.06] hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                data-testid={`doc-replace-${docType.key}`}
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-black/50 dark:text-white/50" />}
              </button>
              <button
                onClick={() => onChange("")}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                data-testid={`doc-remove-${docType.key}`}
              >
                <X className="w-3.5 h-3.5 text-red-500" />
              </button>
            </>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-black dark:bg-white hover:opacity-80 transition-opacity shadow-md"
              data-testid={`doc-upload-${docType.key}`}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 text-white dark:text-black animate-spin" /> : <Upload className="w-3.5 h-3.5 text-white dark:text-black" />}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AIWritingAssistant({
  open, onClose, businessName, sector, targetAudience, onApply
}: {
  open: boolean; onClose: () => void;
  businessName: string; sector: string; targetAudience: string;
  onApply: (text: string) => void;
}) {
  const { toast } = useToast();
  const [idea, setIdea] = useState("");
  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/describe-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ businessName, sector, targetAudience, existingIdea: idea }),
      });
      const data = await res.json();
      setGenerated(data.description || "");
    } catch {
      toast({ title: "فشل توليد الوصف، حاول مجدداً", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-black">
            <div className="w-8 h-8 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-black dark:text-white" />
            </div>
            مساعد كيروكس AI
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 rounded-xl p-3">
            <p className="text-xs text-black dark:text-white font-medium">
              🤖 اكتب فكرتك باختصار وسأساعدك في صياغتها بشكل احترافي للفريق التقني
            </p>
          </div>
          <div>
            <Label className="text-xs font-bold text-black/40 uppercase tracking-wider mb-1.5 block">فكرتك الأولية (اختياري)</Label>
            <Textarea value={idea} onChange={e => setIdea(e.target.value)}
              placeholder="مثال: أريد موقع لمطعمي يقبل الطلبات أونلاين ويعرض المنيو..."
              rows={3} className="rounded-xl resize-none text-sm" data-testid="ai-idea-input" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-black/40">
            {[{ label: "النشاط", value: businessName || "—" }, { label: "القطاع", value: sector || "—" }, { label: "الجمهور", value: targetAudience || "—" }].map(info => (
              <div key={info.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1.5 text-center">
                <p className="font-bold text-[9px] uppercase tracking-wider mb-0.5">{info.label}</p>
                <p className="text-[11px] text-black/60 dark:text-white/60 font-medium truncate">{info.value}</p>
              </div>
            ))}
          </div>
          <Button onClick={generate} disabled={loading} className="w-full gap-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold" data-testid="ai-generate-btn">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {loading ? "جارٍ التوليد..." : "اكتب لي وصف المشروع"}
          </Button>
          {generated && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 rounded-xl p-4">
                <p className="text-[10px] font-bold text-black dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Check className="w-3 h-3" /> تم التوليد
                </p>
                <Textarea value={generated} onChange={e => setGenerated(e.target.value)}
                  rows={5} className="rounded-xl resize-none text-sm" data-testid="ai-generated-text" />
              </div>
              <div className="flex gap-2">
                <Button onClick={generate} variant="outline" size="sm" className="gap-1.5 rounded-xl" data-testid="ai-retry-btn">
                  <RefreshCw className="w-3.5 h-3.5" /> إعادة التوليد
                </Button>
                <Button onClick={() => { onApply(generated); onClose(); }} className="flex-1 gap-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold" data-testid="ai-apply-btn">
                  <Check className="w-3.5 h-3.5" /> استخدم هذا الوصف
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectDetailsSetup() {
  const { dir } = useI18n();
  const [, params] = useRoute("/order-setup/:orderId");
  const orderId = params?.orderId || "";
  const { data: user } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [section, setSection] = useState(0);
  const [saved, setSaved] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [form, setForm] = useState({
    businessName: (user as any)?.businessName || (user as any)?.fullName || "",
    phone: (user as any)?.phone || "",
    sector: "",
    targetAudience: "",
    siteLanguage: "ar",
    whatsappIntegration: false,
    needsPayment: false,
    needsBooking: false,
    brandColor: "",
    requiredFunctions: "",
    // Documents
    logoUrl: "",
    commercialRegUrl: "",
    taxRegUrl: "",
    nationalIdUrl: "",
    ibanCertUrl: "",
  });

  const { data: sectorTemplates = [] } = useQuery<any[]>({
    queryKey: ["/api/templates"],
    staleTime: 5 * 60 * 1000,
  });

  const sectors = (sectorTemplates as any[])
    .filter((t: any) => t.slug)
    .map((t: any) => ({ value: t.slug, label: t.nameAr || t.name, icon: t.icon || "🏢" }));

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/orders/${orderId}/details`, form),
    onSuccess: () => {
      setSaved(true);
      toast({ title: "✅ تم حفظ مشروعك بنجاح!" });
      setTimeout(() => navigate("/dashboard"), 1800);
    },
    onError: () => toast({ title: "فشل الحفظ، حاول مجدداً", variant: "destructive" }),
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const canNext0 = !!form.businessName && !!form.sector;
  const canNext1 = !!form.siteLanguage;
  const isLast = section === SECTIONS.length - 1;

  const docsComplete = !!form.commercialRegUrl && !!form.nationalIdUrl;

  if (saved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black/[0.04] to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4" dir={dir}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-sm">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
            className="w-28 h-28 bg-gradient-to-br from-black to-gray-800 dark:from-white dark:to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
          >
            <BadgeCheck className="w-14 h-14 text-white dark:text-black" />
          </motion.div>
          <h2 className="text-3xl font-black text-black dark:text-white mb-2">تم بنجاح! 🎉</h2>
          <p className="text-black/50 dark:text-white/50 text-sm mb-1">تم حفظ تفاصيل مشروعك وإرسالها للفريق</p>
          <p className="text-black/30 dark:text-white/30 text-xs">جارٍ التوجيه للوحة التحكم...</p>
          <motion.div className="mt-6 flex justify-center gap-2">
            {[0,1,2].map(i => (
              <motion.div key={i} animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, delay: i * 0.2, duration: 0.8 }}
                className="w-2 h-2 bg-black/20 dark:bg-white/20 rounded-full" />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" dir={dir}>

      <AIWritingAssistant
        open={aiOpen} onClose={() => setAiOpen(false)}
        businessName={form.businessName} sector={form.sector}
        targetAudience={form.targetAudience} onApply={text => set("requiredFunctions", text)}
      />

      {/* Sticky header with progress */}
      <div className="sticky top-0 z-30 bg-black dark:bg-gray-950 shadow-2xl">
        <div className="max-w-2xl mx-auto px-4 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-white font-black text-lg leading-tight">تفاصيل مشروعك</h1>
              <p className="text-white/40 text-xs mt-0.5">{SECTIONS[section].desc}</p>
            </div>
            <div className="text-left">
              <p className="text-white/30 text-[10px] uppercase tracking-widest">خطوة</p>
              <p className="text-white font-black text-xl leading-none">{section + 1}<span className="text-white/30 text-sm font-normal">/{SECTIONS.length}</span></p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-1">
            {SECTIONS.map((s, i) => {
              const done = i < section;
              const active = i === section;
              const SIcon = s.icon;
              return (
                <div key={i} className={`flex items-center gap-1 ${i < SECTIONS.length - 1 ? "flex-1" : ""}`}>
                  <motion.div
                    animate={{ scale: active ? 1.1 : 1 }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
                      done ? "bg-white shadow-lg" : active ? "bg-white shadow-xl ring-2 ring-white/30" : "bg-white/10"
                    }`}
                    onClick={() => done && setSection(i)}
                  >
                    {done
                      ? <Check className="w-3.5 h-3.5 text-black" />
                      : <SIcon className={`w-3 h-3 ${active ? "text-black" : "text-white/30"}`} />
                    }
                  </motion.div>
                  {i < SECTIONS.length - 1 && (
                    <div className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/10">
                      <motion.div
                        animate={{ width: done ? "100%" : "0%" }}
                        transition={{ duration: 0.4 }}
                        className="h-full bg-white/60"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active step label */}
          <p className="text-white/50 text-[11px] mt-2 font-medium">{SECTIONS[section].label}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <AnimatePresence mode="wait">

          {/* ── Step 0: Business Info ── */}
          {section === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-5">
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-black/[0.06] dark:border-white/[0.06] p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center shadow-lg">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-black text-black dark:text-white text-base">بيانات النشاط التجاري</h2>
                    <p className="text-xs text-black/40 dark:text-white/40">أخبرنا عن مشروعك بدقة</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest mb-2 block">اسم النشاط / المشروع *</Label>
                      <Input value={form.businessName} onChange={e => set("businessName", e.target.value)}
                        placeholder="مثال: مطعم الأصالة" className="h-12 rounded-xl text-sm" data-testid="setup-input-name" />
                    </div>
                    <div>
                      <Label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest mb-2 block">رقم الجوال</Label>
                      <Input value={form.phone} onChange={e => set("phone", e.target.value)}
                        placeholder="05xxxxxxxx" className="h-12 rounded-xl text-sm" data-testid="setup-input-phone" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest mb-2 block">القطاع *</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {sectors.length > 0 ? sectors.map((s: any) => (
                        <button key={s.value} onClick={() => set("sector", s.value)}
                          data-testid={`setup-sector-${s.value}`}
                          className={`border-2 rounded-2xl p-3 text-center transition-all duration-200 ${
                            form.sector === s.value
                              ? "border-black dark:border-white bg-black dark:bg-white shadow-md scale-[1.02]"
                              : "border-black/[0.07] dark:border-white/[0.07] hover:border-black/20 dark:hover:border-white/20"
                          }`}>
                          <div className="text-2xl mb-1">{s.icon}</div>
                          <div className={`text-[10px] font-bold leading-tight ${form.sector === s.value ? "text-white dark:text-black" : "text-black/60 dark:text-white/60"}`}>{s.label}</div>
                        </button>
                      )) : (
                        <div className="col-span-full">
                          <Input value={form.sector} onChange={e => set("sector", e.target.value)}
                            placeholder="اكتب القطاع..." className="h-12 rounded-xl" data-testid="setup-input-sector" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest mb-2 block">الجمهور المستهدف</Label>
                    <Input value={form.targetAudience} onChange={e => set("targetAudience", e.target.value)}
                      placeholder="مثال: شباب 18-35، عائلات، رجال أعمال..." className="h-12 rounded-xl text-sm" data-testid="setup-input-audience" />
                  </div>
                </div>
              </div>

              <Button onClick={() => setSection(1)} disabled={!canNext0}
                className="w-full h-13 py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black gap-2 shadow-lg hover:shadow-xl transition-all" data-testid="setup-btn-next-0">
                التالي — اللغة <ChevronLeft className="w-4 h-4" />
              </Button>
              <button onClick={() => navigate("/dashboard")} className="w-full text-center text-xs text-black/25 dark:text-white/25 hover:text-black/50 dark:hover:text-white/50 py-2 transition-colors">
                أكمل لاحقاً من لوحة التحكم ←
              </button>
            </motion.div>
          )}

          {/* ── Step 1: Language ── */}
          {section === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-5">
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-black/[0.06] dark:border-white/[0.06] p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center shadow-lg">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-black text-black dark:text-white text-base">لغة الموقع / النظام</h2>
                    <p className="text-xs text-black/40 dark:text-white/40">اختر لغة واجهة النظام الذي سنبنيه لك</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {LANGUAGES.map(lang => (
                    <button key={lang.v} onClick={() => set("siteLanguage", lang.v)}
                      data-testid={`setup-lang-${lang.v}`}
                      className={`border-2 rounded-2xl py-6 px-2 text-center transition-all duration-200 ${
                        form.siteLanguage === lang.v
                          ? "border-black dark:border-white bg-black dark:bg-white shadow-xl scale-[1.02]"
                          : "border-black/[0.07] dark:border-white/[0.07] hover:border-black/20 dark:hover:border-white/20"
                      }`}>
                      <div className="text-4xl mb-3">{lang.flag}</div>
                      <div className={`text-sm font-black ${form.siteLanguage === lang.v ? "text-white dark:text-black" : "text-black/70 dark:text-white/70"}`}>{lang.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSection(0)} className="h-13 py-4 px-5 rounded-2xl" data-testid="setup-btn-back-1">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button onClick={() => setSection(2)} disabled={!canNext1}
                  className="flex-1 h-13 py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black gap-2 shadow-lg" data-testid="setup-btn-next-1">
                  التالي — التكاملات <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
              <button onClick={() => navigate("/dashboard")} className="w-full text-center text-xs text-black/25 dark:text-white/25 hover:text-black/50 dark:hover:text-white/50 py-2 transition-colors">
                أكمل لاحقاً ←
              </button>
            </motion.div>
          )}

          {/* ── Step 2: Integrations ── */}
          {section === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-5">
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-black/[0.06] dark:border-white/[0.06] p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center shadow-lg">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-black text-black dark:text-white text-base">التكاملات المطلوبة</h2>
                    <p className="text-xs text-black/40 dark:text-white/40">اختر الأنظمة — يمكن تعديلها لاحقاً</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {INTEGRATIONS.map(({ key, label, desc, icon: Icon }) => {
                    const active = (form as any)[key];
                    return (
                      <button key={key} onClick={() => set(key, !active)}
                        data-testid={`setup-integration-${key}`}
                        className={`w-full text-right rounded-2xl p-4 border-2 flex items-center gap-4 transition-all duration-200 ${
                          active ? "border-black dark:border-white bg-black dark:bg-white shadow-md" : "border-black/[0.07] dark:border-white/[0.07] hover:border-black/20 dark:hover:border-white/20"
                        }`}>
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${active ? "bg-white/20 dark:bg-black/20" : "bg-black/[0.04] dark:bg-white/[0.04]"}`}>
                          <Icon className={`w-5 h-5 ${active ? "text-white dark:text-black" : "text-black/30 dark:text-white/30"}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-bold text-sm ${active ? "text-white dark:text-black" : "text-black/70 dark:text-white/70"}`}>{label}</p>
                          <p className={`text-xs mt-0.5 ${active ? "text-white/60 dark:text-black/60" : "text-black/30 dark:text-white/30"}`}>{desc}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${active ? "border-white dark:border-black bg-white dark:bg-black" : "border-black/[0.15] dark:border-white/[0.15]"}`}>
                          {active && <Check className="w-3 h-3 text-black dark:text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSection(1)} className="h-13 py-4 px-5 rounded-2xl" data-testid="setup-btn-back-2">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button onClick={() => setSection(3)}
                  className="flex-1 h-13 py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black gap-2 shadow-lg" data-testid="setup-btn-next-2">
                  التالي — فكرتك <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
              <button onClick={() => navigate("/dashboard")} className="w-full text-center text-xs text-black/25 dark:text-white/25 hover:text-black/50 dark:hover:text-white/50 py-2 transition-colors">
                أكمل لاحقاً ←
              </button>
            </motion.div>
          )}

          {/* ── Step 3: Idea & Requirements ── */}
          {section === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-5">
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-black/[0.06] dark:border-white/[0.06] p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center shadow-lg">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-black text-black dark:text-white text-base">فكرتك ومتطلباتك</h2>
                    <p className="text-xs text-black/40 dark:text-white/40">صف رؤيتك بوضوح لنبنيها لك بدقة</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest mb-2 block">ألوان البراند المفضّلة</Label>
                    <Input value={form.brandColor} onChange={e => set("brandColor", e.target.value)}
                      placeholder="مثال: أزرق وذهبي، أخضر داكن، أسود وأبيض..." className="h-12 rounded-xl text-sm" data-testid="setup-input-color" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest">فكرة مشروعك ومتطلباتك</Label>
                      <button onClick={() => setAiOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-[10px] font-black rounded-lg transition-opacity hover:opacity-80 shadow-md"
                        data-testid="setup-ai-helper-btn">
                        <Sparkles className="w-3 h-3" /> مساعد AI
                      </button>
                    </div>
                    <Textarea value={form.requiredFunctions} onChange={e => set("requiredFunctions", e.target.value)}
                      placeholder="صف فكرة مشروعك — ماذا تريد أن يفعل النظام؟ من سيستخدمه؟ ما الميزات المهمة لك؟ أو اضغط 'مساعد AI' وسيساعدك..."
                      rows={7} className="rounded-xl resize-none text-sm" data-testid="setup-input-notes" />
                    <p className="text-[11px] text-black/25 dark:text-white/25 mt-1.5">💡 كلما كانت التفاصيل أدق، كان مشروعك أفضل وأسرع في التنفيذ</p>
                  </div>
                </div>
              </div>

              {/* Summary preview */}
              <div className="bg-black dark:bg-white rounded-2xl p-4">
                <p className="text-[10px] font-black text-white/40 dark:text-black/40 uppercase tracking-widest mb-3">ملخص ما سيُرسل للفريق</p>
                <div className="space-y-2">
                  {[
                    { label: "النشاط", val: form.businessName },
                    { label: "القطاع", val: form.sector },
                    { label: "اللغة", val: LANGUAGES.find(l => l.v === form.siteLanguage)?.label },
                    { label: "التكاملات", val: INTEGRATIONS.filter(i => (form as any)[i.key]).map(i => i.label).join("، ") || "لا يوجد" },
                    { label: "الوصف", val: form.requiredFunctions ? form.requiredFunctions.slice(0, 60) + (form.requiredFunctions.length > 60 ? "..." : "") : undefined },
                  ].map(r => r.val && (
                    <div key={r.label} className="flex items-start gap-2 text-xs">
                      <span className="text-white/40 dark:text-black/40 font-bold shrink-0 w-16">{r.label}</span>
                      <span className="text-white dark:text-black font-medium">{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSection(2)} className="h-13 py-4 px-5 rounded-2xl" data-testid="setup-btn-back-3">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button onClick={() => setSection(4)}
                  className="flex-1 h-13 py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black gap-2 shadow-lg" data-testid="setup-btn-next-3">
                  التالي — الوثائق <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
              <button onClick={() => navigate("/dashboard")} className="w-full text-center text-xs text-black/25 dark:text-white/25 hover:text-black/50 dark:hover:text-white/50 py-2 transition-colors">
                أكمل لاحقاً ←
              </button>
            </motion.div>
          )}

          {/* ── Step 4: Official Documents ── */}
          {section === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-4">

              {/* Header card */}
              <div className="bg-gradient-to-br from-black to-gray-800 dark:from-white dark:to-gray-200 rounded-3xl p-6 shadow-xl overflow-hidden relative">
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)", backgroundSize: "20px 20px" }} />
                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 dark:bg-black/20 rounded-2xl flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-white dark:text-black" />
                  </div>
                  <div>
                    <h2 className="font-black text-white dark:text-black text-lg leading-tight mb-1">الوثائق الرسمية</h2>
                    <p className="text-white/60 dark:text-black/60 text-xs leading-relaxed">
                      ارفع وثائق نشاطك التجاري — تُستخدم لإتمام التعاقد وإعداد الأنظمة بشكل صحيح.
                      جميع الملفات مؤمّنة ومشفّرة.
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${form.commercialRegUrl ? "bg-green-400" : "bg-white/20 dark:bg-black/20"}`} />
                        <span className="text-[10px] text-white/50 dark:text-black/50">سجل تجاري</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${form.nationalIdUrl ? "bg-green-400" : "bg-white/20 dark:bg-black/20"}`} />
                        <span className="text-[10px] text-white/50 dark:text-black/50">هوية</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${form.taxRegUrl ? "bg-green-400" : "bg-white/20 dark:bg-black/20"}`} />
                        <span className="text-[10px] text-white/50 dark:text-black/50">ضريبي</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${form.ibanCertUrl ? "bg-green-400" : "bg-white/20 dark:bg-black/20"}`} />
                        <span className="text-[10px] text-white/50 dark:text-black/50">إيبان</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document upload cards */}
              <div className="space-y-3">
                {DOC_TYPES.map(docType => (
                  <DocUploadCard
                    key={docType.key}
                    docType={docType}
                    value={(form as any)[docType.key]}
                    onChange={(url: string) => set(docType.key, url)}
                  />
                ))}
              </div>

              {/* Required warning */}
              {!docsComplete && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <span className="font-bold">الحقول المطلوبة:</span> السجل التجاري والهوية الوطنية مطلوبان لإتمام التقديم. يمكنك رفع الباقي لاحقاً.
                  </p>
                </motion.div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSection(3)} className="h-13 py-4 px-5 rounded-2xl" data-testid="setup-btn-back-4">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || !docsComplete}
                  className="flex-1 h-13 py-4 rounded-2xl bg-gradient-to-r from-black to-gray-800 dark:from-white dark:to-gray-200 text-white dark:text-black font-black gap-2 shadow-xl disabled:opacity-50"
                  data-testid="setup-btn-save"
                >
                  {saveMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الحفظ...</>
                    : <><BadgeCheck className="w-4 h-4" /> إرسال وانطلق!</>
                  }
                </Button>
              </div>
              <button onClick={() => navigate("/dashboard")} className="w-full text-center text-xs text-black/25 dark:text-white/25 hover:text-black/50 dark:hover:text-white/50 py-2 transition-colors">
                أكمل الوثائق لاحقاً من لوحة التحكم ←
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
