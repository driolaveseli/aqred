const express    = require("express");
const cors       = require("cors");
const cookieParser = require("cookie-parser");
const cron       = require("node-cron");
const rateLimit  = require("express-rate-limit");
const migrate    = require("./config/migrate");
const db         = require("./config/db");
const maintenanceMode = require("./middleware/maintenanceMode");

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(require("./middleware/parseUser")); // attaches req.user from JWT (non-blocking)

// ── Rate limiting on auth endpoints (brute-force protection) ─────────────────
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
app.use("/api/auth/login",  loginLimiter);
app.use("/api/auth/2fa",    loginLimiter);

const registerLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });
app.use("/api/auth/register", registerLimiter);

// Public, unauthenticated lookup used by the registration wizard — more generous than register/login
const checkCompanyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
app.use("/api/auth/check-company", checkCompanyLimiter);

// Public contact form — generous enough for a real visitor, tight enough to block spam scripts
const contactLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
app.use("/api/contact", contactLimiter);

// ── Routes that bypass maintenance mode (auth + settings always accessible) ──
app.use("/api/auth",     require("./routes/auth"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/contact",  require("./routes/contact"));

// ── Maintenance-mode gate — blocks non-admin users when enabled ───────────────
app.use(maintenanceMode);

// ── Require valid JWT for all remaining routes ────────────────────────────────
const { verifyToken, blockSuperAdmin } = require("./middleware/authMiddleware");
app.use("/api", verifyToken);
app.use("/api", require("./middleware/requirePasswordChange"));

// ── Super-admin platform routes (no company scoping) ─────────────────────────
app.use("/api/super-admin", require("./routes/superAdmin"));

// ── Shared routes (admin + super_admin, scoped internally by role) ────────────
app.use("/api/logs",          require("./routes/logs"));
app.use("/api/notifications", require("./routes/notifications"));

// ── Company-scoped routes (super_admin blocked — they have no company data) ───
app.use("/api", blockSuperAdmin);
app.use("/api/staff",     require("./routes/staff"));
app.use("/api/employees", require("./routes/employees")); // read-only, see routes/employees.js
app.use("/api/products",  require("./routes/products"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/orders",    require("./routes/orders"));
app.use("/api/activity",  require("./routes/activity"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/suppliers", require("./routes/suppliers"));
app.use("/api/sales",     require("./routes/sales"));
app.use("/api/payments",  require("./routes/payments"));
app.use("/api/roles",     require("./routes/roles"));

// ── Startup: run migrations then start the server ────────────────────────────
migrate().then(() => {
  app.listen(5000, () => console.log("🚀 Server running on port 5000"));

  // ── Daily backup at 22:00 UTC (only if autoBackup is enabled) ──────────────
  cron.schedule("0 22 * * *", async () => {
    try {
      const r = await db.query(
        "SELECT value FROM system_settings WHERE key = 'autoBackup'"
      );
      if (r.rows[0]?.value !== "true") return;
      console.log("⏰ Running scheduled backup…");
      const { runScheduledBackup } = require("./controllers/settingsController");
      await runScheduledBackup();
    } catch (err) {
      console.error("❌ Cron backup error:", err.message);
    }
  }, { timezone: "UTC" });
});
