import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import {
  HeartHandshake,
  Phone,
  Video,
  MessageCircle,
  MapPin,
  Globe,
  Search,
  X,
  Check,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Info
} from "lucide-react";
import { api, getUser } from "../utils/api";

export interface Counselor {
  id: string;
  name: string;
  designation: string;
  department: string;
  phone: string;
  district: string;
  state: string;
  specialization: string;
  languages: string[];
  availability: string;
  availability_status: "available" | "in_session" | "available_today";
  experience_years: number;
  bio: string;
  avatar: string;
}

export const COUNSELOR_PANEL: Counselor[] = [
  {
    id: "CNS-MH-001",
    name: "Dr. Meera Joshi",
    designation: "Senior Clinical Psychologist — Trauma & Crisis Care",
    department: "Sakhi One-Stop & Trauma Support Cell",
    phone: "0712-2560123",
    district: "Nagpur",
    state: "Maharashtra",
    specialization: "Atrocity Trauma, Acute Crisis Intervention & PTSD Recovery",
    languages: ["Marathi", "Hindi", "English"],
    availability: "Available Now",
    availability_status: "available",
    experience_years: 14,
    bio: "NIMHANS-trained senior clinical psychologist with 14+ years providing trauma-informed psychological first aid to survivors of discrimination and acute distress. Leads Sakhi OSC trauma protocols.",
    avatar: "MJ"
  },
  {
    id: "CNS-MH-002",
    name: "Dr. Anjali Deshmukh",
    designation: "Counselor — Women & Family Support",
    department: "Family Welfare & DLSA Panel",
    phone: "020-25501000",
    district: "Pune",
    state: "Maharashtra",
    specialization: "Gender-based Violence, Family Counseling & Rehabilitation",
    languages: ["Marathi", "Hindi", "English"],
    availability: "Available Today (2 slots)",
    availability_status: "available_today",
    experience_years: 11,
    bio: "Licensed family therapist and mental health officer specializing in survivor reintegration, witness psychological protection, and family mediation under DLSA Pune.",
    avatar: "AD"
  },
  {
    id: "CNS-MH-003",
    name: "Mr. Vikram Kulkarni",
    designation: "Youth & Psychosocial Counselor",
    department: "Youth Counseling Services & DLSA",
    phone: "0253-2578901",
    district: "Nashik",
    state: "Maharashtra",
    specialization: "Adolescent Distress, Student Harassment & Stigma Recovery",
    languages: ["Marathi", "Hindi", "English", "Gujarati"],
    availability: "Available Now",
    availability_status: "available",
    experience_years: 8,
    bio: "Focuses on campus discrimination, youth identity crises, social isolation, and academic anxiety. Former DLSA youth mental health fellow.",
    avatar: "VK"
  },
  {
    id: "CNS-MH-004",
    name: "Dr. Priya Sen",
    designation: "Rehabilitation & Community Mental Health Lead",
    department: "Community Mental Health Cell",
    phone: "022-26827091",
    district: "Mumbai",
    state: "Maharashtra",
    specialization: "Workplace Discrimination & Social Boycott Trauma",
    languages: ["English", "Hindi", "Marathi"],
    availability: "Available Now",
    availability_status: "available",
    experience_years: 12,
    bio: "Consultant for community mental health and workplace equity. Extensive experience supporting victims in urban industrial settings and legal witness accompaniment.",
    avatar: "PS"
  },
  {
    id: "CNS-MH-005",
    name: "Dr. Sonal Mehta",
    designation: "Medico-Legal Psychosocial Counselor",
    department: "Legal-Psychological Aid Cell",
    phone: "0240-2481234",
    district: "Chhatrapati Sambhajinagar",
    state: "Maharashtra",
    specialization: "Courtroom Stress, Legal Proceeding Anxiety & Child Welfare",
    languages: ["Marathi", "Hindi", "Gujarati"],
    availability: "Available Today",
    availability_status: "available_today",
    experience_years: 9,
    bio: "Dual-qualified in clinical psychology and human rights law. Assisting survivors through trial proceedings with trauma-informed coping tools.",
    avatar: "SM"
  },
  {
    id: "CNS-DL-006",
    name: "Dr. Rajiv Nambiar",
    designation: "National Tele-Counselling Specialist",
    department: "National Helpline Panel (NALSA)",
    phone: "011-23381456",
    district: "New Delhi",
    state: "National / Multi-State",
    specialization: "Inter-State Displacement & Emergency Telephonic Crisis Support",
    languages: ["English", "Hindi", "Tamil"],
    availability: "Available Now (24/7 Tele-Care)",
    availability_status: "available",
    experience_years: 15,
    bio: "National panel counselor supporting displaced families and acute distress callers across states in English, Hindi, and Tamil.",
    avatar: "RN"
  },
  {
    id: "CNS-MH-007",
    name: "Ms. Sunita Patil",
    designation: "Rural Community Psychosocial Counselor",
    department: "District Legal Services Authority",
    phone: "0231-2654321",
    district: "Kolhapur",
    state: "Maharashtra",
    specialization: "Rural Caste Discrimination & Agrarian Distress Support",
    languages: ["Marathi", "Kannada", "Hindi"],
    availability: "Available Today",
    availability_status: "available_today",
    experience_years: 7,
    bio: "Grassroots counselor working extensively in Western Maharashtra and border areas, providing counseling in Marathi and Kannada.",
    avatar: "SP"
  },
  {
    id: "CNS-MH-008",
    name: "Mr. Anand Rao",
    designation: "Crisis Intervention & Trauma Specialist",
    department: "Tele-MANAS Regional Cell",
    phone: "0721-2559876",
    district: "Amravati",
    state: "Maharashtra",
    specialization: "Acute Panic, Suicidal Ideation & Emergency Stabilization",
    languages: ["Marathi", "Hindi", "Telugu"],
    availability: "Available Now",
    availability_status: "available",
    experience_years: 10,
    bio: "Emergency psychological first aid specialist with Tele-MANAS experience. Provides rapid de-escalation and safety planning.",
    avatar: "AR"
  }
];

const REGION_OPTIONS = [
  "All Regions",
  "Nagpur",
  "Pune",
  "Nashik",
  "Mumbai",
  "Chhatrapati Sambhajinagar",
  "New Delhi",
  "Kolhapur",
  "Amravati"
];

const LANGUAGE_OPTIONS = [
  "All Languages",
  "Marathi",
  "Hindi",
  "English",
  "Gujarati",
  "Tamil",
  "Kannada",
  "Telugu"
];

interface ChatMessage {
  id: number;
  sender: "user" | "counselor";
  text: string;
  time: string;
}

export default function CounselorSupportPage() {
  const nav = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [selectedLanguage, setSelectedLanguage] = useState("All Languages");

  // Selected counselor state
  const [assignedCounselor, setAssignedCounselor] = useState<Counselor | null>(() => {
    const saved = localStorage.getItem("raahat_selected_counselor");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return COUNSELOR_PANEL[0];
      }
    }
    return COUNSELOR_PANEL[0];
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Call Modal State
  const [callModalCounselor, setCallModalCounselor] = useState<Counselor | null>(null);
  const [callType, setCallType] = useState<"voice" | "video">("voice");
  const [callConnected, setCallConnected] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [callConsent, setCallConsent] = useState(true);

  // Chat Modal State
  const [chatModalCounselor, setChatModalCounselor] = useState<Counselor | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({
    "CNS-MH-001": [
      {
        id: 1,
        sender: "counselor",
        text: "Namaste. I am Dr. Meera Joshi. This is a confidential, safe space under the Mental Healthcare Act 2017. How can I support you today?",
        time: "10:00 AM"
      }
    ]
  });
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    const user = getUser();
    setCurrentUser(user);

    api.get<{ counselor: any }>("/counselors/assigned")
      .then(res => {
        if (res.ok && res.data && res.data.counselor) {
          const match = COUNSELOR_PANEL.find(c => c.id === res.data.counselor.officer_id || c.name === res.data.counselor.name);
          if (match) {
            setAssignedCounselor(match);
            localStorage.setItem("raahat_selected_counselor", JSON.stringify(match));
          }
        }
      })
      .catch(() => {});
  }, []);

  // Call timer
  useEffect(() => {
    let interval: any = null;
    if (callConnected) {
      interval = setInterval(() => {
        setCallSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setCallSeconds(0);
    }
    return () => clearInterval(interval);
  }, [callConnected]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered counselors list
  const filteredCounselors = useMemo(() => {
    return COUNSELOR_PANEL.filter(c => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          c.name.toLowerCase().includes(q) ||
          c.specialization.toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q) ||
          c.bio.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Region
      if (selectedRegion !== "All Regions") {
        if (c.district.toLowerCase() !== selectedRegion.toLowerCase()) {
          return false;
        }
      }

      // Language
      if (selectedLanguage !== "All Languages") {
        const hasLang = c.languages.some(l => l.toLowerCase() === selectedLanguage.toLowerCase());
        if (!hasLang) return false;
      }

      return true;
    });
  }, [searchTerm, selectedRegion, selectedLanguage]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    selectedRegion !== "All Regions" ||
    selectedLanguage !== "All Languages";

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedRegion("All Regions");
    setSelectedLanguage("All Languages");
  };

  // Handle Select Counselor
  const handleSelectCounselor = (counselor: Counselor) => {
    setAssignedCounselor(counselor);
    localStorage.setItem("raahat_selected_counselor", JSON.stringify(counselor));
    api.post("/counselors/assign", { counselorId: counselor.id }).catch(() => {});
    showToast(`Assigned ${counselor.name} as your personal counselor.`);
  };

  // Handle Open Call
  const handleOpenCall = (counselor: Counselor, type: "voice" | "video" = "voice") => {
    setCallModalCounselor(counselor);
    setCallType(type);
    setCallConnected(false);
    setCallSeconds(0);
    setMicMuted(false);
    setVideoOff(false);
  };

  // Handle Start Call
  const handleStartCall = () => {
    setCallConnected(true);
  };

  // Handle End Call
  const handleEndCall = () => {
    setCallConnected(false);
    setCallModalCounselor(null);
    showToast("Counseling call ended. Take care of yourself.");
  };

  // Handle Open Chat
  const handleOpenChat = (counselor: Counselor) => {
    setChatModalCounselor(counselor);
    if (!chatMessages[counselor.id]) {
      setChatMessages(prev => ({
        ...prev,
        [counselor.id]: [
          {
            id: Date.now(),
            sender: "counselor",
            text: `Namaste. I am ${counselor.name} (${counselor.district}). Please feel free to share whatever you feel comfortable with. You are in a confidential, safe space.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      }));
    }
  };

  // Handle Send Chat
  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !chatModalCounselor) return;

    const counselorId = chatModalCounselor.id;
    const userText = chatInput.trim();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: Date.now(),
      sender: "user",
      text: userText,
      time: nowTime
    };

    setChatMessages(prev => ({
      ...prev,
      [counselorId]: [...(prev[counselorId] || []), newMsg]
    }));
    setChatInput("");

    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: Date.now() + 1,
        sender: "counselor",
        text: `Thank you for sharing that with me. I hear you, and what you are feeling is completely valid. Would you like to explore grounding exercises together, or discuss steps for safety and support?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => ({
        ...prev,
        [counselorId]: [...(prev[counselorId] || []), replyMsg]
      }));
    }, 1200);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <UserLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Toast alert */}
        {toastMessage && (
          <div className="fixed top-18 right-6 z-50 bg-navy-900 text-white text-xs sm:text-sm px-4 py-2.5 rounded-lg shadow-xl border border-teal-500/40 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={16} className="text-teal-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-2">
            <HeartHandshake size={14} className="text-teal-600" />
            <span>Mental Healthcare Act 2017 & DLSA Accredited Network</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-950">Counselor Support for Survivors</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Connect with verified clinical psychologists and trauma counselors. Filter by your region and native language, choose your counselor, and connect through confidential voice calls, video sessions, or private chat.
          </p>
        </div>

        {/* Current Assigned Counselor Card */}
        {assignedCounselor && (
          <div className="bg-gradient-to-r from-teal-900 via-navy-950 to-navy-900 text-white rounded-xl p-5 sm:p-6 mb-8 shadow-md border border-teal-800/40 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-teal-500/5 pointer-events-none rounded-r-xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-lg shrink-0 border-2 border-teal-300 shadow-sm">
                  {assignedCounselor.avatar}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-teal-500/30 text-teal-200 px-2.5 py-0.5 rounded border border-teal-400/30">
                      Your Assigned Counselor
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-teal-300">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                      {assignedCounselor.availability}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                    {assignedCounselor.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-teal-100 font-medium mt-0.5">
                    {assignedCounselor.designation}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-teal-200/90 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-teal-400" />
                      {assignedCounselor.district}, {assignedCounselor.state}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Globe size={13} className="text-teal-400" />
                      {assignedCounselor.languages.join(", ")}
                    </span>
                    <span>•</span>
                    <span>{assignedCounselor.experience_years} yrs exp</span>
                  </div>
                </div>
              </div>

              {/* Quick contact buttons on assigned card */}
              <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0">
                <button
                  onClick={() => handleOpenCall(assignedCounselor, "voice")}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-navy-950 text-xs sm:text-sm font-bold rounded-lg hover:bg-slate-100 transition shadow-sm cursor-pointer"
                >
                  <Phone size={15} className="text-teal-700" />
                  <span>Call</span>
                </button>
                <button
                  onClick={() => handleOpenCall(assignedCounselor, "video")}
                  className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-bold rounded-lg transition shadow-sm cursor-pointer"
                >
                  <Video size={15} />
                  <span>Video</span>
                </button>
                <button
                  onClick={() => handleOpenChat(assignedCounselor)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-navy-800 hover:bg-navy-700 border border-teal-500/40 text-teal-100 text-xs sm:text-sm font-bold rounded-lg transition cursor-pointer"
                >
                  <MessageCircle size={15} className="text-teal-300" />
                  <span>Chat</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 mb-6 shadow-xs">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search counselor by name, specialization, or district..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-teal-600 bg-slate-50 focus:bg-white"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
              {/* Region Filter */}
              <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                <MapPin size={15} className="text-slate-500 shrink-0 hidden sm:block" />
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full sm:w-auto text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600 font-medium"
                >
                  {REGION_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r === "All Regions" ? "All Regions (Maharashtra & National)" : r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language Filter */}
              <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                <Globe size={15} className="text-slate-500 shrink-0 hidden sm:block" />
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full sm:w-auto text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600 font-medium"
                >
                  {LANGUAGE_OPTIONS.map((l) => (
                    <option key={l} value={l}>
                      {l === "All Languages" ? "All Languages" : l}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear filters button */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <X size={13} /> Reset
                </button>
              )}
            </div>
          </div>

          {/* Active summary */}
          <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
            <span>
              Showing <strong>{filteredCounselors.length}</strong> qualified counselors
              {selectedRegion !== "All Regions" && ` in ${selectedRegion}`}
              {selectedLanguage !== "All Languages" && ` speaking ${selectedLanguage}`}
            </span>
            <span className="text-[11px] text-teal-800 font-medium hidden sm:inline">
              ✓ DLSA & Sakhi One-Stop Center Empanelled
            </span>
          </div>
        </div>

        {/* Counselors Grid */}
        {filteredCounselors.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500">
            <HeartHandshake size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-navy-900 text-sm mb-1">No counselors match your current filters</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Try choosing "All Regions" or "All Languages" to view the full panel of trauma support specialists.
            </p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-teal-700 text-white text-xs font-semibold rounded-lg hover:bg-teal-800 transition cursor-pointer"
            >
              Show All Counselors
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredCounselors.map((c) => {
              const isSelected = assignedCounselor?.id === c.id;

              return (
                <div
                  key={c.id}
                  className={`bg-white rounded-xl border p-5 transition-all shadow-xs flex flex-col justify-between ${
                    isSelected
                      ? "border-teal-600 ring-2 ring-teal-500/20 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  <div>
                    {/* Top row: Avatar + Name + Selection Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-navy-900 text-white font-bold flex items-center justify-center text-sm shrink-0 border-2 border-teal-500">
                          {c.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-navy-950 text-base leading-tight">
                              {c.name}
                            </h3>
                            <ShieldCheck size={15} className="text-teal-600 shrink-0" title="Government Empanelled" />
                          </div>
                          <p className="text-xs text-teal-800 font-semibold mt-0.5">
                            {c.designation}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {c.department}
                          </p>
                        </div>
                      </div>

                      {/* Selection tag */}
                      {isSelected ? (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-300">
                          <Check size={12} strokeWidth={3} /> Selected
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSelectCounselor(c)}
                          className="shrink-0 text-xs font-semibold text-teal-700 hover:text-teal-900 hover:bg-teal-50 border border-teal-200 rounded-lg px-2.5 py-1 transition cursor-pointer"
                        >
                          Select
                        </button>
                      )}
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      {c.bio}
                    </p>

                    {/* Specialization tag */}
                    <div className="mb-3">
                      <span className="text-[11px] font-semibold text-navy-900 bg-slate-100 px-2.5 py-1 rounded inline-block">
                        🎯 {c.specialization}
                      </span>
                    </div>

                    {/* Meta info tags */}
                    <div className="flex flex-wrap gap-2 text-xs mb-4">
                      {/* Region badge */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                        <MapPin size={12} className="text-slate-500" />
                        {c.district}, {c.state}
                      </span>

                      {/* Languages badge */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                        <Globe size={12} className="text-slate-500" />
                        {c.languages.join(", ")}
                      </span>

                      {/* Experience */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                        <Clock size={12} className="text-slate-500" />
                        {c.experience_years} years exp
                      </span>

                      {/* Availability status */}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                        c.availability_status === "available"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-blue-50 text-blue-800 border border-blue-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          c.availability_status === "available" ? "bg-emerald-500 animate-pulse" : "bg-blue-500"
                        }`}></span>
                        {c.availability}
                      </span>
                    </div>
                  </div>

                  {/* Actions Row: Select, Chat, Call */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => handleSelectCounselor(c)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-teal-50 text-teal-800 border border-teal-300"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check size={13} strokeWidth={2.5} /> Your Counselor
                        </>
                      ) : (
                        "Select Counselor"
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenChat(c)}
                      className="px-3 py-2 bg-slate-100 hover:bg-teal-50 text-slate-800 hover:text-teal-900 border border-slate-200 hover:border-teal-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                      title={`Chat with ${c.name}`}
                    >
                      <MessageCircle size={14} className="text-teal-700" />
                      <span>Chat</span>
                    </button>

                    <button
                      onClick={() => handleOpenCall(c, "voice")}
                      className="px-3 py-2 bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-900 border border-slate-200 hover:border-blue-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                      title={`Voice Call with ${c.name}`}
                    >
                      <Phone size={14} className="text-blue-700" />
                      <span>Call</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Statutory Privacy & Consent Notice */}
        <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-600">
          <Info size={16} className="text-slate-500 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Confidentiality Assurance:</strong> Under Section 23 of the Mental Healthcare Act 2017, all communications with empanelled counselors are strictly confidential and privileged. Your identity is protected, and records are maintained under secure encryption protocols. In case of immediate acute physical danger, please dial <strong>112</strong> or <strong>14566</strong>.
          </div>
        </div>
      </div>

      {/* ── CALL MODAL ── */}
      {callModalCounselor && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-800 relative">
            <button
              onClick={() => { setCallModalCounselor(null); setCallConnected(false); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Counselor Identity in Call */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-2xl mx-auto mb-3 border-4 border-teal-500/50 shadow-lg">
                {callModalCounselor.avatar}
              </div>
              <h3 className="text-lg font-bold text-white">{callModalCounselor.name}</h3>
              <p className="text-xs text-teal-300">{callModalCounselor.designation}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {callModalCounselor.district} • Languages: {callModalCounselor.languages.join(", ")}
              </p>

              {/* Call Status / Timer */}
              <div className="mt-4">
                {callConnected ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-mono font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Call in progress • {formatTimer(callSeconds)}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium">
                    <span>Ready to connect ({callType === "voice" ? "Voice Call" : "Video Call"})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Call Mode Selector (if not yet connected) */}
            {!callConnected && (
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  onClick={() => setCallType("voice")}
                  className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition cursor-pointer ${
                    callType === "voice"
                      ? "bg-teal-600 text-white border-teal-500"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  <Phone size={14} /> Voice Call
                </button>
                <button
                  onClick={() => setCallType("video")}
                  className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition cursor-pointer ${
                    callType === "video"
                      ? "bg-teal-600 text-white border-teal-500"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  <Video size={14} /> Video Session
                </button>
              </div>
            )}

            {/* Hardware Controls */}
            <div className="bg-slate-800/80 rounded-xl p-4 mb-6 flex items-center justify-around border border-slate-700">
              <button
                onClick={() => setMicMuted(!micMuted)}
                className={`p-3 rounded-full transition cursor-pointer ${
                  micMuted ? "bg-red-600 text-white" : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                }`}
                title={micMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {micMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              {callType === "video" && (
                <button
                  onClick={() => setVideoOff(!videoOff)}
                  className={`p-3 rounded-full transition cursor-pointer ${
                    videoOff ? "bg-red-600 text-white" : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                  }`}
                  title={videoOff ? "Turn Camera On" : "Turn Camera Off"}
                >
                  {videoOff ? <VideoOff size={18} /> : <Video size={18} />}
                </button>
              )}

              {/* End call button if connected */}
              {callConnected && (
                <button
                  onClick={handleEndCall}
                  className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition cursor-pointer shadow-lg"
                  title="End Consultation"
                >
                  <PhoneOff size={18} />
                </button>
              )}
            </div>

            {/* Consent Toggle */}
            {!callConnected && (
              <label className="flex items-start gap-2.5 text-[11px] text-slate-400 mb-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={callConsent}
                  onChange={(e) => setCallConsent(e.target.checked)}
                  className="mt-0.5 accent-teal-500 rounded"
                />
                <span>
                  I understand this telephonic counseling is confidential under the Mental Healthcare Act 2017.
                </span>
              </label>
            )}

            {/* Connect / End Actions */}
            {!callConnected ? (
              <button
                onClick={handleStartCall}
                disabled={!callConsent}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Phone size={16} /> Start Confidential {callType === "voice" ? "Voice" : "Video"} Consultation
              </button>
            ) : (
              <button
                onClick={handleEndCall}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition cursor-pointer"
              >
                Disconnect Call
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── CHAT MODAL ── */}
      {chatModalCounselor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full h-[580px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 bg-navy-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm border border-teal-400">
                  {chatModalCounselor.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    {chatModalCounselor.name}
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                  </h3>
                  <p className="text-[11px] text-teal-200">
                    {chatModalCounselor.district} • {chatModalCounselor.languages.join(", ")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const c = chatModalCounselor;
                    setChatModalCounselor(null);
                    handleOpenCall(c, "voice");
                  }}
                  className="p-1.5 rounded-lg bg-navy-800 text-teal-200 hover:bg-navy-700 hover:text-white transition cursor-pointer"
                  title="Switch to Call"
                >
                  <Phone size={15} />
                </button>
                <button
                  onClick={() => setChatModalCounselor(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Confidentiality Notice Banner */}
            <div className="bg-amber-50 px-3.5 py-1.5 border-b border-amber-200 text-[11px] text-amber-900 flex items-center gap-1.5">
              <Info size={12} className="text-amber-700 shrink-0" />
              <span>Privileged confidential thread under Mental Healthcare Act 2017.</span>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
              {(chatMessages[chatModalCounselor.id] || []).map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                        isUser
                          ? "bg-navy-900 text-white rounded-tr-none"
                          : "bg-white text-slate-900 border border-slate-200 rounded-tl-none"
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
                  </div>
                );
              })}
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-slate-400 shrink-0">Quick prompts:</span>
              <button
                type="button"
                onClick={() => setChatInput("I am feeling very overwhelmed right now.")}
                className="px-2.5 py-1 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 rounded-full shrink-0 cursor-pointer transition"
              >
                I feel overwhelmed
              </button>
              <button
                type="button"
                onClick={() => setChatInput("Can you suggest some calming grounding exercises?")}
                className="px-2.5 py-1 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 rounded-full shrink-0 cursor-pointer transition"
              >
                Grounding exercises
              </button>
              <button
                type="button"
                onClick={() => setChatInput("Can we schedule a 1-on-1 voice session?")}
                className="px-2.5 py-1 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 rounded-full shrink-0 cursor-pointer transition"
              >
                Schedule session
              </button>
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                placeholder={`Message ${chatModalCounselor.name} in complete privacy...`}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 text-xs sm:text-sm border border-slate-300 rounded-lg px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send size={14} /> Send
              </button>
            </form>
          </div>
        </div>
      )}
    </UserLayout>
  );
}
