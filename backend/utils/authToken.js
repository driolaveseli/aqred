const jwt = require("jsonwebtoken");
const db = require("../config/db");
const SECRET = require("../config/jwtSecret");

const signToken = (user, permissions) =>
  jwt.sign(
    {
      id: user.id, name: user.name, email: user.email, role: user.role,
      company_id: user.company_id, permissions,
      mustChangePassword: !!user.must_change_password,
    },
    SECRET,
    { expiresIn: "8h" }
  );

const fetchPermissions = async (role) => {
  try {
    const r = await db.query("SELECT permissions FROM role_permissions WHERE role = $1", [role]);
    return r.rows[0]?.permissions || [];
  } catch {
    return [];
  }
};

module.exports = { signToken, fetchPermissions };
