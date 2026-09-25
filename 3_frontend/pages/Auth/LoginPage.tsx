import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RaahatLogo from "../../components/common/RaahatLogo";
import { Shield, Lock, ChevronLeft, AlertCircle } from "lucide-react";
import { api, setToken, setUser } from "../../utils/api";

export default function LoginPage() {
  const nav = useNavigate();
  const [tab, setTab] = useState<"user" | "admin">("user");
  const [mode, setMode] = useState<"pwd" | "otp">("pwd");
  const [form, setForm] = useState({ id: "", pwd: "", otp: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const loginId = form.id.trim();
    const password = mode === "pwd" || tab === "admin" ? form.pwd : form.otp;

    if (!loginId || !password) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    const response = await api.post<{ token: string; user: any }>("/auth/login", {
      id: loginId,
      password,
      role: tab,
      isOtp: mode === "otp" && tab === "user"
    });

    setLoading(false);

    if (response.ok && response.data) {
      setToken(response.data.token);
      setUser(response.data.user);
      
      if (tab === "admin") {
        nav("/admin");
      } else {
        nav("/dashboard");
      }
    } else {
      setError(response.error || "Login failed. Please check your credentials.");
    }
  }

  async function handleSendOtp() {
    setError("");
    if (!form.id.trim()) {
      setError("Please enter your mobile number to receive an OTP.");
      return;
    }
    setLoading(true);
    const res = await api.post<{ sent: boolean; message: string }>("/auth/send-otp", { mobile: form.id.trim() });
    setLoading(false);
    if (res.ok) {
      setOtpSent(true);
    } else {
      setError(res.error || "Failed to send OTP.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <RaahatLogo size={28} />
          <button onClick={() => nav("/")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-800">
            <ChevronLeft size={14} /> Back to Home
          </button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Tab selector */}
          <div className="flex mb-1">
            <button onClick={() => { setTab("user"); setError(""); }} className={`flex-1 py-2.5 text-sm font-semibold border-b-2 transition-colors ${tab === "user" ? "border-navy-900 text-navy-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
              Complainant / User Login
            </button>
            <button onClick={() => { setTab("admin"); setError(""); }} className={`flex-1 py-2.5 text-sm font-semibold border-b-2 transition-colors ${tab === "admin" ? "border-navy-900 text-navy-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
              Authorized Official
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded shadow-sm">
            {tab === "admin" && (
              <div className="bg-navy-950 text-white px-6 py-3 rounded-t flex items-center gap-2 text-xs font-semibold">
                <Lock size={12} />
                AUTHORIZED PERSONNEL ONLY — RESTRICTED ACCESS
              </div>
            )}
            <div className="px-8 py-8">
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 bg-navy-50 rounded-full flex items-center justify-center">
                  {tab === "admin" ? <Lock size={24} className="text-navy-800" /> : <Shield size={24} className="text-navy-800" />}
                </div>
              </div>
              <h1 className="text-xl font-bold text-navy-900 text-center mb-1">
                {tab === "user" ? "Welcome Back" : "Authorized Official Login"}
              </h1>
              <p className="text-sm text-slate-500 text-center mb-6">
                {tab === "user" ? "Login to access your RAAHAT support account" : "Login to the RAAHAT Administration Portal"}
              </p>

              {tab === "user" && (
                <div className="flex gap-1 bg-slate-100 p-1 rounded mb-5">
                  <button onClick={() => { setMode("pwd"); setError(""); }} className={`flex-1 py-1.5 text-xs font-semibold rounded ${mode === "pwd" ? "bg-white text-navy-900 shadow-sm" : "text-slate-500"}`}>Password</button>
                  <button onClick={() => { setMode("otp"); setError(""); }} className={`flex-1 py-1.5 text-xs font-semibold rounded ${mode === "otp" ? "bg-white text-navy-900 shadow-sm" : "text-slate-500"}`}>Login with OTP</button>
                </div>
              )}

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded flex items-start gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-navy-900 mb-1.5">
                    {tab === "admin" ? "Official ID" : "Mobile Number or Email"}
                  </label>
                  <input type="text" value={form.id} onChange={e => setForm({...form, id: e.target.value})}
                    disabled={loading}
                    className="w-full border border-slate-300 rounded px-3 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-1 focus:ring-navy-200 transition-all"
                    placeholder={tab === "admin" ? "e.g. ADM-MH-001" : "Enter mobile number or email"} />
                </div>
                {(mode === "pwd" || tab === "admin") && (
                  <div>
                    <label className="block text-sm font-semibold text-navy-900 mb-1.5">Password</label>
                    <input type="password" value={form.pwd} onChange={e => setForm({...form, pwd: e.target.value})}
                      disabled={loading}
                      className="w-full border border-slate-300 rounded px-3 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-1 focus:ring-navy-200 transition-all"
                      placeholder="Enter your password (e.g. raahat123 or admin123)" />
                  </div>
                )}
                {mode === "otp" && tab === "user" && (
                  <div>
                    {!otpSent ? (
                      <button type="button" onClick={handleSendOtp}
                        disabled={loading}
                        className="w-full border border-navy-300 text-navy-800 font-semibold text-sm py-2.5 rounded hover:bg-navy-50 transition-all disabled:opacity-50">
                        {loading ? "Sending..." : "Send OTP"}
                      </button>
                    ) : (
                      <div>
                        <label className="block text-sm font-semibold text-navy-900 mb-1.5">Enter OTP</label>
                        <input type="text" value={form.otp} onChange={e => setForm({...form, otp: e.target.value})}
                          disabled={loading}
                          className="w-full border border-slate-300 rounded px-3 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-1 focus:ring-navy-200 font-mono tracking-widest"
                          placeholder="6-digit OTP" maxLength={6} />
                        <p className="text-xs text-slate-500 mt-1.5">OTP sent to your registered mobile number. Check backend console logs.</p>
                      </div>
                    )}
                  </div>
                )}
                {tab === "admin" && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded p-3 text-xs text-amber-700">
                    <AlertCircle size={13} className="mt-0.5 shrink-0" />
                    <span>Unauthorized access attempts are logged and may be subject to legal action.</span>
                  </div>
                )}
                <button type="submit"
                  disabled={loading}
                  className="w-full bg-navy-900 text-white font-semibold py-2.5 rounded hover:bg-navy-800 text-sm transition-all disabled:opacity-50">
                  {loading ? "Processing..." : tab === "admin" ? "Login to Admin Portal" : "Login"}
                </button>
              </form>

              {tab === "user" && (
                <div className="mt-5 flex justify-between text-sm">
                  <button onClick={() => nav("/register")} className="text-navy-700 hover:underline">Forgot Password?</button>
                  <button onClick={() => nav("/register")} className="text-navy-700 hover:underline">Create Account</button>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-5">
            This is a secure government service. Helpline: <strong className="font-mono">14566</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
