import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RaahatLogo from "../components/RaahatLogo";
import {
  Shield, MessageCircle, ChevronRight, ChevronDown, Phone, Lock, Globe, Eye,
  Gavel, HeartPulse, ShieldCheck, Home, ShieldAlert, X, Languages, ClipboardList,
  Stethoscope, Building2, HeartHandshake, UserCog, Bot, Smartphone, Globe2, Radio,
  UserCheck, BrainCircuit, Compass, Mic
} from "lucide-react";

const LANGUAGES = ["English", "हिंदी", "मराठी", "বাংলা", "தமிழ்", "తెలుగు", "ಕನ್ನಡ", "ગુજરાતી", "ਪੰਜਾਬੀ", "മലയാളം", "ଓଡ଼ିଆ"];

// Multi-Channel Intake Workflow Cards (from design)
const INTAKE_CHANNELS = [
  {
    title: "14566 Helpline",
    desc: "Talk to a human directly; RAAHAT supports the officer in real time.",
    bg: "bg-[#f4eefd]",
    border: "border-[#e8dbfa]",
    titleColor: "text-[#491b7e]",
    icon: <Phone size={20} className="text-[#6b21a8]" />,
    iconBg: "bg-[#ebdffa]",
  },
  {
    title: "IVRS (feature phone)",
    desc: "Press-key voice menu — no smartphone or internet needed.",
    bg: "bg-[#e6f7f5]",
    border: "border-[#cef0ec]",
    titleColor: "text-[#0f5b53]",
    icon: <Radio size={20} className="text-[#0d9488]" />,
    iconBg: "bg-[#cbf0ea]",
  },
  {
    title: "Chatbot",
    desc: "Text conversation on WhatsApp or SMS-based channels.",
    bg: "bg-[#edf8ee]",
    border: "border-[#d5f0d7]",
    titleColor: "text-[#1b5e20]",
    icon: <Bot size={20} className="text-[#16a34a]" />,
    iconBg: "bg-[#d8f3dc]",
  },
  {
    title: "Integrated Portal",
    desc: "Web access for citizens, NGOs, and welfare partners.",
    bg: "bg-[#fef8e7]",
    border: "border-[#fceec7]",
    titleColor: "text-[#7a4e0b]",
    icon: <Globe2 size={20} className="text-[#d97706]" />,
    iconBg: "bg-[#fdebc3]",
  },
  {
    title: "Mobile app",
    desc: "Offline-friendly capture that syncs once connected.",
    bg: "bg-[#fdf0eb]",
    border: "border-[#fad7c9]",
    titleColor: "text-[#8a2e0e]",
    icon: <Smartphone size={20} className="text-[#ea580c]" />,
    iconBg: "bg-[#fcd9cb]",
  },
];

// Built for every role Cards (from design)
const ROLES = [
  {
    title: "Helpline Officer",
    desc: "Reviews new cases, contacts citizens, escalates urgent ones.",
    icon: <Phone size={20} className="text-teal-600" />,
    borderColor: "border-t-teal-500",
    iconBg: "bg-teal-50",
  },
  {
    title: "Counsellor",
    desc: "Accesses assigned cases, logs sessions, updates follow-ups.",
    icon: <Stethoscope size={20} className="text-purple-600" />,
    borderColor: "border-t-purple-500",
    iconBg: "bg-purple-50",
  },
  {
    title: "District Administrator",
    desc: "Oversees district case load, assigns officers, tracks SLAs.",
    icon: <Building2 size={20} className="text-blue-600" />,
    borderColor: "border-t-blue-600",
    iconBg: "bg-blue-50",
  },
  {
    title: "Welfare Partner",
    desc: "Views referred cases in their scope; cannot override status.",
    icon: <HeartHandshake size={20} className="text-orange-600" />,
    borderColor: "border-t-orange-500",
    iconBg: "bg-orange-50",
  },
  {
    title: "System Administrator",
    desc: "Manages roles, access, and platform configuration.",
    icon: <UserCog size={20} className="text-amber-600" />,
    borderColor: "border-t-amber-500",
    iconBg: "bg-amber-50",
  },
];

// Support Services with distinct vibrant colorful badges
const SERVICES = [
  {
    icon: <MessageCircle size={22} className="text-purple-600" />,
    title: "Counselling Support",
    desc: "Confidential psychological support from trained counsellors",
    iconBg: "bg-purple-50 border border-purple-200",
    hoverBorder: "hover:border-purple-300",
  },
  {
    icon: <Gavel size={22} className="text-amber-600" />,
    title: "Legal Assistance",
    desc: "Access to authorized legal aid and case guidance",
    iconBg: "bg-amber-50 border border-amber-200",
    hoverBorder: "hover:border-amber-300",
  },
  {
    icon: <HeartPulse size={22} className="text-rose-600" />,
    title: "Medical Assistance",
    desc: "Medical referrals and health support services",
    iconBg: "bg-rose-50 border border-rose-200",
    hoverBorder: "hover:border-rose-300",
  },
  {
    icon: <Shield size={22} className="text-blue-600" />,
    title: "Police Intervention",
    desc: "Authorized escalation to law enforcement with consent",
    iconBg: "bg-blue-50 border border-blue-200",
    hoverBorder: "hover:border-blue-300",
  },
  {
    icon: <ShieldCheck size={22} className="text-emerald-600" />,
    title: "Witness Protection",
    desc: "Safety measures for complainants and witnesses",
    iconBg: "bg-emerald-50 border border-emerald-200",
    hoverBorder: "hover:border-emerald-300",
  },
  {
    icon: <Home size={22} className="text-teal-600" />,
    title: "Rehabilitation & Welfare",
    desc: "Long-term support and welfare scheme connections",
    iconBg: "bg-teal-50 border border-teal-200",
    hoverBorder: "hover:border-teal-300",
  },
];

// Workflow Steps with colorful badges
const STEPS = [
  {
    num: "01",
    title: "Register Securely",
    desc: "Create a protected account with verified credentials.",
    icon: <UserCheck size={20} className="text-blue-600" />,
    iconBg: "bg-blue-50 border border-blue-200",
    borderColor: "border-t-blue-500",
    numColor: "text-blue-400",
  },
  {
    num: "02",
    title: "Share Your Concern",
    desc: "Speak or type — choose the mode most comfortable for you.",
    icon: <Mic size={20} className="text-purple-600" />,
    iconBg: "bg-purple-50 border border-purple-200",
    borderColor: "border-t-purple-500",
    numColor: "text-purple-400",
  },
  {
    num: "03",
    title: "AI-Assisted Assessment",
    desc: "RAAHAT generates a Stress Vulnerability Index to prioritize support.",
    icon: <BrainCircuit size={20} className="text-emerald-600" />,
    iconBg: "bg-emerald-50 border border-emerald-200",
    borderColor: "border-t-emerald-500",
    numColor: "text-emerald-400",
  },
  {
    num: "04",
    title: "Receive Guidance",
    desc: "Get personalized recommendations and connect with authorized services.",
    icon: <Compass size={20} className="text-amber-600" />,
    iconBg: "bg-amber-50 border border-amber-200",
    borderColor: "border-t-amber-500",
    numColor: "text-amber-400",
  },
];

export default function FrontPage() {
  const nav = useNavigate();
  const [lowBandwidth, setLowBandwidth] = useState(false);
  const [currentLang, setCurrentLang] = useState("English");
  const [topLangOpen, setTopLangOpen] = useState(false);
  const [navLangOpen, setNavLangOpen] = useState(false);

  const handleQuickExit = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Top Government Utility Bar */}
      <div className="bg-[#0b1f3a] text-white border-b border-[#142d50]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-4 text-[12px]">
          {/* Left: Official Emblem + 2-line official text */}
          <div className="flex items-center gap-3">
            {/* Emblem with 'skip' tag */}
            <div className="flex flex-col items-center shrink-0 leading-none">
              <img
                src="/emblem-of-india-white.svg"
                alt="Government of India Emblem"
                className="h-7 w-auto object-contain opacity-95"
              />
              <a href="#main-content" className="text-[9px] text-slate-300 font-semibold hover:text-white mt-0.5">
                skip
              </a>
            </div>

            <div className="flex flex-col justify-center">
              {/* Line 1: Government name */}
              <div className="text-[11px] sm:text-[12px] font-medium text-slate-100 tracking-tight leading-tight flex items-center gap-1.5 flex-wrap">
                <span>भारत सरकार / Government of India</span>
                <span className="text-slate-400">—</span>
                <span className="text-slate-200">सामाजिक न्याय और अधिकारिता मंत्रालय / Ministry of Social Justice and Empowerment</span>
              </div>

              {/* Line 2: Utility navigation links */}
              <div className="flex items-center gap-2.5 text-[11px] text-slate-300 mt-0.5 leading-tight flex-wrap">
                <a href="#main-content" className="hover:text-white transition-colors">
                  to main content
                </a>
                <span className="text-slate-500">|</span>
                <div
                  onClick={() => setLowBandwidth(!lowBandwidth)}
                  className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors select-none"
                  role="button"
                  tabIndex={0}
                >
                  {/* Pill toggle switch */}
                  <div
                    className={`w-7 h-3.5 rounded-full transition-colors relative flex items-center px-0.5 ${
                      lowBandwidth ? "bg-blue-500" : "bg-[#1f4068]"
                    }`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                        lowBandwidth ? "translate-x-3" : "translate-x-0"
                      }`}
                    />
                  </div>
                  <span>low bandwidth mode</span>
                </div>
                <span className="text-slate-500">|</span>
                <span className="hidden sm:inline text-slate-300">works on slow rural connections</span>
                <span className="text-slate-500">|</span>
                <span className="font-semibold text-slate-200">NHAA 14566</span>
              </div>
            </div>
          </div>

          {/* Right: Language Selector + Quick Exit */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => setTopLangOpen(!topLangOpen)}
                className="flex items-center gap-1.5 text-xs text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <Languages size={15} className="text-slate-300" />
                <span>{currentLang}</span>
                <ChevronDown size={13} className="text-slate-400" />
              </button>

              {topLangOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg py-1 z-50 border border-slate-200 text-slate-800 text-xs">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        setCurrentLang(lang);
                        setTopLangOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleQuickExit}
              title="Quick exit to protect privacy"
              className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-100 shadow-sm transition-all cursor-pointer"
            >
              <X size={13} strokeWidth={2.5} />
              <span>Quick exit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-[74px] flex items-center justify-between gap-6">
          {/* Left: Brand Identity */}
          <a href="#home" aria-label="RAAHAT home" className="flex items-center gap-3.5 shrink-0 select-none">
            {/* State Emblem of India (Black) */}
            <img
              src="/emblem-of-india.svg"
              alt="Emblem of India"
              className="h-11 w-auto object-contain shrink-0"
            />

            {/* Navy Circle with Classical Pillar Portico Building */}
            <div className="w-10 h-10 rounded-full bg-[#0d2a4e] flex items-center justify-center text-white shrink-0 shadow-sm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 3 21 8 3 8" fill="white" stroke="none" />
                <line x1="3" y1="9" x2="21" y2="9" stroke="white" strokeWidth="1.5" />
                <line x1="6" y1="10" x2="6" y2="18" stroke="white" strokeWidth="2" />
                <line x1="10" y1="10" x2="10" y2="18" stroke="white" strokeWidth="2" />
                <line x1="14" y1="10" x2="14" y2="18" stroke="white" strokeWidth="2" />
                <line x1="18" y1="10" x2="18" y2="18" stroke="white" strokeWidth="2" />
                <line x1="4" y1="19" x2="20" y2="19" stroke="white" strokeWidth="1.5" />
                <line x1="2" y1="21" x2="22" y2="21" stroke="white" strokeWidth="2" />
              </svg>
            </div>

            {/* Brand Text */}
            <div className="flex flex-col">
              <span className="font-bold text-[22px] tracking-tight text-[#0d233a] leading-none">
                RAAHAT
              </span>
              <span className="text-[12px] font-normal text-[#5b7694] leading-tight mt-0.5">
                Victim Support Platform
              </span>
            </div>
          </a>

          {/* Center: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-[14px]">
            <a
              href="#home"
              className="relative py-2 font-semibold text-[#0d233a] transition-colors"
            >
              Home
              {/* Active Underline Indicator */}
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0d233a] rounded-full" />
            </a>
            <a href="#intake-channels" className="font-medium text-slate-700 hover:text-[#0d233a] transition-colors">
              Intake
            </a>
            <a href="#how-it-works" className="font-medium text-slate-700 hover:text-[#0d233a] transition-colors">
              How It Works
            </a>
            <a href="#roles" className="font-medium text-slate-700 hover:text-[#0d233a] transition-colors">
              Roles
            </a>
            <a href="#support-services" className="font-medium text-slate-700 hover:text-[#0d233a] transition-colors">
              Support Services
            </a>
            <button
              type="button"
              onClick={() => nav("/nearby-help")}
              className="font-medium text-slate-700 hover:text-[#0d233a] transition-colors cursor-pointer"
            >
              Help
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNavLangOpen(!navLangOpen)}
                className="flex items-center gap-1.5 font-medium text-slate-700 hover:text-[#0d233a] transition-colors cursor-pointer"
              >
                <Globe size={16} className="text-slate-600" />
                <span>{currentLang}</span>
                <ChevronDown size={14} className="text-slate-500" />
              </button>

              {navLangOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg py-1 z-50 border border-slate-200 text-slate-800 text-xs">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        setCurrentLang(lang);
                        setNavLangOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Accessibility Eye Icon */}
            <button
              type="button"
              title="Accessibility options"
              aria-label="Accessibility options"
              className="text-slate-600 hover:text-[#0d233a] transition-colors cursor-pointer p-1"
            >
              <Eye size={18} />
            </button>
          </nav>

          {/* Right: Auth Action Buttons */}
          <div className="flex shrink-0 items-center gap-3">
            <button
              onClick={() => nav("/login")}
              className="px-5 py-2 text-sm font-semibold text-[#0d233a] border border-[#0d233a] rounded-[6px] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Login
            </button>
            <button
              onClick={() => nav("/register")}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#0d233a] rounded-[6px] hover:bg-[#15385d] transition-colors cursor-pointer shadow-xs"
            >
              Register
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section
          id="home"
          className="relative isolate min-h-[460px] lg:min-h-[490px] overflow-hidden px-4 sm:px-8 lg:px-16 py-12 sm:py-16 text-white flex items-center"
          style={{
            background: "linear-gradient(135deg, #071f3a 0%, #0a294e 45%, #0e3462 100%)",
          }}
        >
          {/* Right Side Artwork: Clean illustration without Gemini logo */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-[55%] lg:w-[60%] overflow-hidden select-none hidden md:block">
            <img
              src="/hero-illustration-clean.png"
              alt=""
              className="h-full w-full object-cover object-left"
              style={{
                maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 10%, rgba(0,0,0,1) 22%)",
                WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 10%, rgba(0,0,0,1) 22%)",
              }}
            />
          </div>

          {/* Left Content Area */}
          <div className="relative z-10 max-w-[1400px] mx-auto w-full">
            <div className="max-w-[580px]">
              {/* Government Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 backdrop-blur-sm text-blue-200 text-xs font-semibold mb-6">
                <ShieldCheck size={14} className="text-blue-300" />
                <span>Government of India Initiative</span>
              </div>

              {/* Main Hero Heading */}
              <h1 className="text-[34px] sm:text-[42px] lg:text-[46px] font-bold text-white tracking-tight leading-[1.18] mb-5">
                You deserve to be heard,<br />
                supported and protected.
              </h1>

              {/* Subtitle Paragraph */}
              <p className="text-[#8faecc] text-[15px] sm:text-[16px] leading-[1.65] max-w-[530px] mb-8 font-normal">
                RAAHAT helps identify distress and vulnerability during your interaction with support services and guides you toward appropriate assistance.
              </p>

              {/* Primary & Secondary Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 mb-8">
                <button
                  onClick={() => nav("/register")}
                  className="flex items-center gap-2.5 px-6 py-3.5 bg-white text-[#0d233a] text-sm font-semibold rounded-lg shadow-md hover:bg-slate-100 hover:shadow-lg transition-all cursor-pointer"
                >
                  <span>Get Support</span>
                  <ChevronRight size={17} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                  className="flex items-center gap-2.5 px-5 py-3.5 border border-white/25 bg-[#0e2c50]/70 hover:bg-[#133762] text-white text-sm font-semibold rounded-lg backdrop-blur-sm transition-all cursor-pointer"
                >
                  <ClipboardList size={17} className="text-white/90" />
                  <span>How RAAHAT Works</span>
                </button>
              </div>

              {/* Helpline Info */}
              <div className="flex items-center gap-2 text-[13px] text-[#86a8ce]">
                <Phone size={14} className="text-blue-300" />
                <span>
                  Helpline: <strong className="text-white font-bold text-[14px]">14566</strong> — Available 24×7
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Multi-Channel Intake Workflow Section (Exact from Design) */}
        <section id="intake-channels" className="py-12 px-6 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto">
            {/* 5 Channel Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {INTAKE_CHANNELS.map((ch, idx) => (
                <div
                  key={idx}
                  className={`${ch.bg} ${ch.border} border rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all`}
                >
                  <div>
                    <div className={`w-9 h-9 rounded-xl ${ch.iconBg} flex items-center justify-center mb-3 shadow-2xs`}>
                      {ch.icon}
                    </div>
                    <h3 className={`font-bold text-[15px] ${ch.titleColor} mb-2 leading-tight`}>
                      {ch.title}
                    </h3>
                    <p className="text-[12px] text-slate-600 leading-relaxed">
                      {ch.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Banner: IVRS Voice Intake */}
            <div className="rounded-2xl border border-[#e5daf6] bg-[#f5effb] p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm shadow-2xs">
              <div className="flex items-center gap-3 text-slate-800 font-medium">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 shrink-0">
                  <Phone size={16} />
                </span>
                <span>No smartphone or data connection? IVRS covers the full intake by voice.</span>
              </div>
              <a
                href="#how-it-works"
                className="font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 text-xs sm:text-sm shrink-0 transition-colors"
              >
                <span>See the press-key flow</span>
                <ChevronRight size={14} />
              </a>
            </div>
          </div>
        </section>

        {/* Built for every role Section (Exact from Design) */}
        <section id="roles" className="py-16 px-6 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-1.5">Access</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0e274a] tracking-tight">Built for every role</h2>
              <p className="text-sm text-slate-600 mt-1">Role-based access keeps sensitive details in the right hands.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {ROLES.map((role, idx) => (
                <div
                  key={idx}
                  className={`bg-white rounded-2xl border border-slate-200 border-t-4 ${role.borderColor} p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between`}
                >
                  <div>
                    <div className={`w-10 h-10 rounded-xl ${role.iconBg} flex items-center justify-center mb-3 shadow-2xs`}>
                      {role.icon}
                    </div>
                    <h3 className="font-bold text-[15px] text-[#0e274a] mb-2 leading-tight">
                      {role.title}
                    </h3>
                    <p className="text-[12px] text-slate-600 leading-relaxed">
                      {role.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works - Workflow Steps (With Colorful Badges and Icons) */}
        <section id="how-it-works" className="py-16 px-6 bg-slate-50/60 border-b border-slate-200">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10">
              <div className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">Process</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0e274a] tracking-tight">How RAAHAT Works</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {STEPS.map((s, i) => (
                <div
                  key={i}
                  className={`bg-white border border-slate-200 border-t-4 ${s.borderColor} rounded-2xl p-6 relative shadow-xs hover:shadow-md transition-all`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center shadow-2xs`}>
                      {s.icon}
                    </div>
                    <span className={`font-mono text-2xl font-bold ${s.numColor}`}>
                      {s.num}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#0e274a] text-base mb-2">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                  {i < 3 && <ChevronRight size={16} className="text-slate-300 absolute -right-3 top-1/2 -translate-y-1/2 hidden md:block bg-white rounded-full p-0.5 shadow-xs" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Support Services (With Colorful Distinct Icons) */}
        <section id="support-services" className="py-16 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10">
              <div className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">Available Services</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0e274a] tracking-tight">Support Services</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {SERVICES.map((s, i) => (
                <div
                  key={i}
                  className={`bg-white border border-slate-200 ${s.hoverBorder} rounded-2xl p-5 flex gap-4 hover:shadow-md transition-all cursor-pointer group`}
                >
                  <div className={`w-11 h-11 rounded-xl ${s.iconBg} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}>
                    {s.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0e274a] text-[15px] mb-1 leading-snug">{s.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy Notice */}
        <section id="privacy-notice" className="py-8 px-6 bg-navy-50 border-t border-navy-100">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-white border border-navy-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 bg-navy-100 rounded-xl flex items-center justify-center">
                  <Lock size={18} className="text-navy-800" />
                </div>
                <div>
                  <div className="font-bold text-navy-900 text-sm">Your Privacy Matters</div>
                </div>
              </div>
              <p className="text-sm text-slate-600 flex-1">
                Your information is handled confidentially. RAAHAT uses your information only for support, assessment and authorized case management. Data is encrypted and accessible only to authorized personnel.
              </p>
              <div className="flex gap-2 shrink-0">
                <button className="px-4 py-2 text-sm font-semibold border border-navy-300 text-navy-800 rounded-lg hover:bg-navy-50 cursor-pointer">Read Privacy Policy</button>
                <button onClick={() => nav("/register")} className="px-4 py-2 text-sm font-semibold text-white bg-navy-900 rounded-lg hover:bg-navy-800 cursor-pointer">Continue Securely</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-navy-950 text-white py-10 px-6 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <RaahatLogo showText />
              <p className="text-navy-300 text-sm mt-3 leading-relaxed">
                An initiative under the National Helpline Against Atrocities (NHAA), Government of India.
              </p>
            </div>
            <div>
              <div className="font-semibold text-sm mb-3">Platform</div>
              {["Privacy Policy", "Terms of Service", "Accessibility", "Contact Us"].map(l => (
                <a key={l} href="#" className="block text-navy-300 text-sm mb-1.5 hover:text-white">{l}</a>
              ))}
            </div>
            <div>
              <div className="font-semibold text-sm mb-3">Support</div>
              {["Emergency Support", "Legal Resources", "Mental Health", "Report Issue"].map(l => (
                <a key={l} href="#" className="block text-navy-300 text-sm mb-1.5 hover:text-white">{l}</a>
              ))}
            </div>
            <div>
              <div className="font-semibold text-sm mb-3">Emergency Helpline</div>
              <div className="text-3xl font-bold text-white font-mono mb-1">14566</div>
              <div className="text-navy-300 text-sm">Available 24×7 in 11 languages</div>
            </div>
          </div>
          <div className="border-t border-navy-800 pt-6 flex flex-wrap justify-between items-center gap-4 text-xs text-navy-400">
            <span>© 2026 RAAHAT. Government of India. All rights reserved. &nbsp;|&nbsp; <em>Demo Data — Prototype Only</em></span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white">Screen Reader Access</a>
              <a href="#" className="hover:text-white">Skip to Main Content</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Urgent Help Floating Action Button (Coral/Red exact from screenshot) */}
      <button
        onClick={() => nav("/nearby-help")}
        aria-label="Urgent help"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full border border-white/20 bg-[#d9483b] hover:bg-[#c73e31] px-4 py-2.5 text-sm font-semibold text-white shadow-2xl transition-all cursor-pointer group"
      >
        <span className="flex items-center justify-center text-white">
          <ShieldAlert size={18} className="text-white" />
        </span>
        <span>Urgent help</span>
      </button>
    </div>
  );
}
