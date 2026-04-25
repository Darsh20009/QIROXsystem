import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, Users, CheckCircle2, Clock, XCircle, BarChart3, UserCheck, PieChart } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell, Legend,
} from "recharts";

interface SalesReport {
  totalLeads: number;
  statusBreakdown: Record<string, number>;
  monthly: { month: string; count: number }[];
  perSales: { name: string; total: number; pending: number; confirmed: number; completed: number }[];
  sectorBreakdown: Record<string, number>;
  unassigned: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#10b981",
  completed: "#3b82f6",
  rejected: "#ef4444",
  cancelled: "#94a3b8",
};

const STATUS_AR: Record<string, string> = {
  pending: "قيد المراجعة",
  confirmed: "مؤكد",
  completed: "مكتمل",
  rejected: "مرفوض",
  cancelled: "ملغي",
};

const CHART_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6", "#f97316"];

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-black/10 dark:border-white/10 p-5 flex items-start gap-4">
      <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/10">
        <Icon className="w-5 h-5 text-black dark:text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-black dark:text-white">{value}</p>
        <p className="text-sm text-black/50 dark:text-white/50">{label}</p>
        {sub && <p className="text-xs text-black/30 dark:text-white/30 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminSalesReports() {
  const { lang, dir } = useI18n();
  const L = lang === "ar";

  const { data, isLoading } = useQuery<SalesReport>({
    queryKey: ["/api/admin/sales-reports"],
    queryFn: async () => {
      const r = await fetch("/api/admin/sales-reports", { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-black/30 dark:text-white/30" />
      </div>
    );
  }

  if (!data) return null;

  const pieData = Object.entries(data.statusBreakdown).map(([k, v]) => ({
    name: L ? (STATUS_AR[k] || k) : k,
    value: v,
    key: k,
  }));

  const sectorData = Object.entries(data.sectorBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k, v]) => ({ name: k, value: v }));

  const conversionRate = data.totalLeads > 0
    ? Math.round(((data.statusBreakdown.completed || 0) / data.totalLeads) * 100)
    : 0;

  return (
    <div dir={dir} className="min-h-screen bg-white dark:bg-black p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          {L ? "تقارير المبيعات" : "Sales Reports"}
        </h1>
        <p className="text-sm text-black/40 dark:text-white/40 mt-1">
          {L ? "تحليل شامل لعملاء AI QuickStart Wizard" : "Full analytics for AI QuickStart Wizard leads"}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={TrendingUp} label={L ? "إجمالي العملاء" : "Total Leads"} value={data.totalLeads} />
        <StatCard
          icon={Clock}
          label={L ? "قيد المراجعة" : "Pending"}
          value={data.statusBreakdown.pending || 0}
          sub={data.totalLeads > 0 ? `${Math.round(((data.statusBreakdown.pending || 0) / data.totalLeads) * 100)}%` : "0%"}
        />
        <StatCard
          icon={CheckCircle2}
          label={L ? "نسبة التحويل" : "Conversion Rate"}
          value={`${conversionRate}%`}
          sub={L ? `${data.statusBreakdown.completed || 0} مكتمل` : `${data.statusBreakdown.completed || 0} completed`}
        />
        <StatCard
          icon={UserCheck}
          label={L ? "غير مُسند" : "Unassigned"}
          value={data.unassigned}
          sub={L ? "بدون مندوب" : "no rep assigned"}
        />
      </div>

      {/* Monthly trend chart */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-black/10 dark:border-white/10 p-5 mb-6">
        <p className="text-sm font-semibold text-black/60 dark:text-white/60 mb-4">
          {L ? "العملاء الشهريون (آخر 12 شهراً)" : "Monthly Leads (Last 12 Months)"}
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "var(--color-bg, #fff)", border: "1px solid #e5e7eb", borderRadius: 12, fontSize: 12 }}
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
            />
            <Bar dataKey="count" fill="#111" radius={[6, 6, 0, 0]} name={L ? "عملاء" : "Leads"} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Status pie */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-black/10 dark:border-white/10 p-5">
          <p className="text-sm font-semibold text-black/60 dark:text-white/60 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            {L ? "توزيع الحالات" : "Status Breakdown"}
          </p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RPieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, idx) => (
                    <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10 }} />
              </RPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-black/30 dark:text-white/30 text-sm">
              {L ? "لا توجد بيانات" : "No data"}
            </div>
          )}
        </div>

        {/* Sector breakdown */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-black/10 dark:border-white/10 p-5">
          <p className="text-sm font-semibold text-black/60 dark:text-white/60 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {L ? "القطاعات الأكثر طلباً" : "Top Sectors"}
          </p>
          {sectorData.length > 0 ? (
            <div className="space-y-2.5">
              {sectorData.map((s, idx) => {
                const max = sectorData[0].value;
                const pct = max > 0 ? Math.round((s.value / max) * 100) : 0;
                return (
                  <div key={s.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-black/70 dark:text-white/70 truncate max-w-[75%]">{s.name}</span>
                      <span className="text-black/40 dark:text-white/40 font-mono">{s.value}</span>
                    </div>
                    <div className="h-1.5 bg-black/[0.05] dark:bg-white/[0.07] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: CHART_COLORS[idx % CHART_COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-black/30 dark:text-white/30 text-sm">
              {L ? "لا توجد بيانات" : "No data"}
            </div>
          )}
        </div>
      </div>

      {/* Per-sales table */}
      {data.perSales.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-black/10 dark:border-white/10 p-5">
          <p className="text-sm font-semibold text-black/60 dark:text-white/60 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" />
            {L ? "أداء فريق المبيعات" : "Sales Team Performance"}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/5">
                  {[
                    L ? "المندوب" : "Rep",
                    L ? "المجموع" : "Total",
                    L ? "قيد المراجعة" : "Pending",
                    L ? "مؤكد" : "Confirmed",
                    L ? "مكتمل" : "Completed",
                  ].map(h => (
                    <th key={h} className="text-start py-2 px-3 text-black/40 dark:text-white/40 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.perSales.sort((a, b) => b.total - a.total).map((s) => (
                  <tr key={s.name} data-testid={`row-sales-${s.name}`} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 font-medium text-black dark:text-white">{s.name}</td>
                    <td className="py-3 px-3 font-mono font-bold text-black dark:text-white">{s.total}</td>
                    <td className="py-3 px-3 text-amber-600 dark:text-amber-400">{s.pending}</td>
                    <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400">{s.confirmed}</td>
                    <td className="py-3 px-3 text-blue-600 dark:text-blue-400">{s.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.perSales.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-black/10 dark:border-white/10 p-10 text-center text-black/30 dark:text-white/30">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>{L ? "لا يوجد أعضاء مبيعات حتى الآن" : "No sales team members yet"}</p>
        </div>
      )}
    </div>
  );
}
