import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, Plus, Calendar, Users, Clock, ExternalLink, Trash2,
  BarChart3, Star, FileText, Send, CheckCircle, XCircle, Play,
  Copy, Radio, Search, Filter, ChevronRight, Zap, AlertCircle,
  Loader2, CircleDot, RefreshCw
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
};

export default function AdminQMeet() {
  const [, navigate] = useLocation();
  const { data: user } = useUser();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [openCreate, setOpenCreate] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [clientSearch, setClientSearch] = useState("");

  const { data: stats, isLoading: statsLoading } = useQuery<any>({ queryKey: ["/api/qmeet/stats"] });
  const { data: meetings = [], isLoading: meetingsLoading, refetch } = useQuery<any[]>({ queryKey: ["/api/qmeet/meetings"] });
  const { data: clients = [] } = useQuery<any[]>({ queryKey: ["/api/qmeet/clients"], enabled: openCreate });

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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/qmeet/meetings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/qmeet/meetings"] });
      qc.invalidateQueries({ queryKey: ["/api/qmeet/stats"] });
      toast({ title: "تم حذف الاجتماع" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiRequest("PATCH", `/api/qmeet/meetings/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/qmeet/meetings"] });
      qc.invalidateQueries({ queryKey: ["/api/qmeet/stats"] });
    },
  });

  const sendInvitesMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/qmeet/meetings/${id}/send-invites`, {}),
    onSuccess: (data: any) => toast({ title: `✅ تم إرسال ${data.sent} دعوة من ${data.total}` }),
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
    });
  };

  const copyLink = (link: string) => { navigator.clipboard.writeText(link); toast({ title: "تم نسخ الرابط" }); };

  const filteredMeetings = meetings.filter(m => {
    if (filter !== "all" && m.status !== filter) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.hostName?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const isManagement = user && ["admin", "manager"].includes(user.role);

  const filteredClients = clients.filter(c => !clientSearch || (c.fullName || "").toLowerCase().includes(clientSearch.toLowerCase()) || (c.email || "").toLowerCase().includes(clientSearch.toLowerCase()));

  return (
    <div className="relative overflow-hidden min-h-screen bg-white dark:bg-gray-950 p-4 md:p-6" dir="rtl">
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
                          <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all ${meeting.status === "live" ? "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20" : "bg-black dark:bg-white text-white dark:text-black hover:opacity-80"}`}
                            data-testid={`button-join-${meeting._id}`}>
                            <ExternalLink className="w-3.5 h-3.5" />
                            {meeting.status === "live" ? "انضم مباشرة" : "انضم"}
                          </a>
                          <button onClick={() => copyLink(meeting.meetingLink)} className="p-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-black/30 hover:text-black/70 dark:text-white/30 dark:hover:text-white/70 transition-colors" title="نسخ الرابط" data-testid={`button-copy-${meeting._id}`}>
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {isManagement && (
                            <>
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
                          {["scheduled", "cancelled"].includes(meeting.status) && (
                            <Button size="sm" variant="outline" className="gap-1.5 text-red-500 border-red-200 hover:bg-red-50 h-7 text-xs mr-auto" onClick={() => { if (confirm("هل تريد حذف هذا الاجتماع؟")) deleteMutation.mutate(meeting._id); }} data-testid={`button-delete-${meeting._id}`}>
                              <Trash2 className="w-3 h-3" /> حذف
                            </Button>
                          )}
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
      </div>

      {/* Create Meeting Dialog */}
      <Dialog open={openCreate} onOpenChange={v => { setOpenCreate(v); if (!v) setForm(EMPTY_FORM); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
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

      <style>{`.label-xs { display: block; font-size: 11px; color: rgba(0,0,0,0.4); margin-bottom: 4px; font-weight: 500; }.dark .label-xs { color: rgba(255,255,255,0.4); }`}</style>
    </div>
  );
}
