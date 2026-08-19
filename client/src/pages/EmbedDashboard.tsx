import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Package, FolderOpen, Wallet, Clock, CheckCircle2,
  XCircle, AlertCircle, Loader2, ShieldX, ArrowUpRight, ArrowDownLeft,
  BarChart3,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

// ── Types ────────────────────────────────────────────────────────────────────
type EmbedData = {
  client: {
    id: string; fullName: string; email: string; phone: string;
    subscriptionStatus: string; subscriptionSegmentNameAr: string;
    walletBalance: number;
  } | null;
  stats: { totalOrders: number; activeProjects: number; walletBalance: number };
  recentOrders: { id: string; projectType: string; status: string; totalAmount: number; createdAt: string }[];
  recentProjects: { id: string; status: string; stagingUrl: string; productionUrl: string; createdAt: string }[];
  walletTransactions: { id: string; type: string; amount: number; description: string; createdAt: string }[];
};

// ── Status helpers ─────────────────────────────────────────────────────────
const ORDER_STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending:    { label: "قيد الانتظار", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10",   icon: Clock },
  in_progress:{ label: "قيد التنفيذ", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10",      icon: AlertCircle },
  completed:  { label: "مكتمل",       color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10",    icon: CheckCircle2 },
  cancelled:  { label: "ملغي",         color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10",          icon: XCircle },
};

const PROJECT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  development:{ label: "قيد التطوير",  color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10" },
  review:     { label: "مراجعة",       color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10" },
  completed:  { label: "مكتمل",        color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10" },
  staging:    { label: "التجربة",      color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10" },
};

function StatusBadge({ status, map }: { status: string; map: Record<string, { label: string; color: string }> }) {
  const s = map[status] || { label: status, color: "bg-gray-100 text-gray-600 border-gray-200" };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.color}`}>{s.label}</span>;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}

function fmtSAR(n: number) {
  return n?.toLocaleString("ar-SA", { minimumFractionDigits: 0 }) + " ر.س";
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EMBED DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
export default function EmbedDashboard() {
  const { dir } = useI18n();
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const [data, setData]     = useState<EmbedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setError("لم يتم تمرير رمز التضمين. يرجى التحقق من كود الـ iframe."); setLoading(false); return; }
    fetch("/api/embed/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || `HTTP ${r.status}`); }
        return r.json();
      })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-black dark:text-white mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">جارٍ تحميل لوحة التحكم…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-black/[0.04] dark:bg-white/[0.06] rounded-3xl flex items-center justify-center mx-auto mb-4">
            <ShieldX className="w-8 h-8 text-black dark:text-white" />
          </div>
          <h2 className="text-lg font-black text-gray-900 mb-2">لا يمكن تحميل اللوحة</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { client, stats, recentOrders, recentProjects, walletTransactions } = data;

  return (
    <div className="min-h-screen bg-gray-50 font-sans" dir={dir} style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black dark:bg-white rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-xs">Q</span>
          </div>
          <div>
            <p className="font-black text-sm text-gray-900">لوحة تحكم Qirox</p>
            {client && <p className="text-[10px] text-gray-400">{client.fullName}</p>}
          </div>
        </div>
        {client?.subscriptionSegmentNameAr && (
          <span className="text-[10px] font-bold bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border border-black/10 dark:border-white/10 px-2.5 py-1 rounded-full">
            {client.subscriptionSegmentNameAr}
          </span>
        )}
      </div>

      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        {/* Stats cards */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
          {[
            { icon: Package,    color: "text-black dark:text-white", bg: "bg-black/[0.04] dark:bg-white/[0.06]", val: stats.totalOrders,                                   label: "إجمالي الطلبات" },
            { icon: FolderOpen, color: "text-black dark:text-white",   bg: "bg-black/[0.04] dark:bg-white/[0.06]",   val: stats.activeProjects,                                 label: "مشاريع نشطة" },
            { icon: Wallet,     color: "text-black dark:text-white",  bg: "bg-black/[0.04] dark:bg-white/[0.06]",  val: fmtSAR(stats.walletBalance), label: "رصيد المحفظة" },
          ].map(({ icon: Icon, color, bg, val, label }) => (
            <div key={label} className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm">
              <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-lg font-black text-gray-900 leading-none mb-0.5">{val}</p>
              <p className="text-[10px] text-gray-400 font-medium">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
              <Package className="w-4 h-4 text-black dark:text-white" />
              <p className="font-bold text-sm text-gray-900">آخر الطلبات</p>
            </div>
            <div className="divide-y divide-gray-50">
              {recentOrders.map(order => {
                const st = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.pending;
                const Icon = st.icon;
                return (
                  <div key={order.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 truncate">{order.projectType || "طلب جديد"}</p>
                        <p className="text-[10px] text-gray-400">{fmtDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={order.status} map={ORDER_STATUS_MAP} />
                      {order.totalAmount > 0 && <span className="text-xs font-bold text-gray-700">{fmtSAR(order.totalAmount)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-black dark:text-white" />
              <p className="font-bold text-sm text-gray-900">المشاريع الأخيرة</p>
            </div>
            <div className="divide-y divide-gray-50">
              {recentProjects.map(project => (
                <div key={project.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-7 h-7 bg-black/[0.04] dark:bg-white/[0.06] rounded-lg flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="w-3.5 h-3.5 text-black dark:text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {project.productionUrl ? (
                        <a href={project.productionUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-black dark:text-white hover:underline truncate block">
                          {project.productionUrl}
                        </a>
                      ) : project.stagingUrl ? (
                        <a href={project.stagingUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-black dark:text-white hover:underline truncate block">
                          {project.stagingUrl} (تجريبي)
                        </a>
                      ) : (
                        <p className="text-xs font-bold text-gray-600">مشروع قيد التنفيذ</p>
                      )}
                      <p className="text-[10px] text-gray-400">{fmtDate(project.createdAt)}</p>
                    </div>
                  </div>
                  <StatusBadge status={project.status} map={PROJECT_STATUS_MAP} />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Wallet Transactions */}
        {walletTransactions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-black dark:text-white" />
              <p className="font-bold text-sm text-gray-900">حركات المحفظة</p>
              <span className="ml-auto text-xs font-bold text-black dark:text-white">{fmtSAR(stats.walletBalance)}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {walletTransactions.map(txn => {
                const isCredit = txn.type === "credit" || txn.type === "topup" || txn.amount > 0;
                return (
                  <div key={txn.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isCredit ? "bg-black/[0.04] dark:bg-white/[0.06]" : "bg-black/[0.04] dark:bg-white/[0.06]"}`}>
                        {isCredit ? <ArrowDownLeft className="w-3.5 h-3.5 text-black dark:text-white" /> : <ArrowUpRight className="w-3.5 h-3.5 text-black dark:text-white" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 truncate">{txn.description || (isCredit ? "إيداع" : "خصم")}</p>
                        <p className="text-[10px] text-gray-400">{fmtDate(txn.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-black ${isCredit ? "text-black dark:text-white" : "text-black dark:text-white"}`}>
                      {isCredit ? "+" : "-"}{fmtSAR(Math.abs(txn.amount))}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {recentOrders.length === 0 && recentProjects.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 font-medium text-sm">لا توجد بيانات لعرضها حتى الآن</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-2">
          <p className="text-[10px] text-gray-300">مدعوم بـ <span className="font-bold text-black/70 dark:text-white/70">Qirox</span></p>
        </div>
      </div>
    </div>
  );
}
