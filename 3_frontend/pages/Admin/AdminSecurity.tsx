import AdminLayout from "../../components/layout/AdminLayout";
import { Lock, Shield, Eye, FileText, CheckCircle } from "lucide-react";

const AUDIT_LOG = [
  { action: "Case RAH-2026-00124 viewed", user: "Adv. Rajesh Kumar", time: "22 Aug 2026, 10:45 AM", access: "Authorized" },
  { action: "AI Summary accessed", user: "Adv. Rajesh Kumar", time: "22 Aug 2026, 10:44 AM", access: "Authorized" },
  { action: "Counsellor assigned (RAH-00125)", user: "Officer Meena Patil", time: "22 Aug 2026, 09:30 AM", access: "Authorized" },
  { action: "Case list exported (High Priority)", user: "Adv. Rajesh Kumar", time: "21 Aug 2026, 04:10 PM", access: "Authorized" },
  { action: "Caste certificate accessed", user: "Officer Meena Patil", time: "21 Aug 2026, 02:55 PM", access: "Restricted — Logged" },
];

export default function AdminSecurity() {
  return (
    <AdminLayout>
      <div className="px-6 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-navy-900">Privacy & Security</h1>
          <p className="text-sm text-slate-500 mt-0.5">Role-based access control, audit logs, and security status — Demo Data</p>
        </div>

        {/* Security status */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {[
            { icon: <Lock size={16} className="text-safe-700" />, label: "Encryption Status", value: "Active — AES-256", ok: true },
            { icon: <Shield size={16} className="text-safe-700" />, label: "Access Control", value: "Role-Based (RBAC)", ok: true },
            { icon: <Eye size={16} className="text-navy-700" />, label: "AI Audit Logging", value: "Enabled", ok: true },
          ].map(({ icon, label, value, ok }) => (
            <div key={label} className="bg-white border border-slate-200 rounded p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-safe-50 rounded flex items-center justify-center shrink-0">{icon}</div>
              <div>
                <div className="text-xs text-slate-500">{label}</div>
                <div className="text-sm font-semibold text-navy-900 flex items-center gap-1.5">
                  {ok && <CheckCircle size={12} className="text-safe-700" />} {value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Role-based access */}
        <div className="bg-white border border-slate-200 rounded mb-5">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-navy-900 text-sm">Role-Based Access Control</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Role", "Case List", "AI Summary", "Caste Certificate", "Admin Actions", "Audit Logs"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Complainant (User)", "Own Only", "Own Only", "❌", "❌", "❌"],
                ["Counsellor", "Assigned Only", "Assigned Only", "❌", "❌", "❌"],
                ["District Officer", "District", "District", "Restricted", "✓", "Own"],
                ["State Officer", "State", "State", "❌", "✓", "State"],
                ["NHAA Admin", "All", "All", "Authorized Only", "Full", "Full"],
              ].map(([role, ...cols]) => (
                <tr key={role} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-semibold text-navy-900">{role}</td>
                  {cols.map((c, i) => (
                    <td key={i} className={`px-4 py-3 text-xs ${c === "❌" ? "text-slate-300" : c === "Full" || c === "All" ? "text-safe-700 font-semibold" : "text-slate-600"}`}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Audit log */}
        <div className="bg-white border border-slate-200 rounded">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <FileText size={15} className="text-navy-700" />
            <h2 className="font-bold text-navy-900 text-sm">Recent Audit Log</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Action", "Performed By", "Timestamp", "Access Level"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AUDIT_LOG.map((log, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{log.action}</td>
                  <td className="px-4 py-3 text-navy-900 font-medium">{log.user}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{log.time}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${log.access.includes("Restricted") ? "text-amber-700" : "text-safe-700"}`}>{log.access}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
