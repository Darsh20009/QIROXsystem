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
  Plus, Play, Trash2, Wifi, WifiOff, RefreshCw, Clock,
  CheckCircle2, XCircle, Timer, Pencil, ScrollText, Zap, Calendar,
  ChevronDown, ChevronUp, TrendingUp, AlertTriangle, Loader2,
} from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

const SCHEDULE_PRESETS = [
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
];

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const statusColor: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  never: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const statusLabel: Record<string, string> = {
  success: "ناجح", error: "فشل", pending: "جارٍ", never: "لم يعمل",
};

const empty = { name: "", nameAr: "", description: "", url: "", method: "GET", schedule: "*/30 * * * *", headers: "", body: "", projectId: "" };

function timeAgo(date: string) {
  const d = new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff} ث`;
  if (diff < 3600) return `${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} س`;
  return `${Math.floor(diff / 86400)} ي`;
}

export default function AdminCronJobs() {
  const { toast } = useToast();
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/cron-jobs"] }); setOpen(false); toast({ title: editId ? "تم التحديث" : "تم الإنشاء" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
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
      toast({ title: "✅ تم التشغيل بنجاح" });
    } catch { toast({ title: "فشل التشغيل", variant: "destructive" }); }
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
    try { if (form.headers) headers = JSON.parse(form.headers); } catch { return toast({ title: "Headers يجب أن تكون JSON صالحة", variant: "destructive" }); }
    save.mutate({ ...form, headers });
  }

  const setPreset = (v: string) => {
    setSchedulePreset(v);
    if (v !== "custom") setForm(f => ({ ...f, schedule: v }));
  };

  // Stats
  const totalSuccess = jobs.reduce((s: number, j: any) => s + (j.successCount || 0), 0);
  const totalError = jobs.reduce((s: number, j: any) => s + (j.errorCount || 0), 0);
  const activeCount = jobs.filter((j: any) => j.isActive).length;

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <PageGraphics variant="dashboard" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-black dark:text-white">Cron Jobs</h1>
          <p className="text-sm text-black/40 dark:text-white/40 mt-0.5">جدولة مهام تلقائية لمواقع العملاء</p>
        </div>
        <Button onClick={openNew} data-testid="button-new-cron" className="gap-2 bg-black dark:bg-white text-white dark:text-black rounded-xl h-9 px-4">
          <Plus className="w-4 h-4" /> إضافة مهمة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "مهام نشطة", value: activeCount, icon: Zap, color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "تشغيل ناجح", value: totalSuccess, icon: CheckCircle2, color: "from-blue-500 to-indigo-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "أخطاء", value: totalError, icon: AlertTriangle, color: "from-red-500 to-orange-500", bg: "bg-red-50 dark:bg-red-900/20" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black text-black dark:text-white">{s.value}</p>
                <p className="text-[11px] text-black/35 dark:text-white/35 font-medium">{s.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Jobs list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-black/30 dark:text-white/30">
          <Loader2 className="w-5 h-5 animate-spin" /> جاري التحميل...
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20">
          <Clock className="w-12 h-12 mx-auto mb-3 text-black/10 dark:text-white/10" />
          <p className="text-black/30 dark:text-white/30">لا توجد مهام مجدولة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((j: any, idx: number) => (
            <motion.div key={j.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
              <Card className={`border ${j.isActive ? "border-black/[0.06] dark:border-white/[0.07]" : "border-black/[0.03] dark:border-white/[0.04] opacity-55"} bg-white dark:bg-gray-900 shadow-none hover:shadow-sm transition-shadow`} data-testid={`card-cron-${j.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Switch checked={j.isActive} onCheckedChange={v => toggle.mutate({ id: j.id, isActive: v })} data-testid={`switch-cron-${j.id}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-sm text-black dark:text-white">{j.nameAr || j.name}</span>
                        {j.nameAr && j.name && <span className="text-xs text-black/30 dark:text-white/30">{j.name}</span>}
                        <Badge variant="outline" className="text-[9px] font-mono px-1.5">{j.method}</Badge>
                        <Badge variant="outline" className="text-[9px] font-mono px-1.5">{j.schedule}</Badge>
                      </div>
                      <p className="text-xs text-blue-500 dark:text-blue-400 truncate mb-2">{j.url}</p>
                      <div className="flex items-center gap-3 flex-wrap text-[11px]">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${statusColor[j.lastRunStatus]}`}>{statusLabel[j.lastRunStatus]}</span>
                        {j.lastRunAt && (
                          <>
                            <span className="flex items-center gap-1 text-black/40 dark:text-white/40">
                              <Timer className="w-3 h-3" />{j.lastRunDuration}ms
                            </span>
                            <span className="flex items-center gap-1 text-black/30 dark:text-white/30">
                              <Clock className="w-3 h-3" />{new Date(j.lastRunAt).toLocaleString("ar-SA")}
                            </span>
                          </>
                        )}
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />{j.successCount}
                        </span>
                        <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
                          <XCircle className="w-3 h-3" />{j.errorCount}
                        </span>
                      </div>
                      {j.lastRunResponse && (
                        <div className="mt-2 text-[10px] font-mono bg-black/[0.03] dark:bg-white/[0.04] rounded-lg p-2 text-black/50 dark:text-white/50 truncate">{j.lastRunResponse}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Log button */}
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => setLogJobId(logJobId === j.id ? null : j.id)}
                        className={`h-8 px-2 gap-1 text-[11px] rounded-lg ${logJobId === j.id ? "bg-black dark:bg-white text-white dark:text-black" : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"}`}
                        data-testid={`button-log-${j.id}`}
                      >
                        <ScrollText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">سجل</span>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => runNow(j.id)} disabled={runningId === j.id} data-testid={`button-run-${j.id}`} className="h-8 px-2 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white rounded-lg">
                        {runningId === j.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(j)} data-testid={`button-edit-${j.id}`} className="h-8 px-2 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white rounded-lg">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 px-2 text-red-400 hover:text-red-600 rounded-lg" onClick={() => del.mutate(j.id)} data-testid={`button-delete-${j.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Log Panel ── */}
      <Sheet open={!!logJobId} onOpenChange={v => !v && setLogJobId(null)}>
        <SheetContent side="left" className="w-full sm:max-w-xl bg-white dark:bg-gray-950 border-r border-black/[0.06] dark:border-white/[0.06] p-0 flex flex-col" dir="rtl">
          <SheetHeader className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.06] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-black dark:bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <ScrollText className="w-4 h-4 text-white dark:text-black" />
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-sm font-black text-black dark:text-white">سجل التشغيل</SheetTitle>
                <p className="text-[11px] text-black/40 dark:text-white/40 truncate">{logJob?.nameAr || logJob?.name || ""}</p>
              </div>
              {logJob && (
                <button
                  onClick={() => runNow(logJob.id)}
                  disabled={runningId === logJob?.id}
                  className="mr-auto flex items-center gap-1.5 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-xl hover:opacity-80 transition-all disabled:opacity-50"
                >
                  {runningId === logJob?.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                  تشغيل الآن
                </button>
              )}
            </div>

            {/* Summary stats */}
            {logJob && (
              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{logJob.successCount}</p>
                  <p className="text-[10px] text-black/35 dark:text-white/35">ناجح</p>
                </div>
                <div className="flex-1 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-red-500 dark:text-red-400">{logJob.errorCount}</p>
                  <p className="text-[10px] text-black/35 dark:text-white/35">فشل</p>
                </div>
                <div className="flex-1 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-black dark:text-white">{logJob.successCount + logJob.errorCount > 0 ? Math.round((logJob.successCount / (logJob.successCount + logJob.errorCount)) * 100) : 0}%</p>
                  <p className="text-[10px] text-black/35 dark:text-white/35">نسبة النجاح</p>
                </div>
              </div>
            )}
          </SheetHeader>

          {/* Log entries */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {logsLoading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-black/30 dark:text-white/30">
                <Loader2 className="w-5 h-5 animate-spin" /> جاري التحميل...
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl flex items-center justify-center">
                  <ScrollText className="w-7 h-7 text-black/15 dark:text-white/15" />
                </div>
                <p className="text-sm text-black/30 dark:text-white/30 font-medium">لا يوجد سجل بعد</p>
                <p className="text-[11px] text-black/20 dark:text-white/20">قم بتشغيل المهمة لبدء التسجيل</p>
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
                        className="w-full flex items-center gap-3 px-4 py-3 text-right"
                        onClick={() => setExpandedLog(expandedLog === i ? null : i)}
                      >
                        {/* Status dot */}
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          log.status === "success" ? "bg-emerald-500" : "bg-red-500"
                        }`}>
                          {log.status === "success"
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            : <XCircle className="w-3.5 h-3.5 text-white" />
                          }
                        </div>

                        <div className="flex-1 min-w-0 text-right">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[11px] font-bold ${log.status === "success" ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                              {log.status === "success" ? "تشغيل ناجح" : "فشل التشغيل"}
                            </span>
                            {log.triggeredBy === "manual" && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-bold">يدوي</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-black/35 dark:text-white/35">
                            <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{new Date(log.runAt).toLocaleString("ar-SA")}</span>
                            <span className="flex items-center gap-1"><Timer className="w-2.5 h-2.5" />{log.duration}ms</span>
                            <span className="text-black/20 dark:text-white/20">{timeAgo(log.runAt)} مضت</span>
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
                            <div className="px-4 pb-3">
                              <div className="bg-black/[0.04] dark:bg-white/[0.04] rounded-lg p-3 text-[10px] font-mono text-black/60 dark:text-white/60 max-h-32 overflow-y-auto whitespace-pre-wrap break-all" dir="ltr">
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

      {/* Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editId ? "تعديل المهمة" : "إضافة مهمة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الاسم بالعربي *</Label>
                <Input value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} placeholder="مزامنة البيانات" data-testid="input-cron-name-ar" />
              </div>
              <div>
                <Label>الاسم بالإنجليزي *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Sync Data" data-testid="input-cron-name" />
              </div>
            </div>
            <div>
              <Label>رابط الطلب *</Label>
              <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://example.com/api/sync" dir="ltr" data-testid="input-cron-url" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>طريقة الطلب</Label>
                <Select value={form.method} onValueChange={v => setForm(f => ({ ...f, method: v }))}>
                  <SelectTrigger data-testid="select-cron-method"><SelectValue /></SelectTrigger>
                  <SelectContent>{METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>الجدول الزمني</Label>
                <Select value={schedulePreset} onValueChange={setPreset}>
                  <SelectTrigger data-testid="select-cron-preset"><SelectValue /></SelectTrigger>
                  <SelectContent>{SCHEDULE_PRESETS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {schedulePreset === "custom" && (
              <div>
                <Label>تعبير Cron المخصص</Label>
                <Input value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} placeholder="*/5 * * * *" dir="ltr" data-testid="input-cron-schedule" />
                <p className="text-[10px] text-black/30 mt-1">مثال: {"*/5 * * * *"} = كل 5 دقائق</p>
              </div>
            )}
            <div>
              <Label>Headers (JSON اختياري)</Label>
              <Textarea value={form.headers} onChange={e => setForm(f => ({ ...f, headers: e.target.value }))} placeholder='{"Authorization": "Bearer token"}' className="font-mono text-xs h-16" dir="ltr" data-testid="input-cron-headers" />
            </div>
            {form.method !== "GET" && form.method !== "DELETE" && (
              <div>
                <Label>Body (اختياري)</Label>
                <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder='{"key": "value"}' className="font-mono text-xs h-16" dir="ltr" data-testid="input-cron-body" />
              </div>
            )}
            <div>
              <Label>وصف (اختياري)</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} data-testid="input-cron-desc" />
            </div>
            <div className="border-t pt-3">
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={testConn} disabled={!form.url || testLoading} data-testid="button-test-connection" className="gap-1">
                  {testLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />} اختبار الاتصال
                </Button>
                {testResult && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${testResult.success ? "text-emerald-600" : "text-red-600"}`}>
                    {testResult.success ? <CheckCircle2 className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {testResult.success ? `نجح (${testResult.status}) - ${testResult.duration}ms` : `فشل: ${testResult.statusText}`}
                  </div>
                )}
              </div>
              {testResult?.response && (
                <div className="mt-2 text-[10px] font-mono bg-black/[0.03] rounded-lg p-2 text-black/50 max-h-16 overflow-auto">{testResult.response}</div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={submit} disabled={save.isPending || !form.name || !form.url} data-testid="button-save-cron">
              {save.isPending ? "جاري الحفظ..." : editId ? "تحديث" : "إنشاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
