import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Eye, EyeOff, ArrowRight, KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { changePassword } from "../services/settingsService";

const ChangePasswordRequired = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [error, setError]                     = useState("");
  const [loading, setLoading]                 = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) return setError("New password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");
    setError("");
    setLoading(true);
    try {
      const { data } = await changePassword({ currentPassword, newPassword });
      // Preserve whichever storage this session already lives in (localStorage
      // if "remember me" was checked at login, sessionStorage otherwise).
      const remembered = !!localStorage.getItem("mis_user");
      if (data.token) (remembered ? localStorage : sessionStorage).setItem("mis_token", data.token);
      login(data.user, remembered);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-sm " +
    "bg-slate-50 dark:bg-gray-900/60 text-slate-900 dark:text-gray-100 " +
    "placeholder-gray-400 dark:placeholder-gray-600 " +
    "focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 " +
    "focus:bg-white dark:focus:bg-gray-900 transition-all duration-200";

  const labelClass = "block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em] mb-1.5";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900 px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100/80 dark:border-gray-700 shadow-2xl shadow-violet-100/30 dark:shadow-black/40">

          {/* Gradient header */}
          <div
            className="relative px-8 pt-8 pb-7 overflow-hidden"
            style={{ background: "linear-gradient(135deg,#7c3aed 0%,#6d28d9 55%,#4338ca 100%)" }}
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }} />
            <div className="relative flex justify-center">
              <div className="w-14 h-14 bg-white/20 border border-white/25 rounded-2xl flex items-center justify-center shadow-lg">
                <KeyRound size={26} className="text-white" />
              </div>
            </div>
            <div className="relative text-center mt-4">
              <h1 className="text-xl font-extrabold text-white tracking-tight mb-1">Set a new password</h1>
              <p className="text-violet-200/75 text-sm">
                Your account was created with a temporary password. Choose a new one to continue.
              </p>
            </div>
          </div>

          {/* Form body */}
          <div className="px-8 py-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Temporary password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    type={showCurrent ? "text" : "password"}
                    autoComplete="current-password"
                    className={`${inputBase} pl-10 pr-10`}
                    placeholder="Enter the password you were given"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    tabIndex={-1}>
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>New password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    type={showNew ? "text" : "password"}
                    autoComplete="new-password"
                    className={`${inputBase} pl-10 pr-10`}
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    tabIndex={-1}>
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>Confirm new password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    type={showNew ? "text" : "password"}
                    autoComplete="new-password"
                    className={`${inputBase} pl-10`}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {confirmPassword && (
                  <p className={`mt-1.5 text-[10px] font-semibold ${newPassword === confirmPassword ? "text-emerald-600" : "text-red-500"}`}>
                    {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords don't match"}
                  </p>
                )}
              </div>

              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white
                  bg-gradient-to-r from-violet-600 to-indigo-600
                  hover:from-violet-700 hover:to-indigo-700
                  transition-all shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/35 hover:-translate-y-0.5
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating…
                  </>
                ) : (
                  <>
                    Set password & continue
                    <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center justify-center gap-1.5 pt-5 mt-1 border-t border-gray-100 dark:border-gray-700/60">
              <ShieldCheck size={12} className="text-violet-500 dark:text-violet-400" />
              <span className="text-[11px] text-slate-400 dark:text-slate-500">You must do this before accessing your workspace</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordRequired;
