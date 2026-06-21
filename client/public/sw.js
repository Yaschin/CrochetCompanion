/*
 * Crochet Time service worker — offline-first for the app shell, saved patterns,
 * and their images, so the library and row counter work with no signal.
 * Hand-rolled (no build step) and resilient to Vite's hashed asset filenames:
 * static assets are cached at runtime as they're requested.
 */
const CACHE = "crochet-time-v1";
const APP_SHELL = ["/", "/index.html", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
      return response;
    })
    .catch(() => caches.match(request));
}

function cacheFirst(request) {
  return caches.match(request).then(
    (cached) =>
      cached ||
      fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
      }),
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // never cache mutations
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // skip fonts / OpenAI / cross-origin

  // App navigations: network first, fall back to cached shell when offline.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/index.html")));
    return;
  }

  // Saved patterns: network first so edits show, cache fallback for offline.
  if (url.pathname === "/api/patterns" || url.pathname.startsWith("/api/patterns/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Pattern images: cache first (they're immutable object-storage keys).
  if (url.pathname.startsWith("/api/media/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Hashed build assets: cache first.
  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/characters/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else: try cache, then network.
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});

// ── Push reminders ───────────────────────────────────────────────────────────
// Show the notification the server pushed (daily nudge / inactive project).
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { /* non-JSON payload */ }
  const title = data.title || "Crochet Time";
  const options = {
    body: data.body || "Time for a few cozy rows ♡",
    icon: "/characters/char-bee-transparent.png",
    badge: "/characters/char-bee-transparent.png",
    tag: data.tag || "crochet-time",
    data: { url: data.url || "/home" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Focus an existing tab (or open one) at the reminder's target on tap.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/home";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ("focus" in w) {
          if ("navigate" in w) { try { w.navigate(target); } catch { /* ignore */ } }
          return w.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
