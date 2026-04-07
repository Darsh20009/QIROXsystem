import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Loader2, Printer, ArrowRight, Download, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import qiroxLogoPath from "@assets/QIROX_LOGO_1771674917456.png";
import { useI18n } from "@/lib/i18n";

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  draft:    { label: "مسودة",              bg: "#f3f4f6", text: "#6b7280" },
  sent:     { label: "مُرسل",              bg: "#eff6ff", text: "#1d4ed8" },
  accepted: { label: "مقبول",              bg: "#f0fdf4", text: "#15803d" },
  rejected: { label: "مرفوض",              bg: "#fef2f2", text: "#b91c1c" },
  expired:  { label: "منتهي الصلاحية",     bg: "#fff7ed", text: "#c2410c" },
};

export default function QuotationPrint() {
  const { dir } = useI18n();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [pdfLoading, setPdfLoading] = useState(false);
  const printCardRef = useRef<HTMLDivElement>(null);

  const { data: me } = useQuery<{ role: string }>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const r = await fetch("/api/user", { credentials: "include" });
      if (!r.ok) return { role: "client" };
      return r.json();
    },
  });
  const isAdmin = me?.role && me.role !== "client";

  const { data: quotation, isLoading } = useQuery({
    queryKey: ["/api/quotations", params.id],
    queryFn: async () => {
      const r = await fetch(`/api/quotations/${params.id}`, { credentials: "include" });
      if (!r.ok) throw new Error("not found");
      return r.json();
    },
    enabled: !!params.id,
  });

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", `/api/quotations/${params.id}/send-email`, {});
      return r.json();
    },
    onSuccess: (data) => {
      toast({ title: data?.message || "تم إرسال العرض بالبريد ✅" });
      qc.invalidateQueries({ queryKey: ["/api/quotations", params.id] });
    },
    onError: () => toast({ title: "فشل إرسال البريد", variant: "destructive" }),
  });

  const convertMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", `/api/quotations/${params.id}/convert-to-order`, {});
      return r.json();
    },
    onSuccess: (data) => {
      toast({ title: data?.message || "تم تحويل العرض إلى طلب ✅" });
      qc.invalidateQueries({ queryKey: ["/api/quotations", params.id] });
    },
    onError: (err: any) => toast({ title: err?.message || "فشل التحويل", variant: "destructive" }),
  });

  const handleDownloadPDF = async () => {
    if (!printCardRef.current) return;
    setPdfLoading(true);
    try {
      /* Dynamic imports — keep initial bundle small */
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      /* Capture the quotation card as a high-res image */
      const canvas = await html2canvas(printCardRef.current, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 5000,
      });

      const imgData   = canvas.toDataURL("image/jpeg", 0.97);
      const A4_W_MM   = 210;
      const A4_H_MM   = 297;
      const imgW_MM   = A4_W_MM;
      const imgH_MM   = (canvas.height / canvas.width) * imgW_MM;

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      /* If content is taller than one page, split across pages */
      let y = 0;
      while (y < imgH_MM) {
        if (y > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, -y, imgW_MM, imgH_MM, "", "FAST");
        y += A4_H_MM;
      }

      pdf.save(`quotation-${quotation?.quotationNumber || params.id}.pdf`);
    } catch (err) {
      console.error("[PDF]", err);
      toast({ title: "فشل تحميل PDF", variant: "destructive" });
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Loader2 className="w-6 h-6 animate-spin text-black/30" />
    </div>
  );

  if (!quotation) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 text-black/40">
      عرض السعر غير موجود
    </div>
  );

  const client = typeof quotation.userId === "object" ? quotation.userId : null;
  const clientName = quotation.externalName || client?.fullName || client?.username || "—";
  const clientEmail = quotation.externalEmail || client?.email || "";
  const clientPhone = client?.phone || "";
  const clientCountry = client?.country || "";
  const clientCompany = quotation.externalCompany || "";

  const st = STATUS_LABELS[quotation.status] || { label: quotation.status, bg: "#f3f4f6", text: "#6b7280" };
  const isExternal = !!quotation.externalEmail && !client;
  const canConvert = isAdmin && quotation.status === "accepted" && client && !quotation.orderId;

  return (
    <>
      <style>{`
        @page { margin: 12mm; size: A4; }
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
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-black/[0.12]"
              onClick={() => sendEmailMutation.mutate()}
              disabled={sendEmailMutation.isPending}
              data-testid="button-email-quotation"
            >
              {sendEmailMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
              إرسال للعميل
            </Button>
          )}
          {canConvert && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-green-200 text-green-700 hover:bg-green-50"
              onClick={() => convertMutation.mutate()}
              disabled={convertMutation.isPending}
              data-testid="button-convert-to-order"
            >
              {convertMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              تحويل لطلب
            </Button>
          )}
          {quotation.orderId && (
            <span className="text-xs text-green-600 font-bold bg-green-50 border border-green-100 px-2 py-1 rounded-lg">
              ✓ تم التحويل لطلب
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 border-black/[0.12]"
            onClick={handlePrint}
            data-testid="button-print-browser"
          >
            <Printer className="w-3 h-3" />
            طباعة
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            size="sm"
            className="bg-black text-white h-8 gap-1.5 text-xs"
            data-testid="button-download-pdf"
          >
            {pdfLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            تحميل PDF
          </Button>
        </div>
      </div>

      {/* Document Area */}
      <div className="min-h-screen bg-gray-50 py-8 px-4 no-print-bg">
        <div
          ref={printCardRef}
          className="print-card bg-white w-full max-w-[800px] mx-auto shadow-lg rounded-2xl overflow-hidden"
          style={{ fontFamily: "'Cairo', 'Segoe UI', Arial, sans-serif" }}
          dir={dir}
        >
          {/* Header */}
          <div className="bg-black px-10 py-8 flex items-start justify-between">
            <div>
              <img src={qiroxLogoPath} alt="QIROX" className="h-9 w-auto mb-3 invert opacity-90" />
              <p className="text-white/40 text-xs">qiroxstudio.online</p>
            </div>
            <div className="text-left">
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">عرض سعر</p>
              <p className="text-white font-black text-2xl font-mono tracking-tight">{quotation.quotationNumber}</p>
              <p className="text-white/50 text-xs mt-1">
                {new Date(quotation.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
              </p>
              {quotation.validUntil && (
                <p className="text-yellow-300 text-xs mt-0.5">
                  صالح حتى: {new Date(quotation.validUntil).toLocaleDateString("ar-SA")}
                </p>
              )}
              <span
                className="mt-2 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ backgroundColor: st.bg, color: st.text }}
              >
                {st.label}
              </span>
            </div>
          </div>

          {/* Client Info */}
          <div className="px-10 py-6 border-b border-black/[0.07] grid grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] font-bold text-black/30 mb-2 uppercase tracking-wider">مُقدَّم من</p>
              <p className="font-black text-black text-sm">QIROX Studio</p>
              <p className="text-xs text-black/40 mt-0.5">info@qiroxstudio.online</p>
              <p className="text-xs text-black/40">qiroxstudio.online</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-black/30 mb-2 uppercase tracking-wider">مُقدَّم إلى</p>
              <p className="font-black text-black text-sm">{clientName}</p>
              {clientCompany && <p className="text-xs text-black/60 font-medium mt-0.5">{clientCompany}</p>}
              {clientEmail && <p className="text-xs text-black/40 mt-0.5">{clientEmail}</p>}
              {clientPhone && <p className="text-xs text-black/40">{clientPhone}</p>}
              {clientCountry && <p className="text-xs text-black/40">{clientCountry}</p>}
              {isExternal && (
                <span className="text-[10px] bg-orange-50 text-orange-500 border border-orange-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                  عميل خارجي
                </span>
              )}
            </div>
          </div>

          {/* Subject */}
          {quotation.title && (
            <div className="px-10 py-4 border-b border-black/[0.07] bg-black/[0.01]">
              <span className="text-[10px] font-bold text-black/30 uppercase tracking-wider ml-3">الموضوع</span>
              <span className="font-bold text-black text-sm">{quotation.title}</span>
            </div>
          )}

          {/* Items Table */}
          {quotation.items?.length > 0 && (
            <div className="px-10 py-6 border-b border-black/[0.07]">
              <p className="text-[10px] font-bold text-black/30 mb-4 uppercase tracking-wider">تفاصيل البنود</p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="text-right px-4 py-2.5 font-bold text-xs rounded-r-lg">البند</th>
                    <th className="text-center px-4 py-2.5 font-bold text-xs w-20">الكمية</th>
                    <th className="text-center px-4 py-2.5 font-bold text-xs w-28">سعر الوحدة</th>
                    <th className="text-left px-4 py-2.5 font-bold text-xs w-28 rounded-l-lg">المجموع</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-black/[0.02]"}>
                      <td className="px-4 py-3 text-black/80 font-medium">
                        {item.name}
                        {item.description && (
                          <span className="block text-xs text-black/35 mt-0.5">{item.description}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-black/50">{item.qty}</td>
                      <td className="px-4 py-3 text-center text-black/50 font-mono">
                        {item.unitPrice?.toLocaleString("ar-SA")}
                      </td>
                      <td className="px-4 py-3 text-left font-bold text-black/70 font-mono">
                        {item.total?.toLocaleString("ar-SA")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="mt-5 flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm text-black/50 pb-2 border-b border-black/[0.07]">
                    <span>المجموع الفرعي</span>
                    <span className="font-bold text-black/70 font-mono">
                      {quotation.amount?.toLocaleString("ar-SA")} ر.س
                    </span>
                  </div>
                  {quotation.vatRate > 0 && (
                    <div className="flex justify-between text-sm text-black/50">
                      <span>ضريبة القيمة المضافة ({quotation.vatRate}%)</span>
                      <span className="font-bold text-black/70 font-mono">
                        {quotation.vatAmount?.toLocaleString("ar-SA")} ر.س
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base bg-black text-white px-4 py-3 rounded-xl font-black mt-2">
                    <span>الإجمالي</span>
                    <span className="font-mono">{quotation.totalAmount?.toLocaleString("ar-SA")} ر.س</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes / Terms */}
          {(quotation.notes || quotation.termsAndConditions) && (
            <div className="px-10 py-6 border-b border-black/[0.07] grid grid-cols-2 gap-6">
              {quotation.notes && (
                <div className="bg-black/[0.02] rounded-xl p-4">
                  <p className="text-[10px] font-bold text-black/30 mb-2 uppercase tracking-wider">ملاحظات</p>
                  <p className="text-sm text-black/60 leading-relaxed">{quotation.notes}</p>
                </div>
              )}
              {quotation.termsAndConditions && (
                <div className="bg-black/[0.02] rounded-xl p-4">
                  <p className="text-[10px] font-bold text-black/30 mb-2 uppercase tracking-wider">الشروط والأحكام</p>
                  <p className="text-sm text-black/60 leading-relaxed">{quotation.termsAndConditions}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-10 py-5 bg-black/[0.02] border-t border-black/[0.06] flex items-center justify-between">
            <p className="text-xs text-black/30">شكراً لتعاملكم مع QIROX Studio</p>
            <p className="text-xs text-black/20 font-mono" dir="ltr">{quotation.quotationNumber}</p>
          </div>
        </div>
      </div>
    </>
  );
}
