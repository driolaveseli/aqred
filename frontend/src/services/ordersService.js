import api from "./api";

export const getOrders = (params) => api.get("/orders", { params });
export const getOrderById = (id) => api.get(`/orders/${id}`);
export const getOrderItems = (id) => api.get(`/orders/${id}/items`);
export const createOrder = (data) => api.post("/orders", data);
export const updateOrder = (id, data) => api.put(`/orders/${id}`, data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`);
