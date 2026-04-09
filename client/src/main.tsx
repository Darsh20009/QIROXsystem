import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
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

    // Register Periodic Background Sync if supported
    if ("periodicSync" in reg) {
      try {
        const status = await navigator.permissions.query({ name: "periodic-background-sync" as PermissionName });
        if (status.state === "granted") {
          await (reg as any).periodicSync.register("refresh-notifications", { minInterval: 60 * 60 * 1000 });
          console.log("[PWA] Periodic sync registered");
        }
      } catch (_) {}
    }

    // Register one-time background sync for notifications check on load
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

createRoot(document.getElementById("root")!).render(<App />);
