import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Monitor, Plus, Pencil, Trash2, ExternalLink, Loader2, Save, X,
  Globe, ChevronDown, Palette, Video, FileText, Zap, Clock, Eye,
  EyeOff, CheckCircle2, Play,
} from "lucide-react";

interface TemplateFile {
  nameAr: string;
  url: string;
}

interface DemoItem {
  _id: string;
  name: string;
  nameAr: string;
  slug: string;
  description: string;
  descriptionAr: string;
  category: string;
  demoUrl?: string;
  heroColor?: string;
  featuresAr?: string[];
  estimatedDuration?: string;
  howToUseAr?: string;
  howToUseVideoUrl?: string;
  templateFiles?: TemplateFile[];
  status: "active" | "coming_soon" | "archived";
  createdAt?: string;
}

const CATEGORIES = [
  { value: "restaurant",  labelAr: "مطاعم ومقاهي" },
  { value: "ecommerce",   labelAr: "متاجر إلكترونية" },
  { value: "education",   labelAr: "تعليم وتدريب" },
  { value: "real_estate", labelAr: "عقارات" },
  { value: "healthcare",  labelAr: "صحة وعيادات" },
  { value: "services",    labelAr: "خدمات عامة" },
  { value: "saas",        labelAr: "SaaS / برمجيات" },
  { value: "other",       labelAr: "أخرى" },
];

const COLORS = [
  "#0f172a","#7c3aed","#2563eb","#0891b2","#059669","#d97706","#dc2626","#db2777","#ea580c","#4f46e5",
];

const STATUS_CONFIG = {
  active:      { label: "نشط",     badge: "bg-green-100 text-green-700" },
  coming_soon: { label: "قريباً",  badge: "bg-yellow-100 text-yellow-700" },
  archived:    { label: "مؤرشف",   badge: "bg-gray-100 text-gray-500" },
};

const emptyForm = {
  nameAr: "", name: "", descriptionAr: "", category: "restaurant",
  demoUrl: "", heroColor: "#0f172a", estimatedDuration: "",
  howToUseAr: "", howToUseVideoUrl: "", status: "active" as const,
  featuresAr: [] as string[], templateFiles: [] as TemplateFile[],
};

export default function EmployeeDemos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [newFeature, setNewFeature] = useState("");
  const [newFile, setNewFile] = useState({ nameAr: "", url: "" });
  const [showFilesPanel, setShowFilesPanel] = useState(false);
  const [showFeaturesPanel, setShowFeaturesPanel] = useState(false);

  const { data: items = [], isLoading } = useQuery<DemoItem[]>({
    queryKey: ["/api/employee/demos"],
    queryFn: async () => {
      const r = await fetch("/api/employee/demos", { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/employee/demos", form).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/demos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      resetForm();
      toast({ title: "✅ تم إضافة الديمو بنجاح — يظهر الآن في صفحة /demos" });
    },
    onError: (e: any) => toast({ title: "فشل الحفظ", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/employee/demos/${editId}`, form).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/demos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      resetForm();
      toast({ title: "✅ تم تحديث الديمو" });
    },
    onError: () => toast({ title: "فشل التحديث", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/employee/demos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/demos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "✅ تم الحذف" });
    },
    onError: () => toast({ title: "فشل الحذف", variant: "destructive" }),
  });

  function resetForm() {
    setForm({ ...emptyForm });
    setEditId(null);
    setShowForm(false);
    setNewFeature("");
    setNewFile({ nameAr: "", url: "" });
    setShowFilesPanel(false);
    setShowFeaturesPanel(false);
  }

  function startEdit(item: DemoItem) {
    setForm({
      nameAr: item.nameAr, name: item.name, descriptionAr: item.descriptionAr || "",
      category: item.category, demoUrl: item.demoUrl || "", heroColor: item.heroColor || "#0f172a",
      estimatedDuration: item.estimatedDuration || "", howToUseAr: item.howToUseAr || "",
      howToUseVideoUrl: item.howToUseVideoUrl || "", status: item.status,
      featuresAr: item.featuresAr || [], templateFiles: item.templateFiles || [],
    });
    setEditId(item._id);
    setShowForm(true);
    setShowFeaturesPanel((item.featuresAr || []).length > 0);
    setShowFilesPanel((item.templateFiles || []).length > 0);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
  }

  function addFeature() {
    if (!newFeature.trim()) return;
    setForm(p => ({ ...p, featuresAr: [...p.featuresAr, newFeature.trim()] }));
    setNewFeature("");
  }

  function removeFeature(i: number) {
    setForm(p => ({ ...p, featuresAr: p.featuresAr.filter((_, idx) => idx !== i) }));
  }

  function addFile() {
    if (!newFile.nameAr.trim() || !newFile.url.trim()) return;
    setForm(p => ({ ...p, templateFiles: [...p.templateFiles, { ...newFile }] }));
    setNewFile({ nameAr: "", url: "" });
  }

  function removeFile(i: number) {
    setForm(p => ({ ...p, templateFiles: p.templateFiles.filter((_, idx) => idx !== i) }));
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="relative overflow-hidden space-y-6 max-w-4xl" dir="rtl">
      <PageGraphics variant="dashboard" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
            <Monitor className="w-5 h-5 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black dark:text-white">إدارة الديموز</h1>
            <p className="text-xs text-black/35 dark:text-white/35">أضف أنظمة تظهر مباشرةً في صفحة /demos للعملاء</p>
          </div>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}
            className="bg-black dark:bg-white text-white dark:text-black gap-2"
            data-testid="btn-add-demo">
            <Plus className="w-4 h-4" /> إضافة نظام
          </Button>
        )}
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
          >
            <Card className="border-black/[0.1] dark:border-white/[0.1] shadow-sm rounded-2xl dark:bg-gray-900">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    {editId ? "تعديل الديمو" : "إضافة نظام جديد"}
                  </CardTitle>
                  <button onClick={resetForm} className="text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">اسم النظام (عربي) *</label>
                    <Input value={form.nameAr} onChange={e => setForm(p => ({ ...p, nameAr: e.target.value }))}
                      placeholder="مثال: نظام إدارة المطعم"
                      className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                      data-testid="input-demo-name-ar" />
                  </div>
                  <div>
                    <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">الفئة *</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full h-10 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:border-black/20 dark:focus:border-white/20"
                      data-testid="select-demo-category">
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.labelAr}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">وصف النظام (عربي)</label>
                  <Textarea value={form.descriptionAr} onChange={e => setForm(p => ({ ...p, descriptionAr: e.target.value }))}
                    placeholder="اكتب وصفاً واضحاً للنظام وما يقدمه للعميل..."
                    rows={3} className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                    data-testid="input-demo-desc" />
                </div>

                {/* Demo URL + Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-black/40 dark:text-white/40 mb-1 block flex items-center gap-1">
                      <Globe className="w-3 h-3" /> رابط الديمو الحي
                    </label>
                    <Input value={form.demoUrl} onChange={e => setForm(p => ({ ...p, demoUrl: e.target.value }))}
                      placeholder="https://demo.example.com" dir="ltr"
                      className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                      data-testid="input-demo-url" />
                  </div>
                  <div>
                    <label className="text-xs text-black/40 dark:text-white/40 mb-1 block flex items-center gap-1">
                      <Clock className="w-3 h-3" /> المدة التقديرية للتسليم
                    </label>
                    <Input value={form.estimatedDuration} onChange={e => setForm(p => ({ ...p, estimatedDuration: e.target.value }))}
                      placeholder="مثال: ٧–١٤ يوم"
                      className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                      data-testid="input-demo-duration" />
                  </div>
                </div>

                {/* Color + Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-black/40 dark:text-white/40 mb-2 block flex items-center gap-1">
                      <Palette className="w-3 h-3" /> لون البانر
                    </label>
                    <div className="flex flex-wrap gap-2 items-center">
                      {COLORS.map(c => (
                        <button key={c} onClick={() => setForm(p => ({ ...p, heroColor: c }))}
                          style={{ backgroundColor: c }}
                          className={`w-7 h-7 rounded-lg border-2 transition-all ${form.heroColor === c ? "border-black dark:border-white scale-110" : "border-transparent"}`}
                          data-testid={`color-${c}`} />
                      ))}
                      <input type="color" value={form.heroColor}
                        onChange={e => setForm(p => ({ ...p, heroColor: e.target.value }))}
                        className="w-7 h-7 rounded-lg cursor-pointer border border-black/10" title="لون مخصص" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-black/40 dark:text-white/40 mb-2 block">الحالة</label>
                    <div className="flex gap-2">
                      {(["active","coming_soon","archived"] as const).map(s => (
                        <button key={s} onClick={() => setForm(p => ({ ...p, status: s }))}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            form.status === s ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white" : "border-black/10 dark:border-white/10 text-black/50 dark:text-white/50"
                          }`}>
                          {STATUS_CONFIG[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* How to use */}
                <div>
                  <label className="text-xs text-black/40 dark:text-white/40 mb-1 block flex items-center gap-1">
                    <FileText className="w-3 h-3" /> شرح طريقة الاستخدام (اختياري)
                  </label>
                  <Textarea value={form.howToUseAr} onChange={e => setForm(p => ({ ...p, howToUseAr: e.target.value }))}
                    placeholder="اشرح للعميل كيف يستخدم النظام خطوة بخطوة..."
                    rows={2} className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white" />
                </div>

                <div>
                  <label className="text-xs text-black/40 dark:text-white/40 mb-1 block flex items-center gap-1">
                    <Video className="w-3 h-3" /> رابط فيديو الشرح (يوتيوب / فيميو)
                  </label>
                  <Input value={form.howToUseVideoUrl} onChange={e => setForm(p => ({ ...p, howToUseVideoUrl: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=..." dir="ltr"
                    className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white" />
                </div>

                {/* Features */}
                <div className="border border-black/[0.06] dark:border-white/[0.06] rounded-xl overflow-hidden">
                  <button onClick={() => setShowFeaturesPanel(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-black/60 dark:text-white/60 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    data-testid="btn-toggle-features">
                    <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5" /> مميزات النظام ({form.featuresAr.length})</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFeaturesPanel ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {showFeaturesPanel && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="p-4 space-y-3 border-t border-black/[0.06] dark:border-white/[0.06]">
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {form.featuresAr.map((f, i) => (
                              <span key={i} className="flex items-center gap-1 text-xs bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] px-2.5 py-1 rounded-full text-black/70 dark:text-white/70">
                                <CheckCircle2 className="w-3 h-3 text-green-500" /> {f}
                                <button onClick={() => removeFeature(i)} className="hover:text-red-500 transition-colors mr-0.5"><X className="w-3 h-3" /></button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input value={newFeature} onChange={e => setNewFeature(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && addFeature()}
                              placeholder="أضف ميزة (اضغط Enter)" 
                              className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white text-sm"
                              data-testid="input-feature" />
                            <Button size="sm" variant="outline" onClick={addFeature} className="dark:border-white/10 dark:text-white">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Template Files */}
                <div className="border border-black/[0.06] dark:border-white/[0.06] rounded-xl overflow-hidden">
                  <button onClick={() => setShowFilesPanel(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-black/60 dark:text-white/60 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    data-testid="btn-toggle-files">
                    <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> ملفات مرفقة ({form.templateFiles.length})</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilesPanel ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {showFilesPanel && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="p-4 space-y-3 border-t border-black/[0.06] dark:border-white/[0.06]">
                          {form.templateFiles.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs bg-black/[0.03] dark:bg-white/[0.03] rounded-xl px-3 py-2">
                              <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                              <span className="flex-1 font-medium text-black/70 dark:text-white/70">{f.nameAr}</span>
                              <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-black/30 dark:text-white/30 hover:text-blue-500 transition-colors"><ExternalLink className="w-3 h-3" /></a>
                              <button onClick={() => removeFile(i)} className="text-black/30 dark:text-white/30 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                            </div>
                          ))}
                          <div className="grid grid-cols-2 gap-2">
                            <Input value={newFile.nameAr} onChange={e => setNewFile(p => ({ ...p, nameAr: e.target.value }))}
                              placeholder="اسم الملف" className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white text-sm"
                              data-testid="input-file-name" />
                            <Input value={newFile.url} onChange={e => setNewFile(p => ({ ...p, url: e.target.value }))}
                              placeholder="https://..." dir="ltr" className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white text-sm"
                              data-testid="input-file-url" />
                          </div>
                          <Button size="sm" variant="outline" onClick={addFile}
                            disabled={!newFile.nameAr.trim() || !newFile.url.trim()}
                            className="w-full gap-1.5 dark:border-white/10 dark:text-white">
                            <Plus className="w-3.5 h-3.5" /> إضافة ملف
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Preview strip */}
                <div className="rounded-xl overflow-hidden border border-black/[0.07] dark:border-white/[0.07]">
                  <div className="h-12 flex items-end pb-2 px-3 relative" style={{ backgroundColor: form.heroColor }}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "16px 16px" }} />
                    <span className="text-white font-black text-sm drop-shadow-sm relative z-10">{form.nameAr || "اسم النظام"}</span>
                  </div>
                  <div className="px-3 py-2 bg-white dark:bg-gray-900 flex items-center gap-2 text-xs text-black/40 dark:text-white/40">
                    <Eye className="w-3 h-3" />
                    <span>هكذا يظهر الكارد في صفحة /demos</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button onClick={() => editId ? updateMutation.mutate() : createMutation.mutate()}
                    disabled={!form.nameAr.trim() || !form.category || isPending}
                    className="gap-2 bg-black dark:bg-white text-white dark:text-black flex-1"
                    data-testid="btn-save-demo">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {editId ? "تحديث الديمو" : "نشر الديمو"}
                  </Button>
                  <Button variant="outline" onClick={resetForm} className="dark:border-white/10 dark:text-white">
                    إلغاء
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items list */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" />
        </div>
      ) : items.length === 0 && !showForm ? (
        <Card className="border-black/[0.06] dark:border-white/[0.06] shadow-none rounded-2xl dark:bg-gray-900">
          <CardContent className="py-16 text-center">
            <Monitor className="w-14 h-14 mx-auto mb-4 text-black/10 dark:text-white/10" />
            <p className="text-black/40 dark:text-white/40 font-bold text-lg mb-2">لم تضف أي نظام بعد</p>
            <p className="text-black/25 dark:text-white/25 text-sm mb-6">اضغط "إضافة نظام" لإضافة أول ديمو يظهر للعملاء في صفحة /demos</p>
            <Button onClick={() => setShowForm(true)} className="bg-black dark:bg-white text-white dark:text-black gap-2">
              <Plus className="w-4 h-4" /> إضافة أول نظام
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.length > 0 && (
            <p className="text-xs text-black/30 dark:text-white/30 font-medium">{items.length} نظام أضفته</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item, i) => {
              const cat = CATEGORIES.find(c => c.value === item.category);
              const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.active;
              return (
                <motion.div key={item._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white dark:bg-gray-900 border border-black/[0.07] dark:border-white/[0.07] rounded-2xl overflow-hidden"
                  data-testid={`demo-card-${item._id}`}>
                  {/* Color Banner */}
                  <div className="relative h-20 overflow-hidden" style={{ backgroundColor: item.heroColor || "#0f172a" }}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "16px 16px" }} />
                    <div className="absolute bottom-2 right-3">
                      <p className="text-white font-black text-base leading-tight drop-shadow-sm">{item.nameAr}</p>
                      <p className="text-white/60 text-[10px]">{cat?.labelAr || item.category}</p>
                    </div>
                    <div className="absolute top-2 left-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.badge}`}>{st.label}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    {item.descriptionAr && (
                      <p className="text-xs text-black/50 dark:text-white/50 line-clamp-2 mb-3">{item.descriptionAr}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(item.featuresAr || []).slice(0, 3).map((f, j) => (
                        <span key={j} className="text-[10px] bg-black/[0.04] dark:bg-white/[0.04] px-2 py-0.5 rounded-full text-black/50 dark:text-white/50 border border-black/[0.05] dark:border-white/[0.05]">
                          {f}
                        </span>
                      ))}
                      {(item.featuresAr || []).length > 3 && (
                        <span className="text-[10px] text-black/30 dark:text-white/30 px-1">+{(item.featuresAr || []).length - 3}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {item.demoUrl && (
                        <a href={item.demoUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0"
                          data-testid={`btn-preview-${item._id}`}>
                          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs dark:border-white/10 dark:text-white">
                            <Play className="w-3 h-3" /> معاينة
                          </Button>
                        </a>
                      )}
                      <Button size="sm" variant="outline" onClick={() => startEdit(item)}
                        className="h-8 gap-1.5 text-xs flex-1 dark:border-white/10 dark:text-white"
                        data-testid={`btn-edit-${item._id}`}>
                        <Pencil className="w-3 h-3" /> تعديل
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(item._id)}
                        disabled={deleteMutation.isPending}
                        className="h-8 w-8 p-0 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-black/[0.08] dark:border-white/[0.08]"
                        data-testid={`btn-delete-${item._id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
        <Globe className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-blue-700 dark:text-blue-300">ملاحظة</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
            الأنظمة التي تضيفها هنا تظهر مباشرةً في صفحة <strong>/demos</strong> للعملاء. يمكنك تغيير حالتها إلى "مؤرشف" لإخفائها مؤقتاً دون حذفها.
          </p>
        </div>
      </div>
    </div>
  );
}
