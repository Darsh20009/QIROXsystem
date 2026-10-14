import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Users, FileText, Settings, LogOut, Bell,
  GitBranch, Mail, Coffee, Star, ClipboardList, CreditCard,
  ChevronDown, X, Package, BarChart3, ShoppingCart,
  Palette, Printer, Code2, Gift, HelpCircle, Store, Megaphone,
  BookOpen, Warehouse, UserCheck, Shield, Activity, Layers, Receipt,
  UserSearch, Rocket, TrendingUp, Home, Menu
} from 'lucide-react';
import { brand } from "@/lib/brand";
import staffLogo from "@assets/employee-logo.png";
import { useSystemMode } from "@/lib/system-mode";

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

// ── Direct top-level nav items — like Foodics: الملخص, الطلبات, العملاء ──
const TOP_ITEMS = (isAr: boolean) => [
  { label: isAr ? 'الملخص' : 'Overview', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: isAr ? 'الطلبات' : 'Orders', icon: ShoppingCart, path: '/manager/orders' },
  { label: isAr ? 'العملاء' : 'Customers', icon: Users, path: '/admin/customers' },
  { label: isAr ? 'نقطة البيع' : 'POS System', icon: CreditCard, path: '/employee/pos' },
];

// ── Collapsible groups — like Foodics ──
const NAV_GROUPS = (isAr: boolean, unreadCount: number) => [
  {
    key: 'reports',
    label: isAr ? 'التقارير' : 'Reports',
    icon: BarChart3,
    items: [
      { label: isAr ? 'داشبورد المدير' : 'Manager Dashboard', icon: LayoutDashboard, path: '/manager/dashboard' },
      { label: isAr ? 'الإحصائيات الدقيقة' : 'Statistics', icon: TrendingUp, path: '/manager/statistics' },
      { label: isAr ? 'تقارير المبيعات' : 'Sales Reports', icon: FileText, path: '/admin/reports' },
      { label: isAr ? 'سجل الدفعات' : 'Payment Logs', icon: Receipt, path: '/admin/payment-logs' },
    ],
  },
  {
    key: 'inventory',
    label: isAr ? 'المخزون' : 'Inventory',
    icon: Warehouse,
    items: [
      { label: isAr ? 'نظرة المخزون' : 'Inventory', icon: Warehouse, path: '/manager/inventory' },
      { label: isAr ? 'المواد الخام' : 'Raw Items', icon: Package, path: '/manager/inventory/raw-items' },
      { label: isAr ? 'المشتريات' : 'Purchases', icon: ClipboardList, path: '/manager/inventory/purchases' },
    ],
  },
  {
    key: 'menu',
    label: isAr ? 'قائمة المنتجات' : 'Products',
    icon: Coffee,
    items: [
      { label: isAr ? 'إدارة القائمة' : 'Menu Management', icon: Coffee, path: '/employee/menu-management' },
      { label: isAr ? 'الإضافات' : 'Product Addons', icon: Layers, path: '/admin/product-addons' },
      { label: isAr ? 'حجوزات الطاولات' : 'Table Reservations', icon: BookOpen, path: '/manager/reservations' },
      { label: isAr ? 'حجوزات المنتجات' : 'Product Reservations', icon: Star, path: '/manager/product-reservations' },
    ],
  },
  {
    key: 'management',
    label: isAr ? 'إدارة' : 'Management',
    icon: Settings,
    items: [
      { label: isAr ? 'الموظفون' : 'Employees', icon: UserCheck, path: '/admin/employees' },
      { label: isAr ? 'الفروع' : 'Branches', icon: GitBranch, path: '/admin/branches' },
      { label: isAr ? 'الإشعارات' : 'Notifications', icon: Bell, path: '/admin/notifications', badge: unreadCount > 0 ? unreadCount : undefined },
      { label: isAr ? 'الإعدادات' : 'Settings', icon: Settings, path: '/admin/settings' },
      { label: isAr ? 'البراندة' : 'Branding', icon: Palette, path: '/admin/branding' },
      { label: isAr ? 'الطباعة' : 'Printing', icon: Printer, path: '/admin/printing' },
      { label: isAr ? 'نشر التطبيق' : 'App Publishing', icon: Rocket, path: '/admin/app-publishing' },
    ],
  },
  {
    key: 'marketing',
    label: isAr ? 'التسويق' : 'Marketing',
    icon: Megaphone,
    items: [
      { label: isAr ? 'التسويق البريدي' : 'Email Marketing', icon: Mail, path: '/admin/email' },
      { label: isAr ? 'إدارة API' : 'API', icon: Code2, path: '/admin/api' },
    ],
  },
];

// ── One nav item button ──
function NavItemButton({
  label, icon: Icon, path, active, onClick, badge, indent = false
}: {
  label: string; icon: any; path: string; active: boolean;
  onClick: () => void; badge?: number; indent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      data-testid={`sidebar-link-${path.split('/').pop()}`}
      className={`relative w-full flex items-center gap-3 py-2.5 text-sm transition-all ${
        indent ? 'pr-9 pl-4' : 'px-4'
      } ${
        active
          ? 'bg-primary/8 text-primary font-semibold'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      }`}
    >
      {/* Active indicator — right edge (RTL sidebar) */}
      {active && <span className="absolute right-0 top-1.5 bottom-1.5 w-[3px] bg-primary rounded-l-full" />}
      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
      <span className="flex-1 text-right leading-tight">{label}</span>
      {badge ? (
        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </button>
  );
}

export function AdminSidebar({ mobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const [location, navigate] = useLocation();
  const { i18n } = useTranslation();
  const isAr = i18n.language !== 'en';
  const { isPOS } = useSystemMode();

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread-count'],
    refetchInterval: 30_000,
    retry: false,
  });
  const unreadCount = unreadData?.count ?? 0;

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    reports: true,
    inventory: false,
    menu: false,
    management: false,
    marketing: false,
  });

  const toggleGroup = (key: string) =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const handleNavigate = (path: string) => {
    navigate(path);
    onMobileClose?.();
  };

  const handleLogout = async () => {
    await fetch('/api/employees/logout', { method: 'POST' });
    localStorage.removeItem('qirox-restore-key');
    navigate('/employee/login');
  };

  const topItems = TOP_ITEMS(isAr);
  const groups = NAV_GROUPS(isAr, unreadCount);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-background border-l border-border" dir="rtl">

      {/* ── Brand header ── */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <img
            src={staffLogo}
            alt={brand.platformNameEn}
            className="w-8 h-8 object-contain rounded-xl"
          />
          <div className="min-w-0">
            <p className="text-sm font-black text-foreground leading-tight truncate">
              {isAr ? brand.platformNameAr : brand.platformNameEn}
            </p>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary text-primary-foreground leading-none">
              PRO
            </span>
          </div>
        </div>
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
          data-testid="button-sidebar-close"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-2">

        {/* Direct top-level items — in menu mode hide POS & orders */}
        <div className="mb-1">
          {topItems
            .filter(item => isPOS || !['نقطة البيع','POS System','الطلبات','Orders'].includes(item.label))
            .map(item => (
              <NavItemButton
                key={item.path}
                label={item.label}
                icon={item.icon}
                path={item.path}
                active={location === item.path || location.startsWith(item.path + '/')}
                onClick={() => handleNavigate(item.path)}
              />
            ))}
        </div>

        <div className="mx-4 my-1.5 border-t border-border" />

        {/* Collapsible groups — in menu mode only show menu & marketing */}
        {groups.filter(g => isPOS || ['menu', 'marketing', 'management'].includes(g.key)).map(group => {
          const isGroupExpanded = expanded[group.key];
          const GroupIcon = group.icon;
          const hasActiveChild = group.items.some(
            item => location === item.path || location.startsWith(item.path + '/')
          );

          return (
            <div key={group.key}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.key)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${
                  hasActiveChild && !isGroupExpanded
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <GroupIcon
                    className={`w-4 h-4 shrink-0 ${
                      hasActiveChild && !isGroupExpanded ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                  <span>{group.label}</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-muted-foreground/60 transition-transform duration-200 ${
                    isGroupExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Sub-items */}
              {isGroupExpanded && (
                <div className="pb-1">
                  {group.items.map(item => (
                    <NavItemButton
                      key={item.path}
                      label={item.label}
                      icon={item.icon}
                      path={item.path}
                      active={location === item.path}
                      onClick={() => handleNavigate(item.path)}
                      badge={(item as any).badge}
                      indent
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="mx-4 my-1.5 border-t border-border" />

        {/* Bottom direct items */}
        <NavItemButton
          label={isAr ? 'الرئيسية' : 'Home'}
          icon={Home}
          path="/employee/home"
          active={location === '/employee/home'}
          onClick={() => handleNavigate('/employee/home')}
        />
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-border pb-safe">
        <button
          onClick={() => handleNavigate('/manager/loyalty')}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
        >
          <Gift className="w-4 h-4" />
          <span className="flex-1 text-right">{isAr ? 'نقاط الولاء' : 'Loyalty'}</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
          <span className="flex-1 text-right">{isAr ? 'تسجيل الخروج' : 'Logout'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-56 flex-col h-screen sticky top-0 shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={onMobileClose}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="absolute right-0 top-0 bottom-0 w-60 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}

// Legacy named export kept for any older imports
export default AdminSidebar;
