import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle, Users, BarChart2, Shield, Package,
  Mail, Lock, Eye, EyeOff, Activity, TrendingUp,
  ArrowRight, User, Briefcase, ShieldCheck,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const PERKS = [
  { icon: Users,     text: "Employee, customer & order management" },
  { icon: Package,   text: "Product catalog & inventory tracking" },
  { icon: BarChart2, text: "Real-time analytics & CSV reports" },
  { icon: Shield,    text: "Role-based access & 2FA security" },
];

// ── Password strength ─────────────────────────────────────────────────────────
const getStrength = (pwd) => {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 8)          s++;
  if (/[A-Z]/.test(pwd))        s++;
  if (/[0-9]/.test(pwd))        s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
};

const StrengthBar = ({ password }) => {
  const s = getStrength(password);
  if (!password) return null;
  const bar   = ["bg-red-400", "bg-amber-400", "bg-blue-400", "bg-emerald-500"][s - 1] ?? "bg-gray-200";
  const label = ["Weak", "Fair", "Good", "Strong"][s - 1] ?? "";
  const text  = ["text-red-500", "text-amber-500", "text-blue-500", "text-emerald-600"][s - 1] ?? "";
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= s ? bar : "bg-gray-100 dark:bg-gray-700"}`}
          />
        ))}
      </div>
      <p className={`text-[10px] font-semibold ${text}`}>{label}</p>
    </div>
  );
};

// ── Security badges ───────────────────────────────────────────────────────────
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

// ── Left panel ────────────────────────────────────────────────────────────────
const LeftPanel = () => (
  <div
    className="hidden lg:flex lg:w-[44%] xl:w-2/5 relative overflow-hidden flex-col justify-between p-12"
    style={{ background: "linear-gradient(150deg,#6d28d9 0%,#5b21b6 40%,#3730a3 100%)" }}
  >
    {/* Dot grid */}
    <div className="absolute inset-0 pointer-events-none" style={{
      backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
      backgroundSize: "24px 24px",
    }} />
    {/* Rings */}
    <div className="absolute -top-44 -left-44 w-[560px] h-[560px] border border-white/[0.06] rounded-full pointer-events-none" />
    <div className="absolute -top-28 -left-28 w-[400px] h-[400px] border border-white/[0.06] rounded-full pointer-events-none" />
    {/* Blobs */}
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

    {/* Copy */}
    <div className="relative">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/15 rounded-full mb-5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/70">
          Management Information System
        </span>
      </div>
      <h2 className="text-[34px] font-extrabold text-white leading-[1.15] mb-3 tracking-tight">
        Everything your<br />team needs,<br />in one place.
      </h2>
      <p className="text-violet-200/75 text-sm leading-relaxed mb-8 max-w-[280px]">
        Set up your workspace in seconds and bring your entire operation under one roof.
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

    {/* Footer */}
    <div className="relative flex items-center gap-2.5">
      <div className="w-6 h-6 bg-white/10 border border-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
        <CheckCircle size={12} className="text-violet-300" />
      </div>
      <p className="text-xs text-violet-300/60">Free to get started — no credit card required</p>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "",
    company: "", password: "", confirmPassword: "",
  });
  const [agreed, setAgreed]               = useState(false);
  const [error, setError]                 = useState("");
  const [loading, setLoading]             = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const navigate  = useNavigate();
  const { login } = useAuth();

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setError("You must agree to the terms and conditions.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", formData);
      login(data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm " +
    "bg-slate-50 dark:bg-gray-900/60 text-slate-900 dark:text-gray-100 " +
    "placeholder-gray-400 dark:placeholder-gray-600 " +
    "focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 " +
    "focus:bg-white dark:focus:bg-gray-900 transition-all duration-200";

  const labelClass = "block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.08em] mb-1.5";

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900">
      <LeftPanel />

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center py-8 px-6 lg:px-12 xl:px-16 relative overflow-hidden bg-slate-50 dark:bg-gray-900">
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle, rgba(139,92,246,0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        {/* Top glow */}
        <div className="absolute top-0 left-0 right-0 h-64 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139,92,246,0.07) 0%, transparent 70%)",
        }} />
        {/* Corner blob */}
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-100/60 dark:bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md">

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

          {/* Form card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100/80 dark:border-gray-700 shadow-2xl shadow-violet-100/30 dark:shadow-black/40">

            {/* ── Gradient header ── */}
            <div
              className="relative px-8 pt-7 pb-6 overflow-hidden"
              style={{ background: "linear-gradient(135deg,#7c3aed 0%,#6d28d9 55%,#4338ca 100%)" }}
            >
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />
              <div className="absolute top-4 right-16 w-14 h-14 bg-white/5 rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }} />

              <div className="relative">
                {/* Logo row */}
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 bg-white/20 border border-white/25 rounded-xl flex items-center justify-center shadow-md shadow-black/10">
                    <span className="text-white text-xs font-black select-none">A</span>
                  </div>
                  <span className="text-[16px] leading-none select-none">
                    <span className="font-extrabold tracking-tight text-white">Aq</span>
                    <span className="font-extrabold tracking-tight text-violet-300">red</span>
                  </span>
                </div>

                <h1 className="text-[22px] font-extrabold text-white tracking-tight leading-none mb-1">
                  Create your account
                </h1>
                <p className="text-violet-200/70 text-sm mb-5">
                  Set up your workspace in seconds
                </p>

                {/* Onboarding step strip */}
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-white text-violet-700 flex items-center justify-center text-[10px] font-black flex-shrink-0 shadow-sm">
                      1
                    </div>
                    <span className="text-xs font-semibold text-white">Account</span>
                  </div>
                  <div className="flex-1 h-px bg-white/25 mx-2" />
                  <div className="flex items-center gap-1.5 opacity-45">
                    <div className="w-5 h-5 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      2
                    </div>
                    <span className="text-xs font-medium text-white">Team setup</span>
                  </div>
                  <div className="flex-1 h-px bg-white/25 mx-2" />
                  <div className="flex items-center gap-1.5 opacity-45">
                    <div className="w-5 h-5 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      3
                    </div>
                    <span className="text-xs font-medium text-white">Go live</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Form body ── */}
            <div className="px-8 py-6">
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>First Name</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                      <input
                        type="text"
                        className={`${inputBase} pl-9`}
                        placeholder="John"
                        value={formData.firstName}
                        onChange={set("firstName")}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                      <input
                        type="text"
                        className={`${inputBase} pl-9`}
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={set("lastName")}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className={labelClass}>Email address</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                    <input
                      type="email"
                      className={`${inputBase} pl-10`}
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={set("email")}
                      required
                    />
                  </div>
                </div>

                {/* Company */}
                <div>
                  <label className={labelClass}>
                    Company Name
                    <span className="ml-1.5 text-slate-400 normal-case font-normal tracking-normal text-[10px]">optional</span>
                  </label>
                  <div className="relative">
                    <Briefcase size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                    <input
                      type="text"
                      className={`${inputBase} pl-10`}
                      placeholder="Your Company Inc."
                      value={formData.company}
                      onChange={set("company")}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className={labelClass}>Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`${inputBase} pl-10 pr-10`}
                      placeholder="Min. 8 characters"
                      value={formData.password}
                      onChange={set("password")}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <StrengthBar password={formData.password} />
                </div>

                {/* Confirm password */}
                <div>
                  <label className={labelClass}>Confirm Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      className={`${inputBase} pl-10 pr-10`}
                      placeholder="Repeat password"
                      value={formData.confirmPassword}
                      onChange={set("confirmPassword")}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {/* Match indicator */}
                  {formData.confirmPassword && (
                    <p className={`mt-1.5 text-[10px] font-semibold ${
                      formData.password === formData.confirmPassword
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}>
                      {formData.password === formData.confirmPassword ? "✓ Passwords match" : "✗ Passwords don't match"}
                    </p>
                  )}
                </div>

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-gray-300 text-violet-600 focus:ring-violet-500/40 cursor-pointer flex-shrink-0"
                  />
                  <span className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    I agree to the{" "}
                    <a href="#" className="text-violet-600 dark:text-violet-400 hover:text-violet-700 font-semibold transition-colors">
                      terms and conditions
                    </a>
                  </span>
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
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <SecurityBadges />
            </div>
          </div>

          {/* Sign in link */}
          <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-violet-600 dark:text-violet-400 hover:text-violet-700 font-semibold transition-colors">
              Sign in →
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Register;
