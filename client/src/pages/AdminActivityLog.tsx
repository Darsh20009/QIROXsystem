
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Activity, User, FileText, ShoppingCart, Briefcase, Star, Download, Filter, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { exportToExcel } from "@/lib/excel";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useI18n } from "@/lib/i18n";

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
  create_order: "إنشاء طلب", update_order: "تحديث طلب", login: "تسجيل دخول",
  logout: "تسجيل خروج", create_user: "إنشاء مستخدم", delete_user: "حذف مستخدم",
  update_project: "تحديث مشروع", create_project: "إنشاء مشروع",
};
const ENTITY_ICONS: Record<string, any> = {
  support_ticket: FileText, order: ShoppingCart, project: Briefcase,
  payroll: Star, employee_profile: User,
};

export default function AdminActivityLog() {
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { lang, dir } = useI18n();
  const L = lang === "ar";

  const buildUrl = () => {
    const params = new URLSearchParams();
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    return `/api/admin/activity-log?${params.toString()}`;
  };

  const { data: logs, isLoading, refetch } = useQuery<LogEntry[]>({
    queryKey: ["/api/admin/activity-log", fromDate, toDate],
    queryFn: async () => {
      const r = await fetch(buildUrl(), { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    refetchInterval: 30000,
  });

  const filtered = (logs || []).filter(l =>
    !search || (
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.userId?.fullName?.includes(search) ||
      l.entity?.includes(search) ||
      (ACTION_LABELS[l.action] || "").includes(search)
    )
  );

  const hasActiveFilters = fromDate || toDate;

  const clearFilters = () => { setFromDate(""); setToDate(""); };

  const exportExcel = () => {
    if (!logs) return;
    exportToExcel("activity-log.xlsx", [{
      name: L ? "سجل النشاط" : "Activity Log",
      data: logs.map(l => ({
        التاريخ: new Date(l.createdAt).toLocaleString("ar-SA"),
        المستخدم: l.userId?.fullName || "نظام",
        الدور: l.userId?.role || "-",
        الإجراء: ACTION_LABELS[l.action] || l.action,
        الكيان: l.entity,
        "رقم IP": l.ip || "-",
      })),
    }]);
  };

  return (
    <div className="space-y-6 relative overflow-hidden" dir={dir}>
      <PageGraphics variant="dashboard" />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black dark:text-white">{L ? "سجل نشاط الأدمن" : "Admin Activity Log"}</h1>
            <p className="text-xs text-black/35 dark:text-white/35">
              {L ? `${filtered.length} سجل` : `${filtered.length} entries`}
              {hasActiveFilters && (
                <Badge variant="outline" className="mr-2 text-[10px] border-amber-300 text-amber-600 bg-amber-50">
                  {L ? "فلتر نشط" : "Filtered"}
                </Badge>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowFilters(v => !v)}
            variant="outline" size="sm"
            className={`gap-2 border-black/10 dark:border-white/10 dark:text-white ${hasActiveFilters ? "bg-amber-50 border-amber-300 text-amber-700" : ""}`}
            data-testid="button-toggle-filters"
          >
            <Filter className="w-4 h-4" />
            {L ? "فلتر" : "Filter"}
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-amber-500" />}
          </Button>
          <Button onClick={exportExcel} variant="outline" size="sm" className="gap-2 border-black/10 dark:border-white/10 dark:text-white">
            <Download className="w-4 h-4" />
            {L ? "تصدير Excel" : "Export Excel"}
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="border-black/10 dark:border-white/10 dark:bg-gray-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-black/40 dark:text-white/40" />
                <span className="text-sm font-medium text-black dark:text-white">{L ? "نطاق التاريخ" : "Date Range"}</span>
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-black/50 dark:text-white/50 whitespace-nowrap">{L ? "من" : "From"}</label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    className="w-40 text-sm border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                    data-testid="input-date-from"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-black/50 dark:text-white/50 whitespace-nowrap">{L ? "إلى" : "To"}</label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className="w-40 text-sm border-black/10 dark:border-white/10 dark:bg-gray-800 dark:text-white"
                    data-testid="input-date-to"
                  />
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-red-500 hover:text-red-600 hover:bg-red-50" data-testid="button-clear-filters">
                    <X className="w-3.5 h-3.5" /> {L ? "مسح" : "Clear"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Input
        placeholder={L ? "بحث في السجل..." : "Search logs..."}
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
        <div className="text-center py-16">
          <Activity className="w-10 h-10 text-black/10 dark:text-white/10 mx-auto mb-3" />
          <p className="text-black/30 dark:text-white/30">{L ? "لا يوجد نشاط مسجل بعد" : "No activity logged yet"}</p>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-2 text-amber-600">
              {L ? "مسح الفلتر" : "Clear filter"}
            </Button>
          )}
        </div>
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
                          {log.userId?.fullName || (L ? "النظام" : "System")}
                        </span>
                        <span className="text-xs text-black/30 dark:text-white/30">({log.userId?.role || "system"})</span>
                        <span className="text-xs bg-black/[0.05] dark:bg-white/[0.05] rounded-md px-2 py-0.5 text-black/60 dark:text-white/60">
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[11px] text-black/30 dark:text-white/30">
                        <span>{log.entity}</span>
                        {log.ip && <span>IP: {log.ip}</span>}
                        <span>{new Date(log.createdAt).toLocaleString(L ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
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
