// @ts-nocheck
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ClipboardList, Plus, Trash2, Clock3, CheckCircle2, RotateCcw,
  User2, Calendar, Loader2, ChevronDown, X, Send, Eye, Filter,
  FileText, Image as ImageIcon, Link2, Type as TypeIcon, AlertCircle,
  Paperclip, Search
} from "lucide-react";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

/* ── helpers ──────────────────────────────────────────── */
function getStatusMeta(L: boolean): Record<string, { label: string; color: string; bg: string; border: string; icon: any }> { return {
  pending:         { label: L ? "بانتظار العميل" : "Awaiting Client",  color: "text-amber-700",  bg: "bg-amber-50",    border: "border-amber-200",  icon: Clock3 },
  submitted:       { label: L ? "أُرسل من العميل" : "Submitted by Client", color: "text-blue-700",   bg: "bg-blue-50",     border: "border-blue-200",   icon: CheckCircle2 },
  approved:        { label: L ? "مقبول ✓" : "Approved ✓",         color: "text-emerald-700",bg: "bg-emerald-50",  border: "border-emerald-200",icon: CheckCircle2 },
  revision_needed: { label: L ? "تحتاج مراجعة" : "Needs Revision",   color: "text-red-700",    bg: "bg-red-50",      border: "border-red-200",    icon: RotateCcw },
}; }
function getPriorityMeta(L: boolean): Record<string, { label: string; color: string }> { return {
  low:    { label: L ? "منخفضة" : "Low",    color: "text-slate-500" },
  normal: { label: L ? "عادية" : "Normal",  color: "text-blue-600" },
  high:   { label: L ? "عالية" : "High",    color: "text-amber-600" },
  urgent: { label: L ? "عاجل 🔴" : "Urgent 🔴", color: "text-red-600" },
}; }

function fmt(d: string, L: boolean) {
  return new Date(d).toLocaleDateString(L ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" });
}

/* ── Create Dialog ──────────────────────────────────────── */
function CreateDataRequestDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const { data: users = [] } = useQuery<any[]>({ queryKey: ["/api/users/clients"] });

  const [form, setForm] = useState({
    clientId: "", title: "", description: "",
    priority: "normal", dueDate: "",
  });
  const [items, setItems] = useState<Array<{ label: string; type: string; required: boolean; hint: string; accept: string }>>([]);

  function addItem() {
    setItems(prev => [...prev, { label: "", type: "file", required: false, hint: "", accept: "" }]);
  }
  function removeItem(i: number) { setItems(prev => prev.filter((_, j) => j !== i)); }
  function updateItem(i: number, k: string, v: any) {
    setItems(prev => prev.map((x, j) => j === i ? { ...x, [k]: v } : x));
  }

  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/data-requests", {
      ...form, requestItems: items,
    }),
    onSuccess: () => {
      toast({ title: L ? "تم إنشاء الطلب" : "Request created", description: L ? "سيصل إشعار بريدي للعميل" : "An email notification will be sent to the client" });
      onCreated();
    },
    onError: () => toast({ title: L ? "خطأ" : "Error", description: L ? "لم يتم الإنشاء، تأكد من البيانات" : "Could not create, check the data", variant: "destructive" }),
  });

  const canSubmit = form.clientId && form.title && items.every(x => x.label.trim());

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[92vh]" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-gray-900 dark:text-white">{L ? "طلب بيانات جديد" : "New Data Request"}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-normal">{L ? "إرسال طلب للعميل لتزويدك بملفات أو معلومات" : "Send a request to the client to provide files or information"}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-5 px-1 pb-2">

            {/* Client selector */}
            <div>
              <Label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">{L ? "العميل *" : "Client *"}</Label>
              <Select value={form.clientId} onValueChange={v => setForm(p => ({ ...p, clientId: v }))}>
                <SelectTrigger className="h-11 rounded-xl" data-testid="select-dr-client">
                  <SelectValue placeholder={L ? "اختر العميل..." : "Select client..."} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u: any) => (
                    <SelectItem key={u.id || u._id} value={u.id || u._id}>
                      {u.fullName} (@{u.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div>
              <Label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">{L ? "عنوان الطلب *" : "Request Title *"}</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder={L ? "مثال: يرجى إرفاق شعار الشركة وهويتها البصرية" : "e.g. Please attach the company logo and brand identity"}
                className="h-11 rounded-xl" data-testid="input-dr-title" />
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">{L ? "التفاصيل" : "Details"} <span className="font-normal text-gray-300">({L ? "اختياري" : "optional"})</span></Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder={L ? "اكتب وصفاً تفصيلياً للعميل ليفهم ما المطلوب بالضبط..." : "Write a detailed description so the client understands exactly what is needed..."}
                className="resize-none rounded-xl h-20 text-sm" data-testid="textarea-dr-desc" />
            </div>

            {/* Priority + Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">{L ? "الأولوية" : "Priority"}</Label>
                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger className="h-11 rounded-xl" data-testid="select-dr-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{L ? "منخفضة" : "Low"}</SelectItem>
                    <SelectItem value="normal">{L ? "عادية" : "Normal"}</SelectItem>
                    <SelectItem value="high">{L ? "عالية ⚠️" : "High ⚠️"}</SelectItem>
                    <SelectItem value="urgent">{L ? "عاجل 🔴" : "Urgent 🔴"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">{L ? "الموعد النهائي" : "Due Date"}</Label>
                <Input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                  className="h-11 rounded-xl text-sm" data-testid="input-dr-due" />
              </div>
            </div>

            {/* Request Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-xs font-black text-gray-400 uppercase tracking-widest">{L ? "العناصر المطلوبة" : "Required Items"}</Label>
                <Button size="sm" variant="outline" className="gap-1.5 h-8 rounded-lg text-xs" onClick={addItem}
                  data-testid="button-dr-add-item">
                  <Plus className="w-3.5 h-3.5" /> {L ? "إضافة عنصر" : "Add Item"}
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input value={item.label} onChange={e => updateItem(i, "label", e.target.value)}
                        placeholder={L ? "اسم العنصر (مثال: شعار الشركة، صور المنتجات...)" : "Item name (e.g. Company logo, product images...)"}
                        className="flex-1 h-9 rounded-lg text-sm" data-testid={`input-dr-item-label-${i}`} />
                      <Select value={item.type} onValueChange={v => updateItem(i, "type", v)}>
                        <SelectTrigger className="w-28 h-9 rounded-lg text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="file">{L ? "📎 ملف" : "📎 File"}</SelectItem>
                          <SelectItem value="image">{L ? "🖼️ صورة" : "🖼️ Image"}</SelectItem>
                          <SelectItem value="text">{L ? "✏️ نص" : "✏️ Text"}</SelectItem>
                          <SelectItem value="link">{L ? "🔗 رابط" : "🔗 Link"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <button onClick={() => removeItem(i)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 text-gray-400 transition-all"
                        data-testid={`button-dr-remove-item-${i}`}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={item.required}
                          onChange={e => updateItem(i, "required", e.target.checked)}
                          className="rounded w-3.5 h-3.5 accent-cyan-500" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{L ? "مطلوب" : "Required"}</span>
                      </label>
                      <Input value={item.hint} onChange={e => updateItem(i, "hint", e.target.value)}
                        placeholder={L ? "تلميح للعميل (اختياري)..." : "Hint for client (optional)..."}
                        className="flex-1 h-8 rounded-lg text-xs" data-testid={`input-dr-item-hint-${i}`} />
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center">
                    <Paperclip className="w-8 h-8 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
                    <p className="text-xs text-gray-400 dark:text-gray-500">{L ? 'لا توجد عناصر محددة — اضغط "إضافة عنصر" لتحديد ما تحتاجه' : 'No items defined — click "Add Item" to specify what you need'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="rounded-xl h-11" onClick={onClose}>{L ? "إلغاء" : "Cancel"}</Button>
          <Button className="flex-1 bg-gradient-to-l from-cyan-500 to-blue-600 text-white font-black h-11 rounded-xl gap-2"
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            data-testid="button-dr-create">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {mutation.isPending ? (L ? "جاري الإرسال..." : "Sending...") : (L ? "إرسال الطلب للعميل" : "Send Request to Client")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── View Dialog (admin sees client response) ─────────────── */
function ViewResponseDialog({ req, onClose, onUpdated }: { req: any; onClose: () => void; onUpdated: () => void }) {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const STATUS_META = getStatusMeta(L);
  const [adminNote, setAdminNote] = useState(req.adminNote || "");

  const updateMutation = useMutation({
    mutationFn: (status: string) => apiRequest("PATCH", `/api/admin/data-requests/${req.id}`, { status, adminNote }),
    onSuccess: () => { toast({ title: L ? "تم التحديث" : "Updated" }); onUpdated(); },
    onError: () => toast({ title: L ? "خطأ" : "Error", variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/admin/data-requests/${req.id}`),
    onSuccess: () => { toast({ title: L ? "تم الحذف" : "Deleted" }); onUpdated(); },
    onError: () => toast({ title: L ? "خطأ" : "Error", variant: "destructive" }),
  });

  const meta = STATUS_META[req.status] || STATUS_META.pending;
  const StatusIcon = meta.icon;

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[92vh]" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.bg} ${meta.border} border`}>
              <StatusIcon className={`w-5 h-5 ${meta.color}`} />
            </div>
            <div>
              <p className="font-black text-gray-900 dark:text-white text-base leading-tight">{req.title}</p>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold ${meta.color}`}>{meta.label}</span>
                {req.clientId?.fullName && (
                  <span className="text-[11px] text-gray-400">• {req.clientId.fullName}</span>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-5 px-1 pb-2">

            {/* Client response */}
            {req.status === "submitted" || req.status === "approved" ? (
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{L ? "رد العميل" : "Client Response"}</p>
                <div className="space-y-3">
                  {(req.response?.items || []).map((item: any, i: number) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">{item.label}</p>
                      {item.value ? (
                        item.value.startsWith("/uploads/") || item.value.startsWith("http") ? (
                          <a href={item.value} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 text-sm font-medium hover:underline">
                            <Paperclip className="w-4 h-4" /> {L ? "فتح الملف المرفق" : "Open Attachment"}
                          </a>
                        ) : (
                          <p className="text-sm text-gray-700 dark:text-gray-300">{item.value}</p>
                        )
                      ) : (
                        <p className="text-xs text-gray-400 italic">{L ? "لم يُقدَّم" : "Not submitted"}</p>
                      )}
                    </div>
                  ))}
                  {req.response?.notes && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4">
                      <p className="text-xs font-bold text-blue-500 mb-1">{L ? "ملاحظات العميل" : "Client Notes"}</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">{req.response.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <Clock3 className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-400 dark:text-gray-500">{L ? "في انتظار رد العميل" : "Awaiting client response"}</p>
              </div>
            )}

            {/* Admin note */}
            <div>
              <Label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">{L ? "ملاحظة للعميل (اختياري)" : "Note for Client (optional)"}</Label>
              <Textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
                placeholder={L ? "مثال: الصور المرسلة تحتاج دقة أعلى..." : "e.g. The submitted images need higher resolution..."}
                className="resize-none rounded-xl text-sm h-20" data-testid="textarea-admin-note" />
            </div>

            {/* Action buttons */}
            {(req.status === "submitted") && (
              <div className="grid grid-cols-2 gap-3">
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-11 rounded-xl gap-2"
                  onClick={() => updateMutation.mutate("approved")} disabled={updateMutation.isPending}
                  data-testid="button-dr-approve">
                  <CheckCircle2 className="w-4 h-4" /> {L ? "قبول" : "Approve"}
                </Button>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-11 rounded-xl gap-2"
                  onClick={() => updateMutation.mutate("revision_needed")} disabled={updateMutation.isPending}
                  data-testid="button-dr-revise">
                  <RotateCcw className="w-4 h-4" /> {L ? "يحتاج مراجعة" : "Needs Revision"}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="rounded-xl h-11" onClick={onClose}>{L ? "إغلاق" : "Close"}</Button>
          {req.status !== "approved" && (
            <Button variant="destructive" className="rounded-xl h-11 gap-2" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}
              data-testid="button-dr-delete">
              <Trash2 className="w-4 h-4" /> {L ? "حذف" : "Delete"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page ──────────────────────────────────────────── */
export default function AdminDataRequests() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const STATUS_META = getStatusMeta(L);
  const PRIORITY_META = getPriorityMeta(L);
  const [creating, setCreating] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: requests = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/data-requests"],
  });

  const filtered = requests.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.title?.toLowerCase().includes(q) ||
        r.clientId?.fullName?.toLowerCase().includes(q) ||
        r.clientId?.username?.toLowerCase().includes(q);
    }
    return true;
  });

  const viewing = requests.find(r => r.id === viewingId);

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const submittedCount = requests.filter(r => r.status === "submitted").length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950" dir={dir}>
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">{L ? "طلبات البيانات" : "Data Requests"}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{L ? "إدارة طلبات المعلومات والملفات من العملاء" : "Manage client information and file requests"}</p>
              </div>
            </div>
            <Button
              className="bg-gradient-to-l from-cyan-500 to-blue-600 text-white font-black h-10 px-5 rounded-xl gap-2 shadow-lg shadow-cyan-500/25"
              onClick={() => setCreating(true)}
              data-testid="button-create-dr">
              <Plus className="w-4 h-4" /> {L ? "طلب جديد" : "New Request"}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { label: L ? "إجمالي الطلبات" : "Total Requests", value: requests.length, color: "text-gray-900 dark:text-white" },
              { label: L ? "بانتظار العميل" : "Awaiting Client",  value: pendingCount,    color: "text-amber-600" },
              { label: L ? "بانتظار مراجعتك" : "Awaiting Review",value: submittedCount,  color: "text-blue-600"  },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center">
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="flex-1 min-w-48 relative">
            <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-gray-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={L ? "بحث في الطلبات أو أسماء العملاء..." : "Search requests or client names..."}
              className="pr-9 h-10 rounded-xl text-sm" data-testid="input-dr-search" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 h-10 rounded-xl text-sm" data-testid="select-dr-status-filter">
              <Filter className="w-3.5 h-3.5 ml-1 text-gray-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{L ? "جميع الحالات" : "All Statuses"}</SelectItem>
              <SelectItem value="pending">{L ? "بانتظار العميل" : "Awaiting Client"}</SelectItem>
              <SelectItem value="submitted">{L ? "أُرسل من العميل" : "Submitted by Client"}</SelectItem>
              <SelectItem value="approved">{L ? "مقبول" : "Approved"}</SelectItem>
              <SelectItem value="revision_needed">{L ? "يحتاج مراجعة" : "Needs Revision"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800">
            <ClipboardList className="w-14 h-14 mx-auto mb-4 text-gray-200 dark:text-gray-700" />
            <p className="text-gray-400 dark:text-gray-500 font-medium">{L ? "لا توجد طلبات" : "No requests"}</p>
            <Button className="mt-4 gap-2" variant="outline" onClick={() => setCreating(true)}>
              <Plus className="w-4 h-4" /> {L ? "أنشئ طلباً الآن" : "Create a request now"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filtered.map((req, i) => {
                const meta = STATUS_META[req.status] || STATUS_META.pending;
                const pri  = PRIORITY_META[req.priority] || PRIORITY_META.normal;
                const StatusIcon = meta.icon;
                return (
                  <motion.div key={req.id}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => setViewingId(req.id)}
                    data-testid={`card-admin-dr-${req.id}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.border} border`}>
                        <StatusIcon className={`w-5 h-5 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-black text-gray-900 dark:text-white text-sm">{req.title}</h3>
                          <span className={`text-[10px] font-bold ${pri.color}`}>{pri.label}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}>
                            {meta.label}
                          </span>
                          {req.clientId?.fullName && (
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <User2 className="w-3 h-3" /> {req.clientId.fullName}
                            </span>
                          )}
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {fmt(req.createdAt, L)}
                          </span>
                          {req.requestItems?.length > 0 && (
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <Paperclip className="w-3 h-3" /> {req.requestItems.length} {L ? "عنصر" : "item(s)"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {req.status === "submitted" && (
                          <span className="bg-blue-500 text-white text-[10px] font-black px-2 py-1 rounded-lg animate-pulse">{L ? "جديد" : "New"}</span>
                        )}
                        <Eye className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {creating && (
        <CreateDataRequestDialog
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            queryClient.invalidateQueries({ queryKey: ["/api/admin/data-requests"] });
          }}
        />
      )}
      {viewing && (
        <ViewResponseDialog
          req={viewing}
          onClose={() => setViewingId(null)}
          onUpdated={() => {
            setViewingId(null);
            queryClient.invalidateQueries({ queryKey: ["/api/admin/data-requests"] });
          }}
        />
      )}
    </div>
  );
}
