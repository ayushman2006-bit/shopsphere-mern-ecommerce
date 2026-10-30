import api from './api';

export const wishlistService = {
  get: () => api.get('/wishlist').then((res) => res.data),
  add: (productId) => api.post(`/wishlist/${productId}`).then((res) => res.data),
  remove: (productId) => api.delete(`/wishlist/${productId}`).then((res) => res.data),
  moveToCart: (productId) => api.post(`/wishlist/${productId}/move-to-cart`).then((res) => res.data),
};
