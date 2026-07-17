import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Users, Plus, Search, Download, Edit2, Trash2, X, CheckCircle,
  Shield, UserCheck, User, Mail, Briefcase, DollarSign, Filter,
  BarChart2, Eye, ChevronUp, ChevronDown,
  Calendar, Hash,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie,
} from "recharts";
import { getStaff, createStaff, updateStaff, deleteStaff } from "../services/staffService";
import { getAllRolePermissions } from "../services/rolesService";
import { exportToCSV } from "../utils/exportCSV";
import { useSystem } from "../context/SystemContext";
import EmptyState from "../components/UI/EmptyState";
import Pagination from "../components/UI/Pagination";

const DEPT_COLORS = {
  Engineering: "#7c3aed", Sales: "#6366f1", Support: "#a78bfa",
  Marketing: "#c4b5fd", HR: "#ddd6fe", Finance: "#818cf8", Operations: "#4f46e5",
};
const DEFAULT_COLOR = "#94a3b8";

// Built-in roles, shown even before the roles list has loaded. Custom roles
// created via Roles & Permissions are merged in at runtime (see availableRoles
// below) — otherwise a custom role could be created but never assigned to anyone.
const BUILT_IN_ROLES = ["admin", "manager", "employee"];
const DEPTS = ["Engineering", "Sales", "Marketing", "Support", "HR", "Finance", "Operations"];

const ROLE_CFG = {
  admin:    { cls: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ring-1 ring-red-100/80 dark:ring-red-800/50",        icon: Shield,    label: "Admin" },
  manager:  { cls: "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 ring-1 ring-violet-100/80 dark:ring-violet-800/50", icon: UserCheck, label: "Manager" },
  employee: { cls: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100/80 dark:ring-blue-800/50",     icon: User,      label: "Employee" },
};

const ROLE_SALARIES = {
  admin:    12000,
  manager:  7500,
  employee: 3500,
};

const BLANK = {
  name: "", email: "", password: "", role: "employee",
  position: "", department: "Engineering", salary: ROLE_SALARIES.employee, employment_status: "Active",
};

const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 bg-gray-50/50 dark:bg-gray-900/60 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-900 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500";

const AVATAR_GRADIENTS = [
  "from-violet-500 to-violet-700",
  "from-blue-500 to-indigo-700",
  "from-emerald-500 to-teal-700",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-700",
];
const avatarGradient = (name) => AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];

const DEPT_BADGE = {
  Engineering: "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 ring-1 ring-violet-200/60 dark:ring-violet-800/50",
  Sales:       "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-200/60 dark:ring-indigo-800/50",
  Support:     "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 ring-1 ring-purple-200/60 dark:ring-purple-800/50",
  Marketing:   "bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 ring-1 ring-pink-200/60 dark:ring-pink-800/50",
  HR:          "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200/60 dark:ring-blue-800/50",
  Finance:     "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 ring-1 ring-teal-200/60 dark:ring-teal-800/50",
  Operations:  "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200/60 dark:ring-amber-800/50",
};
const deptBadgeCls = (dept) => DEPT_BADGE[dept] || "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 ring-1 ring-gray-200/60 dark:ring-gray-700";

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border-l-4
    ${type === "success"
      ? "bg-white dark:bg-gray-800 text-green-700 dark:text-emerald-400 border border-green-100 dark:border-emerald-800 border-l-green-500 shadow-green-100/60 dark:shadow-black/40"
      : "bg-white dark:bg-gray-800 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800 border-l-red-500 shadow-red-100/60 dark:shadow-black/40"}`}>
    <CheckCircle size={16} className={type === "success" ? "text-green-500" : "text-red-500"} /> {msg}
    <button onClick={onClose} className="ml-2 opacity-40 hover:opacity-70"><X size={14} /></button>
  </div>
);

const PAGE_SIZE = 10;

const SORT_COLS = {
  name:              (s) => s.name?.toLowerCase() || "",
  role:              (s) => s.role || "",
  position:          (s) => s.position?.toLowerCase() || "",
  department:        (s) => s.department?.toLowerCase() || "",
  salary:            (s) => Number(s.salary) || 0,
  employment_status: (s) => s.employment_status?.toLowerCase() || "",
};

const SortIcon = ({ col, sortCol, sortDir }) => {
  if (sortCol !== col)
    return <span className="ml-1 inline-flex flex-col opacity-20 group-hover/th:opacity-40 transition-opacity"><ChevronUp size={10} className="-mb-0.5" /><ChevronDown size={10} className="-mt-0.5" /></span>;
  return sortDir === "asc"
    ? <ChevronUp size={12} className="ml-1 inline text-violet-500 dark:text-violet-400" />
    : <ChevronDown size={12} className="ml-1 inline text-violet-500 dark:text-violet-400" />;
};

const Staff = () => {
  const { t, formatCurrency } = useSystem();
  const location = useLocation();
  const [view, setView]               = useState("staff");
  const [staff, setStaff]             = useState([]);
  const [search, setSearch]           = useState("");
  const [roleFilter, setRoleFilter]   = useState("All");
  const [deptFilter, setDeptFilter]   = useState("All");
  const [showModal, setShowModal]     = useState(false);
  const [editing, setEditing]         = useState(null);
  const [form, setForm]               = useState(BLANK);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget]   = useState(null);
  const [toast, setToast]             = useState(null);
  const [loading, setLoading]         = useState(false);
  const [sortCol, setSortCol]         = useState("name");
  const [sortDir, setSortDir]         = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [availableRoles, setAvailableRoles] = useState(BUILT_IN_ROLES);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    try { const { data } = await getStaff(); setStaff(data); } catch { showToast("Failed to load staff.", "error"); }
  };

  const loadRoles = async () => {
    try {
      const { data } = await getAllRolePermissions();
      const roles = Object.keys(data);
      setAvailableRoles(roles.length ? roles : BUILT_IN_ROLES);
    } catch { /* keep built-in roles as the fallback */ }
  };
  useEffect(() => {
    load();
    loadRoles();
    if (location.state?.openCreate) openAdd();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const openAdd = () => { setEditing(null); setForm({ ...BLANK, salary: ROLE_SALARIES[BLANK.role] }); setShowModal(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name, email: s.email, password: "",
      role: s.role, position: s.position || "",
      department: s.department || "Engineering",
      salary: s.salary ?? "",
      employment_status: s.employment_status || "Active",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await updateStaff(editing.id, form);
        showToast("Staff member updated!");
      } else {
        await createStaff(form);
        showToast("Staff member added!");
      }
      setShowModal(false);
      load();
    } catch (err) {
      showToast(err.response?.data?.error || "Operation failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteStaff(deleteTarget.id);
      showToast(`${deleteTarget.name} removed.`);
      setDeleteTarget(null);
      load();
    } catch {
      showToast("Delete failed.", "error");
      setDeleteTarget(null);
    }
  };

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
    setCurrentPage(1);
  };

  const filtered = staff
    .filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.position || "").toLowerCase().includes(q);
      const matchRole = roleFilter === "All" || s.role === roleFilter;
      const matchDept = deptFilter === "All" || (s.department || "") === deptFilter;
      return matchSearch && matchRole && matchDept;
    })
    .sort((a, b) => {
      const fn = SORT_COLS[sortCol] || SORT_COLS.name;
      const av = fn(a), bv = fn(b);
      if (typeof av === "number" && typeof bv === "number")
        return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const pageSlice  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearchChange = (e) => { setSearch(e.target.value); setCurrentPage(1); };
  const handleRoleFilter   = (r) => { setRoleFilter(r); setCurrentPage(1); };
  const handleDeptFilter   = (e) => { setDeptFilter(e.target.value); setCurrentPage(1); };

  const handleExport = () =>
    exportToCSV(
      filtered.map((s) => ({
        Name:       s.name,
        Email:      s.email,
        Role:       s.role ? s.role.charAt(0).toUpperCase() + s.role.slice(1) : "",
        Position:   s.position || "",
        Department: s.department || "",
        "Salary (USD)": s.salary != null && s.salary !== "" ? parseFloat(s.salary).toFixed(2) : "",
        Status:     s.employment_status || "Active",
        "Member Since": s.created_at ? new Date(s.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "",
      })),
      "staff"
    );

  const fmt = (v) => v != null && v !== "" ? formatCurrency(v) : "—";
  const avgSalary = staff.filter(s => s.salary).length
    ? Math.round(staff.reduce((a, s) => a + (Number(s.salary) || 0), 0) / staff.filter(s => s.salary).length)
    : 0;

  const stats = [
    { label: t("Total Staff"),  value: staff.length,                                        color: "text-gray-900 dark:text-white",   gradient: "bg-gradient-to-br from-slate-500 to-gray-700",       icon: Users },
    { label: t("Admins"),       value: staff.filter(s => s.role === "admin").length,         color: "text-red-600 dark:text-red-400",    gradient: "bg-gradient-to-br from-red-400 to-red-600",           icon: Shield },
    { label: t("Managers"),     value: staff.filter(s => s.role === "manager").length,       color: "text-violet-600 dark:text-violet-400", gradient: "bg-gradient-to-br from-violet-400 to-violet-600",     icon: UserCheck },
    { label: t("Employees"),    value: staff.filter(s => s.role === "employee").length,      color: "text-blue-600 dark:text-blue-400",   gradient: "bg-gradient-to-br from-blue-400 to-blue-600",         icon: User },
    { label: t("Active"),       value: staff.filter(s => s.employment_status !== "Inactive").length, color: "text-emerald-600 dark:text-emerald-400", gradient: "bg-gradient-to-br from-emerald-400 to-emerald-600", icon: CheckCircle },
    { label: t("Departments"),  value: new Set(staff.map(s => s.department).filter(Boolean)).size, color: "text-amber-600 dark:text-amber-400",  gradient: "bg-gradient-to-br from-amber-400 to-orange-500",     icon: Briefcase },
    { label: t("Avg. Salary"),  value: avgSalary ? fmt(avgSalary) : "—",                    color: "text-teal-600 dark:text-teal-400",   gradient: "bg-gradient-to-br from-teal-400 to-teal-600",         icon: DollarSign },
  ];

  const deptMap = {};
  staff.forEach((s) => {
    const d = s.department || "Other";
    deptMap[d] = (deptMap[d] || 0) + 1;
  });
  const deptData = Object.entries(deptMap).map(([name, value]) => ({
    name, value, color: DEPT_COLORS[name] || DEFAULT_COLOR,
  }));

  const roleData = [
    { name: "Admins",    value: staff.filter(s => s.role === "admin").length,    color: "#ef4444" },
    { name: "Managers",  value: staff.filter(s => s.role === "manager").length,  color: "#7c3aed" },
    { name: "Employees", value: staff.filter(s => s.role === "employee").length, color: "#3b82f6" },
  ].filter(r => r.value > 0);

  const SortTh = ({ col, children }) => (
    <th
      onClick={() => handleSort(col)}
      className="px-5 py-4 text-left text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest cursor-pointer select-none hover:text-violet-600 dark:hover:text-violet-400 transition-colors group/th hover:bg-violet-50/30 dark:hover:bg-violet-900/10"
    >
      <span className="inline-flex items-center gap-0.5">
        {children}
        <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
      </span>
    </th>
  );

  return (
    <div>
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm mb-5">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50/70 via-white to-indigo-50/40 dark:from-violet-900/10 dark:via-transparent dark:to-indigo-900/10 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 via-indigo-400 to-purple-500" />
        <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-gradient-to-br from-violet-100/50 to-indigo-100/30 dark:from-violet-800/10 dark:to-indigo-800/10 pointer-events-none" />
        <div className="absolute right-20 -bottom-12 w-40 h-40 rounded-full bg-gradient-to-br from-blue-100/30 to-violet-100/20 dark:from-blue-800/10 dark:to-violet-800/10 pointer-events-none" />
        <div className="absolute left-1/3 -top-8 w-44 h-44 rounded-full bg-violet-50/40 dark:bg-violet-800/10 pointer-events-none" />
        <div className="absolute left-2/3 top-0 w-24 h-24 rounded-full bg-indigo-50/30 dark:bg-indigo-800/10 pointer-events-none" />
        <div className="relative px-6 py-5 flex flex-wrap items-center justify-between gap-y-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-300/50 dark:shadow-violet-900/30">
                <Users size={22} className="text-white" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white dark:border-gray-900 rounded-full shadow-sm" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{t("Staff")}</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium">{t("Manage team members, roles, HR data, and workforce analytics")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleExport}
              className="flex items-center gap-2 px-3.5 py-2 border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 active:scale-95 transition-all shadow-sm">
              <Download size={14} /> {t("Export CSV")}
            </button>
            {view === "staff" && (
              <button onClick={openAdd}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 active:scale-95 transition-all shadow-md shadow-violet-400/30 dark:shadow-violet-900/30">
                <Plus size={15} /> {t("Add Staff")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700 rounded-xl p-1 w-fit mb-5">
        {[
          { id: "staff",   label: t("Staff Management"), icon: Users },
          { id: "reports", label: t("Reports & Analytics"), icon: BarChart2 },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setView(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all
              ${view === id ? "bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-300 shadow-md border border-gray-200/80 dark:border-gray-600" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/40 dark:hover:bg-gray-700/40"}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── Staff Management View ── */}
      {view === "staff" && <>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mb-5">
        {stats.map(({ label, value, color, gradient, icon: Icon }) => (
          <div key={label} className="relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className={`absolute bottom-0 left-0 right-0 h-[3px] ${gradient} opacity-50`} />
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-tight">{label}</p>
              <div className={`w-8 h-8 ${gradient} rounded-xl flex items-center justify-center shadow-lg shadow-black/15 flex-shrink-0`}>
                <Icon size={14} className="text-white" />
              </div>
            </div>
            <p className={`text-2xl font-black tracking-tight ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 mb-4">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text" placeholder="Search by name, email, or position..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-300 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
            value={search} onChange={handleSearchChange}
          />
        </div>

        <div className="flex flex-wrap items-center gap-0.5 bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700 rounded-xl p-1">
          <Filter size={12} className="text-gray-400 dark:text-gray-500 ml-1 flex-shrink-0" />
          {["All", ...availableRoles].map((r) => (
            <button key={r} onClick={() => handleRoleFilter(r)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all
                ${roleFilter === r ? "bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-300 shadow-md border border-gray-200/80 dark:border-gray-600" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50"}`}>
              {r === "All" ? t("All") : t(ROLE_CFG[r]?.label || r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))}
            </button>
          ))}
        </div>

        <select value={deptFilter} onChange={handleDeptFilter}
          className="px-3 py-2.5 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-300 transition-all text-gray-700 dark:text-gray-300">
          <option value="All">{t("All Departments")}</option>
          {DEPTS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm ring-1 ring-gray-100/60 dark:ring-gray-800/60">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-gray-50/60 dark:from-gray-800/60 dark:to-gray-800/30 border-b border-gray-100 dark:border-gray-800">
              <SortTh col="name">{t("Staff Member")}</SortTh>
              <SortTh col="role">{t("System Role")}</SortTh>
              <SortTh col="position">{t("Position")}</SortTh>
              <SortTh col="department">{t("Department")}</SortTh>
              <SortTh col="salary">{t("Salary")}</SortTh>
              <SortTh col="employment_status">{t("Status")}</SortTh>
              <th className="px-5 py-4 text-left text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t("Actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {pageSlice.map((s) => {
              const cfg = ROLE_CFG[s.role] || ROLE_CFG.employee;
              const RoleIcon = cfg.icon;
              return (
                <tr key={s.id} className="group hover:bg-violet-50/40 dark:hover:bg-violet-900/10 transition-all duration-150">
                  <td className="px-5 py-4 border-l-[3px] border-l-transparent group-hover:border-l-violet-400 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 bg-gradient-to-br ${avatarGradient(s.name)} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-black/10`}>
                        <span className="text-sm font-bold text-white">{s.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">{s.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5"><Mail size={10} className="text-gray-300 dark:text-gray-600" />{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${cfg.cls}`}>
                      <RoleIcon size={11} />{t(cfg.label)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 font-medium">{s.position || <span className="text-gray-300 dark:text-gray-600 font-normal">—</span>}</td>
                  <td className="px-5 py-4">
                    {s.department
                      ? <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${deptBadgeCls(s.department)}`}>{s.department}</span>
                      : <span className="text-gray-300 dark:text-gray-600 text-sm">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums tracking-tight">{fmt(s.salary)}</span>
                  </td>
                  <td className="px-5 py-4">
                    {s.employment_status === "Inactive" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                        {t("Inactive")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-100/80 dark:ring-emerald-800/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        {t(s.employment_status || "Active")}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-0.5 opacity-50 group-hover:opacity-100 transition-all duration-150">
                      <div className="relative group/view">
                        <button onClick={() => setViewTarget(s)}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all hover:scale-110">
                          <Eye size={14} />
                        </button>
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 text-[11px] font-semibold bg-indigo-600 text-white rounded-md opacity-0 group-hover/view:opacity-100 transition-opacity whitespace-nowrap shadow-lg">View</span>
                      </div>
                      <div className="relative group/edit">
                        <button onClick={() => openEdit(s)}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-all hover:scale-110">
                          <Edit2 size={14} />
                        </button>
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 text-[11px] font-semibold bg-violet-600 text-white rounded-md opacity-0 group-hover/edit:opacity-100 transition-opacity whitespace-nowrap shadow-lg">Edit</span>
                      </div>
                      <div className="relative group/del">
                        <button onClick={() => setDeleteTarget(s)}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all hover:scale-110">
                          <Trash2 size={14} />
                        </button>
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 text-[11px] font-semibold bg-red-500 text-white rounded-md opacity-0 group-hover/del:opacity-100 transition-opacity whitespace-nowrap shadow-lg">Delete</span>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        {filtered.length === 0 && (
          <EmptyState
            icon={Users}
            title={t("No staff members found")}
            description={search ? t("Try a different search term") : t("Add your first team member to get started.")}
            actionLabel={!search ? t("Add Staff") : undefined}
            onAction={!search ? openAdd : undefined}
          />
        )}
      </div>

      <Pagination
        page={safePage}
        totalPages={totalPages}
        total={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        itemLabel={t("staff members")}
      />

      </>}

      {/* ── Reports & Analytics View ── */}
      {view === "reports" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t("Total Staff"),  value: staff.length,                                             icon: Users,      color: "text-gray-900 dark:text-white",   bg: "bg-gray-50 dark:bg-gray-800",    accent: "bg-gray-400"    },
              { label: t("Active"),       value: staff.filter(s => s.employment_status !== "Inactive").length, icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", accent: "bg-emerald-400" },
              { label: t("Departments"),  value: new Set(staff.map(s => s.department).filter(Boolean)).size, icon: Briefcase,  color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-900/20",   accent: "bg-amber-400"   },
              { label: t("Avg. Salary"),  value: avgSalary ? fmt(avgSalary) : "—",                         icon: DollarSign, color: "text-teal-600 dark:text-teal-400",   bg: "bg-teal-50 dark:bg-teal-900/20",    accent: "bg-teal-400"    },
            ].map(({ label, value, icon: Icon, color, bg, accent }) => (
              <div key={label} className="relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className={`absolute top-0 left-0 w-1 h-full ${accent} opacity-60 rounded-l-2xl`} />
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                  <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center border border-gray-100 dark:border-gray-700`}><Icon size={17} className={color} /></div>
                </div>
                <p className={`text-2xl font-black tracking-tight ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 tracking-tight">{t("Staff by Department")}</h3>
              {deptData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={deptData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip />
                    <Bar dataKey="value" name="Staff" radius={[0, 4, 4, 0]} data={deptData.map((e) => ({ ...e, fill: e.color }))} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">{t("No department data yet.")}</div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 tracking-tight">{t("Role Distribution")}</h3>
              {roleData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={roleData.map((e) => ({ ...e, fill: e.color }))} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value" />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-3">
                    {roleData.map((r) => (
                      <div key={r.name} className="flex items-center justify-between py-0.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: r.color }} />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{r.name}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[160px] flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">{t("No data yet.")}</div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-slate-50/80 to-gray-50/40 dark:from-gray-800/60 dark:to-gray-800/30">
              <h3 className="font-bold text-gray-900 dark:text-white tracking-tight">{t("All Staff")}</h3>
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">{staff.length} {t("records")}</span>
            </div>
            {staff.length > 0 ? (
              <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-50 dark:border-gray-800/60">
                    {[t("Name"), t("Role"), t("Position"), t("Department"), t("Salary"), t("Status")].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                  {staff.map((s) => {
                    const cfg = ROLE_CFG[s.role] || ROLE_CFG.employee;
                    const RoleIcon = cfg.icon;
                    return (
                      <tr key={s.id} className="hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 tracking-tight">{s.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.email}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${cfg.cls}`}>
                            <RoleIcon size={11} />{t(cfg.label)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400 font-medium">{s.position || "—"}</td>
                        <td className="px-5 py-3.5">
                          {s.department
                            ? <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${deptBadgeCls(s.department)}`}>{s.department}</span>
                            : <span className="text-gray-300 dark:text-gray-600 text-sm">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-sm font-bold text-gray-900 dark:text-white tabular-nums tracking-tight">{fmt(s.salary)}</td>
                        <td className="px-5 py-3.5">
                          {s.employment_status === "Inactive" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              {t("Inactive")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-100/80 dark:ring-emerald-800/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {t(s.employment_status || "Active")}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title={t("No staff yet")}
                description={t("Switch to Staff Management to add team members.")}
              />
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg ring-1 ring-gray-900/5 dark:ring-white/10 overflow-hidden">
            <div className="relative flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50/80 to-white dark:from-gray-800/60 dark:to-gray-900">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500" />
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white tracking-tight">{editing ? t("Edit Staff Member") : t("Add Staff Member")}</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium">{editing ? t("Update profile and HR details") : t("Create a new system account and HR record")}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-5 space-y-4">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t("System Access")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{t("Full Name")}</label>
                  <input required className={inputCls} placeholder="Jane Smith" value={form.name} onChange={set("name")} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{t("Email")}</label>
                  <input type="email" required className={inputCls} placeholder="jane@company.com" value={form.email} onChange={set("email")} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
                    {t("Password")} {editing && <span className="text-gray-400 dark:text-gray-500 font-normal normal-case">({t("leave blank to keep")})</span>}
                  </label>
                  <input type="password" className={inputCls} placeholder={editing ? "••••••••" : "Temporary password"}
                    required={!editing} value={form.password} onChange={set("password")} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{t("System Role")}</label>
                  <select className={inputCls} value={form.role}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        role: newRole,
                        ...(editing ? {} : { salary: ROLE_SALARIES[newRole] ?? "" }),
                      }));
                    }}>
                    {availableRoles.map((r) => (
                      <option key={r} value={r}>{r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t("HR Details")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{t("Position")}</label>
                  <input className={inputCls} placeholder="e.g. Software Engineer" value={form.position} onChange={set("position")} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{t("Department")}</label>
                  <select className={inputCls} value={form.department} onChange={set("department")}>
                    {DEPTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">{t("Salary")}</label>
                    {!editing && ROLE_SALARIES[form.role] && (
                      <span className="text-[10px] text-violet-600 dark:text-violet-400 font-bold bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-full ring-1 ring-violet-100 dark:ring-violet-800/50">
                        {t("Default")}: {formatCurrency(ROLE_SALARIES[form.role])}
                      </span>
                    )}
                  </div>
                  <input type="number" min="0" className={inputCls} placeholder="e.g. 3500" value={form.salary} onChange={set("salary")} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wide">{t("Employment Status")}</label>
                  <select className={inputCls} value={form.employment_status} onChange={set("employment_status")}>
                    <option value="Active">{t("Active")}</option>
                    <option value="Inactive">{t("Inactive")}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 active:scale-95 transition-all">{t("Cancel")}</button>
                <button type="submit" disabled={loading}
                  className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 active:scale-95 shadow-md shadow-violet-300/40 dark:shadow-violet-900/30 transition-all">
                  {loading ? t("Saving...") : editing ? t("Save Changes") : t("Add Staff Member")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-7 text-center ring-1 ring-gray-900/5 dark:ring-white/10">
            <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-red-100 dark:ring-red-800/50">
              <Trash2 size={24} className="text-red-500 dark:text-red-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1.5 tracking-tight">{t("Remove")} {deleteTarget.name}?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              {t("This will delete their system account and HR record. This cannot be undone.")}
            </p>
            <div className="flex gap-2.5">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all">{t("Cancel")}</button>
              <button onClick={handleDelete}
                className="flex-1 px-4 py-2.5 text-sm font-bold bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 active:scale-95 shadow-md shadow-red-300/40 dark:shadow-red-900/30 transition-all">{t("Remove")}</button>
            </div>
          </div>
        </div>
      )}

      {/* View Staff Member Modal */}
      {viewTarget && (() => {
        const s = viewTarget;
        const cfg = ROLE_CFG[s.role] || ROLE_CFG.employee;
        const RoleIcon = cfg.icon;
        const memberSince = s.created_at
          ? new Date(s.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
          : null;
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.20)] w-full max-w-md overflow-hidden ring-1 ring-gray-900/5 dark:ring-white/10">
              {/* Rich gradient header */}
              <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 px-6 pt-6 pb-16 overflow-hidden">
                <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
                <div className="absolute -bottom-4 -left-4 w-28 h-28 rounded-full bg-white/8 pointer-events-none" />
                <div className="absolute top-2 left-1/2 w-16 h-16 rounded-full bg-indigo-400/20 pointer-events-none" />
                <button
                  onClick={() => setViewTarget(null)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                >
                  <X size={14} />
                </button>
                <p className="text-[10px] font-bold text-violet-200 uppercase tracking-[0.15em] mb-1.5">{t("Staff Profile")}</p>
                <h2 className="text-xl font-black text-white tracking-tight">{s.name}</h2>
                <p className="text-sm text-violet-200/80 mt-0.5 font-medium">{s.position || t("No position assigned")}</p>
              </div>

              {/* Avatar overlap */}
              <div className="relative -mt-9 px-6 mb-5">
                <div className={`w-[72px] h-[72px] bg-gradient-to-br ${avatarGradient(s.name)} rounded-2xl flex items-center justify-center shadow-2xl border-[3px] border-white dark:border-gray-900`}>
                  <span className="text-2xl font-black text-white">{s.name.charAt(0).toUpperCase()}</span>
                </div>
              </div>

              <div className="px-6 pb-6 space-y-4">
                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full capitalize ${cfg.cls}`}>
                    <RoleIcon size={12} />{t(cfg.label)}
                  </span>
                  {s.employment_status === "Inactive" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />{t("Inactive")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-100/80 dark:ring-emerald-800/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{t(s.employment_status || "Active")}
                    </span>
                  )}
                  {s.department && (
                    <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${deptBadgeCls(s.department)}`}>
                      {s.department}
                    </span>
                  )}
                </div>

                {/* Info rows */}
                <div className="bg-gray-50/80 dark:bg-gray-800/50 rounded-xl divide-y divide-gray-100/80 dark:divide-gray-700/60 border border-gray-100 dark:border-gray-800 overflow-hidden">
                  {[
                    { icon: Mail,       label: t("Email"),        value: s.email,                          bold: false },
                    { icon: Briefcase,  label: t("Position"),     value: s.position,                       bold: false, empty: t("Not specified") },
                    { icon: DollarSign, label: t("Salary"),       value: fmt(s.salary),                    bold: true },
                    ...(memberSince ? [{ icon: Calendar, label: t("Member Since"), value: memberSince, bold: false }] : []),
                    { icon: Hash,       label: t("Staff ID"),     value: `#${String(s.id).padStart(4, "0")}`, bold: false },
                  ].map(({ icon: RowIcon, label, value, bold, empty }) => (
                    <div key={label} className="flex items-center gap-3.5 px-4 py-3 hover:bg-white/60 dark:hover:bg-gray-900/30 transition-colors">
                      <div className="w-7 h-7 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center shadow-sm border border-gray-100/80 dark:border-gray-700 flex-shrink-0">
                        <RowIcon size={13} className="text-gray-400 dark:text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</p>
                        <p className={`text-sm truncate mt-0.5 ${bold ? "font-bold text-gray-900 dark:text-white tracking-tight" : "font-medium text-gray-800 dark:text-gray-200"} ${!value && empty ? "italic text-gray-400 dark:text-gray-500 font-normal" : ""}`}>
                          {value || (empty ? empty : "—")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer actions */}
                <div className="flex gap-2.5 pt-1">
                  <button
                    onClick={() => { setViewTarget(null); openEdit(s); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 active:scale-95 transition-all shadow-lg shadow-violet-300/40 dark:shadow-violet-900/30"
                  >
                    <Edit2 size={13} /> {t("Edit Profile")}
                  </button>
                  <button
                    onClick={() => setViewTarget(null)}
                    className="px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 active:scale-95 transition-all"
                  >
                    {t("Close")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Staff;
