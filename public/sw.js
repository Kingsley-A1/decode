const CACHE_NAME = "decode-v3";
const OFFLINE_URL = "/";

const ASSETS_TO_CACHE = [
  "/",
  "/generate",
  "/scan",
  "/verify",
  "/decode",
  "/dashboard",
  "/privacy",
  "/terms",
  "/logo.svg",
  "/icon-512.jpg",
  "/icon-192.svg",
  "/icon-512.svg",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.open(CACHE_NAME).then((cache) => {
          return cache.match(OFFLINE_URL);
        });
      })
    );
    return;
  }

  if (!shouldCacheRequest(event.request)) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).then((fetchResponse) => {
          if (fetchResponse.ok) {
            const responseClone = fetchResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return fetchResponse;
        })
      );
    })
  );
});

function shouldCacheRequest(request) {
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/")) return false;
  if (url.pathname.startsWith("/admin")) return false;

  if (url.pathname.startsWith("/_next/")) {
    return ["font", "image", "script", "style"].includes(request.destination);
  }

  return (
    ASSETS_TO_CACHE.includes(url.pathname) ||
    ["font", "image", "script", "style"].includes(request.destination)
  );
}
