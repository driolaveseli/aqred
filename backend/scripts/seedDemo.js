/**
 * Demo bootstrap for `docker compose up`.
 *
 * Runs migrations, loads the sample catalogue/orders the first time, and lets
 * the two documented demo accounts sign in without the first-login password
 * change. Safe to run repeatedly - sample data only loads when the products
 * table is empty.
 *
 * Run: node scripts/seedDemo.js
 */

const { execFileSync } = require("child_process");
const path = require("path");
const migrate = require("../config/migrate");
const db = require("../config/db");

async function main() {
  await migrate();

  const { rows } = await db.query("SELECT COUNT(*)::int AS n FROM products");
  if (rows[0].n === 0) {
    console.log("Loading sample data…");
    const opts = { stdio: "inherit", cwd: path.join(__dirname, "..") };
    execFileSync(process.execPath, ["scripts/seedProducts.js"], opts);
    execFileSync(process.execPath, ["scripts/seedOrders.js"], opts);
  } else {
    console.log(`Sample data already present (${rows[0].n} products) — skipping.`);
  }

  await db.query(
    `UPDATE users SET must_change_password = false
     WHERE email IN ('admin@aqred.com', 'superadmin@aqred.com')`
  );

  console.log("Demo environment ready.");
  await db.end();
}

main().catch((err) => {
  console.error("Demo seed failed:", err.message);
  process.exit(1);
});
