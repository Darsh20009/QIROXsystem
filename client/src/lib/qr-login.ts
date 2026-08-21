export type QrScanResult =
  | { kind: "login"; url: URL }
  | { kind: "public-profile"; url: URL }
  | { kind: "invalid"; reason: "malformed" | "untrusted-origin" | "invalid-login" };

const LOGIN_QR_PATH = /^\/api\/qr-login\/qrl_[a-f0-9]{64}$/i;
const PUBLIC_EMPLOYEE_PROFILE_PATH = /^\/ep\/[^/]+$/;

export function classifyEmployeeQrValue(decoded: string, currentOrigin: string): QrScanResult {
  let url: URL;
  try {
    url = new URL(decoded);
  } catch {
    return { kind: "invalid", reason: "malformed" };
  }

  const trustedOrigins = new Set([currentOrigin, "https://qiroxstudio.online"]);
  if (!trustedOrigins.has(url.origin)) return { kind: "invalid", reason: "untrusted-origin" };
  if (LOGIN_QR_PATH.test(url.pathname) && !url.search && !url.hash) return { kind: "login", url };
  if (PUBLIC_EMPLOYEE_PROFILE_PATH.test(url.pathname) && !url.search && !url.hash) return { kind: "public-profile", url };
  return { kind: "invalid", reason: "invalid-login" };
}