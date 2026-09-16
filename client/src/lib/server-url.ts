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
    // Capacitor 7 exposes the platform check as a function. Use the global
    // runtime API first because the app intentionally keeps Capacitor
    // packages external in the browser bundle.
    const capacitor = (window as any).Capacitor;
    if (typeof capacitor?.isNativePlatform === "function") {
      return !!capacitor.isNativePlatform();
    }

    // When `server.url` points at the production site, the WebView location
    // is HTTPS instead of `capacitor://localhost`. In that configuration the
    // global Capacitor object is not guaranteed to be populated before the
    // first render, but the native bridge is already present. Detecting the
    // bridge prevents OAuth buttons from taking the user to external Safari.
    const webkitBridge = (window as any).webkit?.messageHandlers?.bridge;
    const androidBridge = (window as any).androidBridge;
    if (webkitBridge || androidBridge) return true;

    return (
      !!capacitor?.isNative ||
      window.location.protocol === "capacitor:" ||
      (window.location.hostname === "localhost" && !!capacitor)
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
 * Native OAuth sessions are completed in SFSafariViewController/Chrome Custom
 * Tabs, whose cookies are not available to the Capacitor WebView. Attach the
 * one-time device bearer token to native API calls and route relative API
 * URLs to the configured server.
 *
 * Native requests are routed to the configured server. Browser requests stay
 * same-origin, but may also carry the device token when cookie persistence is
 * blocked by an embedded browser or privacy settings.
 */
export function installNativeAuthFetch(): void {
  if (typeof window === "undefined") return;

  const marker = "__qiroxAuthFetchInstalled";
  if ((window as any)[marker]) return;
  (window as any)[marker] = true;

  const originalFetch = window.fetch.bind(window);
  const native = isCapacitorNative();
  const serverBase = getServerUrl();

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const inputUrl =
      typeof input === "string"
        ? new URL(input, window.location.href)
        : input instanceof URL
          ? new URL(input.href)
          : new URL(input.url, window.location.href);
    const serverOrigin = serverBase ? new URL(serverBase).origin : window.location.origin;
    const isRelativeApi =
      inputUrl.origin === window.location.origin &&
      (inputUrl.pathname === "/api" || inputUrl.pathname.startsWith("/api/"));
    const targetsServer = inputUrl.origin === serverOrigin;

    if (!isRelativeApi && !targetsServer) {
      return originalFetch(input, init);
    }

    const targetUrl = native && isRelativeApi
      ? `${serverBase}${inputUrl.pathname}${inputUrl.search}${inputUrl.hash}`
      : inputUrl.href;
    const token = (() => {
      try {
        return localStorage.getItem("qirox_device_token") || "";
      } catch {
        return "";
      }
    })();

    const headers = new Headers(
      input instanceof Request ? input.headers : undefined,
    );
    new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
    if (token) headers.set("x-device-token", token);

    const targetInput =
      targetUrl !== inputUrl.href
        ? input instanceof Request
          ? new Request(targetUrl, input)
          : targetUrl
        : input;

    return originalFetch(targetInput, { ...init, headers });
  }) as typeof window.fetch;
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
