const pool = require("../config/db");

const Order = {
  getAll: (companyId) =>
    pool.query(
      `SELECT o.*, c.name AS customer_name, COUNT(oi.id)::int AS item_count
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.company_id = $1
       GROUP BY o.id, c.name
       ORDER BY COALESCE(o.order_date, o.created_at) DESC`,
      [companyId]
    ),

  getById: (id, companyId) =>
    pool.query(
      `SELECT o.*, c.name AS customer_name
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       WHERE o.id = $1 AND o.company_id = $2`,
      [id, companyId]
    ),

  getItems: (id, companyId) =>
    pool.query(
      `SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price,
              COALESCE(p.name, '[Deleted Product]') AS product_name
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.order_id = $1 AND o.company_id = $2`,
      [id, companyId]
    ),

  delete: (id, companyId) =>
    pool.query(
      "DELETE FROM orders WHERE id=$1 AND company_id=$2 RETURNING *",
      [id, companyId]
    ),
};

module.exports = Order;
