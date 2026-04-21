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
import { Loader2, Plus, Printer, Mail, Trash2, X, Search, FileText, Send, Check, XCircle, Pencil, Copy } from "lucide-react";
import { useLocation } from "wouter";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useI18n } from "@/lib/i18n";

interface Client { id: string; fullName: string; email: string; username: string; }
interface QuotationItem { name: string; description?: string; qty: number; unitPrice: number; total: number; }
interface Quotation {
  id: string; quotationNumber: string;
  userId: { id: string; fullName: string; email: string; username: string } | string | null;
  externalName?: string; externalEmail?: string; externalCompany?: string;
  orderId?: string;
  title: string; items: QuotationItem[];
  amount: number; vatRate: number; vatAmount: number; totalAmount: number;
  validUntil?: string; status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  notes?: string; termsAndConditions?: string; createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "مسودة", color: "bg-black/10 text-black/60" },
  sent: { label: "مُرسل", color: "bg-blue-100 text-blue-700" },
  accepted: { label: "مقبول", color: "bg-green-100 text-green-700" },
  rejected: { label: "مرفوض", color: "bg-red-100 text-red-700" },
  expired: { label: "منتهي", color: "bg-orange-100 text-orange-700" },
};

function QuotationForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const qc = useQueryClient();
  const [clientMode, setClientMode] = useState<"registered" | "external">("registered");

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/users/clients"],
    queryFn: async () => {
      const r = await fetch("/api/users/clients", { credentials: "include" });
      if (!r.ok) return [];
      const data = await r.json();
      return Array.isArray(data) ? data : data.users || [];
    },
  });

  const [form, setForm] = useState({
    userId: "", title: "", vatRate: "15", validUntil: "", notes: "", termsAndConditions: "",
    externalName: "", externalEmail: "", externalCompany: "",
    items: [] as QuotationItem[],
    newName: "", newDesc: "", newQty: "1", newPrice: "",
  });

  const addItem = () => {
    if (!form.newName || !form.newPrice) return;
    const qty = Number(form.newQty) || 1;
    const unitPrice = Number(form.newPrice);
    const total = qty * unitPrice;
    setForm(p => ({
      ...p, items: [...p.items, { name: p.newName, description: p.newDesc, qty, unitPrice, total }],
      newName: "", newDesc: "", newQty: "1", newPrice: "",
    }));
  };

  const removeItem = (i: number) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  const subtotal = form.items.reduce((s, i) => s + i.total, 0);
  const vatAmt = Math.round(subtotal * (Number(form.vatRate) / 100) * 100) / 100;
  const total = subtotal + vatAmt;

  const isValid = form.items.length > 0 &&
    (clientMode === "registered" ? !!form.userId : (!!form.externalName && !!form.externalEmail));

  const mutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, any> = {
        title: form.title, items: form.items, vatRate: Number(form.vatRate),
        validUntil: form.validUntil || undefined,
        notes: form.notes, termsAndConditions: form.termsAndConditions,
      };
      if (clientMode === "registered") {
        body.userId = form.userId;
      } else {
        body.externalName = form.externalName;
        body.externalEmail = form.externalEmail;
        body.externalCompany = form.externalCompany;
      }
      const r = await apiRequest("POST", "/api/quotations", body);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/quotations"] });
      toast({ title: L ? "تم إنشاء عرض السعر بنجاح" : "Quotation created successfully" });
      onClose();
    },
    onError: (err: any) => toast({ title: err?.message || (L ? "فشل إنشاء العرض" : "Failed to create quotation"), variant: "destructive" }),
  });

  return (
    <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1" dir={dir}>
      {/* Client mode toggle */}
      <div>
        <Label className="text-xs text-black/50 mb-2 block">{L ? "نوع العميل *" : "Client Type *"}</Label>
        <div className="flex gap-2">
          <button type="button"
            onClick={() => setClientMode("registered")}
            className={`flex-1 text-xs rounded-lg border px-3 py-2 text-right transition-colors ${clientMode === "registered" ? "border-black bg-black text-white" : "border-black/10 text-black/60 hover:border-black/20"}`}
            data-testid="button-client-registered">
            <div className="font-bold">{L ? "عميل مسجّل" : "Registered Client"}</div>
            <div className="opacity-70 text-[11px]">{L ? "من قائمة العملاء" : "From client list"}</div>
          </button>
          <button type="button"
            onClick={() => setClientMode("external")}
            className={`flex-1 text-xs rounded-lg border px-3 py-2 text-right transition-colors ${clientMode === "external" ? "border-black bg-black text-white" : "border-black/10 text-black/60 hover:border-black/20"}`}
            data-testid="button-client-external">
            <div className="font-bold">{L ? "عميل خارجي" : "External Client"}</div>
            <div className="opacity-70 text-[11px]">{L ? "بريد إلكتروني جديد" : "New / external email"}</div>
          </button>
        </div>
      </div>

      {clientMode === "registered" ? (
        <div>
          <Label className="text-xs text-black/50 mb-1 block">{L ? "اختر العميل" : "Select Client"} *</Label>
          <Select value={form.userId} onValueChange={v => setForm(p => ({ ...p, userId: v }))}>
            <SelectTrigger className="h-9 text-sm border-black/[0.10]" data-testid="select-quotation-client">
              <SelectValue placeholder={L ? "اختر من القائمة" : "Select from list"} />
            </SelectTrigger>
            <SelectContent>
              {(clients || []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.fullName || c.username} — {c.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-black/50 mb-1 block">{L ? "الاسم *" : "Name *"}</Label>
              <Input value={form.externalName} onChange={e => setForm(p => ({ ...p, externalName: e.target.value }))}
                placeholder={L ? "اسم العميل" : "Client name"}
                className="h-9 text-sm border-black/[0.10]" data-testid="input-external-client-name" />
            </div>
            <div>
              <Label className="text-xs text-black/50 mb-1 block">{L ? "الشركة" : "Company"}</Label>
              <Input value={form.externalCompany} onChange={e => setForm(p => ({ ...p, externalCompany: e.target.value }))}
                placeholder={L ? "اسم الشركة" : "Company name"}
                className="h-9 text-sm border-black/[0.10]" data-testid="input-external-company" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-black/50 mb-1 block">{L ? "البريد الإلكتروني *" : "Email *"}</Label>
            <Input type="email" value={form.externalEmail} onChange={e => setForm(p => ({ ...p, externalEmail: e.target.value }))}
              placeholder="client@company.com"
              className="h-9 text-sm border-black/[0.10]" dir="ltr" data-testid="input-external-email" />
          </div>
        </div>
      )}

      <div>
        <Label className="text-xs text-black/50 mb-1 block">{L ? "عنوان العرض" : "Quotation Title"}</Label>
        <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          placeholder={L ? "مثال: تطوير موقع إلكتروني" : "e.g. Website Development"}
          className="h-9 text-sm border-black/[0.10]" data-testid="input-quotation-title" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-black/50 mb-1 block">{L ? "نسبة ضريبة القيمة المضافة %" : "VAT Rate %"}</Label>
          <Input type="number" value={form.vatRate} onChange={e => setForm(p => ({ ...p, vatRate: e.target.value }))}
            className="h-9 text-sm border-black/[0.10]" dir="ltr" data-testid="input-quotation-vat" />
        </div>
        <div>
          <Label className="text-xs text-black/50 mb-1 block">{L ? "صالح حتى" : "Valid Until"}</Label>
          <Input type="date" value={form.validUntil} onChange={e => setForm(p => ({ ...p, validUntil: e.target.value }))}
            className="h-9 text-sm border-black/[0.10]" dir="ltr" data-testid="input-quotation-valid-until" />
        </div>
      </div>

      <div>
        <Label className="text-xs text-black/50 mb-2 block">{L ? "بنود العرض" : "Quotation Items"}</Label>
        <div className="grid grid-cols-12 gap-2 mb-2">
          <Input placeholder={L ? "اسم البند *" : "Item name *"} value={form.newName}
            onChange={e => setForm(p => ({ ...p, newName: e.target.value }))}
            className="col-span-4 h-8 text-xs border-black/[0.10]" data-testid="input-item-name" />
          <Input placeholder={L ? "وصف" : "Desc"} value={form.newDesc}
            onChange={e => setForm(p => ({ ...p, newDesc: e.target.value }))}
            className="col-span-3 h-8 text-xs border-black/[0.10]" />
          <Input placeholder={L ? "الكمية" : "Qty"} type="number" value={form.newQty}
            onChange={e => setForm(p => ({ ...p, newQty: e.target.value }))}
            className="col-span-2 h-8 text-xs border-black/[0.10]" dir="ltr" />
          <Input placeholder={L ? "السعر" : "Price"} type="number" value={form.newPrice}
            onChange={e => setForm(p => ({ ...p, newPrice: e.target.value }))}
            className="col-span-2 h-8 text-xs border-black/[0.10]" dir="ltr" />
          <Button type="button" onClick={addItem} size="sm"
            className="col-span-1 bg-black text-white h-8 px-2" disabled={!form.newName || !form.newPrice}
            data-testid="button-add-item">
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        {form.items.length > 0 && (
          <div className="space-y-1.5 mb-2">
            {form.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-black/[0.02] rounded-lg px-3 py-2 border border-black/[0.06]">
                <div>
                  <span className="text-xs text-black/70 font-bold">{item.name}</span>
                  <span className="text-xs text-black/40 mr-2">× {item.qty} × {item.unitPrice.toLocaleString()}</span>
                  {item.description && <span className="text-xs text-black/30 block">{item.description}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-black flex items-center gap-1">
                    {item.total.toLocaleString()} <SARIcon size={10} className="opacity-70" />
                  </span>
                  <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            <div className="text-xs text-black/50 space-y-0.5 px-3 pt-1 border-t border-black/[0.06]">
              <div className="flex justify-between"><span>{L ? "المجموع الفرعي" : "Subtotal"}</span><span className="font-bold">{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>{L ? `ضريبة (${form.vatRate}%)` : `VAT (${form.vatRate}%)`}</span><span className="font-bold">{vatAmt.toLocaleString()}</span></div>
              <div className="flex justify-between text-black font-black text-sm border-t border-black/[0.10] pt-1">
                <span>{L ? "الإجمالي" : "Total"}</span>
                <span className="flex items-center gap-1">{total.toLocaleString()} <SARIcon size={10} /></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <Label className="text-xs text-black/50 mb-1 block">{L ? "ملاحظات" : "Notes"}</Label>
        <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          rows={2} className="text-sm border-black/[0.10] resize-none" data-testid="textarea-quotation-notes" />
      </div>
      <div>
        <Label className="text-xs text-black/50 mb-1 block">{L ? "الشروط والأحكام" : "Terms & Conditions"}</Label>
        <Textarea value={form.termsAndConditions} onChange={e => setForm(p => ({ ...p, termsAndConditions: e.target.value }))}
          rows={2} className="text-sm border-black/[0.10] resize-none" data-testid="textarea-quotation-terms" />
      </div>

      <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !isValid}
        className="w-full bg-black text-white h-10" data-testid="button-create-quotation">
        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (L ? "إنشاء عرض السعر" : "Create Quotation")}
      </Button>
    </div>
  );
}

function EditQuotationForm({ quotation, onClose }: { quotation: Quotation; onClose: () => void }) {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const qc = useQueryClient();

  const [form, setForm] = useState({
    title: quotation.title || "",
    vatRate: String(quotation.vatRate ?? 15),
    validUntil: quotation.validUntil ? new Date(quotation.validUntil).toISOString().split("T")[0] : "",
    notes: quotation.notes || "",
    termsAndConditions: quotation.termsAndConditions || "",
    items: (quotation.items || []) as QuotationItem[],
    newName: "", newDesc: "", newQty: "1", newPrice: "",
  });

  // Inline item editing state
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editBuf, setEditBuf] = useState({ name: "", desc: "", qty: "1", unitPrice: "" });

  const startEdit = (i: number) => {
    const it = form.items[i];
    setEditBuf({ name: it.name, desc: it.description || "", qty: String(it.qty), unitPrice: String(it.unitPrice) });
    setEditingIdx(i);
  };
  const saveEdit = () => {
    if (editingIdx === null) return;
    const qty = Number(editBuf.qty) || 1;
    const unitPrice = Number(editBuf.unitPrice) || 0;
    const total = qty * unitPrice;
    setForm(p => ({
      ...p,
      items: p.items.map((it, idx) => idx === editingIdx ? { ...it, name: editBuf.name, description: editBuf.desc, qty, unitPrice, total } : it),
    }));
    setEditingIdx(null);
  };
  const cancelEdit = () => setEditingIdx(null);

  const addItem = () => {
    if (!form.newName || !form.newPrice) return;
    const qty = Number(form.newQty) || 1;
    const unitPrice = Number(form.newPrice);
    const total = qty * unitPrice;
    setForm(p => ({ ...p, items: [...p.items, { name: p.newName, description: p.newDesc, qty, unitPrice, total }], newName: "", newDesc: "", newQty: "1", newPrice: "" }));
  };

  const removeItem = (i: number) => {
    if (editingIdx === i) setEditingIdx(null);
    setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  };

  const subtotal = form.items.reduce((s, i) => s + i.total, 0);
  const vatAmt = Math.round(subtotal * (Number(form.vatRate) / 100) * 100) / 100;
  const total = subtotal + vatAmt;

  const mutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PATCH", `/api/quotations/${quotation.id}`, {
        title: form.title, items: form.items, vatRate: Number(form.vatRate),
        validUntil: form.validUntil || undefined,
        notes: form.notes, termsAndConditions: form.termsAndConditions,
      });
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/quotations"] });
      toast({ title: L ? "تم تحديث العرض بنجاح ✅" : "Quotation updated successfully ✅" });
      onClose();
    },
    onError: () => toast({ title: L ? "فشل تحديث العرض" : "Failed to update quotation", variant: "destructive" }),
  });

  return (
    <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1" dir={dir}>
      <div>
        <Label className="text-xs text-black/50 mb-1 block">{L ? "عنوان العرض" : "Title"}</Label>
        <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="h-9 text-sm border-black/[0.10]" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-black/50 mb-1 block">{L ? "ضريبة القيمة المضافة %" : "VAT Rate %"}</Label>
          <Input type="number" value={form.vatRate} onChange={e => setForm(p => ({ ...p, vatRate: e.target.value }))} className="h-9 text-sm border-black/[0.10]" dir="ltr" />
        </div>
        <div>
          <Label className="text-xs text-black/50 mb-1 block">{L ? "صالح حتى" : "Valid Until"}</Label>
          <Input type="date" value={form.validUntil} onChange={e => setForm(p => ({ ...p, validUntil: e.target.value }))} className="h-9 text-sm border-black/[0.10]" dir="ltr" />
        </div>
      </div>

      {/* ── Items ── */}
      <div>
        <Label className="text-xs text-black/50 mb-2 block font-semibold">{L ? "بنود العرض" : "Line Items"} ({form.items.length})</Label>

        {/* Existing items with inline edit */}
        {form.items.length > 0 && (
          <div className="space-y-2 mb-3">
            {form.items.map((item, i) => (
              editingIdx === i ? (
                /* ── Edit mode row ── */
                <div key={i} className="bg-violet-50 border border-violet-200 rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-12 gap-2">
                    <Input value={editBuf.name} onChange={e => setEditBuf(p => ({ ...p, name: e.target.value }))} placeholder={L ? "اسم البند *" : "Name *"} className="col-span-5 h-8 text-xs border-violet-300 focus:border-violet-500" />
                    <Input value={editBuf.desc} onChange={e => setEditBuf(p => ({ ...p, desc: e.target.value }))} placeholder={L ? "وصف" : "Desc"} className="col-span-3 h-8 text-xs border-violet-300" />
                    <Input type="number" value={editBuf.qty} onChange={e => setEditBuf(p => ({ ...p, qty: e.target.value }))} placeholder="Qty" className="col-span-2 h-8 text-xs border-violet-300" dir="ltr" />
                    <Input type="number" value={editBuf.unitPrice} onChange={e => setEditBuf(p => ({ ...p, unitPrice: e.target.value }))} placeholder={L ? "السعر" : "Price"} className="col-span-2 h-8 text-xs border-violet-300" dir="ltr" />
                  </div>
                  {editBuf.unitPrice && (
                    <p className="text-[11px] text-violet-600 font-bold px-1">
                      {L ? "الإجمالي:" : "Total:"} {((Number(editBuf.qty) || 1) * (Number(editBuf.unitPrice) || 0)).toLocaleString()} {L ? "ر.س" : "SAR"}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button type="button" onClick={saveEdit} size="sm" className="bg-violet-600 hover:bg-violet-700 text-white h-7 text-xs px-3 gap-1" disabled={!editBuf.name || !editBuf.unitPrice}>
                      <Check className="w-3 h-3" /> {L ? "حفظ" : "Save"}
                    </Button>
                    <Button type="button" onClick={cancelEdit} size="sm" variant="outline" className="h-7 text-xs px-3 border-violet-200">
                      <X className="w-3 h-3" /> {L ? "إلغاء" : "Cancel"}
                    </Button>
                  </div>
                </div>
              ) : (
                /* ── View mode row ── */
                <div key={i} className="group flex items-center justify-between bg-black/[0.02] hover:bg-violet-50/60 rounded-xl px-3 py-2.5 border border-black/[0.06] hover:border-violet-200 transition-all">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-black font-semibold">{item.name}</span>
                    {item.description && <span className="text-[10px] text-black/40 mr-2">{item.description}</span>}
                    <span className="text-[10px] text-black/40 mr-2 font-mono">× {item.qty} × {item.unitPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-black flex items-center gap-1">{item.total.toLocaleString()} <SARIcon size={10} className="opacity-60" /></span>
                    <button onClick={() => startEdit(i)} className="opacity-0 group-hover:opacity-100 text-violet-500 hover:text-violet-700 transition-all p-1 rounded-lg hover:bg-violet-100" title={L ? "تعديل البند" : "Edit item"}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => removeItem(i)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1 rounded-lg hover:bg-red-50">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            ))}
            {/* Totals */}
            <div className="text-xs text-black/50 space-y-0.5 px-3 pt-2 border-t border-black/[0.06]">
              <div className="flex justify-between"><span>{L ? "المجموع الفرعي" : "Subtotal"}</span><span className="font-bold">{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>{L ? `ضريبة (${form.vatRate}%)` : `VAT (${form.vatRate}%)`}</span><span className="font-bold">{vatAmt.toLocaleString()}</span></div>
              <div className="flex justify-between text-black font-black text-sm border-t border-black/[0.10] pt-1.5 mt-1">
                <span>{L ? "الإجمالي" : "Total"}</span>
                <span className="flex items-center gap-1">{total.toLocaleString()} <SARIcon size={10} /></span>
              </div>
            </div>
          </div>
        )}

        {/* Add new item row */}
        <div className="bg-black/[0.01] border border-dashed border-black/[0.12] rounded-xl p-3">
          <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wide mb-2">{L ? "إضافة بند جديد" : "Add New Item"}</p>
          <div className="grid grid-cols-12 gap-2">
            <Input placeholder={L ? "اسم البند *" : "Item name *"} value={form.newName} onChange={e => setForm(p => ({ ...p, newName: e.target.value }))} className="col-span-4 h-8 text-xs border-black/[0.10]" />
            <Input placeholder={L ? "وصف" : "Desc"} value={form.newDesc} onChange={e => setForm(p => ({ ...p, newDesc: e.target.value }))} className="col-span-3 h-8 text-xs border-black/[0.10]" />
            <Input placeholder={L ? "الكمية" : "Qty"} type="number" value={form.newQty} onChange={e => setForm(p => ({ ...p, newQty: e.target.value }))} className="col-span-2 h-8 text-xs border-black/[0.10]" dir="ltr" />
            <Input placeholder={L ? "السعر" : "Price"} type="number" value={form.newPrice} onChange={e => setForm(p => ({ ...p, newPrice: e.target.value }))} className="col-span-2 h-8 text-xs border-black/[0.10]" dir="ltr" />
            <Button type="button" onClick={addItem} size="sm" className="col-span-1 bg-black text-white h-8 px-2" disabled={!form.newName || !form.newPrice}><Plus className="w-3 h-3" /></Button>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-xs text-black/50 mb-1 block">{L ? "ملاحظات" : "Notes"}</Label>
        <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="text-sm border-black/[0.10] resize-none" />
      </div>
      <div>
        <Label className="text-xs text-black/50 mb-1 block">{L ? "الشروط والأحكام" : "Terms & Conditions"}</Label>
        <Textarea value={form.termsAndConditions} onChange={e => setForm(p => ({ ...p, termsAndConditions: e.target.value }))} rows={2} className="text-sm border-black/[0.10] resize-none" />
      </div>
      <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}
        className="w-full bg-black text-white h-10 font-bold">
        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (L ? "💾 حفظ التعديلات" : "💾 Save Changes")}
      </Button>
    </div>
  );
}

interface SendEmailState {
  quotationId: string;
  clientEmail?: string;
  clientName?: string;
  useExternal: boolean;
  externalEmail: string;
  externalName: string;
  companyName: string;
}

export default function AdminQuotations() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [emailDialog, setEmailDialog] = useState<SendEmailState | null>(null);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);

  const { data: quotations, isLoading } = useQuery<Quotation[]>({ queryKey: ["/api/quotations"] });

  const emailMutation = useMutation({
    mutationFn: async (state: SendEmailState) => {
      const body: Record<string, string> = {};
      if (state.useExternal) {
        if (state.externalEmail) body.externalEmail = state.externalEmail;
        if (state.externalName) body.externalName = state.externalName;
        if (state.companyName) body.companyName = state.companyName;
      }
      const r = await apiRequest("POST", `/api/quotations/${state.quotationId}/send-email`, body);
      return r.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/quotations"] });
      setEmailDialog(null);
      toast({ title: data?.message || (L ? "تم إرسال العرض بالبريد ✅" : "Quotation emailed ✅") });
    },
    onError: () => toast({ title: L ? "فشل إرسال البريد" : "Email failed", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("DELETE", `/api/quotations/${id}`, undefined);
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/quotations"] });
      toast({ title: L ? "تم حذف العرض" : "Quotation deleted" });
    },
    onError: () => toast({ title: L ? "فشل الحذف" : "Delete failed", variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const r = await apiRequest("PATCH", `/api/quotations/${id}`, { status });
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/quotations"] }),
    onError: () => toast({ title: L ? "فشل التحديث" : "Update failed", variant: "destructive" }),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("POST", `/api/quotations/${id}/duplicate`, {});
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/quotations"] }); toast({ title: L ? "تم نسخ العرض ✅" : "Quotation duplicated ✅" }); },
    onError: () => toast({ title: L ? "فشل نسخ العرض" : "Failed to duplicate", variant: "destructive" }),
  });

  const filtered = (quotations || []).filter(q => {
    const client = typeof q.userId === "object" ? q.userId : null;
    const matchSearch = !search ||
      q.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.title?.toLowerCase().includes(search.toLowerCase()) ||
      client?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      client?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-white" dir={dir}>
      <PageGraphics variant="minimal" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-black">{L ? "عروض الأسعار" : "Quotations"}</h1>
            <p className="text-black/40 text-sm mt-1">{L ? "إنشاء وإدارة عروض الأسعار للعملاء" : "Create and manage client quotations"}</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black text-white gap-2 h-9 text-sm" data-testid="button-new-quotation">
                <Plus className="w-4 h-4" /> {L ? "عرض جديد" : "New Quotation"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" dir={dir}>
              <DialogHeader>
                <DialogTitle>{L ? "إنشاء عرض سعر جديد" : "Create New Quotation"}</DialogTitle>
              </DialogHeader>
              <QuotationForm onClose={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={L ? "بحث..." : "Search..."}
              className="pr-9 h-9 text-sm border-black/[0.10]" data-testid="input-search-quotations" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-40 text-sm border-black/[0.10]" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{L ? "جميع الحالات" : "All statuses"}</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-black/30" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-black/15 mx-auto mb-3" />
            <p className="text-black/30 text-sm">{L ? "لا توجد عروض أسعار" : "No quotations yet"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(q => {
              const client = typeof q.userId === "object" ? q.userId : null;
              const clientName = (q as any).externalName || client?.fullName || client?.username || "—";
              const clientEmail = (q as any).externalEmail || client?.email || "—";
              const isExternal = !!(q as any).externalEmail && !client;
              const st = STATUS_LABELS[q.status] || { label: q.status, color: "bg-gray-100 text-gray-600" };
              return (
                <div key={q.id} className="border border-black/[0.08] rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-black/[0.01] transition-colors"
                  data-testid={`quotation-row-${q.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-black text-black font-mono text-sm">{q.quotationNumber}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      {isExternal && <span className="text-[10px] bg-orange-50 text-orange-500 border border-orange-100 px-1.5 py-0.5 rounded">خارجي</span>}
                      {(q as any).orderId && <span className="text-[10px] bg-green-50 text-green-600 border border-green-100 px-1.5 py-0.5 rounded">✓ طلب</span>}
                      {q.title && <span className="text-sm text-black/60 truncate">{q.title}</span>}
                    </div>
                    <div className="text-xs text-black/40 mt-1 flex items-center gap-3 flex-wrap">
                      <span>{clientName} · {clientEmail}</span>
                      {(q as any).externalCompany && <span className="text-black/30">{(q as any).externalCompany}</span>}
                      {q.validUntil && (
                        <span>صالح حتى: {new Date(q.validUntil).toLocaleDateString("ar-SA")}</span>
                      )}
                      <span>{new Date(q.createdAt).toLocaleDateString("ar-SA")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-left">
                      <div className="text-sm font-black text-black flex items-center gap-1">
                        {q.totalAmount?.toLocaleString()} <SARIcon size={11} className="opacity-70" />
                      </div>
                      {q.vatRate > 0 && <div className="text-xs text-black/30">شامل ضريبة {q.vatRate}%</div>}
                    </div>
                    <Button size="sm" variant="outline"
                      className="h-8 text-xs gap-1 border-violet-100 text-violet-600 hover:bg-violet-50"
                      onClick={() => setEditingQuotation(q)}
                      data-testid={`button-edit-quotation-${q.id}`}>
                      <Pencil className="w-3 h-3" /> {L ? "تعديل" : "Edit"}
                    </Button>
                    <Button size="sm" variant="outline"
                      className="h-8 text-xs gap-1 border-cyan-100 text-cyan-600 hover:bg-cyan-50"
                      onClick={() => duplicateMutation.mutate(q.id)}
                      disabled={duplicateMutation.isPending}
                      data-testid={`button-duplicate-quotation-${q.id}`}>
                      <Copy className="w-3 h-3" /> {L ? "نسخ" : "Copy"}
                    </Button>
                    {q.status === "draft" && (
                      <Button size="sm" variant="outline"
                        className="h-8 text-xs gap-1 border-black/[0.12]"
                        onClick={() => statusMutation.mutate({ id: q.id, status: "sent" })}
                        disabled={statusMutation.isPending}
                        data-testid={`button-mark-sent-${q.id}`}>
                        <Send className="w-3 h-3" /> {L ? "تحديث لمُرسل" : "Mark Sent"}
                      </Button>
                    )}
                    <Button size="sm" variant="outline"
                      className="h-8 text-xs gap-1 border-black/[0.12]"
                      onClick={() => setEmailDialog({
                        quotationId: q.id,
                        clientEmail: client?.email,
                        clientName: client?.fullName || client?.username,
                        useExternal: isExternal || !client?.email,
                        externalEmail: q.externalEmail || "",
                        externalName: q.externalName || "",
                        companyName: q.externalCompany || "",
                      })}
                      data-testid={`button-email-quotation-${q.id}`}>
                      <Mail className="w-3 h-3" /> {L ? "إرسال" : "Email"}
                    </Button>
                    <Button size="sm" variant="outline"
                      className="h-8 text-xs gap-1 border-black/[0.12]"
                      onClick={() => setLocation(`/admin/quotation-print/${q.id}`)}
                      data-testid={`button-print-quotation-${q.id}`}>
                      <Printer className="w-3 h-3" /> {L ? "طباعة" : "Print"}
                    </Button>
                    <Button size="sm" variant="outline"
                      className="h-8 text-xs gap-1 border-red-100 text-red-500 hover:bg-red-50"
                      onClick={() => { if (confirm(L ? "هل تريد حذف هذا العرض؟" : "Delete this quotation?")) deleteMutation.mutate(q.id); }}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-quotation-${q.id}`}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Send Email Dialog */}
      <Dialog open={!!emailDialog} onOpenChange={(v) => { if (!v) setEmailDialog(null); }}>
        <DialogContent className="max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {L ? "إرسال عرض السعر بالبريد" : "Send Quotation by Email"}
            </DialogTitle>
          </DialogHeader>
          {emailDialog && (
            <div className="space-y-4 pt-2">
              {emailDialog.clientEmail && (
                <div className="space-y-2">
                  <p className="text-xs text-black/50">{L ? "الإرسال إلى:" : "Sending to:"}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEmailDialog(s => s ? { ...s, useExternal: false } : s)}
                      className={`flex-1 text-xs rounded-lg border px-3 py-2 text-right transition-colors ${!emailDialog.useExternal ? "border-black bg-black text-white" : "border-black/10 text-black/60 hover:border-black/20"}`}
                      data-testid="button-send-to-client">
                      <div className="font-bold">{emailDialog.clientName || "—"}</div>
                      <div className="opacity-70">{emailDialog.clientEmail}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailDialog(s => s ? { ...s, useExternal: true } : s)}
                      className={`flex-1 text-xs rounded-lg border px-3 py-2 text-right transition-colors ${emailDialog.useExternal ? "border-black bg-black text-white" : "border-black/10 text-black/60 hover:border-black/20"}`}
                      data-testid="button-send-to-external">
                      <div className="font-bold">{L ? "بريد آخر" : "Other Email"}</div>
                      <div className="opacity-70">{L ? "عميل خارجي" : "External recipient"}</div>
                    </button>
                  </div>
                </div>
              )}

              {emailDialog.useExternal && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{L ? "الاسم" : "Name"} *</Label>
                    <Input
                      placeholder={L ? "اسم المستلم" : "Recipient name"}
                      value={emailDialog.externalName}
                      onChange={e => setEmailDialog(s => s ? { ...s, externalName: e.target.value } : s)}
                      className="h-9 text-sm border-black/10"
                      data-testid="input-external-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{L ? "البريد الإلكتروني" : "Email"} *</Label>
                    <Input
                      type="email"
                      placeholder="example@company.com"
                      value={emailDialog.externalEmail}
                      onChange={e => setEmailDialog(s => s ? { ...s, externalEmail: e.target.value } : s)}
                      className="h-9 text-sm border-black/10"
                      data-testid="input-external-email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{L ? "اسم الشركة (اختياري)" : "Company (optional)"}</Label>
                    <Input
                      placeholder={L ? "اسم الشركة أو المنشأة" : "Company name"}
                      value={emailDialog.companyName}
                      onChange={e => setEmailDialog(s => s ? { ...s, companyName: e.target.value } : s)}
                      className="h-9 text-sm border-black/10"
                      data-testid="input-company-name"
                    />
                  </div>
                </div>
              )}

              <div className="bg-black/[0.03] rounded-lg px-3 py-2 text-xs text-black/50 flex items-start gap-2">
                <span>📎</span>
                <span>{L ? "سيتم إرفاق ملف PDF للعرض تلقائياً مع البريد الإلكتروني." : "A PDF of the quotation will be automatically attached to the email."}</span>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  className="flex-1 bg-black text-white h-9 text-sm gap-2"
                  disabled={emailMutation.isPending || (emailDialog.useExternal && (!emailDialog.externalEmail || !emailDialog.externalName))}
                  onClick={() => emailMutation.mutate(emailDialog)}
                  data-testid="button-confirm-send-email">
                  {emailMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {L ? "إرسال الآن" : "Send Now"}
                </Button>
                <Button variant="outline" className="h-9 border-black/10" onClick={() => setEmailDialog(null)}
                  data-testid="button-cancel-email">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Quotation Dialog */}
      <Dialog open={!!editingQuotation} onOpenChange={(v) => { if (!v) setEditingQuotation(null); }}>
        <DialogContent className="max-w-2xl" dir={dir}>
          <DialogHeader>
            <DialogTitle>{L ? `تعديل عرض — ${editingQuotation?.quotationNumber}` : `Edit Quotation — ${editingQuotation?.quotationNumber}`}</DialogTitle>
          </DialogHeader>
          {editingQuotation && <EditQuotationForm quotation={editingQuotation} onClose={() => setEditingQuotation(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
