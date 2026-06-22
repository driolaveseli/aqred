const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "mis_secret_key_2024";

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: "Forbidden: insufficient permissions" });
  next();
};

// Blocks super_admin from accessing company-scoped data routes
const blockSuperAdmin = (req, res, next) => {
  if (req.user?.role === "super_admin")
    return res.status(403).json({ message: "Super admin does not have access to company data routes. Use /api/super-admin." });
  next();
};

module.exports = { verifyToken, requireRole, blockSuperAdmin };
