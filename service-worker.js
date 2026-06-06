const CACHE_NAME = "the-choppa-pwa-v6-lite-lights";
const APP_FILES = [
  "./",
  "./index.html",
  "./app.js",
  "./lite.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

function shouldInjectLite(request){
  const url = new URL(request.url);
  return request.mode === "navigate" || url.pathname.endsWith("/the-choppa/") || url.pathname.endsWith("/the-choppa/index.html");
}

async function withLiteScript(response){
  const type = response.headers.get("content-type") || "";
  if(!type.includes("text/html")) return response;
  let html = await response.text();
  if(!html.includes('src="lite.js"') && !html.includes("src='lite.js'")){
    html = html.replace('<script src="app.js"></script>', '<script src="app.js"></script>\n<script src="lite.js"></script>');
  }
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: {"content-type":"text/html; charset=utf-8", "cache-control":"no-cache"}
  });
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    let response = cached;
    if(!response){
      try{
        response = await fetch(event.request);
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
      }catch(e){
        response = await caches.match("./index.html");
      }
    }
    if(response && shouldInjectLite(event.request)) return withLiteScript(response.clone());
    return response;
  })());
});