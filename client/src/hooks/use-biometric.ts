import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { saveDeviceToken } from "./use-auth";
import { queryClient } from "@/lib/queryClient";

const BIOMETRIC_DEVICE_KEY = "qirox_biometric_device";

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

/** Mark that a biometric has been registered on this device */
export function markBiometricRegistered(): void {
  try { localStorage.setItem(BIOMETRIC_DEVICE_KEY, "1"); } catch {}
}

/** Check if any biometric was previously registered from this browser */
export function isBiometricRegisteredLocally(): boolean {
  try { return localStorage.getItem(BIOMETRIC_DEVICE_KEY) === "1"; } catch { return false; }
}

/** Clear local biometric flag (e.g. after deleting all credentials) */
export function clearBiometricLocal(): void {
  try { localStorage.removeItem(BIOMETRIC_DEVICE_KEY); } catch {}
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
  markBiometricRegistered();
  await queryClient.invalidateQueries({ queryKey: ["/api/auth/webauthn/credentials"] });
}

/**
 * Login with biometric.
 * - If identifier provided: targeted flow (server returns only user's credentials)
 * - If no identifier: discoverable/resident-key flow (browser shows its own picker)
 */
export async function loginWithBiometric(identifier?: string): Promise<any> {
  const body: Record<string, string> = {};
  if (identifier?.trim()) body.identifier = identifier.trim();

  const options = await apiFetch("/api/auth/webauthn/auth-options", body);
  const assertion = await startAuthentication({ optionsJSON: options });
  const user = await apiFetch("/api/auth/webauthn/auth-verify", { response: assertion });
  if (user.deviceToken) {
    saveDeviceToken(user.deviceToken);
  }
  markBiometricRegistered();
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
