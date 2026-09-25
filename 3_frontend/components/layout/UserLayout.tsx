import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import RaahatLogo from "../common/RaahatLogo";
import {
  LayoutDashboard, FolderOpen, Mic, MessageSquare, Star, FileText, User, Lock, LogOut, Menu, X, Globe, Bell, Phone, MapPin
} from "lucide-react";
import { getUser, removeToken, clearUser } from "../../utils/api";

const NAV = [
  { icon: <LayoutDashboard size={16} />, label: "Dashboard", path: "/dashboard" },
  { icon: <FolderOpen size={16} />, label: "My Case", path: "/my-case" },
  { icon: <MapPin size={16} />, label: "Nearby Help", path: "/nearby-help" },
  { icon: <Mic size={16} />, label: "Voice Support", path: "/voice-assessment" },
  { icon: <MessageSquare size={16} />, label: "Chat Support", path: "/chat-assessment" },
  { icon: <Star size={16} />, label: "Recommendations", path: "/recommendations" },
  { icon: <FileText size={16} />, label: "Documents", path: "/documents" },
  { icon: <User size={16} />, label: "Profile", path: "/profile" },
  { icon: <Lock size={16} />, label: "Privacy & Consent", path: "/privacy" },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setCurrentUser(getUser());
  }, []);

  function handleLogout() {
    removeToken();
    clearUser();
    nav("/");
  }

  const name = currentUser?.name || "Citizen";
  const caseId = currentUser?.caseId || "No Active Case";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-navy-950 text-white sticky top-0 z-50">
        <div className="px-4 h-13 flex items-center justify-between gap-4" style={{height: "52px"}}>
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <RaahatLogo size={26} />
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="hidden md:flex items-center gap-1 text-navy-300 text-xs">
              <Globe size={12} /> <span>English</span>
            </div>
            <div className="flex items-center gap-1.5 text-navy-300 text-xs">
              <Phone size={12} /> <span className="font-mono font-bold text-white">14566</span>
            </div>
            <button className="text-navy-300 hover:text-white"><Bell size={16} /></button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-navy-300 hover:text-white text-xs cursor-pointer">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={`${mobileOpen ? "flex" : "hidden"} md:flex flex-col w-56 shrink-0 bg-white border-r border-slate-200 fixed md:sticky top-[52px] h-[calc(100vh-52px)] z-40`}>
          <nav className="flex-1 py-4 overflow-y-auto">
            {NAV.map(item => (
              <button key={item.path} onClick={() => { nav(item.path); setMobileOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium text-left transition-colors cursor-pointer
                  ${loc.pathname === item.path ? "bg-navy-50 text-navy-900 border-r-2 border-navy-900" : "text-slate-600 hover:bg-slate-50 hover:text-navy-800"}`}>
                <span className={loc.pathname === item.path ? "text-navy-800" : "text-slate-400"}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-navy-100 rounded-full flex items-center justify-center text-navy-800 font-bold text-sm">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-navy-900 truncate">{name}</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{caseId}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 md:ml-0">
          {children}
        </main>
      </div>
    </div>
  );
}
