import { useState, useEffect, useRef, Fragment } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  CheckCircle, Users, BarChart2, Shield, Package,
  Mail, Lock, Eye, EyeOff, Activity, TrendingUp,
  ArrowRight, ArrowLeft, User, Briefcase, ShieldCheck,
  Check, Loader, Sparkles, Plus, X, PartyPopper,
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
        Create your own workspace or join your team's — employees, customers, inventory, orders and analytics, all in one place.
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

// ── Wizard step chrome ────────────────────────────────────────────────────────
const STEPS_JOIN   = ["Account", "Workspace", "Go live"];
const STEPS_CREATE = ["Account", "Workspace", "Invite team", "Go live"];

const STEP_INDEX = {
  join:   { account: 0, workspace: 1, success: 2 },
  create: { account: 0, workspace: 1, invite: 2, success: 3 },
};

const HEADER_COPY = {
  account:   { title: "Create your account",   desc: "Join your company's workspace in seconds" },
  workspace: { title: "Set up your workspace", desc: "Tell us which company you're joining or creating" },
  invite:    { title: "Invite your team",      desc: "Bring your teammates into the workspace" },
  success:   { title: "You're all set!",       desc: "Your workspace is ready to go" },
};

const ProgressStrip = ({ step, companyCreated }) => {
  const labels = companyCreated ? STEPS_CREATE : STEPS_JOIN;
  const index  = (companyCreated ? STEP_INDEX.create : STEP_INDEX.join)[step] ?? 0;
  return (
    <div className="flex items-center gap-1">
      {labels.map((label, i) => (
        <Fragment key={label}>
          <div className={`flex items-center gap-1.5 ${i > index ? "opacity-45" : ""}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 shadow-sm ${
              i <= index ? "bg-white text-violet-700" : "bg-white/20 border border-white/30 text-white"
            }`}>
              {i < index ? <Check size={11} strokeWidth={3} /> : i + 1}
            </div>
            <span className="text-xs font-semibold text-white whitespace-nowrap">{label}</span>
          </div>
          {i < labels.length - 1 && <div className="flex-1 h-px bg-white/25 mx-2" />}
        </Fragment>
      ))}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const Register = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState("account"); // account -> workspace -> [invite] -> success
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "",
    company: "", password: "", confirmPassword: "",
  });
  const [agreed, setAgreed]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  const [companyCheck, setCompanyCheck] = useState({ loading: false, checked: false, exists: false, name: "" });
  const debounceRef = useRef(null);

  const [registeredUser, setRegisteredUser] = useState(null);
  const [companyCreated, setCompanyCreated] = useState(false);

  const [inviteEmails, setInviteEmails] = useState(["", "", ""]);
  const [inviteResults, setInviteResults] = useState(null);

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  // Pre-fill company name from an invite link (?company=...)
  useEffect(() => {
    const prefill = new URLSearchParams(location.search).get("company");
    if (prefill) setFormData((f) => ({ ...f, company: prefill }));
  }, [location.search]);

  // Live "does this company already exist?" lookup while on the workspace step
  useEffect(() => {
    if (step !== "workspace") return;
    const name = formData.company.trim();
    if (!name) { setCompanyCheck({ loading: false, checked: false, exists: false, name: "" }); return; }
    setCompanyCheck((c) => ({ ...c, loading: true }));
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/auth/check-company?name=${encodeURIComponent(name)}`);
        setCompanyCheck({ loading: false, checked: true, exists: data.exists, name: data.name });
      } catch {
        setCompanyCheck({ loading: false, checked: false, exists: false, name: "" });
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [formData.company, step]);

  const handleAccountContinue = (e) => {
    e.preventDefault();
    if (formData.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (formData.password !== formData.confirmPassword) { setError("Passwords do not match."); return; }
    if (!agreed) { setError("You must agree to the terms and conditions."); return; }
    setError("");
    setStep("workspace");
  };

  const handleWorkspaceSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company.trim()) { setError("Company name is required."); return; }
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", formData);
      if (data.token) localStorage.setItem("mis_token", data.token);
      login(data.user);
      setRegisteredUser(data.user);
      setCompanyCreated(data.companyCreated);
      setStep(data.companyCreated ? "invite" : "success");
    } catch (err) {
      if (err.response?.status === 429) {
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else {
        setError(err.response?.data?.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateInviteEmail = (i, val) => setInviteEmails((prev) => prev.map((e, idx) => (idx === i ? val : e)));
  const addInviteRow = () => setInviteEmails((prev) => (prev.length < 5 ? [...prev, ""] : prev));
  const removeInviteRow = (i) => setInviteEmails((prev) => prev.filter((_, idx) => idx !== i));

  const handleSendInvites = async () => {
    const emails = inviteEmails.map((e) => e.trim()).filter(Boolean);
    if (emails.length === 0) { setStep("success"); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/invite-teammates", { emails });
      setInviteResults(data.results);
    } catch {
      setInviteResults(emails.map((email) => ({ email, status: "failed" })));
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

  const header = HEADER_COPY[step];
  const invitedCount = (inviteResults || []).filter((r) => r.status === "invited").length;

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900">
      <LeftPanel />

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center py-8 px-6 lg:px-12 xl:px-16 relative overflow-hidden bg-slate-50 dark:bg-gray-900">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle, rgba(139,92,246,0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        <div className="absolute top-0 left-0 right-0 h-64 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139,92,246,0.07) 0%, transparent 70%)",
        }} />
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
                  {header.title}
                </h1>
                <p className="text-violet-200/70 text-sm mb-5">{header.desc}</p>

                <ProgressStrip step={step} companyCreated={companyCreated} />
              </div>
            </div>

            {/* ── Form body ── */}
            <div className="px-8 py-6">

              {/* Error */}
              {error && (
                <div className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              {/* ── Step 1: Account ── */}
              {step === "account" && (
                <form onSubmit={handleAccountContinue} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>First Name</label>
                      <div className="relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                        <input type="text" autoComplete="given-name" className={`${inputBase} pl-9`} placeholder="John"
                          value={formData.firstName} onChange={set("firstName")} required />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Last Name</label>
                      <div className="relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                        <input type="text" autoComplete="family-name" className={`${inputBase} pl-9`} placeholder="Doe"
                          value={formData.lastName} onChange={set("lastName")} required />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Email address</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                      <input type="email" autoComplete="username" className={`${inputBase} pl-10`} placeholder="you@company.com"
                        value={formData.email} onChange={set("email")} required />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Password</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className={`${inputBase} pl-10 pr-10`}
                        placeholder="Min. 8 characters"
                        value={formData.password}
                        onChange={set("password")}
                        required
                      />
                      <button type="button" onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                        tabIndex={-1}>
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <StrengthBar password={formData.password} />
                  </div>

                  <div>
                    <label className={labelClass}>Confirm Password</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        className={`${inputBase} pl-10 pr-10`}
                        placeholder="Repeat password"
                        value={formData.confirmPassword}
                        onChange={set("confirmPassword")}
                        required
                      />
                      <button type="button" onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                        tabIndex={-1}>
                        {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {formData.confirmPassword && (
                      <p className={`mt-1.5 text-[10px] font-semibold ${
                        formData.password === formData.confirmPassword ? "text-emerald-600" : "text-red-500"
                      }`}>
                        {formData.password === formData.confirmPassword ? "✓ Passwords match" : "✗ Passwords don't match"}
                      </p>
                    )}
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-gray-300 text-violet-600 focus:ring-violet-500/40 cursor-pointer flex-shrink-0"
                    />
                    <span className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      I agree to the{" "}
                      <Link to="/terms" target="_blank" className="text-violet-600 dark:text-violet-400 hover:text-violet-700 font-semibold transition-colors">
                        terms and conditions
                      </Link>
                    </span>
                  </label>

                  <button type="submit"
                    className="w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white
                      bg-gradient-to-r from-violet-600 to-indigo-600
                      hover:from-violet-700 hover:to-indigo-700
                      transition-all shadow-lg shadow-violet-500/25
                      hover:shadow-xl hover:shadow-violet-500/35 hover:-translate-y-0.5
                      flex items-center justify-center gap-2 group">
                    Continue
                    <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </form>
              )}

              {/* ── Step 2: Workspace ── */}
              {step === "workspace" && (
                <form onSubmit={handleWorkspaceSubmit} className="space-y-4">
                  <div>
                    <label className={labelClass}>Company Name</label>
                    <div className="relative">
                      <Briefcase size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                      <input type="text" autoComplete="organization" className={`${inputBase} pl-10`} placeholder="Your Company Inc."
                        value={formData.company} onChange={set("company")} required autoFocus />
                    </div>

                    {/* Live join-vs-create feedback */}
                    <div className="mt-2 min-h-[20px]">
                      {companyCheck.loading && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Loader size={11} className="animate-spin" /> Checking…
                        </p>
                      )}
                      {!companyCheck.loading && companyCheck.checked && companyCheck.exists && (
                        <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <Check size={12} /> Joining <strong>{companyCheck.name}</strong> as an employee
                        </p>
                      )}
                      {!companyCheck.loading && companyCheck.checked && !companyCheck.exists && (
                        <p className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                          <Sparkles size={12} /> Creating <strong>{formData.company.trim()}</strong> — you'll be its admin
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep("account")}
                      className="px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-1.5">
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-1 rounded-xl px-4 py-3.5 text-sm font-bold text-white
                        bg-gradient-to-r from-violet-600 to-indigo-600
                        hover:from-violet-700 hover:to-indigo-700
                        transition-all shadow-lg shadow-violet-500/25
                        hover:shadow-xl hover:shadow-violet-500/35 hover:-translate-y-0.5
                        disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2 group">
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
                  </div>

                  <SecurityBadges />
                </form>
              )}

              {/* ── Step 3: Invite teammates (only when a new company was created) ── */}
              {step === "invite" && (
                <div className="space-y-4">
                  {inviteResults === null ? (
                    <>
                      <p className="text-sm text-slate-500 dark:text-slate-400 -mt-1 mb-1">
                        Invite up to 5 teammates to <strong>{formData.company.trim()}</strong>. You can always do this later from Settings.
                      </p>
                      <div className="space-y-2.5">
                        {inviteEmails.map((email, i) => (
                          <div key={i} className="relative flex items-center gap-2">
                            <div className="relative flex-1">
                              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                              <input
                                type="email"
                                className={`${inputBase} pl-10`}
                                placeholder="teammate@company.com"
                                value={email}
                                onChange={(e) => updateInviteEmail(i, e.target.value)}
                              />
                            </div>
                            {inviteEmails.length > 1 && (
                              <button type="button" onClick={() => removeInviteRow(i)}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {inviteEmails.length < 5 && (
                        <button type="button" onClick={addInviteRow}
                          className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 flex items-center gap-1">
                          <Plus size={13} /> Add another
                        </button>
                      )}

                      <div className="flex gap-3 pt-1">
                        <button type="button" onClick={() => setStep("success")}
                          className="px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          Skip for now
                        </button>
                        <button type="button" onClick={handleSendInvites} disabled={loading}
                          className="flex-1 rounded-xl px-4 py-3.5 text-sm font-bold text-white
                            bg-gradient-to-r from-violet-600 to-indigo-600
                            hover:from-violet-700 hover:to-indigo-700
                            transition-all shadow-lg shadow-violet-500/25
                            disabled:opacity-50 disabled:cursor-not-allowed
                            flex items-center justify-center gap-2">
                          {loading ? <Loader size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                          {loading ? "Sending…" : "Send Invites"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {inviteResults.map(({ email, status }) => (
                          <div key={email} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700">
                            <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{email}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                              status === "invited"
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                                : status === "already_registered"
                                ? "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                                : "bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400"
                            }`}>
                              {status === "invited" ? "Invited" : status === "already_registered" ? "Already a member" : "Failed"}
                            </span>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={() => setStep("success")}
                        className="w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white
                          bg-gradient-to-r from-violet-600 to-indigo-600
                          hover:from-violet-700 hover:to-indigo-700
                          transition-all shadow-lg shadow-violet-500/25
                          flex items-center justify-center gap-2 group">
                        Continue
                        <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* ── Step 4: Success ── */}
              {step === "success" && (
                <div className="text-center py-2">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <PartyPopper size={28} className="text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                    Welcome, {registeredUser?.name?.split(" ")[0] || "there"}!
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    {companyCreated
                      ? <>You've created <strong>{registeredUser?.company_name}</strong> and you're its admin{invitedCount > 0 ? ` — ${invitedCount} teammate${invitedCount > 1 ? "s" : ""} invited.` : "."}</>
                      : <>You've joined <strong>{registeredUser?.company_name}</strong> as an employee.</>}
                  </p>
                  <button onClick={() => navigate("/dashboard")}
                    className="w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white
                      bg-gradient-to-r from-violet-600 to-indigo-600
                      hover:from-violet-700 hover:to-indigo-700
                      transition-all shadow-lg shadow-violet-500/25
                      hover:shadow-xl hover:shadow-violet-500/35 hover:-translate-y-0.5
                      flex items-center justify-center gap-2 group">
                    Go to Dashboard
                    <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sign in link */}
          {step === "account" && (
            <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-5">
              Already have an account?{" "}
              <Link to="/login" className="text-violet-600 dark:text-violet-400 hover:text-violet-700 font-semibold transition-colors">
                Sign in →
              </Link>
            </p>
          )}

        </div>
      </div>
    </div>
  );
};

export default Register;
