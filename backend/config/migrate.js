const db = require("./db");

// ── Migration tracking ────────────────────────────────────────────────────────
// Previously this whole file re-ran on every server boot, relying on
// CREATE TABLE IF NOT EXISTS / ALTER TABLE ADD COLUMN IF NOT EXISTS everywhere
// to make that safe. That works but doesn't scale: every restart re-executes
// every ALTER/UPDATE ever written, forever. `schema_migrations` now records
// which named migrations have already run, so each one executes exactly once.
//
// The pre-existing body of this file (~460 lines, all still fully idempotent)
// is kept as a single migration, "001_legacy_bootstrap", rather than being
// sliced into artificial fine-grained steps — its statements are ordered and
// interdependent (e.g. companies before anything that FKs into it), so
// splitting it apart is a real risk for very little benefit. New migrations
// from this point on are added as new, separately-tracked entries below.
const ensureMigrationsTable = () =>
  db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(100) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `);

const legacyBootstrap = async () => {
  // ── companies table must exist first (many other tables FK into it) ─────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS companies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.query(`INSERT INTO companies (name) VALUES ('Aqred') ON CONFLICT (name) DO NOTHING`);

  // Users table (auth + RBAC)
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'employee',
      company_name VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Set on any admin-provisioned account (new staff, a password reset, a
  // company/admin created via the super-admin panel) — cleared once the
  // user changes their own password. Enforced in requirePasswordChange.js.
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false`);

  // Core business tables — these were historically created by hand outside
  // of any migration script, so a genuinely fresh database was missing them
  // entirely (every ALTER TABLE below would fail silently). Shapes here
  // match the columns added further down, so those ALTERs become no-ops
  // on a table created fresh from this block.
  await db.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      password VARCHAR(255),
      position VARCHAR(50),
      salary NUMERIC,
      department VARCHAR(50),
      status VARCHAR(20) DEFAULT 'Active',
      company_id INTEGER REFERENCES companies(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      price NUMERIC NOT NULL,
      stock INTEGER DEFAULT 0,
      sku VARCHAR(50) UNIQUE,
      category VARCHAR(50),
      reorder_point INTEGER DEFAULT 10,
      company_id INTEGER REFERENCES companies(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      phone VARCHAR(20),
      address TEXT,
      company VARCHAR(100),
      status VARCHAR(20) DEFAULT 'Active',
      company_id INTEGER REFERENCES companies(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id),
      employee_id INTEGER REFERENCES employees(id),
      order_date TIMESTAMP DEFAULT NOW(),
      status VARCHAR(50) DEFAULT 'pending',
      total NUMERIC,
      due_date DATE,
      notes TEXT,
      company_id INTEGER REFERENCES companies(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      company_name VARCHAR(255) NOT NULL,
      contact_person VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      location VARCHAR(255),
      category VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Active',
      products_supplied TEXT,
      company_id INTEGER REFERENCES companies(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add missing columns (safe — IF NOT EXISTS)
  await db.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS department VARCHAR(50)`);
  await db.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active'`);
  await db.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(50)`);
  await db.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(50)`);
  await db.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS company VARCHAR(100)`);
  await db.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active'`);
  await db.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 10`);
  await db.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS due_date DATE`);
  await db.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT`);
  // Allow creating sales without assigning an employee
  await db.query(`ALTER TABLE orders ALTER COLUMN employee_id DROP NOT NULL`);

  // order_items: one row per product line in a sale
  await db.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price DECIMAL(10,2) NOT NULL
    )
  `);

  // payments: payment records linked to orders
  await db.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      amount DECIMAL(10,2) NOT NULL,
      method VARCHAR(50) DEFAULT 'Bank Transfer',
      status VARCHAR(20) DEFAULT 'Pending',
      payment_date TIMESTAMP DEFAULT NOW(),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // system_logs: audit trail for all module actions
  await db.query(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id SERIAL PRIMARY KEY,
      timestamp TIMESTAMP DEFAULT NOW(),
      level VARCHAR(20) DEFAULT 'INFO',
      module VARCHAR(50),
      action VARCHAR(100),
      user_id INTEGER,
      user_name VARCHAR(100),
      user_role VARCHAR(20),
      description TEXT,
      ip_address VARCHAR(50),
      metadata JSONB
    )
  `);
  // Add company_id to system_logs for multi-tenant scoping
  await db.query(`ALTER TABLE system_logs ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id)`);
  // users.company_id is normally added further down, but the backfill below
  // reads it — ensure it exists first (safe/idempotent if already added).
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id)`);
  // Backfill existing logs by looking up the user's company
  await db.query(`
    UPDATE system_logs sl SET company_id = u.company_id
    FROM users u WHERE u.id = sl.user_id AND sl.company_id IS NULL
  `);

  // role_permissions: stores which named permissions each role has, scoped
  // per company — a single global row per role meant one company's admin
  // editing "manager" permissions changed behavior for every company on the
  // platform. super_admin's permissions are fixed platform-wide and hardcoded
  // in authToken.js instead (it was never editable through this UI anyway).
  await db.query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role VARCHAR(20) NOT NULL,
      permissions JSONB NOT NULL DEFAULT '[]',
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE
    )
  `);
  await db.query(`ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE`);
  // Drop the old role-only PK before backfilling — otherwise inserting a second
  // row for the same role name (one per company) violates the old constraint.
  await db.query(`ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS role_permissions_pkey`);

  // One-time backfill for databases created before per-company scoping:
  // duplicate each legacy global row (company_id IS NULL) for a company-
  // scoped role into one row per existing company, then drop the legacy row.
  const legacyRoles = await db.query(
    `SELECT role, permissions FROM role_permissions WHERE company_id IS NULL AND role IN ('admin','manager','employee')`
  );
  if (legacyRoles.rows.length > 0) {
    const allCompanies = await db.query(`SELECT id FROM companies`);
    for (const { role, permissions } of legacyRoles.rows) {
      for (const { id: companyId } of allCompanies.rows) {
        const already = await db.query(
          `SELECT 1 FROM role_permissions WHERE role = $1 AND company_id = $2`,
          [role, companyId]
        );
        if (already.rows.length === 0) {
          await db.query(
            `INSERT INTO role_permissions (role, permissions, company_id) VALUES ($1, $2, $3)`,
            [role, JSON.stringify(permissions), companyId]
          );
        }
      }
    }
    await db.query(`DELETE FROM role_permissions WHERE company_id IS NULL AND role IN ('admin','manager','employee')`);
    console.log("✅ Backfilled role_permissions to per-company rows");
  }
  // super_admin permissions are hardcoded now (see authToken.js) — drop any legacy row
  await db.query(`DELETE FROM role_permissions WHERE role = 'super_admin'`);

  // Every remaining row is now company-scoped — enforce it.
  await db.query(`ALTER TABLE role_permissions ALTER COLUMN company_id SET NOT NULL`);
  await db.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_role_company_unique'
      ) THEN
        ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_role_company_unique UNIQUE (role, company_id);
      END IF;
    END $$
  `);

  // Seed default permissions for the bootstrap "Aqred" company only if it has none yet
  const { ALL_PERMS, MANAGER_PERMS, EMPLOYEE_PERMS } = require("./defaultRolePermissions");
  const aqredId = (await db.query(`SELECT id FROM companies WHERE name = 'Aqred'`)).rows[0]?.id;
  const existing = await db.query("SELECT COUNT(*) FROM role_permissions WHERE company_id = $1", [aqredId]);
  if (parseInt(existing.rows[0].count) === 0) {
    await db.query("INSERT INTO role_permissions (role, permissions, company_id) VALUES ($1,$2,$3)", ["admin",    JSON.stringify(ALL_PERMS),      aqredId]);
    await db.query("INSERT INTO role_permissions (role, permissions, company_id) VALUES ($1,$2,$3)", ["manager",  JSON.stringify(MANAGER_PERMS),   aqredId]);
    await db.query("INSERT INTO role_permissions (role, permissions, company_id) VALUES ($1,$2,$3)", ["employee", JSON.stringify(EMPLOYEE_PERMS),  aqredId]);
    console.log("✅ Default role permissions seeded for Aqred");
  }

  // user_preferences: per-user settings (notifications, security, theme, timezone)
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      notifications JSONB NOT NULL DEFAULT '{}',
      two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
      two_factor_secret TEXT,
      session_timeout INTEGER NOT NULL DEFAULT 30,
      password_expiry VARCHAR(10) NOT NULL DEFAULT '90',
      theme VARCHAR(20) NOT NULL DEFAULT 'Light',
      timezone VARCHAR(50) NOT NULL DEFAULT 'UTC-5 (Eastern Time)',
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // system_settings: global key-value configuration (admin-managed)
  await db.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key VARCHAR(50) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  // Seed global system defaults only once
  const sysCount = await db.query("SELECT COUNT(*) FROM system_settings");
  if (parseInt(sysCount.rows[0].count) === 0) {
    const defaults = [
      ["currency", "USD"], ["dateFormat", "MM/DD/YYYY"],
      ["language", "English"], ["autoBackup", "true"], ["maintenanceMode", "false"],
    ];
    for (const [key, value] of defaults) {
      await db.query("INSERT INTO system_settings (key, value) VALUES ($1,$2)", [key, value]);
    }
  }

  // system_backups: records each backup run (scheduled or manual)
  await db.query(`
    CREATE TABLE IF NOT EXISTS system_backups (
      id SERIAL PRIMARY KEY,
      status VARCHAR(20) DEFAULT 'completed',
      message TEXT,
      size_kb INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // ── Company Tenancy ───────────────────────────────────────────────
  // Seed company rows from any pre-existing user company_name values
  await db.query(`
    INSERT INTO companies (name)
    SELECT DISTINCT company_name FROM users
    WHERE company_name IS NOT NULL
    ON CONFLICT (name) DO NOTHING
  `);

  // Add company_id FK to users
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id)`);
  // Backfill users whose company_name matches a companies row
  await db.query(`
    UPDATE users u SET company_id = c.id
    FROM companies c WHERE c.name = u.company_name AND u.company_id IS NULL
  `);
  // Any remaining non-super_admin with null company_name → Aqred
  // super_admin intentionally has company_id = NULL (platform-level)
  await db.query(`
    UPDATE users SET company_id = (SELECT id FROM companies WHERE name = 'Aqred')
    WHERE company_id IS NULL AND role != 'super_admin'
  `);

  // Add company_id FK to all business-data tables
  await db.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id)`);
  await db.query(`ALTER TABLE products  ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id)`);
  await db.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id)`);
  await db.query(`ALTER TABLE orders    ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id)`);
  await db.query(`ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id)`);

  // Backfill all pre-tenancy rows to Aqred
  const biz = `(SELECT id FROM companies WHERE name = 'Aqred')`;
  await db.query(`UPDATE employees SET company_id = ${biz} WHERE company_id IS NULL`);
  await db.query(`UPDATE products  SET company_id = ${biz} WHERE company_id IS NULL`);
  await db.query(`UPDATE customers SET company_id = ${biz} WHERE company_id IS NULL`);
  await db.query(`UPDATE orders    SET company_id = ${biz} WHERE company_id IS NULL`);
  await db.query(`UPDATE suppliers SET company_id = ${biz} WHERE company_id IS NULL`);

  // Seed the platform-level super admin (company_id intentionally NULL)
  // Check for the specific canonical email so this runs even if an old
  // super_admin row exists with a different email/password.
  const saExists = await db.query(
    "SELECT id FROM users WHERE email = 'superadmin@aqred.com' AND role = 'super_admin' LIMIT 1"
  );
  if (saExists.rows.length === 0) {
    const bcrypt = require("bcrypt");
    const hashed = await bcrypt.hash("superadmin123", 10);
    // must_change_password: true — this is a well-known demo password
    // documented in the README, not a real credential. Force it to be
    // replaced before the account can do anything, same as any other
    // admin-provisioned account.
    await db.query(
      `INSERT INTO users (name, email, password, role, company_name, company_id, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (email) DO UPDATE
         SET password = EXCLUDED.password,
             role     = EXCLUDED.role,
             company_id = NULL`,
      ["Super Admin", "superadmin@aqred.com", hashed, "super_admin", null, null]
    );
    console.log("✅ Super Admin seeded: superadmin@aqred.com / superadmin123 (password change required on first login)");
  }

  // Seed a default company admin for Aqred if none exists
  const adminExists = await db.query("SELECT id FROM users WHERE role='admin' LIMIT 1");
  if (adminExists.rows.length === 0) {
    const bcrypt = require("bcrypt");
    const hashed = await bcrypt.hash("admin123", 10);
    // Same reasoning as the super admin above — force a real password before use.
    await db.query(
      `INSERT INTO users (name, email, password, role, company_name, company_id, must_change_password)
       VALUES ($1, $2, $3, $4, $5, (SELECT id FROM companies WHERE name = 'Aqred'), true)`,
      ["Admin User", "admin@aqred.com", hashed, "admin", "Aqred"]
    );
    console.log("✅ Default company admin seeded: admin@aqred.com / admin123 (password change required on first login)");
  }

  // Retroactively close the same gap for databases that seeded these two
  // bootstrap accounts before must_change_password was added above — force
  // it on if (and only if) the account is still sitting at the documented
  // default password, so an admin who already changed theirs is untouched.
  {
    const bcrypt = require("bcrypt");
    for (const [email, defaultPassword] of [
      ["superadmin@aqred.com", "superadmin123"],
      ["admin@aqred.com", "admin123"],
    ]) {
      const row = await db.query(
        "SELECT id, password FROM users WHERE email = $1 AND must_change_password = false",
        [email]
      );
      if (row.rows[0] && await bcrypt.compare(defaultPassword, row.rows[0].password)) {
        await db.query("UPDATE users SET must_change_password = true WHERE id = $1", [row.rows[0].id]);
        console.log(`✅ ${email} is still at its default password — forcing a change on next login`);
      }
    }
  }

  // Fix employees email uniqueness: global unique → per-company unique
  await db.query('ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_email_key');
  await db.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'employees_email_company_unique'
      ) THEN
        ALTER TABLE employees ADD CONSTRAINT employees_email_company_unique UNIQUE (email, company_id);
      END IF;
    END $$
  `);

  // Reset employees PK sequence to avoid conflicts after manual inserts
  await db.query("SELECT setval('employees_id_seq', COALESCE((SELECT MAX(id) FROM employees), 1))");

  // Backfill: create employee records for any user that doesn't have one yet
  await db.query(`
    INSERT INTO employees (name, email, position, status, company_id)
    SELECT u.name, u.email,
      CASE u.role WHEN 'admin' THEN 'Administrator' WHEN 'manager' THEN 'Manager' ELSE 'Employee' END,
      'Active', u.company_id
    FROM users u
    WHERE u.company_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM employees e WHERE e.email = u.email AND e.company_id = u.company_id
      )
  `);

  // notifications: company-scoped event notifications (must be after companies table)
  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      title VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(20) DEFAULT 'info',
      link VARCHAR(200),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  // notification_reads: per-user read tracking (avoids duplicating rows per user)
  await db.query(`
    CREATE TABLE IF NOT EXISTS notification_reads (
      notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      read_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (notification_id, user_id)
    )
  `);

  // Normalize any legacy lowercase order statuses to Title Case
  await db.query(`
    UPDATE orders SET status = CASE
      WHEN lower(status) = 'pending'    THEN 'Pending'
      WHEN lower(status) = 'processing' THEN 'Processing'
      WHEN lower(status) = 'shipped'    THEN 'Shipped'
      WHEN lower(status) = 'completed'  THEN 'Completed'
      WHEN lower(status) = 'cancelled'  THEN 'Cancelled'
      ELSE status
    END
    WHERE status != initcap(lower(status))
  `);

  // ── Indices ──────────────────────────────────────────────────────────────
  // Every list/report query filters by company_id (multi-tenant scoping) and
  // these FK columns are joined constantly — neither had an index before,
  // meaning every one of those queries was a sequential scan.
  await db.query(`CREATE INDEX IF NOT EXISTS idx_employees_company_id      ON employees(company_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_products_company_id      ON products(company_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_customers_company_id     ON customers(company_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_suppliers_company_id     ON suppliers(company_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_system_logs_company_id   ON system_logs(company_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON notifications(company_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_orders_company_id        ON orders(company_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_orders_customer_id       ON orders(customer_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_order_items_order_id     ON order_items(order_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_order_items_product_id   ON order_items(product_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_payments_order_id        ON payments(order_id)`);
};

// Public contact form submissions (marketing site) — not company-scoped,
// since the submitter isn't necessarily logged in or tied to any company.
const addContactMessages = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name  TEXT NOT NULL,
      email      TEXT NOT NULL,
      company    TEXT,
      message    TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status)`);
};

// Lets a super_admin suspend a company (e.g. non-payment, ToS violation)
// without permanently deleting its data - the only other lever available
// before this was destroy-everything.
const addCompanyStatus = async () => {
  await db.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true`);
};

// Lets a super_admin actually respond to a contact message from within the
// app instead of just viewing/deleting it. reply_message + replied_at record
// what was sent; replied_by_name is denormalized (like system_logs.user_name)
// so the record survives even if the admin account is later deleted.
const addContactReplies = async () => {
  await db.query(`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS reply_message TEXT`);
  await db.query(`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP`);
  await db.query(`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS replied_by_name TEXT`);
};

// Ordered, one-time migrations. Add new entries here going forward — each
// runs exactly once, ever, tracked by name in schema_migrations.
const MIGRATIONS = [
  { name: "001_legacy_bootstrap", run: legacyBootstrap },
  { name: "002_contact_messages", run: addContactMessages },
  { name: "003_company_status", run: addCompanyStatus },
  { name: "004_contact_replies", run: addContactReplies },
];

const migrate = async () => {
  try {
    await ensureMigrationsTable();
    const applied = await db.query("SELECT name FROM schema_migrations");
    const appliedNames = new Set(applied.rows.map((r) => r.name));

    for (const { name, run } of MIGRATIONS) {
      if (appliedNames.has(name)) continue;
      await run();
      await db.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
      console.log(`✅ Migration applied: ${name}`);
    }

    console.log("✅ Database migrations complete");
  } catch (err) {
    console.error("❌ Migration error:", err.message);
  }
};

module.exports = migrate;
