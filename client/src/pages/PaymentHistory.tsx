import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, TrendingUp, Receipt, Download } from "lucide-react";
import * as XLSX from "xlsx";

interface PaymentData {
  orders: any[];
  invoices: any[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: "معلق", approved: "مقبول", in_progress: "قيد التنفيذ",
  completed: "مكتمل", rejected: "مرفوض", delivered: "تم التسليم",
};

export default function PaymentHistory() {
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
    const ws = XLSX.utils.json_to_sheet([
      ...(data.orders || []).map((o: any) => ({
        النوع: "طلب",
        الخدمة: o.projectType || o.sector || "-",
        المبلغ: o.totalAmount || 0,
        "طريقة الدفع": o.paymentMethod || "-",
        "الدفعة الأولى": o.isDepositPaid ? "✓" : "✗",
        الحالة: STATUS_LABELS[o.status] || o.status,
        التاريخ: new Date(o.createdAt).toLocaleDateString("ar-SA"),
      })),
      ...(data.invoices || []).map((inv: any) => ({
        النوع: "فاتورة",
        الخدمة: `فاتورة #${inv.invoiceNumber}`,
        المبلغ: inv.totalAmount || 0,
        "طريقة الدفع": "-",
        "الدفعة الأولى": inv.status === "paid" ? "✓" : "✗",
        الحالة: inv.status === "paid" ? "مدفوع" : inv.status === "unpaid" ? "غير مدفوع" : "ملغي",
        التاريخ: new Date(inv.createdAt).toLocaleDateString("ar-SA"),
      })),
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "سجل المدفوعات");
    XLSX.writeFile(wb, "payment-history.xlsx");
  };

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" />
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
            <Receipt className="w-5 h-5 text-white dark:text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black dark:text-white">سجل المدفوعات</h1>
            <p className="text-xs text-black/35 dark:text-white/35">كشف حساب مفصل بجميع معاملاتك</p>
          </div>
        </div>
        <Button onClick={exportExcel} variant="outline" size="sm" className="gap-2 dark:border-white/10 dark:text-white">
          <Download className="w-4 h-4" /> تصدير
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي المدفوع", value: `${totalPaid.toLocaleString()} ر.س`, color: "text-green-500", icon: TrendingUp },
          { label: "مستحق الدفع", value: `${totalPending.toLocaleString()} ر.س`, color: "text-yellow-500", icon: CreditCard },
          { label: "عدد الطلبات", value: (data?.orders || []).length, color: "text-blue-500", icon: Receipt },
        ].map((s, i) => (
          <Card key={i} className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-black/40 dark:text-white/40">{s.label}</span>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-lg font-black text-black dark:text-white">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders */}
      {(data?.orders || []).length > 0 && (
        <Card className="border-black/[0.07] dark:border-white/[0.07] shadow-none rounded-2xl dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60">الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.orders || []).map((order: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-3 border-b border-black/[0.04] dark:border-white/[0.04] pb-3 last:border-0" data-testid={`row-payment-order-${i}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-black dark:text-white">{order.projectType || order.sector || "طلب خدمة"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className={order.isDepositPaid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"} style={{ fontSize: "10px" }}>
                        {order.isDepositPaid ? "دفعة أولى ✓" : "بانتظار الدفع"}
                      </Badge>
                      <span className="text-[11px] text-black/30 dark:text-white/30">{order.paymentMethod || "-"}</span>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="font-black text-black dark:text-white">{(order.totalAmount || 0).toLocaleString()} ر.س</p>
                    <p className="text-[10px] text-black/25 dark:text-white/25">{new Date(order.createdAt).toLocaleDateString("ar-SA")}</p>
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
            <CardTitle className="text-sm font-bold text-black/60 dark:text-white/60">الفواتير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.invoices || []).map((inv: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-3 border-b border-black/[0.04] dark:border-white/[0.04] pb-3 last:border-0" data-testid={`row-payment-invoice-${i}`}>
                  <div>
                    <p className="font-bold text-sm text-black dark:text-white">فاتورة #{inv.invoiceNumber}</p>
                    <Badge className={inv.status === "paid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"} style={{ fontSize: "10px" }}>
                      {inv.status === "paid" ? "مدفوع" : inv.status === "unpaid" ? "غير مدفوع" : "ملغي"}
                    </Badge>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="font-black text-black dark:text-white">{(inv.totalAmount || 0).toLocaleString()} ر.س</p>
                    <p className="text-[10px] text-black/25 dark:text-white/25">{new Date(inv.createdAt).toLocaleDateString("ar-SA")}</p>
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
          <p className="text-black/30 dark:text-white/30">لا يوجد سجل مدفوعات بعد</p>
        </div>
      )}
    </div>
  );
}
