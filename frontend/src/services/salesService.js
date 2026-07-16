import api from "./api";

export const getSales = (params) => api.get("/sales", { params });
export const getSaleById = (id) => api.get(`/sales/${id}`);
export const createSale = (data) => api.post("/sales", data);
export const updateSaleStatus = (id, status) => api.patch(`/sales/${id}/status`, { status });
export const getSalesReport = (range) => api.get("/sales/report", { params: { range } });
export const getRevenueAnalytics = (range) => api.get("/sales/revenue-analytics", { params: { range } });
