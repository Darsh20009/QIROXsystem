import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Loader2, Printer, ArrowRight, Mail, Building2, EyeOff, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { printDocument } from "@/lib/print-document";
import { downloadAuthenticatedFile } from "@/lib/download-authenticated-file";
import {
  FinanceApproval,
  FinanceBankCard,
  FinanceDocumentFrame,
  FinanceItemsTable,
  FinanceNotesCard,
  FinanceProjectPanel,
  FinanceTotals,
} from "./FinanceDocumentTemplate";

const DEFAULT_BANK = { bankName: "—", beneficiaryName: "—", iban: "—", accountNumber: "", notes: "" };

export default function InvoicePrint() {
  const { dir } = useI18n();
  const params = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [showBankInfo, setShowBankInfo] = useState(true);
  const isClientView = location.startsWith("/client/");

  const handlePrint = async () => {
    try {
      await printDocument({ title: `فاتورة-${invoice?.invoiceNumber || "QIROX"}` });
    } catch {
      toast({ title: "تعذّرت تهيئة الفاتورة للطباعة", description: "أعد المحاولة بعد اكتمال تحميل الصفحة.", variant: "destructive" });
    }
  };

  const handleDownload = async () => {
    try {
      await downloadAuthenticatedFile(
        `/api/invoices/${params.id}/pdf`,
        `invoice-${invoice?.invoiceNumber || params.id}.pdf`,
      );
    } catch (error) {
      toast({
        title: "تعذّر تحميل ملف PDF",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["/api/invoices", params.id],
    queryFn: async () => {
      const r = await fetch(`/api/invoices/${params.id}`, { credentials: "include" });
      if (!r.ok) throw new Error("not found");
      return r.json();
    },
    enabled: !!params.id,
  });

  const { data: bankSettings } = useQuery<typeof DEFAULT_BANK>({
    queryKey: ["/api/bank-settings"],
  });
  const bank = bankSettings || DEFAULT_BANK;

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
  const invoiceSubtotal = Number(invoice.amount) || Math.max(0, Number(invoice.totalAmount || 0) - Number(invoice.vatAmount || 0));
  const invoiceDiscountPercent = Number(invoice.discountPercent) || 0;
  const invoiceDiscountAmount = Number(invoice.discountAmount) > 0
    ? Number(invoice.discountAmount)
    : Math.round(invoiceSubtotal * invoiceDiscountPercent) / 100;

  return (
    <>
      {/* Controls - hidden on print */}
      <div className="no-print bg-white border-b border-black/[0.07] px-3 sm:px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sticky top-0 z-10" dir={dir}>
        <button onClick={() => setLocation(isClientView ? "/client/invoices" : "/admin/invoices")} className="flex items-center gap-1.5 text-sm text-black/50 hover:text-black transition-colors">
          <ArrowRight className="w-4 h-4" />
          {isClientView ? "رجوع لفواتيري" : "رجوع للفواتير"}
        </button>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
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
          <Button
            onClick={() => setShowBankInfo(v => !v)}
            variant="outline"
            size="sm"
            className={`h-8 text-xs gap-1.5 ${showBankInfo ? "border-black/10 dark:border-white/10 text-black dark:text-white bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.04] dark:bg-white/[0.06]" : "border-black/[0.12] text-black/50"}`}
            data-testid="button-toggle-bank-info"
            title={showBankInfo ? "إخفاء بيانات التحويل البنكي" : "إظهار بيانات التحويل البنكي"}
          >
            {showBankInfo ? <Building2 className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {showBankInfo ? "إخفاء التحويل" : "إظهار التحويل"}
          </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 border-black/[0.12]"
            data-testid="button-print-invoice"
          >
            <Printer className="w-3 h-3" />
            طباعة
          </Button>
          <Button
            onClick={handleDownload}
            size="sm"
            className="bg-black text-white h-8 text-xs gap-1.5"
            data-testid="button-download-pdf-invoice"
          >
            <Download className="w-3 h-3" />
            حفظ PDF
          </Button>
        </div>
      </div>

      <FinanceDocumentFrame
        titleAr="فاتورة"
        titleEn="INVOICE"
        documentNumber={invoice.invoiceNumber}
        createdAt={invoice.createdAt}
        dates={[
          { labelAr: "تاريخ الاستحقاق", labelEn: "Due date", value: invoice.dueDate },
          { labelAr: "تاريخ السداد", labelEn: "Payment date", value: invoice.paidAt },
        ]}
        status={{
          label: statusLabel,
          color: statusColor,
          background: `${statusColor}22`,
        }}
        direction={dir}
        recipient={{
          label: dir === "rtl" ? "إلى" : "Bill to",
          name: client?.fullName || client?.username || invoice.externalName || "—",
          company: invoice.externalCompany || undefined,
          email: client?.email || invoice.externalEmail || undefined,
          phone: client?.phone || client?.whatsappNumber || undefined,
          country: client?.country || undefined,
        }}
        footerLink={{ href: "/terms", label: dir === "rtl" ? "الشروط والأحكام" : "Terms & Conditions" }}
        footerNote={dir === "rtl" ? "هذه الفاتورة صادرة إلكترونياً وصالحة بدون توقيع" : "This invoice is issued electronically and is valid without a signature."}
      >
        <FinanceProjectPanel
          label={dir === "rtl" ? "مرتبطة بالطلب" : "Linked order"}
          title={order ? order.projectType || order.sector || order.id : invoice.title}
          description={invoice.title && order ? invoice.title : undefined}
        />

        <FinanceItemsTable
          items={invoice.items || []}
          direction={dir}
          labels={{
            item: dir === "rtl" ? "البند" : "Item",
            quantity: dir === "rtl" ? "الكمية" : "Qty",
            unitPrice: dir === "rtl" ? "سعر الوحدة" : "Unit price",
            total: dir === "rtl" ? "الإجمالي" : "Total",
          }}
        />

        <FinanceTotals
          subtotal={invoiceSubtotal}
          discountAmount={invoiceDiscountAmount}
          discountPercent={invoiceDiscountPercent}
          vatRate={Number(invoice.vatRate) || 0}
          vatAmount={Number(invoice.vatAmount) || 0}
          totalAmount={Number(invoice.totalAmount) || 0}
          direction={dir}
          labels={{
            subtotal: dir === "rtl" ? "المجموع الفرعي" : "Subtotal",
            discount: dir === "rtl" ? "الخصم" : "Discount",
            vat: dir === "rtl" ? "ضريبة القيمة المضافة" : "VAT",
            total: dir === "rtl" ? "الإجمالي" : "Total",
            currency: dir === "rtl" ? "ريال سعودي" : "Saudi Riyal",
          }}
        />

        <div className="fd-info-columns">
          {showBankInfo && <FinanceBankCard bank={bank} title={dir === "rtl" ? "بيانات التحويل البنكي" : "Bank transfer details"} />}
          <FinanceNotesCard notes={invoice.notes} title={dir === "rtl" ? "ملاحظات" : "Notes"} />
        </div>

        <FinanceApproval />
      </FinanceDocumentFrame>
    </>
  );
}
