import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, Plus, Edit2, Trash2, Handshake, ExternalLink,
  CheckCircle2, XCircle, Star, Globe, Layers, ChevronDown,
  CheckCheck, X, ToggleLeft, ToggleRight, Eye, EyeOff
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Partner } from "@shared/schema";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { ImageUpload } from "@/components/ImageUpload";

const SERVICES = [
  "نظام إدارة المطاعم",
  "نظام إدارة الكافيهات",
  "نظام نقاط البيع (POS)",
  "نظام المخزون والمستودعات",
  "نظام الحجوزات والمواعيد",
  "نظام أكاديميات القرآن",
  "نظام إدارة العقارات",
  "نظام صالونات التجميل",
  "نظام اللياقة البدنية",
  "نظام إدارة المدارس",
  "نظام التجارة الإلكترونية",
  "نظام إدارة المستشفيات",
  "لوحة تحكم الإدارة",
  "تطبيق الموبايل",
  "تكامل الدفع الإلكتروني",
  "أخرى",
];

interface FormData {
  name: string;
  nameAr: string;
  logoUrl: string;
  websiteUrl: string;
  category: string;
  sortOrder: string;
  isActive: boolean;
  description: string;
  descriptionAr: string;
  features: string[];
  featuresAr: string[];
  relatedService: string;
  featureInput: string;
  featureArInput: string;
}

const emptyForm: FormData = {
  name: "",
  nameAr: "",
  logoUrl: "",
  websiteUrl: "",
  category: "",
  sortOrder: "0",
  isActive: true,
  description: "",
  descriptionAr: "",
  features: [],
  featuresAr: [],
  relatedService: "",
  featureInput: "",
  featureArInput: "",
};

export default function AdminPartners() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  const { data: partners, isLoading } = useQuery<Partner[]>({
    queryKey: ["/api/admin/partners"],
  });

  const set = (k: keyof FormData, v: any) => setFormData(f => ({ ...f, [k]: v }));

  const toPayload = (data: FormData) => ({
    name: data.name,
    nameAr: data.nameAr || undefined,
    logoUrl: data.logoUrl,
    websiteUrl: data.websiteUrl || undefined,
    category: data.category || undefined,
    sortOrder: data.sortOrder ? Number(data.sortOrder) : 0,
    isActive: data.isActive,
    description: data.description || undefined,
    descriptionAr: data.descriptionAr || undefined,
    features: data.features,
    featuresAr: data.featuresAr,
    relatedService: data.relatedService || undefined,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/admin/partners", toPayload(data));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: L ? "✅ تم إضافة الشريك بنجاح" : "✅ Partner added successfully" });
      setOpen(false);
      setFormData(emptyForm);
    },
    onError: () => toast({ title: L ? "خطأ في إضافة الشريك" : "Error adding partner", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("PATCH", `/api/admin/partners/${editingId}`, toPayload(data));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: L ? "✅ تم تحديث الشريك بنجاح" : "✅ Partner updated successfully" });
      setOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
    },
    onError: () => toast({ title: L ? "خطأ في تحديث الشريك" : "Error updating partner", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/admin/partners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: L ? "تم حذف الشريك بنجاح" : "Partner deleted successfully" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/partners/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.logoUrl) {
      toast({ title: L ? "يرجى ملء الاسم واللوجو" : "Please fill in name and logo", variant: "destructive" });
      return;
    }
    if (editingId) updateMutation.mutate(formData);
    else createMutation.mutate(formData);
  };

  const handleEdit = (partner: Partner) => {
    setEditingId(partner.id);
    setFormData({
      name: partner.name,
      nameAr: partner.nameAr || "",
      logoUrl: partner.logoUrl,
      websiteUrl: partner.websiteUrl || "",
      category: partner.category || "",
      sortOrder: partner.sortOrder?.toString() || "0",
      isActive: partner.isActive ?? true,
      description: partner.description || "",
      descriptionAr: partner.descriptionAr || "",
      features: partner.features || [],
      featuresAr: partner.featuresAr || [],
      relatedService: partner.relatedService || "",
      featureInput: "",
      featureArInput: "",
    });
    setOpen(true);
  };

  const addFeature = () => {
    const en = formData.featureInput.trim();
    const ar = formData.featureArInput.trim();
    if (!en && !ar) return;
    setFormData(f => ({
      ...f,
      features: [...f.features, en || ar],
      featuresAr: [...f.featuresAr, ar || en],
      featureInput: "",
      featureArInput: "",
    }));
  };

  const removeFeature = (i: number) => {
    setFormData(f => ({
      ...f,
      features: f.features.filter((_, j) => j !== i),
      featuresAr: f.featuresAr.filter((_, j) => j !== i),
    }));
  };

  const filteredPartners = (partners || []).filter(p => {
    if (filterActive === "active") return p.isActive;
    if (filterActive === "inactive") return !p.isActive;
    return true;
  });

  const activeCount = (partners || []).filter(p => p.isActive).length;
  const inactiveCount = (partners || []).filter(p => !p.isActive).length;

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin w-8 h-8 text-black/40 dark:text-white/40" />
    </div>
  );

  return (
    <div className="relative overflow-hidden space-y-6 p-4 md:p-6" dir={dir}>
      <PageGraphics variant="dashboard" />

      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-black text-black dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Handshake className="w-5 h-5 text-white" />
            </div>
            {L ? "إدارة الشركاء" : "Partners Management"}
          </h1>
          <p className="text-sm text-black/40 dark:text-white/40 mt-1 mr-13">
            {(partners || []).length} {L ? "شريك إجمالاً" : "total"} · {activeCount} {L ? "نشط" : "active"} · {inactiveCount} {L ? "مخفي" : "hidden"}
          </p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormData(emptyForm); setOpen(true); }} className="gap-2 bg-gradient-to-l from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20" data-testid="button-add-partner">
          <Plus className="w-4 h-4" /> {L ? "إضافة شريك" : "Add Partner"}
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: "all", label: `${L ? "الكل" : "All"} (${(partners || []).length})` },
          { key: "active", label: `${L ? "نشط" : "Active"} (${activeCount})` },
          { key: "inactive", label: `${L ? "مخفي" : "Hidden"} (${inactiveCount})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilterActive(tab.key as any)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium border transition-all ${filterActive === tab.key ? "bg-black dark:bg-white text-white dark:text-black border-transparent" : "border-black/10 dark:border-white/10 text-black/50 dark:text-white/50 hover:border-black/20 dark:hover:border-white/20"}`}
            data-testid={`tab-filter-${tab.key}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Partners Grid */}
      {filteredPartners.length === 0 ? (
        <div className="text-center py-16 text-black/30 dark:text-white/30">
          <Handshake className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>{L ? "لا يوجد شركاء" : "No partners found"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPartners.map(partner => (
            <div key={partner.id}
              className={`relative rounded-2xl border transition-all overflow-hidden bg-white dark:bg-gray-900 ${partner.isActive ? "border-black/[0.07] dark:border-white/[0.07]" : "border-black/[0.04] dark:border-white/[0.04] opacity-60"}`}
              data-testid={`card-partner-${partner.id}`}>

              {/* Active badge */}
              <div className="absolute top-3 left-3 z-10">
                {partner.isActive
                  ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />{L ? "نشط" : "Active"}</span>
                  : <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 rounded-full"><EyeOff className="w-3 h-3" />{L ? "مخفي" : "Hidden"}</span>
                }
              </div>

              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div className="w-16 h-16 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center overflow-hidden shrink-0">
                    <img src={partner.logoUrl} alt={partner.name} className="max-w-full max-h-full object-contain" />
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="font-bold text-black dark:text-white text-sm leading-tight">{partner.name}</h3>
                    {partner.nameAr && <p className="text-xs text-black/40 dark:text-white/40">{partner.nameAr}</p>}

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {partner.category && (
                        <span className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">{partner.category}</span>
                      )}
                      {partner.relatedService && (
                        <span className="text-[10px] bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5" />{partner.relatedService}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {(partner.descriptionAr || partner.description) && (
                  <p className="text-xs text-black/50 dark:text-white/50 mt-3 leading-relaxed line-clamp-2">
                    {partner.descriptionAr || partner.description}
                  </p>
                )}

                {/* Features */}
                {(partner.featuresAr?.length || partner.features?.length) ? (
                  <div className="mt-3 space-y-1">
                    {(partner.featuresAr?.length ? partner.featuresAr : partner.features || []).slice(0, 3).map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-black/60 dark:text-white/60">
                        <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                        {f}
                      </div>
                    ))}
                    {(partner.features?.length || 0) > 3 && (
                      <p className="text-[10px] text-black/30 dark:text-white/30">+{(partner.features?.length || 0) - 3} {L ? "ميزة أخرى" : "more"}</p>
                    )}
                  </div>
                ) : null}

                {/* Website + sortOrder */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/[0.05] dark:border-white/[0.05]">
                  <div className="flex items-center gap-2">
                    {partner.websiteUrl ? (
                      <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-500 hover:underline" data-testid={`link-partner-site-${partner.id}`}>
                        <Globe className="w-3 h-3" />
                        {(() => { try { return new URL(partner.websiteUrl!).hostname.replace("www.", ""); } catch { return L ? "رابط" : "link"; } })()}
                      </a>
                    ) : <span className="text-xs text-black/20 dark:text-white/20">{L ? "لا يوجد موقع" : "No website"}</span>}
                    <span className="text-black/20 dark:text-white/20 text-xs">· {L ? "ترتيب" : "order"}: {partner.sortOrder}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActiveMutation.mutate({ id: partner.id, isActive: !partner.isActive })}
                      className={`p-1.5 rounded-lg transition-colors ${partner.isActive ? "text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20" : "text-black/30 dark:text-white/30 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"}`}
                      title={partner.isActive ? (L ? "إخفاء" : "Hide") : (L ? "إظهار" : "Show")} data-testid={`button-toggle-${partner.id}`}>
                      {partner.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleEdit(partner)}
                      className="p-1.5 rounded-lg text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
                      data-testid={`button-edit-partner-${partner.id}`}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { if (confirm(L ? "هل تريد حذف هذا الشريك؟" : "Delete this partner?")) deleteMutation.mutate(partner.id); }}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      data-testid={`button-delete-partner-${partner.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditingId(null); setFormData(emptyForm); } }}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 font-black">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                <Handshake className="w-4 h-4 text-white" />
              </div>
              {editingId ? (L ? "تعديل الشريك" : "Edit Partner") : (L ? "إضافة شريك جديد" : "Add New Partner")}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            {/* Names */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="lbl">{L ? "اسم الشريك (إنجليزي) *" : "Partner Name (EN) *"}</label>
                <Input value={formData.name} onChange={e => set("name", e.target.value)} placeholder="Partner Name" data-testid="input-partner-name" />
              </div>
              <div>
                <label className="lbl">{L ? "اسم الشريك (عربي)" : "Partner Name (AR)"}</label>
                <Input value={formData.nameAr} onChange={e => set("nameAr", e.target.value)} placeholder="اسم الشريك" data-testid="input-partner-nameAr" />
              </div>
            </div>

            {/* Logo */}
            <ImageUpload label={L ? "لوجو الشريك *" : "Partner Logo *"} value={formData.logoUrl} onChange={url => set("logoUrl", url)} />

            {/* Website + Category + Sort */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="lbl">{L ? "رابط الموقع الرسمي" : "Official Website URL"}</label>
                <Input value={formData.websiteUrl} onChange={e => set("websiteUrl", e.target.value)} placeholder="https://example.com" data-testid="input-partner-website" />
              </div>
              <div>
                <label className="lbl">{L ? "الفئة / القطاع" : "Category / Sector"}</label>
                <Input value={formData.category} onChange={e => set("category", e.target.value)} placeholder={L ? "مطاعم، تعليم، صحة..." : "Restaurants, Education, Health..."} data-testid="input-partner-category" />
              </div>
              <div>
                <label className="lbl">{L ? "الترتيب في الصفحة" : "Page Sort Order"}</label>
                <Input type="number" value={formData.sortOrder} onChange={e => set("sortOrder", e.target.value)} placeholder="0" min={0} data-testid="input-partner-sort" />
              </div>
            </div>

            {/* Related Service */}
            <div>
              <label className="lbl">{L ? "الخدمة المرتبطة" : "Related Service"}</label>
              <select value={formData.relatedService} onChange={e => set("relatedService", e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-sm text-black dark:text-white"
                data-testid="select-related-service">
                <option value="">{L ? "اختر الخدمة..." : "Select service..."}</option>
                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Description */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="lbl">{L ? "وصف مختصر (عربي)" : "Short Description (AR)"}</label>
                <Textarea value={formData.descriptionAr} onChange={e => set("descriptionAr", e.target.value)} placeholder={L ? "وصف تجربة الشريك مع Qirox..." : "Partner's experience with Qirox..."} className="h-20 text-sm" />
              </div>
              <div>
                <label className="lbl">{L ? "وصف مختصر (إنجليزي)" : "Short Description (EN)"}</label>
                <Textarea value={formData.description} onChange={e => set("description", e.target.value)} placeholder="Short description..." className="h-20 text-sm" />
              </div>
            </div>

            {/* Features */}
            <div className="border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-4 space-y-3">
              <label className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" /> {L ? "مميزات النظام المقدّم" : "System Features Provided"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input value={formData.featureArInput} onChange={e => set("featureArInput", e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addFeature())} placeholder={L ? "الميزة بالعربي" : "Feature in Arabic"} data-testid="input-feature-ar" />
                <div className="flex gap-1.5">
                  <Input value={formData.featureInput} onChange={e => set("featureInput", e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addFeature())} placeholder="Feature in English" data-testid="input-feature-en" />
                  <Button type="button" size="sm" onClick={addFeature} className="shrink-0" data-testid="button-add-feature">+</Button>
                </div>
              </div>
              {formData.features.length > 0 && (
                <div className="space-y-1.5">
                  {formData.features.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02] rounded-xl px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-black dark:text-white font-medium">{formData.featuresAr[i] || f}</span>
                        {formData.featuresAr[i] && f && formData.featuresAr[i] !== f && (
                          <span className="text-black/30 dark:text-white/30 text-xs">/ {f}</span>
                        )}
                      </div>
                      <button type="button" onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-600 text-sm font-bold">✕</button>
                    </div>
                  ))}
                </div>
              )}
              {formData.features.length === 0 && (
                <p className="text-xs text-black/30 dark:text-white/30 text-center py-2">{L ? "أضف مميزات النظام الذي حصل عليه هذا الشريك" : "Add features of the system this partner uses"}</p>
              )}
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-4 border border-black/[0.07] dark:border-white/[0.07] rounded-2xl">
              <div>
                <p className="font-semibold text-sm text-black dark:text-white">{L ? "ظهور في صفحة الشركاء" : "Show on Partners Page"}</p>
                <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">{L ? "عند الإيقاف، لن يظهر الشريك للزوار" : "When disabled, the partner won't appear to visitors"}</p>
              </div>
              <button type="button" onClick={() => set("isActive", !formData.isActive)}
                className={`w-12 h-6 rounded-full transition-all relative ${formData.isActive ? "bg-green-500" : "bg-black/20 dark:bg-white/20"}`}
                data-testid="toggle-partner-active">
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${formData.isActive ? "right-1" : "left-1"}`} />
              </button>
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="submit" className="flex-1 gap-2 bg-gradient-to-l from-blue-600 to-cyan-500 text-white"
                disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-partner">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? (L ? "تحديث الشريك" : "Update Partner") : (L ? "إضافة الشريك" : "Add Partner")}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>{L ? "إلغاء" : "Cancel"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <style>{`.lbl { display: block; font-size: 11px; color: rgba(0,0,0,0.4); margin-bottom: 6px; font-weight: 500; }.dark .lbl { color: rgba(255,255,255,0.4); }`}</style>
    </div>
  );
}
