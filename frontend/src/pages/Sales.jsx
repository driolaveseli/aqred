import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp, DollarSign, ShoppingBag, Users,
  Plus, X, CheckCircle, Trash2, Download, RefreshCw,
  AlertCircle, Clock, Truck, XCircle, Award,
  AlertTriangle, BarChart2, ArrowRight,
} from "lucide-react";
import EmptyState from "../components/UI/EmptyState";
import SkeletonLoader from "../components/UI/SkeletonLoader";
import ChartTooltip from "../components/UI/ChartTooltip";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Area,
} from "recharts";
import { getSalesReport, getSales, createSale } from "../services/salesService";
import { getCustomers } from "../services/customersService";
import { getProducts }  from "../services/productsService";
import { getPayments }  from "../services/paymentsService";
import { exportToCSV }  from "../utils/exportCSV";
import { useSystem }    from "../context/SystemContext";

// ─── Constants ────────────────────────────────────────────────────────────────
const DATE_RANGES  = ["This Month", "Last 3 Months", "This Year", "All Time"];
const BLANK_ITEM   = { product_id: "", quantity: 1, unit_price: 0 };

const STATUS_CFG = {
  Completed:  { bg: "bg-green-50",  text: "text-green-600",  dot: "#22c55e", Icon: CheckCircle },
  Pending:    { bg: "bg-amber-50",  text: "text-amber-600",  dot: "#f59e0b", Icon: Clock       },
  Processing: { bg: "bg-blue-50",   text: "text-blue-600",   dot: "#3b82f6", Icon: RefreshCw   },
  Cancelled:  { bg: "bg-red-50",    text: "text-red-600",    dot: "#ef4444", Icon: XCircle     },
  Shipped:    { bg: "bg-violet-50", text: "text-violet-600", dot: "#7c3aed", Icon: Truck       },
};

const filterByRange = (list, range) => {
  if (range === "All Time") return list;
  const now = new Date();
  return list.filter((o) => {
    const d = new Date(o.order_date || o.created_at);
    if (range === "This Month")
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    if (range === "Last 3 Months") {
      const cutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return d >= cutoff;
    }
    if (range === "This Year") return d.getFullYear() === now.getFullYear();
    return true;
  });
};

const isOverdue = (o) => {
  if (!o.due_date) return false;
  if (o.status === "Completed" || o.status === "Cancelled") return false;
  return new Date(o.due_date) < new Date();
};

// ─── Micro-components ─────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
    type === "success"
      ? "bg-green-50 text-green-700 border-green-100"
      : "bg-red-50 text-red-700 border-red-100"
  }`}>
    {type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
    {msg}
    <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100"><X size={13} /></button>
  </div>
);

const MiniBar = ({ pct, color = "bg-violet-500" }) => (
  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
    <div className={`h-1.5 rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
  </div>
);

const SVGDonut = ({ pct, size = 120, strokeWidth = 11 }) => {
  const r = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const filled = Math.min(pct, 100) / 100 * circumference;
  const color = pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  const trackColor = pct >= 80 ? "#dcfce7" : pct >= 50 ? "#fef3c7" : "#fee2e2";
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${filled} ${circumference - filled}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className="text-xl font-bold" style={{ color }}>{pct.toFixed(0)}%</span>
        <span className="text-[10px] text-gray-400 mt-0.5 leading-none">collected</span>
      </div>
    </div>
  );
};

const getInitials = (name = "") =>
  name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const AVATAR_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500",
];

// ─── Main component ────────────────────────────────────────────────────────────
const Sales = () => {
  const { formatCurrency, formatDate, t } = useSystem();

  const [view,    setView]    = useState("sales");
  const [range,   setRange]   = useState("This Year");

  const [reportData, setReportData] = useState({ monthly: [], topProducts: [], categoryRevenue: [] });
  const [orders,     setOrders]     = useState([]);
  const [customers,  setCustomers]  = useState([]);
  const [products,   setProducts]   = useState([]);
  const [payments,   setPayments]   = useState([]);
  const [loading,    setLoading]    = useState(true);

  const [showModal,  setShowModal]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast,      setToast]      = useState(null);
  const [form, setForm] = useState({
    customer_id: "", status: "Pending", due_date: "", notes: "",
    items: [{ ...BLANK_ITEM }],
  });

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, oRes, cRes, pRes, pyRes] = await Promise.all([
        getSalesReport(range),
        getSales(),
        getCustomers(),
        getProducts(),
        getPayments(),
      ]);
      setReportData(rRes.data);
      setOrders(oRes.data);
      setCustomers(cRes.data);
      setProducts(pRes.data);
      setPayments(pyRes.data);
    } catch (err) {
      console.error("Failed to load sales data", err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  // ── Shared derived values ─────────────────────────────────────────────────
  const filteredOrders   = useMemo(() => filterByRange(orders, range), [orders, range]);
  const totalRevenue     = reportData.monthly.reduce((s, m) => s + parseFloat(m.revenue || 0), 0);
  const totalOrders      = reportData.monthly.reduce((s, m) => s + parseInt(m.orders || 0), 0);
  const avgOrder         = totalOrders ? totalRevenue / totalOrders : 0;
  const activeCustomers  = new Set(filteredOrders.filter(o => o.status !== "Cancelled").map(o => o.customer_id)).size;
  const catTotal         = reportData.categoryRevenue.reduce((s, c) => s + parseFloat(c.revenue || 0), 0);
  const filteredPayments = useMemo(() => filterByRange(payments, range), [payments, range]);
  const totalCollected   = filteredPayments
    .filter(p => p.status === "Completed")
    .reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  // ── Reports-specific ──────────────────────────────────────────────────────
  const outstanding       = Math.max(0, totalRevenue - totalCollected);
  const collectionRate    = totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0;
  const completedCount    = filteredOrders.filter(o => o.status === "Completed").length;
  const nonCancelledCount = filteredOrders.filter(o => o.status !== "Cancelled").length;
  const completionRate    = nonCancelledCount > 0 ? (completedCount / nonCancelledCount) * 100 : 0;
  const cancelledCount    = filteredOrders.filter(o => o.status === "Cancelled").length;
  const cancellationRate  = filteredOrders.length > 0 ? (cancelledCount / filteredOrders.length) * 100 : 0;
  const overdueCount      = filteredOrders.filter(isOverdue).length;

  const statusBreakdown = filteredOrders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const topCustomers = useMemo(() => {
    const map = {};
    filteredOrders
      .filter(o => o.status !== "Cancelled")
      .forEach(o => {
        const key = o.customer_name || "Unknown";
        map[key] = (map[key] || 0) + parseFloat(o.total || 0);
      });
    return Object.entries(map)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);
  const topCustomerMax = topCustomers[0]?.revenue || 1;

  const trendData = reportData.monthly.map(m => ({
    month:   m.month,
    revenue: parseFloat(m.revenue || 0),
    orders:  parseInt(m.orders || 0),
  }));

  // Recent orders for the Sales tab summary (latest 6, date-range filtered)
  const recentOrders = useMemo(
    () => [...filteredOrders].sort((a, b) =>
      new Date(b.order_date || b.created_at) - new Date(a.order_date || a.created_at)
    ).slice(0, 6),
    [filteredOrders]
  );

  // ── Helpers ───────────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const updateItem = (idx, field, value) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      if (field === "product_id") {
        const p = products.find(p => String(p.id) === String(value));
        if (p) items[idx].unit_price = parseFloat(p.price) || 0;
      }
      return { ...f, items };
    });
  };
  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, { ...BLANK_ITEM }] }));
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const saleTotal  = form.items.reduce(
    (s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0), 0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_id) { showToast("Please select a customer", "error"); return; }
    const items = form.items.filter(it => it.product_id && it.quantity > 0);
    if (!items.length) { showToast("Add at least one product", "error"); return; }
    setSubmitting(true);
    try {
      await createSale({
        customer_id: parseInt(form.customer_id),
        status:      form.status,
        due_date:    form.due_date || null,
        notes:       form.notes   || null,
        items: items.map(it => ({
          product_id: parseInt(it.product_id),
          quantity:   parseInt(it.quantity),
          unit_price: parseFloat(it.unit_price),
        })),
      });
      showToast("Sale created successfully!");
      setShowModal(false);
      setForm({ customer_id: "", status: "Pending", due_date: "", notes: "", items: [{ ...BLANK_ITEM }] });
      load();
    } catch (err) {
      showToast(err.response?.data?.error || err.message || "Failed to create sale", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportRevenue = () =>
    exportToCSV(
      reportData.monthly.map(m => ({
        Month: m.month, Year: m.year,
        "Revenue (USD)": parseFloat(m.revenue || 0).toFixed(2),
        "Order Count": m.orders,
      })),
      "sales_revenue"
    );

  if (loading) return <SkeletonLoader type="page" statCount={4} rows={5} cols={6} />;

  // ─── Date range pills ──────────────────────────────────────────────────────
  const DateRangeFilter = (
    <div className="flex flex-wrap items-center gap-3 mb-5">
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest hidden sm:block">Period</span>
      <div className="flex flex-wrap items-center gap-0.5 bg-gray-100/90 border border-gray-200/70 rounded-xl p-1 w-fit shadow-inner">
        {DATE_RANGES.map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={`px-3 sm:px-4 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
              range === r
                ? "bg-white text-violet-700 shadow-sm border border-gray-200/80 font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            {t(r)}
          </button>
        ))}
      </div>
    </div>
  );

  // ─── Recent Orders summary widget ─────────────────────────────────────────
  const RecentOrdersWidget = (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900">{t("Recent Orders")}</h3>
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
            {filteredOrders.length} {t("in")} {t(range)}
          </span>
          {overdueCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
              <AlertTriangle size={10} />{overdueCount} {t("overdue")}
            </span>
          )}
        </div>
        <Link
          to="/orders"
          className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors"
        >
          {t("Manage all")} <ArrowRight size={12} />
        </Link>
      </div>

      {recentOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={t("No orders for selected period")}
          description={t("Create your first sale to get started.")}
          actionLabel={t("New Sale")}
          onAction={() => setShowModal(true)}
        />
      ) : (
        <>
          <div className="divide-y divide-gray-50">
            {recentOrders.map(o => {
              const cfg    = STATUS_CFG[o.status] || STATUS_CFG.Pending;
              const Icon   = cfg.Icon;
              const overdue = isOverdue(o);
              return (
                <div key={o.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/60 transition-colors">
                  {/* Order ID */}
                  <span className="text-xs font-mono font-semibold text-violet-600 w-20 flex-shrink-0">
                    ORD-{String(o.id).padStart(4, "0")}
                  </span>

                  {/* Customer */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{o.customer_name || "—"}</p>
                    {o.customer_email && (
                      <p className="text-xs text-gray-400 truncate">{o.customer_email}</p>
                    )}
                  </div>

                  {/* Total */}
                  <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                    {formatCurrency(o.total)}
                  </span>

                  {/* Status badge */}
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                    <Icon size={10} />{t(o.status)}
                  </span>

                  {/* Date + overdue */}
                  <div className="text-right flex-shrink-0 w-20">
                    <p className="text-xs text-gray-400">{formatDate(o.order_date || o.created_at)}</p>
                    {overdue && (
                      <p className="text-[10px] text-orange-500 font-medium flex items-center justify-end gap-0.5 mt-0.5">
                        <AlertTriangle size={9} /> {t("Overdue")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer link */}
          <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {t("Showing")} {recentOrders.length} {t("of")} {filteredOrders.length} {t("orders")}
            </p>
            <Link
              to="/orders"
              className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-800 transition-colors"
            >
              {t("View all orders")} <ArrowRight size={13} />
            </Link>
          </div>
        </>
      )}
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="relative bg-gradient-to-r from-slate-800 to-violet-900 rounded-2xl px-6 py-5 mb-5 overflow-hidden shadow-lg shadow-slate-500/30">
        {/* Decorative orbs */}
        <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/[0.06] pointer-events-none" />
        <div className="absolute right-24 -bottom-10 w-36 h-36 rounded-full bg-white/[0.05] pointer-events-none" />
        <div className="absolute -left-4 -bottom-6 w-24 h-24 rounded-full bg-white/[0.05] pointer-events-none" />

        <div className="relative flex flex-wrap items-center justify-between gap-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 flex-shrink-0">
              <TrendingUp size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-xl font-bold text-white tracking-tight">{t("Sales")}</h1>
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-300 bg-green-400/20 px-2 py-0.5 rounded-full border border-green-400/30 uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" /> Live
                </span>
              </div>
              <p className="text-xs text-violet-200">
                {view === "sales"
                  ? t("Monitor performance and manage transactions")
                  : t("Live analytics from orders, payments, and customers")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={load}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg border border-white/20 active:scale-95 transition-all">
              <RefreshCw size={14} /> {t("Refresh")}
            </button>
            <button onClick={handleExportRevenue}
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg border border-white/20 active:scale-95 transition-all">
              <Download size={14} /> {t("Export Revenue")}
            </button>
            {view === "sales" && (
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-violet-700 text-sm font-semibold rounded-lg hover:bg-violet-50 active:scale-95 transition-all shadow-sm">
                <Plus size={16} /> {t("New Sale")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-0.5 bg-gray-100/90 border border-gray-200/70 rounded-xl p-1 mb-5 w-fit shadow-inner">
        {[
          { key: "sales",   label: t("Sales"),               icon: ShoppingBag },
          { key: "reports", label: t("Reports & Analytics"), icon: BarChart2   },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setView(key)}
            className={`flex items-center gap-2 px-5 py-2 text-sm rounded-lg transition-all duration-200 ${
              view === key
                ? "bg-white text-violet-700 font-semibold shadow-sm border border-gray-200/80"
                : "text-gray-500 hover:text-gray-700 font-medium"
            }`}>
            <Icon size={14} className={view === key ? "text-violet-600" : "text-gray-400"} />{label}
          </button>
        ))}
      </div>

      {/* Date range filter */}
      {DateRangeFilter}

      {/* ══════════════════ SALES TAB ══════════════════ */}
      {view === "sales" && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: t("Revenue"),          value: formatCurrency(totalRevenue), sub: t(range),             icon: DollarSign,  color: "text-green-600",  iconBg: "bg-green-100",  accent: "from-green-500 to-emerald-400"  },
              { label: t("Orders"),           value: totalOrders,                  sub: t(range),             icon: ShoppingBag, color: "text-blue-600",   iconBg: "bg-blue-100",   accent: "from-blue-500 to-sky-400"       },
              { label: t("Avg. Order Value"), value: formatCurrency(avgOrder),     sub: t("Per transaction"), icon: TrendingUp,  color: "text-violet-600", iconBg: "bg-violet-100", accent: "from-violet-600 to-purple-400"  },
              { label: t("Active Customers"), value: activeCustomers,              sub: t(range),             icon: Users,       color: "text-amber-600",  iconBg: "bg-amber-100",  accent: "from-amber-500 to-yellow-400"   },
            ].map(({ label, value, sub, icon: Icon, color, iconBg, accent }) => (
              <div key={label} className="relative bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden border border-gray-100/80">
                <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${accent}`} />
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-500">{label}</p>
                  <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center shadow-sm`}>
                    <Icon size={18} className={color} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
                <p className="text-xs text-gray-400 mt-1.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Monthly Revenue Chart */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{t("Monthly Revenue")}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{t(range)}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-violet-50 px-3 py-1.5 rounded-lg">
                <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-b from-violet-500 to-violet-300 inline-block" /> {t("Revenue")}
              </div>
            </div>
            {reportData.monthly.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">{t("No data for selected period.")}</div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={reportData.monthly.map(m => ({ ...m, revenue: parseFloat(m.revenue || 0) }))} barCategoryGap="30%">
                  <defs>
                    <linearGradient id="revenueBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={1} />
                      <stop offset="100%" stopColor="#c4b5fd" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                  <Tooltip content={<ChartTooltip formatter={v => [formatCurrency(v), t("Revenue")]} />} />
                  <Bar dataKey="revenue" fill="url(#revenueBarGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top Products + Category Revenue */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <h3 className="font-semibold text-gray-900 mb-1">{t("Top Products by Revenue")}</h3>
              <p className="text-xs text-gray-400 mb-4">{t(range)}</p>
              {reportData.topProducts.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm">{t("No data for selected period.")}</div>
              ) : (
                <div className="space-y-3">
                  {reportData.topProducts.map((p, i) => {
                    const rankBadge = ["bg-amber-100 text-amber-600","bg-gray-100 text-gray-500","bg-orange-100 text-orange-500"];
                    return (
                      <div key={p.name} className="flex items-center gap-3">
                        <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-md flex-shrink-0 ${rankBadge[i] || "text-gray-300 bg-transparent"}`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.units} unit{p.units !== 1 ? "s" : ""} · {p.category || "—"}</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(p.revenue)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <h3 className="font-semibold text-gray-900 mb-1">{t("Revenue by Category")}</h3>
              <p className="text-xs text-gray-400 mb-4">{t(range)}</p>
              {reportData.categoryRevenue.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm">{t("No data for selected period.")}</div>
              ) : (
                <div className="space-y-3">
                  {reportData.categoryRevenue.map((cat, i) => {
                    const pct = catTotal > 0 ? ((parseFloat(cat.revenue) / catTotal) * 100).toFixed(1) : 0;
                    const gradients = [
                      "from-violet-500 to-purple-400", "from-blue-500 to-sky-400",
                      "from-emerald-500 to-green-400", "from-amber-500 to-yellow-400", "from-pink-500 to-rose-400",
                    ];
                    const dots = ["bg-violet-500","bg-blue-500","bg-emerald-500","bg-amber-500","bg-pink-500"];
                    return (
                      <div key={cat.category}>
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dots[i % dots.length]}`} />
                            <span className="text-sm text-gray-700">{cat.category}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{pct}%</span>
                            <span className="text-sm font-semibold text-gray-900">{formatCurrency(cat.revenue)}</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className={`h-2 rounded-full bg-gradient-to-r ${gradients[i % gradients.length]} transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders summary — full management is in Management → Orders */}
          {RecentOrdersWidget}
        </>
      )}

      {/* ══════════════════ REPORTS TAB ══════════════════ */}
      {view === "reports" && (
        <>
          {/* Row 1: 6 KPI tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {[
              { label: t("Revenue"),     value: formatCurrency(totalRevenue),      sub: t(range),                          icon: DollarSign,  valColor: "text-gray-900",   accent: "border-l-4 border-l-violet-500" },
              { label: t("Collected"),   value: formatCurrency(totalCollected),     sub: `${collectionRate.toFixed(0)}% ${t("of revenue")}`, icon: TrendingUp,  valColor: "text-green-600",  accent: "border-l-4 border-l-green-500" },
              { label: t("Outstanding"), value: formatCurrency(outstanding),        sub: outstanding > 0 ? t("Uncollected") : t("Fully collected"), icon: AlertCircle, valColor: outstanding > 0 ? "text-amber-600" : "text-gray-400", accent: outstanding > 0 ? "border-l-4 border-l-amber-400" : "border-l-4 border-l-gray-200" },
              { label: t("Orders"),      value: filteredOrders.length,              sub: t(range),                          icon: ShoppingBag, valColor: "text-gray-900",   accent: "border-l-4 border-l-blue-500"  },
              { label: t("Completion"),  value: `${completionRate.toFixed(0)}%`,    sub: `${completedCount} ${t("completed")}`, icon: CheckCircle, valColor: "text-violet-600", accent: "border-l-4 border-l-violet-400" },
              { label: t("Avg. Order"),  value: formatCurrency(avgOrder),           sub: t("Per transaction"),              icon: BarChart2,   valColor: "text-gray-900",   accent: "border-l-4 border-l-gray-300"  },
            ].map(({ label, value, sub, icon: Icon, valColor, accent }) => (
              <div key={label} className={`bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all col-span-1 ${accent}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500">{label}</p>
                  <Icon size={13} className="text-gray-300" />
                </div>
                <p className={`text-xl font-bold ${valColor} tracking-tight`}>{value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Row 2: Revenue + Orders trend */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{t("Revenue & Order Volume")}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{t("Monthly trend for")} {t(range).toLowerCase()}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1.5 bg-violet-50 px-2.5 py-1 rounded-lg">
                  <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-b from-violet-500 to-violet-300 inline-block" /> {t("Revenue")}
                </span>
                <span className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg">
                  <span className="w-3 h-[2px] bg-amber-400 inline-block rounded-full" /> {t("Orders")}
                </span>
              </div>
            </div>
            {trendData.length === 0 ? (
              <div className="flex items-center justify-center h-52 text-gray-400 text-sm">{t("No data for selected period.")}</div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <ComposedChart data={trendData} barCategoryGap="30%">
                  <defs>
                    <linearGradient id="ordersAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="composedBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={1} />
                      <stop offset="100%" stopColor="#c4b5fd" stopOpacity={0.65} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip formatter={(v, n) => n === "revenue" ? [formatCurrency(v), t("Revenue")] : [v, t("Orders")]} />} />
                  <Bar  yAxisId="left"  dataKey="revenue" fill="url(#composedBarGrad)" radius={[6, 6, 0, 0]} />
                  <Area yAxisId="right" type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={2.5}
                    fill="url(#ordersAreaGrad)" dot={{ fill: "#f59e0b", r: 3.5, strokeWidth: 2, stroke: "#fff" }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Row 3: Status breakdown + Top Customers + Collection Health */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <h3 className="font-semibold text-gray-900 mb-1">{t("Order Status")}</h3>
              <p className="text-xs text-gray-400 mb-4">{filteredOrders.length} {t("orders total")}</p>
              {filteredOrders.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm">{t("No data for selected period.")}</div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(statusBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, count]) => {
                      const pct  = filteredOrders.length > 0 ? (count / filteredOrders.length) * 100 : 0;
                      const cfg  = STATUS_CFG[status] || STATUS_CFG.Pending;
                      const Icon = cfg.Icon;
                      return (
                        <div key={status}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon size={13} style={{ color: cfg.dot }} />
                              <span className="text-sm text-gray-700">{t(status)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">{pct.toFixed(0)}%</span>
                              <span className="text-sm font-semibold text-gray-900 w-5 text-right">{count}</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 mt-1.5">
                            <div className="h-2 rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${cfg.dot}dd, ${cfg.dot}88)` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">{t("Top Customers")}</h3>
                <Award size={14} className="text-amber-400" />
              </div>
              <p className="text-xs text-gray-400 mb-4">{t("By revenue, excl. cancelled")}</p>
              {topCustomers.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm">{t("No data for selected period.")}</div>
              ) : (
                <div className="space-y-3">
                  {topCustomers.map((c, i) => {
                    const pct = (c.revenue / topCustomerMax) * 100;
                    const rankStyles = [
                      "bg-amber-400 text-white ring-2 ring-amber-200",
                      "bg-gray-300 text-white ring-2 ring-gray-100",
                      "bg-orange-400 text-white ring-2 ring-orange-100",
                    ];
                    return (
                      <div key={c.name}>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                            i < 3 ? rankStyles[i] : `${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-white`
                          }`}>
                            {getInitials(c.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700 font-medium truncate">{c.name}</span>
                              <span className="text-sm font-semibold text-gray-900 ml-2 flex-shrink-0">{formatCurrency(c.revenue)}</span>
                            </div>
                            <MiniBar pct={pct} color={i === 0 ? "bg-gradient-to-r from-amber-400 to-yellow-300" : "bg-violet-400"} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <h3 className="font-semibold text-gray-900 mb-1">{t("Collection Health")}</h3>
              <p className="text-xs text-gray-400 mb-3">{t("Payment collection overview")}</p>
              <div className="flex flex-col items-center py-2 mb-3">
                <SVGDonut pct={collectionRate} size={120} strokeWidth={11} />
                <p className="text-xs text-gray-500 mt-2">{t("Collection rate")}</p>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> {t("Collected")}
                  </span>
                  <span className="text-sm font-semibold text-green-600">{formatCurrency(totalCollected)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> {t("Outstanding")}
                  </span>
                  <span className="text-sm font-semibold text-amber-600">{formatCurrency(outstanding)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                  <span className="text-xs text-gray-500">{t("Total billed")}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(totalRevenue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Top Products + Category Revenue */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <h3 className="font-semibold text-gray-900 mb-1">{t("Top Products by Revenue")}</h3>
              <p className="text-xs text-gray-400 mb-4">{t(range)}</p>
              {reportData.topProducts.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">{t("No data for selected period.")}</div>
              ) : (() => {
                const topRev = parseFloat(reportData.topProducts[0]?.revenue || 1);
                return (
                  <div className="space-y-4">
                    {reportData.topProducts.map((p, i) => {
                      const pct           = (parseFloat(p.revenue) / topRev) * 100;
                      const revPctOfTotal = catTotal > 0 ? ((parseFloat(p.revenue) / catTotal) * 100).toFixed(1) : 0;
                      return (
                        <div key={p.name}>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-300 w-4 flex-shrink-0">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <p className="text-sm font-medium text-gray-700 truncate">{p.name}</p>
                                <span className="text-sm font-semibold text-gray-900 ml-2 flex-shrink-0">{formatCurrency(p.revenue)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-gray-400">{p.units} unit{p.units !== 1 ? "s" : ""}</p>
                                {p.category && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{p.category}</span>}
                                <span className="text-[10px] text-gray-400 ml-auto">{revPctOfTotal}% of total</span>
                              </div>
                              <MiniBar pct={pct} color="bg-violet-500" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <h3 className="font-semibold text-gray-900 mb-1">{t("Revenue by Category")}</h3>
              <p className="text-xs text-gray-400 mb-4">{t(range)}</p>
              {reportData.categoryRevenue.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">{t("No data for selected period.")}</div>
              ) : (
                <>
                  <div className="space-y-4">
                    {reportData.categoryRevenue.map((cat, i) => {
                      const pct      = catTotal > 0 ? (parseFloat(cat.revenue) / catTotal) * 100 : 0;
                      const gradients = [
                        "from-violet-500 to-purple-400", "from-blue-500 to-sky-400",
                        "from-emerald-500 to-green-400", "from-amber-500 to-yellow-400", "from-pink-500 to-rose-400",
                      ];
                      const dots = ["bg-violet-500","bg-blue-500","bg-emerald-500","bg-amber-500","bg-pink-500"];
                      return (
                        <div key={cat.category}>
                          <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${dots[i % dots.length]}`} />
                              <span className="text-sm text-gray-700">{cat.category}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">{pct.toFixed(1)}%</span>
                              <span className="text-sm font-semibold text-gray-900">{formatCurrency(cat.revenue)}</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className={`h-2 rounded-full bg-gradient-to-r ${gradients[i % gradients.length]} transition-all duration-700`}
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {t("Total")} ({reportData.categoryRevenue.length} {t("categories")})
                    </span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(catTotal)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Row 5: Insight callouts */}
          {filteredOrders.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {/* Cancellation Rate */}
              <div className={`relative rounded-2xl p-5 overflow-hidden shadow-sm border ${
                cancellationRate > 20 ? "bg-gradient-to-br from-red-50 to-rose-50/60 border-red-100" : "bg-gradient-to-br from-green-50 to-emerald-50/60 border-green-100"
              }`}>
                <div className={`absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-10 ${
                  cancellationRate > 20 ? "bg-red-500" : "bg-green-500"
                }`} />
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                    cancellationRate > 20 ? "bg-red-100" : "bg-green-100"
                  }`}>
                    <AlertCircle size={17} className={cancellationRate > 20 ? "text-red-500" : "text-green-500"} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("Cancellation Rate")}</p>
                    <p className={`text-2xl font-bold mt-0.5 ${cancellationRate > 20 ? "text-red-600" : "text-green-600"}`}>
                      {cancellationRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {cancelledCount} {t("of")} {filteredOrders.length} {t("orders cancelled")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fulfillment Rate */}
              <div className="relative rounded-2xl p-5 overflow-hidden shadow-sm bg-gradient-to-br from-violet-50 to-purple-50/60 border border-violet-100">
                <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-10 bg-violet-500" />
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-violet-100 shadow-sm">
                    <CheckCircle size={17} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("Fulfillment Rate")}</p>
                    <p className="text-2xl font-bold text-violet-600 mt-0.5">{completionRate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {completedCount} {t("of")} {nonCancelledCount} {t("orders fulfilled")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Revenue per Order */}
              <div className={`relative rounded-2xl p-5 overflow-hidden shadow-sm border ${
                collectionRate < 60 ? "bg-gradient-to-br from-amber-50 to-yellow-50/60 border-amber-100" : "bg-gradient-to-br from-blue-50 to-sky-50/60 border-blue-100"
              }`}>
                <div className={`absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-10 ${
                  collectionRate < 60 ? "bg-amber-500" : "bg-blue-500"
                }`} />
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                    collectionRate < 60 ? "bg-amber-100" : "bg-blue-100"
                  }`}>
                    <DollarSign size={17} className={collectionRate < 60 ? "text-amber-600" : "text-blue-600"} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("Revenue per Order")}</p>
                    <p className={`text-2xl font-bold mt-0.5 ${collectionRate < 60 ? "text-amber-600" : "text-blue-600"}`}>
                      {formatCurrency(avgOrder)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t("Average across")} {filteredOrders.length} {t("orders")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════ NEW SALE MODAL ══════════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                  <ShoppingBag size={15} className="text-violet-600" />
                </div>
                <h2 className="font-bold text-gray-900">{t("New Sale")}</h2>
              </div>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("Customer")} *</label>
                  <select required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                    value={form.customer_id}
                    onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}>
                    <option value="">{t("Select customer...")}</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.company ? ` (${c.company})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("Status")}</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option>Pending</option>
                    <option>Processing</option>
                    <option>Shipped</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("Due Date")}</label>
                  <input type="date"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    value={form.due_date}
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("Notes")}</label>
                  <input type="text" placeholder={t("Optional notes...")}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">{t("Products / Items")} *</label>
                  <button type="button" onClick={addItem}
                    className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors">
                    <Plus size={12} /> {t("Add Item")}
                  </button>
                </div>

                <div className="grid grid-cols-12 gap-2 px-1 mb-1">
                  <span className="col-span-5 text-xs text-gray-400 font-medium">{t("Product")}</span>
                  <span className="col-span-2 text-xs text-gray-400 font-medium">{t("Qty")}</span>
                  <span className="col-span-3 text-xs text-gray-400 font-medium">{t("Unit Price")}</span>
                  <span className="col-span-2 text-xs text-gray-400 font-medium text-right">{t("Subtotal")}</span>
                </div>

                <div className="space-y-2">
                  {form.items.map((item, idx) => {
                    const subtotal   = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
                    const prod       = products.find(p => String(p.id) === String(item.product_id));
                    const stockWarn  = prod && parseInt(item.quantity) > parseInt(prod.stock || 0);
                    const outOfStock = prod && parseInt(prod.stock || 0) === 0;
                    return (
                      <div key={idx}>
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-5">
                            <select
                              className={`w-full border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                                outOfStock && item.product_id ? "border-red-200 bg-red-50" : "border-gray-200"
                              }`}
                              value={item.product_id}
                              onChange={e => updateItem(idx, "product_id", e.target.value)}>
                              <option value="">{t("Select product...")}</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({t("Stock")}: {p.stock})
                                </option>
                              ))}
                            </select>
                          </div>
                          <input type="number" min="1"
                            className={`col-span-2 border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                              stockWarn ? "border-amber-300 bg-amber-50" : "border-gray-200"
                            }`}
                            value={item.quantity}
                            onChange={e => updateItem(idx, "quantity", e.target.value)} />
                          <input type="number" min="0" step="0.01"
                            className="col-span-3 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                            value={item.unit_price}
                            onChange={e => updateItem(idx, "unit_price", e.target.value)} />
                          <div className="col-span-2 flex items-center justify-end gap-1">
                            <span className="text-sm font-medium text-gray-700">${subtotal.toFixed(2)}</span>
                            {form.items.length > 1 && (
                              <button type="button" onClick={() => removeItem(idx)}
                                className="text-gray-300 hover:text-red-400 ml-0.5 transition-colors">
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                        {stockWarn && !outOfStock && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 px-1">
                            <AlertTriangle size={10} /> Only {prod.stock} in stock — may be rejected
                          </p>
                        )}
                        {outOfStock && item.product_id && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500 px-1">
                            <AlertCircle size={10} /> Out of stock
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-sm text-gray-500">{t("Order Total")}</span>
                  <span className="text-xl font-bold text-gray-900">${saleTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg active:scale-95 transition-all">
                  {t("Cancel")}
                </button>
                <button type="submit" disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60 active:scale-95 transition-all">
                  {submitting ? (
                    <><RefreshCw size={14} className="animate-spin" /> {t("Saving...")}</>
                  ) : (
                    <><CheckCircle size={14} /> {t("Create Sale")}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Sales;
