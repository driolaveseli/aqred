/**
 * Emergency super-admin reset script.
 *
 * Run once from the backend directory:
 *   node scripts/resetSuperAdmin.js
 *
 * This will upsert superadmin@aqred.com with password superadmin123
 * regardless of what is currently in the database.
 */

const db     = require("../config/db");
const bcrypt = require("bcrypt");

(async () => {
  try {
    const hashed = await bcrypt.hash("superadmin123", 10);

    // Upsert: create or overwrite the canonical super-admin account
    await db.query(
      `INSERT INTO users (name, email, password, role, company_name, company_id)
       VALUES ($1, $2, $3, $4, NULL, NULL)
       ON CONFLICT (email) DO UPDATE
         SET password    = EXCLUDED.password,
             role        = EXCLUDED.role,
             company_id  = NULL,
             company_name = NULL`,
      ["Super Admin", "superadmin@aqred.com", hashed, "super_admin"]
    );

    // Print all super_admin accounts for verification
    const rows = await db.query(
      "SELECT id, name, email, role, company_id FROM users WHERE role = 'super_admin'"
    );
    console.log("✅ superadmin@aqred.com reset — password: superadmin123");
    console.log("   Super-admin accounts in DB:");
    rows.rows.forEach(r =>
      console.log(`   id=${r.id}  email=${r.email}  company_id=${r.company_id ?? "NULL (correct)"}`)
    );
  } catch (err) {
    console.error("❌ Reset failed:", err.message);
  } finally {
    process.exit(0);
  }
})();
