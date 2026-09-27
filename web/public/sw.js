/* Petai service worker — minimal PWA shell.
 * App shell: cache-first. API calls: network-first.
 */
const SHELL_CACHE = "petai-shell-v1";
const SHELL = ["/", "/manifest.webmanifest", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function putInCache(request, response) {
  const copy = response.clone();
  caches
    .open(SHELL_CACHE)
    .then((cache) => cache.put(request, copy))
    .catch(() => {});
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Backend API traffic: network-first, fall back to cache.
  if (url.pathname.startsWith("/api/v1") || url.port === "8000") {
    event.respondWith(
      fetch(request)
        .then((res) => putInCache(request, res))
        .catch(() => caches.match(request)),
    );
    return;
  }

  // Same-origin navigations and assets: cache-first, fall back to network.
  if (request.mode === "navigate" || url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request)
            .then((res) => putInCache(request, res))
            .catch(() => caches.match("/")),
      ),
    );
  }
});
