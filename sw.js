// THE CHOPPA — SERVICE WORKER DISABLED
// Function first. No PWA. No dev injection. No fetch interception.
// This worker unregisters itself and clears old Choppa caches.

async function clearOldCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key.startsWith('the-choppa-')).map(key => caches.delete(key)));
}

async function shutDown() {
  await clearOldCaches();
  await self.registration.unregister();
  const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clientsList) {
    client.postMessage({ type: 'CHOPPA_SW_DISABLED' });
  }
}

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(shutDown().then(() => self.clients.claim()));
});

// Intentionally no fetch handler.
