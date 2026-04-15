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
  Send, Link2, VideoIcon, CheckCheck, ArrowLeft, CreditCard, FileText, ShieldCheck
} from "lucide-react";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
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
  const { lang, dir } = useI18n();
  const L = lang === "ar";
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "features"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
    },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
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
      toast({ title: L ? "تم رفع المشكلة" : "Issue submitted" });
    },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const updateIssueMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const r = await apiRequest("PATCH", `/api/projects/${projectId}/issues/${id}`, updates);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "issues"] });
      setEditIssue(null);
      toast({ title: L ? "تم تحديث المشكلة" : "Issue updated" });
    },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
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
      toast({ title: isClient ? (L ? "تم إرسال طلب الاجتماع" : "Meeting request sent") : (L ? "تم تحديد موعد الاجتماع" : "Meeting scheduled") });
    },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  const updateMeetingMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const r = await apiRequest("PATCH", `/api/projects/${projectId}/meetings/${id}`, updates);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "meetings"] });
      setEditMeeting(null);
      toast({ title: L ? "تم تحديث الاجتماع" : "Meeting updated" });
    },
    onError: (e: any) => toast({ title: L ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  // Paymob onboarding data (employee view)
  const { data: paymobData } = useQuery<any>({
    queryKey: ["/api/projects", projectId, "paymob-onboarding"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/paymob-onboarding`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!projectId && isEmployee,
  });

  if (!projectId) return <div className="p-8 text-center text-black/30">{L ? "معرّف المشروع غير صحيح" : "Invalid project ID"}</div>;

  const completed = features.filter((f: any) => f.status === 'completed').length;
  const pct = features.length > 0 ? Math.round((completed / features.length) * 100) : 0;
  const openIssues = issues.filter((i: any) => i.status === 'open' || i.status === 'in_progress').length;
  const upcomingMeetings = meetings.filter((m: any) => m.status === 'scheduled').length;

  const projectName = project?.stagingUrl || `${L ? "مشروع" : "Project"} #${projectId?.slice(-6)}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={dir}>
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
            <p className="text-[10px] text-black/40 dark:text-white/30">{L ? "مساحة عمل المشروع" : "Project Workspace"}</p>
          </div>
          {/* Summary badges */}
          <div className="hidden sm:flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${pct === 100 ? 'bg-green-100 text-green-700' : 'bg-violet-100 text-violet-700'}`}>{pct}% {L ? "مكتمل" : "complete"}</span>
            {openIssues > 0 && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-700">{openIssues} {L ? "مشكلة" : "issue(s)"}</span>}
            {upcomingMeetings > 0 && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700">{upcomingMeetings} {L ? "اجتماع" : "meeting(s)"}</span>}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        <Tabs defaultValue="features">
          <TabsList className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.07] p-1 rounded-xl gap-1 mb-4 w-full">
            <TabsTrigger value="features" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-black data-[state=active]:text-white" data-testid="tab-features">
              <LayoutGrid className="w-3.5 h-3.5 ml-1" /> {L ? "المميزات" : "Features"} ({features.length})
            </TabsTrigger>
            <TabsTrigger value="issues" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-black data-[state=active]:text-white" data-testid="tab-issues">
              <Bug className="w-3.5 h-3.5 ml-1" /> {L ? "المشاكل" : "Issues"} {openIssues > 0 && <span className="mr-1 bg-red-500 text-white rounded-full text-[8px] px-1">{openIssues}</span>}
            </TabsTrigger>
            <TabsTrigger value="meetings" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-black data-[state=active]:text-white" data-testid="tab-meetings">
              <Calendar className="w-3.5 h-3.5 ml-1" /> {L ? "الاجتماعات" : "Meetings"}
            </TabsTrigger>
            {isEmployee && paymobData && (
              <TabsTrigger value="paymob" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-black data-[state=active]:text-white" data-testid="tab-paymob">
                <CreditCard className="w-3.5 h-3.5 ml-1" /> Paymob
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── FEATURES TAB ── */}
          <TabsContent value="features">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] overflow-hidden">
              {/* Progress bar */}
              <div className="px-4 py-3 border-b border-black/[0.05] dark:border-white/[0.05]">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-black text-black/60 dark:text-white/50">{L ? "نسبة الإنجاز" : "Progress"}</p>
                  <p className="text-xs font-black text-black dark:text-white">{pct}%</p>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-white/[0.08] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-l from-green-500 to-emerald-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-black/30 dark:text-white/20">{completed} {L ? "مكتملة" : "done"}</span>
                  <span className="text-[10px] text-black/30 dark:text-white/20">{features.filter((f: any) => f.status === 'in_progress').length} {L ? "جارية" : "active"}</span>
                  <span className="text-[10px] text-black/30 dark:text-white/20">{features.filter((f: any) => f.status === 'pending').length} {L ? "منتظرة" : "pending"}</span>
                </div>
              </div>

              {loadingFeatures ? (
                <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-black/20" /></div>
              ) : features.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <LayoutGrid className="w-10 h-10 text-black/10 dark:text-white/10" />
                  <p className="text-sm text-black/30 dark:text-white/20">{L ? "لا توجد مميزات مضافة بعد" : "No features added yet"}</p>
                  <p className="text-xs text-black/20 dark:text-white/15">{L ? "سيقوم الفريق بإضافة مميزات مشروعك قريباً" : "The team will add your project features soon"}</p>
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
                            {f.completedAt && <span className="text-[10px] text-green-600 dark:text-green-400">✓ {new Date(f.completedAt).toLocaleDateString(L ? 'ar-SA' : 'en-US')}</span>}
                          </div>
                          {/* Employee action buttons */}
                          {isEmployee && (canStart || canComplete) && (
                            <div className="flex gap-2 mt-2">
                              {canStart && (
                                <Button size="sm" className="h-6 text-[10px] gap-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-2" onClick={() => featureUpdateMutation.mutate({ id: f.id, updates: { status: 'in_progress' } })} disabled={featureUpdateMutation.isPending} data-testid={`button-start-feature-${f.id}`}>
                                  <Play className="w-2.5 h-2.5" /> {L ? "بدء التنفيذ" : "Start"}
                                </Button>
                              )}
                              {canComplete && (
                                <Button size="sm" className="h-6 text-[10px] gap-1 bg-green-600 hover:bg-green-700 text-white rounded-lg px-2" onClick={() => featureUpdateMutation.mutate({ id: f.id, updates: { status: 'completed' } })} disabled={featureUpdateMutation.isPending} data-testid={`button-complete-feature-${f.id}`}>
                                  <CheckCircle2 className="w-2.5 h-2.5" /> {L ? "إنهاء الميزة" : "Complete"}
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
                <p className="text-xs font-black text-black/50 dark:text-white/30">{L ? "المشاكل والملاحظات" : "Issues & Notes"}</p>
                <Button size="sm" className="h-7 text-xs gap-1 bg-black text-white rounded-xl" onClick={() => setShowIssueDialog(true)} data-testid="button-new-issue">
                  <Plus className="w-3.5 h-3.5" /> {L ? "رفع مشكلة" : "Report Issue"}
                </Button>
              </div>
              {loadingIssues ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-black/20" /></div>
              ) : issues.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] flex flex-col items-center justify-center py-14 gap-2">
                  <Bug className="w-10 h-10 text-black/10 dark:text-white/10" />
                  <p className="text-sm text-black/30 dark:text-white/20">{L ? "لا توجد مشاكل مرفوعة" : "No issues reported"}</p>
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
                              <span className="text-[10px] text-black/35 dark:text-white/25">{fromMe ? (L ? "أرسلته أنت" : "You") : `${L ? "من:" : "From:"} ${issue.fromUserId?.fullName || issue.fromUserId?.username || '?'}`}</span>
                              <span className="text-[10px] text-black/25 dark:text-white/20">{timeAgo(issue.createdAt, L)}</span>
                            </div>
                            {/* Employee actions on issues */}
                            {isEmployee && issue.status !== 'resolved' && issue.status !== 'closed' && (
                              <div className="flex gap-2 mt-2">
                                {issue.status === 'open' && (
                                  <Button size="sm" className="h-6 text-[10px] gap-1 bg-amber-500 text-white rounded-lg px-2" onClick={() => updateIssueMutation.mutate({ id: issue.id, updates: { status: 'in_progress' } })} data-testid={`button-issue-progress-${issue.id}`}>
                                    <Play className="w-2.5 h-2.5" /> {L ? "بدء المعالجة" : "Start"}
                                  </Button>
                                )}
                                {issue.status === 'in_progress' && (
                                  <Button size="sm" className="h-6 text-[10px] gap-1 bg-green-600 text-white rounded-lg px-2" onClick={() => updateIssueMutation.mutate({ id: issue.id, updates: { status: 'resolved' } })} data-testid={`button-issue-resolve-${issue.id}`}>
                                    <CheckCircle2 className="w-2.5 h-2.5" /> {L ? "تم الحل" : "Resolve"}
                                  </Button>
                                )}
                              </div>
                            )}
                            {/* Client actions */}
                            {isClient && issue.status === 'resolved' && (
                              <Button size="sm" className="h-6 text-[10px] gap-1 bg-gray-500 text-white rounded-lg px-2 mt-2" onClick={() => updateIssueMutation.mutate({ id: issue.id, updates: { status: 'closed' } })} data-testid={`button-issue-close-${issue.id}`}>
                                <XCircle className="w-2.5 h-2.5" /> {L ? "إغلاق" : "Close"}
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
              <DialogContent className="sm:max-w-md" dir={dir}>
                <DialogHeader><DialogTitle className="font-black">{L ? "رفع مشكلة جديدة" : "Report New Issue"}</DialogTitle></DialogHeader>
                <div className="space-y-3 mt-2">
                  <Input value={issueForm.title} onChange={e => setIssueForm(p => ({ ...p, title: e.target.value }))} placeholder={L ? "عنوان المشكلة" : "Issue title"} className="rounded-xl" data-testid="input-issue-title" />
                  <Textarea value={issueForm.description} onChange={e => setIssueForm(p => ({ ...p, description: e.target.value }))} placeholder={L ? "وصف المشكلة بالتفصيل..." : "Describe the issue in detail..."} rows={3} className="rounded-xl text-sm" data-testid="input-issue-desc" />
                  <Select value={issueForm.priority} onValueChange={v => setIssueForm(p => ({ ...p, priority: v }))}>
                    <SelectTrigger className="rounded-xl text-sm" data-testid="select-issue-priority"><SelectValue placeholder={L ? "الأولوية" : "Priority"} /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button className="w-full bg-black text-white font-bold rounded-xl h-10 gap-2" onClick={() => createIssueMutation.mutate(issueForm)} disabled={!issueForm.title.trim() || createIssueMutation.isPending} data-testid="button-submit-issue">
                    {createIssueMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {L ? "رفع المشكلة" : "Submit Issue"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ── MEETINGS TAB ── */}
          <TabsContent value="meetings">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-black/50 dark:text-white/30">{L ? "الاجتماعات" : "Meetings"}</p>
                <Button size="sm" className="h-7 text-xs gap-1 bg-black text-white rounded-xl" onClick={() => setShowMeetingDialog(true)} data-testid="button-request-meeting">
                  <Plus className="w-3.5 h-3.5" /> {isClient ? (L ? "طلب اجتماع" : "Request Meeting") : (L ? "إضافة اجتماع" : "Add Meeting")}
                </Button>
              </div>

              {loadingMeetings ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-black/20" /></div>
              ) : meetings.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] flex flex-col items-center justify-center py-14 gap-2">
                  <Calendar className="w-10 h-10 text-black/10 dark:text-white/10" />
                  <p className="text-sm text-black/30 dark:text-white/20">{L ? "لا توجد اجتماعات" : "No meetings"}</p>
                  {isClient && <p className="text-xs text-black/20 dark:text-white/15">{L ? "يمكنك طلب اجتماع مع الفريق" : "You can request a meeting with the team"}</p>}
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
                                {scheduledDate ? scheduledDate.toLocaleDateString(L ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : (L ? "اجتماع مطلوب" : "Meeting Requested")}
                              </p>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${ms.color}`}>{ms.label}</span>
                              {canJoin && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500 text-white animate-pulse">{L ? "الآن!" : "Now!"}</span>}
                            </div>
                            {scheduledDate && (
                              <p className="text-[11px] text-black/45 dark:text-white/35 mt-0.5">
                                {scheduledDate.toLocaleTimeString(L ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })} — {meeting.duration} {L ? "دقيقة" : "min"}
                              </p>
                            )}
                            {meeting.notes && <p className="text-[11px] text-black/40 dark:text-white/30 mt-1 italic">{meeting.notes}</p>}
                            {meeting.employeeId && (
                              <p className="text-[10px] text-black/35 dark:text-white/25 mt-1">
                                {L ? "الموظف:" : "Employee:"} {meeting.employeeId.fullName || meeting.employeeId.username}
                              </p>
                            )}
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {/* Client: can join if link available and time is right */}
                              {isClient && canJoin && meeting.meetingLink && (
                                <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700 text-white rounded-lg" data-testid={`button-join-meeting-${meeting.id}`}>
                                    <VideoIcon className="w-3.5 h-3.5" /> {L ? "دخول الاجتماع" : "Join Meeting"}
                                  </Button>
                                </a>
                              )}
                              {/* Employee: can schedule + add link */}
                              {isEmployee && meeting.status === 'pending' && (
                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-black/10 rounded-lg" onClick={() => {
                                  setMeetingForm({ notes: meeting.notes || '', scheduledAt: meeting.scheduledAt ? new Date(meeting.scheduledAt).toISOString().slice(0, 16) : '', meetingLink: meeting.meetingLink || '', duration: meeting.duration || 60 });
                                  setEditMeeting(meeting);
                                }} data-testid={`button-schedule-meeting-${meeting.id}`}>
                                  <Calendar className="w-3.5 h-3.5" /> {L ? "تحديد الموعد" : "Schedule"}
                                </Button>
                              )}
                              {/* Employee: can add/update link for scheduled meeting */}
                              {isEmployee && meeting.status === 'scheduled' && (
                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-black/10 rounded-lg" onClick={() => {
                                  setMeetingForm({ notes: meeting.notes || '', scheduledAt: meeting.scheduledAt ? new Date(meeting.scheduledAt).toISOString().slice(0, 16) : '', meetingLink: meeting.meetingLink || '', duration: meeting.duration || 60 });
                                  setEditMeeting(meeting);
                                }} data-testid={`button-edit-meeting-${meeting.id}`}>
                                  <Link2 className="w-3.5 h-3.5" /> {L ? "تعديل الرابط" : "Edit Link"}
                                </Button>
                              )}
                              {isEmployee && meeting.status === 'scheduled' && (
                                <Button size="sm" className="h-7 text-xs gap-1 bg-green-600 text-white rounded-lg" onClick={() => updateMeetingMutation.mutate({ id: meeting.id, updates: { status: 'completed' } })} data-testid={`button-complete-meeting-${meeting.id}`}>
                                  <CheckCircle2 className="w-3.5 h-3.5" /> {L ? "إنهاء الاجتماع" : "Complete Meeting"}
                                </Button>
                              )}
                              {/* Employee join too */}
                              {isEmployee && canJoin && meeting.meetingLink && (
                                <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" className="h-7 text-xs gap-1 bg-green-600 text-white rounded-lg">
                                    <VideoIcon className="w-3.5 h-3.5" /> {L ? "دخول" : "Join"}
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
              <DialogContent className="sm:max-w-md" dir={dir}>
                <DialogHeader>
                  <DialogTitle className="font-black">
                    {isClient ? (L ? "طلب اجتماع" : "Request Meeting") : editMeeting ? (L ? "تحديد موعد الاجتماع" : "Schedule Meeting") : (L ? "إضافة اجتماع" : "Add Meeting")}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  {isClient && !editMeeting && (
                    <Textarea value={meetingForm.notes} onChange={e => setMeetingForm(p => ({ ...p, notes: e.target.value }))} placeholder={L ? "اذكر الهدف من الاجتماع وأي تفاصيل..." : "Describe the meeting purpose and any details..."} rows={3} className="rounded-xl text-sm" data-testid="input-meeting-notes" />
                  )}
                  {isEmployee && (
                    <>
                      <div>
                        <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">{L ? "موعد الاجتماع" : "Meeting Time"}</label>
                        <Input type="datetime-local" value={meetingForm.scheduledAt} onChange={e => setMeetingForm(p => ({ ...p, scheduledAt: e.target.value }))} className="rounded-xl text-sm" data-testid="input-meeting-datetime" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">{L ? "المدة (دقيقة)" : "Duration (min)"}</label>
                        <Input type="number" value={meetingForm.duration} onChange={e => setMeetingForm(p => ({ ...p, duration: Number(e.target.value) }))} min={15} step={15} className="rounded-xl text-sm" data-testid="input-meeting-duration" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">{L ? "رابط الاجتماع (Google Meet / Zoom)" : "Meeting Link (Google Meet / Zoom)"}</label>
                        <Input value={meetingForm.meetingLink} onChange={e => setMeetingForm(p => ({ ...p, meetingLink: e.target.value }))} placeholder="https://meet.google.com/..." className="rounded-xl text-sm" data-testid="input-meeting-link" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">{L ? "ملاحظات" : "Notes"}</label>
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
                    {isClient ? (L ? "إرسال الطلب" : "Send Request") : (L ? "حفظ" : "Save")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ── PAYMOB DOCS TAB (employee view) ── */}
          {isEmployee && paymobData && (
            <TabsContent value="paymob">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    <p className="text-sm font-black text-black dark:text-white">{L ? "وثائق تفعيل Paymob" : "Paymob Activation Documents"}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${paymobData.status === "approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : paymobData.status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : paymobData.status === "reviewing" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                    {paymobData.status === "approved" ? (L ? "موافق عليه" : "Approved") : paymobData.status === "rejected" ? (L ? "مرفوض" : "Rejected") : paymobData.status === "reviewing" ? (L ? "قيد المراجعة" : "Reviewing") : (L ? "بانتظار المراجعة" : "Pending")}
                  </span>
                </div>

                {/* Info grid */}
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { label: L ? "نوع الوثيقة" : "Doc Type", value: paymobData.docType === "commercial" ? (L ? "سجل تجاري" : "Commercial Reg.") : (L ? "وثيقة عمل حر" : "Freelance Doc") },
                      { label: L ? "رقم الوثيقة" : "Doc Number", value: paymobData.docNumber, ltr: true },
                      { label: L ? "رقم الهوية" : "National ID", value: paymobData.nationalId, ltr: true },
                      ...(paymobData.vatNumber ? [{ label: L ? "الرقم الضريبي" : "VAT Number", value: paymobData.vatNumber, ltr: true }] : []),
                      ...(paymobData.signatureName ? [{ label: L ? "التوقيع الرقمي" : "Digital Signature", value: paymobData.signatureName }] : []),
                    ].map(({ label, value, ltr }: any) => (
                      <div key={label} className="p-3 bg-black/[0.02] dark:bg-white/[0.03] rounded-xl">
                        <p className="text-[10px] font-semibold text-black/40 dark:text-white/30 mb-1">{label}</p>
                        <p className="text-sm font-bold text-black dark:text-white" dir={ltr ? "ltr" : undefined}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Documents */}
                  <div>
                    <p className="text-[11px] font-black text-black/30 dark:text-white/20 uppercase tracking-widest mb-3">{L ? "الوثائق المرفوعة" : "Uploaded Documents"}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: L ? "وثيقة النشاط التجاري" : "Business Document", key: "docFileUrl" },
                        { label: L ? "شهادة الآيبان" : "IBAN Certificate", key: "ibanCertUrl" },
                        { label: L ? "الهوية — الوجه الأمامي" : "ID — Front Face", key: "nationalIdFront" },
                        { label: L ? "الهوية — الوجه الخلفي" : "ID — Back Face", key: "nationalIdBack" },
                      ].map(({ label, key }) => (
                        <div key={key} className="p-3 border border-black/[0.06] dark:border-white/[0.06] rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-3.5 h-3.5 text-black/30 dark:text-white/20 shrink-0" />
                            <span className="text-xs font-medium text-black/60 dark:text-white/50 truncate">{label}</span>
                          </div>
                          {paymobData[key] ? (
                            <a
                              href={paymobData[key]}
                              target="_blank"
                              rel="noreferrer"
                              className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-[11px] font-bold hover:bg-blue-100 transition-colors"
                              data-testid={`link-emp-paymob-${key}`}
                            >
                              {L ? "عرض" : "View"} <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-black/25 dark:text-white/20 italic">{L ? "لم يُرفع" : "Not uploaded"}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Paymob registration status */}
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold ${paymobData.paymobRegistered ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"}`}>
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    {paymobData.paymobRegistered
                      ? (L ? "العميل أكد اكتمال التسجيل في منصة Paymob" : "Client confirmed Paymob portal registration")
                      : (L ? "العميل لم يؤكد التسجيل في منصة Paymob بعد" : "Client has not confirmed Paymob portal registration yet")}
                  </div>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
