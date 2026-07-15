const jwt = require("jsonwebtoken");
const SECRET = require("../config/jwtSecret");

/**
 * Strict middleware for admin-only routes.
 * Returns 401 if no valid token, 403 if role !== admin.
 */
const requireAdmin = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const decoded = jwt.verify(header.slice(7), SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = requireAdmin;
