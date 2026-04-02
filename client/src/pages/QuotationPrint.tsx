import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Loader2, Printer, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";

const STATUS_LABELS: Record<string, string> = {
  draft: "مسودة", sent: "مُرسل", accepted: "مقبول", rejected: "مرفوض", expired: "منتهي الصلاحية",
};

const DEFAULT_BANK = { bankName: "—", beneficiaryName: "—", iban: "—" };

export default function QuotationPrint() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: quotation, isLoading } = useQuery({
    queryKey: ["/api/quotations", params.id],
    queryFn: async () => {
      const r = await fetch(`/api/quotations/${params.id}`);
      if (!r.ok) throw new Error("not found");
      return r.json();
    },
    enabled: !!params.id,
  });

  const { data: bankSettings } = useQuery<typeof DEFAULT_BANK>({
    queryKey: ["/api/bank-settings"],
  });
  const bank = bankSettings || DEFAULT_BANK;

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-6 h-6 animate-spin text-black/30" />
    </div>
  );

  if (!quotation) return (
    <div className="flex items-center justify-center min-h-screen text-black/40">عرض السعر غير موجود</div>
  );

  const client = typeof quotation.userId === "object" ? quotation.userId : null;
  const statusLabel = STATUS_LABELS[quotation.status] || quotation.status;

  return (
    <div className="min-h-screen bg-black/[0.03]" dir="rtl">
      <div className="print:hidden max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
        <Button variant="outline" size="sm" className="gap-1.5 border-black/[0.15] text-black/60 h-8 text-xs"
          onClick={() => setLocation(-1 as any)}>
          <ArrowRight className="w-3 h-3" /> رجوع
        </Button>
        <Button onClick={() => window.print()} size="sm"
          className="bg-black text-white h-8 gap-1.5 text-xs" data-testid="button-print">
          <Printer className="w-3 h-3" /> طباعة
        </Button>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-12 print:px-0 print:pb-0">
        <div className="bg-white shadow-sm rounded-2xl overflow-hidden print:shadow-none print:rounded-none">
          {/* Header */}
          <div className="bg-black px-10 py-8 flex items-start justify-between">
            <div>
              <img src={qiroxLogoPath} alt="QIROX" className="h-10 w-auto mb-4 brightness-0 invert" />
              <p className="text-white/60 text-sm">qiroxstudio.online</p>
            </div>
            <div className="text-left">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-1">عرض سعر</p>
              <p className="text-white font-black text-xl font-mono">{quotation.quotationNumber}</p>
              <p className="text-white/50 text-xs mt-1">{new Date(quotation.createdAt).toLocaleDateString("ar-SA")}</p>
              {quotation.validUntil && (
                <p className="text-yellow-300 text-xs mt-0.5">
                  صالح حتى: {new Date(quotation.validUntil).toLocaleDateString("ar-SA")}
                </p>
              )}
              <p className="mt-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold
                  ${quotation.status === 'accepted' ? 'bg-green-500 text-white' :
                    quotation.status === 'rejected' ? 'bg-red-500 text-white' :
                    quotation.status === 'sent' ? 'bg-blue-500 text-white' :
                    'bg-white/20 text-white/70'}`}>
                  {statusLabel}
                </span>
              </p>
            </div>
          </div>

          {/* Client Info */}
          <div className="px-10 py-6 border-b border-black/[0.07]">
            <p className="text-xs font-bold text-black/30 mb-3 uppercase tracking-wider">مُقدَّم إلى</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-black text-black text-lg">{client?.fullName || client?.username || "—"}</p>
                {client?.email && <p className="text-sm text-black/40 mt-0.5">{client.email}</p>}
                {client?.phone && <p className="text-sm text-black/40">{client.phone}</p>}
                {client?.country && <p className="text-sm text-black/40">{client.country}</p>}
              </div>
              {quotation.title && (
                <div>
                  <p className="text-xs font-bold text-black/30 mb-1">الموضوع</p>
                  <p className="font-bold text-black">{quotation.title}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          {quotation.items?.length > 0 && (
            <div className="px-10 py-6 border-b border-black/[0.07]">
              <p className="text-xs font-bold text-black/30 mb-4 uppercase tracking-wider">تفاصيل البنود</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-black/[0.08]">
                    <th className="text-right pb-2 text-black/40 font-bold text-xs">البند</th>
                    <th className="text-center pb-2 text-black/40 font-bold text-xs w-20">الكمية</th>
                    <th className="text-center pb-2 text-black/40 font-bold text-xs w-28">سعر الوحدة</th>
                    <th className="text-left pb-2 text-black/40 font-bold text-xs w-28">المجموع</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item: any, i: number) => (
                    <tr key={i} className="border-b border-black/[0.04]">
                      <td className="py-3 text-black/80 font-medium">
                        {item.name}
                        {item.description && <span className="block text-xs text-black/35 mt-0.5">{item.description}</span>}
                      </td>
                      <td className="py-3 text-center text-black/50">{item.qty}</td>
                      <td className="py-3 text-center text-black/50 font-mono">{item.unitPrice?.toLocaleString()}</td>
                      <td className="py-3 text-left font-bold text-black/70 font-mono">{item.total?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="mt-4 flex justify-end">
                <div className="w-60 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-black/40">المجموع الفرعي</span>
                    <span className="font-bold text-black/70 font-mono">{quotation.amount?.toLocaleString()}</span>
                  </div>
                  {quotation.vatRate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-black/40">ضريبة القيمة المضافة ({quotation.vatRate}%)</span>
                      <span className="font-bold text-black/70 font-mono">{quotation.vatAmount?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base border-t-2 border-black/[0.10] pt-2">
                    <span className="font-black text-black">الإجمالي</span>
                    <span className="font-black text-black font-mono">{quotation.totalAmount?.toLocaleString()} ر.س</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes / Terms */}
          {(quotation.notes || quotation.termsAndConditions) && (
            <div className="px-10 py-6 border-b border-black/[0.07] grid grid-cols-2 gap-6">
              {quotation.notes && (
                <div>
                  <p className="text-xs font-bold text-black/30 mb-2 uppercase tracking-wider">ملاحظات</p>
                  <p className="text-sm text-black/60 leading-relaxed">{quotation.notes}</p>
                </div>
              )}
              {quotation.termsAndConditions && (
                <div>
                  <p className="text-xs font-bold text-black/30 mb-2 uppercase tracking-wider">الشروط والأحكام</p>
                  <p className="text-sm text-black/60 leading-relaxed">{quotation.termsAndConditions}</p>
                </div>
              )}
            </div>
          )}

          {/* Bank Info */}
          <div className="px-10 py-6 border-b border-black/[0.07]">
            <p className="text-xs font-bold text-black/30 mb-3 uppercase tracking-wider">معلومات التحويل البنكي</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-black/30">البنك</p>
                <p className="font-bold text-black text-sm">{bank.bankName}</p>
              </div>
              <div>
                <p className="text-xs text-black/30">اسم المستفيد</p>
                <p className="font-bold text-black text-sm">{bank.beneficiaryName}</p>
              </div>
              <div>
                <p className="text-xs text-black/30">رقم الآيبان (IBAN)</p>
                <p className="font-bold text-black text-sm font-mono" dir="ltr">{bank.iban}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-10 py-5 bg-black/[0.02] flex items-center justify-between">
            <p className="text-xs text-black/30">شكراً لتعاملكم مع QIROX Studio</p>
            <p className="text-xs text-black/20 font-mono">{quotation.quotationNumber}</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
