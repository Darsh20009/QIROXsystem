import { useUser } from "@/hooks/use-auth";
import { useOrders } from "@/hooks/use-orders";
import { useProjects } from "@/hooks/use-projects";
import { useAttendanceStatus, useCheckIn, useCheckOut } from "@/hooks/use-attendance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, FileText, Activity, Clock, Layers, LogIn, LogOut, TrendingUp, Calendar, CheckCircle2, AlertCircle, Timer, ArrowUpRight, Package, CreditCard, Eye } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const statusMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "قيد المراجعة", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  approved: { label: "تمت الموافقة", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: CheckCircle2 },
  in_progress: { label: "قيد التنفيذ", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", icon: Activity },
  completed: { label: "مكتمل", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: CheckCircle2 },
  rejected: { label: "مرفوض", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: AlertCircle },
  cancelled: { label: "ملغي", color: "text-gray-500", bg: "bg-gray-50 border-gray-200", icon: AlertCircle },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "صباح الخير";
  if (h < 17) return "مساء الخير";
  return "مساء النور";
}

function StatCard({ icon: Icon, label, value, trend, color }: { icon: any; label: string; value: number; trend?: string; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="border border-black/[0.06] shadow-none hover:shadow-md transition-all duration-300 bg-white">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className={`p-2.5 rounded-xl ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            {trend && (
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" />
                {trend}
              </span>
            )}
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-black tracking-tight">{value}</p>
            <p className="text-xs text-black/40 mt-1 font-medium">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const { data: user } = useUser();
  const { data: orders, isLoading: isLoadingOrders } = useOrders();
  const { data: projects, isLoading: isLoadingProjects } = useProjects();
  const { data: attendanceStatus } = useAttendanceStatus();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const { toast } = useToast();
  const [ip, setIp] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(res => res.json())
      .then(data => setIp(data.ip))
      .catch(() => setIp("Unknown"));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-black/20" />
        <p className="text-xs text-black/30 mt-3">جاري التحميل...</p>
      </div>
    </div>
  );

  const handleCheckIn = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        checkInMutation.mutate({
          ipAddress: ip,
          location: { lat: position.coords.latitude, lng: position.coords.longitude }
        }, { onSuccess: () => toast({ title: "تم تسجيل الدخول بنجاح" }) });
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

  const pendingOrders = orders?.filter(o => o.status === 'pending') || [];
  const activeProjects = projects?.filter(p => p.status !== 'completed') || [];
  const completedOrders = orders?.filter(o => o.status === 'completed') || [];
  const totalSpent = orders?.reduce((sum, o) => {
    if (o.status === 'completed' || o.status === 'approved' || o.status === 'in_progress') {
      return sum + (o.totalAmount || 0);
    }
    return sum;
  }, 0) || 0;

  const isEmployee = user.role !== 'client';
  const dateStr = currentTime.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <p className="text-xs text-black/30 font-medium mb-1">{dateStr}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-black font-heading">
              {getGreeting()}، <span className="text-black/60">{user.fullName}</span>
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge className="bg-black/[0.04] text-black/50 border-0 text-[10px] font-medium px-2.5">
                {user.role === 'client' ? 'عميل' : user.role === 'admin' ? 'مدير النظام' : user.role}
              </Badge>
              <span className="text-[10px] text-black/25">{user.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEmployee && (
              <div className="flex items-center gap-2 bg-black/[0.02] p-1.5 rounded-xl border border-black/[0.06]">
                {!attendanceStatus || attendanceStatus.checkOut ? (
                  <Button
                    size="sm"
                    className="bg-black text-white hover:bg-black/80 text-xs h-8 px-4"
                    onClick={handleCheckIn}
                    disabled={checkInMutation.isPending}
                    data-testid="button-check-in"
                  >
                    <LogIn className="w-3.5 h-3.5 ml-1.5" />
                    تسجيل دخول
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 text-xs h-8 px-4"
                    onClick={handleCheckOut}
                    disabled={checkOutMutation.isPending}
                    data-testid="button-check-out"
                  >
                    <LogOut className="w-3.5 h-3.5 ml-1.5" />
                    تسجيل خروج
                  </Button>
                )}
                {attendanceStatus && !attendanceStatus.checkOut && (
                  <div className="px-3 py-1 text-[10px] font-bold text-black/40 flex items-center gap-1.5">
                    <Timer className="w-3 h-3 text-green-500 animate-pulse" />
                    {new Date(attendanceStatus.checkIn).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            )}
            <Link href="/order">
              <Button className="bg-black text-white hover:bg-black/80 font-bold h-9 px-5 text-xs" data-testid="button-new-order">
                <Plus className="w-4 h-4 ml-1.5" />
                طلب جديد
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileText} label="إجمالي الطلبات" value={orders?.length || 0} color="bg-blue-50 text-blue-600" />
        <StatCard icon={Layers} label="المشاريع النشطة" value={activeProjects.length} color="bg-indigo-50 text-indigo-600" />
        <StatCard icon={Clock} label="قيد الانتظار" value={pendingOrders.length} color="bg-amber-50 text-amber-600" />
        <StatCard icon={CheckCircle2} label="مكتملة" value={completedOrders.length} color="bg-green-50 text-green-600" />
      </div>

      {totalSpent > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
          <Card className="border border-black/[0.06] bg-gradient-to-l from-black/[0.02] to-transparent shadow-none">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-black/[0.04] rounded-xl">
                  <CreditCard className="w-5 h-5 text-black/40" />
                </div>
                <div>
                  <p className="text-xs text-black/35 font-medium">إجمالي الاستثمار</p>
                  <p className="text-2xl font-bold text-black tracking-tight">{totalSpent.toLocaleString()} <span className="text-sm text-black/30">ر.س</span></p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-black/25">خدمات فعّالة</p>
                <p className="text-lg font-bold text-black">{(orders?.filter(o => o.status !== 'pending' && o.status !== 'rejected').length) || 0}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-black flex items-center gap-2">
              <Package className="w-4 h-4 text-black/30" />
              المشاريع الجارية
            </h2>
            {projects && projects.length > 0 && (
              <Link href="/project/status">
                <button className="text-[10px] text-black/30 hover:text-black/60 transition-colors flex items-center gap-1" data-testid="link-all-projects">
                  عرض الكل
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </Link>
            )}
          </div>

          {isLoadingProjects ? (
            <div className="p-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-black/15" />
            </div>
          ) : !projects || projects.length === 0 ? (
            <Card className="border-2 border-dashed border-black/[0.06] shadow-none bg-black/[0.01]">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-black/[0.03] rounded-2xl flex items-center justify-center mb-4">
                  <Layers className="w-8 h-8 text-black/15" />
                </div>
                <h3 className="text-sm font-bold text-black/60 mb-1">لا توجد مشاريع حالياً</h3>
                <p className="text-xs text-black/30 mb-6 max-w-[250px]">ابدأ بطلب خدمة جديدة وسنبدأ بتنفيذ مشروعك فوراً</p>
                <Link href="/order">
                  <Button size="sm" className="bg-black text-white hover:bg-black/80 text-xs h-8 px-5" data-testid="button-browse-services">
                    <Plus className="w-3.5 h-3.5 ml-1.5" />
                    تصفح الخدمات
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {projects.map((project, i) => (
                <motion.div key={project.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="border border-black/[0.06] shadow-none hover:shadow-md transition-all duration-300 bg-white overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-4 p-5">
                        <div className="w-11 h-11 bg-black/[0.03] rounded-xl flex items-center justify-center shrink-0">
                          <Activity className="w-5 h-5 text-black/25" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-sm text-black truncate">مشروع #{project.id}</h4>
                            <Badge className={`text-[9px] h-4 px-1.5 border ${statusMap[project.status]?.bg || 'bg-gray-50 border-gray-200'} ${statusMap[project.status]?.color || 'text-gray-600'}`}>
                              {statusMap[project.status]?.label || project.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-black/30">
                            <span className="font-medium">التقدم: {project.progress}%</span>
                            {project.createdAt && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" />
                                {new Date(project.createdAt).toLocaleDateString('ar-SA')}
                              </span>
                            )}
                          </div>
                        </div>
                        <Link href="/project/status">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-black/20 hover:text-black/60" data-testid={`button-project-details-${project.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                      <div className="h-1 bg-black/[0.03] w-full">
                        <motion.div
                          className="h-full bg-black/80 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${project.progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-black flex items-center gap-2">
              <FileText className="w-4 h-4 text-black/30" />
              سجل الطلبات
            </h2>
          </div>

          <Card className="border border-black/[0.06] shadow-none bg-white">
            <CardContent className="p-0">
              {isLoadingOrders ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-black/15" />
                </div>
              ) : !orders || orders.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 bg-black/[0.02] rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-5 h-5 text-black/15" />
                  </div>
                  <p className="text-xs text-black/25">لا توجد طلبات سابقة</p>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.04]">
                  {orders.slice(0, 8).map((order, i) => {
                    const st = statusMap[order.status] || statusMap['pending'];
                    const StatusIcon = st.icon;
                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="p-4 hover:bg-black/[0.01] transition-colors"
                        data-testid={`order-item-${order.id}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className={`p-1.5 rounded-lg ${st.bg} border shrink-0 mt-0.5`}>
                              <StatusIcon className={`w-3 h-3 ${st.color}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-black truncate">
                                طلب #{order.id?.toString().slice(-6)}
                              </p>
                              <p className="text-[10px] text-black/25 mt-0.5">
                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }) : ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-left shrink-0">
                            <Badge className={`text-[9px] h-4 px-1.5 border ${st.bg} ${st.color}`}>
                              {st.label}
                            </Badge>
                            {order.totalAmount ? (
                              <p className="text-[10px] font-bold text-black/40 mt-1">{order.totalAmount.toLocaleString()} ر.س</p>
                            ) : null}
                          </div>
                        </div>
                        {order.paymentMethod && (
                          <div className="mt-2 flex items-center gap-2 text-[10px] text-black/20">
                            <CreditCard className="w-2.5 h-2.5" />
                            {order.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'PayPal'}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {user.role === 'client' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border border-black/[0.06] shadow-none bg-black text-white overflow-hidden">
            <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-bold mb-1">هل تحتاج مساعدة في مشروعك؟</h3>
                <p className="text-white/50 text-xs max-w-md">فريقنا جاهز لمساعدتك في تحويل فكرتك إلى واقع رقمي متكامل. تواصل معنا الآن.</p>
              </div>
              <Link href="/contact">
                <Button className="bg-white text-black hover:bg-white/90 font-bold h-10 px-6 text-xs shrink-0" data-testid="button-contact-support">
                  تواصل معنا
                  <ArrowUpRight className="w-4 h-4 mr-1.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
