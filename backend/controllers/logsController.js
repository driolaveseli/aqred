const db = require("../config/db");

const getLogs = async (req, res) => {
  try {
    const { level, module, search, limit = "300", company_id } = req.query;
    const isSuperAdmin = req.user.role === "super_admin";

    const conditions = [];
    const params = [];
    let idx = 1;

    // Company scoping: admin sees only their company; super_admin may filter optionally
    if (!isSuperAdmin) {
      conditions.push(`sl.company_id = $${idx++}`);
      params.push(req.user.company_id);
    } else if (company_id) {
      conditions.push(`sl.company_id = $${idx++}`);
      params.push(company_id);
    }

    if (level && level !== "ALL") {
      conditions.push(`sl.level = $${idx++}`);
      params.push(level);
    }
    if (module && module !== "ALL") {
      conditions.push(`sl.module = $${idx++}`);
      params.push(module);
    }
    if (search) {
      conditions.push(
        `(sl.description ILIKE $${idx} OR sl.action ILIKE $${idx} OR sl.user_name ILIKE $${idx})`
      );
      params.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    params.push(Math.min(parseInt(limit) || 300, 1000));

    const result = await db.query(
      `SELECT sl.*, c.name AS company_name
       FROM system_logs sl
       LEFT JOIN companies c ON c.id = sl.company_id
       ${where}
       ORDER BY sl.timestamp DESC LIMIT $${idx}`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const clearOldLogs = async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === "super_admin";
    const result = isSuperAdmin
      ? await db.query(
          "DELETE FROM system_logs WHERE timestamp < NOW() - INTERVAL '30 days' RETURNING id"
        )
      : await db.query(
          "DELETE FROM system_logs WHERE timestamp < NOW() - INTERVAL '30 days' AND company_id = $1 RETURNING id",
          [req.user.company_id]
        );
    res.json({ cleared: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getModules = async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === "super_admin";
    const result = isSuperAdmin
      ? await db.query(
          "SELECT DISTINCT module FROM system_logs WHERE module IS NOT NULL ORDER BY module"
        )
      : await db.query(
          "SELECT DISTINCT module FROM system_logs WHERE module IS NOT NULL AND company_id = $1 ORDER BY module",
          [req.user.company_id]
        );
    res.json(result.rows.map((r) => r.module));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getLogs, clearOldLogs, getModules };
