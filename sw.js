// ═══════════════════════════════════════════════════════════════
// 🦀 NextMoon AI · Service Worker v12 · HTML siempre de red
// ═══════════════════════════════════════════════════════════════

const CACHE_VERSION = 'v26';
const CACHE_STATIC = 'nextmoon-static-' + CACHE_VERSION;
const CACHE_DYNAMIC = 'nextmoon-dynamic-' + CACHE_VERSION;

const PRECACHE_URLS = [
  './manifest.json',
  './pkg/academia_wasm.js',
  './pkg/academia_wasm_bg.wasm',
  './funciones_tecnico.js',
  './metricas_avanzadas.js',
  './trading_system.js',
  './backtest.js',
  './paper_trading.js',
  './icon-192.png',
  './icon-512.png',
];

// INSTALL
self.addEventListener('install', event => {
  console.log('[SW] Instalando', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => {
        console.log('[SW] ✅ Precacheados', PRECACHE_URLS.length, 'recursos');
        return self.skipWaiting();
      })
      .catch(err => console.warn('[SW] ⚠️ Error precache:', err))
  );
});

// ACTIVATE
self.addEventListener('activate', event => {
  console.log('[SW] Activando', CACHE_VERSION);
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(
          keys.filter(k => k !== CACHE_STATIC && k !== CACHE_DYNAMIC)
              .map(k => {
                console.log('[SW] Eliminando caché vieja:', k);
                return caches.delete(k);
              })
        );
      } catch(e) { console.warn('[SW] Error limpiando cachés:', e); }

      try {
        if ('serviceWorker' in navigator && self.registration) {
          const regs = await navigator.serviceWorker.getRegistrations();
          const scopeActual = self.registration.scope;
          for (let reg of regs) {
            if (reg.scope === self.location.origin + '/' && reg.scope !== scopeActual) {
              console.log('[SW] 🛡️ Eliminando SW padre:', reg.scope);
              await reg.unregister();
            }
          }
        }
      } catch(e) { console.warn('[SW] Error auto-protección:', e); }

      try { await self.clients.claim(); console.log('[SW] ✅ Control tomado'); }
      catch(e) {}
    })()
  );
});

// FETCH · HTML siempre de red, resto network-first
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  // ⭐ HTML SIEMPRE de red (nunca caché)
  const esHTML = url.pathname === '/' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
  if (esHTML) {
    console.log('[SW] HTML → red directa:', url.pathname);
    event.respondWith(fetch(event.request));
    return;
  }

  // APIs externas → red
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request).catch(() => new Response('{}', {
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  // Resto → network-first
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_DYNAMIC).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cached => cached || caches.match('./index.html'));
      })
  );
});

// MESSAGE
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'CHECK_UPDATE') self.registration.update();
  if (event.data === 'CLEAR_CACHE') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  }
});
