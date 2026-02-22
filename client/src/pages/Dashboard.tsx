import { useUser } from "@/hooks/use-auth";
import { useOrders } from "@/hooks/use-orders";
import { useProjects } from "@/hooks/use-projects";
import { useAttendanceStatus, useCheckIn, useCheckOut } from "@/hooks/use-attendance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, FileText, Activity, Clock, Layers, LogIn, LogOut, TrendingUp, Calendar, CheckCircle2, AlertCircle, Timer, ArrowUpRight, Package, CreditCard, Eye, Wrench, Users, DollarSign, Settings, LayoutGrid, Handshake, ShoppingBag, UserCog } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { ModificationRequest, Order } from "@shared/schema";

const statusMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "قيد المراجعة", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  approved: { label: "تمت الموافقة", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: CheckCircle2 },
  in_progress: { label: "قيد التنفيذ", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", icon: Activity },
  completed: { label: "مكتمل", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: CheckCircle2 },
  rejected: { label: "مرفوض", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: AlertCircle },
  cancelled: { label: "ملغي", color: "text-gray-500", bg: "bg-gray-50 border-gray-200", icon: AlertCircle },
};

const modStatusMap: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "قيد الانتظار", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  in_review: { label: "قيد المراجعة", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  in_progress: { label: "قيد التنفيذ", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
  completed: { label: "مكتمل", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  rejected: { label: "مرفوض", color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

const priorityMap: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: "منخفض", color: "text-gray-600", bg: "bg-gray-50 border-gray-200" },
  medium: { label: "متوسط", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  high: { label: "عالي", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  urgent: { label: "عاجل", color: "text-red-600", bg: "bg-red-50 border-red-200" },
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

interface AdminStats {
  totalOrders: number;
  pendingOrders: number;
  activeProjects: number;
  totalRevenue: number;
  totalClients: number;
  totalEmployees: number;
  totalServices: number;
  recentOrders: Order[];
  recentModRequests: ModificationRequest[];
}

const adminOrderStatusMap: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "قيد المراجعة", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  approved: { label: "تمت الموافقة", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  in_progress: { label: "قيد التنفيذ", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
  completed: { label: "مكتمل", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  rejected: { label: "مرفوض", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  cancelled: { label: "ملغي", color: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
};

const quickActions = [
  { label: "إدارة الخدمات", href: "/admin/services", icon: Settings, desc: "إضافة وتعديل الخدمات" },
  { label: "إدارة الطلبات", href: "/admin/orders", icon: ShoppingBag, desc: "متابعة جميع الطلبات" },
  { label: "إدارة الموظفين", href: "/admin/employees", icon: UserCog, desc: "إدارة فريق العمل" },
  { label: "إدارة القوالب", href: "/admin/templates", icon: LayoutGrid, desc: "قوالب القطاعات" },
  { label: "إدارة الشركاء", href: "/admin/partners", icon: Handshake, desc: "شركاء النجاح" },
];

function AdminDashboard({ user }: { user: any }) {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const currentTime = new Date();
  const dateStr = currentTime.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const chartData = [
    { name: "الطلبات", value: stats?.totalOrders || 0 },
    { name: "المشاريع", value: stats?.activeProjects || 0 },
    { name: "العملاء", value: stats?.totalClients || 0 },
    { name: "الموظفين", value: stats?.totalEmployees || 0 },
    { name: "الخدمات", value: stats?.totalServices || 0 },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-black/20" />
          <p className="text-xs text-black/30 mt-3">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto" data-testid="admin-dashboard">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-xs text-black/30 font-medium mb-1">{dateStr}</p>
        <h1 className="text-2xl md:text-3xl font-bold text-black font-heading" data-testid="text-admin-greeting">
          مرحباً، <span className="text-black/60">{user.fullName}</span>
        </h1>
        <div className="flex items-center flex-wrap gap-3 mt-2">
          <Badge className="bg-black text-white border-0 text-[10px] font-medium px-2.5">
            مدير النظام
          </Badge>
          <span className="text-[10px] text-black/25">{user.email}</span>
          <span className="text-[10px] text-black/25">|</span>
          <span className="text-[10px] text-black/30 font-medium">{stats?.totalOrders || 0} طلب · {stats?.totalClients || 0} عميل · {stats?.totalEmployees || 0} موظف</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileText} label="إجمالي الطلبات" value={stats?.totalOrders || 0} color="bg-blue-50 text-blue-600" />
        <StatCard icon={Activity} label="المشاريع النشطة" value={stats?.activeProjects || 0} color="bg-indigo-50 text-indigo-600" />
        <StatCard icon={DollarSign} label="إجمالي الإيرادات (ر.س)" value={stats?.totalRevenue || 0} color="bg-green-50 text-green-600" />
        <StatCard icon={Users} label="إجمالي العملاء" value={stats?.totalClients || 0} color="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-black flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-black/30" />
                أحدث الطلبات
              </h2>
              <Link href="/admin/orders">
                <button className="text-[10px] text-black/30 hover:text-black/60 transition-colors flex items-center gap-1" data-testid="link-admin-all-orders">
                  عرض الكل
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </Link>
            </div>
            <Card className="border border-black/[0.06] shadow-none bg-white">
              <CardContent className="p-0">
                {!stats?.recentOrders || stats.recentOrders.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 bg-black/[0.02] rounded-xl flex items-center justify-center mx-auto mb-3">
                      <ShoppingBag className="w-5 h-5 text-black/15" />
                    </div>
                    <p className="text-xs text-black/25">لا توجد طلبات بعد</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right" data-testid="table-recent-orders">
                      <thead>
                        <tr className="border-b border-black/[0.06]">
                          <th className="p-4 text-[10px] font-bold text-black/40 uppercase tracking-wider">رقم الطلب</th>
                          <th className="p-4 text-[10px] font-bold text-black/40 uppercase tracking-wider">الحالة</th>
                          <th className="p-4 text-[10px] font-bold text-black/40 uppercase tracking-wider">المبلغ</th>
                          <th className="p-4 text-[10px] font-bold text-black/40 uppercase tracking-wider">التاريخ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.04]">
                        {stats.recentOrders.map((order: any, i: number) => {
                          const st = adminOrderStatusMap[order.status] || adminOrderStatusMap['pending'];
                          return (
                            <motion.tr
                              key={order.id || i}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.05 }}
                              className="hover:bg-black/[0.01] transition-colors"
                              data-testid={`admin-order-row-${order.id}`}
                            >
                              <td className="p-4 text-xs font-bold text-black">#{order.id?.toString().slice(-6)}</td>
                              <td className="p-4">
                                <Badge className={`text-[9px] h-4 px-1.5 border ${st.bg} ${st.color}`}>
                                  {st.label}
                                </Badge>
                              </td>
                              <td className="p-4 text-xs font-bold text-black/60">{Number(order.totalAmount || 0).toLocaleString()} ر.س</td>
                              <td className="p-4 text-[10px] text-black/30">
                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }) : '-'}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h2 className="text-base font-bold text-black flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-black/30" />
              نظرة عامة
            </h2>
            <Card className="border border-black/[0.06] shadow-none bg-white">
              <CardContent className="p-5">
                <div className="h-[200px]" data-testid="chart-overview">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 11, fill: "rgba(0,0,0,0.4)" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "none" }}
                        cursor={{ fill: "rgba(0,0,0,0.02)" }}
                      />
                      <Bar dataKey="value" fill="rgba(0,0,0,0.8)" radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-black flex items-center gap-2">
            <Wrench className="w-4 h-4 text-black/30" />
            أحدث طلبات التعديل
          </h2>
        </div>
        {!stats?.recentModRequests || stats.recentModRequests.length === 0 ? (
          <Card className="border-2 border-dashed border-black/[0.06] shadow-none bg-black/[0.01]">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 bg-black/[0.03] rounded-xl flex items-center justify-center mb-3">
                <Wrench className="w-5 h-5 text-black/15" />
              </div>
              <p className="text-xs text-black/25">لا توجد طلبات تعديل</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.recentModRequests.map((req: any, i: number) => {
              const st = modStatusMap[req.status] || modStatusMap['pending'];
              const pr = priorityMap[req.priority] || priorityMap['medium'];
              return (
                <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="border border-black/[0.06] shadow-none hover:shadow-md transition-all duration-300 bg-white" data-testid={`admin-mod-request-${req.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-bold text-xs text-black truncate flex-1">{req.title}</h4>
                        <Badge className={`text-[9px] h-4 px-1.5 border shrink-0 ${st.bg} ${st.color}`}>
                          {st.label}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-black/35 line-clamp-2 mb-3">{req.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge className={`text-[9px] h-4 px-1.5 border ${pr.bg} ${pr.color}`}>
                          {pr.label}
                        </Badge>
                        {req.createdAt && (
                          <span className="text-[10px] text-black/25 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {new Date(req.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h2 className="text-base font-bold text-black flex items-center gap-2 mb-4">
          <LayoutGrid className="w-4 h-4 text-black/30" />
          إجراءات سريعة
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions.map((action, i) => (
            <motion.div key={action.href} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
              <Link href={action.href}>
                <Card className="border border-black/[0.06] shadow-none hover:shadow-md transition-all duration-300 bg-white cursor-pointer group" data-testid={`link-admin-action-${action.href.replace(/\//g, '-')}`}>
                  <CardContent className="p-4 text-center">
                    <div className="w-10 h-10 bg-black/[0.03] rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-black/[0.06] transition-colors">
                      <action.icon className="w-5 h-5 text-black/30" />
                    </div>
                    <h4 className="font-bold text-xs text-black mb-0.5">{action.label}</h4>
                    <p className="text-[10px] text-black/30">{action.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
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
  const [modDialogOpen, setModDialogOpen] = useState(false);
  const [modTitle, setModTitle] = useState("");
  const [modDescription, setModDescription] = useState("");
  const [modPriority, setModPriority] = useState<string>("medium");
  const [modProjectId, setModProjectId] = useState<string>("");

  const { data: modRequests, isLoading: isLoadingModRequests } = useQuery<ModificationRequest[]>({
    queryKey: ['/api/modification-requests'],
  });

  const createModRequestMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; priority: string; projectId?: string }) => {
      const res = await apiRequest("POST", "/api/modification-requests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modification-requests'] });
      setModDialogOpen(false);
      setModTitle("");
      setModDescription("");
      setModPriority("medium");
      setModProjectId("");
      toast({ title: "تم إرسال طلب التعديل بنجاح" });
    },
    onError: () => {
      toast({ title: "حدث خطأ أثناء إرسال الطلب", variant: "destructive" });
    },
  });

  const handleSubmitModRequest = () => {
    if (!modTitle.trim() || !modDescription.trim()) return;
    createModRequestMutation.mutate({
      title: modTitle,
      description: modDescription,
      priority: modPriority,
      ...(modProjectId && modProjectId !== "none" ? { projectId: modProjectId } : {}),
    });
  };

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

  if (user.role === 'admin') {
    return <AdminDashboard user={user} />;
  }

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

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-black flex items-center gap-2">
            <Wrench className="w-4 h-4 text-black/30" />
            طلبات التعديل
          </h2>
          <Button
            size="sm"
            className="bg-black text-white hover:bg-black/80 text-xs"
            onClick={() => setModDialogOpen(true)}
            data-testid="button-new-modification-request"
          >
            <Plus className="w-3.5 h-3.5 ml-1.5" />
            طلب تعديل جديد
          </Button>
        </div>

        {isLoadingModRequests ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-black/15" />
          </div>
        ) : !modRequests || modRequests.length === 0 ? (
          <Card className="border-2 border-dashed border-black/[0.06] shadow-none bg-black/[0.01]">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-black/[0.03] rounded-2xl flex items-center justify-center mb-4">
                <Wrench className="w-8 h-8 text-black/15" />
              </div>
              <h3 className="text-sm font-bold text-black/60 mb-1">لا توجد طلبات تعديل</h3>
              <p className="text-xs text-black/30 mb-6 max-w-[250px]">يمكنك إرسال طلب تعديل على مشروعك أو خدمة حالية</p>
              <Button
                size="sm"
                className="bg-black text-white hover:bg-black/80 text-xs"
                onClick={() => setModDialogOpen(true)}
                data-testid="button-new-modification-request-empty"
              >
                <Plus className="w-3.5 h-3.5 ml-1.5" />
                طلب تعديل جديد
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {modRequests.map((req, i) => {
              const st = modStatusMap[req.status] || modStatusMap['pending'];
              const pr = priorityMap[req.priority] || priorityMap['medium'];
              return (
                <motion.div key={req.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="border border-black/[0.06] shadow-none hover:shadow-md transition-all duration-300 bg-white" data-testid={`modification-request-${req.id}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 bg-black/[0.03] rounded-xl flex items-center justify-center shrink-0">
                            <Wrench className="w-4.5 h-4.5 text-black/25" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-black truncate" data-testid={`text-mod-title-${req.id}`}>{req.title}</h4>
                            <p className="text-[11px] text-black/40 mt-0.5 line-clamp-2">{req.description}</p>
                            <div className="flex items-center flex-wrap gap-2 mt-2">
                              {req.projectId && (
                                <span className="text-[10px] text-black/30 flex items-center gap-1">
                                  <Package className="w-2.5 h-2.5" />
                                  مشروع #{req.projectId}
                                </span>
                              )}
                              {req.createdAt && (
                                <span className="text-[10px] text-black/25 flex items-center gap-1">
                                  <Calendar className="w-2.5 h-2.5" />
                                  {new Date(req.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <Badge className={`text-[9px] h-4 px-1.5 border ${st.bg} ${st.color}`} data-testid={`badge-mod-status-${req.id}`}>
                            {st.label}
                          </Badge>
                          <Badge className={`text-[9px] h-4 px-1.5 border ${pr.bg} ${pr.color}`} data-testid={`badge-mod-priority-${req.id}`}>
                            {pr.label}
                          </Badge>
                        </div>
                      </div>
                      {req.adminNotes && (
                        <div className="mt-3 p-3 bg-black/[0.02] rounded-lg border border-black/[0.04]">
                          <p className="text-[10px] text-black/30 font-medium mb-0.5">ملاحظات الإدارة:</p>
                          <p className="text-[11px] text-black/50">{req.adminNotes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      <Dialog open={modDialogOpen} onOpenChange={setModDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-right text-base font-bold">طلب تعديل جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-medium text-black/60 mb-1.5 block">العنوان</label>
              <Input
                value={modTitle}
                onChange={(e) => setModTitle(e.target.value)}
                placeholder="عنوان طلب التعديل"
                data-testid="input-mod-title"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-black/60 mb-1.5 block">الوصف</label>
              <Textarea
                value={modDescription}
                onChange={(e) => setModDescription(e.target.value)}
                placeholder="اشرح التعديل المطلوب بالتفصيل..."
                rows={4}
                data-testid="input-mod-description"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-black/60 mb-1.5 block">الأولوية</label>
              <Select value={modPriority} onValueChange={setModPriority}>
                <SelectTrigger data-testid="select-mod-priority">
                  <SelectValue placeholder="اختر الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفض</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="high">عالي</SelectItem>
                  <SelectItem value="urgent">عاجل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {projects && projects.length > 0 && (
              <div>
                <label className="text-xs font-medium text-black/60 mb-1.5 block">المشروع (اختياري)</label>
                <Select value={modProjectId} onValueChange={setModProjectId}>
                  <SelectTrigger data-testid="select-mod-project">
                    <SelectValue placeholder="اختر المشروع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون مشروع</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>مشروع #{p.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              className="w-full bg-black text-white hover:bg-black/80 font-bold text-xs"
              onClick={handleSubmitModRequest}
              disabled={createModRequestMutation.isPending || !modTitle.trim() || !modDescription.trim()}
              data-testid="button-submit-modification-request"
            >
              {createModRequestMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <Plus className="w-4 h-4 ml-1.5" />
              )}
              إرسال الطلب
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
