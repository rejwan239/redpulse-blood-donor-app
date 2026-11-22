importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDOPSl1IifAbenontRpUHkIkhW0RVG1T_4",
  authDomain: "rokto-bondhu-aa008.firebaseapp.com",
  databaseURL: "https://rokto-bondhu-aa008-default-rtdb.firebaseio.com",
  projectId: "rokto-bondhu-aa008",
  storageBucket: "rokto-bondhu-aa008.firebasestorage.app",
  messagingSenderId: "1010812237612",
  appId: "1:1010812237612:web:8198765fff34195dc25e89"
});

const messaging = firebase.messaging();

// অ্যাপ পুরোপুরি বন্ধ (Closed/Killed) অবস্থায় ব্যাকগ্রাউন্ড পুশ ও অ্যালার্ম দেখানো
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || '🚨 RedPulse Emergency Alert!';
  const body = payload.notification?.body || payload.data?.body || 'জরুরি রক্তের প্রয়োজন!';
  const isAlarm = payload.data?.isAlarm === 'true';

  self.registration.showNotification(title, {
    body,
    icon: 'https://cdn-icons-png.flaticon.com/512/1060/1060648.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/1060/1060648.png',
    vibrate: isAlarm ? [1000, 300, 1000, 300, 1000, 300, 1000, 300, 1000] : [300, 150, 300],
    requireInteraction: isAlarm,
    silent: false,
    renotify: true,
    tag: isAlarm ? 'redpulse-alarm' : 'redpulse-notif',
    actions: isAlarm ? [{ action: 'open_alarm', title: '🚨 অ্যালার্ম দেখুন ও বন্ধ করুন' }] : [],
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