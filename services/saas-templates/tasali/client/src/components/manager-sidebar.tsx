import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, ShoppingCart, ClipboardList, Package, Warehouse,
  Wallet, Users, Truck, BarChart3, Building2, Brain, Settings,
  ChefHat, Clock, Coffee, Gift, Star, FileText,
  Globe, Code2, Store, Shield,
  TrendingUp, MapPin, Receipt, ChevronDown,
  LogOut, X, BarChart2, Zap, Box, FlaskConical,
  ArrowRightLeft, Bell, Table, BookOpen, UserCheck, CreditCard, Monitor,
  Sparkles, RefreshCw, Calculator, Home, Crown
} from "lucide-react";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { useSystemMode } from "@/lib/system-mode";
import staffLogo from "@assets/employee-logo.png";

interface ManagerSidebarProps {
  manager: any;
  onLogout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  role?: string;
}

/* ─── Role-aware dashboard path ───────────────────────────────────────────── */
function getDashboardPath(role: string) {
  if (role === "owner" || role === "admin") return "/owner/dashboard";
  return "/manager/dashboard";
}

/* ─── Navigation groups ───────────────────────────────────────────────────── */
function buildNavGroups(role: string, isPOS: boolean) {
  const dashPath = getDashboardPath(role);
  const isOwner = role === "owner" || role === "admin";

  const all = [
    {
      key: "home",
      label: "الرئيسية",
      labelEn: "Overview",
      icon: Home,
      items: [
        { label: "لوحة التحكم", labelEn: "Dashboard", icon: LayoutDashboard, path: dashPath },
        ...(isPOS ? [
          { label: "نقطة البيع", labelEn: "POS", icon: ShoppingCart, path: "/employee/pos" },
          { label: "الكيوسك", labelEn: "Kiosk", icon: Monitor, path: "/kiosk" },
        ] : []),
      ],
    },
    {
      key: "operations",
      label: "العمليات",
      labelEn: "Operations",
      icon: ClipboardList,
      hidden: !isPOS,
      items: [
        { label: "إدارة الطلبات", labelEn: "Orders", icon: ClipboardList, path: "/manager/orders" },
        { label: "الطاولات", labelEn: "Tables", icon: Table, path: "/manager/tables" },
        { label: "إدارة المنتجات", labelEn: "Menu", icon: Coffee, path: "/employee/menu-management" },
        { label: "حجوزات الطاولات", labelEn: "Table Reservations", icon: BookOpen, path: "/manager/reservations" },
        { label: "حجوزات المنتجات", labelEn: "Product Reservations", icon: Star, path: "/manager/product-reservations" },
        { label: "الورديات", labelEn: "Shifts", icon: Clock, path: "/manager/shifts" },
      ],
    },
    {
      key: "menu",
      label: "قائمة المنتجات",
      labelEn: "Products",
      icon: Coffee,
      hidden: isPOS, // only show in menu mode when operations is hidden
      items: [
        { label: "إدارة المنتجات", labelEn: "Menu Management", icon: Coffee, path: "/employee/menu-management" },
        { label: "حجوزات المنتجات", labelEn: "Product Reservations", icon: Star, path: "/manager/product-reservations" },
      ],
    },
    {
      key: "inventory",
      label: "المخزون",
      labelEn: "Inventory",
      icon: Warehouse,
      hidden: !isPOS,
      items: [
        { label: "نظرة المخزون", labelEn: "Inventory", icon: Warehouse, path: "/manager/inventory" },
        { label: "دورة المخزون الذكي", labelEn: "Smart Inventory Cycle", icon: RefreshCw, path: "/manager/inventory/cycle" },
        { label: "المواد الخام", labelEn: "Raw Items", icon: Box, path: "/manager/inventory/raw-items" },
        { label: "الوصفات", labelEn: "Recipes", icon: FlaskConical, path: "/manager/inventory/recipes" },
        { label: "المشتريات", labelEn: "Purchases", icon: Receipt, path: "/manager/inventory/purchases" },
        { label: "حركات المخزون", labelEn: "Movements", icon: ArrowRightLeft, path: "/manager/inventory/movements" },
        { label: "نقل بين الفروع", labelEn: "Transfers", icon: Truck, path: "/manager/inventory/transfers" },
        { label: "تنبيهات المخزون", labelEn: "Alerts", icon: Bell, path: "/manager/inventory/alerts", badge: true },
      ],
    },
    {
      key: "finance",
      label: "المالية",
      labelEn: "Finance",
      icon: Wallet,
      hidden: !isPOS,
      items: [
        { label: "المحاسبة", labelEn: "Accounting", icon: Wallet, path: "/manager/accounting" },
        { label: "تتبع المدفوعات", labelEn: "Payment Tracking", icon: Receipt, path: "/manager/payment-tracking" },
        { label: "تقارير المبيعات", labelEn: "Sales Reports", icon: FileText, path: "/admin/reports" },
        ...(isOwner ? [
          { label: "ZATCA فاتورة", labelEn: "ZATCA", icon: Shield, path: "/manager/zatca" },
        ] : []),
      ],
    },
    {
      key: "reports",
      label: "التقارير",
      labelEn: "Reports",
      icon: BarChart3,
      hidden: !isPOS,
      items: [
        { label: "الإحصائيات", labelEn: "Statistics", icon: TrendingUp, path: "/manager/statistics" },
        { label: "تقارير موحدة", labelEn: "Unified Reports", icon: BarChart3, path: "/manager/unified-reports" },
        ...(isOwner ? [
          { label: "لوحة المالك", labelEn: "Owner Dashboard", icon: Crown, path: "/owner/dashboard" },
          { label: "نظام ERP", labelEn: "ERP Accounting", icon: BookOpen, path: "/erp/accounting" },
        ] : []),
      ],
    },
    {
      key: "team",
      label: "الفريق",
      labelEn: "Team",
      icon: Users,
      items: [
        { label: "الموظفون", labelEn: "Employees", icon: Users, path: "/admin/employees" },
        ...(isPOS ? [
          { label: "الحضور", labelEn: "Attendance", icon: UserCheck, path: "/manager/attendance" },
          { label: "إدارة التوصيل", labelEn: "Delivery", icon: Truck, path: "/manager/delivery" },
        ] : []),
      ],
    },
    {
      key: "management",
      label: "الإعدادات",
      labelEn: "Settings",
      icon: Settings,
      items: [
        { label: "الإعدادات العامة", labelEn: "Settings", icon: Settings, path: "/admin/settings" },
        { label: "الفروع", labelEn: "Branches", icon: Building2, path: "/admin/branches" },
        ...(isOwner ? [
          { label: "إدارة API", labelEn: "API", icon: Code2, path: "/admin/api" },
        ] : []),
      ],
    },
  ];

  return all.filter(g => !g.hidden && g.items.length > 0);
}

/* ─── Single nav item ─────────────────────────────────────────────────────── */
function NavItem({
  label, icon: Icon, path, active, onClick, badge, indent = false,
}: {
  label: string; icon: any; path: string; active: boolean;
  onClick: () => void; badge?: boolean; indent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full flex items-center gap-3 py-2.5 text-sm transition-all",
        indent ? "pr-9 pl-4" : "px-4",
        active
          ? "bg-primary/8 text-primary font-semibold"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      {active && (
        <span className="absolute right-0 top-1.5 bottom-1.5 w-[3px] bg-primary rounded-l-full" />
      )}
      <Icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
      <span className="flex-1 text-right leading-tight truncate">{label}</span>
      {badge && (
        <span className="w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center shrink-0">
          !
        </span>
      )}
    </button>
  );
}

/* ─── Main sidebar ────────────────────────────────────────────────────────── */
export function ManagerSidebar({ manager, onLogout, mobileOpen, onMobileClose, role }: ManagerSidebarProps) {
  const [location, navigate] = useLocation();
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { isPOS } = useSystemMode();

  const userRole = role || manager?.role || "manager";
  const isOwner = userRole === "owner" || userRole === "admin";
  const groups = buildNavGroups(userRole, isPOS);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => ({
    home: true,
    operations: true,
    menu: true,
    inventory: false,
    finance: false,
    reports: false,
    team: false,
    management: false,
  }));

  const toggle = (key: string) =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const go = (path: string) => {
    navigate(path);
    onMobileClose?.();
  };

  const roleBadge = isOwner
    ? { label: "مالك", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/30" }
    : userRole === "branch_manager"
    ? { label: "مدير فرع", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-400/30" }
    : { label: "مدير", color: "bg-primary/10 text-primary border border-primary/20" };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-background border-l border-border" dir="rtl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src={staffLogo} alt={brand.platformNameEn} className="w-8 h-8 object-contain rounded-xl shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-black text-foreground leading-tight truncate">
              {isAr ? brand.platformNameAr : brand.platformNameEn}
            </p>
            <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold leading-none", roleBadge.color)}>
              {roleBadge.label}
            </span>
          </div>
        </div>
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* ── User info strip ── */}
      {manager?.fullName && (
        <div className="px-4 py-2.5 border-b border-border/60 bg-muted/20">
          <p className="text-xs text-muted-foreground truncate">{manager.fullName}</p>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-2">
        {groups.map((group, gi) => {
          const isOpen = expanded[group.key];
          const GroupIcon = group.icon;
          const hasActive = group.items.some(i => i.path && (location === i.path));

          return (
            <div key={group.key}>
              {gi > 0 && <div className="mx-4 my-1 border-t border-border/40" />}
              {/* Group header */}
              <button
                onClick={() => toggle(group.key)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors",
                  hasActive && !isOpen ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <GroupIcon className={cn("w-4 h-4 shrink-0", hasActive && !isOpen ? "text-primary" : "text-muted-foreground")} />
                  <span>{isAr ? group.label : group.labelEn}</span>
                </div>
                <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground/60 transition-transform duration-200", isOpen && "rotate-180")} />
              </button>

              {/* Items */}
              {isOpen && (
                <div className="pb-0.5">
                  {group.items.map(item => (
                    <NavItem
                      key={item.path}
                      label={isAr ? item.label : item.labelEn}
                      icon={item.icon}
                      path={item.path}
                      active={location === item.path}
                      onClick={() => go(item.path)}
                      badge={(item as any).badge}
                      indent
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-border pb-safe">
        <button
          onClick={() => {
            const newLang = isAr ? "en" : "ar";
            i18n.changeLanguage(newLang);
            try { localStorage.setItem("i18nextLng", newLang); } catch {}
            document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
            document.documentElement.lang = newLang;
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span className="flex-1 text-right">{isAr ? "English" : "عربي"}</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="flex-1 text-right">{isAr ? "تسجيل الخروج" : "Logout"}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-56 flex-col h-screen sticky top-0 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={onMobileClose}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <aside
            className="absolute right-0 top-0 bottom-0 w-60 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}

/* ─── Mobile bottom nav from manager-sidebar — now disabled (returns null) ── */
export function MobileBottomNav({ manager }: { manager: any }) {
  return null;
}
