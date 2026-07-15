/**
 * Seeds 300 realistic orders into mis_db for Aqred.
 * - Adds 15 extra customers (20 total) for variety
 * - Distributes statuses realistically based on order age
 * - Decrements stock only for non-Cancelled orders
 * - Auto-creates payment records for Completed orders
 * - Spreads order_date across the past 13 months for rich report data
 *
 * Run: node backend/scripts/seedOrders.js
 * Safe to re-run: customers use ON CONFLICT, orders are appended.
 */

const pool = require("../config/db");

// ── Extra customers ───────────────────────────────────────────────────────────

const EXTRA_CUSTOMERS = [
  { name: "Blerta Morina",    email: "blerta.morina@example.com",    phone: "+383 44 111 001", address: "Str. Nëna Terezë 12, Pristina",   company: "Morina LLC" },
  { name: "Granit Bytyqi",    email: "granit.bytyqi@example.com",    phone: "+383 44 111 002", address: "Str. Fehmi Agani 5, Pristina",    company: "Bytyqi & Co" },
  { name: "Fjolla Rama",      email: "fjolla.rama@example.com",      phone: "+383 44 111 003", address: "Str. Ukshin Hoti 3, Gjilan",      company: "Rama Trading" },
  { name: "Kujtim Syla",      email: "kujtim.syla@example.com",      phone: "+383 44 111 004", address: "Str. William Walker 8, Ferizaj", company: "Syla Imports" },
  { name: "Mimoza Jashari",   email: "mimoza.jashari@example.com",   phone: "+383 44 111 005", address: "Str. Skënderbeu 17, Peja",       company: "Jashari Solutions" },
  { name: "Driton Halili",    email: "driton.halili@example.com",    phone: "+383 44 111 006", address: "Str. Agim Ramadani 22, Mitrovica", company: "Halili Wholesale" },
  { name: "Shqipe Osmani",    email: "shqipe.osmani@example.com",    phone: "+383 44 111 007", address: "Str. Lidhja e Prizrenit 4, Prizren", company: "Osmani Retail" },
  { name: "Besnik Kastrati",  email: "besnik.kastrati@example.com",  phone: "+383 44 111 008", address: "Str. Dëshmorët e Kombit 9, Pristina", company: "Kastrati Group" },
  { name: "Lirie Gojani",     email: "lirie.gojani@example.com",     phone: "+383 44 111 009", address: "Str. Rexhep Luci 1, Pristina",   company: "Gojani Distributors" },
  { name: "Mentor Azemi",     email: "mentor.azemi@example.com",     phone: "+383 44 111 010", address: "Str. Eqrem Çabej 6, Gjilan",     company: "Azemi Tech" },
  { name: "Valdete Berisha",  email: "valdete.berisha@example.com",  phone: "+383 44 111 011", address: "Str. Bedri Pejani 3, Peja",      company: "Berisha Supplies" },
  { name: "Agron Krasniqi",   email: "agron.krasniqi@example.com",   phone: "+383 44 111 012", address: "Str. Adem Jashari 14, Pristina", company: "Krasniqi Corp" },
  { name: "Teuta Gashi",      email: "teuta.gashi@example.com",      phone: "+383 44 111 013", address: "Str. Zahir Pajaziti 7, Pristina", company: "Gashi Enterprises" },
  { name: "Naim Haxhiu",      email: "naim.haxhiu@example.com",      phone: "+383 44 111 014", address: "Str. UCK 33, Ferizaj",           company: "Haxhiu & Partners" },
  { name: "Albana Limani",    email: "albana.limani@example.com",    phone: "+383 44 111 015", address: "Str. Xhorxh Ueshingtoni 2, Pristina", company: "Limani Holdings" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Random date within the past `daysBack` days, biased toward recent dates */
function randDate(daysBack) {
  const msBack = Math.random() * daysBack * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - msBack);
}

/**
 * Choose a status based on how old the order is.
 * Older orders are more likely to be Completed or Cancelled.
 */
function statusForDate(date) {
  const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);

  if (daysAgo > 90) {
    return pick([
      "Completed","Completed","Completed","Completed","Completed",
      "Completed","Completed",
      "Cancelled","Cancelled",
      "Shipped",
    ]);
  }
  if (daysAgo > 30) {
    return pick([
      "Completed","Completed","Completed",
      "Shipped","Shipped","Shipped",
      "Processing","Processing",
      "Pending",
      "Cancelled",
    ]);
  }
  // < 30 days old
  return pick([
    "Completed","Completed",
    "Shipped","Shipped",
    "Processing","Processing","Processing",
    "Pending","Pending","Pending",
    "Cancelled",
  ]);
}

const PAYMENT_METHODS = [
  "Bank Transfer","Bank Transfer","Bank Transfer","Bank Transfer",
  "Cash","Cash","Cash",
  "Credit Card","Credit Card","Credit Card",
];

const NOTES = [
  "Please deliver before end of week.",
  "Fragile — handle with care.",
  "Priority order.",
  "Call before delivery.",
  "Leave at reception.",
  "Bulk discount applied.",
  "Repeat customer — VIP.",
  "Partial payment received.",
  "Urgent — next day delivery.",
  "Standard shipping.",
  null, null, null, null, null, // ~33% chance of no notes
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const client = await pool.connect();
  try {
    // ── 1. Resolve company ────────────────────────────────────────────────────
    const { rows: companyRows } = await client.query(
      "SELECT id FROM companies WHERE name = 'Aqred' LIMIT 1"
    );
    if (!companyRows.length) {
      console.error("❌  Company 'Aqred' not found. Run migrations first.");
      process.exit(1);
    }
    const companyId = companyRows[0].id;
    console.log(`✅  Company: Aqred (id=${companyId})`);

    // ── 2. Seed extra customers ───────────────────────────────────────────────
    console.log("👥  Seeding extra customers...");
    for (const c of EXTRA_CUSTOMERS) {
      await client.query(
        `INSERT INTO customers (name, email, phone, address, company, status, company_id)
         VALUES ($1,$2,$3,$4,$5,'Active',$6)
         ON CONFLICT (email) DO NOTHING`,
        [c.name, c.email, c.phone, c.address, c.company, companyId]
      );
    }

    // ── 3. Load all customers & products ─────────────────────────────────────
    const { rows: customers } = await client.query(
      "SELECT id FROM customers WHERE company_id = $1 AND status = 'Active'", [companyId]
    );
    const { rows: products } = await client.query(
      `SELECT id, price, stock FROM products WHERE company_id = $1 AND stock > 0 ORDER BY id`,
      [companyId]
    );

    console.log(`📋  ${customers.length} customers, ${products.length} products available`);

    // Track remaining stock in memory so we never over-order
    const stockMap = {};
    for (const p of products) stockMap[p.id] = parseInt(p.stock);

    // ── 4. Build and insert 300 orders ────────────────────────────────────────
    console.log("📦  Inserting 300 orders...");
    let ordersInserted = 0;
    let paymentsInserted = 0;

    await client.query("BEGIN");

    for (let i = 0; i < 300; i++) {
      const customer  = pick(customers);
      const orderDate = randDate(395); // up to ~13 months back
      const status    = statusForDate(orderDate);
      const dueDate   = new Date(orderDate.getTime() + randInt(14, 45) * 24 * 60 * 60 * 1000);
      const note      = pick(NOTES);

      // Pick 1–5 distinct products that have enough remaining stock
      const itemCount     = randInt(1, 5);
      const eligible      = products.filter(p => stockMap[p.id] >= 1);
      if (eligible.length === 0) {
        console.warn(`  ⚠️  No eligible products left at order ${i + 1}, skipping`);
        continue;
      }

      // Shuffle eligible and take up to itemCount
      const shuffled = eligible.sort(() => Math.random() - 0.5).slice(0, itemCount);

      const items = shuffled.map(p => {
        const maxQty = Math.min(stockMap[p.id], randInt(1, 8));
        const qty    = randInt(1, maxQty);
        return { product_id: p.id, quantity: qty, unit_price: parseFloat(p.price) };
      });

      const total = items.reduce((s, it) => s + it.quantity * it.unit_price, 0);

      // Insert order
      const { rows: [order] } = await client.query(
        `INSERT INTO orders
           (customer_id, status, total, notes, order_date, due_date, company_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [customer.id, status, total.toFixed(2), note, orderDate, dueDate, companyId]
      );

      // Insert order items
      for (const it of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
           VALUES ($1,$2,$3,$4)`,
          [order.id, it.product_id, it.quantity, it.unit_price]
        );

        // Decrement stock for all non-Cancelled orders
        if (status !== "Cancelled") {
          await client.query(
            `UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2`,
            [it.quantity, it.product_id]
          );
          stockMap[it.product_id] = Math.max(0, stockMap[it.product_id] - it.quantity);
        }
      }

      // Auto-create payment record for Completed orders
      if (status === "Completed" && total > 0) {
        const method      = pick(PAYMENT_METHODS);
        // Payment date is 0–7 days after order date
        const paymentDate = new Date(orderDate.getTime() + randInt(0, 7) * 24 * 60 * 60 * 1000);
        await client.query(
          `INSERT INTO payments (order_id, amount, method, status, notes, payment_date)
           VALUES ($1,$2,$3,'Completed',$4,$5)`,
          [order.id, total.toFixed(2), method, `Payment for order #${String(order.id).padStart(4,"0")}`, paymentDate]
        );
        paymentsInserted++;
      }

      ordersInserted++;
    }

    await client.query("COMMIT");

    // ── 5. Summary ────────────────────────────────────────────────────────────
    console.log(`\n✅  Done!`);
    console.log(`   Orders inserted : ${ordersInserted}`);
    console.log(`   Payments created: ${paymentsInserted}`);

    const { rows: statusSummary } = await client.query(
      `SELECT status, COUNT(*) AS count
       FROM orders WHERE company_id = $1
       GROUP BY status ORDER BY count DESC`, [companyId]
    );
    console.log("\n📊  Order status breakdown:");
    for (const r of statusSummary) console.log(`   ${r.status.padEnd(12)} ${r.count}`);

    const { rows: [totals] } = await client.query(
      `SELECT COUNT(*) AS orders, COALESCE(SUM(total),0)::numeric(12,2) AS revenue
       FROM orders WHERE company_id = $1 AND status != 'Cancelled'`, [companyId]
    );
    console.log(`\n💰  Active orders: ${totals.orders}  |  Total revenue: $${totals.revenue}`);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌  Error:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
