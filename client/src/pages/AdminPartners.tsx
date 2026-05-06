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
  CheckCheck, X, ToggleLeft, ToggleRight, Eye, EyeOff,
  Copy, Search, Sparkles, ChevronUp
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Partner } from "@shared/schema";
import { useState, useRef } from "react";
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
  const [copyPanelOpen, setCopyPanelOpen] = useState(false);
  const [copySearch, setCopySearch] = useState("");
  const [copiedFrom, setCopiedFrom] = useState<string | null>(null);

  const { data: partners, isLoading } = useQuery<Partner[]>({
    queryKey: ["/api/admin/partners"],
  });

  const set = (k: keyof FormData, v: any) => setFormData(f => ({ ...f, [k]: v }));

  const copyFromPartner = (partner: Partner) => {
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
      features: [...(partner.features || [])],
      featuresAr: [...(partner.featuresAr || [])],
      relatedService: partner.relatedService || "",
      featureInput: "",
      featureArInput: "",
    });
    setCopiedFrom(partner.nameAr || partner.name);
    setCopyPanelOpen(false);
    setCopySearch("");
    toast({ title: L ? `✅ تم استيراد بيانات "${partner.nameAr || partner.name}" — عدّل ما تحتاجه` : `✅ Imported from "${partner.name}" — edit as needed` });
  };

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
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-black dark:from-white to-black dark:to-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Handshake className="w-5 h-5 text-white" />
            </div>
            {L ? "إدارة الشركاء" : "Partners Management"}
          </h1>
          <p className="text-sm text-black/40 dark:text-white/40 mt-1 mr-13">
            {(partners || []).length} {L ? "شريك إجمالاً" : "total"} · {activeCount} {L ? "نشط" : "active"} · {inactiveCount} {L ? "مخفي" : "hidden"}
          </p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormData(emptyForm); setOpen(true); }} className="gap-2 bg-gradient-to-l from-black dark:from-white to-black dark:to-white text-white shadow-lg shadow-blue-500/20" data-testid="button-add-partner">
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
                  ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white dark:bg-black dark:bg-white dark:text-black/70 dark:text-white/70 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />{L ? "نشط" : "Active"}</span>
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
                        <span className="text-[10px] bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70 px-2 py-0.5 rounded-full font-medium">{partner.category}</span>
                      )}
                      {partner.relatedService && (
                        <span className="text-[10px] bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
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
                        <CheckCircle2 className="w-3 h-3 text-black dark:text-white shrink-0" />
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
                        className="flex items-center gap-1 text-xs text-black dark:text-white hover:underline" data-testid={`link-partner-site-${partner.id}`}>
                        <Globe className="w-3 h-3" />
                        {(() => { try { return new URL(partner.websiteUrl!).hostname.replace("www.", ""); } catch { return L ? "رابط" : "link"; } })()}
                      </a>
                    ) : <span className="text-xs text-black/20 dark:text-white/20">{L ? "لا يوجد موقع" : "No website"}</span>}
                    <span className="text-black/20 dark:text-white/20 text-xs">· {L ? "ترتيب" : "order"}: {partner.sortOrder}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActiveMutation.mutate({ id: partner.id, isActive: !partner.isActive })}
                      className={`p-1.5 rounded-lg transition-colors ${partner.isActive ? "text-black dark:text-white hover:bg-black/[0.04] dark:bg-white/[0.06] dark:hover:bg-black dark:bg-white" : "text-black/30 dark:text-white/30 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"}`}
                      title={partner.isActive ? (L ? "إخفاء" : "Hide") : (L ? "إظهار" : "Show")} data-testid={`button-toggle-${partner.id}`}>
                      {partner.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleEdit(partner)}
                      className="p-1.5 rounded-lg text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
                      data-testid={`button-edit-partner-${partner.id}`}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { if (confirm(L ? "هل تريد حذف هذا الشريك؟" : "Delete this partner?")) deleteMutation.mutate(partner.id); }}
                      className="p-1.5 rounded-lg text-black/70 dark:text-white/70 hover:text-black dark:text-white hover:bg-black/[0.04] dark:bg-white/[0.06] dark:hover:bg-black dark:bg-white transition-colors"
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
      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditingId(null); setFormData(emptyForm); setCopyPanelOpen(false); setCopySearch(""); setCopiedFrom(null); } }}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 font-black">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-black dark:from-white to-black dark:to-white flex items-center justify-center">
                <Handshake className="w-4 h-4 text-white" />
              </div>
              {editingId ? (L ? "تعديل الشريك" : "Edit Partner") : (L ? "إضافة شريك جديد" : "Add New Partner")}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-2">

            {/* ── Copy from existing partner (create mode only) ── */}
            {!editingId && (partners || []).length > 0 && (
              <div className="rounded-2xl border border-dashed border-black/15 dark:border-white/15 overflow-hidden">
                <button type="button"
                  onClick={() => { setCopyPanelOpen(o => !o); setCopySearch(""); }}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all"
                  data-testid="button-copy-from-partner">
                  <span className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-black/[0.05] dark:bg-white/[0.06] flex items-center justify-center">
                      <Copy className="w-3.5 h-3.5" />
                    </div>
                    {L ? "استيراد بيانات من شريك موجود" : "Import data from existing partner"}
                    {copiedFrom && !copyPanelOpen && (
                      <span className="text-[10px] font-semibold bg-black/[0.05] dark:bg-white/[0.06] text-black/50 dark:text-white/50 px-2 py-0.5 rounded-full">
                        {L ? "من:" : "from:"} {copiedFrom}
                      </span>
                    )}
                  </span>
                  {copyPanelOpen
                    ? <ChevronUp className="w-4 h-4 opacity-40" />
                    : <ChevronDown className="w-4 h-4 opacity-40" />}
                </button>

                {copyPanelOpen && (
                  <div className="border-t border-black/[0.06] dark:border-white/[0.06] p-3 space-y-2 bg-black/[0.01] dark:bg-white/[0.01]">
                    {/* Search */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-black/30 dark:text-white/30 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        autoFocus
                        value={copySearch}
                        onChange={e => setCopySearch(e.target.value)}
                        placeholder={L ? "ابحث عن شريك..." : "Search partner..."}
                        className="w-full h-9 pr-9 pl-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-900 text-sm outline-none focus:border-black/25 dark:focus:border-white/25 transition"
                        data-testid="input-copy-search"
                      />
                    </div>

                    {/* Partner list */}
                    <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
                      {(partners || [])
                        .filter(p => {
                          if (!copySearch.trim()) return true;
                          const q = copySearch.toLowerCase();
                          return (p.name?.toLowerCase().includes(q) || p.nameAr?.includes(copySearch) || p.category?.toLowerCase().includes(q));
                        })
                        .map(p => (
                          <button key={p.id} type="button"
                            onClick={() => copyFromPartner(p)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-right transition-colors group"
                            data-testid={`button-copy-partner-${p.id}`}>
                            <div className="w-9 h-9 rounded-lg border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden shrink-0">
                              <img src={p.logoUrl} alt={p.name} className="max-w-full max-h-full object-contain" />
                            </div>
                            <div className="flex-1 min-w-0 text-right">
                              <p className="text-sm font-semibold text-black dark:text-white truncate">{p.nameAr || p.name}</p>
                              {p.category && <p className="text-xs text-black/40 dark:text-white/40 truncate">{p.category}</p>}
                            </div>
                            <span className="text-[10px] font-bold text-black/30 dark:text-white/30 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 flex items-center gap-1">
                              <Copy className="w-3 h-3" /> {L ? "استيراد" : "Import"}
                            </span>
                          </button>
                        ))}
                      {(partners || []).filter(p => {
                        if (!copySearch.trim()) return true;
                        const q = copySearch.toLowerCase();
                        return (p.name?.toLowerCase().includes(q) || p.nameAr?.includes(copySearch) || p.category?.toLowerCase().includes(q));
                      }).length === 0 && (
                        <p className="text-xs text-black/30 dark:text-white/30 text-center py-4">{L ? "لا توجد نتائج" : "No results"}</p>
                      )}
                    </div>

                    <p className="text-[10px] text-black/30 dark:text-white/30 px-1">
                      {L ? "سيتم ملء جميع الحقول تلقائياً — يمكنك التعديل بعدها بحرية" : "All fields will be pre-filled — you can edit freely after"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Copied-from indicator ── */}
            {copiedFrom && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06]">
                <Sparkles className="w-3.5 h-3.5 text-black/40 dark:text-white/40 shrink-0" />
                <p className="text-xs text-black/50 dark:text-white/50 flex-1">
                  {L ? `تم الاستيراد من "${copiedFrom}" — الحقول جاهزة للتعديل` : `Imported from "${copiedFrom}" — fields ready to edit`}
                </p>
                <button type="button" onClick={() => { setCopiedFrom(null); setFormData(emptyForm); }}
                  className="text-[10px] text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white font-bold hover:bg-black/[0.04] dark:hover:bg-white/[0.04] px-2 py-1 rounded-lg transition">
                  {L ? "مسح" : "Clear"}
                </button>
              </div>
            )}

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
                <Star className="w-4 h-4 text-black dark:text-white" /> {L ? "مميزات النظام المقدّم" : "System Features Provided"}
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
                        <CheckCircle2 className="w-3.5 h-3.5 text-black dark:text-white" />
                        <span className="text-black dark:text-white font-medium">{formData.featuresAr[i] || f}</span>
                        {formData.featuresAr[i] && f && formData.featuresAr[i] !== f && (
                          <span className="text-black/30 dark:text-white/30 text-xs">/ {f}</span>
                        )}
                      </div>
                      <button type="button" onClick={() => removeFeature(i)} className="text-black/70 dark:text-white/70 hover:text-black dark:text-white text-sm font-bold">✕</button>
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
                className={`w-12 h-6 rounded-full transition-all relative ${formData.isActive ? "bg-black dark:bg-white" : "bg-black/20 dark:bg-white/20"}`}
                data-testid="toggle-partner-active">
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${formData.isActive ? "right-1" : "left-1"}`} />
              </button>
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="submit" className="flex-1 gap-2 bg-gradient-to-l from-black dark:from-white to-black dark:to-white text-white"
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
