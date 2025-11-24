// Nama cache untuk versi saat ini
const CACHE_NAME = 'nota-app-cache-v5'; 

// Daftar aset yang perlu dicache 
const urlsToCache = [
  './index.html',
  '/', // Root
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
  './manifest.json'
];

// Event: Install (Mencache semua aset)
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Menginstal...');
  // Tunggu hingga cache berhasil dibuka dan semua URL ditambahkan
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Mencache aset aplikasi.');
        // Mencoba menambahkan semua file ke cache.
        return cache.addAll(urlsToCache).catch(error => {
            console.error('[Service Worker] Gagal mencache satu atau lebih aset:', error);
        });
      })
  );
});

// Event: Activate (Menghapus cache lama saat versi baru diaktifkan)
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Mengaktifkan...');
  const cacheWhitelist = [CACHE_NAME];
  // Tunggu hingga semua cache lama dihapus
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Hanya hapus cache yang TIDAK ada dalam daftar putih
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Klaim klien segera agar Service Worker langsung bekerja
  return self.clients.claim();
});

// Event: Fetch (Strategi Cache-First: Ambil dari cache jika ada, jika tidak, ambil dari jaringan)
self.addEventListener('fetch', (event) => {
  // Hanya tangani permintaan HTTP/HTTPS
  if (event.request.url.startsWith('http')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        // Cache hit (ditemukan) - kembalikan respons dari cache
        if (response) {
          return response;
        }

        // Tidak ada di cache - ambil dari jaringan (network)
        return fetch(event.request).then((response) => {
          // Periksa apakah kami menerima respons yang valid (status 200)
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Kloning respons untuk disimpan di cache (respons adalah stream)
          const responseToCache = response.clone();

          // Simpan aset baru yang berhasil diambil dari network ke cache
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        }).catch(error => {
          console.error('[Service Worker] Gagal fetch atau cache:', event.request.url, error);
          // Mengembalikan pesan fallback jika fetch gagal dan tidak ada di cache
          return new Response('Aplikasi ini berjalan offline, tetapi aset yang diminta tidak ditemukan di cache.');
        });
      })
    );
  }

});



