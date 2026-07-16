const db = require("../config/db");

const PROTECTED_ROLES = ["admin", "manager", "employee", "super_admin"];

exports.getPermissions = async (req, res) => {
  try {
    const { company_id } = req.user;
    if (!company_id) return res.json({}); // super_admin has no company; nothing to show

    const result = await db.query(
      "SELECT role, permissions FROM role_permissions WHERE company_id = $1 ORDER BY role",
      [company_id]
    );
    const map = {};
    result.rows.forEach(r => { map[r.role] = r.permissions; });
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createRole = async (req, res) => {
  const { role, permissions } = req.body;
  const { company_id } = req.user;
  if (!company_id) return res.status(400).json({ error: "No company context for this account" });
  if (!role || typeof role !== "string")
    return res.status(400).json({ error: "Role name is required" });

  const normalized = role.trim().toLowerCase().replace(/\s+/g, "_");
  if (!normalized || normalized.length < 2)
    return res.status(400).json({ error: "Role name must be at least 2 characters" });
  if (PROTECTED_ROLES.includes(normalized))
    return res.status(400).json({ error: "Cannot create a role with that name" });
  if (!Array.isArray(permissions))
    return res.status(400).json({ error: "permissions must be an array" });

  try {
    const result = await db.query(
      `INSERT INTO role_permissions (role, permissions, company_id) VALUES ($1, $2, $3)
       ON CONFLICT (role, company_id) DO NOTHING
       RETURNING *`,
      [normalized, JSON.stringify(permissions), company_id]
    );
    if (!result.rows[0])
      return res.status(400).json({ error: `Role "${normalized}" already exists` });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePermissions = async (req, res) => {
  const { role } = req.params;
  const { permissions } = req.body;
  const { company_id } = req.user;
  if (!company_id) return res.status(400).json({ error: "No company context for this account" });
  if (!Array.isArray(permissions)) return res.status(400).json({ error: "permissions must be an array" });
  if (role === "admin" || role === "super_admin")
    return res.status(403).json({ error: "Admin permissions cannot be modified" });
  try {
    const result = await db.query(
      "UPDATE role_permissions SET permissions = $1 WHERE role = $2 AND company_id = $3 RETURNING *",
      [JSON.stringify(permissions), role, company_id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Role not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRole = async (req, res) => {
  const { role } = req.params;
  const { company_id } = req.user;
  if (!company_id) return res.status(400).json({ error: "No company context for this account" });
  if (PROTECTED_ROLES.includes(role))
    return res.status(403).json({ error: "Built-in roles cannot be deleted" });
  try {
    const result = await db.query(
      "DELETE FROM role_permissions WHERE role = $1 AND company_id = $2 RETURNING role",
      [role, company_id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Role not found" });
    res.json({ message: `Role "${role}" deleted` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
