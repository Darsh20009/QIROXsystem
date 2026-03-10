import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, Star, CheckCircle2, XCircle, Settings2, Info, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

const CATEGORIES = [
  { value: "general", label: "عام" },
  { value: "technical", label: "تقني" },
  { value: "design", label: "تصميم" },
  { value: "support", label: "دعم" },
  { value: "security", label: "أمان" },
  { value: "performance", label: "أداء" },
];

const ICONS = ["Star", "Shield", "Zap", "Globe", "Server", "Code", "Lock", "Cpu", "Database", "Cloud", "Phone", "Mail", "BarChart", "Users", "Award", "Heart", "Gift", "CheckCircle", "Layers", "Package"];

const catLabel: Record<string, string> = {
  general: "عام", technical: "تقني", design: "تصميم", support: "دعم", security: "أمان", performance: "أداء",
};

const empty = { name: "", nameAr: "", description: "", icon: "Star", isInLite: false, isInPro: true, isInInfinite: true, category: "general", sortOrder: 0, isActive: true };

export default function AdminSystemFeatures() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState({ ...empty });

  const { data: features = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/system-features"] });

  const save = useMutation({
    mutationFn: (d: any) => editId
      ? apiRequest("PUT", `/api/admin/system-features/${editId}`, d)
      : apiRequest("POST", "/api/admin/system-features", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/system-features"] }); setOpen(false); toast({ title: "تم الحفظ" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/system-features/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/system-features"] }),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: any) => apiRequest("PUT", `/api/admin/system-features/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/system-features"] }),
  });

  function openNew() { setEditId(null); setForm({ ...empty }); setOpen(true); }
  function openEdit(f: any) {
    setEditId(f.id);
    setForm({ name: f.name, nameAr: f.nameAr||"", description: f.description||"", icon: f.icon||"Star", isInLite: f.isInLite, isInPro: f.isInPro, isInInfinite: f.isInInfinite, category: f.category||"general", sortOrder: f.sortOrder||0, isActive: f.isActive });
    setOpen(true);
  }

  const lite = features.filter((f: any) => f.isInLite).length;
  const pro = features.filter((f: any) => f.isInPro).length;
  const inf = features.filter((f: any) => f.isInInfinite).length;

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Settings2 className="w-5 h-5 text-purple-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">مميزات الباقات</h1>
          <p className="text-sm text-gray-500">تحكم في ما يُعرض للعملاء عند اختيار الباقة</p>
        </div>
        <Button onClick={openNew} className="gap-2 mr-auto" data-testid="button-new-feature">
          <Plus className="w-4 h-4" /> إضافة ميزة
        </Button>
      </div>

      {/* Info Banner */}
      <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700/40 p-4 flex gap-3 items-start">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">هذه الصفحة للمميزات الوصفية فقط</p>
          <p className="text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
            المميزات هنا تظهر كنقاط توضيحية داخل كاردات اختيار الباقة (لايت/برو/إنفينتي) — <strong>لا تُضاف للطلب ولا تؤثر على المبلغ الإجمالي.</strong>
            <br />إذا أردت إضافة خدمة مدفوعة تظهر في الطلب وتؤثر على السعر، استخدم:
          </p>
          <Link href="/admin/extra-addons">
            <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 underline underline-offset-2 cursor-pointer hover:text-amber-900">
              <ExternalLink className="w-3.5 h-3.5" /> الإضافات الخارجية (Extra Addons)
            </span>
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "لايت", count: lite, color: "bg-gray-100 text-gray-700" },
          { label: "برو", count: pro, color: "bg-blue-100 text-blue-700" },
          { label: "إنفينتي", count: inf, color: "bg-purple-100 text-purple-700" },
        ].map(t => (
          <div key={t.label} className={`rounded-xl p-4 text-center ${t.color}`}>
            <p className="text-2xl font-black">{t.count}</p>
            <p className="text-xs font-medium mt-0.5">ميزة في باقة {t.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? <div className="text-center py-16 text-gray-400">جاري التحميل...</div> :
        features.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد مميزات. أضف الميزات التي تظهر للعملاء في بوابة الطلب.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {features.map((f: any) => (
              <Card key={f.id} data-testid={`card-feature-${f.id}`} className={`border transition-opacity ${f.isActive ? "border-gray-200" : "border-gray-100 opacity-70"}`}>
                <CardContent className="p-3.5 flex items-center gap-4">
                  <Switch checked={f.isActive} onCheckedChange={v => toggleActive.mutate({ id: f.id, isActive: v })} data-testid={`switch-feature-${f.id}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{f.nameAr || f.name}</span>
                      {f.nameAr && f.name && <span className="text-xs text-gray-400">({f.name})</span>}
                      <Badge variant="outline" className="text-[10px]">{catLabel[f.category] || f.category}</Badge>
                    </div>
                    {f.description && <p className="text-xs text-gray-400 mt-0.5">{f.description}</p>}
                    <div className="flex gap-2 mt-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${f.isInLite ? "bg-gray-200 text-gray-700" : "bg-gray-50 text-gray-300 line-through"}`}>لايت</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${f.isInPro ? "bg-blue-100 text-blue-700" : "bg-gray-50 text-gray-300 line-through"}`}>برو</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${f.isInInfinite ? "bg-purple-100 text-purple-700" : "bg-gray-50 text-gray-300 line-through"}`}>إنفينتي</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEdit(f)} data-testid={`button-edit-feature-${f.id}`}><Pencil className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500" onClick={() => del.mutate(f.id)} data-testid={`button-delete-feature-${f.id}`}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      }

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>{editId ? "تعديل الميزة" : "إضافة ميزة جديدة"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الاسم بالعربي *</Label>
                <Input value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} placeholder="دعم فني 24/7" data-testid="input-feature-name-ar" />
              </div>
              <div>
                <Label>الاسم بالإنجليزي</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="24/7 Support" dir="ltr" data-testid="input-feature-name" />
              </div>
            </div>
            <div>
              <Label>الوصف</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} data-testid="input-feature-desc" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الفئة</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger data-testid="select-feature-cat"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>الترتيب</Label>
                <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value)||0 }))} data-testid="input-feature-order" />
              </div>
            </div>
            <div className="border rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700">تضمين في الباقات</p>
              {[
                { key: "isInLite", label: "لايت (Lite)" },
                { key: "isInPro", label: "برو (Pro)" },
                { key: "isInInfinite", label: "إنفينتي (Infinite)" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="text-sm text-gray-600">{label}</Label>
                  <Switch checked={(form as any)[key]} onCheckedChange={v => setForm(f => ({ ...f, [key]: v }))} data-testid={`switch-${key}`} />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending || !form.nameAr} data-testid="button-save-feature">
              {save.isPending ? "جاري الحفظ..." : editId ? "تحديث" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
