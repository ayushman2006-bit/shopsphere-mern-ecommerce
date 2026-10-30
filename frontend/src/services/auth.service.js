import api from './api';

export const authService = {
  login: (payload) => api.post('/auth/login', payload).then((res) => res.data),
  register: (payload) => api.post('/auth/register', payload).then((res) => res.data),
  me: () => api.get('/auth/me').then((res) => res.data),
  updateProfile: (payload) => api.put('/auth/profile', payload).then((res) => res.data),
  changePassword: (payload) => api.put('/auth/password', payload).then((res) => res.data),
  logout: () => api.post('/auth/logout').then((res) => res.data),
};
