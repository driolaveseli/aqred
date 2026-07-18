const Payment = require("../models/paymentModel");
const Sales = require("../models/salesModel");
const { logEvent } = require("../utils/logger");
const { createNotification } = require("../utils/notify");

const getPayments = async (req, res) => {
  try {
    const page  = parseInt(req.query.page, 10)  || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { search = "", status = "All" } = req.query;

    const { rows, filteredTotal, stats } = await Payment.getPaged(req.user.company_id, { search, status, page, limit });

    res.json({
      data: rows,
      total: filteredTotal,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(filteredTotal / limit)),
      stats: {
        total: stats.total,
        totalCompleted: Number(stats.total_completed),
        totalPending: Number(stats.total_pending),
        totalFailed: Number(stats.total_failed),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createPayment = async (req, res) => {
  const { order_id, amount, method, status, notes } = req.body;
  if (!order_id || !amount) {
    return res.status(400).json({ error: "order_id and amount are required" });
  }
  try {
    // Guard: check if order is already fully paid to prevent duplicates
    const existing = await require("../config/db").query(
      `SELECT COALESCE(SUM(p.amount),0) AS paid, o.total
       FROM orders o LEFT JOIN payments p ON p.order_id = o.id AND LOWER(p.status)='completed'
       WHERE o.id = $1 GROUP BY o.total`,
      [order_id]
    );
    if (existing.rows[0]) {
      const alreadyPaid = parseFloat(existing.rows[0].paid);
      const total       = parseFloat(existing.rows[0].total);
      if (alreadyPaid >= total && total > 0) {
        return res.status(400).json({ error: "This order is already fully paid." });
      }
    }

    const result = await Payment.create(order_id, amount, method, status, notes);
    if (!status || status === "Completed") {
      await Sales.updateStatus(order_id, "Completed", req.user.company_id);
    }
    logEvent({ module: "payments", action: "created", req,
      description: `Payment recorded for order #${order_id}: $${amount} via ${method || "Bank Transfer"}`,
      metadata: { id: result.rows[0].id, order_id, amount, status } });
    createNotification({ company_id: req.user.company_id, title: "Payment Received",
      message: `$${Number(amount).toFixed(2)} payment recorded for order #${order_id}`,
      type: "success", link: "/payments", requiredPermission: "Manage Payments" });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updatePayment = async (req, res) => {
  const { status, notes } = req.body;
  try {
    const result = await Payment.update(req.params.id, status, notes);
    if (!result.rows[0]) return res.status(404).json({ error: "Payment not found" });
    logEvent({ module: "payments", action: "updated", req,
      description: `Payment #${req.params.id} updated to status: ${status}`,
      metadata: { id: req.params.id, status } });
    createNotification({ company_id: req.user.company_id, title: "Payment Updated",
      message: `Payment #${req.params.id} status changed to ${status}`,
      type: "info", link: "/payments", requiredPermission: "Manage Payments" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deletePayment = async (req, res) => {
  try {
    const result = await Payment.delete(req.params.id, req.user.company_id);
    if (!result.rows[0]) return res.status(404).json({ error: "Payment not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getPayments, createPayment, updatePayment, deletePayment };
