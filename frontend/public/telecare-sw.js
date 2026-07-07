const STATIC_CACHE = "telecareplus-static-v19";
const OFFLINE_PAGE = "/offline.html";
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon-192.svg", "/icon-512.svg", OFFLINE_PAGE];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key !== STATIC_CACHE)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, response.clone());
        if (url.origin === self.location.origin && (url.pathname === "/" || url.pathname.endsWith("/login"))) {
          cache.put("/", response.clone());
        }
        return response;
      } catch {
        const cache = await caches.open(STATIC_CACHE);
        return (await cache.match(request)) || (await cache.match("/")) || (await cache.match(OFFLINE_PAGE));
      }
    })());
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      const networkFirstDestinations = ["script", "style", "worker"];

      if (networkFirstDestinations.includes(request.destination)) {
        try {
          const response = await fetch(request, { cache: "no-store" });
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          const cached = await cache.match(request);
          return cached || Response.error();
        }
      }

      const cached = await cache.match(request);
      if (cached) {
        return cached;
      }

      try {
        const response = await fetch(request);
        if (response.ok && ["image", "font"].includes(request.destination)) {
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        return Response.error();
      }
    })());
  }
});

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let payload = {};

    try {
      payload = event.data ? event.data.json() : {};
    } catch {
      payload = { title: "TeleCare+", body: event.data ? event.data.text() : "New alert available in TeleCare+." };
    }

    const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const hasFocusedWindow = clientList.some((client) => client.focused);

    if (hasFocusedWindow) {
      return;
    }

    await self.registration.showNotification(payload.title || "TeleCare+", {
      body: payload.body || "New alert available in TeleCare+.",
      tag: payload.tag || "telecareplus-alert",
      data: {
        url: payload.url || "/"
      }
    });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil((async () => {
    const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;
    const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

    for (const client of clientList) {
      if (client.url === targetUrl && "focus" in client) {
        await client.focus();
        return;
      }
    }

    if (self.clients.openWindow) {
      await self.clients.openWindow(targetUrl);
    }
  })());
});
