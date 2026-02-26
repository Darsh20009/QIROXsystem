import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Activity, User, FileText, ShoppingCart, Briefcase, Star, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import * as XLSX from "xlsx";

interface LogEntry {
  id: string;
  userId: { fullName: string; role: string; username: string } | null;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ip?: string;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  create_ticket: "فتح تذكرة دعم", update_ticket: "تحديث تذكرة", generate_payroll: "توليد كشف راتب",
  update_payroll: "تحديث راتب", update_employee_profile: "تحديث ملف موظف",
};
const ENTITY_ICONS: Record<string, any> = {
  support_ticket: FileText, order: ShoppingCart, project: Briefcase,
  payroll: Star, employee_profile: User,
};

export default function AdminActivityLog() {
  const [search, setSearch] = useState("");

  const { data: logs, isLoading } = useQuery<LogEntry[]>({
    queryKey: ["/api/admin/activity-log"],
    queryFn: async () => {
      const r = await fetch("/api/admin/activity-log");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    refetchInterval: 30000,
  });

  const filtered = (logs || []).filter(l =>
    !search || (l.action.includes(search) || l.userId?.fullName.includes(search) || l.entity.includes(search))
  );

  const exportExcel = () => {
    if (!logs) return;
    const ws = XLSX.utils.json_to_sheet(logs.map(l => ({
      التاريخ: new Date(l.createdAt).toLocaleString("ar-SA"),
      المستخدم: l.userId?.fullName || "نظام",
      الدور: l.userId?.role || "-",
      الإجراء: ACTION_LABELS[l.action] || l.action,
      الكيان: l.entity,
      "رقم IP": l.ip || "-",
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "سجل النشاط");
    XLSX.writeFile(wb, "activity-log.xlsx");
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black dark:text-white">سجل نشاط الأدمن</h1>
            <p className="text-xs text-black/35 dark:text-white/35">كل الإجراءات المسجلة في النظام</p>
          </div>
        </div>
        <Button onClick={exportExcel} variant="outline" size="sm" className="gap-2 border-black/10 dark:border-white/10 dark:text-white">
          <Download className="w-4 h-4" />
          تصدير Excel
        </Button>
      </div>

      <Input
        placeholder="بحث في السجل..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm border-black/10 dark:border-white/10 dark:bg-gray-900 dark:text-white"
        data-testid="input-log-search"
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-black/30 dark:text-white/30 py-16">لا يوجد نشاط مسجل بعد</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => {
            const Icon = ENTITY_ICONS[log.entity] || Activity;
            return (
              <Card key={log.id} className="border-black/[0.06] dark:border-white/[0.06] shadow-none rounded-xl dark:bg-gray-900">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black/[0.04] dark:bg-white/[0.04] rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-black/40 dark:text-white/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-black dark:text-white">
                          {log.userId?.fullName || "النظام"}
                        </span>
                        <span className="text-xs text-black/30 dark:text-white/30">({log.userId?.role || "system"})</span>
                        <span className="text-xs bg-black/[0.05] dark:bg-white/[0.05] rounded-md px-2 py-0.5 text-black/60 dark:text-white/60">
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[11px] text-black/30 dark:text-white/30">
                        <span>{log.entity}</span>
                        {log.ip && <span>IP: {log.ip}</span>}
                        <span>{new Date(log.createdAt).toLocaleString("ar-SA")}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
