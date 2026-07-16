const pool = require("../config/db");

const SORT_COLUMNS = { name: "name", company: "company", status: "status", date: "created_at" };

const buildFilters = (companyId, { search, status }) => {
  const params = [companyId];
  let where = "WHERE company_id = $1";
  if (search) {
    params.push(`%${search}%`);
    where += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length} OR phone ILIKE $${params.length} OR company ILIKE $${params.length})`;
  }
  if (status && status !== "All") {
    params.push(status);
    where += status === "Active"
      ? ` AND COALESCE(status, 'Active') = $${params.length}`
      : ` AND status = $${params.length}`;
  }
  return { where, params };
};

const Customer = {
  getPaged: async (companyId, { search = "", status = "All", sort = "name", order = "asc", page = 1, limit = 20 } = {}) => {
    const { where, params } = buildFilters(companyId, { search, status });
    const sortCol = SORT_COLUMNS[sort] || "name";
    const sortDir = order === "desc" ? "DESC" : "ASC";
    const offset = (Math.max(1, page) - 1) * limit;

    const dataParams = [...params, limit, offset];
    const dataSql = `SELECT * FROM customers ${where} ORDER BY ${sortCol} ${sortDir}, id ASC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`;
    // Filtered count — drives pagination, reflects search/status.
    const countSql = `SELECT COUNT(*)::int AS count FROM customers ${where}`;
    // Stats — company-wide KPI cards, deliberately unfiltered: the status tabs
    // (Active/Inactive/Pending) are themselves rendered as these same cards, so
    // filtering stats by the active status would make the other cards read 0.
    const statsSql = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE COALESCE(status, 'Active') = 'Active')::int AS active_count,
        COUNT(*) FILTER (WHERE status = 'Inactive')::int AS inactive_count,
        COUNT(*) FILTER (WHERE status = 'Pending')::int AS pending_count
      FROM customers WHERE company_id = $1`;

    const [dataRes, countRes, statsRes] = await Promise.all([
      pool.query(dataSql, dataParams),
      pool.query(countSql, params),
      pool.query(statsSql, [companyId]),
    ]);
    return { rows: dataRes.rows, filteredTotal: countRes.rows[0].count, stats: statsRes.rows[0] };
  },
  getById: (id, companyId) =>
    pool.query("SELECT * FROM customers WHERE id = $1 AND company_id = $2", [id, companyId]),
  create: (name, email, phone, address, company, status, companyId) =>
    pool.query(
      "INSERT INTO customers (name, email, phone, address, company, status, company_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [name, email, phone, address, company, status || "Active", companyId]
    ),
  update: (id, name, email, phone, address, company, status, companyId) =>
    pool.query(
      "UPDATE customers SET name=$1, email=$2, phone=$3, address=$4, company=$5, status=$6, updated_at=NOW() WHERE id=$7 AND company_id=$8 RETURNING *",
      [name, email, phone, address, company, status || "Active", id, companyId]
    ),
  delete: (id, companyId) =>
    pool.query("DELETE FROM customers WHERE id=$1 AND company_id=$2 RETURNING *", [id, companyId]),
};

module.exports = Customer;
