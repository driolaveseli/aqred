import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import Sidebar from "../components/Navigation/Sidebar";
import Navbar  from "../components/Navigation/Navbar";
import CommandPalette from "../components/CommandPalette/CommandPalette";
import MaintenancePage from "../pages/MaintenancePage";
import { getPreferences } from "../services/settingsService";
import { useSystem } from "../context/SystemContext";
import { useAuth } from "../context/AuthContext";
import useEscapeKey from "../hooks/useEscapeKey";

const applyTheme = (t) => {
  const isDark = (t || "light").toLowerCase() === "dark";
  document.documentElement.classList.toggle("dark", isDark);
};

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const { maintenanceMode } = useSystem();
  const { user, logout } = useAuth();

  useEscapeKey(confirmingSignOut, () => setConfirmingSignOut(false));

  // Shared by the navbar account menu and the command palette's "Sign Out"
  // quick action - one confirm dialog, one place that actually calls logout,
  // instead of each entry point owning (and possibly diverging on) its own.
  const handleSignOut = async () => {
    setConfirmingSignOut(false);
    await logout();
    navigate("/login");
  };

  // Apply persisted theme on every mount (instant from localStorage, confirmed from DB)
  useEffect(() => {
    const cached = localStorage.getItem("mis_theme");
    if (cached) applyTheme(cached);
    getPreferences()
      .then(r => {
        const theme = r.data.theme || "Light";
        localStorage.setItem("mis_theme", theme);
        applyTheme(theme);
      })
      .catch(() => {});
  }, []);

  // Global Cmd+K / Ctrl+K shortcut for the command palette
  const handleGlobalKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setPaletteOpen((v) => !v);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  // Show maintenance page for non-admin users when maintenance mode is on
  if (maintenanceMode && user?.role !== "admin" && user?.role !== "super_admin") {
    return <MaintenancePage />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          onMenuToggle={() => setMobileOpen((v) => !v)}
          onOpenPalette={() => setPaletteOpen(true)}
          onRequestSignOut={() => setConfirmingSignOut(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 dark:bg-gray-950">{children}</main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onRequestSignOut={() => setConfirmingSignOut(true)}
      />

      {/* Sign-out confirm - shared by the navbar account menu and the command
          palette's Sign Out action. A data-entry app makes losing unsaved
          work a real cost of a misclick, unlike consumer apps where
          re-logging in is free, so this earns the one extra click. */}
      {confirmingSignOut && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmingSignOut(false); }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogOut size={22} className="text-violet-500 dark:text-violet-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Sign out?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Any unsaved changes on this page will be lost.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmingSignOut(false)} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95">Cancel</button>
              <button onClick={handleSignOut} className="flex-1 px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 active:scale-95">Sign out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
