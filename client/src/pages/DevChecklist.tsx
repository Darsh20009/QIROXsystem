import { useState } from "react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-auth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare, Square, Plus, Trash2, Edit3, Bell, BellOff,
  ListChecks, Flag, FolderOpen, Loader2, Calendar,
  Code2, Globe, Smartphone, Database, Zap, Shield, Link2,
  GitBranch, Terminal, FileCode, Layers, ChevronDown, ChevronUp, Barcode,
  UserCheck, Send, User, MessageSquare
} from "lucide-react";

const PRIORITY_CONFIG = {
  low:    { label: "منخفضة", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", dot: "bg-gray-400" },
  medium: { label: "متوسطة", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", dot: "bg-blue-500" },
  high:   { label: "عالية",  color: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", dot: "bg-amber-500" },
  urgent: { label: "عاجلة",  color: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300", dot: "bg-red-500" },
};

const CATEGORIES = ["عام", "تصميم", "تطوير", "اختبار", "نشر", "عميل", "إدارة"];

const DEV_TOOLS = [
  { label: "Vercel", icon: Globe, url: "https://vercel.com", color: "text-black dark:text-white" },
  { label: "GitHub", icon: GitBranch, url: "https://github.com", color: "text-gray-700 dark:text-gray-300" },
  { label: "Figma", icon: Layers, url: "https://figma.com", color: "text-purple-600" },
  { label: "Postman", icon: Zap, url: "https://postman.com", color: "text-orange-500" },
  { label: "MongoDB Atlas", icon: Database, url: "https://cloud.mongodb.com", color: "text-green-600" },
  { label: "Netlify", icon: Shield, url: "https://netlify.com", color: "text-teal-600" },
  { label: "CodePen", icon: Code2, url: "https://codepen.io", color: "text-blue-600" },
  { label: "Can I Use", icon: Smartphone, url: "https://caniuse.com", color: "text-indigo-600" },
  { label: "DevDocs", icon: FileCode, url: "https://devdocs.io", color: "text-red-600" },
  { label: "regex101", icon: Terminal, url: "https://regex101.com", color: "text-yellow-600" },
  { label: "JSON Formatter", icon: Code2, url: "https://jsonformatter.org", color: "text-pink-600" },
  { label: "URL Encoder", icon: Link2, url: "https://www.urlencoder.org", color: "text-cyan-600" },
  { label: "Barcode Studio", icon: Barcode, url: "/barcode-studio", color: "text-violet-600" },
];

type Employee = { id: string; fullName: string; username: string; role: string };

type ChecklistItem = {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  done: boolean;
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  dueDate?: string;
  createdAt: string;
  userId: string | { _id: string };
  assignedTo?: { _id: string; fullName: string; username: string } | null;
  assignedBy?: { _id: string; fullName: string; username: string } | null;
  assignNote?: string;
};

const EMPTY_FORM = { title: "", description: "", priority: "medium", category: "عام", dueDate: "", assignedTo: "", assignNote: "" };

type Tab = "mine" | "assigned-to-me" | "assigned-by-me";

export default function DevChecklist() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const { status: pushStatus, subscribe, unsubscribe } = usePushNotifications();
  const [tab, setTab] = useState<Tab>("mine");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<ChecklistItem | null>(null);
  const [filterCat, setFilterCat] = useState("الكل");
  const [filterPriority, setFilterPriority] = useState("الكل");
  const [showDone, setShowDone] = useState(true);
  const [showTools, setShowTools] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);

  const uid = (user as any)?._id || (user as any)?.id || "";

  const { data: allItems = [], isLoading } = useQuery<ChecklistItem[]>({
    queryKey: ["/api/checklist"],
  });

  const { data: assignedByMe = [], isLoading: loadingByMe } = useQuery<ChecklistItem[]>({
    queryKey: ["/api/checklist/assigned-by-me"],
    enabled: tab === "assigned-by-me",
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const getItemId = (item: ChecklistItem) => item.id || (item._id as string);
  const getAssignedToId = (item: ChecklistItem) =>
    typeof item.assignedTo === "object" && item.assignedTo ? item.assignedTo._id : null;
  const getUserId = (item: ChecklistItem) =>
    typeof item.userId === "object" ? (item.userId as any)?._id : item.userId;

  const myItems = allItems.filter(i => {
    const isOwner = getUserId(i) === uid;
    const isAssignedTo = getAssignedToId(i) === uid;
    return isOwner && !isAssignedTo;
  });

  const assignedToMeItems = allItems.filter(i => getAssignedToId(i) === uid);

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/checklist", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist/assigned-by-me"] });
      setShowAdd(false);
      setForm(EMPTY_FORM);
      toast({ title: form.assignedTo ? "تم إرسال المهمة للموظف" : "تمت الإضافة" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ChecklistItem> }) =>
      apiRequest("PATCH", `/api/checklist/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist/assigned-by-me"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/checklist/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist/assigned-by-me"] });
      toast({ title: "تم الحذف" });
    },
  });

  const handleToggle = (item: ChecklistItem) => {
    updateMutation.mutate({ id: getItemId(item), data: { done: !item.done } });
  };

  const handleSaveEdit = () => {
    if (!editItem) return;
    updateMutation.mutate({ id: getItemId(editItem), data: {
      title: editItem.title,
      description: editItem.description,
      priority: editItem.priority,
      category: editItem.category,
      dueDate: editItem.dueDate,
    }});
    setEditItem(null);
    toast({ title: "تم التحديث" });
  };

  const handlePushToggle = async () => {
    if (pushStatus === "subscribed") {
      await unsubscribe();
      toast({ title: "تم إيقاف الإشعارات" });
    } else {
      const ok = await subscribe();
      if (ok) toast({ title: "تم تفعيل الإشعارات!", description: "ستصلك إشعارات QIROX حتى في الخلفية" });
      else toast({ title: "لم يتم تفعيل الإشعارات", description: "تأكد من السماح بالإشعارات في المتصفح" });
    }
  };

  const getTabItems = (): ChecklistItem[] => {
    if (tab === "mine") return myItems;
    if (tab === "assigned-to-me") return assignedToMeItems;
    return assignedByMe;
  };

  const applyFilters = (list: ChecklistItem[]) => list.filter(item => {
    if (!showDone && item.done) return false;
    if (filterCat !== "الكل" && item.category !== filterCat) return false;
    if (filterPriority !== "الكل" && item.priority !== filterPriority) return false;
    return true;
  });

  const tabItems = applyFilters(getTabItems());
  const pendingCount = myItems.filter(i => !i.done).length;
  const assignedToMePending = assignedToMeItems.filter(i => !i.done).length;

  const otherEmployees = employees.filter(e => e.id !== uid && (e.role === "employee" || e.role === "manager" || e.role === "admin"));

  const TABS = [
    { id: "mine" as Tab, label: "مهامي الشخصية", icon: User, count: pendingCount },
    { id: "assigned-to-me" as Tab, label: "مُسند إليّ", icon: UserCheck, count: assignedToMePending },
    { id: "assigned-by-me" as Tab, label: "أسندتها أنا", icon: Send, count: 0 },
  ];

  return (
    <div className="relative overflow-hidden min-h-screen bg-white dark:bg-gray-950 p-6" dir="rtl">
      <PageGraphics variant="dashboard" />
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-black dark:text-white tracking-tight">أدوات المطور</h1>
            <p className="text-sm text-black/40 dark:text-white/40 mt-1">
              {pendingCount} مهمة معلّقة · {assignedToMePending > 0 && <span className="text-cyan-600 font-medium">{assignedToMePending} مُسندة إليك</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-sm"
              onClick={handlePushToggle}
              disabled={pushStatus === "unsupported" || pushStatus === "denied" || pushStatus === "loading"}
              data-testid="button-push-toggle"
            >
              {pushStatus === "subscribed"
                ? <><BellOff className="w-4 h-4" /> إيقاف الإشعارات</>
                : <><Bell className="w-4 h-4" /> تفعيل الإشعارات</>}
            </Button>
            <Button
              className="gap-2 text-sm bg-black dark:bg-white text-white dark:text-black hover:bg-black/80"
              onClick={() => setShowAdd(true)}
              data-testid="button-add-checklist"
            >
              <Plus className="w-4 h-4" />
              مهمة جديدة
            </Button>
          </div>
        </div>

        {/* Push notification status banner */}
        {pushStatus === "denied" && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-400">
            الإشعارات محظورة في إعدادات المتصفح. افتح الإعدادات وأعد تفعيلها.
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-black/[0.06] dark:border-white/[0.06]">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                tab === t.id
                  ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                  : "border-transparent text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70"
              }`}
              data-testid={`tab-${t.id}`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.count > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] bg-cyan-500 text-white font-bold">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Developer Tools (only on mine tab) */}
        {tab === "mine" && (
          <div className="border border-black/[0.07] dark:border-white/[0.07] rounded-2xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
              onClick={() => setShowTools(!showTools)}
              data-testid="button-toggle-tools"
            >
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-black/40 dark:text-white/40" />
                <span className="text-sm font-semibold text-black dark:text-white">أدوات المطور السريعة</span>
              </div>
              {showTools ? <ChevronUp className="w-4 h-4 text-black/30 dark:text-white/30" /> : <ChevronDown className="w-4 h-4 text-black/30 dark:text-white/30" />}
            </button>
            <AnimatePresence>
              {showTools && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {DEV_TOOLS.map((tool) => (
                      <a
                        key={tool.label}
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.06] hover:border-black/20 dark:hover:border-white/20 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all group"
                        data-testid={`link-tool-${tool.label}`}
                      >
                        <tool.icon className={`w-5 h-5 ${tool.color} group-hover:scale-110 transition-transform`} />
                        <span className="text-[10px] font-medium text-black/50 dark:text-white/50 text-center">{tool.label}</span>
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Assigned to me hint */}
        {tab === "assigned-to-me" && assignedToMeItems.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 text-sm text-cyan-700 dark:text-cyan-400">
            <UserCheck className="w-4 h-4 shrink-0" />
            هذه المهام مُسندة إليك من زملائك — يمكنك إنجازها وتحديد حالتها
          </div>
        )}

        {/* Assigned by me hint */}
        {tab === "assigned-by-me" && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-400">
            <Send className="w-4 h-4 shrink-0" />
            هذه المهام التي أسندتها لموظفين آخرين — يمكنك متابعة حالتها
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 flex-wrap">
            {["الكل", ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterCat === cat
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "bg-black/[0.04] dark:bg-white/[0.04] text-black/50 dark:text-white/50 hover:bg-black/[0.08] dark:hover:bg-white/[0.08]"
                }`}
                data-testid={`filter-cat-${cat}`}
              >{cat}</button>
            ))}
          </div>
          <div className="flex gap-1">
            {["الكل", "urgent", "high", "medium", "low"].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterPriority === p
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "bg-black/[0.04] dark:bg-white/[0.04] text-black/50 dark:text-white/50"
                }`}
                data-testid={`filter-priority-${p}`}
              >
                {p === "الكل" ? "الأولويات" : PRIORITY_CONFIG[p as keyof typeof PRIORITY_CONFIG].label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowDone(!showDone)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              showDone
                ? "bg-black/[0.04] dark:bg-white/[0.04] text-black/50 dark:text-white/50"
                : "bg-black dark:bg-white text-white dark:text-black"
            }`}
            data-testid="button-toggle-done"
          >
            {showDone ? "إخفاء المكتملة" : "إظهار المكتملة"}
          </button>
        </div>

        {/* Checklist */}
        {(isLoading && tab !== "assigned-by-me") || (loadingByMe && tab === "assigned-by-me") ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" />
          </div>
        ) : tabItems.length === 0 ? (
          <div className="text-center py-16">
            <ListChecks className="w-12 h-12 text-black/10 dark:text-white/10 mx-auto mb-4" />
            <p className="text-black/30 dark:text-white/30 text-sm">
              {tab === "mine" && "لا توجد مهام — أضف مهمتك الأولى!"}
              {tab === "assigned-to-me" && "لا توجد مهام مُسندة إليك حالياً"}
              {tab === "assigned-by-me" && "لم تُسند أي مهام لموظفين بعد"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {tabItems.map((item) => {
                const pri = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;
                const isAssignedToMe = getAssignedToId(item) === uid;
                const isAssignedByMe = tab === "assigned-by-me";
                return (
                  <motion.div
                    key={getItemId(item)}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={`group flex items-start gap-3 p-4 rounded-xl border transition-all ${
                      item.done
                        ? "border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01] opacity-60"
                        : isAssignedToMe
                          ? "border-cyan-200 dark:border-cyan-800 bg-cyan-50/30 dark:bg-cyan-900/10 hover:border-cyan-300 dark:hover:border-cyan-700"
                          : isAssignedByMe && !item.done
                            ? "border-blue-100 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-900/10"
                            : "border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 hover:border-black/15 dark:hover:border-white/15"
                    }`}
                    data-testid={`item-checklist-${getItemId(item)}`}
                  >
                    <button
                      onClick={() => handleToggle(item)}
                      className="mt-0.5 shrink-0 transition-transform hover:scale-110"
                      data-testid={`toggle-item-${getItemId(item)}`}
                    >
                      {item.done
                        ? <CheckSquare className="w-5 h-5 text-black dark:text-white" />
                        : <Square className="w-5 h-5 text-black/25 dark:text-white/25" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${item.done ? "line-through text-black/30 dark:text-white/30" : "text-black dark:text-white"}`}>
                          {item.title}
                        </span>
                        <Badge className={`text-[10px] px-2 py-0 ${pri.color} border-0 font-medium`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${pri.dot} mr-1`} />
                          {pri.label}
                        </Badge>
                        {item.category && item.category !== "عام" && (
                          <Badge variant="outline" className="text-[10px] px-2 py-0 border-black/10 dark:border-white/10 text-black/40 dark:text-white/40">
                            <FolderOpen className="w-2.5 h-2.5 ml-1" />{item.category}
                          </Badge>
                        )}
                        {isAssignedToMe && item.assignedBy && (
                          <Badge className="text-[10px] px-2 py-0 bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-0">
                            <UserCheck className="w-2.5 h-2.5 ml-1" />
                            من: {item.assignedBy.fullName || item.assignedBy.username}
                          </Badge>
                        )}
                        {isAssignedByMe && item.assignedTo && (
                          <Badge className={`text-[10px] px-2 py-0 border-0 ${item.done ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}>
                            <Send className="w-2.5 h-2.5 ml-1" />
                            {item.assignedTo.fullName || item.assignedTo.username} · {item.done ? "✓ أنجزها" : "بانتظار"}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-black/40 dark:text-white/40 mt-1">{item.description}</p>
                      )}
                      {item.assignNote && isAssignedToMe && (
                        <p className="text-xs text-cyan-600/70 dark:text-cyan-400/70 mt-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 shrink-0" />
                          {item.assignNote}
                        </p>
                      )}
                      {item.dueDate && (
                        <p className="text-[10px] text-black/30 dark:text-white/30 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.dueDate).toLocaleDateString("ar-SA")}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {!isAssignedByMe && (
                        <button
                          onClick={() => setEditItem(item)}
                          className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors"
                          data-testid={`edit-item-${getItemId(item)}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(getItemId(item))}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-black/30 dark:text-white/30 hover:text-red-500 transition-colors"
                        data-testid={`delete-item-${getItemId(item)}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right font-black">مهمة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="عنوان المهمة *"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              data-testid="input-checklist-title"
            />
            <Textarea
              placeholder="وصف (اختياري)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              data-testid="input-checklist-desc"
            />
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger data-testid="select-priority"><SelectValue placeholder="الأولوية" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="urgent">عاجلة</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger data-testid="select-category"><SelectValue placeholder="الفئة" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-black/40 dark:text-white/40 mb-1 block">تاريخ الاستحقاق (اختياري)</label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                data-testid="input-due-date"
              />
            </div>

            {/* Assign to employee */}
            {otherEmployees.length > 0 && (
              <div className="border border-dashed border-black/10 dark:border-white/10 rounded-xl p-4 space-y-3 bg-black/[0.01] dark:bg-white/[0.01]">
                <div className="flex items-center gap-2 text-xs font-semibold text-black/50 dark:text-white/50 uppercase tracking-wide">
                  <Send className="w-3.5 h-3.5" />
                  إسناد لموظف (اختياري)
                </div>
                <Select value={form.assignedTo || "none"} onValueChange={v => setForm(f => ({ ...f, assignedTo: v === "none" ? "" : v }))}>
                  <SelectTrigger data-testid="select-assignee">
                    <SelectValue placeholder="اختر موظفاً..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— بدون إسناد (مهمة شخصية) —</SelectItem>
                    {otherEmployees.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.fullName || e.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.assignedTo && form.assignedTo !== "none" && (
                  <Input
                    placeholder="ملاحظة للموظف (اختياري)"
                    value={form.assignNote}
                    onChange={e => setForm(f => ({ ...f, assignNote: e.target.value }))}
                    data-testid="input-assign-note"
                  />
                )}
              </div>
            )}

            <Button
              className={`w-full gap-2 ${form.assignedTo && form.assignedTo !== "none"
                ? "bg-gradient-to-l from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700"
                : "bg-black dark:bg-white text-white dark:text-black"}`}
              onClick={() => createMutation.mutate(form)}
              disabled={!form.title || createMutation.isPending}
              data-testid="button-save-checklist"
            >
              {createMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : form.assignedTo && form.assignedTo !== "none"
                  ? <><Send className="w-4 h-4" /> إرسال المهمة للموظف</>
                  : "إضافة المهمة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={v => !v && setEditItem(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right font-black">تعديل المهمة</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4">
              <Input
                value={editItem.title}
                onChange={e => setEditItem(i => i ? { ...i, title: e.target.value } : null)}
                data-testid="input-edit-title"
              />
              <Textarea
                value={editItem.description || ""}
                onChange={e => setEditItem(i => i ? { ...i, description: e.target.value } : null)}
                rows={2}
                data-testid="input-edit-desc"
              />
              <div className="grid grid-cols-2 gap-3">
                <Select value={editItem.priority} onValueChange={v => setEditItem(i => i ? { ...i, priority: v as any } : null)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="urgent">عاجلة</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={editItem.category} onValueChange={v => setEditItem(i => i ? { ...i, category: v } : null)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full bg-black dark:bg-white text-white dark:text-black" onClick={handleSaveEdit} data-testid="button-save-edit">
                حفظ التعديلات
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
