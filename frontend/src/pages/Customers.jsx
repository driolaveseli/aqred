import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  UserCheck, Users, Clock, Plus, Search, Download, Edit2, Trash2, X,
  Mail, Phone, MapPin, CheckCircle, Building2, Calendar,
  ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "../services/customersService";
import { exportToCSV } from "../utils/exportCSV";
import { useSystem } from "../context/SystemContext";
import EmptyState from "../components/UI/EmptyState";
import Pagination from "../components/UI/Pagination";

const BLANK       = { name: "", email: "", phone: "", address: "", company: "", status: "Active" };
const inputCls    = "w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent";
const STATUS_TABS = ["All", "Active", "Inactive", "Pending"];
const STATUSES    = ["Active", "Inactive", "Pending"];

/* ─── Status helpers ─────────────────────────────────────────────────────── */
const statusBadgeCls = (s) =>
  s === "Inactive" ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
  : s === "Pending" ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
  : "bg-green-50 dark:bg-emerald-900/20 text-green-600 dark:text-emerald-400";

const statusDotCls = (s) =>
  s === "Inactive" ? "bg-gray-400" : s === "Pending" ? "bg-amber-500" : "bg-emerald-500";

/* ─── Toast ──────────────────────────────────────────────────────────────── */
const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
    ${type === "success" ? "bg-green-50 dark:bg-emerald-900/30 text-green-700 dark:text-emerald-300 border border-green-100 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800"}`}>
    <CheckCircle size={16} /> {msg}
    <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
  </div>
);

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
const colors = [
  "bg-gradient-to-br from-violet-400 to-violet-600 text-white",
  "bg-gradient-to-br from-blue-400 to-indigo-600 text-white",
  "bg-gradient-to-br from-emerald-400 to-teal-600 text-white",
  "bg-gradient-to-br from-amber-400 to-orange-500 text-white",
  "bg-gradient-to-br from-pink-400 to-rose-600 text-white",
];
const avatarColor = (name) => colors[name.charCodeAt(0) % colors.length];

/* ─── Sort icon ──────────────────────────────────────────────────────────── */
const SortIcon = ({ field, sortField, sortDir }) => {
  if (sortField !== field) return <ChevronsUpDown size={12} className="text-gray-300 dark:text-gray-600 ml-1 inline-block" />;
  return sortDir === "asc"
    ? <ChevronUp   size={12} className="text-violet-500 dark:text-violet-400 ml-1 inline-block" />
    : <ChevronDown size={12} className="text-violet-500 dark:text-violet-400 ml-1 inline-block" />;
};

/* ─── Customers ──────────────────────────────────────────────────────────── */
const Customers = () => {
  const { t, formatDate } = useSystem();
  const location = useLocation();

  const [customers, setCustomers]           = useState([]);
  const [search, setSearch]                 = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusTab, setStatusTab]           = useState("All");
  const [view, setView]                     = useState("table");
  const [sortField, setSortField]           = useState("name");
  const [sortDir, setSortDir]               = useState("asc");

  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(25);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats]           = useState({ total: 0, activeCount: 0, inactiveCount: 0, pendingCount: 0 });

  /* Modals */
  const [showModal, setShowModal]           = useState(false);
  const [editing, setEditing]               = useState(null);
  const [form, setForm]                     = useState(BLANK);
  const [deleteId, setDeleteId]             = useState(null);
  const [loading, setLoading]               = useState(false);
  const [toast, setToast]                   = useState(null);

  /* Bulk selection */
  const [selected, setSelected]             = useState(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkLoading, setBulkLoading]       = useState(false);
  const selectAllRef                        = useRef(null);

  /* Inline status popover */
  const [statusPopover, setStatusPopover]   = useState(null); // customer id

  /* ── Debounce search ── */
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  /* ── Open the create modal when deep-linked (e.g. from the command palette) ── */
  useEffect(() => {
    if (location.state?.openCreate) openAdd();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Reset to page 1 whenever filters/search/sort change ── */
  useEffect(() => { setPage(1); }, [debouncedSearch, statusTab, sortField, sortDir]);

  /* ── Load (server-side pagination/filter/sort/stats) ── */
  const load = useCallback(async () => {
    try {
      const { data } = await getCustomers({
        page, limit: pageSize, search: debouncedSearch,
        status: statusTab, sort: sortField, order: sortDir,
      });
      if (data.data.length === 0 && data.total > 0 && page > 1) {
        setPage(data.totalPages);
        return;
      }
      setCustomers(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setStats(data.stats);
    } catch {}
  }, [page, pageSize, debouncedSearch, statusTab, sortField, sortDir]);
  useEffect(() => { load(); }, [load]);

  /* ── Toast ── */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── CRUD ── */
  const openAdd  = () => { setEditing(null); setForm(BLANK); setShowModal(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email, phone: c.phone || "", address: c.address || "", company: c.company || "", status: c.status || "Active" });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (editing) { await updateCustomer(editing.id, form); showToast(t("Customer updated!")); }
      else         { await createCustomer(form);             showToast(t("Customer added!")); }
      setShowModal(false); load();
    } catch { showToast(t("Operation failed."), "error"); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    try { await deleteCustomer(deleteId); showToast(t("Customer removed.")); setDeleteId(null); load(); }
    catch { showToast(t("Delete failed."), "error"); setDeleteId(null); }
  };

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  /* ── Sort ── */
  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  /* ── Current page is already filtered/sorted server-side ── */
  const filtered = customers;

  /* ── Bulk selection ── */
  const allSelected  = filtered.length > 0 && filtered.every((c) => selected.has(c.id));
  const someSelected = filtered.some((c) => selected.has(c.id));

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected && !allSelected;
  }, [someSelected, allSelected]);

  // Clear selection whenever search, filter, or page changes
  useEffect(() => { setSelected(new Set()); }, [debouncedSearch, statusTab, page]);

  const toggleSelect    = (id) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((c) => c.id)));

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    try {
      await Promise.all([...selected].map((id) => deleteCustomer(id)));
      showToast(`${selected.size} ${t("customers deleted.")}`);
      setSelected(new Set());
      setBulkDeleteConfirm(false);
      load();
    } catch { showToast(t("Some deletions failed."), "error"); }
    finally { setBulkLoading(false); }
  };

  const handleBulkExport = () => {
    const rows = customers.filter((c) => selected.has(c.id));
    exportToCSV(rows.map((c) => ({
      Name: c.name, Email: c.email, Phone: c.phone || "",
      Company: c.company || "", Address: c.address || "",
      Status: c.status || "Active",
      "Member Since": c.created_at ? formatDate(c.created_at) : "",
    })), "customers-selected");
  };

  /* ── Inline status change ── */
  useEffect(() => {
    if (!statusPopover) return;
    const handler = (e) => { if (!e.target.closest("[data-status-popover]")) setStatusPopover(null); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusPopover]);

  const handleStatusChange = async (id, newStatus) => {
    const customer = customers.find((c) => c.id === id);
    if (!customer) return;
    try {
      await updateCustomer(id, { ...customer, status: newStatus });
      showToast(t("Status updated."));
      load(); // refresh KPI stat cards along with the row
    } catch { showToast(t("Update failed."), "error"); }
    setStatusPopover(null);
  };

  /* ── Stat counts (server-computed over the full filtered dataset, not just this page) ── */
  const activeCount   = stats.activeCount;
  const inactiveCount = stats.inactiveCount;
  const pendingCount  = stats.pendingCount;

  /* ── Export all filtered (re-fetches the whole matching set, not just the current page) ── */
  const handleExport = async () => {
    try {
      const { data } = await getCustomers({
        limit: Math.max(total, 1), search: debouncedSearch, status: statusTab,
        sort: sortField, order: sortDir,
      });
      exportToCSV(data.data.map((c) => ({
        Name: c.name, Email: c.email, Phone: c.phone || "",
        Company: c.company || "", Address: c.address || "",
        Status: c.status || "Active",
        "Member Since": c.created_at ? formatDate(c.created_at) : "",
      })), "customers");
    } catch { showToast(t("Export failed."), "error"); }
  };

  /* ── Sortable TH ── */
  const SortTh = ({ field, children, className = "" }) => (
    <th
      onClick={() => handleSort(field)}
      className={`px-5 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-600 dark:hover:text-gray-300 transition-colors ${className}`}
    >
      {children}<SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </th>
  );

  /* ── Inline status badge ── */
  const StatusBadge = ({ customer }) => (
    <div className="relative inline-block" data-status-popover>
      <button
        onClick={() => setStatusPopover(statusPopover === customer.id ? null : customer.id)}
        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full transition-opacity hover:opacity-75 ${statusBadgeCls(customer.status)}`}
      >
        {t(customer.status || "Active")}
        <ChevronDown size={9} className="opacity-60" />
      </button>
      {statusPopover === customer.id && (
        <div className="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg z-30 overflow-hidden min-w-[130px]" data-status-popover>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(customer.id, s)}
              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors
                ${(customer.status || "Active") === s
                  ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDotCls(s)}`} />
              {t(s)}
              {(customer.status || "Active") === s && <CheckCircle size={11} className="ml-auto text-violet-500 dark:text-violet-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div>
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-white to-violet-50/30 dark:from-emerald-900/10 dark:via-transparent dark:to-violet-900/10 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-violet-500" />
        <div className="absolute -right-8 -top-8 w-52 h-52 rounded-full bg-gradient-to-br from-emerald-100/40 to-teal-100/20 dark:from-emerald-800/10 dark:to-teal-800/10 pointer-events-none" />
        <div className="absolute right-16 -bottom-10 w-36 h-36 rounded-full bg-gradient-to-br from-violet-100/30 to-teal-100/20 dark:from-violet-800/10 dark:to-teal-800/10 pointer-events-none" />
        <div className="absolute left-1/3 -top-6 w-40 h-40 rounded-full bg-emerald-50/30 dark:bg-emerald-800/10 pointer-events-none" />
        <div className="relative px-6 py-5 flex flex-wrap items-center justify-between gap-y-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-300/40 dark:shadow-emerald-900/30">
                <UserCheck size={22} className="text-white" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white dark:border-gray-900 rounded-full" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("Customers")}</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t("Manage your customer relationships and contact information")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleExport} className="flex items-center gap-2 px-3.5 py-2 border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all shadow-sm">
              <Download size={14} /> {t("Export CSV")}
            </button>
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-violet-700 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-violet-800 active:scale-95 transition-all shadow-md shadow-violet-300/40 dark:shadow-violet-900/30">
              <Plus size={15} /> {t("Add Customer")}
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat strip ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden mb-6">
        {/* Composition bar in violet shades */}
        <div className="flex h-2">
          <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
            style={{ width: stats.total > 0 ? `${Math.round((activeCount/stats.total)*100)}%` : "0%" }} />
          <div className="bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
            style={{ width: stats.total > 0 ? `${Math.round((pendingCount/stats.total)*100)}%` : "0%" }} />
          <div className="bg-gradient-to-r from-gray-300 to-gray-400 transition-all duration-700"
            style={{ width: stats.total > 0 ? `${Math.round((inactiveCount/stats.total)*100)}%` : "0%" }} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100/60 dark:divide-gray-800">
          {[
            {
              label: t("Total"), value: stats.total, tab: "All",
              icon: Users,        iconBg: "bg-gradient-to-br from-violet-500 to-violet-700 text-white",
              color: "text-violet-700 dark:text-violet-400", pctColor: "text-violet-400 dark:text-violet-500",
              barCls: "bg-gradient-to-r from-violet-500 to-violet-600",
              baseBg: "bg-violet-50/40 dark:bg-violet-900/10", activeBg: "bg-violet-50/80 dark:bg-violet-900/20",
              pct: 100,
            },
            {
              label: t("Active"), value: activeCount, tab: "Active",
              icon: CheckCircle,  iconBg: "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white",
              color: "text-emerald-700 dark:text-emerald-400", pctColor: "text-emerald-400 dark:text-emerald-500",
              barCls: "bg-gradient-to-r from-emerald-400 to-emerald-600",
              baseBg: "bg-emerald-50/30 dark:bg-emerald-900/10", activeBg: "bg-emerald-50/70 dark:bg-emerald-900/20",
              pct: stats.total > 0 ? Math.round((activeCount/stats.total)*100) : 0,
            },
            {
              label: t("Inactive"), value: inactiveCount, tab: "Inactive",
              icon: X,            iconBg: "bg-gradient-to-br from-gray-400 to-gray-600 text-white",
              color: "text-gray-600 dark:text-gray-400", pctColor: "text-gray-400 dark:text-gray-500",
              barCls: "bg-gradient-to-r from-gray-300 to-gray-400",
              baseBg: "bg-gray-50/60 dark:bg-gray-800/40", activeBg: "bg-gray-100/80 dark:bg-gray-800/70",
              pct: stats.total > 0 ? Math.round((inactiveCount/stats.total)*100) : 0,
            },
            {
              label: t("Pending"), value: pendingCount, tab: "Pending",
              icon: Clock,        iconBg: "bg-gradient-to-br from-amber-400 to-orange-500 text-white",
              color: "text-amber-700 dark:text-amber-400", pctColor: "text-amber-400 dark:text-amber-500",
              barCls: "bg-gradient-to-r from-amber-400 to-amber-500",
              baseBg: "bg-amber-50/30 dark:bg-amber-900/10", activeBg: "bg-amber-50/70 dark:bg-amber-900/20",
              pct: stats.total > 0 ? Math.round((pendingCount/stats.total)*100) : 0,
            },
          ].map((s) => (
            <button
              key={s.tab}
              onClick={() => setStatusTab(s.tab)}
              className={`relative text-left px-5 py-4 transition-all duration-150 overflow-hidden group
                ${statusTab === s.tab ? s.activeBg : `${s.baseBg} hover:brightness-[0.97] dark:hover:brightness-125`}`}
            >
              {statusTab === s.tab && (
                <div className={`absolute bottom-0 left-0 right-0 h-[3px] ${s.barCls} shadow-sm`} />
              )}
              {/* Icon + number + label on one row */}
              <div className="flex items-center gap-3 mb-2.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-black/10 ${s.iconBg}`}>
                  <s.icon size={16} />
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5 leading-none">
                    <span className={`text-2xl font-black tracking-tight ${s.color}`}>{s.value}</span>
                    <span className={`text-xs font-bold tabular-nums ${s.pctColor}`}>{s.pct}%</span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">{s.label}</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1 bg-white/70 dark:bg-black/20 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${s.barCls}`}
                  style={{ width: `${s.pct}%` }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters row ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative w-full sm:flex-1 sm:max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={t("Search by name, email or company...")}
            className="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-300 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400">
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-0.5 bg-gray-100/90 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700 rounded-xl p-1 flex-shrink-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusTab === tab
                  ? "bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-300 shadow-sm border border-gray-200/80 dark:border-gray-600"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {t(tab)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-0.5 bg-gray-100/90 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700 rounded-xl p-1 flex-shrink-0">
          <button onClick={() => setView("table")} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${view === "table" ? "bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-300 shadow-sm border border-gray-200/80 dark:border-gray-600" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>{t("Table")}</button>
          <button onClick={() => setView("grid")}  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${view === "grid"  ? "bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-300 shadow-sm border border-gray-200/80 dark:border-gray-600" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>{t("Grid")}</button>
        </div>
      </div>

      {/* ── Table view ── */}
      {view === "table" ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-50/60 dark:from-gray-800/60 dark:to-gray-800/30 border-b border-gray-100 dark:border-gray-800">
                  {/* Select-all checkbox */}
                  <th className="pl-5 pr-2 py-3.5 w-10">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                  </th>
                  <SortTh field="name">{t("Customer")}</SortTh>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t("Contact")}</th>
                  <SortTh field="company">{t("Company")}</SortTh>
                  <SortTh field="status">{t("Status")}</SortTh>
                  <SortTh field="date">{t("Member Since")}</SortTh>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => (
                  <tr
                    key={c.id}
                    className={`group ${idx !== filtered.length - 1 ? "border-b border-gray-50 dark:border-gray-800/60" : ""}
                      transition-all duration-150 ${selected.has(c.id) ? "bg-violet-50/70 dark:bg-violet-900/20" : "hover:bg-violet-50/40 dark:hover:bg-violet-900/10"}`}
                  >
                    {/* Row checkbox */}
                    <td className={`pl-4 pr-2 py-4 w-10 transition-all border-l-[3px]
                      ${selected.has(c.id) ? "border-l-violet-500" : "border-l-transparent group-hover:border-l-violet-300"}`}>
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-md ring-2
                          ${(c.status || "Active") === "Active" ? "ring-emerald-200 dark:ring-emerald-800/50" : c.status === "Pending" ? "ring-amber-200 dark:ring-amber-800/50" : "ring-gray-200 dark:ring-gray-700"}
                          ${avatarColor(c.name)}`}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{c.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1"><Mail size={10} /> {c.email}</p>
                      {c.phone && <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5"><Phone size={10} /> {c.phone}</p>}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{c.company || "—"}</td>
                    <td className="px-5 py-4">
                      <StatusBadge customer={c} />
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400 dark:text-gray-500">
                      {c.created_at ? (
                        <span className="flex items-center gap-1.5">
                          <Calendar size={11} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                          {formatDate(c.created_at)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity duration-150">
                        <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-all hover:scale-110"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteId(c.id)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all hover:scale-110"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <EmptyState
              icon={UserCheck}
              title={t("No customers found")}
              description={search || statusTab !== "All" ? t("Try adjusting your search or filter") : t("Add your first customer to begin tracking relationships.")}
              actionLabel={!search && statusTab === "All" ? t("Add Customer") : undefined}
              onAction={!search && statusTab === "All" ? openAdd : undefined}
            />
          )}
        </div>
      ) : (
        /* ── Grid view ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const statusKey = c.status || "Active";
            const headerGrad =
              statusKey === "Active"   ? "from-emerald-500 to-teal-600"
              : statusKey === "Pending" ? "from-amber-400 to-orange-500"
              : "from-gray-400 to-gray-500";
            return (
              <div key={c.id} className={`relative group bg-white dark:bg-gray-900 border rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 ${selected.has(c.id) ? "border-violet-300 dark:border-violet-700 ring-2 ring-violet-100 dark:ring-violet-900/30" : "border-gray-100 dark:border-gray-800"}`}>
                {/* ── Gradient header band ── */}
                <div className={`relative h-[52px] bg-gradient-to-r ${headerGrad}`}>
                  <div className="absolute right-2 -top-3 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />
                  <div className="absolute right-14 top-2 w-10 h-10 rounded-full bg-white/10 pointer-events-none" />
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    className="absolute top-3 left-3 w-4 h-4 rounded border-white/60 bg-white/20 text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                </div>

                {/* ── Avatar overlapping header/body ── */}
                <div className="relative px-4 pb-4">
                  <div className="flex items-end justify-between -mt-5 mb-3">
                    <div className={`w-12 h-12 rounded-xl border-2 border-white dark:border-gray-900 shadow-lg flex items-center justify-center text-base font-bold flex-shrink-0 ${avatarColor(c.name)}`}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="pb-0.5">
                      <StatusBadge customer={c} />
                    </div>
                  </div>

                  {/* ── Name & company ── */}
                  <div className="mb-3 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight truncate">{c.name}</p>
                    {c.company && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                        <Building2 size={10} className="flex-shrink-0" /> {c.company}
                      </p>
                    )}
                  </div>

                  {/* ── Contact details ── */}
                  <div className="space-y-1.5 mb-3 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl px-3 py-2.5">
                    <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2 truncate">
                      <Mail size={11} className="text-violet-400 dark:text-violet-500 flex-shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </p>
                    {c.phone && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Phone size={11} className="text-blue-400 dark:text-blue-500 flex-shrink-0" />{c.phone}
                      </p>
                    )}
                    {c.address && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 truncate">
                        <MapPin size={11} className="text-emerald-400 dark:text-emerald-500 flex-shrink-0" />
                        <span className="truncate">{c.address}</span>
                      </p>
                    )}
                  </div>

                  {/* ── Member since ── */}
                  {c.created_at && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3 px-0.5">
                      {t("Member since")} {formatDate(c.created_at)}
                    </p>
                  )}

                  {/* ── Actions ── */}
                  <div className="flex items-center border-t border-gray-100 dark:border-gray-800 pt-3 -mx-1">
                    <button onClick={() => openEdit(c)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors">
                      <Edit2 size={12} />{t("Edit")}
                    </button>
                    <div className="w-px h-4 bg-gray-100 dark:bg-gray-800" />
                    <button onClick={() => setDeleteId(c.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors">
                      <Trash2 size={12} />{t("Delete")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={UserCheck}
                title={t("No customers found")}
                description={search || statusTab !== "All" ? t("Try adjusting your search or filter") : t("Add your first customer to begin tracking relationships.")}
                actionLabel={!search && statusTab === "All" ? t("Add Customer") : undefined}
                onAction={!search && statusTab === "All" ? openAdd : undefined}
              />
            </div>
          )}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
        itemLabel={t("customers")}
      />

      {/* ── Bulk action bar ── */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300
        ${selected.size > 0 ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" : "opacity-0 translate-y-4 scale-95 pointer-events-none"}`}>
        <div className="flex items-center gap-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl
          p-2 rounded-2xl shadow-xl shadow-gray-300/60 dark:shadow-black/50 border border-gray-200/80 dark:border-gray-700 whitespace-nowrap">

          {/* Selection count badge */}
          <div className="flex items-center gap-2 pl-3 pr-3.5 py-1.5 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/50 rounded-xl">
            <span className="text-sm font-black text-violet-700 dark:text-violet-300 tabular-nums leading-none">{selected.size}</span>
            <span className="text-xs font-medium text-violet-500 dark:text-violet-400 leading-none">{t("selected")}</span>
          </div>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

          <button onClick={handleBulkExport}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-500 dark:text-gray-400
              hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all active:scale-95">
            <Download size={14} /> {t("Export")}
          </button>

          <button onClick={() => setBulkDeleteConfirm(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-red-500 dark:text-red-400
              hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-95">
            <Trash2 size={14} /> {t("Delete")}
          </button>

          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

          <button onClick={() => setSelected(new Set())} title={t("Clear selection")}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all active:scale-95">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 overflow-y-auto py-4 sm:py-8 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-auto my-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white">{editing ? t("Edit Customer") : t("Add Customer")}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Full Name")}</label>
                <input required className={inputCls} placeholder="John Doe" value={form.name} onChange={set("name")} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Email Address")}</label>
                <input type="email" required className={inputCls} placeholder="john@example.com" value={form.email} onChange={set("email")} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Phone")}</label>
                  <input className={inputCls} placeholder="+1 555-0000" value={form.phone} onChange={set("phone")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Company")}</label>
                  <input className={inputCls} placeholder="Company name" value={form.company} onChange={set("company")} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Address")}</label>
                <input className={inputCls} placeholder="Street, City, State" value={form.address} onChange={set("address")} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Status")}</label>
                <select className={inputCls} value={form.status} onChange={set("status")}>
                  <option value="Active">{t("Active")}</option>
                  <option value="Inactive">{t("Inactive")}</option>
                  <option value="Pending">{t("Pending")}</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg active:scale-95">{t("Cancel")}</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60 active:scale-95">
                  {loading ? t("Saving...") : editing ? t("Save Changes") : t("Add Customer")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Single delete confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-500 dark:text-red-400" /></div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t("Delete Customer?")}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{t("This action cannot be undone.")}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95">{t("Cancel")}</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-95">{t("Delete")}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk delete confirm ── */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-500 dark:text-red-400" /></div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t("Delete")} {selected.size} {t("customers?")}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{t("This will permanently remove all selected customers. This action cannot be undone.")}</p>
            <div className="flex gap-3">
              <button onClick={() => setBulkDeleteConfirm(false)} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95">{t("Cancel")}</button>
              <button onClick={handleBulkDelete} disabled={bulkLoading} className="flex-1 px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-60 active:scale-95">
                {bulkLoading ? t("Deleting...") : t("Delete All")}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Customers;
