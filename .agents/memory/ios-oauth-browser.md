---
name: iOS OAuth in-app browser
description: How Google/Apple/GitHub OAuth works on Capacitor native to satisfy Apple App Store Guideline 4.
---

## Rule
On Capacitor native (`isCapacitorNative() === true`), all OAuth flows use `@capacitor/browser` instead of `window.location.href`. This opens SFSafariViewController (iOS) / Chrome Custom Tabs (Android) — both are in-app and pass App Store review. Detect native mode through the runtime global's `isNativePlatform()` function before the legacy flags.

**Implementation in `client/src/pages/Login.tsx`:**
```typescript
const openOAuthNative = async (path: string) => {
  const { Browser } = await import("@capacitor/browser");
  const { App } = await import("@capacitor/app");
  const url = `${getServerUrl()}${path}`;
  // Primary: appUrlOpen fires when universal link / deep link returns to app
  const handle = await App.addListener("appUrlOpen", async (data) => {
    await handle.remove();
    await Browser.close();
    // Extract googleToken / appleToken / githubToken from URL and finish login
  });
  // Fallback: if no universal link, browserFinished fires when user closes browser
  const finishHandle = await Browser.addListener("browserFinished", async () => {
    await finishHandle.remove(); await handle.remove();
    // Check /api/user to see if session is active
  });
  await Browser.open({ url, toolbarColor: "#000000", windowName: "_self" });
};
```

**Why:** Apple Guideline 4 rejects apps that open the system browser (Safari.app) for sign-in. SFSafariViewController is Apple's recommended in-app solution. `@capacitor/browser` wraps it automatically.

**How to apply:** Any new OAuth provider added must also call `openOAuthNative(path)` on native, not `window.location.href`. The `handleGoogleLogin`, `handleAppleLogin`, `handleGithubLogin` functions in Login.tsx all follow this pattern. Do not statically import `@capacitor/core` in the browser bundle; this project's build leaves Capacitor packages external and the native runtime supplies `window.Capacitor`.

## Session regeneration
Capture the native-flow marker before calling `req.login`; Passport may regenerate the session during login and discard transient session fields. Pass the captured boolean into the final redirect helper.

**Why:** Without capturing it before `req.login`, a successful native OAuth callback can fall back to `/login` instead of returning through the app's custom URL scheme.

**How to apply:** Keep the provider callback's native state separate from the post-login session state, and use it for success and failure redirects after Passport finishes.

## Native API authentication
Native OAuth completes in an in-app browser whose cookies are not shared with the Capacitor WebView. The app must attach the stored device-token bearer to native `/api/*` requests, and relative API URLs must resolve to the configured server origin.

**Why:** A successful OAuth callback can return to the app while `/api/user` and all subsequent authenticated requests still appear logged out if they rely only on the browser session cookie.

**How to apply:** Keep device tokens hashed server-side, validate their fixed format and expiry before assigning `req.user`, and install the native-only fetch adapter before React queries start. Browser requests should remain same-origin cookie based.
