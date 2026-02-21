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
  LayoutDashboard, FileText, Settings, Users, Wallet, Briefcase,
  LogIn, LogOut, Clock, Layers, Image, DollarSign
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const items = [
  { title: "Home", icon: LayoutDashboard, url: "/" },
  { title: "Portfolio", icon: Image, url: "/portfolio" },
  { title: "Services", icon: Briefcase, url: "/services" },
  { title: "Prices", icon: DollarSign, url: "/prices" },
  { title: "About", icon: FileText, url: "/about" },
  { title: "Contact", icon: Briefcase, url: "/contact" },
  { title: "Projects", icon: LayoutDashboard, url: "/dashboard" },
  { title: "لوحة التحكم", icon: LayoutDashboard, url: "/admin" },
  { title: "إدارة القوالب", icon: Layers, url: "/admin/templates" },
  { title: "إدارة الخدمات", icon: Briefcase, url: "/admin/services" },
  { title: "إدارة الطلبات", icon: FileText, url: "/admin/orders" },
  { title: "الإدارة المالية", icon: Wallet, url: "/admin/finance" },
  { title: "إدارة الموظفين", icon: Users, url: "/admin/employees" },
];

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
        body: JSON.stringify({ ipAddress: "fetching...", location: { lat: 0, lng: 0 } }),
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
    if (!user) {
      return ["Home", "Portfolio", "Services", "Prices", "About", "Contact"].includes(item.title);
    }
    if (user.role === "client") {
      return ["Home", "Portfolio", "Services", "Prices", "About", "Contact", "Projects"].includes(item.title);
    }
    return true;
  });

  const groupLabel = !user ? "القائمة" : (isAdmin ? "الإدارة" : "المشروع");

  return (
    <Sidebar side="right" className="bg-white border-l border-[#E0E0E0]">
      <SidebarHeader className="p-4 border-b border-[#E0E0E0]">
        <span className="font-heading font-black text-lg text-[#111111] tracking-tight">QIROX</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-semibold text-black/30 uppercase tracking-widest mb-2">
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
                    className="px-4 py-2 hover:bg-[#F4F4F4] transition-colors"
                  >
                    <Link href={item.url} className="flex items-center gap-3 w-full">
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && user.role !== "client" && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[10px] font-semibold text-black/30 uppercase tracking-widest mb-2">
              التبصيم
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-4 pb-4">
              {!attendanceStatus || attendanceStatus.checkOut ? (
                <SidebarMenuButton
                  onClick={() => checkInMutation.mutate()}
                  className="w-full bg-[#111111] hover:bg-[#2B2B2B] text-white justify-center gap-2 rounded-lg transition-colors"
                  disabled={checkInMutation.isPending}
                >
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل حضور</span>
                </SidebarMenuButton>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-[10px] text-[#555555] bg-[#F4F4F4] p-2 rounded-lg border border-[#E0E0E0]">
                    <Clock className="w-3 h-3" />
                    <span>منذ: {new Date(attendanceStatus.checkIn || "").toLocaleTimeString("ar-SA")}</span>
                  </div>
                  <SidebarMenuButton
                    onClick={() => checkOutMutation.mutate()}
                    className="w-full bg-[#111111] hover:bg-[#2B2B2B] text-white justify-center gap-2 rounded-lg transition-colors"
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
      <SidebarFooter className="p-4 border-t border-[#E0E0E0]">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#111111] flex items-center justify-center text-white font-bold text-xs">
              {user.fullName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-[#111111]">{user.fullName}</p>
              <p className="text-[10px] text-black/30 truncate uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
        ) : (
          <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2 border-[#E0E0E0] rounded-lg">
            <Link href="/auth">
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </Link>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
