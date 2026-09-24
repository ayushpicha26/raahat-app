import { useState, useEffect } from "react";
import UserLayout from "../../components/layout/UserLayout";
import { CheckCircle, Clock, Circle, Sparkles, AlertCircle } from "lucide-react";
import { StatusBadge } from "../../components/common/Badge";
import { api, getUser } from "../../utils/api";
import { getStoredAssessment } from "../../utils/assessmentStore";
import CaseJourneyTracker from "../../components/common/CaseJourneyTracker";

interface CaseDetails {
  case_id: string;
  svi: number;
  priority: "Critical" | "High" | "Moderate" | "Low";
  priority_label: string;
  status: string;
  assigned_officer: string;
  assigned_service: string;
  language_detected: string;
  audio_duration_seconds: number;
  created_at: string;
  updated_at: string;
}

export default function MyCase() {
  const [caseInfo, setCaseInfo] = useState<CaseDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserCase() {
      const user = getUser();
      try {
        // 1. Try fetching user's latest case from API
        const res = await api.get<{ cases: CaseDetails[] }>("/cases?limit=1");
        if (res.ok && res.data?.cases && res.data.cases.length > 0) {
          setCaseInfo(res.data.cases[0]);
          setLoading(false);
          return;
        }

        // 2. Try fetching by user.caseId specifically
        if (user?.caseId) {
          const caseRes = await api.get<CaseDetails>(`/cases/${user.caseId}`);
          if (caseRes.ok && caseRes.data) {
            setCaseInfo(caseRes.data);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Error fetching user case from API:", err);
      }

      // 3. Fallback to local stored assessment if no server case found
      fallbackToLocal();
    }

    function fallbackToLocal() {
      const stored = getStoredAssessment();
      if (stored) {
        setCaseInfo({
          case_id: stored.id,
          svi: stored.svi,
          priority: stored.priority,
          priority_label: stored.priorityLabel || (stored.priority + " PRIORITY").toUpperCase(),
          status: stored.svi >= 80 ? "Human Review Required" : "Assessment Pending",
          assigned_officer: "",
          assigned_service: "Counselling & Support",
          language_detected: stored.languageDetected || "English",
          audio_duration_seconds: stored.audioDurationSeconds || 0,
          created_at: stored.date || new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      setLoading(false);
    }

    loadUserCase();
  }, []);

  if (loading) {
    return (
      <UserLayout>
        <div className="max-w-3xl mx-auto px-6 py-20 text-center text-slate-400">
          Loading case information...
        </div>
      </UserLayout>
    );
  }

  if (!caseInfo) {
    return (
      <UserLayout>
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <AlertCircle size={32} className="mx-auto mb-2 text-slate-400" />
          <h2 className="text-lg font-semibold text-navy-900 mb-1">No Active Case Found</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Please complete a voice or chat assessment on the dashboard to register a case.
          </p>
        </div>
      </UserLayout>
    );
  }

  const caseId = caseInfo.case_id;
  const svi = caseInfo.svi;
  const priority = caseInfo.priority;
  const dateStr = caseInfo.created_at ? new Date(caseInfo.created_at).toLocaleString("en-IN") : "Today";

  // Calculate timeline state dynamically from DB values
  const isCreated = true;
  const isVerified = true;
  const isAssessed = true;
  const isReviewed = !["Assessment Pending", "Under Review", "Human Review Required"].includes(caseInfo.status);
  const isAssigned = caseInfo.assigned_officer !== "" || caseInfo.status === "Support Assigned" || isReviewed;
  const isResolved = ["Resolved", "Closed"].includes(caseInfo.status);

  const timeline = [
    {
      label: "Case Created & Identity Registered",
      date: dateStr,
      done: isCreated,
      active: false,
      desc: `Your case was registered and Case ID ${caseId} assigned.`,
    },
    {
      label: "Identity & Demographics Verification",
      date: dateStr,
      done: isVerified,
      active: false,
      desc: "Registration and basic demographics credentials verified.",
    },
    {
      label: "Live AI Assessment & SVI Scoring",
      date: dateStr,
      done: isAssessed,
      active: false,
      desc: `Voice & text analysis completed. SVI: ${svi}/100. Priority: ${priority} (${caseInfo.priority_label}).`,
    },
    {
      label: "Human Officer Review",
      date: isReviewed ? "Completed" : "In Progress",
      done: isReviewed,
      active: !isReviewed,
      desc: isReviewed
        ? "Officer review complete. Case forwarded for action."
        : "Case is queued for priority review by the District Social Welfare Officer.",
    },
    {
      label: "Support & Relief Assignment",
      date: isAssigned ? "Completed" : "Pending",
      done: isAssigned,
      active: isReviewed && !isAssigned,
      desc: caseInfo.assigned_officer
        ? `Support assigned: ${caseInfo.assigned_officer} (${caseInfo.assigned_service || "Welfare Support"}).`
        : "Counselling, legal assistance, and safety measures assigned upon review.",
    },
    {
      label: "Resolution & Follow-up",
      date: isResolved ? "Resolved" : "—",
      done: isResolved,
      active: isAssigned && !isResolved,
      desc: isResolved
        ? "Comprehensive case closure and ongoing citizen welfare monitoring."
        : "Action ongoing. Tracking resolution progress.",
    },
  ];

  const docs = [
    { name: "Caste / Identity Certificate", status: "Uploaded", access: "Restricted (Officer Only)" },
    { name: "Case Registration Form", status: "Issued", access: "Citizen + Officer" },
    { name: "Live AI Assessment Report", status: "Generated", access: "Citizen + Officer" },
    { name: "Counselling & Support Referral", status: caseInfo.assigned_officer ? "Issued" : "Pending", access: "Citizen + Support Team" },
  ];

  return (
    <UserLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="text-xs font-bold text-navy-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Sparkles size={12} /> Live Case Tracking
          </div>
          <h1 className="text-xl font-bold text-navy-900">My Case</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">{caseId}</p>
        </div>

        {/* Case meta */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 mb-5 grid sm:grid-cols-3 gap-4 shadow-xs">
          {[
            { k: "Case ID", v: caseId, mono: true },
            { k: "SVI Score", v: `${svi} / 100`, mono: true },
            { k: "Priority Tier", v: priority },
            { k: "Status", v: <StatusBadge status={caseInfo.status} /> },
            { k: "Department", v: "District Social Welfare Division" },
            { k: "Date Filed", v: new Date(caseInfo.created_at).toLocaleDateString("en-IN") },
          ].map(({ k, v, mono }) => (
            <div key={k}>
              <div className="text-xs text-slate-500 mb-0.5">{k}</div>
              <div className={`text-sm font-semibold text-navy-900 ${mono ? "font-mono" : ""}`}>{v as any}</div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="bg-white border border-slate-200 rounded-lg mb-5 shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-navy-900 text-sm">Case Progress Timeline</h2>
          </div>
          <div className="p-5">
            {timeline.map((t, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${t.done ? "bg-safe-700 text-white" : t.active ? "bg-navy-900 text-white" : "bg-slate-200 text-slate-400"}`}>
                    {t.done ? <CheckCircle size={14} /> : t.active ? <Clock size={14} className="animate-pulse" /> : <Circle size={14} />}
                  </div>
                  {i < timeline.length - 1 && <div className={`w-0.5 flex-1 mt-1 mb-1 ${t.done ? "bg-safe-700" : "bg-slate-200"}`} style={{minHeight: "32px"}} />}
                </div>
                <div className="pb-4 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-bold text-sm ${t.active ? "text-navy-900" : t.done ? "text-slate-700" : "text-slate-400"}`}>{t.label}</span>
                    {t.active && <span className="text-xs bg-navy-100 text-navy-800 px-2 py-0.5 rounded font-semibold">In Progress</span>}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 mb-1 font-mono">{t.date}</div>
                  <div className={`text-xs sm:text-sm ${t.done || t.active ? "text-slate-600" : "text-slate-400"}`}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stakeholder Journey Tracker (live workflow) */}
        <div className="mb-5">
          <CaseJourneyTracker caseId={caseId} />
        </div>

        {/* Documents */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-navy-900 text-sm">Protected Case Documents</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Document</th>
                <th className="text-left px-5 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Access Level</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-navy-900 text-xs sm:text-sm">{d.name}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{d.access}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </UserLayout>
  );
}
