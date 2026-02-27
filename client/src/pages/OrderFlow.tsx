import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useUser } from "@/hooks/use-auth";
import { useService, useServices } from "@/hooks/use-services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, CheckCircle, ArrowLeft, ArrowRight, Check, Briefcase,
  Upload, X, FileText, Image, Film, CreditCard,
  Globe, Store, GraduationCap, UtensilsCrossed, Building2, Heart,
  Dumbbell, MapPin, Laptop, Smartphone, ShoppingBag, BookOpen,
  Layers, Palette, Zap, Star, Package, BarChart, Shield, Sparkles,
  Map, Navigation2, Flag, Compass, Coffee, Copy, ClipboardCheck, ArrowUpRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_BANK = { bankName: "بنك الراجحي", beneficiaryName: "QIROX Studio", iban: "SA0380205098017222121010", notes: "" };

interface UploadedFile {
  url: string;
  filename: string;
  size: number;
}

function FileUploadField({ label, field, files, onUpload, onRemove, required }: {
  label: string;
  field: string;
  files: UploadedFile[];
  onUpload: (field: string, file: File) => void;
  onRemove: (field: string, index: number) => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { t } = useI18n();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await onUpload(field, file);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return <Image className="w-4 h-4 text-black/40" />;
    if (['mp4', 'mov', 'avi'].includes(ext)) return <Film className="w-4 h-4 text-purple-600" />;
    return <FileText className="w-4 h-4 text-green-600" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <Label className="text-sm mb-2 block text-black/60 font-medium">
        {label}
        {required && <span className="text-red-400 mr-1">*</span>}
      </Label>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className="border-2 border-dashed border-black/[0.08] rounded-2xl p-6 text-center cursor-pointer hover:border-black/[0.2] hover:bg-black/[0.02] transition-all group"
        data-testid={`upload-${field}`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="w-5 h-5 animate-spin text-black/40" />
            <span className="text-sm text-black/40">جاري الرفع...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="w-10 h-10 rounded-xl bg-black/[0.04] flex items-center justify-center group-hover:bg-black/[0.07] transition-colors">
              <Upload className="w-5 h-5 text-black/25 group-hover:text-black/40 transition-colors" />
            </div>
            <span className="text-xs text-black/35 group-hover:text-black/50 transition-colors">{t("order.uploadClick")}</span>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 bg-black/[0.03] rounded-xl px-3 py-2 border border-black/[0.06]">
              {getFileIcon(f.filename)}
              <span className="text-xs text-black/60 flex-1 truncate">{f.filename}</span>
              <span className="text-[10px] text-black/25">{formatSize(f.size)}</span>
              <button
                onClick={() => onRemove(field, i)}
                className="text-red-500/60 hover:text-red-500 transition-colors"
                data-testid={`remove-file-${field}-${i}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const STEP_CONFIG = [
  { icon: Compass, label: "نوع المشروع", labelEn: "Project Type" },
  { icon: Sparkles, label: "المميزات", labelEn: "Features" },
  { icon: Package, label: "الملفات", labelEn: "Files" },
  { icon: CreditCard, label: "الدفع", labelEn: "Payment" },
  { icon: Flag, label: "المراجعة", labelEn: "Review" },
];

const PROJECT_TYPES = [
  { value: "website", label: "موقع ويب", icon: Globe, desc: "موقع احترافي يعرض نشاطك" },
  { value: "ecommerce", label: "متجر إلكتروني", icon: ShoppingBag, desc: "منصة بيع كاملة مع سلة" },
  { value: "webapp", label: "تطبيق ويب", icon: Laptop, desc: "نظام ذكي على المتصفح" },
  { value: "mobile_app", label: "تطبيق جوال", icon: Smartphone, desc: "iOS + Android App Store" },
  { value: "landing_page", label: "صفحة هبوط", icon: Zap, desc: "صفحة تسويقية مركّزة" },
  { value: "platform", label: "منصة متكاملة", icon: Layers, desc: "نظام شامل متعدد الأدوار" },
  { value: "system", label: "نظام إداري", icon: BarChart, desc: "لوحة إدارة ومتابعة" },
];

const SECTORS = [
  { value: "restaurant", label: "مطاعم وكافيهات", icon: UtensilsCrossed, desc: "QR Menu، POS، KDS" },
  { value: "store", label: "متاجر إلكترونية", icon: Store, desc: "منتجات، سلة، مدفوعات" },
  { value: "education", label: "تعليم وأكاديميات", icon: GraduationCap, desc: "LMS، بث، شهادات" },
  { value: "health", label: "صحة ولياقة", icon: Dumbbell, desc: "حجوزات، برامج، متابعة" },
  { value: "realestate", label: "عقارات", icon: Building2, desc: "قوائم، خرائط، جولات 360" },
  { value: "other", label: "شركات ومؤسسات", icon: Globe, desc: "CRM، HR، بوابة عملاء" },
];

const SECTOR_FEATURES: Record<string, { id: string; label: string; icon: any }[]> = {
  restaurant: [
    { id: "qr_menu", label: "قائمة QR تفاعلية", icon: Coffee },
    { id: "order_system", label: "استقبال الطلبات إلكترونياً", icon: Package },
    { id: "kds", label: "شاشة المطبخ (KDS)", icon: Laptop },
    { id: "delivery", label: "التوصيل وتتبع الطلبات", icon: MapPin },
    { id: "booking", label: "حجز مسبق للطاولات", icon: BookOpen },
    { id: "loyalty", label: "برنامج الولاء والنقاط", icon: Star },
    { id: "branches", label: "إدارة الفروع المتعددة", icon: Building2 },
    { id: "pos", label: "نقطة البيع (POS)", icon: CreditCard },
    { id: "coupons", label: "كوبونات وعروض خاصة", icon: Zap },
    { id: "reports", label: "تقارير المبيعات اليومية", icon: BarChart },
    { id: "whatsapp_order", label: "الطلب عبر واتساب", icon: Globe },
    { id: "mobile_app", label: "تطبيق جوال للعملاء", icon: Smartphone },
    { id: "staff_mgmt", label: "إدارة الموظفين", icon: Shield },
    { id: "epayment", label: "Apple Pay / STC Pay", icon: CreditCard },
  ],
  store: [
    { id: "cart", label: "سلة مشتريات متكاملة", icon: ShoppingBag },
    { id: "epayment", label: "Apple Pay / STC Pay", icon: CreditCard },
    { id: "inventory", label: "إدارة المخزون والمستودعات", icon: Package },
    { id: "coupons", label: "كوبونات وخصومات", icon: Zap },
    { id: "shipping", label: "تتبع الشحن والتوصيل", icon: MapPin },
    { id: "reviews", label: "تقييم ومراجعة المنتجات", icon: Star },
    { id: "filters", label: "فلترة وتصنيف المنتجات", icon: Layers },
    { id: "loyalty", label: "برنامج الولاء والنقاط", icon: Heart },
    { id: "installment", label: "الدفع بالتقسيط", icon: BarChart },
    { id: "reports", label: "تقارير المبيعات التفصيلية", icon: BarChart },
    { id: "returns", label: "إدارة الإرجاع والاستبدال", icon: ArrowRight },
    { id: "mobile_app", label: "تطبيق جوال للمتجر", icon: Smartphone },
    { id: "push_notif", label: "إشعارات فورية للعملاء", icon: Zap },
    { id: "social_shop", label: "ربط السوشيال ميديا", icon: Globe },
  ],
  education: [
    { id: "lms", label: "منصة إدارة تعليمية (LMS)", icon: BookOpen },
    { id: "live", label: "بث مباشر للدروس", icon: Laptop },
    { id: "quizzes", label: "اختبارات تفاعلية", icon: Zap },
    { id: "certificates", label: "شهادات إلكترونية تلقائية", icon: Star },
    { id: "rooms", label: "غرف اجتماعات افتراضية", icon: Globe },
    { id: "recordings", label: "تسجيل الدروس وحفظها", icon: Film },
    { id: "subscriptions", label: "نظام الدفع للدورات", icon: CreditCard },
    { id: "students", label: "إدارة الطلاب والمجموعات", icon: GraduationCap },
    { id: "forum", label: "منتدى نقاش للطلاب", icon: Globe },
    { id: "mobile_app", label: "تطبيق جوال", icon: Smartphone },
    { id: "reports", label: "تقارير الأداء والتقدم", icon: BarChart },
  ],
  health: [
    { id: "booking", label: "حجز مواعيد ذكي", icon: BookOpen },
    { id: "client_tracking", label: "متابعة تقدم العملاء", icon: BarChart },
    { id: "programs", label: "برامج تدريبية مخصصة", icon: Dumbbell },
    { id: "epayment", label: "الدفع الإلكتروني للاشتراكات", icon: CreditCard },
    { id: "reminders", label: "إشعارات تذكير تلقائية", icon: Zap },
    { id: "reports", label: "تقارير الأداء والإحصاءات", icon: BarChart },
    { id: "staff_mgmt", label: "إدارة الموظفين والمدربين", icon: Shield },
    { id: "mobile_app", label: "تطبيق جوال", icon: Smartphone },
    { id: "diet", label: "خطط غذائية وتغذية", icon: Heart },
    { id: "online_consult", label: "استشارات إلكترونية", icon: Globe },
  ],
  realestate: [
    { id: "listings", label: "قائمة عقارات مع فلترة", icon: Building2 },
    { id: "virtual_tour", label: "جولات افتراضية 360°", icon: Compass },
    { id: "inquiry", label: "نظام حجز وتواصل فوري", icon: Globe },
    { id: "compare", label: "مقارنة العقارات", icon: Layers },
    { id: "maps", label: "خرائط تفاعلية", icon: MapPin },
    { id: "agents", label: "إدارة الوكلاء / المعلنين", icon: Shield },
    { id: "reports", label: "تقارير الطلبات والاهتمام", icon: BarChart },
    { id: "mortgage_calc", label: "حاسبة التمويل والرهن", icon: CreditCard },
    { id: "mobile_app", label: "تطبيق جوال", icon: Smartphone },
  ],
  other: [
    { id: "contact_form", label: "نموذج تواصل متقدم", icon: Globe },
    { id: "multilang", label: "واجهة متعددة اللغات", icon: Globe },
    { id: "blog", label: "مدونة / نظام محتوى", icon: BookOpen },
    { id: "seo", label: "تحسين محركات البحث SEO", icon: Zap },
    { id: "admin_panel", label: "لوحة إدارة للمحتوى", icon: Layers },
    { id: "analytics", label: "ربط Google Analytics", icon: BarChart },
    { id: "live_chat", label: "دردشة مباشرة مع الزوار", icon: Globe },
    { id: "email_marketing", label: "التسويق عبر البريد", icon: Zap },
    { id: "social_feed", label: "عرض السوشيال ميديا", icon: Globe },
    { id: "whatsapp", label: "ربط واتساب", icon: Globe },
    { id: "booking", label: "نظام حجز / مواعيد", icon: BookOpen },
  ],
};

const VISUAL_STYLES = [
  { value: "luxury", label: "فاخر وراقي", desc: "أسود، ذهبي، رمادي داكن" },
  { value: "modern", label: "حديث ونظيف", desc: "أبيض، رمادي فاتح، أزرق" },
  { value: "bold", label: "جريء وملفت", desc: "ألوان زاهية وجريئة" },
  { value: "minimal", label: "بسيط ومينيمال", desc: "قليل الألوان، واضح" },
  { value: "classic", label: "كلاسيكي أنيق", desc: "بيج، بني، تراثي" },
  { value: "custom", label: "حسب هويتي", desc: "ألواني وخطوطي الخاصة" },
];

export default function OrderFlow() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const serviceIdFromUrl = searchParams.get("service") || "";
  const [selectedServiceId, setSelectedServiceId] = useState(serviceIdFromUrl);
  const { t, lang } = useI18n();

  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: services, isLoading: isServicesLoading } = useServices();
  const { data: service, isLoading: isServiceLoading } = useService(selectedServiceId);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: bankSettings } = useQuery<typeof DEFAULT_BANK>({
    queryKey: ["/api/bank-settings"],
  });
  const bank = bankSettings || DEFAULT_BANK;

  const [step, setStep] = useState(1);
  const [submittedOrder, setSubmittedOrder] = useState<{ id: string; amount: number } | null>(null);
  const [postProofFiles, setPostProofFiles] = useState<UploadedFile[]>([]);
  const [copiedIban, setCopiedIban] = useState(false);

  const copyIban = () => {
    navigator.clipboard.writeText(bank.iban).then(() => {
      setCopiedIban(true);
      setTimeout(() => setCopiedIban(false), 2500);
    });
  };

  const [formData, setFormData] = useState({
    projectType: "",
    sector: "",
    sectorFeatures: [] as string[],
    competitors: "",
    visualStyle: "",
    favoriteExamples: "",
    requiredFunctions: "",
    businessName: "",
    targetAudience: "",
    siteLanguage: "ar",
    whatsappIntegration: false,
    socialIntegration: false,
    hasLogo: false,
    needsLogoDesign: false,
    hasHosting: false,
    hasDomain: false,
    accessCredentials: "",
    paymentMethod: "bank_transfer",
    paymentProofUrl: ""
  });

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile[]>>({
    logo: [],
    brandIdentity: [],
    content: [],
    images: [],
    video: [],
    paymentProof: [],
  });

  const toggleFeature = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      sectorFeatures: prev.sectorFeatures.includes(featureId)
        ? prev.sectorFeatures.filter(f => f !== featureId)
        : [...prev.sectorFeatures, featureId],
    }));
  };

  const handleFileUpload = async (field: string, file: File) => {
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formDataUpload });
      if (!res.ok) throw new Error("Upload failed");
      const data: UploadedFile = await res.json();
      setUploadedFiles(prev => ({ ...prev, [field]: [...(prev[field] || []), data] }));
    } catch {
      toast({ title: t("order.error"), description: "Upload failed", variant: "destructive" });
    }
  };

  const handleFileRemove = (field: string, index: number) => {
    setUploadedFiles(prev => ({ ...prev, [field]: (prev[field] || []).filter((_, i) => i !== index) }));
  };

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: (order: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setSubmittedOrder({ id: order.id || order._id, amount: order.totalAmount || service?.priceMin || 0 });
    },
    onError: () => {
      toast({ title: t("order.error"), description: t("order.errorDesc"), variant: "destructive" });
    },
  });

  const uploadProofMutation = useMutation({
    mutationFn: async ({ orderId, proofUrl }: { orderId: string; proofUrl: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}`, { paymentProofUrl: proofUrl, isDepositPaid: false });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "تم إرفاق إيصال التحويل ✓", description: "سيراجع فريقنا الإيصال ويبدأ العمل قريباً" });
    },
    onError: () => toast({ title: "فشل رفع الإيصال", variant: "destructive" }),
  });

  const handlePostProofUpload = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form, credentials: "include" });
      if (!res.ok) throw new Error();
      const data: UploadedFile = await res.json();
      setPostProofFiles(prev => [...prev, data]);
      if (submittedOrder?.id) {
        uploadProofMutation.mutate({ orderId: submittedOrder.id, proofUrl: data.url });
      }
    } catch {
      toast({ title: "فشل رفع الملف", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!isUserLoading && !user) setLocation("/login");
  }, [user, isUserLoading, setLocation]);

  if (isUserLoading || isServicesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-black/40 mx-auto mb-4" />
          <p className="text-black/30 text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // ── POST-SUBMISSION PAYMENT CONFIRMATION SCREEN ──────────────────────────
  if (submittedOrder) {
    const proofUploaded = postProofFiles.length > 0;
    const postProofInputRef = { current: null as HTMLInputElement | null };

    return (
      <div className="min-h-screen flex flex-col bg-[#f9f9f9]" dir="rtl">
        <Navigation />
        <div className="flex-1 pt-24 pb-16 flex items-start justify-center">
          <div className="w-full max-w-lg mx-auto px-4 pt-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              {/* Success Header */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-black mb-5">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-black text-black mb-2">تم إرسال طلبك بنجاح! 🎉</h1>
                <p className="text-black/40 text-sm">
                  رقم الطلب:
                  <span className="font-mono font-bold text-black mr-1.5">#{submittedOrder.id?.toString().slice(-8).toUpperCase()}</span>
                </p>
              </div>

              {/* Payment Required Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <span className="text-amber-500 text-xl flex-shrink-0 mt-0.5">⏳</span>
                <div>
                  <p className="text-amber-800 text-sm font-bold mb-1">بانتظار تأكيد التحويل</p>
                  <p className="text-amber-700 text-xs leading-relaxed">
                    قم بتحويل الدفعة الأولى إلى الحساب البنكي أدناه وارفع صورة/ملف الإيصال — سنبدأ العمل فور التأكيد.
                  </p>
                </div>
              </div>

              {/* Bank Card */}
              <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden shadow-sm">
                <div className="bg-black px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">بيانات التحويل البنكي</p>
                      <p className="text-white text-xl font-black">{bank.bankName}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white/60" />
                    </div>
                  </div>
                </div>
                <div className="px-6 py-5 space-y-3">
                  {[
                    { label: "البنك", value: bank.bankName },
                    { label: "اسم المستفيد", value: bank.beneficiaryName },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between py-2 border-b border-black/[0.04] last:border-0">
                      <span className="text-xs text-black/40">{row.label}</span>
                      <span className="text-sm font-semibold text-black">{row.value}</span>
                    </div>
                  ))}
                  {/* IBAN Row with Copy */}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-black/40">رقم IBAN</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-black" dir="ltr">{bank.iban}</span>
                      <button
                        onClick={copyIban}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${copiedIban ? 'bg-green-100 text-green-600' : 'bg-black/[0.05] text-black/40 hover:bg-black/10 hover:text-black'}`}
                        data-testid="button-copy-iban"
                        title="نسخ IBAN"
                      >
                        {copiedIban ? <ClipboardCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {copiedIban && (
                    <p className="text-[11px] text-green-600 text-center font-medium">✓ تم نسخ رقم IBAN</p>
                  )}
                </div>
              </div>

              {/* Upload Proof Section */}
              <div className="bg-white rounded-2xl border border-black/[0.07] p-6 shadow-sm">
                <p className="text-sm font-bold text-black mb-1">ارفع إيصال التحويل</p>
                <p className="text-xs text-black/40 mb-4">صورة أو PDF لإيصال التحويل من تطبيق/موقع البنك</p>

                {postProofFiles.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {postProofFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200/60">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-green-800 truncate">{f.filename}</p>
                          <p className="text-[10px] text-green-600">تم الرفع بنجاح ✓</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                <label
                  className={`flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                    uploadProofMutation.isPending
                      ? 'border-black/10 bg-black/[0.02]'
                      : 'border-black/[0.10] hover:border-black/30 hover:bg-black/[0.02]'
                  }`}
                  data-testid="upload-post-proof"
                >
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    disabled={uploadProofMutation.isPending}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) await handlePostProofUpload(file);
                      e.target.value = "";
                    }}
                  />
                  {uploadProofMutation.isPending ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-black/30" />
                      <p className="text-xs text-black/30">جاري الرفع...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-black/[0.05] flex items-center justify-center">
                        <Upload className="w-5 h-5 text-black/40" />
                      </div>
                      <p className="text-sm font-semibold text-black/60">اضغط لرفع الإيصال</p>
                      <p className="text-xs text-black/30">PNG, JPG, PDF — حجم أقصى 10 MB</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pb-8">
                <Button
                  onClick={() => {
                    toast({ title: proofUploaded ? "✅ شكراً! سنبدأ العمل قريباً" : "يمكنك رفع الإيصال لاحقاً من لوحتك" });
                    setLocation("/dashboard");
                  }}
                  className="w-full h-12 bg-black text-white rounded-xl font-bold hover:bg-gray-900 gap-2"
                  data-testid="button-go-to-dashboard"
                >
                  {proofUploaded ? <CheckCircle className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  {proofUploaded ? "رائع! انتقل إلى لوحة التحكم" : "المتابعة إلى لوحة التحكم"}
                </Button>
                {!proofUploaded && (
                  <p className="text-center text-xs text-black/30">
                    يمكنك رفع الإيصال لاحقاً من لوحة التحكم — لكن العمل لن يبدأ إلا بعد التأكيد
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!selectedServiceId || !service) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navigation />
        <div className="flex-1 container mx-auto px-4 py-8 pt-32 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-black/[0.02] mb-6">
              <Briefcase className="w-3.5 h-3.5 text-black/40" />
              <span className="text-black/40 text-xs tracking-wider uppercase">اختر خدمتك</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black font-heading text-black mb-4">
              ما الذي تريد بناءه؟
            </h1>
            <p className="text-black/35 text-lg">اختر الخدمة التي تناسب مشروعك لنبدأ رحلتنا معاً</p>
          </div>

          {services && services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((svc) => (
                <motion.button
                  key={svc.id}
                  onClick={() => setSelectedServiceId(String(svc.id))}
                  whileHover={{ scale: 1.01, y: -2 }}
                  className="border border-black/[0.07] bg-white p-7 rounded-2xl text-right hover:border-black/20 hover:shadow-xl hover:shadow-black/[0.05] transition-all group"
                  data-testid={`select-service-${svc.id}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-black/[0.04] flex items-center justify-center mb-5 group-hover:bg-black transition-colors">
                    <Briefcase className="w-5 h-5 text-black/40 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-black mb-2">{svc.title}</h3>
                  <p className="text-sm text-black/35 line-clamp-2 mb-4">{svc.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-black/[0.04] text-black/40 border border-black/[0.07]">
                      {svc.category}
                    </span>
                    <span className="text-sm font-black text-black">
                      {svc.priceMin?.toLocaleString()} ر.س
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-black/40 text-lg mb-4">{t("order.serviceNotFound")}</p>
              <Button onClick={() => setLocation("/services")} className="premium-btn" data-testid="button-back-services">
                {t("order.backToServices")}
              </Button>
            </div>
          )}
        </div>
        <Footer />
      </div>
    );
  }

  const handleNext = () => {
    if (step === 1) {
      if (!formData.projectType) {
        toast({ title: "⚠️ حقل مطلوب", description: "الرجاء اختيار نوع المشروع", variant: "destructive" });
        return;
      }
      if (!formData.sector) {
        toast({ title: "⚠️ حقل مطلوب", description: "الرجاء اختيار قطاع النشاط", variant: "destructive" });
        return;
      }
      if (!formData.businessName.trim()) {
        toast({ title: "⚠️ حقل مطلوب", description: "الرجاء إدخال اسم النشاط التجاري", variant: "destructive" });
        return;
      }
    }
    if (step === 2) {
      if (formData.sectorFeatures.length === 0) {
        toast({ title: "⚠️ حقل مطلوب", description: "الرجاء اختيار ميزة واحدة على الأقل", variant: "destructive" });
        return;
      }
      if (!formData.visualStyle) {
        toast({ title: "⚠️ حقل مطلوب", description: "الرجاء اختيار النمط البصري المطلوب", variant: "destructive" });
        return;
      }
      if (!formData.targetAudience.trim()) {
        toast({ title: "⚠️ حقل مطلوب", description: "الرجاء تحديد الجمهور المستهدف", variant: "destructive" });
        return;
      }
    }
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = () => {
    const filesPayload: Record<string, string[]> = {};
    Object.entries(uploadedFiles).forEach(([key, files]) => {
      if (files.length > 0) filesPayload[key] = files.map(f => f.url);
    });

    createOrderMutation.mutate({
      serviceId: service.id,
      ...formData,
      files: filesPayload,
      status: "pending",
      isDepositPaid: false,
      totalAmount: service.priceMin
    });
  };

  const progressPct = (step / 5) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f9f9]" dir="rtl">
      <Navigation />

      <div className="flex-1 pt-24 pb-16">
        {/* Journey Map Header */}
        <div className="bg-white border-b border-black/[0.06] py-8 mb-8 shadow-sm">
          <div className="container mx-auto px-4 max-w-4xl">
            {/* Service info */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center">
                  <Map className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[11px] text-black/30 uppercase tracking-wider font-semibold">خريطة رحلة مشروعك</p>
                  <p className="text-sm font-bold text-black">{service.title}</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-[11px] text-black/30">السعر يبدأ من</p>
                <p className="text-lg font-black text-black">{service.priceMin?.toLocaleString()} <span className="text-sm font-medium text-black/40">ر.س</span></p>
              </div>
            </div>

            {/* Step journey map */}
            <div className="relative">
              {/* Progress bar */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-black/[0.06] -z-10" />
              <div
                className="absolute top-5 right-0 h-0.5 bg-black transition-all duration-500 -z-0"
                style={{ width: `${((step - 1) / 4) * 100}%`, left: "auto" }}
              />

              <div className="flex items-start justify-between">
                {STEP_CONFIG.map((s, idx) => {
                  const stepNum = idx + 1;
                  const isCompleted = step > stepNum;
                  const isActive = step === stepNum;
                  const StepIcon = s.icon;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 flex-1" data-testid={`step-indicator-${stepNum}`}>
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-2 ${
                        isCompleted
                          ? "bg-black border-black text-white scale-100"
                          : isActive
                          ? "bg-black border-black text-white scale-110 shadow-lg shadow-black/20"
                          : "bg-white border-black/[0.12] text-black/25"
                      }`}>
                        {isCompleted ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <StepIcon className={`w-4 h-4 ${isActive ? "text-white" : "text-black/25"}`} />
                        )}
                      </div>
                      <span className={`text-[10px] md:text-xs font-semibold text-center leading-tight transition-colors ${
                        isActive ? "text-black" : isCompleted ? "text-black/50" : "text-black/25"
                      }`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="container mx-auto px-4 max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Step 1 — Project Type & Sector */}
              {step === 1 && (
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/[0.04] border border-black/[0.06] mb-3">
                      <Compass className="w-3.5 h-3.5 text-black/40" />
                      <span className="text-xs text-black/40 font-medium">الخطوة 1 من 5</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-black mb-2">حدّد طبيعة مشروعك</h2>
                    <p className="text-black/40 text-sm">كلما كانت المعلومات أدق، كان النظام أكثر توافقاً معك</p>
                  </div>

                  {/* Business Name */}
                  <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm">
                    <Label className="text-sm font-bold text-black mb-1 block">
                      اسم نشاطك التجاري <span className="text-red-400">*</span>
                    </Label>
                    <p className="text-xs text-black/35 mb-3">الاسم الذي سيظهر في الموقع / التطبيق</p>
                    <Input
                      placeholder="مثال: كافيه الجوهرة، متجر النخبة، أكاديمية المستقبل..."
                      className="bg-black/[0.02] border-black/[0.08] text-black h-12 rounded-xl text-base"
                      value={formData.businessName}
                      onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                      data-testid="input-businessName"
                    />
                  </div>

                  {/* Project Type — Visual Cards */}
                  <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm">
                    <Label className="text-sm font-bold text-black mb-1 block">
                      نوع المنتج الرقمي <span className="text-red-400">*</span>
                    </Label>
                    <p className="text-xs text-black/35 mb-4">ما الذي تريد بناءه؟</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {PROJECT_TYPES.map(pt => {
                        const PtIcon = pt.icon;
                        const isSelected = formData.projectType === pt.value;
                        return (
                          <button
                            key={pt.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, projectType: pt.value })}
                            data-testid={`project-type-${pt.value}`}
                            className={`p-4 rounded-2xl border-2 text-right transition-all duration-200 group ${
                              isSelected
                                ? "border-black bg-black text-white shadow-lg shadow-black/15"
                                : "border-black/[0.08] bg-black/[0.01] hover:border-black/20 hover:bg-black/[0.03]"
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                              isSelected ? "bg-white/20" : "bg-black/[0.04] group-hover:bg-black/[0.07]"
                            }`}>
                              <PtIcon className={`w-4 h-4 ${isSelected ? "text-white" : "text-black/40"}`} />
                            </div>
                            <p className={`text-xs font-bold mb-0.5 ${isSelected ? "text-white" : "text-black"}`}>{pt.label}</p>
                            <p className={`text-[10px] leading-relaxed ${isSelected ? "text-white/60" : "text-black/30"}`}>{pt.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sector — Visual Cards */}
                  <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm">
                    <Label className="text-sm font-bold text-black mb-1 block">
                      قطاع نشاطك <span className="text-red-400">*</span>
                    </Label>
                    <p className="text-xs text-black/35 mb-4">سيساعدنا في اقتراح المميزات المناسبة لك</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {SECTORS.map(sec => {
                        const SecIcon = sec.icon;
                        const isSelected = formData.sector === sec.value;
                        return (
                          <button
                            key={sec.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, sector: sec.value, sectorFeatures: [] })}
                            data-testid={`sector-${sec.value}`}
                            className={`p-4 rounded-2xl border-2 text-right transition-all duration-200 ${
                              isSelected
                                ? "border-black bg-black text-white shadow-lg shadow-black/15"
                                : "border-black/[0.08] bg-black/[0.01] hover:border-black/20"
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                              isSelected ? "bg-white/20" : "bg-black/[0.04]"
                            }`}>
                              <SecIcon className={`w-4 h-4 ${isSelected ? "text-white" : "text-black/40"}`} />
                            </div>
                            <p className={`text-xs font-bold mb-0.5 ${isSelected ? "text-white" : "text-black"}`}>{sec.label}</p>
                            <p className={`text-[10px] ${isSelected ? "text-white/60" : "text-black/30"}`}>{sec.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Competitors */}
                  <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm">
                    <Label className="text-sm font-bold text-black mb-1 block">مواقع تعجبك أو منافسيك</Label>
                    <p className="text-xs text-black/35 mb-3">اذكر أي مواقع أو تطبيقات تعجبك كمرجع للتصميم</p>
                    <Input
                      placeholder="مثال: noon.com، zid.sa، أو أي موقع يعجبك..."
                      className="bg-black/[0.02] border-black/[0.08] text-black h-12 rounded-xl"
                      value={formData.competitors}
                      onChange={e => setFormData({ ...formData, competitors: e.target.value })}
                      data-testid="input-competitors"
                    />
                  </div>
                </div>
              )}

              {/* Step 2 — Features & Style */}
              {step === 2 && (
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/[0.04] border border-black/[0.06] mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-black/40" />
                      <span className="text-xs text-black/40 font-medium">الخطوة 2 من 5</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-black mb-2">اختر مميزات نظامك</h2>
                    <p className="text-black/40 text-sm">حدّد ما يحتاجه عملاؤك وما سيجعل مشروعك ينجح</p>
                  </div>

                  {/* Features Grid */}
                  {formData.sector && SECTOR_FEATURES[formData.sector] && (
                    <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm">
                      <Label className="text-sm font-bold text-black mb-1 block">
                        مميزات {SECTORS.find(s => s.value === formData.sector)?.label} <span className="text-red-400">*</span>
                      </Label>
                      <p className="text-xs text-black/35 mb-4">اختر جميع المميزات التي تريدها — يمكنك اختيار أكثر من واحدة</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {SECTOR_FEATURES[formData.sector].map(feature => {
                          const FIcon = feature.icon;
                          const isSelected = formData.sectorFeatures.includes(feature.id);
                          return (
                            <button
                              key={feature.id}
                              type="button"
                              onClick={() => toggleFeature(feature.id)}
                              data-testid={`feature-${feature.id}`}
                              className={`flex items-center gap-3 p-4 rounded-xl border-2 text-right transition-all duration-150 ${
                                isSelected
                                  ? "border-black bg-black text-white"
                                  : "border-black/[0.07] bg-black/[0.01] text-black/60 hover:border-black/20 hover:bg-black/[0.03]"
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center transition-all ${
                                isSelected ? "bg-white/20" : "bg-black/[0.04]"
                              }`}>
                                <FIcon className={`w-4 h-4 ${isSelected ? "text-white" : "text-black/35"}`} />
                              </div>
                              <span className="text-sm font-medium flex-1">{feature.label}</span>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {formData.sectorFeatures.length > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                          <span className="text-xs text-emerald-600 font-semibold">{formData.sectorFeatures.length} ميزة محددة</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Visual Style */}
                  <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm">
                    <Label className="text-sm font-bold text-black mb-1 block">
                      النمط البصري <span className="text-red-400">*</span>
                    </Label>
                    <p className="text-xs text-black/35 mb-4">كيف تريد أن يبدو نظامك؟</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {VISUAL_STYLES.map(style => {
                        const isSelected = formData.visualStyle === style.value;
                        return (
                          <button
                            key={style.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, visualStyle: style.value })}
                            data-testid={`visual-style-${style.value}`}
                            className={`p-4 rounded-2xl border-2 text-right transition-all duration-200 ${
                              isSelected
                                ? "border-black bg-black text-white"
                                : "border-black/[0.07] bg-black/[0.01] hover:border-black/20"
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${isSelected ? "bg-white/20" : "bg-black/[0.04]"}`}>
                              <Palette className={`w-4 h-4 ${isSelected ? "text-white" : "text-black/40"}`} />
                            </div>
                            <p className={`text-xs font-bold mb-0.5 ${isSelected ? "text-white" : "text-black"}`}>{style.label}</p>
                            <p className={`text-[10px] ${isSelected ? "text-white/60" : "text-black/30"}`}>{style.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Target Audience + Language */}
                  <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <Label className="text-sm font-bold text-black mb-1 block">
                          جمهورك المستهدف <span className="text-red-400">*</span>
                        </Label>
                        <p className="text-xs text-black/35 mb-3">من هم عملاؤك؟</p>
                        <Input
                          placeholder="مثال: شباب 18-35، ربات بيوت، رجال أعمال..."
                          className="bg-black/[0.02] border-black/[0.08] text-black h-11 rounded-xl"
                          value={formData.targetAudience}
                          onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                          data-testid="input-targetAudience"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-bold text-black mb-1 block">
                          لغة النظام <span className="text-red-400">*</span>
                        </Label>
                        <p className="text-xs text-black/35 mb-3">اختر لغة الواجهة</p>
                        <Select value={formData.siteLanguage} onValueChange={v => setFormData({ ...formData, siteLanguage: v })}>
                          <SelectTrigger className="bg-black/[0.02] border-black/[0.08] text-black h-11 rounded-xl" data-testid="input-siteLanguage">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ar">عربي فقط</SelectItem>
                            <SelectItem value="en">إنجليزي فقط</SelectItem>
                            <SelectItem value="ar_en">عربي + إنجليزي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Additional requirements */}
                  <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm">
                    <Label className="text-sm font-bold text-black mb-1 block">متطلبات إضافية تريدها</Label>
                    <p className="text-xs text-black/35 mb-3">أي تفاصيل أخرى تريد إضافتها أو توضيحها</p>
                    <Textarea
                      className="h-28 resize-none bg-black/[0.02] border-black/[0.08] text-black rounded-xl placeholder:text-black/25"
                      placeholder="اذكر أي متطلبات خاصة، ميزات فريدة، أو أي شيء تريد أن نعرفه..."
                      value={formData.requiredFunctions}
                      onChange={e => setFormData({ ...formData, requiredFunctions: e.target.value })}
                      data-testid="input-requiredFunctions"
                    />
                  </div>

                  {/* Toggle options */}
                  <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm">
                    <Label className="text-sm font-bold text-black mb-1 block">بيانات تقنية سريعة</Label>
                    <p className="text-xs text-black/35 mb-4">حدّد ما لديك مسبقاً</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: "hosting", label: "لديّ استضافة", field: "hasHosting", desc: "Hosting" },
                        { id: "domain", label: "لديّ دومين", field: "hasDomain", desc: "Domain Name" },
                        { id: "whatsapp", label: "ربط واتساب", field: "whatsappIntegration", desc: "WhatsApp API" },
                        { id: "social", label: "ربط السوشيال", field: "socialIntegration", desc: "Social Media" },
                        { id: "logo", label: "لديّ شعار", field: "hasLogo", desc: "Logo Ready" },
                        { id: "needsLogo", label: "أحتاج تصميم شعار", field: "needsLogoDesign", desc: "Logo Design" },
                      ].map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, [item.field]: !(formData as any)[item.field] })}
                          data-testid={`toggle-${item.id}`}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            (formData as any)[item.field]
                              ? "border-black bg-black text-white"
                              : "border-black/[0.07] bg-black/[0.01] text-black/50 hover:border-black/20"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border-2 ${
                            (formData as any)[item.field] ? "border-white bg-white" : "border-black/20"
                          }`}>
                            {(formData as any)[item.field] && <Check className="w-3 h-3 text-black" />}
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold">{item.label}</p>
                            <p className={`text-[10px] ${(formData as any)[item.field] ? "text-white/50" : "text-black/30"}`}>{item.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 — Files */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/[0.04] border border-black/[0.06] mb-3">
                      <Package className="w-3.5 h-3.5 text-black/40" />
                      <span className="text-xs text-black/40 font-medium">الخطوة 3 من 5</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-black mb-2">ارفع ملفاتك ومحتواك</h2>
                    <p className="text-black/40 text-sm">كلما أرسلت أكثر، كلما كان النظام أقرب لتصورك</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 p-4 bg-black/[0.02] rounded-xl border border-black/[0.06]">
                      <div className="w-8 h-8 rounded-lg bg-black/[0.06] flex items-center justify-center flex-shrink-0">
                        <Upload className="w-4 h-4 text-black/40" />
                      </div>
                      <p className="text-xs text-black/50 leading-relaxed">
                        {t("order.docsNote")} — يمكنك رفع أي من هذه الملفات. كلما كانت المواد أكثر، كلما كان التصميم أدق وأسرع.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FileUploadField label={t("order.logo")} field="logo" files={uploadedFiles.logo || []} onUpload={handleFileUpload} onRemove={handleFileRemove} />
                      <FileUploadField label={t("order.brandIdentity")} field="brandIdentity" files={uploadedFiles.brandIdentity || []} onUpload={handleFileUpload} onRemove={handleFileRemove} />
                      <FileUploadField label={t("order.content")} field="content" files={uploadedFiles.content || []} onUpload={handleFileUpload} onRemove={handleFileRemove} />
                      <FileUploadField label={t("order.images")} field="images" files={uploadedFiles.images || []} onUpload={handleFileUpload} onRemove={handleFileRemove} />
                      <FileUploadField label={t("order.video")} field="video" files={uploadedFiles.video || []} onUpload={handleFileUpload} onRemove={handleFileRemove} />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm">
                    <Label className="text-sm font-bold text-black mb-1 block">{t("order.accessCredentials")}</Label>
                    <p className="text-xs text-black/35 mb-3">إذا كان لديك دومين أو استضافة، شارك بيانات الوصول بأمان</p>
                    <Input
                      placeholder={t("order.accessCredentialsPlaceholder")}
                      className="bg-black/[0.02] border-black/[0.08] text-black h-11 rounded-xl"
                      value={formData.accessCredentials}
                      onChange={e => setFormData({ ...formData, accessCredentials: e.target.value })}
                      data-testid="input-accessCredentials"
                    />
                  </div>
                </div>
              )}

              {/* Step 4 — Payment */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/[0.04] border border-black/[0.06] mb-3">
                      <CreditCard className="w-3.5 h-3.5 text-black/40" />
                      <span className="text-xs text-black/40 font-medium">الخطوة 4 من 5</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-black mb-2">سدّد الدفعة الأولى</h2>
                    <p className="text-black/40 text-sm">نبدأ العمل فور استلام الدفعة وتأكيدها</p>
                  </div>

                  {/* Step indicator banner */}
                  <div className="bg-black rounded-2xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-5 h-5 text-white/70" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-base mb-1">قبل الإرسال — قم بالتحويل أولاً</p>
                        <p className="text-white/50 text-xs leading-relaxed">حوّل الدفعة الأولى إلى الحساب أدناه، ثم ارفع صورة الإيصال في الخطوة التالية. العمل يبدأ فور التأكيد.</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-white/30 text-[10px]">إجمالي يبدأ من</span>
                          <span className="text-white font-black text-lg">{service.priceMin?.toLocaleString()} ر.س</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-black/[0.05]">
                      <p className="text-xs font-bold text-black/50 uppercase tracking-widest">بيانات التحويل البنكي</p>
                    </div>
                    <div className="px-5 py-4 space-y-0">
                      {[
                        { label: "البنك", value: bank.bankName },
                        { label: "اسم المستفيد", value: bank.beneficiaryName },
                      ].map(row => (
                        <div key={row.label} className="flex items-center justify-between py-3 border-b border-black/[0.04]">
                          <span className="text-xs text-black/40">{row.label}</span>
                          <span className="text-sm font-semibold text-black">{row.value}</span>
                        </div>
                      ))}
                      {/* IBAN row with copy */}
                      <div className="flex items-center justify-between py-3">
                        <span className="text-xs text-black/40">رقم IBAN</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-black" dir="ltr">{bank.iban}</span>
                          <button
                            onClick={copyIban}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${copiedIban ? 'bg-green-100 text-green-600' : 'bg-black/[0.05] text-black/40 hover:bg-black/10 hover:text-black'}`}
                            data-testid="button-copy-iban-step4"
                            title="نسخ IBAN"
                          >
                            {copiedIban ? <ClipboardCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      {copiedIban && (
                        <p className="text-[11px] text-green-600 text-center pb-2 font-medium">✓ تم نسخ رقم IBAN</p>
                      )}
                    </div>
                    <div className="px-5 py-4 bg-amber-50 border-t border-amber-100">
                      <p className="text-xs text-amber-700 leading-relaxed">
                        ⚠️ تأكد من كتابة <strong>رقم طلبك</strong> في خانة ملاحظات التحويل. بعد إتمام التحويل، ارفع الإيصال في الحقل أدناه.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm">
                    <FileUploadField
                      label="إيصال التحويل البنكي"
                      field="paymentProof"
                      files={uploadedFiles.paymentProof || []}
                      onUpload={handleFileUpload}
                      onRemove={handleFileRemove}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Step 5 — Review */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/[0.04] border border-black/[0.06] mb-3">
                      <Flag className="w-3.5 h-3.5 text-black/40" />
                      <span className="text-xs text-black/40 font-medium">الخطوة 5 من 5</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-black mb-2">مراجعة طلبك النهائي</h2>
                    <p className="text-black/40 text-sm">تأكد من جميع التفاصيل قبل الإرسال</p>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm">
                      <p className="text-xs text-black/30 font-semibold uppercase tracking-wider mb-3">معلومات المشروع</p>
                      <div className="space-y-2">
                        {[
                          { label: "اسم النشاط", value: formData.businessName || "—" },
                          { label: "نوع المشروع", value: PROJECT_TYPES.find(p => p.value === formData.projectType)?.label || "—" },
                          { label: "القطاع", value: SECTORS.find(s => s.value === formData.sector)?.label || "—" },
                          { label: "النمط البصري", value: VISUAL_STYLES.find(s => s.value === formData.visualStyle)?.label || "—" },
                          { label: "اللغة", value: formData.siteLanguage === "ar" ? "عربي" : formData.siteLanguage === "en" ? "إنجليزي" : "عربي + إنجليزي" },
                        ].map(row => (
                          <div key={row.label} className="flex items-start justify-between gap-2">
                            <span className="text-xs text-black/35 flex-shrink-0">{row.label}</span>
                            <span className="text-xs font-semibold text-black text-left">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm">
                      <p className="text-xs text-black/30 font-semibold uppercase tracking-wider mb-3">المميزات المختارة</p>
                      <div className="flex flex-wrap gap-1.5">
                        {formData.sectorFeatures.length === 0 ? (
                          <p className="text-xs text-black/30">لم تُحدد مميزات</p>
                        ) : (
                          formData.sectorFeatures.map(fId => {
                            const feature = SECTOR_FEATURES[formData.sector]?.find(f => f.id === fId);
                            return feature ? (
                              <span key={fId} className="text-[11px] px-2.5 py-1 rounded-full bg-black text-white font-medium">
                                {feature.label}
                              </span>
                            ) : null;
                          })
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm">
                      <p className="text-xs text-black/30 font-semibold uppercase tracking-wider mb-3">الملفات المرفوعة</p>
                      {Object.entries(uploadedFiles).filter(([_, f]) => f.length > 0).length === 0 ? (
                        <p className="text-xs text-black/30">لم ترفع ملفات</p>
                      ) : (
                        <div className="space-y-1">
                          {Object.entries(uploadedFiles).map(([key, files]) =>
                            files.length > 0 ? (
                              <div key={key} className="flex items-center gap-2 text-xs text-black/60">
                                <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                                <span>{key}: {files.length} ملف</span>
                              </div>
                            ) : null
                          )}
                        </div>
                      )}
                    </div>

                    <div className="bg-black rounded-2xl p-5 shadow-sm">
                      <p className="text-xs text-white/30 font-semibold uppercase tracking-wider mb-3">السعر والدفع</p>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-black text-white">{service.priceMin?.toLocaleString()}</span>
                        <span className="text-sm text-white/40">ر.س يبدأ من</span>
                      </div>
                      <div className="text-xs text-white/40 flex items-center gap-2">
                        <Check className="w-3 h-3 text-emerald-400" />
                        التحويل البنكي — بنك الراجحي
                      </div>
                      <div className="text-xs text-white/40 flex items-center gap-2 mt-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        {uploadedFiles.paymentProof?.length > 0 ? "تم رفع الإيصال ✓" : "لم يُرفع الإيصال بعد"}
                      </div>
                    </div>
                  </div>

                  {formData.requiredFunctions && (
                    <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm">
                      <p className="text-xs text-black/30 font-semibold uppercase tracking-wider mb-2">ملاحظاتك الإضافية</p>
                      <p className="text-sm text-black/60 leading-relaxed">{formData.requiredFunctions}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-black/[0.06]">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={handleBack}
                className="min-w-[110px] h-12 border-black/[0.1] text-black/60 rounded-xl font-semibold hover:bg-black/[0.02]"
                data-testid="button-prev-step"
              >
                <ArrowRight className="ml-2 w-4 h-4" />
                رجوع
              </Button>
            ) : <div />}

            {step < 5 ? (
              <Button
                onClick={handleNext}
                className="min-w-[130px] h-12 bg-black text-white rounded-xl font-bold hover:bg-gray-900 gap-2"
                data-testid="button-next-step"
              >
                التالي
                <ArrowLeft className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={createOrderMutation.isPending}
                className="min-w-[150px] h-12 bg-black text-white rounded-xl font-bold hover:bg-gray-900"
                data-testid="button-confirm-order"
              >
                {createOrderMutation.isPending ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 ml-2" />
                    أرسل الطلب
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
