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
import { Plus, Trash2, Pencil, Package, Tag, Sparkles } from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

const CATEGORIES = [
  { value: "feature", label: "ميزة إضافية" },
  { value: "hosting", label: "استضافة" },
  { value: "design", label: "تصميم" },
  { value: "support", label: "دعم" },
  { value: "integration", label: "تكامل" },
  { value: "app", label: "تطبيق جوال" },
  { value: "marketing", label: "تسويق" },
];

const catLabel: Record<string, string> = {
  feature: "ميزة", hosting: "استضافة", design: "تصميم", support: "دعم", integration: "تكامل", app: "تطبيق", marketing: "تسويق",
};

const catColor: Record<string, string> = {
  feature: "bg-blue-100 text-blue-700", hosting: "bg-green-100 text-green-700", design: "bg-pink-100 text-pink-700",
  support: "bg-amber-100 text-amber-700", integration: "bg-purple-100 text-purple-700", app: "bg-indigo-100 text-indigo-700",
  marketing: "bg-orange-100 text-orange-700",
};

const empty = { name: "", nameAr: "", description: "", descriptionAr: "", icon: "Plus", price: 0, currency: "SAR", category: "feature", sortOrder: 0, isActive: true };

export default function AdminExtraAddons() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState({ ...empty });

  const { data: addons = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/extra-addons"] });

  const save = useMutation({
    mutationFn: (d: any) => editId
      ? apiRequest("PUT", `/api/admin/extra-addons/${editId}`, d)
      : apiRequest("POST", "/api/admin/extra-addons", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/extra-addons"] }); setOpen(false); toast({ title: "تم الحفظ" }); },
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
    setForm({ name: a.name||"", nameAr: a.nameAr||"", description: a.description||"", descriptionAr: a.descriptionAr||"", icon: a.icon||"Plus", price: a.price||0, currency: a.currency||"SAR", category: a.category||"feature", sortOrder: a.sortOrder||0, isActive: a.isActive });
    setOpen(true);
  }

  const totalActive = addons.filter((a: any) => a.isActive).length;

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Tag className="w-5 h-5 text-blue-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">المميزات الإضافية</h1>
          <p className="text-sm text-gray-500">إضافات اختيارية بأسعار منفصلة — تظهر للعميل في سلة الطلبات</p>
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

      <div className="flex items-center gap-3 mb-4 text-sm text-gray-500">
        <Package className="w-4 h-4" />
        <span>{totalActive} إضافة نشطة من {addons.length} إجمالاً</span>
      </div>

      {isLoading ? <div className="text-center py-16 text-gray-400">جاري التحميل...</div> :
        addons.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد إضافات. ابدأ بإضافة ميزات اختيارية بأسعار للعملاء.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {addons.map((a: any) => (
              <Card key={a.id} data-testid={`card-addon-${a.id}`} className={`border ${a.isActive ? "border-gray-200" : "border-gray-100 opacity-50"}`}>
                <CardContent className="p-3.5 flex items-center gap-4">
                  <Switch checked={a.isActive} onCheckedChange={v => toggleActive.mutate({ id: a.id, isActive: v })} data-testid={`switch-addon-${a.id}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{a.nameAr}</span>
                      {a.name && <span className="text-xs text-gray-400">({a.name})</span>}
                      <Badge className={`text-[10px] ${catColor[a.category] || "bg-gray-100 text-gray-600"}`}>{catLabel[a.category] || a.category}</Badge>
                    </div>
                    {a.descriptionAr && <p className="text-xs text-gray-400 mt-0.5">{a.descriptionAr}</p>}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="font-black text-base">{a.price.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400">{a.currency}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEdit(a)} data-testid={`button-edit-addon-${a.id}`}><Pencil className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500" onClick={() => del.mutate(a.id)} data-testid={`button-delete-addon-${a.id}`}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      }

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>{editId ? "تعديل الإضافة" : "إضافة جديدة"}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الاسم بالعربي *</Label>
                <Input value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} placeholder="تطبيق جوال iOS وAndroid" data-testid="input-addon-name-ar" />
              </div>
              <div>
                <Label>الاسم بالإنجليزي</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Mobile App" dir="ltr" data-testid="input-addon-name" />
              </div>
            </div>
            <div>
              <Label>وصف بالعربي</Label>
              <Textarea value={form.descriptionAr} onChange={e => setForm(f => ({ ...f, descriptionAr: e.target.value }))} className="h-16" placeholder="وصف مختصر يظهر للعميل" data-testid="input-addon-desc-ar" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>السعر (ر.س) *</Label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value)||0 }))} min={0} step={50} data-testid="input-addon-price" />
              </div>
              <div>
                <Label>الفئة</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger data-testid="select-addon-cat"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>الترتيب</Label>
              <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value)||0 }))} data-testid="input-addon-order" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending || !form.nameAr || form.price < 0} data-testid="button-save-addon">
              {save.isPending ? "جاري الحفظ..." : editId ? "تحديث" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
