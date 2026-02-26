import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Loader2, Printer, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "تحويل بنكي", cash: "نقداً", stc_pay: "STC Pay",
  apple_pay: "Apple Pay", paypal: "PayPal", other: "أخرى",
};

export default function ReceiptPrint() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: receipt, isLoading } = useQuery({
    queryKey: ["/api/receipts", params.id],
    queryFn: async () => {
      const r = await fetch(`/api/receipts/${params.id}`);
      if (!r.ok) throw new Error("not found");
      return r.json();
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", `/api/receipts/${params.id}/send-email`, {});
      return r.json();
    },
    onSuccess: () => toast({ title: "تم إرسال السند بالبريد ✅" }),
    onError: () => toast({ title: "فشل إرسال البريد", variant: "destructive" }),
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-black/30" />
    </div>
  );

  if (!receipt) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-black/40">السند غير موجود</p>
    </div>
  );

  const client = typeof receipt.userId === "object" ? receipt.userId : null;
  const invoice = typeof receipt.invoiceId === "object" ? receipt.invoiceId : null;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-page { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; max-width: 100% !important; }
        }
      `}</style>

      {/* Controls */}
      <div className="no-print bg-black/[0.04] border-b border-black/[0.08] px-6 py-3 flex items-center justify-between" dir="rtl">
        <button onClick={() => setLocation("/admin/receipts")} className="flex items-center gap-1.5 text-sm text-black/50 hover:text-black transition-colors">
          <ArrowRight className="w-4 h-4" />
          رجوع لسندات القبض
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

      {/* Receipt Paper */}
      <div className="min-h-screen bg-gray-50 flex justify-center py-8 px-4">
        <div
          className="print-page bg-white w-full max-w-[680px] shadow-lg rounded-xl overflow-hidden"
          style={{ fontFamily: "'Cairo', 'Segoe UI', Arial, sans-serif" }}
          dir="rtl"
        >
          {/* Header */}
          <div className="bg-black px-8 py-6 flex items-center justify-between">
            <div>
              <img src={qiroxLogoPath} alt="QIROX" className="h-9 w-auto object-contain brightness-[2] opacity-90" />
              <p className="text-white/40 text-xs mt-1">qiroxstudio.online</p>
            </div>
            <div className="text-left">
              <div className="text-white font-black text-xl">سند قبض</div>
              <div className="text-white/50 text-sm font-mono mt-1">{receipt.receiptNumber}</div>
            </div>
          </div>

          {/* Date bar */}
          <div className="bg-black/[0.03] border-b border-black/[0.06] px-8 py-3 flex justify-between text-xs text-black/50">
            <div>
              <span className="text-black/30">التاريخ: </span>
              <span className="font-medium text-black/70">
                {new Date(receipt.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
            {invoice && (
              <div>
                <span className="text-black/30">مرتبط بالفاتورة: </span>
                <span className="font-medium text-black/70 font-mono">{invoice.invoiceNumber}</span>
              </div>
            )}
          </div>

          <div className="px-8 py-8">
            {/* Amount - prominent */}
            <div className="text-center mb-8 bg-black/[0.03] border border-black/[0.07] rounded-2xl px-6 py-8">
              <p className="text-xs text-black/30 font-bold uppercase tracking-wider mb-3">المبلغ المستلم</p>
              <div className="text-5xl font-black text-black mb-2">{receipt.amount?.toLocaleString()}</div>
              <div className="text-lg font-bold text-black/40">ريال سعودي</div>
              {receipt.amountInWords && (
                <p className="mt-3 text-sm text-black/50 font-medium border-t border-black/[0.08] pt-3">
                  {receipt.amountInWords}
                </p>
              )}
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-5 mb-8">
              <div>
                <p className="text-xs font-bold text-black/30 mb-1">استُلم من</p>
                <p className="font-black text-black">{client?.fullName || client?.username || "—"}</p>
                {client?.email && <p className="text-xs text-black/40 mt-0.5">{client.email}</p>}
              </div>
              <div>
                <p className="text-xs font-bold text-black/30 mb-1">طريقة الدفع</p>
                <p className="font-bold text-black">{METHOD_LABELS[receipt.paymentMethod] || receipt.paymentMethod}</p>
                {receipt.paymentRef && <p className="text-xs text-black/40 mt-0.5 font-mono">{receipt.paymentRef}</p>}
              </div>
              {receipt.description && (
                <div className="col-span-2">
                  <p className="text-xs font-bold text-black/30 mb-1">الغرض / الوصف</p>
                  <p className="font-medium text-black/70">{receipt.description}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-black/30 mb-1">المستلِم</p>
                <p className="font-bold text-black">{receipt.receivedBy || "QIROX Studio"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-black/30 mb-1">رقم السند</p>
                <p className="font-bold text-black font-mono">{receipt.receiptNumber}</p>
              </div>
            </div>

            {receipt.notes && (
              <div className="bg-black/[0.02] border border-black/[0.06] rounded-xl px-4 py-3 mb-6">
                <p className="text-xs font-bold text-black/40 mb-1">ملاحظات</p>
                <p className="text-sm text-black/60">{receipt.notes}</p>
              </div>
            )}

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 mt-10">
              <div className="text-center">
                <div className="border-t-2 border-black/[0.12] pt-3">
                  <p className="text-xs font-bold text-black/40">توقيع المستلِم</p>
                  <p className="text-sm font-bold text-black/60 mt-1">{receipt.receivedBy || "QIROX Studio"}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-black/[0.12] pt-3">
                  <p className="text-xs font-bold text-black/40">توقيع الدافع</p>
                  <p className="text-sm font-bold text-black/60 mt-1">{client?.fullName || "—"}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-black/[0.06] pt-4 mt-8 text-center text-xs text-black/25">
              <p>QIROX Studio — qiroxstudio.online — info@qiroxstudio.online</p>
              <p className="mt-0.5">هذا السند صادر إلكترونياً ويُعدّ مستنداً رسمياً لاستلام المبلغ المذكور</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
