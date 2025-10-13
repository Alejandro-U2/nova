import axios from "axios";

// Crear una instancia de Axios con configuración base
const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`, // URL de tu backend usando variable de entorno
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
