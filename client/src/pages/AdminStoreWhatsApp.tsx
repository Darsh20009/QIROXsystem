import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Activity, Copy, KeyRound, Loader2, MessageCircle, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Store = { id: string; _id?: string; storeNameAr?: string; storeNameEn?: string; clientId?: { fullName?: string; email?: string } };
type Key = {
  id: string; _id?: string; name: string; keyPrefix: string; isActive: boolean; scopes: string[];
  quotaPeriod: "monthly" | "bimonthly"; quotaLimit: number; rateLimitPerMinute: number; expiresAt?: string | null;
  allowedOrigins?: string[]; storeId?: Store; clientId?: { fullName?: string; email?: string };
  usage?: { used: number; limit: number; remaining: number; periodEnd?: string | null };
};

const EMPTY_FORM = { storeId: "", name: "", quotaLimit: "1000", quotaPeriod: "monthly", rateLimitPerMinute: "30", expiresAt: "", allowedOrigins: "" };

function KeySecret({ value, onClose, L }: { value: string; onClose: () => void; L: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(value); setCopied(true); };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl" dir="rtl">
        <DialogHeader><DialogTitle>{L ? "انسخ المفتاح الآن" : "Copy this key now"}</DialogTitle></DialogHeader>
        <p className="text-sm text-black/55 dark:text-white/55">{L ? "لن يُعرض المفتاح السري مرة أخرى. احفظه في أسرار النظام المستهدف." : "This secret is shown once only. Save it in the target system's secrets."}</p>
        <code className="block rounded-xl bg-black p-3 text-xs text-white break-all">{value}</code>
        <Button onClick={copy} className="rounded-xl gap-2">{copied ? (L ? "تم النسخ" : "Copied") : <><Copy className="w-4 h-4" />{L ? "نسخ المفتاح" : "Copy key"}</>}</Button>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminStoreWhatsApp() {
  const { lang, dir } = useI18n();
  const { toast } = useToast();
  const L = lang === "ar";
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [secret, setSecret] = useState("");
  const [selected, setSelected] = useState<Key | null>(null);

  const { data: keys = [], isLoading } = useQuery<Key[]>({ queryKey: ["/api/admin/store-whatsapp/keys"] });
  const { data: stores = [] } = useQuery<Store[]>({ queryKey: ["/api/admin/client-stores"] });
  const { data: usage } = useQuery<any>({
    queryKey: ["/api/admin/store-whatsapp/keys", selected?.id, "usage"],
    enabled: !!selected?.id,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/store-whatsapp"] });

  const create = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/store-whatsapp/keys", {
        ...form,
        allowedOrigins: form.allowedOrigins.split(",").map(value => value.trim()).filter(Boolean),
        quotaLimit: Number(form.quotaLimit), rateLimitPerMinute: Number(form.rateLimitPerMinute),
        expiresAt: form.expiresAt || null,
      });
      if (!response.ok) throw new Error((await response.json()).error);
      return response.json();
    },
    onSuccess: (data) => {
      refresh(); setCreateOpen(false); setForm(EMPTY_FORM); setSecret(data.rawKey);
      toast({ title: L ? "تم إنشاء مفتاح المتجر" : "Store key created" });
    },
    onError: (error: Error) => toast({ title: L ? "تعذر إنشاء المفتاح" : "Could not create key", description: error.message, variant: "destructive" }),
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => apiRequest("PATCH", `/api/admin/store-whatsapp/keys/${id}`, body),
    onSuccess: refresh,
    onError: () => toast({ title: L ? "تعذر تحديث المفتاح" : "Could not update key", variant: "destructive" }),
  });
  const rotate = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/admin/store-whatsapp/keys/${id}/rotate`);
      if (!response.ok) throw new Error((await response.json()).error);
      return response.json();
    },
    onSuccess: (data) => { refresh(); setSelected(null); setSecret(data.rawKey); toast({ title: L ? "تم تدوير المفتاح وإيقاف القديم" : "Key rotated and old key disabled" }); },
    onError: (error: Error) => toast({ title: L ? "تعذر تدوير المفتاح" : "Could not rotate key", description: error.message, variant: "destructive" }),
  });

  const active = keys.filter(key => key.isActive).length;
  const sent = keys.reduce((sum, key) => sum + (key.usage?.used || 0), 0);

  return (
    <div className="space-y-5" dir={dir}>
      <section className="rounded-3xl bg-black p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10"><MessageCircle className="w-5 h-5" /></div>
            <div><h1 className="text-xl font-black">{L ? "واتساب أعمال للمتاجر" : "Store WhatsApp Business"}</h1><p className="mt-1 text-sm text-white/55">{L ? "مفاتيح مستقلة، حصص دورية، وسجل تسليم رسمي عبر Meta" : "Dedicated keys, recurring quotas, and official Meta delivery logs"}</p></div>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="rounded-xl bg-white text-black hover:bg-white/90"><KeyRound className="ml-2 w-4 h-4" />{L ? "مفتاح متجر جديد" : "New store key"}</Button>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 max-w-md">
          <div className="rounded-xl bg-white/8 p-3"><p className="text-lg font-black">{keys.length}</p><p className="text-[11px] text-white/55">{L ? "كل المفاتيح" : "All keys"}</p></div>
          <div className="rounded-xl bg-white/8 p-3"><p className="text-lg font-black">{active}</p><p className="text-[11px] text-white/55">{L ? "نشطة" : "Active"}</p></div>
          <div className="rounded-xl bg-white/8 p-3"><p className="text-lg font-black">{sent.toLocaleString()}</p><p className="text-[11px] text-white/55">{L ? "حجوزات الحصة" : "Quota usage"}</p></div>
        </div>
      </section>

      <section className="rounded-2xl border border-black/[.07] p-4 dark:border-white/[.08]">
        <div className="mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /><h2 className="font-bold">{L ? "دليل التكامل" : "Integration guide"}</h2></div>
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div><p className="font-semibold">{L ? "العربية" : "Arabic"}</p><p className="mt-1 text-black/55 dark:text-white/55">{L ? "أرسل POST إلى /api/v1/stores/whatsapp/messages مع Bearer qrx_wa_live_ و Idempotency-Key فريد. استخدم message للنص أو template للاسم المعتمد واللغة والمعلمات." : "Use the endpoint with a dedicated bearer key and a unique Idempotency-Key. Send message for text or template for an approved Meta template."}</p></div>
          <pre className="overflow-x-auto rounded-xl bg-black p-3 text-xs text-white">{`POST /api/v1/stores/whatsapp/messages\nAuthorization: Bearer qrx_wa_live_...\nIdempotency-Key: order-12345678\n\n{"recipient":{"phone":"+9665..."},"message":"..."}`}</pre>
        </div>
        <p className="mt-3 text-xs text-black/45 dark:text-white/45">{L ? "رسائل المتاجر تتطلب إعداد WHATSAPP_META_ACCESS_TOKEN و WHATSAPP_META_PHONE_NUMBER_ID، ولا تستخدم جلسة CRM الداخلية." : "Store traffic requires Meta environment configuration and never uses the internal CRM session."}</p>
      </section>

      {isLoading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-black/35 dark:text-white/35" /></div> : (
        <section className="space-y-2">
          {keys.map(key => {
            const store = key.storeId || {};
            return <article key={key.id} className="rounded-2xl border border-black/[.07] p-4 dark:border-white/[.08]">
              <div className="flex flex-wrap items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full ${key.isActive ? "bg-emerald-500" : "bg-zinc-400"}`} />
                <div className="min-w-0 flex-1"><p className="font-bold">{key.name}</p><p className="mt-0.5 text-xs text-black/50 dark:text-white/50">{store.storeNameAr || store.storeNameEn || "—"} · {key.clientId?.fullName || "—"} · <code>{key.keyPrefix}</code></p></div>
                <div className="text-left text-xs"><p className="font-bold">{(key.usage?.used || 0).toLocaleString()} / {(key.usage?.limit || key.quotaLimit).toLocaleString()}</p><p className="text-black/45 dark:text-white/45">{key.quotaPeriod === "bimonthly" ? (L ? "كل شهرين" : "Bi-monthly") : (L ? "شهريًا" : "Monthly")}</p></div>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setSelected(key)}><Activity className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => update.mutate({ id: key.id, body: { isActive: !key.isActive } })}>{key.isActive ? (L ? "إيقاف" : "Disable") : (L ? "تفعيل" : "Enable")}</Button>
              </div>
            </article>;
          })}
          {!keys.length && <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-black/45 dark:text-white/45">{L ? "لا توجد مفاتيح واتساب للمتاجر بعد" : "No store WhatsApp keys yet"}</div>}
        </section>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent dir={dir}><DialogHeader><DialogTitle>{L ? "مفتاح WhatsApp للمتجر" : "Store WhatsApp key"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={form.storeId} onValueChange={storeId => setForm(value => ({ ...value, storeId }))}><SelectTrigger><SelectValue placeholder={L ? "اختر المتجر" : "Select store"} /></SelectTrigger><SelectContent>{stores.map(store => <SelectItem key={store.id || store._id} value={store.id || store._id || ""}>{store.storeNameAr || store.storeNameEn || "Store"} · {store.clientId?.fullName || ""}</SelectItem>)}</SelectContent></Select>
            <Input value={form.name} onChange={event => setForm(value => ({ ...value, name: event.target.value }))} placeholder={L ? "اسم المفتاح" : "Key name"} />
            <div className="grid grid-cols-2 gap-3"><Input type="number" min="1" value={form.quotaLimit} onChange={event => setForm(value => ({ ...value, quotaLimit: event.target.value }))} placeholder={L ? "الحصة" : "Quota"} /><Select value={form.quotaPeriod} onValueChange={quotaPeriod => setForm(value => ({ ...value, quotaPeriod }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">{L ? "شهري" : "Monthly"}</SelectItem><SelectItem value="bimonthly">{L ? "كل شهرين" : "Bi-monthly"}</SelectItem></SelectContent></Select></div>
            <Input type="number" min="1" max="300" value={form.rateLimitPerMinute} onChange={event => setForm(value => ({ ...value, rateLimitPerMinute: event.target.value }))} placeholder={L ? "حد الدقيقة" : "Per-minute limit"} />
            <Input value={form.allowedOrigins} onChange={event => setForm(value => ({ ...value, allowedOrigins: event.target.value }))} placeholder={L ? "النطاقات المسموحة، مفصولة بفواصل" : "Allowed origins, comma separated"} />
            <Input type="date" value={form.expiresAt} onChange={event => setForm(value => ({ ...value, expiresAt: event.target.value }))} />
            <Button disabled={create.isPending} onClick={() => create.mutate()} className="w-full rounded-xl">{create.isPending ? <Loader2 className="animate-spin" /> : (L ? "إنشاء المفتاح" : "Create key")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl" dir={dir}>{selected && <><DialogHeader><DialogTitle>{selected.name}</DialogTitle></DialogHeader>
          <div className="flex flex-wrap gap-2"><Button variant="outline" className="rounded-xl gap-2" onClick={() => rotate.mutate(selected.id)} disabled={rotate.isPending}><RefreshCw className="w-4 h-4" />{L ? "تدوير المفتاح" : "Rotate key"}</Button><Button variant="outline" className="rounded-xl" onClick={() => update.mutate({ id: selected.id, body: { isActive: !selected.isActive } })}>{selected.isActive ? (L ? "إيقاف" : "Disable") : (L ? "تفعيل" : "Enable")}</Button></div>
          <div className="mt-3 rounded-xl bg-black/[.03] p-3 text-sm dark:bg-white/[.04]"><p>{L ? "الاستخدام الحالي" : "Current usage"}: <b>{usage?.quotas?.[0]?.used || 0} / {usage?.quotas?.[0]?.limit || selected.quotaLimit}</b></p><p className="mt-1 text-black/55 dark:text-white/55">{L ? "فشل الإرسال" : "Failed deliveries"}: {usage?.summary?.failed || 0}</p></div>
          <div className="max-h-64 space-y-2 overflow-auto">{(usage?.deliveries || []).map((delivery: any) => <div key={delivery.id} className="rounded-xl border border-black/[.06] p-3 text-xs dark:border-white/[.08]"><span className={delivery.status === "failed" ? "text-red-600" : "text-emerald-600"}>{delivery.status}</span> · {delivery.recipient?.phone || ""}{delivery.lastError ? <p className="mt-1 text-red-600">{delivery.lastError}</p> : null}</div>)}</div>
          {!usage && <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}
        </>}</DialogContent>
      </Dialog>
      {secret && <KeySecret value={secret} onClose={() => setSecret("")} L={L} />}
    </div>
  );
}