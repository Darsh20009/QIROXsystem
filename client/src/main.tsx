import { createRoot } from "react-dom/client";
import { useState } from "react";
import App from "./App";
import "./index.css";
import { SplashScreen } from "@/components/qirox-brand";

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  // In dev, ensure no stale SW intercepts module/HTML requests and breaks the app.
  if (import.meta.env.DEV) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      console.log("[PWA] Service workers + caches cleared (dev mode)");
    } catch (err) {
      console.warn("[PWA] SW cleanup failed:", err);
    }
    return;
  }
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    console.log("[PWA] Service Worker registered:", reg.scope);

    reg.addEventListener("updatefound", () => {
      const newWorker = reg.installing;
      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            newWorker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      }
    });

    if ("periodicSync" in reg) {
      try {
        const status = await navigator.permissions.query({ name: "periodic-background-sync" as PermissionName });
        if (status.state === "granted") {
          await (reg as any).periodicSync.register("refresh-notifications", { minInterval: 60 * 60 * 1000 });
          console.log("[PWA] Periodic sync registered");
        }
      } catch (_) {}
    }

    if ("sync" in reg) {
      try {
        await (reg as any).sync.register("sync-notifications");
      } catch (_) {}
    }

  } catch (err) {
    console.warn("[PWA] Service Worker registration failed:", err);
  }
}

registerServiceWorker();

// Splash screen disabled — direct entry to the app
function Root() {
  return <App />;
}

createRoot(document.getElementById("root")!).render(<Root />);
