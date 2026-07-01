import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useInboxSocket } from "@/hooks/useInboxSocket";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckSquare, Square, Plus, Trash2, Edit3, FolderOpen, Loader2, Calendar,
  ListChecks, ChevronDown, ChevronUp, UserCheck, Send, User, Share2,
  Clock, Tag, Link2, Paperclip, X, FolderPlus, Image as ImageIcon,
  CheckCircle2, Circle, MoreVertical, Users, Eye, AlertCircle,
  Globe, Zap, Star, Layers, BarChart2, MessageSquare
} from "lucide-react";

const PRIORITY_CONFIG = {
  low:    { label: "منخفضة", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", dot: "bg-gray-400" },
  medium: { label: "متوسطة", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", dot: "bg-blue-500" },
  high:   { label: "عالية",  color: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", dot: "bg-orange-500" },
  urgent: { label: "عاجلة",  color: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300", dot: "bg-red-500" },
};

const CATEGORIES = ["عام", "تصميم", "تطوير", "اختبار", "نشر", "عميل", "إدارة", "بحث", "محتوى"];

type ChecklistItem = {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  done: boolean;
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  dueDate?: string;
  createdAt: string;
  userId: string | { _id: string; fullName: string; username: string };
  assignedTo?: { _id: string; fullName: string; username: string } | null;
  assignedBy?: { _id: string; fullName: string; username: string } | null;
  assignNote?: string;
  personalGroup?: string;
  tags?: string[];
  estimatedHours?: number;
  attachments?: string[];
  sharedWith?: { _id: string; fullName: string; username: string }[];
  subTasks?: { title: string; done: boolean; _id?: string }[];
  link?: string;
};

type Employee = { id: string; _id?: string; fullName: string; username: string; role: string };
type Tab = "mine" | "projects" | "assigned-to-me" | "assigned-by-me" | "shared";

const EMPTY_FORM = {
  title: "", description: "", priority: "medium", category: "عام",
  dueDate: "", assignedTo: "", assignNote: "", personalGroup: "",
  tags: "", estimatedHours: "", link: "", coAssignees: [] as string[]
};

function getItemId(item: ChecklistItem) { return item.id || (item._id as string); }
function getUserId(item: ChecklistItem) { return typeof item.userId === "object" ? (item.userId as any)?._id : item.userId; }
function getAssignedToId(item: ChecklistItem) {
  return typeof item.assignedTo === "object" && item.assignedTo ? item.assignedTo._id : null;
}

function isPastDue(dueDate?: string) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function formatDate(d?: string) {
  if (!d) return null;
  const date = new Date(d);
  return date.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
}

/* ── Sub-task mini editor ── */
function SubTaskEditor({ subTasks, onChange }: { subTasks: { title: string; done: boolean }[]; onChange: (v: { title: string; done: boolean }[]) => void }) {
  const [newSub, setNewSub] = useState("");
  const addSub = () => {
    if (!newSub.trim()) return;
    onChange([...subTasks, { title: newSub.trim(), done: false }]);
    setNewSub("");
  };
  return (
    <div className="space-y-2">
      {subTasks.map((sub, i) => (
        <div key={i} className="flex items-center gap-2">
          <button onClick={() => onChange(subTasks.map((s, j) => j === i ? { ...s, done: !s.done } : s))} className="flex-shrink-0">
            {sub.done ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-black/30 dark:text-white/30" />}
          </button>
          <span className={`text-xs flex-1 ${sub.done ? "line-through text-black/30 dark:text-white/30" : "text-black dark:text-white"}`}>{sub.title}</span>
          <button onClick={() => onChange(subTasks.filter((_, j) => j !== i))} className="text-black/20 hover:text-red-500 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input value={newSub} onChange={e => setNewSub(e.target.value)} placeholder="مهمة فرعية جديدة…" className="h-7 text-xs border-black/[0.1] dark:border-white/[0.1]"
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSub())} />
        <Button type="button" onClick={addSub} size="sm" variant="outline" className="h-7 px-2 text-xs">+</Button>
      </div>
    </div>
  );
}

/* ── Image Attachment Upload ── */
function AttachmentUpload({ taskId, onDone }: { taskId: string; onDone: () => void }) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      const url = data.url || data.path;
      if (!url) throw new Error("no url");
      await apiRequest("POST", `/api/checklist/${taskId}/attachment`, { url });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist/assigned-by-me"] });
      toast({ title: "✅ تم رفع الصورة" });
      onDone();
    } catch {
      toast({ title: "فشل رفع الصورة", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input ref={ref} type="file" accept="image/*,.pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
      <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
        disabled={uploading} onClick={() => ref.current?.click()}>
        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Paperclip className="w-3 h-3" />}
        {uploading ? "جاري…" : "مرفق"}
      </Button>
    </>
  );
}

/* ── Share Task Dialog ── */
function ShareDialog({ item, employees, uid, onClose }: { item: ChecklistItem; employees: Employee[]; uid: string; onClose: () => void }) {
  const { toast } = useToast();
  const itemId = getItemId(item);

  const shareMutation = useMutation({
    mutationFn: ({ targetUserId, action }: { targetUserId: string; action: "add" | "remove" }) =>
      apiRequest("POST", `/api/checklist/${itemId}/share`, { targetUserId, action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist/assigned-by-me"] });
    },
    onError: () => toast({ title: "فشل تحديث المشاركة", variant: "destructive" }),
  });

  const sharedIds = (item.sharedWith || []).map(u => u._id);
  const available = employees.filter(e => (e.id || e._id) !== uid && (e.id || e._id) !== getUserId(item));

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-black/50 dark:text-white/50 mb-2">مشاركة مع الفريق</p>
        <div className="max-h-52 overflow-y-auto space-y-2">
          {available.map(emp => {
            const eid = emp.id || emp._id || "";
            const isShared = sharedIds.includes(eid);
            return (
              <div key={eid} className="flex items-center justify-between p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-black/[0.08] dark:bg-white/[0.1] flex items-center justify-center text-xs font-bold text-black dark:text-white">
                    {(emp.fullName || emp.username)[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-black dark:text-white">{emp.fullName || emp.username}</p>
                    <p className="text-[10px] text-black/30 dark:text-white/30">@{emp.username}</p>
                  </div>
                </div>
                <Button size="sm" variant={isShared ? "destructive" : "outline"}
                  className={`h-7 px-3 text-xs ${!isShared ? "border-black/[0.1] dark:border-white/[0.1]" : ""}`}
                  disabled={shareMutation.isPending}
                  onClick={() => shareMutation.mutate({ targetUserId: eid, action: isShared ? "remove" : "add" })}>
                  {isShared ? "إلغاء" : "مشاركة"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
      {item.sharedWith && item.sharedWith.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-black/50 dark:text-white/50 mb-1">تمت مشاركتها مع:</p>
          <div className="flex flex-wrap gap-1">
            {item.sharedWith.map(u => (
              <span key={u._id} className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">{u.fullName || u.username}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Rich Task Card ── */
function TaskCard({
  item, uid, onToggle, onEdit, onDelete, onShare, employees,
  highlight = false
}: {
  item: ChecklistItem; uid: string; employees: Employee[];
  onToggle: () => void; onEdit: () => void; onDelete: () => void; onShare: () => void;
  highlight?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAttachImg, setShowAttachImg] = useState<string | null>(null);
  const itemId = getItemId(item);
  const past = isPastDue(item.dueDate) && !item.done;
  const subDone = (item.subTasks || []).filter(s => s.done).length;
  const subTotal = (item.subTasks || []).length;
  const p = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;

  const toggleSubMutation = useMutation({
    mutationFn: (newSubTasks: { title: string; done: boolean }[]) =>
      apiRequest("PATCH", `/api/checklist/${itemId}`, { subTasks: newSubTasks }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/checklist"] }),
    onError: () => toast({ title: "فشل تحديث المهمة الفرعية", variant: "destructive" }),
  });

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white dark:bg-gray-900 border rounded-2xl overflow-hidden transition-all ${
          highlight ? "border-blue-300 dark:border-blue-700 shadow-md" :
          item.done ? "border-black/[0.04] dark:border-white/[0.04] opacity-60" :
          "border-black/[0.06] dark:border-white/[0.06] hover:border-black/[0.12] dark:hover:border-white/[0.12] hover:shadow-sm"
        }`}
      >
        <div className="p-3.5">
          <div className="flex items-start gap-3">
            <button onClick={onToggle} className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110">
              {item.done
                ? <CheckSquare className="w-5 h-5 text-green-500" />
                : <Square className="w-5 h-5 text-black/25 dark:text-white/25" />}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm font-semibold leading-snug ${item.done ? "line-through text-black/30 dark:text-white/30" : "text-black dark:text-white"}`}>
                  {item.title}
                </p>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={onShare} className="p-1 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors">
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={onEdit} className="p-1 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={onDelete} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-black/20 dark:text-white/20 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${p.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                  {p.label}
                </span>

                {item.category && item.category !== "عام" && (
                  <span className="text-[10px] text-black/40 dark:text-white/40 bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded-md">{item.category}</span>
                )}

                {item.dueDate && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1 ${past ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" : "text-black/40 dark:text-white/40 bg-black/[0.04] dark:bg-white/[0.06]"}`}>
                    <Calendar className="w-2.5 h-2.5" />
                    {formatDate(item.dueDate)}
                    {past && " ⚠️"}
                  </span>
                )}

                {item.estimatedHours ? (
                  <span className="text-[10px] text-black/40 dark:text-white/40 bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {item.estimatedHours}س
                  </span>
                ) : null}

                {subTotal > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1 ${subDone === subTotal ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" : "text-black/40 dark:text-white/40 bg-black/[0.04] dark:bg-white/[0.06]"}`}>
                    <ListChecks className="w-2.5 h-2.5" />
                    {subDone}/{subTotal}
                  </span>
                )}

                {(item.attachments?.length ?? 0) > 0 && (
                  <span className="text-[10px] text-black/40 dark:text-white/40 bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    <Paperclip className="w-2.5 h-2.5" />
                    {item.attachments!.length}
                  </span>
                )}

                {(item.sharedWith?.length ?? 0) > 0 && (
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    <Users className="w-2.5 h-2.5" />
                    مشتركة
                  </span>
                )}

                {item.assignedTo && (
                  <span className="text-[10px] text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    <UserCheck className="w-2.5 h-2.5" />
                    {(item.assignedTo as any).fullName || (item.assignedTo as any).username}
                  </span>
                )}
              </div>

              {/* Tags */}
              {(item.tags?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {item.tags!.map((t, i) => (
                    <span key={i} className="text-[10px] bg-black/[0.03] dark:bg-white/[0.04] text-black/50 dark:text-white/50 px-1.5 py-0.5 rounded-full border border-black/[0.06] dark:border-white/[0.06]">#{t}</span>
                  ))}
                </div>
              )}

              {/* Description */}
              {item.description && (
                <p className="text-[11px] text-black/40 dark:text-white/40 mt-1.5 leading-relaxed line-clamp-2">{item.description}</p>
              )}

              {/* Link */}
              {item.link && (
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-1">
                  <Link2 className="w-2.5 h-2.5" />{item.link.replace(/^https?:\/\//, "").slice(0, 40)}…
                </a>
              )}
            </div>
          </div>

          {/* Sub-tasks progress bar */}
          {subTotal > 0 && (
            <div className="mt-2 mx-7">
              <div className="w-full h-1 bg-black/[0.05] dark:bg-white/[0.07] rounded-full overflow-hidden">
                <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${(subDone / subTotal) * 100}%` }} />
              </div>
            </div>
          )}

          {/* Expand for sub-tasks + attachments */}
          {(subTotal > 0 || (item.attachments?.length ?? 0) > 0) && (
            <button onClick={() => setExpanded(v => !v)} className="flex items-center gap-1 text-[10px] text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60 transition-colors mt-2 mx-7">
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? "إخفاء" : "عرض التفاصيل"}
            </button>
          )}
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="border-t border-black/[0.04] dark:border-white/[0.04] px-4 pb-3 pt-2 space-y-3">
              {/* Sub-tasks */}
              {subTotal > 0 && (
                <div className="space-y-1.5">
                  {item.subTasks!.map((sub, i) => (
                    <button key={i} className="flex items-center gap-2 w-full text-right"
                      onClick={() => {
                        const updated = item.subTasks!.map((s, j) => j === i ? { ...s, done: !s.done } : s);
                        toggleSubMutation.mutate(updated);
                      }}>
                      {sub.done ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> : <Circle className="w-4 h-4 text-black/20 dark:text-white/20 flex-shrink-0" />}
                      <span className={`text-xs ${sub.done ? "line-through text-black/30 dark:text-white/30" : "text-black/70 dark:text-white/70"}`}>{sub.title}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Attachments */}
              {(item.attachments?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[10px] text-black/30 dark:text-white/30 font-semibold mb-1.5">المرفقات</p>
                  <div className="flex flex-wrap gap-2">
                    {item.attachments!.map((url, i) => (
                      <button key={i} onClick={() => setShowAttachImg(url)} className="w-16 h-16 rounded-xl overflow-hidden border border-black/[0.08] dark:border-white/[0.08] hover:opacity-80 transition-opacity">
                        {url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                          ? <img src={url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center bg-black/[0.04] dark:bg-white/[0.06]"><Paperclip className="w-5 h-5 text-black/30 dark:text-white/30" /></div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Image lightbox */}
      {showAttachImg && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowAttachImg(null)}>
          <img src={showAttachImg} alt="" className="max-w-full max-h-full rounded-2xl shadow-2xl" />
        </div>
      )}
    </>
  );
}

/* ── Personal Project Card ── */
function PersonalProjectCard({
  groupName, tasks, uid, employees, onAddTask, onToggle, onEdit, onDelete, onShare
}: {
  groupName: string; tasks: ChecklistItem[]; uid: string; employees: Employee[];
  onAddTask: (group: string) => void;
  onToggle: (item: ChecklistItem) => void;
  onEdit: (item: ChecklistItem) => void;
  onDelete: (id: string) => void;
  onShare: (item: ChecklistItem) => void;
}) {
  const [open, setOpen] = useState(true);
  const done = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <FolderOpen className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-right">
          <p className="text-sm font-bold text-black dark:text-white">{groupName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex-1 h-1 bg-black/[0.06] dark:bg-white/[0.08] rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] text-black/40 dark:text-white/40 font-mono">{done}/{total}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-full">{pct}%</span>
          {open ? <ChevronUp className="w-4 h-4 text-black/30 dark:text-white/30" /> : <ChevronDown className="w-4 h-4 text-black/30 dark:text-white/30" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="border-t border-black/[0.04] dark:border-white/[0.04] divide-y divide-black/[0.03] dark:divide-white/[0.03]">
            {tasks.length === 0 && (
              <div className="p-4 text-center text-xs text-black/30 dark:text-white/30">لا توجد مهام بعد</div>
            )}
            <div className="p-3 space-y-2">
              {tasks.map(item => (
                <TaskCard key={getItemId(item)} item={item} uid={uid} employees={employees}
                  onToggle={() => onToggle(item)} onEdit={() => onEdit(item)}
                  onDelete={() => onDelete(getItemId(item)!)} onShare={() => onShare(item)} />
              ))}
            </div>
            <button onClick={() => onAddTask(groupName)}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
              <Plus className="w-3.5 h-3.5" /> أضف مهمة لهذا المشروع
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Add / Edit Dialog ── */
function TaskDialog({
  open, onClose, onSubmit, initial, employees, defaultGroup = "", loading
}: {
  open: boolean; onClose: () => void; loading: boolean; defaultGroup?: string;
  onSubmit: (data: any) => void;
  initial?: Partial<typeof EMPTY_FORM & { subTasks: { title: string; done: boolean }[] }>;
  employees: Employee[];
}) {
  // Extract existing coAssignees from initial sharedWith
  const initCoAssignees = (initial as any)?.sharedWith
    ? ((initial as any).sharedWith as any[]).map((u: any) => typeof u === "object" ? (u._id || u.id) : u).filter(Boolean)
    : [];
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ...initial,
    personalGroup: initial?.personalGroup || defaultGroup,
    coAssignees: initCoAssignees,
  });
  const [subTasks, setSubTasks] = useState<{ title: string; done: boolean }[]>(initial?.subTasks || []);
  const [newGroup, setNewGroup] = useState(false);

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const toggleCoAssignee = (empId: string) => {
    setForm(p => {
      const already = p.coAssignees.includes(empId);
      return { ...p, coAssignees: already ? p.coAssignees.filter(id => id !== empId) : [...p.coAssignees, empId] };
    });
  };

  const submit = () => {
    if (!form.title.trim()) return;
    const tags = form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
    // Determine primary assignee and co-assignees
    const coAssignees = form.coAssignees.filter(id => id !== form.assignedTo);
    onSubmit({ ...form, subTasks, tags, estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : 0, coAssignees });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right text-base font-bold">
            {initial?.title ? "تعديل المهمة" : "مهمة جديدة"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pb-2">
          <Input value={form.title} onChange={e => f("title", e.target.value)} placeholder="عنوان المهمة *" className="h-10 text-sm border-black/[0.12] dark:border-white/[0.12]" autoFocus />
          <Textarea value={form.description} onChange={e => f("description", e.target.value)} placeholder="وصف تفصيلي…" className="text-sm border-black/[0.12] dark:border-white/[0.12] resize-none" rows={2} />

          <div className="grid grid-cols-2 gap-2">
            <Select value={form.priority} onValueChange={v => f("priority", v)}>
              <SelectTrigger className="h-9 text-sm border-black/[0.1] dark:border-white/[0.1]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">منخفضة</SelectItem>
                <SelectItem value="medium">متوسطة</SelectItem>
                <SelectItem value="high">عالية</SelectItem>
                <SelectItem value="urgent">عاجلة 🚨</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.category} onValueChange={v => f("category", v)}>
              <SelectTrigger className="h-9 text-sm border-black/[0.1] dark:border-white/[0.1]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-black/40 dark:text-white/40 font-semibold block mb-1">تاريخ الاستحقاق</label>
              <Input type="date" value={form.dueDate} onChange={e => f("dueDate", e.target.value)} className="h-9 text-sm border-black/[0.1]" />
            </div>
            <div>
              <label className="text-[10px] text-black/40 dark:text-white/40 font-semibold block mb-1">الساعات المقدرة</label>
              <Input type="number" value={form.estimatedHours} onChange={e => f("estimatedHours", e.target.value)} placeholder="0" className="h-9 text-sm border-black/[0.1]" min="0" />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-[10px] text-black/40 dark:text-white/40 font-semibold block mb-1">التسميات (مفصولة بفاصلة)</label>
            <Input value={form.tags} onChange={e => f("tags", e.target.value)} placeholder="مثال: تصميم, واجهة, عميل" className="h-9 text-sm border-black/[0.1]" />
          </div>

          {/* Link */}
          <div>
            <label className="text-[10px] text-black/40 dark:text-white/40 font-semibold block mb-1">رابط خارجي</label>
            <Input value={form.link} onChange={e => f("link", e.target.value)} placeholder="https://…" type="url" className="h-9 text-sm border-black/[0.1]" />
          </div>

          {/* Personal group */}
          <div>
            <label className="text-[10px] text-black/40 dark:text-white/40 font-semibold block mb-1">المشروع الشخصي</label>
            {newGroup ? (
              <div className="flex gap-2">
                <Input value={form.personalGroup} onChange={e => f("personalGroup", e.target.value)} placeholder="اسم المشروع الجديد" className="h-9 text-sm border-black/[0.1] flex-1" />
                <Button type="button" size="sm" variant="ghost" className="h-9 px-2" onClick={() => setNewGroup(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input value={form.personalGroup} onChange={e => f("personalGroup", e.target.value)} placeholder="بدون تصنيف" className="h-9 text-sm border-black/[0.1] flex-1" />
                <Button type="button" size="sm" variant="outline" className="h-9 px-2 text-xs border-black/[0.1]" onClick={() => setNewGroup(true)}>
                  <FolderPlus className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Sub-tasks */}
          <div>
            <label className="text-[10px] text-black/40 dark:text-white/40 font-semibold block mb-1.5">المهام الفرعية</label>
            <SubTaskEditor subTasks={subTasks} onChange={setSubTasks} />
          </div>

          {/* Assign to employees — primary + co-assignees */}
          {employees.length > 0 && (
            <div>
              <label className="text-[10px] text-black/40 dark:text-white/40 font-semibold block mb-1">تكليف موظفين (يمكن اختيار أكثر من واحد)</label>
              <div className="border border-black/[0.1] dark:border-white/[0.1] rounded-xl max-h-36 overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                {employees.map(e => {
                  const eid = (e.id || e._id) as string;
                  const isPrimary = form.assignedTo === eid;
                  const isCoAssignee = form.coAssignees.includes(eid);
                  const isSelected = isPrimary || isCoAssignee;
                  return (
                    <button key={eid} type="button"
                      onClick={() => {
                        if (isPrimary) {
                          // Deselect primary → promote first co-assignee or clear
                          const firstCo = form.coAssignees[0];
                          setForm(p => ({
                            ...p,
                            assignedTo: firstCo || "",
                            coAssignees: firstCo ? p.coAssignees.slice(1) : p.coAssignees,
                          }));
                        } else if (isCoAssignee) {
                          setForm(p => ({ ...p, coAssignees: p.coAssignees.filter(id => id !== eid) }));
                        } else if (!form.assignedTo) {
                          // No primary → make this primary
                          setForm(p => ({ ...p, assignedTo: eid }));
                        } else {
                          // Already have primary → add as co-assignee
                          toggleCoAssignee(eid);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-right transition-colors ${isSelected ? "bg-black/[0.04] dark:bg-white/[0.05]" : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"}`}>
                      <span className={isSelected ? "font-semibold text-black dark:text-white" : "text-black/60 dark:text-white/60"}>{e.fullName || e.username}</span>
                      {isPrimary && <span className="text-[10px] bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full font-bold">مسؤول</span>}
                      {isCoAssignee && <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">مشارك</span>}
                    </button>
                  );
                })}
              </div>
              {form.assignedTo || form.coAssignees.length > 0 ? (
                <button type="button" onClick={() => setForm(p => ({ ...p, assignedTo: "", coAssignees: [] }))}
                  className="mt-1 text-[10px] text-red-400 hover:text-red-600 transition-colors">
                  إلغاء التكليف
                </button>
              ) : null}
            </div>
          )}

          {(form.assignedTo && form.assignedTo !== "__none__") || form.coAssignees.length > 0 ? (
            <Textarea value={form.assignNote} onChange={e => f("assignNote", e.target.value)} placeholder="ملاحظة التكليف…" className="text-sm border-black/[0.1] resize-none" rows={2} />
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} className="h-9 text-sm px-4">إلغاء</Button>
            <Button onClick={submit} disabled={loading || !form.title.trim()} className="h-9 text-sm px-5 bg-black text-white dark:bg-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-1" />}
              {initial?.title ? "حفظ التعديل" : "إضافة"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function DevChecklist() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("mine");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<ChecklistItem | null>(null);
  const [shareItem, setShareItem] = useState<ChecklistItem | null>(null);
  const [defaultGroup, setDefaultGroup] = useState("");
  const [newlyDone, setNewlyDone] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const uid = (user as any)?._id || (user as any)?.id || "";

  // Real-time task completion alerts
  useInboxSocket({
    userId: uid,
    onEvent: (evt: any) => {
      if (evt.type === "task_completed") {
        queryClient.invalidateQueries({ queryKey: ["/api/checklist"] });
        queryClient.invalidateQueries({ queryKey: ["/api/checklist/assigned-by-me"] });
        setNewlyDone(prev => new Set([...prev, evt.taskId]));
        toast({ title: `✅ أنجز ${evt.completedBy} المهمة`, description: evt.taskTitle });
      }
      if (evt.type === "task_shared") {
        queryClient.invalidateQueries({ queryKey: ["/api/checklist/shared-with-me"] });
        toast({ title: `🔗 شارك معك ${evt.sharedBy} مهمة`, description: evt.taskTitle });
      }
    },
  });

  // Queries
  const { data: allItems = [], isLoading } = useQuery<ChecklistItem[]>({ queryKey: ["/api/checklist"], refetchInterval: 30000 });
  const { data: assignedByMe = [], isLoading: loadingByMe } = useQuery<ChecklistItem[]>({ queryKey: ["/api/checklist/assigned-by-me"], refetchInterval: 30000 });
  const { data: sharedWithMe = [], isLoading: loadingShared } = useQuery<ChecklistItem[]>({ queryKey: ["/api/checklist/shared-with-me"], refetchInterval: 60000 });
  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: myProjects = [] } = useQuery<string[]>({ queryKey: ["/api/checklist/my-projects"], refetchInterval: 60000 });

  // My tasks = tasks I own (not assigned to others or assigned-to-me)
  const myItems = allItems.filter(i => {
    const isOwner = getUserId(i) === uid;
    const isAssignedToMe = getAssignedToId(i) === uid;
    return isOwner && !isAssignedToMe;
  });

  const myPersonalTasks = myItems.filter(i => !i.personalGroup);

  // Group tasks by personalGroup for "projects" tab
  const projectGroups: Record<string, ChecklistItem[]> = {};
  myItems.filter(i => i.personalGroup).forEach(item => {
    const g = item.personalGroup!;
    if (!projectGroups[g]) projectGroups[g] = [];
    projectGroups[g].push(item);
  });

  const assignedToMeItems = allItems.filter(i => {
    if (getAssignedToId(i) === uid) return true;
    const sw = (i.sharedWith || []) as any[];
    return sw.some(u => (typeof u === "object" ? (u._id || u.id) : u) === uid);
  });

  // Search filter
  const applySearch = (items: ChecklistItem[]) =>
    search.trim() ? items.filter(i =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.description?.toLowerCase().includes(search.toLowerCase()) ||
      i.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
    ) : items;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/checklist", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist/assigned-by-me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist/my-projects"] });
      setShowAdd(false);
      setDefaultGroup("");
      toast({ title: "✅ تمت إضافة المهمة" });
    },
    onError: () => toast({ title: "فشل إضافة المهمة", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/checklist/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist/assigned-by-me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist/my-projects"] });
      setEditItem(null);
      toast({ title: "✅ تم التحديث" });
    },
    onError: () => toast({ title: "فشل التحديث", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/checklist/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist/assigned-by-me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist/my-projects"] });
    },
    onError: () => toast({ title: "فشل الحذف", variant: "destructive" }),
  });

  const toggleDone = (item: ChecklistItem) => {
    updateMutation.mutate({ id: getItemId(item)!, data: { done: !item.done } });
  };

  const handleSubmit = (data: any) => {
    if (editItem) {
      updateMutation.mutate({ id: getItemId(editItem)!, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (item: ChecklistItem) => {
    setEditItem(item);
    setShowAdd(false);
  };

  const openAddForGroup = (group: string) => {
    setDefaultGroup(group);
    setEditItem(null);
    setShowAdd(true);
  };

  // Stats
  const totalDone = myItems.filter(i => i.done).length;
  const totalUrgent = myItems.filter(i => i.priority === "urgent" && !i.done).length;
  const totalOverdue = myItems.filter(i => isPastDue(i.dueDate) && !i.done).length;

  const TABS = [
    { id: "mine" as Tab, label: "مهامي", count: myPersonalTasks.length, icon: ListChecks },
    { id: "projects" as Tab, label: "مشاريعي", count: Object.keys(projectGroups).length, icon: FolderOpen },
    { id: "assigned-to-me" as Tab, label: "مُسندة لي", count: assignedToMeItems.filter(i => !i.done).length, icon: UserCheck },
    { id: "assigned-by-me" as Tab, label: "سندتها", count: assignedByMe.length, icon: Send },
    { id: "shared" as Tab, label: "مشاركة معي", count: sharedWithMe.length, icon: Share2 },
  ];

  const loading = isLoading;

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-gray-950" dir="rtl">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-black/[0.06] dark:border-white/[0.08] px-4 md:px-6 py-4 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-black text-black dark:text-white font-heading">مهامي ومشاريعي</h1>
            <p className="text-[10px] text-black/30 dark:text-white/30">قائمة مهامك الشخصية ومشاريعك الخاصة</p>
          </div>
          <Button onClick={() => { setDefaultGroup(""); setEditItem(null); setShowAdd(true); }}
            className="h-9 px-4 bg-black text-white dark:bg-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80 rounded-xl text-sm font-semibold gap-1.5">
            <Plus className="w-4 h-4" /> مهمة جديدة
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "تم إنجازه", value: `${totalDone}/${myItems.length}`, icon: CheckSquare, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20" },
            { label: "عاجلة", value: totalUrgent, icon: AlertCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" },
            { label: "متأخرة", value: totalOverdue, icon: Clock, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] p-3 flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-lg font-black text-black dark:text-white leading-none">{s.value}</p>
                  <p className="text-[10px] text-black/40 dark:text-white/40">{s.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 بحث في المهام…"
            className="h-9 text-sm border-black/[0.1] dark:border-white/[0.1] pr-4 bg-white dark:bg-gray-900" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                tab === t.id
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-white dark:bg-gray-900 text-black/50 dark:text-white/50 border border-black/[0.06] dark:border-white/[0.06] hover:border-black/[0.12] dark:hover:border-white/[0.12]"
              }`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.id ? "bg-white/20 text-white dark:bg-black/20 dark:text-black" : "bg-black/[0.06] dark:bg-white/[0.06] text-black/60 dark:text-white/60"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {(loading || loadingByMe || loadingShared) && tab !== "projects" && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" />
          </div>
        )}

        {/* ── Tab: مهامي ── */}
        {tab === "mine" && !loading && (
          <AnimatePresence mode="wait">
            <motion.div key="mine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {applySearch(myPersonalTasks).length === 0 && (
                <div className="text-center py-14">
                  <div className="w-14 h-14 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <ListChecks className="w-7 h-7 text-black/20 dark:text-white/20" />
                  </div>
                  <p className="text-sm font-semibold text-black/40 dark:text-white/40">لا توجد مهام شخصية</p>
                  <p className="text-xs text-black/25 dark:text-white/25 mt-1">أضف مهمتك الأولى!</p>
                  <Button onClick={() => { setDefaultGroup(""); setEditItem(null); setShowAdd(true); }} variant="outline"
                    className="mt-4 h-8 px-4 text-xs border-black/[0.1] dark:border-white/[0.1]">
                    <Plus className="w-3.5 h-3.5 ml-1" /> إضافة مهمة
                  </Button>
                </div>
              )}
              {applySearch(myPersonalTasks).map(item => (
                <TaskCard key={getItemId(item)} item={item} uid={uid} employees={employees}
                  highlight={newlyDone.has(getItemId(item)!)}
                  onToggle={() => toggleDone(item)} onEdit={() => openEditDialog(item)}
                  onDelete={(id) => deleteMutation.mutate(id)} onShare={() => setShareItem(item)} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── Tab: مشاريعي ── */}
        {tab === "projects" && (
          <AnimatePresence mode="wait">
            <motion.div key="projects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {/* New project button */}
              <button onClick={() => { setDefaultGroup(""); setEditItem(null); setShowAdd(true); }}
                className="w-full flex items-center gap-2 p-3 rounded-2xl border-2 border-dashed border-black/[0.1] dark:border-white/[0.1] text-black/40 dark:text-white/40 hover:border-black/[0.2] dark:hover:border-white/[0.2] hover:text-black dark:hover:text-white transition-colors">
                <FolderPlus className="w-4 h-4" />
                <span className="text-sm">مشروع شخصي جديد</span>
              </button>

              {Object.keys(projectGroups).length === 0 && (
                <div className="text-center py-12">
                  <div className="w-14 h-14 bg-violet-50 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <FolderOpen className="w-7 h-7 text-violet-500" />
                  </div>
                  <p className="text-sm font-semibold text-black/40 dark:text-white/40">لا توجد مشاريع خاصة بعد</p>
                  <p className="text-xs text-black/25 dark:text-white/25 mt-1">أضف مهمة واربطها بمشروع جديد</p>
                </div>
              )}

              {Object.entries(projectGroups).map(([groupName, tasks]) => (
                <PersonalProjectCard key={groupName} groupName={groupName} tasks={tasks}
                  uid={uid} employees={employees}
                  onAddTask={openAddForGroup}
                  onToggle={toggleDone} onEdit={openEditDialog}
                  onDelete={(id) => deleteMutation.mutate(id)} onShare={(item) => setShareItem(item)} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── Tab: مُسندة لي ── */}
        {tab === "assigned-to-me" && !loading && (
          <AnimatePresence mode="wait">
            <motion.div key="assigned" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {applySearch(assignedToMeItems).length === 0 && (
                <div className="text-center py-14">
                  <div className="w-14 h-14 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <UserCheck className="w-7 h-7 text-black/20 dark:text-white/20" />
                  </div>
                  <p className="text-sm font-semibold text-black/40 dark:text-white/40">لا توجد مهام مسندة إليك</p>
                </div>
              )}
              {applySearch(assignedToMeItems).map(item => (
                <div key={getItemId(item)}>
                  {item.assignedBy && (
                    <p className="text-[10px] text-black/35 dark:text-white/35 mb-1 pr-1">
                      من: {typeof item.assignedBy === "object" ? (item.assignedBy as any).fullName || (item.assignedBy as any).username : item.assignedBy}
                    </p>
                  )}
                  <TaskCard item={item} uid={uid} employees={employees}
                    highlight={newlyDone.has(getItemId(item)!)}
                    onToggle={() => toggleDone(item)} onEdit={() => openEditDialog(item)}
                    onDelete={(id) => deleteMutation.mutate(id)} onShare={() => setShareItem(item)} />
                  {item.assignNote && (
                    <div className="flex items-start gap-1.5 mt-1 mb-2 mr-7">
                      <MessageSquare className="w-3 h-3 text-black/25 dark:text-white/25 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-black/40 dark:text-white/40 italic">{item.assignNote}</p>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── Tab: سندتها ── */}
        {tab === "assigned-by-me" && !loadingByMe && (
          <AnimatePresence mode="wait">
            <motion.div key="byMe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {applySearch(assignedByMe).length === 0 && (
                <div className="text-center py-14">
                  <div className="w-14 h-14 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Send className="w-7 h-7 text-black/20 dark:text-white/20" />
                  </div>
                  <p className="text-sm font-semibold text-black/40 dark:text-white/40">لم تُسند أي مهام بعد</p>
                </div>
              )}
              {applySearch(assignedByMe).map(item => (
                <div key={getItemId(item)}>
                  {item.assignedTo && (
                    <p className="text-[10px] text-black/35 dark:text-white/35 mb-1 pr-1">
                      إلى: {typeof item.assignedTo === "object" ? (item.assignedTo as any).fullName || (item.assignedTo as any).username : item.assignedTo}
                    </p>
                  )}
                  <TaskCard item={item} uid={uid} employees={employees}
                    highlight={newlyDone.has(getItemId(item)!)}
                    onToggle={() => toggleDone(item)} onEdit={() => openEditDialog(item)}
                    onDelete={(id) => deleteMutation.mutate(id)} onShare={() => setShareItem(item)} />
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── Tab: مشاركة معي ── */}
        {tab === "shared" && !loadingShared && (
          <AnimatePresence mode="wait">
            <motion.div key="shared" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {applySearch(sharedWithMe).length === 0 && (
                <div className="text-center py-14">
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Share2 className="w-7 h-7 text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-black/40 dark:text-white/40">لا توجد مهام مشاركة معك</p>
                  <p className="text-xs text-black/25 dark:text-white/25 mt-1">عندما يشارك معك زميل مهمة ستظهر هنا</p>
                </div>
              )}
              {applySearch(sharedWithMe).map(item => (
                <div key={getItemId(item)}>
                  {item.userId && typeof item.userId === "object" && (
                    <p className="text-[10px] text-blue-500 mb-1 pr-1 flex items-center gap-1">
                      <Share2 className="w-2.5 h-2.5" />
                      من: {(item.userId as any).fullName || (item.userId as any).username}
                    </p>
                  )}
                  <TaskCard item={item} uid={uid} employees={employees}
                    onToggle={() => {}} onEdit={() => {}} onDelete={() => {}} onShare={() => {}} />
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ── Add Task Dialog ── */}
      <TaskDialog
        open={showAdd}
        onClose={() => { setShowAdd(false); setDefaultGroup(""); }}
        onSubmit={handleSubmit}
        defaultGroup={defaultGroup}
        employees={employees}
        loading={createMutation.isPending}
      />

      {/* ── Edit Task Dialog ── */}
      {editItem && (
        <TaskDialog
          key={getItemId(editItem) || "edit"}
          open={!!editItem}
          onClose={() => setEditItem(null)}
          onSubmit={handleSubmit}
          initial={{
            title: editItem.title,
            description: editItem.description || "",
            priority: editItem.priority,
            category: editItem.category,
            dueDate: editItem.dueDate ? editItem.dueDate.slice(0, 10) : "",
            assignedTo: typeof editItem.assignedTo === "object" && editItem.assignedTo ? editItem.assignedTo._id : (editItem.assignedTo as string) || "",
            assignNote: editItem.assignNote || "",
            personalGroup: editItem.personalGroup || "",
            tags: (editItem.tags || []).join(", "),
            estimatedHours: editItem.estimatedHours?.toString() || "",
            link: editItem.link || "",
            subTasks: editItem.subTasks || [],
          }}
          employees={employees}
          loading={updateMutation.isPending}
        />
      )}

      {/* ── Share Dialog ── */}
      {shareItem && (
        <Dialog open={!!shareItem} onOpenChange={() => setShareItem(null)}>
          <DialogContent dir="rtl" className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-right text-sm font-bold flex items-center gap-2">
                <Share2 className="w-4 h-4" /> مشاركة المهمة
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-black/50 dark:text-white/50 mb-3 font-medium">{shareItem.title}</p>
            {getUserId(shareItem) === uid ? (
              <ShareDialog item={shareItem} employees={employees} uid={uid} onClose={() => setShareItem(null)} />
            ) : (
              <p className="text-xs text-black/40 dark:text-white/40 text-center py-4">يمكن فقط لصاحب المهمة مشاركتها</p>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Floating add button for attachment (after task add) */}
      {tab === "mine" && !loading && myPersonalTasks.length > 0 && (
        <div className="fixed bottom-6 left-6 flex gap-2 z-20">
          <Button onClick={() => { setDefaultGroup(""); setEditItem(null); setShowAdd(true); }}
            className="h-12 w-12 rounded-2xl bg-black text-white dark:bg-white dark:text-black shadow-xl hover:scale-105 transition-transform p-0">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
