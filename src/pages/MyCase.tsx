import { useState, useEffect } from "react";
import UserLayout from "../components/UserLayout";
import { CheckCircle, Clock, Circle, Sparkles } from "lucide-react";
import { StatusBadge } from "../components/Badge";
import { getStoredAssessment } from "../utils/assessmentStore";
import { AssessmentResultData } from "../utils/aiEngine";

export default function MyCase() {
  const [assessment, setAssessment] = useState<AssessmentResultData | null>(null);

  useEffect(() => {
    setAssessment(getStoredAssessment());
  }, []);

  const caseId = assessment?.id || "RAH-2026-00124";
  const svi = assessment?.svi || 78;
  const priority = assessment?.priority || "High";
  const dateStr = assessment?.date || "22 Aug 2026, 10:51 AM";

  const timeline = [
    { label: "Case Created & Identity Registered", date: "Today", done: true, desc: `Your case was registered and Case ID ${caseId} assigned.` },
    { label: "Identity & Demographics Verification", date: "Today", done: true, desc: "Registration and basic demographic credentials verified." },
    { label: "Live AI Assessment & SVI Scoring", date: dateStr, done: true, desc: `Voice & text analysis completed. SVI: ${svi}/100. Priority: ${priority}.` },
    { label: "Human Officer Review", date: "Pending Review", done: false, desc: "Case is queued for priority review by the District Social Welfare Officer.", active: true },
    { label: "Support & Relief Assignment", date: "Pending", done: false, desc: "Counselling, legal assistance, and safety measures assigned upon review." },
    { label: "Resolution & Follow-up", date: "—", done: false, desc: "Comprehensive case closure and ongoing citizen welfare monitoring." },
  ];

  const docs = [
    { name: "Caste / Identity Certificate", status: "Uploaded", access: "Restricted (Officer Only)" },
    { name: "Case Registration Form", status: "Issued", access: "Citizen + Officer" },
    { name: "Live AI Assessment Report", status: "Generated", access: "Citizen + Officer" },
    { name: "Counselling & Support Referral", status: "Pending", access: "Citizen + Support Team" },
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
            { k: "Status", v: <StatusBadge status="Human Review Required" /> },
            { k: "Department", v: "District Social Welfare Division" },
            { k: "Date Filed", v: dateStr },
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
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${t.done ? "bg-safe-700" : (t as any).active ? "bg-navy-900" : "bg-slate-200"}`}>
                    {t.done ? <CheckCircle size={14} className="text-white" /> : (t as any).active ? <Clock size={14} className="text-white animate-pulse" /> : <Circle size={14} className="text-slate-400" />}
                  </div>
                  {i < timeline.length - 1 && <div className={`w-0.5 flex-1 mt-1 mb-1 ${t.done ? "bg-safe-700" : "bg-slate-200"}`} style={{minHeight: "32px"}} />}
                </div>
                <div className="pb-4 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-bold text-sm ${(t as any).active ? "text-navy-900" : t.done ? "text-slate-700" : "text-slate-400"}`}>{t.label}</span>
                    {(t as any).active && <span className="text-xs bg-navy-100 text-navy-800 px-2 py-0.5 rounded font-semibold">In Progress</span>}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 mb-1 font-mono">{t.date}</div>
                  <div className={`text-xs sm:text-sm ${t.done || (t as any).active ? "text-slate-600" : "text-slate-400"}`}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
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
