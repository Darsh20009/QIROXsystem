import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Video, Plus, Calendar, Users, Clock, ExternalLink, Trash2,
  BarChart3, Star, FileText, Send, CheckCircle, XCircle, Play,
  AlertCircle, Copy, RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  scheduled: { label: "مجدول", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: Calendar },
  live: { label: "يبث الآن", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", icon: Play },
  completed: { label: "منتهي", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", icon: CheckCircle },
  cancelled: { label: "ملغي", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300", icon: XCircle },
};

const TYPE_MAP: Record<string, string> = {
  internal: "اجتماع داخلي",
  client_individual: "مع عميل بعينه",
  client_all: "مع جميع العملاء",
  consultation: "استشارة",
};

export default function AdminQMeet() {
  const [, navigate] = useLocation();
  const { data: user } = useUser();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [openCreate, setOpenCreate] = useState(false);
  const [filter, setFilter] = useState("all");

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    scheduledAt: "",
    durationMinutes: "60",
    type: "client_individual",
    notes: "",
    participantIds: [] as string[],
    participantEmails: [] as string[],
    participantNames: [] as string[],
    emailInput: "",
    nameInput: "",
  });

  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/qmeet/stats"],
  });

  const { data: meetings, isLoading: meetingsLoading } = useQuery<any[]>({
    queryKey: ["/api/qmeet/meetings"],
  });

  const { data: clients } = useQuery<any[]>({
    queryKey: ["/api/qmeet/clients"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/qmeet/meetings", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/qmeet/meetings"] });
      qc.invalidateQueries({ queryKey: ["/api/qmeet/stats"] });
      toast({ title: "تم إنشاء الاجتماع وإرسال الدعوات بالبريد" });
      setOpenCreate(false);
      resetForm();
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/qmeet/meetings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/qmeet/meetings"] });
      qc.invalidateQueries({ queryKey: ["/api/qmeet/stats"] });
      toast({ title: "تم حذف الاجتماع" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/qmeet/meetings/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/qmeet/meetings"] });
      qc.invalidateQueries({ queryKey: ["/api/qmeet/stats"] });
    },
  });

  const sendInvitesMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/qmeet/meetings/${id}/send-invites`, {}),
    onSuccess: (data: any) => {
      toast({ title: `تم إرسال ${data.sent} دعوة من ${data.total}` });
    },
  });

  function resetForm() {
    setForm({ title: "", description: "", scheduledAt: "", durationMinutes: "60", type: "client_individual", notes: "", participantIds: [], participantEmails: [], participantNames: [], emailInput: "", nameInput: "" });
  }

  function addParticipant() {
    const email = form.emailInput.trim();
    const name = form.nameInput.trim();
    if (!email) return;
    if (form.participantEmails.includes(email)) {
      toast({ title: "البريد مضاف مسبقاً", variant: "destructive" });
      return;
    }
    setForm(f => ({
      ...f,
      participantEmails: [...f.participantEmails, email],
      participantNames: [...f.participantNames, name || email.split("@")[0]],
      emailInput: "",
      nameInput: "",
    }));
  }

  function addClientAsParticipant(client: any) {
    if (form.participantEmails.includes(client.email)) return;
    setForm(f => ({
      ...f,
      participantIds: [...f.participantIds, String(client._id)],
      participantEmails: [...f.participantEmails, client.email],
      participantNames: [...f.participantNames, client.fullName || client.username],
    }));
  }

  function addAllClients() {
    if (!clients) return;
    const ids: string[] = [];
    const emails: string[] = [];
    const names: string[] = [];
    for (const c of clients) {
      if (!form.participantEmails.includes(c.email)) {
        ids.push(String(c._id));
        emails.push(c.email);
        names.push(c.fullName || c.username);
      }
    }
    setForm(f => ({
      ...f,
      participantIds: [...f.participantIds, ...ids],
      participantEmails: [...f.participantEmails, ...emails],
      participantNames: [...f.participantNames, ...names],
    }));
    toast({ title: `تمت إضافة ${emails.length} عميل` });
  }

  function removeParticipant(idx: number) {
    setForm(f => ({
      ...f,
      participantIds: f.participantIds.filter((_, i) => i !== idx),
      participantEmails: f.participantEmails.filter((_, i) => i !== idx),
      participantNames: f.participantNames.filter((_, i) => i !== idx),
    }));
  }

  function handleSubmit() {
    if (!form.title.trim() || !form.scheduledAt) {
      toast({ title: "العنوان والموعد مطلوبان", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      title: form.title,
      description: form.description,
      scheduledAt: form.scheduledAt,
      durationMinutes: parseInt(form.durationMinutes) || 60,
      type: form.type,
      notes: form.notes,
      participantIds: form.participantIds,
      participantEmails: form.participantEmails,
      participantNames: form.participantNames,
    });
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link);
    toast({ title: "تم نسخ الرابط" });
  }

  const filteredMeetings = meetings?.filter(m => filter === "all" || m.status === filter) || [];

  const isManagement = user && ["admin", "manager"].includes(user.role);
  if (!isManagement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-lg font-bold">للإدارة فقط</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black dark:bg-white flex items-center justify-center">
            <Video className="w-5 h-5 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black dark:text-white tracking-tight">QMeet</h1>
            <p className="text-xs text-gray-500">نظام الاجتماعات الذكي</p>
          </div>
        </div>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button className="bg-black hover:bg-black/80 text-white dark:bg-white dark:text-black dark:hover:bg-white/80 gap-2" data-testid="button-create-meeting">
              <Plus className="w-4 h-4" />
              اجتماع جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right">إنشاء اجتماع جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>عنوان الاجتماع *</Label>
                  <Input data-testid="input-meeting-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="مثال: اجتماع مراجعة المشروع" className="mt-1" />
                </div>
                <div>
                  <Label>نوع الاجتماع</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger className="mt-1" data-testid="select-meeting-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client_individual">مع عميل بعينه</SelectItem>
                      <SelectItem value="client_all">مع جميع العملاء</SelectItem>
                      <SelectItem value="internal">اجتماع داخلي</SelectItem>
                      <SelectItem value="consultation">استشارة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>المدة (بالدقيقة)</Label>
                  <Input data-testid="input-meeting-duration" type="number" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))} className="mt-1" min={15} max={480} />
                </div>
                <div className="col-span-2">
                  <Label>موعد الاجتماع *</Label>
                  <Input data-testid="input-meeting-date" type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label>وصف الاجتماع</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="ملاحظات أو وصف مختصر" className="mt-1 h-20" />
                </div>
                <div className="col-span-2">
                  <Label>ملاحظات داخلية</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="ملاحظات للفريق الداخلي فقط" className="mt-1 h-16" />
                </div>
              </div>

              {/* Participants Section */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="font-bold">المشاركون ({form.participantEmails.length})</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addAllClients} className="text-xs gap-1" data-testid="button-add-all-clients">
                    <Users className="w-3 h-3" />
                    إضافة كل العملاء
                  </Button>
                </div>

                {/* Manual email add */}
                <div className="flex gap-2 mb-3">
                  <Input data-testid="input-participant-email" value={form.emailInput} onChange={e => setForm(f => ({ ...f, emailInput: e.target.value }))} placeholder="البريد الإلكتروني" className="flex-1 text-sm" />
                  <Input data-testid="input-participant-name" value={form.nameInput} onChange={e => setForm(f => ({ ...f, nameInput: e.target.value }))} placeholder="الاسم (اختياري)" className="flex-1 text-sm" />
                  <Button type="button" size="sm" onClick={addParticipant} data-testid="button-add-participant">إضافة</Button>
                </div>

                {/* Client quick-select */}
                {clients && clients.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">إضافة سريعة من العملاء:</p>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {clients.slice(0, 20).map(c => (
                        <button key={c._id} type="button" onClick={() => addClientAsParticipant(c)}
                          className={`text-xs px-2 py-1 rounded-full border transition-colors ${form.participantEmails.includes(c.email) ? "bg-black text-white border-black" : "border-gray-300 hover:border-black dark:border-gray-600"}`}
                          data-testid={`button-client-${c._id}`}>
                          {c.fullName || c.username}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Participant list */}
                {form.participantEmails.length > 0 && (
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {form.participantEmails.map((email, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-1.5 text-sm">
                        <span className="text-gray-700 dark:text-gray-300">{form.participantNames[i]} — <span className="text-gray-400">{email}</span></span>
                        <button type="button" onClick={() => removeParticipant(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => { setOpenCreate(false); resetForm(); }}>إلغاء</Button>
                <Button type="button" onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-submit-meeting">
                  {createMutation.isPending ? "جارٍ الإنشاء..." : "إنشاء وإرسال الدعوات"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">الكل</span>
                </div>
                <p className="text-2xl font-black" data-testid="stat-total">{stats?.total || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-500">مجدولة</span>
                </div>
                <p className="text-2xl font-black text-blue-600" data-testid="stat-scheduled">{stats?.scheduled || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-gray-500">متوسط التقييم</span>
                </div>
                <p className="text-2xl font-black text-amber-600" data-testid="stat-rating">{stats?.avgRating || "—"}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-500">التقارير</span>
                </div>
                <p className="text-2xl font-black text-green-600" data-testid="stat-reports">{stats?.reportCount || 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: "all", label: "الكل" },
          { key: "scheduled", label: "مجدولة" },
          { key: "live", label: "يبث الآن" },
          { key: "completed", label: "منتهية" },
          { key: "cancelled", label: "ملغاة" },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filter === tab.key ? "bg-black text-white dark:bg-white dark:text-black" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"}`}
            data-testid={`tab-${tab.key}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Meetings list */}
      {meetingsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">لا توجد اجتماعات</p>
          <p className="text-sm mt-1">أنشئ أول اجتماع الآن</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMeetings.map(meeting => {
            const statusInfo = STATUS_MAP[meeting.status] || STATUS_MAP.scheduled;
            const StatusIcon = statusInfo.icon;
            return (
              <div key={meeting._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow p-4" data-testid={`card-meeting-${meeting._id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-black dark:text-white truncate">{meeting.title}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                        {TYPE_MAP[meeting.type] || meeting.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {meeting.scheduledAt ? format(new Date(meeting.scheduledAt), "EEEE d MMMM yyyy — HH:mm", { locale: ar }) : "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {meeting.durationMinutes} دقيقة
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {(meeting.participantEmails || []).length} مشارك
                      </span>
                    </div>
                    {meeting.description && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{meeting.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Join */}
                    <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-black text-white dark:bg-white dark:text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                      data-testid={`button-join-${meeting._id}`}>
                      <ExternalLink className="w-3 h-3" />
                      انضم
                    </a>
                    {/* Copy link */}
                    <button onClick={() => copyLink(meeting.meetingLink)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700" title="نسخ الرابط" data-testid={`button-copy-${meeting._id}`}>
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {/* Send invites */}
                    <button onClick={() => sendInvitesMutation.mutate(meeting._id)} disabled={sendInvitesMutation.isPending}
                      className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-600" title="إعادة إرسال الدعوات" data-testid={`button-resend-${meeting._id}`}>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                    {/* Details */}
                    <button onClick={() => navigate(`/admin/qmeet/${meeting._id}`)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700" title="التفاصيل" data-testid={`button-detail-${meeting._id}`}>
                      <BarChart3 className="w-3.5 h-3.5" />
                    </button>
                    {/* Status change */}
                    {meeting.status === "scheduled" && (
                      <>
                        <button onClick={() => statusMutation.mutate({ id: meeting._id, status: "live" })}
                          className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-400 hover:text-green-600" title="بدء البث">
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => statusMutation.mutate({ id: meeting._id, status: "cancelled" })}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600" title="إلغاء">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {meeting.status === "live" && (
                      <button onClick={() => statusMutation.mutate({ id: meeting._id, status: "completed" })}
                        className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-400 hover:text-green-600" title="إنهاء الاجتماع">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {/* Delete */}
                    <button onClick={() => { if (confirm("حذف هذا الاجتماع؟")) deleteMutation.mutate(meeting._id) }}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600" title="حذف" data-testid={`button-delete-${meeting._id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Meeting link */}
                <div className="mt-3 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                  <Video className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-400 truncate flex-1">{meeting.meetingLink}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
