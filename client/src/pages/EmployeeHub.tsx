import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import EmployeeLayout from "@/components/EmployeeLayout";
import EmployeeRoleDashboard from "./EmployeeRoleDashboard";
import EmployeeProfile from "./EmployeeProfile";
import EmployeeChangelog from "./EmployeeChangelog";
import { motion } from "framer-motion";
import { UserAvatar } from "@/components/UserAvatar";

const ROLE_LABELS: Record<string, [string, string]> = {
  admin:         ["مدير النظام", "System Admin"],
  manager:       ["مدير", "Manager"],
  developer:     ["مطوّر", "Developer"],
  designer:      ["مصمم", "Designer"],
  sales:         ["مبيعات", "Sales"],
  sales_manager: ["مدير مبيعات", "Sales Manager"],
  accountant:    ["محاسب", "Accountant"],
  support:       ["دعم فني", "Support"],
  merchant:      ["توصيل", "Delivery"],
  hr:            ["موارد بشرية", "HR"],
  content:       ["محتوى", "Content"],
  marketing:     ["تسويق", "Marketing"],
};

function getGreeting(L: boolean) {
  const h = new Date().getHours();
  if (L) {
    if (h < 12) return "صباح الخير";
    if (h < 17) return "مساء الخير";
    return "مساء النور";
  }
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function DashboardHeader() {
  const { data: user } = useUser();
  const { lang } = useI18n();
  const L = lang === "ar";
  const role = (user as any)?.role || "employee";
  const roleLabel = ROLE_LABELS[role] || [role, role];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex items-center gap-3.5 mb-6 pt-1"
    >
      <UserAvatar
        profilePhotoUrl={(user as any)?.profilePhotoUrl}
        avatarConfig={(user as any)?.avatarConfig}
        name={(user as any)?.fullName || (user as any)?.username}
        role={(user as any)?.role}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-black/35 dark:text-white/35 mb-0.5">
          {getGreeting(L)}
        </p>
        <h1 className="text-lg font-black text-black dark:text-white leading-tight truncate">
          {(user as any)?.fullName || (user as any)?.username || (L ? "الموظف" : "Employee")}
        </h1>
      </div>
      <span className={`hidden sm:inline-block shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full ${
        ["admin", "manager"].includes(role)
          ? "bg-black text-white dark:bg-white dark:text-black"
          : "bg-black/[0.06] text-black/60 dark:bg-white/[0.1] dark:text-white/60"
      }`}>
        {L ? roleLabel[0] : roleLabel[1]}
      </span>
    </motion.div>
  );
}

export default function EmployeeHub() {
  const [location] = useLocation();

  const isProfile   = location.startsWith("/employee/profile");
  const isChangelog = location.startsWith("/employee/changelog");

  return (
    <EmployeeLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {!isProfile && !isChangelog && <DashboardHeader />}
        {isProfile   ? <EmployeeProfile />   :
         isChangelog ? <EmployeeChangelog /> :
                       <EmployeeRoleDashboard />}
      </div>
    </EmployeeLayout>
  );
}
