import axios from "axios";

// Base URL backend Flask
const API_URL = "http://127.0.0.1:5000/api";

// Buat instance axios
const api = axios.create({
  baseURL: API_URL,
});

// Interceptor: Tambahkan token ke setiap request jika ada
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Tangani error (misal token invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized! Silakan login ulang.");
      localStorage.removeItem("token");
      window.location.href = "/login"; // redirect ke login
    }
    return Promise.reject(error);
  }
);

export default api;
