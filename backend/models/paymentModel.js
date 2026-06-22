const pool = require("../config/db");

const Payment = {
  getAll: (companyId) =>
    pool.query(`
      SELECT p.*, o.total AS order_total,
             c.name AS customer_name, c.email AS customer_email
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.company_id = $1
      ORDER BY p.created_at DESC
    `, [companyId]),

  getByOrderId: (orderId) =>
    pool.query(
      "SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC",
      [orderId]
    ),

  create: (order_id, amount, method, status, notes) =>
    pool.query(
      `INSERT INTO payments (order_id, amount, method, status, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [order_id, amount, method || "Bank Transfer", status || "Completed", notes || null]
    ),

  update: (id, status, notes) =>
    pool.query(
      "UPDATE payments SET status=$1, notes=$2 WHERE id=$3 RETURNING *",
      [status, notes, id]
    ),

  delete: (id, companyId) =>
    pool.query(
      "DELETE FROM payments WHERE id=$1 AND order_id IN (SELECT id FROM orders WHERE company_id=$2) RETURNING *",
      [id, companyId]
    ),
};

module.exports = Payment;
