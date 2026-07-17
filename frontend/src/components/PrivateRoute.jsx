import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * allowedRoles  — legacy role-based check (kept for any routes that still use it)
 * permission    — named permission string; user must have it in their permissions array
 * superAdminOnly — route is only for super_admin role
 * Either prop can be omitted. Both can be combined (both must pass).
 */
const PrivateRoute = ({ children, allowedRoles, permission, superAdminOnly }) => {
  const { isAuthenticated, user, hasPermission } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin-provisioned temporary password not yet replaced — block everything
  // else until it is (mirrors the backend's requirePasswordChange gate).
  if (user?.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  const isSuperAdmin = user?.role === "super_admin";

  // super_admin can only access super-admin routes — but never bounce them
  // off of /change-password itself, or a super_admin with a pending forced
  // password change would loop forever between this redirect and the one above.
  if (isSuperAdmin && !superAdminOnly && location.pathname !== "/change-password") {
    return <Navigate to="/super-admin/companies" replace />;
  }

  // non-super_admin cannot access super-admin-only routes
  if (superAdminOnly && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;
