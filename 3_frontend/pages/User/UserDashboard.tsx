import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../../components/layout/UserLayout";
import { Mic, MessageSquare, AlertCircle, Clock, Shield, ChevronRight, CheckCircle, Sparkles } from "lucide-react";
import { StatusBadge } from "../../components/common/Badge";
import { getStoredAssessment } from "../../utils/assessmentStore";
import { api, getUser } from "../../utils/api";

interface CaseData {
  case_id: string;
  svi: number;
  priority: "Critical" | "High" | "Moderate" | "Low";
  priority_label: string;
  status: string;
  assigned_officer: string;
  assigned_service: string;
  created_at: string;
  updated_at: string;
}

export default function UserDashboard() {
  const nav = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeCase, setActiveCase] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getUser();
    setCurrentUser(user);

    // Fetch user's cases from API
    if (user) {
      api.get<{ cases: CaseData[] }>("/cases?limit=1")
        .then(async res => {
          if (res.ok && res.data?.cases && res.data.cases.length > 0) {
            setActiveCase(res.data.cases[0]);
            setLoading(false);
          } else if (user.caseId) {
            const detailRes = await api.get<CaseData>(`/cases/${user.caseId}`);
            if (detailRes.ok && detailRes.data) {
              setActiveCase(detailRes.data);
            }
            setLoading(false);
          } else {
            setLoading(false);
          }
        })
        .catch(err => {
          console.error("Error fetching cases:", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const hasCase = activeCase !== null;

  const currentCaseId = activeCase?.case_id || "No Active Case";
  const priorityLabel = activeCase?.priority_label || "PENDING ASSESSMENT";
  const priorityColor = activeCase?.priority === "Critical"
    ? "text-critical-700 font-bold"
    : activeCase?.priority === "High"
    ? "text-high-700 font-bold"
    : activeCase?.priority === "Moderate"
    ? "text-amber-700 font-bold"
    : activeCase?.priority === "Low"
    ? "text-safe-700 font-bold"
    : "text-slate-400";

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="bg-navy-950 text-white rounded-lg p-6 mb-6 shadow-sm">
          <h1 className="text-xl font-bold mb-1">
            Welcome, {currentUser?.name || "Citizen"}. You are not alone.
          </h1>
          <p className="text-navy-300 text-sm leading-relaxed">
            Tell us what happened in the way that feels most comfortable to you. RAAHAT is here to listen, assess your situation in real time, and connect you with the right support.
          </p>
        </div>

        {/* Main actions */}
        <div className="grid md:grid-cols-2 gap-5 mb-6">
          <ActionCard
            icon={<Mic size={28} className="text-navy-700" />}
            title="Talk Through Voice"
            desc="Speak naturally into your microphone. Real-time speech transcription & instant vulnerability assessment."
            cta="Start Voice Support"
            badge="Real-Time Voice AI"
            onClick={() => nav("/voice-assessment")}
          />
          <ActionCard
            icon={<MessageSquare size={28} className="text-navy-700" />}
            title="Continue with Chat"
            desc="Describe your situation through text or voice dictation at your own pace with empathetic AI guidance."
            cta="Open Chat Support"
            onClick={() => nav("/chat-assessment")}
          />
        </div>

        {/* Case Status */}
        <div className="bg-white border border-slate-200 rounded-lg mb-6 shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-navy-900 flex items-center gap-2">
              Active Case Status
              {hasCase && (
                <span className="text-xs bg-navy-50 text-navy-800 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                  <Sparkles size={11} /> SVI: {activeCase?.svi}/100
                </span>
              )}
            </h2>
            {hasCase && (
              <button onClick={() => nav("/my-case")} className="text-sm text-navy-700 hover:underline flex items-center gap-1 font-medium">
                View Full Case <ChevronRight size={14} />
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="p-10 text-center text-slate-400">Loading your case status...</div>
          ) : hasCase ? (
            <div className="p-5 grid md:grid-cols-2 gap-4">
              <InfoRow label="Case ID" value={currentCaseId} mono />
              <InfoRow label="Current Status" value={<StatusBadge status={activeCase?.status || "Under Review"} />} />
              <InfoRow label="Assessment Status" value={<StatusBadge status="Complete" />} />
              <InfoRow label="Priority Tier" value={<span className={`text-sm ${priorityColor}`}>{priorityLabel}</span>} />
              <InfoRow label="Assigned Support" value={activeCase?.assigned_officer ? `${activeCase.assigned_officer} (${activeCase.assigned_service})` : (activeCase?.assigned_service || "Pending Assignment")} />
              <InfoRow label="Last Evaluated" value={activeCase?.updated_at ? new Date(activeCase.updated_at).toLocaleString("en-IN") : "Today"} />
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <AlertCircle size={24} className="mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-semibold mb-1">No Active Cases Found</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Complete a Voice or Chat Support assessment above to register your case and receive recommendations.
              </p>
            </div>
          )}
        </div>

        {/* AI Disclaimer */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs sm:text-sm text-amber-900">
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

function ActionCard({ icon, title, desc, cta, badge, onClick }: { icon: React.ReactNode; title: string; desc: string; cta: string; badge?: string; onClick: () => void }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between gap-4 hover:border-navy-400 hover:shadow-xs cursor-pointer transition-all" onClick={onClick}>
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="w-12 h-12 bg-navy-50 rounded-lg flex items-center justify-center border border-navy-100">{icon}</div>
          {badge && <span className="text-[11px] font-semibold text-navy-800 bg-navy-50 border border-navy-100 px-2 py-0.5 rounded">{badge}</span>}
        </div>
        <h3 className="font-bold text-navy-900 mb-1.5">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{desc}</p>
      </div>
      <button className="flex items-center gap-1.5 text-sm font-semibold text-navy-800 hover:text-navy-900 self-start">
        {cta} <ChevronRight size={14} />
      </button>
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
    <button onClick={onClick} className="flex items-center gap-2.5 px-4 py-3 border border-slate-200 rounded-lg bg-white text-xs sm:text-sm font-medium text-slate-700 hover:border-navy-300 hover:text-navy-900 w-full transition-all shadow-2xs">
      <span className="text-navy-600">{icon}</span> {label}
    </button>
  );
}
