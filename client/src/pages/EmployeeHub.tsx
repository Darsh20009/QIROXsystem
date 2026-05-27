import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  LayoutDashboard, User2, BookOpen, Mail, PlusCircle,
  Package, Wrench, Video, FileText, ChevronRight
} from "lucide-react";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { UserAvatar } from "@/components/UserAvatar";
import EmployeeRoleDashboard from "./EmployeeRoleDashboard";
import EmployeeProfile from "./EmployeeProfile";
import EmployeeChangelog from "./EmployeeChangelog";
import { Link } from "wouter";

type TabId = "dashboard" | "profile" | "changelog";

const TAB_PATHS: Record<TabId, string> = {
  dashboard: "/employee/role-dashboard",
  profile: "/employee/profile",
  changelog: "/employee/changelog",
};

const ROLE_LABELS: Record<string, [string, string]> = {
  admin: ["مدير النظام", "System Admin"],
  manager: ["مدير", "Manager"],
  developer: ["مطوّر", "Developer"],
  designer: ["مصمم", "Designer"],
  sales: ["مبيعات", "Sales"],
  sales_manager: ["مدير مبيعات", "Sales Manager"],
  accountant: ["محاسب", "Accountant"],
  support: ["دعم فني", "Support"],
  merchant: ["توصيل", "Delivery"],
  hr: ["موارد بشرية", "HR"],
  content: ["محتوى", "Content"],
  marketing: ["تسويق", "Marketing"],
};

export default function EmployeeHub() {
  const [location, setLocation] = useLocation();
  const { data: user } = useUser();
  const { lang } = useI18n();
  const L = lang === "ar";

  const activeTab: TabId =
    location.startsWith("/employee/profile") ? "profile" :
    location.startsWith("/employee/changelog") ? "changelog" :
    "dashboard";

  const tabs = [
    { id: "dashboard" as TabId, label: L ? "لوحتي" : "Dashboard", icon: LayoutDashboard },
    { id: "profile" as TabId, label: L ? "ملفي" : "My Profile", icon: User2 },
    { id: "changelog" as TabId, label: L ? "التحديثات" : "Updates", icon: BookOpen },
  ];

  const quickActions = [
    { icon: Mail, label: L ? "البريد" : "Mail", href: "/employee/mail" },
    { icon: PlusCircle, label: L ? "طلب جديد" : "New Order", href: "/employee/new-order" },
    { icon: Package, label: L ? "الاشتراكات" : "Subscriptions", href: "/employee/subscriptions" },
    { icon: Wrench, label: L ? "صانع الأنظمة" : "Builder", href: "/employee/system-builder" },
    { icon: Video, label: L ? "اجتماع" : "QMeet", href: "/admin/qmeet" },
    { icon: FileText, label: L ? "دليل القطاعات" : "Sector Guide", href: "/employee/sector-guide" },
  ];

  const roleLabel = user?.role ? (ROLE_LABELS[user.role] || [user.role, user.role]) : ["موظف", "Employee"];

  return (
    <div className="min-h-screen">
      {/* ── Hub Header ────────────────────────────────────────────────────── */}
      <div className="border-b border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-gray-950">
        {/* Welcome bar */}
        <div className="px-4 sm:px-6 pt-5 pb-3 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-center gap-3 mb-4"
          >
            <UserAvatar user={user} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-black text-base text-black dark:text-white leading-tight truncate">
                {user?.fullName || user?.username || (L ? "الموظف" : "Employee")}
              </p>
              <p className="text-xs text-black/40 dark:text-white/40 font-medium">
                {L ? roleLabel[0] : roleLabel[1]}
              </p>
            </div>
          </motion.div>

          {/* Quick actions dock */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1"
          >
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <button className="flex items-center gap-1.5 bg-black/[0.04] dark:bg-white/[0.05] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-black dark:text-white text-[11px] font-bold px-3 py-2 rounded-xl transition-colors whitespace-nowrap border border-black/[0.05] dark:border-white/[0.06] shrink-0">
                  <action.icon className="w-3.5 h-3.5 opacity-60" />
                  {action.label}
                </button>
              </Link>
            ))}
          </motion.div>
        </div>

        {/* Tab bar */}
        <div className="px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="flex items-center gap-0" dir="rtl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                data-testid={`tab-${tab.id}`}
                onClick={() => setLocation(TAB_PATHS[tab.id])}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-bold border-b-2 transition-all duration-150 ${
                  activeTab === tab.id
                    ? "border-black dark:border-white text-black dark:text-white"
                    : "border-transparent text-black/35 dark:text-white/35 hover:text-black/60 dark:hover:text-white/60"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      <div>
        {activeTab === "dashboard" && <EmployeeRoleDashboard />}
        {activeTab === "profile" && <EmployeeProfile />}
        {activeTab === "changelog" && <EmployeeChangelog />}
      </div>
    </div>
  );
}
