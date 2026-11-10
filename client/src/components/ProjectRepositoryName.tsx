import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

export function ProjectRepositoryName({ orderId }: { orderId: string }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { toast } = useToast();
  const queryKey = ["/api/admin/orders", orderId, "github"];
  const { data, isLoading, error } = useQuery<any>({ queryKey, enabled: !!orderId });
  const [name, setName] = useState("");
  useEffect(() => { setName(data?.repository?.requestedName || ""); }, [orderId, data?.repository?.requestedName]);
  const save = useMutation({
    mutationFn: async () => (await apiRequest("PATCH", `/api/admin/orders/${orderId}/github/settings`, {
      repositoryName: name,
    })).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: ar ? "تم حفظ اسم المستودع للإنشاء القادم" : "Repository name saved for creation" });
    },
    onError: (error: any) => toast({ title: ar ? "تعذر حفظ اسم المستودع" : "Could not save repository name", description: error.message, variant: "destructive" }),
  });
  if (data?.repository?.url || data?.repository?.name) return null;
  return <div className="space-y-2 rounded-xl border border-black/10 p-3">
    <label htmlFor={`repo-name-${orderId}`} className="text-xs font-semibold">{ar ? "اسم مستودع GitHub المخصص (اختياري)" : "Custom GitHub repository name (optional)"}</label>
    <div className="flex gap-2">
      <Input id={`repo-name-${orderId}`} data-testid="input-custom-repository-name" dir="ltr" maxLength={100}
        value={name} onChange={event => setName(event.target.value)} placeholder="my-cafe-system" disabled={isLoading || save.isPending} />
      <Button type="button" variant="outline" disabled={isLoading || !!error || save.isPending || name === (data?.repository?.requestedName || "")}
        onClick={() => save.mutate()} data-testid="button-save-custom-repository-name">{save.isPending ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "حفظ الاسم" : "Save name")}</Button>
    </div>
    <p className="text-[11px] text-muted-foreground">{ar ? "احفظ الاسم قبل اعتماد الطلب أو تجهيز المستودع. سيُستخدم كما كتبته دون إضافة رقم المشروع. اتركه فارغاً للاسم التلقائي." : "Save before approval or provisioning. Used exactly as entered, without a project suffix. Leave blank for an automatic name."}</p>
    {!!error && <p className="text-xs text-red-600">{ar ? "تعذر تحميل حالة المستودع. حدّث الصفحة قبل الحفظ." : "Unable to load repository status. Refresh before saving."}</p>}
  </div>;
}