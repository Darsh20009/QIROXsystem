import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, DollarSign, Download, RefreshCw, CheckCircle, Clock, Banknote } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface PayrollRecord {
  id: string;
  userId: { fullName: string; email: string; role: string } | null;
  month: number;
  year: number;
  workHours: number;
  hourlyRate: number;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: string;
  paidAt?: string;
  notes?: string;
}

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700", approved: "bg-blue-100 text-blue-700", paid: "bg-green-100 text-green-700",
};
const STATUS_LABELS: Record<string, string> = { pending: "معلق", approved: "معتمد", paid: "مدفوع" };

export default function AdminPayroll() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const now = new Date();
  const [genMonth, setGenMonth] = useState(now.getMonth() + 1);
  const [genYear, setGenYear] = useState(now.getFullYear());
  const [editMap, setEditMap] = useState<Record<string, { bonuses?: number; deductions?: number }>>({});

  const { data: records, isLoading } = useQuery<PayrollRecord[]>({
    queryKey: ["/api/admin/payroll"],
    queryFn: async () => {
      const r = await fetch("/api/admin/payroll");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/payroll/generate", { month: genMonth, year: genYear }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payroll"] });
      toast({ title: `تم توليد كشف رواتب ${MONTHS_AR[genMonth - 1]} ${genYear}` });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/admin/payroll/${id}`, data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payroll"] });
      toast({ title: "تم تحديث السجل" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const exportExcel = () => {
    if (!records) return;
    const ws = XLSX.utils.json_to_sheet(records.map(r => ({
      الموظف: r.userId?.fullName || "-",
      الدور: r.userId?.role || "-",
      الشهر: `${MONTHS_AR[r.month - 1]} ${r.year}`,
      "ساعات العمل": r.workHours.toFixed(1),
      "سعر الساعة": r.hourlyRate,
      "الراتب الأساسي": r.baseSalary.toFixed(0),
      "مكافآت": r.bonuses,
      "خصومات": r.deductions,
      "صافي الراتب": r.netSalary.toFixed(0),
      "الحالة": STATUS_LABELS[r.status],
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "كشف الرواتب");
    XLSX.writeFile(wb, `payroll-${genYear}-${genMonth}.xlsx`);
  };

  const total = (records || []).reduce((acc, r) => acc + r.netSalary, 0);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
            <Banknote className="w-5 h-5 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black dark:text-white">كشف الرواتب</h1>
            <p className="text-xs text-black/35 dark:text-white/35">إجمالي: {total.toLocaleString()} ر.س</p>
          </div>
        </div>
        <Button onClick={exportExcel} variant="outline" size="sm" className="gap-2 dark:text-white dark:border-white/10">
          <Download className="w-4 h-4" /> تصدير Excel
        </Button>
      </div>

      {/* Generate */}
      <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60">توليد كشف راتب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap items-end">
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">الشهر</label>
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
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">السنة</label>
              <Input type="number" value={genYear} onChange={e => setGenYear(Number(e.target.value))}
                className="w-24 border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white" />
            </div>
            <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}
              className="bg-black dark:bg-white text-white dark:text-black gap-2">
              {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              توليد الكشف
            </Button>
          </div>
          <p className="text-[11px] text-black/30 dark:text-white/30 mt-2">
            يحسب الراتب تلقائياً من ساعات الحضور × سعر الساعة لكل موظف
          </p>
        </CardContent>
      </Card>

      {/* Records */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" /></div>
      ) : (records || []).length === 0 ? (
        <p className="text-center text-black/30 dark:text-white/30 py-16">لا يوجد سجلات — اضغط "توليد الكشف" لبدء الحساب</p>
      ) : (
        <div className="space-y-3">
          {(records || []).map(rec => (
            <Card key={rec.id} className="border-black/[0.06] dark:border-white/[0.06] shadow-none rounded-2xl dark:bg-gray-900">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-black text-sm text-black dark:text-white">{rec.userId?.fullName || "-"}</span>
                      <Badge className={`text-[10px] px-2 py-0 ${STATUS_COLORS[rec.status]}`}>{STATUS_LABELS[rec.status]}</Badge>
                    </div>
                    <p className="text-xs text-black/40 dark:text-white/40">{MONTHS_AR[(rec.month || 1) - 1]} {rec.year} — {rec.userId?.role}</p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="font-black text-lg text-black dark:text-white">{rec.netSalary.toLocaleString()} ر.س</p>
                    <p className="text-[10px] text-black/30 dark:text-white/30">{rec.workHours.toFixed(1)} ساعة × {rec.hourlyRate} ر.س</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3 text-center">
                  <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-lg p-2">
                    <p className="text-[10px] text-black/30 dark:text-white/30">الأساسي</p>
                    <p className="font-bold text-sm text-black dark:text-white">{rec.baseSalary.toFixed(0)}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                    <p className="text-[10px] text-green-600">مكافآت</p>
                    <p className="font-bold text-sm text-green-700">{rec.bonuses}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                    <p className="text-[10px] text-red-500">خصومات</p>
                    <p className="font-bold text-sm text-red-600">{rec.deductions}</p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Input type="number" placeholder="مكافأة" className="w-28 h-8 text-xs border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                    onChange={e => setEditMap(p => ({ ...p, [rec.id]: { ...p[rec.id], bonuses: Number(e.target.value) } }))} />
                  <Input type="number" placeholder="خصم" className="w-28 h-8 text-xs border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                    onChange={e => setEditMap(p => ({ ...p, [rec.id]: { ...p[rec.id], deductions: Number(e.target.value) } }))} />
                  <Button size="sm" variant="outline" className="h-8 text-xs dark:text-white dark:border-white/10"
                    onClick={() => updateMutation.mutate({ id: rec.id, data: editMap[rec.id] || {} })}>
                    حفظ
                  </Button>
                  {rec.status !== "paid" && (
                    <Button size="sm" className="h-8 text-xs bg-green-600 text-white gap-1"
                      onClick={() => updateMutation.mutate({ id: rec.id, data: { status: "paid" } })}>
                      <CheckCircle className="w-3 h-3" /> تأكيد الدفع
                    </Button>
                  )}
                  {rec.status === "paid" && rec.paidAt && (
                    <span className="text-[11px] text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> دُفع {new Date(rec.paidAt).toLocaleDateString("ar-SA")}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
