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
import { Loader2, CheckCircle, ArrowLeft, ArrowRight, Check, Briefcase, Upload, X, FileText, Image, Film, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";

interface UploadedFile {
  url: string;
  filename: string;
  size: number;
}

function FileUploadField({ label, field, files, onUpload, onRemove }: {
  label: string;
  field: string;
  files: UploadedFile[];
  onUpload: (field: string, file: File) => void;
  onRemove: (field: string, index: number) => void;
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
      <Label className="text-sm mb-2 block text-black/60">{label}</Label>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className="border-2 border-dashed border-black/[0.08] rounded-xl p-4 text-center cursor-pointer hover:border-black/[0.15] hover:bg-black/[0.02] transition-all"
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
            <span className="text-sm text-black/40">{t("common.loading")}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <Upload className="w-6 h-6 text-black/25" />
            <span className="text-xs text-black/35">{t("order.uploadClick")}</span>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 bg-black/[0.03] rounded-lg px-3 py-2 border border-black/[0.08]">
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

  const [step, setStep] = useState(1);
  const SECTOR_FEATURES: Record<string, { id: string; label: string }[]> = {
    restaurant: [
      { id: "qr_menu", label: "قائمة QR تفاعلية" },
      { id: "order_system", label: "نظام استقبال الطلبات إلكترونياً" },
      { id: "kds", label: "شاشة المطبخ (KDS)" },
      { id: "delivery", label: "نظام التوصيل وتتبع الطلبات" },
      { id: "booking", label: "الحجز المسبق للطاولات" },
      { id: "loyalty", label: "برنامج الولاء والنقاط" },
      { id: "branches", label: "إدارة الفروع المتعددة" },
      { id: "pos", label: "نقطة البيع (POS)" },
      { id: "coupons", label: "كوبونات وعروض خاصة" },
      { id: "reports", label: "تقارير المبيعات اليومية" },
      { id: "whatsapp_order", label: "الطلب عبر واتساب" },
      { id: "mobile_app", label: "تطبيق جوال للعملاء" },
      { id: "staff_mgmt", label: "إدارة الموظفين والصلاحيات" },
      { id: "epayment", label: "الدفع الإلكتروني (Apple Pay / STC)" },
    ],
    store: [
      { id: "cart", label: "سلة مشتريات متكاملة" },
      { id: "epayment", label: "Apple Pay / STC Pay / بطاقات" },
      { id: "inventory", label: "إدارة المخزون والمستودعات" },
      { id: "coupons", label: "كوبونات وخصومات" },
      { id: "shipping", label: "تتبع الشحن والتوصيل" },
      { id: "reviews", label: "تقييم ومراجعة المنتجات" },
      { id: "filters", label: "فلترة وتصنيف المنتجات" },
      { id: "loyalty", label: "برنامج الولاء والنقاط" },
      { id: "installment", label: "الدفع بالتقسيط" },
      { id: "reports", label: "تقارير المبيعات التفصيلية" },
      { id: "returns", label: "إدارة الإرجاع والاستبدال" },
      { id: "mobile_app", label: "تطبيق جوال للمتجر" },
      { id: "push_notif", label: "إشعارات فورية للعملاء" },
      { id: "social_shop", label: "ربط المتجر مع السوشيال ميديا" },
    ],
    education: [
      { id: "lms", label: "منصة إدارة تعليمية (LMS)" },
      { id: "live", label: "بث مباشر للدروس" },
      { id: "quizzes", label: "اختبارات وتقييمات تفاعلية" },
      { id: "certificates", label: "شهادات إلكترونية تلقائية" },
      { id: "rooms", label: "غرف اجتماعات افتراضية" },
      { id: "recordings", label: "تسجيل الدروس وحفظها" },
      { id: "subscriptions", label: "نظام الدفع للاشتراكات والدورات" },
      { id: "students", label: "إدارة الطلاب والمجموعات" },
      { id: "forum", label: "منتدى نقاش للطلاب" },
      { id: "mobile_app", label: "تطبيق جوال" },
      { id: "reports", label: "تقارير الأداء والتقدم" },
    ],
    health: [
      { id: "booking", label: "نظام حجز مواعيد ذكي" },
      { id: "client_tracking", label: "متابعة تقدم العملاء" },
      { id: "programs", label: "برامج تدريبية / علاجية مخصصة" },
      { id: "epayment", label: "الدفع الإلكتروني للاشتراكات" },
      { id: "reminders", label: "إشعارات تذكير تلقائية" },
      { id: "reports", label: "تقارير الأداء والإحصاءات" },
      { id: "staff_mgmt", label: "إدارة الموظفين والمدربين" },
      { id: "mobile_app", label: "تطبيق جوال" },
      { id: "diet", label: "خطط غذائية وتغذية" },
      { id: "online_consult", label: "استشارات إلكترونية" },
    ],
    realestate: [
      { id: "listings", label: "قائمة عقارات مع فلترة متقدمة" },
      { id: "virtual_tour", label: "جولات افتراضية 360°" },
      { id: "inquiry", label: "نظام حجز وتواصل فوري" },
      { id: "compare", label: "مقارنة العقارات" },
      { id: "maps", label: "خرائط تفاعلية" },
      { id: "agents", label: "إدارة الوكلاء / المعلنين" },
      { id: "reports", label: "تقارير الطلبات والاهتمام" },
      { id: "mortgage_calc", label: "حاسبة التمويل والرهن" },
      { id: "mobile_app", label: "تطبيق جوال" },
    ],
    other: [
      { id: "contact_form", label: "نموذج تواصل متقدم" },
      { id: "multilang", label: "واجهة متعددة اللغات" },
      { id: "blog", label: "مدونة / نظام محتوى" },
      { id: "seo", label: "تحسين محركات البحث (SEO)" },
      { id: "admin_panel", label: "لوحة إدارة للمحتوى" },
      { id: "analytics", label: "ربط Google Analytics" },
      { id: "live_chat", label: "دردشة مباشرة مع الزوار" },
      { id: "email_marketing", label: "التسويق عبر البريد الإلكتروني" },
      { id: "social_feed", label: "عرض السوشيال ميديا" },
      { id: "whatsapp", label: "ربط واتساب" },
      { id: "booking", label: "نظام حجز / مواعيد" },
    ],
  };

  const SECTORS = [
    { value: "restaurant", label: "🍽️ مطاعم وكافيهات" },
    { value: "store", label: "🛍️ متاجر إلكترونية" },
    { value: "education", label: "📚 تعليم وأكاديميات" },
    { value: "health", label: "🏥 صحة ولياقة" },
    { value: "realestate", label: "🏢 عقارات" },
    { value: "other", label: "📋 أخرى / مؤسسات" },
  ];

  const PROJECT_TYPES = [
    { value: "website", label: "موقع ويب" },
    { value: "ecommerce", label: "متجر إلكتروني" },
    { value: "webapp", label: "تطبيق ويب" },
    { value: "mobile_app", label: "تطبيق جوال" },
    { value: "landing_page", label: "صفحة هبوط" },
    { value: "platform", label: "منصة متكاملة" },
    { value: "system", label: "نظام إداري" },
  ];

  const [formData, setFormData] = useState({
    projectType: "",
    sector: "",
    sectorFeatures: [] as string[],
    competitors: "",
    visualStyle: "",
    favoriteExamples: "",
    requiredFunctions: "",
    requiredSystems: "",
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

  const toggleFeature = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      sectorFeatures: prev.sectorFeatures.includes(featureId)
        ? prev.sectorFeatures.filter(f => f !== featureId)
        : [...prev.sectorFeatures, featureId],
    }));
  };

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile[]>>({
    logo: [],
    brandIdentity: [],
    content: [],
    images: [],
    video: [],
    paymentProof: [],
  });

  const handleFileUpload = async (field: string, file: File) => {
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data: UploadedFile = await res.json();
      setUploadedFiles(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), data],
      }));
    } catch {
      toast({ title: t("order.error"), description: "Upload failed", variant: "destructive" });
    }
  };

  const handleFileRemove = (field: string, index: number) => {
    setUploadedFiles(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index),
    }));
  };

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: t("order.success"),
        description: t("order.successDesc"),
      });
      setLocation("/dashboard");
    },
    onError: () => {
      toast({
        title: t("order.error"),
        description: t("order.errorDesc"),
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      setLocation("/login");
    }
  }, [user, isUserLoading, setLocation]);

  if (isUserLoading || isServicesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-black/40" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!selectedServiceId || !service) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navigation />
        <div className="flex-1 container mx-auto px-4 py-8 pt-32 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-black/[0.02] border border-black/[0.08] mb-6">
              <Briefcase className="w-3.5 h-3.5 text-black/40" />
              <span className="text-black/40 text-xs tracking-wider uppercase">{t("order.step1")}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black font-heading text-black mb-4">
              {t("order.step1.title")}
            </h1>
            <p className="text-black/35 text-lg">{t("services.subtitle")}</p>
          </div>

          {services && services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => setSelectedServiceId(String(svc.id))}
                  className="border border-black/[0.06] bg-white p-6 rounded-2xl text-right hover:border-black/[0.15] border border-transparent transition-all group"
                  data-testid={`select-service-${svc.id}`}
                >
                  <h3 className="text-lg font-bold text-black mb-2 group-hover:text-black/40 transition-colors">{svc.title}</h3>
                  <p className="text-sm text-black/35 line-clamp-2 mb-4">{svc.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-black/[0.06] text-black/40 border border-black/[0.1]">
                      {svc.category}
                    </span>
                    <span className="text-sm font-bold text-black">
                      {svc.priceMin?.toLocaleString()} {t("order.sar")}
                    </span>
                  </div>
                </button>
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
        toast({ title: "خانة مطلوبة", description: "الرجاء اختيار نوع المشروع", variant: "destructive" });
        return;
      }
      if (!formData.sector) {
        toast({ title: "خانة مطلوبة", description: "الرجاء اختيار القطاع", variant: "destructive" });
        return;
      }
    }
    if (step === 2) {
      if (formData.sector && SECTOR_FEATURES[formData.sector] && formData.sectorFeatures.length === 0) {
        toast({ title: "خانة مطلوبة", description: "الرجاء اختيار ميزة واحدة على الأقل", variant: "destructive" });
        return;
      }
      if (!formData.visualStyle) {
        toast({ title: "خانة مطلوبة", description: "الرجاء إدخال النمط البصري المطلوب", variant: "destructive" });
        return;
      }
    }
    setStep(s => s + 1);
  };
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = () => {
    const filesPayload: Record<string, string[]> = {};
    Object.entries(uploadedFiles).forEach(([key, files]) => {
      if (files.length > 0) {
        filesPayload[key] = files.map(f => f.url);
      }
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

  const stepLabels = [t("order.step1"), t("order.step2"), t("order.step3"), t("order.step4"), t("order.step5")];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />

      <div className="flex-1 container mx-auto px-4 py-8 pt-32 max-w-3xl" dir="rtl">
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-black/[0.08] -z-10"></div>
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 border ${
                  step >= s
                    ? "bg-black text-white border-black scale-110"
                    : "bg-black/[0.03] text-black/35 border-black/[0.08]"
                }`}
                data-testid={`step-indicator-${s}`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-[10px] md:text-sm text-black/35 font-medium px-1">
            {stepLabels.map((label, i) => (
              <span key={i} className={step === i + 1 ? "text-black/40" : ""}>{label}</span>
            ))}
          </div>
        </div>

        <div className="border border-black/[0.06] bg-white rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-black/40 to-black/20" style={{ width: `${(step / 5) * 100}%`, transition: "width 0.3s" }} />
          <div className="p-6 md:p-8 border-b border-black/[0.08]">
            <h2 className="text-xl font-bold text-black">
              {step === 1 && t("order.step1.title")}
              {step === 2 && t("order.step2.title")}
              {step === 3 && t("order.step3.title")}
              {step === 4 && t("order.step4.title")}
              {step === 5 && t("order.step5.title")}
            </h2>
            <p className="text-sm text-black/35 mt-1">
              {t("order.serviceLabel")}: <span className="text-black/40">{service.title}</span>
            </p>
          </div>

          <div className="p-6 md:p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm mb-2 block text-black/60 after:content-['*'] after:text-red-400 after:mr-1">{t("order.projectType")}</Label>
                    <Select value={formData.projectType} onValueChange={v => setFormData({ ...formData, projectType: v })}>
                      <SelectTrigger className="bg-black/[0.02] border-black/[0.08] text-black h-10" data-testid="input-projectType">
                        <SelectValue placeholder="اختر نوع المشروع" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_TYPES.map(pt => (
                          <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block text-black/60 after:content-['*'] after:text-red-400 after:mr-1">{t("order.sector")}</Label>
                    <Select
                      value={formData.sector}
                      onValueChange={v => setFormData({ ...formData, sector: v, sectorFeatures: [] })}
                    >
                      <SelectTrigger className="bg-black/[0.02] border-black/[0.08] text-black h-10" data-testid="input-sector">
                        <SelectValue placeholder="اختر القطاع" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTORS.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm mb-2 block text-black/60">{t("order.competitors")}</Label>
                  <Input
                    className="bg-black/[0.02] border-black/[0.08] text-black placeholder:text-black/25"
                    placeholder={t("order.competitorsPlaceholder")}
                    value={formData.competitors}
                    onChange={e => setFormData({ ...formData, competitors: e.target.value })}
                    data-testid="input-competitors"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                {/* Sector features section */}
                {formData.sector && SECTOR_FEATURES[formData.sector] && (
                  <div>
                    <Label className="text-sm mb-1 block text-black/70 font-semibold after:content-['*'] after:text-red-400 after:mr-1">
                      اختر المميزات المطلوبة لمشروعك
                    </Label>
                    <p className="text-xs text-black/35 mb-4">يمكنك اختيار أكثر من ميزة</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {SECTOR_FEATURES[formData.sector].map(feature => {
                        const isSelected = formData.sectorFeatures.includes(feature.id);
                        return (
                          <button
                            key={feature.id}
                            type="button"
                            onClick={() => toggleFeature(feature.id)}
                            data-testid={`feature-${feature.id}`}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-right transition-all duration-150 ${
                              isSelected
                                ? "border-black bg-black text-white"
                                : "border-black/[0.08] bg-black/[0.02] text-black/60 hover:border-black/25 hover:bg-black/[0.04]"
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                              isSelected ? "border-white bg-white" : "border-black/20"
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-black" />}
                            </div>
                            <span className="text-sm font-medium">{feature.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Visual style */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm mb-2 block text-black/60 after:content-['*'] after:text-red-400 after:mr-1">{t("order.visualStyle")}</Label>
                    <Input
                      placeholder="حديث، كلاسيكي، بسيط، فاخر..."
                      className="bg-black/[0.02] border-black/[0.08] text-black placeholder:text-black/25"
                      value={formData.visualStyle}
                      onChange={e => setFormData({ ...formData, visualStyle: e.target.value })}
                      data-testid="input-visualStyle"
                    />
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block text-black/60 after:content-['*'] after:text-red-400 after:mr-1">{t("order.siteLanguage")}</Label>
                    <Select value={formData.siteLanguage} onValueChange={v => setFormData({ ...formData, siteLanguage: v })}>
                      <SelectTrigger className="bg-black/[0.02] border-black/[0.08] text-black h-10" data-testid="input-siteLanguage">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar">عربي فقط</SelectItem>
                        <SelectItem value="en">إنجليزي فقط</SelectItem>
                        <SelectItem value="ar_en">عربي + إنجليزي</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Required functions textarea */}
                <div>
                  <Label className="text-sm mb-2 block text-black/60">{t("order.requiredFunctions")}</Label>
                  <Textarea
                    className="h-24 resize-none bg-black/[0.02] border-black/[0.08] text-black placeholder:text-black/25"
                    placeholder="اذكر أي وظائف أو متطلبات إضافية لا تجدها في القائمة أعلاه..."
                    value={formData.requiredFunctions}
                    onChange={e => setFormData({ ...formData, requiredFunctions: e.target.value })}
                    data-testid="input-requiredFunctions"
                  />
                </div>

                {/* General toggles */}
                <div>
                  <Label className="text-sm mb-3 block text-black/60">معلومات إضافية</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'hosting', label: t("order.hasHosting"), field: 'hasHosting' },
                      { id: 'domain', label: t("order.hasDomain"), field: 'hasDomain' },
                      { id: 'whatsapp', label: t("order.whatsapp"), field: 'whatsappIntegration' },
                      { id: 'social', label: t("order.social"), field: 'socialIntegration' },
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, [item.field]: !(formData as any)[item.field] })}
                        data-testid={`checkbox-${item.id}`}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all ${
                          (formData as any)[item.field]
                            ? "border-black bg-black text-white"
                            : "border-black/[0.08] bg-black/[0.02] text-black/50 hover:border-black/20"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all ${
                          (formData as any)[item.field] ? "border-white bg-white" : "border-black/20"
                        }`}>
                          {(formData as any)[item.field] && <Check className="w-2.5 h-2.5 text-black" />}
                        </div>
                        <span className="text-xs font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <p className="text-sm text-black/35 mb-4">{t("order.docsNote")}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FileUploadField
                    label={t("order.logo")}
                    field="logo"
                    files={uploadedFiles.logo || []}
                    onUpload={handleFileUpload}
                    onRemove={handleFileRemove}
                  />
                  <FileUploadField
                    label={t("order.brandIdentity")}
                    field="brandIdentity"
                    files={uploadedFiles.brandIdentity || []}
                    onUpload={handleFileUpload}
                    onRemove={handleFileRemove}
                  />
                  <FileUploadField
                    label={t("order.content")}
                    field="content"
                    files={uploadedFiles.content || []}
                    onUpload={handleFileUpload}
                    onRemove={handleFileRemove}
                  />
                  <FileUploadField
                    label={t("order.images")}
                    field="images"
                    files={uploadedFiles.images || []}
                    onUpload={handleFileUpload}
                    onRemove={handleFileRemove}
                  />
                  <FileUploadField
                    label={t("order.video")}
                    field="video"
                    files={uploadedFiles.video || []}
                    onUpload={handleFileUpload}
                    onRemove={handleFileRemove}
                  />
                </div>
                <div>
                  <Label className="text-sm mb-2 block text-black/60">{t("order.accessCredentials")}</Label>
                  <Input
                    placeholder={t("order.accessCredentialsPlaceholder")}
                    className="bg-black/[0.02] border-black/[0.08] text-black placeholder:text-black/25"
                    value={formData.accessCredentials}
                    onChange={e => setFormData({ ...formData, accessCredentials: e.target.value })}
                    data-testid="input-accessCredentials"
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="rounded-2xl border-2 border-black bg-black/[0.02] p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-black text-sm">{t("order.bankTransfer")}</p>
                      <p className="text-xs text-black/40">التحويل البنكي المباشر</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-black/[0.08] p-4 text-sm text-black/60 space-y-2">
                    <p className="font-bold text-black/50 text-xs uppercase tracking-wider mb-3">{t("order.bankDetails")}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-black/40">البنك</span>
                      <span className="font-mono text-black font-medium">بنك الراجحي</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-black/40">IBAN</span>
                      <span className="font-mono text-black font-medium text-xs">SA0380205098017222121010</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-black/40">الاسم</span>
                      <span className="font-medium text-black">QIROX Studio</span>
                    </div>
                  </div>
                  <p className="text-xs text-black/35 mt-3">{t("order.bankNote")}</p>
                  <div className="mt-4">
                    <Label className="mb-2 block text-black/50 text-xs font-semibold">{t("order.receiptLink")} <span className="text-red-400">*</span></Label>
                    <FileUploadField
                      label=""
                      field="paymentProof"
                      files={uploadedFiles.paymentProof || []}
                      onUpload={handleFileUpload}
                      onRemove={handleFileRemove}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div className="bg-black/[0.03] p-6 rounded-xl space-y-4 border border-black/[0.08]">
                  <div className="flex justify-between border-b border-black/[0.08] pb-2">
                    <span className="text-black/40">{t("order.serviceLabel")}</span>
                    <span className="font-bold text-black/40">{service.title}</span>
                  </div>
                  <div className="flex justify-between border-b border-black/[0.08] pb-2">
                    <span className="text-black/40">{t("order.projectType")}</span>
                    <span className="font-bold text-black">{formData.projectType || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-black/[0.08] pb-2">
                    <span className="text-black/40">{t("order.paymentMethod")}</span>
                    <span className="font-bold text-black">{t("order.bankTransfer")}</span>
                  </div>
                  <div className="flex justify-between border-b border-black/[0.08] pb-2">
                    <span className="text-black/40">{t("order.startingPrice")}</span>
                    <span className="font-bold text-black/40">{service.priceMin?.toLocaleString()} {t("order.sar")}</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-black/40 block mb-2">{t("order.uploadedFiles")}</span>
                    <div className="text-xs text-black/60 bg-black/[0.03] p-3 rounded-lg border border-black/[0.08] space-y-1">
                      {Object.entries(uploadedFiles).map(([key, files]) =>
                        files.length > 0 ? (
                          <div key={key} className="flex items-center gap-2">
                            <Check className="w-3 h-3 text-black/40" />
                            <span>{key}: {files.map(f => f.filename).join(", ")}</span>
                          </div>
                        ) : null
                      )}
                      {Object.values(uploadedFiles).every(f => f.length === 0) && (
                        <span className="text-black/35">{t("order.noDetails")}</span>
                      )}
                    </div>
                  </div>
                  <div className="pt-2">
                    <span className="text-black/40 block mb-2">{t("order.functionsRequired")}</span>
                    <p className="text-xs text-black/60 bg-black/[0.03] p-3 rounded-lg border border-black/[0.08]">
                      {formData.requiredFunctions || t("order.noDetails")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-black/[0.08]">
              {step > 1 ? (
                <Button variant="outline" onClick={handleBack} className="min-w-[100px] border-black/[0.08] text-black/60" data-testid="button-prev-step">
                  <ArrowRight className="ml-2 w-4 h-4" />
                  {t("order.prev")}
                </Button>
              ) : <div></div>}

              {step < 5 ? (
                <Button onClick={handleNext} className="premium-btn min-w-[100px]" data-testid="button-next-step">
                  {t("order.next")}
                  <ArrowLeft className="mr-2 w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={createOrderMutation.isPending}
                  className="min-w-[100px] font-bold bg-black text-white"
                  data-testid="button-confirm-order"
                >
                  {createOrderMutation.isPending ? <Loader2 className="animate-spin" /> : (
                    <>
                      <CheckCircle className="w-4 h-4 ml-2" />
                      {t("order.confirm")}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
