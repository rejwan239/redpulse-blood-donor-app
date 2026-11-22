import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDOPSl1IifAbenontRpUHkIkhW0RVG1T_4",
  authDomain: "rokto-bondhu-aa008.firebaseapp.com",
  databaseURL: "https://rokto-bondhu-aa008-default-rtdb.firebaseio.com",
  projectId: "rokto-bondhu-aa008",
  storageBucket: "rokto-bondhu-aa008.firebasestorage.app",
  messagingSenderId: "1010812237612",
  appId: "1:1010812237612:web:8198765fff34195dc25e89"
};

// ধাপ ১ থেকে পাওয়া Web Push Certificate (VAPID Key) এখানে বসান
export const VAPID_KEY = "BHy_7SdjnZgEofsT4IiHDgXgvAwrcge1rCav5nEIU5RIVpAUamPPWdkb5HMdfeaR4x6hE8FZ_YGmdV-_YWWOKgU";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

export async function requestAndGetFcmToken() {
  try {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg
    });
    return token || null;
  } catch (err) {
    return null;
  }
}

export function listenForegroundPush(callback) {
  try {
    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => callback(payload));
  } catch (err) {
    return () => {};
  }
}