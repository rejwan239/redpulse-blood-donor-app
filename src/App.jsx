import React, { useState, useEffect, useRef } from 'react';
import {
  Heart, Droplet, Phone, MessageCircle, MapPin, Search, User, Users,
  Shield, Award, Gift, Bell, BellRing, Send, Plus, Check, CheckCircle,
  X, XCircle, AlertTriangle, Clock, Copy, LogOut, Sparkles, Activity,
  HandHeart, FileText, Wallet, Trash2, Eye, Info, Volume2, Image as ImageIcon
} from 'lucide-react';
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, setDoc, getDoc, increment
} from 'firebase/firestore';
import { db } from './firebase';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

let messaging = null;
try {
  if (typeof window !== 'undefined' && db?.app) {
    messaging = getMessaging(db.app);
  }
} catch (e) {
  console.warn('Messaging not supported:', e);
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const COMPATIBILITY = {
  'A+': { receive: ['A+', 'A-', 'O+', 'O-'], donate: ['A+', 'AB+'] },
  'A-': { receive: ['A-', 'O-'], donate: ['A+', 'A-', 'AB+', 'AB-'] },
  'B+': { receive: ['B+', 'B-', 'O+', 'O-'], donate: ['B+', 'AB+'] },
  'B-': { receive: ['B-', 'O-'], donate: ['B+', 'B-', 'AB+', 'AB-'] },
  'O+': { receive: ['O+', 'O-'], donate: ['O+', 'A+', 'B+', 'AB+'] },
  'O-': { receive: ['O-'], donate: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
  'AB+': { receive: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'], donate: ['AB+'] },
  'AB-': { receive: ['A-', 'B-', 'O-', 'AB-'], donate: ['AB+', 'AB-'] }
};

const THEMES = {
  rose: {
    name: '3D Rose',
    bg: 'bg-gradient-to-br from-rose-50 via-amber-50/40 to-rose-100/60',
    card: 'bg-white/90 backdrop-blur-md border border-rose-100 shadow-[0_8px_24px_rgba(225,29,72,0.08)]',
    primary: 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-500/30',
    text: 'text-slate-900',
    subtext: 'text-slate-500'
  },
  dark: {
    name: 'Royal Dark',
    bg: 'bg-gradient-to-br from-slate-950 via-rose-950/30 to-slate-900',
    card: 'bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-[0_8px_24px_rgba(0,0,0,0.4)]',
    primary: 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-600/30',
    text: 'text-white',
    subtext: 'text-slate-400'
  },
  emerald: {
    name: 'Mint Care',
    bg: 'bg-gradient-to-br from-emerald-50 via-teal-50/40 to-cyan-50/60',
    card: 'bg-white/90 backdrop-blur-md border border-emerald-100 shadow-[0_8px_24px_rgba(16,185,129,0.08)]',
    primary: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30',
    text: 'text-slate-900',
    subtext: 'text-slate-500'
  }
};

export default function App() {
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('rp_theme') || 'rose');
  const theme = THEMES[themeKey] || THEMES.rose;

  // Auth & User State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rp_user')) || null;
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({
    name: '', phone: '', bloodGroup: 'B+', district: '', lastDonate: '', isAdmin: false
  });

  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState('home');
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [alarmModal, setAlarmModal] = useState(null);
  const audioCtxRef = useRef(null);

  // App Data States
  const [donors, setDonors] = useState([]);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [medicalAids, setMedicalAids] = useState([]);
  const [aidDonations, setAidDonations] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [adminConfig, setAdminConfig] = useState({
    bkash: '01700-000000 (Personal)',
    nagad: '01800-000000 (Personal)',
    rocket: '01900-000000-0',
    instruction: 'টাকা পাঠানোর পর নিচের ফর্মে আপনার নাম, টাকার পরিমাণ ও Transaction ID (TrxID) সাবমিট করুন। অ্যাডমিন যাচাই করে রোগীর ফান্ডে যুক্ত করবেন।'
  });

  // Request Blood Tab States
  const [selectedCompatGroup, setSelectedCompatGroup] = useState('B+');
  const [reqForm, setReqForm] = useState({
    patientName: '', bloodGroup: 'B+', bags: '1', hospital: '', phone: '', note: ''
  });
  const [submittingReq, setSubmittingReq] = useState(false);

  // Donor Search States
  const [searchGroup, setSearchGroup] = useState('ALL');
  const [searchDistrict, setSearchDistrict] = useState('');

  // Medical Aid States
  const [showAidForm, setShowAidForm] = useState(false);
  const [aidForm, setAidForm] = useState({
    patientName: '', hospital: '', problem: '', targetAmount: '', phone: '', proofImage: ''
  });
  const [submittingAid, setSubmittingAid] = useState(false);
  const [donateModalAid, setDonateModalAid] = useState(null);
  const [donationForm, setDonationForm] = useState({
    donorName: '', amount: '', method: 'bKash', trxId: ''
  });
  const [previewProof, setPreviewProof] = useState(null);

  // Live Chat States
  const [chatTarget, setChatTarget] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // Admin Form States
  const [newReward, setNewReward] = useState({ title: '', hospital: '', discount: '', cost: '100' });
  const [adminSubTab, setAdminSubTab] = useState('aids');

  // Unlock Web Audio on first click/touch
  useEffect(() => {
    const unlockAudio = () => {
      if (!audioCtxRef.current && (window.AudioContext || window.webkitAudioContext)) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new Ctx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    };
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    return () => window.removeEventListener('pointerdown', unlockAudio);
  }, []);

  const playEmergencySiren = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(980, ctx.currentTime + 0.4);
      osc.frequency.linearRampToValueAtTime(650, ctx.currentTime + 0.8);
      osc.frequency.linearRampToValueAtTime(980, ctx.currentTime + 1.2);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    } catch (e) {
      console.warn('Audio play blocked:', e);
    }
  };

  // Register Service Worker & FCM Token
  const enableNotifications = async () => {
    try {
      if (typeof Notification === 'undefined') return;
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted' && messaging && currentUser?.id) {
        const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const token = await getToken(messaging, { serviceWorkerRegistration: reg }).catch(() => null);
        if (token) {
          await updateDoc(doc(db, 'donors', currentUser.id), { fcmToken: token }).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Notification setup error:', err);
    }
  };

  useEffect(() => {
    if (currentUser?.id && notifPermission === 'granted') {
      enableNotifications();
    }
  }, [currentUser?.id]);

  // Foreground FCM Listener
  useEffect(() => {
    if (!messaging) return;
    const unsub = onMessage(messaging, (payload) => {
      const title = payload?.notification?.title || payload?.data?.title || 'RedPulse Alert';
      const body = payload?.notification?.body || payload?.data?.body || '';
      const isAlarm = payload?.data?.isAlarm === 'true';
      if (isAlarm) {
        playEmergencySiren();
        setAlarmModal({ title, body });
      }
    });
    return () => typeof unsub === 'function' && unsub();
  }, []);

  // Firestore Realtime Listeners
  useEffect(() => {
    const unsubDonors = onSnapshot(collection(db, 'donors'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDonors(list);
      if (currentUser?.id) {
        const updatedMe = list.find((u) => u.id === currentUser.id);
        if (updatedMe) {
          setCurrentUser(updatedMe);
          localStorage.setItem('rp_user', JSON.stringify(updatedMe));
        }
      }
    });

    const unsubReqs = onSnapshot(
      query(collection(db, 'blood_requests'), orderBy('createdAt', 'desc')),
      (snap) => setBloodRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => onSnapshot(collection(db, 'blood_requests'), (snap) =>
        setBloodRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      )
    );

    const unsubAids = onSnapshot(
      query(collection(db, 'medical_aids'), orderBy('createdAt', 'desc')),
      (snap) => setMedicalAids(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => onSnapshot(collection(db, 'medical_aids'), (snap) =>
        setMedicalAids(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      )
    );

    const unsubDonations = onSnapshot(
      query(collection(db, 'aid_donations'), orderBy('createdAt', 'desc')),
      (snap) => setAidDonations(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => onSnapshot(collection(db, 'aid_donations'), (snap) =>
        setAidDonations(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      )
    );

    const unsubRewards = onSnapshot(collection(db, 'rewards'), (snap) => {
      setRewards(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubConfig = onSnapshot(doc(db, 'settings', 'payment'), (snap) => {
      if (snap.exists()) setAdminConfig((prev) => ({ ...prev, ...snap.data() }));
    });

    return () => {
      unsubDonors();
      unsubReqs();
      unsubAids();
      unsubDonations();
      unsubRewards();
      unsubConfig();
    };
  }, []);

  // Chat Messages Listener
  useEffect(() => {
    if (!currentUser?.id || !chatTarget?.id) return;
    const roomId = [currentUser.id, chatTarget.id].sort().join('_');
    const q = query(collection(db, 'chats', roomId, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [currentUser?.id, chatTarget?.id]);

  // Helper: Send Push via Vercel API
  const triggerPushNotification = async ({ tokens, title, body, isAlarm = false, data = {} }) => {
    const validTokens = (tokens || []).filter(Boolean);
    if (validTokens.length === 0) return;
    try {
      await fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: validTokens, title, body, isAlarm, data })
      });
    } catch (e) {
      console.error('Push API failed:', e);
    }
  };

  // PIN-Free Auth Handler
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = authForm.phone.trim();
    if (!cleanPhone) return alert('মোবাইল নম্বর দিন');

    const existing = donors.find((d) => d.phone === cleanPhone);
    if (authMode === 'login') {
      if (!existing) {
        alert('এই নম্বরে কোনো অ্যাকাউন্ট পাওয়া যায়নি। নতুন অ্যাকাউন্ট খুলুন।');
        setAuthMode('signup');
        return;
      }
      setCurrentUser(existing);
      localStorage.setItem('rp_user', JSON.stringify(existing));
    } else {
      if (!authForm.name.trim()) return alert('আপনার নাম লিখুন');
      if (existing) {
        setCurrentUser(existing);
        localStorage.setItem('rp_user', JSON.stringify(existing));
        return;
      }
      const newDoc = {
        name: authForm.name.trim(),
        phone: cleanPhone,
        bloodGroup: authForm.bloodGroup,
        district: authForm.district.trim() || 'Bangladesh',
        lastDonate: authForm.lastDonate || '',
        coins: 50,
        available: true,
        isAdmin: cleanPhone === '01700000000',
        createdAt: serverTimestamp()
      };
      const added = await addDoc(collection(db, 'donors'), newDoc);
      const userObj = { id: added.id, ...newDoc };
      setCurrentUser(userObj);
      localStorage.setItem('rp_user', JSON.stringify(userObj));
    }
  };

  // Submit Blood Request + Alarm Push
  const handleBloodRequest = async (e) => {
    e.preventDefault();
    if (!reqForm.patientName || !reqForm.hospital || !reqForm.phone) {
      return alert('রোগীর নাম, হাসপাতাল এবং মোবাইল নম্বর দিন');
    }
    setSubmittingReq(true);
    try {
      await addDoc(collection(db, 'blood_requests'), {
        ...reqForm,
        requesterId: currentUser.id,
        requesterName: currentUser.name,
        status: 'open',
        createdAt: serverTimestamp()
      });

      const matchingTokens = donors
        .filter((d) => d.id !== currentUser.id && d.bloodGroup === reqForm.bloodGroup && d.available !== false)
        .map((d) => d.fcmToken);

      await triggerPushNotification({
        tokens: matchingTokens,
        title: `🚨 জরুরি ${reqForm.bloodGroup} রক্তের প্রয়োজন!`,
        body: `${reqForm.patientName} (${reqForm.bags} ব্যাগ) - ${reqForm.hospital}। কল: ${reqForm.phone}`,
        isAlarm: true
      });

      setReqForm({ patientName: '', bloodGroup: 'B+', bags: '1', hospital: '', phone: '', note: '' });
      alert('জরুরি রক্তের অনুরোধ পোস্ট হয়েছে এবং ম্যাচিং ডোনারদের অ্যালার্ম পাঠানো হয়েছে!');
    } catch (err) {
      alert('সমস্যা হয়েছে, আবার চেষ্টা করুন।');
    }
    setSubmittingReq(false);
  };

  // Compress Proof Image for Medical Aid
  const handleProofUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 650;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setAidForm((prev) => ({ ...prev, proofImage: canvas.toDataURL('image/jpeg', 0.65) }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Submit Medical Aid Application (Pending Admin Approval)
  const handleAidSubmit = async (e) => {
    e.preventDefault();
    if (!aidForm.patientName || !aidForm.hospital || !aidForm.problem || !aidForm.targetAmount || !aidForm.phone) {
      return alert('সবগুলো তথ্য সঠিকভাবে পূরণ করুন');
    }
    setSubmittingAid(true);
    try {
      await addDoc(collection(db, 'medical_aids'), {
        patientName: aidForm.patientName,
        hospital: aidForm.hospital,
        problem: aidForm.problem,
        targetAmount: Number(aidForm.targetAmount),
        raisedAmount: 0,
        phone: aidForm.phone,
        proofImage: aidForm.proofImage || '',
        applicantId: currentUser.id,
        applicantName: currentUser.name,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setAidForm({ patientName: '', hospital: '', problem: '', targetAmount: '', phone: '', proofImage: '' });
      setShowAidForm(false);
      alert('আপনার সাহায্যের আবেদন জমা হয়েছে! অ্যাডমিন যাচাই (Real/Fake চেক) করার পর এটি পাবলিশ হবে।');
    } catch (err) {
      alert('আবেদন জমা দিতে সমস্যা হয়েছে।');
    }
    setSubmittingAid(false);
  };

  // Submit Donation via Admin
  const handleDonationSubmit = async (e) => {
    e.preventDefault();
    if (!donationForm.amount || !donationForm.trxId) {
      return alert('টাকার পরিমাণ এবং Transaction ID দিন');
    }
    try {
      await addDoc(collection(db, 'aid_donations'), {
        aidId: donateModalAid.id,
        patientName: donateModalAid.patientName,
        donorId: currentUser.id,
        donorName: donationForm.donorName.trim() || currentUser.name,
        amount: Number(donationForm.amount),
        method: donationForm.method,
        trxId: donationForm.trxId.trim(),
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setDonateModalAid(null);
      setDonationForm({ donorName: '', amount: '', method: 'bKash', trxId: '' });
      alert('ধন্যবাদ! আপনার ডোনেশন তথ্য জমা হয়েছে। অ্যাডমিন পেমেন্ট কনফার্ম করলেই রোগীর ফান্ডে যুক্ত হবে।');
    } catch (err) {
      alert('তথ্য জমা দিতে সমস্যা হয়েছে।');
    }
  };

  // Admin: Confirm Donation & Increment Raised Amount
  const confirmAidDonation = async (donation) => {
    try {
      await updateDoc(doc(db, 'aid_donations', donation.id), { status: 'confirmed' });
      await updateDoc(doc(db, 'medical_aids', donation.aidId), {
        raisedAmount: increment(Number(donation.amount))
      });
      if (donation.donorId) {
        await updateDoc(doc(db, 'donors', donation.donorId), {
          coins: increment(25)
        }).catch(() => {});
      }
      alert('পেমেন্ট কনফার্ম হয়েছে এবং রোগীর ফান্ড আপডেট করা হয়েছে!');
    } catch (err) {
      alert('আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  // Send Live Chat Message + Push
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatTarget) return;
    const text = chatInput.trim();
    setChatInput('');
    const roomId = [currentUser.id, chatTarget.id].sort().join('_');
    await addDoc(collection(db, 'chats', roomId, 'messages'), {
      senderId: currentUser.id,
      senderName: currentUser.name,
      text,
      createdAt: serverTimestamp()
    });
    if (chatTarget.fcmToken) {
      await triggerPushNotification({
        tokens: [chatTarget.fcmToken],
        title: `💬 ${currentUser.name} মেসেজ দিয়েছেন`,
        body: text,
        isAlarm: false
      });
    }
  };

  // Claim Reward
  const handleClaimReward = async (reward) => {
    if ((currentUser.coins || 0) < reward.cost) {
      return alert('পর্যাপ্ত কয়েন নেই!');
    }
    await updateDoc(doc(db, 'donors', currentUser.id), {
      coins: increment(-Number(reward.cost))
    });
    alert(`অভিনন্দন! "${reward.title}" রিওয়ার্ডটি ক্লেইম হয়েছে। হাসপাতালে আপনার প্রোফাইল দেখান।`);
  };

  // Login / Signup View
  if (!currentUser) {
    return (
      <div className={`min-h-screen ${theme.bg} flex flex-col items-center justify-center p-4`}>
        <div className={`w-full max-w-md rounded-3xl p-6 ${theme.card}`}>
          <div className="flex flex-col items-center text-center mb-6">
            <img
              src="/logo.svg?v=5"
              alt="RedPulse"
              className="w-16 h-16 rounded-2xl shadow-lg mb-3 object-contain"
            />
            <h1 className={`text-2xl font-black ${theme.text}`}>RedPulse | রক্তবন্ধু</h1>
            <p className={`text-xs mt-1 ${theme.subtext}`}>
              জরুরি রক্তদান, লাইভ চ্যাট ও মানবিক সহায়তা নেটওয়ার্ক
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 bg-rose-100/60 rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`py-2 rounded-xl text-xs font-bold transition ${
                authMode === 'login' ? theme.primary : 'text-slate-600'
              }`}
            >
              লগইন (PIN ছাড়া)
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`py-2 rounded-xl text-xs font-bold transition ${
                authMode === 'signup' ? theme.primary : 'text-slate-600'
              }`}
            >
              নতুন ডোনার রেজিস্ট্রেশন
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-3">
            {authMode === 'signup' && (
              <>
                <input
                  type="text"
                  placeholder="আপনার পূর্ণ নাম"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-rose-200 text-sm outline-none focus:border-rose-500"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={authForm.bloodGroup}
                    onChange={(e) => setAuthForm({ ...authForm, bloodGroup: e.target.value })}
                    className="w-full px-3 py-3 rounded-xl border border-rose-200 text-sm font-bold text-rose-600 outline-none"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="জেলা / এলাকা"
                    value={authForm.district}
                    onChange={(e) => setAuthForm({ ...authForm, district: e.target.value })}
                    className="w-full px-3 py-3 rounded-xl border border-rose-200 text-sm outline-none"
                  />
                </div>
              </>
            )}

            <input
              type="tel"
              placeholder="মোবাইল নম্বর (যেমন: 017XXXXXXXX)"
              value={authForm.phone}
              onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-rose-200 text-sm outline-none focus:border-rose-500"
              required
            />

            <button type="submit" className={`w-full py-3.5 rounded-2xl font-bold text-sm ${theme.primary}`}>
              {authMode === 'login' ? 'প্রবেশ করুন' : 'রেজিস্ট্রেশন সম্পন্ন করুন'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const groupCounts = BLOOD_GROUPS.reduce((acc, g) => {
    acc[g] = donors.filter((d) => d.bloodGroup === g && d.available !== false).length;
    return acc;
  }, {});

  const approvedAids = medicalAids.filter((a) => a.status === 'approved');
  const pendingAids = medicalAids.filter((a) => a.status === 'pending');
  const pendingDonations = aidDonations.filter((d) => d.status === 'pending');

  const filteredDonors = donors.filter((d) => {
    const matchG = searchGroup === 'ALL' || d.bloodGroup === searchGroup;
    const matchD = !searchDistrict || (d.district || '').toLowerCase().includes(searchDistrict.toLowerCase());
    return matchG && matchD;
  });

  return (
    <div className={`min-h-screen ${theme.bg} pb-24 transition-colors`}>
      {/* Emergency Alarm Overlay */}
      {alarmModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center border-4 border-rose-600 animate-bounce">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <BellRing className="w-9 h-9" />
            </div>
            <h3 className="text-lg font-black text-rose-600">{alarmModal.title}</h3>
            <p className="text-sm text-slate-700 mt-2">{alarmModal.body}</p>
            <button
              onClick={() => setAlarmModal(null)}
              className="mt-5 w-full py-3 rounded-2xl bg-rose-600 text-white font-bold text-sm"
            >
              বুঝেছি / বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* Notification Permission Banner */}
      {notifPermission !== 'granted' && (
        <div
          onClick={enableNotifications}
          className="bg-amber-400 text-amber-950 px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
        >
          <Volume2 className="w-4 h-4 shrink-0" />
          <span>জরুরি রক্তের অ্যালার্ম ও চ্যাট নোটিফিকেশন চালু করতে এখানে ট্যাপ করুন</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-rose-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.svg?v=5"
              alt="RedPulse"
              className="w-10 h-10 rounded-xl shadow-md object-contain"
            />
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">RedPulse</h1>
              <p className="text-[11px] font-semibold text-rose-600">রক্তবন্ধু নেটওয়ার্ক</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = themeKey === 'rose' ? 'dark' : themeKey === 'dark' ? 'emerald' : 'rose';
                setThemeKey(next);
                localStorage.setItem('rp_theme', next);
              }}
              className="p-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold"
              title="থিম পরিবর্তন"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setCurrentUser(null);
                localStorage.removeItem('rp_user');
              }}
              className="p-2 rounded-xl bg-slate-100 text-slate-600"
              title="লগআউট"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* User Profile Bar */}
        <div className="max-w-2xl mx-auto mt-2.5 pt-2.5 border-t border-rose-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-rose-600 text-white font-black flex items-center justify-center text-sm shadow">
              {currentUser.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900">{currentUser.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold">
                  <Droplet className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                  {currentUser.bloodGroup}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                  🪙 {currentUser.coins || 0}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('request')}
            className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-500/20"
          >
            + রক্ত চান
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-2xl mx-auto p-4">
        {/* ================= HOME TAB ================= */}
        {activeTab === 'home' && (
          <div>
            <div className="flex flex-col items-center text-center mb-5">
              <h2 className={`text-xl font-extrabold ${theme.text}`}>RedPulse Home Hub</h2>
              <p className={`text-xs mt-1 ${theme.subtext}`}>প্রয়োজনীয় সেবা ও মানবিক সহায়তা নির্বাচন করুন</p>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Request Blood */}
              <button
                onClick={() => setActiveTab('request')}
                className={`p-4 rounded-3xl text-center flex flex-col items-center transition hover:scale-[1.02] ${theme.card}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 mb-3">
                  <Droplet className="w-6 h-6" />
                </div>
                <h3 className={`text-sm font-extrabold ${theme.text}`}>Request Blood</h3>
                <p className={`text-[11px] mt-0.5 ${theme.subtext}`}>জরুরি রক্তের আবেদন</p>
              </button>

              {/* Donor List */}
              <button
                onClick={() => setActiveTab('donors')}
                className={`p-4 rounded-3xl text-center flex flex-col items-center transition hover:scale-[1.02] ${theme.card}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className={`text-sm font-extrabold ${theme.text}`}>Donor List (All)</h3>
                <p className={`text-[11px] mt-0.5 ${theme.subtext}`}>{donors.length} জন ডোনার</p>
              </button>

              {/* Medical Aid / Financial Donation */}
              <button
                onClick={() => setActiveTab('aid')}
                className={`p-4 rounded-3xl text-center flex flex-col items-center transition hover:scale-[1.02] ${theme.card}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-3">
                  <HandHeart className="w-6 h-6" />
                </div>
                <h3 className={`text-sm font-extrabold ${theme.text}`}>Medical Aid</h3>
                <p className={`text-[11px] mt-0.5 ${theme.subtext}`}>
                  আর্থিক সহায়তা ({approvedAids.length} টি কেস)
                </p>
              </button>

              {/* Claim Reward */}
              <button
                onClick={() => setActiveTab('rewards')}
                className={`p-4 rounded-3xl text-center flex flex-col items-center transition hover:scale-[1.02] ${theme.card}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 mb-3">
                  <Gift className="w-6 h-6" />
                </div>
                <h3 className={`text-sm font-extrabold ${theme.text}`}>Claim Reward</h3>
                <p className={`text-[11px] mt-0.5 ${theme.subtext}`}>
                  {currentUser.coins || 0} Coins • হাসপাতাল ছাড়
                </p>
              </button>

              {/* Live Chat */}
              <button
                onClick={() => setActiveTab('chat')}
                className={`p-4 rounded-3xl text-center flex flex-col items-center transition hover:scale-[1.02] ${theme.card}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h3 className={`text-sm font-extrabold ${theme.text}`}>Live Chat</h3>
                <p className={`text-[11px] mt-0.5 ${theme.subtext}`}>ডোনারের সাথে কথা বলুন</p>
              </button>

              {/* Admin Panel */}
              <button
                onClick={() => setActiveTab('admin')}
                className={`p-4 rounded-3xl text-center flex flex-col items-center transition hover:scale-[1.02] ${theme.card}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 mb-3">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className={`text-sm font-extrabold ${theme.text}`}>Admin Verify</h3>
                <p className={`text-[11px] mt-0.5 ${theme.subtext}`}>
                  {pendingAids.length + pendingDonations.length} টি পেন্ডিং যাচাই
                </p>
              </button>
            </div>
          </div>
        )}

        {/* ================= REQUEST BLOOD TAB (UPGRADED) ================= */}
        {activeTab === 'request' && (
          <div className="space-y-5">
            <div className="flex flex-col items-center text-center">
              <h2 className={`text-xl font-extrabold ${theme.text}`}>জরুরি রক্তের আবেদন ও লাইভ স্ট্যাটাস</h2>
              <p className={`text-xs mt-1 ${theme.subtext}`}>
                গ্রুপভিত্তিক প্রস্তুত ডোনার দেখুন এবং তাৎক্ষণিক অ্যালার্ম পাঠান
              </p>
            </div>

            {/* Feature 1: Live Donor Availability by Group */}
            <div className={`p-4 rounded-3xl ${theme.card}`}>
              <h3 className={`text-sm font-extrabold text-center mb-3 ${theme.text}`}>
                গ্রুপভিত্তিক প্রস্তুত ডোনার সংখ্যা
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => {
                      setReqForm({ ...reqForm, bloodGroup: bg });
                      setSelectedCompatGroup(bg);
                    }}
                    className={`p-2.5 rounded-2xl border text-center transition ${
                      reqForm.bloodGroup === bg
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                        : 'bg-rose-50/70 border-rose-100 text-slate-800'
                    }`}
                  >
                    <div className="text-sm font-black">{bg}</div>
                    <div className={`text-[11px] font-bold ${reqForm.bloodGroup === bg ? 'text-rose-100' : 'text-rose-600'}`}>
                      {groupCounts[bg] || 0} জন
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Request Form */}
            <div className={`p-5 rounded-3xl ${theme.card}`}>
              <h3 className={`text-sm font-extrabold text-center mb-3 ${theme.text}`}>
                নতুন রক্তের অনুরোধ ফর্ম
              </h3>
              <form onSubmit={handleBloodRequest} className="space-y-3">
                <input
                  type="text"
                  placeholder="রোগীর নাম"
                  value={reqForm.patientName}
                  onChange={(e) => setReqForm({ ...reqForm, patientName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-rose-200 text-sm outline-none"
                  required
                />
                <div className="grid grid-cols-2 gap-2.5">
                  <select
                    value={reqForm.bloodGroup}
                    onChange={(e) => setReqForm({ ...reqForm, bloodGroup: e.target.value })}
                    className="w-full px-3 py-3 rounded-xl border border-rose-200 text-sm font-bold text-rose-600 outline-none"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>গ্রুপ: {bg}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="কয় ব্যাগ?"
                    value={reqForm.bags}
                    onChange={(e) => setReqForm({ ...reqForm, bags: e.target.value })}
                    className="w-full px-3 py-3 rounded-xl border border-rose-200 text-sm outline-none"
                  />
                </div>
                <input
                  type="text"
                  placeholder="হাসপাতালের নাম ও ঠিকানা"
                  value={reqForm.hospital}
                  onChange={(e) => setReqForm({ ...reqForm, hospital: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-rose-200 text-sm outline-none"
                  required
                />
                <input
                  type="tel"
                  placeholder="যোগাযোগের মোবাইল নম্বর"
                  value={reqForm.phone}
                  onChange={(e) => setReqForm({ ...reqForm, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-rose-200 text-sm outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="সমস্যার বিবরণ (ঐচ্ছিক, যেমন: অপারেশন/থ্যালাসেমিয়া)"
                  value={reqForm.note}
                  onChange={(e) => setReqForm({ ...reqForm, note: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-rose-200 text-sm outline-none"
                />
                <button
                  type="submit"
                  disabled={submittingReq}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm ${theme.primary}`}
                >
                  {submittingReq ? 'অ্যালার্ম পাঠানো হচ্ছে...' : '🚨 জরুরি অনুরোধ ও অ্যালার্ম পাঠান'}
                </button>
              </form>
            </div>

            {/* Feature 2: Interactive Blood Compatibility Chart */}
            <div className={`p-4 rounded-3xl ${theme.card}`}>
              <div className="text-center mb-3">
                <h3 className={`text-sm font-extrabold ${theme.text}`}>ব্লাড কম্প্যাটিবিলিটি চার্ট</h3>
                <p className={`text-[11px] ${theme.subtext}`}>গ্রুপ সিলেক্ট করে দেখুন কার থেকে রক্ত নেওয়া যাবে</p>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setSelectedCompatGroup(bg)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold ${
                      selectedCompatGroup === bg
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-center">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <p className="text-[11px] font-bold text-emerald-700 mb-1">রক্ত নিতে পারবে (Receive)</p>
                  <p className="text-xs font-black text-emerald-900">
                    {COMPATIBILITY[selectedCompatGroup]?.receive.join(', ')}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100">
                  <p className="text-[11px] font-bold text-rose-700 mb-1">রক্ত দিতে পারবে (Donate)</p>
                  <p className="text-xs font-black text-rose-900">
                    {COMPATIBILITY[selectedCompatGroup]?.donate.join(', ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3: Active Blood Requests Live Feed */}
            <div>
              <div className="text-center mb-3">
                <h3 className={`text-base font-extrabold ${theme.text}`}>চলমান জরুরি রক্তের অনুরোধসমূহ</h3>
                <p className={`text-xs ${theme.subtext}`}>যাদের এখনই রক্ত প্রয়োজন তাদের পাশে দাঁড়ান</p>
              </div>
              <div className="space-y-3">
                {bloodRequests.length === 0 ? (
                  <p className={`text-center text-xs py-6 ${theme.subtext}`}>বর্তমানে কোনো চলমান অনুরোধ নেই</p>
                ) : (
                  bloodRequests.map((req) => (
                    <div key={req.id} className={`p-4 rounded-3xl ${theme.card}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-xl bg-rose-600 text-white text-xs font-black">
                              {req.bloodGroup}
                            </span>
                            <h4 className={`text-sm font-extrabold ${theme.text}`}>{req.patientName}</h4>
                            <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">
                              {req.bags} ব্যাগ
                            </span>
                          </div>
                          <p className={`text-xs mt-1.5 flex items-center gap-1 ${theme.subtext}`}>
                            <MapPin className="w-3.5 h-3.5 text-rose-500" /> {req.hospital}
                          </p>
                          {req.note && <p className="text-xs text-slate-600 mt-1">সমস্যা: {req.note}</p>}
                        </div>
                        <a
                          href={`tel:${req.phone}`}
                          className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shrink-0"
                        >
                          <Phone className="w-3.5 h-3.5" /> কল
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= MEDICAL AID / DONATION TAB ================= */}
        {activeTab === 'aid' && (
          <div className="space-y-5">
            <div className="flex flex-col items-center text-center">
              <h2 className={`text-xl font-extrabold ${theme.text}`}>Medical Aid & মানবিক সহায়তা</h2>
              <p className={`text-xs mt-1 ${theme.subtext}`}>
                অ্যাডমিন কর্তৃক যাচাইকৃত অসহায় রোগীদের চিকিৎসায় সহায়তা করুন
              </p>
              <button
                onClick={() => setShowAidForm(!showAidForm)}
                className={`mt-3 px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 ${theme.primary}`}
              >
                <Plus className="w-4 h-4" />
                {showAidForm ? 'ফর্ম বন্ধ করুন' : 'চিকিৎসা সাহায্যের আবেদন করুন'}
              </button>
            </div>

            {/* Apply for Medical Aid Form */}
            {showAidForm && (
              <div className={`p-5 rounded-3xl ${theme.card}`}>
                <div className="text-center mb-3">
                  <h3 className={`text-sm font-extrabold ${theme.text}`}>সাহায্য চাওয়ার আবেদন ফর্ম</h3>
                  <p className={`text-[11px] ${theme.subtext}`}>
                    আবেদনটি অ্যাডমিন যাচাই (Real/Fake) করার পর পাবলিশ হবে
                  </p>
                </div>
                <form onSubmit={handleAidSubmit} className="space-y-3">
                  <input
                    type="text"
                    placeholder="রোগীর পূর্ণ নাম"
                    value={aidForm.patientName}
                    onChange={(e) => setAidForm({ ...aidForm, patientName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-rose-200 text-sm outline-none"
                    required
                  />
                  <input
                    type="text"
                    placeholder="হাসপাতালের নাম ও ওয়ার্ড/বেড নং"
                    value={aidForm.hospital}
                    onChange={(e) => setAidForm({ ...aidForm, hospital: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-rose-200 text-sm outline-none"
                    required
                  />
                  <textarea
                    rows="3"
                    placeholder="রোগের বিবরণ ও কেন আর্থিক সাহায্য প্রয়োজন"
                    value={aidForm.problem}
                    onChange={(e) => setAidForm({ ...aidForm, problem: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-rose-200 text-sm outline-none"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      type="number"
                      placeholder="প্রয়োজনীয় টাকা (৳)"
                      value={aidForm.targetAmount}
                      onChange={(e) => setAidForm({ ...aidForm, targetAmount: e.target.value })}
                      className="w-full px-3 py-3 rounded-xl border border-rose-200 text-sm outline-none"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="যোগাযোগের নম্বর"
                      value={aidForm.phone}
                      onChange={(e) => setAidForm({ ...aidForm, phone: e.target.value })}
                      className="w-full px-3 py-3 rounded-xl border border-rose-200 text-sm outline-none"
                      required
                    />
                  </div>
                  <div className="p-3 rounded-xl border border-dashed border-rose-300 bg-rose-50/50 text-center">
                    <label className="cursor-pointer flex flex-col items-center gap-1 text-xs font-bold text-rose-700">
                      <ImageIcon className="w-5 h-5" />
                      <span>প্রেসক্রিপশন বা মেডিকেল রিপোর্টের ছবি দিন (যাচাইয়ের জন্য)</span>
                      <input type="file" accept="image/*" onChange={handleProofUpload} className="hidden" />
                    </label>
                    {aidForm.proofImage && (
                      <p className="text-[11px] text-emerald-600 font-bold mt-1">✓ ছবি সংযুক্ত হয়েছে</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={submittingAid}
                    className={`w-full py-3.5 rounded-2xl font-bold text-sm ${theme.primary}`}
                  >
                    {submittingAid ? 'জমা হচ্ছে...' : 'ভেরিফিকেশনের জন্য জমা দিন'}
                  </button>
                </form>
              </div>
            )}

            {/* Verified & Published Medical Aid List */}
            <div className="space-y-4">
              {approvedAids.length === 0 ? (
                <div className={`p-8 rounded-3xl text-center ${theme.card}`}>
                  <p className={`text-xs ${theme.subtext}`}>বর্তমানে কোনো ভেরিফায়েড সাহায্যের আবেদন নেই।</p>
                </div>
              ) : (
                approvedAids.map((aid) => {
                  const pct = Math.min(100, Math.round(((aid.raisedAmount || 0) / (aid.targetAmount || 1)) * 100));
                  return (
                    <div key={aid.id} className={`p-5 rounded-3xl ${theme.card}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                          <CheckCircle className="w-3.5 h-3.5" /> Admin Verified
                        </span>
                        <span className="text-xs font-bold text-slate-500">{aid.hospital}</span>
                      </div>

                      <h3 className={`text-base font-extrabold ${theme.text}`}>{aid.patientName}</h3>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{aid.problem}</p>

                      {aid.proofImage && (
                        <button
                          onClick={() => setPreviewProof(aid.proofImage)}
                          className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 underline"
                        >
                          <Eye className="w-3.5 h-3.5" /> মেডিকেল প্রমাণপত্র দেখুন
                        </button>
                      )}

                      {/* Fundraising Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs font-extrabold mb-1">
                          <span className="text-emerald-600">সংগৃহীত: ৳{aid.raisedAmount || 0}</span>
                          <span className="text-slate-600">লক্ষ্য: ৳{aid.targetAmount} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => setDonateModalAid(aid)}
                          className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md"
                        >
                          💚 Donate via Admin
                        </button>
                        <a
                          href={`tel:${aid.phone}`}
                          className="px-4 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5" /> কল
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Donate via Admin Modal */}
        {donateModalAid && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-black text-slate-900">Admin-এর মাধ্যমে ডোনেশন</h3>
                <button onClick={() => setDonateModalAid(null)} className="p-1.5 rounded-full bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5 mb-4">
                <p className="font-extrabold text-emerald-900">রোগী: {donateModalAid.patientName}</p>
                <p className="text-slate-700">{adminConfig.instruction}</p>
                <div className="pt-1 space-y-1 font-bold text-slate-800">
                  <p>• bKash: <span className="text-rose-600">{adminConfig.bkash}</span></p>
                  <p>• Nagad: <span className="text-orange-600">{adminConfig.nagad}</span></p>
                  <p>• Rocket: <span className="text-purple-600">{adminConfig.rocket}</span></p>
                </div>
              </div>

              <form onSubmit={handleDonationSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="আপনার নাম (ঐচ্ছিক)"
                  value={donationForm.donorName}
                  onChange={(e) => setDonationForm({ ...donationForm, donorName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="টাকার পরিমাণ (৳)"
                    value={donationForm.amount}
                    onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none"
                    required
                  />
                  <select
                    value={donationForm.method}
                    onChange={(e) => setDonationForm({ ...donationForm, method: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                    <option value="Bank">Bank</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Transaction ID (TrxID)"
                  value={donationForm.trxId}
                  onChange={(e) => setDonationForm({ ...donationForm, trxId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm"
                >
                  ডোনেশন তথ্য সাবমিট করুন
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Proof Image Lightbox */}
        {previewProof && (
          <div
            onClick={() => setPreviewProof(null)}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          >
            <img src={previewProof} alt="Medical Proof" className="max-w-full max-h-[85vh] rounded-2xl" />
          </div>
        )}

        {/* ================= DONOR LIST TAB ================= */}
        {activeTab === 'donors' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center">
              <h2 className={`text-xl font-extrabold ${theme.text}`}>সকল রক্তদাতার তালিকা</h2>
              <p className={`text-xs mt-1 ${theme.subtext}`}>গ্রুপ ও এলাকা অনুযায়ী ডোনার খুঁজুন</p>
            </div>

            <div className={`p-3.5 rounded-2xl space-y-2.5 ${theme.card}`}>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setSearchGroup('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${
                    searchGroup === 'ALL' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  সব গ্রুপ
                </button>
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setSearchGroup(bg)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${
                      searchGroup === bg ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="জেলা বা এলাকার নাম লিখুন..."
                value={searchDistrict}
                onChange={(e) => setSearchDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none"
              />
            </div>

            <div className="space-y-2.5">
              {filteredDonors.map((d) => (
                <div key={d.id} className={`p-4 rounded-2xl flex items-center justify-between ${theme.card}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 font-black flex items-center justify-center text-sm">
                      {d.bloodGroup}
                    </div>
                    <div>
                      <h4 className={`text-sm font-extrabold ${theme.text}`}>{d.name}</h4>
                      <p className={`text-xs ${theme.subtext}`}>{d.district || 'Bangladesh'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setChatTarget(d);
                        setActiveTab('chat');
                      }}
                      className="p-2.5 rounded-xl bg-blue-50 text-blue-600"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <a
                      href={`tel:${d.phone}`}
                      className="p-2.5 rounded-xl bg-emerald-600 text-white"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= CLAIM REWARD TAB ================= */}
        {activeTab === 'rewards' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center">
              <h2 className={`text-xl font-extrabold ${theme.text}`}>Claim Reward & হাসপাতাল ছাড়</h2>
              <p className={`text-xs mt-1 ${theme.subtext}`}>
                আপনার বর্তমান ব্যালেন্স: <span className="font-black text-orange-600">{currentUser.coins || 0} Coins</span>
              </p>
            </div>

            <div className="space-y-3">
              {rewards.length === 0 ? (
                <div className={`p-6 rounded-3xl text-center ${theme.card}`}>
                  <p className={`text-xs ${theme.subtext}`}>
                    অ্যাডমিন প্যানেল থেকে নতুন হাসপাতাল ডিসকাউন্ট ও রিওয়ার্ড যোগ করা হবে।
                  </p>
                </div>
              ) : (
                rewards.map((rw) => (
                  <div key={rw.id} className={`p-4 rounded-3xl flex items-center justify-between ${theme.card}`}>
                    <div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {rw.discount}
                      </span>
                      <h4 className={`text-sm font-extrabold mt-1 ${theme.text}`}>{rw.title}</h4>
                      <p className={`text-xs ${theme.subtext}`}>{rw.hospital}</p>
                    </div>
                    <button
                      onClick={() => handleClaimReward(rw)}
                      className="px-4 py-2.5 rounded-2xl bg-amber-500 text-white text-xs font-extrabold shadow"
                    >
                      {rw.cost} Coins
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= LIVE CHAT TAB ================= */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center">
              <h2 className={`text-xl font-extrabold ${theme.text}`}>
                {chatTarget ? `${chatTarget.name}-এর সাথে চ্যাট` : 'Live Donor Chat'}
              </h2>
              <p className={`text-xs mt-1 ${theme.subtext}`}>
                {chatTarget ? `গ্রুপ: ${chatTarget.bloodGroup}` : 'কথা বলার জন্য নিচ থেকে একজন ডোনার নির্বাচন করুন'}
              </p>
            </div>

            {!chatTarget ? (
              <div className="space-y-2">
                {donors
                  .filter((d) => d.id !== currentUser.id)
                  .map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setChatTarget(d)}
                      className={`w-full p-3.5 rounded-2xl flex items-center justify-between ${theme.card}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 font-black flex items-center justify-center text-xs">
                          {d.bloodGroup}
                        </span>
                        <span className={`text-sm font-bold ${theme.text}`}>{d.name}</span>
                      </div>
                      <span className="text-xs font-bold text-blue-600">চ্যাট করুন →</span>
                    </button>
                  ))}
              </div>
            ) : (
              <div className={`p-4 rounded-3xl flex flex-col h-[62vh] ${theme.card}`}>
                <button
                  onClick={() => setChatTarget(null)}
                  className="text-xs font-bold text-rose-600 mb-2 self-start"
                >
                  ← অন্য ডোনার দেখুন
                </button>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs ${
                        m.senderId === currentUser.id
                          ? 'ml-auto bg-rose-600 text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {m.text}
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="মেসেজ লিখুন..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none"
                  />
                  <button type="submit" className="px-4 py-2.5 rounded-xl bg-rose-600 text-white">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ================= ADMIN VERIFICATION & CONTROL TAB ================= */}
        {activeTab === 'admin' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center">
              <h2 className={`text-xl font-extrabold ${theme.text}`}>Admin Verification & Control</h2>
              <p className={`text-xs mt-1 ${theme.subtext}`}>
                সাহায্যের আবেদন (Real/Fake) যাচাই, ডোনেশন কনফার্ম ও রিওয়ার্ড নিয়ন্ত্রণ
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setAdminSubTab('aids')}
                className={`py-2.5 rounded-xl text-xs font-bold ${
                  adminSubTab === 'aids' ? theme.primary : 'bg-white text-slate-700'
                }`}
              >
                আবেদন যাচাই ({pendingAids.length})
              </button>
              <button
                onClick={() => setAdminSubTab('donations')}
                className={`py-2.5 rounded-xl text-xs font-bold ${
                  adminSubTab === 'donations' ? theme.primary : 'bg-white text-slate-700'
                }`}
              >
                ডোনেশন ({pendingDonations.length})
              </button>
              <button
                onClick={() => setAdminSubTab('settings')}
                className={`py-2.5 rounded-xl text-xs font-bold ${
                  adminSubTab === 'settings' ? theme.primary : 'bg-white text-slate-700'
                }`}
              >
                নম্বর ও রিওয়ার্ড
              </button>
            </div>

            {/* Subtab 1: Verify Real/Fake Medical Aid Applications */}
            {adminSubTab === 'aids' && (
              <div className="space-y-3">
                {medicalAids.map((aid) => (
                  <div key={aid.id} className={`p-4 rounded-3xl ${theme.card}`}>
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                          aid.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {aid.status === 'approved' ? 'Published' : 'Pending Verification'}
                      </span>
                      <span className="text-xs font-bold text-rose-600">লক্ষ্য: ৳{aid.targetAmount}</span>
                    </div>
                    <h4 className={`text-sm font-extrabold mt-2 ${theme.text}`}>{aid.patientName}</h4>
                    <p className="text-xs text-slate-500">{aid.hospital} • কল: {aid.phone}</p>
                    <p className="text-xs text-slate-700 mt-1">{aid.problem}</p>

                    {aid.proofImage && (
                      <button
                        onClick={() => setPreviewProof(aid.proofImage)}
                        className="mt-2 text-xs font-bold text-blue-600 underline flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> প্রমাণপত্র যাচাই করুন
                      </button>
                    )}

                    <div className="mt-3 flex gap-2">
                      {aid.status !== 'approved' && (
                        <button
                          onClick={() => updateDoc(doc(db, 'medical_aids', aid.id), { status: 'approved' })}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                        >
                          ✓ Real - Approve & Publish
                        </button>
                      )}
                      <button
                        onClick={() => deleteDoc(doc(db, 'medical_aids', aid.id))}
                        className="px-3.5 py-2 rounded-xl bg-rose-100 text-rose-700 text-xs font-bold"
                      >
                        Fake / Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Subtab 2: Confirm User Donations via Admin */}
            {adminSubTab === 'donations' && (
              <div className="space-y-3">
                {aidDonations.map((dn) => (
                  <div key={dn.id} className={`p-4 rounded-3xl ${theme.card}`}>
                    <div className="flex justify-between text-xs font-bold">
                      <span>দাতা: {dn.donorName}</span>
                      <span className="text-emerald-600">৳{dn.amount} ({dn.method})</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">রোগী: {dn.patientName}</p>
                    <p className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded-lg mt-1.5">
                      TrxID: {dn.trxId}
                    </p>
                    <div className="mt-3 flex gap-2">
                      {dn.status === 'pending' ? (
                        <button
                          onClick={() => confirmAidDonation(dn)}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                        >
                          ✓ পেমেন্ট পেয়েছি (Confirm & Add Fund)
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600">✓ Confirmed</span>
                      )}
                      <button
                        onClick={() => deleteDoc(doc(db, 'aid_donations', dn.id))}
                        className="px-3 py-2 rounded-xl bg-rose-100 text-rose-700 text-xs font-bold"
                      >
                        মুছুন
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Subtab 3: Admin Payment Numbers & Rewards Control */}
            {adminSubTab === 'settings' && (
              <div className="space-y-4">
                <div className={`p-4 rounded-3xl space-y-2.5 ${theme.card}`}>
                  <h4 className={`text-sm font-extrabold text-center ${theme.text}`}>
                    অ্যাডমিন পেমেন্ট নম্বর সেটিংস
                  </h4>
                  <input
                    type="text"
                    placeholder="bKash নম্বর"
                    value={adminConfig.bkash}
                    onChange={(e) => setAdminConfig({ ...adminConfig, bkash: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Nagad নম্বর"
                    value={adminConfig.nagad}
                    onChange={(e) => setAdminConfig({ ...adminConfig, nagad: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Rocket নম্বর"
                    value={adminConfig.rocket}
                    onChange={(e) => setAdminConfig({ ...adminConfig, rocket: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                  <button
                    onClick={async () => {
                      await setDoc(doc(db, 'settings', 'payment'), adminConfig, { merge: true });
                      alert('পেমেন্ট নম্বর আপডেট হয়েছে!');
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold ${theme.primary}`}
                  >
                    পেমেন্ট তথ্য সেভ করুন
                  </button>
                </div>

                <div className={`p-4 rounded-3xl space-y-2.5 ${theme.card}`}>
                  <h4 className={`text-sm font-extrabold text-center ${theme.text}`}>
                    নতুন হাসপাতাল ডিসকাউন্ট রিওয়ার্ড যোগ করুন
                  </h4>
                  <input
                    type="text"
                    placeholder="রিওয়ার্ডের নাম (যেমন: ফ্রি ব্লাড টেস্ট)"
                    value={newReward.title}
                    onChange={(e) => setNewReward({ ...newReward, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="হাসপাতাল / ডায়াগনস্টিক সেন্টারের নাম"
                    value={newReward.hospital}
                    onChange={(e) => setNewReward({ ...newReward, hospital: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="ছাড় (যেমন: 30% OFF)"
                      value={newReward.discount}
                      onChange={(e) => setNewReward({ ...newReward, discount: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                    <input
                      type="number"
                      placeholder="কয়েন খরচ"
                      value={newReward.cost}
                      onChange={(e) => setNewReward({ ...newReward, cost: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      if (!newReward.title || !newReward.hospital) return;
                      await addDoc(collection(db, 'rewards'), {
                        ...newReward,
                        cost: Number(newReward.cost || 100)
                      });
                      setNewReward({ title: '', hospital: '', discount: '', cost: '100' });
                      alert('নতুন রিওয়ার্ড যোগ হয়েছে!');
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold ${theme.primary}`}
                  >
                    + রিওয়ার্ড পাবলিশ করুন
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-rose-100 px-2 py-2">
        <div className="max-w-2xl mx-auto grid grid-cols-5 gap-1">
          {[
            { id: 'home', label: 'Home', icon: Heart },
            { id: 'request', label: 'Request', icon: Droplet },
            { id: 'aid', label: 'Aid', icon: HandHeart },
            { id: 'donors', label: 'Donors', icon: Users },
            { id: 'chat', label: 'Chat', icon: MessageCircle }
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center py-1.5 rounded-2xl transition ${
                  active ? 'text-rose-600 bg-rose-50 font-extrabold' : 'text-slate-500 font-semibold'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}