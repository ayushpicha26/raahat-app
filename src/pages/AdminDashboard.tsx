import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { PriorityBadge, StatusBadge } from "../components/Badge";
import { DEMO_CASES, MONTHLY_DATA, PRIORITY_DIST, PROBLEM_TYPE_DATA } from "../data/sampleData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { AlertTriangle, TrendingUp, Users, CheckCircle, ArrowRight } from "lucide-react";

const KPIS = [
  { label: "Total Cases", value: "1,248", sub: "All time", color: "text-navy-900", bg: "bg-navy-50 border-navy-200", path: "/admin/cases/high" },
  { label: "Critical", value: "46", sub: "Immediate action", color: "text-critical-700", bg: "bg-critical-50 border-critical-200", path: "/admin/cases/critical" },
  { label: "High Priority", value: "218", sub: "Human review", color: "text-high-700", bg: "bg-high-50 border-high-200", path: "/admin/cases/high" },
  { label: "Moderate", value: "531", sub: "In progress", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", path: "/admin/cases/moderate" },
  { label: "Low Priority", value: "453", sub: "Monitoring", color: "text-safe-700", bg: "bg-safe-50 border-safe-200", path: "/admin/cases/low" },
];

export default function AdminDashboard() {
  const nav = useNavigate();

  return (
    <AdminLayout>
      <div className="px-6 py-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {KPIS.map(k => (
            <button key={k.label} onClick={() => nav(k.path)} className={`border rounded p-4 text-left hover:shadow-sm transition-shadow ${k.bg}`}>
              <div className={`text-2xl font-bold font-mono ${k.color}`}>{k.value}</div>
              <div className="text-sm font-semibold text-slate-700 mt-0.5">{k.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{k.sub}</div>
            </button>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid md:grid-cols-2 gap-5 mb-6">
          <div className="bg-white border border-slate-200 rounded p-5">
            <h2 className="font-bold text-navy-900 text-sm mb-4">Cases by Month</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MONTHLY_DATA} barSize={24}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="cases" fill="#1e4a75" radius={[2, 2, 0, 0]} />
                <Bar dataKey="high" fill="#c2410c" radius={[2, 2, 0, 0]} />
                <Bar dataKey="critical" fill="#9b1c1c" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-navy-700 rounded-sm inline-block" />Total</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-high-700 rounded-sm inline-block" />High</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-critical-700 rounded-sm inline-block" />Critical</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-5">
            <h2 className="font-bold text-navy-900 text-sm mb-4">Priority Distribution</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={PRIORITY_DIST} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {PRIORITY_DIST.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Problem types */}
        <div className="bg-white border border-slate-200 rounded p-5 mb-6">
          <h2 className="font-bold text-navy-900 text-sm mb-4">Cases by Problem Type</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={PROBLEM_TYPE_DATA} layout="vertical" barSize={14}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4 }} />
              <Bar dataKey="value" radius={[0, 2, 2, 0]}>
                {PROBLEM_TYPE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent cases table */}
        <div className="bg-white border border-slate-200 rounded">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-navy-900 text-sm">Recent Cases</h2>
            <button onClick={() => nav("/admin/cases/high")} className="flex items-center gap-1 text-xs text-navy-700 hover:underline">
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Priority", "Case ID", "Case Holder", "Location", "SVI", "Problem Type", "Status", "Date"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEMO_CASES.slice(0, 8).map((c, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => nav(`/admin/case/${c.id}`)}>
                    <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.id}</td>
                    <td className="px-4 py-3 font-medium text-navy-900">{c.holder}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{c.district}, {c.state}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold font-mono text-sm ${c.svi >= 80 ? "text-critical-700" : c.svi >= 60 ? "text-high-700" : c.svi >= 40 ? "text-amber-700" : "text-safe-700"}`}>{c.svi}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{c.problem}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{c.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 text-center font-mono">
            Demo Data Only — Not real cases
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
