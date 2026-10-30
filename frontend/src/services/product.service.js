import api from './api';

export const productService = {
  list: (params) => api.get('/products', { params }).then((res) => res.data),
  get: (id) => api.get(`/products/${id}`).then((res) => res.data),
  related: (id) => api.get(`/products/${id}/related`).then((res) => res.data),
  meta: () => api.get('/products/meta/filters').then((res) => res.data),
  create: (formData) =>
    api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((res) => res.data),
  update: (id, formData) =>
    api.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((res) => res.data),
  updateStock: (id, payload) => api.patch(`/products/${id}/stock`, payload).then((res) => res.data),
  remove: (id) => api.delete(`/products/${id}`).then((res) => res.data),
};
