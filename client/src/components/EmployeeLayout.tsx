import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useLogout } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { UserAvatar } from "@/components/UserAvatar";
import EmployeeAIAssistant from "@/components/EmployeeAIAssistant";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, Users, Package, Wrench, Code2, Mail,
  User2, BookOpen, DollarSign, FileText, Receipt, Banknote,
  CalendarDays, Video, ShoppingCart, FileCheck, Settings,
  BarChart3, Megaphone, Globe, PlusCircle, Newspaper,
  ShoppingBag, LogOut, Menu, X, Star, Moon, Sun,
  ClipboardList, Building2, Headphones, Loader2, Sparkles,
  CloudUpload, Cpu, TrendingUp, MessageSquare, CheckSquare,
  LayoutGrid, Zap, Bell, ChevronRight, Coffee,
  Eye, Layers, Check, ShieldCheck,
} from "lucide-react";

interface NavItem {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: React.ElementType;
  href: string;
  group: "main" | "tools" | "finance" | "hr" | "personal" | "config";
}

const ALL_NAV: Record<string, NavItem> = {
  dashboard:       { id: "dashboard",       labelAr: "لوحتي",            labelEn: "My Dashboard",      icon: LayoutDashboard, href: "/employee/role-dashboard",  group: "main" },
  orders:          { id: "orders",          labelAr: "المشاريع",          labelEn: "Projects",           icon: Package,         href: "/admin/orders",             group: "main" },
  customers:       { id: "customers",       labelAr: "العملاء",           labelEn: "Clients",            icon: Users,           href: "/admin/customers",          group: "main" },
  new_order:       { id: "new_order",       labelAr: "عميل وطلب جديد",   labelEn: "New Order",          icon: PlusCircle,      href: "/employee/new-order",       group: "main" },
  subscriptions:   { id: "subscriptions",   labelAr: "الاشتراكات",        labelEn: "Subscriptions",      icon: Star,            href: "/employee/subscriptions",   group: "main" },
  abandoned_carts: { id: "abandoned_carts", labelAr: "عربات مهجورة",     labelEn: "Abandoned Carts",    icon: ShoppingCart,    href: "/employee/abandoned-carts", group: "main" },
  quotations:      { id: "quotations",      labelAr: "عروض الأسعار",      labelEn: "Quotations",         icon: FileCheck,       href: "/admin/quotations",         group: "main" },
  mod_requests:    { id: "mod_requests",    labelAr: "طلبات التعديل",    labelEn: "Mod Requests",       icon: Wrench,          href: "/admin/mod-requests",       group: "main" },
  support_tickets: { id: "support_tickets", labelAr: "تذاكر الدعم",      labelEn: "Support Tickets",    icon: Headphones,      href: "/admin/contact-messages",   group: "main" },
  products:        { id: "products",        labelAr: "المنتجات",          labelEn: "Products",           icon: ShoppingBag,     href: "/admin/products",           group: "main" },
  news:            { id: "news",            labelAr: "الأخبار والمدونة",  labelEn: "News & Blog",        icon: Newspaper,       href: "/admin/news",               group: "main" },
  marketing_posts: { id: "marketing_posts", labelAr: "أدوات التسويق",    labelEn: "Marketing Tools",    icon: Megaphone,       href: "/sales/marketing",          group: "main" },
  leads_data:      { id: "leads_data",      labelAr: "داتا العملاء",      labelEn: "Leads Data",         icon: Building2,       href: "/employee/leads-data",          group: "main" },
  crm:             { id: "crm",             labelAr: "CRM",               labelEn: "CRM",                icon: TrendingUp,      href: "/employee/crm",                group: "main" },
  whatsapp_crm:    { id: "whatsapp_crm",    labelAr: "واتساب CRM",        labelEn: "WhatsApp CRM",       icon: MessageSquare,   href: "/employee/whatsapp-crm",       group: "main" },
  builder:         { id: "builder",         labelAr: "صانع الأنظمة",     labelEn: "System Builder",     icon: Code2,           href: "/employee/system-builder",     group: "tools" },
  deployment:      { id: "deployment",      labelAr: "نشر المشاريع",     labelEn: "Deployment Cloud",   icon: CloudUpload,     href: "/employee/deployment-cloud",   group: "tools" },
  sector_guide:    { id: "sector_guide",    labelAr: "دليل القطاعات",    labelEn: "Sector Guide",       icon: Globe,           href: "/employee/sector-guide",       group: "tools" },
  qi_agent:        { id: "qi_agent",        labelAr: "QIROX Studio AI",   labelEn: "QIROX Studio AI",    icon: Sparkles,        href: "/employee/studio",             group: "tools" },
  checklist:       { id: "checklist",       labelAr: "قائمة المهام",      labelEn: "My Checklist",       icon: CheckSquare,     href: "/employee/checklist",          group: "tools" },
  qmeet:           { id: "qmeet",           labelAr: "الاجتماعات",       labelEn: "Meetings",           icon: Video,           href: "/admin/qmeet",              group: "tools" },
  kanban:          { id: "kanban",          labelAr: "لوحة المهام",       labelEn: "Task Board",         icon: ClipboardList,   href: "/admin/kanban",             group: "tools" },
  finance:         { id: "finance",         labelAr: "المالية",           labelEn: "Finance",            icon: DollarSign,      href: "/admin/finance",            group: "finance" },
  invoices:        { id: "invoices",        labelAr: "الفواتير",          labelEn: "Invoices",           icon: FileText,        href: "/admin/invoices",           group: "finance" },
  receipts:        { id: "receipts",        labelAr: "الوصولات",          labelEn: "Receipts",           icon: Receipt,         href: "/admin/receipts",           group: "finance" },
  payroll:         { id: "payroll",         labelAr: "الرواتب",           labelEn: "Payroll",            icon: Banknote,        href: "/admin/payroll",            group: "finance" },
  reports:         { id: "reports",         labelAr: "التقارير",          labelEn: "Reports",            icon: BarChart3,       href: "/admin/analytics",          group: "finance" },
  employees:       { id: "employees",       labelAr: "الموظفون",          labelEn: "Employees",          icon: Building2,       href: "/admin/employees",          group: "hr" },
  attendance:      { id: "attendance",      labelAr: "الحضور والانصراف", labelEn: "Attendance",         icon: CalendarDays,    href: "/admin/attendance",         group: "hr" },
  settings:        { id: "settings",        labelAr: "الإعدادات",         labelEn: "Settings",           icon: Settings,        href: "/admin/settings",           group: "config" },
  mail:            { id: "mail",            labelAr: "البريد",            labelEn: "Mail",               icon: Mail,            href: "/employee/mail",            group: "personal" },
  profile:         { id: "profile",         labelAr: "ملفي الشخصي",      labelEn: "My Profile",         icon: User2,           href: "/employee/profile",         group: "personal" },
  changelog:       { id: "changelog",       labelAr: "التحديثات",         labelEn: "Updates",            icon: BookOpen,        href: "/employee/changelog",       group: "personal" },
  my_finance:      { id: "my_finance",      labelAr: "حقي المالي",        labelEn: "My Financials",      icon: Banknote,        href: "/employee/my-finance",      group: "personal" },
};

const ROLE_ITEMS: Record<string, string[]> = {
  admin:         ["dashboard", "orders", "customers", "leads_data", "crm", "whatsapp_crm", "employees", "finance", "invoices", "receipts", "payroll", "reports", "quotations", "kanban", "attendance", "qmeet", "builder", "deployment", "sector_guide", "qi_agent", "checklist", "settings", "mail", "profile", "changelog"],
  manager:       ["dashboard", "orders", "customers", "leads_data", "crm", "whatsapp_crm", "employees", "finance", "invoices", "receipts", "reports", "quotations", "kanban", "attendance", "qmeet", "builder", "deployment", "qi_agent", "checklist", "mail", "profile", "changelog"],
  developer:     ["dashboard", "mod_requests", "orders", "builder", "deployment", "sector_guide", "qi_agent", "checklist", "qmeet", "kanban", "mail", "profile", "my_finance", "changelog"],
  designer:      ["dashboard", "mod_requests", "builder", "checklist", "qmeet", "mail", "profile", "my_finance", "changelog"],
  sales:         ["dashboard", "customers", "leads_data", "crm", "whatsapp_crm", "new_order", "quotations", "checklist", "mail", "profile", "my_finance"],
  sales_manager: ["dashboard", "customers", "leads_data", "crm", "whatsapp_crm", "orders", "new_order", "subscriptions", "quotations", "abandoned_carts", "reports", "checklist", "mail", "profile", "my_finance"],
  marketing:     ["dashboard", "customers", "leads_data", "crm", "whatsapp_crm", "new_order", "quotations", "marketing_posts", "checklist", "mail", "profile", "my_finance"],
  accountant:    ["dashboard", "finance", "invoices", "receipts", "payroll", "reports", "checklist", "mail", "profile", "my_finance"],
  support:       ["dashboard", "support_tickets", "customers", "leads_data", "checklist", "mail", "profile", "my_finance"],
  hr:            ["dashboard", "employees", "payroll", "attendance", "checklist", "mail", "profile", "my_finance"],
  merchant:      ["dashboard", "checklist", "mail", "profile", "my_finance"],
  content:       ["dashboard", "products", "news", "marketing_posts", "checklist", "mail", "profile", "my_finance"],
};
const DEFAULT_ITEMS = ["dashboard", "mail", "profile"];

const ROLE_LABELS: Record<string, [string, string]> = {
  admin:         ["مدير النظام", "System Admin"],
  manager:       ["مدير", "Manager"],
  developer:     ["مطوّر", "Developer"],
  designer:      ["مصمم", "Designer"],
  sales:         ["مبيعات", "Sales"],
  sales_manager: ["مدير مبيعات", "Sales Manager"],
  accountant:    ["محاسب", "Accountant"],
  support:       ["دعم فني", "Support"],
  merchant:      ["توصيل", "Delivery"],
  hr:            ["موارد بشرية", "HR"],
  content:       ["محتوى", "Content"],
  marketing:     ["تسويق", "Marketing"],
};

const ROLE_BADGE_CLASS: Record<string, string> = {
  admin:         "bg-black text-white dark:bg-white dark:text-black",
  manager:       "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900",
  developer:     "bg-blue-600 text-white dark:bg-blue-400 dark:text-blue-950",
  designer:      "bg-purple-600 text-white dark:bg-purple-400 dark:text-purple-950",
  sales:         "bg-emerald-600 text-white dark:bg-emerald-400 dark:text-emerald-950",
  sales_manager: "bg-teal-600 text-white dark:bg-teal-400 dark:text-teal-950",
  accountant:    "bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-950",
  support:       "bg-orange-500 text-white dark:bg-orange-400 dark:text-orange-950",
  marketing:     "bg-pink-500 text-white dark:bg-pink-400 dark:text-pink-950",
  hr:            "bg-rose-500 text-white dark:bg-rose-400 dark:text-rose-950",
  content:       "bg-indigo-500 text-white dark:bg-indigo-400 dark:text-indigo-950",
  merchant:      "bg-stone-500 text-white dark:bg-stone-300 dark:text-stone-900",
};

const GROUP_LABELS: Record<string, [string, string]> = {
  main:     ["الرئيسية",         "Main"],
  tools:    ["الأدوات",          "Tools"],
  finance:  ["المالية",          "Finance"],
  hr:       ["الموارد البشرية",  "HR"],
  config:   ["الإعدادات",        "Config"],
  personal: ["الشخصية",          "Personal"],
};

const GROUP_ORDER = ["main", "tools", "finance", "hr", "config", "personal"];

const ROLE_SCOPE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string; ring: string }> = {
  admin:         { bg: "bg-black/5 dark:bg-white/5",        text: "text-black dark:text-white",              border: "border-black/15 dark:border-white/15",   dot: "bg-black dark:bg-white",            ring: "ring-black/20 dark:ring-white/20" },
  manager:       { bg: "bg-gray-500/10",                    text: "text-gray-800 dark:text-gray-200",         border: "border-gray-400/25",                     dot: "bg-gray-600 dark:bg-gray-300",      ring: "ring-gray-400/30" },
  developer:     { bg: "bg-blue-500/10",                    text: "text-blue-700 dark:text-blue-300",         border: "border-blue-400/25",                     dot: "bg-blue-500",                       ring: "ring-blue-400/30" },
  designer:      { bg: "bg-purple-500/10",                  text: "text-purple-700 dark:text-purple-300",     border: "border-purple-400/25",                   dot: "bg-purple-500",                     ring: "ring-purple-400/30" },
  sales:         { bg: "bg-emerald-500/10",                 text: "text-emerald-700 dark:text-emerald-300",   border: "border-emerald-400/25",                  dot: "bg-emerald-500",                    ring: "ring-emerald-400/30" },
  sales_manager: { bg: "bg-teal-500/10",                    text: "text-teal-700 dark:text-teal-300",         border: "border-teal-400/25",                     dot: "bg-teal-500",                       ring: "ring-teal-400/30" },
  accountant:    { bg: "bg-amber-500/10",                   text: "text-amber-700 dark:text-amber-300",       border: "border-amber-400/25",                    dot: "bg-amber-500",                      ring: "ring-amber-400/30" },
  support:       { bg: "bg-orange-500/10",                  text: "text-orange-700 dark:text-orange-300",     border: "border-orange-400/25",                   dot: "bg-orange-500",                     ring: "ring-orange-400/30" },
  marketing:     { bg: "bg-pink-500/10",                    text: "text-pink-700 dark:text-pink-300",         border: "border-pink-400/25",                     dot: "bg-pink-500",                       ring: "ring-pink-400/30" },
  hr:            { bg: "bg-rose-500/10",                    text: "text-rose-700 dark:text-rose-300",         border: "border-rose-400/25",                     dot: "bg-rose-500",                       ring: "ring-rose-400/30" },
  content:       { bg: "bg-indigo-500/10",                  text: "text-indigo-700 dark:text-indigo-300",     border: "border-indigo-400/25",                   dot: "bg-indigo-500",                     ring: "ring-indigo-400/30" },
  merchant:      { bg: "bg-stone-500/10",                   text: "text-stone-700 dark:text-stone-300",       border: "border-stone-400/25",                    dot: "bg-stone-500",                      ring: "ring-stone-400/30" },
};

function getTimeLabel(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "صباح الخير ☀️";
  if (h >= 12 && h < 17) return "مساء الخير 🌤️";
  if (h >= 17 && h < 21) return "مساء النور 🌆";
  return "ليلة طيبة 🌙";
}

/* ── Daily Hub Widget ──────────────────────────────────────────── */
function DailyHub({ onAiOpen, onItemClick, role }: { onAiOpen: () => void; onItemClick?: () => void; role: string }) {
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/inbox/unread-count"],
    refetchInterval: 30000,
  });

  const { data: myTasksData } = useQuery<{ tasks: any[] }>({
    queryKey: ["/api/my-kanban-tasks"],
    refetchInterval: 60000,
  });

  const unreadCount = unreadData?.count ?? 0;
  const pendingTasks = (myTasksData?.tasks ?? []).filter(t => !["closed", "done", "delivery"].includes(t.status)).length;

  const quickTools = [
    { icon: MessageSquare, label: "رسائلي", href: "/employee/mail", count: unreadCount, color: "text-blue-500" },
    { icon: CheckSquare, label: "مهامي", href: "/admin/kanban", count: pendingTasks, color: "text-emerald-500" },
    { icon: Video, label: "اجتماع", href: "/admin/qmeet", color: "text-purple-500" },
    { icon: LayoutGrid, label: "أدواتي", href: "/our-tools", color: "text-amber-500" },
  ];

  return (
    <div className="px-3 py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
      {/* Time + AI CTA */}
      <button
        onClick={() => { onAiOpen(); onItemClick?.(); }}
        data-testid="daily-hub-ai"
        className="w-full rounded-xl bg-gradient-to-l from-black to-black/85 dark:from-white dark:to-white/85 p-2.5 flex items-center gap-2.5 hover:from-black/90 dark:hover:from-white/90 transition-all group mb-2.5 shadow-sm"
      >
        <div className="w-7 h-7 rounded-lg bg-white/15 dark:bg-black/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img src="/qirox-icon-nobg.png" alt="Q" className="w-5 h-5 object-contain invert dark:invert-0" />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="text-[11px] font-black text-white dark:text-black leading-none">{getTimeLabel()}</p>
          <p className="text-[9px] text-white/60 dark:text-black/55 mt-0.5">اضغط لمحادثة Qirox AI</p>
        </div>
        <ChevronRight className="w-3 h-3 text-white/50 dark:text-black/40 group-hover:translate-x-0.5 transition-transform flex-shrink-0 rotate-180" />
      </button>

      {/* Quick access grid */}
      <div className="grid grid-cols-4 gap-1">
        {quickTools.map(({ icon: Icon, label, href, count, color }) => (
          <Link key={href} href={href}>
            <button
              onClick={onItemClick}
              className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-all group relative"
              data-testid={`daily-hub-${label}`}
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                </div>
                {count != null && count > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center px-0.5 leading-none">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold text-black/45 dark:text-white/40 leading-none">{label}</span>
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── Mobile My Tasks Strip (visible only on mobile, below page content) ── */
const STATUS_COLORS: Record<string, string> = {
  new: "bg-slate-400",
  under_study: "bg-blue-400",
  pending_payment: "bg-amber-400",
  in_progress: "bg-violet-500",
  testing: "bg-cyan-400",
  review: "bg-orange-400",
  delivery: "bg-emerald-400",
  closed: "bg-gray-300",
};
const STATUS_LABELS: Record<string, string> = {
  new: "جديدة",
  under_study: "قيد الدراسة",
  pending_payment: "انتظار الدفع",
  in_progress: "جارية",
  testing: "اختبار",
  review: "مراجعة",
  delivery: "تسليم",
  closed: "مغلقة",
};

function MobileMyTasks() {
  const { data, isLoading } = useQuery<{ tasks: any[] }>({
    queryKey: ["/api/my-kanban-tasks"],
    refetchInterval: 60000,
  });
  const tasks = (data?.tasks ?? []).filter(t => !["closed", "delivery"].includes(t.status));
  if (!tasks.length && !isLoading) return null;

  return (
    <div className="lg:hidden mx-3 mb-3 rounded-2xl bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.06] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/[0.05] dark:border-white/[0.05]">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-xs font-black text-black dark:text-white">مهامي المُعيّنة</span>
        </div>
        {tasks.length > 0 && (
          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
            {tasks.length} مهمة
          </span>
        )}
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 text-black/30 dark:text-white/30 animate-spin" />
        </div>
      ) : (
        <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
          {tasks.slice(0, 5).map((task: any) => (
            <Link key={task._id} href="/admin/kanban">
              <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[task.status] || "bg-gray-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-black dark:text-white truncate leading-tight">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-black/35 dark:text-white/35">
                      {STATUS_LABELS[task.status] || task.status}
                    </span>
                    {task.createdBy && (
                      <span className="text-[10px] text-black/25 dark:text-white/25">
                        · {task.createdBy.fullName || task.createdBy.username}
                      </span>
                    )}
                    {task.deadline && (
                      <span className={`text-[10px] font-medium ${new Date(task.deadline) < new Date() ? "text-red-500" : "text-black/30 dark:text-white/30"}`}>
                        · {new Date(task.deadline).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-3 h-3 text-black/20 dark:text-white/20 flex-shrink-0 rotate-180" />
              </div>
            </Link>
          ))}
          {tasks.length > 5 && (
            <Link href="/admin/kanban">
              <div className="px-4 py-2 text-center text-[11px] font-bold text-black/40 dark:text-white/35 hover:text-black dark:hover:text-white transition-colors cursor-pointer">
                +{tasks.length - 5} مهام أخرى
              </div>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [viewAsRole, setViewAsRole] = useState<string | null>(null);
  const [scopePanelOpen, setScopePanelOpen] = useState(false);
  const [location] = useLocation();
  const { data: user } = useUser();
  const { lang } = useI18n();
  const { theme, toggle: toggleTheme } = useTheme();
  const { mutate: logout, isPending: loggingOut } = useLogout();
  const L = lang === "ar";

  const userRole = (user as any)?.role || "";
  const canScope = userRole === "admin" || userRole === "manager";

  const navItems = useMemo(() => {
    const role = (canScope && viewAsRole) ? viewAsRole : ((user as any)?.role || "default");
    // Use custom allowedPages per employee if set by admin (overrides role default)
    const customPages: string[] | null = (canScope && viewAsRole) ? null : ((user as any)?.allowedPages ?? null);
    const ids = (customPages && customPages.length > 0) ? customPages : (ROLE_ITEMS[role] || DEFAULT_ITEMS);
    return ids.map(id => ALL_NAV[id]).filter(Boolean);
  }, [(user as any)?.role, (user as any)?.allowedPages, viewAsRole, canScope]);

  const grouped = useMemo(() => {
    const g: Record<string, NavItem[]> = {};
    for (const item of navItems) {
      if (!g[item.group]) g[item.group] = [];
      g[item.group].push(item);
    }
    return g;
  }, [navItems]);

  const orderedGroups = GROUP_ORDER.filter(g => grouped[g]?.length > 0);

  const roleLabel = userRole
    ? (ROLE_LABELS[userRole] || [userRole, userRole])
    : ["موظف", "Employee"];
  const roleBadgeClass = ROLE_BADGE_CLASS[userRole] || "bg-black/[0.07] text-black/60 dark:bg-white/[0.1] dark:text-white/60";

  function isActive(href: string) {
    if (href === "/employee/role-dashboard") {
      return location === "/employee/role-dashboard" || location === "/employee/changelog" || location === "/employee/profile";
    }
    return location.startsWith(href);
  }

  const mobileNavItems = navItems
    .filter(item => ["dashboard", "orders", "customers", "mail", "profile"].includes(item.id))
    .slice(0, 5);

  function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
    return (
      <div className="flex flex-col h-full" dir="rtl">
        {/* Brand */}
        <div className="px-4 pt-5 pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black dark:bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <img src="/qirox-icon-nobg.png" alt="Q" className="w-5 h-5 object-contain dark:invert" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-sm text-black dark:text-white leading-none tracking-tight">QIROX</p>
              <p className="text-[10px] text-black/35 dark:text-white/35 font-medium mt-0.5">Studio · نظام الموظفين</p>
            </div>
            {onItemClick && (
              <button
                onClick={onItemClick}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
              >
                <X className="w-4 h-4 text-black/40 dark:text-white/40" />
              </button>
            )}
          </div>
        </div>

        {/* Employee Identity */}
        <div className="px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <UserAvatar
              profilePhotoUrl={(user as any)?.profilePhotoUrl}
              avatarConfig={(user as any)?.avatarConfig}
              name={(user as any)?.fullName || (user as any)?.username}
              role={(user as any)?.role}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-black dark:text-white truncate leading-tight">
                {(user as any)?.fullName || (user as any)?.username || (L ? "الموظف" : "Employee")}
              </p>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${roleBadgeClass}`}>
                {(user as any)?.jobTitle || (L ? roleLabel[0] : roleLabel[1])}
              </span>
            </div>
          </div>
        </div>

        {/* ── Daily Hub ── */}
        <DailyHub
          onAiOpen={() => setAiOpen(true)}
          onItemClick={onItemClick}
          role={userRole}
        />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-hide">
          {orderedGroups.map(group => (
            <div key={group}>
              <p className="text-[9px] font-black text-black/25 dark:text-white/22 uppercase tracking-[0.18em] px-2 mb-1.5">
                {L ? GROUP_LABELS[group]?.[0] : GROUP_LABELS[group]?.[1]}
              </p>
              <div className="space-y-0.5">
                {grouped[group].map(item => {
                  const active = isActive(item.href);
                  return (
                    <Link key={item.id} href={item.href}>
                      <button
                        onClick={onItemClick}
                        data-testid={`employee-nav-${item.id}`}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 text-right ${
                          active
                            ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                            : "text-black/60 dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white"
                        }`}
                      >
                        <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "" : "opacity-60"}`} />
                        <span className="flex-1 text-right truncate">{L ? item.labelAr : item.labelEn}</span>
                        {active && <div className="w-1.5 h-1.5 rounded-full bg-white/40 dark:bg-black/40 flex-shrink-0" />}
                      </button>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Role Scope Panel (Admin/Manager only) ── */}
        {canScope && (
          <div className="px-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
            {viewAsRole ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`rounded-2xl border p-3 mb-1 ${ROLE_SCOPE_COLORS[viewAsRole]?.bg} ${ROLE_SCOPE_COLORS[viewAsRole]?.border}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Eye className={`w-3 h-3 ${ROLE_SCOPE_COLORS[viewAsRole]?.text}`} />
                    <span className={`text-[10px] font-black tracking-wide ${ROLE_SCOPE_COLORS[viewAsRole]?.text}`}>مراقبة نشطة</span>
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${ROLE_SCOPE_COLORS[viewAsRole]?.dot}`} />
                  </div>
                  <button
                    onClick={() => setViewAsRole(null)}
                    className="text-[9px] font-black text-black/35 dark:text-white/35 hover:text-red-500 transition-colors px-1.5 py-0.5 rounded-lg hover:bg-red-500/10"
                  >
                    ✕ إيقاف
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${ROLE_SCOPE_COLORS[viewAsRole]?.dot}`} />
                  <span className={`text-sm font-black leading-none ${ROLE_SCOPE_COLORS[viewAsRole]?.text}`}>
                    {ROLE_LABELS[viewAsRole]?.[0] || viewAsRole}
                  </span>
                </div>
                <button
                  onClick={() => setScopePanelOpen(true)}
                  className="w-full text-[10px] font-bold text-black/35 dark:text-white/35 hover:text-black dark:hover:text-white transition-colors text-right flex items-center gap-1"
                >
                  <Layers className="w-3 h-3" />
                  تغيير الدور
                </button>
              </motion.div>
            ) : (
              <button
                onClick={() => setScopePanelOpen(true)}
                data-testid="employee-scope-btn"
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-black/55 dark:text-white/55 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white transition-all group mb-0.5"
              >
                <Eye className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                <span className="flex-1 text-right">مراقبة الأدوار</span>
                <Layers className="w-3.5 h-3.5 opacity-25 group-hover:opacity-60 transition-opacity" />
              </button>
            )}
          </div>
        )}

        {/* Footer Controls */}
        <div className="px-2 pb-3 pt-2 border-t border-black/[0.06] dark:border-white/[0.06] space-y-0.5">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-black/55 dark:text-white/55 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white transition-colors"
            data-testid="employee-theme-toggle"
          >
            {theme === "dark"
              ? <Sun className="w-4 h-4 opacity-60" />
              : <Moon className="w-4 h-4 opacity-60" />}
            <span>{L ? (theme === "dark" ? "الوضع النهاري" : "الوضع الليلي") : (theme === "dark" ? "Light Mode" : "Dark Mode")}</span>
          </button>
          <button
            onClick={() => logout()}
            disabled={loggingOut}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-black/55 dark:text-white/55 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white transition-colors disabled:opacity-50"
            data-testid="employee-logout"
          >
            {loggingOut
              ? <Loader2 className="w-4 h-4 opacity-60 animate-spin" />
              : <LogOut className="w-4 h-4 opacity-60" />}
            <span>{L ? "تسجيل الخروج" : "Sign Out"}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f6f6] dark:bg-gray-950 flex" dir="rtl">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex w-60 flex-col fixed top-0 right-0 bottom-0 bg-white dark:bg-gray-900 border-l border-black/[0.06] dark:border-white/[0.06] z-40">
        <SidebarContent />
      </aside>

      {/* ── Mobile Drawer + Overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed top-0 right-0 bottom-0 w-64 bg-white dark:bg-gray-900 z-50 lg:hidden shadow-2xl"
            >
              <SidebarContent onItemClick={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Area ── */}
      <div className="flex-1 lg:mr-60 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-black/[0.06] dark:border-white/[0.06] sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-black dark:bg-white rounded-lg flex items-center justify-center">
              <img src="/qirox-icon-nobg.png" alt="Q" className="w-4 h-4 object-contain dark:invert" />
            </div>
            <span className="font-black text-sm text-black dark:text-white tracking-tight">QIROX Studio</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAiOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-black dark:bg-white shadow-sm"
              data-testid="employee-ai-mobile-btn"
            >
              <Sparkles className="w-3.5 h-3.5 text-white dark:text-black" />
            </button>
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/[0.05] dark:bg-white/[0.06] hover:bg-black/[0.09] dark:hover:bg-white/[0.1] transition-colors"
              data-testid="employee-mobile-menu"
            >
              <Menu className="w-4.5 h-4.5 text-black/70 dark:text-white/70" />
            </button>
          </div>
        </div>

        {/* ── Role Scope Banner ── */}
        <AnimatePresence>
          {canScope && viewAsRole && (
            <motion.div
              key="scope-banner"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className={`flex items-center justify-between px-4 py-2 border-b ${ROLE_SCOPE_COLORS[viewAsRole]?.bg} ${ROLE_SCOPE_COLORS[viewAsRole]?.border}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${ROLE_SCOPE_COLORS[viewAsRole]?.dot}`} />
                  <Eye className={`w-3.5 h-3.5 ${ROLE_SCOPE_COLORS[viewAsRole]?.text}`} />
                  <span className={`text-xs font-black ${ROLE_SCOPE_COLORS[viewAsRole]?.text}`}>
                    تتصفح كـ: <span className="underline underline-offset-2">{ROLE_LABELS[viewAsRole]?.[0]}</span>
                  </span>
                  <span className={`text-[10px] font-medium opacity-60 ${ROLE_SCOPE_COLORS[viewAsRole]?.text}`}>
                    · {(ROLE_ITEMS[viewAsRole] || []).length} صفحة متاحة
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setScopePanelOpen(true)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${ROLE_SCOPE_COLORS[viewAsRole]?.text} hover:opacity-80`}
                  >
                    تغيير ←
                  </button>
                  <button
                    onClick={() => setViewAsRole(null)}
                    className="flex items-center gap-1 text-[10px] font-black text-red-500 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
                  >
                    <X className="w-3 h-3" />
                    إيقاف
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="flex-1 pb-20 lg:pb-0">
          {children}
        </div>

        {/* ── Mobile My Tasks Strip ── */}
        <MobileMyTasks />
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-black/[0.06] dark:border-white/[0.06] shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.08)]"
        dir="rtl"
      >
        <div className="flex items-stretch justify-around px-1 py-1.5">
          {mobileNavItems.map(item => {
            const active = isActive(item.href);
            return (
              <Link key={item.id} href={item.href}>
                <button
                  data-testid={`mobile-nav-${item.id}`}
                  className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-[52px]"
                >
                  <div
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                      active ? "bg-black dark:bg-white shadow-sm" : "bg-transparent"
                    }`}
                  >
                    <item.icon
                      className={`w-[18px] h-[18px] transition-colors ${
                        active ? "text-white dark:text-black" : "text-black/35 dark:text-white/35"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[9px] font-bold leading-none transition-colors ${
                      active ? "text-black dark:text-white" : "text-black/30 dark:text-white/30"
                    }`}
                  >
                    {L ? item.labelAr : item.labelEn}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── AI Assistant Panel ── */}
      <EmployeeAIAssistant open={aiOpen} onClose={() => setAiOpen(false)} />

      {/* ── Role Scope Modal ── */}
      <AnimatePresence>
        {scopePanelOpen && (
          <motion.div
            key="scope-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setScopePanelOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 24 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-black/[0.06] dark:border-white/[0.06]"
              dir="rtl"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.06] bg-gradient-to-l from-black/[0.02] dark:from-white/[0.02] to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-black dark:bg-white flex items-center justify-center shadow-sm">
                      <Eye className="w-4.5 h-4.5 text-white dark:text-black" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-black dark:text-white leading-tight">مراقب الأدوار</p>
                      <p className="text-[10px] text-black/40 dark:text-white/40 mt-0.5">تصفّح النظام من منظور أي موظف</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setScopePanelOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
                  >
                    <X className="w-4 h-4 text-black/40 dark:text-white/40" />
                  </button>
                </div>
              </div>

              {/* Roles Grid */}
              <div className="p-3 grid grid-cols-2 gap-2 max-h-[58vh] overflow-y-auto">
                {Object.entries(ROLE_LABELS).map(([role, [labelAr, labelEn]]) => {
                  const colors = ROLE_SCOPE_COLORS[role];
                  const isActive = viewAsRole === role;
                  const pageCount = (ROLE_ITEMS[role] || []).length;
                  return (
                    <motion.button
                      key={role}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setViewAsRole(role); setScopePanelOpen(false); }}
                      className={`flex flex-col items-start gap-2.5 p-3.5 rounded-2xl border transition-all text-right ${
                        isActive
                          ? `${colors?.bg} ${colors?.border} ring-2 ring-offset-1 ${colors?.ring} shadow-sm`
                          : `${colors?.bg} ${colors?.border} hover:shadow-sm`
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className={`w-2.5 h-2.5 rounded-full ${colors?.dot}`} />
                        {isActive && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <Check className={`w-3.5 h-3.5 ${colors?.text}`} />
                          </motion.div>
                        )}
                      </div>
                      <div>
                        <p className={`text-[13px] font-black leading-tight ${colors?.text}`}>{labelAr}</p>
                        <p className="text-[10px] text-black/30 dark:text-white/30 mt-0.5 font-medium">{pageCount} صفحة</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-3 pb-3 pt-1 border-t border-black/[0.05] dark:border-white/[0.05]">
                {viewAsRole ? (
                  <button
                    onClick={() => { setViewAsRole(null); setScopePanelOpen(false); }}
                    className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-3.5 h-3.5" />
                    إيقاف المراقبة والعودة لدوري
                  </button>
                ) : (
                  <p className="text-center text-[11px] text-black/30 dark:text-white/30 py-1">
                    اختر دوراً للتصفح من منظوره
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
