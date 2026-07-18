const Product = require("../models/productModel");
const { logEvent } = require("../utils/logger");
const { createNotification } = require("../utils/notify");

const getProducts = async (req, res) => {
  try {
    const page  = parseInt(req.query.page, 10)  || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { search = "", category = "All", stockFilter = "All", sort = "name", order = "asc" } = req.query;

    const { rows, filteredTotal, stats, categories } = await Product.getPaged(req.user.company_id, {
      search, category, stockFilter, sort, order, page, limit,
    });

    res.json({
      data: rows,
      total: filteredTotal,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(filteredTotal / limit)),
      stats: {
        total: stats.total,
        totalValue: Number(stats.total_value),
        lowStockCount: stats.low_stock_count,
        outOfStockCount: stats.out_of_stock_count,
      },
      categories,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const result = await Product.getById(req.params.id, req.user.company_id);
    if (!result.rows[0]) return res.status(404).json({ error: "Product not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createProduct = async (req, res) => {
  const { name, description, price, stock, sku, category, reorder_point } = req.body;
  try {
    const result = await Product.create(name, description, price, stock, sku, category, reorder_point, req.user.company_id);
    logEvent({ module: "products", action: "created", req,
      description: `Product created: ${name}`, metadata: { id: result.rows[0].id } });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, sku, category, reorder_point } = req.body;
  try {
    const result = await Product.update(id, name, description, price, stock, sku, category, reorder_point, req.user.company_id);
    if (!result.rows[0]) return res.status(404).json({ error: "Product not found" });
    logEvent({ module: "products", action: "updated", req,
      description: `Product updated: ${name}`, metadata: { id } });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateStock = async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;
  if (stock === undefined || Number(stock) < 0) return res.status(400).json({ error: "Invalid stock value" });
  try {
    const result = await Product.updateStock(id, stock, req.user.company_id);
    if (!result.rows[0]) return res.status(404).json({ error: "Product not found" });
    logEvent({ module: "products", action: "stock_updated", req,
      description: `Stock updated for product id ${id}: ${stock} units`, metadata: { id, stock } });
    const p = result.rows[0];
    if (Number(stock) <= (p.reorder_point ?? 10)) {
      createNotification({ company_id: req.user.company_id, title: "Low Stock Alert",
        message: `${p.name} is running low — ${stock} unit(s) remaining`,
        type: "warning", link: "/inventory", requiredPermission: "View Inventory" });
    }
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Product.delete(id, req.user.company_id);
    if (!result.rows[0]) return res.status(404).json({ error: "Product not found" });
    logEvent({ level: "WARNING", module: "products", action: "deleted", req,
      description: `Product deleted (id: ${id})`, metadata: { id } });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, updateStock, deleteProduct };
