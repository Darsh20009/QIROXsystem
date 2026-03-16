// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FileText, Plus, Search, CheckCircle, XCircle, Clock, Trash2, Eye, Send } from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useI18n } from "@/lib/i18n";

function getStatusMap(L: boolean): Record<string, { label: string; color: string }> { return {
  pending: { label: L ? "بانتظار التوقيع" : "Awaiting Signature", color: "bg-amber-100 text-amber-700 border-amber-200" },
  acknowledged: { label: L ? "موقّع" : "Signed", color: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: L ? "مرفوض" : "Rejected", color: "bg-red-100 text-red-700 border-red-200" },
}; }

const CONTRACT_TEMPLATES = [
  { label: "عقد تطوير موقع", body: `بسم الله الرحمن الرحيم\n\nعقد تطوير موقع إلكتروني\n\nيتعهد مزود الخدمة (شركة قيروكس ستوديو) بتقديم خدمات تطوير الموقع الإلكتروني وفق المواصفات المتفق عليها.\n\nالالتزامات:\n- تسليم المشروع في الوقت المحدد\n- ضمان جودة العمل لمدة 30 يوماً\n- توفير الدعم الفني خلال مرحلة الإطلاق\n\nشروط الدفع:\n- 50% عند بدء المشروع\n- 50% عند التسليم النهائي` },
  { label: "عقد تصميم هوية", body: `بسم الله الرحمن الرحيم\n\nعقد تصميم هوية بصرية\n\nيشمل هذا العقد تصميم الهوية البصرية الكاملة بما فيها:\n- الشعار (Logo)\n- الألوان والخطوط المؤسسية\n- الملفات المطبوعة الأساسية\n\nملاحظة: يحق للعميل 3 جلسات تعديل مجانية.` },
  { label: "عقد صيانة شهرية", body: `بسم الله الرحمن الرحيم\n\nعقد صيانة وإدارة شهرية\n\nيلتزم مزود الخدمة بتقديم خدمات الصيانة الشهرية المشمولة:\n- تحديثات النظام والإضافات\n- النسخ الاحتياطية الأسبوعية\n- مراقبة الأداء والأمان\n- 5 ساعات تعديلات شهرياً` },
];

export default function AdminContracts() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const STATUS_MAP = getStatusMap(L);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [createDialog, setCreateDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState<any>(null);
  const [form, setForm] = useState({ orderId: "", clientId: "", terms: "", totalAmount: "", notes: "" });

  const { data: contracts = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/contracts"] });
  const { data: orders = [] } = useQuery<any[]>({ queryKey: ["/api/admin/orders"] });
  const { data: clients = [] } = useQuery<any[]>({ queryKey: ["/api/users/clients"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/contracts", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/contracts"] }); setCreateDialog(false); setForm({ orderId: "", clientId: "", terms: "", totalAmount: "", notes: "" }); toast({ title: L ? "تم إنشاء العقد بنجاح" : "Contract created successfully" }); },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/contracts/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/contracts"] }); toast({ title: L ? "تم الحذف" : "Deleted" }); },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = contracts.filter(c => {
    const matchSearch = !search || c.client?.fullName?.includes(search) || c.order?.serviceTitle?.includes(search);
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: contracts.length,
    pending: contracts.filter(c => c.status === "pending").length,
    signed: contracts.filter(c => c.status === "acknowledged").length,
    rejected: contracts.filter(c => c.status === "rejected").length,
  };

  const handleOrderSelect = (orderId: string) => {
    const order = orders.find((o: any) => o.id === orderId || o._id === orderId);
    setForm(f => ({ ...f, orderId, clientId: order?.userId || order?.client?._id || "", totalAmount: order?.totalAmount ? String(order.totalAmount) : "" }));
  };

  return (
    <div className="p-6 space-y-6 font-sans" dir={dir}>
      <PageGraphics />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">{L ? "العقود الإلكترونية" : "Electronic Contracts"}</h1>
          <p className="text-black/50 text-sm">{L ? "إنشاء وإدارة عقود المشاريع والتوقيع الإلكتروني" : "Create and manage project contracts with e-signature"}</p>
        </div>
        <Button onClick={() => setCreateDialog(true)} className="bg-black text-white hover:bg-black/80 gap-2" data-testid="button-create-contract">
          <Plus className="w-4 h-4" /> {L ? "إنشاء عقد" : "Create Contract"}
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: L ? "إجمالي العقود" : "Total Contracts", value: stats.total, color: "text-black" },
          { label: L ? "بانتظار التوقيع" : "Awaiting Signature", value: stats.pending, color: "text-amber-600" },
          { label: L ? "موقّعة" : "Signed", value: stats.signed, color: "text-green-600" },
          { label: L ? "مرفوضة" : "Rejected", value: stats.rejected, color: "text-red-500" },
        ].map((s, i) => (
          <Card key={i} className="border-black/10"><CardContent className="p-4 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-black/50 mt-1">{s.label}</div></CardContent></Card>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={L ? "بحث بالعميل أو الخدمة..." : "Search by client or service..."} className="pr-9 border-black/20" data-testid="input-search-contracts" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44 border-black/20" data-testid="select-filter-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{L ? "كل العقود" : "All Contracts"}</SelectItem>
            <SelectItem value="pending">{L ? "بانتظار التوقيع" : "Awaiting Signature"}</SelectItem>
            <SelectItem value="acknowledged">{L ? "موقّعة" : "Signed"}</SelectItem>
            <SelectItem value="rejected">{L ? "مرفوضة" : "Rejected"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-black/30">{L ? "جاري التحميل..." : "Loading..."}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-black/30"><FileText className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>{L ? "لا توجد عقود" : "No contracts"}</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(contract => {
            const st = STATUS_MAP[contract.status] || STATUS_MAP.pending;
            return (
              <Card key={contract.id} className="border-black/10 hover:border-black/20 transition-all" data-testid={`card-contract-${contract.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-black/40" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{contract.client?.fullName || (L ? "عميل" : "Client")}</div>
                        <div className="text-xs text-black/40">{contract.order?.serviceTitle || contract.order?.title || (L ? "طلب" : "Request")}</div>
                        <div className="text-xs text-black/30 mt-0.5">{new Date(contract.createdAt).toLocaleDateString(L ? "ar-SA" : "en-US")}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{contract.totalAmount?.toLocaleString() || 0} <span className="text-xs text-black/40">{L ? "ريال" : "SAR"}</span></div>
                      </div>
                      <Badge className={`${st.color} border text-xs`}>{st.label}</Badge>
                      {contract.acknowledgedAt && (
                        <div className="text-xs text-black/30">{L ? "وقّع:" : "Signed:"} {new Date(contract.acknowledgedAt).toLocaleDateString(L ? "ar-SA" : "en-US")}</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-black/20" onClick={() => setViewDialog(contract)} data-testid={`button-view-contract-${contract.id}`}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {contract.status === "pending" && (
                        <Button size="sm" variant="outline" className="border-red-200 text-red-500" onClick={() => { if (confirm(L ? "حذف هذا العقد؟" : "Delete this contract?")) deleteMutation.mutate(contract.id); }} data-testid={`button-delete-contract-${contract.id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="sm:max-w-2xl font-sans max-h-[90vh] overflow-y-auto" dir={dir}>
          <DialogHeader><DialogTitle>{L ? "إنشاء عقد جديد" : "Create New Contract"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{L ? "اختر قالب" : "Choose Template"}</label>
              <div className="flex gap-2 flex-wrap">
                {CONTRACT_TEMPLATES.map((t, i) => (
                  <Button key={i} size="sm" variant="outline" className="border-black/20 text-xs" onClick={() => setForm(f => ({ ...f, terms: t.body }))} data-testid={`button-template-${i}`}>{t.label}</Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{L ? "الطلب" : "Order"}</label>
                <Select value={form.orderId} onValueChange={handleOrderSelect}>
                  <SelectTrigger className="border-black/20" data-testid="select-order"><SelectValue placeholder={L ? "اختر الطلب..." : "Select order..."} /></SelectTrigger>
                  <SelectContent>
                    {orders.slice(0,50).map((o: any) => (
                      <SelectItem key={o.id || o._id} value={o.id || o._id}>{o.serviceTitle || o.title || o.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{L ? "معرف العميل" : "Client ID"}</label>
                <Input value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} placeholder={L ? "يُحدد تلقائياً عند اختيار الطلب" : "Auto-set when order is selected"} className="border-black/20" data-testid="input-client-id" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{L ? "المبلغ الإجمالي (ريال)" : "Total Amount (SAR)"}</label>
              <Input type="number" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} placeholder="0.00" className="border-black/20" data-testid="input-total-amount" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{L ? "بنود العقد *" : "Contract Terms *"}</label>
              <Textarea value={form.terms} onChange={e => setForm(f => ({ ...f, terms: e.target.value }))} placeholder={L ? "اكتب بنود العقد هنا..." : "Write contract terms here..."} className="border-black/20 min-h-48 font-mono text-sm" data-testid="textarea-contract-terms" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{L ? "ملاحظات" : "Notes"}</label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={L ? "ملاحظات إضافية..." : "Additional notes..."} className="border-black/20" data-testid="input-contract-notes" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCreateDialog(false)}>{L ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={() => createMutation.mutate({ ...form, totalAmount: Number(form.totalAmount) || 0 })} disabled={createMutation.isPending || !form.terms} className="bg-black text-white hover:bg-black/80" data-testid="button-submit-contract">
                {createMutation.isPending ? (L ? "جاري الإنشاء..." : "Creating...") : (L ? "إنشاء العقد" : "Create Contract")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
        <DialogContent className="sm:max-w-2xl font-sans max-h-[90vh] overflow-y-auto" dir={dir}>
          <DialogHeader><DialogTitle>{L ? "عرض العقد" : "View Contract"}</DialogTitle></DialogHeader>
          {viewDialog && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className={`${(STATUS_MAP[viewDialog.status] || STATUS_MAP.pending).color} border`}>{(STATUS_MAP[viewDialog.status] || STATUS_MAP.pending).label}</Badge>
                <span className="text-sm text-black/40">{new Date(viewDialog.createdAt).toLocaleDateString(L ? "ar-SA" : "en-US")}</span>
              </div>
              <div className="bg-black/5 rounded-xl p-5">
                <pre className="text-sm whitespace-pre-wrap font-sans text-black/80">{viewDialog.terms}</pre>
              </div>
              {viewDialog.status === "acknowledged" && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-700 font-semibold text-sm mb-2"><CheckCircle className="w-4 h-4" /> {L ? "وُقِّع إلكترونياً" : "Electronically Signed"}</div>
                  <div className="text-xs text-green-600">{L ? "تاريخ التوقيع:" : "Signed on:"} {new Date(viewDialog.acknowledgedAt).toLocaleDateString(L ? "ar-SA" : "en-US")}</div>
                  {(viewDialog as any).signatureText && <div className="mt-2 text-sm font-semibold text-green-800">{(viewDialog as any).signatureText}</div>}
                  {(viewDialog as any).signatureData && (
                    <img src={(viewDialog as any).signatureData} alt={L ? "التوقيع" : "Signature"} className="mt-2 border border-green-200 rounded bg-white p-2 max-h-24" />
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
