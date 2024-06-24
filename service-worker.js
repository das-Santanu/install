// Define the cache name
const CACHE_NAME = 'my-cache-v1';

// Define URLs to cache (adjust based on your application's resources)
const urlsToCache = [
  './',
  '/index.html',
  '/style.css',
  '/script.js',
  '/service-worker.js',
];

// Define the service worker scope (adjust to match your application's base URL)
const SERVICE_WORKER_SCOPE = '/ProgressPercentageButton/'; // Adjust this to match your application's scope

// Install event listener: Caches resources on install
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache.map(url => SERVICE_WORKER_SCOPE + url));
    })
  );
});

// Fetch event listener: Serve cached content when offline, fetch and cache new content when online
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request and fetch it if not cached
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(response) {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response and cache it
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Activate event listener: Clean up old caches
self.addEventListener('activate', function(event) {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
