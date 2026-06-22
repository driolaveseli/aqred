const db = require("./config/db");

const seed = async () => {
  await db.query(
    `INSERT INTO products (name, price, stock) VALUES ('Test Product', 10.00, 5)`,
  );
  console.log("Database seeded!");
};

seed();
