import { useState, useEffect } from "react";
import {
  User, Bell, Lock, Globe, Save, X, CheckCircle, AlertCircle, Loader,
  ShieldCheck, ShieldOff, Eye, EyeOff, RefreshCw, Sun, Moon, Monitor,
  Database, Clock, Mail, Smartphone, Package, UserPlus, FileBarChart,
  ChevronRight, Building2, MapPin, AtSign, Key, Timer, Calendar,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSystem } from "../context/SystemContext";
import {
  getProfile, updateProfile, changePassword,
  setup2FA, verify2FA, disable2FA,
  getPreferences, updatePreferences,
  getSystemSettings, updateSystemSettings,
  getBackupStatus, triggerBackup,
} from "../services/settingsService";

const applyTheme = (t) => {
  const lower = (t || "light").toLowerCase();
  const isDark = lower === "dark"
    || (lower === "auto" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
  localStorage.setItem("mis_theme", t || "Light");
};

// ── Shared UI ─────────────────────────────────────────────────────────────────

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`relative rounded-full transition-all flex-shrink-0 ${
      checked ? "bg-violet-600 shadow-lg shadow-violet-500/30" : "bg-gray-200 dark:bg-gray-700"
    } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:scale-105"}`}
    style={{ width: "2.5rem", height: "1.375rem" }}
  >
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
  </button>
);

const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400 dark:placeholder-gray-600";
const labelCls = "block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2";

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-2xl text-sm font-medium border backdrop-blur-sm ${
    type === "error"
      ? "bg-red-50/90 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-100 dark:border-red-800/50"
      : "bg-green-50/90 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-100 dark:border-green-800/50"
  }`}>
    {type === "error"
      ? <AlertCircle size={16} className="flex-shrink-0" />
      : <CheckCircle size={16} className="flex-shrink-0" />}
    <span>{msg}</span>
    <button onClick={onClose} className="ml-1 opacity-50 hover:opacity-100 transition-opacity"><X size={14} /></button>
  </div>
);

const SaveButton = ({ onClick, loading, label = "Save Changes" }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl
      hover:bg-violet-700 disabled:opacity-60 transition-all shadow-lg shadow-violet-500/25
      hover:shadow-violet-500/40 hover:-translate-y-px active:translate-y-0"
  >
    {loading ? <Loader size={15} className="animate-spin" /> : <Save size={15} />}
    {loading ? "Saving…" : label}
  </button>
);

const SectionCard = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ icon: Icon, title, desc, accent = "violet" }) => {
  const colors = {
    violet: "from-violet-500/10 to-transparent border-violet-100 dark:border-violet-900/40 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20",
    blue:   "from-blue-500/10 to-transparent border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
    red:    "from-red-500/10 to-transparent border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
    green:  "from-green-500/10 to-transparent border-green-100 dark:border-green-900/40 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
    amber:  "from-amber-500/10 to-transparent border-amber-100 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20",
  };
  const c = colors[accent];
  return (
    <div className={`flex items-center gap-3 px-6 py-4 border-b bg-gradient-to-r ${c}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.split(" ").slice(-2).join(" ")}`}>
        <Icon size={16} className={c.split(" ")[4]} />
      </div>
      <div>
        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h2>
        {desc && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>}
      </div>
    </div>
  );
};

const TABS = [
  { id: "profile",       label: "Profile",       desc: "Personal info",     icon: User  },
  { id: "notifications", label: "Notifications", desc: "Alerts & emails",   icon: Bell  },
  { id: "security",      label: "Security",      desc: "Password & 2FA",    icon: Lock  },
  { id: "system",        label: "System",        desc: "App preferences",   icon: Globe },
];

const TIMEZONES = [
  "UTC-8 (Pacific Time)", "UTC-7 (Mountain Time)",
  "UTC-6 (Central Time)", "UTC-5 (Eastern Time)",
  "UTC+0 (GMT)", "UTC+1 (CET)", "UTC+2 (EET)", "UTC+3 (MSK)",
];

const ROLE_STYLE = {
  super_admin: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800/40",
  admin:       "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-800/40",
  manager:     "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/40",
  employee:    "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/40",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Settings() {
  const { user } = useAuth();
  const { refresh: refreshSystem, t, updateSettings } = useSystem();
  const isAdmin = user?.role === "admin";

  const [activeTab, setActiveTab] = useState("profile");
  const [toast, setToast]         = useState(null);
  const [loading, setLoading]     = useState({});

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };
  const setLoad = (key, val) => setLoading(prev => ({ ...prev, [key]: val }));

  // ── Profile ────────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    firstName: "", lastName: "", email: "", company_name: "", timezone: "UTC-5 (Eastern Time)",
  });
  useEffect(() => {
    getProfile().then(r => {
      const parts = (r.data.name || "").split(" ");
      setProfile({
        firstName:    parts[0] || "",
        lastName:     parts.slice(1).join(" ") || "",
        email:        r.data.email || "",
        company_name: r.data.company_name || "",
        timezone:     r.data.timezone || "UTC-5 (Eastern Time)",
      });
    }).catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    setLoad("profile", true);
    try {
      const name = `${profile.firstName} ${profile.lastName}`.trim();
      await updateProfile({ name, email: profile.email, company_name: profile.company_name, timezone: profile.timezone });
      showToast("Profile saved successfully.");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to save profile", "error");
    } finally { setLoad("profile", false); }
  };

  // ── Notifications ──────────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState({
    emailOrders: true, emailPayments: true, emailAlerts: true,
    browserOrders: false, browserPayments: true, browserAlerts: true,
    lowStock: true, newCustomer: false, reportReady: true,
  });
  useEffect(() => {
    getPreferences().then(r => {
      if (r.data.notifications && Object.keys(r.data.notifications).length > 0)
        setNotifs(n => ({ ...n, ...r.data.notifications }));
    }).catch(() => {});
  }, []);

  const handleSaveNotifications = async () => {
    setLoad("notifs", true);
    try {
      await updatePreferences({ notifications: notifs });
      showToast("Notification preferences saved.");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to save preferences", "error");
    } finally { setLoad("notifs", false); }
  };

  // ── Security ───────────────────────────────────────────────────────────────
  const [secPrefs, setSecPrefs] = useState({ sessionTimeout: "30", passwordExpiry: "90" });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState("idle");
  const [qrData, setQrData] = useState(null);
  const [twoFASecret, setTwoFASecret] = useState("");
  const [twoFAToken, setTwoFAToken] = useState("");
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });

  useEffect(() => {
    getPreferences().then(r => {
      setTwoFactorEnabled(!!r.data.two_factor_enabled);
      setSecPrefs({
        sessionTimeout: String(r.data.session_timeout || "30"),
        passwordExpiry: String(r.data.password_expiry || "90"),
      });
    }).catch(() => {});
  }, []);

  const handleChangePassword = async () => {
    if (!passwords.current) return showToast("Enter your current password", "error");
    if (!passwords.next)    return showToast("Enter a new password", "error");
    if (passwords.next.length < 6) return showToast("New password must be at least 6 characters", "error");
    if (passwords.next !== passwords.confirm) return showToast("New passwords do not match", "error");
    setLoad("pw", true);
    try {
      await changePassword({ currentPassword: passwords.current, newPassword: passwords.next });
      setPasswords({ current: "", next: "", confirm: "" });
      showToast("Password changed successfully.");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to change password", "error");
    } finally { setLoad("pw", false); }
  };

  const handleSetup2FA = async () => {
    setLoad("2fa", true);
    try {
      const r = await setup2FA();
      setQrData(r.data.qrDataUrl);
      setTwoFASecret(r.data.secret);
      setTwoFAStep("verify");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to start 2FA setup", "error");
    } finally { setLoad("2fa", false); }
  };

  const handleVerify2FA = async () => {
    if (!twoFAToken) return showToast("Enter the 6-digit code from your authenticator app", "error");
    setLoad("2fa", true);
    try {
      await verify2FA(twoFAToken);
      setTwoFactorEnabled(true);
      setTwoFAStep("idle");
      setTwoFAToken("");
      showToast("Two-factor authentication enabled!");
    } catch (err) {
      showToast(err.response?.data?.error || "Invalid code", "error");
    } finally { setLoad("2fa", false); }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm("Disable 2FA? Your account will be less secure.")) return;
    setLoad("2fa", true);
    try {
      await disable2FA();
      setTwoFactorEnabled(false);
      setTwoFAStep("idle");
      showToast("Two-factor authentication disabled.");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to disable 2FA", "error");
    } finally { setLoad("2fa", false); }
  };

  const handleSaveSecurityPrefs = async () => {
    setLoad("secPrefs", true);
    try {
      await updatePreferences({
        session_timeout: parseInt(secPrefs.sessionTimeout),
        password_expiry: secPrefs.passwordExpiry,
      });
      showToast("Security settings saved.");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to save", "error");
    } finally { setLoad("secPrefs", false); }
  };

  // ── System ─────────────────────────────────────────────────────────────────
  const [system, setSystem] = useState({
    currency: "USD", dateFormat: "MM/DD/YYYY", language: "English",
    theme: "Light", autoBackup: true, maintenanceMode: false,
  });
  const [backup, setBackup] = useState({ lastBackup: null, nextScheduled: "Daily at 22:00 UTC" });

  useEffect(() => {
    Promise.all([getSystemSettings(), getPreferences(), getBackupStatus()]).then(([sys, prefs, bak]) => {
      const theme = prefs.data.theme || "Light";
      setSystem(prev => ({
        ...prev,
        currency:        sys.data.currency        || prev.currency,
        dateFormat:      sys.data.dateFormat       || prev.dateFormat,
        language:        sys.data.language         || prev.language,
        autoBackup:      sys.data.autoBackup       === "true",
        maintenanceMode: sys.data.maintenanceMode  === "true",
        theme,
      }));
      applyTheme(theme);
      setBackup({
        lastBackup:    bak.data.lastBackup    || null,
        nextScheduled: bak.data.nextScheduled || "Daily at 22:00 UTC",
      });
    }).catch(() => {});
  }, []);

  const handleSaveSystem = async () => {
    setLoad("system", true);
    applyTheme(system.theme);
    try {
      const saves = [updatePreferences({ theme: system.theme })];
      if (isAdmin) {
        saves.push(updateSystemSettings({
          currency: system.currency, dateFormat: system.dateFormat,
          language: system.language, autoBackup: system.autoBackup,
          maintenanceMode: system.maintenanceMode,
        }));
      }
      await Promise.all(saves);
      refreshSystem();
      showToast("System settings saved.");
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to save settings", "error");
    } finally { setLoad("system", false); }
  };

  const handleRunBackup = async () => {
    setLoad("backup", true);
    try {
      const r = await triggerBackup();
      setBackup(prev => ({ ...prev, lastBackup: r.data.record }));
      showToast("Backup completed successfully.");
    } catch (err) {
      showToast(err.response?.data?.error || "Backup failed", "error");
    } finally { setLoad("backup", false); }
  };

  const avatarInitials = `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase() || user?.name?.[0]?.toUpperCase() || "U";

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-violet-600 to-indigo-600 px-6 py-5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_65%)] pointer-events-none" />
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute right-24 -bottom-6 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{t("Settings")}</h1>
            <p className="text-sm text-violet-200 mt-0.5">{t("Manage your account and system preferences")}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white">{profile.firstName} {profile.lastName}</p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className="text-[11px] text-violet-200 capitalize">{user?.role?.replace("_", " ")}</span>
                <span className="text-violet-300">·</span>
                <span className="text-[11px] text-violet-200">{profile.company_name}</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 flex-shrink-0">
              <span className="text-lg font-bold text-white">{avatarInitials}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-5">

        {/* ── Sidebar nav ── */}
        <div className="md:w-52 flex-shrink-0">
          <nav className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-2 space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left group ${
                    active
                      ? "bg-gradient-to-r from-violet-600 to-violet-500 shadow-lg shadow-violet-500/20 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                    active ? "bg-white/20" : "bg-gray-100 dark:bg-gray-800 group-hover:bg-violet-50 dark:group-hover:bg-violet-900/20"
                  }`}>
                    <Icon size={15} className={active ? "text-white" : "text-gray-500 dark:text-gray-400 group-hover:text-violet-500"} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-none">{t(tab.label)}</p>
                    <p className={`text-[10px] mt-1 leading-none ${active ? "text-violet-200" : "text-gray-400 dark:text-gray-600"}`}>
                      {tab.desc}
                    </p>
                  </div>
                  {active && <ChevronRight size={14} className="ml-auto text-violet-200" />}
                </button>
              );
            })}
          </nav>

          {/* Quick info card */}
          <div className="mt-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">Account Info</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <AtSign size={12} className="text-gray-400 flex-shrink-0" />
                <span className="text-[11px] text-gray-600 dark:text-gray-400 truncate">{profile.email || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 size={12} className="text-gray-400 flex-shrink-0" />
                <span className="text-[11px] text-gray-600 dark:text-gray-400 truncate">{profile.company_name || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                <span className="text-[11px] text-gray-600 dark:text-gray-400 truncate">{profile.timezone || "—"}</span>
              </div>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${ROLE_STYLE[user?.role] || ROLE_STYLE.employee}`}>
              <ShieldCheck size={10} />
              {user?.role?.replace("_", " ")}
            </div>
          </div>
        </div>

        {/* ── Content area ── */}
        <div className="flex-1 space-y-4 min-w-0">

          {/* ── PROFILE ────────────────────────────────────────────────────── */}
          {activeTab === "profile" && (
            <>
              {/* Avatar card */}
              <SectionCard>
                <div className="relative overflow-hidden h-24 bg-gradient-to-br from-violet-500 to-indigo-600">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.15),transparent_70%)]" />
                </div>
                <div className="px-6 pb-5 -mt-10">
                  <div className="flex items-end justify-between">
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center border-4 border-white dark:border-gray-900 shadow-xl">
                      <span className="text-2xl font-black text-white">{avatarInitials}</span>
                    </div>
                    <div className={`mb-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider ${ROLE_STYLE[user?.role] || ROLE_STYLE.employee}`}>
                      <ShieldCheck size={12} />
                      {user?.role?.replace("_", " ")}
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{profile.firstName} {profile.lastName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>
                  </div>
                </div>
              </SectionCard>

              {/* Form */}
              <SectionCard>
                <SectionHeader icon={User} title={t("Profile Settings")} desc="Update your personal information" accent="violet" />
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>{t("First Name")}</label>
                      <input className={inputCls} placeholder="First name" value={profile.firstName}
                        onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelCls}>{t("Last Name")}</label>
                      <input className={inputCls} placeholder="Last name" value={profile.lastName}
                        onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelCls}><span className="flex items-center gap-1"><AtSign size={10} />{t("Email Address")}</span></label>
                      <input type="email" className={inputCls} placeholder="email@company.com" value={profile.email}
                        onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelCls}><span className="flex items-center gap-1"><Building2 size={10} />{t("Company")}</span></label>
                      <input className={inputCls} placeholder="Company name" value={profile.company_name}
                        onChange={e => setProfile(p => ({ ...p, company_name: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}><span className="flex items-center gap-1"><MapPin size={10} />{t("Timezone")}</span></label>
                      <select className={inputCls} value={profile.timezone}
                        onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}>
                        {TIMEZONES.map(tz => <option key={tz}>{tz}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <SaveButton onClick={handleSaveProfile} loading={loading.profile} />
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {/* ── NOTIFICATIONS ───────────────────────────────────────────────── */}
          {activeTab === "notifications" && (
            <SectionCard>
              <SectionHeader icon={Bell} title={t("Notification Preferences")} desc="Control when and how you get notified" accent="blue" />
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {[
                  { section: "Email Notifications", icon: Mail, accent: "blue", items: [
                    { key: "emailOrders",   label: "New Orders",    desc: "Get notified when a new order is placed",        icon: Package },
                    { key: "emailPayments", label: "Payment Updates", desc: "Alerts for payment status changes",            icon: Calendar },
                    { key: "emailAlerts",   label: "System Alerts", desc: "Important system notifications via email",      icon: AlertCircle },
                  ]},
                  { section: "Browser Notifications", icon: Smartphone, accent: "violet", items: [
                    { key: "browserOrders",   label: "New Orders",    desc: "Desktop push for new orders",                 icon: Package },
                    { key: "browserPayments", label: "Payment Updates", desc: "Desktop push for payment changes",          icon: Calendar },
                    { key: "browserAlerts",   label: "System Alerts", desc: "Desktop push for critical alerts",           icon: AlertCircle },
                  ]},
                  { section: "Business Events", icon: Building2, accent: "green", items: [
                    { key: "lowStock",    label: "Low Stock Alerts",           desc: "Alert when products reach reorder level", icon: Package },
                    { key: "newCustomer", label: "New Customer Registrations", desc: "Notify on new customer sign-ups",         icon: UserPlus },
                    { key: "reportReady", label: "Report Ready",               desc: "Notify when scheduled reports are ready", icon: FileBarChart },
                  ]},
                ].map(({ section, icon: SIcon, accent, items }) => {
                  const accentMap = {
                    blue:   { label: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",   bar: "bg-blue-500" },
                    violet: { label: "text-violet-500 bg-violet-50 dark:bg-violet-900/20", bar: "bg-violet-500" },
                    green:  { label: "text-green-500 bg-green-50 dark:bg-green-900/20", bar: "bg-green-500" },
                  };
                  const ac = accentMap[accent];
                  return (
                    <div key={section} className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${ac.label}`}>
                          <SIcon size={12} className={ac.label.split(" ")[0]} />
                        </div>
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t(section)}</h3>
                      </div>
                      <div className="space-y-1">
                        {items.map(({ key, label, desc, icon: IIcon }) => (
                          <div key={key}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                <IIcon size={14} className="text-gray-400 dark:text-gray-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-600">{desc}</p>
                              </div>
                            </div>
                            <Toggle checked={!!notifs[key]} onChange={v => setNotifs(n => ({ ...n, [key]: v }))} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-6 py-4 border-t border-gray-50 dark:border-gray-800 flex justify-end bg-gray-50/40 dark:bg-gray-900/40">
                <SaveButton onClick={handleSaveNotifications} loading={loading.notifs} label={t("Save Preferences")} />
              </div>
            </SectionCard>
          )}

          {/* ── SECURITY ────────────────────────────────────────────────────── */}
          {activeTab === "security" && (
            <>
              {/* Password */}
              <SectionCard>
                <SectionHeader icon={Key} title={t("Change Password")} desc="Use a strong, unique password" accent="red" />
                <div className="p-6">
                  <div className="space-y-3 max-w-sm">
                    {[
                      { key: "current", label: "Current Password",     placeholder: "Enter current password" },
                      { key: "next",    label: "New Password",          placeholder: "At least 6 characters" },
                      { key: "confirm", label: "Confirm New Password",  placeholder: "Repeat new password" },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className={labelCls}>{t(label)}</label>
                        <div className="relative">
                          <input
                            type={showPw[key] ? "text" : "password"}
                            className={inputCls + " pr-10"}
                            placeholder={placeholder}
                            value={passwords[key]}
                            onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                          />
                          <button type="button"
                            onClick={() => setShowPw(s => ({ ...s, [key]: !s[key] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                            {showPw[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5">
                    <SaveButton onClick={handleChangePassword} loading={loading.pw} label={t("Update Password")} />
                  </div>
                </div>
              </SectionCard>

              {/* 2FA */}
              <SectionCard>
                <SectionHeader icon={ShieldCheck} title={t("Two-Factor Authentication")} desc="Add an extra layer of security with TOTP" accent="green" />
                <div className="p-6">
                  {twoFactorEnabled && twoFAStep === "idle" && (
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/10 border border-green-100 dark:border-green-800/40 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                          <ShieldCheck size={20} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-green-800 dark:text-green-300">2FA is enabled</p>
                          <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">Your account is protected with a TOTP authenticator app.</p>
                        </div>
                      </div>
                      <button onClick={handleDisable2FA} disabled={loading["2fa"]}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium">
                        <ShieldOff size={13} /> Disable
                      </button>
                    </div>
                  )}

                  {!twoFactorEnabled && twoFAStep === "idle" && (
                    <div className="flex items-center gap-4 p-4 bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-2xl">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <ShieldOff size={18} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">2FA is not enabled</p>
                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Enable two-factor authentication to better protect your account.</p>
                      </div>
                      <button onClick={handleSetup2FA} disabled={loading["2fa"]}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-60 transition-all shadow-lg shadow-violet-500/25 flex-shrink-0">
                        {loading["2fa"] ? <Loader size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                        Set Up 2FA
                      </button>
                    </div>
                  )}

                  {twoFAStep === "verify" && (
                    <div className="space-y-5 max-w-sm">
                      <div className="flex items-start gap-3 p-3.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/40">
                        <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">1</span>
                        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
                      </div>
                      {qrData && <img src={qrData} alt="2FA QR Code" className="border border-gray-200 dark:border-gray-700 rounded-2xl p-3 w-48 h-48 bg-white" />}
                      <div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1.5 font-medium">Or enter this key manually:</p>
                        <code className="block bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-xs font-mono break-all text-gray-700 dark:text-gray-300">{twoFASecret}</code>
                      </div>
                      <div className="flex items-start gap-3 p-3.5 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800/40">
                        <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">2</span>
                        <p className="text-xs text-violet-700 dark:text-violet-300 font-medium">Enter the 6-digit code from the app to verify and enable 2FA</p>
                      </div>
                      <input
                        type="text" maxLength={6}
                        className={inputCls + " tracking-[0.5em] text-xl text-center font-bold w-44"}
                        placeholder="000000"
                        value={twoFAToken}
                        onChange={e => setTwoFAToken(e.target.value.replace(/\D/g, ""))}
                      />
                      <div className="flex gap-3">
                        <SaveButton onClick={handleVerify2FA} loading={loading["2fa"]} label="Verify & Enable" />
                        <button onClick={() => { setTwoFAStep("idle"); setTwoFAToken(""); }}
                          className="px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* Session */}
              <SectionCard>
                <SectionHeader icon={Timer} title={t("Session Settings")} desc="Control session timeout and password expiry" accent="amber" />
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-sm">
                    <div>
                      <label className={labelCls}><span className="flex items-center gap-1"><Clock size={10} />{t("Session Timeout")}</span></label>
                      <select className={inputCls} value={secPrefs.sessionTimeout}
                        onChange={e => setSecPrefs(s => ({ ...s, sessionTimeout: e.target.value }))}>
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">60 minutes</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}><span className="flex items-center gap-1"><Calendar size={10} />{t("Password Expiry")}</span></label>
                      <select className={inputCls} value={secPrefs.passwordExpiry}
                        onChange={e => setSecPrefs(s => ({ ...s, passwordExpiry: e.target.value }))}>
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                        <option value="never">Never</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-5">
                    <SaveButton onClick={handleSaveSecurityPrefs} loading={loading.secPrefs} label={t("Save Session Settings")} />
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {/* ── SYSTEM ──────────────────────────────────────────────────────── */}
          {activeTab === "system" && (
            <>
              {/* ── Appearance ── */}
              <SectionCard>
                <SectionHeader icon={Sun} title={t("Appearance")} desc="Choose your preferred interface theme" accent="violet" />
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      {
                        value: "Light", icon: Sun, label: "Light", desc: "Clean & bright",
                        previewBg: "#F1F3F9",
                        sidebar: "#EDE9FE", sidebarAccent: "#7C3AED",
                        card: "#FFFFFF", cardBorder: "#E5E7EB",
                        bar1: "#7C3AED", bar2: "#10B981", bar3: "#F59E0B",
                        textLine: "#D1D5DB",
                      },
                      {
                        value: "Dark", icon: Moon, label: "Dark", desc: "Easy on eyes",
                        previewBg: "#0E1015",
                        sidebar: "#111318", sidebarAccent: "#7C3AED",
                        card: "#161B26", cardBorder: "rgba(255,255,255,0.07)",
                        bar1: "#7C3AED", bar2: "#10B981", bar3: "#F59E0B",
                        textLine: "rgba(255,255,255,0.08)",
                      },
                      {
                        value: "Auto", icon: Monitor, label: "System", desc: "Follows OS setting",
                        previewBg: "linear-gradient(110deg,#F1F3F9 50%,#0E1015 50%)",
                        sidebar: "#7C3AED", sidebarAccent: "#6D28D9",
                        card: "#FFFFFF", cardBorder: "#E5E7EB",
                        bar1: "#7C3AED", bar2: "#10B981", bar3: "#F59E0B",
                        textLine: "#D1D5DB",
                      },
                    ].map(({ value, icon: TIcon, label, desc, previewBg, sidebar, sidebarAccent, card, cardBorder, bar1, bar2, bar3, textLine }) => {
                      const active = system.theme === value;
                      return (
                        <button key={value}
                          onClick={() => { setSystem(s => ({ ...s, theme: value })); applyTheme(value); }}
                          className={`relative overflow-hidden rounded-2xl border-2 transition-all text-left group
                            ${active
                              ? "border-violet-500 shadow-2xl shadow-violet-500/25 scale-[1.02]"
                              : "border-gray-100 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg"
                            }`}>

                          {/* Mini UI preview */}
                          <div className="relative h-28 overflow-hidden" style={{ background: previewBg }}>
                            {/* Sidebar */}
                            <div className="absolute left-0 top-0 bottom-0 w-9 flex flex-col pt-2 px-1.5 gap-1" style={{ background: sidebar }}>
                              <div className="w-5 h-5 rounded-md mb-1" style={{ background: sidebarAccent }} />
                              {[1,2,3,4].map(i => (
                                <div key={i} className={`h-2 rounded-full`} style={{ width: `${60 + i*8}%`, background: i === 1 ? sidebarAccent : 'rgba(255,255,255,0.15)' }} />
                              ))}
                            </div>
                            {/* Content */}
                            <div className="absolute left-11 top-2.5 right-2 space-y-2">
                              {/* Stat cards */}
                              <div className="grid grid-cols-3 gap-1">
                                {[bar1, bar2, bar3].map((c, i) => (
                                  <div key={i} className="h-7 rounded-lg" style={{ background: card, border: `1px solid ${cardBorder}` }}>
                                    <div className="m-1.5 h-1.5 rounded-full w-3" style={{ background: c }} />
                                    <div className="mx-1.5 h-2 rounded-full w-5" style={{ background: textLine }} />
                                  </div>
                                ))}
                              </div>
                              {/* Chart card */}
                              <div className="h-10 rounded-lg p-1.5" style={{ background: card, border: `1px solid ${cardBorder}` }}>
                                <div className="flex items-end gap-0.5 h-full">
                                  {[4,7,5,8,6,9,7].map((h, i) => (
                                    <div key={i} className="flex-1 rounded-sm" style={{ height: `${h * 9}%`, background: bar1, opacity: 0.5 + i * 0.07 }} />
                                  ))}
                                </div>
                              </div>
                            </div>
                            {/* Active badge */}
                            {active && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/40">
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Label */}
                          <div className={`px-4 py-3 flex items-center justify-between transition-colors ${
                            active
                              ? "bg-violet-50 dark:bg-violet-900/25"
                              : "bg-white dark:bg-gray-900 group-hover:bg-gray-50 dark:group-hover:bg-gray-800"
                          }`}>
                            <div>
                              <p className={`text-sm font-bold ${active ? "text-violet-700 dark:text-violet-300" : "text-gray-800 dark:text-gray-200"}`}>{t(label)}</p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">{desc}</p>
                            </div>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              active ? "bg-violet-100 dark:bg-violet-900/40" : "bg-gray-100 dark:bg-gray-800"
                            }`}>
                              <TIcon size={13} className={active ? "text-violet-600 dark:text-violet-400" : "text-gray-400"} />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </SectionCard>

              {/* ── Localization ── */}
              <SectionCard>
                <SectionHeader icon={Globe} title={t("Localization")} desc="Currency, date format and language preferences" accent="blue" />
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {[
                      { label: "Currency",    key: "currency",   icon: "💱", options: ["USD","EUR","GBP","JPY","CAD","CHF","AUD"],
                        preview: { USD:"$", EUR:"€", GBP:"£", JPY:"¥", CAD:"CA$", CHF:"CHF", AUD:"A$" } },
                      { label: "Date Format", key: "dateFormat", icon: "📅", options: ["MM/DD/YYYY","DD/MM/YYYY","YYYY-MM-DD"],
                        preview: null },
                      { label: "Language",    key: "language",   icon: "🌐", options: ["English","Spanish","French","German","Arabic","Portuguese","Albanian"],
                        preview: null },
                    ].map(({ label, key, icon, options }) => (
                      <div key={key} className="group">
                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          <span>{icon}</span>{t(label)}
                        </label>
                        <div className="relative">
                          <select
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-3 pr-9 text-sm font-medium
                              focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400
                              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all appearance-none cursor-pointer
                              hover:border-violet-300 dark:hover:border-violet-600"
                            value={system[key]}
                            onChange={e => { const val = e.target.value; setSystem(s => ({ ...s, [key]: val })); updateSettings({ [key]: val }); }}
                          >
                            {options.map(o => <option key={o} value={o}>{t(o)}</option>)}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                              <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-6">
                    <SaveButton onClick={handleSaveSystem} loading={loading.system} />
                  </div>
                </div>
              </SectionCard>

              {/* ── Maintenance ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Backup card */}
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                  <div className="relative overflow-hidden px-5 py-4 bg-gradient-to-br from-green-50 to-emerald-50/30 dark:from-green-900/15 dark:to-emerald-900/5 border-b border-green-100 dark:border-green-900/30">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Database size={16} className="text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Database Backup</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-0.5">Automatic & on-demand backups</p>
                      </div>
                      <Toggle checked={system.autoBackup} onChange={v => setSystem(s => ({ ...s, autoBackup: v }))} disabled={!isAdmin} />
                    </div>
                  </div>

                  <div className="px-5 py-4 space-y-3">
                    {/* Schedule */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Schedule</span>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                        system.autoBackup
                          ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                      }`}>
                        {system.autoBackup ? backup.nextScheduled : "Disabled"}
                      </span>
                    </div>

                    {/* Last backup */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={13} className="text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Last backup</span>
                      </div>
                      {backup.lastBackup ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${backup.lastBackup.status === "completed" ? "bg-green-500" : "bg-red-500"}`} />
                          <span className={`text-xs font-semibold ${backup.lastBackup.status === "completed" ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                            {backup.lastBackup.status}
                          </span>
                          {backup.lastBackup.size_kb > 0 && (
                            <span className="text-xs text-gray-400">· {backup.lastBackup.size_kb} KB</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No backups yet</span>
                      )}
                    </div>

                    {backup.lastBackup && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar size={13} className="text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">Timestamp</span>
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          {new Date(backup.lastBackup.created_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="px-5 pb-5">
                    <button
                      onClick={handleRunBackup}
                      disabled={loading.backup}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all
                        bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-500/20
                        hover:shadow-violet-500/35 hover:-translate-y-px active:translate-y-0 disabled:opacity-50"
                    >
                      {loading.backup ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      {loading.backup ? t("Running backup…") : t("Run Backup Now")}
                    </button>
                  </div>
                </div>

                {/* Maintenance mode card */}
                <div className={`relative overflow-hidden rounded-2xl border-2 transition-all ${
                  system.maintenanceMode
                    ? "border-amber-400/60 dark:border-amber-600/40 bg-gradient-to-br from-amber-50 to-orange-50/40 dark:from-amber-900/15 dark:to-orange-900/5"
                    : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
                }`}>
                  {system.maintenanceMode && (
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.08),transparent_70%)] pointer-events-none" />
                  )}

                  <div className="relative p-5 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        system.maintenanceMode
                          ? "bg-amber-100 dark:bg-amber-900/30"
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}>
                        <Clock size={16} className={system.maintenanceMode ? "text-amber-600 dark:text-amber-400" : "text-gray-400"} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Maintenance Mode</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-0.5">Restrict user access temporarily</p>
                      </div>
                      <Toggle checked={system.maintenanceMode} onChange={v => setSystem(s => ({ ...s, maintenanceMode: v }))} disabled={!isAdmin} />
                    </div>
                  </div>

                  <div className="relative p-5 space-y-3">
                    {system.maintenanceMode ? (
                      <>
                        <div className="flex items-center gap-2.5 p-3 bg-amber-100/60 dark:bg-amber-900/20 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
                          <div className="relative flex h-2.5 w-2.5 flex-shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                          </div>
                          <p className="text-xs font-bold text-amber-800 dark:text-amber-300">System is in maintenance mode</p>
                        </div>
                        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                          Users are currently blocked from accessing the platform. Disable maintenance mode to restore access.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          When enabled, all non-admin users will see a maintenance page. Use this when performing updates or database migrations.
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            "Blocks all non-admin user logins",
                            "Shows a maintenance page to users",
                            "Admins retain full access",
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                              <p className="text-[11px] text-gray-400 dark:text-gray-600">{item}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {!isAdmin && (
                      <p className="text-[11px] text-gray-400 dark:text-gray-600 italic pt-1">
                        Only administrators can toggle maintenance mode.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
