const CACHE_NAME = "sanskrit-library-v3";
const ASSETS_TO_CACHE = [
  "index.html",
  "styles.css",
  "app.js",
  "database.js",
  "manifest.json",
  "assets/hero_temple_library.jpg",
  "assets/cover_gita.jpg"
];

// Install Service Worker and cache essential shell resources
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("[Service Worker] Caching App Shell and Assets");
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker and clean up old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheKeys => {
      return Promise.all(
        cacheKeys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Fetch events: Cache falling back to network strategy
self.addEventListener("fetch", event => {
  // Only handle GET requests and local scope
  if (event.request.method !== "GET") return;

  // Bypass service worker cache for audio files to avoid Range request issues
  if (event.request.url.includes("/assets/audio/") || event.request.url.includes("/assets/raw_audio/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Serve from cache
          return cachedResponse;
        }

        // Fallback to network fetch
        return fetch(event.request)
          .then(networkResponse => {
            // Check if response is valid
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
              return networkResponse;
            }

            // Clone and cache the new resource dynamically
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch(() => {
            // Return offline fallback if network fails
            if (event.request.headers.get("accept").includes("text/html")) {
              return caches.match("index.html");
            }
          });
      })
  );
});
