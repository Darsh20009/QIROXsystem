import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, CheckSquare, FolderOpen, LayoutDashboard,
  MessageSquare, Package, Settings2, Users, Wallet,
} from "lucide-react";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { getAllowedEmployeeNavItems } from "@/components/EmployeeLayout";

type Workspace = {
  id: string;
  title: string;
  description: string;
  icon: typeof LayoutDashboard;
  href: string;
  actions: { label: string; href: string }[];
};

type WorkspaceDefinition = Omit<Workspace, "href" | "actions"> & {
  actionCandidates: { labelAr: string; labelEn: string; href: string }[];
};

const ROLE_LABELS: Record<string, [string, string]> = {
  admin: ["مدير النظام", "System admin"],
  manager: ["مدير", "Manager"],
  developer: ["مطوّر", "Developer"],
  designer: ["مصمم", "Designer"],
  sales: ["مبيعات", "Sales"],
  sales_manager: ["مدير المبيعات", "Sales manager"],
  accountant: ["محاسب", "Accountant"],
  support: ["دعم فني", "Support"],
  data_entry: ["إدخال البيانات", "Data entry"],
  hr: ["موارد بشرية", "HR"],
  merchant: ["توصيل", "Delivery"],
  content: ["محتوى", "Content"],
  marketing: ["تسويق", "Marketing"],
};

export default function EmployeeWorkspace() {
  const { data: user } = useUser() as any;
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const role = user?.role || "employee";
  const roleLabel = ROLE_LABELS[role] || [role, role];

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/inbox/unread-count"],
    refetchInterval: 30000,
  });
  const { data: taskData } = useQuery<{ tasks: any[] }>({
    queryKey: ["/api/my-kanban-tasks"],
    refetchInterval: 60000,
  });
  const pendingTasks = (taskData?.tasks || []).filter(task => !["closed", "done", "delivery"].includes(task.status)).length;
  const unread = unreadData?.count || 0;

  const workspaces = useMemo<Workspace[]>(() => {
    const allowedItems = getAllowedEmployeeNavItems(role, user?.allowedPages ?? null);
    const allowedHrefs = new Set(allowedItems.map(item => item.href));
    const definitions: WorkspaceDefinition[] = [
      {
        id: "clients",
        title: L ? "العملاء والمبيعات" : "Clients & sales",
        description: L ? "أدر العملاء المحتملين والمتابعات والطلبات الجديدة دون التنقل بين شاشات كثيرة." : "Manage leads, follow-ups, and new requests without jumping between pages.",
        icon: Users,
        actionCandidates: [
          { labelAr: "العملاء", labelEn: "Clients", href: "/admin/customers" },
          { labelAr: "إدارة العملاء", labelEn: "CRM", href: "/employee/crm" },
          { labelAr: "طلب جديد", labelEn: "New request", href: "/employee/new-order" },
          { labelAr: "داتا العملاء", labelEn: "Leads data", href: "/employee/leads-data" },
        ],
      },
      {
        id: "projects",
        title: L ? "المشاريع والتنفيذ" : "Projects & delivery",
        description: L ? "تابع الحالة والمهام والموافقات من بداية الطلب حتى التسليم." : "Follow status, tasks, and approvals from request to delivery.",
        icon: FolderOpen,
        actionCandidates: [
          { labelAr: "فتح المشاريع", labelEn: "Open projects", href: "/admin/orders" },
          { labelAr: "لوحة المهام", labelEn: "Task board", href: "/admin/kanban" },
          { labelAr: "طلبات التعديل", labelEn: "Change requests", href: "/admin/mod-requests" },
          { labelAr: "مهامي", labelEn: "My tasks", href: "/employee/checklist" },
        ],
      },
      {
        id: "communication",
        title: L ? "التواصل" : "Communication",
        description: L ? "اجمع الرسائل وواتساب والاجتماعات في مسار واضح للمتابعة." : "Keep mail, WhatsApp, and meetings in one clear follow-up path.",
        icon: MessageSquare,
        actionCandidates: [
          { labelAr: "الرسائل", labelEn: "Messages", href: "/employee/mail" },
          { labelAr: "واتساب CRM", labelEn: "WhatsApp CRM", href: "/employee/whatsapp-crm" },
          { labelAr: "دعم العملاء", labelEn: "Customer support", href: "/cs-chat" },
          { labelAr: "الاجتماعات", labelEn: "Meetings", href: "/admin/qmeet" },
        ],
      },
      {
        id: "finance",
        title: L ? "المالية والتقارير" : "Finance & reports",
        description: L ? "راجع الفواتير والتحصيل والتقارير المتاحة لدورك، واترك الاستثناءات للإدارة." : "Review invoices, collections, and role-appropriate reports. Escalate exceptions to management.",
        icon: Wallet,
        actionCandidates: [
          { labelAr: "النظرة المالية", labelEn: "Finance overview", href: "/admin/finance" },
          { labelAr: "التقارير", labelEn: "Reports", href: "/admin/analytics" },
          { labelAr: "تقارير المبيعات", labelEn: "Sales reports", href: "/admin/sales-reports" },
          { labelAr: "حقي المالي", labelEn: "My financials", href: "/employee/my-finance" },
          { labelAr: "الفواتير", labelEn: "Invoices", href: "/admin/invoices" },
        ],
      },
      {
        id: "tools",
        title: L ? "الأدوات والتنفيذ التقني" : "Tools & technical delivery",
        description: L ? "صانع الأنظمة والنشر وطلبات التعديل في مساحة مخصصة للفريق التقني." : "System building, deployment, and change requests for the technical team.",
        icon: Package,
        actionCandidates: [
          { labelAr: "صانع الأنظمة", labelEn: "System builder", href: "/employee/system-builder" },
          { labelAr: "نشر المشاريع", labelEn: "Deployment", href: "/employee/deployment-cloud" },
          { labelAr: "طلبات التعديل", labelEn: "Change requests", href: "/admin/mod-requests" },
        ],
      },
      {
        id: "administration",
        title: L ? "الفريق والإدارة" : "Team & administration",
        description: L ? "الموافقات والاستثناءات وإدارة الفريق وإعدادات التشغيل الحساسة للإدارة فقط." : "Approvals, exceptions, team management, and sensitive operational settings.",
        icon: Settings2,
        actionCandidates: [
          { labelAr: "الفريق", labelEn: "Team", href: "/admin/employees" },
          { labelAr: "إعدادات النظام", labelEn: "System settings", href: "/admin/settings" },
          { labelAr: "الأدوار والصلاحيات", labelEn: "Roles & permissions", href: "/admin/roles" },
        ],
      },
    ];

    return definitions.flatMap(definition => {
      const actions = definition.actionCandidates
        .filter(candidate => allowedHrefs.has(candidate.href))
        .slice(0, 2)
        .map(candidate => ({
          label: L ? candidate.labelAr : candidate.labelEn,
          href: candidate.href,
        }));
      if (actions.length === 0) return [];
      return [{
        id: definition.id,
        title: definition.title,
        description: definition.description,
        icon: definition.icon,
        href: actions[0].href,
        actions,
      }];
    });
  }, [L, role, user?.allowedPages]);

  return (
    <main className="min-h-screen bg-[#f6f6f6] dark:bg-gray-950 px-4 py-6 sm:px-6 md:px-8" dir={dir}>
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between mb-7">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-black/40 dark:text-white/40 mb-3">
              <LayoutDashboard className="w-4 h-4" />
              <span>{L ? "مساحات العمل" : "Workspaces"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black dark:text-white">
              {L ? "ابدأ من المكان الصحيح" : "Start in the right place"}
            </h1>
            <p className="text-sm text-black/50 dark:text-white/45 mt-2 max-w-2xl leading-7">
              {L ? "مراكز قليلة بدل قوائم طويلة. اختر المجال الذي تعمل عليه الآن، وستجد الخطوة التالية واضحة." : "A few focused workspaces instead of a long menu. Choose what you are working on and the next step stays clear."}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-black/45 dark:text-white/45">{L ? "الدور الحالي" : "Current role"}</span>
            <span className="rounded-full bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 text-xs font-bold">{L ? roleLabel[0] : roleLabel[1]}</span>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {workspaces.map(workspace => (
            <article key={workspace.id} className="bg-white dark:bg-gray-900 border border-black/[0.07] dark:border-white/[0.08] rounded-2xl p-5 flex flex-col min-h-[214px]">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-black/[0.05] dark:bg-white/[0.07] flex items-center justify-center">
                  <workspace.icon className="w-5 h-5 text-black/65 dark:text-white/65" />
                </div>
                {workspace.id === "communication" && unread > 0 && (
                  <span className="text-[11px] font-bold rounded-full px-2 py-1 bg-black/[0.06] dark:bg-white/[0.08] text-black/60 dark:text-white/60">
                    {unread} {L ? "غير مقروءة" : "unread"}
                  </span>
                )}
                {workspace.id === "projects" && pendingTasks > 0 && (
                  <span className="text-[11px] font-bold rounded-full px-2 py-1 bg-black/[0.06] dark:bg-white/[0.08] text-black/60 dark:text-white/60">
                    {pendingTasks} {L ? "مهام مفتوحة" : "open tasks"}
                  </span>
                )}
              </div>
              <h2 className="font-black text-base text-black dark:text-white">{workspace.title}</h2>
              <p className="text-xs text-black/45 dark:text-white/45 leading-6 mt-2 flex-1">{workspace.description}</p>
              <div className="flex items-center gap-2 mt-5 pt-4 border-t border-black/[0.06] dark:border-white/[0.07]">
                {workspace.actions.map((action, index) => (
                  <Link key={action.href} href={action.href} className={`flex items-center gap-1.5 text-xs font-bold rounded-lg px-2.5 py-2 transition-colors ${index === 0 ? "bg-black text-white dark:bg-white dark:text-black" : "text-black/50 dark:text-white/45 hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"}`}>
                    {action.label}
                    {index === 0 && <ArrowLeft className="w-3.5 h-3.5" />}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </section>

        <div className="mt-5 flex items-center gap-2 rounded-xl border border-black/[0.06] dark:border-white/[0.07] bg-white/60 dark:bg-white/[0.03] px-4 py-3 text-xs text-black/45 dark:text-white/40">
          <CheckSquare className="w-4 h-4 shrink-0" />
          <span>{L ? "التشغيل اليومي يعتمد على الموافقات والاستثناءات فقط. استخدم «كل الأدوات والصفحات» للوصول إلى صفحة متخصصة عند الحاجة." : "Daily operations focus on approvals and exceptions. Use “All tools & pages” when you need a specialized page."}</span>
        </div>
      </div>
    </main>
  );
}