import api from './api';

export const orderService = {
  create: (payload) => api.post('/orders', payload).then((res) => res.data),
  my: (params) => api.get('/orders/my', { params }).then((res) => res.data),
  get: (id) => api.get(`/orders/${id}`).then((res) => res.data),
  cancel: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }).then((res) => res.data),
};
