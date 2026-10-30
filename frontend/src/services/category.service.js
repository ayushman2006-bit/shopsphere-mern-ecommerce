import api from './api';

export const categoryService = {
  list: () => api.get('/categories').then((res) => res.data),
  get: (id) => api.get(`/categories/${id}`).then((res) => res.data),
  create: (payload) => api.post('/categories', payload).then((res) => res.data),
  update: (id, payload) => api.put(`/categories/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`/categories/${id}`).then((res) => res.data),
};
