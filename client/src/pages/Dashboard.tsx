import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useUser } from "@/hooks/use-auth";
import { useOrders } from "@/hooks/use-orders";
import { useProjects } from "@/hooks/use-projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, FileText, Activity, Clock, Layers } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: user } = useUser();
  const { data: orders, isLoading: isLoadingOrders } = useOrders();
  const { data: projects, isLoading: isLoadingProjects } = useProjects();

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 pt-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold font-heading text-primary">لوحة التحكم</h1>
            <p className="text-slate-500 mt-1">أهلاً بك، {user.fullName}</p>
          </div>
          <Link href="/services">
             <Button className="bg-secondary hover:bg-secondary/90 text-primary font-bold shadow-lg shadow-secondary/20">
               <Plus className="w-5 h-5 ml-2" />
               طلب جديد
             </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
           <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
             <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                   <div className="p-3 bg-blue-100 rounded-xl text-primary">
                      <FileText className="w-6 h-6" />
                   </div>
                   <span className="text-slate-500 text-sm font-medium">الطلبات الكلية</span>
                </div>
                <div className="text-3xl font-bold text-slate-800">{orders?.length || 0}</div>
             </CardContent>
           </Card>

           <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
             <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                   <div className="p-3 bg-green-100 rounded-xl text-green-700">
                      <Layers className="w-6 h-6" />
                   </div>
                   <span className="text-slate-500 text-sm font-medium">المشاريع النشطة</span>
                </div>
                <div className="text-3xl font-bold text-slate-800">{projects?.length || 0}</div>
             </CardContent>
           </Card>
           
           <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
             <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                   <div className="p-3 bg-yellow-100 rounded-xl text-yellow-700">
                      <Clock className="w-6 h-6" />
                   </div>
                   <span className="text-slate-500 text-sm font-medium">في الانتظار</span>
                </div>
                <div className="text-3xl font-bold text-slate-800">
                  {orders?.filter(o => o.status === 'pending').length || 0}
                </div>
             </CardContent>
           </Card>

           <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
             <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                   <div className="p-3 bg-purple-100 rounded-xl text-purple-700">
                      <Activity className="w-6 h-6" />
                   </div>
                   <span className="text-slate-500 text-sm font-medium">المكتملة</span>
                </div>
                <div className="text-3xl font-bold text-slate-800">
                  {orders?.filter(o => o.status === 'completed').length || 0}
                </div>
             </CardContent>
           </Card>
        </div>

        {/* Recent Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold font-heading text-primary flex items-center gap-2">
                 <Layers className="w-5 h-5 text-secondary" />
                 المشاريع الجارية
              </h2>
              
              {isLoadingProjects ? (
                <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" /></div>
              ) : projects?.length === 0 ? (
                <Card className="border-dashed border-2 bg-slate-50/50">
                   <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Layers className="w-12 h-12 text-slate-300 mb-4" />
                      <h3 className="text-lg font-semibold text-slate-700">لا توجد مشاريع حالياً</h3>
                      <p className="text-slate-500 mb-4">ابدأ بطلب خدمة جديدة لبدء مشروعك الأول</p>
                      <Link href="/services"><Button variant="outline">تصفح الخدمات</Button></Link>
                   </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                   {projects?.map(project => (
                     <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <div className="flex items-center p-6 gap-4">
                           <div className="w-12 h-12 bg-primary/5 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Activity className="w-6 h-6 text-primary" />
                           </div>
                           <div className="flex-1">
                              <h4 className="font-bold text-lg text-primary mb-1">مشروع #{project.id}</h4>
                              <div className="flex items-center gap-4 text-sm text-slate-500">
                                 <span>الحالة: {project.status}</span>
                                 <span>التقدم: {project.progress}%</span>
                              </div>
                           </div>
                           <Link href={`/projects/${project.id}`}>
                              <Button size="sm" variant="secondary">التفاصيل</Button>
                           </Link>
                        </div>
                        <div className="h-1 bg-slate-100 w-full">
                           <div className="h-full bg-secondary transition-all duration-500" style={{ width: `${project.progress}%` }}></div>
                        </div>
                     </Card>
                   ))}
                </div>
              )}
           </div>

           <div>
              <h2 className="text-xl font-bold font-heading text-primary flex items-center gap-2 mb-6">
                 <FileText className="w-5 h-5 text-secondary" />
                 آخر الطلبات
              </h2>
              <Card>
                 <CardContent className="p-0">
                    {isLoadingOrders ? (
                      <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>
                    ) : orders?.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm">لا توجد طلبات سابقة</div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                         {orders?.slice(0, 5).map(order => (
                           <div key={order.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                              <div>
                                 <p className="font-medium text-slate-800 text-sm">طلب خدمة #{order.serviceId}</p>
                                 <p className="text-xs text-slate-500 mt-1">
                                    {new Date(order.createdAt!).toLocaleDateString('ar-SA')}
                                 </p>
                              </div>
                              <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                                 {order.status === 'pending' ? 'قيد المراجعة' : 
                                  order.status === 'completed' ? 'مكتمل' : order.status}
                              </Badge>
                           </div>
                         ))}
                      </div>
                    )}
                 </CardContent>
              </Card>
           </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
