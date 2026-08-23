import { useNavigate } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import { Mic, MessageSquare, AlertCircle, Clock, Shield, ChevronRight, CheckCircle } from "lucide-react";
import { StatusBadge } from "../components/Badge";

export default function UserDashboard() {
  const nav = useNavigate();

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="bg-navy-950 text-white rounded p-6 mb-6">
          <h1 className="text-xl font-bold mb-1">Welcome. You are not alone.</h1>
          <p className="text-navy-300 text-sm leading-relaxed">
            Tell us what happened in the way that feels most comfortable to you. RAAHAT is here to listen and connect you with the right support.
          </p>
        </div>

        {/* Main actions */}
        <div className="grid md:grid-cols-2 gap-5 mb-6">
          <ActionCard
            icon={<Mic size={28} className="text-navy-700" />}
            title="Talk Through Voice"
            desc="Speak naturally and tell us what you are experiencing. RAAHAT will listen and assist."
            cta="Start Voice Support"
            onClick={() => nav("/voice")}
          />
          <ActionCard
            icon={<MessageSquare size={28} className="text-navy-700" />}
            title="Continue with Chat"
            desc="Describe your situation through text at your own pace."
            cta="Open Chat Support"
            onClick={() => nav("/chat")}
          />
        </div>

        {/* Case Status */}
        <div className="bg-white border border-slate-200 rounded mb-6">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-navy-900">Case Status</h2>
            <button onClick={() => nav("/my-case")} className="text-sm text-navy-700 hover:underline flex items-center gap-1">
              View Full Case <ChevronRight size={14} />
            </button>
          </div>
          <div className="p-5 grid md:grid-cols-2 gap-4">
            <InfoRow label="Case ID" value="RAH-2026-00124" mono />
            <InfoRow label="Current Status" value={<StatusBadge status="Human Review Required" />} />
            <InfoRow label="Assessment Status" value={<StatusBadge status="Under Review" />} />
            <InfoRow label="Priority" value={<span className="text-sm font-bold text-critical-700">HIGH PRIORITY</span>} />
            <InfoRow label="Assigned Support" value="Counselling (Pending)" />
            <InfoRow label="Last Updated" value="22 Aug 2026, 10:47 AM" />
          </div>
        </div>

        {/* AI Disclaimer */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded p-4 text-sm text-amber-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="leading-relaxed">
            <strong>Assessment Disclaimer:</strong> RAAHAT's AI assessment provides an indication of vulnerability to help prioritize support. It does not replace assessment by a qualified professional.
          </p>
        </div>

        {/* Quick actions */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <QuickLink icon={<Clock size={16} />} label="View Case Timeline" onClick={() => nav("/my-case")} />
          <QuickLink icon={<Shield size={16} />} label="Privacy & Consent" onClick={() => nav("/privacy")} />
          <QuickLink icon={<CheckCircle size={16} />} label="View Recommendations" onClick={() => nav("/recommendations")} />
        </div>
      </div>
    </UserLayout>
  );
}

function ActionCard({ icon, title, desc, cta, onClick }: { icon: React.ReactNode; title: string; desc: string; cta: string; onClick: () => void }) {
  return (
    <div className="bg-white border border-slate-200 rounded p-6 flex flex-col gap-4 hover:border-navy-300 cursor-pointer" onClick={onClick}>
      <div className="w-12 h-12 bg-navy-50 rounded flex items-center justify-center">{icon}</div>
      <div>
        <h3 className="font-bold text-navy-900 mb-1.5">{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">{desc}</p>
        <button className="flex items-center gap-1.5 text-sm font-semibold text-navy-800 hover:text-navy-900">
          {cta} <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-0.5">{label}</div>
      <div className={`text-sm font-semibold text-navy-900 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function QuickLink({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2.5 px-4 py-3 border border-slate-200 rounded bg-white text-sm font-medium text-slate-700 hover:border-navy-300 hover:text-navy-800 w-full">
      <span className="text-navy-600">{icon}</span> {label}
    </button>
  );
}
