// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useLocation } from "wouter";
import { FileText, Download, CheckCircle, Clock, XCircle, Receipt } from "lucide-react";

function getStatusInfo(status: string, L: boolean) {
  return {
    paid:      { label: L ? "مدفوعة" : "Paid",       color: "bg-green-100 text-green-700 border-green-200",  icon: CheckCircle },
    unpaid:    { label: L ? "غير مدفوعة" : "Unpaid", color: "bg-amber-100 text-amber-700 border-amber-200",  icon: Clock },
    cancelled: { label: L ? "ملغاة" : "Cancelled",   color: "bg-red-100 text-red-700 border-red-200",        icon: XCircle },
  }[status] || { label: status, color: "bg-black/10 text-black/60 border-black/10", icon: FileText };
}

export default function ClientInvoices() {
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const [, setLocation] = useLocation();

  const { data: invoices = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      const r = await fetch("/api/invoices");
      if (!r.ok) return [];
      return r.json();
    },
  });

  const totalPaid  = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalUnpaid = invoices.filter(i => i.status === "unpaid").reduce((s, i) => s + (i.totalAmount || 0), 0);

  return (
    <div className="p-6 space-y-6 font-sans max-w-3xl mx-auto" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white">{L ? "فواتيري" : "My Invoices"}</h1>
        <p className="text-black/50 dark:text-white/40 text-sm">{L ? "سجل المدفوعات والفواتير الإلكترونية" : "Payment history and electronic invoices"}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{totalPaid.toLocaleString()}</div>
            <div className="text-xs text-green-600 mt-1">{L ? "إجمالي المدفوع (ريال)" : "Total Paid (SAR)"}</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-700">{totalUnpaid.toLocaleString()}</div>
            <div className="text-xs text-amber-600 mt-1">{L ? "مستحق الدفع (ريال)" : "Pending Payment (SAR)"}</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-black/30">{L ? "جاري التحميل..." : "Loading..."}</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 text-black/30">
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>{L ? "لا توجد فواتير بعد" : "No invoices yet"}</p>
          <p className="text-xs mt-1">{L ? "ستظهر الفواتير تلقائياً بعد كل عملية دفع" : "Invoices appear automatically after each payment"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv: any) => {
            const st = getStatusInfo(inv.status, L);
            const Icon = st.icon;
            return (
              <Card key={inv._id || inv.id} className="border-black/10 hover:border-black/20 transition-all" data-testid={`card-invoice-${inv._id || inv.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center flex-shrink-0">
                        <Receipt className="w-5 h-5 text-black/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm font-mono">{inv.invoiceNumber}</div>
                        <div className="text-xs text-black/40 mt-0.5 truncate">{inv.notes || (L ? "خدمة QIROX Studio" : "QIROX Studio Service")}</div>
                        <div className="text-xs text-black/30">{new Date(inv.createdAt).toLocaleDateString(L ? "ar-SA" : "en-US")}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="font-bold text-sm">{(inv.totalAmount || 0).toLocaleString()} <span className="text-xs text-black/40 font-normal">{L ? "ريال" : "SAR"}</span></div>
                        {inv.paidAt && (
                          <div className="text-[10px] text-black/30">{new Date(inv.paidAt).toLocaleDateString(L ? "ar-SA" : "en-US")}</div>
                        )}
                      </div>
                      <Badge className={`${st.color} border text-xs`}>{st.label}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-black/20 gap-1.5 text-xs h-8"
                        onClick={() => setLocation(`/client/invoice-print/${inv._id || inv.id}`)}
                        data-testid={`button-download-invoice-${inv._id || inv.id}`}
                      >
                        <Download className="w-3.5 h-3.5" /> {L ? "PDF" : "PDF"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
