const Supplier = require("../models/supplierModel");

const getSuppliers = async (req, res) => {
  try {
    const result = await Supplier.getAll(req.user.company_id);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSupplierById = async (req, res) => {
  try {
    const result = await Supplier.getById(req.params.id, req.user.company_id);
    if (!result.rows[0]) return res.status(404).json({ error: "Supplier not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createSupplier = async (req, res) => {
  const { company_name, contact_person, email, phone, location, category, status, products_supplied } = req.body;
  if (!company_name) return res.status(400).json({ error: "Company name is required" });
  try {
    const result = await Supplier.create(company_name, contact_person, email, phone, location, category, status, products_supplied, req.user.company_id);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateSupplier = async (req, res) => {
  const { company_name, contact_person, email, phone, location, category, status, products_supplied } = req.body;
  try {
    const result = await Supplier.update(req.params.id, company_name, contact_person, email, phone, location, category, status, products_supplied, req.user.company_id);
    if (!result.rows[0]) return res.status(404).json({ error: "Supplier not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const result = await Supplier.delete(req.params.id, req.user.company_id);
    if (!result.rows[0]) return res.status(404).json({ error: "Supplier not found" });
    res.json({ message: "Supplier deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier };
