const pool = require("../config/db");

const buildFilters = (companyId, { search, status }) => {
  const params = [companyId];
  let where = "WHERE o.company_id = $1";
  if (search) {
    params.push(`%${search}%`);
    where += ` AND (CAST(p.id AS TEXT) ILIKE $${params.length} OR c.name ILIKE $${params.length} OR ('ORD-' || LPAD(CAST(p.order_id AS TEXT), 4, '0')) ILIKE $${params.length})`;
  }
  if (status && status !== "All") {
    params.push(status);
    where += ` AND p.status = $${params.length}`;
  }
  return { where, params };
};

const Payment = {
  getPaged: async (companyId, { search = "", status = "All", page = 1, limit = 20 } = {}) => {
    const { where, params } = buildFilters(companyId, { search, status });
    const offset = (Math.max(1, page) - 1) * limit;

    const dataParams = [...params, limit, offset];
    const dataSql = `
      SELECT p.*, o.total AS order_total, c.name AS customer_name, c.email AS customer_email
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`;
    // Filtered count — drives pagination, reflects search/status.
    const countSql = `
      SELECT COUNT(*)::int AS count
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      ${where}`;
    // Stats — company-wide KPI cards, deliberately unfiltered: the status tabs
    // (Completed/Pending/Failed) are themselves rendered as these same cards, so
    // filtering stats by the active status would make the other cards read 0.
    const statsSql = `
      SELECT
        COUNT(*)::int AS total,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'Completed'), 0) AS total_completed,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'Pending'), 0)   AS total_pending,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'Failed'), 0)   AS total_failed
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      WHERE o.company_id = $1`;

    const [dataRes, countRes, statsRes] = await Promise.all([
      pool.query(dataSql, dataParams),
      pool.query(countSql, params),
      pool.query(statsSql, [companyId]),
    ]);
    return { rows: dataRes.rows, filteredTotal: countRes.rows[0].count, stats: statsRes.rows[0] };
  },

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
