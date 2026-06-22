const Sales = require("../models/salesModel");
const Payment = require("../models/paymentModel");
const { logEvent } = require("../utils/logger");
const { createNotification } = require("../utils/notify");

const getSales = async (req, res) => {
  try {
    const result = await Sales.getAll(req.user.company_id);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSaleById = async (req, res) => {
  try {
    const order = await Sales.getById(req.params.id, req.user.company_id);
    if (!order.rows[0]) return res.status(404).json({ error: "Sale not found" });
    const items = await Sales.getItems(req.params.id);
    res.json({ ...order.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createSale = async (req, res) => {
  const { customer_id, status, notes, due_date, items } = req.body;
  if (!customer_id) return res.status(400).json({ error: "customer_id is required" });
  if (!items || !items.length) return res.status(400).json({ error: "At least one item is required" });

  try {
    const order = await Sales.createSale({
      customer_id, status, notes, due_date, items,
      companyId: req.user.company_id,
    });
    logEvent({ module: "sales", action: "created", req,
      description: `Sale created (order #${order.id}) for customer ${customer_id}`,
      metadata: { id: order.id, total: order.total, items: items.length } });
    createNotification({ company_id: req.user.company_id, title: "New Sale",
      message: `Sale #${order.id} created — $${Number(order.total).toFixed(2)}`,
      type: "success", link: "/sales" });
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateSaleStatus = async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "status is required" });
  try {
    const result = await Sales.updateStatus(req.params.id, status, req.user.company_id);
    if (!result.rows[0]) return res.status(404).json({ error: "Sale not found" });

    if (status === "Completed") {
      const existing = await Payment.getByOrderId(req.params.id);
      if (existing.rows.length === 0) {
        await Payment.create(
          result.rows[0].id, result.rows[0].total,
          "Bank Transfer", "Completed", "Auto-recorded on order completion"
        );
      }
    }

    logEvent({ module: "sales", action: "status_updated", req,
      description: `Sale #${req.params.id} status changed to ${status}`,
      metadata: { id: req.params.id, status } });
    createNotification({ company_id: req.user.company_id, title: "Sale Updated",
      message: `Sale #${req.params.id} marked as ${status}`,
      type: "info", link: "/sales" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSalesReport = async (req, res) => {
  const { range } = req.query;
  const now = new Date();
  let from = null;
  if (range === "This Month")
    from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  else if (range === "Last 3 Months")
    from = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
  else if (range === "This Year")
    from = new Date(now.getFullYear(), 0, 1).toISOString();

  const companyId = req.user.company_id;
  try {
    const [monthly, topProducts, categoryRevenue] = await Promise.all([
      Sales.getMonthlyRevenue(from, companyId),
      Sales.getTopProducts(from, companyId),
      Sales.getCategoryRevenue(from, companyId),
    ]);
    res.json({
      monthly: monthly.rows,
      topProducts: topProducts.rows,
      categoryRevenue: categoryRevenue.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getRevenueAnalytics = async (req, res) => {
  const { range } = req.query;
  const now = new Date();
  let from = null;
  let prevFrom = null;

  if (range === "This Month") {
    from     = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  } else if (range === "Last 3 Months") {
    from     = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
    prevFrom = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();
  } else if (range === "This Year") {
    from     = new Date(now.getFullYear(), 0, 1).toISOString();
    prevFrom = new Date(now.getFullYear() - 1, 0, 1).toISOString();
  }

  const companyId = req.user.company_id;
  try {
    const [monthly, categoryRevenue, topCustomers, paymentMethods, kpi] = await Promise.all([
      Sales.getMonthlyRevenue(from, companyId),
      Sales.getCategoryRevenue(from, companyId),
      Sales.getTopCustomers(from, companyId),
      Sales.getPaymentMethodBreakdown(from, companyId),
      Sales.getKPISummary(from, prevFrom, companyId),
    ]);
    res.json({
      monthly: monthly.rows,
      categoryRevenue: categoryRevenue.rows,
      topCustomers: topCustomers.rows,
      paymentMethods: paymentMethods.rows,
      kpi: kpi.rows[0] || { revenue: 0, orders: 0, avg_order_value: 0, prev_revenue: 0 },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getSales, getSaleById, createSale, updateSaleStatus, getSalesReport, getRevenueAnalytics };
