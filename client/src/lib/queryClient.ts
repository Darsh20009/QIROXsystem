import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { apiUrl } from "./server-url";

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError && (
    err.message.includes("Failed to fetch") ||
    err.message.includes("NetworkError") ||
    err.message.includes("network") ||
    err.message.includes("Load failed") ||
    err.message.includes("fetch")
  )) return true;
  return !navigator.onLine;
}

function networkOfflineError(): Error {
  return new Error("لا يوجد اتصال بالإنترنت. تحقق من الشبكة وأعد المحاولة.");
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.message || json.error || "حدث خطأ غير متوقع، حاول مجدداً");
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error(text || res.statusText || "حدث خطأ غير متوقع، حاول مجدداً");
      }
      throw e;
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  if (!navigator.onLine) throw networkOfflineError();

  let res: Response;
  try {
    res = await fetch(apiUrl(url), {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
  } catch (err) {
    if (isNetworkError(err)) throw networkOfflineError();
    throw err;
  }

  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.message || json.error || "حدث خطأ غير متوقع، حاول مجدداً");
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error(text || res.statusText || "حدث خطأ غير متوقع، حاول مجدداً");
      }
      throw e;
    }
  }

  const text = await res.text();
  const body = text ? JSON.parse(text) : {};

  return new Response(JSON.stringify(body), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    if (!navigator.onLine) throw networkOfflineError();

    let res: Response;
    try {
      res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
      });
    } catch (err) {
      if (isNetworkError(err)) throw networkOfflineError();
      throw err;
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      // Smart retry: allow 1 retry for transient errors (network hiccups, timing issues)
      // but never retry auth/permission errors which are definitive
      retry: (failureCount, error) => {
        const msg = String((error as any)?.message || "");
        if (
          msg.includes("403") ||
          msg.includes("Forbidden") ||
          msg.includes("لا يوجد اتصال")
        ) return false;
        return failureCount < 1;
      },
      retryDelay: 800,
    },
    mutations: {
      // Retry once automatically for transient network/server errors.
      // Never retry for business-logic failures (4xx) or offline errors.
      retry: (failureCount, error) => {
        if (failureCount >= 1) return false;
        const msg = String((error as any)?.message || "");
        // Don't retry auth, validation, permission, or offline errors
        if (
          msg.includes("401") ||
          msg.includes("403") ||
          msg.includes("400") ||
          msg.includes("422") ||
          msg.includes("404") ||
          msg.includes("لا يوجد اتصال") ||
          msg.includes("Unauthorized") ||
          msg.includes("Forbidden") ||
          msg.includes("Not Found")
        ) return false;
        // Retry once for network/server (5xx) errors
        return true;
      },
      retryDelay: 800,
    },
  },
});
