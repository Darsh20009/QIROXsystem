import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertUser } from "@shared/routes";
import { z } from "zod";
import { useLocation } from "wouter";

const DEVICE_TOKEN_KEY = "qirox_device_token";

export function getStoredDeviceToken(): string | null {
  try { return localStorage.getItem(DEVICE_TOKEN_KEY); } catch { return null; }
}

export function saveDeviceToken(token: string) {
  try { localStorage.setItem(DEVICE_TOKEN_KEY, token); } catch {}
}

export function clearDeviceToken() {
  try { localStorage.removeItem(DEVICE_TOKEN_KEY); } catch {}
}

export function useUser() {
  return useQuery({
    queryKey: [api.auth.user.path],
    queryFn: async () => {
      const res = await fetch(api.auth.user.path);
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return await res.json();
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (credentials: z.infer<typeof api.auth.login.input>) => {
      const deviceToken = getStoredDeviceToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (deviceToken) headers["x-device-token"] = deviceToken;

      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers,
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة");
        throw new Error("حدث خطأ أثناء تسجيل الدخول");
      }
      return await res.json();
    },
    onSuccess: (user) => {
      if (user.requires2FA) return;
      if (user.needsDeviceVerification) return;
      if (user.needsVerification) return;

      queryClient.setQueryData([api.auth.user.path], user);
      if (user.role === 'client') {
        const returnUrl = sessionStorage.getItem("returnAfterLogin");
        if (returnUrl) {
          sessionStorage.removeItem("returnAfterLogin");
          setLocation(returnUrl);
        } else {
          setLocation("/dashboard");
        }
      } else {
        setLocation("/admin");
      }
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (userData: InsertUser) => {
      const res = await fetch(api.auth.register.path, {
        method: api.auth.register.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "فشل إنشاء الحساب");
      }
      return await res.json();
    },
    // onSuccess handled by Login.tsx to show OTP verification step
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async () => {
      await fetch(api.auth.logout.path, { method: api.auth.logout.method });
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.user.path], null);
      setLocation("/");
    },
  });
}
