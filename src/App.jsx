import React, { useState, useEffect, useRef } from "react";
import { db, rtdb } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { ref, set, onValue, update, remove, push } from "firebase/database";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  Bell,
  Phone,
  ShieldAlert,
  Search,
  MessageCircle,
  Edit3,
  Award,
  User,
  Users,
  ShieldCheck,
  Lock,
  LogOut,
  Camera,
  Trash2,
  UserCheck,
  Send,
  Droplet,
  KeyRound,
  Share2,
  Volume2,
  MessageSquare,
  Building2,
  Ambulance,
  Star,
  AlertTriangle,
  PlusCircle,
  X,
  CalendarClock,
  Car,
  Moon,
  Sun,
  Mail,
  CheckCircle2,
  Quote,
  Globe,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Radio,
  MapPin,
  HeartPulse,
  History,
  Copy,
  Clock,
} from "lucide-react";

// Master Admin Configuration
const MASTER_ADMIN_PHONE = "01345365867";
const ADMIN_SECRET_PIN = "7596";

// Emergency Blood Bank & Ambulance Directory
const EMERGENCY_DIRECTORY = [
  { name: "Sandhani (Dhaka Medical College Unit)", area: "Dhaka", phone: "01711-000000", type: "Blood Bank" },
  { name: "Quantum Lab & Blood Bank", area: "Shantinagar, Dhaka", phone: "01714-010869", type: "Blood Bank" },
  { name: "Bangladesh Red Crescent Blood Bank", area: "Mohammadpur, Dhaka", phone: "01811-458537", type: "Blood Bank" },
  { name: "Enam Medical College Blood Bank", area: "Savar, Dhaka", phone: "01716-358146", type: "Blood Bank" },
  { name: "Badhan (Jahangirnagar University Zone)", area: "Savar, Dhaka", phone: "01500-000000", type: "Blood Bank" },
  { name: "National Emergency Service (Ambulance & Police)", area: "All Bangladesh", phone: "999", type: "Ambulance" },
  { name: "Anjuman Mufidul Islam Ambulance", area: "Dhaka & Savar", phone: "01711-539634", type: "Ambulance" },
  { name: "Savar Highway Emergency Ambulance", area: "Savar, Dhaka", phone: "01712-987654", type: "Ambulance" },
];

// Leaflet Marker Icon Fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom SVG Logo
function RedPulseLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className="shrink-0 drop-shadow">
      <defs>
        <linearGradient id="rpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fee2e2" />
        </linearGradient>
      </defs>
      <circle cx="256" cy="256" r="240" fill="rgba(255,255,255,0.18)" />
      <path
        d="M256 80 C256 80 140 218 140 302 C140 366 192 418 256 418 C320 418 372 366 372 302 C372 218 256 80 256 80 Z"
        fill="url(#rpGrad)"
      />
      <path
        d="M175 302 L215 302 L232 260 L258 346 L278 282 L295 302 L337 302"
        fill="none"
        stroke="#dc2626"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Haversine Distance (km)
function getDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// 90-Day Smart Cooldown Check
function getRemainingDays(lastDate) {
  if (!lastDate) return 0;
  const diffDays = Math.floor((new Date() - new Date(lastDate)) / (1000 * 60 * 60 * 24));
  return diffDays >= 90 ? 0 : 90 - diffDays;
}

// Calculate Age from Date of Birth
function calculateAge(dobString) {
  if (!dobString) return null;
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function LocationPicker({ setHospitalPos }) {
  useMapEvents({
    click(e) {
      setHospitalPos([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function App() {
  // Smooth Midnight Dark Mode State
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("redpulse_dark") === "true");
  useEffect(() => {
    localStorage.setItem("redpulse_dark", darkMode);
  }, [darkMode]);

  // Auth State ('login' | 'register' | 'forgot')
  const [currentUser, setCurrentUser] = useState(() =>
    JSON.parse(localStorage.getItem("redpulse_user") || "null")
  );
  const [authMode, setAuthMode] = useState("login");
  const [authLoading, setAuthLoading] = useState(false);

  // Registration / Login / Reset Form Inputs
  const [phoneInput, setPhoneInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [dobInput, setDobInput] = useState("");
  const [bloodInput, setBloodInput] = useState("O+");
  const [addressInput, setAddressInput] = useState("");
  const [lastDonationInput, setLastDonationInput] = useState("");

  // Navigation & UI Visibility States
  const [activeTab, setActiveTab] = useState("radar");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showExtraFormFields, setShowExtraFormFields] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [showLiveTrackingMap, setShowLiveTrackingMap] = useState(false);
  const [userPos, setUserPos] = useState([23.8583, 90.2667]);

  // Radar & Non-Stop Siren Alarm State
  const [isStandby, setIsStandby] = useState(false);
  const [incomingAlert, setIncomingAlert] = useState(null);
  const [isTestAlert, setIsTestAlert] = useState(false);
  const [activeMission, setActiveMission] = useState(null);
  const [onlineDonorsList, setOnlineDonorsList] = useState([]);
  const [nationwideMatchingReqs, setNationwideMatchingReqs] = useState([]);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);

  const audioCtxRef = useRef(null);
  const alarmIntervalRef = useRef(null);
  const isAlarmPlayingRef = useRef(false);
  const wakeLockRef = useRef(null);

  // Seeker Request State
  const [requestType, setRequestType] = useState("emergency");
  const [neededBlood, setNeededBlood] = useState("O-");
  const [bagsNeeded, setBagsNeeded] = useState("1 Bag");
  const [urgencyReason, setUrgencyReason] = useState("Emergency Surgery");
  const [hospitalName, setHospitalName] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [transportSupport, setTransportSupport] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [scheduledList, setScheduledList] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [hospitalPos, setHospitalPos] = useState([23.8583, 90.2667]);
  const [activeRequestId, setActiveRequestId] = useState(
    localStorage.getItem("redpulse_active_req") || null
  );
  const [liveRequestData, setLiveRequestData] = useState(null);

  // Direct Chat State
  const [chatRoomId, setChatRoomId] = useState(null);
  const [chatPartnerName, setChatPartnerName] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // User Reviews State (Admin Moderated)
  const [allReviews, setAllReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Rating & Digital Certificate
  const [ratingModalDonor, setRatingModalDonor] = useState(null);
  const [selectedStars, setSelectedStars] = useState(5);
  const [showCertificate, setShowCertificate] = useState(false);

  // Directory & Banks Data
  const [allUsers, setAllUsers] = useState([]);
  const [filterBlood, setFilterBlood] = useState("ALL");
  const [filterArea, setFilterArea] = useState("");
  const [bankSearch, setBankSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Profile Edit, SOS Medical Card & Verification
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editBlood, setEditBlood] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editLastDonation, setEditLastDonation] = useState("");
  const [editEmergencyContact, setEditEmergencyContact] = useState("");
  const [editAllergies, setEditAllergies] = useState("");
  const [nidInput, setNidInput] = useState("");

  // Admin Panel State
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pinEntry, setPinEntry] = useState("");
  const [adminEditUser, setAdminEditUser] = useState(null);
  const [liveAllRequests, setLiveAllRequests] = useState([]);

  // Unlock Browser Audio Engine
  const unlockAudioEngine = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current && AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
    } catch (e) {}
  };

  // NON-STOP Dual-Tone Emergency Siren & Vibration
  const startAlarmSound = () => {
    unlockAudioEngine();
    if (isAlarmPlayingRef.current) return;
    isAlarmPlayingRef.current = true;

    let highTone = true;
    const triggerPulse = () => {
      if (!isAlarmPlayingRef.current) return;
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!audioCtxRef.current && AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(highTone ? 960 : 660, ctx.currentTime);
        highTone = !highTone;

        gain.gain.setValueAtTime(0.75, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.42);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.43);

        if (navigator.vibrate) {
          navigator.vibrate([400, 120]);
        }
      } catch (e) {}
    };

    triggerPulse();
    alarmIntervalRef.current = setInterval(triggerPulse, 480);
  };

  const stopAlarmSound = () => {
    isAlarmPlayingRef.current = false;
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
  };

  // Cleanup alarm on unmount
  useEffect(() => {
    return () => stopAlarmSound();
  }, []);

  // Test Siren Alarm Function
  const handleTestAlarm = () => {
    setShowMoreMenu(false);
    unlockAudioEngine();
    setIsTestAlert(true);
    setIncomingAlert({
      id: "test_alert",
      bloodGroup: currentUser.bloodGroup,
      bagsNeeded: "1 Bag (Test)",
      urgencyReason: "Testing Non-Stop Siren Sound",
      hospitalName: "Test Medical Hospital, Bangladesh",
      transportSupport: true,
      seekerName: "RedPulse System Test",
      seekerPhone: currentUser.phone,
      distance: "1.2",
    });
    startAlarmSound();
  };

  // Get User GPS Location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setUserPos(coords);
          if (!activeRequestId) setHospitalPos(coords);
        },
        () => {}
      );
    }
  }, [activeRequestId]);

  // Donor Online Radar Presence & Wake Lock
  useEffect(() => {
    if (!currentUser) return;
    const presenceRef = ref(rtdb, `online_donors/${currentUser.phone}`);

    if (isStandby && getRemainingDays(currentUser.lastDonation) === 0) {
      unlockAudioEngine();
      set(presenceRef, {
        name: currentUser.name,
        bloodGroup: currentUser.bloodGroup,
        lat: userPos[0],
        lng: userPos[1],
        updatedAt: Date.now(),
      });
      if ("wakeLock" in navigator) {
        navigator.wakeLock
          .request("screen")
          .then((wl) => {
            wakeLockRef.current = wl;
          })
          .catch(() => {});
      }
    } else {
      remove(presenceRef);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    }

    return () => {
      remove(presenceRef);
    };
  }, [isStandby, currentUser, userPos]);

  // Listen to Online Donors
  useEffect(() => {
    const onlineRef = ref(rtdb, "online_donors");
    return onValue(onlineRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setOnlineDonorsList([]);
      } else {
        setOnlineDonorsList(Object.entries(data).map(([phone, val]) => ({ phone, ...val })));
      }
    });
  }, []);

  // Scheduled Requests Listener
  useEffect(() => {
    const schedRef = ref(rtdb, "scheduled_requests");
    return onValue(schedRef, (snap) => {
      const data = snap.val();
      if (!data) setScheduledList([]);
      else {
        const list = Object.entries(data)
          .map(([id, val]) => ({ id, ...val }))
          .sort((a, b) => b.createdAt - a.createdAt);
        setScheduledList(list);
      }
    });
  }, []);

  // Fetch User Reviews
  const fetchReviews = async () => {
    try {
      const snap = await getDocs(collection(db, "user_reviews"));
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setAllReviews(list);
    } catch (e) {}
  };

  // Fetch All Registered Users
  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllUsers(list);
      if (currentUser) {
        const me = list.find((u) => u.phone === currentUser.phone);
        if (me) {
          const updatedMe = {
            ...me,
            isAdmin: me.phone === MASTER_ADMIN_PHONE || me.role === "admin",
          };
          setCurrentUser(updatedMe);
          localStorage.setItem("redpulse_user", JSON.stringify(updatedMe));
        }
      }
    } catch (e) {}
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (currentUser) {
      fetchAllUsers();
      fetchReviews();
    }
  }, [activeTab]);

  // Valid BD Phone Check
  const isValidBDPhone = (num) => /^01[3-9]\d{8}$/.test(num.trim());

  // Registration Handler
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isValidBDPhone(phoneInput)) {
      alert("Please enter a valid 11-digit mobile number (সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন)।");
      return;
    }
    if (!emailInput.includes("@")) {
      alert("Please enter a valid email address (সঠিক ইমেইল ঠিকানা দিন)।");
      return;
    }
    if (passwordInput.length < 4) {
      alert("Password must be at least 4 characters long (পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে)।");
      return;
    }

    setAuthLoading(true);
    try {
      const q = query(collection(db, "users"), where("phone", "==", phoneInput.trim()));
      const existing = await getDocs(q);
      if (!existing.empty) {
        alert("This phone number is already registered! Please log in.");
        setAuthMode("login");
        setAuthLoading(false);
        return;
      }

      const isOwner = phoneInput.trim() === MASTER_ADMIN_PHONE;
      const newUser = {
        name: nameInput.trim(),
        phone: phoneInput.trim(),
        email: emailInput.trim().toLowerCase(),
        dob: dobInput || "",
        password: passwordInput,
        bloodGroup: bloodInput,
        address: addressInput.trim(),
        lastDonation: lastDonationInput || "",
        donationCount: 0,
        donationHistory: [],
        emergencyContact: "",
        allergies: "None",
        verified: isOwner,
        nidInfo: isOwner ? "Master Owner" : "",
        photoUrl: "",
        ratingSum: 0,
        ratingCount: 0,
        reports: 0,
        role: isOwner ? "admin" : "user",
        createdAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, "users"), newUser);
      const userWithId = { id: docRef.id, ...newUser, isAdmin: isOwner };
      setCurrentUser(userWithId);
      localStorage.setItem("redpulse_user", JSON.stringify(userWithId));
    } catch (err) {
      alert("Registration failed. Please check your internet connection.");
    }
    setAuthLoading(false);
  };

  // Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const q = query(
        collection(db, "users"),
        where("phone", "==", phoneInput.trim()),
        where("password", "==", passwordInput)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        alert("Invalid phone number or password! (ফোন নম্বর বা পাসওয়ার্ড ভুল হয়েছে)");
      } else {
        const d = snap.docs[0];
        const data = d.data();
        const isOwner = data.phone === MASTER_ADMIN_PHONE || data.role === "admin";
        const userObj = { id: d.id, ...data, isAdmin: isOwner };
        setCurrentUser(userObj);
        localStorage.setItem("redpulse_user", JSON.stringify(userObj));
      }
    } catch (err) {
      alert("Login failed. Please try again.");
    }
    setAuthLoading(false);
  };

  // Free Forget Password Handler
  const handleForgetPassword = async (e) => {
    e.preventDefault();
    if (newPasswordInput.length < 4) {
      alert("New password must be at least 4 characters long.");
      return;
    }
    setAuthLoading(true);
    try {
      const q = query(collection(db, "users"), where("phone", "==", phoneInput.trim()));
      const snap = await getDocs(q);
      if (snap.empty) {
        alert("No account found with this phone number!");
      } else {
        const userDoc = snap.docs[0];
        const uData = userDoc.data();
        if (uData.email && uData.email.toLowerCase() === emailInput.trim().toLowerCase()) {
          await updateDoc(doc(db, "users", userDoc.id), {
            password: newPasswordInput,
          });
          alert("Password reset successful! Please log in with your new password.");
          setPasswordInput("");
          setNewPasswordInput("");
          setAuthMode("login");
        } else {
          alert("The email address does not match this phone number!");
        }
      }
    } catch (err) {
      alert("Could not reset password. Try again.");
    }
    setAuthLoading(false);
  };

  // Upload Profile Photo
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const maxSize = 220;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxSize) {
            h *= maxSize / w;
            w = maxSize;
          }
        } else {
          if (h > maxSize) {
            w *= maxSize / h;
            h = maxSize;
          }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        const compressedUrl = canvas.toDataURL("image/jpeg", 0.72);
        await updateDoc(doc(db, "users", currentUser.id), { photoUrl: compressedUrl });
        const updated = { ...currentUser, photoUrl: compressedUrl };
        setCurrentUser(updated);
        localStorage.setItem("redpulse_user", JSON.stringify(updated));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Update Profile & SOS Card Info
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const updates = {
      name: editName,
      email: editEmail.trim().toLowerCase(),
      dob: editDob,
      bloodGroup: editBlood,
      address: editAddress,
      lastDonation: editLastDonation,
      emergencyContact: editEmergencyContact.trim(),
      allergies: editAllergies.trim() || "None",
    };
    await updateDoc(doc(db, "users", currentUser.id), updates);
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    localStorage.setItem("redpulse_user", JSON.stringify(updated));
    setEditMode(false);
    alert("Profile updated successfully! (প্রোফাইল আপডেট হয়েছে)");
  };

  // NID/Student ID Verification
  const handleRequestVerify = async () => {
    if (!nidInput.trim()) return;
    await updateDoc(doc(db, "users", currentUser.id), {
      nidInfo: nidInput.trim(),
      verified: true,
    });
    const updated = { ...currentUser, nidInfo: nidInput.trim(), verified: true };
    setCurrentUser(updated);
    localStorage.setItem("redpulse_user", JSON.stringify(updated));
    alert("Congratulations! Verified Donor badge added.");
  };

  // Nationwide Matching Notification + Radar Siren Listener (Only Admin-Approved Requests)
  useEffect(() => {
    if (!currentUser) return;

    const reqRef = ref(rtdb, "emergency_requests");
    const unsubscribe = onValue(reqRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setNationwideMatchingReqs([]);
        if (!isTestAlert) {
          setIncomingAlert(null);
          stopAlarmSound();
        }
        return;
      }

      const matchingAllBD = [];
      let foundRadarReq = null;

      Object.entries(data).forEach(([key, req]) => {
        // Only broadcast requests approved by Admin (status === 'searching')
        if (
          req.status === "searching" &&
          req.bloodGroup === currentUser.bloodGroup &&
          req.seekerPhone !== currentUser.phone
        ) {
          const dist = getDistanceKm(userPos[0], userPos[1], req.hospitalLat, req.hospitalLng);
          matchingAllBD.push({ id: key, ...req, distance: dist.toFixed(1) });

          // Siren Alarm (Works when Radar is ON & within radius)
          const maxRadius = req.radiusKm || 5;
          if (
            isStandby &&
            getRemainingDays(currentUser.lastDonation) === 0 &&
            dist <= maxRadius
          ) {
            foundRadarReq = { id: key, ...req, distance: dist.toFixed(2) };
          }
        }

        // Auto 90-day Lock, History Log & Digital Certificate upon Completion
        if (activeMission && key === activeMission.id && req.status === "completed") {
          const todayStr = new Date().toISOString().split("T")[0];
          const newCount = (currentUser.donationCount || 0) + 1;
          const prevHistory = Array.isArray(currentUser.donationHistory)
            ? currentUser.donationHistory
            : [];
          const newHistory = [
            {
              date: todayStr,
              hospital: activeMission.hospitalName,
              seeker: activeMission.seekerName,
              bloodGroup: activeMission.bloodGroup,
            },
            ...prevHistory,
          ];

          updateDoc(doc(db, "users", currentUser.id), {
            lastDonation: todayStr,
            donationCount: newCount,
            donationHistory: newHistory,
          });
          const updated = {
            ...currentUser,
            lastDonation: todayStr,
            donationCount: newCount,
            donationHistory: newHistory,
          };
          setCurrentUser(updated);
          localStorage.setItem("redpulse_user", JSON.stringify(updated));
          setIsStandby(false);
          setActiveMission(null);
          setShowCertificate(true);
          remove(ref(rtdb, `emergency_requests/${key}`));
        }
      });

      setNationwideMatchingReqs(matchingAllBD.sort((a, b) => b.createdAt - a.createdAt));

      if (foundRadarReq && !activeMission) {
        setIsTestAlert(false);
        setIncomingAlert(foundRadarReq);
        startAlarmSound();
      } else if (!isTestAlert) {
        setIncomingAlert(null);
        stopAlarmSound();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, isStandby, userPos, activeMission, isTestAlert]);

  // Donor Accepts Request
  const handleAcceptRequest = (reqObj = incomingAlert) => {
    if (!reqObj) return;
    stopAlarmSound();

    if (isTestAlert) {
      setIsTestAlert(false);
      setIncomingAlert(null);
      alert("Test successful! Real emergency calls will sound the siren just like this.");
      return;
    }

    if (getRemainingDays(currentUser.lastDonation) > 0) {
      alert(`90-day safety cooldown is active (${getRemainingDays(currentUser.lastDonation)} days left).`);
      return;
    }

    const reqRef = ref(rtdb, `emergency_requests/${reqObj.id}`);
    update(reqRef, {
      status: "accepted",
      donorId: currentUser.id,
      donorName: currentUser.name,
      donorPhone: currentUser.phone,
      donorVerified: currentUser.verified || false,
      donorPhoto: currentUser.photoUrl || "",
      donorStatusMsg: "On the way to hospital",
      donorLat: userPos[0],
      donorLng: userPos[1],
    });

    setActiveMission(reqObj);
    setIncomingAlert(null);
    setShowNotifDrawer(false);

    // Real-time Live GPS Tracking
    navigator.geolocation.watchPosition((pos) => {
      update(reqRef, {
        donorLat: pos.coords.latitude,
        donorLng: pos.coords.longitude,
      });
    });
  };

  // Send Quick Status
  const sendQuickStatus = (msg) => {
    if (!activeMission) return;
    update(ref(rtdb, `emergency_requests/${activeMission.id}`), {
      donorStatusMsg: msg,
    });
    alert(`Status sent: "${msg}"`);
  };

  // Search Hospital on Map
  const handleSearchHospital = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingMap(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ", Bangladesh"
        )}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        setHospitalPos([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        if (!hospitalName) setHospitalName(data[0].display_name.split(",")[0]);
      } else {
        alert("Hospital not found. Tap on the map to set pin.");
      }
    } catch (e) {}
    setIsSearchingMap(false);
  };

  // Send Emergency or Scheduled Request (Emergency goes to Admin Approval first unless sender is Admin)
  const handleSendRequest = async (e) => {
    e.preventDefault();
    const fullHospital = districtName.trim()
      ? `${hospitalName} (${districtName.trim()})`
      : hospitalName || "Selected Hospital";

    if (requestType === "scheduled") {
      if (!scheduledDate) {
        alert("Please select a date (তারিখ নির্বাচন করুন)।");
        return;
      }
      const schedId = "sched_" + Date.now();
      await set(ref(rtdb, `scheduled_requests/${schedId}`), {
        bloodGroup: neededBlood,
        bagsNeeded,
        urgencyReason,
        hospitalName: fullHospital,
        transportSupport,
        scheduledDate,
        scheduledTime,
        seekerName: currentUser.name,
        seekerPhone: currentUser.phone,
        bookedBy: "",
        bookedDonorPhone: "",
        createdAt: Date.now(),
      });
      setHospitalName("");
      setDistrictName("");
      setScheduledDate("");
      alert("Scheduled request posted! (শিডিউল অনুরোধ পোস্ট হয়েছে)");
      return;
    }

    const reqId = "req_" + Date.now();
    const initialStatus = currentUser.isAdmin ? "searching" : "pending_admin";

    await set(ref(rtdb, `emergency_requests/${reqId}`), {
      bloodGroup: neededBlood,
      bagsNeeded,
      urgencyReason,
      hospitalName: fullHospital,
      district: districtName.trim() || "Bangladesh",
      transportSupport,
      radiusKm: 5,
      seekerName: currentUser.name,
      seekerPhone: currentUser.phone,
      hospitalLat: hospitalPos[0],
      hospitalLng: hospitalPos[1],
      status: initialStatus,
      createdAt: Date.now(),
    });
    localStorage.setItem("redpulse_active_req", reqId);
    setActiveRequestId(reqId);
    setShowLocationMap(false);
  };

  // Expand Radar Radius
  const handleExpandRadius = (newRadius) => {
    if (!activeRequestId) return;
    update(ref(rtdb, `emergency_requests/${activeRequestId}`), {
      radiusKm: newRadius,
    });
    alert(`Radar siren radius expanded to ${newRadius} km!`);
  };

  // Seeker Live Tracking Listener
  useEffect(() => {
    if (!activeRequestId) return;
    const reqRef = ref(rtdb, `emergency_requests/${activeRequestId}`);
    return onValue(reqRef, (snapshot) => {
      const val = snapshot.val();
      if (!val) {
        localStorage.removeItem("redpulse_active_req");
        setActiveRequestId(null);
        setLiveRequestData(null);
      } else {
        setLiveRequestData(val);
      }
    });
  }, [activeRequestId]);

  // Direct Live Chat
  const openDirectChat = (otherPhone, otherName) => {
    const room = [currentUser.phone, otherPhone].sort().join("_");
    setChatRoomId(room);
    setChatPartnerName(otherName);
  };

  useEffect(() => {
    if (!chatRoomId) return;
    const msgsRef = ref(rtdb, `chats/${chatRoomId}`);
    return onValue(msgsRef, (snap) => {
      const data = snap.val();
      if (!data) setChatMessages([]);
      else setChatMessages(Object.values(data));
    });
  }, [chatRoomId]);

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatRoomId) return;
    await push(ref(rtdb, `chats/${chatRoomId}`), {
      senderPhone: currentUser.phone,
      senderName: currentUser.name,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
    setChatInput("");
  };

  // Submit User Review (Goes to Admin for Approval)
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    setSubmittingReview(true);
    try {
      await addDoc(collection(db, "user_reviews"), {
        userName: currentUser.name,
        userPhone: currentUser.phone,
        userBlood: currentUser.bloodGroup,
        rating: reviewRating,
        comment: reviewText.trim(),
        approved: false,
        createdAt: Date.now(),
      });
      setReviewText("");
      setReviewRating(5);
      alert("Thank you! Your review has been sent to Admin for approval.");
      fetchReviews();
    } catch (err) {
      alert("Failed to submit review.");
    }
    setSubmittingReview(false);
  };

  // Post-Donation Star Rating
  const handleSubmitRating = async () => {
    if (!ratingModalDonor?.donorId) {
      setRatingModalDonor(null);
      return;
    }
    try {
      const targetUser = allUsers.find((u) => u.id === ratingModalDonor.donorId);
      if (targetUser) {
        await updateDoc(doc(db, "users", targetUser.id), {
          ratingSum: (targetUser.ratingSum || 0) + selectedStars,
          ratingCount: (targetUser.ratingCount || 0) + 1,
        });
      }
    } catch (e) {}
    setRatingModalDonor(null);
    alert("Thank you for rating the donor!");
  };

  // Report Fake User
  const handleReportUser = async (userObj) => {
    if (!window.confirm(`Report ${userObj.name}?`)) return;
    await updateDoc(doc(db, "users", userObj.id), {
      reports: (userObj.reports || 0) + 1,
    });
    alert("Report submitted. Admin will review this account.");
    fetchAllUsers();
  };

  // Admin Live Requests Listener (Always active for Admins so they see pending badge)
  useEffect(() => {
    if (!currentUser?.isAdmin) return;
    const reqRef = ref(rtdb, "emergency_requests");
    return onValue(reqRef, (snap) => {
      const data = snap.val();
      if (!data) setLiveAllRequests([]);
      else setLiveAllRequests(Object.entries(data).map(([id, val]) => ({ id, ...val })));
    });
  }, [currentUser]);

  // Admin Unlock
  const handleAdminUnlock = (e) => {
    e.preventDefault();
    if (pinEntry === ADMIN_SECRET_PIN) {
      setAdminUnlocked(true);
      fetchAllUsers();
      fetchReviews();
    } else {
      alert("Wrong Secret PIN!");
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("redpulse_user");
    setCurrentUser(null);
    setIsStandby(false);
    setAdminUnlocked(false);
    setShowMoreMenu(false);
  };

  // Smooth Midnight Dark Mode & 3D Button Styling Helpers
  const pageBg = darkMode
    ? "bg-[#0B1120] text-slate-100"
    : "bg-slate-50 text-slate-900";
  const cardBg = darkMode
    ? "bg-[#111827]/95 border-slate-800/90 text-slate-100 shadow-xl shadow-black/30"
    : "bg-white border-slate-200/80 text-slate-800 shadow-md shadow-slate-200/50";
  const inputBg = darkMode
    ? "bg-[#1E293B] border-slate-700 text-white placeholder-slate-400 focus:border-red-500"
    : "bg-slate-50 border-slate-200 text-slate-900 focus:border-red-500";
  const subText = darkMode ? "text-slate-400" : "text-slate-500";

  // 3D Tactile Button Styles
  const btn3DRed =
    "bg-gradient-to-b from-red-500 to-red-600 hover:from-red-500 hover:to-red-700 text-white font-extrabold border-b-4 border-red-800 active:border-b-0 active:translate-y-0.5 shadow-lg shadow-red-600/25 transition-all";
  const btn3DGreen =
    "bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white font-extrabold border-b-4 border-emerald-800 active:border-b-0 active:translate-y-0.5 shadow-lg shadow-emerald-600/25 transition-all";
  const btn3DDark =
    "bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-800 text-white font-bold border-b-4 border-slate-950 active:border-b-0 active:translate-y-0.5 shadow-md transition-all";
  const btn3DBlue =
    "bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-bold border-b-4 border-blue-800 active:border-b-0 active:translate-y-0.5 shadow-md transition-all";

  /* ============================================================================
     1. LOGIN, REGISTRATION & FORGET PASSWORD SCREEN
     ============================================================================ */
  if (!currentUser) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors ${
          darkMode
            ? "bg-[#0B1120] text-white"
            : "bg-gradient-to-br from-rose-50 via-white to-red-100 text-slate-900"
        }`}
      >
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="fixed top-4 right-4 z-20 p-2.5 rounded-full bg-white/15 backdrop-blur border border-red-400/30 shadow-lg"
          title="Dark/Light Mode"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-red-700" />}
        </button>

        <Droplet className="w-64 h-64 text-red-500/10 fixed -top-10 -left-10 rotate-12 pointer-events-none" />
        <Droplet className="w-80 h-80 text-red-600/10 fixed -bottom-16 -right-16 -rotate-12 pointer-events-none" />

        <div className={`w-full max-w-md rounded-3xl border p-6 z-10 ${cardBg}`}>
          <div className="flex flex-col items-center text-center mb-5">
            <div className="bg-gradient-to-b from-red-500 to-red-700 p-3 rounded-2xl shadow-lg border-b-4 border-red-900 mb-2">
              <RedPulseLogo size={42} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">RedPulse</h1>
            <p className="text-xs text-red-500 font-semibold">
              Emergency Blood Radar • জরুরি রক্তের নেটওয়ার্ক
            </p>
          </div>

          {authMode !== "forgot" && (
            <div className={`flex p-1 rounded-2xl mb-5 ${darkMode ? "bg-slate-800/80" : "bg-red-50"}`}>
              <button
                onClick={() => setAuthMode("login")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition ${
                  authMode === "login"
                    ? "bg-red-600 text-white shadow"
                    : darkMode
                    ? "text-slate-300"
                    : "text-red-700"
                }`}
              >
                Login (লগইন)
              </button>
              <button
                onClick={() => setAuthMode("register")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition ${
                  authMode === "register"
                    ? "bg-red-600 text-white shadow"
                    : darkMode
                    ? "text-slate-300"
                    : "text-red-700"
                }`}
              >
                Register (নতুন অ্যাকাউন্ট)
              </button>
            </div>
          )}

          {authMode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Phone Number (মোবাইল নম্বর)</label>
                <input
                  required
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className={`w-full border rounded-xl p-3 text-sm outline-none ${inputBg}`}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold">Password (পাসওয়ার্ড)</label>
                  <button
                    type="button"
                    onClick={() => setAuthMode("forgot")}
                    className="text-xs text-red-500 font-bold hover:underline"
                  >
                    Forget Password?
                  </button>
                </div>
                <input
                  required
                  type="password"
                  placeholder="Enter your password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className={`w-full border rounded-xl p-3 text-sm outline-none ${inputBg}`}
                />
              </div>
              <button
                disabled={authLoading}
                type="submit"
                className={`w-full py-3.5 rounded-2xl text-sm ${btn3DRed}`}
              >
                {authLoading ? "Checking..." : "Login Now • প্রবেশ করুন"}
              </button>
            </form>
          )}

          {authMode === "forgot" && (
            <form onSubmit={handleForgetPassword} className="space-y-3.5">
              <div className="text-center mb-2">
                <h3 className="font-extrabold text-base text-red-500">
                  Reset Password (পাসওয়ার্ড রিসেট)
                </h3>
                <p className={`text-xs ${subText}`}>
                  Enter registered Phone & Email to set a new password
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Phone Number (ফোন নম্বর)</label>
                <input
                  required
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className={`w-full border rounded-xl p-2.5 text-sm ${inputBg}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Email Address (ইমেইল)</label>
                <input
                  required
                  type="email"
                  placeholder="example@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className={`w-full border rounded-xl p-2.5 text-sm ${inputBg}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">New Password (নতুন পাসওয়ার্ড)</label>
                <input
                  required
                  type="password"
                  placeholder="Min 4 characters"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className={`w-full border rounded-xl p-2.5 text-sm ${inputBg}`}
                />
              </div>
              <button
                disabled={authLoading}
                type="submit"
                className={`w-full py-3 rounded-2xl text-sm ${btn3DRed}`}
              >
                {authLoading ? "Updating..." : "Set New Password • সেভ করুন"}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className="w-full text-xs text-center text-slate-400 font-bold pt-1"
              >
                ← Back to Login (ফিরে যান)
              </button>
            </form>
          )}

          {authMode === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-0.5">Full Name (আপনার নাম)</label>
                <input
                  required
                  type="text"
                  placeholder="EX: Mohammad Rejwan Islam"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className={`w-full border rounded-xl p-2.5 text-sm ${inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold mb-0.5">Phone (ফোন নম্বর)</label>
                  <input
                    required
                    type="tel"
                    placeholder="017XXXXXXXX"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className={`w-full border rounded-xl p-2.5 text-sm ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-0.5">Password (পাসওয়ার্ড)</label>
                  <input
                    required
                    type="password"
                    placeholder="Min 4 characters"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className={`w-full border rounded-xl p-2.5 text-sm ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold mb-0.5">Email (ইমেইল)</label>
                  <input
                    required
                    type="email"
                    placeholder="name@gmail.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className={`w-full border rounded-xl p-2.5 text-xs ${inputBg}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-0.5">Date of Birth (জন্মতারিখ)</label>
                  <input
                    required
                    type="date"
                    value={dobInput}
                    onChange={(e) => setDobInput(e.target.value)}
                    className={`w-full border rounded-xl p-2.5 text-xs ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold mb-0.5">Blood Group (রক্তের গ্রুপ)</label>
                  <select
                    value={bloodInput}
                    onChange={(e) => setBloodInput(e.target.value)}
                    className="w-full border border-red-300 rounded-xl p-2.5 text-sm font-extrabold text-red-600 bg-red-50"
                  >
                    {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-0.5">Last Donation (শেষ রক্তদান)</label>
                  <input
                    type="date"
                    value={lastDonationInput}
                    onChange={(e) => setLastDonationInput(e.target.value)}
                    className={`w-full border rounded-xl p-2.5 text-xs ${inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-0.5">District & Area (জেলা ও এলাকা)</label>
                <input
                  required
                  type="text"
                  placeholder="EX: Savar, Dhaka"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  className={`w-full border rounded-xl p-2.5 text-sm ${inputBg}`}
                />
              </div>

              <button
                disabled={authLoading}
                type="submit"
                className={`w-full py-3.5 rounded-2xl text-sm mt-1 ${btn3DRed}`}
              >
                {authLoading ? "Creating Account..." : "Complete Registration • সম্পন্ন করুন"}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  /* ============================================================================
     2. MAIN APP DASHBOARD
     ============================================================================ */
  const userAge = calculateAge(currentUser.dob);
  const liveDistanceKm =
    liveRequestData?.donorLat && liveRequestData?.hospitalLat
      ? getDistanceKm(
          liveRequestData.donorLat,
          liveRequestData.donorLng,
          liveRequestData.hospitalLat,
          liveRequestData.hospitalLng
        )
      : null;
  const estimatedMinutes = liveDistanceKm !== null ? Math.max(2, Math.round(liveDistanceKm * 4)) : null;

  const filteredDirectory = allUsers.filter((u) => {
    const matchBlood = filterBlood === "ALL" || u.bloodGroup === filterBlood;
    const matchArea =
      !filterArea.trim() || u.address?.toLowerCase().includes(filterArea.toLowerCase());
    return matchBlood && matchArea;
  });

  const filteredBanks = EMERGENCY_DIRECTORY.filter(
    (item) =>
      item.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
      item.area.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const topHeroes = [...allUsers]
    .filter((u) => (u.donationCount || 0) > 0)
    .sort((a, b) => (b.donationCount || 0) - (a.donationCount || 0))
    .slice(0, 10);

  const approvedReviews = allReviews.filter((r) => r.approved === true);
  const pendingReviews = allReviews.filter((r) => !r.approved);
  const pendingAdminRequests = liveAllRequests.filter((r) => r.status === "pending_admin");

  return (
    <div className={`min-h-screen font-sans pb-24 relative transition-colors duration-300 ${pageBg}`}>
      {/* CLEAN TOP HEADER */}
      <header className="bg-gradient-to-r from-red-700 via-red-600 to-rose-600 text-white px-4 py-3 shadow-lg flex justify-between items-center sticky top-0 z-40">
        <div
          onClick={() => setActiveTab("radar")}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <RedPulseLogo size={34} />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight leading-none">RedPulse</h1>
            <span className="text-[10px] text-rose-100 font-medium flex items-center gap-1">
              <Globe className="w-2.5 h-2.5" /> BD Blood Radar • রক্তের নেটওয়ার্ক
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          {/* Notification Bell */}
          <button
            onClick={() => setShowNotifDrawer(!showNotifDrawer)}
            className="relative p-2 bg-white/15 hover:bg-white/25 rounded-full transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {nationwideMatchingReqs.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                {nationwideMatchingReqs.length}
              </span>
            )}
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 bg-white/15 hover:bg-white/25 rounded-full transition"
            title="Dark / Light Mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* 3-Dot More Menu Button */}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="relative p-2 bg-white/15 hover:bg-white/25 rounded-full transition"
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
            {currentUser.isAdmin && pendingAdminRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-purple-400 text-slate-950 text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                {pendingAdminRequests.length}
              </span>
            )}
          </button>

          {/* 3-Dot Dropdown Drawer */}
          {showMoreMenu && (
            <div
              className={`absolute right-0 top-12 w-64 rounded-2xl shadow-2xl border py-2 z-50 text-xs font-bold ${
                darkMode
                  ? "bg-[#111827] border-slate-700 text-slate-100"
                  : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              <button
                onClick={() => {
                  setActiveTab("banks");
                  setShowMoreMenu(false);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-red-500/10 flex items-center gap-2.5"
              >
                <Building2 className="w-4 h-4 text-red-500" /> Blood Banks & Ambulance (ব্লাড ব্যাংক)
              </button>

              <button
                onClick={() => {
                  setActiveTab("heroes");
                  setShowMoreMenu(false);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-red-500/10 flex items-center gap-2.5"
              >
                <Award className="w-4 h-4 text-amber-500" /> Top Heroes (সেরা রক্তদাতা)
              </button>

              <button
                onClick={() => {
                  setActiveTab("reviews");
                  setShowMoreMenu(false);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-red-500/10 flex items-center gap-2.5"
              >
                <Star className="w-4 h-4 text-emerald-500" /> User Reviews (মতামত ও রিভিউ)
              </button>

              <button
                onClick={handleTestAlarm}
                className="w-full px-4 py-2.5 text-left hover:bg-red-500/10 flex items-center gap-2.5"
              >
                <Volume2 className="w-4 h-4 text-blue-500" /> Test Siren Alarm (অ্যালার্ম টেস্ট)
              </button>

              {currentUser.isAdmin && (
                <button
                  onClick={() => {
                    setActiveTab("admin");
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-purple-500/10 text-purple-400 flex items-center justify-between border-t border-slate-500/20"
                >
                  <span className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4" /> Admin Panel (অ্যাডমিন)
                  </span>
                  {pendingAdminRequests.length > 0 && (
                    <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                      {pendingAdminRequests.length} New
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left hover:bg-red-500/10 text-red-500 flex items-center gap-2.5 border-t border-slate-500/20"
              >
                <LogOut className="w-4 h-4" /> Logout (লগআউট)
              </button>
            </div>
          )}
        </div>
      </header>

      {/* NATIONWIDE MATCHING NOTIFICATIONS DRAWER */}
      {showNotifDrawer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-start pt-16 p-4">
          <div className={`w-full max-w-md rounded-3xl border p-4 space-y-3 ${cardBg}`}>
            <div className="flex justify-between items-center border-b pb-2.5 border-slate-500/20">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-red-500">
                <Bell className="w-4 h-4" /> Verified {currentUser.bloodGroup} Requests (
                {nationwideMatchingReqs.length})
              </h3>
              <button onClick={() => setShowNotifDrawer(false)} className="p-1.5 rounded-xl bg-red-500/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            {nationwideMatchingReqs.length === 0 ? (
              <p className={`text-xs text-center py-6 ${subText}`}>
                No verified blood requests for ({currentUser.bloodGroup}) right now.
                <br />
                বর্তমানে আপনার গ্রুপের কোনো জরুরি অনুরোধ নেই।
              </p>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {nationwideMatchingReqs.map((req) => (
                  <div
                    key={req.id}
                    className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                      darkMode ? "bg-slate-800/80 border-slate-700" : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="bg-red-600 text-white font-extrabold px-2.5 py-0.5 rounded-lg">
                        {req.bloodGroup} • {req.bagsNeeded}
                      </span>
                      <span className="text-[11px] font-bold text-amber-500">
                        ~{req.distance} km away
                      </span>
                    </div>
                    <p className="font-bold">Hospital: {req.hospitalName}</p>
                    <p className={subText}>
                      Reason: {req.urgencyReason} • Seeker: {req.seekerName}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleAcceptRequest(req)}
                        className={`flex-1 py-2 rounded-xl text-xs ${btn3DGreen}`}
                      >
                        I am Coming • আমি আসছি
                      </button>
                      <a
                        href={`tel:${req.seekerPhone}`}
                        className={`px-3.5 py-2 rounded-xl text-xs flex items-center ${btn3DBlue}`}
                      >
                        Call
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL-SCREEN NON-STOP EMERGENCY SIREN ALARM */}
      {incomingAlert && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-red-900 via-red-700 to-rose-700 text-white flex flex-col items-center justify-center p-5 text-center">
          <div className="bg-white/15 p-4 rounded-full mb-3 animate-ping">
            <ShieldAlert className="w-14 h-14 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold">
            {isTestAlert ? "Siren Alarm Test! (অ্যালার্ম টেস্ট)" : "Emergency Blood Needed! (জরুরি রক্ত প্রয়োজন)"}
          </h2>
          <div className="bg-white text-red-700 px-5 py-1.5 rounded-full font-extrabold text-base my-2.5 shadow-lg">
            {incomingAlert.bloodGroup} • {incomingAlert.bagsNeeded} ({incomingAlert.distance} km)
          </div>

          {incomingAlert.transportSupport && (
            <span className="bg-emerald-400 text-slate-950 text-xs font-extrabold px-3.5 py-1 rounded-full mb-2 flex items-center gap-1">
              <Car className="w-3.5 h-3.5" /> Travel cost covered (যাতায়াত খরচ দেওয়া হবে)
            </span>
          )}

          <p className="text-xs bg-black/30 px-3.5 py-1.5 rounded-xl mb-2">
            Reason: {incomingAlert.urgencyReason}
          </p>
          <p className="text-base font-bold">Hospital: {incomingAlert.hospitalName}</p>
          <p className="text-xs opacity-90 mb-6">
            Seeker: {incomingAlert.seekerName} ({incomingAlert.seekerPhone})
          </p>

          <div className="flex gap-3 w-full max-w-sm">
            <button
              onClick={() => handleAcceptRequest(incomingAlert)}
              className={`flex-1 py-4 rounded-2xl text-sm ${btn3DGreen}`}
            >
              {isTestAlert ? "Stop Alarm • ঠিক আছে" : "I am Coming • আমি আসছি"}
            </button>
            <button
              onClick={() => {
                stopAlarmSound();
                setIsTestAlert(false);
                setIncomingAlert(null);
              }}
              className={`px-5 py-4 rounded-2xl text-xs ${btn3DDark}`}
            >
              Busy Now • ব্যস্ত
            </button>
          </div>
        </div>
      )}

      {/* DIGITAL DONATION CERTIFICATE */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-red-600 via-rose-700 to-red-900 text-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border-4 border-amber-300 relative">
            <Award className="w-16 h-16 text-amber-300 mx-auto mb-2" />
            <h3 className="text-xs uppercase tracking-widest text-amber-200 font-bold">
              RedPulse Lifesaver Certificate
            </h3>
            <h2 className="text-2xl font-extrabold mt-1">Thank You, {currentUser.name}!</h2>
            <p className="text-sm text-rose-100 mt-2">
              Your blood donation saved a precious life today. Total Donations:{" "}
              <b>{currentUser.donationCount} Times</b>.
            </p>
            <div className="mt-4 bg-white/15 rounded-xl p-2.5 text-xs">
              Date: {new Date().toLocaleDateString()} • Group: {currentUser.bloodGroup}
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `I donated blood today via RedPulse to help save a life! Join now: https://rokto-bondhu-eight.vercel.app`
                  );
                  alert("Certificate text copied!");
                }}
                className="flex-1 bg-amber-400 text-slate-950 font-extrabold py-3 rounded-2xl text-xs border-b-4 border-amber-600 flex items-center justify-center gap-1"
              >
                <Share2 className="w-4 h-4" /> Share (শেয়ার)
              </button>
              <button
                onClick={() => setShowCertificate(false)}
                className="bg-white/20 px-4 py-3 rounded-2xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP DIRECT CHAT MODAL */}
      {chatRoomId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className={`w-full max-w-md rounded-3xl border overflow-hidden flex flex-col h-[70vh] ${cardBg}`}>
            <div className="bg-red-600 text-white p-3.5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">{chatPartnerName}</h3>
                <span className="text-[10px] text-rose-100">Direct Live Chat • সরাসরি চ্যাট</span>
              </div>
              <button onClick={() => setChatRoomId(null)} className="p-1.5 bg-red-700 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-2">
              {chatMessages.length === 0 ? (
                <p className={`text-center text-xs mt-10 ${subText}`}>
                  Write a message below... (মেসেজ লিখুন)
                </p>
              ) : (
                chatMessages.map((m, idx) => {
                  const isMe = m.senderPhone === currentUser.phone;
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col max-w-[80%] ${
                        isMe ? "ml-auto items-end" : "mr-auto items-start"
                      }`}
                    >
                      <div
                        className={`px-3.5 py-2 rounded-2xl text-xs ${
                          isMe
                            ? "bg-red-600 text-white rounded-br-none"
                            : darkMode
                            ? "bg-slate-800 text-white rounded-bl-none"
                            : "bg-slate-100 text-slate-800 rounded-bl-none"
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5">{m.time}</span>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendChatMessage} className="p-2.5 border-t border-slate-500/20 flex gap-2">
              <input
                type="text"
                placeholder="Type message... (মেসেজ লিখুন)"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className={`flex-1 border rounded-xl px-3 py-2 text-xs outline-none ${inputBg}`}
              />
              <button type="submit" className={`px-4 py-2 rounded-xl text-xs flex items-center gap-1 ${btn3DRed}`}>
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* POST-DONATION STAR RATING MODAL */}
      {ratingModalDonor && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`rounded-3xl p-5 max-w-xs w-full text-center space-y-3 border ${cardBg}`}>
            <h3 className="font-extrabold">Rate Your Donor (ডোনারকে রেটিং দিন)</h3>
            <p className={`text-xs ${subText}`}>
              How many stars would you give to <b>{ratingModalDonor.donorName}</b>?
            </p>
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedStars(num)}
                  className={`p-1 ${selectedStars >= num ? "text-amber-400" : "text-slate-500"}`}
                >
                  <Star className="w-7 h-7 fill-current" />
                </button>
              ))}
            </div>
            <button onClick={handleSubmitRating} className={`w-full py-3 rounded-2xl text-xs ${btn3DRed}`}>
              Submit Rating • জমা দিন
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="max-w-xl mx-auto p-4 space-y-4">
        {/* ================= TAB 1: CLEAN HIDDEN-MAP RADAR HOME ================= */}
        {activeTab === "radar" && (
          <>
            {/* 1. SLIM 1-LINE LIVE STATUS BAR */}
            <div className={`rounded-2xl px-4 py-3 border flex items-center justify-between ${cardBg}`}>
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isStandby ? "bg-emerald-400" : "bg-red-400"
                    }`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${
                      isStandby ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  ></span>
                </span>
                <div>
                  <div className="text-xs font-extrabold flex items-center gap-1.5">
                    <span>{onlineDonorsList.length} Online</span>
                    <span className="text-slate-400">•</span>
                    <span className={isStandby ? "text-emerald-500" : "text-red-500"}>
                      {isStandby ? "Radar ON (চালু)" : "Radar OFF (বন্ধ)"}
                    </span>
                  </div>
                  <p className={`text-[10px] ${subText}`}>
                    {getRemainingDays(currentUser.lastDonation) > 0
                      ? `Cooldown: ${getRemainingDays(currentUser.lastDonation)} days left`
                      : "Turn ON for emergency siren alerts"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  const rem = getRemainingDays(currentUser.lastDonation);
                  if (!isStandby && rem > 0) {
                    alert(`For safe blood donation, please wait ${rem} more days.`);
                    return;
                  }
                  if (!isStandby && userAge !== null && userAge < 18) {
                    alert("Note: Safe blood donation age in Bangladesh is 18+ years.");
                  }
                  unlockAudioEngine();
                  setIsStandby(!isStandby);
                }}
                className={`px-3.5 py-2 rounded-xl text-[11px] ${
                  isStandby ? btn3DDark : btn3DGreen
                }`}
              >
                {isStandby ? "Turn OFF" : "Turn ON • চালু"}
              </button>
            </div>

            {/* Nationwide Alert Strip (When Radar is OFF) */}
            {nationwideMatchingReqs.length > 0 && !isStandby && (
              <div
                onClick={() => setShowNotifDrawer(true)}
                className="bg-amber-500/15 border border-amber-500/40 text-amber-500 px-3.5 py-2.5 rounded-2xl flex items-center justify-between text-xs font-extrabold cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Bell className="w-4 h-4 animate-bounce" />
                  {nationwideMatchingReqs.length} urgent {currentUser.bloodGroup} calls (জরুরি অনুরোধ)
                </span>
                <span>View →</span>
              </div>
            )}

            {/* ACTIVE DONOR MISSION CARD */}
            {activeMission && (
              <div className="bg-amber-500/15 border-2 border-amber-500 p-4 rounded-3xl space-y-3">
                <div className="font-extrabold text-amber-500 text-sm">
                  Active Mission: {activeMission.hospitalName} ({activeMission.bloodGroup})
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={`tel:${activeMission.seekerPhone}`}
                    className={`py-2.5 rounded-xl text-center text-xs ${btn3DGreen}`}
                  >
                    Call (কল)
                  </a>
                  <button
                    onClick={() => openDirectChat(activeMission.seekerPhone, activeMission.seekerName)}
                    className={`py-2.5 rounded-xl text-center text-xs ${btn3DRed}`}
                  >
                    Chat (চ্যাট)
                  </button>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeMission.hospitalLat},${activeMission.hospitalLng}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`py-2.5 rounded-xl text-center text-xs ${btn3DBlue}`}
                  >
                    Map (ম্যাপ)
                  </a>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["On my way (আসছি)", "10 mins left (১০ মিনিট বাকি)", "At hospital gate (গেটে আছি)"].map(
                    (msg) => (
                      <button
                        key={msg}
                        onClick={() => sendQuickStatus(msg)}
                        className={`border text-[11px] px-2.5 py-1 rounded-xl font-semibold ${
                          darkMode
                            ? "bg-slate-800 border-slate-700 text-slate-200"
                            : "bg-white border-amber-300 text-amber-900"
                        }`}
                      >
                        {msg}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* 2. CLEAN BOTTOM-SHEET STYLE REQUEST CARD */}
            <div className={`rounded-3xl border p-4 space-y-4 ${cardBg}`}>
              {/* Clean Underline Tabs: Emergency | Schedule */}
              {!activeRequestId && (
                <div className="flex border-b border-slate-500/20">
                  <button
                    type="button"
                    onClick={() => setRequestType("emergency")}
                    className={`flex-1 pb-2.5 text-xs font-extrabold border-b-2 transition ${
                      requestType === "emergency"
                        ? "border-red-500 text-red-500"
                        : `border-transparent ${subText}`
                    }`}
                  >
                    Emergency (জরুরি রক্ত)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestType("scheduled")}
                    className={`flex-1 pb-2.5 text-xs font-extrabold border-b-2 transition ${
                      requestType === "scheduled"
                        ? "border-red-500 text-red-500"
                        : `border-transparent ${subText}`
                    }`}
                  >
                    Schedule (শিডিউল • {scheduledList.length})
                  </button>
                </div>
              )}

              {!activeRequestId ? (
                <>
                  <form onSubmit={handleSendRequest} className="space-y-3.5">
                    {/* Side-by-Side 2 Core Inputs */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold mb-1">
                          Blood (রক্তের গ্রুপ)
                        </label>
                        <select
                          value={neededBlood}
                          onChange={(e) => setNeededBlood(e.target.value)}
                          className="w-full border border-red-300 rounded-xl p-2.5 font-extrabold text-red-600 bg-red-50 text-sm"
                        >
                          {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                            <option key={bg} value={bg}>
                              {bg}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold mb-1">
                          Hospital Name (হাসপাতালের নাম)
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="EX: Enam Medical, Savar"
                          value={hospitalName}
                          onChange={(e) => setHospitalName(e.target.value)}
                          className={`w-full border rounded-xl p-2.5 text-sm outline-none ${inputBg}`}
                        />
                      </div>
                    </div>

                    {requestType === "scheduled" && (
                      <div className="grid grid-cols-2 gap-2.5 bg-amber-500/10 p-3 rounded-2xl border border-amber-500/30">
                        <div>
                          <label className="block text-[11px] font-bold">Date (তারিখ)</label>
                          <input
                            required
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className={`mt-1 w-full border rounded-xl p-2 text-xs ${inputBg}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold">Time (সময়)</label>
                          <input
                            required
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className={`mt-1 w-full border rounded-xl p-2 text-xs ${inputBg}`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Action Row: + Add more details & Set on Map toggle */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <button
                        type="button"
                        onClick={() => setShowExtraFormFields(!showExtraFormFields)}
                        className={`font-bold flex items-center gap-1 hover:text-red-500 ${subText}`}
                      >
                        <span>+ Add details (আরও তথ্য)</span>
                        {showExtraFormFields ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {requestType === "emergency" && (
                        <button
                          type="button"
                          onClick={() => setShowLocationMap(!showLocationMap)}
                          className="font-bold text-red-500 flex items-center gap-1 bg-red-500/10 px-2.5 py-1 rounded-lg"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          {showLocationMap ? "Hide Map (ম্যাপ লুকান)" : "Set on Map (ম্যাপে পিন)"}
                        </button>
                      )}
                    </div>

                    {/* Collapsible Extra Details */}
                    {showExtraFormFields && (
                      <div className="space-y-3 pt-2 border-t border-slate-500/20">
                        <div>
                          <label className="block text-[11px] font-bold mb-1">
                            District / Area (জেলা ও এলাকা)
                          </label>
                          <input
                            type="text"
                            placeholder="EX: Savar, Dhaka / Chittagong"
                            value={districtName}
                            onChange={(e) => setDistrictName(e.target.value)}
                            className={`w-full border rounded-xl p-2.5 text-xs ${inputBg}`}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold mb-1">Bags (কত ব্যাগ)</label>
                            <select
                              value={bagsNeeded}
                              onChange={(e) => setBagsNeeded(e.target.value)}
                              className={`w-full border rounded-xl p-2 text-xs font-semibold ${inputBg}`}
                            >
                              <option value="1 Bag">1 Bag (১ ব্যাগ)</option>
                              <option value="2 Bags">2 Bags (২ ব্যাগ)</option>
                              <option value="3+ Bags">3+ Bags (৩+ ব্যাগ)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold mb-1">Reason (কারণ)</label>
                            <select
                              value={urgencyReason}
                              onChange={(e) => setUrgencyReason(e.target.value)}
                              className={`w-full border rounded-xl p-2 text-xs font-semibold ${inputBg}`}
                            >
                              <option value="Emergency Surgery">Surgery (অপারেশন)</option>
                              <option value="Delivery / C-Section">Delivery (ডেলিভারি)</option>
                              <option value="Road Accident">Accident (দুর্ঘটনা)</option>
                              <option value="Thalassemia">Thalassemia (থ্যালাসেমিয়া)</option>
                            </select>
                          </div>
                        </div>

                        <label className="flex items-center gap-2 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={transportSupport}
                            onChange={(e) => setTransportSupport(e.target.checked)}
                            className="accent-emerald-600 w-4 h-4"
                          />
                          <span className="text-xs font-semibold flex items-center gap-1">
                            <Car className="w-4 h-4 text-emerald-500" /> Travel cost covered (যাতায়াত খরচ দেওয়া হবে)
                          </span>
                        </label>
                      </div>
                    )}

                    {/* HIDDEN BY DEFAULT: Opens only when user taps "Set on Map" */}
                    {requestType === "emergency" && showLocationMap && (
                      <div className="space-y-2 pt-2 border-t border-slate-500/20">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Search hospital on map..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`flex-1 border rounded-xl p-2 text-xs ${inputBg}`}
                          />
                          <button
                            type="button"
                            onClick={handleSearchHospital}
                            disabled={isSearchingMap}
                            className={`px-3 rounded-xl text-xs flex items-center gap-1 ${btn3DDark}`}
                          >
                            <Search className="w-3.5 h-3.5" /> {isSearchingMap ? "..." : "Find"}
                          </button>
                        </div>

                        <div className="h-44 rounded-2xl overflow-hidden border border-slate-500/30">
                          <MapContainer center={hospitalPos} zoom={14} className="h-full w-full">
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <MapRecenter center={hospitalPos} />
                            <LocationPicker setHospitalPos={setHospitalPos} />
                            <Marker position={hospitalPos}>
                              <Popup>Hospital Location</Popup>
                            </Marker>
                            <Circle
                              center={hospitalPos}
                              radius={5000}
                              pathOptions={{ color: "#dc2626", fillOpacity: 0.08 }}
                            />
                          </MapContainer>
                        </div>
                        <p className={`text-[10px] text-center ${subText}`}>
                          Tap anywhere on map to pin exact hospital location
                        </p>
                      </div>
                    )}

                    <button type="submit" className={`w-full py-3.5 rounded-2xl text-xs ${btn3DRed}`}>
                      {requestType === "emergency"
                        ? "Request Blood Now • রক্তের অনুরোধ পাঠান"
                        : "Post Schedule • শিডিউল পোস্ট করুন"}
                    </button>
                  </form>

                  {/* Show Scheduled List ONLY inside Schedule Tab */}
                  {requestType === "scheduled" && scheduledList.length > 0 && (
                    <div className="pt-3 border-t border-slate-500/20 space-y-2.5">
                      <h4 className="text-xs font-extrabold text-amber-500">
                        Upcoming Scheduled Requests ({scheduledList.length})
                      </h4>
                      {scheduledList.map((item) => (
                        <div
                          key={item.id}
                          className={`border rounded-2xl p-3 text-xs space-y-1.5 ${
                            darkMode ? "bg-slate-800/70 border-slate-700" : "bg-amber-50/70 border-amber-200"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="bg-red-600 text-white font-extrabold px-2 py-0.5 rounded-lg">
                              {item.bloodGroup} • {item.bagsNeeded}
                            </span>
                            <span className="font-bold text-amber-500">
                              {item.scheduledDate} ({item.scheduledTime})
                            </span>
                          </div>
                          <p className="font-bold">Hospital: {item.hospitalName}</p>
                          <div className="pt-1 flex items-center justify-between">
                            {item.bookedBy ? (
                              <span className="text-emerald-500 font-bold">
                                Booked by: {item.bookedBy}
                              </span>
                            ) : item.seekerPhone !== currentUser.phone ? (
                              <button
                                onClick={() => {
                                  update(ref(rtdb, `scheduled_requests/${item.id}`), {
                                    bookedBy: currentUser.name,
                                    bookedDonorPhone: currentUser.phone,
                                  });
                                  alert("Booked successfully!");
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs ${btn3DGreen}`}
                              >
                                I Will Donate • বুক করুন
                              </button>
                            ) : (
                              <span className={subText}>Waiting for donor...</span>
                            )}
                            {item.seekerPhone === currentUser.phone && (
                              <button
                                onClick={() => remove(ref(rtdb, `scheduled_requests/${item.id}`))}
                                className="text-red-500 font-bold"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* LIVE TRACKING & ADMIN VERIFICATION STATUS VIEW */
                <div className="space-y-3">
                  {liveRequestData?.status === "pending_admin" && (
                    <div className="bg-amber-500/15 border border-amber-500/40 p-4 rounded-2xl text-center space-y-2">
                      <Clock className="w-10 h-10 text-amber-500 mx-auto animate-pulse" />
                      <h3 className="font-extrabold text-amber-500 text-sm">
                        Waiting for Admin Verification (অ্যাডমিন যাচাই চলছে)
                      </h3>
                      <p className={`text-xs ${subText}`}>
                        To prevent fake alerts, Admin is verifying your request. Once approved, sirens
                        will alert matching donors immediately.
                      </p>
                    </div>
                  )}

                  {liveRequestData?.status === "searching" && (
                    <div className="bg-red-500/10 border border-red-400/40 p-4 rounded-2xl text-center space-y-2.5">
                      <div className="w-11 h-11 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto animate-ping">
                        <Bell className="w-5 h-5" />
                      </div>
                      <h3 className="font-extrabold text-red-500 text-sm">
                        Verified! Alert Sent to All {liveRequestData?.bloodGroup} Donors
                      </h3>
                      <p className={`text-xs ${subText}`}>
                        Nearby {liveRequestData?.radiusKm || 5} km siren active • Online Donors:{" "}
                        <b>{onlineDonorsList.length}</b>
                      </p>

                      {/* One-Tap Social Appeal Share */}
                      <div className="flex flex-wrap justify-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            const appealText = `🚨 URGENT BLOOD NEEDED (${liveRequestData.bloodGroup}) 🚨\nHospital: ${liveRequestData.hospitalName}\nBags: ${liveRequestData.bagsNeeded}\nReason: ${liveRequestData.urgencyReason}\nContact: ${liveRequestData.seekerPhone}\n\nRespond live via RedPulse: https://rokto-bondhu-eight.vercel.app`;
                            navigator.clipboard?.writeText(appealText);
                            alert("Emergency appeal copied! Paste on Facebook or WhatsApp.");
                          }}
                          className={`text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 ${btn3DBlue}`}
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy Appeal Post (শেয়ার টেক্সট)
                        </button>

                        {(liveRequestData?.radiusKm || 5) < 10 && (
                          <button
                            onClick={() => handleExpandRadius(10)}
                            className="bg-amber-500 text-slate-950 text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1"
                          >
                            <PlusCircle className="w-3.5 h-3.5" /> Expand 10 km
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {liveRequestData?.status === "accepted" && (
                    <div className="bg-emerald-500/15 border border-emerald-500/40 p-4 rounded-2xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                          {liveRequestData?.donorPhoto ? (
                            <img
                              src={liveRequestData.donorPhoto}
                              alt=""
                              className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500"
                            />
                          ) : (
                            <div className="w-11 h-11 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                              {liveRequestData?.donorName?.[0]}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1 text-emerald-500 font-extrabold text-sm">
                              {liveRequestData?.donorName}
                              {liveRequestData?.donorVerified && (
                                <ShieldCheck className="w-4 h-4 text-blue-500" />
                              )}
                            </div>
                            <span className="inline-block bg-emerald-500/20 text-emerald-400 text-[11px] px-2 py-0.5 rounded-md font-semibold mt-0.5">
                              {liveRequestData?.donorStatusMsg || "Coming..."}
                            </span>
                          </div>
                        </div>

                        {liveDistanceKm !== null && (
                          <div className="text-right">
                            <div className={`text-[10px] ${subText}`}>Live Distance</div>
                            <div className="font-extrabold text-emerald-500 text-xs">
                              {liveDistanceKm.toFixed(1)} km (~{estimatedMinutes}m)
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        <a
                          href={`tel:${liveRequestData?.donorPhone}`}
                          className={`py-2 rounded-xl text-[11px] flex items-center justify-center gap-1 ${btn3DGreen}`}
                        >
                          <Phone className="w-3 h-3" /> Call
                        </a>
                        <button
                          onClick={() =>
                            openDirectChat(liveRequestData?.donorPhone, liveRequestData?.donorName)
                          }
                          className={`py-2 rounded-xl text-[11px] flex items-center justify-center gap-1 ${btn3DRed}`}
                        >
                          <MessageSquare className="w-3 h-3" /> Chat
                        </button>
                        <button
                          onClick={() => setShowLiveTrackingMap(!showLiveTrackingMap)}
                          className={`py-2 rounded-xl text-[11px] flex items-center justify-center gap-1 ${btn3DBlue}`}
                        >
                          <MapPin className="w-3 h-3" /> {showLiveTrackingMap ? "Hide" : "Map"}
                        </button>
                        <a
                          href={`https://wa.me/88${liveRequestData?.donorPhone?.replace(/^0/, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className={`py-2 rounded-xl text-[11px] flex items-center justify-center gap-1 ${btn3DDark}`}
                        >
                          <MessageCircle className="w-3 h-3" /> WA
                        </a>
                      </div>

                      {/* HIDDEN BY DEFAULT: Live Tracking Map opens only when user clicks "Map" */}
                      {showLiveTrackingMap && (
                        <div className="h-48 rounded-2xl overflow-hidden border border-slate-500/30">
                          <MapContainer center={hospitalPos} zoom={14} className="h-full w-full">
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={hospitalPos}>
                              <Popup>Hospital</Popup>
                            </Marker>
                            {liveRequestData?.donorLat && (
                              <Marker position={[liveRequestData.donorLat, liveRequestData.donorLng]}>
                                <Popup>Donor Live Location: {liveRequestData.donorName}</Popup>
                              </Marker>
                            )}
                          </MapContainer>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {liveRequestData?.status === "accepted" && (
                      <button
                        onClick={() => {
                          const donorInfo = {
                            donorId: liveRequestData.donorId,
                            donorName: liveRequestData.donorName,
                          };
                          update(ref(rtdb, `emergency_requests/${activeRequestId}`), {
                            status: "completed",
                          });
                          localStorage.removeItem("redpulse_active_req");
                          setActiveRequestId(null);
                          setShowLiveTrackingMap(false);
                          setRatingModalDonor(donorInfo);
                        }}
                        className={`flex-1 py-3 rounded-2xl text-xs ${btn3DBlue}`}
                      >
                        Blood Received • সম্পন্ন
                      </button>
                    )}
                    <button
                      onClick={() => {
                        remove(ref(rtdb, `emergency_requests/${activeRequestId}`));
                        localStorage.removeItem("redpulse_active_req");
                        setActiveRequestId(null);
                        setShowLiveTrackingMap(false);
                      }}
                      className={`px-4 py-3 rounded-2xl text-xs ${btn3DDark}`}
                    >
                      Cancel (বাতিল)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ================= TAB 2: ALL DONORS DIRECTORY ================= */}
        {activeTab === "directory" && (
          <div className="space-y-3">
            <div className={`rounded-3xl p-4 border space-y-3 ${cardBg}`}>
              <h2 className="font-extrabold flex items-center gap-2 text-sm">
                <Users className="text-red-500 w-5 h-5" /> All Donors • রক্তদাতা তালিকা (
                {filteredDirectory.length})
              </h2>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={filterBlood}
                  onChange={(e) => setFilterBlood(e.target.value)}
                  className="border border-red-300 rounded-xl p-2 text-xs font-extrabold text-red-600 bg-red-50"
                >
                  <option value="ALL">All Groups</option>
                  {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Area (EX: Savar, Dhaka)"
                  value={filterArea}
                  onChange={(e) => setFilterArea(e.target.value)}
                  className={`col-span-2 border rounded-xl p-2 text-xs outline-none ${inputBg}`}
                />
              </div>
            </div>

            {loadingUsers ? (
              <p className={`text-center text-sm py-6 ${subText}`}>Loading donors...</p>
            ) : (
              <div className="space-y-2.5">
                {filteredDirectory.map((donor) => {
                  const remDays = getRemainingDays(donor.lastDonation);
                  const avgRating =
                    donor.ratingCount > 0 ? (donor.ratingSum / donor.ratingCount).toFixed(1) : null;
                  return (
                    <div
                      key={donor.id}
                      className={`rounded-2xl p-3.5 border flex items-center justify-between gap-2 ${cardBg}`}
                    >
                      <div className="flex items-center gap-3">
                        {donor.photoUrl ? (
                          <img
                            src={donor.photoUrl}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover border border-red-300"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-red-500/15 text-red-500 flex items-center justify-center font-extrabold text-lg">
                            {donor.name?.[0]}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1 font-bold text-sm">
                            {donor.name}
                            {donor.verified && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                            {avgRating && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-bold">
                                ★ {avgRating}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs ${subText}`}>{donor.address}</p>
                          <div className="mt-1 flex items-center gap-2">
                            {remDays === 0 ? (
                              <span className="text-[10px] bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full font-bold">
                                Ready (প্রস্তুত)
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-500/15 text-amber-500 px-2 py-0.5 rounded-full font-semibold">
                                In {remDays} days
                              </span>
                            )}
                            {donor.phone !== currentUser.phone && (
                              <button
                                onClick={() => handleReportUser(donor)}
                                className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-0.5"
                              >
                                <AlertTriangle className="w-3 h-3" /> Report
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span className="bg-red-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg">
                          {donor.bloodGroup}
                        </span>
                        <div className="flex gap-1">
                          <a
                            href={`tel:${donor.phone}`}
                            className={`p-1.5 rounded-lg ${btn3DGreen}`}
                            title="Call"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => openDirectChat(donor.phone, donor.name)}
                            className={`p-1.5 rounded-lg ${btn3DRed}`}
                            title="Chat"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`sms:${donor.phone}`}
                            className={`px-1.5 py-1 rounded-lg text-[10px] flex items-center ${btn3DBlue}`}
                          >
                            SMS
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: BLOOD BANKS & AMBULANCE ================= */}
        {activeTab === "banks" && (
          <div className="space-y-3">
            <div className={`rounded-3xl p-4 border space-y-2.5 ${cardBg}`}>
              <h2 className="font-extrabold flex items-center gap-2 text-sm">
                <Building2 className="text-red-500 w-5 h-5" /> Blood Banks & Ambulance (ব্লাড ব্যাংক)
              </h2>
              <input
                type="text"
                placeholder="Search area or center name..."
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                className={`w-full border rounded-xl p-2.5 text-xs outline-none ${inputBg}`}
              />
            </div>

            <div className="space-y-2.5">
              {filteredBanks.map((item, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl p-3.5 border flex items-center justify-between ${cardBg}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        item.type === "Ambulance"
                          ? "bg-amber-500/20 text-amber-500"
                          : "bg-red-500/20 text-red-500"
                      }`}
                    >
                      {item.type === "Ambulance" ? (
                        <Ambulance className="w-5 h-5" />
                      ) : (
                        <Building2 className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs">{item.name}</h4>
                      <p className={`text-[11px] ${subText}`}>
                        {item.area} • {item.phone}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`tel:${item.phone}`}
                    className={`px-3 py-2 rounded-xl text-xs flex items-center gap-1 shrink-0 ${btn3DGreen}`}
                  >
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: TOP HEROES LEADERBOARD ================= */}
        {activeTab === "heroes" && (
          <div className={`rounded-3xl p-5 border space-y-4 ${cardBg}`}>
            <div className="text-center">
              <Award className="w-12 h-12 text-amber-500 mx-auto mb-1" />
              <h2 className="text-lg font-extrabold">Top Heroes • সেরা রক্তদাতা</h2>
              <p className={`text-xs ${subText}`}>Lifesavers Leaderboard</p>
            </div>

            {topHeroes.length === 0 ? (
              <p className={`text-center text-xs py-6 ${subText}`}>
                No donations recorded yet. Be the first hero!
              </p>
            ) : (
              <div className="space-y-2.5">
                {topHeroes.map((hero, index) => (
                  <div
                    key={hero.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 to-red-500/15 border border-amber-400/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center justify-center">
                        #{index + 1}
                      </span>
                      <div>
                        <div className="font-bold text-sm flex items-center gap-1">
                          {hero.name}
                          {hero.verified && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                        </div>
                        <p className={`text-[11px] ${subText}`}>{hero.address}</p>
                      </div>
                    </div>
                    <span className="bg-red-600 text-white text-xs font-extrabold px-2.5 py-1 rounded-lg">
                      {hero.donationCount}x
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: USER REVIEWS ================= */}
        {activeTab === "reviews" && (
          <div className="space-y-4">
            <div className={`rounded-3xl p-5 border space-y-3 ${cardBg}`}>
              <h2 className="font-extrabold text-base flex items-center gap-2">
                <Quote className="w-5 h-5 text-red-500" /> Share Your Review • মতামত লিখুন
              </h2>
              <p className={`text-xs ${subText}`}>
                Published after Admin approval (অ্যাডমিন অনুমোদনের পর প্রকাশিত হবে)
              </p>

              <form onSubmit={handleSubmitReview} className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold mr-1">Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={reviewRating >= star ? "text-amber-400" : "text-slate-500"}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>

                <textarea
                  required
                  rows={3}
                  placeholder="Write your experience... (আপনার অভিজ্ঞতা লিখুন)"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className={`w-full border rounded-2xl p-3 text-xs outline-none ${inputBg}`}
                />

                <button
                  disabled={submittingReview}
                  type="submit"
                  className={`w-full py-3 rounded-2xl text-xs ${btn3DRed}`}
                >
                  {submittingReview ? "Submitting..." : "Submit Review • জমা দিন"}
                </button>
              </form>
            </div>

            <div className={`rounded-3xl p-5 border space-y-3 ${cardBg}`}>
              <h3 className="font-extrabold text-sm">
                Community Reviews ({approvedReviews.length})
              </h3>

              {approvedReviews.length === 0 ? (
                <p className={`text-xs text-center py-6 ${subText}`}>No published reviews yet.</p>
              ) : (
                <div className="space-y-3">
                  {approvedReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className={`p-3.5 rounded-2xl border space-y-1.5 ${
                        darkMode ? "bg-slate-800/70 border-slate-700" : "bg-rose-50/60 border-red-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center">
                          {rev.userName?.[0]}
                        </div>
                        <div>
                          <div className="font-bold text-xs">
                            {rev.userName}{" "}
                            <span className="text-[10px] bg-red-500/20 text-red-500 px-1.5 rounded">
                              {rev.userBlood}
                            </span>
                          </div>
                          <div className="flex text-amber-400">
                            {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed pt-1">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 6: PROFILE, SOS MEDICAL CARD, HISTORY & WATERMARK ================= */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            <div className={`rounded-3xl p-5 border space-y-5 ${cardBg}`}>
              <div className="flex flex-col items-center text-center relative">
                <div className="relative">
                  {currentUser.photoUrl ? (
                    <img
                      src={currentUser.photoUrl}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-red-500 shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-red-500/15 text-red-500 flex items-center justify-center text-3xl font-extrabold border-4 border-red-500/30">
                      {currentUser.name?.[0]}
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-red-600 text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-red-700">
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>

                <h2 className="text-xl font-extrabold mt-3 flex items-center gap-1.5">
                  {currentUser.name}
                  {currentUser.verified && <ShieldCheck className="w-5 h-5 text-blue-500" />}
                </h2>
                <p className={`text-xs ${subText}`}>
                  {currentUser.phone} • {currentUser.address}
                </p>
                {currentUser.email && (
                  <p className={`text-[11px] flex items-center gap-1 mt-0.5 ${subText}`}>
                    <Mail className="w-3 h-3" /> {currentUser.email}
                  </p>
                )}

                <div className="flex gap-2 mt-3 flex-wrap justify-center">
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-extrabold">
                    Group: {currentUser.bloodGroup}
                  </span>
                  {userAge !== null && (
                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold">
                      Age: {userAge} yrs
                    </span>
                  )}
                  <span className="bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full text-xs font-bold">
                    Donations: {currentUser.donationCount || 0}x
                  </span>
                </div>
              </div>

              {/* SOS EMERGENCY MEDICAL CARD */}
              <div className="bg-gradient-to-r from-rose-500/15 to-red-600/15 border border-red-500/30 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-red-500 flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4" /> SOS Emergency Medical Card
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                    Allergy: {currentUser.allergies || "None"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <span className={subText}>Emergency Family Contact:</span>
                    <div className="font-bold">
                      {currentUser.emergencyContact || "Not added yet (Edit profile to add)"}
                    </div>
                  </div>
                  {currentUser.emergencyContact && (
                    <a
                      href={`tel:${currentUser.emergencyContact}`}
                      className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 ${btn3DRed}`}
                    >
                      <Phone className="w-3.5 h-3.5" /> SOS Call
                    </a>
                  )}
                </div>
              </div>

              {editMode ? (
                <form onSubmit={handleUpdateProfile} className="space-y-3 border-t border-slate-500/20 pt-4">
                  <div>
                    <label className="block text-xs font-bold">Full Name (নাম)</label>
                    <input
                      required
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={`w-full border rounded-xl p-2.5 text-sm ${inputBg}`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold">Email (ইমেইল)</label>
                      <input
                        required
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className={`w-full border rounded-xl p-2.5 text-xs ${inputBg}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold">Date of Birth (জন্মতারিখ)</label>
                      <input
                        type="date"
                        value={editDob}
                        onChange={(e) => setEditDob(e.target.value)}
                        className={`w-full border rounded-xl p-2.5 text-xs ${inputBg}`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold">Blood Group</label>
                      <select
                        value={editBlood}
                        onChange={(e) => setEditBlood(e.target.value)}
                        className={`w-full border rounded-xl p-2.5 text-sm font-bold text-red-500 ${inputBg}`}
                      >
                        {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold">Last Donation Date</label>
                      <input
                        type="date"
                        value={editLastDonation}
                        onChange={(e) => setEditLastDonation(e.target.value)}
                        className={`w-full border rounded-xl p-2.5 text-xs ${inputBg}`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold">District & Area (ঠিকানা)</label>
                    <input
                      required
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className={`w-full border rounded-xl p-2.5 text-sm ${inputBg}`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold">SOS Family Number</label>
                      <input
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        value={editEmergencyContact}
                        onChange={(e) => setEditEmergencyContact(e.target.value)}
                        className={`w-full border rounded-xl p-2.5 text-xs ${inputBg}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold">Medical Allergy</label>
                      <input
                        type="text"
                        placeholder="EX: None / Dust"
                        value={editAllergies}
                        onChange={(e) => setEditAllergies(e.target.value)}
                        className={`w-full border rounded-xl p-2.5 text-xs ${inputBg}`}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className={`flex-1 py-3 rounded-2xl text-xs ${btn3DRed}`}>
                      Save Changes • সেভ করুন
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className={`px-4 py-3 rounded-2xl text-xs ${btn3DDark}`}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 border-t border-slate-500/20 pt-4">
                  <button
                    onClick={() => {
                      setEditName(currentUser.name);
                      setEditEmail(currentUser.email || "");
                      setEditDob(currentUser.dob || "");
                      setEditBlood(currentUser.bloodGroup);
                      setEditAddress(currentUser.address);
                      setEditLastDonation(currentUser.lastDonation || "");
                      setEditEmergencyContact(currentUser.emergencyContact || "");
                      setEditAllergies(currentUser.allergies || "");
                      setEditMode(true);
                    }}
                    className={`w-full py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 ${btn3DDark}`}
                  >
                    <Edit3 className="w-4 h-4" /> Edit Profile & SOS Card (প্রোফাইল এডিট)
                  </button>

                  {!currentUser.verified && (
                    <div className="bg-blue-500/10 border border-blue-400/30 p-3.5 rounded-2xl space-y-2">
                      <h4 className="text-xs font-extrabold text-blue-400 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" /> Get Verified Badge (ভেরিফাইড ব্যাজ)
                      </h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter NID or Student ID"
                          value={nidInput}
                          onChange={(e) => setNidInput(e.target.value)}
                          className={`flex-1 border rounded-xl p-2 text-xs ${inputBg}`}
                        />
                        <button
                          onClick={handleRequestVerify}
                          className={`px-3.5 py-2 rounded-xl text-xs ${btn3DBlue}`}
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  )}

                  {/* DONATION HISTORY TIMELINE */}
                  {Array.isArray(currentUser.donationHistory) &&
                    currentUser.donationHistory.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <h4 className="text-xs font-extrabold flex items-center gap-1.5 text-amber-500">
                          <History className="w-4 h-4" /> Donation History (রক্তদানের ইতিহাস)
                        </h4>
                        <div className="space-y-1.5">
                          {currentUser.donationHistory.map((h, i) => (
                            <div
                              key={i}
                              className={`p-2.5 rounded-xl border text-xs flex justify-between items-center ${
                                darkMode ? "bg-slate-800/60 border-slate-700" : "bg-slate-50 border-slate-200"
                              }`}
                            >
                              <div>
                                <div className="font-bold">{h.hospital}</div>
                                <div className={`text-[10px] ${subText}`}>Seeker: {h.seeker}</div>
                              </div>
                              <span className="text-[11px] font-bold text-red-500">{h.date}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-500/15 text-red-500 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" /> Logout (লগআউট)
                  </button>
                </div>
              )}
            </div>

            {/* DEVELOPER WATERMARK AT THE BOTTOM OF PROFILE PAGE */}
            <div
              className={`rounded-3xl p-5 border text-center select-none relative overflow-hidden ${
                darkMode
                  ? "bg-[#111827]/70 border-slate-800 text-slate-400"
                  : "bg-white border-red-100 text-slate-500"
              }`}
            >
              <Droplet className="w-20 h-20 text-red-500/5 absolute -bottom-4 -right-4 pointer-events-none" />
              <p className="text-[10px] uppercase tracking-[0.22em] font-semibold text-red-500/80 mb-1">
                Developed by
              </p>
              <h4
                className={`text-base font-extrabold tracking-wide font-serif ${
                  darkMode ? "text-slate-200" : "text-slate-800"
                }`}
              >
                Mohammad Rejwan Islam
              </h4>
              <p className="text-xs font-medium mt-0.5 tracking-wide">
                Department of Software Engineering
              </p>
              <p className="text-[11px] font-semibold text-red-500/80 mt-0.5 tracking-wider">
                Daffodil International University
              </p>
            </div>
          </div>
        )}

        {/* ================= TAB 7: SUPER ADMIN CONTROL PANEL ================= */}
        {activeTab === "admin" && currentUser.isAdmin && (
          <div className={`rounded-3xl p-5 border space-y-4 ${cardBg}`}>
            <div className="flex items-center justify-between border-b border-slate-500/20 pb-3">
              <h2 className="font-extrabold flex items-center gap-2 text-sm">
                <Lock className="text-red-500 w-5 h-5" /> RedPulse Admin Control
              </h2>
              {adminUnlocked && (
                <button
                  onClick={() => {
                    setAdminUnlocked(false);
                    setPinEntry("");
                  }}
                  className={`text-xs px-3 py-1.5 rounded-xl ${btn3DDark}`}
                >
                  Lock
                </button>
              )}
            </div>

            {!adminUnlocked ? (
              <form onSubmit={handleAdminUnlock} className="py-4 space-y-3 max-w-xs mx-auto text-center">
                <KeyRound className="w-12 h-12 text-red-500 mx-auto" />
                <h3 className="font-bold text-sm">Enter Admin Secret PIN</h3>
                <input
                  required
                  type="password"
                  maxLength={4}
                  placeholder="****"
                  value={pinEntry}
                  onChange={(e) => setPinEntry(e.target.value)}
                  className={`w-full border rounded-xl p-3 text-center text-lg font-extrabold tracking-widest ${inputBg}`}
                />
                <button type="submit" className={`w-full py-3 rounded-2xl text-xs ${btn3DRed}`}>
                  Unlock Admin Panel
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                {/* 1. PENDING BLOOD REQUESTS VERIFICATION (Anti-Fake Filter) */}
                <div>
                  <h3 className="text-xs font-extrabold uppercase text-purple-400 mb-2">
                    Pending Blood Requests ({pendingAdminRequests.length} Awaiting Verification)
                  </h3>
                  {pendingAdminRequests.length === 0 ? (
                    <p className={`text-xs ${subText}`}>No unverified requests right now.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {pendingAdminRequests.map((r) => (
                        <div
                          key={r.id}
                          className="bg-purple-500/15 border border-purple-500/40 p-3.5 rounded-2xl space-y-2 text-xs"
                        >
                          <div className="flex justify-between items-center">
                            <span className="bg-red-600 text-white font-extrabold px-2 py-0.5 rounded">
                              {r.bloodGroup} • {r.bagsNeeded}
                            </span>
                            <a
                              href={`tel:${r.seekerPhone}`}
                              className="bg-blue-600 text-white px-2.5 py-1 rounded-lg font-bold flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" /> Verify Call ({r.seekerPhone})
                            </a>
                          </div>
                          <p className="font-bold">Hospital: {r.hospitalName}</p>
                          <p className={subText}>
                            Seeker: {r.seekerName} • Reason: {r.urgencyReason}
                          </p>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => {
                                update(ref(rtdb, `emergency_requests/${r.id}`), {
                                  status: "searching",
                                });
                                alert("Approved! Emergency sirens & alerts sent to matching donors.");
                              }}
                              className={`flex-1 py-2 rounded-xl text-xs ${btn3DGreen}`}
                            >
                              Approve & Broadcast • অনুমোদন দিন
                            </button>
                            <button
                              onClick={() => remove(ref(rtdb, `emergency_requests/${r.id}`))}
                              className={`px-3 py-2 rounded-xl text-xs ${btn3DRed}`}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. User Reviews Moderation */}
                <div>
                  <h3 className="text-xs font-extrabold uppercase text-amber-500 mb-2">
                    User Reviews Moderation ({pendingReviews.length} Pending / {approvedReviews.length} Published)
                  </h3>
                  {allReviews.length === 0 ? (
                    <p className={`text-xs ${subText}`}>No reviews submitted yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {allReviews.map((rev) => (
                        <div
                          key={rev.id}
                          className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                            rev.approved
                              ? darkMode
                                ? "bg-slate-800/50 border-slate-700"
                                : "bg-green-50/60 border-green-200"
                              : darkMode
                              ? "bg-amber-950/30 border-amber-700"
                              : "bg-amber-50 border-amber-300"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold">
                              {rev.userName} ({rev.userPhone}) • ★{rev.rating}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                rev.approved
                                  ? "bg-emerald-600 text-white"
                                  : "bg-amber-500 text-slate-950"
                              }`}
                            >
                              {rev.approved ? "Published" : "Pending"}
                            </span>
                          </div>
                          <p>"{rev.comment}"</p>
                          <div className="flex gap-2 pt-1">
                            {!rev.approved && (
                              <button
                                onClick={async () => {
                                  await updateDoc(doc(db, "user_reviews", rev.id), {
                                    approved: true,
                                  });
                                  fetchReviews();
                                }}
                                className="bg-emerald-600 text-white px-3 py-1 rounded-lg font-bold flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Share / Publish
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                if (window.confirm("Delete this review permanently?")) {
                                  await deleteDoc(doc(db, "user_reviews", rev.id));
                                  fetchReviews();
                                }
                              }}
                              className="bg-red-600 text-white px-3 py-1 rounded-lg font-bold flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Active Live Emergency Requests */}
                <div>
                  <h3 className="text-xs font-extrabold uppercase text-red-500 mb-2">
                    Active Live Requests ({liveAllRequests.filter((r) => r.status !== "pending_admin").length})
                  </h3>
                  {liveAllRequests.filter((r) => r.status !== "pending_admin").length === 0 ? (
                    <p className={`text-xs ${subText}`}>No active live requests right now.</p>
                  ) : (
                    <div className="space-y-2">
                      {liveAllRequests
                        .filter((r) => r.status !== "pending_admin")
                        .map((r) => (
                          <div
                            key={r.id}
                            className="bg-red-500/10 border border-red-400/30 p-2.5 rounded-xl flex justify-between items-center text-xs"
                          >
                            <div>
                              <b>{r.bloodGroup}</b> • {r.hospitalName} ({r.status})
                            </div>
                            <button
                              onClick={() => remove(ref(rtdb, `emergency_requests/${r.id}`))}
                              className="bg-red-600 text-white px-2.5 py-1 rounded-lg font-bold"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* 4. Admin Edit User Form */}
                {adminEditUser && (
                  <div className="bg-amber-500/15 border border-amber-400/40 p-3.5 rounded-2xl space-y-2">
                    <h4 className="font-bold text-xs text-amber-500">
                      Edit User: {adminEditUser.phone}
                    </h4>
                    <input
                      type="text"
                      value={adminEditUser.name}
                      onChange={(e) => setAdminEditUser({ ...adminEditUser, name: e.target.value })}
                      className={`w-full border rounded-xl p-2 text-xs ${inputBg}`}
                      placeholder="Name"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={adminEditUser.bloodGroup}
                        onChange={(e) =>
                          setAdminEditUser({ ...adminEditUser, bloodGroup: e.target.value })
                        }
                        className={`border rounded-xl p-2 text-xs font-bold ${inputBg}`}
                      >
                        {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={adminEditUser.address}
                        onChange={(e) =>
                          setAdminEditUser({ ...adminEditUser, address: e.target.value })
                        }
                        className={`border rounded-xl p-2 text-xs ${inputBg}`}
                        placeholder="Address"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          await updateDoc(doc(db, "users", adminEditUser.id), {
                            name: adminEditUser.name,
                            bloodGroup: adminEditUser.bloodGroup,
                            address: adminEditUser.address,
                          });
                          setAdminEditUser(null);
                          fetchAllUsers();
                          alert("User updated!");
                        }}
                        className="flex-1 bg-emerald-600 text-white py-1.5 rounded-xl text-xs font-bold"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setAdminEditUser(null)}
                        className="bg-slate-500/30 px-3 py-1.5 rounded-xl text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. All Registered Users Management */}
                <div>
                  <h3 className="text-xs font-extrabold uppercase mb-2">
                    All Registered Users ({allUsers.length})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {allUsers.map((u) => (
                      <div
                        key={u.id}
                        className={`border rounded-2xl p-3 flex flex-col gap-2 text-xs ${
                          (u.reports || 0) > 0
                            ? "bg-red-500/15 border-red-400"
                            : darkMode
                            ? "bg-slate-800/60 border-slate-700"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div>
                          <div className="font-bold flex items-center gap-1 flex-wrap">
                            {u.name} ({u.bloodGroup})
                            {u.verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
                            {(u.phone === MASTER_ADMIN_PHONE || u.role === "admin") && (
                              <span className="bg-purple-600 text-white text-[9px] px-1.5 py-0.5 rounded">
                                ADMIN
                              </span>
                            )}
                            {(u.reports || 0) > 0 && (
                              <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded">
                                {u.reports} Reports
                              </span>
                            )}
                          </div>
                          <div className={subText}>
                            {u.phone} • {u.address}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-500/20">
                          <button
                            onClick={() => setAdminEditUser(u)}
                            className="bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" /> Edit
                          </button>

                          <button
                            onClick={async () => {
                              await updateDoc(doc(db, "users", u.id), { verified: !u.verified });
                              fetchAllUsers();
                            }}
                            className="bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1"
                          >
                            <UserCheck className="w-3 h-3" /> {u.verified ? "Unverify" : "Verify"}
                          </button>

                          {u.phone !== MASTER_ADMIN_PHONE && (
                            <>
                              <button
                                onClick={async () => {
                                  const nextRole = u.role === "admin" ? "user" : "admin";
                                  await updateDoc(doc(db, "users", u.id), { role: nextRole });
                                  fetchAllUsers();
                                }}
                                className="bg-purple-500/20 text-purple-400 px-2.5 py-1 rounded-lg font-semibold"
                              >
                                {u.role === "admin" ? "Remove Admin" : "Make Admin"}
                              </button>

                              <button
                                onClick={async () => {
                                  if (window.confirm(`Delete ${u.name}'s account permanently?`)) {
                                    await deleteDoc(doc(db, "users", u.id));
                                    fetchAllUsers();
                                  }
                                }}
                                className="bg-red-500/20 text-red-400 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* CLEAN 3-ITEM BOTTOM NAVIGATION BAR */}
      <nav
        className={`fixed bottom-0 inset-x-0 border-t shadow-2xl flex justify-around py-2.5 z-40 backdrop-blur-md ${
          darkMode
            ? "bg-[#0B1120]/95 border-slate-800"
            : "bg-white/95 border-slate-200"
        }`}
      >
        <button
          onClick={() => {
            setActiveTab("radar");
            setShowMoreMenu(false);
          }}
          className={`flex flex-col items-center text-xs font-extrabold transition ${
            activeTab === "radar" ? "text-red-500 scale-105" : "text-slate-400"
          }`}
        >
          <Radio className="w-5 h-5 mb-0.5" /> Radar (রাডার)
        </button>

        <button
          onClick={() => {
            setActiveTab("directory");
            setShowMoreMenu(false);
          }}
          className={`flex flex-col items-center text-xs font-extrabold transition ${
            activeTab === "directory" ? "text-red-500 scale-105" : "text-slate-400"
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" /> Donors (রক্তদাতা)
        </button>

        <button
          onClick={() => {
            setActiveTab("profile");
            setShowMoreMenu(false);
          }}
          className={`flex flex-col items-center text-xs font-extrabold transition ${
            activeTab === "profile" ? "text-red-500 scale-105" : "text-slate-400"
          }`}
        >
          <User className="w-5 h-5 mb-0.5" /> Profile (প্রোফাইল)
        </button>
      </nav>
    </div>
  );
}