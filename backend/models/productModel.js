const pool = require("../config/db");

const SORT_COLUMNS = { name: "name", category: "category", price: "price", stock: "stock", value: "(price * stock)" };

// Used only for the paginated rows query. The stats query intentionally does NOT
// use this — stats are company-wide KPI cards (Total Value/Low Stock/Out of Stock),
// and the stock-status tabs are themselves driven by those same cards, so filtering
// stats by the active stockFilter would make cards like "Out of Stock" read 0 the
// moment "Low Stock" is selected. Matches the original client-side behavior, where
// these stats were always computed from the full unfiltered product list.
const buildFilters = (companyId, { search, category, stockFilter }) => {
  const params = [companyId];
  let where = "WHERE company_id = $1";
  if (search) {
    params.push(`%${search}%`);
    where += ` AND (name ILIKE $${params.length} OR sku ILIKE $${params.length} OR description ILIKE $${params.length})`;
  }
  if (category && category !== "All") {
    params.push(category);
    where += ` AND category = $${params.length}`;
  }
  if (stockFilter === "In Stock")     where += ` AND stock > COALESCE(reorder_point, 10)`;
  if (stockFilter === "Low Stock")    where += ` AND stock > 0 AND stock <= COALESCE(reorder_point, 10)`;
  if (stockFilter === "Out of Stock") where += ` AND stock = 0`;
  return { where, params };
};

const Product = {
  getPaged: async (companyId, { search = "", category = "All", stockFilter = "All", sort = "name", order = "asc", page = 1, limit = 20 } = {}) => {
    const { where, params } = buildFilters(companyId, { search, category, stockFilter });
    const sortCol = SORT_COLUMNS[sort] || "name";
    const sortDir = order === "desc" ? "DESC" : "ASC";
    const offset = (Math.max(1, page) - 1) * limit;

    const dataParams = [...params, limit, offset];
    const dataSql = `SELECT * FROM products ${where} ORDER BY ${sortCol} ${sortDir}, id ASC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`;
    // Filtered count — drives pagination ("Showing X-Y of N"), reflects search/category/stockFilter.
    const countSql = `SELECT COUNT(*)::int AS count FROM products ${where}`;
    // Stats — company-wide KPI cards, deliberately unfiltered (see comment above).
    const statsSql = `
      SELECT
        COUNT(*)::int AS total,
        COALESCE(SUM(price * stock), 0) AS total_value,
        COUNT(*) FILTER (WHERE stock > 0 AND stock <= COALESCE(reorder_point, 10))::int AS low_stock_count,
        COUNT(*) FILTER (WHERE stock = 0)::int AS out_of_stock_count
      FROM products WHERE company_id = $1`;
    // Distinct categories actually in use — drives the category filter/tabs so they
    // always reflect real data instead of a fixed guessed list.
    const categoriesSql = `
      SELECT DISTINCT category FROM products
      WHERE company_id = $1 AND category IS NOT NULL AND category != ''
      ORDER BY category`;

    const [dataRes, countRes, statsRes, categoriesRes] = await Promise.all([
      pool.query(dataSql, dataParams),
      pool.query(countSql, params),
      pool.query(statsSql, [companyId]),
      pool.query(categoriesSql, [companyId]),
    ]);
    return {
      rows: dataRes.rows,
      filteredTotal: countRes.rows[0].count,
      stats: statsRes.rows[0],
      categories: categoriesRes.rows.map((r) => r.category),
    };
  },
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
