import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Key, Search, Filter, Power, PowerOff, Trash2, Activity, Clock,
  Loader2, Users, Globe,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

type ApiKey = {
  id: string;
  _id: string;
  name: string;
  projectName: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  requestCount: number;
  allowedOrigins: string[];
  createdAt: string;
  clientId: string;
  client: { fullName: string; email: string; username: string } | null;
};

const SCOPE_COLORS: Record<string, string> = {
  orders:    "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  projects:  "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
  invoices:  "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
  stats:     "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  wallet:    "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400",
  customers: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400",
};
const SCOPE_LABELS: Record<string, string> = {
  orders: "طلبات", projects: "مشاريع", invoices: "فواتير",
  stats: "إحصائيات", wallet: "محفظة", customers: "عملاء",
};

export default function AdminApiKeys() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<ApiKey | null>(null);

  const { data: keys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/admin/api-keys", statusFilter],
    queryFn: async () => {
      const url = statusFilter === "all" ? "/api/admin/api-keys" : `/api/admin/api-keys?status=${statusFilter}`;
      const res = await fetch(url, { credentials: "include" });
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/api-keys/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      toast({ title: L ? "تم تحديث حالة المفتاح" : "Key status updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/api-keys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      setSelected(null);
      toast({ title: L ? "تم حذف المفتاح" : "Key deleted" });
    },
  });

  const filtered = keys.filter(k => {
    if (!search) return true;
    return (
      k.name.includes(search) ||
      k.client?.fullName?.includes(search) ||
      k.client?.email?.includes(search) ||
      k.keyPrefix.includes(search) ||
      (k.projectName || "").includes(search)
    );
  });

  const stats = {
    total: keys.length,
    active: keys.filter(k => k.isActive).length,
    totalRequests: keys.reduce((s, k) => s + k.requestCount, 0),
    clients: new Set(keys.map(k => k.clientId)).size,
  };

  return (
    <div className="space-y-6" dir={dir}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-black rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Key className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">{L ? "إدارة مفاتيح API" : "API Keys Management"}</h1>
              <p className="text-white/40 text-sm">{L ? "مراقبة وإدارة جميع مفاتيح ربط العملاء" : "Monitor and manage all client API keys"}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { val: stats.total, label: L ? "إجمالي" : "Total", color: "text-white" },
              { val: stats.active, label: L ? "نشط" : "Active", color: "text-green-400" },
              { val: stats.clients, label: L ? "عميل" : "Clients", color: "text-blue-400" },
              { val: stats.totalRequests.toLocaleString(L ? "ar" : "en"), label: L ? "طلب API" : "API Requests", color: "text-violet-400" },
            ].map(({ val, label, color }) => (
              <div key={label} className="bg-white/5 rounded-2xl px-4 py-2 text-center">
                <p className={`text-xl font-black ${color}`}>{val}</p>
                <p className="text-white/30 text-[10px]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 dark:text-white/30" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={L ? "بحث بالاسم أو العميل أو المشروع..." : "Search by name, client or project..."} className="pr-10 rounded-xl" data-testid="input-search" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44 rounded-xl" data-testid="select-status">
            <Filter className="w-4 h-4 ml-2 text-black/40 dark:text-white/40" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{L ? "كل المفاتيح" : "All Keys"}</SelectItem>
            <SelectItem value="active">{L ? "نشط فقط" : "Active Only"}</SelectItem>
            <SelectItem value="inactive">{L ? "معطّل فقط" : "Disabled Only"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Keys Table */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-black/[0.06] dark:border-white/[0.06] rounded-3xl">
          <Key className="w-12 h-12 mx-auto mb-3 text-black/10 dark:text-white/10" />
          <p className="text-black/30 dark:text-white/30 font-medium">{L ? "لا توجد مفاتيح" : "No keys found"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((key, i) => (
            <motion.div key={key.id || key._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              onClick={() => setSelected(key)}
              data-testid={`card-key-${key.id || key._id}`}
              className={`bg-white dark:bg-gray-900 border rounded-2xl p-4 cursor-pointer hover:shadow-sm transition-all ${key.isActive ? "border-black/[0.06] dark:border-white/[0.06]" : "border-black/[0.04] dark:border-white/[0.04] opacity-60"}`}>
              <div className="flex items-center gap-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${key.isActive ? "bg-violet-100 dark:bg-violet-950/40" : "bg-black/[0.04] dark:bg-white/[0.04]"}`}>
                  <Key className={`w-4 h-4 ${key.isActive ? "text-violet-600 dark:text-violet-400" : "text-black/20 dark:text-white/20"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-black dark:text-white">{key.name}</p>
                    {key.projectName && <span className="text-[10px] bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">{key.projectName}</span>}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${key.isActive ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800" : "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700"}`}>
                      {key.isActive ? (L ? "نشط" : "Active") : (L ? "معطّل" : "Disabled")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-black/40 dark:text-white/40 mt-1 flex-wrap">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{key.client?.fullName || "—"}</span>
                    <code className="text-[10px] bg-black/[0.04] dark:bg-white/[0.04] px-1.5 py-0.5 rounded font-mono">{key.keyPrefix}</code>
                    <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{key.requestCount.toLocaleString(L ? "ar" : "en")}</span>
                    {key.lastUsedAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(key.lastUsedAt).toLocaleDateString(L ? "ar-SA" : "en-US")}</span>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 justify-end">
                  {key.scopes.slice(0, 4).map(s => (
                    <span key={s} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${SCOPE_COLORS[s] || "bg-gray-100 text-gray-600"} border-transparent`}>
                      {SCOPE_LABELS[s] || s}
                    </span>
                  ))}
                  {key.scopes.length > 4 && <span className="text-[9px] text-black/30 dark:text-white/30">+{key.scopes.length - 4}</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg rounded-3xl" dir={dir}>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-right font-black text-lg flex items-center gap-2">
                  <Key className="w-5 h-5 text-violet-500" /> {L ? "تفاصيل المفتاح" : "Key Details"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Client */}
                <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-black dark:text-white">{selected.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${selected.isActive ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                      {selected.isActive ? (L ? "نشط" : "Active") : (L ? "معطّل" : "Disabled")}
                    </span>
                  </div>
                  {selected.projectName && <p className="text-sm text-black/50 dark:text-white/50">{L ? "المشروع" : "Project"}: {selected.projectName}</p>}
                  <p className="text-sm text-black/50 dark:text-white/50">{L ? "العميل" : "Client"}: <strong>{selected.client?.fullName || "—"}</strong> ({selected.client?.email || "—"})</p>
                  <code className="text-xs font-mono text-black/40 dark:text-white/40 bg-black/[0.04] dark:bg-white/[0.04] px-2 py-1 rounded-lg block">{selected.keyPrefix}</code>
                </div>

                {/* Scopes */}
                <div>
                  <p className="text-xs font-bold text-black/40 dark:text-white/40 mb-2">{L ? "الصلاحيات" : "Permissions"}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.scopes.map(s => (
                      <span key={s} className={`text-xs font-bold px-2.5 py-1 rounded-full border ${SCOPE_COLORS[s] || "bg-gray-100 text-gray-600"} border-transparent`}>
                        {SCOPE_LABELS[s] || s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: selected.requestCount.toLocaleString("ar"), label: "طلبات API" },
                    { val: selected.lastUsedAt ? new Date(selected.lastUsedAt).toLocaleDateString("ar-SA") : "—", label: "آخر استخدام" },
                    { val: new Date(selected.createdAt).toLocaleDateString("ar-SA"), label: "تاريخ الإنشاء" },
                  ].map(({ val, label }) => (
                    <div key={label} className="bg-black/[0.02] dark:bg-white/[0.02] rounded-xl p-3 text-center border border-black/[0.05] dark:border-white/[0.05]">
                      <p className="font-black text-sm text-black dark:text-white">{val}</p>
                      <p className="text-[10px] text-black/30 dark:text-white/30">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => { toggleMutation.mutate({ id: selected.id || selected._id, isActive: !selected.isActive }); setSelected(null); }}
                    disabled={toggleMutation.isPending}
                    data-testid="btn-toggle-key"
                    className={`flex-1 rounded-xl gap-2 ${selected.isActive ? "bg-gray-600 hover:bg-gray-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}`}
                  >
                    {selected.isActive ? <><PowerOff className="w-4 h-4" /> {L ? "تعطيل المفتاح" : "Disable Key"}</> : <><Power className="w-4 h-4" /> {L ? "تفعيل المفتاح" : "Enable Key"}</>}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => { if (confirm(L ? "حذف هذا المفتاح نهائياً؟" : "Permanently delete this key?")) deleteMutation.mutate(selected.id || selected._id); }}
                    disabled={deleteMutation.isPending}
                    data-testid="btn-delete-key"
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
