const pool = require("../config/db");

const Supplier = {
  getAll: (companyId) =>
    pool.query("SELECT * FROM suppliers WHERE company_id = $1 ORDER BY id", [companyId]),

  getById: (id, companyId) =>
    pool.query("SELECT * FROM suppliers WHERE id = $1 AND company_id = $2", [id, companyId]),

  create: (company_name, contact_person, email, phone, location, category, status, products_supplied, companyId) =>
    pool.query(
      `INSERT INTO suppliers (company_name, contact_person, email, phone, location, category, status, products_supplied, company_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [company_name, contact_person, email, phone, location, category, status || "Active", products_supplied || "", companyId]
    ),

  update: (id, company_name, contact_person, email, phone, location, category, status, products_supplied, companyId) =>
    pool.query(
      `UPDATE suppliers
       SET company_name=$1, contact_person=$2, email=$3, phone=$4, location=$5,
           category=$6, status=$7, products_supplied=$8
       WHERE id=$9 AND company_id=$10 RETURNING *`,
      [company_name, contact_person, email, phone, location, category, status || "Active", products_supplied || "", id, companyId]
    ),

  delete: (id, companyId) =>
    pool.query("DELETE FROM suppliers WHERE id=$1 AND company_id=$2 RETURNING *", [id, companyId]),
};

module.exports = Supplier;
