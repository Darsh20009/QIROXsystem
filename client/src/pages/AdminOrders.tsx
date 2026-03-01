import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, CheckCircle, XCircle, Eye, UserCheck, FolderPlus, Briefcase, Layers, Server, Globe, Save, Link2, ExternalLink, Phone, Mail, Shield } from "lucide-react";
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
                      {order.totalAmount ? `${Number(order.totalAmount).toLocaleString()} ر.س` : "—"}
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
                    <span className="text-[10px] text-black/40">{Number(selectedOrder.totalAmount).toLocaleString()} ر.س</span>
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
                </TabsList>

                {/* Tab 1: Details */}
                <TabsContent value="details" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
                    <div className="px-6 py-5 space-y-6">
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
                          <div className="flex justify-between"><p className="text-xs text-black/50">الإجمالي</p><p className="text-xs font-bold text-black">{selectedOrder.totalAmount ? `${Number(selectedOrder.totalAmount).toLocaleString()} ر.س` : "—"}</p></div>
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

                      {/* Client Documents — Logo & Trade License */}
                      {(() => {
                        const files = (selectedOrder as any).files || {};
                        const logoUrls   = files.logo    || [];
                        const licUrls    = files.license || [];
                        const allDocs    = [
                          ...logoUrls.map((u: string) => ({ label: "شعار الجهة", url: u, color: "bg-violet-500" })),
                          ...licUrls.map((u: string)  => ({ label: "السجل التجاري", url: u, color: "bg-blue-500" })),
                        ];
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
                                  <SelectItem value="Replit">Replit Deployments</SelectItem>
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
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
