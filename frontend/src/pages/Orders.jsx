import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  ShoppingCart, Plus, Search, Download, Edit2, Trash2, X,
  CheckCircle, Clock, XCircle, Truck, Package, PlusCircle,
  ChevronUp, ChevronDown, ChevronsUpDown, ChevronDown as ChevronDownSm,
} from "lucide-react";
import { getOrders, getOrderItems, createOrder, updateOrder, deleteOrder } from "../services/ordersService";
import { getCustomers } from "../services/customersService";
import { getProducts } from "../services/productsService";
import { exportToCSV } from "../utils/exportCSV";
import { useSystem } from "../context/SystemContext";
import EmptyState from "../components/UI/EmptyState";
import Pagination from "../components/UI/Pagination";
import useEscapeKey from "../hooks/useEscapeKey";

const STATUSES   = ["Pending", "Processing", "Shipped", "Completed", "Cancelled"];
const DATE_RANGES = ["All", "Today", "This Week", "This Month"];
const inputCls   = "w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent";
const today      = () => new Date().toISOString().slice(0, 10);
const BLANK_ITEM = { product_id: "", quantity: 1, unit_price: 0, product_name: "" };
const BLANK      = { customer_id: "", status: "Pending", notes: "", order_date: today(), items: [{ ...BLANK_ITEM }] };

const statusConfig = {
  Completed:  { label: "Completed",  icon: CheckCircle, cls: "bg-green-50 dark:bg-emerald-900/20 text-green-600 dark:text-emerald-400",   dot: "bg-green-500"  },
  Pending:    { label: "Pending",    icon: Clock,       cls: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",   dot: "bg-amber-500"  },
  Processing: { label: "Processing", icon: Clock,       cls: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",     dot: "bg-blue-500"   },
  Shipped:    { label: "Shipped",    icon: Truck,       cls: "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400", dot: "bg-violet-500" },
  Cancelled:  { label: "Cancelled",  icon: XCircle,     cls: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",       dot: "bg-red-500"    },
};

const fmt = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v || 0);

/* ─── Toast ──────────────────────────────────────────────────────────────── */
const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 z-50 animate-toast-in flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
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

/* ─── Orders ─────────────────────────────────────────────────────────────── */
const Orders = () => {
  const { formatDate, t } = useSystem();
  const location          = useLocation();

  const [orders, setOrders]       = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts]   = useState([]);
  const [search, setSearch]       = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("All");
  const [sortField, setSortField] = useState("id");
  const [sortDir, setSortDir]     = useState("desc");

  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(25);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats]           = useState({ total: 0, pendingCount: 0, processingCount: 0, completedCount: 0, totalRevenue: 0 });

  /* Modals */
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(BLANK);
  const [deleteId, setDeleteId]     = useState(null);
  const [toast, setToast]           = useState(null);
  const [loading, setLoading]       = useState(false);
  const [itemsModal, setItemsModal] = useState(null);

  /* Bulk */
  const [selected, setSelected]                   = useState(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkStatusMenu, setBulkStatusMenu]       = useState(false);
  const [bulkLoading, setBulkLoading]             = useState(false);
  const selectAllRef                              = useRef(null);
  const bulkMenuRef                               = useRef(null);

  /* ── Debounce search ── */
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  /* ── Reset to page 1 whenever filters/search/sort change ── */
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, dateRange, sortField, sortDir]);

  /* ── Load (server-side pagination/filter/sort/stats) ── */
  const load = useCallback(async () => {
    try {
      const { data } = await getOrders({
        page, limit: pageSize, search: debouncedSearch,
        status: statusFilter, dateRange, sort: sortField, order: sortDir,
      });
      if (data.data.length === 0 && data.total > 0 && page > 1) {
        setPage(data.totalPages);
        return;
      }
      setOrders(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setStats(data.stats);
    } catch {}
  }, [page, pageSize, debouncedSearch, statusFilter, dateRange, sortField, sortDir]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    // "New Order" form needs the full customer/product lists for its dropdowns,
    // not just one paginated page — fetch with a limit comfortably above current volumes.
    getCustomers({ limit: 5000 }).then(({ data }) => setCustomers(data.data)).catch(() => {});
    getProducts({ limit: 5000 }).then(({ data }) => setProducts(data.data)).catch(() => {});
    if (location.state?.openCreate) openAdd();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEscapeKey(showModal, () => setShowModal(false));
  useEscapeKey(!!deleteId, () => setDeleteId(null));
  useEscapeKey(bulkDeleteConfirm, () => setBulkDeleteConfirm(false));
  useEscapeKey(!!itemsModal, () => setItemsModal(null));

  /* Close bulk status menu on outside click */
  useEffect(() => {
    if (!bulkStatusMenu) return;
    const handler = (e) => { if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target)) setBulkStatusMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [bulkStatusMenu]);

  /* ── Toast ── */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── CRUD ── */
  const openAdd = () => {
    setEditing(null);
    setForm({ ...BLANK, order_date: today(), items: [{ ...BLANK_ITEM }] });
    setShowModal(true);
  };

  const openEdit = async (o) => {
    setEditing(o);
    let items = [];
    try {
      const { data } = await getOrderItems(o.id);
      items = data.map((it) => ({
        product_id:   it.product_id,
        quantity:     it.quantity,
        unit_price:   parseFloat(it.unit_price),
        product_name: it.product_name,
      }));
    } catch {}
    if (!items.length) items = [{ ...BLANK_ITEM }];
    setForm({
      customer_id: o.customer_id,
      status:      o.status,
      notes:       o.notes || "",
      order_date:  o.order_date ? o.order_date.slice(0, 10) : today(),
      items,
    });
    setShowModal(true);
  };

  /* ── Item row helpers ── */
  const stockFor = (product_id) => {
    const p = products.find((p) => p.id === Number(product_id));
    return p ? Number(p.stock) : Infinity;
  };

  const setItem = (idx, field, value) => {
    const updated = form.items.map((it, i) => {
      if (i !== idx) return it;
      const next = { ...it, [field]: value };
      if (field === "product_id") {
        const prod = products.find((p) => p.id === Number(value));
        if (prod) { next.unit_price = parseFloat(prod.price); next.product_name = prod.name; next.quantity = 1; }
      }
      if (field === "quantity") {
        const max = stockFor(it.product_id);
        next.quantity = Math.min(Math.max(1, Number(value)), max);
      }
      return next;
    });
    setForm((f) => ({ ...f, items: updated }));
  };

  const addItem    = () => setForm((f) => ({ ...f, items: [...f.items, { ...BLANK_ITEM }] }));
  const removeItem = (idx) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const orderTotal = form.items.reduce((sum, it) => sum + (parseFloat(it.unit_price) || 0) * (parseInt(it.quantity) || 0), 0);

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = form.items.filter((it) => it.product_id && it.quantity > 0);
    if (!validItems.length) { showToast("Add at least one product.", "error"); return; }
    const overStock = validItems.find((it) => Number(it.quantity) > stockFor(it.product_id));
    if (overStock) {
      const p = products.find((p) => p.id === Number(overStock.product_id));
      showToast(`${p?.name || "Product"} only has ${stockFor(overStock.product_id)} in stock.`, "error");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        customer_id: Number(form.customer_id),
        status:      form.status,
        notes:       form.notes || null,
        order_date:  form.order_date,
        items: validItems.map((it) => ({
          product_id: Number(it.product_id),
          quantity:   Number(it.quantity),
          unit_price: parseFloat(it.unit_price),
        })),
      };
      if (editing) { await updateOrder(editing.id, payload); showToast("Order updated!"); }
      else         { await createOrder(payload);             showToast("Order created!"); }
      setShowModal(false);
      load();
    } catch (err) {
      showToast(err?.response?.data?.error || "Operation failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try { await deleteOrder(deleteId); showToast("Order removed."); setDeleteId(null); load(); }
    catch { showToast("Delete failed.", "error"); setDeleteId(null); }
  };

  const handleStatusChange = async (id, newStatus) => {
    try { await updateOrder(id, { status: newStatus }); showToast("Status updated!"); load(); }
    catch { showToast("Update failed.", "error"); }
  };

  /* ── Items viewer ── */
  const openItems = async (o) => {
    setItemsModal({ order: o, items: [], loading: true });
    try {
      const { data } = await getOrderItems(o.id);
      setItemsModal({ order: o, items: data, loading: false });
    } catch {
      setItemsModal({ order: o, items: [], loading: false });
    }
  };

  const customerName = (id) => {
    const c = customers.find((c) => c.id === id);
    return c ? c.name : `#${id}`;
  };

  /* ── Sort ── */
  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  /* ── Current page is already filtered/sorted server-side ── */
  const filtered = orders;

  /* ── Bulk selection ── */
  const allSelected  = filtered.length > 0 && filtered.every((o) => selected.has(o.id));
  const someSelected = filtered.some((o) => selected.has(o.id));

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected && !allSelected;
  }, [someSelected, allSelected]);

  useEffect(() => { setSelected(new Set()); }, [debouncedSearch, statusFilter, dateRange, page]);

  const toggleSelect    = (id) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((o) => o.id)));

  const handleBulkStatus = async (newStatus) => {
    setBulkLoading(true);
    setBulkStatusMenu(false);
    try {
      await Promise.all([...selected].map((id) => updateOrder(id, { status: newStatus })));
      showToast(`${selected.size} orders marked as ${newStatus}.`);
      setSelected(new Set());
      load();
    } catch { showToast("Some updates failed.", "error"); }
    finally { setBulkLoading(false); }
  };

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    try {
      await Promise.all([...selected].map((id) => deleteOrder(id)));
      showToast(`${selected.size} orders deleted.`);
      setSelected(new Set());
      setBulkDeleteConfirm(false);
      load();
    } catch { showToast("Some deletions failed.", "error"); }
    finally { setBulkLoading(false); }
  };

  /* ── Export all filtered (re-fetches the whole matching set, not just the current page) ── */
  const handleExport = async () => {
    try {
      const { data } = await getOrders({
        limit: Math.max(total, 1), search: debouncedSearch,
        status: statusFilter, dateRange, sort: sortField, order: sortDir,
      });
      exportToCSV(data.data.map((o) => ({
        "Order ID":   `ORD-${String(o.id).padStart(4, "0")}`,
        Customer:     o.customer_name || customerName(o.customer_id),
        Items:        o.item_count ?? 0,
        Total:        parseFloat(o.total || 0).toFixed(2),
        Status:       o.status,
        "Order Date": formatDate(o.order_date || o.created_at),
        Notes:        o.notes || "",
      })), "orders");
    } catch { showToast("Export failed.", "error"); }
  };

  /* ── Stats (server-computed over the full unfiltered dataset for this company) ── */
  const totalRevenue = stats.totalRevenue;

  /* ── Sortable TH ── */
  const SortTh = ({ field, children, className = "" }) => (
    <th
      onClick={() => handleSort(field)}
      className={`px-5 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-600 dark:hover:text-gray-300 transition-colors ${className}`}
    >
      {children}<SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </th>
  );

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t("Orders")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("Track and manage all customer orders")}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all">
            <Download size={15} /> {t("Export CSV")}
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 active:scale-95 transition-all">
            <Plus size={16} /> {t("New Order")}
          </button>
        </div>
      </div>

      {/* ── Stat cards (clickable filter shortcuts) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
        {[
          { label: t("Total Orders"), value: stats.total,           color: "text-gray-900 dark:text-white",    filter: "all"        },
          { label: t("Pending"),      value: stats.pendingCount,    color: "text-amber-600 dark:text-amber-400",   filter: "Pending"    },
          { label: t("Processing"),   value: stats.processingCount, color: "text-blue-600 dark:text-blue-400",    filter: "Processing" },
          { label: t("Completed"),    value: stats.completedCount,  color: "text-green-600 dark:text-emerald-400",   filter: "Completed"  },
          { label: t("Revenue"),      value: fmt(totalRevenue),                                      color: "text-violet-600 dark:text-violet-400",  filter: null         },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => s.filter !== null && setStatusFilter(statusFilter === s.filter ? "all" : s.filter)}
            className={`text-left bg-white dark:bg-gray-900 border rounded-2xl p-5 shadow-sm transition-all duration-200
              ${s.filter !== null ? "hover:shadow-md cursor-pointer" : "cursor-default"}
              ${s.filter !== null && statusFilter === s.filter ? "border-violet-300 dark:border-violet-700 ring-2 ring-violet-100 dark:ring-violet-900/30" : "border-gray-100 dark:border-gray-800"}`}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </button>
        ))}
      </div>

      {/* ── Filters row ── */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative w-full sm:flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={t("Search order ID or customer...")}
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

        {/* Status filter */}
        <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-1">
          {["all", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${statusFilter === s ? "bg-violet-600 text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
            >
              {s === "all" ? t("All") : t(statusConfig[s]?.label || s)}
            </button>
          ))}
        </div>

        {/* Date range filter */}
        <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-1 flex-shrink-0">
          {DATE_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${dateRange === r ? "bg-violet-600 text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
            >
              {t(r)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {/* Select-all */}
                <th className="pl-5 pr-2 py-3.5 w-10">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                </th>
                <SortTh field="id">{t("Order ID")}</SortTh>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t("Customer")}</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t("Items")}</th>
                <SortTh field="total">{t("Total")}</SortTh>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t("Status")}</th>
                <SortTh field="date">{t("Date")}</SortTh>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, idx) => {
                const cfg = statusConfig[o.status] || statusConfig.Pending;
                return (
                  <tr
                    key={o.id}
                    className={`${idx !== filtered.length - 1 ? "border-b border-gray-50 dark:border-gray-800/60" : ""}
                      transition-colors ${selected.has(o.id) ? "bg-violet-50/60 dark:bg-violet-900/20" : "hover:bg-violet-50/30 dark:hover:bg-violet-900/10"}`}
                  >
                    {/* Row checkbox */}
                    <td className="pl-5 pr-2 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={selected.has(o.id)}
                        onChange={() => toggleSelect(o.id)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-violet-600 dark:text-violet-400 font-semibold">
                      #{String(o.id).padStart(4, "0")}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
                      {o.customer_name || customerName(o.customer_id)}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => openItems(o)}
                        className="flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:underline font-medium transition-colors"
                      >
                        <Package size={13} />
                        {o.item_count ?? 0} {(o.item_count ?? 0) !== 1 ? t("items") : t("item")}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-gray-900 dark:text-white">{fmt(o.total)}</td>
                    <td className="px-5 py-4">
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/20 ${cfg.cls}`}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400">
                      {o.order_date ? formatDate(o.order_date) : o.created_at ? formatDate(o.created_at) : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(o)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteId(o.id)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={14} /></button>
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
            icon={ShoppingCart}
            title={t("No orders found")}
            description={search || statusFilter !== "all" || dateRange !== "All" ? t("Try adjusting your search or filters") : t("Create your first order to get started.")}
            actionLabel={!search && statusFilter === "all" && dateRange === "All" ? t("New Order") : undefined}
            onAction={!search && statusFilter === "all" && dateRange === "All" ? openAdd : undefined}
          />
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
        itemLabel={t("orders")}
      />

      {/* ── Bulk action bar ── */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-200
        ${selected.size > 0 ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-3 pointer-events-none"}`}>
        <div className="relative flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-gray-700 whitespace-nowrap">
          <span className="text-sm font-semibold">{selected.size} {t("selected")}</span>
          <div className="w-px h-4 bg-gray-600" />

          {/* Bulk status change */}
          <div ref={bulkMenuRef} className="relative">
            <button
              onClick={() => setBulkStatusMenu((v) => !v)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            >
              <CheckCircle size={14} /> {t("Set Status")}
              <ChevronDownSm size={12} className={`transition-transform ${bulkStatusMenu ? "rotate-180" : ""}`} />
            </button>
            {bulkStatusMenu && (
              <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden min-w-[150px] z-50">
                {STATUSES.map((s) => {
                  const cfg = statusConfig[s];
                  return (
                    <button
                      key={s}
                      onClick={() => handleBulkStatus(s)}
                      className="w-full text-left px-3 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 dark:hover:text-violet-400 transition-colors flex items-center gap-2"
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      {t(cfg.label)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-gray-600" />
          <button
            onClick={() => setBulkDeleteConfirm(true)}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} /> {t("Delete")}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-1 text-gray-500 hover:text-white transition-colors"
            title={t("Clear selection")}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 overflow-y-auto py-4 sm:py-8 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl mx-auto my-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white">{editing ? t("Edit Order") : t("New Order")}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-5 space-y-5">
              {/* Customer + Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Customer")} <span className="text-red-500">*</span></label>
                  <select
                    required
                    autoFocus
                    className={inputCls}
                    value={form.customer_id}
                    onChange={(e) => setForm((f) => ({ ...f, customer_id: e.target.value }))}
                  >
                    <option value="">Select customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Order Date")}</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.order_date}
                    onChange={(e) => setForm((f) => ({ ...f, order_date: e.target.value }))}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Status")}</label>
                <select
                  className={inputCls}
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("Products / Items")} <span className="text-red-500">*</span></label>
                  <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300">
                    <PlusCircle size={14} /> {t("Add Item")}
                  </button>
                </div>
                <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-[1fr_60px_90px_70px] sm:grid-cols-[1fr_80px_110px_80px] gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    <span>{t("Product")}</span>
                    <span className="text-center">{t("Qty")}</span>
                    <span className="text-right">{t("Unit Price")}</span>
                    <span className="text-right">{t("Total")}</span>
                  </div>
                  {form.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_60px_90px_70px] sm:grid-cols-[1fr_80px_110px_80px] gap-2 items-center px-3 py-2 border-t border-gray-50 dark:border-gray-800/60">
                      <select
                        required
                        className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-full"
                        value={item.product_id}
                        onChange={(e) => setItem(idx, "product_id", e.target.value)}
                      >
                        <option value="">Select product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                        ))}
                      </select>
                      <input
                        type="number" min="1" max={stockFor(item.product_id)} required
                        className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-violet-500 w-full"
                        value={item.quantity}
                        onChange={(e) => setItem(idx, "quantity", e.target.value)}
                      />
                      <input
                        type="number" min="0" step="0.01" required
                        className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-violet-500 w-full"
                        value={item.unit_price}
                        onChange={(e) => setItem(idx, "unit_price", e.target.value)}
                      />
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-right flex-1">
                          {fmt((parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0))}
                        </span>
                        {form.items.length > 1 && (
                          <button type="button" onClick={() => removeItem(idx)} className="text-gray-300 dark:text-gray-600 hover:text-red-400 ml-1">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-3 py-3 bg-violet-50 dark:bg-violet-900/20 border-t border-violet-100 dark:border-violet-800/40">
                    <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">{t("Order Total")}</span>
                    <span className="text-base font-bold text-violet-700 dark:text-violet-300">{fmt(orderTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Notes")}</label>
                <textarea
                  rows={2}
                  className={inputCls + " resize-none"}
                  placeholder="Order notes..."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg active:scale-95">{t("Cancel")}</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60 active:scale-95">
                  {loading ? t("Saving...") : editing ? t("Save Changes") : t("Create Order")}
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
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t("Delete Order?")}</h3>
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
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t("Delete")} {selected.size} {t("orders?")}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{t("This will permanently remove all selected orders. This action cannot be undone.")}</p>
            <div className="flex gap-3">
              <button onClick={() => setBulkDeleteConfirm(false)} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95">{t("Cancel")}</button>
              <button onClick={handleBulkDelete} disabled={bulkLoading} className="flex-1 px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-60 active:scale-95">
                {bulkLoading ? t("Deleting...") : t("Delete All")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Items viewer modal ── */}
      {itemsModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setItemsModal(null); }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-xl mx-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">Order #{String(itemsModal.order.id).padStart(4, "0")} — Items</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{itemsModal.order.customer_name || customerName(itemsModal.order.customer_id)}</p>
              </div>
              <button onClick={() => setItemsModal(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"><X size={18} /></button>
            </div>
            <div className="px-6 py-4">
              {itemsModal.loading ? (
                <div className="space-y-3 py-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-32 bg-gray-100 dark:bg-gray-800 rounded" />
                        <div className="h-2.5 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
                      </div>
                      <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
                    </div>
                  ))}
                </div>
              ) : itemsModal.items.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No items found for this order.</div>
              ) : (
                <>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        <th className="pb-2 text-left">{t("Product")}</th>
                        <th className="pb-2 text-center">{t("Qty")}</th>
                        <th className="pb-2 text-right">{t("Unit Price")}</th>
                        <th className="pb-2 text-right">{t("Subtotal")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                      {itemsModal.items.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 bg-violet-50 dark:bg-violet-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package size={13} className="text-violet-500 dark:text-violet-400" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-800 dark:text-gray-100">{item.product_name || `Product #${item.product_id}`}</p>
                                {item.sku && <p className="text-xs text-gray-400 dark:text-gray-500">{item.sku}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-center text-gray-700 dark:text-gray-300 font-medium">{item.quantity}</td>
                          <td className="py-3 text-right text-gray-600 dark:text-gray-400">{fmt(item.unit_price)}</td>
                          <td className="py-3 text-right font-bold text-gray-900 dark:text-white">
                            {fmt((parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("Order Total")}</span>
                    <span className="text-base font-bold text-violet-700 dark:text-violet-400">{fmt(itemsModal.order.total)}</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => { setItemsModal(null); openEdit(itemsModal.order); }}
                className="px-4 py-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
              >
                {t("Edit Order")}
              </button>
              <button
                onClick={() => setItemsModal(null)}
                className="px-4 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                {t("Close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Orders;
