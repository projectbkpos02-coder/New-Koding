// Simple Service Worker
// This file enables offline support and caching for the application

const CACHE_NAME = 'new-koding-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // It's OK if some resources fail to cache during install
        console.log('Some resources failed to cache');
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Only cache GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Don't cache API calls
  if (request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            try {
              cache.put(request, responseToCache).catch(() => {
                // Silently fail if caching fails
              });
            } catch (e) {
              // Silently fail if request method not allowed for caching
            }
          });
          return response;
        })
        .catch(() => {
          // Return cached response if available, otherwise fail silently
          return caches.match(request);
        });
    })
  );
});
