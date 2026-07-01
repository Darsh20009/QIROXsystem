/**
 * Capacitor Native Initialization
 * Handles push notifications, status bar, and native iOS/Android setup
 */

import { isCapacitorNative, getServerUrl } from "./server-url";

async function savePushToken(token: string, platform: "ios" | "android") {
  try {
    const base = getServerUrl();
    await fetch(`${base}/api/push/native-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token, platform }),
    });
  } catch (err) {
    console.warn("[CAP] Failed to save push token:", err);
  }
}

async function initPushNotifications() {
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    const permResult = await PushNotifications.checkPermissions();

    let perm = permResult.receive;
    if (perm === "prompt" || perm === "prompt-with-rationale") {
      const req = await PushNotifications.requestPermissions();
      perm = req.receive;
    }

    if (perm !== "granted") {
      console.warn("[CAP] Push notification permission denied");
      return;
    }

    await PushNotifications.register();

    await PushNotifications.addListener("registration", async (token) => {
      console.log("[CAP] Push token:", token.value);
      const platform = (window as any).Capacitor?.getPlatform?.() === "android" ? "android" : "ios";
      await savePushToken(token.value, platform);
    });

    await PushNotifications.addListener("registrationError", (err) => {
      console.error("[CAP] Push registration error:", err.error);
    });

    await PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("[CAP] Foreground notification:", notification);
    });

    await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const url = action.notification?.data?.url;
      if (url) {
        if (url.startsWith("http")) {
          window.location.href = url;
        } else {
          window.location.hash = url;
        }
      }
    });
  } catch (err) {
    console.warn("[CAP] Push notifications init error:", err);
  }
}

async function initStatusBar() {
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    const isDark = document.documentElement.classList.contains("dark");
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color: isDark ? "#111111" : "#ffffff" });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch {}
}

async function initHaptics() {
  try {
    const { Haptics } = await import("@capacitor/haptics");

    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "BUTTON" ||
        target.closest("button") ||
        target.closest("[role='button']")
      ) {
        Haptics.selectionChanged().catch(() => {});
      }
    }, { passive: true });
  } catch {}
}

async function initKeyboard() {
  try {
    const { Keyboard } = await import("@capacitor/keyboard");
    await Keyboard.setAccessoryBarVisible({ isVisible: true });
    await Keyboard.setScroll({ isDisabled: false });
  } catch {}
}

export async function initCapacitor(): Promise<void> {
  if (!isCapacitorNative()) return;

  console.log("[CAP] Initializing Capacitor native...");

  await Promise.allSettled([
    initStatusBar(),
    initHaptics(),
    initKeyboard(),
  ]);

  await initPushNotifications();

  console.log("[CAP] Capacitor initialized ✓");
}
