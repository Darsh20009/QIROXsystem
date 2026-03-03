import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle2, Clock, Play, XCircle, AlertCircle, Loader2, Plus,
  LayoutGrid, Bug, Calendar, ExternalLink, User, Star, ChevronLeft,
  Send, Link2, VideoIcon, CheckCheck, ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

const STATUSES = [
  { value: 'pending', label: 'قيد الانتظار', icon: Clock, color: 'text-gray-500 bg-gray-100' },
  { value: 'in_progress', label: 'جارٍ التنفيذ', icon: Play, color: 'text-amber-600 bg-amber-100' },
  { value: 'completed', label: 'مكتملة', icon: CheckCircle2, color: 'text-green-700 bg-green-100' },
  { value: 'cancelled', label: 'ملغاة', icon: XCircle, color: 'text-red-600 bg-red-100' },
];
const ISSUE_STATUSES = [
  { value: 'open', label: 'مفتوح', color: 'bg-red-100 text-red-700' },
  { value: 'in_progress', label: 'جارٍ', color: 'bg-amber-100 text-amber-700' },
  { value: 'resolved', label: 'محلول', color: 'bg-green-100 text-green-700' },
  { value: 'closed', label: 'مغلق', color: 'bg-gray-100 text-gray-500' },
];
const MEETING_STATUSES = [
  { value: 'pending', label: 'في الانتظار', color: 'bg-amber-100 text-amber-700' },
  { value: 'scheduled', label: 'محدد', color: 'bg-blue-100 text-blue-700' },
  { value: 'cancelled', label: 'ملغي', color: 'bg-red-100 text-red-700' },
  { value: 'completed', label: 'مكتمل', color: 'bg-green-100 text-green-700' },
];
const PRIORITIES = [
  { value: 'low', label: 'منخفضة', color: 'bg-gray-100 text-gray-600' },
  { value: 'medium', label: 'متوسطة', color: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'عالية', color: 'bg-amber-100 text-amber-700' },
  { value: 'critical', label: 'حرجة', color: 'bg-red-100 text-red-700' },
];

function statusInfo(s: string) { return STATUSES.find(x => x.value === s) || STATUSES[0]; }
function issueStatusInfo(s: string) { return ISSUE_STATUSES.find(x => x.value === s) || ISSUE_STATUSES[0]; }
function meetingStatusInfo(s: string) { return MEETING_STATUSES.find(x => x.value === s) || MEETING_STATUSES[0]; }
function priorityInfo(p: string) { return PRIORITIES.find(x => x.value === p) || PRIORITIES[1]; }
function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `${Math.floor(diff / 60)}د`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}س`;
  return new Date(d).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
}
function isMeetingOpen(meeting: any): boolean {
  if (!meeting.scheduledAt || !meeting.meetingLink) return false;
  const now = Date.now();
  const scheduled = new Date(meeting.scheduledAt).getTime();
  return now >= scheduled - 5 * 60 * 1000 && now <= scheduled + 2 * 60 * 60 * 1000;
}

export default function ProjectWorkspace() {
  const [, params] = useRoute("/project/:id/workspace");
  const projectId = params?.id;
  const { data: user } = useUser() as any;
  const { toast } = useToast();
  const isClient = user?.role === 'client';
  const isEmployee = !isClient;

  // Issues form state
  const [issueForm, setIssueForm] = useState({ title: '', description: '', priority: 'medium' });
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [editIssue, setEditIssue] = useState<any>(null);

  // Meeting form state
  const [meetingForm, setMeetingForm] = useState({ notes: '', scheduledAt: '', meetingLink: '', duration: 60 });
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [editMeeting, setEditMeeting] = useState<any>(null);

  const { data: project } = useQuery<any>({
    queryKey: ["/api/projects", projectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}`, { credentials: "include" });
      return r.json();
    },
    enabled: !!projectId,
  });

  const { data: features = [], isLoading: loadingFeatures } = useQuery<any[]>({
    queryKey: ["/api/projects", projectId, "features"],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}/features`, { credentials: "include" });
      return r.json();
    },
    enabled: !!projectId,
    refetchInterval: 30000,
  });

  const { data: issues = [], isLoading: loadingIssues } = useQuery<any[]>({
    queryKey: ["/api/projects", projectId, "issues"],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}/issues`, { credentials: "include" });
      return r.json();
    },
    enabled: !!projectId,
    refetchInterval: 20000,
  });

  const { data: meetings = [], isLoading: loadingMeetings } = useQuery<any[]>({
    queryKey: ["/api/projects", projectId, "meetings"],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}/meetings`, { credentials: "include" });
      return r.json();
    },
    enabled: !!projectId,
    refetchInterval: 30000,
  });

  const featureUpdateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const r = await apiRequest("PATCH", `/api/projects/${projectId}/features/${id}`, updates);
      return r.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "features"] }),
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const createIssueMutation = useMutation({
    mutationFn: async (data: any) => {
      const r = await apiRequest("POST", `/api/projects/${projectId}/issues`, data);
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "issues"] });
      setShowIssueDialog(false);
      setIssueForm({ title: '', description: '', priority: 'medium' });
      toast({ title: "تم رفع المشكلة" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const updateIssueMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const r = await apiRequest("PATCH", `/api/projects/${projectId}/issues/${id}`, updates);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "issues"] });
      setEditIssue(null);
      toast({ title: "تم تحديث المشكلة" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const createMeetingMutation = useMutation({
    mutationFn: async (data: any) => {
      const r = await apiRequest("POST", `/api/projects/${projectId}/meetings`, data);
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "meetings"] });
      setShowMeetingDialog(false);
      setMeetingForm({ notes: '', scheduledAt: '', meetingLink: '', duration: 60 });
      toast({ title: isClient ? "تم إرسال طلب الاجتماع" : "تم تحديد موعد الاجتماع" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const updateMeetingMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const r = await apiRequest("PATCH", `/api/projects/${projectId}/meetings/${id}`, updates);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "meetings"] });
      setEditMeeting(null);
      toast({ title: "تم تحديث الاجتماع" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  if (!projectId) return <div className="p-8 text-center text-black/30">معرّف المشروع غير صحيح</div>;

  const completed = features.filter((f: any) => f.status === 'completed').length;
  const pct = features.length > 0 ? Math.round((completed / features.length) * 100) : 0;
  const openIssues = issues.filter((i: any) => i.status === 'open' || i.status === 'in_progress').length;
  const upcomingMeetings = meetings.filter((m: any) => m.status === 'scheduled').length;

  const projectName = project?.stagingUrl || `مشروع #${projectId?.slice(-6)}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir="rtl">
      <PageGraphics variant="dashboard" />
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-black/[0.07] dark:border-white/[0.07] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/dashboard">
            <button className="w-8 h-8 rounded-xl hover:bg-black/[0.05] dark:hover:bg-white/[0.05] flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-black/40 dark:text-white/40" />
            </button>
          </Link>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
            {projectName[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-sm text-black dark:text-white truncate">{projectName}</h1>
            <p className="text-[10px] text-black/40 dark:text-white/30">مساحة عمل المشروع</p>
          </div>
          {/* Summary badges */}
          <div className="hidden sm:flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${pct === 100 ? 'bg-green-100 text-green-700' : 'bg-violet-100 text-violet-700'}`}>{pct}% مكتمل</span>
            {openIssues > 0 && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-700">{openIssues} مشكلة</span>}
            {upcomingMeetings > 0 && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700">{upcomingMeetings} اجتماع</span>}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        <Tabs defaultValue="features">
          <TabsList className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.07] p-1 rounded-xl gap-1 mb-4 w-full">
            <TabsTrigger value="features" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-black data-[state=active]:text-white" data-testid="tab-features">
              <LayoutGrid className="w-3.5 h-3.5 ml-1" /> المميزات ({features.length})
            </TabsTrigger>
            <TabsTrigger value="issues" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-black data-[state=active]:text-white" data-testid="tab-issues">
              <Bug className="w-3.5 h-3.5 ml-1" /> المشاكل {openIssues > 0 && <span className="mr-1 bg-red-500 text-white rounded-full text-[8px] px-1">{openIssues}</span>}
            </TabsTrigger>
            <TabsTrigger value="meetings" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-black data-[state=active]:text-white" data-testid="tab-meetings">
              <Calendar className="w-3.5 h-3.5 ml-1" /> الاجتماعات
            </TabsTrigger>
          </TabsList>

          {/* ── FEATURES TAB ── */}
          <TabsContent value="features">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] overflow-hidden">
              {/* Progress bar */}
              <div className="px-4 py-3 border-b border-black/[0.05] dark:border-white/[0.05]">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-black text-black/60 dark:text-white/50">نسبة الإنجاز</p>
                  <p className="text-xs font-black text-black dark:text-white">{pct}%</p>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-white/[0.08] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-l from-green-500 to-emerald-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-black/30 dark:text-white/20">{completed} مكتملة</span>
                  <span className="text-[10px] text-black/30 dark:text-white/20">{features.filter((f: any) => f.status === 'in_progress').length} جارية</span>
                  <span className="text-[10px] text-black/30 dark:text-white/20">{features.filter((f: any) => f.status === 'pending').length} منتظرة</span>
                </div>
              </div>

              {loadingFeatures ? (
                <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-black/20" /></div>
              ) : features.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <LayoutGrid className="w-10 h-10 text-black/10 dark:text-white/10" />
                  <p className="text-sm text-black/30 dark:text-white/20">لا توجد مميزات مضافة بعد</p>
                  <p className="text-xs text-black/20 dark:text-white/15">سيقوم الفريق بإضافة مميزات مشروعك قريباً</p>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {features.map((f: any, idx: number) => {
                    const si = statusInfo(f.status);
                    const pi = priorityInfo(f.priority);
                    const SIcon = si.icon;
                    const isMyTask = isEmployee && (String(f.assignedTo?.id || f.assignedTo) === String(user?.id));
                    const canStart = isEmployee && f.status === 'pending';
                    const canComplete = isEmployee && f.status === 'in_progress';
                    return (
                      <div key={f.id} className="flex items-start gap-3 px-4 py-3.5" data-testid={`workspace-feature-${f.id}`}>
                        {/* Status icon / Checkbox */}
                        <div className="pt-0.5 flex-shrink-0">
                          {f.status === 'completed' ? (
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                              <CheckCheck className="w-3 h-3 text-white" />
                            </div>
                          ) : f.status === 'in_progress' ? (
                            <div className="w-5 h-5 rounded-full bg-amber-400 animate-pulse flex items-center justify-center">
                              <Play className="w-2.5 h-2.5 text-white" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-black/20 dark:border-white/20" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className={`text-sm font-bold ${f.status === 'completed' ? 'line-through text-black/35 dark:text-white/30' : 'text-black dark:text-white'}`}>{f.title}</p>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${pi.color}`}>{pi.label}</span>
                          </div>
                          {f.description && <p className="text-[11px] text-black/45 dark:text-white/35 mt-0.5">{f.description}</p>}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${si.color}`}>
                              <SIcon className="w-2.5 h-2.5" /> {si.label}
                            </span>
                            {f.assignedTo && (
                              <span className="text-[10px] text-black/35 dark:text-white/30 flex items-center gap-1">
                                <User className="w-2.5 h-2.5" /> {f.assignedTo.fullName || f.assignedTo.username}
                              </span>
                            )}
                            {f.completedAt && <span className="text-[10px] text-green-600 dark:text-green-400">✓ {new Date(f.completedAt).toLocaleDateString('ar-SA')}</span>}
                          </div>
                          {/* Employee action buttons */}
                          {isEmployee && (canStart || canComplete) && (
                            <div className="flex gap-2 mt-2">
                              {canStart && (
                                <Button size="sm" className="h-6 text-[10px] gap-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-2" onClick={() => featureUpdateMutation.mutate({ id: f.id, updates: { status: 'in_progress' } })} disabled={featureUpdateMutation.isPending} data-testid={`button-start-feature-${f.id}`}>
                                  <Play className="w-2.5 h-2.5" /> بدء التنفيذ
                                </Button>
                              )}
                              {canComplete && (
                                <Button size="sm" className="h-6 text-[10px] gap-1 bg-green-600 hover:bg-green-700 text-white rounded-lg px-2" onClick={() => featureUpdateMutation.mutate({ id: f.id, updates: { status: 'completed' } })} disabled={featureUpdateMutation.isPending} data-testid={`button-complete-feature-${f.id}`}>
                                  <CheckCircle2 className="w-2.5 h-2.5" /> إنهاء الميزة
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── ISSUES TAB ── */}
          <TabsContent value="issues">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-black/50 dark:text-white/30">المشاكل والملاحظات</p>
                <Button size="sm" className="h-7 text-xs gap-1 bg-black text-white rounded-xl" onClick={() => setShowIssueDialog(true)} data-testid="button-new-issue">
                  <Plus className="w-3.5 h-3.5" /> رفع مشكلة
                </Button>
              </div>
              {loadingIssues ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-black/20" /></div>
              ) : issues.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] flex flex-col items-center justify-center py-14 gap-2">
                  <Bug className="w-10 h-10 text-black/10 dark:text-white/10" />
                  <p className="text-sm text-black/30 dark:text-white/20">لا توجد مشاكل مرفوعة</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {issues.map((issue: any) => {
                    const si = issueStatusInfo(issue.status);
                    const pi = priorityInfo(issue.priority);
                    const fromMe = String(issue.fromUserId?.id || issue.fromUserId) === String(user?.id);
                    return (
                      <div key={issue.id} className="bg-white dark:bg-gray-900 rounded-xl border border-black/[0.06] dark:border-white/[0.07] p-3.5" data-testid={`issue-card-${issue.id}`}>
                        <div className="flex items-start gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${issue.status === 'open' ? 'bg-red-500' : issue.status === 'in_progress' ? 'bg-amber-500' : 'bg-green-500'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-black dark:text-white">{issue.title}</p>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${si.color}`}>{si.label}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${pi.color}`}>{pi.label}</span>
                            </div>
                            {issue.description && <p className="text-[11px] text-black/45 dark:text-white/35 mt-1">{issue.description}</p>}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] text-black/35 dark:text-white/25">{fromMe ? "أرسلته أنت" : `من: ${issue.fromUserId?.fullName || issue.fromUserId?.username || '؟'}`}</span>
                              <span className="text-[10px] text-black/25 dark:text-white/20">{timeAgo(issue.createdAt)}</span>
                            </div>
                            {/* Employee actions on issues */}
                            {isEmployee && issue.status !== 'resolved' && issue.status !== 'closed' && (
                              <div className="flex gap-2 mt-2">
                                {issue.status === 'open' && (
                                  <Button size="sm" className="h-6 text-[10px] gap-1 bg-amber-500 text-white rounded-lg px-2" onClick={() => updateIssueMutation.mutate({ id: issue.id, updates: { status: 'in_progress' } })} data-testid={`button-issue-progress-${issue.id}`}>
                                    <Play className="w-2.5 h-2.5" /> بدء المعالجة
                                  </Button>
                                )}
                                {issue.status === 'in_progress' && (
                                  <Button size="sm" className="h-6 text-[10px] gap-1 bg-green-600 text-white rounded-lg px-2" onClick={() => updateIssueMutation.mutate({ id: issue.id, updates: { status: 'resolved' } })} data-testid={`button-issue-resolve-${issue.id}`}>
                                    <CheckCircle2 className="w-2.5 h-2.5" /> تم الحل
                                  </Button>
                                )}
                              </div>
                            )}
                            {/* Client actions */}
                            {isClient && issue.status === 'resolved' && (
                              <Button size="sm" className="h-6 text-[10px] gap-1 bg-gray-500 text-white rounded-lg px-2 mt-2" onClick={() => updateIssueMutation.mutate({ id: issue.id, updates: { status: 'closed' } })} data-testid={`button-issue-close-${issue.id}`}>
                                <XCircle className="w-2.5 h-2.5" /> إغلاق
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Issue dialog */}
            <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
              <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader><DialogTitle className="font-black">رفع مشكلة جديدة</DialogTitle></DialogHeader>
                <div className="space-y-3 mt-2">
                  <Input value={issueForm.title} onChange={e => setIssueForm(p => ({ ...p, title: e.target.value }))} placeholder="عنوان المشكلة" className="rounded-xl" data-testid="input-issue-title" />
                  <Textarea value={issueForm.description} onChange={e => setIssueForm(p => ({ ...p, description: e.target.value }))} placeholder="وصف المشكلة بالتفصيل..." rows={3} className="rounded-xl text-sm" data-testid="input-issue-desc" />
                  <Select value={issueForm.priority} onValueChange={v => setIssueForm(p => ({ ...p, priority: v }))}>
                    <SelectTrigger className="rounded-xl text-sm" data-testid="select-issue-priority"><SelectValue placeholder="الأولوية" /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button className="w-full bg-black text-white font-bold rounded-xl h-10 gap-2" onClick={() => createIssueMutation.mutate(issueForm)} disabled={!issueForm.title.trim() || createIssueMutation.isPending} data-testid="button-submit-issue">
                    {createIssueMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} رفع المشكلة
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ── MEETINGS TAB ── */}
          <TabsContent value="meetings">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-black/50 dark:text-white/30">الاجتماعات</p>
                <Button size="sm" className="h-7 text-xs gap-1 bg-black text-white rounded-xl" onClick={() => setShowMeetingDialog(true)} data-testid="button-request-meeting">
                  <Plus className="w-3.5 h-3.5" /> {isClient ? "طلب اجتماع" : "إضافة اجتماع"}
                </Button>
              </div>

              {loadingMeetings ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-black/20" /></div>
              ) : meetings.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] flex flex-col items-center justify-center py-14 gap-2">
                  <Calendar className="w-10 h-10 text-black/10 dark:text-white/10" />
                  <p className="text-sm text-black/30 dark:text-white/20">لا توجد اجتماعات</p>
                  {isClient && <p className="text-xs text-black/20 dark:text-white/15">يمكنك طلب اجتماع مع الفريق</p>}
                </div>
              ) : (
                <div className="space-y-2">
                  {meetings.map((meeting: any) => {
                    const ms = meetingStatusInfo(meeting.status);
                    const canJoin = isMeetingOpen(meeting);
                    const scheduledDate = meeting.scheduledAt ? new Date(meeting.scheduledAt) : null;
                    return (
                      <div key={meeting.id} className={`bg-white dark:bg-gray-900 rounded-xl border p-4 ${canJoin ? 'border-green-400 dark:border-green-600 ring-1 ring-green-400/30' : 'border-black/[0.06] dark:border-white/[0.07]'}`} data-testid={`meeting-card-${meeting.id}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${canJoin ? 'bg-green-100 dark:bg-green-900/20' : 'bg-violet-100 dark:bg-violet-900/20'}`}>
                            <VideoIcon className={`w-5 h-5 ${canJoin ? 'text-green-600' : 'text-violet-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-black dark:text-white">
                                {scheduledDate ? scheduledDate.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "اجتماع مطلوب"}
                              </p>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${ms.color}`}>{ms.label}</span>
                              {canJoin && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500 text-white animate-pulse">الآن!</span>}
                            </div>
                            {scheduledDate && (
                              <p className="text-[11px] text-black/45 dark:text-white/35 mt-0.5">
                                {scheduledDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })} — {meeting.duration} دقيقة
                              </p>
                            )}
                            {meeting.notes && <p className="text-[11px] text-black/40 dark:text-white/30 mt-1 italic">{meeting.notes}</p>}
                            {meeting.employeeId && (
                              <p className="text-[10px] text-black/35 dark:text-white/25 mt-1">
                                الموظف: {meeting.employeeId.fullName || meeting.employeeId.username}
                              </p>
                            )}
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {/* Client: can join if link available and time is right */}
                              {isClient && canJoin && meeting.meetingLink && (
                                <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700 text-white rounded-lg" data-testid={`button-join-meeting-${meeting.id}`}>
                                    <VideoIcon className="w-3.5 h-3.5" /> دخول الاجتماع
                                  </Button>
                                </a>
                              )}
                              {/* Employee: can schedule + add link */}
                              {isEmployee && meeting.status === 'pending' && (
                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-black/10 rounded-lg" onClick={() => {
                                  setMeetingForm({ notes: meeting.notes || '', scheduledAt: meeting.scheduledAt ? new Date(meeting.scheduledAt).toISOString().slice(0, 16) : '', meetingLink: meeting.meetingLink || '', duration: meeting.duration || 60 });
                                  setEditMeeting(meeting);
                                }} data-testid={`button-schedule-meeting-${meeting.id}`}>
                                  <Calendar className="w-3.5 h-3.5" /> تحديد الموعد
                                </Button>
                              )}
                              {/* Employee: can add/update link for scheduled meeting */}
                              {isEmployee && meeting.status === 'scheduled' && (
                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-black/10 rounded-lg" onClick={() => {
                                  setMeetingForm({ notes: meeting.notes || '', scheduledAt: meeting.scheduledAt ? new Date(meeting.scheduledAt).toISOString().slice(0, 16) : '', meetingLink: meeting.meetingLink || '', duration: meeting.duration || 60 });
                                  setEditMeeting(meeting);
                                }} data-testid={`button-edit-meeting-${meeting.id}`}>
                                  <Link2 className="w-3.5 h-3.5" /> تعديل الرابط
                                </Button>
                              )}
                              {isEmployee && meeting.status === 'scheduled' && (
                                <Button size="sm" className="h-7 text-xs gap-1 bg-green-600 text-white rounded-lg" onClick={() => updateMeetingMutation.mutate({ id: meeting.id, updates: { status: 'completed' } })} data-testid={`button-complete-meeting-${meeting.id}`}>
                                  <CheckCircle2 className="w-3.5 h-3.5" /> إنهاء الاجتماع
                                </Button>
                              )}
                              {/* Employee join too */}
                              {isEmployee && canJoin && meeting.meetingLink && (
                                <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" className="h-7 text-xs gap-1 bg-green-600 text-white rounded-lg">
                                    <VideoIcon className="w-3.5 h-3.5" /> دخول
                                  </Button>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Meeting request/schedule dialog */}
            <Dialog open={showMeetingDialog || !!editMeeting} onOpenChange={v => { if (!v) { setShowMeetingDialog(false); setEditMeeting(null); } }}>
              <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="font-black">
                    {isClient ? "طلب اجتماع" : editMeeting ? "تحديد موعد الاجتماع" : "إضافة اجتماع"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  {isClient && !editMeeting && (
                    <Textarea value={meetingForm.notes} onChange={e => setMeetingForm(p => ({ ...p, notes: e.target.value }))} placeholder="اذكر الهدف من الاجتماع وأي تفاصيل..." rows={3} className="rounded-xl text-sm" data-testid="input-meeting-notes" />
                  )}
                  {isEmployee && (
                    <>
                      <div>
                        <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">موعد الاجتماع</label>
                        <Input type="datetime-local" value={meetingForm.scheduledAt} onChange={e => setMeetingForm(p => ({ ...p, scheduledAt: e.target.value }))} className="rounded-xl text-sm" data-testid="input-meeting-datetime" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">المدة (دقيقة)</label>
                        <Input type="number" value={meetingForm.duration} onChange={e => setMeetingForm(p => ({ ...p, duration: Number(e.target.value) }))} min={15} step={15} className="rounded-xl text-sm" data-testid="input-meeting-duration" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">رابط الاجتماع (Google Meet / Zoom)</label>
                        <Input value={meetingForm.meetingLink} onChange={e => setMeetingForm(p => ({ ...p, meetingLink: e.target.value }))} placeholder="https://meet.google.com/..." className="rounded-xl text-sm" data-testid="input-meeting-link" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">ملاحظات</label>
                        <Textarea value={meetingForm.notes} onChange={e => setMeetingForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="rounded-xl text-sm" data-testid="input-meeting-notes-emp" />
                      </div>
                    </>
                  )}
                  <Button className="w-full bg-black text-white font-bold rounded-xl h-10 gap-2"
                    onClick={() => {
                      if (editMeeting) {
                        updateMeetingMutation.mutate({
                          id: editMeeting.id,
                          updates: {
                            ...meetingForm,
                            scheduledAt: meetingForm.scheduledAt ? new Date(meetingForm.scheduledAt).toISOString() : undefined,
                            status: meetingForm.scheduledAt ? 'scheduled' : 'pending',
                          }
                        });
                      } else {
                        createMeetingMutation.mutate({
                          ...meetingForm,
                          scheduledAt: meetingForm.scheduledAt ? new Date(meetingForm.scheduledAt).toISOString() : undefined,
                          status: isEmployee && meetingForm.scheduledAt ? 'scheduled' : 'pending',
                        });
                      }
                    }}
                    disabled={createMeetingMutation.isPending || updateMeetingMutation.isPending}
                    data-testid="button-submit-meeting"
                  >
                    {(createMeetingMutation.isPending || updateMeetingMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isClient ? "إرسال الطلب" : "حفظ"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
