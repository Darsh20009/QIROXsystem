import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Loader2, Printer, ArrowRight, Download, Mail, RefreshCw, Building2, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { printDocument } from "@/lib/print-document";
import { downloadAuthenticatedFile } from "@/lib/download-authenticated-file";
import {
  FinanceApproval,
  FinanceBankCard,
  FinanceDocumentFrame,
  FinanceItemsTable,
  FinanceProjectPanel,
  FinanceTermsCard,
  FinanceTotals,
} from "./FinanceDocumentTemplate";

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
    } catch (error) {
      toast({
        title: "تعذّر تحميل ملف PDF",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
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
  return (
    <>
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

      <FinanceDocumentFrame
        titleAr="عرض سعر"
        titleEn="QUOTATION"
        documentNumber={quotation.quotationNumber}
        createdAt={quotation.createdAt}
        dates={[{ labelAr: "صالح حتى", labelEn: "Valid until", value: quotation.validUntil }]}
        status={{ label: st.label, color: st.text, background: st.bg }}
        direction={D ? "rtl" : "ltr"}
        recipient={{
          label: label("إلى", "Prepared for"),
          name: clientName,
          company: clientCompany || undefined,
          email: clientEmail || undefined,
          phone: clientPhone || undefined,
          country: clientCountry || undefined,
          note: isExternal ? label("عميل خارجي", "External client") : undefined,
        }}
        footerLink={{ href: "/terms", label: label("الشروط والأحكام", "Terms & Conditions") }}
        footerNote={label("شكراً لتعاملكم مع QIROX Studio", "Thank you for choosing QIROX Studio")}
      >
        <FinanceProjectPanel
          label={label("المشروع", "Project")}
          title={quotation.title}
          description={quotation.projectDescription || quotation.description}
        />

        <FinanceItemsTable
          items={quotation.items || []}
          direction={D ? "rtl" : "ltr"}
          labels={{
            item: label("البند", "Item"),
            quantity: label("الكمية", "Qty"),
            unitPrice: label("سعر الوحدة", "Unit price"),
            total: label("الإجمالي", "Total"),
          }}
        />

        {(quotation.items?.length > 0 || quotation.totalAmount != null) && (
          <FinanceTotals
            subtotal={quotationSubtotal}
            discountAmount={quotationDiscountAmount}
            discountPercent={quotationDiscountPercent}
            vatRate={Number(quotation.vatRate) || 0}
            vatAmount={Number(quotation.vatAmount) || 0}
            totalAmount={Number(quotation.totalAmount) || 0}
            direction={D ? "rtl" : "ltr"}
            labels={{
              subtotal: label("المجموع الفرعي", "Subtotal"),
              discount: label("الخصم", "Discount"),
              vat: label("ضريبة القيمة المضافة", "VAT"),
              total: label("الإجمالي", "Total"),
              currency: label("ريال سعودي", "Saudi Riyal"),
            }}
          />
        )}

        <div className="fd-info-columns">
          {showBankInfo && <FinanceBankCard bank={bank} title={label("بيانات التحويل البنكي", "Bank transfer details")} />}
          <FinanceTermsCard
            title={label("الشروط والأحكام", "Terms & conditions")}
            entries={[
              { label: label("ملاحظات", "Notes"), text: quotation.notes },
              { label: label("شروط الدفع", "Payment terms"), text: quotation.paymentTerms },
              { text: quotation.termsAndConditions },
            ]}
          />
        </div>

        <FinanceApproval />
      </FinanceDocumentFrame>
    </>
  );
}
