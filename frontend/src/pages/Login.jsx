import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck, BarChart2, Users, Package, Shield,
  Mail, Lock, Eye, EyeOff, Activity, TrendingUp, ArrowRight, X,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const PERKS = [
  { icon: Users,     text: "Employee, customer & order management" },
  { icon: Package,   text: "Product catalog & inventory tracking" },
  { icon: BarChart2, text: "Real-time analytics & CSV reports" },
  { icon: Shield,    text: "Role-based access & 2FA security" },
];

// ── Left panel ────────────────────────────────────────────────────────────────
const LeftPanel = ({ headline, subtext }) => (
  <div
    className="hidden lg:flex lg:w-[44%] xl:w-2/5 relative overflow-hidden flex-col justify-between p-12"
    style={{ background: "linear-gradient(150deg,#6d28d9 0%,#5b21b6 40%,#3730a3 100%)" }}
  >
    <div className="absolute inset-0 pointer-events-none" style={{
      backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
      backgroundSize: "24px 24px",
    }} />
    <div className="absolute -top-44 -left-44 w-[560px] h-[560px] border border-white/[0.06] rounded-full pointer-events-none" />
    <div className="absolute -top-28 -left-28 w-[400px] h-[400px] border border-white/[0.06] rounded-full pointer-events-none" />
    <div className="absolute -top-24 -right-24 w-80 h-80 bg-violet-400/25 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute top-2/3 right-0 w-28 h-56 bg-purple-400/15 rounded-full blur-2xl pointer-events-none" />

    {/* Logo */}
    <div className="relative flex items-center gap-3">
      <div className="relative">
        <div className="w-9 h-9 bg-white/20 border border-white/25 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
          <span className="text-white text-sm font-black select-none">A</span>
        </div>
        <div className="absolute inset-0 rounded-xl bg-white/10 blur-md scale-110 -z-10" />
      </div>
      <span className="text-[19px] leading-none select-none">
        <span className="font-extrabold tracking-tight text-white">Aq</span>
        <span className="font-extrabold tracking-tight text-violet-300">red</span>
      </span>
    </div>

    {/* Main copy */}
    <div className="relative">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/15 rounded-full mb-5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/70">
          Management Information System
        </span>
      </div>
      <h2 className="text-[34px] font-extrabold text-white leading-[1.15] mb-3 tracking-tight whitespace-pre-line">
        {headline}
      </h2>
      <p className="text-violet-200/75 text-sm leading-relaxed mb-8 max-w-[280px]">
        {subtext}
      </p>
      <div className="space-y-3 mb-8">
        {PERKS.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon size={14} className="text-violet-200" />
            </div>
            <span className="text-sm text-violet-100/75">{text}</span>
          </div>
        ))}
      </div>

      {/* Live stats card */}
      <div className="bg-white/[0.08] border border-white/[0.12] backdrop-blur-sm rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Live System</span>
          </div>
          <Activity size={12} className="text-white/30" />
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "Orders",    value: "89" },
            { label: "Customers", value: "138" },
            { label: "Revenue",   value: "$24k" },
            { label: "Users",     value: "24" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 rounded-xl p-2 text-center">
              <p className="text-[8px] text-white/40 uppercase tracking-wide mb-0.5">{label}</p>
              <p className="text-xs font-extrabold text-white leading-none">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-white/[0.08] flex items-center gap-1.5">
          <TrendingUp size={10} className="text-emerald-400" />
          <span className="text-[10px] text-white/40">Revenue up 18.4% this month</span>
        </div>
      </div>
    </div>

    <div className="relative flex items-center gap-2.5">
      <div className="w-6 h-6 bg-white/10 border border-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
        <ShieldCheck size={12} className="text-violet-300" />
      </div>
      <p className="text-xs text-violet-300/60">Protected with JWT authentication & optional 2FA</p>
    </div>
  </div>
);

// ── Security badge row ────────────────────────────────────────────────────────
const SecurityBadges = () => (
  <div className="flex items-center justify-center gap-2 pt-5 border-t border-gray-100 dark:border-gray-700/60">
    {[
      { icon: ShieldCheck, label: "SSL Encrypted" },
      { icon: Lock,        label: "JWT Auth" },
      { icon: Shield,      label: "2FA Ready" },
    ].map(({ icon: Icon, label }) => (
      <div
        key={label}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 rounded-full"
      >
        <Icon size={10} className="text-violet-500 dark:text-violet-400 flex-shrink-0" />
        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{label}</span>
      </div>
    ))}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const Login = () => {
  const [formData, setFormData]           = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe]       = useState(false);
  const [error, setError]                 = useState("");
  const [loading, setLoading]             = useState(false);
  const [step, setStep]                   = useState("credentials");
  const [tempToken, setTempToken]         = useState("");
  const [totpCode, setTotpCode]           = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail]     = useState("");
  const [forgotSent, setForgotSent]       = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", formData);
      if (data.requires2FA) {
        setTempToken(data.tempToken);
        setStep("totp");
      } else {
        if (data.token) localStorage.setItem("mis_token", data.token);
        login(data.user, rememberMe);
        navigate(data.user.role === "super_admin" ? "/super-admin/companies" : "/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (!totpCode) return setError("Please enter the 6-digit code.");
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/2fa/verify", { tempToken, totpCode });
      if (data.token) localStorage.setItem("mis_token", data.token);
      login(data.user, rememberMe);
      navigate(data.user.role === "super_admin" ? "/super-admin/companies" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: forgotEmail });
      setForgotSent(true);
    } catch {
      setForgotSent(true); // always show success to avoid email enumeration
    } finally {
      setForgotLoading(false);
    }
  };

  const inputBase =
    "w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-sm " +
    "bg-slate-50 dark:bg-gray-900/60 text-slate-900 dark:text-gray-100 " +
    "placeholder-gray-400 dark:placeholder-gray-600 " +
    "focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 " +
    "focus:bg-white dark:focus:bg-gray-900 transition-all duration-200";

  const labelClass = "block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em] mb-1.5";

  // ── Right panel shell (shared) ──────────────────────────────────────────────
  const RightShell = ({ children }) => (
    <div className="flex-1 flex items-center justify-center py-10 px-6 lg:px-12 xl:px-16 relative overflow-hidden bg-slate-50 dark:bg-gray-900">
      {/* Subtle dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(139,92,246,0.05) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />
      {/* Top glow */}
      <div className="absolute top-0 left-0 right-0 h-64 pointer-events-none" style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139,92,246,0.07) 0%, transparent 70%)",
      }} />
      {/* Bottom-right accent */}
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-100/60 dark:bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Mobile logo */}
        <div className="flex items-center gap-2.5 mb-6 lg:hidden">
          <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-200 dark:shadow-none">
            <span className="text-white text-sm font-black select-none">A</span>
          </div>
          <span className="text-[17px] leading-none select-none">
            <span className="font-extrabold tracking-tight text-slate-800 dark:text-white">Aq</span>
            <span className="font-extrabold tracking-tight text-violet-600">red</span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );

  // ── TOTP step ───────────────────────────────────────────────────────────────
  if (step === "totp") {
    return (
      <div className="min-h-screen flex bg-white dark:bg-gray-900">
        <LeftPanel
          headline={"Secure access\nto your workspace."}
          subtext="Two-factor authentication keeps your account and your team's data safe."
        />
        <RightShell>
          <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100/80 dark:border-gray-700 shadow-2xl shadow-violet-100/30 dark:shadow-black/40">
            {/* Gradient header */}
            <div
              className="relative px-8 pt-8 pb-7 overflow-hidden"
              style={{ background: "linear-gradient(135deg,#7c3aed 0%,#6d28d9 55%,#4338ca 100%)" }}
            >
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
              <div className="absolute top-6 right-14 w-14 h-14 bg-white/5 rounded-full pointer-events-none" />
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }} />
              <div className="relative flex justify-center">
                <div className="w-14 h-14 bg-white/20 border border-white/25 rounded-2xl flex items-center justify-center shadow-lg">
                  <ShieldCheck size={26} className="text-white" />
                </div>
              </div>
              <div className="relative text-center mt-4">
                <h1 className="text-xl font-extrabold text-white tracking-tight mb-1">
                  Two-Factor Auth
                </h1>
                <p className="text-violet-200/75 text-sm">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            </div>

            {/* Form body */}
            <div className="px-8 py-7">
              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div>
                  <label className={labelClass}>Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    className={`${inputBase} tracking-[0.5em] text-xl text-center font-bold`}
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
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
                      Verifying…
                    </>
                  ) : (
                    <>
                      Verify & Sign In
                      <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep("credentials"); setTempToken(""); setTotpCode(""); setError(""); }}
                  className="w-full text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-center transition-colors py-1"
                >
                  ← Back to sign in
                </button>
              </form>

              <SecurityBadges />
            </div>
          </div>
        </RightShell>
      </div>
    );
  }

  // ── Credentials step ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900">
      <LeftPanel
        headline={"Welcome back.\nYour team is\nwaiting for you."}
        subtext="Sign in to access your workspace and manage your entire operation."
      />

      <RightShell>
        {/* Form card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100/80 dark:border-gray-700 shadow-2xl shadow-violet-100/30 dark:shadow-black/40">

          {/* ── Gradient header ── */}
          <div
            className="relative px-8 pt-8 pb-7 overflow-hidden"
            style={{ background: "linear-gradient(135deg,#7c3aed 0%,#6d28d9 55%,#4338ca 100%)" }}
          >
            {/* Header decorations */}
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />
            <div className="absolute top-4 right-16 w-16 h-16 bg-white/5 rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
            {/* Dot grid overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }} />

            <div className="relative">
              {/* Logo row */}
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 bg-white/20 border border-white/25 rounded-xl flex items-center justify-center shadow-md shadow-black/10">
                  <span className="text-white text-xs font-black select-none">A</span>
                </div>
                <span className="text-[16px] leading-none select-none">
                  <span className="font-extrabold tracking-tight text-white">Aq</span>
                  <span className="font-extrabold tracking-tight text-violet-300">red</span>
                </span>
              </div>

              <h1 className="text-[22px] font-extrabold text-white tracking-tight leading-none mb-1.5">
                Sign in to Aqred
              </h1>
              <p className="text-violet-200/70 text-sm">
                Enter your credentials to continue
              </p>
            </div>
          </div>

          {/* ── Form body ── */}
          <div className="px-8 py-7">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label className={labelClass}>Email address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    type="email"
                    className={`${inputBase} pl-10`}
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelClass.replace("mb-1.5", "")}>Password</label>
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(true); setForgotEmail(""); setForgotSent(false); }}
                    className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`${inputBase} pl-10 pr-10`}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500/40 cursor-pointer"
                />
                <span className="text-sm text-slate-500 dark:text-slate-400">Keep me signed in</span>
              </label>

              {/* Error */}
              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white
                  bg-gradient-to-r from-violet-600 to-indigo-600
                  hover:from-violet-700 hover:to-indigo-700
                  transition-all shadow-lg shadow-violet-500/25
                  hover:shadow-xl hover:shadow-violet-500/35 hover:-translate-y-0.5
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Security badges */}
            <SecurityBadges />
          </div>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-5">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-violet-600 dark:text-violet-400 hover:text-violet-700 font-semibold transition-colors"
          >
            Create one →
          </Link>
        </p>
      </RightShell>

      {/* ── Forgot password modal ── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div
              className="relative px-6 pt-6 pb-5 overflow-hidden"
              style={{ background: "linear-gradient(135deg,#7c3aed 0%,#6d28d9 55%,#4338ca 100%)" }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }} />
              <button
                onClick={() => setShowForgotModal(false)}
                className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
              <div className="relative">
                <h2 className="text-lg font-extrabold text-white tracking-tight">Reset password</h2>
                <p className="text-violet-200/75 text-sm mt-0.5">
                  Enter your email and we'll send reset instructions.
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {forgotSent ? (
                <div className="text-center py-2">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck size={22} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Check your email</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    If <span className="font-medium text-violet-600 dark:text-violet-400">{forgotEmail}</span> is registered, you'll receive reset instructions shortly.
                  </p>
                  <button
                    onClick={() => setShowForgotModal(false)}
                    className="mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md shadow-violet-500/25"
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                      <input
                        type="email"
                        required
                        autoFocus
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-gray-500 text-sm pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-all"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {forgotLoading ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                    ) : (
                      "Send reset link"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-full text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-center transition-colors py-1"
                  >
                    ← Back to sign in
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
