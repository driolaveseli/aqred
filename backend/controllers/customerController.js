const Customer = require("../models/customerModel");
const { logEvent } = require("../utils/logger");
const { createNotification } = require("../utils/notify");

const getCustomers = async (req, res) => {
  try {
    const page  = parseInt(req.query.page, 10)  || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { search = "", status = "All", sort = "name", order = "asc" } = req.query;

    const { rows, filteredTotal, stats } = await Customer.getPaged(req.user.company_id, {
      search, status, sort, order, page, limit,
    });

    res.json({
      data: rows,
      total: filteredTotal,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(filteredTotal / limit)),
      stats: {
        total: stats.total,
        activeCount: stats.active_count,
        inactiveCount: stats.inactive_count,
        pendingCount: stats.pending_count,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const result = await Customer.getById(req.params.id, req.user.company_id);
    if (!result.rows[0]) return res.status(404).json({ error: "Customer not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createCustomer = async (req, res) => {
  const { name, email, phone, address, company, status } = req.body;
  try {
    const result = await Customer.create(name, email, phone, address, company, status, req.user.company_id);
    logEvent({ module: "customers", action: "created", req,
      description: `Customer created: ${name}`, metadata: { id: result.rows[0].id } });
    createNotification({ company_id: req.user.company_id, title: "New Customer",
      message: `${name} has been added as a customer`,
      type: "info", link: "/customers" });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateCustomer = async (req, res) => {
  const { name, email, phone, address, company, status } = req.body;
  try {
    const result = await Customer.update(req.params.id, name, email, phone, address, company, status, req.user.company_id);
    if (!result.rows[0]) return res.status(404).json({ error: "Customer not found" });
    logEvent({ module: "customers", action: "updated", req,
      description: `Customer updated: ${name}`, metadata: { id: req.params.id } });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const result = await Customer.delete(req.params.id, req.user.company_id);
    if (!result.rows[0]) return res.status(404).json({ error: "Customer not found" });
    logEvent({ level: "WARNING", module: "customers", action: "deleted", req,
      description: `Customer deleted (id: ${req.params.id})`, metadata: { id: req.params.id } });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer };
