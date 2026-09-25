import { useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import { FileText, Download, BarChart3, Calendar, MapPin, Users } from "lucide-react";

const REPORTS = [
  { icon: <Calendar size={18} className="text-navy-700" />, title: "Daily Case Report", desc: "All cases registered in the last 24 hours with SVI and priority breakdown.", tag: "Daily" },
  { icon: <BarChart3 size={18} className="text-navy-700" />, title: "Monthly SVI Report", desc: "SVI score distribution, trends and high-risk analysis for the current month.", tag: "Monthly" },
  { icon: <MapPin size={18} className="text-navy-700" />, title: "District Vulnerability Report", desc: "Geographic vulnerability analysis grouped by district and state.", tag: "Geographic" },
  { icon: <Users size={18} className="text-navy-700" />, title: "Support Allocation Report", desc: "Status of counselling, legal aid, and medical referrals across all cases.", tag: "Operational" },
  { icon: <FileText size={18} className="text-navy-700" />, title: "Problem Type Analysis", desc: "Breakdown of case types with SVI correlation and resolution statistics.", tag: "Analytical" },
  { icon: <MapPin size={18} className="text-navy-700" />, title: "Geographic Cluster Report", desc: "Detailed cluster analysis with anonymized case patterns by region.", tag: "Geographic" },
];

export default function AdminReports() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  function generate(title: string) {
    setGenerating(title);
    setTimeout(() => {
      setGenerating(null);
      setDone(prev => new Set([...prev, title]));
    }, 1500);
  }

  return (
    <AdminLayout>
      <div className="px-6 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-navy-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Generate and export authorized reports. Role-based access control applies. Demo Data.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {REPORTS.map((r, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-navy-50 rounded flex items-center justify-center shrink-0">{r.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-navy-900 text-sm">{r.title}</h3>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-semibold">{r.tag}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{r.desc}</p>
                  <div className="flex gap-2 flex-wrap">
                    {done.has(r.title) ? (
                      <>
                        <button className="flex items-center gap-1.5 text-xs font-semibold text-safe-700 bg-safe-50 border border-safe-100 px-3 py-1.5 rounded">
                          <Download size={12} /> Export PDF
                        </button>
                        <button className="flex items-center gap-1.5 text-xs font-semibold text-safe-700 bg-safe-50 border border-safe-100 px-3 py-1.5 rounded">
                          <Download size={12} /> Export CSV
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => generate(r.title)}
                        disabled={generating === r.title}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-navy-900 px-3 py-1.5 rounded hover:bg-navy-800 disabled:opacity-60"
                      >
                        {generating === r.title ? (
                          <span className="flex items-center gap-1.5"><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating…</span>
                        ) : "Generate Report"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
