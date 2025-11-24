// Nama cache unik untuk versi aplikasi ini
const CACHE_NAME = 'nota-v1'; 

// Daftar file yang merupakan bagian dari "app shell" (yang perlu di-cache)
const urlsToCache = [
  './', 
  './index.html',
  'https://cdn.tailwindcss.com', // Tailwind CSS CDN
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', // html2canvas
  // Jika Anda menambahkan file icon, pastikan jalur ini sesuai
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// --- FUNGSI INSTALLATION (Instalasi Service Worker) ---
self.addEventListener('install', function(event) {
  // Tunggu hingga cache berhasil dibuka dan semua file di-cache
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[Service Worker] Membuka cache dan meng-cache semua asset');
        return cache.addAll(urlsToCache);
      })
  );
});

// --- FUNGSI ACTIVATION (Pembersihan Cache Lama) ---
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          // Hapus semua cache yang namanya tidak sesuai dengan CACHE_NAME saat ini
          return cacheName !== CACHE_NAME;
        }).map(function(cacheName) {
          console.log('[Service Worker] Menghapus cache lama:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
  // Klaim klien yang ada agar Service Worker dapat langsung mengontrol halaman
  return self.clients.claim();
});

// --- FUNGSI FETCH (Strategi Cache-First) ---
self.addEventListener('fetch', function(event) {
  // Hanya tangani permintaan HTTP/HTTPS
  if (event.request.url.startsWith('http')) {
    event.respondWith(
      // Coba cari di cache
      caches.match(event.request)
        .then(function(response) {
          // Jika ditemukan di cache, kembalikan dari cache
          if (response) {
            return response;
          }

          // Jika tidak ditemukan di cache, ambil dari jaringan
          return fetch(event.request).then(
            function(response) {
              // Cek apakah kami menerima respons yang valid
              if(!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Kloning respons karena stream respons hanya dapat dikonsumsi sekali
              var responseToCache = response.clone();

              // Tambahkan ke cache untuk penggunaan berikutnya
              caches.open(CACHE_NAME)
                .then(function(cache) {
                  cache.put(event.request, responseToCache);
                });

              return response;
            }
          );
        })
      );
  }
});


