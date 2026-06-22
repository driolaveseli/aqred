const db = require("../config/db");

let cache = { enabled: false, checkedAt: 0 };
const TTL_MS = 30_000;

const maintenanceMode = async (req, res, next) => {
  const now = Date.now();
  if (now - cache.checkedAt > TTL_MS) {
    try {
      const r = await db.query("SELECT value FROM system_settings WHERE key = 'maintenanceMode'");
      cache = { enabled: r.rows[0]?.value === "true", checkedAt: now };
    } catch { /* DB unavailable — allow through */ }
  }

  const role = req.user?.role;
  if (cache.enabled && role !== "admin" && role !== "super_admin") {
    return res.status(503).json({
      error: "System is currently under maintenance. Please try again later.",
      code:  "MAINTENANCE_MODE",
    });
  }
  next();
};

maintenanceMode.invalidateCache = () => { cache.checkedAt = 0; };
module.exports = maintenanceMode;
