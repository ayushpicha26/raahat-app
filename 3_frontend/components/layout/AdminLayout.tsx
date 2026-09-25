import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import RaahatLogo from "../common/RaahatLogo";
import {
  LayoutDashboard, Folder, AlertTriangle, BarChart3, FileText, Settings, LogOut,
  Bell, ChevronDown, Shield, Menu, X, MapPin, BookOpen
} from "lucide-react";
import { removeToken, clearUser } from "../../utils/api";

const NAV = [
  { icon: <LayoutDashboard size={15} />, label: "Dashboard", path: "/admin" },
  {
    icon: <Folder size={15} />, label: "Cases", path: "#cases", children: [
      { label: "Critical", path: "/admin/cases/critical" },
      { label: "High Priority", path: "/admin/cases/high" },
      { label: "Moderate Priority", path: "/admin/cases/moderate" },
      { label: "Low Priority", path: "/admin/cases/low" },
    ]
  },
  { icon: <AlertTriangle size={15} />, label: "Critical Alerts", path: "/admin/critical-alerts" },
  { icon: <MapPin size={15} />, label: "Geographic Analysis", path: "/admin/geo-analysis" },
  { icon: <BarChart3 size={15} />, label: "Reports", path: "/admin/reports" },
  { icon: <Shield size={15} />, label: "Audit & Security", path: "/admin/security" },
  { icon: <BookOpen size={15} />, label: "Support Allocation", path: "/admin/support-allocation" },
  { icon: <Settings size={15} />, label: "Settings", path: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [caseOpen, setCaseOpen] = useState(loc.pathname.includes("/admin/cases"));
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    removeToken();
    clearUser();
    nav("/");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-navy-950 text-white sticky top-0 z-50 h-13" style={{height:"52px"}}>
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <RaahatLogo size={24} showText={false} />
            <div className="hidden md:block">
              <div className="font-bold text-sm leading-none">RAAHAT</div>
              <div className="text-navy-300 text-xs">Authorized Administration Portal</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm">
              <div className="w-7 h-7 bg-navy-700 rounded-full flex items-center justify-center text-xs font-bold">A</div>
              <div>
                <div className="text-xs font-semibold">Adv. Rajesh Kumar</div>
                <div className="text-navy-300 text-xs">District Officer, Nagpur</div>
              </div>
              <ChevronDown size={12} className="text-navy-400" />
            </div>
            <button className="relative text-navy-300 hover:text-white">
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-critical-700 text-white text-xs font-bold rounded-full flex items-center justify-center">4</span>
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-navy-300 hover:text-white text-xs cursor-pointer">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={`${mobileOpen ? "flex" : "hidden"} md:flex flex-col w-56 shrink-0 bg-white border-r border-slate-200 fixed md:sticky top-[52px] h-[calc(100vh-52px)] z-40 overflow-y-auto`}>
          <nav className="flex-1 py-3">
            {NAV.map(item => (
              <div key={item.label}>
                {item.children ? (
                  <>
                    <button
                      onClick={() => setCaseOpen(!caseOpen)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium ${caseOpen ? "text-navy-900 bg-navy-50" : "text-slate-600 hover:bg-slate-50 hover:text-navy-800"}`}
                    >
                      <span className="flex items-center gap-2.5"><span className="text-slate-400">{item.icon}</span>{item.label}</span>
                      <ChevronDown size={12} className={`transition-transform ${caseOpen ? "rotate-180" : ""}`} />
                    </button>
                    {caseOpen && item.children.map(c => (
                      <button key={c.path} onClick={() => { nav(c.path); setMobileOpen(false); }}
                        className={`w-full flex items-center px-8 py-2 text-sm ${loc.pathname === c.path ? "text-navy-900 font-semibold border-r-2 border-navy-900 bg-navy-50" : "text-slate-500 hover:text-navy-800 hover:bg-slate-50"}`}>
                        {c.label}
                      </button>
                    ))}
                  </>
                ) : (
                  <button onClick={() => { nav(item.path); setMobileOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-left ${loc.pathname === item.path ? "bg-navy-50 text-navy-900 border-r-2 border-navy-900" : "text-slate-600 hover:bg-slate-50 hover:text-navy-800"}`}>
                    <span className={loc.pathname === item.path ? "text-navy-800" : "text-slate-400"}>{item.icon}</span>
                    {item.label}
                  </button>
                )}
              </div>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-100 text-xs text-slate-400">
            <div className="font-mono text-center">Demo Data — Prototype Only</div>
          </div>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
