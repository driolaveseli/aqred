const db = require("./db");

const migrate = async () => {
  try {
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

    // role_permissions: stores which named permissions each role has
    await db.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role VARCHAR(20) PRIMARY KEY,
        permissions JSONB NOT NULL DEFAULT '[]'
      )
    `);

    // Seed default permissions matching the original hardcoded behaviour
    const ALL_PERMS = [
      "View Dashboard","Manage Employees","Manage Customers","Manage Products",
      "Manage Orders","Manage Suppliers","View Inventory","Manage Inventory",
      "View Sales","Manage Payments","Manage Invoices","View Reports",
      "Export Reports","User Management","Manage Roles","View System Logs","System Settings"
    ];
    const existing = await db.query("SELECT COUNT(*) FROM role_permissions");
    if (parseInt(existing.rows[0].count) === 0) {
      const managerPerms = ALL_PERMS.filter(p => !["User Management","Manage Roles","View System Logs"].includes(p));
      const employeePerms = ["View Dashboard","View Sales","View Inventory","View Reports","Manage Orders","System Settings"];
      await db.query("INSERT INTO role_permissions (role, permissions) VALUES ($1,$2)", ["admin",    JSON.stringify(ALL_PERMS)]);
      await db.query("INSERT INTO role_permissions (role, permissions) VALUES ($1,$2)", ["manager",  JSON.stringify(managerPerms)]);
      await db.query("INSERT INTO role_permissions (role, permissions) VALUES ($1,$2)", ["employee", JSON.stringify(employeePerms)]);
      console.log("✅ Default role permissions seeded");
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

    // Seed super_admin role permissions (platform-level — all permissions)
    const ALL_PERMS_SA = [
      "View Dashboard","Manage Employees","Manage Customers","Manage Products",
      "Manage Orders","Manage Suppliers","View Inventory","Manage Inventory",
      "View Sales","Manage Payments","Manage Invoices","View Reports",
      "Export Reports","User Management","Manage Roles","View System Logs","System Settings",
      "Manage Companies",
    ];
    await db.query(
      "INSERT INTO role_permissions (role, permissions) VALUES ($1,$2) ON CONFLICT (role) DO NOTHING",
      ["super_admin", JSON.stringify(ALL_PERMS_SA)]
    );

    // Seed the platform-level super admin (company_id intentionally NULL)
    // Check for the specific canonical email so this runs even if an old
    // super_admin row exists with a different email/password.
    const saExists = await db.query(
      "SELECT id FROM users WHERE email = 'superadmin@aqred.com' AND role = 'super_admin' LIMIT 1"
    );
    if (saExists.rows.length === 0) {
      const bcrypt = require("bcrypt");
      const hashed = await bcrypt.hash("superadmin123", 10);
      await db.query(
        `INSERT INTO users (name, email, password, role, company_name, company_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE
           SET password = EXCLUDED.password,
               role     = EXCLUDED.role,
               company_id = NULL`,
        ["Super Admin", "superadmin@aqred.com", hashed, "super_admin", null, null]
      );
      console.log("✅ Super Admin seeded: superadmin@aqred.com / superadmin123");
    }

    // Seed a default company admin for Aqred if none exists
    const adminExists = await db.query("SELECT id FROM users WHERE role='admin' LIMIT 1");
    if (adminExists.rows.length === 0) {
      const bcrypt = require("bcrypt");
      const hashed = await bcrypt.hash("admin123", 10);
      await db.query(
        `INSERT INTO users (name, email, password, role, company_name, company_id)
         VALUES ($1, $2, $3, $4, $5, (SELECT id FROM companies WHERE name = 'Aqred'))`,
        ["Admin User", "admin@aqred.com", hashed, "admin", "Aqred"]
      );
      console.log("✅ Default company admin seeded: admin@aqred.com / admin123");
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

    console.log("✅ Database migrations complete");
  } catch (err) {
    console.error("❌ Migration error:", err.message);
  }
};

module.exports = migrate;
