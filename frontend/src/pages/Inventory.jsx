import { useState, useEffect, useCallback } from "react";
import {
  Boxes, Search, AlertTriangle, TrendingDown, Package, X, CheckCircle,
  Download, ExternalLink, Minus, Plus, Edit2,
} from "lucide-react";
import EmptyState from "../components/UI/EmptyState";
import { getProducts, updateStock } from "../services/productsService";
import { exportToCSV } from "../utils/exportCSV";
import { useSystem } from "../context/SystemContext";
import { useNavigate } from "react-router-dom";
import Pagination from "../components/UI/Pagination";
import PageHeader from "../components/UI/PageHeader";
import SortableTh from "../components/Tables/SortableTh";
import useEscapeKey from "../hooks/useEscapeKey";

const STANDARD_CATEGORIES = ["Electronics", "Furniture", "Accessories", "Office Supplies", "Software", "Hardware", "Other"];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmt = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v || 0);

const getStatus = (stock, reorder) => {
  const r = Number(reorder) || 10;
  const s = Number(stock)  || 0;
  if (s === 0) return { label: "Out of Stock", cls: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",    bar: "bg-red-400",    filter: "Out of Stock" };
  if (s <= r)  return { label: "Low Stock",    cls: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400", bar: "bg-amber-400",  filter: "Low Stock"    };
  return              { label: "In Stock",     cls: "bg-green-50 dark:bg-emerald-900/20 text-green-600 dark:text-emerald-400", bar: "bg-green-400",  filter: "In Stock"     };
};

/* ─── Toast ──────────────────────────────────────────────────────────────── */
const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 z-50 animate-toast-in flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
    ${type === "success" ? "bg-green-50 dark:bg-emerald-900/30 text-green-700 dark:text-emerald-300 border border-green-100 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800"}`}>
    <CheckCircle size={16} /> {msg}
    <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
  </div>
);

const DELTA_PRESETS = [-10, -5, -1, +1, +5, +10];

/* ─── Inventory ──────────────────────────────────────────────────────────── */
const Inventory = () => {
  const navigate                  = useNavigate();
  const { t }                     = useSystem();

  const [products, setProducts]   = useState([]);
  const [search, setSearch]       = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("All");
  const [sortField, setSortField] = useState("stock");
  const [sortDir, setSortDir]     = useState("asc");

  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(25);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats]           = useState({ total: 0, totalValue: 0, lowStockCount: 0, outOfStockCount: 0 });
  const [categories, setCategories] = useState(STANDARD_CATEGORIES);

  /* Adjust modal */
  const [adjusting, setAdjusting] = useState(null);
  const [newStock, setNewStock]   = useState("");
  const [saving, setSaving]       = useState(false);

  const [toast, setToast]         = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Debounce search ── */
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  /* ── Reset to page 1 whenever filters/search/sort change ── */
  useEffect(() => { setPage(1); }, [debouncedSearch, catFilter, stockFilter, sortField, sortDir]);

  /* ── Load (server-side pagination/filter/sort/stats) ── */
  const load = useCallback(async () => {
    try {
      const { data } = await getProducts({
        page, limit: pageSize, search: debouncedSearch,
        category: catFilter, stockFilter, sort: sortField, order: sortDir,
      });
      if (data.data.length === 0 && data.total > 0 && page > 1) {
        setPage(data.totalPages);
        return;
      }
      setProducts(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setStats(data.stats);
      setCategories(data.categories?.length ? data.categories : STANDARD_CATEGORIES);
    }
    catch { showToast("Failed to load inventory.", "error"); }
  }, [page, pageSize, debouncedSearch, catFilter, stockFilter, sortField, sortDir]);
  useEffect(() => { load(); }, [load]);

  useEscapeKey(!!adjusting, () => setAdjusting(null));

  /* ── Adjust modal ── */
  const openAdjust = (p) => { setAdjusting(p); setNewStock(String(p.stock ?? 0)); };

  const applyDelta = (delta) => {
    setNewStock((prev) => String(Math.max(0, Number(prev || 0) + delta)));
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateStock(adjusting.id, Number(newStock));
      showToast(`Stock updated for "${adjusting.name}"`);
      setAdjusting(null);
      load();
    } catch { showToast("Failed to update stock.", "error"); }
    finally { setSaving(false); }
  };

  /* ── Inline quick adjust ── */
  const handleQuickAdjust = async (product, delta) => {
    const next = Math.max(0, Number(product.stock) + delta);
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, stock: next } : p));
    try {
      await updateStock(product.id, next);
    } catch {
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, stock: product.stock } : p));
      showToast("Stock update failed.", "error");
    }
  };

  /* ── Sort ── */
  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  /* ── Current page is already filtered/sorted server-side ── */
  const filtered = products;

  /* ── Stats (server-computed over the full filtered dataset, not just this page) ── */
  const totalValue      = stats.totalValue;
  const lowStockCount   = stats.lowStockCount;
  const outOfStockCount = stats.outOfStockCount;
  const inStockCount    = stats.total - stats.lowStockCount - stats.outOfStockCount;

  /* ── Export all filtered (re-fetches the whole matching set, not just the current page) ── */
  const handleExport = async () => {
    try {
      const { data } = await getProducts({
        limit: Math.max(total, 1), search: debouncedSearch,
        category: catFilter, stockFilter, sort: sortField, order: sortDir,
      });
      exportToCSV(
        data.data.map((p) => ({
          SKU:             p.sku || "",
          Name:            p.name,
          Category:        p.category || "",
          Stock:           p.stock ?? 0,
          "Reorder Point": p.reorder_point ?? 10,
          "Unit Price":    p.price,
          "Total Value":   ((Number(p.stock) || 0) * (Number(p.price) || 0)).toFixed(2),
          Status:          getStatus(p.stock, p.reorder_point).label,
        })),
        "inventory"
      );
    } catch { showToast("Export failed.", "error"); }
  };

  /* ── Adjust modal preview ── */
  const previewStatus  = adjusting ? getStatus(Number(newStock || 0), adjusting.reorder_point) : null;
  const previewChanged = adjusting ? Number(newStock || 0) !== Number(adjusting.stock ?? 0) : false;
  const previewDelta   = adjusting ? Number(newStock || 0) - Number(adjusting.stock ?? 0) : 0;

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div>
      {/* ── Header ── */}
      <PageHeader
        title={t("Inventory")}
        subtitle={t("Real-time stock levels — adjust quantities directly here")}
        badges={outOfStockCount > 0 ? [{ icon: AlertTriangle, label: `${outOfStockCount} ${t("out of stock")}`, tone: "red" }]
          : lowStockCount > 0 ? [{ icon: AlertTriangle, label: `${lowStockCount} ${t("low stock")}`, tone: "amber" }]
          : []}
        actions={
          <>
            <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all">
              <Download size={15} /> {t("Export CSV")}
            </button>
            <button
              onClick={() => navigate("/products")}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 active:scale-95 transition-all"
            >
              <ExternalLink size={15} /> {t("Manage Products")}
            </button>
          </>
        }
      />

      {/* ── Stat cards (clickable filter shortcuts) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: t("Total Items"),    value: stats.total,     icon: Boxes,         color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20",  filter: "All"          },
          { label: t("In Stock"),       value: inStockCount,    icon: CheckCircle,   color: "text-green-600 dark:text-emerald-400",  bg: "bg-green-50 dark:bg-emerald-900/20",   filter: "In Stock"     },
          { label: t("Low Stock"),      value: lowStockCount,   icon: TrendingDown,  color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-900/20",   filter: "Low Stock"    },
          { label: t("Out of Stock"),   value: outOfStockCount, icon: AlertTriangle, color: "text-red-600 dark:text-red-400",    bg: "bg-red-50 dark:bg-red-900/20",     filter: "Out of Stock" },
        ].map(({ label, value, icon: Icon, color, bg, filter }) => (
          <button
            key={label}
            onClick={() => setStockFilter(stockFilter === filter ? "All" : filter)}
            className={`text-left bg-white dark:bg-gray-900 border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer
              ${stockFilter === filter ? "border-violet-300 dark:border-violet-700 ring-2 ring-violet-100 dark:ring-violet-900/30" : "border-gray-100 dark:border-gray-800"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon size={17} className={color} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </button>
        ))}
      </div>

      {/* ── Total value banner ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package size={15} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">{t("Total Inventory Value")}</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{fmt(totalValue)}</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-xs text-gray-400 dark:text-gray-500">
          <span>{stats.total} {t("products tracked")}</span>
          {(lowStockCount + outOfStockCount) > 0 && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
              <AlertTriangle size={12} />
              {lowStockCount + outOfStockCount} {t("need attention")}
            </span>
          )}
        </div>
      </div>

      {/* ── Filters row ── */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 mb-3">
        {/* Search */}
        <div className="relative w-full sm:flex-1 sm:max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={t("Search by name, SKU, or category...")}
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

        {/* Stock status filter */}
        <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-1 flex-shrink-0">
          {["All", "In Stock", "Low Stock", "Out of Stock"].map((f) => (
            <button
              key={f}
              onClick={() => setStockFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${stockFilter === f ? "bg-violet-600 text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
            >
              {t(f)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Category tabs (horizontal scrollable) ── */}
      {categories.length > 0 && (
        <div className="overflow-x-auto mb-4 -mx-0.5 px-0.5">
          <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-1 w-max">
            <button
              onClick={() => setCatFilter("All")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${catFilter === "All" ? "bg-violet-600 text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
            >
              {t("All Categories")}
            </button>
            {categories.map((c) => (
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
      )}

      {/* ── Table ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t("SKU")}</th>
                <SortableTh field="name" className="px-4 py-3.5" sortField={sortField} sortDir={sortDir} onSort={handleSort}>{t("Product")}</SortableTh>
                <SortableTh field="category" className="px-4 py-3.5" sortField={sortField} sortDir={sortDir} onSort={handleSort}>{t("Category")}</SortableTh>
                <SortableTh field="stock" className="px-4 py-3.5" sortField={sortField} sortDir={sortDir} onSort={handleSort}>{t("Stock")}</SortableTh>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t("Reorder")}</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t("Unit Price")}</th>
                <SortableTh field="value" className="px-4 py-3.5" sortField={sortField} sortDir={sortDir} onSort={handleSort}>{t("Value")}</SortableTh>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t("Status")}</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => {
                const stock   = Number(p.stock)  || 0;
                const reorder = Number(p.reorder_point) || 10;
                const status  = getStatus(stock, reorder);
                const barMax  = Math.max(stock, reorder * 3, 1);
                const barPct  = Math.min((stock / barMax) * 100, 100);
                return (
                  <tr
                    key={p.id}
                    className={`${idx !== filtered.length - 1 ? "border-b border-gray-50 dark:border-gray-800/60" : ""} hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors`}
                  >
                    <td className="px-4 py-4 text-xs font-mono text-gray-400 dark:text-gray-500">{p.sku || "—"}</td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-violet-50 dark:bg-violet-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package size={14} className="text-violet-400 dark:text-violet-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</p>
                          {p.description && <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[140px]">{p.description}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">
                        {p.category || "—"}
                      </span>
                    </td>

                    {/* ── Stock cell with inline ±1 ── */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 group/stock">
                        <button
                          onClick={() => handleQuickAdjust(p, -1)}
                          disabled={stock === 0}
                          className="opacity-0 group-hover/stock:opacity-100 w-6 h-6 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all disabled:opacity-0 disabled:cursor-not-allowed"
                          title={t("Decrease by 1")}
                        >
                          <Minus size={11} />
                        </button>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className={`text-sm font-bold ${stock === 0 ? "text-red-600 dark:text-red-400" : stock <= reorder ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-white"}`}>
                              {stock}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">{t("units")}</span>
                          </div>
                          <div className="mt-1 w-20 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full transition-all duration-300 ${status.bar}`} style={{ width: `${barPct}%` }} />
                          </div>
                        </div>
                        <button
                          onClick={() => handleQuickAdjust(p, 1)}
                          className="opacity-0 group-hover/stock:opacity-100 w-6 h-6 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-all"
                          title={t("Increase by 1")}
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{reorder}</td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">{fmt(p.price)}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900 dark:text-white">{fmt(stock * Number(p.price || 0))}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${status.cls}`}>
                        {t(status.label)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => openAdjust(p)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors border border-violet-100 dark:border-violet-800/50 active:scale-95"
                      >
                        <Edit2 size={12} /> {t("Adjust")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <EmptyState
            icon={Boxes}
            title={t("No inventory items found")}
            description={search || stockFilter !== "All" || catFilter !== "All"
              ? t("Try adjusting your search or filters")
              : t("Add products to start tracking inventory.")}
            actionLabel={!search && stockFilter === "All" && catFilter === "All" ? t("Go to Products") : undefined}
            onAction={!search && stockFilter === "All" && catFilter === "All" ? () => navigate("/products") : undefined}
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
        itemLabel={t("items")}
      />

      {/* ── Adjust Stock Modal ── */}
      {adjusting && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setAdjusting(null); }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">{t("Adjust Stock")}</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t("Update quantity for this product")}</p>
              </div>
              <button onClick={() => setAdjusting(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Product info */}
              <div className="flex items-center gap-3 p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                <div className="w-9 h-9 bg-violet-50 dark:bg-violet-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package size={16} className="text-violet-500 dark:text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{adjusting.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {adjusting.sku ? `${adjusting.sku} · ` : ""}{t("Reorder at")} {adjusting.reorder_point ?? 10} {t("units")}
                  </p>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${getStatus(adjusting.stock, adjusting.reorder_point).cls}`}>
                  {getStatus(adjusting.stock, adjusting.reorder_point).label}
                </span>
              </div>

              {/* Current stock */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">{t("Current stock")}</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{adjusting.stock ?? 0} <span className="text-sm font-normal text-gray-400 dark:text-gray-500">{t("units")}</span></span>
              </div>

              <form onSubmit={handleAdjust} className="space-y-4">
                {/* Quick delta buttons */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">{t("Quick Adjust")}</p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {DELTA_PRESETS.map((d) => {
                      const wouldGoNegative = Number(newStock || 0) + d < 0;
                      return (
                        <button
                          key={d}
                          type="button"
                          disabled={wouldGoNegative}
                          onClick={() => applyDelta(d)}
                          className={`py-2 text-xs font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed
                            ${d < 0
                              ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                              : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"}`}
                        >
                          {d > 0 ? `+${d}` : d}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Set exact value */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">{t("Set Exact Quantity")}</label>
                  <input
                    type="number"
                    min="0"
                    required
                    autoFocus
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 text-lg font-bold text-gray-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                  />
                </div>

                {/* Preview */}
                {previewChanged && previewStatus && (
                  <div className={`flex items-center justify-between px-4 py-3 rounded-xl border
                    ${previewDelta > 0 ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50" : previewDelta < 0 ? "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/50" : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700"}`}>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">{adjusting.stock ?? 0}</span>
                      <span className="mx-1.5 text-gray-400 dark:text-gray-500">→</span>
                      <span className={`font-bold text-base ${previewDelta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {newStock}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 ml-1">{t("units")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${previewDelta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {previewDelta > 0 ? `+${previewDelta}` : previewDelta}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${previewStatus.cls}`}>
                        {t(previewStatus.label)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setAdjusting(null)} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all">
                    {t("Cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={saving || String(newStock) === String(adjusting.stock ?? 0)}
                    className="flex-1 px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-60 active:scale-95 transition-all"
                  >
                    {saving ? t("Saving...") : t("Update Stock")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Inventory;
