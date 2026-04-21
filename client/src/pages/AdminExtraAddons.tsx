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
import { Plus, Trash2, Pencil, Package, Tag, Sparkles, Globe, Lock, Image as ImageIcon, RefreshCw, TrendingUp, Crown, UserPlus } from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useI18n } from "@/lib/i18n";
import { ImageUpload } from "@/components/ImageUpload";
import SARIcon from "@/components/SARIcon";

function getCategories(L: boolean) { return [
  { value: "feature",     label: L ? "ميزة إضافية" : "Extra Feature",    color: "bg-blue-100 text-blue-700" },
  { value: "hosting",     label: L ? "استضافة / قاعدة بيانات" : "Hosting / Database", color: "bg-green-100 text-green-700" },
  { value: "design",      label: L ? "تصميم" : "Design",            color: "bg-pink-100 text-pink-700" },
  { value: "support",     label: L ? "دعم فني" : "Tech Support",          color: "bg-amber-100 text-amber-700" },
  { value: "integration", label: L ? "تكامل خارجي" : "External Integration",      color: "bg-purple-100 text-purple-700" },
  { value: "app",         label: L ? "تطبيق جوال" : "Mobile App",       color: "bg-indigo-100 text-indigo-700" },
  { value: "marketing",   label: L ? "تسويق وSEO" : "Marketing & SEO",       color: "bg-orange-100 text-orange-700" },
]; }

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

const empty = {
  name: "", nameAr: "", description: "", descriptionAr: "",
  icon: "Plus", price: 0, cost: 0, currency: "SAR", category: "feature",
  sortOrder: 0, isActive: true, segments: [] as string[], plans: [] as string[],
  imageUrl: "",
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
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const CATEGORIES = getCategories(L);
  const catLabel: Record<string, string> = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]));
  const catColor: Record<string, string> = Object.fromEntries(CATEGORIES.map(c => [c.value, c.color]));
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/extra-addons"] }); setOpen(false); toast({ title: L ? "✅ تم الحفظ" : "✅ Saved" }); },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const del = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/extra-addons/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/extra-addons"] });
      setConfirmDeleteId(null);
      toast({ title: L ? "تم حذف الإضافة بنجاح" : "Add-on deleted successfully" });
    },
    onError: (e: any) => {
      setConfirmDeleteId(null);
      toast({ title: L ? "فشل حذف الإضافة" : "Failed to delete add-on", description: e.message, variant: "destructive" });
    },
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
      toast({ title: L ? `تم إضافة ${data.added} إضافة افتراضية${data.skipped > 0 ? ` (${data.skipped} موجودة مسبقاً)` : ""}` : `Added ${data.added} default add-ons${data.skipped > 0 ? ` (${data.skipped} already existed)` : ""}` });
    },
    onError: () => toast({ title: L ? "خطأ في الزرع" : "Seeding error", variant: "destructive" }),
  });

  const [confirmWipe, setConfirmWipe] = useState(false);
  const wipeAndSeed = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/extra-addons/wipe-and-seed", {}),
    onSuccess: async (res) => {
      const data = await res.json();
      qc.invalidateQueries({ queryKey: ["/api/admin/extra-addons"] });
      setConfirmWipe(false);
      toast({ title: L ? `✅ تم استبدال الكتالوج. ${data.added} منتج جديد` : `✅ Catalog replaced. ${data.added} items` });
    },
    onError: (e: any) => toast({ title: L ? "فشل الاستبدال" : "Wipe failed", description: e.message, variant: "destructive" }),
  });

  const promote = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/extra-addons/${id}/promote`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/extra-addons"] }); toast({ title: L ? "✅ تمت الترقية للكتالوج العام" : "✅ Promoted to standard" }); },
    onError: (e: any) => toast({ title: L ? "فشل الترقية" : "Promote failed", description: e.message, variant: "destructive" }),
  });

  // ── Custom feature for a specific client ──
  const [customOpen, setCustomOpen] = useState(false);
  const [customForm, setCustomForm] = useState({ clientId: "", nameAr: "", descriptionAr: "", price: 0, cost: 0, billingType: "one_time" as "one_time"|"monthly"|"annual" });
  const [clientSearch, setClientSearch] = useState("");
  const { data: clients = [] } = useQuery<any[]>({ queryKey: ["/api/admin/customers"], enabled: customOpen });
  const filteredClients = (clients as any[]).filter((c: any) => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return true;
    return [c.username, c.name, c.email, c.phone].filter(Boolean).some((v: string) => String(v).toLowerCase().includes(q));
  }).slice(0, 50);
  const createCustom = useMutation({
    mutationFn: (d: any) => apiRequest("POST", "/api/admin/extra-addons/custom", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/extra-addons"] });
      setCustomOpen(false);
      setCustomForm({ clientId: "", nameAr: "", descriptionAr: "", price: 0, cost: 0, billingType: "one_time" });
      setClientSearch("");
      toast({ title: L ? "✅ تم إنشاء ميزة مخصصة للعميل" : "✅ Custom feature created" });
    },
    onError: (e: any) => toast({ title: L ? "فشل الإنشاء" : "Create failed", description: e.message, variant: "destructive" }),
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
      imageUrl: a.imageUrl || "",
    });
    setOpen(true);
  }

  const displayed = filterCat === "all" ? addons : addons.filter((a: any) => a.category === filterCat);
  const totalActive = addons.filter((a: any) => a.isActive).length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto relative overflow-hidden" dir={dir}>
      <PageGraphics variant="dashboard" />

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
          <Tag className="w-5 h-5 text-blue-700" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">{L ? "المميزات الإضافية" : "Extra Add-ons"}</h1>
          <p className="text-xs sm:text-sm text-black/40">{L ? "إضافات اختيارية بأسعار منفصلة — يمكن تقييدها بقطاع أو باقة معينة" : "Optional add-ons with separate pricing — can be restricted by segment or plan"}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <Button
            variant="outline"
            onClick={() => setConfirmWipe(true)}
            disabled={wipeAndSeed.isPending}
            className="gap-1.5 text-xs sm:text-sm flex-1 sm:flex-none border-black text-black hover:bg-black hover:text-white"
            data-testid="button-wipe-and-seed"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {wipeAndSeed.isPending ? (L ? "..." : "...") : (L ? "كتالوج QIROX الجديد" : "QIROX Catalog")}
          </Button>
          <Button
            variant="outline"
            onClick={() => setCustomOpen(true)}
            className="gap-1.5 text-xs sm:text-sm flex-1 sm:flex-none border-black/30 text-black hover:bg-black hover:text-white"
            data-testid="button-new-custom-addon"
          >
            <UserPlus className="w-3.5 h-3.5" /> {L ? "ميزة مخصصة لعميل" : "Custom for Client"}
          </Button>
          <Button onClick={openNew} className="gap-1.5 text-xs sm:text-sm flex-1 sm:flex-none bg-black text-white hover:bg-black/90" data-testid="button-new-addon">
            <Plus className="w-3.5 h-3.5" /> {L ? "إضافة جديدة" : "New Add-on"}
          </Button>
        </div>
      </div>

      {/* Custom feature dialog */}
      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="max-w-lg" dir={dir}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-black">
              <UserPlus className="w-4 h-4" /> {L ? "ميزة مخصصة لعميل محدد" : "Custom feature for a client"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">{L ? "ابحث عن العميل" : "Search client"}</Label>
              <Input value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder={L ? "اسم، إيميل، أو جوال" : "name, email, phone"} data-testid="input-client-search" />
              <div className="mt-2 max-h-48 overflow-y-auto border border-black/10 rounded-lg divide-y divide-black/5">
                {filteredClients.length === 0 && (
                  <div className="text-xs text-black/40 p-3 text-center">{L ? "لا يوجد عملاء" : "No clients"}</div>
                )}
                {filteredClients.map((c: any) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCustomForm(f => ({ ...f, clientId: c.id }))}
                    className={`w-full text-right p-2 text-xs hover:bg-black/5 transition ${customForm.clientId === c.id ? "bg-black text-white hover:bg-black" : ""}`}
                    data-testid={`button-pick-client-${c.id}`}
                  >
                    <div className="font-bold">{c.name || c.username}</div>
                    <div className={`text-[10px] ${customForm.clientId === c.id ? "text-white/60" : "text-black/40"}`}>
                      {c.email || c.phone || c.username}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">{L ? "اسم الميزة" : "Feature name"} *</Label>
              <Input value={customForm.nameAr} onChange={e => setCustomForm(f => ({ ...f, nameAr: e.target.value }))} data-testid="input-custom-name" />
            </div>

            <div>
              <Label className="text-xs">{L ? "الوصف" : "Description"}</Label>
              <Textarea value={customForm.descriptionAr} onChange={e => setCustomForm(f => ({ ...f, descriptionAr: e.target.value }))} className="h-16 resize-none" data-testid="input-custom-desc" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs flex items-center gap-1">{L ? "السعر" : "Price"} <SARIcon size={9} className="opacity-60" /></Label>
                <Input type="number" value={customForm.price} onChange={e => setCustomForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} min={0} step={10} data-testid="input-custom-price" />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1">{L ? "التكلفة" : "Cost"} <SARIcon size={9} className="opacity-60" /></Label>
                <Input type="number" value={customForm.cost} onChange={e => setCustomForm(f => ({ ...f, cost: parseFloat(e.target.value) || 0 }))} min={0} step={10} data-testid="input-custom-cost" />
              </div>
              <div>
                <Label className="text-xs">{L ? "الفوترة" : "Billing"}</Label>
                <Select value={customForm.billingType} onValueChange={(v: any) => setCustomForm(f => ({ ...f, billingType: v }))}>
                  <SelectTrigger data-testid="select-custom-billing"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">{L ? "مرة واحدة" : "One-time"}</SelectItem>
                    <SelectItem value="monthly">{L ? "شهري" : "Monthly"}</SelectItem>
                    <SelectItem value="annual">{L ? "سنوي" : "Annual"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {customForm.price > 0 && customForm.cost > 0 && (
              <div className="text-xs bg-black/[0.04] border border-black/10 rounded-lg p-2 text-center">
                {L ? "ربح متوقع:" : "Expected profit:"}{" "}
                <span className="font-black">{(customForm.price - customForm.cost).toLocaleString()} {L ? "ر.س" : "SAR"}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCustomOpen(false)}>{L ? "إلغاء" : "Cancel"}</Button>
            <Button
              onClick={() => createCustom.mutate(customForm)}
              disabled={!customForm.clientId || !customForm.nameAr || !customForm.price || createCustom.isPending}
              className="bg-black text-white hover:bg-black/90"
              data-testid="button-save-custom"
            >
              {createCustom.isPending ? (L ? "جاري الحفظ..." : "Saving...") : (L ? "حفظ الميزة المخصصة" : "Save custom feature")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Wipe confirmation */}
      <Dialog open={confirmWipe} onOpenChange={setConfirmWipe}>
        <DialogContent className="max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-black">{L ? "استبدال الكتالوج بالقائمة الرسمية الجديدة؟" : "Replace catalog with new official list?"}</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-black/60 space-y-2">
            <p>{L ? "سيتم حذف كل المنتجات القياسية الحالية واستبدالها بالكتالوج الرسمي الجديد لـ QIROX (٩ منتجات)." : "All current standard add-ons will be deleted and replaced with the new official QIROX catalog (9 items)."}</p>
            <p className="text-black/40 text-xs">{L ? "الميزات المخصصة للعملاء لن تتأثر." : "Custom client features will not be affected."}</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmWipe(false)}>{L ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => wipeAndSeed.mutate()} disabled={wipeAndSeed.isPending} className="bg-black text-white hover:bg-black/90" data-testid="button-confirm-wipe">
              {wipeAndSeed.isPending ? (L ? "جاري الاستبدال..." : "Replacing...") : (L ? "استبدال الآن" : "Replace now")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats + filter */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-black/40">
          <Package className="w-4 h-4" />
          <span>{totalActive} {L ? "إضافة نشطة من" : "active of"} {addons.length} {L ? "إجمالاً" : "total"}</span>
        </div>
        <div className="flex gap-1.5 mr-auto flex-wrap">
          <button onClick={() => setFilterCat("all")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterCat === "all" ? "bg-black text-white" : "bg-black/[0.04] text-black/50 hover:bg-black/[0.07]"}`}>
            {L ? "الكل" : "All"} ({addons.length})
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
        <div className="text-center py-16 text-black/30">{L ? "جاري التحميل..." : "Loading..."}</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-black/30">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="mb-4">{L ? 'لا توجد إضافات. استخدم "إضافات افتراضية" للبدء بسرعة.' : 'No add-ons found. Use "Default Add-ons" to get started quickly.'}</p>
          <Button variant="outline" onClick={() => seedDefaults.mutate()} disabled={seedDefaults.isPending} className="gap-2">
            <Sparkles className="w-4 h-4" /> {L ? "إضافات افتراضية جاهزة" : "Ready Default Add-ons"}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((a: any) => (
            <Card key={a.id} data-testid={`card-addon-${a.id}`}
              className={`border transition-all ${a.isActive ? "border-black/[0.06]" : "border-black/[0.04] opacity-70"}`}>
              <CardContent className="p-3 sm:p-3.5">
                {/* Top row: switch + image + name + price + actions */}
                <div className="flex items-start gap-2.5 sm:gap-4">
                  <Switch checked={a.isActive} onCheckedChange={v => toggleActive.mutate({ id: a.id, isActive: v })} data-testid={`switch-addon-${a.id}`} className="mt-0.5 shrink-0" />

                  {/* Addon thumbnail */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-black/[0.06] overflow-hidden bg-black/[0.03] flex items-center justify-center shrink-0">
                    {a.imageUrl ? (
                      <img src={a.imageUrl} alt={a.nameAr} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-black/20" />
                    )}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <span className="font-bold text-sm">{a.nameAr}</span>
                          <Badge className={`text-[10px] ${catColor[a.category] || "bg-gray-100 text-gray-600"}`}>
                            {catLabel[a.category] || a.category}
                          </Badge>
                          {a.isCustom && (
                            <Badge className="text-[10px] bg-black text-white gap-1">
                              <UserPlus className="w-2.5 h-2.5" /> {L ? "مخصص لعميل" : "Custom"}
                            </Badge>
                          )}
                          {a.promotedToStandardAt && (
                            <Badge className="text-[10px] bg-white text-black border border-black gap-1">
                              <Crown className="w-2.5 h-2.5" /> {L ? "مُرقّى" : "Promoted"}
                            </Badge>
                          )}
                        </div>
                        {a.name && <span className="text-[11px] text-black/30 block">{a.name}</span>}
                      </div>
                      {/* Price + profit + actions on same row */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className="font-black text-sm sm:text-base leading-tight" data-testid={`text-price-${a.id}`}>{(a.price || 0).toLocaleString()}</p>
                          <p className="text-[9px] sm:text-[10px] text-black/30">{a.currency}</p>
                          {typeof a.cost === "number" && a.cost > 0 && (
                            <p className="text-[10px] text-black/50 mt-0.5 flex items-center gap-0.5 justify-end" data-testid={`text-profit-${a.id}`} title={L ? `التكلفة: ${a.cost}` : `Cost: ${a.cost}`}>
                              <TrendingUp className="w-2.5 h-2.5" />
                              <span className="font-bold">{((a.price || 0) - (a.cost || 0)).toLocaleString()}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex gap-0.5">
                          {a.isCustom && (
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-black" onClick={() => promote.mutate(a.id)} title={L ? "ترقية للكتالوج العام" : "Promote to standard"} data-testid={`button-promote-${a.id}`}>
                              <Crown className="w-3 h-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(a)} data-testid={`button-edit-addon-${a.id}`}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => setConfirmDeleteId(a.id)} data-testid={`button-delete-addon-${a.id}`}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {a.descriptionAr && <p className="text-xs text-black/35 mt-0.5 mb-1">{a.descriptionAr}</p>}

                    {/* Restrictions */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      {(!a.segments?.length && !a.plans?.length) ? (
                        <span className="flex items-center gap-1 text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                          <Globe className="w-2.5 h-2.5" /> {L ? "لجميع القطاعات والباقات" : "All segments & plans"}
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full" dir={dir}>
          <DialogHeader>
            <DialogTitle>{editId ? (L ? "تعديل الإضافة" : "Edit Add-on") : (L ? "إضافة جديدة" : "New Add-on")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>{L ? "الاسم بالعربي *" : "Arabic Name *"}</Label>
                <Input value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))}
                  placeholder="نشر على App Store" data-testid="input-addon-name-ar" />
              </div>
              <div>
                <Label>{L ? "الاسم بالإنجليزي" : "English Name"}</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="App Store Publishing" dir="ltr" data-testid="input-addon-name" />
              </div>
            </div>

            <div>
              <Label>{L ? "وصف بالعربي" : "Arabic Description"}</Label>
              <Textarea value={form.descriptionAr} onChange={e => setForm(f => ({ ...f, descriptionAr: e.target.value }))}
                className="h-16 resize-none" placeholder={L ? "وصف مختصر يظهر للعميل عند الاختيار" : "Brief description shown to client when selecting"} data-testid="input-addon-desc-ar" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1">{L ? "سعر البيع" : "Sale Price"} (<SARIcon size={10} className="opacity-60" />) *</Label>
                <Input type="number" value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                  min={0} step={10} data-testid="input-addon-price" />
              </div>
              <div>
                <Label className="flex items-center gap-1 text-black">
                  {L ? "التكلفة (داخلي)" : "Cost (internal)"} (<SARIcon size={10} className="opacity-60" />)
                  {form.price > 0 && form.cost > 0 && (
                    <span className="text-[10px] text-black/60 font-bold mr-auto">
                      {L ? "ربح:" : "Profit:"} {(form.price - form.cost).toLocaleString()}
                    </span>
                  )}
                </Label>
                <Input type="number" value={form.cost}
                  onChange={e => setForm(f => ({ ...f, cost: parseFloat(e.target.value) || 0 }))}
                  min={0} step={10} data-testid="input-addon-cost" placeholder={L ? "تكلفتنا الداخلية" : "our internal cost"} />
              </div>
              <div className="col-span-2">
                <Label>{L ? "الفئة" : "Category"}</Label>
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
                <Label>{L ? "الترتيب" : "Sort Order"}</Label>
                <Input type="number" value={form.sortOrder}
                  onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                  data-testid="input-addon-order" />
              </div>
            </div>

            {/* Image Upload */}
            <div className="border border-black/[0.07] rounded-xl p-4 bg-black/[0.01] space-y-2">
              <p className="text-xs font-black text-black/50 uppercase tracking-widest flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> {L ? "صورة الإضافة (اختيارية)" : "Add-on Image (optional)"}
              </p>
              <ImageUpload
                label=""
                value={form.imageUrl}
                onChange={url => setForm(f => ({ ...f, imageUrl: url }))}
              />
              <p className="text-[10px] text-black/30">{L ? "تظهر بجانب اسم الإضافة عند اختيارها من صفحة الطلب" : "Shown next to the add-on name when selected from the order page"}</p>
            </div>

            {/* Segment restriction */}
            <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/40 space-y-3">
              <p className="text-xs font-black text-blue-700 uppercase tracking-widest">{L ? "تقييد الظهور" : "Visibility Restrictions"}</p>
              <MultiToggle
                label={L ? "القطاعات المسموح بها" : "Allowed Segments"}
                options={ALL_SEGMENTS}
                selected={form.segments}
                onChange={v => setForm(f => ({ ...f, segments: v }))}
              />
              <MultiToggle
                label={L ? "الباقات المسموح بها" : "Allowed Plans"}
                options={ALL_PLANS}
                selected={form.plans}
                onChange={v => setForm(f => ({ ...f, plans: v }))}
              />
              <p className="text-[10px] text-blue-600/60">
                {L ? "إذا تركت القطاعات أو الباقات فارغة، ستظهر الإضافة للجميع بغض النظر عن القطاع أو الباقة المختارة." : "If segments or plans are left empty, the add-on will be visible to all regardless of segment or plan."}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>{L ? "إلغاء" : "Cancel"}</Button>
            <Button
              onClick={() => save.mutate(form)}
              disabled={save.isPending || !form.nameAr || form.price < 0}
              data-testid="button-save-addon"
            >
              {save.isPending ? (L ? "جاري الحفظ..." : "Saving...") : editId ? (L ? "تحديث" : "Update") : (L ? "إضافة" : "Add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDeleteId} onOpenChange={(v) => { if (!v) setConfirmDeleteId(null); }}>
        <DialogContent className="max-w-sm" dir={dir}>
          <DialogHeader>
            <DialogTitle>{L ? "تأكيد الحذف" : "Confirm Deletion"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-black/50 dark:text-white/50">
            {L ? "هل أنت متأكد من حذف هذه الإضافة؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this add-on? This action cannot be undone."}
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)} data-testid="button-cancel-delete">{L ? "إلغاء" : "Cancel"}</Button>
            <Button
              variant="destructive"
              onClick={() => confirmDeleteId && del.mutate(confirmDeleteId)}
              disabled={del.isPending}
              data-testid="button-confirm-delete"
            >
              {del.isPending ? (L ? "جاري الحذف..." : "Deleting...") : (L ? "حذف" : "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
