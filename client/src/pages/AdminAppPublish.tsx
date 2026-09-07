
import { useState, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, Circle, Copy, Download, ExternalLink, Smartphone,
  Store, Settings, Shield, Globe, Cpu, Apple, RefreshCw,
  Loader2, Save, Package, Zap, Layers, FileArchive, Play, Monitor,
  ChevronRight, Info, AlertTriangle, CheckCheck, Box, Hash, Clock, Trash2,
  CreditCard, Wallet
} from "lucide-react";

// ─── JSZip import ───────────────────────────────────────────
import JSZip from "jszip";

// ─── Types ──────────────────────────────────────────────────
type Platform = "android" | "windows" | "macos" | "ios" | "harmony";

const PLATFORMS: { id: Platform; label: string; labelEn: string; icon: any; color: string; bg: string; ext: string; desc: string; badge?: string }[] = [
  { id: "android", label: "أندرويد", labelEn: "Android", icon: Smartphone, color: "text-black dark:text-white", bg: "bg-black/[0.04] dark:bg-white/[0.06] border-black/10 dark:border-white/10", ext: "APK", desc: "Google Play — Trusted Web Activity" },
  { id: "windows", label: "ويندوز", labelEn: "Windows", icon: Monitor, color: "text-black dark:text-white", bg: "bg-black/[0.04] dark:bg-white/[0.06] border-black/10 dark:border-white/10", ext: "EXE", desc: "Electron — Windows Desktop App" },
  { id: "macos", label: "ماك", labelEn: "macOS", icon: Apple, color: "text-black dark:text-white", bg: "bg-black/[0.04] dark:bg-white/[0.06] border-black/10 dark:border-white/10", ext: "DMG", desc: "Electron — macOS Desktop App (.dmg)" },
  { id: "ios", label: "آيفون iOS", labelEn: "iOS", icon: Apple, color: "text-black dark:text-white", bg: "bg-black/[0.04] dark:bg-white/[0.06] border-black/10 dark:border-white/10", ext: "IPA", desc: "Capacitor — Apple App Store" },
  { id: "harmony", label: "هارموني", labelEn: "HarmonyOS", icon: Cpu, color: "text-black dark:text-white", bg: "bg-black/[0.04] dark:bg-white/[0.06] border-black/10 dark:border-white/10", ext: "HAP", desc: "DevEco Studio — Huawei App Gallery" },
];

const PERMISSIONS = [
  { id: "internet", label: "الإنترنت", icon: Globe, required: true },
  { id: "camera", label: "الكاميرا", icon: Zap, required: false },
  { id: "microphone", label: "الميكروفون", icon: Zap, required: false },
  { id: "storage", label: "التخزين", icon: Layers, required: false },
  { id: "notifications", label: "الإشعارات", icon: Zap, required: true },
  { id: "location", label: "الموقع الجغرافي", icon: Globe, required: false },
  { id: "contacts", label: "جهات الاتصال", icon: Zap, required: false },
  { id: "biometric", label: "بصمة / وجه", icon: Shield, required: false },
];

// ─── Helper components ───────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const { toast } = useToast();
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); toast({ title: "Copied ✓" }); }}
      className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors" title="Copy">
      <Copy className="w-3.5 h-3.5" />
    </button>
  );
}
function CodeBlock({ title, code }: { title: string; code: string }) {
  const downloadFile = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = title; a.click();
  };
  return (
    <div className="rounded-xl overflow-hidden border border-black/[0.08] mb-4">
      <div className="flex items-center justify-between bg-black/[0.04] px-4 py-2 border-b border-black/[0.06]">
        <span className="text-[11px] font-mono font-semibold text-black/60">{title}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => navigator.clipboard.writeText(code)} className="text-[10px] text-black/40 hover:text-black/70 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-black/[0.05] transition-colors"><Copy className="w-3 h-3" /> Copy</button>
          <button onClick={downloadFile} className="text-[10px] text-black/40 hover:text-black/70 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-black/[0.05] transition-colors"><Download className="w-3 h-3" /> Download</button>
        </div>
      </div>
      <pre className="p-4 text-[11px] font-mono text-black/70 bg-white overflow-x-auto leading-relaxed whitespace-pre-wrap">{code}</pre>
    </div>
  );
}
function StepCard({ n, title, desc, link, linkLabel }: any) {
  return (
    <div className="flex gap-3 p-4 rounded-xl border border-black/[0.06] bg-white mb-2.5">
      <div className="w-7 h-7 rounded-full bg-black text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{n}</div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-black">{title}</p>
        <p className="text-xs text-black/50 mt-0.5 leading-relaxed">{desc}</p>
        {link && <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-black dark:text-white hover:text-black dark:text-white mt-1.5 font-medium">{linkLabel || link} <ExternalLink className="w-3 h-3" /></a>}
      </div>
    </div>
  );
}
function ReadinessItem({ done, label, note }: any) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border mb-2 ${done ? "border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.06]" : "border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.06]"}`}>
      {done ? <CheckCircle2 className="w-4 h-4 text-black dark:text-white shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-black/70 dark:text-white/70 shrink-0 mt-0.5" />}
      <div>
        <p className={`text-xs font-bold ${done ? "text-black dark:text-white" : "text-black dark:text-white"}`}>{label}</p>
        {note && <p className="text-[10px] mt-0.5 text-black/40">{note}</p>}
      </div>
      <span className={`mr-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${done ? "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white" : "bg-black/[0.04] dark:bg-white/[0.06] text-black dark:text-white"}`}>{done ? "✓ جاهز" : "مطلوب"}</span>
    </div>
  );
}
function StoreBadge({ store, url }: any) {
  if (!url) return <span className="text-xs text-black/30">لم يُنشر بعد</span>;
  return <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-black dark:text-white hover:underline"><ExternalLink className="w-3 h-3" /> عرض في {store}</a>;
}
const FIELD = (label: string, value: string, onChange: (v: string) => void, props?: any) => (
  <div>
    <label className="text-[11px] font-bold text-black/50 block mb-1">{label}</label>
    <Input value={value} onChange={e => onChange(e.target.value)} className="text-sm h-9" dir="ltr" {...props} />
  </div>
);

// ─── ZIP Generators ──────────────────────────────────────────
function generateAndroidZip(cfg: any, perms: string[], appName: string, pkgName: string, version: string, siteUrl: string) {
  const zip = new JSZip();
  const domain = siteUrl.replace(/https?:\/\//, "");
  const versionCode = Math.floor(Date.now() / 1000) % 100000;

  const permLines = [
    `<uses-permission android:name="android.permission.INTERNET"/>`,
    ...perms.filter(p => p !== "internet").map(p => ({
      camera: `<uses-permission android:name="android.permission.CAMERA"/>`,
      microphone: `<uses-permission android:name="android.permission.RECORD_AUDIO"/>`,
      storage: `<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>\n    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>`,
      notifications: `<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>`,
      location: `<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>\n    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>`,
      contacts: `<uses-permission android:name="android.permission.READ_CONTACTS"/>`,
      biometric: `<uses-permission android:name="android.permission.USE_BIOMETRIC"/>\n    <uses-permission android:name="android.permission.USE_FINGERPRINT"/>`,
    }[p] || "")).join("\n    "),
  ].join("\n    ");

  // AndroidManifest.xml
  zip.folder("app/src/main").file("AndroidManifest.xml", `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${pkgName}"
    android:versionCode="${versionCode}"
    android:versionName="${version}">

    <!-- ═══ Permissions ═══ -->
    ${permLines}

    <application
        android:name=".Application"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:networkSecurityConfig="@xml/network_security_config"
        android:allowBackup="true">

        <!-- ═══ TWA Activity (Trusted Web Activity) ═══ -->
        <activity
            android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
            android:label="@string/app_name"
            android:exported="true">
            <meta-data
                android:name="android.support.customtabs.trusted.DEFAULT_URL"
                android:value="${siteUrl}/?source=twa"/>
            <meta-data
                android:name="android.support.customtabs.trusted.STATUS_BAR_COLOR"
                android:resource="@color/colorPrimary"/>
            <meta-data
                android:name="android.support.customtabs.trusted.SPLASH_IMAGE_DRAWABLE"
                android:resource="@drawable/splash"/>
            <meta-data
                android:name="android.support.customtabs.trusted.SPLASH_SCREEN_BACKGROUND_COLOR"
                android:resource="@color/backgroundColor"/>
            <meta-data
                android:name="android.support.customtabs.trusted.SPLASH_SCREEN_FADE_OUT_DURATION"
                android:value="300"/>
            <meta-data
                android:name="android.support.customtabs.trusted.FILE_PROVIDER_AUTHORITY"
                android:value="${pkgName}.fileprovider"/>
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW"/>
                <category android:name="android.intent.category.DEFAULT"/>
                <category android:name="android.intent.category.BROWSABLE"/>
                <data android:scheme="https" android:host="${domain}"/>
            </intent-filter>
        </activity>

        <!-- ═══ WebView Fallback ═══ -->
        <activity android:name=".WebViewFallbackActivity" android:exported="false"/>

        <!-- ═══ Firebase Push Notifications ═══ -->
        <service android:name=".PushNotificationService" android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT"/>
            </intent-filter>
        </service>
    </application>
</manifest>`);

  // strings.xml
  zip.folder("app/src/main/res/values").file("strings.xml", `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${appName}</string>
    <string name="app_name_ar">نظام QIROX</string>
    <string name="site_url">${siteUrl}</string>
    <string name="package_name">${pkgName}</string>
</resources>`);

  // colors.xml
  zip.folder("app/src/main/res/values").file("colors.xml", `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#000000</color>
    <color name="colorPrimaryDark">#000000</color>
    <color name="colorAccent">#FFFFFF</color>
    <color name="backgroundColor">#282828</color>
    <color name="splashBackground">#282828</color>
</resources>`);

  // styles.xml
  zip.folder("app/src/main/res/values").file("styles.xml", `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.NoActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
        <item name="android:windowBackground">@color/backgroundColor</item>
    </style>
    <style name="SplashTheme" parent="AppTheme">
        <item name="android:windowBackground">@drawable/splash</item>
        <item name="android:windowFullscreen">true</item>
    </style>
</resources>`);

  // network_security_config.xml
  zip.folder("app/src/main/res/xml").file("network_security_config.xml", `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">${domain}</domain>
    </domain-config>
</network-security-config>`);

  // app/build.gradle
  zip.folder("app").file("build.gradle", `apply plugin: 'com.android.application'

android {
    compileSdkVersion 34
    buildToolsVersion "34.0.0"
    namespace "${pkgName}"

    defaultConfig {
        applicationId "${pkgName}"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode ${versionCode}
        versionName "${version}"
        multiDexEnabled true
    }

    signingConfigs {
        release {
            // Generate keystore: keytool -genkey -v -keystore release.keystore -alias qirox -keyalg RSA -keysize 2048 -validity 10000
            storeFile file("release.keystore")
            storePassword System.getenv("KEYSTORE_PASS") ?: "your_store_pass"
            keyAlias "qirox"
            keyPassword System.getenv("KEY_PASS") ?: "your_key_pass"
        }
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
        debug {
            applicationIdSuffix ".debug"
            versionNameSuffix "-debug"
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_11
        targetCompatibility JavaVersion.VERSION_11
    }
}

dependencies {
    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
    implementation 'androidx.appcompat:appcompat:1.7.0'
    implementation 'com.google.android.material:material:1.12.0'
    implementation 'androidx.multidex:multidex:2.0.1'
    implementation platform('com.google.firebase:firebase-bom:33.0.0')
    implementation 'com.google.firebase:firebase-messaging'
}

apply plugin: 'com.google.gms.google-services'`);

  // root build.gradle
  zip.file("build.gradle", `buildscript {
    ext { kotlin_version = '1.9.0' }
    repositories { google(); mavenCentral() }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.0'
        classpath 'com.google.gms:google-services:4.4.0'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
    }
}
allprojects {
    repositories { google(); mavenCentral() }
}
task clean(type: Delete) { delete rootProject.buildDir }`);

  // settings.gradle
  zip.file("settings.gradle", `rootProject.name = "${appName.replace(/\s+/g, "")}"
include ':app'`);

  // gradle.properties
  zip.file("gradle.properties", `org.gradle.jvmargs=-Xmx4096m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
org.gradle.parallel=true
org.gradle.caching=true`);

  // bubblewrap.config.json
  zip.file("bubblewrap.config.json", JSON.stringify({
    packageId: pkgName,
    host: domain,
    name: appName,
    launcherName: cfg?.appNameAr || "QIROX",
    display: "standalone",
    orientation: "any",
    themeColor: "#000000",
    backgroundColor: "#282828",
    startUrl: "/?source=twa",
    iconUrl: `${siteUrl}/icon-512.png`,
    maskableIconUrl: `${siteUrl}/icon-512-maskable.png`,
    monochromeIconUrl: `${siteUrl}/icon-192.png`,
    appVersion: version,
    appVersionCode: versionCode,
    signingMode: "mine",
    enableNotifications: true,
    enableSiteSettingsShortcut: true,
    isChromeOSOnly: false,
    isMetaQuest: false,
    fullScopeUrl: siteUrl,
  }, null, 2));

  // proguard-rules.pro
  zip.folder("app").file("proguard-rules.pro", `# QIROX Studio ProGuard Rules
-keep class com.google.androidbrowserhelper.** { *; }
-keep class androidx.browser.** { *; }
-dontwarn com.google.android.**
-keepattributes *Annotation*
-keepattributes Signature`);

  // GitHub Actions CI/CD
  zip.folder(".github/workflows").file("build-release.yml", `name: Build & Release APK
on:
  push:
    tags: [ 'v*' ]
  workflow_dispatch:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: 17 }
      - name: Setup Android SDK
        uses: android-actions/setup-android@v3
      - name: Build Release AAB
        env:
          KEYSTORE_PASS: \${{ secrets.KEYSTORE_PASS }}
          KEY_PASS: \${{ secrets.KEY_PASS }}
        run: ./gradlew bundleRelease
      - name: Upload AAB
        uses: actions/upload-artifact@v4
        with:
          name: qirox-release-\${{ github.ref_name }}
          path: app/build/outputs/bundle/release/*.aab`);

  zip.file("README.md", `# ${appName} — Android (TWA)

## المتطلبات
- Android Studio Hedgehog أو أحدث
- Java Development Kit 17+
- Android SDK 34

## خطوات البناء

### 1. فتح المشروع
\`\`\`
افتح Android Studio → Open → اختر هذا المجلد
\`\`\`

### 2. إنشاء Keystore (مرة واحدة فقط)
\`\`\`bash
keytool -genkey -v -keystore app/release.keystore \\
  -alias qirox -keyalg RSA -keysize 2048 -validity 10000
\`\`\`

### 3. الحصول على SHA-256 Fingerprint
\`\`\`bash
keytool -list -v -keystore app/release.keystore -alias qirox | grep SHA256
\`\`\`
ثم أدخله في إعدادات المتاجر في QIROX Studio.

### 4. بناء APK / AAB
\`\`\`bash
./gradlew assembleRelease   # → app/build/outputs/apk/release/*.apk
./gradlew bundleRelease     # → app/build/outputs/bundle/release/*.aab
\`\`\`

### 5. الرفع على Google Play
- افتح Google Play Console
- أنشئ تطبيقاً جديداً بـ Package: ${pkgName}
- ارفع ملف AAB

## ملاحظات
- الرابط: ${siteUrl}
- الإصدار: ${version}
- تاريخ التوليد: ${new Date().toLocaleString("ar-SA")}
`);

  return zip;
}

function generateWindowsZip(cfg: any, appName: string, version: string, siteUrl: string) {
  const zip = new JSZip();
  const appId = `qirox-studio-${Date.now()}`;

  // package.json
  zip.file("package.json", JSON.stringify({
    name: "qirox-studio",
    version,
    description: `${appName} — Desktop Application`,
    main: "src/main.js",
    private: true,
    scripts: {
      "start": "electron .",
      "pack": "electron-builder --dir",
      "dist": "electron-builder",
      "dist:win": "electron-builder --win",
      "dist:msix": "electron-builder --win msix",
    },
    dependencies: { "electron-updater": "^6.1.7" },
    devDependencies: { "electron": "^28.0.0", "electron-builder": "^24.9.1" },
    build: {
      appId: `com.qirox.studio`,
      productName: appName,
      copyright: `Copyright © ${new Date().getFullYear()} QIROX Studio`,
      directories: { output: "dist", buildResources: "assets" },
      files: ["src/**/*", "assets/**/*"],
      win: {
        target: [{ target: "nsis", arch: ["x64", "ia32"] }, { target: "msix", arch: ["x64"] }, { target: "portable", arch: ["x64"] }],
        icon: "assets/icon.ico",
        publisherName: "QIROX Studio",
        requestedExecutionLevel: "requireAdministrator",
        artifactName: "${productName}-Setup-${version}.${ext}",
        signAndEditExecutable: false,
      },
      nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
        installerIcon: "assets/icon.ico",
        uninstallerIcon: "assets/icon.ico",
        installerHeaderIcon: "assets/icon.ico",
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
        shortcutName: appName,
        include: "installer.nsh",
        displayLanguageSelector: true,
        installerLanguages: ["Arabic", "English"],
        artifactName: "${productName}-Setup-${version}.${ext}",
      },
      msix: {
        applicationId: "QiroxStudio",
        backgroundColor: "#282828",
        publisherDisplayName: "QIROX Studio",
        identityName: "QiroxStudio.App",
      },
      publish: {
        provider: "github",
        releaseType: "release",
      },
      extraResources: [{ from: "assets/", to: "assets/" }],
    },
  }, null, 2));

  // src/main.js
  zip.folder("src").file("main.js", `const { app, BrowserWindow, Menu, Tray, shell, ipcMain, nativeTheme } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

const APP_URL = "${siteUrl}";
const APP_NAME = "${appName}";
let mainWindow = null;
let tray = null;

// ─── Single Instance Lock ───────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); }
else {
  app.on("second-instance", () => {
    if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    title: APP_NAME,
    icon: path.join(__dirname, "../assets/icon.ico"),
    backgroundColor: "#282828",
    titleBarStyle: "hiddenInset",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, "preload.js"),
    },
    show: false,
  });

  // Load the web app
  mainWindow.loadURL(APP_URL);

  // Show when ready to prevent flashing
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
    // Check for updates
    if (app.isPackaged) { autoUpdater.checkForUpdatesAndNotify(); }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Dark mode sync
  nativeTheme.on("updated", () => {
    mainWindow?.webContents.send("theme-changed", nativeTheme.shouldUseDarkColors);
  });

  // Menu
  const menu = Menu.buildFromTemplate([
    { label: "تطبيق", submenu: [{ label: "إغلاق", accelerator: "CmdOrCtrl+W", role: "close" }, { type: "separator" }, { label: "خروج", role: "quit" }] },
    { label: "تحرير", submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }] },
    { label: "عرض", submenu: [{ role: "reload" }, { role: "forceReload" }, { type: "separator" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { type: "separator" }, { role: "togglefullscreen" }] },
    { label: "مساعدة", submenu: [{ label: "فتح في المتصفح", click: () => shell.openExternal(APP_URL) }, { label: "عن التطبيق", click: () => { const { dialog } = require("electron"); dialog.showMessageBox({ title: APP_NAME, message: "QIROX Studio\\nالإصدار: ${version}\\n© ${new Date().getFullYear()} QIROX" }); } }] },
  ]);
  Menu.setApplicationMenu(menu);

  // System tray
  try {
    tray = new Tray(path.join(__dirname, "../assets/icon.ico"));
    tray.setToolTip(APP_NAME);
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: "فتح QIROX Studio", click: () => mainWindow?.show() },
      { type: "separator" },
      { label: "خروج", click: () => app.quit() },
    ]));
    tray.on("double-click", () => mainWindow?.show());
  } catch(e) { console.warn("Tray not available:", e.message); }

  mainWindow.on("closed", () => { mainWindow = null; });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (!mainWindow) createWindow(); });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Auto-updater events
autoUpdater.on("update-available", () => {
  mainWindow?.webContents.send("update-available");
});
autoUpdater.on("update-downloaded", () => {
  mainWindow?.webContents.send("update-downloaded");
});
ipcMain.on("install-update", () => autoUpdater.quitAndInstall());
`);

  // src/preload.js
  zip.folder("src").file("preload.js", `const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  onUpdateAvailable: (cb) => ipcRenderer.on("update-available", cb),
  onUpdateDownloaded: (cb) => ipcRenderer.on("update-downloaded", cb),
  installUpdate: () => ipcRenderer.send("install-update"),
  onThemeChanged: (cb) => ipcRenderer.on("theme-changed", (_, dark) => cb(dark)),
  platform: process.platform,
  version: "${version}",
});`);

  // NSIS custom script
  zip.file("installer.nsh", `!macro customHeader
  !system "echo Building QIROX Studio Installer"
!macroend
!macro customInstall
  WriteRegStr HKCU "Software\\QiroxStudio" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\\QiroxStudio" "Version" "${version}"
!macroend
!macro customUninstall
  DeleteRegKey HKCU "Software\\QiroxStudio"
!macroend`);

  // GitHub Actions
  zip.folder(".github/workflows").file("build-windows.yml", `name: Build Windows App
on:
  push:
    tags: ['v*']
  workflow_dispatch:
jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm install
      - name: Build Windows Installer
        run: npm run dist:win
        env:
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}
      - uses: actions/upload-artifact@v4
        with:
          name: qirox-windows-\${{ github.ref_name }}
          path: dist/*.exe`);

  zip.file("README.md", `# ${appName} — Windows Desktop App (Electron)

## المتطلبات
- Node.js 20+
- npm أو yarn

## خطوات البناء

### 1. تثبيت المتطلبات
\`\`\`bash
npm install
\`\`\`

### 2. تشغيل للاختبار
\`\`\`bash
npm start
\`\`\`

### 3. بناء المثبّت
\`\`\`bash
npm run dist:win    # → dist/qirox-studio-Setup-${version}.exe
npm run dist:msix   # → dist/qirox-studio-${version}.msix (Microsoft Store)
\`\`\`

## ملاحظات
- الرابط: ${siteUrl}
- الإصدار: ${version}
- تاريخ التوليد: ${new Date().toLocaleString("ar-SA")}
`);

  return zip;
}

function generateMacZip(cfg: any, appName: string, version: string, siteUrl: string) {
  const zip = new JSZip();

  // package.json — Electron + electron-builder for macOS
  zip.file("package.json", JSON.stringify({
    name: "qirox-studio-mac",
    version,
    description: `${appName} — macOS Desktop Application`,
    main: "src/main.js",
    private: true,
    scripts: {
      "start": "electron .",
      "pack": "electron-builder --dir",
      "dist": "electron-builder",
      "dist:mac": "electron-builder --mac",
      "dist:dmg": "electron-builder --mac dmg",
      "dist:mas": "electron-builder --mac mas",
      "notarize": "electron-builder --mac dmg --publish never",
    },
    dependencies: { "electron-updater": "^6.1.7" },
    devDependencies: {
      "electron": "^28.0.0",
      "electron-builder": "^24.9.1",
      "@electron/notarize": "^2.1.0",
    },
    build: {
      appId: "online.qiroxstudio.app",
      productName: appName,
      copyright: `Copyright © ${new Date().getFullYear()} QIROX Studio`,
      directories: { output: "dist", buildResources: "assets" },
      files: ["src/**/*", "assets/**/*"],
      mac: {
        category: "public.app-category.business",
        target: [
          { target: "dmg", arch: ["x64", "arm64"] },
          { target: "zip", arch: ["x64", "arm64"] },
          { target: "mas", arch: ["x64", "arm64"] },
        ],
        icon: "assets/icon.icns",
        darkModeSupport: true,
        hardenedRuntime: true,
        gatekeeperAssess: false,
        entitlements: "assets/entitlements.mac.plist",
        entitlementsInherit: "assets/entitlements.mac.inherit.plist",
        extendInfo: {
          NSCameraUsageDescription: "يستخدم التطبيق الكاميرا لمسح الرمز",
          NSMicrophoneUsageDescription: "يستخدم التطبيق الميكروفون للاجتماعات",
          NSAppTransportSecurity: { NSAllowsArbitraryLoads: true },
        },
        artifactName: "\${productName}-\${version}-\${arch}.dmg",
      },
      dmg: {
        title: `${appName} \${version}`,
        background: "assets/dmg-background.png",
        icon: "assets/icon.icns",
        iconSize: 128,
        window: { width: 660, height: 400 },
        contents: [
          { x: 200, y: 200, type: "file" },
          { x: 460, y: 200, type: "link", path: "/Applications" },
        ],
        format: "ULFO",
      },
      mas: {
        entitlements: "assets/entitlements.mas.plist",
        entitlementsInherit: "assets/entitlements.mas.inherit.plist",
        provisioningProfile: "embedded.provisionprofile",
      },
      publish: { provider: "github", releaseType: "release" },
      afterSign: "scripts/notarize.js",
    },
  }, null, 2));

  // src/main.js — Electron main process (macOS optimized)
  zip.folder("src").file("main.js", `const { app, BrowserWindow, Menu, Tray, shell, ipcMain, nativeTheme, systemPreferences } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

const APP_URL = "${siteUrl}";
const APP_NAME = "${appName}";
let mainWindow = null;
let tray = null;

// ─── Single Instance Lock ───────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); }
else {
  app.on("second-instance", () => {
    if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); }
  });
}

function createWindow() {
  // ─── Dark/Light icon for dock ───────────────────────────
  const isDark = nativeTheme.shouldUseDarkColors;

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 640,
    title: APP_NAME,
    icon: path.join(__dirname, isDark ? "../assets/icon-dark.icns" : "../assets/icon.icns"),
    backgroundColor: isDark ? "#030712" : "#ffffff",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 18, y: 18 },
    vibrancy: "under-window",
    visualEffectState: "active",
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, "preload.js"),
    },
    show: false,
  });

  mainWindow.loadURL(APP_URL);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
    if (app.isPackaged) autoUpdater.checkForUpdatesAndNotify();
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // ─── Dark mode sync ───────────────────────────────────────
  nativeTheme.on("updated", () => {
    const dark = nativeTheme.shouldUseDarkColors;
    mainWindow?.webContents.send("theme-changed", dark);
    // Update dock icon
    try {
      const iconPath = path.join(__dirname, dark ? "../assets/icon-dark.icns" : "../assets/icon.icns");
      if (process.platform === "darwin") app.dock.setIcon(iconPath);
    } catch(e) {}
  });

  // ─── macOS Touch Bar ──────────────────────────────────────
  try {
    const { TouchBar, TouchBarButton } = require("electron");
    const tb = new TouchBar({
      items: [
        new TouchBarButton({ label: "لوحة التحكم", click: () => mainWindow?.loadURL(APP_URL + "/dashboard") }),
        new TouchBarButton({ label: "الطلبات", click: () => mainWindow?.loadURL(APP_URL + "/orders") }),
        new TouchBarButton({ label: "تواصل", click: () => mainWindow?.loadURL(APP_URL + "/contact") }),
      ]
    });
    mainWindow.setTouchBar(tb);
  } catch(e) {}

  mainWindow.on("closed", () => { mainWindow = null; });
}

// ─── macOS Dock Menu ──────────────────────────────────────────
app.whenReady().then(() => {
  // Set dock icon dark mode
  const isDark = nativeTheme.shouldUseDarkColors;
  try {
    if (process.platform === "darwin") {
      const iconFile = isDark ? "icon-dark.icns" : "icon.icns";
      app.dock.setIcon(path.join(__dirname, "../assets/" + iconFile));
      app.dock.setMenu(Menu.buildFromTemplate([
        { label: "طلب جديد", click: () => { createWindow(); mainWindow?.loadURL(APP_URL + "/order"); } },
        { label: "لوحة التحكم", click: () => { createWindow(); mainWindow?.loadURL(APP_URL + "/dashboard"); } },
      ]));
    }
  } catch(e) {}

  createWindow();
  app.on("activate", () => { if (!mainWindow) createWindow(); });
});

// ─── macOS Menu ───────────────────────────────────────────────
const menuTemplate = [
  { label: app.name, submenu: [
    { role: "about" },
    { type: "separator" },
    { label: "الإعدادات...", accelerator: "Cmd+,", click: () => mainWindow?.loadURL(APP_URL + "/dashboard") },
    { type: "separator" },
    { role: "services" },
    { type: "separator" },
    { role: "hide" },
    { role: "hideOthers" },
    { role: "unhide" },
    { type: "separator" },
    { role: "quit" },
  ]},
  { label: "تحرير", submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" }] },
  { label: "عرض", submenu: [{ role: "reload" }, { role: "forceReload" }, { type: "separator" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { type: "separator" }, { role: "togglefullscreen" }] },
  { label: "نافذة", role: "windowMenu" },
  { label: "مساعدة", submenu: [
    { label: "فتح في المتصفح", click: () => shell.openExternal(APP_URL) },
    { label: "اتصل بنا", click: () => mainWindow?.loadURL(APP_URL + "/contact") },
  ]},
];
Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate as any));

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ─── Auto-updater ─────────────────────────────────────────────
autoUpdater.on("update-available", () => mainWindow?.webContents.send("update-available"));
autoUpdater.on("update-downloaded", () => mainWindow?.webContents.send("update-downloaded"));
ipcMain.on("install-update", () => autoUpdater.quitAndInstall());
`);

  // src/preload.js
  zip.folder("src").file("preload.js", `const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  onUpdateAvailable: (cb) => ipcRenderer.on("update-available", cb),
  onUpdateDownloaded: (cb) => ipcRenderer.on("update-downloaded", cb),
  installUpdate: () => ipcRenderer.send("install-update"),
  onThemeChanged: (cb) => ipcRenderer.on("theme-changed", (_, dark) => cb(dark)),
  platform: process.platform,
  version: "${version}",
  isMac: process.platform === "darwin",
});`);

  // assets/entitlements.mac.plist
  zip.folder("assets").file("entitlements.mac.plist", `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key><true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key><true/>
  <key>com.apple.security.network.client</key><true/>
  <key>com.apple.security.network.server</key><true/>
  <key>com.apple.security.device.camera</key><true/>
  <key>com.apple.security.device.microphone</key><true/>
  <key>com.apple.security.personal-information.location</key><true/>
  <key>com.apple.security.cs.disable-library-validation</key><true/>
</dict>
</plist>`);

  zip.folder("assets").file("entitlements.mac.inherit.plist", `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key><true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key><true/>
  <key>com.apple.security.network.client</key><true/>
</dict>
</plist>`);

  zip.folder("assets").file("entitlements.mas.plist", `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.app-sandbox</key><true/>
  <key>com.apple.security.network.client</key><true/>
  <key>com.apple.security.network.server</key><true/>
  <key>com.apple.security.device.camera</key><true/>
  <key>com.apple.security.device.microphone</key><true/>
  <key>com.apple.security.files.user-selected.read-write</key><true/>
</dict>
</plist>`);

  zip.folder("assets").file("entitlements.mas.inherit.plist", `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.app-sandbox</key><true/>
  <key>com.apple.security.inherit</key><true/>
</dict>
</plist>`);

  // scripts/notarize.js — Apple Notarization
  zip.folder("scripts").file("notarize.js", `const { notarize } = require("@electron/notarize");
exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== "darwin") return;
  const appName = context.packager.appInfo.productFilename;
  return await notarize({
    tool: "notarytool",
    appBundleId: "online.qiroxstudio.app",
    appPath: \`\${appOutDir}/\${appName}.app\`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
};`);

  // GitHub Actions CI/CD — Build macOS DMG
  zip.folder(".github/workflows").file("build-macos.yml", `name: Build macOS App
on:
  push:
    tags: ['v*']
  workflow_dispatch:
jobs:
  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm install
      - name: Build macOS DMG (Intel + Apple Silicon)
        run: npm run dist:mac
        env:
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          APPLE_ID: \${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: \${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
          APPLE_TEAM_ID: \${{ secrets.APPLE_TEAM_ID }}
          CSC_LINK: \${{ secrets.MAC_CERTS }}
          CSC_KEY_PASSWORD: \${{ secrets.MAC_CERTS_PASSWORD }}
      - uses: actions/upload-artifact@v4
        with:
          name: qirox-macos-\${{ github.ref_name }}
          path: |
            dist/*.dmg
            dist/*.zip`);

  zip.file("README.md", `# ${appName} — macOS Desktop App (Electron)

## المتطلبات
- macOS 12 (Monterey) أو أحدث
- Node.js 20+
- npm أو yarn
- حساب Apple Developer ($99/سنة) — للتوقيع والتوزيع
- Xcode Command Line Tools

## خطوات البناء

### 1. تثبيت المتطلبات
\`\`\`bash
xcode-select --install
npm install
\`\`\`

### 2. إضافة أيقونات الوضع الليلي والنهاري
ضع في مجلد assets/:
- icon.icns       — أيقونة الوضع النهاري (فاتح)
- icon-dark.icns  — أيقونة الوضع الليلي (داكن) ← مهم جداً
- dmg-background.png — خلفية نافذة التثبيت (660x400)

### 3. تشغيل للاختبار
\`\`\`bash
npm start
\`\`\`

### 4. بناء DMG
\`\`\`bash
npm run dist:dmg  # → dist/${appName}-${version}-x64.dmg (Intel)
                  # → dist/${appName}-${version}-arm64.dmg (Apple Silicon M1/M2/M3)
\`\`\`

### 5. بناء لـ Mac App Store (اختياري)
\`\`\`bash
npm run dist:mas  # → dist/mas/${appName}-${version}.pkg
\`\`\`

### 6. متغيرات البيئة للتوقيع والـ Notarization
\`\`\`bash
export APPLE_ID="your@email.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"
\`\`\`

## الميزات المضمّنة
- ✅ دعم Apple Silicon (M1/M2/M3) وIntel بشكل تلقائي
- ✅ الوضع الليلي والنهاري (Dark/Light mode) مع أيقونة مخصصة لكل وضع
- ✅ Vibrancy Effect (تأثير الشفافية macOS)
- ✅ Hidden Title Bar + Traffic Lights مخصصة
- ✅ Touch Bar دعم
- ✅ Dock Menu مخصص
- ✅ Auto-Updater تلقائي
- ✅ Notarization (Apple أمان)
- ✅ Sandboxing للأمان
- ✅ قائمة macOS كاملة بالعربية

## ملاحظات
- الرابط: ${siteUrl}
- الإصدار: ${version}
- تاريخ التوليد: ${new Date().toLocaleString("ar-SA")}
`);

  return zip;
}

function generateIosZip(cfg: any, appName: string, bundleId: string, version: string, siteUrl: string) {
  const zip = new JSZip();
  const safeName = appName.replace(/\s+/g, "");

  // capacitor.config.json
  zip.file("capacitor.config.json", JSON.stringify({
    appId: bundleId || "com.qirox.studio",
    appName,
    webDir: "www",
    server: { url: siteUrl, cleartext: false, allowNavigation: [siteUrl.replace(/https?:\/\//, "")] },
    ios: {
      contentInset: "automatic",
      allowsLinkPreview: false,
      scrollEnabled: true,
      limitsNavigationsToAppBoundDomains: false,
      preferredContentMode: "mobile",
    },
    plugins: {
      PushNotifications: { presentationOptions: ["badge", "sound", "alert"] },
      SplashScreen: { launchShowDuration: 2000, backgroundColor: "#282828", androidSplashResourceName: "splash", showSpinner: false },
      StatusBar: { style: "Light", backgroundColor: "#000000" },
    },
  }, null, 2));

  // package.json
  zip.file("package.json", JSON.stringify({
    name: "qirox-studio-ios",
    version,
    private: true,
    scripts: {
      "build": "echo 'Web build from ${siteUrl}'",
      "sync": "cap sync",
      "open:ios": "cap open ios",
      "run:ios": "cap run ios",
    },
    dependencies: {
      "@capacitor/core": "^6.0.0",
      "@capacitor/ios": "^6.0.0",
      "@capacitor/app": "^6.0.0",
      "@capacitor/push-notifications": "^6.0.0",
      "@capacitor/splash-screen": "^6.0.0",
      "@capacitor/status-bar": "^6.0.0",
      "@capacitor/haptics": "^6.0.0",
      "@capacitor/browser": "^6.0.0",
    },
    devDependencies: { "@capacitor/cli": "^6.0.0" },
  }, null, 2));

  // Info.plist
  zip.folder(`ios/${safeName}/App`).file("Info.plist", `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key><string>ar</string>
    <key>CFBundleDisplayName</key><string>${appName}</string>
    <key>CFBundleExecutable</key><string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key><string>${bundleId || "com.qirox.studio"}</string>
    <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
    <key>CFBundleName</key><string>${safeName}</string>
    <key>CFBundleShortVersionString</key><string>${version}</string>
    <key>CFBundleVersion</key><string>${Math.floor(Date.now() / 1000)}</string>
    <key>LSRequiresIPhoneOS</key><true/>
    <key>UIRequiresFullScreen</key><true/>
    <key>UIStatusBarHidden</key><false/>
    <key>UIStatusBarStyle</key><string>UIStatusBarStyleLightContent</string>
    <key>UIViewControllerBasedStatusBarAppearance</key><false/>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
    <key>UISupportedInterfaceOrientations~ipad</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationPortraitUpsideDown</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
    <!-- ═══ Permissions ═══ -->
    <key>NSCameraUsageDescription</key><string>يحتاج التطبيق إلى الكاميرا لرفع الصور والمستندات</string>
    <key>NSMicrophoneUsageDescription</key><string>يحتاج التطبيق إلى الميكروفون للتسجيلات الصوتية</string>
    <key>NSPhotoLibraryUsageDescription</key><string>يحتاج التطبيق إلى مكتبة الصور لرفع الملفات</string>
    <key>NSPhotoLibraryAddUsageDescription</key><string>يحتاج التطبيق إلى حفظ الصور في مكتبتك</string>
    <key>NSLocationWhenInUseUsageDescription</key><string>يحتاج التطبيق إلى موقعك لتقديم الخدمات المحلية</string>
    <key>NSFaceIDUsageDescription</key><string>يستخدم التطبيق Face ID لحماية حسابك</string>
    <key>NSContactsUsageDescription</key><string>يحتاج التطبيق إلى جهات الاتصال لمشاركة البيانات</string>
    <!-- ═══ Background Modes ═══ -->
    <key>UIBackgroundModes</key>
    <array>
        <string>remote-notification</string>
        <string>fetch</string>
        <string>processing</string>
    </array>
    <!-- ═══ App Transport Security ═══ -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key><false/>
        <key>NSExceptionDomains</key>
        <dict>
            <key>${siteUrl.replace(/https?:\/\//, "")}</key>
            <dict>
                <key>NSExceptionAllowsInsecureHTTPLoads</key><false/>
                <key>NSIncludesSubdomains</key><true/>
            </dict>
        </dict>
    </dict>
</dict>
</plist>`);

  // Podfile
  zip.folder(`ios/${safeName}`).file("Podfile", `require_relative '../node_modules/@capacitor/ios/scripts/pods_helpers'

platform :ios, '14.0'
use_frameworks!

target '${safeName}' do
  capacitor_pods
  pod 'Capacitor', :path => '../node_modules/@capacitor/ios'
  pod 'CapacitorApp', :path => '../node_modules/@capacitor/app'
  pod 'CapacitorPushNotifications', :path => '../node_modules/@capacitor/push-notifications'
  pod 'CapacitorSplashScreen', :path => '../node_modules/@capacitor/splash-screen'
  pod 'CapacitorStatusBar', :path => '../node_modules/@capacitor/status-bar'
end

post_install do |installer|
  assertDeploymentTarget(installer)
end`);

  // AppDelegate.swift
  zip.folder(`ios/${safeName}/App`).file("AppDelegate.swift", `import UIKit
import Capacitor
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Request push notification permission
        UNUserNotificationCenter.current().delegate = self
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
            if granted { DispatchQueue.main.async { application.registerForRemoteNotifications() } }
        }
        return true
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    // Push notification handlers
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }
}`);

  zip.file("README.md", `# ${appName} — iOS App (Capacitor)

## المتطلبات
- Mac مع macOS 13+
- Xcode 15+
- CocoaPods
- Node.js 20+
- حساب Apple Developer ($99/سنة)

## خطوات البناء

### 1. تثبيت المتطلبات
\`\`\`bash
npm install
npx cap sync
\`\`\`

### 2. تثبيت CocoaPods
\`\`\`bash
cd ios/${safeName} && pod install
\`\`\`

### 3. فتح في Xcode
\`\`\`bash
npx cap open ios
\`\`\`

### 4. الإعدادات في Xcode
- Signing & Capabilities → اختر Team والـ Bundle ID: ${bundleId || "com.qirox.studio"}
- Product → Archive

### 5. الرفع على App Store Connect
- Organizer → Distribute App → App Store Connect → Upload

## ملاحظات
- الرابط: ${siteUrl}
- الإصدار: ${version}
- تاريخ التوليد: ${new Date().toLocaleString("ar-SA")}
`);

  return zip;
}

function generateHarmonyZip(cfg: any, appName: string, version: string, siteUrl: string, pkgName: string) {
  const zip = new JSZip();
  const versionCode = Math.floor(Date.now() / 1000) % 100000;

  // AppScope/app.json5
  zip.folder("AppScope").file("app.json5", JSON.stringify({
    app: {
      bundleName: pkgName || "com.qirox.studio.harmony",
      vendor: "QIROX Studio",
      versionCode,
      versionName: version,
      icon: "$media:app_icon",
      label: "$string:app_name",
      distributionFilter: { apiVersion: { policy: "include", value: [10, 11, 12, 13] } },
    }
  }, null, 2));

  // AppScope/resources/base/element/string.json
  zip.folder("AppScope/resources/base/element").file("string.json", JSON.stringify({
    string: [
      { name: "app_name", value: appName },
      { name: "app_name_ar", value: "نظام QIROX" },
      { name: "site_url", value: siteUrl },
    ]
  }, null, 2));

  // entry/src/main/module.json5
  zip.folder("entry/src/main").file("module.json5", JSON.stringify({
    module: {
      name: "entry",
      type: "entry",
      description: "$string:app_name",
      mainElement: "EntryAbility",
      deviceTypes: ["phone", "tablet", "2in1"],
      deliveryWithInstall: true,
      installationFree: false,
      pages: "$profile:main_pages",
      abilities: [{
        name: "EntryAbility",
        srcEntry: "./ets/entryability/EntryAbility.ets",
        description: "$string:EntryAbility_desc",
        icon: "$media:ic_launcher",
        label: "$string:app_name",
        startWindowIcon: "$media:startIcon",
        startWindowBackground: "$color/start_window_background",
        exported: true,
        skills: [{
          entities: ["entity.system.home"],
          actions: ["action.system.home"],
        }],
        metadata: [{ name: "site_url", value: siteUrl }],
      }],
      requestPermissions: [
        { name: "ohos.permission.INTERNET" },
        { name: "ohos.permission.CAMERA", reason: "$string:camera_reason", usedScene: { abilities: ["EntryAbility"], when: "inuse" } },
        { name: "ohos.permission.MICROPHONE", reason: "$string:mic_reason", usedScene: { abilities: ["EntryAbility"], when: "inuse" } },
        { name: "ohos.permission.READ_MEDIA", reason: "$string:storage_reason" },
        { name: "ohos.permission.WRITE_MEDIA", reason: "$string:storage_reason" },
        { name: "ohos.permission.APPROXIMATELY_LOCATION", reason: "$string:location_reason", usedScene: { abilities: ["EntryAbility"], when: "inuse" } },
        { name: "ohos.permission.RECEIVE_NOTIFICATION_BADGE" },
        { name: "ohos.permission.USE_BIOMETRIC", reason: "$string:biometric_reason" },
      ],
    }
  }, null, 2));

  // entry/src/main/ets/entryability/EntryAbility.ets
  zip.folder("entry/src/main/ets/entryability").file("EntryAbility.ets", `import UIAbility from '@ohos.app.ability.UIAbility';
import hilog from '@ohos.hilog';
import window from '@ohos.window';
import promptAction from '@ohos.promptAction';

const SITE_URL = '${siteUrl}';
const TAG = 'QIROXStudio';

export default class EntryAbility extends UIAbility {

  onCreate(want, launchParam): void {
    hilog.info(0x0000, TAG, 'QIROX Studio launched — %{public}s', SITE_URL);
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    // ─── Full-screen immersive window ──────────────────────
    windowStage.getMainWindow((err, win) => {
      if (err.code) { hilog.error(0x0000, TAG, 'Window error: %{public}s', JSON.stringify(err)); return; }
      win.setWindowLayoutFullScreen(true);
      win.setWindowSystemBarProperties({ statusBarColor: '#000000', statusBarContentColor: '#FFFFFF', navigationBarColor: '#000000', navigationBarContentColor: '#FFFFFF' });
    });

    // ─── Load WebView page ─────────────────────────────────
    windowStage.loadContent('pages/Index', (err) => {
      if (err.code) {
        hilog.error(0x0000, TAG, 'Page load error: %{public}s', JSON.stringify(err));
        return;
      }
      hilog.info(0x0000, TAG, 'Page loaded successfully');
    });
  }

  onForeground(): void { hilog.info(0x0000, TAG, 'App in foreground'); }
  onBackground(): void { hilog.info(0x0000, TAG, 'App in background'); }
  onDestroy(): void { hilog.info(0x0000, TAG, 'App destroyed'); }
}`);

  // entry/src/main/ets/pages/Index.ets
  zip.folder("entry/src/main/ets/pages").file("Index.ets", `import web_webview from '@ohos.web.webview';
import promptAction from '@ohos.promptAction';
import router from '@ohos.router';

const SITE_URL = '${siteUrl}';
const APP_NAME = '${appName}';

@Entry
@Component
struct Index {
  controller: web_webview.WebviewController = new web_webview.WebviewController();
  @State showLoading: boolean = true;
  @State loadProgress: number = 0;
  @State errorCode: number = 0;

  build() {
    Stack({ alignContent: Alignment.Top }) {
      // ─── WebView ──────────────────────────────────────────
      Web({ src: SITE_URL, controller: this.controller })
        .width('100%')
        .height('100%')
        .backgroundColor(Color.Black)
        .javaScriptAccess(true)
        .fileAccess(true)
        .domStorageAccess(true)
        .imageAccess(true)
        .onlineImageAccess(true)
        .cacheMode(CacheMode.Default)
        .mixedMode(MixedMode.None)
        .geolocationAccess(true)
        .userAgent('QIROX-HarmonyOS/${version} HarmonyOS WebView')
        .onProgressChange((event) => {
          this.loadProgress = event.newProgress;
          this.showLoading = event.newProgress < 100;
        })
        .onErrorReceive((event) => {
          this.errorCode = event.error.getErrorCode();
          hilog.error(0x0000, 'WebView', 'Load error: %{public}d', this.errorCode);
        })
        .onPageEnd(() => { this.showLoading = false; })

      // ─── Loading Bar ───────────────────────────────────────
      if (this.showLoading) {
        Column() {
          Progress({ value: this.loadProgress, total: 100, type: ProgressType.Linear })
            .width('100%')
            .height(3)
            .color(Color.White)
        }
        .width('100%')
        .backgroundColor(Color.Black)
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor(Color.Black)
  }
}`);

  // build-profile.json5
  zip.file("build-profile.json5", JSON.stringify({
    app: {
      signingConfigs: [{
        name: "release",
        material: { certpath: "release.cer", storePassword: "your_store_password", KeyAlias: "qirox", keyPassword: "your_key_password", profile: "release.p7b", signAlg: "SHA256withECDSA", storeFile: "release.p12" }
      }],
      compileSdkVersion: 12,
      compatibleSdkVersion: 10,
      products: [{
        name: "default",
        signingConfig: "release",
        compileSdkVersion: 12,
        compatibleSdkVersion: 10,
        runtimeOS: "HarmonyOS",
        buildOption: { strictMode: { caseSensitiveCheck: true } },
      }],
    },
    modules: [{ name: "entry", srcPath: "./entry", targets: [{ name: "default", applyToProducts: ["default"] }] }],
  }, null, 2));

  // hvigorfile.ts
  zip.file("hvigorfile.ts", `import { appTasks } from '@ohos/hvigor-ohos-plugin';
export default {
  system: appTasks,
  plugins: []
}`);

  zip.file("README.md", `# ${appName} — HarmonyOS App (HAP)

## المتطلبات
- DevEco Studio 4.0+
- HarmonyOS SDK 4.0+
- حساب Huawei Developer (مجاني)

## خطوات البناء

### 1. فتح المشروع
DevEco Studio → Open → اختر هذا المجلد

### 2. إعداد التوقيع (Signing)
- File → Project Structure → Signing Configs
- أضف ملفات .p12 و .cer و .p7b من AppGallery Connect

### 3. بناء HAP
- Build → Build Hap(s)/APP(s) → Build APP(s)
- أو: Build → Generate Key and CSR

### 4. الرفع على AppGallery Connect
- My apps → يطبيق الخاص بك → Software Versions → New Version → ارفع ملف .app

## ملاحظات
- الرابط: ${siteUrl}
- الإصدار: ${version}
- Package: ${pkgName || "com.qirox.studio.harmony"}
- تاريخ التوليد: ${new Date().toLocaleString("ar-SA")}
`);

  return zip;
}

// ─── Main Component ──────────────────────────────────────────
export default function AdminAppPublish() {
  const { toast } = useToast();
  const { lang, dir } = useI18n();
  const L = lang === "ar";
  const qc = useQueryClient();

  const { data: cfg, isLoading } = useQuery<any>({ queryKey: ["/api/admin/store-publish-config"] });
  const [form, setForm] = useState<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Builder state
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("android");
  const [buildPerms, setBuildPerms] = useState<string[]>(["internet", "notifications", "storage"]);
  const [buildVer, setBuildVer] = useState("1.0.0");
  const [generating, setGenerating] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [generatedPackages, setGeneratedPackages] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem("qirox_generated_packages") || "[]"); } catch { return []; }
  });

  const saveMutation = useMutation({
    mutationFn: (d: any) => apiRequest("PUT", "/api/admin/store-publish-config", d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/store-publish-config"] }); setSettingsOpen(false); toast({ title: L ? "تم حفظ الإعدادات ✓" : "Settings saved ✓" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  // ─── Play Console Checklist State ────────────────────────
  const [playChecks, setPlayChecks] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("qirox_play_checks") || "{}"); } catch { return {}; }
  });
  const togglePlayCheck = (id: string) => {
    const next = { ...playChecks, [id]: !playChecks[id] };
    setPlayChecks(next);
    localStorage.setItem("qirox_play_checks", JSON.stringify(next));
  };

  // ─── Closed Testing Tracker ───────────────────────────────
  const [closedTestStart, setClosedTestStart] = useState<string>(() =>
    localStorage.getItem("qirox_closed_test_start") || ""
  );
  const [testerCount, setTesterCount] = useState<number>(() =>
    parseInt(localStorage.getItem("qirox_tester_count") || "0", 10)
  );
  const saveClosedTest = (start: string, count: number) => {
    setClosedTestStart(start); setTesterCount(count);
    localStorage.setItem("qirox_closed_test_start", start);
    localStorage.setItem("qirox_tester_count", count.toString());
  };
  const closedTestDays = closedTestStart
    ? Math.floor((Date.now() - new Date(closedTestStart).getTime()) / 86400000)
    : 0;
  const closedTestDone = testerCount >= 12 && closedTestDays >= 14;

  // ─── Quick fingerprint inline save (Android) ─────────────
  const [quickPkg, setQuickPkg] = useState("");
  const [quickFp, setQuickFp] = useState("");

  // ─── Apple App Store Checklist ───────────────────────────
  const [appleChecks, setAppleChecks] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("qirox_apple_checks") || "{}"); } catch { return {}; }
  });
  const toggleAppleCheck = (id: string) => {
    const next = { ...appleChecks, [id]: !appleChecks[id] };
    setAppleChecks(next);
    localStorage.setItem("qirox_apple_checks", JSON.stringify(next));
  };

  // ─── TestFlight Tracker ──────────────────────────────────
  const [tfStart, setTfStart] = useState<string>(() =>
    localStorage.getItem("qirox_tf_start") || ""
  );
  const [tfTesters, setTfTesters] = useState<number>(() =>
    parseInt(localStorage.getItem("qirox_tf_testers") || "0", 10)
  );
  const saveTf = (start: string, count: number) => {
    setTfStart(start); setTfTesters(count);
    localStorage.setItem("qirox_tf_start", start);
    localStorage.setItem("qirox_tf_testers", count.toString());
  };
  const tfDays = tfStart
    ? Math.floor((Date.now() - new Date(tfStart).getTime()) / 86400000)
    : 0;
  const tfExpiry = 90 - tfDays;

  // ─── Quick Apple credentials ─────────────────────────────
  const [quickTeamId, setQuickTeamId] = useState("");
  const [quickBundleId, setQuickBundleId] = useState("");

  // ─── Apple Pay Checklist ──────────────────────────────────
  const [applePayChecks, setApplePayChecks] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("qirox_applepay_checks") || "{}"); } catch { return {}; }
  });
  const toggleApplePayCheck = (id: string) => {
    const next = { ...applePayChecks, [id]: !applePayChecks[id] };
    setApplePayChecks(next); localStorage.setItem("qirox_applepay_checks", JSON.stringify(next));
  };
  const applePaySteps = [
    "merchant_id", "domain_verify", "cert_csr", "cert_upload",
    "entitlement", "stripe_applepay", "test_sandbox", "go_live",
  ];
  const applePayDone = applePaySteps.filter(s => applePayChecks[s]).length;

  // ─── QPAY Wallet Checklist ────────────────────────────────
  const [qpayChecks, setQpayChecks] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("qirox_qpay_checks") || "{}"); } catch { return {}; }
  });
  const toggleQpayCheck = (id: string) => {
    const next = { ...qpayChecks, [id]: !qpayChecks[id] };
    setQpayChecks(next); localStorage.setItem("qirox_qpay_checks", JSON.stringify(next));
  };
  const qpaySteps = ["pass_cert", "pass_type_id", "template_design", "pass_server", "sign_pass", "api_endpoint", "test_add", "push_update"];
  const qpayDone = qpaySteps.filter(s => qpayChecks[s]).length;

  const data = form || cfg || {};
  const f = (k: string, v: string) => setForm((prev: any) => ({ ...(prev || cfg || {}), [k]: v }));
  const openSettings = () => { setForm({ ...(cfg || {}) }); setSettingsOpen(true); };

  const hasAndroid = !!(data.androidPackage && data.androidFingerprint);
  const hasHuawei = !!(data.huaweiPackage && data.huaweiFingerprint);
  const hasApple = !!(data.appleTeamId && data.appleBundleId);
  const hasMs = !!(data.msAppId);
  const siteUrl = data.siteUrl || "https://qiroxstudio.online";
  const appName = data.appName || "QIROX Studio";

  const assetlinksJson = JSON.stringify([
    ...(hasAndroid ? [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: data.androidPackage, sha256_cert_fingerprints: [data.androidFingerprint] } }] : []),
    ...(hasHuawei ? [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: data.huaweiPackage, sha256_cert_fingerprints: [data.huaweiFingerprint] } }] : []),
  ], null, 2);

  const aasaJson = JSON.stringify({
    applinks: { apps: [], details: hasApple ? [{ appID: `${data.appleTeamId}.${data.appleBundleId}`, paths: ["*"] }] : [] },
    webcredentials: { apps: hasApple ? [`${data.appleTeamId}.${data.appleBundleId}`] : [] }
  }, null, 2);

  const bubblewrapConfig = JSON.stringify({
    packageId: data.androidPackage || "com.qirox.studio",
    host: siteUrl.replace("https://", ""),
    name: appName,
    launcherName: data.appNameAr || "كيروكس",
    display: "standalone",
    startUrl: "/?source=twa",
    iconUrl: `${siteUrl}/icon-512.png`,
    maskableIconUrl: `${siteUrl}/icon-512-maskable.png`,
    backgroundColor: "#000000",
    themeColor: "#000000",
    enableNotifications: true,
    appVersionCode: 1,
    appVersion: data.appVersion || "1.0.0",
  }, null, 2);

  const readinessChecklist = [
    { done: true, label: "manifest.json كامل مع الأيقونات", note: "192×192، 512×512، Maskable" },
    { done: true, label: "Service Worker مُفعَّل", note: "sw.js يعمل ويخزّن الأصول" },
    { done: true, label: "HTTPS مُفعَّل", note: `النطاق: ${siteUrl}` },
    { done: true, label: "start_url محدد", note: "/?source=pwa" },
    { done: true, label: "display: standalone", note: "بدون شريط المتصفح" },
    { done: true, label: "دعم Dark Mode", note: "theme-color محدد" },
    { done: true, label: "browserconfig.xml لـ Microsoft", note: "أيقونات Windows جاهزة" },
    { done: true, label: "Apple meta tags", note: "apple-mobile-web-app-capable" },
    { done: true, label: "screenshots في manifest", note: "narrow + wide" },
    { done: true, label: "shortcuts في manifest", note: "Dashboard + طلب جديد" },
    { done: hasAndroid, label: "assetlinks.json (Android TWA)" },
    { done: hasApple, label: "apple-app-site-association (iOS)" },
    { done: hasMs, label: "Microsoft App ID" },
  ];
  const readyCount = readinessChecklist.filter(x => x.done).length;

  // ─── Download Helper ──────────────────────────────────────
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // ─── Re-download a saved package ──────────────────────────
  const [redownloading, setRedownloading] = useState<number | null>(null);
  const handleRedownload = async (pkg: any) => {
    setRedownloading(pkg.id);
    try {
      let zip: JSZip;
      const perms = pkg.perms || ["internet", "notifications", "storage"];
      switch (pkg.platform) {
        case "android":
          zip = generateAndroidZip(data, perms, appName, data.androidPackage || "com.qirox.studio", pkg.version, siteUrl);
          break;
        case "windows":
          zip = generateWindowsZip(data, appName, pkg.version, siteUrl);
          break;
        case "macos":
          zip = generateMacZip(data, appName, pkg.version, siteUrl);
          break;
        case "ios":
          zip = generateIosZip(data, appName, data.appleBundleId || "com.qirox.studio", pkg.version, siteUrl);
          break;
        case "harmony":
          zip = generateHarmonyZip(data, appName, pkg.version, siteUrl, data.huaweiPackage || "com.qirox.studio.harmony");
          break;
        default:
          throw new Error("منصة غير معروفة");
      }
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } });
      triggerDownload(blob, pkg.filename);
      toast({ title: "✅ تم إعادة تنزيل الحزمة" });
    } catch (err: any) {
      toast({ title: "خطأ في إعادة التنزيل", description: err.message, variant: "destructive" });
    } finally {
      setRedownloading(null);
    }
  };

  // ─── Generate Package ─────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true);
    setBuildProgress(0);
    const platform = PLATFORMS.find(p => p.id === selectedPlatform)!;
    try {
      // Simulate build steps
      const steps = [
        { label: "جمع الإعدادات...", pct: 10 },
        { label: "إنشاء هيكل المشروع...", pct: 30 },
        { label: "توليد ملفات الإعداد...", pct: 55 },
        { label: "إضافة الصلاحيات...", pct: 70 },
        { label: "إعداد CI/CD...", pct: 85 },
        { label: "ضغط الحزمة...", pct: 95 },
        { label: "جاهز للتنزيل!", pct: 100 },
      ];

      let zip: JSZip;
      for (const step of steps) {
        await new Promise(r => setTimeout(r, 180 + Math.random() * 120));
        setBuildProgress(step.pct);
      }

      switch (selectedPlatform) {
        case "android":
          zip = generateAndroidZip(data, buildPerms, appName, data.androidPackage || "com.qirox.studio", buildVer, siteUrl);
          break;
        case "windows":
          zip = generateWindowsZip(data, appName, buildVer, siteUrl);
          break;
        case "macos":
          zip = generateMacZip(data, appName, buildVer, siteUrl);
          break;
        case "ios":
          zip = generateIosZip(data, appName, data.appleBundleId || "com.qirox.studio", buildVer, siteUrl);
          break;
        case "harmony":
          zip = generateHarmonyZip(data, appName, buildVer, siteUrl, data.huaweiPackage || "com.qirox.studio.harmony");
          break;
        default:
          throw new Error("منصة غير معروفة");
      }

      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } });
      const filename = `qirox-studio-${selectedPlatform}-${buildVer}-${Date.now()}.zip`;
      triggerDownload(blob, filename);

      // Save to history
      const pkg = {
        id: Date.now(),
        platform: selectedPlatform,
        platformLabel: platform.label,
        ext: platform.ext,
        version: buildVer,
        filename,
        size: (blob.size / 1024).toFixed(1) + " KB",
        createdAt: new Date().toISOString(),
        perms: [...buildPerms],
      };
      const updated = [pkg, ...generatedPackages].slice(0, 20);
      setGeneratedPackages(updated);
      localStorage.setItem("qirox_generated_packages", JSON.stringify(updated));

      toast({ title: `✅ تم توليد حزمة ${platform.label}`, description: `الملف: ${filename}` });
    } catch (err: any) {
      toast({ title: "خطأ في التوليد", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
      setBuildProgress(0);
    }
  };

  const clearHistory = () => {
    setGeneratedPackages([]);
    localStorage.removeItem("qirox_generated_packages");
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 animate-spin text-black/20" />
    </div>
  );

  return (
    <div dir={dir} className="max-w-5xl mx-auto py-6 px-4">
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-black rounded-2xl flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black">{L ? "مركز نشر التطبيق" : "App Publishing Center"}</h1>
            <p className="text-xs text-black/40 mt-0.5">{L ? "توليد حزم حقيقية · Google Play · App Store · Microsoft Store · App Gallery" : "Generate real packages · Google Play · App Store · Microsoft Store · App Gallery"}</p>
          </div>
        </div>
        <Button onClick={openSettings} variant="outline" className="gap-2 text-sm" data-testid="button-open-store-settings">
          <Settings className="w-4 h-4" /> {L ? "إعدادات المتاجر" : "Store Settings"}
        </Button>
      </div>

      {/* ─── Settings Panel ───────────────────────────────────── */}
      {settingsOpen && (
        <div className="mb-6 p-5 rounded-2xl border border-black/[0.08] bg-black/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-black">{L ? "إعدادات النشر على المتاجر" : "Store Publishing Settings"}</h2>
            <button onClick={() => setSettingsOpen(false)} className="text-black/30 hover:text-black/60 text-xs">✕ {L ? "إغلاق" : "Close"}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">{L ? "عام" : "General"}</p>
              {FIELD(L ? "رابط الموقع" : "Site URL", data.siteUrl || "", v => f("siteUrl", v), { placeholder: "https://qiroxstudio.online" })}
              {FIELD(L ? "اسم التطبيق (English)" : "App Name (English)", data.appName || "", v => f("appName", v))}
              {FIELD(L ? "اسم التطبيق (عربي)" : "App Name (Arabic)", data.appNameAr || "", v => f("appNameAr", v))}
              {FIELD(L ? "الإصدار" : "Version", data.appVersion || "1.0.0", v => f("appVersion", v))}
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Google Play (Android)</p>
              {FIELD("Package Name", data.androidPackage || "", v => f("androidPackage", v), { placeholder: "com.qirox.studio" })}
              {FIELD("SHA-256 Fingerprint", data.androidFingerprint || "", v => f("androidFingerprint", v), { placeholder: "AA:BB:CC:..." })}
              {FIELD(L ? "رابط Google Play" : "Google Play URL", data.playStoreUrl || "", v => f("playStoreUrl", v))}
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Apple App Store</p>
              {FIELD("Team ID", data.appleTeamId || "", v => f("appleTeamId", v), { placeholder: "ABCDE12345" })}
              {FIELD("Bundle ID", data.appleBundleId || "", v => f("appleBundleId", v), { placeholder: "com.qirox.studio" })}
              {FIELD(L ? "رابط App Store" : "App Store URL", data.appStoreUrl || "", v => f("appStoreUrl", v))}
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Huawei App Gallery</p>
              {FIELD("Package Name", data.huaweiPackage || "", v => f("huaweiPackage", v), { placeholder: "com.qirox.studio.huawei" })}
              {FIELD("SHA-256 Fingerprint", data.huaweiFingerprint || "", v => f("huaweiFingerprint", v), { placeholder: "AA:BB:CC:..." })}
              {FIELD(L ? "رابط App Gallery" : "App Gallery URL", data.huaweiStoreUrl || "", v => f("huaweiStoreUrl", v))}
              <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mt-2">Microsoft Store</p>
              {FIELD("MS App Identity", data.msAppId || "", v => f("msAppId", v), { placeholder: "12345YourName.QiroxStudio" })}
              {FIELD(L ? "رابط Microsoft Store" : "Microsoft Store URL", data.msStoreUrl || "", v => f("msStoreUrl", v))}
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="gap-2" data-testid="button-save-store-settings">
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {L ? "حفظ الإعدادات" : "Save Settings"}
            </Button>
          </div>
        </div>
      )}

      {/* ─── Readiness Bar ────────────────────────────────────── */}
      <div className="mb-6 p-4 rounded-2xl border border-black/[0.07] bg-white flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center shrink-0">
          <span className="text-white font-black text-lg">{Math.round((readyCount / readinessChecklist.length) * 100)}%</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-black text-black">{L ? "جاهزية التطبيق للمتاجر" : "App Store Readiness"}</p>
            <span className="text-xs text-black/40">{readyCount} / {readinessChecklist.length} {L ? "معيار" : "criteria"}</span>
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

      <Tabs defaultValue="builder" dir={dir}>
        <TabsList className="mb-5 flex-wrap h-auto gap-1 bg-black/[0.03] p-1 rounded-xl">
          <TabsTrigger value="builder" className="gap-1.5 text-xs data-[state=active]:bg-black data-[state=active]:text-white rounded-lg">
            <Package className="w-3.5 h-3.5" /> {L ? "مولّد الحزم ✨" : "Package Builder ✨"}
          </TabsTrigger>
          <TabsTrigger value="readiness" className="gap-1.5 text-xs data-[state=active]:bg-black data-[state=active]:text-white rounded-lg">
            <Shield className="w-3.5 h-3.5" /> {L ? "حالة الجاهزية" : "Readiness Status"}
          </TabsTrigger>
          <TabsTrigger value="google" className="gap-1.5 text-xs data-[state=active]:bg-black data-[state=active]:text-white rounded-lg">
            <Smartphone className="w-3.5 h-3.5" /> Google Play
          </TabsTrigger>
          <TabsTrigger value="apple" className="gap-1.5 text-xs data-[state=active]:bg-black data-[state=active]:text-white rounded-lg">
            <Apple className="w-3.5 h-3.5" /> App Store
          </TabsTrigger>
          <TabsTrigger value="huawei" className="gap-1.5 text-xs data-[state=active]:bg-black data-[state=active]:text-white rounded-lg">
            <Cpu className="w-3.5 h-3.5" /> Huawei Gallery
          </TabsTrigger>
          <TabsTrigger value="microsoft" className="gap-1.5 text-xs data-[state=active]:bg-black data-[state=active]:text-white rounded-lg">
            <Globe className="w-3.5 h-3.5" /> Microsoft Store
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-1.5 text-xs data-[state=active]:bg-black data-[state=active]:text-white rounded-lg">
            <Download className="w-3.5 h-3.5" /> {L ? "ملفات الربط" : "Linking Files"}
          </TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════════════ */}
        {/* TAB: BUILDER                                        */}
        {/* ════════════════════════════════════════════════════ */}
        <TabsContent value="builder">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Left: Platform selector + config */}
            <div className="lg:col-span-2 space-y-4">
              {/* Platform Cards */}
              <div>
                <p className="text-[11px] font-black text-black/40 uppercase tracking-widest mb-3">{L ? "اختر المنصة المستهدفة" : "Choose Target Platform"}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {PLATFORMS.map(plt => {
                    const Icon = plt.icon;
                    const active = selectedPlatform === plt.id;
                    return (
                      <button
                        key={plt.id}
                        data-testid={`platform-${plt.id}`}
                        onClick={() => setSelectedPlatform(plt.id)}
                        className={`relative p-4 rounded-2xl border-2 text-right transition-all duration-200 ${active ? "border-black bg-black text-white shadow-lg scale-[1.02]" : "border-black/[0.08] bg-white hover:border-black/30 text-black hover:scale-[1.01]"}`}
                      >
                        {plt.badge && (
                          <span className={`absolute top-2 end-2 text-[8px] font-black px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-black text-white"}`}>
                            {plt.badge}
                          </span>
                        )}
                        <Icon className={`w-6 h-6 mb-2 ${active ? "text-white" : plt.color}`} />
                        <p className={`text-sm font-black ${active ? "text-white" : "text-black dark:text-white"}`}>{plt.label}</p>
                        <p className={`text-[10px] mt-0.5 ${active ? "text-white/60" : "text-black/40 dark:text-white/40"}`}>{plt.labelEn}</p>
                        <Badge className={`mt-2 text-[9px] font-black ${active ? "bg-white/20 text-white border-white/20" : "bg-black/[0.04] text-black/50 border-black/10"}`} variant="outline">
                          {plt.ext}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Build Config */}
              <div className="p-4 rounded-2xl border border-black/[0.08] bg-white">
                <p className="text-[11px] font-black text-black/40 uppercase tracking-widest mb-3">{L ? "إعدادات البناء" : "Build Configuration"}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-black/50 block mb-1">{L ? "رقم الإصدار" : "Version Number"}</label>
                    <Input value={buildVer} onChange={e => setBuildVer(e.target.value)} className="text-sm h-9 font-mono" dir="ltr" placeholder="1.0.0" data-testid="input-build-version" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-black/50 block mb-1">{L ? "اسم التطبيق" : "App Name"}</label>
                    <Input value={appName} disabled className="text-sm h-9 opacity-60" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-black/50 block mb-1">{L ? "رابط التطبيق" : "App URL"}</label>
                    <Input value={siteUrl} disabled className="text-sm h-9 opacity-60" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-black/50 block mb-1">Package / Bundle ID</label>
                    <Input
                      value={selectedPlatform === "android" ? (data.androidPackage || "com.qirox.studio") :
                        selectedPlatform === "harmony" ? (data.huaweiPackage || "com.qirox.studio.harmony") :
                        selectedPlatform === "ios" ? (data.appleBundleId || "com.qirox.studio") :
                        selectedPlatform === "macos" ? "online.qiroxstudio.app" : "QiroxStudio.App"}
                      disabled className="text-sm h-9 opacity-60 font-mono" dir="ltr" />
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="p-4 rounded-2xl border border-black/[0.08] bg-white">
                <p className="text-[11px] font-black text-black/40 uppercase tracking-widest mb-3">{L ? "الصلاحيات والأذونات" : "Permissions"}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PERMISSIONS.map(perm => {
                    const active = buildPerms.includes(perm.id);
                    return (
                      <button
                        key={perm.id}
                        data-testid={`perm-${perm.id}`}
                        onClick={() => {
                          if (perm.required) return;
                          setBuildPerms(prev => active ? prev.filter(p => p !== perm.id) : [...prev, perm.id]);
                        }}
                        className={`p-2.5 rounded-xl border text-right transition-all ${active ? "border-black bg-black text-white" : "border-black/[0.08] bg-black/[0.02] text-black hover:border-black/20"} ${perm.required ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <p className={`text-[11px] font-bold ${active ? "text-white" : "text-black"}`}>{perm.label}</p>
                        {perm.required && <p className={`text-[9px] ${active ? "text-white/50" : "text-black/30"}`}>{L ? "مطلوب" : "Required"}</p>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* What's inside */}
              <div className="p-4 rounded-2xl border border-black/[0.06] bg-gradient-to-br from-black/[0.02] to-transparent">
                <p className="text-[11px] font-black text-black/40 uppercase tracking-widest mb-3">{L ? "ما يحتويه الملف المُولَّد" : "What's inside the generated file"}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {selectedPlatform === "android" && [
                    "AndroidManifest.xml (كل الصلاحيات)",
                    "build.gradle (Android Studio)",
                    "bubblewrap.config.json (TWA)",
                    "Trusted Web Activity Setup",
                    "ProGuard Rules (تشفير الكود)",
                    "GitHub Actions CI/CD",
                    "Network Security Config",
                    "Signing Configuration Guide",
                  ].map(i => <div key={i} className="flex items-center gap-1.5 text-black/60"><CheckCheck className="w-3 h-3 text-black dark:text-white shrink-0" />{i}</div>)}

                  {selectedPlatform === "windows" && [
                    "Electron Main Process (main.js)",
                    "NSIS Installer Script",
                    "electron-builder Config",
                    "System Tray Support",
                    "Auto-Updater (electron-updater)",
                    "Context Menu (Arabic)",
                    "GitHub Actions CI/CD",
                    "MSIX Package Config",
                  ].map(i => <div key={i} className="flex items-center gap-1.5 text-black/60"><CheckCheck className="w-3 h-3 text-black dark:text-white shrink-0" />{i}</div>)}

                  {selectedPlatform === "ios" && [
                    "capacitor.config.json",
                    "Info.plist (كل الأذونات)",
                    "AppDelegate.swift",
                    "Podfile (CocoaPods)",
                    "Push Notifications Setup",
                    "Face ID & Biometric",
                    "WKWebView Configuration",
                    "App Transport Security",
                  ].map(i => <div key={i} className="flex items-center gap-1.5 text-black/60"><CheckCheck className="w-3 h-3 text-gray-600 shrink-0" />{i}</div>)}

                  {selectedPlatform === "macos" && [
                    "Electron Main (main.js) macOS",
                    "DMG Config (electron-builder)",
                    "Dark Mode Icon Support ✦",
                    "Vibrancy + Hidden TitleBar",
                    "Touch Bar دعم كامل",
                    "Dock Menu بالعربية",
                    "entitlements.mac.plist",
                    "Apple Notarization Script",
                    "GitHub Actions CI/CD (arm64+x64)",
                    "Mac App Store (MAS) Config",
                  ].map(i => <div key={i} className="flex items-center gap-1.5 text-black/60"><CheckCheck className="w-3 h-3 text-black dark:text-white shrink-0" />{i}</div>)}

                  {selectedPlatform === "harmony" && [
                    "EntryAbility.ets (HarmonyOS)",
                    "WebView Component (Index.ets)",
                    "module.json5 (كل الصلاحيات)",
                    "app.json5 Configuration",
                    "build-profile.json5",
                    "Immersive Full-Screen UI",
                    "hvigorfile.ts (Build Tool)",
                    "String Resources (Arabic)",
                  ].map(i => <div key={i} className="flex items-center gap-1.5 text-black/60"><CheckCheck className="w-3 h-3 text-black dark:text-white shrink-0" />{i}</div>)}
                </div>
              </div>
            </div>

            {/* Right: Generate button + history */}
            <div className="space-y-4">
              {/* Generate Panel */}
              <div className="p-5 rounded-2xl border-2 border-black bg-black text-white">
                <div className="flex items-center gap-2 mb-4">
                  {(() => { const plt = PLATFORMS.find(p => p.id === selectedPlatform)!; const Icon = plt.icon; return <Icon className="w-5 h-5 text-white/70" />; })()}
                  <div>
                    <p className="text-sm font-black">{L ? PLATFORMS.find(p => p.id === selectedPlatform)?.label : PLATFORMS.find(p => p.id === selectedPlatform)?.labelEn}</p>
                    <p className="text-[10px] text-white/50">{PLATFORMS.find(p => p.id === selectedPlatform)?.desc}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {[
                    { label: L ? "الإصدار" : "Version", value: buildVer },
                    { label: L ? "الصلاحيات" : "Permissions", value: `${buildPerms.length} ${L ? "صلاحية" : "permissions"}` },
                    { label: L ? "الملف" : "File", value: `${PLATFORMS.find(p => p.id === selectedPlatform)?.ext} + README` },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between text-[11px]">
                      <span className="text-white/50">{row.label}</span>
                      <span className="text-white font-bold">{row.value}</span>
                    </div>
                  ))}
                </div>

                {generating && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[11px] text-white/60 mb-1.5">
                      <span>{L ? "جاري التوليد..." : "Generating..."}</span>
                      <span>{buildProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
                      <div className="h-full bg-white rounded-full transition-all duration-300" style={{ width: `${buildProgress}%` }} />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  data-testid="button-generate-package"
                  className="w-full bg-white text-black hover:bg-white/90 font-black gap-2 h-11"
                >
                  {generating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {L ? "جاري التوليد..." : "Generating..."}</>
                  ) : (
                    <><FileArchive className="w-4 h-4" /> {L ? "توليد وتنزيل الحزمة" : "Generate & Download Package"}</>
                  )}
                </Button>

                <p className="text-[10px] text-white/40 mt-3 text-center leading-relaxed">
                  {L ? "الحزمة تحتوي مشروعاً كاملاً جاهزاً للبناء إلى تطبيق حقيقي" : "The package contains a complete project ready to build into a real app"}
                </p>
              </div>

              {/* Info box */}
              <div className="p-4 rounded-2xl border border-black/[0.08] bg-white">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-black dark:text-white shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-black mb-1">{L ? "كيف يعمل؟" : "How does it work?"}</p>
                    <p className="text-[11px] text-black/50 leading-relaxed">
                      {L ? "الملف المُولَّد هو مشروع كامل (ZIP) يحتوي جميع الملفات اللازمة لبناء تطبيق حقيقي. افتحه في البيئة المناسبة (Android Studio / VS Code / Xcode / DevEco) واتبع README." : "The generated file is a complete project (ZIP) with all files needed to build a real app. Open it in the appropriate environment (Android Studio / VS Code / Xcode / DevEco) and follow the README."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Generated Packages History */}
              {generatedPackages.length > 0 && (
                <div className="p-4 rounded-2xl border border-black/[0.08] bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-black text-black/50 uppercase tracking-widest">{L ? "الحزم السابقة" : "Previous Packages"}</p>
                    <button onClick={clearHistory} className="text-[10px] text-black/70 dark:text-white/70 hover:text-black dark:text-white flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> {L ? "مسح" : "Clear"}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {generatedPackages.slice(0, 6).map(pkg => {
                      const plt = PLATFORMS.find(p => p.id === pkg.platform);
                      const Icon = plt?.icon || Package;
                      return (
                        <div key={pkg.id} data-testid={`pkg-${pkg.id}`} className="flex items-center gap-2 p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.05]">
                          <Icon className={`w-4 h-4 shrink-0 ${plt?.color || "text-black/40"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-black dark:text-white truncate">{pkg.platformLabel}</p>
                            <p className="text-[9px] text-black/40 dark:text-white/30 font-mono">v{pkg.version} · {pkg.size}</p>
                          </div>
                          <Badge variant="outline" className="text-[9px] shrink-0">{pkg.ext}</Badge>
                          <button
                            onClick={() => handleRedownload(pkg)}
                            disabled={redownloading === pkg.id}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.10] transition-colors shrink-0 disabled:opacity-70"
                            title={L ? "إعادة تنزيل" : "Re-download"}
                            data-testid={`btn-redownload-${pkg.id}`}
                          >
                            {redownloading === pkg.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black/50 dark:text-white/50" />
                              : <Download className="w-3.5 h-3.5 text-black/50 dark:text-white/50" />
                            }
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════ */}
        {/* TAB: READINESS                                      */}
        {/* ════════════════════════════════════════════════════ */}
        <TabsContent value="readiness">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-3">{L ? "المتطلبات التقنية" : "Technical Requirements"}</p>
              {readinessChecklist.slice(0, 7).map((item, i) => <ReadinessItem key={i} {...item} />)}
            </div>
            <div>
              <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-3">{L ? "إعدادات المتاجر" : "Store Settings"}</p>
              {readinessChecklist.slice(7).map((item, i) => <ReadinessItem key={i} {...item} />)}
              {!hasAndroid || !hasApple || !hasMs ? (
                <div className="mt-3 p-3 bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 rounded-xl text-xs text-black dark:text-white">
                  {L ? 'لإكمال الجاهزية، اضغط على "إعدادات المتاجر" أعلاه وأدخل البيانات.' : 'To complete readiness, click "Store Settings" above and enter your data.'}
                </div>
              ) : (
                <div className="mt-3 p-3 bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 rounded-xl text-xs text-black dark:text-white font-bold">
                  {L ? "🎉 التطبيق جاهز للنشر على جميع المتاجر!" : "🎉 The app is ready to publish on all stores!"}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════ */}
        {/* TAB: GOOGLE PLAY — FULL INTERACTIVE GUIDE          */}
        {/* ════════════════════════════════════════════════════ */}
        <TabsContent value="google">
          <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black dark:bg-white flex items-center justify-center shadow-sm">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black text-black">Google Play Store</h2>
                  <p className="text-[10px] text-black/40">دليل الرفع الكامل خطوة بخطوة — Trusted Web Activity (TWA)</p>
                </div>
              </div>
              {data.playStoreUrl
                ? <a href={data.playStoreUrl} target="_blank" rel="noopener noreferrer"><Badge className="gap-1 bg-black dark:bg-white text-white text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> منشور على Play Store</Badge></a>
                : <Badge variant="outline" className="text-xs text-black dark:text-white border-black/10 dark:border-white/10 gap-1"><Clock className="w-3 h-3" /> في انتظار النشر</Badge>
              }
            </div>

            {/* === SECTION 1: TWO PATHS === */}
            <div>
              <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-3">الخطوة 1 — احصل على ملف AAB</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Path A: PWABuilder */}
                <div className="p-4 rounded-2xl border-2 border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.06]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-black dark:bg-white flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-white" /></div>
                    <span className="text-sm font-black text-black dark:text-white">المسار الأسرع — بدون كود</span>
                    <Badge className="text-[9px] bg-black dark:bg-white text-white mr-auto">موصى به ✓</Badge>
                  </div>
                  <ol className="space-y-2 text-[11px] text-black dark:text-white">
                    {[
                      { n: 1, t: "افتح PWABuilder في متصفحك", sub: "pwabuilder.com" },
                      { n: 2, t: "اكتب رابط موقعك واضغط Start", sub: siteUrl },
                      { n: 3, t: 'اختر "Android" ثم اضغط Download Package', sub: "ستحصل على ZIP يحتوي AAB + assetlinks.json" },
                      { n: 4, t: "الـ AAB جاهز للرفع على Play Console", sub: "لا تحتاج Android Studio أو Gradle" },
                    ].map(s => (
                      <li key={s.n} className="flex gap-2">
                        <span className="w-5 h-5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-[9px] font-black text-black dark:text-white shrink-0 mt-0.5">{s.n}</span>
                        <div>
                          <span className="font-bold">{s.t}</span>
                          {s.sub && <p className="text-black dark:text-white font-mono text-[10px] mt-0.5">{s.sub}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                  <a href="https://www.pwabuilder.com" target="_blank" rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-black dark:bg-white text-white text-xs font-black hover:bg-black dark:bg-white transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" /> فتح pwabuilder.com
                  </a>
                </div>

                {/* Path B: Android Studio */}
                <div className="p-4 rounded-2xl border border-black/[0.08] bg-white">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center"><Box className="w-3.5 h-3.5 text-white" /></div>
                    <span className="text-sm font-black text-black">المسار المتقدم — Android Studio</span>
                  </div>
                  <ol className="space-y-2 text-[11px] text-black/60">
                    {[
                      { n: 1, t: 'تبويب "مولّد الحزم" → Android → تنزيل ZIP', sub: "" },
                      { n: 2, t: "افتح ZIP في Android Studio", sub: "" },
                      { n: 3, t: "أنشئ Keystore", sub: "keytool -genkey -v -keystore release.keystore -alias qirox -keyalg RSA -keysize 2048" },
                      { n: 4, t: "استخرج SHA-256 وادخله في الحقول أدناه", sub: "keytool -list -v -keystore release.keystore | grep SHA256" },
                      { n: 5, t: "ابنِ AAB", sub: "./gradlew bundleRelease" },
                    ].map(s => (
                      <li key={s.n} className="flex gap-2">
                        <span className="w-5 h-5 rounded-full bg-black/[0.06] flex items-center justify-center text-[9px] font-black text-black/50 shrink-0 mt-0.5">{s.n}</span>
                        <div>
                          <span className="font-bold text-black/70">{s.t}</span>
                          {s.sub && <p className="text-black/40 font-mono text-[10px] mt-0.5 break-all">{s.sub}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            {/* === SECTION 2: SHA-256 Quick Entry === */}
            <div className="p-4 rounded-2xl border border-black/[0.08] bg-white">
              <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-3">الخطوة 2 — ادخل بيانات التطبيق (بعد الحصول على AAB)</p>
              {hasAndroid ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10">
                  <CheckCircle2 className="w-4 h-4 text-black dark:text-white shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-black dark:text-white">تم ربط التطبيق بالسيرفر ✓</p>
                    <p className="text-[10px] text-black dark:text-white font-mono mt-0.5">{data.androidPackage}</p>
                  </div>
                  <button onClick={openSettings} className="text-[10px] text-black dark:text-white underline mr-auto shrink-0">تعديل</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 text-[11px] text-black dark:text-white flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>بعد تنزيل AAB من PWABuilder، افتح ملف <strong>assetlinks.json</strong> داخل ZIP واحصل منه على الـ Package Name و SHA-256 Fingerprint وأدخلهما هنا.</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-black/50 block mb-1">Package Name</label>
                      <Input placeholder="com.qirox.studio" value={quickPkg} onChange={e => setQuickPkg(e.target.value)} className="text-xs h-9 font-mono" dir="ltr" data-testid="input-quick-pkg" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-black/50 block mb-1">SHA-256 Fingerprint</label>
                      <Input placeholder="AA:BB:CC:DD:..." value={quickFp} onChange={e => setQuickFp(e.target.value)} className="text-xs h-9 font-mono" dir="ltr" data-testid="input-quick-fp" />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={!quickPkg || !quickFp || saveMutation.isPending}
                    data-testid="button-save-quick-android"
                    onClick={() => saveMutation.mutate({ ...(cfg || {}), androidPackage: quickPkg, androidFingerprint: quickFp })}
                    className="gap-2 text-xs"
                  >
                    {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    حفظ وتفعيل assetlinks.json
                  </Button>
                </div>
              )}
              {hasAndroid && (
                <div className="mt-3 p-2 rounded-lg bg-black/[0.02] border border-black/[0.05]">
                  <p className="text-[10px] text-black/40 mb-1">رابط assetlinks.json على السيرفر:</p>
                  <a href={`${siteUrl}/.well-known/assetlinks.json`} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] text-black dark:text-white hover:underline flex items-center gap-1 font-mono" dir="ltr">
                    {siteUrl}/.well-known/assetlinks.json <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* === SECTION 3: Play Console Requirements === */}
            <div>
              <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-3">الخطوة 3 — متطلبات Play Console (اضغط لتحديد المكتمل)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { id: "app_created", group: "إعداد التطبيق", label: "إنشاء التطبيق في Play Console", sub: "Play Console → إنشاء تطبيق → Android App", link: "https://play.google.com/console" },
                  { id: "aab_uploaded", group: "إعداد التطبيق", label: "رفع ملف AAB", sub: "Internal Testing → Create Release → رفع AAB" },
                  { id: "store_listing", group: "معلومات المتجر", label: "إعداد Store Listing", sub: "اسم + وصف + تصنيف + أيقونة + صور" },
                  { id: "privacy_policy", group: "معلومات المتجر", label: "سياسة الخصوصية", sub: siteUrl + "/privacy", link: siteUrl + "/privacy" },
                  { id: "content_rating", group: "معلومات المتجر", label: "Content Rating (استبيان)", sub: "Policy → App Content → Content Rating" },
                  { id: "target_audience", group: "معلومات المتجر", label: "الجمهور المستهدف (Target Audience)", sub: "Policy → App Content → Target Audience" },
                  { id: "data_safety", group: "معلومات المتجر", label: "Data Safety (بيانات الخصوصية)", sub: "Policy → App Content → Data Safety" },
                  { id: "assetlinks", group: "التقني", label: "assetlinks.json مُفعَّل على السيرفر", sub: hasAndroid ? "✓ مفعّل" : "أدخل Package Name و SHA-256 أعلاه", done: hasAndroid },
                  { id: "closed_test_track", group: "الاختبار المغلق", label: "إعداد Closed Test Track", sub: "Testing → Closed testing → Create Track" },
                  { id: "countries", group: "الاختبار المغلق", label: "اختيار الدول والمناطق", sub: "Select countries and regions" },
                  { id: "testers_12", group: "الاختبار المغلق", label: "12+ مختبر قبلوا الدعوة", sub: "اضغط Opt-in link → شارك مع 12 شخص", done: testerCount >= 12 },
                  { id: "test_14days", group: "الاختبار المغلق", label: "14 يوم من الاختبار", sub: closedTestStart ? `بدأ: ${closedTestStart} · ${closedTestDays} يوم مر` : "سجّل تاريخ البدء أدناه", done: closedTestDays >= 14 },
                  { id: "apply_production", group: "الإنتاج", label: "التقديم على Production Access", sub: "بعد اكتمال الاختبار المغلق" },
                ].map(item => {
                  const isDone = item.done !== undefined ? item.done : !!playChecks[item.id];
                  return (
                    <button
                      key={item.id}
                      onClick={() => item.done === undefined && togglePlayCheck(item.id)}
                      data-testid={`play-check-${item.id}`}
                      className={`text-right w-full p-3 rounded-xl border transition-all flex items-start gap-3 ${isDone ? "bg-black/[0.04] dark:bg-white/[0.06] border-black/10 dark:border-white/10" : "bg-white border-black/[0.08] hover:border-black/[0.16]"}`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isDone ? "bg-black dark:bg-white border-black dark:border-white" : "border-black/20"}`}>
                        {isDone && <CheckCheck className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-bold leading-tight ${isDone ? "text-black dark:text-white line-through opacity-70" : "text-black"}`}>{item.label}</p>
                        <p className="text-[10px] text-black/40 mt-0.5 leading-tight">{item.sub}</p>
                        {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-[10px] text-black dark:text-white hover:underline">{item.link.length > 40 ? item.link.slice(0, 40) + "…" : item.link}</a>}
                        <span className="text-[9px] text-black/25 block mt-0.5">{item.group}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* === SECTION 4: Closed Testing Tracker === */}
            <div className="p-5 rounded-2xl border border-black/[0.08] bg-white">
              <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-4">متتبع الاختبار المغلق (Closed Testing)</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Testers */}
                <div className={`p-4 rounded-xl border text-center ${testerCount >= 12 ? "bg-black/[0.04] dark:bg-white/[0.06] border-black/10 dark:border-white/10" : "bg-black/[0.02] border-black/[0.07]"}`}>
                  <div className={`text-3xl font-black mb-1 ${testerCount >= 12 ? "text-black dark:text-white" : "text-black"}`}>{testerCount}</div>
                  <div className="text-[10px] font-bold text-black/50">/ 12 مختبر</div>
                  <div className="w-full h-1.5 rounded-full bg-black/[0.06] mt-2 overflow-hidden">
                    <div className="h-full bg-black dark:bg-white rounded-full transition-all" style={{ width: `${Math.min(100, (testerCount / 12) * 100)}%` }} />
                  </div>
                  {testerCount >= 12 && <p className="text-[9px] text-black dark:text-white font-bold mt-1">✓ مكتمل</p>}
                </div>
                {/* Days */}
                <div className={`p-4 rounded-xl border text-center ${closedTestDays >= 14 ? "bg-black/[0.04] dark:bg-white/[0.06] border-black/10 dark:border-white/10" : "bg-black/[0.02] border-black/[0.07]"}`}>
                  <div className={`text-3xl font-black mb-1 ${closedTestDays >= 14 ? "text-black dark:text-white" : "text-black"}`}>{closedTestDays}</div>
                  <div className="text-[10px] font-bold text-black/50">/ 14 يوم</div>
                  <div className="w-full h-1.5 rounded-full bg-black/[0.06] mt-2 overflow-hidden">
                    <div className="h-full bg-black dark:bg-white rounded-full transition-all" style={{ width: `${Math.min(100, (closedTestDays / 14) * 100)}%` }} />
                  </div>
                  {closedTestDays >= 14 && <p className="text-[9px] text-black dark:text-white font-bold mt-1">✓ مكتمل</p>}
                </div>
                {/* Overall */}
                <div className={`p-4 rounded-xl border text-center ${closedTestDone ? "bg-black/[0.04] dark:bg-white/[0.06] border-black/10 dark:border-white/10" : "bg-black/[0.02] border-black/[0.07]"}`}>
                  <div className={`text-3xl font-black mb-1 ${closedTestDone ? "text-black dark:text-white" : "text-black/30"}`}>{closedTestDone ? "✓" : "⏳"}</div>
                  <div className="text-[10px] font-bold text-black/50">الحالة الكلية</div>
                  <div className="text-[11px] mt-2 font-bold text-black/50">
                    {closedTestDone ? "جاهز للإنتاج! 🎉" : `${Math.max(0, 12 - testerCount)} مختبر + ${Math.max(0, 14 - closedTestDays)} يوم`}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-black/50 block mb-1">تاريخ بدء الاختبار</label>
                  <Input type="date" value={closedTestStart} onChange={e => saveClosedTest(e.target.value, testerCount)} className="h-9 text-sm" data-testid="input-test-start" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-black/50 block mb-1">عدد المختبرين المشتركين</label>
                  <Input type="number" min={0} max={999} value={testerCount} onChange={e => saveClosedTest(closedTestStart, parseInt(e.target.value) || 0)} className="h-9 text-sm" data-testid="input-tester-count" />
                </div>
              </div>
              {closedTestDone && (
                <div className="mt-3 p-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 text-center">
                  <p className="text-sm font-black text-black dark:text-white">🎉 شروط الاختبار مكتملة!</p>
                  <p className="text-[11px] text-black dark:text-white mt-1">يمكنك الآن التقديم على Production في Play Console</p>
                  <a href="https://play.google.com/console" target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-black dark:text-white underline">
                    اذهب إلى Play Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* === SECTION 5: Bubblewrap Config + Link === */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-black text-black/40 mb-2">ملف bubblewrap.config.json (للمسار المتقدم)</p>
                <CodeBlock title="bubblewrap.config.json" code={bubblewrapConfig} />
              </div>
              <div className="p-4 rounded-2xl border border-black/[0.08] bg-white space-y-3">
                <p className="text-xs font-black text-black/40">روابط مهمة</p>
                {[
                  { label: "Google Play Console", url: "https://play.google.com/console", color: "text-black dark:text-white" },
                  { label: "PWABuilder (توليد AAB)", url: "https://www.pwabuilder.com", color: "text-black dark:text-white" },
                  { label: "سياسة الخصوصية", url: siteUrl + "/privacy", color: "text-black/60" },
                  { label: "assetlinks.json على سيرفرك", url: siteUrl + "/.well-known/assetlinks.json", color: "text-black dark:text-white" },
                ].map(link => (
                  <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-2 text-xs font-semibold hover:underline ${link.color}`}>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" /> {link.label}
                  </a>
                ))}
              </div>
            </div>

          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════ */}
        {/* TAB: APPLE — FULL INTERACTIVE GUIDE                */}
        {/* ════════════════════════════════════════════════════ */}
        <TabsContent value="apple">
          <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center shadow-sm">
                  <Apple className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-black text-black">Apple App Store</h2>
                  <p className="text-[10px] text-black/40">دليل الرفع الكامل — Capacitor + Xcode + TestFlight</p>
                </div>
              </div>
              {data.appStoreUrl
                ? <a href={data.appStoreUrl} target="_blank" rel="noopener noreferrer"><Badge className="gap-1 bg-black text-white text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> منشور على App Store</Badge></a>
                : <Badge variant="outline" className="text-xs text-black dark:text-white border-black/10 dark:border-white/10 gap-1"><Clock className="w-3 h-3" /> في انتظار النشر</Badge>
              }
            </div>

            {/* متطلبات مسبقة */}
            <div className="p-4 rounded-2xl border-2 border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.06]">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-black dark:text-white shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-black text-black dark:text-white mb-1">المتطلبات المسبقة قبل البدء</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-black dark:text-white">
                    {[
                      { icon: "💻", t: "جهاز Mac", sub: "macOS 13+ (Ventura أو أحدث)" },
                      { icon: "🍎", t: "Apple Developer Account", sub: "اشتراك $99/سنة — developer.apple.com" },
                      { icon: "🔧", t: "Xcode 15+", sub: "من Mac App Store مجاناً" },
                    ].map(r => (
                      <div key={r.t} className="flex items-start gap-1.5">
                        <span className="text-base leading-none mt-0.5">{r.icon}</span>
                        <div><p className="font-bold">{r.t}</p><p className="text-black dark:text-white">{r.sub}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* === SECTION 1: TWO PATHS === */}
            <div>
              <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-3">الخطوة 1 — احصل على ملف IPA</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Path A: PWABuilder */}
                <div className="p-4 rounded-2xl border-2 border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.06]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-black dark:bg-white flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-white" /></div>
                    <span className="text-sm font-black text-black dark:text-white">المسار الأسرع — PWABuilder</span>
                    <Badge className="text-[9px] bg-black dark:bg-white text-white mr-auto">موصى به ✓</Badge>
                  </div>
                  <ol className="space-y-2 text-[11px] text-black dark:text-white">
                    {[
                      { n: 1, t: "افتح PWABuilder واكتب رابط موقعك", sub: "pwabuilder.com" },
                      { n: 2, t: 'اختر "iOS" ثم اضغط Download Package', sub: "ستحصل على ZIP يحتوي مشروع Capacitor جاهز" },
                      { n: 3, t: "افتح Terminal وشغّل:", sub: "npm install && npx cap sync ios" },
                      { n: 4, t: "افتح في Xcode:", sub: "npx cap open ios" },
                      { n: 5, t: "اختر Team → Product → Archive", sub: "ثم Distribute App → App Store Connect" },
                    ].map(s => (
                      <li key={s.n} className="flex gap-2">
                        <span className="w-5 h-5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-[9px] font-black text-black dark:text-white shrink-0 mt-0.5">{s.n}</span>
                        <div>
                          <span className="font-bold">{s.t}</span>
                          {s.sub && <p className="text-black dark:text-white font-mono text-[10px] mt-0.5 break-all">{s.sub}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                  <a href="https://www.pwabuilder.com" target="_blank" rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-black dark:bg-white text-white text-xs font-black hover:bg-black dark:bg-white transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" /> فتح pwabuilder.com
                  </a>
                </div>

                {/* Path B: Capacitor Manual */}
                <div className="p-4 rounded-2xl border border-black/[0.08] bg-white">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center"><Box className="w-3.5 h-3.5 text-white" /></div>
                    <span className="text-sm font-black text-black">المسار اليدوي — Capacitor</span>
                  </div>
                  <ol className="space-y-2 text-[11px] text-black/60">
                    {[
                      { n: 1, t: 'تبويب "مولّد الحزم" → iOS → تنزيل ZIP', sub: "" },
                      { n: 2, t: "تثبيت المتطلبات", sub: "npm install && cd ios/App && pod install" },
                      { n: 3, t: "فتح المشروع في Xcode", sub: "npx cap open ios" },
                      { n: 4, t: "ضبط Bundle ID و Signing", sub: "Signing & Capabilities → Team → Automatically manage signing" },
                      { n: 5, t: "بناء Archive ورفعه", sub: "Product → Archive → Distribute App → App Store Connect" },
                    ].map(s => (
                      <li key={s.n} className="flex gap-2">
                        <span className="w-5 h-5 rounded-full bg-black/[0.06] flex items-center justify-center text-[9px] font-black text-black/50 shrink-0 mt-0.5">{s.n}</span>
                        <div>
                          <span className="font-bold text-black/70">{s.t}</span>
                          {s.sub && <p className="text-black/40 font-mono text-[10px] mt-0.5 break-all">{s.sub}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            {/* === SECTION 2: Quick Apple Credentials === */}
            <div className="p-4 rounded-2xl border border-black/[0.08] bg-white">
              <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-3">الخطوة 2 — ادخل بيانات Apple Developer</p>
              {hasApple ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-black/[0.03] border border-black/[0.08]">
                  <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-black">تم ربط بيانات Apple ✓</p>
                    <p className="text-[10px] text-black/50 font-mono mt-0.5">{data.appleTeamId} · {data.appleBundleId}</p>
                  </div>
                  <button onClick={openSettings} className="text-[10px] text-black/50 underline mr-auto shrink-0">تعديل</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 text-[11px] text-black dark:text-white flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>من Apple Developer Console احصل على <strong>Team ID</strong> (Account → Membership) و <strong>Bundle ID</strong> (Identifiers → App IDs) وأدخلهما هنا لتفعيل Apple Universal Links.</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-black/50 block mb-1">Team ID</label>
                      <Input placeholder="ABCDE12345" value={quickTeamId} onChange={e => setQuickTeamId(e.target.value)} className="text-xs h-9 font-mono" dir="ltr" data-testid="input-quick-teamid" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-black/50 block mb-1">Bundle ID</label>
                      <Input placeholder="com.qirox.studio" value={quickBundleId} onChange={e => setQuickBundleId(e.target.value)} className="text-xs h-9 font-mono" dir="ltr" data-testid="input-quick-bundleid" />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={!quickTeamId || !quickBundleId || saveMutation.isPending}
                    data-testid="button-save-quick-apple"
                    onClick={() => saveMutation.mutate({ ...(cfg || {}), appleTeamId: quickTeamId, appleBundleId: quickBundleId })}
                    className="gap-2 text-xs bg-black text-white hover:bg-black/80"
                  >
                    {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    حفظ وتفعيل apple-app-site-association
                  </Button>
                </div>
              )}
              {hasApple && (
                <div className="mt-3 p-2 rounded-lg bg-black/[0.02] border border-black/[0.05]">
                  <p className="text-[10px] text-black/40 mb-1">رابط apple-app-site-association على السيرفر:</p>
                  <a href={`${siteUrl}/.well-known/apple-app-site-association`} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] text-black dark:text-white hover:underline flex items-center gap-1 font-mono" dir="ltr">
                    {siteUrl}/.well-known/apple-app-site-association <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* === SECTION 3: App Store Requirements Checklist === */}
            <div>
              <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-3">الخطوة 3 — متطلبات App Store Connect (اضغط لتحديد المكتمل)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { id: "dev_account", group: "الحساب", label: "Apple Developer Account نشط", sub: "اشتراك $99/سنة — developer.apple.com", link: "https://developer.apple.com/account" },
                  { id: "app_id", group: "الحساب", label: "إنشاء App ID", sub: "Certificates → Identifiers → + → App IDs", link: "https://developer.apple.com/account/resources/identifiers/list" },
                  { id: "app_created_asc", group: "App Store Connect", label: "إنشاء التطبيق في App Store Connect", sub: "My Apps → + → New App", link: "https://appstoreconnect.apple.com" },
                  { id: "ipa_uploaded", group: "App Store Connect", label: "رفع ملف IPA عبر Xcode Organizer", sub: "Product → Archive → Distribute App → App Store Connect" },
                  { id: "store_listing_ios", group: "معلومات المتجر", label: "إعداد Store Listing", sub: "اسم + وصف + كلمات مفتاحية + فئة" },
                  { id: "screenshots_ios", group: "معلومات المتجر", label: "لقطات الشاشة", sub: "iPhone 6.9\" + iPhone 6.5\" + iPad (إذا متاح)" },
                  { id: "privacy_policy_ios", group: "معلومات المتجر", label: "سياسة الخصوصية (مطلوبة)", sub: siteUrl + "/privacy", link: siteUrl + "/privacy" },
                  { id: "age_rating", group: "معلومات المتجر", label: "Age Rating (استبيان)", sub: "App Information → Age Rating" },
                  { id: "aasa_ios", group: "التقني", label: "apple-app-site-association مُفعَّل", sub: hasApple ? "✓ مفعّل على السيرفر" : "أدخل Team ID و Bundle ID أعلاه", done: hasApple },
                  { id: "tf_build", group: "TestFlight", label: "رفع Build للاختبار عبر TestFlight", sub: "App Store Connect → TestFlight → Builds" },
                  { id: "tf_testers", group: "TestFlight", label: "إضافة مختبرين خارجيين", sub: "TestFlight → External Testing → + Testers" },
                  { id: "tf_approved", group: "TestFlight", label: "مراجعة Apple للـ Build (24-48 ساعة)", sub: "Apple تراجع أول Build قبل TestFlight الخارجي" },
                  { id: "submit_review", group: "الإنتاج", label: "إرسال للمراجعة (Submit for Review)", sub: "App Store Connect → Submit for Review" },
                  { id: "approved", group: "الإنتاج", label: "الموافقة والنشر (1-3 أيام)", sub: "Apple تراجع وتنشر التطبيق" },
                ].map(item => {
                  const isDone = item.done !== undefined ? item.done : !!appleChecks[item.id];
                  return (
                    <button
                      key={item.id}
                      onClick={() => item.done === undefined && toggleAppleCheck(item.id)}
                      data-testid={`apple-check-${item.id}`}
                      className={`text-right w-full p-3 rounded-xl border transition-all flex items-start gap-3 ${isDone ? "bg-black/[0.03] border-black/[0.12]" : "bg-white border-black/[0.08] hover:border-black/[0.16]"}`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isDone ? "bg-black border-black" : "border-black/20"}`}>
                        {isDone && <CheckCheck className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-bold leading-tight ${isDone ? "text-black/40 line-through" : "text-black"}`}>{item.label}</p>
                        <p className="text-[10px] text-black/40 mt-0.5 leading-tight">{item.sub}</p>
                        {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-[10px] text-black dark:text-white hover:underline">{item.link.length > 40 ? item.link.slice(0, 40) + "…" : item.link}</a>}
                        <span className="text-[9px] text-black/25 block mt-0.5">{item.group}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* === SECTION 4: TestFlight Tracker === */}
            <div className="p-5 rounded-2xl border border-black/[0.08] bg-white">
              <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-4">متتبع TestFlight (اختبار بيتا)</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Testers */}
                <div className={`p-4 rounded-xl border text-center ${tfTesters > 0 ? "bg-black/[0.03] border-black/[0.1]" : "bg-black/[0.02] border-black/[0.07]"}`}>
                  <div className="text-3xl font-black mb-1 text-black">{tfTesters}</div>
                  <div className="text-[10px] font-bold text-black/50">مختبر (حد أقصى 10,000)</div>
                  <div className="w-full h-1.5 rounded-full bg-black/[0.06] mt-2 overflow-hidden">
                    <div className="h-full bg-black rounded-full transition-all" style={{ width: `${Math.min(100, (tfTesters / 100) * 100)}%` }} />
                  </div>
                </div>
                {/* Days Active */}
                <div className={`p-4 rounded-xl border text-center ${tfDays > 0 ? "bg-black/[0.03] border-black/[0.1]" : "bg-black/[0.02] border-black/[0.07]"}`}>
                  <div className="text-3xl font-black mb-1 text-black">{tfDays}</div>
                  <div className="text-[10px] font-bold text-black/50">يوم مضى</div>
                  <div className="w-full h-1.5 rounded-full bg-black/[0.06] mt-2 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${tfExpiry < 10 ? "bg-black dark:bg-white" : "bg-black dark:bg-white"}`} style={{ width: `${Math.min(100, (tfDays / 90) * 100)}%` }} />
                  </div>
                </div>
                {/* Expiry */}
                <div className={`p-4 rounded-xl border text-center ${tfExpiry < 10 ? "bg-black/[0.04] dark:bg-white/[0.06] border-black/10 dark:border-white/10" : "bg-black/[0.02] border-black/[0.07]"}`}>
                  <div className={`text-3xl font-black mb-1 ${tfExpiry < 10 ? "text-black dark:text-white" : "text-black"}`}>
                    {tfStart ? (tfExpiry > 0 ? tfExpiry : "✗") : "90"}
                  </div>
                  <div className="text-[10px] font-bold text-black/50">يوم متبقي (Build ينتهي بعد 90 يوم)</div>
                  {tfExpiry < 10 && tfExpiry > 0 && <p className="text-[9px] text-black dark:text-white font-bold mt-1">⚠ ارفع Build جديد قريباً</p>}
                  {tfExpiry <= 0 && tfStart && <p className="text-[9px] text-black dark:text-white font-bold mt-1">✗ انتهت صلاحية الـ Build</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-black/50 block mb-1">تاريخ رفع أول Build</label>
                  <Input type="date" value={tfStart} onChange={e => saveTf(e.target.value, tfTesters)} className="h-9 text-sm" data-testid="input-tf-start" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-black/50 block mb-1">عدد المختبرين المشتركين</label>
                  <Input type="number" min={0} max={10000} value={tfTesters} onChange={e => saveTf(tfStart, parseInt(e.target.value) || 0)} className="h-9 text-sm" data-testid="input-tf-testers" />
                </div>
              </div>
              <div className="mt-3 p-3 rounded-xl bg-black/[0.02] border border-black/[0.06] text-[11px] text-black/50 leading-relaxed">
                <span className="font-bold text-black/70">ملاحظة TestFlight: </span>
                كل Build يصلح لمدة 90 يوماً فقط. المختبرون الداخليون (فريقك) يبدؤون الاختبار فوراً. المختبرون الخارجيون يحتاجون موافقة Apple (24-48 ساعة). لا حد أدنى للمختبرين للتقديم على الإنتاج.
              </div>
            </div>

            {/* === SECTION 5: Apple Pay Setup === */}
            <div className="p-5 rounded-2xl border-2 border-black/[0.09] bg-white">
              {/* Header + progress */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center">
                    <CreditCard className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-black">Apple Pay — تفعيل الدفع</p>
                    <p className="text-[10px] text-black/40">اجعل عملاءك يدفعون بلمسة واحدة على iPhone</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
                    <span className="text-white text-xs font-black">{applePayDone}/{applePaySteps.length}</span>
                  </div>
                  <div className="w-32">
                    <div className="w-full h-2 rounded-full bg-black/[0.07] overflow-hidden">
                      <div className="h-full bg-black rounded-full transition-all" style={{ width: `${(applePayDone / applePaySteps.length) * 100}%` }} />
                    </div>
                    <p className="text-[9px] text-black/40 mt-1 text-center">{Math.round((applePayDone / applePaySteps.length) * 100)}% مكتمل</p>
                  </div>
                </div>
              </div>

              {/* Architecture note */}
              <div className="p-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 text-[11px] text-black dark:text-white mb-4 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">كيف يعمل Apple Pay في تطبيقك؟ </span>
                  عملاؤك يضغطون <strong>Pay with Apple Pay</strong> → يتحقق Apple من هويتهم بـ Face ID/Touch ID → المبلغ يُخصم من بطاقتهم المرتبطة بـ Apple Wallet → يصل لحسابك عبر Stripe أو بوابة الدفع.
                </div>
              </div>

              {/* Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-4">
                {[
                  { id: "merchant_id", phase: "Apple Developer", label: "إنشاء Merchant ID", sub: "Certificates → Identifiers → Merchant IDs → +", link: "https://developer.apple.com/account/resources/identifiers/list/merchant" },
                  { id: "domain_verify", phase: "Apple Developer", label: "التحقق من النطاق (Domain Verification)", sub: `رفع ملف التحقق على: ${siteUrl}/.well-known/apple-developer-merchantid-domain-association` },
                  { id: "cert_csr", phase: "Apple Developer", label: "توليد CSR للشهادة", sub: "Keychain Access → Certificate Assistant → Request a Certificate From a Certificate Authority" },
                  { id: "cert_upload", phase: "Apple Developer", label: "رفع CSR واستلام شهادة Apple Pay", sub: "Merchant ID → Create Certificate → رفع CSR → تنزيل .cer" },
                  { id: "entitlement", phase: "Xcode", label: "إضافة Apple Pay Entitlement في Xcode", sub: "Signing & Capabilities → + Capability → Apple Pay → أضف Merchant ID" },
                  { id: "stripe_applepay", phase: "Backend", label: "تفعيل Apple Pay في Stripe/بوابة الدفع", sub: "Stripe Dashboard → Settings → Payment Methods → Apple Pay → Enable" },
                  { id: "test_sandbox", phase: "الاختبار", label: "اختبار في Sandbox", sub: "Settings → Developer → Sandbox Apple ID → إضافة بطاقة اختبار → جرّب الدفع" },
                  { id: "go_live", phase: "الإنتاج", label: "التحقق النهائي ونشر التطبيق", sub: "Apple تراجع Entitlement تلقائياً عند المراجعة — لا حاجة لموافقة إضافية" },
                ].map(item => {
                  const isDone = !!applePayChecks[item.id];
                  return (
                    <button key={item.id} onClick={() => toggleApplePayCheck(item.id)} data-testid={`applepay-check-${item.id}`}
                      className={`text-right w-full p-3 rounded-xl border transition-all flex items-start gap-2.5 ${isDone ? "bg-black/[0.03] border-black/[0.12]" : "bg-white border-black/[0.08] hover:border-black/[0.18]"}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${isDone ? "bg-black border-black" : "border-black/20"}`}>
                        {isDone && <CheckCheck className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-bold ${isDone ? "text-black/40 line-through" : "text-black"}`}>{item.label}</p>
                        <p className="text-[10px] text-black/40 mt-0.5 leading-tight break-all">{item.sub}</p>
                        {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-[10px] text-black dark:text-white hover:underline">{item.link.replace("https://", "")}</a>}
                        <span className="text-[9px] text-black/25 block mt-0.5">{item.phase}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {applePayDone === applePaySteps.length && (
                <div className="p-3 rounded-xl bg-black text-white text-center">
                  <p className="text-sm font-black">🎉 Apple Pay جاهز للعملاء!</p>
                  <p className="text-[11px] text-white/60 mt-1">عملاؤك يمكنهم الآن الدفع بـ Face ID / Touch ID في تطبيقك</p>
                </div>
              )}
            </div>

            {/* === SECTION 6: QPAY Apple Wallet === */}
            <div className="p-5 rounded-2xl border-2 border-black/[0.09] bg-white">
              {/* Header + progress */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-black to-black/70 flex items-center justify-center">
                    <Wallet className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-black">QPAY Card → Apple Wallet</p>
                    <p className="text-[10px] text-black/40">يضيف العميل بطاقته في محفظة iPhone مباشرة</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
                    <span className="text-white text-xs font-black">{qpayDone}/{qpaySteps.length}</span>
                  </div>
                  <div className="w-32">
                    <div className="w-full h-2 rounded-full bg-black/[0.07] overflow-hidden">
                      <div className="h-full bg-black rounded-full transition-all" style={{ width: `${(qpayDone / qpaySteps.length) * 100}%` }} />
                    </div>
                    <p className="text-[9px] text-black/40 mt-1 text-center">{Math.round((qpayDone / qpaySteps.length) * 100)}% مكتمل</p>
                  </div>
                </div>
              </div>

              {/* How it works */}
              <div className="p-3 rounded-xl bg-black/[0.03] border border-black/[0.07] mb-4">
                <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-2">كيف يعمل QPAY Wallet Pass؟</p>
                <div className="flex items-center gap-0 overflow-x-auto">
                  {[
                    { step: "العميل", desc: 'يضغط\n"أضف إلى Wallet"' },
                    { step: "سيرفر QIROX", desc: "يولّد ملف\n.pkpass موقّع" },
                    { step: "iPhone", desc: "يفتح Apple\nWallet تلقائياً" },
                    { step: "البطاقة", desc: "تظهر في\nمحفظة العميل" },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-0 shrink-0">
                      <div className="text-center px-2">
                        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center mx-auto mb-1">
                          <span className="text-white text-[10px] font-black">{i + 1}</span>
                        </div>
                        <p className="text-[10px] font-bold text-black">{s.step}</p>
                        <p className="text-[9px] text-black/40 whitespace-pre-line">{s.desc}</p>
                      </div>
                      {i < 3 && <ChevronRight className="w-4 h-4 text-black/20 shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-4">
                {[
                  { id: "pass_cert", phase: "Apple Developer", label: "إنشاء Pass Type ID", sub: "Certificates → Identifiers → Pass Type IDs → + (مثال: pass.online.qiroxstudio.qpay)", link: "https://developer.apple.com/account/resources/identifiers/list/passTypeId" },
                  { id: "pass_type_id", phase: "Apple Developer", label: "إنشاء وتنزيل شهادة PassKit (.p12)", sub: "Pass Type ID → Create Certificate → رفع CSR → تنزيل .cer → تصديره كـ .p12 من Keychain" },
                  { id: "template_design", phase: "التصميم", label: "تصميم قالب البطاقة", sub: 'نوع البطاقة: storeCard — يحتوي اسم العميل + رصيد QPAY + باركود QR + شعار QIROX' },
                  { id: "pass_server", phase: "Backend", label: "إعداد Pass Generation Server", sub: "مكتبة: passkit-generator (Node.js) — يولّد ملف .pkpass مخصص لكل عميل" },
                  { id: "sign_pass", phase: "Backend", label: "توقيع الـ Pass بشهادة Apple", sub: "passkit-generator.createNewPass({...}) → sign با .p12 → ملف .pkpass جاهز" },
                  { id: "api_endpoint", phase: "Backend", label: "إضافة API لتوليد وتحميل الـ Pass", sub: "GET /api/wallet/qpay-pass → يُرجع .pkpass → المتصفح يفتح Wallet تلقائياً" },
                  { id: "test_add", phase: "الاختبار", label: "اختبار الإضافة على iPhone حقيقي", sub: "فتح الرابط من Safari iOS → 'Add to Apple Wallet' يظهر تلقائياً" },
                  { id: "push_update", phase: "التحديثات", label: "Push Updates — تحديث الرصيد تلقائياً", sub: "عند تغير رصيد QPAY → السيرفر يرسل push لـ Apple → البطاقة تتحدث بدون تدخل العميل" },
                ].map(item => {
                  const isDone = !!qpayChecks[item.id];
                  return (
                    <button key={item.id} onClick={() => toggleQpayCheck(item.id)} data-testid={`qpay-check-${item.id}`}
                      className={`text-right w-full p-3 rounded-xl border transition-all flex items-start gap-2.5 ${isDone ? "bg-black/[0.03] border-black/[0.12]" : "bg-white border-black/[0.08] hover:border-black/[0.18]"}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${isDone ? "bg-black border-black" : "border-black/20"}`}>
                        {isDone && <CheckCheck className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-bold ${isDone ? "text-black/40 line-through" : "text-black"}`}>{item.label}</p>
                        <p className="text-[10px] text-black/40 mt-0.5 leading-tight">{item.sub}</p>
                        {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-[10px] text-black dark:text-white hover:underline">{item.link.replace("https://", "")}</a>}
                        <span className="text-[9px] text-black/25 block mt-0.5">{item.phase}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Tech summary */}
              <div className="p-3 rounded-xl bg-black/[0.02] border border-black/[0.06] text-[11px] text-black/50 leading-relaxed">
                <span className="font-bold text-black/70">المكتبة المقترحة: </span>
                <code className="font-mono text-[10px] bg-black/[0.06] px-1 rounded">passkit-generator</code> على Node.js — تدعم storeCard, generic, coupon, boardingPass, eventTicket.
                الملف النهائي <code className="font-mono text-[10px] bg-black/[0.06] px-1 rounded">.pkpass</code> هو ZIP مضغوط يحتوي: <code className="font-mono text-[10px] bg-black/[0.06] px-1 rounded">pass.json + icon.png + logo.png + signature + manifest.json</code>
              </div>

              {qpayDone === qpaySteps.length && (
                <div className="mt-3 p-3 rounded-xl bg-black text-white text-center">
                  <p className="text-sm font-black">🎉 QPAY Wallet جاهز!</p>
                  <p className="text-[11px] text-white/60 mt-1">عملاؤك يمكنهم الآن إضافة بطاقة QPAY لـ Apple Wallet</p>
                </div>
              )}
            </div>

            {/* === SECTION 7: AASA File + Links === */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-black text-black/40 mb-2">ملف apple-app-site-association</p>
                <CodeBlock title="apple-app-site-association" code={aasaJson} />
              </div>
              <div className="p-4 rounded-2xl border border-black/[0.08] bg-white space-y-3">
                <p className="text-xs font-black text-black/40">روابط مهمة</p>
                {[
                  { label: "App Store Connect", url: "https://appstoreconnect.apple.com", color: "text-black" },
                  { label: "Apple Developer Portal", url: "https://developer.apple.com/account", color: "text-black" },
                  { label: "Apple Pay Setup Guide", url: "https://developer.apple.com/apple-pay/implementation", color: "text-black dark:text-white" },
                  { label: "PassKit Identifiers", url: "https://developer.apple.com/account/resources/identifiers/list/passTypeId", color: "text-black dark:text-white" },
                  { label: "PWABuilder (توليد iOS)", url: "https://www.pwabuilder.com", color: "text-black dark:text-white" },
                  { label: "سياسة الخصوصية", url: siteUrl + "/privacy", color: "text-black/60" },
                ].map(link => (
                  <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-2 text-xs font-semibold hover:underline ${link.color}`}>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" /> {link.label}
                  </a>
                ))}
              </div>
            </div>

          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════ */}
        {/* TAB: HUAWEI                                         */}
        {/* ════════════════════════════════════════════════════ */}
        <TabsContent value="huawei">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-black dark:bg-white flex items-center justify-center"><Cpu className="w-4 h-4 text-white" /></div>
                <div><h2 className="text-sm font-black">Huawei App Gallery</h2><p className="text-[10px] text-black/40">HarmonyOS NEXT</p></div>
                {data.huaweiStoreUrl && <a href={data.huaweiStoreUrl} target="_blank" rel="noopener noreferrer" className="mr-auto"><Badge variant="outline" className="text-[10px] gap-1 text-black dark:text-white border-black/10 dark:border-white/10"><CheckCircle2 className="w-3 h-3" /> {L ? "منشور" : "Published"}</Badge></a>}
              </div>
              <StepCard n={1} title="توليد حزمة HarmonyOS" desc='تبويب "مولّد الحزم" → اختر هارموني → توليد وتنزيل' />
              <StepCard n={2} title="فتح في DevEco Studio" desc="افتح المجلد المُستخرج من ZIP في DevEco Studio 4.0+" />
              <StepCard n={3} title="إعداد التوقيع" desc="File → Project Structure → Signing Configs → أضف .p12 و .cer من AppGallery Connect" />
              <StepCard n={4} title="بناء HAP" desc="Build → Build Hap(s)/APP(s) → Build APP(s)" />
              <StepCard n={5} title="رفع على AppGallery Connect" desc="Software Versions → New Version → ارفع ملف .app" link="https://developer.huawei.com/consumer/en/service/josp/agc/index.html" linkLabel="AppGallery Connect" />
            </div>
            <div>
              <p className="text-xs font-black text-black/40 mb-3">{L ? "assetlinks.json (مشترك)" : "assetlinks.json (shared)"}</p>
              <CodeBlock title=".well-known/assetlinks.json" code={assetlinksJson} />
            </div>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════ */}
        {/* TAB: MICROSOFT                                      */}
        {/* ════════════════════════════════════════════════════ */}
        <TabsContent value="microsoft">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-black dark:bg-white flex items-center justify-center"><Globe className="w-4 h-4 text-white" /></div>
                <div><h2 className="text-sm font-black">Microsoft Store</h2><p className="text-[10px] text-black/40">Electron + MSIX</p></div>
                {data.msStoreUrl && <a href={data.msStoreUrl} target="_blank" rel="noopener noreferrer" className="mr-auto"><Badge variant="outline" className="text-[10px] gap-1 text-black dark:text-white border-black/10 dark:border-white/10"><CheckCircle2 className="w-3 h-3" /> {L ? "منشور" : "Published"}</Badge></a>}
              </div>
              <StepCard n={1} title="توليد حزمة Windows" desc='تبويب "مولّد الحزم" → اختر ويندوز → توليد وتنزيل' />
              <StepCard n={2} title="تثبيت المتطلبات" desc="npm install (في المجلد المستخرج)" />
              <StepCard n={3} title="بناء المثبّت" desc="npm run dist:win → dist/qirox-studio-Setup.exe" />
              <StepCard n={4} title="بناء MSIX للمتجر" desc="npm run dist:msix → dist/qirox-studio.msix" />
              <StepCard n={5} title="رفع على Partner Center" desc="Submit MSIX في Microsoft Partner Center" link="https://partner.microsoft.com" linkLabel="Microsoft Partner Center" />
            </div>
            <div>
              <div className="p-3 bg-black/[0.02] rounded-xl border border-black/[0.06] mb-4">
                <p className="text-[10px] font-bold text-black/50 mb-2">browserconfig.xml:</p>
                <a href={`${siteUrl}/browserconfig.xml`} target="_blank" rel="noopener noreferrer" className="text-xs text-black dark:text-white hover:underline flex items-center gap-1">
                  {siteUrl}/browserconfig.xml <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="p-4 rounded-xl border border-black/[0.06] bg-white">
                <p className="text-xs font-bold text-black mb-3">{L ? "مقارنة متطلبات المتاجر" : "Store Requirements Comparison"}</p>
                <table className="w-full text-[10px]" dir={dir}>
                  <thead><tr className="border-b border-black/[0.06]">
                    <th className="text-right pb-2 font-bold text-black/40">{L ? "المتجر" : "Store"}</th>
                    <th className="text-center pb-2 font-bold text-black/40">{L ? "الرسوم" : "Fee"}</th>
                    <th className="text-center pb-2 font-bold text-black/40">Mac</th>
                    <th className="text-center pb-2 font-bold text-black/40">{L ? "التعقيد" : "Complexity"}</th>
                  </tr></thead>
                  <tbody>
                    {[
                      { name: "Google Play", fee: "$25", mac: L ? "لا" : "No", c: L ? "متوسط" : "Medium" },
                      { name: "App Store", fee: L ? "$99/سنة" : "$99/yr", mac: "✓ " + (L ? "نعم" : "Yes"), c: L ? "عالٍ" : "High" },
                      { name: "Huawei", fee: L ? "مجاني" : "Free", mac: L ? "لا" : "No", c: L ? "متوسط" : "Medium" },
                      { name: "Microsoft", fee: "$19", mac: L ? "لا" : "No", c: L ? "سهل ✓" : "Easy ✓" },
                    ].map(r => (
                      <tr key={r.name} className="border-b border-black/[0.03]">
                        <td className="py-1.5 font-semibold">{r.name}</td>
                        <td className="text-center py-1.5 text-black/50">{r.fee}</td>
                        <td className="text-center py-1.5 text-black/50">{r.mac}</td>
                        <td className="text-center py-1.5 text-black/50">{r.c}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════ */}
        {/* TAB: FILES                                          */}
        {/* ════════════════════════════════════════════════════ */}
        <TabsContent value="files">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-black text-black/40 uppercase tracking-widest mb-3">{L ? "ملف Android Digital Asset Links" : "Android Digital Asset Links File"}</p>
              <CodeBlock title=".well-known/assetlinks.json" code={assetlinksJson} />
              <div className="p-3 bg-black/[0.02] rounded-xl border border-black/[0.06] text-[10px] text-black/50 space-y-1">
                <p className="font-bold text-black/60">{L ? "يُستخدم لـ: Google Play · Huawei · Android Links" : "Used for: Google Play · Huawei · Android Links"}</p>
                <a href={`${siteUrl}/.well-known/assetlinks.json`} target="_blank" rel="noopener noreferrer" className="text-black dark:text-white hover:underline" dir="ltr">
                  {siteUrl}/.well-known/assetlinks.json
                </a>
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-black/40 uppercase tracking-widest mb-3">{L ? "ملف Apple App Site Association" : "Apple App Site Association File"}</p>
              <CodeBlock title="apple-app-site-association" code={aasaJson} />
              <div className="p-3 bg-black/[0.02] rounded-xl border border-black/[0.06] text-[10px] text-black/50">
                <p className="font-bold text-black/60 mb-1">{L ? "يُستخدم لـ: iOS Universal Links · App Store" : "Used for: iOS Universal Links · App Store"}</p>
                <a href={`${siteUrl}/.well-known/apple-app-site-association`} target="_blank" rel="noopener noreferrer" className="text-black dark:text-white hover:underline" dir="ltr">
                  {siteUrl}/.well-known/apple-app-site-association
                </a>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
