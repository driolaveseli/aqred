const db = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const speakeasy = require("speakeasy");
const { logEvent } = require("../utils/logger");

const SECRET = require("../config/jwtSecret");

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 8 * 60 * 60 * 1000,
};

const signToken = (user, permissions) =>
  jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, company_id: user.company_id, permissions },
    SECRET,
    { expiresIn: "8h" }
  );

// Short-lived token issued when 2FA is required — only authorises the 2FA step
const signTempToken = (userId) =>
  jwt.sign({ id: userId, twoFAPending: true }, SECRET, { expiresIn: "5m" });

const fetchPermissions = async (role) => {
  try {
    const r = await db.query("SELECT permissions FROM role_permissions WHERE role = $1", [role]);
    return r.rows[0]?.permissions || [];
  } catch {
    return [];
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query(
      `SELECT u.*, COALESCE(c.name, u.company_name) AS company_name
       FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE u.email = $1`,
      [email]
    );
    if (result.rows.length === 0) {
      logEvent({ level: "SECURITY", module: "auth", action: "login_failed", req,
        description: `Failed login attempt for email: ${email}` });
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logEvent({ level: "SECURITY", module: "auth", action: "login_failed", req,
        description: `Failed login attempt for ${user.name} (${email})` });
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if 2FA is enabled for this user
    const prefsResult = await db.query(
      "SELECT two_factor_enabled FROM user_preferences WHERE user_id = $1",
      [user.id]
    );
    const twoFAEnabled = prefsResult.rows[0]?.two_factor_enabled === true;

    if (twoFAEnabled) {
      // Issue a short-lived temp token — real JWT only after TOTP is verified
      const tempToken = signTempToken(user.id);
      return res.json({ requires2FA: true, tempToken });
    }

    const permissions = await fetchPermissions(user.role);
    const token = signToken(user, permissions);

    req.user = { id: user.id, name: user.name, role: user.role };
    logEvent({ level: "INFO", module: "auth", action: "login", req,
      description: `${user.name} logged in (${user.role})` });

    res.cookie("token", token, COOKIE_OPTS);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, company_name: user.company_name, permissions },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verify2FALogin = async (req, res) => {
  const { tempToken, totpCode } = req.body;
  if (!tempToken || !totpCode)
    return res.status(400).json({ message: "tempToken and totpCode are required" });
  try {
    // Validate the temp token
    let payload;
    try {
      payload = jwt.verify(tempToken, SECRET);
    } catch {
      return res.status(401).json({ message: "2FA session expired. Please log in again." });
    }
    if (!payload.twoFAPending)
      return res.status(400).json({ message: "Invalid token type" });

    // Fetch user + their TOTP secret
    const userResult = await db.query(
      `SELECT u.*, COALESCE(c.name, u.company_name) AS company_name
       FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE u.id = $1`,
      [payload.id]
    );
    if (!userResult.rows[0]) return res.status(404).json({ message: "User not found" });
    const user = userResult.rows[0];

    const prefsResult = await db.query(
      "SELECT two_factor_secret FROM user_preferences WHERE user_id = $1",
      [user.id]
    );
    const secret = prefsResult.rows[0]?.two_factor_secret;
    if (!secret) return res.status(400).json({ message: "2FA not configured" });

    const valid = speakeasy.totp.verify({
      secret, encoding: "base32",
      token: totpCode.replace(/\s/g, ""), window: 1,
    });
    if (!valid) return res.status(401).json({ message: "Invalid verification code. Please try again." });

    const permissions = await fetchPermissions(user.role);
    const token = signToken(user, permissions);

    req.user = { id: user.id, name: user.name, role: user.role };
    logEvent({ level: "SECURITY", module: "auth", action: "login_2fa", req,
      description: `${user.name} completed 2FA login` });

    res.cookie("token", token, COOKIE_OPTS);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, company_name: user.company_name, permissions },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.register = async (req, res) => {
  const { firstName, lastName, email, password, company } = req.body;
  const name = `${firstName || ""} ${lastName || ""}`.trim() || email;
  try {
    const exists = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (exists.rows.length > 0)
      return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    // Registration always creates an employee.
    // Company admins are assigned exclusively by the super admin.
    let companyId;
    if (company) {
      // Link to existing company — never auto-create to prevent squatting
      const coRes = await db.query("SELECT id FROM companies WHERE LOWER(name) = LOWER($1)", [company]);
      if (!coRes.rows[0])
        return res.status(400).json({ message: "Company not found. Please contact your system administrator." });
      companyId = coRes.rows[0].id;
    } else {
      const coRes = await db.query("SELECT id FROM companies WHERE name = 'Aqred'");
      companyId = coRes.rows[0]?.id;
    }

    const result = await db.query(
      "INSERT INTO users (name, email, password, role, company_name, company_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, company_name, company_id",
      [name, email, hashed, "employee", company || null, companyId]
    );
    const user = result.rows[0];
    const permissions = await fetchPermissions(user.role);
    const token = signToken(user, permissions);
    req.user = { id: user.id, name: user.name, role: user.role };
    logEvent({ level: "INFO", module: "auth", action: "register", req,
      description: `New account registered: ${name} (${email})` });
    res.cookie("token", token, COOKIE_OPTS);
    res.status(201).json({ user: { ...user, permissions } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.logout = (_req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "strict" });
  res.json({ message: "Logged out" });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });
  try {
    const result = await db.query("SELECT id, name FROM users WHERE email = $1", [email]);
    if (result.rows[0]) {
      const resetToken = jwt.sign({ id: result.rows[0].id, purpose: "reset" }, SECRET, { expiresIn: "15m" });
      logEvent({ level: "SECURITY", module: "auth", action: "forgot_password",
        description: `Password reset requested for ${email}` });

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const nodemailer = require("nodemailer");
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        await transporter.sendMail({
          from: `"Aqred MIS" <${process.env.SMTP_USER}>`,
          to: email,
          subject: "Rivendosja e fjalëkalimit — Aqred MIS",
          html: `<p>Përshëndetje ${result.rows[0].name},</p>
                 <p>Token-i juaj i rivendosjes (i vlefshëm 15 min):</p>
                 <pre>${resetToken}</pre>
                 <p>Nëse nuk e keni kërkuar ju, injoroni këtë email.</p>`,
        });
      } else {
        console.log(`[Password Reset] Token for ${email}: ${resetToken}`);
      }
    }
    res.json({ message: "If this email is registered, you will receive reset instructions." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.role,
              COALESCE(c.name, u.company_name) AS company_name
       FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });
    const user = result.rows[0];
    const permissions = await fetchPermissions(user.role);
    res.json({ ...user, permissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
