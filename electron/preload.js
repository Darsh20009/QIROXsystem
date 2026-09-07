"use strict";
const { contextBridge, ipcRenderer } = require("electron");

// Expose a safe bridge from the renderer (web app) to the Electron main process.
// Nothing from Node.js is exposed directly — only explicit IPC channels.
contextBridge.exposeInMainWorld("electronQirox", {
  // Runtime flag — lets the web app know it's running inside Electron
  isDesktop: true,
  platform: process.platform,

  // Show a native OS notification
  notify: (opts) => ipcRenderer.invoke("qirox:notify", opts),

  // Set Dock badge count (macOS) or taskbar badge (Windows)
  setBadge: (count) => ipcRenderer.invoke("qirox:badge", count),

  // Navigate to a route inside the app
  navigate: (path) => ipcRenderer.invoke("qirox:navigate", path),
});
