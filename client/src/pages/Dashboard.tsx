import { useUser } from "@/hooks/use-auth";
import { useOrders } from "@/hooks/use-orders";
import { useProjects } from "@/hooks/use-projects";
import { useAttendanceStatus, useCheckIn, useCheckOut } from "@/hooks/use-attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, FileText, Activity, Clock, Layers, LogIn, LogOut, MapPin } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { data: user } = useUser();
  const { data: orders, isLoading: isLoadingOrders } = useOrders();
  const { data: projects, isLoading: isLoadingProjects } = useProjects();
  const { data: attendanceStatus } = useAttendanceStatus();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const { toast } = useToast();
  const [ip, setIp] = useState<string>("");

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(res => res.json())
      .then(data => setIp(data.ip))
      .catch(() => setIp("Unknown"));
  }, []);

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  const handleCheckIn = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        checkInMutation.mutate({
          ipAddress: ip,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }, {
          onSuccess: () => toast({ title: "تم تسجيل الدخول بنجاح" })
        });
      }, () => {
        checkInMutation.mutate({ ipAddress: ip }, {
          onSuccess: () => toast({ title: "تم تسجيل الدخول بنجاح (بدون موقع)" })
        });
      });
    } else {
      checkInMutation.mutate({ ipAddress: ip });
    }
  };

  const handleCheckOut = () => {
    checkOutMutation.mutate(undefined, {
      onSuccess: () => toast({ title: "تم تسجيل الخروج بنجاح" })
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-heading text-primary">لوحة التحكم</h1>
            <p className="text-slate-500 mt-1 font-medium">أهلاً بك، {user.fullName}</p>
          </div>
          <div className="flex items-center gap-2">
            {user.role !== 'client' && (
              <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                {!attendanceStatus || attendanceStatus.checkOut ? (
                  <Button 
                    size="sm" 
                    variant="default" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleCheckIn}
                    disabled={checkInMutation.isPending}
                  >
                    <LogIn className="w-4 h-4 ml-2" />
                    تسجيل دخول
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={handleCheckOut}
                    disabled={checkOutMutation.isPending}
                  >
                    <LogOut className="w-4 h-4 ml-2" />
                    تسجيل خروج
                  </Button>
                )}
                {attendanceStatus && !attendanceStatus.checkOut && (
                  <div className="px-3 py-1 text-xs font-bold text-primary flex items-center gap-2">
                    <Clock className="w-3 h-3 text-secondary" />
                    {new Date(attendanceStatus.checkIn).toLocaleTimeString('ar-SA')}
                  </div>
                )}
              </div>
            )}
            <Link href="/order">
               <Button className="bg-secondary hover:bg-secondary/90 text-primary font-bold shadow-lg shadow-secondary/20 min-h-10">
                 <Plus className="w-5 h-5 ml-2" />
                 طلب جديد
               </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <Card className="border-none shadow-sm hover-elevate bg-white">
             <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                   <div className="p-3 bg-blue-50 rounded-xl text-primary border border-blue-100">
                      <FileText className="w-6 h-6" />
                   </div>
                   <span className="text-slate-500 text-sm font-semibold">الطلبات</span>
                </div>
                <div className="text-3xl font-bold text-primary">{orders?.length || 0}</div>
             </CardContent>
           </Card>

           <Card className="border-none shadow-sm hover-elevate bg-white">
             <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                   <div className="p-3 bg-secondary/10 rounded-xl text-primary border border-secondary/20">
                      <Layers className="w-6 h-6" />
                   </div>
                   <span className="text-slate-500 text-sm font-semibold">المشاريع</span>
                </div>
                <div className="text-3xl font-bold text-primary">{projects?.length || 0}</div>
             </CardContent>
           </Card>
           
           <Card className="border-none shadow-sm hover-elevate bg-white">
             <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                   <div className="p-3 bg-yellow-50 rounded-xl text-yellow-700 border border-yellow-100">
                      <Clock className="w-6 h-6" />
                   </div>
                   <span className="text-slate-500 text-sm font-semibold">قيد الانتظار</span>
                </div>
                <div className="text-3xl font-bold text-primary">
                  {orders?.filter(o => o.status === 'pending').length || 0}
                </div>
             </CardContent>
           </Card>

           <Card className="border-none shadow-sm hover-elevate bg-white">
             <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                   <div className="p-3 bg-green-50 rounded-xl text-green-700 border border-green-100">
                      <Activity className="w-6 h-6" />
                   </div>
                   <span className="text-slate-500 text-sm font-semibold">مكتملة</span>
                </div>
                <div className="text-3xl font-bold text-primary">
                  {orders?.filter(o => o.status === 'completed').length || 0}
                </div>
             </CardContent>
           </Card>
        </div>

        {/* Recent Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
           <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold font-heading text-primary flex items-center gap-2">
                 <Layers className="w-5 h-5 text-secondary" />
                 المشاريع الجارية
              </h2>
              
              {isLoadingProjects ? (
                <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" /></div>
              ) : !projects || projects?.length === 0 ? (
                <Card className="border-dashed border-2 bg-white/50">
                   <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Layers className="w-12 h-12 text-slate-300 mb-4" />
                      <h3 className="text-lg font-semibold text-slate-700">لا توجد مشاريع حالياً</h3>
                      <p className="text-slate-500 mb-6">ابدأ بطلب خدمة جديدة لبدء مشروعك الأول</p>
                      <Link href="/order"><Button variant="secondary" className="font-bold">تصفح الخدمات</Button></Link>
                   </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                   {projects?.map(project => (
                     <Card key={project.id} className="overflow-hidden shadow-sm hover-elevate bg-white border-none">
                        <div className="flex items-center p-6 gap-4">
                           <div className="w-12 h-12 bg-primary/5 rounded-lg flex items-center justify-center shrink-0 border border-primary/10">
                              <Activity className="w-6 h-6 text-primary" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-lg text-primary truncate">مشروع #{project.id}</h4>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                                 <Badge variant="outline" className="text-[10px] h-5">{project.status}</Badge>
                                 <span className="font-medium">التقدم: {project.progress}%</span>
                              </div>
                           </div>
                           <Link href={`/project/status`}>
                              <Button size="sm" variant="secondary" className="font-bold h-9">التفاصيل</Button>
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
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                 <CardContent className="p-0">
                    {isLoadingOrders ? (
                      <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>
                    ) : !orders || orders?.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 text-sm">لا توجد طلبات سابقة</div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                         {orders?.slice(0, 5).map(order => (
                           <div key={order.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                              <div className="min-w-0">
                                 <p className="font-bold text-slate-800 text-sm truncate">طلب خدمة #{order.serviceId}</p>
                                 <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                    {new Date(order.createdAt!).toLocaleDateString('ar-SA')}
                                 </p>
                              </div>
                              <Badge 
                                className={`text-[10px] h-5 ${
                                  order.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                  'bg-secondary/20 text-primary'
                                }`}
                              >
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
  );
}
