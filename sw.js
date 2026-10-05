// ═══════════════════════════════════════════════════════════════
// 🦀 NextMoon AI · Service Worker v7 · Auto-actualización
// ═══════════════════════════════════════════════════════════════

const CACHE_VERSION = 'v7';
const CACHE_STATIC = 'nextmoon-static-' + CACHE_VERSION;
const CACHE_DYNAMIC = 'nextmoon-dynamic-' + CACHE_VERSION;

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './pkg/academia_wasm.js',
  './pkg/academia_wasm_bg.wasm',
  './funciones_tecnico.js',
  './metricas_avanzadas.js',
  './trading_system.js',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_STATIC && k !== CACHE_DYNAMIC)
        .map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(event.request).catch(() => new Response('{}', {
      headers: { 'Content-Type': 'application/json' }
    })));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_DYNAMIC).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
