import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { saveDeviceToken } from "./use-auth";
import { queryClient } from "@/lib/queryClient";

export function isBiometricSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.PublicKeyCredential &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
  );
}

export async function checkBiometricAvailable(): Promise<boolean> {
  if (!isBiometricSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

async function apiFetch(url: string, body?: object) {
  const res = await fetch(url, {
    method: body !== undefined ? "POST" : "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `خطأ ${res.status}`);
  return data;
}

export async function registerBiometric(deviceName?: string): Promise<void> {
  const options = await apiFetch("/api/auth/webauthn/register-options", {});
  const attestation = await startRegistration({ optionsJSON: options });
  await apiFetch("/api/auth/webauthn/register-verify", {
    response: attestation,
    deviceName: deviceName || getDeviceLabel(),
  });
  await queryClient.invalidateQueries({ queryKey: ["/api/auth/webauthn/credentials"] });
}

export async function loginWithBiometric(identifier: string): Promise<any> {
  const options = await apiFetch("/api/auth/webauthn/auth-options", { identifier });
  const assertion = await startAuthentication({ optionsJSON: options });
  const user = await apiFetch("/api/auth/webauthn/auth-verify", { response: assertion });
  if (user.deviceToken) {
    saveDeviceToken(user.deviceToken);
  }
  const userData = { ...user };
  delete userData.deviceToken;
  queryClient.setQueryData(["/api/user"], userData);
  return userData;
}

function getDeviceLabel(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  return "جهاز محفوظ";
}
