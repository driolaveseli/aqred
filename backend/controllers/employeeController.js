const Employee = require("../models/employeeModel");

// Read-only: employee create/update/delete now lives at /api/staff (Staff.jsx),
// which manages the user account and HR record together. This controller is
// kept only for the read-only EmployeeReports.jsx view.

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

module.exports = { getEmployees, getEmployeeById };
