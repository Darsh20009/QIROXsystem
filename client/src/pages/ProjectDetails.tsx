import { useProjects } from "@/hooks/use-projects";
import { useTasks } from "@/hooks/use-tasks";
import { useVault } from "@/hooks/use-vault";
import { useUser } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, MessageSquare, CheckCircle2, FileText, Download, ShieldCheck, Link2, Receipt, CreditCard, FileSignature, Bell, Database, Globe, Key, Share2, StickyNote, Mic, Send, Plus, Trash2, Package, AlertCircle, RefreshCw, CheckCheck, Clock, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import SARIcon from "@/components/SARIcon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

export default function ProjectDetails() {
  const [, params] = useRoute("/project/:section");
  const section = params?.section || "status";
  const { data: user } = useUser();
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
    onError: () => toast({ title: "فشل حذف العنصر", variant: "destructive" }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await apiRequest("DELETE", `/api/projects/${project?.id}/tasks/${taskId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id, "tasks"] }),
    onError: () => toast({ title: "فشل حذف المهمة", variant: "destructive" }),
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
      toast({ title: "تم إرسال طلب التجديد", description: "سيتواصل معك الفريق قريباً" });
      setRenewingId(null);
    },
    onError: () => {
      toast({ title: "فشل إرسال الطلب", variant: "destructive" });
      setRenewingId(null);
    },
  });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: "جديد",
      under_study: "قيد الدراسة",
      pending_payment: "بانتظار الدفع",
      in_progress: "جاري التنفيذ",
      testing: "اختبار",
      review: "مراجعة",
      delivery: "تسليم",
      closed: "مغلق"
    };
    return labels[status] || status;
  };

  if (isLoading) return <div className="min-h-full flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  if (!project) return (
    <div className="text-center p-20">
      <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
        <FileText className="w-10 h-10 text-slate-300" />
      </div>
      <p className="text-slate-500 font-medium mb-2">لا توجد مشاريع نشطة حالياً</p>
      <p className="text-xs text-slate-400">سيظهر مشروعك هنا بمجرد موافقة الفريق على طلبك</p>
    </div>
  );

  const order = (project as any).orderId as any;
  const projectTitle = order?.businessName || order?.serviceType || `مشروع #${String(project.id)?.slice(-6)}`;
  const manager = (project as any).managerId as any;
  const pct = project.progress || 0;
  const r = 36, circPx = 2 * Math.PI * r;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;
    sendMessageMutation.mutate(messageContent);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 relative overflow-hidden" dir="rtl">
      <PageGraphics variant="minimal" />

      {/* Creative project header */}
      <div className="bg-gradient-to-br from-black via-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="relative p-6 md:p-8">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }} />
          <div className="relative flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1 min-w-0">
              <Badge className="mb-3 bg-white/10 text-white border-white/10 hover:bg-white/20">{getStatusLabel(project.status)}</Badge>
              <h1 className="text-2xl md:text-3xl font-black text-white mb-1 leading-tight">{projectTitle}</h1>
              {order?.serviceType && order.serviceType !== projectTitle && (
                <p className="text-white/40 text-sm mb-3">{order.serviceType}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-4">
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-widest mb-0.5">بدء التنفيذ</p>
                  <p className="text-white text-sm font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-white/40" />
                    {project.startDate ? new Date(project.startDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : 'قيد الانتظار'}
                  </p>
                </div>
                {project.deadline && (
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-widest mb-0.5">موعد التسليم</p>
                    <p className="text-white text-sm font-semibold">{new Date(project.deadline).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                )}
                {manager?.fullName && (
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-widest mb-0.5">مدير المشروع</p>
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
              <p className="text-white/40 text-[10px]">نسبة الإنجاز</p>
            </div>
          </div>
        </div>
        {/* Phase bar */}
        <div className="flex border-t border-white/[0.06]">
          {["استقبال","دراسة","تنفيذ","اختبار","تسليم"].map((ph, pi) => {
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
          <TabsTrigger value="status" className="data-[state=active]:bg-primary data-[state=active]:text-white">حالة المشروع</TabsTrigger>
          <TabsTrigger value="implementation" className="data-[state=active]:bg-primary data-[state=active]:text-white">مراحل التنفيذ</TabsTrigger>
          <TabsTrigger value="files" className="data-[state=active]:bg-primary data-[state=active]:text-white">ملفات المشروع</TabsTrigger>
          <TabsTrigger value="tools" className="data-[state=active]:bg-primary data-[state=active]:text-white">روابط الأدوات</TabsTrigger>
          <TabsTrigger value="chat" className="data-[state=active]:bg-primary data-[state=active]:text-white">محادثة الفريق</TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-primary data-[state=active]:text-white">الفواتير</TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-primary data-[state=active]:text-white">الدفعات</TabsTrigger>
          <TabsTrigger value="contracts" className="data-[state=active]:bg-primary data-[state=active]:text-white">العقود</TabsTrigger>
          <TabsTrigger value="vault" className="data-[state=active]:bg-primary data-[state=active]:text-white">Vault المشروع</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-primary data-[state=active]:text-white">التنبيهات</TabsTrigger>
          <TabsTrigger value="deliverables" className="data-[state=active]:bg-primary data-[state=active]:text-white">التسليمات</TabsTrigger>
          <TabsTrigger value="addons" className="data-[state=active]:bg-primary data-[state=active]:text-white relative">
            الإضافات
            {addonSubs.some((s: any) => s.status === "expired" || s.status === "exhausted") && (
              <span className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="status">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader><CardTitle className="font-heading">ملخص الحالة</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-slate-600">
                  <p>المشروع يسير وفق الخطة الزمنية المحددة. تم الانتهاء من مرحلة التحليل والتصميم، ونحن الآن في مرحلة البرمجة.</p>
                  <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100">
                    <CheckCircle2 className="w-4 h-4" />
                    تم تسليم جميع متطلبات المرحلة الأولى
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="font-heading">المواعيد</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">بداية المشروع:</span>
                    <span className="font-medium">01/02/2026</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">موعد التسليم:</span>
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
                    <span>مراحل التنفيذ والمهام</span>
                    <Button size="sm" variant="outline"><Plus className="w-4 h-4 ml-2" /> مهمة جديدة</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoadingTasks ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 
                     tasks?.length === 0 ? <p className="text-center text-slate-400 py-8">لا توجد مهام حالياً</p> :
                     tasks?.map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className={`w-5 h-5 ${task.status === 'completed' ? 'text-green-500' : 'text-slate-300'}`} />
                          <div>
                            <p className="font-bold text-primary">{task.title}</p>
                            <p className="text-xs text-slate-500">{task.priority === 'high' ? 'أولوية قصوى' : task.priority}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                            {task.status === 'completed' ? 'مكتملة' : 'قيد التنفيذ'}
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
                <CardHeader><CardTitle className="font-heading">المخطط الزمني</CardTitle></CardHeader>
                <CardContent>
                   <div className="space-y-6">
                    {[
                      { title: "تحليل المتطلبات", status: "completed", date: "05/02/2026" },
                      { title: "تصميم واجهات المستخدم UI/UX", status: "completed", date: "12/02/2026" },
                      { title: "برمجة الواجهة الأمامية", status: "in-progress", date: "25/02/2026" },
                      { title: "تطوير النظام الخلفي والربط", status: "pending", date: "05/03/2026" },
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
                          <p className="text-[10px] text-slate-500 mt-1">الموعد: {step.date}</p>
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
                      {['دليل العلامة التجارية.pdf', 'مواصفات النظام.docx', 'تصاميم Figma.link'].map((file, i) => (
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
                  محادثة الفريق والعميل
                </CardTitle>
                <p className="text-xs text-slate-500">جميع المحادثات محفوظة وغير قابلة للحذف لضمان الجودة</p>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {isLoadingMessages ? (
                      <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin" /></div>
                    ) : messages?.length === 0 ? (
                      <div className="text-center py-20 text-slate-400">ابدأ المحادثة الآن</div>
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
                            {new Date(msg.createdAt).toLocaleTimeString('ar-SA')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                  <Input 
                    placeholder="اكتب رسالتك هنا..." 
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
                    Vault المشروع (البيانات الحساسة)
                  </div>
                  <Button size="sm" variant="secondary"><Plus className="w-4 h-4 ml-2" /> إضافة عنصر</Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingVault ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> :
                 !vaultItems || vaultItems.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border border-secondary/20">
                    <p className="text-slate-600">لا توجد بيانات حساسة مخزنة حالياً في هذا المشروع.</p>
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
                            <Button variant="ghost" size="sm" className="flex-1 text-xs">عرض المحتوى</Button>
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
                    { name: "بيئة التطوير (Staging)", url: "https://staging.qirox.tech" },
                    { name: "لوحة تحكم WordPress", url: "https://site.com/wp-admin" },
                    { name: "رابط Google Drive", url: "#" },
                  ].map((tool, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Link2 className="w-5 h-5 text-primary" />
                        <span className="font-medium text-slate-700">{tool.name}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="text-blue-600">زيارة الرابط</Button>
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
                    <p>سجل الدفعات سيكون متاحاً بعد تأكيد الفاتورة القادمة</p>
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
                    <span className="font-medium">عقد تقديم الخدمات البرمجية.pdf</span>
                  </div>
                  <Badge className="bg-green-100 text-green-700">موقع إلكترونياً</Badge>
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
                    <p className="text-sm text-blue-800">تم تحديث حالة المشروع إلى "قيد التنفيذ"</p>
                    <p className="text-[10px] text-blue-600 mt-1">منذ ساعتين</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deliverables">
            <Card>
              <CardHeader><CardTitle className="font-heading">ملفات التسليم النهائية</CardTitle></CardHeader>
              <CardContent>
                <div className="p-12 text-center text-slate-400">
                  <Download className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  <p>سيتم رفع ملفات التسليم النهائية هنا عند اكتمال المشروع</p>
                </div>
              </CardContent>
            </Card>
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
                    <p className="text-slate-400 text-sm">لا توجد إضافات مفعّلة لهذا المشروع بعد</p>
                    <p className="text-slate-300 text-xs mt-1">يمكنك طلب إضافة مميزات عبر التواصل مع الفريق</p>
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
                        active: { icon: CheckCheck, label: "نشط", color: "text-green-700", bg: "bg-green-100" },
                        expired: { icon: XCircle, label: "منتهي الصلاحية", color: "text-red-700", bg: "bg-red-100" },
                        exhausted: { icon: AlertCircle, label: "استُنفدت الحصة", color: "text-amber-700", bg: "bg-amber-100" },
                        cancelled: { icon: XCircle, label: "ملغي", color: "text-slate-500", bg: "bg-slate-100" },
                      };
                      const st = statusConfig[sub.status] || statusConfig.active;
                      const StatusIcon = st.icon;

                      const billingLabels: Record<string, string> = {
                        one_time: "مرة واحدة",
                        monthly: "شهري",
                        annual: "سنوي",
                        lifetime: "مدى الحياة",
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
                                <p className="font-bold text-slate-800">{sub.addonNameAr || sub.addonId?.nameAr || "إضافة"}</p>
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
                                    <span>الاستخدام: {sub.quotaUsed} / {sub.quotaTotal} {sub.quotaLabel || ""}</span>
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
                                    بدأ: {new Date(sub.startedAt).toLocaleDateString("ar-SA")}
                                  </span>
                                )}
                                {sub.expiresAt && (
                                  <span className={`text-[10px] flex items-center gap-1 ${isExpired ? "text-red-500 font-bold" : "text-slate-400"}`}>
                                    <Calendar className="w-3 h-3" />
                                    {isExpired ? "انتهى:" : "ينتهي:"} {new Date(sub.expiresAt).toLocaleDateString("ar-SA")}
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
                                    طلب التجديد
                                  </Button>
                                )
                              )}
                              {isActive && sub.quotaTotal > 0 && (
                                <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-1">
                                  متبقي: {sub.quotaTotal - sub.quotaUsed} {sub.quotaLabel || ""}
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
        </div>
      </Tabs>
    </div>
  );
}
