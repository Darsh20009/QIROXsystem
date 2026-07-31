import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Loader2, Printer, ArrowRight, ShieldCheck, MapPin, Monitor, CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

const qiroxLogoPath = "/qirox-logo-nobg.png";

export default function ContractPrint() {
  const { dir } = useI18n();
  const params = useParams<{ id: string }>();

  const { data: contracts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/contracts"],
  });

  const contract = contracts.find((c: any) => (c.id || c._id) === params.id);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Loader2 className="w-6 h-6 animate-spin text-black/30" />
    </div>
  );

  if (!contract) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 flex-col gap-3">
      <FileText className="w-10 h-10 text-black/15" />
      <p className="text-black/40 text-sm">العقد غير موجود</p>
    </div>
  );

  const clientName = contract.client?.fullName || contract.client?.username || "—";
  const clientEmail = contract.client?.email || "";
  const orderTitle = contract.order?.serviceTitle || contract.order?.title || "";
  const isSigned = contract.status === "acknowledged";
  const isRejected = contract.status === "rejected";

  const statusMap: Record<string, { label: string; bg: string; text: string }> = {
    pending:      { label: "بانتظار التوقيع", bg: "#fff7ed", text: "#c2410c" },
    acknowledged: { label: "موقّع",           bg: "#f0fdf4", text: "#15803d" },
    rejected:     { label: "مرفوض",           bg: "#fef2f2", text: "#b91c1c" },
  };
  const st = statusMap[contract.status] || statusMap.pending;

  // Format contract terms: wrap each paragraph
  const paragraphs = (contract.terms || "").split(/\n+/).filter(Boolean);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
        @page { margin: 15mm; size: A4; }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-card {
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Controls – hidden on print */}
      <div className="no-print bg-white border-b border-black/[0.07] px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-sm text-black/50 hover:text-black transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          رجوع
        </button>
        <Button
          onClick={handlePrint}
          size="sm"
          className="bg-black text-white h-8 gap-1.5 text-xs"
          data-testid="button-print-contract"
        >
          <Printer className="w-3 h-3" />
          طباعة / تحميل PDF
        </Button>
      </div>

      {/* Document */}
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div
          className="print-card bg-white w-full max-w-[800px] mx-auto shadow-lg rounded-2xl overflow-hidden"
          style={{ fontFamily: "'Cairo', 'Segoe UI', Arial, sans-serif" }}
          dir="rtl"
        >
          {/* Header */}
          <div className="bg-black px-10 py-8 flex items-start justify-between">
            <div>
              <img src={qiroxLogoPath} alt="QIROX" className="h-9 w-auto mb-3 opacity-90" />
              <p className="text-white/40 text-xs">qiroxstudio.online</p>
            </div>
            <div className="text-left">
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">عقد إلكتروني</p>
              {contract.contractNumber && (
                <p className="text-white font-black text-2xl font-mono tracking-tight">#{contract.contractNumber}</p>
              )}
              <p className="text-white/50 text-xs mt-1">
                {new Date(contract.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
              </p>
              <span
                className="mt-2 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ backgroundColor: st.bg, color: st.text }}
              >
                {st.label}
              </span>
            </div>
          </div>

          {/* Parties */}
          <div className="px-10 py-6 border-b border-black/[0.07] grid grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] font-bold text-black/30 mb-2 uppercase tracking-wider">الطرف الأول — مزود الخدمة</p>
              <p className="font-black text-black text-sm">QIROX Studio</p>
              <p className="text-xs text-black/40 mt-0.5">info@qiroxstudio.online</p>
              <p className="text-xs text-black/40">qiroxstudio.online</p>
              <p className="text-xs text-black/30 mt-1">المملكة العربية السعودية</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-black/30 mb-2 uppercase tracking-wider">الطرف الثاني — العميل</p>
              <p className="font-black text-black text-sm">{clientName}</p>
              {clientEmail && <p className="text-xs text-black/40 mt-0.5">{clientEmail}</p>}
              {contract.client?.phone && <p className="text-xs text-black/40">{contract.client.phone}</p>}
            </div>
          </div>

          {/* Subject */}
          {orderTitle && (
            <div className="px-10 py-4 border-b border-black/[0.07] bg-black/[0.01] flex items-center gap-3">
              <span className="text-[10px] font-bold text-black/30 uppercase tracking-wider">موضوع العقد</span>
              <span className="font-bold text-black text-sm">{orderTitle}</span>
            </div>
          )}

          {/* Financial */}
          {contract.totalAmount > 0 && (
            <div className="px-10 py-5 border-b border-black/[0.07] flex items-center justify-between">
              <span className="text-sm font-bold text-black/50">القيمة الإجمالية للعقد</span>
              <span className="text-xl font-black text-black font-mono">
                {contract.totalAmount?.toLocaleString("ar-SA")} <span className="text-sm font-bold text-black/40">ر.س</span>
              </span>
            </div>
          )}

          {/* Contract Terms */}
          <div className="px-10 py-8 border-b border-black/[0.07]">
            <p className="text-[10px] font-bold text-black/30 mb-6 uppercase tracking-wider border-b border-black/[0.06] pb-3">
              بنود العقد والشروط والأحكام
            </p>
            <div className="space-y-4 text-sm text-black/75 leading-loose">
              {paragraphs.map((para, i) => {
                // Detect numbered/header lines
                const isHeader = /^[\d١٢٣٤٥٦٧٨٩]+[.)]\s/.test(para) || /^[-•]\s/.test(para);
                return (
                  <p
                    key={i}
                    className={`${isHeader ? "font-bold text-black/80" : ""}`}
                    style={{ textIndent: isHeader ? "0" : "0.5em" }}
                  >
                    {para}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          {contract.notes && (
            <div className="px-10 py-5 border-b border-black/[0.07]">
              <div className="bg-black/[0.02] rounded-xl p-4">
                <p className="text-[10px] font-bold text-black/30 mb-2 uppercase tracking-wider">ملاحظات</p>
                <p className="text-sm text-black/60 leading-relaxed">{contract.notes}</p>
              </div>
            </div>
          )}

          {/* Signature section */}
          <div className="px-10 py-8 border-b border-black/[0.07]">
            <p className="text-[10px] font-bold text-black/30 mb-6 uppercase tracking-wider border-b border-black/[0.06] pb-3">
              التوقيعات
            </p>
            <div className="grid grid-cols-2 gap-10 mt-4">
              {/* Provider signature */}
              <div>
                <p className="text-xs font-bold text-black/40 mb-4">توقيع الطرف الأول — مزود الخدمة</p>
                <div className="border-b border-black/20 pb-1 mb-2 min-h-[48px] flex items-end">
                  <span className="text-base font-bold text-black" style={{ fontFamily: "cursive" }}>QIROX Studio</span>
                </div>
                <p className="text-xs text-black/30">التوقيع المخوّل</p>
              </div>

              {/* Client signature */}
              <div>
                <p className="text-xs font-bold text-black/40 mb-4">توقيع الطرف الثاني — العميل</p>
                {isSigned ? (
                  <>
                    <div className="border border-black/10 rounded-lg bg-black/[0.01] p-2 mb-2 min-h-[48px] flex items-center justify-center">
                      {contract.signatureData ? (
                        <img src={contract.signatureData} alt="التوقيع" className="max-h-12 max-w-full" />
                      ) : contract.signatureText ? (
                        <span className="text-xl font-bold" style={{ fontFamily: "cursive" }}>{contract.signatureText}</span>
                      ) : (
                        <div className="flex items-center gap-1.5 text-black/40">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-700 font-bold">وقّع إلكترونياً</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {contract.acknowledgedAt && (
                        <p className="text-[10px] text-black/30">
                          تاريخ التوقيع: {new Date(contract.acknowledgedAt).toLocaleDateString("ar-SA")}
                        </p>
                      )}
                      {contract.signedOtpVerified && (
                        <p className="text-[10px] text-green-600 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> موثّق بـ OTP
                        </p>
                      )}
                    </div>
                  </>
                ) : isRejected ? (
                  <div className="border-b border-red-200 pb-1 mb-2 min-h-[48px] flex items-end">
                    <span className="text-xs text-red-500">مرفوض من العميل</span>
                  </div>
                ) : (
                  <div className="border-b border-dashed border-black/20 pb-1 mb-2 min-h-[48px]" />
                )}
                <p className="text-xs text-black/30">{clientName}</p>
              </div>
            </div>
          </div>

          {/* Verification info (only if signed + has metadata) */}
          {isSigned && (contract.signerIp || contract.signerUserAgent) && (
            <div className="px-10 py-4 bg-black/[0.01] border-b border-black/[0.06]">
              <p className="text-[10px] font-bold text-black/30 mb-2">معلومات التحقق الإلكتروني</p>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-black/40">
                {contract.signerIp && (
                  <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> IP: {contract.signerIp}</div>
                )}
                {contract.signerUserAgent && (
                  <div className="flex items-start gap-1"><Monitor className="w-3 h-3 flex-shrink-0 mt-0.5" /><span className="truncate">{contract.signerUserAgent.slice(0, 60)}…</span></div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-10 py-5 flex items-center justify-between text-xs text-black/30">
            <span>QIROX Studio — qiroxstudio.online</span>
            <span>© {new Date().getFullYear()}</span>
            <span>وثيقة إلكترونية رسمية</span>
          </div>
        </div>
      </div>
    </>
  );
}
