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
import { Loader2, Plus, Printer, Mail, Trash2, X, Search, FileText, Send, Check, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useI18n } from "@/lib/i18n";

interface Client { id: string; fullName: string; email: string; username: string; }
interface QuotationItem { name: string; description?: string; qty: number; unitPrice: number; total: number; }
interface Quotation {
  id: string; quotationNumber: string;
  userId: { id: string; fullName: string; email: string; username: string } | string;
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

  const mutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/quotations", {
        userId: form.userId, title: form.title,
        items: form.items, vatRate: Number(form.vatRate),
        validUntil: form.validUntil || undefined,
        notes: form.notes, termsAndConditions: form.termsAndConditions,
      });
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/quotations"] });
      toast({ title: L ? "تم إنشاء عرض السعر بنجاح" : "Quotation created successfully" });
      onClose();
    },
    onError: () => toast({ title: L ? "فشل إنشاء العرض" : "Failed to create quotation", variant: "destructive" }),
  });

  return (
    <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1" dir={dir}>
      <div>
        <Label className="text-xs text-black/50 mb-1 block">{L ? "العميل *" : "Client *"}</Label>
        <Select value={form.userId} onValueChange={v => setForm(p => ({ ...p, userId: v }))}>
          <SelectTrigger className="h-9 text-sm border-black/[0.10]" data-testid="select-quotation-client">
            <SelectValue placeholder={L ? "اختر العميل" : "Select client"} />
          </SelectTrigger>
          <SelectContent>
            {(clients || []).map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.fullName || c.username} — {c.email}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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

      <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.userId || form.items.length === 0}
        className="w-full bg-black text-white h-10" data-testid="button-create-quotation">
        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (L ? "إنشاء عرض السعر" : "Create Quotation")}
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
              const st = STATUS_LABELS[q.status] || { label: q.status, color: "bg-gray-100 text-gray-600" };
              return (
                <div key={q.id} className="border border-black/[0.08] rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-black/[0.01] transition-colors"
                  data-testid={`quotation-row-${q.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-black text-black font-mono text-sm">{q.quotationNumber}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      {q.title && <span className="text-sm text-black/60 truncate">{q.title}</span>}
                    </div>
                    <div className="text-xs text-black/40 mt-1 flex items-center gap-3 flex-wrap">
                      <span>{client?.fullName || client?.username || "—"} · {client?.email || "—"}</span>
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
                        useExternal: !client?.email,
                        externalEmail: "",
                        externalName: "",
                        companyName: "",
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
    </div>
  );
}
