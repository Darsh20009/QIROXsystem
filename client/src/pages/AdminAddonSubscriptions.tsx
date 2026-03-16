// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package, Loader2, AlertTriangle, CheckCircle, Clock, XCircle,
  Plus, Edit2, RotateCcw, Search, Save, X, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

const STATUS_MAP: Record<string, { label: string; icon: any; color: string }> = {
  active:    { label: "نشط",         icon: CheckCircle,   color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200" },
  expired:   { label: "منتهي",       icon: XCircle,       color: "text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200" },
  exhausted: { label: "نفذت الحصة", icon: AlertTriangle, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200" },
  cancelled: { label: "ملغي",        icon: XCircle,       color: "text-black/40 bg-black/[0.03] dark:bg-white/[0.03] border-black/10" },
};

const BILLING_TYPES = [
  { value: "one_time", label: "مرة واحدة" },
  { value: "monthly",  label: "شهري" },
  { value: "annual",   label: "سنوي" },
];

function formatDate(d: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminAddonSubscriptions() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [newForm, setNewForm] = useState({ addonNameAr: "", quotaTotal: "", billingType: "one_time", expiresAt: "" });
  const [editForm, setEditForm] = useState<any>({});

  const { data: subs = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/addon-subscriptions", statusFilter],
    queryFn: async () => {
      const url = statusFilter !== "all"
        ? `/api/admin/addon-subscriptions?status=${statusFilter}`
        : "/api/admin/addon-subscriptions";
      const r = await fetch(url, { credentials: "include" });
      return r.json();
    },
  });

  const clientSearchQ = useQuery<any[]>({
    queryKey: ["/api/employee/clients-subscriptions", clientSearch],
    queryFn: async () => {
      if (clientSearch.trim().length < 2) return [];
      const r = await fetch(`/api/employee/clients-subscriptions?q=${encodeURIComponent(clientSearch.trim())}`, { credentials: "include" });
      return r.json();
    },
    enabled: clientSearch.trim().length >= 2,
    staleTime: 10_000,
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/client-addon-subs", data),
    onSuccess: () => {
      toast({ title: L ? "تمت الإضافة بنجاح" : "Added successfully" });
      setShowAddForm(false);
      setSelectedClient(null);
      setClientSearch("");
      setNewForm({ addonNameAr: "", quotaTotal: "", billingType: "one_time", expiresAt: "" });
      qc.invalidateQueries({ queryKey: ["/api/admin/addon-subscriptions"] });
    },
    onError: (err: any) => toast({ title: err.message || (L ? "حدث خطأ" : "An error occurred"), variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/admin/client-addon-subs/${id}`, data),
    onSuccess: () => {
      toast({ title: L ? "تم التحديث" : "Updated" });
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["/api/admin/addon-subscriptions"] });
    },
    onError: (err: any) => toast({ title: err.message || (L ? "حدث خطأ" : "An error occurred"), variant: "destructive" }),
  });

  const renewMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/client-addon-subs/${id}`, { status: "active", quotaUsed: 0 }),
    onSuccess: () => {
      toast({ title: L ? "تم التجديد بنجاح" : "Renewed successfully" });
      qc.invalidateQueries({ queryKey: ["/api/admin/addon-subscriptions"] });
    },
    onError: (err: any) => toast({ title: err.message || (L ? "حدث خطأ" : "An error occurred"), variant: "destructive" }),
  });

  const counts = {
    all:       subs.length,
    active:    subs.filter((s: any) => s.status === "active").length,
    expired:   subs.filter((s: any) => s.status === "expired").length,
    exhausted: subs.filter((s: any) => s.status === "exhausted").length,
  };

  function startEdit(sub: any) {
    setEditingId(sub._id || sub.id);
    setEditForm({
      addonNameAr: sub.addonNameAr || sub.addonId?.nameAr || "",
      quotaTotal: String(sub.quotaTotal ?? ""),
      quotaUsed: String(sub.quotaUsed ?? ""),
      status: sub.status || "active",
      expiresAt: sub.expiresAt ? new Date(sub.expiresAt).toISOString().split("T")[0] : "",
    });
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5" />
            {L ? "اشتراكات المميزات الجانبية" : "Addon Subscriptions"}
          </h1>
          <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">{L ? "إدارة الحصص وتجديد الخدمات المضافة للعملاء" : "Manage quotas and renew addon services for clients"}</p>
        </div>
        <Button
          onClick={() => setShowAddForm(v => !v)}
          className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80 rounded-xl gap-2 font-bold"
          data-testid="btn-add-addon-sub"
        >
          <Plus className="w-4 h-4" />
          {L ? "إضافة اشتراك ميزة" : "Add Addon Subscription"}
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-900 border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-1">
            <p className="font-bold text-black dark:text-white">{L ? "إضافة اشتراك ميزة جانبية" : "Add Addon Subscription"}</p>
            <button onClick={() => setShowAddForm(false)} className="text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Client Search */}
          <div>
            <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-1.5 block">{L ? "اختر العميل" : "Select Client"}</label>
            <div className="relative">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-black/30 dark:text-white/30" />
              <input
                type="text"
                placeholder={L ? "ابحث بالاسم أو الإيميل..." : "Search by name or email..."}
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-sm focus:outline-none"
                data-testid="input-client-search-addon"
              />
            </div>
            {selectedClient ? (
              <div className="mt-2 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 rounded-xl p-2.5">
                <User className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{selectedClient.fullName} — {selectedClient.email}</span>
                <button onClick={() => { setSelectedClient(null); setClientSearch(""); }} className="mr-auto text-emerald-500 hover:text-red-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : clientSearch.trim().length >= 2 && (clientSearchQ.data?.length ?? 0) > 0 ? (
              <div className="mt-1 border border-black/[0.07] dark:border-white/[0.07] rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-md max-h-40 overflow-y-auto">
                {(clientSearchQ.data || []).slice(0, 6).map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedClient(c); setClientSearch(""); }}
                    className="w-full text-right px-3 py-2.5 flex items-center gap-2 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] border-b border-black/[0.03] dark:border-white/[0.03] last:border-0"
                  >
                    <User className="w-3.5 h-3.5 text-black/30 dark:text-white/30 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-black dark:text-white truncate">{c.fullName}</p>
                      <p className="text-[11px] text-black/40 dark:text-white/40 truncate">{c.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-1.5 block">{L ? "اسم الميزة" : "Addon Name"}</label>
              <input
                type="text"
                placeholder={L ? "مثال: خدمة البريد الإلكتروني" : "e.g. Email Service"}
                value={newForm.addonNameAr}
                onChange={e => setNewForm(p => ({ ...p, addonNameAr: e.target.value }))}
                className="w-full px-3 py-2.5 bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-sm focus:outline-none"
                data-testid="input-addon-name"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-1.5 block">{L ? "الحصة الإجمالية" : "Total Quota"}</label>
              <input
                type="number"
                min="0"
                placeholder={L ? "0 = بلا حد" : "0 = unlimited"}
                value={newForm.quotaTotal}
                onChange={e => setNewForm(p => ({ ...p, quotaTotal: e.target.value }))}
                className="w-full px-3 py-2.5 bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-sm focus:outline-none"
                data-testid="input-quota-total"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-1.5 block">{L ? "نوع الفوترة" : "Billing Type"}</label>
              <select
                value={newForm.billingType}
                onChange={e => setNewForm(p => ({ ...p, billingType: e.target.value }))}
                className="w-full px-3 py-2.5 bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-sm focus:outline-none"
              >
                {BILLING_TYPES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-black/50 dark:text-white/50 mb-1.5 block">{L ? "تاريخ الانتهاء (اختياري)" : "Expiry Date (optional)"}</label>
              <input
                type="date"
                value={newForm.expiresAt}
                onChange={e => setNewForm(p => ({ ...p, expiresAt: e.target.value }))}
                className="w-full px-3 py-2.5 bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-sm focus:outline-none"
              />
            </div>
          </div>

          <Button
            onClick={() => addMutation.mutate({
              clientId: selectedClient?.id,
              addonNameAr: newForm.addonNameAr,
              quotaTotal: Number(newForm.quotaTotal) || 0,
              billingType: newForm.billingType,
              expiresAt: newForm.expiresAt || undefined,
              status: "active",
            })}
            disabled={!selectedClient || !newForm.addonNameAr || addMutation.isPending}
            className="w-full bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold"
            data-testid="btn-confirm-add-addon"
          >
            {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Plus className="w-4 h-4 ml-2" />}
            {L ? "إضافة الاشتراك" : "Add Subscription"}
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { key: "all",       label: "الكل" },
          { key: "active",    label: "نشطة" },
          { key: "expired",   label: "منتهية" },
          { key: "exhausted", label: "نفذت" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`rounded-xl border p-3 text-center transition-all ${statusFilter === key ? "border-black dark:border-white bg-black dark:bg-white" : "border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 hover:bg-black/[0.02]"}`}
            data-testid={`filter-${key}`}
          >
            <p className={`text-lg font-black ${statusFilter === key ? "text-white dark:text-black" : "text-black dark:text-white"}`}>{(counts as any)[key] ?? 0}</p>
            <p className={`text-xs mt-0.5 ${statusFilter === key ? "text-white/70 dark:text-black/70" : "text-black/40 dark:text-white/40"}`}>{label}</p>
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" /></div>
      ) : subs.length === 0 ? (
        <div className="text-center py-12 text-sm text-black/30 dark:text-white/30">{L ? "لا توجد اشتراكات" : "No subscriptions found"}</div>
      ) : (
        <div className="space-y-3">
          {subs.map((sub: any) => {
            const subId = sub._id || sub.id;
            const st = STATUS_MAP[sub.status] || STATUS_MAP.active;
            const Icon = st.icon;
            const quotaPct = sub.quotaTotal > 0 ? Math.min(100, Math.round((sub.quotaUsed / sub.quotaTotal) * 100)) : 0;
            const needsRenewal = sub.status === "exhausted" || sub.status === "expired";
            const clientName = sub.clientId?.fullName || sub.clientId?.username || "—";
            const addonName = sub.addonNameAr || sub.addonId?.nameAr || "—";
            const isEditing = editingId === subId;

            return (
              <div key={subId} className={`bg-white dark:bg-gray-900 rounded-2xl border overflow-hidden ${needsRenewal ? "border-orange-200 dark:border-orange-800/40" : "border-black/[0.06] dark:border-white/[0.06]"}`} data-testid={`row-sub-${subId}`}>
                <div className="p-4 flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-[140px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-black dark:text-white">{addonName}</p>
                      <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-bold ${st.color}`}>
                        <Icon className="w-3 h-3" />
                        {st.label}
                      </span>
                      {needsRenewal && (
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full border border-orange-200">
                          ⚠ {L ? "يحتاج تجديد" : "Needs Renewal"}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-black/40 dark:text-white/40 mt-0.5 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {clientName}
                      {sub.clientId?.email && <span className="text-black/25 dark:text-white/25">— {sub.clientId.email}</span>}
                    </p>
                  </div>

                  {/* Quota Bar */}
                  {sub.quotaTotal > 0 && (
                    <div className="w-28 flex-shrink-0">
                      <div className="flex justify-between text-[10px] text-black/40 dark:text-white/40 mb-1">
                        <span>{sub.quotaUsed}/{sub.quotaTotal}</span>
                        <span>{quotaPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-black/[0.06] dark:bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${quotaPct >= 90 ? "bg-red-500" : quotaPct >= 70 ? "bg-amber-400" : "bg-emerald-500"}`}
                          style={{ width: `${quotaPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] text-black/40 dark:text-white/40 flex-shrink-0">
                    {sub.expiresAt ? formatDate(sub.expiresAt) : "—"}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {needsRenewal && (
                      <Button
                        size="sm"
                        onClick={() => renewMutation.mutate(subId)}
                        disabled={renewMutation.isPending}
                        className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1 font-bold"
                        data-testid={`btn-renew-${subId}`}
                      >
                        <RotateCcw className="w-3 h-3" />
                        {L ? "تجديد" : "Renew"}
                      </Button>
                    )}
                    <button
                      onClick={() => isEditing ? setEditingId(null) : startEdit(sub)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-black/[0.03] dark:bg-white/[0.03] hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-colors"
                      data-testid={`btn-edit-${subId}`}
                    >
                      {isEditing ? <X className="w-4 h-4 text-black/40 dark:text-white/40" /> : <Edit2 className="w-4 h-4 text-black/40 dark:text-white/40" />}
                    </button>
                  </div>
                </div>

                {/* Edit Row */}
                {isEditing && (
                  <div className="border-t border-black/[0.05] dark:border-white/[0.05] p-4 bg-black/[0.01] dark:bg-white/[0.01]">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      <div>
                        <label className="text-[10px] font-bold text-black/40 dark:text-white/40 mb-1 block">{L ? "اسم الميزة" : "Addon Name"}</label>
                        <input
                          type="text"
                          value={editForm.addonNameAr}
                          onChange={e => setEditForm((p: any) => ({ ...p, addonNameAr: e.target.value }))}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-black/40 dark:text-white/40 mb-1 block">{L ? "الحصة الإجمالية" : "Total Quota"}</label>
                        <input
                          type="number" min="0"
                          value={editForm.quotaTotal}
                          onChange={e => setEditForm((p: any) => ({ ...p, quotaTotal: e.target.value }))}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-black/40 dark:text-white/40 mb-1 block">{L ? "الحصة المستهلكة" : "Used Quota"}</label>
                        <input
                          type="number" min="0"
                          value={editForm.quotaUsed}
                          onChange={e => setEditForm((p: any) => ({ ...p, quotaUsed: e.target.value }))}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-black/40 dark:text-white/40 mb-1 block">{L ? "الحالة" : "Status"}</label>
                        <select
                          value={editForm.status}
                          onChange={e => setEditForm((p: any) => ({ ...p, status: e.target.value }))}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-sm focus:outline-none"
                        >
                          {Object.entries(STATUS_MAP).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-black/40 dark:text-white/40 mb-1 block">{L ? "تاريخ الانتهاء" : "Expiry Date"}</label>
                        <input
                          type="date"
                          value={editForm.expiresAt}
                          onChange={e => setEditForm((p: any) => ({ ...p, expiresAt: e.target.value }))}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-sm focus:outline-none"
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => editMutation.mutate({ id: subId, data: {
                        addonNameAr: editForm.addonNameAr,
                        quotaTotal: Number(editForm.quotaTotal) || 0,
                        quotaUsed: Number(editForm.quotaUsed) || 0,
                        status: editForm.status,
                        expiresAt: editForm.expiresAt || undefined,
                      }})}
                      disabled={editMutation.isPending}
                      className="bg-black dark:bg-white text-white dark:text-black rounded-xl gap-1.5 font-bold h-8 text-xs"
                      data-testid={`btn-save-edit-${subId}`}
                    >
                      {editMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      {L ? "حفظ التعديلات" : "Save Changes"}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
