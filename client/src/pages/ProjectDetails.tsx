import Navigation from "@/components/Navigation";
import { useProject } from "@/hooks/use-projects";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Link as LinkIcon, MessageSquare } from "lucide-react";

export default function ProjectDetails() {
  const [, params] = useRoute("/projects/:id");
  const projectId = parseInt(params?.id || "0");
  const { data: project, isLoading } = useProject(projectId);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  if (!project) return <div className="text-center p-20">المشروع غير موجود</div>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 pt-32">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                 <Badge className="mb-2">{project.status}</Badge>
                 <h1 className="text-3xl font-bold font-heading text-primary">تفاصيل المشروع #{project.id}</h1>
              </div>
              <div className="text-left">
                 <div className="text-sm text-slate-500 mb-1">تاريخ البدء</div>
                 <div className="font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-secondary" />
                    {project.startDate ? new Date(project.startDate).toLocaleDateString('ar-SA') : 'لم يبدأ بعد'}
                 </div>
              </div>
           </div>
           
           <div className="mt-8">
              <div className="flex justify-between text-sm mb-2 font-medium">
                 <span>نسبة الإنجاز</span>
                 <span>{project.progress}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-secondary transition-all duration-1000 ease-out" style={{ width: `${project.progress}%` }}></div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-8">
              <Card>
                 <CardHeader>
                    <CardTitle className="font-heading">روابط المشروع</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <div className="space-y-4">
                       {project.stagingUrl ? (
                         <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-3">
                               <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                  <LinkIcon className="w-5 h-5" />
                               </div>
                               <div>
                                  <p className="font-bold text-slate-800">رابط المعاينة</p>
                                  <a href={project.stagingUrl} target="_blank" className="text-sm text-blue-600 hover:underline">{project.stagingUrl}</a>
                               </div>
                            </div>
                         </div>
                       ) : (
                         <p className="text-slate-500 text-center py-4">لا توجد روابط متاحة حالياً</p>
                       )}
                    </div>
                 </CardContent>
              </Card>

              {/* Chat Placeholder - In a real app this would be a full chat component */}
              <Card>
                 <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                       <MessageSquare className="w-5 h-5" />
                       المحادثات
                    </CardTitle>
                 </CardHeader>
                 <CardContent>
                    <div className="bg-slate-50 rounded-xl p-8 text-center text-slate-500 border border-dashed border-slate-200">
                       ميزة المحادثة ستكون متاحة قريباً
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>
      </div>
    </div>
  );
}
