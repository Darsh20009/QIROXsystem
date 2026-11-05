import { useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { Loader2, ShieldOff } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  redirectTo?: string;
}

export default function RoleGuard({ allowedRoles, children, redirectTo = "/employee/role-dashboard" }: RoleGuardProps) {
  const { data: user, isLoading } = useUser();
  const [, navigate] = useLocation();
  const { lang } = useI18n();
  const L = lang === "ar";

  const role = (user as any)?.role;
  const isAllowed = role && allowedRoles.includes(role);

  useEffect(() => {
    if (!isLoading && user && !isAllowed) {
      const t = setTimeout(() => navigate(redirectTo), 1500);
      return () => clearTimeout(t);
    }
  }, [isLoading, user, isAllowed, navigate, redirectTo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-black/30 dark:text-white/30" />
      </div>
    );
  }

  if (!user || !isAllowed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center px-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
          <ShieldOff className="w-8 h-8 text-black/30 dark:text-white/30" />
        </div>
        <div>
          <p className="text-base font-bold text-black dark:text-white">
            {L ? "غير مصرح لك بالوصول" : "Access Restricted"}
          </p>
          <p className="text-sm text-black/40 dark:text-white/40 mt-1">
            {L ? "ستُعاد توجيهك تلقائياً..." : "Redirecting you automatically..."}
          </p>
        </div>
        <Loader2 className="w-4 h-4 animate-spin text-black/20 dark:text-white/20" />
      </motion.div>
    );
  }

  return <>{children}</>;
}
