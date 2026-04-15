import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Play, Trash2, RefreshCw, Clock,
  CheckCircle2, XCircle, Timer, Pencil, ScrollText, Zap,
  ChevronDown, ChevronUp, AlertTriangle, Loader2, MoreHorizontal,
} from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useI18n } from "@/lib/i18n";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getSchedulePresets(L: boolean) { return L ? [
  { label: "كل دقيقة", value: "* * * * *" },
  { label: "كل 5 دقائق", value: "*/5 * * * *" },
  { label: "كل 15 دقيقة", value: "*/15 * * * *" },
  { label: "كل 30 دقيقة", value: "*/30 * * * *" },
  { label: "كل ساعة", value: "0 * * * *" },
  { label: "كل 6 ساعات", value: "0 */6 * * *" },
  { label: "يومياً الساعة 12 ظهر", value: "0 12 * * *" },
  { label: "يومياً منتصف الليل", value: "0 0 * * *" },
  { label: "أسبوعياً (الأحد)", value: "0 0 * * 0" },
  { label: "مخصص", value: "custom" },
] : [
  { label: "Every minute", value: "* * * * *" },
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every 15 minutes", value: "*/15 * * * *" },
  { label: "Every 30 minutes", value: "*/30 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Daily at noon", value: "0 12 * * *" },
  { label: "Daily at midnight", value: "0 0 * * *" },
  { label: "Weekly (Sunday)", value: "0 0 * * 0" },
  { label: "Custom", value: "custom" },
]; }

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const statusColor: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  never: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

function getStatusLabel(L: boolean): Record<string, string> {
  return L ? { success: "ناجح", error: "فشل", pending: "جارٍ", never: "لم يعمل" }
  : { success: "Success", error: "Failed", pending: "Running", never: "Never ran" };
}

const empty = { name: "", nameAr: "", description: "", url: "", method: "GET", schedule: "*/30 * * * *", headers: "", body: "", projectId: "" };

function timeAgo(date: string, L: boolean) {
  const d = new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return L ? `${diff} ث` : `${diff}s`;
  if (diff < 3600) return L ? `${Math.floor(diff / 60)} د` : `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return L ? `${Math.floor(diff / 3600)} س` : `${Math.floor(diff / 3600)}h`;
  return L ? `${Math.floor(diff / 86400)} ي` : `${Math.floor(diff / 86400)}d`;
}

export default function AdminCronJobs() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const SCHEDULE_PRESETS = getSchedulePresets(L);
  const statusLabel = getStatusLabel(L);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [schedulePreset, setSchedulePreset] = useState("*/30 * * * *");
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [logJobId, setLogJobId] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  const { data: jobs = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/cron-jobs"] });

  const { data: logs = [], isLoading: logsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/cron-jobs", logJobId, "logs"],
    queryFn: async () => {
      const r = await fetch(`/api/admin/cron-jobs/${logJobId}/logs`, { credentials: "include" });
      return r.json();
    },
    enabled: !!logJobId,
    refetchInterval: logJobId ? 15000 : false,
  });

  const logJob = jobs.find((j: any) => j.id === logJobId);

  const save = useMutation({
    mutationFn: (d: any) => editId
      ? apiRequest("PATCH", `/api/admin/cron-jobs/${editId}`, d)
      : apiRequest("POST", "/api/admin/cron-jobs", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/cron-jobs"] }); setOpen(false); toast({ title: editId ? (L ? "تم التحديث" : "Updated") : (L ? "تم الإنشاء" : "Created") }); },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/cron-jobs/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/cron-jobs"] }); if (logJobId === undefined) setLogJobId(null); },
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: any) => apiRequest("PATCH", `/api/admin/cron-jobs/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/cron-jobs"] }),
  });

  async function runNow(id: string) {
    setRunningId(id);
    try {
      await apiRequest("POST", `/api/admin/cron-jobs/${id}/run`);
      await qc.invalidateQueries({ queryKey: ["/api/admin/cron-jobs"] });
      if (logJobId === id) await qc.invalidateQueries({ queryKey: ["/api/admin/cron-jobs", id, "logs"] });
      toast({ title: L ? "✅ تم التشغيل بنجاح" : "✅ Ran successfully" });
    } catch { toast({ title: L ? "فشل التشغيل" : "Run failed", variant: "destructive" }); }
    finally { setRunningId(null); }
  }

  async function testConn() {
    setTestLoading(true); setTestResult(null);
    try {
      let headers: any = {};
      try { if (form.headers) headers = JSON.parse(form.headers); } catch {}
      const res = await apiRequest("POST", "/api/admin/cron-jobs/test", { url: form.url, method: form.method, headers, body: form.body });
      const r = await res.json();
      setTestResult(r);
    } catch (e: any) { setTestResult({ success: false, statusText: e.message }); }
    finally { setTestLoading(false); }
  }

  function openNew() {
    setEditId(null); setForm({ ...empty }); setSchedulePreset("*/30 * * * *");
    setTestResult(null); setOpen(true);
  }

  function openEdit(j: any) {
    setEditId(j.id); setSchedulePreset("custom");
    setForm({ name: j.name, nameAr: j.nameAr || "", description: j.description || "", url: j.url, method: j.method, schedule: j.schedule, headers: j.headers ? JSON.stringify(Object.fromEntries(Object.entries(j.headers)), null, 2) : "", body: j.body || "", projectId: j.projectId || "" });
    setTestResult(null); setOpen(true);
  }

  function submit() {
    let headers: any = {};
    try { if (form.headers) headers = JSON.parse(form.headers); } catch { return toast({ title: L ? "Headers يجب أن تكون JSON صالحة" : "Headers must be valid JSON", variant: "destructive" }); }
    save.mutate({ ...form, headers });
  }

  const setPreset = (v: string) => {
    setSchedulePreset(v);
    if (v !== "custom") setForm(f => ({ ...f, schedule: v }));
  };

  const totalSuccess = jobs.reduce((s: number, j: any) => s + (j.successCount || 0), 0);
  const totalError = jobs.reduce((s: number, j: any) => s + (j.errorCount || 0), 0);
  const activeCount = jobs.filter((j: any) => j.isActive).length;

  return (
    <div className="px-3 sm:px-6 py-4 sm:py-6 max-w-6xl mx-auto w-full" dir={dir}>
      <PageGraphics variant="dashboard" />

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white">Cron Jobs</h1>
          <p className="text-xs sm:text-sm text-black/40 dark:text-white/40 mt-0.5">{L ? "جدولة مهام تلقائية لمواقع العملاء" : "Schedule automated tasks for client websites"}</p>
        </div>
        <Button
          onClick={openNew}
          data-testid="button-new-cron"
          className="gap-1.5 bg-black dark:bg-white text-white dark:text-black rounded-xl h-9 px-3 sm:px-4 text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{L ? "إضافة مهمة" : "Add Task"}</span>
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5">
        {[
          { label: L ? "مهام نشطة" : "Active Tasks", value: activeCount, icon: Zap, color: "from-emerald-500 to-teal-600" },
          { label: L ? "تشغيل ناجح" : "Successful Runs", value: totalSuccess, icon: CheckCircle2, color: "from-blue-500 to-indigo-600" },
          { label: L ? "أخطاء" : "Errors", value: totalError, icon: AlertTriangle, color: "from-red-500 to-orange-500" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-black/[0.06] dark:border-white/[0.07] p-2.5 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-3 text-center sm:text-right">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-sm sm:shadow-md flex-shrink-0`}>
                <s.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-black text-black dark:text-white leading-none">{s.value}</p>
                <p className="text-[9px] sm:text-[11px] text-black/35 dark:text-white/35 font-medium mt-0.5 leading-tight">{s.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Jobs List ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-black/30 dark:text-white/30">
          <Loader2 className="w-5 h-5 animate-spin" /> جاري التحميل...
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20">
          <Clock className="w-12 h-12 mx-auto mb-3 text-black/10 dark:text-white/10" />
          <p className="text-black/30 dark:text-white/30">{L ? "لا توجد مهام مجدولة" : "No scheduled tasks"}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {jobs.map((j: any, idx: number) => (
            <motion.div key={j.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
              <Card
                className={`border ${j.isActive ? "border-black/[0.06] dark:border-white/[0.07]" : "border-black/[0.03] dark:border-white/[0.04] opacity-75"} bg-white dark:bg-gray-900 shadow-none hover:shadow-sm transition-shadow`}
                data-testid={`card-cron-${j.id}`}
              >
                <CardContent className="p-3 sm:p-4">
                  {/* Row 1: Switch + name + action menu */}
                  <div className="flex items-start gap-2.5 sm:gap-4">
                    <Switch
                      checked={j.isActive}
                      onCheckedChange={v => toggle.mutate({ id: j.id, isActive: v })}
                      data-testid={`switch-cron-${j.id}`}
                      className="mt-0.5 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      {/* Name + badges */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="font-bold text-sm text-black dark:text-white truncate max-w-[140px] sm:max-w-none">
                          {j.nameAr || j.name}
                        </span>
                        <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 h-4 shrink-0">{j.method}</Badge>
                        <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 h-4 hidden sm:inline-flex shrink-0">{j.schedule}</Badge>
                      </div>

                      {/* URL */}
                      <p className="text-[11px] text-blue-500 dark:text-blue-400 truncate mb-1.5 max-w-full">{j.url}</p>

                      {/* Status + stats */}
                      <div className="flex items-center flex-wrap gap-1.5 sm:gap-3">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${statusColor[j.lastRunStatus]}`}>
                          {statusLabel[j.lastRunStatus]}
                        </span>
                        {j.lastRunAt && (
                          <span className="flex items-center gap-1 text-[10px] text-black/40 dark:text-white/40 shrink-0">
                            <Timer className="w-2.5 h-2.5" />{j.lastRunDuration}ms
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-2.5 h-2.5" />{j.successCount}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-red-500 dark:text-red-400 shrink-0">
                          <XCircle className="w-2.5 h-2.5" />{j.errorCount}
                        </span>
                        {j.lastRunAt && (
                          <span className="text-[10px] text-black/25 dark:text-white/25 hidden sm:inline shrink-0">
                            {new Date(j.lastRunAt).toLocaleString(L ? "ar-SA" : "en-US")}
                          </span>
                        )}
                      </div>

                      {j.lastRunResponse && (
                        <div className="mt-1.5 text-[10px] font-mono bg-black/[0.03] dark:bg-white/[0.04] rounded-lg p-1.5 text-black/50 dark:text-white/50 truncate">
                          {j.lastRunResponse}
                        </div>
                      )}
                    </div>

                    {/* Actions — desktop: inline buttons, mobile: dropdown */}
                    <div className="shrink-0 flex items-center gap-1">
                      {/* Log button — always visible */}
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => setLogJobId(logJobId === j.id ? null : j.id)}
                        className={`h-8 w-8 p-0 rounded-lg ${logJobId === j.id ? "bg-black dark:bg-white text-white dark:text-black" : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"}`}
                        data-testid={`button-log-${j.id}`}
                        title={L ? "سجل التشغيل" : "Run Log"}
                      >
                        <ScrollText className="w-3.5 h-3.5" />
                      </Button>

                      {/* Run button — always visible */}
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => runNow(j.id)}
                        disabled={runningId === j.id}
                        data-testid={`button-run-${j.id}`}
                        className="h-8 w-8 p-0 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white rounded-lg"
                        title={L ? "تشغيل الآن" : "Run Now"}
                      >
                        {runningId === j.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      </Button>

                      {/* Edit + Delete — dropdown on mobile, inline on desktop */}
                      <div className="hidden sm:flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(j)} data-testid={`button-edit-${j.id}`} className="h-8 w-8 p-0 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white rounded-lg" title={L ? "تعديل" : "Edit"}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 rounded-lg" onClick={() => del.mutate(j.id)} data-testid={`button-delete-${j.id}`} title={L ? "حذف" : "Delete"}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Mobile: dropdown for edit/delete */}
                      <div className="sm:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-black/40 dark:text-white/40 rounded-lg" data-testid={`button-more-${j.id}`}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-36">
                            <DropdownMenuItem onClick={() => openEdit(j)} data-testid={`menu-edit-${j.id}`}>
                              <Pencil className="w-3.5 h-3.5 ml-2" /> {L ? "تعديل" : "Edit"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => del.mutate(j.id)} className="text-red-500 focus:text-red-600" data-testid={`menu-delete-${j.id}`}>
                              <Trash2 className="w-3.5 h-3.5 ml-2" /> {L ? "حذف" : "Delete"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  {/* Mobile schedule badge — below on small screens */}
                  <div className="sm:hidden mt-2 flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0.5">{j.schedule}</Badge>
                    {j.lastRunAt && (
                      <span className="text-[10px] text-black/25 dark:text-white/25">
                        {L ? `آخر تشغيل: ${timeAgo(j.lastRunAt, L)} مضت` : `Last run: ${timeAgo(j.lastRunAt, L)} ago`}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Log Sheet ── */}
      <Sheet open={!!logJobId} onOpenChange={v => !v && setLogJobId(null)}>
        <SheetContent
          side="left"
          className="w-full sm:max-w-xl bg-white dark:bg-gray-950 border-r border-black/[0.06] dark:border-white/[0.06] p-0 flex flex-col"
          dir={dir}
        >
          <SheetHeader className="px-4 sm:px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.06] flex-shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-black dark:bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <ScrollText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white dark:text-black" />
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-sm font-black text-black dark:text-white">{L ? "سجل التشغيل" : "Run Log"}</SheetTitle>
                <p className="text-[11px] text-black/40 dark:text-white/40 truncate">{logJob?.nameAr || logJob?.name || ""}</p>
              </div>
              {logJob && (
                <button
                  onClick={() => runNow(logJob.id)}
                  disabled={runningId === logJob?.id}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-xl hover:opacity-80 transition-all disabled:opacity-50 shrink-0"
                >
                  {runningId === logJob?.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                  <span className="hidden sm:inline">{L ? "تشغيل الآن" : "Run Now"}</span>
                </button>
              )}
            </div>

            {logJob && (
              <div className="flex items-center gap-2 sm:gap-3 mt-3">
                {[
                  { value: logJob.successCount, label: L ? "ناجح" : "Success", color: "text-emerald-600 dark:text-emerald-400" },
                  { value: logJob.errorCount, label: L ? "فشل" : "Failed", color: "text-red-500 dark:text-red-400" },
                  {
                    value: `${logJob.successCount + logJob.errorCount > 0 ? Math.round((logJob.successCount / (logJob.successCount + logJob.errorCount)) * 100) : 0}%`,
                    label: L ? "نسبة النجاح" : "Success Rate",
                    color: "text-black dark:text-white"
                  },
                ].map((s, i) => (
                  <div key={i} className="flex-1 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl p-2 sm:p-3 text-center">
                    <p className={`text-lg sm:text-xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[9px] sm:text-[10px] text-black/35 dark:text-white/35">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4">
            {logsLoading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-black/30 dark:text-white/30">
                <Loader2 className="w-5 h-5 animate-spin" /> جاري التحميل...
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl flex items-center justify-center">
                  <ScrollText className="w-7 h-7 text-black/15 dark:text-white/15" />
                </div>
                <p className="text-sm text-black/30 dark:text-white/30 font-medium">{L ? "لا يوجد سجل بعد" : "No log yet"}</p>
                <p className="text-[11px] text-black/20 dark:text-white/20">{L ? "قم بتشغيل المهمة لبدء التسجيل" : "Run the task to start logging"}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {logs.map((log: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i < 5 ? i * 0.04 : 0 }}
                      className={`rounded-xl border overflow-hidden ${
                        log.status === "success"
                          ? "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10"
                          : "border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10"
                      }`}
                    >
                      <button
                        className="w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-right"
                        onClick={() => setExpandedLog(expandedLog === i ? null : i)}
                      >
                        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          log.status === "success" ? "bg-emerald-500" : "bg-red-500"
                        }`}>
                          {log.status === "success"
                            ? <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                            : <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                          }
                        </div>

                        <div className="flex-1 min-w-0 text-right">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <span className={`text-[11px] font-bold ${log.status === "success" ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                              {log.status === "success" ? (L ? "تشغيل ناجح" : "Successful Run") : (L ? "فشل التشغيل" : "Failed Run")}
                            </span>
                            {log.triggeredBy === "manual" && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-bold">{L ? "يدوي" : "Manual"}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-[10px] text-black/35 dark:text-white/35">
                            <span className="flex items-center gap-1"><Timer className="w-2.5 h-2.5" />{log.duration}ms</span>
                            <span className="text-black/20 dark:text-white/20">{L ? `${timeAgo(log.runAt, L)} مضت` : `${timeAgo(log.runAt, L)} ago`}</span>
                          </div>
                        </div>

                        {log.response && (
                          expandedLog === i
                            ? <ChevronUp className="w-3.5 h-3.5 text-black/25 dark:text-white/25 flex-shrink-0" />
                            : <ChevronDown className="w-3.5 h-3.5 text-black/25 dark:text-white/25 flex-shrink-0" />
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedLog === i && log.response && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 sm:px-4 pb-3">
                              <div className="bg-black/[0.04] dark:bg-white/[0.04] rounded-lg p-2.5 sm:p-3 text-[10px] font-mono text-black/60 dark:text-white/60 max-h-32 overflow-y-auto whitespace-pre-wrap break-all" dir="ltr">
                                {log.response}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Form Dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="w-[calc(100vw-2rem)] max-w-xl sm:max-w-xl rounded-2xl"
          dir={dir}
        >
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{editId ? (L ? "تعديل المهمة" : "Edit Task") : (L ? "إضافة مهمة جديدة" : "Add New Task")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] sm:max-h-[65vh] overflow-y-auto px-0.5">
            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <Label className="text-xs mb-1 block">{L ? "الاسم بالعربي *" : "Arabic Name *"}</Label>
                <Input value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} placeholder="مزامنة البيانات" data-testid="input-cron-name-ar" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">{L ? "الاسم بالإنجليزي *" : "English Name *"}</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Sync Data" data-testid="input-cron-name" />
              </div>
            </div>

            {/* URL */}
            <div>
              <Label className="text-xs mb-1 block">{L ? "رابط الطلب *" : "Request URL *"}</Label>
              <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://example.com/api/sync" dir="ltr" data-testid="input-cron-url" className="text-sm" />
            </div>

            {/* Method + Schedule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <Label className="text-xs mb-1 block">Method</Label>
                <Select value={form.method} onValueChange={v => setForm(f => ({ ...f, method: v }))}>
                  <SelectTrigger data-testid="select-cron-method"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">{L ? "الجدول الزمني" : "Schedule"}</Label>
                <Select value={schedulePreset} onValueChange={setPreset}>
                  <SelectTrigger data-testid="select-cron-preset"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_PRESETS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom schedule */}
            {schedulePreset === "custom" && (
              <div>
                <Label className="text-xs mb-1 block">Cron Expression</Label>
                <Input value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} placeholder="*/30 * * * *" dir="ltr" data-testid="input-cron-schedule" className="font-mono text-sm" />
              </div>
            )}

            {/* Description */}
            <div>
              <Label className="text-xs mb-1 block">{L ? "وصف (اختياري)" : "Description (optional)"}</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={L ? "وصف المهمة..." : "Task description..."} data-testid="input-cron-desc" />
            </div>

            {/* Headers */}
            <div>
              <Label className="text-xs mb-1 block">Headers (JSON {L ? "اختياري" : "optional"})</Label>
              <Textarea value={form.headers} onChange={e => setForm(f => ({ ...f, headers: e.target.value }))} placeholder='{"Authorization": "Bearer token"}' dir="ltr" className="font-mono text-xs min-h-[60px]" data-testid="input-cron-headers" />
            </div>

            {/* Body */}
            {["POST", "PUT", "PATCH"].includes(form.method) && (
              <div>
                <Label className="text-xs mb-1 block">Request Body (JSON {L ? "اختياري" : "optional"})</Label>
                <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder='{"key": "value"}' dir="ltr" className="font-mono text-xs min-h-[60px]" data-testid="input-cron-body" />
              </div>
            )}

            {/* Test connection */}
            {form.url && (
              <div>
                <Button
                  variant="outline" size="sm" onClick={testConn} disabled={testLoading}
                  className="gap-1.5 text-xs rounded-xl w-full sm:w-auto"
                  data-testid="button-test-conn"
                >
                  {testLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {L ? "اختبار الاتصال" : "Test Connection"}
                </Button>
                {testResult && (
                  <div className={`mt-2 text-xs p-2.5 rounded-xl font-mono ${testResult.success ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"}`} dir="ltr">
                    {testResult.success ? "✅ " : "❌ "}{testResult.statusCode} {testResult.statusText}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto rounded-xl" data-testid="button-cancel-cron">
              {L ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={submit} disabled={save.isPending} className="gap-1.5 bg-black dark:bg-white text-white dark:text-black rounded-xl w-full sm:w-auto" data-testid="button-save-cron">
              {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editId ? (L ? "حفظ التعديلات" : "Save Changes") : (L ? "إنشاء المهمة" : "Create Task")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
