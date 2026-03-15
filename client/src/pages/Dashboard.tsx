import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useOrders } from "@/hooks/use-orders";
import SARIcon from "@/components/SARIcon";
import { useProjects } from "@/hooks/use-projects";
import { useAttendanceStatus, useCheckIn, useCheckOut } from "@/hooks/use-attendance";
import { usePricingPlans } from "@/hooks/use-templates";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, FileText, Activity, Clock, Layers, LogIn, LogOut, TrendingUp, Calendar, CheckCircle2, AlertCircle, Timer, ArrowUpRight, Package, CreditCard, Eye, Wrench, Users, DollarSign, Settings, LayoutGrid, Handshake, ShoppingBag, ShoppingCart, UserCog, KeyRound, Copy, Check, Newspaper, Briefcase, ChevronLeft, BarChart3, Phone, Mail, User, Link2, ExternalLink, Server, Globe, Building2, ChevronRight, Crown, Sparkles, MessageSquare, XCircle, Headphones, Upload, Video, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ModificationRequest, Order } from "@shared/schema";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { BiometricManager } from "@/components/BiometricManager";
import { AIPanel } from "@/components/QiroxAI";
import { NotificationsWidget, WhatsNewWidget } from "@/components/DashboardWidgets";
import { WelcomeAssistant } from "@/components/WelcomeAssistant";
import { FloatingAI } from "@/components/FloatingAI";

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

function getGreeting(lang = "ar") {
  const h = new Date().getHours();
  if (lang === "ar") {
    if (h < 12) return "صباح الخير";
    if (h < 17) return "مساء الخير";
    return "مساء النور";
  }
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function StatCard({ icon: Icon, label, value, trend, color }: { icon: any; label: string; value: number; trend?: string; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="border border-black/[0.06] dark:border-white/[0.08] shadow-none hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-900">
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
            <p className="text-3xl font-bold text-black dark:text-white tracking-tight">{value}</p>
            <p className="text-xs text-black/40 dark:text-white/40 mt-1 font-medium">{label}</p>
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
    <div className="border border-black/[0.06] dark:border-white/[0.08] rounded-2xl bg-white dark:bg-gray-900 overflow-hidden">
      <button
        onClick={() => setVisible(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors"
        data-testid="button-toggle-credentials"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
            <KeyRound className="w-4 h-4 text-white" />
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-black dark:text-white">بيانات الدخول</p>
            <p className="text-[10px] text-black/35 dark:text-white/35">اضغط للعرض أو الإخفاء</p>
          </div>
        </div>
        <span className="text-[10px] text-black/30 dark:text-white/30 font-medium">{visible ? "إخفاء ▲" : "عرض ▼"}</span>
      </button>

      {visible && (
        <div className="px-4 pb-4 pt-2 border-t border-black/[0.04] dark:border-white/[0.06] space-y-2">
          {credentials.map(c => (
            <div key={c.key} className="flex items-center justify-between bg-[#f8f8f8] dark:bg-gray-950 rounded-xl px-3 py-2.5 border border-black/[0.04] dark:border-white/[0.06]">
              <div>
                <p className="text-[10px] text-black/30 dark:text-white/30 mb-0.5">{c.label}</p>
                <p className="text-xs font-mono font-semibold text-black dark:text-white tracking-wide" data-testid={`text-cred-${c.key}`}>
                  {c.value}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(c.value, c.key)}
                className="w-7 h-7 rounded-lg bg-white dark:bg-gray-900 hover:bg-black/[0.05] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center transition-colors flex-shrink-0 mr-2"
                data-testid={`button-copy-${c.key}`}
              >
                {copied === c.key
                  ? <Check className="w-3 h-3 text-green-600" />
                  : <Copy className="w-3 h-3 text-black/35 dark:text-white/35" />
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

function AdminEmailPanel() {
  const { toast } = useToast();
  const [form, setForm] = useState({ to: "", toName: "", subject: "", body: "" });
  const [testType, setTestType] = useState("test");

  const sendDirectMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("POST", "/api/admin/send-email", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: data.message || "تم الإرسال بنجاح ✓" });
      setForm({ to: "", toName: "", subject: "", body: "" });
    },
    onError: () => toast({ title: "فشل إرسال البريد", variant: "destructive" }),
  });

  const testMutation = useMutation({
    mutationFn: async ({ type, to }: { type: string; to?: string }) => {
      const res = await apiRequest("POST", "/api/admin/test-email", { type, to });
      return res.json();
    },
    onSuccess: (data) => toast({ title: data.message || "تم إرسال البريد التجريبي ✓" }),
    onError: () => toast({ title: "فشل إرسال البريد التجريبي", variant: "destructive" }),
  });

  const emailTypes = [
    { value: "test",    label: "اختبار النظام" },
    { value: "welcome", label: "ترحيب بالعضو" },
    { value: "order",   label: "تأكيد طلب" },
    { value: "status",  label: "تحديث حالة طلب" },
    { value: "project", label: "تحديث مشروع" },
    { value: "task",    label: "إسناد مهمة" },
    { value: "message", label: "إشعار رسالة" },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden" data-testid="admin-email-panel">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.05]">
        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
          <Mail className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-black dark:text-white">إرسال البريد الإلكتروني المباشر</p>
          <p className="text-[10px] text-black/35 dark:text-white/35">أرسل رسائل مباشرة لأي عنوان بريدي</p>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-black/40 dark:text-white/40 font-semibold block mb-1.5">البريد الإلكتروني *</label>
            <Input
              value={form.to}
              onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
              placeholder="example@email.com"
              type="email"
              className="text-sm h-9 border-black/[0.1]"
              data-testid="input-email-to"
            />
          </div>
          <div>
            <label className="text-[10px] text-black/40 dark:text-white/40 font-semibold block mb-1.5">الاسم</label>
            <Input
              value={form.toName}
              onChange={e => setForm(f => ({ ...f, toName: e.target.value }))}
              placeholder="اسم المستلم"
              className="text-sm h-9 border-black/[0.1]"
              data-testid="input-email-toname"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-black/40 dark:text-white/40 font-semibold block mb-1.5">عنوان الرسالة *</label>
          <Input
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            placeholder="موضوع الرسالة"
            className="text-sm h-9 border-black/[0.1]"
            data-testid="input-email-subject"
          />
        </div>
        <div>
          <label className="text-[10px] text-black/40 dark:text-white/40 font-semibold block mb-1.5">محتوى الرسالة *</label>
          <Textarea
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="اكتب محتوى الرسالة هنا..."
            className="text-sm border-black/[0.1] resize-none"
            rows={4}
            data-testid="textarea-email-body"
          />
        </div>
        <Button
          onClick={() => sendDirectMutation.mutate(form)}
          disabled={sendDirectMutation.isPending || !form.to || !form.subject || !form.body}
          className="w-full bg-black text-white hover:bg-black/80 h-9 text-sm font-semibold"
          data-testid="button-send-direct-email"
        >
          {sendDirectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Mail className="w-4 h-4 ml-2" />}
          إرسال البريد
        </Button>

        <div className="border-t border-black/[0.05] pt-3">
          <p className="text-[10px] text-black/35 dark:text-white/35 font-semibold mb-2.5">إرسال بريد تجريبي لاختبار النظام</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Select value={testType} onValueChange={setTestType}>
                <SelectTrigger className="h-8 text-xs border-black/[0.1]" data-testid="select-test-email-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {emailTypes.map(t => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => testMutation.mutate({ type: testType })}
              disabled={testMutation.isPending}
              className="h-8 text-xs border-black/[0.1] dark:border-white/[0.1] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
              data-testid="button-send-test-email"
            >
              {testMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : null}
              إرسال تجريبي
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ user }: { user: any }) {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const dateStr = new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8f8] dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-7 h-7 animate-spin mx-auto text-black/20 dark:text-white/20" />
          <p className="text-xs text-black/30 dark:text-white/30 mt-3">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const statItems = [
    { label: "الطلبات", value: stats?.totalOrders ?? 0, icon: ShoppingBag, color: "text-blue-600 bg-blue-50" },
    { label: "المشاريع", value: stats?.activeProjects ?? 0, icon: Activity, color: "text-indigo-600 bg-indigo-50" },
    { label: "الإيرادات", value: (stats?.totalRevenue ?? 0).toLocaleString(), unit: "SAR_ICON", icon: DollarSign, color: "text-green-600 bg-green-50" },
    { label: "العملاء", value: stats?.totalClients ?? 0, icon: Users, color: "text-violet-600 bg-violet-50" },
    { label: "الموظفون", value: stats?.totalEmployees ?? 0, icon: UserCog, color: "text-slate-600 bg-slate-50" },
  ];

  const badgeMap: Record<string, number> = {
    totalOrders: stats?.totalOrders ?? 0,
    totalClients: stats?.totalClients ?? 0,
    totalEmployees: stats?.totalEmployees ?? 0,
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-gray-950 relative" data-testid="admin-dashboard">
      <div className="absolute inset-0 overflow-hidden pointer-events-none"><PageGraphics variant="dashboard" /></div>
      <div className="bg-white dark:bg-gray-900 border-b border-black/[0.06] dark:border-white/[0.08] px-6 py-5">
        <div className="max-w-[1300px] mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] text-black/30 dark:text-white/30 mb-0.5">{dateStr}</p>
            <h1 className="text-xl font-bold text-black dark:text-white font-heading" data-testid="text-admin-greeting">
              مرحباً، {user.fullName || user.username}
            </h1>
          </div>
          <Badge className="bg-black text-white border-0 text-xs font-medium px-3 py-1.5">مدير النظام</Badge>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 md:px-6 py-6 space-y-6">

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statItems.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] px-4 py-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-black/35 dark:text-white/35 font-medium truncate">{s.label}</p>
                  <p className="text-lg font-bold text-black dark:text-white leading-tight flex items-center gap-1">{s.value}{(s as any).unit === "SAR_ICON" && <SARIcon size={12} className="opacity-50" />}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-[11px] text-black/30 dark:text-white/30 font-semibold uppercase tracking-wider mb-3">إدارة النظام</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {adminSections.map((section, i) => (
              <motion.div key={section.href} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12 + i * 0.04 }}>
                <Link href={section.href}>
                  <div
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-4 cursor-pointer hover:border-black/[0.15] dark:hover:border-white/[0.15] hover:shadow-sm transition-all duration-200 group relative"
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
                    <p className="text-sm font-bold text-black dark:text-white mb-0.5">{section.label}</p>
                    <p className="text-[10px] text-black/35 dark:text-white/35 leading-relaxed">{section.desc}</p>
                    <ChevronLeft className="w-3.5 h-3.5 text-black/20 dark:text-white/20 absolute bottom-4 left-4 group-hover:text-black/40 dark:group-hover:text-white/40 transition-colors" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-black/30 dark:text-white/30 font-semibold uppercase tracking-wider">أحدث الطلبات</p>
              <Link href="/admin/orders">
                <span className="text-[10px] text-black/40 dark:text-white/40 hover:text-black/70 dark:text-white/70 transition-colors flex items-center gap-1 cursor-pointer" data-testid="link-admin-all-orders">
                  عرض الكل <ArrowUpRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden" data-testid="table-recent-orders">
              {!stats?.recentOrders?.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-10 h-10 bg-black/[0.03] dark:bg-white/[0.05] rounded-xl flex items-center justify-center mb-2">
                    <ShoppingBag className="w-4 h-4 text-black/15 dark:text-white/15" />
                  </div>
                  <p className="text-xs text-black/25 dark:text-white/25">لا توجد طلبات بعد</p>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                  {stats.recentOrders.map((order: any, i: number) => {
                    const st = adminOrderStatusMap[order.status] || adminOrderStatusMap['pending'];
                    return (
                      <div key={order.id || i} className="flex items-center justify-between px-4 py-3 hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors" data-testid={`admin-order-row-${order.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-black/[0.03] dark:bg-white/[0.05] rounded-lg flex items-center justify-center">
                            <FileText className="w-3.5 h-3.5 text-black/30 dark:text-white/30" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-black dark:text-white">#{order.id?.toString().slice(-6)}</p>
                            <p className="text-[10px] text-black/30 dark:text-white/30">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }) : '-'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-xs font-semibold text-black/50 dark:text-white/50 flex items-center gap-1">{Number(order.totalAmount || 0).toLocaleString()} <SARIcon size={10} className="opacity-60" /></p>
                          <Badge className={`text-[9px] h-5 px-2 border ${st.bg} ${st.color}`}>{st.label}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[11px] text-black/30 dark:text-white/30 font-semibold uppercase tracking-wider mb-3">بيانات الدخول</p>
              <AdminCredentialsCard />
            </div>
            <div>
              <p className="text-[11px] text-black/30 dark:text-white/30 font-semibold uppercase tracking-wider mb-3">البريد الإلكتروني</p>
              <AdminEmailPanel />
            </div>
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
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showCheckOutDialog, setShowCheckOutDialog] = useState(false);
  const [checkInNotes, setCheckInNotes] = useState("");
  const [checkOutAchievements, setCheckOutAchievements] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [specsForm, setSpecsForm] = useState({
    projectName: "", clientEmail: "", totalBudget: "", paidAmount: "", projectStatus: "planning",
    techStack: "", database: "", hosting: "", framework: "", language: "",
    githubRepoUrl: "", databaseUri: "", serverIp: "", deploymentUsername: "", deploymentPassword: "",
    customDomain: "", stagingUrl: "", productionUrl: "", sslEnabled: false, cdnEnabled: false,
    domain: "",
    variables: "",
    projectConcept: "", targetAudience: "", mainFeatures: "", referenceLinks: "", colorPalette: "",
    estimatedHours: "", deadline: "", startDate: "",
    notes: "", teamNotes: "",
  });
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
      const s = selectedOrderSpecs;
      setSpecsForm({
        projectName: s.projectName || "",
        clientEmail: s.clientEmail || "",
        totalBudget: s.totalBudget?.toString() || "",
        paidAmount: s.paidAmount?.toString() || "",
        projectStatus: s.projectStatus || "planning",
        techStack: s.techStack || "",
        database: s.database || "",
        hosting: s.hosting || "",
        framework: s.framework || "",
        language: s.language || "",
        githubRepoUrl: s.githubRepoUrl || "",
        databaseUri: s.databaseUri || "",
        serverIp: s.serverIp || "",
        deploymentUsername: s.deploymentUsername || "",
        deploymentPassword: s.deploymentPassword || "",
        customDomain: s.customDomain || "",
        stagingUrl: s.stagingUrl || "",
        productionUrl: s.productionUrl || "",
        sslEnabled: s.sslEnabled || false,
        cdnEnabled: s.cdnEnabled || false,
        domain: s.domain || "",
        variables: s.variables || "",
        projectConcept: s.projectConcept || "",
        targetAudience: s.targetAudience || "",
        mainFeatures: s.mainFeatures || "",
        referenceLinks: s.referenceLinks || "",
        colorPalette: s.colorPalette || "",
        estimatedHours: s.estimatedHours?.toString() || "",
        deadline: s.deadline ? new Date(s.deadline).toISOString().split('T')[0] : "",
        startDate: s.startDate ? new Date(s.startDate).toISOString().split('T')[0] : "",
        notes: s.notes || "",
        teamNotes: s.teamNotes || "",
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
    setSpecsForm(prev => ({ ...prev, techStack: "", database: "", hosting: "", domain: "", projectConcept: "", variables: "", notes: "" }));
  };

  const handleCheckIn = () => {
    setShowCheckInDialog(true);
  };

  const submitCheckIn = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        checkInMutation.mutate({ ipAddress: ip, location: { lat: position.coords.latitude, lng: position.coords.longitude }, checkInNotes }, {
          onSuccess: () => { toast({ title: "تم تسجيل الحضور بنجاح" }); setShowCheckInDialog(false); setCheckInNotes(""); }
        });
      }, () => {
        checkInMutation.mutate({ ipAddress: ip, checkInNotes }, { onSuccess: () => { toast({ title: "تم تسجيل الحضور" }); setShowCheckInDialog(false); setCheckInNotes(""); } });
      });
    } else {
      checkInMutation.mutate({ ipAddress: ip, checkInNotes }, { onSuccess: () => { setShowCheckInDialog(false); setCheckInNotes(""); } });
    }
  };

  const handleCheckOut = () => {
    setShowCheckOutDialog(true);
  };

  const submitCheckOut = () => {
    checkOutMutation.mutate({ achievements: checkOutAchievements }, { onSuccess: () => { toast({ title: "تم تسجيل الانصراف" }); setShowCheckOutDialog(false); setCheckOutAchievements(""); } });
  };

  const myOrders = orders?.filter((o: any) => (o as any).assignedTo === user.id) || [];
  const allOrders = orders || [];
  const displayOrders = myOrders.length > 0 ? myOrders : allOrders;
  const filteredOrders = filterStatus === "all" ? displayOrders : displayOrders.filter((o: any) => o.status === filterStatus);

  const stats = [
    { label: "إجمالي الطلبات", value: allOrders.length, color: "bg-blue-50 text-blue-600", icon: FileText },
    { label: "معين لي", value: myOrders.length, color: "bg-violet-50 text-violet-600", icon: UserCog },
    { label: "قيد التنفيذ", value: allOrders.filter((o: any) => o.status === "in_progress").length, color: "bg-indigo-50 text-indigo-600", icon: Activity },
    { label: "مكتملة", value: allOrders.filter((o: any) => o.status === "completed").length, color: "bg-green-50 text-green-600", icon: CheckCircle2 },
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

  const fileCategories = [
    { key: "logo",          label: "الشعار",           color: "bg-violet-500" },
    { key: "brandIdentity", label: "الهوية البصرية",   color: "bg-blue-500" },
    { key: "content",       label: "المحتوى والصور",   color: "bg-emerald-500" },
    { key: "paymentProof",  label: "إثبات الدفع",      color: "bg-amber-500" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-gray-950 relative" data-testid="employee-dashboard" dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none"><PageGraphics variant="dashboard" /></div>
      <div className="bg-white dark:bg-gray-900 border-b border-black/[0.06] dark:border-white/[0.08] px-6 py-5">
        <div className="max-w-[1300px] mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] text-black/30 dark:text-white/30 mb-0.5">{new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <h1 className="text-xl font-bold text-black dark:text-white font-heading">مرحباً، {user.fullName || user.username}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-black/[0.06] text-black/60 dark:text-white/60 border-0 text-xs px-3 py-1.5">
              {employeeRoleLabels[user.role] || user.role}
            </Badge>
            <div className="flex items-center gap-2 bg-black/[0.02] dark:bg-white/[0.04] p-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08]">
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
                <div className="px-3 py-1 text-[10px] font-bold text-black/40 dark:text-white/40 flex items-center gap-1.5">
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
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] px-4 py-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-black/35 dark:text-white/35 font-medium">{s.label}</p>
                  <p className="text-xl font-bold text-black dark:text-white leading-tight">{s.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div>
              <p className="text-sm font-bold text-black dark:text-white">
                {myOrders.length > 0 ? "الطلبات المعينة لي" : "جميع الطلبات"}
              </p>
              <p className="text-[10px] text-black/35 dark:text-white/35 mt-0.5">اضغط على أي طلب لعرض تفاصيله الكاملة</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {["all", "pending", "in_progress", "completed"].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`text-[10px] font-medium px-3 py-1.5 rounded-lg transition-colors ${filterStatus === s ? 'bg-black text-white' : 'bg-white dark:bg-gray-900 border border-black/[0.08] dark:border-white/[0.1] text-black/50 dark:text-white/50 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'}`}
                  data-testid={`filter-${s}`}>
                  {s === "all" ? "الكل" : s === "pending" ? "قيد المراجعة" : s === "in_progress" ? "جاري" : "مكتمل"}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
            {isLoadingOrders ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" /></div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="w-8 h-8 text-black/10 dark:text-white/10 mb-3" />
                <p className="text-sm text-black/30 dark:text-white/30">لا توجد طلبات</p>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                {filteredOrders.map((order: any, i: number) => {
                  const st = orderStatusColors[order.status] || orderStatusColors['pending'];
                  const isMyOrder = (order.assignedTo?._id || order.assignedTo) === user.id;
                  const clientName = order.client?.fullName || order.client?.username || "عميل";
                  const hasSpecs = order.specs && Object.values(order.specs).some(v => v);
                  return (
                    <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between px-5 py-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] cursor-pointer transition-colors group"
                      onClick={() => openOrder(order)}
                      data-testid={`employee-order-row-${order.id}`}>
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${order.status === 'completed' ? 'bg-green-50' : order.status === 'in_progress' ? 'bg-blue-50' : 'bg-amber-50'}`}>
                          <FileText className={`w-3.5 h-3.5 ${order.status === 'completed' ? 'text-green-500' : order.status === 'in_progress' ? 'text-blue-500' : 'text-amber-500'}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <p className="text-xs font-bold text-black dark:text-white">طلب #{order.id?.toString().slice(-6)}</p>
                            {isMyOrder && <span className="text-[9px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-bold">معين لي</span>}
                            {hasSpecs && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">مكتمل المواصفات</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-black/50 dark:text-white/50 font-medium">{clientName}</p>
                            <span className="text-black/15 dark:text-white/15">·</span>
                            <p className="text-[10px] text-black/35 dark:text-white/35 truncate max-w-[160px]">
                              {order.projectType || order.sector || "طلب خدمة"}
                            </p>
                            {order.createdAt && (
                              <>
                                <span className="text-black/15 dark:text-white/15">·</span>
                                <p className="text-[10px] text-black/25 dark:text-white/25">{new Date(order.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {order.totalAmount > 0 && (
                          <p className="text-xs font-semibold text-black/40 dark:text-white/40 hidden md:block flex items-center gap-1">{Number(order.totalAmount).toLocaleString()} <SARIcon size={10} className="opacity-50" /></p>
                        )}
                        <span className={`text-[10px] px-2.5 py-1 rounded-full border font-medium ${st.bg} ${st.text}`}>{st.label}</span>
                        <ChevronRight className="w-4 h-4 text-black/20 dark:text-white/20 group-hover:text-black/50 dark:group-hover:text-white/50 transition-colors" />
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
        <SheetContent side="left" className="w-full sm:max-w-3xl p-0 overflow-hidden" dir="rtl">
          {selectedOrder && (
            <div className="flex flex-col h-full">
              {/* Sheet Header */}
              <div className="px-6 py-5 border-b border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-gray-900 flex-shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <SheetTitle className="text-base font-bold text-black dark:text-white font-heading">
                      طلب #{selectedOrder.id?.toString().slice(-6)}
                    </SheetTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${(orderStatusColors[selectedOrder.status] || orderStatusColors['pending']).bg} ${(orderStatusColors[selectedOrder.status] || orderStatusColors['pending']).text}`}>
                        {(orderStatusColors[selectedOrder.status] || orderStatusColors['pending']).label}
                      </span>
                      {selectedOrder.totalAmount > 0 && (
                        <span className="text-[10px] text-black/40 dark:text-white/40 font-medium flex items-center gap-1">{Number(selectedOrder.totalAmount).toLocaleString()} <SARIcon size={9} className="opacity-50" /></span>
                      )}
                      {selectedOrder.createdAt && (
                        <span className="text-[10px] text-black/30 dark:text-white/30">
                          {new Date(selectedOrder.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
                <TabsList className="w-full rounded-none border-b border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-gray-900 h-10 justify-start px-6 gap-0 flex-shrink-0">
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
                        <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-3">بيانات العميل</p>
                        <div className="bg-black/[0.02] dark:bg-white/[0.04] rounded-xl p-4 space-y-3 border border-black/[0.04] dark:border-white/[0.06]">
                          {selectedOrder.client ? (
                            <>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {selectedOrder.client.fullName?.charAt(0) || "?"}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-black dark:text-white">{selectedOrder.client.fullName || selectedOrder.client.username}</p>
                                  <p className="text-[10px] text-black/40 dark:text-white/40">@{selectedOrder.client.username}</p>
                                </div>
                              </div>
                              <Separator className="opacity-30" />
                              {selectedOrder.client.email && (
                                <div className="flex items-center gap-2.5">
                                  <Mail className="w-3.5 h-3.5 text-black/30 dark:text-white/30 flex-shrink-0" />
                                  <p className="text-xs text-black/70 dark:text-white/70">{selectedOrder.client.email}</p>
                                </div>
                              )}
                              {selectedOrder.client.phone && (
                                <div className="flex items-center gap-2.5">
                                  <Phone className="w-3.5 h-3.5 text-black/30 dark:text-white/30 flex-shrink-0" />
                                  <p className="text-xs text-black/70 dark:text-white/70">{selectedOrder.client.phone}</p>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-black/35 dark:text-white/35">بيانات العميل غير متاحة</p>
                          )}
                        </div>
                      </div>

                      {/* Project Details from Questionnaire */}
                      <div>
                        <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-3">تفاصيل المشروع</p>
                        <div className="space-y-2">
                          {textFields.map(f => selectedOrder[f.key] ? (
                            <div key={f.key} className="flex gap-3 py-2 border-b border-black/[0.04] dark:border-white/[0.06] last:border-0">
                              <p className="text-[10px] font-bold text-black/40 dark:text-white/40 w-28 flex-shrink-0 pt-0.5">{f.label}</p>
                              <p className="text-xs text-black/80 dark:text-white/80 flex-1">{selectedOrder[f.key]}</p>
                            </div>
                          ) : null)}
                          {textFields.every(f => !selectedOrder[f.key]) && (
                            <p className="text-xs text-black/25 dark:text-white/25 py-3 text-center">لم يُملأ الاستبيان بعد</p>
                          )}
                        </div>
                      </div>

                      {/* Boolean Flags */}
                      {booleanFields.some(f => selectedOrder[f.key]) && (
                        <div>
                          <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-3">الخصائص</p>
                          <div className="flex flex-wrap gap-2">
                            {booleanFields.filter(f => selectedOrder[f.key]).map(f => (
                              <span key={f.key} className="text-[10px] bg-black text-white px-2.5 py-1 rounded-full font-medium">{f.label}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Files & Attachments */}
                      <div>
                        <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-3">الملفات والمرفقات</p>
                        <div className="space-y-2">
                          {(() => {
                            const orderFiles = (selectedOrder as any).files || {};
                            const allDocs: { label: string; url: string; color: string }[] = [];
                            fileCategories.forEach(({ key, label, color }) => {
                              const arr: string[] = Array.isArray(orderFiles[key]) ? orderFiles[key] : (orderFiles[key] ? [orderFiles[key]] : []);
                              arr.forEach(u => allDocs.push({ label, url: u, color }));
                            });
                            if (!allDocs.length) return (
                              <div className="py-6 text-center border border-dashed border-black/[0.08] dark:border-white/[0.1] rounded-xl">
                                <p className="text-xs text-black/25 dark:text-white/25">لا توجد ملفات مرفقة</p>
                              </div>
                            );
                            return allDocs.map((doc, i) => (
                              <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 transition-colors group">
                                <div className={`w-7 h-7 rounded-lg ${doc.color} flex items-center justify-center flex-shrink-0`}>
                                  <span className="text-white text-[10px] font-black">{doc.label[0]}</span>
                                </div>
                                <p className="text-xs font-medium text-black dark:text-white flex-1">{doc.label}</p>
                                <ExternalLink className="w-3.5 h-3.5 text-black/20 dark:text-white/20 group-hover:text-black/60 dark:group-hover:text-white/60 transition-colors" />
                              </a>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Payment */}
                      <div>
                        <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-3">بيانات الدفع</p>
                        <div className="bg-black/[0.02] dark:bg-white/[0.04] rounded-xl p-4 border border-black/[0.04] dark:border-white/[0.06] space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-black/50 dark:text-white/50">طريقة الدفع</p>
                            <p className="text-xs font-bold text-black dark:text-white">
                              {selectedOrder.paymentMethod === "bank_transfer" ? "تحويل بنكي" : selectedOrder.paymentMethod === "paypal" ? "PayPal" : "—"}
                            </p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-black/50 dark:text-white/50">الإجمالي</p>
                            <p className="text-xs font-bold text-black dark:text-white flex items-center gap-1">{selectedOrder.totalAmount ? <><span>{Number(selectedOrder.totalAmount).toLocaleString()}</span> <SARIcon size={10} className="opacity-60" /></> : "—"}</p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-black/50 dark:text-white/50">حالة الدفعة الأولى</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${selectedOrder.isDepositPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {selectedOrder.isDepositPaid ? "مدفوع" : "لم يُدفع"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Tab 2: Project Setup (full specs) */}
                <TabsContent value="specs" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    {isLoadingSpecs ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" />
                        <p className="text-xs text-black/30 dark:text-white/30 mr-2">جاري تحميل بيانات المشروع...</p>
                      </div>
                    ) : (
                      <div className="px-6 py-5 space-y-5">

                        {/* Section 1: Project Info */}
                        <div className="bg-black rounded-2xl p-5">
                          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Briefcase className="w-3.5 h-3.5" />
                            معلومات المشروع
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold text-white/50 mb-1 block">اسم المشروع</label>
                              <Input placeholder="مثال: نظام إدارة مطعم الروضة" value={specsForm.projectName}
                                onChange={e => setSpecsForm(f => ({ ...f, projectName: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:bg-white/15" data-testid="input-project-name" />
                            </div>
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold text-white/50 mb-1 block">بريد العميل الرسمي للمشروع</label>
                              <Input type="email" placeholder="client@example.com" value={specsForm.clientEmail}
                                onChange={e => setSpecsForm(f => ({ ...f, clientEmail: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white placeholder:text-white/30" data-testid="input-client-email" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-white/50 mb-1 flex items-center gap-1">الميزانية الكلية (<SARIcon size={8} className="opacity-60" />)</label>
                              <Input type="number" placeholder="5000" value={specsForm.totalBudget}
                                onChange={e => setSpecsForm(f => ({ ...f, totalBudget: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white placeholder:text-white/30" data-testid="input-total-budget" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-white/50 mb-1 flex items-center gap-1">المدفوع حالياً (<SARIcon size={8} className="opacity-60" />)</label>
                              <Input type="number" placeholder="2500" value={specsForm.paidAmount}
                                onChange={e => setSpecsForm(f => ({ ...f, paidAmount: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white placeholder:text-white/30" data-testid="input-paid-amount" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-white/50 mb-1 block">تاريخ البداية</label>
                              <Input type="date" value={specsForm.startDate}
                                onChange={e => setSpecsForm(f => ({ ...f, startDate: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white" data-testid="input-start-date" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-white/50 mb-1 block">تاريخ التسليم</label>
                              <Input type="date" value={specsForm.deadline}
                                onChange={e => setSpecsForm(f => ({ ...f, deadline: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white" data-testid="input-deadline" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-white/50 mb-1 block">الساعات المقدّرة</label>
                              <Input type="number" placeholder="120" value={specsForm.estimatedHours}
                                onChange={e => setSpecsForm(f => ({ ...f, estimatedHours: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white placeholder:text-white/30" data-testid="input-estimated-hours" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-white/50 mb-1 block">حالة المشروع</label>
                              <Select value={specsForm.projectStatus} onValueChange={v => setSpecsForm(f => ({ ...f, projectStatus: v }))}>
                                <SelectTrigger className="text-sm bg-white/10 border-white/20 text-white" data-testid="select-project-status">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="planning">تخطيط</SelectItem>
                                  <SelectItem value="in_dev">قيد التطوير</SelectItem>
                                  <SelectItem value="testing">اختبار</SelectItem>
                                  <SelectItem value="delivery">تسليم</SelectItem>
                                  <SelectItem value="closed">مغلق</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Tech Stack */}
                        <div className="border border-black/[0.07] dark:border-white/[0.08] rounded-2xl p-5 bg-white dark:bg-gray-900">
                          <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5" />
                            البنية التقنية
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold text-black/50 dark:text-white/50 mb-1 block">Stack التقني الكامل</label>
                              <Input placeholder="مثال: React 18, Node.js, Express, MongoDB Atlas" value={specsForm.techStack}
                                onChange={e => setSpecsForm(f => ({ ...f, techStack: e.target.value }))}
                                className="text-sm" data-testid="input-specs-techstack" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black/50 dark:text-white/50 mb-1 block">Framework الأساسي</label>
                              <Input placeholder="مثال: Next.js 14, Laravel 11" value={specsForm.framework}
                                onChange={e => setSpecsForm(f => ({ ...f, framework: e.target.value }))}
                                className="text-sm" data-testid="input-framework" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black/50 dark:text-white/50 mb-1 block">لغة البرمجة</label>
                              <Select value={specsForm.language} onValueChange={v => setSpecsForm(f => ({ ...f, language: v }))}>
                                <SelectTrigger className="text-sm" data-testid="select-language"><SelectValue placeholder="اختر اللغة" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="TypeScript">TypeScript</SelectItem>
                                  <SelectItem value="JavaScript">JavaScript</SelectItem>
                                  <SelectItem value="Python">Python</SelectItem>
                                  <SelectItem value="PHP">PHP</SelectItem>
                                  <SelectItem value="Dart">Dart (Flutter)</SelectItem>
                                  <SelectItem value="Swift">Swift</SelectItem>
                                  <SelectItem value="Kotlin">Kotlin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black/50 dark:text-white/50 mb-1 block">قاعدة البيانات</label>
                              <Select value={specsForm.database} onValueChange={v => setSpecsForm(f => ({ ...f, database: v }))}>
                                <SelectTrigger className="text-sm" data-testid="select-specs-database"><SelectValue placeholder="اختر قاعدة البيانات" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MongoDB Atlas M0 (Free)">MongoDB Atlas M0 (Free)</SelectItem>
                                  <SelectItem value="MongoDB Atlas M10">MongoDB Atlas M10 ($57/mo)</SelectItem>
                                  <SelectItem value="MongoDB Atlas M20">MongoDB Atlas M20 ($140/mo)</SelectItem>
                                  <SelectItem value="MongoDB Atlas M30">MongoDB Atlas M30 ($410/mo)</SelectItem>
                                  <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                                  <SelectItem value="MySQL">MySQL</SelectItem>
                                  <SelectItem value="Redis">Redis</SelectItem>
                                  <SelectItem value="Firebase">Firebase Firestore</SelectItem>
                                  <SelectItem value="Supabase">Supabase</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black/50 dark:text-white/50 mb-1 block">الاستضافة</label>
                              <Select value={specsForm.hosting} onValueChange={v => setSpecsForm(f => ({ ...f, hosting: v }))}>
                                <SelectTrigger className="text-sm" data-testid="select-specs-hosting"><SelectValue placeholder="اختر الاستضافة" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="AWS EC2 t3.micro">AWS EC2 t3.micro ($8/mo)</SelectItem>
                                  <SelectItem value="AWS EC2 t3.small">AWS EC2 t3.small ($17/mo)</SelectItem>
                                  <SelectItem value="AWS EC2 t3.medium">AWS EC2 t3.medium ($34/mo)</SelectItem>
                                  <SelectItem value="AWS EC2 t3.large">AWS EC2 t3.large ($67/mo)</SelectItem>
                                  <SelectItem value="AWS EC2 c5.xlarge">AWS EC2 c5.xlarge ($170/mo)</SelectItem>
                                  <SelectItem value="Vercel">Vercel</SelectItem>
                                  <SelectItem value="DigitalOcean">DigitalOcean Droplet</SelectItem>
                                  <SelectItem value="Railway">Railway</SelectItem>
                                  <SelectItem value="Render">Render</SelectItem>
                                  <SelectItem value="VPS">VPS مخصص</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Section 3: Infrastructure & Repos */}
                        <div className="border border-black/[0.07] dark:border-white/[0.08] rounded-2xl p-5 bg-white dark:bg-gray-900">
                          <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Server className="w-3.5 h-3.5" />
                            بيانات الاستضافة والمستودعات
                          </p>
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-black/50 dark:text-white/50 mb-1 block">GitHub Repository URL</label>
                              <Input placeholder="https://github.com/qirox/project-name" value={specsForm.githubRepoUrl}
                                onChange={e => setSpecsForm(f => ({ ...f, githubRepoUrl: e.target.value }))}
                                className="text-sm font-mono" dir="ltr" data-testid="input-github-repo" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black/50 dark:text-white/50 mb-1 block">MongoDB Cluster URI / Database Connection String</label>
                              <Input placeholder="mongodb+srv://user:pass@cluster.mongodb.net/dbname" value={specsForm.databaseUri}
                                onChange={e => setSpecsForm(f => ({ ...f, databaseUri: e.target.value }))}
                                className="text-sm font-mono text-xs" dir="ltr" data-testid="input-database-uri" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-black/50 dark:text-white/50 mb-1 block">IP السيرفر</label>
                                <Input placeholder="192.168.1.1" value={specsForm.serverIp}
                                  onChange={e => setSpecsForm(f => ({ ...f, serverIp: e.target.value }))}
                                  className="text-sm font-mono" dir="ltr" data-testid="input-server-ip" />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-black/50 dark:text-white/50 mb-1 block">Custom Domain</label>
                                <Input placeholder="example.com" value={specsForm.customDomain}
                                  onChange={e => setSpecsForm(f => ({ ...f, customDomain: e.target.value }))}
                                  className="text-sm font-mono" dir="ltr" data-testid="input-custom-domain" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-black/50 dark:text-white/50 mb-1 block">Deployment Username</label>
                                <Input placeholder="ubuntu / root / deploy" value={specsForm.deploymentUsername}
                                  onChange={e => setSpecsForm(f => ({ ...f, deploymentUsername: e.target.value }))}
                                  className="text-sm font-mono" dir="ltr" data-testid="input-deploy-username" />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-black/50 dark:text-white/50 mb-1 block">Deployment Password / SSH Key</label>
                                <Input type="password" placeholder="••••••••••" value={specsForm.deploymentPassword}
                                  onChange={e => setSpecsForm(f => ({ ...f, deploymentPassword: e.target.value }))}
                                  className="text-sm font-mono" dir="ltr" data-testid="input-deploy-password" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-black/50 dark:text-white/50 mb-1 block">Staging URL (رابط الاختبار)</label>
                                <Input placeholder="https://staging.example.com" value={specsForm.stagingUrl}
                                  onChange={e => setSpecsForm(f => ({ ...f, stagingUrl: e.target.value }))}
                                  className="text-sm font-mono text-xs" dir="ltr" data-testid="input-staging-url" />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-black/50 dark:text-white/50 mb-1 block">Production URL (رابط الإنتاج)</label>
                                <Input placeholder="https://example.com" value={specsForm.productionUrl}
                                  onChange={e => setSpecsForm(f => ({ ...f, productionUrl: e.target.value }))}
                                  className="text-sm font-mono text-xs" dir="ltr" data-testid="input-production-url" />
                              </div>
                            </div>
                            <div className="flex gap-4 pt-1">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={specsForm.sslEnabled}
                                  onChange={e => setSpecsForm(f => ({ ...f, sslEnabled: e.target.checked }))}
                                  className="w-4 h-4 rounded" data-testid="checkbox-ssl" />
                                <span className="text-xs text-black/60 dark:text-white/60 font-medium">SSL مُفعّل (HTTPS)</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={specsForm.cdnEnabled}
                                  onChange={e => setSpecsForm(f => ({ ...f, cdnEnabled: e.target.checked }))}
                                  className="w-4 h-4 rounded" data-testid="checkbox-cdn" />
                                <span className="text-xs text-black/60 dark:text-white/60 font-medium">CDN مُفعّل</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Section 4: Environment Variables */}
                        <div className="border border-black/[0.07] dark:border-white/[0.08] rounded-2xl p-5 bg-white dark:bg-gray-900">
                          <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-1 flex items-center gap-2">
                            <KeyRound className="w-3.5 h-3.5" />
                            Environment Variables & Configs
                          </p>
                          <p className="text-[9px] text-black/30 dark:text-white/30 mb-3">كل متغير في سطر بصيغة KEY=VALUE</p>
                          <Textarea placeholder={"PORT=3000\nNODE_ENV=production\nJWT_SECRET=your_secret\nSTRIPE_KEY=sk_live_...\nSENDGRID_KEY=SG..."}
                            value={specsForm.variables}
                            onChange={e => setSpecsForm(f => ({ ...f, variables: e.target.value }))}
                            className="text-xs resize-none h-40 font-mono bg-black/[0.02] dark:bg-white/[0.04]" dir="ltr"
                            data-testid="textarea-specs-variables" />
                        </div>

                        {/* Section 5: Project Concept */}
                        <div className="border border-black/[0.07] dark:border-white/[0.08] rounded-2xl p-5 bg-white dark:bg-gray-900">
                          <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <LayoutGrid className="w-3.5 h-3.5" />
                            تفاصيل المشروع والرؤية
                          </p>
                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] font-bold text-black/50 dark:text-white/50 mb-1 block">فكرة المشروع والهدف منه</label>
                              <Textarea placeholder="اشرح فكرة المشروع، هدفه، ومشكلته التي يحلها..." value={specsForm.projectConcept}
                                onChange={e => setSpecsForm(f => ({ ...f, projectConcept: e.target.value }))}
                                className="text-sm resize-none h-20" data-testid="textarea-specs-concept" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black/50 dark:text-white/50 mb-1 block">الجمهور المستهدف</label>
                              <Input placeholder="مثال: أصحاب المطاعم في المنطقة الشرقية" value={specsForm.targetAudience}
                                onChange={e => setSpecsForm(f => ({ ...f, targetAudience: e.target.value }))}
                                className="text-sm" data-testid="input-target-audience" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black/50 dark:text-white/50 mb-1 block">الميزات الأساسية</label>
                              <Textarea placeholder="- لوحة تحكم المطعم&#10;- قائمة رقمية بـ QR&#10;- نظام الطلبات..." value={specsForm.mainFeatures}
                                onChange={e => setSpecsForm(f => ({ ...f, mainFeatures: e.target.value }))}
                                className="text-sm resize-none h-24" data-testid="textarea-main-features" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black/50 dark:text-white/50 mb-1 block">روابط مرجعية (مواقع مشابهة)</label>
                              <Textarea placeholder="https://example1.com&#10;https://example2.com" value={specsForm.referenceLinks}
                                onChange={e => setSpecsForm(f => ({ ...f, referenceLinks: e.target.value }))}
                                className="text-sm resize-none h-16 font-mono text-xs" dir="ltr" data-testid="textarea-reference-links" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black/50 dark:text-white/50 mb-1 block">لوحة الألوان</label>
                              <Input placeholder="مثال: #FF5733, #2C3E50, #27AE60" value={specsForm.colorPalette}
                                onChange={e => setSpecsForm(f => ({ ...f, colorPalette: e.target.value }))}
                                className="text-sm font-mono" dir="ltr" data-testid="input-color-palette" />
                            </div>
                          </div>
                        </div>

                        {/* Section 6: Notes */}
                        <div className="border border-black/[0.07] dark:border-white/[0.08] rounded-2xl p-5 bg-white dark:bg-gray-900">
                          <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-4">الملاحظات</p>
                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] font-bold text-black/50 dark:text-white/50 mb-1 block">ملاحظات تقنية (تظهر للعميل)</label>
                              <Textarea placeholder="ملاحظات تقنية مهمة يجب أن يعلمها العميل..." value={specsForm.notes}
                                onChange={e => setSpecsForm(f => ({ ...f, notes: e.target.value }))}
                                className="text-sm resize-none h-20" data-testid="textarea-specs-notes" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black/50 dark:text-white/50 mb-1 block">ملاحظات الفريق الداخلية (لا تظهر للعميل)</label>
                              <Textarea placeholder="ملاحظات داخلية للفريق فقط..." value={specsForm.teamNotes}
                                onChange={e => setSpecsForm(f => ({ ...f, teamNotes: e.target.value }))}
                                className="text-sm resize-none h-20 border-dashed" data-testid="textarea-team-notes" />
                            </div>
                          </div>
                        </div>

                        {/* Save Button */}
                        <div className="sticky bottom-0 bg-white dark:bg-gray-900 pt-3 pb-5 -mx-6 px-6 border-t border-black/[0.06] dark:border-white/[0.08]">
                          <Button className="w-full bg-black text-white hover:bg-black/80 font-bold h-11 text-sm rounded-xl"
                            onClick={() => saveSpecsMutation.mutate({ orderId: selectedOrder.id, specs: {
                              ...specsForm,
                              totalBudget: specsForm.totalBudget ? Number(specsForm.totalBudget) : undefined,
                              paidAmount: specsForm.paidAmount ? Number(specsForm.paidAmount) : undefined,
                              estimatedHours: specsForm.estimatedHours ? Number(specsForm.estimatedHours) : undefined,
                            }})}
                            disabled={saveSpecsMutation.isPending} data-testid="button-save-specs">
                            {saveSpecsMutation.isPending
                              ? <><Loader2 className="w-4 h-4 animate-spin ml-2" />جاري الحفظ...</>
                              : <><Server className="w-4 h-4 ml-2" />حفظ وتأسيس البنية التحتية 🚀</>}
                          </Button>
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                {/* Tab 3: Manage Order */}
                <TabsContent value="manage" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="px-6 py-5 space-y-5">
                      <div>
                        <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-3">تحديث حالة الطلب</p>
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
                        <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-3">ملاحظات داخلية</p>
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

      {/* Check-in notes dialog */}
      <Dialog open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <LogIn className="w-4 h-4 text-green-600" />تسجيل الحضور
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-700">
              ما الذي تخطط للعمل عليه اليوم؟
            </div>
            <Textarea
              placeholder="مثال: العمل على تصميم الصفحة الرئيسية وإصلاح bugs الـ API..."
              value={checkInNotes}
              onChange={e => setCheckInNotes(e.target.value)}
              className="text-sm resize-none border-black/[0.08] rounded-xl"
              rows={3}
              data-testid="textarea-check-in-notes"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setShowCheckInDialog(false)}>
                إلغاء
              </Button>
              <Button size="sm" className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={submitCheckIn} disabled={checkInMutation.isPending} data-testid="button-submit-check-in">
                {checkInMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5 ml-1" />}
                تسجيل الحضور
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Check-out notes dialog */}
      <Dialog open={showCheckOutDialog} onOpenChange={setShowCheckOutDialog}>
        <DialogContent className="sm:max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <LogOut className="w-4 h-4 text-red-500" />تسجيل الانصراف
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
              ماذا أنجزت اليوم؟ سيظهر هذا في تقرير الإدارة
            </div>
            <Textarea
              placeholder="مثال: أكملت تصميم الصفحة الرئيسية وأصلحت 3 bugs وعملت على صفحة المنتجات..."
              value={checkOutAchievements}
              onChange={e => setCheckOutAchievements(e.target.value)}
              className="text-sm resize-none border-black/[0.08] rounded-xl"
              rows={3}
              data-testid="textarea-check-out-achievements"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setShowCheckOutDialog(false)}>
                إلغاء
              </Button>
              <Button size="sm" className="flex-1 text-xs border-red-200 text-red-600 hover:bg-red-50" variant="outline" onClick={submitCheckOut} disabled={checkOutMutation.isPending} data-testid="button-submit-check-out">
                {checkOutMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5 ml-1" />}
                تسجيل الانصراف
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
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const [, setLocation] = useLocation();

  const statusMap = {
    pending: { label: L ? "قيد المراجعة" : "Under Review", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
    approved: { label: L ? "تمت الموافقة" : "Approved", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: CheckCircle2 },
    in_progress: { label: L ? "قيد التنفيذ" : "In Progress", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", icon: Activity },
    completed: { label: L ? "مكتمل" : "Completed", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: CheckCircle2 },
    rejected: { label: L ? "مرفوض" : "Rejected", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: AlertCircle },
    cancelled: { label: L ? "ملغي" : "Cancelled", color: "text-gray-500", bg: "bg-gray-50 border-gray-200", icon: AlertCircle },
  } as Record<string, { label: string; color: string; bg: string; icon: any }>;

  const modStatusMap = {
    pending: { label: L ? "قيد الانتظار" : "Pending", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    in_review: { label: L ? "قيد المراجعة" : "In Review", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
    in_progress: { label: L ? "قيد التنفيذ" : "In Progress", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
    completed: { label: L ? "مكتمل" : "Completed", color: "text-green-700", bg: "bg-green-50 border-green-200" },
    rejected: { label: L ? "مرفوض" : "Rejected", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  } as Record<string, { label: string; color: string; bg: string }>;

  const priorityMap = {
    low: { label: L ? "منخفض" : "Low", color: "text-gray-600", bg: "bg-gray-50 border-gray-200" },
    medium: { label: L ? "متوسط" : "Medium", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    high: { label: L ? "عالي" : "High", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
    urgent: { label: L ? "عاجل" : "Urgent", color: "text-red-600", bg: "bg-red-50 border-red-200" },
  } as Record<string, { label: string; color: string; bg: string }>;

  // Redirect to email verification if account is not verified
  useEffect(() => {
    if (user && (user as any).emailVerified === false && (user as any).role === "client") {
      setLocation("/verify-email?flow=register");
      return;
    }
    // Redirect new clients to onboarding (first time)
    if (user && user.role === "client") {
      try {
        const done = localStorage.getItem("qirox_onboarding_done");
        if (!done) setLocation("/onboarding");
      } catch {}
    }
  }, [user]);

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
  const [modTypeId, setModTypeId] = useState<string>("");
  const [clientSpecsOrderId, setClientSpecsOrderId] = useState<string | null>(null);
  const [subSvcDialogOpen, setSubSvcDialogOpen] = useState(false);
  const [subSvcProjectId, setSubSvcProjectId] = useState("");
  const [subSvcProjectLabel, setSubSvcProjectLabel] = useState("");
  const [subSvcType, setSubSvcType] = useState("");
  const [subSvcNotes, setSubSvcNotes] = useState("");
  const [uploadingProofOrderId, setUploadingProofOrderId] = useState<string | null>(null);
  const proofFileRef = useRef<HTMLInputElement>(null);
  const [linkedProjectKeyId, setLinkedProjectKeyId] = useState<string | null>(null);
  const [showAllSectors, setShowAllSectors] = useState(false);

  const uploadProofMutation = useMutation({
    mutationFn: async ({ orderId, file }: { orderId: string; file: File }) => {
      const fd = new FormData(); fd.append("file", file);
      const up = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      if (!up.ok) throw new Error("فشل رفع الملف");
      const { url } = await up.json();
      await apiRequest("PATCH", `/api/orders/${orderId}/proof`, { paymentProofUrl: url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setUploadingProofOrderId(null);
      toast({ title: "✅ تم رفع سند التحويل بنجاح" });
    },
    onError: () => toast({ title: "فشل رفع السند", variant: "destructive" }),
  });

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

  const { data: modQuota } = useQuery<any>({
    queryKey: ['/api/mod-quota'],
    enabled: !!(user?.role === 'client'),
  });

  const { data: modTypePrices = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/mod-type-prices'],
    enabled: !!(user?.role === 'client'),
  });

  const { data: walletData } = useQuery<any>({
    queryKey: ['/api/wallet'],
    enabled: !!(user?.role === 'client'),
  });

  const { data: cartData } = useQuery<any>({
    queryKey: ['/api/cart'],
    enabled: !!(user?.role === 'client'),
  });

  const { data: upcomingMeetings = [] } = useQuery<any[]>({
    queryKey: ['/api/qmeet/upcoming'],
    enabled: !!user,
    refetchInterval: 60000,
  });

  const { data: myApiKeys = [] } = useQuery<any[]>({
    queryKey: ['/api/my-api-keys'],
    enabled: !!(user?.role === 'client'),
  });

  const linkedApiKeys = myApiKeys.filter((k: any) => k.projectName && k.projectName.trim() !== "");

  const { data: linkedProjectPreview, isLoading: isLoadingLinkedPreview } = useQuery<any>({
    queryKey: ['/api/my-api-keys', linkedProjectKeyId, 'preview'],
    enabled: !!linkedProjectKeyId,
    queryFn: async () => {
      const res = await fetch(`/api/my-api-keys/${linkedProjectKeyId}/preview`, { credentials: 'include' });
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
  });

  const [instantMeetResult, setInstantMeetResult] = useState<any>(null);
  const [instantCopied, setInstantCopied] = useState<string | null>(null);

  const copyInstantField = (text: string, field: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setInstantCopied(field);
    setTimeout(() => setInstantCopied(null), 2000);
  };

  const instantMeetMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/qmeet/instant", {}),
    onSuccess: async (res: any) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ['/api/qmeet/upcoming'] });
      setInstantMeetResult(data);
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const cancelModMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/modification-requests/${id}/cancel`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/mod-quota'] });
      toast({ title: "تم إلغاء طلب التعديل" });
    },
    onError: (err: any) => toast({ title: "تعذّر إلغاء الطلب", description: err?.message, variant: "destructive" }),
  });

  const createModRequestMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; priority: string; projectId?: string; modificationTypeId?: string }) => {
      const res = await apiRequest("POST", "/api/modification-requests", data);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "خطأ غير معروف");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/modification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/mod-quota'] });
      setModDialogOpen(false);
      setModTitle("");
      setModDescription("");
      setModPriority("medium");
      setModProjectId("");
      setModTypeId("");
      toast({ title: "تم إرسال طلب التعديل بنجاح" });
    },
    onError: (err: any) => {
      toast({ title: "تعذّر إرسال الطلب", description: err?.message, variant: "destructive" });
    },
  });

  const handleSubmitModRequest = () => {
    if (!modTitle.trim() || !modDescription.trim()) return;
    createModRequestMutation.mutate({
      title: modTitle,
      description: modDescription,
      priority: modPriority,
      ...(modProjectId && modProjectId !== "none" ? { projectId: modProjectId } : {}),
      ...(modTypeId ? { modificationTypeId: modTypeId } : {}),
    });
  };

  const bestQuota = modQuota?.quotas?.[0];
  const isLifetimePlan = bestQuota?.isLifetime;
  const isDefaultQuota = bestQuota?.isDefaultQuota;
  const quotaExceeded = !isLifetimePlan && bestQuota && !bestQuota.hasUnlimitedAddon && bestQuota.remainingThisPeriod === 0;
  const activeModTypePrices = modTypePrices.filter((t: any) => t.isActive);

  const createSubSvcMutation = useMutation({
    mutationFn: async (data: { projectId?: string; projectLabel?: string; serviceType: string; notes: string }) => {
      const res = await apiRequest("POST", "/api/client/sub-service-request", data);
      return res.json();
    },
    onSuccess: () => {
      setSubSvcDialogOpen(false);
      setSubSvcType("");
      setSubSvcNotes("");
      toast({ title: "تم إرسال طلبك بنجاح", description: "سيتواصل معك الفريق قريباً" });
    },
    onError: () => toast({ title: "خطأ في الإرسال", variant: "destructive" }),
  });

  const handleSubmitSubSvc = () => {
    if (!subSvcType.trim()) return;
    createSubSvcMutation.mutate({
      projectId: subSvcProjectId || undefined,
      projectLabel: subSvcProjectLabel || undefined,
      serviceType: subSvcType,
      notes: subSvcNotes,
    });
  };

  const openSubSvcDialog = (projectId: string, projectLabel: string) => {
    setSubSvcProjectId(projectId);
    setSubSvcProjectLabel(projectLabel);
    setSubSvcType("");
    setSubSvcNotes("");
    setSubSvcDialogOpen(true);
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
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-black/20 dark:text-white/20" />
        <p className="text-xs text-black/30 dark:text-white/30 mt-3">{L ? "جاري التحميل..." : "Loading..."}</p>
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

  const { data: pricingPlans } = usePricingPlans();

  const pendingOrders = orders?.filter((o: any) => o.status === 'pending') || [];
  const activeProjects = projects?.filter((p: any) => (p.status as string) !== 'completed') || [];
  const completedOrders = orders?.filter((o: any) => (o.status as string) === 'completed') || [];
  const totalSpent = orders?.reduce((sum: number, o: any) => {
    if ((o.status as string) === 'completed' || (o.status as string) === 'approved' || o.status === 'in_progress') {
      return sum + Number(o.totalAmount || 0);
    }
    return sum;
  }, 0) || 0;

  const isEmployee = user.role !== 'client';
  const dateStr = currentTime.toLocaleDateString(L ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const { data: phoneVerifyStatus } = useQuery<any>({
    queryKey: ["/api/phone-verify/status"],
    enabled: user?.role === "client",
    staleTime: 30000,
  });
  const phoneUnverified = user?.role === "client" && phoneVerifyStatus && !phoneVerifyStatus.phoneVerified;

  const projectPhases = L ? ["التصميم", "التطوير", "الاختبار", "التسليم"] : ["Design", "Development", "Testing", "Delivery"];
  const getPhase = (progress: number) => Math.min(Math.floor(progress / 25), 3);

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-gray-950 relative" dir={dir}>
      <WelcomeAssistant />
      <FloatingAI />
      <div className="absolute inset-0 overflow-hidden pointer-events-none"><PageGraphics variant="dashboard" /></div>
      {/* Top Hero Banner */}
      <div className="bg-white dark:bg-gray-900 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                {user.fullName?.charAt(0) || "U"}
              </div>
              <div>
                <p className="text-[10px] text-black/30 dark:text-white/30 mb-0.5">{dateStr}</p>
                <h1 className="text-xl font-black text-black dark:text-white font-heading">
                  {getGreeting(lang)}{L ? "،" : ","} {(user.fullName || user.username || "")?.split(" ")[0]}
                </h1>
                <p className="text-xs text-black/40 dark:text-white/40 mt-0.5">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/prices">
                <Button size="sm" variant="outline" className="rounded-xl h-9 px-4 text-xs border-black/[0.08] dark:border-white/[0.1] hover:border-black/20 dark:hover:border-white/20 gap-2" data-testid="button-browse-services">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {L ? "تصفح الخدمات" : "Browse Services"}
                </Button>
              </Link>
              <Link href="/cart">
                <Button size="sm" variant="outline" className="rounded-xl h-9 px-4 text-xs border-black/[0.08] dark:border-white/[0.1] hover:border-black/20 dark:hover:border-white/20 gap-2">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  {L ? "السلة" : "Cart"}
                </Button>
              </Link>
              <Link href="/order">
                <Button size="sm" className="bg-black text-white hover:bg-black/80 rounded-xl h-9 px-5 text-xs gap-2 font-bold" data-testid="button-new-order">
                  <Plus className="w-3.5 h-3.5" />
                  {L ? "طلب جديد" : "New Order"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-5 md:py-8">
        {/* Phone Verification Banner */}
        {phoneUnverified && (
          <Link href="/phone-verify">
            <div className="mb-5 bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-amber-100 transition-all" data-testid="banner-phone-verify">
              <div className="w-10 h-10 bg-amber-200 rounded-xl flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-amber-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-amber-900 text-sm">{L ? "رقم جوالك غير موثّق" : "Phone number not verified"}</p>
                <p className="text-amber-700 text-xs mt-0.5">{L ? "وثّق رقمك عبر تيليجرام أو اتصال — يُحسّن أمان حسابك" : "Verify via Telegram or call for account security"}</p>
              </div>
              <div className="bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0">
                {L ? "توثيق الآن" : "Verify Now"}
              </div>
            </div>
          </Link>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: L ? "إجمالي الطلبات" : "Total Orders", value: orders?.length || 0, icon: FileText, color: "from-blue-500 to-blue-600", bg: "bg-blue-50", text: "text-blue-600" },
            { label: L ? "مشاريع نشطة" : "Active Projects", value: activeProjects.length, icon: Activity, color: "from-violet-500 to-indigo-600", bg: "bg-violet-50", text: "text-violet-600" },
            { label: L ? "قيد الانتظار" : "Pending", value: pendingOrders.length, icon: Clock, color: "from-amber-500 to-orange-500", bg: "bg-amber-50", text: "text-amber-600" },
            { label: L ? "مكتملة" : "Completed", value: completedOrders.length, icon: CheckCircle2, color: "from-green-500 to-emerald-600", bg: "bg-green-50", text: "text-green-600" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-5 hover:shadow-md transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-md`}>
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-xs font-bold ${s.text} ${s.bg} px-2 py-0.5 rounded-full`}>
                    {s.value > 0 ? `+${s.value}` : "—"}
                  </span>
                </div>
                <p className="text-3xl font-black text-black dark:text-white mb-1">{s.value}</p>
                <p className="text-[11px] text-black/35 dark:text-white/35 font-medium">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Account Security — Biometric */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-5">
            <p className="text-[10px] font-bold text-black/35 dark:text-white/35 uppercase tracking-widest mb-4 flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5" />
              {L ? "أمان الحساب" : "Account Security"}
            </p>
            <BiometricManager />
          </div>
        </motion.div>

        {/* Wallet + Cart Creative Section */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

          {/* ── Wallet Card ── */}
          <div className="relative overflow-hidden rounded-2xl bg-black p-6 flex flex-col gap-4" data-testid="card-wallet-summary">
            {/* decorative rings */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full border border-white/[0.06]" />
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full border border-white/[0.06]" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full border border-white/[0.04] -translate-x-1/2 translate-y-1/2" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-white/40 text-[11px] font-medium mb-1">{L ? "محفظتي" : "My Wallet"}</p>
                <p className="text-white text-4xl font-black tracking-tight">
                  {walletData?.outstanding != null ? Number(walletData.outstanding).toLocaleString(L ? 'ar-SA' : 'en-US') : "—"}
                  {L ? <SARIcon size={14} className="opacity-30 mr-1" /> : <span className="text-white/30 text-sm font-normal mr-1">SAR</span>}
                </p>
                <p className="text-white/35 text-[10px] mt-1">
                  {walletData?.outstanding > 0 ? (L ? "رصيد مستحق" : "Amount Due") : walletData?.outstanding === 0 ? (L ? "لا توجد مستحقات ✓" : "No outstanding amount ✓") : (L ? "جارٍ التحميل..." : "Loading...")}
                </p>
              </div>
              <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="relative grid grid-cols-2 gap-3">
              <div className="bg-white/[0.06] rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <p className="text-white/40 text-[10px]">{L ? "مدين" : "Debit"}</p>
                </div>
                <p className="text-white font-black text-lg">{walletData?.totalDebit != null ? Number(walletData.totalDebit).toLocaleString() : "—"}</p>
                {L ? <SARIcon size={9} className="opacity-25 mt-0.5" /> : <p className="text-white/25 text-[9px]">SAR</p>}
              </div>
              <div className="bg-white/[0.06] rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <p className="text-white/40 text-[10px]">{L ? "دائن" : "Credit"}</p>
                </div>
                <p className="text-white font-black text-lg">{walletData?.totalCredit != null ? Number(walletData.totalCredit).toLocaleString() : "—"}</p>
                {L ? <SARIcon size={9} className="opacity-25 mt-0.5" /> : <p className="text-white/25 text-[9px]">SAR</p>}
              </div>
            </div>

            {walletData?.outstanding > 0 && (
              <div className="relative bg-amber-500/20 border border-amber-400/30 rounded-xl px-3 py-2 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <p className="text-amber-300 text-[10px] font-medium">{L ? "يوجد رصيد مستحق، يرجى التواصل مع الفريق" : "Outstanding balance, please contact the team"}</p>
              </div>
            )}

            <Link href="/wallet">
              <button className="relative w-full mt-1 flex items-center justify-between px-4 py-2.5 bg-white/[0.07] hover:bg-white/[0.12] rounded-xl transition-all group" data-testid="button-view-wallet">
                <span className="text-white/60 text-xs font-medium group-hover:text-white/90 transition-colors">{L ? "عرض كشف الحساب التفصيلي" : "View Account Statement"}</span>
                <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 transition-colors" />
              </button>
            </Link>
          </div>

          {/* ── Cart Card ── */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.08] p-6 flex flex-col gap-4" data-testid="card-cart-summary">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-black/40 dark:text-white/40 text-[11px] font-medium mb-1">{L ? "عربة التسوق" : "Shopping Cart"}</p>
                <div className="flex items-end gap-2">
                  <p className="text-black dark:text-white text-4xl font-black tracking-tight">
                    {cartData?.items?.length ?? 0}
                  </p>
                  <p className="text-black/35 dark:text-white/35 text-sm mb-1">
                    {L ? ((cartData?.items?.length ?? 0) === 1 ? "عنصر" : "عناصر") : "items"}
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="w-11 h-11 bg-black dark:bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-5 h-5 text-white dark:text-black" />
                </div>
                {(cartData?.items?.length ?? 0) > 0 && (
                  <span className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                    {cartData?.items?.length}
                  </span>
                )}
              </div>
            </div>

            {/* Items preview */}
            {(cartData?.items?.length ?? 0) === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-4 gap-2">
                <ShoppingCart className="w-8 h-8 text-black/10 dark:text-white/10" />
                <p className="text-black/25 dark:text-white/25 text-xs">{L ? "السلة فارغة" : "Cart is empty"}</p>
                <Link href="/prices">
                  <button className="text-[10px] px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold hover:opacity-80 transition-all mt-1" data-testid="button-browse-from-cart">{L ? "تصفح الخدمات" : "Browse Services"}</button>
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-2 flex-1">
                  {(cartData?.items ?? []).slice(0, 3).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 bg-black dark:bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-3 h-3 text-white dark:text-black" />
                        </div>
                        <p className="text-xs font-medium text-black dark:text-white truncate">{item.serviceName || item.name || (L ? "خدمة" : "Service")}</p>
                      </div>
                      <p className="text-xs font-black text-black dark:text-white flex-shrink-0">
                        <span className="flex items-center gap-1">{item.price != null ? Number(item.price).toLocaleString() : "—"} <SARIcon size={9} className="opacity-30" /></span>
                      </p>
                    </div>
                  ))}
                  {(cartData?.items?.length ?? 0) > 3 && (
                    <p className="text-center text-[10px] text-black/30 dark:text-white/30">+{cartData.items.length - 3} {L ? "عناصر إضافية" : "more items"}</p>
                  )}
                </div>

                <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-black/35 dark:text-white/35">{L ? "الإجمالي" : "Total"}</p>
                    <p className="text-lg font-black text-black dark:text-white">
                      {cartData?.subtotal != null ? Number(cartData.subtotal).toLocaleString() : (cartData?.items ?? []).reduce((s: number, it: any) => s + Number(it.price ?? 0), 0).toLocaleString()}
                      <SARIcon size={10} className="opacity-30 mr-1" />
                    </p>
                  </div>
                  <Link href="/cart">
                    <button className="flex items-center gap-1.5 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-xl hover:opacity-80 transition-all" data-testid="button-go-to-cart">
                      <ShoppingCart className="w-3.5 h-3.5" />
                      {L ? "إكمال الطلب" : "Checkout"}
                    </button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Upcoming QMeet Meetings */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center">
                <Video className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-sm font-bold text-black dark:text-white">{L ? "اجتماعاتك القادمة" : "Upcoming Meetings"}</h2>
            </div>
            <div className="flex items-center gap-2">
              {upcomingMeetings.length > 0 && <span className="text-[11px] text-black/30 dark:text-white/30 font-medium">{upcomingMeetings.length} {L ? "اجتماع" : "meeting(s)"}</span>}
              <button
                onClick={() => instantMeetMutation.mutate()}
                disabled={instantMeetMutation.isPending}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-700/50 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-60"
                data-testid="button-quick-meeting-dashboard"
              >
                {instantMeetMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                {L ? "اجتماع سريع" : "Quick Meeting"}
              </button>
              <button onClick={() => setLocation("/meet/join")} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 border border-violet-200 dark:border-violet-700/50 px-3 py-1.5 rounded-xl transition-colors" data-testid="button-join-by-code-dashboard">
                <KeyRound className="w-3.5 h-3.5" />
                {L ? "انضم بكود" : "Join by Code"}
              </button>
            </div>
          </div>
          {upcomingMeetings.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {upcomingMeetings.map((m: any) => {
                const scheduledDate = new Date(m.scheduledAt);
                const isLive = m.status === "live";
                const dateStr = scheduledDate.toLocaleDateString(L ? "ar-SA" : "en-US", { weekday: "short", month: "short", day: "numeric" });
                const timeStr = scheduledDate.toLocaleTimeString(L ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={m._id} data-testid={`card-meeting-${m._id}`} className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:shadow-md ${isLive ? "bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-700" : "bg-white dark:bg-gray-900 border-black/[0.06] dark:border-white/[0.08]"}`}>
                    {isLive && (
                      <span className="absolute top-3 left-3 flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-100 dark:bg-violet-900/60 dark:text-violet-300 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
                        {L ? "مباشر الآن" : "Live"}
                      </span>
                    )}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isLive ? "bg-violet-600" : "bg-black/[0.06] dark:bg-white/[0.08]"}`}>
                        <Video className={`w-4 h-4 ${isLive ? "text-white" : "text-black/50 dark:text-white/50"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-black dark:text-white truncate">{m.title}</p>
                        <p className="text-[11px] text-black/40 dark:text-white/40 mt-0.5">{m.hostName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-3 h-3 text-black/30 dark:text-white/30 flex-shrink-0" />
                      <span className="text-[11px] text-black/50 dark:text-white/50">{dateStr} — {timeStr}</span>
                    </div>
                    <Button size="sm" onClick={() => window.open(m.meetingLink, '_blank')} className={`w-full rounded-xl h-8 text-xs font-bold gap-1.5 ${isLive ? "bg-violet-600 hover:bg-violet-700 text-white" : "bg-black text-white hover:bg-black/80"}`} data-testid={`button-join-meeting-${m._id}`}>
                      <Video className="w-3 h-3" />
                      {isLive ? (L ? "انضم الآن" : "Join Now") : (L ? "انضم للاجتماع" : "Join Meeting")}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Investment Banner */}
        {totalSpent > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
            <div className="bg-black rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/45 text-xs mb-0.5">{L ? "إجمالي استثمارك في Qirox" : "Your total investment in Qirox"}</p>
                  <p className="text-3xl font-black text-white flex items-center gap-2">{totalSpent.toLocaleString()} {L ? <SARIcon size={16} className="opacity-40" /> : <span className="text-white/40 text-base font-normal">SAR</span>}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-center">
                <div>
                  <p className="text-2xl font-black text-white">{orders?.filter((o: any) => o.status !== 'pending' && o.status !== 'rejected').length || 0}</p>
                  <p className="text-[10px] text-white/40">{L ? "خدمات فعّالة" : "Active Services"}</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <p className="text-2xl font-black text-white">{activeProjects.length}</p>
                  <p className="text-[10px] text-white/40">{L ? "مشاريع جارية" : "Ongoing Projects"}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Subscription Countdown */}
        {(user as any).subscriptionStatus === "active" && (user as any).subscriptionExpiresAt && (() => {
          const expiresAt = new Date((user as any).subscriptionExpiresAt);
          const now = new Date();
          const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 86400000));
          const totalDays = (user as any).subscriptionPeriod === "monthly" ? 30 : (user as any).subscriptionPeriod === "6months" ? 180 : 365;
          const pct = Math.max(0, Math.min(100, Math.round((daysLeft / totalDays) * 100)));
          const isWarning = daysLeft <= 30;
          const isDanger = daysLeft <= 7;
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-8">
              <div className={`rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center gap-4 border ${isDanger ? "bg-red-50 border-red-200" : isWarning ? "bg-amber-50 border-amber-200" : "bg-gradient-to-l from-black/[0.03] to-transparent border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-gray-900"}`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isDanger ? "bg-red-100" : isWarning ? "bg-amber-100" : "bg-black"}`}>
                  <Crown className={`w-5 h-5 ${isDanger ? "text-red-600" : isWarning ? "text-amber-600" : "text-white"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`font-black text-sm ${isDanger ? "text-red-700" : isWarning ? "text-amber-700" : "text-black dark:text-white"}`}>
                      {L ? `اشتراكك في ${(user as any).subscriptionSegmentNameAr || "قيروكس"}` : `Your ${(user as any).subscriptionSegmentNameEn || "QIROX"} Subscription`}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDanger ? "bg-red-100 text-red-600" : isWarning ? "bg-amber-100 text-amber-600" : "bg-black/10 dark:bg-white/10 text-black/60 dark:text-white/60"}`}>{L ? "نشط" : "Active"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-black/[0.06] rounded-full overflow-hidden max-w-xs">
                      <motion.div
                        className={`h-full rounded-full ${isDanger ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-black"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                    </div>
                    <p className={`text-xs font-black ${isDanger ? "text-red-600" : isWarning ? "text-amber-600" : "text-black dark:text-white"}`}>{pct}%</p>
                  </div>
                  <p className={`text-[11px] mt-1 ${isDanger ? "text-red-600 font-bold" : isWarning ? "text-amber-600 font-bold" : "text-black/40 dark:text-white/40"}`}>
                    {isDanger
                      ? (L ? `⚠️ ينتهي خلال ${daysLeft} أيام فقط!` : `⚠️ Expires in ${daysLeft} days only!`)
                      : isWarning
                        ? (L ? `متبقي ${daysLeft} يوم على الانتهاء` : `${daysLeft} days left to expiry`)
                        : (L
                            ? `متبقي ${daysLeft} يوم · ينتهي ${expiresAt.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}`
                            : `${daysLeft} days left · expires ${expiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`)
                    }
                  </p>
                </div>
                <div className="text-center flex-shrink-0">
                  <p className={`text-3xl font-black ${isDanger ? "text-red-600" : isWarning ? "text-amber-600" : "text-black dark:text-white"}`}>{daysLeft}</p>
                  <p className={`text-[10px] ${isDanger ? "text-red-500" : isWarning ? "text-amber-500" : "text-black/30 dark:text-white/30"}`}>{L ? "يوم متبقي" : "days left"}</p>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Projects */}
          <div className="xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-black dark:text-white flex items-center gap-2">
                <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center"><Layers className="w-3.5 h-3.5 text-white" /></div>
                {L ? "مشاريعي الجارية" : "My Active Projects"}
              </h2>
              {(projects?.length || 0) > 0 && (
                <Link href="/project/status">
                  <button className="text-[10px] text-black/30 dark:text-white/30 hover:text-black/60 dark:text-white/60 flex items-center gap-1" data-testid="link-all-projects">
                    {L ? "عرض الكل" : "View all"} <ArrowUpRight className="w-3 h-3" />
                  </button>
                </Link>
              )}
            </div>

            {isLoadingProjects ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-5">
                    <div className="flex items-center gap-4 mb-4">
                      <Skeleton className="w-11 h-11 rounded-2xl flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/5 rounded-lg" />
                        <Skeleton className="h-3 w-1/3 rounded-lg" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full mb-2" />
                    <div className="flex gap-2 mt-3">
                      <Skeleton className="h-8 w-24 rounded-xl" />
                      <Skeleton className="h-8 w-24 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !projects || projects.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-black/[0.06] dark:border-white/[0.08] p-16 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-3xl bg-black/[0.03] dark:bg-white/[0.05] flex items-center justify-center mb-5">
                  <Layers className="w-10 h-10 text-black/10 dark:text-white/10" />
                </div>
                <h3 className="font-bold text-black/50 dark:text-white/50 mb-2">{L ? "لا توجد مشاريع بعد" : "No projects yet"}</h3>
                <p className="text-xs text-black/30 dark:text-white/30 mb-6 max-w-xs">{L ? "ابدأ باختيار الخدمة المناسبة لمشروعك وسيبدأ الفريق بالتنفيذ فوراً" : "Start by choosing the right service for your project and the team will begin immediately"}</p>
                <div className="flex gap-3">
                  <Link href="/prices">
                    <Button size="sm" className="bg-black text-white hover:bg-black/80 rounded-xl h-9 px-5 text-xs gap-2">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      {L ? "اختر خدمة" : "Choose a Service"}
                    </Button>
                  </Link>
                  <Link href="/order">
                    <Button size="sm" variant="outline" className="rounded-xl h-9 px-4 text-xs border-black/[0.08] dark:border-white/[0.1]">
                      {L ? "طلب مباشر" : "Direct Order"}
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {projects.map((project: any, i: number) => {
                  const st = statusMap[project.status] || statusMap['pending'];
                  const pct = project.progress || 0;
                  const r = 28, cx = 36, cy = 36, circ = 2 * Math.PI * r;
                  const offset = circ * (1 - pct / 100);
                  const order = project.orderId as any;
                  const projectNumber = `#${String(project.id)?.slice(-6).toUpperCase()}`;
                  const projectTitle = order?.businessName || order?.serviceType || (L ? "مشروع رقمي" : "Digital Project");
                  const serviceLabel = L ? (({
                    restaurant: "مطعم وكافيه", store: "متجر إلكتروني", education: "منصة تعليمية",
                    health: "صحة ولياقة", realestate: "عقارات", website: "موقع ويب",
                    app: "تطبيق جوال", corporate: "شركة ومؤسسة", other: "خدمة عامة"
                  } as Record<string,string>)[order?.sector || order?.serviceType || ""] || order?.serviceType || "مشروع رقمي")
                  : (({
                    restaurant: "Restaurant & Cafe", store: "E-commerce Store", education: "Education Platform",
                    health: "Health & Fitness", realestate: "Real Estate", website: "Website",
                    app: "Mobile App", corporate: "Corporate System", other: "General Service"
                  } as Record<string,string>)[order?.sector || order?.serviceType || ""] || order?.serviceType || "Digital Project");
                  const planTier = order?.planTier;
                  const planLabel = planTier === "lite" ? "لايت" : planTier === "pro" ? "برو" : planTier === "infinite" ? "إنفينتي" : null;
                  const daysLeft = project.deadline ? Math.ceil((new Date(project.deadline).getTime() - Date.now()) / 86400000) : null;
                  const manager = project.managerId as any;
                  const PHASE_STEPS = L ? [
                    { key: "new", label: "استقبال" },
                    { key: "under_study", label: "دراسة" },
                    { key: "in_progress", label: "تنفيذ" },
                    { key: "testing", label: "اختبار" },
                    { key: "delivery", label: "تسليم" },
                  ] : [
                    { key: "new", label: "Received" },
                    { key: "under_study", label: "Review" },
                    { key: "in_progress", label: "Building" },
                    { key: "testing", label: "Testing" },
                    { key: "delivery", label: "Delivery" },
                  ];
                  const phaseIdx = PHASE_STEPS.findIndex(p => p.key === project.status);
                  const currentPhaseIdx = phaseIdx >= 0 ? phaseIdx : (project.status === "closed" ? 5 : 0);
                  return (
                    <motion.div key={project.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-black/[0.06] dark:border-white/[0.07] overflow-hidden hover:shadow-xl hover:shadow-black/[0.05] transition-all duration-300 group" data-testid={`project-card-${project.id}`}>
                        {/* Header gradient */}
                        <div className="relative bg-gradient-to-br from-black via-gray-900 to-gray-800 p-5 overflow-hidden">
                          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
                          <div className="relative flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${st.bg} ${st.color}`}>{st.label}</span>
                                {planLabel && <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-white/10 text-white/70">{planLabel}</span>}
                                <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-white/5 text-white/40 border border-white/10">{serviceLabel}</span>
                              </div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-mono text-[10px] font-bold text-white/50 tracking-widest bg-white/10 px-1.5 py-0.5 rounded-md shrink-0">{projectNumber}</span>
                              </div>
                              <h4 className="font-black text-white text-sm leading-tight mb-1 line-clamp-2">{projectTitle}</h4>
                              <p className="text-[10px] text-white/35">
                                {project.createdAt ? (L ? `بدأ ${new Date(project.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}` : `Started ${new Date(project.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`) : ""}
                                {project.startDate ? (L ? ` · بدء تنفيذ ${new Date(project.startDate).toLocaleDateString('ar-SA', { month: 'long', day: 'numeric' })}` : ` · Build started ${new Date(project.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`) : ""}
                              </p>
                              {manager?.fullName && <p className="text-[10px] text-white/30 mt-0.5">{L ? `مدير المشروع: ${manager.fullName}` : `Project Manager: ${manager.fullName}`}</p>}
                            </div>
                            {/* Circular progress ring */}
                            <div className="shrink-0 relative">
                              <svg width="72" height="72" viewBox="0 0 72 72">
                                <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                                <circle cx={cx} cy={cy} r={r} fill="none" stroke="white" strokeWidth="5"
                                  strokeDasharray={circ} strokeDashoffset={offset}
                                  strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
                                  style={{ transition: "stroke-dashoffset 1.5s ease" }} />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-white font-black text-lg leading-none">{pct}</span>
                                <span className="text-white/40 text-[8px]">%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-4">
                          {/* Phase stepper */}
                          <div className="overflow-x-auto pb-1 mb-4 mt-1 -mx-1 px-1">
                          <div className="relative flex items-center min-w-[260px]">
                            <div className="absolute top-3 right-3 left-3 h-[2px] bg-black/[0.05] dark:bg-white/[0.06]" />
                            <div className="absolute top-3 h-[2px] bg-black transition-all duration-700 right-3"
                              style={{ width: `${(currentPhaseIdx / (PHASE_STEPS.length - 1)) * (100 - 8)}%` }} />
                            <div className="flex justify-between w-full relative z-10">
                              {PHASE_STEPS.map((ph, pi) => {
                                const done = pi < currentPhaseIdx;
                                const active = pi === currentPhaseIdx;
                                return (
                                  <div key={pi} className="flex flex-col items-center gap-1">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all text-[9px] font-black ${
                                      done ? "bg-black border-black text-white" :
                                      active ? "bg-white border-black text-black shadow-md" :
                                      "bg-white dark:bg-gray-900 border-black/[0.1] dark:border-white/[0.1] text-black/20 dark:text-white/20"
                                    }`}>
                                      {done ? "✓" : pi + 1}
                                    </div>
                                    <span className={`text-[9px] font-medium ${active ? "text-black dark:text-white" : "text-black/25 dark:text-white/25"}`}>{ph.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          </div>

                          {/* Stats row */}
                          <div className="flex items-center gap-2 gap-y-2 flex-wrap mb-4">
                            {daysLeft !== null && (
                              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold ${
                                daysLeft < 0 ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" :
                                daysLeft < 7 ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" :
                                "bg-black/[0.03] dark:bg-white/[0.04] text-black/50 dark:text-white/50"
                              }`}>
                                <Calendar className="w-3 h-3" />
                                {daysLeft < 0 ? (L ? `تأخر ${Math.abs(daysLeft)} يوم` : `${Math.abs(daysLeft)} days late`) : daysLeft === 0 ? (L ? "اليوم هو الموعد" : "Due today") : (L ? `${daysLeft} يوم متبقي` : `${daysLeft} days left`)}
                              </div>
                            )}
                            {project.repoUrl && (
                              <a href={project.repoUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-[11px] text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors">
                                <ExternalLink className="w-3 h-3" /> {L ? "كود المشروع" : "Project Code"}
                              </a>
                            )}
                            {project.stagingUrl && (
                              <a href={project.stagingUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-[11px] text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors">
                                <Globe className="w-3 h-3" /> {L ? "معاينة" : "Preview"}
                              </a>
                            )}
                            {(project as any).productionUrl && (
                              <a href={(project as any).productionUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 dark:bg-green-950/30 text-[11px] text-green-700 dark:text-green-400 hover:opacity-80 transition-colors border border-green-200 dark:border-green-800">
                                <ExternalLink className="w-3 h-3" /> {L ? "الموقع الرسمي" : "Live Site"}
                              </a>
                            )}
                          </div>

                          {/* Usage Guide — shown when project has a guide attached */}
                          {(project as any).usageGuide?.description && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                              className="mt-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4"
                              data-testid={`usage-guide-${project.id}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-3.5 h-3.5 text-white" />
                                </div>
                                <p className="text-xs font-bold text-blue-800 dark:text-blue-300">
                                  {(project as any).usageGuide.title || (L ? "شرح استخدام النظام" : "System Usage Guide")}
                                </p>
                              </div>
                              <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-relaxed whitespace-pre-line">
                                {(project as any).usageGuide.description}
                              </p>
                              {((project as any).usageGuide.files || []).length > 0 && (
                                <div className="mt-3 space-y-1.5">
                                  <p className="text-[9px] font-bold text-blue-600/60 dark:text-blue-400/60 uppercase tracking-widest">{L ? "ملفات مرفقة" : "Attached Files"}</p>
                                  {((project as any).usageGuide.files as string[]).map((fileUrl, fi) => {
                                    const fileName = fileUrl.split('/').pop() || `ملف ${fi + 1}`;
                                    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileUrl);
                                    return (
                                      <a key={fi} href={fileUrl} target="_blank" rel="noopener noreferrer" data-testid={`guide-file-${project.id}-${fi}`}
                                        className="flex items-center gap-2 text-[11px] text-blue-700 dark:text-blue-400 hover:underline">
                                        <span className="text-sm">{isImage ? "🖼️" : "📎"}</span>
                                        <span className="truncate max-w-xs">{decodeURIComponent(fileName)}</span>
                                      </a>
                                    );
                                  })}
                                </div>
                              )}
                            </motion.div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-3 border-t border-black/[0.04] dark:border-white/[0.05]">
                            <Link href="/project/status">
                              <Button size="sm" className="h-8 px-4 text-[11px] rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-black/80 gap-1.5 font-bold" data-testid={`button-view-project-${project.id}`}>
                                <Eye className="w-3 h-3" /> {L ? "عرض المشروع" : "View Project"}
                              </Button>
                            </Link>
                            <Link href="/project/chat">
                              <Button size="sm" variant="outline" className="h-8 px-3 text-[11px] rounded-xl border-black/[0.08] dark:border-white/[0.1] gap-1.5" data-testid={`button-project-chat-${project.id}`}>
                                <MessageSquare className="w-3 h-3" /> {L ? "تواصل" : "Chat"}
                              </Button>
                            </Link>
                            <Link href={`/project/${project.id}/workspace`}>
                              <Button size="sm" variant="outline" className="h-8 px-3 text-[11px] rounded-xl border-violet-200 dark:border-violet-800/40 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 gap-1.5" data-testid={`button-project-workspace-${project.id}`}>
                                <LayoutGrid className="w-3 h-3" /> {L ? "المميزات" : "Features"}
                              </Button>
                            </Link>
                            <div className="flex-1" />
                            <Button
                              size="sm" variant="ghost"
                              onClick={() => openSubSvcDialog(project.id, projectTitle)}
                              className="h-8 px-3 text-[11px] rounded-xl text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/[0.04] gap-1"
                              data-testid={`button-sub-service-${project.id}`}
                            >
                              <Sparkles className="w-3 h-3" /> {L ? "خدمة فرعية" : "Sub-service"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: ShoppingBag, label: L ? "اختر باقة" : "Choose a Plan", desc: L ? "تصفح الباقات والأنظمة" : "Browse plans and systems", href: "/prices", color: "from-violet-500 to-indigo-600" },
                { icon: Package, label: L ? "الأجهزة" : "Devices", desc: L ? "منتجات وبنية تحتية" : "Products and infrastructure", href: "/devices", color: "from-blue-500 to-blue-600" },
                { icon: Wrench, label: L ? "طلب تعديل" : "Request Edit", desc: L ? "تعديل على مشروع حالي" : "Edit an existing project", action: () => setModDialogOpen(true), color: "from-amber-500 to-orange-500" },
                { icon: Headphones, label: L ? "خدمة العملاء" : "Customer Service", desc: L ? "تواصل مع فريق الدعم" : "Contact our support team", href: "/cs-chat", color: "from-emerald-500 to-teal-600" },
              ].map((action, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.05 }}>
                  {action.href ? (
                    <Link href={action.href}>
                      <div className="bg-white dark:bg-gray-900 rounded-xl border border-black/[0.06] dark:border-white/[0.08] p-4 hover:shadow-md transition-all cursor-pointer group">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 shadow-md`}>
                          <action.icon className="w-4.5 h-4.5 text-white" />
                        </div>
                        <p className="font-bold text-xs text-black dark:text-white">{action.label}</p>
                        <p className="text-[10px] text-black/35 dark:text-white/35 mt-0.5">{action.desc}</p>
                      </div>
                    </Link>
                  ) : (
                    <div onClick={action.action} className="bg-white dark:bg-gray-900 rounded-xl border border-black/[0.06] dark:border-white/[0.08] p-4 hover:shadow-md transition-all cursor-pointer group" data-testid="button-new-modification-request">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 shadow-md`}>
                        <action.icon className="w-4.5 h-4.5 text-white" />
                      </div>
                      <p className="font-bold text-xs text-black dark:text-white">{action.label}</p>
                      <p className="text-[10px] text-black/35 dark:text-white/35 mt-0.5">{action.desc}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* ─── Linked API Projects ─── */}
            {user?.role === 'client' && linkedApiKeys.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-black dark:text-white flex items-center gap-2">
                    <div className="w-6 h-6 bg-violet-600 rounded-lg flex items-center justify-center">
                      <KeyRound className="w-3.5 h-3.5 text-white" />
                    </div>
                    {L ? "مشاريع مربوطة بالـ API" : "API-Linked Projects"}
                  </h2>
                  <Link href="/api-keys">
                    <button className="text-[10px] text-black/30 dark:text-white/30 hover:text-black/60 dark:text-white/60 flex items-center gap-1" data-testid="link-manage-api-keys">
                      {L ? "إدارة المفاتيح" : "Manage Keys"} <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {linkedApiKeys.map((apiKey: any, i: number) => (
                    <motion.div key={apiKey.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 + i * 0.05 }}
                      data-testid={`card-linked-project-${apiKey.id}`}
                      onClick={() => setLinkedProjectKeyId(apiKey.id)}
                      className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.07] rounded-2xl p-4 cursor-pointer hover:shadow-md hover:border-violet-200 dark:hover:border-violet-800/50 transition-all group">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${apiKey.isActive ? "bg-violet-100 dark:bg-violet-950/40" : "bg-black/[0.04] dark:bg-white/[0.04]"}`}>
                          <Server className={`w-4.5 h-4.5 ${apiKey.isActive ? "text-violet-600 dark:text-violet-400" : "text-black/20 dark:text-white/20"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-bold text-sm text-black dark:text-white truncate">{apiKey.projectName}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${apiKey.isActive ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800" : "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400"}`}>
                              {apiKey.isActive ? (L ? "نشط" : "Active") : (L ? "معطّل" : "Disabled")}
                            </span>
                          </div>
                          <p className="text-[10px] text-black/40 dark:text-white/40 mb-2">{apiKey.name}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {(apiKey.scopes || []).slice(0, 3).map((s: string) => (
                                <span key={s} className="text-[9px] bg-black/[0.04] dark:bg-white/[0.06] text-black/40 dark:text-white/40 px-1.5 py-0.5 rounded-full">{s}</span>
                              ))}
                              {(apiKey.scopes || []).length > 3 && <span className="text-[9px] text-black/30 dark:text-white/30">+{(apiKey.scopes || []).length - 3}</span>}
                            </div>
                            <span className="text-[10px] text-black/30 dark:text-white/30 flex items-center gap-1">
                              <Activity className="w-3 h-3" />{(apiKey.requestCount || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-black/20 dark:text-white/20 group-hover:text-violet-500 transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ─── Right column: Notifications + What's New + AI ─── */}
          <div className="xl:col-span-1 flex flex-col gap-4">
            {/* Notifications */}
            <NotificationsWidget />

            {/* What's New */}
            <WhatsNewWidget />

            {/* QIROX AI */}
            <div className="sticky top-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0ea5e9,#7c3aed)" }}>
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <h2 className="font-bold text-black dark:text-white text-sm">{L ? "مساعد QIROX الذكي" : "QIROX AI Assistant"}</h2>
              </div>
              <AIPanel className="h-[520px]" />
            </div>
          </div>

          {/* Bank Transfer Proof Upload Banner */}
          {(() => {
            const pendingProofOrders = (orders || []).filter((o: any) =>
              o.paymentMethod === "bank_transfer" && !o.paymentProofUrl &&
              o.status !== "cancelled" && o.status !== "rejected"
            );
            if (pendingProofOrders.length === 0) return null;
            return (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="col-span-full bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-700/30 rounded-2xl p-4 mb-2" dir="rtl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
                    <Upload className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-amber-800 dark:text-amber-300">{L ? "طلبات تنتظر سند التحويل" : "Orders Awaiting Transfer Proof"}</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-500">{L ? "يرجى رفع إيصال التحويل البنكي لإتمام طلبك" : "Please upload your bank transfer receipt"}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {pendingProofOrders.map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl px-3 py-2.5 border border-amber-100 dark:border-amber-800/30">
                      <div>
                        <p className="text-xs font-bold text-black dark:text-white">طلب #{String(o.id)?.slice(-6)}</p>
                        <p className="text-[10px] text-black/40 dark:text-white/40 flex items-center gap-1">{o.totalAmount ? <><span>{Number(o.totalAmount).toLocaleString()}</span> <SARIcon size={8} className="opacity-50" /></> : ''} <span>· تحويل بنكي</span></p>
                      </div>
                      <div className="flex items-center gap-2">
                        {uploadProofMutation.isPending && uploadingProofOrderId === String(o.id)
                          ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                          : (
                            <button
                              onClick={() => { setUploadingProofOrderId(String(o.id)); proofFileRef.current?.click(); }}
                              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                              data-testid={`button-upload-proof-${o.id}`}
                            >
                              <Upload className="w-3 h-3" />
                              {L ? "رفع السند" : "Upload Proof"}
                            </button>
                          )
                        }
                      </div>
                    </div>
                  ))}
                </div>
                <input
                  ref={proofFileRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file && uploadingProofOrderId) {
                      uploadProofMutation.mutate({ orderId: uploadingProofOrderId, file });
                    }
                    e.target.value = "";
                  }}
                />
              </motion.div>
            );
          })()}

          {/* Rejected Bank Transfer Alert Banner */}
          {(() => {
            const rejectedOrders = (orders || []).filter((o: any) =>
              o.paymentMethod === "bank_transfer" && o.paymentStatus === "rejected" &&
              o.status !== "cancelled" && o.status !== "rejected"
            );
            if (rejectedOrders.length === 0) return null;
            return (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="col-span-full bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-700/30 rounded-2xl p-4 mb-2" dir="rtl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center shrink-0">
                    <XCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-red-800 dark:text-red-300">{L ? "تم رفض إيصال التحويل" : "Transfer Proof Rejected"}</p>
                    <p className="text-[10px] text-red-600 dark:text-red-500">{L ? "يرجى رفع إيصال تحويل صحيح" : "Please upload a valid bank transfer receipt"}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {rejectedOrders.map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-xl px-3 py-2.5 border border-red-100 dark:border-red-800/30">
                      <div>
                        <p className="text-xs font-bold text-black dark:text-white">طلب #{String(o.id)?.slice(-6)}</p>
                        {o.paymentRejectionReason && (
                          <p className="text-[10px] text-red-500 mt-0.5">{o.paymentRejectionReason}</p>
                        )}
                        <p className="text-[10px] text-black/40 dark:text-white/40 flex items-center gap-1">{o.totalAmount ? <><span>{Number(o.totalAmount).toLocaleString()}</span> <SARIcon size={8} className="opacity-50" /></> : ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {uploadProofMutation.isPending && uploadingProofOrderId === String(o.id)
                          ? <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                          : (
                            <button
                              onClick={() => { setUploadingProofOrderId(String(o.id)); proofFileRef.current?.click(); }}
                              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                              data-testid={`button-reupload-proof-${o.id}`}
                            >
                              <Upload className="w-3 h-3" />
                              {L ? "إعادة رفع الإيصال" : "Re-upload Proof"}
                            </button>
                          )
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })()}

          {/* Project Timeline / Gantt */}
          {projects && projects.length > 0 && (
            <div className="mt-2">
              <h2 className="font-bold text-black dark:text-white flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-white" />
                </div>
                {L ? "خط زمني للمشاريع" : "Project Timeline"}
              </h2>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-5 overflow-x-auto">
                {(() => {
                  const PHASES = L
                    ? ["استقبال", "دراسة", "تنفيذ", "اختبار", "تسليم"]
                    : ["Received", "Review", "Building", "Testing", "Delivery"];
                  const PHASE_KEYS = ["new", "under_study", "in_progress", "testing", "delivery"];
                  const PHASE_COLORS = [
                    "bg-slate-200 dark:bg-slate-700",
                    "bg-blue-200 dark:bg-blue-900",
                    "bg-violet-200 dark:bg-violet-900",
                    "bg-amber-200 dark:bg-amber-900",
                    "bg-green-200 dark:bg-green-900",
                  ];
                  const PHASE_ACTIVE = [
                    "bg-slate-500",
                    "bg-blue-500",
                    "bg-violet-500",
                    "bg-amber-500",
                    "bg-green-500",
                  ];
                  return (
                    <div className="space-y-4 min-w-[400px]">
                      {/* Header row */}
                      <div className="flex items-center gap-3">
                        <div className="w-32 flex-shrink-0" />
                        <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${PHASES.length}, 1fr)` }}>
                          {PHASES.map((ph) => (
                            <div key={ph} className="text-[9px] font-bold text-black/30 dark:text-white/30 text-center truncate">{ph}</div>
                          ))}
                        </div>
                      </div>
                      {projects.slice(0, 5).map((project: any) => {
                        const order = project.orderId as any;
                        const title = order?.businessName || order?.serviceType || `#${String(project.id).slice(-4)}`;
                        const phaseIdx = PHASE_KEYS.findIndex(k => k === project.status);
                        const activeIdx = phaseIdx >= 0 ? phaseIdx : (project.status === "closed" ? 4 : 0);
                        return (
                          <div key={project.id} className="flex items-center gap-3" data-testid={`timeline-project-${project.id}`}>
                            <div className="w-32 flex-shrink-0">
                              <p className="text-xs font-semibold text-black/70 dark:text-white/70 truncate">{title}</p>
                              <p className="text-[9px] text-black/30 dark:text-white/30">{project.progress || 0}%</p>
                            </div>
                            <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${PHASES.length}, 1fr)` }}>
                              {PHASES.map((_, idx) => (
                                <div key={idx} className={`h-5 rounded-md transition-all ${idx <= activeIdx ? PHASE_ACTIVE[idx] : PHASE_COLORS[idx]}`} />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {/* Legend */}
                      <div className="flex items-center gap-3 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                        {PHASES.map((ph, idx) => (
                          <div key={ph} className="flex items-center gap-1">
                            <div className={`w-2.5 h-2.5 rounded-sm ${PHASE_ACTIVE[idx]}`} />
                            <span className="text-[9px] text-black/40 dark:text-white/40">{ph}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Orders + Mod Requests Column */}
          <div className="space-y-5">
            {/* Orders Timeline */}
            <div>
              <h2 className="font-bold text-black dark:text-white flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center"><FileText className="w-3.5 h-3.5 text-white" /></div>
                {L ? "سجل الطلبات" : "Orders History"}
              </h2>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
                {isLoadingOrders ? (
                  <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3.5 w-3/5 rounded" />
                          <Skeleton className="h-2.5 w-2/5 rounded" />
                        </div>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : !orders || orders.length === 0 ? (
                  <div className="p-10 text-center">
                    <FileText className="w-8 h-8 mx-auto text-black/10 dark:text-white/10 mb-3" />
                    <p className="text-xs text-black/25 dark:text-white/25">{L ? "لا توجد طلبات بعد" : "No orders yet"}</p>
                    <Link href="/order">
                      <Button size="sm" className="mt-4 bg-black text-white rounded-xl text-xs h-8 px-4">{L ? "أول طلب" : "First Order"}</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                    {orders.slice(0, 6).map((order: any, i: number) => {
                      const st = statusMap[order.status] || statusMap['pending'];
                      const StatusIcon = st.icon;
                      return (
                        <div key={order.id} className="px-4 py-3.5 hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors" data-testid={`order-item-${order.id}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${st.bg} border ${st.bg.replace('bg-', 'border-').replace('/50', '/30')} flex items-center justify-center flex-shrink-0`}>
                              <StatusIcon className={`w-3.5 h-3.5 ${st.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-black dark:text-white">{L ? "طلب" : "Order"} #{String(order.id)?.slice(-6) || order.id}</p>
                              <p className="text-[10px] text-black/30 dark:text-white/30 flex items-center gap-1">
                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString(L ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' }) : ''}
                                {order.totalAmount ? <> · {Number(order.totalAmount).toLocaleString()} {L ? <SARIcon size={8} className="opacity-50" /> : "SAR"}</> : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {order.paymentStatus === "rejected" && order.paymentMethod === "bank_transfer" && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/30 flex items-center gap-1">
                                  <XCircle className="w-2.5 h-2.5" />
                                  {L ? "رُفع الإيصال" : "Proof Rejected"}
                                </span>
                              )}
                              {order.paymentStatus === "approved" && order.paymentMethod === "bank_transfer" && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/30">
                                  {L ? "تحويل مقبول" : "Transfer OK"}
                                </span>
                              )}
                              <Badge className={`text-[9px] px-2 py-0.5 border ${st.bg} ${st.color}`}>{st.label}</Badge>
                              <button
                                onClick={() => setClientSpecsOrderId(String(order.id))}
                                className="text-[9px] px-2 py-1 rounded-lg border border-black/[0.08] dark:border-white/[0.1] text-black/40 dark:text-white/40 hover:border-black/20 dark:hover:border-white/20 hover:text-black dark:text-white transition-all"
                                data-testid={`button-view-specs-${order.id}`}
                              >
                                {L ? "المواصفات" : "Specs"}
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
                <h2 className="font-bold text-black dark:text-white flex items-center gap-2">
                  <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center"><Wrench className="w-3.5 h-3.5 text-white" /></div>
                  {L ? "طلبات التعديل" : "Modification Requests"}
                </h2>
                <Button size="sm" onClick={() => setModDialogOpen(true)} className="bg-black text-white rounded-xl h-7 px-3 text-[10px] gap-1" data-testid="button-new-modification-request">
                  <Plus className="w-3 h-3" /> {L ? "جديد" : "New"}
                </Button>
              </div>
              <div className="space-y-2">
                {isLoadingModRequests ? (
                  <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center border border-black/[0.06] dark:border-white/[0.08]"><Loader2 className="w-4 h-4 animate-spin mx-auto text-black/20 dark:text-white/20" /></div>
                ) : !modRequests || modRequests.length === 0 ? (
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-black/[0.08] dark:border-white/[0.1] p-8 text-center">
                    <Wrench className="w-8 h-8 mx-auto text-black/10 dark:text-white/10 mb-2" />
                    <p className="text-xs text-black/25 dark:text-white/25">{L ? "لا توجد طلبات تعديل" : "No modification requests"}</p>
                  </div>
                ) : modRequests.slice(0, 4).map((req) => {
                  const st = modStatusMap[req.status] || modStatusMap['pending'];
                  const pr = priorityMap[req.priority] || priorityMap['medium'];
                  return (
                    <div key={req.id} className="bg-white dark:bg-gray-900 rounded-xl border border-black/[0.06] dark:border-white/[0.08] p-4" data-testid={`modification-request-${req.id}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-black dark:text-white truncate flex-1" data-testid={`text-mod-title-${req.id}`}>{req.title}</p>
                        <div className="flex gap-1 flex-shrink-0">
                          <Badge className={`text-[9px] px-1.5 py-0.5 border ${st.bg} ${st.color}`} data-testid={`badge-mod-status-${req.id}`}>{st.label}</Badge>
                          <Badge className={`text-[9px] px-1.5 py-0.5 border ${pr.bg} ${pr.color}`} data-testid={`badge-mod-priority-${req.id}`}>{pr.label}</Badge>
                        </div>
                      </div>
                      <p className="text-[10px] text-black/35 dark:text-white/35 mt-1 line-clamp-1">{req.description}</p>
                      {req.adminNotes && (
                        <div className="mt-2 p-2 bg-black/[0.02] dark:bg-white/[0.04] rounded-lg border border-black/[0.04] dark:border-white/[0.06]">
                          <p className="text-[10px] text-black/40 dark:text-white/40">{L ? `ملاحظة الإدارة: ${req.adminNotes}` : `Admin note: ${req.adminNotes}`}</p>
                        </div>
                      )}
                      {['pending', 'in_review'].includes(req.status) && (
                        <div className="mt-2 flex justify-end">
                          <Button size="sm" variant="ghost" className="h-6 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50 px-2 gap-1" onClick={() => cancelModMutation.mutate(String(req.id))} disabled={cancelModMutation.isPending} data-testid={`button-cancel-mod-${req.id}`}>
                            <XCircle className="w-3 h-3" /> {L ? "إلغاء الطلب" : "Cancel Request"}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Packages / Offers Section ─── */}
        {pricingPlans && pricingPlans.filter(p => !p.isCustom).length > 0 && (() => {
          // Map user businessType → plan segment
          const BT_SEGMENT_MAP: Record<string, string> = {
            commercial: "ecommerce", restaurant: "restaurant", education: "education",
            medical: "healthcare", real_estate: "realestate", services: "corporate",
            technology: "corporate", other: "",
          };
          const SECTOR_LABELS: Record<string, { ar: string; en: string; icon: string }> = {
            restaurant: { ar: "مطاعم وكافيه", en: "Restaurants", icon: "🍽️" },
            ecommerce:  { ar: "متاجر إلكترونية", en: "E-commerce", icon: "🛒" },
            education:  { ar: "منصات تعليمية", en: "Education", icon: "🎓" },
            corporate:  { ar: "شركات ومؤسسات", en: "Corporate", icon: "🏢" },
            realestate: { ar: "عقارات", en: "Real Estate", icon: "🏗️" },
            healthcare: { ar: "صحة وطب", en: "Healthcare", icon: "🏥" },
            general:    { ar: "عام", en: "General", icon: "⚡" },
          };
          const userSegment = BT_SEGMENT_MAP[(user as any)?.businessType || ""] || "";
          const isSubscribed = (user as any).subscriptionStatus === "active";
          const regularPlans = pricingPlans.filter(p => !p.isCustom);
          // My sector's plans first, then others
          const myPlans = userSegment ? regularPlans.filter(p => p.segment === userSegment) : [];
          const otherPlans = userSegment ? regularPlans.filter(p => p.segment !== userSegment) : regularPlans;
          // All unique segments
          const allSegments = [...new Set(regularPlans.map(p => p.segment || "general"))].filter(Boolean);

          // Render a single plan card
          const PlanCard = ({ plan, i }: { plan: any; i: number }) => {
            const discount = plan.originalPrice && plan.price
              ? Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100) : 0;
            const billingLabel = L
              ? (plan.billingCycle === "monthly" ? "/شهر" : plan.billingCycle === "yearly" ? "/سنة" : "")
              : (plan.billingCycle === "monthly" ? "/mo" : plan.billingCycle === "yearly" ? "/yr" : "");
            return (
              <motion.div key={plan.id || plan.slug} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 + i * 0.05 }}>
                <div className={`bg-white dark:bg-gray-900 rounded-2xl border overflow-hidden hover:shadow-lg transition-all duration-300 ${plan.isPopular ? "border-black/20 dark:border-white/20 shadow-md" : "border-black/[0.06] dark:border-white/[0.08]"}`} data-testid={`dashboard-plan-${plan.slug}`}>
                  {plan.isPopular && <div className="bg-black px-4 py-1.5 flex items-center gap-2"><Check className="w-3 h-3 text-white" /><span className="text-white text-[10px] font-bold">{L ? "الأكثر طلباً" : "Most Popular"}</span></div>}
                  {plan.offerLabel && !plan.isPopular && <div className="bg-emerald-500 px-4 py-1.5 flex items-center gap-2"><Package className="w-3 h-3 text-white" /><span className="text-white text-[10px] font-bold">{plan.offerLabel}</span></div>}
                  <div className="p-5">
                    <h3 className="font-bold text-black dark:text-white text-sm mb-0.5">{L ? plan.nameAr : (plan.name || plan.nameAr)}</h3>
                    <p className="text-[10px] text-black/35 dark:text-white/35 leading-relaxed line-clamp-2 mb-3">{L ? plan.descriptionAr : (plan.description || plan.descriptionAr)}</p>
                    <div className="mb-4">
                      {plan.originalPrice && (<div className="flex items-center gap-2 mb-1"><span className="text-xs text-black/25 dark:text-white/25 line-through flex items-center gap-0.5">{plan.originalPrice.toLocaleString()} <SARIcon size={9} className="opacity-50" /></span>{discount > 0 && <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">-{discount}%</span>}</div>)}
                      <div className="flex items-baseline gap-1"><span className="text-2xl font-black text-black dark:text-white">{plan.price.toLocaleString()}</span><span className="text-xs text-black/35 dark:text-white/35 flex items-center gap-0.5"><SARIcon size={10} className="opacity-50" /> {billingLabel}</span></div>
                    </div>
                    <div className="space-y-1.5 mb-4">
                      {(L ? plan.featuresAr : (plan.features || plan.featuresAr))?.slice(0, 4).map((f: string, fi: number) => (
                        <div key={fi} className="flex items-center gap-2 text-[11px] text-black/50 dark:text-white/50"><div className="w-3.5 h-3.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center flex-shrink-0"><Check className="w-2 h-2 text-black/50 dark:text-white/50" /></div>{f}</div>
                      ))}
                      {(plan.featuresAr?.length || 0) > 4 && <p className="text-[10px] text-black/20 dark:text-white/20 mr-5">+{(plan.featuresAr?.length || 0) - 4} {L ? "مزايا أخرى" : "more features"}</p>}
                    </div>
                    <Link href="/order"><Button size="sm" className={`w-full h-9 rounded-xl text-xs font-semibold ${plan.isPopular ? "bg-black text-white hover:bg-black/80" : "bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-black dark:text-white border border-black/[0.08] dark:border-white/[0.1]"}`} data-testid={`button-select-plan-${plan.slug}`}>{L ? "اختر الباقة" : "Select Plan"}<ChevronLeft className="w-3.5 h-3.5 mr-1" /></Button></Link>
                  </div>
                </div>
              </motion.div>
            );
          };

          return (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mb-8">
              {/* ── Header ── */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-black dark:text-white flex items-center gap-2">
                  <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center"><CreditCard className="w-3.5 h-3.5 text-white" /></div>
                  {L ? "الباقات والعروض المتاحة" : "Available Plans & Offers"}
                </h2>
                <div className="flex items-center gap-2">
                  {!isSubscribed && (
                    <button onClick={() => setShowAllSectors(v => !v)} data-testid="btn-toggle-all-sectors"
                      className="text-[10px] text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 flex items-center gap-1 border border-black/[0.08] dark:border-white/[0.08] px-2.5 py-1 rounded-full transition-colors">
                      <Globe className="w-3 h-3" />
                      {showAllSectors ? (L ? "قطاعي فقط" : "My sector") : (L ? "كل القطاعات" : "All sectors")}
                    </button>
                  )}
                  <Link href="/prices">
                    <button className="text-[10px] text-black/30 dark:text-white/30 hover:text-black/60 dark:text-white/60 flex items-center gap-1" data-testid="link-all-plans">
                      {L ? "عرض الكل" : "View all"} <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </Link>
                </div>
              </div>

              {/* ── Subscribed State ── */}
              {isSubscribed ? (
                <div className="space-y-6">
                  {/* Subscription detail card */}
                  {(() => {
                    const expiresAt = new Date((user as any).subscriptionExpiresAt);
                    const startDate = (user as any).subscriptionStartDate ? new Date((user as any).subscriptionStartDate) : null;
                    const now = new Date();
                    const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 86400000));
                    const countdownStarted = startDate ? startDate <= now : false;
                    const totalDays = (user as any).subscriptionPeriod === "monthly" ? 30 : (user as any).subscriptionPeriod === "6months" ? 180 : 365;
                    const elapsed = totalDays - daysLeft;
                    const pct = Math.max(0, Math.min(100, Math.round((daysLeft / totalDays) * 100)));
                    const isDanger = daysLeft <= 7, isWarning = daysLeft <= 30;
                    return (
                      <div className={`rounded-2xl p-5 border ${isDanger ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/40" : isWarning ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40" : "bg-white dark:bg-gray-900 border-black/[0.06] dark:border-white/[0.08]"}`} data-testid="subscription-detail-card">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isDanger ? "bg-red-100 dark:bg-red-900/30" : isWarning ? "bg-amber-100 dark:bg-amber-900/30" : "bg-black"}`}>
                            <Crown className={`w-5 h-5 ${isDanger ? "text-red-600" : isWarning ? "text-amber-600" : "text-white"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <p className={`font-black text-base ${isDanger ? "text-red-700 dark:text-red-400" : isWarning ? "text-amber-700 dark:text-amber-400" : "text-black dark:text-white"}`}>
                                {L ? `اشتراكك في ${(user as any).subscriptionSegmentNameAr || "Qirox"}` : `Your ${(user as any).subscriptionSegmentNameEn || "QIROX"} Subscription`}
                              </p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDanger ? "bg-red-100 text-red-600" : isWarning ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>
                                {L ? "نشط" : "Active"}
                              </span>
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${countdownStarted ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400" : "bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"}`}>
                                {countdownStarted ? (L ? "⏱️ العد بدأ" : "⏱️ Countdown started") : (L ? "⏳ العد لم يبدأ بعد" : "⏳ Countdown not started")}
                              </span>
                            </div>
                            {/* Progress bar */}
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex-1 h-2.5 bg-black/[0.06] dark:bg-white/[0.08] rounded-full overflow-hidden">
                                <motion.div className={`h-full rounded-full ${isDanger ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-black dark:bg-white"}`}
                                  initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.4, ease: "easeOut" }} />
                              </div>
                              <span className={`text-xs font-black ${isDanger ? "text-red-600" : isWarning ? "text-amber-600" : "text-black dark:text-white"}`}>{pct}%</span>
                            </div>
                            {/* Days */}
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="text-center">
                                <p className={`text-3xl font-black leading-none ${isDanger ? "text-red-600" : isWarning ? "text-amber-600" : "text-black dark:text-white"}`}>{daysLeft}</p>
                                <p className="text-[10px] text-black/30 dark:text-white/30 mt-0.5">{L ? "يوم متبقي" : "days left"}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xl font-black leading-none text-black/40 dark:text-white/40">{elapsed}</p>
                                <p className="text-[10px] text-black/30 dark:text-white/30 mt-0.5">{L ? "يوم منقضي" : "days elapsed"}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-black/40 dark:text-white/40">
                                  {L ? "ينتهي" : "Expires"}: {expiresAt.toLocaleDateString(L ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                                </p>
                                {startDate && (
                                  <p className="text-[10px] text-black/30 dark:text-white/30 mt-0.5">
                                    {L ? "بدأ العد" : "Started"}: {startDate.toLocaleDateString(L ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" })}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* "Continue your journey" — explore other sectors */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-violet-500" />
                      <p className="font-bold text-sm text-black dark:text-white">{L ? "أكمل مسيرتك مع Qirox" : "Continue your journey with Qirox"}</p>
                    </div>
                    <p className="text-xs text-black/40 dark:text-white/40 mb-4">{L ? "اكتشف باقي القطاعات وابدأ مشروعاً جديداً في مجال آخر" : "Discover other sectors and start a new project in a different field"}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {allSegments.map(seg => {
                        const info = SECTOR_LABELS[seg] || { ar: seg, en: seg, icon: "📁" };
                        const count = regularPlans.filter(p => p.segment === seg).length;
                        return (
                          <Link key={seg} href={`/prices?sector=${seg}`}>
                            <div className={`rounded-xl border p-3 cursor-pointer hover:shadow-md transition-all group ${seg === userSegment ? "border-black/20 dark:border-white/20 bg-black/[0.03] dark:bg-white/[0.03]" : "border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-900"}`}
                              data-testid={`explore-sector-${seg}`}>
                              <span className="text-xl block mb-1">{info.icon}</span>
                              <p className="text-xs font-bold text-black dark:text-white leading-tight">{L ? info.ar : info.en}</p>
                              <p className="text-[9px] text-black/30 dark:text-white/30 mt-0.5">{count} {L ? "باقة" : "plans"}</p>
                              {seg === userSegment && <span className="text-[9px] text-black/50 dark:text-white/50 mt-1 block">{L ? "قطاعك ✓" : "Your sector ✓"}</span>}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Non-subscribed: smart plan cards ── */
                <div className="space-y-6">
                  {/* My sector plans */}
                  {myPlans.length > 0 && !showAllSectors && (
                    <div>
                      {userSegment && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-base">{SECTOR_LABELS[userSegment]?.icon || "📁"}</span>
                          <p className="text-xs font-bold text-black/60 dark:text-white/60">
                            {L ? `باقات ${SECTOR_LABELS[userSegment]?.ar || userSegment} — مناسبة لنشاطك` : `${SECTOR_LABELS[userSegment]?.en || userSegment} Plans — matching your business`}
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {myPlans.map((plan, i) => <PlanCard key={plan.id || plan.slug} plan={plan} i={i} />)}
                      </div>
                    </div>
                  )}

                  {/* All sectors mode or no matching sector */}
                  {(showAllSectors || myPlans.length === 0) && (
                    <div className="space-y-5">
                      {allSegments.map(seg => {
                        const segPlans = regularPlans.filter(p => p.segment === seg);
                        if (segPlans.length === 0) return null;
                        const info = SECTOR_LABELS[seg] || { ar: seg, en: seg, icon: "📁" };
                        return (
                          <div key={seg}>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-base">{info.icon}</span>
                              <p className="text-xs font-bold text-black/60 dark:text-white/60">{L ? info.ar : info.en}</p>
                              {seg === userSegment && <span className="text-[9px] bg-black text-white dark:bg-white dark:text-black px-1.5 py-0.5 rounded-full">{L ? "قطاعك" : "Your sector"}</span>}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                              {segPlans.map((plan, i) => <PlanCard key={plan.id || plan.slug} plan={plan} i={i} />)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Custom / enterprise */}
                  {(pricingPlans?.find(p => p.isCustom)) && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center flex-shrink-0"><Building2 className="w-5 h-5 text-white" /></div>
                        <div>
                          <h4 className="font-bold text-black dark:text-white text-sm">{L ? pricingPlans.find(p => p.isCustom)?.nameAr : (pricingPlans.find(p => p.isCustom)?.name || pricingPlans.find(p => p.isCustom)?.nameAr)}</h4>
                          <p className="text-[10px] text-black/35 dark:text-white/35">{L ? pricingPlans.find(p => p.isCustom)?.descriptionAr : (pricingPlans.find(p => p.isCustom)?.description || pricingPlans.find(p => p.isCustom)?.descriptionAr)}</p>
                        </div>
                      </div>
                      <Link href="/contact"><Button size="sm" className="bg-black text-white hover:bg-black/80 rounded-xl h-9 px-5 text-xs font-semibold whitespace-nowrap" data-testid="button-enterprise-contact"><Phone className="w-3.5 h-3.5 ml-1.5" />{L ? "تواصل للتخصيص" : "Contact for Customization"}</Button></Link>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })()}

        {/* CTA Band */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="bg-black rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-white">
              <h3 className="text-lg font-bold mb-1.5">{L ? "هل تحتاج مساعدة في مشروعك؟" : "Need help with your project?"}</h3>
              <p className="text-white/45 text-sm">{L ? "فريقنا جاهز لتحويل فكرتك إلى واقع رقمي متكامل" : "Our team is ready to turn your idea into a complete digital reality"}</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link href="/contact">
                <Button className="bg-white text-black hover:bg-white/90 font-bold h-10 px-6 text-xs rounded-xl" data-testid="button-contact-support">
                  {L ? "تواصل معنا" : "Contact Us"}
                </Button>
              </Link>
              <Link href="/prices">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 h-10 px-5 text-xs rounded-xl">
                  {L ? "الخدمات" : "Services"}
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modification Dialog */}
      <Dialog open={modDialogOpen} onOpenChange={setModDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl" dir={dir}>
          {/* Creative gradient header */}
          <div className="relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0e7490] px-6 pt-6 pb-8 overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-[-30px] right-[-30px] w-32 h-32 rounded-full bg-cyan-400 blur-2xl" />
              <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 rounded-full bg-blue-500 blur-2xl" />
            </div>
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-cyan-300" />
                  </div>
                  <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase">{L ? "طلب جديد" : "New Request"}</span>
                </div>
                <h2 className="text-lg font-black text-white leading-tight">{L ? "طلب تعديل" : "Modification Request"}</h2>
                <p className="text-xs text-white/50 mt-0.5">{L ? "أخبرنا بالتعديل المطلوب وسنتواصل معك" : "Tell us what needs to be changed"}</p>
              </div>
              {/* Circular quota badge in header */}
              {modQuota?.hasOrders && bestQuota && !isLifetimePlan && !bestQuota.hasUnlimitedAddon && (
                <div className="shrink-0 flex flex-col items-center">
                  <div className={`relative w-14 h-14 rounded-full border-[3px] flex items-center justify-center ${quotaExceeded ? "border-red-400/60 bg-red-500/10" : "border-cyan-400/50 bg-cyan-400/10"}`}>
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="3"
                        className={quotaExceeded ? "text-red-500/20" : "text-cyan-400/20"} />
                      <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="3"
                        strokeLinecap="round"
                        className={quotaExceeded ? "text-red-400" : "text-cyan-400"}
                        strokeDasharray={`${2 * Math.PI * 24}`}
                        strokeDashoffset={`${2 * Math.PI * 24 * (1 - (bestQuota.remainingThisPeriod / bestQuota.modificationsPerPeriod))}`}
                        style={{ transition: "stroke-dashoffset 0.6s ease" }} />
                    </svg>
                    <span className={`text-base font-black ${quotaExceeded ? "text-red-300" : "text-cyan-300"}`}>{bestQuota.remainingThisPeriod}</span>
                  </div>
                  <span className="text-[9px] text-white/40 mt-1 font-medium">{L ? "متبقي" : "left"}</span>
                </div>
              )}
              {isLifetimePlan && (
                <div className="shrink-0 w-14 h-14 rounded-full bg-violet-400/10 border-[3px] border-violet-400/50 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-violet-300" />
                </div>
              )}
              {bestQuota?.hasUnlimitedAddon && (
                <div className="shrink-0 w-14 h-14 rounded-full bg-emerald-400/10 border-[3px] border-emerald-400/50 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-emerald-300" />
                </div>
              )}
            </div>

            {/* Status strip inside header */}
            {modQuota && !modQuota.hasOrders && (
              <div className="relative mt-4 rounded-xl bg-red-500/20 border border-red-400/30 px-3 py-2 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-300 shrink-0" />
                <p className="text-[11px] font-bold text-red-200">{L ? "لا يوجد لديك طلب نشط لإرسال طلبات التعديل" : "You need an active order to submit modification requests"}</p>
              </div>
            )}
            {modQuota?.hasOrders && bestQuota?.hasUnlimitedAddon && (
              <div className="relative mt-4 rounded-xl bg-emerald-500/20 border border-emerald-400/30 px-3 py-2 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <p className="text-[11px] font-bold text-emerald-200">{L ? `تعديلات غير محدودة — الإضافة نشطة حتى ${new Date(bestQuota.periodEnd || "").toLocaleDateString("ar-SA")}` : `Unlimited modifications active until ${new Date(bestQuota.periodEnd || "").toLocaleDateString("en-US")}`}</p>
              </div>
            )}
            {isLifetimePlan && (
              <div className="relative mt-4 rounded-xl bg-violet-500/20 border border-violet-400/30 px-3 py-2 flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-violet-300 shrink-0" />
                <p className="text-[11px] font-bold text-violet-200">{L ? "باقة مدى الحياة — التعديل مدفوع حسب النوع المختار" : "Lifetime plan — modifications charged per type"}</p>
              </div>
            )}
            {modQuota?.hasOrders && bestQuota && !isLifetimePlan && !bestQuota.hasUnlimitedAddon && quotaExceeded && (
              <div className="relative mt-4 rounded-xl bg-red-500/20 border border-red-400/30 px-3 py-2 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-300 shrink-0" />
                <p className="text-[11px] font-bold text-red-200">{L ? "لقد استنفدت حصتك لهذه الفترة" : "You have exhausted your quota for this period"}</p>
              </div>
            )}
          </div>

          {/* Form body */}
          <div className="px-6 py-5 space-y-4 bg-white dark:bg-gray-950">
            {/* Lifetime modification type */}
            {isLifetimePlan && activeModTypePrices.length > 0 && (
              <div>
                <label className="text-[11px] font-bold text-black/50 dark:text-white/40 mb-2 block uppercase tracking-wider">{L ? "نوع التعديل والسعر" : "Modification Type & Price"}</label>
                <Select value={modTypeId} onValueChange={setModTypeId}>
                  <SelectTrigger className="h-10 rounded-xl border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04]" data-testid="select-mod-type">
                    <SelectValue placeholder={L ? "اختر نوع التعديل" : "Choose modification type"} />
                  </SelectTrigger>
                  <SelectContent>
                    {activeModTypePrices.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{L ? t.nameAr : (t.nameEn || t.nameAr)} — {t.price} {L ? "ريال" : "SAR"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="text-[11px] font-bold text-black/50 dark:text-white/40 mb-2 block uppercase tracking-wider">{L ? "عنوان التعديل" : "Title"}</label>
              <Input
                value={modTitle}
                onChange={(e) => setModTitle(e.target.value)}
                placeholder={L ? "مثال: تعديل صفحة الرئيسية..." : "e.g. Update homepage hero section..."}
                className="h-10 rounded-xl border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] text-sm placeholder:text-black/25 dark:placeholder:text-white/20"
                data-testid="input-mod-title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-[11px] font-bold text-black/50 dark:text-white/40 mb-2 block uppercase tracking-wider">{L ? "تفاصيل التعديل" : "Details"}</label>
              <Textarea
                value={modDescription}
                onChange={(e) => setModDescription(e.target.value)}
                placeholder={L ? "اشرح التعديل المطلوب بكل التفاصيل..." : "Describe the modification in detail..."}
                rows={3}
                className="rounded-xl border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] text-sm placeholder:text-black/25 dark:placeholder:text-white/20 resize-none"
                data-testid="input-mod-description"
              />
            </div>

            {/* Priority - visual chip buttons */}
            <div>
              <label className="text-[11px] font-bold text-black/50 dark:text-white/40 mb-2 block uppercase tracking-wider">{L ? "مستوى الأولوية" : "Priority"}</label>
              <div className="grid grid-cols-4 gap-2" data-testid="select-mod-priority">
                {[
                  { value: "low", labelAr: "منخفض", labelEn: "Low", color: "border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400", active: "bg-gray-100 border-gray-400 text-gray-800 dark:bg-gray-700 dark:border-gray-400 dark:text-white font-bold" },
                  { value: "medium", labelAr: "متوسط", labelEn: "Med", color: "border-blue-200 text-blue-600 dark:border-blue-700 dark:text-blue-400", active: "bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/50 dark:border-blue-400 dark:text-blue-200 font-bold" },
                  { value: "high", labelAr: "عالي", labelEn: "High", color: "border-amber-200 text-amber-600 dark:border-amber-700 dark:text-amber-400", active: "bg-amber-100 border-amber-500 text-amber-800 dark:bg-amber-900/50 dark:border-amber-400 dark:text-amber-200 font-bold" },
                  { value: "urgent", labelAr: "عاجل", labelEn: "Urgent", color: "border-red-200 text-red-500 dark:border-red-700 dark:text-red-400", active: "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/50 dark:border-red-400 dark:text-red-200 font-bold" },
                ].map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setModPriority(p.value)}
                    className={`py-2 px-1 rounded-xl border text-[11px] transition-all ${modPriority === p.value ? p.active : `${p.color} hover:opacity-80`}`}
                  >
                    {L ? p.labelAr : p.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Project selector */}
            {projects && projects.length > 0 && (
              <div>
                <label className="text-[11px] font-bold text-black/50 dark:text-white/40 mb-2 block uppercase tracking-wider">{L ? "المشروع المرتبط" : "Linked Project"}</label>
                <Select value={modProjectId} onValueChange={setModProjectId}>
                  <SelectTrigger className="h-10 rounded-xl border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04]" data-testid="select-mod-project">
                    <SelectValue placeholder={L ? "اختر مشروعاً (اختياري)" : "Choose a project (optional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{L ? "بدون ربط بمشروع" : "No linked project"}</SelectItem>
                    {projects.map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{L ? `مشروع #${p.id}` : `Project #${p.id}`}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Unlimited addon upsell */}
            {bestQuota?.canPurchaseAddon && !bestQuota?.hasUnlimitedAddon && !isLifetimePlan && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-gradient-to-l from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300">{L ? "تعديلات غير محدودة لهذا الشهر" : "Unlimited modifications this month"}</p>
                  <p className="text-[10px] text-amber-700/60 dark:text-amber-400/60 mt-0.5">{L ? "1,000 ريال — للباقات النصف سنوية والسنوية" : "1,000 SAR — semi-annual & annual plans"}</p>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-[11px] border-amber-400 text-amber-700 hover:bg-amber-100 shrink-0 gap-1 rounded-lg" onClick={() => setModDialogOpen(false)} data-testid="button-buy-unlimited-addon">
                  <Sparkles className="w-3 h-3" /> {L ? "اشتراك" : "Subscribe"}
                </Button>
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmitModRequest}
              disabled={createModRequestMutation.isPending || !modTitle.trim() || !modDescription.trim() || (quotaExceeded ?? false) || !!(modQuota && !modQuota.hasOrders)}
              className="w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-l from-[#0f172a] to-[#0e7490] hover:from-[#1e293b] hover:to-[#0891b2] text-white shadow-lg shadow-cyan-900/20"
              data-testid="button-submit-modification-request"
            >
              {createModRequestMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (modQuota && !modQuota.hasOrders) ? (
                <><AlertCircle className="w-4 h-4" />{L ? "لا يوجد طلب نشط" : "No active order"}</>
              ) : quotaExceeded ? (
                <><XCircle className="w-4 h-4" />{L ? "الحصة مستنفدة" : "Quota exhausted"}</>
              ) : (
                <><Sparkles className="w-4 h-4" />{L ? "إرسال طلب التعديل" : "Submit Modification Request"}</>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-Service Request Dialog */}
      <Dialog open={subSvcDialogOpen} onOpenChange={setSubSvcDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl" dir={dir}>
          <DialogHeader>
            <DialogTitle className="font-black text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> {L ? "طلب خدمة فرعية" : "Sub-Service Request"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {subSvcProjectLabel && (
              <div className="bg-black/[0.03] dark:bg-white/[0.05] rounded-xl px-4 py-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-black/40 dark:text-white/40" />
                <p className="text-sm text-black/60 dark:text-white/60 font-bold">{subSvcProjectLabel}</p>
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">{L ? "نوع الخدمة الفرعية المطلوبة *" : "Required Sub-Service Type *"}</label>
              <Select value={subSvcType} onValueChange={setSubSvcType}>
                <SelectTrigger className="rounded-xl h-10 text-sm border-black/[0.08] dark:border-white/[0.1]" data-testid="select-sub-service-type">
                  <SelectValue placeholder={L ? "اختر الخدمة" : "Choose service"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="تحسين محركات البحث (SEO)">{L ? "تحسين محركات البحث (SEO)" : "Search Engine Optimization (SEO)"}</SelectItem>
                  <SelectItem value="نشر على App Store & Play Store">{L ? "نشر على App Store & Play Store" : "Publish on App Store & Play Store"}</SelectItem>
                  <SelectItem value="تصوير احترافي للمنتجات">{L ? "تصوير احترافي للمنتجات" : "Professional Product Photography"}</SelectItem>
                  <SelectItem value="إضافة صفحات جديدة">{L ? "إضافة صفحات جديدة" : "Add New Pages"}</SelectItem>
                  <SelectItem value="تكامل مع منصة دفع">{L ? "تكامل مع منصة دفع" : "Payment Platform Integration"}</SelectItem>
                  <SelectItem value="حملة إعلانية رقمية">{L ? "حملة إعلانية رقمية" : "Digital Advertising Campaign"}</SelectItem>
                  <SelectItem value="تطوير تطبيق موبايل">{L ? "تطوير تطبيق موبايل" : "Mobile App Development"}</SelectItem>
                  <SelectItem value="دعم فني مستمر">{L ? "دعم فني مستمر" : "Ongoing Technical Support"}</SelectItem>
                  <SelectItem value="صيانة وتحديثات دورية">{L ? "صيانة وتحديثات دورية" : "Maintenance & Periodic Updates"}</SelectItem>
                  <SelectItem value="أخرى">{L ? "أخرى (حدد في الملاحظات)" : "Other (specify in notes)"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-black/60 dark:text-white/60 mb-1 block">{L ? "ملاحظات إضافية (اختياري)" : "Additional Notes (Optional)"}</label>
              <Textarea
                value={subSvcNotes}
                onChange={e => setSubSvcNotes(e.target.value)}
                placeholder={L ? "أضف أي تفاصيل تساعدنا على فهم طلبك بشكل أفضل..." : "Add any details that help us understand your request better..."}
                className="rounded-xl text-sm border-black/[0.08] dark:border-white/[0.1] resize-none"
                rows={3}
                data-testid="textarea-sub-service-notes"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSubmitSubSvc}
                disabled={createSubSvcMutation.isPending || !subSvcType}
                className="flex-1 bg-black text-white hover:bg-black/80 rounded-xl h-10 text-sm font-bold gap-2"
                data-testid="button-submit-sub-service"
              >
                {createSubSvcMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {L ? "إرسال الطلب" : "Submit Request"}
              </Button>
              <Button onClick={() => setSubSvcDialogOpen(false)} variant="outline" className="rounded-xl h-10 px-4 border-black/[0.08] dark:border-white/[0.1]">{L ? "إلغاء" : "Cancel"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Client Project File Sheet */}
      <Sheet open={!!clientSpecsOrderId} onOpenChange={(open) => !open && setClientSpecsOrderId(null)}>
        <SheetContent side="left" className="w-full sm:max-w-2xl p-0 overflow-hidden" dir={dir}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-5 border-b border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-gray-900 flex-shrink-0">
              <SheetTitle className="font-heading text-base font-bold text-black dark:text-white flex items-center gap-2">
                <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
                  <Server className="w-3.5 h-3.5 text-white" />
                </div>
                {L ? `ملف المشروع — طلب #${clientSpecsOrderId?.slice(-6)}` : `Project File — Order #${clientSpecsOrderId?.slice(-6)}`}
              </SheetTitle>
              <p className="text-[10px] text-black/35 dark:text-white/35 mt-1">{L ? "بيانات وتفاصيل مشروعك المُعدّة من الفريق" : "Your project data and details prepared by the team"}</p>
            </div>

            <ScrollArea className="flex-1">
              {isLoadingClientSpecs ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-black/20 dark:text-white/20" />
                  <p className="text-xs text-black/30 dark:text-white/30 mr-2">{L ? "جاري التحميل..." : "Loading..."}</p>
                </div>
              ) : !clientOrderSpecs || Object.keys(clientOrderSpecs).filter(k => !['_id','orderId','__v','id','createdAt','updatedAt','deploymentPassword','teamNotes'].includes(k) && clientOrderSpecs[k]).length === 0 ? (
                <div className="py-20 text-center px-6">
                  <div className="w-16 h-16 bg-black/[0.03] dark:bg-white/[0.05] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Server className="w-7 h-7 text-black/10 dark:text-white/10" />
                  </div>
                  <p className="text-sm font-bold text-black/30 dark:text-white/30">{L ? "ملف المشروع لم يُعَدّ بعد" : "Project file not ready yet"}</p>
                  <p className="text-xs text-black/20 dark:text-white/20 mt-2">{L ? "يعمل فريقنا على تجهيز كافة تفاصيل مشروعك" : "Our team is preparing all your project details"}</p>
                </div>
              ) : (
                <div className="px-6 py-5 space-y-5">
                  {/* Project Info Card (black) */}
                  {(clientOrderSpecs.projectName || clientOrderSpecs.totalBudget || clientOrderSpecs.paidAmount || clientOrderSpecs.deadline) && (
                    <div className="bg-black rounded-2xl p-5">
                      <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-4">معلومات المشروع</p>
                      {clientOrderSpecs.projectName && (
                        <p className="text-lg font-black text-white mb-3">{clientOrderSpecs.projectName}</p>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        {clientOrderSpecs.projectStatus && (
                          <div className="bg-white/10 rounded-xl p-3">
                            <p className="text-[9px] text-white/40 mb-1">حالة المشروع</p>
                            <p className="text-xs font-bold text-white">
                              {clientOrderSpecs.projectStatus === 'planning' ? 'تخطيط' : clientOrderSpecs.projectStatus === 'in_dev' ? 'قيد التطوير' : clientOrderSpecs.projectStatus === 'testing' ? 'اختبار' : clientOrderSpecs.projectStatus === 'delivery' ? 'تسليم' : 'مغلق'}
                            </p>
                          </div>
                        )}
                        {clientOrderSpecs.estimatedHours && (
                          <div className="bg-white/10 rounded-xl p-3">
                            <p className="text-[9px] text-white/40 mb-1">الساعات المقدّرة</p>
                            <p className="text-xs font-bold text-white">{clientOrderSpecs.estimatedHours} ساعة</p>
                          </div>
                        )}
                        {clientOrderSpecs.totalBudget && (
                          <div className="bg-white/10 rounded-xl p-3">
                            <p className="text-[9px] text-white/40 mb-1">الميزانية الكلية</p>
                            <p className="text-xs font-bold text-white flex items-center gap-1">{Number(clientOrderSpecs.totalBudget).toLocaleString()} <SARIcon size={10} className="opacity-60" /></p>
                          </div>
                        )}
                        {clientOrderSpecs.paidAmount && (
                          <div className="bg-white/10 rounded-xl p-3">
                            <p className="text-[9px] text-white/40 mb-1">المدفوع حالياً</p>
                            <p className="text-xs font-bold text-green-400 flex items-center gap-1">{Number(clientOrderSpecs.paidAmount).toLocaleString()} <SARIcon size={10} className="opacity-70" /></p>
                          </div>
                        )}
                        {clientOrderSpecs.startDate && (
                          <div className="bg-white/10 rounded-xl p-3">
                            <p className="text-[9px] text-white/40 mb-1">تاريخ البداية</p>
                            <p className="text-xs font-bold text-white">{new Date(clientOrderSpecs.startDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          </div>
                        )}
                        {clientOrderSpecs.deadline && (
                          <div className="bg-white/10 rounded-xl p-3">
                            <p className="text-[9px] text-white/40 mb-1">تاريخ التسليم</p>
                            <p className="text-xs font-bold text-amber-400">{new Date(clientOrderSpecs.deadline).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tech Stack */}
                  {(clientOrderSpecs.techStack || clientOrderSpecs.framework || clientOrderSpecs.language || clientOrderSpecs.database || clientOrderSpecs.hosting) && (
                    <div className="border border-black/[0.07] dark:border-white/[0.08] rounded-2xl p-5 bg-white dark:bg-gray-900">
                      <p className="text-[9px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5" />البنية التقنية
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          clientOrderSpecs.techStack,
                          clientOrderSpecs.framework,
                          clientOrderSpecs.language,
                          clientOrderSpecs.database,
                          clientOrderSpecs.hosting,
                        ].filter(Boolean).map((tech: string, i: number) => (
                          <span key={i} className="text-[10px] bg-black text-white px-2.5 py-1 rounded-full font-medium">{tech}</span>
                        ))}
                        {clientOrderSpecs.sslEnabled && <span className="text-[10px] bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">SSL ✓</span>}
                        {clientOrderSpecs.cdnEnabled && <span className="text-[10px] bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">CDN ✓</span>}
                      </div>
                    </div>
                  )}

                  {/* URLs & Links */}
                  {(clientOrderSpecs.githubRepoUrl || clientOrderSpecs.stagingUrl || clientOrderSpecs.productionUrl || clientOrderSpecs.customDomain) && (
                    <div className="border border-black/[0.07] dark:border-white/[0.08] rounded-2xl p-5 bg-white dark:bg-gray-900">
                      <p className="text-[9px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5" />الروابط والنطاقات
                      </p>
                      <div className="space-y-2">
                        {[
                          { label: "GitHub Repository", url: clientOrderSpecs.githubRepoUrl, icon: "⌥" },
                          { label: "Staging (اختبار)", url: clientOrderSpecs.stagingUrl, icon: "🧪" },
                          { label: "Production (إنتاج)", url: clientOrderSpecs.productionUrl, icon: "🚀" },
                          { label: "الدومين المخصص", url: clientOrderSpecs.customDomain ? `https://${clientOrderSpecs.customDomain}` : null, icon: "🌐" },
                        ].filter(l => l.url).map((link, i) => (
                          <a key={i} href={link.url!} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 bg-black/[0.02] dark:bg-white/[0.04] rounded-xl hover:bg-black/[0.05] transition-colors group border border-black/[0.04] dark:border-white/[0.06]">
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">{link.icon}</span>
                              <div>
                                <p className="text-[10px] font-bold text-black/50 dark:text-white/50">{link.label}</p>
                                <p className="text-xs font-mono text-black/70 dark:text-white/70 truncate max-w-[280px]">{link.url}</p>
                              </div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-black/20 dark:text-white/20 group-hover:text-black/60 dark:group-hover:text-white/60 flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Project Concept */}
                  {(clientOrderSpecs.projectConcept || clientOrderSpecs.targetAudience || clientOrderSpecs.mainFeatures) && (
                    <div className="border border-black/[0.07] dark:border-white/[0.08] rounded-2xl p-5 bg-white dark:bg-gray-900">
                      <p className="text-[9px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <LayoutGrid className="w-3.5 h-3.5" />تفاصيل المشروع
                      </p>
                      {clientOrderSpecs.projectConcept && (
                        <div className="mb-3">
                          <p className="text-[10px] font-bold text-black/40 dark:text-white/40 mb-1.5">فكرة المشروع</p>
                          <p className="text-xs text-black/75 dark:text-white/75 leading-relaxed">{clientOrderSpecs.projectConcept}</p>
                        </div>
                      )}
                      {clientOrderSpecs.targetAudience && (
                        <div className="mb-3">
                          <p className="text-[10px] font-bold text-black/40 dark:text-white/40 mb-1.5">الجمهور المستهدف</p>
                          <p className="text-xs text-black/75 dark:text-white/75">{clientOrderSpecs.targetAudience}</p>
                        </div>
                      )}
                      {clientOrderSpecs.mainFeatures && (
                        <div>
                          <p className="text-[10px] font-bold text-black/40 dark:text-white/40 mb-1.5">الميزات الأساسية</p>
                          <pre className="text-xs text-black/75 dark:text-white/75 whitespace-pre-wrap leading-relaxed font-sans">{clientOrderSpecs.mainFeatures}</pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {clientOrderSpecs.notes && (
                    <div className="border border-black/[0.07] dark:border-white/[0.08] rounded-2xl p-5 bg-white dark:bg-gray-900">
                      <p className="text-[9px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-3">ملاحظات تقنية</p>
                      <p className="text-xs text-black/70 dark:text-white/70 leading-relaxed">{clientOrderSpecs.notes}</p>
                    </div>
                  )}

                  {/* Client Email */}
                  {clientOrderSpecs.clientEmail && (
                    <div className="border border-black/[0.07] dark:border-white/[0.08] rounded-2xl p-4 bg-white dark:bg-gray-900 flex items-center gap-3">
                      <Mail className="w-4 h-4 text-black/30 dark:text-white/30 flex-shrink-0" />
                      <div>
                        <p className="text-[9px] font-bold text-black/40 dark:text-white/40">بريد المشروع الرسمي</p>
                        <p className="text-xs font-mono text-black/70 dark:text-white/70 mt-0.5">{clientOrderSpecs.clientEmail}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Instant Meeting Result Dialog */}
      <Dialog open={!!instantMeetResult} onOpenChange={v => { if (!v) setInstantMeetResult(null); }}>
        <DialogContent className="max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 font-black">
              <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              {L ? "تم إنشاء الاجتماع السريع" : "Quick Meeting Created"}
            </DialogTitle>
          </DialogHeader>
          {instantMeetResult && (
            <div className="space-y-4 pt-2">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-2xl p-4">
                <p className="text-green-700 dark:text-green-300 text-sm font-semibold">{instantMeetResult.title}</p>
                <p className="text-green-600/70 dark:text-green-400/60 text-xs mt-1">{L ? "الاجتماع مباشر الآن" : "Meeting is live now"} · {instantMeetResult.durationMinutes} {L ? "دقيقة" : "min"}</p>
              </div>

              <div>
                <p className="text-xs text-black/50 dark:text-white/40 font-medium mb-1.5">{L ? "كود الانضمام" : "Join Code"}</p>
                <div className="flex items-center gap-2 bg-black/[0.04] dark:bg-white/[0.05] rounded-xl px-4 py-3">
                  <span className="font-mono font-black text-xl tracking-[0.3em] text-black dark:text-white flex-1">{instantMeetResult.joinCode}</span>
                  <button
                    onClick={() => copyInstantField(instantMeetResult.joinCode, "code")}
                    className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    data-testid="button-copy-dashboard-instant-code"
                  >
                    {instantCopied === "code" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-black/40 dark:text-white/40" />}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs text-black/50 dark:text-white/40 font-medium mb-1.5">{L ? "رابط الانضمام المباشر" : "Direct Join Link"}</p>
                <div className="flex items-center gap-2 bg-black/[0.04] dark:bg-white/[0.05] rounded-xl px-3 py-2.5">
                  <span className="text-xs text-black/60 dark:text-white/50 font-mono flex-1 truncate">
                    {`${window.location.origin}/meet/join?code=${instantMeetResult.joinCode}`}
                  </span>
                  <button
                    onClick={() => copyInstantField(`${window.location.origin}/meet/join?code=${instantMeetResult.joinCode}`, "link")}
                    className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0"
                    data-testid="button-copy-dashboard-instant-link"
                  >
                    {instantCopied === "link" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-black/40 dark:text-white/40" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  onClick={() => { setLocation(instantMeetResult.meetingLink); setInstantMeetResult(null); }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
                  data-testid="button-enter-dashboard-instant-meeting"
                >
                  <Video className="w-4 h-4" />
                  {L ? "ادخل الاجتماع" : "Enter Meeting"}
                </Button>
                <Button
                  onClick={() => setInstantMeetResult(null)}
                  variant="outline"
                  className="border-black/10 dark:border-white/10"
                  data-testid="button-close-dashboard-instant"
                >
                  {L ? "إغلاق" : "Close"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Linked API Project Detail Sheet ─── */}
      <Sheet open={!!linkedProjectKeyId} onOpenChange={v => { if (!v) setLinkedProjectKeyId(null); }}>
        <SheetContent side="left" className="w-full sm:max-w-xl p-0" dir="rtl">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
            <SheetTitle className="text-right font-black text-lg flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center">
                <Server className="w-4 h-4 text-white" />
              </div>
              {linkedProjectPreview?.key?.projectName || (L ? "تفاصيل المشروع" : "Project Details")}
            </SheetTitle>
            {linkedProjectPreview?.key && (
              <p className="text-xs text-black/40 dark:text-white/40 text-right mt-1">
                {linkedProjectPreview.key.name} · <code className="font-mono bg-black/[0.04] dark:bg-white/[0.05] px-1.5 py-0.5 rounded">{linkedProjectPreview.key.keyPrefix}</code>
              </p>
            )}
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-120px)]">
            <div className="px-6 py-5 space-y-5">
              {isLoadingLinkedPreview ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" />
                </div>
              ) : linkedProjectPreview ? (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: L ? "إجمالي الطلبات" : "Total Orders", value: linkedProjectPreview.stats?.totalOrders ?? 0, icon: Package, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
                      { label: L ? "مشاريع نشطة" : "Active Projects", value: linkedProjectPreview.stats?.activeProjects ?? 0, icon: Activity, color: "text-violet-600 bg-violet-50 dark:bg-violet-950/30" },
                      { label: L ? "إجمالي الفواتير" : "Total Invoices", value: linkedProjectPreview.stats?.totalInvoices ?? 0, icon: FileText, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
                      { label: L ? "الإيرادات المحصّلة" : "Revenue Collected", value: (linkedProjectPreview.stats?.totalRevenue ?? 0).toLocaleString(), unit: "SAR_ICON", icon: DollarSign, color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
                    ].map(({ label, value, icon: Icon, color, unit }: any) => (
                      <div key={label} className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.07] rounded-2xl p-4">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2.5 ${color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <p className="text-lg font-black text-black dark:text-white flex items-center gap-1">{value}{unit === "SAR_ICON" && <SARIcon size={12} className="opacity-50" />}</p>
                        <p className="text-[10px] text-black/40 dark:text-white/40 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recent Orders */}
                  {linkedProjectPreview.recentOrders?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-black/50 dark:text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Package className="w-3.5 h-3.5" /> {L ? "آخر الطلبات" : "Recent Orders"}
                      </h3>
                      <div className="space-y-2">
                        {linkedProjectPreview.recentOrders.map((order: any) => {
                          const st = statusMap[order.status] || statusMap['pending'];
                          return (
                            <div key={order.id} data-testid={`linked-order-${order.id}`}
                              className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.07] rounded-xl px-4 py-3 flex items-center gap-3">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${st.bg} border`}>
                                <st.icon className={`w-3.5 h-3.5 ${st.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-black dark:text-white truncate">
                                  {order.businessName || order.serviceType || `طلب #${String(order.id).slice(-6)}`}
                                </p>
                                <p className="text-[10px] text-black/40 dark:text-white/40 flex items-center gap-1">{st.label} · {order.totalAmount ? <><span>{Number(order.totalAmount).toLocaleString()}</span> <SARIcon size={8} className="opacity-50" /></> : ''}</p>
                              </div>
                              <span className="text-[10px] text-black/25 dark:text-white/25 flex-shrink-0">
                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-SA') : ''}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recent Projects */}
                  {linkedProjectPreview.recentProjects?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-black/50 dark:text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5" /> {L ? "آخر المشاريع" : "Recent Projects"}
                      </h3>
                      <div className="space-y-2">
                        {linkedProjectPreview.recentProjects.map((project: any) => {
                          const st = statusMap[project.status] || statusMap['pending'];
                          return (
                            <div key={project.id} data-testid={`linked-project-detail-${project.id}`}
                              className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.07] rounded-xl px-4 py-3">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${st.bg} border`}>
                                  <st.icon className={`w-3.5 h-3.5 ${st.color}`} />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-bold text-black dark:text-white">
                                    {L ? `مشروع #${String(project.id).slice(-6)}` : `Project #${String(project.id).slice(-6)}`}
                                  </p>
                                  <p className="text-[10px] text-black/40 dark:text-white/40">{st.label}</p>
                                </div>
                                {project.deliveredAt && (
                                  <span className="text-[9px] bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 px-2 py-0.5 rounded-full font-bold border border-green-200 dark:border-green-800">
                                    {L ? "مسلَّم" : "Delivered"}
                                  </span>
                                )}
                              </div>
                              {(project.stagingUrl || project.productionUrl) && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {project.stagingUrl && (
                                    <a href={project.stagingUrl} target="_blank" rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                                      data-testid={`link-staging-${project.id}`}>
                                      <Globe className="w-3 h-3" /> {L ? "رابط التجربة" : "Staging"}
                                    </a>
                                  )}
                                  {project.productionUrl && (
                                    <a href={project.productionUrl} target="_blank" rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 hover:underline"
                                      data-testid={`link-production-${project.id}`}>
                                      <ExternalLink className="w-3 h-3" /> {L ? "الرابط النهائي" : "Production"}
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recent Invoices */}
                  {linkedProjectPreview.recentInvoices?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-black/50 dark:text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" /> {L ? "آخر الفواتير" : "Recent Invoices"}
                      </h3>
                      <div className="space-y-2">
                        {linkedProjectPreview.recentInvoices.map((inv: any) => (
                          <div key={inv.id} data-testid={`linked-invoice-${inv.id}`}
                            className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.07] rounded-xl px-4 py-3 flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${inv.status === 'paid' ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' : 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'}`}>
                              <CreditCard className={`w-3.5 h-3.5 ${inv.status === 'paid' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-black dark:text-white truncate">
                                {inv.description || `فاتورة #${String(inv.id).slice(-6)}`}
                              </p>
                              <p className="text-[10px] text-black/40 dark:text-white/40">
                                {inv.status === 'paid' ? (L ? 'مدفوعة' : 'Paid') : (L ? 'معلّقة' : 'Pending')}
                                {inv.total ? <> · {Number(inv.total).toLocaleString()} <SARIcon size={8} className="opacity-50" /></> : ''}
                              </p>
                            </div>
                            <span className="text-[10px] text-black/25 dark:text-white/25 flex-shrink-0">
                              {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('ar-SA') : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scopes */}
                  <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05] rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-3">
                      {L ? "الصلاحيات الممنوحة" : "Granted Scopes"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(linkedProjectPreview.key?.scopes || []).map((s: string) => {
                        const scopeLabels: Record<string, string> = {
                          orders: "📦 الطلبات", projects: "🗂️ المشاريع", invoices: "🧾 الفواتير",
                          stats: "📊 الإحصائيات", wallet: "💳 المحفظة", customers: "👥 العملاء",
                        };
                        return (
                          <span key={s} className="text-xs bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 px-3 py-1 rounded-full font-medium">
                            {scopeLabels[s] || s}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="text-[10px] text-black/30 dark:text-white/30 flex flex-wrap gap-3">
                    {linkedProjectPreview.key?.lastUsedAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {L ? "آخر استخدام" : "Last used"}: {new Date(linkedProjectPreview.key.lastUsedAt).toLocaleDateString('ar-SA')}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {(linkedProjectPreview.key?.requestCount || 0).toLocaleString()} {L ? "طلب" : "requests"}
                    </span>
                    {linkedProjectPreview.key?.createdAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {L ? "أُنشئ" : "Created"}: {new Date(linkedProjectPreview.key.createdAt).toLocaleDateString('ar-SA')}
                      </span>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
