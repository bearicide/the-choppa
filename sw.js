const CHOPPA_CACHE = 'the-choppa-standalone-v15';
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

const PANIC_PATCH = `
<script>
(() => {
  const isTypingTarget = el => {
    const tag = (el && el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'select' || tag === 'textarea' || (el && el.isContentEditable);
  };

  function panicStop() {
    const stop = document.getElementById('stopBtn') || document.getElementById('mobStop');
    if (stop) stop.click();

    document.querySelectorAll('.pad').forEach(pad => {
      pad.classList.remove('playing', 'looping', 'queued', 'is-on');
      if (!pad.classList.contains('is-off')) pad.classList.add('is-neutral');
    });

    const loopState = document.getElementById('loopState');
    if (loopState) {
      loopState.className = 'pill hot';
      loopState.innerHTML = 'PANIC <strong>Stopped</strong>';
    }

    const currentRead = document.getElementById('currentRead');
    if (currentRead) currentRead.textContent = 'PANIC STOP';

    const uploadStatus = document.getElementById('uploadStatus');
    if (uploadStatus) uploadStatus.textContent = 'Panic stop: everything off.';
  }

  window.addEventListener('keydown', e => {
    if (isTypingTarget(e.target)) return;
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      panicStop();
    }
  }, true);
})();
</script>`;

async function patchHtml(response) {
  const html = await response.text();
  if (html.includes('Panic stop: everything off.')) return new Response(html, response);
  return new Response(html.replace('</body>', `${PANIC_PATCH}\n</body>`), {
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
        if (url.origin === location.origin && response.ok) {
          caches.open(CHOPPA_CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
