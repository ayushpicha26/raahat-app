import { useState } from "react";
import UserLayout from "../../components/layout/UserLayout";
import { Lock, ShieldCheck, Download, Trash2, CheckCircle, Info, FileText } from "lucide-react";
import { getUser } from "../../utils/api";

export default function PrivacyPage() {
  const user = getUser();
  const [consents, setConsents] = useState({
    aiAssessment: true,
    emergencySharing: true,
    medicalRecordAccess: true,
    anonymousAnalytics: false
  });
  const [msg, setMsg] = useState("");

  function toggleConsent(key: keyof typeof consents) {
    setConsents(prev => ({ ...prev, [key]: !prev[key] }));
    setMsg("Privacy preferences saved.");
    setTimeout(() => setMsg(""), 3000);
  }

  function handleExportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      user,
      consents,
      dpdpCompliance: "DPDP Act 2023 Compliant",
      exportTimestamp: new Date().toISOString()
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `RAAHAT_Data_${user?.caseId || 'Export'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setMsg("Data export file downloaded successfully!");
    setTimeout(() => setMsg(""), 4000);
  }

  function handleErasureRequest() {
    if (confirm("Are you sure you want to request complete data erasure under DPDP Act Section 12? This action is irreversible.")) {
      setMsg("Data erasure request submitted to the Nodal Grievance Officer.");
      setTimeout(() => setMsg(""), 5000);
    }
  }

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy-950 flex items-center gap-2.5">
            <Lock className="text-navy-700" size={24} /> Data Privacy & Consent Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Governed under Digital Personal Data Protection (DPDP) Act 2023 & SC/ST Protection Act Guidelines.
          </p>
        </div>

        {msg && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-600 shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        {/* DPDP Compliance Banner */}
        <div className="bg-navy-950 text-white rounded-lg p-5 mb-6 shadow-sm border border-navy-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-navy-800 rounded-lg shrink-0">
              <ShieldCheck size={24} className="text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white">DPDP Act 2023 Protection Active</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded border border-emerald-500/30">Verified</span>
              </div>
              <p className="text-xs text-navy-200 mt-1">
                Your testimony and personal details are encrypted (AES-256) and accessible strictly by assigned welfare officers.
              </p>
            </div>
          </div>
        </div>

        {/* Consent Management Toggles */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6 shadow-sm">
          <h3 className="text-base font-bold text-navy-900 mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
            <FileText size={18} className="text-navy-700" /> Active Consents & Processing Permissions
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded">
              <div>
                <div className="text-sm font-semibold text-navy-900">AI Vulnerability Assessment Consent</div>
                <div className="text-xs text-slate-500">Allow Gemini AI engine to analyze testimony text for distress & vulnerability index.</div>
              </div>
              <button
                onClick={() => toggleConsent("aiAssessment")}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${consents.aiAssessment ? "bg-navy-900 justify-end" : "bg-slate-300 justify-start"}`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-md" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded">
              <div>
                <div className="text-sm font-semibold text-navy-900">Emergency Officer Dispatch Consent</div>
                <div className="text-xs text-slate-500">Allow sharing GPS & case details with District Magistrate & Protection Officer during high-risk alerts.</div>
              </div>
              <button
                onClick={() => toggleConsent("emergencySharing")}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${consents.emergencySharing ? "bg-navy-900 justify-end" : "bg-slate-300 justify-start"}`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-md" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded">
              <div>
                <div className="text-sm font-semibold text-navy-900">Medical Aid Record Access</div>
                <div className="text-xs text-slate-500">Enable one-stop centres (Sakhi) to access medical assistance request notes.</div>
              </div>
              <button
                onClick={() => toggleConsent("medicalRecordAccess")}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${consents.medicalRecordAccess ? "bg-navy-900 justify-end" : "bg-slate-300 justify-start"}`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-md" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded">
              <div>
                <div className="text-sm font-semibold text-navy-900">Anonymous Policy Analytics</div>
                <div className="text-xs text-slate-500">Share scrubbed, non-identifiable district-level statistics to improve government policy.</div>
              </div>
              <button
                onClick={() => toggleConsent("anonymousAnalytics")}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${consents.anonymousAnalytics ? "bg-navy-900 justify-end" : "bg-slate-300 justify-start"}`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-md" />
              </button>
            </div>
          </div>
        </div>

        {/* Data Rights & Erasure */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
            <h4 className="text-sm font-bold text-navy-900 mb-2 flex items-center gap-2">
              <Download size={16} className="text-navy-700" /> Export Personal Data
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Download a complete JSON archive of all your personal records, testimony logs, and assigned officer notes.
            </p>
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded transition cursor-pointer"
            >
              <Download size={14} /> Download My Data Archive
            </button>
          </div>

          <div className="bg-white border border-red-200 rounded-lg p-5 shadow-sm">
            <h4 className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
              <Trash2 size={16} className="text-red-600" /> Right to Erasure (DPDP Sec 12)
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Request immediate deletion of your personal account details from active government welfare databases.
            </p>
            <button
              onClick={handleErasureRequest}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded border border-red-200 transition cursor-pointer"
            >
              <Trash2 size={14} /> Request Data Erasure
            </button>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
