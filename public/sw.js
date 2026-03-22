// sw.js v1.8
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing Service Worker v1.8 ...');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating Service Worker v1.8 ...');
  return self.clients.claim();
});

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received v1.8');
  
  let data = {};
  try {
    if (event.data) {
      // Try to parse as JSON first
      try {
        data = event.data.json();
      } catch (jsonErr) {
        // If not JSON, use as plain text
        console.warn('[Service Worker] Push data is not JSON, using as text');
        data = {
          title: '체키 알림',
          body: event.data.text()
        };
      }
    } else {
      console.warn('[Service Worker] Push event but no data');
      data = {
        title: '체키 알림',
        body: '새로운 소식이 있습니다.'
      };
    }
  } catch (e) {
    console.error('[Service Worker] Error processing push data:', e);
    data = {
      title: '체키 알림',
      body: '알림이 도착했습니다.'
    };
  }

  const title = data.title || '체키 알림';
  const options = {
    body: data.body || '내용이 없습니다.',
    icon: data.icon || '/icon.svg',
    badge: data.badge || '/badge.svg',
    color: '#F97316', // Notification accent color (orange)
    // Unique vibration pattern: Short-Short-Short-Long (Rapid fire then alert)
    vibrate: [100, 50, 100, 50, 100, 50, 500],
    tag: data.tag || 'attendance-notification', // Use a tag to replace old notifications
    renotify: true, // Vibrate even if the tag is the same
    requireInteraction: true, // Keep notification until user interacts
    silent: false, // Ensure it's not silent
    timestamp: Date.now(),
    data: {
      url: (data.data && data.data.url) ? data.data.url : (data.url || '/')
    },
    actions: [
      {
        action: 'open',
        title: '확인하기'
      }
    ]
  };

  // Use event.waitUntil to keep the service worker alive until the notification is shown
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('[Service Worker] Notification shown successfully'))
      .catch(err => {
        console.error('[Service Worker] Error showing notification with options:', err);
        // Fallback: try showing notification without icon/badge if that was the issue
        const fallbackOptions = { ...options };
        delete fallbackOptions.icon;
        delete fallbackOptions.badge;
        return self.registration.showNotification(title, fallbackOptions);
      })
      .catch(err => console.error('[Service Worker] Fatal error showing notification:', err))
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();

  const urlToOpen = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(windowClients) {
        // Check if there is already a window open for this app
        for (let i = 0; i < windowClients.length; i++) {
          let client = windowClients[i];
          const clientUrl = new URL(client.url);
          if (clientUrl.origin === self.location.origin && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
