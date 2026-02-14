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
  LayoutDashboard,
  CheckCircle2,
  ListTodo,
  FileText,
  Link2,
  MessageSquare,
  Receipt,
  CreditCard,
  FileSignature,
  ShieldCheck,
  Bell,
  Download,
  Settings,
  Users,
  Wallet,
  Briefcase,
  LogIn,
  LogOut,
  Clock,
  LayoutGrid,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "./logo";

const items = [
  { title: "Home", icon: LayoutDashboard, url: "/" },
  { title: "Qirox Engines", icon: LayoutGrid, url: "/segments" },
  { title: "Services", icon: Briefcase, url: "/services" },
  { title: "Projects", icon: LayoutDashboard, url: "/dashboard" },
  { title: "About", icon: FileText, url: "/about" },
  { title: "لوحة التحكم", icon: LayoutDashboard, url: "/admin" },
  { title: "إدارة الخدمات", icon: Briefcase, url: "/admin/services" },
  { title: "إدارة الطلبات", icon: FileText, url: "/admin/orders" },
  { title: "الإدارة المالية", icon: Wallet, url: "/admin/finance" },
  { title: "إدارة الموظفين", icon: Users, url: "/admin/employees" },
  { title: "الإعدادات", icon: Settings, url: "/admin/settings" },
];

import { QiroxLogo, QiroxIcon } from "./qirox-brand";

export function AppSidebar() {
  const [location] = useLocation();
  const { data: user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = user && user.role !== "client";

  const { data: attendanceStatus } = useQuery({
    queryKey: ["/api/attendance/status"],
    enabled: !!user && user.role !== "client",
  }) as { data: { checkIn?: string; checkOut?: string } | null };

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ipAddress: "fetching...",
          location: { lat: 0, lng: 0 },
        }),
      });
      if (!res.ok) throw new Error("Check-in failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/status"] });
      toast({ title: "تم تسجيل الدخول", description: "تم تبصيم الحضور بنجاح" });
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
      toast({ title: "تم تسجيل الخروج", description: "تم تبصيم الانصراف بنجاح" });
    },
  });

  const menuItems = items.filter(item => {
    // If not logged in, only show basic public items
    if (!user) {
      return ["Home", "Services", "About", "Contact", "Portfolio", "News", "Segments"].includes(item.title);
    }
    
    // If client, show public items + project-related items
    if (user.role === "client") {
      return ["Home", "Services", "Projects", "About", "Contact"].includes(item.title);
    }
    
    // Employees/Admins see everything or specific roles
    return true;
  });

  const groupLabel = !user ? "القائمة العامة" : (isAdmin ? "نظام الإدارة" : "إدارة المشروع");

  return (
    <Sidebar side="right" className="bg-sidebar border-l border-sidebar-border shadow-xl">
      <SidebarHeader className="p-4 border-b bg-sidebar">
        <div className="flex items-center gap-3">
          <QiroxIcon className="h-6 w-6 text-cyan-500" />
          <QiroxLogo className="text-xl" />
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            {groupLabel}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    tooltip={item.title}
                    className="px-4 py-2 hover:bg-sidebar-accent transition-colors"
                  >
                    <Link href={item.url} className="flex items-center gap-3 w-full">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && user.role !== "client" && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              التبصيم
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-4 pb-4">
              {!attendanceStatus || attendanceStatus.checkOut ? (
                <SidebarMenuButton
                  onClick={() => checkInMutation.mutate()}
                  className="w-full bg-green-500 hover:bg-green-600 text-white justify-center gap-2 rounded-md transition-colors"
                  disabled={checkInMutation.isPending}
                >
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل حضور</span>
                </SidebarMenuButton>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 bg-slate-100 p-2 rounded border border-slate-200">
                    <Clock className="w-3 h-3" />
                    <span>منذ: {new Date(attendanceStatus.checkIn || "").toLocaleTimeString("ar-SA")}</span>
                  </div>
                  <SidebarMenuButton
                    onClick={() => checkOutMutation.mutate()}
                    className="w-full bg-red-500 hover:bg-red-600 text-white justify-center gap-2 rounded-md transition-colors"
                    disabled={checkOutMutation.isPending}
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
      <SidebarFooter className="p-4 border-t bg-sidebar">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
              {user.fullName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-slate-900">{user.fullName}</p>
              <p className="text-[10px] text-slate-500 truncate font-medium uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2">
              <Link href="/auth">
                <LogIn className="w-4 h-4" />
                <span>تسجيل الدخول</span>
              </Link>
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
