// ── WelcomeSection ────────────────────────────────────────────────────────────
// Sprint 007 — Customer Dashboard V2. Fully implemented with live data.
// Behind FEATURE_DASHBOARD_V2. Existing /dashboard untouched.

import { motion } from "framer-motion";
import { Sparkles, Layers, ShoppingCart, Bell, Wallet } from "lucide-react";
import { useUser } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

interface WelcomeSectionProps {
  lang?: "ar" | "en";
}

function StatPill({
  icon: Icon,
  label,
  value,
  isLoading,
}: {
  icon: any;
  label: string;
  value: string | number;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <div className="w-8 h-8 rounded-xl bg-white/10 dark:bg-black/10 flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
      {isLoading ? (
        <Skeleton className="h-4 w-8 bg-white/20" />
      ) : (
        <span className="text-sm font-bold">{value}</span>
      )}
      <span className="text-[10px] opacity-60 text-center leading-tight">{label}</span>
    </div>
  );
}

export function WelcomeSection({ lang = "ar" }: WelcomeSectionProps) {
  const { data: user } = useUser();
  const isAr = lang === "ar";

  const { data: dash, isLoading } = useQuery<any>({
    queryKey: ["/api/v2/client/dashboard"],
    queryFn: async () => {
      const r = await fetch("/api/v2/client/dashboard");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    staleTime: 60_000,
  });

  const hour = new Date().getHours();
  const greeting = isAr
    ? hour < 12 ? "صباح الخير" : hour < 17 ? "مساء الخير" : "مساء النور"
    : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const name = (user as any)?.fullName || (user as any)?.username || "";
  const kpis = dash?.kpis;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl bg-black dark:bg-white text-white dark:text-black overflow-hidden"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="space-y-0.5">
            <p className="text-xs opacity-60">{greeting}</p>
            <h2 className="text-lg font-bold leading-tight">
              {name
                ? isAr ? `${name} ،مرحباً` : `Welcome, ${name}`
                : isAr ? "مرحباً بك" : "Welcome back"}
            </h2>
            <p className="text-xs opacity-50">
              {isAr ? "لوحة رحلتك مع QIROX" : "Your QIROX journey dashboard"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-black/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-start gap-2 pt-4 border-t border-white/10 dark:border-black/10">
          <StatPill
            icon={Layers}
            label={isAr ? "مشاريع" : "Projects"}
            value={kpis?.activeProjects ?? 0}
            isLoading={isLoading}
          />
          <StatPill
            icon={ShoppingCart}
            label={isAr ? "طلبات" : "Orders"}
            value={kpis?.totalOrders ?? 0}
            isLoading={isLoading}
          />
          <StatPill
            icon={Wallet}
            label={isAr ? "المحفظة" : "Wallet"}
            value={isLoading ? "…" : `${(kpis?.walletBalance ?? 0).toLocaleString()} ر.س`}
            isLoading={false}
          />
          <StatPill
            icon={Bell}
            label={isAr ? "إشعارات" : "Alerts"}
            value={kpis?.unreadNotifications ?? 0}
            isLoading={isLoading}
          />
        </div>
      </div>
    </motion.div>
  );
}
