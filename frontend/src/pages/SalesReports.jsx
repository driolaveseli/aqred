import { useState, useEffect, useCallback } from "react";
import { Download, TrendingUp, ShoppingBag, DollarSign, BarChart2, RefreshCw } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import { getSalesReport, getSales } from "../services/salesService";
import { getPayments } from "../services/paymentsService";
import { exportToCSV } from "../utils/exportCSV";
import { useSystem } from "../context/SystemContext";
import EmptyState from "../components/UI/EmptyState";
import SkeletonLoader from "../components/UI/SkeletonLoader";
import ChartTooltip from "../components/UI/ChartTooltip";
import PageHeader from "../components/UI/PageHeader";

const DATE_RANGES = ["This Month", "Last 3 Months", "This Year", "All Time"];

// Filter the flat orders list by range (for the table + payment total)
const filterOrdersByRange = (orders, range) => {
  if (range === "All Time") return orders;
  const now = new Date();
  return orders.filter((o) => {
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

const STATUS_COLORS = {
  Completed:  "bg-green-50 dark:bg-emerald-900/20 text-green-600 dark:text-emerald-400",
  Cancelled:  "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
  Processing: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
  Pending:    "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
};

const SalesReports = () => {
  const { formatCurrency, formatDate, t } = useSystem();
  const [reportData, setReportData] = useState({ monthly: [], topProducts: [], categoryRevenue: [] });
  const [orders, setOrders]     = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [range, setRange]       = useState("This Year");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Report data is range-filtered on the backend; orders/payments fetched in full
      // so we can apply the same range client-side for the table and payment KPI.
      const [rRes, oRes, pRes] = await Promise.all([
        getSalesReport(range),
        getSales({ limit: 5000 }),
        getPayments({ limit: 5000 }),
      ]);
      setReportData(rRes.data);
      setOrders(oRes.data.data);
      setPayments(pRes.data.data);
    } catch (err) {
      console.error("Failed to load report data", err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  // Monthly data is already range-filtered by the backend — sum directly
  const totalRevenue   = reportData.monthly.reduce((s, m) => s + parseFloat(m.revenue || 0), 0);
  const totalOrders    = reportData.monthly.reduce((s, m) => s + parseInt(m.orders || 0), 0);
  const avgOrder       = totalOrders ? totalRevenue / totalOrders : 0;

  // Payments: filter by range, count only Completed
  const filteredPayments = filterOrdersByRange(payments, range);
  const totalCollected   = filteredPayments
    .filter((p) => p.status === "Completed")
    .reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  // Orders table: apply same range filter
  const filteredOrders = filterOrdersByRange(orders, range);
  const catTotal = reportData.categoryRevenue.reduce((s, c) => s + parseFloat(c.revenue || 0), 0);

  const handleExportRevenue = () => {
    exportToCSV(
      reportData.monthly.map((m) => ({
        Month:           m.month,
        Year:            m.year,
        "Revenue (USD)": parseFloat(m.revenue || 0).toFixed(2),
        "Order Count":   m.orders,
      })),
      "sales_revenue"
    );
  };

  const handleExportOrders = () => {
    exportToCSV(
      filteredOrders.map((o) => ({
        "Order ID":       `ORD-${String(o.id).padStart(4, "0")}`,
        Customer:         o.customer_name || "",
        "Customer Email": o.customer_email || "",
        Items:            o.item_count || 0,
        "Total (USD)":    parseFloat(o.total || 0).toFixed(2),
        Status:           o.status,
        "Order Date":     formatDate(o.order_date || o.created_at),
        Notes:            o.notes || "",
      })),
      "orders_export"
    );
  };

  if (loading) return (
    <SkeletonLoader type="page" statCount={4} rows={5} cols={6} />
  );

  return (
    <div>
      {/* Header */}
      <PageHeader
        title={t("Sales Reports")}
        subtitle={t("Live analytics from orders, payments, and customers")}
        badges={totalRevenue > 0 ? [{ icon: DollarSign, label: `${formatCurrency(totalRevenue)} ${t("revenue")}`, tone: "violet" }] : []}
        actions={
          <>
            <button onClick={load}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all">
              <RefreshCw size={14} /> {t("Refresh")}
            </button>
            <button onClick={handleExportRevenue}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all">
              <Download size={15} /> {t("Export Revenue")}
            </button>
            <button onClick={handleExportOrders}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 active:scale-95 transition-all">
              <Download size={15} /> {t("Export Orders")}
            </button>
          </>
        }
      />

      {/* Date Range Filter */}
      <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-1 mb-6 w-fit">
        {DATE_RANGES.map((r) => (
          <button key={r} onClick={() => setRange(r)}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              range === r ? "bg-violet-600 text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}>
            {t(r)}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: t("Revenue"),            value: formatCurrency(totalRevenue),   sub: t(range),              icon: DollarSign, color: "text-green-600 dark:text-emerald-400",  bg: "bg-green-50 dark:bg-emerald-900/20"  },
          { label: t("Orders"),             value: totalOrders,                    sub: t(range),              icon: ShoppingBag,color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-50 dark:bg-blue-900/20"   },
          { label: t("Avg. Order Value"),   value: formatCurrency(avgOrder),       sub: t("Per transaction"),  icon: TrendingUp, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20" },
          { label: t("Payments Collected"), value: formatCurrency(totalCollected), sub: t(range),              icon: BarChart2,  color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-900/20"  },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon size={17} className={color} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Bar Chart */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t("Monthly Revenue")}</h3>
        {reportData.monthly.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-400 dark:text-gray-500 text-sm">
            {t("No data for selected period.")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={reportData.monthly.map((m) => ({ ...m, revenue: parseFloat(m.revenue || 0) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
              <Tooltip content={<ChartTooltip formatter={(v) => [formatCurrency(v), t("Revenue")]} />} />
              <Bar dataKey="revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Orders per Month Line Chart */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t("Orders per Month")}</h3>
        {reportData.monthly.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">{t("No data for selected period.")}</div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={reportData.monthly.map((m) => ({ ...m, orders: parseInt(m.orders || 0) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip formatter={(v, n) => [v, t(n)]} />} />
              <Legend />
              <Line type="monotone" dataKey="orders" stroke="#7c3aed" strokeWidth={2} dot={false} name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Top Products */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t("Top Products by Revenue")}</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{range}</p>
          {reportData.topProducts.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">{t("No data for selected period.")}</div>
          ) : (
            <div className="space-y-3">
              {reportData.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{p.units} unit{p.units !== 1 ? "s" : ""} · {p.category || "—"}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t("Revenue by Category")}</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{range}</p>
          {reportData.categoryRevenue.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">{t("No data for selected period.")}</div>
          ) : (
            <div className="space-y-3">
              {reportData.categoryRevenue.map((cat) => {
                const pct = catTotal > 0 ? ((parseFloat(cat.revenue) / catTotal) * 100).toFixed(1) : 0;
                return (
                  <div key={cat.category}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{cat.category}</span>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(cat.revenue)}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                      <div className="h-2 rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Orders Table — filtered by selected date range */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Orders — {range}</h3>
          <span className="text-xs text-gray-400 dark:text-gray-500">{filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}</span>
        </div>
        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={BarChart2}
            title={t("No orders for selected period")}
            description={t("Try selecting a different date range.")}
          />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-b border-gray-50 dark:border-gray-800/60">
                {[t("Order"), t("Customer"), t("Items"), t("Total"), t("Status"), t("Date")].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o, idx) => (
                <tr key={o.id} className={`hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors ${idx !== filteredOrders.length - 1 ? "border-b border-gray-50 dark:border-gray-800/60" : ""}`}>
                  <td className="px-5 py-3 text-xs font-mono text-violet-600 dark:text-violet-400">ORD-{String(o.id).padStart(4, "0")}</td>
                  <td className="px-5 py-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{o.customer_name || "—"}</p>
                    {o.customer_email && <p className="text-xs text-gray-400 dark:text-gray-500">{o.customer_email}</p>}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{o.item_count || 0}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(o.total)}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[o.status] || "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
                      {t(o.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400 dark:text-gray-500">{formatDate(o.order_date || o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReports;
