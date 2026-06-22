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
 */
const createNotification = async ({ company_id, title, message, type = "info", link = null }) => {
  try {
    if (!company_id) return; // super_admin has no company; skip
    await db.query(
      `INSERT INTO notifications (company_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5)`,
      [company_id, title, message, type, link]
    );
  } catch {
    // Notifications must never crash the main operation
  }
};

module.exports = { createNotification };
