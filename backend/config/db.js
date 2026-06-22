const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "mis_db",
  password: "REDACTED_ROTATED_CREDENTIAL",
  port: 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
};
