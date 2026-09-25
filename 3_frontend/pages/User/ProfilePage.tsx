import { useState, useEffect } from "react";
import UserLayout from "../../components/layout/UserLayout";
import { User, Phone, Mail, MapPin, Shield, Save, CheckCircle, Edit3, Award } from "lucide-react";
import { api, getUser, setUser as setStoredUser } from "../../utils/api";

export default function ProfilePage() {
  const [user, setUserState] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    category: "",
    language: "",
    district: "",
    state: "",
    address: ""
  });

  useEffect(() => {
    const u = getUser();
    if (u) {
      setUserState(u);
      setForm({
        name: u.name || "",
        email: u.email || "",
        mobile: u.mobile || "",
        category: u.category || "General",
        language: u.language || "English",
        district: u.district || "Mumbai",
        state: u.state || "Maharashtra",
        address: u.address || ""
      });
    }
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const updated = { ...user, ...form };
    setUserState(updated);
    setStoredUser(updated);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);

    try {
      await api.put("/users/profile", {
        name: form.name,
        language: form.language,
        address: form.address,
        district: form.district,
      });
    } catch (err) {
      console.warn("Could not sync profile to backend:", err);
    }
  }

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "C";

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-950 flex items-center gap-2.5">
              <User className="text-navy-700" size={24} /> Victim & Citizen Profile
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your personal identity, contact preferences, and confidential victim case records.
            </p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-navy-900 text-white text-sm font-semibold rounded hover:bg-navy-800 transition cursor-pointer"
            >
              <Edit3 size={16} /> Edit Profile
            </button>
          )}
        </div>

        {saved && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-600" />
            <span>Profile details updated successfully!</span>
          </div>
        )}

        {/* Profile Card Header */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6 shadow-sm flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 bg-navy-900 text-white rounded-full flex items-center justify-center font-bold text-3xl shadow-inner border-2 border-navy-700">
            {initial}
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-xl font-bold text-navy-950">{user?.name || "Citizen"}</h2>
              <span className="bg-navy-100 text-navy-800 text-xs px-2.5 py-0.5 rounded font-semibold">
                {user?.category || "Citizen"} Category
              </span>
            </div>
            <div className="text-sm text-slate-500 flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-2">
              <span className="flex items-center gap-1 font-mono text-xs text-navy-700 font-bold bg-slate-100 px-2 py-0.5 rounded">
                <Shield size={12} /> Case ID: {user?.caseId || "RAH-2026-00124"}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={14} className="text-slate-400" /> {user?.district || "Mumbai"}, {user?.state || "Maharashtra"}
              </span>
            </div>
          </div>
        </div>

        {/* Details Form / View */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-base font-bold text-navy-900 mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Award size={18} className="text-navy-700" /> Identity & Registration Details
          </h3>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Legal Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    disabled={!editing}
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded text-sm disabled:bg-slate-50 text-slate-800 font-medium focus:border-navy-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    disabled={!editing}
                    value={form.mobile}
                    onChange={e => setForm({ ...form, mobile: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded text-sm disabled:bg-slate-50 text-slate-800 font-medium focus:border-navy-600 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    disabled={!editing}
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded text-sm disabled:bg-slate-50 text-slate-800 font-medium focus:border-navy-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Category / Community</label>
                <select
                  disabled={!editing}
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm disabled:bg-slate-50 text-slate-800 font-medium focus:border-navy-600 outline-none"
                >
                  <option value="SC">Scheduled Caste (SC)</option>
                  <option value="ST">Scheduled Tribe (ST)</option>
                  <option value="OBC">Other Backward Class (OBC)</option>
                  <option value="General">General / Unreserved</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Preferred Language</label>
                <select
                  disabled={!editing}
                  value={form.language}
                  onChange={e => setForm({ ...form, language: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm disabled:bg-slate-50 text-slate-800 font-medium focus:border-navy-600 outline-none"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Marathi">Marathi (मराठी)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">District</label>
                <input
                  type="text"
                  disabled={!editing}
                  value={form.district}
                  onChange={e => setForm({ ...form, district: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-sm disabled:bg-slate-50 text-slate-800 font-medium focus:border-navy-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Residential Address</label>
              <textarea
                rows={2}
                disabled={!editing}
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="Enter house number, village/locality, landmark..."
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm disabled:bg-slate-50 text-slate-800 font-medium focus:border-navy-600 outline-none"
              />
            </div>

            {editing && (
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 bg-navy-900 text-white text-sm font-semibold rounded hover:bg-navy-800 cursor-pointer"
                >
                  <Save size={16} /> Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </UserLayout>
  );
}
