import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Loader2, Printer, ArrowRight, Download, Mail, RefreshCw, Building2, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
const qiroxLogoPath = "/qirox-logo-full.svg";
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
  const [showBankInfo, setShowBankInfo] = useState(true);
  const printCardRef = useRef<HTMLDivElement>(null);

  const { data: bankSettings } = useQuery<{ bankName: string; beneficiaryName: string; iban: string; accountNumber?: string }>({
    queryKey: ["/api/bank-settings"],
  });
  const bank = bankSettings || { bankName: "—", beneficiaryName: "—", iban: "—", accountNumber: "" };

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
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      /* Load local Arabic font and convert to base64 for embedding */
      let arabicFontDataUrl = "";
      try {
        const fontResp = await fetch("/fonts/arabic.ttf");
        const fontBuf  = await fontResp.arrayBuffer();
        const bytes    = new Uint8Array(fontBuf);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        const base64   = btoa(binary);
        arabicFontDataUrl = `data:font/truetype;base64,${base64}`;
      } catch {
        /* Non-fatal — fall back to system fonts */
      }

      /* Wait for browser fonts to settle */
      await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 150));

      /* Capture at a fixed 800 px viewport so layout is always consistent */
      const canvas = await html2canvas(printCardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 1200,
        onclone: (doc: Document, el: HTMLElement) => {
          /* Inject local Arabic font + Cairo fallback */
          const style = doc.createElement("style");
          style.textContent = `
            ${arabicFontDataUrl ? `
            @font-face {
              font-family: 'ArabicPDF';
              src: url('${arabicFontDataUrl}') format('truetype');
              font-weight: 400 900;
            }` : ""}
            *, *::before, *::after {
              font-family: 'ArabicPDF', 'Cairo', 'IBM Plex Sans Arabic',
                           'Segoe UI', Tahoma, Arial, sans-serif !important;
            }
          `;
          doc.head.appendChild(style);

          el.style.maxWidth     = "800px";
          el.style.width        = "800px";
          el.style.borderRadius = "0";
          el.style.boxShadow    = "none";
        },
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      /* Always fit the entire quotation onto ONE A4 page */
      const A4_W = 210; // mm
      const A4_H = 297; // mm
      const aspect = canvas.height / canvas.width;

      let w = A4_W;
      let h = w * aspect;
      if (h > A4_H) {          // content taller than A4 — scale down
        h = A4_H;
        w = h / aspect;
      }

      /* Center on the page */
      const x = (A4_W - w) / 2;
      const y = (A4_H - h) / 2;

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      pdf.addImage(imgData, "JPEG", x, y, w, h, "", "FAST");
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
              className="h-8 text-xs gap-1.5 border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-black/[0.04] dark:bg-white/[0.06]"
              onClick={() => convertMutation.mutate()}
              disabled={convertMutation.isPending}
              data-testid="button-convert-to-order"
            >
              {convertMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              تحويل لطلب
            </Button>
          )}
          {quotation.orderId && (
            <span className="text-xs text-black dark:text-white font-bold bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-2 py-1 rounded-lg">
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
            onClick={() => setShowBankInfo(v => !v)}
            variant="outline"
            size="sm"
            className={`h-8 text-xs gap-1.5 ${showBankInfo ? "border-black/10 dark:border-white/10 text-black dark:text-white bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.04] dark:bg-white/[0.06]" : "border-black/[0.12] text-black/50"}`}
            data-testid="button-toggle-bank-info-quotation"
            title={showBankInfo ? "إخفاء بيانات التحويل البنكي" : "إظهار بيانات التحويل البنكي"}
          >
            {showBankInfo ? <Building2 className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {showBankInfo ? "إخفاء التحويل" : "إظهار التحويل"}
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
              <img src={qiroxLogoPath} alt="QIROX" className="h-9 w-auto mb-3 opacity-90" />
              <p className="text-white/40 text-xs">qiroxstudio.online</p>
            </div>
            <div className="text-left">
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">عرض سعر</p>
              <p className="text-white font-black text-2xl font-mono tracking-tight">{quotation.quotationNumber}</p>
              <p className="text-white/50 text-xs mt-1">
                {new Date(quotation.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
              </p>
              {quotation.validUntil && (
                <p className="text-black/70 dark:text-white/70 text-xs mt-0.5">
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
                <span className="text-[10px] bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded mt-1 inline-block">
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

          {/* Bank Transfer Info — toggleable */}
          {showBankInfo && (
            <div className="px-10 py-5 border-t border-black/[0.06]">
              <div className="border border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl px-4 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-3.5 h-3.5 text-black dark:text-white" />
                  <p className="text-xs font-bold text-black/40">معلومات الدفع والتحويل البنكي</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-black/30">طريقة الدفع</p>
                    <p className="font-bold text-black/70">تحويل بنكي</p>
                  </div>
                  <div>
                    <p className="text-black/30">البنك</p>
                    <p className="font-bold text-black/70">{bank.bankName}</p>
                  </div>
                  <div>
                    <p className="text-black/30">رقم الآيبان (IBAN)</p>
                    <p className="font-bold text-black/70 font-mono" dir="ltr">{bank.iban}</p>
                  </div>
                  <div>
                    <p className="text-black/30">اسم المستفيد</p>
                    <p className="font-bold text-black/70">{bank.beneficiaryName}</p>
                  </div>
                  {bank.accountNumber && (
                    <div>
                      <p className="text-black/30">رقم الحساب</p>
                      <p className="font-bold text-black/70 font-mono" dir="ltr">{bank.accountNumber}</p>
                    </div>
                  )}
                </div>
              </div>
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
