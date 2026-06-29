// THE CHOPPA — service worker disabled
// No PWA. No cache. No runtime patch. This file only unregisters old service-worker residue.

async function clearChoppaCaches() {
  if (!self.caches) return;
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => /choppa|the-choppa/i.test(key)).map(key => caches.delete(key)));
}

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await clearChoppaCaches();
    await self.registration.unregister();
    await self.clients.claim();
  })());
});

// Intentionally no fetch handler.
