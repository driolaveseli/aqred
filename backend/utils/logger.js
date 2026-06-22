const db = require("../config/db");

/**
 * Write a log entry. Fire-and-forget — never throws so it can never
 * break the operation it is called from.
 *
 * @param {object} opts
 * @param {'INFO'|'WARNING'|'ERROR'|'SECURITY'} [opts.level]
 * @param {string} opts.module   - e.g. "auth", "customers", "products"
 * @param {string} opts.action   - e.g. "login", "created", "deleted"
 * @param {Request} [opts.req]   - express request (extracts user + IP)
 * @param {string}  opts.description
 * @param {object}  [opts.metadata]  - any extra JSON to store
 */
const logEvent = async ({ level = "INFO", module, action, req, description, metadata }) => {
  try {
    const user = req?.user || null;
    const rawIp =
      req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req?.socket?.remoteAddress ||
      null;
    // Normalize IPv4-mapped IPv6 addresses (::ffff:1.2.3.4 → 1.2.3.4, ::1 → 127.0.0.1)
    const ip = rawIp
      ? rawIp.replace(/^::ffff:/, "").replace(/^::1$/, "127.0.0.1")
      : null;

    await db.query(
      `INSERT INTO system_logs
         (level, module, action, user_id, user_name, user_role, description, ip_address, metadata, company_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        level,
        module,
        action,
        user?.id         || null,
        user?.name       || null,
        user?.role       || null,
        description      || null,
        ip,
        metadata ? JSON.stringify(metadata) : null,
        user?.company_id || null,
      ]
    );
  } catch {
    // Logging must never crash the main operation
  }
};

module.exports = { logEvent };
