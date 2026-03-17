import { useEffect } from "react";

export function AntiDevTools() {
  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Block common keyboard shortcuts for DevTools
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I", "J", "C", "i", "j", "c"].includes(e.key)) {
        e.preventDefault();
        return false;
      }
      // Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === "U" || e.key === "u")) {
        e.preventDefault();
        return false;
      }
      // Ctrl+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === "S" || e.key === "s")) {
        e.preventDefault();
        return false;
      }
    };

    // Detect DevTools open via window size heuristic
    // Skip detection if running inside an iframe to avoid false positives
    const isInIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
    const detectDevTools = () => {
      if (isInIframe) return; // Don't block when embedded as iframe
      if (!import.meta.env.PROD) return; // Only in production
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      if (widthThreshold || heightThreshold) {
        document.body.innerHTML = `
          <div style="
            min-height:100vh;display:flex;flex-direction:column;
            align-items:center;justify-content:center;
            background:#0a0a0a;color:#fff;font-family:sans-serif;text-align:center;
            padding:2rem;gap:1rem;
          ">
            <div style="font-size:4rem;">🔒</div>
            <h1 style="font-size:1.5rem;font-weight:900;margin:0;">وصول محظور</h1>
            <p style="color:#888;font-size:0.9rem;margin:0;">أدوات المطورين محظورة في هذا النظام</p>
            <p style="color:#555;font-size:0.75rem;margin:0;">Developer tools are blocked in this system</p>
          </div>
        `;
      }
    };

    // Disable text selection on sensitive areas
    const disableSelect = (e: Event) => {
      if ((e.target as HTMLElement)?.closest?.("[data-no-select]")) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("selectstart", disableSelect);

    const devToolsInterval = setInterval(detectDevTools, 1000);

    // Disable console access in production
    if (import.meta.env.PROD) {
      const noop = () => {};
      try {
        Object.defineProperty(window, "console", {
          get() {
            return {
              log: noop, warn: noop, error: noop, info: noop,
              debug: noop, trace: noop, dir: noop, table: noop,
            };
          },
        });
      } catch (_) {}
    }

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("selectstart", disableSelect);
      clearInterval(devToolsInterval);
    };
  }, []);

  return null;
}
