import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Loader2, Printer, ArrowRight, Mail, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { downloadAuthenticatedFile } from "@/lib/download-authenticated-file";
import { printDocument } from "@/lib/print-document";
import {
  FinanceApproval,
  FinanceBankCard,
  FinanceDetailGrid,
  FinanceDocumentFrame,
  FinanceNotesCard,
  FinanceProjectPanel,
  FinanceReceiptAmount,
} from "./FinanceDocumentTemplate";

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "تحويل بنكي", cash: "نقداً", stc_pay: "STC Pay",
  apple_pay: "Apple Pay", paypal: "PayPal", other: "أخرى",
};

const DEFAULT_BANK = { bankName: "—", beneficiaryName: "—", iban: "—", accountNumber: "" };

export default function ReceiptPrint() {
  const { dir } = useI18n();
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: receipt, isLoading } = useQuery({
    queryKey: ["/api/receipts", params.id],
    queryFn: async () => {
      const r = await fetch(`/api/receipts/${params.id}`, { credentials: "include" });
      if (!r.ok) throw new Error("not found");
      return r.json();
    },
    enabled: !!params.id,
  });

  const { data: bankSettings } = useQuery<typeof DEFAULT_BANK>({
    queryKey: ["/api/bank-settings"],
  });
  const bank = bankSettings || DEFAULT_BANK;

  const handlePrint = async () => {
    try {
      await printDocument({ title: `سند-قبض-${receipt?.receiptNumber || "QIROX"}` });
    } catch {
      toast({ title: "تعذّرت تهيئة السند للطباعة", description: "أعد المحاولة بعد اكتمال تحميل الصفحة.", variant: "destructive" });
    }
  };

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", `/api/receipts/${params.id}/send-email`, {});
      return r.json();
    },
    onSuccess: () => toast({ title: "تم إرسال السند بالبريد ✅" }),
    onError: () => toast({ title: "فشل إرسال البريد", variant: "destructive" }),
  });

  const handleDownload = async () => {
    try {
      await downloadAuthenticatedFile(
        `/api/receipts/${params.id}/pdf`,
        `receipt-${receipt?.receiptNumber || params.id}.pdf`,
      );
    } catch {
      toast({ title: "تعذّر تحميل ملف PDF", variant: "destructive" });
    }
  };

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
      {/* Controls */}
      <div className="no-print bg-black/[0.04] border-b border-black/[0.08] px-6 py-3 flex items-center justify-between" dir={dir}>
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
          <Button onClick={handlePrint} variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-black/[0.12]">
            <Printer className="w-3 h-3" />
            طباعة
          </Button>
          <Button onClick={handleDownload} size="sm" className="bg-black text-white h-8 text-xs gap-1.5">
            <Download className="w-3 h-3" />
            حفظ PDF
          </Button>
        </div>
      </div>

      <FinanceDocumentFrame
        titleAr="سند قبض"
        titleEn="RECEIPT VOUCHER"
        documentNumber={receipt.receiptNumber}
        createdAt={receipt.createdAt}
        direction={dir}
        recipient={{
          label: "استُلم من",
          name: client?.fullName || client?.username || "—",
          email: client?.email || undefined,
          phone: client?.phone || client?.whatsappNumber || undefined,
          country: client?.country || undefined,
        }}
        footerNote="هذا السند صادر إلكترونياً ويُعدّ مستنداً رسمياً لاستلام المبلغ المذكور"
      >
        <FinanceProjectPanel
          label="الغرض / الوصف"
          title={receipt.description}
          description={invoice?.invoiceNumber ? `مرتبط بالفاتورة ${invoice.invoiceNumber}` : undefined}
        />

        <FinanceReceiptAmount
          amount={Number(receipt.amount) || 0}
          amountInWords={receipt.amountInWords}
        />

        <FinanceDetailGrid
          details={[
            {
              label: "طريقة الدفع",
              value: METHOD_LABELS[receipt.paymentMethod] || receipt.paymentMethod || "—",
            },
            {
              label: "رقم مرجع الدفع",
              value: receipt.paymentRef ? <span dir="ltr">{receipt.paymentRef}</span> : undefined,
            },
            { label: "المستلِم", value: receipt.receivedBy || "QIROX Studio" },
            { label: "رقم السند", value: <span dir="ltr">{receipt.receiptNumber}</span> },
          ]}
        />

        {receipt.paymentMethod === "bank_transfer" && (
          <FinanceBankCard
            bank={bank}
            title="بيانات التحويل البنكي"
            method={METHOD_LABELS[receipt.paymentMethod]}
          />
        )}

        <FinanceNotesCard notes={receipt.notes} />
        <FinanceApproval
          receipt
          issuerName={receipt.receivedBy || "QIROX Studio"}
          payerName={client?.fullName || client?.username || "—"}
        />
      </FinanceDocumentFrame>
    </>
  );
}
