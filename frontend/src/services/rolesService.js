import api from "./api";

export const getAllRolePermissions  = ()                      => api.get("/roles");
export const createRolePermissions  = (role, permissions)     => api.post("/roles", { role, permissions });
export const updateRolePermissions  = (role, permissions)     => api.put(`/roles/${role}`, { permissions });
export const deleteRolePermissions  = (role)                  => api.delete(`/roles/${role}`);
