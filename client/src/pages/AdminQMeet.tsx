import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import SARIcon from "@/components/SARIcon";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import {
  Video, Plus, Calendar, Users, Clock, Trash2,
  BarChart3, Star, FileText, Send, CheckCircle, XCircle, Play,
  Copy, Radio, Search, Zap,
  Loader2, RefreshCw, Key, Hash, Pencil, Check,
  Shield, Eye, EyeOff, ToggleLeft, ToggleRight, Code, Webhook
} from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { ar } from "date-fns/locale";

const STATUS = {
  scheduled: { label: "مجدول", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", dot: "bg-blue-500", icon: Calendar },
  live:      { label: "مباشر الآن", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", dot: "bg-green-500", icon: Radio },
  completed: { label: "منتهي", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", dot: "bg-gray-400", icon: CheckCircle },
  cancelled: { label: "ملغي", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300", dot: "bg-red-500", icon: XCircle },
};

const TYPES = {
  internal: { label: "داخلي", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  client_individual: { label: "عميل محدد", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" },
  client_all: { label: "جميع العملاء", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  consultation: { label: "استشارة", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" },
};

const EMPTY_FORM = {
  title: "", description: "", scheduledAt: "", durationMinutes: "60",
  type: "client_individual", notes: "", agenda: [] as string[],
  participantIds: [] as string[], participantEmails: [] as string[], participantNames: [] as string[],
  emailInput: "", nameInput: "", agendaInput: "",
  lobbyEnabled: true,
};

export default function AdminQMeet() {
  const [, navigate] = useLocation();
  const { data: user } = useUser();
  const { toast } = useToast();
  const { dir } = useI18n();
  const qc = useQueryClient();
  const [openCreate, setOpenCreate] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [clientSearch, setClientSearch] = useState("");

  const { data: stats, isLoading: statsLoading } = useQuery<any>({ queryKey: ["/api/qmeet/stats"] });
  const { data: meetings = [], isLoading: meetingsLoading, refetch } = useQuery<any[]>({ queryKey: ["/api/qmeet/meetings"] });
  const { data: clients = [] } = useQuery<any[]>({ queryKey: ["/api/qmeet/clients"], enabled: openCreate });

  const [instantResult, setInstantResult] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", scheduledAt: "", durationMinutes: "60" });

  // Quick meeting name dialog
  const [openInstant, setOpenInstant] = useState(false);
  const [instantForm, setInstantForm] = useState({ title: "", durationMinutes: "60" });

  // API Keys tab
  const [mainTab, setMainTab] = useState<"meetings" | "apikeys">("meetings");
  const [openNewKey, setOpenNewKey] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({ name: "", plan: "basic" });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const { data: apiKeys = [], refetch: refetchApiKeys } = useQuery<any[]>({
    queryKey: ["/api/qmeet/api-keys"],
    enabled: mainTab === "apikeys",
  });

  const copyInstant = (text: string, field: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/qmeet/meetings", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/qmeet/meetings"] });
      qc.invalidateQueries({ queryKey: ["/api/qmeet/stats"] });
      toast({ title: "✅ تم إنشاء الاجتماع وإرسال الدعوات" });
      setOpenCreate(false); setForm(EMPTY_FORM);
    },
    onError: (e: any) => toast({ title: "خطأ في الإنشاء", description: e.message, variant: "destructive" }),
  });

  const instantMutation = useMutation({
    mutationFn: (body: { title?: string; durationMinutes?: string }) =>
      apiRequest("POST", "/api/qmeet/instant", { title: body.title?.trim() || undefined, durationMinutes: parseInt(body.durationMinutes || "60") || 60 }),
    onSuccess: async (res: any) => {
      const data = await res.json();
      qc.invalidateQueries({ queryKey: ["/api/qmeet/meetings"] });
      qc.invalidateQueries({ queryKey: ["/api/qmeet/stats"] });
      setInstantResult(data);
      setOpenInstant(false);
      setInstantForm({ title: "", durationMinutes: "60" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const createKeyMutation = useMutation({
    mutationFn: (data: { name: string; plan: string }) => apiRequest("POST", "/api/qmeet/api-keys", data),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ["/api/qmeet/api-keys"] });
      toast({ title: "✅ تم إنشاء مفتاح API" });
      setOpenNewKey(false); setNewKeyForm({ name: "", plan: "basic" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const toggleKeyMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => apiRequest("PATCH", `/api/qmeet/api-keys/${id}`, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/qmeet/api-keys"] }),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/qmeet/api-keys/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/qmeet/api-keys"] }); toast({ title: "تم حذف المفتاح" }); },
  });

  const copyApiKey = (keyStr: string, id: string) => {
    navigator.clipboard.writeText(keyStr).catch(() => {});
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/qmeet/meetings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/qmeet/meetings"] });
      qc.invalidateQueries({ queryKey: ["/api/qmeet/stats"] });
      toast({ title: "تم حذف الاجتماع" });
    },
    onError: (e: any) => toast({ title: "فشل الحذف", description: e.message, variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/qmeet/meetings/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/qmeet/meetings"] });
      toast({ title: "✅ تم تحديث الاجتماع" });
      setEditTarget(null);
    },
    onError: (e: any) => toast({ title: "فشل التحديث", description: e.message, variant: "destructive" }),
  });

  const openEditDialog = (meeting: any) => {
    setEditTarget(meeting);
    const localDt = meeting.scheduledAt
      ? new Date(meeting.scheduledAt).toISOString().slice(0, 16)
      : "";
    setEditForm({
      title: meeting.title || "",
      description: meeting.description || "",
      scheduledAt: localDt,
      durationMinutes: String(meeting.durationMinutes || 60),
    });
  };

  const handleEdit = () => {
    if (!editForm.title.trim()) { toast({ title: "العنوان مطلوب", variant: "destructive" }); return; }
    editMutation.mutate({ id: editTarget._id, data: {
      title: editForm.title,
      description: editForm.description,
      ...(editForm.scheduledAt && { scheduledAt: editForm.scheduledAt }),
      durationMinutes: parseInt(editForm.durationMinutes) || 60,
    }});
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiRequest("PATCH", `/api/qmeet/meetings/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/qmeet/meetings"] });
      qc.invalidateQueries({ queryKey: ["/api/qmeet/stats"] });
    },
  });

  const sendInvitesMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/qmeet/meetings/${id}/send-invites`, {}),
    onSuccess: async (res: any) => {
      const data = await res.json().catch(() => ({}));
      toast({ title: `✅ تم إرسال ${data.sent ?? 0} دعوة من ${data.total ?? 0}` });
    },
    onError: () => toast({ title: "فشل إرسال الدعوات", variant: "destructive" }),
  });

  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }));

  const addParticipant = () => {
    const email = form.emailInput.trim();
    if (!email) return;
    if (form.participantEmails.includes(email)) { toast({ title: "البريد مضاف", variant: "destructive" }); return; }
    setForm(f => ({ ...f, participantEmails: [...f.participantEmails, email], participantNames: [...f.participantNames, f.nameInput.trim() || email.split("@")[0]], emailInput: "", nameInput: "" }));
  };

  const addClient = (c: any) => {
    if (form.participantEmails.includes(c.email)) return;
    setForm(f => ({ ...f, participantIds: [...f.participantIds, String(c._id || c.id)], participantEmails: [...f.participantEmails, c.email], participantNames: [...f.participantNames, c.fullName || c.username] }));
  };

  const addAllClients = () => {
    const toAdd = clients.filter(c => !form.participantEmails.includes(c.email));
    if (!toAdd.length) return;
    setForm(f => ({ ...f, participantIds: [...f.participantIds, ...toAdd.map(c => String(c._id || c.id))], participantEmails: [...f.participantEmails, ...toAdd.map(c => c.email)], participantNames: [...f.participantNames, ...toAdd.map(c => c.fullName || c.username)] }));
    toast({ title: `تمت إضافة ${toAdd.length} شخص` });
  };

  const removeParticipant = (i: number) => {
    setForm(f => ({ ...f, participantIds: f.participantIds.filter((_, j) => j !== i), participantEmails: f.participantEmails.filter((_, j) => j !== i), participantNames: f.participantNames.filter((_, j) => j !== i) }));
  };

  const addAgenda = () => {
    const v = form.agendaInput.trim(); if (!v) return;
    setForm(f => ({ ...f, agenda: [...f.agenda, v], agendaInput: "" }));
  };

  const handleCreate = () => {
    if (!form.title.trim() || !form.scheduledAt) { toast({ title: "العنوان والموعد مطلوبان", variant: "destructive" }); return; }
    createMutation.mutate({
      title: form.title, description: form.description,
      scheduledAt: form.scheduledAt, durationMinutes: parseInt(form.durationMinutes) || 60,
      type: form.type, notes: form.notes, agenda: form.agenda,
      participantIds: form.participantIds, participantEmails: form.participantEmails, participantNames: form.participantNames,
      lobbyEnabled: form.lobbyEnabled,
    });
  };

  const copyLink = (link: string) => {
    const full = link.startsWith("http") ? link : `${window.location.origin}${link}`;
    navigator.clipboard.writeText(full);
    toast({ title: "تم نسخ الرابط" });
  };

  const filteredMeetings = meetings.filter(m => {
    if (filter !== "all" && m.status !== filter) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.hostName?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const STAFF_ROLES = ["admin", "manager", "developer", "designer", "support", "sales_manager", "sales", "accountant", "merchant"];
  const isManagement = user && STAFF_ROLES.includes(user.role);

  const filteredClients = clients.filter(c => !clientSearch || (c.fullName || "").toLowerCase().includes(clientSearch.toLowerCase()) || (c.email || "").toLowerCase().includes(clientSearch.toLowerCase()));

  return (
    <div className="relative overflow-hidden min-h-screen bg-white dark:bg-gray-950 p-4 md:p-6" dir={dir}>
      <PageGraphics variant="dashboard" />
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="relative bg-gradient-to-bl from-blue-600/10 via-cyan-500/5 to-transparent border border-black/[0.07] dark:border-white/[0.07] rounded-3xl p-6 overflow-hidden">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 right-8 w-32 h-32 bg-gradient-to-br from-purple-500/10 rounded-full blur-2xl" />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Video className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-black dark:text-white">QMeet</h1>
                <p className="text-sm text-black/40 dark:text-white/40">نظام الاجتماعات الذكي المدمج</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2" data-testid="btn-refresh">
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              <Button onClick={() => navigate("/meet/join")} variant="outline" className="gap-2 border-black/10 dark:border-white/10" data-testid="button-join-by-code">
                <Key className="w-4 h-4" /> انضمام بكود
              </Button>
              {isManagement && (
              <Button
                onClick={() => setOpenInstant(true)}
                variant="outline"
                className="gap-2 border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                data-testid="button-quick-meeting"
              >
                <Zap className="w-4 h-4" />
                اجتماع سريع
              </Button>)}
              {isManagement && (
                <Button onClick={() => setOpenCreate(true)} className="gap-2 bg-gradient-to-l from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20" data-testid="button-create-meeting">
                  <Plus className="w-4 h-4" /> اجتماع جديد
                </Button>
              )}
            </div>
          </div>

          {/* Stats Row */}
          {isManagement && (
            <div className="relative mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "إجمالي", value: stats?.total || 0, icon: Video, color: "text-blue-500" },
                { label: "مجدولة", value: stats?.scheduled || 0, icon: Calendar, color: "text-blue-500" },
                { label: "مباشرة", value: stats?.live || 0, icon: Radio, color: "text-green-500" },
                { label: "متوسط التقييم", value: stats?.avgRating || "—", icon: Star, color: "text-amber-500" },
              ].map(stat => (
                <div key={stat.label} className="bg-white/60 dark:bg-gray-900/60 backdrop-blur border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-4" data-testid={`stat-${stat.label}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color} mb-2`} />
                  <p className="text-xl font-black text-black dark:text-white">{stat.value}</p>
                  <p className="text-xs text-black/40 dark:text-white/40">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── API Keys Section ── */}
        {mainTab === "apikeys" && isManagement && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-black dark:text-white">مفاتيح API الخارجية</h2>
                <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">أنشئ مفاتيح لربط تطبيقات خارجية مع QMeet · الخدمة مدفوعة</p>
              </div>
              <Button onClick={() => setOpenNewKey(true)} className="gap-2 bg-gradient-to-l from-purple-600 to-blue-500 text-white" data-testid="button-new-api-key">
                <Plus className="w-4 h-4" /> مفتاح جديد
              </Button>
            </div>

            {/* API Docs box */}
            <div className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Code className="w-4 h-4 text-purple-500" />
                <span className="font-bold text-sm text-black dark:text-white">توثيق API</span>
                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-semibold">v1</span>
              </div>
              <div className="grid md:grid-cols-2 gap-3 text-xs">
                {[
                  { method: "POST", path: "/api/qmeet/v1/meetings", desc: "إنشاء اجتماع جديد" },
                  { method: "GET",  path: "/api/qmeet/v1/meetings", desc: "قائمة الاجتماعات المنشأة" },
                  { method: "GET",  path: "/api/qmeet/v1/meetings/:roomName", desc: "تفاصيل اجتماع محدد" },
                  { method: "DELETE", path: "/api/qmeet/v1/meetings/:roomName", desc: "إلغاء اجتماع" },
                ].map(e => (
                  <div key={e.path} className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-black/[0.05] dark:border-white/[0.05] rounded-xl px-3 py-2">
                    <span className={`font-mono font-black text-[10px] px-1.5 py-0.5 rounded-md ${e.method === "POST" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : e.method === "GET" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>{e.method}</span>
                    <code className="text-black/60 dark:text-white/60 text-[10px] flex-1 truncate">{e.path}</code>
                    <span className="text-black/35 dark:text-white/35 text-[10px] hidden md:block">{e.desc}</span>
                  </div>
                ))}
              </div>
              <div className="bg-black/[0.04] dark:bg-white/[0.04] rounded-xl p-3 font-mono text-xs text-black/60 dark:text-white/60 space-y-1 select-all">
                <p className="text-black/40 dark:text-white/40"># أضف هذا الـ header في كل طلب</p>
                <p><span className="text-purple-600 dark:text-purple-400">x-qmeet-api-key</span>: qmeet_xxxxxxxxxxxxxxxx</p>
                <p className="text-black/40 dark:text-white/40 mt-2"># مثال: إنشاء اجتماع</p>
                <p><span className="text-blue-600 dark:text-blue-400">POST</span> {window.location.origin}/api/qmeet/v1/meetings</p>
                <p>{"{"} "title": "اجتماع العميل", "scheduledAt": "2025-06-01T10:00:00Z", "durationMinutes": 60 {"}"}</p>
              </div>
            </div>

            {/* Keys list */}
            {apiKeys.length === 0 ? (
              <div className="text-center py-16 bg-black/[0.02] dark:bg-white/[0.02] rounded-3xl border border-black/[0.05] dark:border-white/[0.05]">
                <Shield className="w-12 h-12 mx-auto mb-3 text-black/10 dark:text-white/10" />
                <p className="font-medium text-black/30 dark:text-white/30 text-sm">لا توجد مفاتيح API — أنشئ أول مفتاح</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((k: any) => (
                  <motion.div key={k.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl border bg-white dark:bg-gray-900 p-5 ${k.active ? "border-black/[0.07] dark:border-white/[0.07]" : "border-red-200 dark:border-red-900/40 opacity-60"}`}
                    data-testid={`card-apikey-${k.id}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${k.plan === "pro" ? "bg-purple-100 dark:bg-purple-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`}>
                        <Shield className={`w-5 h-5 ${k.plan === "pro" ? "text-purple-600 dark:text-purple-400" : "text-blue-600 dark:text-blue-400"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-black dark:text-white text-sm">{k.name}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${k.plan === "pro" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"}`}>
                            {k.plan === "pro" ? <span className="flex items-center gap-1">برو — 299 <SARIcon size={9} />/شهر</span> : <span className="flex items-center gap-1">أساسي — 99 <SARIcon size={9} />/شهر</span>}
                          </span>
                          {!k.active && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">موقوف</span>}
                        </div>
                        {/* Key display */}
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs font-mono text-black/50 dark:text-white/50 bg-black/[0.04] dark:bg-white/[0.04] px-2 py-0.5 rounded-lg truncate max-w-[260px]">
                            {revealedKeys.has(k.id) ? k.key : k.key.slice(0, 10) + "•".repeat(20)}
                          </code>
                          <button onClick={() => setRevealedKeys(prev => { const s = new Set(prev); s.has(k.id) ? s.delete(k.id) : s.add(k.id); return s; })}
                            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60 transition-colors"
                            title="إظهار/إخفاء">
                            {revealedKeys.has(k.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => copyApiKey(k.key, k.id)}
                            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60 transition-colors"
                            title="نسخ" data-testid={`button-copy-apikey-${k.id}`}>
                            {copiedKey === k.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <div className="flex gap-3 mt-1.5 text-[10px] text-black/35 dark:text-white/35">
                          <span>أُنشئ بواسطة: {k.createdByName}</span>
                          <span>الاستخدام: {k.totalCalls}/{k.monthlyLimit} طلب/شهر</span>
                          {k.lastUsedAt && <span>آخر استخدام: {format(new Date(k.lastUsedAt), "d MMM", { locale: ar })}</span>}
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => toggleKeyMutation.mutate({ id: k.id, active: !k.active })}
                          className={`p-2 rounded-xl transition-colors ${k.active ? "hover:bg-red-50 dark:hover:bg-red-900/20 text-green-600" : "hover:bg-green-50 dark:hover:bg-green-900/20 text-red-500"}`}
                          title={k.active ? "إيقاف المفتاح" : "تفعيل المفتاح"} data-testid={`button-toggle-apikey-${k.id}`}>
                          {k.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button onClick={() => { if (confirm(`هل تريد حذف المفتاح "${k.name}"؟`)) deleteKeyMutation.mutate(k.id); }}
                          className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-black/30 hover:text-red-600 transition-colors"
                          title="حذف" data-testid={`button-delete-apikey-${k.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Tab Switch */}
        {isManagement && (
          <div className="flex gap-2">
            <button onClick={() => setMainTab("meetings")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold border transition-all ${mainTab === "meetings" ? "bg-black dark:bg-white text-white dark:text-black border-transparent shadow" : "border-black/10 dark:border-white/10 text-black/50 dark:text-white/50 hover:border-black/20 dark:hover:border-white/20"}`}
              data-testid="tab-meetings">
              <Video className="w-3.5 h-3.5" /> الاجتماعات
            </button>
            <button onClick={() => setMainTab("apikeys")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold border transition-all ${mainTab === "apikeys" ? "bg-black dark:bg-white text-white dark:text-black border-transparent shadow" : "border-black/10 dark:border-white/10 text-black/50 dark:text-white/50 hover:border-black/20 dark:hover:border-white/20"}`}
              data-testid="tab-apikeys">
              <Webhook className="w-3.5 h-3.5" /> مفاتيح API
            </button>
          </div>
        )}

        {/* ── Meetings Section (only shown when mainTab=meetings) ── */}
        {mainTab === "meetings" && (<>

        {/* Filter + Search */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 dark:text-white/30" />
            <Input className="pr-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في الاجتماعات..." data-testid="input-search" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[
              { key: "all", label: "الكل" },
              { key: "scheduled", label: "مجدولة" },
              { key: "live", label: "مباشرة" },
              { key: "completed", label: "منتهية" },
              { key: "cancelled", label: "ملغاة" },
            ].map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filter === tab.key ? "bg-black dark:bg-white text-white dark:text-black border-transparent" : "border-black/10 dark:border-white/10 text-black/50 dark:text-white/50 hover:border-black/20 dark:hover:border-white/20"}`}
                data-testid={`tab-${tab.key}`}>
                {tab.key === "live" && stats?.live > 0 && <span className="inline-block w-2 h-2 rounded-full bg-green-500 ml-1.5 animate-pulse" />}
                {tab.label}
                {tab.key === "all" && meetings.length > 0 && <span className="ml-1.5 text-xs text-black/30 dark:text-white/30">({meetings.length})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Meetings List */}
        {meetingsLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" /></div>
        ) : filteredMeetings.length === 0 ? (
          <div className="text-center py-20">
            <Video className="w-12 h-12 mx-auto mb-3 text-black/10 dark:text-white/10" />
            <p className="font-medium text-black/40 dark:text-white/40">{search || filter !== "all" ? "لا توجد نتائج" : "لا توجد اجتماعات — أنشئ أول اجتماع"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredMeetings.map(meeting => {
                const statusInfo = STATUS[meeting.status as keyof typeof STATUS] || STATUS.scheduled;
                const typeInfo = TYPES[meeting.type as keyof typeof TYPES] || TYPES.client_individual;
                const StatusIcon = statusInfo.icon;
                const scheduledDate = meeting.scheduledAt ? new Date(meeting.scheduledAt) : null;
                const timeAgo = scheduledDate ? formatDistanceToNow(scheduledDate, { addSuffix: true, locale: ar }) : "";
                const isPastMeeting = scheduledDate && isPast(scheduledDate);

                return (
                  <motion.div key={meeting._id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className={`group relative rounded-2xl border transition-all overflow-hidden ${meeting.status === "live" ? "border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10" : "border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-gray-900 hover:border-black/15 dark:hover:border-white/15"}`}
                    data-testid={`card-meeting-${meeting._id}`}>

                    {/* Live pulse bar */}
                    {meeting.status === "live" && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-400 animate-pulse" />}

                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Status dot + icon */}
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${meeting.status === "live" ? "bg-green-100 dark:bg-green-900/30" : meeting.status === "scheduled" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-black/5 dark:bg-white/5"}`}>
                          <StatusIcon className={`w-5 h-5 ${meeting.status === "live" ? "text-green-600" : meeting.status === "scheduled" ? "text-blue-600" : "text-black/40 dark:text-white/40"}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <h3 className="font-bold text-black dark:text-white text-base">{meeting.title}</h3>
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                              {meeting.status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                              {statusInfo.label}
                            </span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${typeInfo.color}`}>{typeInfo.label}</span>
                          </div>

                          <div className="flex flex-wrap gap-3 text-xs text-black/40 dark:text-white/40">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {scheduledDate ? format(scheduledDate, "EEEE d MMMM — HH:mm", { locale: ar }) : "—"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {meeting.durationMinutes} دقيقة
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {(meeting.participantEmails || []).length} مشارك
                            </span>
                              <span className="text-black/25 dark:text-white/25">{timeAgo}</span>
                            {meeting.joinCode && (
                              <span className="flex items-center gap-1 bg-black/[0.04] dark:bg-white/[0.05] text-black/50 dark:text-white/50 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold cursor-pointer hover:bg-black/[0.08] transition-colors"
                                onClick={() => { navigator.clipboard.writeText(meeting.joinCode); }}
                                title="انقر لنسخ الكود">
                                <Hash className="w-3 h-3" />
                                {meeting.joinCode}
                              </span>
                            )}
                          </div>

                          {meeting.description && <p className="text-xs text-black/40 dark:text-white/40 mt-1.5 truncate">{meeting.description}</p>}

                          {/* Agenda preview */}
                          {(meeting.agenda || []).length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {meeting.agenda.slice(0, 3).map((item: string, i: number) => (
                                <span key={i} className="text-[10px] bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/50 px-2 py-0.5 rounded-full">{item}</span>
                              ))}
                              {meeting.agenda.length > 3 && <span className="text-[10px] text-black/30 dark:text-white/30">+{meeting.agenda.length - 3} بند</span>}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          <button
                            onClick={() => window.open(meeting.meetingLink, '_blank')}
                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all ${meeting.status === "live" ? "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20" : "bg-black dark:bg-white text-white dark:text-black hover:opacity-80"}`}
                            data-testid={`button-join-${meeting._id}`}>
                            <Video className="w-3.5 h-3.5" />
                            {meeting.status === "live" ? "انضم مباشرة" : "انضم"}
                          </button>
                          <button onClick={() => copyLink(meeting.meetingLink)} className="p-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-black/30 hover:text-black/70 dark:text-white/30 dark:hover:text-white/70 transition-colors" title="نسخ الرابط" data-testid={`button-copy-${meeting._id}`}>
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {isManagement && (
                            <>
                              <button onClick={() => openEditDialog(meeting)} className="p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 text-black/30 hover:text-amber-600 dark:hover:text-amber-400 transition-colors" title="تعديل الاجتماع" data-testid={`button-edit-${meeting._id}`}>
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => sendInvitesMutation.mutate(meeting._id)} className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-black/30 hover:text-blue-600 transition-colors" title="إعادة إرسال الدعوات" data-testid={`button-resend-${meeting._id}`}>
                                <Send className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => navigate(`/admin/qmeet/${meeting._id}`)} className="p-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-black/30 hover:text-black/70 dark:text-white/30 dark:hover:text-white/70 transition-colors" title="التفاصيل" data-testid={`button-detail-${meeting._id}`}>
                                <BarChart3 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status actions */}
                      {isManagement && (
                        <div className="flex gap-2 mt-4 pt-3 border-t border-black/[0.05] dark:border-white/[0.05] flex-wrap">
                          {meeting.status === "scheduled" && (
                            <>
                              <Button size="sm" className="gap-1.5 bg-green-500 hover:bg-green-600 text-white border-0 h-7 text-xs" onClick={() => statusMutation.mutate({ id: meeting._id, status: "live" })} disabled={statusMutation.isPending}>
                                <Play className="w-3 h-3" /> بدء البث
                              </Button>
                              <Button size="sm" variant="outline" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 h-7 text-xs" onClick={() => statusMutation.mutate({ id: meeting._id, status: "cancelled" })}>
                                <XCircle className="w-3 h-3" /> إلغاء
                              </Button>
                            </>
                          )}
                          {meeting.status === "live" && (
                            <Button size="sm" className="gap-1.5 bg-black hover:bg-black/80 text-white border-0 h-7 text-xs" onClick={() => statusMutation.mutate({ id: meeting._id, status: "completed" })}>
                              <CheckCircle className="w-3 h-3" /> إنهاء الاجتماع
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="gap-1.5 text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 h-7 text-xs mr-auto" onClick={() => { if (confirm(`هل تريد حذف "${meeting.title}"؟`)) deleteMutation.mutate(meeting._id); }} data-testid={`button-delete-${meeting._id}`} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} حذف
                          </Button>
                          {meeting.status === "completed" && (
                            <button onClick={() => navigate(`/admin/qmeet/${meeting._id}`)} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                              <FileText className="w-3 h-3" /> عرض التقرير
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        </>)}
      </div>

      {/* Quick Meeting Name Dialog */}
      <Dialog open={openInstant} onOpenChange={v => { setOpenInstant(v); if (!v) setInstantForm({ title: "", durationMinutes: "60" }); }}>
        <DialogContent className="max-w-sm" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 font-black">
              <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              اجتماع سريع
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div>
              <label className="label-xs">اسم الاجتماع (اختياري)</label>
              <Input
                value={instantForm.title}
                onChange={e => setInstantForm(f => ({ ...f, title: e.target.value }))}
                placeholder="مثال: اجتماع مراجعة سريع"
                className="mt-1"
                data-testid="input-instant-title"
                onKeyDown={e => e.key === "Enter" && !instantMutation.isPending && instantMutation.mutate(instantForm)}
                autoFocus
              />
              <p className="text-[10px] text-black/30 dark:text-white/30 mt-1">إذا تركته فارغاً يُستخدم اسمك تلقائياً</p>
            </div>
            <div>
              <label className="label-xs">المدة (بالدقيقة)</label>
              <Input
                type="number"
                value={instantForm.durationMinutes}
                onChange={e => setInstantForm(f => ({ ...f, durationMinutes: e.target.value }))}
                className="mt-1" min={15} max={480}
                data-testid="input-instant-duration"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                onClick={() => instantMutation.mutate(instantForm)}
                disabled={instantMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
                data-testid="button-start-instant"
              >
                {instantMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {instantMutation.isPending ? "جارٍ الإنشاء..." : "ابدأ الاجتماع"}
              </Button>
              <Button variant="outline" onClick={() => setOpenInstant(false)} className="border-black/10 dark:border-white/10">إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create API Key Dialog */}
      <Dialog open={openNewKey} onOpenChange={v => { setOpenNewKey(v); if (!v) setNewKeyForm({ name: "", plan: "basic" }); }}>
        <DialogContent className="max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 font-black">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              إنشاء مفتاح API جديد
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="label-xs">اسم المفتاح *</label>
              <Input
                value={newKeyForm.name}
                onChange={e => setNewKeyForm(f => ({ ...f, name: e.target.value }))}
                placeholder="مثال: تطبيق إدارة العملاء"
                className="mt-1"
                data-testid="input-apikey-name"
              />
              <p className="text-[10px] text-black/30 dark:text-white/30 mt-1">اسم توضيحي لتمييز هذا المفتاح</p>
            </div>
            <div>
              <label className="label-xs">الخطة</label>
              <div className="grid grid-cols-2 gap-3 mt-1.5">
                {[
                  { key: "basic", label: "أساسي", priceNum: "99", period: "شهر", limit: "100 طلب/شهر", color: "border-blue-300 bg-blue-50 dark:bg-blue-900/20" },
                  { key: "pro", label: "برو", priceNum: "299", period: "شهر", limit: "1000 طلب/شهر", color: "border-purple-300 bg-purple-50 dark:bg-purple-900/20" },
                ].map(p => (
                  <button key={p.key} type="button"
                    onClick={() => setNewKeyForm(f => ({ ...f, plan: p.key }))}
                    className={`p-4 rounded-2xl border-2 text-right transition-all ${newKeyForm.plan === p.key ? p.color + " shadow-sm" : "border-black/10 dark:border-white/10 hover:border-black/20"}`}
                    data-testid={`option-plan-${p.key}`}>
                    <p className="font-bold text-sm text-black dark:text-white">{p.label}</p>
                    <p className="text-xs text-black/50 dark:text-white/50 mt-0.5 flex items-center gap-0.5">{p.priceNum} <SARIcon size={9} className="opacity-60" />/{p.period}</p>
                    <p className="text-[10px] text-black/35 dark:text-white/35">{p.limit}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-3">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                هذه خدمة مدفوعة — سيتم احتساب الرسوم على الحساب شهرياً
              </p>
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                onClick={() => { if (!newKeyForm.name.trim()) { toast({ title: "اسم المفتاح مطلوب", variant: "destructive" }); return; } createKeyMutation.mutate(newKeyForm); }}
                disabled={createKeyMutation.isPending}
                className="flex-1 bg-gradient-to-l from-purple-600 to-blue-500 text-white gap-2"
                data-testid="button-submit-apikey"
              >
                {createKeyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                {createKeyMutation.isPending ? "جارٍ الإنشاء..." : "إنشاء المفتاح"}
              </Button>
              <Button variant="outline" onClick={() => setOpenNewKey(false)} className="border-black/10 dark:border-white/10">إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Meeting Dialog */}
      <Dialog open={openCreate} onOpenChange={v => { setOpenCreate(v); if (!v) setForm(EMPTY_FORM); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 font-black">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                <Video className="w-4 h-4 text-white" />
              </div>
              إنشاء اجتماع جديد
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Title + Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label-xs">عنوان الاجتماع *</label>
                <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="مثال: اجتماع مراجعة المشروع Q2" className="mt-1" data-testid="input-meeting-title" />
              </div>
              <div>
                <label className="label-xs">نوع الاجتماع</label>
                <select value={form.type} onChange={e => set("type", e.target.value)} className="w-full h-10 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-sm text-black dark:text-white mt-1" data-testid="select-meeting-type">
                  <option value="client_individual">مع عميل محدد</option>
                  <option value="client_all">مع جميع العملاء</option>
                  <option value="internal">اجتماع داخلي</option>
                  <option value="consultation">استشارة</option>
                </select>
              </div>
              <div>
                <label className="label-xs">المدة (بالدقيقة)</label>
                <Input type="number" value={form.durationMinutes} onChange={e => set("durationMinutes", e.target.value)} className="mt-1" min={15} max={480} data-testid="input-meeting-duration" />
              </div>
              <div className="col-span-2">
                <label className="label-xs">موعد الاجتماع *</label>
                <Input type="datetime-local" value={form.scheduledAt} onChange={e => set("scheduledAt", e.target.value)} className="mt-1" data-testid="input-meeting-date" />
              </div>
              <div className="col-span-2">
                <label className="label-xs">وصف الاجتماع</label>
                <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="ملاحظات أو وصف مختصر" className="mt-1 h-16" />
              </div>
              <div className="col-span-2">
                <label className="label-xs">ملاحظات داخلية</label>
                <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="للفريق الداخلي فقط" className="mt-1 h-14" />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    onClick={() => setForm(f => ({ ...f, lobbyEnabled: !f.lobbyEnabled }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${form.lobbyEnabled ? "bg-blue-500" : "bg-black/20 dark:bg-white/20"}`}
                    data-testid="toggle-lobby-enabled"
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.lobbyEnabled ? "translate-x-5" : ""}`} />
                  </div>
                  <span className="text-sm font-medium text-black dark:text-white">
                    صالة الانتظار
                  </span>
                  <span className="text-xs text-black/40 dark:text-white/40">
                    {form.lobbyEnabled ? "المشاركون ينتظرون موافقتك قبل الدخول" : "الكل يدخل مباشرة بدون إذن"}
                  </span>
                </label>
              </div>
            </div>

            {/* Agenda */}
            <div className="border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-4 space-y-3">
              <label className="text-sm font-bold text-black dark:text-white flex items-center gap-2"><FileText className="w-4 h-4 text-cyan-500" /> جدول الأعمال</label>
              <div className="flex gap-2">
                <Input value={form.agendaInput} onChange={e => set("agendaInput", e.target.value)} onKeyDown={e => e.key === "Enter" && addAgenda()} placeholder="أضف بنداً..." />
                <Button type="button" variant="outline" size="sm" onClick={addAgenda}>إضافة</Button>
              </div>
              {form.agenda.length > 0 && (
                <div className="space-y-1">
                  {form.agenda.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02] rounded-lg px-3 py-1.5 text-sm">
                      <span className="text-black/70 dark:text-white/70">• {item}</span>
                      <button onClick={() => setForm(f => ({ ...f, agenda: f.agenda.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Participants */}
            <div className="border border-black/[0.07] dark:border-white/[0.07] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-black dark:text-white flex items-center gap-2"><Users className="w-4 h-4 text-purple-500" /> المشاركون ({form.participantEmails.length})</label>
                <Button type="button" variant="outline" size="sm" onClick={addAllClients} className="text-xs gap-1 h-7" data-testid="button-add-all-clients">
                  <Users className="w-3 h-3" /> الكل
                </Button>
              </div>

              {/* Manual add */}
              <div className="flex gap-2">
                <Input value={form.emailInput} onChange={e => set("emailInput", e.target.value)} onKeyDown={e => e.key === "Enter" && addParticipant()} placeholder="البريد الإلكتروني" className="flex-1 text-sm" data-testid="input-participant-email" />
                <Input value={form.nameInput} onChange={e => set("nameInput", e.target.value)} placeholder="الاسم" className="flex-1 text-sm" data-testid="input-participant-name" />
                <Button type="button" size="sm" onClick={addParticipant} data-testid="button-add-participant">إضافة</Button>
              </div>

              {/* Client search */}
              {clients.length > 0 && (
                <div>
                  <div className="relative mb-2">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/30 dark:text-white/30" />
                    <Input className="pr-8 text-xs h-8" value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="بحث سريع بالمستخدمين..." />
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
                    {filteredClients.slice(0, 30).map(c => (
                      <button key={c._id || c.id} type="button" onClick={() => addClient(c)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${form.participantEmails.includes(c.email) ? "bg-black dark:bg-white text-white dark:text-black border-transparent" : "border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/25 text-black/60 dark:text-white/60"}`}
                        data-testid={`button-client-${c._id || c.id}`}>
                        {c.fullName || c.username}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Added list */}
              {form.participantEmails.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {form.participantEmails.map((email, i) => (
                    <div key={i} className="flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02] rounded-xl px-3 py-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-[10px] font-bold text-blue-600">{(form.participantNames[i] || email)[0]?.toUpperCase()}</div>
                        <span className="font-medium text-black dark:text-white">{form.participantNames[i]}</span>
                        <span className="text-black/30 dark:text-white/30">{email}</span>
                      </div>
                      <button type="button" onClick={() => removeParticipant(i)} className="text-red-400 hover:text-red-600">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setOpenCreate(false); setForm(EMPTY_FORM); }}>إلغاء</Button>
              <Button type="button" onClick={handleCreate} disabled={createMutation.isPending} className="gap-2 bg-gradient-to-l from-blue-600 to-cyan-500 text-white" data-testid="button-submit-meeting">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {createMutation.isPending ? "جارٍ الإنشاء..." : "إنشاء وإرسال الدعوات"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Instant Meeting Result Dialog */}
      <Dialog open={!!instantResult} onOpenChange={v => { if (!v) setInstantResult(null); }}>
        <DialogContent className="max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 font-black">
              <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              تم إنشاء الاجتماع السريع
            </DialogTitle>
          </DialogHeader>
          {instantResult && (
            <div className="space-y-4 pt-2">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-2xl p-4">
                <p className="text-green-700 dark:text-green-300 text-sm font-semibold">{instantResult.title}</p>
                <p className="text-green-600/70 dark:text-green-400/60 text-xs mt-1">الاجتماع مباشر الآن · {instantResult.durationMinutes} دقيقة</p>
              </div>

              {/* Join Code */}
              <div>
                <p className="text-xs text-black/50 dark:text-white/40 font-medium mb-1.5">كود الانضمام</p>
                <div className="flex items-center gap-2 bg-black/[0.04] dark:bg-white/[0.05] rounded-xl px-4 py-3">
                  <span className="font-mono font-black text-xl tracking-[0.3em] text-black dark:text-white flex-1">{instantResult.joinCode}</span>
                  <button
                    onClick={() => copyInstant(instantResult.joinCode, "code")}
                    className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    data-testid="button-copy-instant-code"
                  >
                    {copiedField === "code" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-black/40 dark:text-white/40" />}
                  </button>
                </div>
              </div>

              {/* Shareable Link */}
              <div>
                <p className="text-xs text-black/50 dark:text-white/40 font-medium mb-1.5">رابط الانضمام المباشر</p>
                <div className="flex items-center gap-2 bg-black/[0.04] dark:bg-white/[0.05] rounded-xl px-3 py-2.5">
                  <span className="text-xs text-black/60 dark:text-white/50 font-mono flex-1 truncate">
                    {`${window.location.origin}/meet/join?code=${instantResult.joinCode}`}
                  </span>
                  <button
                    onClick={() => copyInstant(`${window.location.origin}/meet/join?code=${instantResult.joinCode}`, "sharelink")}
                    className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0"
                    data-testid="button-copy-instant-sharelink"
                  >
                    {copiedField === "sharelink" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-black/40 dark:text-white/40" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  onClick={() => { navigate(instantResult.meetingLink); setInstantResult(null); }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
                  data-testid="button-enter-instant-meeting"
                >
                  <Video className="w-4 h-4" />
                  ادخل الاجتماع
                </Button>
                <Button
                  onClick={() => setInstantResult(null)}
                  variant="outline"
                  className="border-black/10 dark:border-white/10"
                  data-testid="button-close-instant-result"
                >
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Meeting Dialog */}
      <Dialog open={!!editTarget} onOpenChange={v => { if (!v) setEditTarget(null); }}>
        <DialogContent className="max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 font-black">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Pencil className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              تعديل الاجتماع
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="label-xs">عنوان الاجتماع *</label>
              <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="mt-1" data-testid="input-edit-title" />
            </div>
            <div>
              <label className="label-xs">وصف الاجتماع</label>
              <Textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="mt-1 h-16" />
            </div>
            {editTarget && !editTarget.instantJoin && (
              <>
                <div>
                  <label className="label-xs">موعد الاجتماع</label>
                  <Input type="datetime-local" value={editForm.scheduledAt} onChange={e => setEditForm(f => ({ ...f, scheduledAt: e.target.value }))} className="mt-1" data-testid="input-edit-date" />
                </div>
                <div>
                  <label className="label-xs">المدة (بالدقيقة)</label>
                  <Input type="number" value={editForm.durationMinutes} onChange={e => setEditForm(f => ({ ...f, durationMinutes: e.target.value }))} className="mt-1" min={15} max={480} />
                </div>
              </>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>إلغاء</Button>
              <Button type="button" onClick={handleEdit} disabled={editMutation.isPending} className="gap-2 bg-amber-500 hover:bg-amber-600 text-white border-0" data-testid="button-save-edit">
                {editMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                حفظ التعديلات
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`.label-xs { display: block; font-size: 11px; color: rgba(0,0,0,0.4); margin-bottom: 4px; font-weight: 500; }.dark .label-xs { color: rgba(255,255,255,0.4); }`}</style>
    </div>
  );
}
