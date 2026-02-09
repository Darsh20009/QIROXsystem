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
} from "@/components/ui/sidebar";
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
  PlusCircle,
} from "lucide-react";
import { Link, useLocation } from "wouter";

const clientMenuItems = [
  { title: "لوحة العميل", icon: LayoutDashboard, url: "/dashboard" },
  { title: "حالة المشروع", icon: CheckCircle2, url: "/project/status" },
  { title: "مراحل التنفيذ", icon: ListTodo, url: "/project/implementation" },
  { title: "ملفات المشروع", icon: FileText, url: "/project/files" },
  { title: "روابط الأدوات", icon: Link2, url: "/project/tools" },
  { title: "محادثة الفريق", icon: MessageSquare, url: "/project/chat" },
  { title: "الفواتير", icon: Receipt, url: "/project/invoices" },
  { title: "الدفعات", icon: CreditCard, url: "/project/payments" },
  { title: "العقود", icon: FileSignature, url: "/project/contracts" },
  { title: "Vault المشروع", icon: ShieldCheck, url: "/project/vault" },
  { title: "التنبيهات", icon: Bell, url: "/project/notifications" },
  { title: "تحميل ملفات التسليم", icon: Download, url: "/project/deliverables" },
];

const adminMenuItems = [
  { title: "لوحة التحكم", icon: LayoutDashboard, url: "/admin" },
  { title: "إدارة الخدمات", icon: Briefcase, url: "/admin/services" },
  { title: "إدارة الطلبات", icon: FileText, url: "/admin/orders" },
  { title: "الإدارة المالية", icon: Wallet, url: "/admin/finance" },
  { title: "إدارة الموظفين", icon: Users, url: "/admin/employees" },
  { title: "الإعدادات", icon: Settings, url: "/admin/settings" },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { data: user } = useUser();
  const isAdmin = user && user.role !== "client";

  const menuItems = isAdmin ? adminMenuItems : clientMenuItems;
  const groupLabel = isAdmin ? "نظام الإدارة" : "إدارة المشروع";

  return (
    <Sidebar side="right">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold">Q</span>
          </div>
          <span className="font-bold text-xl font-heading text-primary">QIROX</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
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
                    className="px-4 py-2"
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
      </SidebarContent>
    </Sidebar>
  );
}
