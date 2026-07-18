import api from "./api";

export const submitContact = (data) => api.post("/contact", data);

// Super-admin inbox
export const getContactMessages  = () => api.get("/super-admin/contact-messages");
export const markContactRead     = (id) => api.patch(`/super-admin/contact-messages/${id}/read`);
export const replyToContactMessage = (id, message) => api.post(`/super-admin/contact-messages/${id}/reply`, { message });
export const deleteContactMessage = (id) => api.delete(`/super-admin/contact-messages/${id}`);
