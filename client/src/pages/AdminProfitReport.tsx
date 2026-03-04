// @ts-nocheck
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { Loader2, TrendingUp, TrendingDown, DollarSign, BarChart3, Search, ChevronDown, ChevronUp, Percent } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const categoryLabels: Record<string, { label: string; color: string }> = {
  hosting: { label: "استضافة", color: "bg-blue-50 text-blue-700" },
  domain: { label: "دومين", color: "bg-purple-50 text-purple-700" },
  freelancer: { label: "مستقل", color: "bg-orange-50 text-orange-700" },
  license: { label: "ترخيص", color: "bg-amber-50 text-amber-700" },
  ads: { label: "إعلانات", color: "bg-pink-50 text-pink-700" },
  design: { label: "تصميم", color: "bg-violet-50 text-violet-700" },
  salary: { label: "راتب", color: "bg-teal-50 text-teal-700" },
  commission: { label: "عمولة", color: "bg-cyan-50 text-cyan-700" },
  other: { label: "أخرى", color: "bg-black/[0.04] text-black/50" },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد المراجعة", color: "text-amber-600 bg-amber-50 border-amber-100" },
  approved: { label: "موافق عليه", color: "text-blue-600 bg-blue-50 border-blue-100" },
  in_progress: { label: "قيد التنفيذ", color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
  completed: { label: "مكتمل", color: "text-green-600 bg-green-50 border-green-100" },
  rejected: { label: "مرفوض", color: "text-red-600 bg-red-50 border-red-100" },
};

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1.5 bg-black/[0.04] rounded-full overflow-hidden w-24">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function AdminProfitReport() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"profit" | "revenue" | "margin">("profit");

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/profit-report"],
    queryFn: async () => {
      const r = await fetch("/api/admin/profit-report", { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    refetchInterval: 60000,
  });

  const orders: any[] = data?.orders || [];
  const totals = data?.totals || { revenue: 0, expenses: 0, netProfit: 0 };
  const overallMargin = totals.revenue > 0 ? ((totals.netProfit / totals.revenue) * 100).toFixed(1) : "0";

  const filtered = orders
    .filter(o => !search || o.businessName?.toLowerCase().includes(search.toLowerCase()) || o.client?.fullName?.toLowerCase().includes(search.toLowerCase()) || o.orderId?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "profit") return b.netProfit - a.netProfit;
      if (sortBy === "revenue") return b.revenue - a.revenue;
      return b.margin - a.margin;
    });

  const maxRevenue = Math.max(...filtered.map((o: any) => o.revenue || 0), 1);

  // Category breakdown across all orders
  const categoryTotals: Record<string, number> = {};
  orders.forEach(o => {
    (o.expenses || []).forEach((e: any) => {
      categoryTotals[e.category || "other"] = (categoryTotals[e.category || "other"] || 0) + (e.amount || 0);
    });
  });
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div className="relative overflow-hidden space-y-5" dir="rtl">
      <PageGraphics variant="dashboard" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-black text-black flex items-center gap-2.5">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5 text-white" />
            </div>
            تقرير التكاليف والأرباح
          </h1>
          <p className="text-xs text-black/35 mt-0.5">تحليل شامل لإيرادات ومصروفات وصافي أرباح كل الطلبات</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-black/20" />
        </div>
      ) : (
        <>
          {/* Totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <p className="text-[11px] text-blue-500 font-bold">إجمالي الإيرادات</p>
              </div>
              <p className="text-2xl font-black text-blue-700">{totals.revenue.toLocaleString()}</p>
              <p className="text-[10px] text-blue-400">ر.س من {orders.length} طلب</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <p className="text-[11px] text-red-500 font-bold">إجمالي التكاليف</p>
              </div>
              <p className="text-2xl font-black text-red-700">{totals.expenses.toLocaleString()}</p>
              <p className="text-[10px] text-red-400">ر.س مصروف</p>
            </div>
            <div className={`border rounded-2xl p-5 ${totals.netProfit >= 0 ? "bg-green-50 border-green-100" : "bg-orange-50 border-orange-100"}`}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className={`w-4 h-4 ${totals.netProfit >= 0 ? "text-green-600" : "text-orange-600"}`} />
                <p className={`text-[11px] font-bold ${totals.netProfit >= 0 ? "text-green-600" : "text-orange-600"}`}>صافي الربح</p>
              </div>
              <p className={`text-2xl font-black ${totals.netProfit >= 0 ? "text-green-700" : "text-orange-700"}`}>{totals.netProfit.toLocaleString()}</p>
              <p className={`text-[10px] ${totals.netProfit >= 0 ? "text-green-500" : "text-orange-500"}`}>ر.س صافي</p>
            </div>
            <div className="bg-black/[0.02] border border-black/[0.06] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-4 h-4 text-black/40" />
                <p className="text-[11px] text-black/50 font-bold">هامش الربح الكلي</p>
              </div>
              <p className="text-2xl font-black text-black/70">{overallMargin}%</p>
              <p className="text-[10px] text-black/30">متوسط الهامش</p>
            </div>
          </div>

          {/* Overall profit bar */}
          {totals.revenue > 0 && (
            <div className="bg-white border border-black/[0.06] rounded-2xl p-4">
              <div className="flex justify-between text-[10px] text-black/40 mb-2">
                <span>التكاليف {((totals.expenses / totals.revenue) * 100).toFixed(1)}%</span>
                <span>صافي الربح {overallMargin}%</span>
              </div>
              <div className="h-4 bg-black/[0.04] rounded-full overflow-hidden flex">
                <div className="h-full bg-red-400 transition-all" style={{ width: `${Math.min((totals.expenses / totals.revenue) * 100, 100)}%` }} />
                <div className="h-full bg-green-400 flex-1" />
              </div>
              <div className="flex gap-4 mt-2 text-[10px]">
                <span className="flex items-center gap-1 text-red-500"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />تكاليف</span>
                <span className="flex items-center gap-1 text-green-600"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />ربح صافي</span>
              </div>
            </div>
          )}

          {/* Category Breakdown */}
          {sortedCategories.length > 0 && (
            <div className="bg-white border border-black/[0.06] rounded-2xl p-4">
              <p className="text-[10px] font-bold text-black/40 uppercase tracking-wider mb-3">توزيع التكاليف حسب الفئة</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {sortedCategories.map(([cat, amt]) => {
                  const { label, color } = categoryLabels[cat] || categoryLabels.other;
                  const pct = totals.expenses > 0 ? ((amt / totals.expenses) * 100).toFixed(1) : "0";
                  return (
                    <div key={cat} className="bg-black/[0.02] rounded-xl p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${color}`}>{label}</span>
                      <p className="text-sm font-bold text-black/70 mt-1.5">{amt.toLocaleString()} ر.س</p>
                      <p className="text-[10px] text-black/30">{pct}% من التكاليف</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Orders Table */}
          <div className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-black/[0.05]">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/25" />
                <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)}
                  className="h-8 text-xs pr-9 border-black/[0.08]" />
              </div>
              <div className="flex gap-1">
                {(["profit", "revenue", "margin"] as const).map(s => (
                  <Button key={s} size="sm" variant={sortBy === s ? "default" : "outline"}
                    onClick={() => setSortBy(s)}
                    className={`text-[10px] h-7 px-2 ${sortBy === s ? "bg-black text-white" : "border-black/10 text-black/50"}`}>
                    {s === "profit" ? "الربح" : s === "revenue" ? "الإيراد" : "الهامش"}
                  </Button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <BarChart3 className="w-10 h-10 text-black/10 mx-auto mb-3" />
                <p className="text-sm text-black/30">لا توجد بيانات</p>
                <p className="text-xs text-black/20 mt-1">أضف مصروفات للطلبات من صفحة إدارة الطلبات</p>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.04]">
                {filtered.map((order: any) => {
                  const isExpanded = expanded === order.orderId;
                  const isProfit = order.netProfit >= 0;
                  const statusInfo = statusLabels[order.status] || { label: order.status, color: "text-black/50 bg-black/[0.03] border-black/[0.06]" };
                  return (
                    <div key={order.orderId}>
                      <div
                        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-black/[0.01] transition-colors"
                        onClick={() => setExpanded(isExpanded ? null : order.orderId)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-black truncate">{order.businessName || order.client?.fullName || "—"}</p>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                            {order.serviceType && <span className="text-[9px] text-black/30">{order.serviceType}</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <MiniBar value={order.revenue} max={maxRevenue} color="bg-blue-400" />
                            <span className="text-[10px] text-black/30">#{order.orderId?.slice(-8)}</span>
                            {order.expenseCount > 0 && (
                              <span className="text-[10px] text-black/30">{order.expenseCount} مصروف</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-left flex-shrink-0">
                          <div className="text-left">
                            <p className="text-[10px] text-black/30">إيراد</p>
                            <p className="text-xs font-bold text-blue-600">{order.revenue.toLocaleString()}</p>
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] text-black/30">تكاليف</p>
                            <p className="text-xs font-bold text-red-500">{order.totalExpenses.toLocaleString()}</p>
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] text-black/30">صافي</p>
                            <p className={`text-xs font-black ${isProfit ? "text-green-600" : "text-orange-600"}`}>{order.netProfit.toLocaleString()}</p>
                          </div>
                          <div className="w-12 text-left">
                            <p className={`text-xs font-bold ${isProfit ? "text-green-600" : "text-orange-600"}`}>{order.margin}%</p>
                          </div>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-black/25 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-black/25 flex-shrink-0" />}
                        </div>
                      </div>

                      {isExpanded && order.expenses?.length > 0 && (
                        <div className="bg-black/[0.01] border-t border-black/[0.04] px-6 py-3 space-y-1.5">
                          <p className="text-[10px] font-bold text-black/30 uppercase tracking-wider mb-2">تفاصيل المصروفات</p>
                          {order.expenses.map((e: any, i: number) => {
                            const cat = categoryLabels[e.category] || categoryLabels.other;
                            return (
                              <div key={i} className="flex items-center gap-3">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${cat.color}`}>{cat.label}</span>
                                <p className="text-xs text-black/50 flex-1">{e.description}</p>
                                <p className="text-xs font-bold text-red-500">{Number(e.amount).toLocaleString()} ر.س</p>
                              </div>
                            );
                          })}
                          <div className="pt-1.5 mt-1.5 border-t border-black/[0.06] flex justify-between">
                            <p className="text-[10px] text-black/30">إجمالي التكاليف</p>
                            <p className="text-xs font-black text-red-600">{order.totalExpenses.toLocaleString()} ر.س</p>
                          </div>
                        </div>
                      )}
                      {isExpanded && order.expenses?.length === 0 && (
                        <div className="bg-black/[0.01] border-t border-black/[0.04] px-6 py-3 text-center">
                          <p className="text-xs text-black/25">لا توجد مصروفات لهذا الطلب — أضفها من صفحة الطلبات</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
