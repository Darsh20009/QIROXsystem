import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Settings, KeyRound, Copy, Globe, MessageSquare, Mail, Link2, RefreshCw } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type ProjectIntegrationType = "whatsapp" | "email" | "api";

type ProjectIntegrationSecretDetails = {
  type: ProjectIntegrationType;
  environment: string;
};

export function ProjectIntegrationsPanel({
  orderId,
  mode = "manage",
  onSecretCreated,
}: {
  orderId?: string;
  mode?: "manage" | "readonly";
  onSecretCreated?: (details: ProjectIntegrationSecretDetails) => void;
}) {
  const { dir } = useI18n();
  const { toast } = useToast();
  const canManage = mode === "manage";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ProjectIntegrationType>("whatsapp");
  const [environment, setEnvironment] = useState("development");
  const [label, setLabel] = useState("");
  const [rateLimit, setRateLimit] = useState("30");
  const [newSecret, setNewSecret] = useState<string | null>(null);

  const endpoint = canManage
    ? `/api/admin/orders/${orderId}/integrations`
    : `/api/orders/${orderId}/integrations`;
  const { data: integrations = [], isLoading } = useQuery<any[]>({
    queryKey: [endpoint],
    enabled: !!orderId,
    queryFn: async () => {
      const response = await fetch(endpoint, { credentials: "include" });
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => (await apiRequest("POST", endpoint, {
      type: selectedType,
      environment,
      label: label.trim() || undefined,
      rateLimitPerMinute: Number(rateLimit) || 30,
    })).json(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      setNewSecret(data.secret);
      onSecretCreated?.({
        type: selectedType,
        environment: data.integration?.environment || environment,
      });
      toast({ title: "تم إنشاء التكامل. احفظ المفتاح الآن" });
    },
    onError: () => toast({ title: "تعذر إنشاء التكامل", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => (await apiRequest("PATCH", `/api/admin/project-integrations/${id}`, { status })).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      toast({ title: "تم تحديث حالة التكامل" });
    },
    onError: () => toast({ title: "تعذر تحديث التكامل", variant: "destructive" }),
  });

  const rotateMutation = useMutation({
    mutationFn: async (id: string) => (await apiRequest("POST", `/api/admin/project-integrations/${id}/rotate`, {})).json(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      setNewSecret(data.secret);
      onSecretCreated?.({
        type: selectedType,
        environment: data.integration?.environment || environment,
      });
      toast({ title: "تم تدوير المفتاح. احفظ المفتاح الجديد الآن" });
    },
    onError: () => toast({ title: "تعذر تدوير المفتاح", variant: "destructive" }),
  });

  const integrationByType = (type: ProjectIntegrationType) => integrations.find((item: any) => item.type === type && item.status !== "disabled") || integrations.find((item: any) => item.type === type);
  const integrationTitle = (type: ProjectIntegrationType) => (
    type === "whatsapp" ? "WhatsApp Business" : type === "email" ? "البريد الإلكتروني" : "API الربط العام"
  );
  const openSetup = (type: ProjectIntegrationType) => {
    const existing = integrationByType(type);
    setSelectedType(type);
    setEnvironment(existing?.environment || "development");
    setLabel(existing?.label || "");
    setRateLimit(String(existing?.rateLimitPerMinute || 30));
    setNewSecret(null);
    setDialogOpen(true);
  };

  const statusLabel = (status?: string) => status === "active" ? "مفعّل" : status === "disabled" ? "معطّل" : status === "expired" ? "منتهي" : "غير مهيأ";
  const cards = [
    { type: "whatsapp" as const, title: "WhatsApp Business", description: "إرسال رسمي عبر Meta، منفصل عن جلسة CRM الداخلية", icon: MessageSquare },
    { type: "email" as const, title: "البريد الإلكتروني", description: "إرسال بريد المشروع عبر مزود SMTP المهيأ", icon: Mail },
    { type: "api" as const, title: "API الربط العام", description: "نقطة موحّدة للتكاملات الخارجية عبر البريد أو WhatsApp", icon: Link2 },
  ];

  if (!orderId) return null;
  return (
    <div className="border border-black/[0.07] dark:border-white/[0.08] rounded-2xl p-5 bg-white dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest flex items-center gap-2">
            <KeyRound className="w-3.5 h-3.5" /> تكاملات المشروع
          </p>
          <p className="text-[11px] text-black/40 dark:text-white/40 mt-1">روابط API قابلة للمشاركة، بدون عرض أسرار مزود الخدمة</p>
        </div>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-black/30 dark:text-white/30" />}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {cards.map(({ type, title, description, icon: Icon }) => {
          const integration = integrationByType(type);
          return (
            <div key={type} className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-black dark:text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-black dark:text-white">{title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${integration?.status === "active" ? "bg-black/[0.06] dark:bg-white/[0.1] text-black dark:text-white" : "bg-black/[0.04] dark:bg-white/[0.06] text-black/45 dark:text-white/45"}`}>
                      {statusLabel(integration?.status)}
                    </span>
                  </div>
                  <p className="text-[10px] text-black/40 dark:text-white/40 mt-1 leading-relaxed">{description}</p>
                </div>
              </div>
              {integration && (
                <div className="mt-3 space-y-1.5 text-[10px]">
                  <div className="flex items-center gap-2"><Globe className="w-3 h-3 text-black/30 dark:text-white/30" /><a className="truncate text-black/65 dark:text-white/65 hover:underline" href={integration.apiBaseUrl} target="_blank" rel="noopener noreferrer">{integration.apiBaseUrl}</a></div>
                  <div className="flex items-center gap-2"><KeyRound className="w-3 h-3 text-black/30 dark:text-white/30" /><span className="font-mono text-black/50 dark:text-white/50">{integration.keyPrefix}</span></div>
                  <div className="flex items-center justify-between text-black/35 dark:text-white/35"><span>البيئة: {integration.environment}</span><span>{integration.rateLimitPerMinute} طلب/دقيقة</span></div>
                </div>
              )}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-black/[0.05] dark:border-white/[0.06]">
                {canManage && !integration && <Button size="sm" variant="outline" className="h-8 text-[11px] rounded-lg" onClick={() => openSetup(type)}>إعداد التكامل</Button>}
                {canManage && integration && <Button size="sm" variant="outline" className="h-8 text-[11px] rounded-lg gap-1" onClick={() => openSetup(type)}><Settings className="w-3 h-3" /> إدارة</Button>}
                <a href={integration?.documentationUrl || "/api/v1/projects/integrations/docs"} target="_blank" rel="noopener noreferrer" className="text-[10px] text-black/45 dark:text-white/45 hover:underline mr-auto">التوثيق</a>
              </div>
            </div>
          );
        })}
      </div>

      {canManage && (
        <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) setNewSecret(null); }}>
          <DialogContent className="max-w-lg rounded-2xl" dir={dir}>
            <DialogHeader><DialogTitle className="text-right flex items-center gap-2 font-black"><KeyRound className="w-4 h-4" /> إعداد {integrationTitle(selectedType)}</DialogTitle></DialogHeader>
            {newSecret ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.05] p-4">
                  <p className="text-sm font-bold text-black dark:text-white">هذا المفتاح يظهر مرة واحدة فقط</p>
                  <p className="text-xs text-black/50 dark:text-white/50 mt-1">انسخه إلى Secrets في مشروعك. لن يمكن استعادته من QIROX بعد إغلاق هذه النافذة.</p>
                  <div className="mt-3 flex gap-2" dir="ltr">
                    <Input readOnly value={newSecret} className="font-mono text-xs" />
                    <Button type="button" variant="outline" onClick={() => { navigator.clipboard.writeText(newSecret); toast({ title: "تم نسخ المفتاح" }); }}><Copy className="w-4 h-4" /></Button>
                  </div>
                </div>
                <Button className="w-full rounded-xl" onClick={() => { setNewSecret(null); setDialogOpen(false); }}>تم الحفظ بأمان</Button>
              </div>
            ) : (() => {
              const integration = integrationByType(selectedType);
              return integration ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-black/[0.03] dark:bg-white/[0.05] p-3"><span className="text-black/40 dark:text-white/40 block mb-1">البيئة</span><b>{integration.environment}</b></div>
                    <div className="rounded-xl bg-black/[0.03] dark:bg-white/[0.05] p-3"><span className="text-black/40 dark:text-white/40 block mb-1">الحالة</span><b>{statusLabel(integration.status)}</b></div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <p className="text-black/50 dark:text-white/50">رابط API</p><p className="font-mono break-all" dir="ltr">{integration.apiBaseUrl}</p>
                    <p className="text-black/50 dark:text-white/50 pt-2">رابط التوثيق</p><a className="font-mono break-all text-black dark:text-white hover:underline" dir="ltr" href={integration.documentationUrl} target="_blank" rel="noopener noreferrer">{integration.documentationUrl}</a>
                    <p className="text-black/50 dark:text-white/50 pt-2">المفتاح الحالي</p><p className="font-mono">{integration.keyPrefix}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 rounded-xl gap-1" onClick={() => rotateMutation.mutate(integration.id)} disabled={rotateMutation.isPending}><RefreshCw className="w-3.5 h-3.5" /> تدوير المفتاح</Button>
                    <Button variant="outline" className="rounded-xl" onClick={() => updateMutation.mutate({ id: integration.id, status: integration.status === "active" ? "disabled" : "active" })} disabled={updateMutation.isPending}>{integration.status === "active" ? "تعطيل" : "تفعيل"}</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div><label className="text-xs text-black/50 dark:text-white/50 mb-1.5 block">بيئة الربط</label><select value={environment} onChange={e => setEnvironment(e.target.value)} className="w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 text-sm"><option value="development">تطوير</option><option value="staging">اختبار</option><option value="production">إنتاج</option></select></div>
                  <div><label className="text-xs text-black/50 dark:text-white/50 mb-1.5 block">اسم الإعداد (اختياري)</label><Input value={label} onChange={e => setLabel(e.target.value)} placeholder="تكامل المشروع الأساسي" /></div>
                  <div><label className="text-xs text-black/50 dark:text-white/50 mb-1.5 block">الحد في الدقيقة</label><Input type="number" min={1} max={300} value={rateLimit} onChange={e => setRateLimit(e.target.value)} /></div>
                  <p className="text-[11px] text-black/45 dark:text-white/45">لن يتم حفظ مفتاح Meta أو SMTP هنا. هذا الإعداد ينشئ مفتاح QIROX للوصول إلى نقطة المشروع فقط.</p>
                  <Button className="w-full rounded-xl" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>{createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "إنشاء مفتاح التكامل"}</Button>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}