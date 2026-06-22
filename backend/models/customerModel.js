const pool = require("../config/db");

const Customer = {
  getAll: (companyId) =>
    pool.query("SELECT * FROM customers WHERE company_id = $1 ORDER BY id", [companyId]),
  getById: (id, companyId) =>
    pool.query("SELECT * FROM customers WHERE id = $1 AND company_id = $2", [id, companyId]),
  create: (name, email, phone, address, company, status, companyId) =>
    pool.query(
      "INSERT INTO customers (name, email, phone, address, company, status, company_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [name, email, phone, address, company, status || "Active", companyId]
    ),
  update: (id, name, email, phone, address, company, status, companyId) =>
    pool.query(
      "UPDATE customers SET name=$1, email=$2, phone=$3, address=$4, company=$5, status=$6, updated_at=NOW() WHERE id=$7 AND company_id=$8 RETURNING *",
      [name, email, phone, address, company, status || "Active", id, companyId]
    ),
  delete: (id, companyId) =>
    pool.query("DELETE FROM customers WHERE id=$1 AND company_id=$2 RETURNING *", [id, companyId]),
};

module.exports = Customer;
