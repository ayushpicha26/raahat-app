import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../../components/layout/UserLayout";
import { MessageCircle, Gavel, HeartPulse, Shield, ShieldCheck, Home, AlertCircle, CheckCircle, ChevronRight, Sparkles } from "lucide-react";
import { getStoredAssessment } from "../../utils/assessmentStore";
import { AssessmentResultData, SupportRecommendation } from "../../utils/aiEngine";
import { api } from "../../utils/api";

export default function Recommendations() {
  const nav = useNavigate();
  const [requested, setRequested] = useState<Set<number>>(new Set());
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [assessment, setAssessment] = useState<AssessmentResultData | null>(null);

  useEffect(() => {
    setAssessment(getStoredAssessment());
  }, []);

  if (!assessment) return null;

  const recommendations = assessment.recommendations;

  function getIcon(type: SupportRecommendation["iconType"]) {
    switch (type) {
      case "shield":
        return <Shield size={20} className="text-critical-700" />;
      case "gavel":
        return <Gavel size={20} className="text-navy-700" />;
      case "heart":
        return <HeartPulse size={20} className="text-amber-700" />;
      case "shield-check":
        return <ShieldCheck size={20} className="text-navy-700" />;
      case "home":
        return <Home size={20} className="text-navy-700" />;
      case "message":
      default:
        return <MessageCircle size={20} className="text-navy-700" />;
    }
  }

  function getPriorityBadgeClass(priority?: string, customColor?: string) {
    if (customColor && customColor.trim() && customColor.includes("bg-")) {
      return customColor;
    }
    const p = (priority || "").toLowerCase();
    if (p.includes("immediate") || p.includes("urgent") || p.includes("critical")) {
      return "bg-red-50 text-red-700 border-red-200";
    }
    if (p.includes("high")) {
      return "bg-orange-50 text-orange-700 border-orange-200";
    }
    if (p.includes("recommend") || p.includes("consider")) {
      return "bg-sky-50 text-sky-800 border-sky-200";
    }
    if (p.includes("available")) {
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  }

  async function handleRequestSupport(index: number, title: string) {
    if (!assessment) return;
    setLoadingIndex(index);
    try {
      const res = await api.post<{ ok: boolean }>("/cases/support-request", {
        caseId: assessment.id,
        service: title
      });
      setLoadingIndex(null);
      setRequested(prev => new Set([...prev, index]));
    } catch {
      setLoadingIndex(null);
      setRequested(prev => new Set([...prev, index]));
    }
  }

  return (
    <UserLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="text-xs font-bold text-navy-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Sparkles size={12} /> Personalized Next Steps
          </div>
          <h1 className="text-xl font-bold text-navy-900">Recommended Next Steps</h1>
          <p className="text-sm text-slate-500 mt-1">
            Customized based on your live AI assessment for <span className="font-mono font-semibold">{assessment.id}</span>
          </p>
        </div>

        {/* Emergency notice */}
        {assessment.priority === "Critical" && (
          <div className="bg-critical-50 border border-critical-200 rounded p-4 mb-6 flex items-start gap-3 shadow-xs animate-pulse">
            <AlertCircle size={18} className="text-critical-700 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-critical-700 text-sm mb-0.5">Urgent Protection Protocol Active</div>
              <p className="text-xs sm:text-sm text-critical-800">
                Your assessment indicates acute safety risks. Please call <strong className="font-mono font-bold">112</strong> (National Emergency) or <strong className="font-mono font-bold">14566</strong> (RAAHAT Atrocity Support Helpline) immediately if in imminent danger.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {recommendations.map((r, i) => (
            <div key={i} className={`bg-white border rounded-lg p-5 shadow-xs transition-all ${r.urgent ? "border-critical-300 ring-1 ring-critical-100" : "border-slate-200"}`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${r.urgent ? "bg-critical-50 border border-critical-100" : "bg-navy-50 border border-navy-100"}`}>
                  {getIcon(r.iconType)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h3 className="font-bold text-navy-900 text-sm sm:text-base">{r.title}</h3>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${getPriorityBadgeClass(r.priority, r.priorityColor)}`}>
                      {r.priority}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">{r.desc}</p>
                  {requested.has(i) ? (
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-safe-700 font-semibold bg-safe-50 border border-safe-200 px-3 py-1.5 rounded inline-flex">
                      <CheckCircle size={14} /> Request Dispatched — An authorized officer will follow up with you.
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRequestSupport(i, r.title)}
                      disabled={loadingIndex !== null}
                      className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer ${
                        r.urgent
                          ? "bg-critical-700 text-white hover:bg-critical-800 shadow-xs"
                          : "border border-navy-300 text-navy-800 hover:bg-navy-50"
                      } disabled:opacity-50`}
                    >
                      {loadingIndex === i ? "Submitting..." : r.cta || "Request Support"} <ChevronRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => nav("/case-summary")} className="px-5 py-2.5 bg-navy-900 text-white font-semibold text-sm rounded-lg hover:bg-navy-800 flex items-center gap-1.5 transition-all shadow-xs">
            View AI Case Summary <ChevronRight size={14} />
          </button>
          <button onClick={() => nav("/my-case")} className="px-5 py-2.5 border border-slate-300 text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-50 transition-all">
            Go to My Case Timeline
          </button>
        </div>
      </div>
    </UserLayout>
  );
}
