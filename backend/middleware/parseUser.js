const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "mis_secret_key_2024";

/**
 * Non-blocking middleware: attaches req.user from JWT if present and valid.
 * Never rejects the request — routes that need strict auth use requireAdmin.
 */
const parseUser = (req, _res, next) => {
  try {
    const token = req.cookies?.token;
    if (token) {
      req.user = jwt.verify(token, SECRET);
    }
  } catch {
    // Invalid / expired token — leave req.user undefined
  }
  next();
};

module.exports = parseUser;
