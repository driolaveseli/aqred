// frontend/src/services/employeesService.js
import api from "./api";

// Read-only: employee create/update/delete lives in staffService.js (Staff.jsx).
export const getEmployees = () => api.get("/employees");
