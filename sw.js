const CACHE_NAME = 'mindease-shell-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/logo-1.png',
  '/favicon.ico'
];

// install
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// activate
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// fetch 
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).catch(() => caches.match('/'));
    })
  );
});
