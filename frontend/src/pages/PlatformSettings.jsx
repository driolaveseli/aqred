import { useState, useEffect } from "react";
import { Clock, CheckCircle, X } from "lucide-react";
import PageHeader from "../components/UI/PageHeader";
import Toggle from "../components/UI/Toggle";
import { getMaintenanceMode, setMaintenanceMode } from "../services/superAdminService";

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 z-50 animate-toast-in flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
    ${type === "success" ? "bg-green-50 dark:bg-emerald-900/30 text-green-700 dark:text-emerald-300 border border-green-100 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800"}`}>
    <CheckCircle size={16} /> {msg}
    <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
  </div>
);

const PlatformSettings = () => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    getMaintenanceMode()
      .then(({ data }) => setEnabled(data.enabled))
      .catch(() => showToast("Failed to load platform settings.", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (next) => {
    setSaving(true);
    try {
      await setMaintenanceMode(next);
      setEnabled(next);
      showToast(next ? "Maintenance mode enabled." : "Maintenance mode disabled.");
    } catch {
      showToast("Failed to update maintenance mode.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Platform Settings"
        subtitle="Controls that apply to the entire platform, across every company"
        badges={enabled ? [{ icon: Clock, label: "Maintenance mode active", tone: "amber" }] : []}
      />

      {!loading && (
        <div className={`relative overflow-hidden rounded-2xl border-2 transition-all ${
          enabled
            ? "border-amber-400/60 dark:border-amber-600/40 bg-gradient-to-br from-amber-50 to-orange-50/40 dark:from-amber-900/15 dark:to-orange-900/5"
            : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
        }`}>
          {enabled && (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.08),transparent_70%)] pointer-events-none" />
          )}

          <div className="relative p-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                enabled ? "bg-amber-100 dark:bg-amber-900/30" : "bg-gray-100 dark:bg-gray-800"
              }`}>
                <Clock size={16} className={enabled ? "text-amber-600 dark:text-amber-400" : "text-gray-400"} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Maintenance Mode</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-0.5">
                  Restrict access for every company on the platform
                </p>
              </div>
              <Toggle checked={enabled} onChange={handleToggle} disabled={saving} />
            </div>
          </div>

          <div className="relative p-5 space-y-3">
            {enabled ? (
              <>
                <div className="flex items-center gap-2.5 p-3 bg-amber-100/60 dark:bg-amber-900/20 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
                  <div className="relative flex h-2.5 w-2.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                  </div>
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300">The platform is in maintenance mode</p>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  Every company's non-admin users are currently blocked from accessing the platform. Disable maintenance mode to restore access.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  When enabled, non-admin users at every company will see a maintenance page. Use this platform-wide, for updates or database migrations.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "Blocks non-admin logins across every company",
                    "Shows a maintenance page to those users",
                    "Company admins and Super Admins retain full access",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                      <p className="text-[11px] text-gray-400 dark:text-gray-600">{item}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default PlatformSettings;
