
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Package, Plus, Trash2, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function SupplierDashboard() {
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const { toast } = useToast();
  const [createDialog, setCreateDialog] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", price: "", category: "", attachmentUrl: "" });

  const STATUS_MAP: Record<string, { label: string; color: string }> = {
    pending: { label: L ? "قيد المراجعة" : "Pending", color: "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70 border-black/10 dark:border-white/10 dark:border-black dark:border-white" },
    reviewing: { label: L ? "تحت الدراسة" : "Reviewing", color: "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70 border-black/10 dark:border-white/10 dark:border-black dark:border-white" },
    accepted: { label: L ? "مقبول ✓" : "Accepted ✓", color: "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70 border-black/10 dark:border-white/10 dark:border-black dark:border-white" },
    rejected: { label: L ? "مرفوض" : "Rejected", color: "bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white text-black dark:text-white dark:text-black/70 dark:text-white/70 border-black/10 dark:border-white/10 dark:border-black dark:border-white" },
  };

  const { data: offers = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/supplier/offers"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/supplier/offers", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/supplier/offers"] }); setCreateDialog(false); setForm({ title: "", description: "", price: "", category: "", attachmentUrl: "" }); toast({ title: L ? "تم إرسال العرض بنجاح" : "Offer submitted successfully" }); },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/supplier/offers/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/supplier/offers"] }); toast({ title: L ? "تم حذف العرض" : "Offer deleted" }); },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const stats = {
    total: offers.length,
    pending: offers.filter(o => o.status === "pending").length,
    accepted: offers.filter(o => o.status === "accepted").length,
    rejected: offers.filter(o => o.status === "rejected").length,
  };

  return (
    <div className="p-6 space-y-6 font-sans max-w-3xl mx-auto" dir={dir}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{L ? "لوحة المورد" : "Supplier Dashboard"}</h1>
          <p className="text-gray-500 dark:text-white/50 text-sm">{L ? "أرسل عروضك وتابع حالتها" : "Submit your offers and track their status"}</p>
        </div>
        <Button onClick={() => setCreateDialog(true)} className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80 gap-2" data-testid="button-new-offer">
          <Plus className="w-4 h-4" /> {L ? "عرض جديد" : "New Offer"}
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: L ? "إجمالي" : "Total", value: stats.total, color: "text-gray-900 dark:text-white" },
          { label: L ? "قيد المراجعة" : "Pending", value: stats.pending, color: "text-black dark:text-white dark:text-black/70 dark:text-white/70" },
          { label: L ? "مقبولة" : "Accepted", value: stats.accepted, color: "text-black dark:text-white dark:text-black/70 dark:text-white/70" },
          { label: L ? "مرفوضة" : "Rejected", value: stats.rejected, color: "text-black dark:text-white dark:text-black/70 dark:text-white/70" },
        ].map((s, i) => (
          <Card key={i} className="border-black/10 dark:border-white/10"><CardContent className="p-3 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-400 dark:text-white/40">{s.label}</div></CardContent></Card>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400 dark:text-white/30 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> {L ? "جاري التحميل..." : "Loading..."}
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-white/30">
          <Package className="w-14 h-14 mx-auto mb-3 opacity-20" />
          <p className="font-medium">{L ? "لم ترسل أي عروض بعد" : "No offers submitted yet"}</p>
          <p className="text-sm mt-1">{L ? "ابدأ بإرسال عرضك الأول" : "Start by submitting your first offer"}</p>
          <Button onClick={() => setCreateDialog(true)} size="sm" className="mt-4 bg-black dark:bg-white text-white dark:text-black" data-testid="button-create-first-offer">{L ? "إرسال عرض" : "Submit Offer"}</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map(offer => {
            const st = STATUS_MAP[offer.status] || STATUS_MAP.pending;
            return (
              <Card key={offer.id} className="border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all" data-testid={`card-offer-${offer.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-semibold text-gray-900 dark:text-white">{offer.title}</div>
                        <Badge className={`${st.color} border text-xs`}>{st.label}</Badge>
                      </div>
                      {offer.category && <div className="text-xs text-gray-400 dark:text-white/40 mb-1">{offer.category}</div>}
                      {offer.description && <p className="text-sm text-gray-500 dark:text-white/60 mb-2">{offer.description}</p>}
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-gray-900 dark:text-white">{offer.price?.toLocaleString()} {offer.currency || "SAR"}</div>
                        <div className="text-xs text-gray-400 dark:text-white/30">{new Date(offer.createdAt).toLocaleDateString(L ? "ar-SA" : "en-US")}</div>
                      </div>
                      {offer.adminNote && (
                        <div className="mt-2 bg-black/[0.04] dark:bg-white/[0.06] dark:bg-black dark:bg-white border border-black/10 dark:border-white/10 dark:border-black dark:border-white rounded-lg p-2 text-xs text-black dark:text-white dark:text-black/70 dark:text-white/70">
                          <strong>{L ? "ملاحظة الإدارة:" : "Admin Note:"}</strong> {offer.adminNote}
                        </div>
                      )}
                    </div>
                    {offer.status === "pending" && (
                      <Button size="sm" variant="outline" className="border-black/10 dark:border-white/10 dark:border-black dark:border-white text-black dark:text-white dark:text-black/70 dark:text-white/70 hover:bg-black/[0.04] dark:bg-white/[0.06] dark:hover:bg-black dark:bg-white flex-shrink-0" onClick={() => { if (confirm(L ? "حذف هذا العرض؟" : "Delete this offer?")) deleteMutation.mutate(offer.id); }} data-testid={`button-delete-offer-${offer.id}`}>
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
        <DialogContent className="sm:max-w-lg font-sans" dir={dir}>
          <DialogHeader><DialogTitle>{L ? "إرسال عرض جديد" : "Submit New Offer"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{L ? "عنوان العرض *" : "Offer Title *"}</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={L ? "مثال: تصميم هوية بصرية احترافية" : "e.g. Professional brand identity design"} data-testid="input-offer-title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{L ? "السعر (SAR) *" : "Price (SAR) *"}</label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" data-testid="input-offer-price" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{L ? "الفئة" : "Category"}</label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder={L ? "مثال: تصميم، برمجة..." : "e.g. Design, Development..."} data-testid="input-offer-category" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{L ? "وصف العرض" : "Offer Description"}</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={L ? "اشرح ما تقدمه بالتفصيل..." : "Describe your offer in detail..."} className="min-h-28" data-testid="textarea-offer-description" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCreateDialog(false)}>{L ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={() => createMutation.mutate({ ...form, price: Number(form.price) })} disabled={createMutation.isPending || !form.title || !form.price} className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80" data-testid="button-submit-offer">
                {createMutation.isPending ? (L ? "جاري الإرسال..." : "Submitting...") : (L ? "إرسال العرض" : "Submit Offer")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
