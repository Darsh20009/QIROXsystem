import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, CheckCircle, Clock, XCircle, Eye, UserCheck, DollarSign, Calendar } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

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
  admin: "مدير النظام",
  manager: "مدير",
  developer: "مطور",
  designer: "مصمم",
  support: "دعم",
  sales: "مبيعات",
  sales_manager: "مدير مبيعات",
  accountant: "محاسب",
};

export default function AdminOrders() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editAdminNotes, setEditAdminNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: orders, isLoading } = useQuery<OrderData[]>({
    queryKey: ["/api/admin/orders"]
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"]
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const res = await apiRequest("PATCH", `/api/admin/orders/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "تم تحديث الطلب بنجاح" });
      setSelectedOrder(null);
    },
    onError: () => {
      toast({ title: "خطأ في تحديث الطلب", variant: "destructive" });
    },
  });

  const handleQuickStatus = (id: string, status: string) => {
    updateMutation.mutate({ id, updates: { status } });
  };

  const handleSaveChanges = () => {
    if (!selectedOrder) return;
    const updates: Record<string, any> = {};
    if (editStatus) updates.status = editStatus;
    if (editAmount) updates.totalAmount = Number(editAmount);
    if (editAssignedTo && editAssignedTo !== "none") updates.assignedTo = editAssignedTo;
    if (editAssignedTo === "none") updates.assignedTo = null;
    if (editAdminNotes !== undefined) updates.adminNotes = editAdminNotes;
    updateMutation.mutate({ id: selectedOrder.id, updates });
  };

  const openDetail = (order: OrderData) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setEditAmount(order.totalAmount?.toString() || "");
    setEditAssignedTo(order.assignedTo || "none");
    setEditAdminNotes(order.adminNotes || "");
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
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-black flex items-center gap-3">
          <FileText className="w-7 h-7 text-black/40" />
          إدارة الطلبات
        </h1>
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

      <div className="border border-black/[0.06] bg-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.06] bg-black/[0.01]">
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">رقم الطلب</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">النوع</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">الحالة</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">المسؤول</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">الدفع</th>
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
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-black">{order.projectType || order.sector || "—"}</p>
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
                    <td className="p-4 text-sm text-black/60">
                      {paymentMethods[order.paymentMethod || ""] || order.paymentMethod || "—"}
                    </td>
                    <td className="p-4 text-sm font-semibold text-black/70">
                      {order.totalAmount ? `${Number(order.totalAmount).toLocaleString()} ر.س` : "—"}
                    </td>
                    <td className="p-4 text-xs text-black/30">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }) : "—"}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-black/60 w-8 h-8"
                          onClick={() => openDetail(order)}
                          data-testid={`button-view-${order.id}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {order.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600 h-8 text-xs px-2"
                              onClick={() => handleQuickStatus(order.id, "approved")}
                              disabled={updateMutation.isPending}
                              data-testid={`button-approve-${order.id}`}
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              قبول
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 h-8 text-xs px-2"
                              onClick={() => handleQuickStatus(order.id, "cancelled")}
                              disabled={updateMutation.isPending}
                              data-testid={`button-reject-${order.id}`}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              رفض
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
                  <td colSpan={8} className="p-12 text-center text-black/30">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-black/10" />
                    <p className="text-sm">لا توجد طلبات</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(v) => !v && setSelectedOrder(null)}>
        <DialogContent className="bg-white border-black/[0.06] text-black max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black flex items-center gap-2">
              <FileText className="w-5 h-5 text-black/30" />
              طلب #{selectedOrder?.id?.toString().slice(-8)}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 mt-2">
              <div className="bg-black/[0.02] rounded-xl p-4 space-y-2 text-sm">
                {selectedOrder.projectType && (
                  <div className="flex justify-between">
                    <span className="text-black/40">نوع المشروع</span>
                    <span className="text-black font-medium">{selectedOrder.projectType}</span>
                  </div>
                )}
                {selectedOrder.sector && (
                  <div className="flex justify-between">
                    <span className="text-black/40">القطاع</span>
                    <span className="text-black font-medium">{selectedOrder.sector}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-black/40">طريقة الدفع</span>
                  <span className="text-black">{paymentMethods[selectedOrder.paymentMethod || ""] || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/40">دفعة مقدمة</span>
                  <span className={selectedOrder.isDepositPaid ? "text-green-600 font-bold" : "text-black/40"}>{selectedOrder.isDepositPaid ? "✓ مدفوعة" : "لا"}</span>
                </div>
                {selectedOrder.paymentProofUrl && (
                  <div className="flex justify-between">
                    <span className="text-black/40">إثبات الدفع</span>
                    <a href={selectedOrder.paymentProofUrl} target="_blank" rel="noreferrer" className="text-black underline">عرض</a>
                  </div>
                )}
                {selectedOrder.whatsappIntegration && (
                  <div className="flex justify-between">
                    <span className="text-black/40">ربط واتساب</span>
                    <span className="text-green-600">✓</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-black/50 mb-1.5">الحالة</label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="h-9" data-testid="select-order-status">
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
                  <Input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="h-9"
                    data-testid="input-order-amount"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-black/50 mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  تعيين لموظف
                </label>
                <Select value={editAssignedTo} onValueChange={setEditAssignedTo}>
                  <SelectTrigger className="h-9" data-testid="select-assign-employee">
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
                <label className="block text-xs font-medium text-black/50 mb-1.5">ملاحظات داخلية</label>
                <Textarea
                  value={editAdminNotes}
                  onChange={(e) => setEditAdminNotes(e.target.value)}
                  placeholder="ملاحظات للفريق الداخلي..."
                  rows={3}
                  className="text-sm resize-none"
                  data-testid="input-admin-notes"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSaveChanges}
                  className="flex-1 premium-btn"
                  disabled={updateMutation.isPending}
                  data-testid="button-save-order"
                >
                  {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  حفظ التغييرات
                </Button>
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
