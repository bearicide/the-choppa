const CHOPPA_CACHE = 'the-choppa-standalone-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/choppa-icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CHOPPA_CACHE)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CHOPPA_CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        const copy = response.clone();
        const url = new URL(event.request.url);
        if (url.origin === location.origin) {
          caches.open(CHOPPA_CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
