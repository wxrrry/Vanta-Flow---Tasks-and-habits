/* Vanta Flow — минимальный SW для установки PWA и обновления без жёсткого кэша бандла */
const VERSION = 'vanta-flow-1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  // Всегда сеть для страницы и скриптов — чтобы обновления доходили сразу
  if (request.mode === 'navigate' || request.url.includes('bundle.js')) {
    event.respondWith(fetch(request));
    return;
  }
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
