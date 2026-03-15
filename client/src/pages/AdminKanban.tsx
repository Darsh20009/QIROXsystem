import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, LayoutGrid, RefreshCw, User, Calendar, Tag, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const STAGES = [
  { key: "new",             label: "جديد",            color: "bg-slate-100 dark:bg-slate-800",   border: "border-slate-300 dark:border-slate-600",   dot: "bg-slate-400" },
  { key: "under_study",     label: "قيد الدراسة",     color: "bg-amber-50 dark:bg-amber-900/30", border: "border-amber-300 dark:border-amber-700",    dot: "bg-amber-400" },
  { key: "pending_payment", label: "انتظار الدفع",    color: "bg-orange-50 dark:bg-orange-900/30", border: "border-orange-300 dark:border-orange-700", dot: "bg-orange-400" },
  { key: "in_progress",     label: "قيد التنفيذ",     color: "bg-blue-50 dark:bg-blue-900/30",   border: "border-blue-300 dark:border-blue-700",     dot: "bg-blue-500" },
  { key: "testing",         label: "اختبار",          color: "bg-purple-50 dark:bg-purple-900/30", border: "border-purple-300 dark:border-purple-700", dot: "bg-purple-500" },
  { key: "review",          label: "مراجعة",          color: "bg-pink-50 dark:bg-pink-900/30",   border: "border-pink-300 dark:border-pink-700",     dot: "bg-pink-500" },
  { key: "delivery",        label: "تسليم",           color: "bg-teal-50 dark:bg-teal-900/30",   border: "border-teal-300 dark:border-teal-700",     dot: "bg-teal-500" },
  { key: "closed",          label: "مغلق",            color: "bg-emerald-50 dark:bg-emerald-900/30", border: "border-emerald-300 dark:border-emerald-700", dot: "bg-emerald-500" },
];

function ProjectCard({ project, onMove }: { project: any; onMove: (id: string, status: string) => void }) {
  const [showMove, setShowMove] = useState(false);
  const currentStage = STAGES.find(s => s.key === project.status) || STAGES[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-white dark:bg-gray-900 rounded-xl border border-black/[0.07] dark:border-white/[0.07] p-3 shadow-sm hover:shadow-md transition-shadow group"
      data-testid={`kanban-card-${project._id}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <span className="font-mono text-[9px] font-bold text-black/30 dark:text-white/30 bg-black/[0.05] dark:bg-white/[0.07] px-1.5 py-0.5 rounded inline-block mb-0.5">{`#${String(project._id)?.slice(-6).toUpperCase()}`}</span>
          <p className="text-sm font-bold text-black dark:text-white truncate">
            {project.order?.businessName || project.order?.serviceType || "مشروع"}
          </p>
          {project.order?.sector && (
            <span className="inline-flex items-center gap-1 text-[10px] text-black/40 dark:text-white/40 mt-0.5">
              <Tag className="w-2.5 h-2.5" />
              {project.order.sector}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowMove(v => !v)}
          className="shrink-0 p-1 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors opacity-0 group-hover:opacity-100"
          data-testid={`button-move-${project._id}`}
          title="نقل المرحلة"
        >
          <ChevronRight className="w-3.5 h-3.5 text-black/30 dark:text-white/30" />
        </button>
      </div>

      {project.clientId && (
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-4 h-4 rounded-full bg-black/[0.06] dark:bg-white/[0.06] flex items-center justify-center">
            <User className="w-2.5 h-2.5 text-black/40 dark:text-white/40" />
          </div>
          <span className="text-[11px] text-black/50 dark:text-white/45 truncate">
            {project.clientId?.fullName || project.clientId?.username || "—"}
          </span>
        </div>
      )}

      {project.deadline && (
        <div className="flex items-center gap-1 text-[10px] text-black/35 dark:text-white/35 mb-2">
          <Calendar className="w-2.5 h-2.5" />
          {new Date(project.deadline).toLocaleDateString("ar-SA")}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${currentStage.dot}`} />
          <span className="text-[10px] text-black/40 dark:text-white/40">{project.progress || 0}%</span>
        </div>
        <Link href={`/projects/${project._id}`} className="text-[10px] text-blue-500 hover:underline">
          فتح
        </Link>
      </div>

      <AnimatePresence>
        {showMove && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.05]"
          >
            <p className="text-[10px] text-black/40 dark:text-white/40 mb-1.5">نقل إلى:</p>
            <div className="flex flex-wrap gap-1">
              {STAGES.filter(s => s.key !== project.status).map(s => (
                <button
                  key={s.key}
                  onClick={() => { onMove(project._id, s.key); setShowMove(false); }}
                  className="text-[9px] px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-black/60 dark:text-white/60 transition-colors"
                >
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

export default function AdminKanban() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: projects = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/kanban"],
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/admin/kanban/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/kanban"] }),
    onError: () => toast({ title: "فشل التحديث", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" />
      </div>
    );
  }

  const grouped = STAGES.reduce((acc, s) => {
    acc[s.key] = projects.filter((p: any) => p.status === s.key);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-4 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            لوحة المشاريع
          </h1>
          <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">{projects.length} مشروع</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} data-testid="button-refresh-kanban">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "70vh" }}>
        {STAGES.map(stage => {
          const cols = grouped[stage.key] || [];
          return (
            <div key={stage.key} className="flex-shrink-0 w-60">
              <div className={`rounded-xl border ${stage.border} ${stage.color} p-2 h-full`}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`w-2 h-2 rounded-full ${stage.dot}`} />
                  <span className="text-xs font-black text-black/70 dark:text-white/70">{stage.label}</span>
                  <span className="mr-auto text-[10px] text-black/40 dark:text-white/40 bg-black/[0.05] dark:bg-white/[0.05] px-1.5 py-0.5 rounded-full">
                    {cols.length}
                  </span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {cols.map((project: any) => (
                      <ProjectCard
                        key={project._id}
                        project={project}
                        onMove={(id, status) => moveMutation.mutate({ id, status })}
                      />
                    ))}
                  </AnimatePresence>
                  {cols.length === 0 && (
                    <div className="text-center py-8 text-[11px] text-black/25 dark:text-white/25">
                      لا توجد مشاريع
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
