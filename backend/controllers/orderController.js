const pool = require("../config/db");
const Order = require("../models/orderModel");
const { createNotification } = require("../utils/notify");
const { logEvent } = require("../utils/logger");

const getOrders = async (req, res) => {
  try {
    const page  = parseInt(req.query.page, 10)  || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { search = "", status = "all", dateRange = "All", sort = "date", order = "desc" } = req.query;

    const { rows, filteredTotal, stats } = await Order.getPaged(req.user.company_id, {
      search, status, dateRange, sort, order, page, limit,
    });

    res.json({
      data: rows,
      total: filteredTotal,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(filteredTotal / limit)),
      stats: {
        total: stats.total,
        pendingCount: stats.pending_count,
        processingCount: stats.processing_count,
        completedCount: stats.completed_count,
        totalRevenue: Number(stats.total_revenue),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const result = await Order.getById(req.params.id, req.user.company_id);
    if (!result.rows[0]) return res.status(404).json({ error: "Order not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getOrderItems = async (req, res) => {
  try {
    const result = await Order.getItems(req.params.id, req.user.company_id);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Normalize any status value to Title Case so DB is always consistent
const normalizeStatus = (s) => {
  if (!s) return "Pending";
  const map = {
    pending: "Pending", processing: "Processing", shipped: "Shipped",
    completed: "Completed", cancelled: "Cancelled",
    Pending: "Pending", Processing: "Processing", Shipped: "Shipped",
    Completed: "Completed", Cancelled: "Cancelled",
  };
  return map[s] ?? (s.charAt(0).toUpperCase() + s.slice(1).toLowerCase());
};

const createOrder = async (req, res) => {
  const { customer_id, status, notes, order_date, items = [] } = req.body;
  const normalizedStatus = normalizeStatus(status);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Calculate total from items
    const total = items.reduce((sum, it) => sum + Number(it.unit_price) * Number(it.quantity), 0);

    // Insert order
    const orderRes = await client.query(
      `INSERT INTO orders (customer_id, status, total, notes, order_date, company_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [customer_id, normalizedStatus, total, notes || null, order_date || new Date(), req.user.company_id]
    );
    const order = orderRes.rows[0];

    // Insert items + decrement stock
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
        [order.id, item.product_id, item.quantity, item.unit_price]
      );
      await client.query(
        `UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2 AND company_id = $3`,
        [item.quantity, item.product_id, req.user.company_id]
      );
      const { rows: [p] } = await client.query(
        `SELECT name, stock, reorder_point FROM products WHERE id = $1`,
        [item.product_id]
      );
      if (p && p.stock <= (p.reorder_point ?? 10)) {
        createNotification({
          company_id: req.user.company_id,
          title: "Low Stock Alert",
          message: `${p.name} is low on stock (${p.stock} remaining).`,
          type: "warning",
          link: "/products",
          requiredPermission: "Manage Products",
        });
      }
    }

    // Auto-create payment if completed
    if (normalizedStatus === "Completed" && total > 0) {
      await client.query(
        `INSERT INTO payments (order_id, amount, method, status, notes, payment_date)
         VALUES ($1, $2, 'Cash', 'Completed', 'Auto-recorded on order completion', NOW())`,
        [order.id, total]
      );
    }

    await client.query("COMMIT");

    logEvent({ module: "orders", action: "created", req,
      description: `Order #${order.id} created for customer ${customer_id} — $${total.toFixed(2)}`,
      metadata: { id: order.id, total, items: items.length } });
    createNotification({
      company_id: req.user.company_id,
      title: "New Order",
      message: `Order #${String(order.id).padStart(4, "0")} created — $${total.toFixed(2)} (${items.length} item${items.length !== 1 ? "s" : ""})`,
      type: "info",
      link: "/orders",
      requiredPermission: "Manage Orders",
    });

    res.status(201).json(order);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

const updateOrder = async (req, res) => {
  const { customer_id, notes, order_date, items } = req.body;
  const status = req.body.status !== undefined ? normalizeStatus(req.body.status) : undefined;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get current order to check old status and total
    const current = await client.query(
      "SELECT * FROM orders WHERE id=$1 AND company_id=$2",
      [req.params.id, req.user.company_id]
    );
    if (!current.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Order not found" });
    }
    const oldOrder = current.rows[0];

    // If items provided, restore old stock then replace items
    if (items !== undefined) {
      // Restore stock for old items
      const oldItems = await client.query(
        "SELECT product_id, quantity FROM order_items WHERE order_id=$1",
        [req.params.id]
      );
      for (const old of oldItems.rows) {
        await client.query(
          `UPDATE products SET stock = stock + $1 WHERE id = $2 AND company_id = $3`,
          [old.quantity, old.product_id, req.user.company_id]
        );
      }

      // Delete old items
      await client.query("DELETE FROM order_items WHERE order_id=$1", [req.params.id]);

      // Insert new items + decrement stock
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
          [req.params.id, item.product_id, item.quantity, item.unit_price]
        );
        await client.query(
          `UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2 AND company_id = $3`,
          [item.quantity, item.product_id, req.user.company_id]
        );
        const { rows: [p] } = await client.query(
          `SELECT name, stock, reorder_point FROM products WHERE id = $1`,
          [item.product_id]
        );
        if (p && p.stock <= (p.reorder_point ?? 10)) {
          createNotification({
            company_id: req.user.company_id,
            title: "Low Stock Alert",
            message: `${p.name} is low on stock (${p.stock} remaining).`,
            type: "warning",
            link: "/products",
            requiredPermission: "Manage Products",
          });
        }
      }
    }

    // Recalculate total from new items (or keep old if items not updated)
    let total = oldOrder.total;
    if (items !== undefined) {
      total = items.reduce((sum, it) => sum + Number(it.unit_price) * Number(it.quantity), 0);
    }

    // Update order
    const result = await client.query(
      `UPDATE orders SET customer_id=COALESCE($1, customer_id), status=COALESCE($2, status),
       total=$3, notes=COALESCE($4, notes), order_date=COALESCE($5, order_date), updated_at=NOW()
       WHERE id=$6 AND company_id=$7 RETURNING *`,
      [customer_id, status, total, notes, order_date, req.params.id, req.user.company_id]
    );

    // Auto-create payment if status just became Completed
    const newStatus = status || oldOrder.status;
    if (newStatus === "Completed" && oldOrder.status !== "Completed" && total > 0) {
      await client.query(
        `INSERT INTO payments (order_id, amount, method, status, notes, payment_date)
         VALUES ($1, $2, 'Cash', 'Completed', 'Auto-recorded on order completion', NOW())`,
        [req.params.id, total]
      );
    }

    await client.query("COMMIT");

    logEvent({ module: "orders", action: "updated", req,
      description: status
        ? `Order #${req.params.id} status changed to ${status}`
        : `Order #${req.params.id} updated`,
      metadata: { id: req.params.id, status } });

    res.json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

const deleteOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Verify order belongs to company
    const order = await client.query(
      "SELECT id FROM orders WHERE id=$1 AND company_id=$2",
      [req.params.id, req.user.company_id]
    );
    if (!order.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Order not found" });
    }

    // Restore stock
    const items = await client.query(
      "SELECT product_id, quantity FROM order_items WHERE order_id=$1",
      [req.params.id]
    );
    for (const item of items.rows) {
      await client.query(
        `UPDATE products SET stock = stock + $1 WHERE id = $2 AND company_id = $3`,
        [item.quantity, item.product_id, req.user.company_id]
      );
    }

    // Delete linked records
    await client.query("DELETE FROM payments WHERE order_id=$1", [req.params.id]);
    await client.query("DELETE FROM order_items WHERE order_id=$1", [req.params.id]);
    const result = await client.query(
      "DELETE FROM orders WHERE id=$1 AND company_id=$2 RETURNING *",
      [req.params.id, req.user.company_id]
    );

    await client.query("COMMIT");

    logEvent({ level: "WARNING", module: "orders", action: "deleted", req,
      description: `Order #${req.params.id} deleted`,
      metadata: { id: req.params.id } });

    res.json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

module.exports = { getOrders, getOrderById, getOrderItems, createOrder, updateOrder, deleteOrder };
