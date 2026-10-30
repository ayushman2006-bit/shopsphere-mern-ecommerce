import api from './api';

export const cartService = {
  get: () => api.get('/cart').then((res) => res.data),
  add: (productId, quantity = 1) => api.post('/cart', { productId, quantity }).then((res) => res.data),
  update: (productId, quantity) => api.put(`/cart/${productId}`, { quantity }).then((res) => res.data),
  remove: (productId) => api.delete(`/cart/${productId}`).then((res) => res.data),
  clear: () => api.delete('/cart').then((res) => res.data),
  merge: (items) => api.post('/cart/merge', { items }).then((res) => res.data),
};
