import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Printer, Mail, Check, Trash2, Eye, FileText, Search, X } from "lucide-react";
import { useLocation } from "wouter";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: { id: string; fullName: string; email: string; username: string } | string;
  orderId: { id: string; projectType: string; sector: string } | string | null;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  status: "unpaid" | "paid" | "cancelled";
  dueDate?: string;
  paidAt?: string;
  notes?: string;
  items?: { name: string; qty: number; unitPrice: number; total: number }[];
  createdAt: string;
}

interface Client {
  id: string;
  fullName: string;
  email: string;
  username: string;
}

interface Order {
  id: string;
  projectType: string;
  sector: string;
  totalAmount?: number;
}

function InvoiceForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const r = await fetch("/api/users?role=client");
      if (!r.ok) return [];
      const data = await r.json();
      return Array.isArray(data) ? data : data.users || [];
    },
  });

  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const r = await fetch("/api/orders");
      if (!r.ok) return [];
      return r.json();
    },
  });

  const [sendEmail, setSendEmail] = useState(true);

  const [form, setForm] = useState({
    userId: "",
    orderId: "",
    amount: "",
    dueDate: "",
    notes: "",
    items: [] as { name: string; qty: number; unitPrice: number; total: number }[],
    newItemName: "",
    newItemQty: "1",
    newItemPrice: "",
  });

  const addItem = () => {
    if (!form.newItemName || !form.newItemPrice) return;
    const qty = Number(form.newItemQty) || 1;
    const unitPrice = Number(form.newItemPrice);
    const total = qty * unitPrice;
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { name: prev.newItemName, qty, unitPrice, total }],
      newItemName: "", newItemQty: "1", newItemPrice: "",
    }));
  };

  const removeItem = (i: number) => {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));
  };

  const totalFromItems = form.items.reduce((s, i) => s + i.total, 0);
  const finalAmount = totalFromItems > 0 ? totalFromItems : Number(form.amount) || 0;

  const mutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/invoices", {
        userId: form.userId,
        orderId: form.orderId || undefined,
        amount: finalAmount,
        dueDate: form.dueDate || undefined,
        notes: form.notes || undefined,
        items: form.items.length > 0 ? form.items : undefined,
      });
      return r.json();
    },
    onSuccess: async (data) => {
      qc.invalidateQueries({ queryKey: ["/api/invoices"] });
      if (sendEmail && data?.id) {
        try {
          await fetch(`/api/invoices/${data.id}/send-email`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
          toast({ title: "تم إنشاء الفاتورة وإرسالها بالبريد ✅" });
        } catch {
          toast({ title: "تم إنشاء الفاتورة، لكن فشل إرسال البريد", variant: "destructive" });
        }
      } else {
        toast({ title: "تم إنشاء الفاتورة بنجاح" });
      }
      onClose();
    },
    onError: () => toast({ title: "فشل إنشاء الفاتورة", variant: "destructive" }),
  });

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1" dir="rtl">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-black/50 mb-1 block">العميل *</Label>
          <Select value={form.userId} onValueChange={v => setForm(p => ({ ...p, userId: v }))}>
            <SelectTrigger className="h-9 text-sm border-black/[0.10]">
              <SelectValue placeholder="اختر العميل" />
            </SelectTrigger>
            <SelectContent>
              {(clients || []).map((c: Client) => (
                <SelectItem key={c.id} value={c.id}>{c.fullName || c.username} — {c.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-black/50 mb-1 block">الطلب (اختياري)</Label>
          <Select value={form.orderId} onValueChange={v => setForm(p => ({ ...p, orderId: v }))}>
            <SelectTrigger className="h-9 text-sm border-black/[0.10]">
              <SelectValue placeholder="اربط بطلب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بدون طلب</SelectItem>
              {(orders || []).map((o: Order) => (
                <SelectItem key={o.id} value={o.id}>{o.projectType || o.sector || o.id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs text-black/50 mb-1 block">المبلغ يدوياً (ر.س) — أو أضف بنوداً أدناه</Label>
        <Input
          type="number"
          placeholder="1000"
          value={form.amount}
          onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
          className="h-9 text-sm border-black/[0.10]"
          dir="ltr"
        />
      </div>

      <div>
        <Label className="text-xs text-black/50 mb-2 block">بنود الفاتورة</Label>
        <div className="grid grid-cols-4 gap-2 mb-2">
          <Input placeholder="اسم البند" value={form.newItemName} onChange={e => setForm(p => ({ ...p, newItemName: e.target.value }))} className="col-span-2 h-8 text-xs border-black/[0.10]" />
          <Input placeholder="الكمية" type="number" value={form.newItemQty} onChange={e => setForm(p => ({ ...p, newItemQty: e.target.value }))} className="h-8 text-xs border-black/[0.10]" dir="ltr" />
          <Input placeholder="السعر" type="number" value={form.newItemPrice} onChange={e => setForm(p => ({ ...p, newItemPrice: e.target.value }))} className="h-8 text-xs border-black/[0.10]" dir="ltr" />
        </div>
        <Button type="button" onClick={addItem} size="sm" className="bg-black text-white h-7 text-xs mb-3" disabled={!form.newItemName || !form.newItemPrice}>
          <Plus className="w-3 h-3 ml-1" /> إضافة بند
        </Button>
        {form.items.length > 0 && (
          <div className="space-y-1.5 mb-2">
            {form.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-black/[0.02] rounded-lg px-3 py-2 border border-black/[0.06]">
                <span className="text-xs text-black/60">{item.name} × {item.qty}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-black">{item.total.toLocaleString()} ر.س</span>
                  <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
            <div className="text-xs font-bold text-black/70 text-left px-3">
              المجموع: {totalFromItems.toLocaleString()} ر.س + VAT 15% = {(totalFromItems * 1.15).toLocaleString()} ر.س
            </div>
          </div>
        )}
      </div>

      <div>
        <Label className="text-xs text-black/50 mb-1 block">تاريخ الاستحقاق</Label>
        <Input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} className="h-9 text-sm border-black/[0.10]" dir="ltr" />
      </div>

      <div>
        <Label className="text-xs text-black/50 mb-1 block">ملاحظات</Label>
        <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="h-16 resize-none text-sm border-black/[0.10]" placeholder="ملاحظات اختيارية..." />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer select-none" data-testid="checkbox-send-email-invoice">
        <input
          type="checkbox"
          checked={sendEmail}
          onChange={e => setSendEmail(e.target.checked)}
          className="w-4 h-4 accent-black rounded"
        />
        <span className="text-xs text-black/60 font-medium">إرسال الفاتورة للعميل بالبريد الإلكتروني بعد الإنشاء</span>
        <Mail className="w-3.5 h-3.5 text-black/30" />
      </label>

      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !form.userId || (finalAmount <= 0)}
        className="w-full bg-black text-white h-10 rounded-xl font-bold"
        data-testid="button-create-invoice"
      >
        {mutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : sendEmail ? "إنشاء وإرسال بالبريد" : "إنشاء الفاتورة"}
      </Button>
    </div>
  );
}

export default function AdminInvoices() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      const r = await fetch("/api/invoices");
      if (!r.ok) return [];
      return r.json();
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("PATCH", `/api/invoices/${id}`, { status: "paid" });
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/invoices"] }); toast({ title: "تم تحديد الفاتورة كمدفوعة" }); },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("POST", `/api/invoices/${id}/send-email`, {});
      return r.json();
    },
    onSuccess: () => toast({ title: "تم إرسال الفاتورة بالبريد الإلكتروني ✅" }),
    onError: () => toast({ title: "فشل إرسال البريد", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("DELETE", `/api/invoices/${id}`, {});
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/invoices"] }); toast({ title: "تم حذف الفاتورة" }); },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const filtered = (invoices || []).filter(inv => {
    const client = typeof inv.userId === "object" ? inv.userId : null;
    const matchSearch = !search || inv.invoiceNumber.includes(search) || client?.fullName?.includes(search) || client?.email?.includes(search);
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusColor = (s: string) => {
    if (s === "paid") return "bg-green-50 text-green-700 border-green-200";
    if (s === "cancelled") return "bg-red-50 text-red-700 border-red-200";
    return "bg-yellow-50 text-yellow-700 border-yellow-200";
  };

  const statusLabel = (s: string) => ({ paid: "مدفوع", unpaid: "غير مدفوع", cancelled: "ملغي" }[s] || s);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-black/20" />
    </div>
  );

  return (
    <div className="space-y-6 relative overflow-hidden" dir="rtl">
      <PageGraphics variant="dashboard" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black">الفواتير</h1>
            <p className="text-xs text-black/35">{filtered.length} فاتورة</p>
          </div>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white h-9 rounded-xl text-sm font-bold gap-1.5" data-testid="button-new-invoice">
              <Plus className="w-4 h-4" /> فاتورة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right font-black">إنشاء فاتورة جديدة</DialogTitle>
            </DialogHeader>
            <InvoiceForm onClose={() => setShowCreate(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/25" />
          <Input
            placeholder="بحث برقم الفاتورة أو اسم العميل..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 pr-9 text-sm border-black/[0.10]"
            data-testid="input-search-invoices"
          />
        </div>
        <div className="flex gap-1">
          {["all", "unpaid", "paid", "cancelled"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "bg-black text-white" : "bg-black/[0.04] text-black/50 hover:bg-black/[0.08]"}`}
              data-testid={`filter-${s}`}
            >
              {({ all: "الكل", unpaid: "غير مدفوع", paid: "مدفوع", cancelled: "ملغي" } as any)[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-black/30">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">لا توجد فواتير</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.06] bg-black/[0.02]">
                  <th className="text-right px-4 py-3 text-xs font-semibold text-black/40">رقم الفاتورة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-black/40">العميل</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-black/40">المبلغ</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-black/40">الحالة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-black/40">الاستحقاق</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-black/40">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const client = typeof inv.userId === "object" ? inv.userId : null;
                  return (
                    <tr key={inv.id} className="border-b border-black/[0.05] hover:bg-black/[0.01] transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-black/80 text-xs">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-black text-xs">{client?.fullName || client?.username || "—"}</div>
                        <div className="text-[10px] text-black/35">{client?.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-black text-xs">{inv.totalAmount.toLocaleString()} ر.س</div>
                        {inv.vatAmount > 0 && <div className="text-[10px] text-black/30">شامل VAT {inv.vatAmount.toLocaleString()}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor(inv.status)}`}>
                          {statusLabel(inv.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-black/40">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("ar-SA") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setLocation(`/admin/invoice-print/${inv.id}`)}
                            className="p-1.5 rounded-lg hover:bg-black/[0.06] text-black/40 hover:text-black transition-colors"
                            title="عرض وطباعة"
                            data-testid={`button-print-${inv.id}`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => sendEmailMutation.mutate(inv.id)}
                            disabled={sendEmailMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-black/40 hover:text-blue-600 transition-colors"
                            title="إرسال بالبريد"
                            data-testid={`button-email-${inv.id}`}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          {inv.status === "unpaid" && (
                            <button
                              onClick={() => markPaidMutation.mutate(inv.id)}
                              disabled={markPaidMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-green-50 text-black/40 hover:text-green-600 transition-colors"
                              title="تحديد كمدفوع"
                              data-testid={`button-paid-${inv.id}`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteMutation.mutate(inv.id)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-black/40 hover:text-red-500 transition-colors"
                            title="حذف"
                            data-testid={`button-delete-invoice-${inv.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
