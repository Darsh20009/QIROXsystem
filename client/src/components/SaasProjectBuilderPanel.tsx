import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Check, ChevronDown, Copy, Download, Eye, FileText, Github, Handshake, ImagePlus, Loader2, Palette, Save, ShieldCheck, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { SAAS_DELIVERY_ENTITLEMENTS, SAAS_FEATURES, type BuilderTier } from "@shared/saas-builder";
import { ProjectRepositoryName } from "@/components/ProjectRepositoryName";
import { SaasSplashSettings } from "@/components/SaasSplashSettings";

type BuilderConfig = {
  businessName: string;
  businessNameEn: string;
  commercialRegNumber: string;
  taxNumber: string;
  commercialRegUrl: string;
  bankName: string;
  bankAccountName: string;
  iban: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  heroImageUrl: string;
  splashEnabled?: boolean;
  splashImageUrl?: string;
  splashBackgroundColor?: string;
  splashImageFit?: "contain" | "cover";
  splashDurationMs?: number;
  splashTitle?: string;
  splashSubtitle?: string;
  extraFeatures: string[];
  customerWhatsappRegistration: boolean;
  notificationEmail: boolean;
  phone: string;
  address: string;
  websiteUrl: string;
};
type BuilderData = {
  projectId: string;
  orderId: string;
  tier: string;
  sector: string;
  templateId?: string;
  templates: Array<{ id: string; name: string; nameAr: string; kind: string; description?: string; available?: boolean; previewColors?: string[] }>;
  config: BuilderConfig;
  build?: any;
  status?: string;
  logoUrl?: string;
  partnerId?: string;
  databaseReadiness?: string;
  palette?: { primaryColor?: string; secondaryColor?: string; colors?: string[] };
  accessConfigured?: { admin?: boolean; staff?: boolean };
  integrationReadiness?: { whatsapp?: boolean; email?: boolean };
  deliveryWorkflowV2?: boolean;
  githubReady?: boolean;
  buildBusy?: boolean;
  preparedArtifact?: { artifactId: string; fileCount: number; expiresAt: string } | null;
};

const EMPTY: BuilderConfig = {
  businessName: "", businessNameEn: "", commercialRegNumber: "", taxNumber: "", commercialRegUrl: "",
  bankName: "", bankAccountName: "", iban: "", logoUrl: "", primaryColor: "#243b35", secondaryColor: "#d9a878",
  heroImageUrl: "", extraFeatures: [], customerWhatsappRegistration: false, notificationEmail: false,
  phone: "", address: "", websiteUrl: "",
};
const TIER_RANK: Record<string, number> = { lite: 1, pro: 2, infinity: 3 };
const TIER_LABEL: Record<string, string> = { lite: "Lite", pro: "Pro", infinity: "Infinity" };
const TIER_FEATURE_IDS: Record<string, string[]> = {
  lite: ["website", "menu", "table-booking", "maps", "social"],
  pro: ["website", "menu", "table-booking", "maps", "social", "qr-menu", "order-management", "kitchen", "sales-reports"],
  infinity: ["website", "menu", "table-booking", "maps", "social", "qr-menu", "order-management", "kitchen", "sales-reports", "advanced-reports", "inventory", "payments", "loyalty", "pos"],
};
const templatesBySector = [
  { id: "cluny", name: "Cluny", nameAr: "كلوني", kind: "cafe", colors: ["#273a34", "#d9a878"], note: "مقهى · هادئ ومعاصر" },
  { id: "blackrose", name: "Blackrose", nameAr: "بلاك روز", kind: "cafe", colors: ["#241f22", "#c88b9e"], note: "مقهى · طابع ليلي" },
  { id: "tasali", name: "Tasali", nameAr: "تسالي", kind: "restaurant", colors: ["#344d3b", "#dfa85d"], note: "مطعم · دافئ وعائلي" },
  { id: "chef-palace", name: "Chef Palace", nameAr: "قصر الشيف", kind: "restaurant", colors: ["#29334a", "#c9a66b"], note: "مطعم · ضيافة راقية" },
];

async function parseResponse(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const candidate = String(body.message || body.error || "");
    const message = candidate && candidate.length <= 180 && !/(\n| at \w|stack|password|token|secret|select\s.+from|mongodb)/i.test(candidate)
      ? candidate : "تعذر إكمال العملية";
    const error = new Error(message) as Error & { status?: number; needsConfirmation?: boolean; confirmationCode?: string };
    error.status = response.status;
    error.needsConfirmation = !!body.needsConfirmation || body.code === "needsConfirmation";
    error.confirmationCode = body.code;
    throw error;
  }
  return body;
}
function isHttps(value: string) {
  if (!value.trim()) return true;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}
function Field({ label, value, onChange, required, dir = "rtl", placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; dir?: "rtl" | "ltr"; placeholder?: string; type?: string }) {
  return <label className="block min-w-0 space-y-1.5"><span className="text-xs font-semibold text-black/65">{label}{required && <span className="text-rose-700"> *</span>}</span><Input type={type} dir={dir} value={value || ""} placeholder={placeholder} onChange={e => onChange(e.target.value)} className="h-10 rounded-xl border-black/10 bg-white text-sm focus-visible:ring-1 focus-visible:ring-emerald-800" /></label>;
}
function copyText(text: string) {
  return navigator.clipboard?.writeText(text);
}

export function SaasProjectBuilderPanel({ orderId }: { orderId: string }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const tx = (arabic: string, english: string) => ar ? arabic : english;
  const { toast } = useToast();
  const queryKey = ["/api/admin/orders", orderId, "saas-builder"];
  const { data, isLoading, error, refetch } = useQuery<BuilderData>({
    queryKey, enabled: !!orderId, retry: false,
    refetchInterval: query => query.state.data?.buildBusy ? 5000 : false,
    queryFn: async () => parseResponse(await fetch(`/api/admin/orders/${orderId}/saas-builder`, { credentials: "include" })),
  });
  const [config, setConfig] = useState<BuilderConfig>(EMPTY);
  const [templateId, setTemplateId] = useState("");
  const [dirty, setDirty] = useState(false);
  const [databaseUri, setDatabaseUri] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [secrets, setSecrets] = useState<Array<{ key: string; value?: string; required: boolean; description?: string }> | null>(null);
  const [replacePrompt, setReplacePrompt] = useState(false);
  const [partnerPrompt, setPartnerPrompt] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [removeBackground, setRemoveBackground] = useState(true);
  const [logoResult, setLogoResult] = useState<{ processingStatus?: string; warning?: string; originalUrl?: string } | null>(null);
  const [paletteColors, setPaletteColors] = useState<string[]>([]);
  const [heroBusy, setHeroBusy] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const initialized = useRef<string | null>(null);
  const unavailable = (error as any)?.status === 404;
  const base = `/api/admin/orders/${orderId}/saas-builder`;
  const tierValue = (data?.tier || "").toLowerCase();
  const tierKey = tierValue === "infinite" ? "infinity" : tierValue;
  const isKnownTier = !!TIER_RANK[tierKey];
  const includedFeatureIds = new Set(TIER_FEATURE_IDS[tierKey] || []);
  const freeExtraFeatures = isKnownTier ? SAAS_FEATURES.filter(feature => !includedFeatureIds.has(feature.id)) : [];
  const tier = {
    label: TIER_LABEL[tierKey] || data?.tier || tx("غير محددة", "Unconfirmed"),
    included: isKnownTier ? SAAS_FEATURES.filter(feature => includedFeatureIds.has(feature.id)).map(feature => ar ? feature.labelAr : feature.labelEn) : [],
    excluded: isKnownTier ? freeExtraFeatures.map(feature => ar ? feature.labelAr : feature.labelEn) : [],
  };
  const delivery = isKnownTier ? SAAS_DELIVERY_ENTITLEMENTS[tierKey as BuilderTier] : null;
  const databaseReady = data?.databaseReadiness === "configured_in_specs";

  useEffect(() => {
    initialized.current = null;
    setConfig({ ...EMPTY, extraFeatures: [] });
    setTemplateId("");
    setDirty(false);
    setPreview(null);
    setSecrets(null);
    setReplacePrompt(false);
    setPartnerPrompt(false);
    setLogoResult(null);
    setPaletteColors([]);
    setLogoBusy(false);
    setHeroBusy(false);
    setDownloadBusy(false);
    setRemoveBackground(true);
    setAdminPassword("");
    setStaffPassword("");
  }, [orderId]);

  useEffect(() => {
    if (!data || (data.orderId && String(data.orderId) !== String(orderId)) || initialized.current === orderId) return;
    initialized.current = orderId;
    const savedTier = (data.tier || "").toLowerCase() === "infinite" ? "infinity" : (data.tier || "").toLowerCase();
    const includedIds = new Set(TIER_FEATURE_IDS[savedTier] || []);
    const allowedExtras = new Set(SAAS_FEATURES.filter(feature => !includedIds.has(feature.id)).map(feature => feature.id));
    setConfig({
      ...EMPTY,
      ...(data.config || {}),
      extraFeatures: Array.isArray(data.config?.extraFeatures) ? data.config.extraFeatures.filter(id => allowedExtras.has(id)) : [],
      logoUrl: data.config?.logoUrl || data.logoUrl || "",
    });
    setTemplateId(data.templateId || data.build?.templateId || data.build?.template || "");
    setPaletteColors(data.palette?.colors || []);
    setDirty(false);
  }, [data, orderId]);
  const setField = (key: keyof BuilderConfig, value: any) => {
    setDirty(true); setConfig(current => ({ ...current, [key]: value }));
  };
  const invalidateRelated = () => {
    void queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    void queryClient.invalidateQueries({ queryKey: ["/api/admin/orders", orderId, "project"] });
    void queryClient.invalidateQueries({ queryKey: ["/api/admin/projects"] });
    void queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    void queryClient.invalidateQueries({ queryKey: ["/api/sandbox/projects"] });
  };
  const save = useMutation({
    mutationFn: async () => {
      if (!templateId) throw new Error(tx("اختر قالباً أولاً", "Choose a template first"));
      if (data?.templates?.some(item => item.id === templateId && item.available === false)) throw new Error(tx("القالب المختار غير متاح", "The selected template is unavailable"));
      return parseResponse(await fetch(base, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ templateId, config }) }));
    },
    onSuccess: result => {
      if (result.templateId) setTemplateId(result.templateId);
      setDirty(false); queryClient.setQueryData(queryKey, (old: any) => ({ ...old, ...result, config: result.config || config, preparedArtifact: null }));
      invalidateRelated();
      toast({ title: tx("تم حفظ إعدادات النظام", "System configuration saved") });
    },
    onError: (e: any) => {
      if (e.confirmationCode === "buildInProgress" || e.confirmationCode === "operationInProgress") {
        toast({ title: tx("التجهيز جارٍ لهذا المشروع", "Project preparation is already running") });
        void refetch();
      } else toast({ title: e.message || "تعذر حفظ الإعدادات", variant: "destructive" });
    },
  });
  const uploadLogo = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast({ title: "اختر ملف صورة", variant: "destructive" }); return; }
    setLogoBusy(true);
    try {
      const form = new FormData(); form.append("logo", file); form.append("removeBackground", String(removeBackground));
      const result = await parseResponse(await fetch(`${base}/logo`, { method: "POST", credentials: "include", body: form }));
      setLogoResult({ processingStatus: result.processingStatus, warning: result.warning, originalUrl: result.originalUrl });
      const palette = result.palette || {};
      setConfig(current => ({ ...current, logoUrl: result.logoUrl || "", primaryColor: palette.primaryColor || current.primaryColor, secondaryColor: palette.secondaryColor || current.secondaryColor }));
      if (palette.primaryColor || palette.secondaryColor) setDirty(true);
      setPaletteColors(Array.isArray(palette.colors) ? palette.colors : []);
      queryClient.setQueryData(queryKey, (old: any) => old ? { ...old, logoUrl: result.logoUrl, palette, config: { ...old.config, logoUrl: result.logoUrl, primaryColor: palette.primaryColor || old.config?.primaryColor, secondaryColor: palette.secondaryColor || old.config?.secondaryColor } } : old);
      invalidateRelated();
      toast({ title: result.warning || tx("تم رفع الشعار وحفظه", "Logo uploaded and saved") });
    } catch (e: any) { toast({ title: e.message || "تعذر رفع الشعار", variant: "destructive" }); }
    finally { setLogoBusy(false); }
  };
  const uploadHero = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast({ title: tx("اختر ملف صورة", "Choose an image file"), variant: "destructive" }); return; }
    setHeroBusy(true);
    try {
      const form = new FormData(); form.append("hero", file);
      const result = await parseResponse(await fetch(`${base}/hero`, { method: "POST", credentials: "include", body: form }));
      setField("heroImageUrl", result.heroImageUrl || "");
      invalidateRelated();
      toast({ title: tx("تم رفع صورة الواجهة", "Hero image uploaded") });
    } catch (e: any) { toast({ title: e.message || tx("تعذر رفع صورة الواجهة", "Could not upload hero image"), variant: "destructive" }); }
    finally { setHeroBusy(false); }
  };
  const paletteMutation = useMutation({
    mutationFn: async () => parseResponse(await fetch(`${base}/palette`, { method: "POST", credentials: "include" })),
    onSuccess: result => {
      const palette = result.palette || result;
      setConfig(current => ({ ...current, primaryColor: palette.primaryColor || current.primaryColor, secondaryColor: palette.secondaryColor || current.secondaryColor }));
      setPaletteColors(Array.isArray(palette.colors) ? palette.colors : []);
      setDirty(true);
      toast({ title: tx("تم استخراج لوحة الألوان من الشعار", "Logo palette extracted") });
    },
    onError: (e: any) => toast({ title: e.message || tx("تعذر استخراج الألوان", "Could not extract palette"), variant: "destructive" }),
  });
  const accessMutation = useMutation({
    mutationFn: async () => {
      if (adminPassword && adminPassword.length < 16) throw new Error(tx("كلمة مرور المالك يجب ألا تقل عن 16 حرفاً", "Owner password must be at least 16 characters"));
      if (staffPassword && staffPassword.length < 12) throw new Error(tx("كلمة مرور الموظفين يجب ألا تقل عن 12 حرفاً", "Staff password must be at least 12 characters"));
      return parseResponse(await fetch(`${base}/access`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminPassword, staffPassword }) }));
    },
    onSuccess: result => {
      const configured = result.accessConfigured || result;
      queryClient.setQueryData(queryKey, (old: any) => ({
        ...old,
        accessConfigured: {
          admin: typeof configured.admin === "boolean" ? configured.admin : !!old?.accessConfigured?.admin,
          staff: typeof configured.staff === "boolean" ? configured.staff : !!old?.accessConfigured?.staff,
        },
      }));
      setAdminPassword(""); setStaffPassword("");
      toast({ title: tx("تم حفظ بيانات الوصول بأمان", "Access credentials saved securely") });
    },
    onError: (e: any) => toast({ title: e.message || tx("تعذر حفظ بيانات الوصول", "Could not save access credentials"), variant: "destructive" }),
  });
  const previewMutation = useMutation({
    mutationFn: async () => parseResponse(await fetch(`${base}/preview`, { method: "POST", credentials: "include" })),
    onSuccess: result => setPreview(result.html || ""),
    onError: (e: any) => toast({ title: e.message || "تعذر إنشاء المعاينة", variant: "destructive" }),
  });
  const databaseMutation = useMutation({
    mutationFn: async () => parseResponse(await apiRequest("POST", `${base}/database`, { databaseUri })),
    onSuccess: result => {
      setDatabaseUri("");
      queryClient.setQueryData(queryKey, (old: any) => ({ ...old, databaseReadiness: "configured_in_specs" }));
      toast({
        title: tx("تم اختبار الاتصال وربط قاعدة البيانات", "Database connection verified and linked"),
        description: result.databaseNameAssigned
          ? tx("تم تخصيص قاعدة مستقلة لهذا المشروع تلقائياً.", "A dedicated database name was assigned for this project.")
          : result.restartRequired ? tx("أعد تشغيل النظام لتطبيق الاتصال الجديد.", "Restart the system to use the new connection.") : undefined,
      });
    },
    onError: (error: Error) => toast({
      title: tx("لم يتم ربط MongoDB؛ يمكنك تجهيز الملفات بدونه", "MongoDB was not linked; you can still prepare the files."),
      description: error.message,
    }),
  });
  const runtimePreviewMutation = useMutation({
    mutationFn: async () => {
      if (dirty) await save.mutateAsync();
      return parseResponse(await apiRequest("POST", `${base}/preview/runtime`, {}));
    },
    onSuccess: result => {
      if (result.workspaceUrl) window.location.assign(result.workspaceUrl);
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });
  const createMutation = useMutation({
    mutationFn: async (options: { replaceExisting?: boolean; preparedArtifactId?: string } = {}) => parseResponse(await fetch(`${base}/create`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    })),
    onSuccess: result => {
      setReplacePrompt(false); setSecrets(result.secrets || result.envVars || []);
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: result.commitSha ? "تم رفع المشروع إلى GitHub" : result.databaseReady ? "اكتمل تجهيز ملفات النظام" : "اكتمل تجهيز الملفات دون MongoDB",
        description: result.databaseReady
          ? result.commitSha ? "تم حفظ نسخة احتياطية قبل المزامنة. لم يتم نشر النظام أو تشغيله." : "لم يتم نشر النظام أو تشغيله."
          : "الملفات جاهزة؛ اربط قاعدة MongoDB مخصصة قبل تشغيل النظام أو نشره.",
      });
    },
    onError: (e: any) => {
      if (e.status === 409 && (e.needsConfirmation || e.confirmationCode === "needsConfirmation")) setReplacePrompt(true);
      else if (e.confirmationCode === "buildInProgress" || e.confirmationCode === "provisioningBusy") {
        toast({ title: tx("التجهيز جارٍ لهذا المشروع", "Project preparation is already running") });
        void refetch();
      } else if (e.confirmationCode === "alreadyPublished") {
        toast({ title: tx("هذا الإصدار موجود بالفعل في GitHub", "This version is already in GitHub") });
        void refetch();
      } else if (e.confirmationCode === "preparedArtifactExpired" || e.confirmationCode === "preparedArtifactStale") {
        queryClient.setQueryData(queryKey, (old: any) => old ? { ...old, preparedArtifact: null, status: "draft" } : old);
        toast({ title: e.message || tx("أعد تجهيز الملفات قبل الرفع", "Prepare the files again before uploading") });
        void refetch();
      }
      else toast({ title: e.message || "تعذر تجهيز النظام", variant: "destructive" });
    },
  });
  const prepareMutation = useMutation({
    mutationFn: async () => {
      if (dirty) await save.mutateAsync();
      return parseResponse(await fetch(`${base}/prepare`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }));
    },
    onSuccess: result => {
      if (result.code === "buildInProgress") {
        queryClient.setQueryData(queryKey, (old: any) => old ? { ...old, status: "building", buildBusy: true } : old);
        toast({ title: tx("التجهيز جارٍ بالفعل", "Preparation is already running"), description: tx("ستظهر خيارات ZIP وGitHub عند اكتماله.", "ZIP and GitHub options will appear when it finishes.") });
        void refetch();
        return;
      }
      queryClient.setQueryData(queryKey, (old: any) => ({
        ...old,
        ...result,
        status: "prepared",
        buildBusy: false,
        preparedArtifact: result.artifact,
      }));
      void queryClient.invalidateQueries({ queryKey });
      invalidateRelated();
      toast({ title: tx("تم تجهيز الأكواد", "Project code is ready"), description: tx("اختر الآن تنزيل ZIP أو الرفع إلى GitHub.", "Choose ZIP download or GitHub upload.") });
    },
    onError: (e: any) => {
      if (e.confirmationCode === "buildInProgress") {
        queryClient.setQueryData(queryKey, (old: any) => old ? { ...old, status: "building", buildBusy: true } : old);
        toast({ title: tx("التجهيز جارٍ بالفعل", "Preparation is already running") });
        void refetch();
      } else toast({ title: e.message || tx("تعذر تجهيز الأكواد", "Could not prepare the project code"), variant: "destructive" });
    },
  });
  const downloadPrepared = async () => {
    const artifactId = data?.preparedArtifact?.artifactId;
    if (!artifactId || downloadBusy) return;
    setDownloadBusy(true);
    try {
      const response = await fetch(`${base}/artifacts/${encodeURIComponent(artifactId)}/download`, { credentials: "include" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const error = new Error(String(body.error || tx("تعذر تنزيل الملف", "Could not download the ZIP"))) as Error & { status?: number };
        error.status = response.status;
        throw error;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `qirox-project-${(data?.projectId || "source").slice(-8)}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast({ title: tx("بدأ تنزيل ملف ZIP", "ZIP download started") });
    } catch (error: any) {
      if (error.status === 410) {
        queryClient.setQueryData(queryKey, (old: any) => old ? { ...old, preparedArtifact: null, status: "draft" } : old);
        void refetch();
        toast({ title: tx("انتهت صلاحية الملفات؛ أعد تجهيز المشروع", "Prepared files expired; prepare the project again") });
      } else toast({ title: error.message || tx("تعذر تنزيل الملف", "Could not download the ZIP"), variant: "destructive" });
    } finally {
      setDownloadBusy(false);
    }
  };
  const partnerMutation = useMutation({
    mutationFn: async () => parseResponse(await fetch(`${base}/partner`, { method: "POST", credentials: "include" })),
    onSuccess: result => {
      setPartnerPrompt(false); queryClient.setQueryData(queryKey, (old: any) => ({ ...old, partnerId: result.partnerId }));
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] }); toast({ title: "تم تحويل المشروع إلى شريك" });
    },
    onError: (e: any) => toast({ title: e.message || "تعذر تحويل المشروع إلى شريك", variant: "destructive" }),
  });
  const templates = useMemo(() => {
    const source = data?.templates?.length ? data.templates : templatesBySector.map(t => ({ id: t.id, name: t.name, nameAr: t.nameAr, kind: t.kind, available: true, previewColors: t.colors }));
    const normalizedSector = `${data?.sector || ""}`.toLowerCase();
    const intendedKind = /cafe|café|مقهى|كافيه/.test(normalizedSector) ? "cafe"
      : /restaurant|مطعم/.test(normalizedSector) ? "restaurant" : "";
    return source.filter(t => !intendedKind || t.kind === intendedKind);
  }, [data?.sector, data?.templates]);
  const selectedTemplate = templates.find(t => t.id === templateId);
  const doPreview = async () => {
    if (dirty) {
      try { await save.mutateAsync(); previewMutation.mutate(); } catch { return; }
    } else previewMutation.mutate();
  };
  const validateBeforeBuild = () => {
    if (!isKnownTier) {
      toast({ title: tx("لا يمكن تجهيز النظام قبل تأكيد الباقة", "System generation is blocked until the order tier is confirmed"), variant: "destructive" }); return;
    }
    if (!config.businessName.trim() || !config.commercialRegNumber.trim()) {
      toast({ title: "أكمل البيانات المطلوبة", description: "اسم النشاط ورقم السجل التجاري مطلوبان.", variant: "destructive" }); return;
    }
    if (!isHttps(config.websiteUrl) || (!config.commercialRegUrl.startsWith("/uploads/") && !isHttps(config.commercialRegUrl))) {
      toast({ title: "تحقق من الروابط", description: "استخدم رابط HTTPS صالحاً.", variant: "destructive" }); return;
    }
    return true;
  };
  const doCreate = async () => {
    if (!validateBeforeBuild()) return;
    try { if (dirty) await save.mutateAsync(); createMutation.mutate({}); }
    catch { /* save error is already surfaced */ }
  };
  const doPrepare = () => {
    if (!validateBeforeBuild()) return;
    prepareMutation.mutate();
  };
  const uploadPrepared = () => {
    const artifactId = data?.preparedArtifact?.artifactId;
    if (artifactId) createMutation.mutate({ preparedArtifactId: artifactId });
  };
  if (isLoading) return <div className="space-y-4 rounded-2xl border border-black/10 bg-white p-5" dir={ar ? "rtl" : "ltr"}><div className="h-5 w-48 animate-pulse rounded bg-black/5" /><div className="h-20 animate-pulse rounded-xl bg-black/5" /><div className="grid grid-cols-2 gap-3"><div className="h-10 animate-pulse rounded-xl bg-black/5" /><div className="h-10 animate-pulse rounded-xl bg-black/5" /></div></div>;
  if (unavailable) return <div dir={ar ? "rtl" : "ltr"} className="rounded-2xl border border-dashed border-black/15 bg-white p-6 text-right"><div className="flex items-center gap-2 font-bold"><WandSparkles className="h-4 w-4" /> {tx("أداة إنشاء أنظمة المطاعم", "Restaurant system builder")}</div><p className="mt-2 text-sm text-black/55">{tx("هذه الميزة غير متاحة لهذا الطلب حالياً.", "This feature is not available for this order.")}</p></div>;
  if (error || !data) return <div dir={ar ? "rtl" : "ltr"} className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-right"><p className="text-sm font-semibold text-rose-900">{tx("تعذر تحميل إعدادات النظام.", "Could not load system settings.")}</p><p className="mt-1 text-xs text-rose-800">{tx("تحقق من صلاحية الوصول ثم أعد المحاولة.", "Check access permissions and try again.")}</p><Button variant="outline" className="mt-3" onClick={() => refetch()}>{tx("إعادة المحاولة", "Retry")}</Button></div>;

  return <section dir={ar ? "rtl" : "ltr"} className="space-y-5 rounded-2xl border border-black/[0.08] bg-[#fffefa] p-4 sm:p-6">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-black/[0.07] pb-4">
      <div><p className="flex items-center gap-2 text-sm font-black text-[#243a33]"><WandSparkles className="h-4 w-4" /> {tx("تجهيز نظام المطعم", "Prepare restaurant system")}</p><p className="mt-1 max-w-xl text-xs leading-5 text-black/55">{tx("اختر قالباً، خصّص بيانات النشاط، ثم أنشئ ملفات قابلة للمراجعة. الإنشاء لا يعني النشر أو التشغيل.", "Choose a template and configure the business, then create reviewable files. Creation does not publish or run the system.")}</p></div>
      <span className="rounded-full border border-[#b8c9bf] bg-[#eef4ef] px-3 py-1 text-xs font-bold text-[#315548]">{tx("باقة", "Tier")} {tier.label} · {tx("من الطلب", "from order")}</span>
    </header>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(240px,.6fr)]">
      <div className="space-y-4">
        <div><h3 className="mb-2 text-xs font-bold text-black/70">{tx("القالب الأساسي", "Base template")}</h3><div className="grid grid-cols-2 gap-2">
      {templates.map((template) => {
            const visual = templatesBySector.find(t => t.id === template.id);
            const colors = template.previewColors?.length ? template.previewColors : visual?.colors || ["#293b35", "#d9a878"];
            return <button key={template.id} type="button" disabled={template.available === false} onClick={() => { setTemplateId(template.id); setDirty(true); setPreview(null); }} className={`group flex min-h-[100px] items-center gap-3 rounded-xl border p-3 text-right transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${templateId === template.id ? "border-[#426653] bg-[#f0f5ef] ring-1 ring-[#426653]/25" : "border-black/10 bg-white hover:border-black/25"}`}>
              <span className="flex h-14 w-12 shrink-0 flex-col overflow-hidden rounded-lg border border-black/10"><i className="h-1/2" style={{ background: colors[0] }} /><i className="h-1/2" style={{ background: colors[1] || colors[0] }} /></span>
              <span className="min-w-0 flex-1"><b className="block text-sm">{template.nameAr || template.name}</b><small dir="ltr" className="block text-left text-[10px] text-black/45">{template.name}</small><small className="mt-1 block text-[10px] text-black/50">{template.available === false ? tx("غير متاح", "Unavailable") : visual?.note || template.description || template.kind}</small></span>
              {templateId === template.id && <Check className="h-4 w-4 text-[#315548]" />}
            </button>;
          })}
        </div></div>
        <div className="rounded-xl border border-black/[0.08] bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-xs font-bold">{tx("بيانات النشاط", "Business details")}</h3><span className="text-[10px] text-black/40">{tx("السجل التجاري مطلوب · الرقم الضريبي اختياري", "Commercial registration required · tax number optional")}</span></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={tx("اسم النشاط بالعربية", "Business name (Arabic)")} value={config.businessName} required onChange={v => setField("businessName", v)} />
            <Field label="Business name" value={config.businessNameEn} dir="ltr" onChange={v => setField("businessNameEn", v)} />
            <Field label={tx("رقم السجل التجاري", "Commercial registration number")} value={config.commercialRegNumber} required dir="ltr" onChange={v => setField("commercialRegNumber", v)} />
            <Field label={tx("الرقم الضريبي (اختياري)", "Tax number (optional)")} value={config.taxNumber} dir="ltr" onChange={v => setField("taxNumber", v)} />
            <Field label={tx("رابط مستند السجل HTTPS", "Commercial registration URL (HTTPS)")} value={config.commercialRegUrl} dir="ltr" onChange={v => setField("commercialRegUrl", v)} placeholder="https://" />
            <Field label={tx("رقم الهاتف", "Phone")} value={config.phone} dir="ltr" onChange={v => setField("phone", v)} />
            <Field label={tx("الموقع الإلكتروني HTTPS", "Website (HTTPS)")} value={config.websiteUrl} dir="ltr" onChange={v => setField("websiteUrl", v)} placeholder="https://" />
            <Field label={tx("العنوان", "Address")} value={config.address} onChange={v => setField("address", v)} />
          </div>
        </div>
        <details className="rounded-xl border border-black/[0.08] bg-white p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold"><span>بيانات الحساب البنكي</span><ChevronDown className="h-4 w-4 text-black/40" /></summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="اسم البنك" value={config.bankName} onChange={v => setField("bankName", v)} /><Field label="اسم صاحب الحساب" value={config.bankAccountName} onChange={v => setField("bankAccountName", v)} /><div className="sm:col-span-2"><Field label="IBAN" value={config.iban} dir="ltr" onChange={v => setField("iban", v)} /></div></div>
          <p className="mt-3 text-[10px] leading-5 text-black/45">تُحفظ البيانات مع إعداد المشروع للاستخدام المقصود؛ لا تضع بيانات دخول أو أسرار مزوّد دفع هنا.</p>
        </details>
      </div>
      <aside className="space-y-4">
        <div className="rounded-xl border border-black/[0.08] bg-white p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-bold"><Palette className="h-4 w-4 text-[#466657]" /> {tx("هوية النشاط", "Business identity")}</h3>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-[#f7f6f0]">{config.logoUrl ? <img src={config.logoUrl} alt="شعار النشاط" className="h-full w-full object-contain" /> : <ImagePlus className="h-5 w-5 text-black/25" />}</div>
            <div className="min-w-0 flex-1">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold hover:bg-black/[0.03]">{logoBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />} {tx("رفع شعار", "Upload logo")}<input type="file" accept="image/*" className="sr-only" disabled={logoBusy} onChange={e => { void uploadLogo(e.target.files?.[0]); e.currentTarget.value = ""; }} /></label>
              <p className="mt-1 text-[10px] leading-4 text-black/40">{tx("يمكن رفعه منفصلاً قبل أو بعد تجهيز النظام.", "Upload separately, before or after system setup.")}</p>
              <label className="mt-2 flex items-center gap-2 text-[10px] text-black/60"><input type="checkbox" checked={removeBackground} onChange={e => setRemoveBackground(e.target.checked)} />{tx("إزالة الخلفية (افتراضي)", "Remove background (default)")}</label>
              {logoResult && <div className="mt-2 space-y-1 text-[10px] text-black/55">
                {logoResult.processingStatus && <p>{tx("حالة المعالجة", "Processing status")}: {logoResult.processingStatus}</p>}
                {logoResult.warning && <p className="text-amber-800">{logoResult.warning}</p>}
                {logoResult.originalUrl && <a href={logoResult.originalUrl} target="_blank" rel="noopener noreferrer" className="underline">{tx("عرض النسخة الأصلية", "View original")}</a>}
              </div>}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="flex items-center justify-between gap-2 text-[10px]">{tx("الأساسي", "Primary")}<input type="color" value={config.primaryColor || "#243b35"} onChange={e => setField("primaryColor", e.target.value)} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent" /></label>
            <label className="flex items-center justify-between gap-2 text-[10px]">{tx("الثانوي", "Secondary")}<input type="color" value={config.secondaryColor || "#d9a878"} onChange={e => setField("secondaryColor", e.target.value)} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent" /></label>
          </div>
          <SaasSplashSettings orderId={orderId} config={config} onChange={change => { setConfig(current => ({ ...current, ...change })); setDirty(true); }} />
          {paletteColors.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5" aria-label={tx("ألوان مستخرجة من الشعار", "Colors extracted from logo")}>{paletteColors.map((color, index) => <span key={`${color}-${index}`} title={color} className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: color }} />)}</div>}
          {config.logoUrl && <Button type="button" variant="outline" size="sm" disabled={paletteMutation.isPending} onClick={() => paletteMutation.mutate()} className="mt-3 h-8 rounded-lg text-[10px]">{paletteMutation.isPending ? tx("جارٍ استخراج الألوان…", "Extracting colors…") : tx("إعادة استخراج ألوان الشعار", "Re-extract logo palette")}</Button>}
          <div className="mt-4 border-t border-black/[0.06] pt-3">
            <p className="mb-2 text-[10px] font-semibold">{tx("صورة الواجهة الرئيسية", "Hero image")}</p>
            {config.heroImageUrl && <img src={config.heroImageUrl} alt="" className="mb-2 h-20 w-full rounded-lg border border-black/10 object-cover" />}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-[10px] font-semibold hover:bg-black/[0.03]">
              {heroBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
              {tx("رفع صورة الواجهة", "Upload hero image")}
              <input type="file" accept="image/*" className="sr-only" disabled={heroBusy} onChange={e => { void uploadHero(e.target.files?.[0]); e.currentTarget.value = ""; }} />
            </label>
          </div>
        </div>
        <div className="rounded-xl border border-[#d7e0d8] bg-[#f3f6f0] p-4">
          <h3 className="text-xs font-black">{tx("مزايا الباقة المشمولة", "Included tier features")}</h3><p className="mt-1 text-[10px] text-black/45">{tx("مأخوذة من باقة الطلب ولا يمكن تغييرها هنا.", "Read from the order; cannot be changed here.")}</p>
          {!isKnownTier && <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[10px] leading-4 text-amber-900">{tx("الباقة غير مؤكدة. لن يتم إنشاء النظام حتى تُصحح بيانات الطلب.", "Tier is unconfirmed. System generation is blocked until the order tier is corrected.")}</p>}
          <ul className="mt-3 space-y-2">{tier.included.map(x => <li key={x} className="flex gap-2 text-xs"><Check className="h-3.5 w-3.5 shrink-0 text-[#477256]" />{x}</li>)}</ul>
          {delivery && delivery.monthlyEmailLimit > 0 && <div className="mt-3 border-t border-black/[0.08] pt-3 text-[10px] leading-5 text-black/55">
            <p>{tx("حد البريد الشهري", "Monthly email allowance")}: {delivery.monthlyEmailLimit.toLocaleString()}</p>
            <p>{tx("تعديلات ما بعد التسليم", "Post-delivery revisions")}: {delivery.postDeliveryRevisions}</p>
            {delivery.businessMailboxes > 0 && <p>{tx("بريد باسم النشاط", "Business mailboxes")}: {delivery.businessMailboxes}</p>}
            {delivery.postDeliveryFeatures > 0 && <p>{tx("تطويرات ما بعد التسليم", "Post-delivery enhancements")}: {delivery.postDeliveryFeatures}</p>}
            {delivery.prioritySupport && <p>{tx("دعم أولوية 24/7 ومدير حساب", "24/7 priority support and account manager")}</p>}
            <p className="mt-1">{tx("حصص الباقة لا تعني تفعيل خدمات خارجية؛ يلزم إعداد المزود والتكاملات.", "Allowances do not provision external services; provider configuration is required.")}</p>
          </div>}
          {!!tier.excluded.length && <div className="mt-3 border-t border-black/[0.08] pt-3"><p className="mb-2 text-[10px] font-semibold text-black/45">غير مشمولة</p><ul className="space-y-1.5">{tier.excluded.map(x => <li key={x} className="text-[10px] text-black/45">— {x}</li>)}</ul></div>}
          {isKnownTier && <div className="mt-3 border-t border-black/[0.08] pt-3">
            <p className="mb-1 text-[10px] font-bold">{tx("إضافات تشغيلية مجانية (لا تغيّر السعر)", "Free admin extras (no price change)")}</p>
            <p className="mb-2 text-[9px] leading-4 text-black/45">{tx("اختر ميزات إضافية من الكتالوج المعتمد؛ مزايا الباقة نفسها ثابتة.", "Choose extra catalog features; the included tier features remain fixed.")}</p>
            <div className="grid gap-1.5 sm:grid-cols-2">{freeExtraFeatures.map(feature => <label key={feature.id} className="flex items-start gap-2 text-[10px] leading-4"><input type="checkbox" checked={config.extraFeatures.includes(feature.id)} onChange={e => setField("extraFeatures", e.target.checked ? [...new Set([...config.extraFeatures, feature.id])] : config.extraFeatures.filter(id => id !== feature.id))} /><span>{ar ? feature.labelAr : feature.labelEn}</span></label>)}</div>
          </div>}
        </div>
        <div className="rounded-xl border border-black/[0.08] bg-white p-4">
          <h3 className="flex items-center gap-2 text-xs font-bold"><ShieldCheck className="h-4 w-4 text-[#426653]" /> {tx("الجاهزية والتكاملات", "Readiness & integrations")}</h3>
          <p className="mt-2 text-[11px] leading-5 text-black/55">إعدادات قاعدة البيانات ومفاتيح الخدمات تُدار من مواصفات المشروع وتبويب التكاملات الموجود. لا تُطلب أسرار فعلية في هذا النموذج.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
            <div className="rounded-lg bg-black/[0.03] p-2">{tx("WhatsApp", "WhatsApp")}: {data.integrationReadiness?.whatsapp ? tx("جاهز", "Ready") : tx("يحتاج إعداداً", "Needs setup")}</div>
            <div className="rounded-lg bg-black/[0.03] p-2">{tx("البريد", "Email")}: {data.integrationReadiness?.email ? tx("جاهز", "Ready") : tx("يحتاج إعداداً", "Needs setup")}</div>
          </div>
          <p className="mt-2 text-[10px] leading-4 text-black/45">{tx("أكمل الضبط من مواصفات المشروع أو تبويب التكاملات؛ لا تُدخل مفاتيح مزوّد الخدمة هنا.", "Finish setup in project specifications or the integrations tab; do not enter provider keys here.")}</p>
          <p className="mt-2 flex items-start gap-2 text-[10px] leading-4 text-black/45"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />تجهيز الملفات لا ينشر الموقع ولا يهيّئ خدمات خارجية.</p>
          {!databaseReady && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-[11px] leading-5 text-amber-900">{tx("يمكنك تجهيز ملفات النظام دون قاعدة بيانات. يلزم ربط MongoDB مخصص قبل تشغيل النظام أو نشره.", "You can prepare the system files without a database. Link a dedicated MongoDB database before running or publishing it.")}</p>}
          <div className="mt-3 space-y-2">
            <ProjectRepositoryName orderId={orderId} />
            <Field label={tx("ربط قاعدة بيانات MongoDB مخصصة", "Link a dedicated MongoDB database")} type="password" dir="ltr" value={databaseUri} onChange={setDatabaseUri} placeholder="mongodb+srv://…" />
            <p className="text-[10px] leading-4 text-black/45">{tx("إذا كان رابط Atlas بلا اسم قاعدة في آخره، سنخصص اسماً مستقلاً لهذا المشروع. أدخل رابط الاتصال فقط، لا ترسله في المحادثة.", "If the Atlas URI has no database name, one is assigned uniquely to this project. Paste the URI into this field; do not send it in chat.")}</p>
            <Button type="button" variant="outline" size="sm" disabled={!databaseUri.trim() || databaseMutation.isPending} onClick={() => databaseMutation.mutate()}>
              {databaseMutation.isPending ? tx("جارٍ اختبار الاتصال…", "Testing connection…") : tx("اختبار وربط قاعدة البيانات", "Test and link database")}
            </Button>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-amber-800">{tx("تنبيه: اعتماديات القوالب الأصلية بها تنبيهات أمنية تحتاج معالجة قبل الاستخدام الإنتاجي.", "Original template dependencies have known security advisories that need remediation before production use.")}</p>
        </div>
      </aside>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-black/[0.08] bg-white p-4">
        <h3 className="text-xs font-bold">{tx("خيارات تشغيل إضافية", "Additional runtime options")}</h3>
        <div className="mt-3 space-y-3">
          <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={config.customerWhatsappRegistration} onChange={e => setField("customerWhatsappRegistration", e.target.checked)} /><span>{tx("السماح بتسجيل العملاء عبر WhatsApp", "Allow customers to register through WhatsApp")}</span></label>
          <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={config.notificationEmail} onChange={e => setField("notificationEmail", e.target.checked)} /><span>{tx("تفعيل تنبيهات البريد الإلكتروني", "Enable email notifications")}</span></label>
        </div>
      </div>
      <div className="rounded-xl border border-black/[0.08] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-bold">{tx("بيانات وصول المالك والموظفين", "Owner and staff access")}</h3>
          <span className="text-[10px] text-black/45">{tx("المالك", "Owner")}: {data.accessConfigured?.admin ? tx("مهيأ", "Configured") : tx("غير مهيأ", "Not set")} · {tx("الموظفون", "Staff")}: {data.accessConfigured?.staff ? tx("مهيأ", "Configured") : tx("غير مهيأ", "Not set")}</span>
        </div>
        <p className="mt-2 text-[10px] leading-4 text-black/50">{tx("اترك الحقل فارغاً للإبقاء على الإعداد المحفوظ. تُستخدم الكلمات لإنشاء أول حساب owner وحساب staff محدود الصلاحيات، ولا تعيد تعيين كلمات مرور الحسابات الموجودة داخل النظام.", "Leave a field blank to retain its saved setting. Passwords create the initial owner and restricted staff accounts; they do not reset existing accounts inside the generated system.")}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-semibold"><span>{tx("كلمة مرور المالك (16 حرفاً على الأقل)", "Owner password (at least 16 characters)")}</span><Input type="password" autoComplete="new-password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} /></label>
          <label className="space-y-1 text-xs font-semibold"><span>{tx("كلمة مرور الموظفين (12 حرفاً على الأقل)", "Staff password (at least 12 characters)")}</span><Input type="password" autoComplete="new-password" value={staffPassword} onChange={e => setStaffPassword(e.target.value)} /></label>
        </div>
        <p className="mt-2 text-[9px] text-black/45">{tx("تُرسل مباشرة إلى إعداد الوصول الآمن فقط، ولا تُضاف إلى الإعدادات أو المعاينة أو التخزين المحلي. تُمسح الحقول بعد الحفظ.", "Sent only to the secure access endpoint; never added to config, preview, or local storage. Inputs clear after save.")}</p>
        <Button type="button" size="sm" variant="outline" onClick={() => accessMutation.mutate()} disabled={accessMutation.isPending || (!adminPassword && !staffPassword)} className="mt-3 rounded-lg">{accessMutation.isPending ? tx("جارٍ الحفظ…", "Saving…") : tx("حفظ بيانات الوصول", "Save access credentials")}</Button>
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-2 border-t border-black/[0.07] pt-4">
      <Button onClick={() => save.mutate()} disabled={save.isPending || !dirty || !!data.buildBusy} className="gap-2 rounded-xl bg-[#315548] text-white hover:bg-[#29483c]"><Save className="h-4 w-4" />{save.isPending ? tx("جارٍ الحفظ…", "Saving…") : tx("حفظ الإعدادات", "Save settings")}</Button>
      <Button variant="outline" onClick={() => void doPreview()} disabled={save.isPending || previewMutation.isPending || !templateId || selectedTemplate?.available === false} className="gap-2 rounded-xl"><Eye className="h-4 w-4" />{tx("معاينة تصويرية", "Visual preview")}</Button>
      <Button onClick={() => runtimePreviewMutation.mutate()} disabled={!templateId || !databaseReady || runtimePreviewMutation.isPending || save.isPending} className="gap-2 rounded-xl bg-[#315548] text-white">
        {runtimePreviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
        {tx("تشغيل ومعاينة النظام الفعلي", "Run and preview the actual system")}
      </Button>
      {data.deliveryWorkflowV2 ? <>
        <Button onClick={doPrepare} disabled={!isKnownTier || !templateId || selectedTemplate?.available === false || prepareMutation.isPending || createMutation.isPending || save.isPending || !!data.buildBusy} className="gap-2 rounded-xl bg-[#9c6d3e] text-white hover:bg-[#825a32]">
          {prepareMutation.isPending || data.buildBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {prepareMutation.isPending || data.buildBusy ? tx("جارٍ تجهيز الأكواد…", "Preparing project code…") : tx("تجهيز المشروع", "Prepare project")}
        </Button>
      </> : <Button onClick={() => void doCreate()} disabled={!isKnownTier || !templateId || selectedTemplate?.available === false || createMutation.isPending || save.isPending || !!data.buildBusy} className="gap-2 rounded-xl bg-[#9c6d3e] text-white hover:bg-[#825a32]"><FileText className="h-4 w-4" />{createMutation.isPending ? tx("جارٍ التجهيز…", "Preparing…") : tx("تجهيز ملفات النظام", "Generate system files")}</Button>}
      {data.buildBusy && <div role="status" className="flex w-full items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <Loader2 className="h-4 w-4 animate-spin" />
        {tx("يجري تجهيز المشروع الآن. ستظهر خيارات ZIP وGitHub تلقائياً عند اكتماله.", "Project preparation is running. ZIP and GitHub options will appear automatically when it finishes.")}
      </div>}
      {data.deliveryWorkflowV2 && data.preparedArtifact && <div role="status" className="w-full rounded-xl border border-[#c9d8cb] bg-[#f1f6f1] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#315548]">{tx(`تم تجهيز ${data.preparedArtifact.fileCount} ملفاً`, `${data.preparedArtifact.fileCount} files are ready`)}</p>
            <p className="mt-1 text-[11px] text-black/55">{tx("اختر الآن تنزيل ZIP أو رفع نفس الملفات إلى GitHub. الملفات الجاهزة صالحة لمدة ساعة.", "Choose ZIP download or upload these same files to GitHub. The prepared files are available for one hour.")}</p>
            {dirty && <p className="mt-1 text-[11px] font-semibold text-amber-800">{tx("لديك تغييرات غير محفوظة؛ احفظها ثم جهّز المشروع مجدداً.", "You have unsaved changes. Save them, then prepare the project again.")}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void downloadPrepared()} disabled={downloadBusy || createMutation.isPending || prepareMutation.isPending || dirty || data.buildBusy}>
              {downloadBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {tx("تحميل ZIP", "Download ZIP")}
            </Button>
            <Button onClick={uploadPrepared} disabled={createMutation.isPending || prepareMutation.isPending || dirty || data.buildBusy || data.githubReady === false || (data.status === "published" && !!data.build?.commitSha)} className="gap-2 bg-[#315548] text-white hover:bg-[#29483c]">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : data.status === "published" && data.build?.commitSha ? <Check className="h-4 w-4" /> : <Github className="h-4 w-4" />}
              {createMutation.isPending ? tx("جارٍ الرفع…", "Uploading…") : data.status === "published" && data.build?.commitSha ? tx("تم الرفع إلى GitHub", "Uploaded to GitHub") : tx("رفع إلى GitHub", "Upload to GitHub")}
            </Button>
          </div>
        </div>
        {data.githubReady === false && <p className="mt-3 text-[11px] leading-5 text-amber-800">{tx("لرفع الملفات، اربط مستودع GitHub وصلاحية الوصول أولاً. يمكنك تنزيل ZIP دون ذلك.", "Connect a GitHub repository and grant access before uploading. ZIP download works without GitHub.")}</p>}
      </div>}
      {data.deliveryWorkflowV2 && data.status === "prepared" && !data.preparedArtifact && <div role="status" className="w-full rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
        {tx("انتهت صلاحية جلسة الملفات الجاهزة. اضغط «تجهيز المشروع» لإنشاء نسخة جديدة ثم اختر طريقة التسليم.", "The prepared-file session expired. Select “Prepare project” to create a fresh copy, then choose how to deliver it.")}
      </div>}
      <span className="text-[10px] text-black/40">{dirty ? "توجد تغييرات غير محفوظة؛ تُحفظ عند المعاينة" : data.build ? "يوجد إصدار مجهز" : templateId ? "الإعدادات محفوظة وجاهزة للمعاينة" : "اختر قالباً للمعاينة"}</span>
      {data.build && <span className="mr-auto rounded-full bg-[#edf3ed] px-3 py-1 text-[10px] font-semibold text-[#315548]">آخر تجهيز: {data.build.status || data.status || "جاهز للمراجعة"}</span>}
    </div>
    {data.build && <div className="rounded-xl border border-black/[0.08] bg-white p-4"><h3 className="text-xs font-bold">تعليمات تشغيل على Render</h3><p className="mt-1 text-[10px] text-black/45">{tx("لم يتم نشر النظام تلقائياً. تظهر قيم الإعداد السرية مرة واحدة بعد الرفع إلى GitHub؛ عند تنزيل ZIP أضفها إلى إعدادات خدمة النشر ولا تضعها في ملفات المصدر.", "Nothing is deployed automatically. GitHub upload shows deployment secrets once; for a ZIP, add required values in your hosting settings and never commit them in source files.")}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{[{ label: "متغيرات البيئة", value: (data.build.envRequirements || []).map((item: any) => `${item.key}: ${item.required ? "مطلوب" : "اختياري عند تفعيل الخدمة"} — ${item.description || ""}`).join("\n") || "راجع docs/SAAS-SETUP.md وأضف القيم إلى Environment في Render." }, { label: "أوامر البناء والتشغيل", value: `${data.build.buildCommand || "npm ci --include=dev && npm run build"}\n${data.build.startCommand || "npm start"}` }].map(item => <div key={item.label} className="rounded-lg bg-[#f7f6f0] p-3"><div className="flex items-center justify-between"><b className="text-[10px]">{item.label}</b><button type="button" onClick={() => { void copyText(item.value); toast({ title: "تم النسخ" }); }} className="text-black/45 hover:text-black" aria-label="نسخ"><Copy className="h-3.5 w-3.5" /></button></div><pre dir="ltr" className="mt-2 whitespace-pre-wrap break-words text-left text-[10px] text-black/60">{item.value}</pre></div>)}</div>{!!data.build.warnings?.length && <ul className="mt-3 space-y-1 text-[11px] leading-5 text-amber-800">{data.build.warnings.map((warning: string) => <li key={warning}>{warning}</li>)}</ul>}</div>}
    <div className="rounded-xl border border-[#d7e0d8] bg-[#f3f6f0] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-[#315548]"><Handshake className="h-4 w-4" />{tx("ملف الشريك العام", "Public partner profile")}</h3>
          <p className="mt-1 text-[10px] leading-4 text-black/55">{tx("يعرض الاسم والشعار والموقع وميزات الخدمة فقط. لا تُشارك بيانات مالية أو بنكية.", "Only public name, logo, website, and service features are shared. Financial and bank details are never included.")}</p>
        </div>
        <Button variant="outline" disabled={!config.logoUrl || !config.websiteUrl || !isHttps(config.websiteUrl) || dirty || !!data.partnerId} onClick={() => setPartnerPrompt(true)} className="gap-2 rounded-xl">{data.partnerId ? tx("مسجل كشريك", "Registered partner") : tx("تحويل إلى شريك", "Convert to partner")}</Button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-black/[0.06] bg-white p-3">
        {config.logoUrl && <img src={config.logoUrl} alt="" className="h-10 w-10 rounded-lg border border-black/10 object-contain p-1" />}
        <div className="min-w-[120px]"><p className="text-xs font-bold">{config.businessName || config.businessNameEn || tx("اسم النشاط غير محفوظ", "Business name not saved")}</p>{config.websiteUrl && <p dir="ltr" className="text-left text-[10px] text-black/50">{config.websiteUrl}</p>}</div>
        <div className="flex flex-wrap gap-1">{SAAS_FEATURES.filter(feature => includedFeatureIds.has(feature.id) || config.extraFeatures.includes(feature.id)).map(feature => <span key={feature.id} className="rounded-full bg-[#edf3ed] px-2 py-1 text-[9px] text-[#315548]">{ar ? feature.labelAr : feature.labelEn}</span>)}</div>
      </div>
    </div>
    {preview !== null && <div className="overflow-hidden rounded-xl border border-black/10 bg-white"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 px-4 py-3"><div><b className="text-xs">المعاينة التصويرية — ليست تشغيلًا فعليًا</b><p className="mt-1 text-[10px] text-black/45">محتوى ثابت داخل إطار معزول؛ لا ينفّذ سكربتات.</p></div><button type="button" onClick={() => setPreview(null)} className="text-xs text-black/50 hover:text-black">إغلاق</button></div><iframe title="معاينة تصويرية للنظام" sandbox="" srcDoc={preview} className="h-[420px] w-full bg-white" /></div>}
    {replacePrompt && <div role="alertdialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"><div dir="rtl" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"><h3 className="font-black">استبدال الإصدار الموجود؟</h3><p className="mt-2 text-sm leading-6 text-black/60">يوجد إصدار سابق. تأكيدك سيطلب من الخادم استبداله. لن يتم الاستبدال إلا بعد ضغط الزر أدناه.</p><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setReplacePrompt(false)}>إلغاء</Button><Button onClick={() => createMutation.mutate({ replaceExisting: true, ...(data?.preparedArtifact ? { preparedArtifactId: data.preparedArtifact.artifactId } : {}) })} disabled={createMutation.isPending || data?.buildBusy || data?.githubReady === false} className="bg-[#9c6d3e] text-white">تأكيد الاستبدال</Button></div></div></div>}
    {partnerPrompt && <div role="alertdialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"><div dir="rtl" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"><h3 className="font-black">تأكيد تحويل المشروع إلى شريك</h3><p className="mt-2 text-sm leading-6 text-black/60">سيُستخدم الشعار والرابط المحفوظان. العملية آمنة عند تكرارها؛ لن تُنشأ شراكة جديدة إذا كانت موجودة.</p><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setPartnerPrompt(false)}>رجوع</Button><Button onClick={() => partnerMutation.mutate()} disabled={partnerMutation.isPending} className="bg-[#315548] text-white">تأكيد التحويل</Button></div></div></div>}
    {secrets !== null && <div role="dialog" aria-modal="true" className="fixed inset-0 z-[101] flex items-center justify-center bg-black/50 p-4"><div dir="rtl" className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-5 shadow-xl"><h3 className="font-black">تم تجهيز الملفات</h3><div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><b>تنبيه أمان:</b> القيم السرية التالية تظهر مرة واحدة فقط. انسخها إلى مخزن الأسرار الآمن لدى فريقك؛ لن تُحفظ في المتصفح.</div>{secrets.length ? <div className="mt-4 space-y-3">{secrets.map((item, i) => <div key={`${item.key}-${i}`} className="rounded-xl border border-black/10 p-3"><b dir="ltr" className="block text-left font-mono text-xs">{item.key}</b>{item.value ? <div dir="ltr" className="mt-2 flex gap-2"><Input readOnly value={item.value} className="font-mono text-xs" /><Button variant="outline" onClick={() => { void copyText(item.value || ""); toast({ title: "تم النسخ" }); }} aria-label="نسخ القيمة"><Copy className="h-4 w-4" /></Button></div> : <p className="mt-2 text-xs text-black/55">أضف القيمة في بيئة التشغيل {item.required ? "(مطلوب)" : "(اختياري)"}</p>}{item.description && <p className="mt-1 text-[10px] text-black/45">{item.description}</p>}</div>)}</div> : <p className="mt-4 text-sm text-black/55">لم تُرجع العملية أسراراً. راجع القيم المطلوبة في ملف إعداد البيئة.</p>}<Button className="mt-5 w-full rounded-xl bg-[#315548] text-white" onClick={() => setSecrets(null)}>أغلقت الرسالة بأمان</Button></div></div>}
  </section>;
}