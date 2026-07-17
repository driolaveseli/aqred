const db = require("../config/db");

// Same cache-with-TTL shape as maintenanceMode.js: a suspended company should
// take effect for already-logged-in sessions within seconds, not wait out an
// up-to-8h JWT lifetime, but a DB round trip on every request is wasteful.
let suspendedIds = new Set();
let checkedAt = 0;
const TTL_MS = 30_000;

const requireActiveCompany = async (req, res, next) => {
  // super_admin has no company_id and isn't scoped to any one tenant
  if (!req.user?.company_id) return next();

  const now = Date.now();
  if (now - checkedAt > TTL_MS) {
    try {
      const r = await db.query("SELECT id FROM companies WHERE is_active = false");
      suspendedIds = new Set(r.rows.map((row) => row.id));
      checkedAt = now;
    } catch { /* DB unavailable — fail open, same as maintenanceMode */ }
  }

  if (suspendedIds.has(req.user.company_id)) {
    return res.status(403).json({
      error: "Your company's account has been suspended. Contact support.",
      code: "COMPANY_SUSPENDED",
    });
  }
  next();
};

requireActiveCompany.invalidateCache = () => { checkedAt = 0; };
module.exports = requireActiveCompany;
