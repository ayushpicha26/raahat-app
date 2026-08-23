import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { PriorityBadge, StatusBadge } from "../components/Badge";
import { DEMO_CASES } from "../data/sampleData";
import { Search, Filter, ArrowUpDown } from "lucide-react";

const PRIORITY_MAP: Record<string, string> = {
  critical: "Critical",
  high: "High",
  moderate: "Moderate",
  low: "Low",
};

export default function AdminCaseList() {
  const nav = useNavigate();
  const { priority } = useParams<{ priority: string }>();
  const label = PRIORITY_MAP[priority ?? "high"] ?? "High";
  const [search, setSearch] = useState("");
  const [sortSvi, setSortSvi] = useState<"asc" | "desc">("desc");

  const filtered = DEMO_CASES
    .filter(c => c.priority === label)
    .filter(c =>
      !search ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.problem.toLowerCase().includes(search.toLowerCase()) ||
      c.district.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => sortSvi === "desc" ? b.svi - a.svi : a.svi - b.svi);

  const titleColors: Record<string, string> = {
    Critical: "text-critical-700",
    High: "text-high-700",
    Moderate: "text-amber-700",
    Low: "text-safe-700",
  };

  return (
    <AdminLayout>
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className={`text-xl font-bold ${titleColors[label]}`}>{label} Priority Cases</h1>
            <p className="text-sm text-slate-500 mt-0.5">{filtered.length} cases — Demo Data</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded p-4 mb-5 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 border border-slate-300 rounded px-3 py-2 flex-1 min-w-48">
            <Search size={14} className="text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID, problem, district…" className="text-sm outline-none flex-1 text-slate-700" />
          </div>
          <select className="border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 outline-none">
            <option>All States</option>
            <option>Maharashtra</option>
          </select>
          <select className="border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 outline-none">
            <option>All Problem Types</option>
            <option>Threat / Intimidation</option>
            <option>Social Boycott</option>
            <option>Caste Discrimination</option>
            <option>Legal Proceeding Distress</option>
            <option>Violence</option>
          </select>
          <select className="border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 outline-none">
            <option>All Statuses</option>
            <option>Human Review Required</option>
            <option>Counsellor Assigned</option>
            <option>Under Review</option>
          </select>
          <button className="flex items-center gap-1.5 text-sm border border-slate-300 px-3 py-2 rounded text-slate-600 hover:bg-slate-50">
            <Filter size={13} /> Filters
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">#</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Case ID</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Case Holder</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">District</th>
                <th className="px-4 py-3">
                  <button onClick={() => setSortSvi(s => s === "desc" ? "asc" : "desc")} className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    SVI <ArrowUpDown size={11} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Problem Type</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Assigned Support</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => nav(`/admin/case/${c.id}`)}>
                  <td className="px-4 py-3 text-xs text-slate-400 font-bold">#{String(i + 1).padStart(2, "0")}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.id}</td>
                  <td className="px-4 py-3 font-semibold text-navy-900">{c.holder}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{c.district}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold font-mono text-sm ${c.svi >= 80 ? "text-critical-700" : c.svi >= 60 ? "text-high-700" : c.svi >= 40 ? "text-amber-700" : "text-safe-700"}`}>{c.svi}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{c.problem}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{c.assigned || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-400">{c.date}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-slate-400">No cases found.</td></tr>
              )}
            </tbody>
          </table>
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 text-center font-mono">
            Demo Data Only — Not real complainants
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
