import { useState, useEffect, useCallback } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, ShoppingCart, ArrowUpRight,
  ArrowDownRight, Download, RefreshCw, Users, CreditCard, Package,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie,
} from "recharts";
import { useSystem } from "../context/SystemContext";
import { getRevenueAnalytics } from "../services/salesService";
import { exportToCSV } from "../utils/exportCSV";
import PageHeader from "../components/UI/PageHeader";

const RANGES = ["All Time", "This Year", "Last 3 Months", "This Month"];

const PIE_COLORS = ["#7c3aed", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe", "#f5f3ff"];

const fmt = (n) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `$${(n / 1_000).toFixed(1)}k`
  : `$${Number(n).toFixed(0)}`;

const pct = (curr, prev) => {
  if (!prev || prev === 0) return null;
  return (((curr - prev) / prev) * 100).toFixed(1);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="text-xs">
          {p.name}: <span className="font-semibold">${Number(p.value).toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

const KPICard = ({ icon: Icon, label, value, sub, positive, iconColor, loading }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
    <div className="flex items-start justify-between mb-3">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColor}`}>
        <Icon size={17} />
      </span>
    </div>
    {loading ? (
      <div className="h-8 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mb-2" />
    ) : (
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
    )}
    {sub !== null && (
      <div className={`flex items-center gap-1 text-xs font-medium ${positive === null ? "text-gray-400 dark:text-gray-500" : positive ? "text-green-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
        {positive === true  && <ArrowUpRight size={12} />}
        {positive === false && <ArrowDownRight size={12} />}
        {loading ? <span className="w-16 h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse inline-block" /> : sub}
      </div>
    )}
  </div>
);

const RevenueAnalytics = () => {
  const { t } = useSystem();
  const [range, setRange]       = useState("This Year");
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await getRevenueAnalytics(range === "All Time" ? "" : range);
      setData(res);
    } catch (e) {
      setError(e.response?.data?.error || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  // ── Derived values ───────────────────────────────────────────────────────────
  const kpi          = data?.kpi          || {};
  const monthly      = data?.monthly      || [];
  const categories   = data?.categoryRevenue || [];
  const topCustomers = data?.topCustomers || [];
  const payMethods   = data?.paymentMethods || [];

  const growth   = pct(kpi.revenue, kpi.prev_revenue);
  const growthNum = growth !== null ? parseFloat(growth) : null;

  const totalCatRevenue = categories.reduce((s, c) => s + c.revenue, 0);
  const bestMonth = monthly.length
    ? monthly.reduce((best, m) => m.revenue > best.revenue ? m : best, monthly[0])
    : null;

  // ── Export ───────────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!data) return;
    exportToCSV(
      monthly.map((m) => ({ Month: m.month, Year: m.year, Revenue: m.revenue, Orders: m.orders })),
      "revenue_monthly"
    );
  };

  return (
    <div>
      {/* Header */}
      <PageHeader
        title={t("Revenue Analytics")}
        subtitle={t("Deep dive into revenue streams, profitability, and growth")}
        badges={
          growthNum !== null
            ? [{
                icon: growthNum >= 0 ? TrendingUp : TrendingDown,
                label: `${growthNum >= 0 ? "+" : ""}${growth}% vs prior period`,
                tone: growthNum >= 0 ? "emerald" : "red",
              }]
            : []
        }
        actions={
          <>
            <button onClick={load} className="p-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={handleExport}
              disabled={!data || loading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40"
            >
              <Download size={15} /> Export CSV
            </button>
          </>
        }
      />

      {/* Range tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6 w-fit flex-wrap">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              range === r ? "bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-300 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          icon={DollarSign} label="Total Revenue" loading={loading}
          iconColor="bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400"
          value={fmt(kpi.revenue || 0)}
          sub={growthNum !== null ? `${growthNum >= 0 ? "+" : ""}${growth}% vs prior period` : "No prior data"}
          positive={growthNum !== null ? growthNum >= 0 : null}
        />
        <KPICard
          icon={ShoppingCart} label="Total Orders" loading={loading}
          iconColor="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
          value={(kpi.orders || 0).toLocaleString()}
          sub={bestMonth ? `Best: ${bestMonth.month} (${bestMonth.orders} orders)` : "—"}
          positive={null}
        />
        <KPICard
          icon={TrendingUp} label="Avg Order Value" loading={loading}
          iconColor="bg-green-50 dark:bg-emerald-900/20 text-green-600 dark:text-emerald-400"
          value={fmt(kpi.avg_order_value || 0)}
          sub="Per completed order"
          positive={null}
        />
        <KPICard
          icon={Package} label="Best Month" loading={loading}
          iconColor="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
          value={bestMonth ? bestMonth.month : "—"}
          sub={bestMonth ? `${fmt(bestMonth.revenue)} revenue` : "No data yet"}
          positive={null}
        />
      </div>

      {/* Revenue Trend */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend</h3>
        {loading ? (
          <div className="h-56 bg-gray-50 dark:bg-gray-800 rounded-xl animate-pulse" />
        ) : monthly.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">No data for this period</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#7c3aed" fill="url(#gRev)" strokeWidth={2.5} name="Revenue" dot={{ r: 3, fill: "#7c3aed" }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Orders per Month + Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Orders per month */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Orders per Month</h3>
          {loading ? (
            <div className="h-44 bg-gray-50 dark:bg-gray-800 rounded-xl animate-pulse" />
          ) : monthly.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, "Orders"]} />
                <Bar dataKey="orders" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category breakdown — donut */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Revenue by Category</h3>
          {loading ? (
            <div className="h-44 bg-gray-50 dark:bg-gray-800 rounded-xl animate-pulse" />
          ) : categories.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">No data</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={categories.map((c, i) => ({ ...c, fill: PIE_COLORS[i % PIE_COLORS.length] }))} dataKey="revenue" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} />
                  <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {categories.map((cat, i) => (
                  <div key={cat.category} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">{cat.category}</span>
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{totalCatRevenue > 0 ? Math.round((cat.revenue / totalCatRevenue) * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Methods + Top Customers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment method breakdown */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={16} className="text-violet-500 dark:text-violet-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Payment Methods</h3>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse" />)}</div>
          ) : payMethods.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">No payment data</div>
          ) : (
            <div className="space-y-3">
              {payMethods.map((pm, i) => {
                const totalPaid = payMethods.reduce((s, p) => s + p.total, 0);
                const share = totalPaid > 0 ? Math.round((pm.total / totalPaid) * 100) : 0;
                return (
                  <div key={pm.method}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{pm.method}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(pm.total)}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{pm.count} txn{pm.count !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${share}%`, background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{share}% of total</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top customers */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-violet-500 dark:text-violet-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Top Customers</h3>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse" />)}</div>
          ) : topCustomers.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">No customer data</div>
          ) : (
            <div className="space-y-2.5">
              {topCustomers.map((c, i) => (
                <div key={c.email} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{c.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(c.revenue)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{c.orders} order{c.orders !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalytics;
