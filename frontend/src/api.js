import axios from 'axios';

// All frontend requests go through this file.
// During development, "/api" is forwarded to http://localhost:5000 by Vite.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Before every request, attach the JWT token if the user is logged in.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
