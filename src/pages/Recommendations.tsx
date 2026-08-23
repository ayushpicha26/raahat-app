import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import { MessageCircle, Gavel, HeartPulse, Shield, ShieldCheck, Home, AlertCircle, CheckCircle, ChevronRight } from "lucide-react";

const RECS = [
  {
    priority: "High Priority",
    priorityColor: "text-high-700 bg-high-50 border-high-100",
    icon: <MessageCircle size={20} className="text-navy-700" />,
    title: "Counselling Support",
    desc: "Connect with an authorized counsellor for confidential psychological support. A counsellor has been identified based on your district.",
    cta: "Request Counselling",
    status: "Recommended",
  },
  {
    priority: "Recommended",
    priorityColor: "text-navy-700 bg-navy-50 border-navy-100",
    icon: <Gavel size={20} className="text-navy-700" />,
    title: "Legal Assistance",
    desc: "Connect with a legal aid officer for guidance on your rights and available legal remedies.",
    cta: "Request Legal Aid",
    status: "Available",
  },
  {
    priority: "Immediate Attention",
    priorityColor: "text-critical-700 bg-critical-50 border-critical-100",
    icon: <Shield size={20} className="text-critical-700" />,
    title: "Safety Assessment",
    desc: "Your responses indicate immediate safety concerns. An authorized safety assessment has been flagged for priority review.",
    cta: "Contact Authorized Emergency Support",
    status: "Urgent",
    urgent: true,
  },
  {
    priority: "Consider",
    priorityColor: "text-amber-700 bg-amber-50 border-amber-100",
    icon: <HeartPulse size={20} className="text-navy-700" />,
    title: "Medical Assistance",
    desc: "If you have experienced physical harm, a medical referral can be arranged through authorized channels.",
    cta: "Request Medical Assistance",
    status: "Available",
  },
  {
    priority: "Consider",
    priorityColor: "text-amber-700 bg-amber-50 border-amber-100",
    icon: <ShieldCheck size={20} className="text-navy-700" />,
    title: "Witness Protection",
    desc: "If you are concerned about threats related to reporting, authorized witness protection measures are available.",
    cta: "Request Witness Protection",
    status: "Available",
  },
  {
    priority: "Recommended",
    priorityColor: "text-navy-700 bg-navy-50 border-navy-100",
    icon: <Home size={20} className="text-navy-700" />,
    title: "Rehabilitation & Welfare Support",
    desc: "Long-term welfare schemes and rehabilitation resources are available under government programmes.",
    cta: "Learn More",
    status: "Available",
  },
];

export default function Recommendations() {
  const nav = useNavigate();
  const [requested, setRequested] = useState<Set<number>>(new Set());

  return (
    <UserLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-navy-900">Recommended Next Steps</h1>
          <p className="text-sm text-slate-500 mt-1">Based on your AI assessment — reviewed by authorized personnel before action. Demo Data.</p>
        </div>

        {/* Emergency notice */}
        <div className="bg-critical-50 border border-critical-100 rounded p-4 mb-6 flex items-start gap-3">
          <AlertCircle size={16} className="text-critical-700 mt-0.5 shrink-0" />
          <div>
            <div className="font-bold text-critical-700 text-sm mb-0.5">Immediate Support Available</div>
            <p className="text-sm text-critical-700">If you are in immediate danger, please call <strong className="font-mono">112</strong> (Emergency) or <strong className="font-mono">14566</strong> (RAAHAT Helpline) immediately.</p>
          </div>
        </div>

        <div className="space-y-4">
          {RECS.map((r, i) => (
            <div key={i} className={`bg-white border rounded p-5 ${r.urgent ? "border-critical-200" : "border-slate-200"}`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${r.urgent ? "bg-critical-50" : "bg-navy-50"}`}>
                  {r.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="font-bold text-navy-900">{r.title}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${r.priorityColor}`}>{r.priority}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-3">{r.desc}</p>
                  {requested.has(i) ? (
                    <div className="flex items-center gap-1.5 text-sm text-safe-700 font-semibold">
                      <CheckCircle size={14} /> Request Submitted — You will be contacted shortly.
                    </div>
                  ) : (
                    <button
                      onClick={() => setRequested(prev => new Set([...prev, i]))}
                      className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded ${r.urgent ? "bg-critical-700 text-white hover:bg-critical-800" : "border border-navy-300 text-navy-800 hover:bg-navy-50"}`}
                    >
                      {r.cta} <ChevronRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button onClick={() => nav("/case-summary")} className="px-5 py-2.5 bg-navy-900 text-white font-semibold text-sm rounded hover:bg-navy-800 flex items-center gap-1.5">
            View AI Case Summary <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </UserLayout>
  );
}
