import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, Package, Tag, Sparkles, Globe, Lock } from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

const CATEGORIES = [
  { value: "feature",     label: "ميزة إضافية",    color: "bg-blue-100 text-blue-700" },
  { value: "hosting",     label: "استضافة / قاعدة بيانات", color: "bg-green-100 text-green-700" },
  { value: "design",      label: "تصميم",            color: "bg-pink-100 text-pink-700" },
  { value: "support",     label: "دعم فني",          color: "bg-amber-100 text-amber-700" },
  { value: "integration", label: "تكامل خارجي",      color: "bg-purple-100 text-purple-700" },
  { value: "app",         label: "تطبيق جوال",       color: "bg-indigo-100 text-indigo-700" },
  { value: "marketing",   label: "تسويق وSEO",       color: "bg-orange-100 text-orange-700" },
];

const ALL_SEGMENTS = [
  { value: "restaurant",    label: "🍽️ مطاعم ومقاهي" },
  { value: "food",          label: "🥗 مطاعم وكافيهات" },
  { value: "ecommerce",     label: "🛒 متاجر إلكترونية" },
  { value: "store",         label: "🏪 متاجر" },
  { value: "commerce",      label: "🛍️ تجارة" },
  { value: "education",     label: "🎓 تعليم وأكاديميات" },
  { value: "healthcare",    label: "🏥 صحة وعيادات" },
  { value: "fitness",       label: "💪 لياقة وجيم" },
  { value: "beauty",        label: "💄 تجميل وصالونات" },
  { value: "realestate",    label: "🏗️ عقارات" },
  { value: "corporate",     label: "🏢 شركات ومؤسسات" },
  { value: "institutional", label: "🏛️ مؤسسات وجمعيات" },
  { value: "tech",          label: "💻 تقنية وبرمجة" },
  { value: "personal",      label: "👤 خدمات شخصية" },
];

const ALL_PLANS = [
  { value: "lite",     label: "🌟 لايت" },
  { value: "pro",      label: "⚡ برو" },
  { value: "infinite", label: "∞ إنفينتي" },
  { value: "custom",   label: "🏢 مخصصة" },
];

const catLabel: Record<string, string> = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]));
const catColor: Record<string, string> = Object.fromEntries(CATEGORIES.map(c => [c.value, c.color]));

const empty = {
  name: "", nameAr: "", description: "", descriptionAr: "",
  icon: "Plus", price: 0, currency: "SAR", category: "feature",
  sortOrder: 0, isActive: true, segments: [] as string[], plans: [] as string[],
};

function MultiToggle({ label, options, selected, onChange }: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v]);
  };
  return (
    <div>
      <Label className="text-xs font-semibold mb-1.5 block">
        {label}
        <span className="text-[10px] text-black/35 font-normal mr-1">
          {selected.length === 0 ? "(فارغ = لجميع)" : `(${selected.length} محدد)`}
        </span>
      </Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
              selected.includes(opt.value)
                ? "bg-black text-white border-black"
                : "bg-white border-black/10 text-black/50 hover:border-black/25 hover:text-black/70"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminExtraAddons() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [filterCat, setFilterCat] = useState<string>("all");

  const { data: addons = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/extra-addons"] });

  const save = useMutation({
    mutationFn: (d: any) => editId
      ? apiRequest("PUT", `/api/admin/extra-addons/${editId}`, d)
      : apiRequest("POST", "/api/admin/extra-addons", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/extra-addons"] }); setOpen(false); toast({ title: "✅ تم الحفظ" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/extra-addons/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/extra-addons"] }),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: any) => apiRequest("PUT", `/api/admin/extra-addons/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/extra-addons"] }),
  });

  const seedDefaults = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/extra-addons/seed-defaults", {}),
    onSuccess: async (res) => {
      const data = await res.json();
      qc.invalidateQueries({ queryKey: ["/api/admin/extra-addons"] });
      toast({ title: `تم إضافة ${data.added} إضافة افتراضية${data.skipped > 0 ? ` (${data.skipped} موجودة مسبقاً)` : ""}` });
    },
    onError: () => toast({ title: "خطأ في الزرع", variant: "destructive" }),
  });

  function openNew() { setEditId(null); setForm({ ...empty }); setOpen(true); }
  function openEdit(a: any) {
    setEditId(a.id);
    setForm({
      name: a.name || "", nameAr: a.nameAr || "",
      description: a.description || "", descriptionAr: a.descriptionAr || "",
      icon: a.icon || "Plus", price: a.price || 0, currency: a.currency || "SAR",
      category: a.category || "feature", sortOrder: a.sortOrder || 0,
      isActive: a.isActive, segments: a.segments || [], plans: a.plans || [],
    });
    setOpen(true);
  }

  const displayed = filterCat === "all" ? addons : addons.filter((a: any) => a.category === filterCat);
  const totalActive = addons.filter((a: any) => a.isActive).length;

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <PageGraphics variant="dashboard" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Tag className="w-5 h-5 text-blue-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">المميزات الإضافية</h1>
          <p className="text-sm text-black/40">إضافات اختيارية بأسعار منفصلة — يمكن تقييدها بقطاع أو باقة معينة</p>
        </div>
        <div className="flex gap-2 mr-auto">
          <Button variant="outline" onClick={() => seedDefaults.mutate()} disabled={seedDefaults.isPending} className="gap-2 text-sm" data-testid="button-seed-addons">
            <Sparkles className="w-4 h-4" /> {seedDefaults.isPending ? "جاري الإضافة..." : "إضافات افتراضية"}
          </Button>
          <Button onClick={openNew} className="gap-2" data-testid="button-new-addon">
            <Plus className="w-4 h-4" /> إضافة جديدة
          </Button>
        </div>
      </div>

      {/* Stats + filter */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-black/40">
          <Package className="w-4 h-4" />
          <span>{totalActive} إضافة نشطة من {addons.length} إجمالاً</span>
        </div>
        <div className="flex gap-1.5 mr-auto flex-wrap">
          <button onClick={() => setFilterCat("all")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterCat === "all" ? "bg-black text-white" : "bg-black/[0.04] text-black/50 hover:bg-black/[0.07]"}`}>
            الكل ({addons.length})
          </button>
          {CATEGORIES.map(c => {
            const count = addons.filter((a: any) => a.category === c.value).length;
            if (!count) return null;
            return (
              <button key={c.value} onClick={() => setFilterCat(c.value)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterCat === c.value ? "bg-black text-white" : "bg-black/[0.04] text-black/50 hover:bg-black/[0.07]"}`}>
                {c.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-16 text-black/30">جاري التحميل...</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-black/30">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="mb-4">لا توجد إضافات. استخدم "إضافات افتراضية" للبدء بسرعة.</p>
          <Button variant="outline" onClick={() => seedDefaults.mutate()} disabled={seedDefaults.isPending} className="gap-2">
            <Sparkles className="w-4 h-4" /> إضافات افتراضية جاهزة
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((a: any) => (
            <Card key={a.id} data-testid={`card-addon-${a.id}`}
              className={`border transition-all ${a.isActive ? "border-black/[0.06]" : "border-black/[0.04] opacity-70"}`}>
              <CardContent className="p-3.5 flex items-center gap-4">
                <Switch checked={a.isActive} onCheckedChange={v => toggleActive.mutate({ id: a.id, isActive: v })} data-testid={`switch-addon-${a.id}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-bold text-sm">{a.nameAr}</span>
                    {a.name && <span className="text-[11px] text-black/30">{a.name}</span>}
                    <Badge className={`text-[10px] ${catColor[a.category] || "bg-gray-100 text-gray-600"}`}>
                      {catLabel[a.category] || a.category}
                    </Badge>
                  </div>
                  {a.descriptionAr && <p className="text-xs text-black/35 mb-1">{a.descriptionAr}</p>}
                  {/* Restrictions */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(!a.segments?.length && !a.plans?.length) ? (
                      <span className="flex items-center gap-1 text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                        <Globe className="w-2.5 h-2.5" /> لجميع القطاعات والباقات
                      </span>
                    ) : (
                      <>
                        {a.segments?.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            <Lock className="w-2.5 h-2.5" />
                            {a.segments.map((s: string) => ALL_SEGMENTS.find(x => x.value === s)?.label || s).join(" · ")}
                          </span>
                        )}
                        {a.plans?.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                            <Lock className="w-2.5 h-2.5" />
                            {a.plans.map((p: string) => ALL_PLANS.find(x => x.value === p)?.label || p).join(" · ")}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="font-black text-base">{(a.price || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-black/30">{a.currency} شامل ضريبة</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEdit(a)} data-testid={`button-edit-addon-${a.id}`}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500" onClick={() => del.mutate(a.id)} data-testid={`button-delete-addon-${a.id}`}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editId ? "تعديل الإضافة" : "إضافة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الاسم بالعربي *</Label>
                <Input value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))}
                  placeholder="نشر على App Store" data-testid="input-addon-name-ar" />
              </div>
              <div>
                <Label>الاسم بالإنجليزي</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="App Store Publishing" dir="ltr" data-testid="input-addon-name" />
              </div>
            </div>

            <div>
              <Label>وصف بالعربي</Label>
              <Textarea value={form.descriptionAr} onChange={e => setForm(f => ({ ...f, descriptionAr: e.target.value }))}
                className="h-16 resize-none" placeholder="وصف مختصر يظهر للعميل عند الاختيار" data-testid="input-addon-desc-ar" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>السعر (ر.س) *</Label>
                <Input type="number" value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                  min={0} step={50} data-testid="input-addon-price" />
              </div>
              <div>
                <Label>الفئة</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger data-testid="select-addon-cat"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الترتيب</Label>
                <Input type="number" value={form.sortOrder}
                  onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                  data-testid="input-addon-order" />
              </div>
            </div>

            {/* Segment restriction */}
            <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/40 space-y-3">
              <p className="text-xs font-black text-blue-700 uppercase tracking-widest">تقييد الظهور</p>
              <MultiToggle
                label="القطاعات المسموح بها"
                options={ALL_SEGMENTS}
                selected={form.segments}
                onChange={v => setForm(f => ({ ...f, segments: v }))}
              />
              <MultiToggle
                label="الباقات المسموح بها"
                options={ALL_PLANS}
                selected={form.plans}
                onChange={v => setForm(f => ({ ...f, plans: v }))}
              />
              <p className="text-[10px] text-blue-600/60">
                إذا تركت القطاعات أو الباقات فارغة، ستظهر الإضافة للجميع بغض النظر عن القطاع أو الباقة المختارة.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button
              onClick={() => save.mutate(form)}
              disabled={save.isPending || !form.nameAr || form.price < 0}
              data-testid="button-save-addon"
            >
              {save.isPending ? "جاري الحفظ..." : editId ? "تحديث" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
