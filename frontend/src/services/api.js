import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

// Attach JWT token from localStorage as Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mis_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401; redirect to maintenance page on 503
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== "/login") {
      localStorage.removeItem("mis_user");
      localStorage.removeItem("mis_token");
      sessionStorage.removeItem("mis_user");
      window.location.href = "/login";
    } else if (
      error.response?.status === 503 &&
      error.response?.data?.code === "MAINTENANCE_MODE" &&
      window.location.pathname !== "/maintenance"
    ) {
      window.location.href = "/maintenance";
    }
    return Promise.reject(error);
  }
);

export default api;
