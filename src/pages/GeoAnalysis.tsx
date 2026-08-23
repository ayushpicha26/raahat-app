import { useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { GEO_CLUSTERS } from "../data/sampleData";
import { MapPin, X } from "lucide-react";

const INDIA_DISTRICTS = [
  { name: "Mumbai", x: 175, y: 340 },
  { name: "Pune", x: 185, y: 360 },
  { name: "Nashik", x: 185, y: 310 },
  { name: "Nagpur", x: 290, y: 290 },
  { name: "Aurangabad", x: 220, y: 330 },
  { name: "Solapur", x: 215, y: 375 },
];

function ClusterMarker({ cluster, onClick, selected }: { cluster: typeof GEO_CLUSTERS[0]; onClick: () => void; selected: boolean }) {
  const pos = INDIA_DISTRICTS.find(d => d.name === cluster.region) ?? { x: 200, y: 300 };
  const color = cluster.avgSvi >= 70 ? "#c2410c" : cluster.avgSvi >= 50 ? "#b45309" : "#2e7d52";
  const size = Math.max(24, Math.min(48, cluster.cases / 3));

  return (
    <g onClick={onClick} className="cursor-pointer">
      <circle cx={pos.x} cy={pos.y} r={size / 2} fill={color} fillOpacity={selected ? 0.9 : 0.7} stroke="white" strokeWidth={2} />
      <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={10} fontWeight="bold">{cluster.cases}</text>
      <text x={pos.x} y={pos.y + (size / 2) + 10} textAnchor="middle" fill="#1a3a5c" fontSize={9} fontWeight="600">{cluster.region}</text>
    </g>
  );
}

export default function GeoAnalysis() {
  const [selected, setSelected] = useState<typeof GEO_CLUSTERS[0] | null>(null);

  return (
    <AdminLayout>
      <div className="px-6 py-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-navy-900">Geographic Vulnerability Analysis</h1>
          <p className="text-sm text-slate-500 mt-0.5">Anonymized cluster-level data — Demo Data Only</p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded p-4 mb-5 flex flex-wrap gap-3">
          {["All Problem Types", "All SVI Ranges", "Last 30 Days", "All States"].map(f => (
            <select key={f} className="border border-slate-200 rounded px-3 py-1.5 text-sm text-slate-600 outline-none">
              <option>{f}</option>
            </select>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-6">
          {/* Map */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded p-5">
            <h2 className="font-bold text-navy-900 text-sm mb-4">Maharashtra — Case Cluster Map</h2>
            <div className="bg-slate-100 rounded border border-slate-200 relative" style={{minHeight: 420}}>
              <svg width="100%" height="420" viewBox="0 0 420 480" style={{display:"block"}}>
                {/* Simplified Maharashtra outline */}
                <path d="M120,200 L150,180 L180,170 L220,175 L260,185 L300,195 L340,210 L360,240 L350,275 L330,310 L310,345 L280,375 L250,400 L215,415 L190,420 L165,410 L145,390 L130,360 L115,330 L105,295 L108,255 L120,220 Z"
                  fill="#dde8f4" stroke="#9eb3c8" strokeWidth="1.5" />
                <text x="210" y="300" textAnchor="middle" fill="#9eb3c8" fontSize="11" fontWeight="600">Maharashtra</text>

                {/* Clusters */}
                {GEO_CLUSTERS.map(cluster => (
                  <ClusterMarker
                    key={cluster.region}
                    cluster={cluster}
                    onClick={() => setSelected(selected?.region === cluster.region ? null : cluster)}
                    selected={selected?.region === cluster.region}
                  />
                ))}
              </svg>

              {/* Legend */}
              <div className="absolute bottom-3 left-3 bg-white border border-slate-200 rounded p-2.5 text-xs">
                <div className="font-bold text-slate-600 mb-1.5">Average SVI</div>
                {[["≥ 70 — High", "#c2410c"], ["50–69 — Moderate", "#b45309"], ["< 50 — Low", "#2e7d52"]].map(([l, c]) => (
                  <div key={l} className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full" style={{background: c as string}} />
                    <span className="text-slate-600">{l}</span>
                  </div>
                ))}
                <div className="mt-1.5 border-t border-slate-100 pt-1.5 text-slate-400">Circle size = case count</div>
              </div>
            </div>
          </div>

          {/* Cluster detail panel */}
          <div>
            {selected ? (
              <div className="bg-white border border-slate-200 rounded p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-navy-900">{selected.region} Cluster</h3>
                  <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                </div>
                <div className="space-y-3">
                  {[
                    { k: "Total Cases", v: selected.cases },
                    { k: "Average SVI", v: selected.avgSvi, color: selected.avgSvi >= 70 ? "text-high-700" : "text-amber-700" },
                    { k: "Dominant Problem", v: selected.dominant },
                    { k: "High-Risk Percentage", v: `${selected.highRisk}%` },
                  ].map(({ k, v, color }) => (
                    <div key={k} className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-sm text-slate-600">{k}</span>
                      <span className={`text-sm font-bold ${color ?? "text-navy-900"}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded p-5 flex flex-col items-center justify-center text-center h-48">
                <MapPin size={24} className="text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">Click a cluster marker to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Pattern clusters */}
        <div className="mb-3">
          <h2 className="font-bold text-navy-900 text-sm">Case Pattern Clusters</h2>
          <p className="text-xs text-slate-400 mt-0.5">Aggregated anonymized patterns — Demo Data</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {GEO_CLUSTERS.map(cluster => (
            <div key={cluster.region} className="bg-white border border-slate-200 rounded p-4 hover:border-navy-300 cursor-pointer" onClick={() => setSelected(cluster)}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-navy-900">{cluster.region}</div>
                <div className={`text-sm font-bold font-mono ${cluster.avgSvi >= 70 ? "text-high-700" : "text-amber-700"}`}>SVI {cluster.avgSvi}</div>
              </div>
              <div className="text-xs text-slate-500 mb-1">Dominant: <span className="font-semibold text-slate-700">{cluster.dominant}</span></div>
              <div className="text-xs text-slate-500 mb-3">Cases: <strong>{cluster.cases}</strong> · High Risk: <strong className="text-high-700">{cluster.highRisk}%</strong></div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-navy-700" style={{ width: `${cluster.avgSvi}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
