import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SARIcon from "@/components/SARIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Printer, Mail, Check, Trash2, FileText, Search, X, Wand2, Pencil, Copy, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useI18n } from "@/lib/i18n";
import { DocumentAiComposer } from "@/components/DocumentAiComposer";

interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: { id: string; fullName: string; email: string; username: string } | string;
  orderId: { id: string; projectType: string; sector: string } | string | null;
  amount: number;
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
  userId?: string;
}

function InvoiceForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const qc = useQueryClient();

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/users/clients"],
    queryFn: async () => {
      const r = await fetch("/api/users/clients", { credentials: "include" });
      if (!r.ok) return [];
      const data = await r.json();
      return Array.isArray(data) ? data : data.users || [];
    },
  });

  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const r = await fetch("/api/orders", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
  });

  const [sendEmail, setSendEmail] = useState(true);
  const [showAi, setShowAi] = useState(false);

  const [form, setForm] = useState({
    userId: "",
    orderId: "",
    amount: "",
    status: "paid" as "paid" | "unpaid",
    dueDate: "",
    notes: "",
    items: [] as { name: string; qty: number; unitPrice: number; total: number }[],
    newItemName: "",
    newItemQty: "1",
    newItemPrice: "",
  });

  const handleOrderSelect = (orderId: string) => {
    if (orderId === "none") { setForm(p => ({ ...p, orderId: "" })); return; }
    const order = (orders || []).find(o => o.id === orderId) as any;
    const clientId = typeof order?.userId === "object"
      ? order?.userId?._id?.toString() || (order as any)?.client?._id?.toString()
      : order?.userId;
    setForm(p => ({
      ...p,
      orderId,
      amount: order?.totalAmount ? String(order.totalAmount) : p.amount,
      userId: clientId || p.userId,
    }));
  };

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
        status: form.status,
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
          await fetch(`/api/invoices/${data.id}/send-email`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", credentials: "include" });
          toast({ title: L ? "تم إنشاء الفاتورة وإرسالها بالبريد ✅" : "Invoice created and emailed ✅" });
        } catch {
          toast({ title: L ? "تم إنشاء الفاتورة، لكن فشل إرسال البريد" : "Invoice created, but email failed", variant: "destructive" });
        }
      } else {
        toast({ title: L ? "تم إنشاء الفاتورة بنجاح" : "Invoice created successfully" });
      }
      onClose();
    },
    onError: () => toast({ title: L ? "فشل إنشاء الفاتورة" : "Failed to create invoice", variant: "destructive" }),
  });

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1" dir={dir}>

      {/* Status Toggle */}
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.06] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-black dark:text-white">{L ? "أداة الذكاء الاصطناعي للفواتير" : "Invoice AI Tool"}</p>
            <p className="text-xs text-black dark:text-white">{L ? "اكتب تفاصيل الفاتورة أو الصق نصاً ليتم تحسينه." : "Write invoice details or paste text to improve."}</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setShowAi(v => !v)} className="border-black/10 dark:border-white/10 text-black dark:text-white gap-2" data-testid="button-toggle-invoice-ai">
            <Wand2 className="w-4 h-4" /> {showAi ? (L ? "إخفاء" : "Hide") : (L ? "فتح الأداة" : "Open")}
          </Button>
        </div>
        {showAi && (
          <div className="mt-4">
            <DocumentAiComposer
              documentType="invoice"
              L={L}
              initialText={form.notes}
              defaultContext={L ? "أنشئ وصف فاتورة احترافي يتضمن البنود والمبالغ وشروط الدفع بصياغة واضحة للعميل." : "Create a professional invoice description with items, amounts, and payment terms."}
              onUseText={(text) => {
                setForm(p => ({ ...p, notes: text }));
                setShowAi(false);
                toast({ title: L ? "تم وضع النص في ملاحظات الفاتورة" : "Text added to invoice notes" });
              }}
            />
          </div>
        )}
      </div>

      {/* Status Toggle */}
      <div className="flex gap-2 p-1 bg-black/[0.04] rounded-xl">
        {([["paid", L ? "✅ مدفوعة" : "✅ Paid"], ["unpaid", L ? "⏳ غير مدفوعة" : "⏳ Unpaid"]] as const).map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => setForm(p => ({ ...p, status: val }))}
            className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-all ${form.status === val ? "bg-white shadow text-black" : "text-black/40 hover:text-black/70"}`}
            data-testid={`button-invoice-status-${val}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Order Quick Selector */}
      <div className="bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 rounded-xl p-3">
        <Label className="text-xs text-black dark:text-white font-bold mb-2 block">{L ? "🔗 اربط بطلب موجود (يُعبّئ المبلغ والعميل تلقائياً)" : "🔗 Link to existing order (auto-fills amount & client)"}</Label>
        <Select value={form.orderId || "none"} onValueChange={handleOrderSelect}>
          <SelectTrigger className="h-9 text-sm border-black/10 dark:border-white/10 bg-white">
            <SelectValue placeholder={L ? "اختر طلباً..." : "Select an order..."} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{L ? "بدون ربط بطلب" : "No order link"}</SelectItem>
            {(orders || []).map((o: Order) => (
              <SelectItem key={o.id} value={o.id}>
                {o.projectType || o.sector || o.id.slice(-6)}
                {o.totalAmount ? <> — {Number(o.totalAmount).toLocaleString()} <SARIcon size={9} className="opacity-60 inline" /></> : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-black/50 mb-1 block">{L ? "العميل *" : "Client *"}</Label>
          <Select value={form.userId} onValueChange={v => setForm(p => ({ ...p, userId: v }))}>
            <SelectTrigger className="h-9 text-sm border-black/[0.10]">
              <SelectValue placeholder={L ? "اختر العميل" : "Select client"} />
            </SelectTrigger>
            <SelectContent>
              {(clients || []).map((c: Client) => (
                <SelectItem key={c.id} value={c.id}>{c.fullName || c.username} — {c.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-black/50 mb-1 flex items-center gap-1">{L ? "المبلغ" : "Amount"} (<SARIcon size={9} className="opacity-60" />) {form.orderId ? (L ? "— مُعبّأ من الطلب" : "— filled from order") : ""}</Label>
          <Input
            type="number"
            placeholder="1000"
            value={form.amount}
            onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
            className={`h-9 text-sm border-black/[0.10] ${form.orderId ? "bg-black/[0.04] dark:bg-white/[0.06] border-black/15 dark:border-white/15" : ""}`}
            dir="ltr"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs text-black/50 mb-2 block">{L ? "بنود الفاتورة" : "Invoice Items"}</Label>

        {/* Preset Quick-Add Items */}
        {(() => {
          const PRESETS = L ? [
            { name: "تصميم وتطوير الموقع الإلكتروني",   price: 2499 },
            { name: "تطبيق جوال (iOS + Android)",         price: 3499 },
            { name: "لوحة تحكم إدارية",                   price: 1499 },
            { name: "تكامل بوابة الدفع الإلكتروني",       price: 499  },
            { name: "نظام الحجز والمواعيد",               price: 799  },
            { name: "نظام التوصيل والمتابعة",             price: 699  },
            { name: "ميزات الذكاء الاصطناعي",             price: 999  },
            { name: "استضافة (سنة كاملة)",                price: 299  },
            { name: "دومين (.com — سنة)",                  price: 79   },
            { name: "شهادة SSL",                           price: 99   },
            { name: "صيانة وتحديثات (شهر)",               price: 199  },
            { name: "محتوى وكتابة إبداعية",               price: 399  },
            { name: "تصميم هوية بصرية",                   price: 899  },
            { name: "إعداد إعلانات Google / Meta",        price: 599  },
          ] : [
            { name: "Website Design & Development",       price: 2499 },
            { name: "Mobile App (iOS + Android)",         price: 3499 },
            { name: "Admin Dashboard",                    price: 1499 },
            { name: "Payment Gateway Integration",        price: 499  },
            { name: "Booking & Appointments System",      price: 799  },
            { name: "Delivery & Tracking System",         price: 699  },
            { name: "AI Features",                        price: 999  },
            { name: "Hosting (1 year)",                   price: 299  },
            { name: "Domain (.com — 1 year)",             price: 79   },
            { name: "SSL Certificate",                    price: 99   },
            { name: "Maintenance & Updates (monthly)",    price: 199  },
            { name: "Copywriting & Content",              price: 399  },
            { name: "Brand Identity Design",              price: 899  },
            { name: "Google / Meta Ads Setup",            price: 599  },
          ];
          return (
            <div className="mb-3">
              <p className="text-[10px] text-black/40 dark:text-white/40 mb-1.5">{L ? "⚡ بنود جاهزة — اضغط للإضافة الفورية" : "⚡ Quick presets — click to add"}</p>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      const total = p.price;
                      setForm(prev => ({
                        ...prev,
                        items: [...prev.items, { name: p.name, qty: 1, unitPrice: p.price, total }],
                      }));
                    }}
                    className="text-[10px] bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.09] dark:hover:bg-white/[0.12] border border-black/[0.08] dark:border-white/[0.08] rounded-lg px-2 py-1 text-black/70 dark:text-white/70 transition-colors flex items-center gap-1"
                    data-testid={`button-preset-item-${i}`}
                  >
                    <Plus className="w-2.5 h-2.5 opacity-50" />
                    {p.name}
                    <span className="opacity-50 font-mono">{p.price.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-4 gap-2 mb-2">
          <Input placeholder={L ? "اسم البند" : "Item name"} value={form.newItemName} onChange={e => setForm(p => ({ ...p, newItemName: e.target.value }))} className="col-span-2 h-8 text-xs border-black/[0.10]" />
          <Input placeholder={L ? "الكمية" : "Qty"} type="number" value={form.newItemQty} onChange={e => setForm(p => ({ ...p, newItemQty: e.target.value }))} className="h-8 text-xs border-black/[0.10]" dir="ltr" />
          <Input placeholder={L ? "السعر" : "Price"} type="number" value={form.newItemPrice} onChange={e => setForm(p => ({ ...p, newItemPrice: e.target.value }))} className="h-8 text-xs border-black/[0.10]" dir="ltr" />
        </div>
        <Button type="button" onClick={addItem} size="sm" className="bg-black text-white h-7 text-xs mb-3" disabled={!form.newItemName || !form.newItemPrice}>
          <Plus className="w-3 h-3 ml-1" /> {L ? "إضافة بند مخصص" : "Add Custom Item"}
        </Button>
        {form.items.length > 0 && (
          <div className="space-y-1.5 mb-2">
            {form.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-black/[0.02] rounded-lg px-3 py-2 border border-black/[0.06]">
                <span className="text-xs text-black/60">{item.name} × {item.qty}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-black flex items-center gap-1">{item.total.toLocaleString()} <SARIcon size={10} className="opacity-70" /></span>
                  <button onClick={() => removeItem(i)} className="text-black/70 dark:text-white/70 hover:text-black dark:text-white"><X className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
            <div className="text-xs font-bold text-black/70 text-left px-3">
              <span className="flex items-center gap-1 flex-wrap">{L ? "المجموع:" : "Total:"} {totalFromItems.toLocaleString()} <SARIcon size={10} className="opacity-70" /></span>
            </div>
          </div>
        )}
      </div>

      <div>
        <Label className="text-xs text-black/50 mb-1 block">{L ? "تاريخ الاستحقاق" : "Due Date"}</Label>
        <Input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} className="h-9 text-sm border-black/[0.10]" dir="ltr" />
      </div>

      <div>
        <Label className="text-xs text-black/50 mb-1 block">{L ? "ملاحظات" : "Notes"}</Label>
        <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="h-16 resize-none text-sm border-black/[0.10]" placeholder={L ? "ملاحظات اختيارية..." : "Optional notes..."} />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer select-none" data-testid="checkbox-send-email-invoice">
        <input
          type="checkbox"
          checked={sendEmail}
          onChange={e => setSendEmail(e.target.checked)}
          className="w-4 h-4 accent-black rounded"
        />
        <span className="text-xs text-black/60 font-medium">{L ? "إرسال الفاتورة للعميل بالبريد الإلكتروني بعد الإنشاء" : "Send invoice to client by email after creation"}</span>
        <Mail className="w-3.5 h-3.5 text-black/30" />
      </label>

      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !form.userId || (finalAmount <= 0)}
        className="w-full bg-black text-white h-10 rounded-xl font-bold"
        data-testid="button-create-invoice"
      >
        {mutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : sendEmail ? (L ? "إنشاء وإرسال بالبريد" : "Create & Email") : (L ? "إنشاء الفاتورة" : "Create Invoice")}
      </Button>
    </div>
  );
}

function EditInvoiceForm({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const qc = useQueryClient();

  const [form, setForm] = useState({
    amount: String(invoice.totalAmount || invoice.amount || ""),
    status: invoice.status as "paid" | "unpaid" | "cancelled",
    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split("T")[0] : "",
    notes: invoice.notes || "",
    items: invoice.items || [] as { name: string; qty: number; unitPrice: number; total: number }[],
    newItemName: "", newItemQty: "1", newItemPrice: "",
  });

  // Inline item editing
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editBuf, setEditBuf] = useState({ name: "", qty: "1", unitPrice: "" });

  const startEdit = (i: number) => {
    const it = form.items[i];
    setEditBuf({ name: it.name, qty: String(it.qty), unitPrice: String(it.unitPrice) });
    setEditingIdx(i);
  };
  const saveEdit = () => {
    if (editingIdx === null) return;
    const qty = Number(editBuf.qty) || 1;
    const unitPrice = Number(editBuf.unitPrice) || 0;
    setForm(p => ({
      ...p,
      items: p.items.map((it, idx) => idx === editingIdx ? { ...it, name: editBuf.name, qty, unitPrice, total: qty * unitPrice } : it),
    }));
    setEditingIdx(null);
  };

  const addItem = () => {
    if (!form.newItemName || !form.newItemPrice) return;
    const qty = Number(form.newItemQty) || 1;
    const unitPrice = Number(form.newItemPrice);
    setForm(p => ({ ...p, items: [...p.items, { name: p.newItemName, qty, unitPrice, total: qty * unitPrice }], newItemName: "", newItemQty: "1", newItemPrice: "" }));
  };

  const removeItem = (i: number) => {
    if (editingIdx === i) setEditingIdx(null);
    setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  };

  const totalFromItems = form.items.reduce((s, i) => s + i.total, 0);
  const finalAmount = totalFromItems > 0 ? totalFromItems : Number(form.amount) || 0;

  const mutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PATCH", `/api/invoices/${invoice.id}`, {
        amount: finalAmount, totalAmount: finalAmount,
        status: form.status,
        dueDate: form.dueDate || undefined,
        notes: form.notes || undefined,
        items: form.items.length > 0 ? form.items : undefined,
      });
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: L ? "تم تحديث الفاتورة بنجاح ✅" : "Invoice updated successfully ✅" });
      onClose();
    },
    onError: () => toast({ title: L ? "فشل تحديث الفاتورة" : "Failed to update invoice", variant: "destructive" }),
  });

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1" dir={dir}>
      {/* Status toggle */}
      <div className="flex gap-2 p-1 bg-black/[0.04] rounded-xl">
        {([["paid", L ? "✅ مدفوعة" : "✅ Paid"], ["unpaid", L ? "⏳ غير مدفوعة" : "⏳ Unpaid"], ["cancelled", L ? "❌ ملغي" : "❌ Cancelled"]] as const).map(([val, label]) => (
          <button key={val} type="button" onClick={() => setForm(p => ({ ...p, status: val }))}
            className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-all ${form.status === val ? "bg-white shadow text-black" : "text-black/40 hover:text-black/70"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-black/50 mb-1 flex items-center gap-1">{L ? "المبلغ" : "Amount"} (<SARIcon size={9} className="opacity-60" />)</Label>
          <Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className="h-9 text-sm border-black/[0.10]" dir="ltr" />
        </div>
        <div>
          <Label className="text-xs text-black/50 mb-1 block">{L ? "تاريخ الاستحقاق" : "Due Date"}</Label>
          <Input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} className="h-9 text-sm border-black/[0.10]" dir="ltr" />
        </div>
      </div>

      {/* Items with inline edit */}
      <div>
        <Label className="text-xs text-black/50 mb-2 block font-semibold">{L ? "بنود الفاتورة" : "Invoice Items"} ({form.items.length})</Label>
        {form.items.length > 0 && (
          <div className="space-y-2 mb-3">
            {form.items.map((item, i) => (
              editingIdx === i ? (
                <div key={i} className="bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-4 gap-2">
                    <Input value={editBuf.name} onChange={e => setEditBuf(p => ({ ...p, name: e.target.value }))} placeholder={L ? "اسم البند" : "Name"} className="col-span-2 h-8 text-xs border-black/15 dark:border-white/15" />
                    <Input type="number" value={editBuf.qty} onChange={e => setEditBuf(p => ({ ...p, qty: e.target.value }))} placeholder="Qty" className="h-8 text-xs border-black/15 dark:border-white/15" dir="ltr" />
                    <Input type="number" value={editBuf.unitPrice} onChange={e => setEditBuf(p => ({ ...p, unitPrice: e.target.value }))} placeholder={L ? "السعر" : "Price"} className="h-8 text-xs border-black/15 dark:border-white/15" dir="ltr" />
                  </div>
                  {editBuf.unitPrice && (
                    <p className="text-[11px] text-black dark:text-white font-bold px-1">
                      {L ? "الإجمالي:" : "Total:"} {((Number(editBuf.qty) || 1) * (Number(editBuf.unitPrice) || 0)).toLocaleString()} {L ? "ر.س" : "SAR"}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button type="button" onClick={saveEdit} size="sm" className="bg-black dark:bg-white hover:bg-black dark:bg-white text-white h-7 text-xs px-3 gap-1" disabled={!editBuf.name || !editBuf.unitPrice}>
                      <CheckCircle className="w-3 h-3" /> {L ? "حفظ" : "Save"}
                    </Button>
                    <Button type="button" onClick={() => setEditingIdx(null)} size="sm" variant="outline" className="h-7 text-xs px-3 border-black/10 dark:border-white/10">
                      <X className="w-3 h-3" /> {L ? "إلغاء" : "Cancel"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div key={i} className="group flex items-center justify-between bg-black/[0.02] hover:bg-black/[0.04] dark:bg-white/[0.06] rounded-xl px-3 py-2.5 border border-black/[0.06] hover:border-black/10 dark:border-white/10 transition-all">
                  <span className="text-xs text-black font-medium flex-1">{item.name} <span className="text-black/40 font-mono">× {item.qty} × {item.unitPrice.toLocaleString()}</span></span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-black flex items-center gap-1">{item.total.toLocaleString()} <SARIcon size={10} className="opacity-60" /></span>
                    <button onClick={() => startEdit(i)} className="opacity-0 group-hover:opacity-100 text-black dark:text-white hover:text-black dark:text-white transition-all p-1 rounded-lg hover:bg-black/[0.04] dark:bg-white/[0.06]">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => removeItem(i)} className="opacity-0 group-hover:opacity-100 text-black/70 dark:text-white/70 hover:text-black dark:text-white transition-all p-1 rounded-lg hover:bg-black/[0.04] dark:bg-white/[0.06]">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            ))}
            <div className="text-xs font-bold text-black/70 px-3 pt-1 border-t border-black/[0.06] flex justify-between">
              <span>{L ? "الإجمالي" : "Total"}</span>
              <span className="flex items-center gap-1">{totalFromItems.toLocaleString()} <SARIcon size={10} className="opacity-70" /></span>
            </div>
          </div>
        )}
        {/* Add new item */}
        <div className="bg-black/[0.01] border border-dashed border-black/[0.12] rounded-xl p-3">
          <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wide mb-2">{L ? "⚡ بنود جاهزة" : "⚡ Quick Presets"}</p>
          {(() => {
            const PRESETS = L ? [
              { name: "تصميم وتطوير الموقع الإلكتروني",   price: 2499 },
              { name: "تطبيق جوال (iOS + Android)",         price: 3499 },
              { name: "لوحة تحكم إدارية",                   price: 1499 },
              { name: "تكامل بوابة الدفع الإلكتروني",       price: 499  },
              { name: "نظام الحجز والمواعيد",               price: 799  },
              { name: "نظام التوصيل والمتابعة",             price: 699  },
              { name: "ميزات الذكاء الاصطناعي",             price: 999  },
              { name: "استضافة (سنة كاملة)",                price: 299  },
              { name: "دومين (.com — سنة)",                  price: 79   },
              { name: "شهادة SSL",                           price: 99   },
              { name: "صيانة وتحديثات (شهر)",               price: 199  },
              { name: "تصميم هوية بصرية",                   price: 899  },
            ] : [
              { name: "Website Design & Development",       price: 2499 },
              { name: "Mobile App (iOS + Android)",         price: 3499 },
              { name: "Admin Dashboard",                    price: 1499 },
              { name: "Payment Gateway Integration",        price: 499  },
              { name: "Booking & Appointments System",      price: 799  },
              { name: "Delivery & Tracking System",         price: 699  },
              { name: "AI Features",                        price: 999  },
              { name: "Hosting (1 year)",                   price: 299  },
              { name: "Domain (.com — 1 year)",             price: 79   },
              { name: "SSL Certificate",                    price: 99   },
              { name: "Maintenance & Updates (monthly)",    price: 199  },
              { name: "Brand Identity Design",              price: 899  },
            ];
            return (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {PRESETS.map((p, i) => (
                  <button key={i} type="button"
                    onClick={() => setForm(prev => ({ ...prev, items: [...prev.items, { name: p.name, qty: 1, unitPrice: p.price, total: p.price }] }))}
                    className="text-[10px] bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.09] dark:hover:bg-white/[0.12] border border-black/[0.08] dark:border-white/[0.08] rounded-lg px-2 py-1 text-black/70 dark:text-white/70 transition-colors flex items-center gap-1">
                    <Plus className="w-2.5 h-2.5 opacity-50" />{p.name}<span className="opacity-40 font-mono">{p.price.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            );
          })()}
          <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wide mb-2">{L ? "بند مخصص" : "Custom Item"}</p>
          <div className="grid grid-cols-4 gap-2 mb-2">
            <Input placeholder={L ? "اسم البند" : "Item name"} value={form.newItemName} onChange={e => setForm(p => ({ ...p, newItemName: e.target.value }))} className="col-span-2 h-8 text-xs border-black/[0.10]" />
            <Input placeholder={L ? "الكمية" : "Qty"} type="number" value={form.newItemQty} onChange={e => setForm(p => ({ ...p, newItemQty: e.target.value }))} className="h-8 text-xs border-black/[0.10]" dir="ltr" />
            <Input placeholder={L ? "السعر" : "Price"} type="number" value={form.newItemPrice} onChange={e => setForm(p => ({ ...p, newItemPrice: e.target.value }))} className="h-8 text-xs border-black/[0.10]" dir="ltr" />
          </div>
          <Button type="button" onClick={addItem} size="sm" className="bg-black text-white h-7 text-xs gap-1" disabled={!form.newItemName || !form.newItemPrice}>
            <Plus className="w-3 h-3" /> {L ? "إضافة بند" : "Add Item"}
          </Button>
        </div>
      </div>

      <div>
        <Label className="text-xs text-black/50 mb-1 block">{L ? "ملاحظات" : "Notes"}</Label>
        <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="h-16 resize-none text-sm border-black/[0.10]" placeholder={L ? "ملاحظات اختيارية..." : "Optional notes..."} />
      </div>
      {/* Quick Actions: Resend email + Download */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={async () => {
            try {
              const r = await fetch(`/api/invoices/${invoice.id}/send-email`, { method: "POST", credentials: "include" });
              const d = await r.json();
              if (r.ok) toast({ title: L ? "✅ تم إرسال الفاتورة بالبريد" : "✅ Invoice sent by email" });
              else toast({ title: d.error || (L ? "فشل الإرسال" : "Send failed"), variant: "destructive" });
            } catch { toast({ title: L ? "فشل الإرسال" : "Send failed", variant: "destructive" }); }
          }}
          className="flex items-center justify-center gap-1.5 h-9 rounded-xl border border-black/[0.12] text-xs font-semibold text-black/60 hover:bg-black/[0.04] hover:text-black transition-colors"
        >
          <Mail className="w-3.5 h-3.5" /> {L ? "إعادة إرسال" : "Resend Email"}
        </button>
        <a
          href={`/admin/invoice-print/${invoice.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 h-9 rounded-xl border border-black/[0.12] text-xs font-semibold text-black/60 hover:bg-black/[0.04] hover:text-black transition-colors"
        >
          <Printer className="w-3.5 h-3.5" /> {L ? "عرض وتحميل" : "View & Download"}
        </a>
      </div>

      <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || finalAmount <= 0}
        className="w-full bg-black text-white h-10 rounded-xl font-bold">
        {mutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : (L ? "💾 حفظ التعديلات" : "💾 Save Changes")}
      </Button>
    </div>
  );
}

export default function AdminInvoices() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      const r = await fetch("/api/invoices", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("PATCH", `/api/invoices/${id}`, { status: "paid" });
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/invoices"] }); toast({ title: L ? "تم تحديد الفاتورة كمدفوعة" : "Invoice marked as paid" }); },
    onError: () => toast({ title: L ? "حدث خطأ" : "An error occurred", variant: "destructive" }),
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("POST", `/api/invoices/${id}/send-email`, {});
      return r.json();
    },
    onSuccess: () => toast({ title: L ? "تم إرسال الفاتورة بالبريد الإلكتروني ✅" : "Invoice sent by email ✅" }),
    onError: () => toast({ title: L ? "فشل إرسال البريد" : "Email send failed", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("DELETE", `/api/invoices/${id}`, {});
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/invoices"] }); toast({ title: L ? "تم حذف الفاتورة" : "Invoice deleted" }); },
    onError: () => toast({ title: L ? "حدث خطأ" : "An error occurred", variant: "destructive" }),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("POST", `/api/invoices/${id}/duplicate`, {});
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/invoices"] }); toast({ title: L ? "تم نسخ الفاتورة ✅" : "Invoice duplicated ✅" }); },
    onError: () => toast({ title: L ? "فشل نسخ الفاتورة" : "Failed to duplicate invoice", variant: "destructive" }),
  });

  const filtered = (invoices || []).filter(inv => {
    const client = typeof inv.userId === "object" ? inv.userId : null;
    const matchSearch = !search || inv.invoiceNumber.includes(search) || client?.fullName?.includes(search) || client?.email?.includes(search);
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusColor = (s: string) => {
    if (s === "paid") return "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10";
    if (s === "cancelled") return "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10";
    return "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10";
  };

  const statusLabel = (s: string) => L ? ({ paid: "مدفوع", unpaid: "غير مدفوع", cancelled: "ملغي" }[s] || s) : ({ paid: "Paid", unpaid: "Unpaid", cancelled: "Cancelled" }[s] || s);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-black/20" />
    </div>
  );

  return (
    <div className="space-y-6 relative overflow-hidden" dir={dir}>
      <PageGraphics variant="dashboard" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black">{L ? "الفواتير" : "Invoices"}</h1>
            <p className="text-xs text-black/35">{filtered.length} {L ? "فاتورة" : "invoices"}</p>
          </div>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white h-9 rounded-xl text-sm font-bold gap-1.5" data-testid="button-new-invoice">
              <Plus className="w-4 h-4" /> {L ? "فاتورة جديدة" : "New Invoice"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" dir={dir}>
            <DialogHeader>
              <DialogTitle className="text-right font-black">{L ? "إنشاء فاتورة جديدة" : "Create New Invoice"}</DialogTitle>
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
            placeholder={L ? "بحث برقم الفاتورة أو اسم العميل..." : "Search by invoice number or client name..."}
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
              {L ? ({ all: "الكل", unpaid: "غير مدفوع", paid: "مدفوع", cancelled: "ملغي" } as any)[s] : ({ all: "All", unpaid: "Unpaid", paid: "Paid", cancelled: "Cancelled" } as any)[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-black/30">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">{L ? "لا توجد فواتير" : "No invoices"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.06] bg-black/[0.02]">
                  <th className="text-right px-4 py-3 text-xs font-semibold text-black/40">{L ? "رقم الفاتورة" : "Invoice #"}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-black/40">{L ? "العميل" : "Client"}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-black/40">{L ? "المبلغ" : "Amount"}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-black/40">{L ? "الحالة" : "Status"}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-black/40">{L ? "الاستحقاق" : "Due Date"}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-black/40">{L ? "الإجراءات" : "Actions"}</th>
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
                        <div className="font-bold text-black text-xs flex items-center gap-1">{inv.totalAmount.toLocaleString()} <SARIcon size={9} className="opacity-70" /></div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor(inv.status)}`}>
                          {statusLabel(inv.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-black/40">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString(L ? "ar-SA" : "en-US") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingInvoice(inv)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-black/[0.04] dark:bg-white/[0.06] transition-colors text-xs font-semibold"
                            data-testid={`button-edit-invoice-${inv.id}`}
                          >
                            <Pencil className="w-3 h-3" /> {L ? "تعديل" : "Edit"}
                          </button>
                          <button
                            onClick={() => duplicateMutation.mutate(inv.id)}
                            disabled={duplicateMutation.isPending}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-black/[0.04] dark:bg-white/[0.06] transition-colors text-xs font-semibold"
                            title={L ? "نسخ" : "Copy"}
                            data-testid={`button-duplicate-invoice-${inv.id}`}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setLocation(`/admin/invoice-print/${inv.id}`)}
                            className="p-1.5 rounded-lg hover:bg-black/[0.06] text-black/40 hover:text-black transition-colors"
                            title={L ? "عرض وتحميل" : "View & Download"}
                            data-testid={`button-print-${inv.id}`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => sendEmailMutation.mutate(inv.id)}
                            disabled={sendEmailMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-black/[0.04] dark:bg-white/[0.06] text-black/40 hover:text-black dark:text-white transition-colors"
                            title={L ? "إرسال بالبريد" : "Send by Email"}
                            data-testid={`button-email-${inv.id}`}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          {inv.status === "unpaid" && (
                            <button
                              onClick={() => markPaidMutation.mutate(inv.id)}
                              disabled={markPaidMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-black/[0.04] dark:bg-white/[0.06] text-black/40 hover:text-black dark:text-white transition-colors"
                              title={L ? "تحديد كمدفوع" : "Mark as Paid"}
                              data-testid={`button-paid-${inv.id}`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteMutation.mutate(inv.id)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 rounded-lg hover:bg-black/[0.04] dark:bg-white/[0.06] text-black/40 hover:text-black dark:text-white transition-colors"
                            title={L ? "حذف" : "Delete"}
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

      {/* Edit Invoice Dialog */}
      <Dialog open={!!editingInvoice} onOpenChange={(v) => { if (!v) setEditingInvoice(null); }}>
        <DialogContent className="max-w-2xl" dir={dir}>
          <DialogHeader>
            <DialogTitle className="font-black">{L ? `تعديل الفاتورة — ${editingInvoice?.invoiceNumber}` : `Edit Invoice — ${editingInvoice?.invoiceNumber}`}</DialogTitle>
          </DialogHeader>
          {editingInvoice && <EditInvoiceForm invoice={editingInvoice} onClose={() => setEditingInvoice(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
