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
  } catch (err) {
    console.warn("[PWA] Service Worker registration failed:", err);
  }
}

registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
