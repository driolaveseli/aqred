const express = require("express");
const router  = express.Router();
const db      = require("../config/db");
const bcrypt  = require("bcrypt");
const { requireRole } = require("../middleware/authMiddleware");
const { logEvent } = require("../utils/logger");

// All staff routes: admin only
router.use(requireRole("admin"));

// ── GET /api/staff ─────────────────────────────────────────────────────────────
// Returns all users in the company joined with their employee HR record.
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
              e.position, e.department, e.salary,
              COALESCE(e.status, 'Active') AS employment_status
       FROM users u
       LEFT JOIN employees e ON e.email = u.email AND e.company_id = u.company_id
       WHERE u.company_id = $1
       ORDER BY u.id DESC`,
      [req.user.company_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/staff ────────────────────────────────────────────────────────────
// Creates a user account + employee HR record in one step.
router.post("/", async (req, res) => {
  const { name, email, password, role, position, department, salary, employment_status } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name and email are required" });

  try {
    const coRes = await db.query("SELECT name FROM companies WHERE id = $1", [req.user.company_id]);
    const company_name = coRes.rows[0]?.name || null;

    const hashed = await bcrypt.hash(password || "Welcome123!", 10);

    const userResult = await db.query(
      `INSERT INTO users (name, email, password, role, company_name, company_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, name, email, role, created_at`,
      [name, email, hashed, role || "employee", company_name, req.user.company_id]
    );
    const user = userResult.rows[0];

    // Upsert employee HR record — update existing if found (backfill may have created one), else insert
    const empUpd = await db.query(
      `UPDATE employees SET name=$1, position=$2, department=$3, salary=$4, status=$5
       WHERE email=$6 AND company_id=$7`,
      [name, position || "", department || null,
       salary !== "" && salary != null ? Number(salary) : null,
       employment_status || "Active", email, req.user.company_id]
    );
    if (empUpd.rowCount === 0) {
      await db.query(
        `INSERT INTO employees (name, email, position, department, salary, status, company_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [name, email, position || "", department || null,
         salary !== "" && salary != null ? Number(salary) : null,
         employment_status || "Active", req.user.company_id]
      );
    }

    logEvent({ module: "staff", action: "created", req,
      description: `Staff member created: ${name} (${role || "employee"})`,
      metadata: { id: user.id } });

    res.status(201).json(user);
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ error: "Email already registered" });
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/staff/:id ─────────────────────────────────────────────────────────
// Updates user account fields + employee HR fields simultaneously.
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, position, department, salary, employment_status } = req.body;

  try {
    // Fetch old email before update so we can find the employee row
    const old = await db.query(
      "SELECT email FROM users WHERE id=$1 AND company_id=$2",
      [id, req.user.company_id]
    );
    if (!old.rows[0]) return res.status(404).json({ error: "Staff member not found" });
    const oldEmail = old.rows[0].email;

    // Build user update — only update password if a new one was supplied
    let userResult;
    if (password && password.trim().length > 0) {
      const hashed = await bcrypt.hash(password, 10);
      userResult = await db.query(
        `UPDATE users SET name=$1, email=$2, role=$3, password=$4, updated_at=NOW()
         WHERE id=$5 AND company_id=$6
         RETURNING id, name, email, role, created_at`,
        [name, email, role, hashed, id, req.user.company_id]
      );
    } else {
      userResult = await db.query(
        `UPDATE users SET name=$1, email=$2, role=$3, updated_at=NOW()
         WHERE id=$4 AND company_id=$5
         RETURNING id, name, email, role, created_at`,
        [name, email, role, id, req.user.company_id]
      );
    }
    if (!userResult.rows[0]) return res.status(404).json({ error: "Staff member not found" });

    // Update employee HR record by old email (handles email-change case too)
    const empUpd2 = await db.query(
      `UPDATE employees SET name=$1, email=$2, position=$3, department=$4, salary=$5, status=$6
       WHERE email=$7 AND company_id=$8`,
      [name, email, position || "", department || null,
       salary !== "" && salary != null ? Number(salary) : null,
       employment_status || "Active", oldEmail, req.user.company_id]
    );
    // If no employee record existed yet (e.g. user was created outside normal flow), insert one
    if (empUpd2.rowCount === 0) {
      await db.query(
        `INSERT INTO employees (name, email, position, department, salary, status, company_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
        [name, email, position || "", department || null,
         salary !== "" && salary != null ? Number(salary) : null,
         employment_status || "Active", req.user.company_id]
      );
    }

    logEvent({ module: "staff", action: "updated", req,
      description: `Staff member updated: ${name}`, metadata: { id } });

    res.json(userResult.rows[0]);
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ error: "Email already in use" });
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/staff/:id ──────────────────────────────────────────────────────
// Removes the user account and the linked employee record.
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      "DELETE FROM users WHERE id=$1 AND company_id=$2 RETURNING id, name, email",
      [id, req.user.company_id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Staff member not found" });

    const { email, name } = result.rows[0];
    await db.query(
      "DELETE FROM employees WHERE email=$1 AND company_id=$2",
      [email, req.user.company_id]
    );

    logEvent({ level: "WARNING", module: "staff", action: "deleted", req,
      description: `Staff member deleted: ${name}`, metadata: { id } });

    res.json({ message: "Staff member removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
