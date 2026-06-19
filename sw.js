// THE CHOPPA — temporary dev loader only.
// PWA/offline caching is intentionally disabled until the app is stable.

function tag(src) {
  return '<scr' + 'ipt src="' + src + '"></scr' + 'ipt>';
}

async function patchHtml(response) {
  const html = await response.text();
  let out = html;
  if (!out.includes('fx-v21.js')) out = out.replace('</body>', tag('./fx-v21.js?v=21') + '\n</body>');
  if (!out.includes('align-v22.js')) out = out.replace('</body>', tag('./align-v22.js?v=22') + '\n</body>');
  if (!out.includes('midi-readout-v24.js')) out = out.replace('</body>', tag('./midi-readout-v24.js?v=24') + '\n</body>');
  if (!out.includes('midi-capture-v26.js')) out = out.replace('</body>', tag('./midi-capture-v26.js?v=26') + '\n</body>');
  return new Response(out, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

function shouldPatch(request) {
  const url = new URL(request.url);
  return url.pathname.endsWith('/the-choppa/') || url.pathname.endsWith('/the-choppa/index.html');
}

async function clearOldCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key.startsWith('the-choppa-')).map(key => caches.delete(key)));
}

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(clearOldCaches().then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  if (shouldPatch(event.request)) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => patchHtml(response))
        .catch(() => new Response('The Choppa failed to load from network. Offline/PWA cache is disabled during development.', {
          status: 503,
          headers: { 'content-type': 'text/plain; charset=utf-8' }
        }))
    );
    return;
  }

  event.respondWith(fetch(event.request, { cache: 'no-store' }));
});
