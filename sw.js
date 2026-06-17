const CHOPPA_CACHE = 'the-choppa-static-v13';
const DEMO_AUDIO = './assets/mattbear-amen-to-that-demo.mp3';
const LEGACY_DEMO_AUDIO = './assets/audio/mattbear-amen-to-that-demo.mp3';
const PAD_LOOP_HELPER = './choppa-pad-loop-default.js';
const FORCE_ORANGE_STYLE = `
<style id="choppa-force-orange">
html,body{background:#ff5a00!important;}
body{background:#ff5a00!important;}
body::before{background:#ff5a00!important;background-image:none!important;filter:none!important;opacity:1!important;mix-blend-mode:normal!important;}
body::after{background:radial-gradient(circle at 18% 12%,rgba(255,220,120,.28),transparent 30%),linear-gradient(180deg,rgba(255,106,0,.55),rgba(204,58,0,.68))!important;filter:none!important;mix-blend-mode:normal!important;opacity:.9!important;}
.app,main,.wrap{background:transparent!important;}
.card,.panel,.top,.nav,.xyPanel{background-color:rgba(5,6,9,.78)!important;}
</style>`;

const STATIC_ASSETS = [
  './manifest.webmanifest',
  './icons/choppa-icon.svg',
  './assets/the-choppa-bg.png',
  './assets/the-choppa-hero.png',
  DEMO_AUDIO,
  PAD_LOOP_HELPER
];

function withPadLoopHelper(html) {
  let output = html;
  if (!output.includes('choppa-force-orange')) {
    output = output.includes('</head>') ? output.replace('</head>', FORCE_ORANGE_STYLE + '\n</head>') : FORCE_ORANGE_STYLE + output;
  }
  if (!output.includes(PAD_LOOP_HELPER)) {
    const tag = '<script src="' + PAD_LOOP_HELPER + '"></script>';
    output = output.includes('</body>') ? output.replace('</body>', tag + '\n</body>') : output + tag;
  }
  return output;
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CHOPPA_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS).catch(() => cache.addAll(STATIC_ASSETS.filter(url => !url.endsWith('.mp3')))))
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
  const legacyDemoPath = new URL(LEGACY_DEMO_AUDIO, self.location).pathname;
  const normalizedRequest = url.pathname === legacyDemoPath
    ? new Request(new URL(DEMO_AUDIO, self.location), event.request)
    : event.request;
  const normalizedUrl = new URL(normalizedRequest.url);

  const isSameOrigin = normalizedUrl.origin === self.location.origin;
  const isDocument = event.request.mode === 'navigate' || event.request.destination === 'document' || normalizedUrl.pathname.endsWith('/index.html');

  if (isDocument) {
    event.respondWith(
      fetch(normalizedRequest, { cache: 'no-store' })
        .then(response => response.text().then(html => new Response(withPadLoopHelper(html), {
          status: response.status,
          statusText: response.statusText,
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
        })))
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  if (!isSameOrigin) {
    event.respondWith(fetch(normalizedRequest));
    return;
  }

  event.respondWith(
    caches.match(normalizedRequest).then(cached => {
      const network = fetch(normalizedRequest).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CHOPPA_CACHE).then(cache => cache.put(normalizedRequest, copy));
        }
        return response;
      });
      return cached || network.catch(() => cached || caches.match(DEMO_AUDIO));
    })
  );
});
