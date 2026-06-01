const STATIC_CACHE = "sinclear-static-v1";
const DYNAMIC_CACHE = "sinclear-dynamic-v1";

const STATIC_ASSETS = [
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const staticCache = await caches.open(STATIC_CACHE);
      await staticCache.addAll(STATIC_ASSETS);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
          return Promise.resolve();
        }),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Für alle anderen Requests (RSC Payloads, Bilder, Fonts etc.) kein
  // SW-Response – Browser holt direkt vom Netzwerk, kein Caching
  return;
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    if (request.mode === "navigate") {
      return caches.match("/manifest.json");
    }
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    if (request.mode === "navigate") {
      return new Response(
        `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#e4e4e7;text-align:center;padding:2rem}div{max-width:24rem}h1{font-size:1.5rem;margin-bottom:.5rem}p{color:#a1a1aa;line-height:1.5}</style></head>
<body><div><h1>Du bist offline</h1><p>Sinclear Beyond ben\u00f6tigt eine Internetverbindung. Bitte \u00fcberpr\u00fcf deine Verbindung und versuche es erneut.</p></div></body>
</html>`,
        {
          status: 503,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        },
      );
    }

    return new Response("Offline", { status: 503 });
  }
}

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || "",
      icon: data.icon || "/icon-192x192.png",
      badge: data.badge || "/icon-192x192.png",
      tag: data.tag || "default",
      data: {
        url: data.url || "/home",
      },
      vibrate: [200, 100, 200],
      requireInteraction: true,
      actions: data.actions || [],
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || "Sinclear Beyond",
        options,
      ),
    );
  } catch {
    const title = event.data.text();
    event.waitUntil(
      self.registration.showNotification(title, {
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
      }),
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/home";

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            client.navigate(urlToOpen);
          }
          return;
        }
      }

      if (clients.openWindow) {
        await clients.openWindow(urlToOpen);
      }
    })(),
  );
});
