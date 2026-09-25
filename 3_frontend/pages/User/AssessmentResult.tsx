import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../../components/layout/UserLayout";
import { AlertCircle, ChevronRight, Info, Sparkles, Mic, FileText, CheckCircle } from "lucide-react";
import { getStoredAssessment } from "../../utils/assessmentStore";
import { AssessmentResultData } from "../../utils/aiEngine";

function SviBand({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = value >= 80 ? "#9b1c1c" : value >= 60 ? "#c2410c" : value >= 40 ? "#b45309" : "#2e7d52";
  return (
    <div>
      <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <div style={{ width: `${pct}%`, background: color }} className="h-full rounded-full transition-all duration-1000 ease-out" />
      </div>
      <div className="flex justify-between text-xs text-slate-400 mt-1 font-medium">
        <span>Low (0-39)</span><span>Moderate (40-59)</span><span>High (60-79)</span><span>Critical (80-100)</span>
      </div>
    </div>
  );
}

export default function AssessmentResult() {
  const nav = useNavigate();
  const [assessment, setAssessment] = useState<AssessmentResultData | null>(null);

  useEffect(() => {
    setAssessment(getStoredAssessment());
  }, []);

  if (!assessment) return null;

  const SVI = assessment.svi;
  const isCritical = assessment.priority === "Critical";
  const isHigh = assessment.priority === "High";
  const isModerate = assessment.priority === "Moderate";

  const priorityBadgeStyle = isCritical
    ? "bg-critical-50 text-critical-700 border-critical-200"
    : isHigh
    ? "bg-high-50 text-high-700 border-high-200"
    : isModerate
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-safe-50 text-safe-700 border-safe-200";

  const scoreCircleStyle = isCritical
    ? "border-critical-700 bg-critical-50 text-critical-700"
    : isHigh
    ? "border-high-700 bg-high-50 text-high-700"
    : isModerate
    ? "border-amber-700 bg-amber-50 text-amber-700"
    : "border-safe-700 bg-safe-50 text-safe-700";

  return (
    <UserLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-navy-900 flex items-center gap-2">
              Your RAAHAT Assessment
              <span className="text-xs bg-safe-100 text-safe-800 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle size={12} /> Live Evaluated
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">Generated on {assessment.date} — Case ID: <span className="font-mono font-semibold">{assessment.id}</span></p>
          </div>
          <button
            onClick={() => nav("/voice-assessment")}
            className="text-xs font-semibold text-navy-700 hover:text-navy-900 border border-slate-200 px-3 py-1.5 rounded self-start sm:self-auto flex items-center gap-1.5"
          >
            <Mic size={13} /> Re-assess Voice
          </button>
        </div>

        {/* What was analyzed quote */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-5">
          <div className="flex items-center gap-2 mb-1 text-xs font-bold text-navy-800 uppercase tracking-wider">
            <FileText size={13} /> Transcribed Input Analyzed
          </div>
          <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
            "{assessment.transcript}"
          </p>
        </div>

        {/* SVI Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-5 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center ${scoreCircleStyle}`}>
                <div className="text-3xl font-bold font-mono">{SVI}</div>
                <div className="text-xs opacity-80">/100</div>
              </div>
              <div className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest">SVI Score</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded border ${priorityBadgeStyle}`}>
                  {assessment.priorityLabel}
                </span>
                <span className="text-xs text-slate-400">AI Priority Level</span>
              </div>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                {assessment.summary}
              </p>
              <SviBand value={SVI} />
            </div>
          </div>
        </div>

        {/* Problem Categories Detected */}
        {assessment.problemTypes && assessment.problemTypes.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-5 mb-5 shadow-xs">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3">Identified Issue Categories</h3>
            <div className="flex flex-wrap gap-2">
              {assessment.problemTypes.map((pt, i) => {
                const badgeColor = pt.color === "critical"
                  ? "bg-critical-50 text-critical-700 border-critical-200"
                  : pt.color === "high"
                  ? "bg-high-50 text-high-700 border-high-200"
                  : pt.color === "amber"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-safe-50 text-safe-700 border-safe-200";
                return (
                  <span key={i} className={`text-xs font-bold px-3 py-1.5 rounded border ${badgeColor}`}>
                    {pt.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Assessment Factors */}
        <div className="bg-white border border-slate-200 rounded-lg mb-5 shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-navy-900 text-sm">Individual Vulnerability Factors</h2>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Info size={12} /> Real-time factor extraction
            </div>
          </div>
          <div className="p-5 space-y-4">
            {assessment.factors.map((f, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-44 text-xs sm:text-sm font-medium text-slate-700 shrink-0">{f.label}</div>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      f.value >= 80 ? "bg-critical-700" : f.value >= 65 ? "bg-high-700" : f.value >= 45 ? "bg-amber-700" : "bg-safe-700"
                    }`}
                    style={{ width: `${f.value}%` }}
                  />
                </div>
                <div className="w-24 text-xs font-bold text-right">
                  <span className={
                    f.value >= 80 ? "text-critical-700" : f.value >= 65 ? "text-high-700" : f.value >= 45 ? "text-amber-700" : "text-safe-700"
                  }>
                    {f.contrib}
                  </span>
                </div>
                <div className="w-20 text-xs text-slate-400 text-right hidden sm:block">Conf: {f.conf}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs sm:text-sm text-amber-900 mb-6">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-700" />
          <p className="leading-relaxed">
            <strong>Important Notice:</strong> This score is an AI-assisted vulnerability indicator designed for prioritization and not a psychiatric diagnosis. Results are reviewed by authorized District Welfare Officers.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => nav("/recommendations")} className="flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-white font-semibold text-sm rounded-lg hover:bg-navy-800 transition-all shadow-sm">
            View Recommendations <ChevronRight size={16} />
          </button>
          <button onClick={() => nav("/case-summary")} className="px-5 py-2.5 border border-navy-300 text-navy-800 font-semibold text-sm rounded-lg hover:bg-navy-50 transition-all">
            View AI Case Summary
          </button>
        </div>
      </div>
    </UserLayout>
  );
}
