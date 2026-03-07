const CACHE_NAME = "kinfleet-cache-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});