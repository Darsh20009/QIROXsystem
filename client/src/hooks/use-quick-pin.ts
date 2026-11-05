import { saveDeviceToken } from "./use-auth";
import { queryClient } from "@/lib/queryClient";

const QUICK_PIN_KEY = "qirox_quick_pin_set";

export function markQuickPinSet(): void {
  try { localStorage.setItem(QUICK_PIN_KEY, "1"); } catch {}
}

export function clearQuickPinLocal(): void {
  try { localStorage.removeItem(QUICK_PIN_KEY); } catch {}
}

export function isQuickPinSetLocally(): boolean {
  try { return localStorage.getItem(QUICK_PIN_KEY) === "1"; } catch { return false; }
}

async function apiFetch(method: string, url: string, body?: object) {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `خطأ ${res.status}`);
  return data;
}

export async function getQuickPinStatus(): Promise<{ hasPin: boolean; setAt: string | null }> {
  return apiFetch("GET", "/api/auth/quick-pin/status");
}

export async function setQuickPin(pin: string): Promise<void> {
  await apiFetch("POST", "/api/auth/quick-pin/set", { pin });
  markQuickPinSet();
  await queryClient.invalidateQueries({ queryKey: ["/api/auth/quick-pin/status"] });
}

export async function removeQuickPin(): Promise<void> {
  await apiFetch("DELETE", "/api/auth/quick-pin/remove");
  clearQuickPinLocal();
  await queryClient.invalidateQueries({ queryKey: ["/api/auth/quick-pin/status"] });
}

export async function loginWithQuickPin(identifier: string, pin: string): Promise<any> {
  const user = await apiFetch("POST", "/api/auth/quick-pin/login", { identifier, pin });
  if (user.deviceToken) {
    saveDeviceToken(user.deviceToken);
  }
  const userData = { ...user };
  delete userData.deviceToken;
  queryClient.setQueryData(["/api/user"], userData);
  return userData;
}
