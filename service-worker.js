// The Choppa is intentionally NOT running as a PWA yet.
// This file only clears old caches/service-worker residue from prior tests.
// No offline shell. No install behavior. No cached app mode. Because apparently restraint is now a feature.

const CACHE_PREFIX = "the-choppa";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.includes(CACHE_PREFIX) || key.includes("choppa"))
        .map((key) => caches.delete(key))
    );

    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clients) {
      client.postMessage({ type: "CHOPPA_NO_PWA_CACHE_CLEARED" });
    }

    await self.registration.unregister();
  })());
});

self.addEventListener("fetch", () => {
  // Pass-through only. Browser handles network normally.
  return;
});
