import { useQuery } from "@tanstack/react-query";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import ManualMarketingPanel from "@/components/ManualMarketingPanel";
import { useFlag } from "@/features/customer-journey/hooks/use-feature-flags";
import { MANUAL_MARKETING_SECTORS } from "@shared/manual-marketing";

type Campaign = {
  _id: string;
  normalizedPhone: string;
  businessName?: string;
  sector: string;
  status: "sending" | "sent" | "failed";
  sentAt?: string;
  createdAt: string;
  failureMessage?: string;
};

export default function EmployeeManualMarketing() {
  const enabled = useFlag("FEATURE_MANUAL_MARKETING");
  const campaigns = useQuery<Campaign[]>({
    queryKey: ["/api/whatsapp/crm/manual-marketing/campaigns"],
    enabled,
  });

  if (!enabled) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center text-muted-foreground">
        ميزة التسويق اليدوي متوقفة حاليًا.
      </div>
    );
  }

  return (
    <main className="relative mx-auto max-w-[1400px] space-y-5 p-4 md:p-6" dir="rtl">
      <PageGraphics variant="dashboard" />
      <ManualMarketingPanel />

      <section className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="text-lg font-semibold">سجل الإرسال</h2>
        {campaigns.isLoading && <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>}
        {campaigns.error && <p className="text-sm text-destructive">تعذر تحميل السجل.</p>}
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-muted/50 text-right">
              <tr>
                <th className="p-3">النشاط</th>
                <th className="p-3">الرقم</th>
                <th className="p-3">القطاع</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {(campaigns.data || []).map((item) => (
                <tr key={item._id} className="border-t">
                  <td className="p-3">{item.businessName || "—"}</td>
                  <td className="p-3" dir="ltr">{item.normalizedPhone}</td>
                  <td className="p-3">
                    {MANUAL_MARKETING_SECTORS.find((sector) => sector.key === item.sector)?.label || item.sector}
                  </td>
                  <td className="p-3">
                    {item.status === "sent" ? "أُرسل" : item.status === "sending" ? "قيد الإرسال" : item.failureMessage || "لم يُرسل"}
                  </td>
                  <td className="p-3">{new Date(item.sentAt || item.createdAt).toLocaleString("ar-SA")}</td>
                </tr>
              ))}
              {!campaigns.isLoading && !campaigns.data?.length && (
                <tr>
                  <td className="p-4 text-center text-muted-foreground" colSpan={5}>
                    لا توجد رسائل مسجلة بعد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
