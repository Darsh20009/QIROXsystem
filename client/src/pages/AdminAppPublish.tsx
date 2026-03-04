import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2, Circle, Copy, Download, ExternalLink, Smartphone,
  Store, Settings, ChevronRight, Shield, Globe, Cpu, Apple, RefreshCw,
  Loader2, Save
} from "lucide-react";

function CopyBtn({ text }: { text: string }) {
  const { toast } = useToast();
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); toast({ title: "تم النسخ ✓" }); }}
      className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
      title="نسخ"
    >
      <Copy className="w-3.5 h-3.5" />
    </button>
  );
}

function CodeBlock({ title, code, lang = "json" }: { title: string; code: string; lang?: string }) {
  const downloadFile = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = title;
    a.click();
  };
  return (
    <div className="rounded-xl overflow-hidden border border-black/[0.08] mb-4">
      <div className="flex items-center justify-between bg-black/[0.04] px-4 py-2 border-b border-black/[0.06]">
        <span className="text-[11px] font-mono font-semibold text-black/60">{title}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => { navigator.clipboard.writeText(code); }} className="text-[10px] text-black/40 hover:text-black/70 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-black/[0.05] transition-colors">
            <Copy className="w-3 h-3" /> نسخ
          </button>
          <button onClick={downloadFile} className="text-[10px] text-black/40 hover:text-black/70 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-black/[0.05] transition-colors">
            <Download className="w-3 h-3" /> تنزيل
          </button>
        </div>
      </div>
      <pre className="p-4 text-[11px] font-mono text-black/70 bg-white overflow-x-auto leading-relaxed whitespace-pre-wrap">{code}</pre>
    </div>
  );
}

function StepCard({ n, title, desc, link, linkLabel }: { n: number; title: string; desc: string; link?: string; linkLabel?: string }) {
  return (
    <div className="flex gap-3 p-4 rounded-xl border border-black/[0.06] bg-white mb-2.5">
      <div className="w-7 h-7 rounded-full bg-black text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{n}</div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-black">{title}</p>
        <p className="text-xs text-black/50 mt-0.5 leading-relaxed">{desc}</p>
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1.5 font-medium">
            {linkLabel || link} <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function ReadinessItem({ done, label, note }: { done: boolean; label: string; note?: string }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border mb-2 ${done ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50"}`}>
      {done
        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        : <Circle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
      }
      <div>
        <p className={`text-xs font-bold ${done ? "text-emerald-700" : "text-amber-700"}`}>{label}</p>
        {note && <p className="text-[10px] mt-0.5 text-black/40">{note}</p>}
      </div>
      <span className={`mr-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${done ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
        {done ? "✓ جاهز" : "مطلوب"}
      </span>
    </div>
  );
}

function StoreBadge({ store, url }: { store: string; url?: string }) {
  if (!url) return <span className="text-xs text-black/30">لم يُنشر بعد</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
      <ExternalLink className="w-3 h-3" /> عرض في {store}
    </a>
  );
}

const FIELD = (label: string, value: string, onChange: (v: string) => void, props?: any) => (
  <div>
    <label className="text-[11px] font-bold text-black/50 block mb-1">{label}</label>
    <Input value={value} onChange={e => onChange(e.target.value)} className="text-sm h-9" dir="ltr" {...props} />
  </div>
);

export default function AdminAppPublish() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: cfg, isLoading } = useQuery<any>({ queryKey: ["/api/admin/store-publish-config"] });
  const [form, setForm] = useState<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (d: any) => apiRequest("PUT", "/api/admin/store-publish-config", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/store-publish-config"] });
      setSettingsOpen(false);
      toast({ title: "تم حفظ الإعدادات ✓" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const data = form || cfg || {};
  const f = (k: string, v: string) => setForm((prev: any) => ({ ...(prev || cfg || {}), [k]: v }));

  const openSettings = () => { setForm({ ...(cfg || {}) }); setSettingsOpen(true); };

  const hasAndroid = !!(data.androidPackage && data.androidFingerprint);
  const hasHuawei = !!(data.huaweiPackage && data.huaweiFingerprint);
  const hasApple = !!(data.appleTeamId && data.appleBundleId);
  const hasMs = !!(data.msAppId);

  const assetlinksJson = JSON.stringify(
    [
      ...(hasAndroid ? [{
        relation: ["delegate_permission/common.handle_all_urls"],
        target: { namespace: "android_app", package_name: data.androidPackage, sha256_cert_fingerprints: [data.androidFingerprint] }
      }] : []),
      ...(hasHuawei ? [{
        relation: ["delegate_permission/common.handle_all_urls"],
        target: { namespace: "android_app", package_name: data.huaweiPackage, sha256_cert_fingerprints: [data.huaweiFingerprint] }
      }] : []),
    ], null, 2
  );

  const aasaJson = JSON.stringify({
    applinks: {
      apps: [],
      details: hasApple ? [{ appID: `${data.appleTeamId}.${data.appleBundleId}`, paths: ["*"] }] : []
    },
    webcredentials: { apps: hasApple ? [`${data.appleTeamId}.${data.appleBundleId}`] : [] }
  }, null, 2);

  const bubblewrapConfig = JSON.stringify({
    packageId: data.androidPackage || "com.qirox.studio",
    host: (data.siteUrl || "https://qiroxstudio.online").replace("https://", ""),
    name: data.appName || "QIROX Studio",
    launcherName: data.appNameAr || "كيروكس",
    display: "standalone",
    startUrl: "/?source=twa",
    iconUrl: `${data.siteUrl || "https://qiroxstudio.online"}/icon-512.png`,
    maskableIconUrl: `${data.siteUrl || "https://qiroxstudio.online"}/icon-512-maskable.png`,
    backgroundColor: "#000000",
    themeColor: "#000000",
    navigationColor: "#000000",
    enableNotifications: true,
    signingMode: "mine",
    fingerprint: data.androidFingerprint || "",
    appVersionCode: 1,
    appVersion: data.appVersion || "1.0.0",
  }, null, 2);

  const siteUrl = data.siteUrl || "https://qiroxstudio.online";
  const readinessChecklist = [
    { done: true, label: "manifest.json كامل مع الأيقونات", note: "192×192، 512×512، Maskable — جميعها موجودة" },
    { done: true, label: "Service Worker مُفعَّل", note: "sw.js يعمل ويخزّن الأصول مؤقتاً" },
    { done: true, label: "HTTPS مُفعَّل", note: `النطاق: ${siteUrl}` },
    { done: true, label: "start_url محدد في manifest.json", note: '/?source=pwa' },
    { done: true, label: "display: standalone", note: "التطبيق يعمل بدون شريط المتصفح" },
    { done: true, label: "دعم Dark Mode", note: "theme-color محدد لكلا الوضعين" },
    { done: true, label: "browserconfig.xml لـ Microsoft", note: "أيقونات Windows جاهزة (70، 150، 310)" },
    { done: true, label: "Apple meta tags", note: "apple-mobile-web-app-capable + status-bar-style" },
    { done: true, label: "لقطات شاشة screenshots في manifest", note: "narrow + wide معرّفان" },
    { done: true, label: "shortcuts في manifest.json", note: "Dashboard + طلب جديد" },
    { done: hasAndroid, label: "assetlinks.json (Android TWA)", note: "مطلوب لنشر TWA في Google Play" },
    { done: hasApple, label: "apple-app-site-association (iOS)", note: "مطلوب لـ Universal Links و App Store" },
    { done: hasMs, label: "Microsoft App ID", note: "مطلوب لـ PWABuilder → Microsoft Store" },
  ];

  const readyCount = readinessChecklist.filter(x => x.done).length;

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 animate-spin text-black/20" />
    </div>
  );

  return (
    <div dir="rtl" className="max-w-5xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-black rounded-2xl flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black">نشر التطبيق على المتاجر</h1>
            <p className="text-xs text-black/40 mt-0.5">Google Play · App Store · Huawei App Gallery · Microsoft Store</p>
          </div>
        </div>
        <Button onClick={openSettings} variant="outline" className="gap-2 text-sm" data-testid="button-open-store-settings">
          <Settings className="w-4 h-4" /> إعدادات المتاجر
        </Button>
      </div>

      {/* Settings Panel */}
      {settingsOpen && (
        <div className="mb-6 p-5 rounded-2xl border border-black/[0.08] bg-black/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-black">إعدادات النشر على المتاجر</h2>
            <button onClick={() => setSettingsOpen(false)} className="text-black/30 hover:text-black/60 text-xs">✕ إغلاق</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">عام</p>
              {FIELD("رابط الموقع", data.siteUrl || "", v => f("siteUrl", v), { placeholder: "https://qiroxstudio.online" })}
              {FIELD("اسم التطبيق (English)", data.appName || "", v => f("appName", v))}
              {FIELD("اسم التطبيق (عربي)", data.appNameAr || "", v => f("appNameAr", v))}
              {FIELD("الإصدار", data.appVersion || "1.0.0", v => f("appVersion", v))}
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Google Play (Android TWA)</p>
              {FIELD("Package Name", data.androidPackage || "", v => f("androidPackage", v), { placeholder: "com.qirox.studio" })}
              {FIELD("SHA-256 Fingerprint", data.androidFingerprint || "", v => f("androidFingerprint", v), { placeholder: "AA:BB:CC:DD:..." })}
              {FIELD("رابط Google Play", data.playStoreUrl || "", v => f("playStoreUrl", v), { placeholder: "https://play.google.com/store/apps/..." })}
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Apple App Store</p>
              {FIELD("Team ID", data.appleTeamId || "", v => f("appleTeamId", v), { placeholder: "ABCDE12345" })}
              {FIELD("Bundle ID", data.appleBundleId || "", v => f("appleBundleId", v), { placeholder: "com.qirox.studio" })}
              {FIELD("رابط App Store", data.appStoreUrl || "", v => f("appStoreUrl", v), { placeholder: "https://apps.apple.com/..." })}
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Huawei App Gallery</p>
              {FIELD("Package Name", data.huaweiPackage || "", v => f("huaweiPackage", v), { placeholder: "com.qirox.studio.huawei" })}
              {FIELD("SHA-256 Fingerprint", data.huaweiFingerprint || "", v => f("huaweiFingerprint", v), { placeholder: "AA:BB:CC:DD:..." })}
              {FIELD("رابط App Gallery", data.huaweiStoreUrl || "", v => f("huaweiStoreUrl", v), { placeholder: "https://appgallery.huawei.com/..." })}
              <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mt-2">Microsoft Store</p>
              {FIELD("MS App Identity (Package/Identity/Name)", data.msAppId || "", v => f("msAppId", v), { placeholder: "12345YourName.QiroxStudio" })}
              {FIELD("رابط Microsoft Store", data.msStoreUrl || "", v => f("msStoreUrl", v), { placeholder: "https://apps.microsoft.com/..." })}
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="gap-2" data-testid="button-save-store-settings">
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ الإعدادات
            </Button>
          </div>
        </div>
      )}

      {/* Readiness Score */}
      <div className="mb-6 p-4 rounded-2xl border border-black/[0.07] bg-white flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center shrink-0">
          <span className="text-white font-black text-lg">{Math.round((readyCount / readinessChecklist.length) * 100)}%</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-black text-black">جاهزية التطبيق للمتاجر</p>
            <span className="text-xs text-black/40">{readyCount} / {readinessChecklist.length} معيار</span>
          </div>
          <div className="w-full h-2 rounded-full bg-black/[0.06] overflow-hidden">
            <div className="h-full bg-black rounded-full transition-all" style={{ width: `${(readyCount / readinessChecklist.length) * 100}%` }} />
          </div>
        </div>
        {data.playStoreUrl && <StoreBadge store="Play" url={data.playStoreUrl} />}
        {data.appStoreUrl && <StoreBadge store="App Store" url={data.appStoreUrl} />}
        {data.huaweiStoreUrl && <StoreBadge store="App Gallery" url={data.huaweiStoreUrl} />}
        {data.msStoreUrl && <StoreBadge store="Microsoft" url={data.msStoreUrl} />}
      </div>

      <Tabs defaultValue="readiness" dir="rtl">
        <TabsList className="mb-5 flex-wrap h-auto gap-1 bg-black/[0.03] p-1 rounded-xl">
          <TabsTrigger value="readiness" className="gap-1.5 text-xs data-[state=active]:bg-black data-[state=active]:text-white rounded-lg">
            <Shield className="w-3.5 h-3.5" /> حالة الجاهزية
          </TabsTrigger>
          <TabsTrigger value="google" className="gap-1.5 text-xs data-[state=active]:bg-black data-[state=active]:text-white rounded-lg">
            <Smartphone className="w-3.5 h-3.5" /> Google Play
          </TabsTrigger>
          <TabsTrigger value="apple" className="gap-1.5 text-xs data-[state=active]:bg-black data-[state=active]:text-white rounded-lg">
            <Apple className="w-3.5 h-3.5" /> App Store
          </TabsTrigger>
          <TabsTrigger value="huawei" className="gap-1.5 text-xs data-[state=active]:bg-black data-[state=active]:text-white rounded-lg">
            <Cpu className="w-3.5 h-3.5" /> Huawei App Gallery
          </TabsTrigger>
          <TabsTrigger value="microsoft" className="gap-1.5 text-xs data-[state=active]:bg-black data-[state=active]:text-white rounded-lg">
            <Globe className="w-3.5 h-3.5" /> Microsoft Store
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-1.5 text-xs data-[state=active]:bg-black data-[state=active]:text-white rounded-lg">
            <Download className="w-3.5 h-3.5" /> ملفات الربط
          </TabsTrigger>
        </TabsList>

        {/* ════ TAB: READINESS ════ */}
        <TabsContent value="readiness">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-3">المتطلبات التقنية</p>
              {readinessChecklist.slice(0, 7).map((item, i) => (
                <ReadinessItem key={i} {...item} />
              ))}
            </div>
            <div>
              <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-3">إعدادات المتاجر</p>
              {readinessChecklist.slice(7).map((item, i) => (
                <ReadinessItem key={i} {...item} />
              ))}
              {!hasAndroid || !hasApple || !hasMs ? (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                  لإكمال الجاهزية، اضغط على <strong>"إعدادات المتاجر"</strong> أعلاه وأدخل البيانات المطلوبة.
                </div>
              ) : (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-bold">
                  🎉 التطبيق جاهز بالكامل للنشر على جميع المتاجر!
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ════ TAB: GOOGLE PLAY ════ */}
        <TabsContent value="google">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black">Google Play Store</h2>
                  <p className="text-[10px] text-black/40">عبر Trusted Web Activity (TWA)</p>
                </div>
                {data.playStoreUrl && <a href={data.playStoreUrl} target="_blank" rel="noopener noreferrer" className="mr-auto"><Badge variant="outline" className="text-[10px] gap-1 text-green-600 border-green-200"><CheckCircle2 className="w-3 h-3" /> منشور</Badge></a>}
              </div>

              <StepCard n={1} title="تثبيت Bubblewrap CLI" desc="أداة Google الرسمية لتحويل PWA إلى APK/AAB جاهز للنشر" link="https://github.com/GoogleChromeLabs/bubblewrap" linkLabel="Bubblewrap على GitHub" />
              <StepCard n={2} title="تهيئة المشروع" desc={`bubblewrap init --manifest ${siteUrl}/manifest.json`} />
              <StepCard n={3} title="احصل على SHA-256 Fingerprint" desc="بعد إنشاء Keystore: keytool -list -v -keystore release.keystore | grep SHA256 — ثم أدخله في إعدادات المتاجر أعلاه" />
              <StepCard n={4} title="بناء AAB" desc="bubblewrap build — سيولّد ملف app-release.aab" />
              <StepCard n={5} title="رفع على Google Play Console" desc="أنشئ تطبيقاً جديداً، اختر 'Internal Testing' أولاً ثم انشر للجمهور" link="https://play.google.com/console" linkLabel="Google Play Console" />
              <StepCard n={6} title="تفعيل Digital Asset Links" desc={`يجب أن يكون ملف assetlinks.json متاحاً على: ${siteUrl}/.well-known/assetlinks.json — وهو جاهز تلقائياً بعد إدخال الـ Fingerprint`} />

              <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-xl">
                <p className="text-[11px] font-bold text-green-700 mb-1">متطلبات Google Play:</p>
                <ul className="text-[10px] text-green-600 space-y-0.5">
                  <li>• حساب Google Play Developer ($25 رسوم لمرة واحدة)</li>
                  <li>• Package Name مسجّل: {data.androidPackage || "com.qirox.studio"}</li>
                  <li>• لقطات شاشة: 1024×500 banner + 8 screenshots</li>
                  <li>• سياسة الخصوصية (لديكم /privacy)</li>
                  <li>• تصنيف المحتوى Content Rating</li>
                </ul>
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-black/40 mb-3">ملفات الإعداد التلقائية</p>
              <CodeBlock title="bubblewrap-config.json" code={bubblewrapConfig} />
              <div className="p-3 bg-black/[0.02] rounded-xl border border-black/[0.06]">
                <p className="text-[10px] font-bold text-black/50 mb-2">فحص ملف assetlinks.json المُولَّد:</p>
                <a href={`${siteUrl}/.well-known/assetlinks.json`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  {siteUrl}/.well-known/assetlinks.json <ExternalLink className="w-3 h-3" />
                </a>
                {!hasAndroid && <p className="text-[10px] text-amber-600 mt-1.5">⚠ أدخل Package Name والـ Fingerprint في الإعدادات لتفعيل هذا الملف</p>}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ════ TAB: APPLE ════ */}
        <TabsContent value="apple">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center">
                  <Apple className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black">Apple App Store</h2>
                  <p className="text-[10px] text-black/40">عبر PWABuilder (الأسهل) أو Capacitor</p>
                </div>
                {data.appStoreUrl && <a href={data.appStoreUrl} target="_blank" rel="noopener noreferrer" className="mr-auto"><Badge variant="outline" className="text-[10px] gap-1"><CheckCircle2 className="w-3 h-3 text-blue-500" /> منشور</Badge></a>}
              </div>

              <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-xs font-bold text-blue-800 mb-1">الطريقة الأسهل: PWABuilder</p>
                <p className="text-[10px] text-blue-600">يُحوِّل PWA تلقائياً إلى IPA جاهز للرفع على App Store Connect</p>
                <a href="https://www.pwabuilder.com" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1 mt-1.5">
                  pwabuilder.com <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <StepCard n={1} title="حساب Apple Developer" desc="مطلوب اشتراك سنوي بـ $99 — سجّل على developer.apple.com" link="https://developer.apple.com" linkLabel="Apple Developer Program" />
              <StepCard n={2} title="سجّل Bundle ID" desc={`اذهب إلى Identifiers → (+) → App ID → أدخل: ${data.appleBundleId || "com.qirox.studio"}`} link="https://developer.apple.com/account/resources/identifiers/list" linkLabel="App Identifiers" />
              <StepCard n={3} title="استخدم PWABuilder" desc={`ادخل رابط موقعك: ${siteUrl} — اختر iOS — ستحصل على ملف ZIP يحتوي مشروع Xcode`} link="https://www.pwabuilder.com" linkLabel="فتح PWABuilder" />
              <StepCard n={4} title="افتح في Xcode" desc="افتح الملف .xcodeproj — اضبط Bundle ID والـ Team — اختر Product → Archive" />
              <StepCard n={5} title="ارفع على App Store Connect" desc="في Organizer: Distribute App → App Store Connect → Upload — ثم أكمل البيانات في appstoreconnect.apple.com" link="https://appstoreconnect.apple.com" linkLabel="App Store Connect" />

              <div className="mt-4 p-3 bg-black/[0.03] border border-black/[0.06] rounded-xl">
                <p className="text-[11px] font-bold text-black/60 mb-1">متطلبات App Store:</p>
                <ul className="text-[10px] text-black/40 space-y-0.5">
                  <li>• Mac مع Xcode 15+ (لبناء الـ IPA)</li>
                  <li>• لقطات iPhone 6.7" و iPad 12.9" (بالعربي)</li>
                  <li>• مراجعة Apple: عادة 1-3 أيام عمل</li>
                  <li>• سياسة خصوصية مُضافة داخل التطبيق</li>
                </ul>
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-black/40 mb-3">ملف apple-app-site-association</p>
              <CodeBlock title="apple-app-site-association" code={aasaJson} />
              <div className="p-3 bg-black/[0.02] rounded-xl border border-black/[0.06]">
                <p className="text-[10px] font-bold text-black/50 mb-2">مسار الملف على السيرفر:</p>
                <a href={`${siteUrl}/.well-known/apple-app-site-association`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  {siteUrl}/.well-known/apple-app-site-association <ExternalLink className="w-3 h-3" />
                </a>
                {!hasApple && <p className="text-[10px] text-amber-600 mt-1.5">⚠ أدخل Team ID والـ Bundle ID في الإعدادات لتفعيل هذا الملف</p>}
              </div>

              <div className="mt-4 p-3 bg-black/[0.02] rounded-xl border border-black/[0.06]">
                <p className="text-[10px] font-bold text-black/50 mb-2">الإعدادات الحالية:</p>
                <div className="space-y-1.5 font-mono text-[10px] text-black/50" dir="ltr">
                  <div>Team ID: <span className="text-black font-bold">{data.appleTeamId || "—"}</span></div>
                  <div>Bundle ID: <span className="text-black font-bold">{data.appleBundleId || "—"}</span></div>
                  {hasApple && <div>App ID: <span className="text-black font-bold">{data.appleTeamId}.{data.appleBundleId}</span></div>}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ════ TAB: HUAWEI ════ */}
        <TabsContent value="huawei">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-red-500 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black">Huawei App Gallery</h2>
                  <p className="text-[10px] text-black/40">عبر QuickApp Webview أو TWA</p>
                </div>
                {data.huaweiStoreUrl && <a href={data.huaweiStoreUrl} target="_blank" rel="noopener noreferrer" className="mr-auto"><Badge variant="outline" className="text-[10px] gap-1 text-red-600 border-red-200"><CheckCircle2 className="w-3 h-3" /> منشور</Badge></a>}
              </div>

              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100">
                <p className="text-xs font-bold text-red-800 mb-1">خياران متاحان لـ Huawei</p>
                <p className="text-[10px] text-red-600">1. TWA (نفس منهجية Google Play) — 2. QuickApp Webview (يلتف الموقع بغلاف Huawei)</p>
              </div>

              <StepCard n={1} title="إنشاء حساب Huawei Developer" desc="سجّل مجاناً على developer.huawei.com — لا توجد رسوم" link="https://developer.huawei.com" linkLabel="Huawei Developer" />
              <StepCard n={2} title="أنشئ تطبيقاً في AppGallery Connect" desc="اذهب إلى My Apps → New App → اختر App Type: App — أدخل Package Name" link="https://developer.huawei.com/consumer/en/service/josp/agc/index.html" linkLabel="AppGallery Connect" />
              <StepCard n={3} title="استخدم نفس ملف bubblewrap" desc={`يعمل نفس TWA مع Huawei — استخدم package: ${data.huaweiPackage || data.androidPackage || "com.qirox.studio.huawei"}`} />
              <StepCard n={4} title="احصل على SHA-256 Fingerprint" desc="من AppGallery Connect → بيانات الشهادة — أو من Keystore الخاص بك" />
              <StepCard n={5} title="ارفع APK/AAB" desc="من AppGallery Connect: Software Versions → New Version → ارفع ملف AAB" />
              <StepCard n={6} title="اختبار وإطلاق" desc="Beta Test → Open Testing → Release — مراجعة Huawei عادة 1-3 أيام" />

              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-[11px] font-bold text-red-700 mb-1">مميزات App Gallery:</p>
                <ul className="text-[10px] text-red-600 space-y-0.5">
                  <li>• مجاني بالكامل (لا رسوم تسجيل)</li>
                  <li>• 580+ مليون مستخدم Huawei حول العالم</li>
                  <li>• سوق كبير في الشرق الأوسط وأوروبا</li>
                </ul>
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-black/40 mb-3">الإعدادات الحالية</p>
              <div className="p-4 bg-black/[0.02] rounded-xl border border-black/[0.06] space-y-2 font-mono text-[11px]" dir="ltr">
                <div>Package: <span className="text-black font-bold">{data.huaweiPackage || "—"}</span></div>
                <div className="break-all">Fingerprint: <span className="text-black font-bold text-[10px]">{data.huaweiFingerprint || "—"}</span></div>
              </div>
              {!hasHuawei && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-700">
                  أدخل Package Name وSHA-256 Fingerprint في إعدادات المتاجر لتوليد assetlinks.json الخاص بـ Huawei
                </div>
              )}

              <div className="mt-4">
                <p className="text-xs font-black text-black/40 mb-3">assetlinks.json (مشترك مع Play Store)</p>
                <CodeBlock title=".well-known/assetlinks.json" code={assetlinksJson} />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ════ TAB: MICROSOFT ════ */}
        <TabsContent value="microsoft">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black">Microsoft Store</h2>
                  <p className="text-[10px] text-black/40">عبر PWABuilder — الأسرع والأسهل</p>
                </div>
                {data.msStoreUrl && <a href={data.msStoreUrl} target="_blank" rel="noopener noreferrer" className="mr-auto"><Badge variant="outline" className="text-[10px] gap-1 text-blue-600 border-blue-200"><CheckCircle2 className="w-3 h-3" /> منشور</Badge></a>}
              </div>

              <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-xs font-bold text-blue-800 mb-1">✨ الأسهل من بين المتاجر الأربعة</p>
                <p className="text-[10px] text-blue-600">Microsoft يدعم PWA مباشرة في متجره — يمكن النشر عبر PWABuilder بدون كود إضافي</p>
              </div>

              <StepCard n={1} title="حساب Microsoft Partner Center" desc="سجّل على partner.microsoft.com — رسوم التسجيل $19 (مرة واحدة للأفراد) أو $99 (للشركات)" link="https://partner.microsoft.com/dashboard/registration/apps" linkLabel="Microsoft Partner Center" />
              <StepCard n={2} title="استخدم PWABuilder" desc={`أدخل رابط موقعك ${siteUrl} — اختر Windows — يولّد حزمة MSIX تلقائياً`} link="https://www.pwabuilder.com" linkLabel="pwabuilder.com" />
              <StepCard n={3} title="احجز اسم التطبيق" desc="في Partner Center: Apps → Create a new app → احجز اسم QIROX Studio" />
              <StepCard n={4} title="ارفع حزمة MSIX" desc="في Partner Center: Submissions → الحزمة التي تم توليدها من PWABuilder (بدون Xcode أو Android Studio)" />
              <StepCard n={5} title="أكمل بيانات المتجر" desc="أضف الوصف بالعربي والإنجليزي، لقطات الشاشة، فئة التطبيق (Business → Productivity)" />
              <StepCard n={6} title="إرسال للمراجعة" desc="عادة 3-5 أيام عمل — بعد الموافقة يظهر في Microsoft Store لمستخدمي Windows 11/10" />

              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-[11px] font-bold text-blue-700 mb-1">مميزات Microsoft Store:</p>
                <ul className="text-[10px] text-blue-600 space-y-0.5">
                  <li>• 1.4 مليار جهاز Windows حول العالم</li>
                  <li>• يُثبَّت كتطبيق Windows حقيقي (مع أيقونة في Start Menu)</li>
                  <li>• يعمل بدون متصفح (Standalone Window)</li>
                  <li>• لا يحتاج Xcode أو Android Studio</li>
                </ul>
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-black/40 mb-3">browserconfig.xml (موجود ✓)</p>
              <div className="p-3 bg-black/[0.02] rounded-xl border border-black/[0.06]">
                <p className="text-[10px] text-black/50 mb-2">الملف متاح على:</p>
                <a href={`${siteUrl}/browserconfig.xml`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  {siteUrl}/browserconfig.xml <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="mt-4 p-3 bg-black/[0.02] rounded-xl border border-black/[0.06]">
                <p className="text-[10px] font-bold text-black/50 mb-2">App Identity (للإعدادات):</p>
                <div className="font-mono text-[11px] text-black" dir="ltr">{data.msAppId || "لم يُدخَل بعد"}</div>
              </div>

              <div className="mt-4 p-3 rounded-xl border border-black/[0.06] bg-white">
                <p className="text-xs font-bold text-black mb-3">مقارنة متطلبات المتاجر</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]" dir="rtl">
                    <thead>
                      <tr className="border-b border-black/[0.06]">
                        <th className="text-right pb-2 font-bold text-black/40">المتجر</th>
                        <th className="text-center pb-2 font-bold text-black/40">الرسوم</th>
                        <th className="text-center pb-2 font-bold text-black/40">Mac مطلوب</th>
                        <th className="text-center pb-2 font-bold text-black/40">التعقيد</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-1">
                      {[
                        { name: "Google Play", fee: "$25", mac: "لا", complexity: "متوسط" },
                        { name: "App Store", fee: "$99/سنة", mac: "نعم ✓", complexity: "عالٍ" },
                        { name: "Huawei", fee: "مجاني", mac: "لا", complexity: "متوسط" },
                        { name: "Microsoft", fee: "$19/$99", mac: "لا", complexity: "سهل ✓" },
                      ].map(r => (
                        <tr key={r.name} className="border-b border-black/[0.03]">
                          <td className="py-1.5 font-semibold">{r.name}</td>
                          <td className="text-center py-1.5 text-black/50">{r.fee}</td>
                          <td className="text-center py-1.5 text-black/50">{r.mac}</td>
                          <td className="text-center py-1.5 text-black/50">{r.complexity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ════ TAB: FILES ════ */}
        <TabsContent value="files">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-black text-black/40 uppercase tracking-widest mb-3">ملفات التحقق (Well-Known)</p>
              <CodeBlock title=".well-known/assetlinks.json" code={assetlinksJson} />
              <div className="mt-3 p-3 bg-black/[0.02] rounded-xl border border-black/[0.06] text-[10px] text-black/50 space-y-1">
                <p className="font-bold text-black/60">يُستخدم لـ:</p>
                <p>• Google Play (TWA)</p>
                <p>• Huawei App Gallery (TWA)</p>
                <p>• Android Universal Links</p>
                <p className="mt-2 font-bold text-black/60">المسار على السيرفر:</p>
                <a href={`${siteUrl}/.well-known/assetlinks.json`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" dir="ltr">
                  {siteUrl}/.well-known/assetlinks.json
                </a>
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-black/40 uppercase tracking-widest mb-3">Apple App Site Association</p>
              <CodeBlock title=".well-known/apple-app-site-association" code={aasaJson} />
              <div className="mt-3 p-3 bg-black/[0.02] rounded-xl border border-black/[0.06] text-[10px] text-black/50 space-y-1">
                <p className="font-bold text-black/60">يُستخدم لـ:</p>
                <p>• Apple App Store (Universal Links)</p>
                <p>• Sign in with Apple</p>
                <p>• App Clips</p>
                <p className="mt-2 font-bold text-black/60">المسار على السيرفر:</p>
                <a href={`${siteUrl}/.well-known/apple-app-site-association`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" dir="ltr">
                  {siteUrl}/.well-known/apple-app-site-association
                </a>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-black text-black/40 uppercase tracking-widest mb-3">ملفات PWA الموجودة</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: "manifest.json", url: "/manifest.json", desc: "بيانات PWA" },
                { name: "sw.js", url: "/sw.js", desc: "Service Worker" },
                { name: "browserconfig.xml", url: "/browserconfig.xml", desc: "Windows Tiles" },
                { name: "icon-512.png", url: "/icon-512.png", desc: "أيقونة 512×512" },
              ].map(f => (
                <a key={f.name} href={f.url} target="_blank" rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-black/[0.06] bg-white hover:border-black/20 transition-colors group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-black">{f.name}</span>
                    <ExternalLink className="w-3 h-3 text-black/20 group-hover:text-black/50 transition-colors" />
                  </div>
                  <p className="text-[9px] text-black/30">{f.desc}</p>
                </a>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-black text-black/40 uppercase tracking-widest mb-3">أدوات خارجية مفيدة</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { name: "PWABuilder", url: "https://pwabuilder.com", desc: "توليد حزم لجميع المتاجر من PWA", color: "bg-purple-500" },
                { name: "Bubblewrap CLI", url: "https://github.com/GoogleChromeLabs/bubblewrap", desc: "تحويل PWA إلى TWA لـ Google Play", color: "bg-green-500" },
                { name: "Lighthouse PWA Audit", url: `https://pagespeed.web.dev/report?url=${encodeURIComponent(siteUrl)}`, desc: "فحص جاهزية PWA", color: "bg-orange-500" },
              ].map(t => (
                <a key={t.name} href={t.url} target="_blank" rel="noopener noreferrer"
                  className="p-4 rounded-xl border border-black/[0.06] bg-white hover:border-black/20 transition-colors group flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg ${t.color} flex items-center justify-center shrink-0`}>
                    <ExternalLink className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-black group-hover:text-blue-600 transition-colors">{t.name}</p>
                    <p className="text-[10px] text-black/40 mt-0.5">{t.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
