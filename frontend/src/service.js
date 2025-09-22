import axios from "axios";

// Crear una instancia de Axios con configuración base
const API = axios.create({
  baseURL: "http://localhost:5000/api", // URL de tu backend (ajústala si usas otro puerto)
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor opcional para añadir token JWT automáticamente
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // guardaste tu JWT en localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
