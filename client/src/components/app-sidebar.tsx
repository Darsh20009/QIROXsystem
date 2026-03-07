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
  CalendarCheck, Tag, Truck, Database, Smartphone, Settings2, Headphones, LayoutGrid, Moon, Sun, Video, Paintbrush, ClipboardList, Wand2,
  TrendingUp, Shield, Bell
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { NotificationBell } from "@/components/NotificationBell";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";
import { SiInstagram, SiX, SiLinkedin, SiSnapchat, SiYoutube, SiTiktok, SiWhatsapp } from "react-icons/si";

const MANAGEMENT_ROLES = ["admin", "manager"];
const STAFF_ROLES = ["admin", "manager", "developer", "designer", "support", "sales_manager", "sales", "accountant", "merchant"];
const FINANCE_ROLES = ["admin", "manager", "accountant"];
const SALES_ROLES = ["admin", "manager", "sales_manager", "sales"];

interface NavItem {
  title: string;
  icon: any;
  url: string;
  group: "public" | "client" | "employee" | "admin";
  allowedRoles?: string[];
  section?: string;
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
    { title: ar ? "الرئيسية" : "Home", icon: Globe, url: "/", group: "public", section: "main" },
    { title: ar ? "الباقات" : "Pricing", icon: DollarSign, url: "/prices", group: "public", section: "main" },
    { title: ar ? "عن المنصة" : "About", icon: FileText, url: "/about", group: "public", section: "main" },
    { title: ar ? "تواصل" : "Contact", icon: Briefcase, url: "/contact", group: "public", section: "main" },

    // Client — main
    { title: ar ? "لوحة التحكم" : "Dashboard", icon: LayoutDashboard, url: "/dashboard", group: "client", section: "main" },
    // Client — shopping
    { title: ar ? "الأجهزة والإضافات" : "Devices & Add-ons", icon: Cpu, url: "/devices", group: "client", section: "shopping" },
    { title: ar ? "سلة التسوق" : "Cart", icon: ShoppingCart, url: "/cart", group: "client", section: "shopping" },
    // Client — services
    { title: ar ? "الرسائل" : "Messages", icon: MessageSquare, url: "/inbox", group: "client", section: "services" },
    { title: ar ? "خدمة العملاء" : "Customer Service", icon: Headphones, url: "/cs-chat", group: "client", section: "services" },
    { title: ar ? "الدعم الفني" : "Support", icon: LifeBuoy, url: "/support", group: "client", section: "services" },
    { title: ar ? "تذكيرني قبل انتهاء اشتراكي" : "Renewal Reminder", icon: Bell, url: "/switch-reminder", group: "client", section: "services" },
    // Client — account
    { title: ar ? "سجل المدفوعات" : "Payment History", icon: Receipt, url: "/payment-history", group: "client", section: "account" },
    { title: ar ? "محفظتي الإلكترونية" : "My Wallet", icon: Wallet, url: "/wallet", group: "client", section: "account" },
    { title: ar ? "أقساطي" : "My Installments", icon: Banknote, url: "/installments", group: "client", section: "account" },
    { title: ar ? "طلبات البيانات" : "Data Requests", icon: ClipboardList, url: "/my-requests", group: "client", section: "account" },
    { title: ar ? "مجموعة العملاء" : "Clients Group", icon: Users, url: "/clients-group", group: "client", section: "account" },
    // Client — tools
    { title: ar ? "أدواتي ومميزاتي ⚡" : "My Tools ⚡", icon: Wand2, url: "/my-tools", group: "client", section: "tools" },
    { title: ar ? "ملفي الشخصي" : "My Profile", icon: User, url: "/profile", group: "client", section: "tools" },
    // Client — investor
    { title: ar ? "بوابة المستثمر" : "Investor Portal", icon: TrendingUp, url: "/investor/portal", group: "client", section: "investor", allowedRoles: ["investor", "admin", "manager"] },

    // Employee — main
    { title: ar ? "لوحة التحكم" : "Dashboard", icon: LayoutDashboard, url: "/dashboard", group: "employee", section: "main" },
    { title: ar ? "لوحتي المتخصصة" : "My Role Board", icon: BarChart3, url: "/employee/role-dashboard", group: "employee", section: "main", allowedRoles: ["merchant", "developer", "designer", "accountant", "sales", "sales_manager"] },
    // Employee — Qirox services
    { title: ar ? "الطلبات" : "Orders", icon: FileText, url: "/admin/orders", group: "employee", section: "services" },
    { title: ar ? "إنشاء عميل وطلب" : "New Client & Order", icon: Users, url: "/employee/new-order", group: "employee", section: "services" },
    { title: ar ? "طلبات التعديل" : "Modification Requests", icon: Wrench, url: "/admin/mod-requests", group: "employee", section: "services" },
    { title: ar ? "طلبات البيانات" : "Data Requests", icon: ClipboardList, url: "/admin/data-requests", group: "employee", section: "services" },
    // Employee — communication
    { title: ar ? "الرسائل" : "Messages", icon: MessageSquare, url: "/inbox", group: "employee", section: "communication" },
    { title: ar ? "خدمة العملاء" : "Customer Service", icon: Headphones, url: "/cs-chat", group: "employee", section: "communication", allowedRoles: ["support", "admin", "manager"] },
    // Employee — finance
    { title: ar ? "المالية" : "Finance", icon: Wallet, url: "/admin/finance", group: "employee", section: "finance", allowedRoles: FINANCE_ROLES },
    { title: ar ? "محافظ العملاء" : "Client Wallets", icon: CreditCard, url: "/admin/wallet", group: "employee", section: "finance", allowedRoles: FINANCE_ROLES },
    { title: ar ? "الفواتير" : "Invoices", icon: FileText, url: "/admin/invoices", group: "employee", section: "finance", allowedRoles: FINANCE_ROLES },
    { title: ar ? "سندات القبض" : "Receipts", icon: FileCheck, url: "/admin/receipts", group: "employee", section: "finance", allowedRoles: FINANCE_ROLES },
    { title: ar ? "كشف الرواتب" : "Payroll", icon: Banknote, url: "/admin/payroll", group: "employee", section: "finance", allowedRoles: FINANCE_ROLES },
    { title: ar ? "التقسيط" : "Installments", icon: DollarSign, url: "/admin/installments", group: "employee", section: "finance", allowedRoles: STAFF_ROLES },
    // Employee — sales
    { title: ar ? "العملاء" : "Clients", icon: Users, url: "/admin/customers", group: "employee", section: "sales", allowedRoles: SALES_ROLES },
    { title: ar ? "أدوات التسويق" : "Marketing Tools", icon: Palette, url: "/sales/marketing", group: "employee", section: "sales", allowedRoles: SALES_ROLES },
    // Employee — tools
    { title: ar ? "أدواتي ومهامي" : "My Tasks", icon: ListChecks, url: "/employee/checklist", group: "employee", section: "tools" },
    { title: ar ? "أدواتي ومميزاتي ⚡" : "My Tools ⚡", icon: Wand2, url: "/my-tools", group: "employee", section: "tools" },
    // Employee — personal
    { title: ar ? "ملفي الشخصي" : "My Profile", icon: User, url: "/employee/profile", group: "employee", section: "personal" },
    { title: ar ? "بوابة المستثمر" : "Investor Portal", icon: TrendingUp, url: "/investor/portal", group: "employee", section: "personal", allowedRoles: ["investor", "admin", "manager"] },

    // Admin — main
    { title: ar ? "لوحة الإدارة" : "Admin Panel", icon: LayoutDashboard, url: "/admin", group: "admin", section: "main", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "التحليلات المتقدمة" : "Analytics", icon: BarChart3, url: "/admin/analytics", group: "admin", section: "main", allowedRoles: MANAGEMENT_ROLES },
    // Admin — operations (Qirox services management)
    { title: ar ? "القوالب" : "Templates", icon: Layers, url: "/admin/templates", group: "admin", section: "operations", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "الخدمات" : "Services", icon: Briefcase, url: "/admin/services", group: "admin", section: "operations", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "المنتجات والأجهزة" : "Products & Devices", icon: Package, url: "/admin/products", group: "admin", section: "operations", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "شركات الشحن" : "Shipping Companies", icon: Truck, url: "/admin/shipping", group: "admin", section: "operations", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "إدارة الدول" : "Countries", icon: Globe, url: "/admin/countries", group: "admin", section: "operations", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "الاستشارات" : "Consultations", icon: CalendarCheck, url: "/admin/consultations", group: "admin", section: "operations", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "تذكيرات التحويل" : "Switch Reminders", icon: Bell, url: "/admin/switch-reminders", group: "admin", section: "operations", allowedRoles: MANAGEMENT_ROLES },
    { title: "QMeet", icon: Video, url: "/admin/qmeet", group: "admin", section: "operations", allowedRoles: STAFF_ROLES },
    { title: ar ? "كودات الخصم" : "Discount Codes", icon: Tag, url: "/admin/discount-codes", group: "admin", section: "operations", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "الشحنات" : "Shipments", icon: Truck, url: "/admin/shipments", group: "admin", section: "operations", allowedRoles: MANAGEMENT_ROLES },
    // Admin — team
    { title: ar ? "الموظفون" : "Employees", icon: Users, url: "/admin/employees", group: "admin", section: "team", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "الترقيات والأدوار" : "Promotions & Roles", icon: Shield, url: "/admin/promotions", group: "admin", section: "team", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "تذاكر الدعم" : "Support Tickets", icon: LifeBuoy, url: "/admin/support-tickets", group: "admin", section: "team", allowedRoles: MANAGEMENT_ROLES },
    // Admin — finance
    { title: ar ? "الفواتير" : "Invoices", icon: FileText, url: "/admin/invoices", group: "admin", section: "finance", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "سندات القبض" : "Receipts", icon: FileCheck, url: "/admin/receipts", group: "admin", section: "finance", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "الرواتب" : "Payroll", icon: Banknote, url: "/admin/payroll", group: "admin", section: "finance", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "الاشتراكات والأسعار" : "Subscriptions & Pricing", icon: Crown, url: "/admin/subscription-plans", group: "admin", section: "finance", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "إعدادات البنك" : "Bank Settings", icon: Building2, url: "/admin/bank-settings", group: "admin", section: "finance", allowedRoles: MANAGEMENT_ROLES },
    // Admin — settings
    { title: ar ? "مميزات الباقات" : "Plan Features", icon: Settings2, url: "/admin/system-features", group: "admin", section: "settings", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "المميزات الإضافية" : "Extra Add-ons", icon: Tag, url: "/admin/extra-addons", group: "admin", section: "settings", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "حصص التعديل" : "Modification Quotas", icon: Wrench, url: "/admin/mod-config", group: "admin", section: "settings", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "مميزات المشاريع" : "Project Features", icon: LayoutGrid, url: "/admin/project-features", group: "admin", section: "settings", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "إعدادات النظام" : "System Settings", icon: Settings2, url: "/admin/qirox-settings", group: "admin", section: "settings", allowedRoles: MANAGEMENT_ROLES },
    // Admin — public content
    { title: ar ? "الشركاء" : "Partners", icon: Handshake, url: "/admin/partners", group: "admin", section: "content", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "الأخبار" : "News", icon: Newspaper, url: "/admin/news", group: "admin", section: "content", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "الوظائف" : "Jobs", icon: Briefcase, url: "/admin/jobs", group: "admin", section: "content", allowedRoles: MANAGEMENT_ROLES },
    // Admin — devtools
    { title: "MongoDB Atlas", icon: Database, url: "/admin/atlas", group: "admin", section: "devtools", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "إعدادات الاتصال" : "Connection Settings", icon: Settings2, url: "/admin/connection-settings", group: "admin", section: "devtools", allowedRoles: ["admin"] },
    { title: "Cron Jobs", icon: Clock, url: "/admin/cron-jobs", group: "admin", section: "devtools", allowedRoles: MANAGEMENT_ROLES },
    { title: ar ? "نشر التطبيقات" : "App Publishing", icon: Smartphone, url: "/admin/app-publish", group: "admin", section: "devtools", allowedRoles: MANAGEMENT_ROLES },
    // Admin — monitoring
    { title: ar ? "سجل النشاط" : "Activity Log", icon: Activity, url: "/admin/activity-log", group: "admin", section: "monitoring", allowedRoles: MANAGEMENT_ROLES },
    // Admin — investors
    { title: ar ? "المستثمرون" : "Investors", icon: TrendingUp, url: "/admin/investors", group: "admin", section: "investors", allowedRoles: ["admin"] },
  ];

  const { data: attendanceStatus } = useQuery({
    queryKey: ["/api/attendance/status"],
    enabled: !!user && user.role !== "client",
  }) as { data: { checkIn?: string; checkOut?: string } | null };

  const { data: publicSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/public/settings"],
    staleTime: 5 * 60 * 1000,
  });

  const socialLinks = [
    { key: "instagram",  Icon: SiInstagram,  color: "#E1306C", darkColor: "#E1306C", label: "Instagram" },
    { key: "twitter",    Icon: SiX,          color: "#000000", darkColor: "#ffffff", label: "X" },
    { key: "linkedin",   Icon: SiLinkedin,   color: "#0077B5", darkColor: "#0e9fe6", label: "LinkedIn" },
    { key: "snapchat",   Icon: SiSnapchat,   color: "#FFFC00", darkColor: "#ffe600", label: "Snapchat" },
    { key: "tiktok",     Icon: SiTiktok,     color: "#010101", darkColor: "#ffffff", label: "TikTok" },
    { key: "youtube",    Icon: SiYoutube,    color: "#FF0000", darkColor: "#FF0000", label: "YouTube" },
    { key: "whatsapp",   Icon: SiWhatsapp,   color: "#25D366", darkColor: "#25D366", label: "WhatsApp" },
  ].filter(s => publicSettings?.[s.key]);

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

  const hasRole = (roles: string[]) => {
    return roles.includes(user?.role || "") || ((user as any)?.additionalRoles || []).some((r: string) => roles.includes(r));
  };

  const menuItems = items.filter((item) => {
    if (!user) return item.group === "public";

    if (user.role === "client") {
      if (item.group !== "public" && item.group !== "client") return false;
      // Respect allowedRoles even for client-group items
      if (item.allowedRoles) return hasRole(item.allowedRoles);
      return true;
    }

    // For non-client (employee/admin) users:
    // Skip public and client groups
    if (item.group === "public" || item.group === "client") return false;

    // Check allowedRoles if specified (also check additionalRoles)
    if (item.allowedRoles) {
      return hasRole(item.allowedRoles);
    }

    // "employee" group: visible to ALL non-client roles
    if (item.group === "employee") return true;

    // "admin" group without allowedRoles: management only
    if (item.group === "admin") return isManagement;

    return false;
  });

  const employeeItems = menuItems.filter(i => i.group === "employee");
  const adminItems = menuItems.filter(i => i.group === "admin");
  const clientItems = menuItems.filter(i => i.group === "client" || i.group === "public");

  const SECTION_LABELS: Record<string, { ar: string; en: string; accent: string }> = {
    main:          { ar: "",               en: "",                    accent: "" },
    shopping:      { ar: "التسوق",         en: "Shopping",            accent: "text-cyan-600 dark:text-cyan-400" },
    services:      { ar: "خدمات كيروكس",  en: "Qirox Services",      accent: "text-[#06b6d4] dark:text-cyan-400" },
    communication: { ar: "التواصل",        en: "Communication",       accent: "text-green-600 dark:text-green-400" },
    account:       { ar: "حسابي",          en: "My Account",          accent: "text-violet-600 dark:text-violet-400" },
    finance:       { ar: "المالية",        en: "Finance",             accent: "text-amber-600 dark:text-amber-400" },
    sales:         { ar: "المبيعات",       en: "Sales",               accent: "text-pink-600 dark:text-pink-400" },
    tools:         { ar: "الأدوات",        en: "Tools",               accent: "text-blue-600 dark:text-blue-400" },
    personal:      { ar: "حسابي",          en: "My Account",          accent: "text-violet-600 dark:text-violet-400" },
    investor:      { ar: "الاستثمار",      en: "Investment",          accent: "text-emerald-600 dark:text-emerald-400" },
    operations:    { ar: "خدمات كيروكس",  en: "Qirox Services",      accent: "text-[#06b6d4] dark:text-cyan-400" },
    team:          { ar: "الفريق",         en: "Team",                accent: "text-indigo-600 dark:text-indigo-400" },
    settings:      { ar: "الإعدادات",      en: "Settings",            accent: "text-gray-600 dark:text-gray-400" },
    content:       { ar: "المحتوى العام",  en: "Public Content",      accent: "text-orange-600 dark:text-orange-400" },
    devtools:      { ar: "أدوات النظام",   en: "Dev Tools",           accent: "text-rose-600 dark:text-rose-400" },
    monitoring:    { ar: "المراقبة",       en: "Monitoring",          accent: "text-teal-600 dark:text-teal-400" },
    investors:     { ar: "الاستثمار",      en: "Investment",          accent: "text-emerald-600 dark:text-emerald-400" },
  };

  function renderNavItem(item: NavItem) {
    const badge = getBadge(item.url);
    const isActive = location === item.url;
    return (
      <SidebarMenuItem key={item.url + item.group}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={item.title}
          className={`px-3 py-2 transition-colors rounded-xl ${isActive ? "bg-black/[0.06] dark:bg-white/[0.07]" : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"}`}
        >
          <Link href={item.url} className="flex items-center gap-3 w-full">
            <div className="relative shrink-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isActive ? "bg-[#0f172a] dark:bg-white" : "bg-black/[0.04] dark:bg-white/[0.06]"}`}>
                <item.icon className={`w-3.5 h-3.5 ${isActive ? "text-white dark:text-black" : "text-black/40 dark:text-white/40"}`} />
              </div>
              {badge > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </div>
            <span className={`text-sm flex-1 truncate ${isActive ? "font-bold text-black dark:text-white" : "font-medium text-black/55 dark:text-white/50"}`}>{item.title}</span>
            {badge > 0 && (
              <span className="text-[9px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">{badge}</span>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  function renderSectionedItems(items: NavItem[]) {
    const sections = Array.from(new Set(items.map(i => i.section || "main")));
    return sections.map((sectionKey) => {
      const sectionItems = items.filter(i => (i.section || "main") === sectionKey);
      if (sectionItems.length === 0) return null;
      const label = SECTION_LABELS[sectionKey];
      const labelText = label ? (ar ? label.ar : label.en) : "";
      return (
        <div key={sectionKey}>
          {labelText && (
            <div className="px-4 pt-4 pb-1 flex items-center gap-2">
              <span className={`text-[9px] font-black uppercase tracking-[2px] ${label?.accent || "text-black/25 dark:text-white/25"}`}>
                {labelText}
              </span>
              <div className="flex-1 h-px bg-black/[0.05] dark:bg-white/[0.05]" />
            </div>
          )}
          {sectionItems.map(renderNavItem)}
        </div>
      );
    });
  }

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
        {/* Client / Public menu */}
        {(clientItems.length > 0 && !isEmployee) && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderSectionedItems(clientItems)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Employee menu */}
        {employeeItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderSectionedItems(employeeItems)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin / Management section */}
        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 pt-4 text-[9px] font-black text-black/20 dark:text-white/20 uppercase tracking-[3px] flex items-center gap-2">
              <span>{ar ? "إدارة النظام" : "System Admin"}</span>
              <div className="flex-1 h-px bg-black/[0.05] dark:bg-white/[0.05]" />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderSectionedItems(adminItems)}
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
        {/* Social Media Links */}
        {socialLinks.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 flex-wrap py-1">
            {socialLinks.map(({ key, Icon, color, darkColor, label }) => {
              const url = publicSettings?.[key] || "";
              const href = key === "whatsapp"
                ? `https://wa.me/${url.replace(/[^0-9]/g, "")}`
                : url.startsWith("http") ? url : `https://${url}`;
              return (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  data-testid={`sidebar-social-${key}`}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] transition-colors"
                  style={{ color: theme === "dark" ? darkColor : color }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              );
            })}
          </div>
        )}

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
