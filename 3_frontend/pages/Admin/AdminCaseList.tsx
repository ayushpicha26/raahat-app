import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/layout/AdminLayout";
import { PriorityBadge, StatusBadge } from "../../components/common/Badge";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { api } from "../../utils/api";

const PRIORITY_MAP: Record<string, string> = {
  critical: "Critical",
  high: "High",
  moderate: "Moderate",
  low: "Low",
  all: "all",
};

interface CaseItem {
  case_id: string;
  holder: string;
  district: string;
  state: string;
  svi: number;
  priority: "Critical" | "High" | "Moderate" | "Low";
  status: string;
  assigned_officer: string;
  assigned_service: string;
  created_at: string;
  problemTypes: any[];
}

export default function AdminCaseList() {
  const nav = useNavigate();
  const { priority } = useParams<{ priority: string }>();
  const priorityFilter = PRIORITY_MAP[priority ?? "all"] ?? "all";
  
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [selectedProblem, setSelectedProblem] = useState("All Problem Types");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [sortSvi, setSortSvi] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    setLoading(true);
    const pParam = priorityFilter === "all" ? "" : `&priority=${priorityFilter}`;
    api.get<{ cases: CaseItem[] }>(`/cases?limit=100${pParam}`)
      .then(res => {
        setLoading(false);
        if (res.ok && res.data) {
          setCases(res.data.cases);
        }
      })
      .catch(err => {
        console.error("Error fetching cases:", err);
        setLoading(false);
      });
  }, [priorityFilter]);

  const districts = ["All Districts", ...Array.from(new Set(cases.map(c => c.district))).filter(Boolean)];
  
  const filtered = cases
    .filter(c => {
      const matchSearch = !search ||
        (c.case_id?.toLowerCase().includes(search.toLowerCase())) ||
        (c.holder?.toLowerCase().includes(search.toLowerCase())) ||
        (c.district?.toLowerCase().includes(search.toLowerCase()));
      
      const matchDistrict = selectedDistrict === "All Districts" || c.district === selectedDistrict;
      
      const matchProblem = selectedProblem === "All Problem Types" || (
        c.problemTypes && c.problemTypes.some((p: any) => 
          (typeof p === "string" ? p : p.label).toLowerCase().includes(selectedProblem.toLowerCase())
        )
      );

      const matchStatus = selectedStatus === "All Statuses" || c.status === selectedStatus;

      return matchSearch && matchDistrict && matchProblem && matchStatus;
    })
    .sort((a, b) => sortSvi === "desc" ? b.svi - a.svi : a.svi - b.svi);

  const titleColors: Record<string, string> = {
    Critical: "text-critical-700",
    High: "text-high-700",
    Moderate: "text-amber-700",
    Low: "text-safe-700",
    all: "text-navy-900",
  };

  const labelTitle = priorityFilter === "all" ? "All Active" : priorityFilter;

  return (
    <AdminLayout>
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className={`text-xl font-bold ${titleColors[priorityFilter]}`}>{labelTitle} Cases</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {loading ? "Loading..." : `${filtered.length} cases matching criteria`}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded p-4 mb-5 flex flex-wrap gap-3 items-center shadow-xs">
          <div className="flex items-center gap-2 border border-slate-300 rounded px-3 py-2 flex-1 min-w-48">
            <Search size={14} className="text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID, holder, district…" className="text-sm outline-none flex-1 text-slate-700" />
          </div>
          <select 
            value={selectedDistrict} 
            onChange={e => setSelectedDistrict(e.target.value)} 
            className="border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 outline-none bg-white cursor-pointer"
          >
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select 
            value={selectedProblem} 
            onChange={e => setSelectedProblem(e.target.value)} 
            className="border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 outline-none bg-white cursor-pointer"
          >
            <option value="All Problem Types">All Problem Types</option>
            <option value="Threat / Intimidation">Threat / Intimidation</option>
            <option value="Social Boycott">Social Boycott</option>
            <option value="Caste Discrimination">Caste Discrimination</option>
            <option value="Legal Proceeding Distress">Legal Proceeding Distress</option>
            <option value="Physical Safety & Medical Risk">Physical Safety & Medical Risk</option>
          </select>
          <select 
            value={selectedStatus} 
            onChange={e => setSelectedStatus(e.target.value)} 
            className="border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 outline-none bg-white cursor-pointer"
          >
            <option value="All Statuses">All Statuses</option>
            <option value="Assessment Pending">Assessment Pending</option>
            <option value="Human Review Required">Human Review Required</option>
            <option value="Counsellor Assigned">Counsellor Assigned</option>
            <option value="Legal Aid Requested">Legal Aid Requested</option>
            <option value="Support Assigned">Support Assigned</option>
            <option value="Under Review">Under Review</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded overflow-x-auto shadow-xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">#</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Case ID</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Case Holder</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Location</th>
                <th className="px-4 py-3">
                  <button onClick={() => setSortSvi(s => s === "desc" ? "asc" : "desc")} className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-navy-900 transition-colors">
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
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">Loading cases from database...</td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((c, i) => (
                  <tr key={c.case_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => nav(`/admin/case/${c.case_id}`)}>
                    <td className="px-4 py-3 text-xs text-slate-400 font-bold">#{String(i + 1).padStart(2, "0")}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.case_id}</td>
                    <td className="px-4 py-3 font-semibold text-navy-900">{c.holder}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{c.district}, {c.state}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold font-mono text-sm ${c.svi >= 80 ? "text-critical-700" : c.svi >= 60 ? "text-high-700" : c.svi >= 40 ? "text-amber-700" : "text-safe-700"}`}>{c.svi}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {c.problemTypes && c.problemTypes.length > 0 ? c.problemTypes.map((pt: any) => typeof pt === "string" ? pt : pt.label).join(", ") : "General"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {c.assigned_officer ? `${c.assigned_officer} (${c.assigned_service})` : (c.assigned_service || "—")}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(c.created_at).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">No cases found matching your search filters.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 text-center font-mono">
            🔐 Live database connection: PostgreSQL (raahat)
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
