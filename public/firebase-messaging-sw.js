importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// তোমার src/firebase.js ফাইল থেকে firebaseConfig-এর মানগুলো এখানে বসাও
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

// অ্যাপ বন্ধ (Closed/Background) থাকা অবস্থায় পুশ নোটিফিকেশন রিসিভ
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const isAlarm = data.isAlarm === 'true';
  const title = payload.notification?.title || data.title || (isAlarm ? '🚨 EMERGENCY BLOOD ALARM!' : '🩸 RedPulse Alert');
  const body = payload.notification?.body || data.body || 'জরুরি বার্তা দেখতে ট্যাপ করুন';

  const options = {
    body: body,
    icon: 'https://cdn-icons-png.flaticon.com/512/1060/1060648.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/1060/1060648.png',
    vibrate: isAlarm ? [800, 200, 800, 200, 800, 200, 1000] : [250, 100, 250],
    tag: isAlarm ? 'redpulse-emergency-alarm' : `redpulse-msg-${Date.now()}`,
    renotify: true,
    requireInteraction: isAlarm,
    data: data
  };

  return self.registration.showNotification(title, options);
});

// নোটিফিকেশনে ক্লিক করলে বন্ধ থাকা অ্যাপ ওপেন হয়ে অ্যালার্ম বা চ্যাটে যাবে
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const isAlarm = data.isAlarm === 'true';

  let targetUrl = '/';
  if (isAlarm) {
    targetUrl = `/?alarm=1&msg=${encodeURIComponent(event.notification.body || 'জরুরি রক্তের অ্যালার্ম!')}`;
  } else if (data.type === 'chat' && data.senderId) {
    targetUrl = `/?chatWith=${encodeURIComponent(data.senderId)}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: isAlarm ? 'OPEN_ALARM' : 'OPEN_CHAT',
            body: event.notification.body,
            senderId: data.senderId
          });
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});