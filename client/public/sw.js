const CACHE_NAME = "qirox-v13";
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

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>QIROX Studio — غير متصل</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:system-ui,sans-serif;background:#111;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px}
  .logo{width:64px;height:64px;background:#fff;border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:28px;font-weight:900;color:#111}
  h1{font-size:2rem;font-weight:900;margin-bottom:8px}
  p{color:rgba(255,255,255,0.45);font-size:1rem;line-height:1.6;max-width:320px;margin:0 auto 28px}
  button{background:#fff;color:#111;border:none;padding:12px 28px;border-radius:12px;font-size:1rem;font-weight:700;cursor:pointer}
  button:hover{opacity:0.85}
</style>
</head>
<body>
  <div>
    <div class="logo">Q</div>
    <h1>أنت غير متصل بالإنترنت</h1>
    <p>تحقق من اتصالك وأعد المحاولة. محتوى مخزّن قد يكون متاحاً.</p>
    <button onclick="location.reload()">إعادة المحاولة</button>
  </div>
</body>
</html>`;

// ─── Install ───────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(STATIC_ASSETS);
      await cache.put("/__offline", new Response(OFFLINE_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      }));
    })
  );
  self.skipWaiting();
});

// ─── Activate ──────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ─────────────────────────────────────────────
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

  // Navigation requests → network-first with offline fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(new Request("/"), clone));
          }
          return response;
        })
        .catch(() =>
          caches.match("/").then((cached) => cached || caches.match("/__offline"))
        )
    );
    return;
  }

  // Static assets → cache-first
  const isStaticAsset = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico", ".json", ".xml", ".woff2", ".woff"].some(
    (ext) => url.pathname.endsWith(ext)
  );
  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => new Response("", { status: 404 }));
      })
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
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {}

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
  const targetUrl = event.notification.data?.url || "/dashboard";
  if (event.action === "dismiss") return;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
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

// ─── Background Sync ───────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending-orders") {
    event.waitUntil(syncPendingOrders());
  } else if (event.tag === "sync-notifications") {
    event.waitUntil(syncNotifications());
  } else if (event.tag === "sync-contact-form") {
    event.waitUntil(syncContactForm());
  }
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

// Simple IndexedDB helpers for offline queue
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
  event.waitUntil(
    (async () => {
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
    })()
  );
});

self.addEventListener("backgroundfetchfail", (event) => {
  self.clients.matchAll({ type: "window" }).then((clients) => {
    clients.forEach((c) => c.postMessage({ type: "BG_FETCH_FAIL", id: event.registration.id }));
  });
});

self.addEventListener("backgroundfetchclick", (event) => {
  event.waitUntil(self.clients.openWindow("/dashboard"));
});

// ─── Message (skip waiting + custom commands) ──────────
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
  if (event.tag === "refresh-notifications") {
    event.waitUntil(syncNotifications());
  }
});
