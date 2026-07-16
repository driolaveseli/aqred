const db = require("../config/db");

// Every module maps to exactly one badge type; any WARNING/ERROR-level event
// (deletions, failures) is surfaced as "alert" regardless of module, since
// that's the cross-cutting thing worth flagging in a feed.
const TYPE_CASE = `
  CASE
    WHEN sl.level IN ('WARNING', 'ERROR') THEN 'alert'
    WHEN sl.module = 'products'  THEN 'product'
    WHEN sl.module = 'customers' THEN 'customer'
    WHEN sl.module IN ('orders', 'sales') THEN 'order'
    WHEN sl.module = 'payments'  THEN 'payment'
    WHEN sl.module IN ('employees', 'staff') THEN 'employee'
    ELSE 'system'
  END
`;

const FILTER_TYPES = ["order", "employee", "customer", "product", "payment", "alert", "system"];

const getActivity = async (req, res) => {
  try {
    const { company_id } = req.user;
    if (!company_id) {
      return res.json({ data: [], total: 0, page: 1, limit: 20, totalPages: 1 });
    }

    const page  = parseInt(req.query.page, 10)  || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { type = "All" } = req.query;
    const offset = (Math.max(1, page) - 1) * limit;

    const params = [company_id];
    let typeFilter = "";
    if (type !== "All" && FILTER_TYPES.includes(type)) {
      params.push(type);
      typeFilter = `AND type = $${params.length}`;
    }

    const baseCte = `
      WITH base AS (
        SELECT sl.id, sl.level, sl.module, sl.action, sl.user_name, sl.description, sl.timestamp,
               ${TYPE_CASE} AS type
        FROM system_logs sl
        WHERE sl.company_id = $1
          -- auth/SECURITY events (logins, password/2FA changes) are session noise,
          -- not business activity — they stay in the admin-only /api/logs view.
          AND sl.module != 'auth'
          AND sl.level != 'SECURITY'
      )
    `;

    const dataParams = [...params, limit, offset];
    const dataSql = `${baseCte}
      SELECT * FROM base WHERE 1=1 ${typeFilter}
      ORDER BY timestamp DESC
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`;
    const countSql = `${baseCte}
      SELECT COUNT(*)::int AS count FROM base WHERE 1=1 ${typeFilter}`;

    const [dataRes, countRes] = await Promise.all([
      db.query(dataSql, dataParams),
      db.query(countSql, params),
    ]);

    res.json({
      data: dataRes.rows,
      total: countRes.rows[0].count,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(countRes.rows[0].count / limit)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getActivity };
