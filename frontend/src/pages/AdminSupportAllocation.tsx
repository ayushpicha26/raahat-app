import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BriefcaseBusiness, CheckCircle2, Clock3, Gavel, HeartPulse, RotateCcw, UserRound } from "lucide-react";
import AdminLayout from "../components/AdminLayout";
import { PriorityBadge } from "../components/Badge";
import { api } from "../utils/api";

type CaseItem = { case_id: string; holder: string; priority: string; svi: number; status: string; assigned_officer?: string; assigned_service?: string; created_at: string };

const SERVICES = [
  { name: "Counselling", officer: "Dr. Meera Joshi", icon: UserRound, hint: "Trauma-informed counselling" },
  { name: "Legal Aid", officer: "DLSA Legal Officer", icon: Gavel, hint: "Rights, protection and legal support" },
  { name: "Medical Help", officer: "District Medical Officer", icon: HeartPulse, hint: "Health and emergency referral" },
];
const COUNSELLORS = [
  { name: "Dr. Meera Joshi", focus: "Trauma & crisis counselling", availability: "Available today" },
  { name: "Dr. Anjali Deshmukh", focus: "Women & family support", availability: "Available today" },
  { name: "Mr. Vikram Kulkarni", focus: "Youth & psychosocial support", availability: "Next available: tomorrow" },
];

export default function AdminSupportAllocation() {
  const nav = useNavigate();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState("All services");
  const [saving, setSaving] = useState<string | null>(null);
  const [counsellors, setCounsellors] = useState<Record<string, string>>({});
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null);

  const loadCases = () => {
    setLoading(true);
    api.get<{ cases: CaseItem[] }>("/cases?limit=100").then(result => {
      if (result.ok && result.data) setCases(result.data.cases);
      setLoading(false);
    });
  };
  useEffect(loadCases, []);

  const pending = useMemo(() => cases.filter(c => !c.assigned_service && c.status !== "Resolved"), [cases]);
  const assigned = useMemo(() => cases.filter(c => c.assigned_service && (service === "All services" || c.assigned_service === service)), [cases, service]);

  async function allocate(caseItem: CaseItem, selected: typeof SERVICES[number]) {
    setSaving(caseItem.case_id);
    const officer = selected.name === "Counselling" ? (counsellors[caseItem.case_id] || COUNSELLORS[0].name) : selected.officer;
    const result = await api.put(`/cases/${caseItem.case_id}/assign`, { officer, service: selected.name });
    setSaving(null);
    if (result.ok) loadCases();
    else alert(result.error || "Unable to allocate support.");
  }

  async function revokeAllocation(caseItem: CaseItem) {
    setSaving(caseItem.case_id);
    const result = await api.put(`/cases/${caseItem.case_id}/revoke-assignment`);
    setSaving(null);
    setRevokeConfirm(null);
    if (result.ok) loadCases();
    else alert(result.error || "Unable to revoke the allocation.");
  }

  return <AdminLayout><div className="px-6 py-6 max-w-6xl">
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div><h1 className="text-xl font-bold text-navy-900">Support Allocation</h1><p className="text-sm text-slate-500 mt-0.5">Match active cases with the appropriate support service and officer.</p></div>
      <div className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded"><Clock3 size={13} className="inline mr-1.5" />{pending.length} awaiting allocation</div>
    </div>

    <div className="grid md:grid-cols-3 gap-4 mb-6">
      {SERVICES.map(item => { const Icon = item.icon; const count = cases.filter(c => c.assigned_service === item.name && c.status !== "Resolved").length; return <div key={item.name} className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between"><div className="w-9 h-9 bg-navy-50 text-navy-700 rounded flex items-center justify-center"><Icon size={17} /></div><span className="font-mono text-lg font-bold text-navy-900">{count}</span></div>
        <h2 className="font-semibold text-sm text-navy-900 mt-3">{item.name}</h2><p className="text-xs text-slate-500 mt-1">{item.hint}</p>
      </div>; })}
    </div>

    <div className="bg-white border border-slate-200 rounded-lg mb-5 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2"><UserRound size={16} className="text-navy-700" /><div><h2 className="font-bold text-navy-900 text-sm">Counsellor roster</h2><p className="text-xs text-slate-500 mt-0.5">Choose the most suitable counsellor for each counselling referral.</p></div></div>
      <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">{COUNSELLORS.map(person => <div key={person.name} className="p-4"><div className="flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-navy-50 text-navy-700 flex items-center justify-center text-xs font-bold">{person.name.split(" ").filter(n => !n.endsWith(".")).map(n => n[0]).join("").slice(0, 2)}</span><span className="text-sm font-semibold text-navy-900">{person.name}</span></div><p className="text-xs text-slate-600 mt-3">{person.focus}</p><p className="text-xs text-safe-700 font-medium mt-1">{person.availability}</p></div>)}</div>
    </div>

    <div className="bg-white border border-slate-200 rounded-lg mb-5 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2"><BriefcaseBusiness size={16} className="text-critical-700" /><div><h2 className="font-bold text-navy-900 text-sm">Allocation queue</h2><p className="text-xs text-slate-500 mt-0.5">Allocate high-priority unassigned cases first.</p></div></div>
      {loading ? <div className="p-8 text-center text-sm text-slate-400">Loading allocation queue…</div> : pending.length === 0 ? <div className="p-8 text-center text-sm text-safe-700">All active cases have a support allocation.</div> : <div className="divide-y divide-slate-100">{pending.map(c => <div key={c.case_id} className="p-4 flex flex-wrap items-center gap-3">
        <PriorityBadge priority={c.priority} /><div className="min-w-35 flex-1"><button onClick={() => nav(`/admin/case/${c.case_id}`)} className="font-mono text-xs text-navy-700 hover:underline">{c.case_id}</button><div className="text-sm font-semibold text-navy-900">{c.holder}</div><div className="text-xs text-slate-500">SVI {c.svi} · {c.status}</div></div>
        <div className="flex flex-wrap gap-2 items-center"><select aria-label={`Counsellor for ${c.holder}`} value={counsellors[c.case_id] || COUNSELLORS[0].name} onChange={e => setCounsellors(current => ({ ...current, [c.case_id]: e.target.value }))} className="text-xs border border-slate-200 rounded px-2 py-1.5 text-slate-700 bg-white">{COUNSELLORS.map(person => <option key={person.name}>{person.name}</option>)}</select>{SERVICES.map(s => <button key={s.name} disabled={saving === c.case_id} onClick={() => allocate(c, s)} className="text-xs font-semibold border border-navy-200 text-navy-800 hover:bg-navy-50 px-2.5 py-1.5 rounded disabled:opacity-50">{saving === c.case_id ? "Allocating…" : s.name === "Counselling" ? "Assign counsellor" : s.name}</button>)}</div>
      </div>)}</div>}
    </div>

    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-safe-700" /><h2 className="font-bold text-navy-900 text-sm">Allocated cases</h2></div><select value={service} onChange={e => setService(e.target.value)} className="text-xs border border-slate-200 rounded px-2.5 py-1.5 text-slate-700"><option>All services</option>{SERVICES.map(s => <option key={s.name}>{s.name}</option>)}</select></div>
      <div className="divide-y divide-slate-100">{assigned.length ? assigned.map(c => <div key={c.case_id} className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-sm"><div><button onClick={() => nav(`/admin/case/${c.case_id}`)} className="font-semibold text-navy-900 hover:underline">{c.holder}</button><span className="text-xs text-slate-400 font-mono ml-2">{c.case_id}</span></div><div className="flex items-center gap-3"><div className="text-right"><div className="text-xs font-semibold text-navy-700">{c.assigned_service}</div><div className="text-xs text-slate-500">{c.assigned_officer}</div></div>{revokeConfirm === c.case_id ? <div className="flex items-center gap-1"><span className="text-[11px] text-critical-700">Revoke?</span><button onClick={() => revokeAllocation(c)} disabled={saving === c.case_id} className="text-[11px] font-bold bg-critical-700 text-white px-2 py-1 rounded disabled:opacity-50">{saving === c.case_id ? "…" : "Yes"}</button><button onClick={() => setRevokeConfirm(null)} className="text-[11px] text-slate-500 border border-slate-200 px-2 py-1 rounded">No</button></div> : <button onClick={() => setRevokeConfirm(c.case_id)} className="flex items-center gap-1 text-xs font-semibold text-critical-700 border border-critical-200 hover:bg-critical-50 px-2 py-1.5 rounded"><RotateCcw size={12} />Revoke</button>}</div></div>) : <div className="p-6 text-center text-sm text-slate-400">No allocated cases in this service.</div>}</div>
    </div>
  </div></AdminLayout>;
}
