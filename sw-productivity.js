const CACHE_NAME = 'productivity-dashboard-v1';
const OFFLINE_URLS = [
  '/web-productivity-dashboard.html',
  '/data/productivity-data.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
            return networkResponse;
          }
          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
          return networkResponse;
        })
        .catch(() => {
          if (request.destination === 'document') {
            return caches.match('/web-productivity-dashboard.html');
          }
          if (request.destination === 'script' || request.destination === 'style' || request.destination === 'json') {
            return caches.match(request).then(resp => resp || new Response('{}', { headers: { 'Content-Type': 'application/json' } }));
          }
          return caches.match(request);
        });
    })
  );
});
