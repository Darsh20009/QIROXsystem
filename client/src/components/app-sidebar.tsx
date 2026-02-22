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
  LogIn, LogOut, Clock, Layers, DollarSign, Handshake, Image
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";

export function AppSidebar() {
  const [location] = useLocation();
  const { data: user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const isAdmin = user && user.role !== "client";

  const items = [
    { title: t("nav.home"), icon: LayoutDashboard, url: "/", group: "public" },
    { title: t("nav.portfolio"), icon: Image, url: "/portfolio", group: "public" },
    { title: t("nav.services"), icon: Briefcase, url: "/services", group: "public" },
    { title: t("nav.prices"), icon: DollarSign, url: "/prices", group: "public" },
    { title: t("nav.about"), icon: FileText, url: "/about", group: "public" },
    { title: t("nav.contact"), icon: Briefcase, url: "/contact", group: "public" },
    { title: t("admin.dashboard"), icon: LayoutDashboard, url: "/dashboard", group: "client" },
    { title: t("admin.dashboard"), icon: LayoutDashboard, url: "/admin", group: "admin" },
    { title: t("admin.templates"), icon: Layers, url: "/admin/templates", group: "admin" },
    { title: t("admin.services"), icon: Briefcase, url: "/admin/services", group: "admin" },
    { title: t("admin.orders"), icon: FileText, url: "/admin/orders", group: "admin" },
    { title: t("admin.finance"), icon: Wallet, url: "/admin/finance", group: "admin" },
    { title: t("admin.employees"), icon: Users, url: "/admin/employees", group: "admin" },
    { title: t("admin.partners"), icon: Handshake, url: "/admin/partners", group: "admin" },
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
      toast({ title: t("admin.dashboard"), description: "OK" });
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
      toast({ title: t("admin.logout") });
    },
  });

  const menuItems = items.filter(item => {
    if (!user) return item.group === "public";
    if (user.role === "client") return item.group === "public" || item.group === "client";
    return true;
  });

  return (
    <Sidebar side="right" className="bg-[#0A0A0F] border-l border-white/5">
      <SidebarHeader className="p-4 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <img src={qiroxLogoPath} alt="QIROX" className="h-6 w-auto object-contain" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-semibold text-white/20 uppercase tracking-[3px] mb-2">
            {!user ? t("nav.home") : (isAdmin ? t("admin.dashboard") : t("admin.dashboard"))}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    tooltip={item.title}
                    className="px-4 py-2 hover:bg-white/5 transition-colors rounded-xl"
                  >
                    <Link href={item.url} className="flex items-center gap-3 w-full">
                      <item.icon className="w-4 h-4 text-white/30" />
                      <span className="text-sm font-medium text-white/60">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && user.role !== "client" && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[10px] font-semibold text-white/20 uppercase tracking-[3px] mb-2">
              Attendance
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-4 pb-4">
              {!attendanceStatus || attendanceStatus.checkOut ? (
                <SidebarMenuButton
                  onClick={() => checkInMutation.mutate()}
                  className="w-full premium-btn justify-center gap-2 rounded-xl transition-colors"
                  disabled={checkInMutation.isPending}
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t("login.submit")}</span>
                </SidebarMenuButton>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-[10px] text-white/30 bg-white/5 p-2 rounded-xl border border-white/5">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(attendanceStatus.checkIn || "").toLocaleTimeString("ar-SA")}</span>
                  </div>
                  <SidebarMenuButton
                    onClick={() => checkOutMutation.mutate()}
                    className="w-full bg-white/5 hover:bg-white/10 text-white justify-center gap-2 rounded-xl transition-colors"
                    disabled={checkOutMutation.isPending}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t("admin.logout")}</span>
                  </SidebarMenuButton>
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-white/5">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "linear-gradient(135deg, #00D4FF, #0099CC)", color: "#0A0A0F" }}>
              {user.fullName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white">{user.fullName}</p>
              <p className="text-[10px] text-white/20 truncate uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
        ) : (
          <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2 border-white/10 text-white/50 rounded-xl bg-transparent hover:bg-white/5">
            <Link href="/login">
              <LogIn className="w-4 h-4" />
              <span>{t("login.submit")}</span>
            </Link>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
