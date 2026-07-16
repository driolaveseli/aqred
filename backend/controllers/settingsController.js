const db = require("../config/db");
const bcrypt = require("bcrypt");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const { logEvent } = require("../utils/logger");
const { signToken, fetchPermissions, COOKIE_OPTS } = require("../utils/authToken");

// ─── helpers ─────────────────────────────────────────────────────────────────

const ensurePrefs = async (userId) => {
  await db.query(
    `INSERT INTO user_preferences (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
};

const getPrefsRow = async (userId) => {
  await ensurePrefs(userId);
  const r = await db.query("SELECT * FROM user_preferences WHERE user_id = $1", [userId]);
  return r.rows[0];
};

// ─── Profile ─────────────────────────────────────────────────────────────────

exports.getProfile = async (req, res) => {
  try {
    const r = await db.query(
      `SELECT u.id, u.name, u.email, u.role, COALESCE(c.name, u.company_name) AS company_name
       FROM users u LEFT JOIN companies c ON c.id = u.company_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: "User not found" });
    const prefs = await getPrefsRow(req.user.id);
    res.json({ ...r.rows[0], timezone: prefs.timezone });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Company name is a property of the company (see getCompany/updateCompany
// below), never edited from an individual's own profile — only name, email
// and timezone are personal.
exports.updateProfile = async (req, res) => {
  const { name, email, timezone } = req.body;
  try {
    // Check email uniqueness (excluding self)
    if (email) {
      const check = await db.query(
        "SELECT id FROM users WHERE email = $1 AND id != $2", [email, req.user.id]
      );
      if (check.rows.length > 0)
        return res.status(400).json({ error: "Email already in use by another account" });
    }
    const r = await db.query(
      `UPDATE users SET name=COALESCE($1,name), email=COALESCE($2,email), updated_at=NOW()
       WHERE id=$3 RETURNING id, name, email, role, company_name`,
      [name || null, email || null, req.user.id]
    );
    if (timezone) {
      await ensurePrefs(req.user.id);
      await db.query(
        "UPDATE user_preferences SET timezone=$1, updated_at=NOW() WHERE user_id=$2",
        [timezone, req.user.id]
      );
    }
    logEvent({ module: "settings", action: "profile_updated", req,
      description: `Profile updated for user ${req.user.id}` });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─── Company ─────────────────────────────────────────────────────────────────

exports.getCompany = async (req, res) => {
  try {
    if (!req.user.company_id) return res.status(404).json({ error: "No company associated with this account" });
    const co = await db.query("SELECT id, name FROM companies WHERE id = $1", [req.user.company_id]);
    if (!co.rows[0]) return res.status(404).json({ error: "Company not found" });
    const count = await db.query("SELECT count(*) FROM users WHERE company_id = $1", [req.user.company_id]);
    res.json({ id: co.rows[0].id, name: co.rows[0].name, memberCount: parseInt(count.rows[0].count, 10) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateCompany = async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Only company admins can rename the company" });
  const name = (req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Company name is required" });
  try {
    const taken = await db.query(
      "SELECT id FROM companies WHERE LOWER(name) = LOWER($1) AND id != $2",
      [name, req.user.company_id]
    );
    if (taken.rows.length > 0)
      return res.status(400).json({ error: "That company name is already taken" });
    const r = await db.query(
      "UPDATE companies SET name = $1 WHERE id = $2 RETURNING id, name",
      [name, req.user.company_id]
    );
    logEvent({ module: "settings", action: "company_renamed", req,
      description: `Company renamed to "${name}" by ${req.user.name}` });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─── Password ─────────────────────────────────────────────────────────────────

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: "currentPassword and newPassword are required" });
  if (newPassword.length < 6)
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  try {
    const r = await db.query("SELECT password FROM users WHERE id=$1", [req.user.id]);
    if (!r.rows[0]) return res.status(404).json({ error: "User not found" });
    const match = await bcrypt.compare(currentPassword, r.rows[0].password);
    if (!match) return res.status(401).json({ error: "Current password is incorrect" });
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query(
      "UPDATE users SET password=$1, must_change_password=false, updated_at=NOW() WHERE id=$2",
      [hashed, req.user.id]
    );
    logEvent({ level: "SECURITY", module: "settings", action: "password_changed", req,
      description: `Password changed for user ${req.user.id}` });

    // Re-issue a token without mustChangePassword — the one already in the
    // client's hands still carries the old flag for the rest of its 8h life.
    // company_name isn't in the JWT payload itself, so look it up fresh
    // (same COALESCE-join pattern login/me use) rather than lose it.
    const companyRow = await db.query(
      `SELECT COALESCE(c.name, u.company_name) AS company_name
       FROM users u LEFT JOIN companies c ON c.id = u.company_id WHERE u.id = $1`,
      [req.user.id]
    );
    const permissions = await fetchPermissions(req.user.role);
    const token = signToken({ ...req.user, must_change_password: false }, permissions);
    res.cookie("token", token, COOKIE_OPTS);
    res.json({
      message: "Password updated successfully",
      user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role,
        company_name: companyRow.rows[0]?.company_name, permissions, mustChangePassword: false },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─── 2FA ─────────────────────────────────────────────────────────────────────

exports.setup2FA = async (req, res) => {
  try {
    const userRow = await db.query("SELECT name, email FROM users WHERE id=$1", [req.user.id]);
    const user = userRow.rows[0];
    const secret = speakeasy.generateSecret({ name: `Aqred (${user.email})`, length: 20 });
    // Store secret temporarily (not yet enabled)
    await ensurePrefs(req.user.id);
    await db.query(
      "UPDATE user_preferences SET two_factor_secret=$1, updated_at=NOW() WHERE user_id=$2",
      [secret.base32, req.user.id]
    );
    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ secret: secret.base32, qrDataUrl });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.verify2FA = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "token is required" });
  try {
    const prefs = await getPrefsRow(req.user.id);
    if (!prefs.two_factor_secret)
      return res.status(400).json({ error: "2FA setup not started. Call setup first." });
    const valid = speakeasy.totp.verify({
      secret: prefs.two_factor_secret, encoding: "base32",
      token: token.replace(/\s/g, ""), window: 1,
    });
    if (!valid) return res.status(401).json({ error: "Invalid code. Please try again." });
    await db.query(
      "UPDATE user_preferences SET two_factor_enabled=true, updated_at=NOW() WHERE user_id=$1",
      [req.user.id]
    );
    logEvent({ level: "SECURITY", module: "settings", action: "2fa_enabled", req,
      description: `2FA enabled for user ${req.user.id}` });
    res.json({ message: "2FA enabled successfully" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.disable2FA = async (req, res) => {
  try {
    await db.query(
      "UPDATE user_preferences SET two_factor_enabled=false, two_factor_secret=NULL, updated_at=NOW() WHERE user_id=$1",
      [req.user.id]
    );
    logEvent({ level: "SECURITY", module: "settings", action: "2fa_disabled", req,
      description: `2FA disabled for user ${req.user.id}` });
    res.json({ message: "2FA disabled" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─── Notifications & Security Prefs ──────────────────────────────────────────

exports.getPreferences = async (req, res) => {
  try {
    const prefs = await getPrefsRow(req.user.id);
    res.json({
      notifications: prefs.notifications,
      two_factor_enabled: prefs.two_factor_enabled,
      session_timeout: prefs.session_timeout,
      password_expiry: prefs.password_expiry,
      theme: prefs.theme,
      timezone: prefs.timezone,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updatePreferences = async (req, res) => {
  const { notifications, session_timeout, password_expiry, theme, timezone } = req.body;
  try {
    await ensurePrefs(req.user.id);
    await db.query(
      `UPDATE user_preferences SET
        notifications  = COALESCE($1, notifications),
        session_timeout= COALESCE($2, session_timeout),
        password_expiry= COALESCE($3, password_expiry),
        theme          = COALESCE($4, theme),
        timezone       = COALESCE($5, timezone),
        updated_at     = NOW()
       WHERE user_id = $6`,
      [
        notifications != null ? JSON.stringify(notifications) : null,
        session_timeout != null ? session_timeout : null,
        password_expiry || null,
        theme || null,
        timezone || null,
        req.user.id,
      ]
    );
    res.json({ message: "Preferences saved" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─── Backup ──────────────────────────────────────────────────────────────────

exports.getBackupStatus = async (req, res) => {
  try {
    const last = await db.query(
      "SELECT * FROM system_backups ORDER BY created_at DESC LIMIT 1"
    );
    const setting = await db.query(
      "SELECT value FROM system_settings WHERE key='autoBackup'"
    );
    res.json({
      lastBackup: last.rows[0] || null,
      autoBackupEnabled: setting.rows[0]?.value === "true",
      nextScheduled: "Daily at 22:00 UTC",
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.triggerBackup = async (req, res) => {
  const fs   = require("fs");
  const path = require("path");
  try {
    const tables = ["users","employees","products","customers","orders","order_items","payments","suppliers","user_preferences"];
    const backup = {};
    for (const t of tables) {
      const r = await db.query(`SELECT * FROM ${t}`);
      backup[t] = r.rows;
    }
    const backupDir = path.join(__dirname, "../../backups");
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const filename = `backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    const content  = JSON.stringify(backup, null, 2);
    fs.writeFileSync(path.join(backupDir, filename), content);
    const sizeKb = Math.ceil(Buffer.byteLength(content) / 1024);
    const rec = await db.query(
      "INSERT INTO system_backups (status, message, size_kb) VALUES ('completed',$1,$2) RETURNING *",
      [`Backup saved: ${filename}`, sizeKb]
    );
    logEvent({ module: "settings", action: "backup_completed", req,
      description: `Manual backup: ${filename}` });
    res.json({ message: "Backup completed", record: rec.rows[0] });
  } catch (err) {
    await db.query(
      "INSERT INTO system_backups (status, message) VALUES ('failed',$1)",
      [err.message]
    ).catch(() => {});
    res.status(500).json({ error: err.message });
  }
};

// Shared helper used by the cron job in server.js (no req/res)
exports.runScheduledBackup = async () => {
  const fs   = require("fs");
  const path = require("path");
  try {
    const tables = ["users","employees","products","customers","orders","order_items","payments","suppliers","user_preferences"];
    const backup = {};
    for (const t of tables) {
      const r = await db.query(`SELECT * FROM ${t}`);
      backup[t] = r.rows;
    }
    const backupDir = path.join(__dirname, "../../backups");
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const filename = `backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    const content  = JSON.stringify(backup, null, 2);
    fs.writeFileSync(path.join(backupDir, filename), content);
    const sizeKb = Math.ceil(Buffer.byteLength(content) / 1024);
    await db.query(
      "INSERT INTO system_backups (status, message, size_kb) VALUES ('completed',$1,$2)",
      [`Scheduled backup: ${filename}`, sizeKb]
    );
    console.log(`✅ Scheduled backup completed: ${filename}`);
  } catch (err) {
    await db.query(
      "INSERT INTO system_backups (status, message) VALUES ('failed',$1)",
      [err.message]
    ).catch(() => {});
    console.error("❌ Scheduled backup failed:", err.message);
  }
};

// ─── System Settings (admin only) ────────────────────────────────────────────

exports.getSystemSettings = async (req, res) => {
  try {
    const r = await db.query("SELECT key, value FROM system_settings");
    const settings = {};
    r.rows.forEach(row => { settings[row.key] = row.value; });
    res.json(settings);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateSystemSettings = async (req, res) => {
  if (req.user?.role !== "admin")
    return res.status(403).json({ error: "Admin only" });
  const { currency, dateFormat, language, autoBackup, maintenanceMode } = req.body;
  try {
    const updates = { currency, dateFormat, language,
      autoBackup: autoBackup != null ? String(autoBackup) : null,
      maintenanceMode: maintenanceMode != null ? String(maintenanceMode) : null,
    };
    for (const [key, value] of Object.entries(updates)) {
      if (value != null) {
        await db.query(
          `INSERT INTO system_settings (key, value, updated_at) VALUES ($1,$2,NOW())
           ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW()`,
          [key, value]
        );
      }
    }
    // Invalidate the in-process maintenance-mode cache so it's re-read immediately
    try { require("../middleware/maintenanceMode").invalidateCache(); } catch {}
    logEvent({ module: "settings", action: "system_settings_updated", req,
      description: "System settings updated" });
    res.json({ message: "System settings saved" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
