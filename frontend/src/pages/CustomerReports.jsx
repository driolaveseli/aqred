import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Download, Users, UserCheck, UserX, TrendingUp, RefreshCw,
  DollarSign, AlertCircle, ShoppingCart, Search, ChevronUp,
  ChevronDown, ChevronsUpDown, Star, Clock, Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Legend,
} from "recharts";
import { getCustomers } from "../services/customersService";
import { getSales } from "../services/salesService";
import { exportToCSV } from "../utils/exportCSV";
import { useSystem } from "../context/SystemContext";
import EmptyState from "../components/UI/EmptyState";
import SkeletonLoader from "../components/UI/SkeletonLoader";
import ChartTooltip from "../components/UI/ChartTooltip";

// ── Constants ────────────────────────────────────────────────────────────────
const RANGES = ["All Time", "This Year", "Last 3 Months", "This Month"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const STATUS_COLORS = {
  Active:   { fill: "#7c3aed", cls: "bg-violet-50 text-violet-600" },
  Inactive: { fill: "#9ca3af", cls: "bg-gray-100 text-gray-500" },
  Pending:  { fill: "#f59e0b", cls: "bg-amber-50 text-amber-600" },
};
const SEGMENT_META = {
  "High Value": { cls: "bg-amber-50 text-amber-700 border-amber-200",  dot: "#f59e0b", icon: Star },
  "Medium":     { cls: "bg-violet-50 text-violet-700 border-violet-200", dot: "#7c3aed", icon: TrendingUp },
  "Low Value":  { cls: "bg-blue-50 text-blue-700 border-blue-200",      dot: "#3b82f6", icon: Activity },
  "No Orders":  { cls: "bg-gray-50 text-gray-500 border-gray-200",      dot: "#9ca3af", icon: UserX },
};

const fmt  = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v || 0);
const fmtD = (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v || 0);

// ── Helpers ──────────────────────────────────────────────────────────────────
const rangeFrom = (range) => {
  const now = new Date();
  if (range === "This Month")    return new Date(now.getFullYear(), now.getMonth(), 1);
  if (range === "Last 3 Months") return new Date(now.getFullYear(), now.getMonth() - 2, 1);
  if (range === "This Year")     return new Date(now.getFullYear(), 0, 1);
  return null;
};

const inRange = (dateStr, from) => {
  if (!from) return true;
  return new Date(dateStr) >= from;
};

const buildGrowthChart = (customers, from) => {
  const map = {};
  customers
    .filter((c) => inRange(c.created_at, from))
    .forEach((c) => {
      const d   = new Date(c.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      if (!map[key]) map[key] = { month: MONTHS[d.getMonth()], year: d.getFullYear(), count: 0, _sort: key };
      map[key].count += 1;
    });
  return Object.values(map).sort((a, b) => a._sort.localeCompare(b._sort)).slice(-12);
};

const buildFrequencyChart = (enriched) => {
  const buckets = { "1 order": 0, "2–5": 0, "6–10": 0, "10+": 0 };
  enriched.forEach((c) => {
    if (c.orderCount === 0) return;
    if (c.orderCount === 1)       buckets["1 order"]++;
    else if (c.orderCount <= 5)   buckets["2–5"]++;
    else if (c.orderCount <= 10)  buckets["6–10"]++;
    else                          buckets["10+"]++;
  });
  return Object.entries(buckets).map(([name, count]) => ({ name, count }));
};

const buildFinancials = (customers, orders, from) => {
  const fin = {};
  orders
    .filter((o) => !["cancelled", "Cancelled"].includes(o.status) && inRange(o.order_date || o.created_at, from))
    .forEach((o) => {
      const id = o.customer_id;
      if (!fin[id]) fin[id] = { revenue: 0, paid: 0, orders: 0, lastOrder: null };
      fin[id].revenue += parseFloat(o.total || 0);
      fin[id].paid    += parseFloat(o.amount_paid || 0);
      fin[id].orders  += 1;
      const d = o.order_date || o.created_at;
      if (!fin[id].lastOrder || new Date(d) > new Date(fin[id].lastOrder)) fin[id].lastOrder = d;
    });
  return customers.map((c) => {
    const f = fin[c.id] || { revenue: 0, paid: 0, orders: 0, lastOrder: null };
    return { ...c, revenue: f.revenue, orderCount: f.orders, paid: f.paid,
              outstanding: Math.max(f.revenue - f.paid, 0), lastOrder: f.lastOrder };
  });
};

// ── Sort hook ────────────────────────────────────────────────────────────────
const useSortableData = (items, initKey = "revenue", initDir = "desc") => {
  const [sort, setSort] = useState({ key: initKey, dir: initDir });
  const toggle = (key) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));
  const sorted = useMemo(() => {
    if (!sort.key) return items;
    return [...items].sort((a, b) => {
      const av = a[sort.key] ?? 0;
      const bv = b[sort.key] ?? 0;
      const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [items, sort]);
  return { sorted, sort, toggle };
};

// ── Sub-components ───────────────────────────────────────────────────────────
const SortIcon = ({ col, sort }) => {
  if (sort.key !== col) return <ChevronsUpDown size={12} className="text-gray-300" />;
  return sort.dir === "asc" ? <ChevronUp size={12} className="text-violet-500" /> : <ChevronDown size={12} className="text-violet-500" />;
};

const KPICard = ({ label, value, icon: Icon, color, bg, sub }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm text-gray-500">{label}</p>
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}><Icon size={17} className={color} /></div>
    </div>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const CustomerReports = () => {
  const { formatDate, t } = useSystem();
  const [customers, setCustomers] = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [range,     setRange]     = useState("All Time");
  const [search,    setSearch]    = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, oRes] = await Promise.all([getCustomers(), getSales()]);
      setCustomers(cRes.data);
      setOrders(oRes.data);
    } catch (err) {
      console.error("Failed to load customer report data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived data ─────────────────────────────────────────────────────────
  const from      = rangeFrom(range);
  const enriched  = useMemo(() => buildFinancials(customers, orders, from), [customers, orders, from]);

  // KPIs
  const total         = customers.length;
  const active        = customers.filter((c) => (c.status || "Active") === "Active").length;
  const inactive      = customers.filter((c) => c.status === "Inactive").length;
  const pending       = customers.filter((c) => c.status === "Pending").length;
  const withOrders    = enriched.filter((c) => c.orderCount > 0).length;
  const withoutOrders = total - withOrders;

  const totalRevenue     = enriched.reduce((a, c) => a + c.revenue, 0);
  const totalCollected   = enriched.reduce((a, c) => a + c.paid, 0);
  const totalOutstanding = enriched.reduce((a, c) => a + c.outstanding, 0);
  const avgRevenue       = withOrders > 0 ? totalRevenue / withOrders : 0;
  const avgOrderValue    = enriched.reduce((a, c) => a + c.orderCount, 0) > 0
    ? totalRevenue / enriched.reduce((a, c) => a + c.orderCount, 0) : 0;

  // Segments
  const segments = useMemo(() => {
    const high = enriched.filter((c) => c.revenue > avgRevenue * 2);
    const med  = enriched.filter((c) => c.revenue >= avgRevenue * 0.5 && c.revenue <= avgRevenue * 2 && c.revenue > 0);
    const low  = enriched.filter((c) => c.revenue > 0 && c.revenue < avgRevenue * 0.5);
    const none = enriched.filter((c) => c.orderCount === 0);
    return { "High Value": high, "Medium": med, "Low Value": low, "No Orders": none };
  }, [enriched, avgRevenue]);

  // At-risk: ordered before but last order > 60 days ago
  const atRisk = useMemo(() => {
    const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    return enriched
      .filter((c) => c.lastOrder && new Date(c.lastOrder) < cutoff)
      .sort((a, b) => new Date(a.lastOrder) - new Date(b.lastOrder))
      .slice(0, 5);
  }, [enriched]);

  // Charts
  const growthChart   = useMemo(() => buildGrowthChart(customers, from), [customers, from]);
  const freqChart     = useMemo(() => buildFrequencyChart(enriched), [enriched]);
  const topCustomers  = useMemo(() =>
    [...enriched].filter((c) => c.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    [enriched]);
  const revenueVsCollected = topCustomers.slice(0, 6).map((c) => ({
    name: c.name.split(" ")[0],
    Revenue:   parseFloat(c.revenue.toFixed(2)),
    Collected: parseFloat(c.paid.toFixed(2)),
  }));
  const statusPie = [
    { name: "Active",   value: active,   fill: STATUS_COLORS.Active.fill },
    { name: "Inactive", value: inactive, fill: STATUS_COLORS.Inactive.fill },
    { name: "Pending",  value: pending,  fill: STATUS_COLORS.Pending.fill },
  ].filter((s) => s.value > 0);
  const collectionPie = [
    { name: "Collected",   value: totalCollected,   fill: "#16a34a" },
    { name: "Outstanding", value: totalOutstanding, fill: "#f97316" },
  ].filter((s) => s.value > 0);

  // Filtered + sorted All Customers table
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enriched.filter((c) => {
      const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" || (c.status || "Active") === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [enriched, search, statusFilter]);

  const { sorted: sortedAll, sort: sortAll, toggle: toggleAll } = useSortableData(filtered);
  const { sorted: sortedTop, sort: sortTop, toggle: toggleTop } = useSortableData(topCustomers);

  // Exports
  const handleExport = () => exportToCSV(
    enriched.map((c) => ({
      Name: c.name, Email: c.email, Phone: c.phone || "", Company: c.company || "",
      Status: c.status || "Active", Orders: c.orderCount,
      Revenue: c.revenue.toFixed(2), Paid: c.paid.toFixed(2),
      Outstanding: c.outstanding.toFixed(2),
      "Avg Order": c.orderCount > 0 ? (c.revenue / c.orderCount).toFixed(2) : "0.00",
      "Last Order": c.lastOrder ? formatDate(c.lastOrder) : "—",
      Since: formatDate(c.created_at),
    })),
    "customer_report"
  );
  const handleExportTop = () => exportToCSV(
    topCustomers.map((c, i) => ({
      Rank: i + 1, Name: c.name, Email: c.email, Orders: c.orderCount,
      Revenue: c.revenue.toFixed(2), Paid: c.paid.toFixed(2),
      Outstanding: c.outstanding.toFixed(2),
      "Avg Order": c.orderCount > 0 ? (c.revenue / c.orderCount).toFixed(2) : "0.00",
      "Last Order": c.lastOrder ? formatDate(c.lastOrder) : "—",
    })),
    "top_customers"
  );

  const daysSince = (d) => d ? Math.floor((Date.now() - new Date(d)) / 86400000) : null;

  if (loading) return <SkeletonLoader type="page" statCount={4} rows={5} cols={6} />;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t("Customer Reports")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("Complete customer activity linked to Orders, Invoices, and Payments")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 active:scale-95 transition-all">
            <RefreshCw size={14} /> {t("Refresh")}
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 active:scale-95 transition-all">
            <Download size={15} /> {t("Export CSV")}
          </button>
        </div>
      </div>

      {/* Range filter */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {RANGES.map((r) => (
          <button key={r} onClick={() => setRange(r)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${range === r ? "bg-white text-violet-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {r}
          </button>
        ))}
      </div>

      {/* Row 1 — Customer KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label={t("Total Customers")}    value={total}              icon={Users}       color="text-violet-600" bg="bg-violet-50" />
        <KPICard label={t("Active")}             value={active}             icon={UserCheck}   color="text-green-600"  bg="bg-green-50"  sub={`${inactive} inactive · ${pending} pending`} />
        <KPICard label={t("With Orders")}        value={withOrders}         icon={ShoppingCart} color="text-blue-600"  bg="bg-blue-50"   sub={`${withoutOrders} haven't ordered yet`} />
        <KPICard label={t("At-Risk Customers")}  value={atRisk.length}      icon={Clock}       color="text-orange-600" bg="bg-orange-50" sub="No orders in 60+ days" />
      </div>

      {/* Row 2 — Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label={t("Total Revenue")}          value={fmt(totalRevenue)}     icon={TrendingUp}  color="text-gray-900"   bg="bg-gray-50"   />
        <KPICard label={t("Total Collected")}        value={fmt(totalCollected)}   icon={DollarSign}  color="text-green-600"  bg="bg-green-50"  />
        <KPICard label={t("Outstanding Balance")}    value={fmt(totalOutstanding)} icon={AlertCircle} color="text-orange-600" bg="bg-orange-50" />
        <KPICard label={t("Avg Order Value")}        value={fmtD(avgOrderValue)}   icon={Activity}    color="text-violet-600" bg="bg-violet-50" />
      </div>

      {/* Customer Segments */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h3 className="font-semibold text-gray-900 mb-4">{t("Customer Segments")}</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(SEGMENT_META).map(([seg, meta]) => {
            const Icon = meta.icon;
            const list = segments[seg] || [];
            const rev  = list.reduce((s, c) => s + c.revenue, 0);
            return (
              <div key={seg} className={`rounded-xl border p-4 ${meta.cls}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={15} />
                  <span className="text-sm font-semibold">{seg}</span>
                </div>
                <p className="text-2xl font-bold">{list.length}</p>
                <p className="text-xs opacity-70 mt-1">{rev > 0 ? fmt(rev) : "No revenue"}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Row 1 — Growth + Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t("New Customers by Month")}</h3>
          {growthChart.length === 0
            ? <div className="flex items-center justify-center h-48 text-gray-400 text-sm">{t("No data for this period")}</div>
            : <ResponsiveContainer width="100%" height={220}>
                <BarChart data={growthChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip formatter={(v, n) => [v, t(n)]} />} />
                  <Bar dataKey="count" fill="#7c3aed" radius={[4,4,0,0]} name="New Customers" />
                </BarChart>
              </ResponsiveContainer>
          }
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t("Customer Status")}</h3>
          {statusPie.length === 0
            ? <div className="flex items-center justify-center h-40 text-gray-400 text-sm">{t("No data")}</div>
            : <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={statusPie} cx="50%" cy="50%" innerRadius={40} outerRadius={68} paddingAngle={3} dataKey="value" />
                    <Tooltip content={<ChartTooltip formatter={(v, n) => [v, t(n)]} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-1">
                  {statusPie.map((seg) => (
                    <div key={seg.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: seg.fill }} />
                        <span className="text-xs text-gray-600">{t(seg.name)}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-900">{seg.value}</span>
                    </div>
                  ))}
                </div>
              </>
          }
        </div>
      </div>

      {/* Charts Row 2 — Order Frequency + Collection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t("Order Frequency Distribution")}</h3>
          <p className="text-xs text-gray-400 mb-3">{t("How many customers placed each order volume range")}</p>
          {freqChart.every((b) => b.count === 0)
            ? <div className="flex items-center justify-center h-40 text-gray-400 text-sm">{t("No orders yet")}</div>
            : <ResponsiveContainer width="100%" height={180}>
                <BarChart data={freqChart} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip formatter={(v) => [v, "Customers"]} />} />
                  <Bar dataKey="count" radius={[4,4,0,0]} name="Customers"
                    fill="url(#freqGrad)" />
                  <defs>
                    <linearGradient id="freqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
          }
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t("Collection Status")}</h3>
          {collectionPie.length === 0
            ? <div className="flex items-center justify-center h-40 text-gray-400 text-sm">{t("No financial data yet")}</div>
            : <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={collectionPie} cx="50%" cy="50%" innerRadius={40} outerRadius={68} paddingAngle={3} dataKey="value" />
                    <Tooltip content={<ChartTooltip formatter={(v, n) => [fmtD(v), t(n)]} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-1">
                  {collectionPie.map((seg) => (
                    <div key={seg.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: seg.fill }} />
                        <span className="text-xs text-gray-600">{t(seg.name)}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-900">{fmt(seg.value)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                    <span className="text-xs text-gray-400">{t("No Orders Yet")}</span>
                    <span className="text-xs font-semibold text-gray-400">{withoutOrders}</span>
                  </div>
                </div>
              </>
          }
        </div>
      </div>

      {/* Revenue vs Collected */}
      {revenueVsCollected.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">{t("Revenue vs Collected — Top Customers")}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueVsCollected} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip formatter={(v, n) => [fmtD(v), t(n)]} />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Revenue"   fill="#7c3aed" radius={[4,4,0,0]} />
              <Bar dataKey="Collected" fill="#16a34a" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* At-Risk Customers */}
      {atRisk.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Clock size={16} className="text-orange-500" />
            <h3 className="font-semibold text-gray-900">{t("At-Risk Customers")}</h3>
            <span className="ml-auto text-xs text-gray-400">{t("No orders in 60+ days")}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {atRisk.map((c) => {
              const days = daysSince(c.lastOrder);
              return (
                <div key={c.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-orange-50/30 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-orange-600">{c.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{fmt(c.revenue)}</p>
                    <p className="text-xs text-gray-400">{c.orderCount} order{c.orderCount !== 1 ? "s" : ""}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-orange-50 text-orange-600 text-xs font-medium rounded-full flex-shrink-0">
                    {days}d ago
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Customers Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{t("Top Customers by Revenue")}</h3>
          <button onClick={handleExportTop} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-violet-600 font-medium">
            <Download size={13} /> {t("Export")}
          </button>
        </div>
        {topCustomers.length === 0
          ? <EmptyState icon={TrendingUp} title={t("No customer data yet")} description={t("Create sales orders to see customer rankings here.")} />
          : <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-gray-50">
                    {[
                      { label: t("Rank"), key: null },
                      { label: t("Customer"), key: "name" },
                      { label: t("Orders"), key: "orderCount" },
                      { label: t("Revenue"), key: "revenue" },
                      { label: t("Collected"), key: "paid" },
                      { label: t("Outstanding"), key: "outstanding" },
                      { label: t("Avg Order"), key: null },
                      { label: t("Last Order"), key: "lastOrder" },
                    ].map(({ label, key }) => (
                      <th key={label}
                        onClick={() => key && toggleTop(key)}
                        className={`px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider ${key ? "cursor-pointer hover:text-gray-600 select-none" : ""}`}>
                        <div className="flex items-center gap-1">{label}{key && <SortIcon col={key} sort={sortTop} />}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTop.map((c, i) => (
                    <tr key={c.id} className={`hover:bg-violet-50/30 transition-colors ${i !== sortedTop.length - 1 ? "border-b border-gray-50" : ""}`}>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-600" : i === 1 ? "bg-gray-100 text-gray-500" : i === 2 ? "bg-orange-100 text-orange-500" : "text-gray-400"}`}>
                          {topCustomers.indexOf(c) + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{c.orderCount}</td>
                      <td className="px-5 py-3.5 text-sm font-bold text-gray-900">{fmtD(c.revenue)}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-green-600">{fmtD(c.paid)}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold">
                        <span className={c.outstanding > 0 ? "text-orange-500" : "text-gray-400"}>{fmtD(c.outstanding)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">
                        {c.orderCount > 0 ? fmtD(c.revenue / c.orderCount) : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">{c.lastOrder ? formatDate(c.lastOrder) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>

      {/* All Customers Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">{t("All Customers — Financial Summary")}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{filtered.length} of {customers.length} shown</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("Search name, email, company...")}
                  className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 w-52"
                />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
        {customers.length === 0
          ? <EmptyState icon={Users} title={t("No customers yet")} description={t("Add customers in the Customers module to see them here.")} />
          : sortedAll.length === 0
          ? <div className="px-5 py-12 text-center text-sm text-gray-400">{t("No customers match your search.")}</div>
          : <div className="overflow-x-auto">
              <table className="w-full min-w-[780px]">
                <thead>
                  <tr className="border-b border-gray-50">
                    {[
                      { label: t("Name"),        key: "name" },
                      { label: t("Company"),     key: "company" },
                      { label: t("Status"),      key: "status" },
                      { label: t("Orders"),      key: "orderCount" },
                      { label: t("Revenue"),     key: "revenue" },
                      { label: t("Collected"),   key: "paid" },
                      { label: t("Outstanding"), key: "outstanding" },
                      { label: t("Avg Order"),   key: null },
                      { label: t("Last Order"),  key: "lastOrder" },
                      { label: t("Since"),       key: "created_at" },
                    ].map(({ label, key }) => (
                      <th key={label}
                        onClick={() => key && toggleAll(key)}
                        className={`px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider ${key ? "cursor-pointer hover:text-gray-600 select-none" : ""}`}>
                        <div className="flex items-center gap-1">{label}{key && <SortIcon col={key} sort={sortAll} />}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedAll.map((c, idx) => (
                    <tr key={c.id} className={`hover:bg-violet-50/30 transition-colors ${idx !== sortedAll.length - 1 ? "border-b border-gray-50" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{c.company || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[c.status || "Active"]?.cls || "bg-green-50 text-green-600"}`}>
                          {t(c.status || "Active")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{c.orderCount}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{c.revenue > 0 ? fmtD(c.revenue) : <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">{c.paid > 0 ? fmtD(c.paid) : <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {c.outstanding > 0 ? <span className="text-orange-500">{fmtD(c.outstanding)}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {c.orderCount > 0 ? fmtD(c.revenue / c.orderCount) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{c.lastOrder ? formatDate(c.lastOrder) : <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>

    </div>
  );
};

export default CustomerReports;
