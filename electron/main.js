"use strict";
const { app, BrowserWindow, shell, ipcMain, Menu, Notification, dialog, nativeImage } = require("electron");
const path = require("path");

const QIROX_URL = process.env.QIROX_DEV_URL || "https://qiroxstudio.online";
const APP_NAME  = "QIROX Studio";
const APP_ID    = "online.qiroxstudio.desktop";

let mainWindow = null;

// ── Single instance lock ──────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); process.exit(0); }
app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// ── Deep-link protocol: qirox:// ─────────────────────────────────────────────
if (process.defaultApp) {
  if (process.argv.length >= 2) app.setAsDefaultProtocolClient("qirox", process.execPath, [path.resolve(process.argv[1])]);
} else {
  app.setAsDefaultProtocolClient("qirox");
}

function navigateDeepLink(url) {
  try {
    const route = url.replace(/^qirox:\/\//, "/");
    if (mainWindow) {
      mainWindow.loadURL(`${QIROX_URL}${route}`);
      mainWindow.focus();
    }
  } catch (e) {}
}

app.on("open-url", (event, url) => { event.preventDefault(); navigateDeepLink(url); });

// ── macOS Dock icon ───────────────────────────────────────────────────────────
function setDockIcon() {
  if (process.platform !== "darwin" || !app.dock) return;
  try { app.dock.setIcon(nativeImage.createFromPath(path.join(__dirname, "icons", "icon.png"))); } catch (e) {}
}

// ── App menu ─────────────────────────────────────────────────────────────────
function buildMenu(win) {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac ? [{
      label: APP_NAME,
      submenu: [
        { label: `عن ${APP_NAME}`, click: () => showAbout(win) },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" }, { role: "hideOthers" }, { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    }] : []),
    {
      label: "التطبيق",
      submenu: [
        { label: "الرئيسية",    accelerator: isMac ? "Cmd+Shift+H" : "Ctrl+Shift+H", click: () => win.loadURL(QIROX_URL) },
        { label: "لوحة التحكم", accelerator: isMac ? "Cmd+D" : "Ctrl+D",             click: () => win.loadURL(`${QIROX_URL}/dashboard`) },
        { label: "الطلبات",                                                            click: () => win.loadURL(`${QIROX_URL}/order`) },
        { label: "الأسعار",                                                            click: () => win.loadURL(`${QIROX_URL}/prices`) },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    {
      label: "عرض",
      submenu: [
        { role: "reload" }, { role: "forceReload" },
        { type: "separator" },
        { role: "zoomIn" }, { role: "zoomOut" }, { role: "resetZoom" },
        { type: "separator" },
        { role: "togglefullscreen" },
        ...(process.env.NODE_ENV === "development" ? [{ role: "toggleDevTools" }] : []),
      ],
    },
    {
      label: "نافذة",
      submenu: [
        { role: "minimize" }, { role: "zoom" },
        ...(isMac ? [{ type: "separator" }, { role: "front" }] : [{ role: "close" }]),
      ],
    },
  ];
  return Menu.buildFromTemplate(template);
}

function showAbout(win) {
  dialog.showMessageBox(win, {
    type: "info",
    title: `عن ${APP_NAME}`,
    message: "QIROX Studio | كيروكس استوديو",
    detail: `الإصدار: ${app.getVersion()}\n\nمصنع الأنظمة الرقمية\nhttps://qiroxstudio.online`,
    buttons: ["حسناً"],
  });
}

// ── Create main window ────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width:     1440,
    height:    900,
    minWidth:  1024,
    minHeight: 700,
    title:     APP_NAME,
    icon:      path.join(__dirname, "icons", "icon.png"),
    backgroundColor: "#111111",
    show: false,

    // macOS native feel
    titleBarStyle:         process.platform === "darwin" ? "hiddenInset" : "default",
    trafficLightPosition:  { x: 16, y: 16 },
    vibrancy:              process.platform === "darwin" ? "under-window" : undefined,
    visualEffectState:     process.platform === "darwin" ? "active" : undefined,

    webPreferences: {
      preload:                  path.join(__dirname, "preload.js"),
      contextIsolation:         true,
      nodeIntegration:          false,
      webSecurity:              true,
      allowRunningInsecureContent: false,
      // Persistent session so push notification subscriptions survive restarts
      partition: "persist:qirox-v1",
    },
  });

  Menu.setApplicationMenu(buildMenu(mainWindow));

  mainWindow.loadURL(QIROX_URL);

  // Show when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Open external links in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const isInternal = url.startsWith(QIROX_URL) || url.startsWith("https://qiroxstudio.online");
    if (!isInternal) { shell.openExternal(url); return { action: "deny" }; }
    return { action: "allow" };
  });

  mainWindow.webContents.on("did-fail-load", (_e, code, desc) => {
    if (code === -3) return; // aborted (navigation)
    mainWindow.loadFile(path.join(__dirname, "offline.html")).catch(() => {});
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

// ── IPC handlers ─────────────────────────────────────────────────────────────

// Native OS notification (web → Electron bridge)
ipcMain.handle("qirox:notify", (_e, { title, body, tag }) => {
  if (!Notification.isSupported()) return;
  const n = new Notification({ title: title || APP_NAME, body: body || "" });
  n.on("click", () => { if (mainWindow) mainWindow.focus(); });
  n.show();
});

// macOS Dock badge (unread count)
ipcMain.handle("qirox:badge", (_e, count) => {
  if (process.platform === "darwin" && app.dock) {
    app.dock.setBadge(count > 0 ? String(count) : "");
  }
});

// Navigate in-app
ipcMain.handle("qirox:navigate", (_e, path) => {
  if (mainWindow) mainWindow.loadURL(`${QIROX_URL}${path}`);
});

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  setDockIcon();
  createWindow();
  app.on("activate", () => { if (!mainWindow) createWindow(); });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Windows/Linux deep-link (via process.argv)
app.on("second-instance", (_e, argv) => {
  const url = argv.find(a => a.startsWith("qirox://"));
  if (url) navigateDeepLink(url);
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});
