import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RaahatLogo from "../../components/common/RaahatLogo";
import { Shield, Upload, CheckCircle, AlertCircle, Eye, EyeOff, Lock, ChevronLeft } from "lucide-react";
import { api, setToken, setUser } from "../../utils/api";

const STATES = ["Maharashtra", "Uttar Pradesh", "Madhya Pradesh", "Rajasthan", "Bihar", "Gujarat", "Karnataka", "Tamil Nadu", "Andhra Pradesh", "West Bengal", "Odisha", "Punjab"];
const LANGUAGES = ["English", "Hindi", "Marathi", "Bengali", "Tamil", "Telugu", "Kannada", "Gujarati", "Punjabi", "Malayalam", "Odia"];

export default function RegisterPage() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [showPwd, setShowPwd] = useState(false);
  const [verStatus, setVerStatus] = useState<"none" | "pending" | "verified">("none");
  const [consents, setConsents] = useState({ privacy: false, ai: false, medical: false });
  const [form, setForm] = useState({ name: "", mobile: "", email: "", dob: "", state: "", district: "", lang: "English", address: "", pwd: "", cpwd: "", category: "SC" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const allConsents = consents.privacy && consents.ai && consents.medical;

  function handleFile() {
    setVerStatus("pending");
    setTimeout(() => setVerStatus("verified"), 1500);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (form.pwd !== form.cpwd) {
      setError("Passwords do not match.");
      setLoading(false);
      setStep(1);
      return;
    }

    if (form.pwd.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      setStep(1);
      return;
    }

    const payload = {
      name: form.name.trim(),
      mobile: form.mobile.trim() || undefined,
      email: form.email.trim() || undefined,
      password: form.pwd,
      dob: form.dob,
      state: form.state,
      district: form.district.trim(),
      category: form.category,
      language: form.lang,
      address: form.address.trim(),
    };

    const res = await api.post<{ token: string; user: any }>("/auth/register", payload);
    setLoading(false);

    if (res.ok && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
      nav("/dashboard");
    } else {
      setError(res.error || "Registration failed. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <RaahatLogo size={28} />
          <button onClick={() => nav("/")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-800">
            <ChevronLeft size={14} /> Back to Home
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step >= s ? "bg-navy-900 border-navy-900 text-white" : "border-slate-300 text-slate-400"}`}>{s}</div>
              {s < 3 && <div className={`h-0.5 w-16 ${step > s ? "bg-navy-900" : "bg-slate-200"}`} />}
            </div>
          ))}
          <div className="ml-2 text-sm text-slate-500">
            {step === 1 && "Account Details"}{step === 2 && "Eligibility Verification"}{step === 3 && "Consent & Review"}
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded shadow-sm">
          <div className="px-8 py-6 border-b border-slate-200">
            <h1 className="text-xl font-bold text-navy-900">Create Your RAAHAT Account</h1>
            <p className="text-sm text-slate-500 mt-1">Your information is handled securely and confidentially.</p>
          </div>

          {step === 1 && (
            <form className="px-8 py-6 space-y-5" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
              <div className="grid md:grid-cols-2 gap-5">
                <Field label="Full Name *" name="name" value={form.name} onChange={v => setForm({...form, name: v})} placeholder="As per official records" />
                <Field label="Mobile Number *" name="mobile" value={form.mobile} onChange={v => setForm({...form, mobile: v})} placeholder="+91 XXXXX XXXXX" type="tel" />
                <Field label="Email Address" name="email" value={form.email} onChange={v => setForm({...form, email: v})} placeholder="Optional" type="email" required={false} />
                <Field label="Date of Birth *" name="dob" value={form.dob} onChange={v => setForm({...form, dob: v})} type="date" />
                <div>
                  <label className="block text-sm font-semibold text-navy-900 mb-1.5">State *</label>
                  <select value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-700 outline-none focus:border-navy-600">
                    <option value="">Select State</option>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <Field label="District *" name="district" value={form.district} onChange={v => setForm({...form, district: v})} placeholder="Enter district name" />
                <div>
                  <label className="block text-sm font-semibold text-navy-900 mb-1.5">Preferred Language *</label>
                  <select value={form.lang} onChange={e => setForm({...form, lang: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-700 outline-none focus:border-navy-600">
                    {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <Field label="Address *" name="address" value={form.address} onChange={v => setForm({...form, address: v})} placeholder="Full residential address" />
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-navy-900 mb-1.5">Password *</label>
                  <div className="relative">
                    <input type={showPwd ? "text" : "password"} value={form.pwd} onChange={e => setForm({...form, pwd: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-navy-600 pr-9" placeholder="Min. 8 characters" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-2.5 text-slate-400">
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <Field label="Confirm Password *" name="cpwd" value={form.cpwd} onChange={v => setForm({...form, cpwd: v})} type="password" placeholder="Re-enter password" />
              </div>
              <div className="pt-2 flex justify-end">
                <button type="submit" className="px-6 py-2.5 bg-navy-900 text-white font-semibold text-sm rounded hover:bg-navy-800 transition-all">Next: Eligibility Verification</button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="px-8 py-6">
              <div className="bg-navy-50 border border-navy-200 rounded p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Lock size={16} className="text-navy-700 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-navy-900 text-sm mb-1">Eligibility Verification</div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Your caste certificate is used only for eligibility verification and is accessible only to authorized personnel. It will not be displayed on ordinary user-facing screens.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-navy-900 mb-1.5">Social Category *</label>
                  <div className="flex gap-4">
                    {["SC", "ST", "OBC", "General"].map(c => (
                      <label key={c} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="category" value={c} checked={form.category === c} onChange={e => setForm({...form, category: e.target.value})} className="accent-navy-900" />
                        <span className="text-sm font-medium text-slate-700">{c}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy-900 mb-1.5">Upload Caste Certificate</label>
                  <div className="border-2 border-dashed border-slate-300 rounded p-6 text-center cursor-pointer hover:border-navy-400 hover:bg-navy-50 transition-all" onClick={handleFile}>
                    <Upload size={24} className="mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG — Max 5 MB</p>
                  </div>
                  {verStatus === "pending" && (
                    <div className="flex items-center gap-2 mt-2 text-amber-700 text-sm animate-pulse">
                      <AlertCircle size={14} /> Verification Pending
                    </div>
                  )}
                  {verStatus === "verified" && (
                    <div className="flex items-center gap-2 mt-2 text-safe-700 text-sm font-semibold">
                      <CheckCircle size={14} /> Document Uploaded — Verification in Progress
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(1)} className="px-5 py-2.5 border border-slate-300 text-slate-600 font-semibold text-sm rounded hover:bg-slate-50 transition-all">Back</button>
                <button onClick={() => setStep(3)} className="px-6 py-2.5 bg-navy-900 text-white font-semibold text-sm rounded hover:bg-navy-800 transition-all">Next: Consent</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form className="px-8 py-6" onSubmit={handleSubmit}>
              <h3 className="font-bold text-navy-900 mb-4">Consent & Declarations</h3>
              <div className="space-y-4">
                <ConsentItem
                  checked={consents.privacy}
                  onChange={v => setConsents({...consents, privacy: v})}
                  label="I agree to the Privacy Policy and Terms of Service of the RAAHAT platform."
                />
                <ConsentItem
                  checked={consents.ai}
                  onChange={v => setConsents({...consents, ai: v})}
                  label="I consent to AI-assisted analysis of my voice and text responses for stress and vulnerability assessment purposes."
                />
                <ConsentItem
                  checked={consents.medical}
                  onChange={v => setConsents({...consents, medical: v})}
                  label="I understand that the AI assessment is an indicative tool and is not a medical diagnosis or professional mental health assessment."
                />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded p-4 mt-6 text-xs text-slate-500">
                <Shield size={12} className="inline mr-1.5 text-navy-600" />
                Your data is encrypted and protected under applicable data protection laws. You may withdraw consent at any time.
              </div>
              <div className="flex justify-between mt-6">
                <button type="button" onClick={() => setStep(2)} className="px-5 py-2.5 border border-slate-300 text-slate-600 font-semibold text-sm rounded hover:bg-slate-50 transition-all">Back</button>
                <button type="submit" disabled={!allConsents || loading} className={`px-6 py-2.5 font-semibold text-sm rounded transition-all ${allConsents && !loading ? "bg-navy-900 text-white hover:bg-navy-800" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{" "}
          <button onClick={() => nav("/login")} className="text-navy-700 font-semibold hover:underline">Log in here</button>
        </p>
      </main>
    </div>
  );
}

function Field({ label, name, value, onChange, placeholder = "", type = "text", required = true }: {
  label: string; name: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-navy-900 mb-1.5">{label}</label>
      <input type={type} name={name} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-700 outline-none focus:border-navy-600 focus:ring-1 focus:ring-navy-200 transition-all placeholder:text-slate-400" />
    </div>
  );
}

function ConsentItem({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="mt-0.5 accent-navy-900 w-4 h-4 shrink-0" />
      <span className="text-sm text-slate-700 leading-relaxed">{label}</span>
    </label>
  );
}
