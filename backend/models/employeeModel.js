const pool = require("../config/db");

const Employee = {
  getAll: async (companyId) => {
    const result = await pool.query(
      "SELECT * FROM employees WHERE company_id = $1 ORDER BY id ASC",
      [companyId]
    );
    return result.rows;
  },

  getById: async (id, companyId) => {
    const result = await pool.query(
      "SELECT * FROM employees WHERE id = $1 AND company_id = $2",
      [id, companyId]
    );
    return result.rows[0];
  },

  create: async ({ name, email, position, salary, department, status, companyId }) => {
    const result = await pool.query(
      `INSERT INTO employees (name, email, position, salary, department, status, company_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, email, position, salary, department, status || "Active", companyId]
    );
    return result.rows[0];
  },

  update: async (id, { name, email, position, salary, department, status }, companyId) => {
    const result = await pool.query(
      `UPDATE employees
       SET name=$1, email=$2, position=$3, salary=$4, department=$5, status=$6, updated_at=NOW()
       WHERE id=$7 AND company_id=$8 RETURNING *`,
      [name, email, position, salary, department, status, id, companyId]
    );
    return result.rows[0];
  },

  delete: async (id, companyId) => {
    const result = await pool.query("DELETE FROM employees WHERE id=$1 AND company_id=$2 RETURNING id", [id, companyId]);
    return result.rows[0];
  },
};

module.exports = Employee;
