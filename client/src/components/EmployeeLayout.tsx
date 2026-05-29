import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useLogout } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { UserAvatar } from "@/components/UserAvatar";
import {
  LayoutDashboard, Users, Package, Wrench, Code2, Mail,
  User2, BookOpen, DollarSign, FileText, Receipt, Banknote,
  CalendarDays, Video, ShoppingCart, FileCheck, Settings,
  BarChart3, Megaphone, Globe, PlusCircle, Newspaper,
  ShoppingBag, LogOut, Menu, X, Star, Moon, Sun,
  ClipboardList, Building2, Headphones, Loader2, ChevronRight,
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
  builder:         { id: "builder",         labelAr: "صانع الأنظمة",     labelEn: "System Builder",     icon: Code2,           href: "/employee/system-builder",  group: "tools" },
  sector_guide:    { id: "sector_guide",    labelAr: "دليل القطاعات",    labelEn: "Sector Guide",       icon: Globe,           href: "/employee/sector-guide",    group: "tools" },
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
};

const ROLE_ITEMS: Record<string, string[]> = {
  admin:         ["dashboard", "orders", "customers", "employees", "finance", "reports", "quotations", "kanban", "attendance", "qmeet", "builder", "sector_guide", "settings", "mail", "profile", "changelog"],
  manager:       ["dashboard", "orders", "customers", "employees", "finance", "reports", "quotations", "kanban", "attendance", "qmeet", "builder", "mail", "profile", "changelog"],
  developer:     ["dashboard", "mod_requests", "orders", "builder", "sector_guide", "qmeet", "kanban", "mail", "profile", "changelog"],
  designer:      ["dashboard", "mod_requests", "orders", "builder", "qmeet", "mail", "profile", "changelog"],
  sales:         ["dashboard", "customers", "orders", "new_order", "subscriptions", "quotations", "mail", "profile"],
  sales_manager: ["dashboard", "customers", "orders", "new_order", "subscriptions", "quotations", "abandoned_carts", "reports", "mail", "profile"],
  marketing:     ["dashboard", "customers", "orders", "new_order", "subscriptions", "quotations", "marketing_posts", "mail", "profile"],
  accountant:    ["dashboard", "finance", "invoices", "receipts", "payroll", "reports", "mail", "profile"],
  support:       ["dashboard", "support_tickets", "customers", "orders", "mail", "profile"],
  hr:            ["dashboard", "employees", "payroll", "attendance", "mail", "profile"],
  merchant:      ["dashboard", "mail", "profile"],
  content:       ["dashboard", "products", "news", "marketing_posts", "mail", "profile"],
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

const GROUP_LABELS: Record<string, [string, string]> = {
  main:     ["الرئيسية",         "Main"],
  tools:    ["الأدوات",          "Tools"],
  finance:  ["المالية",          "Finance"],
  hr:       ["الموارد البشرية",  "HR"],
  config:   ["الإعدادات",        "Config"],
  personal: ["الشخصية",          "Personal"],
};

const GROUP_ORDER = ["main", "tools", "finance", "hr", "config", "personal"];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { data: user } = useUser();
  const { lang } = useI18n();
  const { theme, toggle: toggleTheme } = useTheme();
  const { mutate: logout, isPending: loggingOut } = useLogout();
  const L = lang === "ar";

  const navItems = useMemo(() => {
    const role = (user as any)?.role || "default";
    const ids = ROLE_ITEMS[role] || DEFAULT_ITEMS;
    return ids.map(id => ALL_NAV[id]).filter(Boolean);
  }, [(user as any)?.role]);

  const grouped = useMemo(() => {
    const g: Record<string, NavItem[]> = {};
    for (const item of navItems) {
      if (!g[item.group]) g[item.group] = [];
      g[item.group].push(item);
    }
    return g;
  }, [navItems]);

  const orderedGroups = GROUP_ORDER.filter(g => grouped[g]?.length > 0);

  const roleLabel = (user as any)?.role
    ? (ROLE_LABELS[(user as any).role] || [(user as any).role, (user as any).role])
    : ["موظف", "Employee"];

  const isHighRole = ["admin", "manager"].includes((user as any)?.role);

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
        <div className="px-4 py-3.5 border-b border-black/[0.06] dark:border-white/[0.06]">
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
              <span
                className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                  isHighRole
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "bg-black/[0.07] text-black/60 dark:bg-white/[0.1] dark:text-white/60"
                }`}
              >
                {L ? roleLabel[0] : roleLabel[1]}
              </span>
            </div>
          </div>
        </div>

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

        {/* Footer Controls */}
        <div className="px-2 pb-4 pt-2 border-t border-black/[0.06] dark:border-white/[0.06] space-y-0.5">
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
      <aside className="hidden lg:flex w-56 flex-col fixed top-0 right-0 bottom-0 bg-white dark:bg-gray-900 border-l border-black/[0.06] dark:border-white/[0.06] z-40">
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
      <div className="flex-1 lg:mr-56 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-black/[0.06] dark:border-white/[0.06] sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-black dark:bg-white rounded-lg flex items-center justify-center">
              <img src="/qirox-icon-nobg.png" alt="Q" className="w-4 h-4 object-contain dark:invert" />
            </div>
            <span className="font-black text-sm text-black dark:text-white tracking-tight">QIROX Studio</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/[0.05] dark:bg-white/[0.06] hover:bg-black/[0.09] dark:hover:bg-white/[0.1] transition-colors"
            data-testid="employee-mobile-menu"
          >
            <Menu className="w-4.5 h-4.5 text-black/70 dark:text-white/70" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 pb-20 lg:pb-0">
          {children}
        </div>
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
    </div>
  );
}
