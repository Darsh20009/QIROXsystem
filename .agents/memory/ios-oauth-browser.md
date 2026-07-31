---
name: iOS OAuth in-app browser
description: How Google/Apple/GitHub OAuth works on Capacitor native to satisfy Apple App Store Guideline 4.
---

## Rule
On Capacitor native (`isCapacitorNative() === true`), all OAuth flows use `@capacitor/browser` instead of `window.location.href`. This opens SFSafariViewController (iOS) / Chrome Custom Tabs (Android) — both are in-app and pass App Store review.

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

**How to apply:** Any new OAuth provider added must also call `openOAuthNative(path)` on native, not `window.location.href`. The `handleGoogleLogin`, `handleAppleLogin`, `handleGithubLogin` functions in Login.tsx all follow this pattern.
