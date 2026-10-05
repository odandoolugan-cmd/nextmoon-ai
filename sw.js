// ═══════════════════════════════════════════════════════════════
// 🦀 NextMoon AI · Service Worker v6.2 · PWA
// ═══════════════════════════════════════════════════════════════

const CACHE_STATIC = 'nextmoon-static-v6';
const CACHE_DYNAMIC = 'nextmoon-dynamic-v6';
const CACHE_VERSION = 'v6.2';

// Recursos precacheados
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './pkg/academia_wasm.js',
  './pkg/academia_wasm_bg.wasm',
  './funciones_tecnico.js',
  './metricas_avanzadas.js',
  './icon-192.png',
  './icon-512.png',
];

// ═══ INSTALL ═══
self.addEventListener('install', event => {
  console.log('[SW] Instalando', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => {
        console.log('[SW] Precaching', PRECACHE_URLS.length, 'recursos');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] ✅ Instalado');
        return self.skipWaiting();
      })
      .catch(err => console.warn('[SW] ⚠️ Error precache:', err))
  );
});

// ═══ ACTIVATE ═══
self.addEventListener('activate', event => {
  console.log('[SW] Activando', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_STATIC && k !== CACHE_DYNAMIC)
            .map(k => {
              console.log('[SW] Eliminando caché vieja:', k);
              return caches.delete(k);
            })
      );
    }).then(() => self.clients.claim())
  );
});

// ═══ FETCH ═══
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Solo GET
  if (event.request.method !== 'GET') return;

  // APIs externas → network-only (con fallback JSON vacío)
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .catch(() => new Response('{}', {
          headers: { 'Content-Type': 'application/json' }
        }))
    );
    return;
  }

  // Local → cache-first con actualización en background
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        // Actualizar caché dinámica con respuestas nuevas
        if (response && response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_DYNAMIC).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

// ═══ MESSAGE ═══
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'CLEAR_CACHE') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  }
});
