const CHOPPA_CACHE = 'the-choppa-standalone-v6';
const DEMO_AUDIO = './assets/mattbear-amen-to-that-demo.mp3';
const LEGACY_DEMO_AUDIO = './assets/audio/mattbear-amen-to-that-demo.mp3';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/choppa-icon.svg',
  './assets/the-choppa-bg.png',
  './assets/the-choppa-hero.png',
  DEMO_AUDIO
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CHOPPA_CACHE)
      .then(cache => cache.addAll(CORE).catch(() => cache.addAll(CORE.filter(url => !url.endsWith('.mp3')))))
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
  const url = new URL(event.request.url);
  const demoPath = new URL(DEMO_AUDIO, self.location).pathname;
  const legacyDemoPath = new URL(LEGACY_DEMO_AUDIO, self.location).pathname;
  const request = url.pathname === legacyDemoPath ? new Request(new URL(DEMO_AUDIO, self.location), event.request) : event.request;

  event.respondWith(
    fetch(request)
      .then(response => {
        const copy = response.clone();
        const requestUrl = new URL(request.url);
        if (requestUrl.origin === location.origin && response.ok) {
          caches.open(CHOPPA_CACHE).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match(DEMO_AUDIO)))
  );
});
