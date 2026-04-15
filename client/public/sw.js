const CACHE_NAME = "qirox-v15";
const RUNTIME_CACHE = "qirox-runtime-v15";

const STATIC_ASSETS = [
  "/",
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
  "/widget-template.json",
];

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>QIROX Studio — غير متصل</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:system-ui,sans-serif;background:#111;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px}
  .wrap{max-width:360px}
  .logo{width:72px;height:72px;background:#fff;border-radius:18px;display:flex;align-items:center;justify-content:center;margin:0 auto 28px;font-size:32px;font-weight:900;color:#111}
  h1{font-size:1.8rem;font-weight:900;margin-bottom:10px;letter-spacing:-0.02em}
  p{color:rgba(255,255,255,0.45);font-size:0.95rem;line-height:1.65;margin-bottom:32px}
  button{background:#fff;color:#111;border:none;padding:13px 32px;border-radius:12px;font-size:0.95rem;font-weight:700;cursor:pointer;transition:opacity .15s}
  button:hover{opacity:.85}
  .dot{display:inline-block;width:8px;height:8px;background:#666;border-radius:50%;margin-bottom:32px;animation:pulse 2s infinite}
  @keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
</style>
</head>
<body>
  <div class="wrap">
    <div class="logo">Q</div>
    <span class="dot"></span>
    <h1>لا يوجد اتصال بالإنترنت</h1>
    <p>تحقق من اتصالك وأعد المحاولة.<br/>المحتوى المحفوظ قد يكون متاحاً.</p>
    <button onclick="location.reload()">إعادة المحاولة</button>
  </div>
</body>
</html>`;

// ─── Install ───────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.put("/__offline", new Response(OFFLINE_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      }));
      // Pre-cache static assets one by one, ignore failures
      for (const asset of STATIC_ASSETS) {
        try { await cache.add(asset); } catch (_) {}
      }
    })
  );
  self.skipWaiting();
});

// ─── Activate ──────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== RUNTIME_CACHE && !k.startsWith("qirox-pending"))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ─────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Skip cross-origin
  if (url.origin !== self.location.origin) return;

  // Skip API requests — let the app handle offline errors itself
  if (url.pathname.startsWith("/api/")) return;

  // Skip Vite HMR / websocket / internal dev stuff
  if (
    url.pathname.startsWith("/__vite") ||
    url.pathname.startsWith("/@id/") ||
    url.search.includes("import") ||
    req.headers.get("accept") === "text/event-stream"
  ) return;

  // Skip dev-mode HMR noise (but still cache normal module requests)
  if (url.pathname.startsWith("/@react-refresh") || url.pathname.startsWith("/@vite")) return;

  // ── Navigation requests: network-first, offline fallback ──
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put("/", clone));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match("/");
          if (cached) return cached;
          return caches.match("/__offline");
        })
    );
    return;
  }

  // ── Production built assets (/assets/*): cache-first ──
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const clone = res.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, clone));
            }
            return res;
          })
          .catch(() => new Response("", { status: 504 }));
      })
    );
    return;
  }

  // ── Static assets (images, fonts, icons): cache-first ──
  const isStaticExt = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico", ".json", ".xml", ".woff2", ".woff", ".ttf"].some(
    (ext) => url.pathname.endsWith(ext)
  );
  if (isStaticExt) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const clone = res.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, clone));
            }
            return res;
          })
          .catch(() => new Response("", { status: 404 }));
      })
    );
    return;
  }

  // ── JS/CSS in dev mode: network with runtime caching ──
  const isScript = url.pathname.endsWith(".js") || url.pathname.endsWith(".css") || url.pathname.endsWith(".mjs");
  if (isScript) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || new Response("", { status: 504 })))
    );
    return;
  }
});

// ─── Push Notifications ────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {
    title: "QIROX Studio",
    body: "لديك إشعار جديد",
    icon: "/icon-192.png",
    badge: "/favicon-32.png",
    tag: "qirox-notif",
    data: { url: "/dashboard" },
  };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch (_) {}

  const isPushAuth = data.tag && data.tag.startsWith("push-auth-");
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/icon-192.png",
      badge: data.badge || "/favicon-32.png",
      tag: data.tag || "qirox-notif",
      renotify: true,
      requireInteraction: data.requireInteraction === true || isPushAuth,
      vibrate: isPushAuth ? [200, 100, 200, 100, 200] : [100, 50, 100],
      data: data.data || { url: "/dashboard" },
      actions: isPushAuth
        ? [{ action: "open", title: "تأكيد / رفض" }, { action: "dismiss", title: "تجاهل" }]
        : [{ action: "open", title: "فتح التطبيق" }, { action: "dismiss", title: "تجاهل" }],
    }).then(() =>
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        clients.forEach((c) => c.postMessage({ type: "PUSH_RECEIVED", payload: data }));
      })
    )
  );
});

// ─── Notification Click ────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const rawUrl = event.notification.data?.url || "/dashboard";
  if (event.action === "dismiss") return;

  // Ensure absolute URL for openWindow (required in some browsers)
  const targetUrl = rawUrl.startsWith("http")
    ? rawUrl
    : self.location.origin + rawUrl;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Prefer an already-open tab from our origin
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.postMessage({ type: "NAVIGATE", url: rawUrl });
          return client.focus();
        }
      }
      // No open tab — open a new one
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});

// ─── Background Sync ───────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending-orders") event.waitUntil(syncPendingOrders());
  else if (event.tag === "sync-notifications") event.waitUntil(syncNotifications());
  else if (event.tag === "sync-contact-form") event.waitUntil(syncContactForm());
});

async function syncPendingOrders() {
  try {
    const cache = await caches.open("qirox-pending-sync");
    const keys = await cache.keys();
    for (const req of keys) {
      const body = await (await cache.match(req)).json();
      try {
        const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (res.ok) await cache.delete(req);
      } catch (_) {}
    }
  } catch (_) {}
}

async function syncNotifications() {
  try {
    const res = await fetch("/api/notifications/unread-count");
    if (res.ok) {
      const { count } = await res.json();
      if (count > 0) {
        self.registration.showNotification("QIROX Studio", {
          body: `لديك ${count} إشعار غير مقروء`,
          icon: "/icon-192.png",
          badge: "/favicon-32.png",
          tag: "qirox-unread",
          data: { url: "/dashboard" },
        });
      }
    }
  } catch (_) {}
}

async function syncContactForm() {
  try {
    const db = await openDB();
    const pending = await getAll(db, "pending-contact");
    for (const item of pending) {
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.data),
        });
        if (res.ok) await deleteItem(db, "pending-contact", item.id);
      } catch (_) {}
    }
  } catch (_) {}
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("qirox-offline", 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("pending-contact")) {
        db.createObjectStore("pending-contact", { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function getAll(db, store) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function deleteItem(db, store, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ─── Background Fetch ──────────────────────────────────
self.addEventListener("backgroundfetchsuccess", (event) => {
  event.waitUntil((async () => {
    const bgFetch = event.registration;
    const cache = await caches.open(CACHE_NAME);
    const records = await bgFetch.matchAll();
    await Promise.all(records.map(async (record) => {
      const response = await record.responseReady;
      await cache.put(record.request, response);
    }));
    self.clients.matchAll({ type: "window" }).then((clients) => {
      clients.forEach((c) => c.postMessage({ type: "BG_FETCH_DONE", id: bgFetch.id }));
    });
  })());
});

self.addEventListener("backgroundfetchfail", (event) => {
  self.clients.matchAll({ type: "window" }).then((clients) => {
    clients.forEach((c) => c.postMessage({ type: "BG_FETCH_FAIL", id: event.registration.id }));
  });
});

self.addEventListener("backgroundfetchclick", (event) => {
  event.waitUntil(self.clients.openWindow("/dashboard"));
});

// ─── Message ───────────────────────────────────────────
self.addEventListener("message", (event) => {
  const { type, payload } = event.data || {};
  if (type === "SKIP_WAITING") {
    self.skipWaiting();
  } else if (type === "QUEUE_SYNC") {
    openDB().then((db) => {
      const tx = db.transaction("pending-contact", "readwrite");
      tx.objectStore("pending-contact").add({ data: payload, timestamp: Date.now() });
    });
    self.registration.sync?.register("sync-contact-form").catch(() => {});
  } else if (type === "REQUEST_NOTIFICATION_SYNC") {
    self.registration.sync?.register("sync-notifications").catch(() => {});
  }
});

// ─── Periodic Background Sync ──────────────────────────
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "refresh-notifications") event.waitUntil(syncNotifications());
});
