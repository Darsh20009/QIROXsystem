import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, Download, Copy, Smartphone, Monitor, Code, Play } from "lucide-react";
import { PageGraphics } from "@/components/AnimatedPageGraphics";

const FRAMEWORKS = ["expo", "react-native", "flutter", "ionic", "capacitor", "pwa", "other"];

const frameworkLabel: Record<string, string> = {
  expo: "Expo (React Native)", "react-native": "React Native", flutter: "Flutter",
  ionic: "Ionic", capacitor: "Capacitor", pwa: "PWA", other: "أخرى",
};

function CopyBlock({ title, code }: { title: string; code: string }) {
  const { toast } = useToast();
  return (
    <div className="border rounded-lg overflow-hidden mb-3">
      <PageGraphics variant="dashboard" />
      <div className="flex items-center justify-between bg-gray-50 px-3 py-1.5 border-b">
        <span className="text-xs font-medium text-gray-600">{title}</span>
        <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[10px] gap-1" onClick={() => { navigator.clipboard.writeText(code); toast({ title: "تم النسخ" }); }}>
          <Copy className="w-2.5 h-2.5" /> نسخ
        </Button>
      </div>
      <pre className="p-3 text-[10px] font-mono text-gray-700 overflow-x-auto bg-white whitespace-pre-wrap">{code}</pre>
    </div>
  );
}

function generateCodes(cfg: any) {
  const pkg = cfg.androidPackageName || "com.example.app";
  const bundle = cfg.iosBundleId || "com.example.app";
  const name = cfg.appName || "MyApp";
  const ver = cfg.appVersion || "1.0.0";
  const build = cfg.buildNumber || "1";
  const color = cfg.primaryColor || "#000000";
  const splash = cfg.splashColor || "#000000";
  const site = cfg.siteUrl || "https://example.com";
  const api = cfg.apiBaseUrl || "https://api.example.com";

  const appJson = JSON.stringify({
    expo: {
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      version: ver,
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "light",
      splash: { image: "./assets/splash.png", resizeMode: "contain", backgroundColor: splash },
      ios: {
        supportsTablet: false,
        bundleIdentifier: bundle,
        buildNumber: build,
        infoPlist: { NSCameraUsageDescription: "يحتاج التطبيق إلى الكاميرا" },
      },
      android: {
        adaptiveIcon: { foregroundImage: "./assets/adaptive-icon.png", backgroundColor: color },
        package: pkg,
        versionCode: parseInt(build),
        permissions: ["CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"],
      },
      web: { favicon: "./assets/favicon.png", bundler: "metro" },
      extra: { siteUrl: site, apiBaseUrl: api },
      plugins: ["expo-router"],
    },
  }, null, 2);

  const envFile = `# ${name} — Environment Variables
APP_NAME="${name}"
APP_VERSION="${ver}"
BUILD_NUMBER="${build}"
ANDROID_PACKAGE_NAME="${pkg}"
IOS_BUNDLE_ID="${bundle}"
SITE_URL="${site}"
API_BASE_URL="${api}"
PRIMARY_COLOR="${color}"
SPLASH_COLOR="${splash}"
`;

  const androidBuild = `// android/app/build.gradle
android {
    compileSdkVersion 34
    defaultConfig {
        applicationId "${pkg}"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode ${build}
        versionName "${ver}"
    }
    signingConfigs {
        release {
            storeFile file("keystore.jks")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias "${cfg.signingKeyAlias || "release"}"
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')
            signingConfig signingConfigs.release
        }
    }
}`;

  const iosPlist = `<!-- ios/${name}/Info.plist (الخصائص الأساسية) -->
<key>CFBundleIdentifier</key>  <string>${bundle}</string>
<key>CFBundleShortVersionString</key>  <string>${ver}</string>
<key>CFBundleVersion</key>  <string>${build}</string>
<key>CFBundleDisplayName</key>  <string>${name}</string>`;

  const googlePlaySteps = `# خطوات نشر تطبيق Android على Google Play

## 1. توليد Keystore (مرة واحدة فقط)
keytool -genkey -v -keystore keystore.jks \\
  -alias ${cfg.signingKeyAlias || "release"} \\
  -keyalg RSA -keysize 2048 -validity 10000

## 2. بناء APK/AAB للإصدار (Expo)
npx expo build:android --type app-bundle
# أو باستخدام EAS:
npx eas build --platform android --profile production

## 3. بناء بدون Expo (React Native)
cd android
./gradlew bundleRelease

## 4. رفع على Google Play Console
- افتح: https://play.google.com/console
- أنشئ تطبيقاً جديداً
- Package name: ${pkg}
- ارفع AAB من android/app/build/outputs/bundle/release/
- أكمل البيانات: الوصف، لقطات الشاشة، الفئة
- انشر على مسار الاختبار أولاً ثم الإنتاج`;

  const appStoreSteps = `# خطوات نشر تطبيق iOS على App Store

## 1. المتطلبات
- Mac مع Xcode 15+
- حساب Apple Developer مدفوع
- Bundle ID مسجّل: ${bundle}

## 2. بناء التطبيق (Expo EAS)
npx eas build --platform ios --profile production

## 3. بناء بدون Expo (Xcode)
- افتح ios/${name}.xcworkspace في Xcode
- اختر Product > Archive
- في Organizer: Distribute App > App Store Connect

## 4. رفع على App Store Connect
- افتح: https://appstoreconnect.apple.com
- أنشئ تطبيقاً جديداً
- Bundle ID: ${bundle}
- ارفع IPA عبر Xcode Organizer أو Transporter
- أكمل البيانات: الوصف (العربي والإنجليزي)، لقطات الشاشة
- اطلب المراجعة من Apple

## 5. الوقت المتوقع للمراجعة
- عادة 1-3 أيام عمل`;

  const flutterBuild = `# بناء Flutter للمنصتين

## Android
flutter build appbundle --release
# الملف: build/app/outputs/bundle/release/app-release.aab

## iOS
flutter build ipa --release
# ثم ارفع عبر Xcode أو Transporter`;

  return { appJson, envFile, androidBuild, iosPlist, googlePlaySteps, appStoreSteps, flutterBuild };
}

const emptyForm = {
  appName: "", appNameAr: "", appVersion: "1.0.0", buildNumber: "1",
  framework: "expo", androidPackageName: "", iosBundleId: "",
  siteUrl: "", apiBaseUrl: "", primaryColor: "#000000", splashColor: "#000000",
  signingKeyAlias: "release", description: "", descriptionAr: "", keywords: "",
  clientName: "", clientId: "", projectId: "",
};

export default function AdminAppPublish() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [selected, setSelected] = useState<any>(null);

  const { data: configs = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/app-configs"] });

  const save = useMutation({
    mutationFn: (d: any) => editId
      ? apiRequest("PUT", `/api/admin/app-configs/${editId}`, d)
      : apiRequest("POST", "/api/admin/app-configs", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/app-configs"] }); setOpen(false); toast({ title: "تم الحفظ" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/app-configs/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/app-configs"] }); if (selected?.id === editId) setSelected(null); },
  });

  function openNew() { setEditId(null); setForm({ ...emptyForm }); setOpen(true); }
  function openEdit(c: any) {
    setEditId(c.id);
    setForm({ appName: c.appName, appNameAr: c.appNameAr||"", appVersion: c.appVersion||"1.0.0", buildNumber: c.buildNumber||"1", framework: c.framework||"expo", androidPackageName: c.androidPackageName||"", iosBundleId: c.iosBundleId||"", siteUrl: c.siteUrl||"", apiBaseUrl: c.apiBaseUrl||"", primaryColor: c.primaryColor||"#000000", splashColor: c.splashColor||"#000000", signingKeyAlias: c.signingKeyAlias||"release", description: c.description||"", descriptionAr: c.descriptionAr||"", keywords: c.keywords||"", clientName: c.clientName||"", clientId: c.clientId||"", projectId: c.projectId||"" });
    setOpen(true);
  }

  function downloadEnv(cfg: any) {
    const { envFile } = generateCodes(cfg);
    const blob = new Blob([envFile], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${cfg.appName}.env`; a.click();
  }

  function downloadJson(cfg: any) {
    const { appJson } = generateCodes(cfg);
    const blob = new Blob([appJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${cfg.appName}-app.json`; a.click();
  }

  const f = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-blue-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">نشر التطبيقات</h1>
          <p className="text-sm text-gray-500">ملفات الإعداد وأكواد نشر Google Play & App Store</p>
        </div>
        <div className="mr-auto">
          <Button onClick={openNew} data-testid="button-new-app-config" className="gap-2">
            <Plus className="w-4 h-4" /> إضافة تطبيق
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">التطبيقات ({configs.length})</h2>
          {isLoading ? <div className="text-center py-8 text-gray-400 text-sm">جاري التحميل...</div> :
            configs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Smartphone className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">لا توجد تطبيقات</p>
              </div>
            ) : configs.map((c: any) => (
              <Card key={c.id} data-testid={`card-app-${c.id}`} className={`cursor-pointer border transition-colors ${selected?.id === c.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`} onClick={() => setSelected(c)}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{c.appName}</p>
                      {c.appNameAr && <p className="text-xs text-gray-400 truncate">{c.appNameAr}</p>}
                      <div className="flex gap-1 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[9px]">{frameworkLabel[c.framework] || c.framework}</Badge>
                        <Badge variant="outline" className="text-[9px]">v{c.appVersion}</Badge>
                      </div>
                      {c.clientName && <p className="text-[10px] text-gray-400 mt-1">{c.clientName}</p>}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={e => { e.stopPropagation(); openEdit(c); }} data-testid={`button-edit-app-${c.id}`}><Pencil className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" className="h-6 px-1.5 text-red-500" onClick={e => { e.stopPropagation(); del.mutate(c.id); }} data-testid={`button-delete-app-${c.id}`}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          }
        </div>

        {/* Codes panel */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="text-center py-24 text-gray-300">
              <Code className="w-14 h-14 mx-auto mb-3 opacity-40" />
              <p className="text-sm">اختر تطبيقاً لعرض الأكواد</p>
            </div>
          ) : (() => {
            const codes = generateCodes(selected);
            const isFlutter = selected.framework === "flutter";
            const isPwa = selected.framework === "pwa";
            return (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold">{selected.appName}</h2>
                    <p className="text-xs text-gray-500">{frameworkLabel[selected.framework]} — v{selected.appVersion} (Build {selected.buildNumber})</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => downloadJson(selected)} data-testid="button-download-json" className="gap-1 text-xs">
                      <Download className="w-3 h-3" /> app.json
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => downloadEnv(selected)} data-testid="button-download-env" className="gap-1 text-xs">
                      <Download className="w-3 h-3" /> .env
                    </Button>
                  </div>
                </div>

                <Tabs defaultValue="config" dir="rtl">
                  <TabsList className="mb-4 flex-wrap h-auto gap-1">
                    <TabsTrigger value="config" className="text-xs gap-1"><Monitor className="w-3 h-3" />الإعداد</TabsTrigger>
                    {!isPwa && <TabsTrigger value="android" className="text-xs gap-1"><Play className="w-3 h-3" />Google Play</TabsTrigger>}
                    {!isPwa && <TabsTrigger value="ios" className="text-xs gap-1"><Smartphone className="w-3 h-3" />App Store</TabsTrigger>}
                    <TabsTrigger value="env" className="text-xs gap-1"><Code className="w-3 h-3" />ملف .env</TabsTrigger>
                  </TabsList>

                  <TabsContent value="config">
                    {!isFlutter && !isPwa && <CopyBlock title="app.json (Expo / React Native)" code={codes.appJson} />}
                    {!isPwa && !isFlutter && <CopyBlock title="android/app/build.gradle" code={codes.androidBuild} />}
                    {!isPwa && !isFlutter && <CopyBlock title="ios/Info.plist (مقتطفات)" code={codes.iosPlist} />}
                    {isFlutter && <CopyBlock title="أوامر بناء Flutter" code={codes.flutterBuild} />}
                    {isPwa && <CopyBlock title="بيانات PWA" code={`App Name: ${selected.appName}\nTheme Color: ${selected.primaryColor}\nBackground: ${selected.splashColor}\nSite URL: ${selected.siteUrl}\nAPI URL: ${selected.apiBaseUrl}`} />}
                  </TabsContent>

                  <TabsContent value="android">
                    <CopyBlock title="خطوات نشر Android على Google Play" code={codes.googlePlaySteps} />
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-[10px] text-gray-500 mb-1">Package Name</p>
                        <p className="text-xs font-mono font-semibold" dir="ltr">{selected.androidPackageName || "لم يُحدَّد"}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-[10px] text-gray-500 mb-1">Version Code</p>
                        <p className="text-xs font-mono font-semibold">{selected.buildNumber}</p>
                      </div>
                    </div>
                    {selected.googlePlayListingUrl && (
                      <a href={selected.googlePlayListingUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs text-blue-600 underline">{selected.googlePlayListingUrl}</a>
                    )}
                  </TabsContent>

                  <TabsContent value="ios">
                    <CopyBlock title="خطوات نشر iOS على App Store" code={codes.appStoreSteps} />
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-[10px] text-gray-500 mb-1">Bundle ID</p>
                        <p className="text-xs font-mono font-semibold" dir="ltr">{selected.iosBundleId || "لم يُحدَّد"}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-[10px] text-gray-500 mb-1">Build Number</p>
                        <p className="text-xs font-mono font-semibold">{selected.buildNumber}</p>
                      </div>
                    </div>
                    {selected.appStoreListingUrl && (
                      <a href={selected.appStoreListingUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs text-blue-600 underline">{selected.appStoreListingUrl}</a>
                    )}
                  </TabsContent>

                  <TabsContent value="env">
                    <CopyBlock title=".env — متغيرات البيئة" code={codes.envFile} />
                  </TabsContent>
                </Tabs>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editId ? "تعديل إعداد التطبيق" : "إضافة تطبيق جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>اسم التطبيق (عربي) *</Label>
                <Input value={form.appNameAr} onChange={e => f("appNameAr", e.target.value)} placeholder="تطبيق كلوني" data-testid="input-app-name-ar" />
              </div>
              <div>
                <Label>App Name (English) *</Label>
                <Input value={form.appName} onChange={e => f("appName", e.target.value)} placeholder="Cluny App" dir="ltr" data-testid="input-app-name" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Framework</Label>
                <Select value={form.framework} onValueChange={v => f("framework", v)}>
                  <SelectTrigger data-testid="select-framework"><SelectValue /></SelectTrigger>
                  <SelectContent>{FRAMEWORKS.map(fw => <SelectItem key={fw} value={fw}>{frameworkLabel[fw]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>الإصدار</Label>
                <Input value={form.appVersion} onChange={e => f("appVersion", e.target.value)} dir="ltr" data-testid="input-app-version" />
              </div>
              <div>
                <Label>Build Number</Label>
                <Input value={form.buildNumber} onChange={e => f("buildNumber", e.target.value)} dir="ltr" data-testid="input-build-number" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Android Package Name</Label>
                <Input value={form.androidPackageName} onChange={e => f("androidPackageName", e.target.value)} placeholder="com.qirox.app" dir="ltr" data-testid="input-android-pkg" />
              </div>
              <div>
                <Label>iOS Bundle ID</Label>
                <Input value={form.iosBundleId} onChange={e => f("iosBundleId", e.target.value)} placeholder="com.qirox.app" dir="ltr" data-testid="input-ios-bundle" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>رابط الموقع</Label>
                <Input value={form.siteUrl} onChange={e => f("siteUrl", e.target.value)} placeholder="https://example.com" dir="ltr" data-testid="input-site-url" />
              </div>
              <div>
                <Label>API Base URL</Label>
                <Input value={form.apiBaseUrl} onChange={e => f("apiBaseUrl", e.target.value)} placeholder="https://api.example.com" dir="ltr" data-testid="input-api-url" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>اللون الأساسي</Label>
                <div className="flex gap-1">
                  <input type="color" value={form.primaryColor} onChange={e => f("primaryColor", e.target.value)} className="w-10 h-9 rounded border cursor-pointer" data-testid="color-primary" />
                  <Input value={form.primaryColor} onChange={e => f("primaryColor", e.target.value)} dir="ltr" className="font-mono text-sm" />
                </div>
              </div>
              <div>
                <Label>لون الـ Splash</Label>
                <div className="flex gap-1">
                  <input type="color" value={form.splashColor} onChange={e => f("splashColor", e.target.value)} className="w-10 h-9 rounded border cursor-pointer" data-testid="color-splash" />
                  <Input value={form.splashColor} onChange={e => f("splashColor", e.target.value)} dir="ltr" className="font-mono text-sm" />
                </div>
              </div>
              <div>
                <Label>Signing Key Alias</Label>
                <Input value={form.signingKeyAlias} onChange={e => f("signingKeyAlias", e.target.value)} dir="ltr" data-testid="input-key-alias" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>اسم العميل</Label>
                <Input value={form.clientName} onChange={e => f("clientName", e.target.value)} data-testid="input-app-client-name" />
              </div>
              <div>
                <Label>رابط Google Play</Label>
                <Input value={(form as any).googlePlayListingUrl || ""} onChange={e => f("googlePlayListingUrl" as any, e.target.value)} dir="ltr" placeholder="https://play.google.com/..." data-testid="input-play-url" />
              </div>
            </div>
            <div>
              <Label>وصف (اختياري)</Label>
              <Textarea value={form.descriptionAr} onChange={e => f("descriptionAr", e.target.value)} className="h-16" placeholder="وصف التطبيق بالعربية" data-testid="input-app-desc" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending || !form.appName} data-testid="button-save-app">
              {save.isPending ? "جاري الحفظ..." : editId ? "تحديث" : "إنشاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
