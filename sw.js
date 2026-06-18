const CHOPPA_CACHE = 'the-choppa-standalone-v13';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/choppa-icon.svg',
  './assets/the-choppa-bg.png',
  './assets/the-choppa-hero.png',
  './assets/the-choppa-shortcuts.png',
  './assets/mattbear-amen-to-that-demo.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CHOPPA_CACHE)
      .then(cache => Promise.allSettled(CORE.map(url => cache.add(url))))
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
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        const url = new URL(event.request.url);
        if (url.origin === location.origin && response.ok) {
          caches.open(CHOPPA_CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
