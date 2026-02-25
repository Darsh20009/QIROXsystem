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
import { Loader2, Plus, FileText, Activity, Clock, Layers, LogIn, LogOut, TrendingUp, Calendar, CheckCircle2, AlertCircle, Timer, ArrowUpRight, Package, CreditCard, Eye, Wrench, Users, DollarSign, Settings, LayoutGrid, Handshake, ShoppingBag, UserCog, KeyRound, Copy, Check, Newspaper, Briefcase, ChevronLeft, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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


function AdminCredentialsCard() {
  const [copied, setCopied] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const credentials = [
    { label: "رابط الدخول", value: "/login", key: "url" },
    { label: "اسم المستخدم", value: "qadmin", key: "user" },
    { label: "كلمة المرور", value: "qadmin", key: "pass", secret: true },
    { label: "بوابة الموظفين", value: "/internal-gate", key: "gate-url" },
    { label: "كلمة مرور البوابة", value: "qirox2026", key: "gate", secret: true },
  ];

  return (
    <div className="border border-black/[0.06] rounded-2xl bg-white overflow-hidden">
      <button
        onClick={() => setVisible(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-black/[0.02] transition-colors"
        data-testid="button-toggle-credentials"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
            <KeyRound className="w-4 h-4 text-white" />
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-black">بيانات الدخول</p>
            <p className="text-[10px] text-black/35">اضغط للعرض أو الإخفاء</p>
          </div>
        </div>
        <span className="text-[10px] text-black/30 font-medium">{visible ? "إخفاء ▲" : "عرض ▼"}</span>
      </button>

      {visible && (
        <div className="px-4 pb-4 pt-2 border-t border-black/[0.04] space-y-2">
          {credentials.map(c => (
            <div key={c.key} className="flex items-center justify-between bg-[#f8f8f8] rounded-xl px-3 py-2.5 border border-black/[0.04]">
              <div>
                <p className="text-[10px] text-black/30 mb-0.5">{c.label}</p>
                <p className="text-xs font-mono font-semibold text-black tracking-wide" data-testid={`text-cred-${c.key}`}>
                  {c.value}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(c.value, c.key)}
                className="w-7 h-7 rounded-lg bg-white hover:bg-black/[0.05] border border-black/[0.06] flex items-center justify-center transition-colors flex-shrink-0 mr-2"
                data-testid={`button-copy-${c.key}`}
              >
                {copied === c.key
                  ? <Check className="w-3 h-3 text-green-600" />
                  : <Copy className="w-3 h-3 text-black/35" />
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const adminSections = [
  { label: "الطلبات", desc: "إدارة طلبات العملاء", href: "/admin/orders", icon: ShoppingBag, accent: "bg-blue-50", iconColor: "text-blue-600", badge: "totalOrders" },
  { label: "العملاء", desc: "قائمة العملاء المسجلين", href: "/admin/customers", icon: Users, accent: "bg-violet-50", iconColor: "text-violet-600", badge: "totalClients" },
  { label: "الموظفون", desc: "فريق العمل والصلاحيات", href: "/admin/employees", icon: UserCog, accent: "bg-slate-50", iconColor: "text-slate-600", badge: "totalEmployees" },
  { label: "الخدمات", desc: "الخدمات والباقات المعروضة", href: "/admin/services", icon: Settings, accent: "bg-orange-50", iconColor: "text-orange-600", badge: null },
  { label: "الأنظمة الجاهزة", desc: "قوالب القطاعات المختلفة", href: "/admin/templates", icon: LayoutGrid, accent: "bg-emerald-50", iconColor: "text-emerald-600", badge: null },
  { label: "المالية", desc: "الإيرادات والمدفوعات", href: "/admin/finance", icon: DollarSign, accent: "bg-green-50", iconColor: "text-green-600", badge: null },
  { label: "طلبات التعديل", desc: "تعديلات المشاريع القائمة", href: "/admin/mod-requests", icon: Wrench, accent: "bg-amber-50", iconColor: "text-amber-600", badge: null },
  { label: "الشركاء", desc: "شركاء النجاح والتعاون", href: "/admin/partners", icon: Handshake, accent: "bg-indigo-50", iconColor: "text-indigo-600", badge: null },
  { label: "الأخبار", desc: "المقالات والتحديثات", href: "/admin/news", icon: Newspaper, accent: "bg-rose-50", iconColor: "text-rose-600", badge: null },
  { label: "الوظائف", desc: "فرص العمل والتقديمات", href: "/admin/jobs", icon: Briefcase, accent: "bg-red-50", iconColor: "text-red-600", badge: null },
];

function AdminDashboard({ user }: { user: any }) {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const dateStr = new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8f8]">
        <div className="text-center">
          <Loader2 className="w-7 h-7 animate-spin mx-auto text-black/20" />
          <p className="text-xs text-black/30 mt-3">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const statItems = [
    { label: "الطلبات", value: stats?.totalOrders ?? 0, icon: ShoppingBag, color: "text-blue-600 bg-blue-50" },
    { label: "المشاريع", value: stats?.activeProjects ?? 0, icon: Activity, color: "text-indigo-600 bg-indigo-50" },
    { label: "الإيرادات", value: `${(stats?.totalRevenue ?? 0).toLocaleString()} ر.س`, icon: DollarSign, color: "text-green-600 bg-green-50" },
    { label: "العملاء", value: stats?.totalClients ?? 0, icon: Users, color: "text-violet-600 bg-violet-50" },
    { label: "الموظفون", value: stats?.totalEmployees ?? 0, icon: UserCog, color: "text-slate-600 bg-slate-50" },
  ];

  const badgeMap: Record<string, number> = {
    totalOrders: stats?.totalOrders ?? 0,
    totalClients: stats?.totalClients ?? 0,
    totalEmployees: stats?.totalEmployees ?? 0,
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8]" data-testid="admin-dashboard">
      <div className="bg-white border-b border-black/[0.06] px-6 py-5">
        <div className="max-w-[1300px] mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] text-black/30 mb-0.5">{dateStr}</p>
            <h1 className="text-xl font-bold text-black font-heading" data-testid="text-admin-greeting">
              مرحباً، {user.fullName}
            </h1>
          </div>
          <Badge className="bg-black text-white border-0 text-xs font-medium px-3 py-1.5">مدير النظام</Badge>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 md:px-6 py-6 space-y-6">

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statItems.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="bg-white rounded-2xl border border-black/[0.06] px-4 py-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-black/35 font-medium truncate">{s.label}</p>
                  <p className="text-lg font-bold text-black leading-tight">{s.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-[11px] text-black/30 font-semibold uppercase tracking-wider mb-3">إدارة النظام</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {adminSections.map((section, i) => (
              <motion.div key={section.href} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12 + i * 0.04 }}>
                <Link href={section.href}>
                  <div
                    className="bg-white rounded-2xl border border-black/[0.06] p-4 cursor-pointer hover:border-black/[0.15] hover:shadow-sm transition-all duration-200 group relative"
                    data-testid={`link-admin-section-${section.href.replace(/\//g, '-')}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${section.accent}`}>
                        <section.icon className={`w-5 h-5 ${section.iconColor}`} />
                      </div>
                      {section.badge && badgeMap[section.badge] > 0 && (
                        <span className="text-[10px] font-bold bg-black text-white rounded-full w-5 h-5 flex items-center justify-center">
                          {badgeMap[section.badge]}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-black mb-0.5">{section.label}</p>
                    <p className="text-[10px] text-black/35 leading-relaxed">{section.desc}</p>
                    <ChevronLeft className="w-3.5 h-3.5 text-black/20 absolute bottom-4 left-4 group-hover:text-black/40 transition-colors" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-black/30 font-semibold uppercase tracking-wider">أحدث الطلبات</p>
              <Link href="/admin/orders">
                <span className="text-[10px] text-black/40 hover:text-black/70 transition-colors flex items-center gap-1 cursor-pointer" data-testid="link-admin-all-orders">
                  عرض الكل <ArrowUpRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden" data-testid="table-recent-orders">
              {!stats?.recentOrders?.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-10 h-10 bg-black/[0.03] rounded-xl flex items-center justify-center mb-2">
                    <ShoppingBag className="w-4 h-4 text-black/15" />
                  </div>
                  <p className="text-xs text-black/25">لا توجد طلبات بعد</p>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.04]">
                  {stats.recentOrders.map((order: any, i: number) => {
                    const st = adminOrderStatusMap[order.status] || adminOrderStatusMap['pending'];
                    return (
                      <div key={order.id || i} className="flex items-center justify-between px-4 py-3 hover:bg-black/[0.01] transition-colors" data-testid={`admin-order-row-${order.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-black/[0.03] rounded-lg flex items-center justify-center">
                            <FileText className="w-3.5 h-3.5 text-black/30" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-black">#{order.id?.toString().slice(-6)}</p>
                            <p className="text-[10px] text-black/30">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }) : '-'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-xs font-semibold text-black/50">{Number(order.totalAmount || 0).toLocaleString()} ر.س</p>
                          <Badge className={`text-[9px] h-5 px-2 border ${st.bg} ${st.color}`}>{st.label}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-[11px] text-black/30 font-semibold uppercase tracking-wider mb-3">بيانات الدخول</p>
            <AdminCredentialsCard />
          </div>
        </motion.div>

      </div>
    </div>
  );
}

const employeeRoleLabels: Record<string, string> = {
  admin: "مدير النظام",
  manager: "مدير",
  developer: "مطور",
  designer: "مصمم",
  support: "دعم فني",
  sales: "مبيعات",
  sales_manager: "مدير مبيعات",
  accountant: "محاسب",
};

const orderStatusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", label: "قيد المراجعة" },
  approved: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", label: "موافق عليه" },
  in_progress: { bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700", label: "قيد التنفيذ" },
  completed: { bg: "bg-green-50 border-green-200", text: "text-green-700", label: "مكتمل" },
  cancelled: { bg: "bg-red-50 border-red-200", text: "text-red-700", label: "ملغي" },
  rejected: { bg: "bg-red-50 border-red-200", text: "text-red-700", label: "مرفوض" },
};

function EmployeeDashboard({ user }: { user: any }) {
  const { data: orders, isLoading: isLoadingOrders } = useOrders();
  const { data: attendanceStatus } = useAttendanceStatus();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const { toast } = useToast();
  const [ip, setIp] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [specsOrder, setSpecsOrder] = useState<any>(null);
  const [specsForm, setSpecsForm] = useState({ techStack: "", database: "", hosting: "", domain: "", notes: "" });

  const saveSpecsMutation = useMutation({
    mutationFn: async (data: { orderId: string; specs: any }) => {
      const res = await apiRequest("POST", `/api/admin/orders/${data.orderId}/specs`, data.specs);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setSpecsOrder(null);
      toast({ title: "تم حفظ المواصفات التقنية بنجاح" });
    },
    onError: () => toast({ title: "خطأ في حفظ المواصفات", variant: "destructive" }),
  });

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(res => res.json())
      .then(data => setIp(data.ip))
      .catch(() => {});
  }, []);

  const handleCheckIn = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        checkInMutation.mutate({ ipAddress: ip, location: { lat: position.coords.latitude, lng: position.coords.longitude } }, {
          onSuccess: () => toast({ title: "تم تسجيل الحضور بنجاح" })
        });
      }, () => {
        checkInMutation.mutate({ ipAddress: ip }, { onSuccess: () => toast({ title: "تم تسجيل الحضور" }) });
      });
    } else {
      checkInMutation.mutate({ ipAddress: ip });
    }
  };

  const handleCheckOut = () => {
    checkOutMutation.mutate(undefined, { onSuccess: () => toast({ title: "تم تسجيل الانصراف" }) });
  };

  const myOrders = orders?.filter(o => (o as any).assignedTo === user.id) || [];
  const allOrders = orders || [];
  const displayOrders = myOrders.length > 0 ? myOrders : allOrders;
  const filteredOrders = filterStatus === "all" ? displayOrders : displayOrders.filter(o => o.status === filterStatus);

  const stats = [
    { label: "إجمالي الطلبات", value: allOrders.length, color: "bg-blue-50 text-blue-600", icon: FileText },
    { label: "معين لي", value: myOrders.length, color: "bg-violet-50 text-violet-600", icon: UserCog },
    { label: "قيد التنفيذ", value: allOrders.filter(o => o.status === "in_progress").length, color: "bg-indigo-50 text-indigo-600", icon: Activity },
    { label: "مكتملة", value: allOrders.filter(o => o.status === "completed").length, color: "bg-green-50 text-green-600", icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-[#f8f8f8]" data-testid="employee-dashboard">
      <div className="bg-white border-b border-black/[0.06] px-6 py-5">
        <div className="max-w-[1300px] mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] text-black/30 mb-0.5">{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <h1 className="text-xl font-bold text-black font-heading">مرحباً، {user.fullName}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-black/[0.06] text-black/60 border-0 text-xs px-3 py-1.5">
              {employeeRoleLabels[user.role] || user.role}
            </Badge>
            <div className="flex items-center gap-2 bg-black/[0.02] p-1.5 rounded-xl border border-black/[0.06]">
              {!attendanceStatus || attendanceStatus.checkOut ? (
                <Button size="sm" className="bg-black text-white hover:bg-black/80 text-xs h-8 px-4" onClick={handleCheckIn} disabled={checkInMutation.isPending} data-testid="button-check-in">
                  <LogIn className="w-3.5 h-3.5 ml-1.5" />
                  تسجيل حضور
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 text-xs h-8 px-4" onClick={handleCheckOut} disabled={checkOutMutation.isPending} data-testid="button-check-out">
                  <LogOut className="w-3.5 h-3.5 ml-1.5" />
                  تسجيل انصراف
                </Button>
              )}
              {attendanceStatus && !attendanceStatus.checkOut && (
                <div className="px-3 py-1 text-[10px] font-bold text-black/40 flex items-center gap-1.5">
                  <Timer className="w-3 h-3 text-green-500 animate-pulse" />
                  {new Date(attendanceStatus.checkIn).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 md:px-6 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <div className="bg-white rounded-2xl border border-black/[0.06] px-4 py-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-black/35 font-medium">{s.label}</p>
                  <p className="text-xl font-bold text-black leading-tight">{s.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div>
              <p className="text-sm font-bold text-black">
                {myOrders.length > 0 ? "الطلبات المعينة لي" : "جميع الطلبات"}
              </p>
              {myOrders.length === 0 && (
                <p className="text-[10px] text-black/35 mt-0.5">عرض جميع الطلبات — لا توجد طلبات معينة لك حتى الآن</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {["all", "pending", "in_progress", "completed"].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`text-[10px] font-medium px-3 py-1.5 rounded-lg transition-colors ${filterStatus === s ? 'bg-black text-white' : 'bg-white border border-black/[0.08] text-black/50 hover:bg-black/[0.04]'}`}
                  data-testid={`filter-${s}`}
                >
                  {s === "all" ? "الكل" : s === "pending" ? "قيد المراجعة" : s === "in_progress" ? "جاري" : "مكتمل"}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden">
            {isLoadingOrders ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-black/20" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 bg-black/[0.03] rounded-xl flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5 text-black/15" />
                </div>
                <p className="text-sm text-black/30">لا توجد طلبات</p>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.04]">
                {filteredOrders.map((order: any, i) => {
                  const st = orderStatusColors[order.status] || orderStatusColors['pending'];
                  const isMyOrder = order.assignedTo === user.id;
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between px-5 py-4 hover:bg-black/[0.01] transition-colors"
                      data-testid={`employee-order-row-${order.id}`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${order.status === 'completed' ? 'bg-green-500' : order.status === 'in_progress' ? 'bg-blue-500' : order.status === 'pending' ? 'bg-amber-400' : 'bg-gray-300'}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-xs font-bold text-black">طلب #{order.id?.toString().slice(-6)}</p>
                            {isMyOrder && <span className="text-[9px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-bold">معين لي</span>}
                          </div>
                          <p className="text-[10px] text-black/35 truncate max-w-[200px]">
                            {order.projectType || order.sector || "طلب خدمة"}
                            {order.createdAt && ` · ${new Date(order.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {order.totalAmount > 0 && (
                          <p className="text-xs font-semibold text-black/50 hidden md:block">
                            {Number(order.totalAmount).toLocaleString()} ر.س
                          </p>
                        )}
                        <span className={`text-[10px] px-2.5 py-1 rounded-full border font-medium ${st.bg} ${st.text}`}>
                          {st.label}
                        </span>
                        <button
                          onClick={() => { setSpecsOrder(order); setSpecsForm({ techStack: order.specs?.techStack || "", database: order.specs?.database || "", hosting: order.specs?.hosting || "", domain: order.specs?.domain || "", notes: order.specs?.notes || "" }); }}
                          className="text-[10px] text-black/35 hover:text-black border border-black/[0.08] hover:border-black/20 px-2.5 py-1 rounded-lg transition-all"
                          data-testid={`button-specs-${order.id}`}
                        >
                          مواصفات
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Specs Dialog */}
      <Dialog open={!!specsOrder} onOpenChange={(open) => !open && setSpecsOrder(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-heading text-black">
              مواصفات المشروع — طلب #{specsOrder?.id?.toString().slice(-6)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-bold text-black/50 mb-1.5 block">Stack التقني</label>
              <Input
                placeholder="مثال: React, Next.js, Node.js, MongoDB"
                value={specsForm.techStack}
                onChange={e => setSpecsForm(f => ({ ...f, techStack: e.target.value }))}
                className="text-sm"
                data-testid="input-specs-techstack"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-black/50 mb-1.5 block">قاعدة البيانات</label>
              <Select value={specsForm.database} onValueChange={v => setSpecsForm(f => ({ ...f, database: v }))}>
                <SelectTrigger className="text-sm" data-testid="select-specs-database">
                  <SelectValue placeholder="اختر قاعدة البيانات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MongoDB Atlas M0 (Free)">MongoDB Atlas M0 (Free)</SelectItem>
                  <SelectItem value="MongoDB Atlas M10">MongoDB Atlas M10</SelectItem>
                  <SelectItem value="MongoDB Atlas M20">MongoDB Atlas M20</SelectItem>
                  <SelectItem value="MongoDB Atlas M30">MongoDB Atlas M30</SelectItem>
                  <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                  <SelectItem value="MySQL">MySQL</SelectItem>
                  <SelectItem value="Redis">Redis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-black/50 mb-1.5 block">الاستضافة</label>
              <Select value={specsForm.hosting} onValueChange={v => setSpecsForm(f => ({ ...f, hosting: v }))}>
                <SelectTrigger className="text-sm" data-testid="select-specs-hosting">
                  <SelectValue placeholder="اختر الاستضافة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AWS EC2 t3.micro">AWS EC2 t3.micro ($8/mo)</SelectItem>
                  <SelectItem value="AWS EC2 t3.small">AWS EC2 t3.small ($17/mo)</SelectItem>
                  <SelectItem value="AWS EC2 t3.medium">AWS EC2 t3.medium ($34/mo)</SelectItem>
                  <SelectItem value="AWS EC2 t3.large">AWS EC2 t3.large ($67/mo)</SelectItem>
                  <SelectItem value="AWS EC2 c5.xlarge">AWS EC2 c5.xlarge ($170/mo)</SelectItem>
                  <SelectItem value="Vercel">Vercel</SelectItem>
                  <SelectItem value="DigitalOcean">DigitalOcean</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-black/50 mb-1.5 block">الدومين</label>
              <Input
                placeholder="مثال: example.com"
                value={specsForm.domain}
                onChange={e => setSpecsForm(f => ({ ...f, domain: e.target.value }))}
                className="text-sm"
                data-testid="input-specs-domain"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-black/50 mb-1.5 block">ملاحظات تقنية</label>
              <Textarea
                placeholder="أي تفاصيل تقنية إضافية..."
                value={specsForm.notes}
                onChange={e => setSpecsForm(f => ({ ...f, notes: e.target.value }))}
                className="text-sm resize-none h-20"
                data-testid="textarea-specs-notes"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                className="flex-1 bg-black text-white hover:bg-black/80"
                onClick={() => saveSpecsMutation.mutate({ orderId: specsOrder.id, specs: specsForm })}
                disabled={saveSpecsMutation.isPending}
                data-testid="button-save-specs"
              >
                {saveSpecsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                حفظ المواصفات
              </Button>
              <Button variant="outline" onClick={() => setSpecsOrder(null)} data-testid="button-cancel-specs">
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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

  if (user.role !== 'client') {
    return <EmployeeDashboard user={user} />;
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
