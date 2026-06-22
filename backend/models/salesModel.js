const pool = require("../config/db");

const Sales = {
  getAll: (companyId) =>
    pool.query(`
      SELECT o.id, o.customer_id, o.status, o.total, o.notes, o.company_id,
             o.order_date, o.created_at, o.updated_at,
             COALESCE(o.due_date, (COALESCE(o.order_date, o.created_at) + INTERVAL '30 days')::date) AS due_date,
             c.name AS customer_name, c.email AS customer_email,
             COALESCE(item_agg.item_count, 0) AS item_count,
             COALESCE(pay_agg.amount_paid, 0)::float AS amount_paid
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN (
        SELECT order_id, COUNT(*) AS item_count
        FROM order_items
        GROUP BY order_id
      ) item_agg ON item_agg.order_id = o.id
      LEFT JOIN (
        SELECT order_id, SUM(amount) AS amount_paid
        FROM payments
        WHERE LOWER(status) = 'completed'
        GROUP BY order_id
      ) pay_agg ON pay_agg.order_id = o.id
      WHERE o.company_id = $1
        AND COALESCE(item_agg.item_count, 0) > 0
      ORDER BY COALESCE(o.order_date, o.created_at) DESC
    `, [companyId]),

  getById: (id, companyId) =>
    pool.query(
      `SELECT o.*, c.name AS customer_name, c.email AS customer_email
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.id = $1 AND o.company_id = $2`,
      [id, companyId]
    ),

  getItems: (orderId) =>
    pool.query(
      `SELECT oi.*, COALESCE(p.name, '[Deleted Product]') AS product_name, p.sku, p.category
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [orderId]
    ),

  createSale: async ({ customer_id, status, notes, due_date, items, companyId }) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const total = items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0
      );

      // Validate stock — also ensure product belongs to this company
      for (const item of items) {
        const { rows } = await client.query(
          "SELECT stock, name FROM products WHERE id = $1 AND company_id = $2",
          [item.product_id, companyId]
        );
        if (!rows[0]) throw new Error(`Product ${item.product_id} not found`);
        if (rows[0].stock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${rows[0].name}". Available: ${rows[0].stock}`
          );
        }
      }

      const orderResult = await client.query(
        `INSERT INTO orders (customer_id, status, total, notes, due_date, order_date, company_id)
         VALUES ($1, $2, $3, $4, $5, NOW(), $6) RETURNING *`,
        [customer_id, status || "Pending", total, notes || null, due_date || null, companyId]
      );
      const order = orderResult.rows[0];

      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.product_id, item.quantity, item.unit_price]
        );
        await client.query(
          `UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2 AND company_id = $3`,
          [item.quantity, item.product_id, companyId]
        );
      }

      await client.query("COMMIT");
      return order;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  updateStatus: (id, status, companyId) =>
    pool.query(
      "UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 AND ($3::int IS NULL OR company_id=$3) RETURNING *",
      [status, id, companyId || null]
    ),

  getMonthlyRevenue: (from, companyId) =>
    pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', order_date), 'Mon') AS month,
        EXTRACT(YEAR  FROM DATE_TRUNC('month', order_date))::INT AS year,
        EXTRACT(MONTH FROM DATE_TRUNC('month', order_date))::INT AS month_num,
        COALESCE(SUM(total), 0)::FLOAT AS revenue,
        COUNT(*)::INT AS orders
      FROM orders
      WHERE company_id = $2
        AND ($1::timestamptz IS NULL OR order_date >= $1::timestamptz)
        AND LOWER(status) != 'cancelled'
      GROUP BY DATE_TRUNC('month', order_date)
      ORDER BY DATE_TRUNC('month', order_date)
    `, [from || null, companyId]),

  getTopProducts: (from, companyId) =>
    pool.query(`
      SELECT p.name, p.category,
             SUM(oi.quantity)::INT AS units,
             SUM(oi.quantity * oi.unit_price)::FLOAT AS revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.company_id = $2
        AND LOWER(o.status) != 'cancelled'
        AND ($1::timestamptz IS NULL OR o.order_date >= $1::timestamptz)
      GROUP BY p.id, p.name, p.category
      ORDER BY revenue DESC
      LIMIT 5
    `, [from || null, companyId]),

  getCategoryRevenue: (from, companyId) =>
    pool.query(`
      SELECT COALESCE(p.category, 'Uncategorized') AS category,
             SUM(oi.quantity * oi.unit_price)::FLOAT AS revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.company_id = $2
        AND LOWER(o.status) != 'cancelled'
        AND ($1::timestamptz IS NULL OR o.order_date >= $1::timestamptz)
      GROUP BY COALESCE(p.category, 'Uncategorized')
      ORDER BY revenue DESC
    `, [from || null, companyId]),

  getTopCustomers: (from, companyId) =>
    pool.query(`
      SELECT c.name, c.email,
             COUNT(o.id)::INT AS orders,
             COALESCE(SUM(o.total), 0)::FLOAT AS revenue
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.company_id = $2
        AND LOWER(o.status) != 'cancelled'
        AND ($1::timestamptz IS NULL OR o.order_date >= $1::timestamptz)
      GROUP BY c.id, c.name, c.email
      ORDER BY revenue DESC
      LIMIT 5
    `, [from || null, companyId]),

  getPaymentMethodBreakdown: (from, companyId) =>
    pool.query(`
      SELECT p.method,
             COUNT(*)::INT AS count,
             COALESCE(SUM(p.amount), 0)::FLOAT AS total
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE o.company_id = $2
        AND LOWER(p.status) = 'completed'
        AND ($1::timestamptz IS NULL OR p.created_at >= $1::timestamptz)
      GROUP BY p.method
      ORDER BY total DESC
    `, [from || null, companyId]),

  getKPISummary: (from, prevFrom, companyId) =>
    pool.query(`
      WITH current_period AS (
        SELECT
          COALESCE(SUM(total), 0)::FLOAT AS revenue,
          COUNT(*)::INT AS orders,
          COALESCE(AVG(total), 0)::FLOAT AS avg_order_value
        FROM orders
        WHERE company_id = $3
          AND LOWER(status) != 'cancelled'
          AND ($1::timestamptz IS NULL OR order_date >= $1::timestamptz)
      ),
      prev_period AS (
        SELECT COALESCE(SUM(total), 0)::FLOAT AS revenue
        FROM orders
        WHERE company_id = $3
          AND LOWER(status) != 'cancelled'
          AND ($2::timestamptz IS NULL OR order_date >= $2::timestamptz)
          AND ($1::timestamptz IS NULL OR order_date < $1::timestamptz)
      )
      SELECT
        cp.revenue, cp.orders, cp.avg_order_value,
        pp.revenue AS prev_revenue
      FROM current_period cp, prev_period pp
    `, [from || null, prevFrom || null, companyId]),
};

module.exports = Sales;
