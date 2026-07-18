import { NavLink } from "react-router-dom";
import {
  Settings, ChevronLeft, ChevronRight, Building2, X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useSystem } from "../../context/SystemContext";
import { NAV_GROUPS, SUPER_ADMIN_GROUPS } from "../../config/navigation";
import { ROLE_CONFIG, getInitials } from "../../utils/roleDisplay";

/* ─── Avatar ────────────────────────────────────────────────────────────── */
const Avatar = ({ name, size = "md" }) => (
  <div className={`
    rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center
    flex-shrink-0 ring-2 ring-white dark:ring-gray-900 shadow-sm select-none
    ${size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-[11px]"}
  `}>
    <span className="text-white font-bold tracking-wide">{getInitials(name)}</span>
  </div>
);

/* ─── NavItem ───────────────────────────────────────────────────────────── */
/*
 * Both active and inactive always define a background-color so CSS
 * transition-colors can animate between them with no flash.
 * outline-none prevents the browser from leaving a focus ring after click.
 */
const NavItem = ({ item, expanded, t }) => {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      end={item.path === "/dashboard"}
      title={!expanded ? item.name : undefined}
      className={({ isActive }) =>
        [
          /* layout */
          "group relative flex items-center rounded-xl text-sm font-medium",
          "select-none outline-none",
          expanded ? "gap-3 px-3 py-[9px]" : "justify-center p-[9px]",
          /* always-present bg so transition-colors has two defined values */
          "transition-colors duration-200 ease-out",
          isActive
            ? expanded
              ? "bg-gradient-to-r from-violet-50 to-white/0 dark:from-violet-900/30 dark:to-transparent text-violet-700 dark:text-violet-300"
              : "bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-lg shadow-violet-400/30"
            : "bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-800 dark:hover:text-gray-100",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          {/* Left accent bar — only in expanded mode */}
          {expanded && (
            <span
              className={[
                "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full",
                "transition-all duration-300",
                isActive
                  ? "h-6 opacity-100 bg-gradient-to-b from-violet-400 to-violet-700"
                  : "h-0 opacity-0",
              ].join(" ")}
            />
          )}

          {/* Icon */}
          <Icon
            size={16}
            className={[
              "flex-shrink-0 transition-colors duration-200",
              isActive
                ? (expanded ? "text-violet-600 dark:text-violet-400" : "text-white")
                : "text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300",
            ].join(" ")}
          />

          {/* Label */}
          {expanded && (
            <span className="truncate leading-none">{t(item.name)}</span>
          )}

        </>
      )}
    </NavLink>
  );
};

/* ─── NavGroup ──────────────────────────────────────────────────────────── */
const NavGroup = ({ group, expanded, isFirst, t }) => (
  <div className={isFirst ? "mb-1" : "mt-5 mb-1"}>
    {expanded ? (
      <div className="flex items-center gap-2 px-3 pb-1.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-600 select-none whitespace-nowrap">
          {t(group.label)}
        </p>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-200/70 to-transparent dark:from-gray-700/60" />
      </div>
    ) : (
      !isFirst && <div className="my-2 mx-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700" />
    )}
    <div className="space-y-0.5">
      {group.items.map((item) => (
        <NavItem key={item.path} item={item} expanded={expanded} t={t} />
      ))}
    </div>
  </div>
);

/* ─── SettingsLink ──────────────────────────────────────────────────────── */
const SettingsLink = ({ expanded, t }) => (
  <NavLink
    to="/settings"
    title={!expanded ? "Settings" : undefined}
    className={({ isActive }) =>
      [
        "group relative flex items-center rounded-xl text-sm font-medium",
        "select-none outline-none transition-colors duration-200 ease-out",
        expanded ? "gap-3 px-3 py-[9px]" : "justify-center p-[9px]",
        isActive
          ? "bg-violet-50 dark:bg-violet-900/25 text-violet-700 dark:text-violet-300"
          : "bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-800 dark:hover:text-gray-100",
      ].join(" ")
    }
  >
    {({ isActive }) => (
      <>
        {expanded && (
          <span className={[
            "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-200",
            isActive ? "h-5 bg-violet-500 opacity-100" : "h-0 opacity-0",
          ].join(" ")} />
        )}
        <Settings
          size={16}
          className={[
            "flex-shrink-0 transition-colors duration-200",
            isActive
              ? "text-violet-600 dark:text-violet-400"
              : "text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300",
          ].join(" ")}
        />
        {expanded && <span className="leading-none">{t("Settings")}</span>}
      </>
    )}
  </NavLink>
);

/* ─── UserCard ──────────────────────────────────────────────────────────── */
/* Sign out lives in the Navbar's account menu (the one identity touchpoint
 * that's always visible, on every screen size and sidebar state) rather than
 * duplicated here as a second, inconsistent entry point. */
const UserCard = ({ user, role, expanded, t }) => {
  const rc = ROLE_CONFIG[role] || ROLE_CONFIG.employee;
  return (
    <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 px-2 pt-2 pb-3 space-y-0.5">
      <SettingsLink expanded={expanded} t={t} />

      <div className="pt-2">
        {expanded ? (
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl
            bg-gradient-to-br from-violet-50/80 via-white to-indigo-50/40
            dark:from-violet-900/20 dark:via-gray-800/50 dark:to-indigo-900/10
            border border-violet-100/70 dark:border-violet-800/30
            shadow-sm shadow-violet-100/50">
            <Avatar name={user?.name || "User"} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 truncate leading-snug">
                {user?.name || "User"}
              </p>
              <span className={`mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${rc.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${rc.dot}`} />
                {rc.label}
              </span>
              {user?.company_name && (
                <p className="mt-1 flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 truncate">
                  <Building2 size={9} className="flex-shrink-0" />
                  {user.company_name === "AQred" ? "Aqred" : user.company_name}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-1" title={user?.name}>
            <div className="rounded-xl ring-2 ring-violet-100 dark:ring-violet-800/40 shadow-sm shadow-violet-200/50">
              <Avatar name={user?.name || "User"} size="sm" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── SidebarHeader ─────────────────────────────────────────────────────── */
const SidebarHeader = ({ collapsed, onAction, isClose = false }) => (
  <div className="flex items-center justify-between px-3 py-4 border-b border-gray-100 dark:border-gray-800 min-h-[64px] flex-shrink-0">
    {!collapsed && (
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-violet-300/40 dark:shadow-none">
          <span className="text-white text-sm font-black select-none">A</span>
        </div>
        <span className="text-[15px] leading-none select-none truncate">
          <span className="font-extrabold tracking-tight text-slate-800 dark:text-white">Aq</span>
          <span className="font-extrabold tracking-tight text-violet-600">red</span>
        </span>
      </div>
    )}
    <button
      onClick={onAction}
      title={isClose ? "Close" : collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className={[
        "flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl outline-none",
        "text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400",
        "hover:bg-violet-50 dark:hover:bg-violet-900/20 border border-gray-100 dark:border-gray-700/50 transition-all duration-150",
        collapsed && !isClose ? "mx-auto" : "",
      ].join(" ")}
    >
      {isClose ? <X size={15} /> : collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
    </button>
  </div>
);

/* ─── SidebarBody ───────────────────────────────────────────────────────── */
const SidebarBody = ({ expanded, visibleGroups, user, role, t }) => (
  <div className="flex flex-col flex-1 overflow-hidden">
    <nav className={[
      "flex-1 overflow-y-auto overflow-x-hidden py-2",
      expanded ? "px-2" : "px-1.5 flex flex-col items-center",
    ].join(" ")}>
      {visibleGroups.map((group, gi) => (
        <NavGroup
          key={group.label}
          group={group}
          expanded={expanded}
          isFirst={gi === 0}
          t={t}
        />
      ))}
    </nav>
    <UserCard user={user} role={role} expanded={expanded} t={t} />
  </div>
);

/* ─── Sidebar ────────────────────────────────────────────────────────────── */
const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const { user, hasPermission } = useAuth();
  const { t } = useSystem();
  const role = user?.role || "employee";

  const canSee = (item) => {
    if (item.adminOnly) return role === "admin";
    return hasPermission(item.permission);
  };

  const visibleGroups = role === "super_admin"
    ? SUPER_ADMIN_GROUPS
    : NAV_GROUPS
        .map((g) => ({ ...g, items: g.items.filter(canSee) }))
        .filter((g) => g.items.length > 0);

  const bodyProps = { visibleGroups, user, role, t };

  const base = "flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100/80 dark:border-gray-800 shadow-[1px_0_12px_rgba(0,0,0,0.04)]";

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <div className={`${base} fixed inset-y-0 left-0 z-50 w-64
        shadow-2xl shadow-black/20 dark:shadow-black/50
        transition-transform duration-300 ease-in-out md:hidden
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <SidebarHeader collapsed={false} onAction={onMobileClose} isClose />
        <SidebarBody {...bodyProps} expanded={true} />
      </div>

      {/* Desktop sidebar */}
      <div className={`${base} hidden md:flex flex-shrink-0 h-full
        transition-[width] duration-300 ease-in-out
        ${collapsed ? "w-[60px]" : "w-[220px]"}`}
      >
        <SidebarHeader collapsed={collapsed} onAction={onToggle} />
        <SidebarBody {...bodyProps} expanded={!collapsed} />
      </div>
    </>
  );
};

export default Sidebar;
