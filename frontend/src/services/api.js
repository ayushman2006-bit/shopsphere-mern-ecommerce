import axios from 'axios';

export const TOKEN_KEY = 'shopsphere_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthAttempt) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('shopsphere:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const getApiError = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.errors?.length) {
    return error.response.data.errors[0].message;
  }
  return error?.response?.data?.message || error?.message || fallback;
};

export default api;
