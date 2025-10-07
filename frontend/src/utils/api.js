// frontend/src/utils/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Interceptor untuk menambahkan token ke setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Interceptor untuk handle response error
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Jika token expired atau invalid
    if (error.response?.status === 401) {
      console.warn("Token expired atau invalid. Redirecting to login...");
      localStorage.removeItem("token");
      localStorage.removeItem("userName");
      localStorage.removeItem("userRole");
      
      // Redirect ke login jika tidak sedang di halaman login
      if (window.location.pathname !== "/" && window.location.pathname !== "/register") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;