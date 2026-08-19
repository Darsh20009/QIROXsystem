/**
 * Capacitor Native Detection & Server URL Resolution
 *
 * In a regular browser: relative paths like /api/... work directly (same origin).
 * In Capacitor Native (iOS/Android): the app loads from capacitor://localhost,
 * so all API requests must be directed to the live server.
 *
 * Set VITE_CAPACITOR_SERVER_URL at build time to point to your production server.
 * Alternatively, override at runtime via localStorage key "qirox_server_url".
 */

export function isCapacitorNative(): boolean {
  try {
    return (
      !!(window as any).Capacitor?.isNative ||
      window.location.protocol === "capacitor:" ||
      (window.location.hostname === "localhost" && !!(window as any).Capacitor)
    );
  } catch {
    return false;
  }
}

export function getServerUrl(): string {
  if (!isCapacitorNative()) return "";

  const buildTimeUrl =
    (import.meta.env.VITE_CAPACITOR_SERVER_URL as string) || "";
  if (buildTimeUrl) return buildTimeUrl.replace(/\/$/, "");

  try {
    const runtime = localStorage.getItem("qirox_server_url") || "";
    if (runtime) return runtime.replace(/\/$/, "");
  } catch {}

  return "https://qiroxstudio.online";
}

export function apiUrl(path: string): string {
  const base = getServerUrl();
  if (!base) return path;
  return base + (path.startsWith("/") ? path : "/" + path);
}

/**
 * Opens a payment URL.
 * - In Native: uses @capacitor/browser (SFSafariViewController on iOS, Chrome Custom Tab on Android)
 * - In Browser: full-page redirect
 */
export async function openPaymentUrl(
  url: string,
  onBrowserFinished?: () => void
): Promise<void> {
  if (isCapacitorNative()) {
    try {
      const { Browser } = await import("@capacitor/browser");
      if (onBrowserFinished) {
        await Browser.addListener("browserFinished", onBrowserFinished);
      }
      await Browser.open({
        url,
        toolbarColor: "#111111",
        presentationStyle: "popover",
      });
    } catch {
      window.location.href = url;
    }
  } else {
    window.location.href = url;
  }
}

/**
 * Returns the correct return URL for payment providers.
 * In Native: uses the live server URL instead of capacitor://localhost
 */
export function getPaymentReturnUrl(path: string): string {
  const base = isCapacitorNative()
    ? getServerUrl()
    : window.location.origin;
  return base + (path.startsWith("/") ? path : "/" + path);
}
