import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, LayoutGrid, RefreshCw, User, Calendar, Tag, ChevronRight, Plus, X, Database, Server, Globe, Code, GitBranch, Layers, ClipboardList, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Link } from "wouter";

function getStages(L: boolean) {
  return [
  { key: "new",             label: L ? "جديد" : "New",                 color: "bg-slate-100 dark:bg-slate-800",   border: "border-slate-300 dark:border-slate-600",   dot: "bg-slate-400" },
  { key: "under_study",     label: L ? "قيد الدراسة" : "Under Study",  color: "bg-black/[0.04] dark:bg-white/[0.06]", border: "border-black/15 dark:border-white/15", dot: "bg-black/[0.08] dark:bg-white/[0.1]" },
  { key: "pending_payment", label: L ? "انتظار الدفع" : "Pending Payment", color: "bg-black/[0.04] dark:bg-white/[0.06]", border: "border-black/15 dark:border-white/15", dot: "bg-black/[0.08] dark:bg-white/[0.1]" },
  { key: "in_progress",     label: L ? "قيد التنفيذ" : "In Progress",  color: "bg-black/[0.04] dark:bg-white/[0.06]", border: "border-black/15 dark:border-white/15", dot: "bg-black dark:bg-white" },
  { key: "testing",         label: L ? "اختبار" : "Testing",           color: "bg-black/[0.04] dark:bg-white/[0.06]", border: "border-black/15 dark:border-white/15", dot: "bg-black dark:bg-white" },
  { key: "review",          label: L ? "مراجعة" : "Review",            color: "bg-black/[0.04] dark:bg-white/[0.06]", border: "border-black/15 dark:border-white/15", dot: "bg-black dark:bg-white" },
  { key: "delivery",        label: L ? "تسليم" : "Delivery",           color: "bg-black/[0.04] dark:bg-white/[0.06]", border: "border-black/15 dark:border-white/15", dot: "bg-black dark:bg-white" },
  { key: "closed",          label: L ? "مغلق" : "Closed",              color: "bg-black/[0.04] dark:bg-white/[0.06]", border: "border-black/15 dark:border-white/15", dot: "bg-black dark:bg-white" },
];
}

const priorityColors: Record<string, string> = {
  low:    "bg-slate-100 text-slate-500 border-slate-200",
  medium: "bg-blue-50 text-blue-600 border-blue-200",
  high:   "bg-orange-50 text-orange-600 border-orange-200",
  urgent: "bg-red-50 text-red-600 border-red-200",
};
const priorityLabels: Record<string, string> = { low: "منخفض", medium: "متوسط", high: "عالي", urgent: "عاجل" };

function ProjectCard({ project, onMove }: { project: any; onMove: (id: string, status: string) => void }) {
  const [showMove, setShowMove] = useState(false);
  const { lang } = useI18n();
  const L = lang === "ar";
  const stages = getStages(L);
  const currentStage = stages.find(s => s.key === project.status) || stages[0];

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
      className="bg-white dark:bg-gray-900 rounded-xl border border-black/[0.07] dark:border-white/[0.07] p-3 shadow-sm hover:shadow-md transition-shadow group"
      data-testid={`kanban-card-${project._id}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <span className="font-mono text-[9px] font-bold text-black/30 dark:text-white/30 bg-black/[0.05] dark:bg-white/[0.07] px-1.5 py-0.5 rounded inline-block mb-0.5">{`#${String(project._id)?.slice(-6).toUpperCase()}`}</span>
          <p className="text-sm font-bold text-black dark:text-white truncate">
            {project.order?.businessName || project.order?.serviceType || (L ? "مشروع" : "Project")}
          </p>
          {project.order?.sector && (
            <span className="inline-flex items-center gap-1 text-[10px] text-black/40 dark:text-white/40 mt-0.5">
              <Tag className="w-2.5 h-2.5" />{project.order.sector}
            </span>
          )}
        </div>
        <button onClick={() => setShowMove(v => !v)}
          className="shrink-0 p-1 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors opacity-0 group-hover:opacity-100"
          data-testid={`button-move-${project._id}`} title={L ? "نقل المرحلة" : "Move stage"}>
          <ChevronRight className="w-3.5 h-3.5 text-black/30 dark:text-white/30" />
        </button>
      </div>
      {project.clientId && (
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-4 h-4 rounded-full bg-black/[0.06] dark:bg-white/[0.06] flex items-center justify-center">
            <User className="w-2.5 h-2.5 text-black/40 dark:text-white/40" />
          </div>
          <span className="text-[11px] text-black/50 dark:text-white/45 truncate">{project.clientId?.fullName || project.clientId?.username || "—"}</span>
        </div>
      )}
      {project.deadline && (
        <div className="flex items-center gap-1 text-[10px] text-black/35 dark:text-white/35 mb-2">
          <Calendar className="w-2.5 h-2.5" />
          {new Date(project.deadline).toLocaleDateString(L ? "ar-SA" : "en-US")}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${currentStage.dot}`} />
          <span className="text-[10px] text-black/40 dark:text-white/40">{project.progress || 0}%</span>
        </div>
        <Link href={`/projects/${project._id}`} className="text-[10px] text-black dark:text-white hover:underline">{L ? "فتح" : "Open"}</Link>
      </div>
      <AnimatePresence>
        {showMove && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.05]">
            <p className="text-[10px] text-black/40 dark:text-white/40 mb-1.5">{L ? "نقل إلى:" : "Move to:"}</p>
            <div className="flex flex-wrap gap-1">
              {stages.filter(s => s.key !== project.status).map(s => (
                <button key={s.key} onClick={() => { onMove(project._id, s.key); setShowMove(false); }}
                  className="text-[9px] px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-black/60 dark:text-white/60 transition-colors">
                  {s.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TaskCard({ task, onMove, onDelete }: { task: any; onMove: (id: string, status: string) => void; onDelete: (id: string) => void }) {
  const [showMove, setShowMove] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const { lang } = useI18n();
  const L = lang === "ar";
  const stages = getStages(L);
  const isWebPlan = task.templateType === "website_plan";

  return (
    <>
      <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
        className="bg-white dark:bg-gray-900 rounded-xl border border-black/[0.07] dark:border-white/[0.07] p-3 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
        data-testid={`kanban-task-${task._id}`} onClick={() => setShowDetail(true)}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {isWebPlan && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black">
                  <Globe className="w-2.5 h-2.5" /> {L ? "خطة موقع" : "Web Plan"}
                </span>
              )}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${priorityColors[task.priority] || priorityColors.medium}`}>
                {L ? priorityLabels[task.priority] : task.priority}
              </span>
            </div>
            <p className="text-sm font-bold text-black dark:text-white truncate">{task.title}</p>
            {task.description && <p className="text-[10px] text-black/40 dark:text-white/40 mt-0.5 truncate">{task.description}</p>}
          </div>
          <button onClick={e => { e.stopPropagation(); setShowMove(v => !v); }}
            className="shrink-0 p-1 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors opacity-0 group-hover:opacity-100"
            data-testid={`button-move-task-${task._id}`}>
            <ChevronRight className="w-3.5 h-3.5 text-black/30 dark:text-white/30" />
          </button>
        </div>
        {task.assignedTo && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">{(task.assignedTo.fullName || task.assignedTo.username || "?")[0]}</span>
            </div>
            <span className="text-[11px] text-black/50 dark:text-white/45 truncate">{task.assignedTo.fullName || task.assignedTo.username}</span>
          </div>
        )}
        {task.deadline && (
          <div className="flex items-center gap-1 text-[10px] text-black/35 dark:text-white/35 mb-1">
            <Calendar className="w-2.5 h-2.5" />
            {new Date(task.deadline).toLocaleDateString(L ? "ar-SA" : "en-US")}
          </div>
        )}
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-black/25 dark:text-white/25">{L ? "مهمة" : "Task"}</span>
          <button onClick={e => { e.stopPropagation(); if (confirm(L ? "حذف هذه المهمة؟" : "Delete this task?")) onDelete(task._id); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-500 text-black/30 transition-colors"
            data-testid={`button-delete-task-${task._id}`}>
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
        <AnimatePresence>
          {showMove && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.05]" onClick={e => e.stopPropagation()}>
              <p className="text-[10px] text-black/40 dark:text-white/40 mb-1.5">{L ? "نقل إلى:" : "Move to:"}</p>
              <div className="flex flex-wrap gap-1">
                {stages.filter(s => s.key !== task.status).map(s => (
                  <button key={s.key} onClick={() => { onMove(task._id, s.key); setShowMove(false); }}
                    className="text-[9px] px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-black/60 dark:text-white/60 transition-colors">
                    {s.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Task detail dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {isWebPlan && <Globe className="w-4 h-4" />}
              {task.title}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <div className="space-y-4 p-1">
              {task.description && <p className="text-sm text-black/60 dark:text-white/60">{task.description}</p>}
              {isWebPlan && task.plan && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {task.plan.projectConcept && (
                      <div className="col-span-2 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl p-3 border border-black/[0.06]">
                        <p className="text-[10px] font-bold text-black/40 uppercase mb-1">{L ? "فكرة المشروع" : "Project Concept"}</p>
                        <p className="text-sm text-black dark:text-white">{task.plan.projectConcept}</p>
                      </div>
                    )}
                    {task.plan.techStack && (
                      <div className="bg-black/[0.03] dark:bg-white/[0.03] rounded-xl p-3 border border-black/[0.06]">
                        <p className="text-[10px] font-bold text-black/40 uppercase mb-1 flex items-center gap-1"><Code className="w-3 h-3" /> {L ? "التقنيات" : "Tech Stack"}</p>
                        <p className="text-sm text-black dark:text-white font-mono">{task.plan.techStack}</p>
                      </div>
                    )}
                    {task.plan.framework && (
                      <div className="bg-black/[0.03] dark:bg-white/[0.03] rounded-xl p-3 border border-black/[0.06]">
                        <p className="text-[10px] font-bold text-black/40 uppercase mb-1 flex items-center gap-1"><Layers className="w-3 h-3" /> {L ? "الإطار" : "Framework"}</p>
                        <p className="text-sm text-black dark:text-white font-mono">{task.plan.framework}</p>
                      </div>
                    )}
                    {task.plan.database && (
                      <div className="bg-black/[0.03] dark:bg-white/[0.03] rounded-xl p-3 border border-black/[0.06]">
                        <p className="text-[10px] font-bold text-black/40 uppercase mb-1 flex items-center gap-1"><Database className="w-3 h-3" /> {L ? "قاعدة البيانات" : "Database"}</p>
                        <p className="text-sm text-black dark:text-white font-mono">{task.plan.database}</p>
                      </div>
                    )}
                    {task.plan.databaseDesign && (
                      <div className="col-span-2 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl p-3 border border-black/[0.06]">
                        <p className="text-[10px] font-bold text-black/40 uppercase mb-1 flex items-center gap-1"><Database className="w-3 h-3" /> {L ? "تصميم قاعدة البيانات" : "Database Design"}</p>
                        <p className="text-sm text-black dark:text-white whitespace-pre-wrap font-mono">{task.plan.databaseDesign}</p>
                      </div>
                    )}
                    {task.plan.hosting && (
                      <div className="bg-black/[0.03] dark:bg-white/[0.03] rounded-xl p-3 border border-black/[0.06]">
                        <p className="text-[10px] font-bold text-black/40 uppercase mb-1 flex items-center gap-1"><Server className="w-3 h-3" /> {L ? "الاستضافة" : "Hosting"}</p>
                        <p className="text-sm text-black dark:text-white font-mono">{task.plan.hosting}</p>
                      </div>
                    )}
                    {task.plan.deploymentStrategy && (
                      <div className="col-span-2 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl p-3 border border-black/[0.06]">
                        <p className="text-[10px] font-bold text-black/40 uppercase mb-1 flex items-center gap-1"><GitBranch className="w-3 h-3" /> {L ? "استراتيجية النشر" : "Deployment Strategy"}</p>
                        <p className="text-sm text-black dark:text-white whitespace-pre-wrap">{task.plan.deploymentStrategy}</p>
                      </div>
                    )}
                    {task.plan.mainFeatures && (
                      <div className="col-span-2 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl p-3 border border-black/[0.06]">
                        <p className="text-[10px] font-bold text-black/40 uppercase mb-1">{L ? "المميزات الأساسية" : "Main Features"}</p>
                        <p className="text-sm text-black dark:text-white whitespace-pre-wrap">{task.plan.mainFeatures}</p>
                      </div>
                    )}
                    {(task.plan.domain || task.plan.githubRepo || task.plan.stagingUrl || task.plan.productionUrl) && (
                      <div className="col-span-2 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl p-3 border border-black/[0.06]">
                        <p className="text-[10px] font-bold text-black/40 uppercase mb-2">{L ? "الروابط والنطاق" : "Links & Domain"}</p>
                        <div className="space-y-1">
                          {task.plan.domain && <p className="text-xs text-black/70 dark:text-white/70 font-mono">{L ? "النطاق: " : "Domain: "}{task.plan.domain}</p>}
                          {task.plan.githubRepo && <p className="text-xs text-black/70 dark:text-white/70 font-mono">{L ? "GitHub: " : "GitHub: "}{task.plan.githubRepo}</p>}
                          {task.plan.stagingUrl && <p className="text-xs text-black/70 dark:text-white/70 font-mono">{L ? "Staging: " : "Staging: "}{task.plan.stagingUrl}</p>}
                          {task.plan.productionUrl && <p className="text-xs text-black/70 dark:text-white/70 font-mono">{L ? "Production: " : "Production: "}{task.plan.productionUrl}</p>}
                        </div>
                      </div>
                    )}
                    {task.plan.notes && (
                      <div className="col-span-2 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl p-3 border border-black/[0.06]">
                        <p className="text-[10px] font-bold text-black/40 uppercase mb-1">{L ? "ملاحظات" : "Notes"}</p>
                        <p className="text-sm text-black dark:text-white whitespace-pre-wrap">{task.plan.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

const WEBSITE_PLAN_DEFAULTS = {
  projectConcept: "",
  techStack: "React + Node.js + MongoDB",
  framework: "Vite + Express",
  language: "TypeScript",
  database: "MongoDB Atlas",
  databaseDesign: "",
  hosting: "VPS / Cloud",
  deploymentStrategy: "",
  domain: "",
  serverIp: "",
  githubRepo: "",
  stagingUrl: "",
  productionUrl: "",
  sslEnabled: false,
  mainFeatures: "",
  targetAudience: "",
  estimatedHours: "",
  notes: "",
};

export default function AdminKanban() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const STAGES = getStages(L);
  const qc = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [templateType, setTemplateType] = useState<"custom" | "website_plan">("custom");
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "new",
    priority: "medium",
    assignedTo: "",
    deadline: "",
  });
  const [plan, setPlan] = useState({ ...WEBSITE_PLAN_DEFAULTS });

  const { data: projects = [], isLoading: loadingProjects, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/kanban"],
  });

  const { data: tasks = [], isLoading: loadingTasks, refetch: refetchTasks } = useQuery<any[]>({
    queryKey: ["/api/admin/kanban/tasks"],
  });

  const { data: employees = [] } = useQuery<any[]>({ queryKey: ["/api/admin/employees"] });

  const moveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/admin/kanban/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/kanban"] }),
    onError: () => toast({ title: L ? "فشل التحديث" : "Update failed", variant: "destructive" }),
  });

  const moveTaskMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/admin/kanban/tasks/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/kanban/tasks"] }),
    onError: () => toast({ title: L ? "فشل التحديث" : "Update failed", variant: "destructive" }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/kanban/tasks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/kanban/tasks"] });
      toast({ title: L ? "تم حذف المهمة" : "Task deleted" });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/kanban/tasks", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/kanban/tasks"] });
      toast({ title: L ? "تم إنشاء المهمة" : "Task created", description: form.title });
      setCreateOpen(false);
      setForm({ title: "", description: "", status: "new", priority: "medium", assignedTo: "", deadline: "" });
      setPlan({ ...WEBSITE_PLAN_DEFAULTS });
      setTemplateType("custom");
    },
    onError: (err: any) => toast({ title: L ? "فشل الإنشاء" : "Creation failed", description: err.message, variant: "destructive" }),
  });

  const handleCreate = () => {
    if (!form.title.trim()) {
      toast({ title: L ? "العنوان مطلوب" : "Title required", variant: "destructive" });
      return;
    }
    createTaskMutation.mutate({
      ...form,
      assignedTo: form.assignedTo || null,
      deadline: form.deadline || null,
      templateType,
      plan: templateType === "website_plan" ? plan : undefined,
    });
  };

  const isLoading = loadingProjects || loadingTasks;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" />
      </div>
    );
  }

  const groupedProjects = STAGES.reduce((acc, s) => {
    acc[s.key] = projects.filter((p: any) => p.status === s.key);
    return acc;
  }, {} as Record<string, any[]>);

  const groupedTasks = STAGES.reduce((acc, s) => {
    acc[s.key] = tasks.filter((t: any) => t.status === s.key);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-4 space-y-4" dir={dir}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            {L ? "لوحة المشاريع" : "Projects Board"}
          </h1>
          <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">
            {projects.length} {L ? "مشروع" : "projects"} · {tasks.length} {L ? "مهمة" : "tasks"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => { refetch(); refetchTasks(); }} data-testid="button-refresh-kanban">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" className="bg-black text-white dark:bg-white dark:text-black h-8 text-xs gap-1.5"
            onClick={() => setCreateOpen(true)} data-testid="button-create-task">
            <Plus className="w-3.5 h-3.5" />
            {L ? "مهمة جديدة" : "New Task"}
          </Button>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "70vh" }}>
        {STAGES.map(stage => {
          const cols = groupedProjects[stage.key] || [];
          const taskCols = groupedTasks[stage.key] || [];
          const total = cols.length + taskCols.length;
          return (
            <div key={stage.key} className="flex-shrink-0 w-60">
              <div className={`rounded-xl border ${stage.border} ${stage.color} p-2 h-full`}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`w-2 h-2 rounded-full ${stage.dot}`} />
                  <span className="text-xs font-black text-black/70 dark:text-white/70">{stage.label}</span>
                  <span className="mr-auto text-[10px] text-black/40 dark:text-white/40 bg-black/[0.05] dark:bg-white/[0.05] px-1.5 py-0.5 rounded-full">{total}</span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {cols.map((project: any) => (
                      <ProjectCard key={project._id} project={project}
                        onMove={(id, status) => moveMutation.mutate({ id, status })} />
                    ))}
                    {taskCols.map((task: any) => (
                      <TaskCard key={task._id} task={task}
                        onMove={(id, status) => moveTaskMutation.mutate({ id, status })}
                        onDelete={(id) => deleteTaskMutation.mutate(id)} />
                    ))}
                  </AnimatePresence>
                  {total === 0 && (
                    <div className="text-center py-8 text-[11px] text-black/25 dark:text-white/25">
                      {L ? "لا توجد عناصر" : "No items"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task / Plan Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" dir={dir}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              {L ? "إنشاء مهمة جديدة" : "Create New Task"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <div className="space-y-4 p-1">
              {/* Template selector */}
              <div>
                <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-2">{L ? "نوع المهمة" : "Task Type"}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setTemplateType("custom")}
                    className={`p-3 rounded-xl border text-right transition-colors ${templateType === "custom" ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black" : "border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.02] text-black dark:text-white hover:bg-black/[0.05]"}`}
                    data-testid="button-template-custom">
                    <ClipboardList className="w-4 h-4 mb-1" />
                    <p className="text-xs font-bold">{L ? "مهمة عادية" : "Custom Task"}</p>
                    <p className="text-[10px] opacity-60">{L ? "مهمة مخصصة بحرية" : "Free-form task"}</p>
                  </button>
                  <button onClick={() => setTemplateType("website_plan")}
                    className={`p-3 rounded-xl border text-right transition-colors ${templateType === "website_plan" ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black" : "border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.02] text-black dark:text-white hover:bg-black/[0.05]"}`}
                    data-testid="button-template-website-plan">
                    <Globe className="w-4 h-4 mb-1" />
                    <p className="text-xs font-bold">{L ? "خطة إنشاء موقع" : "Website Creation Plan"}</p>
                    <p className="text-[10px] opacity-60">{L ? "قاعدة بيانات · نشر · مواصفات" : "DB · Deployment · Specs"}</p>
                  </button>
                </div>
              </div>

              {/* Common fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-1.5 block">{L ? "عنوان المهمة *" : "Task Title *"}</label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder={L ? "مثال: خطة موقع مطعم الأصالة" : "e.g., Al Asala Restaurant Website Plan"}
                    className="h-10" data-testid="input-task-title" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-1.5 block">{L ? "وصف" : "Description"}</label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder={L ? "وصف مختصر للمهمة..." : "Brief description..."}
                    className="resize-none h-20" data-testid="input-task-description" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-1.5 block">{L ? "الأولوية" : "Priority"}</label>
                    <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                      <SelectTrigger className="h-9" data-testid="select-task-priority"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">{L ? "منخفض" : "Low"}</SelectItem>
                        <SelectItem value="medium">{L ? "متوسط" : "Medium"}</SelectItem>
                        <SelectItem value="high">{L ? "عالي" : "High"}</SelectItem>
                        <SelectItem value="urgent">{L ? "عاجل" : "Urgent"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-1.5 block">{L ? "الحالة" : "Status"}</label>
                    <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger className="h-9" data-testid="select-task-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-1.5 block">{L ? "الموعد" : "Deadline"}</label>
                    <Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                      className="h-9" data-testid="input-task-deadline" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-1.5 block">{L ? "مسؤول التنفيذ" : "Assignee"}</label>
                  <Select value={form.assignedTo} onValueChange={v => setForm(f => ({ ...f, assignedTo: v }))}>
                    <SelectTrigger className="h-9" data-testid="select-task-assignee"><SelectValue placeholder={L ? "اختر موظفاً..." : "Select employee..."} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{L ? "بدون تعيين" : "Unassigned"}</SelectItem>
                      {(employees as any[]).map((e: any) => (
                        <SelectItem key={e.id || e._id} value={e.id || e._id}>{e.fullName || e.username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Website plan fields */}
              {templateType === "website_plan" && (
                <div className="space-y-4 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-black/60 dark:text-white/60" />
                    <p className="text-xs font-bold text-black/60 dark:text-white/60 uppercase tracking-widest">{L ? "المواصفات التقنية لإنشاء الموقع" : "Website Technical Specifications"}</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-black/40 uppercase mb-1.5 block">{L ? "فكرة المشروع" : "Project Concept"}</label>
                    <Textarea value={plan.projectConcept} onChange={e => setPlan(p => ({ ...p, projectConcept: e.target.value }))}
                      placeholder={L ? "وصف تفصيلي لفكرة الموقع والهدف منه..." : "Detailed description of the website idea and purpose..."}
                      className="resize-none h-20" data-testid="input-plan-concept" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-black/40 uppercase mb-1.5 flex items-center gap-1"><Code className="w-3 h-3" /> {L ? "مكدس التقنيات" : "Tech Stack"}</label>
                      <Input value={plan.techStack} onChange={e => setPlan(p => ({ ...p, techStack: e.target.value }))}
                        placeholder="React + Node.js + MongoDB" className="h-9 font-mono text-sm" data-testid="input-plan-tech" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-black/40 uppercase mb-1.5 flex items-center gap-1"><Layers className="w-3 h-3" /> {L ? "الإطار البرمجي" : "Framework"}</label>
                      <Input value={plan.framework} onChange={e => setPlan(p => ({ ...p, framework: e.target.value }))}
                        placeholder="Vite + Express" className="h-9 font-mono text-sm" data-testid="input-plan-framework" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-black/40 uppercase mb-1.5 flex items-center gap-1"><Code className="w-3 h-3" /> {L ? "لغة البرمجة" : "Language"}</label>
                      <Input value={plan.language} onChange={e => setPlan(p => ({ ...p, language: e.target.value }))}
                        placeholder="TypeScript" className="h-9 font-mono text-sm" data-testid="input-plan-lang" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-black/40 uppercase mb-1.5 flex items-center gap-1"><Database className="w-3 h-3" /> {L ? "قاعدة البيانات" : "Database"}</label>
                      <Input value={plan.database} onChange={e => setPlan(p => ({ ...p, database: e.target.value }))}
                        placeholder="MongoDB Atlas" className="h-9 font-mono text-sm" data-testid="input-plan-db" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-black/40 uppercase mb-1.5 flex items-center gap-1"><Database className="w-3 h-3" /> {L ? "تصميم قاعدة البيانات (Collections / Tables)" : "Database Design (Collections / Tables)"}</label>
                    <Textarea value={plan.databaseDesign} onChange={e => setPlan(p => ({ ...p, databaseDesign: e.target.value }))}
                      placeholder={L ? "مثال:\nUsers: { name, email, phone, role }\nOrders: { userId, items[], total, status }\nProducts: { name, price, category, stock }" : "Example:\nUsers: { name, email, phone, role }\nOrders: { userId, items[], total, status }"}
                      className="resize-none h-28 font-mono text-sm" data-testid="input-plan-db-design" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-black/40 uppercase mb-1.5 flex items-center gap-1"><Server className="w-3 h-3" /> {L ? "الاستضافة" : "Hosting"}</label>
                      <Input value={plan.hosting} onChange={e => setPlan(p => ({ ...p, hosting: e.target.value }))}
                        placeholder="VPS / Netlify / Vercel" className="h-9 font-mono text-sm" data-testid="input-plan-hosting" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-black/40 uppercase mb-1.5 flex items-center gap-1"><Globe className="w-3 h-3" /> {L ? "النطاق (Domain)" : "Domain"}</label>
                      <Input value={plan.domain} onChange={e => setPlan(p => ({ ...p, domain: e.target.value }))}
                        placeholder="example.com" className="h-9 font-mono text-sm" data-testid="input-plan-domain" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-black/40 uppercase mb-1.5 flex items-center gap-1"><GitBranch className="w-3 h-3" /> GitHub</label>
                      <Input value={plan.githubRepo} onChange={e => setPlan(p => ({ ...p, githubRepo: e.target.value }))}
                        placeholder="github.com/user/repo" className="h-9 font-mono text-sm" data-testid="input-plan-github" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-black/40 uppercase mb-1.5">IP {L ? "الخادم" : "Server"}</label>
                      <Input value={plan.serverIp} onChange={e => setPlan(p => ({ ...p, serverIp: e.target.value }))}
                        placeholder="1.2.3.4" className="h-9 font-mono text-sm" data-testid="input-plan-serverip" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-black/40 uppercase mb-1.5 flex items-center gap-1"><GitBranch className="w-3 h-3" /> {L ? "استراتيجية النشر والـ CI/CD" : "Deployment Strategy & CI/CD"}</label>
                    <Textarea value={plan.deploymentStrategy} onChange={e => setPlan(p => ({ ...p, deploymentStrategy: e.target.value }))}
                      placeholder={L ? "مثال:\n- GitHub Actions للـ CI/CD\n- PM2 لإدارة العمليات على الخادم\n- Nginx كـ reverse proxy\n- Let's Encrypt للـ SSL" : "e.g.:\n- GitHub Actions for CI/CD\n- PM2 for process management\n- Nginx as reverse proxy"}
                      className="resize-none h-24" data-testid="input-plan-deploy" />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-black/40 uppercase mb-1.5">{L ? "المميزات الأساسية" : "Main Features"}</label>
                    <Textarea value={plan.mainFeatures} onChange={e => setPlan(p => ({ ...p, mainFeatures: e.target.value }))}
                      placeholder={L ? "- تسجيل دخول المستخدمين\n- لوحة إدارة\n- نظام طلبات\n- تكامل دفع إلكتروني" : "- User authentication\n- Admin dashboard\n- Order system"}
                      className="resize-none h-24" data-testid="input-plan-features" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-black/40 uppercase mb-1.5">Staging URL</label>
                      <Input value={plan.stagingUrl} onChange={e => setPlan(p => ({ ...p, stagingUrl: e.target.value }))}
                        placeholder="staging.example.com" className="h-9 font-mono text-sm" data-testid="input-plan-staging" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-black/40 uppercase mb-1.5">Production URL</label>
                      <Input value={plan.productionUrl} onChange={e => setPlan(p => ({ ...p, productionUrl: e.target.value }))}
                        placeholder="app.example.com" className="h-9 font-mono text-sm" data-testid="input-plan-prod" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-black/40 uppercase mb-1.5">{L ? "ملاحظات إضافية" : "Additional Notes"}</label>
                    <Textarea value={plan.notes} onChange={e => setPlan(p => ({ ...p, notes: e.target.value }))}
                      placeholder={L ? "أي ملاحظات تقنية أو تفاصيل إضافية..." : "Any technical notes or additional details..."}
                      className="resize-none h-20" data-testid="input-plan-notes" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-between pt-3 border-t border-black/[0.06] dark:border-white/[0.06] mt-2">
            <Button variant="ghost" size="sm" onClick={() => setCreateOpen(false)} data-testid="button-cancel-task">
              <X className="w-4 h-4 mr-1" /> {L ? "إلغاء" : "Cancel"}
            </Button>
            <Button size="sm" className="bg-black text-white dark:bg-white dark:text-black gap-1.5"
              onClick={handleCreate} disabled={createTaskMutation.isPending} data-testid="button-submit-task">
              {createTaskMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {L ? "إنشاء المهمة" : "Create Task"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
