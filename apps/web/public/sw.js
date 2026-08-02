/*
 * Service Worker de EcoMarket.
 * Estrategia deliberadamente conservadora para una app de comercio:
 *  - Nunca se cachean respuestas de la API (/api/*): los datos de precios,
 *    stock, pedidos y pagos deben ser siempre frescos y verificados en servidor.
 *  - App shell y estáticos: "stale-while-revalidate" para carga rápida offline.
 *  - Navegaciones: network-first con fallback a la última página cacheada.
 */
const VERSION = 'ecomarket-v1';
const APP_SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Nunca cachear la API ni orígenes cruzados (Stripe, gateway, etc.).
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return; // deja pasar la petición a la red normalmente
  }

  // Navegaciones (documentos HTML): network-first.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((c) => c || caches.match('/')))
    );
    return;
  }

  // Estáticos: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
