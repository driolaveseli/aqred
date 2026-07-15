import api from "./api";

export const getCompanies    = ()          => api.get("/super-admin/companies");
export const createCompany   = (data)      => api.post("/super-admin/companies", data);
export const assignAdmin     = (id, data)  => api.put(`/super-admin/companies/${id}/admin`, data);
export const getCompanyUsers = (id)        => api.get(`/super-admin/companies/${id}/users`);
export const deleteCompany   = (id)        => api.delete(`/super-admin/companies/${id}`);
