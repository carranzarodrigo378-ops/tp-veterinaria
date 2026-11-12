// frontend/src/api/axiosConfig.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta:
// 1) guarda en silencio el token renovado que manda el backend
// 2) maneja tokens vencidos o errores 401

// Interceptor de respuesta
api.interceptors.response.use(
  (response) => {
    const nuevoToken = response.headers['x-renewed-token'];

    if (nuevoToken) {
      localStorage.setItem('token', nuevoToken);
    }

    return response;
  },
  (error) => {
    if (error.response?.status === 401) {

      // Identificamos si el error proviene del inicio de sesión
      const esLogin = error.config?.url?.includes('/api/auth/login-json');

      // Si es un error de login, NO cerramos la sesión ni redirigimos
      if (!esLogin) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);


export default api;