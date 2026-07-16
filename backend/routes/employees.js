const router = require("express").Router();
const employeeController = require("../controllers/employeeController");

// Read-only: this predates the Staff module (which now owns employee create/
// update/delete via /api/staff) and is kept only because EmployeeReports.jsx
// still reads through it for the read-only reports view.
router.get("/",       employeeController.getEmployees);
router.get("/:id",    employeeController.getEmployeeById);

module.exports = router;
