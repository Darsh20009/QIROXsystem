import { useState } from "react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SARIcon from "@/components/SARIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, DollarSign, Download, RefreshCw, CheckCircle, Clock, Banknote, Plus, Briefcase, Trash2, Gift, TrendingUp, BadgeDollarSign, HelpCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { exportToExcel } from "@/lib/excel";

interface PayrollRecord {
  id: string;
  userId: { _id: string; fullName: string; email: string; role: string } | null;
  month: number; year: number; workHours: number; hourlyRate: number;
  baseSalary: number; bonuses: number; deductions: number; netSalary: number;
  status: string; paidAt?: string; notes?: string;
}

interface EmployeePayment {
  _id: string;
  userId: { _id: string; fullName: string; email: string; role: string } | null;
  addedBy?: { fullName: string; username: string } | null;
  projectName?: string; amount: number; type: string;
  description?: string; status: string; dueDate?: string; paidAt?: string; notes?: string;
  createdAt: string;
}

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  approved: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
};
const TYPE_LABELS: Record<string, [string, string]> = {
  salary:     ["راتب",   "Salary"],
  bonus:      ["مكافأة", "Bonus"],
  commission: ["عمولة",  "Commission"],
  allowance:  ["بدل",    "Allowance"],
  other:      ["أخرى",   "Other"],
};
const TYPE_COLOR: Record<string, string> = {
  salary: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
  bonus: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
  commission: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
  allowance: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
  other: "bg-gray-50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400",
};
function getStatusLabels(L: boolean): Record<string, string> { return { pending: L ? "معلق" : "Pending", approved: L ? "معتمد" : "Approved", paid: L ? "مدفوع" : "Paid" }; }

const EMPTY_FORM = { userId: "", projectName: "", amount: "", type: "salary", description: "", dueDate: "", notes: "" };

export default function AdminPayroll() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const STATUS_LABELS = getStatusLabels(L);
  const MONTHS = L ? MONTHS_AR : MONTHS_EN;
  const queryClient = useQueryClient();
  const now = new Date();
  const [tab, setTab] = useState<"payroll" | "payments">("payments");
  const [genMonth, setGenMonth] = useState(now.getMonth() + 1);
  const [genYear, setGenYear] = useState(now.getFullYear());
  const [editMap, setEditMap] = useState<Record<string, { bonuses?: number; deductions?: number }>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  /* ─── Payroll queries ─── */
  const { data: records, isLoading } = useQuery<PayrollRecord[]>({
    queryKey: ["/api/admin/payroll"],
    queryFn: async () => {
      const r = await fetch("/api/admin/payroll", { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  /* ─── Employees list for add-payment dropdown ─── */
  const { data: employees } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const r = await fetch("/api/admin/users", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
  });
  const nonClients = (employees || []).filter((u: any) => u.role !== "client");

  /* ─── Employee payments queries ─── */
  const { data: payments, isLoading: loadingPayments } = useQuery<EmployeePayment[]>({
    queryKey: ["/api/admin/employee-payments"],
    queryFn: async () => {
      const r = await fetch("/api/admin/employee-payments", { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  /* ─── Payroll mutations ─── */
  const generateMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/payroll/generate", { month: genMonth, year: genYear }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payroll"] });
      toast({ title: L ? `تم توليد كشف رواتب ${MONTHS_AR[genMonth - 1]} ${genYear}` : `Payroll for ${MONTHS_EN[genMonth - 1]} ${genYear} generated` });
    },
    onError: () => toast({ title: L ? "حدث خطأ" : "An error occurred", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/admin/payroll/${id}`, data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payroll"] });
      toast({ title: L ? "تم تحديث السجل" : "Record updated" });
    },
    onError: () => toast({ title: L ? "حدث خطأ" : "An error occurred", variant: "destructive" }),
  });

  /* ─── Employee payment mutations ─── */
  const addPaymentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/employee-payments", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employee-payments"] });
      toast({ title: L ? "تمت إضافة الاستحقاق بنجاح" : "Payment added successfully" });
      setAddOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: () => toast({ title: L ? "حدث خطأ" : "An error occurred", variant: "destructive" }),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/admin/employee-payments/${id}`, data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employee-payments"] });
      toast({ title: L ? "تم تحديث الاستحقاق" : "Payment updated" });
    },
    onError: () => toast({ title: L ? "حدث خطأ" : "An error occurred", variant: "destructive" }),
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/employee-payments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employee-payments"] });
      toast({ title: L ? "تم حذف الاستحقاق" : "Payment deleted" });
    },
    onError: () => toast({ title: L ? "حدث خطأ" : "An error occurred", variant: "destructive" }),
  });

  const exportExcel = () => {
    if (!records) return;
    exportToExcel(`payroll-${genYear}-${genMonth}.xlsx`, [{
      name: "كشف الرواتب",
      data: records.map(r => ({
        الموظف: r.userId?.fullName || "-",
        الدور: r.userId?.role || "-",
        الشهر: `${MONTHS[r.month - 1]} ${r.year}`,
        "ساعات العمل": r.workHours.toFixed(1),
        "سعر الساعة": r.hourlyRate,
        "الراتب الأساسي": r.baseSalary.toFixed(0),
        مكافآت: r.bonuses,
        خصومات: r.deductions,
        "صافي الراتب": r.netSalary.toFixed(0),
        الحالة: STATUS_LABELS[r.status],
      })),
    }]);
  };

  const total = (records || []).reduce((acc, r) => acc + r.netSalary, 0);
  const totalPayments = (payments || []).reduce((acc, p) => acc + p.amount, 0);
  const pendingTotal = (payments || []).filter(p => p.status !== "paid").reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="relative overflow-hidden space-y-6" dir={dir}>
      <PageGraphics variant="dashboard" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
            <Banknote className="w-5 h-5 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black dark:text-white">{L ? "إدارة الرواتب والاستحقاقات" : "Payroll & Payments"}</h1>
            <p className="text-xs text-black/35 dark:text-white/35">
              {tab === "payroll"
                ? <>{L ? "إجمالي:" : "Total:"} {total.toLocaleString()} <SARIcon size={10} className="opacity-60 inline" /></>
                : <>{L ? "إجمالي الاستحقاقات:" : "Total:"} {totalPayments.toLocaleString()} {L ? "ر.س" : "SAR"} — {L ? "معلق:" : "Pending:"} {pendingTotal.toLocaleString()} {L ? "ر.س" : "SAR"}</>
              }
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {tab === "payroll" && (
            <Button onClick={exportExcel} variant="outline" size="sm" className="gap-2 dark:text-white dark:border-white/10">
              <Download className="w-4 h-4" /> {L ? "تصدير" : "Export"}
            </Button>
          )}
          {tab === "payments" && (
            <Button onClick={() => setAddOpen(true)} size="sm" className="bg-black dark:bg-white text-white dark:text-black gap-2" data-testid="btn-add-payment">
              <Plus className="w-4 h-4" /> {L ? "إضافة استحقاق" : "Add Payment"}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] p-1 gap-1">
        <button
          onClick={() => setTab("payments")}
          className={`flex-1 text-sm font-bold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${tab === "payments" ? "bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm" : "text-black/40 dark:text-white/40"}`}
          data-testid="tab-payments"
        >
          <Briefcase className="w-3.5 h-3.5" />
          {L ? "الاستحقاقات" : "Payments"}
          {pendingTotal > 0 && <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{(payments || []).filter(p => p.status !== "paid").length}</span>}
        </button>
        <button
          onClick={() => setTab("payroll")}
          className={`flex-1 text-sm font-bold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${tab === "payroll" ? "bg-white dark:bg-gray-800 text-black dark:text-white shadow-sm" : "text-black/40 dark:text-white/40"}`}
          data-testid="tab-payroll"
        >
          <Banknote className="w-3.5 h-3.5" />
          {L ? "الرواتب الشهرية" : "Monthly Payroll"}
        </button>
      </div>

      {/* ═══════ PAYMENTS TAB ═══════ */}
      {tab === "payments" && (
        <div className="space-y-3">
          {loadingPayments ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" /></div>
          ) : (payments || []).length === 0 ? (
            <div className="text-center py-16 text-black/30 dark:text-white/30">
              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">{L ? "لا توجد استحقاقات حتى الآن" : "No payments yet"}</p>
              <p className="text-xs mt-1 opacity-70">{L ? "اضغط «إضافة استحقاق» لإضافة راتب أو مكافأة لموظف" : "Press «Add Payment» to add a salary or bonus"}</p>
            </div>
          ) : (
            (payments || []).map((p) => {
              const empName = p.userId?.fullName || "—";
              return (
                <Card key={p._id} className="border-black/[0.06] dark:border-white/[0.06] shadow-none rounded-2xl dark:bg-gray-900">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_COLOR[p.type] || TYPE_COLOR.other}`}>
                          {p.type === "bonus" ? <Gift className="w-4 h-4" /> :
                           p.type === "commission" ? <TrendingUp className="w-4 h-4" /> :
                           p.type === "allowance" ? <BadgeDollarSign className="w-4 h-4" /> :
                           p.type === "salary" ? <Banknote className="w-4 h-4" /> :
                           <HelpCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-black text-sm text-black dark:text-white">{empName}</p>
                          <p className="text-xs text-black/40 dark:text-white/40">
                            {L ? TYPE_LABELS[p.type]?.[0] : TYPE_LABELS[p.type]?.[1]}
                            {p.projectName ? ` — ${p.projectName}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-lg text-black dark:text-white">{p.amount.toLocaleString()} <span className="text-xs font-bold opacity-50">{L ? "ر.س" : "SAR"}</span></p>
                        <Badge className={`text-[10px] border ${STATUS_COLORS[p.status] || STATUS_COLORS.pending}`} variant="outline">
                          {STATUS_LABELS[p.status] || STATUS_LABELS.pending}
                        </Badge>
                      </div>
                    </div>

                    {p.description && (
                      <p className="text-xs text-black/50 dark:text-white/50 mb-3 bg-black/[0.02] dark:bg-white/[0.03] rounded-xl px-3 py-2">{p.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-black/30 dark:text-white/30 mb-3">
                      <span>{new Date(p.createdAt).toLocaleDateString(L ? "ar" : "en")}</span>
                      {p.dueDate && <><span>·</span><span>{L ? "الاستحقاق:" : "Due:"} {new Date(p.dueDate).toLocaleDateString(L ? "ar" : "en")}</span></>}
                      {p.paidAt && <><span>·</span><span className="text-emerald-600 dark:text-emerald-400">{L ? "صُرف:" : "Paid:"} {new Date(p.paidAt).toLocaleDateString(L ? "ar" : "en")}</span></>}
                      {p.addedBy && <><span>·</span><span>{L ? "بواسطة:" : "By:"} {p.addedBy.fullName || p.addedBy.username}</span></>}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {p.status === "pending" && (
                        <Button size="sm" variant="outline" className="h-8 text-xs dark:text-white dark:border-white/10 gap-1"
                          onClick={() => updatePaymentMutation.mutate({ id: p._id, data: { status: "approved" } })}>
                          <CheckCircle className="w-3 h-3" /> {L ? "اعتماد" : "Approve"}
                        </Button>
                      )}
                      {p.status !== "paid" && (
                        <Button size="sm" className="h-8 text-xs bg-black dark:bg-white text-white dark:text-black gap-1"
                          onClick={() => updatePaymentMutation.mutate({ id: p._id, data: { status: "paid" } })}
                          disabled={updatePaymentMutation.isPending}>
                          {updatePaymentMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                          {L ? "تأكيد الصرف" : "Mark Paid"}
                        </Button>
                      )}
                      {p.status === "paid" && p.paidAt && (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> {L ? "تم الصرف" : "Paid"}
                        </span>
                      )}
                      <Button size="sm" variant="outline" className="h-8 text-xs text-red-500 border-red-200 dark:border-red-900/40 dark:text-red-400 gap-1 mr-auto"
                        onClick={() => { if (confirm(L ? "حذف هذا الاستحقاق؟" : "Delete this payment?")) deletePaymentMutation.mutate(p._id); }}
                        disabled={deletePaymentMutation.isPending}>
                        <Trash2 className="w-3 h-3" /> {L ? "حذف" : "Delete"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* ═══════ PAYROLL TAB ═══════ */}
      {tab === "payroll" && (
        <div className="space-y-4">
          <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60">{L ? "توليد كشف راتب" : "Generate Payroll"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 flex-wrap items-end">
                <div>
                  <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? "الشهر" : "Month"}</label>
                  <Select value={genMonth.toString()} onValueChange={v => setGenMonth(Number(v))}>
                    <SelectTrigger className="w-32 border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS_AR.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">{L ? "السنة" : "Year"}</label>
                  <Input type="number" value={genYear} onChange={e => setGenYear(Number(e.target.value))}
                    className="w-24 border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white" />
                </div>
                <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}
                  className="bg-black dark:bg-white text-white dark:text-black gap-2">
                  {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {L ? "توليد الكشف" : "Generate"}
                </Button>
              </div>
              <p className="text-[11px] text-black/30 dark:text-white/30 mt-2">
                {L ? "يحسب الراتب تلقائياً من ساعات الحضور × سعر الساعة لكل موظف" : "Auto-calculates from attendance hours × hourly rate"}
              </p>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" /></div>
          ) : (records || []).length === 0 ? (
            <p className="text-center text-black/30 dark:text-white/30 py-16">{L ? "لا يوجد سجلات — اضغط «توليد الكشف» لبدء الحساب" : "No records — press Generate to start"}</p>
          ) : (
            <div className="space-y-3">
              {(records || []).map(rec => (
                <Card key={rec.id} className="border-black/[0.06] dark:border-white/[0.06] shadow-none rounded-2xl dark:bg-gray-900">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-black text-sm text-black dark:text-white">{rec.userId?.fullName || "-"}</span>
                          <Badge className={`text-[10px] px-2 py-0 border ${STATUS_COLORS[rec.status]}`} variant="outline">{STATUS_LABELS[rec.status]}</Badge>
                        </div>
                        <p className="text-xs text-black/40 dark:text-white/40">{MONTHS_AR[(rec.month || 1) - 1]} {rec.year} — {rec.userId?.role}</p>
                      </div>
                      <div className="text-left shrink-0">
                        <p className="font-black text-lg text-black dark:text-white flex items-center gap-1">{rec.netSalary.toLocaleString()} <SARIcon size={13} className="opacity-60" /></p>
                        <p className="text-[10px] text-black/30 dark:text-white/30 flex items-center gap-0.5">{rec.workHours.toFixed(1)} {L ? "ساعة" : "hrs"} × {rec.hourlyRate} <SARIcon size={9} className="opacity-60" /></p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3 text-center">
                      <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-lg p-2">
                        <p className="text-[10px] text-black/30 dark:text-white/30">{L ? "الأساسي" : "Basic"}</p>
                        <p className="font-bold text-sm text-black dark:text-white">{rec.baseSalary.toFixed(0)}</p>
                      </div>
                      <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-lg p-2">
                        <p className="text-[10px] text-black/30 dark:text-white/30">{L ? "مكافآت" : "Bonuses"}</p>
                        <p className="font-bold text-sm text-black dark:text-white">{rec.bonuses}</p>
                      </div>
                      <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-lg p-2">
                        <p className="text-[10px] text-black/30 dark:text-white/30">{L ? "خصومات" : "Deductions"}</p>
                        <p className="font-bold text-sm text-black dark:text-white">{rec.deductions}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Input type="number" placeholder={L ? "مكافأة" : "Bonus"} className="w-28 h-8 text-xs border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                        onChange={e => setEditMap(p => ({ ...p, [rec.id]: { ...p[rec.id], bonuses: Number(e.target.value) } }))} />
                      <Input type="number" placeholder={L ? "خصم" : "Deduction"} className="w-28 h-8 text-xs border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                        onChange={e => setEditMap(p => ({ ...p, [rec.id]: { ...p[rec.id], deductions: Number(e.target.value) } }))} />
                      <Button size="sm" variant="outline" className="h-8 text-xs dark:text-white dark:border-white/10"
                        onClick={() => updateMutation.mutate({ id: rec.id, data: editMap[rec.id] || {} })}>
                        {L ? "حفظ" : "Save"}
                      </Button>
                      {rec.status !== "paid" && (
                        <Button size="sm" className="h-8 text-xs bg-black dark:bg-white text-white dark:text-black gap-1"
                          onClick={() => updateMutation.mutate({ id: rec.id, data: { status: "paid" } })}>
                          <CheckCircle className="w-3 h-3" /> {L ? "تأكيد الدفع" : "Confirm Payment"}
                        </Button>
                      )}
                      {rec.status === "paid" && rec.paidAt && (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> {L ? "دُفع" : "Paid"} {new Date(rec.paidAt).toLocaleDateString(L ? "ar-SA" : "en-US")}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════ ADD PAYMENT DIALOG ═══════ */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm dark:bg-gray-900 dark:border-white/10" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-black dark:text-white font-black flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {L ? "إضافة استحقاق مالي" : "Add Financial Payment"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {/* Employee */}
            <div>
              <label className="text-xs text-black/50 dark:text-white/50 mb-1 block">{L ? "الموظف *" : "Employee *"}</label>
              <Select value={form.userId} onValueChange={v => setForm(f => ({ ...f, userId: v }))}>
                <SelectTrigger className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white" data-testid="select-employee">
                  <SelectValue placeholder={L ? "اختر الموظف" : "Select employee"} />
                </SelectTrigger>
                <SelectContent>
                  {nonClients.map((u: any) => (
                    <SelectItem key={u._id || u.id} value={u._id || u.id}>
                      {u.fullName} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div>
              <label className="text-xs text-black/50 dark:text-white/50 mb-1 block">{L ? "نوع الاستحقاق *" : "Type *"}</label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([val, [ar, en]]) => (
                    <SelectItem key={val} value={val}>{L ? ar : en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs text-black/50 dark:text-white/50 mb-1 block">{L ? "المبلغ (ر.س) *" : "Amount (SAR) *"}</label>
              <Input
                type="number" placeholder="0" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                data-testid="input-amount"
              />
            </div>

            {/* Project name */}
            <div>
              <label className="text-xs text-black/50 dark:text-white/50 mb-1 block">{L ? "اسم المشروع (اختياري)" : "Project Name (optional)"}</label>
              <Input
                placeholder={L ? "مثال: موقع كلوني كافيه" : "e.g. Cluny Cafe Website"} value={form.projectName}
                onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))}
                className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                data-testid="input-project-name"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-black/50 dark:text-white/50 mb-1 block">{L ? "الوصف (اختياري)" : "Description (optional)"}</label>
              <Input
                placeholder={L ? "وصف الاستحقاق..." : "Payment description..."} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Due date */}
            <div>
              <label className="text-xs text-black/50 dark:text-white/50 mb-1 block">{L ? "تاريخ الاستحقاق (اختياري)" : "Due Date (optional)"}</label>
              <Input
                type="date" value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-black/50 dark:text-white/50 mb-1 block">{L ? "ملاحظات (اختياري)" : "Notes (optional)"}</label>
              <Input
                placeholder={L ? "ملاحظات إضافية..." : "Extra notes..."} value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1 bg-black dark:bg-white text-white dark:text-black gap-2"
                disabled={!form.userId || !form.amount || addPaymentMutation.isPending}
                onClick={() => addPaymentMutation.mutate({
                  userId: form.userId, projectName: form.projectName,
                  amount: Number(form.amount), type: form.type,
                  description: form.description, dueDate: form.dueDate || undefined, notes: form.notes,
                })}
                data-testid="btn-submit-payment"
              >
                {addPaymentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {L ? "إضافة" : "Add"}
              </Button>
              <Button variant="outline" className="dark:text-white dark:border-white/10" onClick={() => { setAddOpen(false); setForm(EMPTY_FORM); }}>
                {L ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
