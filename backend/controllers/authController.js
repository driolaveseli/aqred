const db = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const speakeasy = require("speakeasy");
const { logEvent } = require("../utils/logger");

const SECRET = require("../config/jwtSecret");
const { signToken, fetchPermissions, COOKIE_OPTS } = require("../utils/authToken");
const { ALL_PERMS, MANAGER_PERMS, EMPLOYEE_PERMS } = require("../config/defaultRolePermissions");

// A bcrypt hash with no matching password, used to keep login's response time
// constant whether or not the email exists — otherwise a nonexistent email
// returns immediately while a wrong password takes a real bcrypt.compare,
// letting an attacker enumerate valid emails purely by timing the response.
const DUMMY_HASH = "$2b$10$FC9EM8HbhN6l6gEZdTn8kOgotn2BRf.iwTmDvptWWuv/Oxr5XLfmi";

// Short-lived token issued when 2FA is required — only authorises the 2FA step
const signTempToken = (userId) =>
  jwt.sign({ id: userId, twoFAPending: true }, SECRET, { expiresIn: "5m" });

// Sends a real email if SMTP is configured, otherwise logs it — same fallback
// used everywhere in this app so the flow is demonstrable without SMTP creds.
const sendMail = async ({ to, subject, html, fallbackLabel }) => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({ from: `"Aqred MIS" <${process.env.SMTP_USER}>`, to, subject, html });
  } else {
    console.log(`[${fallbackLabel}] To: ${to}\n${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}`);
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query(
      `SELECT u.*, COALESCE(c.name, u.company_name) AS company_name, c.is_active AS company_is_active
       FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE u.email = $1`,
      [email]
    );
    if (result.rows.length === 0) {
      await bcrypt.compare(password, DUMMY_HASH); // constant-time-ish: don't let timing reveal the email doesn't exist
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

    // company_is_active is NULL for super_admin (no company_id), so this
    // only ever blocks company-scoped users of a suspended tenant.
    if (user.company_is_active === false) {
      logEvent({ level: "WARNING", module: "auth", action: "login_blocked_suspended", req,
        description: `Login blocked for ${user.name} (${email}) - company is suspended` });
      return res.status(403).json({ message: "Your company's account has been suspended. Contact support.", code: "COMPANY_SUSPENDED" });
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

    const permissions = await fetchPermissions(user.role, user.company_id);
    const token = signToken(user, permissions);

    req.user = { id: user.id, name: user.name, role: user.role };
    logEvent({ level: "INFO", module: "auth", action: "login", req,
      description: `${user.name} logged in (${user.role})` });

    // Token only ever goes in the httpOnly cookie, never the JSON body — a
    // token in response.data is readable by any JS, which defeats the point
    // of httpOnly (keeping it out of reach of XSS).
    res.cookie("token", token, COOKIE_OPTS);
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, company_name: user.company_name, permissions, mustChangePassword: !!user.must_change_password },
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
      `SELECT u.*, COALESCE(c.name, u.company_name) AS company_name, c.is_active AS company_is_active
       FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE u.id = $1`,
      [payload.id]
    );
    if (!userResult.rows[0]) return res.status(404).json({ message: "User not found" });
    const user = userResult.rows[0];

    if (user.company_is_active === false) {
      logEvent({ level: "WARNING", module: "auth", action: "login_blocked_suspended", req,
        description: `2FA login blocked for ${user.name} - company is suspended` });
      return res.status(403).json({ message: "Your company's account has been suspended. Contact support.", code: "COMPANY_SUSPENDED" });
    }

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

    const permissions = await fetchPermissions(user.role, user.company_id);
    const token = signToken(user, permissions);

    req.user = { id: user.id, name: user.name, role: user.role };
    logEvent({ level: "SECURITY", module: "auth", action: "login_2fa", req,
      description: `${user.name} completed 2FA login` });

    // Token only ever goes in the httpOnly cookie, never the JSON body — a
    // token in response.data is readable by any JS, which defeats the point
    // of httpOnly (keeping it out of reach of XSS).
    res.cookie("token", token, COOKIE_OPTS);
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, company_name: user.company_name, permissions, mustChangePassword: !!user.must_change_password },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.register = async (req, res) => {
  const { firstName, lastName, email, password, company } = req.body;
  const name = `${firstName || ""} ${lastName || ""}`.trim();

  if (!name)
    return res.status(400).json({ message: "First and last name are required" });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ message: "A valid email address is required" });
  if (!password || password.length < 8)
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  if (!company || !company.trim())
    return res.status(400).json({ message: "Company name is required" });

  try {
    const exists = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (exists.rows.length > 0)
      return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const companyName = company.trim();

    // Two paths: join an existing company as an employee, or create a brand
    // new one and become its admin (first user of a company is always its
    // admin — mirrors how the super-admin "create company" flow provisions
    // the first admin in routes/superAdmin.js).
    const coRes = await db.query("SELECT id, name FROM companies WHERE LOWER(name) = LOWER($1)", [companyName]);
    let companyId, role, finalCompanyName;
    if (coRes.rows[0]) {
      companyId = coRes.rows[0].id;
      finalCompanyName = coRes.rows[0].name;
      role = "employee";
    } else {
      const newCo = await db.query("INSERT INTO companies (name) VALUES ($1) RETURNING id, name", [companyName]);
      companyId = newCo.rows[0].id;
      finalCompanyName = newCo.rows[0].name;
      role = "admin";

      // role_permissions is scoped per company (see migrate.js) — a fresh
      // company starts with no rows at all until this seeds them, same as
      // the super-admin "create company" flow in routes/superAdmin.js.
      await db.query(
        `INSERT INTO role_permissions (role, permissions, company_id) VALUES
           ('admin',    $1, $4),
           ('manager',  $2, $4),
           ('employee', $3, $4)`,
        [JSON.stringify(ALL_PERMS), JSON.stringify(MANAGER_PERMS), JSON.stringify(EMPLOYEE_PERMS), companyId]
      );
    }

    const result = await db.query(
      "INSERT INTO users (name, email, password, role, company_name, company_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, company_name, company_id",
      [name, email, hashed, role, finalCompanyName, companyId]
    );
    const user = result.rows[0];
    const permissions = await fetchPermissions(user.role, user.company_id);
    const token = signToken(user, permissions);
    req.user = { id: user.id, name: user.name, role: user.role };
    logEvent({ level: "INFO", module: "auth", action: "register", req,
      description: role === "admin"
        ? `New company "${finalCompanyName}" created by ${name} (${email})`
        : `New account registered: ${name} (${email}), joined ${finalCompanyName}` });
    res.cookie("token", token, COOKIE_OPTS);
    res.status(201).json({ user: { ...user, permissions, mustChangePassword: false }, companyCreated: role === "admin" });
  } catch (err) {
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
};

// GET /api/auth/check-company?name=... — public, read-only lookup used by the
// registration wizard to tell the user upfront whether they're joining an
// existing company or about to create a new one.
exports.checkCompany = async (req, res) => {
  const name = (req.query.name || "").trim();
  if (!name) return res.status(400).json({ message: "name is required" });
  try {
    const r = await db.query("SELECT name FROM companies WHERE LOWER(name) = LOWER($1)", [name]);
    res.json({ exists: r.rows.length > 0, name: r.rows[0]?.name || name });
  } catch (err) {
    res.status(500).json({ message: "Lookup failed" });
  }
};

// POST /api/auth/invite-teammates — only the admin who just created a company
// can invite others into it (registration's "create new company" path).
exports.inviteTeammates = async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Only company admins can invite teammates" });

  const emails = Array.isArray(req.body.emails) ? req.body.emails.filter(Boolean).slice(0, 5) : [];
  if (emails.length === 0) return res.status(400).json({ message: "At least one email is required" });

  try {
    const companyName = req.user.company_name || "your company";
    const results = [];
    for (const email of emails) {
      const exists = await db.query("SELECT id FROM users WHERE email = $1", [email]);
      if (exists.rows.length > 0) {
        results.push({ email, status: "already_registered" });
        continue;
      }
      await sendMail({
        to: email,
        subject: `${req.user.name} invited you to join ${companyName} on Aqred`,
        fallbackLabel: "Teammate Invite",
        html: `<p>${req.user.name} has invited you to join <strong>${companyName}</strong> on Aqred.</p>
               <p><a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/register?company=${encodeURIComponent(companyName)}">Create your account</a> to get started.</p>`,
      });
      results.push({ email, status: "invited" });
    }
    logEvent({ level: "INFO", module: "auth", action: "invite_teammates", req,
      description: `${req.user.name} invited ${results.filter(r => r.status === "invited").length} teammate(s) to ${companyName}` });
    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: "Failed to send invites" });
  }
};

exports.logout = (_req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
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

      await sendMail({
        to: email,
        subject: "Rivendosja e fjalëkalimit — Aqred MIS",
        fallbackLabel: "Password Reset",
        html: `<p>Përshëndetje ${result.rows[0].name},</p>
               <p>Token-i juaj i rivendosjes (i vlefshëm 15 min):</p>
               <pre>${resetToken}</pre>
               <p>Nëse nuk e keni kërkuar ju, injoroni këtë email.</p>`,
      });
    }
    res.json({ message: "If this email is registered, you will receive reset instructions." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.company_id,
              COALESCE(c.name, u.company_name) AS company_name
       FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });
    const user = result.rows[0];
    const permissions = await fetchPermissions(user.role, user.company_id);
    res.json({ ...user, permissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
