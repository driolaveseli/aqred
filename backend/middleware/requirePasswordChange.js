// Blocks company-scoped routes until an admin-provisioned temporary password
// has been changed. /api/auth and /api/settings are mounted before this and
// stay reachable, which is what lets the change-password screen itself work.
const requirePasswordChange = (req, res, next) => {
  if (req.user?.mustChangePassword)
    return res.status(403).json({ error: "Password change required", code: "MUST_CHANGE_PASSWORD" });
  next();
};

module.exports = requirePasswordChange;
