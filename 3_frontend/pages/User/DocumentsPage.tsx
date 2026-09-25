import { useState, useEffect } from "react";
import UserLayout from "../../components/layout/UserLayout";
import { Lock, Shield, FileText, Upload, CheckCircle, Info, Calendar } from "lucide-react";
import { getUser } from "../../utils/api";
import { getStoredAssessment } from "../../utils/assessmentStore";
import { StatusBadge } from "../../components/common/Badge";

export default function DocumentsPage() {
  const user = getUser();
  const [caseId, setCaseId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<
    { name: string; status: string; access: string; downloaded: boolean }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const user = getUser();
    if (user?.caseId) {
      setCaseId(user.caseId);
      // Try API first
      fetch(`/api/cases/${user.caseId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok && data.data) {
            const docs = [
              { name: "Caste / Identity Certificate", status: "Uploaded", access: "Restricted (Officer Only)", downloaded: false },
              { name: "Case Registration Form", status: "Issued", access: "Citizen + Officer", downloaded: false },
              { name: "Live AI Assessment Report", status: "Generated", access: "Citizen + Officer", downloaded: false },
              { name: "Counselling & Support Referral", status: data.data.assigned_officer ? "Issued" : "Pending", access: "Citizen + Support Team", downloaded: false },
            ];
            setDocuments(docs);
          } else {
            // Fallback to stored assessment
            const stored = getStoredAssessment();
            if (stored) {
              setDocuments([
                { name: "Caste / Identity Certificate", status: "Uploaded", access: "Restricted (Officer Only)", downloaded: false },
                { name: "Case Registration Form", status: "Issued", access: "Citizen + Officer", downloaded: false },
                { name: "Live AI Assessment Report", status: "Generated", access: "Citizen + Officer", downloaded: false },
                { name: "Counselling & Support Referral", status: "Pending", access: "Citizen + Support Team", downloaded: false },
              ]);
            }
          }
          setLoading(false);
        })
        .catch(() => {
          // Fallback to stored assessment
          const stored = getStoredAssessment();
          if (stored) {
            setDocuments([
              { name: "Caste / Identity Certificate", status: "Uploaded", access: "Restricted (Officer Only)", downloaded: false },
              { name: "Case Registration Form", status: "Issued", access: "Citizen + Officer", downloaded: false },
              { name: "Live AI Assessment Report", status: "Generated", access: "Citizen + Officer", downloaded: false },
              { name: "Counselling & Support Referral", status: "Pending", access: "Citizen + Support Team", downloaded: false },
            ]);
          }
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  function handleDownload(name: string) {
    setMsg(`Downloading ${name}...`);
    setTimeout(() => {
      setMsg(`Downloaded ${name}`);
    }, 500);
  }

  if (loading) {
    return (
      <UserLayout>
        <div className="max-w-3xl mx-auto px-6 py-20 text-center text-slate-400">
          Loading case documents...
        </div>
      </UserLayout>
    );
  }

  if (!caseId) {
    return (
      <UserLayout>
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <AlertCircle size={32} className="mx-auto mb-2 text-slate-400" />
          <h2 className="text-lg font-semibold text-navy-900 mb-1">No Case Found</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Complete a voice or chat assessment to register a case and generate documents.
          </p>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="text-xs font-bold text-navy-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <FileText size={12} /> Case Documents
          </div>
          <h1 className="text-xl font-bold text-navy-900">My Documents</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">Case ID: {caseId}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-navy-900 text-sm">Protected Case Documents</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Document</th>
                <th className="text-left px-5 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Access Level</th>
                <th className="text-left px-5 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-navy-900 text-xs sm:text-sm">{d.name}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{d.access}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">
                    <button onClick={() => handleDownload(d.name)} className="text-navy-600 hover:text-navy-800 text-xs underline">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </UserLayout>
  );
}