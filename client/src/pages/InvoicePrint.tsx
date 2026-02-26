import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Loader2, Printer, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";

export default function InvoicePrint() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["/api/invoices", params.id],
    queryFn: async () => {
      const r = await fetch(`/api/invoices/${params.id}`);
      if (!r.ok) throw new Error("not found");
      return r.json();
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", `/api/invoices/${params.id}/send-email`, {});
      return r.json();
    },
    onSuccess: () => toast({ title: "تم إرسال الفاتورة بالبريد ✅" }),
    onError: () => toast({ title: "فشل إرسال البريد", variant: "destructive" }),
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-black/30" />
    </div>
  );

  if (!invoice) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-black/40">الفاتورة غير موجودة</p>
    </div>
  );

  const client = typeof invoice.userId === "object" ? invoice.userId : null;
  const order = typeof invoice.orderId === "object" ? invoice.orderId : null;
  const statusLabel = ({ paid: "مدفوعة", unpaid: "غير مدفوعة", cancelled: "ملغاة" } as any)[invoice.status] || invoice.status;
  const statusColor = invoice.status === "paid" ? "#16a34a" : invoice.status === "cancelled" ? "#dc2626" : "#d97706";

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-page { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
        }
      `}</style>

      {/* Controls - hidden on print */}
      <div className="no-print bg-black/[0.04] border-b border-black/[0.08] px-6 py-3 flex items-center justify-between" dir="rtl">
        <button onClick={() => setLocation("/admin/invoices")} className="flex items-center gap-1.5 text-sm text-black/50 hover:text-black transition-colors">
          <ArrowRight className="w-4 h-4" />
          رجوع للفواتير
        </button>
        <div className="flex gap-2">
          <Button
            onClick={() => sendEmailMutation.mutate()}
            disabled={sendEmailMutation.isPending}
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 border-black/[0.12]"
          >
            {sendEmailMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
            إرسال للعميل
          </Button>
          <Button onClick={() => window.print()} size="sm" className="bg-black text-white h-8 text-xs gap-1.5">
            <Printer className="w-3 h-3" />
            طباعة / PDF
          </Button>
        </div>
      </div>

      {/* Invoice Paper */}
      <div className="min-h-screen bg-gray-50 flex justify-center py-8 px-4 no-print-bg">
        <div
          className="print-page bg-white w-full max-w-[800px] shadow-lg rounded-xl overflow-hidden"
          style={{ fontFamily: "'Cairo', 'Segoe UI', Arial, sans-serif" }}
          dir="rtl"
        >
          {/* Header */}
          <div className="bg-black px-10 py-8 flex items-center justify-between">
            <div>
              <img src={qiroxLogoPath} alt="QIROX" className="h-10 w-auto object-contain brightness-[2] opacity-90" />
              <p className="text-white/40 text-xs mt-1">qiroxstudio.online</p>
            </div>
            <div className="text-left">
              <div className="text-white font-black text-2xl">فاتورة</div>
              <div className="text-white/50 text-sm font-mono mt-1">{invoice.invoiceNumber}</div>
              <div
                className="mt-2 px-3 py-1 rounded-full text-xs font-bold inline-block"
                style={{ backgroundColor: statusColor + "22", color: statusColor, border: `1px solid ${statusColor}44` }}
              >
                {statusLabel}
              </div>
            </div>
          </div>

          {/* Meta bar */}
          <div className="bg-black/[0.03] border-b border-black/[0.06] px-10 py-4 flex justify-between text-xs text-black/50">
            <div>
              <span className="text-black/30">تاريخ الإصدار: </span>
              <span className="font-medium text-black/70">{new Date(invoice.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
            {invoice.dueDate && (
              <div>
                <span className="text-black/30">تاريخ الاستحقاق: </span>
                <span className="font-medium text-black/70">{new Date(invoice.dueDate).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
            )}
            {invoice.paidAt && (
              <div>
                <span className="text-black/30">تاريخ السداد: </span>
                <span className="font-medium text-green-600">{new Date(invoice.paidAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
            )}
          </div>

          <div className="px-10 py-8">
            {/* Client / From info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-xs font-bold text-black/30 uppercase tracking-wider mb-2">من</p>
                <p className="font-black text-black text-base">QIROX Studio</p>
                <p className="text-xs text-black/40 mt-1">support@qiroxstudio.online</p>
                <p className="text-xs text-black/40">qiroxstudio.online</p>
                <p className="text-xs text-black/40">المملكة العربية السعودية</p>
              </div>
              <div>
                <p className="text-xs font-bold text-black/30 uppercase tracking-wider mb-2">إلى</p>
                <p className="font-black text-black text-base">{client?.fullName || client?.username || "—"}</p>
                {client?.email && <p className="text-xs text-black/40 mt-1">{client.email}</p>}
                {client?.whatsappNumber && <p className="text-xs text-black/40">{client.whatsappNumber}</p>}
                {client?.country && <p className="text-xs text-black/40">{client.country}</p>}
              </div>
            </div>

            {/* Order info */}
            {order && (
              <div className="bg-black/[0.02] border border-black/[0.06] rounded-xl px-4 py-3 mb-6">
                <p className="text-xs text-black/40 mb-1">مرتبطة بالطلب</p>
                <p className="text-sm font-bold text-black">{order.projectType || order.sector || order.id}</p>
              </div>
            )}

            {/* Items table */}
            {invoice.items && invoice.items.length > 0 && (
              <table className="w-full mb-6 text-sm">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="text-right px-4 py-3 font-bold text-xs rounded-r-xl">الوصف</th>
                    <th className="text-center px-4 py-3 font-bold text-xs">الكمية</th>
                    <th className="text-center px-4 py-3 font-bold text-xs">سعر الوحدة</th>
                    <th className="text-center px-4 py-3 font-bold text-xs rounded-l-xl">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-black/[0.02]"}>
                      <td className="px-4 py-3 text-black/80">{item.name}</td>
                      <td className="px-4 py-3 text-center text-black/60">{item.qty}</td>
                      <td className="px-4 py-3 text-center text-black/60">{item.unitPrice?.toLocaleString()} ر.س</td>
                      <td className="px-4 py-3 text-center font-bold text-black">{item.total?.toLocaleString()} ر.س</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm text-black/50 pb-2 border-b border-black/[0.08]">
                  <span>المبلغ قبل الضريبة</span>
                  <span className="font-medium text-black">{invoice.amount?.toLocaleString()} ر.س</span>
                </div>
                {invoice.vatAmount > 0 && (
                  <div className="flex justify-between text-sm text-black/50 pb-2 border-b border-black/[0.08]">
                    <span>ضريبة القيمة المضافة (15%)</span>
                    <span className="font-medium text-black">{invoice.vatAmount?.toLocaleString()} ر.س</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-black bg-black/[0.04] px-4 py-3 rounded-xl">
                  <span>الإجمالي</span>
                  <span>{invoice.totalAmount?.toLocaleString()} ر.س</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="bg-black/[0.02] border border-black/[0.06] rounded-xl px-4 py-3 mb-6">
                <p className="text-xs font-bold text-black/40 mb-1">ملاحظات</p>
                <p className="text-sm text-black/60">{invoice.notes}</p>
              </div>
            )}

            {/* Bank info */}
            <div className="border border-black/[0.08] rounded-xl px-4 py-4 mb-6">
              <p className="text-xs font-bold text-black/40 mb-3">معلومات الدفع</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-black/30">طريقة الدفع</p>
                  <p className="font-bold text-black/70">تحويل بنكي</p>
                </div>
                <div>
                  <p className="text-black/30">رقم الآيبان (IBAN)</p>
                  <p className="font-bold text-black/70 font-mono">SA0380205098017222121010</p>
                </div>
                <div>
                  <p className="text-black/30">اسم المستفيد</p>
                  <p className="font-bold text-black/70">QIROX Studio</p>
                </div>
                <div>
                  <p className="text-black/30">بريد التواصل</p>
                  <p className="font-bold text-black/70">support@qiroxstudio.online</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-black/[0.06] pt-4 text-center text-xs text-black/25">
              <p>شكراً لثقتكم في QIROX Studio — qiroxstudio.online</p>
              <p className="mt-1">هذه الفاتورة صادرة إلكترونياً وصالحة بدون توقيع</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
