importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// আপনার src/firebase.js ফাইলের আসল firebaseConfig এখানে বসান
firebase.initializeApp({
   apiKey: "আপনার_API_KEY_বসান",
  authDomain: "rokto-bondhu-aa008.firebaseapp.com",
  databaseURL: "https://rokto-bondhu-aa008-default-rtdb.firebaseio.com",
  projectId: "rokto-bondhu-aa008",
  storageBucket: "rokto-bondhu-aa008.firebasestorage.app",
  messagingSenderId: "আপনার_SENDER_ID_বসান",
  appId: "আপনার_APP_ID_বসান"
});

const messaging = firebase.messaging();

// অ্যাপ পুরোপুরি বন্ধ (Closed/Killed) অবস্থায় ব্যাকগ্রাউন্ড পুশ ও অ্যালার্ম দেখানো
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || '🚨 RedPulse Emergency Alert!';
  const body = payload.notification?.body || payload.data?.body || 'জরুরি রক্তের প্রয়োজন!';
  const isAlarm = payload.data?.isAlarm === 'true';

  self.registration.showNotification(title, {
    body,
    icon: 'https://cdn-icons-png.flaticon.com/512/1060/1060648.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/1060/1060648.png',
    vibrate: isAlarm ? [600, 200, 600, 200, 600, 200, 1000] : [300, 150, 300],
    requireInteraction: true,
    silent: false,
    tag: isAlarm ? 'redpulse-alarm' : 'redpulse-notif',
    data: { url: '/' }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});