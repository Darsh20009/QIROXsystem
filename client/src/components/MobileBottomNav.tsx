import { Link, useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import {
  LayoutDashboard, FileText, MessageSquare, LifeBuoy, User,
  ShoppingCart, BarChart3, Users, Wrench
} from "lucide-react";

export function MobileBottomNav() {
  const [location] = useLocation();
  const { data: user } = useUser();

  if (!user) return null;

  const isEmployee = user.role !== "client";
  const isManagement = ["admin", "manager"].includes(user.role);

  const clientItems = [
    { icon: LayoutDashboard, label: "الرئيسية", url: "/dashboard" },
    { icon: ShoppingCart, label: "السلة", url: "/cart" },
    { icon: MessageSquare, label: "الرسائل", url: "/inbox" },
    { icon: LifeBuoy, label: "الدعم", url: "/support" },
    { icon: User, label: "حسابي", url: "/" },
  ];

  const employeeItems = [
    { icon: LayoutDashboard, label: "لوحتي", url: "/dashboard" },
    { icon: FileText, label: "الطلبات", url: "/admin/orders" },
    { icon: Wrench, label: "تعديلات", url: "/admin/mod-requests" },
    { icon: MessageSquare, label: "الرسائل", url: "/inbox" },
    { icon: User, label: "ملفي", url: "/employee/profile" },
  ];

  const adminItems = [
    { icon: LayoutDashboard, label: "الإدارة", url: "/admin" },
    { icon: FileText, label: "الطلبات", url: "/admin/orders" },
    { icon: Users, label: "العملاء", url: "/admin/customers" },
    { icon: BarChart3, label: "التحليل", url: "/admin/analytics" },
    { icon: MessageSquare, label: "الرسائل", url: "/inbox" },
  ];

  const items = isManagement ? adminItems : isEmployee ? employeeItems : clientItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 border-t border-black/[0.06] dark:border-white/[0.06] safe-bottom">
      <div className="flex items-stretch justify-around h-16" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {items.map((item) => {
          const isActive = location === item.url;
          return (
            <Link
              key={item.url}
              href={item.url}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 px-1 transition-all duration-200 ${
                isActive ? "text-black dark:text-white" : "text-black/30 dark:text-white/30"
              }`}
              data-testid={`mobile-nav-${item.url.replace(/\//g, "-").slice(1) || "home"}`}
            >
              <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${
                isActive ? "bg-black dark:bg-white" : ""
              }`}>
                <item.icon className={`w-5 h-5 transition-all duration-200 ${
                  isActive ? "text-white dark:text-black" : "text-black/40 dark:text-white/40"
                }`} />
              </div>
              <span className={`text-[10px] font-medium truncate w-full text-center leading-none transition-all duration-200 ${
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
