import { Link, useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import {
  LayoutDashboard, FileText, MessageSquare, Headphones, Wallet,
  ShoppingCart, BarChart3, Users, Wrench, User
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SiInstagram, SiX, SiLinkedin, SiSnapchat, SiYoutube, SiTiktok, SiWhatsapp } from "react-icons/si";
import { useTheme } from "@/lib/theme";

const SOCIAL_DEFS = [
  { key: "instagram", Icon: SiInstagram, color: "#E1306C",  darkColor: "#E1306C"  },
  { key: "twitter",   Icon: SiX,         color: "#000000",  darkColor: "#ffffff"  },
  { key: "linkedin",  Icon: SiLinkedin,  color: "#0077B5",  darkColor: "#0e9fe6"  },
  { key: "snapchat",  Icon: SiSnapchat,  color: "#FFFC00",  darkColor: "#ffe600"  },
  { key: "tiktok",    Icon: SiTiktok,    color: "#010101",  darkColor: "#ffffff"  },
  { key: "youtube",   Icon: SiYoutube,   color: "#FF0000",  darkColor: "#FF0000"  },
  { key: "whatsapp",  Icon: SiWhatsapp,  color: "#25D366",  darkColor: "#25D366"  },
];

export function MobileBottomNav() {
  const [location] = useLocation();
  const { data: user } = useUser();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data: publicSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/public/settings"],
    staleTime: 5 * 60 * 1000,
  });

  const socialLinks = SOCIAL_DEFS.filter(s => publicSettings?.[s.key]);

  if (!user) return null;

  const isEmployee = user.role !== "client";
  const isManagement = ["admin", "manager"].includes(user.role);

  const clientItems = [
    { icon: LayoutDashboard, label: "لوحتي", url: "/dashboard" },
    { icon: ShoppingCart, label: "السلة", url: "/cart" },
    { icon: Headphones, label: "الدعم", url: "/cs-chat" },
    { icon: Wallet, label: "محفظتي", url: "/wallet" },
    { icon: MessageSquare, label: "الرسائل", url: "/inbox" },
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
      {/* Social Links Strip */}
      {socialLinks.length > 0 && (
        <div className="flex items-center justify-center gap-3 px-4 py-1.5 border-b border-black/[0.04] dark:border-white/[0.04]">
          {socialLinks.map(({ key, Icon, color, darkColor }) => {
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
                data-testid={`mobile-nav-social-${key}`}
                className="flex items-center justify-center w-6 h-6 rounded-md transition-opacity hover:opacity-70"
                style={{ color: isDark ? darkColor : color }}
              >
                <Icon className="w-3.5 h-3.5" />
              </a>
            );
          })}
        </div>
      )}
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
