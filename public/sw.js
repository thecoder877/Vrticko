// Service Worker za push notifikacije
const CACHE_NAME = 'vrticko-cache-v4';

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache only essential files that we know exist
        return cache.addAll([
          '/',
          '/manifest.json',
          '/vite.svg'
        ]).catch((error) => {
          console.warn('⚠️ Some files could not be cached:', error);
          // Continue even if some files fail to cache
          return Promise.resolve();
        });
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Fetch event - handle caching for better performance
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip caching for API calls and external resources
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/functions/') ||
      !url.origin.includes(location.hostname)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        // If not in cache, fetch and optionally cache
        return fetch(event.request)
          .then((fetchResponse) => {
            // Only cache successful responses
            if (fetchResponse.status === 200) {
              const responseClone = fetchResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  // Only cache static assets, not HTML pages
                  if (event.request.destination === 'script' || 
                      event.request.destination === 'style' ||
                      event.request.destination === 'image') {
                    cache.put(event.request, responseClone);
                  }
                });
            }
            return fetchResponse;
          })
          .catch((error) => {
            console.warn('Fetch failed:', error);
            // Return a fallback response if needed
            throw error;
          });
      })
  );
});

// Push event
self.addEventListener('push', (event) => {
  console.log('📩 Push event received:', event);

  let notificationData = {
    title: 'Vrtićko',
    message: 'Nova obaveštenje',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: {}
  };

  if (event.data) {
    try {
      const data = event.data.json();
      console.log('📦 Parsed notification data:', data);

      notificationData = {
        title: data.title || 'Vrtićko',
        message: data.message || data.body || 'Nova obaveštenje',
        icon: data.icon || '/icon-192x192.png',
        badge: data.badge || '/badge-72x72.png',
        data: data.data || {},
        actions: data.actions || [
          {
            action: 'explore',
            title: 'Pogledaj',
            icon: '/icon-192x192.png'
          },
          {
            action: 'close',
            title: 'Zatvori',
            icon: '/icon-192x192.png'
          }
        ]
      };
    } catch (error) {
      console.error('❌ Error parsing push data:', error);
      notificationData.message = event.data.text();
    }
  }

  const options = {
    body: notificationData.message,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      ...notificationData.data
    },
    actions: notificationData.actions
  };

  console.log('🔔 Showing notification with options:', options);

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification click received:', event);
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/'));
  } else if (event.action === 'close') {
    event.notification.close();
  } else {
    event.waitUntil(clients.openWindow('/'));
  }
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('🚀 Service Worker ready for push notifications');
    })
  );
});
