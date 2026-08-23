import UserLayout from "../components/UserLayout";
import { CheckCircle, Clock, Circle } from "lucide-react";
import { StatusBadge } from "../components/Badge";

const TIMELINE = [
  { label: "Case Created", date: "20 Aug 2026, 09:15 AM", done: true, desc: "Your case was registered and a unique Case ID assigned." },
  { label: "Identity Verification", date: "20 Aug 2026, 10:30 AM", done: true, desc: "Your registration and eligibility documents have been verified." },
  { label: "AI Assessment", date: "22 Aug 2026, 10:51 AM", done: true, desc: "Voice and text analysis completed. SVI: 78. Priority: High." },
  { label: "Human Review", date: "22 Aug 2026 — Pending", done: false, desc: "Case is awaiting review by an authorized district-level officer.", active: true },
  { label: "Support Assigned", date: "Pending", done: false, desc: "Counsellor and legal aid will be assigned upon review completion." },
  { label: "Resolution", date: "—", done: false, desc: "Final case resolution and support confirmation." },
];

const DOCS = [
  { name: "Caste Certificate", status: "Uploaded", access: "Restricted" },
  { name: "Case Registration Form", status: "Issued", access: "Complainant" },
  { name: "AI Assessment Report", status: "Generated", access: "Complainant + Officer" },
  { name: "Counselling Referral", status: "Pending", access: "Complainant + Counsellor" },
];

export default function MyCase() {
  return (
    <UserLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-navy-900">My Case</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">RAH-2026-00124 — Demo Data</p>
        </div>

        {/* Case meta */}
        <div className="bg-white border border-slate-200 rounded p-5 mb-5 grid md:grid-cols-3 gap-4">
          {[
            { k: "Case ID", v: "RAH-2026-00124", mono: true },
            { k: "SVI Score", v: "78 / 100", mono: true },
            { k: "Priority", v: "High" },
            { k: "Status", v: <StatusBadge status="Human Review Required" /> },
            { k: "Department", v: "District Social Welfare, Nagpur" },
            { k: "Date Filed", v: "20 Aug 2026" },
          ].map(({ k, v, mono }) => (
            <div key={k}>
              <div className="text-xs text-slate-500 mb-0.5">{k}</div>
              <div className={`text-sm font-semibold text-navy-900 ${mono ? "font-mono" : ""}`}>{v as any}</div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="bg-white border border-slate-200 rounded mb-5">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-navy-900">Case Timeline</h2>
          </div>
          <div className="p-5">
            {TIMELINE.map((t, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${t.done ? "bg-safe-700" : (t as any).active ? "bg-navy-900" : "bg-slate-200"}`}>
                    {t.done ? <CheckCircle size={14} className="text-white" /> : (t as any).active ? <Clock size={14} className="text-white" /> : <Circle size={14} className="text-slate-400" />}
                  </div>
                  {i < TIMELINE.length - 1 && <div className={`w-0.5 flex-1 mt-1 mb-1 ${t.done ? "bg-safe-700" : "bg-slate-200"}`} style={{minHeight: "32px"}} />}
                </div>
                <div className="pb-4 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-bold text-sm ${(t as any).active ? "text-navy-900" : t.done ? "text-slate-700" : "text-slate-400"}`}>{t.label}</span>
                    {(t as any).active && <span className="text-xs bg-navy-100 text-navy-800 px-2 py-0.5 rounded font-semibold">In Progress</span>}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 mb-1 font-mono">{t.date}</div>
                  <div className={`text-sm ${t.done || (t as any).active ? "text-slate-600" : "text-slate-400"}`}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white border border-slate-200 rounded">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-navy-900">Documents</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Document</th>
                <th className="text-left px-5 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Access</th>
              </tr>
            </thead>
            <tbody>
              {DOCS.map((d, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-navy-900">{d.name}</td>
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
