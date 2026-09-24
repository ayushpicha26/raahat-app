import { useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import { AlertTriangle, Bell, Clock, MapPin, User, CheckCircle, MessageSquare, ExternalLink } from "lucide-react";
import { StatusBadge } from "../../components/common/Badge";

const ALERTS = [
  { id: "ALT-001", caseId: "RAH-2026-00124", type: "Imminent Harm", priority: "Critical", district: "Nagpur", state: "Maharashtra", time: "2 min ago", status: "Active", svi: 94 },
  { id: "ALT-002", caseId: "RAH-2026-00123", type: "Self-Harm Risk", priority: "Critical", district: "Pune", state: "Maharashtra", time: "15 min ago", status: "Acknowledged", svi: 89 },
  { id: "ALT-003", caseId: "RAH-2026-00122", type: "Safety Override", priority: "Critical", district: "Mumbai Suburban", state: "Maharashtra", time: "1 hour ago", status: "Dispatched", svi: 96 },
  { id: "ALT-004", caseId: "RAH-2026-00121", type: "Delayed FIR", priority: "High", district: "Aurangabad", state: "Maharashtra", time: "3 hours ago", status: "Overdue", svi: 82 },
  { id: "ALT-005", caseId: "RAH-2026-00120", type: "Relief Disbursement Delay", priority: "High", district: "Nashik", state: "Maharashtra", time: "6 hours ago", status: "Pending", svi: 78 },
  { id: "ALT-006", caseId: "RAH-2026-00119", type: "Chargesheet Deadline", priority: "Moderate", district: "Thane", state: "Maharashtra", time: "12 hours ago", status: "Monitoring", svi: 71 },
  { id: "ALT-007", caseId: "RAH-2026-00118", type: "Counsellor Unavailable", priority: "Moderate", district: "Kolhapur", state: "Maharashtra", time: "1 day ago", status: "Escalated", svi: 65 },
  { id: "ALT-008", caseId: "RAH-2026-00117", type: "Witness Protection Required", priority: "High", district: "Solapur", state: "Maharashtra", time: "1 day ago", status: "Active", svi: 85 },
];

export default function CriticalAlerts() {
  const [filter, setFilter] = useState<"all" | "critical" | "high" | "moderate">("all");
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  const filtered = filter === "all" ? ALERTS : ALERTS.filter((a) => a.priority.toLowerCase() === filter);

  function handleAcknowledge(alertId: string) {
    setAcknowledged((prev) => new Set([...prev, alertId]));
  }

  return (
    <AdminLayout>
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-navy-900">Critical Alerts</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Real-time high-risk case monitoring. SLA breaches and safety overrides trigger automatic escalation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-navy-600"
            >
              <option value="all">All Alerts</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="moderate">Moderate</option>
            </select>
            <span className="flex items-center gap-1 text-xs text-navy-700 bg-navy-50 px-2 py-1 rounded border border-navy-100">
              <span className="w-2 h-2 bg-critical-700 rounded-full animate-pulse" />
              3 Active Critical
            </span>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Critical Active", count: ALERTS.filter((a) => a.priority === "Critical" && a.status === "Active").length, icon: <AlertTriangle size={16} className="text-critical-700" />, color: "bg-critical-50 border-critical-200 text-critical-700" },
            { label: "Acknowledged", count: ALERTS.filter((a) => a.status === "Acknowledged").length, icon: <CheckCircle size={16} className="text-navy-700" />, color: "bg-navy-50 border-navy-200 text-navy-700" },
            { label: "Dispatched", count: ALERTS.filter((a) => a.status === "Dispatched").length, icon: <ExternalLink size={16} className="text-safe-700" />, color: "bg-safe-50 border-safe-200 text-safe-700" },
            { label: "Overdue SLA", count: ALERTS.filter((a) => a.status === "Overdue" || a.status === "Pending").length, icon: <Clock size={16} className="text-amber-700" />, color: "bg-amber-50 border-amber-200 text-amber-700" },
          ].map((c, i) => (
            <div key={i} className={`border rounded-lg p-4 flex items-center gap-3 ${c.color}`}>
              <div className="w-9 h-9 bg-white rounded flex items-center justify-center shrink-0">{c.icon}</div>
              <div>
                <div className="text-2xl font-bold">{c.count}</div>
                <div className="text-xs">{c.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Alerts Table */}
        <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {[
                    { key: "id", label: "Alert ID" },
                    { key: "caseId", label: "Case ID" },
                    { key: "type", label: "Alert Type" },
                    { key: "priority", label: "Priority" },
                    { key: "location", label: "Location" },
                    { key: "svi", label: "SVI" },
                    { key: "time", label: "Time" },
                    { key: "status", label: "Status" },
                    { key: "action", label: "Action" },
                  ].map((h) => (
                    <th key={h.key} className="text-left px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={i} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${a.priority === "Critical" ? "bg-critical-50/30" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{a.id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-navy-900">{a.caseId}</td>
                    <td className="px-4 py-3 text-slate-700">{a.type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                          a.priority === "Critical"
                            ? "bg-critical-100 text-critical-800"
                            : a.priority === "High"
                            ? "bg-high-100 text-high-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {a.priority === "Critical" && <span className="w-1.5 h-1.5 bg-critical-700 rounded-full animate-pulse" />}
                        {a.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin size={10} className="text-slate-400" />
                        <span>{a.district}, {a.state}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-navy-900">{a.svi}/100</td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">{a.time}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3">
                      {acknowledged.has(a.id) ? (
                        <span className="text-xs text-safe-700 font-semibold flex items-center gap-1">
                          <CheckCircle size={10} /> Acknowledged
                        </span>
                      ) : a.status === "Active" || a.status === "Overdue" ? (
                        <button
                          onClick={() => handleAcknowledge(a.id)}
                          className="text-xs font-semibold text-white bg-navy-900 px-3 py-1 rounded hover:bg-navy-800 transition"
                        >
                          Acknowledge
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SLA Legend */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-critical-700 rounded-full" /> Critical: Immediate response required (SVI ≥ 85)</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-high-700 rounded-full" /> High: FIR within 24h, Relief within 7d</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-amber-700 rounded-full" /> Moderate: Chargesheet within 60d</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-safe-700 rounded-full" /> Acknowledged: Officer assigned</div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}