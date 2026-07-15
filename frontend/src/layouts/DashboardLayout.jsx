import { useState, useEffect } from "react";
import Sidebar from "../components/Navigation/Sidebar";
import Navbar  from "../components/Navigation/Navbar";
import MaintenancePage from "../pages/MaintenancePage";
import { getPreferences } from "../services/settingsService";
import { useSystem } from "../context/SystemContext";
import { useAuth } from "../context/AuthContext";

const applyTheme = (t) => {
  const isDark = (t || "light").toLowerCase() === "dark";
  document.documentElement.classList.toggle("dark", isDark);
};

const DashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { maintenanceMode } = useSystem();
  const { user } = useAuth();

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
        <Navbar onMenuToggle={() => setMobileOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 dark:bg-gray-950">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
