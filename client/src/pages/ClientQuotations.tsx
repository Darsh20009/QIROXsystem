import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SARIcon from "@/components/SARIcon";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Check, X, Printer } from "lucide-react";
import { useLocation } from "wouter";
import { PageGraphics } from "@/components/AnimatedPageGraphics";
import { useI18n } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  sent: { label: "بانتظار ردك", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white" },
  accepted: { label: "مقبول", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white" },
  rejected: { label: "مرفوض", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white" },
  expired: { label: "منتهي الصلاحية", color: "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white" },
};

export default function ClientQuotations() {
  const [, setLocation] = useLocation();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: quotations, isLoading } = useQuery<any[]>({ queryKey: ["/api/quotations"] });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const r = await apiRequest("POST", `/api/quotations/${id}/status`, { status });
      return r.json();
    },
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ["/api/quotations"] });
      toast({ title: status === "accepted" ? "تم قبول العرض ✅" : "تم رفض العرض" });
    },
    onError: () => toast({ title: "فشل العملية", variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-white" dir={dir}>
      <PageGraphics variant="minimal" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-black">{L ? "عروض الأسعار" : "Quotations"}</h1>
          <p className="text-black/40 text-sm mt-1">{L ? "العروض المُرسلة إليك من فريقنا" : "Quotations sent to you by our team"}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-black/30" /></div>
        ) : !quotations || quotations.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-black/15 mx-auto mb-3" />
            <p className="text-black/30 text-sm">{L ? "لا توجد عروض أسعار بعد" : "No quotations yet"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quotations.map(q => {
              const st = STATUS_LABELS[q.status];
              const canRespond = q.status === "sent";
              return (
                <div key={q.id} className="border border-black/[0.08] rounded-2xl p-5"
                  data-testid={`quotation-card-${q.id}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-black text-black font-mono">{q.quotationNumber}</span>
                        {st && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>}
                      </div>
                      {q.title && <p className="text-sm text-black/60 mt-1">{q.title}</p>}
                      <p className="text-xs text-black/30 mt-1">{new Date(q.createdAt).toLocaleDateString("ar-SA")}</p>
                    </div>
                    <div className="text-left">
                      <div className="text-xl font-black text-black flex items-center gap-1">
                        {q.totalAmount?.toLocaleString()} <SARIcon size={14} className="opacity-70" />
                      </div>
                      {q.vatRate > 0 && <div className="text-xs text-black/30">شامل ضريبة {q.vatRate}%</div>}
                      {q.validUntil && (
                        <div className="text-xs text-black/40 mt-1">
                          صالح حتى: {new Date(q.validUntil).toLocaleDateString("ar-SA")}
                        </div>
                      )}
                    </div>
                  </div>

                  {q.items?.length > 0 && (
                    <div className="border border-black/[0.06] rounded-xl overflow-hidden mb-4">
                      <table className="w-full text-xs">
                        <thead className="bg-black/[0.03]">
                          <tr>
                            <th className="text-right p-2 px-3 text-black/50 font-bold">{L ? "البند" : "Item"}</th>
                            <th className="text-center p-2 text-black/50 font-bold">{L ? "الكمية" : "Qty"}</th>
                            <th className="text-center p-2 text-black/50 font-bold">{L ? "السعر" : "Price"}</th>
                            <th className="text-left p-2 px-3 text-black/50 font-bold">{L ? "المجموع" : "Total"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {q.items.map((item: any, i: number) => (
                            <tr key={i} className="border-t border-black/[0.04]">
                              <td className="p-2 px-3 text-black/70 font-medium">
                                {item.name}
                                {item.description && <span className="block text-black/35">{item.description}</span>}
                              </td>
                              <td className="p-2 text-center text-black/50">{item.qty}</td>
                              <td className="p-2 text-center text-black/50">{item.unitPrice?.toLocaleString()}</td>
                              <td className="p-2 px-3 text-left font-bold text-black/70">{item.total?.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-black/[0.02] border-t border-black/[0.06]">
                          <tr>
                            <td colSpan={3} className="p-2 px-3 text-right text-black/40">{L ? "المجموع الفرعي" : "Subtotal"}</td>
                            <td className="p-2 px-3 text-left font-bold text-black/60">{q.amount?.toLocaleString()}</td>
                          </tr>
                          {q.vatRate > 0 && (
                            <tr>
                              <td colSpan={3} className="p-2 px-3 text-right text-black/40">{L ? `ضريبة ${q.vatRate}%` : `VAT ${q.vatRate}%`}</td>
                              <td className="p-2 px-3 text-left font-bold text-black/60">{q.vatAmount?.toLocaleString()}</td>
                            </tr>
                          )}
                          <tr>
                            <td colSpan={3} className="p-2 px-3 text-right text-black font-black">{L ? "الإجمالي" : "Total"}</td>
                            <td className="p-2 px-3 text-left font-black text-black flex items-center gap-1">
                              {q.totalAmount?.toLocaleString()} <SARIcon size={10} />
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {q.notes && (
                    <div className="bg-black/[0.02] border border-black/[0.06] rounded-xl px-4 py-3 mb-3 text-sm text-black/60">
                      <p className="text-xs font-bold text-black/30 mb-1">{L ? "ملاحظات" : "Notes"}</p>
                      {q.notes}
                    </div>
                  )}
                  {q.termsAndConditions && (
                    <div className="bg-black/[0.02] border border-black/[0.06] rounded-xl px-4 py-3 mb-3 text-sm text-black/60">
                      <p className="text-xs font-bold text-black/30 mb-1">{L ? "الشروط والأحكام" : "Terms & Conditions"}</p>
                      {q.termsAndConditions}
                    </div>
                  )}

                  <div className="flex items-center gap-2 justify-end flex-wrap">
                    <Button size="sm" variant="outline"
                      className="h-8 text-xs gap-1.5 border-black/[0.12]"
                      onClick={() => setLocation(`/client/quotation-print/${q.id}`)}
                      data-testid={`button-print-${q.id}`}>
                      <Printer className="w-3 h-3" /> {L ? "طباعة" : "Print"}
                    </Button>
                    {canRespond && (
                      <>
                        <Button size="sm"
                          className="h-8 text-xs gap-1.5 bg-black dark:bg-white hover:bg-black dark:bg-white text-white"
                          onClick={() => statusMutation.mutate({ id: q.id, status: "accepted" })}
                          disabled={statusMutation.isPending}
                          data-testid={`button-accept-${q.id}`}>
                          <Check className="w-3 h-3" /> {L ? "قبول العرض" : "Accept"}
                        </Button>
                        <Button size="sm" variant="outline"
                          className="h-8 text-xs gap-1.5 border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-black/[0.04] dark:bg-white/[0.06]"
                          onClick={() => statusMutation.mutate({ id: q.id, status: "rejected" })}
                          disabled={statusMutation.isPending}
                          data-testid={`button-reject-${q.id}`}>
                          <X className="w-3 h-3" /> {L ? "رفض" : "Reject"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
