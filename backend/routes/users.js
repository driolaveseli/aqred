const express = require("express");
const router  = express.Router();
const db      = require("../config/db");
const bcrypt  = require("bcrypt");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

router.use(verifyToken);

// ── helpers ────────────────────────────────────────────────────────────────────

// Default job title based on role
const defaultPosition = (role) =>
  role === "admin" ? "Administrator" : role === "manager" ? "Manager" : "Employee";

// Ensure an employee record exists for a user (match by email + company_id).
// Creates one if missing; updates name/email if present.
const syncEmployee = async (user, companyId) => {
  const existing = await db.query(
    "SELECT id FROM employees WHERE email = $1 AND company_id = $2",
    [user.email, companyId]
  );
  if (existing.rows.length > 0) {
    // Keep HR data intact; only sync contact fields
    await db.query(
      "UPDATE employees SET name=$1, email=$2 WHERE email=$3 AND company_id=$4",
      [user.name, user.email, user.email, companyId]
    );
  } else {
    await db.query(
      `INSERT INTO employees (name, email, position, status, company_id)
       VALUES ($1, $2, $3, 'Active', $4)`,
      [user.name, user.email, user.position || defaultPosition(user.role), companyId]
    );
  }
};

// Remove the employee record that corresponds to a user (by email + company).
const removeEmployee = async (email, companyId) => {
  await db.query(
    "DELETE FROM employees WHERE email=$1 AND company_id=$2",
    [email, companyId]
  );
};

// ── routes ─────────────────────────────────────────────────────────────────────

// GET all users in the admin's company
router.get("/", requireRole("admin"), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.company_name, u.created_at,
              e.position, e.department, e.salary, e.status AS employment_status
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

// POST create user — always assigned to admin's company; auto-creates employee record
router.post("/", requireRole("admin"), async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const coRes = await db.query("SELECT name FROM companies WHERE id = $1", [req.user.company_id]);
    const company_name = coRes.rows[0]?.name || null;

    const hashed = await bcrypt.hash(password || "Welcome123!", 10);
    const result = await db.query(
      `INSERT INTO users (name, email, password, role, company_name, company_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, name, email, role, company_name, created_at`,
      [name, email, hashed, role || "employee", company_name, req.user.company_id]
    );
    const user = result.rows[0];

    // Sync employee record (fire-and-forget style — don't fail the user creation)
    await syncEmployee({ name, email, role }, req.user.company_id).catch(() => {});

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update user — syncs name/email to employee record
router.put("/:id", requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;
  try {
    // Fetch old email before updating (needed to find the employee row)
    const old = await db.query(
      "SELECT email FROM users WHERE id=$1 AND company_id=$2",
      [id, req.user.company_id]
    );
    if (!old.rows[0]) return res.status(404).json({ error: "User not found" });
    const oldEmail = old.rows[0].email;

    const result = await db.query(
      `UPDATE users SET name=$1, email=$2, role=$3, updated_at=NOW()
       WHERE id=$4 AND company_id=$5
       RETURNING id, name, email, role, company_name, created_at`,
      [name, email, role, id, req.user.company_id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "User not found" });

    // Sync employee: update by old email (which may have changed)
    await db.query(
      "UPDATE employees SET name=$1, email=$2 WHERE email=$3 AND company_id=$4",
      [name, email, oldEmail, req.user.company_id]
    ).catch(() => {});

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE user — removes the matching employee record too
router.delete("/:id", requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      "DELETE FROM users WHERE id=$1 AND company_id=$2 RETURNING id, email",
      [id, req.user.company_id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "User not found" });

    await removeEmployee(result.rows[0].email, req.user.company_id).catch(() => {});

    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
