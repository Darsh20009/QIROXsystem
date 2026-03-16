// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import SARIcon from "@/components/SARIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2, TrendingUp, TrendingDown, Users, ShoppingCart, Clock,
  BarChart3, Download, DollarSign, CheckCircle, Star, CreditCard,
  ArrowUpRight, ArrowDownRight, Building2, Minus, Video, Mail, Send,
  Flame, Activity, Target, FileText, ShieldCheck, UserCheck, ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { exportToExcel } from "@/lib/excel";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useI18n } from "@/lib/i18n";

/* ─── Status / Method labels ─────────────────────────────── */
const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b", approved: "#3b82f6", in_progress: "#8b5cf6",
  completed: "#10b981", rejected: "#ef4444", delivered: "#06b6d4", closed: "#6b7280",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار", approved: "مقبول", in_progress: "قيد التنفيذ",
  completed: "مكتمل", rejected: "مرفوض", delivered: "تم التسليم", closed: "مغلق",
};
const PAYMENT_LABELS: Record<string, string> = {
  bank_transfer: "تحويل بنكي", wallet: "محفظة", mixed: "تحويل + محفظة",
  stc_pay: "STC Pay", apple_pay: "Apple Pay", cash: "نقدي", other: "أخرى",
};
const PAYMENT_COLORS = ["#000", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];
const SECTOR_COLORS = ["#000","#374151","#6b7280","#9ca3af","#d1d5db","#e5e7eb","#f3f4f6","#f9fafb"];

function GrowthBadge({ pct }: { pct: number }) {
  if (pct === 0) return <span className="text-xs text-black/30 flex items-center gap-0.5"><Minus className="w-3 h-3" />0%</span>;
  if (pct > 0) return <span className="text-xs text-green-600 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />{pct}%</span>;
  return <span className="text-xs text-red-500 flex items-center gap-0.5"><ArrowDownRight className="w-3 h-3" />{Math.abs(pct)}%</span>;
}

export default function AdminAnalytics() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const [reportEmail, setReportEmail] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/analytics"],
    queryFn: async () => {
      const r = await fetch("/api/admin/analytics", { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    refetchInterval: 60000,
  });

  const { data: qmeet } = useQuery<any>({
    queryKey: ["/api/admin/analytics/qmeet"],
    queryFn: async () => {
      const r = await fetch("/api/admin/analytics/qmeet", { credentials: "include" });
      if (!r.ok) return null;
      return r.json();
    },
    refetchInterval: 120000,
  });

  const { data: empData } = useQuery<any>({
    queryKey: ["/api/admin/analytics/employees"],
    queryFn: async () => {
      const r = await fetch("/api/admin/analytics/employees", { credentials: "include" });
      if (!r.ok) return null;
      return r.json();
    },
    refetchInterval: 120000,
  });

  const { data: contractStats } = useQuery<any>({
    queryKey: ["/api/admin/analytics/contracts"],
    queryFn: async () => {
      const r = await fetch("/api/admin/analytics/contracts", { credentials: "include" });
      if (!r.ok) return null;
      return r.json();
    },
    refetchInterval: 120000,
  });

  const reportMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/analytics/send-report", { email: reportEmail || undefined }),
    onSuccess: (d: any) => {
      toast({ title: L ? "تم إرسال التقرير" : "Report Sent", description: `${L ? "أُرسل إلى" : "Sent to"}: ${d.sentTo}` });
      setShowEmailInput(false);
      setReportEmail("");
    },
    onError: (e: any) => toast({ title: "فشل الإرسال", description: e.message, variant: "destructive" }),
  });

  const exportAnalytics = () => {
    if (!data) return;
    exportToExcel("qirox-analytics.xlsx", [
      { name: "البيانات الشهرية", data: data.monthlyData },
      { name: "توزيع الحالات", data: (data.statusDist || []).map((s: any) => ({ الحالة: STATUS_LABELS[s._id] || s._id, العدد: s.count, الإيراد: s.revenue })) },
      { name: "طرق الدفع", data: (data.paymentMethodDist || []).map((p: any) => ({ الطريقة: PAYMENT_LABELS[p._id] || p._id, العدد: p.count, الإيراد: p.revenue })) },
      { name: "أفضل العملاء", data: (data.topClients || []).map((c: any) => ({ الاسم: c.fullName || c.username, الإيميل: c.email, الإنفاق: c.totalSpent, الطلبات: c.orderCount })) },
    ]);
  };

  if (isLoading) return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-5">
            <Skeleton className="h-3 w-3/5 mb-3 rounded" />
            <Skeleton className="h-7 w-2/5 mb-2 rounded" />
            <Skeleton className="h-2.5 w-1/2 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-5">
            <Skeleton className="h-4 w-1/3 mb-4 rounded" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-5">
        <Skeleton className="h-4 w-1/4 mb-4 rounded" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    </div>
  );

  const stats = data?.stats || {};
  const pieData = (data?.statusDist || []).map((s: any) => ({
    name: STATUS_LABELS[s._id] || s._id, value: s.count, color: STATUS_COLORS[s._id] || "#6b7280",
  }));
  const paymentPieData = (data?.paymentMethodDist || []).map((p: any, i: number) => ({
    name: PAYMENT_LABELS[p._id] || p._id || (L ? "غير محدد" : "Unknown"), value: p.count, revenue: p.revenue, color: PAYMENT_COLORS[i] || "#6b7280",
  }));

  return (
    <div className="space-y-6 relative overflow-hidden" dir={dir}>
      <PageGraphics variant="dashboard" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black dark:text-white">{L ? "التحليلات المتقدمة" : "Advanced Analytics"}</h1>
            <p className="text-xs text-black/35 dark:text-white/35">{L ? "بيانات تفصيلية للطلبات والمالية والعملاء" : "Detailed data for orders, financials, and clients"}</p>
          </div>
        </div>
        <Button onClick={exportAnalytics} variant="outline" size="sm" className="gap-2 border-black/10 dark:border-white/10 dark:text-white rounded-xl">
          <Download className="w-4 h-4" /> {L ? "تصدير Excel" : "Export Excel"}
        </Button>
      </div>

      {/* ── KPI Stats Row 1: Overall ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: L ? "إجمالي الإيرادات" : "Total Revenue", value: `${(stats.totalRevenue || 0).toLocaleString()}`, unit: "ر.س", icon: DollarSign, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: L ? "إجمالي العملاء" : "Total Clients", value: stats.totalUsers || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: L ? "إجمالي الطلبات" : "Total Orders", value: stats.totalOrders || 0, icon: ShoppingCart, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
          { label: L ? "طلبات معلقة" : "Pending Orders", value: stats.pendingOrders || 0, icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
        ].map((s, i) => (
          <Card key={i} className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] text-black/40 dark:text-white/40 font-medium">{s.label}</span>
                <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                </div>
              </div>
              <p className="text-2xl font-black text-black dark:text-white">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
              {s.unit && (s.unit === "ر.س" ? <SARIcon size={12} className="opacity-30 mt-0.5" /> : <span className="text-xs text-black/30 dark:text-white/30">{s.unit}</span>)}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── KPI Stats Row 2: This Month ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: L ? "إيراد هذا الشهر" : "This Month Revenue", value: (stats.thisMonthRevenue || 0).toLocaleString(), unit: "ر.س", growth: stats.revenueGrowth, icon: TrendingUp },
          { label: L ? "طلبات هذا الشهر" : "This Month Orders", value: stats.thisMonthOrders || 0, growth: stats.ordersGrowth, icon: ShoppingCart },
          { label: L ? "متوسط قيمة الطلب" : "Avg Order Value", value: (stats.avgOrderValue || 0).toLocaleString(), unit: "ر.س", icon: BarChart3 },
          { label: L ? "إيرادات معلقة" : "Pending Revenue", value: (stats.pendingRevenue || 0).toLocaleString(), unit: "ر.س", icon: Clock },
        ].map((s, i) => (
          <Card key={i} className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] text-black/40 dark:text-white/40 font-medium">{s.label}</span>
                <s.icon className="w-4 h-4 text-black/20 dark:text-white/20" />
              </div>
              <p className="text-2xl font-black text-black dark:text-white">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {s.unit && (s.unit === "ر.س" ? <SARIcon size={12} className="opacity-30 mt-0.5" /> : <span className="text-xs text-black/30 dark:text-white/30">{s.unit}</span>)}
                {s.growth !== undefined && <GrowthBadge pct={s.growth} />}
                {s.growth !== undefined && <span className="text-[10px] text-black/20 dark:text-white/20">{L ? "vs الشهر الماضي" : "vs last month"}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Monthly Revenue + Orders Chart ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-1">{L ? "الإيرادات الشهرية" : "Monthly Revenue"} <SARIcon size={11} className="opacity-60" /></CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthlyData || []}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000008" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#00000050" }} />
                <YAxis tick={{ fontSize: 10, fill: "#00000050" }} />
                <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()}`, L ? "الإيراد" : "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#000" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60">{L ? "الطلبات والعملاء الجدد شهرياً" : "Monthly Orders & New Clients"}</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000008" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#00000050" }} />
                <YAxis tick={{ fontSize: 10, fill: "#00000050" }} />
                <Tooltip />
                <Bar dataKey="orders" name={L ? "الطلبات" : "Orders"} fill="#000" radius={[4, 4, 0, 0]} />
                <Bar dataKey="newClients" name={L ? "عملاء جدد" : "New Clients"} fill="#d1d5db" radius={[4, 4, 0, 0]} />
                <Legend formatter={(v) => <span className="text-[11px]">{v}</span>} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Status Dist + Payment Methods ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60">{L ? "توزيع حالات الطلبات" : "Order Status Distribution"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[180px]">
              <ResponsiveContainer width="55%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                    {pieData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 flex flex-col justify-center gap-1.5 text-xs">
                {pieData.map((e: any, i: number) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: e.color }} />
                    <span className="text-black/60 dark:text-white/60 truncate">{e.name}</span>
                    <span className="font-bold text-black dark:text-white mr-auto">{e.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60">{L ? "طرق الدفع" : "Payment Methods"}</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentPieData.length === 0 ? (
              <p className="text-sm text-black/30 text-center py-10">{L ? "لا توجد بيانات" : "No data available"}</p>
            ) : (
              <div className="space-y-2.5 mt-1">
                {paymentPieData.map((p: any, i: number) => {
                  const totalCount = paymentPieData.reduce((s: number, x: any) => s + x.value, 0);
                  const pct = totalCount > 0 ? Math.round((p.value / totalCount) * 100) : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-black/60 dark:text-white/60 font-medium">{p.name}</span>
                        <span className="font-bold text-black dark:text-white flex items-center gap-1">{p.value} {L ? "طلب" : "orders"} · {(p.revenue || 0).toLocaleString()} <SARIcon size={11} className="opacity-70" /></span>
                      </div>
                      <div className="h-1.5 bg-black/[0.05] dark:bg-white/[0.05] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: p.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Top Clients + Sector Dist ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-1.5">
              <Star className="w-4 h-4" /> {L ? "أعلى العملاء إنفاقاً" : "Top Spending Clients"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.topClients || []).length === 0 ? (
              <p className="text-sm text-black/30 text-center py-8">{L ? "لا توجد بيانات" : "No data available"}</p>
            ) : (
              <div className="space-y-2.5">
                {(data?.topClients || []).map((c: any, i: number) => {
                  const maxSpent = data.topClients[0]?.totalSpent || 1;
                  const pct = Math.round((c.totalSpent / maxSpent) * 100);
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-4 h-4 rounded-full bg-black/[0.06] dark:bg-white/[0.06] flex items-center justify-center text-[9px] font-bold text-black/40 dark:text-white/40 flex-shrink-0">{i + 1}</span>
                          <span className="text-black/70 dark:text-white/70 font-medium truncate">{c.fullName || c.username || (L ? "عميل" : "Client")}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-black/30 dark:text-white/30">{c.orderCount} {L ? "طلب" : "orders"}</span>
                          <span className="font-black text-black dark:text-white flex items-center gap-1">{(c.totalSpent || 0).toLocaleString()} <SARIcon size={12} className="opacity-70" /></span>
                        </div>
                      </div>
                      <div className="h-1 bg-black/[0.04] dark:bg-white/[0.04] rounded-full overflow-hidden">
                        <div className="h-full bg-black dark:bg-white rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" /> {L ? "توزيع القطاعات" : "Sector Distribution"}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[220px]">
            {(data?.sectorDist || []).length === 0 ? (
              <p className="text-sm text-black/30 text-center py-8">{L ? "لا توجد بيانات" : "No data available"}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(data?.sectorDist || []).slice(0, 7)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000008" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#00000050" }} />
                  <YAxis type="category" dataKey="_id" tick={{ fontSize: 10, fill: "#00000070" }} width={85} />
                  <Tooltip formatter={(v: any) => [v, L ? "طلبات" : "Orders"]} />
                  <Bar dataKey="count" fill="#000" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Attendance ── */}
      <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60">{L ? "نشاط الحضور هذا الشهر" : "Attendance Activity This Month"}</CardTitle>
        </CardHeader>
        <CardContent>
          {(data?.attendanceSummary || []).length === 0 ? (
            <p className="text-sm text-black/30 dark:text-white/30 text-center py-6">{L ? "لا يوجد سجل حضور هذا الشهر" : "No attendance records this month"}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {(data?.attendanceSummary || []).slice(0, 10).map((emp: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-black/[0.04] dark:border-white/[0.04]">
                  <span className="text-black/70 dark:text-white/70 font-medium truncate">{emp.fullName || emp.username || `${L ? "موظف" : "Employee"} #${i + 1}`}</span>
                  <div className="flex gap-4 flex-shrink-0">
                    <span className="text-black/30 dark:text-white/30 text-xs">{emp.days} {L ? "يوم" : "days"}</span>
                    <span className="font-bold text-black dark:text-white text-xs">{(emp.totalHours || 0).toFixed(1)} {L ? "س" : "hrs"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── QMeet Analytics ── */}
      {qmeet && (
        <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-2">
              <Video className="w-4 h-4" />
              إحصائيات QMeet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center rounded-xl bg-black/[0.02] dark:bg-white/[0.02] p-3">
                <p className="text-xl font-black text-black dark:text-white" data-testid="text-qmeet-total">{qmeet.totalMeetings}</p>
                <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">{L ? "إجمالي الاجتماعات" : "Total Meetings"}</p>
              </div>
              <div className="text-center rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3">
                <p className="text-xl font-black text-blue-600 dark:text-blue-400" data-testid="text-qmeet-month">{qmeet.thisMonthMeetings}</p>
                <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">{L ? "هذا الشهر" : "This Month"}</p>
              </div>
              <div className="text-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400" data-testid="text-qmeet-active">{qmeet.activeMeetings}</p>
                <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">{L ? "نشطة الآن" : "Active Now"}</p>
              </div>
            </div>
            {(qmeet.monthlyMeetings || []).length > 0 && (
              <div>
                <p className="text-xs text-black/40 dark:text-white/40 mb-2">{L ? "الاجتماعات الشهرية (آخر 6 أشهر)" : "Monthly Meetings (Last 6 Months)"}</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={qmeet.monthlyMeetings} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid rgba(0,0,0,0.07)" }} />
                    <Bar dataKey="count" name={L ? "اجتماعات" : "Meetings"} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Conversion Rate Card ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" />
              معدل التحويل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-black/[0.06] dark:text-white/[0.06]" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="2.5"
                    strokeDasharray={`${(data?.conversionRate || 0) * 0.999} 100`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-black dark:text-white">{data?.conversionRate || 0}%</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-black/50 dark:text-white/50">{L ? "طلّبوا (عملاء)" : "Placed Order (clients)"}</span>
                  <span className="font-bold text-black dark:text-white">{data?.clientsWithOrdersCount || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-black/50 dark:text-white/50">{L ? "إجمالي العملاء" : "Total Clients"}</span>
                  <span className="font-bold text-black dark:text-white">{stats.totalUsers || 0}</span>
                </div>
                <div className={`text-[10px] px-2 py-1 rounded-full font-bold text-center ${
                  (data?.conversionRate || 0) >= 60 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                  (data?.conversionRate || 0) >= 30 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                  "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                }`}>
                  {(data?.conversionRate || 0) >= 60 ? (L ? "ممتاز 🎉" : "Excellent 🎉") : (data?.conversionRate || 0) >= 30 ? (L ? "متوسط" : "Average") : (L ? "يحتاج تحسين" : "Needs Improvement")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Top 2 page heatmap cards ── */}
        <Card className="md:col-span-2 border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              خريطة حرارة الصفحات (الأكثر زيارة)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(data?.pageHeatmap || []).slice(0, 7).map((p: any, i: number) => {
                const max = (data?.pageHeatmap?.[0]?.visits || 1);
                const pct = Math.round((p.visits / max) * 100);
                const heat = pct >= 80 ? "bg-red-400" : pct >= 60 ? "bg-orange-400" : pct >= 40 ? "bg-amber-400" : pct >= 20 ? "bg-yellow-300" : "bg-gray-200 dark:bg-gray-700";
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] text-black/40 dark:text-white/40 w-4 text-center font-bold">{i + 1}</span>
                    <span className="text-xs text-black/70 dark:text-white/70 w-28 shrink-0 truncate">{p.page}</span>
                    <div className="flex-1 h-4 bg-black/[0.04] dark:bg-white/[0.04] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${heat} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-black/40 dark:text-white/40 w-14 text-left">{p.visits.toLocaleString()} {L ? "زيارة" : "visits"}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Contract Analytics ── */}
      {contractStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                {L ? "إحصائيات العقود الإلكترونية" : "Digital Contract Stats"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: L ? "إجمالي العقود" : "Total Contracts",    value: contractStats.total,       color: "text-black dark:text-white",   bg: "bg-black/5 dark:bg-white/5" },
                  { label: L ? "بانتظار التوقيع" : "Awaiting Sign",    value: contractStats.pending,     color: "text-amber-600",               bg: "bg-amber-50 dark:bg-amber-900/20" },
                  { label: L ? "موقّعة" : "Signed",                     value: contractStats.signed,      color: "text-green-600",               bg: "bg-green-50 dark:bg-green-900/20" },
                  { label: L ? "موثّقة بـ OTP" : "OTP Verified",       value: contractStats.otpVerified, color: "text-blue-600",                bg: "bg-blue-50 dark:bg-blue-900/20" },
                ].map((s, i) => (
                  <div key={i} className={`rounded-xl p-3 text-center ${s.bg}`}>
                    <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                    <div className="text-[10px] text-black/40 dark:text-white/40 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              {contractStats.total > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-black/50 dark:text-white/50"><ShieldCheck className="w-3 h-3 text-green-500" /> {L ? "نسبة التوقيع" : "Signing Rate"}</span>
                    <span className="font-bold text-black dark:text-white">{Math.round((contractStats.signed / contractStats.total) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-black/[0.05] dark:bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.round((contractStats.signed / contractStats.total) * 100)}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-black/50 dark:text-white/50"><ShieldCheck className="w-3 h-3 text-blue-500" /> {L ? "نسبة توثيق OTP" : "OTP Verification Rate"}</span>
                    <span className="font-bold text-black dark:text-white">{contractStats.signed > 0 ? Math.round((contractStats.otpVerified / contractStats.signed) * 100) : 0}%</span>
                  </div>
                  <div className="h-1.5 bg-black/[0.05] dark:bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${contractStats.signed > 0 ? Math.round((contractStats.otpVerified / contractStats.signed) * 100) : 0}%` }} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60">{L ? "العقود المنشأة والموقّعة (6 أشهر)" : "Contracts Created & Signed (6 mo)"}</CardTitle>
            </CardHeader>
            <CardContent className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contractStats.monthly || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000008" />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#888" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#888" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid rgba(0,0,0,0.07)" }} />
                  <Bar dataKey="created" name={L ? "منشأة" : "Created"} fill="#9ca3af" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="signed" name={L ? "موقّعة" : "Signed"} fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Legend formatter={(v) => <span className="text-[11px]">{v}</span>} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Employee Performance ── */}
      {empData && (empData.employees || []).length > 0 && (
        <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-500" />
              {L ? "أداء الفريق" : "Team Performance"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(empData.employees || []).slice(0, 8).map((emp: any, i: number) => (
                <div key={emp.id || i} className="space-y-1.5" data-testid={`row-employee-${emp.id}`}>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-black/[0.06] dark:bg-white/[0.06] flex items-center justify-center text-[9px] font-bold text-black/40 dark:text-white/40 flex-shrink-0">{i + 1}</span>
                      <div className="min-w-0">
                        <span className="font-semibold text-black/80 dark:text-white/80 truncate block">{emp.name}</span>
                        <span className="text-[10px] text-black/30 dark:text-white/30">{emp.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 text-[11px]">
                      <span className="text-black/40 dark:text-white/40 flex items-center gap-1"><ListChecks className="w-3 h-3" /> {emp.tasksCompleted}/{emp.tasksAssigned}</span>
                      <span className="text-black/40 dark:text-white/40 flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> {emp.ordersHandled}</span>
                      <span className="text-black/40 dark:text-white/40 flex items-center gap-1"><Clock className="w-3 h-3" /> {emp.attendanceDays} {L ? "يوم" : "d"}</span>
                      <span className={`font-black text-xs ${emp.completionRate >= 80 ? "text-green-600" : emp.completionRate >= 50 ? "text-amber-600" : "text-black/50 dark:text-white/50"}`}>
                        {emp.completionRate}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1 bg-black/[0.04] dark:bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${emp.completionRate >= 80 ? "bg-green-500" : emp.completionRate >= 50 ? "bg-amber-400" : "bg-gray-300 dark:bg-gray-600"}`}
                      style={{ width: `${emp.completionRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-black/[0.06] dark:border-white/[0.06] pt-3">
              {[
                { label: L ? "إجمالي المهام" : "Total Tasks",     value: (empData.employees || []).reduce((s: number, e: any) => s + e.tasksAssigned, 0) },
                { label: L ? "مكتملة" : "Completed",             value: (empData.employees || []).reduce((s: number, e: any) => s + e.tasksCompleted, 0) },
                { label: L ? "أيام حضور (الشهر)" : "Attendance Days (mo)", value: (empData.employees || []).reduce((s: number, e: any) => s + e.attendanceDays, 0) },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-base font-black text-black dark:text-white">{s.value}</div>
                  <div className="text-[10px] text-black/40 dark:text-white/40">{s.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Year-over-Year Revenue Comparison ── */}
      <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            {L ? "مقارنة الإيرادات" : "Revenue Comparison"}: {new Date().getFullYear()} {L ? "مقابل" : "vs"} {new Date().getFullYear() - 1}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.yearlyComparison || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000008" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#00000060" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#00000060" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: any, name: string) => [`${Number(v).toLocaleString()}`, name === "thisYear" ? String(new Date().getFullYear()) : String(new Date().getFullYear() - 1)]}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid rgba(0,0,0,0.07)" }}
              />
              <Legend formatter={(v) => v === "thisYear" ? String(new Date().getFullYear()) : String(new Date().getFullYear() - 1)} />
              <Bar dataKey="thisYear" name="thisYear" fill="#000" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lastYear" name="lastYear" fill="#9ca3af" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Email Report ── */}
      <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            إرسال تقرير بالبريد الإلكتروني
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-black/50 dark:text-white/45">{L ? "أرسل تقريراً شهرياً شاملاً بالإحصائيات إلى بريدك الإلكتروني." : "Send a comprehensive monthly statistics report to your email."}</p>
          {showEmailInput && (
            <Input
              value={reportEmail}
              onChange={e => setReportEmail(e.target.value)}
              placeholder={L ? "email@example.com (اتركه فارغاً لإرساله إلى بريد النظام)" : "email@example.com (leave blank to send to system email)"}
              type="email"
              className="text-sm"
              data-testid="input-report-email"
            />
          )}
          <div className="flex gap-2">
            {!showEmailInput && (
              <Button variant="outline" size="sm" onClick={() => setShowEmailInput(true)} data-testid="button-show-email-input">
                <Mail className="w-3.5 h-3.5 ml-1" />
                {L ? "إرسال تقرير" : "Send Report"}
              </Button>
            )}
            {showEmailInput && (
              <>
                <Button size="sm" onClick={() => reportMutation.mutate()} disabled={reportMutation.isPending} data-testid="button-send-report">
                  {reportMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" /> : <Send className="w-3.5 h-3.5 ml-1" />}
                  {L ? "إرسال" : "Send"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setShowEmailInput(false); setReportEmail(""); }}>{L ? "إلغاء" : "Cancel"}</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
