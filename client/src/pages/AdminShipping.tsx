import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import {
  Truck, Plus, Pencil, Trash2, Loader2, Globe, MapPin,
  Clock, ExternalLink, Zap, CheckCircle2, XCircle, Package,
  Sparkles
} from "lucide-react";

interface ShippingCompany {
  id: string;
  name: string;
  nameAr: string;
  logo: string;
  color: string;
  basePrice: number;
  outsideCityPrice: number;
  estimatedDays: string;
  outsideCityDays: string;
  trackingUrlTemplate: string;
  regions: string[];
  notes: string;
  isActive: boolean;
  sortOrder: number;
}

const REGION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  riyadh:        { label: "الرياض",        icon: "🏙️", color: "bg-blue-50 text-blue-700 border-blue-200" },
  saudi:         { label: "السعودية",       icon: "🇸🇦", color: "bg-green-50 text-green-700 border-green-200" },
  gcc:           { label: "دول الخليج",    icon: "🌍", color: "bg-amber-50 text-amber-700 border-amber-200" },
  international: { label: "دولي",          icon: "✈️", color: "bg-purple-50 text-purple-700 border-purple-200" },
};

const emptyForm = {
  name: "", nameAr: "", logo: "🚚", color: "#000000",
  basePrice: "", outsideCityPrice: "", estimatedDays: "2-3 أيام",
  outsideCityDays: "3-5 أيام", trackingUrlTemplate: "",
  regions: ["riyadh", "saudi"], notes: "", isActive: true, sortOrder: "0",
};

function RegionToggle({ selected, onChange }: { selected: string[]; onChange: (r: string[]) => void }) {
  const toggle = (key: string) => {
    onChange(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(REGION_LABELS).map(([key, meta]) => {
        const active = selected.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              active ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black" : "border-black/[0.08] dark:border-white/[0.08] text-black/60 dark:text-white/60 hover:border-black/20 dark:hover:border-white/20"
            }`}
            data-testid={`toggle-region-${key}`}
          >
            <span>{meta.icon}</span> {meta.label}
          </button>
        );
      })}
    </div>
  );
}

export default function AdminShipping() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: companies, isLoading } = useQuery<ShippingCompany[]>({
    queryKey: ["/api/admin/shipping-companies"],
  });

  const seedMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/shipping-companies/seed-defaults").then(r => r.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shipping-companies"] });
      toast({ title: data.message });
    },
    onError: () => toast({ title: "خطأ", variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/shipping-companies", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shipping-companies"] });
      setDialogOpen(false);
      toast({ title: "تم إضافة شركة الشحن" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/admin/shipping-companies/${id}`, data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shipping-companies"] });
      setDialogOpen(false);
      toast({ title: "تم التحديث" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/shipping-companies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shipping-companies"] });
      toast({ title: "تم الحذف" });
    },
  });

  const toggleActive = (c: ShippingCompany) => {
    updateMutation.mutate({ id: c.id, data: { isActive: !c.isActive } });
  };

  const openCreate = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (c: ShippingCompany) => {
    setForm({
      name: c.name, nameAr: c.nameAr, logo: c.logo, color: c.color,
      basePrice: String(c.basePrice), outsideCityPrice: String(c.outsideCityPrice),
      estimatedDays: c.estimatedDays, outsideCityDays: c.outsideCityDays,
      trackingUrlTemplate: c.trackingUrlTemplate || "",
      regions: c.regions || ["riyadh"],
      notes: c.notes || "", isActive: c.isActive,
      sortOrder: String(c.sortOrder || 0),
    });
    setEditingId(c.id);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      ...form,
      basePrice: Number(form.basePrice) || 0,
      outsideCityPrice: Number(form.outsideCityPrice) || 0,
      sortOrder: Number(form.sortOrder) || 0,
    };
    if (editingId) updateMutation.mutate({ id: editingId, data });
    else createMutation.mutate(data);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const active = companies?.filter(c => c.isActive).length || 0;
  const total = companies?.length || 0;

  return (
    <div className="space-y-6 relative overflow-hidden">
      <PageGraphics variant="dashboard" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-black dark:text-white flex items-center gap-3">
            <Truck className="w-7 h-7 text-black/40 dark:text-white/40" />
            شركات الشحن والتوصيل
          </h1>
          <p className="text-sm text-black/40 dark:text-white/40 mt-0.5">إدارة شركاء التوصيل داخل وخارج الرياض</p>
        </div>
        <div className="flex gap-2">
          {total === 0 && (
            <Button variant="outline" className="gap-2 text-sm border-black/10 dark:border-white/10" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} data-testid="button-seed-defaults">
              {seedMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-500" />}
              إضافة الشركات الافتراضية
            </Button>
          )}
          <Button className="premium-btn gap-2" onClick={openCreate} data-testid="button-add-company">
            <Plus className="w-4 h-4" /> إضافة شركة
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "إجمالي الشركات", val: total, icon: Truck, color: "text-black dark:text-white", bg: "bg-black/[0.03] dark:bg-white/[0.05]" },
          { label: "نشطة", val: active, icon: CheckCircle2, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "متوقفة", val: total - active, icon: XCircle, color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" },
          { label: "تغطية دولية", val: companies?.filter(c => c.regions?.includes("international")).length || 0, icon: Globe, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`${s.bg} border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 flex items-center gap-3`}>
              <Icon className={`w-5 h-5 ${s.color}`} />
              <div>
                <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                <p className="text-[11px] text-black/40 dark:text-white/40">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {!isLoading && total === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 border-2 border-dashed border-black/[0.07] dark:border-white/[0.07] rounded-3xl">
          <Truck className="w-14 h-14 mx-auto mb-4 text-black/10 dark:text-white/10" />
          <p className="font-bold text-black/40 dark:text-white/40 mb-1">لا توجد شركات شحن بعد</p>
          <p className="text-sm text-black/25 dark:text-white/25 mb-6">ابدأ بإضافة الشركات الافتراضية أو أضف شركة يدوياً</p>
          <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} className="gap-2">
            {seedMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            إضافة الشركات الافتراضية (6 شركات)
          </Button>
        </motion.div>
      )}

      {/* Company cards */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin w-8 h-8 text-black/20" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies?.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white dark:bg-[#111] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl overflow-hidden transition-all ${!c.isActive ? "opacity-70" : "hover:shadow-md"}`}
              data-testid={`company-card-${c.id}`}
            >
              {/* Header strip */}
              <div className="h-1.5 w-full" style={{ backgroundColor: c.color }} />

              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.04]">
                      {c.logo}
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-black dark:text-white">{c.nameAr}</h3>
                      <p className="text-[10px] text-black/35 dark:text-white/35">{c.name}</p>
                    </div>
                  </div>
                  <Switch
                    checked={c.isActive}
                    onCheckedChange={() => toggleActive(c)}
                    data-testid={`switch-active-${c.id}`}
                  />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-black/[0.02] dark:bg-white/[0.03] rounded-xl p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <MapPin className="w-3 h-3 text-blue-500" />
                      <span className="text-[10px] text-black/40 dark:text-white/40">الرياض</span>
                    </div>
                    <p className="text-base font-black text-black dark:text-white">{c.basePrice} <span className="text-[10px] font-normal text-black/40 dark:text-white/40">ر.س</span></p>
                    <p className="text-[9px] text-black/30 dark:text-white/30 flex items-center justify-center gap-0.5 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />{c.estimatedDays}
                    </p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-2.5 text-center border border-amber-200/60 dark:border-amber-700/30">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Globe className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px] text-amber-700 dark:text-amber-400">خارج الرياض</span>
                    </div>
                    <p className="text-base font-black text-amber-700 dark:text-amber-400">{c.outsideCityPrice} <span className="text-[10px] font-normal text-amber-500">ر.س</span></p>
                    <p className="text-[9px] text-amber-600/60 dark:text-amber-500/60 flex items-center justify-center gap-0.5 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />{c.outsideCityDays}
                    </p>
                  </div>
                </div>

                {/* Regions */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {(c.regions || []).map(r => {
                    const meta = REGION_LABELS[r];
                    if (!meta) return null;
                    return (
                      <span key={r} className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${meta.color}`}>
                        {meta.icon} {meta.label}
                      </span>
                    );
                  })}
                </div>

                {/* Tracking */}
                {c.trackingUrlTemplate && (
                  <div className="flex items-center gap-1.5 text-[10px] text-black/40 dark:text-white/40 mb-3 bg-black/[0.02] dark:bg-white/[0.03] rounded-lg px-2.5 py-1.5">
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">تتبع: {c.trackingUrlTemplate.replace("{code}", "XXXX")}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="flex-1 text-xs h-8 gap-1.5" onClick={() => openEdit(c)} data-testid={`button-edit-${c.id}`}>
                    <Pencil className="w-3 h-3" /> تعديل
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    className="h-8 w-8 text-red-400 hover:text-red-600"
                    onClick={() => { if (confirm("حذف شركة الشحن؟")) deleteMutation.mutate(c.id); }}
                    data-testid={`button-delete-${c.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={v => !v && setDialogOpen(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black text-lg">
              {editingId ? "تعديل شركة الشحن" : "إضافة شركة شحن"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-black/50 dark:text-white/50 mb-1 block">اسم الشركة (عربي) *</label>
                <Input value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} placeholder="سمسا إكسبرس" data-testid="input-company-name-ar" />
              </div>
              <div>
                <label className="text-xs font-semibold text-black/50 dark:text-white/50 mb-1 block">اسم الشركة (English) *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="SMSA Express" data-testid="input-company-name" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-black/50 dark:text-white/50 mb-1 block">الشعار (إيموجي)</label>
                <Input value={form.logo} onChange={e => setForm(f => ({ ...f, logo: e.target.value }))} placeholder="🚚" className="text-center text-xl" data-testid="input-company-logo" />
              </div>
              <div>
                <label className="text-xs font-semibold text-black/50 dark:text-white/50 mb-1 block">لون الشركة</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-10 h-9 rounded-lg border border-black/[0.08] cursor-pointer" data-testid="input-company-color" />
                  <Input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="flex-1 text-xs font-mono" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-black/50 dark:text-white/50 mb-1 block">ترتيب العرض</label>
                <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} placeholder="0" data-testid="input-company-order" />
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl p-4 border border-black/[0.06] dark:border-white/[0.06]">
              <p className="text-xs font-bold text-black/50 dark:text-white/50 mb-3 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> أسعار الشحن
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1 block">
                    <MapPin className="w-3 h-3" /> داخل الرياض (ر.س)
                  </label>
                  <Input type="number" value={form.basePrice} onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))} placeholder="25" data-testid="input-base-price" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1 block">
                    <Globe className="w-3 h-3" /> خارج الرياض (ر.س)
                  </label>
                  <Input type="number" value={form.outsideCityPrice} onChange={e => setForm(f => ({ ...f, outsideCityPrice: e.target.value }))} placeholder="40" data-testid="input-outside-price" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-black/40 dark:text-white/40 mb-1 flex items-center gap-1 block">
                    <Clock className="w-3 h-3" /> مدة داخل الرياض
                  </label>
                  <Input value={form.estimatedDays} onChange={e => setForm(f => ({ ...f, estimatedDays: e.target.value }))} placeholder="2-3 أيام" data-testid="input-estimated-days" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-black/40 dark:text-white/40 mb-1 flex items-center gap-1 block">
                    <Clock className="w-3 h-3" /> مدة خارج الرياض
                  </label>
                  <Input value={form.outsideCityDays} onChange={e => setForm(f => ({ ...f, outsideCityDays: e.target.value }))} placeholder="3-5 أيام" data-testid="input-outside-days" />
                </div>
              </div>
            </div>

            {/* Regions */}
            <div>
              <label className="text-xs font-semibold text-black/50 dark:text-white/50 mb-2 block">مناطق التغطية</label>
              <RegionToggle selected={form.regions} onChange={regions => setForm(f => ({ ...f, regions }))} />
            </div>

            {/* Tracking */}
            <div>
              <label className="text-xs font-semibold text-black/50 dark:text-white/50 mb-1 block flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> رابط التتبع (استخدم {"{code}"} لرقم الشحنة)
              </label>
              <Input value={form.trackingUrlTemplate} onChange={e => setForm(f => ({ ...f, trackingUrlTemplate: e.target.value }))} placeholder="https://track.smsa.com/{code}" className="font-mono text-xs" data-testid="input-tracking-url" />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-black/50 dark:text-white/50 mb-1 block">ملاحظات</label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="resize-none text-sm" placeholder="أي ملاحظات إضافية..." data-testid="input-company-notes" />
            </div>

            {/* Active */}
            <div className="flex items-center justify-between p-3 bg-black/[0.02] dark:bg-white/[0.03] rounded-xl border border-black/[0.06] dark:border-white/[0.06]">
              <div>
                <p className="text-xs font-semibold text-black/60 dark:text-white/60">تفعيل الشركة</p>
                <p className="text-[10px] text-black/30 dark:text-white/30">تظهر للعملاء عند الطلب</p>
              </div>
              <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} data-testid="switch-company-active" />
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 premium-btn gap-2"
                onClick={handleSubmit}
                disabled={isPending || !form.nameAr || !form.name}
                data-testid="button-submit-company"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {editingId ? "حفظ التعديلات" : "إضافة الشركة"}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
