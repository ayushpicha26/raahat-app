import { useNavigate } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import { AlertCircle, ChevronRight, Info } from "lucide-react";

const FACTORS = [
  { label: "Emotional Distress", value: 88, contrib: "High", conf: "High" },
  { label: "Fear / Threat", value: 91, contrib: "Very High", conf: "High" },
  { label: "Anxiety Indicators", value: 76, contrib: "High", conf: "Moderate" },
  { label: "Social Isolation", value: 82, contrib: "High", conf: "Moderate" },
  { label: "Immediate Safety Concerns", value: 85, contrib: "Critical", conf: "High" },
  { label: "Case Severity", value: 79, contrib: "High", conf: "Moderate" },
  { label: "Support Availability", value: 24, contrib: "Low (Adverse)", conf: "High" },
];

function SviBand({ value }: { value: number }) {
  const pct = value;
  const color = value >= 80 ? "#9b1c1c" : value >= 60 ? "#c2410c" : value >= 40 ? "#b45309" : "#2e7d52";
  return (
    <div>
      <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <div style={{ width: `${pct}%`, background: color }} className="h-full rounded-full transition-all duration-700" />
      </div>
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>Low</span><span>Moderate</span><span>High</span><span>Critical</span>
      </div>
    </div>
  );
}

export default function AssessmentResult() {
  const nav = useNavigate();
  const SVI = 78;

  return (
    <UserLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-navy-900">Your RAAHAT Assessment</h1>
          <p className="text-sm text-slate-500 mt-1">Generated on 22 Aug 2026, 10:51 AM — Demo Data</p>
        </div>

        {/* SVI Card */}
        <div className="bg-white border border-slate-200 rounded p-6 mb-5">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full border-4 border-high-700 flex flex-col items-center justify-center bg-high-50">
                <div className="text-3xl font-bold text-high-700 font-mono">{SVI}</div>
                <div className="text-xs text-high-700">/100</div>
              </div>
              <div className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest">SVI Score</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center bg-high-50 text-high-700 border border-high-100 text-sm font-bold px-3 py-1 rounded">HIGH PRIORITY</span>
              </div>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">Your responses contain indicators of significant emotional distress and vulnerability. Appropriate support has been identified and recommended.</p>
              <SviBand value={SVI} />
            </div>
          </div>
        </div>

        {/* Factors */}
        <div className="bg-white border border-slate-200 rounded mb-5">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-navy-900">Assessment Factors</h2>
            <div className="flex items-center gap-1 text-xs text-slate-400"><Info size={12} /> AI-assisted indicators only</div>
          </div>
          <div className="p-5 space-y-4">
            {FACTORS.map((f, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-40 text-sm text-slate-700 shrink-0">{f.label}</div>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${f.value >= 80 ? "bg-critical-700" : f.value >= 60 ? "bg-high-700" : f.value >= 40 ? "bg-amber-700" : "bg-safe-700"}`} style={{ width: `${f.value}%` }} />
                </div>
                <div className="w-20 text-xs font-semibold text-right">
                  <span className={`${f.value >= 80 ? "text-critical-700" : f.value >= 60 ? "text-high-700" : f.value >= 40 ? "text-amber-700" : "text-safe-700"}`}>{f.contrib}</span>
                </div>
                <div className="w-20 text-xs text-slate-400 text-right">Conf: {f.conf}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded p-4 text-sm text-amber-800 mb-6">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <p>
            <strong>Important:</strong> This score is an AI-assisted vulnerability indicator and not a medical diagnosis. Results are reviewed by authorized professionals before any action is taken.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => nav("/recommendations")} className="flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-white font-semibold text-sm rounded hover:bg-navy-800">
            View Recommendations <ChevronRight size={16} />
          </button>
          <button onClick={() => nav("/case-summary")} className="px-5 py-2.5 border border-navy-300 text-navy-800 font-semibold text-sm rounded hover:bg-navy-50">
            View AI Case Summary
          </button>
        </div>
      </div>
    </UserLayout>
  );
}
