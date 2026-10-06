// ═══════════════════════════════════════════════════════════════
// 🦀 NextMoon AI · Service Worker v9 · Auto-protección
// ═══════════════════════════════════════════════════════════════

const CACHE_VERSION = 'v11';
const CACHE_STATIC = 'nextmoon-static-' + CACHE_VERSION;
const CACHE_DYNAMIC = 'nextmoon-dynamic-' + CACHE_VERSION;

const SCOPE_LOCAL = self.location.pathname.replace(/\/sw\.js$/, '/');
const SCOPE_RAIZ = self.location.origin + '/';

console.log('[SW] Scope local:', SCOPE_LOCAL);

const PRECACHE_URLS = [
  './', './index.html', './manifest.json',
  './pkg/academia_wasm.js', './pkg/academia_wasm_bg.wasm',
  './funciones_tecnico.js', './metricas_avanzadas.js',
  './trading_system.js', './icon-192.png', './icon-512.png',
];

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

self.addEventListener('activate', event => {
  console.log('[SW] Activando', CACHE_VERSION);
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(
          keys.filter(k => k !== CACHE_STATIC && k !== CACHE_DYNAMIC)
              .map(k => { console.log('[SW] Eliminando caché vieja:', k); return caches.delete(k); })
        );
      } catch(e) { console.warn('[SW] Error limpiando cachés:', e); }

      try {
        if ('serviceWorker' in navigator && self.registration) {
          const regs = await navigator.serviceWorker.getRegistrations();
          const scopeActual = self.registration.scope;
          console.log('[SW] Mi scope:', scopeActual, '· SWs:', regs.length);
          for (let reg of regs) {
            if (reg.scope === SCOPE_RAIZ && reg.scope !== scopeActual) {
              console.log('[SW] 🛡️ Auto-eliminando SW padre:', reg.scope);
              try { await reg.unregister(); console.log('[SW] ✅ Padre eliminado'); }
              catch(e) { console.warn('[SW] Error:', e); }
            }
          }
        }
      } catch(e) { console.warn('[SW] Error auto-protección:', e); }

      try { await self.clients.claim(); console.log('[SW] ✅ Control tomado'); }
      catch(e) { console.warn('[SW] Error claim:', e); }

      try {
        const clients = await self.clients.matchAll();
        clients.forEach(c => c.postMessage({ type: 'SW_ACTIVATED', version: CACHE_VERSION }));
      } catch(e) {}
    })()
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(event.request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
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
  console.log('[SW] Mensaje:', event.data);
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'CHECK_UPDATE') self.registration.update();
  if (event.data === 'CLEAR_CACHE') caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  if (event.data === 'UNREGISTER_PARENT') (async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    const scopeActual = self.registration.scope;
    for (let reg of regs) {
      if (reg.scope === SCOPE_RAIZ && reg.scope !== scopeActual) await reg.unregister();
    }
  })();
});
