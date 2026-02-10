import { useProject } from "@/hooks/use-projects";
import { useTasks } from "@/hooks/use-tasks";
import { useVault } from "@/hooks/use-vault";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, MessageSquare, CheckCircle2, FileText, Download, ShieldCheck, Link2, Receipt, CreditCard, FileSignature, Bell, Database, Globe, Key, Share2, StickyNote, Mic } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export default function ProjectDetails() {
  const [, params] = useRoute("/project/:section");
  const section = params?.section || "status";
  const { data: projectOrProjects, isLoading } = useProject(1); // Default to first project for MVP
  const project = Array.isArray(projectOrProjects) ? projectOrProjects[0] : projectOrProjects;
  const { data: tasks, isLoading: isLoadingTasks } = useTasks(project?.id);
  const { data: vaultItems, isLoading: isLoadingVault } = useVault(project?.id);

  if (isLoading) return <div className="min-h-full flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  if (!project) return <div className="text-center p-20 text-slate-500 font-medium">المشروع غير موجود</div>;

  return (
    <div className="p-4 md:p-8 space-y-8">
        {/* ... (previous header code) */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <Badge className="mb-2 bg-secondary text-primary hover:bg-secondary/90">{project.status}</Badge>
               <h1 className="text-2xl md:text-3xl font-bold font-heading text-primary">مشروع: {project.id}</h1>
            </div>
            <div className="text-right">
               <div className="text-xs text-slate-500 mb-1">تاريخ البدء</div>
               <div className="font-semibold flex items-center gap-2 text-primary">
                  <Calendar className="w-4 h-4 text-secondary" />
                  {project.startDate ? new Date(project.startDate).toLocaleDateString('ar-SA') : 'قيد الانتظار'}
               </div>
            </div>
         </div>
         
         <div className="mt-8">
            <div className="flex justify-between text-sm mb-2 font-medium text-slate-700">
               <span>نسبة الإنجاز</span>
               <span>{project.progress}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-secondary transition-all duration-1000 ease-out shadow-sm" style={{ width: `${project.progress}%` }}></div>
            </div>
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
                      <div key={task.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className={`w-5 h-5 ${task.status === 'completed' ? 'text-green-500' : 'text-slate-300'}`} />
                          <div>
                            <p className="font-bold text-primary">{task.title}</p>
                            <p className="text-xs text-slate-500">{task.priority === 'high' ? 'أولوية قصوى' : task.priority}</p>
                          </div>
                        </div>
                        <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                          {task.status === 'completed' ? 'مكتملة' : 'قيد التنفيذ'}
                        </Badge>
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
            <Card>
              <CardHeader><CardTitle className="font-heading">محادثة الفريق</CardTitle></CardHeader>
              <CardContent className="h-[400px] flex flex-col justify-center items-center text-slate-400 bg-slate-50/50 border-2 border-dashed rounded-xl m-4">
                <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                <p>المحادثة الجماعية للمشروع سيتم تفعيلها قريباً</p>
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
                          <Button variant="ghost" size="sm" className="w-full mt-4 text-xs">عرض المحتوى</Button>
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
        </div>
      </Tabs>
    </div>
  );
}
