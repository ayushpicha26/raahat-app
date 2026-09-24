import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/layout/AdminLayout";
import { PriorityBadge, StatusBadge } from "../../components/common/Badge";
import { ChevronLeft, ChevronDown, ChevronUp, AlertCircle, CheckCircle, User, Gavel, HeartPulse, ArrowUp, RefreshCw, Flag, MessageSquare } from "lucide-react";
import { api } from "../../utils/api";

function SviExplain({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded mb-4 shadow-2xs">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-navy-900">
        How was the SVI generated?
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-slate-600 space-y-2 border-t border-slate-200 pt-3">
          <p>The Stress Vulnerability Index (SVI) is computed from multiple signals:</p>
          <ul className="list-disc ml-4 space-y-1 text-xs">
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
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sviOpen, setSviOpen] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadCase();
  }, [id]);

  function loadCase() {
    setLoading(true);
    api.get<any>(`/cases/${id}`)
      .then(res => {
        setLoading(false);
        if (res.ok && res.data) {
          setCaseData(res.data);
        }
      })
      .catch(err => {
        console.error("Error loading case:", err);
        setLoading(false);
      });
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-10 text-center text-slate-400">Loading case file from database...</div>
      </AdminLayout>
    );
  }

  if (!caseData) {
    return (
      <AdminLayout>
        <div className="p-10 text-center text-slate-400">
          <AlertCircle size={24} className="mx-auto mb-2" />
          Case not found in database.
        </div>
      </AdminLayout>
    );
  }

  async function handleAssign(service: string) {
    setConfirm(null);
    setLoading(true);
    const officerName = service === "Counselling" ? "Dr. Meera Joshi" : service === "Legal Aid" ? "DLSA Legal Officer" : "District Medical Officer";
    const res = await api.put<{ ok: boolean }>(`/cases/${id}/assign`, {
      officer: officerName,
      service: service
    });
    if (res.ok) {
      loadCase();
    } else {
      setLoading(false);
      alert(res.error || "Failed to update assignment.");
    }
  }

  async function handleStatusChange(status: string) {
    setConfirm(null);
    setLoading(true);
    const res = await api.put<{ ok: boolean }>(`/cases/${id}/status`, { status });
    if (res.ok) {
      loadCase();
    } else {
      setLoading(false);
      alert(res.error || "Failed to update status.");
    }
  }

  const titleColors: Record<string, string> = {
    Critical: "text-critical-700",
    High: "text-high-700",
    Moderate: "text-amber-700",
    Low: "text-safe-700",
  };

  const assignedLabel = caseData.assigned_officer ? `${caseData.assigned_officer} (${caseData.assigned_service})` : (caseData.assigned_service || "Pending Assignment");

  return (
    <AdminLayout>
      <div className="px-6 py-6 max-w-4xl">
        {/* Breadcrumb */}
        <button onClick={() => nav(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-800 mb-5 cursor-pointer">
          <ChevronLeft size={14} /> Back to Case List
        </button>

        {/* Header */}
        <div className="bg-white border border-slate-200 rounded p-5 mb-5 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <div className="font-mono text-xs text-slate-400 mb-1">{caseData.case_id} — PostgreSQL live</div>
              <h1 className="text-xl font-bold text-navy-900">{caseData.holder}</h1>
              <div className="text-sm text-slate-500 mt-0.5">{caseData.district}, {caseData.state}</div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <PriorityBadge priority={caseData.priority} size="md" />
              <StatusBadge status={caseData.status} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-100 pt-4 mt-2">
            {[
              { k: "SVI Score", v: `${caseData.svi} / 100`, mono: true, color: caseData.svi >= 80 ? "text-critical-700" : caseData.svi >= 60 ? "text-high-700" : "text-amber-700" },
              { k: "Problem Type", v: caseData.problemTypes ? caseData.problemTypes.map((p: any) => typeof p === "string" ? p : p.label).join(", ") : "General Support" },
              { k: "Date Filed", v: new Date(caseData.created_at).toLocaleString("en-IN") },
              { k: "Assigned Support", v: assignedLabel },
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
        <div className="bg-white border border-slate-200 rounded mb-5 shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-navy-900">AI-Generated Case Summary</h2>
              <p className="text-xs text-slate-400 mt-0.5">AI Mode: {caseData.ai_mode || "local"} | Confidence: High</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <SummarySection title="Raw Input Testimony Transcript">
              <div className="bg-navy-50/50 rounded-lg p-4 border border-navy-100/50 text-sm italic text-navy-950 font-serif leading-relaxed">
                "{caseData.transcript}"
              </div>
            </SummarySection>

            <SummarySection title="AI Case Assessment Summary">
              {caseData.summary || "No assessment summary generated."}
            </SummarySection>

            {caseData.indicators && caseData.indicators.length > 0 && (
              <SummarySection title="Detected Vulnerability Indicators">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                  {caseData.indicators.map(([k, v]: [string, string]) => (
                    <div key={k} className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded px-3 py-1.5">
                      <span className="text-xs text-slate-600">{k}</span>
                      <span className={`text-xs font-bold ${v === "Critical" ? "text-critical-700" : v === "High" ? "text-high-700" : "text-amber-700"}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </SummarySection>
            )}

            <SummarySection title="Potential Consequences of Delayed Support">
              <span className="text-critical-700 font-medium">
                {caseData.consequences || "Delayed support may compound psychological trauma and increase safety risks."}
              </span>
            </SummarySection>

            {caseData.recommendations && caseData.recommendations.length > 0 && (
              <SummarySection title="Recommended Actions & Schemes">
                <div className="flex flex-wrap gap-2 mt-1">
                  {caseData.recommendations.map((r: any) => (
                    <span key={r.title} className="text-xs font-semibold bg-navy-50 text-navy-800 border border-navy-100 px-2.5 py-1 rounded">
                      {r.title} ({r.priority})
                    </span>
                  ))}
                </div>
              </SummarySection>
            )}
          </div>
        </div>

        {/* Admin actions */}
        <div className="bg-white border border-slate-200 rounded p-5 shadow-xs">
          <h2 className="font-bold text-navy-900 mb-4 text-sm uppercase tracking-wider">Officer Action Portal</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* Action buttons */}
            <div>
              {confirm === "assign-counsellor" ? (
                <div className="border border-amber-300 bg-amber-50 rounded p-2 text-center shadow-sm">
                  <p className="text-xs text-amber-800 mb-2 font-medium">Assign Dr. Meera Joshi?</p>
                  <div className="flex justify-center gap-1.5">
                    <button onClick={() => handleAssign("Counselling")} className="text-[11px] font-bold bg-navy-900 text-white px-2.5 py-1 rounded">Yes</button>
                    <button onClick={() => setConfirm(null)} className="text-[11px] text-slate-500 px-2.5 py-1 rounded border border-slate-200 bg-white">No</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirm("assign-counsellor")} className="w-full flex items-center gap-2 text-xs font-semibold border border-slate-200 hover:border-navy-400 hover:bg-navy-50 px-3 py-2.5 rounded text-left transition-all">
                  <User size={14} className="text-navy-700" /> Assign Counsellor
                </button>
              )}
            </div>

            <div>
              {confirm === "assign-legal" ? (
                <div className="border border-amber-300 bg-amber-50 rounded p-2 text-center shadow-sm">
                  <p className="text-xs text-amber-800 mb-2 font-medium">Assign DLSA Legal Officer?</p>
                  <div className="flex justify-center gap-1.5">
                    <button onClick={() => handleAssign("Legal Aid")} className="text-[11px] font-bold bg-navy-900 text-white px-2.5 py-1 rounded">Yes</button>
                    <button onClick={() => setConfirm(null)} className="text-[11px] text-slate-500 px-2.5 py-1 rounded border border-slate-200 bg-white">No</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirm("assign-legal")} className="w-full flex items-center gap-2 text-xs font-semibold border border-slate-200 hover:border-navy-400 hover:bg-navy-50 px-3 py-2.5 rounded text-left transition-all">
                  <Gavel size={14} className="text-navy-700" /> Assign Free Legal Aid
                </button>
              )}
            </div>

            <div>
              {confirm === "assign-medical" ? (
                <div className="border border-amber-300 bg-amber-50 rounded p-2 text-center shadow-sm">
                  <p className="text-xs text-amber-800 mb-2 font-medium">Assign Medical Officer?</p>
                  <div className="flex justify-center gap-1.5">
                    <button onClick={() => handleAssign("Medical Help")} className="text-[11px] font-bold bg-navy-900 text-white px-2.5 py-1 rounded">Yes</button>
                    <button onClick={() => setConfirm(null)} className="text-[11px] text-slate-500 px-2.5 py-1 rounded border border-slate-200 bg-white">No</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirm("assign-medical")} className="w-full flex items-center gap-2 text-xs font-semibold border border-slate-200 hover:border-navy-400 hover:bg-navy-50 px-3 py-2.5 rounded text-left transition-all">
                  <HeartPulse size={14} className="text-navy-700" /> Request Medical Aid
                </button>
              )}
            </div>

            <div>
              {confirm === "status-under-review" ? (
                <div className="border border-amber-300 bg-amber-50 rounded p-2 text-center shadow-sm">
                  <p className="text-xs text-amber-800 mb-2 font-medium">Set status to Under Review?</p>
                  <div className="flex justify-center gap-1.5">
                    <button onClick={() => handleStatusChange("Under Review")} className="text-[11px] font-bold bg-navy-900 text-white px-2.5 py-1 rounded">Yes</button>
                    <button onClick={() => setConfirm(null)} className="text-[11px] text-slate-500 px-2.5 py-1 rounded border border-slate-200 bg-white">No</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirm("status-under-review")} className="w-full flex items-center gap-2 text-xs font-semibold border border-slate-200 hover:border-navy-400 hover:bg-navy-50 px-3 py-2.5 rounded text-left transition-all">
                  <RefreshCw size={14} className="text-slate-600" /> Mark Under Review
                </button>
              )}
            </div>

            <div>
              {confirm === "status-resolved" ? (
                <div className="border border-amber-300 bg-amber-50 rounded p-2 text-center shadow-sm">
                  <p className="text-xs text-amber-800 mb-2 font-medium">Mark case as Resolved?</p>
                  <div className="flex justify-center gap-1.5">
                    <button onClick={() => handleStatusChange("Resolved")} className="text-[11px] font-bold bg-navy-900 text-white px-2.5 py-1 rounded">Yes</button>
                    <button onClick={() => setConfirm(null)} className="text-[11px] text-slate-500 px-2.5 py-1 rounded border border-slate-200 bg-white">No</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirm("status-resolved")} className="w-full flex items-center gap-2 text-xs font-semibold border border-slate-200 hover:border-navy-400 hover:bg-navy-50 px-3 py-2.5 rounded text-left transition-all">
                  <CheckCircle size={14} className="text-safe-700" /> Resolve Case File
                </button>
              )}
            </div>

            <div>
              {confirm === "status-escalate" ? (
                <div className="border border-amber-300 bg-amber-50 rounded p-2 text-center shadow-sm">
                  <p className="text-xs text-amber-800 mb-2 font-medium">Escalate to Collector Office?</p>
                  <div className="flex justify-center gap-1.5">
                    <button onClick={() => handleStatusChange("Human Review Required")} className="text-[11px] font-bold bg-navy-900 text-white px-2.5 py-1 rounded">Yes</button>
                    <button onClick={() => setConfirm(null)} className="text-[11px] text-slate-500 px-2.5 py-1 rounded border border-slate-200 bg-white">No</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirm("status-escalate")} className="w-full flex items-center gap-2 text-xs font-semibold border border-slate-200 hover:border-navy-400 hover:bg-navy-50 px-3 py-2.5 rounded text-left transition-all">
                  <ArrowUp size={14} className="text-critical-700" /> Escalate Case
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
      <div className="text-xs font-bold text-navy-600 uppercase tracking-wide mb-2">{title}</div>
      <div className="text-sm text-slate-700 leading-relaxed">{children}</div>
    </div>
  );
}
