import SARIcon from "@/components/SARIcon";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useState } from "react";
import { useTemplates, usePricingPlans } from "@/hooks/use-templates";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Plus, Pencil, Trash2, Layers, CreditCard,
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Globe, Star, BadgePercent,
  Sparkles, Tag, Check, UtensilsCrossed, ShoppingBag, Building2, Home, Infinity, Zap,
  X, ExternalLink, Link2, ListChecks, Video, FileText, BookOpenCheck
} from "lucide-react";
import type { SectorTemplate, PricingPlan, FeatureDetail, TemplateFile } from "@shared/schema";

const SEGMENT_META: Record<string, { labelAr: string; icon: any; color: string; bg: string }> = {
  restaurant:    { labelAr: "مطاعم ومقاهي",    icon: UtensilsCrossed, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  food:          { labelAr: "مطاعم وكافيهات",  icon: UtensilsCrossed, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  store:         { labelAr: "متاجر إلكترونية",  icon: ShoppingBag,     color: "text-blue-600",   bg: "bg-blue-50 border-blue-200" },
  ecommerce:     { labelAr: "متاجر إلكترونية",  icon: ShoppingBag,     color: "text-blue-600",   bg: "bg-blue-50 border-blue-200" },
  commerce:      { labelAr: "متاجر إلكترونية",  icon: ShoppingBag,     color: "text-blue-600",   bg: "bg-blue-50 border-blue-200" },
  education:     { labelAr: "تعليم وأكاديميات", icon: GraduationCap,   color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
  fitness:       { labelAr: "لياقة وجيم",       icon: Dumbbell,        color: "text-green-600",  bg: "bg-green-50 border-green-200" },
  health:        { labelAr: "صحة ولياقة",       icon: Dumbbell,        color: "text-green-600",  bg: "bg-green-50 border-green-200" },
  healthcare:    { labelAr: "صحة وعيادات",      icon: Heart,           color: "text-rose-600",   bg: "bg-rose-50 border-rose-200" },
  tech:          { labelAr: "تقنية وبرمجة",     icon: Globe,           color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" },
  beauty:        { labelAr: "تجميل وصالونات",  icon: Sparkles,        color: "text-pink-600",   bg: "bg-pink-50 border-pink-200" },
  corporate:     { labelAr: "شركات ومؤسسات",    icon: Building2,       color: "text-slate-600",  bg: "bg-slate-50 border-slate-200" },
  institutional: { labelAr: "مؤسسات وجمعيات",   icon: Building2,       color: "text-slate-600",  bg: "bg-slate-50 border-slate-200" },
  personal:      { labelAr: "خدمات شخصية",      icon: User,            color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  realestate:    { labelAr: "عقارات",           icon: Home,            color: "text-teal-600",   bg: "bg-teal-50 border-teal-200" },
};

const IconMap: Record<string, any> = {
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Globe,
  Star, BadgePercent, Tag, Sparkles, Check, UtensilsCrossed,
  ShoppingBag, Building2, Home, Infinity, Zap,
};

function TemplateForm({ template, onClose }: { template?: SectorTemplate; onClose: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: template?.name || "",
    nameAr: template?.nameAr || "",
    slug: template?.slug || "",
    description: template?.description || "",
    descriptionAr: template?.descriptionAr || "",
    category: template?.category || "",
    icon: template?.icon || "Globe",
    priceMin: template?.priceMin || 0,
    priceMax: template?.priceMax || 0,
    estimatedDuration: template?.estimatedDuration || "",
    heroColor: template?.heroColor || "#0f172a",
    demoUrl: template?.demoUrl || "",
    tier: (template as any)?.tier || "" as string,
    status: (template?.status || "active") as "active" | "coming_soon" | "archived",
    features: template?.features?.join(", ") || "",
    featuresAr: template?.featuresAr?.join("، ") || "",
    tags: template?.tags?.join(", ") || "",
    howToUseAr: template?.howToUseAr || "",
    howToUseVideoUrl: template?.howToUseVideoUrl || "",
  });
  const [featuresDetails, setFeaturesDetails] = useState<FeatureDetail[]>(
    template?.featuresDetails?.length ? template.featuresDetails : []
  );
  const [templateFiles, setTemplateFiles] = useState<TemplateFile[]>(
    template?.templateFiles?.length ? template.templateFiles : []
  );
  const addFeatureDetail = () => setFeaturesDetails(f => [...f, { titleAr: "", title: "", descAr: "", icon: "✨" }]);
  const removeFeatureDetail = (i: number) => setFeaturesDetails(f => f.filter((_, idx) => idx !== i));
  const updateFeatureDetail = (i: number, key: keyof FeatureDetail, val: string) =>
    setFeaturesDetails(f => f.map((item, idx) => idx === i ? { ...item, [key]: val } : item));
  const addTemplateFile = () => setTemplateFiles(f => [...f, { nameAr: "", url: "" }]);
  const removeTemplateFile = (i: number) => setTemplateFiles(f => f.filter((_, idx) => idx !== i));
  const updateTemplateFile = (i: number, key: keyof TemplateFile, val: string) =>
    setTemplateFiles(f => f.map((item, idx) => idx === i ? { ...item, [key]: val } : item));

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest("POST", "/api/admin/templates", data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/templates"] }); toast({ title: "تم إنشاء القالب بنجاح" }); onClose(); },
    onError: () => toast({ title: "خطأ في إنشاء القالب", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest("PATCH", `/api/admin/templates/${template?.id}`, data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/templates"] }); toast({ title: "تم تحديث القالب" }); onClose(); },
    onError: () => toast({ title: "خطأ في تحديث القالب", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      features: formData.features.split(",").map(s => s.trim()).filter(Boolean),
      featuresAr: formData.featuresAr.split("،").map(s => s.trim()).filter(Boolean),
      tags: formData.tags.split(",").map(s => s.trim()).filter(Boolean),
      featuresDetails,
      templateFiles: templateFiles.filter(f => f.nameAr && f.url),
    };
    template ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-xs font-medium text-black/50 block mb-1">الاسم (EN)</label><Input value={formData.name} onChange={e => setFormData(f => ({...f, name: e.target.value}))} data-testid="input-template-name" /></div>
        <div><label className="text-xs font-medium text-black/50 block mb-1">الاسم (عربي)</label><Input value={formData.nameAr} onChange={e => setFormData(f => ({...f, nameAr: e.target.value}))} data-testid="input-template-nameAr" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-xs font-medium text-black/50 block mb-1">Slug</label><Input value={formData.slug} onChange={e => setFormData(f => ({...f, slug: e.target.value}))} /></div>
        <div><label className="text-xs font-medium text-black/50 block mb-1">التصنيف</label><Input value={formData.category} onChange={e => setFormData(f => ({...f, category: e.target.value}))} /></div>
      </div>
      <div><label className="text-xs font-medium text-black/50 block mb-1">وصف عربي</label><Textarea rows={2} value={formData.descriptionAr} onChange={e => setFormData(f => ({...f, descriptionAr: e.target.value}))} /></div>
      <div><label className="text-xs font-medium text-black/50 block mb-1">وصف انجليزي</label><Textarea rows={2} value={formData.description} onChange={e => setFormData(f => ({...f, description: e.target.value}))} /></div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="text-xs font-medium text-black/50 block mb-1">السعر من</label><Input type="number" value={formData.priceMin} onChange={e => setFormData(f => ({...f, priceMin: Number(e.target.value)}))} /></div>
        <div><label className="text-xs font-medium text-black/50 block mb-1">السعر إلى</label><Input type="number" value={formData.priceMax} onChange={e => setFormData(f => ({...f, priceMax: Number(e.target.value)}))} /></div>
        <div><label className="text-xs font-medium text-black/50 block mb-1">مدة التنفيذ</label><Input value={formData.estimatedDuration} onChange={e => setFormData(f => ({...f, estimatedDuration: e.target.value}))} placeholder="7-14 يوم" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-black/50 block mb-1">الأيقونة</label>
          <select value={formData.icon} onChange={e => setFormData(f => ({...f, icon: e.target.value}))} className="w-full h-10 rounded-lg border border-black/[0.08] px-3 text-sm dark:bg-gray-900 dark:border-white/[0.08]">
            {Object.keys(IconMap).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-black/50 block mb-1">الحالة</label>
          <select value={formData.status} onChange={e => setFormData(f => ({...f, status: e.target.value as any}))} className="w-full h-10 rounded-lg border border-black/[0.08] px-3 text-sm dark:bg-gray-900 dark:border-white/[0.08]">
            <option value="active">نشط</option>
            <option value="coming_soon">قريباً</option>
            <option value="archived">مؤرشف</option>
          </select>
        </div>
      </div>
      <div><label className="text-xs font-medium text-black/50 block mb-1">لون الهيرو</label><div className="flex gap-2"><input type="color" value={formData.heroColor} onChange={e => setFormData(f => ({...f, heroColor: e.target.value}))} className="w-10 h-10 rounded cursor-pointer border border-black/[0.08]" /><Input value={formData.heroColor} onChange={e => setFormData(f => ({...f, heroColor: e.target.value}))} className="flex-1" /></div></div>
      <div><label className="text-xs font-medium text-black/50 block mb-1">الميزات (عربي، مفصولة بـ ،)</label><Textarea rows={2} value={formData.featuresAr} onChange={e => setFormData(f => ({...f, featuresAr: e.target.value}))} placeholder="ميزة 1، ميزة 2، ميزة 3" /></div>
      <div><label className="text-xs font-medium text-black/50 block mb-1">Features (EN, comma separated)</label><Textarea rows={2} value={formData.features} onChange={e => setFormData(f => ({...f, features: e.target.value}))} placeholder="Feature 1, Feature 2" /></div>

      {/* Tier / Package Level */}
      <div>
        <label className="text-xs font-medium text-black/50 block mb-2">مستوى الباقة الذي يمثله هذا النموذج</label>
        <div className="flex gap-2 flex-wrap">
          {[{ value: "", label: "غير محدد" }, { value: "lite", label: "لايت" }, { value: "pro", label: "برو" }, { value: "infinite", label: "إنفينيت" }, { value: "custom", label: "مخصص" }].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFormData(f => ({ ...f, tier: opt.value }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${formData.tier === opt.value ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white" : "border-black/[0.1] dark:border-white/[0.1] text-black/50 dark:text-white/50 hover:border-black/20"}`}
              data-testid={`tier-option-${opt.value || "none"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Demo URL */}
      <div>
        <label className="text-xs font-medium text-black/50 block mb-1 flex items-center gap-1.5"><Link2 className="w-3 h-3" /> رابط الديمو</label>
        <Input value={formData.demoUrl} onChange={e => setFormData(f => ({...f, demoUrl: e.target.value}))} placeholder="https://demo.example.com" dir="ltr" data-testid="input-demo-url" />
      </div>

      {/* Usage Guide Section */}
      <div className="border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-4 space-y-3 bg-violet-50/40 dark:bg-violet-900/10">
        <p className="text-xs font-bold text-violet-700 dark:text-violet-300 flex items-center gap-1.5"><BookOpenCheck className="w-3.5 h-3.5" /> شرح وطريقة الاستخدام</p>
        <div>
          <label className="text-xs font-medium text-black/50 block mb-1 flex items-center gap-1.5"><Video className="w-3 h-3" /> رابط فيديو الشرح (YouTube)</label>
          <Input value={formData.howToUseVideoUrl} onChange={e => setFormData(f => ({...f, howToUseVideoUrl: e.target.value}))} placeholder="https://youtube.com/watch?v=..." dir="ltr" data-testid="input-how-to-use-video" />
        </div>
        <div>
          <label className="text-xs font-medium text-black/50 block mb-1">طريقة الاستخدام (نص عربي)</label>
          <Textarea rows={4} value={formData.howToUseAr} onChange={e => setFormData(f => ({...f, howToUseAr: e.target.value}))} placeholder="اشرح هنا كيفية استخدام النظام خطوة بخطوة..." data-testid="input-how-to-use-ar" />
        </div>
        {/* Template Files */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-black/50 flex items-center gap-1.5"><FileText className="w-3 h-3" /> ملفات الشرح والمميزات</label>
            <Button type="button" size="sm" variant="outline" onClick={addTemplateFile} className="h-6 px-2 text-[10px] rounded-lg gap-1" data-testid="btn-add-template-file">
              <Plus className="w-3 h-3" /> إضافة ملف
            </Button>
          </div>
          <div className="space-y-2">
            {templateFiles.map((tf, i) => (
              <div key={i} className="flex items-center gap-2" data-testid={`template-file-${i}`}>
                <Input value={tf.nameAr} onChange={e => updateTemplateFile(i, "nameAr", e.target.value)} placeholder="اسم الملف (مثل: دليل الاستخدام)" className="h-8 text-xs flex-1" />
                <Input value={tf.url} onChange={e => updateTemplateFile(i, "url", e.target.value)} placeholder="https://..." dir="ltr" className="h-8 text-xs flex-1" />
                <button type="button" onClick={() => removeTemplateFile(i)} className="w-7 h-7 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center shrink-0">
                  <X className="w-3 h-3 text-red-600" />
                </button>
              </div>
            ))}
            {templateFiles.length === 0 && (
              <p className="text-center text-[11px] text-black/30 py-2">لا توجد ملفات بعد</p>
            )}
          </div>
        </div>
      </div>

      {/* Feature Details (usage guide per feature) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-black/50 flex items-center gap-1.5"><ListChecks className="w-3 h-3" /> تفاصيل المميزات (دليل الاستخدام)</label>
          <Button type="button" size="sm" variant="outline" onClick={addFeatureDetail} className="h-6 px-2 text-[10px] rounded-lg gap-1" data-testid="btn-add-feature-detail">
            <Plus className="w-3 h-3" /> إضافة ميزة
          </Button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {featuresDetails.map((fd, i) => (
            <div key={i} className="bg-black/[0.02] dark:bg-white/[0.02] rounded-xl p-3 border border-black/[0.06] dark:border-white/[0.06] relative" data-testid={`feature-detail-${i}`}>
              <button type="button" onClick={() => removeFeatureDetail(i)} className="absolute top-2 left-2 w-5 h-5 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center">
                <X className="w-3 h-3 text-red-600" />
              </button>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <Input value={fd.icon} onChange={e => updateFeatureDetail(i, "icon", e.target.value)} placeholder="✨" className="h-8 text-center text-lg" title="Emoji أو رمز" />
                <Input value={fd.titleAr} onChange={e => updateFeatureDetail(i, "titleAr", e.target.value)} placeholder="اسم الميزة (عربي)" className="h-8 text-xs col-span-2" />
              </div>
              <Textarea value={fd.descAr} onChange={e => updateFeatureDetail(i, "descAr", e.target.value)} placeholder="كيفية استخدام هذه الميزة..." rows={2} className="text-xs" />
            </div>
          ))}
          {featuresDetails.length === 0 && (
            <p className="text-center text-[11px] text-black/30 py-3">لم يتم إضافة تفاصيل للمميزات بعد</p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full premium-btn" disabled={isPending}>
        {isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
        {template ? "تحديث القالب" : "إنشاء القالب"}
      </Button>
    </form>
  );
}

function PlanForm({ plan, onClose, templates, defaultSegment }: { plan?: PricingPlan; onClose: () => void; templates?: SectorTemplate[]; defaultSegment?: string }) {
  const { toast } = useToast();
  const firstSegment = templates?.[0]?.category || defaultSegment || "restaurant";
  const [formData, setFormData] = useState({
    name: (plan as any)?.name || "",
    nameAr: plan?.nameAr || "",
    slug: plan?.slug || "",
    description: plan?.description || "",
    descriptionAr: plan?.descriptionAr || "",
    tier: (plan as any)?.tier || "pro",
    segment: (plan as any)?.segment || defaultSegment || firstSegment,
    monthlyPrice: (plan as any)?.monthlyPrice?.toString() || "",
    sixMonthPrice: (plan as any)?.sixMonthPrice?.toString() || "",
    annualPrice: (plan as any)?.annualPrice?.toString() || "",
    lifetimePrice: (plan as any)?.lifetimePrice?.toString() || "",
    offerLabel: plan?.offerLabel || "",
    featuresAr: plan?.featuresAr?.join("\n") || "",
    features: plan?.features?.join("\n") || "",
    addonsAr: plan?.addonsAr?.join("\n") || "",
    isPopular: plan?.isPopular ?? false,
    isCustom: plan?.isCustom ?? false,
    sortOrder: plan?.sortOrder?.toString() || "0",
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest("POST", "/api/admin/pricing", data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/pricing"] }); toast({ title: "تم إنشاء الباقة بنجاح" }); onClose(); },
    onError: () => toast({ title: "خطأ في إنشاء الباقة", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/admin/pricing/${plan?.id}`, data);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `خطأ ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/pricing"] }); toast({ title: "تم تحديث الباقة" }); onClose(); },
    onError: (e: any) => toast({ title: "خطأ في تحديث الباقة", description: e.message, variant: "destructive" }),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = formData.slug || `${formData.segment}-${formData.tier}`;
    const payload = {
      name: formData.name || formData.nameAr,
      nameAr: formData.nameAr,
      slug,
      description: formData.description,
      descriptionAr: formData.descriptionAr,
      tier: formData.tier,
      segment: formData.segment,
      price: Number(formData.lifetimePrice) || 0,
      monthlyPrice: Number(formData.monthlyPrice) || 0,
      sixMonthPrice: Number(formData.sixMonthPrice) || 0,
      annualPrice: Number(formData.annualPrice) || 0,
      lifetimePrice: Number(formData.lifetimePrice) || 0,
      billingCycle: "lifetime",
      offerLabel: formData.offerLabel,
      sortOrder: Number(formData.sortOrder),
      isPopular: formData.isPopular,
      isCustom: formData.isCustom,
      featuresAr: formData.featuresAr.split("\n").map(s => s.trim()).filter(Boolean),
      features: formData.features.split("\n").map(s => s.trim()).filter(Boolean),
      addonsAr: formData.addonsAr.split("\n").map(s => s.trim()).filter(Boolean),
    };
    plan ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  const TIER_OPTIONS = [
    { value: "lite",     label: "لايت 🌟",   desc: "الأساسية" },
    { value: "pro",      label: "برو ⚡",     desc: "الأشهر" },
    { value: "infinite", label: "إنفينتي ∞", desc: "الشاملة" },
    { value: "custom",   label: "مخصصة 🏢",  desc: "Enterprise" },
  ];

  const uniqueTemplateCategories = Array.from(new Set(templates?.map(t => t.category).filter(Boolean) ?? []));
  const allKnownSegments = Array.from(new Set([
    ...Object.keys(SEGMENT_META),
    ...uniqueTemplateCategories,
  ]));
  const SEGMENT_OPTIONS = allKnownSegments.map(key => {
    const meta = SEGMENT_META[key];
    const tmpl = templates?.find(t => t.category === key);
    const Icon = meta?.icon || Globe;
    return { value: key, labelAr: tmpl?.nameAr || meta?.labelAr || key, icon: Icon };
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto px-1">
      {/* Segment selector */}
      <div>
        <label className="text-xs font-semibold text-black/50 dark:text-white/50 block mb-2">القالب / نوع المشروع *</label>
        <div className="grid grid-cols-3 gap-2">
          {SEGMENT_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isActive = formData.segment === opt.value;
            return (
              <button key={opt.value} type="button" onClick={() => setFormData(f => ({...f, segment: opt.value}))}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-right transition-all ${isActive ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black" : "border-black/[0.08] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20"}`}>
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-[11px] font-bold truncate">{opt.labelAr}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tier selector */}
      <div>
        <label className="text-xs font-semibold text-black/50 dark:text-white/50 block mb-2">مستوى الباقة *</label>
        <div className="grid grid-cols-4 gap-2">
          {TIER_OPTIONS.map(opt => (
            <button key={opt.value} type="button" onClick={() => setFormData(f => ({...f, tier: opt.value}))}
              className={`p-2.5 rounded-xl border text-center transition-all ${formData.tier === opt.value ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black" : "border-black/[0.08] dark:border-white/[0.08] hover:border-black/20"}`}>
              <div className="text-sm font-bold">{opt.label}</div>
              <div className="text-[10px] opacity-60">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Auto slug preview */}
      <div className="flex items-center gap-2 text-[10px] text-black/30 dark:text-white/30 px-1">
        <span>معرّف الباقة:</span>
        <code className="bg-black/[0.04] px-2 py-0.5 rounded font-mono">{formData.segment}-{formData.tier}</code>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">اسم الباقة (عربي) *</label><Input value={formData.nameAr} onChange={e => setFormData(f => ({...f, nameAr: e.target.value}))} placeholder="لايت / برو / إنفينتي" required /></div>
        <div><label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">Plan Name (EN)</label><Input value={formData.name} onChange={e => setFormData(f => ({...f, name: e.target.value}))} placeholder="Lite / Pro / Infinite" /></div>
      </div>

      <div><label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">وصف الباقة (عربي)</label><Textarea rows={2} value={formData.descriptionAr} onChange={e => setFormData(f => ({...f, descriptionAr: e.target.value}))} placeholder="وصف مختصر للباقة..." /></div>

      {/* 4 Pricing fields */}
      <div className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01] space-y-3">
        <p className="text-xs font-semibold text-black/50 dark:text-white/50 uppercase tracking-wide">الأسعار (ريال سعودي)</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">📅 شهري</label>
            <Input type="number" value={formData.monthlyPrice} onChange={e => setFormData(f => ({...f, monthlyPrice: e.target.value}))} placeholder="199" />
          </div>
          <div>
            <label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">📅 نصف سنوي (6 أشهر)</label>
            <Input type="number" value={formData.sixMonthPrice} onChange={e => setFormData(f => ({...f, sixMonthPrice: e.target.value}))} placeholder="399" />
          </div>
          <div>
            <label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">📆 سنوي</label>
            <Input type="number" value={formData.annualPrice} onChange={e => setFormData(f => ({...f, annualPrice: e.target.value}))} placeholder="699" />
          </div>
          <div>
            <label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">∞ مدى الحياة</label>
            <Input type="number" value={formData.lifetimePrice} onChange={e => setFormData(f => ({...f, lifetimePrice: e.target.value}))} placeholder="3999" />
          </div>
        </div>
        {formData.monthlyPrice && formData.annualPrice && (
          <p className="text-[11px] text-emerald-600 flex items-center gap-1">
            <Check className="w-3 h-3" />
            السنوي يوفّر {Math.round(((Number(formData.monthlyPrice)*12 - Number(formData.annualPrice)) / (Number(formData.monthlyPrice)*12)) * 100)}% مقارنةً بالشهري
          </p>
        )}
        <div>
          <label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">نص بادج العرض</label>
          <Input value={formData.offerLabel} onChange={e => setFormData(f => ({...f, offerLabel: e.target.value}))} placeholder="الأوفر / الأشهر / لفترة محدودة" />
        </div>
      </div>

      {/* Features */}
      <div>
        <label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">المزايا (عربي) — سطر لكل ميزة</label>
        <Textarea rows={6} value={formData.featuresAr} onChange={e => setFormData(f => ({...f, featuresAr: e.target.value}))} placeholder={"تصميم احترافي\nاستضافة مدفوعة\nدعم فني 24/7\nلوحة تحكم"} className="text-sm" />
      </div>
      <div>
        <label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">Features (EN) — one per line</label>
        <Textarea rows={4} value={formData.features} onChange={e => setFormData(f => ({...f, features: e.target.value}))} placeholder={"Professional design\nHosting\n24/7 support"} className="text-sm" />
      </div>

      {/* Flags */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center justify-between p-3 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl border border-black/[0.06] dark:border-white/[0.06]">
          <div>
            <p className="text-xs font-semibold text-black/70 dark:text-white/70">الأكثر طلباً</p>
            <p className="text-[10px] text-black/30 dark:text-white/30">يُبرز البطاقة</p>
          </div>
          <Switch checked={formData.isPopular} onCheckedChange={v => setFormData(f => ({...f, isPopular: v}))} />
        </div>
        <div className="flex items-center justify-between p-3 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl border border-black/[0.06] dark:border-white/[0.06]">
          <div>
            <p className="text-xs font-semibold text-black/70 dark:text-white/70">باقة مخصصة</p>
            <p className="text-[10px] text-black/30 dark:text-white/30">Enterprise</p>
          </div>
          <Switch checked={formData.isCustom} onCheckedChange={v => setFormData(f => ({...f, isCustom: v}))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">ترتيب العرض</label><Input type="number" value={formData.sortOrder} onChange={e => setFormData(f => ({...f, sortOrder: e.target.value}))} /></div>
      </div>

      <Button type="submit" className="w-full premium-btn" disabled={isPending || !formData.nameAr}>
        {isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
        {plan ? "تحديث الباقة" : "إنشاء الباقة"}
      </Button>
    </form>
  );
}

export default function AdminTemplates() {
  const { data: templates, isLoading: templatesLoading } = useTemplates();
  const { data: plans, isLoading: plansLoading } = usePricingPlans();
  const { toast } = useToast();

  const [templateDialog, setTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SectorTemplate | undefined>(undefined);

  const [planDialog, setPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | undefined>(undefined);
  const [segmentFilter, setSegmentFilter] = useState<string>("");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "sixmonth" | "annual" | "lifetime">("monthly");

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/admin/templates/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/templates"] }); toast({ title: "تم حذف القالب" }); },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/admin/pricing/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/pricing"] }); toast({ title: "تم حذف الباقة" }); },
  });

  const allTemplateCategories = Array.from(new Set(templates?.map(t => t.category).filter(Boolean) ?? []));
  const allPlanSegments = Array.from(new Set(plans?.map((p: any) => p.segment).filter(Boolean) ?? []));
  const allSegmentKeys = Array.from(new Set([...allPlanSegments, ...allTemplateCategories]));
  const activeSegment = segmentFilter || allPlanSegments[0] || allTemplateCategories[0] || "restaurant";

  const openNewPlan = (seg?: string) => { setEditingPlan(undefined); if (seg) setSegmentFilter(seg); setPlanDialog(true); };
  const openEditPlan = (plan: PricingPlan) => { setEditingPlan(plan); setPlanDialog(true); };

  const discount = (plan: PricingPlan) =>
    plan.originalPrice && plan.price
      ? Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
      : 0;

  return (
    <div className="relative overflow-hidden space-y-8" data-testid="page-admin-templates">
      <PageGraphics variant="dashboard" />
      <div>
        <h1 className="text-2xl font-bold font-heading text-black dark:text-white">إدارة القوالب والباقات</h1>
        <p className="text-black/40 dark:text-white/40 mt-1 text-sm">أنظمة QIROX وباقات الأسعار والعروض</p>
      </div>

      <Tabs defaultValue="pricing" className="w-full">
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="pricing" className="flex items-center gap-1.5" data-testid="tab-pricing">
            <CreditCard className="w-3.5 h-3.5" /> الباقات ({plans?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-1.5" data-testid="tab-templates">
            <Layers className="w-3.5 h-3.5" /> القوالب ({templates?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* ─── Pricing Tab ─── */}
        <TabsContent value="pricing" className="mt-6">
          <div className="flex items-center justify-between mb-5">
            <div className="text-xs text-black/40 dark:text-white/40">
              {plans?.length || 0} باقة موزّعة على {Object.keys(SEGMENT_META).length} قطاعات
            </div>
            <Button onClick={openNewPlan} className="premium-btn" data-testid="button-add-plan">
              <Plus className="w-4 h-4 ml-2" /> إضافة باقة
            </Button>
          </div>

          {/* Segment filter — built from actual plan segments + template categories */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(allSegmentKeys.length > 0 ? allSegmentKeys : Object.keys(SEGMENT_META)).map(key => {
              const meta = SEGMENT_META[key];
              const Icon = meta?.icon || Globe;
              const tmpl = templates?.find(t => t.category === key);
              const label = tmpl?.nameAr || meta?.labelAr || key;
              const count = plans?.filter((p: any) => p.segment === key).length ?? 0;
              const isActive = activeSegment === key;
              return (
                <button key={key} onClick={() => setSegmentFilter(key)} data-testid={`filter-segment-${key}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    isActive ? `${meta?.bg || "bg-black/5 border-black/10"} ${meta?.color || "text-black dark:text-white"}` : "border-black/[0.07] text-black/40 hover:border-black/15"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${isActive ? "bg-black/10" : "bg-black/[0.04]"}`}>{count}</span>
                </button>
              );
            })}
          </div>

          {plansLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-black/30 dark:text-white/30" /></div>
          ) : (() => {
            const segMeta = SEGMENT_META[activeSegment];
            const tmplForSeg = templates?.find(t => t.category === activeSegment);
            const SegIcon = segMeta?.icon || Globe;
            const segLabel = tmplForSeg?.nameAr || segMeta?.labelAr || activeSegment;
            const filteredPlans = plans?.filter((p: any) => p.segment === activeSegment)
              .sort((a: any, b: any) => (({ lite:1, pro:2, infinite:3 } as Record<string,number>)[a.tier ?? ""] ?? 9) - (({ lite:1, pro:2, infinite:3 } as Record<string,number>)[b.tier ?? ""] ?? 9)) ?? [];

            const TIER_PILL: Record<string, string> = {
              lite:     "bg-teal-50 text-teal-700 border-teal-200",
              pro:      "bg-violet-50 text-violet-700 border-violet-200",
              infinite: "bg-black text-white border-black",
              custom:   "bg-gray-100 text-gray-700 border-gray-300",
            };
            const TIER_LABEL: Record<string, string> = {
              lite: "🌟 لايت", pro: "⚡ برو", infinite: "∞ إنفينتي", custom: "🏢 مخصصة",
            };

            const PERIOD_OPTIONS = [
              { key: "monthly",  labelShort: "شهري",      labelFull: "اشتراك شهري",        getPlanPrice: (p: any) => p.monthlyPrice },
              { key: "sixmonth", labelShort: "نصف سنوي",  labelFull: "اشتراك نصف سنوي",   getPlanPrice: (p: any) => p.sixMonthPrice },
              { key: "annual",   labelShort: "سنوي",      labelFull: "اشتراك سنوي",        getPlanPrice: (p: any) => p.annualPrice },
              { key: "lifetime", labelShort: "مدى الحياة", labelFull: "لمرة واحدة — مدى الحياة", getPlanPrice: (p: any) => p.lifetimePrice },
            ] as const;

            const activePeriodMeta = PERIOD_OPTIONS.find(p => p.key === billingPeriod) ?? PERIOD_OPTIONS[0];

            return (
              <div>
                {/* Section header + period toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border flex-1 ${segMeta?.bg || "bg-black/[0.02] border-black/[0.06]"}`}>
                    <SegIcon className={`w-5 h-5 ${segMeta?.color || "text-black/50"}`} />
                    <div>
                      <p className={`font-black text-sm ${segMeta?.color || "text-black dark:text-white"}`}>{segLabel}</p>
                      <p className="text-[10px] text-black/40">{filteredPlans.length} باقة — عرض أسعار: {activePeriodMeta.labelFull}</p>
                    </div>
                  </div>
                  {/* Period toggle */}
                  <div className="flex items-center gap-1 bg-black/[0.03] dark:bg-white/[0.04] p-1 rounded-xl border border-black/[0.06] dark:border-white/[0.06] flex-shrink-0">
                    {PERIOD_OPTIONS.map(p => (
                      <button
                        key={p.key}
                        onClick={() => setBillingPeriod(p.key)}
                        data-testid={`period-toggle-${p.key}`}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          billingPeriod === p.key
                            ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
                            : "text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70"
                        }`}
                      >
                        {p.labelShort}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {filteredPlans.map((plan: any) => {
                    const activePrice = activePeriodMeta.getPlanPrice(plan);
                    const monthlyRef = plan.monthlyPrice;
                    const savePct = (billingPeriod !== "monthly" && billingPeriod !== "lifetime" && activePrice && monthlyRef)
                      ? Math.round((1 - (activePrice / (monthlyRef * (billingPeriod === "sixmonth" ? 6 : 12)))) * 100)
                      : 0;
                    return (
                    <Card key={plan.id} className={`border overflow-hidden transition-all hover:shadow-md dark:bg-gray-900 dark:border-white/[0.06] ${plan.isPopular ? "border-black/20 dark:border-white/20 shadow-md" : ""}`} data-testid={`admin-plan-${plan.slug}`}>
                      <CardContent className="p-5">
                        {/* Tier + popular */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${TIER_PILL[plan.tier] || TIER_PILL.custom}`}>
                            {TIER_LABEL[plan.tier] || plan.tier}
                          </span>
                          {plan.isPopular && (
                            <Badge className="bg-black text-white text-[10px] gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> الأشهر
                            </Badge>
                          )}
                          {savePct > 0 && (
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] font-black">
                              وفّر {savePct}%
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-black text-black dark:text-white mb-1">{plan.nameAr}</h3>
                        <p className="text-[11px] text-black/35 line-clamp-1 mb-3">{plan.descriptionAr}</p>

                        {/* Active period price — large */}
                        <div className="p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] mb-2 text-center">
                          <p className="text-[9px] text-black/35 dark:text-white/35 mb-1">{activePeriodMeta.labelFull}</p>
                          {activePrice ? (
                            <p className="text-2xl font-black text-black dark:text-white leading-none">
                              {activePrice.toLocaleString()}
                              <SARIcon size={10} className="opacity-30 mr-1" />
                            </p>
                          ) : (
                            <p className="text-lg font-black text-black/20 dark:text-white/20">—</p>
                          )}
                        </div>
                        {/* All-periods mini row */}
                        <div className="grid grid-cols-4 gap-1 mb-3">
                          {PERIOD_OPTIONS.map(po => {
                            const v = po.getPlanPrice(plan);
                            const isSelected = po.key === billingPeriod;
                            return (
                              <button key={po.key} onClick={() => setBillingPeriod(po.key)}
                                className={`rounded-lg py-1.5 text-center transition-all ${isSelected ? "bg-black/[0.07] dark:bg-white/[0.07]" : "hover:bg-black/[0.03]"}`}
                              >
                                <div className={`text-[8px] mb-0.5 ${isSelected ? "text-black/60 dark:text-white/60 font-bold" : "text-black/25 dark:text-white/25"}`}>{po.labelShort}</div>
                                <div className={`text-[10px] font-black ${isSelected ? "text-black dark:text-white" : "text-black/35 dark:text-white/35"}`}>
                                  {v ? v.toLocaleString() : "—"}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Features preview */}
                        <div className="space-y-1 mb-3 max-h-14 overflow-hidden">
                          {plan.featuresAr?.slice(0, 3).map((f: string, i: number) => (
                            <div key={i} className="flex items-center gap-1.5 text-[11px] text-black/40 dark:text-white/40">
                              <Check className="w-3 h-3 flex-shrink-0" /> {f}
                            </div>
                          ))}
                          {(plan.featuresAr?.length || 0) > 3 && (
                            <p className="text-[10px] text-black/25 mr-4">+{(plan.featuresAr?.length || 0) - 3} مزايا</p>
                          )}
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
                          <Button variant="outline" size="sm" className="flex-1 text-xs h-8 dark:border-white/[0.08] dark:text-white/70" onClick={() => openEditPlan(plan)} data-testid={`button-edit-plan-${plan.slug}`}>
                            <Pencil className="w-3 h-3 ml-1" /> تعديل
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 dark:border-white/[0.08]" onClick={() => deletePlanMutation.mutate(plan.id)} disabled={deletePlanMutation.isPending} data-testid={`button-delete-plan-${plan.slug}`}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                  })}

                  {/* Add new card */}
                  <button onClick={() => openNewPlan(activeSegment)} className="border-2 border-dashed border-black/[0.08] dark:border-white/[0.08] rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-black/30 dark:text-white/30 hover:border-black/20 hover:text-black/50 transition-all min-h-[200px]">
                    <Plus className="w-7 h-7" />
                    <span className="text-sm font-medium">باقة جديدة لـ {segLabel}</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </TabsContent>

        {/* ─── Templates Tab ─── */}
        <TabsContent value="templates" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button onClick={() => { setEditingTemplate(undefined); setTemplateDialog(true); }} className="premium-btn" data-testid="button-add-template">
              <Plus className="w-4 h-4 ml-2" /> إضافة قالب
            </Button>
          </div>

          {templatesLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-black/30 dark:text-white/30" /></div>
          ) : (
            <div className="space-y-2.5">
              {templates?.map(template => {
                const Icon = IconMap[template.icon || "Globe"] || Globe;
                return (
                  <Card key={template.id} className="border dark:bg-gray-900 dark:border-white/[0.06]" data-testid={`admin-template-${template.slug}`}>
                    <CardContent className="py-3.5 px-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${template.heroColor}20`, color: template.heroColor }}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h3 className="font-semibold text-black dark:text-white text-sm truncate">{template.nameAr}</h3>
                          <Badge variant="secondary" className="text-[10px]">{template.category}</Badge>
                          <Badge className={`text-[10px] ${template.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : template.status === "coming_soon" ? "bg-yellow-100 text-yellow-700" : "bg-black/[0.05] text-black/40"}`}>
                            {template.status === "active" ? "نشط" : template.status === "coming_soon" ? "قريباً" : "مؤرشف"}
                          </Badge>
                        </div>
                        <div className="text-xs text-black/30 dark:text-white/30 flex items-center gap-2">
                          <span>{template.priceMin?.toLocaleString()} - {template.priceMax?.toLocaleString()} {template.currency} · {template.estimatedDuration}</span>
                          {template.demoUrl && (
                            <a href={template.demoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:text-blue-700 font-medium" data-testid={`link-demo-${template.slug}`}>
                              <ExternalLink className="w-3 h-3" /> ديمو
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingTemplate(template); setTemplateDialog(true); }} data-testid={`button-edit-${template.slug}`}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => deleteMutation.mutate(template.id)} disabled={deleteMutation.isPending} data-testid={`button-delete-${template.slug}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "تعديل القالب" : "قالب جديد"}</DialogTitle>
          </DialogHeader>
          <TemplateForm template={editingTemplate} onClose={() => setTemplateDialog(false)} />
        </DialogContent>
      </Dialog>

      {/* Plan Dialog */}
      <Dialog open={planDialog} onOpenChange={setPlanDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              {editingPlan ? "تعديل الباقة" : "إنشاء باقة جديدة"}
            </DialogTitle>
          </DialogHeader>
          <PlanForm plan={editingPlan} onClose={() => setPlanDialog(false)} templates={templates ?? []} defaultSegment={activeSegment} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
