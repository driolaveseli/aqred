const pool = require("../config/db");

const Product = {
  getAll: (companyId) =>
    pool.query("SELECT * FROM products WHERE company_id = $1 ORDER BY id", [companyId]),
  getById: (id, companyId) =>
    pool.query("SELECT * FROM products WHERE id = $1 AND company_id = $2", [id, companyId]),
  create: (name, description, price, stock, sku, category, reorder_point, companyId) =>
    pool.query(
      "INSERT INTO products (name, description, price, stock, sku, category, reorder_point, company_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [name, description, price, stock, sku, category, reorder_point ?? 10, companyId]
    ),
  update: (id, name, description, price, stock, sku, category, reorder_point, companyId) =>
    pool.query(
      "UPDATE products SET name=$1, description=$2, price=$3, stock=$4, sku=$5, category=$6, reorder_point=$7, updated_at=NOW() WHERE id=$8 AND company_id=$9 RETURNING *",
      [name, description, price, stock, sku, category, reorder_point ?? 10, id, companyId]
    ),
  updateStock: (id, stock, companyId) =>
    pool.query(
      "UPDATE products SET stock=$1, updated_at=NOW() WHERE id=$2 AND company_id=$3 RETURNING *",
      [stock, id, companyId]
    ),
  delete: (id, companyId) =>
    pool.query("DELETE FROM products WHERE id=$1 AND company_id=$2 RETURNING *", [id, companyId]),
};

module.exports = Product;
