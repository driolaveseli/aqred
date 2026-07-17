import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SystemProvider } from "./context/SystemContext";
import ErrorBoundary from "./components/ErrorBoundary";
import PrivateRoute from "./components/PrivateRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FeaturesPage from "./pages/FeaturesPage";
import DocumentationPage from "./pages/DocumentationPage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import TermsPage from "./pages/TermsPage";
import ChangePasswordRequired from "./pages/ChangePasswordRequired";
import Dashboard from "./pages/Dashboard";
import ActivityFeed from "./pages/ActivityFeed";
import Staff from "./pages/Staff";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Suppliers from "./pages/Suppliers";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Payments from "./pages/Payments";
import Invoices from "./pages/Invoices";
import CustomerReports from "./pages/CustomerReports";
import EmployeeReports from "./pages/EmployeeReports";
import RevenueAnalytics from "./pages/RevenueAnalytics";
import CompanyManagement from "./pages/CompanyManagement";
import RolesPermissions from "./pages/RolesPermissions";
import SystemLogs from "./pages/SystemLogs";
import Settings from "./pages/Settings";
import Maintenance from "./pages/Maintenance";
import NotFound from "./pages/NotFound";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

// Wraps a page in DashboardLayout + PrivateRoute.
// permission     — named permission the user must have (checked against user.permissions[])
// requireAdmin   — hard-lock to admin role regardless of permissions config
// superAdminOnly — only accessible by super_admin role
const Protected = ({ children, permission, requireAdmin, superAdminOnly }) => (
  <PrivateRoute
    permission={permission}
    allowedRoles={requireAdmin ? ["admin"] : undefined}
    superAdminOnly={superAdminOnly}
  >
    <DashboardLayout>{children}</DashboardLayout>
  </PrivateRoute>
);

const App = () => (
  <ErrorBoundary>
  <AuthProvider>
    <SystemProvider>
    <Router>
      <ScrollToTop />
      <Routes>
        {/* ── Public ──────────────────────────────────────────────────── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/documentation" element={<DocumentationPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* ── Forced password change (standalone, no DashboardLayout) ────── */}
        <Route path="/change-password" element={<PrivateRoute><ChangePasswordRequired /></PrivateRoute>} />

        {/* ── Dashboard ────────────────────────────────────────────────── */}
        <Route path="/dashboard"     element={<Protected permission="View Dashboard"><Dashboard /></Protected>} />
        <Route path="/activity-feed" element={<Protected permission="View Dashboard"><ActivityFeed /></Protected>} />

        {/* ── Management ───────────────────────────────────────────────── */}
        <Route path="/customers" element={<Protected permission="Manage Customers"><Customers /></Protected>} />
        <Route path="/products"  element={<Protected permission="Manage Products"><Products /></Protected>} />
        <Route path="/orders"    element={<Protected permission="Manage Orders"><Orders /></Protected>} />
        <Route path="/suppliers" element={<Protected permission="Manage Suppliers"><Suppliers /></Protected>} />

        {/* ── Business Operations ──────────────────────────────────────── */}
        <Route path="/inventory" element={<Protected permission="View Inventory"><Inventory /></Protected>} />
        <Route path="/sales"     element={<Protected permission="View Sales"><Sales /></Protected>} />
        <Route path="/invoices"  element={<Protected permission="Manage Invoices"><Invoices /></Protected>} />
        <Route path="/payments"  element={<Protected permission="Manage Payments"><Payments /></Protected>} />

        {/* ── Reports & Analytics ──────────────────────────────────────── */}
        <Route path="/reports/sales"     element={<Navigate to="/sales" replace />} />
        <Route path="/reports/customers" element={<Protected permission="View Reports"><CustomerReports /></Protected>} />
        <Route path="/reports/employees" element={<Protected permission="View Reports"><EmployeeReports /></Protected>} />
        <Route path="/reports/revenue"   element={<Protected permission="View Reports"><RevenueAnalytics /></Protected>} />

        {/* ── Administration ───────────────────────────────────────────── */}
        <Route path="/staff"       element={<Protected requireAdmin><Staff /></Protected>} />
        <Route path="/admin/roles" element={<Protected requireAdmin><RolesPermissions /></Protected>} />
        <Route path="/admin/logs"  element={<Protected requireAdmin><SystemLogs /></Protected>} />

        {/* ── Settings (all authenticated users) ────────────────────────── */}
        <Route path="/settings" element={<Protected><Settings /></Protected>} />

        {/* ── Super Admin ────────────────────────────────────────────────── */}
        <Route path="/super-admin/companies" element={<Protected superAdminOnly><CompanyManagement /></Protected>} />
        <Route path="/super-admin/logs"      element={<Protected superAdminOnly><SystemLogs /></Protected>} />

        {/* ── Maintenance (public — shown when system is under maintenance) ── */}
        <Route path="/maintenance" element={<Maintenance />} />

        {/* ── Catch-all ─────────────────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
    </SystemProvider>
  </AuthProvider>
  </ErrorBoundary>
);

export default App;
