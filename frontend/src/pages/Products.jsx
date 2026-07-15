import { useState, useEffect, useRef } from "react";
import {
  Package, Plus, Minus, Search, Download, Edit2, Trash2, X,
  CheckCircle, DollarSign, AlertTriangle,
  ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../services/productsService";
import { exportToCSV } from "../utils/exportCSV";
import { useSystem } from "../context/SystemContext";
import EmptyState from "../components/UI/EmptyState";

const BLANK = { name: "", description: "", price: "", stock: "", category: "Electronics", sku: "", reorder_point: "10" };
const CATS  = ["Electronics", "Furniture", "Accessories", "Office Supplies", "Software", "Hardware", "Other"];
const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmt = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
const fmtValue = (v) =>
  v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000   ? `$${(v / 1_000).toFixed(1)}k`
  : `$${Number(v || 0).toFixed(0)}`;

const getStockStatus = (s, reorderPoint = 10) => {
  const threshold = Number(reorderPoint) || 10;
  if (Number(s) === 0)         return { label: "Out of Stock", cls: "bg-red-50 text-red-600",     filter: "Out of Stock" };
  if (Number(s) <= threshold)  return { label: "Low Stock",    cls: "bg-amber-50 text-amber-600", filter: "Low Stock"    };
  return                              { label: "In Stock",     cls: "bg-green-50 text-green-600", filter: "In Stock"     };
};

/* ─── Toast ──────────────────────────────────────────────────────────────── */
const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
    ${type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
    <CheckCircle size={16} /> {msg}
    <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
  </div>
);

/* ─── Sort icon ──────────────────────────────────────────────────────────── */
const SortIcon = ({ field, sortField, sortDir }) => {
  if (sortField !== field) return <ChevronsUpDown size={12} className="text-gray-300 ml-1 inline-block" />;
  return sortDir === "asc"
    ? <ChevronUp   size={12} className="text-violet-500 ml-1 inline-block" />
    : <ChevronDown size={12} className="text-violet-500 ml-1 inline-block" />;
};

/* ─── Products ───────────────────────────────────────────────────────────── */
const Products = () => {
  const { t } = useSystem();

  const [products, setProducts]     = useState([]);
  const [search, setSearch]         = useState("");
  const [catFilter, setCatFilter]   = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [sortField, setSortField]   = useState("name");
  const [sortDir, setSortDir]       = useState("asc");

  /* Modals */
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(BLANK);
  const [deleteId, setDeleteId]     = useState(null);
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState(null);

  /* Bulk */
  const [selected, setSelected]               = useState(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkLoading, setBulkLoading]         = useState(false);
  const selectAllRef                          = useRef(null);

  /* ── Load ── */
  const load = async () => {
    try { const { data } = await getProducts(); setProducts(data); } catch {}
  };
  useEffect(() => { load(); }, []);

  /* ── Toast ── */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── CRUD ── */
  const openAdd  = () => { setEditing(null); setForm(BLANK); setShowModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || "", price: p.price, stock: p.stock, category: p.category || "Electronics", sku: p.sku || "", reorder_point: p.reorder_point ?? 10 });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (editing) { await updateProduct(editing.id, form); showToast(t("Product updated!")); }
      else         { await createProduct(form);             showToast(t("Product added!")); }
      setShowModal(false); load();
    } catch { showToast(t("Operation failed."), "error"); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    try { await deleteProduct(deleteId); showToast(t("Product removed.")); setDeleteId(null); load(); }
    catch { showToast(t("Delete failed."), "error"); setDeleteId(null); }
  };

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  /* ── Inline stock adjust ── */
  const handleStockAdjust = async (product, delta) => {
    const newStock = Math.max(0, Number(product.stock) + delta);
    // Optimistic update
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, stock: newStock } : p));
    try {
      await updateProduct(product.id, { ...product, stock: newStock });
    } catch {
      // Revert on failure
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, stock: product.stock } : p));
      showToast(t("Stock update failed."), "error");
    }
  };

  /* ── Sort ── */
  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  /* ── Filter + sort pipeline ── */
  const filtered = products
    .filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
      const matchCat    = catFilter === "All" || (p.category || "Electronics") === catFilter;
      const matchStock  =
        stockFilter === "All" ||
        (stockFilter === "In Stock"     && Number(p.stock) > (Number(p.reorder_point) || 10)) ||
        (stockFilter === "Low Stock"    && Number(p.stock) > 0 && Number(p.stock) <= (Number(p.reorder_point) || 10)) ||
        (stockFilter === "Out of Stock" && Number(p.stock) === 0);
      return matchSearch && matchCat && matchStock;
    })
    .sort((a, b) => {
      let aVal, bVal;
      if (sortField === "name")     { aVal = a.name.toLowerCase();             bVal = b.name.toLowerCase(); }
      if (sortField === "category") { aVal = (a.category || "").toLowerCase(); bVal = (b.category || "").toLowerCase(); }
      if (sortField === "price")    { aVal = Number(a.price  || 0);            bVal = Number(b.price  || 0); }
      if (sortField === "stock")    { aVal = Number(a.stock  ?? 0);            bVal = Number(b.stock  ?? 0); }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ?  1 : -1;
      return 0;
    });

  /* ── Bulk selection ── */
  const allSelected  = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const someSelected = filtered.some((p) => selected.has(p.id));

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected && !allSelected;
  }, [someSelected, allSelected]);

  useEffect(() => { setSelected(new Set()); }, [search, catFilter, stockFilter]);

  const toggleSelect    = (id) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelectAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((p) => p.id)));

  const handleBulkDelete = async () => {
    setBulkLoading(true);
    try {
      await Promise.all([...selected].map((id) => deleteProduct(id)));
      showToast(`${selected.size} ${t("products deleted.")}`);
      setSelected(new Set());
      setBulkDeleteConfirm(false);
      load();
    } catch { showToast(t("Some deletions failed."), "error"); }
    finally { setBulkLoading(false); }
  };

  const handleBulkExport = () => {
    const rows = products.filter((p) => selected.has(p.id));
    exportToCSV(rows.map((p) => ({
      SKU:           p.sku || "",
      Name:          p.name,
      Category:      p.category || "",
      "Unit Price":  parseFloat(p.price || 0).toFixed(2),
      Stock:         p.stock ?? 0,
      "Total Value": ((Number(p.stock) || 0) * (Number(p.price) || 0)).toFixed(2),
      Status:        getStockStatus(p.stock, p.reorder_point).label,
      Description:   p.description || "",
    })), "products-selected");
  };

  /* ── Export all filtered ── */
  const handleExport = () => exportToCSV(filtered.map((p) => ({
    SKU:           p.sku || "",
    Name:          p.name,
    Category:      p.category || "",
    "Unit Price":  parseFloat(p.price || 0).toFixed(2),
    Stock:         p.stock ?? 0,
    "Total Value": ((Number(p.stock) || 0) * (Number(p.price) || 0)).toFixed(2),
    Status:        getStockStatus(p.stock, p.reorder_point).label,
    Description:   p.description || "",
  })), "products");

  /* ── Stats ── */
  const totalValue    = products.reduce((a, p) => a + (Number(p.price) * Number(p.stock)), 0);
  const lowStockCount = products.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= (Number(p.reorder_point) || 10)).length;
  const outOfStockCount = products.filter((p) => Number(p.stock) === 0).length;

  /* ── Sortable TH ── */
  const SortTh = ({ field, children, className = "" }) => (
    <th
      onClick={() => handleSort(field)}
      className={`px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-600 transition-colors ${className}`}
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t("Products")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("Manage your product catalog and inventory levels")}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 active:scale-95 transition-all">
            <Download size={15} /> {t("Export CSV")}
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 active:scale-95 transition-all">
            <Plus size={16} /> {t("Add Product")}
          </button>
        </div>
      </div>

      {/* ── Stat cards (clickable filter shortcuts) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: t("Total Products"), value: products.length,  icon: Package,       color: "text-violet-600", bg: "bg-violet-50",  filter: null           },
          { label: t("Total Value"),    value: fmtValue(totalValue), icon: DollarSign, color: "text-blue-600",   bg: "bg-blue-50",    filter: null           },
          { label: t("Low Stock"),      value: lowStockCount,    icon: AlertTriangle, color: "text-amber-600",  bg: "bg-amber-50",   filter: "Low Stock"    },
          { label: t("Out of Stock"),   value: outOfStockCount,  icon: AlertTriangle, color: "text-red-600",    bg: "bg-red-50",     filter: "Out of Stock" },
        ].map(({ label, value, icon: Icon, color, bg, filter }) => (
          <button
            key={label}
            onClick={() => filter && setStockFilter(stockFilter === filter ? "All" : filter)}
            className={`text-left bg-white border rounded-2xl p-5 shadow-sm transition-all duration-200
              ${filter ? "hover:shadow-md cursor-pointer" : "cursor-default"}
              ${filter && stockFilter === filter ? "border-violet-300 ring-2 ring-violet-100" : "border-gray-100"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{label}</p>
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon size={17} className={color} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </button>
        ))}
      </div>

      {/* ── Filters row ── */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative w-full sm:flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t("Search by name, SKU or description...")}
            className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category dropdown (all 7 categories, no truncation) */}
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
        >
          <option value="All">{t("All Categories")}</option>
          {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Stock filter tabs */}
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 flex-shrink-0">
          {["All", "In Stock", "Low Stock", "Out of Stock"].map((s) => (
            <button
              key={s}
              onClick={() => setStockFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${stockFilter === s ? "bg-violet-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t(s)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-gray-100">
                {/* Select-all */}
                <th className="pl-5 pr-2 py-3.5 w-10">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                </th>
                <SortTh field="name">{t("Product")}</SortTh>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{t("SKU")}</th>
                <SortTh field="category">{t("Category")}</SortTh>
                <SortTh field="price">{t("Price")}</SortTh>
                <SortTh field="stock">{t("Stock")}</SortTh>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{t("Status")}</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => {
                const stock = getStockStatus(p.stock, p.reorder_point);
                return (
                  <tr
                    key={p.id}
                    className={`${idx !== filtered.length - 1 ? "border-b border-gray-50" : ""}
                      transition-colors ${selected.has(p.id) ? "bg-violet-50/60" : "hover:bg-violet-50/30"}`}
                  >
                    {/* Row checkbox */}
                    <td className="pl-5 pr-2 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Package size={16} className="text-violet-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                          {p.description && <p className="text-xs text-gray-400 truncate max-w-[160px]">{p.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-gray-500">{p.sku || "—"}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
                        {p.category || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">{fmt(p.price)}</td>

                    {/* ── Inline stock adjust ── */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 group/stock">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStockAdjust(p, -1); }}
                          disabled={Number(p.stock) === 0}
                          className="opacity-0 group-hover/stock:opacity-100 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all disabled:opacity-0 disabled:cursor-not-allowed"
                          title={t("Decrease stock by 1")}
                        >
                          <Minus size={11} />
                        </button>
                        <span className={`text-sm font-bold min-w-[2ch] text-center ${
                          Number(p.stock) === 0 ? "text-red-600"
                          : Number(p.stock) <= (Number(p.reorder_point) || 10) ? "text-amber-600"
                          : "text-gray-900"
                        }`}>
                          {p.stock}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStockAdjust(p, 1); }}
                          className="opacity-0 group-hover/stock:opacity-100 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all"
                          title={t("Increase stock by 1")}
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${stock.cls}`}>
                        {t(stock.label)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
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
            icon={Package}
            title={t("No products found")}
            description={search || catFilter !== "All" || stockFilter !== "All" ? t("Try adjusting your search or filters") : t("Add your first product to start managing inventory.")}
            actionLabel={!search && catFilter === "All" && stockFilter === "All" ? t("Add Product") : undefined}
            onAction={!search && catFilter === "All" && stockFilter === "All" ? openAdd : undefined}
          />
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        {t("Showing")} {filtered.length} {t("of")} {products.length} {t("products")}
        {(catFilter !== "All" || stockFilter !== "All") && (
          <span className="ml-1">
            · {t("filtered by")}{" "}
            {catFilter !== "All" && <span className="font-medium text-gray-500">{catFilter}</span>}
            {catFilter !== "All" && stockFilter !== "All" && " & "}
            {stockFilter !== "All" && <span className="font-medium text-gray-500">{t(stockFilter)}</span>}
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
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 overflow-y-auto py-4 sm:py-8 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto my-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editing ? t("Edit Product") : t("Add Product")}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("Product Name")}</label>
                <input required className={inputCls} placeholder="e.g. Wireless Keyboard" value={form.name} onChange={set("name")} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("SKU")}</label>
                  <input className={inputCls} placeholder="SKU-001" value={form.sku} onChange={set("sku")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("Category")}</label>
                  <select className={inputCls} value={form.category} onChange={set("category")}>
                    {CATS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("Price (USD)")}</label>
                  <input type="number" step="0.01" min="0" required className={inputCls} placeholder="0.00" value={form.price} onChange={set("price")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("Stock Quantity")}</label>
                  <input type="number" min="0" required className={inputCls} placeholder="0" value={form.stock} onChange={set("stock")} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t("Reorder Point")}
                    <span className="text-xs font-normal text-gray-400 ml-1">({t("alert threshold")})</span>
                  </label>
                  <input type="number" min="0" className={inputCls} placeholder="10" value={form.reorder_point} onChange={set("reorder_point")} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("Description")}</label>
                <textarea rows={2} className={inputCls + " resize-none"} placeholder="Short product description..." value={form.description} onChange={set("description")} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg active:scale-95">{t("Cancel")}</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60 active:scale-95">
                  {loading ? t("Saving...") : editing ? t("Save Changes") : t("Add Product")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Single delete confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-500" /></div>
            <h3 className="font-bold text-gray-900 mb-1">{t("Delete Product?")}</h3>
            <p className="text-sm text-gray-500 mb-5">{t("This action cannot be undone.")}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-95">{t("Cancel")}</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-95">{t("Delete")}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk delete confirm ── */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-500" /></div>
            <h3 className="font-bold text-gray-900 mb-1">{t("Delete")} {selected.size} {t("products?")}</h3>
            <p className="text-sm text-gray-500 mb-5">{t("This will permanently remove all selected products. This action cannot be undone.")}</p>
            <div className="flex gap-3">
              <button onClick={() => setBulkDeleteConfirm(false)} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-95">{t("Cancel")}</button>
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

export default Products;
