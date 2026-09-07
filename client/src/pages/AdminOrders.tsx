import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useQuery, useMutation } from "@tanstack/react-query";
import SARIcon from "@/components/SARIcon";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, CheckCircle, XCircle, Eye, UserCheck, FolderPlus, Briefcase, Layers, Server, Globe, Save, Link2, ExternalLink, Phone, Mail, Shield, Download, Upload, CreditCard, TrendingUp, TrendingDown, PlusCircle, Trash2, DollarSign, BarChart3, PhoneOff, Send, Package, Sparkles, ClipboardList, Wand2, RefreshCw, Check, ChevronDown, ChevronUp, FolderOpen, Building2, Hash, MapPin, FileUp, Paperclip, Users, User, Activity, Search } from "lucide-react";
import { SiWhatsapp, SiTelegram } from "react-icons/si";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import {
  canSaveGitHubVisibility,
  resetGitHubVisibilitySelection,
} from "@/lib/github-visibility-state";
import { ProjectIntegrationsPanel } from "@/components/ProjectIntegrationsPanel";
import ProjectSubscriptionCard from "@/components/ProjectSubscriptionCard";
import AdminProjectSubscriptionCell from "@/components/AdminProjectSubscriptionCell";

interface Employee {
  id: string;
  fullName: string;
  username: string;
  role: string;
}

interface OrderData {
  id: string;
  userId: string;
  serviceId?: string;
  status: string;
  totalAmount?: number;
  paymentMethod?: string;
  paymentProofUrl?: string;
  paymentStatus?: string;
  paymentRejectionReason?: string;
  isDepositPaid?: boolean;
  walletAmountUsed?: number;
  shippingCompanyId?: string;
  shippingCompanyName?: string;
  shippingFee?: number;
  projectType?: string;
  sector?: string;
  orderNumber?: string;
  createdAt?: string;
  assignedTo?: string;
  assignedToIds?: string[];
  adminNotes?: string;
  requiredFunctions?: string;
  whatsappIntegration?: boolean;
  socialIntegration?: boolean;
  hasLogo?: boolean;
  hasHosting?: boolean;
  hasDomain?: boolean;
  businessName?: string;
  visualStyle?: string;
  siteLanguage?: string;
  targetAudience?: string;
  competitors?: string;
  sectorFeatures?: string[];
  projectId?: string;
  projectSubscription?: any;
  projectSubscriptionRenewalRequest?: any;
  client?: {
    fullName?: string;
    username?: string;
    email?: string;
    phone?: string;
    taxNumber?: string;
    organizationName?: string;
    commercialRegistration?: string;
    nationalAddress?: string;
    address?: string;
    city?: string;
  };
}

function getOrderAssigneeIds(order: Pick<OrderData, "assignedTo" | "assignedToIds"> | any): string[] {
  const legacy = order?.assignedTo?._id || order?.assignedTo?.id || order?.assignedTo;
  const ids = Array.isArray(order?.assignedToIds) ? order.assignedToIds : [];
  return [...new Set([legacy, ...ids].filter(Boolean).map(String))];
}

function getStatusMap(L: boolean): Record<string, { label: string; color: string }> { return {
  pending: { label: L ? "قيد المراجعة" : "Under Review", color: "bg-black dark:bg-white text-black dark:text-white border-black dark:border-white" },
  approved: { label: L ? "تمت الموافقة" : "Approved", color: "bg-black dark:bg-white text-black dark:text-white border-black dark:border-white" },
  in_progress: { label: L ? "قيد التنفيذ" : "In Progress", color: "bg-black dark:bg-white text-black dark:text-white border-black dark:border-white" },
  completed: { label: L ? "مكتمل" : "Completed", color: "bg-black/[0.06] text-black/60 border-black/[0.08]" },
  cancelled: { label: L ? "ملغي" : "Cancelled", color: "bg-black dark:bg-white text-black dark:text-white border-black dark:border-white" },
  rejected: { label: L ? "مرفوض" : "Rejected", color: "bg-black dark:bg-white text-black dark:text-white border-black dark:border-white" },
};
}

function getPaymentMethods(L: boolean): Record<string, string> { return {
  bank_transfer: L ? "تحويل بنكي" : "Bank Transfer",
  paypal: "PayPal",
  cash: L ? "نقدي" : "Cash",
  wallet: L ? "محفظة كيروكس باي" : "Qirox Pay Wallet",
  mixed: L ? "محفظة + تحويل بنكي" : "Wallet + Bank Transfer",
};
}

function getRoleLabels(L: boolean): Record<string, string> { return {
  admin: L ? "مدير النظام" : "System Admin", manager: L ? "مدير" : "Manager", developer: L ? "مطور" : "Developer",
  designer: L ? "مصمم" : "Designer", support: L ? "دعم" : "Support", sales: L ? "مبيعات" : "Sales",
  sales_manager: L ? "مدير مبيعات" : "Sales Manager", accountant: L ? "محاسب" : "Accountant",
};
}

function getActionableError(error: any, L: boolean) {
  const missingFields = Array.isArray(error?.missingFields) ? error.missingFields : [];
  const solutions = Array.isArray(error?.solutions) ? error.solutions : [];
  if (!missingFields.length && !solutions.length) {
    return {
      title: error?.message || (L ? "تعذر تنفيذ العملية" : "Unable to complete the action"),
      description: undefined,
    };
  }
  const missingText = missingFields
    .map((field: any) => `${field.label}${field.detail ? `: ${field.detail}` : ""}`)
    .join(" • ");
  const solutionText = solutions.join(" • ");
  return {
    title: error?.message || (L ? "لا يمكن تنفيذ العملية بسبب بيانات ناقصة" : "The action needs more data"),
    description: [
      missingText ? `${L ? "الناقص" : "Missing"}: ${missingText}` : "",
      solutionText ? `${L ? "الحل" : "Fix"}: ${solutionText}` : "",
    ].filter(Boolean).join(" | "),
  };
}

const EMPTY_SPECS = {
  projectName: "", clientEmail: "", totalBudget: "", paidAmount: "",
  projectStatus: "planning", techStack: "", database: "", hosting: "",
  framework: "", language: "", githubRepoUrl: "", databaseUri: "",
  serverIp: "", deploymentUsername: "", deploymentPassword: "",
  customDomain: "", stagingUrl: "", productionUrl: "",
  sslEnabled: false, cdnEnabled: false, domain: "", variables: "",
  projectConcept: "", targetAudience: "", mainFeatures: "", referenceLinks: "",
  colorPalette: "", estimatedHours: "", deadline: "", startDate: "",
  notes: "", teamNotes: "",
};

export default function AdminOrders() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const { data: currentUser } = useQuery<any>({ queryKey: ["/api/user"] });
  const canSeeFinance = ["admin", "manager", "owner", "accountant"].includes(currentUser?.role || "");
  const canManageProjectSubscriptions = ["admin", "manager"].includes(currentUser?.role || "");
  const isDataEntry = currentUser?.role === "data_entry";
  const statusMap = getStatusMap(L);
  const paymentMethods = getPaymentMethods(L);
  const roleLabels = getRoleLabels(L);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [editStatus, setEditStatus] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editAssignedToIds, setEditAssignedToIds] = useState<string[]>([]);
  const [assigneeMenuOpen, setAssigneeMenuOpen] = useState(false);
  const [editAdminNotes, setEditAdminNotes] = useState("");
  const [editProgress, setEditProgress] = useState(0);
  const [editPriority, setEditPriority] = useState("medium");
  const [githubVisibility, setGithubVisibility] = useState<"public" | "private">("private");
  const [githubVisibilityOrderId, setGithubVisibilityOrderId] = useState<string | null>(null);
  const [githubMigrationTarget, setGithubMigrationTarget] = useState("");
  const [githubRepositoryAction, setGithubRepositoryAction] = useState<"move" | "import">("move");
  const [aiChecklist, setAiChecklist] = useState<{ name: string; tasks: string[] }[]>([]);
  const [aiChecklistLoading, setAiChecklistLoading] = useState(false);
  const [aiChecklistExpanded, setAiChecklistExpanded] = useState<Record<number, boolean>>({});
  const [aiChecklistDone, setAiChecklistDone] = useState<Record<string, boolean>>({});
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [sendMsgOpen, setSendMsgOpen] = useState(false);
  const [sendMsgText, setSendMsgText] = useState("");
  const [specsForm, setSpecsForm] = useState({ ...EMPTY_SPECS });
  const [newExpense, setNewExpense] = useState({ category: "other", description: "", amount: "" });
  const [guideForm, setGuideForm] = useState({ title: "شرح استخدام النظام", description: "", files: "" });
  const [deliveryForm, setDeliveryForm] = useState({ videoUrl: "", files: "" });
  const formInitializedForOrder = useRef<string | null>(null);
  const [phoneReqOpen, setPhoneReqOpen] = useState(false);
  const [phoneReqNotes, setPhoneReqNotes] = useState("");
  const [rejectTransferOpen, setRejectTransferOpen] = useState(false);
  const [rejectTransferReason, setRejectTransferReason] = useState("");
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editProjectForm, setEditProjectForm] = useState({
    businessName: "", projectType: "", sector: "", status: "", adminNotes: "", totalAmount: "",
  });
  const [newProjectFile, setNewProjectFile] = useState({ title: "", url: "", fileType: "custom" });
  const [projectFileUploading, setProjectFileUploading] = useState(false);
  const projectCodeUploadRef = useRef<HTMLInputElement>(null);
  const [newTeamMemberId, setNewTeamMemberId] = useState("");
  const [newTeamMemberRole, setNewTeamMemberRole] = useState("");
  const [adjustingProjectId, setAdjustingProjectId] = useState<string | null>(null);
  const [subscriptionForm, setSubscriptionForm] = useState({
    period: "annual",
    startMode: "project_completion",
    startDate: "",
    amount: "",
    paymentStatus: "paid",
    dueDate: "",
    notes: "",
  });
  const currentUserId = currentUser?.id || currentUser?._id;
  const selectedOrderAssigneeIds = getOrderAssigneeIds(selectedOrder);
  const isAssignedDataEntry = isDataEntry
    && selectedOrderAssigneeIds.includes(String(currentUserId || ""));
  const canEditProjectSecrets = !isDataEntry || isAssignedDataEntry;
  const [addonForm, setAddonForm] = useState({
    addonId: "",
    amount: "",
    paymentStatus: "paid",
    dueDate: "",
    quotaTotal: "",
  });

  const { data: orders, isLoading } = useQuery<OrderData[]>({
    queryKey: ["/api/admin/orders"]
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"]
  });

  const { data: selectedOrderSpecs, isLoading: isLoadingSpecs } = useQuery<any>({
    queryKey: ['/api/admin/orders', selectedOrder?.id, 'specs'],
    enabled: !!selectedOrder?.id,
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders/${selectedOrder!.id}/specs`, { credentials: "include" });
      return res.json();
    },
  });

  const { data: orderProject } = useQuery<any>({
    queryKey: ['/api/admin/orders', selectedOrder?.id, 'project'],
    enabled: !!selectedOrder?.id,
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders/${selectedOrder!.id}/project`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: projectAddonSubscriptions = [] } = useQuery<any[]>({
    queryKey: ['/api/projects', orderProject?.id, 'addon-subscriptions'],
    enabled: !!orderProject?.id,
    queryFn: async () => {
      const res = await fetch(`/api/projects/${orderProject!.id}/addon-subscriptions`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: extraAddons = [] } = useQuery<any[]>({
    queryKey: ["/api/extra-addons"],
    enabled: !!selectedOrder?.id,
    queryFn: async () => {
      const res = await fetch("/api/extra-addons", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const {
    data: githubSetup,
    isLoading: isLoadingGithubSetup,
    isFetching: isFetchingGithubSetup,
    isSuccess: isGithubSetupSuccess,
  } = useQuery<any>({
    queryKey: ['/api/admin/orders', selectedOrder?.id, 'github'],
    enabled: !!selectedOrder?.id && ["admin", "manager"].includes(currentUser?.role || ""),
    placeholderData: undefined,
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders/${selectedOrder!.id}/github`, { credentials: "include" });
      if (!res.ok) throw new Error("تعذر تحميل حالة GitHub");
      return res.json();
    },
  });

  const { data: githubCode, isLoading: isLoadingGithubCode, isFetching: isFetchingGithubCode } = useQuery<any>({
    queryKey: ['/api/admin/orders', selectedOrder?.id, 'github', 'code'],
    enabled: !!selectedOrder?.id && !!orderProject?.id && ["admin", "manager"].includes(currentUser?.role || ""),
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders/${selectedOrder!.id}/github/code`, { credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || (L ? "تعذر قراءة أكواد المشروع" : "Unable to read project code"));
      }
      return res.json();
    },
    retry: false,
  });

  const { data: projectMembers } = useQuery<any[]>({
    queryKey: ['/api/projects', orderProject?.id, 'members'],
    enabled: !!orderProject?.id,
    queryFn: async () => {
      const res = await fetch(`/api/projects/${orderProject!.id}/members`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const addTeamMemberMutation = useMutation({
    mutationFn: ({ projectId, userId, role }: { projectId: string; userId: string; role: string }) =>
      apiRequest("POST", `/api/projects/${projectId}/members`, { userId, role }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', orderProject?.id, 'members'] });
      setNewTeamMemberId("");
      setNewTeamMemberRole("");
      toast({ title: L ? "✅ تم إضافة العضو" : "✅ Member added" });
    },
    onError: () => toast({ title: L ? "فشل إضافة العضو" : "Failed to add member", variant: "destructive" }),
  });

  const removeTeamMemberMutation = useMutation({
    mutationFn: ({ projectId, memberId }: { projectId: string; memberId: string }) =>
      apiRequest("DELETE", `/api/projects/${projectId}/members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', orderProject?.id, 'members'] });
      toast({ title: L ? "تم إزالة العضو" : "Member removed" });
    },
    onError: () => toast({ title: L ? "فشل إزالة العضو" : "Failed to remove member", variant: "destructive" }),
  });

  // Reset "initialized" flag whenever the selected order changes so forms reload for the new order
  useEffect(() => {
    formInitializedForOrder.current = null;
    const reset = resetGitHubVisibilitySelection();
    setGithubVisibility(reset.visibility);
    setGithubVisibilityOrderId(reset.loadedOrderId);
  }, [selectedOrder?.id]);

  useEffect(() => {
    if (!selectedOrder?.id) return;
    const existingPeriod = orderProject?.subscription?.period || (selectedOrder as any).planPeriod || "annual";
    const projectIsComplete = orderProject?.status === "closed" || !!orderProject?.deliveredAt;
    setSubscriptionForm((current) => ({
      ...current,
      period: ["monthly", "6months", "annual", "lifetime"].includes(existingPeriod) ? existingPeriod : "annual",
      startMode: projectIsComplete ? "project_completion" : "project_start",
      startDate: "",
      amount: "",
      paymentStatus: "paid",
      dueDate: "",
      notes: "",
    }));
  }, [selectedOrder?.id, orderProject?.subscription?.period, orderProject?.status, orderProject?.deliveredAt]);

  // Only initialize guide/delivery forms once per order (not on background refetches)
  useEffect(() => {
    if (!selectedOrder?.id || orderProject === undefined) return;
    if (formInitializedForOrder.current === selectedOrder.id) return;
    formInitializedForOrder.current = selectedOrder.id;
    if (orderProject?.usageGuide) {
      setGuideForm({
        title: orderProject.usageGuide.title || "شرح استخدام النظام",
        description: orderProject.usageGuide.description || "",
        files: (orderProject.usageGuide.files || []).join("\n"),
      });
    } else {
      setGuideForm({ title: "شرح استخدام النظام", description: "", files: "" });
    }
    setDeliveryForm({
      videoUrl: orderProject?.deliveryVideoUrl || "",
      files: Array.isArray(orderProject?.deliveryFiles)
        ? orderProject.deliveryFiles.map((f: any) => `${f.nameAr || ""}|${f.url || ""}|${f.icon || ""}`).join("\n")
        : "",
    });
  }, [orderProject, selectedOrder?.id]);

  useEffect(() => {
    if (selectedOrderSpecs) {
      const s = selectedOrderSpecs;
      setSpecsForm({
        projectName: s.projectName || "",
        clientEmail: s.clientEmail || "",
        totalBudget: s.totalBudget?.toString() || "",
        paidAmount: s.paidAmount?.toString() || "",
        projectStatus: s.projectStatus || "planning",
        techStack: s.techStack || "",
        database: s.database || "",
        hosting: s.hosting || "",
        framework: s.framework || "",
        language: s.language || "",
        githubRepoUrl: s.githubRepoUrl || "",
        databaseUri: s.databaseUri || "",
        serverIp: s.serverIp || "",
        deploymentUsername: s.deploymentUsername || "",
        deploymentPassword: s.deploymentPassword || "",
        customDomain: s.customDomain || "",
        stagingUrl: s.stagingUrl || "",
        productionUrl: s.productionUrl || "",
        sslEnabled: s.sslEnabled || false,
        cdnEnabled: s.cdnEnabled || false,
        domain: s.domain || "",
        variables: s.variables || "",
        projectConcept: s.projectConcept || "",
        targetAudience: s.targetAudience || "",
        mainFeatures: s.mainFeatures || "",
        referenceLinks: s.referenceLinks || "",
        colorPalette: s.colorPalette || "",
        estimatedHours: s.estimatedHours?.toString() || "",
        deadline: s.deadline ? new Date(s.deadline).toISOString().split('T')[0] : "",
        startDate: s.startDate ? new Date(s.startDate).toISOString().split('T')[0] : "",
        notes: s.notes || "",
        teamNotes: s.teamNotes || "",
      });
    }
  }, [selectedOrderSpecs]);

  useEffect(() => {
    if (
      selectedOrder?.id
      && isGithubSetupSuccess
      && !isFetchingGithubSetup
      && githubSetup?.repository?.visibility
    ) {
      setGithubVisibility(githubSetup.repository.visibility);
      setGithubVisibilityOrderId(selectedOrder.id);
    }
  }, [
    githubSetup?.repository?.visibility,
    isFetchingGithubSetup,
    isGithubSetupSuccess,
    selectedOrder?.id,
  ]);

  const isGithubVisibilityReady = canSaveGitHubVisibility(
    selectedOrder?.id,
    githubVisibilityOrderId,
    isGithubSetupSuccess,
    isFetchingGithubSetup,
  );

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const res = await apiRequest("PATCH", `/api/admin/orders/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'github'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'project'] });
      toast({ title: L ? "تم تحديث الطلب بنجاح" : "Order updated successfully" });
    },
    onError: () => toast({ title: L ? "خطأ في تحديث الطلب" : "Error updating order", variant: "destructive" }),
  });

  const adjustProjectSubscriptionMutation = useMutation({
    mutationFn: async ({ projectId, days }: { projectId: string; days: number }) => {
      const res = await apiRequest("PATCH", `/api/admin/projects/${projectId}/subscription/adjust`, { days });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || (L ? "تعذر تعديل مدة الاشتراك" : "Unable to adjust subscription"));
      }
      return res.json();
    },
    onMutate: (variables) => setAdjustingProjectId(variables.projectId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'project'] });
      toast({
        title: variables.days > 0
          ? (L ? `تمت زيادة الاشتراك ${variables.days} يوماً` : `Subscription extended by ${variables.days} days`)
          : (L ? `تم تقليل الاشتراك ${Math.abs(variables.days)} يوماً` : `Subscription reduced by ${Math.abs(variables.days)} days`),
      });
    },
    onError: (error: any) => toast({
      title: error?.message || (L ? "تعذر تعديل مدة الاشتراك" : "Unable to adjust subscription"),
      variant: "destructive",
    }),
    onSettled: () => setAdjustingProjectId(null),
  });

  const alignProjectSubscriptionMutation = useMutation({
    mutationFn: async ({ projectId }: { projectId: string }) => {
      const operationId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      const res = await apiRequest("PATCH", `/api/admin/projects/${projectId}/subscription/align-start`, { operationId });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || (L ? "تعذر تصحيح تاريخ بداية الاشتراك" : "Unable to align subscription start"));
      }
      return res.json();
    },
    onMutate: (variables) => setAdjustingProjectId(variables.projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'project'] });
      toast({
        title: L ? "تم تصحيح بداية الاشتراك" : "Subscription start corrected",
        description: L
          ? "تمت إعادة حساب تاريخ الانتهاء من تاريخ بداية المشروع بدون إنشاء فاتورة جديدة."
          : "The expiry was recalculated from the project start date without creating a new invoice.",
      });
    },
    onError: (error: any) => toast({
      title: error?.message || (L ? "تعذر تصحيح تاريخ بداية الاشتراك" : "Unable to align subscription start"),
      variant: "destructive",
    }),
    onSettled: () => setAdjustingProjectId(null),
  });

  const manageProjectSubscriptionMutation = useMutation({
    mutationFn: async ({ action, projectId, data }: { action: "start" | "renew"; projectId: string; data: Record<string, any> }) => {
      const operationId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      const res = await apiRequest("POST", `/api/admin/projects/${projectId}/subscription/${action}`, { ...data, operationId });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || (L ? "تعذر تحديث الاشتراك" : "Unable to update subscription"));
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'project'] });
      toast({
        title: variables.action === "start"
          ? (L ? "تم بدء اشتراك المشروع وإضافة الفاتورة" : "Project subscription started and invoice added")
          : (L ? "تم تجديد الاشتراك وإضافة الفاتورة" : "Subscription renewed and invoice added"),
        description: data?.clientRecovered
          ? (L
            ? `تم تلقائياً إنشاء حساب العميل وربطه بالطلب والمشروع بنفس البيانات والتاريخ${data.client?.email ? ` (${data.client.email})` : ""}.`
            : `The client account was automatically recovered and linked to the order and project using the original data and date${data.client?.email ? ` (${data.client.email})` : ""}.`)
          : undefined,
      });
    },
    onError: (error: any) => {
      const actionable = getActionableError(error, L);
      toast({
        title: actionable.title,
        description: actionable.description,
        variant: "destructive",
      });
    },
  });

  const addProjectAddonMutation = useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: Record<string, any> }) => {
      const operationId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      const res = await apiRequest("POST", `/api/projects/${projectId}/addon-subscriptions`, { ...data, operationId });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || (L ? "تعذر إضافة اشتراك الإضافة" : "Unable to add addon subscription"));
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', orderProject?.id, 'addon-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      setAddonForm({ addonId: "", amount: "", paymentStatus: "paid", dueDate: "", quotaTotal: "" });
      toast({ title: L ? "تمت إضافة الإضافة وإصدار الفاتورة" : "Addon added and invoice issued" });
    },
    onError: (error: any) => toast({
      title: error?.message || (L ? "تعذر إضافة اشتراك الإضافة" : "Unable to add addon subscription"),
      variant: "destructive",
    }),
  });

  const renewProjectAddonMutation = useMutation({
    mutationFn: async ({ projectId, subId, data }: { projectId: string; subId: string; data?: Record<string, any> }) => {
      const operationId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      const res = await apiRequest("POST", `/api/admin/projects/${projectId}/addon-subscriptions/${subId}/renew`, { ...(data || {}), operationId });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || (L ? "تعذر تجديد اشتراك الإضافة" : "Unable to renew addon subscription"));
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', orderProject?.id, 'addon-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: L ? "تم تجديد الإضافة وإضافة الفاتورة" : "Addon renewed and invoice added" });
    },
    onError: (error: any) => toast({
      title: error?.message || (L ? "تعذر تجديد اشتراك الإضافة" : "Unable to renew addon subscription"),
      variant: "destructive",
    }),
  });

  const saveSpecsMutation = useMutation({
    mutationFn: async (data: { orderId: string; specs: any }) => {
      const res = await apiRequest("PUT", `/api/admin/orders/${data.orderId}/specs`, data.specs);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'specs'] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: L ? "تم حفظ المواصفات التقنية ✓" : "Technical specs saved ✓" });
    },
    onError: () => toast({ title: L ? "خطأ في حفظ المواصفات" : "Error saving specs", variant: "destructive" }),
  });

  const { data: orderExpenses, isLoading: isLoadingExpenses } = useQuery<any[]>({
    queryKey: ['/api/admin/orders', selectedOrder?.id, 'expenses'],
    enabled: !!selectedOrder?.id,
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders/${selectedOrder!.id}/expenses`, { credentials: "include" });
      return res.json();
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (data: { category: string; description: string; amount: number }) => {
      const res = await apiRequest("POST", `/api/admin/orders/${selectedOrder!.id}/expenses`, data);
      if (!res.ok) throw new Error(L ? "فشل إضافة المصروف" : "Failed to add expense");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'expenses'] });
      setNewExpense({ category: "other", description: "", amount: "" });
      toast({ title: L ? "تم إضافة المصروف" : "Expense added" });
    },
    onError: () => toast({ title: L ? "خطأ في إضافة المصروف" : "Error adding expense", variant: "destructive" }),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      await apiRequest("DELETE", `/api/admin/expenses/${expenseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'expenses'] });
      toast({ title: L ? "تم حذف المصروف" : "Expense deleted" });
    },
    onError: () => toast({ title: L ? "فشل حذف المصروف" : "Delete failed", variant: "destructive" }),
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await apiRequest("DELETE", `/api/admin/orders/${id}`);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      setSelectedOrder(null);
      toast({ title: L ? "تم حذف المشروع/الطلب بنجاح" : "Project deleted successfully" });
    },
    onError: (e: any) => toast({ title: L ? "فشل الحذف" : "Delete failed", description: e.message, variant: "destructive" }),
  });

  const convertToProjectMutation = useMutation({
    mutationFn: async (order: OrderData) => {
      const res = await apiRequest("POST", `/api/admin/orders/${order.id}/provision`);
      return res.json();
    },
    onSuccess: (_data, order) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', order.id, 'project'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', order.id, 'specs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', order.id, 'github'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: L ? "تم تجهيز المشروع ومستودع GitHub" : "Project and GitHub repository provisioned" });
    },
    onError: (error: any) => toast({
      title: L ? "توقف تجهيز المستودع" : "Repository provisioning stopped",
      description: error?.message || (L ? "تحقق من اتصال GitHub ثم أعد المحاولة" : "Check the GitHub connection and retry"),
      variant: "destructive",
    }),
  });

  const githubVisibilityMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder || !isGithubVisibilityReady) {
        throw new Error(L ? "انتظر تحميل إعدادات GitHub للطلب المحدد" : "Wait for the selected order's GitHub settings to load");
      }
      const res = await apiRequest("PATCH", `/api/admin/orders/${selectedOrder.id}/github/settings`, {
        visibility: githubVisibility,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'github'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'specs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'project'] });
      toast({ title: L ? "تم حفظ رؤية المستودع" : "Repository visibility saved" });
    },
    onError: (error: any) => toast({
      title: L ? "تعذر حفظ رؤية المستودع" : "Could not save repository visibility",
      description: error?.message,
      variant: "destructive",
    }),
  });

  const githubMigrationMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder || !githubMigrationTarget.trim()) {
        throw new Error(L ? "أدخل رابط مستودع GitHub الجديد" : "Enter the new GitHub repository URL");
      }
      const res = await apiRequest("POST", `/api/admin/orders/${selectedOrder.id}/github/migrate`, {
        targetRepoUrl: githubMigrationTarget.trim(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || (L ? "فشل نقل ملفات المشروع" : "Project file migration failed"));
      }
      return res.json();
    },
    onSuccess: () => {
      setGithubMigrationTarget("");
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'github'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'project'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'specs'] });
      toast({ title: L ? "تم نقل ملفات المشروع وتحديث المستودع" : "Project files migrated and repository updated" });
    },
    onError: (error: any) => toast({
      title: error?.message || (L ? "فشل نقل ملفات المشروع" : "Project file migration failed"),
      variant: "destructive",
    }),
  });

  const githubImportMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder || !githubMigrationTarget.trim()) {
        throw new Error(L ? "أدخل رابط المستودع المراد استيراده" : "Enter the repository URL to import");
      }
      const res = await apiRequest("POST", `/api/admin/orders/${selectedOrder.id}/github/import`, {
        sourceRepoUrl: githubMigrationTarget.trim(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || (L ? "فشل استيراد المستودع" : "Repository import failed"));
      }
      return res.json();
    },
    onSuccess: () => {
      setGithubMigrationTarget("");
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'github'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'github', 'code'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'project'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'specs'] });
      toast({ title: L ? "تم استيراد المستودع وحفظه للمشروع" : "Repository imported and saved to the project" });
    },
    onError: (error: any) => toast({
      title: error?.message || (L ? "فشل استيراد المستودع" : "Repository import failed"),
      variant: "destructive",
    }),
  });

  const phoneReqMutation = useMutation({
    mutationFn: (data: { clientId: string; notes: string }) =>
      apiRequest("POST", "/api/phone-requests", data),
    onSuccess: () => {
      toast({ title: L ? "تم رفع طلب تصحيح الرقم" : "Phone correction request submitted", description: L ? "سيتم مراجعته من المسؤول قريباً" : "It will be reviewed by the admin shortly" });
      setPhoneReqOpen(false);
      setPhoneReqNotes("");
    },
    onError: (err: any) => toast({ title: L ? "فشل رفع الطلب" : "Failed to submit request", description: err.message, variant: "destructive" }),
  });

  const saveGuideMutation = useMutation({
    mutationFn: async ({ projectId, guide }: { projectId: string; guide: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/projects/${projectId}/usage-guide`, guide);
      return res.json();
    },
    onSuccess: () => {
      formInitializedForOrder.current = null; // allow form to re-init with saved data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'project'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: L ? "✅ تم حفظ شرح الاستخدام" : "✅ Usage guide saved" });
    },
    onError: () => toast({ title: L ? "فشل حفظ الشرح" : "Failed to save guide", variant: "destructive" }),
  });

  const saveDeliveryMutation = useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/projects/${projectId}/delivery`, data);
      return res.json();
    },
    onSuccess: () => {
      formInitializedForOrder.current = null; // allow form to re-init with saved data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'project'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: L ? "✅ تم حفظ بيانات التسليم" : "✅ Delivery data saved" });
    },
    onError: () => toast({ title: L ? "فشل حفظ بيانات التسليم" : "Failed to save delivery data", variant: "destructive" }),
  });

  const handleSaveGuide = () => {
    if (!orderProject?.id) { toast({ title: L ? "لا يوجد مشروع مرتبط بهذا الطلب" : "No project linked to this order", variant: "destructive" }); return; }
    saveGuideMutation.mutate({
      projectId: orderProject.id,
      guide: {
        title: guideForm.title || "شرح استخدام النظام",
        description: guideForm.description,
        files: guideForm.files.split("\n").map(f => f.trim()).filter(Boolean),
      },
    });
  };

  const handleSaveDelivery = () => {
    if (!orderProject?.id) { toast({ title: L ? "لا يوجد مشروع مرتبط بهذا الطلب" : "No project linked to this order", variant: "destructive" }); return; }
    const parsedFiles = deliveryForm.files
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const parts = line.split("|");
        return { nameAr: parts[0]?.trim() || "", url: parts[1]?.trim() || "", icon: parts[2]?.trim() || "📄" };
      })
      .filter(f => f.nameAr && f.url);
    saveDeliveryMutation.mutate({
      projectId: orderProject.id,
      data: { deliveryVideoUrl: deliveryForm.videoUrl, deliveryFiles: parsedFiles },
    });
  };

  const handleQuickStatus = (id: string, status: string) => {
    updateMutation.mutate({ id, updates: { status } });
  };

  const handleSaveBasic = () => {
    if (!selectedOrder) return;
    const updates: Record<string, any> = {};
    if (editStatus) updates.status = editStatus;
    if (editAmount) updates.totalAmount = Number(editAmount);
    updates.assignedToIds = editAssignedToIds;
    updates.assignedTo = editAssignedToIds[0] || null;
    if (editAdminNotes !== undefined) updates.adminNotes = editAdminNotes;
    if (editProgress !== undefined) updates.progress = editProgress;
    if (editPriority) updates.priority = editPriority;
    updateMutation.mutate({ id: selectedOrder.id, updates });
  };

  const handleSaveSpecs = () => {
    if (!selectedOrder) return;
    saveSpecsMutation.mutate({ orderId: selectedOrder.id, specs: specsForm });
  };

  const addIntegrationKeyHint = ({ type, environment }: { type: "whatsapp" | "email" | "api"; environment: string }) => {
    if (!selectedOrder) return;
    const typeName = type.toUpperCase();
    const environmentName = environment.toUpperCase();
    const variableName = `QIROX_PROJECT_${typeName}_KEY_${environmentName}`;
    const variableHint = `${variableName}=<ONE_TIME_KEY_FROM_QIROX>`;
    const lines = specsForm.variables.split(/\r?\n/);
    const existingIndex = lines.findIndex(line => line.trim().split("=")[0] === variableName);
    const nextLines = existingIndex >= 0
      ? lines.map((line, index) => index === existingIndex ? variableHint : line)
      : [...lines.filter((line, index) => line.trim() || index < lines.length - 1), variableHint];
    const variables = nextLines.join("\n");
    const nextSpecs = { ...specsForm, variables };
    setSpecsForm(nextSpecs);
    saveSpecsMutation.mutate({ orderId: selectedOrder.id, specs: nextSpecs });
    toast({ title: `تمت إضافة ${variableName} إلى مفاتيح البيئة` });
  };

  const editProjectMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, any> }) =>
      apiRequest("PATCH", `/api/admin/orders/${id}`, updates).then(r => r.json()),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      setSelectedOrder(prev => prev ? { ...prev, ...updated } : prev);
      setEditProjectOpen(false);
      toast({ title: L ? "✅ تم تحديث المشروع" : "✅ Project updated" });
    },
    onError: () => toast({ title: L ? "فشل التحديث" : "Update failed", variant: "destructive" }),
  });

  const addProjectFileMutation = useMutation({
    mutationFn: ({ projectId, file }: { projectId: string; file: { title: string; url: string; fileType: string } }) =>
      apiRequest("POST", `/api/admin/projects/${projectId}/files`, file).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'project'] });
      setNewProjectFile({ title: "", url: "", fileType: "custom" });
      toast({ title: L ? "✅ تم إضافة الملف" : "✅ File added" });
    },
    onError: () => toast({ title: L ? "فشل إضافة الملف" : "Failed to add file", variant: "destructive" }),
  });

  const deleteProjectFileMutation = useMutation({
    mutationFn: ({ projectId, fileId }: { projectId: string; fileId: string }) =>
      apiRequest("DELETE", `/api/admin/projects/${projectId}/files/${fileId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'project'] });
      toast({ title: L ? "تم حذف الملف" : "File deleted" });
    },
    onError: () => toast({ title: L ? "فشل حذف الملف" : "Failed to delete file", variant: "destructive" }),
  });

  const uploadProjectCodeMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedOrder) throw new Error(L ? "لم يتم تحديد الطلب" : "No order selected");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("commitMessage", L ? "تحديث أكواد المشروع من QIROX" : "Update project code from QIROX");
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/github/code/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || (L ? "فشل رفع أكواد المشروع" : "Project code upload failed"));
      return body;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'github', 'code'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'github'] });
      toast({
        title: L ? "تم رفع الأكواد بأمان" : "Project code uploaded safely",
        description: data?.backupBranch
          ? (L ? `تم حفظ النسخة السابقة في ${data.backupBranch}` : `Previous version saved to ${data.backupBranch}`)
          : undefined,
      });
      if (projectCodeUploadRef.current) projectCodeUploadRef.current.value = "";
    },
    onError: (error: any) => {
      toast({
        title: error?.message || (L ? "فشل رفع أكواد المشروع" : "Project code upload failed"),
        variant: "destructive",
      });
      if (projectCodeUploadRef.current) projectCodeUploadRef.current.value = "";
    },
  });

  const syncProjectCodeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder) throw new Error(L ? "لم يتم تحديد الطلب" : "No order selected");
      const res = await apiRequest("POST", `/api/admin/orders/${selectedOrder.id}/github/code/sync`, {
        branch: githubCode?.branch || "main",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || (L ? "تعذرت مزامنة الأكواد" : "Project code sync failed"));
      return body;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'github', 'code'] });
      toast({
        title: L ? "تمت مزامنة الأكواد من GitHub" : "Project code synced from GitHub",
        description: data?.backupBranch
          ? (L ? `تم حفظ نقطة حماية: ${data.backupBranch}` : `Safety point saved: ${data.backupBranch}`)
          : undefined,
      });
    },
    onError: (error: any) => toast({
      title: error?.message || (L ? "تعذرت مزامنة الأكواد" : "Project code sync failed"),
      variant: "destructive",
    }),
  });

  const openCodeWorkspaceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder) throw new Error(L ? "لم يتم تحديد الطلب" : "No order selected");
      const res = await apiRequest("POST", `/api/admin/orders/${selectedOrder.id}/github/code/workspace`, {
        branch: githubCode?.branch || "main",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || (L ? "تعذر تجهيز بيئة التطوير" : "Unable to prepare code workspace"));
      return body;
    },
    onSuccess: (data) => {
      if (data?.workspaceUrl) {
        window.location.assign(data.workspaceUrl);
      }
    },
    onError: (error: any) => toast({
      title: error?.message || (L ? "تعذر تجهيز بيئة التطوير" : "Unable to prepare code workspace"),
      variant: "destructive",
    }),
  });

  const openOrder = (order: OrderData) => {
    setSelectedOrder(order);
    setGithubRepositoryAction("move");
    setGithubMigrationTarget("");
    setActiveTab("details");
    setEditStatus(order.status);
    setEditAmount(order.totalAmount?.toString() || "");
    setEditAssignedToIds(getOrderAssigneeIds(order));
    setAssigneeMenuOpen(false);
    setEditAdminNotes(order.adminNotes || "");
    setEditProgress((order as any).progress || 0);
    setEditPriority((order as any).priority || "medium");
    setSpecsForm({ ...EMPTY_SPECS });
    setEditProjectForm({
      businessName: order.businessName || "",
      projectType: order.projectType || "",
      sector: order.sector || "",
      status: order.status || "pending",
      adminNotes: order.adminNotes || "",
      totalAmount: order.totalAmount?.toString() || "",
    });
  };

  const getAssigneeNames = (order: OrderData) => {
    if (!employees) return [];
    const ids = getOrderAssigneeIds(order);
    return employees.filter(e => ids.includes(String(e.id))).map(e => e.fullName);
  };

  const myId = currentUser?.id || currentUser?._id;
  const fullAccessRoles = ["admin", "manager", "owner", "accountant", "sales_manager"];
  const isLimitedRole = myId && !fullAccessRoles.includes(currentUser?.role || "");
  const filteredOrders = orders?.filter(o => {
    const statusMatch = filterStatus === "all" || o.status === filterStatus;
    if (!statusMatch) return false;
    if (filterDateFrom) {
      const created = new Date(o.createdAt || 0);
      if (created < new Date(filterDateFrom)) return false;
    }
    if (filterDateTo) {
      const created = new Date(o.createdAt || 0);
      if (created > new Date(filterDateTo + "T23:59:59")) return false;
    }
    if (filterAssignee !== "all") {
      if (filterAssignee === "unassigned") { if (getOrderAssigneeIds(o).length) return false; }
      else if (!getOrderAssigneeIds(o).includes(filterAssignee)) return false;
    }
    if (isLimitedRole) return getOrderAssigneeIds(o).includes(String(myId));
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin w-8 h-8 text-black/40" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden space-y-5" dir={dir}>
      <PageGraphics variant="dashboard" />
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-black flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-black/40" />
            {L ? "مركز المشاريع والتنفيذ" : "Projects & Delivery Center"}
          </h1>
          <p className="text-xs text-black/35 mt-0.5">
            {isLimitedRole
              ? (L ? `مشاريعك المعيّنة (${filteredOrders.length}) مع الخطوة التالية لكل مشروع` : `Your assigned projects (${filteredOrders.length}) with a clear next step`)
              : (L ? "افتح أي مشروع لمراجعة الطلب والتجهيز والمهام والتكاملات والتسليم في ملف واحد" : "Open a project to review its request, setup, tasks, integrations, and delivery in one record")
            }
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isDataEntry && <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("/api/admin/orders/export", "_blank")}
            className="gap-1.5 h-9 text-xs"
            data-testid="button-export-orders"
          >
            <Download className="w-3.5 h-3.5" />
            {L ? "تصدير CSV" : "Export CSV"}
          </Button>}
          <div className="flex items-center gap-1.5">
            <Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="h-9 text-xs w-36 border-black/10" title={L ? "من تاريخ" : "From date"} />
            <span className="text-xs text-black/30">—</span>
            <Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="h-9 text-xs w-36 border-black/10" title={L ? "إلى تاريخ" : "To date"} />
            {(filterDateFrom || filterDateTo) && (
              <button onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); }} className="text-[10px] text-black/40 hover:text-red-500 px-1">✕</button>
            )}
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 h-9 text-xs" data-testid="select-filter-status">
              <SelectValue placeholder={L ? "تصفية الحالة" : "Filter Status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{L ? "الكل" : "All"} ({orders?.length || 0})</SelectItem>
              {Object.entries(statusMap).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label} ({orders?.filter(o => o.status === k).length || 0})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isLimitedRole && employees && employees.length > 0 && (
            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
              <SelectTrigger className="w-36 h-9 text-xs" data-testid="select-filter-assignee">
                <SelectValue placeholder={L ? "المسؤول" : "Assignee"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{L ? "الكل" : "All"}</SelectItem>
                <SelectItem value="unassigned">{L ? "غير معين" : "Unassigned"}</SelectItem>
                {employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { key: "pending", label: L ? "قيد المراجعة" : "Under Review", color: "text-black dark:text-white bg-black/[0.04] dark:bg-white/[0.06]" },
          { key: "approved", label: L ? "موافق عليه" : "Approved", color: "text-black dark:text-white bg-black/[0.04] dark:bg-white/[0.06]" },
          { key: "in_progress", label: L ? "قيد التنفيذ" : "In Progress", color: "text-black dark:text-white bg-black/[0.04] dark:bg-white/[0.06]" },
          { key: "completed", label: L ? "مكتمل" : "Completed", color: "text-black/60 bg-black/[0.04]" },
          { key: "cancelled", label: L ? "ملغي" : "Cancelled", color: "text-black dark:text-white bg-black/[0.04] dark:bg-white/[0.06]" },
        ].map((stat) => (
          <button
            key={stat.key}
            onClick={() => setFilterStatus(filterStatus === stat.key ? "all" : stat.key)}
            className={`border rounded-xl p-3 flex items-center gap-3 transition-all text-right w-full ${filterStatus === stat.key ? 'border-black/20 shadow-sm' : 'border-black/[0.06] bg-white hover:bg-black/[0.02]'}`}
            data-testid={`filter-stat-${stat.key}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.color}`}>
              <span className="text-sm font-bold">{orders?.filter(o => o.status === stat.key).length || 0}</span>
            </div>
            <p className="text-xs text-black/50 font-medium">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="border border-black/[0.06] bg-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.06] bg-black/[0.01]">
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">{L ? "رقم المشروع" : "Project #"}</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">{L ? "اسم المشروع" : "Project Name"}</th>
                {canManageProjectSubscriptions && <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">{L ? "اشتراك المشروع" : "Project Subscription"}</th>}
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">{L ? "الحالة" : "Status"}</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">{L ? "المسؤول" : "Assignee"}</th>
                {canSeeFinance && <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">{L ? "المبلغ" : "Amount"}</th>}
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">{L ? "التاريخ" : "Date"}</th>
                <th className="text-left p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">{L ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const assigneeNames = getAssigneeNames(order);
                return (
                  <tr key={order.id} className="border-b border-black/[0.03] hover:bg-black/[0.02] transition-colors" data-testid={`row-order-${order.id}`}>
                    <td className="p-4">
                      <p className="text-sm font-mono font-bold text-black">
                        #{order.orderNumber || order.id?.toString().slice(-3)}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-semibold text-black">{order.businessName || order.projectType || order.sector || "—"}</p>
                      {(order.projectType || order.sector) && order.businessName && (
                        <p className="text-[10px] text-black/35 mt-0.5">{order.projectType || order.sector}</p>
                      )}
                      {order.sectorFeatures && order.sectorFeatures.length > 0 && (
                        <p className="text-[10px] text-black/30 mt-0.5">{order.sectorFeatures.length} {L ? "ميزة" : "features"}</p>
                      )}
                      {((order as any).client?.fullName || (order as any).client?.username) && (
                        <p className="text-[10px] text-black/40 mt-0.5 flex items-center gap-1">
                          <User className="w-2.5 h-2.5 inline" />
                          {(order as any).client?.fullName || (order as any).client?.username}
                        </p>
                      )}
                    </td>
                    {canManageProjectSubscriptions && (
                      <td className="p-4 align-top">
                        <AdminProjectSubscriptionCell
                          projectId={order.projectId}
                          subscription={order.projectSubscription}
                          lang={lang}
                          adjustmentPending={adjustingProjectId === order.projectId}
                          onAdjust={(days) => {
                            if (order.projectId) {
                              adjustProjectSubscriptionMutation.mutate({ projectId: order.projectId, days });
                            }
                          }}
                        />
                      </td>
                    )}
                    <td className="p-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${statusMap[order.status]?.color || "bg-black/[0.03] text-black/40 border-black/[0.06]"}`}>
                        {statusMap[order.status]?.label || order.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {assigneeNames.length ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-[9px] font-bold">{assigneeNames[0].charAt(0)}</span>
                          </div>
                          <span className="text-xs text-black/60 font-medium">
                            {assigneeNames.slice(0, 2).join("، ")}
                            {assigneeNames.length > 2 ? ` +${assigneeNames.length - 2}` : ""}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-black/20 italic">{L ? "غير معين" : "Unassigned"}</span>
                      )}
                    </td>
                    {canSeeFinance && (
                    <td className="p-4 text-sm font-semibold text-black/70">
                      {order.totalAmount ? <span className="flex items-center gap-1">{Number(order.totalAmount).toLocaleString()} <SARIcon size={11} className="opacity-60" /></span> : "—"}
                    </td>
                    )}
                    <td className="p-4">
                      {(order as any).priority && (order as any).priority !== "medium" && (
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${(order as any).priority === "urgent" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : (order as any).priority === "high" ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" : "bg-gray-100 text-gray-500"}`}>
                          {(order as any).priority === "urgent" ? (L ? "عاجل" : "Urgent") : (order as any).priority === "high" ? (L ? "مرتفع" : "High") : (L ? "منخفض" : "Low")}
                        </span>
                      )}
                      <p className="text-xs text-black/30">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString(L ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' }) : "—"}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" className="text-black/60 w-8 h-8" onClick={() => openOrder(order)} data-testid={`button-view-${order.id}`}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {order.status === "pending" && (
                          <>
                            <Button size="sm" variant="ghost" className="text-black dark:text-white h-8 text-xs px-2" onClick={() => handleQuickStatus(order.id, "approved")} disabled={updateMutation.isPending} data-testid={`button-approve-${order.id}`}>
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />{L ? "قبول" : "Approve"}
                            </Button>
                            <Button size="sm" variant="ghost" className="text-black dark:text-white h-8 text-xs px-2" onClick={() => handleQuickStatus(order.id, "cancelled")} disabled={updateMutation.isPending} data-testid={`button-reject-${order.id}`}>
                              <XCircle className="w-3.5 h-3.5 mr-1" />{L ? "رفض" : "Reject"}
                            </Button>
                          </>
                        )}
                        <Button size="icon" variant="ghost" className="text-black/30 hover:text-black w-8 h-8"
                          onClick={() => { if (confirm(L ? "هل أنت متأكد من حذف هذا المشروع/الطلب نهائياً؟" : "Permanently delete this project/order?")) deleteOrderMutation.mutate(order.id); }}
                          disabled={deleteOrderMutation.isPending}
                          data-testid={`button-delete-order-${order.id}`}
                          title={L ? "حذف المشروع" : "Delete project"}>
                          {deleteOrderMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                   <td colSpan={canSeeFinance ? (canManageProjectSubscriptions ? 8 : 7) : (canManageProjectSubscriptions ? 7 : 6)} className="p-12 text-center text-black/30">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-black/10" />
                    <p className="text-sm">{L ? "لا توجد مشاريع" : "No projects found"}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Order Sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent side="left" className="w-full sm:max-w-3xl p-0 overflow-hidden" dir={dir}>
          {selectedOrder && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="px-6 py-4 border-b border-black/[0.06] bg-white flex-shrink-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-base font-bold text-black leading-tight">
                      {selectedOrder.orderNumber ? `#${selectedOrder.orderNumber}` : `#${selectedOrder.id?.toString().slice(-6)}`}
                      {selectedOrder.businessName && <span className="text-black/40 font-normal mr-2">— {selectedOrder.businessName}</span>}
                    </SheetTitle>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusMap[selectedOrder.status]?.color || ""}`}>
                        {statusMap[selectedOrder.status]?.label || selectedOrder.status}
                      </span>
                      {canSeeFinance && selectedOrder.totalAmount && (
                        <span className="text-[10px] text-black/40 flex items-center gap-0.5">{Number(selectedOrder.totalAmount).toLocaleString()} <SARIcon size={9} className="opacity-60" /></span>
                      )}
                      {selectedOrder.client?.fullName && (
                        <span className="text-[10px] text-black/30">{selectedOrder.client.fullName}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditProjectForm({
                        businessName: selectedOrder.businessName || "",
                        projectType: selectedOrder.projectType || "",
                        sector: selectedOrder.sector || "",
                        status: selectedOrder.status || "pending",
                        adminNotes: selectedOrder.adminNotes || "",
                        totalAmount: selectedOrder.totalAmount?.toString() || "",
                      });
                      setEditProjectOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-black/[0.04] dark:bg-white/[0.06] transition-colors text-xs font-semibold flex-shrink-0"
                    data-testid="button-edit-project"
                  >
                    <Save className="w-3 h-3" /> {L ? "تعديل المشروع" : "Edit Project"}
                  </button>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
                <TabsList className="w-full max-w-full rounded-none border-b border-black/[0.06] bg-white h-10 justify-start px-6 gap-0 flex-shrink-0 flex-nowrap overflow-x-auto overflow-y-hidden">
                  <TabsTrigger value="details" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent h-10 px-4 flex-shrink-0">
                    {L ? "نظرة المشروع" : "Project Overview"}
                  </TabsTrigger>
                  {canManageProjectSubscriptions && (
                    <TabsTrigger value="subscription" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent h-10 px-4 gap-1 flex-shrink-0" data-testid="tab-admin-project-subscription">
                      <RefreshCw className="w-3 h-3" />{L ? "إدارة الاشتراك" : "Subscription Management"}
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="specs" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent h-10 px-4 flex-shrink-0">
                    {L ? "التجهيز والتكاملات" : "Setup & Integrations"}
                  </TabsTrigger>
                  <TabsTrigger value="manage" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent h-10 px-4 flex-shrink-0">
                    {L ? "المتابعة والتسليم" : "Follow-up & Delivery"}
                  </TabsTrigger>
                  <TabsTrigger value="profit" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:border-white data-[state=active]:text-black dark:text-white data-[state=active]:bg-transparent h-10 px-4 gap-1 flex-shrink-0">
                    <DollarSign className="w-3 h-3" />{L ? "التكاليف والأرباح" : "Costs & Profits"}
                  </TabsTrigger>
                  <TabsTrigger value="files" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:border-white data-[state=active]:text-black dark:text-white data-[state=active]:bg-transparent h-10 px-4 gap-1 flex-shrink-0">
                    <Paperclip className="w-3 h-3" />{L ? "ملفات المشروع" : "Project Files"}
                  </TabsTrigger>
                  <TabsTrigger value="team" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:border-white data-[state=active]:text-black dark:text-white data-[state=active]:bg-transparent h-10 px-4 gap-1 flex-shrink-0">
                    <Users className="w-3 h-3" />{L ? "فريق العمل" : "Team"}
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Details */}
                <TabsContent value="details" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="px-6 py-5 space-y-6">
                      <div className="bg-black/[0.02] border border-black/[0.06] rounded-2xl p-5">
                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5" />
                          {L ? "إيصال الدفع البنكي" : "Bank Payment Receipt"}
                        </p>
                        <div 
                          className="border-2 border-dashed border-black/[0.08] rounded-2xl p-8 text-center cursor-pointer hover:border-black/25 hover:bg-black/[0.01] transition-all group relative"
                          onClick={() => document.getElementById("payment-proof-upload")?.click()}
                        >
                          {selectedOrder.paymentProofUrl ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-12 h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-black dark:text-white">
                                <CheckCircle className="w-6 h-6" />
                              </div>
                              <p className="text-xs font-bold text-black dark:text-white">{L ? "تم رفع الإيصال بنجاح" : "Receipt uploaded successfully"}</p>
                              <p className="text-[10px] text-black/30">{L ? "اضغط لتغيير الملف" : "Click to change file"}</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 py-1">
                              <div className="w-10 h-10 rounded-xl bg-black/[0.04] flex items-center justify-center group-hover:bg-black/[0.07] transition-colors">
                                <Upload className="w-4 h-4 text-black/25" />
                              </div>
                              <span className="text-xs text-black/35">{L ? "اضغط لرفع إيصال التحويل" : "Click to upload transfer receipt"}</span>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          id="payment-proof-upload"
                          className="hidden"
                          accept="image/*,application/pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !selectedOrder) return;
                            const fd = new FormData();
                            fd.append("file", file);
                            try {
                              const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
                              const data = await res.json();
                              if (data.url) {
                                await apiRequest("PATCH", `/api/admin/orders/${selectedOrder.id}`, { paymentProofUrl: data.url, isDepositPaid: true });
                                queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
                                setSelectedOrder({ ...selectedOrder, paymentProofUrl: data.url, isDepositPaid: true });
                                toast({ title: L ? "تم رفع الإيصال وتحديث حالة الدفع" : "Receipt uploaded and payment status updated" });
                              }
                            } catch (err) {
                              toast({ title: L ? "فشل رفع الملف" : "File upload failed", variant: "destructive" });
                            }
                          }}
                        />
                        {selectedOrder.paymentProofUrl && (
                          <div className="mt-2 space-y-2">
                            <Button 
                              variant="outline" 
                              className="w-full text-xs gap-2"
                              onClick={() => window.open(selectedOrder.paymentProofUrl, "_blank")}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              {L ? "عرض الإيصال الحالي" : "View Current Receipt"}
                            </Button>
                            {selectedOrder.paymentStatus !== "approved" && (
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs gap-1.5 border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-black/[0.04] dark:bg-white/[0.06]"
                                  data-testid="button-approve-transfer"
                                  onClick={async () => {
                                    try {
                                      await apiRequest("POST", `/api/admin/orders/${selectedOrder.id}/approve-transfer`, {});
                                      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
                                      setSelectedOrder({ ...selectedOrder, paymentStatus: "approved", isDepositPaid: true });
                                      toast({ title: L ? "تمت الموافقة على التحويل" : "Transfer approved" });
                                    } catch { toast({ title: L ? "فشل" : "Failed", variant: "destructive" }); }
                                  }}
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  {L ? "قبول التحويل" : "Approve Transfer"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs gap-1.5 border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-black/[0.04] dark:bg-white/[0.06]"
                                  data-testid="button-reject-transfer"
                                  onClick={() => setRejectTransferOpen(true)}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  {L ? "رفض التحويل" : "Reject Transfer"}
                                </Button>
                              </div>
                            )}
                            {selectedOrder.paymentStatus === "approved" && (
                              <div className="flex items-center gap-2 px-3 py-2 bg-black/[0.04] dark:bg-white/[0.06] rounded-lg border border-black/10 dark:border-white/10">
                                <CheckCircle className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
                                <p className="text-xs font-semibold text-black dark:text-white">{L ? "تم قبول التحويل" : "Transfer approved"}</p>
                              </div>
                            )}
                            {selectedOrder.paymentStatus === "rejected" && (
                              <div className="flex items-center gap-2 px-3 py-2 bg-black/[0.04] dark:bg-white/[0.06] rounded-lg border border-black/10 dark:border-white/10">
                                <XCircle className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-black dark:text-white">{L ? "تم رفض التحويل" : "Transfer rejected"}</p>
                                  {selectedOrder.paymentRejectionReason && (
                                    <p className="text-[10px] text-black dark:text-white mt-0.5">{selectedOrder.paymentRejectionReason}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Client Info */}
                      {selectedOrder.client && (
                        <div>
                          <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-3">{L ? "بيانات العميل" : "Client Information"}</p>
                          <div className="bg-black/[0.02] rounded-xl p-4 space-y-2.5 border border-black/[0.04]">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                {selectedOrder.client.fullName?.charAt(0) || "?"}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-black">{selectedOrder.client.fullName || selectedOrder.client.username}</p>
                                <p className="text-[10px] text-black/40">@{selectedOrder.client.username}</p>
                              </div>
                            </div>
                            {selectedOrder.client.email && (
                              <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-black/30 flex-shrink-0" /><p className="text-xs text-black/60">{selectedOrder.client.email}</p></div>
                            )}
                            {selectedOrder.client.phone && (
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3.5 h-3.5 text-black/30 flex-shrink-0" />
                                  <p className="text-xs text-black/60 font-mono">{selectedOrder.client.phone}</p>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap mr-5">
                                  <a
                                    href={`https://wa.me/${selectedOrder.client.phone.replace(/\D/g, "")}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white hover:bg-black/[0.04] dark:bg-white/[0.06] transition-colors"
                                    data-testid="link-whatsapp-order-client"
                                  >
                                    <SiWhatsapp className="w-3 h-3" />
                                    واتساب
                                  </a>
                                  <a
                                    href={`https://t.me/${selectedOrder.client.phone.replace(/\D/g, "")}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white hover:bg-black/[0.04] dark:bg-white/[0.06] transition-colors"
                                    data-testid="link-telegram-order-client"
                                  >
                                    <SiTelegram className="w-3 h-3" />
                                    تيليغرام
                                  </a>
                                  <button
                                    onClick={() => setPhoneReqOpen(true)}
                                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md text-black dark:text-white hover:bg-black/[0.04] dark:bg-white/[0.06] transition-colors"
                                    data-testid="button-wrong-phone-order"
                                  >
                                    <PhoneOff className="w-3 h-3" />
                                    {L ? "الرقم خطأ؟" : "Wrong number?"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Client Legal / Billing Info */}
                      {selectedOrder.client && (selectedOrder.client.organizationName || selectedOrder.client.taxNumber || selectedOrder.client.commercialRegistration || selectedOrder.client.nationalAddress) && (
                        <div>
                          <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5" />
                            {L ? "بيانات الفوترة والمؤسسة" : "Billing & Organization Info"}
                          </p>
                          <div className="bg-black/[0.02] rounded-xl p-4 space-y-2.5 border border-black/[0.04]">
                            {selectedOrder.client.organizationName && (
                              <div className="flex items-start gap-2">
                                <Building2 className="w-3.5 h-3.5 text-black/30 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[10px] text-black/40 mb-0.5">{L ? "اسم المؤسسة" : "Organization"}</p>
                                  <p className="text-xs font-medium text-black/80">{selectedOrder.client.organizationName}</p>
                                </div>
                              </div>
                            )}
                            {selectedOrder.client.taxNumber && (
                              <div className="flex items-start gap-2">
                                <Hash className="w-3.5 h-3.5 text-black/30 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[10px] text-black/40 mb-0.5">{L ? "الرقم الضريبي" : "Tax Number"}</p>
                                  <p className="text-xs font-mono text-black/80">{selectedOrder.client.taxNumber}</p>
                                </div>
                              </div>
                            )}
                            {selectedOrder.client.commercialRegistration && (
                              <div className="flex items-start gap-2">
                                <Hash className="w-3.5 h-3.5 text-black/30 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[10px] text-black/40 mb-0.5">{L ? "السجل التجاري" : "Commercial Reg."}</p>
                                  <p className="text-xs font-mono text-black/80">{selectedOrder.client.commercialRegistration}</p>
                                </div>
                              </div>
                            )}
                            {selectedOrder.client.nationalAddress && (
                              <div className="flex items-start gap-2">
                                <MapPin className="w-3.5 h-3.5 text-black/30 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[10px] text-black/40 mb-0.5">{L ? "العنوان الوطني" : "National Address"}</p>
                                  <p className="text-xs text-black/80">{selectedOrder.client.nationalAddress}</p>
                                </div>
                              </div>
                            )}
                            {(selectedOrder.client.address || selectedOrder.client.city) && (
                              <div className="flex items-start gap-2">
                                <MapPin className="w-3.5 h-3.5 text-black/30 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[10px] text-black/40 mb-0.5">{L ? "العنوان" : "Address"}</p>
                                  <p className="text-xs text-black/80">{[selectedOrder.client.address, selectedOrder.client.city].filter(Boolean).join("، ")}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Project Details from questionnaire */}
                      <div>
                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-3">{L ? "تفاصيل المشروع" : "Project Details"}</p>
                        <div className="space-y-1.5">
                          {[
                            { label: "اسم النشاط", value: selectedOrder.businessName },
                            { label: "نوع المشروع", value: selectedOrder.projectType },
                            { label: "القطاع", value: selectedOrder.sector },
                            { label: "النمط البصري", value: selectedOrder.visualStyle },
                            { label: "لغة الموقع", value: selectedOrder.siteLanguage },
                            { label: "الجمهور المستهدف", value: selectedOrder.targetAudience },
                            { label: "المنافسون", value: selectedOrder.competitors },
                            { label: "متطلبات إضافية", value: selectedOrder.requiredFunctions },
                          ].filter(f => f.value).map(f => (
                            <div key={f.label} className="flex gap-3 py-2 border-b border-black/[0.04] last:border-0">
                              <p className="text-[10px] font-bold text-black/40 w-28 flex-shrink-0 pt-0.5">{f.label}</p>
                              <p className="text-xs text-black/80 flex-1">{f.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Features */}
                      {selectedOrder.sectorFeatures && selectedOrder.sectorFeatures.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-3">{L ? "المميزات المطلوبة" : "Required Features"}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedOrder.sectorFeatures.map((f: string) => (
                              <span key={f} className="text-[10px] px-2.5 py-1 rounded-full bg-black text-white font-medium">{f}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Boolean flags */}
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { key: "whatsappIntegration", label: "واتساب" },
                          { key: "socialIntegration", label: "السوشيال ميديا" },
                          { key: "hasLogo", label: "لديه شعار" },
                          { key: "hasHosting", label: "لديه استضافة" },
                          { key: "hasDomain", label: "لديه دومين" },
                        ].filter(f => (selectedOrder as any)[f.key]).map(f => (
                          <span key={f.key} className="text-[10px] px-2.5 py-1 rounded-full bg-black/[0.06] text-black/60 border border-black/[0.08] font-medium">✓ {f.label}</span>
                        ))}
                      </div>

                      {/* Payment — visible to finance roles only */}
                      {canSeeFinance && (
                      <div>
                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-3">{L ? "بيانات الدفع" : "Payment Details"}</p>
                        <div className="bg-black/[0.02] rounded-xl p-4 border border-black/[0.04] space-y-2">
                          <div className="flex justify-between"><p className="text-xs text-black/50">{L ? "طريقة الدفع" : "Payment Method"}</p><p className="text-xs font-bold text-black">{paymentMethods[selectedOrder.paymentMethod || ""] || "—"}</p></div>
                          <div className="flex justify-between"><p className="text-xs text-black/50">{L ? "الإجمالي" : "Total"}</p><p className="text-xs font-bold text-black flex items-center gap-1">{selectedOrder.totalAmount ? <>{Number(selectedOrder.totalAmount).toLocaleString()} <SARIcon size={10} className="opacity-70" /></> : "—"}</p></div>
                          {!!selectedOrder.walletAmountUsed && (
                            <div className="flex justify-between"><p className="text-xs text-black/50">{L ? "خُصم من محفظة كيروكس باي" : "Paid from Wallet"}</p><p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">{Number(selectedOrder.walletAmountUsed).toLocaleString()} <SARIcon size={10} className="opacity-70" /></p></div>
                          )}
                          {!!selectedOrder.walletAmountUsed && selectedOrder.totalAmount && selectedOrder.paymentMethod === "mixed" && (
                            <div className="flex justify-between"><p className="text-xs text-black/50">{L ? "المتبقي بالتحويل" : "Remaining via Transfer"}</p><p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">{Math.max(0, Number(selectedOrder.totalAmount) - Number(selectedOrder.walletAmountUsed)).toLocaleString()} <SARIcon size={10} className="opacity-70" /></p></div>
                          )}
                          {selectedOrder.shippingCompanyName && (
                            <div className="flex justify-between"><p className="text-xs text-black/50">{L ? "شركة الشحن" : "Shipping Company"}</p><p className="text-xs font-bold text-black">{selectedOrder.shippingCompanyName}</p></div>
                          )}
                          {!!selectedOrder.shippingFee && (
                            <div className="flex justify-between"><p className="text-xs text-black/50">{L ? "رسوم الشحن" : "Shipping Fee"}</p><p className="text-xs font-bold text-black flex items-center gap-1">{Number(selectedOrder.shippingFee).toLocaleString()} <SARIcon size={10} className="opacity-70" /></p></div>
                          )}
                          <div className="flex justify-between"><p className="text-xs text-black/50">{L ? "الدفعة الأولى" : "First Payment"}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${selectedOrder.isDepositPaid ? 'bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white' : 'bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white'}`}>
                              {selectedOrder.isDepositPaid ? (L ? "مدفوعة ✓" : "Paid ✓") : (L ? "لم تُدفع" : "Not paid")}
                            </span>
                          </div>
                          {selectedOrder.paymentProofUrl && (
                            <a href={selectedOrder.paymentProofUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-black/50 hover:text-black transition-colors mt-1">
                              <Link2 className="w-3.5 h-3.5" />
                              {L ? "عرض إيصال الدفع" : "View Payment Receipt"}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      )}

                      {/* Client Documents */}
                      {(() => {
                        const files = (selectedOrder as any).files || {};
                        const fileCategories = [
                          { key: "logo",          label: L ? "الشعار" : "Logo",           color: "bg-black dark:bg-white" },
                          { key: "brandIdentity", label: L ? "الهوية البصرية" : "Brand Identity",   color: "bg-black dark:bg-white" },
                          { key: "content",       label: L ? "المحتوى والصور" : "Content & Images",   color: "bg-black dark:bg-white" },
                          { key: "paymentProof",  label: L ? "إثبات الدفع" : "Payment Proof",      color: "bg-black dark:bg-white" },
                        ];
                        const allDocs: { label: string; url: string; color: string }[] = [];
                        fileCategories.forEach(({ key, label, color }) => {
                          const arr: string[] = Array.isArray(files[key]) ? files[key] : (files[key] ? [files[key]] : []);
                          arr.forEach(u => allDocs.push({ label, url: u, color }));
                        });
                        if (!allDocs.length) return null;
                        return (
                          <div>
                            <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-3">{L ? "مستندات العميل" : "Client Documents"}</p>
                            <div className="space-y-2">
                              {allDocs.map((doc, i) => (
                                <a key={i} href={doc.url} target="_blank" rel="noreferrer"
                                  className="flex items-center gap-3 bg-black/[0.02] rounded-xl px-4 py-2.5 border border-black/[0.04] hover:bg-black/[0.05] transition-colors group">
                                  <div className={`w-7 h-7 rounded-lg ${doc.color} flex items-center justify-center flex-shrink-0`}>
                                    <span className="text-white text-[10px] font-black">{doc.label[0]}</span>
                                  </div>
                                  <span className="text-xs font-semibold text-black flex-1">{doc.label}</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-black/30 group-hover:text-black/60 transition-colors" />
                                </a>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </ScrollArea>
                </TabsContent>

                  <TabsContent value="subscription" className="flex-1 overflow-hidden mt-0">
                    <ScrollArea className="h-full">
                      <div className="px-6 py-5 space-y-5 max-w-4xl">
                        <div>
                          <h2 className="text-lg font-black text-black dark:text-white">
                            {L ? "إدارة اشتراك المشروع" : "Project Subscription Management"}
                          </h2>
                          <p className="text-xs text-black/45 dark:text-white/45 mt-1">
                            {L ? "ابدأ الاشتراك أو جدده أو عدّل أيامه. الفاتورة المدفوعة تدخل تلقائياً في الإيرادات والأرباح." : "Start, renew, or adjust the subscription. Paid invoices are included automatically in revenue and profit."}
                          </p>
                        </div>

                        {(() => {
                          const subscriptionProject = orderProject || {
                            id: selectedOrder.projectId,
                            subscription: selectedOrder.projectSubscription,
                          };
                          const projectId = subscriptionProject?.id || selectedOrder.projectId;
                          const subscription = subscriptionProject?.subscription || selectedOrder.projectSubscription;
                          const hasSubscription = !!subscription;
                          const isBusy = manageProjectSubscriptionMutation.isPending;
                          const updateSubscriptionForm = (updates: Record<string, string>) =>
                            setSubscriptionForm((current) => ({ ...current, ...updates }));
                          const submitSubscriptionAction = (action: "start" | "renew") => {
                            if (!projectId) return;
                            manageProjectSubscriptionMutation.mutate({
                              action,
                              projectId,
                              data: {
                                period: subscriptionForm.period,
                                startMode: action === "renew" && subscriptionForm.startMode === "project_completion"
                                  ? "after_expiry"
                                  : subscriptionForm.startMode,
                                startDate: subscriptionForm.startDate || undefined,
                                amount: Number(subscriptionForm.amount || 0),
                                paymentStatus: subscriptionForm.paymentStatus,
                                dueDate: subscriptionForm.dueDate || undefined,
                                notes: subscriptionForm.notes,
                              },
                            });
                          };

                          if (!projectId) {
                            const orderApproved = selectedOrder.status === "approved" || selectedOrder.paymentStatus === "approved";
                            return (
                              <div className="rounded-2xl border border-black/[0.08] bg-black/[0.02] p-6 space-y-3">
                                <div>
                                  <p className="text-sm font-bold text-black dark:text-white">
                                    {L ? "لا يوجد مشروع مرتبط بهذا الطلب بعد" : "No project is linked to this order yet"}
                                  </p>
                                  <p className="text-xs text-black/50 dark:text-white/50 mt-1">
                                    {orderApproved
                                      ? (L ? "جهّز المشروع أولاً حتى نتمكن من بدء الاشتراك وربطه بالفواتير." : "Provision the project first so the subscription can be started and linked to invoices.")
                                      : (L ? "اعتمد الطلب أو إيصال الدفع أولاً، ثم جهّز المشروع لإدارة الاشتراك." : "Approve the order or payment receipt first, then provision the project to manage its subscription.")}
                                  </p>
                                </div>
                                {orderApproved && (
                                  <Button
                                    type="button"
                                    onClick={() => convertToProjectMutation.mutate(selectedOrder)}
                                    disabled={convertToProjectMutation.isPending}
                                    className="h-9 rounded-xl bg-black text-white hover:bg-black/80 text-xs font-bold gap-1.5"
                                    data-testid="button-provision-project-for-subscription"
                                  >
                                    {convertToProjectMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
                                    {convertToProjectMutation.isPending
                                      ? (L ? "جاري تجهيز المشروع..." : "Provisioning project...")
                                      : (L ? "تجهيز المشروع الآن" : "Provision project now")}
                                  </Button>
                                )}
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                <ProjectSubscriptionCard project={subscriptionProject} lang={lang} />

                                <div className="rounded-2xl border border-black/[0.08] bg-white dark:bg-gray-900 p-4 space-y-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-bold text-black dark:text-white">
                                        {hasSubscription ? (L ? "تجديد الاشتراك" : "Renew subscription") : (L ? "بدء الاشتراك" : "Start subscription")}
                                      </p>
                                      <p className="text-[10px] text-black/40 dark:text-white/40 mt-1">
                                        {hasSubscription
                                          ? (L ? "اختر الفترة وسيبدأ التجديد بعد نهاية المدة الحالية." : "Choose a period; renewal starts after the current term ends.")
                                          : (L ? "حدد من أي تاريخ يبدأ عداد المشروع." : "Choose when the project countdown should start.")}
                                      </p>
                                    </div>
                                    <FileText className="w-4 h-4 text-black/30 dark:text-white/30" />
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-[10px] text-black/50 dark:text-white/50">{L ? "مدة الاشتراك" : "Subscription period"}</Label>
                                      <select
                                        value={subscriptionForm.period}
                                        onChange={(event) => updateSubscriptionForm({ period: event.target.value })}
                                        className="mt-1 h-9 w-full rounded-xl border border-black/[0.1] bg-white px-2 text-xs dark:border-white/[0.1] dark:bg-gray-900 dark:text-white"
                                        data-testid="select-project-subscription-period"
                                      >
                                        <option value="monthly">{L ? "شهري — 30 يوم" : "Monthly — 30 days"}</option>
                                        <option value="6months">{L ? "6 أشهر — 180 يوم" : "6 months — 180 days"}</option>
                                        <option value="annual">{L ? "سنوي — 365 يوم" : "Annual — 365 days"}</option>
                                        <option value="lifetime">{L ? "مدى الحياة" : "Lifetime"}</option>
                                      </select>
                                    </div>
                                    <div>
                                      <Label className="text-[10px] text-black/50 dark:text-white/50">{L ? "يبدأ من" : "Starts from"}</Label>
                                      <select
                                        value={subscriptionForm.startMode}
                                        onChange={(event) => updateSubscriptionForm({ startMode: event.target.value })}
                                        className="mt-1 h-9 w-full rounded-xl border border-black/[0.1] bg-white px-2 text-xs dark:border-white/[0.1] dark:bg-gray-900 dark:text-white"
                                        data-testid="select-project-subscription-start-mode"
                                      >
                                        {hasSubscription ? (
                                          <>
                                            <option value="after_expiry">{L ? "بعد نهاية الاشتراك الحالي" : "After current expiry"}</option>
                                            <option value="today">{L ? "من اليوم" : "From today"}</option>
                                            <option value="custom">{L ? "تاريخ مخصص" : "Custom date"}</option>
                                          </>
                                        ) : (
                                          <>
                                            <option value="project_completion">{L ? "عند اكتمال المشروع" : "When project is completed"}</option>
                                            <option value="project_start">{L ? "من بداية المشروع" : "From project start"}</option>
                                            <option value="today">{L ? "من اليوم" : "From today"}</option>
                                            <option value="custom">{L ? "تاريخ مخصص" : "Custom date"}</option>
                                          </>
                                        )}
                                      </select>
                                    </div>
                                  </div>

                                  {subscriptionForm.startMode === "custom" && (
                                    <div>
                                      <Label className="text-[10px] text-black/50 dark:text-white/50">{L ? "تاريخ البداية" : "Start date"}</Label>
                                      <Input
                                        type="date"
                                        value={subscriptionForm.startDate}
                                        onChange={(event) => updateSubscriptionForm({ startDate: event.target.value })}
                                        className="mt-1 h-9 text-xs"
                                        data-testid="input-project-subscription-start-date"
                                      />
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-[10px] text-black/50 dark:text-white/50">{L ? "المبلغ (ريال)" : "Amount (SAR)"}</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0"
                                        value={subscriptionForm.amount}
                                        onChange={(event) => updateSubscriptionForm({ amount: event.target.value })}
                                        className="mt-1 h-9 text-xs"
                                        data-testid="input-project-subscription-amount"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-[10px] text-black/50 dark:text-white/50">{L ? "حالة الفاتورة" : "Invoice status"}</Label>
                                      <select
                                        value={subscriptionForm.paymentStatus}
                                        onChange={(event) => updateSubscriptionForm({ paymentStatus: event.target.value })}
                                        className="mt-1 h-9 w-full rounded-xl border border-black/[0.1] bg-white px-2 text-xs dark:border-white/[0.1] dark:bg-gray-900 dark:text-white"
                                        data-testid="select-project-subscription-payment-status"
                                      >
                                        <option value="paid">{L ? "مدفوعة — تدخل في الإيرادات" : "Paid — add to revenue"}</option>
                                        <option value="unpaid">{L ? "غير مدفوعة — تظهر كمستحق" : "Unpaid — keep as receivable"}</option>
                                      </select>
                                    </div>
                                  </div>

                                  {subscriptionForm.paymentStatus === "unpaid" && (
                                    <div>
                                      <Label className="text-[10px] text-black/50 dark:text-white/50">{L ? "تاريخ استحقاق الفاتورة" : "Invoice due date"}</Label>
                                      <Input
                                        type="date"
                                        value={subscriptionForm.dueDate}
                                        onChange={(event) => updateSubscriptionForm({ dueDate: event.target.value })}
                                        className="mt-1 h-9 text-xs"
                                        data-testid="input-project-subscription-due-date"
                                      />
                                    </div>
                                  )}

                                  <div className="flex gap-2 pt-1">
                                    <Button
                                      type="button"
                                      onClick={() => submitSubscriptionAction(hasSubscription ? "renew" : "start")}
                                      disabled={isBusy}
                                      className="h-9 flex-1 rounded-xl bg-black text-white hover:bg-black/80 text-xs font-bold gap-1.5"
                                      data-testid={hasSubscription ? "button-renew-project-subscription" : "button-start-project-subscription"}
                                    >
                                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                      {hasSubscription ? (L ? "تجديد وإصدار فاتورة" : "Renew & invoice") : (L ? "بدء وإصدار فاتورة" : "Start & invoice")}
                                    </Button>
                                  </div>
                                  <p className="text-[10px] text-black/35 dark:text-white/35">
                                    {L ? "المبلغ 0 يعني بدون فاتورة. عند اختيار مدفوعة تُحتسب مباشرة في تقرير الأرباح." : "Amount 0 skips invoice creation. Paid invoices are counted immediately in the profit report."}
                                  </p>
                                </div>
                              </div>

                              <div className="rounded-2xl border border-black/[0.08] bg-white dark:bg-gray-900 p-4">
                                <div className="flex items-center justify-between gap-3 mb-3">
                                  <div>
                                    <p className="text-sm font-bold text-black dark:text-white">{L ? "اختصارات المدة" : "Duration shortcuts"}</p>
                                    <p className="text-[10px] text-black/40 dark:text-white/40 mt-1">{L ? "تعديل سريع بدون إنشاء فاتورة." : "Quick adjustments without creating an invoice."}</p>
                                  </div>
                                  <DollarSign className="w-4 h-4 text-black/30 dark:text-white/30" />
                                </div>
                                {hasSubscription && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => alignProjectSubscriptionMutation.mutate({ projectId })}
                                    disabled={adjustingProjectId === projectId}
                                    className="mb-3 h-9 w-full rounded-xl text-xs font-bold gap-1.5"
                                    data-testid="button-align-project-subscription-start"
                                  >
                                    {adjustingProjectId === projectId
                                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      : <RefreshCw className="w-3.5 h-3.5" />}
                                    {L ? "تصحيح البداية من تاريخ المشروع" : "Align start with project date"}
                                  </Button>
                                )}
                                <AdminProjectSubscriptionCell
                                  projectId={projectId}
                                  subscription={subscription}
                                  lang={lang}
                                  adjustmentPending={adjustingProjectId === projectId}
                                  onAdjust={(days) => adjustProjectSubscriptionMutation.mutate({ projectId, days })}
                                />
                              </div>

                              <div className="rounded-2xl border border-black/[0.08] bg-white dark:bg-gray-900 p-4 space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-bold text-black dark:text-white">{L ? "إضافات المشروع واشتراكاتها" : "Project add-ons & subscriptions"}</p>
                                    <p className="text-[10px] text-black/40 dark:text-white/40 mt-1">
                                      {L ? "كل إضافة لها اشتراك مستقل، مثل إضافة شهرية أو سنوية، وفاتورة منفصلة." : "Each add-on has its own term, such as monthly or annual, with a separate invoice."}
                                    </p>
                                  </div>
                                  <Package className="w-4 h-4 text-black/30 dark:text-white/30" />
                                </div>

                                {extraAddons.length > 0 && (
                                  <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.015] dark:bg-white/[0.02] p-3 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      <div>
                                        <Label className="text-[10px] text-black/50 dark:text-white/50">{L ? "الإضافة" : "Add-on"}</Label>
                                        <select
                                          value={addonForm.addonId}
                                          onChange={(event) => {
                                            const addon = extraAddons.find((item: any) => String(item.id || item._id) === event.target.value);
                                            setAddonForm(current => ({
                                              ...current,
                                              addonId: event.target.value,
                                              amount: addon ? String(addon.price || 0) : current.amount,
                                            }));
                                          }}
                                          className="mt-1 h-9 w-full rounded-xl border border-black/[0.1] bg-white px-2 text-xs dark:border-white/[0.1] dark:bg-gray-900 dark:text-white"
                                          data-testid="select-project-addon"
                                        >
                                          <option value="">{L ? "اختر الإضافة" : "Select an add-on"}</option>
                                          {extraAddons.filter((item: any) => item.isActive !== false).map((addon: any) => (
                                            <option key={addon.id || addon._id} value={addon.id || addon._id}>
                                              {L ? (addon.nameAr || addon.name) : (addon.name || addon.nameAr)} — {addon.billingType === "monthly" ? (L ? "شهري" : "Monthly") : addon.billingType === "annual" ? (L ? "سنوي" : "Annual") : addon.billingType === "lifetime" ? (L ? "مدى الحياة" : "Lifetime") : (L ? "مرة واحدة" : "One-time")}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <Label className="text-[10px] text-black/50 dark:text-white/50">{L ? "المبلغ (ريال)" : "Amount (SAR)"}</Label>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={addonForm.amount}
                                          onChange={(event) => setAddonForm(current => ({ ...current, amount: event.target.value }))}
                                          className="mt-1 h-9 text-xs"
                                          data-testid="input-project-addon-amount"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-[10px] text-black/50 dark:text-white/50">{L ? "حالة الفاتورة" : "Invoice status"}</Label>
                                        <select
                                          value={addonForm.paymentStatus}
                                          onChange={(event) => setAddonForm(current => ({ ...current, paymentStatus: event.target.value }))}
                                          className="mt-1 h-9 w-full rounded-xl border border-black/[0.1] bg-white px-2 text-xs dark:border-white/[0.1] dark:bg-gray-900 dark:text-white"
                                          data-testid="select-project-addon-payment-status"
                                        >
                                          <option value="paid">{L ? "مدفوعة — تدخل في الإيرادات" : "Paid — add to revenue"}</option>
                                          <option value="unpaid">{L ? "غير مدفوعة — مستحق" : "Unpaid — receivable"}</option>
                                        </select>
                                      </div>
                                      <div>
                                        <Label className="text-[10px] text-black/50 dark:text-white/50">{L ? "الحصة (اختياري)" : "Quota (optional)"}</Label>
                                        <Input
                                          type="number"
                                          min="0"
                                          placeholder={L ? "تلقائياً من الإضافة" : "Use add-on default"}
                                          value={addonForm.quotaTotal}
                                          onChange={(event) => setAddonForm(current => ({ ...current, quotaTotal: event.target.value }))}
                                          className="mt-1 h-9 text-xs"
                                          data-testid="input-project-addon-quota"
                                        />
                                      </div>
                                    </div>
                                    {addonForm.paymentStatus === "unpaid" && (
                                      <Input
                                        type="date"
                                        value={addonForm.dueDate}
                                        onChange={(event) => setAddonForm(current => ({ ...current, dueDate: event.target.value }))}
                                        className="h-9 text-xs"
                                        data-testid="input-project-addon-due-date"
                                      />
                                    )}
                                    <Button
                                      type="button"
                                      onClick={() => addProjectAddonMutation.mutate({
                                        projectId,
                                        data: {
                                          addonId: addonForm.addonId,
                                          amount: Number(addonForm.amount || 0),
                                          paymentStatus: addonForm.paymentStatus,
                                          dueDate: addonForm.dueDate || undefined,
                                          quotaTotal: addonForm.quotaTotal === "" ? undefined : Number(addonForm.quotaTotal),
                                        },
                                      })}
                                      disabled={!addonForm.addonId || addProjectAddonMutation.isPending}
                                      className="h-9 w-full rounded-xl bg-black text-white hover:bg-black/80 text-xs font-bold gap-1.5"
                                      data-testid="button-add-project-addon"
                                    >
                                      {addProjectAddonMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                                      {L ? "إضافة الاشتراك وإصدار الفاتورة" : "Add subscription & issue invoice"}
                                    </Button>
                                  </div>
                                )}

                                {projectAddonSubscriptions.length === 0 ? (
                                  <p className="text-xs text-black/35 dark:text-white/35">
                                    {L ? "لا توجد إضافات مفعلة لهذا المشروع." : "No add-on subscriptions are active for this project."}
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {projectAddonSubscriptions.map((addonSubscription: any) => {
                                      const addonId = addonSubscription.id || addonSubscription._id;
                                      const addonName = addonSubscription.addonNameAr || addonSubscription.addonId?.nameAr || addonSubscription.addonId?.name || "—";
                                      const isExpired = addonSubscription.status === "expired" || (addonSubscription.expiresAt && new Date(addonSubscription.expiresAt).getTime() <= Date.now());
                                      return (
                                        <div key={addonId} className="flex items-center gap-3 rounded-xl border border-black/[0.06] dark:border-white/[0.06] px-3 py-2.5">
                                          <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-black dark:text-white truncate">{addonName}</p>
                                            <p className="text-[10px] text-black/40 dark:text-white/40">
                                              {addonSubscription.billingType === "monthly" ? (L ? "شهري" : "Monthly") : addonSubscription.billingType === "annual" ? (L ? "سنوي" : "Annual") : addonSubscription.billingType === "lifetime" ? (L ? "مدى الحياة" : "Lifetime") : (L ? "مرة واحدة" : "One-time")}
                                              {" · "}
                                              {addonSubscription.expiresAt ? new Date(addonSubscription.expiresAt).toLocaleDateString(L ? "ar-SA" : "en-US") : (L ? "بدون انتهاء" : "No expiry")}
                                            </p>
                                          </div>
                                          <span className={`text-[10px] font-bold ${isExpired ? "text-black/40" : "text-black dark:text-white"}`}>
                                            {isExpired ? (L ? "منتهي" : "Expired") : (L ? "نشط" : "Active")}
                                          </span>
                                          {(isExpired || addonSubscription.status === "exhausted") && (
                                            <Button
                                              type="button"
                                              size="sm"
                                              onClick={() => renewProjectAddonMutation.mutate({ projectId, subId: addonId })}
                                              disabled={renewProjectAddonMutation.isPending}
                                              className="h-8 rounded-lg bg-black text-white hover:bg-black/80 text-[10px] font-bold"
                                              data-testid={`button-renew-project-addon-${addonId}`}
                                            >
                                              {renewProjectAddonMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                              {L ? "تجديد" : "Renew"}
                                            </Button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                <p className="text-[10px] text-black/35 dark:text-white/35">
                                  {L ? "الإضافة الشهرية تنتهي بعد 30 يوماً من تاريخ التفعيل، والتجديد يصدر فاتورة جديدة." : "Monthly add-ons expire after 30 days, and renewal issues a new invoice."}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                {/* Tab 2: Full Specs */}
                <TabsContent value="specs" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    {isLoadingSpecs ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-black/20" />
                        <p className="text-xs text-black/30 mr-2">{L ? "جاري تحميل المواصفات..." : "Loading specs..."}</p>
                      </div>
                    ) : (
                      <div className="px-6 py-5 space-y-5">
                        {/* Project Info */}
                        <div className="bg-black rounded-2xl p-5">
                          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Briefcase className="w-3.5 h-3.5" />{L ? "معلومات المشروع" : "Project Info"}
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold text-white/50 mb-1 block">{L ? "اسم المشروع" : "Project Name"}</label>
                              <Input placeholder={L ? "مثال: نظام إدارة مطعم الروضة" : "E.g. Restaurant Management System"} value={specsForm.projectName}
                                onChange={e => setSpecsForm(f => ({ ...f, projectName: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white placeholder:text-white/30" data-testid="input-specs-projectname" />
                            </div>
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold text-white/50 mb-1 block">{L ? "بريد العميل الرسمي" : "Official Client Email"}</label>
                              <Input type="email" placeholder="client@example.com" value={specsForm.clientEmail}
                                onChange={e => setSpecsForm(f => ({ ...f, clientEmail: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white placeholder:text-white/30" data-testid="input-specs-email" />
                            </div>
                            {canSeeFinance && (
                            <div>
                              <label className="text-[10px] font-bold text-white/50 mb-1 flex items-center gap-1">{L ? "الميزانية الكلية" : "Total Budget"} (<SARIcon size={8} className="opacity-60" />)</label>
                              <Input type="number" value={specsForm.totalBudget}
                                onChange={e => setSpecsForm(f => ({ ...f, totalBudget: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white" data-testid="input-specs-budget" />
                            </div>
                            )}
                            {canSeeFinance && (
                            <div>
                              <label className="text-[10px] font-bold text-white/50 mb-1 flex items-center gap-1">{L ? "المدفوع حالياً" : "Amount Paid"} (<SARIcon size={8} className="opacity-60" />)</label>
                              <Input type="number" value={specsForm.paidAmount}
                                onChange={e => setSpecsForm(f => ({ ...f, paidAmount: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white" data-testid="input-specs-paid" />
                            </div>
                            )}
                            <div>
                              <label className="text-[10px] font-bold text-white/50 mb-1 block">{L ? "تاريخ البداية" : "Start Date"}</label>
                              <Input type="date" value={specsForm.startDate}
                                onChange={e => setSpecsForm(f => ({ ...f, startDate: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white" data-testid="input-specs-start" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-white/50 mb-1 block">{L ? "تاريخ التسليم" : "Delivery Date"}</label>
                              <Input type="date" value={specsForm.deadline}
                                onChange={e => setSpecsForm(f => ({ ...f, deadline: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white" data-testid="input-specs-deadline" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-white/50 mb-1 block">{L ? "الساعات المقدّرة" : "Estimated Hours"}</label>
                              <Input type="number" placeholder="120" value={specsForm.estimatedHours}
                                onChange={e => setSpecsForm(f => ({ ...f, estimatedHours: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white" data-testid="input-specs-hours" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-white/50 mb-1 block">{L ? "حالة المشروع" : "Project Status"}</label>
                              <Select value={specsForm.projectStatus} onValueChange={v => setSpecsForm(f => ({ ...f, projectStatus: v }))}>
                                <SelectTrigger className="text-sm bg-white/10 border-white/20 text-white" data-testid="select-specs-status">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="planning">{L ? "تخطيط" : "Planning"}</SelectItem>
                                  <SelectItem value="in_dev">{L ? "قيد التطوير" : "In Development"}</SelectItem>
                                  <SelectItem value="testing">{L ? "اختبار" : "Testing"}</SelectItem>
                                  <SelectItem value="delivery">{L ? "تسليم" : "Delivery"}</SelectItem>
                                  <SelectItem value="closed">{L ? "مغلق" : "Closed"}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Tech Stack */}
                        <div className="border border-black/[0.07] rounded-2xl p-5 bg-white">
                          <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5" />{L ? "البنية التقنية" : "Technical Architecture"}
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold text-black/50 mb-1 block">{L ? "Stack التقني الكامل" : "Full Tech Stack"}</label>
                              <Input placeholder="React 18, Node.js, MongoDB..." value={specsForm.techStack}
                                onChange={e => setSpecsForm(f => ({ ...f, techStack: e.target.value }))}
                                className="text-sm" data-testid="input-specs-techstack" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black/50 mb-1 block">Framework</label>
                              <Input placeholder="Next.js 14, Laravel..." value={specsForm.framework}
                                onChange={e => setSpecsForm(f => ({ ...f, framework: e.target.value }))}
                                className="text-sm" data-testid="input-specs-framework" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black/50 mb-1 block">{L ? "لغة البرمجة" : "Programming Language"}</label>
                              <Select value={specsForm.language} onValueChange={v => setSpecsForm(f => ({ ...f, language: v }))}>
                                <SelectTrigger className="text-sm" data-testid="select-specs-lang"><SelectValue placeholder={L ? "اختر اللغة" : "Select Language"} /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="TypeScript">TypeScript</SelectItem>
                                  <SelectItem value="JavaScript">JavaScript</SelectItem>
                                  <SelectItem value="Python">Python</SelectItem>
                                  <SelectItem value="PHP">PHP</SelectItem>
                                  <SelectItem value="Dart">Dart (Flutter)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black/50 mb-1 block">{L ? "قاعدة البيانات" : "Database"}</label>
                              <Select value={specsForm.database} onValueChange={v => setSpecsForm(f => ({ ...f, database: v }))}>
                                <SelectTrigger className="text-sm" data-testid="select-specs-db"><SelectValue placeholder={L ? "اختر قاعدة البيانات" : "Select Database"} /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MongoDB Atlas M0">MongoDB Atlas (Free)</SelectItem>
                                  <SelectItem value="MongoDB Atlas M10">MongoDB Atlas M10</SelectItem>
                                  <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                                  <SelectItem value="MySQL">MySQL</SelectItem>
                                  <SelectItem value="Firebase">Firebase</SelectItem>
                                  <SelectItem value="Supabase">Supabase</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black/50 mb-1 block">{L ? "الاستضافة" : "Hosting"}</label>
                              <Select value={specsForm.hosting} onValueChange={v => setSpecsForm(f => ({ ...f, hosting: v }))}>
                                <SelectTrigger className="text-sm" data-testid="select-specs-hosting"><SelectValue placeholder={L ? "اختر الاستضافة" : "Select Hosting"} /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Vercel">Vercel</SelectItem>
                                  <SelectItem value="Netlify">Netlify</SelectItem>
                                  <SelectItem value="AWS">AWS</SelectItem>
                                  <SelectItem value="DigitalOcean">DigitalOcean</SelectItem>
                                  <SelectItem value="Hetzner">Hetzner</SelectItem>
                                  <SelectItem value="Hostinger">Hostinger</SelectItem>
                                  <SelectItem value="QIROX Cloud">QIROX Cloud</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black/50 mb-1 block">GitHub Repo URL</label>
                              <Input placeholder="https://github.com/qirox/project" value={specsForm.githubRepoUrl}
                                onChange={e => setSpecsForm(f => ({ ...f, githubRepoUrl: e.target.value }))}
                                className="text-sm" data-testid="input-specs-github" />
                            </div>
                          </div>
                        </div>

                        {/* Deployment */}
                        <div className="border border-black/[0.07] rounded-2xl p-5 bg-white">
                          <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Server className="w-3.5 h-3.5" />{L ? "بيانات النشر" : "Deployment Data"}
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-black/50 mb-1 block">Staging URL</label>
                              <Input placeholder="https://staging.project.com" value={specsForm.stagingUrl}
                                onChange={e => setSpecsForm(f => ({ ...f, stagingUrl: e.target.value }))}
                                className="text-sm" data-testid="input-specs-staging" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black/50 mb-1 block">Production URL</label>
                              <Input placeholder="https://project.com" value={specsForm.productionUrl}
                                onChange={e => setSpecsForm(f => ({ ...f, productionUrl: e.target.value }))}
                                className="text-sm" data-testid="input-specs-prod" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black/50 mb-1 block">Server IP</label>
                              <Input placeholder="192.168.1.100" value={specsForm.serverIp}
                                onChange={e => setSpecsForm(f => ({ ...f, serverIp: e.target.value }))}
                                className="text-sm" data-testid="input-specs-ip" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black/50 mb-1 block">{L ? "الدومين المخصص" : "Custom Domain"}</label>
                              <Input placeholder="project.com" value={specsForm.customDomain}
                                onChange={e => setSpecsForm(f => ({ ...f, customDomain: e.target.value }))}
                                className="text-sm" data-testid="input-specs-domain" />
                            </div>
                            {canEditProjectSecrets ? (
                              <>
                                <div>
                                  <label className="text-[10px] font-bold text-black/50 mb-1 block">{L ? "اسم المستخدم للنشر" : "Deployment Username"}</label>
                                  <Input value={specsForm.deploymentUsername}
                                    onChange={e => setSpecsForm(f => ({ ...f, deploymentUsername: e.target.value }))}
                                    className="text-sm" data-testid="input-specs-deploy-user" />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-black/50 mb-1 block">{L ? "كلمة مرور النشر" : "Deployment Password"}</label>
                                  <Input type="password" value={specsForm.deploymentPassword}
                                    onChange={e => setSpecsForm(f => ({ ...f, deploymentPassword: e.target.value }))}
                                    className="text-sm" data-testid="input-specs-deploy-pass" />
                                </div>
                                <div className="col-span-2">
                                  <label className="text-[10px] font-bold text-black/50 mb-1 block">Database URI / Connection String</label>
                                  <Input placeholder="mongodb+srv://..." value={specsForm.databaseUri}
                                    onChange={e => setSpecsForm(f => ({ ...f, databaseUri: e.target.value }))}
                                    className="text-sm font-mono" data-testid="input-specs-db-uri" />
                                </div>
                                <div className="col-span-2">
                                  <label className="text-[10px] font-bold text-black/50 mb-1 block">Environment Variables</label>
                                  <Textarea placeholder="NODE_ENV=production&#10;DATABASE_URL=..." value={specsForm.variables}
                                    onChange={e => setSpecsForm(f => ({ ...f, variables: e.target.value }))}
                                    className="text-sm font-mono h-20 resize-none" data-testid="input-specs-env" />
                                </div>
                              </>
                            ) : (
                              <div className="col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-800">
                                {L
                                  ? "بيانات الاتصال وكلمات المرور تظهر فقط لموظف Data Entry المعيّن على الطلب أو للمبرمج والإدارة."
                                  : "Connection strings and passwords are visible only to the assigned Data Entry employee, developers, and managers."}
                              </div>
                            )}
                          </div>
                        </div>

                         {/* Project integrations */}
                         <ProjectIntegrationsPanel
                           orderId={selectedOrder.id}
                           mode={["admin", "manager"].includes(currentUser?.role || "") ? "manage" : "readonly"}
                           onSecretCreated={addIntegrationKeyHint}
                         />

                        {/* Design Notes */}
                        <div className="border border-black/[0.07] rounded-2xl p-5 bg-white">
                          <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5" />{L ? "ملاحظات التصميم والتسليم" : "Design & Delivery Notes"}
                          </p>
                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] font-bold text-black/50 mb-1 block">{L ? "مفهوم المشروع" : "Project Concept"}</label>
                              <Textarea value={specsForm.projectConcept}
                                onChange={e => setSpecsForm(f => ({ ...f, projectConcept: e.target.value }))}
                                className="text-sm h-16 resize-none" data-testid="input-specs-concept" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-black/50 mb-1 block">{L ? "لوحة الألوان" : "Color Palette"}</label>
                                <Input placeholder="#000000, #FFFFFF..." value={specsForm.colorPalette}
                                  onChange={e => setSpecsForm(f => ({ ...f, colorPalette: e.target.value }))}
                                  className="text-sm" data-testid="input-specs-colors" />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-black/50 mb-1 block">{L ? "روابط مرجعية" : "Reference Links"}</label>
                                <Input placeholder="behance.net/..." value={specsForm.referenceLinks}
                                  onChange={e => setSpecsForm(f => ({ ...f, referenceLinks: e.target.value }))}
                                  className="text-sm" data-testid="input-specs-refs" />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black/50 mb-1 block">{L ? "ملاحظات الفريق" : "Team Notes"}</label>
                              <Textarea value={specsForm.teamNotes}
                                onChange={e => setSpecsForm(f => ({ ...f, teamNotes: e.target.value }))}
                                className="text-sm h-16 resize-none" data-testid="input-specs-team-notes" />
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={handleSaveSpecs}
                          className="w-full h-11 bg-black text-white hover:bg-gray-900 gap-2 rounded-xl"
                          disabled={saveSpecsMutation.isPending}
                          data-testid="button-save-specs"
                        >
                          {saveSpecsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          {L ? "حفظ المواصفات التقنية" : "Save Technical Specs"}
                        </Button>

                        {/* ─── Usage Guide Section ─── */}
                        <div className="border border-black/10 dark:border-white/10 rounded-2xl p-5 bg-black/[0.04] dark:bg-white/[0.06]">
                          <p className="text-[10px] font-bold text-black dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" />{L ? "شرح استخدام النظام" : "System Usage Guide"}
                          </p>
                          {!orderProject && (
                            <p className="text-xs text-black dark:text-white mb-3">⚠️ {L ? "لا يوجد مشروع مرتبط بهذا الطلب بعد. أنشئ المشروع أولاً لتتمكن من إضافة شرح الاستخدام." : "No project linked to this order yet. Create the project first to add the usage guide."}</p>
                          )}
                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] font-bold text-black dark:text-white mb-1 block">{L ? "عنوان الدليل" : "Guide Title"}</label>
                              <Input value={guideForm.title} onChange={e => setGuideForm(f => ({ ...f, title: e.target.value }))}
                                placeholder={L ? "شرح استخدام النظام" : "System Usage Guide"} className="text-sm bg-white" data-testid="input-guide-title" disabled={!orderProject} />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black dark:text-white mb-1 block">{L ? "محتوى الشرح (يظهر للعميل في لوحة التحكم)" : "Guide Content (shown to client in dashboard)"}</label>
                              <Textarea value={guideForm.description} onChange={e => setGuideForm(f => ({ ...f, description: e.target.value }))}
                                placeholder={L ? "اكتب شرحاً مفصّلاً لكيفية استخدام النظام، خطوة بخطوة..." : "Write a detailed guide on how to use the system, step by step..."} className="text-sm h-28 resize-none bg-white" data-testid="textarea-guide-desc" disabled={!orderProject} />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black dark:text-white mb-1 block">{L ? "روابط ملفات مرفقة (رابط في كل سطر)" : "Attached file links (one link per line)"}</label>
                              <Textarea value={guideForm.files} onChange={e => setGuideForm(f => ({ ...f, files: e.target.value }))}
                                placeholder="https://docs.example.com/guide.pdf&#10;https://example.com/video.mp4" className="text-sm h-16 resize-none font-mono bg-white text-xs" data-testid="textarea-guide-files" disabled={!orderProject} dir="ltr" />
                            </div>
                            <Button onClick={handleSaveGuide} disabled={saveGuideMutation.isPending || !orderProject}
                              className="w-full h-9 bg-black dark:bg-white hover:bg-black dark:bg-white text-white gap-2 rounded-xl text-xs font-bold"
                              data-testid="button-save-guide">
                              {saveGuideMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                              {L ? "حفظ شرح الاستخدام" : "Save Usage Guide"}
                            </Button>
                          </div>
                        </div>

                        {/* ─── Delivery Data Section ─── */}
                        <div className="border border-black/10 dark:border-white/10 rounded-2xl p-5 bg-black/[0.04] dark:bg-white/[0.06]">
                          <p className="text-[10px] font-bold text-black dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Package className="w-3.5 h-3.5" />{L ? "تسليم المشروع — فيديو وملفات" : "Project Delivery — Video & Files"}
                          </p>
                          {!orderProject && (
                            <p className="text-xs text-black dark:text-white mb-3">⚠️ {L ? "لا يوجد مشروع مرتبط. أنشئ المشروع أولاً." : "No project linked. Create the project first."}</p>
                          )}
                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] font-bold text-black dark:text-white mb-1 block">{L ? "رابط فيديو التسليم / الشرح (YouTube أو أي رابط)" : "Delivery video / guide link (YouTube or any URL)"}</label>
                              <Input value={deliveryForm.videoUrl} onChange={e => setDeliveryForm(f => ({ ...f, videoUrl: e.target.value }))}
                                placeholder="https://youtube.com/watch?v=..." className="text-sm bg-white font-mono" dir="ltr" disabled={!orderProject} data-testid="input-delivery-video" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black dark:text-white mb-1 block">{L ? "ملفات التسليم (سطر لكل ملف: اسم|رابط|إيموجي)" : "Delivery files (one per line: name|url|emoji)"}</label>
                              <Textarea value={deliveryForm.files} onChange={e => setDeliveryForm(f => ({ ...f, files: e.target.value }))}
                                placeholder={"دليل الاستخدام|https://drive.google.com/...|📄\nشرح الكود المصدري|https://github.com/...|💻"}
                                className="text-sm h-24 resize-none font-mono bg-white text-xs" data-testid="textarea-delivery-files" disabled={!orderProject} dir="ltr" />
                              <p className="text-[10px] text-black dark:text-white mt-1">{L ? "صيغة كل سطر: اسم الملف | رابط التحميل | إيموجي (اختياري)" : "Each line format: filename | download URL | emoji (optional)"}</p>
                            </div>
                            <Button onClick={handleSaveDelivery} disabled={saveDeliveryMutation.isPending || !orderProject}
                              className="w-full h-9 bg-black dark:bg-white hover:bg-black dark:bg-white text-white gap-2 rounded-xl text-xs font-bold"
                              data-testid="button-save-delivery">
                              {saveDeliveryMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />}
                              حفظ بيانات التسليم
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                {/* Tab 3: Manage */}
                <TabsContent value="manage" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="px-6 py-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-black/50 mb-1.5">{L ? "الحالة" : "Status"}</label>
                          <Select value={editStatus} onValueChange={setEditStatus}>
                            <SelectTrigger className="h-10" data-testid="select-order-status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusMap).map(([key, val]) => (
                                <SelectItem key={key} value={key}>{val.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {canSeeFinance && (
                        <div>
                          <label className="flex items-center gap-1 text-xs font-medium text-black/50 mb-1.5">{L ? "المبلغ" : "Amount"} (<SARIcon size={9} className="opacity-60" />)</label>
                          <Input type="number" value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="h-10" data-testid="input-order-amount" />
                        </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-black/50 mb-1.5 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5" />{L ? "الأولوية" : "Priority"}
                        </label>
                        <Select value={editPriority} onValueChange={setEditPriority}>
                          <SelectTrigger className="h-10" data-testid="select-order-priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">{L ? "منخفضة" : "Low"}</SelectItem>
                            <SelectItem value="medium">{L ? "متوسطة" : "Medium"}</SelectItem>
                            <SelectItem value="high">{L ? "مرتفعة" : "High"}</SelectItem>
                            <SelectItem value="urgent">{L ? "عاجلة 🔴" : "Urgent 🔴"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-black/50 mb-1.5 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5" />{L ? "تعيين لموظف" : "Assign to Employee"}
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            className="h-10 w-full rounded-md border border-black/10 bg-white px-3 text-right text-sm flex items-center justify-between gap-2"
                            onClick={() => setAssigneeMenuOpen(open => !open)}
                            data-testid="select-assign-employee"
                          >
                            <span className="truncate">
                              {editAssignedToIds.length
                                ? employees?.filter(emp => editAssignedToIds.includes(emp.id)).map(emp => emp.fullName).join("، ")
                                : (L ? "غير معين" : "Unassigned")}
                            </span>
                            <ChevronDown className="w-4 h-4 shrink-0 text-black/40" />
                          </button>
                          {assigneeMenuOpen && (
                            <div className="absolute right-0 left-0 top-11 z-50 rounded-md border border-black/10 bg-white p-2 shadow-lg max-h-56 overflow-y-auto">
                              <button
                                type="button"
                                className="w-full rounded px-2 py-1.5 text-right text-xs text-black/50 hover:bg-black/[0.04]"
                                onClick={() => setEditAssignedToIds([])}
                              >
                                {L ? "إلغاء تعيين الكل" : "Unassign all"}
                              </button>
                              {employees?.map(emp => {
                                const checked = editAssignedToIds.includes(emp.id);
                                return (
                                  <label key={emp.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-xs hover:bg-black/[0.04]">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => setEditAssignedToIds(current => checked
                                        ? current.filter(id => id !== emp.id)
                                        : [...current, emp.id])}
                                    />
                                    <span>{emp.fullName} — {roleLabels[emp.role] || emp.role}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        {selectedOrder.status === "in_progress" && (
                          <div className="mb-4">
                            <label className="block text-xs font-medium text-black/50 mb-1.5 flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5" />{L ? "نسبة الإنجاز %" : "Progress %"}
                            </label>
                            <div className="flex items-center gap-3">
                              <input type="range" min="0" max="100" step="5" value={editProgress} onChange={e => setEditProgress(Number(e.target.value))} className="flex-1 accent-black" />
                              <span className="text-sm font-black text-black dark:text-white w-10 text-left">{editProgress}%</span>
                            </div>
                            <div className="h-1.5 bg-black/[0.06] dark:bg-white/[0.08] rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-black dark:bg-white rounded-full transition-all" style={{ width: `${editProgress}%` }} />
                            </div>
                          </div>
                        )}
                        <label className="block text-xs font-medium text-black/50 mb-1.5">{L ? "ملاحظات داخلية للفريق" : "Internal Team Notes"}</label>
                        <Textarea
                          value={editAdminNotes}
                          onChange={(e) => setEditAdminNotes(e.target.value)}
                          placeholder={L ? "ملاحظات للفريق الداخلي..." : "Notes for the internal team..."}
                          rows={4}
                          className="text-sm resize-none"
                          data-testid="input-admin-notes"
                        />
                      </div>

                      <Button
                        onClick={handleSaveBasic}
                        className="w-full h-11 bg-black text-white hover:bg-gray-900 gap-2 rounded-xl"
                        disabled={updateMutation.isPending}
                        data-testid="button-save-order"
                      >
                        {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        <Save className="w-4 h-4" />
                        {L ? "حفظ التغييرات" : "Save Changes"}
                      </Button>

                      {["admin", "manager"].includes(currentUser?.role || "") && (
                        <div className="border border-black/[0.08] rounded-2xl p-4 bg-white space-y-4" data-testid="github-provisioning-panel">
                          {orderProject && (
                            <ProjectSubscriptionCard project={orderProject} lang={lang} compact />
                          )}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-black/[0.04] flex items-center justify-center">
                                <Link2 className="w-4 h-4 text-black/60" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-black">{L ? "مستودع GitHub" : "GitHub Repository"}</p>
                                <p className="text-[10px] text-black/40">
                                  {githubSetup?.connection?.connected
                                    ? `${L ? "متصل بالحساب" : "Connected as"} ${githubSetup.connection.login}`
                                    : L ? "غير متصل" : "Not connected"}
                                </p>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                              githubSetup?.repository?.status === "ready"
                                ? "bg-emerald-50 text-emerald-700"
                                : githubSetup?.repository?.status === "failed"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-black/[0.04] text-black/50"
                            }`}>
                              {isLoadingGithubSetup
                                ? (L ? "جارٍ التحقق" : "Checking")
                                : githubSetup?.repository?.status === "ready"
                                  ? (L ? "جاهز" : "Ready")
                                  : githubSetup?.repository?.status === "failed"
                                    ? (L ? "فشل" : "Failed")
                                    : (L ? "بانتظار التجهيز" : "Pending")}
                            </span>
                          </div>

                          {githubSetup?.repository?.url && (
                            <a
                              href={githubSetup.repository.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between gap-2 rounded-xl border border-black/[0.07] px-3 py-2 text-xs text-black/70 hover:bg-black/[0.02]"
                            >
                              <span className="truncate" dir="ltr">{githubSetup.repository.owner}/{githubSetup.repository.name}</span>
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            </a>
                          )}

                          {githubSetup?.repository?.url && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 space-y-2">
                              <div>
                                <p className="text-xs font-bold text-amber-900">
                                   {L ? "خيارات المستودع" : "Repository options"}
                                </p>
                                <p className="text-[10px] leading-5 text-amber-800/80 mt-1">
                                  {L
                                     ? "لن يتغير المستودع تلقائياً. اختر الإجراء المناسب، وسيتم حفظ الرابط الجديد للمشروع فقط بعد نجاح العملية."
                                     : "The repository will never change automatically. Choose an action; the new project link is saved only after it succeeds."}
                                </p>
                              </div>
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                 <button
                                   type="button"
                                   onClick={() => setGithubRepositoryAction("move")}
                                   className={`text-right rounded-xl border p-3 transition-colors ${
                                     githubRepositoryAction === "move"
                                       ? "border-amber-500 bg-white shadow-sm"
                                       : "border-amber-200/70 bg-white/50 hover:bg-white"
                                   }`}
                                   data-testid="button-select-move-repository"
                                 >
                                   <span className="flex items-center gap-2 text-xs font-bold text-amber-950">
                                     <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                                     {L ? "نقل المستودع وحفظ الجديد" : "Move repository and save new link"}
                                   </span>
                                   <span className="block text-[10px] leading-4 text-amber-800/70 mt-1">
                                     {L ? "ينسخ الملفات والفروع ثم يحفظ الرابط الجديد للمشروع" : "Copies files and branches, then saves the new project link"}
                                   </span>
                                 </button>
                                 <button
                                   type="button"
                                   onClick={() => setGithubRepositoryAction("import")}
                                   className={`text-right rounded-xl border p-3 transition-colors ${
                                     githubRepositoryAction === "import"
                                       ? "border-amber-500 bg-white shadow-sm"
                                       : "border-amber-200/70 bg-white/50 hover:bg-white"
                                   }`}
                                   data-testid="button-select-import-repository"
                                 >
                                   <span className="flex items-center gap-2 text-xs font-bold text-amber-950">
                                     <Link2 className="w-3.5 h-3.5 shrink-0" />
                                     {L ? "استيراد مستودع موجود" : "Import existing repository"}
                                   </span>
                                   <span className="block text-[10px] leading-4 text-amber-800/70 mt-1">
                                     {L ? "يربط المستودع بالمشروع بدون نسخ أو حذف الملفات" : "Links an existing repository without copying or deleting files"}
                                   </span>
                                 </button>
                               </div>
                              <div className="flex gap-2">
                                <Input
                                  value={githubMigrationTarget}
                                  onChange={(event) => setGithubMigrationTarget(event.target.value)}
                                   placeholder={githubRepositoryAction === "move"
                                     ? "https://github.com/owner/new-repository"
                                     : "https://github.com/owner/existing-repository"}
                                  className="h-9 text-xs bg-white"
                                  dir="ltr"
                                  data-testid="input-github-migration-target"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-9 shrink-0 text-xs border-amber-300 text-amber-900 hover:bg-amber-100"
                                  onClick={() => {
                                     const message = githubRepositoryAction === "move"
                                       ? (L
                                         ? "سيتم نقل كل ملفات وفروع المستودع الحالي إلى المستودع الجديد، ثم حفظ الرابط الجديد للمشروع. هل تريد المتابعة؟"
                                         : "All files and branches will be moved to the new repository, then the new project link will be saved. Continue?")
                                       : (L
                                         ? "سيتم ربط المشروع بالمستودع الموجود بدون نسخ أو حذف الملفات. هل تريد المتابعة؟"
                                         : "The project will be linked to the existing repository without copying or deleting files. Continue?");
                                     if (!window.confirm(message)) return;
                                     if (githubRepositoryAction === "move") {
                                       githubMigrationMutation.mutate();
                                     } else {
                                       githubImportMutation.mutate();
                                     }
                                  }}
                                   disabled={
                                     !githubMigrationTarget.trim()
                                     || githubMigrationMutation.isPending
                                     || githubImportMutation.isPending
                                   }
                                   data-testid={githubRepositoryAction === "move" ? "button-move-github-repository" : "button-import-github-repository"}
                                >
                                   {githubMigrationMutation.isPending || githubImportMutation.isPending
                                     ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                     : githubRepositoryAction === "move"
                                       ? <RefreshCw className="w-3.5 h-3.5" />
                                       : <Link2 className="w-3.5 h-3.5" />}
                                   {githubRepositoryAction === "move"
                                     ? (L ? "نقل المستودع وحفظ الجديد" : "Move repository and save")
                                     : (L ? "استيراد المستودع وحفظه" : "Import repository and save")}
                                </Button>
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-[10px] font-bold text-black/45 mb-1.5">{L ? "رؤية المستودع" : "Repository visibility"}</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setGithubVisibility("private")}
                                disabled={!isGithubVisibilityReady}
                                className={`h-9 rounded-xl border text-xs font-semibold ${githubVisibility === "private" ? "bg-black text-white border-black" : "bg-white text-black/60 border-black/10"}`}
                                data-testid="github-visibility-private"
                              >
                                {L ? "خاص" : "Private"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setGithubVisibility("public")}
                                disabled={!isGithubVisibilityReady}
                                className={`h-9 rounded-xl border text-xs font-semibold ${githubVisibility === "public" ? "bg-black text-white border-black" : "bg-white text-black/60 border-black/10"}`}
                                data-testid="github-visibility-public"
                              >
                                {L ? "عام" : "Public"}
                              </button>
                            </div>
                            <Button
                              variant="outline"
                              className="w-full h-9 mt-2 text-xs border-black/10"
                              onClick={() => githubVisibilityMutation.mutate()}
                              disabled={!isGithubVisibilityReady || githubVisibilityMutation.isPending}
                              data-testid="button-save-github-visibility"
                            >
                              {githubVisibilityMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin ml-2" />}
                              {L ? "حفظ الرؤية" : "Save visibility"}
                            </Button>
                          </div>

                          {!githubSetup?.connection?.connected && (
                            <div className="grid sm:grid-cols-2 gap-2">
                              <a href="/employee/deployment-cloud" className="h-9 rounded-xl bg-black text-white text-xs font-semibold flex items-center justify-center">
                                {L ? "ربط حساب GitHub" : "Connect GitHub"}
                              </a>
                              <a
                                href="https://github.com/settings/tokens/new?scopes=repo&description=QIROX%20Project%20Provisioning"
                                target="_blank"
                                rel="noreferrer"
                                className="h-9 rounded-xl border border-black/10 text-black/65 text-xs font-semibold flex items-center justify-center gap-1.5"
                              >
                                {L ? "إنشاء Classic PAT" : "Create Classic PAT"}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}

                          {githubSetup?.repository?.error && (
                            <p className="text-xs leading-5 text-red-700 bg-red-50 rounded-xl px-3 py-2">
                              {githubSetup.repository.error}
                            </p>
                          )}

                          {["approved", "in_progress"].includes(selectedOrder.status) && githubSetup?.repository?.status !== "ready" && (
                            <Button
                              className="w-full h-10 gap-2 text-sm bg-black text-white"
                              onClick={() => convertToProjectMutation.mutate(selectedOrder)}
                              disabled={convertToProjectMutation.isPending}
                              data-testid="button-convert-to-project"
                            >
                              {convertToProjectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                              {githubSetup?.repository?.status === "failed"
                                ? (L ? "إعادة محاولة تجهيز المستودع" : "Retry repository provisioning")
                                : (L ? "تجهيز المشروع والمستودع" : "Provision project and repository")}
                            </Button>
                          )}
                        </div>
                      )}

                      {/* ── AI Checklist Generator ── */}
                      <div className="pt-3 border-t border-black/[0.05]">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl flex items-center justify-center">
                              <Sparkles className="w-3.5 h-3.5 text-black dark:text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-black">{L ? "دليل التنفيذ الذكي" : "AI Workflow Guide"}</p>
                              <p className="text-[10px] text-black/40">{L ? "تشيك ليست مخصصة بالذكاء الاصطناعي" : "AI-generated custom checklist"}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={async () => {
                              setAiChecklistLoading(true);
                              setAiChecklist([]);
                              try {
                                const o = selectedOrder as any;
                                const res = await fetch("/api/ai/project-checklist", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  credentials: "include",
                                  body: JSON.stringify({
                                    businessName: o.businessName || o.clientId?.fullName || "",
                                    sector: o.sector || o.projectType || "",
                                    planTier: o.planTier || o.subscriptionTier || "",
                                    targetAudience: o.targetAudience || "",
                                    requiredFunctions: o.requiredFunctions || o.notes || "",
                                    addons: Array.isArray(o.selectedAddons) ? o.selectedAddons.join("، ") : (o.selectedAddons || ""),
                                    visualStyle: o.visualStyle || "",
                                    siteLanguage: o.siteLanguage || "ar",
                                    integrations: [o.whatsappIntegration && "واتساب", o.needsPayment && "دفع", o.needsBooking && "حجز"].filter(Boolean).join("، "),
                                  }),
                                });
                                const data = await res.json();
                                const phases = data.phases || [];
                                setAiChecklist(phases);
                                setAiChecklistExpanded(Object.fromEntries(phases.map((_: any, i: number) => [i, true])));
                              } catch {
                                // ignore
                              } finally {
                                setAiChecklistLoading(false);
                              }
                            }}
                            disabled={aiChecklistLoading}
                            className="gap-1.5 bg-black dark:bg-white hover:bg-black dark:bg-white text-white h-8 text-xs rounded-xl"
                            data-testid="button-ai-checklist"
                          >
                            {aiChecklistLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                            {aiChecklistLoading ? (L ? "جارٍ التوليد..." : "Generating...") : (aiChecklist.length > 0 ? (L ? "إعادة التوليد" : "Regenerate") : (L ? "توليد التشيك ليست" : "Generate Checklist"))}
                          </Button>
                        </div>

                        {aiChecklist.length > 0 && (
                          <div className="space-y-3">
                            {aiChecklist.map((phase, pi) => {
                              const doneCount = (phase.tasks || []).filter((_: string, ti: number) => aiChecklistDone[`${pi}-${ti}`]).length;
                              const expanded = aiChecklistExpanded[pi] !== false;
                              return (
                                <div key={pi} className="border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden bg-black/[0.04] dark:bg-white/[0.06]">
                                  <button
                                    onClick={() => setAiChecklistExpanded(p => ({ ...p, [pi]: !p[pi] }))}
                                    className="w-full flex items-center justify-between p-3 hover:bg-black/[0.04] dark:bg-white/[0.06] transition-colors text-right"
                                    data-testid={`checklist-phase-toggle-${pi}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${doneCount === phase.tasks.length ? "bg-black dark:bg-white text-white" : "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white"}`}>
                                        {doneCount === phase.tasks.length ? <Check className="w-3 h-3" /> : pi + 1}
                                      </div>
                                      <span className="text-sm font-bold text-black">{phase.name}</span>
                                      <span className="text-[10px] text-black/40 font-medium">{doneCount}/{phase.tasks.length}</span>
                                    </div>
                                    {expanded ? <ChevronUp className="w-4 h-4 text-black/30" /> : <ChevronDown className="w-4 h-4 text-black/30" />}
                                  </button>
                                  {expanded && (
                                    <div className="px-3 pb-3 space-y-1.5">
                                      {(phase.tasks || []).map((task: string, ti: number) => {
                                        const key = `${pi}-${ti}`;
                                        const done = aiChecklistDone[key];
                                        return (
                                          <button
                                            key={ti}
                                            onClick={() => setAiChecklistDone(p => ({ ...p, [key]: !p[key] }))}
                                            className={`w-full flex items-start gap-2.5 text-right py-2 px-2.5 rounded-xl transition-all ${done ? "bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10" : "hover:bg-white border border-transparent"}`}
                                            data-testid={`checklist-task-${pi}-${ti}`}
                                          >
                                            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${done ? "bg-black dark:bg-white border-black dark:border-white" : "border-black/20"}`}>
                                              {done && <Check className="w-2.5 h-2.5 text-white" />}
                                            </div>
                                            <span className={`text-xs leading-relaxed ${done ? "line-through text-black/30" : "text-black/70"}`}>{task}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            <p className="text-[10px] text-black/30 text-center">
                              {L ? "انقر على مهمة لتحديدها كمنجزة ✓" : "Click a task to mark it as done ✓"}
                            </p>
                          </div>
                        )}
                      </div>

                    </div>
                  </ScrollArea>
                </TabsContent>
                {/* Tab 4: Expenses & Profit */}
                <TabsContent value="profit" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="px-6 py-5 space-y-5">
                      {/* Profit Summary — finance roles only */}
                      {canSeeFinance && (() => {
                        const expenses = orderExpenses || [];
                        const revenue = selectedOrder?.totalAmount || 0;
                        const totalCosts = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
                        const netProfit = revenue - totalCosts;
                        const margin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : "0";
                        const isProfit = netProfit >= 0;
                        return (
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 rounded-2xl p-4">
                              <p className="text-[10px] text-black dark:text-white font-bold mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />{L ? "إجمالي الإيراد" : "Total Revenue"}</p>
                              <p className="text-xl font-black text-black dark:text-white">{revenue.toLocaleString()}</p>
                              <SARIcon size={11} className="opacity-40 mt-0.5" />
                            </div>
                            <div className="bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 rounded-2xl p-4">
                              <p className="text-[10px] text-black dark:text-white font-bold mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3" />{L ? "إجمالي التكاليف" : "Total Costs"}</p>
                              <p className="text-xl font-black text-black dark:text-white">{totalCosts.toLocaleString()}</p>
                              <SARIcon size={11} className="opacity-40 mt-0.5" />
                            </div>
                            <div className={`border rounded-2xl p-4 ${isProfit ? "bg-black/[0.04] dark:bg-white/[0.06] border-black/10 dark:border-white/10" : "bg-black/[0.04] dark:bg-white/[0.06] border-black/10 dark:border-white/10"}`}>
                              <p className={`text-[10px] font-bold mb-1 flex items-center gap-1 ${isProfit ? "text-black dark:text-white" : "text-black dark:text-white"}`}>
                                {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{L ? "صافي الربح" : "Net Profit"}
                              </p>
                              <p className={`text-xl font-black ${isProfit ? "text-black dark:text-white" : "text-black dark:text-white"}`}>{netProfit.toLocaleString()}</p>
                              <p className={`text-[10px] ${isProfit ? "text-black dark:text-white" : "text-black dark:text-white"}`}>{L ? "هامش" : "Margin"} {margin}%</p>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Profit Bar — finance roles only */}
                      {canSeeFinance && (() => {
                        const expenses = orderExpenses || [];
                        const revenue = selectedOrder?.totalAmount || 0;
                        const totalCosts = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
                        const costPct = revenue > 0 ? Math.min((totalCosts / revenue) * 100, 100) : 0;
                        return revenue > 0 ? (
                          <div className="bg-white border border-black/[0.06] rounded-2xl p-4">
                            <div className="flex justify-between text-[10px] text-black/40 mb-2">
                              <span>{L ? "التكاليف" : "Costs"} {costPct.toFixed(0)}%</span>
                              <span>{L ? "الربح" : "Profit"} {(100 - costPct).toFixed(0)}%</span>
                            </div>
                            <div className="h-3 bg-black/[0.04] rounded-full overflow-hidden flex">
                              <div className="h-full bg-black/[0.08] dark:bg-white/[0.1] rounded-full transition-all duration-500" style={{ width: `${costPct}%` }} />
                              <div className="h-full bg-black/[0.08] dark:bg-white/[0.1] flex-1 transition-all duration-500" />
                            </div>
                            <div className="flex gap-4 mt-2 text-[10px]">
                              <span className="flex items-center gap-1 text-black dark:text-white"><span className="w-2 h-2 rounded-full bg-black/[0.08] dark:bg-white/[0.1] inline-block" />{L ? "تكاليف" : "Costs"}</span>
                              <span className="flex items-center gap-1 text-black dark:text-white"><span className="w-2 h-2 rounded-full bg-black/[0.08] dark:bg-white/[0.1] inline-block" />{L ? "ربح صافي" : "Net Profit"}</span>
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {/* Add Expense */}
                      <div className="bg-white border border-black/[0.06] rounded-2xl p-4">
                        <p className="text-[10px] font-bold text-black/50 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <PlusCircle className="w-3.5 h-3.5" />{L ? "إضافة مصروف جديد" : "Add New Expense"}
                        </p>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <Label className="text-[10px] text-black/40 mb-1 block">{L ? "الفئة" : "Category"}</Label>
                            <Select value={newExpense.category} onValueChange={v => setNewExpense(p => ({ ...p, category: v }))}>
                              <SelectTrigger className="h-8 text-xs border-black/[0.08]" data-testid="select-expense-category">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hosting">{L ? "استضافة" : "Hosting"}</SelectItem>
                                <SelectItem value="domain">{L ? "دومين" : "Domain"}</SelectItem>
                                <SelectItem value="freelancer">{L ? "مستقل / مقاول" : "Freelancer / Contractor"}</SelectItem>
                                <SelectItem value="license">{L ? "ترخيص / اشتراك" : "License / Subscription"}</SelectItem>
                                <SelectItem value="ads">{L ? "إعلانات" : "Ads"}</SelectItem>
                                <SelectItem value="design">{L ? "تصميم" : "Design"}</SelectItem>
                                <SelectItem value="salary">{L ? "راتب / أجر" : "Salary / Wage"}</SelectItem>
                                <SelectItem value="commission">{L ? "عمولة" : "Commission"}</SelectItem>
                                <SelectItem value="other">{L ? "أخرى" : "Other"}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-[10px] text-black/40 mb-1 flex items-center gap-1">{L ? "المبلغ" : "Amount"} (<SARIcon size={8} className="opacity-50" />)</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={newExpense.amount}
                              onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))}
                              className="h-8 text-xs border-black/[0.08]"
                              data-testid="input-expense-amount"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder={L ? "وصف المصروف (مثال: استضافة Cloudflare لمدة سنة)" : "Expense description (e.g., Cloudflare hosting for 1 year)"}
                            value={newExpense.description}
                            onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))}
                            className="h-8 text-xs border-black/[0.08] flex-1"
                            data-testid="input-expense-description"
                          />
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-black text-white hover:bg-black/80 px-4 flex-shrink-0"
                            onClick={() => {
                              if (!newExpense.description || !newExpense.amount) return;
                              addExpenseMutation.mutate({ category: newExpense.category, description: newExpense.description, amount: Number(newExpense.amount) });
                            }}
                            disabled={addExpenseMutation.isPending || !newExpense.description || !newExpense.amount}
                            data-testid="button-add-expense"
                          >
                            {addExpenseMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      </div>

                      {/* Expenses List */}
                      <div>
                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-wider mb-2">{L ? "قائمة المصروفات" : "Expenses List"} ({(orderExpenses || []).length})</p>
                        {isLoadingExpenses ? (
                          <div className="py-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-black/20" /></div>
                        ) : (orderExpenses || []).length === 0 ? (
                          <div className="py-8 text-center bg-black/[0.01] border border-black/[0.04] rounded-2xl">
                            <BarChart3 className="w-8 h-8 text-black/10 mx-auto mb-2" />
                            <p className="text-xs text-black/25">{L ? "لا توجد مصروفات مسجّلة لهذا الطلب" : "No expenses recorded for this order"}</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(orderExpenses || []).map((exp: any) => {
                              const catLabels: Record<string, { label: string; color: string }> = {
                                hosting: { label: L ? "استضافة" : "Hosting", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white" },
                                domain: { label: L ? "دومين" : "Domain", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white" },
                                freelancer: { label: L ? "مستقل" : "Freelancer", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white" },
                                license: { label: L ? "ترخيص" : "License", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white" },
                                ads: { label: L ? "إعلانات" : "Ads", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white" },
                                design: { label: L ? "تصميم" : "Design", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white" },
                                salary: { label: L ? "راتب" : "Salary", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white" },
                                commission: { label: L ? "عمولة" : "Commission", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white" },
                                other: { label: L ? "أخرى" : "Other", color: "bg-black/[0.04] text-black/50" },
                              };
                              const cat = catLabels[exp.category] || catLabels.other;
                              return (
                                <div key={exp.id} className="flex items-center gap-3 bg-white border border-black/[0.06] rounded-xl px-4 py-3 group">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cat.color}`}>{cat.label}</span>
                                  <p className="text-xs text-black/70 flex-1 truncate">{exp.description}</p>
                                  <p className="text-xs font-bold text-black dark:text-white flex-shrink-0 flex items-center gap-1">{Number(exp.amount).toLocaleString()} <SARIcon size={10} className="opacity-60" /></p>
                                  <button
                                    onClick={() => deleteExpenseMutation.mutate(exp.id)}
                                    disabled={deleteExpenseMutation.isPending}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-black/[0.04] dark:bg-white/[0.06] text-black/70 dark:text-white/70 hover:text-black dark:text-white"
                                    data-testid={`button-delete-expense-${exp.id}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Tab 5: Project Files */}
                <TabsContent value="files" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="px-6 py-5 space-y-6">
                      {!orderProject ? (
                        <div className="py-16 text-center">
                          <FolderOpen className="w-10 h-10 text-black/10 mx-auto mb-3" />
                          <p className="text-sm font-semibold text-black/30">{L ? "لا يوجد مشروع مرتبط بهذا الطلب" : "No project linked to this order"}</p>
                          <p className="text-xs text-black/20 mt-1">{L ? "أنشئ المشروع أولاً من تبويب إدارة الطلب" : "Create the project first from the Manage Order tab"}</p>
                        </div>
                      ) : (
                        <>
                          {["admin", "manager"].includes(currentUser?.role || "") && (
                            <div className="bg-white border border-black/[0.08] rounded-2xl p-4 space-y-4" data-testid="project-code-panel">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-xl bg-black/[0.04] flex items-center justify-center shrink-0">
                                    <FolderOpen className="w-4 h-4 text-black/60" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-black dark:text-white">
                                      {L ? "أكواد المشروع" : "Project Code"}
                                    </p>
                                    <p className="text-[10px] text-black/40 leading-5">
                                      {L
                                        ? "نسخة GitHub الحالية مع حماية تلقائية قبل أي رفع"
                                        : "Current GitHub code with automatic protection before uploads"}
                                    </p>
                                  </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                                  githubCode?.repository?.status === "ready"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-black/[0.04] text-black/50"
                                }`}>
                                  {isLoadingGithubCode
                                    ? (L ? "جارٍ القراءة" : "Loading")
                                    : githubCode?.repository?.status === "ready"
                                      ? (L ? "متصل" : "Connected")
                                      : (L ? "غير مهيأ" : "Not configured")}
                                </span>
                              </div>

                              {githubCode?.repository?.status === "ready" ? (
                                <>
                                  <div className="rounded-xl border border-black/[0.06] bg-black/[0.015] p-3 space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <a
                                        href={githubCode.repository.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-semibold text-black/75 hover:underline truncate"
                                        dir="ltr"
                                      >
                                        {githubCode.repository.owner}/{githubCode.repository.name}
                                      </a>
                                      <span className="text-[10px] text-black/40 shrink-0" dir="ltr">
                                        {githubCode.branch || "main"}
                                      </span>
                                    </div>
                                    {githubCode.head ? (
                                      <div className="flex items-center gap-2 text-[10px] text-black/45 min-w-0">
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <span className="truncate">{githubCode.head.message || (L ? "آخر نسخة محفوظة" : "Latest saved version")}</span>
                                        <code className="text-[9px] text-black/35 shrink-0" dir="ltr">{githubCode.head.shortSha}</code>
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-amber-700">{L ? "المستودع لا يحتوي على Commit بعد" : "The repository has no commit yet"}</p>
                                    )}
                                  </div>

                                   <Button
                                     type="button"
                                     className="w-full h-10 mb-2 text-xs gap-2 bg-slate-900 text-white hover:bg-slate-800"
                                     onClick={() => openCodeWorkspaceMutation.mutate()}
                                     disabled={openCodeWorkspaceMutation.isPending}
                                     data-testid="button-open-project-code-workspace"
                                   >
                                     {openCodeWorkspaceMutation.isPending
                                       ? <Loader2 className="w-4 h-4 animate-spin" />
                                       : <FolderOpen className="w-4 h-4" />}
                                     {L ? "فتح بيئة التطوير: محرر + Shell + Preview" : "Open development workspace: Editor + Shell + Preview"}
                                   </Button>
                                   <div className="grid grid-cols-3 gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="h-9 text-[10px] gap-1 border-black/10"
                                      onClick={() => syncProjectCodeMutation.mutate()}
                                      disabled={isFetchingGithubCode || syncProjectCodeMutation.isPending}
                                      data-testid="button-refresh-project-code"
                                    >
                                      {isFetchingGithubCode || syncProjectCodeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                      {L ? "مزامنة" : "Sync"}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="h-9 text-[10px] gap-1 border-black/10"
                                      onClick={() => window.open(`/api/admin/orders/${selectedOrder.id}/github/code/download?branch=${encodeURIComponent(githubCode.branch || "main")}`, "_blank")}
                                      data-testid="button-download-project-code"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      {L ? "تنزيل ZIP" : "Download ZIP"}
                                    </Button>
                                    <Button
                                      type="button"
                                      className="h-9 text-[10px] gap-1 bg-black text-white hover:bg-black/80"
                                      onClick={() => projectCodeUploadRef.current?.click()}
                                      disabled={uploadProjectCodeMutation.isPending}
                                      data-testid="button-upload-project-code"
                                    >
                                      {uploadProjectCodeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                      {L ? "رفع ZIP" : "Upload ZIP"}
                                    </Button>
                                    <input
                                      ref={projectCodeUploadRef}
                                      type="file"
                                      accept=".zip,application/zip"
                                      className="hidden"
                                      onChange={(event) => {
                                        const file = event.target.files?.[0];
                                        if (!file) return;
                                        if (!file.name.toLowerCase().endsWith(".zip")) {
                                          toast({ title: L ? "ارفع ملف ZIP فقط" : "Upload a ZIP file only", variant: "destructive" });
                                          event.currentTarget.value = "";
                                          return;
                                        }
                                        uploadProjectCodeMutation.mutate(file);
                                      }}
                                      data-testid="input-upload-project-code"
                                    />
                                  </div>

                                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                                    <div className="flex items-start gap-2">
                                      <Shield className="w-3.5 h-3.5 text-emerald-700 mt-0.5 shrink-0" />
                                      <p className="text-[10px] leading-5 text-emerald-800">
                                        {L
                                          ? "قبل كل رفع، يحفظ النظام النسخة الحالية في فرع احتياطي مستقل. لا يتم مسح main مباشرة، ولا تُقبل ملفات الأسرار والشهادات."
                                          : "Before every upload, the current version is saved to an independent backup branch. main is never emptied directly, and secret/certificate files are rejected."}
                                      </p>
                                    </div>
                                  </div>

                                  <div>
                                    <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-2">
                                      {L ? "نسخ الحماية" : "Safety Backups"} ({(githubCode.backupBranches || []).length})
                                    </p>
                                    {(githubCode.backupBranches || []).length > 0 ? (
                                      <div className="space-y-1.5">
                                        {(githubCode.backupBranches || []).slice(0, 4).map((backup: any) => (
                                          <a
                                            key={backup.name}
                                            href={`${githubCode.repository.url}/tree/${encodeURIComponent(backup.name)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-between gap-2 rounded-lg border border-black/[0.05] px-3 py-2 text-[10px] text-black/55 hover:bg-black/[0.02]"
                                            dir="ltr"
                                          >
                                            <span className="truncate">{backup.name}</span>
                                            <ExternalLink className="w-3 h-3 shrink-0 text-black/30" />
                                          </a>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-black/30">{L ? "سيظهر أول فرع حماية بعد أول رفع ZIP" : "The first backup branch appears after the first ZIP upload"}</p>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-[10px] leading-5 text-amber-800">
                                  {L
                                    ? "لا يوجد مستودع GitHub مرتبط بهذا المشروع. اربطه أولاً من إعدادات المشروع، ولن يتم إنشاء رابط جديد تلقائياً."
                                    : "No GitHub repository is linked to this project. Connect one from project settings first; no new URL will be created automatically."}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Upload new file */}
                          <div>
                            <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <FileUp className="w-3.5 h-3.5" />
                              {L ? "إضافة ملف جديد" : "Add New File"}
                            </p>
                            <div className="bg-black/[0.02] border border-black/[0.06] rounded-2xl p-4 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-semibold text-black/40">{L ? "عنوان الملف" : "File Title"}</label>
                                  <Input
                                    value={newProjectFile.title}
                                    onChange={e => setNewProjectFile(p => ({ ...p, title: e.target.value }))}
                                    placeholder={L ? "مثال: بطاقة الهوية" : "e.g. National ID"}
                                    className="h-8 text-xs border-black/[0.10]"
                                    data-testid="input-project-file-title"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-semibold text-black/40">{L ? "نوع الملف" : "File Type"}</label>
                                  <select
                                    value={newProjectFile.fileType}
                                    onChange={e => setNewProjectFile(p => ({ ...p, fileType: e.target.value }))}
                                    className="w-full h-8 px-2 text-xs rounded-md border border-black/[0.10] bg-background text-foreground focus:outline-none"
                                    data-testid="select-project-file-type"
                                  >
                                    <option value="identity">{L ? "هوية" : "Identity"}</option>
                                    <option value="logo">{L ? "شعار" : "Logo"}</option>
                                    <option value="commercial_reg">{L ? "سجل تجاري" : "Commercial Reg."}</option>
                                    <option value="tax_reg">{L ? "شهادة ضريبية" : "Tax Certificate"}</option>
                                    <option value="iban">{L ? "IBAN" : "IBAN"}</option>
                                    <option value="contract">{L ? "عقد" : "Contract"}</option>
                                    <option value="payment_proof">{L ? "إيصال دفع" : "Payment Proof"}</option>
                                    <option value="custom">{L ? "أخرى" : "Other"}</option>
                                  </select>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-black/40">{L ? "رفع الملف" : "Upload File"}</label>
                                <div className="flex gap-2">
                                  <Input
                                    value={newProjectFile.url}
                                    onChange={e => setNewProjectFile(p => ({ ...p, url: e.target.value }))}
                                    placeholder={L ? "رابط الملف أو اضغط لرفع ملف..." : "File URL or upload below..."}
                                    className="h-8 text-xs border-black/[0.10] flex-1"
                                    dir="ltr"
                                    data-testid="input-project-file-url"
                                  />
                                  <label
                                    className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium rounded-md border border-black/[0.10] bg-black/[0.02] hover:bg-black/[0.04] cursor-pointer transition-colors text-black/60"
                                    data-testid="label-project-file-upload"
                                  >
                                    {projectFileUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                    {L ? "رفع" : "Upload"}
                                    <input
                                      type="file"
                                      className="hidden"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        setProjectFileUploading(true);
                                        try {
                                          const fd = new FormData();
                                          fd.append("file", file);
                                          const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
                                          const data = await res.json();
                                          if (data.url) setNewProjectFile(p => ({ ...p, url: data.url }));
                                        } catch {
                                          toast({ title: L ? "فشل رفع الملف" : "Upload failed", variant: "destructive" });
                                        } finally {
                                          setProjectFileUploading(false);
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                className="w-full h-8 text-xs bg-black text-white hover:bg-black/80 gap-2"
                                disabled={!newProjectFile.title || !newProjectFile.url || addProjectFileMutation.isPending}
                                onClick={() => {
                                  if (!orderProject?.id) return;
                                  addProjectFileMutation.mutate({ projectId: orderProject.id, file: newProjectFile });
                                }}
                                data-testid="button-add-project-file"
                              >
                                {addProjectFileMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                                {L ? "إضافة الملف" : "Add File"}
                              </Button>
                            </div>
                          </div>

                          {/* Files list */}
                          <div>
                            <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Paperclip className="w-3.5 h-3.5" />
                              {L ? "الملفات المرفوعة" : "Uploaded Files"} ({(orderProject?.projectFiles || []).length})
                            </p>
                            {(orderProject?.projectFiles || []).length === 0 ? (
                              <div className="py-10 text-center bg-black/[0.01] border border-black/[0.04] rounded-2xl">
                                <Paperclip className="w-8 h-8 text-black/10 mx-auto mb-2" />
                                <p className="text-xs text-black/25">{L ? "لا توجد ملفات مرفوعة بعد" : "No files uploaded yet"}</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {(orderProject.projectFiles || []).map((f: any) => {
                                  const typeLabels: Record<string, string> = {
                                    identity: L ? "هوية" : "Identity",
                                    logo: L ? "شعار" : "Logo",
                                    commercial_reg: L ? "سجل تجاري" : "Commercial Reg.",
                                    tax_reg: L ? "شهادة ضريبية" : "Tax Cert.",
                                    iban: "IBAN",
                                    contract: L ? "عقد" : "Contract",
                                    payment_proof: L ? "إيصال دفع" : "Payment Proof",
                                    custom: L ? "أخرى" : "Other",
                                  };
                                  const fileId = f._id || f.id || "";
                                  return (
                                    <div key={fileId} className="group flex items-center gap-3 p-3 bg-black/[0.02] hover:bg-black/[0.03] rounded-xl border border-black/[0.04] transition-colors">
                                      <div className="w-8 h-8 rounded-lg bg-black/[0.06] flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-4 h-4 text-black/40" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-black/80 truncate">{f.title}</p>
                                        <p className="text-[10px] text-black/30">{typeLabels[f.fileType] || f.fileType}</p>
                                      </div>
                                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a
                                          href={f.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1.5 rounded-lg hover:bg-black/[0.06] text-black/40 hover:text-black transition-colors"
                                          data-testid={`link-project-file-${fileId}`}
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                        <button
                                          onClick={() => deleteProjectFileMutation.mutate({ projectId: orderProject.id, fileId })}
                                          disabled={deleteProjectFileMutation.isPending}
                                          className="p-1.5 rounded-lg hover:bg-red-50 text-black/30 hover:text-red-500 transition-colors"
                                          data-testid={`button-delete-project-file-${fileId}`}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Tab 6: Team Members */}
                <TabsContent value="team" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="px-6 py-5 space-y-6">
                      {!orderProject ? (
                        <div className="py-16 text-center">
                          <Users className="w-10 h-10 text-black/10 mx-auto mb-3" />
                          <p className="text-sm font-semibold text-black/30">{L ? "لا يوجد مشروع مرتبط بهذا الطلب" : "No project linked to this order"}</p>
                          <p className="text-xs text-black/20 mt-1">{L ? "أنشئ المشروع أولاً من تبويب إدارة الطلب" : "Create the project first from the Manage Order tab"}</p>
                        </div>
                      ) : (
                        <>
                          {/* Add member */}
                          <div>
                            <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <UserCheck className="w-3.5 h-3.5" />
                              {L ? "إضافة موظف للمشروع" : "Assign Employee to Project"}
                            </p>
                            <div className="bg-black/[0.02] border border-black/[0.06] rounded-2xl p-4 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-semibold text-black/40">{L ? "الموظف" : "Employee"}</label>
                                  <select
                                    value={newTeamMemberId}
                                    onChange={e => setNewTeamMemberId(e.target.value)}
                                    className="w-full h-8 px-2 text-xs rounded-md border border-black/[0.10] bg-background text-foreground focus:outline-none"
                                    data-testid="select-team-member-employee"
                                  >
                                    <option value="">{L ? "اختر موظفاً..." : "Select employee..."}</option>
                                    {(employees || [])
                                      .filter(emp => !(projectMembers || []).some((m: any) => String(m.userId?._id || m.userId) === String(emp.id || emp._id)))
                                      .map((emp: any) => (
                                        <option key={emp.id || emp._id} value={emp.id || emp._id}>
                                          {emp.fullName} — {emp.role}
                                        </option>
                                      ))}
                                  </select>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-semibold text-black/40">{L ? "الدور في المشروع" : "Project Role"}</label>
                                  <select
                                    value={newTeamMemberRole}
                                    onChange={e => setNewTeamMemberRole(e.target.value)}
                                    className="w-full h-8 px-2 text-xs rounded-md border border-black/[0.10] bg-background text-foreground focus:outline-none"
                                    data-testid="select-team-member-role"
                                  >
                                    <option value="">{L ? "اختر الدور..." : "Select role..."}</option>
                                    <option value="developer">{L ? "مطور" : "Developer"}</option>
                                    <option value="designer">{L ? "مصمم" : "Designer"}</option>
                                    <option value="tester">{L ? "مختبر" : "Tester"}</option>
                                    <option value="project_manager">{L ? "مدير مشروع" : "Project Manager"}</option>
                                    <option value="content">{L ? "محتوى" : "Content"}</option>
                                    <option value="support">{L ? "دعم" : "Support"}</option>
                                    <option value="other">{L ? "أخرى" : "Other"}</option>
                                  </select>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (!newTeamMemberId || !newTeamMemberRole) {
                                    toast({ title: L ? "يرجى اختيار الموظف والدور" : "Please select employee and role", variant: "destructive" });
                                    return;
                                  }
                                  addTeamMemberMutation.mutate({ projectId: orderProject.id, userId: newTeamMemberId, role: newTeamMemberRole });
                                }}
                                disabled={addTeamMemberMutation.isPending}
                                className="w-full h-8 text-xs rounded-lg bg-black text-white hover:bg-black/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                data-testid="button-add-team-member"
                              >
                                {addTeamMemberMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />}
                                {L ? "إضافة للفريق" : "Add to Team"}
                              </button>
                            </div>
                          </div>

                          {/* Current team */}
                          <div>
                            <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Users className="w-3.5 h-3.5" />
                              {L ? "أعضاء الفريق الحاليون" : "Current Team Members"}
                              <span className="ml-auto bg-black/[0.06] text-black/50 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {(projectMembers || []).length}
                              </span>
                            </p>
                            {(projectMembers || []).length === 0 ? (
                              <div className="py-8 text-center bg-black/[0.01] border border-black/[0.04] rounded-2xl">
                                <Users className="w-8 h-8 text-black/10 mx-auto mb-2" />
                                <p className="text-xs text-black/25">{L ? "لم يُعيَّن موظفون لهذا المشروع بعد" : "No employees assigned yet"}</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {(projectMembers || []).map((member: any) => {
                                  const memberId = member._id || member.id;
                                  const user = member.userId;
                                  const name = user?.fullName || user?.username || L ? "موظف" : "Employee";
                                  const roleLabels: Record<string, string> = {
                                    developer: L ? "مطور" : "Developer",
                                    designer: L ? "مصمم" : "Designer",
                                    tester: L ? "مختبر" : "Tester",
                                    project_manager: L ? "مدير مشروع" : "Project Manager",
                                    content: L ? "محتوى" : "Content",
                                    support: L ? "دعم" : "Support",
                                    other: L ? "أخرى" : "Other",
                                  };
                                  return (
                                    <div key={memberId} className="flex items-center gap-3 bg-white border border-black/[0.06] rounded-xl px-4 py-3 group" data-testid={`row-team-member-${memberId}`}>
                                      <div className="w-7 h-7 rounded-full bg-black/[0.06] flex items-center justify-center flex-shrink-0">
                                        <span className="text-[10px] font-bold text-black/40">{(user?.fullName || "?")[0]?.toUpperCase()}</span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-black/80 truncate">{name}</p>
                                        <p className="text-[10px] text-black/40">{user?.email || ""}</p>
                                      </div>
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/[0.04] text-black/50 font-medium flex-shrink-0">
                                        {roleLabels[member.role] || member.role}
                                      </span>
                                      <button
                                        onClick={() => removeTeamMemberMutation.mutate({ projectId: orderProject.id, memberId })}
                                        disabled={removeTeamMemberMutation.isPending}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600"
                                        data-testid={`button-remove-team-member-${memberId}`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Phone correction request dialog ── */}
      <Dialog open={phoneReqOpen} onOpenChange={open => { setPhoneReqOpen(open); if (!open) setPhoneReqNotes(""); }}>
        <DialogContent dir={dir} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneOff className="w-4 h-4 text-black dark:text-white" />
              {L ? "رفع طلب تصحيح الرقم" : "Submit Phone Correction Request"}
            </DialogTitle>
            <DialogDescription>
              {L ? "العميل:" : "Client:"} <span className="font-semibold text-foreground">{selectedOrder?.client?.fullName || selectedOrder?.client?.username}</span>
              {selectedOrder?.client?.phone && (
                <span className="mr-2 text-foreground/50 font-mono text-xs">{selectedOrder.client.phone}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground/60 mb-1.5 block">{L ? "سبب الطلب أو الملاحظات" : "Request Reason or Notes"}</label>
              <Textarea
                value={phoneReqNotes}
                onChange={e => setPhoneReqNotes(e.target.value)}
                placeholder={L ? "مثال: العميل أفاد أن الرقم لا يعمل، أو تم تغيير الرقم..." : "E.g. Client said the number doesn't work, or number was changed..."}
                className="resize-none text-sm"
                rows={3}
                data-testid="textarea-phone-request-notes-order"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPhoneReqOpen(false)}>{L ? "إلغاء" : "Cancel"}</Button>
              <Button
                className="bg-black dark:bg-white hover:bg-black dark:bg-white text-white gap-2"
                onClick={() => selectedOrder?.userId && phoneReqMutation.mutate({ clientId: selectedOrder.userId, notes: phoneReqNotes })}
                disabled={phoneReqMutation.isPending || !selectedOrder?.userId}
                data-testid="button-submit-phone-request-order"
              >
                {phoneReqMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {L ? "رفع الطلب" : "Submit Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={editProjectOpen} onOpenChange={setEditProjectOpen}>
        <DialogContent dir={dir} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Save className="w-4 h-4 text-black dark:text-white" />
              {L ? "تعديل بيانات المشروع" : "Edit Project Details"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {L ? "عدّل بيانات المشروع الأساسية، سيتم إرسال إشعار للعميل عند تغيير الحالة" : "Edit core project data. Client will be notified if status changes."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs text-black/50 mb-1 block">{L ? "اسم النشاط / المشروع" : "Business / Project Name"}</Label>
              <Input
                value={editProjectForm.businessName}
                onChange={e => setEditProjectForm(p => ({ ...p, businessName: e.target.value }))}
                placeholder={L ? "اسم المشروع..." : "Project name..."}
                className="h-9 text-sm border-black/[0.12]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-black/50 mb-1 block">{L ? "نوع المشروع" : "Project Type"}</Label>
                <Input
                  value={editProjectForm.projectType}
                  onChange={e => setEditProjectForm(p => ({ ...p, projectType: e.target.value }))}
                  placeholder={L ? "موقع، تطبيق..." : "Website, App..."}
                  className="h-9 text-sm border-black/[0.12]"
                />
              </div>
              <div>
                <Label className="text-xs text-black/50 mb-1 block">{L ? "القطاع" : "Sector"}</Label>
                <Input
                  value={editProjectForm.sector}
                  onChange={e => setEditProjectForm(p => ({ ...p, sector: e.target.value }))}
                  placeholder={L ? "مطعم، تقنية..." : "Restaurant, Tech..."}
                  className="h-9 text-sm border-black/[0.12]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-black/50 mb-1 block">{L ? "الحالة" : "Status"}</Label>
                <Select value={editProjectForm.status} onValueChange={v => setEditProjectForm(p => ({ ...p, status: v }))} disabled={isDataEntry}>
                  <SelectTrigger className="h-9 text-sm border-black/[0.12]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusMap).map(([val, { label }]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-black/50 mb-1 block flex items-center gap-1">{L ? "القيمة" : "Value"} (<SARIcon size={9} className="opacity-60" />)</Label>
                <Input
                  type="number"
                  value={editProjectForm.totalAmount}
                  onChange={e => setEditProjectForm(p => ({ ...p, totalAmount: e.target.value }))}
                  disabled={!canSeeFinance}
                  placeholder="0"
                  className="h-9 text-sm border-black/[0.12]"
                  dir="ltr"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-black/50 mb-1 block">{L ? "ملاحظات الإدارة" : "Admin Notes"}</Label>
              <Textarea
                value={editProjectForm.adminNotes}
                onChange={e => setEditProjectForm(p => ({ ...p, adminNotes: e.target.value }))}
                placeholder={L ? "ملاحظات داخلية للفريق..." : "Internal notes for team..."}
                className="resize-none h-20 text-sm border-black/[0.12]"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditProjectOpen(false)}
              >
                {L ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                className="flex-1 bg-black dark:bg-white hover:bg-black dark:bg-white text-white gap-2"
                disabled={editProjectMutation.isPending}
                onClick={() => {
                  if (!selectedOrder) return;
                  const updates: Record<string, any> = {
                    businessName: editProjectForm.businessName,
                    projectType: editProjectForm.projectType,
                    sector: editProjectForm.sector,
                    adminNotes: editProjectForm.adminNotes,
                  };
                  if (!isDataEntry) updates.status = editProjectForm.status;
                  if (canSeeFinance && editProjectForm.totalAmount) updates.totalAmount = Number(editProjectForm.totalAmount);
                  editProjectMutation.mutate({ id: selectedOrder.id, updates });
                }}
              >
                {editProjectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {L ? "حفظ التعديلات" : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Bank Transfer Dialog */}
      <Dialog open={rejectTransferOpen} onOpenChange={open => { setRejectTransferOpen(open); if (!open) setRejectTransferReason(""); }}>
        <DialogContent dir={dir} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-black dark:text-white" />
              {L ? "رفض إيصال التحويل" : "Reject Transfer Receipt"}
            </DialogTitle>
            <DialogDescription>
              {L ? "سيتم إرسال إشعار للعميل بسبب الرفض وطلب إعادة رفع إيصال صحيح" : "The client will be notified of the rejection and asked to upload a correct receipt"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground/60 mb-1.5 block">{L ? "سبب الرفض" : "Rejection Reason"}</label>
              <Textarea
                value={rejectTransferReason}
                onChange={e => setRejectTransferReason(e.target.value)}
                placeholder={L ? "مثال: الإيصال غير واضح، المبلغ غير متطابق، تاريخ منتهي..." : "E.g. Receipt unclear, amount doesn't match, expired date..."}
                className="resize-none text-sm"
                rows={3}
                data-testid="textarea-reject-transfer-reason"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectTransferOpen(false)}>{L ? "إلغاء" : "Cancel"}</Button>
              <Button
                className="bg-black dark:bg-white hover:bg-black dark:bg-white text-white gap-2"
                data-testid="button-confirm-reject-transfer"
                onClick={async () => {
                  if (!selectedOrder) return;
                  try {
                    await apiRequest("POST", `/api/admin/orders/${selectedOrder.id}/reject-transfer`, { reason: rejectTransferReason || (L ? "إيصال التحويل غير صحيح" : "Transfer receipt is incorrect") });
                    queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
                    setSelectedOrder({ ...selectedOrder, paymentStatus: "rejected", paymentRejectionReason: rejectTransferReason || (L ? "إيصال التحويل غير صحيح" : "Transfer receipt is incorrect") });
                    setRejectTransferOpen(false);
                    setRejectTransferReason("");
                    toast({ title: L ? "تم رفض التحويل وإرسال إشعار للعميل" : "Transfer rejected and client notified" });
                  } catch { toast({ title: L ? "فشل الرفض" : "Rejection failed", variant: "destructive" }); }
                }}
              >
                <XCircle className="w-4 h-4" />
                {L ? "تأكيد الرفض وإرسال إشعار" : "Confirm Rejection & Notify Client"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
