import api from "./api";

export const getLogs = (params = {}) => api.get("/logs", { params });
export const getModules = () => api.get("/logs/modules");
export const clearOldLogs = () => api.delete("/logs/old");
