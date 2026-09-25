import { useState, useEffect } from "react";
import UserLayout from "../../components/layout/UserLayout";
import { MapPin, Phone, Navigation, Shield, Home, Gavel, Heart, Building, RefreshCw, AlertCircle } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { api } from "../../utils/api";

// Custom marker icons using Leaflet DivIcons for crisp SVG rendering
function createCustomIcon(color: string, label: string) {
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.3); font-size: 11px;">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

const icons = {
  user: createCustomIcon("#2563eb", "YOU"),
  shelter: createCustomIcon("#059669", "🏠"),
  police: createCustomIcon("#dc2626", "👮"),
  legal: createCustomIcon("#d97706", "⚖️"),
  hospital: createCustomIcon("#7c3aed", "🏥"),
  ngo: createCustomIcon("#0284c7", "🤝")
};

interface HelpCenter {
  id: number;
  name: string;
  type: "shelter" | "police" | "legal" | "hospital" | "ngo";
  latitude: number;
  longitude: number;
  address: string;
  phone: string;
  district: string;
  state: string;
  timings: string;
  services: string;
  distance_km?: number;
}

export default function NearbyHelp() {
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locStatus, setLocStatus] = useState<"locating" | "success" | "fallback" | "error">("locating");
  const [centers, setCenters] = useState<HelpCenter[]>([]);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Default fallback: Mumbai center
  const defaultPos = { lat: 19.0760, lng: 72.8777 };

  useEffect(() => {
    detectLocation();
  }, []);

  function detectLocation() {
    setLocStatus("locating");
    setLoading(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLoc({ lat, lng });
          setLocStatus("success");
          fetchCenters(lat, lng);
        },
        (err) => {
          console.warn("GPS access denied/unavailable, using default district center:", err.message);
          setUserLoc(defaultPos);
          setLocStatus("fallback");
          fetchCenters(defaultPos.lat, defaultPos.lng);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setUserLoc(defaultPos);
      setLocStatus("fallback");
      fetchCenters(defaultPos.lat, defaultPos.lng);
    }
  }

  function fetchCenters(lat: number, lng: number) {
    api.get<{ centers: HelpCenter[] }>(`/help-centers?lat=${lat}&lng=${lng}`)
      .then(res => {
        setLoading(false);
        if (res.ok && res.data) {
          setCenters(res.data.centers);
        }
      })
      .catch(err => {
        console.error("Error fetching help centers:", err);
        setLoading(false);
      });
  }

  const mapCenter = userLoc || defaultPos;
  const filteredCenters = selectedType === "all"
    ? centers
    : centers.filter(c => c.type === selectedType);

  const typeBadges: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    shelter: { label: "Sakhi / Shelter", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", icon: <Home size={14} /> },
    police: { label: "Police Women Cell", bg: "bg-red-50 border-red-200", text: "text-red-800", icon: <Shield size={14} /> },
    legal: { label: "Free Legal Aid (DLSA)", bg: "bg-amber-50 border-amber-200", text: "text-amber-800", icon: <Gavel size={14} /> },
    hospital: { label: "Govt Hospital", bg: "bg-purple-50 border-purple-200", text: "text-purple-800", icon: <Heart size={14} /> },
    ngo: { label: "Welfare NGO", bg: "bg-sky-50 border-sky-200", text: "text-sky-800", icon: <Building size={14} /> }
  };

  return (
    <UserLayout>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-950 flex items-center gap-2.5">
              <MapPin className="text-navy-700" size={24} /> Nearby Help Centers & Emergency Shelters
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Find Sakhi One-Stop Centres, Police Women Protection Cells, DLSA Legal Aid offices, and emergency hospitals near your location.
            </p>
          </div>
          <button
            onClick={detectLocation}
            className="inline-flex items-center gap-2 px-4 py-2 bg-navy-900 text-white text-sm font-semibold rounded hover:bg-navy-800 transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            <RefreshCw size={14} className={locStatus === "locating" ? "animate-spin" : ""} />
            {locStatus === "locating" ? "Detecting GPS..." : "Re-Detect Location"}
          </button>
        </div>

        {/* Location Status Alert */}
        {locStatus === "success" && userLoc && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs px-4 py-2.5 rounded flex items-center justify-between">
            <span className="flex items-center gap-2 font-medium">
              <MapPin size={14} className="text-emerald-600 shrink-0" />
              GPS Location Active: Showing emergency facilities within range of coordinates ({userLoc.lat.toFixed(4)}, {userLoc.lng.toFixed(4)})
            </span>
          </div>
        )}

        {locStatus === "fallback" && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-900 text-xs px-4 py-2.5 rounded flex items-center justify-between">
            <span className="flex items-center gap-2 font-medium">
              <AlertCircle size={14} className="text-amber-600 shrink-0" />
              GPS access not granted. Showing facilities in Maharashtra. Click "Re-Detect Location" to enable precise GPS.
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: "all", label: "All Facilities" },
            { id: "shelter", label: "🏠 Shelters (Sakhi)" },
            { id: "police", label: "👮 Police Women Cell" },
            { id: "legal", label: "⚖️ Legal Aid (DLSA)" },
            { id: "hospital", label: "🏥 Medical / Hospital" },
            { id: "ngo", label: "🤝 Welfare NGOs" }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedType(f.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                selectedType === f.id
                  ? "bg-navy-900 text-white border-navy-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Map & Cards Grid */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Map Container */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm h-[500px] relative">
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={11}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* User location marker */}
              {userLoc && locStatus === "success" && (
                <Marker position={[userLoc.lat, userLoc.lng]} icon={icons.user}>
                  <Popup>
                    <div className="font-bold text-xs text-navy-900">Your Current Location</div>
                  </Popup>
                </Marker>
              )}

              {/* Help Center markers */}
              {filteredCenters.map(center => (
                <Marker
                  key={center.id}
                  position={[center.latitude, center.longitude]}
                  icon={icons[center.type] || icons.shelter}
                >
                  <Popup>
                    <div className="p-1 max-w-[200px]">
                      <div className="font-bold text-xs text-navy-900 mb-1">{center.name}</div>
                      <div className="text-[11px] text-slate-600 mb-1">{center.address}</div>
                      {center.distance_km !== undefined && (
                        <div className="text-[10px] font-bold text-navy-700 font-mono mb-1.5">{center.distance_km} km away</div>
                      )}
                      <a
                        href={`tel:${center.phone}`}
                        className="inline-flex items-center gap-1 bg-navy-900 text-white text-[10px] px-2.5 py-1 rounded font-bold"
                      >
                        <Phone size={10} /> Call {center.phone}
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* List Sidebar */}
          <div className="lg:col-span-5 space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400 text-sm">
                Loading emergency help centers...
              </div>
            ) : filteredCenters.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400 text-sm">
                No facilities found matching selected filter.
              </div>
            ) : (
              filteredCenters.map(center => {
                const badge = typeBadges[center.type] || typeBadges.shelter;
                const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`;

                return (
                  <div key={center.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-navy-400 transition">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded border mb-1.5 ${badge.bg} ${badge.text}`}>
                          {badge.icon} {badge.label}
                        </span>
                        <h3 className="font-bold text-sm text-navy-950">{center.name}</h3>
                      </div>
                      {center.distance_km !== undefined && (
                        <span className="text-xs font-mono font-bold bg-navy-50 text-navy-900 px-2 py-1 rounded shrink-0">
                          {center.distance_km} km
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mb-2 leading-relaxed">{center.address}</p>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 mt-2 text-xs">
                      <span className="text-slate-400 text-[11px]">Timings: <strong className="text-slate-700">{center.timings}</strong></span>
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${center.phone}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded transition"
                        >
                          <Phone size={12} /> Call Now
                        </a>
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold rounded transition"
                        >
                          <Navigation size={12} /> Map
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
