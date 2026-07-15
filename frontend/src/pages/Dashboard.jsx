import { useState, useEffect, useCallback } from "react";
import {
  DollarSign, Users, ShoppingCart, Clock, Package, UserCheck,
  TrendingUp, TrendingDown, RefreshCw, ArrowRight,
  CheckCircle, XCircle, Truck, AlertTriangle, Plus,
  Building2, BarChart2, FileText, CreditCard,
} from "lucide-react";
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSystem } from "../context/SystemContext";
import ChartTooltip from "../components/UI/ChartTooltip";

/* ─── Formatters ─────────────────────────────────────────────────────────── */
const fmt = (v) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v || 0);
const fmtSm = (v) =>
  v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000   ? `$${(v / 1_000).toFixed(1)}k`
  : `$${Number(v || 0).toFixed(0)}`;

/* ─── Status config ──────────────────────────────────────────────────────── */
const STATUS = {
  Completed:  { icon: CheckCircle, bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", hex: "#10b981" },
  Pending:    { icon: Clock,       bg: "bg-amber-50 dark:bg-amber-900/20",     text: "text-amber-600 dark:text-amber-400",   dot: "bg-amber-500",  hex: "#f59e0b" },
  Processing: { icon: RefreshCw,  bg: "bg-blue-50 dark:bg-blue-900/20",       text: "text-blue-600 dark:text-blue-400",     dot: "bg-blue-500",   hex: "#3b82f6" },
  Shipped:    { icon: Truck,      bg: "bg-violet-50 dark:bg-violet-900/20",   text: "text-violet-600 dark:text-violet-400", dot: "bg-violet-500", hex: "#7c3aed" },
  Cancelled:  { icon: XCircle,   bg: "bg-red-50 dark:bg-red-900/20",         text: "text-red-500 dark:text-red-400",       dot: "bg-red-500",    hex: "#ef4444" },
};

const CAT_COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#f97316", "#a78bfa"];

/* ─── Tiny components ────────────────────────────────────────────────────── */
const TrendBadge = ({ curr, prev }) => {
  if (prev == null || prev === 0) return null;
  const pct = (((curr - prev) / prev) * 100).toFixed(1);
  const pos = parseFloat(pct) >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
      pos ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
          : "bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400"}`}>
      {pos ? <TrendingUp size={9}/> : <TrendingDown size={9}/>}
      {pos && "+"}{pct}%
    </span>
  );
};

const KPICard = ({ icon: Icon, label, value, to, iconCls, curr, prev, sub, accentCls }) => (
  <Link to={to}
    className="relative group bg-white dark:bg-gray-900 rounded-2xl p-5
      border border-gray-100 dark:border-gray-800 shadow-sm
      hover:shadow-lg hover:-translate-y-1 transition-all duration-200 block overflow-hidden">
    <div className={`absolute top-0 left-0 right-0 h-[3px] ${accentCls || "bg-gray-100"}`} />
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${iconCls}`}>
        <Icon size={18}/>
      </div>
      <TrendBadge curr={curr} prev={prev}/>
    </div>
    <p className="text-[26px] font-bold text-gray-900 dark:text-white leading-none tracking-tight">{value}</p>
    <div className="flex items-center justify-between mt-2">
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-none">{label}</p>
      <span className="text-[11px] text-gray-300 dark:text-gray-600 group-hover:text-violet-500
        transition-colors flex items-center gap-0.5 flex-shrink-0">
        {sub || "View"} <ArrowRight size={10}/>
      </span>
    </div>
    {curr != null && prev != null && prev > 0 && (
      <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1">
        {typeof curr === "number" && curr > 999 ? fmtSm(curr) : curr} this month
      </p>
    )}
  </Link>
);

const KPICardSkeleton = () => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl p-5
    border border-gray-100 dark:border-gray-800 shadow-sm animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl"/>
      <div className="h-4 w-10 bg-gray-100 dark:bg-gray-800 rounded-full"/>
    </div>
    <div className="h-7 w-20 bg-gray-100 dark:bg-gray-800 rounded mb-2"/>
    <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded"/>
  </div>
);

const Section = ({ title, subtitle, action, to, children, headerRight }) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden h-full flex flex-col">
    <div className="flex items-start justify-between px-5 py-3.5 border-b border-gray-50 dark:border-gray-800/60 flex-shrink-0 gap-3">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {headerRight}
        {to && (
          <Link to={to} className="flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 mt-0.5">
            {action} <ArrowRight size={10}/>
          </Link>
        )}
      </div>
    </div>
    <div className="flex-1 min-h-0">{children}</div>
  </div>
);

const Empty = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
    <div className="w-9 h-9 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-2.5">
      <Icon size={18} className="text-gray-300 dark:text-gray-600"/>
    </div>
    <p className="text-sm text-gray-400 dark:text-gray-500">{text}</p>
  </div>
);

const SHORTCUTS = [
  { label: "Customers",  icon: Users,      to: "/customers",       cls: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" },
  { label: "Orders",     icon: ShoppingCart,to: "/orders",         cls: "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400"   },
  { label: "Inventory",  icon: Package,    to: "/inventory",       cls: "bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400"   },
  { label: "Invoices",   icon: FileText,   to: "/invoices",        cls: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"           },
  { label: "Payments",   icon: CreditCard, to: "/payments",        cls: "bg-pink-50 dark:bg-pink-900/20 text-pink-500 dark:text-pink-400"           },
  { label: "Reports",    icon: BarChart2,  to: "/reports/revenue", cls: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"   },
];

/* ─── Dashboard ──────────────────────────────────────────────────────────── */
const Dashboard = () => {
  const { user }          = useAuth();
  const { formatDate, t } = useSystem();
  const navigate          = useNavigate();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  /* Chart controls */
  const [chartMetric, setChartMetric] = useState("revenue"); // "revenue" | "orders"
  const [chartPeriod, setChartPeriod] = useState(12);        // 3 | 6 | 12

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get("/dashboard/overview");
      setData(res);
    } catch {
      try {
        const { data: s } = await api.get("/dashboard/stats");
        setData({
          kpi: {
            total_revenue: s.revenue || 0, total_orders: s.orders || 0,
            pending_orders: 0, completed_orders: 0,
            customers: s.customers || 0, products: s.products || 0,
            employees: s.employees || 0,
            revenue_this_month: 0, revenue_last_month: 0,
            orders_this_month: 0, orders_last_month: 0,
          },
          monthly: [], statusBreakdown: [], recentOrders: [], lowStock: [], categories: [],
        });
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const kpi      = data?.kpi             || {};
  const monthly  = data?.monthly         || [];
  const statuses = data?.statusBreakdown || [];
  const recent   = data?.recentOrders    || [];
  const lowStock = data?.lowStock        || [];
  const cats     = data?.categories      || [];

  /* Derived */
  const statusTotal    = statuses.reduce((s, r) => s + r.count, 0);
  const completionRate = kpi.total_orders > 0
    ? Math.round((kpi.completed_orders / kpi.total_orders) * 100) : 0;
  const avgOrderValue  = kpi.total_orders > 0
    ? kpi.total_revenue / kpi.total_orders : 0;

  /* Filtered chart data based on period selector */
  const chartData = monthly.slice(-chartPeriod);

  /* Alert counts */
  const alertCount = (kpi.pending_orders || 0) + lowStock.filter(p => p.stock === 0).length;

  /* Header strings */
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr   = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const monthName = new Date().toLocaleString("en-US", { month: "long" });

  /* Chart metric display helpers */
  const metricLabel   = chartMetric === "revenue" ? "Revenue" : "Orders";
  const currentMetric = chartMetric === "revenue"
    ? fmtSm(kpi.revenue_this_month || 0)
    : (kpi.orders_this_month ?? 0);
  const prevMetric    = chartMetric === "revenue"
    ? kpi.revenue_last_month : kpi.orders_last_month;
  const prevDisplay   = chartMetric === "revenue"
    ? fmtSm(kpi.revenue_last_month || 0)
    : (kpi.orders_last_month ?? 0);

  return (
    <div className="space-y-5 pb-6">

      {/* ── 1. Header ───────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50/60 via-white to-indigo-50/50 dark:from-violet-900/10 dark:via-transparent dark:to-indigo-900/10 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 via-purple-400 to-indigo-500" />
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-violet-100/40 dark:bg-violet-800/10 pointer-events-none" />
        <div className="absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-indigo-100/30 dark:bg-indigo-800/10 pointer-events-none" />
        <div className="relative px-6 py-5 flex flex-wrap items-center justify-between gap-y-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                {greeting}, {user?.name?.split(" ")[0] || "there"} 👋
              </h1>
              {user?.company_name && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold
                  px-2 py-0.5 rounded-lg bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700/50 text-violet-700 dark:text-violet-300">
                  <Building2 size={10}/>
                  {/^aqred$/i.test(user.company_name) ? "Aqred" : user.company_name}
                </span>
              )}
              {!loading && alertCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold
                  px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 text-amber-700 dark:text-amber-400">
                  <AlertTriangle size={9}/> {alertCount} alert{alertCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => navigate("/orders", { state: { openCreate: true } })}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white
                text-sm font-semibold rounded-xl hover:bg-violet-700 active:scale-95 transition-all shadow-sm shadow-violet-200 dark:shadow-violet-900/40">
              <Plus size={14}/> New Order
            </button>
            <button onClick={load} title="Refresh data"
              className="p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl
                text-gray-400 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all active:scale-95">
              <RefreshCw size={15} className={loading ? "animate-spin text-violet-500" : ""}/>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Needs Attention banner ────────────────────────────────────── */}
      {!loading && alertCount > 0 && (
        <div className="relative flex items-start gap-3 px-4 py-3 overflow-hidden
          bg-gradient-to-r from-amber-50 to-amber-50/50 dark:from-amber-900/10 dark:to-transparent
          border border-amber-200/70 dark:border-amber-800/40 rounded-2xl">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-amber-400 to-amber-600 rounded-l-2xl" />
          <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ml-1">
            <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400"/>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide leading-none mb-1.5">
              Needs your attention
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {kpi.pending_orders > 0 && (
                <Link to="/orders"
                  className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 font-medium flex items-center gap-1 transition-colors">
                  <ShoppingCart size={11}/>
                  {kpi.pending_orders} pending order{kpi.pending_orders !== 1 ? "s" : ""} waiting for review
                  <ArrowRight size={10}/>
                </Link>
              )}
              {lowStock.filter(p => p.stock === 0).length > 0 && (
                <Link to="/inventory"
                  className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 font-medium flex items-center gap-1 transition-colors">
                  <Package size={11}/>
                  {lowStock.filter(p => p.stock === 0).length} product{lowStock.filter(p => p.stock === 0).length !== 1 ? "s" : ""} out of stock
                  <ArrowRight size={10}/>
                </Link>
              )}
              {lowStock.filter(p => p.stock > 0).length > 0 && (
                <Link to="/inventory"
                  className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 font-medium flex items-center gap-1 transition-colors">
                  <AlertTriangle size={11}/>
                  {lowStock.filter(p => p.stock > 0).length} product{lowStock.filter(p => p.stock > 0).length !== 1 ? "s" : ""} low on stock
                  <ArrowRight size={10}/>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. KPI cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {loading ? Array.from({ length: 6 }).map((_, i) => <KPICardSkeleton key={i}/>) : (
          <>
            <KPICard icon={DollarSign}  label="Total Revenue"   value={fmtSm(kpi.total_revenue)}   to="/reports/revenue"
              iconCls="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
              accentCls="bg-gradient-to-r from-blue-400 to-blue-600"
              curr={kpi.revenue_this_month} prev={kpi.revenue_last_month} sub="Report"/>
            <KPICard icon={ShoppingCart} label="Total Orders"   value={kpi.total_orders ?? 0}      to="/orders"
              iconCls="bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400"
              accentCls="bg-gradient-to-r from-violet-400 to-violet-600"
              curr={kpi.orders_this_month} prev={kpi.orders_last_month} sub="Orders"/>
            <KPICard icon={Users}        label="Customers"      value={kpi.customers ?? 0}          to="/customers"
              iconCls="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
              accentCls="bg-gradient-to-r from-emerald-400 to-emerald-600" sub="Manage"/>
            <KPICard icon={Package}      label="Products"       value={kpi.products ?? 0}           to="/products"
              iconCls="bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400"
              accentCls="bg-gradient-to-r from-orange-400 to-orange-500" sub="Catalogue"/>
            <KPICard icon={UserCheck}    label="Employees"      value={kpi.employees ?? 0}          to="/staff"
              iconCls="bg-pink-50 dark:bg-pink-900/20 text-pink-500 dark:text-pink-400"
              accentCls="bg-gradient-to-r from-pink-400 to-pink-500" sub="Staff"/>
            <KPICard icon={Clock}        label="Pending Orders" value={kpi.pending_orders ?? 0}     to="/orders"
              iconCls="bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400"
              accentCls="bg-gradient-to-r from-amber-400 to-amber-500" sub="Review"/>
          </>
        )}
      </div>

      {/* ── 4. Revenue / Orders Trend + Order Status ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Trend chart — 2/3 */}
        <div className="lg:col-span-2">
          <Section
            title={t(metricLabel + " Trend")}
            subtitle={`${chartPeriod === 12 ? "12-month" : chartPeriod === 6 ? "6-month" : "3-month"} performance`}
            action={t("Full report")} to="/reports/revenue"
            headerRight={
              <div className="flex items-center gap-1.5">
                {/* Metric toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200/70 dark:border-gray-700">
                  {[["revenue", "$"], ["orders", "#"]].map(([m, lbl]) => (
                    <button key={m} onClick={() => setChartMetric(m)}
                      className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                        chartMetric === m
                          ? "bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-300 shadow-sm"
                          : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      }`}>{lbl}</button>
                  ))}
                </div>
                {/* Period tabs */}
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200/70 dark:border-gray-700">
                  {[3, 6, 12].map((p) => (
                    <button key={p} onClick={() => setChartPeriod(p)}
                      className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                        chartPeriod === p
                          ? "bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-300 shadow-sm"
                          : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      }`}>{p}M</button>
                  ))}
                </div>
              </div>
            }
          >
            <div className="px-5 pt-4 pb-5">
              {loading ? (
                <div className="h-52 bg-gray-50 dark:bg-gray-800 rounded-xl animate-pulse"/>
              ) : monthly.length === 0 ? (
                <Empty icon={TrendingUp} text="Trend data will appear once orders are placed."/>
              ) : (
                <>
                  {/* Current month headline */}
                  <div className="flex items-center gap-3 mb-4">
                    <div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                        {chartMetric === "revenue" ? fmtSm(kpi.revenue_this_month || 0) : (kpi.orders_this_month ?? 0)}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{monthName}</p>
                    </div>
                    <TrendBadge curr={currentMetric} prev={prevMetric}/>
                    {prevMetric > 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        vs {prevDisplay} last month
                      </p>
                    )}
                    {/* Avg order value pill */}
                    {chartMetric === "revenue" && avgOrderValue > 0 && (
                      <div className="ml-auto hidden sm:flex items-center gap-1.5 px-2.5 py-1
                        bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">Avg order</span>
                        <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{fmtSm(avgOrderValue)}</span>
                      </div>
                    )}
                  </div>

                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData} margin={{ top: 2, right: 4, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#7c3aed" stopOpacity={0.28}/>
                          <stop offset="55%"  stopColor="#7c3aed" stopOpacity={0.08}/>
                          <stop offset="100%" stopColor="#7c3aed" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:stroke-gray-800"/>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}/>
                      <YAxis
                        tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={44}
                        tickFormatter={chartMetric === "revenue" ? fmtSm : (v) => v}
                      />
                      <Tooltip content={<ChartTooltip formatter={(v, n) => [
                        chartMetric === "revenue" ? fmt(v) : v,
                        t(n),
                      ]}/>}/>
                      <Area
                        type="monotone"
                        dataKey={chartMetric}
                        name={chartMetric === "revenue" ? "Revenue" : "Orders"}
                        stroke="#7c3aed" fill="url(#areaGrad)" strokeWidth={2.5}
                        dot={false} activeDot={{ r: 4, fill: "#7c3aed", stroke: "#fff", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>
          </Section>
        </div>

        {/* Order status — 1/3 */}
        <Section
          title={t("Order Status")}
          subtitle={`${statusTotal} orders total`}
          action={t("View orders")} to="/orders"
        >
          <div className="px-5 py-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-1.5 animate-pulse">
                    <div className="flex justify-between">
                      <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded"/>
                      <div className="h-3 w-8 bg-gray-100 dark:bg-gray-800 rounded"/>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full"/>
                  </div>
                ))}
              </div>
            ) : statuses.length === 0 ? (
              <Empty icon={ShoppingCart} text="No orders yet."/>
            ) : (
              <div className="space-y-3.5">
                {statuses.map((s) => {
                  const m    = STATUS[s.status] || STATUS.Pending;
                  const Icon = m.icon;
                  const pct  = statusTotal > 0 ? Math.round((s.count / statusTotal) * 100) : 0;
                  return (
                    <Link key={s.status} to="/orders" className="block group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${m.bg}`}>
                            <Icon size={11} className={m.text}/>
                          </span>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300
                            group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                            {t(s.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{s.count}</span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 w-7 text-right">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${m.hex}cc, ${m.hex}88)` }}/>
                      </div>
                    </Link>
                  );
                })}

                {kpi.total_orders > 0 && (
                  <div className="pt-3 border-t border-gray-50 dark:border-gray-800/60 space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Completion rate</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{completionRate}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                          style={{ width: `${completionRate}%` }}/>
                      </div>
                    </div>
                    {avgOrderValue > 0 && (
                      <div className="flex items-center justify-between py-2 px-3
                        bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Avg order value</span>
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{fmtSm(avgOrderValue)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* ── 5. Recent Orders + Low Stock ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <Section title={t("Recent Orders")} action={t("View all")} to="/orders">
          {loading ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-xl flex-shrink-0"/>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 bg-gray-100 dark:bg-gray-800 rounded"/>
                    <div className="h-2.5 w-20 bg-gray-100 dark:bg-gray-800 rounded"/>
                  </div>
                  <div className="text-right space-y-1.5">
                    <div className="h-3 w-14 bg-gray-100 dark:bg-gray-800 rounded"/>
                    <div className="h-2.5 w-16 bg-gray-100 dark:bg-gray-800 rounded"/>
                  </div>
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <Empty icon={ShoppingCart} text="No orders yet. Create your first order."/>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {recent.map((o) => {
                const m    = STATUS[o.status] || STATUS.Pending;
                const Icon = m.icon;
                return (
                  <Link key={o.id} to="/orders"
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${m.bg}`}>
                      <Icon size={14} className={m.text}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate
                        group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {o.customer_name || "Unknown Customer"}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        #{o.id} · {o.item_count} item{o.item_count !== 1 ? "s" : ""} · {formatDate ? formatDate(o.order_date) : new Date(o.order_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{fmt(o.total)}</p>
                      <span className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${m.bg} ${m.text}`}>
                        {t(o.status)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Section>

        <Section title={t("Low Stock Alerts")} action={t("View inventory")} to="/inventory"
          subtitle={lowStock.length > 0 ? `${lowStock.length} product${lowStock.length !== 1 ? "s" : ""} need restocking` : undefined}>
          {loading ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-xl flex-shrink-0"/>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded"/>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full"/>
                  </div>
                  <div className="h-3 w-8 bg-gray-100 dark:bg-gray-800 rounded"/>
                </div>
              ))}
            </div>
          ) : lowStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center mb-2.5">
                <CheckCircle size={18} className="text-emerald-500"/>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">All products well-stocked</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">No items below reorder point</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {lowStock.map((p) => {
                const out      = p.stock === 0;
                const critical = !out && p.stock <= Math.floor(p.reorder_point * 0.5);
                const pct      = p.reorder_point > 0 ? Math.min((p.stock / p.reorder_point) * 100, 100) : 0;
                const barCls   = out ? "bg-red-500" : critical ? "bg-orange-500" : "bg-amber-400";
                const valCls   = out ? "text-red-500" : critical ? "text-orange-500" : "text-amber-500";
                const bgIcon   = out ? "bg-red-50 dark:bg-red-900/20" : "bg-amber-50 dark:bg-amber-900/20";
                return (
                  <Link key={p.id} to="/inventory"
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${bgIcon}`}>
                      <AlertTriangle size={14} className={valCls}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate
                          group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                          {p.name}
                        </p>
                        {out && (
                          <span className="flex-shrink-0 text-[9px] font-bold px-1 py-0.5 rounded
                            bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 uppercase tracking-wide">
                            Out
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${barCls}`}
                            style={{ width: `${pct}%` }}/>
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 truncate" style={{ maxWidth: 72 }}>
                          {p.category || "Uncategorised"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-1">
                      <span className={`text-sm font-bold ${valCls}`}>{p.stock}</span>
                      <p className="text-[11px] text-gray-300 dark:text-gray-600">/ {p.reorder_point} min</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      {/* ── 6. Product Categories + Quick Access ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Product categories — visible when data exists */}
        {(loading || cats.length > 0) && (
          <Section title="Product Categories" subtitle="Inventory by category" action="View products" to="/products">
            <div className="px-5 py-4">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-1.5 animate-pulse">
                      <div className="flex justify-between">
                        <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded"/>
                        <div className="h-3 w-6 bg-gray-100 dark:bg-gray-800 rounded"/>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full"/>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {cats.map((c, i) => {
                    const maxVal = Math.max(...cats.map(x => x.value));
                    const pct    = maxVal > 0 ? Math.round((c.value / maxVal) * 100) : 0;
                    const total  = cats.reduce((a, x) => a + x.value, 0);
                    const share  = total > 0 ? Math.round((c.value / total) * 100) : 0;
                    return (
                      <div key={c.name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }}/>
                            <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{c.value}</span>
                            <span className="text-[10px] text-gray-300 dark:text-gray-600 w-7 text-right">{share}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: CAT_COLORS[i % CAT_COLORS.length] }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Quick Access — spans remaining cols */}
        <div className={cats.length > 0 || loading ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 h-full">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">Quick Access</h3>
            <div className="grid grid-cols-3 gap-3">
              {SHORTCUTS.map(({ label, icon: Icon, to, cls }) => (
                <Link key={to} to={to}
                  className="group flex flex-col items-center gap-2.5 p-4 rounded-xl
                    border border-gray-100 dark:border-gray-800
                    hover:border-violet-200 dark:hover:border-violet-700/50
                    hover:shadow-md hover:-translate-y-0.5
                    transition-all duration-200 text-center active:scale-95">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${cls}`}>
                    <Icon size={20}/>
                  </div>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400
                    group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-none">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
