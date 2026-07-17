import { useState, useEffect, useCallback } from "react";
import {
  FileText, Search, Download, X, CheckCircle, Clock,
  AlertCircle, Printer, DollarSign, Eye, Building2, MinusCircle, Mail,
} from "lucide-react";
import { getSales, getSaleById, updateSaleStatus } from "../services/salesService";
import { createPayment } from "../services/paymentsService";
import { exportToCSV } from "../utils/exportCSV";
import { useSystem } from "../context/SystemContext";
import { useAuth } from "../context/AuthContext";
import EmptyState from "../components/UI/EmptyState";
import SkeletonLoader from "../components/UI/SkeletonLoader";
import Pagination from "../components/UI/Pagination";
import useEscapeKey from "../hooks/useEscapeKey";

// ─── helpers ────────────────────────────────────────────────────────────────
// Invoice status (Paid/Partially Paid/Unpaid/Overdue/Cancelled) is now computed
// server-side (see salesModel.js INVOICE_BASE_CTE) so it can be filtered/sorted
// in SQL — the row already arrives with `invoice_status` set.

const statusConfig = {
  Paid:             { icon: CheckCircle,  cls: "bg-green-50 dark:bg-emerald-900/20 text-green-600 dark:text-emerald-400 border-green-200 dark:border-emerald-800" },
  "Partially Paid": { icon: Clock,        cls: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  Unpaid:           { icon: Clock,        cls: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  Overdue:          { icon: AlertCircle,  cls: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800" },
  Cancelled:        { icon: MinusCircle,  cls: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700" },
};

const FILTERS = ["All", "Paid", "Partially Paid", "Unpaid", "Overdue"];

const canPay = (status) => ["Unpaid", "Overdue", "Partially Paid"].includes(status);

// ─── print helper ────────────────────────────────────────────────────────────
// Renders a standalone printable document in a new window - deliberately kept
// as plain light-on-white HTML regardless of the app's theme, since it's meant
// to be printed on paper, not viewed on screen.

const printInvoice = (inv, items, companyName, formatCurrency) => {
  const displayItems = items.length > 0
    ? items
    : [{ product_name: "Products / Services", quantity: 1, unit_price: inv.amount, _fallback: true }];

  const subtotal   = displayItems.reduce((s, it) => s + (parseFloat(it.unit_price) || 0) * (parseInt(it.quantity) || 0), 0);
  const amountPaid = parseFloat(inv.amount_paid || 0);
  const balance    = Math.max(subtotal - amountPaid, 0);

  const statusColors = {
    Paid: "#16a34a", "Partially Paid": "#2563eb", Unpaid: "#d97706", Overdue: "#dc2626", Cancelled: "#6b7280",
  };
  const statusColor = statusColors[inv.invoiceStatus] || "#6b7280";

  const lineRows = displayItems.map((it) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6">${it.product_name || "—"}${it._fallback ? ' <span style="font-size:10px;color:#9ca3af;font-style:italic">(line items not recorded)</span>' : ""}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:center">${it.quantity || 0}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:right">${formatCurrency(it.unit_price || 0)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:right">${formatCurrency((it.unit_price || 0) * (it.quantity || 0))}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${inv.invoiceId}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#111827;background:#fff;padding:40px}
    @media print{body{padding:0}}
  </style>
</head>
<body>
  <div style="background:#4f46e5;padding:28px 36px;border-radius:10px 10px 0 0;display:flex;justify-content:space-between;align-items:center">
    <div>
      <div style="color:#fff;font-size:22px;font-weight:700">${companyName || "Aqred"}</div>
      <div style="color:#c7d2fe;font-size:12px;margin-top:4px">Business Management System</div>
    </div>
    <div style="text-align:right">
      <div style="color:#fff;font-size:28px;font-weight:800;letter-spacing:2px">INVOICE</div>
      <div style="color:#c7d2fe;font-size:13px;margin-top:4px">${inv.invoiceId}</div>
    </div>
  </div>
  <div style="background:#f8f9ff;border:1px solid #e0e7ff;border-top:none;padding:20px 36px;display:flex;justify-content:space-between;border-radius:0 0 10px 10px;margin-bottom:28px">
    <div>
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Bill To</div>
      <div style="font-weight:600;font-size:15px">${inv.customer_name || "—"}</div>
      <div style="color:#6b7280;font-size:12px;margin-top:2px">${inv.customer_email || ""}</div>
    </div>
    <div style="text-align:right;display:flex;gap:32px">
      <div>
        <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Issue Date</div>
        <div style="font-weight:600">${inv.issued}</div>
      </div>
      <div>
        <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Due Date</div>
        <div style="font-weight:600">${inv.dueDisplay}</div>
      </div>
      <div>
        <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Status</div>
        <div style="font-weight:700;color:${statusColor}">${inv.invoiceStatus}</div>
      </div>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <thead>
      <tr style="background:#f9fafb">
        <th style="padding:10px 12px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb">Description</th>
        <th style="padding:10px 12px;text-align:center;font-size:11px;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb">Qty</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb">Unit Price</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e5e7eb">Amount</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
  </table>
  <div style="display:flex;justify-content:flex-end;margin-bottom:32px">
    <div style="min-width:260px">
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6">
        <span style="color:#6b7280">Subtotal</span><span style="font-weight:500">${formatCurrency(subtotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6">
        <span style="color:#6b7280">Tax (0%)</span><span style="font-weight:500">${formatCurrency(0)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6">
        <span style="font-weight:700;font-size:15px">Total</span><span style="font-weight:800;font-size:17px;color:#4f46e5">${formatCurrency(subtotal)}</span>
      </div>
      ${amountPaid > 0 ? `
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6">
        <span style="color:#16a34a">Amount Paid</span><span style="font-weight:600;color:#16a34a">-${formatCurrency(amountPaid)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px 0;margin-top:2px">
        <span style="font-weight:700;font-size:15px">Balance Due</span><span style="font-weight:800;font-size:17px;color:${balance > 0 ? "#dc2626" : "#16a34a"}">${formatCurrency(balance)}</span>
      </div>` : ""}
    </div>
  </div>
  ${inv.notes ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin-bottom:24px"><span style="font-weight:600;color:#92400e">Note: </span><span style="color:#78350f">${inv.notes}</span></div>` : ""}
  <div style="border-top:2px solid #e5e7eb;padding-top:20px;display:flex;justify-content:space-between;align-items:center">
    <div style="color:#6b7280;font-size:12px">Thank you for your business. Please make payment by <strong>${inv.dueDisplay}</strong>.</div>
    <div style="color:#9ca3af;font-size:11px">${inv.invoiceId} · Generated by Aqred</div>
  </div>
</body>
</html>`;

  const w = window.open("", "_blank", "width=860,height=1100");
  w.document.open();
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 400);
};

// ─── Invoice Preview Modal ───────────────────────────────────────────────────

const InvoiceModal = ({ inv, onClose, onMarkPaid, markingId, formatCurrency, companyName, onPrint, onEmail, t }) => {
  const [items, setItems]             = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    getSaleById(inv.id)
      .then((res) => setItems(res.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoadingItems(false));
  }, [inv.id]);

  const displayItems = items.length > 0
    ? items
    : [{ product_name: "Products / Services", quantity: 1, unit_price: inv.amount, _fallback: true }];

  const subtotal   = displayItems.reduce((s, it) => s + (parseFloat(it.unit_price) || 0) * (parseInt(it.quantity) || 0), 0);
  const amountPaid = parseFloat(inv.amount_paid || 0);
  const balance    = Math.max(subtotal - amountPaid, 0);

  const cfg  = statusConfig[inv.invoiceStatus] || statusConfig.Unpaid;
  const Icon = cfg.icon;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t("Invoice Preview")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onPrint(inv, items)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95"
            >
              <Printer size={13} /> {t("Print / Save PDF")}
            </button>
            <button
              onClick={() => onEmail(inv, items)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 active:scale-95"
            >
              <Mail size={13} /> {t("Send Email")}
            </button>
            {canPay(inv.invoiceStatus) && (
              <button
                onClick={() => onMarkPaid(inv)}
                disabled={markingId === inv.id}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 active:scale-95"
              >
                <DollarSign size={13} />
                {inv.invoiceStatus === "Partially Paid" ? t("Pay Balance") : t("Mark as Paid")}
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Header band */}
          <div className="bg-violet-600 rounded-xl p-6 flex justify-between items-start mb-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 size={18} className="text-violet-200" />
                <span className="text-white font-bold text-lg">{companyName || "Aqred"}</span>
              </div>
              <p className="text-violet-300 text-xs">Business Management System</p>
            </div>
            <div className="text-right">
              <p className="text-white text-3xl font-extrabold tracking-widest">INVOICE</p>
              <p className="text-violet-300 text-sm mt-0.5 font-mono">{inv.invoiceId}</p>
            </div>
          </div>

          {/* Meta strip */}
          <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/40 border-t-0 rounded-b-xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">{t("Bill To")}</p>
              <p className="font-semibold text-gray-800 dark:text-gray-100">{inv.customer_name || "—"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{inv.customer_email || ""}</p>
            </div>
            <div className="flex flex-wrap gap-4 sm:gap-8 sm:text-right">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">{t("Issue Date")}</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{inv.issued}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">{t("Due Date")}</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{inv.dueDisplay}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">{t("Status")}</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${cfg.cls}`}>
                  <Icon size={10} /> {t(inv.invoiceStatus)}
                </span>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="mb-6 overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b-2 border-gray-100 dark:border-gray-800">
                  {[t("Description"), t("Qty"), t("Unit Price"), t("Amount")].map((h, i) => (
                    <th key={h} className={`pb-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 ${i === 0 ? "text-left" : i === 1 ? "text-center" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingItems ? (
                  <tr><td colSpan={4} className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">Loading items...</td></tr>
                ) : displayItems.map((it, idx) => (
                  <tr key={idx} className="border-b border-gray-50 dark:border-gray-800/60">
                    <td className="py-3 text-sm text-gray-800 dark:text-gray-200">
                      {it.product_name || "—"}
                      {it._fallback && <span className="ml-2 text-[10px] text-gray-400 dark:text-gray-500 italic">line items not recorded</span>}
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400 text-center">{it.quantity}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400 text-right">{formatCurrency(it.unit_price || 0)}</td>
                    <td className="py-3 text-sm font-medium text-gray-800 dark:text-gray-200 text-right">
                      {formatCurrency((it.unit_price || 0) * (it.quantity || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{t("Subtotal")}</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{t("Tax (0%)")}</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-2 border-t-2 border-gray-100 dark:border-gray-800">
                <span>{t("Total")}</span>
                <span className="text-violet-600 dark:text-violet-400 text-lg">{formatCurrency(subtotal)}</span>
              </div>
              {amountPaid > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 dark:text-emerald-400 font-medium">{t("Amount Paid")}</span>
                    <span className="text-green-600 dark:text-emerald-400 font-semibold">−{formatCurrency(amountPaid)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-gray-700 dark:text-gray-300">{t("Balance Due")}</span>
                    <span className={balance > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-emerald-400"}>
                      {formatCurrency(balance)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          {inv.notes && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800 dark:text-amber-300">
              <span className="font-semibold">Note: </span>{inv.notes}
            </div>
          )}

          {/* Footer */}
          <div className="border-t-2 border-gray-100 dark:border-gray-800 pt-4 flex justify-between items-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Thank you for your business. Please make payment by{" "}
              <span className="font-semibold text-gray-600 dark:text-gray-300">{inv.dueDisplay}</span>.
            </p>
            <p className="text-[10px] text-gray-300 dark:text-gray-600 font-mono">{inv.invoiceId} · Generated by Aqred</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Toast ───────────────────────────────────────────────────────────────────

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${type === "success" ? "bg-green-50 dark:bg-emerald-900/30 text-green-700 dark:text-emerald-300 border border-green-100 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800"}`}>
    <CheckCircle size={16} /> {msg}
    <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
  </div>
);

// ─── Main Page ───────────────────────────────────────────────────────────────

const Invoices = () => {
  const { formatCurrency, formatDate, t } = useSystem();
  const { user } = useAuth();
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter]         = useState("All");
  const [toast, setToast]           = useState(null);
  const [markingId, setMarkingId]   = useState(null);
  const [previewInv, setPreviewInv] = useState(null);

  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(25);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats]           = useState({ total: 0, totalPaid: 0, totalPartial: 0, totalOverdue: 0 });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Debounce search ── */
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  /* ── Reset to page 1 whenever filter/search changes ── */
  useEffect(() => { setPage(1); }, [debouncedSearch, filter]);

  useEscapeKey(!!previewInv, () => setPreviewInv(null));

  const load = useCallback(async () => {
    try {
      const res = await getSales({ page, limit: pageSize, search: debouncedSearch, status: filter });
      if (res.data.data.length === 0 && res.data.total > 0 && page > 1) {
        setPage(res.data.totalPages);
        return;
      }
      setOrders(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
      setStats(res.data.stats);
    } catch {
      showToast("Failed to load invoices", "error");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, filter]);

  useEffect(() => { load(); }, [load]);

  const invoices = orders.map((o) => ({
    ...o,
    invoiceId:     `INV-${String(o.id).padStart(4, "0")}`,
    invoiceStatus: o.invoice_status,
    issued:        formatDate(o.order_date || o.created_at),
    dueDisplay:    formatDate(o.due_date),   // always set by backend (COALESCE +30d)
    amount:        parseFloat(o.total || 0),
    amount_paid:   parseFloat(o.amount_paid || 0),
  }));

  /* ── Current page is already filtered/sorted server-side ── */
  const filtered = invoices;

  /* ── Stats (server-computed over the full unfiltered dataset for this company) ── */
  const totalPaid    = stats.totalPaid;
  const totalPartial = stats.totalPartial;
  const totalOverdue = stats.totalOverdue;

  const handleMarkPaid = async (inv) => {
    setMarkingId(inv.id);
    const balance = Math.max(inv.amount - inv.amount_paid, 0);
    try {
      await createPayment({
        order_id: inv.id,
        amount:   balance || inv.amount,
        method:   "Bank Transfer",
        status:   "Completed",
        notes:    `Invoice ${inv.invoiceId} marked as paid`,
      });
      // Also update order status to Completed
      await updateSaleStatus(inv.id, "Completed");
      showToast(`${inv.invoiceId} marked as Paid`);
      setPreviewInv(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to mark as paid", "error");
    } finally {
      setMarkingId(null);
    }
  };

  const handlePrint = (inv, items) => printInvoice(inv, items, user?.company_name, formatCurrency);

  const handleSendEmail = (inv, items = []) => {
    const company = user?.company_name || "Aqred";
    const subject = encodeURIComponent(`Invoice ${inv.invoiceId} from ${company}`);
    const itemLines = items.length > 0
      ? items.map((it) =>
          `  • ${it.product_name}: ${it.quantity} × ${formatCurrency(it.unit_price || 0)} = ${formatCurrency((it.unit_price || 0) * (it.quantity || 0))}`
        ).join("\n")
      : `  Total: ${formatCurrency(inv.amount)}`;
    const balance = Math.max(inv.amount - (inv.amount_paid || 0), 0);
    const body = encodeURIComponent(
      `Dear ${inv.customer_name || "Customer"},\n\n` +
      `Please find your invoice details below:\n\n` +
      `Invoice Number : ${inv.invoiceId}\n` +
      `Issue Date     : ${inv.issued}\n` +
      `Due Date       : ${inv.dueDisplay}\n` +
      `Status         : ${inv.invoiceStatus}\n\n` +
      `Items:\n${itemLines}\n\n` +
      `Invoice Total  : ${formatCurrency(inv.amount)}\n` +
      (inv.amount_paid > 0
        ? `Amount Paid    : ${formatCurrency(inv.amount_paid)}\nBalance Due    : ${formatCurrency(balance)}\n`
        : "") +
      `\nPlease make payment by ${inv.dueDisplay}.\n\n` +
      `Thank you for your business.\n\nBest regards,\n${company}`
    );
    window.location.href = `mailto:${inv.customer_email || ""}?subject=${subject}&body=${body}`;
  };

  /* ── Export all filtered (re-fetches the whole matching set, not just the current page) ── */
  const handleExportCSV = async () => {
    try {
      const res = await getSales({ limit: Math.max(total, 1), search: debouncedSearch, status: filter });
      const rows = res.data.data.map((o) => ({
        invoiceId:   `INV-${String(o.id).padStart(4, "0")}`,
        customer_name: o.customer_name,
        amount:      parseFloat(o.total || 0),
        amount_paid: parseFloat(o.amount_paid || 0),
        item_count:  o.item_count,
        issued:      formatDate(o.order_date || o.created_at),
        dueDisplay:  formatDate(o.due_date),
        invoiceStatus: o.invoice_status,
      }));
      exportToCSV(
        rows.map((i) => ({
          Invoice:        i.invoiceId,
          Customer:       i.customer_name || "",
          Amount:         i.amount.toFixed(2),
          "Amount Paid":  i.amount_paid.toFixed(2),
          "Balance Due":  Math.max(i.amount - i.amount_paid, 0).toFixed(2),
          Items:          i.item_count || 0,
          Issued:         i.issued,
          "Due Date":     i.dueDisplay,
          Status:         i.invoiceStatus,
        })),
        "invoices"
      );
    } catch { showToast("Export failed.", "error"); }
  };

  if (loading) return <SkeletonLoader type="page" statCount={3} rows={5} cols={5} />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-y-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("Invoices")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("Generated automatically from Sales orders with at least one item")}</p>
        </div>
        <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[
          { label: t("Total Collected"),      value: totalPaid,    color: "text-green-600 dark:text-emerald-400" },
          { label: t("Partially Paid (Due)"), value: totalPartial, color: "text-blue-600 dark:text-blue-400" },
          { label: t("Overdue"),              value: totalOverdue, color: "text-red-600 dark:text-red-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative w-full sm:flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search by invoice or customer..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
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
              {[t("Invoice"), t("Customer"), t("Total"), t("Paid"), t("Balance"), t("Items"), t("Issued"), t("Due Date"), t("Status"), t("Actions")].map((h) => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv, idx) => {
              const cfg  = statusConfig[inv.invoiceStatus] || statusConfig.Unpaid;
              const Icon = cfg.icon;
              const balance = Math.max(inv.amount - inv.amount_paid, 0);
              return (
                <tr
                  key={inv.id}
                  onClick={() => setPreviewInv(inv)}
                  className={`cursor-pointer transition-colors hover:bg-violet-50/40 dark:hover:bg-violet-900/10 ${idx !== filtered.length - 1 ? "border-b border-gray-50 dark:border-gray-800/60" : ""}`}
                >
                  <td className="px-4 py-4 text-xs font-mono text-violet-600 dark:text-violet-400">{inv.invoiceId}</td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{inv.customer_name || "—"}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{inv.customer_email || ""}</p>
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(inv.amount)}</td>
                  <td className="px-4 py-4 text-sm text-green-600 dark:text-emerald-400 font-medium">{formatCurrency(inv.amount_paid)}</td>
                  <td className="px-4 py-4 text-sm font-medium">
                    <span className={balance > 0 ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}>{formatCurrency(balance)}</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{inv.item_count} item{inv.item_count !== 1 ? "s" : ""}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{inv.issued}</td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{inv.dueDisplay}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${cfg.cls}`}>
                      <Icon size={11} /> {t(inv.invoiceStatus)}
                    </span>
                  </td>
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPreviewInv(inv)} title="Preview" className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleSendEmail(inv)} title="Send Email" className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                        <Mail size={14} />
                      </button>
                      {canPay(inv.invoiceStatus) && (
                        <button
                          onClick={() => handleMarkPaid(inv)}
                          disabled={markingId === inv.id}
                          title="Mark as Paid"
                          className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-emerald-400 hover:bg-green-50 dark:hover:bg-emerald-900/20 rounded-lg disabled:opacity-50"
                        >
                          <DollarSign size={14} />
                        </button>
                      )}
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
            icon={FileText}
            title={t("No invoices found")}
            description={filter === "All" ? t("Invoices are auto-generated from sales orders with products.") : t("No invoices match the selected filter.")}
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
        itemLabel="invoices"
      />

      {previewInv && (
        <InvoiceModal
          inv={previewInv}
          onClose={() => setPreviewInv(null)}
          onMarkPaid={handleMarkPaid}
          markingId={markingId}
          formatCurrency={formatCurrency}
          companyName={user?.company_name}
          onPrint={handlePrint}
          onEmail={handleSendEmail}
          t={t}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Invoices;
