import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { DEMO_CASES } from "../data/sampleData";
import { PriorityBadge, StatusBadge } from "../components/Badge";
import { ChevronLeft, ChevronDown, ChevronUp, AlertCircle, CheckCircle, User, Gavel, HeartPulse, ArrowUp, RefreshCw, Flag } from "lucide-react";

function SviExplain({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded mb-4">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-navy-900">
        How was the SVI generated?
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-slate-600 space-y-2 border-t border-slate-200 pt-3">
          <p>The Stress Vulnerability Index (SVI) is computed from multiple signals:</p>
          <ul className="list-disc ml-4 space-y-1 text-sm">
            {["Reported severity of incident", "Immediate safety concerns expressed", "Fear and threat indicators in speech/text", "Emotional distress markers", "Social isolation signals", "Available support system", "Case-type historical severity", "Speech pattern anomalies"].map(s => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <div className="bg-amber-50 border border-amber-100 rounded p-3 flex items-start gap-2 mt-3">
            <AlertCircle size={13} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">SVI is an AI-assisted prioritization indicator. It should support — not replace — professional judgment. Human review is required before any intervention.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCaseDetail() {
  const nav = useNavigate();
  const { id } = useParams<{ id: string }>();
  const caseData = DEMO_CASES.find(c => c.id === id) ?? DEMO_CASES[0];
  const [sviOpen, setSviOpen] = useState(false);
  const [actionDone, setActionDone] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<string | null>(null);

  function doAction(action: string) {
    if (confirm === action) {
      setActionDone(prev => new Set([...prev, action]));
      setConfirm(null);
    } else {
      setConfirm(action);
    }
  }

  const ACTIONS = [
    { key: "counsellor", icon: <User size={14} />, label: "Assign Counsellor", color: "border-navy-300 text-navy-800 hover:bg-navy-50" },
    { key: "legal", icon: <Gavel size={14} />, label: "Assign Legal Aid", color: "border-navy-300 text-navy-800 hover:bg-navy-50" },
    { key: "medical", icon: <HeartPulse size={14} />, label: "Request Medical", color: "border-amber-300 text-amber-800 hover:bg-amber-50" },
    { key: "escalate", icon: <ArrowUp size={14} />, label: "Escalate Case", color: "border-critical-300 text-critical-700 hover:bg-critical-50" },
    { key: "review", icon: <Flag size={14} />, label: "Request Human Review", color: "border-navy-300 text-navy-800 hover:bg-navy-50" },
    { key: "update", icon: <RefreshCw size={14} />, label: "Update Status", color: "border-slate-300 text-slate-700 hover:bg-slate-50" },
  ];

  return (
    <AdminLayout>
      <div className="px-6 py-6 max-w-4xl">
        {/* Breadcrumb */}
        <button onClick={() => nav(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-800 mb-5">
          <ChevronLeft size={14} /> Back to Case List
        </button>

        {/* Header */}
        <div className="bg-white border border-slate-200 rounded p-5 mb-5">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <div className="font-mono text-xs text-slate-400 mb-1">{caseData.id} — Demo Data</div>
              <h1 className="text-xl font-bold text-navy-900">{caseData.holder}</h1>
              <div className="text-sm text-slate-500 mt-0.5">{caseData.district}, {caseData.state}</div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <PriorityBadge priority={caseData.priority} size="md" />
              <StatusBadge status={caseData.status} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { k: "SVI Score", v: `${caseData.svi} / 100`, mono: true, color: caseData.svi >= 80 ? "text-critical-700" : caseData.svi >= 60 ? "text-high-700" : "text-amber-700" },
              { k: "Problem Type", v: caseData.problem },
              { k: "Date Filed", v: caseData.date },
              { k: "Assigned Support", v: caseData.assigned || "Pending" },
            ].map(({ k, v, mono, color }) => (
              <div key={k}>
                <div className="text-xs text-slate-400 mb-0.5">{k}</div>
                <div className={`text-sm font-bold ${color ?? "text-navy-900"} ${mono ? "font-mono" : ""}`}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <SviExplain open={sviOpen} onToggle={() => setSviOpen(!sviOpen)} />

        {/* AI Summary */}
        <div className="bg-white border border-slate-200 rounded mb-5">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-navy-900">AI-Generated Case Summary</h2>
            <p className="text-xs text-slate-400 mt-0.5">AI Assessment Confidence: Moderate — Human Review Recommended</p>
          </div>
          <div className="p-5 space-y-4">
            <SummarySection title="Reported Experience">
              The complainant reported ongoing threats and intimidation, expressing fear of returning home and inability to secure community support. They indicated significant emotional distress and described feeling isolated.
            </SummarySection>
            <SummarySection title="Detected Vulnerability Indicators">
              <div className="grid grid-cols-2 gap-2 mt-1">
                {[["Fear", "High"], ["Distress", "High"], ["Anxiety", "Moderate–High"], ["Social Isolation", "High"], ["Perceived Threat", "Critical"], ["Safety Concern", "High"]].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded px-3 py-1.5">
                    <span className="text-xs text-slate-600">{k}</span>
                    <span className={`text-xs font-bold ${v === "Critical" ? "text-critical-700" : v.startsWith("High") ? "text-high-700" : "text-amber-700"}`}>{v}</span>
                  </div>
                ))}
              </div>
            </SummarySection>
            <SummarySection title="Potential Consequences of Delayed Support">
              <span className="text-amber-800">Delayed support may increase the complainant's vulnerability and prolong access to appropriate legal, psychological and protective services.</span>
            </SummarySection>
            <SummarySection title="Recommended Actions">
              <div className="flex flex-wrap gap-2">
                {["Counselling", "Legal Aid", "Safety Assessment", "Medical Assessment", "Rehabilitation Support"].map(s => (
                  <span key={s} className="text-xs font-semibold bg-navy-50 text-navy-800 border border-navy-100 px-2.5 py-1 rounded">{s}</span>
                ))}
              </div>
            </SummarySection>
          </div>
        </div>

        {/* Admin actions */}
        <div className="bg-white border border-slate-200 rounded p-5">
          <h2 className="font-bold text-navy-900 mb-4">Admin Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ACTIONS.map(a => (
              <div key={a.key}>
                {actionDone.has(a.key) ? (
                  <div className="flex items-center gap-1.5 text-sm text-safe-700 font-semibold bg-safe-50 border border-safe-100 rounded px-3 py-2.5">
                    <CheckCircle size={13} /> Done
                  </div>
                ) : confirm === a.key ? (
                  <div className="border border-amber-300 bg-amber-50 rounded p-2.5">
                    <p className="text-xs text-amber-800 mb-2">Confirm: {a.label}?</p>
                    <div className="flex gap-1.5">
                      <button onClick={() => doAction(a.key)} className="text-xs font-bold bg-navy-900 text-white px-2 py-1 rounded">Confirm</button>
                      <button onClick={() => setConfirm(null)} className="text-xs text-slate-500 px-2 py-1 rounded border border-slate-200">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => doAction(a.key)} className={`w-full flex items-center gap-2 text-sm font-semibold border px-3 py-2.5 rounded text-left ${a.color}`}>
                    {a.icon} {a.label}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-bold text-navy-600 uppercase tracking-wide mb-2">{title}</div>
      <div className="text-sm text-slate-700 leading-relaxed">{children}</div>
    </div>
  );
}
