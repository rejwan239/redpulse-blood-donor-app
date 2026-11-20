import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "আপনার_API_KEY_বসান",
  authDomain: "rokto-bondhu-aa008.firebaseapp.com",
  databaseURL: "https://rokto-bondhu-aa008-default-rtdb.firebaseio.com",
  projectId: "rokto-bondhu-aa008",
  storageBucket: "rokto-bondhu-aa008.firebasestorage.app",
  messagingSenderId: "আপনার_SENDER_ID_বসান",
  appId: "আপনার_APP_ID_বসান"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);