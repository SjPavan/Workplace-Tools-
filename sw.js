// Service Worker for Workplace Tools PWA
const CACHE_NAME = 'workplace-tools-v1-1762145169528';
const RUNTIME_CACHE = 'workplace-tools-runtime-v1-1762145169528';

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.html',
  '/tools/case-converter.html',
  '/tools/clipboard-helper.html',
  '/tools/title-converter.html',
  '/tools/virtual-browser.html'
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: Static files cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache static files', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Old caches cleaned up');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests (different origin)
  if (url.origin !== location.origin) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', request.url);
          return cachedResponse;
        }
        
        // Otherwise, fetch from network
        return fetch(request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response since it can only be consumed once
            const responseToCache = response.clone();
            
            // Cache the fetched resource for future use
            caches.open(RUNTIME_CACHE)
              .then(cache => {
                console.log('Service Worker: Caching new resource', request.url);
                cache.put(request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.error('Service Worker: Network request failed', error);
            
            // For HTML requests, try to serve the offline page
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // For other requests, just return the error
            throw error;
          });
      })
  );
});

// Handle background sync for future offline functionality
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(
      // Placeholder for future sync functionality
      Promise.resolve()
    );
  }
});

// Handle push notifications for future functionality
self.addEventListener('push', event => {
  console.log('Service Worker: Push message received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from Workplace Tools',
    icon: '/manifest.json',
    badge: '/manifest.json',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/manifest.json'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/manifest.json'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Workplace Tools', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Cache cleanup on message from client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_UPDATED') {
    console.log('Service Worker: Cache update requested');
    // Force cache refresh on next page load
    caches.delete(RUNTIME_CACHE);
  }
});