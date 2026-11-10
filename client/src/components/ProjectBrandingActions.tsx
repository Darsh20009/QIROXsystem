import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Handshake, ImagePlus, Loader2, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

type Branding = {
  projectId: string;
  config: { publicName?: string; publicNameAr?: string; websiteUrl?: string; logoUrl?: string };
  partnerId?: string;
};

async function readResult(response: Response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("تعذر إكمال تحديث الهوية");
  return result;
}

export function ProjectBrandingLogo({ projectId, fallback = "?" }: { projectId?: string; fallback?: string }) {
  const { data } = useQuery<Branding>({
    queryKey: ["/api/admin/projects", projectId, "branding"],
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async () => readResult(await fetch(`/api/admin/projects/${projectId}/branding`, { credentials: "include" })),
  });
  const logo = data?.config?.logoUrl;
  return logo
    ? <img src={logo} alt="" className="h-11 w-11 shrink-0 rounded-xl border border-black/10 bg-white object-contain p-1" />
    : <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8eee9] text-base font-black text-[#315548]">{fallback}</div>;
}

export function ProjectBrandingActions({ projectId, canEdit }: { projectId: string; canEdit: boolean }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const text = (a: string, e: string) => ar ? a : e;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ["/api/admin/projects", projectId, "branding"];
  const { data, isLoading, error, refetch } = useQuery<Branding>({
    queryKey,
    enabled: !!projectId,
    retry: false,
    queryFn: async () => readResult(await fetch(`/api/admin/projects/${projectId}/branding`, { credentials: "include" })),
  });
  const [form, setForm] = useState({ publicName: "", publicNameAr: "", websiteUrl: "", logoUrl: "" });
  const [dirty, setDirty] = useState(false);
  const [removeBackground, setRemoveBackground] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [logoNote, setLogoNote] = useState("");
  const [showPartnerConfirm, setShowPartnerConfirm] = useState(false);
  const initialized = useRef(false);
  const invalidateProjectBranding = () => {
    void queryClient.invalidateQueries({ queryKey: ["/api/admin/projects"] });
    void queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    void queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    void queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects"] });
  };

  useEffect(() => {
    if (!data || initialized.current) return;
    initialized.current = true;
    setForm({ publicName: data.config?.publicName || "", publicNameAr: data.config?.publicNameAr || "", websiteUrl: data.config?.websiteUrl || "", logoUrl: data.config?.logoUrl || "" });
    setDirty(false);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => readResult(await fetch(`/api/admin/projects/${projectId}/branding`, {
      method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config: form }),
    })),
    onSuccess: result => {
      const saved = result.config || form;
      queryClient.setQueryData(queryKey, (old: any) => ({
        ...old,
        config: {
          publicName: saved.publicName || "",
          publicNameAr: saved.publicNameAr || "",
          websiteUrl: saved.websiteUrl || "",
          logoUrl: saved.logoUrl || "",
        },
      }));
      setDirty(false);
      invalidateProjectBranding();
      toast({ title: text("تم حفظ هوية المشروع", "Project branding saved") });
    },
    onError: () => toast({ title: text("تعذر حفظ الهوية", "Could not save branding"), variant: "destructive" }),
  });
  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast({ title: text("اختر ملف صورة", "Choose an image file"), variant: "destructive" }); return; }
    setProcessing(true);
    try {
      const body = new FormData();
      body.append("logo", file);
      body.append("removeBackground", String(removeBackground));
      const result = await readResult(await fetch(`/api/admin/projects/${projectId}/branding/logo`, { method: "POST", credentials: "include", body }));
      setForm(current => ({ ...current, logoUrl: result.logoUrl || "" }));
      setLogoNote([result.processingStatus, result.warning].filter(Boolean).join(" · "));
      queryClient.setQueryData(queryKey, (old: any) => old ? { ...old, config: { ...old.config, logoUrl: result.logoUrl } } : old);
      invalidateProjectBranding();
      toast({ title: result.warning || text("تم حفظ الشعار", "Logo saved") });
    } catch (e: any) {
      toast({ title: e?.message || text("تعذر رفع الشعار", "Could not upload logo"), variant: "destructive" });
    } finally { setProcessing(false); }
  };
  const partnerMutation = useMutation({
    mutationFn: async () => readResult(await fetch(`/api/admin/projects/${projectId}/branding/partner`, { method: "POST", credentials: "include" })),
    onSuccess: result => {
      setShowPartnerConfirm(false);
      queryClient.setQueryData(queryKey, (old: any) => ({ ...old, partnerId: result.partnerId }));
      invalidateProjectBranding();
      toast({ title: text("تم تحويل المشروع إلى شريك", "Project converted to partner") });
    },
    onError: () => toast({ title: text("تعذر تحويل المشروع إلى شريك", "Could not convert project to partner"), variant: "destructive" }),
  });
  const update = (key: keyof typeof form, value: string) => { setDirty(true); setForm(current => ({ ...current, [key]: value })); };
  const validWebsite = !form.websiteUrl || (() => {
    try { const url = new URL(form.websiteUrl); return url.protocol === "https:" && !!url.hostname; }
    catch { return false; }
  })();

  if (isLoading) return <div dir={ar ? "rtl" : "ltr"} className="h-24 animate-pulse rounded-xl bg-black/[0.04]" />;
  if (error || !data) return <div dir={ar ? "rtl" : "ltr"} className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{text("تعذر تحميل هوية المشروع.", "Could not load project branding.")} <button type="button" onClick={() => refetch()} className="underline">{text("إعادة المحاولة", "Retry")}</button></div>;

  return <section dir={ar ? "rtl" : "ltr"} className="rounded-2xl border border-black/[0.08] bg-white p-4">
    <div className="flex items-start gap-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-[#f7f6f0]">
        {form.logoUrl ? <img src={form.logoUrl} alt={text("شعار المشروع", "Project logo")} className="h-full w-full object-contain p-1" /> : <ImagePlus className="h-5 w-5 text-black/25" />}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold">{text("هوية المشروع والشراكة", "Project branding & partnership")}</h3>
        {!canEdit ? <div className="mt-2 space-y-1 text-xs text-black/60">
          <p>{form.publicNameAr || form.publicName || text("لم يُضف اسم عام", "No public name set")}</p>
          {form.websiteUrl && <a dir="ltr" className="block text-left underline" href={form.websiteUrl} target="_blank" rel="noopener noreferrer">{form.websiteUrl}</a>}
          {data.partnerId && <span className="inline-flex items-center gap-1 text-[#315548]"><Check className="h-3.5 w-3.5" />{text("شريك", "Partner")}</span>}
        </div> : <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-semibold"><span>{text("الاسم العام", "Public name")}</span><Input value={form.publicName} onChange={e => update("publicName", e.target.value)} /></label>
          <label className="space-y-1 text-xs font-semibold"><span>{text("الاسم بالعربية", "Arabic name")}</span><Input value={form.publicNameAr} onChange={e => update("publicNameAr", e.target.value)} /></label>
          <label className="space-y-1 text-xs font-semibold sm:col-span-2"><span>{text("الموقع الإلكتروني (HTTPS)", "Website (HTTPS)")}</span><Input dir="ltr" value={form.websiteUrl} placeholder="https://" onChange={e => update("websiteUrl", e.target.value)} /></label>
        </div>}
      </div>
    </div>
    {canEdit && <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/[0.06] pt-4">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold hover:bg-black/[0.03]">
        {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {text("رفع الشعار", "Upload logo")}
        <input type="file" accept="image/*" className="sr-only" disabled={processing} onChange={e => { void upload(e.target.files?.[0]); e.currentTarget.value = ""; }} />
      </label>
      <label className="flex items-center gap-2 text-[10px] text-black/55"><input type="checkbox" checked={removeBackground} onChange={e => setRemoveBackground(e.target.checked)} />{text("إزالة الخلفية (افتراضي)", "Remove background (default)")}</label>
      {logoNote && <span className="w-full text-[10px] text-amber-800">{logoNote}</span>}
      <Button size="sm" variant="outline" onClick={() => saveMutation.mutate()} disabled={!dirty || saveMutation.isPending || !validWebsite} className="gap-1.5 rounded-lg"><Save className="h-3.5 w-3.5" />{text("حفظ الهوية", "Save branding")}</Button>
      {data.partnerId ? <span className="inline-flex items-center gap-1 rounded-full bg-[#edf3ed] px-3 py-1 text-xs font-semibold text-[#315548]"><Check className="h-3.5 w-3.5" />{text("مسجل كشريك", "Registered partner")}</span> : <Button size="sm" variant="outline" onClick={() => setShowPartnerConfirm(true)} disabled={!form.logoUrl || !form.websiteUrl || !validWebsite || dirty || partnerMutation.isPending} className="gap-1.5 rounded-lg"><Handshake className="h-3.5 w-3.5" />{text("تحويل إلى شريك", "Convert to partner")}</Button>}
      {!validWebsite && <span className="w-full text-[10px] text-rose-700">{text("استخدم رابط HTTPS صالحاً.", "Enter a valid HTTPS URL.")}</span>}
    </div>}
    {showPartnerConfirm && <div role="alertdialog" aria-modal="true" className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4"><div dir={ar ? "rtl" : "ltr"} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"><h4 className="font-bold">{text("تأكيد الشراكة", "Confirm partnership")}</h4><p className="mt-2 text-sm leading-6 text-black/60">{text("سيُستخدم الشعار والموقع المحفوظان. هل تريد المتابعة؟", "The saved logo and website will be used. Continue?")}</p><div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setShowPartnerConfirm(false)}>{text("إلغاء", "Cancel")}</Button><Button onClick={() => partnerMutation.mutate()} disabled={partnerMutation.isPending} className="gap-2 bg-[#315548] text-white"><Handshake className="h-4 w-4" />{text("تأكيد التحويل", "Confirm conversion")}</Button></div></div></div>}
  </section>;
}