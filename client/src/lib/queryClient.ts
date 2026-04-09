import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
    res = await fetch(url, {
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
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
