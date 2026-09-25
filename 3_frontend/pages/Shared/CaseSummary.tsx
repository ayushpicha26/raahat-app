import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../../components/layout/UserLayout";
import { Flag, ChevronRight, AlertCircle, Info, Sparkles, CheckCircle2 } from "lucide-react";
import { getStoredAssessment } from "../../utils/assessmentStore";
import { AssessmentResultData } from "../../utils/aiEngine";

export default function CaseSummary() {
  const nav = useNavigate();
  const [flagged, setFlagged] = useState(false);
  const [assessment, setAssessment] = useState<AssessmentResultData | null>(null);

  useEffect(() => {
    setAssessment(getStoredAssessment());
  }, []);

  if (!assessment) return null;

  const SVI = assessment.svi;
  const priorityColor = assessment.priority === "Critical" ? "critical" : assessment.priority === "High" ? "high" : assessment.priority === "Moderate" ? "amber" : "safe";

  return (
    <UserLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs font-bold text-navy-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Sparkles size={12} /> AI-Generated Summary
            </div>
            <h1 className="text-xl font-bold text-navy-900">Case Summary</h1>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{assessment.id} — Evaluated on {assessment.date}</p>
          </div>
          <button onClick={() => nav("/my-case")} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 border border-navy-300 text-navy-800 rounded hover:bg-navy-50 transition-colors">
            My Case <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-4">
          <Section title="Problem Type Identified">
            <div className="flex flex-wrap gap-2">
              {assessment.problemTypes.map((pt, idx) => (
                <Tag key={idx} label={pt.label} color={pt.color} />
              ))}
            </div>
          </Section>

          <Section title="User's Reported Experience (Live Spoken / Text Input)">
            <div className="bg-slate-50 border border-slate-200 rounded p-4">
              <p className="text-sm text-slate-800 leading-relaxed italic font-normal">
                "{assessment.transcript}"
              </p>
            </div>
          </Section>

          <Section title="Emotional / Vulnerability Indicators">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {assessment.indicators.map(([k, v]) => (
                <div key={k} className="flex justify-between items-center border border-slate-100 bg-slate-50 rounded px-3.5 py-2">
                  <span className="text-xs sm:text-sm text-slate-700">{k}</span>
                  <span className={`text-xs font-bold ${
                    v === "Critical" ? "text-critical-700" : v.startsWith("High") ? "text-high-700" : v.startsWith("Moderate") ? "text-amber-700" : "text-safe-700"
                  }`}>{v}</span>
                </div>
              ))}
            </div>
          </Section>

          <div className="grid sm:grid-cols-3 gap-4">
            <MetricCard
              label="Severity Assessment"
              value={assessment.priority}
              subtext="Computed from emotional, safety & threat markers."
              color={priorityColor}
            />
            <MetricCard
              label="Stress Vulnerability Index"
              value={`${SVI} / 100`}
              subtext="Prioritization index"
              color={priorityColor}
              mono
            />
            <MetricCard
              label="Case Priority"
              value={assessment.priority.toUpperCase()}
              subtext="Recommended service dispatch tier"
              color={priorityColor}
            />
          </div>

          <Section title="Potential Consequences if Support Is Delayed">
            <div className="flex items-start gap-2 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded p-4">
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-700" />
              <p className="leading-relaxed text-xs sm:text-sm">{assessment.consequences}</p>
            </div>
          </Section>

          <Section title="Recommended Support Services">
            <div className="flex flex-wrap gap-2">
              {assessment.recommendations.map((rec, i) => (
                <span key={i} className="text-xs font-semibold bg-navy-50 text-navy-800 border border-navy-100 px-3 py-1.5 rounded">
                  {rec.title}
                </span>
              ))}
            </div>
          </Section>

          <div className="bg-white border border-slate-200 rounded p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-navy-900 text-sm">AI Assessment Confidence & Review</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-3 border border-amber-100 bg-amber-50 rounded px-3 py-2.5">
                <Info size={15} className="text-amber-600 shrink-0" />
                <div>
                  <div className="text-xs text-amber-700">AI Assessment Confidence</div>
                  <div className="font-bold text-amber-900 text-sm">High (Real-time Extraction)</div>
                </div>
              </div>
              <div className="flex items-center gap-3 border border-navy-100 bg-navy-50 rounded px-3 py-2.5">
                <Info size={15} className="text-navy-600 shrink-0" />
                <div>
                  <div className="text-xs text-navy-700">Human Review</div>
                  <div className="font-bold text-navy-900 text-sm">Recommended</div>
                </div>
              </div>
            </div>
            {flagged ? (
              <div className="flex items-center gap-2 text-sm font-semibold text-safe-700 bg-safe-50 border border-safe-100 rounded px-4 py-2.5">
                <CheckCircle2 size={16} /> Flagged for Professional Officer Review — Logged securely.
              </div>
            ) : (
              <button onClick={() => setFlagged(true)} className="flex items-center gap-2 text-sm font-semibold border border-navy-300 text-navy-800 px-4 py-2.5 rounded hover:bg-navy-50 transition-colors">
                <Flag size={14} /> Flag for Professional Officer Review
              </button>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded p-5 shadow-xs">
      <h3 className="font-bold text-navy-900 mb-3 uppercase tracking-wide text-xs text-navy-600">{title}</h3>
      {children}
    </div>
  );
}

function Tag({ label, color }: { label: string; color: "critical" | "high" | "amber" | "safe" }) {
  const styles = {
    critical: "bg-critical-50 text-critical-700 border-critical-200",
    high: "bg-high-50 text-high-700 border-high-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    safe: "bg-safe-50 text-safe-700 border-safe-200",
  };
  return <span className={`inline-flex text-xs font-bold px-3 py-1 rounded border mr-2 mb-1 ${styles[color]}`}>{label}</span>;
}

function MetricCard({ label, value, subtext, color, mono = false }: { label: string; value: string; subtext: string; color: string; mono?: boolean }) {
  const textColor = color === "critical" ? "text-critical-700" : color === "high" ? "text-high-700" : color === "amber" ? "text-amber-700" : "text-safe-700";
  return (
    <div className="bg-white border border-slate-200 rounded p-4 shadow-xs">
      <div className="text-xs text-slate-500 mb-1.5 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mb-1 ${textColor} ${mono ? "font-mono" : ""}`}>{value}</div>
      <div className="text-xs text-slate-500">{subtext}</div>
    </div>
  );
}
