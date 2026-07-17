const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");
const { requireRole } = require("../middleware/authMiddleware");
const { ALL_PERMS, MANAGER_PERMS, EMPLOYEE_PERMS } = require("../config/defaultRolePermissions");
const ContactMessage = require("../models/contactModel");
const { logEvent } = require("../utils/logger");

// All routes in this file require super_admin
router.use(requireRole("super_admin"));

// GET /api/super-admin/maintenance-mode — current platform-wide state
router.get("/maintenance-mode", async (req, res) => {
  try {
    const r = await db.query("SELECT value FROM system_settings WHERE key = 'maintenanceMode'");
    res.json({ enabled: r.rows[0]?.value === "true" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/super-admin/maintenance-mode — platform-wide, so exclusively
// super_admin's call, not any single company's admin (system_settings has
// no company_id scoping — see settingsController.updateSystemSettings).
router.patch("/maintenance-mode", async (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== "boolean")
    return res.status(400).json({ error: "enabled must be a boolean" });
  try {
    await db.query(
      `INSERT INTO system_settings (key, value, updated_at) VALUES ('maintenanceMode', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=NOW()`,
      [String(enabled)]
    );
    require("../middleware/maintenanceMode").invalidateCache();
    logEvent({ level: enabled ? "WARNING" : "INFO", module: "super-admin", action: "maintenance_mode_toggled", req,
      description: `Maintenance mode ${enabled ? "enabled" : "disabled"} platform-wide` });
    res.json({ enabled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/super-admin/companies — all companies with admin + user counts
router.get("/companies", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        c.id, c.name, c.created_at, c.is_active,
        COUNT(DISTINCT u.id) FILTER (WHERE u.role != 'super_admin') AS user_count,
        MIN(u.name)  FILTER (WHERE u.role = 'admin') AS admin_name,
        MIN(u.email) FILTER (WHERE u.role = 'admin') AS admin_email
      FROM companies c
      LEFT JOIN users u ON u.company_id = c.id
      GROUP BY c.id, c.name, c.created_at, c.is_active
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/super-admin/companies — create company + first admin in one step
router.post("/companies", async (req, res) => {
  const { company_name, admin_name, admin_email, admin_password } = req.body;
  if (!company_name || !admin_name || !admin_email || !admin_password)
    return res.status(400).json({ error: "company_name, admin_name, admin_email and admin_password are required" });
  try {
    const nameTaken = await db.query("SELECT id FROM companies WHERE LOWER(name) = LOWER($1)", [company_name]);
    if (nameTaken.rows.length > 0) return res.status(400).json({ error: "Company name already exists" });

    const emailTaken = await db.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [admin_email]);
    if (emailTaken.rows.length > 0) return res.status(400).json({ error: "Email already registered" });

    const coRes = await db.query("INSERT INTO companies (name) VALUES ($1) RETURNING *", [company_name]);
    const company = coRes.rows[0];

    // Every company gets its own admin/manager/employee permission rows —
    // role_permissions is scoped per company (see migrate.js), so a fresh
    // company starts with no rows at all until this seeds them.
    await db.query(
      `INSERT INTO role_permissions (role, permissions, company_id) VALUES
         ('admin',    $1, $4),
         ('manager',  $2, $4),
         ('employee', $3, $4)`,
      [JSON.stringify(ALL_PERMS), JSON.stringify(MANAGER_PERMS), JSON.stringify(EMPLOYEE_PERMS), company.id]
    );

    const hashed = await bcrypt.hash(admin_password, 10);
    const userRes = await db.query(
      `INSERT INTO users (name, email, password, role, company_name, company_id, must_change_password)
       VALUES ($1, $2, $3, 'admin', $4, $5, true) RETURNING id, name, email, role, company_name`,
      [admin_name, admin_email, hashed, company_name, company.id]
    );
    logEvent({ module: "super-admin", action: "company_created", req,
      description: `Created company "${company_name}" with admin ${admin_email}`,
      metadata: { company_id: company.id, company_name, admin_email } });
    res.status(201).json({ company, admin: userRes.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/super-admin/companies/:id/admin — add a new admin to an existing company
router.put("/companies/:id/admin", async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "name, email and password are required" });
  try {
    const coRes = await db.query("SELECT * FROM companies WHERE id = $1", [id]);
    if (!coRes.rows[0]) return res.status(404).json({ error: "Company not found" });

    const emailTaken = await db.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    if (emailTaken.rows.length > 0) return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const userRes = await db.query(
      `INSERT INTO users (name, email, password, role, company_name, company_id, must_change_password)
       VALUES ($1, $2, $3, 'admin', $4, $5, true) RETURNING id, name, email, role`,
      [name, email, hashed, coRes.rows[0].name, id]
    );
    logEvent({ module: "super-admin", action: "admin_assigned", req,
      description: `Assigned ${email} as admin of "${coRes.rows[0].name}"`,
      metadata: { company_id: id, company_name: coRes.rows[0].name, admin_email: email } });
    res.status(201).json(userRes.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/super-admin/companies/:id/users — list users of a company
router.get("/companies/:id/users", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      "SELECT id, name, email, role, created_at FROM users WHERE company_id = $1 ORDER BY role, name",
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/super-admin/companies/:id/status — suspend or reactivate, short
// of the permanent, cascading delete below
router.patch("/companies/:id/status", async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  if (typeof is_active !== "boolean")
    return res.status(400).json({ error: "is_active must be a boolean" });
  try {
    const result = await db.query(
      "UPDATE companies SET is_active = $1 WHERE id = $2 RETURNING *",
      [is_active, id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Company not found" });
    require("../middleware/requireActiveCompany").invalidateCache();
    logEvent({ level: is_active ? "INFO" : "WARNING", module: "super-admin",
      action: is_active ? "company_reactivated" : "company_suspended", req,
      description: `${is_active ? "Reactivated" : "Suspended"} company "${result.rows[0].name}"`,
      metadata: { company_id: id, company_name: result.rows[0].name } });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/super-admin/companies/:id — delete company + all its data
router.delete("/companies/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const coRes = await db.query("SELECT name FROM companies WHERE id = $1", [id]);
    if (!coRes.rows[0]) return res.status(404).json({ error: "Company not found" });
    const companyName = coRes.rows[0].name;

    // system_logs' company_id FK has no ON DELETE CASCADE (unlike
    // role_permissions/notifications, which do) - any company with real
    // activity (a single login is enough) has log rows, so deleting a
    // company without clearing these first always violated the FK.
    await db.query(`DELETE FROM system_logs WHERE company_id=$1`, [id]);
    await db.query(`DELETE FROM payments   WHERE order_id IN (SELECT id FROM orders WHERE company_id=$1)`, [id]);
    await db.query(`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE company_id=$1)`, [id]);
    await db.query(`DELETE FROM orders    WHERE company_id=$1`, [id]);
    await db.query(`DELETE FROM employees  WHERE company_id=$1`, [id]);
    await db.query(`DELETE FROM customers  WHERE company_id=$1`, [id]);
    await db.query(`DELETE FROM products   WHERE company_id=$1`, [id]);
    await db.query(`DELETE FROM suppliers  WHERE company_id=$1`, [id]);
    await db.query(`DELETE FROM users      WHERE company_id=$1`, [id]);
    await db.query(`DELETE FROM companies  WHERE id=$1`, [id]);
    logEvent({ level: "WARNING", module: "super-admin", action: "company_deleted", req,
      description: `Deleted company "${companyName}" and all its data`,
      metadata: { company_id: id, company_name: companyName } });
    res.json({ message: "Company and all its data deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/super-admin/contact-messages — inbound submissions from the public contact form
router.get("/contact-messages", async (req, res) => {
  try {
    const result = await ContactMessage.getAll();
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/super-admin/contact-messages/:id/read
router.patch("/contact-messages/:id/read", async (req, res) => {
  try {
    const result = await ContactMessage.markRead(req.params.id);
    if (!result.rows[0]) return res.status(404).json({ error: "Message not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/super-admin/contact-messages/:id
router.delete("/contact-messages/:id", async (req, res) => {
  try {
    const result = await ContactMessage.delete(req.params.id);
    if (!result.rows[0]) return res.status(404).json({ error: "Message not found" });
    logEvent({ module: "super-admin", action: "contact_message_deleted", req,
      description: `Deleted contact message from ${result.rows[0].email}`,
      metadata: { message_id: req.params.id } });
    res.json({ message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
