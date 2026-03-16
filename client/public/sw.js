const CACHE_NAME = "qirox-v12";
const STATIC_ASSETS = [
  "/manifest.json",
  "/browserconfig.xml",
  "/favicon.ico",
  "/favicon-16.png",
  "/favicon-32.png",
  "/favicon-48.png",
  "/favicon.png",
  "/icon-70.png",
  "/icon-144.png",
  "/icon-150.png",
  "/icon-192.png",
  "/icon-192-maskable.png",
  "/icon-256.png",
  "/icon-310.png",
  "/icon-310x150.png",
  "/icon-512.png",
  "/icon-512-maskable.png",
  "/apple-touch-icon.png",
  "/apple-touch-icon-120.png",
  "/apple-touch-icon-152.png",
  "/apple-touch-icon-180.png",
  "/logo.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) return;

  if (
    url.pathname.startsWith("/@") ||
    url.pathname.startsWith("/node_modules/") ||
    url.pathname.startsWith("/__vite") ||
    url.search.includes("v=") ||
    url.search.includes("t=")
  ) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(new Request("/"), clone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match("/").then((cached) => {
            return (
              cached ||
              new Response("Offline — please check your connection", {
                status: 503,
                headers: { "Content-Type": "text/plain" },
              })
            );
          });
        })
    );
    return;
  }

  const isStaticAsset = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico", ".json", ".xml"].some(
    (ext) => url.pathname.endsWith(ext)
  );

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => new Response("", { status: 404 }));
      })
    );
    return;
  }
});

self.addEventListener("push", (event) => {
  let data = {
    title: "QIROX Studio",
    body: "لديك إشعار جديد",
    icon: "/icon-192.png",
    badge: "/favicon-32.png",
    tag: "qirox-notif",
    data: { url: "/dashboard" },
  };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (e) {}

  const isPushAuth = data.tag && data.tag.startsWith("push-auth-");

  event.waitUntil(
    self.registration
      .showNotification(data.title, {
        body: data.body,
        icon: data.icon || "/icon-192.png",
        badge: data.badge || "/favicon-32.png",
        tag: data.tag || "qirox-notif",
        renotify: true,
        requireInteraction: data.requireInteraction === true || isPushAuth,
        vibrate: isPushAuth ? [200, 100, 200, 100, 200] : [100, 50, 100],
        data: data.data || { url: "/dashboard" },
        actions: isPushAuth
          ? [
              { action: "open", title: "تأكيد / رفض" },
              { action: "dismiss", title: "تجاهل" },
            ]
          : [
              { action: "open", title: "فتح التطبيق" },
              { action: "dismiss", title: "تجاهل" },
            ],
      })
      .then(() => {
        return self.clients
          .matchAll({ type: "window", includeUncontrolled: true })
          .then((clients) => {
            clients.forEach((client) => {
              client.postMessage({ type: "PUSH_RECEIVED", payload: data });
            });
          });
      })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";
  if (event.action === "dismiss") return;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.postMessage({ type: "NAVIGATE", url: targetUrl });
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      })
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
