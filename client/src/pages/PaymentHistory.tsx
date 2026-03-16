import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, TrendingUp, Receipt, Download } from "lucide-react";
import SARIcon from "@/components/SARIcon";
import { exportToExcel } from "@/lib/excel";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useI18n } from "@/lib/i18n";

interface PaymentData {
  orders: any[];
  invoices: any[];
}

export default function PaymentHistory() {
  const { lang, dir } = useI18n();
  const L = lang === "ar";

  const STATUS_LABELS: Record<string, string> = {
    pending: L ? "معلق" : "Pending",
    approved: L ? "مقبول" : "Approved",
    in_progress: L ? "قيد التنفيذ" : "In Progress",
    completed: L ? "مكتمل" : "Completed",
    rejected: L ? "مرفوض" : "Rejected",
    delivered: L ? "تم التسليم" : "Delivered",
  };

  const { data, isLoading } = useQuery<PaymentData>({
    queryKey: ["/api/client/payments"],
    queryFn: async () => {
      const r = await fetch("/api/client/payments");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const totalPaid = (data?.orders || []).filter(o => o.isDepositPaid).reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);
  const totalPending = (data?.orders || []).filter(o => !o.isDepositPaid).reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);

  const exportExcel = () => {
    if (!data) return;
    exportToExcel("payment-history.xlsx", [{
      name: L ? "سجل المدفوعات" : "Payment History",
      data: [
        ...(data.orders || []).map((o: any) => ({
          [L ? "النوع" : "Type"]: L ? "طلب" : "Order",
          [L ? "الخدمة" : "Service"]: o.projectType || o.sector || "-",
          [L ? "المبلغ" : "Amount"]: o.totalAmount || 0,
          [L ? "طريقة الدفع" : "Payment Method"]: o.paymentMethod || "-",
          [L ? "الدفعة الأولى" : "Deposit"]: o.isDepositPaid ? "✓" : "✗",
          [L ? "الحالة" : "Status"]: STATUS_LABELS[o.status] || o.status,
          [L ? "التاريخ" : "Date"]: new Date(o.createdAt).toLocaleDateString(L ? "ar-SA" : "en-US"),
        })),
        ...(data.invoices || []).map((inv: any) => ({
          [L ? "النوع" : "Type"]: L ? "فاتورة" : "Invoice",
          [L ? "الخدمة" : "Service"]: `#${inv.invoiceNumber}`,
          [L ? "المبلغ" : "Amount"]: inv.totalAmount || 0,
          [L ? "طريقة الدفع" : "Payment Method"]: "-",
          [L ? "الدفعة الأولى" : "Deposit"]: inv.status === "paid" ? "✓" : "✗",
          [L ? "الحالة" : "Status"]: inv.status === "paid" ? (L ? "مدفوع" : "Paid") : inv.status === "unpaid" ? (L ? "غير مدفوع" : "Unpaid") : (L ? "ملغي" : "Cancelled"),
          [L ? "التاريخ" : "Date"]: new Date(inv.createdAt).toLocaleDateString(L ? "ar-SA" : "en-US"),
        })),
      ],
    }]);
  };

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" />
    </div>
  );

  return (
    <div className="space-y-6 relative overflow-hidden" dir={dir}>
      <PageGraphics variant="dashboard" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
            <Receipt className="w-5 h-5 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black dark:text-white">{L ? "سجل المدفوعات" : "Payment History"}</h1>
            <p className="text-xs text-black/35 dark:text-white/35">{L ? "كشف حساب مفصل بجميع معاملاتك" : "Detailed account statement of all your transactions"}</p>
          </div>
        </div>
        <Button onClick={exportExcel} variant="outline" size="sm" className="gap-2 dark:border-white/10 dark:text-white" data-testid="button-export-excel">
          <Download className="w-4 h-4" /> {L ? "تصدير" : "Export"}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: L ? "إجمالي المدفوع" : "Total Paid", value: totalPaid.toLocaleString(), hasSAR: true, color: "text-green-500", icon: TrendingUp },
          { label: L ? "مستحق الدفع" : "Due Amount", value: totalPending.toLocaleString(), hasSAR: true, color: "text-yellow-500", icon: CreditCard },
          { label: L ? "عدد الطلبات" : "Total Orders", value: (data?.orders || []).length, hasSAR: false, color: "text-blue-500", icon: Receipt },
        ].map((s, i) => (
          <Card key={i} className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-black/40 dark:text-white/40">{s.label}</span>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-lg font-black text-black dark:text-white flex items-center gap-1">
                {s.value}{s.hasSAR && <SARIcon size={13} className="opacity-60" />}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders */}
      {(data?.orders || []).length > 0 && (
        <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60">{L ? "الطلبات" : "Orders"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.orders || []).map((order: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-3 border-b border-black/[0.04] dark:border-white/[0.04] pb-3 last:border-0" data-testid={`row-payment-order-${i}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-black dark:text-white">{order.projectType || order.sector || (L ? "طلب خدمة" : "Service Request")}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className={order.isDepositPaid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"} style={{ fontSize: "10px" }}>
                        {order.isDepositPaid ? (L ? "دفعة أولى ✓" : "Deposit Paid ✓") : (L ? "بانتظار الدفع" : "Awaiting Payment")}
                      </Badge>
                      <span className="text-[11px] text-black/30 dark:text-white/30">{order.paymentMethod || "-"}</span>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="font-black text-black dark:text-white flex items-center gap-1">{(order.totalAmount || 0).toLocaleString()} <SARIcon size={11} className="opacity-60" /></p>
                    <p className="text-[10px] text-black/25 dark:text-white/25">{new Date(order.createdAt).toLocaleDateString(L ? "ar-SA" : "en-US")}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices */}
      {(data?.invoices || []).length > 0 && (
        <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60">{L ? "الفواتير" : "Invoices"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.invoices || []).map((inv: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-3 border-b border-black/[0.04] dark:border-white/[0.04] pb-3 last:border-0" data-testid={`row-payment-invoice-${i}`}>
                  <div>
                    <p className="font-bold text-sm text-black dark:text-white">{L ? "فاتورة" : "Invoice"} #{inv.invoiceNumber}</p>
                    <Badge className={inv.status === "paid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"} style={{ fontSize: "10px" }}>
                      {inv.status === "paid" ? (L ? "مدفوع" : "Paid") : inv.status === "unpaid" ? (L ? "غير مدفوع" : "Unpaid") : (L ? "ملغي" : "Cancelled")}
                    </Badge>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="font-black text-black dark:text-white flex items-center gap-1">{(inv.totalAmount || 0).toLocaleString()} <SARIcon size={11} className="opacity-60" /></p>
                    <p className="text-[10px] text-black/25 dark:text-white/25">{new Date(inv.createdAt).toLocaleDateString(L ? "ar-SA" : "en-US")}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(data?.orders || []).length === 0 && (data?.invoices || []).length === 0 && (
        <div className="text-center py-16">
          <Receipt className="w-12 h-12 text-black/10 dark:text-white/10 mx-auto mb-3" />
          <p className="text-black/30 dark:text-white/30">{L ? "لا يوجد سجل مدفوعات بعد" : "No payment history yet"}</p>
        </div>
      )}
    </div>
  );
}
