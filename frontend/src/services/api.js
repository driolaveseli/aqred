import axios from "axios";

// The JWT lives only in an httpOnly cookie the server sets on login — never
// in JS-readable storage, so withCredentials is all that's needed to send it.
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// Auto-logout on 401; redirect to maintenance page on 503
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== "/login") {
      localStorage.removeItem("mis_user");
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
