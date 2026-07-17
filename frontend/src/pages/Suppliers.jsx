import { useState, useEffect, useRef } from "react";
import {
  Truck, Plus, Search, Mail, Phone, MapPin, X, Building2, Edit2, Trash2,
  CheckCircle, Download, Package,
  ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from "../services/suppliersService";
import { exportToCSV } from "../utils/exportCSV";
import { useSystem } from "../context/SystemContext";
import EmptyState from "../components/UI/EmptyState";
import useEscapeKey from "../hooks/useEscapeKey";

/* ─── Constants ──────────────────────────────────────────────────────────── */
const CATEGORIES  = ["Electronics", "Hardware", "Accessories", "Office Equipment", "Computer Accessories", "Furniture", "Industrial Equipment", "Software", "Other"];
const STATUS_TABS = ["All", "Active", "Inactive"];

const BLANK = {
  company_name: "", contact_person: "", email: "", phone: "",
  location: "", category: "Electronics", status: "Active", products_supplied: "",
};

const inputCls = "w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent";

/* ─── Avatar colors ──────────────────────────────────────────────────────── */
const AVATAR_COLORS = [
  "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400", "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400", "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400", "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
];
const avatarColor = (name) => AVATAR_COLORS[(name || "").charCodeAt(0) % AVATAR_COLORS.length];

/* ─── Category badge colors ──────────────────────────────────────────────── */
const CAT_COLORS = [
  "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400", "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400",
  "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400", "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
  "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400", "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400",
  "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400", "bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400",
  "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400",
];
const catColor = (cat) => CAT_COLORS[CATEGORIES.indexOf(cat) % CAT_COLORS.length] || CAT_COLORS[0];

/* ─── Status helpers ─────────────────────────────────────────────────────── */
const statusBadgeCls = (s) => s === "Inactive" ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400" : "bg-green-50 dark:bg-emerald-900/20 text-green-600 dark:text-emerald-400";
const statusDotCls   = (s) => s === "Inactive" ? "bg-gray-400" : "bg-emerald-500";

/* ─── Toast ──────────────────────────────────────────────────────────────── */
const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
    ${type === "success" ? "bg-green-50 dark:bg-emerald-900/30 text-green-700 dark:text-emerald-300 border border-green-100 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800"}`}>
    <CheckCircle size={16} /> {msg}
    <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
  </div>
);

/* ─── Sort icon ──────────────────────────────────────────────────────────── */
const SortIcon = ({ field, sortField, sortDir }) => {
  if (sortField !== field) return <ChevronsUpDown size={12} className="text-gray-300 dark:text-gray-600 ml-1 inline-block" />;
  return sortDir === "asc"
    ? <ChevronUp   size={12} className="text-violet-500 dark:text-violet-400 ml-1 inline-block" />
    : <ChevronDown size={12} className="text-violet-500 dark:text-violet-400 ml-1 inline-block" />;
};

/* ─── Suppliers ──────────────────────────────────────────────────────────── */
const Suppliers = () => {
  const { t, formatDate } = useSystem();

  const [suppliers, setSuppliers]       = useState([]);
  const [search, setSearch]             = useState("");
  const [statusTab, setStatusTab]       = useState("All");
  const [catFilter, setCatFilter]       = useState("All");
  const [view, setView]                 = useState("table");
  const [sortField, setSortField]       = useState("company_name");
  const [sortDir, setSortDir]           = useState("asc");

  /* Modals */
  const [showModal, setShowModal]       = useState(false);
  const [editing, setEditing]           = useState(null);
  const [form, setForm]                 = useState(BLANK);
  const [deleteId, setDeleteId]         = useState(null);
  const [toast, setToast]               = useState(null);
  const [loading, setLoading]           = useState(false);

  /* Products panel */
  const [productsPanel, setProductsPanel] = useState(null);
  const [productSearch, setProductSearch] = useState("");

  /* Bulk */
  const [selected, setSelected]                   = useState(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkLoading, setBulkLoading]             = useState(false);
  const selectAllRef                              = useRef(null);

  /* Inline status popover */
  const [statusPopover, setStatusPopover] = useState(null);

  /* ── Load ── */
  const load = async () => {
    try { const { data } = await getSuppliers(); setSuppliers(data); }
    catch { showToast("Failed to load suppliers.", "error"); }
  };
  useEffect(() => { load(); }, []);

  useEscapeKey(showModal, () => setShowModal(false));
  useEscapeKey(!!deleteId, () => setDeleteId(null));
  useEscapeKey(bulkDeleteConfirm, () => setBulkDeleteConfirm(false));
  useEscapeKey(!!productsPanel, () => setProductsPanel(null));

  /* ── Close status popover on outside click ── */
  useEffect(() => {
    if (!statusPopover) return;
    const handler = (e) => { if (!e.target.closest("[data-status-popover]")) setStatusPopover(null); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusPopover]);

  /* ── Toast ── */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── CRUD ── */
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const openAdd  = () => { setEditing(null); setForm(BLANK); setShowModal(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({
      company_name:      s.company_name || "",
      contact_person:    s.contact_person || "",
      email:             s.email || "",
      phone:             s.phone || "",
      location:          s.location || "",
      category:          s.category || "Electronics",
      status:            s.status || "Active",
      products_supplied: s.products_supplied || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (editing) { await updateSupplier(editing.id, form); showToast(t("Supplier updated!")); }
      else         { await createSupplier(form);             showToast(t("Supplier added!")); }
      setShowModal(false); load();
    } catch (err) {
      showToast(err.response?.data?.error || "Operation failed.", "error");
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    try { await deleteSupplier(deleteId); showToast(t("Supplier removed.")); setDeleteId(null); load(); }
    catch { showToast(t("Delete failed."), "error"); setDeleteId(null); }
  };

  /* ── Inline status change ── */
  const handleStatusChange = async (id, newStatus) => {
    const supplier = suppliers.find((s) => s.id === id);
    if (!supplier) return;
    try {
      await updateSupplier(id, { ...supplier, status: newStatus });
      setSuppliers((prev) => prev.map((s) => s.id === id ? { ...s, status: newStatus } : s));
      showToast(t("Status updated."));
    } catch { showToast(t("Update failed."), "error"); }
    setStatusPopover(null);
  };

  /* ── Sort ── */
  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  /* ── Filter + sort pipeline ── */
  const filtered = suppliers
    .filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        (s.company_name   || "").toLowerCase().includes(q) ||
        (s.contact_person || "").toLowerCase().includes(q) ||
        (s.category       || "").toLowerCase().includes(q) ||
        (s.location       || "").toLowerCase().includes(q);
      const matchStatus = statusTab === "All" || (s.status || "Active") === statusTab;
      const matchCat    = catFilter  === "All" || (s.category || "") === catFilter;
      return matchSearch && matchStatus && matchCat;
    })
    .sort((a, b) => {
      let aVal, bVal;
      if (sortField === "company_name") { aVal = (a.company_name || "").toLowerCase(); bVal = (b.company_name || "").toLowerCase(); }
      if (sortField === "category")     { aVal = (a.category     || "").toLowerCase(); bVal = (b.category     || "").toLowerCase(); }
      if (sortField === "status")       { aVal = (a.status       || "").toLowerCase(); bVal = (b.status       || "").toLowerCase(); }
      if (sortField === "date")         { aVal = new Date(a.created_at || 0);          bVal = new Date(b.created_at || 0); }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ?  1 : -1;
      return 0;
    });

  /* ── Bulk selection ── */
  const allSelected  = filtered.length > 0 && filtered.every((s) => selected.has(s.id));
  const someSelected = filtered.some((s) => selected.has(s.id));

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected && !allSelected;
  }, [someSelected, allSelected]);

  useEffect(() => { setSelected(new Set()); }, [search, statusTab, catFilter]);

  const toggleSelect    = (id) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((s) => s.id)));

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    try {
      await Promise.all([...selected].map((id) => deleteSupplier(id)));
      showToast(`${selected.size} ${t("suppliers deleted.")}`);
      setSelected(new Set());
      setBulkDeleteConfirm(false);
      load();
    } catch { showToast(t("Some deletions failed."), "error"); }
    finally { setBulkLoading(false); }
  };

  const handleBulkExport = () => {
    const rows = suppliers.filter((s) => selected.has(s.id));
    exportToCSV(rows.map((s) => ({
      "Company Name":     s.company_name,
      "Contact Person":   s.contact_person || "",
      Email:              s.email || "",
      Phone:              s.phone || "",
      Location:           s.location || "",
      Category:           s.category || "",
      Status:             s.status || "Active",
      "Products Supplied": s.products_supplied || "",
    })), "suppliers-selected");
  };

  const handleExport = () => exportToCSV(filtered.map((s) => ({
    "Company Name":     s.company_name,
    "Contact Person":   s.contact_person || "",
    Email:              s.email || "",
    Phone:              s.phone || "",
    Location:           s.location || "",
    Category:           s.category || "",
    Status:             s.status || "Active",
    "Products Supplied": s.products_supplied || "",
  })), "suppliers");

  /* ── Stats ── */
  const activeCount   = suppliers.filter((s) => (s.status || "Active") === "Active").length;
  const inactiveCount = suppliers.filter((s) => s.status === "Inactive").length;
  const catCount      = new Set(suppliers.map((s) => s.category).filter(Boolean)).size;

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
  const StatusBadge = ({ supplier }) => (
    <div className="relative inline-block" data-status-popover>
      <button
        onClick={() => setStatusPopover(statusPopover === supplier.id ? null : supplier.id)}
        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full transition-opacity hover:opacity-75 ${statusBadgeCls(supplier.status)}`}
      >
        {t(supplier.status || "Active")}
        <ChevronDown size={9} className="opacity-60" />
      </button>
      {statusPopover === supplier.id && (
        <div className="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg z-30 overflow-hidden min-w-[130px]" data-status-popover>
          {["Active", "Inactive"].map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(supplier.id, s)}
              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors
                ${(supplier.status || "Active") === s ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 font-semibold" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDotCls(s)}`} />
              {t(s)}
              {(supplier.status || "Active") === s && <CheckCircle size={11} className="ml-auto text-violet-500 dark:text-violet-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  /* ── Products pill list ── */
  const ProductPills = ({ supplier, max = 2 }) => {
    const all     = (supplier.products_supplied || "").split(",").map((p) => p.trim()).filter(Boolean);
    const visible  = all.slice(0, max);
    const remaining = all.length - visible.length;
    if (!all.length) return <span className="text-sm text-gray-400 dark:text-gray-500">—</span>;
    return (
      <button
        onClick={() => { setProductsPanel(supplier); setProductSearch(""); }}
        className="flex flex-wrap items-center gap-1 text-left group"
        title="Click to view all products"
      >
        {visible.map((p) => (
          <span key={p} className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full whitespace-nowrap group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
            {p}
          </span>
        ))}
        {remaining > 0 && (
          <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-full whitespace-nowrap group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30 transition-colors">
            +{remaining} more
          </span>
        )}
      </button>
    );
  };

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t("Suppliers")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("Manage your supplier relationships, contacts, and product sources")}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all">
            <Download size={15} /> {t("Export CSV")}
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 active:scale-95 transition-all">
            <Plus size={16} /> {t("Add Supplier")}
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: t("Total"),      value: suppliers.length, color: "text-violet-600 dark:text-violet-400",  tab: "All"      },
          { label: t("Active"),     value: activeCount,      color: "text-emerald-600 dark:text-emerald-400", tab: "Active"   },
          { label: t("Inactive"),   value: inactiveCount,    color: "text-gray-500 dark:text-gray-400",    tab: "Inactive" },
          { label: t("Categories"), value: catCount,         color: "text-blue-600 dark:text-blue-400",    tab: null       },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => s.tab !== null && setStatusTab(statusTab === s.tab ? "All" : s.tab)}
            className={`text-left bg-white dark:bg-gray-900 border rounded-2xl p-5 shadow-sm transition-all duration-200
              ${s.tab !== null ? "hover:shadow-md cursor-pointer" : "cursor-default"}
              ${s.tab !== null && statusTab === s.tab ? "border-violet-300 dark:border-violet-700 ring-2 ring-violet-100 dark:ring-violet-900/30" : "border-gray-100 dark:border-gray-800"}`}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </button>
        ))}
      </div>

      {/* ── Filters row ── */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 mb-3">
        {/* Search */}
        <div className="relative w-full sm:flex-1 sm:max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={t("Search by company, contact, category or location...")}
            className="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-1 flex-shrink-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${statusTab === tab ? "bg-violet-600 text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
            >
              {t(tab)}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-1 flex-shrink-0">
          <button onClick={() => setView("table")} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${view === "table" ? "bg-violet-600 text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>{t("Table")}</button>
          <button onClick={() => setView("grid")}  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${view === "grid"  ? "bg-violet-600 text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>{t("Grid")}</button>
        </div>
      </div>

      {/* ── Category tabs (horizontal scrollable) ── */}
      <div className="overflow-x-auto mb-4 -mx-0.5 px-0.5">
        <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-1 w-max">
          <button
            onClick={() => setCatFilter("All")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${catFilter === "All" ? "bg-violet-600 text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
          >
            {t("All Categories")}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(catFilter === c ? "All" : c)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${catFilter === c ? "bg-violet-600 text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table view ── */}
      {view === "table" ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="pl-5 pr-2 py-3.5 w-10">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                  </th>
                  <SortTh field="company_name">{t("Supplier")}</SortTh>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t("Contact")}</th>
                  <SortTh field="category">{t("Category")}</SortTh>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t("Products Supplied")}</th>
                  <SortTh field="status">{t("Status")}</SortTh>
                  <SortTh field="date">{t("Since")}</SortTh>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <tr
                    key={s.id}
                    className={`${idx !== filtered.length - 1 ? "border-b border-gray-50 dark:border-gray-800/60" : ""}
                      transition-colors ${selected.has(s.id) ? "bg-violet-50/60 dark:bg-violet-900/20" : "hover:bg-violet-50/30 dark:hover:bg-violet-900/10"}`}
                  >
                    <td className="pl-5 pr-2 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggleSelect(s.id)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${avatarColor(s.company_name)}`}>
                          {(s.company_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.company_name}</p>
                          {s.location && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                              <MapPin size={10} /> {s.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {s.contact_person
                        ? <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{s.contact_person}</p>
                        : <span className="text-sm text-gray-400 dark:text-gray-500">—</span>}
                      {s.email && <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5"><Mail size={10} />{s.email}</p>}
                      {s.phone && <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5"><Phone size={10} />{s.phone}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${catColor(s.category)}`}>
                        {s.category || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <ProductPills supplier={s} max={2} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge supplier={s} />
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400 dark:text-gray-500">
                      {s.created_at ? formatDate(s.created_at) : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteId(s.id)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <EmptyState
              icon={Truck}
              title={t("No suppliers found")}
              description={search || statusTab !== "All" || catFilter !== "All" ? t("Try adjusting your search or filters") : t("Add your first supplier to manage your supply chain.")}
              actionLabel={!search && statusTab === "All" && catFilter === "All" ? t("Add Supplier") : undefined}
              onAction={!search && statusTab === "All" && catFilter === "All" ? openAdd : undefined}
            />
          )}
        </div>
      ) : (
        /* ── Grid view ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const products = (s.products_supplied || "").split(",").map((p) => p.trim()).filter(Boolean);
            return (
              <div
                key={s.id}
                className={`bg-white dark:bg-gray-900 border rounded-2xl p-5 hover:shadow-md transition-all ${selected.has(s.id) ? "border-violet-300 dark:border-violet-700 ring-2 ring-violet-100 dark:ring-violet-900/30" : "border-gray-100 dark:border-gray-800"}`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500 cursor-pointer flex-shrink-0 mt-0.5"
                    />
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0 ${avatarColor(s.company_name)}`}>
                      {(s.company_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{s.company_name}</p>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 text-xs font-medium rounded-full ${catColor(s.category)}`}>
                        {s.category || "—"}
                      </span>
                    </div>
                  </div>
                  <StatusBadge supplier={s} />
                </div>

                {/* Contact info */}
                <div className="space-y-1.5 mb-4">
                  {s.contact_person && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2 font-medium">
                      <Building2 size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />{s.contact_person}
                    </p>
                  )}
                  {s.email && (
                    <a href={`mailto:${s.email}`} className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                      <Mail size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />{s.email}
                    </a>
                  )}
                  {s.phone && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Phone size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />{s.phone}
                    </p>
                  )}
                  {s.location && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <MapPin size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />{s.location}
                    </p>
                  )}
                </div>

                {/* Products supplied */}
                {products.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">{t("Products Supplied")}</p>
                    <div className="flex flex-wrap gap-1">
                      {products.slice(0, 3).map((p) => (
                        <span key={p} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">{p}</span>
                      ))}
                      {products.length > 3 && (
                        <button
                          onClick={() => { setProductsPanel(s); setProductSearch(""); }}
                          className="px-2 py-0.5 text-xs bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-full font-semibold hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
                        >
                          +{products.length - 3} more
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button onClick={() => openEdit(s)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors">
                    <Edit2 size={12} />{t("Edit")}
                  </button>
                  {products.length > 0 && (
                    <button
                      onClick={() => { setProductsPanel(s); setProductSearch(""); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Package size={12} />{t("Products")}
                    </button>
                  )}
                  <button onClick={() => setDeleteId(s.id)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Trash2 size={12} />{t("Delete")}
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={Truck}
                title={t("No suppliers found")}
                description={search || statusTab !== "All" || catFilter !== "All" ? t("Try adjusting your search or filters") : t("Add your first supplier to manage your supply chain.")}
                actionLabel={!search && statusTab === "All" && catFilter === "All" ? t("Add Supplier") : undefined}
                onAction={!search && statusTab === "All" && catFilter === "All" ? openAdd : undefined}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Result count ── */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
        {t("Showing")} {filtered.length} {t("of")} {suppliers.length} {t("suppliers")}
        {(statusTab !== "All" || catFilter !== "All") && (
          <span className="ml-1">
            · {t("filtered by")}
            {statusTab !== "All" && <span className="font-medium text-gray-500 dark:text-gray-400 ml-1">{t(statusTab)}</span>}
            {statusTab !== "All" && catFilter !== "All" && " &"}
            {catFilter !== "All" && <span className="font-medium text-gray-500 dark:text-gray-400 ml-1">{catFilter}</span>}
          </span>
        )}
      </p>

      {/* ── Bulk action bar ── */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-200
        ${selected.size > 0 ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-3 pointer-events-none"}`}>
        <div className="flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-gray-700 whitespace-nowrap">
          <span className="text-sm font-semibold">{selected.size} {t("selected")}</span>
          <div className="w-px h-4 bg-gray-600" />
          <button onClick={handleBulkExport} className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors">
            <Download size={14} /> {t("Export")}
          </button>
          <button onClick={() => setBulkDeleteConfirm(true)} className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors">
            <Trash2 size={14} /> {t("Delete")}
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-1 text-gray-500 hover:text-white transition-colors" title={t("Clear selection")}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 overflow-y-auto py-4 sm:py-8 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg mx-auto my-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">{editing ? t("Edit Supplier") : t("Add Supplier")}</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{editing ? t("Update supplier information") : t("Fill in the details to add a new supplier")}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Company Name")} <span className="text-red-500">*</span></label>
                <input type="text" required autoFocus className={inputCls} placeholder="e.g. Acme Corp" value={form.company_name} onChange={set("company_name")} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Contact Person")}</label>
                <input type="text" className={inputCls} placeholder="Full name" value={form.contact_person} onChange={set("contact_person")} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Email Address")}</label>
                  <input type="email" className={inputCls} placeholder="email@company.com" value={form.email} onChange={set("email")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Phone")}</label>
                  <input type="text" className={inputCls} placeholder="+1 555-0000" value={form.phone} onChange={set("phone")} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Location")}</label>
                <input type="text" className={inputCls} placeholder="City, Country" value={form.location} onChange={set("location")} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Category")}</label>
                  <select className={inputCls} value={form.category} onChange={set("category")}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Status")}</label>
                  <select className={inputCls} value={form.status} onChange={set("status")}>
                    <option value="Active">{t("Active")}</option>
                    <option value="Inactive">{t("Inactive")}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Products Supplied")}</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. Laptops, Monitors, Keyboards"
                  value={form.products_supplied}
                  onChange={set("products_supplied")}
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t("Comma-separated list of products this supplier provides")}</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg active:scale-95">{t("Cancel")}</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60 active:scale-95">
                  {loading ? t("Saving...") : editing ? t("Save Changes") : t("Add Supplier")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Single delete confirm ── */}
      {deleteId && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteId(null); }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-500 dark:text-red-400" /></div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t("Delete Supplier?")}</h3>
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
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setBulkDeleteConfirm(false); }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-500 dark:text-red-400" /></div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t("Delete")} {selected.size} {t("suppliers?")}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{t("This will permanently remove all selected suppliers. This action cannot be undone.")}</p>
            <div className="flex gap-3">
              <button onClick={() => setBulkDeleteConfirm(false)} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95">{t("Cancel")}</button>
              <button onClick={handleBulkDelete} disabled={bulkLoading} className="flex-1 px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-60 active:scale-95">
                {bulkLoading ? t("Deleting...") : t("Delete All")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Products panel modal ── */}
      {productsPanel && (() => {
        const all      = (productsPanel.products_supplied || "").split(",").map((p) => p.trim()).filter(Boolean);
        const filtered = productSearch.trim()
          ? all.filter((p) => p.toLowerCase().includes(productSearch.toLowerCase()))
          : all;
        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setProductsPanel(null)}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold ${avatarColor(productsPanel.company_name)}`}>
                    {(productsPanel.company_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{productsPanel.company_name}</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {all.length} {all.length === 1 ? t("product") : t("products")} {t("supplied")}
                    </p>
                  </div>
                </div>
                <button onClick={() => setProductsPanel(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mt-0.5 p-1"><X size={18} /></button>
              </div>

              {/* Search (only when > 6) */}
              {all.length > 6 && (
                <div className="px-6 pt-4 pb-2 flex-shrink-0">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      autoFocus
                      type="text"
                      placeholder={t("Search products...")}
                      className="w-full pl-9 pr-9 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                    {productSearch && (
                      <button onClick={() => setProductSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* List */}
              <div className="overflow-y-auto flex-1 px-6 py-4">
                {filtered.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">{t("No products match your search.")}</p>
                ) : (
                  <ul className="space-y-1">
                    {filtered.map((p, i) => (
                      <li key={p} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <span className="w-6 h-6 bg-violet-50 dark:bg-violet-900/20 rounded-lg flex items-center justify-center text-xs font-bold text-violet-500 dark:text-violet-400 flex-shrink-0">
                          {productSearch ? <Package size={11} className="text-violet-400 dark:text-violet-500" /> : i + 1}
                        </span>
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium flex-1">{p}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {productSearch ? `${filtered.length} of ${all.length} products` : `${all.length} ${all.length === 1 ? "product" : "products"} total`}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setProductsPanel(null); openEdit(productsPanel); }}
                    className="px-3 py-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
                  >
                    {t("Edit Supplier")}
                  </button>
                  <button
                    onClick={() => setProductsPanel(null)}
                    className="px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
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

export default Suppliers;
