import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays, Check, Clock3, Eye, FileText, FolderOpen, Globe2,
  Loader2, Plus, Search, Server, Trash2, Users,
} from "lucide-react";

type DraftStatus = "draft" | "planning" | "ready";

const DRAFT_PROJECT_CREATOR_ROLES = new Set([
  "admin", "manager", "owner", "ceo", "cto", "employee", "developer", "designer",
  "support", "sales", "sales_manager", "marketing", "accountant", "data_entry",
  "hr", "merchant", "content",
]);

interface DraftProject {
  id: string;
  title: string;
  summary?: string;
  projectType?: string;
  sector?: string;
  status: DraftStatus;
  projectConcept?: string;
  targetAudience?: string;
  mainFeatures?: string;
  techStack?: string;
  framework?: string;
  language?: string;
  database?: string;
  databaseDesign?: string;
  hosting?: string;
  deploymentStrategy?: string;
  domain?: string;
  githubRepo?: string;
  stagingUrl?: string;
  productionUrl?: string;
  notes?: string;
  visibleTo: string[];
  promotedOrderId?: string | null;
  promotedProjectId?: string | null;
  promotedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface PromotableOrder {
  id: string;
  orderNumber: string;
  businessName: string;
  serviceType: string;
  status: string;
  createdAt?: string | null;
  projectId?: string | null;
}

interface PromotionResult {
  success?: boolean;
  pending?: boolean;
  alreadyPromoted?: boolean;
  draft?: DraftProject;
  projectId?: string;
  orderId?: string;
  orderNumber?: string;
  projectCreated?: boolean;
  message?: string;
}

interface Employee {
  id: string;
  fullName: string;
  username: string;
  role: string;
}

interface DraftProjectForm {
  title: string;
  summary: string;
  projectType: string;
  sector: string;
  status: DraftStatus;
  projectConcept: string;
  targetAudience: string;
  mainFeatures: string;
  techStack: string;
  framework: string;
  language: string;
  database: string;
  databaseDesign: string;
  hosting: string;
  deploymentStrategy: string;
  domain: string;
  githubRepo: string;
  stagingUrl: string;
  productionUrl: string;
  notes: string;
  visibleTo: string[];
}

const FIELDS: Array<{
  key: Exclude<keyof DraftProjectForm, "title" | "status" | "visibleTo">;
  ar: string;
  en: string;
  multiline?: boolean;
}> = [
  { key: "summary", ar: "ملخص المشروع", en: "Project summary", multiline: true },
  { key: "projectType", ar: "نوع المشروع", en: "Project type" },
  { key: "sector", ar: "القطاع", en: "Sector" },
  { key: "projectConcept", ar: "فكرة المشروع ونطاقه", en: "Concept and scope", multiline: true },
  { key: "targetAudience", ar: "الجمهور المستهدف", en: "Target audience", multiline: true },
  { key: "mainFeatures", ar: "الميزات الرئيسية", en: "Main features", multiline: true },
  { key: "techStack", ar: "التقنيات المستخدمة", en: "Tech stack" },
  { key: "framework", ar: "إطار العمل", en: "Framework" },
  { key: "language", ar: "لغة البرمجة", en: "Language" },
  { key: "database", ar: "قاعدة البيانات", en: "Database" },
  { key: "databaseDesign", ar: "تصميم قاعدة البيانات", en: "Database design", multiline: true },
  { key: "hosting", ar: "الاستضافة", en: "Hosting" },
  { key: "deploymentStrategy", ar: "خطة النشر", en: "Deployment strategy", multiline: true },
  { key: "domain", ar: "النطاق", en: "Domain" },
  { key: "githubRepo", ar: "مستودع GitHub", en: "GitHub repository" },
  { key: "stagingUrl", ar: "رابط التجربة", en: "Staging URL" },
  { key: "productionUrl", ar: "رابط الإنتاج", en: "Production URL" },
  { key: "notes", ar: "ملاحظات داخلية", en: "Internal notes", multiline: true },
];

function emptyForm(): DraftProjectForm {
  return {
    title: "",
    summary: "",
    projectType: "",
    sector: "",
    status: "draft",
    projectConcept: "",
    targetAudience: "",
    mainFeatures: "",
    techStack: "",
    framework: "",
    language: "",
    database: "",
    databaseDesign: "",
    hosting: "",
    deploymentStrategy: "",
    domain: "",
    githubRepo: "",
    stagingUrl: "",
    productionUrl: "",
    notes: "",
    visibleTo: [],
  };
}

function formFromProject(project: DraftProject): DraftProjectForm {
  const form = emptyForm();
  for (const key of Object.keys(form) as Array<keyof DraftProjectForm>) {
    if (key === "visibleTo") continue;
    const value = project[key as keyof DraftProject];
    if (key === "status") {
      form.status = value === "planning" || value === "ready" ? value : "draft";
    } else if (typeof value === "string") {
      (form as any)[key] = value;
    }
  }
  form.visibleTo = Array.isArray(project.visibleTo) ? project.visibleTo.map(String) : [];
  return form;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `HTTP ${response.status}`);
  }
  return payload as T;
}

function safeLink(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

export default function EmployeeDraftProjects() {
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const isCto = user?.role === "cto";
  const canCreateDraft = Boolean(user?.role && DRAFT_PROJECT_CREATOR_ROLES.has(user.role));
  const featureEnabled = import.meta.env.VITE_FEATURE_DRAFT_PROJECTS !== "false";

  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<DraftProject | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [promotionOpen, setPromotionOpen] = useState(false);
  const [promotionOrderId, setPromotionOrderId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DraftProjectForm>(emptyForm);

  const projectsQuery = useQuery<DraftProject[]>({
    queryKey: ["/api/draft-projects"],
    queryFn: () => requestJson<DraftProject[]>("/api/draft-projects"),
    enabled: !!user && featureEnabled,
    retry: 1,
  });
  const employeesQuery = useQuery<Employee[]>({
    queryKey: ["/api/draft-projects/employee-directory"],
    queryFn: () => requestJson<Employee[]>("/api/draft-projects/employee-directory"),
    enabled: !!user && isCto && featureEnabled,
    retry: false,
  });
  const promotableOrdersQuery = useQuery<PromotableOrder[]>({
    queryKey: ["/api/draft-projects/promotable-orders", selectedProject?.id],
    queryFn: () => requestJson<PromotableOrder[]>(
      `/api/draft-projects/promotable-orders?draftId=${encodeURIComponent(selectedProject?.id || "")}`,
    ),
    enabled: !!user && isCto && promotionOpen && featureEnabled,
    retry: false,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? `/api/draft-projects/${editingId}` : "/api/draft-projects";
      return requestJson<DraftProject>(url, {
        method,
        body: JSON.stringify(form),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/draft-projects"] });
      setEditorOpen(false);
      setEditingId(null);
      setForm(emptyForm());
      toast({ title: L ? "تم حفظ المشروع المسودة" : "Draft project saved" });
    },
    onError: (error: Error) => toast({
      title: L ? "تعذر حفظ المشروع" : "Could not save project",
      description: error.message,
      variant: "destructive",
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => requestJson<{ ok: true }>(`/api/draft-projects/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/draft-projects"] });
      setSelectedProject(null);
      setDetailOpen(false);
      toast({ title: L ? "تم حذف المشروع المسودة" : "Draft project deleted" });
    },
    onError: (error: Error) => toast({
      title: L ? "تعذر حذف المشروع" : "Could not delete project",
      description: error.message,
      variant: "destructive",
    }),
  });

  const promoteMutation = useMutation({
    mutationFn: (orderId: string) => requestJson<PromotionResult>(
      `/api/draft-projects/${selectedProject?.id}/promote`,
      { method: "POST", body: JSON.stringify({ orderId }) },
    ),
    onSuccess: result => {
      if (result.draft) setSelectedProject(result.draft);
      queryClient.invalidateQueries({ queryKey: ["/api/draft-projects"] });
      if (result.pending) {
        toast({
          title: L ? "إعداد المشروع جارٍ" : "Project setup is in progress",
          description: result.message || (L ? "أعد المحاولة بعد اكتمال التجهيز." : "Retry after provisioning finishes."),
        });
        return;
      }
      setPromotionOpen(false);
      setDetailOpen(true);
      toast({
        title: L ? "تم ربط المسودة بمشروع العميل" : "Draft linked to the client project",
        description: L
          ? "لم يتم إنشاء سجل إيراد أو تكلفة جديد."
          : "No new revenue or cost records were created.",
      });
    },
    onError: (error: Error) => toast({
      title: L ? "تعذر تحويل المسودة" : "Could not promote the draft",
      description: error.message,
      variant: "destructive",
    }),
  });

  const projects = projectsQuery.data || [];
  const filteredProjects = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return projects;
    return projects.filter((project) =>
      [project.title, project.projectType, project.sector, project.summary]
        .some((value) => String(value || "").toLocaleLowerCase().includes(term)),
    );
  }, [projects, search]);

  const statusMeta: Record<DraftStatus, { ar: string; en: string; classes: string; icon: typeof Clock3 }> = {
    draft: { ar: "مسودة", en: "Draft", classes: "bg-black/[0.04] text-black/55 border-black/[0.08]", icon: FileText },
    planning: { ar: "قيد التخطيط", en: "Planning", classes: "bg-amber-50 text-amber-700 border-amber-100", icon: Clock3 },
    ready: { ar: "جاهز للمراجعة", en: "Ready for review", classes: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: Check },
  };

  function openNewProject() {
    setEditingId(null);
    setForm(emptyForm());
    setEditorOpen(true);
  }

  function openEditProject(project: DraftProject) {
    setEditingId(project.id);
    setForm(formFromProject(project));
    setDetailOpen(false);
    setEditorOpen(true);
  }

  function openDetails(project: DraftProject) {
    setSelectedProject(project);
    setDetailOpen(true);
  }

  function openPromotion() {
    if (!selectedProject) return;
    setPromotionOrderId(selectedProject.promotedOrderId || "");
    setDetailOpen(false);
    setPromotionOpen(true);
  }

  function updateForm<K extends keyof DraftProjectForm>(key: K, value: DraftProjectForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleEmployee(employeeId: string) {
    setForm((current) => ({
      ...current,
      visibleTo: current.visibleTo.includes(employeeId)
        ? current.visibleTo.filter((id) => id !== employeeId)
        : [...current.visibleTo, employeeId],
    }));
  }

  function statusLabel(status: DraftStatus) {
    return L ? statusMeta[status].ar : statusMeta[status].en;
  }

  if (!featureEnabled) {
    return (
      <div className="p-8 text-center text-sm text-black/45" dir={dir}>
        {L ? "صفحة المشاريع المسودة غير مفعّلة حالياً." : "Draft projects are currently disabled."}
      </div>
    );
  }

  if (projectsQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" dir={dir}>
        <Loader2 className="h-8 w-8 animate-spin text-black/35" />
      </div>
    );
  }

  return (
    <div className="relative space-y-5 overflow-hidden" dir={dir}>
      <PageGraphics variant="dashboard" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-xl font-bold text-black">
            <FolderOpen className="h-6 w-6 text-black/45" />
            {L ? "المشاريع المسودة" : "Draft Projects"}
          </h1>
          <p className="mt-1 text-xs text-black/40">
            {L
              ? "مساحة مستقلة لحفظ أفكار وتفاصيل المشاريع، دون إنشاء مشروع عميل أو طلب نشط."
              : "A separate place to save project ideas and details without creating an active client project or order."}
          </p>
        </div>
        {canCreateDraft && (
          <Button onClick={openNewProject} className="h-9 gap-2 text-xs" data-testid="button-new-draft-project">
            <Plus className="h-4 w-4" />
            {L ? "مشروع مسودة جديد" : "New draft project"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {([
          { status: "draft" as const, icon: FileText },
          { status: "planning" as const, icon: Clock3 },
          { status: "ready" as const, icon: Check },
        ]).map(({ status, icon: Icon }) => (
          <div key={status} className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-white p-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/[0.04] text-black/55">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-black">{projects.filter((project) => project.status === status).length}</p>
              <p className="text-[11px] text-black/45">{statusLabel(status)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[220px] max-w-sm flex-1">
          <Search className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-black/30 ${L ? "right-3" : "left-3"}`} />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={L ? "ابحث بالاسم أو القطاع..." : "Search by name or sector..."}
            className={`${L ? "pr-9" : "pl-9"} h-9 border-black/10 text-xs`}
            data-testid="input-search-draft-projects"
          />
        </div>
        <span className="text-xs text-black/40">
          {L ? `${filteredProjects.length} مشروع` : `${filteredProjects.length} projects`}
        </span>
      </div>

      {projectsQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-semibold text-red-700">
            {L ? "تعذر تحميل المشاريع المسودة" : "Could not load draft projects"}
          </p>
          <p className="mt-1 text-xs text-red-600/80">{(projectsQuery.error as Error)?.message}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => projectsQuery.refetch()}>
            {L ? "إعادة المحاولة" : "Retry"}
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-black/[0.06] bg-black/[0.015]">
                  <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider text-black/40">{L ? "اسم المشروع" : "Project name"}</th>
                  <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider text-black/40">{L ? "النوع والقطاع" : "Type and sector"}</th>
                  <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider text-black/40">{L ? "الحالة" : "Status"}</th>
                  <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider text-black/40">{L ? "آخر تحديث" : "Last updated"}</th>
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-black/40">{L ? "عرض" : "View"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => {
                  const status = statusMeta[project.status] || statusMeta.draft;
                  const StatusIcon = status.icon;
                  return (
                    <tr key={project.id} className="border-b border-black/[0.035] transition-colors hover:bg-black/[0.02]" data-testid={`row-draft-project-${project.id}`}>
                      <td className="p-4">
                        <p className="text-sm font-semibold text-black">{project.title}</p>
                        {project.summary && <p className="mt-1 max-w-lg truncate text-[11px] text-black/40">{project.summary}</p>}
                      </td>
                      <td className="p-4">
                        <p className="text-xs text-black/65">{project.projectType || "—"}</p>
                        {project.sector && <p className="mt-1 text-[10px] text-black/35">{project.sector}</p>}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${status.classes}`}>
                          <StatusIcon className="h-3 w-3" />
                          {L ? status.ar : status.en}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-black/40">
                        {project.updatedAt
                          ? new Date(project.updatedAt).toLocaleDateString(L ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" })
                          : "—"}
                      </td>
                      <td className="p-4 text-left">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-black/55"
                          onClick={() => openDetails(project)}
                          title={L ? "عرض التفاصيل" : "View details"}
                          data-testid={`button-view-draft-project-${project.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <FileText className="mx-auto mb-3 h-10 w-10 text-black/10" />
                      <p className="text-sm text-black/45">
                        {search
                          ? (L ? "لا توجد نتائج مطابقة" : "No matching projects")
                          : (L ? "لا توجد مشاريع مسودة مخصصة لك حالياً" : "No draft projects are assigned to you yet")}
                      </p>
                      {isCto && projects.length === 0 && (
                        <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={openNewProject}>
                          <Plus className="h-3.5 w-3.5" />
                          {L ? "أضف أول مشروع مسودة" : "Add the first draft project"}
                        </Button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent dir={dir} className="max-h-[90vh] max-w-4xl overflow-y-auto">
          {selectedProject && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <FolderOpen className="h-5 w-5 text-black/45" />
                  {selectedProject.title}
                </DialogTitle>
                <DialogDescription>
                  {L ? "تفاصيل محفوظة في مساحة المسودات فقط." : "Details stored only in the draft workspace."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] ${statusMeta[selectedProject.status]?.classes || statusMeta.draft.classes}`}>
                    {statusLabel(selectedProject.status)}
                  </span>
                  {selectedProject.projectType && <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] text-black/60">{selectedProject.projectType}</span>}
                  {selectedProject.sector && <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] text-black/60">{selectedProject.sector}</span>}
                  {selectedProject.promotedProjectId && (
                    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700">
                      {L ? "مرتبط بمشروع عميل نشط" : "Linked to active client project"}
                    </span>
                  )}
                  {selectedProject.promotedOrderId && !selectedProject.promotedProjectId && (
                    <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[11px] text-amber-700">
                      {L ? "إعداد المشروع جارٍ" : "Project setup in progress"}
                    </span>
                  )}
                </div>
                {selectedProject.promotedProjectId && (
                  <section className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 text-xs text-emerald-900">
                    <p className="font-semibold">{L ? "ارتباط المشروع" : "Project link"}</p>
                    <p className="mt-1 break-all text-emerald-800/75">
                      {L ? "معرّف الطلب:" : "Order ID:"} {selectedProject.promotedOrderId || "—"}
                    </p>
                    <p className="mt-1 break-all text-emerald-800/75">
                      {L ? "معرّف المشروع:" : "Project ID:"} {selectedProject.promotedProjectId}
                    </p>
                    <p className="mt-1 text-emerald-800/70">
                      {L ? "لم تُنشأ أو تُعدّل سجلات الإيراد أو التكلفة عند الربط." : "Linking did not create or change revenue or cost records."}
                    </p>
                  </section>
                )}
                {isCto && (
                  <div className="flex flex-wrap gap-2 border-b border-black/[0.06] pb-4">
                    <Button size="sm" variant="outline" onClick={() => openEditProject(selectedProject)}>
                      {L ? "تعديل المسودة" : "Edit draft"}
                    </Button>
                    {selectedProject.status === "ready" && !selectedProject.promotedProjectId && (
                      <Button size="sm" variant="outline" onClick={openPromotion}>
                        {selectedProject.promotedOrderId
                          ? (L ? "متابعة تحويل المسودة" : "Continue promotion")
                          : (L ? "تحويل إلى مشروع عميل" : "Promote to client project")}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-red-600 hover:text-red-700"
                      disabled={deleteMutation.isPending || Boolean(selectedProject.promotedOrderId)}
                      onClick={() => {
                        if (window.confirm(L
                          ? "سيتم حذف هذه المسودة فقط، ولن يتأثر أي مشروع عميل نشط. هل تريد المتابعة؟"
                          : "This deletes only this draft; active client projects are not affected. Continue?")) {
                          deleteMutation.mutate(selectedProject.id);
                        }
                      }}
                    >
                      {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      {L ? "حذف المسودة" : "Delete draft"}
                    </Button>
                  </div>
                )}
                {selectedProject.summary && (
                  <section>
                    <h3 className="mb-1.5 text-xs font-semibold text-black/55">{L ? "ملخص المشروع" : "Project summary"}</h3>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-black/75">{selectedProject.summary}</p>
                  </section>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  {FIELDS.filter((field) => field.key !== "summary").map((field) => {
                    const value = String(selectedProject[field.key] || "").trim();
                    if (!value) return null;
                    const url = ["githubRepo", "stagingUrl", "productionUrl"].includes(field.key) ? safeLink(value) : null;
                    return (
                      <section key={field.key} className="rounded-xl border border-black/[0.06] p-3.5">
                        <h3 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-black/45">
                          {field.key === "domain" ? <Globe2 className="h-3.5 w-3.5" /> : null}
                          {field.key === "hosting" || field.key === "deploymentStrategy" ? <Server className="h-3.5 w-3.5" /> : null}
                          {L ? field.ar : field.en}
                        </h3>
                        {url ? (
                          <a href={url} target="_blank" rel="noreferrer" className="break-all text-sm text-blue-700 underline underline-offset-2">{value}</a>
                        ) : (
                          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-black/75">{value}</p>
                        )}
                      </section>
                    );
                  })}
                </div>
                {isCto && (
                  <section className="rounded-xl border border-black/[0.06] p-3.5">
                    <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-black/45">
                      <Users className="h-3.5 w-3.5" />
                      {L ? "الموظفون المسموح لهم" : "Employees with access"}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedProject.visibleTo || []).map((id) => {
                        const employee = employeesQuery.data?.find((entry) => entry.id === id);
                        return (
                          <span key={id} className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] text-black/60">
                            {employee?.fullName || employee?.username || id}
                          </span>
                        );
                      })}
                      {(selectedProject.visibleTo || []).length === 0 && (
                        <span className="text-xs text-black/35">{L ? "لا يوجد موظفون محددون" : "No employees assigned"}</span>
                      )}
                    </div>
                  </section>
                )}
                <div className="flex items-center gap-1.5 text-[10px] text-black/30">
                  <CalendarDays className="h-3 w-3" />
                  {L ? "آخر تحديث:" : "Updated:"}{" "}
                  {selectedProject.updatedAt ? new Date(selectedProject.updatedAt).toLocaleString(L ? "ar-SA" : "en-US") : "—"}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={promotionOpen} onOpenChange={(open) => {
        setPromotionOpen(open);
        if (!open) setPromotionOrderId("");
      }}>
        <DialogContent dir={dir} className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{L ? "تحويل المسودة إلى مشروع عميل" : "Promote draft to client project"}</DialogTitle>
            <DialogDescription>
              {L
                ? "اختر طلباً معتمداً للعميل. سيُربط المشروع بهذا الطلب دون إنشاء أو تعديل الإيرادات أو الهوامش أو المصروفات."
                : "Choose an approved client order. The project will use that order without creating or changing revenue, margin, or expense records."}
            </DialogDescription>
          </DialogHeader>
          {promotableOrdersQuery.isLoading ? (
            <div className="flex items-center gap-2 py-5 text-sm text-black/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              {L ? "جارٍ تحميل الطلبات المعتمدة..." : "Loading approved orders..."}
            </div>
          ) : promotableOrdersQuery.isError ? (
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <p>{(promotableOrdersQuery.error as Error)?.message || (L ? "تعذر تحميل الطلبات." : "Could not load orders.")}</p>
              <Button size="sm" variant="outline" onClick={() => promotableOrdersQuery.refetch()}>
                {L ? "إعادة المحاولة" : "Retry"}
              </Button>
            </div>
          ) : promotableOrdersQuery.data?.length ? (
            <div className="space-y-2">
              <Label>{L ? "الطلب المعتمد" : "Approved order"}</Label>
              <Select value={promotionOrderId} onValueChange={setPromotionOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder={L ? "اختر طلباً" : "Select an order"} />
                </SelectTrigger>
                <SelectContent>
                  {promotableOrdersQuery.data.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.orderNumber ? `#${order.orderNumber}` : `#${order.id.slice(-8)}`}
                      {" · "}
                      {order.businessName || order.serviceType || (L ? "نشاط غير مسمّى" : "Unnamed business")}
                      {order.projectId ? (L ? " · مشروع موجود" : " · project exists") : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="rounded-lg border border-black/[0.06] bg-black/[0.02] p-4 text-sm text-black/55">
              {L ? "لا توجد طلبات معتمدة متاحة للربط." : "No approved orders are available to link."}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t border-black/[0.06] pt-4">
            <Button variant="outline" onClick={() => setPromotionOpen(false)}>
              {L ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              disabled={!promotionOrderId || promoteMutation.isPending || promotableOrdersQuery.isError}
              onClick={() => promoteMutation.mutate(promotionOrderId)}
              className="gap-2"
            >
              {promoteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {L ? "ربط بالطلب المعتمد" : "Link approved order"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editorOpen} onOpenChange={(open) => {
        setEditorOpen(open);
        if (!open) {
          setEditingId(null);
          setForm(emptyForm());
        }
      }}>
        <DialogContent dir={dir} className="max-h-[92vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? (L ? "تعديل مشروع مسودة" : "Edit draft project") : (L ? "مشروع مسودة جديد" : "New draft project")}</DialogTitle>
            <DialogDescription>
              {L ? "هذه البيانات لن تنشئ طلباً أو مشروع عميل نشطاً." : "Saving this will not create an order or active client project."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(); }} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="draft-title">{L ? "اسم المشروع *" : "Project name *"}</Label>
                <Input
                  id="draft-title"
                  autoFocus
                  maxLength={200}
                  required
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  placeholder={L ? "مثال: منصة إدارة العيادات" : "e.g. Clinic management platform"}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{L ? "حالة المسودة" : "Draft status"}</Label>
                <Select value={form.status} onValueChange={(value) => updateForm("status", value as DraftStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{L ? "مسودة" : "Draft"}</SelectItem>
                    <SelectItem value="planning">{L ? "قيد التخطيط" : "Planning"}</SelectItem>
                    <SelectItem value="ready">{L ? "جاهز للمراجعة" : "Ready for review"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {FIELDS.filter((field) => field.key === "projectType" || field.key === "sector").map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label htmlFor={`draft-${field.key}`}>{L ? field.ar : field.en}</Label>
                  <Input
                    id={`draft-${field.key}`}
                    value={form[field.key]}
                    onChange={(event) => updateForm(field.key, event.target.value)}
                    maxLength={field.key === "projectType" || field.key === "sector" ? 120 : undefined}
                  />
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.filter((field) => !["projectType", "sector"].includes(field.key)).map((field) => (
                <div key={field.key} className={`space-y-1.5 ${field.multiline ? "sm:col-span-2" : ""}`}>
                  <Label htmlFor={`draft-${field.key}`}>{L ? field.ar : field.en}</Label>
                  {field.multiline ? (
                    <Textarea
                      id={`draft-${field.key}`}
                      rows={field.key === "notes" || field.key === "projectConcept" || field.key === "mainFeatures" ? 4 : 3}
                      value={form[field.key]}
                      onChange={(event) => updateForm(field.key, event.target.value)}
                      className="resize-y"
                    />
                  ) : (
                    <Input
                      id={`draft-${field.key}`}
                      value={form[field.key]}
                      onChange={(event) => updateForm(field.key, event.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>

            <section className="rounded-xl border border-black/[0.07] p-3.5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-black">
                    <Users className="h-4 w-4 text-black/45" />
                    {L ? "من يمكنه مشاهدة هذه المسودة؟" : "Who can view this draft?"}
                  </h3>
                  <p className="mt-1 text-[11px] text-black/40">
                    {L ? "الموظفون المحددون يمكنهم العرض فقط؛ التحكم والتعديل للـCTO." : "Selected employees can view only; the CTO retains management access."}
                  </p>
                </div>
                <span className="text-[11px] text-black/40">
                  {L ? `${form.visibleTo.length} محدد` : `${form.visibleTo.length} selected`}
                </span>
              </div>
              {employeesQuery.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-black/35" />
              ) : employeesQuery.isError ? (
                <p className="text-xs text-red-600">{L ? "تعذر تحميل قائمة الموظفين." : "Could not load employees."}</p>
              ) : employeesQuery.data?.length ? (
                <div className="grid max-h-52 gap-1 overflow-y-auto sm:grid-cols-2">
                  {employeesQuery.data.map((employee) => (
                    <label key={employee.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs text-black/70 hover:bg-black/[0.035]">
                      <input
                        type="checkbox"
                        checked={form.visibleTo.includes(employee.id)}
                        onChange={() => toggleEmployee(employee.id)}
                        className="h-4 w-4 accent-black"
                      />
                      <span className="min-w-0 flex-1 truncate">{employee.fullName || employee.username}</span>
                      <span className="text-[10px] text-black/35">{employee.role}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-black/40">{L ? "لا يوجد موظفون متاحون." : "No employees available."}</p>
              )}
            </section>

            <div className="flex justify-end gap-2 border-t border-black/[0.06] pt-4">
              <Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>
                {L ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" disabled={saveMutation.isPending || !form.title.trim()} className="gap-2">
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {L ? "حفظ المسودة" : "Save draft"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}