import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Users, ShoppingCart, Clock, BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import * as XLSX from "xlsx";

interface AnalyticsData {
  monthlyData: { label: string; orders: number; revenue: number }[];
  stats: { totalUsers: number; totalEmployees: number; totalOrders: number; pendingOrders: number; totalRevenue: number };
  attendanceSummary: { _id: string; totalHours: number; days: number }[];
  statusDist: { _id: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b", approved: "#3b82f6", in_progress: "#8b5cf6",
  completed: "#10b981", rejected: "#ef4444", delivered: "#06b6d4",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار", approved: "مقبول", in_progress: "قيد التنفيذ",
  completed: "مكتمل", rejected: "مرفوض", delivered: "تم التسليم",
};

export default function AdminAnalytics() {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics"],
    queryFn: async () => {
      const r = await fetch("/api/admin/analytics");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    refetchInterval: 60000,
  });

  const exportToExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(data.monthlyData);
    XLSX.utils.book_append_sheet(wb, ws1, "البيانات الشهرية");
    const ws2 = XLSX.utils.json_to_sheet(data.statusDist.map(s => ({ الحالة: STATUS_LABELS[s._id] || s._id, العدد: s.count })));
    XLSX.utils.book_append_sheet(wb, ws2, "توزيع الطلبات");
    XLSX.writeFile(wb, "qirox-analytics.xlsx");
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" />
    </div>
  );

  const pieData = (data?.statusDist || []).map(s => ({
    name: STATUS_LABELS[s._id] || s._id,
    value: s.count,
    color: STATUS_COLORS[s._id] || "#6b7280",
  }));

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black dark:text-white">لوحة التحليلات المتقدمة</h1>
            <p className="text-xs text-black/35 dark:text-white/35">بيانات حقيقية من قاعدة البيانات</p>
          </div>
        </div>
        <Button onClick={exportToExcel} variant="outline" size="sm" className="gap-2 border-black/10 dark:border-white/10 dark:text-white">
          <Download className="w-4 h-4" />
          تصدير Excel
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "إجمالي الإيرادات", value: `${(data?.stats.totalRevenue || 0).toLocaleString()} ر.س`, icon: TrendingUp, color: "text-green-500" },
          { label: "العملاء", value: data?.stats.totalUsers || 0, icon: Users, color: "text-blue-500" },
          { label: "الموظفون", value: data?.stats.totalEmployees || 0, icon: Users, color: "text-purple-500" },
          { label: "إجمالي الطلبات", value: data?.stats.totalOrders || 0, icon: ShoppingCart, color: "text-yellow-500" },
          { label: "طلبات معلقة", value: data?.stats.pendingOrders || 0, icon: Clock, color: "text-red-500" },
        ].map((s, i) => (
          <Card key={i} className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-black/40 dark:text-white/40">{s.label}</span>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-xl font-black text-black dark:text-white">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Revenue + Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60">الإيرادات الشهرية (ر.س)</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000008" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#00000050" }} />
                <YAxis tick={{ fontSize: 10, fill: "#00000050" }} />
                <Tooltip formatter={(v) => [`${Number(v).toLocaleString()} ر.س`, "الإيراد"]} />
                <Bar dataKey="revenue" fill="#000" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60">الطلبات الشهرية</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000008" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#00000050" }} />
                <YAxis tick={{ fontSize: 10, fill: "#00000050" }} />
                <Tooltip formatter={(v) => [v, "طلبات"]} />
                <Line type="monotone" dataKey="orders" stroke="#000" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60">توزيع حالات الطلبات</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60">نشاط الحضور هذا الشهر</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.attendanceSummary || []).length === 0 ? (
              <p className="text-sm text-black/30 dark:text-white/30 text-center py-8">لا يوجد سجل حضور هذا الشهر</p>
            ) : (
              <div className="space-y-3">
                {(data?.attendanceSummary || []).slice(0, 8).map((emp: any, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-black/50 dark:text-white/50">موظف #{i + 1}</span>
                    <div className="flex gap-4">
                      <span className="text-black/30 dark:text-white/30 text-xs">{emp.days} يوم</span>
                      <span className="font-bold text-black dark:text-white">{(emp.totalHours || 0).toFixed(1)} ساعة</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
