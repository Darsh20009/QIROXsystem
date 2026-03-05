// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import {
  Users, ShoppingBag, FileText, Receipt, Wallet, Banknote, CreditCard,
  Headphones, MessageSquare, LifeBuoy, Video, CalendarCheck,
  UserCog, DollarSign, BarChart3, Settings, Building2, Crown, Smartphone,
  Package, Layers, Truck, Tag, Wrench, TrendingUp, Activity,
  CheckCircle2, Clock, AlertTriangle, ArrowLeft, Zap, Server,
  Globe, Shield, Newspaper, Briefcase, ChevronRight, RefreshCw,
  Loader2, Store, ClipboardList, Bell
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────
type Overview = {
  totalClients: number; totalEmployees: number; totalRevenue: number;
  totalOrders: number; pendingOrders: number; inProgressOrders: number; completedOrders: number;
  totalInvoices: number; unpaidInvoices: number;
  totalReceipts: number; totalTransactions: number;
  totalSupportTickets: number; openSupportTickets: number;
  totalMessages: number; unreadMessages: number;
  totalInstallApps: number; pendingInstallApps: number; totalInstallOffers: number;
  totalInvestors: number;
  totalPayroll: number; thisMonthPayroll: number;
  totalModRequests: number; pendingModRequests: number;
  totalAttendanceToday: number;
  totalNews: number; publishedNews: number;
  totalJobs: number; activeJobs: number;
  totalDiscountCodes: number;
  totalShipments: number; pendingShipments: number;
  totalConsultations: number;
  pendingNotifications: number;
};

// ─── Module Card ──────────────────────────────────────────────
function ModCard({
  icon: Icon, label, count, sub, subCount, href, color, bg, urgent
}: {
  icon: any; label: string; count?: number; sub?: string; subCount?: number;
  href: string; color: string; bg: string; urgent?: boolean;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -2, scale: 1.01 }}
        className={`relative p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 bg-white dark:bg-[#161b22]
          ${urgent && subCount ? "border-amber-200 shadow-amber-50 shadow-md" : "border-black/[0.07] dark:border-white/[0.07] hover:border-black/20 dark:hover:border-white/20 hover:shadow-sm"}`}
        data-testid={`sysmap-${href.replace(/\//g, "-")}`}
      >
        <div className="flex items-start gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
            <Icon className={`w-4.5 h-4.5 ${color}`} style={{ width: 18, height: 18 }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-black dark:text-white leading-tight truncate">{label}</p>
            {count !== undefined && (
              <p className="text-[11px] text-black/40 dark:text-white/40 mt-0.5">{count.toLocaleString()}</p>
            )}
          </div>
          {urgent && subCount && subCount > 0 ? (
            <span className="text-[10px] font-black bg-amber-500 text-white rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shrink-0 mt-0.5">
              {subCount}
            </span>
          ) : subCount && subCount > 0 ? (
            <span className="text-[10px] font-bold bg-black/[0.07] dark:bg-white/[0.07] text-black/60 dark:text-white/60 rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shrink-0 mt-0.5">
              {subCount}
            </span>
          ) : null}
        </div>
        {sub && (
          <p className="text-[9px] text-black/30 dark:text-white/30 mt-1.5 pr-12 leading-relaxed">{sub}</p>
        )}
      </motion.div>
    </Link>
  );
}

// ─── Cluster ──────────────────────────────────────────────────
function Cluster({
  title, color, borderColor, children, icon: Icon, badge
}: {
  title: string; color: string; borderColor: string; children: React.ReactNode; icon?: any; badge?: number;
}) {
  return (
    <div className={`rounded-2xl border-2 ${borderColor} p-4 bg-white/60 dark:bg-white/[0.04] backdrop-blur-sm`}>
      <div className="flex items-center gap-2 mb-3">
        {Icon && <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-3.5 h-3.5 text-white" /></div>}
        <p className={`text-[11px] font-black uppercase tracking-widest ${color.includes("bg-") ? "text-black/60 dark:text-white/60" : color.replace("bg-", "text-")}`}>
          {title}
        </p>
        {badge !== undefined && badge > 0 && (
          <span className="mr-auto text-[9px] font-black bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
            {badge} بانتظار
          </span>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ─── Arrow connector ──────────────────────────────────────────
function FlowArrow({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-0.5">
      <div className="flex flex-col items-center gap-0.5">
        {label && <span className="text-[8px] text-black/25 dark:text-white/25 font-medium">{label}</span>}
        <div className="w-px h-4 bg-black/10" />
        <ChevronRight className="w-3 h-3 text-black/15 rotate-90 -mt-1" />
      </div>
    </div>
  );
}

// ─── Stat Box ─────────────────────────────────────────────────
function StatBox({ label, value, icon: Icon, color, sub }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#161b22] rounded-2xl border border-black/[0.07] dark:border-white/[0.07] px-5 py-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] text-black/35 dark:text-white/35 font-medium mb-0.5">{label}</p>
        <p className="text-xl font-black text-black dark:text-white leading-none">{value}</p>
        {sub && <p className="text-[9px] text-black/25 dark:text-white/25 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── Recent Order Row ─────────────────────────────────────────
const orderStatusMap: any = {
  pending: { label: "انتظار", color: "text-amber-700 bg-amber-50 border-amber-100" },
  approved: { label: "موافق", color: "text-blue-700 bg-blue-50 border-blue-100" },
  in_progress: { label: "تنفيذ", color: "text-indigo-700 bg-indigo-50 border-indigo-100" },
  completed: { label: "مكتمل", color: "text-green-700 bg-green-50 border-green-100" },
  rejected: { label: "مرفوض", color: "text-red-700 bg-red-50 border-red-100" },
  cancelled: { label: "ملغي", color: "text-gray-500 bg-gray-50 border-gray-100" },
};

const MANAGEMENT_ROLES = ["admin", "manager"];

// ─── Main Component ───────────────────────────────────────────
export default function AdminSystemMap() {
  const { data: user } = useUser();
  const { language: lang } = useI18n();
  const ar = lang === "ar";
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user && !MANAGEMENT_ROLES.includes(user.role)) {
      navigate("/employee/role-dashboard");
    }
  }, [user]);

  const { data: sysData, isLoading, refetch, isFetching } = useQuery<any>({
    queryKey: ["/api/admin/system-overview"],
    refetchInterval: 60_000,
  });

  const ov: Overview = sysData?.overview || {};
  const recentOrders: any[] = sysData?.recentOrders || [];
  const recentTickets: any[] = sysData?.recentTickets || [];

  const totalPending = (ov.pendingOrders || 0) + (ov.openSupportTickets || 0) + (ov.pendingModRequests || 0) + (ov.pendingInstallApps || 0) + (ov.pendingShipments || 0);

  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f7f7] dark:bg-[#0d1117]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-black/20" />
        <p className="text-xs text-black/30 dark:text-white/30 mt-3">جاري تحميل خريطة النظام...</p>
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-[#f7f7f7] dark:bg-[#0d1117]">

      {/* ═══════════════════════════════════════════════════════ */}
      {/* HEADER                                                  */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#161b22] border-b border-black/[0.07] dark:border-white/[0.07] px-6 py-4 sticky top-0 z-20 backdrop-blur-md bg-white/95 dark:bg-[#161b22]/95">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
              <Server className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-black dark:text-white">خريطة النظام</h1>
                <Badge className="bg-black text-white text-[9px] font-bold px-2 py-0.5 border-0">QIROX Studio</Badge>
              </div>
              <p className="text-[10px] text-black/35 dark:text-white/35">{dateStr}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalPending > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[11px] font-bold text-amber-700">{totalPending} يحتاج انتباه</span>
              </div>
            )}
            <button onClick={() => refetch()} disabled={isFetching}
              className="w-8 h-8 rounded-xl border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors"
              title="تحديث البيانات">
              <RefreshCw className={`w-3.5 h-3.5 text-black/40 dark:text-white/40 ${isFetching ? "animate-spin" : ""}`} />
            </button>
            <div className="text-[10px] text-black/25 dark:text-white/25">يتجدد كل دقيقة</div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-5 space-y-5">

        {/* ═══════════════════════════════════════════════════════ */}
        {/* LEVEL 1 — KEY METRICS                                   */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div>
          <p className="text-[9px] font-black text-black/25 dark:text-white/25 uppercase tracking-[0.2em] mb-3">المستوى الأول — الأرقام الرئيسية</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "إجمالي الإيرادات", value: `${((ov.totalRevenue || 0) / 1000).toFixed(0)}K ر.س`, icon: DollarSign, color: "text-emerald-600 bg-emerald-50", sub: "من الطلبات المكتملة" },
              { label: "إجمالي الطلبات", value: ov.totalOrders || 0, icon: ShoppingBag, color: "text-blue-600 bg-blue-50", sub: `${ov.pendingOrders || 0} بانتظار` },
              { label: "العملاء", value: ov.totalClients || 0, icon: Users, color: "text-violet-600 bg-violet-50", sub: "عميل مسجّل" },
              { label: "الموظفون", value: ov.totalEmployees || 0, icon: UserCog, color: "text-slate-600 bg-slate-50", sub: `${ov.totalAttendanceToday || 0} حضروا اليوم` },
              { label: "الفواتير غير المسددة", value: ov.unpaidInvoices || 0, icon: FileText, color: "text-amber-600 bg-amber-50", sub: "تحتاج متابعة" },
              { label: "الإشعارات المعلقة", value: ov.pendingNotifications || 0, icon: Bell, color: "text-red-600 bg-red-50", sub: "لم تُقرأ بعد" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-black/[0.07] dark:border-white/[0.07] px-4 py-4 hover:shadow-sm transition-all duration-200">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color.split(" ")[1]}`}>
                    <s.icon className={`w-4.5 h-4.5 ${s.color.split(" ")[0]}`} style={{ width: 18, height: 18 }} />
                  </div>
                  <p className="text-xl font-black text-black dark:text-white leading-none">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
                  <p className="text-[10px] font-bold text-black/50 dark:text-white/50 mt-1">{s.label}</p>
                  {s.sub && <p className="text-[9px] text-black/25 dark:text-white/25 mt-0.5">{s.sub}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* LEVEL 2 — SYSTEM MAP (6 clusters)                       */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div>
          <p className="text-[9px] font-black text-black/25 dark:text-white/25 uppercase tracking-[0.2em] mb-3">المستوى الثاني — خريطة وحدات النظام</p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

            {/* ── Cluster 1: دورة حياة العميل ────────────────── */}
            <Cluster title="دورة حياة العميل" color="bg-blue-500" borderColor="border-blue-100"
              icon={Users} badge={(ov.pendingOrders || 0) + (ov.pendingModRequests || 0)}>
              <ModCard icon={Users} label="العملاء" count={ov.totalClients} href="/admin/customers"
                color="text-violet-600" bg="bg-violet-50" />
              <FlowArrow label="يقدم طلباً" />
              <ModCard icon={ShoppingBag} label="الطلبات" count={ov.totalOrders} subCount={ov.pendingOrders}
                sub={`${ov.inProgressOrders || 0} قيد التنفيذ · ${ov.completedOrders || 0} مكتمل`}
                href="/admin/orders" color="text-blue-600" bg="bg-blue-50" urgent />
              <FlowArrow label="يولد" />
              <ModCard icon={Wrench} label="طلبات التعديل" count={ov.totalModRequests} subCount={ov.pendingModRequests}
                href="/admin/mod-requests" color="text-amber-600" bg="bg-amber-50" urgent />
              <FlowArrow label="يُفوتر" />
              <ModCard icon={FileText} label="الفواتير" count={ov.totalInvoices} subCount={ov.unpaidInvoices}
                sub="من إجمالي الفواتير" href="/admin/invoices" color="text-orange-600" bg="bg-orange-50" urgent />
              <FlowArrow label="يُسدَّد" />
              <ModCard icon={Receipt} label="سندات القبض" count={ov.totalReceipts}
                href="/admin/receipts" color="text-green-600" bg="bg-green-50" />
              <FlowArrow label="يُضاف" />
              <ModCard icon={Wallet} label="محافظ العملاء" count={ov.totalTransactions}
                sub="إجمالي حركات المحفظة" href="/admin/wallet" color="text-teal-600" bg="bg-teal-50" />
              <FlowArrow label="تقسيط" />
              <ModCard icon={Banknote} label="التقسيط" count={ov.totalInstallApps} subCount={ov.pendingInstallApps}
                sub={`${ov.totalInstallOffers || 0} عروض متاحة`}
                href="/admin/installments" color="text-cyan-600" bg="bg-cyan-50" urgent />
            </Cluster>

            {/* ── Cluster 2: الفريق والموارد البشرية ─────────── */}
            <Cluster title="الفريق والموارد البشرية" color="bg-slate-500" borderColor="border-slate-100"
              icon={UserCog}>
              <ModCard icon={UserCog} label="الموظفون" count={ov.totalEmployees}
                sub={`${ov.totalAttendanceToday || 0} حضروا اليوم`}
                href="/admin/employees" color="text-slate-600" bg="bg-slate-50" />
              <FlowArrow label="تسجيل حضور" />
              <ModCard icon={Activity} label="الحضور اليومي" count={ov.totalAttendanceToday}
                sub="حضروا اليوم" href="/admin/attendance" color="text-indigo-600" bg="bg-indigo-50" />
              <FlowArrow label="يتسلمون" />
              <ModCard icon={DollarSign} label="كشف الرواتب" count={ov.totalPayroll}
                sub={`${ov.thisMonthPayroll || 0} هذا الشهر`}
                href="/admin/payroll" color="text-emerald-600" bg="bg-emerald-50" />
              <FlowArrow label="ترقيات" />
              <ModCard icon={Shield} label="الترقيات والأدوار" href="/admin/promotions"
                color="text-purple-600" bg="bg-purple-50" />
              <div className="mt-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.05]">
                <p className="text-[9px] text-black/30 dark:text-white/30 font-bold uppercase tracking-wider mb-2">أيضاً</p>
                <div className="grid grid-cols-2 gap-2">
                  <ModCard icon={Briefcase} label="الوظائف" count={ov.activeJobs}
                    sub={`من ${ov.totalJobs || 0} وظيفة`}
                    href="/admin/jobs" color="text-red-600" bg="bg-red-50" />
                  <ModCard icon={TrendingUp} label="المستثمرون" count={ov.totalInvestors}
                    href="/admin/investors" color="text-pink-600" bg="bg-pink-50" />
                </div>
              </div>
            </Cluster>

            {/* ── Cluster 3: الخدمات والعمليات ───────────────── */}
            <Cluster title="الخدمات والعمليات" color="bg-orange-500" borderColor="border-orange-100"
              icon={Briefcase} badge={ov.pendingShipments}>
              <div className="grid grid-cols-2 gap-2">
                <ModCard icon={Briefcase} label="الخدمات" href="/admin/services"
                  color="text-orange-600" bg="bg-orange-50" />
                <ModCard icon={Layers} label="القوالب" href="/admin/templates"
                  color="text-amber-600" bg="bg-amber-50" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ModCard icon={Package} label="المنتجات" href="/admin/products"
                  color="text-blue-600" bg="bg-blue-50" />
                <ModCard icon={Truck} label="الشحنات" count={ov.totalShipments} subCount={ov.pendingShipments}
                  href="/admin/shipments" color="text-slate-600" bg="bg-slate-50" urgent />
              </div>
              <FlowArrow label="خصومات" />
              <ModCard icon={Tag} label="كودات الخصم" count={ov.totalDiscountCodes}
                href="/admin/discount-codes" color="text-pink-600" bg="bg-pink-50" />
              <FlowArrow label="استشارات" />
              <ModCard icon={CalendarCheck} label="الاستشارات" count={ov.totalConsultations}
                href="/admin/consultations" color="text-green-600" bg="bg-green-50" />
              <div className="mt-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.05]">
                <p className="text-[9px] text-black/30 dark:text-white/30 font-bold uppercase tracking-wider mb-2">نشر</p>
                <div className="grid grid-cols-2 gap-2">
                  <ModCard icon={Newspaper} label="الأخبار" count={ov.publishedNews}
                    sub={`من ${ov.totalNews || 0}`}
                    href="/admin/news" color="text-rose-600" bg="bg-rose-50" />
                  <ModCard icon={Smartphone} label="نشر التطبيق" href="/admin/app-publish"
                    color="text-blue-600" bg="bg-blue-50" />
                </div>
              </div>
            </Cluster>

            {/* ── Cluster 4: التواصل والدعم ───────────────────── */}
            <Cluster title="التواصل والدعم" color="bg-teal-500" borderColor="border-teal-100"
              icon={MessageSquare} badge={(ov.openSupportTickets || 0) + (ov.unreadMessages || 0)}>
              <ModCard icon={MessageSquare} label="صندوق الرسائل" count={ov.totalMessages} subCount={ov.unreadMessages}
                sub="رسالة غير مقروءة" href="/inbox" color="text-teal-600" bg="bg-teal-50" urgent />
              <FlowArrow />
              <ModCard icon={Headphones} label="خدمة العملاء" href="/cs-chat"
                color="text-cyan-600" bg="bg-cyan-50" />
              <FlowArrow />
              <ModCard icon={LifeBuoy} label="تذاكر الدعم" count={ov.totalSupportTickets} subCount={ov.openSupportTickets}
                sub="تذاكر مفتوحة" href="/admin/support-tickets" color="text-indigo-600" bg="bg-indigo-50" urgent />
              <FlowArrow />
              <ModCard icon={Video} label="QMeet — الاجتماعات" href="/admin/qmeet"
                color="text-purple-600" bg="bg-purple-50" />
              <div className="mt-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.05]">
                <p className="text-[9px] text-black/30 dark:text-white/30 font-bold uppercase tracking-wider mb-2">طلبات العملاء</p>
                <ModCard icon={ClipboardList} label="طلبات البيانات" href="/admin/data-requests"
                  color="text-slate-600" bg="bg-slate-50" />
              </div>
            </Cluster>

            {/* ── Cluster 5: المالية والتحليلات ───────────────── */}
            <Cluster title="المالية والتحليلات" color="bg-green-600" borderColor="border-green-100"
              icon={DollarSign}>
              <ModCard icon={BarChart3} label="التحليلات المتقدمة" href="/admin/analytics"
                color="text-indigo-600" bg="bg-indigo-50" />
              <FlowArrow />
              <div className="grid grid-cols-2 gap-2">
                <ModCard icon={DollarSign} label="لوحة المالية" href="/admin/finance"
                  color="text-green-600" bg="bg-green-50" />
                <ModCard icon={TrendingUp} label="التكاليف والأرباح" href="/admin/profit-report"
                  color="text-emerald-600" bg="bg-emerald-50" />
              </div>
              <FlowArrow />
              <div className="grid grid-cols-2 gap-2">
                <ModCard icon={FileText} label="الفواتير" count={ov.totalInvoices}
                  href="/admin/invoices" color="text-orange-600" bg="bg-orange-50" />
                <ModCard icon={Receipt} label="القبض" count={ov.totalReceipts}
                  href="/admin/receipts" color="text-green-600" bg="bg-green-50" />
              </div>
              <FlowArrow />
              <div className="grid grid-cols-2 gap-2">
                <ModCard icon={Wallet} label="المحافظ" count={ov.totalTransactions}
                  href="/admin/wallet" color="text-teal-600" bg="bg-teal-50" />
                <ModCard icon={Banknote} label="التقسيط" count={ov.totalInstallApps}
                  href="/admin/installments" color="text-cyan-600" bg="bg-cyan-50" />
              </div>
              <FlowArrow />
              <div className="grid grid-cols-2 gap-2">
                <ModCard icon={Crown} label="الاشتراكات" href="/admin/subscription-plans"
                  color="text-amber-600" bg="bg-amber-50" />
                <ModCard icon={Building2} label="البنك" href="/admin/bank-settings"
                  color="text-blue-600" bg="bg-blue-50" />
              </div>
              <FlowArrow />
              <ModCard icon={TrendingUp} label="المستثمرون" count={ov.totalInvestors}
                href="/admin/investors" color="text-pink-600" bg="bg-pink-50" />
            </Cluster>

            {/* ── Cluster 6: إعدادات النظام ───────────────────── */}
            <Cluster title="إعدادات النظام" color="bg-gray-500" borderColor="border-gray-100"
              icon={Settings}>
              <div className="grid grid-cols-2 gap-2">
                <ModCard icon={Settings} label="إعدادات QIROX" href="/admin/qirox-settings"
                  color="text-gray-600" bg="bg-gray-50" />
                <ModCard icon={Globe} label="مميزات الباقات" href="/admin/system-features"
                  color="text-blue-600" bg="bg-blue-50" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ModCard icon={Zap} label="الإضافات الخارجية" href="/admin/extra-addons"
                  color="text-amber-600" bg="bg-amber-50" />
                <ModCard icon={Wrench} label="حصص التعديل" href="/admin/mod-config"
                  color="text-orange-600" bg="bg-orange-50" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ModCard icon={Activity} label="ميزات المشاريع" href="/admin/project-features"
                  color="text-green-600" bg="bg-green-50" />
                <ModCard icon={BarChart3} label="سجل النشاط" href="/admin/activity-log"
                  color="text-violet-600" bg="bg-violet-50" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ModCard icon={RefreshCw} label="Cron Jobs" href="/admin/cron-jobs"
                  color="text-teal-600" bg="bg-teal-50" />
                <ModCard icon={Server} label="MongoDB Atlas" href="/admin/atlas"
                  color="text-green-700" bg="bg-green-50" />
              </div>
              <FlowArrow />
              <ModCard icon={Smartphone} label="نشر التطبيق" href="/admin/app-publish"
                color="text-blue-600" bg="bg-blue-50" sub="Android · iOS · Windows · HarmonyOS" />
              <div className="mt-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.05]">
                <div className="grid grid-cols-2 gap-2">
                  <ModCard icon={Users} label="الشركاء" href="/admin/partners"
                    color="text-indigo-600" bg="bg-indigo-50" />
                  <ModCard icon={Tag} label="الترويجات" href="/admin/promotions"
                    color="text-pink-600" bg="bg-pink-50" />
                </div>
              </div>
            </Cluster>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* LEVEL 3 — LIVE ACTIVITY                                 */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div>
          <p className="text-[9px] font-black text-black/25 dark:text-white/25 uppercase tracking-[0.2em] mb-3">المستوى الثالث — النشاط الفوري</p>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Recent Orders — 3 cols */}
            <div className="lg:col-span-3 bg-white dark:bg-[#161b22] rounded-2xl border border-black/[0.07] dark:border-white/[0.07] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.05] dark:border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-500" />
                  <p className="text-sm font-black text-black dark:text-white">آخر الطلبات</p>
                  <Badge variant="outline" className="text-[9px] font-bold">{ov.totalOrders}</Badge>
                </div>
                <Link href="/admin/orders">
                  <span className="text-[10px] text-black/35 dark:text-white/35 hover:text-black/60 dark:text-white/60 flex items-center gap-1 cursor-pointer transition-colors">
                    عرض الكل <ChevronRight className="w-3 h-3" />
                  </span>
                </Link>
              </div>
              <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                {recentOrders.length === 0 ? (
                  <div className="px-5 py-8 text-center text-xs text-black/25 dark:text-white/25">لا توجد طلبات بعد</div>
                ) : recentOrders.slice(0, 8).map((order: any) => {
                  const st = orderStatusMap[order.status] || orderStatusMap.pending;
                  return (
                    <Link key={order._id} href={`/admin/orders`}>
                      <div className="flex items-center gap-3 px-5 py-3 hover:bg-black/[0.01] dark:hover:bg-white/[0.03] transition-colors cursor-pointer" data-testid={`order-row-${order._id}`}>
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-black dark:text-white truncate">
                            {order.clientId?.fullName || order.clientName || "عميل"}
                          </p>
                          <p className="text-[10px] text-black/35 dark:text-white/35 truncate">{order.serviceName || "—"}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                          <span className="text-[10px] text-black/40 dark:text-white/40 font-mono">{(order.totalAmount || 0).toLocaleString()} ر.س</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right side — 2 cols: tickets + pending summary */}
            <div className="lg:col-span-2 space-y-4">
              {/* Pending Actions */}
              <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-black/[0.07] dark:border-white/[0.07] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <p className="text-sm font-black text-black dark:text-white">يحتاج انتباه</p>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "طلبات معلقة", count: ov.pendingOrders, href: "/admin/orders", icon: ShoppingBag, color: "text-blue-600" },
                    { label: "تذاكر مفتوحة", count: ov.openSupportTickets, href: "/admin/support-tickets", icon: LifeBuoy, color: "text-indigo-600" },
                    { label: "تعديلات معلقة", count: ov.pendingModRequests, href: "/admin/mod-requests", icon: Wrench, color: "text-amber-600" },
                    { label: "أقساط معلقة", count: ov.pendingInstallApps, href: "/admin/installments", icon: Banknote, color: "text-cyan-600" },
                    { label: "شحنات معلقة", count: ov.pendingShipments, href: "/admin/shipments", icon: Truck, color: "text-slate-600" },
                    { label: "فواتير غير مسددة", count: ov.unpaidInvoices, href: "/admin/invoices", icon: FileText, color: "text-orange-600" },
                  ].filter(i => (i.count || 0) > 0).map(item => (
                    <Link key={item.href} href={item.href}>
                      <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-amber-50/50 border border-amber-100/50 hover:bg-amber-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2">
                          <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                          <span className="text-[11px] font-bold text-black/70 dark:text-white/70">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-black text-amber-700">{item.count}</span>
                          <ChevronRight className="w-3 h-3 text-black/20" />
                        </div>
                      </div>
                    </Link>
                  ))}
                  {totalPending === 0 && (
                    <div className="flex items-center gap-2 py-3 justify-center">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <p className="text-xs text-green-600 font-bold">كل شيء على ما يرام!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Support Tickets */}
              <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-black/[0.07] dark:border-white/[0.07] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.05] dark:border-white/[0.05]">
                  <div className="flex items-center gap-2">
                    <LifeBuoy className="w-3.5 h-3.5 text-indigo-500" />
                    <p className="text-[12px] font-black text-black dark:text-white">آخر تذاكر الدعم</p>
                  </div>
                  <Link href="/admin/support-tickets">
                    <span className="text-[10px] text-black/35 dark:text-white/35 hover:text-black/60 dark:text-white/60 cursor-pointer">عرض الكل</span>
                  </Link>
                </div>
                <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {recentTickets.length === 0 ? (
                    <div className="px-4 py-6 text-center text-[11px] text-black/25 dark:text-white/25">لا توجد تذاكر</div>
                  ) : recentTickets.map((ticket: any) => (
                    <Link key={ticket._id} href="/admin/support-tickets">
                      <div className="flex items-start gap-2.5 px-4 py-3 hover:bg-black/[0.01] dark:hover:bg-white/[0.03] cursor-pointer transition-colors">
                        <div className="w-7 h-7 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <LifeBuoy className="w-3 h-3 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-black dark:text-white truncate">{ticket.subject}</p>
                          <p className="text-[9px] text-black/35 dark:text-white/35">{ticket.userId?.fullName || "مجهول"}</p>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${ticket.status === "open" ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-600 border border-green-100"}`}>
                          {ticket.status === "open" ? "مفتوح" : "مغلق"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Footer ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 pb-4">
          <p className="text-[9px] text-black/20">QIROX Studio System Map · v2.0</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <p className="text-[9px] text-black/25 dark:text-white/25">النظام يعمل بشكل طبيعي</p>
          </div>
        </div>
      </div>
    </div>
  );
}
