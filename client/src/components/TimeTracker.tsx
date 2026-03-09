import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Timer, Play, Square, Trash2, Clock, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Props { projectId: string; tasks: any[]; currentUser: any; }

export default function TimeTracker({ projectId, tasks, currentUser }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [running, setRunning] = useState<{ taskId: string; startedAt: Date; desc: string } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [desc, setDesc] = useState("");
  const [selectedTask, setSelectedTask] = useState(tasks[0]?._id || "");
  const [intervalId, setIntervalId] = useState<any>(null);

  const { data: logs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/projects", projectId, "timelogs"],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}/timelogs`, { credentials: "include" });
      return r.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: (payload: any) => apiRequest("POST", `/api/projects/${projectId}/timelogs`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/projects", projectId, "timelogs"] }),
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (logId: string) => apiRequest("DELETE", `/api/projects/${projectId}/timelogs/${logId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/projects", projectId, "timelogs"] }),
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const startTimer = () => {
    if (!selectedTask) return;
    const startedAt = new Date();
    setRunning({ taskId: selectedTask, startedAt, desc });
    setElapsed(0);
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    setIntervalId(id);
  };

  const stopTimer = () => {
    if (!running) return;
    clearInterval(intervalId);
    const endedAt = new Date();
    addMutation.mutate({ taskId: running.taskId, description: running.desc, startedAt: running.startedAt.toISOString(), endedAt: endedAt.toISOString() });
    setRunning(null);
    setElapsed(0);
    setDesc("");
  };

  const fmt = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const totalMinutes = logs.reduce((a: number, l: any) => a + (l.durationMinutes || 0), 0);

  return (
    <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 overflow-hidden" dir="rtl">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-black/[0.05] dark:border-white/[0.05]">
        <Timer className="w-4 h-4 text-black/40 dark:text-white/40" />
        <span className="text-sm font-bold text-black dark:text-white">تتبع الوقت</span>
        <div className="mr-auto flex items-center gap-1 text-xs text-black/40 dark:text-white/40">
          <Clock className="w-3.5 h-3.5" />
          <span>{Math.floor(totalMinutes / 60)}س {totalMinutes % 60}د</span>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="px-4 py-3 border-b border-black/[0.05] dark:border-white/[0.05] space-y-2">
        {running ? (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-2xl font-black font-mono text-black dark:text-white">{fmt(elapsed)}</div>
              <p className="text-xs text-black/40 dark:text-white/40 truncate">{running.desc || "جارٍ التتبع..."}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <Button variant="destructive" size="sm" onClick={stopTimer} data-testid="button-stop-timer">
              <Square className="w-3.5 h-3.5 ml-1" />
              إيقاف
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.length > 0 && (
              <select
                value={selectedTask}
                onChange={e => setSelectedTask(e.target.value)}
                className="w-full text-sm rounded-lg border border-black/[0.07] dark:border-white/[0.07] bg-black/[0.02] dark:bg-white/[0.02] text-black dark:text-white px-3 py-2"
                data-testid="select-task-timer"
              >
                {tasks.map((t: any) => <option key={t._id} value={t._id}>{t.title}</option>)}
              </select>
            )}
            <div className="flex gap-2">
              <Input
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="وصف المهمة (اختياري)"
                className="flex-1 text-sm"
                data-testid="input-timer-desc"
              />
              <Button size="sm" onClick={startTimer} disabled={!selectedTask} data-testid="button-start-timer">
                <Play className="w-3.5 h-3.5 ml-1" />
                ابدأ
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Logs list */}
      <div className="max-h-60 overflow-y-auto divide-y divide-black/[0.03] dark:divide-white/[0.03]">
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-black/20 dark:text-white/20" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-6 text-xs text-black/30 dark:text-white/30">لا توجد سجلات</div>
        ) : (
          logs.map((log: any) => (
            <div key={log._id} className="flex items-center gap-3 px-4 py-2.5 group" data-testid={`timelog-${log._id}`}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-black/70 dark:text-white/65 truncate">{log.taskId?.title || "—"}</p>
                {log.description && <p className="text-[10px] text-black/35 dark:text-white/35 truncate">{log.description}</p>}
                <p className="text-[10px] text-black/25 dark:text-white/25">{log.userId?.fullName || log.userId?.username} · {new Date(log.createdAt).toLocaleDateString("ar-SA")}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-black/60 dark:text-white/55">
                  {Math.floor((log.durationMinutes || 0) / 60)}س {(log.durationMinutes || 0) % 60}د
                </span>
              </div>
              <button
                onClick={() => deleteMutation.mutate(log._id)}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                data-testid={`button-delete-timelog-${log._id}`}
              >
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
