import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SARIcon from "@/components/SARIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Wallet, TrendingUp, Users, CreditCard, Clock, Ban, Plus, Trash2,
  BarChart3, FileText, Building2, ShoppingBag, AlertCircle, CheckCircle, XCircle, Mail
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

type Period = "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "semiannual" | "annual";

const PERIOD_LABELS: Record<Period, string> = {
  daily: "يومي", weekly: "أسبوعي", biweekly: "أسبوعان",
  monthly: "شهري", quarterly: "ربع سنوي", semiannual: "نصف سنوي", annual: "سنوي",
};

const EXPENSE_CATS: Record<string, { label: string; color: string }> = {
  operational: { label: "تشغيلي", color: "bg-black/10 text-black" },
  marketing: { label: "تسويقي", color: "bg-black/[0.06] text-black" },
  admin: { label: "إداري", color: "bg-black/[0.04] text-black/70" },
  product: { label: "منتج", color: "bg-black/[0.08] text-black" },
  other: { label: "أخرى", color: "bg-black/[0.03] text-black/60" },
};

export default function AdminFinance() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const qc = useQueryClient();
  const [period, setPeriod] = useState<Period>("monthly");
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "expenses" | "email">("overview");
  const [testEmail, setTestEmail] = useState("");
  const [emailType, setEmailType] = useState("welcome");
  const [emailResult, setEmailResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [newExp, setNewExp] = useState({ category: "operational", description: "", amount: "", date: "", notes: "" });
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [expMonth, setExpMonth] = useState(currentMonth);

  // Queries
  const { data: summary } = useQuery<{
    totalRevenue: number; monthRevenue: number; unpaidTotal: number;
    cancelledTotal: number; totalOrders: number; activeClients: number;
    monthlyBreakdown?: { name: string; value: number }[];
  }>({
    queryKey: ["/api/admin/finance/summary"],
    queryFn: async () => { const r = await fetch("/api/admin/finance/summary", { credentials: "include" }); return r.json(); },
  });

  const { data: reports, isLoading: reportsLoading } = useQuery<{ period: string; data: { name: string; value: number; count: number }[] }>({
    queryKey: ["/api/admin/finance/reports", period],
    queryFn: async () => { const r = await fetch(`/api/admin/finance/reports?period=${period}`, { credentials: "include" }); return r.json(); },
  });

  const { data: projectsData } = useQuery<{ projects: any[]; totalRemaining: number; count: number }>({
    queryKey: ["/api/admin/finance/projects-payments"],
    queryFn: async () => { const r = await fetch("/api/admin/finance/projects-payments", { credentials: "include" }); return r.json(); },
    enabled: activeTab === "projects",
  });

  const { data: expensesData, isLoading: expLoading } = useQuery<{ expenses: any[]; total: number }>({
    queryKey: ["/api/admin/finance/operational-expenses", expMonth],
    queryFn: async () => { const r = await fetch(`/api/admin/finance/operational-expenses?month=${expMonth}`, { credentials: "include" }); return r.json(); },
    enabled: activeTab === "expenses",
  });

  const addExpMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/admin/finance/operational-expenses", {
        category: newExp.category, description: newExp.description,
        amount: Number(newExp.amount), date: newExp.date || undefined, notes: newExp.notes,
      });
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/finance/operational-expenses"] });
      setNewExp({ category: "operational", description: "", amount: "", date: "", notes: "" });
      toast({ title: L ? "تم إضافة المصروف" : "Expense added" });
    },
    onError: () => toast({ title: L ? "فشل إضافة المصروف" : "Failed", variant: "destructive" }),
  });

  const deleteExpMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/finance/operational-expenses/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/finance/operational-expenses"] });
      toast({ title: L ? "تم حذف المصروف" : "Expense deleted" });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/admin/test-email", { type: emailType, to: testEmail || undefined });
      return r.json();
    },
    onSuccess: (d) => {
      setEmailResult({ ok: true, msg: d.message || (L ? "تم الإرسال" : "Sent") });
      toast({ title: L ? "تم إرسال البريد التجريبي" : "Test email sent" });
    },
    onError: async (err: any) => {
      const msg = err?.message || (L ? "فشل الإرسال" : "Send failed");
      setEmailResult({ ok: false, msg });
      toast({ title: L ? "فشل إرسال البريد" : "Email send failed", variant: "destructive" });
    },
  });

  const chartData = reports?.data || [];
  const totalChartRevenue = chartData.reduce((s, d) => s + d.value, 0);
  const totalExpenses = expensesData?.total || 0;
  const netProfit = (summary?.totalRevenue || 0) - totalExpenses;

  const expByCategory = (expensesData?.expenses || []).reduce((acc: Record<string, number>, e: any) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const tabs = [
    { key: "overview", label: L ? "نظرة عامة" : "Overview", icon: BarChart3 },
    { key: "projects", label: L ? "دفعات المشاريع" : "Project Payments", icon: FileText },
    { key: "expenses", label: L ? "المصاريف" : "Expenses", icon: ShoppingBag },
    { key: "email", label: L ? "نظام البريد" : "Email System", icon: Mail },
  ];

  return (
    <div className="relative overflow-hidden space-y-6" dir={dir}>
      <PageGraphics variant="dashboard" />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-black">{L ? "الإدارة المالية" : "Finance Management"}</h1>
          <p className="text-xs text-black/35">{L ? "تحليلات شاملة — الإيرادات والمصاريف والأرباح" : "Full analytics — revenue, expenses & profit"}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-black/[0.07] shadow-none rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-black/60">{L ? "إجمالي الأرباح" : "Total Revenue"}</CardTitle>
            <TrendingUp className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-black flex items-center gap-1" data-testid="text-total-revenue">
              {(summary?.totalRevenue || 0).toLocaleString()} <SARIcon size={14} className="opacity-60" />
            </div>
            <p className="text-xs text-black/30 mt-1">{L ? "فواتير مدفوعة فقط" : "Paid invoices only"}</p>
          </CardContent>
        </Card>

        <Card className="border-black/[0.07] shadow-none rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-black/60">{L ? "هذا الشهر" : "This Month"}</CardTitle>
            <Users className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-black flex items-center gap-1" data-testid="text-month-revenue">
              {(summary?.monthRevenue || 0).toLocaleString()} <SARIcon size={14} className="opacity-60" />
            </div>
            <p className="text-xs text-black/30 mt-1">{summary?.activeClients || 0} {L ? "عميل نشط" : "active clients"}</p>
          </CardContent>
        </Card>

        <Card className="border-black/10 shadow-none rounded-2xl bg-black/[0.04]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-black">{L ? "مبالغ معلقة" : "Pending"}</CardTitle>
            <Clock className="h-4 w-4 text-black" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-black flex items-center gap-1" data-testid="text-pending-amount">
              {(summary?.unpaidTotal || 0).toLocaleString()} <SARIcon size={14} className="opacity-60" />
            </div>
            <p className="text-xs text-black/60 mt-1">{L ? "فواتير غير مدفوعة" : "Unpaid invoices"}</p>
          </CardContent>
        </Card>

        <Card className="border-black/10 shadow-none rounded-2xl bg-black/[0.04]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-black">{L ? "ملغاة/مرفوضة" : "Cancelled"}</CardTitle>
            <Ban className="h-4 w-4 text-black/70" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-black flex items-center gap-1" data-testid="text-cancelled-amount">
              {(summary?.cancelledTotal || 0).toLocaleString()} <SARIcon size={14} className="opacity-60" />
            </div>
            <p className="text-xs text-black/60 mt-1">{L ? "لا تُحتسب في الأرباح" : "Not in revenue"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-black/[0.06] overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === t.key ? "border-black text-black" : "border-transparent text-black/40 hover:text-black/60"}`}
              data-testid={`tab-${t.key}`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* === TAB: Overview === */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Period selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-black/50">{L ? "عرض التقرير حسب:" : "Report by:"}</span>
            <div className="flex gap-1 flex-wrap">
              {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
                <button key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === p ? "bg-black text-white" : "bg-black/[0.04] text-black/50 hover:bg-black/[0.08]"}`}
                  data-testid={`button-period-${p}`}>
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Revenue chart */}
          <Card className="border-black/[0.07] shadow-none rounded-2xl">
            <CardHeader className="px-5 pt-5 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-black/70">
                  {L ? `تقرير الإيرادات — ${PERIOD_LABELS[period]}` : `Revenue Report — ${PERIOD_LABELS[period]}`}
                </CardTitle>
                <div className="flex items-center gap-1 text-sm font-black text-black">
                  {totalChartRevenue.toLocaleString()} <SARIcon size={11} className="opacity-60" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[260px] px-2">
              {reportsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-black/20" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {period === "annual" ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#00000008" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#00000050" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#00000050" }} />
                      <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} ${L ? "ر.س" : "SAR"}`, L ? "الإيراد" : "Revenue"]} />
                      <Line type="monotone" dataKey="value" stroke="#000" strokeWidth={2.5} dot={{ fill: "#000", r: 4 }} />
                    </LineChart>
                  ) : (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#00000008" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#00000050" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#00000050" }} />
                      <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} ${L ? "ر.س" : "SAR"}`, L ? "الإيراد" : "Revenue"]} />
                      <Bar dataKey="value" fill="#000" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Stats row */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-black/[0.02] border border-black/[0.06] rounded-xl p-4 text-center">
                <p className="text-[10px] text-black/40 mb-1">{L ? "المتوسط" : "Average"}</p>
                <p className="text-lg font-black text-black flex items-center justify-center gap-1">
                  {Math.round(totalChartRevenue / Math.max(chartData.filter(d => d.value > 0).length, 1)).toLocaleString()}
                  <SARIcon size={10} className="opacity-50" />
                </p>
              </div>
              <div className="bg-black/[0.02] border border-black/[0.06] rounded-xl p-4 text-center">
                <p className="text-[10px] text-black/40 mb-1">{L ? "الأعلى" : "Highest"}</p>
                <p className="text-lg font-black text-black flex items-center justify-center gap-1">
                  {Math.max(...chartData.map(d => d.value)).toLocaleString()}
                  <SARIcon size={10} className="opacity-50" />
                </p>
              </div>
              <div className="bg-black/[0.02] border border-black/[0.06] rounded-xl p-4 text-center">
                <p className="text-[10px] text-black/40 mb-1">{L ? "عدد الفواتير" : "Invoices"}</p>
                <p className="text-lg font-black text-black">{chartData.reduce((s, d) => s + d.count, 0)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === TAB: Project Payments === */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          {projectsData && (
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="bg-black rounded-2xl p-4 text-white">
                <p className="text-xs text-white/60 mb-1">{L ? "إجمالي المبالغ المتبقية في السوق" : "Total Remaining in Market"}</p>
                <p className="text-2xl font-black flex items-center gap-1">
                  {(projectsData.totalRemaining || 0).toLocaleString()} <SARIcon size={14} className="opacity-70" />
                </p>
                <p className="text-xs text-white/50 mt-1">{projectsData.count} {L ? "مشروع بدفعات متبقية" : "projects with remaining"}</p>
              </div>
              <div className="bg-black/[0.04] border border-black/[0.07] rounded-2xl p-4">
                <p className="text-xs text-black/50 mb-1">{L ? "إجمالي المشاريع" : "Total Projects"}</p>
                <p className="text-2xl font-black text-black">{projectsData.projects?.length || 0}</p>
                <p className="text-xs text-black/30 mt-1">{L ? "في حالة نشطة" : "in active states"}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {!projectsData ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-black/20" /></div>
            ) : (projectsData.projects || []).filter((p: any) => p.remaining > 0).length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-10 h-10 text-black/15 mx-auto mb-3" />
                <p className="text-black/30 text-sm">{L ? "جميع المشاريع مدفوعة بالكامل" : "All projects are fully paid"}</p>
              </div>
            ) : (
              (projectsData.projects || []).filter((p: any) => p.remaining > 0).map((project: any) => (
                <div key={project.id} className="border border-black/[0.08] rounded-2xl p-4 flex items-center justify-between gap-4"
                  data-testid={`project-payment-row-${project.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-black text-sm truncate">{project.businessName}</span>
                      <Badge variant="outline" className="text-[10px] border-black/10">{project.status}</Badge>
                    </div>
                    <p className="text-xs text-black/40 mt-0.5">{project.clientName} · #{project.orderNumber || project.id.slice(-6)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-sm font-black text-black">
                      {project.remaining.toLocaleString()} <SARIcon size={11} className="opacity-60" />
                    </div>
                    <div className="text-[10px] text-black/30">
                      {L ? "من" : "of"} {project.totalAmount.toLocaleString()} · {L ? "مدفوع" : "paid"}: {project.totalPaid.toLocaleString()}
                    </div>
                  </div>
                  <div className="w-20 flex-shrink-0">
                    <div className="h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-black rounded-full transition-all"
                        style={{ width: `${Math.min(100, (project.totalPaid / project.totalAmount) * 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-black/30 text-center mt-0.5">
                      {Math.round((project.totalPaid / project.totalAmount) * 100)}%
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* === TAB: Expenses === */}
      {activeTab === "expenses" && (
        <div className="space-y-5">
          {/* Month selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-black/50">{L ? "الشهر:" : "Month:"}</span>
            <Input type="month" value={expMonth} onChange={e => setExpMonth(e.target.value)}
              className="h-8 w-40 text-xs border-black/10" data-testid="input-expense-month" />
          </div>

          {/* Category breakdown */}
          {expensesData && expensesData.total > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.entries(expByCategory).map(([cat, amt]) => (
                <div key={cat} className="bg-black/[0.02] border border-black/[0.06] rounded-xl p-3 text-center">
                  <p className="text-[10px] text-black/40 mb-1">{EXPENSE_CATS[cat]?.label || cat}</p>
                  <p className="text-sm font-black text-black flex items-center justify-center gap-0.5">
                    {(amt as number).toLocaleString()} <SARIcon size={9} className="opacity-50" />
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Net Profit Card */}
          {expensesData && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-black/[0.03] border border-black/[0.06] rounded-xl p-3 text-center">
                <p className="text-[10px] text-black/40 mb-1">{L ? "إجمالي الإيرادات" : "Revenue"}</p>
                <p className="text-base font-black text-black flex items-center justify-center gap-1">
                  {(summary?.totalRevenue || 0).toLocaleString()} <SARIcon size={10} className="opacity-50" />
                </p>
              </div>
              <div className="bg-black/[0.03] border border-black/[0.06] rounded-xl p-3 text-center">
                <p className="text-[10px] text-black/40 mb-1">{L ? `مصاريف ${expMonth}` : `Expenses ${expMonth}`}</p>
                <p className="text-base font-black text-black flex items-center justify-center gap-1">
                  {totalExpenses.toLocaleString()} <SARIcon size={10} className="opacity-50" />
                </p>
              </div>
              <div className={`border rounded-xl p-3 text-center ${netProfit >= 0 ? "bg-black border-black" : "bg-black/[0.08] border-black/20"}`}>
                <p className={`text-[10px] mb-1 ${netProfit >= 0 ? "text-white/60" : "text-black/40"}`}>{L ? "صافي الربح" : "Net Profit"}</p>
                <p className={`text-base font-black flex items-center justify-center gap-1 ${netProfit >= 0 ? "text-white" : "text-black"}`}>
                  {netProfit.toLocaleString()} <SARIcon size={10} className="opacity-60" />
                </p>
              </div>
            </div>
          )}

          {/* Add expense form */}
          <div className="border border-dashed border-black/[0.12] rounded-2xl p-4">
            <p className="text-[10px] font-bold text-black/40 uppercase tracking-wide mb-3">{L ? "إضافة مصروف جديد" : "Add New Expense"}</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Select value={newExp.category} onValueChange={v => setNewExp(p => ({ ...p, category: v }))}>
                <SelectTrigger className="h-8 text-xs border-black/10" data-testid="select-expense-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPENSE_CATS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder={L ? "وصف المصروف *" : "Description *"} value={newExp.description}
                onChange={e => setNewExp(p => ({ ...p, description: e.target.value }))}
                className="h-8 text-xs border-black/10 col-span-1 md:col-span-2" data-testid="input-expense-description" />
              <Input type="number" placeholder={L ? "المبلغ *" : "Amount *"} value={newExp.amount}
                onChange={e => setNewExp(p => ({ ...p, amount: e.target.value }))}
                className="h-8 text-xs border-black/10" dir="ltr" data-testid="input-expense-amount" />
              <Input type="date" value={newExp.date} onChange={e => setNewExp(p => ({ ...p, date: e.target.value }))}
                className="h-8 text-xs border-black/10" data-testid="input-expense-date" />
            </div>
            <Button className="mt-2 h-8 text-xs bg-black text-white gap-1" onClick={() => addExpMutation.mutate()}
              disabled={addExpMutation.isPending || !newExp.description || !newExp.amount} data-testid="button-add-expense">
              {addExpMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              {L ? "إضافة" : "Add"}
            </Button>
          </div>

          {/* Expenses list */}
          {expLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-black/20" /></div>
          ) : (expensesData?.expenses || []).length === 0 ? (
            <div className="text-center py-10">
              <AlertCircle className="w-8 h-8 text-black/15 mx-auto mb-2" />
              <p className="text-black/30 text-sm">{L ? `لا مصاريف مسجلة لـ ${expMonth}` : `No expenses for ${expMonth}`}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(expensesData?.expenses || []).map((e: any) => (
                <div key={e.id} className="border border-black/[0.07] rounded-xl px-4 py-3 flex items-center gap-3"
                  data-testid={`expense-row-${e.id}`}>
                  <Badge className={`text-[10px] flex-shrink-0 ${EXPENSE_CATS[e.category]?.color || ""}`}>
                    {EXPENSE_CATS[e.category]?.label || e.category}
                  </Badge>
                  <span className="flex-1 text-sm text-black truncate">{e.description}</span>
                  {e.notes && <span className="text-xs text-black/30 truncate hidden md:block">{e.notes}</span>}
                  <span className="text-xs text-black/40 flex-shrink-0">
                    {new Date(e.date || e.createdAt).toLocaleDateString("ar-SA")}
                  </span>
                  <span className="font-black text-sm text-black flex items-center gap-0.5 flex-shrink-0">
                    {e.amount.toLocaleString()} <SARIcon size={10} className="opacity-50" />
                  </span>
                  <button onClick={() => { if (confirm(L ? "حذف؟" : "Delete?")) deleteExpMutation.mutate(e.id); }}
                    className="text-black/25 hover:text-black transition-colors flex-shrink-0"
                    data-testid={`button-delete-expense-${e.id}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="border-t border-black/[0.06] pt-3 flex justify-between items-center px-1">
                <span className="text-xs font-bold text-black/50">{L ? "إجمالي المصاريف" : "Total Expenses"}</span>
                <span className="font-black text-black flex items-center gap-1">
                  {totalExpenses.toLocaleString()} <SARIcon size={11} className="opacity-60" />
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === TAB: Email === */}
      {activeTab === "email" && (
        <div className="bg-white border border-black/[0.07] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-black/[0.05] rounded-xl flex items-center justify-center">
              <Mail className="w-4 h-4 text-black/50" />
            </div>
            <div>
              <h2 className="font-black text-black text-sm">{L ? "اختبار نظام البريد الإلكتروني" : "Email System Test"}</h2>
              <p className="text-[11px] text-black/35">{L ? "تحقق من عمل SMTP2GO" : "Verify SMTP2GO"}</p>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-black/50 mb-1.5 block">{L ? "نوع البريد" : "Email Type"}</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "welcome", label: L ? "ترحيب" : "Welcome" },
                { value: "otp", label: "OTP" },
                { value: "order", label: L ? "تأكيد طلب" : "Order" },
                { value: "status", label: L ? "تحديث حالة" : "Status" },
                { value: "message", label: L ? "رسالة" : "Message" },
              ].map(et => (
                <button key={et.value} onClick={() => setEmailType(et.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${emailType === et.value ? "bg-black text-white" : "bg-black/[0.04] text-black/50 hover:bg-black/[0.08]"}`}
                  data-testid={`button-email-type-${et.value}`}>
                  {et.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-black/50 mb-1.5 block">{L ? "البريد المستهدف" : "Target Email"}</label>
            <Input type="email" placeholder="test@example.com" value={testEmail}
              onChange={e => setTestEmail(e.target.value)} className="h-9 text-sm border-black/[0.10]" dir="ltr"
              data-testid="input-test-email" />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => { setEmailResult(null); testEmailMutation.mutate(); }}
              disabled={testEmailMutation.isPending} className="bg-black text-white h-10 px-6 rounded-xl text-sm font-bold"
              data-testid="button-send-test-email">
              {testEmailMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Mail className="w-4 h-4 ml-2" />}
              {L ? "إرسال بريد تجريبي" : "Send Test Email"}
            </Button>
            {emailResult && (
              <div className={`flex items-center gap-2 text-xs font-medium text-black`}>
                {emailResult.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {emailResult.msg}
              </div>
            )}
          </div>
          <div className="bg-black/[0.02] border border-black/[0.06] rounded-xl p-4 text-xs space-y-1">
            <p className="font-bold text-black/50 mb-2">{L ? "إعدادات SMTP2GO:" : "SMTP2GO Settings:"}</p>
            <p className="text-black/35">{L ? "المرسل" : "Sender"}: <span className="font-mono text-black/60">noreply@qiroxstudio.online</span></p>
            <p className="text-black/35">API: <span className="font-mono text-black/60">api-5CC7...D332 ✓</span></p>
          </div>
        </div>
      )}
    </div>
  );
}
