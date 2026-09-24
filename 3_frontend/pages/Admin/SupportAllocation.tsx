import { useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import { Briefcase, MapPin, Clock, CheckCircle, ExternalLink, Users } from "lucide-react";
import { StatusBadge } from "../../components/common/Badge";

const ALLOCATIONS = [
  { caseId: "RAH-2026-00124", officer: "Adv. Rajesh Kumar", service: "Legal Aid", status: "Assigned", district: "Nagpur", slaDeadline: "24 hrs", priority: "Critical", created: "2026-08-27 10:30 AM" },
  { caseId: "RAH-2026-00123", officer: "Dr. Sunita Deshmukh", service: "Counselling", status: "In Progress", district: "Pune", slaDeadline: "7 days", priority: "High", created: "2026-08-27 09:15 AM" },
  { caseId: "RAH-2026-00122", officer: "SI Vikram Patil", service: "Police Escort", status: "Dispatched", district: "Mumbai Suburban", slaDeadline: "24 hrs", priority: "Critical", created: "2026-08-27 08:00 AM" },
  { caseId: "RAH-2026-00121", officer: "", service: "Legal Aid", status: "Unassigned", district: "Aurangabad", slaDeadline: "Overdue", priority: "High", created: "2026-08-26 04:10 PM" },
  { caseId: "RAH-2026-00120", officer: "Ms. Priya Nair", service: "Medical Referral", status: "Assigned", district: "Nashik", slaDeadline: "7 days", priority: "High", created: "2026-08-26 03:00 PM" },
  { caseId: "RAH-2026-00119", officer: "Adv. Meera Jadhav", service: "Legal Aid", status: "Under Review", district: "Thane", slaDeadline: "60 days", priority: "Moderate", created: "2026-08-25 11:45 AM" },
  { caseId: "RAH-2026-00118", officer: "", service: "Counselling", status: "Unassigned", district: "Kolhapur", slaDeadline: "Overdue", priority: "Moderate", created: "2026-08-25 09:00 AM" },
  { caseId: "RAH-2026-00117", officer: "Adv. Sanjay Rao", service: "Witness Protection", status: "Assigned", district: "Solapur", slaDeadline: "24 hrs", priority: "High", created: "2026-08-24 02:30 PM" },
];

const SERVICES = ["Legal Aid", "Counselling", "Medical Referral", "Police Escort", "Witness Protection", "Rehabilitation"];

export default function SupportAllocation() {
  const [allocations, setAllocations] = useState(ALLOCATIONS);
  const [filter, setFilter] = useState<"all" | "assigned" | "unassigned">("all");
  const [assignForm, setAssignForm] = useState<Record<string, { officer: string; service: string }>>({});

  const filtered = filter === "all" ? allocations : filter === "assigned" ? allocations.filter(a => a.status !== "Unassigned") : allocations.filter(a => a.status === "Unassigned");

  function handleAssign(caseId: string) {
    const form = assignForm[caseId] || { officer: "", service: "" };
    if (!form.officer || !form.service) return;
    setAllocations(prev => prev.map(a => a.caseId === caseId ? { ...a, officer: form.officer, service: form.service, status: "Assigned", slaDeadline: getSLA(a.priority) } : a));
  }

  function getSLA(priority: string): string {
    if (priority === "Critical") return "24 hrs";
    if (priority === "High") return "7 days";
    return "60 days";
  }

  const stats = {
    assigned: allocations.filter(a => a.status === "Assigned" || a.status === "In Progress" || a.status === "Dispatched" || a.status === "Under Review").length,
    unassigned: allocations.filter(a => a.status === "Unassigned").length,
    critical: allocations.filter(a => a.priority === "Critical").length,
  };

  return (
    <AdminLayout>
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-navy-900 flex items-center gap-2">
              <Briefcase size={20} className="text-navy-700" /> Support Allocation
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Assign officers and services to cases. SLA timers enforce deadlines.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setFilter("all")} className={`px-3 py-1.5 text-xs font-semibold rounded ${filter === "all" ? "bg-navy-900 text-white" : "bg-slate-100 text-slate-600"}`}>All</button>
            <button onClick={() => setFilter("assigned")} className={`px-3 py-1.5 text-xs font-semibold rounded ${filter === "assigned" ? "bg-navy-900 text-white" : "bg-slate-100 text-slate-600"}`}>Assigned</button>
            <button onClick={() => setFilter("unassigned")} className={`px-3 py-1.5 text-xs font-semibold rounded ${filter === "unassigned" ? "bg-navy-900 text-white" : "bg-slate-100 text-slate-600"}`}>Unassigned</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Assigned", count: stats.assigned, icon: <CheckCircle size={16} className="text-safe-700" />, color: "bg-safe-50 border-safe-200" },
            { label: "Unassigned", count: stats.unassigned, icon: <Clock size={16} className="text-critical-700" />, color: "bg-critical-50 border-critical-200" },
            { label: "Critical Priority", count: stats.critical, icon: <ExternalLink size={16} className="text-high-700" />, color: "bg-high-50 border-high-200" },
          ].map((s, i) => (
            <div key={i} className={`border rounded-lg p-4 flex items-center gap-3 ${s.color}`}>
              <div className="w-9 h-9 bg-white rounded flex items-center justify-center shrink-0">{s.icon}</div>
              <div>
                <div className="text-2xl font-bold">{s.count}</div>
                <div className="text-xs">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Allocation Table */}
        <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Case ID", "Priority", "District", "Assigned Officer", "Service", "SLA Deadline", "Status", "Action"].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.caseId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-3 font-mono text-xs text-navy-900">{a.caseId}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${a.priority === "Critical" ? "bg-critical-100 text-critical-800" : a.priority === "High" ? "bg-high-100 text-high-800" : "bg-amber-100 text-amber-800"}`}>
                        {a.priority}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600 flex items-center gap-1">
                      <MapPin size={10} className="text-slate-400" /> {a.district}
                    </td>
                    <td className="px-3 py-3 text-xs text-navy-900">{a.officer || "—"}</td>
                    <td className="px-3 py-3 text-xs text-slate-600">{a.service}</td>
                    <td className={`px-3 py-3 text-xs font-mono font-semibold ${a.slaDeadline === "Overdue" ? "text-critical-700" : "text-navy-900"}`}>{a.slaDeadline}</td>
                    <td className="px-3 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-3 py-3">
                      {a.status === "Unassigned" ? (
                        <div className="flex gap-1">
                          <input
                            type="text"
                            placeholder="Officer name"
                            value={assignForm[a.caseId]?.officer || ""}
                            onChange={(e) => setAssignForm({ ...assignForm, [a.caseId]: { ...assignForm[a.caseId], officer: e.target.value } })}
                            className="w-24 border border-slate-300 rounded px-2 py-1 text-xs outline-none focus:border-navy-600"
                          />
                          <select
                            value={assignForm[a.caseId]?.service || ""}
                            onChange={(e) => setAssignForm({ ...assignForm, [a.caseId]: { ...assignForm[a.caseId], service: e.target.value } })}
                            className="border border-slate-300 rounded px-2 py-1 text-xs outline-none focus:border-navy-600"
                          >
                            <option value="">Service</option>
                            {SERVICES.map(s => <option key={s}>{s}</option>)}
                          </select>
                          <button onClick={() => handleAssign(a.caseId)} className="px-2 py-1 text-xs bg-safe-700 text-white rounded hover:bg-safe-800">Assign</button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}