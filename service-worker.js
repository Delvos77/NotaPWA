const CACHE_NAME = 'nota-app-v3';

// 1. File lokal utama yang wajib di-cache (termasuk ikon SVG kamu)
const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './Logo192.png',
  './Logo512.png'
];

// 2. Resource eksternal (CDN)
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap'
];

// --- 1. INSTALL EVENT ---
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing SW & caching assets...');

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Simpan aset lokal terlebih dahulu
      await cache.addAll(LOCAL_ASSETS);

      // Simpan aset CDN satu per satu secara aman
      await Promise.allSettled(
        EXTERNAL_ASSETS.map((url) =>
          fetch(url, { mode: 'no-cors' })
            .then((response) => cache.put(url, response))
            .catch((err) => console.warn(`[Service Worker] Gagal cache CDN: ${url}`, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// --- 2. ACTIVATE EVENT ---
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating SW & clearing old caches...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// --- 3. FETCH EVENT ---
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });
    })
  );
});
