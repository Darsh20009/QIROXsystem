import { useUser } from "@/hooks/use-auth";
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
  BarChart3, Activity, LifeBuoy, Banknote, User, Receipt, CreditCard, FileCheck, ListChecks, Building2
} from "lucide-react";
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
  const { t } = useI18n();

  const isEmployee = user && user.role !== "client";
  const isManagement = user && MANAGEMENT_ROLES.includes(user.role);

  const items: NavItem[] = [
    // Public pages
    { title: "الرئيسية", icon: Globe, url: "/", group: "public" },
    { title: "الخدمات", icon: Briefcase, url: "/services", group: "public" },
    { title: "الباقات", icon: DollarSign, url: "/prices", group: "public" },
    { title: "المعرض", icon: Image, url: "/portfolio", group: "public" },
    { title: "عن المنصة", icon: FileText, url: "/about", group: "public" },
    { title: "تواصل", icon: Briefcase, url: "/contact", group: "public" },

    // Client-only pages
    { title: "لوحة التحكم", icon: LayoutDashboard, url: "/dashboard", group: "client" },
    { title: "الأجهزة والإضافات", icon: Cpu, url: "/devices", group: "client" },
    { title: "سلة التسوق", icon: ShoppingCart, url: "/cart", group: "client" },
    { title: "الرسائل", icon: MessageSquare, url: "/inbox", group: "client" },
    { title: "الدعم الفني", icon: LifeBuoy, url: "/support", group: "client" },
    { title: "سجل المدفوعات", icon: Receipt, url: "/payment-history", group: "client" },

    // Employee pages (visible to ALL non-client roles)
    { title: "لوحة التحكم", icon: LayoutDashboard, url: "/dashboard", group: "employee" },
    { title: "الطلبات", icon: FileText, url: "/admin/orders", group: "employee" },
    { title: "إنشاء عميل وطلب", icon: Users, url: "/employee/new-order", group: "employee" },
    { title: "طلبات التعديل", icon: Wrench, url: "/admin/mod-requests", group: "employee" },
    { title: "الرسائل", icon: MessageSquare, url: "/inbox", group: "employee" },
    { title: "ملفي الشخصي", icon: User, url: "/employee/profile", group: "employee" },
    { title: "أدواتي ومهامي", icon: ListChecks, url: "/employee/checklist", group: "employee" },

    // Finance role pages
    { title: "المالية", icon: Wallet, url: "/admin/finance", group: "employee", allowedRoles: FINANCE_ROLES },
    { title: "الفواتير", icon: FileText, url: "/admin/invoices", group: "employee", allowedRoles: FINANCE_ROLES },
    { title: "سندات القبض", icon: FileCheck, url: "/admin/receipts", group: "employee", allowedRoles: FINANCE_ROLES },
    { title: "كشف الرواتب", icon: Banknote, url: "/admin/payroll", group: "employee", allowedRoles: FINANCE_ROLES },

    // Sales role pages
    { title: "العملاء", icon: Users, url: "/admin/customers", group: "employee", allowedRoles: SALES_ROLES },

    // Management-only pages
    { title: "لوحة الإدارة", icon: LayoutDashboard, url: "/admin", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: "التحليلات المتقدمة", icon: BarChart3, url: "/admin/analytics", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: "القوالب", icon: Layers, url: "/admin/templates", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: "الخدمات", icon: Briefcase, url: "/admin/services", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: "المنتجات والأجهزة", icon: Package, url: "/admin/products", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: "الموظفون", icon: Users, url: "/admin/employees", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: "الرواتب", icon: Banknote, url: "/admin/payroll", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: "الفواتير", icon: FileText, url: "/admin/invoices", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: "سندات القبض", icon: FileCheck, url: "/admin/receipts", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: "تذاكر الدعم", icon: LifeBuoy, url: "/admin/support-tickets", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: "سجل النشاط", icon: Activity, url: "/admin/activity-log", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: "الشركاء", icon: Handshake, url: "/admin/partners", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: "الأخبار", icon: Newspaper, url: "/admin/news", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: "الوظائف", icon: Briefcase, url: "/admin/jobs", group: "admin", allowedRoles: MANAGEMENT_ROLES },
    { title: "إعدادات البنك", icon: Building2, url: "/admin/bank-settings", group: "admin", allowedRoles: MANAGEMENT_ROLES },
  ];

  const { data: attendanceStatus } = useQuery({
    queryKey: ["/api/attendance/status"],
    enabled: !!user && user.role !== "client",
  }) as { data: { checkIn?: string; checkOut?: string } | null };

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
    <Sidebar side="right" className="bg-white border-l border-black/[0.06]">
      <SidebarHeader className="p-4 border-b border-black/[0.06]">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src={qiroxLogoPath} alt="QIROX" className="h-6 w-auto object-contain" />
          </Link>
          {user && <NotificationBell />}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Employee / Client menu items */}
        {menuItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[10px] font-semibold text-black/25 uppercase tracking-[3px] mb-2">
              {!user ? "القائمة" : isEmployee ? "عملي" : "لوحتي"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {employeeItems.length > 0
                  ? employeeItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url}
                        tooltip={item.title}
                        className="px-4 py-2 hover:bg-black/[0.04] transition-colors rounded-xl"
                      >
                        <Link href={item.url} className="flex items-center gap-3 w-full">
                          <item.icon className="w-4 h-4 text-black/30" />
                          <span className="text-sm font-medium text-black/60">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                  : menuItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url}
                        tooltip={item.title}
                        className="px-4 py-2 hover:bg-black/[0.04] transition-colors rounded-xl"
                      >
                        <Link href={item.url} className="flex items-center gap-3 w-full">
                          <item.icon className="w-4 h-4 text-black/30" />
                          <span className="text-sm font-medium text-black/60">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                }
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Management-only section */}
        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[10px] font-semibold text-black/25 uppercase tracking-[3px] mb-2">
              إدارة النظام
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      tooltip={item.title}
                      className="px-4 py-2 hover:bg-black/[0.04] transition-colors rounded-xl"
                    >
                      <Link href={item.url} className="flex items-center gap-3 w-full">
                        <item.icon className="w-4 h-4 text-black/30" />
                        <span className="text-sm font-medium text-black/60">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Attendance (all employees) */}
        {user && user.role !== "client" && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[10px] font-semibold text-black/25 uppercase tracking-[3px] mb-2">
              الحضور
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
                  <span>تسجيل حضور</span>
                </SidebarMenuButton>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-[10px] text-black/35 bg-black/[0.03] p-2 rounded-xl border border-black/[0.06]">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(attendanceStatus.checkIn || "").toLocaleTimeString("ar-SA")}</span>
                  </div>
                  <SidebarMenuButton
                    onClick={() => checkOutMutation.mutate()}
                    className="w-full bg-black/[0.04] hover:bg-black/[0.08] text-black justify-center gap-2 rounded-xl transition-colors"
                    disabled={checkOutMutation.isPending}
                    data-testid="sidebar-check-out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>تسجيل انصراف</span>
                  </SidebarMenuButton>
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-black/[0.06]">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-black text-white shrink-0">
              {user.fullName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-black">{user.fullName}</p>
              <p className="text-[10px] text-black/25 truncate">{user.role}</p>
            </div>
          </div>
        ) : (
          <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2 border-black/[0.08] text-black/50 rounded-xl bg-transparent hover:bg-black/[0.03]">
            <Link href="/login">
              <LogIn className="w-4 h-4" />
              <span>دخول</span>
            </Link>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
