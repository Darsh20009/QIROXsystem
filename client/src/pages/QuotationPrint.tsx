import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Loader2, Printer, ArrowRight, Download, Mail, RefreshCw, Building2, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
const qiroxLogoPath = "/qirox-logo-nobg.png";
import SARIcon from "@/components/SARIcon";
import { useI18n } from "@/lib/i18n";
import { printDocument } from "@/lib/print-document";
import { downloadAuthenticatedFile } from "@/lib/download-authenticated-file";

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  draft:    { label: "مسودة",              bg: "#f3f4f6", text: "#6b7280" },
  sent:     { label: "مُرسل",              bg: "#eff6ff", text: "#1d4ed8" },
  accepted: { label: "مقبول",              bg: "#f0fdf4", text: "#15803d" },
  rejected: { label: "مرفوض",              bg: "#fef2f2", text: "#b91c1c" },
  expired:  { label: "منتهي الصلاحية",     bg: "#fff7ed", text: "#c2410c" },
};

export default function QuotationPrint() {
  useI18n();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
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

  const handlePrint = async () => {
    try {
      await printDocument({ title: `عرض-سعر-${quotation?.quotationNumber || "QIROX"}` });
    } catch {
      toast({ title: "تعذّر تهيئة عرض السعر للطباعة", description: "أعد المحاولة بعد اكتمال تحميل الصفحة.", variant: "destructive" });
    }
  };

  const handleDownload = async () => {
    try {
      await downloadAuthenticatedFile(
        `/api/quotations/${params.id}/pdf`,
        `quotation-${quotation?.quotationNumber || params.id}.pdf`,
      );
    } catch {
      toast({ title: "تعذّر تحميل ملف PDF", variant: "destructive" });
    }
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
  const documentLanguage = quotation.language === "en" ? "en" : "ar";
  const D = documentLanguage === "ar";
  const label = (ar: string, en: string) => D ? ar : en;

  const st = STATUS_LABELS[quotation.status] || { label: quotation.status, bg: "#f3f4f6", text: "#6b7280" };
  const isExternal = !!quotation.externalEmail && !client;
  const canConvert = isAdmin && quotation.status === "accepted" && client && !quotation.orderId;
  const quotationSubtotal = Number(quotation.amount) || (quotation.items || []).reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0);
  const quotationDiscountPercent = Number(quotation.discountPercent) || 0;
  const quotationDiscountAmount = Number(quotation.discountAmount) > 0
    ? Number(quotation.discountAmount)
    : Math.round(quotationSubtotal * quotationDiscountPercent) / 100;
  const hasQuotationDiscount = quotationDiscountPercent > 0 || quotationDiscountAmount > 0;

  return (
    <>
      <style>{`
        @page { margin: 12mm; size: A4; }
        @media print {
          html, body, #root {
            background: white !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          body { margin: 0 !important; padding: 0 !important; }
          /* Hide ALL UI chrome */
          nav, aside, header, footer,
          [data-sidebar], [data-sidebar="sidebar"],
          #qirox-companion, #page-hint-card, #push-banner,
          [role="dialog"]:not(.print-keep),
          .no-print { display: none !important; }
          /* Force print content to full width */
          main, #main-content {
            display: block !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print-bg {
            display: block !important;
            background: white !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            padding: 0 !important;
          }
          .print-card {
            display: block !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .print-card, .print-card * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-items { overflow-x: visible !important; overflow-y: visible !important; }
          table { break-inside: auto !important; page-break-inside: auto !important; }
          th, td { min-width: 0 !important; overflow-wrap: anywhere !important; word-break: break-word !important; }
          thead { display: table-header-group !important; }
          tbody { display: table-row-group !important; }
          tr { break-inside: avoid !important; page-break-inside: avoid !important; }
          .print-avoid-break { break-inside: avoid !important; page-break-inside: avoid !important; }
          p, td, span {
            max-height: none !important;
            overflow: visible !important;
            text-overflow: clip !important;
          }
          h1, h2, h3 { page-break-after: avoid; }
        }
      `}</style>

      {/* Controls – hidden on print */}
      <div className="no-print bg-white border-b border-black/[0.07] px-3 sm:px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sticky top-0 z-10">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-sm text-black/50 hover:text-black transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          رجوع
        </button>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
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
            onClick={handleDownload}
            size="sm"
            className="bg-black text-white h-8 gap-1.5 text-xs"
            data-testid="button-download-pdf"
          >
            <Download className="w-3 h-3" />
            حفظ PDF
          </Button>
        </div>
      </div>

      {/* Document Area */}
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-2 sm:px-4 no-print-bg" data-print-document>
        <div
          ref={printCardRef}
          className="print-card bg-white w-full max-w-[800px] mx-auto shadow-lg rounded-2xl overflow-hidden"
          style={{ fontFamily: "'Cairo', 'Segoe UI', Arial, sans-serif" }}
            dir={D ? "rtl" : "ltr"}
        >
          {/* Header */}
          <div className="bg-black px-5 sm:px-10 py-6 sm:py-8 flex items-start justify-between">
            <div>
              <img src={qiroxLogoPath} alt="QIROX" className="h-9 w-auto mb-3 opacity-90" />
              <p className="text-white/40 text-xs">qiroxstudio.online</p>
            </div>
            <div className="text-left">
               <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">{label("عرض سعر", "QUOTATION")}</p>
              <p className="text-white font-black text-2xl font-mono tracking-tight">{quotation.quotationNumber}</p>
              <p className="text-white/50 text-xs mt-1">
                {new Date(quotation.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
              </p>
              {quotation.validUntil && (
                <p className="text-black/70 dark:text-white/70 text-xs mt-0.5">
                   {label("صالح حتى", "Valid until")}: {new Date(quotation.validUntil).toLocaleDateString(D ? "ar-SA" : "en-US")}
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
          <div className="px-5 sm:px-10 py-6 border-b border-black/[0.07] grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <div>
               <p className="text-[10px] font-bold text-black/30 mb-2 uppercase tracking-wider">{label("مُقدَّم من", "Prepared by")}</p>
              <p className="font-black text-black text-sm">QIROX Studio</p>
              <p className="text-xs text-black/40 mt-0.5">info@qiroxstudio.online</p>
              <p className="text-xs text-black/40">qiroxstudio.online</p>
            </div>
            <div>
               <p className="text-[10px] font-bold text-black/30 mb-2 uppercase tracking-wider">{label("مُقدَّم إلى", "Prepared for")}</p>
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
            <div className="px-5 sm:px-10 py-4 border-b border-black/[0.07] bg-black/[0.01]">
               <span className="text-[10px] font-bold text-black/30 uppercase tracking-wider ml-3">{label("الموضوع", "Subject")}</span>
              <span className="font-bold text-black text-sm">{quotation.title}</span>
            </div>
          )}

          {/* Items Table */}
          {quotation.items?.length > 0 && (
            <div className="print-items px-5 sm:px-10 py-6 border-b border-black/[0.07] overflow-x-visible">
               <p className="text-[10px] font-bold text-black/30 mb-4 uppercase tracking-wider">{label("تفاصيل البنود", "Line items")}</p>
              <table className="w-full table-fixed text-sm border-collapse">
                <thead>
                  <tr className="bg-black text-white">
                     <th className="text-start px-4 py-2.5 font-bold text-xs">{label("البند", "Item")}</th>
                     <th className="text-center px-4 py-2.5 font-bold text-xs w-20">{label("الكمية", "Qty")}</th>
                     <th className="text-center px-4 py-2.5 font-bold text-xs w-28">{label("سعر الوحدة", "Unit price")}</th>
                     <th className="text-end px-4 py-2.5 font-bold text-xs w-28">{label("المجموع", "Total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-black/[0.02]"}>
                      <td className="px-4 py-3 text-black/80 font-medium break-words [overflow-wrap:anywhere]">
                        {item.name}
                        {item.description && (
                          <span className="block text-xs text-black/35 mt-0.5 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{item.description}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-black/50">{item.qty}</td>
                      <td className="px-4 py-3 text-center text-black/50 font-mono">
                        <span className="inline-flex items-center justify-center gap-1" dir="ltr">
                          {item.unitPrice?.toLocaleString(D ? "ar-SA" : "en-US")}
                          <SARIcon size={11} className="opacity-70" />
                        </span>
                      </td>
                      <td className="px-4 py-3 text-left font-bold text-black/70 font-mono">
                        <span className="inline-flex items-center justify-end gap-1" dir="ltr">
                          {item.total?.toLocaleString(D ? "ar-SA" : "en-US")}
                          <SARIcon size={11} className="opacity-80" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="mt-5 flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm text-black/50 pb-2 border-b border-black/[0.07]">
                     <span>{label("المجموع الفرعي", "Subtotal")}</span>
                    <span className="font-bold text-black/70 font-mono">
                       <span className="inline-flex items-center gap-1" dir="ltr">
                         {quotationSubtotal.toLocaleString(D ? "ar-SA" : "en-US")}
                         <SARIcon size={12} className="opacity-80" />
                       </span>
                    </span>
                  </div>
                    {hasQuotationDiscount && (
                     <div className="flex justify-between text-sm text-emerald-700">
                        <span>{label("الخصم", "Discount")} ({quotationDiscountPercent}%)</span>
                        <span className="font-bold font-mono inline-flex items-center gap-1" dir="ltr">
                           - {quotationDiscountAmount.toLocaleString(D ? "ar-SA" : "en-US")}
                          <SARIcon size={12} className="opacity-80" />
                        </span>
                     </div>
                   )}
                  {quotation.vatRate > 0 && (
                    <div className="flex justify-between text-sm text-black/50">
                       <span>{label("ضريبة القيمة المضافة", "VAT")} ({quotation.vatRate}%)</span>
                      <span className="font-bold text-black/70 font-mono">
                        <span className="inline-flex items-center gap-1" dir="ltr">
                          {quotation.vatAmount?.toLocaleString(D ? "ar-SA" : "en-US")}
                          <SARIcon size={12} className="opacity-80" />
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base bg-black text-white px-4 py-3 rounded-xl font-black mt-2">
                     <span>{label("الإجمالي", "Total")}</span>
                    <span className="font-mono inline-flex items-center gap-1" dir="ltr">
                      {quotation.totalAmount?.toLocaleString(D ? "ar-SA" : "en-US")}
                      <SARIcon size={14} className="text-white" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes / Terms */}
           {(quotation.notes || quotation.paymentTerms || quotation.termsAndConditions) && (
            <div className="px-5 sm:px-10 py-6 border-b border-black/[0.07] grid grid-cols-1 sm:grid-cols-2 gap-6">
              {quotation.notes && (
                <div className="bg-black/[0.02] rounded-xl p-4">
                   <p className="text-[10px] font-bold text-black/30 mb-2 uppercase tracking-wider">{label("ملاحظات", "Notes")}</p>
                  <p className="text-sm text-black/60 leading-relaxed">{quotation.notes}</p>
                </div>
              )}
               {quotation.paymentTerms && (
                 <div className="bg-black/[0.02] rounded-xl p-4">
                   <p className="text-[10px] font-bold text-black/30 mb-2 uppercase tracking-wider">{label("شروط الدفع", "Payment terms")}</p>
                   <p className="text-sm text-black/60 leading-relaxed whitespace-pre-wrap">{quotation.paymentTerms}</p>
                 </div>
               )}
              {quotation.termsAndConditions && (
                <div className="bg-black/[0.02] rounded-xl p-4">
                   <p className="text-[10px] font-bold text-black/30 mb-2 uppercase tracking-wider">{label("الشروط والأحكام", "Terms & conditions")}</p>
                   <p className="text-sm text-black/60 leading-relaxed whitespace-pre-wrap">{quotation.termsAndConditions}</p>
                </div>
              )}
            </div>
          )}

          {/* Bank Transfer Info — toggleable */}
          {showBankInfo && (
            <div className="print-avoid-break px-5 sm:px-10 py-5 border-t border-black/[0.06]">
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
          <div className="px-5 sm:px-10 py-5 bg-black/[0.02] border-t border-black/[0.06] flex items-center justify-between">
            <div>
              <p className="text-xs text-black/30">شكراً لتعاملكم مع QIROX Studio</p>
              <a
                href="/terms"
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-1 text-xs text-black/45 underline underline-offset-2 hover:text-black/70"
              >
                {label("الشروط والأحكام", "Terms & Conditions")}
              </a>
            </div>
            <p className="text-xs text-black/20 font-mono" dir="ltr">{quotation.quotationNumber}</p>
          </div>
        </div>
      </div>
    </>
  );
}
