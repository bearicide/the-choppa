const CHOPPA_CACHE = 'the-choppa-standalone-v24-safe';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/choppa-icon.svg',
  './assets/the-choppa-bg.png',
  './assets/the-choppa-hero.png',
  './assets/the-choppa-shortcuts.png',
  './assets/mattbear-amen-to-that-demo.mp3',
  './fx-v21.js',
  './align-v22.js'
];

function tag(src) {
  return '<scr' + 'ipt src="' + src + '"></scr' + 'ipt>';
}

async function patchHtml(response) {
  const html = await response.text();
  let out = html;
  if (!out.includes('fx-v21.js')) out = out.replace('</body>', tag('./fx-v21.js?v=21') + '\n</body>');
  if (!out.includes('align-v22.js')) out = out.replace('</body>', tag('./align-v22.js?v=22') + '\n</body>');
  return new Response(out, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

function shouldPatch(request) {
  const url = new URL(request.url);
  return request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
}

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
  if (shouldPatch(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          if (response.ok) caches.open(CHOPPA_CACHE).then(cache => cache.put(event.request, copy));
          return patchHtml(response);
        })
        .catch(() => caches.match(event.request).then(cached => cached ? patchHtml(cached) : cached))
    );
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        const url = new URL(event.request.url);
        if (url.origin === location.origin && response.ok) caches.open(CHOPPA_CACHE).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
