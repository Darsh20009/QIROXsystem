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
  Sparkles, Tag, Check
} from "lucide-react";
import type { SectorTemplate, PricingPlan } from "@shared/schema";

const IconMap: Record<string, any> = {
  BookOpen, GraduationCap, ClipboardCheck, Dumbbell,
  User, Heart, ShoppingCart, Coffee, Globe
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
    status: (template?.status || "active") as "active" | "coming_soon" | "archived",
    features: template?.features?.join(", ") || "",
    featuresAr: template?.featuresAr?.join("، ") || "",
    tags: template?.tags?.join(", ") || "",
  });

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
    };
    template ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-xs font-medium text-black/50 block mb-1">الاسم (EN)</label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} data-testid="input-template-name" /></div>
        <div><label className="text-xs font-medium text-black/50 block mb-1">الاسم (عربي)</label><Input value={formData.nameAr} onChange={e => setFormData({...formData, nameAr: e.target.value})} data-testid="input-template-nameAr" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-xs font-medium text-black/50 block mb-1">Slug</label><Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} /></div>
        <div><label className="text-xs font-medium text-black/50 block mb-1">التصنيف</label><Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} /></div>
      </div>
      <div><label className="text-xs font-medium text-black/50 block mb-1">وصف عربي</label><Textarea rows={2} value={formData.descriptionAr} onChange={e => setFormData({...formData, descriptionAr: e.target.value})} /></div>
      <div><label className="text-xs font-medium text-black/50 block mb-1">وصف انجليزي</label><Textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="text-xs font-medium text-black/50 block mb-1">السعر من</label><Input type="number" value={formData.priceMin} onChange={e => setFormData({...formData, priceMin: Number(e.target.value)})} /></div>
        <div><label className="text-xs font-medium text-black/50 block mb-1">السعر إلى</label><Input type="number" value={formData.priceMax} onChange={e => setFormData({...formData, priceMax: Number(e.target.value)})} /></div>
        <div><label className="text-xs font-medium text-black/50 block mb-1">مدة التنفيذ</label><Input value={formData.estimatedDuration} onChange={e => setFormData({...formData, estimatedDuration: e.target.value})} placeholder="7-14 يوم" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-black/50 block mb-1">الأيقونة</label>
          <select value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} className="w-full h-10 rounded-lg border border-black/[0.08] px-3 text-sm dark:bg-gray-900 dark:border-white/[0.08]">
            {Object.keys(IconMap).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-black/50 block mb-1">الحالة</label>
          <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full h-10 rounded-lg border border-black/[0.08] px-3 text-sm dark:bg-gray-900 dark:border-white/[0.08]">
            <option value="active">نشط</option>
            <option value="coming_soon">قريباً</option>
            <option value="archived">مؤرشف</option>
          </select>
        </div>
      </div>
      <div><label className="text-xs font-medium text-black/50 block mb-1">لون الهيرو</label><div className="flex gap-2"><input type="color" value={formData.heroColor} onChange={e => setFormData({...formData, heroColor: e.target.value})} className="w-10 h-10 rounded cursor-pointer border border-black/[0.08]" /><Input value={formData.heroColor} onChange={e => setFormData({...formData, heroColor: e.target.value})} className="flex-1" /></div></div>
      <div><label className="text-xs font-medium text-black/50 block mb-1">الميزات (عربي، مفصولة بـ ،)</label><Textarea rows={2} value={formData.featuresAr} onChange={e => setFormData({...formData, featuresAr: e.target.value})} placeholder="ميزة 1، ميزة 2، ميزة 3" /></div>
      <div><label className="text-xs font-medium text-black/50 block mb-1">Features (EN, comma separated)</label><Textarea rows={2} value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} placeholder="Feature 1, Feature 2" /></div>
      <Button type="submit" className="w-full premium-btn" disabled={isPending}>
        {isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
        {template ? "تحديث القالب" : "إنشاء القالب"}
      </Button>
    </form>
  );
}

function PlanForm({ plan, onClose }: { plan?: PricingPlan; onClose: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: plan?.name || "",
    nameAr: plan?.nameAr || "",
    slug: plan?.slug || "",
    description: plan?.description || "",
    descriptionAr: plan?.descriptionAr || "",
    price: plan?.price?.toString() || "",
    originalPrice: plan?.originalPrice?.toString() || "",
    offerLabel: plan?.offerLabel || "",
    currency: plan?.currency || "SAR",
    billingCycle: (plan?.billingCycle || "one_time") as "monthly" | "yearly" | "one_time",
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
    mutationFn: async (data: any) => { const res = await apiRequest("PATCH", `/api/admin/pricing/${plan?.id}`, data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/pricing"] }); toast({ title: "تم تحديث الباقة" }); onClose(); },
    onError: () => toast({ title: "خطأ في تحديث الباقة", variant: "destructive" }),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const discount = formData.originalPrice && formData.price
    ? Math.round(((Number(formData.originalPrice) - Number(formData.price)) / Number(formData.originalPrice)) * 100)
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price: Number(formData.price),
      originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
      sortOrder: Number(formData.sortOrder),
      featuresAr: formData.featuresAr.split("\n").map(s => s.trim()).filter(Boolean),
      features: formData.features.split("\n").map(s => s.trim()).filter(Boolean),
      addonsAr: formData.addonsAr.split("\n").map(s => s.trim()).filter(Boolean),
    };
    plan ? updateMutation.mutate(payload) : createMutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">اسم الباقة (عربي) *</label><Input value={formData.nameAr} onChange={e => setFormData({...formData, nameAr: e.target.value})} placeholder="باقة البداية" required /></div>
        <div><label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">Plan Name (EN)</label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Starter Plan" /></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">Slug (معرّف فريد)</label>
          <Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="starter" />
        </div>
        <div>
          <label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">دورة الدفع</label>
          <select value={formData.billingCycle} onChange={e => setFormData({...formData, billingCycle: e.target.value as any})} className="w-full h-10 rounded-lg border border-black/[0.08] dark:border-white/[0.08] px-3 text-sm dark:bg-gray-900 dark:text-white">
            <option value="one_time">مرة واحدة</option>
            <option value="monthly">شهري</option>
            <option value="yearly">سنوي</option>
          </select>
        </div>
      </div>

      <div><label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">وصف الباقة (عربي)</label><Textarea rows={2} value={formData.descriptionAr} onChange={e => setFormData({...formData, descriptionAr: e.target.value})} placeholder="وصف مختصر للباقة..." /></div>
      <div><label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">Package Description (EN)</label><Textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Short description..." /></div>

      {/* Pricing */}
      <div className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01] space-y-3">
        <p className="text-xs font-semibold text-black/50 dark:text-white/50 uppercase tracking-wide">التسعير والعروض</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">السعر الحالي (ر.س) *</label>
            <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="1999" required />
          </div>
          <div>
            <label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">السعر الأصلي (قبل الخصم)</label>
            <Input type="number" value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: e.target.value})} placeholder="2999" />
          </div>
        </div>
        {discount > 0 && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <BadgePercent className="w-4 h-4" />
            نسبة الخصم: <span className="font-bold">{discount}%</span>
            <span className="text-black/30 dark:text-white/30">— وفّر {Number(formData.originalPrice) - Number(formData.price)} ر.س</span>
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">نص بادج العرض</label>
          <Input value={formData.offerLabel} onChange={e => setFormData({...formData, offerLabel: e.target.value})} placeholder="عرض محدود الوقت" />
          <p className="text-[10px] text-black/30 dark:text-white/30 mt-1">يظهر كشريط ملوّن على البطاقة</p>
        </div>
      </div>

      {/* Features */}
      <div>
        <label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">المزايا (عربي) — سطر لكل ميزة</label>
        <Textarea rows={5} value={formData.featuresAr} onChange={e => setFormData({...formData, featuresAr: e.target.value})} placeholder={"تصميم احترافي\nاستضافة مدفوعة سنة\nدعم فني 24/7\nلوحة تحكم"} className="text-sm" />
      </div>
      <div>
        <label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">Features (EN) — one per line</label>
        <Textarea rows={4} value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} placeholder={"Professional design\n1-year hosting\n24/7 support"} className="text-sm" />
      </div>
      <div>
        <label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">الإضافات (اختيارية) — سطر لكل إضافة</label>
        <Textarea rows={3} value={formData.addonsAr} onChange={e => setFormData({...formData, addonsAr: e.target.value})} placeholder={"تطبيق جوال\nقاعدة بيانات"} className="text-sm" />
      </div>

      {/* Flags */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center justify-between p-3 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl border border-black/[0.06] dark:border-white/[0.06]">
          <div>
            <p className="text-xs font-semibold text-black/70 dark:text-white/70">الأكثر طلباً</p>
            <p className="text-[10px] text-black/30 dark:text-white/30">يُبرز البطاقة</p>
          </div>
          <Switch checked={formData.isPopular} onCheckedChange={v => setFormData({...formData, isPopular: v})} />
        </div>
        <div className="flex items-center justify-between p-3 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl border border-black/[0.06] dark:border-white/[0.06]">
          <div>
            <p className="text-xs font-semibold text-black/70 dark:text-white/70">باقة مخصصة</p>
            <p className="text-[10px] text-black/30 dark:text-white/30">Enterprise</p>
          </div>
          <Switch checked={formData.isCustom} onCheckedChange={v => setFormData({...formData, isCustom: v})} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">ترتيب العرض</label><Input type="number" value={formData.sortOrder} onChange={e => setFormData({...formData, sortOrder: e.target.value})} /></div>
        <div><label className="text-xs font-medium text-black/50 dark:text-white/50 block mb-1">العملة</label><Input value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} /></div>
      </div>

      <Button type="submit" className="w-full premium-btn" disabled={isPending || !formData.nameAr || !formData.price}>
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/admin/templates/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/templates"] }); toast({ title: "تم حذف القالب" }); },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/admin/pricing/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/pricing"] }); toast({ title: "تم حذف الباقة" }); },
  });

  const openNewPlan = () => { setEditingPlan(undefined); setPlanDialog(true); };
  const openEditPlan = (plan: PricingPlan) => { setEditingPlan(plan); setPlanDialog(true); };

  const discount = (plan: PricingPlan) =>
    plan.originalPrice && plan.price
      ? Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
      : 0;

  return (
    <div className="space-y-8" data-testid="page-admin-templates">
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
          <div className="flex justify-end mb-4">
            <Button onClick={openNewPlan} className="premium-btn" data-testid="button-add-plan">
              <Plus className="w-4 h-4 ml-2" /> إضافة باقة جديدة
            </Button>
          </div>

          {plansLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-black/30 dark:text-white/30" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {plans?.map(plan => (
                <Card key={plan.id} className={`border overflow-hidden transition-all hover:shadow-md dark:bg-gray-900 dark:border-white/[0.06] ${plan.isPopular ? "border-black/20 dark:border-white/20 shadow-sm" : ""}`} data-testid={`admin-plan-${plan.slug}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-black dark:text-white text-sm truncate">{plan.nameAr}</h3>
                          {plan.isPopular && (
                            <Badge className="bg-black dark:bg-white text-white dark:text-black text-[10px] flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> الأكثر طلباً
                            </Badge>
                          )}
                          {plan.isCustom && (
                            <Badge variant="outline" className="text-[10px]">Enterprise</Badge>
                          )}
                          {plan.offerLabel && (
                            <Badge className="bg-emerald-500 text-white text-[10px] flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5" /> {plan.offerLabel}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-black/35 dark:text-white/35 leading-relaxed line-clamp-2">{plan.descriptionAr}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-black dark:text-white">{plan.price.toLocaleString()}</span>
                        <span className="text-xs text-black/35 dark:text-white/35">{plan.currency}</span>
                        {plan.billingCycle !== "one_time" && (
                          <span className="text-xs text-black/25 dark:text-white/25">
                            /{plan.billingCycle === "monthly" ? "شهر" : "سنة"}
                          </span>
                        )}
                      </div>
                      {plan.originalPrice && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-black/25 dark:text-white/25 line-through">{plan.originalPrice.toLocaleString()}</span>
                          <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                            -{discount(plan)}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 mb-4 max-h-20 overflow-hidden">
                      {plan.featuresAr?.slice(0, 3).map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-black/40 dark:text-white/40">
                          <Check className="w-3 h-3 text-black/30 dark:text-white/30 flex-shrink-0" />
                          {f}
                        </div>
                      ))}
                      {(plan.featuresAr?.length || 0) > 3 && (
                        <p className="text-[10px] text-black/25 dark:text-white/25 mr-4">+{(plan.featuresAr?.length || 0) - 3} مزايا أخرى</p>
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
              ))}

              {/* Add new card */}
              <button onClick={openNewPlan} className="border-2 border-dashed border-black/[0.08] dark:border-white/[0.08] rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-black/30 dark:text-white/30 hover:border-black/20 dark:hover:border-white/20 hover:text-black/50 dark:hover:text-white/50 transition-all min-h-[200px]">
                <Plus className="w-8 h-8" />
                <span className="text-sm font-medium">إضافة باقة جديدة</span>
              </button>
            </div>
          )}
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
                        <div className="text-xs text-black/30 dark:text-white/30">{template.priceMin?.toLocaleString()} - {template.priceMax?.toLocaleString()} {template.currency} · {template.estimatedDuration}</div>
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
          <PlanForm plan={editingPlan} onClose={() => setPlanDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
