const db = require("../config/db");

/**
 * Insert a company-scoped notification. Fire-and-forget — never throws.
 *
 * @param {object} opts
 * @param {number}  opts.company_id  - target company (skip if null/undefined)
 * @param {string}  opts.title       - short heading, e.g. "New Sale"
 * @param {string}  opts.message     - detail line shown in the dropdown
 * @param {string}  [opts.type]      - "info" | "success" | "warning"
 * @param {string}  [opts.link]      - frontend path to navigate to on click
 * @param {string}  [opts.requiredPermission] - permission needed to see this
 *   notification (should match whatever `link` is gated behind); omit for
 *   notifications every role in the company should see
 */
const createNotification = async ({ company_id, title, message, type = "info", link = null, requiredPermission = null }) => {
  try {
    if (!company_id) return; // super_admin has no company; skip
    await db.query(
      `INSERT INTO notifications (company_id, title, message, type, link, required_permission)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [company_id, title, message, type, link, requiredPermission]
    );
  } catch {
    // Notifications must never crash the main operation
  }
};

module.exports = { createNotification };
