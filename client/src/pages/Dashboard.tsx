import { useUser } from "@/hooks/use-auth";
import { useOrders } from "@/hooks/use-orders";
import { useProjects } from "@/hooks/use-projects";
import { useAttendanceStatus, useCheckIn, useCheckOut } from "@/hooks/use-attendance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, FileText, Activity, Clock, Layers, LogIn, LogOut, TrendingUp, Calendar, CheckCircle2, AlertCircle, Timer, ArrowUpRight, Package, CreditCard, Eye, Wrench, Users, DollarSign, Settings, LayoutGrid, Handshake, ShoppingBag, ShoppingCart, UserCog, KeyRound, Copy, Check, Newspaper, Briefcase, ChevronLeft, BarChart3, Phone, Mail, User, Link2, ExternalLink, Server, Globe, Building2, ChevronRight } from "lucide-react";
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
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [specsForm, setSpecsForm] = useState({ techStack: "", database: "", hosting: "", domain: "", projectConcept: "", variables: "", notes: "" });
  const [statusUpdate, setStatusUpdate] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const { data: selectedOrderSpecs, isLoading: isLoadingSpecs } = useQuery<any>({
    queryKey: ['/api/admin/orders', selectedOrder?.id, 'specs'],
    enabled: !!selectedOrder?.id,
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/specs`, { credentials: 'include' });
      return res.json();
    },
  });

  useEffect(() => {
    if (selectedOrderSpecs) {
      setSpecsForm({
        techStack: selectedOrderSpecs.techStack || "",
        database: selectedOrderSpecs.database || "",
        hosting: selectedOrderSpecs.hosting || "",
        domain: selectedOrderSpecs.domain || "",
        projectConcept: selectedOrderSpecs.projectConcept || "",
        variables: selectedOrderSpecs.variables || "",
        notes: selectedOrderSpecs.notes || "",
      });
    }
  }, [selectedOrderSpecs]);

  const saveSpecsMutation = useMutation({
    mutationFn: async (data: { orderId: string; specs: any }) => {
      const res = await apiRequest("PUT", `/api/admin/orders/${data.orderId}/specs`, data.specs);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'specs'] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "تم حفظ المواصفات التقنية بنجاح ✓" });
    },
    onError: () => toast({ title: "خطأ في حفظ المواصفات", variant: "destructive" }),
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (data: { orderId: string; status?: string; adminNotes?: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/orders/${data.orderId}`, { status: data.status, adminNotes: data.adminNotes });
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setSelectedOrder((prev: any) => prev ? { ...prev, ...updated } : null);
      toast({ title: "تم تحديث الطلب بنجاح" });
    },
    onError: () => toast({ title: "خطأ في تحديث الطلب", variant: "destructive" }),
  });

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(res => res.json())
      .then(data => setIp(data.ip))
      .catch(() => {});
  }, []);

  const openOrder = (order: any) => {
    setSelectedOrder(order);
    setActiveTab("details");
    setStatusUpdate(order.status || "pending");
    setAdminNotes(order.adminNotes || "");
    setSpecsForm({ techStack: "", database: "", hosting: "", domain: "", projectConcept: "", variables: "", notes: "" });
  };

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

  const booleanFields = [
    { key: "whatsappIntegration", label: "تكامل WhatsApp" },
    { key: "socialIntegration", label: "ربط السوشيال ميديا" },
    { key: "hasLogo", label: "لديه لوغو" },
    { key: "needsLogoDesign", label: "يحتاج تصميم لوغو" },
    { key: "hasHosting", label: "لديه استضافة" },
    { key: "hasDomain", label: "لديه دومين" },
  ];

  const textFields = [
    { key: "projectType", label: "نوع المشروع" },
    { key: "sector", label: "القطاع" },
    { key: "competitors", label: "المنافسون" },
    { key: "visualStyle", label: "الأسلوب البصري" },
    { key: "favoriteExamples", label: "أمثلة مفضلة" },
    { key: "requiredFunctions", label: "الوظائف المطلوبة" },
    { key: "requiredSystems", label: "الأنظمة المطلوبة" },
    { key: "siteLanguage", label: "لغة الموقع" },
  ];

  const fileFields = [
    { key: "logoUrl", label: "اللوغو" },
    { key: "brandIdentityUrl", label: "الهوية البصرية" },
    { key: "filesUrl", label: "الملفات" },
    { key: "contentUrl", label: "المحتوى" },
    { key: "imagesUrl", label: "الصور" },
    { key: "videoUrl", label: "الفيديو" },
    { key: "paymentProofUrl", label: "إثبات الدفع" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f8f8]" data-testid="employee-dashboard" dir="rtl">
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
                  <LogIn className="w-3.5 h-3.5 ml-1.5" />تسجيل حضور
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 text-xs h-8 px-4" onClick={handleCheckOut} disabled={checkOutMutation.isPending} data-testid="button-check-out">
                  <LogOut className="w-3.5 h-3.5 ml-1.5" />تسجيل انصراف
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
              <p className="text-[10px] text-black/35 mt-0.5">اضغط على أي طلب لعرض تفاصيله الكاملة</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {["all", "pending", "in_progress", "completed"].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`text-[10px] font-medium px-3 py-1.5 rounded-lg transition-colors ${filterStatus === s ? 'bg-black text-white' : 'bg-white border border-black/[0.08] text-black/50 hover:bg-black/[0.04]'}`}
                  data-testid={`filter-${s}`}>
                  {s === "all" ? "الكل" : s === "pending" ? "قيد المراجعة" : s === "in_progress" ? "جاري" : "مكتمل"}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden">
            {isLoadingOrders ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-black/20" /></div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="w-8 h-8 text-black/10 mb-3" />
                <p className="text-sm text-black/30">لا توجد طلبات</p>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.04]">
                {filteredOrders.map((order: any, i) => {
                  const st = orderStatusColors[order.status] || orderStatusColors['pending'];
                  const isMyOrder = (order.assignedTo?._id || order.assignedTo) === user.id;
                  const clientName = order.client?.fullName || order.client?.username || "عميل";
                  const hasSpecs = order.specs && Object.values(order.specs).some(v => v);
                  return (
                    <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between px-5 py-4 hover:bg-black/[0.02] cursor-pointer transition-colors group"
                      onClick={() => openOrder(order)}
                      data-testid={`employee-order-row-${order.id}`}>
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${order.status === 'completed' ? 'bg-green-50' : order.status === 'in_progress' ? 'bg-blue-50' : 'bg-amber-50'}`}>
                          <FileText className={`w-3.5 h-3.5 ${order.status === 'completed' ? 'text-green-500' : order.status === 'in_progress' ? 'text-blue-500' : 'text-amber-500'}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <p className="text-xs font-bold text-black">طلب #{order.id?.toString().slice(-6)}</p>
                            {isMyOrder && <span className="text-[9px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-bold">معين لي</span>}
                            {hasSpecs && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">مكتمل المواصفات</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-black/50 font-medium">{clientName}</p>
                            <span className="text-black/15">·</span>
                            <p className="text-[10px] text-black/35 truncate max-w-[160px]">
                              {order.projectType || order.sector || "طلب خدمة"}
                            </p>
                            {order.createdAt && (
                              <>
                                <span className="text-black/15">·</span>
                                <p className="text-[10px] text-black/25">{new Date(order.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {order.totalAmount > 0 && (
                          <p className="text-xs font-semibold text-black/40 hidden md:block">{Number(order.totalAmount).toLocaleString()} ر.س</p>
                        )}
                        <span className={`text-[10px] px-2.5 py-1 rounded-full border font-medium ${st.bg} ${st.text}`}>{st.label}</span>
                        <ChevronRight className="w-4 h-4 text-black/20 group-hover:text-black/50 transition-colors" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Order Detail Sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent side="left" className="w-full sm:max-w-2xl p-0 overflow-hidden" dir="rtl">
          {selectedOrder && (
            <div className="flex flex-col h-full">
              {/* Sheet Header */}
              <div className="px-6 py-5 border-b border-black/[0.06] bg-white flex-shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <SheetTitle className="text-base font-bold text-black font-heading">
                      طلب #{selectedOrder.id?.toString().slice(-6)}
                    </SheetTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${(orderStatusColors[selectedOrder.status] || orderStatusColors['pending']).bg} ${(orderStatusColors[selectedOrder.status] || orderStatusColors['pending']).text}`}>
                        {(orderStatusColors[selectedOrder.status] || orderStatusColors['pending']).label}
                      </span>
                      {selectedOrder.totalAmount > 0 && (
                        <span className="text-[10px] text-black/40 font-medium">{Number(selectedOrder.totalAmount).toLocaleString()} ر.س</span>
                      )}
                      {selectedOrder.createdAt && (
                        <span className="text-[10px] text-black/30">
                          {new Date(selectedOrder.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
                <TabsList className="w-full rounded-none border-b border-black/[0.06] bg-white h-10 justify-start px-6 gap-0 flex-shrink-0">
                  <TabsTrigger value="details" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent h-10 px-4">
                    تفاصيل الطلب
                  </TabsTrigger>
                  <TabsTrigger value="specs" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent h-10 px-4">
                    المواصفات التقنية
                  </TabsTrigger>
                  <TabsTrigger value="manage" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent h-10 px-4">
                    إدارة الطلب
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Order Details */}
                <TabsContent value="details" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="px-6 py-5 space-y-6">

                      {/* Client Info */}
                      <div>
                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-3">بيانات العميل</p>
                        <div className="bg-black/[0.02] rounded-xl p-4 space-y-3 border border-black/[0.04]">
                          {selectedOrder.client ? (
                            <>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {selectedOrder.client.fullName?.charAt(0) || "?"}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-black">{selectedOrder.client.fullName || selectedOrder.client.username}</p>
                                  <p className="text-[10px] text-black/40">@{selectedOrder.client.username}</p>
                                </div>
                              </div>
                              <Separator className="opacity-30" />
                              {selectedOrder.client.email && (
                                <div className="flex items-center gap-2.5">
                                  <Mail className="w-3.5 h-3.5 text-black/30 flex-shrink-0" />
                                  <p className="text-xs text-black/70">{selectedOrder.client.email}</p>
                                </div>
                              )}
                              {selectedOrder.client.phone && (
                                <div className="flex items-center gap-2.5">
                                  <Phone className="w-3.5 h-3.5 text-black/30 flex-shrink-0" />
                                  <p className="text-xs text-black/70">{selectedOrder.client.phone}</p>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-black/35">بيانات العميل غير متاحة</p>
                          )}
                        </div>
                      </div>

                      {/* Project Details from Questionnaire */}
                      <div>
                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-3">تفاصيل المشروع</p>
                        <div className="space-y-2">
                          {textFields.map(f => selectedOrder[f.key] ? (
                            <div key={f.key} className="flex gap-3 py-2 border-b border-black/[0.04] last:border-0">
                              <p className="text-[10px] font-bold text-black/40 w-28 flex-shrink-0 pt-0.5">{f.label}</p>
                              <p className="text-xs text-black/80 flex-1">{selectedOrder[f.key]}</p>
                            </div>
                          ) : null)}
                          {textFields.every(f => !selectedOrder[f.key]) && (
                            <p className="text-xs text-black/25 py-3 text-center">لم يُملأ الاستبيان بعد</p>
                          )}
                        </div>
                      </div>

                      {/* Boolean Flags */}
                      {booleanFields.some(f => selectedOrder[f.key]) && (
                        <div>
                          <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-3">الخصائص</p>
                          <div className="flex flex-wrap gap-2">
                            {booleanFields.filter(f => selectedOrder[f.key]).map(f => (
                              <span key={f.key} className="text-[10px] bg-black text-white px-2.5 py-1 rounded-full font-medium">{f.label}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Files & Attachments */}
                      <div>
                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-3">الملفات والمرفقات</p>
                        <div className="space-y-2">
                          {fileFields.map(f => selectedOrder[f.key] ? (
                            <a key={f.key} href={selectedOrder[f.key]} target="_blank" rel="noopener noreferrer"
                              className="flex items-center justify-between p-3 bg-white rounded-xl border border-black/[0.06] hover:border-black/20 transition-colors group">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 bg-black/[0.04] rounded-lg flex items-center justify-center">
                                  <Link2 className="w-3.5 h-3.5 text-black/40" />
                                </div>
                                <p className="text-xs font-medium text-black">{f.label}</p>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-black/20 group-hover:text-black/60 transition-colors" />
                            </a>
                          ) : null)}
                          {fileFields.every(f => !selectedOrder[f.key]) && (
                            <div className="py-6 text-center border border-dashed border-black/[0.08] rounded-xl">
                              <p className="text-xs text-black/25">لا توجد ملفات مرفقة</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payment */}
                      <div>
                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-3">بيانات الدفع</p>
                        <div className="bg-black/[0.02] rounded-xl p-4 border border-black/[0.04] space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-black/50">طريقة الدفع</p>
                            <p className="text-xs font-bold text-black">
                              {selectedOrder.paymentMethod === "bank_transfer" ? "تحويل بنكي" : selectedOrder.paymentMethod === "paypal" ? "PayPal" : "—"}
                            </p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-black/50">الإجمالي</p>
                            <p className="text-xs font-bold text-black">{selectedOrder.totalAmount ? `${Number(selectedOrder.totalAmount).toLocaleString()} ر.س` : "—"}</p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-black/50">حالة الدفعة الأولى</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${selectedOrder.isDepositPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {selectedOrder.isDepositPaid ? "مدفوع" : "لم يُدفع"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Tab 2: Technical Specs */}
                <TabsContent value="specs" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="px-6 py-5 space-y-4">
                      <p className="text-[10px] text-black/40">أدخل المواصفات التقنية للمشروع — ستظهر للعميل في لوحة التحكم الخاصة به</p>
                      {isLoadingSpecs && (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-5 h-5 animate-spin text-black/30" />
                          <p className="text-xs text-black/30 mr-2">جاري تحميل المواصفات...</p>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-bold text-black/50 mb-1.5 block">Stack التقني</label>
                        <Input placeholder="مثال: React, Next.js, Node.js, MongoDB" value={specsForm.techStack}
                          onChange={e => setSpecsForm(f => ({ ...f, techStack: e.target.value }))} className="text-sm" data-testid="input-specs-techstack" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-black/50 mb-1.5 block">قاعدة البيانات</label>
                        <Select value={specsForm.database} onValueChange={v => setSpecsForm(f => ({ ...f, database: v }))}>
                          <SelectTrigger className="text-sm" data-testid="select-specs-database"><SelectValue placeholder="اختر قاعدة البيانات" /></SelectTrigger>
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
                          <SelectTrigger className="text-sm" data-testid="select-specs-hosting"><SelectValue placeholder="اختر الاستضافة" /></SelectTrigger>
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
                        <Input placeholder="مثال: example.com" value={specsForm.domain}
                          onChange={e => setSpecsForm(f => ({ ...f, domain: e.target.value }))} className="text-sm" data-testid="input-specs-domain" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-black/50 mb-1.5 block">فكرة المشروع وتفاصيله</label>
                        <Textarea placeholder="اشرح فكرة المشروع، هدفه، الجمهور المستهدف..." value={specsForm.projectConcept}
                          onChange={e => setSpecsForm(f => ({ ...f, projectConcept: e.target.value }))} className="text-sm resize-none h-24" data-testid="textarea-specs-concept" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-black/50 mb-1.5 block">المتغيرات والإعدادات</label>
                        <Textarea placeholder="مثال: API_KEY=xxx (كل متغير في سطر)" value={specsForm.variables}
                          onChange={e => setSpecsForm(f => ({ ...f, variables: e.target.value }))} className="text-sm resize-none h-20 font-mono text-xs" data-testid="textarea-specs-variables" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-black/50 mb-1.5 block">ملاحظات تقنية</label>
                        <Textarea placeholder="أي تفاصيل إضافية..." value={specsForm.notes}
                          onChange={e => setSpecsForm(f => ({ ...f, notes: e.target.value }))} className="text-sm resize-none h-16" data-testid="textarea-specs-notes" />
                      </div>
                      <Button className="w-full bg-black text-white hover:bg-black/80 font-bold"
                        onClick={() => saveSpecsMutation.mutate({ orderId: selectedOrder.id, specs: specsForm })}
                        disabled={saveSpecsMutation.isPending} data-testid="button-save-specs">
                        {saveSpecsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Server className="w-4 h-4 ml-2" />}
                        حفظ المواصفات
                      </Button>
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Tab 3: Manage Order */}
                <TabsContent value="manage" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="px-6 py-5 space-y-5">
                      <div>
                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-3">تحديث حالة الطلب</p>
                        <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                          <SelectTrigger className="text-sm" data-testid="select-order-status"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">قيد المراجعة</SelectItem>
                            <SelectItem value="approved">تمت الموافقة</SelectItem>
                            <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                            <SelectItem value="completed">مكتمل</SelectItem>
                            <SelectItem value="rejected">مرفوض</SelectItem>
                            <SelectItem value="cancelled">ملغي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-3">ملاحظات داخلية</p>
                        <Textarea placeholder="ملاحظات للفريق (لا تظهر للعميل)..." value={adminNotes}
                          onChange={e => setAdminNotes(e.target.value)} className="text-sm resize-none h-28" data-testid="textarea-admin-notes" />
                      </div>
                      <Button className="w-full bg-black text-white hover:bg-black/80 font-bold"
                        onClick={() => updateOrderMutation.mutate({ orderId: selectedOrder.id, status: statusUpdate, adminNotes })}
                        disabled={updateOrderMutation.isPending} data-testid="button-update-order">
                        {updateOrderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <CheckCircle2 className="w-4 h-4 ml-2" />}
                        حفظ التغييرات
                      </Button>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
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
  const [clientSpecsOrderId, setClientSpecsOrderId] = useState<string | null>(null);

  const { data: clientOrderSpecs, isLoading: isLoadingClientSpecs } = useQuery<any>({
    queryKey: ['/api/orders', clientSpecsOrderId, 'specs'],
    enabled: !!clientSpecsOrderId,
    queryFn: async () => {
      const res = await fetch(`/api/orders/${clientSpecsOrderId}/specs`, { credentials: 'include' });
      return res.json();
    },
  });

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

  const projectPhases = ["التصميم", "التطوير", "الاختبار", "التسليم"];
  const getPhase = (progress: number) => Math.min(Math.floor(progress / 25), 3);

  return (
    <div className="min-h-screen bg-[#f8f8f8]" dir="rtl">
      {/* Top Hero Banner */}
      <div className="bg-white border-b border-black/[0.06]">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                {user.fullName?.charAt(0) || "U"}
              </div>
              <div>
                <p className="text-[10px] text-black/30 mb-0.5">{dateStr}</p>
                <h1 className="text-xl font-black text-black font-heading">
                  {getGreeting()}، {user.fullName.split(" ")[0]}
                </h1>
                <p className="text-xs text-black/40 mt-0.5">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/services">
                <Button size="sm" variant="outline" className="rounded-xl h-9 px-4 text-xs border-black/[0.08] hover:border-black/20 gap-2" data-testid="button-browse-services">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  تصفح الخدمات
                </Button>
              </Link>
              <Link href="/cart">
                <Button size="sm" variant="outline" className="rounded-xl h-9 px-4 text-xs border-black/[0.08] hover:border-black/20 gap-2">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  السلة
                </Button>
              </Link>
              <Link href="/order">
                <Button size="sm" className="bg-black text-white hover:bg-black/80 rounded-xl h-9 px-5 text-xs gap-2 font-bold" data-testid="button-new-order">
                  <Plus className="w-3.5 h-3.5" />
                  طلب جديد
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "إجمالي الطلبات", value: orders?.length || 0, icon: FileText, color: "from-blue-500 to-blue-600", bg: "bg-blue-50", text: "text-blue-600" },
            { label: "مشاريع نشطة", value: activeProjects.length, icon: Activity, color: "from-violet-500 to-indigo-600", bg: "bg-violet-50", text: "text-violet-600" },
            { label: "قيد الانتظار", value: pendingOrders.length, icon: Clock, color: "from-amber-500 to-orange-500", bg: "bg-amber-50", text: "text-amber-600" },
            { label: "مكتملة", value: completedOrders.length, icon: CheckCircle2, color: "from-green-500 to-emerald-600", bg: "bg-green-50", text: "text-green-600" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <div className="bg-white rounded-2xl border border-black/[0.06] p-5 hover:shadow-md transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-md`}>
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-xs font-bold ${s.text} ${s.bg} px-2 py-0.5 rounded-full`}>
                    {s.value > 0 ? `+${s.value}` : "—"}
                  </span>
                </div>
                <p className="text-3xl font-black text-black mb-1">{s.value}</p>
                <p className="text-[11px] text-black/35 font-medium">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Investment Banner */}
        {totalSpent > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
            <div className="bg-black rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/45 text-xs mb-0.5">إجمالي استثمارك في Qirox</p>
                  <p className="text-3xl font-black text-white">{totalSpent.toLocaleString()} <span className="text-white/40 text-base font-normal">ر.س</span></p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-center">
                <div>
                  <p className="text-2xl font-black text-white">{orders?.filter(o => o.status !== 'pending' && o.status !== 'rejected').length || 0}</p>
                  <p className="text-[10px] text-white/40">خدمات فعّالة</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <p className="text-2xl font-black text-white">{activeProjects.length}</p>
                  <p className="text-[10px] text-white/40">مشاريع جارية</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Projects */}
          <div className="xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-black flex items-center gap-2">
                <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center"><Layers className="w-3.5 h-3.5 text-white" /></div>
                مشاريعي الجارية
              </h2>
              {(projects?.length || 0) > 0 && (
                <Link href="/project/status">
                  <button className="text-[10px] text-black/30 hover:text-black/60 flex items-center gap-1" data-testid="link-all-projects">
                    عرض الكل <ArrowUpRight className="w-3 h-3" />
                  </button>
                </Link>
              )}
            </div>

            {isLoadingProjects ? (
              <div className="bg-white rounded-2xl p-16 text-center border border-black/[0.06]"><Loader2 className="w-6 h-6 animate-spin mx-auto text-black/20" /></div>
            ) : !projects || projects.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-black/[0.06] p-16 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-3xl bg-black/[0.03] flex items-center justify-center mb-5">
                  <Layers className="w-10 h-10 text-black/10" />
                </div>
                <h3 className="font-bold text-black/50 mb-2">لا توجد مشاريع بعد</h3>
                <p className="text-xs text-black/30 mb-6 max-w-xs">ابدأ باختيار الخدمة المناسبة لمشروعك وسيبدأ الفريق بالتنفيذ فوراً</p>
                <div className="flex gap-3">
                  <Link href="/services">
                    <Button size="sm" className="bg-black text-white hover:bg-black/80 rounded-xl h-9 px-5 text-xs gap-2">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      اختر خدمة
                    </Button>
                  </Link>
                  <Link href="/order">
                    <Button size="sm" variant="outline" className="rounded-xl h-9 px-4 text-xs border-black/[0.08]">
                      طلب مباشر
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project, i) => {
                  const phase = getPhase(project.progress || 0);
                  const st = statusMap[project.status] || statusMap['pending'];
                  return (
                    <motion.div key={project.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                      <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden hover:shadow-lg transition-all duration-300 group" data-testid={`project-card-${project.id}`}>
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-5">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 bg-black/[0.03] rounded-xl flex items-center justify-center">
                                <Activity className="w-5 h-5 text-black/30" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-sm text-black">مشروع #{(project.id as string)?.slice?.(-6) || project.id}</h4>
                                  <Badge className={`text-[9px] h-4 px-1.5 border ${st.bg} ${st.color}`}>{st.label}</Badge>
                                </div>
                                <p className="text-[10px] text-black/30 mt-0.5">
                                  {project.createdAt ? new Date(project.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                                </p>
                              </div>
                            </div>
                            <Link href="/project/status">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-black/20 hover:text-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>

                          {/* Progress */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[11px] text-black/40">التقدم الكلي</p>
                              <p className="text-sm font-black text-black">{project.progress || 0}%</p>
                            </div>
                            <div className="h-2 bg-black/[0.04] rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-black rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${project.progress || 0}%` }}
                                transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.1 }}
                              />
                            </div>
                          </div>

                          {/* Phase Pills */}
                          <div className="flex gap-2">
                            {projectPhases.map((ph, pi) => (
                              <div key={pi} className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-bold transition-all ${pi <= phase ? 'bg-black text-white' : 'bg-black/[0.03] text-black/25'}`}>
                                {ph}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: ShoppingBag, label: "اختر خدمة", desc: "تصفح الخدمات والأنظمة", href: "/services", color: "from-violet-500 to-indigo-600" },
                { icon: Package, label: "الأجهزة", desc: "منتجات وبنية تحتية", href: "/devices", color: "from-blue-500 to-blue-600" },
                { icon: Wrench, label: "طلب تعديل", desc: "تعديل على مشروع حالي", action: () => setModDialogOpen(true), color: "from-amber-500 to-orange-500" },
              ].map((action, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.05 }}>
                  {action.href ? (
                    <Link href={action.href}>
                      <div className="bg-white rounded-xl border border-black/[0.06] p-4 hover:shadow-md transition-all cursor-pointer group">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 shadow-md`}>
                          <action.icon className="w-4.5 h-4.5 text-white" />
                        </div>
                        <p className="font-bold text-xs text-black">{action.label}</p>
                        <p className="text-[10px] text-black/35 mt-0.5">{action.desc}</p>
                      </div>
                    </Link>
                  ) : (
                    <div onClick={action.action} className="bg-white rounded-xl border border-black/[0.06] p-4 hover:shadow-md transition-all cursor-pointer group" data-testid="button-new-modification-request">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 shadow-md`}>
                        <action.icon className="w-4.5 h-4.5 text-white" />
                      </div>
                      <p className="font-bold text-xs text-black">{action.label}</p>
                      <p className="text-[10px] text-black/35 mt-0.5">{action.desc}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Orders + Mod Requests Column */}
          <div className="space-y-5">
            {/* Orders Timeline */}
            <div>
              <h2 className="font-bold text-black flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center"><FileText className="w-3.5 h-3.5 text-white" /></div>
                سجل الطلبات
              </h2>
              <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden">
                {isLoadingOrders ? (
                  <div className="p-12 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-black/15" /></div>
                ) : !orders || orders.length === 0 ? (
                  <div className="p-10 text-center">
                    <FileText className="w-8 h-8 mx-auto text-black/10 mb-3" />
                    <p className="text-xs text-black/25">لا توجد طلبات بعد</p>
                    <Link href="/order">
                      <Button size="sm" className="mt-4 bg-black text-white rounded-xl text-xs h-8 px-4">أول طلب</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-black/[0.04]">
                    {orders.slice(0, 6).map((order, i) => {
                      const st = statusMap[order.status] || statusMap['pending'];
                      const StatusIcon = st.icon;
                      return (
                        <div key={order.id} className="px-4 py-3.5 hover:bg-black/[0.01] transition-colors" data-testid={`order-item-${order.id}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${st.bg} border ${st.bg.replace('bg-', 'border-').replace('/50', '/30')} flex items-center justify-center flex-shrink-0`}>
                              <StatusIcon className={`w-3.5 h-3.5 ${st.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-black">طلب #{(order.id as string)?.slice?.(-6) || order.id}</p>
                              <p className="text-[10px] text-black/30">
                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }) : ''}
                                {order.totalAmount ? ` · ${Number(order.totalAmount).toLocaleString()} ر.س` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge className={`text-[9px] px-2 py-0.5 border ${st.bg} ${st.color}`}>{st.label}</Badge>
                              <button
                                onClick={() => setClientSpecsOrderId(String(order.id))}
                                className="text-[9px] px-2 py-1 rounded-lg border border-black/[0.08] text-black/40 hover:border-black/20 hover:text-black transition-all"
                                data-testid={`button-view-specs-${order.id}`}
                              >
                                المواصفات
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Mod Requests */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-black flex items-center gap-2">
                  <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center"><Wrench className="w-3.5 h-3.5 text-white" /></div>
                  طلبات التعديل
                </h2>
                <Button size="sm" onClick={() => setModDialogOpen(true)} className="bg-black text-white rounded-xl h-7 px-3 text-[10px] gap-1" data-testid="button-new-modification-request">
                  <Plus className="w-3 h-3" /> جديد
                </Button>
              </div>
              <div className="space-y-2">
                {isLoadingModRequests ? (
                  <div className="bg-white rounded-xl p-8 text-center border border-black/[0.06]"><Loader2 className="w-4 h-4 animate-spin mx-auto text-black/20" /></div>
                ) : !modRequests || modRequests.length === 0 ? (
                  <div className="bg-white rounded-xl border border-dashed border-black/[0.08] p-8 text-center">
                    <Wrench className="w-8 h-8 mx-auto text-black/10 mb-2" />
                    <p className="text-xs text-black/25">لا توجد طلبات تعديل</p>
                  </div>
                ) : modRequests.slice(0, 4).map((req) => {
                  const st = modStatusMap[req.status] || modStatusMap['pending'];
                  const pr = priorityMap[req.priority] || priorityMap['medium'];
                  return (
                    <div key={req.id} className="bg-white rounded-xl border border-black/[0.06] p-4" data-testid={`modification-request-${req.id}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-black truncate flex-1" data-testid={`text-mod-title-${req.id}`}>{req.title}</p>
                        <div className="flex gap-1 flex-shrink-0">
                          <Badge className={`text-[9px] px-1.5 py-0.5 border ${st.bg} ${st.color}`} data-testid={`badge-mod-status-${req.id}`}>{st.label}</Badge>
                          <Badge className={`text-[9px] px-1.5 py-0.5 border ${pr.bg} ${pr.color}`} data-testid={`badge-mod-priority-${req.id}`}>{pr.label}</Badge>
                        </div>
                      </div>
                      <p className="text-[10px] text-black/35 mt-1 line-clamp-1">{req.description}</p>
                      {req.adminNotes && (
                        <div className="mt-2 p-2 bg-black/[0.02] rounded-lg border border-black/[0.04]">
                          <p className="text-[10px] text-black/40">ملاحظة الإدارة: {req.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Band */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="bg-black rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-white">
              <h3 className="text-lg font-bold mb-1.5">هل تحتاج مساعدة في مشروعك؟</h3>
              <p className="text-white/45 text-sm">فريقنا جاهز لتحويل فكرتك إلى واقع رقمي متكامل</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link href="/contact">
                <Button className="bg-white text-black hover:bg-white/90 font-bold h-10 px-6 text-xs rounded-xl" data-testid="button-contact-support">
                  تواصل معنا
                </Button>
              </Link>
              <Link href="/services">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 h-10 px-5 text-xs rounded-xl">
                  الخدمات
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modification Dialog */}
      <Dialog open={modDialogOpen} onOpenChange={setModDialogOpen}>
        <DialogContent className="sm:max-w-[480px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-black">طلب تعديل جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-medium text-black/60 mb-1.5 block">العنوان</label>
              <Input value={modTitle} onChange={(e) => setModTitle(e.target.value)} placeholder="عنوان طلب التعديل" data-testid="input-mod-title" />
            </div>
            <div>
              <label className="text-xs font-medium text-black/60 mb-1.5 block">الوصف</label>
              <Textarea value={modDescription} onChange={(e) => setModDescription(e.target.value)} placeholder="اشرح التعديل المطلوب بالتفصيل..." rows={4} data-testid="input-mod-description" />
            </div>
            <div>
              <label className="text-xs font-medium text-black/60 mb-1.5 block">الأولوية</label>
              <Select value={modPriority} onValueChange={setModPriority}>
                <SelectTrigger data-testid="select-mod-priority"><SelectValue placeholder="اختر الأولوية" /></SelectTrigger>
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
                  <SelectTrigger data-testid="select-mod-project"><SelectValue placeholder="اختر المشروع" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون مشروع</SelectItem>
                    {projects.map((p) => <SelectItem key={p.id} value={String(p.id)}>مشروع #{p.id}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button className="w-full bg-black text-white hover:bg-black/80 font-bold text-xs" onClick={handleSubmitModRequest}
              disabled={createModRequestMutation.isPending || !modTitle.trim() || !modDescription.trim()} data-testid="button-submit-modification-request">
              {createModRequestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Plus className="w-4 h-4 ml-1.5" />}
              إرسال الطلب
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Client Specs Dialog */}
      <Dialog open={!!clientSpecsOrderId} onOpenChange={(open) => !open && setClientSpecsOrderId(null)}>
        <DialogContent className="sm:max-w-[520px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-heading text-black flex items-center gap-2">
              <Server className="w-4 h-4 text-black/40" />
              مواصفات المشروع — طلب #{clientSpecsOrderId?.slice(-6)}
            </DialogTitle>
          </DialogHeader>
          {isLoadingClientSpecs ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-black/30" />
              <p className="text-xs text-black/30 mr-2">جاري التحميل...</p>
            </div>
          ) : !clientOrderSpecs || Object.keys(clientOrderSpecs).filter(k => k !== '_id' && k !== 'orderId' && k !== '__v' && clientOrderSpecs[k]).length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 bg-black/[0.03] rounded-xl flex items-center justify-center mx-auto mb-3">
                <Server className="w-5 h-5 text-black/15" />
              </div>
              <p className="text-sm font-medium text-black/40">المواصفات التقنية لم تُضف بعد</p>
              <p className="text-xs text-black/25 mt-1.5">يعمل فريقنا على تجهيز مواصفات مشروعك</p>
            </div>
          ) : (
            <div className="space-y-3 mt-1">
              {clientOrderSpecs.projectConcept && (
                <div className="bg-black/[0.02] rounded-xl p-4 border border-black/[0.04]">
                  <p className="text-[10px] font-bold text-black/40 mb-1.5">فكرة المشروع</p>
                  <p className="text-xs text-black/80 leading-relaxed">{clientOrderSpecs.projectConcept}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {clientOrderSpecs.techStack && (
                  <div className="bg-black/[0.02] rounded-xl p-3 border border-black/[0.04]">
                    <p className="text-[9px] font-bold text-black/35 mb-1">Stack التقني</p>
                    <p className="text-xs font-medium text-black">{clientOrderSpecs.techStack}</p>
                  </div>
                )}
                {clientOrderSpecs.database && (
                  <div className="bg-black/[0.02] rounded-xl p-3 border border-black/[0.04]">
                    <p className="text-[9px] font-bold text-black/35 mb-1">قاعدة البيانات</p>
                    <p className="text-xs font-medium text-black">{clientOrderSpecs.database}</p>
                  </div>
                )}
                {clientOrderSpecs.hosting && (
                  <div className="bg-black/[0.02] rounded-xl p-3 border border-black/[0.04]">
                    <p className="text-[9px] font-bold text-black/35 mb-1">الاستضافة</p>
                    <p className="text-xs font-medium text-black">{clientOrderSpecs.hosting}</p>
                  </div>
                )}
                {clientOrderSpecs.domain && (
                  <div className="bg-black/[0.02] rounded-xl p-3 border border-black/[0.04]">
                    <p className="text-[9px] font-bold text-black/35 mb-1">الدومين</p>
                    <p className="text-xs font-medium text-black">{clientOrderSpecs.domain}</p>
                  </div>
                )}
              </div>
              {clientOrderSpecs.variables && (
                <div className="bg-black rounded-xl p-4">
                  <p className="text-[9px] font-bold text-white/50 mb-2">المتغيرات والإعدادات</p>
                  <pre className="text-xs text-green-400 font-mono leading-relaxed whitespace-pre-wrap">{clientOrderSpecs.variables}</pre>
                </div>
              )}
              {clientOrderSpecs.notes && (
                <div className="bg-black/[0.02] rounded-xl p-4 border border-black/[0.04]">
                  <p className="text-[9px] font-bold text-black/40 mb-1.5">ملاحظات تقنية</p>
                  <p className="text-xs text-black/70 leading-relaxed">{clientOrderSpecs.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
