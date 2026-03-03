import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, Plus, Edit2, Trash2, Briefcase, Users, CheckCircle,
  Mail, Phone, FileText, UserPlus, Shield, Star, Eye, X, Copy,
  Search, Filter, Download, Clock, MapPin, ChevronDown,
  HelpCircle, GripVertical, ToggleLeft, ToggleRight, ChevronUp, ListChecks
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Job, type Application } from "@shared/schema";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface JobQuestion {
  text: string;
  type: "text" | "textarea" | "select" | "radio" | "checkbox";
  required: boolean;
  options: string[];
}

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  location: string;
  type: string;
  salaryRange: string;
  status: string;
  questions: JobQuestion[];
}

const emptyQuestion: JobQuestion = {
  text: "", type: "text", required: false, options: [],
};

const emptyForm: JobFormData = {
  title: "", description: "", requirements: "",
  location: "الرياض، المملكة العربية السعودية",
  type: "full-time", salaryRange: "", status: "open",
  questions: [],
};

const statusMap: Record<string, { label: string; color: string }> = {
  open:   { label: "مفتوح",   color: "bg-green-100 text-green-700 border-green-200" },
  closed: { label: "مغلق",   color: "bg-red-100 text-red-600 border-red-200" },
  paused: { label: "متوقف",  color: "bg-amber-100 text-amber-700 border-amber-200" },
};

const typeMap: Record<string, string> = {
  "full-time": "دوام كامل", "part-time": "دوام جزئي",
  "remote": "عن بُعد", "freelance": "مستقل", "internship": "تدريب",
};

const appStatusMap: Record<string, { label: string; color: string; icon: any }> = {
  new:       { label: "جديد",          color: "bg-blue-100 text-blue-700 border-blue-200",     icon: Star },
  reviewing: { label: "قيد المراجعة", color: "bg-amber-100 text-amber-700 border-amber-200",  icon: Eye },
  interview: { label: "مقابلة",        color: "bg-purple-100 text-purple-700 border-purple-200", icon: Users },
  accepted:  { label: "مقبول ✓",      color: "bg-green-100 text-green-700 border-green-200",  icon: CheckCircle },
  hired:     { label: "موظف ✓✓",       color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: Shield },
  rejected:  { label: "مرفوض",         color: "bg-red-100 text-red-600 border-red-200",        icon: X },
};

const roleLabels: Record<string, string> = {
  manager: "مدير", accountant: "محاسب", sales_manager: "مدير مبيعات",
  sales: "موظف مبيعات", developer: "مطور برمجيات", designer: "مصمم",
  support: "دعم فني", merchant: "توصيل وتسليم",
};

export default function AdminJobs() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"jobs" | "applications">("jobs");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<JobFormData>(emptyForm);
  const [hireApp, setHireApp] = useState<Application | null>(null);
  const [hireOpen, setHireOpen] = useState(false);
  const [hireForm, setHireForm] = useState({ username: "", role: "developer" });
  const [hired, setHired] = useState<{ username: string; password: string; email: string } | null>(null);
  const [viewApp, setViewApp] = useState<Application | null>(null);

  const [searchApp, setSearchApp] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterJob, setFilterJob] = useState("all");

  const { data: jobs, isLoading } = useQuery<Job[]>({ queryKey: ["/api/jobs"] });
  const { data: applications } = useQuery<Application[]>({ queryKey: ["/api/admin/applications"] });

  const createMutation = useMutation({
    mutationFn: async (data: JobFormData) => {
      const payload = { ...data, requirements: data.requirements.split("\n").map(r => r.trim()).filter(Boolean), questions: data.questions };
      const res = await apiRequest("POST", "/api/admin/jobs", payload);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/jobs"] }); toast({ title: "تم إضافة الوظيفة بنجاح" }); setOpen(false); setFormData(emptyForm); },
    onError: () => toast({ title: "خطأ في إضافة الوظيفة", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: JobFormData) => {
      const payload = { ...data, requirements: data.requirements.split("\n").map(r => r.trim()).filter(Boolean), questions: data.questions };
      const res = await apiRequest("PATCH", `/api/admin/jobs/${editingId}`, payload);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/jobs"] }); toast({ title: "تم تحديث الوظيفة" }); setOpen(false); setEditingId(null); setFormData(emptyForm); },
    onError: () => toast({ title: "خطأ في تحديث الوظيفة", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/admin/jobs/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/jobs"] }); toast({ title: "تم حذف الوظيفة" }); },
  });

  const updateAppMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/applications/${id}`, { status });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] }); toast({ title: "تم تحديث حالة الطلب" }); },
  });

  const hireMutation = useMutation({
    mutationFn: async ({ appId, body }: { appId: string; body: any }) => {
      const res = await apiRequest("POST", `/api/admin/applications/${appId}/hire`, body);
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "خطأ"); }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setHired({ username: data.username, password: data.rawPassword, email: data.email });
    },
    onError: (err: any) => toast({ title: "فشل التعيين", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) { toast({ title: "يرجى ملء عنوان الوظيفة والوصف", variant: "destructive" }); return; }
    if (editingId) updateMutation.mutate(formData);
    else createMutation.mutate(formData);
  };

  const handleEdit = (job: Job) => {
    setEditingId(job.id.toString());
    setFormData({
      title: job.title,
      description: job.description,
      requirements: (job.requirements || []).join("\n"),
      location: job.location || "",
      type: job.type || "full-time",
      salaryRange: job.salaryRange || "",
      status: job.status,
      questions: ((job as any).questions || []) as JobQuestion[],
    });
    setOpen(true);
  };

  const addQuestion = () => {
    setFormData(f => ({ ...f, questions: [...f.questions, { ...emptyQuestion }] }));
  };

  const removeQuestion = (idx: number) => {
    setFormData(f => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }));
  };

  const updateQuestion = (idx: number, patch: Partial<JobQuestion>) => {
    setFormData(f => ({
      ...f,
      questions: f.questions.map((q, i) => i === idx ? { ...q, ...patch } : q),
    }));
  };

  const addOption = (qIdx: number) => {
    updateQuestion(qIdx, { options: [...formData.questions[qIdx].options, ""] });
  };

  const updateOption = (qIdx: number, oIdx: number, val: string) => {
    const opts = [...formData.questions[qIdx].options];
    opts[oIdx] = val;
    updateQuestion(qIdx, { options: opts });
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    updateQuestion(qIdx, { options: formData.questions[qIdx].options.filter((_, i) => i !== oIdx) });
  };

  const openHireDialog = (app: Application) => {
    setHireApp(app);
    setHireForm({ username: app.email?.split("@")[0]?.replace(/[^a-z0-9_]/gi, "").toLowerCase().slice(0, 20) || "", role: "developer" });
    setHired(null);
    setHireOpen(true);
  };

  const handleHire = () => {
    if (!hireApp || !hireForm.username || !hireForm.role) { toast({ title: "يرجى ملء جميع الحقول", variant: "destructive" }); return; }
    hireMutation.mutate({ appId: hireApp.id?.toString(), body: { role: hireForm.role, username: hireForm.username, email: hireApp.email, fullName: hireApp.fullName, phone: hireApp.phone || "" } });
  };

  const filteredApps = (applications || []).filter(a => {
    const matchSearch = !searchApp
      || a.fullName?.toLowerCase().includes(searchApp.toLowerCase())
      || a.email?.toLowerCase().includes(searchApp.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    const matchJob = filterJob === "all" || a.jobId?.toString() === filterJob;
    return matchSearch && matchStatus && matchJob;
  });

  const appStats = {
    total: applications?.length || 0,
    new: applications?.filter(a => a.status === "new").length || 0,
    interview: applications?.filter(a => a.status === "interview").length || 0,
    hired: applications?.filter(a => a.status === "hired").length || 0,
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin w-8 h-8 text-black/40" />
    </div>
  );

  return (
    <div className="relative overflow-hidden space-y-6" dir="rtl">
      <PageGraphics variant="dashboard" />

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-bold text-black dark:text-white flex items-center gap-3">
          <Briefcase className="w-7 h-7 text-black/40 dark:text-white/40" />
          إدارة الوظائف والتوظيف
        </h1>
        {activeTab === "jobs" && (
          <Button onClick={() => { setEditingId(null); setFormData(emptyForm); setOpen(true); }} className="gap-2 premium-btn" data-testid="button-add-job">
            <Plus className="w-4 h-4" />وظيفة جديدة
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Briefcase, val: jobs?.filter(j => j.status === "open").length || 0, label: "وظائف مفتوحة",  color: "text-green-500" },
          { icon: Users,     val: appStats.total,                                      label: "إجمالي الطلبات", color: "text-blue-500" },
          { icon: Star,      val: appStats.new,                                         label: "طلبات جديدة",  color: "text-amber-500" },
          { icon: Shield,    val: appStats.hired,                                       label: "تم تعيينهم",    color: "text-emerald-500" },
        ].map(({ icon: Icon, val, label, color }, i) => (
          <div key={i} className="border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 rounded-xl p-4 flex items-center gap-3">
            <Icon className={`w-5 h-5 ${color}`} />
            <div>
              <p className="text-lg font-bold text-black dark:text-white">{val}</p>
              <p className="text-xs text-black/40 dark:text-white/40">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-black/[0.06] dark:border-white/[0.06] pb-0">
        {[
          { key: "jobs",         label: "الوظائف",         count: jobs?.length || 0 },
          { key: "applications", label: "طلبات التوظيف",  count: appStats.total },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 -mb-px
              ${activeTab === tab.key
                ? "border-black dark:border-white text-black dark:text-white"
                : "border-transparent text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60"}`}
            data-testid={`tab-${tab.key}`}>
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.key ? "bg-black dark:bg-white text-white dark:text-black" : "bg-black/[0.06] dark:bg-white/[0.06] text-black/50 dark:text-white/50"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ─── Jobs Tab ─── */}
        {activeTab === "jobs" && (
          <motion.div key="jobs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="border border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                      {["الوظيفة", "النوع", "الراتب", "الطلبات", "الحالة", ""].map(h => (
                        <th key={h} className="text-right p-4 text-xs font-semibold text-black/40 dark:text-white/40 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobs?.map((job) => {
                      const st = statusMap[job.status] || statusMap["open"];
                      const appCount = applications?.filter(a => a.jobId?.toString() === job.id?.toString()).length || 0;
                      const newCount = applications?.filter(a => a.jobId?.toString() === job.id?.toString() && a.status === "new").length || 0;
                      return (
                        <tr key={job.id} className="border-b border-black/[0.03] dark:border-white/[0.03] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors" data-testid={`row-job-${job.id}`}>
                          <td className="p-4">
                            <p className="font-semibold text-black dark:text-white text-sm">{job.title}</p>
                            <p className="text-xs text-black/40 dark:text-white/40 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</p>
                          </td>
                          <td className="p-4 text-sm text-black/60 dark:text-white/60">{typeMap[job.type || ""] || job.type}</td>
                          <td className="p-4 text-sm text-black/60 dark:text-white/60">{job.salaryRange || "—"}</td>
                          <td className="p-4">
                            <button onClick={() => { setFilterJob(job.id?.toString()); setActiveTab("applications"); }}
                              className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:underline"
                              data-testid={`button-view-apps-${job.id}`}>
                              <Users className="w-3.5 h-3.5" />{appCount}
                              {newCount > 0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">{newCount} جديد</span>}
                            </button>
                          </td>
                          <td className="p-4">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${st.color}`}>{st.label}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="text-black/60 dark:text-white/60" onClick={() => handleEdit(job)} data-testid={`button-edit-job-${job.id}`}>
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="text-red-500" onClick={() => deleteMutation.mutate(job.id?.toString())} disabled={deleteMutation.isPending} data-testid={`button-delete-job-${job.id}`}>
                                {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(!jobs || jobs.length === 0) && (
                      <tr><td colSpan={6} className="p-12 text-center text-black/30 dark:text-white/30">
                        <Briefcase className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        <p>لا توجد وظائف بعد. أضف أول وظيفة الآن.</p>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Applications Tab ─── */}
        {activeTab === "applications" && (
          <motion.div key="applications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute top-2.5 right-3 w-4 h-4 text-black/30 dark:text-white/30" />
                <Input value={searchApp} onChange={e => setSearchApp(e.target.value)}
                  placeholder="بحث بالاسم أو البريد..." className="pr-9 rounded-xl h-10 text-sm" data-testid="input-search-apps" />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-44 rounded-xl h-10 text-sm" data-testid="select-filter-status">
                  <Filter className="w-3.5 h-3.5 text-black/30 dark:text-white/30 ml-1" />
                  <SelectValue placeholder="كل الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  {Object.entries(appStatusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterJob} onValueChange={setFilterJob}>
                <SelectTrigger className="w-48 rounded-xl h-10 text-sm" data-testid="select-filter-job">
                  <SelectValue placeholder="كل الوظائف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الوظائف</SelectItem>
                  {jobs?.map(j => <SelectItem key={j.id?.toString()} value={j.id?.toString()}>{j.title}</SelectItem>)}
                </SelectContent>
              </Select>
              {(filterStatus !== "all" || filterJob !== "all" || searchApp) && (
                <Button variant="ghost" size="sm" onClick={() => { setFilterStatus("all"); setFilterJob("all"); setSearchApp(""); }} className="text-xs text-black/40 dark:text-white/40 h-10 rounded-xl">
                  <X className="w-3.5 h-3.5 ml-1" />مسح الفلاتر
                </Button>
              )}
            </div>

            {filteredApps.length === 0 ? (
              <div className="text-center py-16 text-black/30 dark:text-white/30">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>{searchApp || filterStatus !== "all" || filterJob !== "all" ? "لا توجد نتائج مطابقة" : "لا توجد طلبات توظيف بعد"}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApps.map((app) => {
                  const st = appStatusMap[app.status] || appStatusMap["new"];
                  const StatusIcon = st.icon;
                  const jobTitle = jobs?.find(j => j.id?.toString() === app.jobId?.toString())?.title;
                  const isAccepted = app.status === "accepted";
                  const isHired = app.status === "hired";

                  return (
                    <motion.div key={app.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className={`border rounded-2xl overflow-hidden transition-all ${isHired ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20" : isAccepted ? "border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/20" : "border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900"}`}
                      data-testid={`row-app-${app.id}`}>

                      {/* Status bar */}
                      <div className={`h-1 w-full ${isHired ? "bg-gradient-to-r from-emerald-400 to-teal-400" : isAccepted ? "bg-gradient-to-r from-green-400 to-emerald-400" : app.status === "interview" ? "bg-gradient-to-r from-purple-400 to-violet-400" : app.status === "reviewing" ? "bg-gradient-to-r from-amber-400 to-orange-400" : app.status === "rejected" ? "bg-gradient-to-r from-red-400 to-red-500" : "bg-gradient-to-r from-blue-400 to-cyan-400"}`} />

                      <div className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <div className="w-9 h-9 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-sm font-black shrink-0">
                                {app.fullName?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <p className="font-bold text-black dark:text-white text-sm leading-tight">{app.fullName}</p>
                                {jobTitle && <p className="text-[10px] text-black/40 dark:text-white/40 flex items-center gap-0.5"><Briefcase className="w-2.5 h-2.5" />{jobTitle}</p>}
                              </div>
                              <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-bold border ${st.color}`}>
                                <StatusIcon className="w-2.5 h-2.5" />{st.label}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                              <div className="flex items-center gap-2 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl px-3 py-2">
                                <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <p className="text-xs text-black/70 dark:text-white/70 truncate" dir="ltr">{app.email}</p>
                              </div>
                              {app.phone && (
                                <div className="flex items-center gap-2 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl px-3 py-2">
                                  <Phone className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                  <p className="text-xs text-black/70 dark:text-white/70" dir="ltr">{app.phone}</p>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mt-3 flex-wrap">
                              {app.resumeUrl && (
                                <a href={app.resumeUrl} target="_blank" rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-semibold"
                                  data-testid={`link-resume-${app.id}`}>
                                  <Download className="w-3.5 h-3.5" />
                                  {app.resumeUrl.startsWith("/uploads") ? "تحميل السيرة الذاتية" : "عرض السيرة الذاتية"}
                                </a>
                              )}
                              <span className="text-[10px] text-black/25 dark:text-white/25 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(app.appliedAt || "").toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 items-end shrink-0">
                            <Select value={app.status} onValueChange={(v) => updateAppMutation.mutate({ id: app.id?.toString(), status: v })}>
                              <SelectTrigger className="w-44 h-9 text-xs rounded-xl border-black/10 dark:border-white/10" data-testid={`select-app-status-${app.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(appStatusMap).map(([key, val]) => (
                                  <SelectItem key={key} value={key}>
                                    <span className="flex items-center gap-2"><val.icon className="w-3.5 h-3.5" />{val.label}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <div className="flex gap-1.5">
                              <Button size="sm" variant="ghost" onClick={() => setViewApp(app)}
                                className="h-8 w-8 p-0 rounded-xl border border-black/10 dark:border-white/10"
                                data-testid={`button-view-app-${app.id}`}>
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              {isAccepted && !isHired && (
                                <Button size="sm" className="premium-btn gap-1.5 text-xs h-8 px-3 rounded-xl"
                                  onClick={() => openHireDialog(app)} data-testid={`button-hire-${app.id}`}>
                                  <UserPlus className="w-3.5 h-3.5" />تعيين
                                </Button>
                              )}
                              {isHired && (
                                <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl">
                                  <Shield className="w-3.5 h-3.5" />موظف
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job Form Dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) { setOpen(false); setEditingId(null); } }}>
        <DialogContent className="bg-white dark:bg-gray-900 border-black/[0.06] dark:border-white/[0.06] max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingId ? "تعديل الوظيفة" : "وظيفة جديدة"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-1.5">المسمى الوظيفي *</label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="مطور واجهات أمامية" data-testid="input-job-title" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-1.5">وصف الوظيفة *</label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="وصف تفصيلي للوظيفة والمهام..." rows={4} data-testid="input-job-description" />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-1.5">المتطلبات (كل متطلب في سطر)</label>
              <Textarea value={formData.requirements} onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} placeholder="خبرة 2+ سنة في React&#10;إتقان TypeScript" rows={4} data-testid="input-job-requirements" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-1.5">الموقع</label>
                <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="الرياض، السعودية" data-testid="input-job-location" />
              </div>
              <div>
                <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-1.5">نطاق الراتب</label>
                <Input value={formData.salaryRange} onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })} placeholder="5,000 - 10,000 ر.س" data-testid="input-job-salary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-1.5">نوع الدوام</label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger data-testid="select-job-type"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(typeMap).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-1.5">الحالة</label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger data-testid="select-job-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">مفتوح</SelectItem>
                    <SelectItem value="paused">متوقف</SelectItem>
                    <SelectItem value="closed">مغلق</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>


            {/* ─── Questions Builder ─── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-black/40 dark:text-white/40" />
                  <label className="text-sm font-semibold text-black/70 dark:text-white/70">أسئلة الطلب</label>
                  {formData.questions.length > 0 && (
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">{formData.questions.length}</span>
                  )}
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addQuestion}
                  className="h-8 text-xs gap-1.5 rounded-xl" data-testid="button-add-question">
                  <Plus className="w-3.5 h-3.5" />إضافة سؤال
                </Button>
              </div>

              {formData.questions.length === 0 ? (
                <div className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl p-6 text-center">
                  <HelpCircle className="w-6 h-6 mx-auto mb-2 text-black/20 dark:text-white/20" />
                  <p className="text-xs text-black/30 dark:text-white/30">لا توجد أسئلة. أضف أسئلة مخصصة للمتقدمين.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.questions.map((q, qIdx) => (
                    <motion.div key={qIdx} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                      className="border border-black/[0.08] dark:border-white/[0.08] rounded-xl p-3 space-y-3 bg-black/[0.02] dark:bg-white/[0.02]"
                      data-testid={`question-card-${qIdx}`}>

                      {/* Question header */}
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-[10px] font-black text-black/40 dark:text-white/40 flex-shrink-0">{qIdx + 1}</div>
                        <div className="flex-1">
                          <Input
                            value={q.text}
                            onChange={e => updateQuestion(qIdx, { text: e.target.value })}
                            placeholder="نص السؤال..."
                            className="h-8 text-sm"
                            data-testid={`question-text-${qIdx}`}
                          />
                        </div>
                        <Button type="button" size="icon" variant="ghost" className="w-7 h-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex-shrink-0 rounded-lg"
                          onClick={() => removeQuestion(qIdx)} data-testid={`button-remove-question-${qIdx}`}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Type & Required */}
                      <div className="flex items-center gap-2">
                        <Select value={q.type} onValueChange={(v) => updateQuestion(qIdx, { type: v as JobQuestion["type"], options: ["select", "radio", "checkbox"].includes(v) ? (q.options.length ? q.options : [""]) : [] })}>
                          <SelectTrigger className="h-8 text-xs flex-1 rounded-lg" data-testid={`question-type-${qIdx}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">نص قصير</SelectItem>
                            <SelectItem value="textarea">نص طويل</SelectItem>
                            <SelectItem value="select">قائمة منسدلة</SelectItem>
                            <SelectItem value="radio">اختيار واحد</SelectItem>
                            <SelectItem value="checkbox">اختيارات متعددة</SelectItem>
                          </SelectContent>
                        </Select>

                        <button type="button"
                          onClick={() => updateQuestion(qIdx, { required: !q.required })}
                          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all flex-shrink-0 ${q.required ? "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400" : "bg-black/[0.04] dark:bg-white/[0.04] text-black/40 dark:text-white/40"}`}
                          data-testid={`question-required-${qIdx}`}>
                          {q.required ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                          {q.required ? "إجباري" : "اختياري"}
                        </button>
                      </div>

                      {/* Options (for select/radio/checkbox) */}
                      {["select", "radio", "checkbox"].includes(q.type) && (
                        <div className="space-y-2 pr-6">
                          <p className="text-[10px] text-black/40 dark:text-white/40 font-semibold">الخيارات:</p>
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2">
                              <div className={`w-3 h-3 flex-shrink-0 border border-black/20 dark:border-white/20 ${q.type === "checkbox" ? "rounded" : "rounded-full"}`} />
                              <Input
                                value={opt}
                                onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                                placeholder={`الخيار ${oIdx + 1}...`}
                                className="h-7 text-xs flex-1"
                                data-testid={`option-text-${qIdx}-${oIdx}`}
                              />
                              <button type="button" onClick={() => removeOption(qIdx, oIdx)}
                                className="text-red-400 hover:text-red-600 flex-shrink-0" data-testid={`button-remove-option-${qIdx}-${oIdx}`}>
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button type="button" onClick={() => addOption(qIdx)}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 pr-5"
                            data-testid={`button-add-option-${qIdx}`}>
                            <Plus className="w-3 h-3" />إضافة خيار
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 premium-btn" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-job">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                {editingId ? "تحديث الوظيفة" : "إضافة الوظيفة"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Application Dialog */}
      <Dialog open={!!viewApp} onOpenChange={v => !v && setViewApp(null)}>
        <DialogContent className="bg-white dark:bg-gray-900 border-black/[0.06] dark:border-white/[0.06] max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-sm font-black">
                {viewApp?.fullName?.[0]?.toUpperCase()}
              </div>
              {viewApp?.fullName}
            </DialogTitle>
          </DialogHeader>
          {viewApp && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["البريد الإلكتروني", viewApp.email, "ltr"],
                  ["رقم الهاتف", viewApp.phone || "—", "ltr"],
                  ["الوظيفة", jobs?.find(j => j.id?.toString() === viewApp.jobId?.toString())?.title || "—", "rtl"],
                  ["تاريخ التقديم", new Date(viewApp.appliedAt || "").toLocaleDateString("ar-SA"), "rtl"],
                ].map(([label, val, dir]) => (
                  <div key={label} className="bg-black/[0.03] dark:bg-white/[0.04] rounded-xl p-3">
                    <p className="text-[10px] text-black/40 dark:text-white/40 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-black dark:text-white" dir={dir as any}>{val}</p>
                  </div>
                ))}
              </div>
              {viewApp.resumeUrl && (
                <a href={viewApp.resumeUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-sm font-semibold hover:bg-blue-100 transition-colors"
                  data-testid="link-view-resume">
                  <FileText className="w-4 h-4" />
                  {viewApp.resumeUrl.startsWith("/uploads") ? "تحميل السيرة الذاتية" : "عرض السيرة الذاتية على الرابط"}
                </a>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setViewApp(null)} className="flex-1 rounded-xl">إغلاق</Button>
                {viewApp.status === "accepted" && (
                  <Button className="flex-1 premium-btn rounded-xl gap-2" onClick={() => { setViewApp(null); openHireDialog(viewApp); }}>
                    <UserPlus className="w-4 h-4" />تعيين كموظف
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hire Dialog */}
      <Dialog open={hireOpen} onOpenChange={(v) => { if (!v) { setHireOpen(false); setHired(null); } }}>
        <DialogContent className="bg-white dark:bg-gray-900 border-black/[0.06] dark:border-white/[0.06] max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-black/40 dark:text-white/40" />تعيين موظف جديد
            </DialogTitle>
          </DialogHeader>
          {hired ? (
            <div className="py-4 space-y-4">
              <div className="text-center">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="font-bold text-lg mb-1">تم التعيين بنجاح!</h3>
                <p className="text-black/40 dark:text-white/40 text-sm">احتفظ ببيانات الدخول — تم إرسالها بالبريد أيضاً</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">بيانات دخول الموظف</p>
                {[["البريد الإلكتروني", hired.email], ["اسم المستخدم", hired.username]].map(([label, val]) => (
                  <div key={label} className="bg-white dark:bg-gray-800 rounded-xl p-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] text-black/40 dark:text-white/40 font-medium mb-0.5">{label}</p>
                      <p className="text-sm font-bold font-mono" dir="ltr">{val}</p>
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(val); toast({ title: "تم النسخ" }); }} className="w-7 h-7 rounded-lg bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/10 flex items-center justify-center transition-colors">
                      <Copy className="w-3.5 h-3.5 text-black/50 dark:text-white/50" />
                    </button>
                  </div>
                ))}
                <div className="bg-black dark:bg-white rounded-xl p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-white/40 dark:text-black/40 font-medium mb-0.5">كلمة المرور</p>
                    <p className="text-sm font-black text-white dark:text-black font-mono tracking-wider" dir="ltr">{hired.password}</p>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(hired.password); toast({ title: "تم نسخ كلمة المرور" }); }} className="w-7 h-7 rounded-lg bg-white/10 dark:bg-black/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Copy className="w-3.5 h-3.5 text-white/60 dark:text-black/60" />
                  </button>
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-amber-700 dark:text-amber-400 text-xs">تم إرسال هذه البيانات إلى بريد الموظف تلقائياً</p>
              </div>
              <Button className="w-full premium-btn rounded-xl" onClick={() => { setHireOpen(false); setHired(null); }}>إغلاق</Button>
            </div>
          ) : (
            <div className="space-y-5 mt-4">
              {hireApp && (
                <div className="bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold shrink-0">{hireApp.fullName[0]}</div>
                  <div>
                    <p className="font-bold text-sm">{hireApp.fullName}</p>
                    <p className="text-xs text-black/40 dark:text-white/40" dir="ltr">{hireApp.email}</p>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-1.5">اسم المستخدم في النظام *</label>
                <Input value={hireForm.username} onChange={(e) => setHireForm({ ...hireForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })} placeholder="ahmed_developer" dir="ltr" data-testid="input-hire-username" />
                <p className="text-xs text-black/30 dark:text-white/30 mt-1">أحرف إنجليزية وأرقام وشرطة سفلية فقط</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-1.5">دور الموظف في النظام *</label>
                <Select value={hireForm.role} onValueChange={(v) => setHireForm({ ...hireForm, role: v })}>
                  <SelectTrigger data-testid="select-hire-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}><span className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-black/30" />{label}</span></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1 premium-btn gap-2 rounded-xl" onClick={handleHire} disabled={hireMutation.isPending} data-testid="button-confirm-hire">
                  {hireMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  تأكيد التعيين
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => setHireOpen(false)}>إلغاء</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
