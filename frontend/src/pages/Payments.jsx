import { useState, useEffect, useCallback } from "react";
import { CreditCard, Search, CheckCircle, Clock, XCircle, DollarSign, TrendingUp, AlertCircle, Plus, X, Download, Trash2, RefreshCw, Printer, RotateCcw } from "lucide-react";
import EmptyState from "../components/UI/EmptyState";
import SkeletonLoader from "../components/UI/SkeletonLoader";
import Pagination from "../components/UI/Pagination";
import { getPayments, createPayment, updatePayment, deletePayment } from "../services/paymentsService";
import { getSales } from "../services/salesService";
import { exportToCSV } from "../utils/exportCSV";
import { useSystem } from "../context/SystemContext";
import { useAuth } from "../context/AuthContext";

const statusConfig = {
  Completed: { icon: CheckCircle, cls: "bg-green-50 dark:bg-emerald-900/20 text-green-600 dark:text-emerald-400" },
  Pending:   { icon: Clock,       cls: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" },
  Failed:    { icon: XCircle,     cls: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" },
  Refunded:  { icon: RotateCcw,   cls: "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400" },
  Cancelled: { icon: XCircle,     cls: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400" },
};

// Renders a standalone printable receipt in a new window - deliberately kept
// as plain light-on-white HTML regardless of the app's theme, since it's meant
// to be printed on paper, not viewed on screen.
const printReceipt = (payment, formatCurrency, formatDate, companyName) => {
  const method = payment.method || "Bank Transfer";
  const status = payment.status || "Completed";
  const statusColors = { Completed: "#16a34a", Pending: "#d97706", Failed: "#dc2626", Refunded: "#7c3aed", Cancelled: "#6b7280" };

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Receipt PAY-${String(payment.id).padStart(4,"0")}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#111827;background:#fff;padding:40px}
    @media print{body{padding:0}}
  </style>
</head>
<body>
  <div style="max-width:480px;margin:0 auto">
    <!-- Header -->
    <div style="background:#4f46e5;padding:24px 28px;border-radius:10px 10px 0 0;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="color:#fff;font-size:18px;font-weight:700">${companyName || "Aqred"}</div>
        <div style="color:#c7d2fe;font-size:11px;margin-top:3px">Business Management System</div>
      </div>
      <div style="text-align:right">
        <div style="color:#fff;font-size:20px;font-weight:800;letter-spacing:1px">RECEIPT</div>
        <div style="color:#c7d2fe;font-size:12px;font-family:monospace;margin-top:3px">PAY-${String(payment.id).padStart(4,"0")}</div>
      </div>
    </div>
    <!-- Meta -->
    <div style="background:#f8f9ff;border:1px solid #e0e7ff;border-top:none;padding:18px 28px;border-radius:0 0 10px 10px;margin-bottom:24px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">Customer</div>
          <div style="font-weight:600">${payment.customer_name || "—"}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px">${payment.customer_email || ""}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">Order</div>
          <div style="font-weight:600;font-family:monospace">ORD-${String(payment.order_id).padStart(4,"0")}</div>
        </div>
        <div>
          <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">Date</div>
          <div style="font-weight:600">${formatDate(payment.payment_date || payment.created_at)}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">Status</div>
          <div style="font-weight:700;color:${statusColors[status] || "#6b7280"}">${status}</div>
        </div>
      </div>
    </div>
    <!-- Amount box -->
    <div style="border:2px solid #e5e7eb;border-radius:10px;padding:20px 28px;margin-bottom:24px">
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6">
        <span style="color:#6b7280">Payment Method</span><span style="font-weight:600">${method}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px 0;margin-top:4px">
        <span style="font-weight:700;font-size:16px">Amount Paid</span>
        <span style="font-weight:800;font-size:20px;color:#4f46e5">${formatCurrency(payment.amount)}</span>
      </div>
    </div>
    ${payment.notes ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:12px;color:#78350f"><span style="font-weight:600">Note: </span>${payment.notes}</div>` : ""}
    <!-- Footer -->
    <div style="border-top:2px solid #e5e7eb;padding-top:16px;text-align:center">
      <p style="color:#6b7280;font-size:12px">Thank you for your payment. This is your official receipt.</p>
      <p style="color:#9ca3af;font-size:10px;font-family:monospace;margin-top:6px">PAY-${String(payment.id).padStart(4,"0")} · Generated by Aqred</p>
    </div>
  </div>
</body>
</html>`;

  const w = window.open("", "_blank", "width=600,height=800");
  w.document.open();
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 400);
};

const METHOD_ICONS = { "Credit Card": "💳", "Bank Transfer": "🏦", PayPal: "🅿️", Cash: "💵" };
const METHODS = ["Bank Transfer", "Credit Card", "PayPal", "Cash"];
const FILTERS = ["All", "Completed", "Pending", "Failed"];

const BLANK_FORM = { order_id: "", amount: "", method: "Bank Transfer", status: "Completed", notes: "" };

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${type === "success" ? "bg-green-50 dark:bg-emerald-900/30 text-green-700 dark:text-emerald-300 border border-green-100 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800"}`}>
    <CheckCircle size={16} /> {msg}
    <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
  </div>
);

const Payments = () => {
  const { formatCurrency, formatDate, t } = useSystem();
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [toast, setToast]     = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(25);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats]           = useState({ total: 0, totalCompleted: 0, totalPending: 0, totalFailed: 0 });

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  /* ── Debounce search ── */
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  /* ── Reset to page 1 whenever filter/search changes ── */
  useEffect(() => { setPage(1); }, [debouncedSearch, filter]);

  const load = useCallback(async () => {
    try {
      const pRes = await getPayments({ page, limit: pageSize, search: debouncedSearch, status: filter });
      if (pRes.data.data.length === 0 && pRes.data.total > 0 && page > 1) {
        setPage(pRes.data.totalPages);
        return;
      }
      setPayments(pRes.data.data);
      setTotal(pRes.data.total);
      setTotalPages(pRes.data.totalPages);
      setStats(pRes.data.stats);
    } catch {
      showToast("Failed to load payments", "error");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, filter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    // "Record Payment" form needs the full order list for its dropdown, not just
    // one paginated page — fetch with a limit comfortably above current volumes.
    getSales({ limit: 5000 }).then(({ data }) => setOrders(data.data.filter((o) => o.status !== "Cancelled"))).catch(() => {});
  }, []);

  /* ── Current page is already filtered/sorted server-side ── */
  const filtered = payments;

  /* ── Stats (server-computed over the full unfiltered dataset for this company) ── */
  const totalCompleted = stats.totalCompleted;
  const totalPending   = stats.totalPending;
  const totalFailed    = stats.totalFailed;

  // Auto-fill amount when order selected
  const handleOrderChange = (order_id) => {
    const order = orders.find((o) => String(o.id) === String(order_id));
    setForm((f) => ({ ...f, order_id, amount: order ? parseFloat(order.total || 0).toFixed(2) : "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.order_id || !form.amount) { showToast("Order and amount are required", "error"); return; }
    setSubmitting(true);
    try {
      await createPayment({
        order_id: parseInt(form.order_id),
        amount: parseFloat(form.amount),
        method: form.method,
        status: form.status,
        notes: form.notes || null,
      });
      showToast("Payment recorded successfully!");
      setShowModal(false);
      setForm({ ...BLANK_FORM });
      load();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to record payment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (payment, newStatus) => {
    try {
      await updatePayment(payment.id, { status: newStatus, notes: payment.notes });
      showToast(`Payment status updated to ${newStatus}`);
      load();
    } catch {
      showToast("Failed to update payment", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await deletePayment(deleteId);
      showToast("Payment deleted.");
      setDeleteId(null);
      load();
    } catch {
      showToast("Failed to delete payment", "error");
      setDeleteId(null);
    }
  };

  /* ── Export all filtered (re-fetches the whole matching set, not just the current page) ── */
  const handleExport = async () => {
    try {
      const { data } = await getPayments({ limit: Math.max(total, 1), search: debouncedSearch, status: filter });
      exportToCSV(
        data.data.map((p) => ({
          "Payment ID": `PAY-${String(p.id).padStart(4, "0")}`,
          "Order/Invoice": `ORD-${String(p.order_id).padStart(4, "0")}`,
          Customer: p.customer_name || "",
          Amount: parseFloat(p.amount || 0).toFixed(2),
          Method: p.method,
          Status: p.status,
          Date: formatDate(p.payment_date || p.created_at),
          Notes: p.notes || "",
        })),
        "payments"
      );
    } catch { showToast("Export failed.", "error"); }
  };

  if (loading) return <SkeletonLoader type="page" statCount={4} rows={5} cols={6} />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-y-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("Payments")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("Track and manage all payment transactions")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all">
            <Download size={15} /> {t("Export CSV")}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 active:scale-95 transition-all"
          >
            <Plus size={16} /> {t("Record Payment")}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: t("Total Collected"), value: totalCompleted, icon: DollarSign,   color: "text-green-600 dark:text-emerald-400", bg: "bg-green-50 dark:bg-emerald-900/20" },
          { label: t("Pending"),         value: totalPending,   icon: Clock,        color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: t("Failed"),          value: totalFailed,    icon: AlertCircle,  color: "text-red-600 dark:text-red-400",   bg: "bg-red-50 dark:bg-red-900/20" },
          { label: t("Total Volume"),    value: totalCompleted + totalPending, icon: TrendingUp, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon size={17} className={color} />
              </div>
            </div>
            <p className={`text-xl font-bold ${color}`}>{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative w-full sm:flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text" placeholder="Search payments..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-1">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filter === f ? "bg-violet-600 text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
            >{t(f)}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {[t("Payment ID"), t("Order / Invoice"), t("Customer"), t("Amount"), t("Method"), t("Date"), t("Status"), t("Actions")].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, idx) => {
              const cfg = statusConfig[p.status] || statusConfig.Pending;
              const Icon = cfg.icon;
              return (
                <tr key={p.id} className={`${idx !== filtered.length - 1 ? "border-b border-gray-50 dark:border-gray-800/60" : ""} hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors`}>
                  <td className="px-5 py-4 text-xs font-mono text-violet-600 dark:text-violet-400">PAY-{String(p.id).padStart(4, "0")}</td>
                  <td className="px-5 py-4 text-xs font-mono text-gray-500 dark:text-gray-400">ORD-{String(p.order_id).padStart(4, "0")}</td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{p.customer_name || "—"}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{p.customer_email || ""}</p>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(p.amount)}</td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{METHOD_ICONS[p.method] || ""} {p.method}</td>
                  <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(p.payment_date || p.created_at)}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${cfg.cls}`}>
                      <Icon size={11} /> {t(p.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      {p.status === "Pending" && (<>
                        <button onClick={() => handleStatusUpdate(p, "Completed")} className="px-2 py-1 text-xs font-medium text-green-600 dark:text-emerald-400 bg-green-50 dark:bg-emerald-900/20 hover:bg-green-100 dark:hover:bg-emerald-900/30 rounded-lg active:scale-95">{t("Approve")}</button>
                        <button onClick={() => handleStatusUpdate(p, "Cancelled")} className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg active:scale-95">{t("Cancel")}</button>
                      </>)}
                      {p.status === "Completed" && (
                        <button onClick={() => handleStatusUpdate(p, "Refunded")} title="Refund" className="px-2 py-1 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded-lg flex items-center gap-1 active:scale-95">
                          <RotateCcw size={12} /> {t("Refund")}
                        </button>
                      )}
                      {p.status === "Failed" && (
                        <button onClick={() => handleStatusUpdate(p, "Pending")} title="Retry" className="p-1.5 text-amber-500 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg active:scale-95">
                          <RefreshCw size={14} />
                        </button>
                      )}
                      <button onClick={() => printReceipt(p, formatCurrency, formatDate, user?.company_name)} title="Print Receipt" className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg active:scale-95">
                        <Printer size={14} />
                      </button>
                      <button onClick={() => setDeleteId(p.id)} title="Delete" className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg active:scale-95">
                        <Trash2 size={14} />
                      </button>
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
            icon={CreditCard}
            title={filtered.length === 0 && stats.total > 0 ? t("No payments match your filter.") : t("No payments yet.")}
            description={stats.total === 0 ? t("Record a payment or mark an invoice as paid to get started.") : undefined}
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
        itemLabel="payments"
      />

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white">{t("Record Payment")}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Order / Invoice")} *</label>
                <select required className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={form.order_id} onChange={(e) => handleOrderChange(e.target.value)}>
                  <option value="">Select order...</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      ORD-{String(o.id).padStart(4, "0")} — {o.customer_name || "Customer"} ({formatCurrency(o.total)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Amount")} *</label>
                  <input type="number" step="0.01" min="0" required
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Method")}</label>
                  <select className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}>
                    {METHODS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Status")}</label>
                <select className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                  <option value="Completed">{t("Completed")}</option>
                  <option value="Pending">{t("Pending")}</option>
                  <option value="Failed">{t("Failed")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("Notes")}</label>
                <input type="text" placeholder="Optional notes..."
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg active:scale-95">{t("Cancel")}</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60 active:scale-95">
                  {submitting ? t("Saving...") : t("Record Payment")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500 dark:text-red-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t("Delete Payment?")}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{t("This action cannot be undone.")}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95">{t("Cancel")}</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-95">{t("Delete")}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Payments;
