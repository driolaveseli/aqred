const jwt = require("jsonwebtoken");
const db = require("../config/db");
const SECRET = require("../config/jwtSecret");
const { SUPER_ADMIN_PERMS } = require("../config/defaultRolePermissions");

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

const fetchPermissions = async (role, companyId) => {
  // super_admin is platform-level (no company_id) and its permissions are
  // fixed — never editable through the per-company Roles & Permissions UI.
  if (role === "super_admin") return SUPER_ADMIN_PERMS;
  try {
    const r = await db.query(
      "SELECT permissions FROM role_permissions WHERE role = $1 AND company_id = $2",
      [role, companyId]
    );
    return r.rows[0]?.permissions || [];
  } catch {
    return [];
  }
};

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 8 * 60 * 60 * 1000,
};

module.exports = { signToken, fetchPermissions, COOKIE_OPTS };
