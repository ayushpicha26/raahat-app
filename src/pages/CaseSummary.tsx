import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import { Flag, ChevronRight, AlertCircle, Info } from "lucide-react";

export default function CaseSummary() {
  const nav = useNavigate();
  const [flagged, setFlagged] = useState(false);

  return (
    <UserLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs font-bold text-navy-600 uppercase tracking-widest mb-1">AI-Generated</div>
            <h1 className="text-xl font-bold text-navy-900">Case Summary</h1>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">RAH-2026-00124 — Demo Data — 22 Aug 2026</p>
          </div>
          <button onClick={() => nav("/my-case")} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 border border-navy-300 text-navy-800 rounded hover:bg-navy-50">
            My Case <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-4">
          <Section title="Problem Type">
            <Tag label="Threat / Intimidation" color="critical" />
            <Tag label="Social Isolation" color="high" />
          </Section>

          <Section title="User's Reported Experience">
            <p className="text-sm text-slate-700 leading-relaxed">
              The complainant reported experiencing ongoing threats and intimidation related to their identity and social standing. They described fear of returning home, inability to sleep, and lack of local community support. The complainant stated they were unsure of available options and felt isolated.
            </p>
          </Section>

          <Section title="Emotional / Vulnerability Indicators">
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Fear", "High"],
                ["Distress", "High"],
                ["Anxiety Indicators", "Moderate–High"],
                ["Social Isolation", "High"],
                ["Perceived Threat", "Critical"],
                ["Immediate Safety Concerns", "High"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center border border-slate-100 bg-slate-50 rounded px-3 py-2">
                  <span className="text-sm text-slate-700">{k}</span>
                  <span className={`text-xs font-bold ${v === "Critical" ? "text-critical-700" : v.startsWith("High") ? "text-high-700" : v.startsWith("Moderate") ? "text-amber-700" : "text-safe-700"}`}>{v}</span>
                </div>
              ))}
            </div>
          </Section>

          <div className="grid md:grid-cols-3 gap-4">
            <MetricCard label="Severity Assessment" value="High" subtext="Multiple high-risk indicators across emotional and safety dimensions." color="high" />
            <MetricCard label="Stress Vulnerability Index" value="78 / 100" subtext="AI-assisted prioritization score" color="high" mono />
            <MetricCard label="Case Priority" value="HIGH" subtext="Requires timely human review and support allocation" color="high" />
          </div>

          <Section title="Potential Consequences if Support Is Delayed">
            <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded p-4">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <p className="leading-relaxed">Delayed support may increase the complainant's vulnerability and prolong access to appropriate legal, psychological and protective services.</p>
            </div>
          </Section>

          <Section title="Recommended Support">
            <div className="flex flex-wrap gap-2">
              {["Counselling", "Legal Aid", "Medical Assessment", "Safety Assessment", "Rehabilitation Support"].map(s => (
                <span key={s} className="text-xs font-semibold bg-navy-50 text-navy-800 border border-navy-100 px-3 py-1.5 rounded">{s}</span>
              ))}
            </div>
          </Section>

          <div className="bg-white border border-slate-200 rounded p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-navy-900 text-sm">AI Assessment Confidence & Review</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-3 border border-amber-100 bg-amber-50 rounded px-3 py-2.5">
                <Info size={14} className="text-amber-600 shrink-0" />
                <div>
                  <div className="text-xs text-amber-700">AI Assessment Confidence</div>
                  <div className="font-bold text-amber-800 text-sm">Moderate</div>
                </div>
              </div>
              <div className="flex items-center gap-3 border border-navy-100 bg-navy-50 rounded px-3 py-2.5">
                <Info size={14} className="text-navy-600 shrink-0" />
                <div>
                  <div className="text-xs text-navy-700">Human Review</div>
                  <div className="font-bold text-navy-800 text-sm">Recommended</div>
                </div>
              </div>
            </div>
            {flagged ? (
              <div className="flex items-center gap-2 text-sm font-semibold text-safe-700 bg-safe-50 border border-safe-100 rounded px-4 py-2.5">
                <Flag size={14} /> Flagged for Professional Review — Thank you.
              </div>
            ) : (
              <button onClick={() => setFlagged(true)} className="flex items-center gap-2 text-sm font-semibold border border-navy-300 text-navy-800 px-4 py-2.5 rounded hover:bg-navy-50">
                <Flag size={14} /> Flag for Professional Review
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
    <div className="bg-white border border-slate-200 rounded p-5">
      <h3 className="font-bold text-navy-900 text-sm mb-3 uppercase tracking-wide text-xs text-navy-600">{title}</h3>
      {children}
    </div>
  );
}

function Tag({ label, color }: { label: string; color: "critical" | "high" | "amber" | "safe" }) {
  const styles = { critical: "bg-critical-50 text-critical-700 border-critical-100", high: "bg-high-50 text-high-700 border-high-100", amber: "bg-amber-50 text-amber-700 border-amber-100", safe: "bg-safe-50 text-safe-700 border-safe-100" };
  return <span className={`inline-flex text-sm font-bold px-3 py-1 rounded border mr-2 mb-1 ${styles[color]}`}>{label}</span>;
}

function MetricCard({ label, value, subtext, color, mono = false }: { label: string; value: string; subtext: string; color: string; mono?: boolean }) {
  const textColor = color === "critical" ? "text-critical-700" : color === "high" ? "text-high-700" : color === "amber" ? "text-amber-700" : "text-safe-700";
  return (
    <div className="bg-white border border-slate-200 rounded p-4">
      <div className="text-xs text-slate-500 mb-1.5 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mb-1 ${textColor} ${mono ? "font-mono" : ""}`}>{value}</div>
      <div className="text-xs text-slate-500">{subtext}</div>
    </div>
  );
}
