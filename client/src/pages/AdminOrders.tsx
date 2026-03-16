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
import { Loader2, FileText, CheckCircle, XCircle, Eye, UserCheck, FolderPlus, Briefcase, Layers, Server, Globe, Save, Link2, ExternalLink, Phone, Mail, Shield, Download, Upload, CreditCard, TrendingUp, TrendingDown, PlusCircle, Trash2, DollarSign, BarChart3, PhoneOff, Send, Package } from "lucide-react";
import { SiWhatsapp, SiTelegram } from "react-icons/si";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";

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
  shippingCompanyId?: string;
  shippingCompanyName?: string;
  shippingFee?: number;
  projectType?: string;
  sector?: string;
  createdAt?: string;
  assignedTo?: string;
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
  client?: {
    fullName?: string;
    username?: string;
    email?: string;
    phone?: string;
  };
}

function getStatusMap(L: boolean): Record<string, { label: string; color: string }> { return {
  pending: { label: L ? "قيد المراجعة" : "Under Review", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  approved: { label: L ? "تمت الموافقة" : "Approved", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  in_progress: { label: L ? "قيد التنفيذ" : "In Progress", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  completed: { label: L ? "مكتمل" : "Completed", color: "bg-black/[0.06] text-black/60 border-black/[0.08]" },
  cancelled: { label: L ? "ملغي" : "Cancelled", color: "bg-red-500/10 text-red-600 border-red-500/20" },
  rejected: { label: L ? "مرفوض" : "Rejected", color: "bg-red-500/10 text-red-600 border-red-500/20" },
}; }

function getPaymentMethods(L: boolean): Record<string, string> { return {
  bank_transfer: L ? "تحويل بنكي" : "Bank Transfer",
  paypal: "PayPal",
  cash: L ? "نقدي" : "Cash",
}; }

function getRoleLabels(L: boolean): Record<string, string> { return {
  admin: L ? "مدير النظام" : "System Admin", manager: L ? "مدير" : "Manager", developer: L ? "مطور" : "Developer",
  designer: L ? "مصمم" : "Designer", support: L ? "دعم" : "Support", sales: L ? "مبيعات" : "Sales",
  sales_manager: L ? "مدير مبيعات" : "Sales Manager", accountant: L ? "محاسب" : "Accountant",
}; }

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
  const statusMap = getStatusMap(L);
  const paymentMethods = getPaymentMethods(L);
  const roleLabels = getRoleLabels(L);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [editStatus, setEditStatus] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editAdminNotes, setEditAdminNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [specsForm, setSpecsForm] = useState({ ...EMPTY_SPECS });
  const [newExpense, setNewExpense] = useState({ category: "other", description: "", amount: "" });
  const [guideForm, setGuideForm] = useState({ title: "شرح استخدام النظام", description: "", files: "" });
  const [deliveryForm, setDeliveryForm] = useState({ videoUrl: "", files: "" });
  const [phoneReqOpen, setPhoneReqOpen] = useState(false);
  const [phoneReqNotes, setPhoneReqNotes] = useState("");
  const [rejectTransferOpen, setRejectTransferOpen] = useState(false);
  const [rejectTransferReason, setRejectTransferReason] = useState("");

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

  useEffect(() => {
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
  }, [orderProject]);

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

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const res = await apiRequest("PATCH", `/api/admin/orders/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: L ? "تم تحديث الطلب بنجاح" : "Order updated successfully" });
    },
    onError: () => toast({ title: L ? "خطأ في تحديث الطلب" : "Error updating order", variant: "destructive" }),
  });

  const saveSpecsMutation = useMutation({
    mutationFn: async (data: { orderId: string; specs: any }) => {
      const res = await apiRequest("PUT", `/api/admin/orders/${data.orderId}/specs`, data.specs);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'specs'] });
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
  });

  const convertToProjectMutation = useMutation({
    mutationFn: async (order: OrderData) => {
      const res = await apiRequest("POST", "/api/admin/projects", {
        orderId: order.id,
        clientId: order.userId,
        status: "new",
        progress: 0,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: L ? "تم إنشاء المشروع بنجاح" : "Project created successfully" });
      setSelectedOrder(null);
    },
    onError: () => toast({ title: L ? "فشل إنشاء المشروع" : "Failed to create project", variant: "destructive" }),
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
    if (editAssignedTo && editAssignedTo !== "none") updates.assignedTo = editAssignedTo;
    else if (editAssignedTo === "none") updates.assignedTo = null;
    if (editAdminNotes !== undefined) updates.adminNotes = editAdminNotes;
    updateMutation.mutate({ id: selectedOrder.id, updates });
  };

  const handleSaveSpecs = () => {
    if (!selectedOrder) return;
    saveSpecsMutation.mutate({ orderId: selectedOrder.id, specs: specsForm });
  };

  const openOrder = (order: OrderData) => {
    setSelectedOrder(order);
    setActiveTab("details");
    setEditStatus(order.status);
    setEditAmount(order.totalAmount?.toString() || "");
    setEditAssignedTo(order.assignedTo || "none");
    setEditAdminNotes(order.adminNotes || "");
    setSpecsForm({ ...EMPTY_SPECS });
  };

  const getAssigneeName = (assignedTo?: string) => {
    if (!assignedTo || !employees) return null;
    const emp = employees.find(e => e.id === assignedTo);
    return emp ? emp.fullName : null;
  };

  const filteredOrders = orders?.filter(o => filterStatus === "all" || o.status === filterStatus) || [];

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
            {L ? "إدارة الطلبات" : "Orders Management"}
          </h1>
          <p className="text-xs text-black/35 mt-0.5">{L ? "عرض وإدارة وملء بيانات جميع الطلبات" : "View, manage, and fill in all order data"}</p>
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
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { key: "pending", label: L ? "قيد المراجعة" : "Under Review", color: "text-yellow-600 bg-yellow-50" },
          { key: "approved", label: L ? "موافق عليه" : "Approved", color: "text-green-600 bg-green-50" },
          { key: "in_progress", label: L ? "قيد التنفيذ" : "In Progress", color: "text-blue-600 bg-blue-50" },
          { key: "completed", label: L ? "مكتمل" : "Completed", color: "text-black/60 bg-black/[0.04]" },
          { key: "cancelled", label: L ? "ملغي" : "Cancelled", color: "text-red-600 bg-red-50" },
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
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">{L ? "رقم الطلب" : "Order #"}</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">{L ? "النشاط" : "Activity"}</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">{L ? "الحالة" : "Status"}</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">{L ? "المسؤول" : "Assignee"}</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">{L ? "المبلغ" : "Amount"}</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">{L ? "التاريخ" : "Date"}</th>
                <th className="text-left p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">{L ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const assigneeName = getAssigneeName(order.assignedTo);
                return (
                  <tr key={order.id} className="border-b border-black/[0.03] hover:bg-black/[0.02] transition-colors" data-testid={`row-order-${order.id}`}>
                    <td className="p-4">
                      <p className="text-xs font-mono font-bold text-black/60">#{order.id?.toString().slice(-8)}</p>
                      {order.businessName && <p className="text-[10px] text-black/35 mt-0.5">{order.businessName}</p>}
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-black">{order.projectType || order.sector || "—"}</p>
                      {order.sectorFeatures && order.sectorFeatures.length > 0 && (
                        <p className="text-[10px] text-black/30 mt-0.5">{order.sectorFeatures.length} {L ? "ميزة" : "features"}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${statusMap[order.status]?.color || "bg-black/[0.03] text-black/40 border-black/[0.06]"}`}>
                        {statusMap[order.status]?.label || order.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {assigneeName ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-[9px] font-bold">{assigneeName.charAt(0)}</span>
                          </div>
                          <span className="text-xs text-black/60 font-medium">{assigneeName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-black/20 italic">{L ? "غير معين" : "Unassigned"}</span>
                      )}
                    </td>
                    <td className="p-4 text-sm font-semibold text-black/70">
                      {order.totalAmount ? <span className="flex items-center gap-1">{Number(order.totalAmount).toLocaleString()} <SARIcon size={11} className="opacity-60" /></span> : "—"}
                    </td>
                    <td className="p-4 text-xs text-black/30">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString(L ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' }) : "—"}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" className="text-black/60 w-8 h-8" onClick={() => openOrder(order)} data-testid={`button-view-${order.id}`}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {order.status === "pending" && (
                          <>
                            <Button size="sm" variant="ghost" className="text-green-600 h-8 text-xs px-2" onClick={() => handleQuickStatus(order.id, "approved")} disabled={updateMutation.isPending} data-testid={`button-approve-${order.id}`}>
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />{L ? "قبول" : "Approve"}
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-500 h-8 text-xs px-2" onClick={() => handleQuickStatus(order.id, "cancelled")} disabled={updateMutation.isPending} data-testid={`button-reject-${order.id}`}>
                              <XCircle className="w-3.5 h-3.5 mr-1" />{L ? "رفض" : "Reject"}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-black/30">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-black/10" />
                    <p className="text-sm">{L ? "لا توجد طلبات" : "No orders found"}</p>
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
              <div className="px-6 py-5 border-b border-black/[0.06] bg-white flex-shrink-0">
                <SheetTitle className="text-base font-bold text-black">
                  {L ? "طلب" : "Order"} #{selectedOrder.id?.toString().slice(-8)}
                  {selectedOrder.businessName && <span className="text-black/40 font-normal mr-2">— {selectedOrder.businessName}</span>}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusMap[selectedOrder.status]?.color || ""}`}>
                    {statusMap[selectedOrder.status]?.label || selectedOrder.status}
                  </span>
                  {selectedOrder.totalAmount && (
                    <span className="text-[10px] text-black/40 flex items-center gap-0.5">{Number(selectedOrder.totalAmount).toLocaleString()} <SARIcon size={9} className="opacity-60" /></span>
                  )}
                  {selectedOrder.client?.fullName && (
                    <span className="text-[10px] text-black/30">{selectedOrder.client.fullName}</span>
                  )}
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
                <TabsList className="w-full rounded-none border-b border-black/[0.06] bg-white h-10 justify-start px-6 gap-0 flex-shrink-0">
                  <TabsTrigger value="details" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent h-10 px-4">
                    {L ? "تفاصيل الطلب" : "Order Details"}
                  </TabsTrigger>
                  <TabsTrigger value="specs" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent h-10 px-4">
                    {L ? "المواصفات التقنية" : "Technical Specs"}
                  </TabsTrigger>
                  <TabsTrigger value="manage" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent h-10 px-4">
                    {L ? "إدارة الطلب" : "Manage Order"}
                  </TabsTrigger>
                  <TabsTrigger value="profit" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:text-green-700 data-[state=active]:bg-transparent h-10 px-4 gap-1">
                    <DollarSign className="w-3 h-3" />{L ? "التكاليف والأرباح" : "Costs & Profits"}
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
                              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                                <CheckCircle className="w-6 h-6" />
                              </div>
                              <p className="text-xs font-bold text-green-700">{L ? "تم رفع الإيصال بنجاح" : "Receipt uploaded successfully"}</p>
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
                                  className="text-xs gap-1.5 border-green-200 text-green-700 hover:bg-green-50"
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
                                  className="text-xs gap-1.5 border-red-200 text-red-700 hover:bg-red-50"
                                  data-testid="button-reject-transfer"
                                  onClick={() => setRejectTransferOpen(true)}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  {L ? "رفض التحويل" : "Reject Transfer"}
                                </Button>
                              </div>
                            )}
                            {selectedOrder.paymentStatus === "approved" && (
                              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <p className="text-xs font-semibold text-green-700">{L ? "تم قبول التحويل" : "Transfer approved"}</p>
                              </div>
                            )}
                            {selectedOrder.paymentStatus === "rejected" && (
                              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
                                <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-red-700">{L ? "تم رفض التحويل" : "Transfer rejected"}</p>
                                  {selectedOrder.paymentRejectionReason && (
                                    <p className="text-[10px] text-red-600 mt-0.5">{selectedOrder.paymentRejectionReason}</p>
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
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                                    data-testid="link-whatsapp-order-client"
                                  >
                                    <SiWhatsapp className="w-3 h-3" />
                                    واتساب
                                  </a>
                                  <a
                                    href={`https://t.me/${selectedOrder.client.phone.replace(/\D/g, "")}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                    data-testid="link-telegram-order-client"
                                  >
                                    <SiTelegram className="w-3 h-3" />
                                    تيليغرام
                                  </a>
                                  <button
                                    onClick={() => setPhoneReqOpen(true)}
                                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md text-rose-500 hover:bg-rose-50 transition-colors"
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

                      {/* Payment */}
                      <div>
                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-3">{L ? "بيانات الدفع" : "Payment Details"}</p>
                        <div className="bg-black/[0.02] rounded-xl p-4 border border-black/[0.04] space-y-2">
                          <div className="flex justify-between"><p className="text-xs text-black/50">{L ? "طريقة الدفع" : "Payment Method"}</p><p className="text-xs font-bold text-black">{paymentMethods[selectedOrder.paymentMethod || ""] || "—"}</p></div>
                          <div className="flex justify-between"><p className="text-xs text-black/50">{L ? "الإجمالي" : "Total"}</p><p className="text-xs font-bold text-black flex items-center gap-1">{selectedOrder.totalAmount ? <>{Number(selectedOrder.totalAmount).toLocaleString()} <SARIcon size={10} className="opacity-70" /></> : "—"}</p></div>
                          {selectedOrder.shippingCompanyName && (
                            <div className="flex justify-between"><p className="text-xs text-black/50">{L ? "شركة الشحن" : "Shipping Company"}</p><p className="text-xs font-bold text-black">{selectedOrder.shippingCompanyName}</p></div>
                          )}
                          {!!selectedOrder.shippingFee && (
                            <div className="flex justify-between"><p className="text-xs text-black/50">{L ? "رسوم الشحن" : "Shipping Fee"}</p><p className="text-xs font-bold text-black flex items-center gap-1">{Number(selectedOrder.shippingFee).toLocaleString()} <SARIcon size={10} className="opacity-70" /></p></div>
                          )}
                          <div className="flex justify-between"><p className="text-xs text-black/50">{L ? "الدفعة الأولى" : "First Payment"}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${selectedOrder.isDepositPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
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

                      {/* Client Documents */}
                      {(() => {
                        const files = (selectedOrder as any).files || {};
                        const fileCategories = [
                          { key: "logo",          label: L ? "الشعار" : "Logo",           color: "bg-violet-500" },
                          { key: "brandIdentity", label: L ? "الهوية البصرية" : "Brand Identity",   color: "bg-blue-500" },
                          { key: "content",       label: L ? "المحتوى والصور" : "Content & Images",   color: "bg-emerald-500" },
                          { key: "paymentProof",  label: L ? "إثبات الدفع" : "Payment Proof",      color: "bg-amber-500" },
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
                            <div>
                              <label className="text-[10px] font-bold text-white/50 mb-1 flex items-center gap-1">{L ? "الميزانية الكلية" : "Total Budget"} (<SARIcon size={8} className="opacity-60" />)</label>
                              <Input type="number" value={specsForm.totalBudget}
                                onChange={e => setSpecsForm(f => ({ ...f, totalBudget: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white" data-testid="input-specs-budget" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-white/50 mb-1 flex items-center gap-1">{L ? "المدفوع حالياً" : "Amount Paid"} (<SARIcon size={8} className="opacity-60" />)</label>
                              <Input type="number" value={specsForm.paidAmount}
                                onChange={e => setSpecsForm(f => ({ ...f, paidAmount: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white" data-testid="input-specs-paid" />
                            </div>
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
                          </div>
                        </div>

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
                        <div className="border border-blue-200 rounded-2xl p-5 bg-blue-50">
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" />{L ? "شرح استخدام النظام" : "System Usage Guide"}
                          </p>
                          {!orderProject && (
                            <p className="text-xs text-blue-600/60 mb-3">⚠️ {L ? "لا يوجد مشروع مرتبط بهذا الطلب بعد. أنشئ المشروع أولاً لتتمكن من إضافة شرح الاستخدام." : "No project linked to this order yet. Create the project first to add the usage guide."}</p>
                          )}
                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] font-bold text-blue-700 mb-1 block">{L ? "عنوان الدليل" : "Guide Title"}</label>
                              <Input value={guideForm.title} onChange={e => setGuideForm(f => ({ ...f, title: e.target.value }))}
                                placeholder={L ? "شرح استخدام النظام" : "System Usage Guide"} className="text-sm bg-white" data-testid="input-guide-title" disabled={!orderProject} />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-blue-700 mb-1 block">{L ? "محتوى الشرح (يظهر للعميل في لوحة التحكم)" : "Guide Content (shown to client in dashboard)"}</label>
                              <Textarea value={guideForm.description} onChange={e => setGuideForm(f => ({ ...f, description: e.target.value }))}
                                placeholder={L ? "اكتب شرحاً مفصّلاً لكيفية استخدام النظام، خطوة بخطوة..." : "Write a detailed guide on how to use the system, step by step..."} className="text-sm h-28 resize-none bg-white" data-testid="textarea-guide-desc" disabled={!orderProject} />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-blue-700 mb-1 block">{L ? "روابط ملفات مرفقة (رابط في كل سطر)" : "Attached file links (one link per line)"}</label>
                              <Textarea value={guideForm.files} onChange={e => setGuideForm(f => ({ ...f, files: e.target.value }))}
                                placeholder="https://docs.example.com/guide.pdf&#10;https://example.com/video.mp4" className="text-sm h-16 resize-none font-mono bg-white text-xs" data-testid="textarea-guide-files" disabled={!orderProject} dir="ltr" />
                            </div>
                            <Button onClick={handleSaveGuide} disabled={saveGuideMutation.isPending || !orderProject}
                              className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-xl text-xs font-bold"
                              data-testid="button-save-guide">
                              {saveGuideMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                              {L ? "حفظ شرح الاستخدام" : "Save Usage Guide"}
                            </Button>
                          </div>
                        </div>

                        {/* ─── Delivery Data Section ─── */}
                        <div className="border border-green-200 rounded-2xl p-5 bg-green-50">
                          <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Package className="w-3.5 h-3.5" />{L ? "تسليم المشروع — فيديو وملفات" : "Project Delivery — Video & Files"}
                          </p>
                          {!orderProject && (
                            <p className="text-xs text-green-600/60 mb-3">⚠️ {L ? "لا يوجد مشروع مرتبط. أنشئ المشروع أولاً." : "No project linked. Create the project first."}</p>
                          )}
                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] font-bold text-green-700 mb-1 block">{L ? "رابط فيديو التسليم / الشرح (YouTube أو أي رابط)" : "Delivery video / guide link (YouTube or any URL)"}</label>
                              <Input value={deliveryForm.videoUrl} onChange={e => setDeliveryForm(f => ({ ...f, videoUrl: e.target.value }))}
                                placeholder="https://youtube.com/watch?v=..." className="text-sm bg-white font-mono" dir="ltr" disabled={!orderProject} data-testid="input-delivery-video" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-green-700 mb-1 block">{L ? "ملفات التسليم (سطر لكل ملف: اسم|رابط|إيموجي)" : "Delivery files (one per line: name|url|emoji)"}</label>
                              <Textarea value={deliveryForm.files} onChange={e => setDeliveryForm(f => ({ ...f, files: e.target.value }))}
                                placeholder={"دليل الاستخدام|https://drive.google.com/...|📄\nشرح الكود المصدري|https://github.com/...|💻"}
                                className="text-sm h-24 resize-none font-mono bg-white text-xs" data-testid="textarea-delivery-files" disabled={!orderProject} dir="ltr" />
                              <p className="text-[10px] text-green-600/60 mt-1">{L ? "صيغة كل سطر: اسم الملف | رابط التحميل | إيموجي (اختياري)" : "Each line format: filename | download URL | emoji (optional)"}</p>
                            </div>
                            <Button onClick={handleSaveDelivery} disabled={saveDeliveryMutation.isPending || !orderProject}
                              className="w-full h-9 bg-green-600 hover:bg-green-700 text-white gap-2 rounded-xl text-xs font-bold"
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
                        <div>
                          <label className="flex items-center gap-1 text-xs font-medium text-black/50 mb-1.5">{L ? "المبلغ" : "Amount"} (<SARIcon size={9} className="opacity-60" />)</label>
                          <Input type="number" value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="h-10" data-testid="input-order-amount" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-black/50 mb-1.5 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5" />{L ? "تعيين لموظف" : "Assign to Employee"}
                        </label>
                        <Select value={editAssignedTo} onValueChange={setEditAssignedTo}>
                          <SelectTrigger className="h-10" data-testid="select-assign-employee">
                            <SelectValue placeholder={L ? "اختر موظفاً..." : "Choose an employee..."} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{L ? "غير معين" : "Unassigned"}</SelectItem>
                            {employees?.map(emp => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.fullName} — {roleLabels[emp.role] || emp.role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
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

                      {["approved", "in_progress"].includes(selectedOrder.status) && (
                        <div className="pt-3 border-t border-black/[0.05]">
                          <Button
                            variant="outline"
                            className="w-full h-10 gap-2 text-sm border-black/10 hover:border-black/20 hover:bg-black/[0.02]"
                            onClick={() => convertToProjectMutation.mutate(selectedOrder)}
                            disabled={convertToProjectMutation.isPending}
                            data-testid="button-convert-to-project"
                          >
                            {convertToProjectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
                            تحويل إلى مشروع رسمي
                          </Button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                {/* Tab 4: Expenses & Profit */}
                <TabsContent value="profit" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="px-6 py-5 space-y-5">
                      {/* Profit Summary */}
                      {(() => {
                        const expenses = orderExpenses || [];
                        const revenue = selectedOrder?.totalAmount || 0;
                        const totalCosts = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
                        const netProfit = revenue - totalCosts;
                        const margin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : "0";
                        const isProfit = netProfit >= 0;
                        return (
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                              <p className="text-[10px] text-blue-500 font-bold mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />{L ? "إجمالي الإيراد" : "Total Revenue"}</p>
                              <p className="text-xl font-black text-blue-700">{revenue.toLocaleString()}</p>
                              <SARIcon size={11} className="opacity-40 mt-0.5" />
                            </div>
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                              <p className="text-[10px] text-red-500 font-bold mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3" />{L ? "إجمالي التكاليف" : "Total Costs"}</p>
                              <p className="text-xl font-black text-red-700">{totalCosts.toLocaleString()}</p>
                              <SARIcon size={11} className="opacity-40 mt-0.5" />
                            </div>
                            <div className={`border rounded-2xl p-4 ${isProfit ? "bg-green-50 border-green-100" : "bg-orange-50 border-orange-100"}`}>
                              <p className={`text-[10px] font-bold mb-1 flex items-center gap-1 ${isProfit ? "text-green-600" : "text-orange-600"}`}>
                                {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{L ? "صافي الربح" : "Net Profit"}
                              </p>
                              <p className={`text-xl font-black ${isProfit ? "text-green-700" : "text-orange-700"}`}>{netProfit.toLocaleString()}</p>
                              <p className={`text-[10px] ${isProfit ? "text-green-500" : "text-orange-500"}`}>{L ? "هامش" : "Margin"} {margin}%</p>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Profit Bar */}
                      {(() => {
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
                              <div className="h-full bg-red-400 rounded-full transition-all duration-500" style={{ width: `${costPct}%` }} />
                              <div className="h-full bg-green-400 flex-1 transition-all duration-500" />
                            </div>
                            <div className="flex gap-4 mt-2 text-[10px]">
                              <span className="flex items-center gap-1 text-red-500"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />{L ? "تكاليف" : "Costs"}</span>
                              <span className="flex items-center gap-1 text-green-600"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />{L ? "ربح صافي" : "Net Profit"}</span>
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
                                hosting: { label: L ? "استضافة" : "Hosting", color: "bg-blue-50 text-blue-700" },
                                domain: { label: L ? "دومين" : "Domain", color: "bg-purple-50 text-purple-700" },
                                freelancer: { label: L ? "مستقل" : "Freelancer", color: "bg-orange-50 text-orange-700" },
                                license: { label: L ? "ترخيص" : "License", color: "bg-amber-50 text-amber-700" },
                                ads: { label: L ? "إعلانات" : "Ads", color: "bg-pink-50 text-pink-700" },
                                design: { label: L ? "تصميم" : "Design", color: "bg-violet-50 text-violet-700" },
                                salary: { label: L ? "راتب" : "Salary", color: "bg-teal-50 text-teal-700" },
                                commission: { label: L ? "عمولة" : "Commission", color: "bg-cyan-50 text-cyan-700" },
                                other: { label: L ? "أخرى" : "Other", color: "bg-black/[0.04] text-black/50" },
                              };
                              const cat = catLabels[exp.category] || catLabels.other;
                              return (
                                <div key={exp.id} className="flex items-center gap-3 bg-white border border-black/[0.06] rounded-xl px-4 py-3 group">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cat.color}`}>{cat.label}</span>
                                  <p className="text-xs text-black/70 flex-1 truncate">{exp.description}</p>
                                  <p className="text-xs font-bold text-red-600 flex-shrink-0 flex items-center gap-1">{Number(exp.amount).toLocaleString()} <SARIcon size={10} className="opacity-60" /></p>
                                  <button
                                    onClick={() => deleteExpenseMutation.mutate(exp.id)}
                                    disabled={deleteExpenseMutation.isPending}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600"
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
              <PhoneOff className="w-4 h-4 text-rose-500" />
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
                className="bg-rose-500 hover:bg-rose-600 text-white gap-2"
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

      {/* Reject Bank Transfer Dialog */}
      <Dialog open={rejectTransferOpen} onOpenChange={open => { setRejectTransferOpen(open); if (!open) setRejectTransferReason(""); }}>
        <DialogContent dir={dir} className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
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
                className="bg-red-500 hover:bg-red-600 text-white gap-2"
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
