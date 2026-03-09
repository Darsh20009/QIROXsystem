import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Pencil, Trash2, Tag, Copy, ToggleLeft, Percent, DollarSign, Home, Package } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { motion } from "framer-motion";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

const emptyForm = {
  code: "", description: "", descriptionAr: "",
  type: "percentage" as "percentage" | "fixed",
  value: "", minOrderAmount: "0", maxDiscountAmount: "",
  usageLimit: "", isActive: true, isGlobal: false,
  showOnHome: false, appliesTo: "all",
  expiresAt: "", bannerTextAr: "", bannerColor: "#000000",
};

const appliesToLabels: Record<string, string> = {
  all: "الكل", products: "المنتجات", packages: "الباقات", devices: "الأجهزة",
};

export default function AdminDiscountCodes() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [search, setSearch] = useState("");

  const { data: codes, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/discount-codes"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(editingId ? "PATCH" : "POST",
        editingId ? `/api/admin/discount-codes/${editingId}` : "/api/admin/discount-codes",
        data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discount-codes"] });
      setDialogOpen(false);
      setEditingId(null);
      setForm({ ...emptyForm });
      toast({ title: editingId ? "تم تحديث الكود" : "تم إنشاء الكود" });
    },
    onError: (e: any) => toast({ title: e.message || "فشل", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/admin/discount-codes/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discount-codes"] });
      toast({ title: "تم حذف الكود" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/discount-codes/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/discount-codes"] }),
  });

  const openEdit = (code: any) => {
    setEditingId(code.id || code._id);
    setForm({
      code: code.code || "",
      description: code.description || "",
      descriptionAr: code.descriptionAr || "",
      type: code.type || "percentage",
      value: String(code.value || ""),
      minOrderAmount: String(code.minOrderAmount || "0"),
      maxDiscountAmount: String(code.maxDiscountAmount || ""),
      usageLimit: String(code.usageLimit || ""),
      isActive: code.isActive !== false,
      isGlobal: code.isGlobal || false,
      showOnHome: code.showOnHome || false,
      appliesTo: code.appliesTo || "all",
      expiresAt: code.expiresAt ? new Date(code.expiresAt).toISOString().split("T")[0] : "",
      bannerTextAr: code.bannerTextAr || "",
      bannerColor: code.bannerColor || "#000000",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.code || !form.value) {
      return toast({ title: "الكود والقيمة مطلوبان", variant: "destructive" });
    }
    saveMutation.mutate({
      code: form.code.toUpperCase(),
      description: form.description,
      descriptionAr: form.descriptionAr,
      type: form.type,
      value: Number(form.value),
      minOrderAmount: Number(form.minOrderAmount || 0),
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      isActive: form.isActive,
      isGlobal: form.isGlobal,
      showOnHome: form.showOnHome,
      appliesTo: form.appliesTo,
      expiresAt: form.expiresAt ? new Date(form.expiresAt) : undefined,
      bannerTextAr: form.bannerTextAr,
      bannerColor: form.bannerColor,
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: `تم نسخ "${code}"` });
  };

  const filtered = (codes || []).filter((c: any) =>
    !search || c.code?.toLowerCase().includes(search.toLowerCase()) || c.descriptionAr?.includes(search)
  );

  const stats = {
    total: codes?.length || 0,
    active: codes?.filter((c: any) => c.isActive).length || 0,
    global: codes?.filter((c: any) => c.showOnHome).length || 0,
  };

  return (
    <div dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-black dark:text-white">كودات الخصم</h1>
          <p className="text-sm text-black/40 dark:text-white/40 mt-1">إنشاء وإدارة كودات الخصم للعملاء</p>
        </div>
        <Button onClick={() => { setEditingId(null); setForm({ ...emptyForm }); setDialogOpen(true); }}
          className="bg-black dark:bg-white text-white dark:text-black rounded-xl h-9 text-sm gap-2" data-testid="button-add-code">
          <Plus className="w-4 h-4" />كود جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "إجمالي الكودات", value: stats.total, icon: Tag },
          { label: "كودات نشطة", value: stats.active, icon: ToggleLeft },
          { label: "ظاهرة في الرئيسية", value: stats.global, icon: Home },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4">
            <div className="text-2xl font-black text-black dark:text-white">{s.value}</div>
            <div className="text-xs text-black/40 dark:text-white/40 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالكود أو الوصف..." className="max-w-xs" data-testid="input-search-codes" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-black/20" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-black/30 dark:text-white/30">
          <Tag className="w-10 h-10 mx-auto mb-3 opacity-70" />
          <p>لا توجد كودات — أضف أول كود خصم</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((code: any) => (
            <motion.div key={code.id || code._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <button onClick={() => copyCode(code.code)}
                    className="font-black text-base text-black dark:text-white tracking-widest flex items-center gap-1.5 hover:opacity-70 transition-opacity" data-testid={`button-copy-${code.id || code._id}`}>
                    {code.code}
                    <Copy className="w-3.5 h-3.5 text-black/30 dark:text-white/30" />
                  </button>
                  <Badge className={`text-xs border ${code.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                    {code.isActive ? "نشط" : "متوقف"}
                  </Badge>
                  {code.showOnHome && (
                    <Badge className="text-xs border bg-blue-50 text-blue-700 border-blue-200">
                      <Home className="w-3 h-3 ml-1" />رئيسية
                    </Badge>
                  )}
                  <Badge className="text-xs border bg-black/[0.04] text-black/60 border-black/[0.08] dark:bg-white/[0.04] dark:text-white/60 dark:border-white/[0.08]">
                    {appliesToLabels[code.appliesTo] || code.appliesTo}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-black/50 dark:text-white/50 flex-wrap">
                  <span className="flex items-center gap-1 font-semibold text-black dark:text-white">
                    {code.type === "percentage" ? <Percent className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                    {code.value}{code.type === "percentage" ? "%" : ` ${code.currency || "SAR"}`} خصم
                  </span>
                  {code.descriptionAr && <span>{code.descriptionAr}</span>}
                  {code.usageLimit && <span>الاستخدام: {code.usageCount || 0}/{code.usageLimit}</span>}
                  {code.expiresAt && <span>ينتهي: {new Date(code.expiresAt).toLocaleDateString('ar-SA')}</span>}
                  {code.minOrderAmount > 0 && <span>الحد الأدنى: {code.minOrderAmount} SAR</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch checked={code.isActive} onCheckedChange={v => toggleMutation.mutate({ id: code.id || code._id, isActive: v })} data-testid={`switch-code-${code.id || code._id}`} />
                <Button size="sm" variant="outline" onClick={() => openEdit(code)} className="rounded-xl h-8 w-8 p-0" data-testid={`button-edit-code-${code.id || code._id}`}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(code.id || code._id)} className="rounded-xl h-8 w-8 p-0 text-red-500 border-red-200" data-testid={`button-delete-code-${code.id || code._id}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">{editingId ? "تعديل الكود" : "كود خصم جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">الكود *</label>
              <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="SUMMER2025" className="font-mono tracking-widest text-lg" data-testid="input-code" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">نوع الخصم</label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                    <SelectItem value="fixed">مبلغ ثابت (SAR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">قيمة الخصم *</label>
                <Input type="number" min="0" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  placeholder={form.type === "percentage" ? "20" : "50"} data-testid="input-discount-value" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">الوصف بالعربي</label>
              <Input value={form.descriptionAr} onChange={e => setForm(f => ({ ...f, descriptionAr: e.target.value }))} placeholder="خصم الصيف..." data-testid="input-desc-ar" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">الحد الأدنى للطلب</label>
                <Input type="number" min="0" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} data-testid="input-min-order" />
              </div>
              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">أقصى خصم (SAR)</label>
                <Input type="number" min="0" value={form.maxDiscountAmount} onChange={e => setForm(f => ({ ...f, maxDiscountAmount: e.target.value }))} placeholder="اختياري" data-testid="input-max-discount" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">حد الاستخدام</label>
                <Input type="number" min="0" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} placeholder="غير محدود" data-testid="input-usage-limit" />
              </div>
              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">تاريخ الانتهاء</label>
                <Input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} data-testid="input-expires-at" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">ينطبق على</label>
              <Select value={form.appliesTo} onValueChange={v => setForm(f => ({ ...f, appliesTo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="products">المنتجات والأجهزة</SelectItem>
                  <SelectItem value="packages">الباقات</SelectItem>
                  <SelectItem value="devices">الأجهزة فقط</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border border-black/[0.06] dark:border-white/[0.06] rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-black/60 dark:text-white/60">إعدادات العرض</p>
              <div className="flex items-center justify-between">
                <label className="text-sm text-black/70 dark:text-white/70">إظهار في الصفحة الرئيسية</label>
                <Switch checked={form.showOnHome} onCheckedChange={v => setForm(f => ({ ...f, showOnHome: v }))} data-testid="switch-show-home" />
              </div>
              {form.showOnHome && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">نص البانر</label>
                    <Input value={form.bannerTextAr} onChange={e => setForm(f => ({ ...f, bannerTextAr: e.target.value }))} placeholder="وفّر 20% على جميع الأجهزة!" data-testid="input-banner-text" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">لون البانر</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.bannerColor} onChange={e => setForm(f => ({ ...f, bannerColor: e.target.value }))} className="h-9 w-16 rounded-lg border border-black/[0.1] cursor-pointer" />
                      <Input value={form.bannerColor} onChange={e => setForm(f => ({ ...f, bannerColor: e.target.value }))} className="font-mono" />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-black/70 dark:text-white/70">الكود نشط</label>
              <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} data-testid="switch-is-active" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 rounded-xl">إلغاء</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending} className="flex-1 bg-black dark:bg-white text-white dark:text-black rounded-xl" data-testid="button-save-code">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "حفظ" : "إنشاء"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
