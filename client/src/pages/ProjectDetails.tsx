import { useProjects } from "@/hooks/use-projects";
import { useTasks } from "@/hooks/use-tasks";
import { useVault } from "@/hooks/use-vault";
import { useUser } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, MessageSquare, CheckCircle2, FileText, Download, ShieldCheck, Link2, Receipt, CreditCard, FileSignature, Bell, Database, Globe, Key, Share2, StickyNote, Mic, Send, Plus, Trash2, Package, AlertCircle, RefreshCw, CheckCheck, Clock, XCircle, Video, BookOpen, ExternalLink, PlayCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import SARIcon from "@/components/SARIcon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
  return match ? match[1] : "";
}

export default function ProjectDetails() {
    const [, params] = useRoute("/project/:section");
    const section = params?.section || "status";
    const { data: user } = useUser();
    const { lang, dir } = useI18n();
    const L = lang === "ar";
    const queryClient = useQueryClient();
    const { data: projectList, isLoading } = useProjects();
  const project = Array.isArray(projectList) ? projectList[0] : projectList;
  const { data: tasks, isLoading: isLoadingTasks } = useTasks(project?.id);
  const { data: vaultItems, isLoading: isLoadingVault } = useVault(project?.id);
  const { toast } = useToast();
  const [messageContent, setMessageContent] = useState("");

  const deleteVaultMutation = useMutation({
    mutationFn: async (vaultId: string) => {
      await apiRequest("DELETE", `/api/projects/${project?.id}/vault/${vaultId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id, "vault"] }),
    onError: () => toast({ title: L ? "فشل حذف العنصر" : "Failed to delete item", variant: "destructive" }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await apiRequest("DELETE", `/api/projects/${project?.id}/tasks/${taskId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id, "tasks"] }),
    onError: () => toast({ title: L ? "فشل حذف المهمة" : "Failed to delete task", variant: "destructive" }),
  });

  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["/api/projects", project?.id, "messages"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${project.id}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return await res.json();
    },
    enabled: !!project?.id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/projects/${project.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, isInternal: false }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project.id, "messages"] });
      setMessageContent("");
    },
  });

  const { data: addonSubs = [], isLoading: isLoadingAddons } = useQuery<any[]>({
    queryKey: ["/api/projects", project?.id, "addon-subscriptions"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${project.id}/addon-subscriptions`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!project?.id,
  });

  const [renewingId, setRenewingId] = useState<string | null>(null);
  const requestRenewalMutation = useMutation({
    mutationFn: async (subId: string) => {
      setRenewingId(subId);
      const res = await apiRequest("POST", `/api/projects/${project.id}/addon-subscriptions/${subId}/request-renewal`, {});
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id, "addon-subscriptions"] });
      toast({ title: L ? "تم إرسال طلب التجديد" : "Renewal request sent", description: L ? "سيتواصل معك الفريق قريباً" : "The team will reach out soon" });
      setRenewingId(null);
    },
    onError: () => {
      toast({ title: L ? "فشل إرسال الطلب" : "Request failed", variant: "destructive" });
      setRenewingId(null);
    },
  });

  const getStatusLabel = (status: string) => {
      const labels: Record<string, string> = L ? {
        new: "جديد", under_study: "قيد الدراسة", pending_payment: "بانتظار الدفع",
        in_progress: "جاري التنفيذ", testing: "اختبار", review: "مراجعة",
        delivery: "تسليم", closed: "مغلق"
      } : {
        new: "New", under_study: "Under Study", pending_payment: "Pending Payment",
        in_progress: "In Progress", testing: "Testing", review: "Review",
        delivery: "Delivery", closed: "Closed"
      };
      return labels[status] || status;
    };

  if (isLoading) return <div className="min-h-full flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  if (!project) return (
    <div className="text-center p-20">
      <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
        <FileText className="w-10 h-10 text-slate-300" />
      </div>
      <p className="text-slate-500 font-medium mb-2">{L ? "لا توجد مشاريع نشطة حالياً" : "No active projects currently"}</p>
      <p className="text-xs text-slate-400">{L ? "سيظهر مشروعك هنا بمجرد موافقة الفريق على طلبك" : "Your project will appear here once the team approves your request"}</p>
    </div>
  );

  const order = (project as any).orderId as any;
  const projectNumber = `#${String(project.id)?.slice(-6).toUpperCase()}`;
  const projectTitle = order?.businessName || order?.serviceType || (L ? "مشروع رقمي" : "Digital Project");
  const manager = (project as any).managerId as any;
  const pct = project.progress || 0;
  const r = 36, circPx = 2 * Math.PI * r;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;
    sendMessageMutation.mutate(messageContent);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 relative overflow-hidden" dir={dir}>
      <PageGraphics variant="minimal" />

      {/* Creative project header */}
      <div className="bg-gradient-to-br from-black via-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="relative p-6 md:p-8">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }} />
          <div className="relative flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge className="bg-white/10 text-white border-white/10 hover:bg-white/20">{getStatusLabel(project.status)}</Badge>
                <span className="font-mono text-[11px] font-bold text-white/50 tracking-widest bg-white/10 px-2 py-0.5 rounded-md">{projectNumber}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white mb-1 leading-tight">{projectTitle}</h1>
              {order?.serviceType && order.serviceType !== projectTitle && (
                <p className="text-white/40 text-sm mb-3">{order.serviceType}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-4">
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-widest mb-0.5">{L ? "بدء التنفيذ" : "Start Date"}</p>
                  <p className="text-white text-sm font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-white/40" />
                    {project.startDate ? new Date(project.startDate).toLocaleDateString(L ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : (L ? 'قيد الانتظار' : 'Pending')}
                  </p>
                </div>
                {project.deadline && (
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-widest mb-0.5">{L ? "موعد التسليم" : "Deadline"}</p>
                    <p className="text-white text-sm font-semibold">{new Date(project.deadline).toLocaleDateString(L ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                )}
                {manager?.fullName && (
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-widest mb-0.5">{L ? "مدير المشروع" : "Project Manager"}</p>
                    <p className="text-white text-sm font-semibold">{manager.fullName}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-2">
              <div className="relative">
                <svg width="90" height="90" viewBox="0 0 90 90">
                  <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                  <circle cx="45" cy="45" r={r} fill="none" stroke="white" strokeWidth="6"
                    strokeDasharray={circPx} strokeDashoffset={circPx * (1 - pct / 100)}
                    strokeLinecap="round" transform="rotate(-90 45 45)"
                    style={{ transition: "stroke-dashoffset 2s ease" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-white font-black text-2xl leading-none">{pct}</span>
                  <span className="text-white/40 text-[10px]">%</span>
                </div>
              </div>
              <p className="text-white/40 text-[10px]">{L ? "نسبة الإنجاز" : "Progress"}</p>
            </div>
          </div>
        </div>
        {/* Phase bar */}
        <div className="flex border-t border-white/[0.06]">
          {(L ? ["استقبال","دراسة","تنفيذ","اختبار","تسليم"] : ["Intake","Study","Execute","Test","Deliver"]).map((ph, pi) => {
            const statusOrder = ["new","under_study","in_progress","testing","delivery","closed"];
            const currIdx = statusOrder.indexOf(project.status);
            const done = pi < Math.max(currIdx, 0);
            const active = statusOrder[pi] === project.status || (project.status === "review" && pi === 3) || (project.status === "pending_payment" && pi === 1);
            return (
              <div key={pi} className={`flex-1 py-2.5 text-center text-[10px] font-bold border-r border-white/[0.04] last:border-r-0 transition-colors ${
                done ? "bg-white/10 text-white" : active ? "bg-white/15 text-white" : "text-white/20"
              }`}>
                {done ? "✓ " : ""}{ph}
              </div>
            );
          })}
        </div>
      </div>

      <Tabs defaultValue={section} className="w-full" dir="rtl">
        <TabsList className="bg-white border p-1 h-auto flex-wrap justify-start gap-2 hidden md:flex">
          <TabsTrigger value="status" className="data-[state=active]:bg-primary data-[state=active]:text-white">{L ? "حالة المشروع" : "Project Status"}</TabsTrigger>
          <TabsTrigger value="implementation" className="data-[state=active]:bg-primary data-[state=active]:text-white">{L ? "مراحل التنفيذ" : "Implementation"}</TabsTrigger>
          <TabsTrigger value="files" className="data-[state=active]:bg-primary data-[state=active]:text-white">{L ? "ملفات المشروع" : "Project Files"}</TabsTrigger>
          <TabsTrigger value="tools" className="data-[state=active]:bg-primary data-[state=active]:text-white">{L ? "روابط الأدوات" : "Tool Links"}</TabsTrigger>
          <TabsTrigger value="chat" className="data-[state=active]:bg-primary data-[state=active]:text-white">{L ? "محادثة الفريق" : "Team Chat"}</TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-primary data-[state=active]:text-white">الفواتير</TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-primary data-[state=active]:text-white">الدفعات</TabsTrigger>
          <TabsTrigger value="contracts" className="data-[state=active]:bg-primary data-[state=active]:text-white">العقود</TabsTrigger>
          <TabsTrigger value="vault" className="data-[state=active]:bg-primary data-[state=active]:text-white">Vault المشروع</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-primary data-[state=active]:text-white">التنبيهات</TabsTrigger>
          <TabsTrigger value="deliverables" className="data-[state=active]:bg-primary data-[state=active]:text-white">التسليمات</TabsTrigger>
          <TabsTrigger value="addons" className="data-[state=active]:bg-primary data-[state=active]:text-white relative">
            {L ? "الإضافات" : "Add-ons"}
            {addonSubs.some((s: any) => s.status === "expired" || s.status === "exhausted") && (
              <span className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </TabsTrigger>
          {order?.wizardData && (
            <TabsTrigger value="brief" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              {L ? "ملف المشروع" : "Project Brief"}
            </TabsTrigger>
          )}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="status">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader><CardTitle className="font-heading">{L ? "ملخص الحالة" : "Status Summary"}</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-slate-600">
                  <p>{L ? "المشروع يسير وفق الخطة الزمنية المحددة. تم الانتهاء من مرحلة التحليل والتصميم، ونحن الآن في مرحلة البرمجة." : "The project is on track. Analysis and design phases are complete; we are now in the programming phase."}</p>
                  <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100">
                    <CheckCircle2 className="w-4 h-4" />
                    {L ? "تم تسليم جميع متطلبات المرحلة الأولى" : "All Phase 1 requirements have been delivered"}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="font-heading">{L ? "المواعيد" : "Dates"}</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">{L ? "بداية المشروع:" : "Start:"}</span>
                    <span className="font-medium">01/02/2026</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">{L ? "موعد التسليم:" : "Deadline:"}</span>
                    <span className="font-medium text-secondary">15/03/2026</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="implementation">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="font-heading flex items-center justify-between">
                    <span>{L ? "مراحل التنفيذ والمهام" : "Implementation Stages & Tasks"}</span>
                    <Button size="sm" variant="outline"><Plus className="w-4 h-4 ml-2" /> {L ? "مهمة جديدة" : "New Task"}</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoadingTasks ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 
                     tasks?.length === 0 ? <p className="text-center text-slate-400 py-8">{L ? "لا توجد مهام حالياً" : "No tasks yet"}</p> :
                     tasks?.map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className={`w-5 h-5 ${task.status === 'completed' ? 'text-green-500' : 'text-slate-300'}`} />
                          <div>
                            <p className="font-bold text-primary">{task.title}</p>
                            <p className="text-xs text-slate-500">{task.priority === 'high' ? (L ? 'أولوية قصوى' : 'High Priority') : task.priority}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                            {task.status === 'completed' ? (L ? 'مكتملة' : 'Completed') : (L ? 'قيد التنفيذ' : 'In Progress')}
                          </Badge>
                          {(user as any)?.role !== 'client' && (
                            <button
                              onClick={() => deleteTaskMutation.mutate(task.id)}
                              disabled={deleteTaskMutation.isPending}
                              className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
                              data-testid={`button-delete-task-${task.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="font-heading">{L ? "المخطط الزمني" : "Timeline"}</CardTitle></CardHeader>
                <CardContent>
                   <div className="space-y-6">
                    {[
                      { title: L ? "تحليل المتطلبات" : "Requirements Analysis", status: "completed", date: "05/02/2026" },
                      { title: L ? "تصميم واجهات المستخدم UI/UX" : "UI/UX Design", status: "completed", date: "12/02/2026" },
                      { title: L ? "برمجة الواجهة الأمامية" : "Frontend Programming", status: "in-progress", date: "25/02/2026" },
                      { title: L ? "تطوير النظام الخلفي والربط" : "Backend Development & Integration", status: "pending", date: "05/03/2026" },
                    ].map((step, i) => (
                      <div key={i} className="flex gap-4 relative">
                        {i !== 3 && <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-slate-100" />}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                          step.status === 'completed' ? 'bg-green-500 text-white' : 
                          step.status === 'in-progress' ? 'bg-secondary text-primary' : 'bg-slate-200'
                        }`}>
                          {step.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-bold text-primary text-sm">{step.title}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{L ? "الموعد:" : "Date:"} {step.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="files">
             <Card>
                <CardHeader><CardTitle className="font-heading">ملفات المشروع</CardTitle></CardHeader>
                <CardContent>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(L ? ['دليل العلامة التجارية.pdf', 'مواصفات النظام.docx', 'تصاميم Figma.link'] : ['Brand Guide.pdf', 'System Specs.docx', 'Figma Designs.link']).map((file, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                           <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-primary" />
                              <span className="text-sm font-medium">{file}</span>
                           </div>
                           <Button size="icon" variant="ghost"><Download className="w-4 h-4" /></Button>
                        </div>
                      ))}
                   </div>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card className="flex flex-col h-[600px]">
              <CardHeader className="border-b">
                <CardTitle className="font-heading flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  {L ? "محادثة الفريق والعميل" : "Team & Client Chat"}
                </CardTitle>
                <p className="text-xs text-slate-500">{L ? "جميع المحادثات محفوظة وغير قابلة للحذف لضمان الجودة" : "All conversations are saved and cannot be deleted to ensure quality"}</p>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {isLoadingMessages ? (
                      <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin" /></div>
                    ) : messages?.length === 0 ? (
                      <div className="text-center py-20 text-slate-400">{L ? "ابدأ المحادثة الآن" : "Start the conversation now"}</div>
                    ) : (
                      messages.map((msg: any) => (
                        <div key={msg.id} className={`flex flex-col ${msg.senderId === user?.id ? 'items-start' : 'items-end'}`}>
                          <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                            msg.senderId === user?.id 
                              ? 'bg-primary text-white rounded-tr-none' 
                              : 'bg-slate-100 text-slate-800 rounded-tl-none'
                          }`}>
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1">
                            {new Date(msg.createdAt).toLocaleTimeString(L ? 'ar-SA' : 'en-US')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                  <Input 
                    placeholder={L ? "اكتب رسالتك هنا..." : "Write your message..."} 
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button type="submit" size="icon" disabled={sendMessageMutation.isPending || !messageContent.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vault">
            <Card className="border-secondary/20 bg-secondary/5">
              <CardHeader>
                <CardTitle className="font-heading flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    {L ? "Vault المشروع (البيانات الحساسة)" : "Project Vault (Sensitive Data)"}
                  </div>
                  <Button size="sm" variant="secondary"><Plus className="w-4 h-4 ml-2" /> {L ? "إضافة عنصر" : "Add Item"}</Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingVault ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> :
                 !vaultItems || vaultItems.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border border-secondary/20">
                    <p className="text-slate-600">{L ? "لا توجد بيانات حساسة مخزنة حالياً في هذا المشروع." : "No sensitive data stored for this project yet."}</p>
                  </div>
                 ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vaultItems.map((item: any) => (
                      <Card key={item.id} className="bg-white hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-slate-50 rounded-lg text-primary">
                              {item.category === 'git' && <Globe className="w-5 h-5" />}
                              {item.category === 'db' && <Database className="w-5 h-5" />}
                              {item.category === 'server' && <Globe className="w-5 h-5" />}
                              {item.category === 'api' && <Share2 className="w-5 h-5" />}
                              {item.category === 'social' && <Share2 className="w-5 h-5" />}
                              {item.category === 'credentials' && <Key className="w-5 h-5" />}
                              {item.category === 'notes' && <StickyNote className="w-5 h-5" />}
                              {item.category === 'recordings' && <Mic className="w-5 h-5" />}
                            </div>
                            <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                          </div>
                          <h4 className="font-bold text-primary mb-1">{item.title}</h4>
                          <div className="mt-4 p-3 bg-slate-900 rounded-lg text-xs font-mono text-cyan-400 break-all">
                            {item.isSecret ? "••••••••••••" : item.content}
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button variant="ghost" size="sm" className="flex-1 text-xs">{L ? "عرض المحتوى" : "View Content"}</Button>
                            {(user as any)?.role !== 'client' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 px-2"
                                onClick={() => deleteVaultMutation.mutate(item.id || item._id)}
                                disabled={deleteVaultMutation.isPending}
                                data-testid={`button-delete-vault-${item.id || item._id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                 )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools">
            <Card>
              <CardHeader><CardTitle className="font-heading">روابط الأدوات</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: L ? "بيئة التطوير (Staging)" : "Staging Environment", url: "https://staging.qirox.tech" },
                    { name: L ? "لوحة تحكم WordPress" : "WordPress Admin", url: "https://site.com/wp-admin" },
                    { name: L ? "رابط Google Drive" : "Google Drive Link", url: "#" },
                  ].map((tool, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Link2 className="w-5 h-5 text-primary" />
                        <span className="font-medium text-slate-700">{tool.name}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="text-blue-600">{L ? "زيارة الرابط" : "Visit Link"}</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <Card>
              <CardHeader><CardTitle className="font-heading">الفواتير</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { id: "INV-001", amount: "500$", status: "Paid", date: "01/02/2026" },
                    { id: "INV-002", amount: "750$", status: "Pending", date: "15/02/2026" },
                  ].map((inv, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-xl">
                      <div>
                        <p className="font-bold text-primary">{inv.id}</p>
                        <p className="text-xs text-slate-500">{inv.date}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold">{inv.amount}</span>
                        <Badge variant={inv.status === 'Paid' ? 'default' : 'secondary'}>{inv.status}</Badge>
                        <Button size="icon" variant="ghost"><Download className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader><CardTitle className="font-heading">الدفعات</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-6 bg-slate-50 rounded-xl border border-dashed text-center text-slate-500">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p>{L ? "سجل الدفعات سيكون متاحاً بعد تأكيد الفاتورة القادمة" : "Payment history will be available after the next invoice is confirmed"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts">
            <Card>
              <CardHeader><CardTitle className="font-heading">العقود</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileSignature className="w-5 h-5 text-primary" />
                    <span className="font-medium">{L ? "عقد تقديم الخدمات البرمجية.pdf" : "Software Services Contract.pdf"}</span>
                  </div>
                  <Badge className="bg-green-100 text-green-700">{L ? "موقع إلكترونياً" : "Digitally Signed"}</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader><CardTitle className="font-heading">التنبيهات</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-sm text-blue-800">{L ? 'تم تحديث حالة المشروع إلى "قيد التنفيذ"' : 'Project status updated to "In Progress"'}</p>
                    <p className="text-[10px] text-blue-600 mt-1">{L ? "منذ ساعتين" : "2 hours ago"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deliverables">
            <div className="space-y-5">
              {/* Delivery Video */}
              {(project as any).deliveryVideoUrl ? (
                <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-slate-800">{L ? "فيديو شرح التسليم" : "Delivery Video"}</h3>
                  </div>
                  <div className="p-4">
                    {(project as any).deliveryVideoUrl.includes("youtube.com") || (project as any).deliveryVideoUrl.includes("youtu.be") ? (
                      <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                        <iframe
                          className="absolute inset-0 w-full h-full"
                          src={`https://www.youtube.com/embed/${extractYouTubeId((project as any).deliveryVideoUrl)}`}
                          title="Delivery Video"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    ) : (
                      <a href={(project as any).deliveryVideoUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Video className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium text-slate-700 group-hover:text-primary transition-colors">{L ? "مشاهدة فيديو الشرح" : "Watch Explanation Video"}</span>
                        <ExternalLink className="w-4 h-4 text-slate-400 mr-auto" />
                      </a>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Delivery Files */}
              {Array.isArray((project as any).deliveryFiles) && (project as any).deliveryFiles.length > 0 ? (
                <div className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                    <Download className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-slate-800">{L ? "ملفات التسليم" : "Delivery Files"}</h3>
                    <Badge className="mr-auto text-[10px] h-5">{(project as any).deliveryFiles.length}</Badge>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(project as any).deliveryFiles.map((file: any, idx: number) => (
                      <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" data-testid={`delivery-file-${idx}`}
                        className="flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-xl transition-all group">
                        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 text-lg">
                          {file.icon || "📄"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-800 truncate">{file.nameAr || (L ? "ملف" : "File")}</p>
                          <p className="text-[10px] text-slate-400 truncate" dir="ltr">{file.url}</p>
                        </div>
                        <Download className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Usage Guide */}
              {(project as any).usageGuide?.description ? (
                <div className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-violet-600" />
                    <h3 className="font-bold text-slate-800">{(project as any).usageGuide?.title || (L ? "دليل الاستخدام" : "Usage Guide")}</h3>
                  </div>
                  <div className="p-5">
                    <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{(project as any).usageGuide.description}</div>
                    {Array.isArray((project as any).usageGuide?.files) && (project as any).usageGuide.files.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{L ? "ملفات الدليل" : "Guide Files"}</p>
                        {(project as any).usageGuide.files.map((f: string, i: number) => (
                          <a key={i} href={f} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2.5 bg-violet-50 hover:bg-violet-100 border border-violet-100 rounded-lg text-sm text-violet-700 transition-colors">
                            <FileText className="w-4 h-4" />
                            <span className="truncate" dir="ltr">{f.split("/").pop() || f}</span>
                            <ExternalLink className="w-3 h-3 mr-auto shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Empty state */}
              {!(project as any).deliveryVideoUrl && !(Array.isArray((project as any).deliveryFiles) && (project as any).deliveryFiles.length > 0) && !(project as any).usageGuide?.description && (
                <Card>
                  <CardContent className="p-12 text-center text-slate-400">
                    <Download className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p className="font-medium mb-1">{L ? "لم يتم رفع ملفات التسليم بعد" : "Delivery files not uploaded yet"}</p>
                    <p className="text-xs text-slate-300">{L ? "سيتم رفع ملفات التسليم والشرح هنا عند اكتمال المشروع" : "Delivery and explanation files will be uploaded here when the project is complete"}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="addons">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  الإضافات والمميزات المفعّلة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAddons ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : addonSubs.length === 0 ? (
                  <div className="py-12 text-center">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-10 text-slate-400" />
                    <p className="text-slate-400 text-sm">{L ? "لا توجد إضافات مفعّلة لهذا المشروع بعد" : "No add-ons activated for this project yet"}</p>
                    <p className="text-slate-300 text-xs mt-1">{L ? "يمكنك طلب إضافة مميزات عبر التواصل مع الفريق" : "You can request feature add-ons by contacting the team"}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addonSubs.map((sub: any) => {
                      const isExpired = sub.status === "expired";
                      const isExhausted = sub.status === "exhausted";
                      const isActive = sub.status === "active";
                      const needsAction = isExpired || isExhausted;
                      const alreadyRequested = !!sub.renewalRequestedAt;

                      const statusConfig: Record<string, { icon: any; label: string; color: string; bg: string }> = {
                        active: { icon: CheckCheck, label: L ? "نشط" : "Active", color: "text-green-700", bg: "bg-green-100" },
                          expired: { icon: XCircle, label: L ? "منتهي الصلاحية" : "Expired", color: "text-red-700", bg: "bg-red-100" },
                          exhausted: { icon: AlertCircle, label: L ? "استُنفدت الحصة" : "Quota Exhausted", color: "text-amber-700", bg: "bg-amber-100" },
                          cancelled: { icon: XCircle, label: L ? "ملغي" : "Cancelled", color: "text-slate-500", bg: "bg-slate-100" },
                      };
                      const st = statusConfig[sub.status] || statusConfig.active;
                      const StatusIcon = st.icon;

                      const billingLabels: Record<string, string> = {
                        one_time: L ? "مرة واحدة" : "One-time",
                        monthly: L ? "شهري" : "Monthly",
                        annual: L ? "سنوي" : "Annual",
                        lifetime: L ? "مدى الحياة" : "Lifetime",
                      };

                      const quotaPct = sub.quotaTotal > 0
                        ? Math.min(100, Math.round((sub.quotaUsed / sub.quotaTotal) * 100))
                        : null;

                      return (
                        <div
                          key={sub._id || sub.id}
                          className={`rounded-2xl border p-4 transition-all ${needsAction ? "border-red-200 bg-red-50/50" : "border-slate-100 bg-white"}`}
                          data-testid={`addon-sub-${sub._id || sub.id}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <p className="font-bold text-slate-800">{sub.addonNameAr || sub.addonId?.nameAr || (L ? "إضافة" : "Add-on")}</p>
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {st.label}
                                </span>
                                {sub.billingType && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                                    {billingLabels[sub.billingType] || sub.billingType}
                                  </span>
                                )}
                              </div>

                              {quotaPct !== null && (
                                <div className="mt-2 mb-1">
                                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                    <span>{L ? "الاستخدام:" : "Usage:"} {sub.quotaUsed} / {sub.quotaTotal} {sub.quotaLabel || ""}</span>
                                    <span>{quotaPct}%</span>
                                  </div>
                                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${quotaPct >= 90 ? "bg-red-400" : quotaPct >= 60 ? "bg-amber-400" : "bg-green-400"}`}
                                      style={{ width: `${quotaPct}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                {sub.startedAt && (
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {L ? "بدأ:" : "Started:"} {new Date(sub.startedAt).toLocaleDateString(L ? "ar-SA" : "en-US")}
                                  </span>
                                )}
                                {sub.expiresAt && (
                                  <span className={`text-[10px] flex items-center gap-1 ${isExpired ? "text-red-500 font-bold" : "text-slate-400"}`}>
                                    <Calendar className="w-3 h-3" />
                                    {isExpired ? (L ? "انتهى:" : "Expired:") : (L ? "ينتهي:" : "Expires:")} {new Date(sub.expiresAt).toLocaleDateString(L ? "ar-SA" : "en-US")}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0 text-left">
                              {needsAction && (
                                alreadyRequested ? (
                                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                                    <CheckCheck className="w-3 h-3" />
                                    تم إرسال طلب التجديد
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    className="h-8 gap-1.5 text-xs rounded-xl"
                                    onClick={() => requestRenewalMutation.mutate(sub._id || sub.id)}
                                    disabled={renewingId === (sub._id || sub.id)}
                                    data-testid={`btn-renew-${sub._id || sub.id}`}
                                  >
                                    {renewingId === (sub._id || sub.id)
                                      ? <Loader2 className="w-3 h-3 animate-spin" />
                                      : <RefreshCw className="w-3 h-3" />}
                                    {L ? "طلب التجديد" : "Request Renewal"}
                                  </Button>
                                )
                              )}
                              {isActive && sub.quotaTotal > 0 && (
                                <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-1">
                                  {L ? "متبقي:" : "Remaining:"} {sub.quotaTotal - sub.quotaUsed} {sub.quotaLabel || ""}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* ══ PROJECT BRIEF TAB ══════════════════════════════════════ */}
          {order?.wizardData && (
            <TabsContent value="brief">
              <ProjectBriefTab order={order} L={L} />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}

/* ─────────── Project Brief Component ─────────── */
function ProjectBriefTab({ order, L }: { order: any; L: boolean }) {
  const wd = order.wizardData || {};

  const handleDownload = () => {
    const lines: string[] = [];
    lines.push("═══════════════════════════════════════");
    lines.push("         ملف المشروع — QIROX Studio");
    lines.push("═══════════════════════════════════════");
    lines.push("");
    lines.push("── معلومات التواصل ──");
    if (wd.businessName) lines.push(`اسم المشروع: ${wd.businessName}`);
    if (wd.email)        lines.push(`البريد: ${wd.email}`);
    if (wd.whatsapp)     lines.push(`واتساب: ${wd.whatsapp}`);
    if (wd.teamSize)     lines.push(`حجم الفريق: ${wd.teamSize}`);
    lines.push("");
    lines.push("── فكرة المشروع ──");
    if (wd.projectIdea)  lines.push(wd.projectIdea);
    if (wd.selectedFeatures?.length) {
      lines.push("");
      lines.push("── المميزات المختارة ──");
      wd.selectedFeatures.forEach((f: string) => lines.push(`• ${f}`));
    }
    if (wd.technicalFeatures?.length) {
      lines.push("");
      lines.push("── المميزات التقنية ──");
      wd.technicalFeatures.forEach((f: string) => lines.push(`• ${f}`));
    }
    if (wd.projectTechIdeas) {
      lines.push("");
      lines.push("── الأفكار التقنية ──");
      lines.push(wd.projectTechIdeas);
    }
    lines.push("");
    lines.push("── تفاصيل إضافية ──");
    if (wd.logoChoice !== undefined)  lines.push(`الشعار: ${wd.logoChoice === "have" ? "يوجد شعار" : "يحتاج تصميم"}`);
    if (wd.brandChoice !== undefined) lines.push(`الهوية: ${wd.brandChoice === "have" ? "يوجد هوية" : "تحتاج تصميم"}`);
    if (wd.expectedCustomers)         lines.push(`العملاء المتوقعون: ${wd.expectedCustomers}`);
    if (wd.technicalLevel)            lines.push(`المستوى التقني: ${wd.technicalLevel}`);
    if (wd.hasDevTeam !== undefined)  lines.push(`مبرمجون خاصون: ${wd.hasDevTeam ? "نعم" : "لا"}`);
    if (wd.devTeamDetails)            lines.push(`تفاصيل المبرمجين: ${wd.devTeamDetails}`);
    if (wd.hadPrevSite !== undefined) lines.push(`موقع سابق: ${wd.hadPrevSite ? "نعم" : "لا"}`);
    if (wd.prevSiteUrl)               lines.push(`رابط الموقع السابق: ${wd.prevSiteUrl}`);
    lines.push("");
    lines.push("── الاجتماع ──");
    if (wd.meetingSlots?.length)  lines.push(`الأوقات: ${wd.meetingSlots.join(" / ")}`);
    if (wd.meetingDays?.length)   lines.push(`الأيام: ${wd.meetingDays.join(" / ")}`);
    if (wd.address?.city)         lines.push(`المدينة: ${wd.address.city}`);
    lines.push("");
    lines.push("── الباقة ──");
    if (wd.planTier)    lines.push(`الباقة: ${wd.planTier}`);
    if (wd.grandTotal)  lines.push(`الإجمالي: ${wd.grandTotal.toLocaleString()} ر.س`);
    lines.push("");
    lines.push("═══════════════════════════════════════");

    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `project-brief-${order.businessName || order._id || "order"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const Row = ({ label, value }: { label: string; value?: string | number | boolean | null }) => {
    if (value === undefined || value === null || value === "") return null;
    const display = typeof value === "boolean" ? (value ? "نعم" : "لا") : String(value);
    return (
      <div className="flex gap-3 text-sm">
        <span className="text-slate-500 shrink-0 w-36">{label}</span>
        <span className="font-medium text-primary flex-1">{display}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header + Download */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-primary">ملف المشروع الكامل</h2>
          <p className="text-sm text-slate-500 mt-0.5">جميع المعلومات التي أدخلتها عند تقديم طلبك</p>
        </div>
        <Button onClick={handleDownload} variant="outline" className="gap-2" data-testid="btn-download-brief">
          <Download className="w-4 h-4" />
          تحميل الملف
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-black">معلومات التواصل</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Row label="اسم المشروع" value={wd.businessName} />
            <Row label="البريد الإلكتروني" value={wd.email} />
            <Row label="رقم الواتساب" value={wd.whatsapp} />
            <Row label="حجم الفريق" value={wd.teamSize} />
          </CardContent>
        </Card>

        {/* Package */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-black">الباقة المختارة</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Row label="الباقة" value={wd.planTier} />
            <Row label="سعر الباقة" value={wd.planPrice ? `${Number(wd.planPrice).toLocaleString()} ر.س` : undefined} />
            <Row label="الإجمالي" value={wd.grandTotal ? `${Number(wd.grandTotal).toLocaleString()} ر.س` : undefined} />
          </CardContent>
        </Card>

        {/* Project Idea */}
        {wd.projectIdea && (
          <Card className="md:col-span-2">
            <CardHeader><CardTitle className="text-sm font-black">فكرة المشروع</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{wd.projectIdea}</p>
            </CardContent>
          </Card>
        )}

        {/* Selected Features */}
        {wd.selectedFeatures?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-black">المميزات المختارة</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {wd.selectedFeatures.map((f: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg">{f}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Technical Features */}
        {wd.technicalFeatures?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-black">المميزات التقنية</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {wd.technicalFeatures.map((f: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">{f}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tech Ideas */}
        {wd.projectTechIdeas && (
          <Card className="md:col-span-2">
            <CardHeader><CardTitle className="text-sm font-black">الأفكار التقنية</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{wd.projectTechIdeas}</p>
            </CardContent>
          </Card>
        )}

        {/* Design & Branding */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-black">التصميم والهوية</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Row label="الشعار" value={wd.logoChoice === "have" ? "يوجد شعار" : wd.logoChoice === "need" ? "يحتاج تصميم" : undefined} />
            <Row label="الهوية البصرية" value={wd.brandChoice === "have" ? "يوجد هوية" : wd.brandChoice === "need" ? "تحتاج تصميم" : undefined} />
            <Row label="العملاء المتوقعون" value={wd.expectedCustomers} />
          </CardContent>
        </Card>

        {/* Technical Profile */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-black">الملف التقني</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Row label="المستوى التقني" value={wd.technicalLevel === "low" ? "مبتدئ" : wd.technicalLevel === "medium" ? "متوسط" : wd.technicalLevel === "high" ? "متقدم" : undefined} />
            <Row label="تفاصيل تقنية" value={wd.technicalDetails} />
            <Row label="مبرمجون خاصون" value={wd.hasDevTeam} />
            <Row label="تفاصيل المبرمجين" value={wd.devTeamDetails} />
            <Row label="موقع سابق" value={wd.hadPrevSite} />
            <Row label="رابط الموقع السابق" value={wd.prevSiteUrl} />
          </CardContent>
        </Card>

        {/* Meeting Preferences */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-sm font-black">تفضيلات الاجتماع</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Row label="الأوقات المفضلة" value={wd.meetingSlots?.join(" / ")} />
            <Row label="الأيام المناسبة" value={wd.meetingDays?.join(" / ")} />
            <Row label="المدينة" value={wd.address?.city} />
          </CardContent>
        </Card>

        {/* Uploaded Files */}
        {wd.uploadedFiles?.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader><CardTitle className="text-sm font-black">الملفات المرفقة</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {wd.uploadedFiles.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
                    data-testid={`link-brief-file-${i}`}>
                    <FileText className="w-3.5 h-3.5" />
                    ملف {i + 1}
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
