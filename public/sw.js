// Service Worker za push notifikacije
const CACHE_NAME = 'vrticko-cache-v3';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event (opciono - možeš obrisati ako ne koristiš cache)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
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
    self.clients.claim().then(() => {
      console.log('Service Worker ready for push notifications');
    })
  );
});
