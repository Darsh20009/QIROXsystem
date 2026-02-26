import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Printer, Mail, Trash2, FileCheck, Search } from "lucide-react";
import { useLocation } from "wouter";

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "تحويل بنكي" },
  { value: "cash", label: "نقداً" },
  { value: "stc_pay", label: "STC Pay" },
  { value: "apple_pay", label: "Apple Pay" },
  { value: "paypal", label: "PayPal" },
  { value: "other", label: "أخرى" },
];

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "تحويل بنكي", cash: "نقداً", stc_pay: "STC Pay",
  apple_pay: "Apple Pay", paypal: "PayPal", other: "أخرى",
};

function numberToArabicWords(n: number): string {
  if (n === 0) return "صفر ريال سعودي";
  const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
  const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = ["", "مئة", "مئتان", "ثلاثمئة", "أربعمئة", "خمسمئة", "ستمئة", "سبعمئة", "ثمانمئة", "تسعمئة"];
  const whole = Math.floor(n);
  const cents = Math.round((n - whole) * 100);
  const parts: string[] = [];
  if (whole >= 1000) {
    const t = Math.floor(whole / 1000);
    parts.push((t === 1 ? "ألف" : t === 2 ? "ألفان" : t <= 10 ? ones[t] + " آلاف" : ones[t] + " ألف") );
  }
  const rem = whole % 1000;
  if (rem >= 100) parts.push(hundreds[Math.floor(rem / 100)]);
  const r2 = rem % 100;
  if (r2 > 0 && r2 < 20) parts.push(ones[r2]);
  else if (r2 >= 20) {
    const t = Math.floor(r2 / 10);
    const o = r2 % 10;
    parts.push(o > 0 ? ones[o] + " و" + tens[t] : tens[t]);
  }
  let result = parts.join(" و") + " ريال سعودي";
  if (cents > 0) result += ` و${cents < 20 ? ones[cents] : tens[Math.floor(cents / 10)] + (cents % 10 > 0 ? " و" + ones[cents % 10] : "")} هللة`;
  return result;
}

interface Client { id: string; fullName: string; email: string; username: string; }
interface Invoice { id: string; invoiceNumber: string; totalAmount: number; }

function ReceiptForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const r = await fetch("/api/users?role=client");
      if (!r.ok) return [];
      const d = await r.json();
      return Array.isArray(d) ? d : d.users || [];
    },
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      const r = await fetch("/api/invoices");
      if (!r.ok) return [];
      return r.json();
    },
  });

  const [form, setForm] = useState({
    userId: "",
    invoiceId: "",
    amount: "",
    paymentMethod: "bank_transfer",
    paymentRef: "",
    description: "",
    receivedBy: "QIROX Studio",
    notes: "",
  });

  const amountNum = Number(form.amount) || 0;

  const mutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/receipts", {
        userId: form.userId,
        invoiceId: form.invoiceId || undefined,
        amount: amountNum,
        amountInWords: numberToArabicWords(amountNum),
        paymentMethod: form.paymentMethod,
        paymentRef: form.paymentRef || undefined,
        description: form.description || undefined,
        receivedBy: form.receivedBy,
        notes: form.notes || undefined,
      });
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/receipts"] });
      qc.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "تم إنشاء سند القبض بنجاح" });
      onClose();
    },
    onError: () => toast({ title: "فشل إنشاء السند", variant: "destructive" }),
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
                <SelectItem key={c.id} value={c.id}>{c.fullName || c.username}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-black/50 mb-1 block">ربط بفاتورة (اختياري)</Label>
          <Select value={form.invoiceId} onValueChange={v => {
            const inv = (invoices || []).find((i: Invoice) => i.id === v);
            setForm(p => ({ ...p, invoiceId: v, amount: inv ? String(inv.totalAmount) : p.amount }));
          }}>
            <SelectTrigger className="h-9 text-sm border-black/[0.10]">
              <SelectValue placeholder="اختر فاتورة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بدون فاتورة</SelectItem>
              {(invoices || []).map((inv: Invoice) => (
                <SelectItem key={inv.id} value={inv.id}>{inv.invoiceNumber} — {inv.totalAmount?.toLocaleString()} ر.س</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs text-black/50 mb-1 block">المبلغ المستلم (ر.س) *</Label>
        <Input
          type="number"
          placeholder="1000"
          value={form.amount}
          onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
          className="h-9 text-sm border-black/[0.10]"
          dir="ltr"
        />
        {amountNum > 0 && (
          <p className="text-[10px] text-black/40 mt-1">{numberToArabicWords(amountNum)}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-black/50 mb-1 block">طريقة الدفع *</Label>
          <Select value={form.paymentMethod} onValueChange={v => setForm(p => ({ ...p, paymentMethod: v }))}>
            <SelectTrigger className="h-9 text-sm border-black/[0.10]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-black/50 mb-1 block">مرجع العملية / رقم التحويل</Label>
          <Input value={form.paymentRef} onChange={e => setForm(p => ({ ...p, paymentRef: e.target.value }))} className="h-9 text-sm border-black/[0.10]" placeholder="اختياري" dir="ltr" />
        </div>
      </div>

      <div>
        <Label className="text-xs text-black/50 mb-1 block">الوصف / الغرض</Label>
        <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="h-9 text-sm border-black/[0.10]" placeholder="مثال: دفعة أولى — تصميم موقع" />
      </div>

      <div>
        <Label className="text-xs text-black/50 mb-1 block">المستلِم</Label>
        <Input value={form.receivedBy} onChange={e => setForm(p => ({ ...p, receivedBy: e.target.value }))} className="h-9 text-sm border-black/[0.10]" />
      </div>

      <div>
        <Label className="text-xs text-black/50 mb-1 block">ملاحظات</Label>
        <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="h-16 resize-none text-sm border-black/[0.10]" placeholder="اختياري..." />
      </div>

      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !form.userId || amountNum <= 0}
        className="w-full bg-black text-white h-10 rounded-xl font-bold"
        data-testid="button-create-receipt"
      >
        {mutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "إصدار سند القبض"}
      </Button>
    </div>
  );
}

export default function AdminReceipts() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data: receipts, isLoading } = useQuery({
    queryKey: ["/api/receipts"],
    queryFn: async () => {
      const r = await fetch("/api/receipts");
      if (!r.ok) return [];
      return r.json();
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("POST", `/api/receipts/${id}/send-email`, {});
      return r.json();
    },
    onSuccess: () => toast({ title: "تم إرسال السند بالبريد ✅" }),
    onError: () => toast({ title: "فشل إرسال البريد", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("DELETE", `/api/receipts/${id}`, {});
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/receipts"] }); toast({ title: "تم حذف السند" }); },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const filtered = (receipts || []).filter((r: any) => {
    const client = typeof r.userId === "object" ? r.userId : null;
    return !search || r.receiptNumber?.includes(search) || client?.fullName?.includes(search);
  });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-black/20" />
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black">سندات القبض</h1>
            <p className="text-xs text-black/35">{filtered.length} سند</p>
          </div>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white h-9 rounded-xl text-sm font-bold gap-1.5" data-testid="button-new-receipt">
              <Plus className="w-4 h-4" /> سند قبض جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right font-black">إصدار سند قبض جديد</DialogTitle>
            </DialogHeader>
            <ReceiptForm onClose={() => setShowCreate(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/25" />
        <Input
          placeholder="بحث برقم السند أو اسم العميل..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-9 pr-9 text-sm border-black/[0.10]"
          data-testid="input-search-receipts"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-black/30">
            <FileCheck className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">لا توجد سندات قبض</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.06] bg-black/[0.02]">
                  <th className="text-right px-4 py-3 text-xs font-semibold text-black/40">رقم السند</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-black/40">العميل</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-black/40">المبلغ</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-black/40">طريقة الدفع</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-black/40">التاريخ</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-black/40">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r: any) => {
                  const client = typeof r.userId === "object" ? r.userId : null;
                  return (
                    <tr key={r.id} className="border-b border-black/[0.05] hover:bg-black/[0.01] transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-black/80 text-xs">{r.receiptNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-black text-xs">{client?.fullName || client?.username || "—"}</div>
                        <div className="text-[10px] text-black/35">{client?.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-black text-xs">{r.amount?.toLocaleString()} ر.س</div>
                        {r.amountInWords && <div className="text-[10px] text-black/30 leading-tight max-w-[140px]">{r.amountInWords}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs text-black/50">{METHOD_LABELS[r.paymentMethod] || r.paymentMethod}</td>
                      <td className="px-4 py-3 text-xs text-black/40">
                        {new Date(r.createdAt).toLocaleDateString("ar-SA")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setLocation(`/admin/receipt-print/${r.id}`)}
                            className="p-1.5 rounded-lg hover:bg-black/[0.06] text-black/40 hover:text-black transition-colors"
                            title="طباعة"
                            data-testid={`button-print-receipt-${r.id}`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => sendEmailMutation.mutate(r.id)}
                            disabled={sendEmailMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-black/40 hover:text-blue-600 transition-colors"
                            title="إرسال بالبريد"
                            data-testid={`button-email-receipt-${r.id}`}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(r.id)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-black/40 hover:text-red-500 transition-colors"
                            title="حذف"
                            data-testid={`button-delete-receipt-${r.id}`}
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
