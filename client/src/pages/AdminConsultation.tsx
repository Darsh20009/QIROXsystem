import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Calendar, Clock, CheckCircle, XCircle, Eye, Video, Phone, MapPin, Users, CalendarClock, AlertCircle, MessageSquare, Bell } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useUser } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useI18n } from "@/lib/i18n";

const bookingStatusConfig: Record<string, { label: string; color: string }> = {
  pending:   { label: "في انتظار تحديد الموعد", color: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "تم تأكيد الموعد",        color: "bg-green-50 text-green-700 border-green-200" },
  rejected:  { label: "مرفوض",                  color: "bg-red-50 text-red-700 border-red-200" },
  cancelled: { label: "ملغي",                    color: "bg-gray-50 text-gray-600 border-gray-200" },
  completed: { label: "مكتمل",                   color: "bg-blue-50 text-blue-700 border-blue-200" },
};

const typeConfig: Record<string, { label: string; icon: any }> = {
  video:     { label: "فيديو",    icon: Video },
  phone:     { label: "هاتف",     icon: Phone },
  in_person: { label: "حضوري",   icon: MapPin },
  any:       { label: "أي نوع",  icon: Calendar },
};

const emptyAssign = {
  date: "", startTime: "10:00", endTime: "11:00",
  employeeName: "", meetingLink: "", adminNotes: "",
  consultationType: "",
};

export default function AdminConsultation() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const { dir } = useI18n();

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

  const createReminderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/switch-reminders", data);
      return res.json();
    },
    onSuccess: () => {
      setReminderBooking(null);
      setReminderForm({ currentProvider: "", serviceType: "", subscriptionEndDate: "", notes: "" });
      toast({ title: "تم جدولة التذكير بنجاح", description: "سيظهر في صفحة تذكيرات التحول" });
    },
    onError: (e: any) => toast({ title: e.message || "فشل إنشاء التذكير", variant: "destructive" }),
  });

  const handleCreateReminder = () => {
    if (!reminderForm.currentProvider.trim() || !reminderForm.subscriptionEndDate) {
      return toast({ title: "اسم الشركة الحالية وتاريخ انتهاء الاشتراك مطلوبان", variant: "destructive" });
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
      toast({ title: "تم تحديث الطلب بنجاح" });
    },
    onError: (e: any) => toast({ title: e.message || "فشل التحديث", variant: "destructive" }),
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
      return toast({ title: "يرجى تحديد التاريخ والوقت", variant: "destructive" });
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
          <h1 className="text-xl md:text-2xl font-black text-black dark:text-white">نظام الاستشارات</h1>
          <p className="text-sm text-black/40 dark:text-white/40 mt-1">مراجعة طلبات الاستشارة وتحديد المواعيد</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "إجمالي الطلبات", value: stats.total,     icon: Calendar,     color: "text-black dark:text-white" },
          { label: "قيد الانتظار",   value: stats.pending,   icon: Clock,        color: "text-amber-600" },
          { label: "مؤكدة",          value: stats.confirmed, icon: CheckCircle,  color: "text-green-600" },
          { label: "مكتملة",         value: stats.completed, icon: Users,        color: "text-blue-600" },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-4">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-black/40 dark:text-white/40 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو البريد أو الموضوع..."
          className="max-w-xs rounded-xl" data-testid="input-search-bookings" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48 rounded-xl" data-testid="select-filter-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            {Object.entries(bookingStatusConfig).map(([k, v]) => (
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
          <p>{search || filterStatus !== "all" ? "لا توجد نتائج مطابقة" : "لا توجد طلبات استشارة بعد"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b: any) => {
            const sc = bookingStatusConfig[b.status] || bookingStatusConfig.pending;
            const tc = typeConfig[b.consultationType] || typeConfig.phone;
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
                    {/* Appointment if confirmed */}
                    {b.date && b.startTime && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-black/50 dark:text-white/50">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(b.date).toLocaleDateString("ar-SA", { weekday: "short", month: "short", day: "numeric" })}
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
                      {new Date(b.createdAt).toLocaleString("ar-SA")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {b.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => openAssign(b)}
                          className="bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs h-8 gap-1.5"
                          data-testid={`button-assign-${b.id || b._id}`}>
                          <CalendarClock className="w-3.5 h-3.5" />تحديد موعد
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setRejectBooking(b); setRejectNotes(""); }}
                          className="rounded-xl text-xs h-8 text-red-500 border-red-200 hover:bg-red-50"
                          data-testid={`button-reject-${b.id || b._id}`}>
                          <XCircle className="w-3.5 h-3.5" />رفض
                        </Button>
                      </>
                    )}
                    {b.status === "confirmed" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => openAssign(b)}
                          className="rounded-xl text-xs h-8 gap-1 border-black/10"
                          data-testid={`button-edit-assign-${b.id || b._id}`}>
                          <CalendarClock className="w-3 h-3" />تعديل الموعد
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleComplete(b)}
                          disabled={updateBookingMutation.isPending}
                          className="rounded-xl text-xs h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                          data-testid={`button-complete-${b.id || b._id}`}>
                          <CheckCircle className="w-3 h-3" />مكتمل
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setViewBooking(b)}
                      className="rounded-xl text-xs h-8 gap-1 border-black/10 dark:border-white/10"
                      data-testid={`button-view-${b.id || b._id}`}>
                      <Eye className="w-3 h-3" />عرض
                    </Button>
                    <Button size="sm" variant="outline"
                      onClick={() => { setReminderBooking(b); setReminderForm({ currentProvider: "", serviceType: "", subscriptionEndDate: "", notes: "" }); }}
                      className="rounded-xl text-xs h-8 gap-1 border-amber-200 text-amber-600 hover:bg-amber-50"
                      data-testid={`button-reminder-${b.id || b._id}`}>
                      <Bell className="w-3 h-3" />تذكير
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Assign Appointment Dialog */}
      <Dialog open={!!assignBooking} onOpenChange={v => !v && setAssignBooking(null)}>
        <DialogContent className="max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <CalendarClock className="w-5 h-5" />
              {assignBooking?.status === "confirmed" ? "تعديل الموعد" : "تحديد الموعد"}
            </DialogTitle>
          </DialogHeader>
          {assignBooking && (
            <div className="space-y-4">
              {/* Client Info Summary */}
              <div className="p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-sm">
                <p className="font-bold text-black dark:text-white">{assignBooking.clientName}</p>
                <p className="text-xs text-black/40 dark:text-white/40">{assignBooking.clientEmail}</p>
                {assignBooking.topic && <p className="text-xs text-black/60 dark:text-white/60 mt-1">الموضوع: {assignBooking.topic}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">التاريخ *</label>
                <Input type="date" value={assignForm.date} onChange={e => setAssignForm(f => ({ ...f, date: e.target.value }))}
                  min={new Date().toISOString().split("T")[0]}
                  className="rounded-xl border-black/10 dark:border-white/10" data-testid="input-assign-date" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">وقت البداية *</label>
                  <Input type="time" value={assignForm.startTime} onChange={e => setAssignForm(f => ({ ...f, startTime: e.target.value }))}
                    className="rounded-xl border-black/10 dark:border-white/10" data-testid="input-assign-start" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">وقت النهاية *</label>
                  <Input type="time" value={assignForm.endTime} onChange={e => setAssignForm(f => ({ ...f, endTime: e.target.value }))}
                    className="rounded-xl border-black/10 dark:border-white/10" data-testid="input-assign-end" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">نوع الجلسة</label>
                <Select value={assignForm.consultationType || "phone"} onValueChange={v => setAssignForm(f => ({ ...f, consultationType: v }))}>
                  <SelectTrigger className="rounded-xl border-black/10 dark:border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone"><span className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />هاتف</span></SelectItem>
                    <SelectItem value="video"><span className="flex items-center gap-2"><Video className="w-3.5 h-3.5" />فيديو</span></SelectItem>
                    <SelectItem value="in_person"><span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />حضوري</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">اسم المستشار (اختياري)</label>
                <Input value={assignForm.employeeName} onChange={e => setAssignForm(f => ({ ...f, employeeName: e.target.value }))}
                  placeholder="اسم الموظف المسؤول عن الاستشارة"
                  className="rounded-xl border-black/10 dark:border-white/10" data-testid="input-assign-employee" />
              </div>

              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">رابط الاجتماع (اختياري)</label>
                <Input value={assignForm.meetingLink} onChange={e => setAssignForm(f => ({ ...f, meetingLink: e.target.value }))}
                  placeholder="https://meet.google.com/..." dir="ltr"
                  className="rounded-xl border-black/10 dark:border-white/10" data-testid="input-assign-link" />
              </div>

              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">ملاحظات للعميل (اختياري)</label>
                <Textarea value={assignForm.adminNotes} onChange={e => setAssignForm(f => ({ ...f, adminNotes: e.target.value }))}
                  placeholder="أي تعليمات أو معلومات تود إرسالها للعميل..."
                  className="rounded-xl border-black/10 dark:border-white/10 resize-none" rows={2}
                  data-testid="input-assign-notes" />
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setAssignBooking(null)} className="flex-1 rounded-xl">إلغاء</Button>
                <Button onClick={handleAssign} disabled={updateBookingMutation.isPending}
                  className="flex-1 bg-black dark:bg-white text-white dark:text-black rounded-xl gap-2"
                  data-testid="button-confirm-assign">
                  {updateBookingMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><CheckCircle className="w-4 h-4" />تأكيد الموعد</>}
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
            <DialogTitle className="text-right flex items-center gap-2 text-red-500">
              <XCircle className="w-5 h-5" />رفض طلب الاستشارة
            </DialogTitle>
          </DialogHeader>
          {rejectBooking && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                <p className="font-bold text-sm text-black dark:text-white">{rejectBooking.clientName}</p>
                <p className="text-xs text-black/40 dark:text-white/40">{rejectBooking.clientEmail}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">سبب الرفض (اختياري)</label>
                <Textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)}
                  placeholder="يمكنك إخبار العميل بسبب الرفض..."
                  className="rounded-xl border-black/10 dark:border-white/10 resize-none" rows={3}
                  data-testid="input-reject-notes" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setRejectBooking(null)} className="flex-1 rounded-xl">إلغاء</Button>
                <Button onClick={handleReject} disabled={updateBookingMutation.isPending}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl gap-1.5"
                  data-testid="button-confirm-reject">
                  {updateBookingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4" />تأكيد الرفض</>}
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
              <Bell className="w-5 h-5 text-amber-500" />
              جدولة تذكير تحوّل للعميل
            </DialogTitle>
          </DialogHeader>
          {reminderBooking && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-sm">
                <p className="font-bold text-black dark:text-white">{reminderBooking.clientName}</p>
                <p className="text-xs text-black/40 dark:text-white/40">{reminderBooking.clientEmail}{reminderBooking.clientPhone ? ` · ${reminderBooking.clientPhone}` : ""}</p>
                <p className="text-[11px] text-amber-600 mt-1">سيُضاف هذا العميل في قائمة تذكيرات التحول تلقائياً</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">
                  الشركة / النظام الحالي <span className="text-red-400">*</span>
                </label>
                <Input
                  value={reminderForm.currentProvider}
                  onChange={e => setReminderForm(f => ({ ...f, currentProvider: e.target.value }))}
                  placeholder="مثال: زد، سلة، ودّ، شركة X"
                  className="rounded-xl border-black/10 dark:border-white/10"
                  data-testid="input-reminder-provider"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">نوع الخدمة</label>
                <Select value={reminderForm.serviceType || ""} onValueChange={v => setReminderForm(f => ({ ...f, serviceType: v }))}>
                  <SelectTrigger className="rounded-xl border-black/10 dark:border-white/10">
                    <SelectValue placeholder="اختر نوع الخدمة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">موقع إلكتروني</SelectItem>
                    <SelectItem value="ecommerce">متجر إلكتروني</SelectItem>
                    <SelectItem value="app">تطبيق جوال</SelectItem>
                    <SelectItem value="erp">ERP / إدارة</SelectItem>
                    <SelectItem value="pos">نقطة بيع</SelectItem>
                    <SelectItem value="crm">CRM</SelectItem>
                    <SelectItem value="design">تصميم وهوية</SelectItem>
                    <SelectItem value="marketing">تسويق رقمي</SelectItem>
                    <SelectItem value="hosting">استضافة</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">
                  تاريخ انتهاء اشتراكه الحالي <span className="text-red-400">*</span>
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
                <label className="text-xs font-semibold text-black/60 dark:text-white/60 mb-1 block">ملاحظات (اختياري)</label>
                <Textarea
                  value={reminderForm.notes}
                  onChange={e => setReminderForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="معلومات إضافية أو سبب الاستشارة..."
                  className="rounded-xl border-black/10 dark:border-white/10 resize-none"
                  rows={2}
                  data-testid="input-reminder-notes"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setReminderBooking(null)} className="flex-1 rounded-xl">إلغاء</Button>
                <Button
                  onClick={handleCreateReminder}
                  disabled={createReminderMutation.isPending}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl gap-2"
                  data-testid="button-confirm-reminder"
                >
                  {createReminderMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><Bell className="w-4 h-4" />جدولة التذكير</>}
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
            <DialogTitle className="text-right">تفاصيل طلب الاستشارة</DialogTitle>
          </DialogHeader>
          {viewBooking && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["العميل",         viewBooking.clientName],
                  ["البريد",         viewBooking.clientEmail],
                  ["الهاتف",         viewBooking.clientPhone || "—"],
                  ["النوع المفضل",   typeConfig[viewBooking.consultationType]?.label || viewBooking.consultationType],
                  ["الموضوع",        viewBooking.topic || "—"],
                  ["تاريخ الطلب",    new Date(viewBooking.createdAt).toLocaleDateString("ar-SA")],
                  ...(viewBooking.date ? [
                    ["الموعد المحدد", `${new Date(viewBooking.date).toLocaleDateString("ar-SA", { weekday: "short", month: "short", day: "numeric" })}`],
                    ["الوقت",         `${viewBooking.startTime} — ${viewBooking.endTime}`],
                  ] : []),
                  ...(viewBooking.employeeName ? [["المستشار", viewBooking.employeeName]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="bg-black/[0.03] dark:bg-white/[0.04] rounded-xl p-3">
                    <p className="text-[10px] text-black/40 dark:text-white/40 mb-0.5">{k}</p>
                    <p className="font-medium text-black dark:text-white text-xs truncate">{v}</p>
                  </div>
                ))}
              </div>
              {viewBooking.notes && (
                <div className="bg-black/[0.03] dark:bg-white/[0.04] rounded-xl p-3">
                  <p className="text-[10px] text-black/40 dark:text-white/40 mb-0.5">ملاحظات العميل</p>
                  <p className="text-xs text-black dark:text-white leading-relaxed">{viewBooking.notes}</p>
                </div>
              )}
              {viewBooking.adminNotes && (
                <div className="bg-black/[0.03] dark:bg-white/[0.04] rounded-xl p-3">
                  <p className="text-[10px] text-black/40 dark:text-white/40 mb-0.5">ملاحظات الإدارة</p>
                  <p className="text-xs text-black dark:text-white leading-relaxed">{viewBooking.adminNotes}</p>
                </div>
              )}
              {viewBooking.meetingLink && (
                <a href={viewBooking.meetingLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-blue-600 hover:underline px-1">
                  <Video className="w-3.5 h-3.5" />رابط الاجتماع
                </a>
              )}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setViewBooking(null)} className="flex-1 rounded-xl">إغلاق</Button>
                {viewBooking.status === "pending" && (
                  <Button onClick={() => { setViewBooking(null); openAssign(viewBooking); }}
                    className="flex-1 bg-black dark:bg-white text-white dark:text-black rounded-xl gap-1.5 text-xs">
                    <CalendarClock className="w-4 h-4" />تحديد الموعد
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
