import { useState, useEffect } from "react";
import {
  Shield, Check, X, Plus, Save, Trash2, Lock,
  LayoutDashboard, Users, ShoppingCart, Package,
  DollarSign, BarChart2, Settings, UserCheck, User,
} from "lucide-react";
import { getAllRolePermissions, createRolePermissions, updateRolePermissions, deleteRolePermissions } from "../services/rolesService";
import { useSystem } from "../context/SystemContext";

const PERMISSIONS = [
  "View Dashboard",
  "Manage Employees",
  "Manage Customers",
  "Manage Products",
  "Manage Orders",
  "Manage Suppliers",
  "View Inventory",
  "Manage Inventory",
  "View Sales",
  "Manage Payments",
  "Manage Invoices",
  "View Reports",
  "Export Reports",
  "User Management",
  "Manage Roles",
  "View System Logs",
  "System Settings",
];

const PERM_CATEGORIES = [
  { label: "Core",           icon: LayoutDashboard, color: "text-violet-600 dark:text-violet-400", iconBg: "bg-violet-100 dark:bg-violet-900/30", perms: ["View Dashboard"] },
  { label: "People",         icon: Users,           color: "text-blue-600 dark:text-blue-400",   iconBg: "bg-blue-100 dark:bg-blue-900/30",   perms: ["Manage Employees", "User Management"] },
  { label: "Operations",     icon: ShoppingCart,    color: "text-indigo-600 dark:text-indigo-400", iconBg: "bg-indigo-100 dark:bg-indigo-900/30", perms: ["Manage Customers", "Manage Products", "Manage Orders", "Manage Suppliers"] },
  { label: "Finance",        icon: DollarSign,      color: "text-emerald-600 dark:text-emerald-400",iconBg: "bg-emerald-100 dark:bg-emerald-900/30",perms: ["View Sales", "Manage Payments", "Manage Invoices", "Export Reports"] },
  { label: "Inventory",      icon: Package,         color: "text-amber-600 dark:text-amber-400",  iconBg: "bg-amber-100 dark:bg-amber-900/30",  perms: ["View Inventory", "Manage Inventory"] },
  { label: "Analytics",      icon: BarChart2,       color: "text-teal-600 dark:text-teal-400",   iconBg: "bg-teal-100 dark:bg-teal-900/30",   perms: ["View Reports", "View System Logs"] },
  { label: "Administration", icon: Settings,        color: "text-red-600 dark:text-red-400",    iconBg: "bg-red-100 dark:bg-red-900/30",    perms: ["Manage Roles", "System Settings"] },
];

const BUILT_IN_META = {
  admin: {
    name: "Admin", locked: true,
    desc: "Full system access — permissions cannot be modified",
    gradient: "from-red-500 to-rose-600",
    iconBg: "bg-gradient-to-br from-red-400 to-rose-600",
    badgeCls: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800",
    barCls: "bg-gradient-to-r from-red-400 to-rose-500",
    panelBg: "from-red-500 to-rose-600",
    selectedCls: "border-2 border-red-200 dark:border-red-800 ring-2 ring-red-100/60 dark:ring-red-900/30 shadow-lg shadow-red-100/40 dark:shadow-black/30",
    icon: Shield,
  },
  manager: {
    name: "Manager",
    desc: "Manage teams, view reports, and handle operations",
    gradient: "from-violet-500 to-violet-700",
    iconBg: "bg-gradient-to-br from-violet-400 to-violet-600",
    badgeCls: "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-800",
    barCls: "bg-gradient-to-r from-violet-400 to-violet-600",
    panelBg: "from-violet-500 to-violet-700",
    selectedCls: "border-2 border-violet-200 dark:border-violet-800 ring-2 ring-violet-100/60 dark:ring-violet-900/30 shadow-lg shadow-violet-100/40 dark:shadow-black/30",
    icon: UserCheck,
  },
  employee: {
    name: "Employee",
    desc: "Standard access to day-to-day operations",
    gradient: "from-blue-500 to-indigo-600",
    iconBg: "bg-gradient-to-br from-blue-400 to-blue-600",
    badgeCls: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800",
    barCls: "bg-gradient-to-r from-blue-400 to-blue-600",
    panelBg: "from-blue-500 to-indigo-600",
    selectedCls: "border-2 border-blue-200 dark:border-blue-800 ring-2 ring-blue-100/60 dark:ring-blue-900/30 shadow-lg shadow-blue-100/40 dark:shadow-black/30",
    icon: User,
  },
};

const CUSTOM_META = {
  name: "Custom", desc: "Custom role",
  gradient: "from-teal-500 to-teal-600",
  iconBg: "bg-gradient-to-br from-teal-400 to-teal-600",
  badgeCls: "bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-800",
  barCls: "bg-gradient-to-r from-teal-400 to-teal-600",
  panelBg: "from-teal-500 to-teal-600",
  selectedCls: "border-2 border-teal-200 dark:border-teal-800 ring-2 ring-teal-100/60 dark:ring-teal-900/30 shadow-lg shadow-teal-100/40 dark:shadow-black/30",
  icon: Shield,
};

const inputCls = "w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent";

export default function RolesPermissions() {
  const { t } = useSystem();
  const [permsByRole, setPermsByRole]   = useState({ admin: PERMISSIONS, manager: [], employee: [] });
  const [selectedRole, setSelectedRole] = useState("admin");
  const [saving, setSaving]             = useState(false);
  const [toast, setToast]               = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [newRoleName, setNewRoleName]   = useState("");
  const [newRolePerms, setNewRolePerms] = useState([]);
  const [creating, setCreating]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadRoles = () =>
    getAllRolePermissions()
      .then(r => setPermsByRole(r.data))
      .catch(() => showToast("Failed to load permissions", "error"));

  useEffect(() => { loadRoles(); }, []);

  const currentPerms = permsByRole[selectedRole] || [];
  const isBuiltIn    = selectedRole in BUILT_IN_META;
  const meta         = BUILT_IN_META[selectedRole] || {
    ...CUSTOM_META,
    name: selectedRole.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
  };
  const locked   = meta.locked || false;
  const RoleIcon = meta.icon;
  const pct      = Math.round((currentPerms.length / PERMISSIONS.length) * 100);

  const togglePermission = (perm) => {
    if (locked) return;
    const updated = currentPerms.includes(perm)
      ? currentPerms.filter(p => p !== perm)
      : [...currentPerms, perm];
    setPermsByRole(prev => ({ ...prev, [selectedRole]: updated }));
  };

  const handleSave = async () => {
    if (locked) return;
    setSaving(true);
    try {
      await updateRolePermissions(selectedRole, currentPerms);
      showToast(`${meta.name} permissions saved. Users must log out and back in to see changes.`);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to save permissions", "error");
    } finally { setSaving(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setCreating(true);
    try {
      await createRolePermissions(newRoleName.trim(), newRolePerms);
      showToast(`Role "${newRoleName.trim()}" created successfully.`);
      setShowModal(false); setNewRoleName(""); setNewRolePerms([]);
      await loadRoles();
      setSelectedRole(newRoleName.trim().toLowerCase().replace(/\s+/g, "_"));
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to create role", "error");
    } finally { setCreating(false); }
  };

  const handleDelete = async () => {
    try {
      await deleteRolePermissions(deleteTarget);
      showToast(`Role "${deleteTarget}" deleted.`);
      setDeleteTarget(null); setSelectedRole("admin"); loadRoles();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to delete role", "error");
      setDeleteTarget(null);
    }
  };

  const toggleNewPerm = (perm) =>
    setNewRolePerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);

  const builtInRoles = Object.keys(BUILT_IN_META).filter(r => r in permsByRole);
  const customRoles  = Object.keys(permsByRole).filter(r => !(r in BUILT_IN_META) && r !== "super_admin");

  return (
    <div>
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50/60 via-white to-red-50/20 dark:from-violet-900/10 dark:via-transparent dark:to-red-900/5 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-400 via-violet-500 to-blue-500" />
        <div className="absolute -right-8 -top-8 w-52 h-52 rounded-full bg-gradient-to-br from-violet-100/40 to-red-100/20 dark:from-violet-800/10 dark:to-red-800/10 pointer-events-none" />
        <div className="absolute right-20 -bottom-10 w-32 h-32 rounded-full bg-gradient-to-br from-blue-100/30 to-violet-100/20 dark:from-blue-800/10 dark:to-violet-800/10 pointer-events-none" />
        <div className="relative px-6 py-5 flex flex-wrap items-center justify-between gap-y-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-300/40 dark:shadow-violet-900/30">
                <Shield size={22} className="text-white" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-violet-400 border-2 border-white dark:border-gray-900 rounded-full" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("Roles & Permissions")}</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t("Configure role-based access control for your team")}</p>
            </div>
          </div>
          <button
            onClick={() => { setNewRoleName(""); setNewRolePerms([]); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-700 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-violet-800 active:scale-95 transition-all shadow-md shadow-violet-300/40 dark:shadow-violet-900/30 flex-shrink-0"
          >
            <Plus size={15} /> {t("New Role")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[270px_1fr] gap-5 items-start">

        {/* ── Role List ── */}
        <div className="space-y-2.5">
          {[...builtInRoles, ...customRoles].map((roleKey) => {
            const m       = BUILT_IN_META[roleKey] || { ...CUSTOM_META, name: roleKey.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) };
            const perms   = permsByRole[roleKey] || [];
            const pctRole = Math.round((perms.length / PERMISSIONS.length) * 100);
            const RIcon   = m.icon;
            const active  = selectedRole === roleKey;
            return (
              <button
                key={roleKey}
                onClick={() => setSelectedRole(roleKey)}
                className={`group w-full text-left rounded-2xl transition-all duration-150 overflow-hidden
                  ${active ? m.selectedCls : "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md shadow-sm"}`}
              >
                {/* Gradient accent bar */}
                <div className={`h-1 bg-gradient-to-r ${m.gradient}`} />
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 ${m.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5`}>
                      <RIcon size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-bold text-gray-900 dark:text-white capitalize">{m.name}</span>
                        {m.locked && <Lock size={10} className="text-gray-400 dark:text-gray-500" />}
                        {!BUILT_IN_META[roleKey] && (
                          <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-1.5 py-0.5 rounded-full border border-teal-100 dark:border-teal-800">Custom</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed line-clamp-2">{m.desc || "Custom role"}</p>
                    </div>
                  </div>
                  {/* Permission progress */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Access</span>
                      <span className={`text-[11px] font-bold ${active ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"}`}>
                        {perms.length}/{PERMISSIONS.length}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${m.barCls}`} style={{ width: `${pctRole}%` }} />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {/* Legend */}
          <div className="pt-1 px-1 space-y-1.5">
            {PERM_CATEGORIES.map((cat) => {
              const CatIcon = cat.icon;
              return (
                <div key={cat.label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 ${cat.iconBg} rounded flex items-center justify-center flex-shrink-0`}>
                    <CatIcon size={9} className={cat.color} />
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{cat.label}</span>
                  <span className="text-[10px] text-gray-300 dark:text-gray-600 ml-auto">{cat.perms.length} perms</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Permission Panel ── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
          {/* Panel header */}
          <div className="relative overflow-hidden px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <div className={`absolute inset-0 bg-gradient-to-r ${meta.panelBg} opacity-[0.05] pointer-events-none`} />
            <div className="relative flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${meta.iconBg} rounded-xl flex items-center justify-center shadow-md shadow-black/10 flex-shrink-0`}>
                  <RoleIcon size={18} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-white capitalize">{meta.name} {t("Permissions")}</h3>
                    {locked && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-2 py-0.5 rounded-full">
                        <Lock size={9} /> {t("Locked")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{currentPerms.length}/{PERMISSIONS.length} {t("enabled")}</span>
                    <span className="text-gray-200 dark:text-gray-700">·</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${meta.barCls}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{pct}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!isBuiltIn && (
                  <button
                    onClick={() => setDeleteTarget(selectedRole)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 size={13} /> {t("Delete")}
                  </button>
                )}
                {locked ? (
                  <div className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <Lock size={13} /> {t("All permissions locked")}
                  </div>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-700 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-violet-800 disabled:opacity-60 active:scale-95 transition-all shadow-md shadow-violet-300/40 dark:shadow-violet-900/30"
                  >
                    <Save size={14} /> {saving ? t("Saving…") : t("Save Changes")}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Categorized permission grid */}
          <div className="p-5 space-y-6 overflow-y-auto" style={{ maxHeight: "calc(100vh - 340px)" }}>
            {PERM_CATEGORIES.map((cat) => {
              const CatIcon  = cat.icon;
              const catEnabled = cat.perms.filter(p => currentPerms.includes(p)).length;
              return (
                <div key={cat.label}>
                  {/* Category label */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-6 h-6 ${cat.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <CatIcon size={12} className={cat.color} />
                    </div>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t(cat.label)}</span>
                    <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                    <span className={`text-[11px] font-bold tabular-nums ${catEnabled === cat.perms.length ? cat.color : "text-gray-300 dark:text-gray-600"}`}>
                      {catEnabled}/{cat.perms.length}
                    </span>
                  </div>
                  {/* Permission tiles */}
                  <div className="grid grid-cols-2 gap-2">
                    {cat.perms.map((perm) => {
                      const isActive = currentPerms.includes(perm);
                      return (
                        <button
                          key={perm}
                          onClick={() => togglePermission(perm)}
                          disabled={locked}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all
                            ${isActive
                              ? "border-violet-200 dark:border-violet-800 bg-violet-50/80 dark:bg-violet-900/20 shadow-sm"
                              : "border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-100/60 dark:hover:bg-gray-800"
                            }
                            ${locked ? "cursor-default" : "cursor-pointer active:scale-[0.99] hover:shadow-sm"}`}
                        >
                          <span className={`font-semibold text-[13px] text-left leading-tight ${isActive ? "text-violet-700 dark:text-violet-400" : "text-gray-400 dark:text-gray-500"}`}>
                            {t(perm)}
                          </span>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-2 transition-all
                            ${isActive ? "bg-violet-500 shadow-sm shadow-violet-300/50 dark:shadow-violet-900/30" : "bg-gray-200 dark:bg-gray-700"}`}>
                            {isActive
                              ? <Check size={11} className="text-white" strokeWidth={2.5} />
                              : <X size={10} className="text-gray-400 dark:text-gray-500" strokeWidth={2.5} />
                            }
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1.5">
              <Shield size={11} className="text-gray-300 dark:text-gray-600" />
              {t("Permission changes take effect on next login.")}
            </p>
          </div>
        </div>
      </div>

      {/* ── New Role Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white">{t("Create New Role")}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Role Name")}</label>
                <input required autoFocus className={inputCls} placeholder="e.g. Supervisor"
                  value={newRoleName} onChange={e => setNewRoleName(e.target.value)} />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t("Spaces will be converted to underscores.")}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("Permissions")}</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1">
                  {PERMISSIONS.map(perm => {
                    const active = newRolePerms.includes(perm);
                    return (
                      <button type="button" key={perm} onClick={() => toggleNewPerm(perm)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all ${
                          active ? "border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400" : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}>
                        <span className="font-medium text-left">{perm}</span>
                        {active ? <Check size={13} className="text-violet-500 dark:text-violet-400 flex-shrink-0" /> : <X size={13} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{newRolePerms.length} {t("of")} {PERMISSIONS.length} {t("selected")}</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">{t("Cancel")}</button>
                <button type="submit" disabled={creating || !newRoleName.trim()}
                  className="flex-1 px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60">
                  {creating ? t("Creating…") : t("Create Role")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500 dark:text-red-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t("Delete")} "{deleteTarget}" {t("role?")}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              {t("This will permanently remove the role and its permissions. Users assigned this role will need to be reassigned.")}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">{t("Cancel")}</button>
              <button onClick={handleDelete}
                className="flex-1 px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600">{t("Delete")}</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === "error" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800" : "bg-green-50 dark:bg-emerald-900/30 text-green-700 dark:text-emerald-300 border border-green-100 dark:border-emerald-800"}`}>
          <Check size={15} /> {toast.msg}
        </div>
      )}
    </div>
  );
}
