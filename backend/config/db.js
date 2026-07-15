const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

for (const key of ["DB_USER", "DB_HOST", "DB_NAME", "DB_PASSWORD", "DB_PORT"]) {
  if (!process.env[key]) {
    throw new Error(`${key} is not set. Add it to backend/.env (see .env.example).`);
  }
}

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
  end: () => pool.end(),
};
