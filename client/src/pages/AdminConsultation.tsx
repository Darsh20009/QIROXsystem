import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Loader2, Calendar, Clock, CheckCircle, XCircle, Eye, Video, Phone, MapPin,
  Users, CalendarClock, AlertCircle, MessageSquare, Bell, Sparkles, Copy, Check,
  Mail, Send, RefreshCw,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback } from "react";
import { useUser } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useI18n } from "@/lib/i18n";

function getBookingStatusConfig(L: boolean): Record<string, { label: string; color: string }> {
  return {
    pending:   { label: L ? "في انتظار تحديد الموعد" : "Awaiting Scheduling", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10" },
    confirmed: { label: L ? "تم تأكيد الموعد" : "Confirmed", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10" },
    rejected:  { label: L ? "مرفوض" : "Rejected", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10" },
    cancelled: { label: L ? "ملغي" : "Cancelled", color: "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700" },
    completed: { label: L ? "مكتمل" : "Completed", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border-black/10 dark:border-white/10" },
  };
}

function getTypeConfig(L: boolean): Record<string, { label: string; icon: any }> {
  return {
    video:     { label: L ? "فيديو" : "Video", icon: Video },
    phone:     { label: L ? "هاتف" : "Phone", icon: Phone },
    in_person: { label: L ? "حضوري" : "In-Person", icon: MapPin },
    any:       { label: L ? "أي نوع" : "Any Type", icon: Calendar },
  };
}

const AI_EMAIL_TYPES = [
  { key: "welcome",      labelAr: "ترحيب باستلام الطلب",     labelEn: "Welcome / Acknowledgment" },
  { key: "followup",     labelAr: "متابعة وملخص الاحتياجات", labelEn: "Follow-up & Needs Summary" },
  { key: "confirmation", labelAr: "تأكيد الموعد بالتفاصيل",  labelEn: "Appointment Confirmation" },
  { key: "proposal",     labelAr: "عرض مبدئي للمشروع",       labelEn: "Initial Project Proposal" },
  { key: "reminder",     labelAr: "تذكير بالموعد القادم",    labelEn: "Appointment Reminder" },
  { key: "rejection",    labelAr: "رفض لبق مع بديل",         labelEn: "Polite Rejection + Alternative" },
];

const emptyAssign = {
  date: "", startTime: "10:00", endTime: "11:00",
  employeeName: "", meetingLink: "", adminNotes: "",
  consultationType: "",
};

export default function AdminConsultation() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";

  const [viewBooking, setViewBooking] = useState<any>(null);
  const [assignBooking, setAssignBooking] = useState<any>(null);
  const [assignForm, setAssignForm] = useState({ ...emptyAssign });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejectBooking, setRejectBooking] = useState<any>(null);

  // Switch reminder state
  const [reminderBooking, setReminderBooking] = useState<any>(null);
  const [reminderForm, setReminderForm] = useState({
    currentProvider: "", serviceType: "", subscriptionEndDate: "", notes: "",
  });

  // AI Email Writer state
  const [aiEmailBooking, setAiEmailBooking] = useState<any>(null);
  const [aiEmailType, setAiEmailType] = useState("followup");
  const [aiEmailContent, setAiEmailContent] = useState("");
  const [aiEmailGenerating, setAiEmailGenerating] = useState(false);
  const [aiEmailCopied, setAiEmailCopied] = useState(false);
  const [aiEmailSending, setAiEmailSending] = useState(false);

  const openAiEmail = (b: any) => {
    setAiEmailBooking(b);
    setAiEmailType("followup");
    setAiEmailContent("");
    setAiEmailCopied(false);
  };

  const generateAiEmail = useCallback(async () => {
    if (!aiEmailBooking) return;
    setAiEmailGenerating(true);
    setAiEmailContent("");
    try {
      const r = await fetch("/api/ai/consultation-email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailType: aiEmailType,
          clientName:      aiEmailBooking.clientName,
          clientEmail:     aiEmailBooking.clientEmail,
          clientPhone:     aiEmailBooking.clientPhone,
          topic:           aiEmailBooking.topic,
          notes:           aiEmailBooking.notes,
          date:            aiEmailBooking.date,
          startTime:       aiEmailBooking.startTime,
          endTime:         aiEmailBooking.endTime,
          consultationType: aiEmailBooking.consultationType,
          employeeName:    aiEmailBooking.employeeName,
          meetingLink:     aiEmailBooking.meetingLink,
          language: L ? "ar" : "en",
        }),
      });
      const data = await r.json();
      if (data.email) {
        setAiEmailContent(data.email);
      } else {
        toast({ title: L ? "تعذّر توليد البريد" : "Failed to generate email", variant: "destructive" });
      }
    } catch {
      toast({ title: L ? "خطأ في الاتصال بالذكاء الاصطناعي" : "AI connection error", variant: "destructive" });
    }
    setAiEmailGenerating(false);
  }, [aiEmailBooking, aiEmailType, L, toast]);

  const copyEmail = () => {
    if (!aiEmailContent) return;
    navigator.clipboard.writeText(aiEmailContent).then(() => {
      setAiEmailCopied(true);
      setTimeout(() => setAiEmailCopied(false), 2000);
    });
  };

  const sendEmail = async () => {
    if (!aiEmailBooking?.clientEmail || !aiEmailContent) return;
    setAiEmailSending(true);
    try {
      const lines = aiEmailContent.split("\n");
      const subjectLine = lines.find(l => l.startsWith("الموضوع:") || l.startsWith("Subject:"));
      const subject = subjectLine
        ? subjectLine.replace(/^(الموضوع:|Subject:)\s*/i, "").trim()
        : (L ? `استشارة QIROX Studio — ${aiEmailBooking.clientName}` : `QIROX Studio Consultation — ${aiEmailBooking.clientName}`);
      const body = lines.filter(l => !l.startsWith("الموضوع:") && !l.startsWith("Subject:")).join("\n").trim();

      const r = await fetch("/api/admin/send-email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: aiEmailBooking.clientEmail,
          toName: aiEmailBooking.clientName,
          subject,
          body,
        }),
      });
      const data = await r.json();
      if (data.ok || data.success) {
        toast({ title: L ? "تم إرسال البريد بنجاح ✓" : "Email sent successfully ✓" });
        setAiEmailBooking(null);
      } else {
        toast({ title: data.error || (L ? "فشل الإرسال" : "Send failed"), variant: "destructive" });
      }
    } catch {
      toast({ title: L ? "خطأ في إرسال البريد" : "Email send error", variant: "destructive" });
    }
    setAiEmailSending(false);
  };

  const createReminderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/switch-reminders", data);
      return res.json();
    },
    onSuccess: () => {
      setReminderBooking(null);
      setReminderForm({ currentProvider: "", serviceType: "", subscriptionEndDate: "", notes: "" });
      toast({ title: L ? "تم جدولة التذكير بنجاح" : "Reminder scheduled successfully", description: L ? "سيظهر في صفحة تذكيرات التحول" : "It will appear on the switch reminders page" });
    },
    onError: (e: any) => toast({ title: e.message || (L ? "فشل إنشاء التذكير" : "Failed to create reminder"), variant: "destructive" }),
  });

  const handleCreateReminder = () => {
    if (!reminderForm.currentProvider.trim() || !reminderForm.subscriptionEndDate) {
      return toast({ title: L ? "اسم الشركة الحالية وتاريخ انتهاء الاشتراك مطلوبان" : "Company name and subscription end date are required", variant: "destructive" });
    }
    createReminderMutation.mutate({
      name: reminderBooking.clientName,
      phone: reminderBooking.clientPhone || "",
      email: reminderBooking.clientEmail || "",
      currentProvider: reminderForm.currentProvider,
      serviceType: reminderForm.serviceType,
      subscriptionEndDate: reminderForm.subscriptionEndDate,
      notes: reminderForm.notes,
    });
  };

  const { data: bookings, isLoading: bLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/consultation/bookings"],
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/consultation/bookings/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/consultation/bookings"] });
      setViewBooking(null);
      setAssignBooking(null);
      setRejectBooking(null);
      setAssignForm({ ...emptyAssign });
      setRejectNotes("");
      toast({ title: L ? "تم تحديث الطلب بنجاح" : "Request updated successfully" });
    },
    onError: (e: any) => toast({ title: e.message || (L ? "فشل التحديث" : "Update failed"), variant: "destructive" }),
  });

  const openAssign = (b: any) => {
    setAssignBooking(b);
    setAssignForm({
      date: b.date ? new Date(b.date).toISOString().split("T")[0] : "",
      startTime: b.startTime || "10:00",
      endTime: b.endTime || "11:00",
      employeeName: b.employeeName || "",
      meetingLink: b.meetingLink || "",
      adminNotes: b.adminNotes || "",
      consultationType: b.consultationType || "phone",
    });
  };

  const handleAssign = () => {
    if (!assignForm.date || !assignForm.startTime || !assignForm.endTime) {
      return toast({ title: L ? "يرجى تحديد التاريخ والوقت" : "Please set the date and time", variant: "destructive" });
    }
    updateBookingMutation.mutate({
      id: assignBooking.id || assignBooking._id,
      data: {
        date: assignForm.date,
        startTime: assignForm.startTime,
        endTime: assignForm.endTime,
        employeeName: assignForm.employeeName || undefined,
        meetingLink: assignForm.meetingLink || undefined,
        adminNotes: assignForm.adminNotes || undefined,
        consultationType: assignForm.consultationType || undefined,
        status: "confirmed",
      },
    });
  };

  const handleReject = () => {
    updateBookingMutation.mutate({
      id: rejectBooking.id || rejectBooking._id,
      data: { status: "rejected", adminNotes: rejectNotes || undefined },
    });
  };

  const handleComplete = (b: any) => {
    updateBookingMutation.mutate({ id: b.id || b._id, data: { status: "completed" } });
  };

  const filteredBookings = (bookings || []).filter((b: any) => {
    const matchSearch = !search
      || b.clientName?.includes(search) || b.clientName?.toLowerCase().includes(search.toLowerCase())
      || b.clientEmail?.includes(search)
      || b.topic?.includes(search);
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: bookings?.length || 0,
    pending: bookings?.filter((b: any) => b.status === "pending").length || 0,
    confirmed: bookings?.filter((b: any) => b.status === "confirmed").length || 0,
    completed: bookings?.filter((b: any) => b.status === "completed").length || 0,
  };

  return (
    <div dir={dir}>
      <PageGraphics variant="dashboard" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-black dark:text-white">{L ? "نظام الاستشارات" : "Consultation System"}</h1>
          <p className="text-sm text-black/40 dark:text-white/40 mt-1">{L ? "مراجعة طلبات الاستشارة وتحديد المواعيد" : "Review consultation requests and schedule appointments"}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: L ? "إجمالي الطلبات" : "Total Requests", value: stats.total,     icon: Calendar },
          { label: L ? "قيد الانتظار" : "Pending",           value: stats.pending,   icon: Clock },
          { label: L ? "مؤكدة" : "Confirmed",                value: stats.confirmed, icon: CheckCircle },
          { label: L ? "مكتملة" : "Completed",               value: stats.completed, icon: Users },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4">
            <div className="text-2xl font-black text-black dark:text-white">{s.value}</div>
            <div className="text-xs text-black/40 dark:text-white/40 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={L ? "بحث بالاسم أو البريد أو الموضوع..." : "Search by name, email or topic..."}
          className="max-w-xs rounded-xl" data-testid="input-search-bookings" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48 rounded-xl" data-testid="select-filter-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{L ? "جميع الحالات" : "All Statuses"}</SelectItem>
            {Object.entries(getBookingStatusConfig(L)).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bookings List */}
      {bLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-black/20" /></div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16 text-black/30 dark:text-white/30">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-70" />
          <p>{search || filterStatus !== "all" ? (L ? "لا توجد نتائج مطابقة" : "No matching results") : (L ? "لا توجد طلبات استشارة بعد" : "No consultation requests yet")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b: any) => {
            const bsc = getBookingStatusConfig(L);
            const tc0 = getTypeConfig(L);
            const sc = bsc[b.status] || bsc.pending;
            const tc = tc0[b.consultationType] || tc0.phone;
            const TIcon = tc.icon;
            return (
              <motion.div key={b.id || b._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4"
                data-testid={`booking-card-${b.id || b._id}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-sm text-black dark:text-white">{b.clientName}</span>
                      <Badge className={`text-[10px] px-2 py-0.5 border ${sc.color}`}>{sc.label}</Badge>
                      <span className="text-xs text-black/40 dark:text-white/40 flex items-center gap-1">
                        <TIcon className="w-3 h-3" />{tc.label}
                      </span>
                    </div>
                    <p className="text-xs text-black/40 dark:text-white/40">{b.clientEmail}{b.clientPhone ? ` · ${b.clientPhone}` : ""}</p>
                    {b.topic && (
                      <p className="text-xs text-black/60 dark:text-white/60 mt-1 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />{b.topic}
                      </p>
                    )}
                    {b.date && b.startTime && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-black/50 dark:text-white/50">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(b.date).toLocaleDateString(L ? "ar-SA" : "en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />{b.startTime} — {b.endTime}
                        </span>
                        {b.employeeName && (
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{b.employeeName}</span>
                        )}
                      </div>
                    )}
                    <p className="text-[10px] text-black/20 dark:text-white/20 mt-1">
                      {new Date(b.createdAt).toLocaleString(L ? "ar-SA" : "en-US")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {b.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => openAssign(b)}
                          className="bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs h-8 gap-1.5"
                          data-testid={`button-assign-${b.id || b._id}`}>
                          <CalendarClock className="w-3.5 h-3.5" />{L ? "تحديد موعد" : "Schedule"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setRejectBooking(b); setRejectNotes(""); }}
                          className="rounded-xl text-xs h-8 text-black dark:text-white border-black/10 dark:border-white/10 hover:bg-black/[0.04]"
                          data-testid={`button-reject-${b.id || b._id}`}>
                          <XCircle className="w-3.5 h-3.5" />{L ? "رفض" : "Reject"}
                        </Button>
                      </>
                    )}
                    {b.status === "confirmed" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => openAssign(b)}
                          className="rounded-xl text-xs h-8 gap-1 border-black/10"
                          data-testid={`button-edit-assign-${b.id || b._id}`}>
                          <CalendarClock className="w-3 h-3" />{L ? "تعديل الموعد" : "Edit Schedule"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleComplete(b)}
                          disabled={updateBookingMutation.isPending}
                          className="rounded-xl text-xs h-8 text-black dark:text-white border-black/10 dark:border-white/10 hover:bg-black/[0.04]"
                          data-testid={`button-complete-${b.id || b._id}`}>
                          <CheckCircle className="w-3 h-3" />{L ? "مكتمل" : "Complete"}
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setViewBooking(b)}
                      className="rounded-xl text-xs h-8 gap-1 border-black/10 dark:border-white/10"
                      data-testid={`button-view-${b.id || b._id}`}>
                      <Eye className="w-3 h-3" />{L ? "عرض" : "View"}
                    </Button>
                    {/* AI Email Writer button */}
                    <Button size="sm" variant="outline" onClick={() => openAiEmail(b)}
                      className="rounded-xl text-xs h-8 gap-1 border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-black/[0.04]"
                      data-testid={`button-ai-email-${b.id || b._id}`}>
                      <Sparkles className="w-3 h-3" />{L ? "بريد AI" : "AI Email"}
                    </Button>
                    <Button size="sm" variant="outline"
                      onClick={() => { setReminderBooking(b); setReminderForm({ currentProvider: "", serviceType: "", subscriptionEndDate: "", notes: "" }); }}
                      className="rounded-xl text-xs h-8 gap-1 border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-black/[0.04]"
                      data-testid={`button-reminder-${b.id || b._id}`}>
                      <Bell className="w-3 h-3" />{L ? "تذكير" : "Remind"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════
          AI EMAIL WRITER DIALOG
      ══════════════════════════════════════ */}
      <Dialog open={!!aiEmailBooking} onOpenChange={v => !v && setAiEmailBooking(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 text-black dark:text-white">
              <Sparkles className="w-5 h-5" />
              {L ? "كاتب البريد الإلكتروني بالذكاء الاصطناعي" : "AI Email Writer"}
            </DialogTitle>
          </DialogHeader>
          {aiEmailBooking && (
            <div className="space-y-4">
              {/* Client Summary */}
              <div className="p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06]">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-bold text-sm text-black dark:text-white">{aiEmailBooking.clientName}</p>
                    <p className="text-xs text-black/50 dark:text-white/50 mt-0.5">
                      {aiEmailBooking.clientEmail && <span className="me-3">{aiEmailBooking.clientEmail}</span>}
                      {aiEmailBooking.clientPhone && <span>{aiEmailBooking.clientPhone}</span>}
                    </p>
                    {aiEmailBooking.topic && (
                      <p className="text-xs text-black/60 dark:text-white/60 mt-1">{aiEmailBooking.topic}</p>
                    )}
                  </div>
                  <Badge className="text-[10px] border border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white">
                    {getBookingStatusConfig(L)[aiEmailBooking.status]?.label || aiEmailBooking.status}
                  </Badge>
                </div>
                {/* Context details */}
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-black/50 dark:text-white/50">
                  {aiEmailBooking.date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(aiEmailBooking.date).toLocaleDateString(L ? "ar-SA" : "en-US", { weekday: "short", month: "short", day: "numeric" })}
                      {aiEmailBooking.startTime && ` ${aiEmailBooking.startTime}`}
                    </span>
                  )}
                  {aiEmailBooking.consultationType && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {getTypeConfig(L)[aiEmailBooking.consultationType]?.label || aiEmailBooking.consultationType}
                    </span>
                  )}
                  {aiEmailBooking.employeeName && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />{aiEmailBooking.employeeName}
                    </span>
                  )}
                </div>
                {aiEmailBooking.notes && (
                  <div className="mt-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                    <p className="text-[10px] text-black/40 dark:text-white/40 mb-1">{L ? "ملاحظات العميل:" : "Client notes:"}</p>
                    <p className="text-xs text-black/60 dark:text-white/60 leading-relaxed line-clamp-3">{aiEmailBooking.notes}</p>
                  </div>
                )}
              </div>

              {/* Email Type Selector */}
              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-2 block">
                  {L ? "نوع البريد الإلكتروني" : "Email Type"}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AI_EMAIL_TYPES.map(t => (
                    <button
                      key={t.key}
                      onClick={() => { setAiEmailType(t.key); setAiEmailContent(""); }}
                      className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all text-start ${
                        aiEmailType === t.key
                          ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black"
                          : "border-black/10 dark:border-white/10 text-black dark:text-white hover:border-black/25 dark:hover:border-white/25 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                      }`}
                      data-testid={`ai-email-type-${t.key}`}
                    >
                      {L ? t.labelAr : t.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={generateAiEmail}
                disabled={aiEmailGenerating}
                className="w-full h-11 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold gap-2"
                data-testid="button-generate-ai-email"
              >
                {aiEmailGenerating
                  ? <><Loader2 className="w-4 h-4 animate-spin" />{L ? "الذكاء الاصطناعي يكتب البريد…" : "AI is writing the email…"}</>
                  : aiEmailContent
                    ? <><RefreshCw className="w-4 h-4" />{L ? "إعادة التوليد" : "Regenerate"}</>
                    : <><Sparkles className="w-4 h-4" />{L ? "توليد البريد بالذكاء الاصطناعي" : "Generate Email with AI"}</>
                }
              </Button>

              {/* AI Generating skeleton */}
              {aiEmailGenerating && (
                <div className="space-y-2 animate-pulse">
                  {[100, 90, 95, 80, 88, 70, 85].map((w, i) => (
                    <div key={i} className="h-3 rounded-full bg-black/[0.07] dark:bg-white/[0.07]" style={{ width: `${w}%` }} />
                  ))}
                </div>
              )}

              {/* Generated Email Preview/Editor */}
              {aiEmailContent && !aiEmailGenerating && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-black/60 dark:text-white/60">
                      {L ? "البريد المُولَّد — يمكنك التعديل قبل الإرسال" : "Generated Email — edit before sending"}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={copyEmail}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-black/10 dark:border-white/10 text-[11px] font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition"
                        data-testid="button-copy-email"
                      >
                        {aiEmailCopied
                          ? <><Check className="w-3 h-3 text-emerald-500" />{L ? "تم النسخ" : "Copied"}</>
                          : <><Copy className="w-3 h-3" />{L ? "نسخ" : "Copy"}</>
                        }
                      </button>
                    </div>
                  </div>
                  <Textarea
                    value={aiEmailContent}
                    onChange={e => setAiEmailContent(e.target.value)}
                    className="min-h-[280px] text-xs font-mono bg-black/[0.02] dark:bg-white/[0.03] border-black/10 dark:border-white/10 rounded-xl resize-none leading-relaxed"
                    dir="rtl"
                    data-testid="textarea-ai-email-content"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setAiEmailBooking(null)} className="flex-1 rounded-xl">
                  {L ? "إغلاق" : "Close"}
                </Button>
                {aiEmailContent && aiEmailBooking?.clientEmail && (
                  <Button
                    onClick={sendEmail}
                    disabled={aiEmailSending || !aiEmailContent}
                    className="flex-1 bg-black dark:bg-white text-white dark:text-black rounded-xl gap-2 font-bold"
                    data-testid="button-send-ai-email"
                  >
                    {aiEmailSending
                      ? <><Loader2 className="w-4 h-4 animate-spin" />{L ? "جارٍ الإرسال…" : "Sending…"}</>
                      : <><Send className="w-4 h-4" />{L ? `إرسال إلى ${aiEmailBooking.clientEmail}` : `Send to ${aiEmailBooking.clientEmail}`}</>
                    }
                  </Button>
                )}
                {aiEmailContent && !aiEmailBooking?.clientEmail && (
                  <p className="text-xs text-black/40 dark:text-white/40 flex items-center gap-1 flex-1">
                    <Mail className="w-3 h-3" />
                    {L ? "لا يوجد بريد إلكتروني للعميل — انسخ البريد يدوياً" : "No client email — copy manually"}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Appointment Dialog */}
      <Dialog open={!!assignBooking} onOpenChange={v => !v && setAssignBooking(null)}>
        <DialogContent className="max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <CalendarClock className="w-5 h-5" />
              {assignBooking?.status === "confirmed" ? (L ? "تعديل الموعد" : "Edit Appointment") : (L ? "تحديد الموعد" : "Schedule Appointment")}
            </DialogTitle>
          </DialogHeader>
          {assignBooking && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-sm">
                <p className="font-bold text-black dark:text-white">{assignBooking.clientName}</p>
                <p className="text-xs text-black/40 dark:text-white/40">{assignBooking.clientEmail}</p>
                {assignBooking.topic && <p className="text-xs text-black/60 dark:text-white/60 mt-1">{L ? "الموضوع:" : "Topic:"} {assignBooking.topic}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">{L ? "التاريخ *" : "Date *"}</label>
                <Input type="date" value={assignForm.date} onChange={e => setAssignForm(f => ({ ...f, date: e.target.value }))}
                  min={new Date().toISOString().split("T")[0]}
                  className="rounded-xl border-black/10 dark:border-white/10" data-testid="input-assign-date" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">{L ? "وقت البداية *" : "Start Time *"}</label>
                  <Input type="time" value={assignForm.startTime} onChange={e => setAssignForm(f => ({ ...f, startTime: e.target.value }))}
                    className="rounded-xl border-black/10 dark:border-white/10" data-testid="input-assign-start" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">{L ? "وقت النهاية *" : "End Time *"}</label>
                  <Input type="time" value={assignForm.endTime} onChange={e => setAssignForm(f => ({ ...f, endTime: e.target.value }))}
                    className="rounded-xl border-black/10 dark:border-white/10" data-testid="input-assign-end" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">{L ? "نوع الجلسة" : "Session Type"}</label>
                <Select value={assignForm.consultationType || "phone"} onValueChange={v => setAssignForm(f => ({ ...f, consultationType: v }))}>
                  <SelectTrigger className="rounded-xl border-black/10 dark:border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone"><span className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{L ? "هاتف" : "Phone"}</span></SelectItem>
                    <SelectItem value="video"><span className="flex items-center gap-2"><Video className="w-3.5 h-3.5" />{L ? "فيديو" : "Video"}</span></SelectItem>
                    <SelectItem value="in_person"><span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />{L ? "حضوري" : "In-Person"}</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">{L ? "اسم المستشار (اختياري)" : "Consultant Name (optional)"}</label>
                <Input value={assignForm.employeeName} onChange={e => setAssignForm(f => ({ ...f, employeeName: e.target.value }))}
                  placeholder={L ? "اسم الموظف المسؤول عن الاستشارة" : "Employee responsible for the consultation"}
                  className="rounded-xl border-black/10 dark:border-white/10" data-testid="input-assign-employee" />
              </div>

              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">{L ? "رابط الاجتماع (اختياري)" : "Meeting Link (optional)"}</label>
                <Input value={assignForm.meetingLink} onChange={e => setAssignForm(f => ({ ...f, meetingLink: e.target.value }))}
                  placeholder="https://meet.google.com/..." dir="ltr"
                  className="rounded-xl border-black/10 dark:border-white/10" data-testid="input-assign-link" />
              </div>

              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">{L ? "ملاحظات للعميل (اختياري)" : "Notes for Client (optional)"}</label>
                <Textarea value={assignForm.adminNotes} onChange={e => setAssignForm(f => ({ ...f, adminNotes: e.target.value }))}
                  placeholder={L ? "أي تعليمات أو معلومات تود إرسالها للعميل..." : "Any instructions or information for the client..."}
                  className="rounded-xl border-black/10 dark:border-white/10 resize-none" rows={2}
                  data-testid="input-assign-notes" />
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setAssignBooking(null)} className="flex-1 rounded-xl">{L ? "إلغاء" : "Cancel"}</Button>
                <Button onClick={handleAssign} disabled={updateBookingMutation.isPending}
                  className="flex-1 bg-black dark:bg-white text-white dark:text-black rounded-xl gap-2"
                  data-testid="button-confirm-assign">
                  {updateBookingMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><CheckCircle className="w-4 h-4" />{L ? "تأكيد الموعد" : "Confirm Appointment"}</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectBooking} onOpenChange={v => !v && setRejectBooking(null)}>
        <DialogContent className="max-w-sm" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 text-black dark:text-white">
              <XCircle className="w-5 h-5" />{L ? "رفض طلب الاستشارة" : "Reject Consultation Request"}
            </DialogTitle>
          </DialogHeader>
          {rejectBooking && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10">
                <p className="font-bold text-sm text-black dark:text-white">{rejectBooking.clientName}</p>
                <p className="text-xs text-black/40 dark:text-white/40">{rejectBooking.clientEmail}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">{L ? "سبب الرفض (اختياري)" : "Rejection Reason (optional)"}</label>
                <Textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)}
                  placeholder={L ? "يمكنك إخبار العميل بسبب الرفض..." : "You can inform the client about the reason..."}
                  className="rounded-xl border-black/10 dark:border-white/10 resize-none" rows={3}
                  data-testid="input-reject-notes" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setRejectBooking(null)} className="flex-1 rounded-xl">{L ? "إلغاء" : "Cancel"}</Button>
                <Button onClick={handleReject} disabled={updateBookingMutation.isPending}
                  className="flex-1 bg-black dark:bg-white text-white dark:text-black rounded-xl gap-1.5"
                  data-testid="button-confirm-reject">
                  {updateBookingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4" />{L ? "تأكيد الرفض" : "Confirm Rejection"}</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Switch Reminder Dialog */}
      <Dialog open={!!reminderBooking} onOpenChange={v => !v && setReminderBooking(null)}>
        <DialogContent className="max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <Bell className="w-5 h-5 text-black dark:text-white" />
              {L ? "جدولة تذكير تحوّل للعميل" : "Schedule Client Switch Reminder"}
            </DialogTitle>
          </DialogHeader>
          {reminderBooking && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 text-sm">
                <p className="font-bold text-black dark:text-white">{reminderBooking.clientName}</p>
                <p className="text-xs text-black/40 dark:text-white/40">{reminderBooking.clientEmail}{reminderBooking.clientPhone ? ` · ${reminderBooking.clientPhone}` : ""}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">
                  {L ? "الشركة / النظام الحالي" : "Current Company / System"} <span className="text-black/70 dark:text-white/70">*</span>
                </label>
                <Input
                  value={reminderForm.currentProvider}
                  onChange={e => setReminderForm(f => ({ ...f, currentProvider: e.target.value }))}
                  placeholder={L ? "مثال: زد، سلة، ودّ، شركة X" : "e.g. Zid, Salla, Company X"}
                  className="rounded-xl border-black/10 dark:border-white/10"
                  data-testid="input-reminder-provider"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">{L ? "نوع الخدمة" : "Service Type"}</label>
                <Select value={reminderForm.serviceType || ""} onValueChange={v => setReminderForm(f => ({ ...f, serviceType: v }))}>
                  <SelectTrigger className="rounded-xl border-black/10 dark:border-white/10">
                    <SelectValue placeholder={L ? "اختر نوع الخدمة" : "Select service type"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">{L ? "موقع إلكتروني" : "Website"}</SelectItem>
                    <SelectItem value="ecommerce">{L ? "متجر إلكتروني" : "E-Commerce"}</SelectItem>
                    <SelectItem value="app">{L ? "تطبيق جوال" : "Mobile App"}</SelectItem>
                    <SelectItem value="erp">{L ? "ERP / إدارة" : "ERP / Management"}</SelectItem>
                    <SelectItem value="pos">{L ? "نقطة بيع" : "POS"}</SelectItem>
                    <SelectItem value="crm">CRM</SelectItem>
                    <SelectItem value="design">{L ? "تصميم وهوية" : "Design & Branding"}</SelectItem>
                    <SelectItem value="marketing">{L ? "تسويق رقمي" : "Digital Marketing"}</SelectItem>
                    <SelectItem value="hosting">{L ? "استضافة" : "Hosting"}</SelectItem>
                    <SelectItem value="other">{L ? "أخرى" : "Other"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">
                  {L ? "تاريخ انتهاء اشتراكه الحالي" : "Current Subscription End Date"} <span className="text-black/70 dark:text-white/70">*</span>
                </label>
                <Input
                  type="date"
                  value={reminderForm.subscriptionEndDate}
                  onChange={e => setReminderForm(f => ({ ...f, subscriptionEndDate: e.target.value }))}
                  className="rounded-xl border-black/10 dark:border-white/10"
                  data-testid="input-reminder-end-date"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">{L ? "ملاحظات (اختياري)" : "Notes (optional)"}</label>
                <Textarea
                  value={reminderForm.notes}
                  onChange={e => setReminderForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder={L ? "معلومات إضافية أو سبب الاستشارة..." : "Additional information or consultation reason..."}
                  className="rounded-xl border-black/10 dark:border-white/10 resize-none"
                  rows={2}
                  data-testid="input-reminder-notes"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setReminderBooking(null)} className="flex-1 rounded-xl">{L ? "إلغاء" : "Cancel"}</Button>
                <Button onClick={handleCreateReminder} disabled={createReminderMutation.isPending}
                  className="flex-1 bg-black dark:bg-white text-white dark:text-black rounded-xl gap-1.5"
                  data-testid="button-confirm-reminder">
                  {createReminderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Bell className="w-4 h-4" />{L ? "جدولة التذكير" : "Schedule Reminder"}</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewBooking} onOpenChange={v => !v && setViewBooking(null)}>
        <DialogContent className="max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-right">{L ? "تفاصيل طلب الاستشارة" : "Consultation Request Details"}</DialogTitle>
          </DialogHeader>
          {viewBooking && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  [L ? "العميل" : "Client",         viewBooking.clientName],
                  [L ? "البريد" : "Email",          viewBooking.clientEmail || "—"],
                  [L ? "الهاتف" : "Phone",          viewBooking.clientPhone || "—"],
                  [L ? "النوع المفضل" : "Preferred", getTypeConfig(L)[viewBooking.consultationType]?.label || viewBooking.consultationType],
                  [L ? "الموضوع" : "Topic",         viewBooking.topic || "—"],
                  [L ? "تاريخ الطلب" : "Request Date", new Date(viewBooking.createdAt).toLocaleDateString(L ? "ar-SA" : "en-US")],
                  ...(viewBooking.date ? [
                    [L ? "الموعد المحدد" : "Scheduled", `${new Date(viewBooking.date).toLocaleDateString(L ? "ar-SA" : "en-US", { weekday: "short", month: "short", day: "numeric" })}`],
                    [L ? "الوقت" : "Time", `${viewBooking.startTime} — ${viewBooking.endTime}`],
                  ] : []),
                  ...(viewBooking.employeeName ? [[L ? "المستشار" : "Consultant", viewBooking.employeeName]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="bg-black/[0.03] dark:bg-white/[0.04] rounded-xl p-3">
                    <p className="text-[10px] text-black/40 dark:text-white/40 mb-0.5">{k}</p>
                    <p className="font-medium text-black dark:text-white text-xs truncate">{v}</p>
                  </div>
                ))}
              </div>
              {viewBooking.notes && (
                <div className="bg-black/[0.03] dark:bg-white/[0.04] rounded-xl p-3">
                  <p className="text-[10px] text-black/40 dark:text-white/40 mb-0.5">{L ? "ملاحظات العميل" : "Client Notes"}</p>
                  <p className="text-xs text-black dark:text-white leading-relaxed">{viewBooking.notes}</p>
                </div>
              )}
              {viewBooking.adminNotes && (
                <div className="bg-black/[0.03] dark:bg-white/[0.04] rounded-xl p-3">
                  <p className="text-[10px] text-black/40 dark:text-white/40 mb-0.5">{L ? "ملاحظات الإدارة" : "Admin Notes"}</p>
                  <p className="text-xs text-black dark:text-white leading-relaxed">{viewBooking.adminNotes}</p>
                </div>
              )}
              {viewBooking.meetingLink && (
                <a href={viewBooking.meetingLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-black dark:text-white hover:underline px-1">
                  <Video className="w-3.5 h-3.5" />{L ? "رابط الاجتماع" : "Meeting Link"}
                </a>
              )}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setViewBooking(null)} className="flex-1 rounded-xl">{L ? "إغلاق" : "Close"}</Button>
                <Button variant="outline" onClick={() => { setViewBooking(null); openAiEmail(viewBooking); }}
                  className="flex-1 rounded-xl gap-1.5 text-xs border-black/10 dark:border-white/10"
                  data-testid="button-view-ai-email">
                  <Sparkles className="w-3.5 h-3.5" />{L ? "كتابة بريد AI" : "AI Email"}
                </Button>
                {viewBooking.status === "pending" && (
                  <Button onClick={() => { setViewBooking(null); openAssign(viewBooking); }}
                    className="flex-1 bg-black dark:bg-white text-white dark:text-black rounded-xl gap-1.5 text-xs">
                    <CalendarClock className="w-4 h-4" />{L ? "تحديد الموعد" : "Schedule"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
