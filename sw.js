// Minimal Service Worker to enable PWA Installation
// No offline caching as per user request (Runs Live)

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Network-only strategy: Always fetch from live site
    event.respondWith(fetch(event.request));
});
