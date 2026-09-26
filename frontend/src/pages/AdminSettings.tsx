import { useState } from "react";
import { Bell, Globe2, Save, ShieldCheck } from "lucide-react";
import AdminLayout from "../components/AdminLayout";

export default function AdminSettings() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({ critical: true, daily: true, language: "English", escalationHours: "2", reviewHours: "24" });
  const update = (key: keyof typeof settings, value: string | boolean) => setSettings(current => ({ ...current, [key]: value }));
  function save() { setSaved(true); window.setTimeout(() => setSaved(false), 2500); }
  return <AdminLayout><div className="px-6 py-6 max-w-3xl">
    <div className="mb-6"><h1 className="text-xl font-bold text-navy-900">Portal Settings</h1><p className="text-sm text-slate-500 mt-0.5">Configure administration workspace preferences and review safeguards.</p></div>
    <div className="space-y-5">
      <section className="bg-white border border-slate-200 rounded-lg"><div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2"><Bell size={16} className="text-navy-700" /><h2 className="font-bold text-sm text-navy-900">Notifications & escalation</h2></div><div className="p-5 space-y-4">
        <Toggle label="Critical case alerts" detail="Notify the authorized officer when an SVI reaches the critical threshold." enabled={settings.critical} onChange={value => update("critical", value)} />
        <Toggle label="Daily allocation digest" detail="Receive a daily summary of open and unallocated support requests." enabled={settings.daily} onChange={value => update("daily", value)} />
        <div className="grid sm:grid-cols-2 gap-4 pt-1"><Field label="Critical-case response target"><select value={settings.escalationHours} onChange={e => update("escalationHours", e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm text-slate-700 bg-white"><option value="1">Within 1 hour</option><option value="2">Within 2 hours</option><option value="4">Within 4 hours</option></select></Field><Field label="Standard review target"><select value={settings.reviewHours} onChange={e => update("reviewHours", e.target.value)} className="w-full border border-slate-200 rounded px-3 py-2 text-sm text-slate-700 bg-white"><option value="24">Within 24 hours</option><option value="48">Within 48 hours</option><option value="72">Within 72 hours</option></select></Field></div>
      </div></section>
      <section className="bg-white border border-slate-200 rounded-lg"><div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2"><Globe2 size={16} className="text-navy-700" /><h2 className="font-bold text-sm text-navy-900">Workspace preferences</h2></div><div className="p-5"><Field label="Default display language"><select value={settings.language} onChange={e => update("language", e.target.value)} className="w-full max-w-xs border border-slate-200 rounded px-3 py-2 text-sm text-slate-700 bg-white"><option>English</option><option>Hindi</option><option>Marathi</option></select></Field></div></section>
      <section className="bg-navy-50 border border-navy-100 rounded-lg p-5 flex gap-3"><ShieldCheck size={18} className="text-navy-700 shrink-0 mt-0.5" /><div><h2 className="font-bold text-sm text-navy-900">Human-review safeguard</h2><p className="text-xs text-slate-600 leading-relaxed mt-1">AI scores assist with prioritization only. Settings cannot automate case decisions, assignments, or interventions.</p></div></section>
    </div>
    <div className="mt-6 flex items-center justify-end gap-3"><span className="text-xs text-safe-700">{saved && "Settings saved for this session."}</span><button onClick={save} className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold px-4 py-2 rounded"><Save size={15} />Save preferences</button></div>
  </div></AdminLayout>;
}

function Toggle({ label, detail, enabled, onChange }: { label: string; detail: string; enabled: boolean; onChange: (value: boolean) => void }) { return <div className="flex items-start justify-between gap-4"><div><div className="text-sm font-semibold text-navy-900">{label}</div><p className="text-xs text-slate-500 mt-0.5">{detail}</p></div><button aria-pressed={enabled} onClick={() => onChange(!enabled)} className={`w-10 h-6 rounded-full p-0.5 transition-colors ${enabled ? "bg-navy-800" : "bg-slate-300"}`}><span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-4" : ""}`} /></button></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-semibold text-slate-600">{label}<div className="mt-1.5">{children}</div></label>; }
