import React, { useState, useEffect, useRef } from 'react';
import { db, requestAndGetFcmToken, listenForegroundPush } from './firebase';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import {
  Heart,
  Bell,
  Palette,
  Home,
  Droplet,
  User,
  Shield,
  Database,
  Building2,
  Users,
  UserCheck,
  Award,
  Star,
  Info,
  FileBadge,
  Ambulance,
  Search,
  Send,
  MapPin,
  CheckCircle2,
  X,
  Edit3,
  Trash2,
  Ban,
  Volume2,
  Plus,
  Minus,
  LogOut,
  Mail,
  Navigation,
  ChevronRight,
  Download,
  Stethoscope,
  Camera,
  Gift,
  Coins,
  Ticket,
  BellRing,
  Hospital
} from 'lucide-react';

// ============================================================================
// ১. কনস্ট্যান্ট ও ৫টি প্রিমিয়াম 3D থিম কনফিগারেশন
// ============================================================================
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const RARE_GROUPS = ['A-', 'B-', 'O-', 'AB-'];
const COOLDOWN_DAYS = 120;

const THEMES = {
  crimson: {
    id: 'crimson',
    name: 'Crimson Pulse',
    bg: 'bg-rose-50/90',
    card: 'bg-white/95 border-rose-200/80 shadow-[0_10px_25px_-5px_rgba(225,29,72,0.15),0_4px_0_0_rgba(225,29,72,0.2)]',
    btn3d: 'bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-[0_6px_0_0_#9f1239,0_12px_20px_rgba(225,29,72,0.35)] active:shadow-[0_2px_0_0_#9f1239] active:translate-y-1',
    accentText: 'text-rose-600',
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    watermark: '#e11d48',
    textMain: 'text-slate-800',
    textSub: 'text-slate-500',
    navBg: 'bg-white/95 border-rose-200 shadow-[0_-10px_30px_rgba(225,29,72,0.12)]'
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Dark',
    bg: 'bg-slate-950',
    card: 'bg-slate-900/95 border-slate-700/80 shadow-[0_12px_28px_-5px_rgba(0,0,0,0.6),0_4px_0_0_#1e293b]',
    btn3d: 'bg-gradient-to-b from-rose-500 to-red-700 text-white shadow-[0_6px_0_0_#4c0519,0_12px_24px_rgba(244,63,94,0.4)] active:shadow-[0_2px_0_0_#4c0519] active:translate-y-1',
    accentText: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    watermark: '#fb7185',
    textMain: 'text-slate-100',
    textSub: 'text-slate-400',
    navBg: 'bg-slate-900/95 border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.6)]'
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Care',
    bg: 'bg-emerald-50/90',
    card: 'bg-white/95 border-emerald-200/80 shadow-[0_10px_25px_-5px_rgba(5,150,105,0.15),0_4px_0_0_rgba(5,150,105,0.2)]',
    btn3d: 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[0_6px_0_0_#065f46,0_12px_20px_rgba(5,150,105,0.35)] active:shadow-[0_2px_0_0_#065f46] active:translate-y-1',
    accentText: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    watermark: '#059669',
    textMain: 'text-slate-800',
    textSub: 'text-slate-500',
    navBg: 'bg-white/95 border-emerald-200 shadow-[0_-10px_30px_rgba(5,150,105,0.12)]'
  },
  ocean: {
    id: 'ocean',
    name: 'Royal Ocean',
    bg: 'bg-sky-50/90',
    card: 'bg-white/95 border-sky-200/80 shadow-[0_10px_25px_-5px_rgba(2,132,199,0.15),0_4px_0_0_rgba(2,132,199,0.2)]',
    btn3d: 'bg-gradient-to-b from-sky-500 to-blue-600 text-white shadow-[0_6px_0_0_#075985,0_12px_20px_rgba(2,132,199,0.35)] active:shadow-[0_2px_0_0_#075985] active:translate-y-1',
    accentText: 'text-sky-600',
    badge: 'bg-sky-100 text-sky-700 border-sky-200',
    watermark: '#0284c7',
    textMain: 'text-slate-800',
    textSub: 'text-slate-500',
    navBg: 'bg-white/95 border-sky-200 shadow-[0_-10px_30px_rgba(2,132,199,0.12)]'
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Amber',
    bg: 'bg-amber-50/90',
    card: 'bg-white/95 border-amber-200/80 shadow-[0_10px_25px_-5px_rgba(217,119,6,0.15),0_4px_0_0_rgba(217,119,6,0.2)]',
    btn3d: 'bg-gradient-to-b from-amber-500 to-orange-600 text-white shadow-[0_6px_0_0_#92400e,0_12px_20px_rgba(217,119,6,0.35)] active:shadow-[0_2px_0_0_#92400e] active:translate-y-1',
    accentText: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    watermark: '#d97706',
    textMain: 'text-slate-800',
    textSub: 'text-slate-500',
    navBg: 'bg-white/95 border-amber-200 shadow-[0_-10px_30px_rgba(217,119,6,0.12)]'
  }
};

// ============================================================================
// ২. হেল্পার ফাংশন (১২০ দিনের কুলডাউন ও স্মার্ট রেডিনেস লজিক)
// ============================================================================
function calculateDonorReadiness(donor) {
  if (!donor) return { isReady: true, daysRemaining: 0, reason: 'রক্তদানের জন্য প্রস্তুত' };
  if (donor.isBanned) return { isReady: false, daysRemaining: 999, reason: 'অ্যাকাউন্ট স্থগিত' };

  let daysRemaining = 0;
  if (donor.lastDonationDate) {
    const last = new Date(donor.lastDonationDate);
    if (!isNaN(last.getTime())) {
      const diffTime = Date.now() - last.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < COOLDOWN_DAYS) {
        daysRemaining = COOLDOWN_DAYS - diffDays;
      }
    }
  }

  const ageOk = !donor.age || (Number(donor.age) >= 18 && Number(donor.age) <= 60);
  const weightOk = !donor.weight || Number(donor.weight) >= 50;
  const hbOk = !donor.hemoglobin || Number(donor.hemoglobin) >= 12.5;
  const medOk = !donor.onMedication;

  if (daysRemaining > 0) {
    return { isReady: false, daysRemaining, reason: `আরও ${daysRemaining} দিন পর রক্ত দিতে পারবেন` };
  }
  if (!ageOk) return { isReady: false, daysRemaining: 0, reason: 'বয়স ১৮-৬০ বছরের মধ্যে হতে হবে' };
  if (!weightOk) return { isReady: false, daysRemaining: 0, reason: 'ওজন কমপক্ষে ৫০ কেজি হতে হবে' };
  if (!hbOk) return { isReady: false, daysRemaining: 0, reason: 'হিমোগ্লোবিন ১২.৫+ হতে হবে' };
  if (!medOk) return { isReady: false, daysRemaining: 0, reason: 'বর্তমানে ওষুধ সেবন করছেন' };

  return { isReady: true, daysRemaining: 0, reason: 'রক্তদানের জন্য সম্পূর্ণ প্রস্তুত' };
}

function compressImageToBase64(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 240;
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        }
      } else {
        if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL('image/jpeg', 0.78));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ============================================================================
// ৩. ওয়েব অডিও সিন্থেসাইজার (চাইম ও ইমার্জেন্সি অ্যালার্ম সাউন্ড)
// ============================================================================
function playSoundEffect(type = 'chime', sharedCtx = null) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = sharedCtx || new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'alarm') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
      osc.frequency.exponentialRampToValueAtTime(980, ctx.currentTime + 0.7);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);
      osc.start();
      osc.stop(ctx.currentTime + 0.9);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {}
}

// ============================================================================
// ৪. 3D ব্লাড ড্রপ ওয়াটারমার্ক কম্পোনেন্ট
// ============================================================================
function BloodDropWatermark({ color }) {
  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 select-none">
      <svg
        viewBox="0 0 200 260"
        className="w-[340px] h-[440px] opacity-[0.07] transition-all duration-700 transform -rotate-6"
      >
        <defs>
          <radialGradient id="drop3d" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="45%" stopColor={color} stopOpacity="0.85" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.9" />
          </radialGradient>
        </defs>
        <path
          d="M100 12 C100 12 20 112 20 172 C20 216 56 250 100 250 C144 250 180 216 180 172 C180 112 100 12 100 12 Z"
          fill="url(#drop3d)"
        />
        <ellipse cx="70" cy="145" rx="12" ry="26" transform="rotate(-20 70 145)" fill="#ffffff" opacity="0.45" />
      </svg>
    </div>
  );
}

// ============================================================================
// ৫. মেইন অ্যাপ্লিকেশন কম্পোনেন্ট
// ============================================================================
export default function App() {
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('rp_theme') || 'crimson');
  const theme = THEMES[themeKey] || THEMES.crimson;

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('rp_user');
    return saved ? JSON.parse(saved) : null;
  });

  // লগইন মোড: 'donor_signup' (নতুন ইউজার - কোনো PIN ছাড়া), 'donor_login' (আগের ইউজার নাম দিয়ে), 'staff_login' (Admin / Data Entry / Blood Bank - PIN সহ)
  const [authMode, setAuthMode] = useState('donor_signup');
  const [authForm, setAuthForm] = useState({
    name: '',
    bloodGroup: 'O+',
    location: '',
    phone: '',
    pin: ''
  });
  const [authError, setAuthError] = useState('');

  const [masterConfig, setMasterConfig] = useState({
    phone: '01345365867',
    pin: '7596',
    recoveryEmail: 'rejwan239@gmail.com',
    devName: 'Mohammad Rejwan Islam',
    devRole: 'Founder & Lead Developer',
    devBio: 'জরুরি মুহূর্তে প্রযুক্তির মাধ্যমে রক্তদাতা ও রোগীর সেতুবন্ধন গড়ার লক্ষ্যে নির্মিত।',
    devContact: '01345365867',
    coinsPerDonation: 100
  });

  // ডেটা কালেকশন
  const [users, setUsers] = useState([]);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [contactRequests, setContactRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [partnerHospitals, setPartnerHospitals] = useState([]);

  // নেভিগেশন ও ভিউ স্টেট — ডিফল্ট ফ্রন্ট পেজ হবে 'request_blood' (মাঝখানের ট্যাব)
  const [activeTab, setActiveTab] = useState('request_blood');
  const [homeSubView, setHomeSubView] = useState(null);
  const [adminSubTab, setAdminSubTab] = useState('radar');
  const [isEditingMyProfile, setIsEditingMyProfile] = useState(false);

  // ইন-অ্যাপ লাইভ নোটিফিকেশন টোস্ট ও পারমিশন ব্যানার
  const [inAppToast, setInAppToast] = useState(null);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // স্টেল ক্লোজার এড়াতে Refs
  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const masterConfigRef = useRef(masterConfig);
  useEffect(() => {
    masterConfigRef.current = masterConfig;
  }, [masterConfig]);

  const usersRef = useRef(users);
  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  const seenReqIdsRef = useRef(new Set());
  const seenMsgIdsRef = useRef(new Set());
  const isInitialReqLoadRef = useRef(true);
  const isInitialMsgLoadRef = useRef(true);
  const lastTriggeredAlarmTsRef = useRef(null);

  // পপ-আপ মডাল
  const [selectedDonorModal, setSelectedDonorModal] = useState(null);
  const [editingDonorModal, setEditingDonorModal] = useState(null);
  const [selectedBankModal, setSelectedBankModal] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [activeAlarmAlert, setActiveAlarmAlert] = useState(null);
  const [trackingRequestModal, setTrackingRequestModal] = useState(null);

  // সার্চ ও ফিল্টার
  const [donorSearch, setDonorSearch] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('ALL');
  const [bankSearch, setBankSearch] = useState('');

  // ফর্ম স্টেট
  const [reqForm, setReqForm] = useState({
    patientName: '',
    bloodGroup: 'O+',
    bags: 1,
    hospital: '',
    contactPhone: '',
    urgency: 'Emergency'
  });
  const [chatReceiver, setChatReceiver] = useState(null);
  const [chatText, setChatText] = useState('');
  const [manualDonorForm, setManualDonorForm] = useState({
    name: '',
    phone: '',
    bloodGroup: 'A+',
    gender: 'Male',
    location: '',
    lastDonationDate: ''
  });
  const [createAccountType, setCreateAccountType] = useState('admin');
  const [newAccForm, setNewAccForm] = useState({
    name: '',
    phone: '',
    bloodGroup: 'O+',
    pin: '',
    address: '',
    location: ''
  });
  const [otpState, setOtpState] = useState({
    step: 'idle',
    generatedCode: '',
    inputCode: '',
    purpose: ''
  });
  const [secForm, setSecForm] = useState({ phone: '', pin: '', recoveryEmail: '' });
  const [devEditForm, setDevEditForm] = useState({ devName: '', devRole: '', devBio: '', devContact: '' });
  const [newAmbForm, setNewAmbForm] = useState({ name: '', area: '', phone: '' });

  // পার্টনার হাসপাতাল ও ডিসকাউন্ট ফর্ম (Admin Panel-এর জন্য)
  const [hospitalForm, setHospitalForm] = useState({
    name: '',
    address: '',
    phone: '',
    discountTitle: '',
    discountPercent: '',
    coinCost: 100
  });
  const [editingHospitalId, setEditingHospitalId] = useState(null);
  const [coinsSettingInput, setCoinsSettingInput] = useState(100);

  const [quizAnswers, setQuizAnswers] = useState({ age18: true, weight50: true, noMed: true, days120: true });
  const [userRating, setUserRating] = useState({ stars: 5, comment: '' });

  const geoWatchRef = useRef(null);
  const alarmIntervalRef = useRef(null);
  const audioCtxRef = useRef(null);

  // ==========================================================================
  // ৬. সার্ভিস ওয়ার্কার, অডিও আনলক ও অবিরাম সাইরেন অ্যালার্ম সিস্টেম
  // ==========================================================================
  const unlockAudioEngine = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      setAudioUnlocked(true);
    } catch (e) {}
  };

  const stopContinuousAlarm = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(0);
    }
  };

  const startContinuousAlarm = () => {
    stopContinuousAlarm();

    const playSirenPulse = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContext();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1400, ctx.currentTime + 0.4);
        osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.8);

        gain.gain.setValueAtTime(1.0, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.85);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.85);

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([600, 200, 600]);
        }
      } catch (e) {}
    };

    playSirenPulse();
    alarmIntervalRef.current = setInterval(playSirenPulse, 1000);
  };

  const enableNotificationsAndAlarm = async () => {
    unlockAudioEngine();
    playSoundEffect('chime', audioCtxRef.current);
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
        if (perm === 'granted' && currentUserRef.current?.id) {
          const token = await requestAndGetFcmToken();
          if (token) {
            await updateDoc(doc(db, 'users', currentUserRef.current.id), { fcmToken: token });
          }
        }
      } catch (e) {}
    }
  };

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });

      // সার্ভিস ওয়ার্কার থেকে ব্যাকগ্রাউন্ড নোটিফিকেশন ক্লিক/মেসেজ রিসিভ করা
      const handleSwMessage = (event) => {
        if (event.data?.type === 'OPEN_ALARM') {
          setActiveAlarmAlert({
            timestamp: Date.now(),
            message: event.data.body || 'জরুরি রক্তের অ্যালার্ম!'
          });
          startContinuousAlarm();
        } else if (event.data?.type === 'OPEN_CHAT' && event.data.senderId) {
          const senderObj = usersRef.current.find((u) => u.id === event.data.senderId);
          if (senderObj) {
            setChatReceiver(senderObj);
            setActiveTab('home');
            const role = currentUserRef.current?.role;
            setHomeSubView(role === 'master_admin' || role === 'admin' ? 'all_donors' : 'available_donors');
          }
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleSwMessage);
    }
  }, []);

  // ইউজার স্ক্রিনে প্রথমবার টাচ/ক্লিক করলেই অডিও ইঞ্জিন আনলক করা
  useEffect(() => {
    window.addEventListener('touchstart', unlockAudioEngine, { passive: true });
    window.addEventListener('click', unlockAudioEngine, { passive: true });
    return () => {
      window.removeEventListener('touchstart', unlockAudioEngine);
      window.removeEventListener('click', unlockAudioEngine);
    };
  }, []);

  // URL প্যারামিটার চেক (অ্যাপ বন্ধ থাকা অবস্থায় নোটিফিকেশনে ক্লিক করে অ্যাপ খুললে)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('alarm') === '1') {
      const msg = params.get('msg') || '🚨 জরুরি রক্তের অ্যালার্ম! এখনই সাড়া দিন।';
      setActiveAlarmAlert({ timestamp: Date.now(), message: msg });
      startContinuousAlarm();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('chatWith') && users.length > 0) {
      const target = users.find((u) => u.id === params.get('chatWith'));
      if (target) {
        setChatReceiver(target);
        setActiveTab('home');
        const role = currentUserRef.current?.role;
        setHomeSubView(role === 'master_admin' || role === 'admin' ? 'all_donors' : 'available_donors');
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [users]);

  // লগইন করা ইউজারের FCM Token Firestore-এ সেভ করা ও ফোরগ্রাউন্ড পুশ লিসেনার
  useEffect(() => {
    if (!currentUser?.id) return;
    requestAndGetFcmToken()
      .then((token) => {
        if (token && token !== currentUser.fcmToken) {
          updateDoc(doc(db, 'users', currentUser.id), { fcmToken: token }).catch(() => {});
        }
      })
      .catch(() => {});

    const unsubFg = listenForegroundPush((payload) => {
      const title = payload.notification?.title || payload.data?.title || '🚨 RedPulse Alert';
      const body = payload.notification?.body || payload.data?.body || '';
      const isAlarm = payload.data?.isAlarm === 'true';
      triggerAlertNotification(title, body, isAlarm, payload.data || {});
    });
    return () => {
      if (typeof unsubFg === 'function') unsubFg();
    };
  }, [currentUser?.id]);

  // ব্যাকগ্রাউন্ড পুশ ট্রিগার হেল্পার (অ্যাপ বন্ধ থাকলেও ফোনে বাজানোর জন্য)
  const sendBackgroundPush = async (rawTokens, title, body, isAlarm = false, extraData = {}) => {
    const validTokens = [...new Set((rawTokens || []).filter((t) => typeof t === 'string' && t.trim().length > 10))];
    if (validTokens.length === 0) return;

    try {
      await fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens: validTokens,
          title,
          body,
          isAlarm,
          data: {
            isAlarm: isAlarm ? 'true' : 'false',
            title,
            body,
            ...extraData
          }
        })
      });
    } catch (e) {}
  };

  const triggerAlertNotification = (title, body, isAlarm = false, extraData = {}) => {
    if (isAlarm) {
      startContinuousAlarm();
    } else {
      playSoundEffect('chime', audioCtxRef.current);
    }

    // ১) ইন-অ্যাপ ভিজ্যুয়াল পপ-আপ ব্যানার
    setInAppToast({ id: Date.now(), title, body, isAlarm, extraData });
    if (!isAlarm) {
      setTimeout(() => {
        setInAppToast((prev) => (prev && Date.now() - prev.id >= 5500 ? null : prev));
      }, 6000);
    }

    // ২) সিস্টেম / সার্ভিস ওয়ার্কার পুশ নোটিফিকেশন
    if ('Notification' in window && Notification.permission === 'granted') {
      const notifOptions = {
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/1060/1060648.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/1060/1060648.png',
        vibrate: isAlarm ? [800, 200, 800, 200, 1000] : [250, 100, 250],
        tag: isAlarm ? 'redpulse-emergency-alarm' : `redpulse-notif-${Date.now()}`,
        renotify: true,
        requireInteraction: isAlarm,
        data: { isAlarm: isAlarm ? 'true' : 'false', ...extraData }
      };

      if (navigator.serviceWorker) {
        navigator.serviceWorker.ready
          .then((reg) => reg.showNotification(title, notifOptions))
          .catch(() => {
            try {
              new Notification(title, notifOptions);
            } catch (e) {}
          });
      } else {
        try {
          new Notification(title, notifOptions);
        } catch (e) {}
      }
    }
  };

  // ==========================================================================
  // ৭. Firebase রিয়েল-টাইম লিসেনারসমূহ (Stale State মুক্ত)
  // ==========================================================================
  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, 'system', 'masterConfig'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setMasterConfig((prev) => ({ ...prev, ...data }));
        setCoinsSettingInput(data.coinsPerDonation || 100);
        setSecForm({
          phone: data.phone || '01345365867',
          pin: data.pin || '7596',
          recoveryEmail: data.recoveryEmail || 'rejwan239@gmail.com'
        });
        setDevEditForm({
          devName: data.devName || 'Mohammad Rejwan Islam',
          devRole: data.devRole || 'Founder & Lead Developer',
          devBio: data.devBio || '',
          devContact: data.devContact || ''
        });
      }
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(list);

      const activeUser = currentUserRef.current;
      if (activeUser) {
        const matchedProfile = list.find(
          (u) => u.id === activeUser.id || (activeUser.phone && u.phone === activeUser.phone)
        );
        if (matchedProfile) {
          // রিমোট ইমার্জেন্সি অ্যালার্ম চেক
          if (
            matchedProfile.activeAlarm &&
            matchedProfile.activeAlarm.timestamp &&
            lastTriggeredAlarmTsRef.current !== matchedProfile.activeAlarm.timestamp
          ) {
            lastTriggeredAlarmTsRef.current = matchedProfile.activeAlarm.timestamp;
            setActiveAlarmAlert(matchedProfile.activeAlarm);
            triggerAlertNotification(
              '🚨 জরুরি রক্তের অ্যালার্ম!',
              matchedProfile.activeAlarm.message || 'অ্যাডমিন আপনার জন্য জরুরি অ্যালার্ম পাঠিয়েছেন!',
              true
            );
          }

          const isMaster =
            matchedProfile.role === 'master_admin' ||
            (matchedProfile.phone && matchedProfile.phone === masterConfigRef.current.phone);

          const syncedUser = {
            ...matchedProfile,
            role: isMaster ? 'master_admin' : matchedProfile.role
          };
          setCurrentUser(syncedUser);
          localStorage.setItem('rp_user', JSON.stringify(syncedUser));
        }
      }
    });

    // নতুন রক্তের রিকোয়েস্ট লিসেনার
    const unsubReqs = onSnapshot(collection(db, 'bloodRequests'), (snap) => {
      const now = Date.now();
      const validReqs = [];
      const activeUser = currentUserRef.current;

      snap.docs.forEach((d) => {
        const data = { id: d.id, ...d.data() };
        const createdMs = data.createdAtMs || now;
        const isExpired = now - createdMs > 24 * 60 * 60 * 1000;
        if (isExpired && data.status === 'pending') {
          updateDoc(doc(db, 'bloodRequests', d.id), { status: 'expired' }).catch(() => {});
        } else if (data.status !== 'expired') {
          validReqs.push(data);
        }

        if (!seenReqIdsRef.current.has(d.id)) {
          seenReqIdsRef.current.add(d.id);
          const isNotMine =
            activeUser &&
            data.requesterId !== activeUser.id &&
            (!activeUser.phone || data.requesterPhone !== activeUser.phone);

          if (!isInitialReqLoadRef.current && isNotMine && data.status === 'pending') {
            const isMatch =
              data.bloodGroup === activeUser.bloodGroup ||
              activeUser.role === 'master_admin' ||
              activeUser.role === 'admin';
            if (isMatch || data.isRareSOS) {
              triggerAlertNotification(
                data.isRareSOS ? `🚨 RARE SOS: ${data.bloodGroup} রক্ত প্রয়োজন!` : `🩸 নতুন রক্তের রিকোয়েস্ট (${data.bloodGroup})`,
                `${data.hospital}-এ ${data.bags} ব্যাগ ${data.bloodGroup} রক্ত প্রয়োজন।`,
                data.isRareSOS
              );
            }
          }
        }
      });
      validReqs.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      setBloodRequests(validReqs);
      isInitialReqLoadRef.current = false;
    });

    // লাইভ চ্যাট মেসেজ লিসেনার (User ID ও Phone উভয় দিয়েই কাজ করবে)
    const unsubMsgs = onSnapshot(collection(db, 'messages'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const activeUser = currentUserRef.current;

      list.forEach((m) => {
        if (!seenMsgIdsRef.current.has(m.id)) {
          seenMsgIdsRef.current.add(m.id);
          const isForMe =
            activeUser &&
            ((m.receiverId && m.receiverId === activeUser.id) ||
              (activeUser.phone && m.receiverPhone === activeUser.phone));

          if (!isInitialMsgLoadRef.current && isForMe) {
            triggerAlertNotification(`💬 নতুন মেসেজ: ${m.senderName}`, m.text, false, {
              type: 'chat',
              senderId: m.senderId || ''
            });
          }
        }
      });
      list.sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));
      setMessages(list);
      isInitialMsgLoadRef.current = false;
    });

    const unsubContacts = onSnapshot(collection(db, 'contactRequests'), (snap) => {
      setContactRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubBanks = onSnapshot(collection(db, 'bloodBanks'), (snap) => {
      setBloodBanks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubAmb = onSnapshot(collection(db, 'ambulances'), (snap) => {
      setAmbulances(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubHospitals = onSnapshot(collection(db, 'partnerHospitals'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
      setPartnerHospitals(list);
    });

    return () => {
      unsubConfig();
      unsubUsers();
      unsubReqs();
      unsubMsgs();
      unsubContacts();
      unsubBanks();
      unsubAmb();
      unsubHospitals();
    };
  }, []);

  // ==========================================================================
  // ৮. ডোনার রিকোয়েস্ট Accept করলেই লাইভ GPS লোকেশন শেয়ারিং চালু
  // ==========================================================================
  useEffect(() => {
    if (!currentUser) return;
    const acceptedReqByMe = bloodRequests.find(
      (r) =>
        r.status === 'accepted' &&
        (r.acceptedById === currentUser.id || (currentUser.phone && r.acceptedByPhone === currentUser.phone))
    );

    if (acceptedReqByMe && 'geolocation' in navigator) {
      if (!geoWatchRef.current) {
        geoWatchRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            updateDoc(doc(db, 'bloodRequests', acceptedReqByMe.id), {
              donorLiveLocation: {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                updatedAt: new Date().toLocaleTimeString()
              }
            }).catch(() => {});
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 5000 }
        );
      }
    } else if (geoWatchRef.current) {
      navigator.geolocation.clearWatch(geoWatchRef.current);
      geoWatchRef.current = null;
    }

    return () => {
      if (geoWatchRef.current) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
        geoWatchRef.current = null;
      }
    };
  }, [bloodRequests, currentUser]);

  // ==========================================================================
  // ৯. থিম ও অথেনটিকেশন হ্যান্ডলার (সাধারণ ইউজার PIN ছাড়া, Admin/Staff PIN সহ)
  // ==========================================================================
  const cycleTheme = () => {
    const keys = Object.keys(THEMES);
    const next = keys[(keys.indexOf(themeKey) + 1) % keys.length];
    setThemeKey(next);
    localStorage.setItem('rp_theme', next);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    unlockAudioEngine();

    // ১) নতুন সাধারণ ইউজার অ্যাকাউন্ট (কোনো PIN ছাড়াই — শুধু Username, Blood Group, Address)
    if (authMode === 'donor_signup') {
      const cleanName = authForm.name.trim();
      const cleanAddress = authForm.location.trim();
      if (!cleanName || !cleanAddress) {
        setAuthError('আপনার নাম (Username) এবং ঠিকানা (Address) লিখুন।');
        return;
      }

      const newUser = {
        name: cleanName,
        bloodGroup: authForm.bloodGroup,
        location: cleanAddress,
        phone: '',
        gender: '',
        pin: '',
        role: 'donor',
        age: '',
        weight: '',
        hemoglobin: '',
        lastDonationDate: '',
        onMedication: false,
        photoURL: '',
        coins: 0,
        pendingClaimCoins: 0,
        claimedVouchers: [],
        donationCount: 0,
        verifiedDonations: 0,
        reviews: [],
        isBanned: false,
        createdAtMs: Date.now()
      };

      const docRef = await addDoc(collection(db, 'users'), newUser);
      const savedUser = { id: docRef.id, ...newUser };
      setCurrentUser(savedUser);
      localStorage.setItem('rp_user', JSON.stringify(savedUser));
      setActiveTab('request_blood');
      enableNotificationsAndAlarm();
      return;
    }

    // ২) আগের সাধারণ ডোনার লগইন (PIN ছাড়াই নাম দিয়ে প্রবেশ)
    if (authMode === 'donor_login') {
      const cleanName = authForm.name.trim().toLowerCase();
      if (!cleanName) {
        setAuthError('আপনার অ্যাকাউন্টের নাম (Username) লিখুন।');
        return;
      }
      const matched = users.find(
        (u) => u.role === 'donor' && u.name?.trim().toLowerCase() === cleanName
      );
      if (!matched) {
        setAuthError('এই নামে কোনো অ্যাকাউন্ট পাওয়া যায়নি। নতুন অ্যাকাউন্ট খুলুন!');
        return;
      }
      if (matched.isBanned) {
        setAuthError('আপনার অ্যাকাউন্টটি অ্যাডমিন কর্তৃক স্থগিত করা হয়েছে।');
        return;
      }
      setCurrentUser(matched);
      localStorage.setItem('rp_user', JSON.stringify(matched));
      setActiveTab('request_blood');
      enableNotificationsAndAlarm();
      return;
    }

    // ৩) Admin / Data Entry / Blood Bank লগইন (অবশ্যই Phone + Secret PIN লাগবে)
    if (authMode === 'staff_login') {
      const cleanPhone = authForm.phone.trim();
      const cleanPin = authForm.pin.trim();
      if (!cleanPhone || !cleanPin) {
        setAuthError('অ্যাডমিন/স্টাফ মোবাইল নম্বর এবং গোপন PIN দিন।');
        return;
      }

      // Master Admin চেক
      if (cleanPhone === masterConfig.phone && cleanPin === masterConfig.pin) {
        let existingMasterProfile = users.find((u) => u.phone === cleanPhone);
        if (!existingMasterProfile) {
          const initialMaster = {
            name: masterConfig.devName || 'Mohammad Rejwan Islam',
            phone: cleanPhone,
            bloodGroup: 'A+',
            gender: 'Male',
            pin: cleanPin,
            role: 'master_admin',
            location: 'Savar, Dhaka',
            photoURL: '',
            coins: 0,
            pendingClaimCoins: 0,
            claimedVouchers: [],
            donationCount: 0,
            verifiedDonations: 0,
            reviews: [],
            isBanned: false,
            createdAtMs: Date.now()
          };
          const docRef = await addDoc(collection(db, 'users'), initialMaster);
          existingMasterProfile = { id: docRef.id, ...initialMaster };
        }
        const masterUser = { ...existingMasterProfile, role: 'master_admin' };
        setCurrentUser(masterUser);
        localStorage.setItem('rp_user', JSON.stringify(masterUser));
        setActiveTab('request_blood');
        enableNotificationsAndAlarm();
        return;
      }

      // Blood Bank লগইন চেক
      const matchedBank = bloodBanks.find((b) => b.phone === cleanPhone && b.pin === cleanPin);
      if (matchedBank) {
        const bankUser = {
          id: matchedBank.id,
          name: matchedBank.name,
          phone: matchedBank.phone,
          bloodGroup: 'BANK',
          role: 'blood_bank',
          bankId: matchedBank.id
        };
        setCurrentUser(bankUser);
        localStorage.setItem('rp_user', JSON.stringify(bankUser));
        setActiveTab('request_blood');
        return;
      }

      // Hired Admin / Data Entry লগইন চেক
      const matchedStaff = users.find(
        (u) =>
          (u.role === 'admin' || u.role === 'data_entry') &&
          u.phone === cleanPhone &&
          u.pin === cleanPin
      );
      if (!matchedStaff) {
        setAuthError('ভুল স্টাফ/অ্যাডমিন মোবাইল নম্বর অথবা ভুল PIN দিয়েছেন!');
        return;
      }
      if (matchedStaff.isBanned) {
        setAuthError('আপনার অ্যাকাউন্টটি স্থগিত করা হয়েছে।');
        return;
      }

      setCurrentUser(matchedStaff);
      localStorage.setItem('rp_user', JSON.stringify(matchedStaff));
      setActiveTab('request_blood');
      enableNotificationsAndAlarm();
    }
  };

  const handleLogout = () => {
    stopContinuousAlarm();
    setCurrentUser(null);
    localStorage.removeItem('rp_user');
    setActiveTab('request_blood');
    setHomeSubView(null);
  };

  // ==========================================================================
  // ১০. রক্তের রিকোয়েস্ট, কয়েন ক্লেইম ও অন্যান্য অ্যাকশন হ্যান্ডলার
  // ==========================================================================
  const handleCreateBloodRequest = async (e) => {
    e.preventDefault();
    if (!reqForm.patientName || !reqForm.hospital) return;

    const isRare = RARE_GROUPS.includes(reqForm.bloodGroup);
    const payload = {
      ...reqForm,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterPhone: currentUser.phone || '',
      isRareSOS: isRare,
      status: 'pending',
      acceptedById: null,
      acceptedByPhone: null,
      acceptedByName: null,
      donorLiveLocation: null,
      createdAtMs: Date.now()
    };

    await addDoc(collection(db, 'bloodRequests'), payload);

    const targetTokens = users
      .filter(
        (u) =>
          u.id !== currentUser.id &&
          (u.bloodGroup === payload.bloodGroup || payload.isRareSOS || u.role === 'master_admin')
      )
      .map((u) => u.fcmToken);

    sendBackgroundPush(
      targetTokens,
      isRare ? `🚨 RARE SOS: ${payload.bloodGroup} রক্ত প্রয়োজন!` : `🩸 নতুন রক্তের রিকোয়েস্ট (${payload.bloodGroup})`,
      `${payload.hospital}-এ ${payload.bags} ব্যাগ ${payload.bloodGroup} রক্ত প্রয়োজন।`,
      isRare
    );

    setShowRequestModal(false);
    setReqForm({ patientName: '', bloodGroup: 'O+', bags: 1, hospital: '', contactPhone: '', urgency: 'Emergency' });
    triggerAlertNotification(
      '✅ রিকোয়েস্ট পাঠানো হয়েছে',
      `${payload.bloodGroup} রক্তের রিকোয়েস্ট সফলভাবে প্রকাশিত হয়েছে।`
    );
  };

  const handleAcceptBloodRequest = async (reqItem) => {
    await updateDoc(doc(db, 'bloodRequests', reqItem.id), {
      status: 'accepted',
      acceptedById: currentUser.id,
      acceptedByPhone: currentUser.phone || '',
      acceptedByName: currentUser.name,
      acceptedAtMs: Date.now()
    });
    triggerAlertNotification(
      '✅ রিকোয়েস্ট গৃহীত হয়েছে!',
      'আপনার লাইভ লোকেশন এখন রোগীর স্বজনের সাথে শেয়ার হচ্ছে।'
    );
  };

  const handleCompleteDonation = async (reqItem) => {
    const donorObj = users.find(
      (u) => u.id === reqItem.acceptedById || (reqItem.acceptedByPhone && u.phone === reqItem.acceptedByPhone)
    );
    const rewardCoins = Number(masterConfig.coinsPerDonation) || 100;

    if (donorObj) {
      const todayStr = new Date().toISOString().split('T')[0];
      await updateDoc(doc(db, 'users', donorObj.id), {
        lastDonationDate: todayStr,
        donationCount: (donorObj.donationCount || 0) + 1,
        verifiedDonations: (donorObj.verifiedDonations || 0) + 1,
        pendingClaimCoins: (donorObj.pendingClaimCoins || 0) + rewardCoins,
        reviews: [
          ...(donorObj.reviews || []),
          {
            from: currentUser.name,
            hospital: reqItem.hospital,
            date: todayStr,
            note: `সফলভাবে রক্তদান সম্পন্ন করেছেন (+${rewardCoins} Reward Coins অর্জিত)!`
          }
        ]
      });

      if (donorObj.fcmToken) {
        sendBackgroundPush(
          [donorObj.fcmToken],
          '🎁 Reward Coins অর্জিত হয়েছে!',
          `অভিনন্দন! রক্তদানের জন্য আপনি ${rewardCoins} RedPulse Coin পেয়েছেন। Home > Claim Reward থেকে ক্লেইম করুন!`,
          false
        );
      }
    }

    await updateDoc(doc(db, 'bloodRequests', reqItem.id), {
      status: 'completed',
      donorLiveLocation: null
    });
    alert(`রক্তদান সম্পন্ন হিসেবে ভেরিফাই করা হয়েছে এবং ডোনারকে ${rewardCoins} কয়েন পাঠানো হয়েছে!`);
  };

  const handleClaimPendingCoins = async () => {
    const pending = Number(currentUser.pendingClaimCoins || 0);
    if (pending <= 0 || !currentUser.id) return;

    const updatedCoins = Number(currentUser.coins || 0) + pending;
    await updateDoc(doc(db, 'users', currentUser.id), {
      coins: updatedCoins,
      pendingClaimCoins: 0
    });
    playSoundEffect('chime', audioCtxRef.current);
    alert(`🎉 অভিনন্দন! ${pending} RedPulse Coin আপনার অ্যাকাউন্টে যোগ হয়েছে!`);
  };

  const handleRedeemHospitalOffer = async (hospital) => {
    const cost = Number(hospital.coinCost || 0);
    const myCoins = Number(currentUser.coins || 0);
    if (myCoins < cost) {
      alert(`দুঃখিত! এই অফারটি নিতে আপনার কমপক্ষে ${cost} কয়েন প্রয়োজন।`);
      return;
    }

    const voucherCode = `RP-${hospital.name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'H')}-${Math.floor(100000 + Math.random() * 900000)}`;
    const newVoucher = {
      id: Date.now().toString(),
      code: voucherCode,
      hospitalName: hospital.name,
      hospitalAddress: hospital.address || '',
      discountTitle: hospital.discountTitle,
      discountPercent: hospital.discountPercent,
      coinsSpent: cost,
      claimedAt: new Date().toLocaleDateString()
    };

    await updateDoc(doc(db, 'users', currentUser.id), {
      coins: myCoins - cost,
      claimedVouchers: [newVoucher, ...(currentUser.claimedVouchers || [])]
    });
    playSoundEffect('chime', audioCtxRef.current);
    alert(`🎟️ ভাউচার তৈরি হয়েছে!\nকোড: ${voucherCode}\nহাসপাতালে এই কোডটি দেখালে ডিসকাউন্ট পাবেন।`);
  };

  const handleRequestPhoneNumber = async (targetDonor) => {
    const already = contactRequests.find(
      (c) => c.requesterId === currentUser.id && c.targetId === targetDonor.id
    );
    if (already) {
      alert(already.status === 'approved' ? 'নম্বর ইতিমধ্যেই অনুমোদিত!' : 'আপনার রিকোয়েস্টটি অ্যাডমিনের অনুমোদনের অপেক্ষায় আছে।');
      return;
    }

    await addDoc(collection(db, 'contactRequests'), {
      requesterId: currentUser.id,
      requesterPhone: currentUser.phone || '',
      requesterName: currentUser.name,
      targetId: targetDonor.id,
      targetPhone: targetDonor.phone || '',
      targetName: targetDonor.name,
      targetBloodGroup: targetDonor.bloodGroup,
      status: 'pending',
      createdAtMs: Date.now()
    });
    alert('ফোন নম্বর দেখার অনুরোধ অ্যাডমিনের কাছে পাঠানো হয়েছে।');
  };

  const isPhoneApproved = (targetDonor) => {
    if (!currentUser || !targetDonor) return false;
    if (currentUser.role === 'master_admin' || currentUser.role === 'admin') return true;
    if (currentUser.id === targetDonor.id) return true;
    return contactRequests.some(
      (c) =>
        (c.requesterId === currentUser.id || (currentUser.phone && c.requesterPhone === currentUser.phone)) &&
        (c.targetId === targetDonor.id || (targetDonor.phone && c.targetPhone === targetDonor.phone)) &&
        c.status === 'approved'
    );
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatText.trim() || !chatReceiver) return;

    const textToSend = chatText.trim();
    setChatText('');

    await addDoc(collection(db, 'messages'), {
      senderId: currentUser.id,
      senderPhone: currentUser.phone || '',
      senderName: currentUser.name,
      receiverId: chatReceiver.id,
      receiverPhone: chatReceiver.phone || '',
      receiverName: chatReceiver.name,
      text: textToSend,
      createdAtMs: Date.now()
    });

    if (chatReceiver.fcmToken) {
      sendBackgroundPush(
        [chatReceiver.fcmToken],
        `💬 নতুন মেসেজ: ${currentUser.name}`,
        textToSend,
        false,
        { type: 'chat', senderId: currentUser.id }
      );
    }
    playSoundEffect('chime', audioCtxRef.current);
  };

  const sendEmailOtp = (purpose) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpState({ step: 'sent', generatedCode: code, inputCode: '', purpose });
    const subject = encodeURIComponent('RedPulse Master Admin Verification Code');
    const body = encodeURIComponent(`আপনার RedPulse Master Admin ভেরিফিকেশন কোড হলো: ${code}`);
    window.open(`mailto:${masterConfig.recoveryEmail}?subject=${subject}&body=${body}`, '_blank');
    alert(`ভেরিফিকেশন কোড (${masterConfig.recoveryEmail}-এ) পাঠানো হয়েছে!\n\n[ভেরিফিকেশন কোড: ${code}]`);
  };

  const handleVerifyAndExecute = async () => {
    if (otpState.inputCode.trim() !== otpState.generatedCode) {
      alert('ভুল ভেরিফিকেশন কোড দিয়েছেন!');
      return;
    }

    if (otpState.purpose === 'create_account') {
      if (createAccountType === 'blood_bank') {
        await addDoc(collection(db, 'bloodBanks'), {
          name: newAccForm.name.trim(),
          address: newAccForm.address.trim(),
          location: newAccForm.location.trim(),
          phone: newAccForm.phone.trim(),
          pin: newAccForm.pin.trim(),
          stock: { 'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'O+': 0, 'O-': 0, 'AB+': 0, 'AB-': 0 },
          updatedAt: new Date().toLocaleString()
        });
        alert('নতুন Blood Bank অ্যাকাউন্ট তৈরি হয়েছে!');
      } else {
        const roleType = createAccountType === 'admin' ? 'admin' : 'data_entry';
        await addDoc(collection(db, 'users'), {
          name: newAccForm.name.trim(),
          phone: newAccForm.phone.trim(),
          bloodGroup: newAccForm.bloodGroup || 'O+',
          gender: 'Male',
          pin: newAccForm.pin.trim(),
          role: roleType,
          location: newAccForm.location || '',
          photoURL: '',
          coins: 0,
          pendingClaimCoins: 0,
          claimedVouchers: [],
          donationCount: 0,
          verifiedDonations: 0,
          reviews: [],
          isBanned: false,
          createdAtMs: Date.now()
        });
        alert(`নতুন ${roleType === 'admin' ? 'Admin' : 'Data Entry Operator'} অ্যাকাউন্ট তৈরি হয়েছে!`);
      }
      setNewAccForm({ name: '', phone: '', bloodGroup: 'O+', pin: '', address: '', location: '' });
    } else if (otpState.purpose === 'update_master') {
      await setDoc(
        doc(db, 'system', 'masterConfig'),
        {
          ...masterConfig,
          phone: secForm.phone.trim(),
          pin: secForm.pin.trim(),
          recoveryEmail: secForm.recoveryEmail.trim()
        },
        { merge: true }
      );
      alert('Master Admin মোবাইল নম্বর ও গোপন PIN আপডেট হয়েছে!');
    }

    setOtpState({ step: 'idle', generatedCode: '', inputCode: '', purpose: '' });
  };

  // ==========================================================================
  // ১১. লগইন / সাইন-আপ স্ক্রিন (সাধারণ ইউজার PIN ছাড়া, Admin/Staff PIN সহ)
  // ==========================================================================
  if (!currentUser) {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.textMain} relative flex flex-col justify-center items-center p-5 transition-colors duration-500`}>
        <BloodDropWatermark color={theme.watermark} />

        <button
          onClick={cycleTheme}
          className={`fixed top-5 right-5 z-20 p-3 rounded-2xl border ${theme.card} flex items-center gap-2 text-xs font-bold`}
        >
          <Palette className={`w-4 h-4 ${theme.accentText}`} />
          <span>{theme.name}</span>
        </button>

        <div className={`w-full max-w-md rounded-3xl border p-7 backdrop-blur-md z-10 ${theme.card}`}>
          <div className="flex flex-col items-center text-center mb-6">
            <div className={`w-16 h-16 rounded-2xl ${theme.btn3d} flex items-center justify-center mb-3`}>
              <Droplet className="w-9 h-9 fill-current" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">RedPulse</h1>
            <p className={`text-xs mt-1 ${theme.textSub}`}>জরুরি রক্তদাতা ও ব্লাড ব্যাংক নেটওয়ার্ক</p>
          </div>

          {/* ৩টি লগইন/সাইন-আপ মোড সুইচার */}
          <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 mb-5">
            <button
              type="button"
              onClick={() => { setAuthMode('donor_signup'); setAuthError(''); }}
              className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all ${
                authMode === 'donor_signup' ? theme.btn3d : theme.textSub
              }`}
            >
              নতুন অ্যাকাউন্ট
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('donor_login'); setAuthError(''); }}
              className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all ${
                authMode === 'donor_login' ? theme.btn3d : theme.textSub
              }`}
            >
              ডোনার প্রবেশ
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('staff_login'); setAuthError(''); }}
              className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all ${
                authMode === 'staff_login' ? theme.btn3d : theme.textSub
              }`}
            >
              Admin / Staff
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 text-xs font-semibold text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {/* ১) নতুন সাধারণ ডোনার অ্যাকাউন্ট — কোনো PIN ছাড়াই */}
            {authMode === 'donor_signup' && (
              <>
                <div>
                  <label className="block text-xs font-bold mb-1">আপনার নাম (Username)</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: Mohammad Rejwan Islam"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300/80 bg-white/80 text-slate-900 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">রক্তের গ্রুপ</label>
                  <div className="grid grid-cols-4 gap-2">
                    {BLOOD_GROUPS.map((bg) => (
                      <button
                        type="button"
                        key={bg}
                        onClick={() => setAuthForm({ ...authForm, bloodGroup: bg })}
                        className={`py-2 rounded-xl text-xs font-black border transition-all ${
                          authForm.bloodGroup === bg ? theme.btn3d : 'bg-white/70 text-slate-700 border-slate-300'
                        }`}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">ঠিকানা (Address / এলাকা)</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: সাভার, ঢাকা"
                    value={authForm.location}
                    onChange={(e) => setAuthForm({ ...authForm, location: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300/80 bg-white/80 text-slate-900 text-sm focus:outline-none"
                  />
                </div>

                <p className="text-[11px] text-center opacity-75">
                  ✨ কোনো PIN মনে রাখার ঝামেলা নেই — সরাসরি প্রবেশ করুন!
                </p>
              </>
            )}

            {/* ২) পুরনো সাধারণ ডোনার লগইন — PIN ছাড়া */}
            {authMode === 'donor_login' && (
              <div>
                <label className="block text-xs font-bold mb-1">আপনার অ্যাকাউন্টের নাম (Username)</label>
                <input
                  type="text"
                  required
                  placeholder="আগে যে নামে অ্যাকাউন্ট খুলেছিলেন"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300/80 bg-white/80 text-slate-900 text-sm focus:outline-none"
                />
              </div>
            )}

            {/* ৩) Admin / Staff / Blood Bank লগইন — অবশ্যই PIN লাগবে */}
            {authMode === 'staff_login' && (
              <>
                <div>
                  <label className="block text-xs font-bold mb-1">Admin / Staff মোবাইল নম্বর</label>
                  <input
                    type="tel"
                    required
                    placeholder="01XXXXXXXXX"
                    value={authForm.phone}
                    onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300/80 bg-white/80 text-slate-900 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">গোপন PIN (আবশ্যক)</label>
                  <input
                    type="password"
                    required
                    maxLength={8}
                    placeholder="••••"
                    value={authForm.pin}
                    onChange={(e) => setAuthForm({ ...authForm, pin: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300/80 bg-white/80 text-slate-900 text-sm focus:outline-none"
                  />
                </div>
              </>
            )}

            <button type="submit" className={`w-full py-3.5 rounded-2xl font-black text-sm tracking-wide transition-all ${theme.btn3d}`}>
              {authMode === 'donor_signup'
                ? 'PIN ছাড়াই অ্যাকাউন্ট তৈরি করুন'
                : authMode === 'donor_login'
                ? 'প্রবেশ করুন'
                : 'Admin / Staff লগইন'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // ১২. লগইন করা অবস্থায় ফিল্টার ও রোল লজিক
  // ==========================================================================
  const isMasterAdmin = currentUser.role === 'master_admin';
  const isHiredAdmin = currentUser.role === 'admin';
  const isDataEntry = currentUser.role === 'data_entry';
  const isBloodBank = currentUser.role === 'blood_bank';

  const activeDonorsList = users.filter((u) => !u.isBanned);
  const availableDonorsList = activeDonorsList.filter((u) => calculateDonorReadiness(u).isReady);
  const topHeroesList = [...activeDonorsList]
    .filter((u) => (u.verifiedDonations || u.donationCount || 0) > 0)
    .sort((a, b) => (b.verifiedDonations || b.donationCount || 0) - (a.verifiedDonations || a.donationCount || 0));

  const myActiveRequests = bloodRequests.filter(
    (r) =>
      r.status !== 'completed' &&
      (r.requesterId === currentUser.id ||
        (currentUser.phone && r.requesterPhone === currentUser.phone) ||
        r.acceptedById === currentUser.id ||
        (currentUser.phone && r.acceptedByPhone === currentUser.phone) ||
        (r.status === 'pending' && r.bloodGroup === currentUser.bloodGroup))
  );

  const pendingContactReqs = contactRequests.filter((c) => c.status === 'pending');

  // বটম নেভিগেশন বারে সবার জন্যই শুধু ৩টি ট্যাব: বামে Home | মাঝখানে Request Blood | ডানে Profile
  const bottomNavTabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'request_blood', label: 'Request Blood', icon: Droplet, isCenter: true },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  // ==========================================================================
  // ১৩. মেইন অ্যাপ ইন্টারফেস রেন্ডার
  // ==========================================================================
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.textMain} pb-28 relative transition-colors duration-500 overflow-x-hidden flex flex-col`}>
      <BloodDropWatermark color={theme.watermark} />

      <style>{`
        @keyframes instantMarquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-instant-marquee {
          display: flex;
          width: max-content;
          animation: instantMarquee 24s linear infinite;
        }
      `}</style>

      {/* ইন-অ্যাপ লাইভ নোটিফিকেশন টোস্ট ব্যানার */}
      {inAppToast && (
        <div
          onClick={() => {
            stopContinuousAlarm();
            if (inAppToast.extraData?.type === 'chat' && inAppToast.extraData?.senderId) {
              const senderObj = users.find((u) => u.id === inAppToast.extraData.senderId);
              if (senderObj) {
                setChatReceiver(senderObj);
                setActiveTab('home');
                setHomeSubView(isMasterAdmin || isHiredAdmin ? 'all_donors' : 'available_donors');
              }
            }
            setInAppToast(null);
          }}
          className={`fixed top-16 left-3 right-3 max-w-md mx-auto z-50 p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between gap-3 animate-bounce ${
            inAppToast.isAlarm ? 'bg-rose-600 text-white border-rose-400 shadow-2xl' : `${theme.card}`
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-xs font-black">{inAppToast.title}</p>
              <p className="text-[11px] opacity-90">{inAppToast.body}</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              stopContinuousAlarm();
              setInAppToast(null);
            }}
            className="p-1 rounded-lg bg-black/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* টপ হেডার বার (বামে Profile | ডানে Special Role Button + Theme + Bell) */}
      {/* ==================================================================== */}
      <header className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 py-3 ${theme.navBg}`}>
        <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
          {/* বাম পাশে প্রোফাইল পিকচার, আসল নাম ও ব্লাড গ্রুপ */}
          <div
            onClick={() => {
              setActiveTab('profile');
              setHomeSubView(null);
              setIsEditingMyProfile(false);
            }}
            className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform min-w-0"
          >
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-rose-500 shadow-md shrink-0"
              />
            ) : (
              <div className={`w-10 h-10 rounded-full ${theme.btn3d} flex items-center justify-center font-black text-base shrink-0`}>
                {currentUser.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="truncate">
              <h2 className="font-extrabold text-sm leading-tight truncate">{currentUser.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${theme.badge}`}>
                  <img
  src="/logo.svg?v=5"
  alt="RedPulse"
  className="w-10 h-10 rounded-xl shadow-md object-contain"
/>
                  {currentUser.bloodGroup}
                </span>
                {!isBloodBank && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 border border-amber-500/30">
                    <Coins className="w-2.5 h-2.5" /> {currentUser.coins || 0}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ডান পাশে: সবার আগে স্পেশাল রোল বাটন (Admin / Data Entry / Bank Portal), তারপর Theme, তারপর Bell */}
          <div className="flex items-center gap-1.5 shrink-0">
            {(isMasterAdmin || isHiredAdmin) && (
              <button
                onClick={() => {
                  setActiveTab('admin');
                  setHomeSubView(null);
                }}
                className={`px-2.5 py-2 rounded-2xl border text-[11px] font-black flex items-center gap-1 transition-all ${
                  activeTab === 'admin' ? theme.btn3d : `${theme.card} ${theme.accentText}`
                }`}
                title="Admin Panel"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {isDataEntry && (
              <button
                onClick={() => {
                  setActiveTab('data_entry');
                  setHomeSubView(null);
                }}
                className={`px-2.5 py-2 rounded-2xl border text-[11px] font-black flex items-center gap-1 transition-all ${
                  activeTab === 'data_entry' ? theme.btn3d : `${theme.card} ${theme.accentText}`
                }`}
                title="Data Entry"
              >
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Entry</span>
              </button>
            )}

            {isBloodBank && (
              <button
                onClick={() => {
                  setActiveTab('bank_portal');
                  setHomeSubView(null);
                }}
                className={`px-2.5 py-2 rounded-2xl border text-[11px] font-black flex items-center gap-1 transition-all ${
                  activeTab === 'bank_portal' ? theme.btn3d : `${theme.card} ${theme.accentText}`
                }`}
                title="Bank Portal"
              >
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">Bank</span>
              </button>
            )}

            <button
              onClick={cycleTheme}
              className={`p-2.5 rounded-2xl border ${theme.card} active:scale-95 transition-transform`}
              title="Change Theme"
            >
              <Palette className={`w-4 h-4 ${theme.accentText}`} />
            </button>

            <button
              onClick={() => setShowNotifDrawer(true)}
              className={`relative p-2.5 rounded-2xl border ${theme.card} active:scale-95 transition-transform`}
              title="Notifications"
            >
              <Bell className={`w-4 h-4 ${theme.accentText}`} />
              {myActiveRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {myActiveRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* নোটিফিকেশন ও অ্যালার্ম সাউন্ড পারমিশন ব্যানার (যদি অফ থাকে) */}
      {(notifPermission !== 'granted' || !audioUnlocked) && (
        <div className="max-w-xl w-full mx-auto px-4 pt-3 z-20">
          <button
            onClick={enableNotificationsAndAlarm}
            className="w-full py-2.5 px-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs font-black flex items-center justify-center gap-2 shadow-sm"
          >
            <BellRing className="w-4 h-4 animate-bounce" />
            <span>জরুরি অ্যালার্ম ও চ্যাট নোটিফিকেশন চালু করতে এখানে ট্যাপ করুন</span>
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* মেইন কনটেন্ট এরিয়া */}
      {/* ==================================================================== */}
      <main className="max-w-xl w-full mx-auto px-4 pt-4 relative z-10 flex-1 flex flex-col">
        {/* ================================================================== */}
        {/* মাঝখানের ট্যাব (ডিফল্ট ফ্রন্ট পেজ): REQUEST BLOOD TAB */}
        {/* ================================================================== */}
        {activeTab === 'request_blood' && (
          <div className="flex-1 flex flex-col justify-between min-h-[calc(100vh-195px)]">
            {/* ১. ইনস্ট্যান্ট স্ক্রলিং ব্যানার (ফ্রন্ট পেজেই থাকবে) */}
            <div className={`overflow-hidden rounded-2xl border py-2.5 ${theme.card}`}>
              <div className="animate-instant-marquee text-xs font-bold tracking-wide">
                <span className="mx-4">
                  🩸 নিয়মিত রক্তদান হৃদরোগের ঝুঁকি কমায় • শরীরে নতুন রক্তকণিকা তৈরিতে সাহায্য করে • প্রতি ৪ মাস (১২০ দিন) পরপর সুস্থ ব্যক্তি রক্তদান করতে পারেন • রক্তদান করে জিতে নিন RedPulse Coin ও হাসপাতালে বিশেষ ডিসকাউন্ট!
                </span>
                <span className="mx-4">
                  🩸 নিয়মিত রক্তদান হৃদরোগের ঝুঁকি কমায় • শরীরে নতুন রক্তকণিকা তৈরিতে সাহায্য করে • প্রতি ৪ মাস (১২০ দিন) পরপর সুস্থ ব্যক্তি রক্তদান করতে পারেন • রক্তদান করে জিতে নিন RedPulse Coin ও হাসপাতালে বিশেষ ডিসকাউন্ট!
                </span>
              </div>
            </div>

            {/* ২. স্ক্রিনের ঠিক মাঝখানে বড় 3D প্রিমিয়াম Request Blood বাটন */}
            <div className="my-auto py-8 flex flex-col items-center justify-center">
              <button
                onClick={() => setShowRequestModal(true)}
                className={`w-64 py-5 px-6 rounded-3xl font-black text-lg tracking-wide flex items-center justify-center gap-3 transition-all ${theme.btn3d}`}
              >
                <Heart className="w-7 h-7 fill-current animate-pulse" />
                <span>Request Blood</span>
              </button>
              <p className={`text-[11px] mt-3 font-medium ${theme.textSub}`}>
                জরুরি রক্তের প্রয়োজনে উপরের বাটনে চাপ দিন
              </p>

              {/* পেন্ডিং কয়েন ক্লেইম শর্টকাট অ্যালার্ট */}
              {Number(currentUser.pendingClaimCoins || 0) > 0 && (
                <button
                  onClick={() => {
                    setActiveTab('home');
                    setHomeSubView('claim_reward');
                  }}
                  className="mt-5 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-black flex items-center gap-2 shadow-lg animate-bounce"
                >
                  <Gift className="w-4 h-4" />
                  <span>আপনার {currentUser.pendingClaimCoins} Reward Coin ক্লেইম করুন!</span>
                </button>
              )}
            </div>

            {/* ৩. কন্ডিশনাল রিকোয়েস্ট কার্ড */}
            {myActiveRequests.length > 0 && (
              <div className="space-y-3 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider opacity-75 px-1">
                  Active Blood Requests ({myActiveRequests.length})
                </h3>
                {myActiveRequests.map((req) => {
                  const isMine =
                    req.requesterId === currentUser.id ||
                    (currentUser.phone && req.requesterPhone === currentUser.phone);
                  return (
                    <div key={req.id} className={`rounded-3xl border p-4 backdrop-blur-md ${theme.card}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-black border ${theme.badge}`}>
                          {isMine ? '📤 Sending Request' : '📥 Received Request'} • {req.bloodGroup}
                        </span>
                        {req.isRareSOS && (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black animate-pulse">
                            RARE SOS
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm">
                        {req.patientName} ({req.bags} ব্যাগ)
                      </h4>
                      <p className={`text-xs flex items-center gap-1 mt-1 ${theme.textSub}`}>
                        <MapPin className="w-3.5 h-3.5" /> {req.hospital}
                      </p>

                      <div className="mt-3 pt-3 border-t border-slate-200/50 flex flex-wrap items-center justify-between gap-2">
                        {req.status === 'pending' && !isMine && (
                          <button
                            onClick={() => handleAcceptBloodRequest(req)}
                            className={`px-4 py-2 rounded-xl text-xs font-black ${theme.btn3d}`}
                          >
                            Accept & Share Live Location
                          </button>
                        )}

                        {req.status === 'accepted' && (
                          <div className="flex flex-wrap items-center gap-2 w-full justify-between">
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> গৃহীত: {req.acceptedByName}
                            </span>

                            <div className="flex items-center gap-2">
                              {req.donorLiveLocation && (
                                <button
                                  onClick={() => setTrackingRequestModal(req)}
                                  className="px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold flex items-center gap-1 shadow-md"
                                >
                                  <Navigation className="w-3.5 h-3.5" /> Track Live Location
                                </button>
                              )}

                              {isMine && (
                                <button
                                  onClick={() => handleCompleteDonation(req)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md"
                                >
                                  ✓ Complete & Verify
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {req.status === 'pending' && isMine && (
                          <span className="text-xs font-semibold text-amber-600">
                            ⏳ ডোনারের সাড়ার জন্য অপেক্ষা করা হচ্ছে...
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================== */}
        {/* বামের ট্যাব: HOME TAB (আগের RedPulse Hub-এর সব মেনু + Claim Reward) */}
        {/* ================================================================== */}
        {activeTab === 'home' && (
          <div className="flex-1 flex flex-col">
            {!homeSubView ? (
              <div className="space-y-4">
                <div className="px-1 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black">RedPulse Home Hub</h2>
                    <p className={`text-xs ${theme.textSub}`}>প্রয়োজনীয় সেবা ও রিওয়ার্ড নির্বাচন করুন</p>
                  </div>
                  {Number(currentUser.pendingClaimCoins || 0) > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 text-[10px] font-black animate-pulse">
                      +{currentUser.pendingClaimCoins} Coin Ready!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  {[
                    {
                      id: 'claim_reward',
                      title: 'Claim Reward',
                      sub: `${currentUser.coins || 0} Coins • হাসপাতাল ছাড়`,
                      icon: Gift,
                      highlight: Number(currentUser.pendingClaimCoins || 0) > 0
                    },
                    { id: 'all_donors', title: 'Donor List (All)', sub: `${activeDonorsList.length} জন ডোনার`, icon: Users },
                    { id: 'available_donors', title: 'Available Donor', sub: `${availableDonorsList.length} জন প্রস্তুত`, icon: UserCheck },
                    { id: 'top_heroes', title: 'Top Heroes', sub: 'সেরা রক্তদাতা তালিকা', icon: Award },
                    { id: 'blood_banks', title: 'Blood Bank Stock', sub: 'লাইভ রক্তের মজুদ', icon: Building2 },
                    { id: 'certificate', title: 'Hero Certificate', sub: 'ডিজিটাল সম্মাননা কার্ড', icon: FileBadge },
                    { id: 'ambulance', title: 'Ambulance & Help', sub: 'জরুরি অ্যাম্বুলেন্স সেবা', icon: Ambulance },
                    { id: 'quiz', title: 'Physical Test', sub: 'রক্তদানের যোগ্যতা যাচাই', icon: Stethoscope },
                    { id: 'rate', title: 'Rate Us', sub: 'অ্যাপ সম্পর্কে মতামত', icon: Star },
                    { id: 'about', title: 'About Us', sub: 'অ্যাপ ও ডেভেলপার তথ্য', icon: Info }
                  ].map((item) => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setHomeSubView(item.id)}
                        className={`p-4 rounded-3xl border text-left transition-all active:translate-y-1 flex flex-col justify-between min-h-[118px] relative ${theme.card} ${
                          item.highlight ? 'ring-2 ring-emerald-500' : ''
                        }`}
                      >
                        {item.highlight && (
                          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black">
                            CLAIM!
                          </span>
                        )}
                        <div className={`w-11 h-11 rounded-2xl ${theme.btn3d} flex items-center justify-center mb-3`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm leading-snug">{item.title}</h3>
                          <p className={`text-[11px] mt-0.5 ${theme.textSub}`}>{item.sub}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-4">
                <button
                  onClick={() => {
                    setHomeSubView(null);
                    setChatReceiver(null);
                  }}
                  className={`self-start px-4 py-2 rounded-2xl border text-xs font-extrabold flex items-center gap-1.5 ${theme.card}`}
                >
                  ← Home মেনুতে ফিরে যান
                </button>

                {/* ========================================================== */}
                {/* নতুন সাব-ভিউ: CLAIM REWARD & PARTNER HOSPITAL DISCOUNTS */}
                {/* ========================================================== */}
                {homeSubView === 'claim_reward' && (
                  <div className="space-y-4">
                    {/* কয়েন ব্যালেন্স ও ক্লেইম কার্ড */}
                    <div className={`p-5 rounded-3xl border space-y-4 ${theme.card}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-bold uppercase opacity-65">আপনার বর্তমান ব্যালেন্স</p>
                          <h2 className="text-2xl font-black flex items-center gap-2 mt-0.5 text-amber-500">
                            <Coins className="w-7 h-7" /> {currentUser.coins || 0} Coins
                          </h2>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-black border ${theme.badge}`}>
                            প্রতি রক্তদানে +{masterConfig.coinsPerDonation || 100} Coins
                          </span>
                        </div>
                      </div>

                      {Number(currentUser.pendingClaimCoins || 0) > 0 ? (
                        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-black text-emerald-600">
                              🎁 {currentUser.pendingClaimCoins} Coin ক্লেইম করার জন্য প্রস্তুত!
                            </p>
                            <p className="text-[11px] opacity-80">সফল রক্তদানের পুরস্কার সংগ্রহ করুন</p>
                          </div>
                          <button
                            onClick={handleClaimPendingCoins}
                            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-md shrink-0"
                          >
                            Claim Now
                          </button>
                        </div>
                      ) : (
                        <p className={`text-xs ${theme.textSub}`}>
                          রক্তদান সম্পন্ন করে ভেরিফাই হলে এখানে কয়েন ক্লেইম করার অপশন পাবেন এবং নিচের পার্টনার হাসপাতালগুলোতে ডিসকাউন্ট নিতে পারবেন।
                        </p>
                      )}
                    </div>

                    {/* পার্টনার হাসপাতাল ও ডিসকাউন্ট অফার তালিকা */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-black px-1 flex items-center gap-1.5">
                        <Hospital className={`w-4 h-4 ${theme.accentText}`} /> পার্টনার হাসপাতাল ও ডিসকাউন্ট অফার
                      </h3>

                      {partnerHospitals.length === 0 ? (
                        <div className={`p-5 rounded-3xl border text-center text-xs ${theme.card} ${theme.textSub}`}>
                          শীঘ্রই পার্টনার হাসপাতাল ও ডিসকাউন্ট অফার যুক্ত করা হবে।
                        </div>
                      ) : (
                        partnerHospitals.map((hosp) => {
                          const canAfford = Number(currentUser.coins || 0) >= Number(hosp.coinCost || 0);
                          return (
                            <div key={hosp.id} className={`p-4 rounded-3xl border space-y-3 ${theme.card}`}>
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-black text-sm">{hosp.name}</h4>
                                  <p className={`text-[11px] ${theme.textSub}`}>{hosp.address}</p>
                                  {hosp.phone && <p className="text-[11px] font-bold mt-0.5">📞 {hosp.phone}</p>}
                                </div>
                                <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 text-xs font-black shrink-0">
                                  {hosp.discountPercent}
                                </span>
                              </div>

                              <div className="p-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70 text-xs font-bold">
                                🎯 অফার: {hosp.discountTitle}
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <span className="text-xs font-black text-amber-600 flex items-center gap-1">
                                  <Coins className="w-4 h-4" /> প্রয়োজন: {hosp.coinCost} Coins
                                </span>
                                <button
                                  onClick={() => handleRedeemHospitalOffer(hosp)}
                                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                    canAfford ? theme.btn3d : 'bg-slate-300 text-slate-600 cursor-not-allowed'
                                  }`}
                                >
                                  Redeem Discount
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* ইউজারের সংগৃহীত ডিসকাউন্ট ভাউচারসমূহ */}
                    {currentUser.claimedVouchers && currentUser.claimedVouchers.length > 0 && (
                      <div className="space-y-2.5 pt-2">
                        <h3 className="text-sm font-black px-1 flex items-center gap-1.5">
                          <Ticket className={`w-4 h-4 ${theme.accentText}`} /> আপনার সংগৃহীত ডিসকাউন্ট ভাউচার
                        </h3>
                        {currentUser.claimedVouchers.map((v) => (
                          <div key={v.id} className={`p-4 rounded-2xl border border-dashed border-emerald-500 space-y-1 ${theme.card}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-black text-sm text-emerald-600">{v.hospitalName}</span>
                              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white text-xs font-black tracking-wider">
                                {v.code}
                              </span>
                            </div>
                            <p className="text-xs font-bold">
                              {v.discountTitle} ({v.discountPercent})
                            </p>
                            <p className="text-[10px] opacity-65">
                              তারিখ: {v.claimedAt} • খরচ: {v.coinsSpent} Coins (হাসপাতালে কোডটি দেখান)
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* সাব-ভিউ: DONOR LIST (ALL) ও AVAILABLE DONOR */}
                {(homeSubView === 'all_donors' || homeSubView === 'available_donors') && (
                  <div className="space-y-4">
                    <h2 className="text-base font-black">
                      {homeSubView === 'all_donors' ? 'Donor List (All)' : 'Available Donors (Ready)'}
                    </h2>

                    <div className="space-y-2.5">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="নাম বা এলাকা দিয়ে খুঁজুন..."
                          value={donorSearch}
                          onChange={(e) => setDonorSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-300/80 bg-white/90 text-slate-900 text-xs focus:outline-none"
                        />
                      </div>

                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {['ALL', ...BLOOD_GROUPS].map((bg) => (
                          <button
                            key={bg}
                            onClick={() => setBloodGroupFilter(bg)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 border ${
                              bloodGroupFilter === bg ? theme.btn3d : 'bg-white/80 text-slate-700 border-slate-200'
                            }`}
                          >
                            {bg}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {(homeSubView === 'all_donors' ? activeDonorsList : availableDonorsList)
                        .filter((d) => {
                          const matchGroup = bloodGroupFilter === 'ALL' || d.bloodGroup === bloodGroupFilter;
                          const matchText =
                            d.name?.toLowerCase().includes(donorSearch.toLowerCase()) ||
                            d.location?.toLowerCase().includes(donorSearch.toLowerCase());
                          return matchGroup && matchText;
                        })
                        .map((donor) => (
                          <div
                            key={donor.id}
                            onClick={() => setSelectedDonorModal(donor)}
                            className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer active:translate-y-0.5 transition-all ${theme.card}`}
                          >
                            <div className="flex items-center gap-3">
                              {donor.photoURL ? (
                                <img
                                  src={donor.photoURL}
                                  alt={donor.name}
                                  className="w-10 h-10 rounded-full object-cover border border-rose-400"
                                />
                              ) : (
                                <div className={`w-10 h-10 rounded-full ${theme.btn3d} flex items-center justify-center font-black text-sm`}>
                                  {donor.name?.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-sm">{donor.name}</span>
                                  {(donor.verifiedDonations || 0) > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 text-[10px] font-black">
                                      ✓ Verified
                                    </span>
                                  )}
                                </div>
                                <p className={`text-[11px] ${theme.textSub}`}>{donor.location || 'এলাকা উল্লেখ নেই'}</p>
                              </div>
                            </div>

                            <span className={`px-3 py-1 rounded-xl text-xs font-black border ${theme.badge}`}>
                              {donor.bloodGroup}
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* রোল-ভিত্তিক লাইভ চ্যাট */}
                    {((homeSubView === 'available_donors' && !isMasterAdmin && !isHiredAdmin) ||
                      (homeSubView === 'all_donors' && (isMasterAdmin || isHiredAdmin))) && (
                      <div className={`mt-5 rounded-3xl border p-4 ${theme.card}`}>
                        <h3 className="text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Send className={`w-4 h-4 ${theme.accentText}`} /> Direct Live Chat
                        </h3>

                        {!chatReceiver ? (
                          <p className={`text-xs ${theme.textSub}`}>
                            চ্যাট শুরু করতে উপরের তালিকা থেকে যেকোনো ডোনারের নামে ক্লিক করে <strong>"Live Chat"</strong> বাটনে চাপ দিন।
                          </p>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                              <span className="text-xs font-extrabold">
                                চ্যাট চলছে: <span className={theme.accentText}>{chatReceiver.name}</span>
                              </span>
                              <button onClick={() => setChatReceiver(null)} className="text-xs text-rose-500 font-bold">
                                বন্ধ করুন
                              </button>
                            </div>

                            <div className="h-48 overflow-y-auto space-y-2 p-2 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50">
                              {messages
                                .filter((m) => {
                                  const sentByMeToTarget =
                                    (m.senderId === currentUser.id || (currentUser.phone && m.senderPhone === currentUser.phone)) &&
                                    (m.receiverId === chatReceiver.id || (chatReceiver.phone && m.receiverPhone === chatReceiver.phone));
                                  const sentByTargetToMe =
                                    (m.senderId === chatReceiver.id || (chatReceiver.phone && m.senderPhone === chatReceiver.phone)) &&
                                    (m.receiverId === currentUser.id || (currentUser.phone && m.receiverPhone === currentUser.phone));
                                  return sentByMeToTarget || sentByTargetToMe;
                                })
                                .map((m) => {
                                  const isMe =
                                    m.senderId === currentUser.id || (currentUser.phone && m.senderPhone === currentUser.phone);
                                  return (
                                    <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                      <span className="text-[10px] opacity-60 mb-0.5">
                                        {m.senderName} ➔ {m.receiverName}
                                      </span>
                                      <div
                                        className={`px-3 py-2 rounded-2xl text-xs max-w-[80%] ${
                                          isMe ? theme.btn3d : 'bg-white text-slate-800 border border-slate-200'
                                        }`}
                                      >
                                        {m.text}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>

                            <form onSubmit={handleSendMessage} className="flex gap-2">
                              <input
                                type="text"
                                placeholder="মেসেজ লিখুন..."
                                value={chatText}
                                onChange={(e) => setChatText(e.target.value)}
                                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                              />
                              <button type="submit" className={`px-4 py-2.5 rounded-xl text-xs font-black ${theme.btn3d}`}>
                                পাঠান
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* সাব-ভিউ: TOP HEROES */}
                {homeSubView === 'top_heroes' && (
                  <div className="space-y-3">
                    <h2 className="text-base font-black">🏆 Top Blood Heroes</h2>
                    {topHeroesList.length === 0 ? (
                      <p className={`text-xs ${theme.textSub}`}>এখনো কোনো ভেরিফায়েড রক্তদানের রেকর্ড যুক্ত হয়নি।</p>
                    ) : (
                      topHeroesList.map((hero, idx) => (
                        <div
                          key={hero.id}
                          onClick={() => setSelectedDonorModal(hero)}
                          className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer ${theme.card}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-xl ${theme.btn3d} flex items-center justify-center font-black text-xs`}>
                              #{idx + 1}
                            </span>
                            <div>
                              <h4 className="font-bold text-sm">{hero.name}</h4>
                              <span className="text-[11px] text-emerald-600 font-bold">
                                ✓ {hero.verifiedDonations || hero.donationCount} বার রক্তদান
                              </span>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-xl text-xs font-black border ${theme.badge}`}>
                            {hero.bloodGroup}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* সাব-ভিউ: BLOOD BANK STOCK */}
                {homeSubView === 'blood_banks' && (
                  <div className="space-y-4">
                    <h2 className="text-base font-black">🏥 Blood Bank Live Stock</h2>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="ব্লাড ব্যাংকের নাম, এলাকা বা রক্তের গ্রুপ (যেমন O-) লিখুন..."
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2.5">
                      {bloodBanks
                        .filter((b) => {
                          const q = bankSearch.trim().toLowerCase();
                          if (!q) return true;
                          const matchName = b.name?.toLowerCase().includes(q) || b.location?.toLowerCase().includes(q);
                          const upperQ = bankSearch.trim().toUpperCase();
                          const matchStock = BLOOD_GROUPS.includes(upperQ) && (b.stock?.[upperQ] || 0) > 0;
                          return matchName || matchStock;
                        })
                        .map((bank) => (
                          <div
                            key={bank.id}
                            onClick={() => setSelectedBankModal(bank)}
                            className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer active:translate-y-0.5 transition-all ${theme.card}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl ${theme.btn3d} flex items-center justify-center`}>
                                <Building2 className="w-5 h-5" />
                              </div>
                              <span className="font-extrabold text-sm">{bank.name}</span>
                            </div>
                            <ChevronRight className="w-5 h-5 opacity-60" />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* সাব-ভিউ: HERO CERTIFICATE */}
                {homeSubView === 'certificate' && (
                  <div className="space-y-4">
                    <h2 className="text-base font-black">🎖️ RedPulse Lifesaver Certificate</h2>
                    <div className={`p-6 rounded-3xl border-2 text-center relative overflow-hidden ${theme.card}`}>
                      <div className="inline-flex p-3 rounded-2xl bg-amber-500/15 text-amber-600 mb-3">
                        <Award className="w-10 h-10" />
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-widest opacity-60">Certificate of Appreciation</p>
                      <h3 className="text-xl font-black mt-1">{currentUser.name}</h3>
                      <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-black border ${theme.badge}`}>
                        Blood Group: {currentUser.bloodGroup}
                      </span>
                      <p className="text-xs mt-4 leading-relaxed opacity-85">
                        মানবতার সেবায় স্বেচ্ছায় রক্তদান করে অমূল্য প্রাণ বাঁচানোর জন্য RedPulse পরিবারের পক্ষ থেকে আন্তরিক কৃতজ্ঞতা ও সম্মাননা প্রদান করা হলো।
                      </p>
                      <div className="mt-4 pt-3 border-t border-slate-200/60 flex justify-between text-[11px] font-bold">
                        <span>Verified Donations: {currentUser.verifiedDonations || 0}</span>
                        <span>{masterConfig.devName}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className={`w-full py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 ${theme.btn3d}`}
                    >
                      <Download className="w-4 h-4" /> সার্টিফিকেট সেভ / প্রিন্ট করুন
                    </button>
                  </div>
                )}

                {/* সাব-ভিউ: AMBULANCE & HELPLINE */}
                {homeSubView === 'ambulance' && (
                  <div className="space-y-3">
                    <h2 className="text-base font-black">🚑 Emergency Ambulance & Helpline</h2>
                    <div className={`p-4 rounded-2xl border flex items-center justify-between ${theme.card}`}>
                      <div>
                        <h4 className="font-bold text-sm">জাতীয় জরুরি সেবা (৯৯৯)</h4>
                        <p className={`text-xs ${theme.textSub}`}>সারাদেশ • ২৪ ঘণ্টা ফ্রি হেল্পলাইন</p>
                      </div>
                      <a href="tel:999" className={`px-4 py-2 rounded-xl text-xs font-black ${theme.btn3d}`}>
                        কল 999
                      </a>
                    </div>
                    {ambulances.map((amb) => (
                      <div key={amb.id} className={`p-4 rounded-2xl border flex items-center justify-between ${theme.card}`}>
                        <div>
                          <h4 className="font-bold text-sm">{amb.name}</h4>
                          <p className={`text-xs ${theme.textSub}`}>
                            {amb.area} • {amb.phone}
                          </p>
                        </div>
                        <a href={`tel:${amb.phone}`} className={`px-4 py-2 rounded-xl text-xs font-black ${theme.btn3d}`}>
                          কল করুন
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* সাব-ভিউ: PHYSICAL CONDITION TEST */}
                {homeSubView === 'quiz' && (
                  <div className={`p-5 rounded-3xl border space-y-4 ${theme.card}`}>
                    <h2 className="text-base font-black">🩺 Physical Condition Eligibility Test</h2>
                    {[
                      { key: 'age18', label: 'আপনার বয়স কি ১৮ থেকে ৬০ বছরের মধ্যে?' },
                      { key: 'weight50', label: 'আপনার শরীরের ওজন কি ৫০ কেজি বা তার বেশি?' },
                      { key: 'noMed', label: 'আপনি কি বর্তমানে কোনো অ্যান্টিবায়োটিক বা জটিল রোগের ওষুধ ছাড়া সুস্থ আছেন?' },
                      { key: 'days120', label: 'আপনার শেষ রক্তদানের পর কি ১২০ দিন (৪ মাস) পার হয়েছে?' }
                    ].map((q) => (
                      <label key={q.key} className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200/70">
                        <span className="text-xs font-bold">{q.label}</span>
                        <input
                          type="checkbox"
                          checked={quizAnswers[q.key]}
                          onChange={(e) => setQuizAnswers({ ...quizAnswers, [q.key]: e.target.checked })}
                          className="w-5 h-5 accent-rose-600"
                        />
                      </label>
                    ))}
                    <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center">
                      {Object.values(quizAnswers).every(Boolean) ? (
                        <p className="text-xs font-black text-emerald-600">✅ অভিনন্দন! আপনি শারীরিকভাবে রক্তদানের জন্য সম্পূর্ণ প্রস্তুত।</p>
                      ) : (
                        <p className="text-xs font-black text-rose-600">⚠️ দুঃখিত, সবগুলো শর্ত পূরণ না হওয়া পর্যন্ত রক্তদান থেকে বিরত থাকুন।</p>
                      )}
                    </div>
                  </div>
                )}

                {/* সাব-ভিউ: RATE US */}
                {homeSubView === 'rate' && (
                  <div className={`p-5 rounded-3xl border space-y-4 ${theme.card}`}>
                    <h2 className="text-base font-black">⭐ Rate RedPulse App</h2>
                    <div className="flex gap-2 justify-center py-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} type="button" onClick={() => setUserRating({ ...userRating, stars: s })} className="p-2">
                          <Star className={`w-8 h-8 ${s <= userRating.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={3}
                      placeholder="অ্যাপটি সম্পর্কে আপনার মূল্যবান মতামত লিখুন..."
                      value={userRating.comment}
                      onChange={(e) => setUserRating({ ...userRating, comment: e.target.value })}
                      className="w-full p-3 rounded-2xl border border-slate-300 bg-white text-slate-900 text-xs"
                    />
                    <button
                      onClick={async () => {
                        await addDoc(collection(db, 'ratings'), {
                          userName: currentUser.name,
                          stars: userRating.stars,
                          comment: userRating.comment,
                          createdAtMs: Date.now()
                        });
                        setUserRating({ stars: 5, comment: '' });
                        alert('আপনার মূল্যবান রিভিউয়ের জন্য ধন্যবাদ!');
                      }}
                      className={`w-full py-3 rounded-2xl text-xs font-black ${theme.btn3d}`}
                    >
                      রেটিং জমা দিন
                    </button>
                  </div>
                )}

                {/* সাব-ভিউ: ABOUT US */}
                {homeSubView === 'about' && (
                  <div className="flex-1 flex flex-col justify-between space-y-6">
                    <div className={`p-5 rounded-3xl border space-y-3.5 ${theme.card}`}>
                      <h2 className="text-base font-black">🩸 About RedPulse</h2>
                      <p className="text-xs leading-relaxed opacity-90">
                        <strong>RedPulse</strong> একটি আধুনিক, রিয়েল-টাইম জরুরি রক্তদাতা ও ব্লাড ব্যাংক নেটওয়ার্ক প্ল্যাটফর্ম। জরুরি চিকিৎসা মুহূর্তে রোগীর স্বজনদের সাথে শারীরিকভাবে সুস্থ ও প্রস্তুত রক্তদাতা এবং নিকটস্থ ব্লাড ব্যাংকের দ্রুত, নিরাপদ ও নির্ভরযোগ্য সংযোগ তৈরি করাই আমাদের মূল লক্ষ্য।
                      </p>

                      <div className="space-y-2 text-xs pt-2 border-t border-slate-200/60">
                        <p className="font-black uppercase text-[11px] opacity-70">আমাদের মূল বৈশিষ্ট্যসমূহ:</p>
                        <p>🎁 <strong>RedPulse Coin ও হাসপাতাল ডিসকাউন্ট:</strong> রক্তদানের পর কয়েন ক্লেইম করে পার্টনার হাসপাতালগুলোতে বিশেষ ডিসকাউন্ট ভাউচার পাওয়ার সুবিধা।</p>
                        <p>🔒 <strong>১০০% ফোন নম্বর প্রাইভেসি:</strong> অ্যাডমিনের যাচাই ও অনুমোদন ছাড়া কোনো ডোনারের মোবাইল নম্বর প্রকাশ করা হয় না।</p>
                        <p>⏳ <strong>১২০ দিনের নিরাপদ কুলডাউন ও হেলথ ট্র্যাকার:</strong> রক্তদাতার সুস্বাস্থ্য রক্ষায় স্বয়ংক্রিয় ১২০ দিনের বিশ্রাম ট্র্যাকিং।</p>
                        <p>📍 <strong>কনসেন্ট-ভিত্তিক লাইভ GPS লোকেশন:</strong> ডোনার রিকোয়েস্ট গ্রহণ করলেই কেবল রোগীর স্বজন লাইভ ম্যাপে অবস্থান দেখতে পারবেন।</p>
                        <p>🚨 <strong>Rare Blood SOS ও ইনস্ট্যান্ট অ্যালার্ম:</strong> দুর্লভ রক্তের গ্রুপের জন্য বিশেষ SOS ব্রডকাস্ট ও তাৎক্ষণিক অ্যালার্ট।</p>
                      </div>
                    </div>

                    <div className={`mt-auto p-4 rounded-3xl border text-center space-y-1.5 ${theme.card}`}>
                      <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase border ${theme.badge}`}>
                        Developer Information
                      </span>
                      <h3 className="text-sm font-black pt-1">{masterConfig.devName}</h3>
                      <p className={`text-xs font-bold ${theme.accentText}`}>{masterConfig.devRole}</p>
                      <p className={`text-[11px] leading-relaxed ${theme.textSub}`}>{masterConfig.devBio}</p>
                      {masterConfig.devContact && <p className="text-[11px] font-bold">Contact: {masterConfig.devContact}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================================================== */}
        {/* ডানের ট্যাব: PROFILE TAB */}
        {/* ================================================================== */}
        {activeTab === 'profile' && (
          <div className="flex-1 flex flex-col justify-between space-y-6">
            <div className={`p-5 rounded-3xl border space-y-5 ${theme.card}`}>
              <div className="flex justify-end">
                <button
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-600 text-xs font-black flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> লগআউট
                </button>
              </div>

              {/* গোল প্রোফাইল ছবি ও ফটো আপলোড */}
              <div className="flex flex-col items-center text-center -mt-3">
                <div className="relative">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-rose-500 shadow-lg"
                    />
                  ) : (
                    <div className={`w-24 h-24 rounded-full ${theme.btn3d} flex items-center justify-center font-black text-3xl`}>
                      {currentUser.name?.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {!isBloodBank && (
                    <label
                      className={`absolute bottom-0 right-0 p-2 rounded-full cursor-pointer shadow-md ${theme.btn3d}`}
                      title="ছবি পরিবর্তন করুন"
                    >
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && currentUser.id) {
                            compressImageToBase64(file, async (base64Url) => {
                              await updateDoc(doc(db, 'users', currentUser.id), { photoURL: base64Url });
                              setCurrentUser((prev) => ({ ...prev, photoURL: base64Url }));
                              alert('প্রোফাইল ছবি আপডেট হয়েছে!');
                            });
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                <h2 className="text-lg font-black mt-3">{currentUser.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-3 py-0.5 rounded-full text-xs font-black border ${theme.badge}`}>
                    Blood Group: {currentUser.bloodGroup}
                  </span>
                  {!isBloodBank && (
                    <span className="px-3 py-0.5 rounded-full text-xs font-black bg-amber-500/15 text-amber-600 border border-amber-500/30 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" /> {currentUser.coins || 0} Coins
                    </span>
                  )}
                </div>
              </div>

              {/* ১২০ দিনের কুলডাউন ও রেডিনেস ব্যানার */}
              {!isBloodBank && (
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/70 text-center">
                  {(() => {
                    const st = calculateDonorReadiness(currentUser);
                    return (
                      <p className={`text-xs font-black ${st.isReady ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {st.isReady ? `✅ ${st.reason}` : `⏳ ${st.reason}`}
                      </p>
                    );
                  })()}
                </div>
              )}

              {!isEditingMyProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-2xl border border-slate-200/70">
                      <span className="opacity-60 block text-[10px]">মোবাইল নম্বর (ঐচ্ছিক)</span>
                      <strong>{currentUser.phone || 'যুক্ত করা হয়নি'}</strong>
                    </div>
                    <div className="p-3 rounded-2xl border border-slate-200/70">
                      <span className="opacity-60 block text-[10px]">লিঙ্গ (Gender)</span>
                      <strong>{currentUser.gender || 'উল্লেখ নেই'}</strong>
                    </div>
                    <div className="p-3 rounded-2xl border border-slate-200/70">
                      <span className="opacity-60 block text-[10px]">এলাকা / লোকেশন</span>
                      <strong>{currentUser.location || 'উল্লেখ নেই'}</strong>
                    </div>
                    <div className="p-3 rounded-2xl border border-slate-200/70">
                      <span className="opacity-60 block text-[10px]">বয়স ও ওজন</span>
                      <strong>
                        {currentUser.age || '-'} বছর / {currentUser.weight || '-'} কেজি
                      </strong>
                    </div>
                    <div className="p-3 rounded-2xl border border-slate-200/70">
                      <span className="opacity-60 block text-[10px]">হিমোগ্লোবিন</span>
                      <strong>{currentUser.hemoglobin || '-'}</strong>
                    </div>
                    <div className="p-3 rounded-2xl border border-slate-200/70">
                      <span className="opacity-60 block text-[10px]">শেষ রক্তদান</span>
                      <strong>{currentUser.lastDonationDate || 'নতুন ডোনার'}</strong>
                    </div>
                    <div className="p-3 rounded-2xl border border-slate-200/70 col-span-2 flex justify-between items-center">
                      <span className="opacity-60 text-[11px]">মোট ভেরিফায়েড রক্তদান</span>
                      <strong className="text-emerald-600">{currentUser.verifiedDonations || 0} বার</strong>
                    </div>
                  </div>

                  {!isBloodBank && (
                    <button
                      type="button"
                      onClick={() => setIsEditingMyProfile(true)}
                      className={`w-full py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 ${theme.btn3d}`}
                    >
                      <Edit3 className="w-4 h-4" /> Edit Profile
                    </button>
                  )}
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await updateDoc(doc(db, 'users', currentUser.id), {
                      name: currentUser.name,
                      phone: currentUser.phone || '',
                      bloodGroup: currentUser.bloodGroup,
                      gender: currentUser.gender || '',
                      location: currentUser.location || '',
                      age: currentUser.age || '',
                      weight: currentUser.weight || '',
                      hemoglobin: currentUser.hemoglobin || '',
                      lastDonationDate: currentUser.lastDonationDate || '',
                      onMedication: Boolean(currentUser.onMedication)
                    });
                    setIsEditingMyProfile(false);
                    alert('আপনার প্রোফাইল সফলভাবে আপডেট হয়েছে!');
                  }}
                  className="space-y-3 pt-1"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold mb-1">পুরো নাম</label>
                      <input
                        type="text"
                        value={currentUser.name || ''}
                        onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1">মোবাইল নম্বর (ঐচ্ছিক)</label>
                      <input
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        value={currentUser.phone || ''}
                        onChange={(e) => setCurrentUser({ ...currentUser, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1">রক্তের গ্রুপ</label>
                      <select
                        value={currentUser.bloodGroup}
                        onChange={(e) => setCurrentUser({ ...currentUser, bloodGroup: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold"
                      >
                        {BLOOD_GROUPS.map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1">লিঙ্গ (Gender)</label>
                      <select
                        value={currentUser.gender || ''}
                        onChange={(e) => setCurrentUser({ ...currentUser, gender: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                      >
                        <option value="">নির্বাচন করুন</option>
                        <option value="Male">Male (পুরুষ)</option>
                        <option value="Female">Female (মহিলা)</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold mb-1">এলাকা / লোকেশন</label>
                      <input
                        type="text"
                        placeholder="যেমন: সাভার, ঢাকা"
                        value={currentUser.location || ''}
                        onChange={(e) => setCurrentUser({ ...currentUser, location: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1">বয়স (বছর)</label>
                      <input
                        type="number"
                        value={currentUser.age || ''}
                        onChange={(e) => setCurrentUser({ ...currentUser, age: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1">ওজন (কেজি)</label>
                      <input
                        type="number"
                        value={currentUser.weight || ''}
                        onChange={(e) => setCurrentUser({ ...currentUser, weight: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1">হিমোগ্লোবিন</label>
                      <input
                        type="number"
                        step="0.1"
                        value={currentUser.hemoglobin || ''}
                        onChange={(e) => setCurrentUser({ ...currentUser, hemoglobin: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1">শেষ রক্তদানের তারিখ</label>
                      <input
                        type="date"
                        value={currentUser.lastDonationDate || ''}
                        onChange={(e) => setCurrentUser({ ...currentUser, lastDonationDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold pt-1">
                    <input
                      type="checkbox"
                      checked={Boolean(currentUser.onMedication)}
                      onChange={(e) => setCurrentUser({ ...currentUser, onMedication: e.target.checked })}
                      className="w-4 h-4 accent-rose-600"
                    />
                    <span>বর্তমানে নিয়মিত কোনো জটিল রোগের ওষুধ সেবন করছি</span>
                  </label>

                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingMyProfile(false)}
                      className="py-3 rounded-2xl border border-slate-300 text-xs font-black"
                    >
                      বাতিল করুন
                    </button>
                    <button type="submit" className={`py-3 rounded-2xl text-xs font-black ${theme.btn3d}`}>
                      সেভ করুন
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className={`mt-auto p-4 rounded-2xl border text-center ${theme.card}`}>
              <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold">Developed & Engineered By</p>
              <p className={`text-xs font-black mt-0.5 ${theme.accentText}`}>{masterConfig.devName}</p>
              <p className={`text-[11px] ${theme.textSub}`}>{masterConfig.devRole}</p>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* টপ হেডার থেকে খোলা: DATA ENTRY OPERATOR TAB */}
        {/* ================================================================== */}
        {activeTab === 'data_entry' && isDataEntry && (
          <div className={`p-5 rounded-3xl border space-y-4 ${theme.card}`}>
            <h2 className="text-base font-black">📝 Manual Offline Donor Entry</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!manualDonorForm.name || !manualDonorForm.phone) return;
                await addDoc(collection(db, 'users'), {
                  ...manualDonorForm,
                  pin: '',
                  role: 'donor',
                  addedByOperator: currentUser.name,
                  coins: 0,
                  pendingClaimCoins: 0,
                  claimedVouchers: [],
                  donationCount: 0,
                  verifiedDonations: 0,
                  reviews: [],
                  isBanned: false,
                  createdAtMs: Date.now()
                });
                setManualDonorForm({ name: '', phone: '', bloodGroup: 'A+', gender: 'Male', location: '', lastDonationDate: '' });
                alert('অফলাইন ডোনারের তথ্য সফলভাবে যুক্ত হয়েছে!');
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[11px] font-bold mb-1">ডোনারের পুরো নাম</label>
                <input
                  type="text"
                  required
                  value={manualDonorForm.name}
                  onChange={(e) => setManualDonorForm({ ...manualDonorForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1">মোবাইল নম্বর</label>
                <input
                  type="tel"
                  required
                  value={manualDonorForm.phone}
                  onChange={(e) => setManualDonorForm({ ...manualDonorForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold mb-1">রক্তের গ্রুপ</label>
                  <select
                    value={manualDonorForm.bloodGroup}
                    onChange={(e) => setManualDonorForm({ ...manualDonorForm, bloodGroup: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">লিঙ্গ (Gender)</label>
                  <select
                    value={manualDonorForm.gender}
                    onChange={(e) => setManualDonorForm({ ...manualDonorForm, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1">এলাকা / ঠিকানা</label>
                <input
                  type="text"
                  value={manualDonorForm.location}
                  onChange={(e) => setManualDonorForm({ ...manualDonorForm, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1">শেষ রক্তদানের তারিখ (ঐচ্ছিক)</label>
                <input
                  type="date"
                  value={manualDonorForm.lastDonationDate}
                  onChange={(e) => setManualDonorForm({ ...manualDonorForm, lastDonationDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                />
              </div>
              <button type="submit" className={`w-full py-3 rounded-2xl text-xs font-black ${theme.btn3d}`}>
                ডোনার ডেটা সেভ করুন
              </button>
            </form>
          </div>
        )}

        {/* ================================================================== */}
        {/* টপ হেডার থেকে খোলা: BLOOD BANK PORTAL TAB */}
        {/* ================================================================== */}
        {activeTab === 'bank_portal' && isBloodBank && (
          <div className="space-y-4">
            {(() => {
              const myBank = bloodBanks.find((b) => b.id === currentUser.bankId);
              if (!myBank) return <p className="text-xs">ব্লাড ব্যাংক তথ্য পাওয়া যায়নি।</p>;
              return (
                <div className={`p-5 rounded-3xl border space-y-4 ${theme.card}`}>
                  <div>
                    <h2 className="text-base font-black">🏥 {myBank.name}</h2>
                    <p className={`text-xs ${theme.textSub}`}>
                      {myBank.address} • {myBank.location}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-bold mt-1">সর্বশেষ আপডেট: {myBank.updatedAt}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {BLOOD_GROUPS.map((bg) => {
                      const count = myBank.stock?.[bg] || 0;
                      return (
                        <div key={bg} className="p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                          <span className="font-black text-sm">{bg}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                const next = Math.max(0, count - 1);
                                await updateDoc(doc(db, 'bloodBanks', myBank.id), {
                                  [`stock.${bg}`]: next,
                                  updatedAt: new Date().toLocaleString()
                                });
                              }}
                              className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-600 font-black flex items-center justify-center"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-black text-sm w-6 text-center">{count}</span>
                            <button
                              onClick={async () => {
                                const next = count + 1;
                                await updateDoc(doc(db, 'bloodBanks', myBank.id), {
                                  [`stock.${bg}`]: next,
                                  updatedAt: new Date().toLocaleString()
                                });
                              }}
                              className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 font-black flex items-center justify-center"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ================================================================== */}
        {/* টপ হেডার থেকে খোলা: ADMIN PANEL (আগের সব কন্ট্রোল + Hospital Rewards) */}
        {/* ================================================================== */}
        {activeTab === 'admin' && (isMasterAdmin || isHiredAdmin) && (
          <div className="space-y-4">
            <h2 className="text-lg font-black px-1">
              {isMasterAdmin ? '👑 Master Admin Control' : '🛡️ Admin Coordinator Panel'}
            </h2>

            {isHiredAdmin && (
              <div className="space-y-4">
                <div className={`p-4 rounded-3xl border space-y-3 ${theme.card}`}>
                  <h3 className="text-xs font-black uppercase">📞 পেন্ডিং ফোন নম্বর অ্যাক্সেস রিকোয়েস্ট ({pendingContactReqs.length})</h3>
                  {pendingContactReqs.length === 0 ? (
                    <p className={`text-xs ${theme.textSub}`}>কোনো পেন্ডিং নম্বর রিকোয়েস্ট নেই।</p>
                  ) : (
                    pendingContactReqs.map((cr) => (
                      <div key={cr.id} className="p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2">
                        <div className="text-xs">
                          <p className="font-bold">
                            {cr.requesterName} ➔ {cr.targetName} ({cr.targetBloodGroup})
                          </p>
                          <p className="opacity-70">ডোনারের নম্বর: {cr.targetPhone || 'নেই'}</p>
                        </div>
                        <button
                          onClick={() => updateDoc(doc(db, 'contactRequests', cr.id), { status: 'approved' })}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                        >
                          Approve
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className={`p-4 rounded-3xl border space-y-3 ${theme.card}`}>
                  <h3 className="text-xs font-black uppercase">🩸 রক্তের রিকোয়েস্ট রিভিউ ও সমন্বয়</h3>
                  {bloodRequests.map((req) => (
                    <div key={req.id} className="p-3 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                      <p className="font-black">
                        {req.patientName} • {req.bloodGroup} ({req.bags} ব্যাগ)
                      </p>
                      <p className="opacity-75">
                        হাসপাতাল: {req.hospital} | যোগাযোগ: {req.contactPhone || req.requesterPhone}
                      </p>
                      {(req.contactPhone || req.requesterPhone) && (
                        <a
                          href={`tel:${req.contactPhone || req.requesterPhone}`}
                          className="inline-block px-3 py-1 rounded-lg bg-sky-600 text-white font-bold"
                        >
                          রোগীকে কল করুন
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isMasterAdmin && (
              <>
                <div className="flex gap-2 overflow-x-auto pb-1.5">
                  {[
                    { id: 'radar', label: 'Live Radar & Alarm' },
                    { id: 'hospitals', label: 'Hospital & Rewards' },
                    { id: 'messages', label: 'User Messages' },
                    { id: 'donors', label: 'Manage Donors' },
                    { id: 'create', label: 'Create Accounts' },
                    { id: 'data_entry', label: 'Data Entry' },
                    { id: 'security', label: 'Security & Dev' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setAdminSubTab(tab.id)}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-black shrink-0 border transition-all ${
                        adminSubTab === tab.id ? theme.btn3d : `${theme.card}`
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* ১) Live Radar & Emergency Alarm */}
                {adminSubTab === 'radar' && (
                  <div className={`p-4 rounded-3xl border space-y-3 ${theme.card}`}>
                    <h3 className="text-xs font-black uppercase">📡 Live Donor Radar & Emergency Alarm</h3>
                    {activeDonorsList.map((d) => (
                      <div key={d.id} className="p-3 rounded-2xl border border-slate-200/70 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">
                            {d.name} ({d.bloodGroup})
                          </p>
                          <p className="text-[11px] opacity-70">
                            {d.phone || 'No Phone'} • {d.location || 'লোকেশন নেই'}
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            await updateDoc(doc(db, 'users', d.id), {
                              activeAlarm: {
                                timestamp: Date.now(),
                                message: `🚨 জরুরি রক্তের প্রয়োজন (${d.bloodGroup})! অনুগ্রহ করে এখনই সাড়া দিন।`
                              }
                            });
                            if (d.fcmToken) {
                              sendBackgroundPush(
                                [d.fcmToken],
                                '🚨 EMERGENCY BLOOD ALARM!',
                                `জরুরি রক্তের প্রয়োজন (${d.bloodGroup})! এখনই অ্যাপ চেক করুন।`,
                                true
                              );
                            }
                            alert(`${d.name}-এর ফোনে ইমার্জেন্সি অ্যালার্ম পাঠানো হয়েছে!`);
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 ${theme.btn3d}`}
                        >
                          <Volume2 className="w-3.5 h-3.5" /> Ring Alarm
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* ২) কোড ছাড়াই পার্টনার হাসপাতাল ও ডিসকাউন্ট কন্ট্রোল */}
                {adminSubTab === 'hospitals' && (
                  <div className="space-y-4">
                    {/* প্রতি রক্তদানে কত কয়েন পাবে তা নির্ধারণ */}
                    <div className={`p-5 rounded-3xl border space-y-3 ${theme.card}`}>
                      <h3 className="text-sm font-black flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-amber-500" /> প্রতি রক্তদানে Reward Coin নির্ধারণ
                      </h3>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={1}
                          value={coinsSettingInput}
                          onChange={(e) => setCoinsSettingInput(Number(e.target.value))}
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-black"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            await setDoc(
                              doc(db, 'system', 'masterConfig'),
                              { ...masterConfig, coinsPerDonation: Number(coinsSettingInput) || 100 },
                              { merge: true }
                            );
                            alert('প্রতি রক্তদানের কয়েন পরিমাণ আপডেট হয়েছে!');
                          }}
                          className={`px-4 py-2.5 rounded-xl text-xs font-black ${theme.btn3d}`}
                        >
                          সেভ করুন
                        </button>
                      </div>
                    </div>

                    {/* নতুন পার্টনার হাসপাতাল ও ডিসকাউন্ট যোগ/এডিট ফর্ম */}
                    <div className={`p-5 rounded-3xl border space-y-3 ${theme.card}`}>
                      <h3 className="text-sm font-black">
                        {editingHospitalId ? '✏️ হাসপাতাল ও ডিসকাউন্ট এডিট করুন' : '🏥 নতুন পার্টনার হাসপাতাল ও ডিসকাউন্ট যোগ করুন'}
                      </h3>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!hospitalForm.name || !hospitalForm.discountTitle) return;

                          const payload = {
                            name: hospitalForm.name.trim(),
                            address: hospitalForm.address.trim(),
                            phone: hospitalForm.phone.trim(),
                            discountTitle: hospitalForm.discountTitle.trim(),
                            discountPercent: hospitalForm.discountPercent.trim() || '20% OFF',
                            coinCost: Number(hospitalForm.coinCost) || 100,
                            createdAtMs: Date.now()
                          };

                          if (editingHospitalId) {
                            await updateDoc(doc(db, 'partnerHospitals', editingHospitalId), payload);
                            setEditingHospitalId(null);
                            alert('হাসপাতাল ও ডিসকাউন্ট আপডেট হয়েছে!');
                          } else {
                            await addDoc(collection(db, 'partnerHospitals'), payload);
                            alert('নতুন পার্টনার হাসপাতাল ও ডিসকাউন্ট যুক্ত হয়েছে!');
                          }
                          setHospitalForm({
                            name: '',
                            address: '',
                            phone: '',
                            discountTitle: '',
                            discountPercent: '',
                            coinCost: 100
                          });
                        }}
                        className="space-y-3"
                      >
                        <input
                          type="text"
                          required
                          placeholder="হাসপাতাল / ডায়াগনস্টিক সেন্টারের নাম"
                          value={hospitalForm.name}
                          onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="ঠিকানা / এলাকা"
                            value={hospitalForm.address}
                            onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                          />
                          <input
                            type="tel"
                            placeholder="হটলাইন নম্বর"
                            value={hospitalForm.phone}
                            onChange={(e) => setHospitalForm({ ...hospitalForm, phone: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                          />
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="ডিসকাউন্টের বিবরণ (যেমন: সব প্যাথলজি টেস্টে ছাড়)"
                          value={hospitalForm.discountTitle}
                          onChange={(e) => setHospitalForm({ ...hospitalForm, discountTitle: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold mb-1">ডিসকাউন্ট পরিমাণ (যেমন: 25% OFF)</label>
                            <input
                              type="text"
                              required
                              placeholder="25% OFF"
                              value={hospitalForm.discountPercent}
                              onChange={(e) => setHospitalForm({ ...hospitalForm, discountPercent: e.target.value })}
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold mb-1">প্রয়োজনীয় Coin</label>
                            <input
                              type="number"
                              required
                              min={1}
                              value={hospitalForm.coinCost}
                              onChange={(e) => setHospitalForm({ ...hospitalForm, coinCost: Number(e.target.value) })}
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {editingHospitalId && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingHospitalId(null);
                                setHospitalForm({
                                  name: '',
                                  address: '',
                                  phone: '',
                                  discountTitle: '',
                                  discountPercent: '',
                                  coinCost: 100
                                });
                              }}
                              className="px-4 py-3 rounded-2xl border border-slate-300 text-xs font-black"
                            >
                              বাতিল
                            </button>
                          )}
                          <button type="submit" className={`flex-1 py-3 rounded-2xl text-xs font-black ${theme.btn3d}`}>
                            {editingHospitalId ? 'পরিবর্তন সেভ করুন' : 'হাসপাতাল ও ডিসকাউন্ট যোগ করুন'}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* যুক্ত করা পার্টনার হাসপাতালের তালিকা */}
                    <div className={`p-4 rounded-3xl border space-y-2.5 ${theme.card}`}>
                      <h3 className="text-xs font-black uppercase">যুক্ত করা পার্টনার হাসপাতালসমূহ ({partnerHospitals.length})</h3>
                      {partnerHospitals.map((h) => (
                        <div key={h.id} className="p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2">
                          <div className="text-xs">
                            <p className="font-black">
                              {h.name} ({h.discountPercent})
                            </p>
                            <p className="opacity-75">
                              {h.discountTitle} • {h.coinCost} Coins
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingHospitalId(h.id);
                                setHospitalForm({
                                  name: h.name || '',
                                  address: h.address || '',
                                  phone: h.phone || '',
                                  discountTitle: h.discountTitle || '',
                                  discountPercent: h.discountPercent || '',
                                  coinCost: h.coinCost || 100
                                });
                              }}
                              className="p-2 rounded-xl bg-sky-500/15 text-sky-600"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteDoc(doc(db, 'partnerHospitals', h.id))}
                              className="p-2 rounded-xl bg-rose-500/15 text-rose-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ৩) সব ইউজারের মেসেজ মনিটরিং */}
                {adminSubTab === 'messages' && (
                  <div className={`p-4 rounded-3xl border space-y-3 ${theme.card}`}>
                    <h3 className="text-xs font-black uppercase">💬 All User Messages (Sender ➔ Receiver)</h3>
                    <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
                      {messages.length === 0 ? (
                        <p className={`text-xs ${theme.textSub}`}>কোনো মেসেজ নেই।</p>
                      ) : (
                        messages.map((m) => (
                          <div key={m.id} className="p-3 rounded-2xl border border-slate-200/80 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black border ${theme.badge}`}>
                                {m.senderName} ➔ {m.receiverName}
                              </span>
                              <button onClick={() => deleteDoc(doc(db, 'messages', m.id))} className="text-rose-500 p-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-xs font-medium">{m.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* ৪) সব ডোনার ম্যানেজমেন্ট ও A-to-Z এডিট */}
                {adminSubTab === 'donors' && (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-3xl border space-y-2.5 ${theme.card}`}>
                      <h3 className="text-xs font-black uppercase">🔑 Pending Phone Number Requests ({pendingContactReqs.length})</h3>
                      {pendingContactReqs.map((cr) => (
                        <div key={cr.id} className="p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                          <span className="text-xs font-bold">
                            {cr.requesterName} ➔ {cr.targetName}
                          </span>
                          <button
                            onClick={() => updateDoc(doc(db, 'contactRequests', cr.id), { status: 'approved' })}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                          >
                            Approve
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className={`p-4 rounded-3xl border space-y-2.5 ${theme.card}`}>
                      <h3 className="text-xs font-black uppercase">👥 All Donors (Full A-to-Z Profile Edit, Coins & Ban)</h3>
                      {users.map((u) => (
                        <div key={u.id} className="p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm">
                              {u.name} ({u.bloodGroup}) {u.isBanned && <span className="text-rose-600 text-xs">[BANNED]</span>}
                            </p>
                            <p className="text-[11px] opacity-70">
                              {u.location || 'No Address'} • Coins: {u.coins || 0} • Role: {u.role}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingDonorModal({ ...u })}
                              className="p-2 rounded-xl bg-sky-500/15 text-sky-600"
                              title="Full Edit Profile"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {u.role !== 'master_admin' && (
                              <>
                                <button
                                  onClick={() => updateDoc(doc(db, 'users', u.id), { isBanned: !u.isBanned })}
                                  className="p-2 rounded-xl bg-amber-500/15 text-amber-600"
                                  title="Ban / Unban"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteDoc(doc(db, 'users', u.id))}
                                  className="p-2 rounded-xl bg-rose-500/15 text-rose-600"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ৫) স্পেশাল অ্যাকাউন্ট তৈরি */}
                {adminSubTab === 'create' && (
                  <div className="space-y-4">
                    <div className={`p-5 rounded-3xl border space-y-4 ${theme.card}`}>
                      <h3 className="text-sm font-black">➕ Create Special Account (Email OTP Protected)</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'admin', label: 'Admin' },
                          { id: 'data_entry', label: 'Data Entry' },
                          { id: 'blood_bank', label: 'Blood Bank' }
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setCreateAccountType(t.id);
                              setOtpState({ step: 'idle', generatedCode: '', inputCode: '', purpose: '' });
                            }}
                            className={`py-2 rounded-xl text-xs font-black border ${
                              createAccountType === t.id ? theme.btn3d : 'bg-white/80 text-slate-700 border-slate-200'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder={createAccountType === 'blood_bank' ? 'ব্লাড ব্যাংকের নাম' : 'পুরো নাম'}
                          value={newAccForm.name}
                          onChange={(e) => setNewAccForm({ ...newAccForm, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                        />
                        <input
                          type="tel"
                          placeholder="মোবাইল নম্বর (লগইন আইডি)"
                          value={newAccForm.phone}
                          onChange={(e) => setNewAccForm({ ...newAccForm, phone: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                        />
                        {createAccountType === 'blood_bank' && (
                          <>
                            <input
                              type="text"
                              placeholder="পূর্ণ ঠিকানা (Address)"
                              value={newAccForm.address}
                              onChange={(e) => setNewAccForm({ ...newAccForm, address: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                            />
                            <input
                              type="text"
                              placeholder="এলাকা / লোকেশন"
                              value={newAccForm.location}
                              onChange={(e) => setNewAccForm({ ...newAccForm, location: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                            />
                          </>
                        )}
                        <input
                          type="password"
                          placeholder="গোপন PIN সেট করুন"
                          value={newAccForm.pin}
                          onChange={(e) => setNewAccForm({ ...newAccForm, pin: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                        />

                        {otpState.step === 'idle' || otpState.purpose !== 'create_account' ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (!newAccForm.name || !newAccForm.phone || !newAccForm.pin) {
                                alert('সবগুলো তথ্য পূরণ করুন।');
                                return;
                              }
                              sendEmailOtp('create_account');
                            }}
                            className={`w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 ${theme.btn3d}`}
                          >
                            <Mail className="w-4 h-4" /> Send Email Verification Code
                          </button>
                        ) : (
                          <div className="space-y-2 pt-2 border-t border-slate-200">
                            <input
                              type="text"
                              placeholder="ইমেইলে পাঠানো ৬ ডিজিটের কোড লিখুন"
                              value={otpState.inputCode}
                              onChange={(e) => setOtpState({ ...otpState, inputCode: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-500 bg-white text-slate-900 text-xs font-black text-center tracking-widest"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyAndExecute}
                              className="w-full py-3 rounded-2xl bg-emerald-600 text-white text-xs font-black"
                            >
                              ✓ Verify & Create Account
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={`p-5 rounded-3xl border space-y-3 ${theme.card}`}>
                      <h3 className="text-xs font-black uppercase">🚑 Add Emergency Ambulance</h3>
                      <input
                        type="text"
                        placeholder="অ্যাম্বুলেন্স সার্ভিসের নাম"
                        value={newAmbForm.name}
                        onChange={(e) => setNewAmbForm({ ...newAmbForm, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="এলাকা"
                          value={newAmbForm.area}
                          onChange={(e) => setNewAmbForm({ ...newAmbForm, area: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                        />
                        <input
                          type="tel"
                          placeholder="হেল্পলাইন নম্বর"
                          value={newAmbForm.phone}
                          onChange={(e) => setNewAmbForm({ ...newAmbForm, phone: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!newAmbForm.name || !newAmbForm.phone) return;
                          await addDoc(collection(db, 'ambulances'), newAmbForm);
                          setNewAmbForm({ name: '', area: '', phone: '' });
                          alert('অ্যাম্বুলেন্স যুক্ত হয়েছে!');
                        }}
                        className={`w-full py-2.5 rounded-xl text-xs font-black ${theme.btn3d}`}
                      >
                        অ্যাম্বুলেন্স যোগ করুন
                      </button>
                    </div>
                  </div>
                )}

                {/* ৬) Admin Manual Donor Entry */}
                {adminSubTab === 'data_entry' && (
                  <div className={`p-5 rounded-3xl border space-y-3 ${theme.card}`}>
                    <h3 className="text-sm font-black">📝 Admin Manual Donor Entry</h3>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!manualDonorForm.name || !manualDonorForm.phone) return;
                        await addDoc(collection(db, 'users'), {
                          ...manualDonorForm,
                          pin: '',
                          role: 'donor',
                          addedByOperator: 'Master Admin',
                          coins: 0,
                          pendingClaimCoins: 0,
                          claimedVouchers: [],
                          donationCount: 0,
                          verifiedDonations: 0,
                          reviews: [],
                          isBanned: false,
                          createdAtMs: Date.now()
                        });
                        setManualDonorForm({
                          name: '',
                          phone: '',
                          bloodGroup: 'A+',
                          gender: 'Male',
                          location: '',
                          lastDonationDate: ''
                        });
                        alert('ডোনার ডেটা সফলভাবে যুক্ত হয়েছে!');
                      }}
                      className="space-y-3"
                    >
                      <input
                        type="text"
                        required
                        placeholder="ডোনারের নাম"
                        value={manualDonorForm.name}
                        onChange={(e) => setManualDonorForm({ ...manualDonorForm, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                      />
                      <input
                        type="tel"
                        required
                        placeholder="মোবাইল নম্বর"
                        value={manualDonorForm.phone}
                        onChange={(e) => setManualDonorForm({ ...manualDonorForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                      />
                      <select
                        value={manualDonorForm.bloodGroup}
                        onChange={(e) => setManualDonorForm({ ...manualDonorForm, bloodGroup: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold"
                      >
                        {BLOOD_GROUPS.map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="লোকেশন"
                        value={manualDonorForm.location}
                        onChange={(e) => setManualDonorForm({ ...manualDonorForm, location: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                      />
                      <button type="submit" className={`w-full py-3 rounded-2xl text-xs font-black ${theme.btn3d}`}>
                        ডোনার সেভ করুন
                      </button>
                    </form>
                  </div>
                )}

                {/* ৭) Security & Developer Info */}
                {adminSubTab === 'security' && (
                  <div className="space-y-4">
                    <div className={`p-5 rounded-3xl border space-y-3 ${theme.card}`}>
                      <h3 className="text-sm font-black">🔐 Master Admin Security (Email OTP Required)</h3>
                      <div>
                        <label className="block text-[11px] font-bold mb-1">Recovery Email</label>
                        <input
                          type="email"
                          value={secForm.recoveryEmail}
                          onChange={(e) => setSecForm({ ...secForm, recoveryEmail: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold mb-1">Master Admin Phone Number</label>
                        <input
                          type="tel"
                          value={secForm.phone}
                          onChange={(e) => setSecForm({ ...secForm, phone: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold mb-1">Master Admin Secret PIN</label>
                        <input
                          type="text"
                          value={secForm.pin}
                          onChange={(e) => setSecForm({ ...secForm, pin: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                        />
                      </div>

                      {otpState.step === 'idle' || otpState.purpose !== 'update_master' ? (
                        <button
                          type="button"
                          onClick={() => sendEmailOtp('update_master')}
                          className={`w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 ${theme.btn3d}`}
                        >
                          <Mail className="w-4 h-4" /> Send OTP to Update Credentials
                        </button>
                      ) : (
                        <div className="space-y-2 pt-2 border-t border-slate-200">
                          <input
                            type="text"
                            placeholder="৬ ডিজিটের OTP লিখুন"
                            value={otpState.inputCode}
                            onChange={(e) => setOtpState({ ...otpState, inputCode: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-500 bg-white text-slate-900 text-xs font-black text-center"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyAndExecute}
                            className="w-full py-3 rounded-2xl bg-emerald-600 text-white text-xs font-black"
                          >
                            ✓ Verify & Save Credentials
                          </button>
                        </div>
                      )}
                    </div>

                    <div className={`p-5 rounded-3xl border space-y-3 ${theme.card}`}>
                      <h3 className="text-sm font-black">👨‍💻 Edit Developer Information</h3>
                      <div>
                        <label className="block text-[11px] font-bold mb-1">Developer Name</label>
                        <input
                          type="text"
                          value={devEditForm.devName}
                          onChange={(e) => setDevEditForm({ ...devEditForm, devName: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold mb-1">Role / Title</label>
                        <input
                          type="text"
                          value={devEditForm.devRole}
                          onChange={(e) => setDevEditForm({ ...devEditForm, devRole: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold mb-1">Short Bio</label>
                        <textarea
                          rows={2}
                          value={devEditForm.devBio}
                          onChange={(e) => setDevEditForm({ ...devEditForm, devBio: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold mb-1">Contact Number / Info</label>
                        <input
                          type="text"
                          value={devEditForm.devContact}
                          onChange={(e) => setDevEditForm({ ...devEditForm, devContact: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await setDoc(doc(db, 'system', 'masterConfig'), { ...masterConfig, ...devEditForm }, { merge: true });
                          alert('ডেভেলপার পরিচিতি আপডেট হয়েছে!');
                        }}
                        className={`w-full py-3 rounded-2xl text-xs font-black ${theme.btn3d}`}
                      >
                        ডেভেলপার তথ্য সেভ করুন
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* 3D ফ্লোটিং বটম নেভিগেশন বার (Home | মাঝখানে Request Blood | Profile) */}
      {/* ==================================================================== */}
      <nav className={`fixed bottom-3 left-3 right-3 max-w-xl mx-auto z-30 rounded-3xl border px-3 py-2 backdrop-blur-lg ${theme.navBg}`}>
        <div className="grid grid-cols-3 items-center gap-2">
          {bottomNavTabs.map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== 'home') setHomeSubView(null);
                  if (tab.id !== 'profile') setIsEditingMyProfile(false);
                }}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all ${
                  isActive
                    ? `${theme.btn3d} -translate-y-1.5`
                    : tab.isCenter
                    ? `border border-rose-500/30 bg-rose-500/10 ${theme.accentText}`
                    : `${theme.textSub} hover:opacity-80`
                }`}
              >
                <IconComp className="w-5 h-5" />
                <span className="text-[10px] font-black mt-1">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ==================================================================== */}
      {/* পপ-আপ ১: ডোনার প্রোফাইল ডিটেইলস মডাল */}
      {/* ==================================================================== */}
      {selectedDonorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl border p-6 space-y-4 ${theme.card}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedDonorModal.photoURL ? (
                  <img
                    src={selectedDonorModal.photoURL}
                    alt={selectedDonorModal.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-rose-500"
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-full ${theme.btn3d} flex items-center justify-center font-black text-lg`}>
                    {selectedDonorModal.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-black text-base flex items-center gap-1.5">
                    {selectedDonorModal.name}
                    {(selectedDonorModal.verifiedDonations || 0) > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 text-[10px] font-black">
                        ✓ Verified
                      </span>
                    )}
                  </h3>
                  <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-black border ${theme.badge}`}>
                    Blood Group: {selectedDonorModal.bloodGroup}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedDonorModal(null)} className="p-2 rounded-xl bg-slate-200/60">
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const st = calculateDonorReadiness(selectedDonorModal);
              return (
                <div
                  className={`p-3 rounded-2xl border text-xs font-black ${
                    st.isReady
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                  }`}
                >
                  {st.isReady ? `✅ ${st.reason}` : `⏳ ${st.reason}`}
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl border border-slate-200/70">
                <span className="opacity-60 block text-[10px]">এলাকা</span>
                <strong>{selectedDonorModal.location || 'উল্লেখ নেই'}</strong>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200/70">
                <span className="opacity-60 block text-[10px]">লিঙ্গ (Gender)</span>
                <strong>{selectedDonorModal.gender || 'উল্লেখ নেই'}</strong>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200/70">
                <span className="opacity-60 block text-[10px]">ভেরিফায়েড রক্তদান</span>
                <strong>{selectedDonorModal.verifiedDonations || 0} বার</strong>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200/70">
                <span className="opacity-60 block text-[10px]">বয়স ও ওজন</span>
                <strong>
                  {selectedDonorModal.age || '-'} বছর / {selectedDonorModal.weight || '-'} কেজি
                </strong>
              </div>
            </div>

            {selectedDonorModal.reviews && selectedDonorModal.reviews.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-black uppercase opacity-70">Thank You & Verified Reviews</p>
                <div className="max-h-24 overflow-y-auto space-y-1.5">
                  {selectedDonorModal.reviews.map((rev, i) => (
                    <div key={i} className="p-2 rounded-xl bg-emerald-500/10 text-[11px]">
                      <strong>{rev.from}</strong> ({rev.hospital}): {rev.note}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDonorModal.phone && (
              <div className="p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <span className="text-xs font-bold">
                  {isPhoneApproved(selectedDonorModal)
                    ? `📞 ${selectedDonorModal.phone}`
                    : `🔒 ${selectedDonorModal.phone?.slice(0, 3)}••••••${selectedDonorModal.phone?.slice(-2)}`}
                </span>
                {isPhoneApproved(selectedDonorModal) ? (
                  <a
                    href={`tel:${selectedDonorModal.phone}`}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black"
                  >
                    কল করুন
                  </a>
                ) : (
                  <button
                    onClick={() => handleRequestPhoneNumber(selectedDonorModal)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black ${theme.btn3d}`}
                  >
                    Request Number
                  </button>
                )}
              </div>
            )}

            {selectedDonorModal.id !== currentUser.id && (
              <button
                onClick={() => {
                  setChatReceiver(selectedDonorModal);
                  setSelectedDonorModal(null);
                  setActiveTab('home');
                  setHomeSubView(isMasterAdmin || isHiredAdmin ? 'all_donors' : 'available_donors');
                }}
                className={`w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 ${theme.btn3d}`}
              >
                <Send className="w-4 h-4" /> Live Chat শুরু করুন
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* পপ-আপ ২: ব্লাড ব্যাংক স্টক ডিটেইলস মডাল */}
      {/* ==================================================================== */}
      {selectedBankModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl border p-6 space-y-4 ${theme.card}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-base">🏥 {selectedBankModal.name}</h3>
                <p className={`text-xs ${theme.textSub}`}>
                  {selectedBankModal.address} • {selectedBankModal.location}
                </p>
              </div>
              <button onClick={() => setSelectedBankModal(null)} className="p-2 rounded-xl bg-slate-200/60">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {BLOOD_GROUPS.map((bg) => {
                const bags = selectedBankModal.stock?.[bg] || 0;
                return (
                  <div
                    key={bg}
                    className={`p-3 rounded-2xl border text-center ${
                      bags > 0 ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-rose-500/10 border-rose-500/30 opacity-60'
                    }`}
                  >
                    <span className="block font-black text-sm">{bg}</span>
                    <span className={`text-xs font-bold ${bags > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{bags} ব্যাগ</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
              <span className="text-[11px] opacity-70">আপডেট: {selectedBankModal.updatedAt}</span>
              <a href={`tel:${selectedBankModal.phone}`} className={`px-4 py-2 rounded-xl text-xs font-black ${theme.btn3d}`}>
                📞 কল করুন ({selectedBankModal.phone})
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* পপ-আপ ৩: নতুন রক্তের রিকোয়েস্ট ফর্ম */}
      {/* ==================================================================== */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl border p-6 space-y-4 ${theme.card}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base">🩸 জরুরি রক্তের রিকোয়েস্ট পাঠান</h3>
              <button onClick={() => setShowRequestModal(false)} className="p-2 rounded-xl bg-slate-200/60">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBloodRequest} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold mb-1">রোগীর নাম</label>
                <input
                  type="text"
                  required
                  placeholder="রোগীর পুরো নাম লিখুন"
                  value={reqForm.patientName}
                  onChange={(e) => setReqForm({ ...reqForm, patientName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold mb-1">রক্তের গ্রুপ</label>
                  <select
                    value={reqForm.bloodGroup}
                    onChange={(e) => setReqForm({ ...reqForm, bloodGroup: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-black"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">কত ব্যাগ প্রয়োজন</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={reqForm.bags}
                    onChange={(e) => setReqForm({ ...reqForm, bags: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1">হাসপাতালের নাম ও ঠিকানা</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: এনাম মেডিকেল কলেজ হাসপাতাল, সাভার"
                  value={reqForm.hospital}
                  onChange={(e) => setReqForm({ ...reqForm, hospital: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1">জরুরি যোগাযোগের নম্বর</label>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={reqForm.contactPhone}
                  onChange={(e) => setReqForm({ ...reqForm, contactPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                />
              </div>
              <button type="submit" className={`w-full py-3.5 rounded-2xl text-xs font-black ${theme.btn3d}`}>
                রিকোয়েস্ট প্রকাশ করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* পপ-আপ ৪: অ্যাডমিন কর্তৃক ইউজার প্রোফাইল A-to-Z ফুল এডিট মডাল */}
      {/* ==================================================================== */}
      {editingDonorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md max-h-[88vh] overflow-y-auto rounded-3xl border p-6 space-y-3 ${theme.card}`}>
            <div className="flex items-center justify-between sticky top-0 pb-2 border-b border-slate-200/70">
              <h3 className="font-black text-sm">✏️ Full Profile Edit: {editingDonorModal.name}</h3>
              <button onClick={() => setEditingDonorModal(null)} className="p-2 rounded-xl bg-slate-200/60">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold mb-1">Full Name (পুরো নাম)</label>
                <input
                  type="text"
                  value={editingDonorModal.name || ''}
                  onChange={(e) => setEditingDonorModal({ ...editingDonorModal, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Phone Number (মোবাইল নম্বর)</label>
                  <input
                    type="tel"
                    value={editingDonorModal.phone || ''}
                    onChange={(e) => setEditingDonorModal({ ...editingDonorModal, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Gender (লিঙ্গ)</label>
                  <select
                    value={editingDonorModal.gender || ''}
                    onChange={(e) => setEditingDonorModal({ ...editingDonorModal, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  >
                    <option value="">নির্বাচন করুন</option>
                    <option value="Male">Male (পুরুষ)</option>
                    <option value="Female">Female (মহিলা)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Blood Group (রক্তের গ্রুপ)</label>
                  <select
                    value={editingDonorModal.bloodGroup}
                    onChange={(e) => setEditingDonorModal({ ...editingDonorModal, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Location / Address (এলাকা)</label>
                  <input
                    type="text"
                    value={editingDonorModal.location || ''}
                    onChange={(e) => setEditingDonorModal({ ...editingDonorModal, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Age (বয়স)</label>
                  <input
                    type="number"
                    value={editingDonorModal.age || ''}
                    onChange={(e) => setEditingDonorModal({ ...editingDonorModal, age: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Weight (ওজন)</label>
                  <input
                    type="number"
                    value={editingDonorModal.weight || ''}
                    onChange={(e) => setEditingDonorModal({ ...editingDonorModal, weight: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Hemoglobin</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingDonorModal.hemoglobin || ''}
                    onChange={(e) => setEditingDonorModal({ ...editingDonorModal, hemoglobin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Last Donation Date (শেষ রক্তদান)</label>
                  <input
                    type="date"
                    value={editingDonorModal.lastDonationDate || ''}
                    onChange={(e) => setEditingDonorModal({ ...editingDonorModal, lastDonationDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Verified Donations (মোট রক্তদান)</label>
                  <input
                    type="number"
                    value={editingDonorModal.verifiedDonations || 0}
                    onChange={(e) =>
                      setEditingDonorModal({ ...editingDonorModal, verifiedDonations: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Reward Coins (কয়েন ব্যালেন্স)</label>
                  <input
                    type="number"
                    value={editingDonorModal.coins || 0}
                    onChange={(e) => setEditingDonorModal({ ...editingDonorModal, coins: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Pending Claim Coins</label>
                  <input
                    type="number"
                    value={editingDonorModal.pendingClaimCoins || 0}
                    onChange={(e) =>
                      setEditingDonorModal({ ...editingDonorModal, pendingClaimCoins: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Account Role (পদবি)</label>
                  <select
                    value={editingDonorModal.role || 'donor'}
                    onChange={(e) => setEditingDonorModal({ ...editingDonorModal, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  >
                    <option value="donor">Donor (সাধারণ ইউজার)</option>
                    <option value="admin">Admin Coordinator</option>
                    <option value="data_entry">Data Entry Operator</option>
                    {editingDonorModal.role === 'master_admin' && <option value="master_admin">Master Admin</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Secret PIN (Staff/Admin)</label>
                  <input
                    type="text"
                    value={editingDonorModal.pin || ''}
                    onChange={(e) => setEditingDonorModal({ ...editingDonorModal, pin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold pt-1">
                <input
                  type="checkbox"
                  checked={Boolean(editingDonorModal.onMedication)}
                  onChange={(e) => setEditingDonorModal({ ...editingDonorModal, onMedication: e.target.checked })}
                  className="w-4 h-4 accent-rose-600"
                />
                <span>On Medication (বর্তমানে ওষুধ সেবন করছেন)</span>
              </label>

              <button
                onClick={async () => {
                  const { id, ...rest } = editingDonorModal;
                  await updateDoc(doc(db, 'users', id), rest);
                  setEditingDonorModal(null);
                  alert('ইউজারের সব তথ্য সফলভাবে আপডেট করা হয়েছে!');
                }}
                className={`w-full py-3 rounded-2xl font-black mt-2 ${theme.btn3d}`}
              >
                সব পরিবর্তন সেভ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* পপ-আপ ৫: লাইভ GPS লোকেশন ট্র্যাকিং মডাল */}
      {/* ==================================================================== */}
      {trackingRequestModal && trackingRequestModal.donorLiveLocation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl border p-6 space-y-4 ${theme.card}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base">📍 Donor Live Location</h3>
              <button onClick={() => setTrackingRequestModal(null)} className="p-2 rounded-xl bg-slate-200/60">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs font-bold">
              ডোনার: {trackingRequestModal.acceptedByName} • আপডেট: {trackingRequestModal.donorLiveLocation.updatedAt}
            </p>
            <div className="w-full h-56 rounded-2xl overflow-hidden border">
              <iframe
                title="Live Donor Map"
                width="100%"
                height="100%"
                frameBorder="0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                  trackingRequestModal.donorLiveLocation.lng - 0.01
                },${trackingRequestModal.donorLiveLocation.lat - 0.01},${
                  trackingRequestModal.donorLiveLocation.lng + 0.01
                },${trackingRequestModal.donorLiveLocation.lat + 0.01}&layer=mapnik&marker=${
                  trackingRequestModal.donorLiveLocation.lat
                },${trackingRequestModal.donorLiveLocation.lng}`}
              />
            </div>
            <a
              href={`https://www.google.com/maps?q=${trackingRequestModal.donorLiveLocation.lat},${trackingRequestModal.donorLiveLocation.lng}`}
              target="_blank"
              rel="noreferrer"
              className={`w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 ${theme.btn3d}`}
            >
              Google Maps-এ লাইভ দেখুন
            </a>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* পপ-আপ ৬: ইমার্জেন্সি অ্যালার্ম স্ক্রিন (বাটন চাপলে সাইরেন ও ভাইব্রেশন থামবে) */}
      {/* ==================================================================== */}
      {activeAlarmAlert && (
        <div className="fixed inset-0 z-50 bg-rose-950/90 backdrop-blur-md flex items-center justify-center p-5 text-white text-center">
          <div className="max-w-sm space-y-5">
            <div className="w-20 h-20 mx-auto rounded-full bg-rose-600 flex items-center justify-center animate-ping">
              <Volume2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black">🚨 EMERGENCY ALARM!</h2>
            <p className="text-sm font-semibold">{activeAlarmAlert.message}</p>
            <button
              onClick={async () => {
                stopContinuousAlarm();
                setActiveAlarmAlert(null);
                setActiveTab('request_blood');
                if (currentUser?.id) {
                  await updateDoc(doc(db, 'users', currentUser.id), { activeAlarm: null });
                }
              }}
              className="w-full py-4 rounded-2xl bg-white text-rose-700 font-black text-sm shadow-xl"
            >
              অ্যালার্ম বন্ধ করুন ও দেখুন
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* নোটিফিকেশন ড্রয়ার */}
      {/* ==================================================================== */}
      {showNotifDrawer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
          <div className={`w-80 h-full p-5 border-l overflow-y-auto space-y-4 ${theme.card}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base">🔔 Notifications</h3>
              <button onClick={() => setShowNotifDrawer(false)} className="p-2 rounded-xl bg-slate-200/60">
                <X className="w-4 h-4" />
              </button>
            </div>
            {myActiveRequests.length === 0 ? (
              <p className={`text-xs ${theme.textSub}`}>এই মুহূর্তে কোনো নতুন নোটিফিকেশন নেই।</p>
            ) : (
              myActiveRequests.map((r) => (
                <div key={r.id} className="p-3 rounded-2xl border border-slate-200/80 text-xs space-y-1">
                  <p className="font-black text-rose-600">{r.bloodGroup} রক্তের রিকোয়েস্ট</p>
                  <p>
                    {r.patientName} • {r.hospital}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}