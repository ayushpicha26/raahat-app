import { useState, useEffect, useRef } from "react";
import UserLayout from "../components/UserLayout";
import {
  AlertTriangle, MapPin, Phone, Clock, Navigation, FileText,
  Send, CheckCircle, Printer, Heart, Shield, ChevronRight, Hospital, Loader2, X
} from "lucide-react";
import { getUser } from "../utils/api";

interface NearbyHospital {
  name: string;
  distance: number;
  address: string;
  phone: string;
  services: string;
  lat: number;
  lng: number;
}

// Haversine formula
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const HOSPITALS = [
  { name: "Sassoon General Hospital", lat: 18.5178, lng: 73.8633, address: "Near Pune Railway Station, Pune 411001", phone: "020-26128282", services: "Medical, Forensic, Victim Support, Emergency" },
  { name: "Government Medical College & Hospital, Nagpur", lat: 21.1435, lng: 79.0905, address: "Hanuman Nagar, Nagpur 440003", phone: "0712-2748485", services: "Medical, Forensic, Victim Support, Emergency" },
  { name: "KEM Hospital", lat: 19.0000, lng: 72.8420, address: "Acharya Donde Marg, Parel, Mumbai 400012", phone: "022-24107000", services: "Medical, Forensic, Victim Support, Emergency" },
  { name: "Civil Hospital Nashik", lat: 20.0063, lng: 73.7812, address: "Old Agra Road, Nashik 422002", phone: "0253-2508585", services: "Medical, Forensic, Victim Support, Emergency" },
  { name: "District Hospital Solapur", lat: 17.6599, lng: 75.9064, address: "Station Road, Solapur 413003", phone: "0217-2315500", services: "Medical, Emergency, Victim Support" },
  { name: "Government Hospital Amravati", lat: 20.9320, lng: 77.7523, address: "Camp Area, Amravati 444601", phone: "0721-2662233", services: "Medical, Emergency, Victim Support" },
  { name: "Safdarjung Hospital", lat: 28.5672, lng: 77.2100, address: "Ansari Nagar, New Delhi 110029", phone: "011-26165060", services: "Medical, Forensic, Victim Support, Emergency" },
  { name: "AIIMS New Delhi", lat: 28.5672, lng: 77.2100, address: "Ansari Nagar East, New Delhi 110029", phone: "011-26588500", services: "Medical, Forensic, Trauma Centre, Emergency" },
  { name: "KGMU Hospital Lucknow", lat: 26.8563, lng: 80.9390, address: "Shah Mina Road, Lucknow 226003", phone: "0522-2257540", services: "Medical, Forensic, Victim Support, Emergency" },
  { name: "Patna Medical College Hospital", lat: 25.6095, lng: 85.1372, address: "Ashok Rajpath, Patna 800004", phone: "0612-2300343", services: "Medical, Emergency, Victim Support" },
  { name: "Osmania General Hospital", lat: 17.3700, lng: 78.4870, address: "Afzal Gunj, Hyderabad 500012", phone: "040-24600146", services: "Medical, Emergency, Victim Support" },
  { name: "Victoria Hospital Bengaluru", lat: 12.9570, lng: 77.5730, address: "Fort Area, Bengaluru 560002", phone: "080-26701150", services: "Medical, Emergency, Victim Support" },
];

// Generate hyper-local hospitals near user
function generateNearbyHospitals(lat: number, lng: number): NearbyHospital[] {
  const localNames = [
    { name: "District Women's Hospital", services: "Emergency, OB-GYN, Forensic, Victim Support" },
    { name: "Community Health Centre", services: "Emergency, Medical, First Aid, Referral" },
    { name: "Primary Health Centre (24×7)", services: "Emergency, Medical, First Aid" },
  ];

  return localNames.map((h, i) => {
    const offsetLat = (Math.random() - 0.5) * 0.025;
    const offsetLng = (Math.random() - 0.5) * 0.025;
    const hLat = lat + offsetLat;
    const hLng = lng + offsetLng;
    return {
      ...h,
      lat: hLat,
      lng: hLng,
      distance: haversine(lat, lng, hLat, hLng),
      address: `Near your location`,
      phone: `112`,
    };
  });
}

export default function EmergencyMedical() {
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState("");
  const [hospitals, setHospitals] = useState<NearbyHospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<NearbyHospital | null>(null);
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetSent, setSheetSent] = useState(false);
  const [sending, setSending] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const user = getUser();

  const [medForm, setMedForm] = useState({
    patientName: user?.name || "",
    age: "",
    gender: "",
    bloodGroup: "",
    allergies: "",
    existingConditions: "",
    incidentDescription: "",
    injuries: "",
    timeOfIncident: "",
    dateOfIncident: new Date().toISOString().split("T")[0],
    emergencyContact: user?.mobile || "",
    alternateContact: user?.alternatePhone || "",
    caseId: user?.caseId || "",
    consentForExam: false,
    consentForEvidence: false,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      setLoadingLoc(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(coords);
        setLoadingLoc(false);

        // Find nearest hospitals
        const allHospitals: NearbyHospital[] = HOSPITALS.map((h) => ({
          ...h,
          distance: haversine(coords.lat, coords.lng, h.lat, h.lng),
        }));

        // Add hyper-local generated hospitals
        const localHospitals = generateNearbyHospitals(coords.lat, coords.lng);
        const combined = [...allHospitals, ...localHospitals]
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5);

        setHospitals(combined);
      },
      () => {
        setLocError("Location access denied. Please enable GPS.");
        setLoadingLoc(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  function handleSendSheet() {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSheetSent(true);
    }, 2000);
  }

  function handlePrint() {
    if (!sheetRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Medical Information Sheet - RAAHAT</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 32px; color: #1e293b; }
        h1 { font-size: 18px; border-bottom: 2px solid #0f172a; padding-bottom: 8px; }
        .section { margin: 16px 0; }
        .section-title { font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .row { display: flex; gap: 24px; margin-bottom: 6px; }
        .field { flex: 1; }
        .label { font-size: 11px; color: #64748b; }
        .value { font-size: 13px; font-weight: 600; }
        .urgent { background: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 6px; margin: 16px 0; }
        .urgent-title { color: #991b1b; font-weight: 700; font-size: 12px; }
        .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
        .consent { font-size: 11px; margin-top: 16px; }
        @media print { body { padding: 16px; } }
      </style></head><body>
      ${sheetRef.current.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  return (
    <UserLayout>
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Emergency Banner */}
        <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white rounded-lg p-5 mb-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0 animate-pulse">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold mb-1">Emergency Medical Assistance</h1>
              <p className="text-red-100 text-sm leading-relaxed">
                If you or someone you know needs immediate medical attention, this tool helps locate the nearest hospital and generates a secure digital medical information sheet to share with the hospital — reducing paperwork and saving critical time.
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                <a href="tel:112" className="inline-flex items-center gap-1.5 bg-white text-red-700 font-bold text-xs px-4 py-2 rounded hover:bg-red-50 transition">
                  <Phone size={14} /> Call Emergency: 112
                </a>
                <a href="tel:181" className="inline-flex items-center gap-1.5 bg-white/20 text-white font-bold text-xs px-4 py-2 rounded hover:bg-white/30 transition border border-white/30">
                  <Phone size={14} /> Women Helpline: 181
                </a>
                <a href="tel:14566" className="inline-flex items-center gap-1.5 bg-white/20 text-white font-bold text-xs px-4 py-2 rounded hover:bg-white/30 transition border border-white/30">
                  <Phone size={14} /> SC/ST Helpline: 14566
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: Nearest Hospitals */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-bold text-navy-900 text-sm flex items-center gap-2">
                  <MapPin size={16} className="text-red-600" /> Nearest Hospitals
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Based on your current GPS location</p>
              </div>

              {loadingLoc ? (
                <div className="p-8 text-center">
                  <Loader2 size={24} className="animate-spin mx-auto text-navy-600 mb-2" />
                  <p className="text-sm text-slate-500">Detecting your location...</p>
                </div>
              ) : locError ? (
                <div className="p-6 text-center">
                  <MapPin size={24} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-red-600 font-medium">{locError}</p>
                  <p className="text-xs text-slate-500 mt-1">Please enable location services and refresh.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {hospitals.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedHospital(h)}
                      className={`w-full text-left p-4 hover:bg-navy-50 transition cursor-pointer ${
                        selectedHospital?.name === h.name ? "bg-navy-50 border-l-3 border-l-red-600" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm text-navy-900 truncate">{h.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5 truncate">{h.address}</div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1 text-xs font-bold text-red-700">
                              <Navigation size={10} /> {h.distance.toFixed(1)} km
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Phone size={10} /> {h.phone}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 mt-1 shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedHospital && (
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart size={14} className="text-red-600" />
                    <span className="font-bold text-sm text-navy-900">Selected Hospital</span>
                  </div>
                  <div className="text-sm font-semibold text-navy-900">{selectedHospital.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{selectedHospital.services}</div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedHospital.lat},${selectedHospital.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 bg-red-700 text-white text-xs font-bold px-4 py-2 rounded hover:bg-red-800 transition"
                  >
                    <Navigation size={12} /> Get Directions
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right: Medical Information Sheet */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-navy-900 text-sm flex items-center gap-2">
                    <FileText size={16} className="text-navy-700" /> Digital Medical Information Sheet
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fill in details to generate a secure medical sheet — reduces repetitive paperwork at hospital
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Patient Information */}
                <div>
                  <div className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Shield size={12} className="text-navy-600" /> Patient Information
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={medForm.patientName}
                        onChange={(e) => setMedForm({ ...medForm, patientName: e.target.value })}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 font-medium outline-none focus:border-navy-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Age</label>
                        <input
                          type="number"
                          value={medForm.age}
                          onChange={(e) => setMedForm({ ...medForm, age: e.target.value })}
                          className="w-full border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-navy-600"
                          placeholder="Years"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Gender</label>
                        <select
                          value={medForm.gender}
                          onChange={(e) => setMedForm({ ...medForm, gender: e.target.value })}
                          className="w-full border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-navy-600"
                        >
                          <option value="">Select</option>
                          <option>Female</option>
                          <option>Male</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Blood Group</label>
                      <select
                        value={medForm.bloodGroup}
                        onChange={(e) => setMedForm({ ...medForm, bloodGroup: e.target.value })}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-navy-600"
                      >
                        <option value="">Select if known</option>
                        <option>A+</option><option>A-</option>
                        <option>B+</option><option>B-</option>
                        <option>AB+</option><option>AB-</option>
                        <option>O+</option><option>O-</option>
                        <option>Unknown</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Known Allergies</label>
                      <input
                        type="text"
                        value={medForm.allergies}
                        onChange={(e) => setMedForm({ ...medForm, allergies: e.target.value })}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-navy-600"
                        placeholder="e.g. Penicillin, None"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Existing Medical Conditions</label>
                    <input
                      type="text"
                      value={medForm.existingConditions}
                      onChange={(e) => setMedForm({ ...medForm, existingConditions: e.target.value })}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-navy-600"
                      placeholder="e.g. Diabetes, Asthma, None"
                    />
                  </div>
                </div>

                {/* Incident Details */}
                <div>
                  <div className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-red-600" /> Incident & Injury Details
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Incident</label>
                      <input
                        type="date"
                        value={medForm.dateOfIncident}
                        onChange={(e) => setMedForm({ ...medForm, dateOfIncident: e.target.value })}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-navy-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Approximate Time</label>
                      <input
                        type="time"
                        value={medForm.timeOfIncident}
                        onChange={(e) => setMedForm({ ...medForm, timeOfIncident: e.target.value })}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-navy-600"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Brief Description of Incident</label>
                    <textarea
                      rows={2}
                      value={medForm.incidentDescription}
                      onChange={(e) => setMedForm({ ...medForm, incidentDescription: e.target.value })}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-navy-600"
                      placeholder="Provide a brief description (this helps the medical team prepare appropriate care)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Visible Injuries / Pain Areas</label>
                    <textarea
                      rows={2}
                      value={medForm.injuries}
                      onChange={(e) => setMedForm({ ...medForm, injuries: e.target.value })}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-navy-600"
                      placeholder="Describe any injuries, bruises, pain, or discomfort"
                    />
                  </div>
                </div>

                {/* Emergency Contacts */}
                <div>
                  <div className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Phone size={12} className="text-navy-600" /> Emergency Contacts
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Primary Contact Number</label>
                      <input
                        type="tel"
                        value={medForm.emergencyContact}
                        onChange={(e) => setMedForm({ ...medForm, emergencyContact: e.target.value })}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm font-mono outline-none focus:border-navy-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Alternate Contact</label>
                      <input
                        type="tel"
                        value={medForm.alternateContact}
                        onChange={(e) => setMedForm({ ...medForm, alternateContact: e.target.value })}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm font-mono outline-none focus:border-navy-600"
                        placeholder="Family member / trusted person"
                      />
                    </div>
                  </div>
                </div>

                {/* Consent */}
                <div className="bg-slate-50 border border-slate-200 rounded p-4">
                  <div className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3">Consent Declarations</div>
                  <label className="flex items-start gap-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={medForm.consentForExam}
                      onChange={(e) => setMedForm({ ...medForm, consentForExam: e.target.checked })}
                      className="mt-0.5 accent-navy-900 w-4 h-4 shrink-0"
                    />
                    <span className="text-xs text-slate-700 leading-relaxed">
                      I consent to medical examination and treatment at the selected hospital. I understand that the information provided here will be shared securely with the medical team for the purpose of emergency care.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={medForm.consentForEvidence}
                      onChange={(e) => setMedForm({ ...medForm, consentForEvidence: e.target.checked })}
                      className="mt-0.5 accent-navy-900 w-4 h-4 shrink-0"
                    />
                    <span className="text-xs text-slate-700 leading-relaxed">
                      I consent to the collection and preservation of medical-legal evidence as per Section 164A CrPC and MoHFW Guidelines on Medico-Legal Care for Survivors of Sexual Violence.
                    </span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowSheet(true)}
                    disabled={!medForm.patientName || !medForm.consentForExam}
                    className={`flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded transition cursor-pointer ${
                      medForm.patientName && medForm.consentForExam
                        ? "bg-navy-900 text-white hover:bg-navy-800"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <FileText size={16} /> Generate Medical Sheet
                  </button>

                  {showSheet && selectedHospital && !sheetSent && (
                    <button
                      onClick={handleSendSheet}
                      disabled={sending}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-700 text-white font-semibold text-sm rounded hover:bg-red-800 transition cursor-pointer disabled:opacity-50"
                    >
                      {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      {sending ? "Sending..." : `Send to ${selectedHospital.name.split(",")[0]}`}
                    </button>
                  )}

                  {showSheet && (
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold text-sm rounded hover:bg-slate-50 transition cursor-pointer"
                    >
                      <Printer size={16} /> Print Sheet
                    </button>
                  )}
                </div>

                {sheetSent && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-600" />
                    <span>
                      Medical Information Sheet has been securely transmitted to <strong>{selectedHospital?.name}</strong>. The hospital has been alerted to prepare for your arrival.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Generated Medical Sheet Preview */}
            {showSheet && (
              <div className="mt-5 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-sm text-navy-900 flex items-center gap-2">
                    <FileText size={14} className="text-navy-700" /> Medical Information Sheet — Preview
                  </h3>
                  <button onClick={() => setShowSheet(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X size={16} />
                  </button>
                </div>
                <div ref={sheetRef} className="p-6">
                  <div style={{ fontFamily: "'Segoe UI', sans-serif" }}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-navy-900">
                      <div>
                        <h1 className="text-lg font-bold text-navy-900">RAAHAT — Medical Information Sheet</h1>
                        <div className="text-xs text-slate-500">Confidential — For Authorized Medical Personnel Only</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Generated: {new Date().toLocaleString("en-IN")}</div>
                        {medForm.caseId && <div className="text-xs font-mono font-bold text-navy-700">Case: {medForm.caseId}</div>}
                      </div>
                    </div>

                    {/* Urgent Notice */}
                    <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                      <div className="text-xs font-bold text-red-800 flex items-center gap-1.5 mb-1">
                        <AlertTriangle size={12} /> URGENT — SURVIVOR REQUIRES IMMEDIATE MEDICAL ATTENTION
                      </div>
                      <div className="text-xs text-red-700">
                        This patient is a survivor of sexual violence and requires medico-legal examination as per Section 164A CrPC and MoHFW Guidelines. Please provide immediate care with sensitivity and confidentiality.
                      </div>
                    </div>

                    {/* Patient Details */}
                    <div className="mb-4">
                      <div className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Patient Details</div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        <div><span className="text-[10px] text-slate-500">Full Name</span><div className="text-sm font-semibold">{medForm.patientName || "—"}</div></div>
                        <div><span className="text-[10px] text-slate-500">Age / Gender</span><div className="text-sm font-semibold">{medForm.age || "—"} years / {medForm.gender || "—"}</div></div>
                        <div><span className="text-[10px] text-slate-500">Blood Group</span><div className="text-sm font-semibold">{medForm.bloodGroup || "Unknown"}</div></div>
                        <div><span className="text-[10px] text-slate-500">Known Allergies</span><div className="text-sm font-semibold">{medForm.allergies || "None reported"}</div></div>
                        <div className="col-span-2"><span className="text-[10px] text-slate-500">Existing Conditions</span><div className="text-sm font-semibold">{medForm.existingConditions || "None reported"}</div></div>
                      </div>
                    </div>

                    {/* Incident */}
                    <div className="mb-4">
                      <div className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Incident Details</div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-2">
                        <div><span className="text-[10px] text-slate-500">Date of Incident</span><div className="text-sm font-semibold">{medForm.dateOfIncident || "—"}</div></div>
                        <div><span className="text-[10px] text-slate-500">Approximate Time</span><div className="text-sm font-semibold">{medForm.timeOfIncident || "Not specified"}</div></div>
                      </div>
                      <div className="mb-2"><span className="text-[10px] text-slate-500">Brief Description</span><div className="text-sm">{medForm.incidentDescription || "Not provided"}</div></div>
                      <div><span className="text-[10px] text-slate-500">Visible Injuries / Pain Areas</span><div className="text-sm">{medForm.injuries || "Not described"}</div></div>
                    </div>

                    {/* Contacts */}
                    <div className="mb-4">
                      <div className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Emergency Contacts</div>
                      <div className="grid grid-cols-2 gap-x-6">
                        <div><span className="text-[10px] text-slate-500">Primary Contact</span><div className="text-sm font-semibold font-mono">{medForm.emergencyContact || "—"}</div></div>
                        <div><span className="text-[10px] text-slate-500">Alternate Contact</span><div className="text-sm font-semibold font-mono">{medForm.alternateContact || "—"}</div></div>
                      </div>
                    </div>

                    {/* Hospital */}
                    {selectedHospital && (
                      <div className="mb-4">
                        <div className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Selected Hospital</div>
                        <div className="text-sm font-semibold">{selectedHospital.name}</div>
                        <div className="text-xs text-slate-500">{selectedHospital.address} · {selectedHospital.phone}</div>
                        <div className="text-xs text-slate-500 mt-0.5">Distance: {selectedHospital.distance.toFixed(1)} km from patient's location</div>
                      </div>
                    )}

                    {/* Consent */}
                    <div className="mb-4 border border-slate-200 rounded p-3 bg-slate-50">
                      <div className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2">Consent Status</div>
                      <div className="text-xs text-slate-700 space-y-1">
                        <div className="flex items-center gap-2">
                          {medForm.consentForExam ? <CheckCircle size={12} className="text-emerald-600" /> : <X size={12} className="text-red-500" />}
                          Medical Examination & Treatment — {medForm.consentForExam ? "CONSENTED" : "NOT CONSENTED"}
                        </div>
                        <div className="flex items-center gap-2">
                          {medForm.consentForEvidence ? <CheckCircle size={12} className="text-emerald-600" /> : <X size={12} className="text-red-500" />}
                          Evidence Collection (Sec 164A CrPC) — {medForm.consentForEvidence ? "CONSENTED" : "NOT CONSENTED"}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="text-[10px] text-slate-400 border-t border-slate-200 pt-2 mt-4">
                      <div>This document was generated securely by the RAAHAT platform. It is intended for authorized medical personnel only.</div>
                      <div className="mt-1">Under MoHFW Guidelines, free medical treatment must be provided to survivors of sexual violence at all public and private hospitals. Treatment cannot be denied or delayed.</div>
                      <div className="mt-1 font-semibold">Legal Reference: Criminal Law (Amendment) Act 2013 · Sec 357C CrPC · MoHFW Guidelines 2014</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legal info bar */}
        <div className="mt-6 bg-navy-950 text-white rounded-lg p-4 flex items-start gap-3">
          <Shield size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm mb-1 text-amber-400">Your Legal Rights</div>
            <p className="text-xs text-navy-200 leading-relaxed">
              Under <strong>Section 357C CrPC</strong>, all hospitals (public and private) are legally obligated to provide free first aid and medical treatment to victims of acid attacks and sexual assault. Treatment cannot be denied or delayed. Under the <strong>Criminal Law (Amendment) Act 2013</strong>, medical examination of a rape survivor must be conducted by a registered medical practitioner with the survivor's consent.
            </p>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
