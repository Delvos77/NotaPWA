const CACHE_NAME = 'nota-app-v1';

// Daftar semua file yang perlu di-cache agar aplikasi berjalan offline.
// Pastikan semua file lokal yang diakses oleh index.html tercantum di sini.
const urlsToCache = [
  './', // index.html
  './index.html',
  './manifest.json', // File manifest untuk metadata PWA
  
  // Dependencies Eksternal (jika di-cache, meskipun ini opsional dan disarankan menggunakan strategi jaringan)
  // Untuk kesederhanaan, kita akan anggap ini sebagai resource yang sering berubah/penting.
  // Catatan: Caching sumber eksternal seperti CDN seringkali lebih kompleks
  // namun kita masukkan ke dalam daftar cache agar aplikasi bisa bekerja offline.
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap'
];

// --- 1. INSTALL EVENT ---
// Event ini dipicu saat Service Worker pertama kali diinstal
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install Event - Caching App Shell');
  // Memastikan Service Worker tidak akan aktif sampai semua file penting ter-cache
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Menambahkan semua file penting ke cache
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Service Worker akan segera mengambil alih kendali setelah instalasi
        return self.skipWaiting();
      })
  );
});

// --- 2. ACTIVATE EVENT ---
// Event ini dipicu setelah instalasi dan digunakan untuk membersihkan cache lama
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate Event - Clearing old caches');
  
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Hapus cache yang tidak ada dalam daftar putih (whitelist)
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        // Mengklaim semua klien (tab) yang ada untuk memastikan Service Worker mengambil alih
        return self.clients.claim();
    })
  );
});

// --- 3. FETCH EVENT ---
// Event ini dipicu setiap kali browser membuat permintaan jaringan
self.addEventListener('fetch', (event) => {
  // Hanya tangani permintaan GET (biasanya untuk mengambil aset)
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    // Mencari di cache terlebih dahulu
    caches.match(event.request









