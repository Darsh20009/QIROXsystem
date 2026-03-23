import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, Phone, Mail, Building2, Calendar, Clock, CheckCircle2, XCircle, MessageSquare, Trash2, Search, Filter, TrendingUp, Users, AlertCircle, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type SwitchReminder = {
  id: string;
  name: string;
  phone: string;
  email: string;
  currentProvider: string;
  serviceType: string;
  subscriptionEndDate: string;
  notes: string;
  status: "pending" | "contacted" | "converted" | "not_interested";
  adminNotes: string;
  contactedAt: string | null;
  createdAt: string;
};

function getStatusMap(L: boolean) { return {
  pending:        { label: L ? "جديد" : "New", color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  contacted:      { label: L ? "تم التواصل" : "Contacted", color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  converted:      { label: L ? "تحوّل لعميل" : "Converted", color: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500" },
  not_interested: { label: L ? "غير مهتم" : "Not Interested", color: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" },
};
}

function getServiceLabels(L: boolean): Record<string, string> { return L ? {
  website: "موقع إلكتروني", ecommerce: "متجر إلكتروني", app: "تطبيق جوال",
  erp: "ERP / إدارة", pos: "نقطة بيع", crm: "CRM", design: "تصميم وهوية",
  marketing: "تسويق رقمي", hosting: "استضافة", other: "أخرى",
} : {
  website: "Website", ecommerce: "E-commerce", app: "Mobile App",
  erp: "ERP / Management", pos: "POS", crm: "CRM", design: "Design & Identity",
  marketing: "Digital Marketing", hosting: "Hosting", other: "Other",
};
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number) {
  if (days <= 7) return "text-red-600 bg-red-50 border-red-200";
  if (days <= 30) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-green-600 bg-green-50 border-green-200";
}

export default function AdminSwitchReminders() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const STATUS_MAP = getStatusMap(L);
  const SERVICE_LABELS = getServiceLabels(L);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SwitchReminder | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const { data: reminders = [], isLoading } = useQuery<SwitchReminder[]>({
    queryKey: ["/api/admin/switch-reminders", statusFilter],
    queryFn: async () => {
      const url = statusFilter === "all" ? "/api/admin/switch-reminders" : `/api/admin/switch-reminders?status=${statusFilter}`;
      const res = await fetch(url, { credentials: "include" });
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status?: string; adminNotes?: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/switch-reminders/${id}`, { status, adminNotes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/switch-reminders"] });
      toast({ title: L ? "تم التحديث" : "Updated" });
      setSelected(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/admin/switch-reminders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/switch-reminders"] });
      toast({ title: L ? "تم الحذف" : "Deleted" });
      setSelected(null);
    },
  });

  const filtered = reminders.filter(r =>
    !search ||
    r.name.includes(search) ||
    r.phone.includes(search) ||
    r.currentProvider.includes(search) ||
    r.email.includes(search)
  );

  // Stats
  const stats = {
    total: reminders.length,
    pending: reminders.filter(r => r.status === "pending").length,
    contacted: reminders.filter(r => r.status === "contacted").length,
    converted: reminders.filter(r => r.status === "converted").length,
    urgent: reminders.filter(r => r.status !== "converted" && r.status !== "not_interested" && daysUntil(r.subscriptionEndDate) <= 30).length,
  };

  const openDetail = (r: SwitchReminder) => {
    setSelected(r);
    setEditNotes(r.adminNotes || "");
    setEditStatus(r.status);
  };

  return (
    <div className="space-y-6" dir={dir}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-black rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">{L ? "تذكيرات التحويل" : "Switch Reminders"}</h1>
              <p className="text-white/40 text-sm">{L ? "عملاء سيتجدد اشتراكهم — فرصتك للتواصل قبل المنافسة" : "Clients renewing subscriptions — your chance to reach out before the competition"}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { val: stats.total, label: L ? "إجمالي" : "Total", color: "text-white" },
              { val: stats.pending, label: L ? "جديد" : "New", color: "text-amber-400" },
              { val: stats.urgent, label: L ? "عاجل (30 يوم)" : "Urgent (30d)", color: "text-red-400" },
              { val: stats.converted, label: L ? "تحوّل" : "Converted", color: "text-green-400" },
            ].map(({ val, label, color }) => (
              <div key={label} className="bg-white/5 rounded-2xl px-4 py-2 text-center min-w-[80px]">
                <p className={`text-2xl font-black ${color}`}>{val}</p>
                <p className="text-white/30 text-[10px]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 dark:text-white/30" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={L ? "بحث بالاسم أو الجوال أو الشركة..." : "Search by name, phone, or company..."} className="pr-10 rounded-xl" data-testid="input-search" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 rounded-xl" data-testid="select-status-filter">
            <Filter className="w-4 h-4 ml-2 text-black/40 dark:text-white/40" />
            <SelectValue placeholder={L ? "كل الحالات" : "All Statuses"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{L ? "كل الحالات" : "All Statuses"}</SelectItem>
            <SelectItem value="pending">{L ? "جديد" : "New"}</SelectItem>
            <SelectItem value="contacted">{L ? "تم التواصل" : "Contacted"}</SelectItem>
            <SelectItem value="converted">{L ? "تحوّل لعميل" : "Converted"}</SelectItem>
            <SelectItem value="not_interested">{L ? "غير مهتم" : "Not Interested"}</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-black/[0.06] dark:border-white/[0.06] rounded-3xl">
          <Bell className="w-12 h-12 mx-auto mb-3 text-black/10 dark:text-white/10" />
          <p className="text-black/30 dark:text-white/30 font-medium">{L ? "لا توجد تذكيرات بعد" : "No reminders yet"}</p>
          <p className="text-black/20 dark:text-white/20 text-sm mt-1">{L ? "ستظهر هنا عندما يُسجّل العملاء طلبات التذكير" : "Reminders will appear here when clients register them"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r, i) => {
            const days = daysUntil(r.subscriptionEndDate);
            const st = STATUS_MAP[r.status];
            const isUrgent = days <= 30 && r.status !== "converted" && r.status !== "not_interested";
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => openDetail(r)}
                data-testid={`card-reminder-${r.id}`}
                className={`bg-white dark:bg-gray-900 border rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all duration-200 ${isUrgent ? "border-red-200 dark:border-red-800/50" : "border-black/[0.06] dark:border-white/[0.06]"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isUrgent ? "bg-red-100 dark:bg-red-950/30" : "bg-black/[0.04] dark:bg-white/[0.05]"}`}>
                      <Bell className={`w-5 h-5 ${isUrgent ? "text-red-500" : "text-black/40 dark:text-white/40"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-black dark:text-white text-sm">{r.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.color}`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${st.dot} ml-1`} />
                          {st.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-[11px] text-black/50 dark:text-white/50">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{r.phone}</span>
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{r.currentProvider}</span>
                        {r.serviceType && <span className="flex items-center gap-1">{SERVICE_LABELS[r.serviceType] || r.serviceType}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <div className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${urgencyColor(days)}`}>
                      {days <= 0 ? (L ? "انتهى!" : "Expired!") : (L ? `${days} يوم` : `${days}d`)}
                    </div>
                    <p className="text-[10px] text-black/30 dark:text-white/30 text-center mt-1">
                      {new Date(r.subscriptionEndDate).toLocaleDateString(L ? "ar-SA" : "en-US", { month: "short", day: "numeric", year: "2-digit" })}
                    </p>
                  </div>
                </div>
                {r.notes && (
                  <p className="mt-2 text-[11px] text-black/40 dark:text-white/40 bg-black/[0.02] dark:bg-white/[0.02] rounded-lg px-3 py-2 border border-black/[0.04] dark:border-white/[0.04] truncate">
                    {r.notes}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg rounded-3xl" dir={dir}>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-right font-black text-lg">{L ? "تفاصيل التذكير" : "Reminder Details"}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Client info */}
                <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-black/30 dark:text-white/30" />
                    <span className="font-bold text-black dark:text-white">{selected.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${selected.phone}`} className="hover:text-violet-600 transition-colors font-mono">{selected.phone}</a>
                  </div>
                  {selected.email && (
                    <div className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${selected.email}`} className="hover:text-violet-600 transition-colors">{selected.email}</a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-black/60 dark:text-white/60">
                    <Building2 className="w-4 h-4" />
                    {selected.currentProvider} {selected.serviceType && <span className="text-black/30 dark:text-white/30">— {SERVICE_LABELS[selected.serviceType] || selected.serviceType}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-black/30 dark:text-white/30" />
                    <span className="text-black/60 dark:text-white/60">{L ? "ينتهي في:" : "Expires:"}</span>
                    <span className={`font-bold px-2 py-0.5 rounded-lg text-xs border ${urgencyColor(daysUntil(selected.subscriptionEndDate))}`}>
                      {new Date(selected.subscriptionEndDate).toLocaleDateString(L ? "ar-SA" : "en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" })}
                      {" "}({daysUntil(selected.subscriptionEndDate)} {L ? "يوم" : "d"})
                    </span>
                  </div>
                  {selected.notes && (
                    <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                      <p className="text-xs text-black/40 dark:text-white/40 mb-1">{L ? "ملاحظة العميل:" : "Client note:"}</p>
                      <p className="text-sm text-black/70 dark:text-white/70">{selected.notes}</p>
                    </div>
                  )}
                </div>

                {/* Admin actions */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-black/40 dark:text-white/40 mb-1.5 block">{L ? "تحديث الحالة" : "Update Status"}</label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger className="rounded-xl" data-testid="select-edit-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{L ? "جديد" : "New"}</SelectItem>
                        <SelectItem value="contacted">{L ? "تم التواصل" : "Contacted"}</SelectItem>
                        <SelectItem value="converted">{L ? "تحوّل لعميل ✓" : "Converted ✓"}</SelectItem>
                        <SelectItem value="not_interested">{L ? "غير مهتم" : "Not Interested"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-black/40 dark:text-white/40 mb-1.5 block">{L ? "ملاحظات الفريق" : "Team Notes"}</label>
                    <Textarea
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      placeholder={L ? "سجّل ملاحظاتك بعد التواصل مع العميل..." : "Record your notes after contacting the client..."}
                      rows={3}
                      className="rounded-xl resize-none"
                      data-testid="textarea-admin-notes"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateMutation.mutate({ id: selected.id, status: editStatus, adminNotes: editNotes })}
                    disabled={updateMutation.isPending}
                    data-testid="btn-save-reminder"
                    className="flex-1 rounded-xl bg-black hover:bg-black/80 dark:bg-white dark:text-black gap-2"
                  >
                    {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {L ? "حفظ" : "Save"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => window.open(`https://wa.me/${selected.phone.replace(/\D/g, "")}`, "_blank")}
                    className="rounded-xl gap-2 text-green-600 hover:bg-green-50 hover:text-green-700"
                    data-testid="btn-whatsapp"
                  >
                    {L ? "واتساب" : "WhatsApp"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => { if (confirm(L ? "حذف هذا التذكير؟" : "Delete this reminder?")) deleteMutation.mutate(selected.id); }}
                    disabled={deleteMutation.isPending}
                    data-testid="btn-delete-reminder"
                    className="rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
