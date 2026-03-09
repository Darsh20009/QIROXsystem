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
import { Loader2, FileText, CheckCircle, XCircle, Eye, UserCheck, FolderPlus, Briefcase, Layers, Server, Globe, Save, Link2, ExternalLink, Phone, Mail, Shield, Download, Upload, CreditCard, TrendingUp, TrendingDown, PlusCircle, Trash2, DollarSign, BarChart3 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

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
  isDepositPaid?: boolean;
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

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد المراجعة", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  approved: { label: "تمت الموافقة", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  in_progress: { label: "قيد التنفيذ", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  completed: { label: "مكتمل", color: "bg-black/[0.06] text-black/60 border-black/[0.08]" },
  cancelled: { label: "ملغي", color: "bg-red-500/10 text-red-600 border-red-500/20" },
  rejected: { label: "مرفوض", color: "bg-red-500/10 text-red-600 border-red-500/20" },
};

const paymentMethods: Record<string, string> = {
  bank_transfer: "تحويل بنكي",
  paypal: "PayPal",
  cash: "نقدي",
};

const roleLabels: Record<string, string> = {
  admin: "مدير النظام", manager: "مدير", developer: "مطور",
  designer: "مصمم", support: "دعم", sales: "مبيعات",
  sales_manager: "مدير مبيعات", accountant: "محاسب",
};

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
      toast({ title: "تم تحديث الطلب بنجاح" });
    },
    onError: () => toast({ title: "خطأ في تحديث الطلب", variant: "destructive" }),
  });

  const saveSpecsMutation = useMutation({
    mutationFn: async (data: { orderId: string; specs: any }) => {
      const res = await apiRequest("PUT", `/api/admin/orders/${data.orderId}/specs`, data.specs);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'specs'] });
      toast({ title: "تم حفظ المواصفات التقنية ✓" });
    },
    onError: () => toast({ title: "خطأ في حفظ المواصفات", variant: "destructive" }),
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
      if (!res.ok) throw new Error("فشل إضافة المصروف");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'expenses'] });
      setNewExpense({ category: "other", description: "", amount: "" });
      toast({ title: "تم إضافة المصروف" });
    },
    onError: () => toast({ title: "خطأ في إضافة المصروف", variant: "destructive" }),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      await apiRequest("DELETE", `/api/admin/expenses/${expenseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'expenses'] });
      toast({ title: "تم حذف المصروف" });
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
      toast({ title: "تم إنشاء المشروع بنجاح" });
      setSelectedOrder(null);
    },
    onError: () => toast({ title: "فشل إنشاء المشروع", variant: "destructive" }),
  });

  const saveGuideMutation = useMutation({
    mutationFn: async ({ projectId, guide }: { projectId: string; guide: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/projects/${projectId}/usage-guide`, guide);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrder?.id, 'project'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: "✅ تم حفظ شرح الاستخدام" });
    },
    onError: () => toast({ title: "فشل حفظ الشرح", variant: "destructive" }),
  });

  const handleSaveGuide = () => {
    if (!orderProject?.id) { toast({ title: "لا يوجد مشروع مرتبط بهذا الطلب", variant: "destructive" }); return; }
    saveGuideMutation.mutate({
      projectId: orderProject.id,
      guide: {
        title: guideForm.title || "شرح استخدام النظام",
        description: guideForm.description,
        files: guideForm.files.split("\n").map(f => f.trim()).filter(Boolean),
      },
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
    <div className="relative overflow-hidden space-y-5" dir="rtl">
      <PageGraphics variant="dashboard" />
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-black flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-black/40" />
            إدارة الطلبات
          </h1>
          <p className="text-xs text-black/35 mt-0.5">عرض وإدارة وملء بيانات جميع الطلبات</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-9 text-xs" data-testid="select-filter-status">
            <SelectValue placeholder="تصفية الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل ({orders?.length || 0})</SelectItem>
            {Object.entries(statusMap).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label} ({orders?.filter(o => o.status === k).length || 0})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { key: "pending", label: "قيد المراجعة", color: "text-yellow-600 bg-yellow-50" },
          { key: "approved", label: "موافق عليه", color: "text-green-600 bg-green-50" },
          { key: "in_progress", label: "قيد التنفيذ", color: "text-blue-600 bg-blue-50" },
          { key: "completed", label: "مكتمل", color: "text-black/60 bg-black/[0.04]" },
          { key: "cancelled", label: "ملغي", color: "text-red-600 bg-red-50" },
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
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">رقم الطلب</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">النشاط</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">الحالة</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">المسؤول</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">المبلغ</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">التاريخ</th>
                <th className="text-left p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">إجراءات</th>
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
                        <p className="text-[10px] text-black/30 mt-0.5">{order.sectorFeatures.length} ميزة</p>
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
                        <span className="text-xs text-black/20 italic">غير معين</span>
                      )}
                    </td>
                    <td className="p-4 text-sm font-semibold text-black/70">
                      {order.totalAmount ? <span className="flex items-center gap-1">{Number(order.totalAmount).toLocaleString()} <SARIcon size={11} className="opacity-45" /></span> : "—"}
                    </td>
                    <td className="p-4 text-xs text-black/30">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }) : "—"}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" className="text-black/60 w-8 h-8" onClick={() => openOrder(order)} data-testid={`button-view-${order.id}`}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {order.status === "pending" && (
                          <>
                            <Button size="sm" variant="ghost" className="text-green-600 h-8 text-xs px-2" onClick={() => handleQuickStatus(order.id, "approved")} disabled={updateMutation.isPending} data-testid={`button-approve-${order.id}`}>
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />قبول
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-500 h-8 text-xs px-2" onClick={() => handleQuickStatus(order.id, "cancelled")} disabled={updateMutation.isPending} data-testid={`button-reject-${order.id}`}>
                              <XCircle className="w-3.5 h-3.5 mr-1" />رفض
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
                    <p className="text-sm">لا توجد طلبات</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Order Sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent side="left" className="w-full sm:max-w-3xl p-0 overflow-hidden" dir="rtl">
          {selectedOrder && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="px-6 py-5 border-b border-black/[0.06] bg-white flex-shrink-0">
                <SheetTitle className="text-base font-bold text-black">
                  طلب #{selectedOrder.id?.toString().slice(-8)}
                  {selectedOrder.businessName && <span className="text-black/40 font-normal mr-2">— {selectedOrder.businessName}</span>}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusMap[selectedOrder.status]?.color || ""}`}>
                    {statusMap[selectedOrder.status]?.label || selectedOrder.status}
                  </span>
                  {selectedOrder.totalAmount && (
                    <span className="text-[10px] text-black/40 flex items-center gap-0.5">{Number(selectedOrder.totalAmount).toLocaleString()} <SARIcon size={9} className="opacity-40" /></span>
                  )}
                  {selectedOrder.client?.fullName && (
                    <span className="text-[10px] text-black/30">{selectedOrder.client.fullName}</span>
                  )}
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
                <TabsList className="w-full rounded-none border-b border-black/[0.06] bg-white h-10 justify-start px-6 gap-0 flex-shrink-0">
                  <TabsTrigger value="details" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent h-10 px-4">
                    تفاصيل الطلب
                  </TabsTrigger>
                  <TabsTrigger value="specs" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent h-10 px-4">
                    المواصفات التقنية
                  </TabsTrigger>
                  <TabsTrigger value="manage" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent h-10 px-4">
                    إدارة الطلب
                  </TabsTrigger>
                  <TabsTrigger value="profit" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:text-green-700 data-[state=active]:bg-transparent h-10 px-4 gap-1">
                    <DollarSign className="w-3 h-3" />التكاليف والأرباح
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Details */}
                <TabsContent value="details" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="px-6 py-5 space-y-6">
                      <div className="bg-black/[0.02] border border-black/[0.06] rounded-2xl p-5">
                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5" />
                          إيصال الدفع البنكي
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
                              <p className="text-xs font-bold text-green-700">تم رفع الإيصال بنجاح</p>
                              <p className="text-[10px] text-black/30">اضغط لتغيير الملف</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 py-1">
                              <div className="w-10 h-10 rounded-xl bg-black/[0.04] flex items-center justify-center group-hover:bg-black/[0.07] transition-colors">
                                <Upload className="w-4 h-4 text-black/25" />
                              </div>
                              <span className="text-xs text-black/35">اضغط لرفع إيصال التحويل</span>
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
                                toast({ title: "تم رفع الإيصال وتحديث حالة الدفع" });
                              }
                            } catch (err) {
                              toast({ title: "فشل رفع الملف", variant: "destructive" });
                            }
                          }}
                        />
                        {selectedOrder.paymentProofUrl && (
                          <Button 
                            variant="outline" 
                            className="w-full mt-2 text-xs gap-2"
                            onClick={() => window.open(selectedOrder.paymentProofUrl, "_blank")}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            عرض الإيصال الحالي
                          </Button>
                        )}
                      </div>

                      {/* Client Info */}
                      {selectedOrder.client && (
                        <div>
                          <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-3">بيانات العميل</p>
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
                              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-black/30 flex-shrink-0" /><p className="text-xs text-black/60">{selectedOrder.client.phone}</p></div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Project Details from questionnaire */}
                      <div>
                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-3">تفاصيل المشروع</p>
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
                          <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-3">المميزات المطلوبة</p>
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
                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-3">بيانات الدفع</p>
                        <div className="bg-black/[0.02] rounded-xl p-4 border border-black/[0.04] space-y-2">
                          <div className="flex justify-between"><p className="text-xs text-black/50">طريقة الدفع</p><p className="text-xs font-bold text-black">{paymentMethods[selectedOrder.paymentMethod || ""] || "—"}</p></div>
                          <div className="flex justify-between"><p className="text-xs text-black/50">الإجمالي</p><p className="text-xs font-bold text-black flex items-center gap-1">{selectedOrder.totalAmount ? <>{Number(selectedOrder.totalAmount).toLocaleString()} <SARIcon size={10} className="opacity-50" /></> : "—"}</p></div>
                          <div className="flex justify-between"><p className="text-xs text-black/50">الدفعة الأولى</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${selectedOrder.isDepositPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {selectedOrder.isDepositPaid ? "مدفوعة ✓" : "لم تُدفع"}
                            </span>
                          </div>
                          {selectedOrder.paymentProofUrl && (
                            <a href={selectedOrder.paymentProofUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-black/50 hover:text-black transition-colors mt-1">
                              <Link2 className="w-3.5 h-3.5" />
                              عرض إيصال الدفع
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Client Documents */}
                      {(() => {
                        const files = (selectedOrder as any).files || {};
                        const fileCategories = [
                          { key: "logo",          label: "الشعار",           color: "bg-violet-500" },
                          { key: "brandIdentity", label: "الهوية البصرية",   color: "bg-blue-500" },
                          { key: "content",       label: "المحتوى والصور",   color: "bg-emerald-500" },
                          { key: "paymentProof",  label: "إثبات الدفع",      color: "bg-amber-500" },
                        ];
                        const allDocs: { label: string; url: string; color: string }[] = [];
                        fileCategories.forEach(({ key, label, color }) => {
                          const arr: string[] = Array.isArray(files[key]) ? files[key] : (files[key] ? [files[key]] : []);
                          arr.forEach(u => allDocs.push({ label, url: u, color }));
                        });
                        if (!allDocs.length) return null;
                        return (
                          <div>
                            <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-3">مستندات العميل</p>
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
                        <p className="text-xs text-black/30 mr-2">جاري تحميل المواصفات...</p>
                      </div>
                    ) : (
                      <div className="px-6 py-5 space-y-5">
                        {/* Project Info */}
                        <div className="bg-black rounded-2xl p-5">
                          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Briefcase className="w-3.5 h-3.5" />معلومات المشروع
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold text-white/50 mb-1 block">اسم المشروع</label>
                              <Input placeholder="مثال: نظام إدارة مطعم الروضة" value={specsForm.projectName}
                                onChange={e => setSpecsForm(f => ({ ...f, projectName: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white placeholder:text-white/30" data-testid="input-specs-projectname" />
                            </div>
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold text-white/50 mb-1 block">بريد العميل الرسمي</label>
                              <Input type="email" placeholder="client@example.com" value={specsForm.clientEmail}
                                onChange={e => setSpecsForm(f => ({ ...f, clientEmail: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white placeholder:text-white/30" data-testid="input-specs-email" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-white/50 mb-1 block">الميزانية الكلية (ر.س)</label>
                              <Input type="number" value={specsForm.totalBudget}
                                onChange={e => setSpecsForm(f => ({ ...f, totalBudget: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white" data-testid="input-specs-budget" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-white/50 mb-1 block">المدفوع حالياً (ر.س)</label>
                              <Input type="number" value={specsForm.paidAmount}
                                onChange={e => setSpecsForm(f => ({ ...f, paidAmount: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white" data-testid="input-specs-paid" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-white/50 mb-1 block">تاريخ البداية</label>
                              <Input type="date" value={specsForm.startDate}
                                onChange={e => setSpecsForm(f => ({ ...f, startDate: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white" data-testid="input-specs-start" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-white/50 mb-1 block">تاريخ التسليم</label>
                              <Input type="date" value={specsForm.deadline}
                                onChange={e => setSpecsForm(f => ({ ...f, deadline: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white" data-testid="input-specs-deadline" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-white/50 mb-1 block">الساعات المقدّرة</label>
                              <Input type="number" placeholder="120" value={specsForm.estimatedHours}
                                onChange={e => setSpecsForm(f => ({ ...f, estimatedHours: e.target.value }))}
                                className="text-sm bg-white/10 border-white/20 text-white" data-testid="input-specs-hours" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-white/50 mb-1 block">حالة المشروع</label>
                              <Select value={specsForm.projectStatus} onValueChange={v => setSpecsForm(f => ({ ...f, projectStatus: v }))}>
                                <SelectTrigger className="text-sm bg-white/10 border-white/20 text-white" data-testid="select-specs-status">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="planning">تخطيط</SelectItem>
                                  <SelectItem value="in_dev">قيد التطوير</SelectItem>
                                  <SelectItem value="testing">اختبار</SelectItem>
                                  <SelectItem value="delivery">تسليم</SelectItem>
                                  <SelectItem value="closed">مغلق</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Tech Stack */}
                        <div className="border border-black/[0.07] rounded-2xl p-5 bg-white">
                          <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5" />البنية التقنية
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                              <label className="text-[10px] font-bold text-black/50 mb-1 block">Stack التقني الكامل</label>
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
                              <label className="text-[10px] font-bold text-black/50 mb-1 block">لغة البرمجة</label>
                              <Select value={specsForm.language} onValueChange={v => setSpecsForm(f => ({ ...f, language: v }))}>
                                <SelectTrigger className="text-sm" data-testid="select-specs-lang"><SelectValue placeholder="اختر اللغة" /></SelectTrigger>
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
                              <label className="text-[10px] font-bold text-black/50 mb-1 block">قاعدة البيانات</label>
                              <Select value={specsForm.database} onValueChange={v => setSpecsForm(f => ({ ...f, database: v }))}>
                                <SelectTrigger className="text-sm" data-testid="select-specs-db"><SelectValue placeholder="اختر قاعدة البيانات" /></SelectTrigger>
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
                              <label className="text-[10px] font-bold text-black/50 mb-1 block">الاستضافة</label>
                              <Select value={specsForm.hosting} onValueChange={v => setSpecsForm(f => ({ ...f, hosting: v }))}>
                                <SelectTrigger className="text-sm" data-testid="select-specs-hosting"><SelectValue placeholder="اختر الاستضافة" /></SelectTrigger>
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
                            <Server className="w-3.5 h-3.5" />بيانات النشر
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
                              <label className="text-[10px] font-bold text-black/50 mb-1 block">الدومين المخصص</label>
                              <Input placeholder="project.com" value={specsForm.customDomain}
                                onChange={e => setSpecsForm(f => ({ ...f, customDomain: e.target.value }))}
                                className="text-sm" data-testid="input-specs-domain" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black/50 mb-1 block">اسم المستخدم للنشر</label>
                              <Input value={specsForm.deploymentUsername}
                                onChange={e => setSpecsForm(f => ({ ...f, deploymentUsername: e.target.value }))}
                                className="text-sm" data-testid="input-specs-deploy-user" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black/50 mb-1 block">كلمة مرور النشر</label>
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
                            <Globe className="w-3.5 h-3.5" />ملاحظات التصميم والتسليم
                          </p>
                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] font-bold text-black/50 mb-1 block">مفهوم المشروع</label>
                              <Textarea value={specsForm.projectConcept}
                                onChange={e => setSpecsForm(f => ({ ...f, projectConcept: e.target.value }))}
                                className="text-sm h-16 resize-none" data-testid="input-specs-concept" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-black/50 mb-1 block">لوحة الألوان</label>
                                <Input placeholder="#000000, #FFFFFF..." value={specsForm.colorPalette}
                                  onChange={e => setSpecsForm(f => ({ ...f, colorPalette: e.target.value }))}
                                  className="text-sm" data-testid="input-specs-colors" />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-black/50 mb-1 block">روابط مرجعية</label>
                                <Input placeholder="behance.net/..." value={specsForm.referenceLinks}
                                  onChange={e => setSpecsForm(f => ({ ...f, referenceLinks: e.target.value }))}
                                  className="text-sm" data-testid="input-specs-refs" />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-black/50 mb-1 block">ملاحظات الفريق</label>
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
                          حفظ المواصفات التقنية
                        </Button>

                        {/* ─── Usage Guide Section ─── */}
                        <div className="border border-blue-200 rounded-2xl p-5 bg-blue-50">
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" />شرح استخدام النظام
                          </p>
                          {!orderProject && (
                            <p className="text-xs text-blue-600/60 mb-3">⚠️ لا يوجد مشروع مرتبط بهذا الطلب بعد. أنشئ المشروع أولاً لتتمكن من إضافة شرح الاستخدام.</p>
                          )}
                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] font-bold text-blue-700 mb-1 block">عنوان الدليل</label>
                              <Input value={guideForm.title} onChange={e => setGuideForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="شرح استخدام النظام" className="text-sm bg-white" data-testid="input-guide-title" disabled={!orderProject} />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-blue-700 mb-1 block">محتوى الشرح (يظهر للعميل في لوحة التحكم)</label>
                              <Textarea value={guideForm.description} onChange={e => setGuideForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="اكتب شرحاً مفصّلاً لكيفية استخدام النظام، خطوة بخطوة..." className="text-sm h-28 resize-none bg-white" data-testid="textarea-guide-desc" disabled={!orderProject} />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-blue-700 mb-1 block">روابط ملفات مرفقة (رابط في كل سطر)</label>
                              <Textarea value={guideForm.files} onChange={e => setGuideForm(f => ({ ...f, files: e.target.value }))}
                                placeholder="https://docs.example.com/guide.pdf&#10;https://example.com/video.mp4" className="text-sm h-16 resize-none font-mono bg-white text-xs" data-testid="textarea-guide-files" disabled={!orderProject} dir="ltr" />
                            </div>
                            <Button onClick={handleSaveGuide} disabled={saveGuideMutation.isPending || !orderProject}
                              className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-xl text-xs font-bold"
                              data-testid="button-save-guide">
                              {saveGuideMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                              حفظ شرح الاستخدام
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
                          <label className="block text-xs font-medium text-black/50 mb-1.5">الحالة</label>
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
                          <label className="block text-xs font-medium text-black/50 mb-1.5">المبلغ (ر.س)</label>
                          <Input type="number" value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="h-10" data-testid="input-order-amount" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-black/50 mb-1.5 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5" />تعيين لموظف
                        </label>
                        <Select value={editAssignedTo} onValueChange={setEditAssignedTo}>
                          <SelectTrigger className="h-10" data-testid="select-assign-employee">
                            <SelectValue placeholder="اختر موظفاً..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">غير معين</SelectItem>
                            {employees?.map(emp => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.fullName} — {roleLabels[emp.role] || emp.role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-black/50 mb-1.5">ملاحظات داخلية للفريق</label>
                        <Textarea
                          value={editAdminNotes}
                          onChange={(e) => setEditAdminNotes(e.target.value)}
                          placeholder="ملاحظات للفريق الداخلي..."
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
                        حفظ التغييرات
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
                              <p className="text-[10px] text-blue-500 font-bold mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />إجمالي الإيراد</p>
                              <p className="text-xl font-black text-blue-700">{revenue.toLocaleString()}</p>
                              <SARIcon size={11} className="opacity-40 mt-0.5" />
                            </div>
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                              <p className="text-[10px] text-red-500 font-bold mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3" />إجمالي التكاليف</p>
                              <p className="text-xl font-black text-red-700">{totalCosts.toLocaleString()}</p>
                              <SARIcon size={11} className="opacity-40 mt-0.5" />
                            </div>
                            <div className={`border rounded-2xl p-4 ${isProfit ? "bg-green-50 border-green-100" : "bg-orange-50 border-orange-100"}`}>
                              <p className={`text-[10px] font-bold mb-1 flex items-center gap-1 ${isProfit ? "text-green-600" : "text-orange-600"}`}>
                                {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}صافي الربح
                              </p>
                              <p className={`text-xl font-black ${isProfit ? "text-green-700" : "text-orange-700"}`}>{netProfit.toLocaleString()}</p>
                              <p className={`text-[10px] ${isProfit ? "text-green-500" : "text-orange-500"}`}>هامش {margin}%</p>
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
                              <span>التكاليف {costPct.toFixed(0)}%</span>
                              <span>الربح {(100 - costPct).toFixed(0)}%</span>
                            </div>
                            <div className="h-3 bg-black/[0.04] rounded-full overflow-hidden flex">
                              <div className="h-full bg-red-400 rounded-full transition-all duration-500" style={{ width: `${costPct}%` }} />
                              <div className="h-full bg-green-400 flex-1 transition-all duration-500" />
                            </div>
                            <div className="flex gap-4 mt-2 text-[10px]">
                              <span className="flex items-center gap-1 text-red-500"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />تكاليف</span>
                              <span className="flex items-center gap-1 text-green-600"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />ربح صافي</span>
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {/* Add Expense */}
                      <div className="bg-white border border-black/[0.06] rounded-2xl p-4">
                        <p className="text-[10px] font-bold text-black/50 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <PlusCircle className="w-3.5 h-3.5" />إضافة مصروف جديد
                        </p>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <Label className="text-[10px] text-black/40 mb-1 block">الفئة</Label>
                            <Select value={newExpense.category} onValueChange={v => setNewExpense(p => ({ ...p, category: v }))}>
                              <SelectTrigger className="h-8 text-xs border-black/[0.08]" data-testid="select-expense-category">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hosting">استضافة</SelectItem>
                                <SelectItem value="domain">دومين</SelectItem>
                                <SelectItem value="freelancer">مستقل / مقاول</SelectItem>
                                <SelectItem value="license">ترخيص / اشتراك</SelectItem>
                                <SelectItem value="ads">إعلانات</SelectItem>
                                <SelectItem value="design">تصميم</SelectItem>
                                <SelectItem value="salary">راتب / أجر</SelectItem>
                                <SelectItem value="commission">عمولة</SelectItem>
                                <SelectItem value="other">أخرى</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-[10px] text-black/40 mb-1 block">المبلغ (ر.س)</Label>
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
                            placeholder="وصف المصروف (مثال: استضافة Cloudflare لمدة سنة)"
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
                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-wider mb-2">قائمة المصروفات ({(orderExpenses || []).length})</p>
                        {isLoadingExpenses ? (
                          <div className="py-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-black/20" /></div>
                        ) : (orderExpenses || []).length === 0 ? (
                          <div className="py-8 text-center bg-black/[0.01] border border-black/[0.04] rounded-2xl">
                            <BarChart3 className="w-8 h-8 text-black/10 mx-auto mb-2" />
                            <p className="text-xs text-black/25">لا توجد مصروفات مسجّلة لهذا الطلب</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(orderExpenses || []).map((exp: any) => {
                              const catLabels: Record<string, { label: string; color: string }> = {
                                hosting: { label: "استضافة", color: "bg-blue-50 text-blue-700" },
                                domain: { label: "دومين", color: "bg-purple-50 text-purple-700" },
                                freelancer: { label: "مستقل", color: "bg-orange-50 text-orange-700" },
                                license: { label: "ترخيص", color: "bg-amber-50 text-amber-700" },
                                ads: { label: "إعلانات", color: "bg-pink-50 text-pink-700" },
                                design: { label: "تصميم", color: "bg-violet-50 text-violet-700" },
                                salary: { label: "راتب", color: "bg-teal-50 text-teal-700" },
                                commission: { label: "عمولة", color: "bg-cyan-50 text-cyan-700" },
                                other: { label: "أخرى", color: "bg-black/[0.04] text-black/50" },
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

    </div>
  );
}
