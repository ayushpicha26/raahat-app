import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/layout/AdminLayout";
import { PriorityBadge, StatusBadge } from "../../components/common/Badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { AlertTriangle, TrendingUp, Users, CheckCircle, ArrowRight } from "lucide-react";
import { api } from "../../utils/api";

interface StatsData {
  total: number;
  critical: number;
  high: number;
  moderate: number;
  low: number;
  pending: number;
  resolved: number;
  avgSvi: number;
  totalUsers: number;
  districtStats: { district: string; cases: number; avgSvi: number }[];
  priorityDist: { name: string; value: number; color: string }[];
  recentCases: any[];
}

export default function AdminDashboard() {
  const nav = useNavigate();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<StatsData>("/cases/admin/stats")
      .then(res => {
        setLoading(false);
        if (res.ok && res.data) {
          setStats(res.data);
        }
      })
      .catch(err => {
        console.error("Failed to load admin stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-10 text-center text-slate-400">Loading dashboard analytics...</div>
      </AdminLayout>
    );
  }

  const kpis = [
    { label: "Total Cases", value: stats?.total || 0, sub: "All registered cases", color: "text-navy-900", bg: "bg-navy-50 border-navy-200", path: "/admin/cases/all" },
    { label: "Critical Priority", value: stats?.critical || 0, sub: "Immediate action", color: "text-critical-700", bg: "bg-critical-50 border-critical-200", path: "/admin/cases/critical" },
    { label: "High Priority", value: stats?.high || 0, sub: "Requires review", color: "text-high-700", bg: "bg-high-50 border-high-200", path: "/admin/cases/high" },
    { label: "Moderate", value: stats?.moderate || 0, sub: "Support assigned", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", path: "/admin/cases/moderate" },
    { label: "Low Priority", value: stats?.low || 0, sub: "Routine monitoring", color: "text-safe-700", bg: "bg-safe-50 border-safe-200", path: "/admin/cases/low" },
  ];

  // Helper formatting for Problem Type Charts
  const problemTypeCounts: { [key: string]: number } = {};
  const problemColors: { [key: string]: string } = {
    "Threat / Intimidation": "#c2410c",
    "Physical Safety & Medical Risk": "#9b1c1c",
    "Identity-based Discrimination": "#1e4a75",
    "Social Isolation & Boycott": "#b45309",
    "Housing / Displacement": "#2e7d52",
    "Legal Proceeding Distress": "#235a8e",
  };

  stats?.recentCases?.forEach(c => {
    if (c.problemTypes && Array.isArray(c.problemTypes)) {
      c.problemTypes.forEach((pt: any) => {
        const label = typeof pt === "string" ? pt : pt.label;
        if (label) {
          problemTypeCounts[label] = (problemTypeCounts[label] || 0) + 1;
        }
      });
    }
  });

  const problemTypeData = Object.keys(problemTypeCounts).map(name => ({
    name,
    value: problemTypeCounts[name],
    color: problemColors[name] || "#64748b"
  })).sort((a, b) => b.value - a.value);

  // Month-wise aggregation
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyCounts: { [key: string]: { month: string; cases: number; high: number; critical: number } } = {};
  
  stats?.recentCases?.forEach(c => {
    if (c.created_at) {
      const d = new Date(c.created_at);
      const mLabel = monthNames[d.getMonth()];
      if (!monthlyCounts[mLabel]) {
        monthlyCounts[mLabel] = { month: mLabel, cases: 0, high: 0, critical: 0 };
      }
      monthlyCounts[mLabel].cases++;
      if (c.priority === "High") monthlyCounts[mLabel].high++;
      if (c.priority === "Critical") monthlyCounts[mLabel].critical++;
    }
  });
  
  const monthlyData = Object.values(monthlyCounts);

  return (
    <AdminLayout>
      <div className="px-6 py-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {kpis.map(k => (
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
            <h2 className="font-bold text-navy-900 text-sm mb-4">Case Volume Trends</h2>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData} barSize={24}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="cases" fill="#1e4a75" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="high" fill="#c2410c" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="critical" fill="#9b1c1c" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-xs text-slate-400">Not enough data to map trends.</div>
            )}
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
                <Pie data={stats?.priorityDist} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {stats?.priorityDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Problem types */}
        {problemTypeData.length > 0 && (
          <div className="bg-white border border-slate-200 rounded p-5 mb-6">
            <h2 className="font-bold text-navy-900 text-sm mb-4">Cases by Problem Type</h2>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={problemTypeData} layout="vertical" barSize={14}>
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4 }} />
                <Bar dataKey="value" radius={[0, 2, 2, 0]}>
                  {problemTypeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent cases table */}
        <div className="bg-white border border-slate-200 rounded">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-navy-900 text-sm">Recent Registered Cases</h2>
            <button onClick={() => nav("/admin/cases/all")} className="flex items-center gap-1 text-xs text-navy-700 hover:underline">
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
                {stats?.recentCases && stats.recentCases.length > 0 ? (
                  stats.recentCases.map((c, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => nav(`/admin/case/${c.case_id}`)}>
                      <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.case_id}</td>
                      <td className="px-4 py-3 font-medium text-navy-900">{c.holder}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{c.district}, {c.state}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold font-mono text-sm ${c.svi >= 80 ? "text-critical-700" : c.svi >= 60 ? "text-high-700" : c.svi >= 40 ? "text-amber-700" : "text-safe-700"}`}>{c.svi}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {c.problemTypes && c.problemTypes.length > 0 ? c.problemTypes.map((p: any) => typeof p === "string" ? p : p.label).join(", ") : "General Case"}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {new Date(c.created_at).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">No cases have been submitted yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 text-center font-mono">
            🔐 Authorized Officer Workspace — Data Reflected Directly From PostgreSQL (raahat)
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
