// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Package, Plus, Trash2, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد المراجعة", color: "bg-amber-100 text-amber-700 border-amber-200" },
  reviewing: { label: "تحت الدراسة", color: "bg-blue-100 text-blue-700 border-blue-200" },
  accepted: { label: "مقبول ✓", color: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: "مرفوض", color: "bg-red-100 text-red-700 border-red-200" },
};

export default function SupplierDashboard() {
  const { toast } = useToast();
  const [createDialog, setCreateDialog] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", price: "", category: "", attachmentUrl: "" });

  const { data: offers = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/supplier/offers"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/supplier/offers", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/supplier/offers"] }); setCreateDialog(false); setForm({ title: "", description: "", price: "", category: "", attachmentUrl: "" }); toast({ title: "تم إرسال العرض بنجاح" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/supplier/offers/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/supplier/offers"] }); toast({ title: "تم حذف العرض" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const stats = {
    total: offers.length,
    pending: offers.filter(o => o.status === "pending").length,
    accepted: offers.filter(o => o.status === "accepted").length,
    rejected: offers.filter(o => o.status === "rejected").length,
  };

  return (
    <div className="p-6 space-y-6 font-sans max-w-3xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">لوحة المورد</h1>
          <p className="text-black/50 text-sm">أرسل عروضك وتابع حالتها</p>
        </div>
        <Button onClick={() => setCreateDialog(true)} className="bg-black text-white hover:bg-black/80 gap-2" data-testid="button-new-offer">
          <Plus className="w-4 h-4" /> عرض جديد
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "إجمالي", value: stats.total, color: "text-black" },
          { label: "قيد المراجعة", value: stats.pending, color: "text-amber-600" },
          { label: "مقبولة", value: stats.accepted, color: "text-green-600" },
          { label: "مرفوضة", value: stats.rejected, color: "text-red-500" },
        ].map((s, i) => (
          <Card key={i} className="border-black/10"><CardContent className="p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-black/40">{s.label}</div></CardContent></Card>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-black/30">جاري التحميل...</div>
      ) : offers.length === 0 ? (
        <div className="text-center py-16 text-black/30">
          <Package className="w-14 h-14 mx-auto mb-3 opacity-20" />
          <p className="font-medium">لم ترسل أي عروض بعد</p>
          <p className="text-sm mt-1">ابدأ بإرسال عرضك الأول</p>
          <Button onClick={() => setCreateDialog(true)} size="sm" className="mt-4 bg-black text-white" data-testid="button-create-first-offer">إرسال عرض</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map(offer => {
            const st = STATUS_MAP[offer.status] || STATUS_MAP.pending;
            return (
              <Card key={offer.id} className="border-black/10 hover:border-black/20 transition-all" data-testid={`card-offer-${offer.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-semibold">{offer.title}</div>
                        <Badge className={`${st.color} border text-xs`}>{st.label}</Badge>
                      </div>
                      {offer.category && <div className="text-xs text-black/40 mb-1">{offer.category}</div>}
                      {offer.description && <p className="text-sm text-black/60 mb-2">{offer.description}</p>}
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-black">{offer.price?.toLocaleString()} {offer.currency || "SAR"}</div>
                        <div className="text-xs text-black/30">{new Date(offer.createdAt).toLocaleDateString("ar-SA")}</div>
                      </div>
                      {offer.adminNote && (
                        <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-2 text-xs text-blue-700">
                          <strong>ملاحظة الإدارة:</strong> {offer.adminNote}
                        </div>
                      )}
                    </div>
                    {offer.status === "pending" && (
                      <Button size="sm" variant="outline" className="border-red-200 text-red-500 hover:bg-red-50 flex-shrink-0" onClick={() => { if (confirm("حذف هذا العرض؟")) deleteMutation.mutate(offer.id); }} data-testid={`button-delete-offer-${offer.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="sm:max-w-lg font-sans" dir="rtl">
          <DialogHeader><DialogTitle>إرسال عرض جديد</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">عنوان العرض *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="مثال: تصميم هوية بصرية احترافية" className="border-black/20" data-testid="input-offer-title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">السعر (SAR) *</label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" className="border-black/20" data-testid="input-offer-price" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">الفئة</label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="مثال: تصميم، برمجة..." className="border-black/20" data-testid="input-offer-category" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">وصف العرض</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="اشرح ما تقدمه بالتفصيل..." className="border-black/20 min-h-28" data-testid="textarea-offer-description" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCreateDialog(false)}>إلغاء</Button>
              <Button onClick={() => createMutation.mutate({ ...form, price: Number(form.price) })} disabled={createMutation.isPending || !form.title || !form.price} className="bg-black text-white hover:bg-black/80" data-testid="button-submit-offer">
                {createMutation.isPending ? "جاري الإرسال..." : "إرسال العرض"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
