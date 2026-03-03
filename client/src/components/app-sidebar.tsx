import { useUser, useLogout } from "@/hooks/use-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, FileText, Users, Wallet, Briefcase,
  LogIn, LogOut, Clock, Layers, DollarSign, Handshake, Image,
  Newspaper, Wrench, Globe, Cpu, ShoppingCart, Package, MessageSquare,
  BarChart3, Activity, LifeBuoy, Banknote, User, Receipt, CreditCard, FileCheck, ListChecks, Building2, Crown, Palette,
  CalendarCheck, Tag, Truck, Database, Smartphone, Settings2, Headphones, LayoutGrid, Moon, Sun, Video, Paintbrush, ClipboardList
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { NotificationBell } from "@/components/NotificationBell";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";

const MANAGEMENT_ROLES = ["admin", "manager"];
const FINANCE_ROLES = ["admin", "manager", "accountant"];
const SALES_ROLES = ["admin", "manager", "sales_manager", "sales"];

interface NavItem {
  title: string;
  icon: any;
  url: string;
  group: "public" | "client" | "employee" | "admin";
  allowedRoles?: string[];
}

export function AppSidebar() {
  const [location] = useLocation();
  const { data: user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, lang, setLang } = useI18n();

  const logoutMutation = useLogout();
  const { theme, toggle } = useTheme();
  const isEmployee = user && user.role !== "client";
  const isManagement = user && MANAGEMENT_ROLES.includes(user.role);

  const ar = lang === "ar";
  const items: NavItem[] = [
    // Public pages
    { title: ar ? "الرئيسية" : "Home", icon: Globe, url: "/", group: "public" },
    { title: ar ? "الباقات" : "Pricing", icon: DollarSign, url: "/prices", group: "public" },
    { title: ar ? "عن المنصة" : "About", icon: FileText, url: "/about", group: "public" },
    { title: ar ? "تواصل" : "Contact", icon: Briefcase, url: "/contact", group: "public" },

    // Client-only pages
    { title: ar ? "لوحة التحكم" : "Dashboard", icon: LayoutDashboard, url: "/dashboard", group: "client" },
    { title: ar ? "كيروكس إيدت 🎨" : "Qirox Edit 🎨", icon: Paintbrush, url: "/qirox-edit", group: "client" },
    { title: ar ? "الأجهزة والإضافات" : "Devices & Add-ons", icon: Cpu, url: "/devices", group: "client" },
    { title: ar ? "سلة التسوق" : "Cart", icon: ShoppingCart, url: "/cart", group: "client" },
    { title: ar ? "الرسائل" : "Messages", icon: MessageSquare, url: "/inbox", group: "client" },
    { title: ar ? "خدمة العملاء" : "Customer Service", icon: Headphones, url: "/cs-chat", group: "client" },
    { title: ar ? "الدعم الفني" : "Support", icon: LifeBuoy, url: "/support", group: "client" },
    { title: ar ? "سجل المدفوعات" : "Payment History", icon: Receipt, url: "/payment-history", group: "client" },
    { title: ar ? "محفظتي الإلكترونية" : "My Wallet", icon: Wallet, url: "/wallet", group: "client" },
    { title: ar ? "طلبات البيانات" : "Data Requests", icon: ClipboardList, url: "/my-requests", group: "client" },
    { title: ar ? "مجموعة العملاء" : "Clients Group", icon: Users, url: "/clients-group", group: "client" },

    // Employee pages
    { title: ar ? "لوحة التحكم" : "Dashboard", icon: LayoutDashboard, url: "/dashboard", group: "employee" },
    { title: ar ? "كيروكس إيدت 🎨" : "Qirox Edit 🎨", icon: Paintbrush, url: "/qirox-edit", group: "employee" },
    { title: ar ? "لوحتي المتخصصة" : "My Role Board", icon: BarChart3, url: "/employee/role-dashboard", group: "employee", allowedRoles: ["merchant", "developer", "designer", "accountant", "sales", "sales_manager"] },
    { title: ar ? "الطلبات" : "Orders", icon: FileText, url: "/admin/orders", group: "employee" },
    { title: ar ? "إنشاء عميل وطلب" : "New Client & Order", icon: Users, url: "/employee/new-order", group: "employee" },
    { title: ar ? "طلبات التعديل" : "Modification Requests", icon: Wrench, url: "/admin/mod-requests", group: "employee" },
    { title: ar ? "طلبات البيانات" : "Data Requests", icon: ClipboardList, url: "/admin/data-requests", group: "employee" },
    { title: ar ? "الرسائل" : "Messages", icon: MessageSquare, url: "/inbox", group: "employee" },
    { title: ar ? "خدمة العملاء" : "Customer Service", icon: Headphones, url: "/cs-chat", group: "employee", allowedRoles: ["support", "admin", "manager"] },
    { title: ar ? "ملفي الشخصي" : "My Profile", icon: User, url: "/employee/profile", group: "employee" },
    { title: ar ? "أدواتي ومهامي" : "My Tasks", icon: ListChecks, url: "/employee/checklist", group: "employee" },

    // Finance role pages
    { title: ar ? "المالية" : "Finance", icon: Wallet, url: "/admin/finance", group: "employee", allowedRoles: FINANCE_ROLES },
    { title: ar ? "محافظ العملاء" : "Client Wallets", icon: CreditCard, url: "/admin/wallet", group: "employee", allowedRoles: FINANCE_ROLES },
    { title: ar ? "الفواتير" : "Invoices", icon: FileText, url: "/admin/invoices", group: "employee", allowedRoles: FINANCE_ROLES },
    { title: ar ? "سندات القبض" : "Receipts", icon: FileCheck, url: "/admin/receipts", group: "employee", allowedRoles: FINANCE_ROLES },
    { title: ar ? "كشف الرواتب" : "Payroll", icon: Banknote, url: "/admin/payroll", group: "employee", allowedRoles: FINANCE_ROLES },

    // Sales role pages
    { title: ar ? "العملاء" : "Clients", icon: Users, url: "/admin/customers", group: "employee", allowedRoles: SALES_ROLES },
    { title: ar ? "أدوات التسويق" : "Marketing Tools", icon: Palette, url: "/sales/marketing", group: "employee", allowedRoles: SALES_ROLES },

    // Management-only pages
    { title: ar ? "لوحة الإدارة" : "Admin Panel", icon: LayoutDashboard, url: "/admin", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "التحليلات المتقدمة" : "Analytics", icon: BarChart3, url: "/admin/analytics", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "القوالب" : "Templates", icon: Layers, url: "/admin/templates", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "الخدمات" : "Services", icon: Briefcase, url: "/admin/services", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "المنتجات والأجهزة" : "Products & Devices", icon: Package, url: "/admin/products", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "الاستشارات" : "Consultations", icon: CalendarCheck, url: "/admin/consultations", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: "QMeet", icon: Video, url: "/admin/qmeet", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "كودات الخصم" : "Discount Codes", icon: Tag, url: "/admin/discount-codes", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "الشحنات" : "Shipments", icon: Truck, url: "/admin/shipments", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: "MongoDB Atlas", icon: Database, url: "/admin/atlas", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: "Cron Jobs", icon: Clock, url: "/admin/cron-jobs", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "نشر التطبيقات" : "App Publishing", icon: Smartphone, url: "/admin/app-publish", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "مميزات الباقات" : "Plan Features", icon: Settings2, url: "/admin/system-features", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "المميزات الإضافية" : "Extra Add-ons", icon: Tag, url: "/admin/extra-addons", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "حصص التعديل" : "Modification Quotas", icon: Wrench, url: "/admin/mod-config", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "مميزات المشاريع" : "Project Features", icon: LayoutGrid, url: "/admin/project-features", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "الموظفون" : "Employees", icon: Users, url: "/admin/employees", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "الرواتب" : "Payroll", icon: Banknote, url: "/admin/payroll", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "الفواتير" : "Invoices", icon: FileText, url: "/admin/invoices", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "سندات القبض" : "Receipts", icon: FileCheck, url: "/admin/receipts", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "تذاكر الدعم" : "Support Tickets", icon: LifeBuoy, url: "/admin/support-tickets", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "سجل النشاط" : "Activity Log", icon: Activity, url: "/admin/activity-log", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "الشركاء" : "Partners", icon: Handshake, url: "/admin/partners", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "الأخبار" : "News", icon: Newspaper, url: "/admin/news", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "الوظائف" : "Jobs", icon: Briefcase, url: "/admin/jobs", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "إعدادات البنك" : "Bank Settings", icon: Building2, url: "/admin/bank-settings", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "الاشتراكات والأسعار" : "Subscriptions & Pricing", icon: Crown, url: "/admin/subscription-plans", group: "admin", allowedRoles: MANAGEMENT_ROLES },
  ];

  const { data: attendanceStatus } = useQuery({
    queryKey: ["/api/attendance/status"],
    enabled: !!user && user.role !== "client",
  }) as { data: { checkIn?: string; checkOut?: string } | null };

  const { data: badges } = useQuery<{ messages: number; tickets: number; orders: number; total: number }>({
    queryKey: ["/api/badges"],
    enabled: !!user,
    refetchInterval: 30000,
  });

  function getBadge(url: string): number {
    if (!badges) return 0;
    if (url === "/inbox") return badges.messages;
    if (url === "/support" || url === "/admin/support-tickets") return badges.tickets;
    if (url === "/admin/orders" || url === "/dashboard") return badges.orders;
    return 0;
  }

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipAddress: "fetching...", location: { lat: 0, lng: 0 } }),
      });
      if (!res.ok) throw new Error("Check-in failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/status"] });
      toast({ title: "تم تسجيل الحضور" });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/attendance/check-out", { method: "POST" });
      if (!res.ok) throw new Error("Check-out failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/status"] });
      toast({ title: "تم تسجيل الانصراف" });
    },
  });

  const menuItems = items.filter((item) => {
    if (!user) return item.group === "public";

    if (user.role === "client") {
      return item.group === "public" || item.group === "client";
    }

    // For non-client (employee/admin) users:
    // Skip public and client groups
    if (item.group === "public" || item.group === "client") return false;

    // Check allowedRoles if specified
    if (item.allowedRoles) {
      return item.allowedRoles.includes(user.role);
    }

    // "employee" group: visible to ALL non-client roles
    if (item.group === "employee") return true;

    // "admin" group without allowedRoles: management only
    if (item.group === "admin") return isManagement;

    return false;
  });

  // Determine group labels
  const employeeItems = menuItems.filter(i => i.group === "employee");
  const adminItems = menuItems.filter(i => i.group === "admin");

  return (
    <Sidebar side={lang === "ar" ? "right" : "left"} className={`bg-white dark:bg-gray-950 ${lang === "ar" ? "border-l" : "border-r"} border-black/[0.06] dark:border-white/[0.06]`}>
      <SidebarHeader className="p-4 border-b border-black/[0.06]">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src={qiroxLogoPath} alt="QIROX" className="h-6 w-auto object-contain dark:invert" />
          </Link>
          {user && <NotificationBell />}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Employee / Client menu items */}
        {menuItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[10px] font-semibold text-black/25 uppercase tracking-[3px] mb-2">
              {!user ? (ar ? "القائمة" : "Menu") : isEmployee ? (ar ? "عملي" : "My Work") : (ar ? "لوحتي" : "My Panel")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {(employeeItems.length > 0 ? employeeItems : menuItems).map((item) => {
                    const badge = getBadge(item.url);
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton
                          asChild
                          isActive={location === item.url}
                          tooltip={item.title}
                          className="px-4 py-2 hover:bg-black/[0.04] transition-colors rounded-xl"
                        >
                          <Link href={item.url} className="flex items-center gap-3 w-full">
                            <div className="relative">
                              <item.icon className="w-4 h-4 text-black/30" />
                              {badge > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center">
                                  {badge > 9 ? "9+" : badge}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-medium text-black/60 flex-1">{item.title}</span>
                            {badge > 0 && (
                              <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">{badge}</span>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })
                }
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Management-only section */}
        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[10px] font-semibold text-black/25 uppercase tracking-[3px] mb-2">
              {ar ? "إدارة النظام" : "System Admin"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => {
                  const badge = getBadge(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url}
                        tooltip={item.title}
                        className="px-4 py-2 hover:bg-black/[0.04] transition-colors rounded-xl"
                      >
                        <Link href={item.url} className="flex items-center gap-3 w-full">
                          <div className="relative">
                            <item.icon className="w-4 h-4 text-black/30" />
                            {badge > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center">
                                {badge > 9 ? "9+" : badge}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-black/60 flex-1">{item.title}</span>
                          {badge > 0 && (
                            <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">{badge}</span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Attendance (all employees) */}
        {user && user.role !== "client" && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[10px] font-semibold text-black/25 dark:text-white/25 uppercase tracking-[3px] mb-2">
              {ar ? "الحضور" : "Attendance"}
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-4 pb-4">
              {!attendanceStatus || attendanceStatus.checkOut ? (
                <SidebarMenuButton
                  onClick={() => checkInMutation.mutate()}
                  className="w-full premium-btn justify-center gap-2 rounded-xl transition-colors"
                  disabled={checkInMutation.isPending}
                  data-testid="sidebar-check-in"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{ar ? "تسجيل حضور" : "Check In"}</span>
                </SidebarMenuButton>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-[10px] text-black/35 dark:text-white/35 bg-black/[0.03] dark:bg-white/[0.05] p-2 rounded-xl border border-black/[0.06] dark:border-white/[0.08]">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(attendanceStatus.checkIn || "").toLocaleTimeString(ar ? "ar-SA" : "en-US")}</span>
                  </div>
                  <SidebarMenuButton
                    onClick={() => checkOutMutation.mutate()}
                    className="w-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-black dark:text-white justify-center gap-2 rounded-xl transition-colors"
                    disabled={checkOutMutation.isPending}
                    data-testid="sidebar-check-out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{ar ? "تسجيل انصراف" : "Check Out"}</span>
                  </SidebarMenuButton>
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-black/[0.06] dark:border-white/[0.06] space-y-2">
        {/* Theme + Lang toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            title={ar ? (theme === "dark" ? "وضع نهاري" : "وضع ليلي") : (theme === "dark" ? "Light mode" : "Dark mode")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-black/60 dark:text-white/60 border border-black/[0.06] dark:border-white/[0.08] transition-all"
            data-testid="sidebar-theme-toggle"
          >
            {theme === "dark"
              ? <><Sun className="w-3.5 h-3.5 text-yellow-400" /><span>{ar ? "نهاري" : "Light"}</span></>
              : <><Moon className="w-3.5 h-3.5" /><span>{ar ? "ليلي" : "Dark"}</span></>}
          </button>
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            title={ar ? "English" : "عربي"}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-black/60 dark:text-white/60 border border-black/[0.06] dark:border-white/[0.08] transition-all"
            data-testid="sidebar-lang-toggle"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{ar ? "EN" : "ع"}</span>
          </button>
        </div>

        {user ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-black dark:bg-white text-white dark:text-black shrink-0">
                {user.fullName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-black dark:text-white">{user.fullName}</p>
                <p className="text-[10px] text-black/25 dark:text-white/25 truncate">{user.role}</p>
              </div>
            </div>
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="sidebar-logout"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 border border-red-100 dark:border-red-800/30 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{ar ? "تسجيل خروج" : "Sign out"}</span>
            </button>
          </div>
        ) : (
          <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2 border-black/[0.08] dark:border-white/[0.08] text-black/50 dark:text-white/50 rounded-xl bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.03]">
            <Link href="/login">
              <LogIn className="w-4 h-4" />
              <span>{ar ? "دخول" : "Sign in"}</span>
            </Link>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
