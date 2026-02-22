import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, FileText, CheckCircle, Clock, XCircle, Eye } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

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
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد المراجعة", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  approved: { label: "تمت الموافقة", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  in_progress: { label: "قيد التنفيذ", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  completed: { label: "مكتمل", color: "bg-black/[0.06] text-black/60 border-black/[0.08]" },
  cancelled: { label: "ملغي", color: "bg-red-500/10 text-red-600 border-red-500/20" },
};

const paymentMethods: Record<string, string> = {
  bank_transfer: "تحويل بنكي",
  paypal: "PayPal",
  cash: "نقدي",
};

export default function AdminOrders() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const { data: orders, isLoading } = useQuery<OrderData[]>({
    queryKey: ["/api/admin/orders"]
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
    updateMutation.mutate({ id: selectedOrder.id, updates });
  };

  const openDetail = (order: OrderData) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setEditAmount(order.totalAmount?.toString() || "");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin w-8 h-8 text-black/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black flex items-center gap-3">
          <FileText className="w-7 h-7 text-black/40" />
          إدارة الطلبات
        </h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-black/40">
            {orders?.length || 0} طلب
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { key: "pending", icon: Clock, label: "قيد المراجعة", color: "text-yellow-600" },
          { key: "approved", icon: CheckCircle, label: "تمت الموافقة", color: "text-green-600" },
          { key: "in_progress", icon: Loader2, label: "قيد التنفيذ", color: "text-blue-600" },
          { key: "completed", icon: CheckCircle, label: "مكتمل", color: "text-black/60" },
        ].map((stat) => (
          <div key={stat.key} className="border border-black/[0.06] bg-white rounded-xl p-4 flex items-center gap-3">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <div>
              <p className="text-lg font-bold text-black">
                {orders?.filter(o => o.status === stat.key).length || 0}
              </p>
              <p className="text-xs text-black/40">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border border-black/[0.06] bg-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.06]">
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">#</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">النوع</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">الحالة</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">الدفع</th>
                <th className="text-right p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">المبلغ</th>
                <th className="text-left p-4 text-xs font-semibold text-black/40 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {orders?.map((order) => (
                <tr key={order.id} className="border-b border-black/[0.03] hover:bg-black/[0.02] transition-colors" data-testid={`row-order-${order.id}`}>
                  <td className="p-4 text-sm text-black/60">#{order.id}</td>
                  <td className="p-4">
                    <p className="text-sm font-medium text-black">{order.projectType || order.sector || "—"}</p>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${statusMap[order.status]?.color || "bg-black/[0.03] text-black/40 border-black/[0.06]"}`}>
                      {statusMap[order.status]?.label || order.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-black/60">
                    {paymentMethods[order.paymentMethod || ""] || order.paymentMethod || "—"}
                  </td>
                  <td className="p-4 text-sm text-black/60">
                    {order.totalAmount ? `${Number(order.totalAmount).toLocaleString()} ر.س` : "—"}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-black/60"
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
              ))}
              {(!orders || orders.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-black/30">
                    لا توجد طلبات بعد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(v) => !v && setSelectedOrder(null)}>
        <DialogContent className="bg-white border-black/[0.06] text-black max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black">
              تفاصيل الطلب #{selectedOrder?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-black/[0.06] bg-white rounded-lg p-3">
                  <p className="text-[10px] text-black/30 uppercase tracking-wider mb-1">الحالة</p>
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
                <div className="border border-black/[0.06] bg-white rounded-lg p-3">
                  <p className="text-[10px] text-black/30 uppercase tracking-wider mb-1">المبلغ (ر.س)</p>
                  <Input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="h-9"
                    data-testid="input-order-amount"
                  />
                </div>
              </div>

              <div className="border border-black/[0.06] bg-white rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-black/40">طريقة الدفع</span>
                  <span className="text-black">{paymentMethods[selectedOrder.paymentMethod || ""] || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-black/40">دفعة مقدمة</span>
                  <span className="text-black">{selectedOrder.isDepositPaid ? "نعم" : "لا"}</span>
                </div>
                {selectedOrder.paymentProofUrl && (
                  <div className="flex justify-between text-sm">
                    <span className="text-black/40">إثبات الدفع</span>
                    <a href={selectedOrder.paymentProofUrl} target="_blank" rel="noreferrer" className="text-black/60 underline">عرض</a>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSaveChanges}
                  className="flex-1 premium-btn"
                  disabled={updateMutation.isPending}
                  data-testid="button-save-order"
                >
                  {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  حفظ التغييرات
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                >
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
