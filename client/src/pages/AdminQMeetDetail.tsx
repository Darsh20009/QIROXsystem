import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Video, ArrowRight, Calendar, Clock, Users, Copy,
  Star, FileText, Plus, Trash2, Send, CheckCircle, Play, XCircle,
  User, MessageSquare, Clipboard
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

function getStatusMap(L: boolean): Record<string, { label: string; color: string }> { return {
  scheduled: { label: L ? "مجدول" : "Scheduled", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  live: { label: L ? "يبث الآن 🔴" : "Live Now 🔴", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  completed: { label: L ? "منتهي" : "Completed", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  cancelled: { label: L ? "ملغي" : "Cancelled", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
}; }

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className={`text-2xl transition-transform hover:scale-110 ${n <= value ? "text-amber-400" : "text-gray-300 dark:text-gray-600"}`}
          data-testid={`star-${n}`}>
          ★
        </button>
      ))}
    </div>
  );
}

export default function AdminQMeetDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { data: user } = useUser();
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const STATUS_MAP = getStatusMap(L);
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<"info" | "feedback" | "reports">("info");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [reportSummary, setReportSummary] = useState("");
  const [reportContent, setReportContent] = useState("");
  const [reportAction, setReportAction] = useState("");
  const [reportActions, setReportActions] = useState<string[]>([]);
  const [reportAttendeesCount, setReportAttendeesCount] = useState("");
  const [reportDuration, setReportDuration] = useState("");

  const { data: meeting, isLoading } = useQuery<any>({
    queryKey: ["/api/qmeet/meetings", id],
    queryFn: async () => {
      const r = await fetch(`/api/qmeet/meetings/${id}`);
      if (!r.ok) throw new Error(L ? "لم يتم العثور على الاجتماع" : "Meeting not found");
      return r.json();
    },
    enabled: !!id,
  });

  const { data: feedbacks, isLoading: feedbacksLoading } = useQuery<any[]>({
    queryKey: ["/api/qmeet/meetings", id, "feedback"],
    queryFn: async () => {
      const r = await fetch(`/api/qmeet/meetings/${id}/feedback`);
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!id,
  });

  const { data: reports, isLoading: reportsLoading } = useQuery<any[]>({
    queryKey: ["/api/qmeet/meetings", id, "reports"],
    queryFn: async () => {
      const r = await fetch(`/api/qmeet/meetings/${id}/reports`);
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!id,
  });

  const feedbackMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/qmeet/meetings/${id}/feedback`, {
      rating: feedbackRating,
      comment: feedbackComment,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/qmeet/meetings", id, "feedback"] });
      toast({ title: L ? "شكراً على تقييمك!" : "Thank you for your feedback!" });
      setFeedbackComment("");
    },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const reportMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/qmeet/meetings/${id}/reports`, {
      summary: reportSummary,
      content: reportContent,
      actionItems: reportActions,
      attendeesCount: parseInt(reportAttendeesCount) || 0,
      duration: parseInt(reportDuration) || 0,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/qmeet/meetings", id, "reports"] });
      toast({ title: L ? "تم رفع التقرير بنجاح" : "Report uploaded successfully" });
      setReportSummary(""); setReportContent(""); setReportActions([]); setReportAction(""); setReportAttendeesCount(""); setReportDuration("");
    },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/qmeet/meetings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/qmeet/meetings"] });
      toast({ title: L ? "تم حذف الاجتماع" : "Meeting deleted" });
      navigate("/admin/qmeet");
    },
    onError: () => toast({ title: L ? "خطأ" : "Error", description: L ? "تعذّر حذف الاجتماع" : "Could not delete the meeting", variant: "destructive" }),
  });

  const deleteReportMutation = useMutation({
    mutationFn: (rid: string) => apiRequest("DELETE", `/api/qmeet/reports/${rid}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/qmeet/meetings", id, "reports"] });
      toast({ title: L ? "تم حذف التقرير" : "Report deleted" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => apiRequest("PATCH", `/api/qmeet/meetings/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/qmeet/meetings", id] });
      qc.invalidateQueries({ queryKey: ["/api/qmeet/meetings"] });
    },
  });

  const sendInvitesMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/qmeet/meetings/${id}/send-invites`, {}),
    onSuccess: async (res: any) => {
      const data = await res.json().catch(() => ({}));
      toast({ title: `تم إرسال ${data.sent ?? 0} دعوة` });
    },
    onError: () => toast({ title: L ? "فشل إرسال الدعوات" : "Failed to send invites", variant: "destructive" }),
  });

  function copyLink() {
    if (!meeting) return;
    const link = meeting.meetingLink.startsWith("http") ? meeting.meetingLink : `${window.location.origin}${meeting.meetingLink}`;
    navigator.clipboard.writeText(link);
    toast({ title: L ? "تم نسخ الرابط" : "Link copied" });
  }

  function addActionItem() {
    const v = reportAction.trim();
    if (!v) return;
    setReportActions(a => [...a, v]);
    setReportAction("");
  }

  const isManagement = user && ["admin", "manager"].includes(user.role);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6" dir="rtl">
        <Skeleton className="h-10 w-40 mb-6" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{L ? "الاجتماع غير موجود" : "Meeting not found"}</p>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[meeting.status] || STATUS_MAP.scheduled;
  const avgRating = feedbacks && feedbacks.length
    ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6" dir="rtl">
      {/* Back */}
      <button onClick={() => navigate("/admin/qmeet")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-black dark:hover:text-white mb-4 transition-colors"
        data-testid="button-back">
        <ArrowRight className="w-4 h-4" />
        العودة للاجتماعات
      </button>

      {/* Header Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 mb-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className="w-9 h-9 rounded-xl bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                <Video className="w-4 h-4 text-white dark:text-black" />
              </div>
              <h1 className="text-xl font-black text-black dark:text-white">{meeting.title}</h1>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            {meeting.description && (
              <p className="text-sm text-gray-500 mb-3">{meeting.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {meeting.scheduledAt ? format(new Date(meeting.scheduledAt), "EEEE d MMMM yyyy — HH:mm", { locale: ar }) : "—"}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {meeting.durationMinutes} دقيقة
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {(meeting.participantEmails || []).length} مشارك
              </span>
              {avgRating && (
                <span className="flex items-center gap-1.5 text-amber-600">
                  <Star className="w-4 h-4" />
                  {avgRating} / 5
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => window.open(meeting.meetingLink, '_blank')}
              className="inline-flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black font-bold px-4 py-2 rounded-xl hover:opacity-80 transition-opacity text-sm"
              data-testid="button-join-main">
              <Video className="w-4 h-4" />
              انضم للاجتماع
            </button>
            <button onClick={copyLink}
              className="inline-flex items-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
              data-testid="button-copy-main">
              <Copy className="w-4 h-4" />
              نسخ الرابط
            </button>
            {isManagement && (
              <button
                onClick={() => { if (confirm(L ? "هل تريد حذف هذا الاجتماع نهائياً؟" : "Are you sure you want to permanently delete this meeting?")) deleteMeetingMutation.mutate(); }}
                disabled={deleteMeetingMutation.isPending}
                className="inline-flex items-center gap-2 border border-red-200 text-red-600 font-medium px-4 py-2 rounded-xl hover:bg-red-50 text-sm transition-colors"
                data-testid="button-delete-meeting-main">
                <Trash2 className="w-4 h-4" />
                حذف الاجتماع
              </button>
            )}
          </div>
        </div>

        {/* Meeting link */}
        <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <Video className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-500 truncate">{meeting.meetingLink}</span>
        </div>

        {/* Status actions */}
        {isManagement && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {meeting.status === "scheduled" && (
              <>
                <Button size="sm" onClick={() => statusMutation.mutate("live")} className="gap-1 bg-green-600 hover:bg-green-700 text-white border-0">
                  <Play className="w-3.5 h-3.5" /> بدء البث
                </Button>
                <Button size="sm" variant="outline" onClick={() => statusMutation.mutate("cancelled")} className="gap-1 text-red-600 border-red-200 hover:bg-red-50">
                  <XCircle className="w-3.5 h-3.5" /> إلغاء
                </Button>
              </>
            )}
            {meeting.status === "live" && (
              <Button size="sm" onClick={() => statusMutation.mutate("completed")} className="gap-1 bg-gray-800 hover:bg-gray-700 text-white border-0">
                <CheckCircle className="w-3.5 h-3.5" /> إنهاء الاجتماع
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => sendInvitesMutation.mutate()} disabled={sendInvitesMutation.isPending} className="gap-1">
              <Send className="w-3.5 h-3.5" />
              {sendInvitesMutation.isPending ? (L ? "جارٍ الإرسال..." : "Sending...") : (L ? "إعادة إرسال الدعوات" : "Resend Invites")}
            </Button>
          </div>
        )}
      </div>

      {/* Features badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { label: L ? "فيديو HD" : "HD Video", icon: "🎥" },
          { label: L ? "مشاركة الشاشة" : "Screen Share", icon: "🖥" },
          { label: L ? "السبورة التفاعلية" : "Interactive Board", icon: "✏️" },
          { label: L ? "دردشة نصية" : "Text Chat", icon: "💬" },
          { label: L ? "تسجيل الاجتماع" : "Meeting Recording", icon: "⏺" },
        ].map(f => (
          <span key={f.label} className="inline-flex items-center gap-1 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1 text-gray-600 dark:text-gray-300 font-medium">
            {f.icon} {f.label}
          </span>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-1 mb-4 shadow-sm">
        {[
          { key: "info", label: L ? "التفاصيل" : "Details", icon: Clipboard },
          { key: "feedback", label: `التقييمات${feedbacks?.length ? ` (${feedbacks.length})` : ""}`, icon: Star },
          { key: "reports", label: `التقارير${reports?.length ? ` (${reports.length})` : ""}`, icon: FileText },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-lg transition-colors ${activeTab === tab.key ? "bg-black text-white dark:bg-white dark:text-black" : "text-gray-500 hover:text-black dark:hover:text-white"}`}
              data-testid={`tab-${tab.key}`}>
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <div className="space-y-4">
          {/* Participants */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                المشاركون ({(meeting.participantEmails || []).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(meeting.participantEmails || []).length === 0 ? (
                <p className="text-sm text-gray-400">{L ? "لا يوجد مشاركون محددون" : "No participants specified"}</p>
              ) : (
                <div className="space-y-2">
                  {(meeting.participantEmails || []).map((email: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5" data-testid={`participant-${i}`}>
                      <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-xs font-bold flex-shrink-0">
                        {(meeting.participantNames?.[i] || email)[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black dark:text-white">{meeting.participantNames?.[i] || "—"}</p>
                        <p className="text-xs text-gray-400">{email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {meeting.notes && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  ملاحظات داخلية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{meeting.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Host */}
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-bold">
                  {meeting.hostName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-gray-400">{L ? "المضيف" : "Host"}</p>
                  <p className="font-bold text-black dark:text-white">{meeting.hostName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "feedback" && (
        <div className="space-y-4">
          {/* Submit feedback */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{L ? "تقديم تقييم" : "Submit Feedback"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="mb-2 block">{L ? "تقييمك" : "Your Rating"}</Label>
                <StarRating value={feedbackRating} onChange={setFeedbackRating} />
              </div>
              <div>
                <Label>{L ? "تعليق (اختياري)" : "Comment (optional)"}</Label>
                <Textarea value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)} placeholder={L ? "شاركنا رأيك في الاجتماع..." : "Share your thoughts on the meeting..."} className="mt-1 h-20" data-testid="input-feedback-comment" />
              </div>
              <Button onClick={() => feedbackMutation.mutate()} disabled={feedbackMutation.isPending} className="gap-2" data-testid="button-submit-feedback">
                <Send className="w-4 h-4" />
                {feedbackMutation.isPending ? (L ? "جارٍ الإرسال..." : "Sending...") : (L ? "إرسال التقييم" : "Submit Feedback")}
              </Button>
            </CardContent>
          </Card>

          {/* Feedback list */}
          {feedbacksLoading ? (
            <Skeleton className="h-32 rounded-xl" />
          ) : feedbacks && feedbacks.length > 0 ? (
            <div className="space-y-3">
              <div className="text-center py-2">
                <p className="text-3xl font-black text-amber-500">{avgRating}</p>
                <div className="flex justify-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <span key={n} className={`text-xl ${n <= Math.round(Number(avgRating)) ? "text-amber-400" : "text-gray-300"}`}>★</span>
                  ))}
                </div>
                <p className="text-sm text-gray-400 mt-1">{feedbacks.length} تقييم</p>
              </div>
              {feedbacks.map((fb: any) => (
                <div key={fb._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4" data-testid={`feedback-${fb._id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold">
                        {fb.fromUserName?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">{fb.fromUserName}</span>
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(n => (
                        <span key={n} className={`text-sm ${n <= fb.rating ? "text-amber-400" : "text-gray-300"}`}>★</span>
                      ))}
                    </div>
                  </div>
                  {fb.comment && <p className="text-sm text-gray-600 dark:text-gray-300">{fb.comment}</p>}
                  <p className="text-xs text-gray-400 mt-2">
                    {fb.createdAt ? format(new Date(fb.createdAt), "d MMMM yyyy", { locale: ar }) : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Star className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>{L ? "لا توجد تقييمات بعد" : "No feedback yet"}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-4">
          {/* Submit report */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{L ? "رفع تقرير اجتماع" : "Upload Meeting Report"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>{L ? "ملخص الاجتماع *" : "Meeting Summary *"}</Label>
                <Textarea value={reportSummary} onChange={e => setReportSummary(e.target.value)} placeholder={L ? "ملخص ما تم مناقشته..." : "Summary of what was discussed..."} className="mt-1 h-24" data-testid="input-report-summary" />
              </div>
              <div>
                <Label>{L ? "محتوى التقرير التفصيلي" : "Detailed Report Content"}</Label>
                <Textarea value={reportContent} onChange={e => setReportContent(e.target.value)} placeholder={L ? "تفاصيل إضافية..." : "Additional details..."} className="mt-1 h-20" data-testid="input-report-content" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{L ? "عدد الحاضرين" : "Attendees Count"}</Label>
                  <Input type="number" value={reportAttendeesCount} onChange={e => setReportAttendeesCount(e.target.value)} placeholder="0" className="mt-1" data-testid="input-report-attendees" />
                </div>
                <div>
                  <Label>{L ? "المدة الفعلية (دقيقة)" : "Actual Duration (minutes)"}</Label>
                  <Input type="number" value={reportDuration} onChange={e => setReportDuration(e.target.value)} placeholder="60" className="mt-1" data-testid="input-report-duration" />
                </div>
              </div>
              <div>
                <Label>{L ? "بنود العمل (Action Items)" : "Action Items"}</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={reportAction} onChange={e => setReportAction(e.target.value)} onKeyDown={e => e.key === "Enter" && addActionItem()} placeholder="أضف بند عمل..." data-testid="input-action-item" />
                  <Button type="button" size="sm" variant="outline" onClick={addActionItem} data-testid="button-add-action">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {reportActions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {reportActions.map((a, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-1.5 text-sm">
                        <span>• {a}</span>
                        <button type="button" onClick={() => setReportActions(arr => arr.filter((_, j) => j !== i))} className="text-red-400 text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={() => reportMutation.mutate()} disabled={reportMutation.isPending || !reportSummary.trim()} className="gap-2" data-testid="button-submit-report">
                <FileText className="w-4 h-4" />
                {reportMutation.isPending ? (L ? "جارٍ الرفع..." : "Uploading...") : (L ? "رفع التقرير" : "Upload Report")}
              </Button>
            </CardContent>
          </Card>

          {/* Reports list */}
          {reportsLoading ? (
            <Skeleton className="h-32 rounded-xl" />
          ) : reports && reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((r: any) => (
                <div key={r._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4" data-testid={`report-${r._id}`}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-xs font-bold">
                          {r.authorName?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm font-bold">{r.authorName}</span>
                        <span className="text-xs text-gray-400">{r.createdAt ? format(new Date(r.createdAt), "d MMMM yyyy", { locale: ar }) : ""}</span>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-400">
                        {r.attendeesCount > 0 && <span>👥 {r.attendeesCount} حاضر</span>}
                        {r.duration > 0 && <span>⏱ {r.duration} دقيقة</span>}
                      </div>
                    </div>
                    {isManagement && (
                      <button onClick={() => { if (confirm(L ? "حذف هذا التقرير؟" : "Delete this report?")) deleteReportMutation.mutate(r._id) }}
                        className="text-red-400 hover:text-red-600 p-1" data-testid={`button-delete-report-${r._id}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-3">
                    <p className="text-xs font-bold text-gray-400 mb-1">{L ? "الملخص" : "Summary"}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{r.summary}</p>
                  </div>
                  {r.content && (
                    <p className="text-sm text-gray-500 mb-3 whitespace-pre-wrap">{r.content}</p>
                  )}
                  {r.actionItems && r.actionItems.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 mb-2">{L ? "بنود العمل:" : "Action Items:"}</p>
                      <ul className="space-y-1">
                        {r.actionItems.map((a: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <span className="text-green-500 mt-0.5">✓</span>
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>{L ? "لا توجد تقارير بعد" : "No reports yet"}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
