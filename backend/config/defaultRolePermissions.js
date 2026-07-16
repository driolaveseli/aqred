// Default permission sets for a newly created company's built-in roles.
// Used both by the initial migration seed and by super-admin company creation,
// so the two paths can't drift out of sync with each other.

const ALL_PERMS = [
  "View Dashboard", "Manage Employees", "Manage Customers", "Manage Products",
  "Manage Orders", "Manage Suppliers", "View Inventory", "Manage Inventory",
  "View Sales", "Manage Payments", "Manage Invoices", "View Reports",
  "Export Reports", "User Management", "Manage Roles", "View System Logs", "System Settings",
];

const MANAGER_PERMS = ALL_PERMS.filter(
  (p) => !["User Management", "Manage Roles", "View System Logs"].includes(p)
);

const EMPLOYEE_PERMS = [
  "View Dashboard", "View Sales", "View Inventory", "View Reports", "Manage Orders", "System Settings",
];

// Platform-level super_admin permissions — fixed, not company-scoped, not
// editable through the Roles & Permissions UI (which always excludes it).
const SUPER_ADMIN_PERMS = [...ALL_PERMS, "Manage Companies"];

module.exports = { ALL_PERMS, MANAGER_PERMS, EMPLOYEE_PERMS, SUPER_ADMIN_PERMS };
