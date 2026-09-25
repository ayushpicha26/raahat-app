import { useNavigate } from "react-router-dom";
import RaahatLogo from "../../components/common/RaahatLogo";
import {
  Shield, MessageCircle, Mic, ChevronRight, Phone,
  Lock, Globe, Eye, Users, Gavel, HeartPulse, ShieldCheck, Home, Scale
} from "lucide-react";

const LANGUAGES = ["English", "हिंदी", "मराठी", "বাংলা", "தமிழ்", "తెలుగు", "ಕನ್ನಡ", "ગુજરાતી", "ਪੰਜਾਬੀ", "മലയാളം", "ଓଡ଼ିଆ"];

const SERVICES = [
  { icon: <MessageCircle size={22} />, title: "Counselling Support", desc: "Confidential psychological support from trained counsellors" },
  { icon: <Gavel size={22} />, title: "Legal Assistance", desc: "Access to authorized legal aid and case guidance" },
  { icon: <HeartPulse size={22} />, title: "Medical Assistance", desc: "Medical referrals and health support services" },
  { icon: <Shield size={22} />, title: "Police Intervention", desc: "Authorized escalation to law enforcement with consent" },
  { icon: <ShieldCheck size={22} />, title: "Witness Protection", desc: "Safety measures for complainants and witnesses" },
  { icon: <Home size={22} />, title: "Rehabilitation & Welfare", desc: "Long-term support and welfare scheme connections" },
];

const STEPS = [
  { num: "01", title: "Register Securely", desc: "Create a protected account with verified credentials." },
  { num: "02", title: "Share Your Concern", desc: "Speak or type — choose the mode most comfortable for you." },
  { num: "03", title: "AI-Assisted Assessment", desc: "RAAHAT generates a Stress Vulnerability Index to prioritize support." },
  { num: "04", title: "Receive Guidance", desc: "Get personalized recommendations and connect with authorized services." },
];

export default function LandingPage() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Announcement bar */}
      <div className="bg-navy-900 text-white text-xs text-center py-1.5 px-4">
        <span className="opacity-80">राष्ट्रीय अत्याचार विरोधी हेल्पलाइन &nbsp;|&nbsp; National Helpline Against Atrocities&nbsp;</span>
        <span className="font-bold text-white">14566</span>
        <span className="opacity-80">&nbsp;|&nbsp; Available 24×7</span>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50" id="top">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <RaahatLogo />
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#top" className="hover:text-navy-900 font-medium">Home</a>
            <a href="#about" className="hover:text-navy-900 font-medium">About RAAHAT</a>
            <a href="#how-it-works" className="hover:text-navy-900 font-medium">How It Works</a>
            <a href="#services" className="hover:text-navy-900 font-medium">Support Services</a>
            <a href="#privacy" className="hover:text-navy-900 font-medium">Privacy</a>
            <div className="flex items-center gap-1.5 text-navy-800">
              <Globe size={14} />
              <select className="text-sm bg-transparent border-none outline-none cursor-pointer">
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <a href="#privacy" className="cursor-pointer" title="Accessibility">
              <Eye size={16} className="text-slate-500" />
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => nav("/login")} className="px-4 py-2 text-sm font-semibold text-navy-800 border border-navy-200 rounded hover:bg-navy-50">Login</button>
            <button onClick={() => nav("/register")} className="px-4 py-2 text-sm font-semibold text-white bg-navy-900 rounded hover:bg-navy-800">Register</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="about" className="bg-navy-950 text-white py-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-navy-800 text-navy-100 text-xs font-semibold px-3 py-1.5 rounded mb-6">
              <Shield size={12} /> Government of India Initiative
            </div>
            <h1 className="text-4xl font-bold leading-tight mb-5" style={{fontFamily: "Noto Sans, sans-serif"}}>
              You deserve to be heard,<br />supported and protected.
            </h1>
            <p className="text-navy-100 text-lg mb-8 leading-relaxed">
              RAAHAT helps identify distress and vulnerability during your interaction with support services and guides you toward appropriate assistance.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => nav("/register")} className="flex items-center gap-2 px-6 py-3 bg-white text-navy-900 font-semibold rounded hover:bg-navy-50">
                Get Support <ChevronRight size={16} />
              </button>
              <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="px-6 py-3 border border-navy-600 text-white font-semibold rounded hover:bg-navy-800">
                How RAAHAT Works
              </button>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm text-navy-300">
              <Phone size={14} />
              <span>Helpline: <strong className="text-white">14566</strong> — Available 24×7</span>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="w-64 h-64 rounded-full border-2 border-navy-700 flex items-center justify-center relative">
              <div className="w-48 h-48 rounded-full bg-navy-800 flex items-center justify-center">
                <RaahatLogo size={72} showText={false} />
              </div>
              <div className="absolute top-4 right-4 bg-safe-700 text-white text-xs px-2 py-1 rounded-full font-semibold">Secure</div>
              <div className="absolute bottom-8 left-4 bg-navy-700 text-white text-xs px-2 py-1 rounded-full font-semibold">Confidential</div>
              <div className="absolute top-16 left-0 bg-amber-700 text-white text-xs px-2 py-1 rounded-full font-semibold">24×7</div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Notice */}
      <section id="privacy" className="py-8 px-6 bg-navy-50 border-b border-navy-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-white border border-navy-200 rounded p-5">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 bg-navy-100 rounded flex items-center justify-center">
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
              <button onClick={() => nav("/privacy")} className="px-4 py-2 text-sm font-semibold border border-navy-300 text-navy-800 rounded hover:bg-navy-50">Read Privacy Policy</button>
              <button onClick={() => nav("/register")} className="px-4 py-2 text-sm font-semibold text-white bg-navy-900 rounded hover:bg-navy-800">Continue Securely</button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <div className="text-xs font-bold text-navy-600 uppercase tracking-widest mb-2">Process</div>
            <h2 className="text-2xl font-bold text-navy-900">How RAAHAT Works</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="border border-slate-200 rounded p-5 relative">
                <div className="font-mono text-3xl font-bold text-navy-100 mb-3">{s.num}</div>
                <h3 className="font-bold text-navy-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                {i < 3 && <ChevronRight size={16} className="text-navy-300 absolute -right-3 top-1/2 -translate-y-1/2 hidden md:block bg-white" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Services */}
      <section id="services" className="py-16 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <div className="text-xs font-bold text-navy-600 uppercase tracking-widest mb-2">Available Services</div>
            <h2 className="text-2xl font-bold text-navy-900">Support Services</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {SERVICES.map((s, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded p-5 flex gap-4 hover:border-navy-300 cursor-pointer">
                <div className="w-10 h-10 bg-navy-50 rounded flex items-center justify-center text-navy-700 shrink-0">{s.icon}</div>
                <div>
                  <h3 className="font-semibold text-navy-900 mb-1">{s.title}</h3>
                  <p className="text-sm text-slate-600">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
                <a key={l}
                   href={l === "Privacy Policy" ? "/privacy" : l === "Terms of Service" ? "/privacy" : l === "Accessibility" ? "#" : "/"}
                   className="block text-navy-300 text-sm mb-1.5 hover:text-white">{l}</a>
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
              <a onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-white">Screen Reader Access</a>
              <a onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-white">Skip to Main Content</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
