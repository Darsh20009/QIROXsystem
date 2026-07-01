import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { Link } from "wouter";
import {
  Users, Crown, BadgeCheck, Code2, Palette, BarChart3,
  Headphones, CreditCard, Truck, ArrowRight, ShieldCheck,
  Megaphone, BookOpen, Package, UserCog, Check, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const PERMISSION_LABELS: Record<string, [string, string]> = {
  dashboard:       ["لوحتي",            "My Dashboard"],
  orders:          ["المشاريع",          "Projects"],
  customers:       ["العملاء",           "Clients"],
  crm:             ["CRM",               "CRM"],
  employees:       ["الموظفون",          "Employees"],
  finance:         ["المالية",           "Finance"],
  invoices:        ["الفواتير",          "Invoices"],
  receipts:        ["الإيصالات",         "Receipts"],
  payroll:         ["الرواتب",           "Payroll"],
  reports:         ["التقارير",          "Reports"],
  quotations:      ["عروض الأسعار",      "Quotations"],
  kanban:          ["كانبان",            "Kanban"],
  attendance:      ["الحضور",            "Attendance"],
  qmeet:           ["الاجتماعات",        "Meetings"],
  builder:         ["صانع الأنظمة",      "System Builder"],
  deployment:      ["نشر المشاريع",      "Deployment"],
  sector_guide:    ["دليل القطاعات",     "Sector Guide"],
  qi_agent:        ["QIROX AI",          "QIROX AI"],
  checklist:       ["قائمة المهام",      "Checklist"],
  settings:        ["الإعدادات",         "Settings"],
  mail:            ["البريد",            "Mail"],
  profile:         ["ملفي",              "Profile"],
  changelog:       ["التحديثات",         "Updates"],
  mod_requests:    ["طلبات التعديل",     "Mod Requests"],
  new_order:       ["عميل جديد",         "New Order"],
  subscriptions:   ["الاشتراكات",        "Subscriptions"],
  abandoned_carts: ["عربات مهجورة",      "Abandoned Carts"],
  my_finance:      ["حقي المالي",        "My Finance"],
  support_tickets: ["تذاكر الدعم",       "Support Tickets"],
  products:        ["المنتجات",          "Products"],
  news:            ["الأخبار",           "News"],
  marketing_posts: ["منشورات تسويقية",   "Marketing Posts"],
};

const ROLE_ITEMS: Record<string, string[]> = {
  admin:         ["dashboard","orders","customers","crm","employees","finance","invoices","receipts","payroll","reports","quotations","kanban","attendance","qmeet","builder","deployment","sector_guide","qi_agent","checklist","settings","mail","profile","changelog"],
  manager:       ["dashboard","orders","customers","crm","employees","finance","invoices","receipts","reports","quotations","kanban","attendance","qmeet","builder","deployment","qi_agent","checklist","mail","profile","changelog"],
  developer:     ["dashboard","mod_requests","orders","builder","deployment","sector_guide","qi_agent","checklist","qmeet","kanban","mail","profile","my_finance","changelog"],
  designer:      ["dashboard","mod_requests","builder","checklist","qmeet","mail","profile","my_finance","changelog"],
  sales:         ["dashboard","customers","crm","new_order","quotations","checklist","mail","profile","my_finance"],
  sales_manager: ["dashboard","customers","crm","orders","new_order","subscriptions","quotations","abandoned_carts","reports","checklist","mail","profile","my_finance"],
  marketing:     ["dashboard","customers","crm","new_order","quotations","marketing_posts","checklist","mail","profile","my_finance"],
  accountant:    ["dashboard","finance","invoices","receipts","payroll","reports","checklist","mail","profile","my_finance"],
  support:       ["dashboard","support_tickets","customers","checklist","mail","profile","my_finance"],
  hr:            ["dashboard","employees","payroll","attendance","checklist","mail","profile","my_finance"],
  merchant:      ["dashboard","checklist","mail","profile","my_finance"],
  content:       ["dashboard","products","news","marketing_posts","checklist","mail","profile","my_finance"],
};

const ROLE_META: Record<string, { labelAr: string; labelEn: string; icon: any; color: string; bg: string; badge: string }> = {
  admin:         { labelAr: "مدير النظام",   labelEn: "System Admin",   icon: Crown,       color: "text-amber-600 dark:text-amber-400",   bg: "border-amber-200/60 dark:border-amber-700/30 bg-amber-50/60 dark:bg-amber-900/10",   badge: "bg-black text-white dark:bg-white dark:text-black" },
  manager:       { labelAr: "مدير",           labelEn: "Manager",        icon: BadgeCheck,  color: "text-slate-600 dark:text-slate-300",    bg: "border-slate-200 dark:border-slate-700/40 bg-slate-50/60 dark:bg-slate-900/20",      badge: "bg-slate-700 text-white" },
  developer:     { labelAr: "مطوّر",          labelEn: "Developer",      icon: Code2,       color: "text-blue-600 dark:text-blue-400",      bg: "border-blue-200/50 dark:border-blue-700/30 bg-blue-50/40 dark:bg-blue-900/10",       badge: "bg-blue-600 text-white" },
  designer:      { labelAr: "مصمم",           labelEn: "Designer",       icon: Palette,     color: "text-violet-600 dark:text-violet-400",  bg: "border-violet-200/50 dark:border-violet-700/30 bg-violet-50/40 dark:bg-violet-900/10",badge: "bg-violet-600 text-white" },
  sales:         { labelAr: "مبيعات",         labelEn: "Sales",          icon: BarChart3,   color: "text-emerald-600 dark:text-emerald-400",bg: "border-emerald-200/50 dark:border-emerald-700/30 bg-emerald-50/40 dark:bg-emerald-900/10",badge: "bg-emerald-600 text-white" },
  sales_manager: { labelAr: "مدير مبيعات",   labelEn: "Sales Manager",  icon: BarChart3,   color: "text-teal-600 dark:text-teal-400",      bg: "border-teal-200/50 dark:border-teal-700/30 bg-teal-50/40 dark:bg-teal-900/10",       badge: "bg-teal-600 text-white" },
  marketing:     { labelAr: "تسويق",          labelEn: "Marketing",      icon: Megaphone,   color: "text-pink-600 dark:text-pink-400",      bg: "border-pink-200/50 dark:border-pink-700/30 bg-pink-50/40 dark:bg-pink-900/10",       badge: "bg-pink-600 text-white" },
  accountant:    { labelAr: "محاسب",          labelEn: "Accountant",     icon: CreditCard,  color: "text-amber-600 dark:text-amber-400",    bg: "border-amber-200/50 dark:border-amber-700/30 bg-amber-50/40 dark:bg-amber-900/10",    badge: "bg-amber-500 text-white" },
  support:       { labelAr: "دعم فني",        labelEn: "Support",        icon: Headphones,  color: "text-orange-600 dark:text-orange-400",  bg: "border-orange-200/50 dark:border-orange-700/30 bg-orange-50/40 dark:bg-orange-900/10",badge: "bg-orange-500 text-white" },
  hr:            { labelAr: "موارد بشرية",    labelEn: "HR",             icon: UserCog,     color: "text-rose-600 dark:text-rose-400",      bg: "border-rose-200/50 dark:border-rose-700/30 bg-rose-50/40 dark:bg-rose-900/10",       badge: "bg-rose-500 text-white" },
  merchant:      { labelAr: "توصيل",          labelEn: "Delivery",       icon: Truck,       color: "text-stone-600 dark:text-stone-400",    bg: "border-stone-200/50 dark:border-stone-700/30 bg-stone-50/40 dark:bg-stone-900/10",    badge: "bg-stone-500 text-white" },
  content:       { labelAr: "محتوى",          labelEn: "Content",        icon: BookOpen,    color: "text-indigo-600 dark:text-indigo-400",  bg: "border-indigo-200/50 dark:border-indigo-700/30 bg-indigo-50/40 dark:bg-indigo-900/10",badge: "bg-indigo-500 text-white" },
};

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS);

export default function AdminRoles() {
  const { lang } = useI18n();
  const L = lang === "ar";

  const { data: users } = useQuery<any[]>({ queryKey: ["/api/admin/users"] });
  const employees = (users || []).filter(u => u.role !== "client");

  const roleOrder = ["admin","manager","developer","designer","sales","sales_manager","marketing","accountant","support","hr","merchant","content"];

  const roleCounts: Record<string, number> = {};
  roleOrder.forEach(r => { roleCounts[r] = employees.filter(e => e.role === r).length; });

  return (
    <div className="space-y-6" dir={L ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-black dark:text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {L ? "إدارة الأدوار والصلاحيات" : "Roles & Permissions"}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {L ? `${roleOrder.length} دور — ${employees.length} موظف` : `${roleOrder.length} roles — ${employees.length} employees`}
            </p>
          </div>
        </div>
        <Link href="/admin/employees">
          <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 border-black/[0.08] dark:border-white/[0.1]">
            <Users className="w-3.5 h-3.5" />
            {L ? "إدارة الموظفين" : "Manage Employees"}
            <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: L ? "إجمالي الموظفين" : "Total Staff", value: employees.length, icon: Users },
          { label: L ? "أدوار الإدارة" : "Management", value: employees.filter(e => ["admin","manager"].includes(e.role)).length, icon: Crown },
          { label: L ? "أدوار تقنية" : "Technical", value: employees.filter(e => ["developer","designer"].includes(e.role)).length, icon: Code2 },
          { label: L ? "أدوار تشغيلية" : "Operations", value: employees.filter(e => ["sales","support","merchant","sales_manager","accountant","hr","content","marketing"].includes(e.role)).length, icon: Package },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.07] rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
                <s.icon className="w-4.5 h-4.5 text-black dark:text-white" />
              </div>
              <div>
                <p className="text-xl font-black text-black dark:text-white leading-none">{s.value}</p>
                <p className="text-[11px] text-black/40 dark:text-white/40 mt-0.5">{s.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {roleOrder.map((role, idx) => {
          const meta = ROLE_META[role];
          if (!meta) return null;
          const perms = ROLE_ITEMS[role] || [];
          const Icon = meta.icon;
          const count = roleCounts[role] || 0;

          return (
            <motion.div key={role}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}>
              <div className={`rounded-2xl border p-5 ${meta.bg}`}>
                {/* Role header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center shadow-sm`}>
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-black dark:text-white">
                        {L ? meta.labelAr : meta.labelEn}
                      </h3>
                      <p className="text-[10px] text-black/40 dark:text-white/40">{role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.badge}`}>
                      {count} {L ? "موظف" : "staff"}
                    </span>
                  </div>
                </div>

                {/* Permissions list */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {perms.map(p => (
                    <span key={p} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-lg bg-white/70 dark:bg-black/30 border border-black/[0.07] dark:border-white/[0.08] text-black/70 dark:text-white/70">
                      <Check className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0" />
                      {L ? (PERMISSION_LABELS[p]?.[0] ?? p) : (PERMISSION_LABELS[p]?.[1] ?? p)}
                    </span>
                  ))}
                </div>

                {/* Locked permissions count */}
                <div className="flex items-center justify-between pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
                  <span className="text-[10px] text-black/35 dark:text-white/35 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-500" />
                    {perms.length} {L ? "صلاحية ممنوحة" : "permissions"}
                    <span className="mx-1 opacity-30">·</span>
                    <X className="w-3 h-3 text-red-400" />
                    {ALL_PERMISSIONS.length - perms.length} {L ? "محظورة" : "denied"}
                  </span>
                  <Link href={`/admin/employees?role=${role}`}>
                    <button className={`text-[10px] font-bold flex items-center gap-1 ${meta.color} hover:opacity-70 transition-opacity`}>
                      {L ? "الموظفون" : "View Staff"}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Permission Matrix Table */}
      <div className="bg-white dark:bg-gray-900 border border-black/[0.06] dark:border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.06]">
          <h2 className="text-sm font-black text-black dark:text-white">{L ? "مصفوفة الصلاحيات الكاملة" : "Full Permission Matrix"}</h2>
          <p className="text-[11px] text-black/40 dark:text-white/40 mt-0.5">{L ? "جميع الأدوار والصلاحيات في نظرة واحدة" : "All roles and permissions at a glance"}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" dir="ltr">
            <thead>
              <tr className="border-b border-black/[0.05] dark:border-white/[0.05]">
                <th className="sticky left-0 bg-white dark:bg-gray-900 text-right px-4 py-2.5 font-bold text-black/50 dark:text-white/50 min-w-[140px]">
                  {L ? "الصلاحية" : "Permission"}
                </th>
                {roleOrder.map(role => {
                  const meta = ROLE_META[role];
                  const Icon = meta?.icon;
                  return (
                    <th key={role} className="px-2 py-2.5 text-center min-w-[60px]">
                      <div className="flex flex-col items-center gap-1">
                        {Icon && <Icon className={`w-3.5 h-3.5 ${meta?.color}`} />}
                        <span className="text-[9px] font-bold text-black/50 dark:text-white/50 whitespace-nowrap">
                          {role.replace("_", " ")}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ALL_PERMISSIONS.map((perm, i) => (
                <tr key={perm} className={`border-b border-black/[0.04] dark:border-white/[0.04] ${i % 2 === 0 ? "bg-black/[0.01] dark:bg-white/[0.01]" : ""}`}>
                  <td className="sticky left-0 bg-inherit px-4 py-2 font-medium text-black/70 dark:text-white/70 whitespace-nowrap">
                    {L ? (PERMISSION_LABELS[perm]?.[0] ?? perm) : (PERMISSION_LABELS[perm]?.[1] ?? perm)}
                  </td>
                  {roleOrder.map(role => {
                    const has = ROLE_ITEMS[role]?.includes(perm);
                    return (
                      <td key={role} className="px-2 py-2 text-center">
                        {has
                          ? <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                          : <span className="w-3.5 h-3.5 block mx-auto opacity-15">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
