import {
  FinanceApproval,
  FinanceBankCard,
  FinanceDocumentFrame,
  FinanceItemsTable,
  FinanceProjectPanel,
  FinanceTermsCard,
  FinanceTotals,
} from "./_shared/ReferenceTemplate";

const items = [
  { name: "نظام طبي متكامل", description: "منصة لإدارة المواعيد والملفات الطبية والتقارير.", qty: 1, unitPrice: 2400, total: 2400 },
  { name: "استضافة سحابية", description: "استضافة آمنة مع نسخ احتياطي ودعم فني.", qty: 1, unitPrice: 480, total: 480 },
  { name: "تكامل الذكاء الاصطناعي", description: "مساعد ذكي لتحليل البيانات وتسهيل سير العمل.", qty: 1, unitPrice: 1280, total: 1280 },
];

export function ReferenceMatch() {
  return (
    <FinanceDocumentFrame
      titleAr="عرض سعر"
      titleEn="QUOTATION"
      documentNumber="QT-2026-0048"
      createdAt="2026-09-09"
      dates={[{ labelAr: "صالح حتى", labelEn: "Valid until", value: "2026-09-19" }]}
      status={{ label: "مسودة", color: "#6b7280", background: "#f3f4f6" }}
      recipient={{
        label: "إلى",
        name: "مركز الرعاية الصحية",
        company: "شركة تجريبية",
        email: "client@example.com",
      }}
      direction="rtl"
      footerLink={{ href: "/terms", label: "الشروط والأحكام" }}
      footerNote="شكراً لتعاملكم مع QIROX Studio"
    >
      <FinanceProjectPanel
        label="المشروع"
        title="نظام طبي متكامل"
        description="منصة متكاملة لإدارة مواعيد المرضى والملفات والتقارير الطبية، مع ربط آمن وخيارات قابلة للتوسع."
      />
      <FinanceItemsTable
        items={items}
        direction="rtl"
        labels={{ item: "البند", quantity: "الكمية", unitPrice: "سعر الوحدة", total: "الإجمالي" }}
      />
      <FinanceTotals
        subtotal={4160}
        vatRate={15}
        vatAmount={624}
        totalAmount={4784}
        direction="rtl"
        labels={{
          subtotal: "المجموع الفرعي",
          discount: "الخصم",
          vat: "ضريبة القيمة المضافة",
          total: "الإجمالي",
          currency: "ريال سعودي",
        }}
      />
      <div className="fd-info-columns">
        <FinanceBankCard
          bank={{
            bankName: "مصرف الراجحي",
            beneficiaryName: "اسم المستفيد المسجل",
            iban: "SA•• •••• •••• •••• 4812",
          }}
        />
        <FinanceTermsCard
          entries={[
            { text: "يسري العرض حتى التاريخ الموضح أعلاه." },
            { text: "يشمل العرض الأعمال الموضحة في البنود فقط." },
            { text: "تبدأ مدة التنفيذ بعد اعتماد العرض." },
            { text: "جميع الحقوق محفوظة لدى QIROX Studio." },
          ]}
        />
      </div>
      <FinanceApproval />
    </FinanceDocumentFrame>
  );
}