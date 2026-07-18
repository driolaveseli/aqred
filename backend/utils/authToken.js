const jwt = require("jsonwebtoken");
const db = require("../config/db");
const SECRET = require("../config/jwtSecret");
const { SUPER_ADMIN_PERMS } = require("../config/defaultRolePermissions");

// remember=true (the default - matches every caller except a "Keep me signed
// in" opt-out on the login form) issues a 30-day session; unchecked issues an
// 8h one. `remember` is embedded in the payload too so a later re-issue (e.g.
// changePassword's fresh token) can read it back off req.user and preserve it.
const signToken = (user, permissions, remember = true) =>
  jwt.sign(
    {
      id: user.id, name: user.name, email: user.email, role: user.role,
      company_id: user.company_id, company_name: user.company_name, permissions,
      mustChangePassword: !!user.must_change_password,
      remember,
    },
    SECRET,
    { expiresIn: remember ? "30d" : "8h" }
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

// remember=false omits maxAge entirely, making it a true browser session
// cookie the browser deletes on close - matching sessionStorage's own
// close-clears-it behavior for the cached user object in AuthContext.
const cookieOpts = (remember = true) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  ...(remember ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
});

module.exports = { signToken, fetchPermissions, cookieOpts };
