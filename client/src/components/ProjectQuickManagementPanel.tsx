import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink, Loader2, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type QuickManagement = {
  projectId: string;
  productionUrl: string;
  subscription: { status: string; period: string; expiresAt: string | null; expired: boolean } | null;
  site: { manualSuspended: boolean; autoSuspendOnExpiry: boolean; suspensionMessage: string; suspended: boolean; updatedAt: string | null };
};

export function ProjectQuickManagementPanel({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const queryKey = ["/api/admin/projects", projectId, "quick-management"];
  const { data, isLoading, isError } = useQuery<QuickManagement>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(`/api/admin/projects/${projectId}/quick-management`, { credentials: "include" });
      if (!response.ok) throw new Error("تعذر تحميل إعدادات الموقع");
      return response.json();
    },
  });
  const [message, setMessage] = useState("");
  const [manualSuspended, setManualSuspended] = useState(false);
  const [autoSuspendOnExpiry, setAutoSuspendOnExpiry] = useState(true);

  useEffect(() => {
    if (!data) return;
    setMessage(data.site.suspensionMessage);
    setManualSuspended(data.site.manualSuspended);
    setAutoSuspendOnExpiry(data.site.autoSuspendOnExpiry);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => (await apiRequest("PATCH", `/api/admin/projects/${projectId}/quick-management`, {
      manualSuspended,
      autoSuspendOnExpiry,
      suspensionMessage: message,
    })).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "تم حفظ إعدادات الإدارة السريعة" });
    },
    onError: (error: any) => toast({ title: error?.message || "تعذر حفظ الإعدادات", variant: "destructive" }),
  });

  if (isLoading) return <div className="flex items-center justify-center p-12"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (isError || !data) return <div className="p-6 text-sm text-red-700">تعذر تحميل إعدادات الإدارة السريعة.</div>;

  return (
    <div className="max-w-3xl space-y-5 p-4 sm:p-6">
      <div>
        <h2 className="text-lg font-black">الإدارة السريعة للموقع</h2>
        <p className="mt-1 text-xs text-black/50">اربط إتاحة الموقع باشتراك المشروع، أو أوقفه يدويًا برسالة مخصصة.</p>
      </div>

      <div className={`rounded-2xl border p-4 flex items-start gap-3 ${data.site.suspended ? "border-amber-300 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
        {data.site.suspended ? <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" /> : <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" />}
        <div>
          <p className="text-sm font-bold">{data.site.suspended ? "الموقع محدد كمتوقف" : "الموقع غير موقوف"}</p>
          <p className="mt-1 text-xs text-black/55">
            {data.subscription
              ? data.subscription.expired ? "انتهى اشتراك المشروع." : `الاشتراك: ${data.subscription.period}${data.subscription.expiresAt ? ` — ينتهي ${new Date(data.subscription.expiresAt).toLocaleDateString("ar")}` : ""}`
              : "لا يوجد اشتراك مرتبط بالمشروع."}
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-black/10 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="quick-site-manual" className="font-bold">إيقاف يدوي</Label>
            <p className="mt-1 text-xs text-black/50">يُفعّل حالة الإيقاف لهذا المشروع.</p>
          </div>
          <Switch id="quick-site-manual" checked={manualSuspended} onCheckedChange={setManualSuspended} />
        </div>
        <div className="flex items-center justify-between gap-4 border-t pt-4">
          <div>
            <Label htmlFor="quick-site-expiry" className="font-bold">إيقاف عند انتهاء الاشتراك</Label>
            <p className="mt-1 text-xs text-black/50">تُحسب الحالة من تاريخ نهاية الاشتراك الحالي.</p>
          </div>
          <Switch id="quick-site-expiry" checked={autoSuspendOnExpiry} onCheckedChange={setAutoSuspendOnExpiry} />
        </div>
        <div className="space-y-2 border-t pt-4">
          <Label htmlFor="quick-site-message" className="font-bold">رسالة الموقع أثناء الإيقاف</Label>
          <Textarea id="quick-site-message" value={message} onChange={event => setMessage(event.target.value)} maxLength={1000} rows={4} />
          <p className="text-[11px] text-black/45">{message.length}/1000 — يظهر رابط التواصل مع QIROX للزائر.</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          {data.productionUrl && <a href={data.productionUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline"><ExternalLink className="h-3.5 w-3.5" />فتح موقع العميل</a>}
          <Button onClick={() => save.mutate()} disabled={save.isPending || !message.trim()} className="gap-2">
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ الإعدادات
          </Button>
        </div>
      </div>
      <p className="text-[11px] text-black/45">
        حالة الموقع العامة متاحة عبر <code dir="ltr">/api/public/projects/{projectId}/site-status</code>. يجب أن يقرأها إصدار الموقع المُنشأ ليعرض شاشة الإيقاف؛ لا توقف هذه الإعدادات خادم استضافة خارجيًا بحد ذاتها.
      </p>
    </div>
  );
}
