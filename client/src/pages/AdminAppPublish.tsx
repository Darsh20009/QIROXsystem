// @ts-nocheck
import { useState, useRef } from "react";
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
  ChevronRight, Info, AlertTriangle, CheckCheck, Box, Hash, Clock, Trash2
} from "lucide-react";

// ─── JSZip import ───────────────────────────────────────────
import JSZip from "jszip";

// ─── Types ──────────────────────────────────────────────────
type Platform = "android" | "windows" | "ios" | "harmony";

const PLATFORMS: { id: Platform; label: string; labelEn: string; icon: any; color: string; bg: string; ext: string; desc: string }[] = [
  { id: "android", label: "أندرويد", labelEn: "Android", icon: Smartphone, color: "text-green-600", bg: "bg-green-50 border-green-200", ext: "APK", desc: "Google Play — Trusted Web Activity" },
  { id: "windows", label: "ويندوز", labelEn: "Windows", icon: Monitor, color: "text-blue-600", bg: "bg-blue-50 border-blue-200", ext: "EXE", desc: "Electron — Windows Desktop App" },
  { id: "ios", label: "آيفون iOS", labelEn: "iOS", icon: Apple, color: "text-gray-700", bg: "bg-gray-50 border-gray-200", ext: "IPA", desc: "Capacitor — Apple App Store" },
  { id: "harmony", label: "هارموني", labelEn: "HarmonyOS", icon: Cpu, color: "text-red-600", bg: "bg-red-50 border-red-200", ext: "HAP", desc: "DevEco Studio — Huawei App Gallery" },
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
    <button onClick={() => { navigator.clipboard.writeText(text); toast({ title: "تم النسخ ✓" }); }}
      className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors" title="نسخ">
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
          <button onClick={() => navigator.clipboard.writeText(code)} className="text-[10px] text-black/40 hover:text-black/70 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-black/[0.05] transition-colors"><Copy className="w-3 h-3" /> نسخ</button>
          <button onClick={downloadFile} className="text-[10px] text-black/40 hover:text-black/70 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-black/[0.05] transition-colors"><Download className="w-3 h-3" /> تنزيل</button>
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
        {link && <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1.5 font-medium">{linkLabel || link} <ExternalLink className="w-3 h-3" /></a>}
      </div>
    </div>
  );
}
function ReadinessItem({ done, label, note }: any) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border mb-2 ${done ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50"}`}>
      {done ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
      <div>
        <p className={`text-xs font-bold ${done ? "text-emerald-700" : "text-amber-700"}`}>{label}</p>
        {note && <p className="text-[10px] mt-0.5 text-black/40">{note}</p>}
      </div>
      <span className={`mr-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${done ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>{done ? "✓ جاهز" : "مطلوب"}</span>
    </div>
  );
}
function StoreBadge({ store, url }: any) {
  if (!url) return <span className="text-xs text-black/30">لم يُنشر بعد</span>;
  return <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"><ExternalLink className="w-3 h-3" /> عرض في {store}</a>;
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/store-publish-config"] }); setSettingsOpen(false); toast({ title: "تم حفظ الإعدادات ✓" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

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
    <div dir="rtl" className="max-w-5xl mx-auto py-6 px-4">
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-black rounded-2xl flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-black">مركز نشر التطبيق</h1>
            <p className="text-xs text-black/40 mt-0.5">توليد حزم حقيقية · Google Play · App Store · Microsoft Store · App Gallery</p>
          </div>
        </div>
        <Button onClick={openSettings} variant="outline" className="gap-2 text-sm" data-testid="button-open-store-settings">
          <Settings className="w-4 h-4" /> إعدادات المتاجر
        </Button>
      </div>

      {/* ─── Settings Panel ───────────────────────────────────── */}
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
              <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Google Play (Android)</p>
              {FIELD("Package Name", data.androidPackage || "", v => f("androidPackage", v), { placeholder: "com.qirox.studio" })}
              {FIELD("SHA-256 Fingerprint", data.androidFingerprint || "", v => f("androidFingerprint", v), { placeholder: "AA:BB:CC:..." })}
              {FIELD("رابط Google Play", data.playStoreUrl || "", v => f("playStoreUrl", v))}
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Apple App Store</p>
              {FIELD("Team ID", data.appleTeamId || "", v => f("appleTeamId", v), { placeholder: "ABCDE12345" })}
              {FIELD("Bundle ID", data.appleBundleId || "", v => f("appleBundleId", v), { placeholder: "com.qirox.studio" })}
              {FIELD("رابط App Store", data.appStoreUrl || "", v => f("appStoreUrl", v))}
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Huawei App Gallery</p>
              {FIELD("Package Name", data.huaweiPackage || "", v => f("huaweiPackage", v), { placeholder: "com.qirox.studio.huawei" })}
              {FIELD("SHA-256 Fingerprint", data.huaweiFingerprint || "", v => f("huaweiFingerprint", v), { placeholder: "AA:BB:CC:..." })}
              {FIELD("رابط App Gallery", data.huaweiStoreUrl || "", v => f("huaweiStoreUrl", v))}
              <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mt-2">Microsoft Store</p>
              {FIELD("MS App Identity", data.msAppId || "", v => f("msAppId", v), { placeholder: "12345YourName.QiroxStudio" })}
              {FIELD("رابط Microsoft Store", data.msStoreUrl || "", v => f("msStoreUrl", v))}
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

      {/* ─── Readiness Bar ────────────────────────────────────── */}
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

      <Tabs defaultValue="builder" dir="rtl">
        <TabsList className="mb-5 flex-wrap h-auto gap-1 bg-black/[0.03] p-1 rounded-xl">
          <TabsTrigger value="builder" className="gap-1.5 text-xs data-[state=active]:bg-black data-[state=active]:text-white rounded-lg">
            <Package className="w-3.5 h-3.5" /> مولّد الحزم ✨
          </TabsTrigger>
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
            <Cpu className="w-3.5 h-3.5" /> Huawei Gallery
          </TabsTrigger>
          <TabsTrigger value="microsoft" className="gap-1.5 text-xs data-[state=active]:bg-black data-[state=active]:text-white rounded-lg">
            <Globe className="w-3.5 h-3.5" /> Microsoft Store
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-1.5 text-xs data-[state=active]:bg-black data-[state=active]:text-white rounded-lg">
            <Download className="w-3.5 h-3.5" /> ملفات الربط
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
                <p className="text-[11px] font-black text-black/40 uppercase tracking-widest mb-3">اختر المنصة المستهدفة</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PLATFORMS.map(plt => {
                    const Icon = plt.icon;
                    const active = selectedPlatform === plt.id;
                    return (
                      <button
                        key={plt.id}
                        data-testid={`platform-${plt.id}`}
                        onClick={() => setSelectedPlatform(plt.id)}
                        className={`p-4 rounded-2xl border-2 text-right transition-all duration-200 ${active ? "border-black bg-black text-white shadow-lg scale-[1.02]" : "border-black/[0.08] bg-white hover:border-black/30 text-black hover:scale-[1.01]"}`}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${active ? "text-white" : plt.color}`} />
                        <p className={`text-sm font-black ${active ? "text-white" : "text-black"}`}>{plt.label}</p>
                        <p className={`text-[10px] mt-0.5 ${active ? "text-white/60" : "text-black/40"}`}>{plt.labelEn}</p>
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
                <p className="text-[11px] font-black text-black/40 uppercase tracking-widest mb-3">إعدادات البناء</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-black/50 block mb-1">رقم الإصدار</label>
                    <Input value={buildVer} onChange={e => setBuildVer(e.target.value)} className="text-sm h-9 font-mono" dir="ltr" placeholder="1.0.0" data-testid="input-build-version" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-black/50 block mb-1">اسم التطبيق</label>
                    <Input value={appName} disabled className="text-sm h-9 opacity-60" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-black/50 block mb-1">رابط التطبيق</label>
                    <Input value={siteUrl} disabled className="text-sm h-9 opacity-60" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-black/50 block mb-1">Package / Bundle ID</label>
                    <Input
                      value={selectedPlatform === "android" ? (data.androidPackage || "com.qirox.studio") :
                        selectedPlatform === "harmony" ? (data.huaweiPackage || "com.qirox.studio.harmony") :
                        selectedPlatform === "ios" ? (data.appleBundleId || "com.qirox.studio") : "QiroxStudio.App"}
                      disabled className="text-sm h-9 opacity-60 font-mono" dir="ltr" />
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="p-4 rounded-2xl border border-black/[0.08] bg-white">
                <p className="text-[11px] font-black text-black/40 uppercase tracking-widest mb-3">الصلاحيات والأذونات</p>
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
                        {perm.required && <p className={`text-[9px] ${active ? "text-white/50" : "text-black/30"}`}>مطلوب</p>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* What's inside */}
              <div className="p-4 rounded-2xl border border-black/[0.06] bg-gradient-to-br from-black/[0.02] to-transparent">
                <p className="text-[11px] font-black text-black/40 uppercase tracking-widest mb-3">ما يحتويه الملف المُولَّد</p>
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
                  ].map(i => <div key={i} className="flex items-center gap-1.5 text-black/60"><CheckCheck className="w-3 h-3 text-green-500 shrink-0" />{i}</div>)}

                  {selectedPlatform === "windows" && [
                    "Electron Main Process (main.js)",
                    "NSIS Installer Script",
                    "electron-builder Config",
                    "System Tray Support",
                    "Auto-Updater (electron-updater)",
                    "Context Menu (Arabic)",
                    "GitHub Actions CI/CD",
                    "MSIX Package Config",
                  ].map(i => <div key={i} className="flex items-center gap-1.5 text-black/60"><CheckCheck className="w-3 h-3 text-blue-500 shrink-0" />{i}</div>)}

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

                  {selectedPlatform === "harmony" && [
                    "EntryAbility.ets (HarmonyOS)",
                    "WebView Component (Index.ets)",
                    "module.json5 (كل الصلاحيات)",
                    "app.json5 Configuration",
                    "build-profile.json5",
                    "Immersive Full-Screen UI",
                    "hvigorfile.ts (Build Tool)",
                    "String Resources (Arabic)",
                  ].map(i => <div key={i} className="flex items-center gap-1.5 text-black/60"><CheckCheck className="w-3 h-3 text-red-500 shrink-0" />{i}</div>)}
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
                    <p className="text-sm font-black">{PLATFORMS.find(p => p.id === selectedPlatform)?.label}</p>
                    <p className="text-[10px] text-white/50">{PLATFORMS.find(p => p.id === selectedPlatform)?.desc}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {[
                    { label: "الإصدار", value: buildVer },
                    { label: "الصلاحيات", value: `${buildPerms.length} صلاحية` },
                    { label: "الملف", value: `${PLATFORMS.find(p => p.id === selectedPlatform)?.ext} + README` },
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
                      <span>جاري التوليد...</span>
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
                    <><Loader2 className="w-4 h-4 animate-spin" /> جاري التوليد...</>
                  ) : (
                    <><FileArchive className="w-4 h-4" /> توليد وتنزيل الحزمة</>
                  )}
                </Button>

                <p className="text-[10px] text-white/40 mt-3 text-center leading-relaxed">
                  الحزمة تحتوي مشروعاً كاملاً جاهزاً للبناء إلى تطبيق حقيقي
                </p>
              </div>

              {/* Info box */}
              <div className="p-4 rounded-2xl border border-black/[0.08] bg-white">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-black mb-1">كيف يعمل؟</p>
                    <p className="text-[11px] text-black/50 leading-relaxed">
                      الملف المُولَّد هو مشروع كامل (ZIP) يحتوي جميع الملفات اللازمة لبناء تطبيق حقيقي. افتحه في البيئة المناسبة (Android Studio / VS Code / Xcode / DevEco) واتبع README.
                    </p>
                  </div>
                </div>
              </div>

              {/* Generated Packages History */}
              {generatedPackages.length > 0 && (
                <div className="p-4 rounded-2xl border border-black/[0.08] bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-black text-black/50 uppercase tracking-widest">الحزم السابقة</p>
                    <button onClick={clearHistory} className="text-[10px] text-red-400 hover:text-red-600 flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> مسح
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
                            title="إعادة تنزيل"
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
              <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-3">المتطلبات التقنية</p>
              {readinessChecklist.slice(0, 7).map((item, i) => <ReadinessItem key={i} {...item} />)}
            </div>
            <div>
              <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-3">إعدادات المتاجر</p>
              {readinessChecklist.slice(7).map((item, i) => <ReadinessItem key={i} {...item} />)}
              {!hasAndroid || !hasApple || !hasMs ? (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                  لإكمال الجاهزية، اضغط على <strong>"إعدادات المتاجر"</strong> أعلاه وأدخل البيانات.
                </div>
              ) : (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-bold">
                  🎉 التطبيق جاهز للنشر على جميع المتاجر!
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════ */}
        {/* TAB: GOOGLE PLAY                                    */}
        {/* ════════════════════════════════════════════════════ */}
        <TabsContent value="google">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center"><Smartphone className="w-4 h-4 text-white" /></div>
                <div><h2 className="text-sm font-black">Google Play Store</h2><p className="text-[10px] text-black/40">عبر Trusted Web Activity (TWA)</p></div>
                {data.playStoreUrl && <a href={data.playStoreUrl} target="_blank" rel="noopener noreferrer" className="mr-auto"><Badge variant="outline" className="text-[10px] gap-1 text-green-600 border-green-200"><CheckCircle2 className="w-3 h-3" /> منشور</Badge></a>}
              </div>
              <StepCard n={1} title="توليد حزمة Android" desc='اضغط على تبويب "مولّد الحزم" → اختر Android → توليد وتنزيل' />
              <StepCard n={2} title="فتح في Android Studio" desc="افتح المجلد المُستخرج من ZIP في Android Studio" />
              <StepCard n={3} title="إنشاء Keystore" desc="keytool -genkey -v -keystore release.keystore -alias qirox -keyalg RSA -keysize 2048 -validity 10000" />
              <StepCard n={4} title="الحصول على SHA-256" desc="keytool -list -v -keystore release.keystore | grep SHA256 ثم أدخله في إعدادات المتاجر" />
              <StepCard n={5} title="بناء AAB" desc="./gradlew bundleRelease → app/build/outputs/bundle/release/*.aab" />
              <StepCard n={6} title="رفع على Google Play Console" desc="أنشئ تطبيقاً جديداً وارفع ملف AAB" link="https://play.google.com/console" linkLabel="Google Play Console" />
            </div>
            <div>
              <p className="text-xs font-black text-black/40 mb-3">ملف bubblewrap التلقائي</p>
              <CodeBlock title="bubblewrap.config.json" code={bubblewrapConfig} />
              <div className="p-3 bg-black/[0.02] rounded-xl border border-black/[0.06]">
                <p className="text-[10px] font-bold text-black/50 mb-2">assetlinks.json:</p>
                <a href={`${siteUrl}/.well-known/assetlinks.json`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  {siteUrl}/.well-known/assetlinks.json <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════ */}
        {/* TAB: APPLE                                          */}
        {/* ════════════════════════════════════════════════════ */}
        <TabsContent value="apple">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center"><Apple className="w-4 h-4 text-white" /></div>
                <div><h2 className="text-sm font-black">Apple App Store</h2><p className="text-[10px] text-black/40">عبر Capacitor + Xcode</p></div>
                {data.appStoreUrl && <a href={data.appStoreUrl} target="_blank" rel="noopener noreferrer" className="mr-auto"><Badge variant="outline" className="text-[10px] gap-1"><CheckCircle2 className="w-3 h-3 text-blue-500" /> منشور</Badge></a>}
              </div>
              <StepCard n={1} title="توليد حزمة iOS" desc='تبويب "مولّد الحزم" → اختر iOS → توليد وتنزيل الحزمة' />
              <StepCard n={2} title="تثبيت المتطلبات" desc="npm install && cd ios/App && pod install" />
              <StepCard n={3} title="فتح في Xcode" desc="npx cap open ios — اضبط Bundle ID والـ Signing Team" />
              <StepCard n={4} title="Archive وتصدير IPA" desc="Product → Archive → Distribute App → App Store Connect" />
              <StepCard n={5} title="رفع على App Store Connect" desc="في Organizer: Upload → أكمل بيانات المتجر" link="https://appstoreconnect.apple.com" linkLabel="App Store Connect" />
            </div>
            <div>
              <p className="text-xs font-black text-black/40 mb-3">apple-app-site-association</p>
              <CodeBlock title="apple-app-site-association" code={aasaJson} />
              <div className="p-3 bg-black/[0.02] rounded-xl border border-black/[0.06]">
                <a href={`${siteUrl}/.well-known/apple-app-site-association`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  {siteUrl}/.well-known/apple-app-site-association <ExternalLink className="w-3 h-3" />
                </a>
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
                <div className="w-8 h-8 rounded-xl bg-red-500 flex items-center justify-center"><Cpu className="w-4 h-4 text-white" /></div>
                <div><h2 className="text-sm font-black">Huawei App Gallery</h2><p className="text-[10px] text-black/40">HarmonyOS NEXT</p></div>
                {data.huaweiStoreUrl && <a href={data.huaweiStoreUrl} target="_blank" rel="noopener noreferrer" className="mr-auto"><Badge variant="outline" className="text-[10px] gap-1 text-red-600 border-red-200"><CheckCircle2 className="w-3 h-3" /> منشور</Badge></a>}
              </div>
              <StepCard n={1} title="توليد حزمة HarmonyOS" desc='تبويب "مولّد الحزم" → اختر هارموني → توليد وتنزيل' />
              <StepCard n={2} title="فتح في DevEco Studio" desc="افتح المجلد المُستخرج من ZIP في DevEco Studio 4.0+" />
              <StepCard n={3} title="إعداد التوقيع" desc="File → Project Structure → Signing Configs → أضف .p12 و .cer من AppGallery Connect" />
              <StepCard n={4} title="بناء HAP" desc="Build → Build Hap(s)/APP(s) → Build APP(s)" />
              <StepCard n={5} title="رفع على AppGallery Connect" desc="Software Versions → New Version → ارفع ملف .app" link="https://developer.huawei.com/consumer/en/service/josp/agc/index.html" linkLabel="AppGallery Connect" />
            </div>
            <div>
              <p className="text-xs font-black text-black/40 mb-3">assetlinks.json (مشترك)</p>
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
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center"><Globe className="w-4 h-4 text-white" /></div>
                <div><h2 className="text-sm font-black">Microsoft Store</h2><p className="text-[10px] text-black/40">Electron + MSIX</p></div>
                {data.msStoreUrl && <a href={data.msStoreUrl} target="_blank" rel="noopener noreferrer" className="mr-auto"><Badge variant="outline" className="text-[10px] gap-1 text-blue-600 border-blue-200"><CheckCircle2 className="w-3 h-3" /> منشور</Badge></a>}
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
                <a href={`${siteUrl}/browserconfig.xml`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  {siteUrl}/browserconfig.xml <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="p-4 rounded-xl border border-black/[0.06] bg-white">
                <p className="text-xs font-bold text-black mb-3">مقارنة متطلبات المتاجر</p>
                <table className="w-full text-[10px]" dir="rtl">
                  <thead><tr className="border-b border-black/[0.06]">
                    <th className="text-right pb-2 font-bold text-black/40">المتجر</th>
                    <th className="text-center pb-2 font-bold text-black/40">الرسوم</th>
                    <th className="text-center pb-2 font-bold text-black/40">Mac</th>
                    <th className="text-center pb-2 font-bold text-black/40">التعقيد</th>
                  </tr></thead>
                  <tbody>
                    {[
                      { name: "Google Play", fee: "$25", mac: "لا", c: "متوسط" },
                      { name: "App Store", fee: "$99/سنة", mac: "✓ نعم", c: "عالٍ" },
                      { name: "Huawei", fee: "مجاني", mac: "لا", c: "متوسط" },
                      { name: "Microsoft", fee: "$19", mac: "لا", c: "سهل ✓" },
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
              <p className="text-xs font-black text-black/40 uppercase tracking-widest mb-3">ملف Android Digital Asset Links</p>
              <CodeBlock title=".well-known/assetlinks.json" code={assetlinksJson} />
              <div className="p-3 bg-black/[0.02] rounded-xl border border-black/[0.06] text-[10px] text-black/50 space-y-1">
                <p className="font-bold text-black/60">يُستخدم لـ: Google Play · Huawei · Android Links</p>
                <a href={`${siteUrl}/.well-known/assetlinks.json`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" dir="ltr">
                  {siteUrl}/.well-known/assetlinks.json
                </a>
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-black/40 uppercase tracking-widest mb-3">ملف Apple App Site Association</p>
              <CodeBlock title="apple-app-site-association" code={aasaJson} />
              <div className="p-3 bg-black/[0.02] rounded-xl border border-black/[0.06] text-[10px] text-black/50">
                <p className="font-bold text-black/60 mb-1">يُستخدم لـ: iOS Universal Links · App Store</p>
                <a href={`${siteUrl}/.well-known/apple-app-site-association`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" dir="ltr">
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
