import { useState, useEffect } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import { MapPin, X, AlertTriangle, BarChart2, Globe } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { api } from "../../utils/api";

interface ClusterData {
  region: string;
  state: string;
  cases: number;
  avgSvi: number;
  dominant: string;
  highRisk: number;
  lat: number;
  lng: number;
}

const ALL_INDIA_CLUSTERS: ClusterData[] = [
  // Maharashtra
  { region: "Nagpur", state: "Maharashtra", cases: 41, avgSvi: 91, dominant: "Threat / Intimidation", highRisk: 42, lat: 21.1458, lng: 79.0882 },
  { region: "Nashik", state: "Maharashtra", cases: 57, avgSvi: 84, dominant: "Social Boycott", highRisk: 38, lat: 20.0063, lng: 73.7810 },
  { region: "Pune", state: "Maharashtra", cases: 68, avgSvi: 78, dominant: "Caste-based Discrimination", highRisk: 31, lat: 18.5204, lng: 73.8567 },
  { region: "Solapur", state: "Maharashtra", cases: 29, avgSvi: 72, dominant: "Physical Assault & Medical Risk", highRisk: 28, lat: 17.6599, lng: 75.9064 },
  { region: "Amravati", state: "Maharashtra", cases: 35, avgSvi: 68, dominant: "Forced Displacement & Housing", highRisk: 24, lat: 20.9320, lng: 77.7523 },
  { region: "Aurangabad", state: "Maharashtra", cases: 33, avgSvi: 57, dominant: "Legal Proceeding Distress", highRisk: 18, lat: 19.8762, lng: 75.3433 },
  { region: "Mumbai", state: "Maharashtra", cases: 84, avgSvi: 52, dominant: "Workplace Harassment", highRisk: 15, lat: 19.0760, lng: 72.8777 },

  // Uttar Pradesh
  { region: "Lucknow", state: "Uttar Pradesh", cases: 76, avgSvi: 88, dominant: "Atrocity & Physical Threat", highRisk: 45, lat: 26.8467, lng: 80.9462 },
  { region: "Kanpur", state: "Uttar Pradesh", cases: 62, avgSvi: 81, dominant: "Social Isolation & Threats", highRisk: 39, lat: 26.4499, lng: 80.3319 },
  { region: "Varanasi", state: "Uttar Pradesh", cases: 53, avgSvi: 75, dominant: "Caste Discrimination", highRisk: 32, lat: 25.3176, lng: 82.9739 },
  { region: "Agra", state: "Uttar Pradesh", cases: 48, avgSvi: 69, dominant: "Property & Land Disputes", highRisk: 26, lat: 27.1767, lng: 78.0081 },
  { region: "Prayagraj", state: "Uttar Pradesh", cases: 42, avgSvi: 64, dominant: "Legal Aid Distress", highRisk: 20, lat: 25.4358, lng: 81.8463 },

  // Madhya Pradesh
  { region: "Bhopal", state: "Madhya Pradesh", cases: 54, avgSvi: 82, dominant: "Tribal Land Displacement", highRisk: 36, lat: 23.2599, lng: 77.4126 },
  { region: "Indore", state: "Madhya Pradesh", cases: 61, avgSvi: 74, dominant: "Workplace Discrimination", highRisk: 29, lat: 22.7196, lng: 75.8577 },
  { region: "Gwalior", state: "Madhya Pradesh", cases: 39, avgSvi: 79, dominant: "Threat & Intimidation", highRisk: 33, lat: 26.2183, lng: 78.1828 },
  { region: "Jabalpur", state: "Madhya Pradesh", cases: 31, avgSvi: 63, dominant: "Social Boycott", highRisk: 19, lat: 23.1815, lng: 79.9864 },

  // Rajasthan
  { region: "Jaipur", state: "Rajasthan", cases: 71, avgSvi: 80, dominant: "Domestic & Physical Assault", highRisk: 34, lat: 26.9124, lng: 75.7873 },
  { region: "Jodhpur", state: "Rajasthan", cases: 44, avgSvi: 73, dominant: "Public Access Discrimination", highRisk: 27, lat: 26.2389, lng: 73.0243 },
  { region: "Udaipur", state: "Rajasthan", cases: 36, avgSvi: 66, dominant: "Tribal Rights Distress", highRisk: 21, lat: 24.5854, lng: 73.7125 },

  // Delhi NCR
  { region: "New Delhi", state: "Delhi NCR", cases: 92, avgSvi: 77, dominant: "Women Safety & Cyber Threats", highRisk: 35, lat: 28.6139, lng: 77.2090 },
  { region: "Gurugram", state: "Delhi NCR", cases: 45, avgSvi: 61, dominant: "Workplace Harassment", highRisk: 18, lat: 28.4595, lng: 77.0266 },

  // Bihar
  { region: "Patna", state: "Bihar", cases: 83, avgSvi: 89, dominant: "Community Boycott & Violence", highRisk: 48, lat: 25.5941, lng: 85.1376 },
  { region: "Gaya", state: "Bihar", cases: 49, avgSvi: 83, dominant: "Land Encroachment & Threats", highRisk: 40, lat: 24.7914, lng: 85.0002 },

  // Karnataka
  { region: "Bengaluru", state: "Karnataka", cases: 88, avgSvi: 59, dominant: "Legal Support & Housing", highRisk: 17, lat: 12.9716, lng: 77.5946 },
  { region: "Mysuru", state: "Karnataka", cases: 32, avgSvi: 51, dominant: "General Welfare Assistance", highRisk: 12, lat: 12.2958, lng: 76.6394 },

  // Tamil Nadu
  { region: "Chennai", state: "Tamil Nadu", cases: 79, avgSvi: 62, dominant: "Domestic Support & Legal Aid", highRisk: 20, lat: 13.0827, lng: 80.2707 },
  { region: "Madurai", state: "Tamil Nadu", cases: 41, avgSvi: 71, dominant: "Caste-based Atrocities", highRisk: 30, lat: 9.9252, lng: 78.1198 },

  // West Bengal
  { region: "Kolkata", state: "West Bengal", cases: 81, avgSvi: 67, dominant: "Emotional Distress & Support", highRisk: 22, lat: 22.5726, lng: 88.3639 },

  // Gujarat
  { region: "Ahmedabad", state: "Gujarat", cases: 67, avgSvi: 64, dominant: "Social Isolation & Housing", highRisk: 19, lat: 23.0225, lng: 72.5714 }
];

const STATE_CENTERS: Record<string, { lat: number; lng: number; zoom: number }> = {
  "All India": { lat: 22.5937, lng: 78.9629, zoom: 5 },
  "Maharashtra": { lat: 19.2502, lng: 75.2500, zoom: 7 },
  "Uttar Pradesh": { lat: 26.8467, lng: 80.9462, zoom: 7 },
  "Madhya Pradesh": { lat: 23.2599, lng: 77.4126, zoom: 7 },
  "Rajasthan": { lat: 26.9124, lng: 75.7873, zoom: 7 },
  "Delhi NCR": { lat: 28.6139, lng: 77.2090, zoom: 10 },
  "Bihar": { lat: 25.5941, lng: 85.1376, zoom: 7 },
  "Karnataka": { lat: 12.9716, lng: 77.5946, zoom: 7 },
  "Tamil Nadu": { lat: 13.0827, lng: 80.2707, zoom: 7 },
  "West Bengal": { lat: 22.5726, lng: 88.3639, zoom: 7 },
  "Gujarat": { lat: 23.0225, lng: 72.5714, zoom: 7 }
};

function ChangeMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

function createClusterIcon(count: number, avgSvi: number, isSelected: boolean) {
  const color = avgSvi >= 80 ? "#dc2626" : avgSvi >= 65 ? "#ea580c" : avgSvi >= 50 ? "#d97706" : "#059669";
  const size = Math.max(32, Math.min(54, count * 0.7 + 22));
  const border = isSelected ? "3px solid #0f172a" : "2px solid white";
  const shadow = isSelected ? "0 0 14px rgba(0,0,0,0.6)" : "0 2px 8px rgba(0,0,0,0.35)";

  return L.divIcon({
    className: "cluster-leaflet-marker",
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: ${border};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      box-shadow: ${shadow};
      transition: all 0.2s;
    ">
      <span style="font-size: 12px; line-height: 1;">${count}</span>
      <span style="font-size: 8px; opacity: 0.9; margin-top: 1px;">SVI ${avgSvi}</span>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

export default function GeoAnalysis() {
  const [selectedState, setSelectedState] = useState<string>("All India");
  const [selectedSviRange, setSelectedSviRange] = useState<string>("All SVI Ranges");
  const [selectedProblem, setSelectedProblem] = useState<string>("All Problem Types");
  const [selectedCluster, setSelectedCluster] = useState<ClusterData | null>(null);

  const filteredClusters = ALL_INDIA_CLUSTERS.filter(c => {
    if (selectedState !== "All India" && c.state !== selectedState) return false;
    if (selectedSviRange === "High (≥ 70)" && c.avgSvi < 70) return false;
    if (selectedSviRange === "Moderate (50-69)" && (c.avgSvi < 50 || c.avgSvi >= 70)) return false;
    if (selectedSviRange === "Low (< 50)" && c.avgSvi >= 50) return false;
    return true;
  });

  const statePos = STATE_CENTERS[selectedState] || STATE_CENTERS["All India"];

  return (
    <AdminLayout>
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-navy-900 flex items-center gap-2">
              <MapPin className="text-navy-700" size={22} /> Geographic Vulnerability Analysis (All India)
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Nationwide OpenStreetMap spatial cluster analysis across Indian States & Union Territories.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-navy-50 text-navy-800 px-3 py-1.5 rounded font-medium border border-navy-100 shrink-0">
            <BarChart2 size={14} /> Total Cases Mapped: <strong className="font-mono">{filteredClusters.reduce((a, b) => a + b.cases, 0)}</strong>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-5 flex flex-wrap gap-3 shadow-xs items-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900 uppercase tracking-wider mr-2">
            <Globe size={14} className="text-navy-700" /> Filter Region:
          </div>

          {/* State Dropdown */}
          <select
            value={selectedState}
            onChange={e => {
              setSelectedState(e.target.value);
              setSelectedCluster(null);
            }}
            className="border border-navy-300 rounded px-3 py-1.5 text-sm text-navy-900 font-semibold outline-none focus:border-navy-600 bg-navy-50 cursor-pointer"
          >
            {Object.keys(STATE_CENTERS).map(st => (
              <option key={st} value={st}>{st === "All India" ? "All States (All India)" : `${st} State`}</option>
            ))}
          </select>

          {/* SVI Range Dropdown */}
          <select
            value={selectedSviRange}
            onChange={e => setSelectedSviRange(e.target.value)}
            className="border border-slate-200 rounded px-3 py-1.5 text-sm text-slate-600 outline-none focus:border-navy-600 bg-white font-medium cursor-pointer"
          >
            <option>All SVI Ranges</option>
            <option>High (≥ 70)</option>
            <option>Moderate (50-69)</option>
            <option>Low (&lt; 50)</option>
          </select>
        </div>

        {/* Map + Detail Card Grid */}
        <div className="grid lg:grid-cols-12 gap-5 mb-6">
          {/* Leaflet Map */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-navy-900 text-sm flex items-center gap-2">
                {selectedState} — Spatial Vulnerability Heatmap
              </h2>
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 flex-wrap">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600" /> SVI ≥ 80 (Critical)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-600" /> SVI 65–79 (High)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-600" /> SVI 50–64 (Moderate)</span>
              </div>
            </div>

            <div className="rounded-lg overflow-hidden border border-slate-200 h-[480px] relative shadow-inner">
              <MapContainer
                center={[statePos.lat, statePos.lng]}
                zoom={statePos.zoom}
                style={{ height: "100%", width: "100%" }}
              >
                <ChangeMapView center={[statePos.lat, statePos.lng]} zoom={statePos.zoom} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {filteredClusters.map(cluster => {
                  const isSelected = selectedCluster?.region === cluster.region;

                  return (
                    <Marker
                      key={cluster.region}
                      position={[cluster.lat, cluster.lng]}
                      icon={createClusterIcon(cluster.cases, cluster.avgSvi, isSelected)}
                      eventHandlers={{
                        click: () => setSelectedCluster(cluster)
                      }}
                    >
                      <Popup>
                        <div className="p-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">{cluster.state}</div>
                          <div className="font-bold text-sm text-navy-900 mb-1">{cluster.region} Cluster</div>
                          <div className="text-xs text-slate-600 mb-1">Total Cases: <strong>{cluster.cases}</strong></div>
                          <div className="text-xs text-slate-600 mb-1">Avg SVI: <strong className="font-mono">{cluster.avgSvi}</strong></div>
                          <div className="text-xs text-slate-600 mb-2">Dominant: <strong>{cluster.dominant}</strong></div>
                          <button
                            onClick={() => setSelectedCluster(cluster)}
                            className="w-full bg-navy-900 text-white text-[11px] font-semibold py-1 rounded cursor-pointer"
                          >
                            Inspect Cluster Details
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>

          {/* Cluster detail panel */}
          <div className="lg:col-span-4 flex flex-col">
            {selectedCluster ? (
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex-1">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{selectedCluster.state} State</span>
                    <h3 className="font-bold text-lg text-navy-900">{selectedCluster.region} Cluster</h3>
                  </div>
                  <button onClick={() => setSelectedCluster(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">Average Vulnerability Index (SVI)</div>
                    <div className="flex items-center justify-between">
                      <span className={`text-2xl font-bold font-mono ${selectedCluster.avgSvi >= 70 ? "text-red-700" : "text-amber-700"}`}>
                        SVI {selectedCluster.avgSvi}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded border ${selectedCluster.avgSvi >= 70 ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                        {selectedCluster.avgSvi >= 80 ? "Critical Risk" : selectedCluster.avgSvi >= 70 ? "High Risk" : "Moderate Risk"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                      <div className="text-xs text-slate-500 mb-0.5">Total Cases</div>
                      <div className="text-lg font-bold text-navy-900 font-mono">{selectedCluster.cases}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                      <div className="text-xs text-slate-500 mb-0.5">High-Risk %</div>
                      <div className="text-lg font-bold text-red-700 font-mono">{selectedCluster.highRisk}%</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">Dominant Incident Pattern</div>
                    <div className="text-sm font-semibold text-navy-900">{selectedCluster.dominant}</div>
                  </div>

                  <div className="p-3 bg-navy-950 text-white rounded border border-navy-900 text-xs">
                    <div className="font-bold mb-1 flex items-center gap-1.5 text-amber-400">
                      <AlertTriangle size={14} /> Action Required
                    </div>
                    <p className="text-navy-200 leading-relaxed">
                      Deploy additional DLSA legal counsel & Sakhi shelter officers to {selectedCluster.region} ({selectedCluster.state}) to mitigate high-risk cases.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center flex-1 min-h-[300px]">
                <MapPin size={32} className="text-slate-300 mb-3" />
                <h4 className="font-bold text-sm text-navy-900 mb-1">No District Selected</h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Click any cluster circle on the map to inspect district statistics, case density, and dominant patterns for {selectedState}.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* District Cluster Cards */}
        <div className="mb-3">
          <h2 className="font-bold text-navy-900 text-sm">District Cluster Summaries — {selectedState}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Showing {filteredClusters.length} active spatial clusters</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {filteredClusters.map(cluster => (
            <div
              key={cluster.region}
              className={`bg-white border rounded-lg p-4 hover:border-navy-400 transition cursor-pointer shadow-xs ${
                selectedCluster?.region === cluster.region ? "border-navy-800 ring-1 ring-navy-800" : "border-slate-200"
              }`}
              onClick={() => setSelectedCluster(cluster)}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-bold text-navy-900">{cluster.region}</div>
                  <div className="text-[10px] text-slate-400">{cluster.state}</div>
                </div>
                <div className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${cluster.avgSvi >= 70 ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                  SVI {cluster.avgSvi}
                </div>
              </div>
              <div className="text-xs text-slate-500 mb-1">Dominant: <span className="font-semibold text-slate-700">{cluster.dominant}</span></div>
              <div className="text-xs text-slate-500 mb-3">Cases: <strong className="text-navy-900">{cluster.cases}</strong> · High Risk: <strong className="text-red-700">{cluster.highRisk}%</strong></div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${cluster.avgSvi >= 70 ? "bg-red-600" : "bg-amber-600"}`}
                  style={{ width: `${cluster.avgSvi}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
