const pool = require("../config/db");

const SORT_COLUMNS = { id: "o.id", total: "o.total", date: "COALESCE(o.order_date, o.created_at)" };

const buildFilters = (companyId, { search, status, dateRange }) => {
  const params = [companyId];
  let where = "WHERE o.company_id = $1";
  if (search) {
    params.push(`%${search}%`);
    where += ` AND (CAST(o.id AS TEXT) ILIKE $${params.length} OR c.name ILIKE $${params.length})`;
  }
  if (status && status !== "all") {
    params.push(status);
    where += ` AND o.status = $${params.length}`;
  }
  if (dateRange === "Today")
    where += ` AND DATE(COALESCE(o.order_date, o.created_at)) = CURRENT_DATE`;
  else if (dateRange === "This Week")
    where += ` AND COALESCE(o.order_date, o.created_at) >= NOW() - INTERVAL '7 days'`;
  else if (dateRange === "This Month")
    where += ` AND DATE_TRUNC('month', COALESCE(o.order_date, o.created_at)) = DATE_TRUNC('month', CURRENT_DATE)`;
  return { where, params };
};

const Order = {
  getPaged: async (companyId, { search = "", status = "all", dateRange = "All", sort = "date", order = "desc", page = 1, limit = 20 } = {}) => {
    const { where, params } = buildFilters(companyId, { search, status, dateRange });
    const sortCol = SORT_COLUMNS[sort] || SORT_COLUMNS.date;
    const sortDir = order === "asc" ? "ASC" : "DESC";
    const offset = (Math.max(1, page) - 1) * limit;

    const dataParams = [...params, limit, offset];
    const dataSql = `
      SELECT o.*, c.name AS customer_name, COUNT(oi.id)::int AS item_count
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      ${where}
      GROUP BY o.id, c.name
      ORDER BY ${sortCol} ${sortDir}, o.id DESC
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`;
    // Filtered count — drives pagination, reflects search/status/dateRange.
    const countSql = `
      SELECT COUNT(*)::int AS count
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      ${where}`;
    // Stats — company-wide KPI cards. Deliberately unfiltered: the status tabs
    // (Pending/Processing/Completed) are themselves rendered as these same cards,
    // so filtering stats by the active status would make the other cards read 0.
    // Matches original client behavior (computed from the full unfiltered orders list).
    const statsSql = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'Pending')::int AS pending_count,
        COUNT(*) FILTER (WHERE status = 'Processing')::int AS processing_count,
        COUNT(*) FILTER (WHERE status = 'Completed')::int AS completed_count,
        COALESCE(SUM(total) FILTER (WHERE status = 'Completed'), 0) AS total_revenue
      FROM orders WHERE company_id = $1`;

    const [dataRes, countRes, statsRes] = await Promise.all([
      pool.query(dataSql, dataParams),
      pool.query(countSql, params),
      pool.query(statsSql, [companyId]),
    ]);
    return { rows: dataRes.rows, filteredTotal: countRes.rows[0].count, stats: statsRes.rows[0] };
  },

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
