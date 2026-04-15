import { Link, useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, FileText, MessageSquare, Headphones, Wallet,
  ShoppingCart, BarChart3, Users, Wrench, User
} from "lucide-react";

export function MobileBottomNav() {
  const [location] = useLocation();
  const { data: user } = useUser();

  const { data: inboxData } = useQuery<any>({
    queryKey: ["/api/inbox/unread-count"],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: pendingData } = useQuery<any>({
    queryKey: ["/api/orders/pending-count"],
    enabled: !!user && user.role !== "client",
    refetchInterval: 30000,
  });

  const unreadMessages = inboxData?.count || 0;
  const pendingOrders = pendingData?.count || 0;

  if (!user) return null;

  const isEmployee = user.role !== "client";
  const isManagement = ["admin", "manager"].includes(user.role);

  const clientItems = [
    { icon: LayoutDashboard, label: "لوحتي", url: "/dashboard" },
    { icon: ShoppingCart, label: "السلة", url: "/cart" },
    { icon: Headphones, label: "الدعم", url: "/cs-chat" },
    { icon: Wallet, label: "محفظتي", url: "/wallet" },
    { icon: MessageSquare, label: "الرسائل", url: "/inbox", badge: unreadMessages },
  ];

  const employeeItems = [
    { icon: LayoutDashboard, label: "لوحتي", url: "/dashboard" },
    { icon: FileText, label: "الطلبات", url: "/admin/orders", badge: pendingOrders },
    { icon: Wrench, label: "تعديلات", url: "/admin/mod-requests" },
    { icon: MessageSquare, label: "الرسائل", url: "/inbox", badge: unreadMessages },
    { icon: User, label: "ملفي", url: "/employee/profile" },
  ];

  const adminItems = [
    { icon: LayoutDashboard, label: "الإدارة", url: "/admin" },
    { icon: FileText, label: "الطلبات", url: "/admin/orders", badge: pendingOrders },
    { icon: Users, label: "العملاء", url: "/admin/customers" },
    { icon: BarChart3, label: "التحليل", url: "/admin/analytics" },
    { icon: MessageSquare, label: "الرسائل", url: "/inbox", badge: unreadMessages },
  ];

  const items = isManagement ? adminItems : isEmployee ? employeeItems : clientItems;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-t border-black/[0.06] dark:border-white/[0.06]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-[60px]">
        {items.map((item) => {
          const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
          const badge = (item as any).badge || 0;
          return (
            <Link
              key={item.url}
              href={item.url}
              className="flex flex-col items-center justify-center gap-[3px] flex-1 min-w-0 h-full py-2 transition-all duration-200"
              data-testid={`mobile-nav-${item.url.replace(/\//g, "-").slice(1) || "home"}`}
            >
              <div className={`relative flex-shrink-0 p-[5px] rounded-xl transition-all duration-200 ${
                isActive ? "bg-black dark:bg-white" : ""
              }`}>
                <item.icon className={`w-[18px] h-[18px] transition-all duration-200 ${
                  isActive ? "text-white dark:text-black" : "text-black/35 dark:text-white/35"
                }`} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center px-0.5 leading-none">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-medium truncate max-w-full px-0.5 text-center leading-tight transition-all duration-200 ${
                isActive ? "text-black dark:text-white font-bold" : "text-black/30 dark:text-white/30"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
