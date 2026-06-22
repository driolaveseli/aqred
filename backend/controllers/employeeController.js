const Employee = require("../models/employeeModel");
const { logEvent } = require("../utils/logger");
const { createNotification } = require("../utils/notify");

const getEmployees = async (req, res) => {
  try {
    const rows = await Employee.getAll(req.user.company_id);
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const row = await Employee.getById(req.params.id, req.user.company_id);
    if (!row) return res.status(404).json({ error: "Employee not found" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createEmployee = async (req, res) => {
  const { name, email, position, salary, department, status } = req.body;
  try {
    const row = await Employee.create({ name, email, position, salary, department, status, companyId: req.user.company_id });
    logEvent({ module: "employees", action: "created", req,
      description: `Employee created: ${name}`, metadata: { id: row.id } });
    createNotification({ company_id: req.user.company_id, title: "New Employee",
      message: `${name} has been added${position ? ` as ${position}` : ""}`,
      type: "info", link: "/employees" });
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateEmployee = async (req, res) => {
  const { name, email, position, salary, department, status } = req.body;
  try {
    const row = await Employee.update(req.params.id, { name, email, position, salary, department, status }, req.user.company_id);
    if (!row) return res.status(404).json({ error: "Employee not found" });
    logEvent({ module: "employees", action: "updated", req,
      description: `Employee updated: ${name}`, metadata: { id: req.params.id } });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const row = await Employee.delete(req.params.id, req.user.company_id);
    if (!row) return res.status(404).json({ error: "Employee not found" });
    logEvent({ level: "WARNING", module: "employees", action: "deleted", req,
      description: `Employee deleted (id: ${req.params.id})`, metadata: { id: req.params.id } });
    res.json({ message: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee };
